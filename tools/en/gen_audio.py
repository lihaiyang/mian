#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""gen_audio.py —— 批量合成音频精灵（audio sprite）。

链路：
    node tools/dump_data.mjs  ──►  取全站要发音的文本
        ↓
    say -v Samantha --data-format=LEI16@22050 -o clip.wav "<文本>"   （8 并发）
        ↓
    标准库 wave 读 PCM → 去首尾静音（阈值 300/32768，前后留 50ms）
        ↓
    同组片段拼接（片段之间插 250ms 静音）→ sprite.wav
        ↓
    afconvert -f m4af -d aac -b 32000 sprite.wav <组>.m4a
        ↓
    assets/audio/<组>.json   { "group","file","rate":22050,"count","hash","clip"{key:[start,dur]} }

分组规则：
    * 词库     —— 每个主题一组（food / colors / …）
    * 字母     —— letters.m4a
    * 拼读     —— phonics.m4a
    * 绘本     —— 每 5 本一组（readers-1.m4a …）
    * 句型     —— sentences.m4a

用法：
    python3 en/tools/gen_audio.py                     # 增量合成（hash 没变就跳过）
    python3 en/tools/gen_audio.py --force             # 全部重新合成
    python3 en/tools/gen_audio.py --only food,colors  # 只做某几组
    python3 en/tools/gen_audio.py --list              # 只列出分组，不合成
    python3 en/tools/gen_audio.py --jobs 4 --voice Samantha

