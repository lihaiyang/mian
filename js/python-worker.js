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


// ================= 第三方库自动加载 =================
const STDLIB_SKIP = new Set(["sys","os","os.path","math","random","time","json","re","collections","itertools","functools","datetime","statistics","decimal","fractions","string","unicodedata","typing","dataclasses","enum","abc","copy","heapq","bisect","array","queue","textwrap","pprint","csv","io","pathlib","hashlib","base64","uuid","pickle","secrets","platform","traceback","warnings","contextlib","operator","numbers","cmath","keyword","inspect","ast","dis","gc","weakref","threading","asyncio","glob","shutil","tempfile","subprocess","importlib","pkgutil","token","tokenize","types","builtins","js","pyodide","micropip","sqlite3","zlib","gzip","tarfile","zipfile","xml","html","urllib","http","socket","ssl","email","mimetypes","locale","calendar","zoneinfo","turtle","antigravity","this","code","codeop","compileall","site","sysconfig","signal","errno","stat","fnmatch","filecmp","difflib","stringprep","readline","rlcompleter","pdb","cProfile","timeit","venv","unittest","doctest","pydoc","getpass","gettext","struct","binascii","codecs","encodings","msvcrt","nt","posix","_thread","atexit","select","selectors","hmac","ssl"]);
const loadedPackages = new Set();
const failedPackages = new Set();

function extractImportNames(code) {
  const names = new Set();
  const re = /^[ \t]*(?:import|from)[ \t]+([A-Za-z_][A-Za-z0-9_]*)/gm;
  let m;
  while ((m = re.exec(code)) !== null) names.add(m[1]);
  return Array.from(names);
}

async function ensurePackages(code) {
  const names = extractImportNames(code).filter(
    n => !STDLIB_SKIP.has(n) && !loadedPackages.has(n) && !failedPackages.has(n)
  );
  if (!names.length) return;

  self.postMessage({ type: 'packages-loading', names: names });
  for (const name of names) {
    try {
      // 先试 Pyodide 官方包
      await pyodide.loadPackage(name);
      loadedPackages.add(name);
      self.postMessage({ type: 'package-ok', name: name });
    } catch (e1) {
      try {
        // 再试 PyPI（micropip）
        await pyodide.runPythonAsync(
          'import micropip' + String.fromCharCode(10) +
          'await micropip.install(' + JSON.stringify(name) + ')'
        );
        loadedPackages.add(name);
        self.postMessage({ type: 'package-ok', name: name });
      } catch (e2) {
        failedPackages.add(name);
        self.postMessage({ type: 'package-fail', name: name, reason: String((e2 && e2.message) || e2).slice(0, 200) });
        console.warn('package load failed:', name, e1 && e1.message, e2 && e2.message);
      }
    }
  }
}

// ================= 运行后的变量收集（变量望远镜） =================
async function collectVariables() {
  try {
    const json = await pyodide.runPythonAsync(VARS_CODE);
    const list = JSON.parse(String(json || '[]'));
    if (list.length) self.postMessage({ type: 'vars', list: list });
  } catch (e) { /* 变量查看失败不影响主流程 */ }
}

const VARS_CODE = "import json as __kid_json\n__kid_skip = {\"sys\",\"types\",\"builtins\",\"turtle_mod\",\"json\",\"js_self\",\"Atomics\",\"__kid_json\",\"__kid_err\",\"__kid_skip\",\"traceback\"}\n__kid_vars = []\nfor __k, __v in list(globals().items()):\n    if __k.startswith(\"_\"): continue\n    if __k in __kid_skip: continue\n    __t = type(__v).__name__\n    if __t in (\"module\",\"function\",\"type\",\"builtin_function_or_method\",\"method\",\"classmethod\",\"staticmethod\"): continue\n    try:\n        __r = repr(__v)\n    except Exception:\n        __r = \"(无法显示)\"\n    if len(__r) > 140: __r = __r[:140] + \" ...\"\n    __kid_vars.append({\"name\": __k, \"value\": __r, \"type\": __t})\n    if len(__kid_vars) >= 24: break\n__kid_json.dumps(__kid_vars)";

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
// 单步调试时判断用户是否按了「停止」（Python 侧轮询用）
self.pyStepStopped = function () {
  return !!(self.__interruptBuf && Atomics.load(self.__interruptBuf, 1) === 1);
};

