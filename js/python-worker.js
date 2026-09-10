/**
 * 🐍 Python 浏览器端执行核心 - Web Worker 版本
 * 在 Web Worker 中运行 Pyodide，通过 SharedArrayBuffer + Atomics
 * 实现同步等待输入，主线程保持响应式渲染，终端命令行式输入。
 */
importScripts('/vendor/pyodide/pyodide.js');

let pyodide = null;
let inputBuf = null;

self.addEventListener('message', async (event) => {
  const data = event.data;
  if (data.type === 'init') {
    inputBuf = new Int32Array(data.sab);
    await initWorker();
  } else if (data.type === 'run') {
    await runCode(data.code);
  }
});

const ENV_SETUP_CODE = "import sys, types, builtins\nfrom js import self as js_self, Atomics\n\nclass WebStdout:\n    def write(self, s):\n        if s:\n            js_self.postMessage(s)\n    def flush(self):\n        pass\nclass WebStderr:\n    def write(self, s):\n        js_self.postMessage(s)\n    def flush(self):\n        pass\nsys.stdout = WebStdout()\nsys.stderr = WebStderr()\n\nimport json\ndef _kid_input(prompt_text=\"\"):\n    msg = json.dumps({\"type\": \"input\", \"prompt\": str(prompt_text)})\n    js_self.postMessage(msg)\n    sab = js_self.__inputBuf\n    while Atomics.load(sab, 0) == 0:\n        Atomics.wait(sab, 0, 0)\n    length = Atomics.load(sab, 1)\n    chars = []\n    for i in range(length):\n        chars.append(chr(Atomics.load(sab, 2 + i)))\n    result = \"\".join(chars)\n    Atomics.store(sab, 0, 0)\n    Atomics.store(sab, 1, 0)\n    return result\nbuiltins.input = _kid_input\n\ndef _turtle_send(method, *args):\n    msg = json.dumps({\n        \"type\": \"turtle\", \"method\": method,\n        \"args\": [float(a) if isinstance(a, (int, float)) else str(a) for a in args]\n    })\n    js_self.postMessage(msg)\nturtle_mod = types.ModuleType(\"turtle\")\nclass Screen:\n    def __init__(self): pass\n    def bgcolor(self, c): _turtle_send(\"bgcolor\", c)\n    def title(self, s): pass\n    def setup(self, *a, **k): pass\n    def done(self): pass\n    def mainloop(self): pass\n    def exitonclick(self): pass\n    def tracer(self, *a, **k): pass\n    def update(self): pass\n    def listen(self): pass\nclass Turtle:\n    def __init__(self): pass\n    def forward(self, d): _turtle_send(\"forward\", d)\n    def fd(self, d): self.forward(d)\n    def backward(self, d): _turtle_send(\"backward\", d)\n    def bk(self, d): self.backward(d)\n    def right(self, a): _turtle_send(\"right\", a)\n    def rt(self, a): self.right(a)\n    def left(self, a): _turtle_send(\"left\", a)\n    def lt(self, a): self.left(a)\n    def circle(self, r, extent=None):\n        if extent is None: _turtle_send(\"circle\", r)\n        else: _turtle_send(\"circle\", r, extent)\n    def color(self, c, fill_c=None): _turtle_send(\"color\", c, fill_c if fill_c else c)\n    def pencolor(self, c): _turtle_send(\"pencolor\", c)\n    def fillcolor(self, c): _turtle_send(\"fillcolor\", c)\n    def pensize(self, s): _turtle_send(\"pensize\", s)\n    def width(self, s): self.pensize(s)\n    def penup(self): _turtle_send(\"penup\")\n    def pu(self): self.penup()\n    def up(self): self.penup()\n    def pendown(self): _turtle_send(\"pendown\")\n    def pd(self): self.pendown()\n    def down(self): self.pendown()\n    def speed(self, s): _turtle_send(\"speed\", s)\n    def goto(self, x, y): _turtle_send(\"goto\", x, y)\n    def setpos(self, x, y): self.goto(x, y)\n    def setheading(self, a): _turtle_send(\"setheading\", a)\n    def seth(self, a): self.setheading(a)\n    def setx(self, x): _turtle_send(\"setx\", x)\n    def sety(self, y): _turtle_send(\"sety\", y)\n    def home(self): _turtle_send(\"home\")\n    def dot(self, size=None, color=None): _turtle_send(\"dot\", size, color)\n    def write(self, text, *a, **k): _turtle_send(\"write\", text)\n    def begin_fill(self): _turtle_send(\"begin_fill\")\n    def end_fill(self): _turtle_send(\"end_fill\")\n    def clear(self): _turtle_send(\"clear\")\n    def reset(self): _turtle_send(\"reset\")\n    def hideturtle(self): _turtle_send(\"hideturtle\")\n    def ht(self): self.hideturtle()\n    def showturtle(self): _turtle_send(\"showturtle\")\n    def st(self): self.showturtle()\n    def shape(self, s): pass\n_default_turtle = Turtle()\nturtle_mod.Turtle = Turtle\nturtle_mod.Pen = Turtle\nturtle_mod.Screen = Screen\nturtle_mod.bgcolor = lambda c: _turtle_send(\"bgcolor\", str(c))\nturtle_mod.title = lambda s: None\nturtle_mod.done = lambda: None\nturtle_mod.mainloop = lambda: None\nturtle_mod.exitonclick = lambda: None\nturtle_mod.tracer = lambda *a, **k: None\nturtle_mod.update = lambda: None\nturtle_mod.getscreen = lambda: Screen()\nturtle_mod.forward = _default_turtle.forward\nturtle_mod.fd = _default_turtle.fd\nturtle_mod.backward = _default_turtle.backward\nturtle_mod.bk = _default_turtle.bk\nturtle_mod.right = _default_turtle.right\nturtle_mod.rt = _default_turtle.rt\nturtle_mod.left = _default_turtle.left\nturtle_mod.lt = _default_turtle.lt\nturtle_mod.circle = _default_turtle.circle\nturtle_mod.color = _default_turtle.color\nturtle_mod.pencolor = _default_turtle.pencolor\nturtle_mod.fillcolor = _default_turtle.fillcolor\nturtle_mod.pensize = _default_turtle.pensize\nturtle_mod.width = _default_turtle.width\nturtle_mod.penup = _default_turtle.penup\nturtle_mod.pu = _default_turtle.pu\nturtle_mod.up = _default_turtle.up\nturtle_mod.pendown = _default_turtle.pendown\nturtle_mod.pd = _default_turtle.pd\nturtle_mod.down = _default_turtle.down\nturtle_mod.speed = _default_turtle.speed\nturtle_mod.goto = _default_turtle.goto\nturtle_mod.setpos = _default_turtle.setpos\nturtle_mod.setheading = _default_turtle.setheading\nturtle_mod.seth = _default_turtle.seth\nturtle_mod.setx = _default_turtle.setx\nturtle_mod.sety = _default_turtle.sety\nturtle_mod.home = _default_turtle.home\nturtle_mod.dot = _default_turtle.dot\nturtle_mod.write = _default_turtle.write\nturtle_mod.begin_fill = _default_turtle.begin_fill\nturtle_mod.end_fill = _default_turtle.end_fill\nturtle_mod.clear = _default_turtle.clear\nturtle_mod.reset = _default_turtle.reset\nturtle_mod.hideturtle = _default_turtle.hideturtle\nturtle_mod.ht = _default_turtle.ht\nturtle_mod.showturtle = _default_turtle.showturtle\nturtle_mod.st = _default_turtle.st\nsys.modules[\"turtle\"] = turtle_mod";

async function initWorker() {
  try {
    pyodide = await loadPyodide({ indexURL: '/vendor/pyodide/' });
    self.__inputBuf = inputBuf;
    await pyodide.runPythonAsync(ENV_SETUP_CODE);
    self.postMessage({ type: 'ready' });
  } catch (err) {
    self.postMessage({ type: 'error', text: '初始化失败: ' + (err.message || String(err)) });
  }
}

async function runCode(code) {
  try {
    const hasTurtle = /import\s+turtle|from\s+turtle/i.test(code);
    if (hasTurtle) {
      self.postMessage({ type: 'turtle-detect' });
    }
    await pyodide.runPythonAsync(code);
    self.postMessage({ type: 'done' });
  } catch (err) {
    self.postMessage({ type: 'error', text: err.message || String(err) });
  }
}
