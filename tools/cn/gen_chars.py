#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""汉字岛数据生成器：字表 + 词表

产出
----------------------------------------------------------------------------
    public/cn/data/chars-g1.js … chars-g6.js    按常用度分成 6 级的字表
    public/cn/data/index.js                     索引（每级的字、部首、笔画分布）

每字带：拼音、笔画数、部首、简短释义、常用组词。
**词表 = 每个字的常用组词**，这正是家长/老师最用得上的东西。

数据来源与授权（都是可以商用的）
----------------------------------------------------------------------------
1. 字频顺序   forfudan/chinese-characters-frequency · **Apache-2.0**
              六亿字知乎语料、限定在《通用规范汉字表》内、按频次降序。
              用它来定"哪些字更常用"。
2. 拼音/笔画/部首/释义   pwxcoo/chinese-xinhua 的 word.json · **MIT**
3. 组词        fxsjy/jieba 的 dict.txt · **MIT**（34.9 万词，带词频）

   ⚠️ **组词不能用 chinese-xinhua 的 ci.json**。它看着像"26 万词"，
   其实是一部**古汉语词典**：有"这的""了的"这种条目，有"花国（旧指妓女行中）"，
   却**没有**"大人""马上""学校""朋友"这些日常词。
   拿它当组词会教孩子古文，甚至是不当词汇 —— 实测踩过这个坑。

分级说明（重要，UI 上也要写明）
----------------------------------------------------------------------------
按**使用频率**分 6 级：一级 = 最常用的那一批。
**这不是任何一套教材的生字表顺序** —— 教材顺序有版权，而且各版本不同。
对"家长想查某个字怎么写、能组什么词"这个用途，频率分级更好用；
对"跟着课本走"，请用搜索或按笔画/部首浏览。

用法
----------------------------------------------------------------------------
    python3 tools/cn/gen_chars.py            # 生成（需要 /tmp 下已缓存三个源文件）
    python3 tools/cn/gen_chars.py --fetch    # 先下载源文件再生成
    python3 tools/cn/gen_chars.py --stats
