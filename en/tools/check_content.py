#!/usr/bin/env python3
"""校验 en/data 下的内容数据（词库 / 拼读 / 句子 / 绘本 / 关卡）。

设计原则（照搬萌码 Python 的 gen_exercises.py）：
  * ERRORS 必须为 0 才算通过；WARNINGS 是"应该修但可以先放着"的提示。
  * 任何一条 ERROR 都会以非零退出码结束，方便接进流程。

用法：
    python3 en/tools/check_content.py            # 全量校验
    python3 en/tools/check_content.py --quiet    # 只打印汇总与错误
"""

import json
import os
import re
import subprocess
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
THEMES = ["colors", "numbers", "body", "family", "food", "animals",
          "clothes", "toys", "school", "weather", "transport", "home"]
THEMES_ZH = {
    "colors": "颜色", "numbers": "数字", "body": "身体", "family": "家庭",
    "food": "食物", "animals": "动物", "clothes": "衣物", "toys": "玩具",
    "school": "学校", "weather": "天气", "transport": "交通", "home": "家居",
}

errors = []
warnings = []


def E(msg):
    errors.append(msg)


def W(msg):
    warnings.append(msg)


def load():
    out = subprocess.run(
        ["node", os.path.join(ROOT, "tools", "dump_data.mjs")],
        capture_output=True, text=True,
    )
    if out.returncode != 0:
        print("dump_data.mjs 失败：", out.stderr[:800])
        sys.exit(2)
    for line in out.stderr.splitlines():
        if line.startswith("LOAD_FAIL"):
            E("数据文件加载失败 -> " + line)
    return json.loads(out.stdout)


VOWELS = "aeiouy"


def guess_syllables(word):
    """粗估音节数：数元音组，减去词尾不发音的 e，处理 -le 结尾。"""
    w = re.sub(r"[^a-z]", "", word.lower())
    if not w:
        return 1
    groups = re.findall(r"[aeiouy]+", w)
    n = len(groups)
    if w.endswith("e") and not w.endswith(("le", "ee", "ye")) and n > 1:
        n -= 1
    if w.endswith("le") and len(w) > 2 and w[-3] not in VOWELS:
        n += 1
    return max(1, n)


def check_words(data):
    words = data["words"]
    seen = {}
    total = 0
    for theme in THEMES:
        arr = words.get(theme)
        if arr is None:
            E("缺少主题文件/主题数据：%s（%s）" % (theme, THEMES_ZH[theme]))
            continue
        if not isinstance(arr, list):
            E("主题 %s 不是数组" % theme)
            continue
        if len(arr) < 40:
            W("主题 %s 只有 %d 个词（目标 50）" % (theme, len(arr)))
        for it in arr:
            total += 1
            wid = it.get("id", "")
            where = "%s/%s" % (theme, wid or "?")
            if not re.fullmatch(r"[a-z]+_[a-z0-9_]+", wid or ""):
                E("%s: id 格式不对（应形如 food_apple）" % where)
            if wid in seen:
                E("%s: id 重复（另一个在 %s）" % (where, seen[wid]))
            seen[wid] = theme
            if it.get("theme") != theme:
                E("%s: theme 字段应为 %s，实际 %r" % (where, theme, it.get("theme")))
            if wid and not wid.startswith(theme + "_"):
                E("%s: id 前缀应与主题一致" % where)
            word = (it.get("word") or "").strip()
            if not word:
                E("%s: 缺少 word" % where)
            elif not re.fullmatch(r"[A-Za-z][A-Za-z' -]*", word):
                E("%s: word 含非法字符：%r" % (where, word))
            ipa = it.get("ipa") or ""
            if not (ipa.startswith("/") and ipa.endswith("/") and len(ipa) > 2):
                E("%s: ipa 必须用斜杠包裹，例如 /ˈæpl/（实际 %r）" % (where, ipa))
            if not (it.get("zh") or "").strip():
                E("%s: 缺少中文释义" % where)
            if it.get("grade") not in (1, 2, 3):
                E("%s: grade 必须是 1/2/3（实际 %r）" % (where, it.get("grade")))
            if not (it.get("emoji") or "").strip():
                E("%s: 缺少 emoji 配图" % where)
            syll = it.get("syll")
            if not isinstance(syll, int) or syll < 1:
                E("%s: syll 必须是 ≥1 的整数（音节数）" % where)
            elif word and abs(guess_syllables(word) - syll) >= 1 and word.lower() != word:
                W("%s: syll=%d，但按拼写估算约 %d —— 请确认" % (where, syll, guess_syllables(word)))
            sent = it.get("sent") or {}
            if not (sent.get("en") or "").strip():
                E("%s: 缺少例句 sent.en" % where)
            if not (sent.get("zh") or "").strip():
                E("%s: 缺少例句翻译 sent.zh" % where)
            if word and sent.get("en"):
                stem = word.lower().rstrip("s")
                if stem and stem not in sent["en"].lower():
                    W("%s: 例句里没有出现 %s（例句：%s）" % (where, word, sent["en"]))
            ph = it.get("phonics")
            if ph is not None and not (isinstance(ph, list) and all(isinstance(x, str) and x for x in ph)):
                E("%s: phonics 必须是字符串数组" % where)
            if it.get("rhyme") is not None and not isinstance(it["rhyme"], list):
                E("%s: rhyme 必须是数组" % where)
    return total, seen


