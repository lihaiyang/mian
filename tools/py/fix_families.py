#!/usr/bin/env python3
"""修掉题目家族模块里的「% 参数比占位符多」小毛病。

很多家族函数写成  "…… %s ……" % (scene, unit)，但字符串里只留了一个 %s。
Python 的 % 要求个数严格相等，于是直接 TypeError。
这里用 AST 找出所有「左边是字符串字面量、右边是元组」的 % 运算，
算出真正需要的个数，把多余的参数裁掉（保留前 N 个），最小改动修好。

用法：python3 tools/fix_families.py [a b c d]
"""

import ast
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))


def count_specs(s):
    n = 0
    i = 0
    while i < len(s):
        if s[i] == "%":
            if i + 1 < len(s) and s[i + 1] == "%":
                i += 2
                continue
            j = i + 1
            while j < len(s) and s[j] in "-+ #0123456789.*hlL":
                j += 1
            if j < len(s) and s[j] in "diouxXeEfFgGcrsa":
                n += 1
                i = j + 1
                continue
        i += 1
    return n


def fix_file(path):
    src = open(path, encoding="utf-8").read()
    tree = ast.parse(src)
    fixes = []
    problems = []
    for node in ast.walk(tree):
        if not isinstance(node, ast.BinOp) or not isinstance(node.op, ast.Mod):
            continue
        if not isinstance(node.left, ast.Constant) or not isinstance(node.left.value, str):
            continue
        if not isinstance(node.right, ast.Tuple):
            continue
        need = count_specs(node.left.value)
        have = len(node.right.elts)
        if need == have:
            continue
        if need < have:
            fixes.append((node.right, have, need))
        else:
            problems.append((node.lineno, need, have))

    if problems:
        print("  ⚠️ %s 有 %d 处参数不足，需要人工看看：%s" % (path, len(problems), problems[:5]))

    if not fixes:
        return 0

    lines = src.split("\n")
    # 注意：CPython 的 col_offset 是 UTF-8 字节偏移，不是字符偏移。
    # 源文件里全是中文，必须按字节算，否则会改错位置（这个坑踩过一次了）。
    offsets = [0]
    for ln in lines:
        offsets.append(offsets[-1] + len(ln.encode("utf-8")) + 1)

    def pos(lineno, col):
        return offsets[lineno - 1] + col

    edits = []
    for tuple_node, have, need in fixes:
        start = pos(tuple_node.lineno, tuple_node.col_offset)
        end = pos(tuple_node.end_lineno, tuple_node.end_col_offset)
        kept = tuple_node.elts[:need]
        if len(kept) == 1:
            new_text = "(" + ast.unparse(kept[0]) + ",)"
        else:
            new_text = "(" + ", ".join(ast.unparse(e) for e in kept) + ")"
        edits.append((start, end, new_text))

    # 从后往前改；如果区间互相重叠就跳过（保险起见）
    edits.sort(key=lambda x: -x[0])
    raw = src.encode("utf-8")
    last_start = len(raw) + 1
    applied = 0
    for start, end, new_text in edits:
        if end > last_start:
            print("  ⚠️ 跳过一处重叠修改（%d-%d）" % (start, end))
            continue
        raw = raw[:start] + new_text.encode("utf-8") + raw[end:]
        last_start = start
        applied += 1

    open(path, "wb").write(raw)
    print("  ✅ %s 修好 %d 处" % (os.path.basename(path), applied))
    return applied


def main():
    names = sys.argv[1:] or ["a", "b", "c", "d"]
    total = 0
    for n in names:
        path = os.path.join(HERE, "ex_families_%s.py" % n)
        if not os.path.exists(path):
            continue
        print("检查 %s" % os.path.basename(path))
        try:
            total += fix_file(path)
        except SyntaxError as exc:
            print("  ❌ 语法错误：%s" % exc)
    print("共修复 %d 处" % total)


if __name__ == "__main__":
    main()
