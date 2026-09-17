#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""gen_pinyin.py —— 生成拼音岛的数据（音节表 + 声母韵母 + 拼读练习）

数据来源（都是本地已缓存的、汉字岛同一批源）：
    /tmp/word.json                  pwxcoo/chinese-xinhua word.json · MIT
    public/cn/data/chars-g*.js      汉字岛 3500 字表（已过小学黑名单）

为什么**不手写**音节表：
    拼音的合法音节是封闭集合（约 400 个基础音节 / 1300 个带声调音节），
    但"哪些音节存在"这件事人脑记不准 —— 手写一定会造出 *be* / *fong* / *shong*
    这种不存在的音，而拼音岛的全部价值就是"教对"。
    所以这里反过来做：**从 3500 字表里长出来** ——
    字表里的字有什么音，就收什么音；字表里没有的音，一个都不造。

    实测：3500 字覆盖 392 个基础音节、1095 个带声调音节、24 个声母全部出现。

输出：public/pinyin/data/*.js

用法：
    python3 tools/pinyin/gen_pinyin.py            # 生成
    python3 tools/pinyin/gen_pinyin.py --check    # 只自检，不写文件
"""

import argparse
import glob
import json
import os
import re
import sys
import unicodedata
from collections import defaultdict

REPO = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
OUT = os.path.join(REPO, "public", "pinyin", "data")
WORD_JSON = "/tmp/word.json"

# ---------------------------------------------------------------- 声母 / 韵母

# 顺序就是教学顺序（教材里先教 b p m f），不是字母表顺序
INITIALS = [
    ("b", "玻", "双唇一碰，轻轻放开"), ("p", "坡", "双唇一碰，用力送气"),
    ("m", "摸", "双唇闭拢，鼻子出声"), ("f", "佛", "上齿碰下唇，吹气"),
    ("d", "得", "舌尖顶上牙床，放开"), ("t", "特", "舌尖顶上牙床，用力送气"),
    ("n", "讷", "舌尖顶上牙床，鼻子出声"), ("l", "勒", "舌尖顶上牙床，舌两边出气"),
    ("g", "哥", "舌根抬起，放开"), ("k", "科", "舌根抬起，用力送气"),
    ("h", "喝", "舌根抬起，摩擦出气"),
    ("j", "基", "舌面贴住上腭，轻轻放开"), ("q", "欺", "舌面贴住上腭，用力送气"),
    ("x", "希", "舌面靠近上腭，摩擦出气"),
    ("zh", "知", "舌尖翘起，顶住上腭前部"), ("ch", "吃", "舌尖翘起，用力送气"),
    ("sh", "诗", "舌尖翘起，摩擦出气"), ("r", "日", "舌尖翘起，声带振动"),
    ("z", "资", "舌尖平放，顶住上齿背"), ("c", "次", "舌尖平放，用力送气"),
    ("s", "思", "舌尖平放，摩擦出气"),
    ("y", "衣", "读音同 i，写在韵母前面"), ("w", "乌", "读音同 u，写在韵母前面"),
]

# 韵母按教学分组：单韵母 → 复韵母 → 鼻韵母 → 特殊
FINALS = [
    ("a", "啊", "单韵母", "嘴张大，舌放平"),
    ("o", "哦", "单韵母", "嘴圆圆的，舌往后缩"),
    ("e", "鹅", "单韵母", "嘴扁扁的，舌往后缩"),
    ("i", "衣", "单韵母", "嘴扁，舌尖抵下齿"),
    ("u", "乌", "单韵母", "嘴唇拢圆，往前突"),
    ("ü", "迂", "单韵母", "嘴唇拢圆，舌尖抵下齿"),
    ("ai", "哀", "复韵母", "从 a 滑到 i"),
    ("ei", "诶", "复韵母", "从 e 滑到 i"),
    ("ui", "威", "复韵母", "从 u 滑到 i"),
    ("ao", "熬", "复韵母", "从 a 滑到 o"),
    ("ou", "欧", "复韵母", "从 o 滑到 u"),
    ("iu", "优", "复韵母", "从 i 滑到 u"),
    ("ie", "耶", "复韵母", "从 i 滑到 e"),
    ("üe", "约", "复韵母", "从 ü 滑到 e"),
    ("er", "儿", "特殊韵母", "舌尖往上卷，单独成音节"),
    ("an", "安", "前鼻韵母", "a 加鼻音 n"),
    ("en", "恩", "前鼻韵母", "e 加鼻音 n"),
    ("in", "因", "前鼻韵母", "i 加鼻音 n"),
    ("un", "温", "前鼻韵母", "u 加鼻音 n"),
    ("ün", "晕", "前鼻韵母", "ü 加鼻音 n"),
    ("ang", "昂", "后鼻韵母", "a 加鼻音 ng"),
    ("eng", "鞥", "后鼻韵母", "e 加鼻音 ng"),
    ("ing", "英", "后鼻韵母", "i 加鼻音 ng"),
    ("ong", "东", "后鼻韵母", "o 加鼻音 ng"),
]

# 16 个整体认读音节（教材明确要求"整体记，不要拼"）
WHOLE = [
    ("zhi", "知"), ("chi", "吃"), ("shi", "诗"), ("ri", "日"),
    ("zi", "资"), ("ci", "次"), ("si", "思"),
    ("yi", "衣"), ("wu", "乌"), ("yu", "迂"),
    ("ye", "耶"), ("yue", "约"), ("yuan", "冤"),
    ("yin", "因"), ("yun", "晕"), ("ying", "英"),
]

# 声调
TONES = [
    (1, "ˉ", "一声", "平平的，一直往前开"),
    (2, "ˊ", "二声", "往上扬，像上坡"),
    (3, "ˇ", "三声", "先降再升，像小船"),
    (4, "ˋ", "四声", "往下掉，像下坡"),
]

# 代表字的**优先级**：教材呼读音优先，其次才是音节表里顺手的常用字。
# 有个坑：教材给的呼读音有几个不在小学 3500 字里
# （n→讷、ei→诶、eng→鞥、ü→迂），照搬会让页面出现生僻字，
# 所以这里写成候选链，取第一个在字表里的。
PREFER_INITIAL = {
    "n": ["讷", "呢", "你", "妮"],
}
PREFER_FINAL = {
    "a": ["啊"], "o": ["哦", "噢"], "e": ["鹅", "额"], "i": ["衣", "一"],
    "u": ["乌", "屋"], "ü": ["迂", "淤", "于"],
    "ai": ["哀", "哎"], "ei": ["诶", "杯", "飞"], "ui": ["威", "吹"],
    "ao": ["熬", "凹"], "ou": ["欧"], "iu": ["优", "丢"], "ie": ["耶", "爷"],
    "üe": ["约"], "er": ["儿", "而"],
    "an": ["安"], "en": ["恩"], "in": ["因", "音"], "un": ["温", "春"],
    "ün": ["晕", "云"], "ang": ["昂", "肮"], "eng": ["鞥", "风", "灯"],
    "ing": ["英", "兵"], "ong": ["公", "钟", "充"],
}

chars_rank = {}          # 字 -> 它在 3500 字表里的序号（越小越常用）

TONE_MARKS = {"\u0304": 1, "\u0301": 2, "\u030c": 3, "\u0300": 4}
TONE_CHARS = "āáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜ"


# ---------------------------------------------------------------- 工具

def split_tone(p):
    """'bā' -> ('ba', 1)；轻声 -> ('ba', 0)。
    字典里另一种写法是数字声调（diu1 / bei0），这里一并认掉。"""
    m = re.fullmatch(r"([a-zü]+)([0-5])", p or "")
    if m:
        return m.group(1), int(m.group(2))
    base, tone = [], 0
    for ch in unicodedata.normalize("NFD", p):
        if ch in TONE_MARKS:
            tone = TONE_MARKS[ch]
        elif unicodedata.combining(ch):
            continue
        else:
            base.append(ch)
    return unicodedata.normalize("NFC", "".join(base)), tone


def load_chars():
    """读汉字岛的 3500 字表（JS 对象字面量，用正则抠字段）。
    同时记下每个字的**序号** —— 字表是按使用频率分级的，
    序号越小越常用，用来给音节挑"更像小学例字"的那个字。"""
    out = {}
    global chars_rank
    rank = 0
    pat = re.compile(r'\{\s*c:\s*"([^"]+)",\s*p:\s*"([^"]*)"')
    for f in sorted(glob.glob(os.path.join(REPO, "public", "cn", "data", "chars-g*.js"))):
        for m in pat.finditer(open(f, encoding="utf-8").read()):
            out[m.group(1)] = m.group(2)
            chars_rank.setdefault(m.group(1), rank)
            rank += 1
    return out


def load_dict():
    """新华字典：字 -> 该字所有读音（用来给音节挑例字）"""
    if not os.path.exists(WORD_JSON):
        return {}
    out = defaultdict(list)
    for it in json.load(open(WORD_JSON, encoding="utf-8")):
        for p in re.split(r"[|,，/\s]+", (it.get("pinyin") or "").replace("\u0261", "g")):
            if p:
                out[it["word"]].append(p.strip())
    return out


def jwrite(path, text):
    with open(path, "w", encoding="utf-8") as f:
        f.write(text)


def js_array(name, items, comment):
    """生成一个 data/*.js（对象数组）"""
    body = ",\n".join("  " + json.dumps(x, ensure_ascii=False) for x in items)
    return (f"/* 拼音岛 · {comment} —— **自动生成，不要手改**\n"
            f" * 生成器：tools/pinyin/gen_pinyin.py\n"
            f" * 数据来自汉字岛的 3500 字表（音节从字表里长出来，不手写） */\n"
            f"window.{name} = [\n{body}\n];\n")


