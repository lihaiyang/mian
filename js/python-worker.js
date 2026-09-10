/**
 * 🐍 Python Worker - 在 Web Worker 中运行 Pyodide
 *
 * - stdout/stderr 经过批量缓冲后回传主线程（减少 postMessage 次数）
 * - input() 通过 SharedArrayBuffer + Atomics.wait 阻塞等待主线程输入
 * - 支持主线程通过 interruptBuffer 发送 SIGINT 中断死循环
 */
importScripts('/vendor/pyodide/pyodide.js');

let pyodide = null;
let inputBuf = null;

// ---- 输出批量缓冲 ----
const OUT_FLUSH_MS = 16;
const OUT_FLUSH_CHARS = 16 * 1024;
let outBuf = [];
let outChars = 0;
let outTimer = null;

function enqueueOutput(s) {
  if (!s) return;
  outBuf.push(s);
  outChars += s.length;
  if (outChars >= OUT_FLUSH_CHARS) {
    flushOutput();
    return;
  }
  if (!outTimer) outTimer = setTimeout(flushOutput, OUT_FLUSH_MS);
}

function flushOutput() {
  if (outTimer) {
    clearTimeout(outTimer);
    outTimer = null;
  }
  if (!outBuf.length) return;
  self.postMessage({ type: 'stdout-batch', text: outBuf.join('') });
  outBuf = [];
  outChars = 0;
}

// 暴露给 Python 调用（注意：不能以双下划线开头，否则类体内会被 Python 名称改写）
self.pyEnqueueOutput = enqueueOutput;
self.pyFlushOutput = flushOutput;

self.addEventListener('message', async (event) => {
  const data = event.data;
  if (data.type === 'init') {
    inputBuf = new Int32Array(data.sab);
    if (data.interruptSab) {
      self.__interruptBuf = new Int32Array(data.interruptSab);
    }
    await initWorker();
  } else if (data.type === 'run') {
    await runCode(data.code);
  }
});

