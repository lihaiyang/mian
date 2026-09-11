#!/usr/bin/env python3
"""校验 js/lessons.js 与 js/lessons-adv.js 里每一课的示例代码都能真的跑通。

用法：python3 tools/check_lessons.py
"""

import json
import os
import subprocess
import sys
import tempfile

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FILES = ["js/lessons.js", "js/lessons-adv.js"]

TURTLE_STUB = '''
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

STDIN = "12\n8\n小明\n12\n3\n5\n7\n1\n2\n3\n4\n5\napple\nbanana\n3 5\n10\n20\npython\n你好\n" * 3


def load(path):
    expr = ";({lessons: (typeof LEARN_LESSONS !== 'undefined' ? LEARN_LESSONS : LEARN_LESSONS_ADV)})"
    out = subprocess.run(
        ["node", "-e",
         "const fs=require('fs');const c=fs.readFileSync(%r,'utf8');"
         "process.stdout.write(JSON.stringify(eval(c+%r)))" % (os.path.join(ROOT, path), expr)],
        capture_output=True, text=True, check=True)
    return json.loads(out.stdout)["lessons"]


def main():
    tmp = tempfile.mkdtemp(prefix="lessoncheck_")
    stub_dir = os.path.join(tmp, "stub")
    os.makedirs(stub_dir, exist_ok=True)
    with open(os.path.join(stub_dir, "turtle.py"), "w", encoding="utf-8") as fh:
        fh.write(TURTLE_STUB)
    env = dict(os.environ)
    env["PYTHONPATH"] = stub_dir + os.pathsep + env.get("PYTHONPATH", "")
    env["PYTHONIOENCODING"] = "utf-8"

    all_lessons = []
    for path in FILES:
        if not os.path.exists(os.path.join(ROOT, path)):
            print("⚠️ 找不到 %s" % path)
            continue
        got = load(path)
        print("%s：%d 课" % (path, len(got)))
        all_lessons.extend(got)

    failures = []
    for i, lesson in enumerate(all_lessons):
        code = lesson.get("code") or ""
        if not code.strip():
            failures.append((lesson["id"], lesson.get("title", ""), "没有示例代码"))
            continue
        path = os.path.join(tmp, "l_%03d.py" % i)
        with open(path, "w", encoding="utf-8") as fh:
            fh.write(code)
        try:
            res = subprocess.run([sys.executable, path], input=STDIN, capture_output=True,
                                 text=True, timeout=5, env=env, cwd=tmp)
        except subprocess.TimeoutExpired:
            failures.append((lesson["id"], lesson.get("title", ""), "运行超过 5 秒"))
            continue
        if res.returncode != 0:
            tail = (res.stderr or "").strip().split("\n")[-1] if res.stderr else "未知错误"
            failures.append((lesson["id"], lesson.get("title", ""), tail[:140]))

    print("=" * 60)
    stages = {}
    topics = set()
    for l in all_lessons:
        stages[l.get("stage")] = stages.get(l.get("stage"), 0) + 1
        for t in (l.get("practiceTopics") or []):
            topics.add(t)
    print("课程总数：%d，各阶段：%s" % (len(all_lessons), stages))
    print("关联练习主题：%s" % "、".join(sorted(topics)))

    if failures:
        print("❌ %d 课的示例代码有问题：" % len(failures))
        for lid, title, why in failures:
            print("   - %s %s：%s" % (lid, title, why))
        return 1
    print("✅ 全部 %d 课的示例代码都能跑通" % len(all_lessons))
    return 0


if __name__ == "__main__":
    sys.exit(main())
