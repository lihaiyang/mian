#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""gen_lessons.py —— 由词库生成 en/data/lessons.js（6 座岛 + 生活岛关卡）。

生成内容：
    window.EN_ISLANDS  —— 6 座岛，字段严格照 CONTRACT.md §1.5
    window.EN_LEVELS   —— 生活岛关卡：每个主题按 grade 排序后每 5 词一关
                          id = lv_<theme>_<n>，title = "<主题中文> <n> · <首词中文>"
                          emoji = 首词 emoji，grade = 本关众数
                          50 词 × 12 主题 → 10 关 × 12 主题 = 120 关

用法：
    python3 en/tools/gen_lessons.py            # 生成 / 更新 en/data/lessons.js
    python3 en/tools/gen_lessons.py --check    # 只校验，不写文件（不一致则退出码非 0）
    python3 en/tools/gen_lessons.py --print    # 打到标准输出，不写文件

注意：lessons.js 是生成物，别手改；改词库后重跑本脚本即可。
"""

import argparse
import collections
import json
import os
import shutil
import subprocess
import sys

HEADER = "// 由 tools/gen_lessons.py 生成，勿手改"

THEMES = ["colors", "numbers", "body", "family", "food", "animals",
          "clothes", "toys", "school", "weather", "transport", "home"]
THEMES_ZH = {
    "colors": "颜色", "numbers": "数字", "body": "身体", "family": "家庭",
    "food": "食物", "animals": "动物", "clothes": "衣物", "toys": "玩具",
    "school": "学校", "weather": "天气", "transport": "交通", "home": "家居",
}

# CONTRACT.md §1.5：6 座岛，顺序与字段照抄，不要改 id / kind
ISLANDS = [
    {"id": "letter", "name": "字母岛", "emoji": "🔤",
     "desc": "26 个字母的名字和声音", "kind": "letters", "grade": 1},
    {"id": "phonics", "name": "拼读岛", "emoji": "🧩",
     "desc": "看到词就会读", "kind": "phonics", "grade": 1},
    {"id": "life", "name": "生活岛", "emoji": "🏠",
     "desc": "12 个主题的生活词", "kind": "themes", "grade": 2},
    {"id": "sentence", "name": "句子岛", "emoji": "💬",
     "desc": "100 个高频句型", "kind": "sentences", "grade": 2},
    {"id": "story", "name": "故事岛", "emoji": "📚",
     "desc": "点读绘本", "kind": "readers", "grade": 2},
    {"id": "challenge", "name": "挑战岛", "emoji": "🏆",
     "desc": "听力 + 读写模拟卷", "kind": "exams", "grade": 3},
]

PER_LEVEL = 5          # 每关 5 个词
MIN_LEVEL = 3          # 一关最少 3 个词（check_content.py 的红线）


def en_root():
    """英语站站点根 = <仓库根>/public/en"""
    return os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), "public", "en")


def load_words(root):
    """调 node tools/dump_data.mjs 拿词库。"""
    node = shutil.which("node")
    if not node:
        print("✗ 找不到 node，无法运行 tools/dump_data.mjs", file=sys.stderr)
        sys.exit(2)
    # dump_data.mjs 与本脚本同在 tools/en/（不在站点根里）
    dump = os.path.join(os.path.dirname(os.path.abspath(__file__)), "dump_data.mjs")
    if not os.path.exists(dump):
        print("✗ 缺少 %s" % dump, file=sys.stderr)
        sys.exit(2)
    p = subprocess.run([node, dump], capture_output=True, text=True)
    if p.returncode != 0:
        print("✗ dump_data.mjs 运行失败：\n%s" % (p.stderr or p.stdout)[:1500], file=sys.stderr)
        sys.exit(2)
    for line in (p.stderr or "").splitlines():
        if line.startswith("LOAD_FAIL"):
            print("⚠ 数据文件加载失败 -> %s" % line, file=sys.stderr)
    try:
        return json.loads(p.stdout).get("words") or {}
    except ValueError as e:
        print("✗ dump_data.mjs 输出的不是合法 JSON：%s" % e, file=sys.stderr)
        sys.exit(2)


def chunk_words(arr):
    """按 grade 排序（同 grade 保持原顺序）后每 5 词一关；末尾不足 3 词并进上一关。"""
    ordered = sorted(arr, key=lambda it: it.get("grade", 3))
    chunks = [ordered[i:i + PER_LEVEL] for i in range(0, len(ordered), PER_LEVEL)]
    if len(chunks) >= 2 and len(chunks[-1]) < MIN_LEVEL:
        chunks[-2] = chunks[-2] + chunks[-1]
        chunks.pop()
    return chunks


def mode_grade(chunk):
    """本关 grade 取众数；票数相同时取较小的 grade（与排序后的第一词一致）。"""
    counter = collections.Counter(it.get("grade", 3) for it in chunk)
    return sorted(counter.items(), key=lambda kv: (-kv[1], kv[0]))[0][0]


def build_levels(words):
    """→ (levels, notes)：notes 记录跳过/提示。"""
    levels, notes = [], []
    for theme in THEMES:
        arr = [it for it in (words.get(theme) or []) if it.get("id")]
        if not arr:
            notes.append("主题 %s（%s）还没有词，跳过" % (theme, THEMES_ZH[theme]))
            continue
        for n, chunk in enumerate(chunk_words(arr), start=1):
            first = chunk[0]
            levels.append({
                "id": "lv_%s_%d" % (theme, n),
                "island": "life",
                "theme": theme,
                "index": n,
                "title": "%s %d · %s" % (THEMES_ZH[theme], n, (first.get("zh") or "").strip()),
                "emoji": (first.get("emoji") or "").strip() or "⭐",
                "grade": mode_grade(chunk),
                "words": [it["id"] for it in chunk],
            })
    return levels, notes


def validate(words, levels):
    """生成即校验：有问题就别写文件。→ (errors, warnings)"""
    errors, warnings = [], []
    all_ids = set()
    for theme in THEMES:
        for it in words.get(theme) or []:
            all_ids.add(it.get("id"))

    seen = set()
    per_theme = collections.Counter()
    for lv in levels:
        lid = lv["id"]
        if lid in seen:
            errors.append("关卡 id 重复：%s" % lid)
        seen.add(lid)
        per_theme[lv["theme"]] += 1
        if lv["island"] != "life":
            errors.append("%s: island 必须是 life" % lid)
        if lv["index"] != per_theme[lv["theme"]]:
            errors.append("%s: index 不连续（%s）" % (lid, lv["index"]))
        if not lv["title"] or "·" not in lv["title"]:
            errors.append("%s: title 格式应为「主题 序号 · 首词中文」" % lid)
        if not lv["emoji"]:
            errors.append("%s: 缺 emoji" % lid)
        if lv["grade"] not in (1, 2, 3):
            errors.append("%s: grade 非法（%r）" % (lid, lv["grade"]))
        ws = lv["words"]
        if len(ws) < MIN_LEVEL:
            errors.append("%s: 只有 %d 个词（至少 %d）" % (lid, len(ws), MIN_LEVEL))
        if len(ws) > PER_LEVEL + MIN_LEVEL - 1:
            warnings.append("%s: 有 %d 个词（合并了末尾零头？）" % (lid, len(ws)))
        if len(set(ws)) != len(ws):
            errors.append("%s: words 有重复" % lid)
        for w in ws:
            if all_ids and w not in all_ids:
                errors.append("%s: 引用了不存在的词 %s" % (lid, w))

    total_words = sum(len(lv["words"]) for lv in levels)
    if all_ids and total_words != len(all_ids):
        errors.append("关卡覆盖 %d 个词，但词库共 %d 个（有词没进关卡）" % (total_words, len(all_ids)))
    if len(ISLANDS) != 6:
        errors.append("EN_ISLANDS 必须 6 座岛")
    kinds = {"letters", "phonics", "themes", "sentences", "readers", "exams"}
    for i in ISLANDS:
        if i["kind"] not in kinds:
            errors.append("岛屿 %s 的 kind 非法：%s" % (i["id"], i["kind"]))
    return errors, warnings


# ---------------------------------------------------------------- 输出 JS

def J(s):
    """JS 字符串字面量（双引号，中文不转义）。"""
    return json.dumps(s, ensure_ascii=False)


def fmt_island(i):
    return ('  { id: %s, name: %s, emoji: %s, desc: %s, kind: %s, grade: %d },'
            % (J(i["id"]), J(i["name"]), J(i["emoji"]), J(i["desc"]), J(i["kind"]), i["grade"]))


def fmt_words(ids, width=100):
    """words 数组：一行放不下就折行，缩进对齐。"""
    parts = [J(w) for w in ids]
    lines, cur = [], "    words: ["
    for i, p in enumerate(parts):
        last = (i == len(parts) - 1)
        add = p + ("" if last else ", ")
        if cur.strip() != "words: [" and len(cur) + len(add) > width:
            lines.append(cur.rstrip())
            cur = "      " + add
        else:
            cur += add
    lines.append(cur + "] },")
    return lines


def render(levels):
    out = [HEADER, "", "window.EN_ISLANDS = ["]
    out += [fmt_island(i) for i in ISLANDS]
    out.append("];")
    out.append("")
    out.append("// 生活岛关卡：每个主题按 grade 排序，每 %d 词一关" % PER_LEVEL)
    out.append("window.EN_LEVELS = [")
    for lv in levels:
        out.append('  { id: %s, island: "life", theme: %s, index: %d, title: %s,'
                   % (J(lv["id"]), J(lv["theme"]), lv["index"], J(lv["title"])))
        out.append("    emoji: %s, grade: %d," % (J(lv["emoji"]), lv["grade"]))
        out += fmt_words(lv["words"])
    out.append("];")
    out.append("")
    return "\n".join(out)


def main(argv=None):
    ap = argparse.ArgumentParser(description="由词库生成 data/lessons.js（6 座岛 + 生活岛关卡）")
    ap.add_argument("--check", action="store_true", help="只校验，不写文件")
    ap.add_argument("--print", dest="to_stdout", action="store_true", help="打到标准输出，不写文件")
    ap.add_argument("--allow-empty", action="store_true", help="词库是空的时候也允许写（默认拒绝）")
    ap.add_argument("--root", default=None, help="en/ 模块根目录（默认脚本上一级，测试用）")
    args = ap.parse_args(argv if argv is not None else sys.argv[1:])

    root = os.path.abspath(args.root) if args.root else en_root()
    out_path = os.path.join(root, "data", "lessons.js")
    words = load_words(root)
    have = [t for t in THEMES if (words.get(t) or [])]
    levels, notes = build_levels(words)
    text = render(levels)
    errors, warnings = validate(words, levels)

    total_words = sum(len(lv["words"]) for lv in levels)
    print("=" * 64)
    print("🏝  词库 %d 个词 · 主题 %d/12 · 生成关卡 %d 个"
          % (sum(len(words.get(t) or []) for t in THEMES), len(have), len(levels)))
    print("=" * 64)
    for n in notes:
        print("  ⚠ " + n)

    if errors:
        print("\n错误 %d 条：" % len(errors))
        for e in errors[:60]:
            print("  ✗ " + e)
        return 1

    if args.to_stdout:
        sys.stdout.write(text)
        return 0

    if args.check:
        if not os.path.exists(out_path):
            print("\n✗ %s 不存在，请先跑 python3 en/tools/gen_lessons.py" % out_path)
            return 1
        with open(out_path, "r", encoding="utf-8") as f:
            old = f.read()
        if old != text:
            print("\n✗ lessons.js 与词库不一致（词库改过？重跑 python3 en/tools/gen_lessons.py）")
            old_lines, new_lines = old.splitlines(), text.splitlines()
            shown = 0
            for i in range(max(len(old_lines), len(new_lines))):
                a = old_lines[i] if i < len(old_lines) else "<缺行>"
                b = new_lines[i] if i < len(new_lines) else "<多行>"
                if a != b:
                    print("  第 %d 行：" % (i + 1))
                    print("    现在 - %s" % a[:120])
                    print("    应为 + %s" % b[:120])
                    shown += 1
                    if shown >= 5:
                        print("    … 只显示前 5 处差异")
                        break
            return 1
        print("\n✅ lessons.js 与词库一致（%d 关 / %d 词）· 警告 %d 条"
              % (len(levels), total_words, len(warnings)))
        return 0

    if not levels and not args.allow_empty:
        print("\n✗ 没有任何主题的词，先不生成（免得把好文件覆盖成空）")
        print("  等 data/words-*.js 写好再跑；确实要生成空关卡就加 --allow-empty")
        return 2

    os.makedirs(os.path.dirname(out_path), exist_ok=True)
    with open(out_path, "w", encoding="utf-8") as f:
        f.write(text)
    size = os.path.getsize(out_path)
    print("\n✅ 已写入 %s" % out_path)
    print("   %d 座岛 · %d 个关卡 · %d 个词 · %.1f KB · 警告 %d 条"
          % (len(ISLANDS), len(levels), total_words, size / 1024.0, len(warnings)))
    for w in warnings[:10]:
        print("   ⚠ " + w)
    print("   自测：node --check en/data/lessons.js && python3 en/tools/check_content.py")
    return 0


if __name__ == "__main__":
    sys.exit(main())
