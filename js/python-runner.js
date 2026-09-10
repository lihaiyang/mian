/**
 * 🐍 Python 浏览器端执行核心 - 主线程通信层
 * 
 * Pyodide 运行在 Web Worker 中。Worker 遇到 input() 时通过
 * SharedArrayBuffer + Atomics.wait 阻塞 Worker 线程，主线程
 * 事件循环完全不受影响，可以实时渲染输出，实现命令行式输入。
 */
const PythonRunner = (() => {
  let worker = null;
  let isReady = false;
  let isRunning = false;
  let stdoutLineBuf = "";

  // SharedArrayBuffer 布局: [0]=signal, [1]=length, [2..257]=chars
  const SAB_SIZE = 258;
  let inputSab = null;
  let inputBuf = null;

  function init() {
    if (worker) return;
    updateStatus("loading", "正在召唤 Python 3.12 魔法引擎... ✨");

    try {
      inputSab = new SharedArrayBuffer(SAB_SIZE * 4);
      inputBuf = new Int32Array(inputSab);
    } catch (e) {
      updateStatus("error", "⚠️ 浏览器不支持 SharedArrayBuffer，请升级浏览器");
      return;
    }

    worker = new Worker('js/python-worker.js');
    worker.addEventListener('message', handleWorkerMessage);
    worker.addEventListener('error', (e) => {
      console.error('Worker error:', e);
      updateStatus("error", "⚠️ Python 引擎遇到异常");
    });

    // 将 SharedArrayBuffer 转移给 Worker
    worker.postMessage({ type: 'init', sab: inputSab });
  }

  function handleWorkerMessage(event) {
    const data = event.data;

    // Python 通过 self.postMessage(字符串) 发送 stdout 或 JSON 消息
    if (typeof data === 'string') {
      let parsed = null;
      try { parsed = JSON.parse(data); } catch (e) { /* 不是 JSON，当作 stdout */ }
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

      case 'input':
        // Python 请求输入 — 显示终端输入行（命令行式，不弹窗）
        if (data.prompt) appendLog("stdout", "👉 " + data.prompt);
        showTerminalInput();
        break;

      case 'turtle-detect':
        // 检测到海龟绘图 — 清空画布并切换视图
        if (typeof TurtleEngine !== 'undefined') TurtleEngine.reset();
        switchTabSafe("turtle");
        appendLog("system", "🐢 侦测到海龟绘图！已自动切换到【海龟画布】视窗~");
        break;

      case 'turtle':
        executeTurtle(data);
        break;

      case 'done':
        finishRun();
        appendLog("success", "✨ 代码运行成功！🎉");
        try { ConfettiFX.celebrate(); } catch (e) {}
        break;

      case 'error':
        finishRun();
        handleRuntimeError(data.text || "");
        try { SoundEffects.playWarning(); } catch (e) {}
        break;
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

  // ================= 终端输入（命令行式） =================
  function submitTerminalInput() {
    const input = document.getElementById("terminalInput");
    if (!input) return;
    const val = input.value;
    hideTerminalInput();
    appendLog("stdout", "❯ " + val);

    // 直接写入 SharedArrayBuffer 并唤醒 Worker 中的 Atomics.wait
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
        window.App.showToast("⏳ 代码还在运行中，等它跑完再点哦~", "🐢");
      }
      return;
    }

    if (!worker) init();

    isRunning = true;
    setRunButtonState(true);
    stdoutLineBuf = "";

    // 清屏与重置
    const terminal = document.getElementById("terminalLogs");
    if (terminal) terminal.innerHTML = "";
    hideTerminalInput();
    appendLog("system", "🚀 开始运行 Python 代码...");

    // 每次运行前清空海龟画布，避免上一次的画作残留
    if (typeof TurtleEngine !== 'undefined') TurtleEngine.reset();

    const hasTurtle = /imports+turtle|froms+turtle/i.test(code);
    if (hasTurtle) {
      switchTabSafe("turtle");
    } else {
      switchTabSafe("console");
    }

    if (!isReady) {
      appendLog("warning", "⏳ 正在连接 Python 运行环境，初次加载约需数秒，请稍候...");
    }

    const trySend = () => {
      if (worker && isReady) {
        worker.postMessage({ type: 'run', code: code });
      } else if (worker) {
        setTimeout(trySend, 200);
      }
    };
    trySend();
  }

  // ================= 终端渲染 =================
  function handleStdout(s) {
    stdoutLineBuf += s;
    let idx;
    while ((idx = stdoutLineBuf.indexOf("\n")) !== -1) {
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
    terminal.scrollTop = terminal.scrollHeight;
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
    if (!btn || !label) return;
    if (running) {
      btn.classList.add("running");
      label.textContent = "运行中...";
    } else {
      btn.classList.remove("running");
      label.textContent = "运行代码";
    }
  }

  function switchTabSafe(name) {
    if (window.App && window.App.switchToTab) {
      window.App.switchToTab(name);
    }
  }

  function finishRun() {
    isRunning = false;
    setRunButtonState(false);
    hideTerminalInput();
  }

  // ================= 儿童友好错误诊断 =================
  function handleRuntimeError(errText) {
    hideTerminalInput();
    const full = String(errText || "");
    const lines = full.trim().split("\n").filter(Boolean);
    const lastLine = lines[lines.length - 1] || "未知错误";
    appendLog("error", "❌ 哎呀，程序遇到一点小状况：" + lastLine);

    let tipTitle = "🔍 小侦探正在诊断...";
    let tipContent = "检查一下代码是否有小字母打错了哦！";

    if (full.includes("IndentationError")) {
      tipTitle = "🔍 缩进小楼梯没对齐！";
      tipContent = "Python 非常在乎代码左侧的空格！<br>👉 冒号 <b>:</b> 后面要按 <b>Tab</b> 缩进哦！";
    } else if (full.includes("SyntaxError")) {
      tipTitle = "🔍 语法标点符号有迷路的小伙伴！";
      tipContent = "看看是不是括号 <b>()</b> 没有成对闭合？或者 <b>if/for/while</b> 后面漏掉了英文冒号 <b>:</b>？";
    } else if (full.includes("NameError")) {
      const match = full.match(/name '(\w+)' is not defined/);
      const varName = match ? match[1] : "某个变量";
      tipTitle = "🔍 找不到名字为【" + varName + "】的小帮手！";
      tipContent = "电脑不认识 <b>" + varName + "</b>，检查一下拼写或者是否忘记定义了？";
    } else if (full.includes("TypeError")) {
      tipTitle = "🔍 数据类型对不上哦！";
      tipContent = "是不是把文字和数字直接用 <b>+</b> 拼在一起啦？试试用 <b>str()</b> 转换一下！";
    } else if (full.includes("ZeroDivisionError")) {
      tipTitle = "🔍 数学小禁区：数字不能除以 0！";
      tipContent = "任何数字都不能除以 0 哦！检查一下你的除数是不是算成 0 了？";
    } else if (full.includes("EOFError")) {
      tipTitle = "🔍 input() 遇到意外结束！";
      tipContent = "代码执行到一半，input() 没能获取到输入。<br>👉 可能在输入框里没有输入内容？";
    }

    const terminal = document.getElementById("terminalLogs");
    if (!terminal) return;
    const tipDiv = document.createElement("div");
    tipDiv.className = "detective-tip-card";
    tipDiv.innerHTML = '<div class="detective-header">' + tipTitle + '</div><div class="detective-body">' + tipContent + '</div>';
    terminal.appendChild(tipDiv);
    terminal.scrollTop = terminal.scrollHeight;
  }

  return {
    init,
    run: runCode,
    submitTerminalInput,
    hideTerminalInput
  };
})();

window.PythonRunner = PythonRunner;