"""

import argparse
import csv
import json
import os
import re
import sys
import urllib.request

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
OUTDIR = os.path.join(ROOT, "public", "cn", "data")

SRC = {
    "freq": "/tmp/charfreq.csv",
    "word": "/tmp/word.json",
    "jieba": "/tmp/jieba_dict.txt",
}
URLS = {
    "freq": "https://raw.githubusercontent.com/forfudan/chinese-characters-frequency/main/tables/"
            "%E5%85%AD%E5%84%84%E7%9F%A5%E4%B9%8E%E8%AA%9E%E6%96%99%E9%80%9A%E8%A6%8F%E6%BC%A2%E5%AD%97%E5%AD%97%E9%A0%BB%E8%A1%A8.csv",
    "word": "https://raw.githubusercontent.com/pwxcoo/chinese-xinhua/master/data/word.json",
    "jieba": "https://raw.githubusercontent.com/fxsjy/jieba/master/jieba/dict.txt",
}

TOTAL = 3500          # 《义务教育语文课程标准》要求小学阶段认识 3000 字左右，留点余量

# ---------------------------------------------------------------------------
# 不适合出现在小学生字表里的词。
#
# 为什么必须有这一层：jieba 的词表是从真实语料统计出来的，**里面什么都有**。
# 实测「妈」的词频最高组词是「他妈的」—— 直接进孩子的字表就出事了。
# 宁可少给几个组词，也不能让孩子在字表里学到脏话。
#
# 匹配规则：词里**包含**下面任一子串就丢掉。所以子串要写得够具体，
# 别把正常词误杀（例如不要写单字「死」，否则「死亡」「生死」都没了）。
# ---------------------------------------------------------------------------
BLOCK_SUBSTR = [
    # 脏话 / 侮辱
    "他妈", "妈的", "傻逼", "牛逼", "装逼", "狗屁", "屁话", "放屁", "混蛋",
    "王八", "畜生", "婊", "屌", "屄", "贱人", "骚货", "蠢货", "废物", "滚蛋",
    "去死", "该死", "找死", "混蛋", "娘的", "奶奶的",
    # 成人内容
    "妓", "娼", "嫖", "淫", "强奸", "强暴", "色情", "裸", "做爱", "性交",
    "情色", "黄片", "嫖娼",
    # 暴力 / 违法 / 自伤
    "自杀", "自残", "吸毒", "毒品", "贩毒", "赌博", "赌场", "赌钱",
    "凶杀", "碎尸", "尸体", "流氓", "黑社会", "绑架",
    # 疾病 / 死亡（低龄字表里没必要出现，避免家长不适）
    "癌", "艾滋", "精神病", "猝死", "暴毙",
]


def is_blocked(w):
    return any(b in w for b in BLOCK_SUBSTR)
GRADES = 6
CJK = re.compile(r"^[\u4e00-\u9fff]$")


def fetch():
    for k, url in URLS.items():
        dest = SRC[k]
        if os.path.exists(dest) and os.path.getsize(dest) > 1000:
            print("  已有 %s（%d 字节），跳过" % (dest, os.path.getsize(dest)))
            continue
        print("  下载 %s …" % url.split("/")[-1][:40])
        urllib.request.urlretrieve(url, dest)
        print("    → %s（%d 字节）" % (dest, os.path.getsize(dest)))


def load():
    missing = [k for k, p in SRC.items() if not os.path.exists(p)]
    if missing:
        print("缺源文件：%s\n请先跑 --fetch" % missing, file=sys.stderr)
        sys.exit(1)

    order = []
    with open(SRC["freq"], encoding="utf-8") as f:
        for row in csv.DictReader(f):
            c = (row.get("char") or "").strip()
            if CJK.match(c):
                order.append(c)

    words = {}
    for it in json.load(open(SRC["word"], encoding="utf-8")):
        c = (it.get("word") or "").strip()
        if CJK.match(c):
            words[c] = it

    # jieba 词表：每行 "词 词频 词性"
    wfreq = {}
    for line in open(SRC["jieba"], encoding="utf-8"):
        parts = line.split()
        if len(parts) >= 2:
            try:
                wfreq[parts[0]] = int(parts[1])
            except ValueError:
                pass
    return order, words, wfreq


def clean_meaning(text, limit=42):
    """释义清洗：去掉词性标记、多余空白，截断到 limit 字。"""
    if not text:
        return ""
    s = re.sub(r"[\s\u3000]+", " ", text)
    s = re.sub(r"^[①-⑳\d]+[\.、]?\s*", "", s)
    s = s.replace("〈", "(").replace("〉", ")")
    s = s.strip(" ;；,，.")
    return s[:limit] + ("…" if len(s) > limit else "")


def build(order, words, wfreq):
    # 只保留**字段完整**的字：拼音、笔画、部首、释义都要有。
    # 源字典有极少数条目缺字段（例如「跆」没有部首），
    # 与其让页面上出现一个空部首，不如不收它 —— 字表的数据契约要干净：
    # 每个字都能显示出 拼音 / 笔画 / 部首 / 释义。
    def complete(c):
        it = words.get(c)
        if not it:
            return False
        if not (it.get("pinyin") or "").strip():
            return False
        if not str(it.get("strokes") or "").isdigit():
            return False
        if not (it.get("radicals") or "").strip():
            return False
        return True

    picked = [c for c in order if complete(c)][:TOTAL]
    rank = {c: i for i, c in enumerate(picked)}
    picked_set = set(picked)

    # 组词索引：按**词频**排（词频高 = 更常用）
    # 词里每个字都要在本字表内，长度 2–4
    cand = {}
    dropped = []          # 被黑名单挡掉的词，跑完打印出来人工过一眼
    for w, f in wfreq.items():
        if not (2 <= len(w) <= 4):
            continue
        if not all(ch in picked_set for ch in w):
            continue
        if is_blocked(w):
            dropped.append(w)
            continue
        # 排序键：词频高的优先；同频次短的优先（"学校"比"高等学校"更该出现）
        for ch in set(w):
            cand.setdefault(ch, []).append((-f, len(w), w))

    if dropped:
        print("  ⛔ 被黑名单挡掉 %d 个词，前 30 个：%s" % (
            len(dropped), " ".join(sorted(set(dropped))[:30])))

    out = []
    for c in picked:
        it = words[c]
        ws = sorted(cand.get(c, []), key=lambda x: (x[0], x[1]))
        seen = set()
        ws2 = []
        for _, __, w in ws:
            if w in seen:
                continue
            seen.add(w)
            ws2.append(w)
            if len(ws2) >= 6:
                break
        out.append({
            "c": c,
            "p": (it.get("pinyin") or "").strip(),
            "s": int(it["strokes"]) if str(it.get("strokes") or "").isdigit() else 0,
            "r": (it.get("radicals") or "").strip(),
            "m": clean_meaning(it.get("explanation")),
            "w": ws2,
        })
    return out


def split_grades(chars):
    """按频率顺序均分成 6 级。"""
    per = (len(chars) + GRADES - 1) // GRADES
    return [chars[i * per:(i + 1) * per] for i in range(GRADES)]


def render_grade(g, chars):
    lines = [
        "/* 汉字岛 · %d 级字表 —— **自动生成，不要手改**" % g,
        " *",
        " * 生成器：tools/cn/gen_chars.py",
        " * 分级依据：使用频率（六亿字语料，forfudan/chinese-characters-frequency，Apache-2.0）。",
        " * **不是任何一套教材的生字表顺序** —— 教材顺序有版权，各版本也不同。",
        " * 拼音/笔画/部首/释义/组词来自 pwxcoo/chinese-xinhua（MIT）。",
        " */",
        'window.CN_GRADE = window.CN_GRADE || {};',
        "window.CN_GRADE[%d] = [" % g,
    ]
    for it in chars:
        lines.append("  { c: %s, p: %s, s: %d, r: %s, m: %s, w: %s }," % (
            json.dumps(it["c"], ensure_ascii=False),
            json.dumps(it["p"], ensure_ascii=False),
            it["s"],
            json.dumps(it["r"], ensure_ascii=False),
            json.dumps(it["m"], ensure_ascii=False),
            json.dumps(it["w"], ensure_ascii=False),
        ))
    lines.append("];")
    lines.append("")
    return "\n".join(lines)


def render_index(grades):
    """索引：每级的字数、部首分布、笔画分布 —— 首页不用加载全部字就能显示概览。"""
    def dist(chars, key):
        d = {}
        for it in chars:
            k = it[key]
            if not k:
                continue
            d[str(k)] = d.get(str(k), 0) + 1
        return d

    def stroke_bucket(chars):
        b = {}
        for it in chars:
            s = it["s"]
            band = "1-3" if s <= 3 else "4-6" if s <= 6 else "7-9" if s <= 9 else "10-12" if s <= 12 else "13+"
            b[band] = b.get(band, 0) + 1
        return b

    info = []
    for i, chars in enumerate(grades, start=1):
        info.append({
            "g": i, "n": len(chars),
            "radicals": dist(chars, "r"),
            "strokes": stroke_bucket(chars),
            "sample": "".join(it["c"] for it in chars[:24]),
        })
    body = [
        "/* 汉字岛 · 字表索引 —— **自动生成，不要手改**（tools/cn/gen_chars.py） */",
        "window.CN_INDEX = " + json.dumps(info, ensure_ascii=False, indent=2) + ";",
        "",
    ]
    return "\n".join(body)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--fetch", action="store_true", help="先下载源文件")
    ap.add_argument("--stats", action="store_true", help="只打印统计")
    args = ap.parse_args()

    if args.fetch:
        print("下载源文件：")
        fetch()

    order, words, ci = load()
    chars = build(order, words, ci)
    grades = split_grades(chars)

    if args.stats:
        for i, g in enumerate(grades, start=1):
            withw = sum(1 for it in g if it["w"])
            print("  %d 级：%4d 字，其中 %4d 字有组词（%.0f%%）" % (
                i, len(g), withw, 100.0 * withw / max(1, len(g))))
        print("  合计 %d 字" % sum(len(g) for g in grades))
        return 0

    os.makedirs(OUTDIR, exist_ok=True)
    for i, g in enumerate(grades, start=1):
        p = os.path.join(OUTDIR, "chars-g%d.js" % i)
        with open(p, "w", encoding="utf-8") as f:
            f.write(render_grade(i, g))
    with open(os.path.join(OUTDIR, "index.js"), "w", encoding="utf-8") as f:
        f.write(render_index(grades))

    for i, g in enumerate(grades, start=1):
        withw = sum(1 for it in g if it["w"])
        size = os.path.getsize(os.path.join(OUTDIR, "chars-g%d.js" % i))
        print("  ✅ %d 级：%4d 字 · 有组词 %4d · %5.1f KB" % (i, len(g), withw, size / 1024.0))
    print("  合计 %d 字" % sum(len(g) for g in grades))
    return 0


if __name__ == "__main__":
    sys.exit(main())
