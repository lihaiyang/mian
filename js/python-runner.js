/**
 * 🐍 Python 浏览器端执行核心 (Pyodide WebAssembly Engine + Turtle Bridge)
 * 包含：标准输出按行缓冲捕获、同步交互式 input()、海龟画图注入、儿童化「小侦探」报错诊断
 */
const PythonRunner = (() => {
  let pyodide = null;
  let isInitializing = false;
  let isRunning = false;
  let onInitCallbacks = [];
  let stdoutLineBuf = "";

  const ENV_SETUP_CODE = `
import sys, types, builtins
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

# 同步交互式 input：终端先记录提问文字，再弹浏览器原生输入框（同步返回，Python 可直接使用）
def _kid_input(prompt_text=""):
    return window.PythonRunner.syncInput(str(prompt_text))

builtins.input = _kid_input

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
        # 画布已在每次运行前由运行器统一重置，这里不再重置，保证多海龟共存
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

# 单例海龟，供函数式调用（turtle.forward(...) 等）
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

      // 兜底：stdin 同步读取（正常情况下 input 已被 builtins 覆盖）
      pyodide.setStdin({
        stdin: () => {
          return window.prompt("👉 请输入内容：") || "";
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
      // 唤醒所有等待中的调用方，避免永久挂起
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
   * stdout 按行缓冲：Python 的 print("a", "b") 会产生多次 write（"a", " ", "b", "\n"），
   * 必须缓冲拼接，遇到换行才输出，否则控制台会碎成好几行。
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

  // 程序结束/报错/等待输入前，把不带换行的残留输出冲刷出来
  function flushStdout() {
    if (stdoutLineBuf) {
      appendLog("stdout", stdoutLineBuf);
      stdoutLineBuf = "";
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
    appendLog("system", "🚀 开始运行 Python 代码...");

    const startTime = performance.now();

    // 检查是否包含海龟绘图代码，若是则自动切换并重置画布
    const hasTurtle = /import\s+turtle|from\s+turtle/i.test(code);
    if (hasTurtle) {
      TurtleEngine.reset();
      switchTabSafe("turtle");
      appendLog("system", "🐢 侦测到海龟绘图！已自动切换到【海龟画布】视窗~");
    } else {
      switchTabSafe("console");
    }

    try {
      // 保证引擎已加载
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

      // 海龟作画是异步逐帧播放的：等画作全部完成后再宣布成功并撒花
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
    }
  }

  function switchTabSafe(name) {
    if (window.App && window.App.switchToTab) {
      window.App.switchToTab(name);
    }
  }

  // 同步交互式输入：先在终端回显提示文字，再用浏览器原生输入框同步取值
  // （Python 执行时主线程被阻塞，无法使用异步输入条，window.prompt 是唯一可靠同步方案）
  function syncInput(promptText) {
    flushStdout();
    appendLog("stdout", "👉 " + promptText);
    const val = window.prompt(promptText || "请输入：");
    appendLog("system", "[输入] " + (val === null ? "(空)" : val));
    return val === null ? "" : val;
  }

  // 错误诊断与小侦探翻译（专为 10 岁孩子设计！）
  function handleRuntimeError(err, originalCode) {
    flushStdout();

    // PythonError.message 包含完整 traceback，只取最后一行异常摘要，避免吓到小朋友
    const full = String((err && err.message) ? err.message : err);
    const lines = full.trim().split("\n").map(l => l.trim()).filter(Boolean);
    const lastLine = lines[lines.length - 1] || "未知错误";
    appendLog("error", "❌ 哎呀，程序遇到一点小状况：" + lastLine);

    // 智能小侦探卡片诊断
    let tipTitle = "🔍 小侦探正在诊断...";
    let tipContent = "检查一下代码是否有小字母打错了哦！";

    if (full.includes("IndentationError")) {
      tipTitle = "🔍 缩进小楼梯没对齐！";
      tipContent = "Python 非常在乎代码左侧的空格！\n👉 冒号 <b>:</b> 后面紧跟着的那几行，一定要多按一个 <b>Tab 键</b> 或 <b>4个空格</b> 缩进进去哦！";
    } else if (full.includes("SyntaxError")) {
      tipTitle = "🔍 语法标点符号有迷路的小伙伴！";
      const hasFullWidthPunct = /[：；，（）【】“”‘’！？]/.test(originalCode) || /invalid character/.test(full);
      if (hasFullWidthPunct) {
        tipContent = "代码里好像不小心混入了<b>中文全角标点</b>（如中文逗号、冒号、引号）！\n👉 赶紧点击编辑器右上角的【🩺 标点体检】按钮，一键修复吧！";
      } else {
        tipContent = "看看是不是括号 <b>()</b> 没有成对闭合？或者 <b>if / for / while</b> 后面漏掉了英文冒号 <b>:</b> 呢？";
      }
    } else if (full.includes("NameError")) {
      const match = full.match(/name '(\w+)' is not defined/);
      const varName = match ? match[1] : "某个变量";
      tipTitle = `🔍 找不到名字为【${varName}】的小帮手！`;
      tipContent = `电脑不认识名字 <b>${varName}</b> 呢！\n👉 检查一下是不是拼写错误（比如大小写不一致），或者在使用它之前忘记定义了？`;
    } else if (full.includes("TypeError")) {
      tipTitle = "🔍 数据类型对不上哦！";
      tipContent = "是不是把文字（字符串）和数字直接用 <b>+</b> 拼在一起啦？\n👉 可以试着用 <b>str(数字)</b> 把数字转成文字，或者在 print 里用逗号隔开：<b>print(\"答案:\", 100)</b>！";
    } else if (full.includes("ZeroDivisionError")) {
      tipTitle = "🔍 数学小禁区：数字不能除以 0！";
      tipContent = "在数学魔法里，任何数字都不能除以 0 哦！看看你的除数算式是不是算成 0 啦？";
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
    syncInput,
    handleStdout,
    flushStdout
  };
})();

// 全局暴露供 Python 运行时调用
window.PythonRunner = PythonRunner;