注意：只用标准库 wave 读写 PCM。**不要用 aifc / audioop**（Python 3.13+ 已移除）。
"""

import argparse
import concurrent.futures as futures
import hashlib
import json
import os
import shutil
import subprocess
import sys
import tempfile
import time
import wave

# ---------------------------------------------------------------- 常量

RATE = 22050                 # 采样率：say --data-format=LEI16@22050
CHANNELS = 1
SAMPWIDTH = 2                # 16bit
TRIM_THRESHOLD = 300         # 静音阈值 ≈ 300/32768
TRIM_PAD_SEC = 0.05          # 去静音后，前后各留 50ms 呼吸
GAP_SEC = 0.25               # 片段之间插 250ms 静音
MIN_CLIP_SEC = 0.20          # 太短的片段会被 check_audio.py 拦下，这里先提示
MAX_CLIP_SEC = 12.0
READERS_PER_GROUP = 5        # 绘本每 5 本一组
LETTERS_GROUP = "letters"
PHONICS_GROUP = "phonics"
SENTENCES_GROUP = "sentences"
DEFAULT_VOICE = "Samantha"
DEFAULT_JOBS = 8
HASH_LEN = 16                # json 里 hash 用 sha256 前 16 位十六进制

THEMES = ["colors", "numbers", "body", "family", "food", "animals",
          "clothes", "toys", "school", "weather", "transport", "home"]

# ---------------------------------------------------------------- 小工具


def en_root():
    """英语站站点根 = <仓库根>/public/en"""
    return os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), "public", "en")


def jdump(obj):
    """紧凑 JSON，方便直接发给浏览器。"""
    return json.dumps(obj, ensure_ascii=False, separators=(",", ":"))


def jwrite(path, obj, tmpdir):
    """原子写 JSON（先写临时文件再 replace），避免半截文件。"""
    tmp = os.path.join(tmpdir, "tmp-" + os.path.basename(path))
    with open(tmp, "w", encoding="utf-8") as f:
        f.write(jdump(obj))
        f.write("\n")
    os.replace(tmp, path)


def print_problems(problems, limit=40):
    """把「缺发音文本」的条目全部列出来（不许静默跳过）。"""
    print("\n✗ 有 %d 条内容缺发音文本，相关分组不会输出：" % len(problems))
    for gname, msg in problems[:limit]:
        print("  ✗ [%s] %s" % (gname, msg))
    if len(problems) > limit:
        print("  … 还有 %d 条" % (len(problems) - limit))


def texts_hash(pairs):
    """一组片段（key + 文本）的指纹：文本哪怕改一个字，hash 就会变。"""
    h = hashlib.sha256()
    for key, text in pairs:
        h.update(key.encode("utf-8"))
        h.update(b"\x00")
        h.update(text.encode("utf-8"))
        h.update(b"\n")
    return h.hexdigest()[:HASH_LEN]


def text_tag(text):
    """同一段文本只合成一次（词库里 "a" 这种会重复出现）。"""
    return hashlib.sha1(text.encode("utf-8")).hexdigest()[:16]


def human_kb(path):
    try:
        n = os.path.getsize(path)
    except OSError:
        return "-"
    if n < 1024:
        return "%d B" % n
    if n < 1024 * 1024:
        return "%.1f KB" % (n / 1024.0)
    return "%.2f MB" % (n / 1048576.0)


def run(cmd, **kw):
    """跑外部命令，失败时把 stderr 一起带出来。"""
    p = subprocess.run(cmd, capture_output=True, text=True, **kw)
    if p.returncode != 0:
        raise RuntimeError("%s 失败（exit %d）：%s"
                           % (cmd[0], p.returncode, (p.stderr or p.stdout or "").strip()[:300]))
    return p.stdout


# ---------------------------------------------------------------- 读数据


def voice_available(voice):
    """say -v '?' 列出可用音色；查不到就给个响亮的提示（say 会静默退回默认嗓音）。"""
    try:
        out = run(["say", "-v", "?"])
    except Exception:
        return None                      # 查不了就不拦
    names = set()
    for line in out.splitlines():
        parts = line.split()
        if parts:
            names.add(parts[0])
    if not names:
        return None
    return voice in names


def load_data(root, quiet=False):
    """调 node tools/dump_data.mjs 把 data/*.js 倒成 JSON。"""
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
        data = json.loads(p.stdout)
    except ValueError as e:
        print("✗ dump_data.mjs 输出的不是合法 JSON：%s" % e, file=sys.stderr)
        sys.exit(2)
    if not quiet:
        files = data.get("_files") or []
        print("📖 数据：%s" % ("、".join(files) if files else "（data/ 下还没有数据文件）"))
    return data


# ---------------------------------------------------------------- 分组


def build_groups(data):
    """→ ([(组名, [(key, 文本), …]), …], [(组名, 问题), …])。

    顺序固定，方便增量比对；**本该有音频却没有文本的条目一律记进 problems**，
    绝不静默跳过（少了音频却不吭声，孩子那边就是「点了没声音」）。
    """
    groups, problems = [], []
    words = data.get("words") or {}

    # 1) 词库：每个主题一组
    for theme in THEMES:
        arr = words.get(theme) or []
        pairs = []
        for it in arr:
            wid = (it.get("id") or "").strip()
            word = (it.get("word") or "").strip()
            if not wid:
                problems.append((theme, "有个词条没有 id：%r" % (it.get("word") or it)))
                continue
            if word:
                pairs.append((wid + "#w", word))
            else:
                problems.append((theme, "%s#w 缺文本（word 是空的）" % wid))
            sent = ((it.get("sent") or {}).get("en") or "").strip()
            if sent:
                pairs.append((wid + "#s", sent))
            else:
                problems.append((theme, "%s#s 缺文本（sent.en 是空的）" % wid))
        if pairs:
            groups.append((theme, pairs))

    # 2) 字母：26 个字母名
    pairs = []
    for it in data.get("letters") or []:
        letter = (it.get("letter") or "").strip()
        if not letter:
            problems.append((LETTERS_GROUP, "有个字母条目没有 letter 字段"))
            continue
        # name 是字母名的拼读写法（A → "ay"），say 读它最准；没有就退回字母本身
        pairs.append((letter + "#n", (it.get("name") or "").strip() or letter))
    if pairs:
        groups.append((LETTERS_GROUP, pairs))

    # 3) 拼读：每个拼读词一条
    pairs = []
    for unit in data.get("phonics") or []:
        pid = (unit.get("id") or "").strip()
        if not pid:
            problems.append((PHONICS_GROUP, "有个拼读关没有 id"))
            continue
        for b in unit.get("blends") or []:
            word = (b.get("word") or "").strip()
            if word:
                pairs.append(("ph:%s:%s#w" % (pid, word), word))
            else:
                problems.append((PHONICS_GROUP, "%s 里有个拼读词没有 word" % pid))
    if pairs:
        groups.append((PHONICS_GROUP, pairs))

    # 4) 句型：say 字段（整句示范音）
    pairs = []
    for s in data.get("sentences") or []:
        sid = (s.get("id") or "").strip()
        if not sid:
            problems.append((SENTENCES_GROUP, "有个句型没有 id"))
            continue
        say_text = (s.get("say") or "").strip()
        if say_text:
            pairs.append((sid + "#s", say_text))
        else:
            problems.append((SENTENCES_GROUP, "%s#s 缺文本（say 是空的）" % sid))
    if pairs:
        groups.append((SENTENCES_GROUP, pairs))

    # 5) 绘本：每 5 本一组
    readers = data.get("readers") or []
    for i in range(0, len(readers), READERS_PER_GROUP):
        gname = "readers-%d" % (i // READERS_PER_GROUP + 1)
        pairs = []
        for r in readers[i:i + READERS_PER_GROUP]:
            rid = (r.get("id") or "").strip()
            if not rid:
                problems.append((gname, "有本绘本没有 id"))
                continue
            for n, page in enumerate(r.get("pages") or [], start=1):
                en = (page.get("en") or "").strip()
                if en:
                    pairs.append(("%s#p%d" % (rid, n), en))
                else:
                    problems.append((gname, "%s 第 %d 页缺文本（en 是空的）" % (rid, n)))
        if pairs:
            groups.append((gname, pairs))

    return groups, problems


# ---------------------------------------------------------------- 合成


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
    if sys.byteorder == "big":          # wave 给的是小端，大端机器要翻一下
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


def synth_one(text, voice, raw_dir, pcm_dir):
    """合成一条 → 去静音后的 PCM 文件，返回 (片段秒数, 路径)。失败抛异常。"""
    tag = text_tag(text)
    wav_path = os.path.join(raw_dir, tag + ".wav")
    pcm_path = os.path.join(pcm_dir, tag + ".pcm")
    cmd = ["say", "-v", voice, "--data-format=LEI16@%d" % RATE, "-o", wav_path, text]
    try:
        run(cmd, timeout=120)
        with wave.open(wav_path, "rb") as w:
            if w.getnchannels() != CHANNELS or w.getsampwidth() != SAMPWIDTH:
                raise RuntimeError("音频格式不是 %dch/%dbit（实际 %dch/%dbit）"
                                   % (CHANNELS, SAMPWIDTH * 8, w.getnchannels(), w.getsampwidth() * 8))
            if w.getframerate() != RATE:
                raise RuntimeError("采样率不是 %d（实际 %d）" % (RATE, w.getframerate()))
            frames = w.readframes(w.getnframes())
    finally:
        if os.path.exists(wav_path):
            os.remove(wav_path)
    pcm = trim_silence(frames)
    if not pcm:
        raise RuntimeError("合成结果为空或整段静音（文本可能没有可发音内容）")
    dur = len(pcm) / float(SAMPWIDTH) / RATE
    with open(pcm_path, "wb") as f:
        f.write(pcm)
    return dur, pcm_path


# ---------------------------------------------------------------- 打包


def pack_group(name, pairs, pcm_of, m4a_path, json_path, tmpdir):
    """把一组的 PCM 拼成 wav → afconvert 转 m4a → 写 json。→ (条数, 音频总秒数)"""
    gap = b"\x00" * (int(RATE * GAP_SEC) * SAMPWIDTH)
    clip = {}
    offset = 0.0
    sprite_wav = os.path.join(tmpdir, "sprite-%s.wav" % name)
    with wave.open(sprite_wav, "wb") as w:
        w.setnchannels(CHANNELS)
        w.setsampwidth(SAMPWIDTH)
        w.setframerate(RATE)
        first = True
        for key, text in pairs:
            with open(pcm_of[text], "rb") as f:
                pcm = f.read()
            dur = len(pcm) / float(SAMPWIDTH) / RATE
            clip[key] = [round(offset, 3), round(dur, 3)]
            if not first:
                w.writeframes(gap)
                offset += GAP_SEC
            w.writeframes(pcm)
            offset += dur
            first = False

    tmp_m4a = os.path.join(tmpdir, "out-%s.m4a" % name)
    run(["afconvert", "-f", "m4af", "-d", "aac", "-b", "32000", sprite_wav, tmp_m4a])
    os.replace(tmp_m4a, m4a_path)
    os.remove(sprite_wav)

    jwrite(json_path, {
        "group": name,
        "file": os.path.basename(m4a_path),
        "rate": RATE,
        "count": len(clip),
        "hash": texts_hash(pairs),
        "clip": clip,
    }, tmpdir)
    return len(clip), offset


# ---------------------------------------------------------------- 主流程


def parse_args(argv):
    ap = argparse.ArgumentParser(
        description="合成音频精灵（say → 拼接 → AAC m4a + json 索引）")
    ap.add_argument("--force", action="store_true", help="忽略 hash，全部重新合成")
    ap.add_argument("--only", default="", help="只做这几组，逗号分隔，例如 food,colors,letters")
    ap.add_argument("--list", dest="list_only", action="store_true", help="只列出分组与条数，不合成")
    ap.add_argument("--jobs", type=int, default=DEFAULT_JOBS, help="并发数（默认 8）")
    ap.add_argument("--voice", default=DEFAULT_VOICE, help="say 的音色（默认 Samantha）")
    ap.add_argument("--root", default=None, help="en/ 模块根目录（默认脚本上一级，测试用）")
    return ap.parse_args(argv)


def main(argv=None):
    args = parse_args(argv if argv is not None else sys.argv[1:])
    t0 = time.time()
    root = os.path.abspath(args.root) if args.root else en_root()
    audio_dir = os.path.join(root, "assets", "audio")
    os.makedirs(audio_dir, exist_ok=True)

    if not shutil.which("say"):
        print("✗ 找不到 say（本脚本依赖 macOS 的 say / afconvert / afinfo）", file=sys.stderr)
        return 2
    if not shutil.which("afconvert"):
        print("✗ 找不到 afconvert（macOS 自带）", file=sys.stderr)
        return 2

    known = voice_available(args.voice)
    if known is False:
        print("⚠ 音色 %r 不在 say 的列表里（say 会退回默认嗓音，听起来可能不是预期音色）" % args.voice)
        print("  可用音色：say -v '?'  |  推荐 en_US 的 Samantha")

    data = load_data(root)
    groups, problems = build_groups(data)
    broken = {}
    for gname, msg in problems:
        broken.setdefault(gname, []).append(msg)
    if not groups:
        print("✗ 没有任何可合成的文本：data/ 下的词库/字母/拼读/句型/绘本是不是还没写好？")
        if problems:
            print_problems(problems)
        return 2

    if args.list_only:
        total = 0
        print("分组 %d 个：" % len(groups))
        for name, pairs in groups:
            total += len(pairs)
            print("  %-14s %4d 条%s" % (name, len(pairs),
                                        "  ✗ 有 %d 条缺文本" % len(broken[name]) if name in broken else ""))
        print("合计 %d 条片段" % total)
        if problems:
            print_problems(problems)
            return 1
        return 0

    only = [x.strip() for x in args.only.split(",") if x.strip()]
    known = [g[0] for g in groups]
    if only:
        unknown = [x for x in only if x not in known]
        if unknown:
            print("✗ --only 里有不认识的分组：%s" % "、".join(unknown))
            print("  可选：%s" % "、".join(known))
            return 2
        groups = [g for g in groups if g[0] in only]
        problems = [(g, m) for g, m in problems if g in only]
        broken = {g: m for g, m in broken.items() if g in only}

    if problems:
        print_problems(problems)

    print("🎧 开始合成：%d 组 · 并发现 %d · 音色 %s"
          % (len(groups), max(1, args.jobs), args.voice))

    # 增量判断：hash 没变且产物都在 → 整组跳过
    todo, skipped = [], []
    for name, pairs in groups:
        if name in broken:
            print("  ✗ %-14s 不输出（%d 条内容缺发音文本，见上面清单）" % (name, len(broken[name])))
            continue
        json_path = os.path.join(audio_dir, name + ".json")
        m4a_path = os.path.join(audio_dir, name + ".m4a")
        if not args.force and os.path.exists(json_path) and os.path.exists(m4a_path):
            try:
                with open(json_path, "r", encoding="utf-8") as f:
                    old = json.load(f)
                if old.get("hash") == texts_hash(pairs) and old.get("count") == len(pairs):
                    skipped.append((name, len(pairs)))
                    continue
            except (ValueError, OSError):
                pass
        todo.append((name, pairs))

    skipped_clips = sum(n for _, n in skipped)
    for name, n in skipped:
        print("  ⏭  %-14s 跳过（hash 未变，%d 条）" % (name, n))

    if not todo:
        if problems:
            return 1
        print("\n✨ 全部已是最新：跳过 %d 组（%d 条片段）· 用时 %.1fs"
              % (len(skipped), skipped_clips, time.time() - t0))
        return 0

    # 去重后并发合成
    texts = []
    seen = set()
    for _, pairs in todo:
        for _, text in pairs:
            if text not in seen:
                seen.add(text)
                texts.append(text)
    print("🔊 需要合成 %d 条片段（去重后 %d 段文本，可复用的不再重复调 say）"
          % (sum(len(p) for _, p in todo), len(texts)))

    tmpdir = tempfile.mkdtemp(prefix="en_audio_")
    raw_dir = os.path.join(tmpdir, "raw")
    pcm_dir = os.path.join(tmpdir, "pcm")
    os.makedirs(raw_dir)
    os.makedirs(pcm_dir)
    pcm_of, fails, durations = {}, {}, {}
    done = 0
    with futures.ThreadPoolExecutor(max_workers=max(1, args.jobs)) as pool:
        futs = {pool.submit(synth_one, t, args.voice, raw_dir, pcm_dir): t for t in texts}
        for fut in futures.as_completed(futs):
            text = futs[fut]
            done += 1
            try:
                dur, path = fut.result()
                pcm_of[text] = path
                durations[text] = dur
            except Exception as e:                # 单条失败不影响其它，但最后一定报出来
                fails[text] = str(e)
            if done % 100 == 0 or done == len(texts):
                print("    … %d/%d" % (done, len(texts)))

    if fails:
        print("\n✗ 有 %d 段文本合成失败（这些组不会输出，修好后重跑）：" % len(fails))
        for text, err in list(fails.items())[:40]:
            print("  ✗ %r -> %s" % (text, err))
        if len(fails) > 40:
            print("  … 还有 %d 条" % (len(fails) - 40))

    # 逐组打包
    produced, too_short = [], []
    for name, pairs in todo:
        bad = [t for _, t in pairs if t in fails]
        if bad:
            print("  ✗ %-14s 跳过输出（%d 条文本合成失败）" % (name, len(bad)))
            continue
        for k, t in pairs:                     # 太短/太长的片段都值得人看一眼
            d = durations.get(t, 0)
            if d < MIN_CLIP_SEC:
                too_short.append("%s %s %.3fs（太短）" % (name, k, d))
            elif d > MAX_CLIP_SEC:
                too_short.append("%s %s %.3fs（太长）" % (name, k, d))
        tg = time.time()
        count, total_sec = pack_group(
            name, pairs, pcm_of,
            os.path.join(audio_dir, name + ".m4a"),
            os.path.join(audio_dir, name + ".json"),
            tmpdir)
        size = human_kb(os.path.join(audio_dir, name + ".m4a"))
        print("  ✅ %-14s %4d 条 · %8s · %6.1fs 音频 · 打包 %.1fs"
              % (name, count, size, total_sec, time.time() - tg))
        produced.append((name, count, size))

    shutil.rmtree(tmpdir, ignore_errors=True)

    new_clips = sum(n for _, n, _ in produced)
    print("\n" + "=" * 64)
    print("合成 %d 条片段 · 跳过 %d 组（%d 条）· 输出 %d 组 · 用时 %.1fs"
          % (new_clips, len(skipped), skipped_clips, len(produced), time.time() - t0))
    if too_short:
        print("⚠ 有 %d 条片段长度可疑（短于 %.2fs 或长于 %.0fs，建议核对文本；"
              "check_audio.py 会因此报错）：" % (len(too_short), MIN_CLIP_SEC, MAX_CLIP_SEC))
        for line in too_short[:10]:
            print("   ⚠ " + line)
    if fails or problems:
        if fails:
            print("✗ 合成失败 %d 条" % len(fails))
        if problems:
            print("✗ 缺发音文本 %d 条" % len(problems))
        print("   详见上面清单；这些组没有输出，修好后重跑本脚本")
        return 1
    print("🎉 音频精灵已就绪：%s" % audio_dir)
    return 0


if __name__ == "__main__":
    sys.exit(main())