self.addEventListener('message', async (event) => {
  const data = event.data;
  if (data.type === 'init') {
    inputBuf = new Int32Array(data.sab);
    if (data.interruptSab) {
      self.__interruptBuf = new Int32Array(data.interruptSab);
    }
    initVfsFiles = Array.isArray(data.vfs) ? data.vfs : [];
    await initWorker();
  } else if (data.type === 'run') {
    await runCode(data.code, !!data.stepping);
  }
});

const ENV_SETUP_CODE = "import sys, types, builtins\nfrom js import self as js_self, Atomics\n\nclass WebStdout:\n    def write(self, s):\n        if s:\n            js_self.pyEnqueueOutput(str(s))\n    def flush(self):\n        pass\nclass WebStderr:\n    def write(self, s):\n        pass\n    def flush(self):\n        pass\nsys.stdout = WebStdout()\nsys.stderr = WebStderr()\n\nimport json\ndef _kid_input(prompt_text=\"\"):\n    msg = json.dumps({\"type\": \"input\", \"prompt\": str(prompt_text)})\n    js_self.pyFlushOutput()\n    js_self.postMessage(msg)\n    sab = js_self.pyInputBuf\n    while Atomics.load(sab, 0) == 0:\n        Atomics.wait(sab, 0, 0)\n    length = Atomics.load(sab, 1)\n    chars = []\n    for i in range(length):\n        chars.append(chr(Atomics.load(sab, 2 + i)))\n    result = \"\".join(chars)\n    Atomics.store(sab, 0, 0)\n    Atomics.store(sab, 1, 0)\n    return result\nbuiltins.input = _kid_input\n\ndef _turtle_send(method, *args):\n    msg = json.dumps({\n        \"type\": \"turtle\", \"method\": method,\n        \"args\": [float(a) if isinstance(a, (int, float)) else str(a) for a in args]\n    })\n    js_self.postMessage(msg)\nturtle_mod = types.ModuleType(\"turtle\")\nclass Screen:\n    def __init__(self): pass\n    def bgcolor(self, c): _turtle_send(\"bgcolor\", c)\n    def title(self, s): pass\n    def setup(self, *a, **k): pass\n    def done(self): pass\n    def mainloop(self): pass\n    def exitonclick(self): pass\n    def tracer(self, *a, **k): pass\n    def update(self): pass\n    def listen(self): pass\nclass Turtle:\n    def __init__(self): pass\n    def forward(self, d): _turtle_send(\"forward\", d)\n    def fd(self, d): self.forward(d)\n    def backward(self, d): _turtle_send(\"backward\", d)\n    def bk(self, d): self.backward(d)\n    def right(self, a): _turtle_send(\"right\", a)\n    def rt(self, a): self.right(a)\n    def left(self, a): _turtle_send(\"left\", a)\n    def lt(self, a): self.left(a)\n    def circle(self, r, extent=None):\n        if extent is None: _turtle_send(\"circle\", r)\n        else: _turtle_send(\"circle\", r, extent)\n    def color(self, c, fill_c=None): _turtle_send(\"color\", c, fill_c if fill_c else c)\n    def pencolor(self, c): _turtle_send(\"pencolor\", c)\n    def fillcolor(self, c): _turtle_send(\"fillcolor\", c)\n    def pensize(self, s): _turtle_send(\"pensize\", s)\n    def width(self, s): self.pensize(s)\n    def penup(self): _turtle_send(\"penup\")\n    def pu(self): self.penup()\n    def up(self): self.penup()\n    def pendown(self): _turtle_send(\"pendown\")\n    def pd(self): self.pendown()\n    def down(self): self.pendown()\n    def speed(self, s): _turtle_send(\"speed\", s)\n    def goto(self, x, y): _turtle_send(\"goto\", x, y)\n    def setpos(self, x, y): self.goto(x, y)\n    def setheading(self, a): _turtle_send(\"setheading\", a)\n    def seth(self, a): self.setheading(a)\n    def setx(self, x): _turtle_send(\"setx\", x)\n    def sety(self, y): _turtle_send(\"sety\", y)\n    def home(self): _turtle_send(\"home\")\n    def dot(self, size=None, color=None): _turtle_send(\"dot\", size, color)\n    def write(self, text, *a, **k): _turtle_send(\"write\", text)\n    def begin_fill(self): _turtle_send(\"begin_fill\")\n    def end_fill(self): _turtle_send(\"end_fill\")\n    def clear(self): _turtle_send(\"clear\")\n    def reset(self): _turtle_send(\"reset\")\n    def hideturtle(self): _turtle_send(\"hideturtle\")\n    def ht(self): self.hideturtle()\n    def showturtle(self): _turtle_send(\"showturtle\")\n    def st(self): self.showturtle()\n    def shape(self, s): pass\n_default_turtle = Turtle()\nturtle_mod.Turtle = Turtle\nturtle_mod.Pen = Turtle\nturtle_mod.Screen = Screen\nturtle_mod.bgcolor = lambda c: _turtle_send(\"bgcolor\", str(c))\nturtle_mod.title = lambda s: None\nturtle_mod.done = lambda: None\nturtle_mod.mainloop = lambda: None\nturtle_mod.exitonclick = lambda: None\nturtle_mod.tracer = lambda *a, **k: None\nturtle_mod.update = lambda: None\nturtle_mod.getscreen = lambda: Screen()\nturtle_mod.forward = _default_turtle.forward\nturtle_mod.fd = _default_turtle.fd\nturtle_mod.backward = _default_turtle.backward\nturtle_mod.bk = _default_turtle.bk\nturtle_mod.right = _default_turtle.right\nturtle_mod.rt = _default_turtle.rt\nturtle_mod.left = _default_turtle.left\nturtle_mod.lt = _default_turtle.lt\nturtle_mod.circle = _default_turtle.circle\nturtle_mod.color = _default_turtle.color\nturtle_mod.pencolor = _default_turtle.pencolor\nturtle_mod.fillcolor = _default_turtle.fillcolor\nturtle_mod.pensize = _default_turtle.pensize\nturtle_mod.width = _default_turtle.width\nturtle_mod.penup = _default_turtle.penup\nturtle_mod.pu = _default_turtle.pu\nturtle_mod.up = _default_turtle.up\nturtle_mod.pendown = _default_turtle.pendown\nturtle_mod.pd = _default_turtle.pd\nturtle_mod.down = _default_turtle.down\nturtle_mod.speed = _default_turtle.speed\nturtle_mod.goto = _default_turtle.goto\nturtle_mod.setpos = _default_turtle.setpos\nturtle_mod.setheading = _default_turtle.setheading\nturtle_mod.seth = _default_turtle.seth\nturtle_mod.setx = _default_turtle.setx\nturtle_mod.sety = _default_turtle.sety\nturtle_mod.home = _default_turtle.home\nturtle_mod.dot = _default_turtle.dot\nturtle_mod.write = _default_turtle.write\nturtle_mod.begin_fill = _default_turtle.begin_fill\nturtle_mod.end_fill = _default_turtle.end_fill\nturtle_mod.clear = _default_turtle.clear\nturtle_mod.reset = _default_turtle.reset\nturtle_mod.hideturtle = _default_turtle.hideturtle\nturtle_mod.ht = _default_turtle.ht\nturtle_mod.showturtle = _default_turtle.showturtle\nturtle_mod.st = _default_turtle.st\nsys.modules[\"turtle\"] = turtle_mod";