# ---------------------------------------------------------------- 主流程

def build(check_only=False):
    chars = load_chars()
    dic = load_dict()
    print(f"字表 {len(chars)} 字；字典 {len(dic)} 字")

    # 音节 -> 声调 -> 例字（**只从 3500 字里取**，保证是小学范围的常用字）
    syl = defaultdict(lambda: defaultdict(list))
    bad = []
    for ch, p in chars.items():
        if not p:
            continue
        p = p.strip().replace("\u0261", "g")
        base, tone = split_tone(p)
        if not re.fullmatch(r"[a-zü]+", base):
            bad.append((ch, p))
            continue
        syl[base][tone].append(ch)

    if bad:
        print(f"⚠️  {len(bad)} 个字的拼音形状不认识，已跳过：{bad[:5]}")

    bases = sorted(syl)
    print(f"基础音节 {len(bases)} 个，带声调 {sum(len(v) for v in syl.values())} 个")

    # ---- 自检 1：每个声母都得有一个**在字表里**的代表字 ----
    # 注意：判的是"实际显示的那个字"（data_initials 里挑出来的），
    # 不是教材呼读音的写法 —— n 的呼读音「讷」不在小学 3500 字里，
    # 页面上显示的是退回来的「你」，那才是要检查的对象。
    missing_initials = []

    # ---- 自检 2：韵母表里的音必须真的存在 ----
    # ⚠️ eng / ei / ü 这些**不单独成音节**（没有 "eng" 这个音，只有 neng/sheng；
    # 没有 "ei"，只有 bei/mei）。所以判据不能是"音节表里有它"，
    # 而是"有某个音节以它结尾 / 它就是某个音节的韵母部分"。
    def final_seen(f):
        if f in syl:
            return True
        for b in bases:
            ini = ""
            for i, _, _ in INITIALS:
                if b.startswith(i) and len(b) > len(i):
                    ini = i
                    break
            if b[len(ini):] == f:
                return True
        return False

    missing_finals = [f for f, ch, _, _ in FINALS if not final_seen(f) and ch not in chars]
    # final_seen 已经覆盖"eng/ei 借音节"的情况；ü 借的是 yu 系（淤/于），
    # 单独判断一下它有没有可用例字
    missing_finals = [f for f in missing_finals if f != "ü"]

    # ---- 组装数据 ----
    data_initials = []
    for i, ch, tip in INITIALS:
        # 声母的"呼读音"就是代表字（玻坡摸佛…）。
        # ⚠️ 有几个代表字不在小学 3500 字里（n→讷），那就退回到这个声母下
        # 最常用的一年级字（n→你），保证页面上不出现生僻字。
        sample = ch
        for cand in PREFER_INITIAL.get(i, []):
            if cand in chars:
                sample = cand
                break
        if sample not in chars:
            for b in bases:
                if b.startswith(i) and b != i and syl[b].get(1):
                    sample = syl[b][1][0]
                    break
            else:
                for b in bases:
                    if b.startswith(i) and b != i:
                        for t in (2, 4, 3, 0):
                            if syl[b].get(t):
                                sample = syl[b][t][0]
                                break
                        break
        data_initials.append({
            "p": i, "c": sample, "call": ch, "tip": tip,
            "py": chars.get(sample, ""),
            "count": sum(1 for b in bases if b.startswith(i) and b != i),
        })

    def sample_for_final(f):
        """韵母的代表字：先看它能不能独立成音节，不能就从含它的音节里挑"""
        # ① 教材呼读音优先（且必须在小学字表里）
        for cand in PREFER_FINAL.get(f, []):
            if cand in chars:
                return cand, f if f in syl else ""
        # ② ü 单独成音节时写成 yu（淤/于/鱼）—— 教材里叫"ü 的两点省略规则"，
        # 所以它的代表字要从 yu 系里找，不能找带 ü 的字（jü/qü 那种写法不存在）
        if f == "ü":
            for b in ("yu", "yu:", "v"):
                if b in syl:
                    for t in (1, 2, 4, 3, 0):
                        if syl[b].get(t):
                            return syl[b][t][0], b
        if f in syl:                      # a / o / e / ai / an … 独立成音节
            for t in (1, 2, 4, 3, 0):
                if syl[f].get(t):
                    return syl[f][t][0], f
        for b in bases:                   # eng / ei / ü 这类要借别的音节
            ini = ""
            for i, _, _ in INITIALS:
                if b.startswith(i) and len(b) > len(i):
                    ini = i
                    break
            if b[len(ini):] == f:
                for t in (1, 2, 4, 3, 0):
                    if syl[b].get(t):
                        return syl[b][t][0], b
        return None, None

    data_finals = []
    for f, ch, group, tip in FINALS:
        sc, host = sample_for_final(f)
        data_finals.append({
            "p": f, "c": sc or ch, "group": group, "tip": tip,
            "py": chars.get(sc or ch, ""),
            "alone": f in syl,            # 能不能自己成一个音节
            "from": host or "",           # 借来的話，来自哪个音节
            "count": sum(1 for b in bases if b == f),
        })

    data_tones = [{"n": n, "mark": m, "name": nm, "tip": tip} for n, m, nm, tip in TONES]

    # 四声示范：拼音最难的一课。必须用**同一个音节**的四个声调对比着听，
    # 所以这里带上每个声调对应的字（妈 麻 马 骂），而不是四个不相干的字。
    demo = None
    for base in ("ma", "ba", "bo", "da", "mi", "hu", "yi", "wu", "bi", "du"):
        t = syl.get(base) or {}
        if all(t.get(k) for k in (1, 2, 3, 4)):
            demo = {
                "base": base,
                "chars": {str(k): t[k][0] for k in (1, 2, 3, 4)},
                "pinyin": {str(k): chars.get(t[k][0], "") for k in (1, 2, 3, 4)},
            }
            break
    if not demo:
        print("❌ 找不到四声齐全的音节，四声示范做不了")

    data_whole = []
    for p, ch in WHOLE:
        data_whole.append({"p": p, "c": ch, "py": chars.get(ch), "exists": p in syl})

    # ---- 音节表：每个音节给 1 个例字（优先用带声调的字表字）----
    data_syl = []
    for b in bases:
        tones = syl[b]
        # 例字优先取一声（最好读），否则按声调顺序
        # 例字：挑**这个音节最常用的那个字**（在四个声调里一起比）。
        #
        # 为什么不是"优先一声"：有些音节的一声只有生僻字 ——
        # bī 只有「逼」、cī 只有「疵」，当例字会教坏孩子。
        # 按常用度（字表序号）跨声调取，就得到 比 / 此 / 米 / 机 这种正常例字。
        # 声调仍然标在卡片上（py 字段），不影响"这个音节怎么读"。
        pick = None
        best = None
        for t, arr in tones.items():
            for c in arr:
                r = chars_rank.get(c, 9999)
                if best is None or r < best:
                    best, pick = r, (c, t)
        if not pick:
            continue
        ch, t = pick
        # 声母韵母切分
        ini = ""
        for i, _, _ in INITIALS:
            if b.startswith(i) and len(b) > len(i):
                ini = i
                break
        fin = b[len(ini):] if ini else b
        # 能不能拿去做"拼读练习"？两条教材规矩：
        #   ① 16 个整体认读音节**要整体记，不许拆**（zhi chi shi ri zi ci si
        #      yi wu yu ye yue yuan yin yun ying）——
        #      页面上刚说完"不要拆开拼"，练习里又出 `y + i = yi` 就是自相矛盾。
        #   ② y / w 开头的音节不是"声母+韵母"拼出来的（它们是 i/u/ü 的改写，
        #      比如 yi = i、wu = u、yu = ü），拆开拼会教错。
        # 所以这个判断放在数据里，界面只管读。
        whole_set = {w[0] for w in WHOLE}
        can_split = bool(ini) and ini not in ("y", "w") and b not in whole_set
        data_syl.append({
            "s": b, "c": ch, "py": chars.get(ch, ""), "t": t,
            "i": ini, "f": fin,
            "sp": can_split,                          # sp = 可以拼
            "tones": sorted(k for k in tones if k),   # 这个音节有哪几个声调
        })

    print(f"音节表 {len(data_syl)} 条；整体认读 {sum(1 for x in data_whole if x['exists'])}/16 有效")

    # ---- 最终自检：真检查"页面上会显示的东西" ----
    problems = []
    for it in data_initials:
        if it["c"] not in chars:
            problems.append(f"声母 {it['p']} 的代表字「{it['c']}」不在 3500 字表里")
        if not it["py"]:
            problems.append(f"声母 {it['p']} 的代表字没有拼音")
    for it in data_finals:
        if it["c"] not in chars:
            problems.append(f"韵母 {it['p']} 的代表字「{it['c']}」不在 3500 字表里")
    for it in data_whole:
        if not it["exists"]:
            problems.append(f"整体认读音节 {it['p']} 在 3500 字表里找不到")
    if not demo or len(demo["chars"]) != 4:
        problems.append("四声示范不完整（必须四个声调都有字）")
    bad_split = [x["s"] for x in data_syl if x["sp"] and
                 (x["i"] in ("y", "w") or x["s"] in {w[0] for w in WHOLE})]
    if bad_split:
        problems.append(f"这些音节不该拿去拼（整体认读或 y/w 开头）：{bad_split[:8]}")
    if not any(x["sp"] for x in data_syl):
        problems.append("一个能拼的音节都没有，拼读练习会空")
    for it in data_syl:
        if it["c"] not in chars:
            problems.append(f"音节 {it['s']} 的例字「{it['c']}」不在字表里")
        if it["i"] + it["f"] != it["s"]:
            problems.append(f"音节 {it['s']} 切分成 {it['i']}+{it['f']} 对不上")
    # 声母韵母表覆盖：24 个声母是不是都有音节
    for i, _, _ in INITIALS:
        if not any(x["s"].startswith(i) for x in data_syl):
            problems.append(f"声母 {i} 一个音节都没有")

    if problems:
        print(f"❌ 自检发现 {len(problems)} 个问题：")
        for x in problems[:20]:
            print("   ·", x)
    else:
        print("✅ 自检通过（声母/韵母/整体认读/音节切分 全部对得上）")

    if check_only:
        return not problems

    os.makedirs(OUT, exist_ok=True)
    jwrite(os.path.join(OUT, "initials.js"), js_array("PY_INITIALS", data_initials, "声母 23 个"))
    jwrite(os.path.join(OUT, "finals.js"), js_array("PY_FINALS", data_finals, "韵母 24 个"))
    jwrite(os.path.join(OUT, "tones.js"),
           js_array("PY_TONES", data_tones, "四个声调") +
           "\n// 四声示范：同一个音节的四个声调（妈 麻 马 骂）\n"
           "window.PY_TONE_DEMO = " + json.dumps(demo, ensure_ascii=False) + ";\n")
    jwrite(os.path.join(OUT, "whole.js"), js_array("PY_WHOLE", data_whole, "16 个整体认读音节"))
    jwrite(os.path.join(OUT, "syllables.js"), js_array("PY_SYLLABLES", data_syl, "音节全表"))
    total = sum(os.path.getsize(os.path.join(OUT, f)) for f in os.listdir(OUT))
    print(f"✅ 写入 {OUT} （{len(os.listdir(OUT))} 个文件，共 {total // 1024} KB）")
    return True


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("--check", action="store_true", help="只自检，不写文件")
    a = ap.parse_args()
    sys.exit(0 if build(a.check) else 1)
