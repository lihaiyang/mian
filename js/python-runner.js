/**
 * 🐍 Python 浏览器端执行核心
 * 如果 SharedArrayBuffer 可用，使用 Web Worker 方案；
 * 否则回退到主线程 + window.prompt() 方案。
 */
const PythonRunner = (() => {
  let worker = null;
  let isReady = false;
  let isRunning = false;
  let stdoutLineBuf = "";
  let useWorker = false;

  function init() {
    // 检查 SharedArrayBuffer 是否可用
    if (typeof SharedArrayBuffer !== 'undefined') {
      useWorker = true;
      initWorker();
    } else {
      // SharedArrayBuffer 不可用，回退到主线程方案
      // 直接加载 Pyodide（通过已有的 CDN script 标签）
      initMainThread();
    }
  }

  // ========== Worker 方案 ==========
  function initWorker() {
    updateStatus("loading", "正在召唤 Python 3.12 魔法引擎... ✨");
    worker = new Worker('js/python-worker.js');

    // 创建 SharedArrayBuffer 并发送给 Worker
    const SAB_SIZE = 258;
    const sab = new SharedArrayBuffer(SAB_SIZE);
    worker.postMessage({ type: 'init', sab: sab }, [sab]);

    worker.addEventListener('message', handleWorkerMessage);
    worker.addEventListener('error', (e) => {
      console.error('Worker error:', e);
      // 回退到主线程
      useWorker = false;
      worker = null;
      initMainThread();
    });
  }

  function handleWorkerMessage(event) {
    const data = event.data;
    if (!data || typeof data !== 'object') {
      if (typeof data === 'string') handleStdout(data);
      return;
    }
    switch (data.type) {
      case 'ready':
        isReady = true;
        updateStatus("ready", "\ud83d\udfe1 Python 3.12 \u9b54\u6cd5\u5c31\u7eea\uff01");
        break;
      case 'input':
        if (data.prompt) appendLog("stdout", "\u27a1 " + data.prompt);
        showTerminalInput();
        break;
      case 'turtle-detect':
        if (typeof TurtleEngine !== 'undefined') TurtleEngine.reset();
        switchTabSafe("turtle");
        appendLog("system", "\ud83d\udc22 \u4fa6\u6d4b\u5230\u6d77\u9f9f\u7ed8\u56fe\uff01\u5df2\u81ea\u52a8\u5207\u6362\u5230\u3010\u6d77\u9f9f\u753b\u5e03\u3011\u89c6\u7a97~");
        break;
      case 'turtle':
        executeTurtle(data);
        break;
      case 'done':
        finishRun();
        appendLog("success", "\u2728 \u4ee3\u7801\u8fd0\u884c\u6210\u529f\uff01\ud83c\udf89");
        try { ConfettiFX.celebrate(); } catch(e) {}
        break;
      case 'error':
        finishRun();
        handleRuntimeError(data.text, "");
        try { SoundEffects.playWarning(); } catch(e) {}
        break;
      default:
        if (typeof data === 'string') handleStdout(data);
    }
  }

  function executeTurtle(data) {
    const engine = typeof TurtleEngine !== 'undefined' ? TurtleEngine : null;
    if (!engine || !data.method) return;
    const fn = engine[data.method];
    if (typeof fn === 'function') {
      try { fn.apply(engine, data.args || []); } catch(e) {}
    }
  }

  function submitTerminalInput() {
    const input = document.getElementById("terminalInput");
    if (!input) return;
    const val = input.value;
    hideTerminalInput();
    appendLog("stdout", "\u276f " + val);
    if (worker && useWorker) {
      worker.postMessage({ type: 'input-result', value: val });
    }
  }

  // ========== 主线程方案（回退） ==========
  function initMainThread() {
    updateStatus("loading", "\u6b63\u5728\u53ec\u5524 Python 3.12 \u9b54\u6cd5\u5f15\u64ce... \u2728");
    // 如果 Pyodide 已通过 CDN script 加载，直接使用
    if (typeof loadPyodide !== 'undefined' && !window.__pyodideLoading) {
      window.__pyodideLoading = true;
      loadPyodide({
        indexURL: "https://cdn.jsdelivr.net/pyodide/v0.26.2/full/"
      }).then(py => {
        window.__pyodide = py;
                // 设置环境
        const setupCode = `import sys, types, builtins
from js import window
class WebStdout:
    def write(self, s):
        if s: window.PythonRunner.handleStdout(str(s))
    def flush(self): pass
class WebStderr:
    def write(self, s): pass
    def flush(self): pass
sys.stdout = WebStdout()
sys.stderr = WebStderr()
def _kid_input(prompt_text=""):
    return window.PythonRunner.waitForInput(str(prompt_text))
builtins.input = _kid_input
sys.modules["turtle"] = __import__("turtle")`;
        return py.runPythonAsync(setupCode);
      }).then(() => {

        updateStatus("ready", "\ud83d\udfe1 Python 3.12 \u9b54\u6cd5\u5c31\u7eea\uff01");
        isReady = true;
      }).catch(err => {
        console.error('Pyodide ERROR:');
        console.error('  message:', err.message);
        console.error('  toString:', err.toString());
        console.error('  props:', Object.keys(err).join(', '));
        try { console.error('  Python tb:', err.__cause__); } catch(e) {}
        updateStatus("error", "\u26a0\ufe0f \u9b54\u6cd5\u5f15\u64ce\u51c6\u5907\u4e2d");
      });
    }
  }

  let mainThreadPyodide = null;
  function waitForInput(promptText) {
    appendLog("stdout", "\u27a1 " + promptText);
    showTerminalInput();
    const val = window.prompt(promptText || "\u8bf7\u8f93\u5165\uff1a");
    hideTerminalInput();
    appendLog("stdout", "\u276f " + (val || ""));
    return val === null ? "" : val;
  }

  async function runMainThread(code) {
    const py = window.__pyodide;
    if (!py) {
      appendLog("warning", "\u23f3 Python \u5f15\u64ce\u6b63\u5728\u52a0\u8f7d\u4e2d...");
      if (!window.__pyodideLoading) initMainThread();
      // 等待加载完成
      await new Promise(resolve => {
        const check = () => {
          if (window.__pyodide) resolve();
          else setTimeout(check, 200);
        };
        check();
      });
    }
    mainThreadPyodide = window.__pyodide;
    if (!mainThreadPyodide) {
      appendLog("error", "\u274c Python \u5f15\u64ce\u52a0\u8f7d\u5931\u8d25");
      return;
    }

    isRunning = true;
    setRunButtonState(true);
    stdoutLineBuf = "";
    const terminal = document.getElementById("terminalLogs");
    if (terminal) terminal.innerHTML = "";
    hideTerminalInput();
    appendLog("system", "\ud83d\ude80 \u5f00\u59cb\u8fd0\u884c Python \u4ee3\u7801...");

    const hasTurtle = /import\\s+turtle|from\\s+turtle/i.test(code);
    if (hasTurtle) {
      if (typeof TurtleEngine !== 'undefined') TurtleEngine.reset();
      switchTabSafe("turtle");
      appendLog("system", "\ud83d\udc22 \u4fa6\u6d4b\u5230\u6d77\u9f9f\u7ed8\u56fe\uff01\u5df2\u81ea\u52a8\u5207\u6362\u5230\u3010\u6d77\u9f9f\u753b\u5e03\u3011\u89c6\u7a97~");
    } else {
      switchTabSafe("console");
    }

    // Yield 一次让浏览器渲染视图
    await new Promise(resolve => setTimeout(resolve, 0));

    try {
      await mainThreadPyodide.runPythonAsync(code);
      appendLog("success", "\u2728 \u4ee3\u7801\u8fd0\u884c\u6210\u529f\uff01\ud83c\udf89");
      try { ConfettiFX.celebrate(); } catch(e) {}
    } catch (err) {
      handleRuntimeError(err.message || String(err), code);
      console.error('Run error:', err);
      try { SoundEffects.playWarning(); } catch(e) {}
    } finally {
      finishRun();
    }
  }

  // ========== 公共方法 ==========
  function handleStdout(s) {
    stdoutLineBuf += s;
    let idx;
    while ((idx = stdoutLineBuf.indexOf("\\n")) !== -1) {
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
      label.textContent = "\u8fd0\u884c\u4e2d...";
    } else {
      btn.classList.remove("running");
      label.textContent = "\u8fd0\u884c\u4ee3\u7801";
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

  function runCode(code) {
    if (isRunning) {
      if (window.App && window.App.showToast) {
        window.App.showToast("\u23f3 \u4ee3\u7801\u8fd8\u5728\u8fd0\u884c\u4e2d\uff0c\u7b49\u5b83\u8dd1\u5b8c\u518d\u70b9\u54e6~", "\ud83d\udc22");
      }
      return;
    }
    if (useWorker && worker) {
      runWorkerCode(code);
    } else {
      runMainThread(code);
    }
  }

  function runWorkerCode(code) {
    isRunning = true;
    setRunButtonState(true);
    stdoutLineBuf = "";
    const terminal = document.getElementById("terminalLogs");
    if (terminal) terminal.innerHTML = "";
    hideTerminalInput();
    appendLog("system", "\ud83d\ude80 \u5f00\u59cb\u8fd0\u884c Python \u4ee3\u7801...");

    const hasTurtle = /import\\s+turtle|from\\s+turtle/i.test(code);
    if (hasTurtle) {
      if (typeof TurtleEngine !== 'undefined') TurtleEngine.reset();
      switchTabSafe("turtle");
      appendLog("system", "\ud83d\udc22 \u4fa6\u6d4b\u5230\u6d77\u9f9f\u7ed8\u56fe\uff01\u5df2\u81ea\u52a8\u5207\u6362\u5230\u3010\u6d77\u9f9f\u753b\u5e03\u3011\u89c6\u7a97~");
    } else {
      switchTabSafe("console");
    }

    worker.postMessage({ type: 'run', code: code });
  }

  function handleRuntimeError(errText, originalCode) {
    hideTerminalInput();
    const full = String(errText || "");
    const lines = full.trim().split("\\n").filter(Boolean);
    const lastLine = lines[lines.length - 1] || "\u672a\u77e5\u9519\u8bef";
    appendLog("error", "\u274c \u54ce\u5440\uff0c\u7a0b\u5e8f\u9047\u5230\u4e00\u70b9\u5c0f\u72b6\u51b5\uff1a" + lastLine);
    let tipTitle = "\ud83d\udd0d \u5c0f\u4fa6\u63a2\u6b63\u5728\u8bca\u65ad...";
    let tipContent = "\u68c0\u67e5\u4e00\u4e0b\u4ee3\u7801\u662f\u5426\u6709\u5c0f\u5b57\u6bcd\u6253\u9519\u4e86\u54e6\uff01";
    if (full.includes("IndentationError")) {
      tipTitle = "\ud83d\udd0d \u7f29\u8fdb\u5c0f\u697c\u68af\u6ca1\u5bf9\u9f50\uff01";
      tipContent = "Python \u975e\u5e38\u5728\u4e4e\u4ee3\u7801\u5de6\u4fa7\u7684\u7a7a\u683c\uff01<br>\u27a1 \u5192\u53f7 <b>:</b> \u540e\u9762\u8981\u6309 <b>Tab</b> \u7f29\u8fdb\u54e6\uff01";
    } else if (full.includes("SyntaxError")) {
      tipTitle = "\ud83d\udd0d \u8bed\u6cd5\u6807\u70b9\u7b26\u53f7\u6709\u8ff7\u8def\u7684\u5c0f\u4f19\u4f34\uff01";
      tipContent = "\u770b\u770b\u662f\u4e0d\u662f\u62ec\u53f7 <b>()</b> \u6ca1\u6709\u6210\u5bf9\u95ed\u5408\uff1f\u6216\u8005 <b>if/for/while</b> \u540e\u9762\u6f0f\u6389\u4e86\u82f1\u6587\u5192\u53f7 <b>:</b>\uff1f";
    } else if (full.includes("NameError")) {
      const match = full.match(/name '(\\w+)' is not defined/);
      const varName = match ? match[1] : "\u67d0\u4e2a\u53d8\u91cf";
      tipTitle = "\ud83d\udd0d \u627e\u4e0d\u5230\u540d\u5b57\u4e3a\u3010" + varName + "\u3011\u7684\u5c0f\u5e2e\u624b\uff01";
      tipContent = "\u7535\u8111\u4e0d\u8ba4\u8bc6 <b>" + varName + "</b>\uff0c\u68c0\u67e5\u4e00\u4e0b\u62fc\u5199\u6216\u8005\u662f\u5426\u5fd8\u8bb0\u5b9a\u4e49\u4e86\uff1f";
    } else if (full.includes("EOFError")) {
      tipTitle = "\ud83d\udd0d input() \u9047\u5230\u610f\u5916\u7ed3\u675f\uff01";
      tipContent = "\u4ee3\u7801\u6267\u884c\u5230\u4e00\u534a\uff0cinput() \u6ca1\u80fd\u83b7\u53d6\u5230\u8f93\u5165\u3002";
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
    hideTerminalInput,
    handleStdout,
    waitForInput
  };
})();

window.PythonRunner = PythonRunner;
