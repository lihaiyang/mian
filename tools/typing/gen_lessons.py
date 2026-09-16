#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""键盘岛 · 内容生成器

    python3 tools/typing/gen_lessons.py            # 生成 public/typing/data/lessons.js
    python3 tools/typing/gen_lessons.py --check    # 只校验，不写文件

沿用萌码 Python 那条规矩：**生成前先把内容校验一遍，任何一条不合格就报错、
不写文件**。手写题库最容易出的错是"混进了打不出来的字符"或者"某一关太短"，
这些在这里就被拦下来。

校验项：
  1. 每个字符都必须能用美式键盘直接敲出来（含 Enter / 空格），
     不含中文标点、全角字符、Emoji —— 那些会让孩子卡住却不知道为什么
  2. 每一关的文本长度必须达标（太短练不出手感）
  3. 关卡 id 全站唯一
  4. 声明的 keys 必须真的在文本里出现过（否则"练了这组键"是假的）
"""
import json
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
REPO = os.path.dirname(os.path.dirname(HERE))
OUT = os.path.join(REPO, "public", "typing", "data", "lessons.js")

# 美式键盘能直接敲出来的可见字符 + 空格（换行用 \n 表示，对应 Enter 键）
TYPEABLE = set(
    "abcdefghijklmnopqrstuvwxyz"
    "ABCDEFGHIJKLMNOPQRSTUVWXYZ"
    "0123456789"
    "`-=[]\\;',./"
    "~!@#$%^&*()_+{}|:\"<>?"
    " "
)

MIN_LEN = 60          # 单关最少字符数

LESSONS = []
_lid = [0]


def lesson(stage, stage_id, title, desc, text, keys, target_wpm, target_acc, tip=""):
    _lid[0] += 1
    LESSONS.append({
        "id": "ty_%03d" % _lid[0],
        "stage": stage,
        "stageId": stage_id,
        "title": title,
        "desc": desc,
        "tip": tip,
        "keys": list(keys),
        "text": text,
        "targetWpm": target_wpm,
        "targetAcc": target_acc,
    })


# ============================================================ 第一阶：基准键位
S = "asdf jkl; "
lesson("基准键位", "home", "左手四指：asdf",
       "食指 f、中指 d、无名指 s、小指 a。打完一组就把手指收回原位。",
       "aaa sss ddd fff asdf asdf fdsa fdsa ad ad sf sf "
       "aass ddff ffdd ssaa asdf fdsa asdf fdsa a s d f f d s a",
       ["a", "s", "d", "f"], 12, 92,
       "手腕别贴桌子，手指自然弯一点")

lesson("基准键位", "home", "右手四指：jkl;",
       "食指 j、中指 k、无名指 l、小指 ;。左右手各管一半，别互相越界。",
       "jjj kkk lll ;;; jkl; jkl; ;lkj ;lkj jk jk kl kl "
       "jjkk ll;; ;;ll kkjj jkl; ;lkj jkl; ;lkj j k l ; ; l k j",
       ["j", "k", "l", ";"], 12, 92,
       "两个食指分别放在 f 和 j 的小凸起上，那是盲打的路标")

lesson("基准键位", "home", "左右手合练",
       "八个手指各就各位，眼睛看屏幕，不要低头找键。",
       "asdf jkl; asdf jkl; fdsa ;lkj fdsa ;lkj "
       "aa ss dd ff jj kk ll ;; ad sf jk l; da fs kj ;l "
       "as df jk l; sa fd kj l; asdf jkl; fdsa ;lkj",
       ["a", "s", "d", "f", "j", "k", "l", ";"], 15, 93)

# ============================================================ 第二阶：上排
lesson("上排", "top", "左手往上：qwer",
       "从 asdf 往上抬就是 qwer。打完记得收回来。",
       "qqq www eee rrr qwer qwer rewq rewq qq ww ee rr "
       "qw er re wq qwer rewq qwer rewq q w e r r e w q "
       "aq sw de fr aq sw de fr qa ws ed rf",
       ["q", "w", "e", "r"], 14, 92)

lesson("上排", "top", "右手往上：uiop",
       "从 jkl; 往上抬就是 uiop。右手小指管 p，稍微有点远，多练几次就顺了。",
       "uuu iii ooo ppp uiop uiop poiu poiu uu ii oo pp "
       "ui op po iu uiop poiu uiop poiu u i o p p o i u "
       "ju ki lo ;p ju ki lo ;p uj ik ol p;",
       ["u", "i", "o", "p"], 14, 92)

lesson("上排", "top", "上下排混合",
       "手指在上下两排之间移动，每次都回到基准键位再出发。",
       "aq sw de fr ju ki lo ;p qwer uiop asdf jkl; "
       "the quick brown fox jumps over the lazy dog "
       "we you they our your quit type wire pure quiet",
       ["q", "w", "e", "r", "u", "i", "o", "p"], 18, 93,
       "试着打英文单词，而不是一个字母一个字母地找")

# ============================================================ 第三阶：下排
lesson("下排", "bottom", "左手往下：zxcv",
       "从 asdf 往下就是 zxcv。往下比往上别扭，慢一点没关系。",
       "zzz xxx ccc vvv zxcv zxcv vcxz vcxz zz xx cc vv "
       "zx cv vc xz zxcv vcxz zxcv vcxz z x c v v c x z "
       "az sx dc fv az sx dc fv za xs cd vf",
       ["z", "x", "c", "v"], 13, 91)

lesson("下排", "bottom", "右手往下：bnm",
       "右手往下是 bnm，逗号句号也在这一排。b 用左手食指，别用右手。",
       "bbb nnn mmm ,,, ... bnm, bnm, ,mnb ,mnb bb nn mm "
       "bn m, ,m nb bnm, ,mnb b n m , , m n b "
       "fb jn km l, fb jn km l, bf nj mk ,l",
       ["b", "n", "m", ",", "."], 13, 91,
       "b 归左手食指，这是一个例外，记住就好")

lesson("下排", "bottom", "三排混合",
       "上中下三排都动起来，这才是真正的打字。",
       "the quick brown fox jumps over the lazy dog "
       "my box has six big zebra cubs in it "
       "can you mix every comic box and zoom back",
       ["z", "x", "c", "v", "b", "n", "m"], 20, 93)

# ============================================================ 第四阶：数字与符号
lesson("数字与符号", "num", "数字排",
       "数字键在最上面一排，手指要伸得比较远。打完一定回基准位。",
       "111 222 333 444 555 666 777 888 999 000 "
       "1234 5678 90 1234567890 0987654321 "
       "12 34 56 78 90 21 43 65 87 09 123 456 789 0",
       ["1", "2", "3", "4", "5", "6", "7", "8", "9", "0"], 15, 90)

lesson("数字与符号", "num", "常用标点",
       "中文输入法下打不出这些符号，练的时候记得切到英文。",
       "hello, world. how are you? i am fine! "
       "yes; no: maybe. it's ok - really (sure) "
       "a-b c_d e.f g,h i;j k'l m\"n",
       [",", ".", ";", ":", "'", "-", "_", '"', "?", "!"], 16, 90)

# ============================================================ 第五阶：编程符号
lesson("编程符号", "code", "括号与引号",
       "写代码最常用的就是这组符号。它们都在键盘右边，用小指和无名指。",
       "() () {} {} [] [] <> <> (){}[] (){}[] "
       "(a) {b} [c] <d> (a){b}[c]<d> "
       "'' \"\" '' \"\" 'a' \"b\" 'a'\"b\"",
       ["(", ")", "{", "}", "[", "]", "<", ">", "'", '"'], 15, 88,
       "打括号的时候两只手一起动，别只用一只手")

lesson("编程符号", "code", "运算与赋值",
       "等号、加号、星号、斜杠，还有 # 注释号。",
       "= + - * / # = + - * / # == != <= >= += -= "
       "a = 1 b = 2 c = a + b print(c) "
       "# this is a comment x = y * 2 z = x / 3",
       ["=", "+", "-", "*", "/", "#"], 17, 88)

lesson("编程符号", "code", "Python 关键字",
       "把常用的关键字打熟，写代码时就不用低头找键了。",
       "def for in if else elif while return import print "
       "def add(a, b): return a + b "
       "x = 1 total = x * 2 "
       "for i in range(10): print(i) "
       "if x > 0: print('yes') else: print('no')",
       ["(", ")", ":", ",", "=", "+", ">", "'"], 20, 90,
       "冒号 : 和等号 = 出现得最多，单独多练几遍")

# ============================================================ 第六阶：单词与短句
lesson("单词与短句", "words", "常用英文单词",
       "连续打单词，目标是形成肌肉记忆，不用想每个字母在哪。",
       "the of and to in is you that it he was for on are "
       "as with his they i at be this have from or one had "
       "by word but not what all were we when your can said",
       [], 22, 92)

lesson("单词与短句", "words", "编程常用词",
       "这些词你在代码里天天见，值得单独练熟。",
       "print input range while for def return import "
       "list dict string number value index result "
       "true false none self class object method error",
       [], 24, 92)

lesson("单词与短句", "words", "一句话",
       "标点、大小写、空格都要照顾到，接近真实打字了。",
       "The quick brown fox jumps over the lazy dog. "
       "Practice makes perfect, so keep going! "
       "Code is like humor: when you have to explain it, it is bad.",
       [], 25, 93,
       "大写字母用另一只手的小指按 Shift，两只手配合")


# ============================================================ 校验 + 输出

def check():
    errs = []
    seen = set()

    for l in LESSONS:
        # 1. id 唯一
        if l["id"] in seen:
            errs.append("%s 关卡 id 重复" % l["id"])
        seen.add(l["id"])

        # 2. 字符可打
        bad = sorted({c for c in l["text"] if c not in TYPEABLE})
        if bad:
            errs.append("%s「%s」含打不出来的字符：%s"
                        % (l["id"], l["title"], " ".join(repr(c) for c in bad)))

        # 3. 长度达标
        if len(l["text"]) < MIN_LEN:
            errs.append("%s「%s」太短（%d < %d）"
                        % (l["id"], l["title"], len(l["text"]), MIN_LEN))

        # 4. 声明的 keys 真的出现过
        missing = [k for k in l["keys"] if k not in l["text"]]
        if missing:
            errs.append("%s「%s」声明的 keys 没在文本里出现：%s"
                        % (l["id"], l["title"], " ".join(missing)))

        # 5. 文本首尾不要有多余空格（会让孩子以为要打空格）
        if l["text"] != l["text"].strip():
            errs.append("%s「%s」文本首尾有多余空格" % (l["id"], l["title"]))

    # 6. 至少覆盖六个阶段
    stages = {l["stageId"] for l in LESSONS}
    need = {"home", "top", "bottom", "num", "code", "words"}
    if stages != need:
        errs.append("阶段不全，缺：%s" % " ".join(sorted(need - stages)))

    return errs


def main():
    check_only = "--check" in sys.argv
    errs = check()
    if errs:
        print("❌ 内容校验没通过，%d 个问题：" % len(errs), file=sys.stderr)
        for e in errs[:30]:
            print("   - " + e, file=sys.stderr)
        sys.exit(1)

    stages = []
    for l in LESSONS:
        if l["stageId"] not in [s["id"] for s in stages]:
            stages.append({"id": l["stageId"], "name": l["stage"]})

    total_chars = sum(len(l["text"]) for l in LESSONS)
    print("✅ 校验通过：%d 关，%d 个阶段，共 %d 个字符"
          % (len(LESSONS), len(stages), total_chars))
    for s in stages:
        n = len([l for l in LESSONS if l["stageId"] == s["id"]])
        print("   %-10s %d 关" % (s["name"], n))

    if check_only:
        print("（--check 模式，未写文件）")
        return

    os.makedirs(os.path.dirname(OUT), exist_ok=True)
    body = json.dumps(LESSONS, ensure_ascii=False, indent=1)
    with open(OUT, "w", encoding="utf-8") as fh:
        fh.write("// 键盘岛 · 关卡数据（由 tools/typing/gen_lessons.py 生成，勿手改）\n")
        fh.write("// 共 %d 关 / %d 阶段；改内容请改生成器再重跑。\n" % (len(LESSONS), len(stages)))
        fh.write("window.TYPING_STAGES = %s;\n\n"
                 % json.dumps(stages, ensure_ascii=False))
        fh.write("window.TYPING_LESSONS = ")
        fh.write(body)
        fh.write(";\n")
    print("✅ 已写出 %s（%.1f KB）"
          % (os.path.relpath(OUT, REPO), os.path.getsize(OUT) / 1024.0))


if __name__ == "__main__":
    main()