// ================= 虚拟文件系统持久化 =================
// 孩子用 open("日记.txt","w") 写出来的文件，保存在 /home/pyodide 下。
// 这里在「准备就绪」时把上次保存的文件写回内存文件系统，每次运行后再收集一次交给主线程存起来。
const VFS_ROOT = "/home/pyodide";
const VFS_MAX_FILE = 64 * 1024;     // 单个文件最多 64KB
const VFS_MAX_TOTAL = 400 * 1024;   // 全部文件最多 400KB（localStorage 容量有限）
let initVfsFiles = [];

function collectUserFiles() {
  const out = [];
  let total = 0;
  let decoder = null;
  try { decoder = new TextDecoder("utf-8", { fatal: false }); } catch (e) { return out; }
  function walk(dir, rel) {
    let entries = [];
    try { entries = pyodide.FS.readdir(dir); } catch (e) { return; }
    for (const name of entries) {
      if (name === "." || name === ".." || name === "__pycache__") continue;
      const full = dir + "/" + name;
      const relPath = rel ? rel + "/" + name : name;
      let st = null;
      try { st = pyodide.FS.stat(full); } catch (e) { continue; }
      if (pyodide.FS.isDir(st.mode)) { walk(full, relPath); continue; }
      if (!pyodide.FS.isFile(st.mode)) continue;
      if (/\.pyc$/.test(name)) continue;
      let bytes = null;
      try { bytes = pyodide.FS.readFile(full); } catch (e) { continue; }
      if (!bytes || !bytes.length || bytes.length > VFS_MAX_FILE) continue;
      if (total + bytes.length > VFS_MAX_TOTAL) continue;
      const text = decoder.decode(bytes);
      if (text.indexOf(String.fromCharCode(0)) !== -1) continue;  // 二进制文件跳过
      total += bytes.length;
      out.push({ path: relPath, text: text });
    }
  }
  try { walk(VFS_ROOT, ""); } catch (e) {}
  return out;
}

