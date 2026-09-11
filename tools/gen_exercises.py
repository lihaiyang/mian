#!/usr/bin/env python3
"""把各个「题目家族」模块合并、校验，生成 js/exercises.js（题库）

用法：
    python3 tools/gen_exercises.py            # 合并全部模块并写出 js/exercises.js
    python3 tools/gen_exercises.py --check    # 只校验，不写文件
    python3 tools/gen_exercises.py --only a   # 只跑 tools/ex_families_a.py（写文件时也只含它，方便自查）

每个家族模块 tools/ex_families_X.py 只要提供：
    def build():  return [ exercise(...), ... ]
"""

import argparse
import importlib
import json
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
sys.path.insert(0, HERE)

from exlib import TOPICS, TOPIC_IDS, LEVELS, norm, run_answer  # noqa: E402

MODULES = ["ex_families_a", "ex_families_b", "ex_families_c", "ex_families_d", "ex_families_e"]
OUT_JS = os.path.join(ROOT, "js", "exercises.js")


def tolerant_build(mod, name):
    """先整体构建；万一某个题型有 bug，就逐个题型容错构建，别让一道坏题毁掉整个题库。"""
    try:
        return mod.build(), []
    except Exception as exc:  # noqa: BLE001
        print("  ⚠️ %s 整体构建失败：%s" % (name, str(exc)[:120]))
        print("     改为逐个题型容错构建…")

    import inspect
    fns = []
    sections = getattr(mod, "SECTIONS", None)
    if sections:
        fns = list(sections)
    else:
        for fname, obj in vars(mod).items():
            if not inspect.isfunction(obj) or getattr(obj, "__module__", "") != mod.__name__:
                continue
            if fname == "build":
                continue
            params = [p for p in inspect.signature(obj).parameters.values()
                      if p.kind in (p.POSITIONAL_ONLY, p.POSITIONAL_OR_KEYWORD)]
            if len(params) == 1:
                fns.append(obj)

    part = []
    skipped = []
    for fn in fns:
        items = []
        try:
            fn(items)
            part.extend(items)
        except Exception as exc:  # noqa: BLE001
            skipped.append((fn.__name__, str(exc)[:100]))
    for fname, why in skipped:
        print("     ⚠️ 跳过 %s：%s" % (fname, why))
    return part, skipped


def load_items(only=None):
    items = []
    used = []
    for name in MODULES:
        if only and not name.endswith("_" + only):
            continue
        try:
            mod = importlib.import_module(name)
        except ModuleNotFoundError:
            print("  · 跳过（还没写）：%s" % name)
            continue
        importlib.reload(mod)
        part, skipped = tolerant_build(mod, name)
        used.append((name, len(part)))
        print("  · %-18s %4d 题%s" % (name, len(part), ("（跳过 %d 个题型）" % len(skipped)) if skipped else ""))
        items.extend(part)
    return items, used


def verify(items):
    """逐题重跑参考答案，确认标准输出确实对得上。"""
    bad = []
    for it in items:
        for t in it["tests"]:
            try:
                got = norm(run_answer(it["answer"], t["in"]))
            except Exception as exc:  # noqa: BLE001
                bad.append((it["title"], "答案执行失败：%s" % exc))
                break
            if got != t["out"]:
                bad.append((it["title"], "输出对不上：期望 %r 实际 %r" % (t["out"][:60], got[:60])))
                break
    return bad


def assign_ids(items):
    for i, it in enumerate(items, 1):
        it["id"] = "E%04d" % i
        it["title"] = it["title"].strip()
        it = {"id": it["id"], **{k: v for k, v in it.items() if k != "id"}}
    return items


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--check", action="store_true", help="只校验不写文件")
    ap.add_argument("--only", help="只跑某一个家族模块（a/b/c/d）")
    ap.add_argument("--no-verify", action="store_true", help="跳过逐题重跑校验（快）")
    args = ap.parse_args()

    print("📚 收集题目家族…")
    items, used = load_items(args.only)
    print("  合计 %d 题" % len(items))
    if not items:
        print("❌ 没有任何题目，退出")
        return 1

    # ---- 校验字段 ----
    problems = []
    seen_titles = {}
    for it in items:
        for field in ("topic", "level", "title", "desc", "hint", "answer", "tests"):
            if field not in it:
                problems.append("字段缺失 %s：%r" % (field, it.get("title")))
        if it.get("topic") not in TOPIC_IDS:
            problems.append("主题非法：%r（%s）" % (it.get("topic"), it.get("title")))
        if it.get("level") not in (1, 2, 3, 4):
            problems.append("关卡非法：%r（%s）" % (it.get("level"), it.get("title")))
        if len(it.get("desc", "")) < 6:
            problems.append("题目描述太短：%r" % it.get("title"))
        seen_titles[it["title"]] = seen_titles.get(it["title"], 0) + 1

    dup_titles = {t: c for t, c in seen_titles.items() if c > 3}
    if dup_titles:
        print("  ⚠️ 有 %d 个标题重复超过 3 次（同名同技能的变体题），示例：%s"
              % (len(dup_titles), list(dup_titles.items())[:3]))

    if problems:
        print("❌ 发现 %d 个问题：" % len(problems))
        for p in problems[:20]:
            print("   -", p)
        return 1

    if not args.no_verify:
        print("🔍 逐题重跑参考答案校验…")
        bad = verify(items)
        if bad:
            print("❌ %d 道题的标准答案有问题：" % len(bad))
            for title, why in bad[:20]:
                print("   - %s：%s" % (title, why))
            return 1
        print("   ✅ 全部 %d 题的标准答案都能跑通且输出一致" % len(items))

    items = assign_ids(items)

    # ---- 统计 ----
    by_topic = {}
    by_level = {}
    for it in items:
        by_topic[it["topic"]] = by_topic.get(it["topic"], 0) + 1
        by_level[it["level"]] = by_level.get(it["level"], 0) + 1
    print("   主题分布：" + "  ".join("%s=%d" % (k, v) for k, v in sorted(by_topic.items())))
    print("   关卡分布：" + "  ".join("L%d=%d" % (k, v) for k, v in sorted(by_level.items())))

    if args.check:
        print("（--check 模式，未写文件）")
        return 0

    topics_js = json.dumps([{"id": a, "name": b, "emoji": c} for a, b, c in TOPICS], ensure_ascii=False)
    levels_js = json.dumps([{"id": a, "name": b, "emoji": c} for a, b, c in LEVELS], ensure_ascii=False)
    bank_js = json.dumps(items, ensure_ascii=False, separators=(",", ":"))

    header = (
        "/**\n"
        " * ✏️ 练习题题库（自动生成，请勿手改）\n"
        " * 生成脚本：tools/gen_exercises.py（答案由参考答案真实运行得出）\n"
        " * 共 %d 题\n"
        " */\n" % len(items)
    )
    body = (
        header
        + "const EXERCISE_TOPICS = " + topics_js + ";\n"
        + "const EXERCISE_LEVELS = " + levels_js + ";\n"
        + "const EXERCISE_BANK = " + bank_js + ";\n"
    )
    with open(OUT_JS, "w", encoding="utf-8") as fh:
        fh.write(body)
    size = os.path.getsize(OUT_JS)
    print("✅ 已写出 %s（%.1f KB，%d 题）" % (os.path.relpath(OUT_JS, ROOT), size / 1024.0, len(items)))
    return 0


if __name__ == "__main__":
    sys.exit(main())
