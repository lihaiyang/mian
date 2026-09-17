#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""check_pinyin_audio.py —— 拼音音频自检

**为什么必须查**：音频是"看不见的失败"。合成出来的文件可能
  · 整段静音（TTS 没认出来，只吐了个空波形）
  · 时长离谱（0.05s = 没读到内容；>6s = 读成了别的东西）
  · 精灵里片段越界 / 重叠（播出来是半句话或别人的音）
而页面上只会表现为"点了没声音"或"读错了"，孩子和家长根本分不清是坏了还是自己没听清。

用法：python3 tools/pinyin/check_audio.py
"""
import json, os, subprocess, sys, wave, tempfile, struct

REPO = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
AUDIO = os.path.join(REPO, "public", "pinyin", "assets", "audio")
DATA = os.path.join(REPO, "public", "pinyin", "data")

problems, checks = [], 0

def load(name):
    with open(os.path.join(DATA, name + ".js"), encoding="utf-8") as f:
        src = f.read()
    i, j = src.index("["), src.rindex("]")
    return json.loads(src[i:j + 1])

def rms_of_pcm(pcm):
    n = len(pcm) // 2
    if n == 0: return 0.0
    a = struct.unpack("<%dh" % n, pcm)
    return (sum(x * x for x in a) / n) ** 0.5

# 期望的分组与它们该覆盖的 key
initials, finals, tones, whole = load("initials"), load("finals"), load("tones"), load("whole")

groups = {
    "sm":  [("i:" + x["p"]) for x in initials],
    "ym":  [("f:" + x["p"]) for x in finals],
    "sd":  [("d:1"), ("d:2"), ("d:3"), ("d:4")] + [("tn:%d" % x["n"]) for x in tones],
    "zt":  [("w:" + x["p"]) for x in whole if x.get("exists")],
}

total_clips = 0
for name, expect_keys in groups.items():
    jp = os.path.join(AUDIO, name + ".json")
    mp = os.path.join(AUDIO, name + ".m4a")
    checks += 1
    if not os.path.exists(jp) or not os.path.exists(mp):
        problems.append(f"{name}: 缺少 {name}.json / {name}.m4a")
        continue
    j = json.load(open(jp, encoding="utf-8"))
    clip = j["clip"]
    total_clips += len(clip)

    # 1) 该有的 key 一个都不能少
    missing = [k for k in expect_keys if k not in clip]
    if missing:
        problems.append(f"{name}: 缺 {len(missing)} 个 key，例如 {missing[:5]}")

    # 2) 每个片段的时长合理、且不越界
    dur_total = None
    for k, (start, dur) in clip.items():
        if dur < 0.12:
            problems.append(f"{name}/{k}: 片段只有 {dur:.3f}s（太短，多半是空音）")
        if dur > 6.0:
            problems.append(f"{name}/{k}: 片段 {dur:.1f}s（太长，可能读错了内容）")
        if start < 0:
            problems.append(f"{name}/{k}: start 是负数")
        dur_total = max(dur_total or 0, start + dur)

    # 3) 音频文件时长要盖得住最后一个片段
    with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as tf:
        wav = tf.name
    subprocess.run(["afconvert", "-f", "WAVE", "-d", "LEI16@22050", mp, wav],
                   check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    with wave.open(wav, "rb") as w:
        file_sec = w.getnframes() / float(w.getframerate())
        frames = w.readframes(w.getnframes())
    os.remove(wav)
    if file_sec + 0.05 < (dur_total or 0):
        problems.append(f"{name}: 音频 {file_sec:.2f}s 盖不住最后一个片段（到 {dur_total:.2f}s）")

    # 4) 整体不能是静音
    if rms_of_pcm(frames) < 200:
        problems.append(f"{name}: 整条音频几乎是静音（RMS {rms_of_pcm(frames):.0f}）")

print(f"检查了 {checks} 组、{total_clips} 个片段")
if problems:
    print(f"❌ {len(problems)} 个问题：")
    for p in problems[:30]:
        print("   ·", p)
    sys.exit(1)
print("✅ 拼音音频自检通过（key 齐全、片段时长合理、不越界、不是静音）")
