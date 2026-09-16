"""练习题生成公共库（tools/exlib.py）

用途：写「题目家族」时不用手算答案——把参考答案真正跑一遍，
      把真实输出当作标准答案记录下来。这样 1000+ 道题的答案不会写错。

用法示例（在 tools/ex_families_a.py 里）：

    from exlib import exercise, pick, nums

    def build():
        items = []
        # 一道固定的题
        items.append(exercise(
            topic="print", level=1,
            title="打印一句问候",
            desc="请输出一行：你好，Python！",
            hint="用 print() 把文字打印出来，文字要放在英文引号里。",
            answer='print("你好，Python！")',
            cases=[""]))
        # 一族题：同一技能的多个变体，数据不同、答案不同
        for n in [5, 10, 20]:
            items.append(exercise(
                topic="loop", level=1,
                title=f"打印 1 到 {n}",
                desc=f"请按顺序输出 1 到 {n}，每个数字占一行。",
                hint="用 for i in range(1, %d): 配合 print(i)。" % (n + 1),
                answer=f"for i in range(1, {n + 1}):\n    print(i)",
                cases=[""]))
        return items

每个 exercise 会：
  1. 真的执行 answer（用给定的标准输入喂给 input()）
  2. 记录真实输出，作为该测试点的期望输出
  3. 如果 answer 报错（语法错/运行时错），立刻抛异常，不会把错题写进题库
"""

import contextlib
import io
import sys

# ======================= 主题表（题库分类，JS 端也用这份） =======================
TOPICS = [
    ("print",  "输出打印",  "🗣️"),
    ("input",  "输入问答",  "💬"),
    ("var",    "变量与类型", "📦"),
    ("calc",   "算术运算",  "➕"),
    ("if",     "条件判断",  "🤔"),
    ("loop",   "循环重复",  "🔁"),
    ("str",    "字符串",   "✍️"),
    ("list",   "列表",     "🎒"),
    ("dict",   "字典",     "📖"),
    ("func",   "函数",     "🧩"),
    ("math",   "数学与数论", "🧮"),
    ("shape",  "图形打印",  "🔺"),
    ("file",   "文件读写",  "💾"),
    ("algo",   "算法思维",  "🧠"),
    ("turtle", "海龟绘图",  "🐢"),
    ("fun",    "趣味编程",  "🎲"),
]

TOPIC_IDS = [t[0] for t in TOPICS]

# ======================= 关卡（GESP 级别） =======================
LEVELS = [
    (1, "GESP 一级 · 顺序与输入输出", "🌱"),
    (2, "GESP 二级 · 分支与循环", "🌿"),
    (3, "GESP 三级 · 列表与函数", "🌳"),
    (4, "GESP 四级 · 算法小挑战", "🏔️"),
]


def norm(text):
    """输出归一化：去掉行尾空格和结尾空行（判题时两边用同一套规则）。"""
    s = str(text).replace("\r\n", "\n").replace("\r", "\n")
    lines = [ln.rstrip() for ln in s.split("\n")]
    while lines and lines[-1] == "":
        lines.pop()
    return "\n".join(lines)


def run_answer(code, stdin_text="", limit=200000):
    """真正执行参考答案，返回它打印出来的内容。

    任何异常（语法错、运行时错、input 不够用）都会直接抛出，
    让错误在生成题库的时候就暴露出来，而不是留给孩子。
    """
    buf = io.StringIO()
    old_stdin = sys.stdin
    sys.stdin = io.StringIO(stdin_text)
    env = {"__name__": "__main__"}
    try:
        with contextlib.redirect_stdout(buf):
            exec(compile(code, "<参考答案>", "exec"), env)
    finally:
        sys.stdin = old_stdin
    out = buf.getvalue()
    if len(out) > limit:
        raise ValueError("参考答案输出过长（%d 字符），请把题目改小一点" % len(out))
    return out


def _stdin_of(case):
    if case is None:
        return ""
    if isinstance(case, str):
        return case
    if isinstance(case, (list, tuple)):
        return "\n".join(str(x) for x in case)
    return str(case)


def exercise(topic, level, title, desc, hint, answer, cases,
             tags=None, sample=None, source=None):
    """造一道题：cases 里每个元素是一组标准输入，期望输出由 answer 真跑出来。"""
    if topic not in TOPIC_IDS:
        raise ValueError("未知主题：%s（可用：%s）" % (topic, ", ".join(TOPIC_IDS)))
    if level not in (1, 2, 3, 4):
        raise ValueError("未知关卡：%s" % (level,))
    if not cases:
        cases = [""]
    outs = []
    for case in cases[:4]:
        stdin_text = _stdin_of(case)
        outs.append((stdin_text, norm(run_answer(answer, stdin_text))))
    # 所有测试数据下都没有输出 → 这题八成写错了（例如答案只 input 没 print）
    # 只有个别数据没输出是正常的（比如「n 以内没有偶数就什么都不打印」）
    if all(not o.strip() for _, o in outs):
        raise ValueError("题目「%s」的标准答案在任何一组数据下都没有输出，请检查" % title)
    tests = [{"in": s, "out": o} for s, o in outs]
    item = {
        "topic": topic,
        "level": int(level),
        "title": str(title),
        "desc": str(desc).strip(),
        "hint": str(hint).strip(),
        "answer": str(answer).rstrip() + "\n",
        "tests": tests,
    }
    if tags:
        item["tags"] = list(tags)
    if sample is not None:
        item["sample"] = int(sample)
    if source:
        item["source"] = str(source)
    return item


def self_check(topic, level, title, desc, hint, answer, tags=None):
    """不能自动判题的题（例如海龟画图）：tests 为空，孩子自己对照效果打勾。"""
    if topic not in TOPIC_IDS:
        raise ValueError("未知主题：%s" % topic)
    return {
        "topic": topic,
        "level": int(level),
        "title": str(title),
        "desc": str(desc).strip(),
        "hint": str(hint).strip(),
        "answer": str(answer).rstrip() + "\n",
        "tests": [],
        "tags": list(tags or ["手动检查"]),
    }


def pick(seq, i):
    """循环取值：pick([3, 5, 7], 4) -> 5"""
    return seq[i % len(seq)]


def nums(start, stop, step=1):
    return list(range(start, stop + 1, step))


def repeat(items, times):
    """把一个题目家族复制 times 遍（数据不同），用于做成「同一技能的多次练习」。"""
    out = []
    for k in range(times):
        for it in items:
            out.append(it)
    return out
