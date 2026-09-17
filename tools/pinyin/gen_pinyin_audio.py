#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""gen_pinyin_audio.py —— 拼音岛发音（音频精灵）

**为什么必须自己写一份，而不是照抄英语站那套**：

  1. 拼音的发音单位是**音节**，而 `say` 把裸拼音当字母名读
     （实测 `say -v Tingting "b"` → 0.34s 的 "bee"，`"ā"` → 0.19s 的怪音）。
     所以每条音频都要先映射到**汉字**再合成 —— 这个映射表是这份脚本的核心资产。
  2. 1097 个带声调音节 × 中文 TTS ≈ 十几 MB，全站一次下载不可接受。
     所以按"孩子正在练什么"分组：声母一组、韵母一组、四声一组、
     拼读按难度分 4 组 —— 一次只下几十 KB。
  3. 中文 TTS 没有英语那种"字母名 vs 音素"的分工，
     拼读练习（b + ā = bā）要合成**三小段再接**，把孩子要听的三步拆开。

链路（和英语站一致，都是本地工具、零外部依赖）：
    say -v Tingting --data-format=LEI16@22050  →  去首尾静音  →  拼 sprite.wav
        →  afconvert -f m4af -d aac -b 32000  →  assets/audio/<组>.m4a + .json

用法：
    python3 tools/pinyin/gen_pinyin_audio.py             # 增量（hash 没变就跳过）
    python3 tools/pinyin/gen_pinyin_audio.py --force     # 全部重做
    python3 tools/pinyin/gen_pinyin_audio.py --only sm,ym # 只做某几组
    python3 tools/pinyin/gen_pinyin_audio.py --list      # 只列分组
    python3 tools/pinyin/gen_pinyin_audio.py --probe     # 抽 5 条试听，不写站点文件
