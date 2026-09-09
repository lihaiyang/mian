/**
 * 🐍 Python Worker - 在 Web Worker 中运行 Pyodide
 */
importScripts('https://cdn.jsdelivr.net/pyodide/v0.26.2/full/pyodide.js');

let pyodide = null;
let inputBuf = null; // Int32Array from SharedArrayBuffer (received from main thread)

// 等待主线程发送 SharedArrayBuffer
self.addEventListener('message', async (event) => {
  const data = event.data;

  if (data.type === 'init') {
    inputBuf = new Int32Array(data.sab);
    await initWorker();
  } else if (data.type === 'run') {
    await runCode(data.code);
  } else if (data.type === 'input-result') {
    if (!inputBuf) return;
    const input = data.value || '';
    const len = Math.min(input.length, 256);
    for (let i = 0; i < len; i++) {
      Atomics.store(inputBuf, 2 + i, input.charCodeAt(i));
    }
    Atomics.store(inputBuf, 1, len);
    Atomics.store(inputBuf, 0, 1);
    Atomics.notify(inputBuf, 0, 1);
  }
});

const ENV_SETUP_CODE = [
  'import sys, types, builtins',
  'from js import self, Atomics',
  '',
  'class WebStdout:',
  '    def write(self, s):',
  '        if s:',
  '            self.postMessage(s)',
  '    def flush(self):',
  '        pass',
  'class WebStderr:',
  '    def write(self, s):',
  '        self.postMessage(s)',
  '    def flush(self):',
  '        pass',
  'sys.stdout = WebStdout()',
  'sys.stderr = WebStderr()',
  '',
  'import json',
  'def _kid_input(prompt_text=""):',
  '    msg = json.dumps({"type": "input", "prompt": str(prompt_text)})',
  '    self.postMessage(msg)',
  '    sab = self.__inputBuf',
  '    while Atomics.load(sab, 0) == 0:',
  '        Atomics.wait(sab, 0, 0)',
  '    length = Atomics.load(sab, 1)',
  '    chars = []',
  '    for i in range(length):',
  '        chars.append(chr(Atomics.load(sab, 2 + i)))',
  '    result = "".join(chars)',
  '    Atomics.store(sab, 0, 0)',
  '    Atomics.store(sab, 1, 0)',
  '    return result',
  'builtins.input = _kid_input',
  '',
  'def _turtle_send(method, *args):',
  '    msg = json.dumps({',
  '        "type": "turtle", "method": method,',
  '        "args": [float(a) if isinstance(a, (int, float)) else str(a) for a in args]',
  '    })',
  '    self.postMessage(msg)',
  'turtle_mod = types.ModuleType("turtle")',
  'class Screen:',
  '    def __init__(self): pass',
  '    def bgcolor(self, c): _turtle_send("bgcolor", c)',
  '    def title(self, s): pass',
  '    def setup(self, *a, **k): pass',
  '    def done(self): pass',
  '    def mainloop(self): pass',
  '    def exitonclick(self): pass',
  '    def tracer(self, *a, **k): pass',
  '    def update(self): pass',
  '    def listen(self): pass',
  'class Turtle:',
  '    def __init__(self): pass',
  '    def forward(self, d): _turtle_send("forward", d)',
  '    def fd(self, d): self.forward(d)',
  '    def backward(self, d): _turtle_send("backward", d)',
  '    def bk(self, d): self.backward(d)',
  '    def right(self, a): _turtle_send("right", a)',
  '    def rt(self, a): self.right(a)',
  '    def left(self, a): _turtle_send("left", a)',
  '    def lt(self, a): self.left(a)',
  '    def circle(self, r, extent=None):',
  '        if extent is None: _turtle_send("circle", r)',
  '        else: _turtle_send("circle", r, extent)',
  '    def color(self, c, fill_c=None): _turtle_send("color", c, fill_c if fill_c else c)',
  '    def pencolor(self, c): _turtle_send("pencolor", c)',
  '    def fillcolor(self, c): _turtle_send("fillcolor", c)',
  '    def pensize(self, s): _turtle_send("pensize", s)',
  '    def width(self, s): self.pensize(s)',
  '    def penup(self): _turtle_send("penup")',
  '    def pu(self): self.penup()',
  '    def up(self): self.penup()',
  '    def pendown(self): _turtle_send("pendown")',
  '    def pd(self): self.pendown()',
  '    def down(self): self.pendown()',
  '    def speed(self, s): _turtle_send("speed", s)',
  '    def goto(self, x, y): _turtle_send("goto", x, y)',
  '    def setpos(self, x, y): self.goto(x, y)',
  '    def setheading(self, a): _turtle_send("setheading", a)',
  '    def seth(self, a): self.setheading(a)',
  '    def setx(self, x): _turtle_send("setx", x)',
  '    def sety(self, y): _turtle_send("sety", y)',
  '    def home(self): _turtle_send("home")',
  '    def dot(self, size=None, color=None): _turtle_send("dot", size, color)',
  '    def write(self, text, *a, **k): _turtle_send("write", text)',
  '    def begin_fill(self): _turtle_send("begin_fill")',
  '    def end_fill(self): _turtle_send("end_fill")',
  '    def clear(self): _turtle_send("clear")',
  '    def reset(self): _turtle_send("reset")',
  '    def hideturtle(self): _turtle_send("hideturtle")',
  '    def ht(self): self.hideturtle()',
  '    def showturtle(self): _turtle_send("showturtle")',
  '    def st(self): self.showturtle()',
  '    def shape(self, s): pass',
  '_default_turtle = Turtle()',
  'turtle_mod.Turtle = Turtle',
  'turtle_mod.Pen = Turtle',
  'turtle_mod.Screen = Screen',
  'turtle_mod.bgcolor = lambda c: _turtle_send("bgcolor", str(c))',
  'turtle_mod.title = lambda s: None',
  'turtle_mod.done = lambda: None',
  'turtle_mod.mainloop = lambda: None',
  'turtle_mod.exitonclick = lambda: None',
  'turtle_mod.tracer = lambda *a, **k: None',
  'turtle_mod.update = lambda: None',
  'turtle_mod.getscreen = lambda: Screen()',
  'turtle_mod.forward = _default_turtle.forward',
  'turtle_mod.fd = _default_turtle.fd',
  'turtle_mod.backward = _default_turtle.backward',
  'turtle_mod.bk = _default_turtle.bk',
  'turtle_mod.right = _default_turtle.right',
  'turtle_mod.rt = _default_turtle.rt',
  'turtle_mod.left = _default_turtle.left',
  'turtle_mod.lt = _default_turtle.lt',
  'turtle_mod.circle = _default_turtle.circle',
  'turtle_mod.color = _default_turtle.color',
  'turtle_mod.pencolor = _default_turtle.pencolor',
  'turtle_mod.fillcolor = _default_turtle.fillcolor',
  'turtle_mod.pensize = _default_turtle.pensize',
  'turtle_mod.width = _default_turtle.width',
  'turtle_mod.penup = _default_turtle.penup',
  'turtle_mod.pu = _default_turtle.pu',
  'turtle_mod.up = _default_turtle.up',
  'turtle_mod.pendown = _default_turtle.pendown',
  'turtle_mod.pd = _default_turtle.pd',
  'turtle_mod.down = _default_turtle.down',
  'turtle_mod.speed = _default_turtle.speed',
  'turtle_mod.goto = _default_turtle.goto',
  'turtle_mod.setpos = _default_turtle.setpos',
  'turtle_mod.setheading = _default_turtle.setheading',
  'turtle_mod.seth = _default_turtle.seth',
  'turtle_mod.setx = _default_turtle.setx',
  'turtle_mod.sety = _default_turtle.sety',
  'turtle_mod.home = _default_turtle.home',
  'turtle_mod.dot = _default_turtle.dot',
  'turtle_mod.write = _default_turtle.write',
  'turtle_mod.begin_fill = _default_turtle.begin_fill',
  'turtle_mod.end_fill = _default_turtle.end_fill',
  'turtle_mod.clear = _default_turtle.clear',
  'turtle_mod.reset = _default_turtle.reset',
  'turtle_mod.hideturtle = _default_turtle.hideturtle',
  'turtle_mod.ht = _default_turtle.ht',
  'turtle_mod.showturtle = _default_turtle.showturtle',
  'turtle_mod.st = _default_turtle.st',
  'sys.modules["turtle"] = turtle_mod',
].join('\n');

async function initWorker() {
  try {
    pyodide = await loadPyodide({
      indexURL: 'https://cdn.jsdelivr.net/pyodide/v0.26.2/full/'
    });
    self.__inputBuf = inputBuf;
    await pyodide.runPythonAsync(ENV_SETUP_CODE);
    self.postMessage({ type: 'ready' });
  } catch (err) {
    self.postMessage({ type: 'error', text: 'Worker初始化失败: ' + err.message });
  }
}

async function runCode(code) {
  try {
    const hasTurtle = /import\\s+turtle|from\\s+turtle/i.test(code);
    if (hasTurtle) {
      self.postMessage({ type: 'turtle-detect' });
    }
    await pyodide.runPythonAsync(code);
    self.postMessage({ type: 'done' });
  } catch (err) {
    self.postMessage({ type: 'error', text: err.message || String(err) });
  }
}
