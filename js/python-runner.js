/**
 * 🐍 Python 浏览器端执行核心 - 主线程通信层
 *
 * Pyodide 运行在 Web Worker 中：
 *   - stdout 由 Worker 批量回传，终端限制最大行数，避免海量输出卡死页面
 *   - input() 通过 SharedArrayBuffer + Atomics.wait 阻塞 Worker 线程，
 *     主线程事件循环不受影响，实现命令行式实时输入
 *   - 支持「停止」中断（setInterruptBuffer / SIGINT）
 */
const PythonRunner = (() => {
  const NL = '\n';
  const MAX_TERM_LINES = 1000;     // 终端最多保留的行数
  const TRIM_CHUNK = 200;          // 超出上限时一次裁剪的行数
  const READY_TIMEOUT_MS = 30000;  // 等待引擎就绪的超时时间
  const SAB_SIZE = 258;            // [0]=signal [1]=length [2..257]=chars

  let worker = null;
  let isReady = false;
  let isRunning = false;
  let runSeq = 0;                // 本次打开页面跑了几次（用于输出分隔线）
  let runOutputText = "";        // 本轮运行的输出（成长档案要用）
  let runTurtle = false;         // 本轮是否用了海龟
  let runPackages = [];          // 本轮加载过的第三方库
  let stepMode = false;          // 单步模式开关
  let waitingForStep = false;    // 是否正停在某一行等孩子点「下一步」
  let stdoutLineBuf = "";
  let inputSab = null;
  let inputBuf = null;
  let interruptSab = null;
  let interruptBuf = null;
  let readyWaitTimer = null;
  let stopFallbackTimer = null;
  let scrollScheduled = false;
  let longRunTimer = null;      // 长时间运行的提醒计时器
  const LONG_RUN_MS = 12000;    // 超过 12 秒提醒一次
  let suppressOutput = false;   // 停止后抑制残留输出（例如 Python traceback）

  // ================= 虚拟文件系统（open() 写出的数据文件）=================
  const VFS_KEY = "codepanda_vfs_v1";
  let lastVfsSignature = "";

  function loadVfs() {
    try {
      const raw = localStorage.getItem(VFS_KEY);
      const list = raw ? JSON.parse(raw) : [];
      return Array.isArray(list) ? list : [];
    } catch (e) {
      return [];
    }
  }

  function saveVfs(files) {
    try {
      localStorage.setItem(VFS_KEY, JSON.stringify(files || []));
      return true;
    } catch (e) {
      // 存储配额满：不影响运行，只提示一次
      console.warn("数据文件保存失败（存储空间可能已满）", e);
      return false;
    }
  }

  // ================= 初始化 =================
  function init() {
    if (worker) return;
    updateStatus("loading", "正在召唤 Python 3.12 魔法引擎... ✨");

    try {
      inputSab = new SharedArrayBuffer(SAB_SIZE * 4);
      inputBuf = new Int32Array(inputSab);
      interruptSab = new SharedArrayBuffer(8);   // [0]=SIGINT 信号, [1]=用户停止标志
      interruptBuf = new Int32Array(interruptSab);
    } catch (e) {
      updateStatus("error", "⚠️ 浏览器不支持 SharedArrayBuffer，请升级浏览器");
      return;
    }

    startWorker();
    bindStopButton();
    bindStepButtons();
  }

  function startWorker() {
    // 版本号要和 index.html 里的 ?v= 保持一致：CDN 会缓存 /js/*，换版本号才能真正刷新
    worker = new Worker('js/python-worker.js?v=20260912d');
    worker.addEventListener('message', handleWorkerMessage);
    worker.addEventListener('error', (e) => {
      console.error('Worker error:', e);
      updateStatus("error", "⚠️ Python 引擎遇到异常");
      if (isRunning) {
        appendLog("error", "❌ Python 引擎出现异常，请点击「运行代码」重试");
        finishRun();
      }
    });

    worker.postMessage({ type: 'init', sab: inputSab, interruptSab: interruptSab, vfs: loadVfs() });
  }

  // 引擎无响应时的兜底：重建 Worker（会重新加载 Pyodide）
  function resetWorker() {
    if (worker) {
      try { worker.terminate(); } catch (e) {}
      worker = null;
    }
    isReady = false;
    isRunning = false;
    setRunButtonState(false);
    hideTerminalInput();
    updateStatus("loading", "正在重新启动 Python 引擎... ✨");
    startWorker();
  }

  // ================= 单步调试 =================
  function setStepMode(on, silent) {
    stepMode = !!on;
    const btn = document.getElementById("btnStepMode");
    if (btn) btn.classList.toggle("active", stepMode);
    const bar = document.getElementById("stepBar");
    if (bar) bar.style.display = stepMode ? "flex" : "none";
    const hint = document.getElementById("stepHint");
    if (hint && !waitingForStep) {
      hint.textContent = stepMode ? "🐾 单步模式已打开：点「运行代码」开始逐行执行" : "";
    }
    // 运行途中关掉单步：直接放行，别把孩子卡住
    if (!stepMode && waitingForStep) resumeStep(true);
    if (!silent) {
      appendLog("system", stepMode ? "🐾 单步模式已打开：程序会一行一行停下来" : "🐾 单步模式已关闭，代码会一次跑完");
    }
  }

  // 放行：advanceAll = true 表示不再逐行暂停
  function resumeStep(advanceAll) {
    if (!waitingForStep || !inputBuf) return;
    waitingForStep = false;
    Atomics.store(inputBuf, 1, 0);
    Atomics.store(inputBuf, 0, advanceAll ? 2 : 1);
    Atomics.notify(inputBuf, 0, 1);
  }

  function clearStepUi() {
    waitingForStep = false;
    if (typeof CodeEditor !== "undefined" && CodeEditor.clearRunningLine) CodeEditor.clearRunningLine();
    const hint = document.getElementById("stepHint");
    if (hint) hint.textContent = stepMode ? "🐾 单步模式已打开：点「运行代码」开始逐行执行" : "🐾 单步模式准备中…";
  }

  // 把本轮运行结果写进「成长档案」，并播报新通关/新徽章
  function reportProgress(success) {
    if (typeof Progress === "undefined" || !Progress.recordRun) return;
    try {
      const code = (typeof CodeEditor !== "undefined" && CodeEditor.getValue) ? CodeEditor.getValue() : "";
      const res = Progress.recordRun({
        code: code,
        output: runOutputText,
        success: !!success,
        turtle: runTurtle,
        packages: runPackages.slice()
      }) || {};
      const missions = res.newMissions || [];
      const badges = res.newBadges || [];
      missions.forEach(m => appendLog("success", "🎉 闯关成功【" + m.title + "】" + m.emoji + " 点右上角 🌟 成长 看看"));
      badges.forEach(b => appendLog("success", "🏅 获得新徽章【" + b.title + "】" + b.emoji));
      if (missions.length || badges.length) {
        try { ConfettiFX.celebrate(); } catch (e) {}
        try { if (window.App && window.App.showToast) window.App.showToast("🎉 有新成就啦！", "🌟"); } catch (e) {}
      }
    } catch (e) {
      console.warn("成长档案记录失败", e);
    }
  }

  // ================= 终端：只看程序输出（隐藏平台提示） =================
  const HIDE_SYSTEM_KEY = "codepanda_hide_system";

  function applySystemVisibility() {
    const terminal = document.getElementById("terminalLogs");
    if (!terminal) return;
    let hide = false;
    try { hide = localStorage.getItem(HIDE_SYSTEM_KEY) === "1"; } catch (e) {}
    terminal.classList.toggle("hide-system", hide);
    const btn = document.getElementById("btnToggleSystem");
    if (btn) {
      btn.textContent = hide ? "👀" : "🙈";
      btn.classList.toggle("active", hide);
      btn.title = hide ? "现在只显示程序输出，点一下恢复平台提示" : "隐藏平台提示，只看程序输出";
    }
  }

  function toggleSystemVisibility() {
    let hide = false;
    try { hide = localStorage.getItem(HIDE_SYSTEM_KEY) === "1"; } catch (e) {}
    try { localStorage.setItem(HIDE_SYSTEM_KEY, hide ? "0" : "1"); } catch (e) {}
    applySystemVisibility();
    appendLog("system", hide ? "👀 已恢复显示平台提示" : "🙈 平台提示已收起，只显示程序输出（报错和警告仍会保留）");
  }

  function bindStepButtons() {
    const btnMode = document.getElementById("btnStepMode");
    if (btnMode) {
      btnMode.addEventListener("click", () => setStepMode(!stepMode));
    }
    const btnNext = document.getElementById("btnStepNext");
    if (btnNext) {
      btnNext.addEventListener("click", () => resumeStep(false));
    }
    const btnRun = document.getElementById("btnStepRun");
    if (btnRun) {
      btnRun.addEventListener("click", () => {
        appendLog("system", "⏭ 好，让程序一路跑完~");
        resumeStep(true);
      });
    }
    const bar = document.getElementById("stepBar");
    if (bar) bar.style.display = "none";

    const btnToggleSystem = document.getElementById("btnToggleSystem");
    if (btnToggleSystem) {
      btnToggleSystem.addEventListener("click", toggleSystemVisibility);
    }
    applySystemVisibility();
  }

  function bindStopButton() {
    const btn = document.getElementById("btnStopCode");
    if (btn && !btn.dataset.bound) {
      btn.dataset.bound = "1";
      btn.addEventListener("click", stopCode);
    }
  }

  // ================= Worker 消息处理 =================
  function handleWorkerMessage(event) {
    const data = event.data;

    // 兼容纯字符串 stdout
    if (typeof data === 'string') {
      let parsed = null;
      try { parsed = JSON.parse(data); } catch (e) { /* 非 JSON，按 stdout 处理 */ }
      if (parsed && parsed.type) {
        handleTypedMessage(parsed);
      } else {
        handleStdout(data);
      }
      return;
    }

    if (data && typeof data === 'object' && data.type) {
      handleTypedMessage(data);
    }
  }

  function handleTypedMessage(data) {
    switch (data.type) {
      case 'ready':
        isReady = true;
        updateStatus("ready", "🟢 Python 3.12 魔法就绪！");
        break;

      case 'stdout-batch':
        if (suppressOutput) { stdoutLineBuf = ""; break; }
        runOutputText += (data.text || "");
        if (runOutputText.length > 4000) runOutputText = runOutputText.slice(-4000);
        handleStdout(data.text || "");
        break;

      case 'step':
        // 单步模式：程序停在第 data.line 行，等孩子点「下一步」
        waitingForStep = true;
        switchTabSafe("console");
        if (typeof CodeEditor !== "undefined" && CodeEditor.markRunningLine) {
          CodeEditor.markRunningLine(data.line);
        }
        const stepHint = document.getElementById("stepHint");
        if (stepHint) stepHint.textContent = "🐾 正停在第 " + data.line + " 行，点「下一步 ▶」继续";
        const stepBarEl = document.getElementById("stepBar");
        if (stepBarEl) stepBarEl.style.display = "flex";
        break;

      case 'input':
        // Python 请求输入 — 显示终端输入行（命令行式，不弹窗）
        if (data.prompt) appendLog("prompt", "👉 " + data.prompt);
        showTerminalInput();
        break;

      case 'turtle-detect':
        runTurtle = true;
        if (typeof TurtleEngine !== 'undefined') TurtleEngine.reset();
        switchTabSafe("turtle");
        appendLog("system", "🐢 侦测到海龟绘图！已自动切换到【海龟画布】视窗~");
        break;

      case 'packages-loading':
        appendLog("system", "📦 正在准备小帮手：" + (data.names || []).join("、") + " ...（第一次会慢一点）");
        break;

      case 'package-ok':
        if (runPackages.indexOf(data.name) === -1) runPackages.push(data.name);
        appendLog("system", "✅ " + data.name + " 准备就绪！");
        break;

      case 'package-fail':
        appendLog("warning", "⚠️ 没能取到工具箱「" + data.name + "」" + (data.reason ? "：" + data.reason : ""));
        appendLog("system", "💡 numpy 已经内置，可以直接用；其它工具箱第一次使用需要联网下载，网络不好时就会失败，过一会儿再运行一次试试吧~");
        break;

      case 'vars':
        renderVariableTelescope(data.list || []);
        break;

      // open() 写出的数据文件：变化时才落盘并提示，避免刷屏
      case 'vfs-save': {
        const files = data.files || [];
        const sig = files.map(f => f.path + ":" + (f.text || "").length).sort().join("|");
        if (sig !== lastVfsSignature) {
          lastVfsSignature = sig;
          saveVfs(files);
          if (files.length) {
            appendLog("system", "💾 你的数据文件已保存：" + files.map(f => f.path).join("、") + "（下次运行还在哦）");
          }
          if (typeof Progress !== "undefined" && Progress.recordVfs) {
            const res = Progress.recordVfs(files.length) || {};
            if (res.newMission) appendLog("success", "🎉 闯关成功【" + res.newMission.title + "】" + res.newMission.emoji);
            (res.newBadges || []).forEach(b => appendLog("success", "🏅 获得新徽章【" + b.title + "】" + b.emoji));
          }
        }
        break;
      }

      // 打开页面时找回了上次的数据文件
      case 'vfs-restored':
        appendLog("system", "📂 已找回上次保存的数据文件：" + (data.names || []).join("、"));
        break;

      case 'turtle':
        executeTurtle(data);
        break;

      case 'done':
        clearInterrupt();
        suppressOutput = false;
        clearStepUi();
        flushStdoutBuffer();
        finishRun();
        appendLog("success", "✨ 代码运行成功！🎉");
        reportProgress(true);
        // 记录「上次成功运行」的代码，便于孩子改坏后一键复原
        try { if (window.App && window.App.saveSnapshot) window.App.saveSnapshot(); } catch (e) {}
        try { ConfettiFX.celebrate(); } catch (e) {}
        break;

      case 'stopped':
        clearInterrupt();
        suppressOutput = false;
        clearStepUi();
        flushStdoutBuffer();
        finishRun();
        appendLog("system", "⏹ 已停止运行");
        break;

      case 'error': {
        clearInterrupt();
        suppressOutput = false;
        clearStepUi();
        flushStdoutBuffer();
        finishRun();
        const text = data.text || "";
        if (text.indexOf("KeyboardInterrupt") !== -1) {
          // 用户主动停止，不显示「小侦探」报错卡片
          appendLog("system", "⏹ 已停止运行");
          break;
        }
        reportProgress(false);
        handleRuntimeError(text, data.line || 0, data.codeLine || "");
        try { SoundEffects.playWarning(); } catch (e) {}
        break;
      }
    }
  }

  function executeTurtle(data) {
    const engine = typeof TurtleEngine !== 'undefined' ? TurtleEngine : null;
    if (!engine || !data.method) return;
    const fn = engine[data.method];
    if (typeof fn === 'function') {
      try { fn.apply(engine, data.args || []); } catch (e) {}
    }
  }

  // ================= 停止 / 中断 =================
  function stopCode() {
    if (!isRunning) return;

    // 停止后抑制残留输出（例如中断时 Python 打印的 traceback）
    suppressOutput = true;

    // 1) 若正阻塞在 input() 等待中，写入空输入解除阻塞
    const inputLine = document.getElementById("terminalInputLine");
    const waitingInput = inputLine && inputLine.style.display !== "none";
    if (waitingInput && inputBuf) {
      Atomics.store(inputBuf, 1, 0);
      Atomics.store(inputBuf, 0, 1);
      Atomics.notify(inputBuf, 0, 1);
    }

    // 2) 标记「用户主动停止」并向 Pyodide 发送 SIGINT（2 = 中断）
    if (interruptBuf) {
      Atomics.store(interruptBuf, 1, 1);   // 停止标志（Pyodide 不会自行清零它）
      Atomics.store(interruptBuf, 0, 2);   // SIGINT
    }

    hideTerminalInput();
    appendLog("system", "⏹ 已请求停止…");

    // 3) 兜底：2 秒内仍未返回结果，则重建 Worker
    if (stopFallbackTimer) clearTimeout(stopFallbackTimer);
    stopFallbackTimer = setTimeout(() => {
      stopFallbackTimer = null;
      if (isRunning) {
        appendLog("warning", "⚠️ 程序没有响应，正在强制重启引擎…");
        resetWorker();
      }
    }, 2000);
  }

  function clearInterrupt() {
    if (interruptBuf) {
      Atomics.store(interruptBuf, 0, 0);
      Atomics.store(interruptBuf, 1, 0);
    }
    if (stopFallbackTimer) {
      clearTimeout(stopFallbackTimer);
      stopFallbackTimer = null;
    }
  }

  function flushStdoutBuffer() {
    if (stdoutLineBuf) {
      appendLog("stdout", stdoutLineBuf);
      stdoutLineBuf = "";
    }
  }

  // ================= 终端输入（命令行式） =================
  function submitTerminalInput() {
    const input = document.getElementById("terminalInput");
    if (!input) return;
    const val = input.value;
    hideTerminalInput();
    appendLog("echo", "❯ " + val);

    if (inputBuf) {
      const len = Math.min(val.length, 256);
      for (let i = 0; i < len; i++) {
        Atomics.store(inputBuf, 2 + i, val.charCodeAt(i));
      }
      Atomics.store(inputBuf, 1, len);
      Atomics.store(inputBuf, 0, 1);
      Atomics.notify(inputBuf, 0, 1);
    }
  }

  // ================= 运行代码 =================
  function runCode(code) {
    if (isRunning) {
      if (window.App && window.App.showToast) {
        window.App.showToast("⏳ 代码还在运行中，先等一下或点「停止」哦~", "🐢");
      }
      return;
    }

    if (!worker) init();

    isRunning = true;
    runOutputText = "";
    runTurtle = false;
    runPackages = [];
    setRunButtonState(true);
    stdoutLineBuf = "";
    suppressOutput = false;
    clearInterrupt();

    // 复位输入信号，避免上一次「停止」残留的信号让 input() 直接返回
    if (inputBuf) {
      Atomics.store(inputBuf, 0, 0);
      Atomics.store(inputBuf, 1, 0);
    }
    if (interruptBuf) {
      Atomics.store(interruptBuf, 0, 0);
      Atomics.store(interruptBuf, 1, 0);
    }

    const terminal = document.getElementById("terminalLogs");
    if (terminal) terminal.innerHTML = "";
    hideTerminalInput();
    runSeq += 1;
    appendLog("run", "🚀 第 " + runSeq + " 次运行");

    // 每次运行前清空海龟画布，避免上一次的画作残留
    if (typeof TurtleEngine !== 'undefined') TurtleEngine.reset();

    const hasTurtle = /import[\s]+turtle|from[\s]+turtle/i.test(code);
    if (hasTurtle) {
      switchTabSafe("turtle");
    } else {
      switchTabSafe("console");
    }

    // 长时间运行提醒（例如忘记写结束条件的循环）
    if (longRunTimer) clearTimeout(longRunTimer);
    longRunTimer = setTimeout(() => {
      longRunTimer = null;
      if (isRunning) {
        appendLog("warning", "⏳ 代码已经跑了一会儿啦，如果它停不下来，可以点上方红色「⏹ 停止」按钮");
      }
    }, LONG_RUN_MS);

    if (isReady) {
      worker.postMessage({ type: 'run', code: code, stepping: stepMode });
      return;
    }

    // 引擎尚未就绪：轮询等待，并设置超时兜底
    appendLog("warning", "⏳ 正在连接 Python 运行环境，初次加载约需数秒，请稍候...");
    const deadline = Date.now() + READY_TIMEOUT_MS;
    const trySend = () => {
      readyWaitTimer = null;
      if (!isRunning) return;             // 期间被停止
      if (isReady && worker) {
        worker.postMessage({ type: 'run', code: code, stepping: stepMode });
        return;
      }
      if (Date.now() > deadline) {
        appendLog("error", "❌ Python 引擎加载超时，请检查网络后刷新页面重试");
        finishRun();
        return;
      }
      readyWaitTimer = setTimeout(trySend, 200);
    };
    trySend();
  }

  // 🔭 变量望远镜：展示运行后的变量名与值，帮助孩子理解「变量」
  function renderVariableTelescope(list) {
    if (!list || !list.length) return;
    const terminal = document.getElementById("terminalLogs");
    if (!terminal) return;

    const card = document.createElement("div");
    card.className = "vars-card";

    let rows = "";
    for (const v of list) {
      rows += '<div class="vars-row"><span class="vars-name">' + escapeHtml(v.name) + '</span>' +
              '<span class="vars-eq">=</span>' +
              '<span class="vars-value">' + escapeHtml(v.value) + '</span>' +
              '<span class="vars-type">' + escapeHtml(v.type) + '</span></div>';
    }

    card.innerHTML = '<div class="vars-header">🔭 变量望远镜：这次运行记住了这些小伙伴</div>' +
                     '<div class="vars-body">' + rows + '</div>';
    terminal.appendChild(card);
    scheduleScroll();
  }

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, c => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
    })[c]);
  }

  // ================= 终端渲染 =================
  function handleStdout(s) {
    stdoutLineBuf += s;
    let idx;
    while ((idx = stdoutLineBuf.indexOf(NL)) !== -1) {
      const line = stdoutLineBuf.slice(0, idx);
      stdoutLineBuf = stdoutLineBuf.slice(idx + 1);
      appendLog("stdout", line);
    }
  }

  function appendLog(type, text) {
    const terminal = document.getElementById("terminalLogs");
    if (!terminal) return;
    const div = document.createElement("div");
    div.className = 'term-line ' + type;
    div.textContent = text;
    terminal.appendChild(div);

    // 限制终端最大行数，避免大量输出把 DOM 撑爆
    if (terminal.childElementCount > MAX_TERM_LINES) {
      for (let i = 0; i < TRIM_CHUNK && terminal.firstChild; i++) {
        terminal.removeChild(terminal.firstChild);
      }
    }
    scheduleScroll();
  }

  // 滚动合并到每帧一次，避免逐行读写 scrollHeight 造成的布局抖动
  function scheduleScroll() {
    if (scrollScheduled) return;
    scrollScheduled = true;
    requestAnimationFrame(() => {
      scrollScheduled = false;
      const terminal = document.getElementById("terminalLogs");
      if (terminal) terminal.scrollTop = terminal.scrollHeight;
    });
  }

  function updateStatus(state, text) {
    const dot = document.getElementById("statusDot");
    const label = document.getElementById("statusText");
    if (!dot || !label) return;
    dot.className = "status-dot " + (state === "ready" ? "" : state);
    label.textContent = text;
  }

  function showTerminalInput() {
    const inputLine = document.getElementById("terminalInputLine");
    const input = document.getElementById("terminalInput");
    if (inputLine && input) {
      inputLine.style.display = "flex";
      input.value = "";
      input.focus();
    }
  }

  function hideTerminalInput() {
    const inputLine = document.getElementById("terminalInputLine");
    if (inputLine) inputLine.style.display = "none";
  }

  function setRunButtonState(running) {
    const btn = document.getElementById("btnRunCode");
    const label = document.getElementById("runBtnLabel");
    const stopBtn = document.getElementById("btnStopCode");
    if (btn && label) {
      if (running) {
        btn.classList.add("running");
        label.textContent = "运行中...";
      } else {
        btn.classList.remove("running");
        label.textContent = "运行代码";
      }
    }
    if (stopBtn) {
      stopBtn.classList.toggle("show", !!running);
      stopBtn.disabled = !running;      // 常驻显示，运行中才可点
    }
  }

  function switchTabSafe(name) {
    if (window.App && window.App.switchToTab) {
      window.App.switchToTab(name);
    }
  }

  function finishRun() {
    isRunning = false;
    if (longRunTimer) { clearTimeout(longRunTimer); longRunTimer = null; }
    setRunButtonState(false);
    hideTerminalInput();
    if (readyWaitTimer) {
      clearTimeout(readyWaitTimer);
      readyWaitTimer = null;
    }
  }

  // ================= 儿童友好错误诊断 =================
  function handleRuntimeError(errText, errorLine, errorCodeLine) {
    hideTerminalInput();
    const full = String(errText || "");
    const lines = full.trim().split(NL).filter(Boolean);
    const lastLine = lines[lines.length - 1] || "未知错误";
    appendLog("error", "❌ 哎呀，程序遇到一点小状况：" + lastLine);

    // 有行号时，展示可点击的「跳到出错那一行」
    if (errorLine > 0) {
      if (errorCodeLine) {
        const codeDiv = document.createElement("div");
        codeDiv.className = "term-line error";
        codeDiv.style.fontFamily = "var(--font-code)";
        codeDiv.textContent = "第 " + errorLine + " 行代码：" + errorCodeLine;
        const t0 = document.getElementById("terminalLogs");
        if (t0) { t0.appendChild(codeDiv); }
      }

      const jumpDiv = document.createElement("div");
      jumpDiv.className = "term-line error";
      jumpDiv.style.cursor = "pointer";
      jumpDiv.style.textDecoration = "underline";
      jumpDiv.textContent = "👆 点我这里，跳到第 " + errorLine + " 行看看";
      jumpDiv.addEventListener("click", () => {
        try { CodeEditor.gotoLine(errorLine); } catch (e) {}
        try { SoundEffects.playPop(); } catch (e) {}
      });
      const term = document.getElementById("terminalLogs");
      if (term) { term.appendChild(jumpDiv); scheduleScroll(); }
    }

    // ===== 小侦探：把 Python 报错翻译成孩子能懂的话 =====
    const ERROR_GUIDE = [
      { key: "IndentationError", name: "缩进没对齐", title: "🔍 缩进小楼梯没对齐！",
        tips: ["冒号 <b>:</b> 后面的代码要往右缩进 4 个空格（按一次 Tab）",
               "同一个块里的代码缩进要一样多，不要一会儿 2 个空格、一会儿 4 个空格"] },
      { key: "TabError", name: "空格和 Tab 混用", title: "🔍 空格和 Tab 混在一起啦！",
        tips: ["缩进要么都用 <b>4 个空格</b>，要么都用 <b>Tab</b>，不要混着用",
               "可以在编辑器里全选代码，重新对齐一遍缩进"] },
      { key: "SyntaxError", name: "标点或语法写错", title: "🔍 语法标点可能有迷路的小伙伴！",
        tips: ["检查括号 <b>()</b>、引号有没有成对闭合",
               "检查 <b>if / for / while / def</b> 那一行末尾是不是漏了英文冒号 <b>:</b>",
               "点下面的「🩺 标点体检」按钮，可以自动把中文标点改成英文标点"] },
      { key: "NameError", name: "名字不认识", title: "🔍 电脑不认识这个名字！",
        tips: ["检查变量名有没有拼错（大小写也算哦！）",
               "变量要先赋值再使用，例如先写 <b>score = 0</b> 再用 <b>score</b>"] },
      { key: "UnboundLocalError", name: "变量还没准备好", title: "🔍 变量还没准备好就被用啦！",
        tips: ["函数里的变量要先赋值才能使用", "检查一下是不是把顺序写反了"] },
      { key: "TypeError", name: "类型对不上", title: "🔍 数据类型对不上哦！",
        tips: ["文字和数字不能直接用 <b>+</b> 拼在一起，试试 <b>str(数字)</b> 转成文字",
               "input() 拿到的是文字，要和数字比较大小，先用 <b>int()</b> 转换"] },
      { key: "ValueError", name: "值不合适", title: "🔍 这个值不太合适哦！",
        tips: ["<b>int(\"abc\")</b> 是不行的，input() 得到的是文字，要输入数字才行",
               "检查 <b>range()</b>、<b>int()</b> 里的内容是不是写错了"] },
      { key: "ZeroDivisionError", name: "除以 0", title: "🔍 数学小禁区：数字不能除以 0！",
        tips: ["任何数字都不能除以 0，检查除数是不是算成了 0",
               "如果是随机的除数，记得先判断它不等于 0"] },
      { key: "IndexError", name: "下标越界", title: "🔍 队伍里没有这个位置！",
        tips: ["列表从 <b>0</b> 开始编号：长度是 3 的列表只有 0、1、2",
               "可以用 <b>len(列表)</b> 看看一共有多少个"] },
      { key: "KeyError", name: "字典里没这个键", title: "🔍 字典里没找到这把钥匙！",
        tips: ["先 <b>print(字典.keys())</b> 看看有哪些钥匙",
               "也可以用 <b>字典.get(键)</b> 更安全"] },
      { key: "AttributeError", name: "没有这个方法", title: "🔍 这个小帮手没有这个本领！",
        tips: ["检查方法名有没有拼错",
               "列表有 <b>append</b>，文字有 <b>upper</b>，要用在正确的对象上"] },
      { key: "ModuleNotFoundError", name: "找不到模块", title: "🔍 找不到这个工具箱！",
        tips: ["检查模块名字有没有拼错（比如 <b>turtle</b>、<b>random</b>、<b>math</b>）",
               "第三方模块第一次使用会从网上准备，等几秒再运行一次就好"] },
      { key: "ImportError", name: "导入失败", title: "🔍 这个工具箱里没有那个零件！",
        tips: ["检查 <b>from ... import ...</b> 的名字有没有拼错"] },
      { key: "FileNotFoundError", name: "找不到文件", title: "🔍 找不到这个文件！",
        tips: ["检查文件名有没有写错", "读文件之前要先写进去（用 <b>open(名字, \"w\")</b>）"] },
      { key: "RecursionError", name: "递归太深", title: "🔍 函数自己叫自己太多次啦！",
        tips: ["递归要记得写「什么时候停下来」的条件",
               "检查有没有忘记 return，或者条件永远不成立"] },
      { key: "EOFError", name: "输入提前结束", title: "🔍 input() 遇到意外结束！",
        tips: ["在下方输入框里输入内容再按回车", "按了「⏹ 停止」也会出现这个提示"] },
      { key: "MemoryError", name: "内存不够", title: "🔍 东西太多啦，内存装不下！",
        tips: ["把 range 或者列表改小一点再试试"] }
    ];

    let guide = null;
    for (let i = 0; i < ERROR_GUIDE.length; i++) {
      if (full.indexOf(ERROR_GUIDE[i].key) !== -1) { guide = ERROR_GUIDE[i]; break; }
    }
    if (!guide) {
      guide = { name: "未知小状况", title: "🔍 小侦探正在诊断...", tips: ["检查代码里有没有写错的字母或符号"] };
    }
    const tips = guide.tips.slice();
    const nameMatch = full.match(/name '([A-Za-z0-9_]+)' is not defined/);
    if (nameMatch) tips.unshift("电脑不认识 <b>" + nameMatch[1] + "</b>，看看是不是拼错了？");

    // 出错路线：第 3 行 → draw() 里 → 第 7 行出错
    const frames = [];
    const reFrame = /File "<学生代码>", line ([0-9]+)(?:, in ([^\n]+))?/g;
    let fm;
    while ((fm = reFrame.exec(full)) !== null) {
      const fn = (fm[2] || "").trim();
      frames.push({ line: parseInt(fm[1], 10), fn: fn === "<module>" ? "" : fn });
    }
    let pathText = "";
    if (frames.length > 1) {
      const parts = frames.map(f => "第 " + f.line + " 行" + (f.fn ? "（" + f.fn + " 里）" : ""));
      pathText = "🕵️ 出错路线：" + parts.join(" → ");
    }

    const terminal = document.getElementById("terminalLogs");
    if (!terminal) return;
    const tipDiv = document.createElement("div");
    tipDiv.className = "detective-tip-card";
    tipDiv.innerHTML =
      '<div class="detective-header">' + guide.title + "（" + guide.name + "）" + '</div>' +
      '<div class="detective-body">' +
      (pathText ? '<div class="detective-path">' + pathText + "</div>" : "") +
      tips.map(t => '<div class="detective-tip-line">💡 ' + t + "</div>").join("") +
      "</div>";

    // 行动按钮：一键标点体检 / 回到上次成功的代码
    const actions = document.createElement("div");
    actions.className = "detective-actions";
    const needPunct = full.indexOf("SyntaxError") !== -1 || full.indexOf("IndentationError") !== -1 || full.indexOf("TabError") !== -1;
    if (needPunct && typeof CodeEditor !== "undefined" && CodeEditor.fixChinesePunctuation) {
      const btnFix = document.createElement("button");
      btnFix.className = "detective-btn";
      btnFix.textContent = "🩺 标点体检";
      btnFix.addEventListener("click", () => {
        try { CodeEditor.fixChinesePunctuation(); } catch (e) {}
        appendLog("system", "🩺 已尝试修复中文标点，再运行一次看看吧~");
      });
      actions.appendChild(btnFix);
    }
    if (errorLine > 0) {
      const btnBack = document.createElement("button");
      btnBack.className = "detective-btn";
      btnBack.textContent = "⏪ 回到上次成功的代码";
      btnBack.addEventListener("click", () => {
        const btn = document.getElementById("btnSnapshot");
        if (btn) btn.click();
      });
      actions.appendChild(btnBack);
    }
    if (actions.children.length) tipDiv.appendChild(actions);

    terminal.appendChild(tipDiv);
    scheduleScroll();
  }

  // 分享链接无法自动复制时，渲染到终端供手动复制
  function showShareLink(url) {
    appendLog("system", "🔗 分享链接（选中后复制发给同学）：");
    const div = document.createElement("div");
    div.className = "term-line stdout";
    div.textContent = url;
    div.style.wordBreak = "break-all";
    div.style.userSelect = "all";
    const term = document.getElementById("terminalLogs");
    if (term) { term.appendChild(div); term.scrollTop = term.scrollHeight; }
  }

  return {
    init,
    showShareLink,
    run: runCode,
    stop: stopCode,
    submitTerminalInput,
    hideTerminalInput
  };
})();

window.PythonRunner = PythonRunner;