def check_cross(data, seen):
    """依赖全部主题都在的交叉校验。"""
    words = data["words"]
    if len([t for t in THEMES if words.get(t)]) < len(THEMES):
        return
    for theme in THEMES:
        for it in words[theme]:
            for r in it.get("rhyme") or []:
                if r.lower() not in {w["word"].lower() for w in words[theme]} and \
                   not any(r.lower() == x["word"].lower() for t in THEMES for x in words[t]):
                    W("%s: rhyme 里的 %r 不在词库里" % (it["id"], r))


def check_phonics(data):
    letters = data["letters"]
    ph = data["phonics"]
    if len(letters) != 26:
        E("EN_LETTERS 必须恰好 26 个字母（实际 %d）" % len(letters))
    for i, l in enumerate(letters):
        want = chr(ord("A") + i)
        if l.get("letter") != want:
            E("EN_LETTERS 第 %d 项应为 %s，实际 %r" % (i + 1, want, l.get("letter")))
        for k in ("lower", "name", "sound", "emoji"):
            if not l.get(k):
                E("字母 %s 缺字段 %s" % (l.get("letter"), k))
        ws = l.get("words") or []
        if len(ws) < 2:
            E("字母 %s 至少要有 2 个例词" % l.get("letter"))
        for w in ws:
            if not re.fullmatch(r"[a-z]+", w or ""):
                E("字母 %s 的例词 %r 必须是小写纯字母" % (l.get("letter"), w))
            elif not w.startswith(l.get("lower", "?")):
                W("字母 %s 的例词 %r 不是以该字母开头" % (l.get("letter"), w))
    if len(ph) < 30:
        W("EN_PHONICS 只有 %d 关（目标 30）" % len(ph))
    ids = set()
    for p in ph:
        pid = p.get("id")
        if not pid or pid in ids:
            E("拼读关 id 缺失或重复：%r" % pid)
        ids.add(pid)
        for k in ("unit", "title", "emoji", "tip"):
            if not p.get(k):
                E("拼读关 %s 缺字段 %s" % (pid, k))
        if p.get("grade") not in (1, 2, 3):
            E("拼读关 %s 的 grade 非法" % pid)
        if not p.get("teach"):
            E("拼读关 %s 缺 teach 讲解" % pid)
        bl = p.get("blends") or []
        if len(bl) < 4:
            E("拼读关 %s 至少 4 个拼读词（实际 %d）" % (pid, len(bl)))
        for b in bl:
            if not b.get("word") or not b.get("emoji"):
                E("拼读关 %s 的 blends 项缺 word/emoji" % pid)
            blocks = b.get("blocks") or []
            if "".join(blocks) and "".join(blocks).lower() != (b.get("word") or "").lower():
                E("拼读关 %s：blocks %r 拼起来不等于 word %r" % (pid, blocks, b.get("word")))


def check_sentences(data):
    ss = data["sentences"]
    if len(ss) < 100:
        W("EN_SENTENCES 只有 %d 个句型（目标 100）" % len(ss))
    ids = set()
    for s in ss:
        sid = s.get("id")
        if not sid or sid in ids:
            E("句型 id 缺失或重复：%r" % sid)
        ids.add(sid)
        for k in ("pattern", "zh", "emoji", "say"):
            if not s.get(k):
                E("句型 %s 缺字段 %s" % (sid, k))
        if "___" not in (s.get("pattern") or ""):
            E("句型 %s 的 pattern 必须含 ___ 占位符" % sid)
        if s.get("grade") not in (1, 2, 3):
            E("句型 %s 的 grade 非法" % sid)
        bl = s.get("blanks") or []
        if len(bl) < 3:
            E("句型 %s 至少 3 个替换词（实际 %d）" % (sid, len(bl)))
        for b in bl:
            if not b.get("word") or not b.get("emoji"):
                E("句型 %s 的 blanks 项缺 word/emoji" % sid)
        rp = s.get("reply") or {}
        if not rp.get("q") or not rp.get("a"):
            E("句型 %s 缺 reply.q / reply.a" % sid)


