/**
 * 🐍 Python 浏览器端执行核心 - 主线程通信层
 * 
 * 负责与 Web Worker 中的 Pyodide 引擎通信，将 Worker 发来的
 * stdout/turtle/input 等消息路由到对应的 UI 组件。
 * Worker 中的 Python 线程通过 Atomics.wait() 阻塞等待输入，
 * 主线程的事件循环完全不受影响，可以正常渲染输出。
 */

const PythonRunner = (() => {
  let worker = null;
  let isReady = false;
  let isRunning = false;
  let pendingInputResolve = null;
  let stdoutLineBuf = "";

  // 海龟引擎命令映射
  const TURTLE_METHODS = {
    forward: 'forward', backward: 'backward', right: 'right', left: 'left',
    circle: 'circle', color: 'color', pencolor: 'pencolor', fillcolor: 'fillcolor',
    pensize: 'pensize', penup: 'penup', pendown: 'pendown', speed: 'speed',
    goto: 'goto', setpos: 'setpos', setheading: 'setheading', seth: 'seth',
    setx: 'setx', sety: 'sety', home: 'home', dot: 'dot', write: 'write',
    begin_fill: 'begin_fill', end_fill: 'end_fill', clear: 'clear', reset: 'reset',
    hideturtle: 'hideturtle', showturtle: 'showturtle', bgcolor: 'bgcolor'
  };

  function init() {
    if (worker) return;
    updateStatus("loading", "正在召唤 Python 3.12 魔法引擎... ✨");

    worker = new Worker('js/python-worker.js');

    worker.addEventListener('message', handleWorkerMessage);
    worker.addEventListener('error', (e) => {
      console.error('Worker error:', e);
      updateStatus("error", "⚠️ Worker 遇到异常");
    });
  }

  function handleWorkerMessage(event) {
    const data = event.data;

    if (!data || typeof data !== 'object') {
      // 纯文本 = stdout
      if (typeof data === 'string') {
        handleStdout(data);
      }
      return;
    }

    switch (data.type) {
      case 'init':
        // Worker 初始化完成，收到 SharedArrayBuffer
        break;

      case 'ready':
        isReady = true;
        updateStatus("ready", "🟢 Python 3.12 魔法就绪！");
        break;

      case 'stdout':
        handleStdout(data.text);
        break;

      case 'input':
        // Worker 请求输入 — 显示终端输入行
        const prompt = data.prompt || "";
        if (prompt) {
          appendLog("stdout", "👉 " + prompt);
        }
        showTerminalInput();
        break;

      case 'turtle-detect':
        // 检测到海龟绘图 — 切换到海龟画布
        TurtleEngine.reset();
        switchTabSafe("turtle");
        appendLog("system", "🐢 侦测到海龟绘图！已自动切换到【海龟画布】视窗~");
        break;

      case 'turtle':
        // 海龟绘图命令
        executeTurtleCommand(data);
        break;

      case 'done':
        isRunning = false;
        setRunButtonState(false);
        hideTerminalInput();
        appendLog("success", "✨ 代码运行成功！🎉");
        try { ConfettiFX.celebrate(); } catch(e) {}
        break;

      case 'error':
        isRunning = false;
        setRunButtonState(false);
        hideTerminalInput();
        handleRuntimeError(data.text, "");
        try { SoundEffects.playWarning(); } catch(e) {}
        break;
    }
  }

  function executeTurtleCommand(data) {
    const method = data.method;
    const args = data.args || [];
    const engine = typeof TurtleEngine !== 'undefined' ? TurtleEngine : null;
    if (!engine) return;

    if (method === 'onIdle') {
      // 海龟动画完成后回调
      if (args[0]) {
        engine.onIdle(args[0]);
      }
      return;
    }

    const fn = engine[method];
    if (typeof fn === 'function') {
      try {
        fn.apply(engine, args);
      } catch (e) {
        console.warn('Turtle method error:', method, e);
      }
    }
  }

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
    div.className = `term-line ${type}`;
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

  // 提交终端输入：由 app.js 的 Enter 键事件触发
  function submitTerminalInput() {
    const input = document.getElementById("terminalInput");
    if (!input) return;
    const val = input.value;
    hideTerminalInput();
    // 回显输入
    appendLog("stdout", "❯ " + val);
    // 发送到 Worker
    if (worker && isReady) {
      worker.postMessage({ type: 'input-result', value: val });
    }
  }

  // 运行代码
  function runCode(code) {
    if (isRunning) {
      if (window.App && window.App.showToast) {
        window.App.showToast("⏳ 代码还在运行中，等它跑完再点哦~", "🐢");
      }
      return;
    }

    if (!worker) {
      init();
    }

    isRunning = true;
    setRunButtonState(true);
    stdoutLineBuf = "";

    // 清屏
    const terminal = document.getElementById("terminalLogs");
    if (terminal) terminal.innerHTML = "";
    hideTerminalInput();
    appendLog("system", "🚀 开始运行 Python 代码...");

    // 检测海龟
    const hasTurtle = /import\s+turtle|from\s+turtle/i.test(code);
    if (hasTurtle) {
      TurtleEngine.reset();
      switchTabSafe("turtle");
      appendLog("system", "🐢 侦测到海龟绘图！已自动切换到【海龟画布】视窗~");
    } else {
      switchTabSafe("console");
    }

    // 等待 Worker 就绪
    if (!isReady) {
      appendLog("warning", "⏳ 正在连接 Python 运行环境，初次加载约需数秒，请稍候...");
    }

    // 发送代码到 Worker 执行
    const tryRun = () => {
      if (isReady && worker) {
        appendLog("system", "📤 发送代码到 Python 引擎...");
        worker.postMessage({ type: 'run', code: code });
      } else if (worker) {
        // Worker 还没就绪，等待
        const checkReady = () => {
          if (isReady) {
            tryRun();
          } else {
            setTimeout(checkReady, 200);
          }
        };
        checkReady();
      }
    };
    tryRun();
  }

  // 错误诊断（简化版，保留儿童友好提示）
  function handleRuntimeError(errText, originalCode) {
    hideTerminalInput();
    const full = String(errText || "");
    const lines = full.trim().split("\n").filter(Boolean);
    const lastLine = lines[lines.length - 1] || "未知错误";
    appendLog("error", "❌ 哎呀，程序遇到一点小状况：" + lastLine);

    // 简化的错误诊断
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
      tipTitle = `🔍 找不到名字为【${varName}】的小帮手！`;
      tipContent = `电脑不认识 <b>${varName}</b>，检查一下拼写或者是否忘记定义了？`;
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
    tipDiv.innerHTML = `
      <div class="detective-header">${tipTitle}</div>
      <div class="detective-body">${tipContent}</div>
    `;
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