const ENV_SETUP_CODE = "import sys, types, builtins\nfrom js import self as js_self, Atomics\n\nclass WebStdout:\n    def write(self, s):\n        if s:\n            js_self.pyEnqueueOutput(str(s))\n    def flush(self):\n        pass\nclass WebStderr:\n    def write(self, s):\n        pass\n    def flush(self):\n        pass\nsys.stdout = WebStdout()\nsys.stderr = WebStderr()\n\nimport json\ndef _kid_input(prompt_text=\"\"):\n    msg = json.dumps({\"type\": \"input\", \"prompt\": str(prompt_text)})\n    js_self.pyFlushOutput()\n    js_self.postMessage(msg)\n    sab = js_self.pyInputBuf\n    while Atomics.load(sab, 0) == 0:\n        Atomics.wait(sab, 0, 0)\n    length = Atomics.load(sab, 1)\n    chars = []\n    for i in range(length):\n        chars.append(chr(Atomics.load(sab, 2 + i)))\n    result = \"\".join(chars)\n    Atomics.store(sab, 0, 0)\n    Atomics.store(sab, 1, 0)\n    return result\nbuiltins.input = _kid_input\n\ndef _turtle_send(method, *args):\n    msg = json.dumps({\n        \"type\": \"turtle\", \"method\": method,\n        \"args\": [float(a) if isinstance(a, (int, float)) else str(a) for a in args]\n    })\n    js_self.postMessage(msg)\nturtle_mod = types.ModuleType(\"turtle\")\nclass Screen:\n    def __init__(self): pass\n    def bgcolor(self, c): _turtle_send(\"bgcolor\", c)\n    def title(self, s): pass\n    def setup(self, *a, **k): pass\n    def done(self): pass\n    def mainloop(self): pass\n    def exitonclick(self): pass\n    def tracer(self, *a, **k): pass\n    def update(self): pass\n    def listen(self): pass\nclass Turtle:\n    def __init__(self): pass\n    def forward(self, d): _turtle_send(\"forward\", d)\n    def fd(self, d): self.forward(d)\n    def backward(self, d): _turtle_send(\"backward\", d)\n    def bk(self, d): self.backward(d)\n    def right(self, a): _turtle_send(\"right\", a)\n    def rt(self, a): self.right(a)\n    def left(self, a): _turtle_send(\"left\", a)\n    def lt(self, a): self.left(a)\n    def circle(self, r, extent=None):\n        if extent is None: _turtle_send(\"circle\", r)\n        else: _turtle_send(\"circle\", r, extent)\n    def color(self, c, fill_c=None): _turtle_send(\"color\", c, fill_c if fill_c else c)\n    def pencolor(self, c): _turtle_send(\"pencolor\", c)\n    def fillcolor(self, c): _turtle_send(\"fillcolor\", c)\n    def pensize(self, s): _turtle_send(\"pensize\", s)\n    def width(self, s): self.pensize(s)\n    def penup(self): _turtle_send(\"penup\")\n    def pu(self): self.penup()\n    def up(self): self.penup()\n    def pendown(self): _turtle_send(\"pendown\")\n    def pd(self): self.pendown()\n    def down(self): self.pendown()\n    def speed(self, s): _turtle_send(\"speed\", s)\n    def goto(self, x, y): _turtle_send(\"goto\", x, y)\n    def setpos(self, x, y): self.goto(x, y)\n    def setheading(self, a): _turtle_send(\"setheading\", a)\n    def seth(self, a): self.setheading(a)\n    def setx(self, x): _turtle_send(\"setx\", x)\n    def sety(self, y): _turtle_send(\"sety\", y)\n    def home(self): _turtle_send(\"home\")\n    def dot(self, size=None, color=None): _turtle_send(\"dot\", size, color)\n    def write(self, text, *a, **k): _turtle_send(\"write\", text)\n    def begin_fill(self): _turtle_send(\"begin_fill\")\n    def end_fill(self): _turtle_send(\"end_fill\")\n    def clear(self): _turtle_send(\"clear\")\n    def reset(self): _turtle_send(\"reset\")\n    def hideturtle(self): _turtle_send(\"hideturtle\")\n    def ht(self): self.hideturtle()\n    def showturtle(self): _turtle_send(\"showturtle\")\n    def st(self): self.showturtle()\n    def shape(self, s): pass\n_default_turtle = Turtle()\nturtle_mod.Turtle = Turtle\nturtle_mod.Pen = Turtle\nturtle_mod.Screen = Screen\nturtle_mod.bgcolor = lambda c: _turtle_send(\"bgcolor\", str(c))\nturtle_mod.title = lambda s: None\nturtle_mod.done = lambda: None\nturtle_mod.mainloop = lambda: None\nturtle_mod.exitonclick = lambda: None\nturtle_mod.tracer = lambda *a, **k: None\nturtle_mod.update = lambda: None\nturtle_mod.getscreen = lambda: Screen()\nturtle_mod.forward = _default_turtle.forward\nturtle_mod.fd = _default_turtle.fd\nturtle_mod.backward = _default_turtle.backward\nturtle_mod.bk = _default_turtle.bk\nturtle_mod.right = _default_turtle.right\nturtle_mod.rt = _default_turtle.rt\nturtle_mod.left = _default_turtle.left\nturtle_mod.lt = _default_turtle.lt\nturtle_mod.circle = _default_turtle.circle\nturtle_mod.color = _default_turtle.color\nturtle_mod.pencolor = _default_turtle.pencolor\nturtle_mod.fillcolor = _default_turtle.fillcolor\nturtle_mod.pensize = _default_turtle.pensize\nturtle_mod.width = _default_turtle.width\nturtle_mod.penup = _default_turtle.penup\nturtle_mod.pu = _default_turtle.pu\nturtle_mod.up = _default_turtle.up\nturtle_mod.pendown = _default_turtle.pendown\nturtle_mod.pd = _default_turtle.pd\nturtle_mod.down = _default_turtle.down\nturtle_mod.speed = _default_turtle.speed\nturtle_mod.goto = _default_turtle.goto\nturtle_mod.setpos = _default_turtle.setpos\nturtle_mod.setheading = _default_turtle.setheading\nturtle_mod.seth = _default_turtle.seth\nturtle_mod.setx = _default_turtle.setx\nturtle_mod.sety = _default_turtle.sety\nturtle_mod.home = _default_turtle.home\nturtle_mod.dot = _default_turtle.dot\nturtle_mod.write = _default_turtle.write\nturtle_mod.begin_fill = _default_turtle.begin_fill\nturtle_mod.end_fill = _default_turtle.end_fill\nturtle_mod.clear = _default_turtle.clear\nturtle_mod.reset = _default_turtle.reset\nturtle_mod.hideturtle = _default_turtle.hideturtle\nturtle_mod.ht = _default_turtle.ht\nturtle_mod.showturtle = _default_turtle.showturtle\nturtle_mod.st = _default_turtle.st\nsys.modules[\"turtle\"] = turtle_mod";