function restoreUserFiles(list) {
  if (!list || !list.length) return 0;
  let count = 0;
  for (const item of list) {
    try {
      const parts = String(item.path || "").split("/").filter(function (p) { return !!p; });
      const name = parts.pop();
      if (!name) continue;
      let dir = VFS_ROOT;
      for (const p of parts) {
        dir = dir + "/" + p;
        try { pyodide.FS.mkdir(dir); } catch (e) {}
      }
      pyodide.FS.writeFile(dir + "/" + name, item.text || "", { encoding: "utf8" });
      count++;
    } catch (e) { /* 单个文件失败不影响运行 */ }
  }
  return count;
}

// ================= 单步调试（逐行运行）辅助代码 =================
// 复用 input() 的 SharedArrayBuffer：Python 侧阻塞等待主线程指令
//   [0] = 1 → 走一步；[0] = 2 → 一路跑完
const STEP_HELPER_CODE = [
  "_kid_step_mode = {\"on\": False}",
  "",
  "def _kid_pause(lineno):",
  "    js_self.pyFlushOutput()",
  "    js_self.postMessage(json.dumps({\"type\": \"step\", \"line\": int(lineno)}))",
  "    sab = js_self.pyInputBuf",
  "    result = 0",
  "    while result == 0:",
  "        result = Atomics.load(sab, 0)",
  "        if result != 0:",
  "            break",
  "        Atomics.wait(sab, 0, 0, 100)",
  "        if js_self.pyStepStopped():",
  "            raise KeyboardInterrupt",
  "    Atomics.store(sab, 0, 0)",
  "    Atomics.store(sab, 1, 0)",
  "    return result != 2",
  "",
  "def _kid_tracer(frame, event, arg):",
  "    if \"<学生代码>\" not in frame.f_code.co_filename:",
  "        return None",
  "    if event == \"line\":",
  "        if not _kid_step_mode[\"on\"]:",
  "            return None",
  "        if not _kid_pause(frame.f_lineno):",
  "            _kid_step_mode[\"on\"] = False",
  "            return None",
  "    return _kid_tracer",
].join(String.fromCharCode(10));

