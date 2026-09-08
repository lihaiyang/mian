/**
 * 🐍 Python 浏览器端执行核心 (Pyodide WebAssembly Engine + Turtle Bridge)
 * 包含：标准输出按行缓冲捕获、交互式终端输入、海龟画图注入、儿童化「小侦探」报错诊断
 */
const PythonRunner = (() => {
  let pyodide = null;
  let isInitializing = false;
  let isRunning = false;
  let onInitCallbacks = [];
  let stdoutLineBuf = "";

  // 终端输入 Promise 的 resolve 回调
  let terminalInputResolve = null;

  const ENV_SETUP_CODE = `
import sys, types
from js import window

# 自定义标准输出流（JS 侧做按行缓冲）
class WebStdout:
    def write(self, s):
        if s:
            window.PythonRunner.handleStdout(str(s))
    def flush(self):
        pass

# stderr 静默：未捕获异常统一由 JS catch 的 PythonError 展示，避免重复刷屏
class WebStderr:
    def write(self, s):
        pass
    def flush(self):
        pass

sys.stdout = WebStdout()
sys.stderr = WebStderr()

# ============ 高保真海龟画图模块 (Turtle Module for Pyodide) ============
turtle_mod = types.ModuleType("turtle")

class Screen:
    def __init__(self):
        pass
    def bgcolor(self, c):
        window.TurtleEngine.bgcolor(str(c))
    def title(self, s):
        pass
    def setup(self, *a, **k):
        pass
    def done(self):
        pass
    def mainloop(self):
        pass
    def exitonclick(self):
        pass
    def tracer(self, *a, **k):
        pass
    def update(self):
        pass
    def listen(self):
        pass

class Turtle:
    def __init__(self):
        pass
    def forward(self, d):
        window.TurtleEngine.forward(float(d))
    def fd(self, d):
        self.forward(d)
    def backward(self, d):
        window.TurtleEngine.backward(float(d))
    def bk(self, d):
        self.backward(d)
    def right(self, a):
        window.TurtleEngine.right(float(a))
    def rt(self, a):
        self.right(a)
    def left(self, a):
        window.TurtleEngine.left(float(a))
    def lt(self, a):
        self.left(a)
    def circle(self, r, extent=None):
        if extent is None:
            window.TurtleEngine.circle(float(r))
        else:
            window.TurtleEngine.circle(float(r), float(extent))
    def color(self, c, fill_c=None):
        window.TurtleEngine.color(str(c), str(fill_c) if fill_c else str(c))
    def pencolor(self, c):
        window.TurtleEngine.color(str(c))
    def fillcolor(self, c):
        window.TurtleEngine.fillcolor(str(c))
    def pensize(self, s):
        window.TurtleEngine.pensize(float(s))
    def width(self, s):
        self.pensize(s)
    def penup(self):
        window.TurtleEngine.penup()
    def pu(self):
        self.penup()
    def up(self):
        self.penup()
    def pendown(self):
        window.TurtleEngine.pendown()
    def pd(self):
        self.pendown()
    def down(self):
        self.pendown()
    def speed(self, s):
        window.TurtleEngine.setSpeed(int(s))
    def goto(self, x, y):
        window.TurtleEngine.goto(float(x), float(y))
    def setpos(self, x, y):
        self.goto(x, y)
    def setheading(self, a):
        window.TurtleEngine.setheading(float(a))
    def seth(self, a):
        self.setheading(a)
    def setx(self, x):
        window.TurtleEngine.setx(float(x))
    def sety(self, y):
        window.TurtleEngine.sety(float(y))
    def home(self):
        window.TurtleEngine.home()
    def dot(self, size=None, color=None):
        window.TurtleEngine.dot(float(size) if size is not None else None, str(color) if color else None)
    def write(self, text, *a, **k):
        window.TurtleEngine.write(str(text))
    def begin_fill(self):
        window.TurtleEngine.begin_fill()
    def end_fill(self):
        window.TurtleEngine.end_fill()
    def clear(self):
        window.TurtleEngine.clear()
    def reset(self):
        window.TurtleEngine.reset()
    def hideturtle(self):
        window.TurtleEngine.hideturtle()
    def ht(self):
        self.hideturtle()
    def showturtle(self):
        window.TurtleEngine.showturtle()
    def st(self):
        self.showturtle()
    def shape(self, s):
        pass

_default_turtle = Turtle()

turtle_mod.Turtle = Turtle
turtle_mod.Pen = Turtle
turtle_mod.Screen = Screen
turtle_mod.bgcolor = lambda c: window.TurtleEngine.bgcolor(str(c))
turtle_mod.title = lambda s: None
turtle_mod.done = lambda: None
turtle_mod.mainloop = lambda: None
turtle_mod.exitonclick = lambda: None
turtle_mod.tracer = lambda *a, **k: None
turtle_mod.update = lambda: None
turtle_mod.getscreen = lambda: Screen()
turtle_mod.forward = _default_turtle.forward
turtle_mod.fd = _default_turtle.fd
turtle_mod.backward = _default_turtle.backward
turtle_mod.bk = _default_turtle.bk
turtle_mod.right = _default_turtle.right
turtle_mod.rt = _default_turtle.rt
turtle_mod.left = _default_turtle.left
turtle_mod.lt = _default_turtle.lt
turtle_mod.circle = _default_turtle.circle
turtle_mod.color = _default_turtle.color
turtle_mod.pencolor = _default_turtle.pencolor
turtle_mod.fillcolor = _default_turtle.fillcolor
turtle_mod.pensize = _default_turtle.pensize
turtle_mod.width = _default_turtle.width
turtle_mod.penup = _default_turtle.penup
turtle_mod.pu = _default_turtle.pu
turtle_mod.up = _default_turtle.up
turtle_mod.pendown = _default_turtle.pendown
turtle_mod.pd = _default_turtle.pd
turtle_mod.down = _default_turtle.down
turtle_mod.speed = _default_turtle.speed
turtle_mod.goto = _default_turtle.goto
turtle_mod.setpos = _default_turtle.setpos
turtle_mod.setheading = _default_turtle.setheading
turtle_mod.seth = _default_turtle.seth
turtle_mod.setx = _default_turtle.setx
turtle_mod.sety = _default_turtle.sety
turtle_mod.home = _default_turtle.home
turtle_mod.dot = _default_turtle.dot
turtle_mod.write = _default_turtle.write
turtle_mod.begin_fill = _default_turtle.begin_fill
turtle_mod.end_fill = _default_turtle.end_fill
turtle_mod.clear = _default_turtle.clear
turtle_mod.reset = _default_turtle.reset
turtle_mod.hideturtle = _default_turtle.hideturtle
turtle_mod.ht = _default_turtle.ht
turtle_mod.showturtle = _default_turtle.showturtle
turtle_mod.st = _default_turtle.st

sys.modules["turtle"] = turtle_mod
`;

  // 初始化 Pyodide 引擎
  async function initPyodideEngine() {
    if (pyodide) return pyodide;
    if (isInitializing) {
      return new Promise(resolve => onInitCallbacks.push(resolve));
    }

    isInitializing = true;
    updateStatus("loading", "正在召唤 Python 3.12 魔法引擎... ✨");

    try {
      if (typeof loadPyodide === "undefined") {
        throw new Error("Pyodide 脚本未加载");
      }

      pyodide = await loadPyodide({
        indexURL: "https://cdn.jsdelivr.net/pyodide/v0.26.2/full/"
      });

      await pyodide.runPythonAsync(ENV_SETUP_CODE);

      // 终端输入：Python 的 input() 通过 sys.stdin 读取，触发此回调
      pyodide.setStdin({
        stdin: () => {
          return new Promise((resolve) => {
            flushStdout();
            terminalInputResolve = resolve;
            showTerminalInput();
          });
        }
      });

      updateStatus("ready", "🟢 Python 3.12 魔法就绪！");
      isInitializing = false;
      onInitCallbacks.forEach(fn => fn(pyodide));
      onInitCallbacks = [];
      return pyodide;
    } catch (err) {
      console.error("Pyodide 引擎加载异常:", err);
      updateStatus("error", "⚠️ 魔法引擎准备中(点击依然可试跑)");
      isInitializing = false;
      onInitCallbacks.forEach(fn => fn(null));
      onInitCallbacks = [];
      return null;
    }
  }

  function updateStatus(state, text) {
    const dot = document.getElementById("statusDot");
    const label = document.getElementById("statusText");
    if (!dot || !label) return;

    dot.className = "status-dot " + (state === "ready" ? "" : state);
    label.textContent = text;
  }

  // 输出日志辅助
  function appendLog(type, text) {
    const terminal = document.getElementById("terminalLogs");
    if (!terminal) return;

    const div = document.createElement("div");
    div.className = `term-line ${type}`;
    div.textContent = text;
    terminal.appendChild(div);
    terminal.scrollTop = terminal.scrollHeight;
  }

  /**
   * stdout 按行缓冲
   */
  function handleStdout(s) {
    stdoutLineBuf += s;
    let idx;
    while ((idx = stdoutLineBuf.indexOf("\n")) !== -1) {
      const line = stdoutLineBuf.slice(0, idx);
      stdoutLineBuf = stdoutLineBuf.slice(idx + 1);
      appendLog("stdout", line);
    }
  }

  function flushStdout() {
    if (stdoutLineBuf) {
      appendLog("stdout", stdoutLineBuf);
      stdoutLineBuf = "";
    }
  }

  // 显示终端输入行
  function showTerminalInput() {
    const inputLine = document.getElementById("terminalInputLine");
    const input = document.getElementById("terminalInput");
    if (inputLine && input) {
      inputLine.style.display = "flex";
      input.value = "";
      setTimeout(() => input.focus(), 50);
    }
  }

  // 隐藏终端输入行
  function hideTerminalInput() {
    const inputLine = document.getElementById("terminalInputLine");
    if (inputLine) inputLine.style.display = "none";
  }

  // 提交终端输入（由 Enter 键触发）
  function submitTerminalInput() {
    const input = document.getElementById("terminalInput");
    if (!input) return;
    const val = input.value;
    hideTerminalInput();
    appendLog("stdout", "❯ " + val);
    if (terminalInputResolve) {
      terminalInputResolve(val);
      terminalInputResolve = null;
    }
  }

  // 运行代码
  async function runCode(code) {
    if (isRunning) {
      if (window.App && window.App.showToast) {
        window.App.showToast("⏳ 代码还在运行中，等它跑完再点哦~", "🐢");
      }
      return;
    }

    isRunning = true;
    setRunButtonState(true);

    // 清屏与重置
    const terminal = document.getElementById("terminalLogs");
    terminal.innerHTML = "";
    stdoutLineBuf = "";
    hideTerminalInput();
    appendLog("system", "🚀 开始运行 Python 代码...");

    const startTime = performance.now();

    // 检查是否包含海龟绘图代码
    const hasTurtle = /import\s+turtle|from\s+turtle/i.test(code);
    if (hasTurtle) {
      TurtleEngine.reset();
      switchTabSafe("turtle");
      appendLog("system", "🐢 侦测到海龟绘图！已自动切换到【海龟画布】视窗~");
    } else {
      switchTabSafe("console");
    }

    try {
      if (!pyodide) {
        appendLog("warning", "⏳ 正在连接 Python 运行环境，初次加载约需数秒，请稍候...");
        await initPyodideEngine();
      }

      if (!pyodide) {
        throw new Error("无法启动 Python 运行环境，请检查网络连接后刷新页面重试。");
      }

      await pyodide.runPythonAsync(code);

      flushStdout();
      const elapsed = ((performance.now() - startTime) / 1000).toFixed(2);

      if (hasTurtle) {
        TurtleEngine.onIdle(() => {
          appendLog("success", `✨ 画作完成！代码运行成功，耗时: ${elapsed} 秒 🎉`);
          ConfettiFX.celebrate();
        });
      } else {
        appendLog("success", `✨ 代码运行成功！耗时: ${elapsed} 秒 🎉`);
        ConfettiFX.celebrate();
      }
    } catch (err) {
      handleRuntimeError(err, code);
      SoundEffects.playWarning();
    } finally {
      isRunning = false;
      setRunButtonState(false);
      hideTerminalInput();
      terminalInputResolve = null;
    }
  }

  function switchTabSafe(name) {
    if (window.App && window.App.switchToTab) {
      window.App.switchToTab(name);
    }
  }

  // 错误诊断与小侦探翻译
  function handleRuntimeError(err, originalCode) {
    flushStdout();
    hideTerminalInput();

    const full = String((err && err.message) ? err.message : err);
    const lines = full.trim().split("\n").map(l => l.trim()).filter(Boolean);
    const lastLine = lines[lines.length - 1] || "未知错误";
    appendLog("error", "❌ 哎呀，程序遇到一点小状况：" + lastLine);

    let tipTitle = "🔍 小侦探正在诊断...";
    let tipContent = "检查一下代码是否有小字母打错了哦！";

    if (full.includes("IndentationError")) {
      tipTitle = "🔍 缩进小楼梯没对齐！";
      tipContent = "Python 非常在乎代码左侧的空格！<br>👉 冒号 <b>:</b> 后面紧跟着的那几行，一定要多按一个 <b>Tab 键</b> 或 <b>4个空格</b> 缩进进去哦！";
    } else if (full.includes("SyntaxError")) {
      tipTitle = "🔍 语法标点符号有迷路的小伙伴！";
      const hasFullWidthPunct = /[：；，（）【】“”‘’！？]/.test(originalCode) || /invalid character/.test(full);
      if (hasFullWidthPunct) {
        tipContent = "代码里好像不小心混入了<b>中文全角标点</b>（如中文逗号、冒号、引号）！<br>👉 赶紧点击编辑器右上角的【🩺 标点体检】按钮，一键修复吧！";
      } else {
        tipContent = "看看是不是括号 <b>()</b> 没有成对闭合？或者 <b>if / for / while</b> 后面漏掉了英文冒号 <b>:</b> 呢？";
      }
    } else if (full.includes("NameError")) {
      const match = full.match(/name '(\w+)' is not defined/);
      const varName = match ? match[1] : "某个变量";
      tipTitle = `🔍 找不到名字为【${varName}】的小帮手！`;
      tipContent = `电脑不认识名字 <b>${varName}</b> 呢！<br>👉 检查一下是不是拼写错误（比如大小写不一致），或者在使用它之前忘记定义了？`;
    } else if (full.includes("TypeError")) {
      tipTitle = "🔍 数据类型对不上哦！";
      tipContent = "是不是把文字（字符串）和数字直接用 <b>+</b> 拼在一起啦？<br>👉 可以试着用 <b>str(数字)</b> 把数字转成文字，或者在 print 里用逗号隔开：<b>print(\"答案:\", 100)</b>！";
    } else if (full.includes("ZeroDivisionError")) {
      tipTitle = "🔍 数学小禁区：数字不能除以 0！";
      tipContent = "在数学魔法里，任何数字都不能除以 0 哦！看看你的除数算式是不是算成 0 啦？";
    } else if (full.includes("ValueError")) {
      tipTitle = "🔍 数值格式不对哦！";
      tipContent = "你想要把一个文字转换成数字，但那个文字里没有数字呢！<br>👉 检查一下 <b>int()</b> 或 <b>float()</b> 里面的内容，确保是纯数字（比如 <b>\"123\"</b>）而不是文字（<b>\"abc\"</b>）哦！";
    } else if (full.includes("IndexError")) {
      tipTitle = "🔍 列表越界啦！";
      tipContent = "你想访问列表中的第某个元素，但那个位置不存在！<br>👉 列表的索引从 <b>0</b> 开始，所以 <b>list[0]</b> 是第一个元素。检查一下你的索引是不是太大了？";
    } else if (full.includes("KeyError")) {
      tipTitle = "🔍 字典里找不到这个钥匙！";
      tipContent = "你想从字典里取一个值，但这个键名不存在！<br>👉 检查一下键名是否拼写正确，或者先用 <b>in</b> 判断一下键是否存在？";
    } else if (full.includes("AttributeError")) {
      const match = full.match(/'(\w+)' object has no attribute '(\w+)'/);
      const objName = match ? match[1] : "某个对象";
      const attrName = match ? match[2] : "某个属性";
      tipTitle = `🔍 【${objName}】没有【${attrName}】这个功能！`;
      tipContent = `对象 <b>${objName}</b> 没有 <b>${attrName}</b> 这个属性或方法哦！<br>👉 检查一下是不是拼写错了？比如 <b>t.colo()</b> 应该是 <b>t.color()</b>？`;
    } else if (full.includes("ImportError") || full.includes("ModuleNotFoundError")) {
      tipTitle = "🔍 找不到这个魔法模块！";
      tipContent = "你想 <b>import</b> 一个不存在的模块！<br>👉 检查一下模块名字是否拼写正确？注意大小写哦！";
    } else if (full.includes("FileNotFoundError")) {
      tipTitle = "🔍 文件找不到啦！";
      tipContent = "你想打开一个文件，但电脑找不到它！<br>👉 检查一下文件名和路径是否写对了？";
    } else if (full.includes("EOFError")) {
      tipTitle = "🔍 input() 遇到意外结束！";
      tipContent = "代码执行到一半，input() 没能获取到输入。<br>👉 可能是你在输入框里点了取消？";
    }

    const terminal = document.getElementById("terminalLogs");
    const tipDiv = document.createElement("div");
    tipDiv.className = "detective-tip-card";
    tipDiv.innerHTML = `
      <div class="detective-header">${tipTitle}</div>
      <div class="detective-body">${tipContent}</div>
    `;
    terminal.appendChild(tipDiv);
    terminal.scrollTop = terminal.scrollHeight;
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

  return {
    init: initPyodideEngine,
    run: runCode,
    handleStdout,
    flushStdout,
    submitTerminalInput,
    hideTerminalInput
  };
})();

// 全局暴露供 Python 运行时调用
window.PythonRunner = PythonRunner;