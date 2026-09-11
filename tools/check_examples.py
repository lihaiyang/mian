#!/usr/bin/env python3
"""校验 js/examples-lib.js 里每个示例的代码都能真的跑通。

做法：
  1. 用 node 把 LEARN_EXAMPLES 导成 JSON；
  2. 逐个写进临时文件，用 python3 跑一遍（超时 5 秒，喂足够的输入行）；
  3. import turtle 的示例注入一个假的 turtle 模块（画图动作全部忽略），只为验证语法与运行。

用法：python3 tools/check_examples.py
"""

import json
import os
import subprocess
import sys
import tempfile

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
JS = os.path.join(ROOT, "js", "examples-lib.js")

TURTLE_STUB = '''
"""假的 turtle 模块：所有画图动作都忽略，仅用于离线校验示例代码能不能跑。"""


class _Any:
    def __init__(self, *a, **k):
        pass

    def __call__(self, *a, **k):
        return _Any()

    def __getattr__(self, name):
        return _Any()


class Turtle(_Any):
    pass


class Screen(_Any):
    pass


def _noop(*a, **k):
    return _Any()


forward = fd = backward = bk = right = rt = left = lt = circle = _noop
goto = setpos = setposition = penup = pu = pendown = pd = _noop
pensize = width = pencolor = color = fillcolor = begin_fill = end_fill = _noop
speed = clear = reset = hideturtle = showturtle = dot = setheading = seth = _noop
home = write = stamp = undo = mainloop = done = _noop
bgcolor = title = setup = exitonclick = tracer = update = listen = _noop
onkey = onclick = onscreenclick = clearscreen = bye = _noop
'''

STDIN = "小明\n12\n3\n5\n7\n1\n2\n3\n4\n5\napple\nbanana\ncat\n石头\n3 5\n10\n20\n你好\nabc\n" * 3


def load_examples():
    expr = ";({cats: LEARN_EXAMPLE_CATEGORIES, list: LEARN_EXAMPLES})"
    out = subprocess.run(
        ["node", "-e",
         "const fs=require('fs');const c=fs.readFileSync(%r,'utf8');"
         "process.stdout.write(JSON.stringify(eval(c+%r)))" % (JS, expr)],
        capture_output=True, text=True, check=True)
    return json.loads(out.stdout)["list"]


def main():
    examples = load_examples()
    print("共 %d 个示例，开始逐个运行校验…" % len(examples))

    tmp = tempfile.mkdtemp(prefix="excheck_")
    stub_dir = os.path.join(tmp, "stub")
    os.makedirs(stub_dir, exist_ok=True)
    with open(os.path.join(stub_dir, "turtle.py"), "w", encoding="utf-8") as fh:
        fh.write(TURTLE_STUB)

    env = dict(os.environ)
    env["PYTHONPATH"] = stub_dir + os.pathsep + env.get("PYTHONPATH", "")
    env["PYTHONIOENCODING"] = "utf-8"

    failures = []
    for i, ex in enumerate(examples):
        path = os.path.join(tmp, "ex_%03d.py" % i)
        with open(path, "w", encoding="utf-8") as fh:
            fh.write(ex.get("code", ""))
        try:
            res = subprocess.run([sys.executable, path], input=STDIN,
                                 capture_output=True, text=True, timeout=5,
                                 env=env, cwd=tmp)
        except subprocess.TimeoutExpired:
            failures.append((ex["id"], ex["title"], "运行超过 5 秒（可能有停不下来的循环）"))
            continue
        if res.returncode != 0:
            tail = (res.stderr or "").strip().split("\n")[-1] if res.stderr else "未知错误"
            failures.append((ex["id"], ex["title"], tail[:140]))

    print("=" * 60)
    if failures:
        print("❌ %d / %d 个示例有问题：" % (len(failures), len(examples)))
        for eid, title, why in failures:
            print("   - %s %s：%s" % (eid, title, why))
        return 1
    print("✅ 全部 %d 个示例都能跑通" % len(examples))
    return 0


if __name__ == "__main__":
    sys.exit(main())