async function initWorker() {
  try {
    pyodide = await loadPyodide({ indexURL: '/vendor/pyodide/' });

    self.pyInputBuf = inputBuf;

    // 启用中断支持：主线程写入 2 即可触发 KeyboardInterrupt
    if (self.__interruptBuf && typeof pyodide.setInterruptBuffer === 'function') {
      try {
        pyodide.setInterruptBuffer(self.__interruptBuf);
      } catch (e) {
        console.warn('setInterruptBuffer failed:', e);
      }
    }

    await pyodide.runPythonAsync(ENV_SETUP_CODE);
    flushOutput();
    self.postMessage({ type: 'ready' });
  } catch (err) {
    flushOutput();
    self.postMessage({ type: 'error', text: '初始化失败: ' + (err && err.message ? err.message : String(err)) });
  }
}

function formatPythonError(err) {
  let msg = (err && err.message) ? String(err.message) : String(err);
  if (!msg || msg === 'PythonError') {
    try {
      const tb = pyodide.runPython("import traceback; traceback.format_exc()");
      if (tb && String(tb).indexOf('NoneType: None') === -1) msg = String(tb);
    } catch (e) { /* 忽略 */ }
  }
  return msg || '未知错误';
}

async function runCode(code) {
  // 每次运行前复位中断信号与停止标志
  if (self.__interruptBuf) {
    Atomics.store(self.__interruptBuf, 0, 0);
    Atomics.store(self.__interruptBuf, 1, 0);
  }

  const hasTurtle = /import[\s]+turtle|from[\s]+turtle/i.test(code);
  if (hasTurtle) {
    self.postMessage({ type: 'turtle-detect' });
  }

  // 用 Python 层捕获异常：可拿到完整可读的 traceback（供儿童友好提示解析）
  const wrapped = [
    'import traceback',
    'try:',
    '    exec(compile(' + JSON.stringify(code) + ', "<学生代码>", "exec"), globals())',
    '    __kid_err = ""',
    'except BaseException:',
    '    __kid_err = traceback.format_exc()',
    '__kid_err',
  ].join(String.fromCharCode(10));

  try {
    const errText = await pyodide.runPythonAsync(wrapped);
    flushOutput();

    const stopped = self.__interruptBuf && Atomics.load(self.__interruptBuf, 1) === 1;
    if (self.__interruptBuf) {
      Atomics.store(self.__interruptBuf, 0, 0);
      Atomics.store(self.__interruptBuf, 1, 0);
    }

    if (stopped) {
      self.postMessage({ type: 'stopped' });
    } else if (errText) {
      self.postMessage({ type: 'error', text: String(errText) });
    } else {
      self.postMessage({ type: 'done' });
    }
  } catch (err) {
    flushOutput();
    if (self.__interruptBuf) {
      Atomics.store(self.__interruptBuf, 0, 0);
      Atomics.store(self.__interruptBuf, 1, 0);
    }
    self.postMessage({ type: 'error', text: formatPythonError(err) });
  }
}