"""

import argparse
import concurrent.futures as futures
import hashlib
import json
import os
import re
import shutil
import subprocess
import sys
import tempfile
import time
import wave

REPO = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
DATA = os.path.join(REPO, "public", "pinyin", "data")
OUTDIR = os.path.join(REPO, "public", "pinyin", "assets", "audio")

RATE = 22050
CHANNELS = 1
SAMPWIDTH = 2
TRIM_THRESHOLD = 300
TRIM_PAD_SEC = 0.05
GAP_SEC = 0.25
VOICE = "Tingting"          # 系统自带的标准普通话女声，教拼音最稳
MAX_CLIP_SEC = 6.0
MIN_CLIP_SEC = 0.12


# ---------------------------------------------------------------- 输入

def load_data():
    """读拼音岛的 data/*.js（window.PY_X = [...] 形式）"""
    out = {}
    for name in ("initials", "finals", "tones", "whole", "syllables"):
        path = os.path.join(DATA, name + ".js")
        if not os.path.exists(path):
            print("✗ 缺少 %s（先跑 tools/pinyin/gen_pinyin.py）" % path, file=sys.stderr)
            sys.exit(2)
        src = open(path, encoding="utf-8").read()
        i = src.index("["); j = src.rindex("]")
        out[name] = json.loads(src[i:j + 1])
    # 四声示范单独挂在 tones.js 末尾（window.PY_TONE_DEMO = {...}）
    tsrc = open(os.path.join(DATA, "tones.js"), encoding="utf-8").read()
    m = re.search(r"window\.PY_TONE_DEMO\s*=\s*(\{.*?\});", tsrc, re.S)
    out["tone_demo"] = json.loads(m.group(1)) if m else None
    return out


# ---------------------------------------------------------------- 分组

def build_groups(d):
    """→ (groups, problems)。key 的命名规则见 README 里那张表。

    分寸感在这里：**一次只让孩子下他正在练的那一组**。
    """
    groups, problems = [], []

    # 1) 声母：每个声母读它的呼读音（玻 坡 摸…）
    pairs = []
    for it in d["initials"]:
        if not it.get("c"):
            problems.append(("sm", "%s 没有代表字" % it.get("p")))
            continue
        if not it.get("py"):
            problems.append(("sm", "%s 的代表字「%s」没有拼音" % (it.get("p"), it["c"])))
        pairs.append(("i:" + it["p"], it["c"]))
    groups.append(("sm", pairs))

    # 2) 韵母：同上（啊 哦 鹅…）
    pairs = []
    for it in d["finals"]:
        if not it.get("c"):
            problems.append(("ym", "%s 没有代表字" % it.get("p")))
            continue
        if not it.get("py"):
            problems.append(("ym", "%s 的代表字「%s」没有拼音" % (it.get("p"), it["c"])))
        pairs.append(("f:" + it["p"], it["c"]))
    groups.append(("ym", pairs))

    # 3) 四声：同一个音节四个调（妈 麻 马 骂）—— 这是拼音最难的一课，
    #    必须用**同一个音节的四个声调**对比着听。
    #    做法：挑一个四声齐全的音节（ma），把四个调都合成出来。
    syl_by_base = {}
    for it in d["syllables"]:
        syl_by_base.setdefault(it["s"], {})[it.get("t") or 0] = it["c"]
    pairs = []
    demo = d.get("tone_demo")
    if not demo or not demo.get("chars"):
        problems.append(("sd", "没有四声示范数据（先跑 gen_pinyin.py）"))
    else:
        for n in ("1", "2", "3", "4"):
            ch = (demo["chars"] or {}).get(n)
            if ch:
                pairs.append(("d:%s" % n, ch))
            else:
                problems.append(("sd", "%s 声没有示范字" % n))
    # 声调本身的"名称"也读一遍（一声/二声…），指令性文字
    for it in d["tones"]:
        pairs.append(("tn:%d" % it["n"], "%s，%s" % (it["name"], it["tip"].split("，")[0])))
    groups.append(("sd", pairs))

    # 4) 整体认读 16 个（知 吃 诗 日…）—— 教材要求"整体记，不要拼"
    pairs = []
    for it in d["whole"]:
        if it.get("exists") and it.get("c"):
            pairs.append(("w:" + it["p"], it["c"]))
        else:
            problems.append(("zt", "整体认读 %s 没有例字" % it.get("p")))
    groups.append(("zt", pairs))

    # 5) 拼读：把音节按"声母 + 韵母"的难度分 4 组。
    #    难度按韵母长短：单韵母 → 复韵母 → 鼻韵母。
    SINGLE = set("a o e i u ü".split())
    COMPOUND = set("ai ei ui ao ou iu ie üe er".split())
    bucket = {"bd1": [], "bd2": [], "bd3": [], "bd4": []}
    for it in d["syllables"]:
        s, f = it["s"], it["f"]
        if not it.get("i"):
            continue                      # 零声母（a/an/ang…）不练"拼"
        if f in SINGLE:
            bucket["bd1"].append(it)
        elif f in COMPOUND:
            bucket["bd2"].append(it)
        elif it["i"] in ("zh", "ch", "sh", "r") or f.endswith("ng"):
            bucket["bd4"].append(it)      # 翘舌音 + 后鼻音：汉语里最难的两类
        else:
            bucket["bd3"].append(it)
    for g in ("bd1", "bd2", "bd3", "bd4"):
        pairs = []
        for it in bucket[g]:
            # 拼读练习要三段：声母、韵母、合起来。key 用音节自带的信息拼。
            pairs.append(("p:" + it["s"], it["c"]))
        groups.append((g, pairs))

    return groups, problems


# ---------------------------------------------------------------- 合成

def run(cmd, **kw):
    return subprocess.run(cmd, check=True, stdout=subprocess.PIPE,
                          stderr=subprocess.PIPE, **kw)


def _first_loud(a, n, block=512):
    for b in range(0, n, block):
        chunk = a[b:b + block]
        if max(chunk) > TRIM_THRESHOLD or min(chunk) < -TRIM_THRESHOLD:
            for i in range(b, min(b + block, n)):
                if abs(a[i]) > TRIM_THRESHOLD:
                    return i
    return -1


def _last_loud(a, n, block=512):
    for b in range(n - 1, -1, -block):
        start = max(0, b - block + 1)
        chunk = a[start:b + 1]
        if max(chunk) > TRIM_THRESHOLD or min(chunk) < -TRIM_THRESHOLD:
            for i in range(b, start - 1, -1):
                if abs(a[i]) > TRIM_THRESHOLD:
                    return i
    return -1


def trim_silence(pcm, rate=RATE):
    """去掉首尾静音，前后各留 50ms。全静音返回 b""。"""
    import array
    n = len(pcm) // SAMPWIDTH
    if n <= 0:
        return b""
    a = array.array("h")
    a.frombytes(pcm[:n * SAMPWIDTH])
    if sys.byteorder == "big":
        a.byteswap()
    first = _first_loud(a, n)
    if first < 0:
        return b""
    last = _last_loud(a, n)
    pad = int(rate * TRIM_PAD_SEC)
    lo = max(0, first - pad)
    hi = min(n, last + 1 + pad)
    out = a[lo:hi]
    if sys.byteorder == "big":
        out.byteswap()
    return out.tobytes()


def synth_one(text, voice, tmpdir):
    """合成一条 → 去静音后的 PCM，返回 (秒数, 字节)。失败抛异常。"""
    tag = hashlib.sha1(text.encode("utf-8")).hexdigest()[:16]
    wav_path = os.path.join(tmpdir, tag + ".wav")
    cmd = ["say", "-v", voice, "--data-format=LEI16@%d" % RATE, "-o", wav_path, text]
    try:
        run(cmd, timeout=120)
        with wave.open(wav_path, "rb") as w:
            if w.getnchannels() != CHANNELS or w.getsampwidth() != SAMPWIDTH:
                raise RuntimeError("音频格式不是 %dch/%dbit" % (CHANNELS, SAMPWIDTH * 8))
            if w.getframerate() != RATE:
                raise RuntimeError("采样率不是 %d（实际 %d）" % (RATE, w.getframerate()))
            frames = w.readframes(w.getnframes())
    finally:
        if os.path.exists(wav_path):
            os.remove(wav_path)
    pcm = trim_silence(frames)
    if not pcm:
        raise RuntimeError("合成结果是空的或整段静音（%r 可能没有可发音内容）" % text)
    dur = len(pcm) / float(SAMPWIDTH) / RATE
    if dur > MAX_CLIP_SEC:
        raise RuntimeError("片段太长 %.1fs（%r）" % (dur, text))
    return dur, pcm


def texts_hash(pairs):
    h = hashlib.sha256()
    for k, t in pairs:
        h.update(("%s\x00%s\x00" % (k, t)).encode("utf-8"))
    return h.hexdigest()[:16]


def pack(name, pairs, pcm_of, tmpdir):
    """拼 sprite → m4a → json。返回 (条数, 秒数, 字节数)"""
    gap = b"\x00" * (int(RATE * GAP_SEC) * SAMPWIDTH)
    clip, offset = {}, 0.0
    sprite = os.path.join(tmpdir, "sprite-%s.wav" % name)
    with wave.open(sprite, "wb") as w:
        w.setnchannels(CHANNELS)
        w.setsampwidth(SAMPWIDTH)
        w.setframerate(RATE)
        first = True
        for key, text in pairs:
            pcm = pcm_of[text]
            dur = len(pcm) / float(SAMPWIDTH) / RATE
            clip[key] = [round(offset, 3), round(dur, 3)]
            if not first:
                w.writeframes(gap)
                offset += GAP_SEC
            w.writeframes(pcm)
            offset += dur
            first = False
    m4a = os.path.join(OUTDIR, name + ".m4a")
    tmp_m4a = os.path.join(tmpdir, "out-%s.m4a" % name)
    run(["afconvert", "-f", "m4af", "-d", "aac", "-b", "32000", sprite, tmp_m4a])
    os.replace(tmp_m4a, m4a)
    os.remove(sprite)
    with open(os.path.join(OUTDIR, name + ".json"), "w", encoding="utf-8") as f:
        json.dump({"group": name, "file": name + ".m4a", "rate": RATE,
                   "count": len(clip), "hash": texts_hash(pairs), "clip": clip},
                  f, ensure_ascii=False, separators=(",", ":"))
    return len(clip), offset, os.path.getsize(m4a)


# ---------------------------------------------------------------- 主流程

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--force", action="store_true")
    ap.add_argument("--only", default="")
    ap.add_argument("--list", action="store_true")
    ap.add_argument("--probe", action="store_true", help="只合成几条试听，不写站点文件")
    ap.add_argument("--jobs", type=int, default=6)
    ap.add_argument("--voice", default=VOICE)
    a = ap.parse_args()

    if not shutil.which("say") or not shutil.which("afconvert"):
        print("✗ 需要 macOS 的 say 和 afconvert", file=sys.stderr)
        return 2

    d = load_data()
    groups, problems = build_groups(d)

    if a.list:
        for name, pairs in groups:
            print("%-5s %4d 条   %s" % (name, len(pairs), "、".join(t for _, t in pairs[:8])))
        if problems:
            print("\n⚠️  %d 个问题：" % len(problems))
            for g, p in problems[:20]:
                print("   [%s] %s" % (g, p))
        return 0

    if problems:
        print("⚠️  数据里有 %d 个问题（下面的分组会跳过它们）：" % len(problems))
        for g, p in problems[:10]:
            print("   [%s] %s" % (g, p))

    only = [x.strip() for x in a.only.split(",") if x.strip()]
    if only:
        groups = [(n, p) for n, p in groups if n in only]

    if a.probe:
        groups = [(n, p[:3]) for n, p in groups[:2]]

    os.makedirs(OUTDIR, exist_ok=True)
    tmpdir = tempfile.mkdtemp(prefix="py-audio-")
    t0 = time.time()
    total_clips = total_sec = total_bytes = 0
    try:
        for name, pairs in groups:
            if not pairs:
                print("· %-5s 空组，跳过" % name)
                continue
            jpath = os.path.join(OUTDIR, name + ".json")
            if not a.force and not a.probe and os.path.exists(jpath):
                try:
                    old = json.load(open(jpath, encoding="utf-8"))
                    if old.get("hash") == texts_hash(pairs):
                        print("· %-5s 没变，跳过（%d 条）" % (name, len(pairs)))
                        continue
                except Exception:
                    pass
            # 同一个汉字可能出现在多组里（衣既是 i 也是 yi），按文本去重后只合成一次
            uniq = sorted({t for _, t in pairs})
            pcm_of = {}
            errs = []
            with futures.ThreadPoolExecutor(max_workers=a.jobs) as ex:
                futs = {ex.submit(synth_one, t, a.voice, tmpdir): t for t in uniq}
                for fu in futures.as_completed(futs):
                    t = futs[fu]
                    try:
                        dur, pcm = fu.result()
                        pcm_of[t] = pcm
                    except Exception as e:
                        errs.append((t, str(e)))
            for t, msg in errs:
                print("   ✗ %r：%s" % (t, msg))
            pairs = [(k, t) for k, t in pairs if t in pcm_of]
            if not pairs:
                print("   ✗ %s 一条都没成功，跳过" % name)
                continue
            n, sec, size = pack(name, pairs, pcm_of, tmpdir)
            total_clips += n
            total_sec += sec
            total_bytes += size
            print("✓ %-5s %3d 条  %5.1fs  %6.1f KB" % (name, n, sec, size / 1024.0))
    finally:
        shutil.rmtree(tmpdir, ignore_errors=True)

    print("\n共 %d 条、%.1f 秒、%.1f KB，用时 %.1fs" %
          (total_clips, total_sec, total_bytes / 1024.0, time.time() - t0))
    if a.probe:
        print("（--probe：只试听，没写站点文件）")
    return 0


if __name__ == "__main__":
    sys.exit(main())