async function initWorker() {
  try {
    pyodide = await loadPyodide({
      // 核心运行时（pyodide.asm.wasm / python_stdlib.zip）本地自托管，快且不依赖外网
      indexURL: '/vendor/pyodide/',
      // 缓存版本号：/vendor/* 是 immutable 强缓存，lockfile 内容改动后必须换 URL，
      // 否则老用户浏览器里缓存的旧 lockfile（本地相对路径）会让 numpy 等按需包继续 404。
      lockFileURL: '/vendor/pyodide/pyodide-lock.json?v=2'
      // 注意：0.26.2 还不支持 packageBaseUrl，loadPackage() 的 wheel 地址是按
      // pyodide-lock.json 里的 file_name 相对 indexURL 解析的。因此我们把该
      // lockfile 的 file_name 全部改写成了 CDN 绝对 URL（见 tools/fetch-vendor.sh），
      // 这样 numpy / matplotlib 等按需包从 CDN 拉取，仓库不用塞 15MB 的 wheel。
    });

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
    await pyodide.runPythonAsync(STEP_HELPER_CODE);

    // 找回上次保存的数据文件（open() 写过的东西）
    const restored = restoreUserFiles(initVfsFiles);
    if (restored > 0) {
      self.postMessage({ type: 'vfs-restored', names: initVfsFiles.map(function (f) { return f.path; }) });
    }

    flushOutput();
    self.postMessage({ type: 'ready' });
  } catch (err) {
    flushOutput();
    self.postMessage({ type: 'error', text: '初始化失败: ' + (err && err.message ? err.message : String(err)) });
  }
}

// 从 Python traceback 中解析出错行号（取最内层的 <学生代码> 帧）
function extractErrorLine(tracebackText) {
  try {
    const re = /File "<学生代码>", line ([0-9]+)/g;
    let m, last = 0;
    while ((m = re.exec(tracebackText)) !== null) last = parseInt(m[1], 10);
    return last;
  } catch (e) {
    return 0;
  }
}

// 从 traceback 中取出出错那一行的源代码
function extractCodeLine(tracebackText) {
  try {
    const lines = tracebackText.split(String.fromCharCode(10));
    let idx = -1;
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].indexOf('File "<学生代码>"') !== -1) idx = i;
    }
    if (idx >= 0 && idx + 1 < lines.length) {
      const src = lines[idx + 1].trim();
      // 跳过 Python 的位置指示行（^^^^）
      if (src && src.indexOf('^') !== 0) return src.slice(0, 90);
    }
  } catch (e) {}
  return "";
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

async function runCode(code, stepping) {
  // 每次运行前复位中断信号与停止标志
  if (self.__interruptBuf) {
    Atomics.store(self.__interruptBuf, 0, 0);
    Atomics.store(self.__interruptBuf, 1, 0);
  }

  const hasTurtle = /import[\s]+turtle|from[\s]+turtle/i.test(code);
  if (hasTurtle) {
    self.postMessage({ type: 'turtle-detect' });
  }

  // 自动安装第三方库（numpy / matplotlib 等）
  try { await ensurePackages(code); } catch (e) { /* 安装失败不阻塞运行 */ }

  // 用 Python 层捕获异常：可拿到完整可读的 traceback（供儿童友好提示解析）
  const wrapped = [
    'import traceback',
    '__kid_src = ' + JSON.stringify(code),
    '__kid_fname = "<学生代码>"',
    'try:',
    '    import linecache',
    '    linecache.cache[__kid_fname] = (len(__kid_src), None, __kid_src.splitlines(True), __kid_fname)',
    'except Exception:',
    '    pass',
    '__kid_stepping = ' + (stepping ? 'True' : 'False'),
    'if __kid_stepping:',
    '    _kid_step_mode["on"] = True',
    '    sys.settrace(_kid_tracer)',
    'try:',
    '    exec(compile(__kid_src, __kid_fname, "exec"), globals())',
    '    __kid_err = ""',
    'except BaseException:',
    '    __kid_err = traceback.format_exc()',
    'finally:',
    '    sys.settrace(None)',
    '    _kid_step_mode["on"] = False',
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
      const tb = String(errText);
      self.postMessage({
        type: 'error',
        text: tb,
        line: extractErrorLine(tb),
        codeLine: extractCodeLine(tb)
      });
    } else {
      // 成功运行后收集变量，展示「变量望远镜」
      await collectVariables();
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

  // 把这次运行中 open() 写出来的数据文件交给主线程保存
  try {
    self.postMessage({ type: 'vfs-save', files: collectUserFiles() });
  } catch (e) { /* 保存失败不影响运行 */ }
}
