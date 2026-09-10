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
  }

  function startWorker() {
    worker = new Worker('js/python-worker.js');
    worker.addEventListener('message', handleWorkerMessage);
    worker.addEventListener('error', (e) => {
      console.error('Worker error:', e);
      updateStatus("error", "⚠️ Python 引擎遇到异常");
      if (isRunning) {
        appendLog("error", "❌ Python 引擎出现异常，请点击「运行代码」重试");
        finishRun();
      }
    });

    worker.postMessage({ type: 'init', sab: inputSab, interruptSab: interruptSab });
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
        handleStdout(data.text || "");
        break;

      case 'input':
        // Python 请求输入 — 显示终端输入行（命令行式，不弹窗）
        if (data.prompt) appendLog("stdout", "👉 " + data.prompt);
        showTerminalInput();
        break;

      case 'turtle-detect':
        if (typeof TurtleEngine !== 'undefined') TurtleEngine.reset();
        switchTabSafe("turtle");
        appendLog("system", "🐢 侦测到海龟绘图！已自动切换到【海龟画布】视窗~");
        break;

      case 'turtle':
        executeTurtle(data);
        break;

      case 'done':
        clearInterrupt();
        suppressOutput = false;
        flushStdoutBuffer();
        finishRun();
        appendLog("success", "✨ 代码运行成功！🎉");
        // 记录「上次成功运行」的代码，便于孩子改坏后一键复原
        try { if (window.App && window.App.saveSnapshot) window.App.saveSnapshot(); } catch (e) {}
        try { ConfettiFX.celebrate(); } catch (e) {}
        break;

      case 'stopped':
        clearInterrupt();
        suppressOutput = false;
        flushStdoutBuffer();
        finishRun();
        appendLog("system", "⏹ 已停止运行");
        break;

      case 'error': {
        clearInterrupt();
        suppressOutput = false;
        flushStdoutBuffer();
        finishRun();
        const text = data.text || "";
        if (text.indexOf("KeyboardInterrupt") !== -1) {
          // 用户主动停止，不显示「小侦探」报错卡片
          appendLog("system", "⏹ 已停止运行");
          break;
        }
        handleRuntimeError(text, data.line || 0);
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
    appendLog("stdout", "❯ " + val);

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
    appendLog("system", "🚀 开始运行 Python 代码...");

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
      worker.postMessage({ type: 'run', code: code });
      return;
    }

    // 引擎尚未就绪：轮询等待，并设置超时兜底
    appendLog("warning", "⏳ 正在连接 Python 运行环境，初次加载约需数秒，请稍候...");
    const deadline = Date.now() + READY_TIMEOUT_MS;
    const trySend = () => {
      readyWaitTimer = null;
      if (!isRunning) return;             // 期间被停止
      if (isReady && worker) {
        worker.postMessage({ type: 'run', code: code });
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
    if (stopBtn) stopBtn.classList.toggle("show", !!running);
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
  function handleRuntimeError(errText, errorLine) {
    hideTerminalInput();
    const full = String(errText || "");
    const lines = full.trim().split(NL).filter(Boolean);
    const lastLine = lines[lines.length - 1] || "未知错误";
    appendLog("error", "❌ 哎呀，程序遇到一点小状况：" + lastLine);

    // 有行号时，展示可点击的「跳到出错那一行」
    if (errorLine > 0) {
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

    let tipTitle = "🔍 小侦探正在诊断...";
    let tipContent = "检查一下代码是否有小字母打错了哦！";

    if (full.indexOf("IndentationError") !== -1) {
      tipTitle = "🔍 缩进小楼梯没对齐！";
      tipContent = "Python 非常在乎代码左侧的空格！<br>👉 冒号 <b>:</b> 后面要按 <b>Tab</b> 缩进哦！";
    } else if (full.indexOf("SyntaxError") !== -1) {
      tipTitle = "🔍 语法标点符号有迷路的小伙伴！";
      tipContent = "看看是不是括号 <b>()</b> 没有成对闭合？或者 <b>if/for/while</b> 后面漏掉了英文冒号 <b>:</b>？";
    } else if (full.indexOf("NameError") !== -1) {
      const match = full.match(/name '([A-Za-z0-9_]+)' is not defined/);
      const varName = match ? match[1] : "某个变量";
      tipTitle = "🔍 找不到名字为【" + varName + "】的小帮手！";
      tipContent = "电脑不认识 <b>" + varName + "</b>，检查一下拼写或者是否忘记定义了？";
    } else if (full.indexOf("TypeError") !== -1) {
      tipTitle = "🔍 数据类型对不上哦！";
      tipContent = "是不是把文字和数字直接用 <b>+</b> 拼在一起啦？试试用 <b>str()</b> 转换一下！";
    } else if (full.indexOf("ZeroDivisionError") !== -1) {
      tipTitle = "🔍 数学小禁区：数字不能除以 0！";
      tipContent = "任何数字都不能除以 0 哦！检查一下你的除数是不是算成 0 了？";
    } else if (full.indexOf("EOFError") !== -1) {
      tipTitle = "🔍 input() 遇到意外结束！";
      tipContent = "代码执行到一半，input() 没能获取到输入。<br>👉 可能在输入框里没有输入内容？";
    } else if (full.indexOf("RecursionError") !== -1) {
      tipTitle = "🔍 函数自己叫自己太多次啦！";
      tipContent = "递归要记得写「什么时候停下来」的条件哦！";
    }

    const terminal = document.getElementById("terminalLogs");
    if (!terminal) return;
    const tipDiv = document.createElement("div");
    tipDiv.className = "detective-tip-card";
    tipDiv.innerHTML = '<div class="detective-header">' + tipTitle + '</div><div class="detective-body">' + tipContent + '</div>';
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
