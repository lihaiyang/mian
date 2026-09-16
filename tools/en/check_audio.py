#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""check_audio.py —— 音频精灵体检（只读，不改任何文件）。

检查项：
    1. 每组 json / m4a 都在，m4a 时长能用 afinfo 解析出来
    2. 片段 [start, dur]：start ≥ 0、dur 在 0.2–12s、start+dur 不超出音频长度
    3. 片段不重叠、顺序递增；json 的 count 与实际条数一致
    4. 覆盖度：每个词有 #w、每个例句有 #s、绘本每页有 #p<n>、26 个字母有 #n
    5. 孤儿片段：json 里有、但数据里已经不存在的 key（改词删词后没重跑 gen_audio.py）
    6. 产出物孤儿：有 json 没 m4a / 有 m4a 没 json

任何 ✗ 都会以非零退出码结束；⚠ 只提示不拦。

用法：
    python3 en/tools/check_audio.py
    python3 en/tools/check_audio.py --quiet     # 只打印汇总与问题
"""

import argparse
import hashlib
import json
import os
import re
import shutil
import subprocess
import sys

RATE = 22050
MIN_DUR = 0.20
MAX_DUR = 12.0
READERS_PER_GROUP = 5
LETTERS_GROUP = "letters"
PHONICS_GROUP = "phonics"
SENTENCES_GROUP = "sentences"
HASH_LEN = 16
DUR_TOLERANCE = 0.25         # 容器时长与理论时长允许的误差（AAC priming 等）

THEMES = ["colors", "numbers", "body", "family", "food", "animals",
          "clothes", "toys", "school", "weather", "transport", "home"]

errors, warnings = [], []


def E(msg):
    errors.append(msg)


def W(msg):
    warnings.append(msg)


# ---------------------------------------------------------------- 与 gen_audio.py 保持一致

def en_root():
    """英语站站点根 = <仓库根>/public/en"""
    return os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), "public", "en")


def texts_hash(pairs):
    h = hashlib.sha256()
    for key, text in pairs:
        h.update(key.encode("utf-8"))
        h.update(b"\x00")
        h.update(text.encode("utf-8"))
        h.update(b"\n")
    return h.hexdigest()[:HASH_LEN]


def load_data(root):
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
    try:
        return json.loads(p.stdout)
    except ValueError as e:
        print("✗ dump_data.mjs 输出的不是合法 JSON：%s" % e, file=sys.stderr)
        sys.exit(2)


def build_groups(data):
    """与 gen_audio.py 完全一致的分组规则 → {组名: [(key, 文本), …]}。

    数据里「本该有音频却没文本」的条目单独报出来（✗），不当成无事发生。
    """
    groups = {}
    for theme in THEMES:
        pairs = []
        for it in (data.get("words") or {}).get(theme) or []:
            wid = (it.get("id") or "").strip()
            word = (it.get("word") or "").strip()
            if not wid:
                E("%s: 有个词条没有 id：%r" % (theme, it.get("word") or it))
                continue
            if word:
                pairs.append((wid + "#w", word))
            else:
                E("%s: %s#w 缺文本（word 是空的）" % (theme, wid))
            sent = ((it.get("sent") or {}).get("en") or "").strip()
            if sent:
                pairs.append((wid + "#s", sent))
            else:
                E("%s: %s#s 缺文本（sent.en 是空的）" % (theme, wid))
        if pairs:
            groups[theme] = pairs
    pairs = []
    for it in data.get("letters") or []:
        letter = (it.get("letter") or "").strip()
        if letter:
            pairs.append((letter + "#n", (it.get("name") or "").strip() or letter))
        else:
            E("%s: 有个字母条目没有 letter 字段" % LETTERS_GROUP)
    if pairs:
        groups[LETTERS_GROUP] = pairs
    pairs = []
    for unit in data.get("phonics") or []:
        pid = (unit.get("id") or "").strip()
        if not pid:
            E("%s: 有个拼读关没有 id" % PHONICS_GROUP)
            continue
        for b in unit.get("blends") or []:
            word = (b.get("word") or "").strip()
            if word:
                pairs.append(("ph:%s:%s#w" % (pid, word), word))
            else:
                E("%s: %s 里有个拼读词没有 word" % (PHONICS_GROUP, pid))
    if pairs:
        groups[PHONICS_GROUP] = pairs
    pairs = []
    for s in data.get("sentences") or []:
        sid = (s.get("id") or "").strip()
        if not sid:
            E("%s: 有个句型没有 id" % SENTENCES_GROUP)
            continue
        say_text = (s.get("say") or "").strip()
        if say_text:
            pairs.append((sid + "#s", say_text))
        else:
            E("%s: %s#s 缺文本（say 是空的）" % (SENTENCES_GROUP, sid))
    if pairs:
        groups[SENTENCES_GROUP] = pairs
    readers = data.get("readers") or []
    for i in range(0, len(readers), READERS_PER_GROUP):
        gname = "readers-%d" % (i // READERS_PER_GROUP + 1)
        pairs = []
        for r in readers[i:i + READERS_PER_GROUP]:
            rid = (r.get("id") or "").strip()
            if not rid:
                E("%s: 有本绘本没有 id" % gname)
                continue
            for n, page in enumerate(r.get("pages") or [], start=1):
                en = (page.get("en") or "").strip()
                if en:
                    pairs.append(("%s#p%d" % (rid, n), en))
                else:
                    E("%s: %s 第 %d 页缺文本（en 是空的）" % (gname, rid, n))
        if pairs:
            groups[gname] = pairs
    return groups


# ---------------------------------------------------------------- 音频探测

_DUR_RE = re.compile(r"estimated duration:\s*([0-9.]+)\s*sec", re.I)


def afinfo_duration(path):
    """用 afinfo 取时长。→ (秒数, 错误信息)"""
    afinfo = shutil.which("afinfo")
    if not afinfo:
        return None, "找不到 afinfo（macOS 自带）"
    p = subprocess.run([afinfo, path], capture_output=True, text=True)
    if p.returncode != 0:
        return None, "afinfo 读不出来（exit %d）：%s" % (p.returncode, (p.stderr or "").strip()[:160])
    m = _DUR_RE.search(p.stdout or "")
    if not m:
        return None, "afinfo 输出里没有 estimated duration"
    try:
        return float(m.group(1)), None
    except ValueError:
        return None, "时长解析失败：%r" % m.group(1)


# ---------------------------------------------------------------- 校验

def check_group(name, pairs, audio_dir, quiet):
    """校验一组。→ (片段数, 总时长) 或 None"""
    json_path = os.path.join(audio_dir, name + ".json")
    m4a_path = os.path.join(audio_dir, name + ".m4a")
    want = {k: t for k, t in pairs}

    if not os.path.exists(json_path):
        E("%s: 缺少 %s.json（跑一下 python3 en/tools/gen_audio.py）" % (name, name))
        return None
    if not os.path.exists(m4a_path):
        E("%s: 缺少 %s.m4a" % (name, name))
        return None

    try:
        with open(json_path, "r", encoding="utf-8") as f:
            doc = json.load(f)
    except (ValueError, OSError) as e:
        E("%s: json 读不出来：%s" % (name, e))
        return None
    if not isinstance(doc, dict):
        E("%s: json 顶层不是对象" % name)
        return None

    for field in ("group", "file", "rate", "count", "hash", "clip"):
        if field not in doc:
            E("%s: json 缺字段 %s" % (name, field))
    if doc.get("group") != name:
        E("%s: json 里的 group 是 %r" % (name, doc.get("group")))
    if doc.get("file") != os.path.basename(m4a_path):
        E("%s: json 里的 file 是 %r，应为 %r" % (name, doc.get("file"), name + ".m4a"))
    if doc.get("rate") != RATE:
        E("%s: json 里的 rate 是 %r，应为 %d" % (name, doc.get("rate"), RATE))

    clip = doc.get("clip")
    if not isinstance(clip, dict) or not clip:
        E("%s: clip 不是非空对象" % name)
        return None
    if doc.get("count") != len(clip):
        E("%s: count=%r 与实际条数 %d 不一致" % (name, doc.get("count"), len(clip)))

    total, err = afinfo_duration(m4a_path)
    if total is None:
        E("%s: %s" % (name, err))
        return None
    if total <= 0:
        E("%s: 音频时长为 0" % name)

    # 片段几何
    items = []
    for key, span in clip.items():
        if not isinstance(span, (list, tuple)) or len(span) != 2:
            E("%s: %s 的片段不是 [start, dur]" % (name, key))
            continue
        start, dur = span
        if not isinstance(start, (int, float)) or not isinstance(dur, (int, float)):
            E("%s: %s 的 start/dur 不是数字" % (name, key))
            continue
        if start < -0.001:
            E("%s: %s 的 start 为负（%.3f）" % (name, key, start))
        if dur < MIN_DUR - 1e-9 or dur > MAX_DUR + 1e-9:
            E("%s: %s 的时长 %.3fs 超出 %.2f–%.1fs" % (name, key, dur, MIN_DUR, MAX_DUR))
        if start + dur > total + DUR_TOLERANCE:
            E("%s: %s 越界（%.3f + %.3f > 音频 %.3f）" % (name, key, start, dur, total))
        items.append((start, dur, key))
    items.sort()

    prev_end, prev_key = None, None
    for start, dur, key in items:
        if prev_end is not None and start < prev_end - 0.001:
            E("%s: %s（%.3f）与 %s（结束 %.3f）重叠" % (name, prev_key, prev_end, key, start))
        prev_end, prev_key = start + dur, key

    # 覆盖度：缺 key / 孤儿 key
    missing = [k for k in want if k not in clip]
    orphan = [k for k in clip if k not in want]
    for k in missing[:12]:
        E("%s: 缺片段 %s（文本 %r）" % (name, k, want[k]))
    if len(missing) > 12:
        E("%s: 还有 %d 个片段缺失" % (name, len(missing) - 12))
    for k in orphan[:12]:
        E("%s: 孤儿片段 %s（数据里已经没有这个 key 了）" % (name, k))
    if len(orphan) > 12:
        E("%s: 还有 %d 个孤儿片段" % (name, len(orphan) - 12))

    if doc.get("hash") != texts_hash(pairs):
        W("%s: hash 与当前数据对不上（文本改过？重跑 gen_audio.py 即可）" % name)

    if not missing and not orphan and not quiet:
        print("  ✅ %-14s %4d 条 · %.2fs · %s" % (name, len(clip), total,
                                                 "%.1f KB" % (os.path.getsize(m4a_path) / 1024.0)))
    return len(clip), total


def coverage_lines(data):
    """按数据口径统计「应该有多少条」，用于覆盖度汇总。"""
    themes = [(data.get("words") or {}).get(t) or [] for t in THEMES]
    words = sum(len(a) for a in themes)
    word_sents = sum(1 for a in themes for it in a if ((it.get("sent") or {}).get("en") or "").strip())
    letters = len(data.get("letters") or [])
    pages = sum(len(r.get("pages") or []) for r in data.get("readers") or [])
    sents = len(data.get("sentences") or [])
    blends = sum(len(u.get("blends") or []) for u in data.get("phonics") or [])
    return words, word_sents, letters, pages, sents, blends


def main(argv=None):
    ap = argparse.ArgumentParser(description="校验 assets/audio 下的音频精灵与索引")
    ap.add_argument("--quiet", action="store_true", help="只打印有问题的组")
    ap.add_argument("--root", default=None, help="en/ 模块根目录（默认脚本上一级，测试用）")
    args = ap.parse_args(argv if argv is not None else sys.argv[1:])

    root = os.path.abspath(args.root) if args.root else en_root()
    audio_dir = os.path.join(root, "assets", "audio")
    data = load_data(root)
    groups = build_groups(data)

    print("=" * 64)
    print("🔍 音频校验：%s" % audio_dir)
    print("=" * 64)

    if not os.path.isdir(audio_dir):
        E("目录不存在：%s" % audio_dir)
        groups = {}

    total_clips, total_sec = 0, 0.0
    for name, pairs in groups.items():
        r = check_group(name, pairs, audio_dir, args.quiet)
        if r:
            total_clips += r[0]
            total_sec += r[1]

    # 产出物孤儿：多余/残缺的 json、m4a
    if os.path.isdir(audio_dir):
        files = sorted(os.listdir(audio_dir))
        jsons = [f for f in files if f.endswith(".json")]
        m4as = [f for f in files if f.endswith(".m4a")]
        for f in jsons:
            if f[:-5] not in groups:
                W("%s.json 不在当前数据的分组里（旧主题？）" % f[:-5])
            elif not os.path.exists(os.path.join(audio_dir, f[:-5] + ".m4a")):
                E("%s.json 没有对应的 m4a" % f[:-5])
        for f in m4as:
            if f[:-4] not in groups:
                W("%s 不在当前数据的分组里（旧主题？）" % f[:-4])
            elif not os.path.exists(os.path.join(audio_dir, f[:-4] + ".json")):
                E("%s 没有对应的 json 索引" % f[:-4])
        if not files:
            W("assets/audio/ 是空的：还没跑过 gen_audio.py")

    # 覆盖度汇总
    words, word_sents, letters, pages, sents, blends = coverage_lines(data)
    readers = data.get("readers") or []
    print("\n覆盖度（按 data/ 口径，每类都要在 json 里找得到）：")
    print("  单词 #w        %4d 条" % words)
    print("  单词例句 #s    %4d 条" % word_sents)
    print("  句型 #s        %4d 条（句子岛）" % sents)
    print("  字母 #n        %4d 条（应为 26）%s" % (letters, "" if letters == 26 else "  ⚠"))
    print("  绘本页 #p<n>   %4d 条（%d 本）" % (pages, len(readers)))
    print("  拼读词 #w      %4d 条" % blends)
    if letters != 26:
        W("EN_LETTERS 不是 26 个（实际 %d），字母音频会不全" % letters)

    print("\n" + "=" * 64)
    print("分组 %d 个 · 片段 %d 条 · 音频合计 %.1fs" % (len(groups), total_clips, total_sec))
    print("=" * 64)
    if warnings:
        print("\n提示 %d 条：" % len(warnings))
        for w in warnings[:40]:
            print("  ⚠ " + w)
        if len(warnings) > 40:
            print("  … 还有 %d 条" % (len(warnings) - 40))
    if errors:
        print("\n问题 %d 条：" % len(errors))
        for e in errors[:60]:
            print("  ✗ " + e)
        if len(errors) > 60:
            print("  … 还有 %d 条" % (len(errors) - 60))
        print("\n请修好后重跑：python3 en/tools/gen_audio.py")
        return 1
    print("\n🎉 音频校验通过（提示 %d 条）" % len(warnings))
    return 0


if __name__ == "__main__":
    sys.exit(main())
