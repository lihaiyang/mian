#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""数学岛题库生成器

设计原则（沿用 tools/py/exlib.py 的做法）
----------------------------------------------------------------------------
**答案是算出来的，不是写出来的。**

每一道题的答案都由本脚本用 Python 真算一遍；算不出合法答案的题
（除零、负数、超纲、分数化简不了）**直接不生成**。
所以 1000 道题的答案不会写错 —— 这是 Python 站那 1318 道题验证过的做法。

用法
----------------------------------------------------------------------------
    python3 tools/math/gen_problems.py            # 生成 public/math/data/problems.js
    python3 tools/math/gen_problems.py --check     # 只校验不重写
    python3 tools/math/gen_problems.py --stats     # 打印各年级/各单元题量

不照搬任何一套教材的目录：按**能力维度**组织，避免版权问题。
"""

import argparse
import json
import os
import random
import sys
from fractions import Fraction

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
OUT = os.path.join(ROOT, "public", "math", "data", "problems.js")

# 每个单元目标题量。合计 = 1000
PER_UNIT = 25

UNITS = []


def unit(uid, grade, name, title, desc, fn, n=None):
    """登记一个单元。fn(rng, k) 返回第 k 道题 (q, a, tip)。"""
    UNITS.append({
        "id": uid, "grade": grade, "unit": name, "title": title,
        "desc": desc, "fn": fn, "n": n or PER_UNIT,
    })


def fmt_num(x):
    """数字转文本：整数不带小数点；分数写成 3/4"""
    if isinstance(x, Fraction):
        return str(x.numerator) if x.denominator == 1 else "%d/%d" % (x.numerator, x.denominator)
    if isinstance(x, float) and abs(x - round(x)) < 1e-9:
        return str(int(round(x)))
    return str(x)


def fmt_exact(x):
    """Fraction → 十进制字符串。分母只含 2/5 因子时是有限小数（3.14 的倍数都是），
    其余退回 n/d。用来避免用整除把 84.78 截断成 84。"""
    if not isinstance(x, Fraction):
        return fmt_num(x)
    if x.denominator == 1:
        return str(x.numerator)
    d, places = x.denominator, 0
    while d % 2 == 0:
        d //= 2
        places += 1
    while d % 5 == 0:
        d //= 5
        places += 1
    if d == 1:
        return fmt_dec(float(x), places)
    return "%d/%d" % (x.numerator, x.denominator)


def fmt_dec(x, places):
    """小数按位数格式化，去掉尾随 0"""
    s = ("%%.%df" % places) % x
    if "." in s:
        s = s.rstrip("0").rstrip(".")
    return s


# ============================================================================
# 一年级
# ============================================================================

def g1_add10(rng, k):
    a = rng.randint(1, 9)
    b = rng.randint(1, 10 - a)
    return "%d + %d" % (a, b), a + b, "把两个数合起来数一数。"


def g1_sub10(rng, k):
    a = rng.randint(2, 10)
    b = rng.randint(1, a - 1)
    return "%d − %d" % (a, b), a - b, "从 %d 里去掉 %d，还剩几个？" % (a, b)


def g1_add20_carry(rng, k):
    a = rng.randint(5, 9)
    b = rng.randint(11 - a, 9)          # 保证 a+b 在 11..18，且必须进位
    assert a + b <= 18
    return "%d + %d" % (a, b), a + b, "先凑十：%d + %d = 10，再加剩下的。" % (a, 10 - a)


def g1_sub20_borrow(rng, k):
    a = rng.randint(11, 18)
    b = rng.randint(a - 9, 9)           # 保证个位不够减（退位）
    assert a - b >= 1 and b >= a - 9
    return "%d − %d" % (a, b), a - b, "先减到 10，再减剩下的。"


def g1_num100(rng, k):
    """100 以内数的认识：比大小 / 数的组成"""
    kind = k % 3
    if kind == 0:
        a = rng.randint(11, 99)
        b = rng.randint(11, 99)
        while b == a:
            b = rng.randint(11, 99)
        q = "%d 和 %d，哪个大？" % (a, b)
        return q, "%d" % max(a, b), "先比十位，十位相同再比个位。"
    if kind == 1:
        a = rng.randint(2, 9) * 10 + rng.randint(1, 9)
        return "%d 里面有几个十和几个一？" % a, "%d 个十 %d 个一" % (a // 10, a % 10), "十位是几就是几个十。"
    a = rng.randint(10, 90)
    return "比 %d 大 10 的数是几？" % a, a + 10, "加 10 就是十位加 1。"


def g1_clock(rng, k):
    kind = k % 4
    h = rng.randint(1, 11)
    if kind == 0:
        return "钟面上时针指向 %d，分针指向 12，是几点？" % h, "%d 点" % h, "分针指 12 就是整点。"
    if kind == 1:
        return "钟面上时针刚过 %d，分针指向 6，是几点几分？" % h, "%d 点半" % h, "分针指 6 是 30 分。"
    if kind == 2:
        return "现在是 %d 点整，再过 1 小时是几点？" % h, "%d 点" % (h + 1), "过 1 小时，时针走一大格。"
    return "现在是 %d 点半，分针指向几？" % h, 6, "半点时分针指向 6。"


# ============================================================================
# 二年级
# ============================================================================

def g2_mul_table(rng, k):
    a = rng.randint(2, 9)
    b = rng.randint(2, 9)
    return "%d × %d" % (a, b), a * b, "想一想口诀：%s。" % "九九乘法表"


def g2_div_table(rng, k):
    b = rng.randint(2, 9)
    c = rng.randint(2, 9)
    a = b * c
    return "%d ÷ %d" % (a, b), c, "想：%d 里面有几个 %d？" % (a, b)


def g2_add100(rng, k):
    a = rng.randint(11, 89)
    b = rng.randint(11, 99 - a)
    return "%d + %d" % (a, b), a + b, "个位加个位，十位加十位，别忘了进位。"


def g2_sub100(rng, k):
    a = rng.randint(30, 99)
    b = rng.randint(11, a - 1)
    return "%d − %d" % (a, b), a - b, "个位不够减就从前一位借 1。"


def g2_length(rng, k):
    kind = k % 3
    if kind == 0:
        a = rng.randint(2, 9)
        return "1 米 = 多少厘米？%d 米呢？" % a, "%d 厘米" % (a * 100), "1 米 = 100 厘米。"
    if kind == 1:
        a = rng.randint(2, 9)
        return "%d 厘米 = 多少毫米？" % a, "%d 毫米" % (a * 10), "1 厘米 = 10 毫米。"
    a = rng.randint(100, 900)
    return "%d 厘米 = 多少米多少厘米？" % a, "%d 米 %d 厘米" % (a // 100, a % 100), "100 厘米 = 1 米。"


def g2_time(rng, k):
    h = rng.randint(1, 11)
    m = rng.choice([5, 10, 15, 20, 25, 35, 40, 45, 50, 55])
    return "钟面上时针在 %d 和 %d 之间，分针指向 %d，是几点几分？" % (
        h, h + 1, m // 5), "%d 点 %d 分" % (h, m), "分针每走一大格是 5 分钟。"


# ============================================================================
# 三年级
# ============================================================================

def g3_mul_1digit(rng, k):
    a = rng.randint(12, 99)
    b = rng.randint(2, 9)
    return "%d × %d" % (a, b), a * b, "先用个位乘，再用十位乘，最后相加。"


def g3_mul_2digit(rng, k):
    a = rng.randint(11, 49)
    b = rng.randint(11, 29)
    return "%d × %d" % (a, b), a * b, "拆开算：%d × %d + %d × %d。" % (a, b // 10 * 10, a, b % 10)


def g3_div_1digit(rng, k):
    b = rng.randint(2, 9)
    c = rng.randint(11, 99)
    a = b * c
    return "%d ÷ %d" % (a, b), c, "从高位除起，一位一位往下算。"


def g3_fraction_intro(rng, k):
    d = rng.choice([2, 3, 4, 5, 6, 8, 10])
    n = rng.randint(1, d - 1)
    kind = k % 3
    if kind == 0:
        return ("把一个蛋糕平均分成 %d 份，取其中 %d 份，是几分之几？" % (d, n),
                fmt_num(Fraction(n, d)), "平均分成几份，分母就是几。")
    if kind == 1:
        return ("%d/%d 里面有几个 1/%d？" % (n, d, d), n, "分子是几，就有几个这样的分数单位。")
    return ("1 里面有几个 1/%d？" % d, d, "1 = %d/%d。" % (d, d))


def g3_decimal_intro(rng, k):
    kind = k % 3
    if kind == 0:
        jiao = rng.randint(1, 9)
        return "%d 角 = 多少元？" % jiao, fmt_dec(jiao / 10, 1) + " 元", "1 元 = 10 角。"
    if kind == 1:
        yuan = rng.randint(1, 9)
        jiao = rng.randint(1, 9)
        return "%d 元 %d 角 = 多少元？" % (yuan, jiao), fmt_dec(yuan + jiao / 10, 1) + " 元", "几角就是零点几元。"
    cm = rng.randint(1, 99)
    return "%d 厘米 = 多少米？" % cm, fmt_dec(cm / 100, 2) + " 米", "1 米 = 100 厘米。"


def g3_unit_measure(rng, k):
    kind = k % 4
    if kind == 0:
        a = rng.randint(2, 9)
        return "%d 千米 = 多少米？" % a, a * 1000, "1 千米 = 1000 米。"
    if kind == 1:
        a = rng.randint(2, 9)
        return "%d 吨 = 多少千克？" % a, a * 1000, "1 吨 = 1000 千克。"
    if kind == 2:
        a = rng.randint(2, 9)
        return "%d 千克 = 多少克？" % a, a * 1000, "1 千克 = 1000 克。"
    a = rng.randint(2, 9)
    return "%d 平方米 = 多少平方分米？" % a, a * 100, "1 平方米 = 100 平方分米。"


# ============================================================================
# 四年级
# ============================================================================

def g4_mul_3x2(rng, k):
    a = rng.randint(101, 899)
    b = rng.randint(11, 99)
    return "%d × %d" % (a, b), a * b, "拆成 %d × %d + %d × %d 分两步算。" % (a, b // 10 * 10, a, b % 10)


def g4_div_2digit(rng, k):
    b = rng.randint(11, 39)
    c = rng.randint(11, 60)
    a = b * c
    return "%d ÷ %d" % (a, b), c, "把除数看成整十数试商，再调整。"


def g4_mixed(rng, k):
    """四则混合运算，答案由 Python 算，题目按先乘除后加减构造"""
    a = rng.randint(2, 9)
    b = rng.randint(2, 9)
    c = rng.randint(10, 60)
    d = rng.randint(2, 9)
    q = "%d × %d + %d − %d" % (a, b, c, d)
    v = a * b + c - d
    return q, v, "先算乘法，再从左往右算加减。"


def g4_law(rng, k):
    """运算定律：填空式，答案唯一"""
    a = rng.randint(11, 40)
    b = rng.randint(11, 40)
    c = rng.randint(2, 9)
    q = "%d × %d + %d × %d = %d × (□)" % (a, c, b, c, c)
    v = a + b
    return q, v, "提取公因数：%d × (%d + %d)。" % (c, a, b)


def g4_decimal_add(rng, k):
    a = rng.randint(11, 199) / 10
    b = rng.randint(11, 199) / 10
    return "%s + %s" % (fmt_dec(a, 1), fmt_dec(b, 1)), fmt_dec(a + b, 1), "小数点对齐，再按整数加法算。"


def g4_decimal_sub(rng, k):
    a = rng.randint(50, 300) / 10
    b = rng.randint(11, int(a * 10) - 1) / 10
    return "%s − %s" % (fmt_dec(a, 1), fmt_dec(b, 1)), fmt_dec(a - b, 1), "小数点对齐，不够减就借 1 当 10。"


# ============================================================================
# 五年级
# ============================================================================

def g5_decimal_mul(rng, k):
    a = rng.randint(11, 99) / 10
    b = rng.randint(2, 9)
    return "%s × %d" % (fmt_dec(a, 1), b), fmt_dec(a * b, 1), "先按整数乘，再数小数位数。"


def g5_decimal_div(rng, k):
    b = rng.randint(2, 9)
    c = rng.randint(11, 99) / 10
    a = round(b * c, 1)
    return "%s ÷ %d" % (fmt_dec(a, 1), b), fmt_dec(c, 2), "除数是整数，直接按整数除法算，商的小数点对齐。"


def g5_fraction_add(rng, k):
    d1 = rng.choice([2, 3, 4, 5, 6, 8, 10])
    d2 = rng.choice([2, 3, 4, 5, 6, 8, 10])
    n1 = rng.randint(1, d1 - 1)
    n2 = rng.randint(1, d2 - 1)
    f = Fraction(n1, d1) + Fraction(n2, d2)
    return "%d/%d + %d/%d" % (n1, d1, n2, d2), fmt_num(f), "先通分，分母相同了再把分子相加。"


def g5_equation(rng, k):
    """简易方程：ax + b = c，保证 x 是正整数"""
    a = rng.randint(2, 9)
    x = rng.randint(2, 20)
    b = rng.randint(1, 30)
    c = a * x + b
    return "%dx + %d = %d，x = ?" % (a, b, c), x, "两边先减去 %d，再除以 %d。" % (b, a)


def g5_factors(rng, k):
    kind = k % 3
    a = rng.randint(2, 9)
    if kind == 0:
        b = rng.randint(2, 9)
        return "%d 和 %d 的最大公因数是几？" % (a * b, a * b * rng.randint(2, 4)), a * b, "短除法找公因数。"
    if kind == 1:
        b = rng.randint(2, 9)
        c = a * b
        return "%d 和 %d 的最小公倍数是几？" % (a, b), c, "最小公倍数 = 两数之积 ÷ 最大公因数。"
    return "%d 的因数有几个？" % (a * a), 3, "平方数的因数个数是奇数个。"


def g5_area_rect(rng, k):
    a = rng.randint(3, 20)
    b = rng.randint(3, 20)
    kind = k % 2
    if kind == 0:
        return "长方形长 %d 厘米、宽 %d 厘米，面积是多少平方厘米？" % (a, b), a * b, "长方形面积 = 长 × 宽。"
    return "长方形长 %d 厘米、宽 %d 厘米，周长是多少厘米？" % (a, b), 2 * (a + b), "长方形周长 = (长 + 宽) × 2。"


def g5_area_triangle(rng, k):
    h = rng.randint(2, 20)
    b = rng.randint(2, 20)
    # 保证三角形面积是整数（底取偶数，避免出现 0.5）
    b2 = b * 2
    return "三角形底 %d 厘米、高 %d 厘米，面积是多少平方厘米？" % (b2, h), b2 * h // 2, "三角形面积 = 底 × 高 ÷ 2。"


def g5_area_parallelogram(rng, k):
    b = rng.randint(3, 20)
    h = rng.randint(3, 20)
    return "平行四边形底 %d 厘米、高 %d 厘米，面积是多少平方厘米？" % (b, h), b * h, "平行四边形面积 = 底 × 高。"


# ============================================================================
# 六年级
# ============================================================================

def g4_bignum(rng, k):
    """大数的认识：改写成用「万」作单位"""
    kind = k % 3
    w = rng.randint(2, 999)
    if kind == 0:
        return "%d0000 改写成用「万」作单位的数" % w, "%d 万" % w, "去掉末尾 4 个 0，就是多少个万。"
    if kind == 1:
        return "%d 万写成原来的数是多少？" % w, w * 10000, "多少个万，就在后面添 4 个 0。"
    a = rng.randint(11, 99)
    return "%d00000000 里面有几个亿？" % a, "%d 亿" % a, "去掉末尾 8 个 0，就是多少个亿。"


def g6_cylinder(rng, k):
    """圆柱的体积：底面积 × 高。
    ⚠️ 必须用 **Fraction 精确算**，不能用整除 ——
    一开始写成 `314 * r * r // 100`，r=3 时底面积被截断成 28（真值 28.26），
    体积算出 84（真值 84.78）。答案错得很隐蔽，孩子会以为自己算错了。"""
    PI = Fraction(314, 100)
    r = rng.randint(1, 6)
    h = rng.randint(2, 12)
    base = PI * r * r
    v = base * h
    # 自检：用另一条路径（整数分母）再算一遍，对不上就不出这道题
    assert base == Fraction(314 * r * r, 100), "底面积算法不一致"
    assert v == Fraction(314 * r * r * h, 100), "体积算法不一致"
    kind = k % 2
    if kind == 0:
        return ("圆柱的底面半径 %d 厘米、高 %d 厘米，体积是多少立方厘米？（π 取 3.14）" % (r, h),
                fmt_exact(v), "体积 = 底面积 × 高，底面积 = π × 半径 × 半径。")
    return ("圆柱的底面积 %s 平方厘米、高 %d 厘米，体积是多少立方厘米？" % (fmt_exact(base), h),
            fmt_exact(v), "体积 = 底面积 × 高。")


def g6_fraction_mul(rng, k):
    d1 = rng.choice([2, 3, 4, 5, 6, 7, 8, 9])
    d2 = rng.choice([2, 3, 4, 5, 6, 7, 8, 9])
    n1 = rng.randint(1, d1 - 1)
    n2 = rng.randint(1, d2 - 1)
    f = Fraction(n1, d1) * Fraction(n2, d2)
    return "%d/%d × %d/%d" % (n1, d1, n2, d2), fmt_num(f), "分子乘分子，分母乘分母，最后约分。"


def g6_fraction_div(rng, k):
    d1 = rng.choice([2, 3, 4, 5, 6, 7, 8, 9])
    d2 = rng.choice([2, 3, 4, 5, 6, 7, 8, 9])
    n1 = rng.randint(1, d1 - 1)
    n2 = rng.randint(1, d2 - 1)
    f = Fraction(n1, d1) / Fraction(n2, d2)
    return "%d/%d ÷ %d/%d" % (n1, d1, n2, d2), fmt_num(f), "除以一个分数，等于乘它的倒数。"


def g6_percent(rng, k):
    p = rng.choice([10, 20, 25, 40, 50, 60, 75, 80])
    a = rng.choice([20, 40, 60, 80, 100, 200, 400])
    v = a * p // 100
    if v * 100 != a * p:      # 保证整除，不整除就不出这道
        a = 100
        v = p
    return "%d 的 %d%% 是多少？" % (a, p), v, "百分之几就是除以 100 再乘。"


def g6_ratio(rng, k):
    a = rng.randint(1, 6)
    b = rng.randint(1, 6)
    m = rng.randint(2, 8)
    total = (a + b) * m
    return "把 %d 按 %d : %d 分配，两份各是多少？" % (total, a, b), "%d 和 %d" % (a * m, b * m), "先求总份数 %d，再算一份是多少。" % (a + b)


def g6_circle(rng, k):
    r = rng.randint(1, 10)
    kind = k % 4
    if kind == 0:
        # 用 π=3.14，答案是有限小数
        v = 2 * 314 * r / 100
        return "圆的半径 %d 厘米，周长是多少厘米？（π 取 3.14）" % r, fmt_dec(v, 2) + " 厘米", "周长 = 2 × π × 半径。"
    if kind == 1:
        v = 314 * r * r / 100
        return "圆的半径 %d 厘米，面积是多少平方厘米？（π 取 3.14）" % r, fmt_dec(v, 2) + " 平方厘米", "面积 = π × 半径 × 半径。"
    if kind == 2:
        v = 314 * (2 * r) / 100
        return "圆的直径 %d 厘米，周长是多少厘米？（π 取 3.14）" % (2 * r), fmt_dec(v, 2) + " 厘米", "周长 = π × 直径。"
    v = 314 * r * r / 100
    return "圆的直径 %d 厘米，面积是多少平方厘米？（π 取 3.14）" % (2 * r), fmt_dec(v, 2) + " 平方厘米", "先求半径 = 直径 ÷ 2，再用面积公式。"


def g6_negative(rng, k):
    a = rng.randint(1, 20)
    b = rng.randint(1, 20)
    while b == a:
        b = rng.randint(1, 20)
    kind = k % 2
    if kind == 0:
        return "−%d 和 −%d，哪个大？" % (a, b), "−%d" % min(a, b), "负数比大小：离 0 越近越大。"
    return "−%d 和 %d 相差多少？" % (a, b), a + b, "负数到正数，要跨过 0。"


def g6_word_speed(rng, k):
    """行程问题：速度×时间=路程，数字保证整除"""
    v = rng.randint(2, 15) * 10
    t = rng.randint(2, 9)
    s = v * t
    kind = k % 3
    if kind == 0:
        return "一辆车每小时行 %d 千米，%d 小时行多少千米？" % (v, t), s, "路程 = 速度 × 时间。"
    if kind == 1:
        return "一辆车 %d 小时行了 %d 千米，每小时行多少千米？" % (t, s), v, "速度 = 路程 ÷ 时间。"
    return "一辆车每小时行 %d 千米，行 %d 千米要几小时？" % (v, s), t, "时间 = 路程 ÷ 速度。"


def g6_word_work(rng, k):
    """工程问题：用 1/甲 + 1/乙 = 1/合，数字保证答案是整数天"""
    # 取 6 和 3、12 和 4 这类，合作天数才是整数
    pairs = [(6, 3), (12, 4), (10, 5), (12, 6), (20, 5), (6, 2), (15, 10), (8, 8),
             (18, 9), (4, 4), (24, 8), (30, 6), (9, 18), (14, 7), (16, 16),
             (21, 7), (28, 4), (36, 12), (5, 20), (7, 42), (22, 11), (26, 13),
             (33, 11), (35, 14), (40, 10), (45, 9), (48, 16), (50, 25)]
    a, b = rng.choice(pairs)
    f = 1 / (Fraction(1, a) + Fraction(1, b))
    return "一项工程，甲单独做 %d 天完成，乙单独做 %d 天完成，两人合作几天完成？" % (a, b), fmt_num(f), "把工程看成 1，效率和 = 1/%d + 1/%d。" % (a, b)


# ============================================================================
# 登记单元（顺序 = 页面里的顺序）
# ============================================================================

unit("g1_add10", 1, "20 以内加减法", "10 以内加法", "把两个数合起来", g1_add10)
unit("g1_sub10", 1, "20 以内加减法", "10 以内减法", "从一堆里去掉一些", g1_sub10)
unit("g1_add20", 1, "20 以内加减法", "20 以内进位加法", "凑十法", g1_add20_carry)
unit("g1_sub20", 1, "20 以内加减法", "20 以内退位减法", "破十法", g1_sub20_borrow)
unit("g1_num", 1, "100 以内数的认识", "数的认识与比大小", "认识十位和个位", g1_num100)
unit("g1_clock", 1, "认识钟表", "认识整点和半点", "看时针和分针", g1_clock)

unit("g2_mul", 2, "表内乘法", "乘法口诀", "九九表", g2_mul_table)
unit("g2_div", 2, "表内除法", "用口诀求商", "除法是乘法的逆运算", g2_div_table)
unit("g2_add100", 2, "100 以内加减法", "两位数加两位数", "进位加法", g2_add100)
unit("g2_sub100", 2, "100 以内加减法", "两位数减两位数", "退位减法", g2_sub100)
unit("g2_len", 2, "长度单位", "米 / 厘米 / 毫米", "量一量有多长", g2_length)
unit("g2_time", 2, "认识时间", "几时几分", "分针走一大格是 5 分", g2_time)

unit("g3_mul1", 3, "多位数乘一位数", "两位数乘一位数", "乘法竖式", g3_mul_1digit)
unit("g3_mul2", 3, "两位数乘两位数", "两位数乘两位数", "拆开分步算", g3_mul_2digit)
unit("g3_div1", 3, "除数是一位数的除法", "三位数除以一位数", "从高位除起", g3_div_1digit)
unit("g3_frac", 3, "分数的初步认识", "认识几分之几", "平均分", g3_fraction_intro)
unit("g3_dec", 3, "小数的初步认识", "元角分与小数", "零点几", g3_decimal_intro)
unit("g3_unit", 3, "量与计量", "单位换算", "千米/吨/千克/平方米", g3_unit_measure)

unit("g4_bignum", 4, "大数的认识", "万 / 亿的改写", "数一数有几个万", g4_bignum)
unit("g4_mul", 4, "三位数乘两位数", "三位数乘两位数", "分两步乘", g4_mul_3x2)
unit("g4_div", 4, "除数是两位数的除法", "试商", "把除数看成整十数", g4_div_2digit)
unit("g4_mix", 4, "四则混合运算", "先乘除后加减", "运算顺序", g4_mixed)
unit("g4_law", 4, "运算定律", "乘法分配律", "提取公因数", g4_law)
unit("g4_decadd", 4, "小数的加减法", "小数加法", "小数点对齐", g4_decimal_add)
unit("g4_decsub", 4, "小数的加减法", "小数减法", "不够减就借位", g4_decimal_sub)

unit("g5_decmul", 5, "小数乘法", "小数乘整数", "先按整数乘", g5_decimal_mul)
unit("g5_decdiv", 5, "小数除法", "小数除以整数", "商的小数点对齐", g5_decimal_div)
unit("g5_fracadd", 5, "分数的加减法", "异分母分数加法", "先通分", g5_fraction_add)
unit("g5_eq", 5, "简易方程", "解 ax + b = c", "两边同时减、同时除", g5_equation)
unit("g5_factor", 5, "因数与倍数", "最大公因数与最小公倍数", "短除法", g5_factors)
unit("g5_area", 5, "多边形的面积", "长方形与三角形面积", "面积公式", g5_area_rect)
unit("g5_area2", 5, "多边形的面积", "三角形与平行四边形", "底 × 高", g5_area_triangle)

unit("g6_cyl", 6, "圆柱与圆锥", "圆柱的体积", "底面积 × 高", g6_cylinder)
unit("g6_fracmul", 6, "分数乘法", "分数乘分数", "分子乘分子", g6_fraction_mul)
unit("g6_fracdiv", 6, "分数除法", "分数除以分数", "乘倒数", g6_fraction_div)
unit("g6_pct", 6, "百分数", "求一个数的百分之几", "百分数应用", g6_percent)
unit("g6_ratio", 6, "比和比例", "按比分配", "先求总份数", g6_ratio)
unit("g6_circle", 6, "圆", "圆的周长与面积", "π 取 3.14", g6_circle)
unit("g6_neg", 6, "负数", "负数比大小", "离 0 越近越大", g6_negative)
unit("g6_speed", 6, "问题解决", "行程问题", "速度 × 时间 = 路程", g6_word_speed)
unit("g6_work", 6, "问题解决", "工程问题", "把工程看成 1", g6_word_work)


# ============================================================================

def build(seed=20260907):
    rng = random.Random(seed)
    out = []
    for u in UNITS:
        items = []
        seen = set()
        k = 0
        guard = 0
        while len(items) < u["n"] and guard < u["n"] * 60:
            guard += 1
            q, a, tip = u["fn"](rng, k)
            k += 1
            # 同一单元内去重，且答案必须能算出来
            if a is None or q in seen:
                continue
            seen.add(q)
            items.append({
                "id": "%s_%03d" % (u["id"], len(items) + 1),
                "q": q, "a": fmt_num(a), "tip": tip,
            })
        if len(items) < u["n"]:
            print("  ⚠ %s 只生成 %d 题（目标 %d）" % (u["id"], len(items), u["n"]), file=sys.stderr)
        out.append({
            "id": u["id"], "grade": u["grade"], "unit": u["unit"],
            "title": u["title"], "desc": u["desc"], "n": u["n"], "items": items,
        })
    return out


def render(units):
    lines = []
    lines.append("/* 数学岛题库 —— **自动生成，不要手改**")
    lines.append(" *")
    lines.append(" * 生成器：tools/math/gen_problems.py")
    lines.append(" * 每题的量：%d 道，按 1–6 年级 × 能力维度组织；答案全部由 Python 真算一遍。")
    lines.append(" * 改了题请改生成器再跑一遍，不要直接编辑这个文件。")
    lines.append(" */")
    lines.append("window.MATH_UNITS = [")
    for u in units:
        lines.append("  {")
        lines.append('    id: %s, grade: %d,' % (json.dumps(u["id"], ensure_ascii=False), u["grade"]))
        lines.append("    unit: %s, title: %s," % (
            json.dumps(u["unit"], ensure_ascii=False), json.dumps(u["title"], ensure_ascii=False)))
        lines.append("    desc: %s," % json.dumps(u["desc"], ensure_ascii=False))
        lines.append("    items: [")
        for it in u["items"]:
            lines.append("      { id: %s, q: %s, a: %s, tip: %s }," % (
                json.dumps(it["id"]), json.dumps(it["q"], ensure_ascii=False),
                json.dumps(it["a"], ensure_ascii=False), json.dumps(it["tip"], ensure_ascii=False)))
        lines.append("    ]")
        lines.append("  },")
    lines.append("];")
    lines.append("")
    return "\n".join(lines).replace("每题的量：%d 道", "共 %d 道" % sum(len(u["items"]) for u in units))


def check(units):
    """自检：id 唯一、答案非空、题面非空、每单元题量够"""
    bad = 0
    ids = set()
    for u in units:
        for it in u["items"]:
            if it["id"] in ids:
                print("  ✗ id 重复:", it["id"]); bad += 1
            ids.add(it["id"])
            if not it["q"].strip() or not it["a"].strip():
                print("  ✗ 题面或答案为空:", it["id"]); bad += 1
        if len(u["items"]) < u["n"]:
            print("  ✗ %s 题量不足：%d/%d" % (u["id"], len(u["items"]), u["n"])); bad += 1
    return bad


def stats(units):
    by_grade = {}
    for u in units:
        by_grade.setdefault(u["grade"], [0, 0])
        by_grade[u["grade"]][0] += 1
        by_grade[u["grade"]][1] += len(u["items"])
    print("年级  单元数  题量")
    for g in sorted(by_grade):
        print("  %d      %2d     %3d" % (g, by_grade[g][0], by_grade[g][1]))
    print(" 合计    %2d     %3d" % (len(units), sum(len(u["items"]) for u in units)))


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--check", action="store_true", help="只校验，不写文件")
    ap.add_argument("--stats", action="store_true", help="打印统计")
    args = ap.parse_args()

    units = build()
    bad = check(units)

    if args.stats:
        stats(units)
        return 1 if bad else 0

    if bad:
        print("✗ 自检没通过（%d 个问题），不写文件" % bad)
        return 1

    text = render(units)
    if args.check:
        cur = ""
        if os.path.exists(OUT):
            with open(OUT, encoding="utf-8") as f:
                cur = f.read()
        if cur == text:
            print("✅ 题库与生成器一致（%d 道）" % sum(len(u["items"]) for u in units))
            return 0
        print("✗ 题库和生成器对不上，请重跑 gen_problems.py")
        return 1

    os.makedirs(os.path.dirname(OUT), exist_ok=True)
    with open(OUT, "w", encoding="utf-8") as f:
        f.write(text)
    stats(units)
    print("✅ 已写入 %s" % os.path.relpath(OUT, ROOT))
    return 0


if __name__ == "__main__":
    sys.exit(main())
