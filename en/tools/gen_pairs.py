#!/usr/bin/env python3
"""生成 en/data/minimal-pairs.js —— 「最小对立对」听辨题库。

为什么要它：英语站**只做本地节奏评测、不评测音准**（录音不出本机）。
既然机器听不出 ship/sheep 的差别，就把音准训练挪到**能自动判分的听力端**：
读出区别的前提是先听出区别。这里挑的都是中国孩子最容易混的音对。

用法：
    python3 en/tools/gen_pairs.py            # 生成
    python3 en/tools/gen_pairs.py --check    # 只校验不写文件
"""

import json
import os
import subprocess
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "data", "minimal-pairs.js")

# (词 A 的 id, 词 B 的 id, 这一对在练什么)
CURATED = [
    ("animals_cat", "clothes_hat", "k / h 开头"),
    ("clothes_cap", "food_cup", "短音 /æ/ 与 /ʌ/"),
    ("school_pen", "numbers_ten", "p / t 开头"),
    ("animals_dog", "weather_fog", "d / f 开头"),
    ("animals_bear", "food_pear", "b / p 开头"),
    ("animals_fox", "toys_box", "f / b 开头"),
    ("animals_cub", "food_cup", "b / p 结尾"),
    ("animals_goat", "transport_boat", "g / b 开头"),
    ("colors_gold", "weather_cold", "g / k 开头"),
    ("colors_pink", "home_sink", "p / s 开头"),
    ("clothes_ring", "school_sing", "r / s 开头"),
    ("body_nose", "colors_rose", "n / r 开头"),
    ("body_brain", "transport_train", "b / t 开头"),
    ("body_blood", "weather_flood", "bl / fl 开头"),
    ("clothes_leather", "weather_weather", "l / w 开头（中文母语最常混）"),
    ("colors_red", "home_bed", "r / b 开头"),
    ("body_face", "toys_race", "f / r 开头"),
    ("body_hair", "numbers_pair", "h / p 开头"),
    ("colors_blue", "school_glue", "b / g 开头"),
    ("clothes_crown", "colors_brown", "k / b 开头"),
]


def load():
    out = subprocess.run(["node", os.path.join(ROOT, "tools", "dump_data.mjs")],
                         capture_output=True, text=True)
    if out.returncode != 0:
        print("dump_data.mjs 失败:", out.stderr[:400])
        sys.exit(2)
    return json.loads(out.stdout)


def main():
    check_only = "--check" in sys.argv
    data = load()
    index = {}
    for theme, arr in data["words"].items():
        for w in arr:
            index[w["id"]] = w

    missing = [(a, b) for a, b, _ in CURATED if a not in index or b not in index]
    if missing:
        print("❌ 这些 id 不在词库里，请换成真实词条:", missing)
        sys.exit(1)

    items = []
    for a, b, focus in CURATED:
        wa, wb = index[a], index[b]
        items.append({
            "id": "pair_" + wa["word"].replace(" ", "") + "_" + wb["word"].replace(" ", ""),
            "focus": focus,
            "a": a, "b": b,
            "wordA": wa["word"], "wordB": wb["word"],
            "ipaA": wa["ipa"], "ipaB": wb["ipa"],
            "emojiA": wa["emoji"], "emojiB": wb["emoji"],
            "zhA": wa["zh"], "zhB": wb["zh"]
        })

    if check_only:
        print("✅ 听辨题库校验通过：%d 对" % len(items))

    js = []
    js.append("// 由 tools/gen_pairs.py 生成，勿手改")
    js.append("// 「最小对立对」听辨题库：机器不听音准，就把音准训练放到能自动判分的听力端")
    js.append("window.EN_PAIRS = [")
    for it in items:
        js.append("  {")
        js.append('    id: "%s", focus: "%s",' % (it["id"], it["focus"]))
        js.append('    a: "%s", b: "%s",' % (it["a"], it["b"]))
        js.append('    aInfo: { word: "%s", ipa: "%s", emoji: "%s", zh: "%s" },' % (it["wordA"], it["ipaA"], it["emojiA"], it["zhA"]))
        js.append('    bInfo: { word: "%s", ipa: "%s", emoji: "%s", zh: "%s" }' % (it["wordB"], it["ipaB"], it["emojiB"], it["zhB"]))
        js.append("  },")
    js.append("];")
    js.append("")
    text = "\n".join(js)
    if not check_only:
        with open(OUT, "w", encoding="utf-8") as f:
            f.write(text)
        print("✅ 已写入 %s（%d 对）" % (OUT, len(items)))
    print("   自测：node --check en/data/minimal-pairs.js")


if __name__ == "__main__":
    main()