def check_readers(data):
    rs = data["readers"]
    if len(rs) < 20:
        W("EN_READERS 只有 %d 本（目标 20）" % len(rs))
    ids = set()
    for r in rs:
        rid = r.get("id")
        if not rid or rid in ids:
            E("绘本 id 缺失或重复：%r" % rid)
        ids.add(rid)
        for k in ("title", "titleZh", "emoji", "level"):
            if not r.get(k):
                E("绘本 %s 缺字段 %s" % (rid, k))
        if r.get("grade") not in (1, 2, 3):
            E("绘本 %s 的 grade 非法" % rid)
        pages = r.get("pages") or []
        if len(pages) < 8:
            E("绘本 %s 少于 8 页（实际 %d）" % (rid, len(pages)))
        for i, p in enumerate(pages):
            if not (p.get("en") or "").strip() or not (p.get("zh") or "").strip():
                E("绘本 %s 第 %d 页缺 en/zh" % (rid, i + 1))
        q = r.get("quiz") or []
        if len(q) < 3:
            E("绘本 %s 至少 3 道理解小测（实际 %d）" % (rid, len(q)))
        for item in q:
            opts = item.get("options") or []
            if len(opts) < 3:
                E("绘本 %s 的题目选项少于 3 个" % rid)
            if len(set(opts)) != len(opts):
                E("绘本 %s 的题目选项有重复" % rid)
            if not isinstance(item.get("answer"), int) or not (0 <= item["answer"] < len(opts)):
                E("绘本 %s 的 answer 越界" % rid)


def check_pairs(data):
    """最小对立对听辨题库：两个词必须都在词库里（否则没音频、也没法学）"""
    pairs = data.get("pairs") or []
    if len(pairs) < 10:
        W("EN_PAIRS 只有 %d 对（目标 20）" % len(pairs))
    all_ids = set()
    for theme in THEMES:
        for w in data["words"].get(theme) or []:
            all_ids.add(w["id"])
    seen = set()
    for p in pairs:
        pid = p.get("id")
        if not pid or pid in seen:
            E("听辨对 id 缺失或重复：%r" % pid)
        seen.add(pid)
        for side in ("a", "b"):
            wid = p.get(side)
            if not wid:
                E("听辨对 %s 缺 %s 侧词条" % (pid, side))
            elif all_ids and wid not in all_ids:
                E("听辨对 %s 的 %s=%s 不在词库里" % (pid, side, wid))
            info = p.get(side + "Info") or {}
            for k in ("word", "ipa", "emoji"):
                if not info.get(k):
                    E("听辨对 %s 的 %sInfo 缺 %s" % (pid, side, k))
        if not p.get("focus"):
            W("听辨对 %s 没写 focus（练的是什么音）" % pid)


def check_levels(data):
    levels = data["levels"]
    islands = data["islands"]
    kinds = {"letters", "phonics", "themes", "sentences", "readers", "exams"}
    if len(islands) != 6:
        E("EN_ISLANDS 必须 6 座岛（实际 %d）" % len(islands))
    for i in islands:
        if i.get("kind") not in kinds:
            E("岛屿 %s 的 kind 非法：%r" % (i.get("id"), i.get("kind")))
    all_ids = set()
    for theme in THEMES:
        for w in data["words"].get(theme) or []:
            all_ids.add(w["id"])
    for lv in levels:
        lid = lv.get("id")
        if not lid:
            E("关卡缺 id")
            continue
        ws = lv.get("words") or []
        if len(ws) < 3:
            E("关卡 %s 词太少" % lid)
        for w in ws:
            if all_ids and w not in all_ids:
                E("关卡 %s 引用了不存在的词 %s" % (lid, w))


def main():
    quiet = "--quiet" in sys.argv
    data = load()
    total, seen = check_words(data)
    check_cross(data, seen)
    check_phonics(data)
    check_sentences(data)
    check_readers(data)
    check_pairs(data)
    check_levels(data)

    print("=" * 60)
    print("词条 %d 个 · 主题 %d/12 · 拼读 %d 关 · 句型 %d 个 · 绘本 %d 本 · 听辨 %d 对 · 关卡 %d 个"
          % (total, len([t for t in THEMES if data["words"].get(t)]),
             len(data["phonics"]), len(data["sentences"]), len(data["readers"]),
             len(data.get("pairs") or []), len(data["levels"])))
    print("=" * 60)
    if warnings and not quiet:
        print("\n警告 %d 条：" % len(warnings))
        for w in warnings[:60]:
            print("  ⚠ " + w)
        if len(warnings) > 60:
            print("  … 还有 %d 条" % (len(warnings) - 60))
    if errors:
        print("\n错误 %d 条：" % len(errors))
        for e in errors[:80]:
            print("  ✗ " + e)
        if len(errors) > 80:
            print("  … 还有 %d 条" % (len(errors) - 80))
        sys.exit(1)
    print("\n✅ 内容校验通过（警告 %d 条）" % len(warnings))


if __name__ == "__main__":
    main()
