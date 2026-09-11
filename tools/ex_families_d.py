"""题目家族 D —— GESP 三级 / 四级 综合练习册
主题：math（数学与数论）、algo（算法思维）、file（文件读写）、turtle（海龟绘图）、fun（趣味编程）

写给谁看：10~14 岁、正在准备 GESP Python 三级 / 四级的孩子。
写法约定：
  * 能自动判题的题（math / algo / file / fun）一律用 exlib.exercise(...)：
    期望输出是把参考答案真跑一遍得到的，绝不手写，所以标准答案 100% 对得上。
  * 海龟绘图用 exlib.self_check(...)：画出来的图形没法用文字比对，孩子自己对照效果打勾。
  * 文件读写的题真的会 open(..., "w") 写、open(..., "r") 读；每个参考答案最后都会把
    练习文件删掉，所以在任何目录下跑都不会留下垃圾文件。
  * build() 会把工作目录临时切到系统临时目录，跑完再切回来，workspace 一个字节都不动。
"""

import os
import shutil
import tempfile

from exlib import exercise, self_check, pick, nums


def cs(*lines):
    """把若干行拼成一组标准输入（多行之间用 \\n 连接）。"""
    return "\n".join(str(x) for x in lines)


def build():
    """造出全部题目。跑参考答案期间把工作目录切到临时目录，跑完恢复原样。"""
    items = []
    here = os.getcwd()
    tmp = tempfile.mkdtemp(prefix="exfam_d_")
    try:
        os.chdir(tmp)
        _math_a(items)
        _math_b(items)
        _algo_a(items)
        _algo_b(items)
        _file_a(items)
        _file_b(items)
        _turtle(items)
        _fun_a(items)
        _fun_b(items)
    finally:
        os.chdir(here)
        shutil.rmtree(tmp, ignore_errors=True)
    return items


# =====================================================================
# 一、math —— 数学与数论
# =====================================================================

def _math_a(items):
    add = items.append

    # ---- 1. 质数判断（4 个数据变体，标题各自不同）----
    prime_code = (
        'n = int(input())\n'
        'is_prime = n >= 2\n'
        'i = 2\n'
        'while i * i <= n:\n'
        '    if n % i == 0:\n'
        '        is_prime = False\n'
        '        break\n'
        '    i += 1\n'
        'if is_prime:\n'
        '    print("是质数")\n'
        'else:\n'
        '    print("不是质数")\n'
    )
    for n, title in [
        (17, "质数小侦探：17 号嫌疑人"),
        (1, "质数小侦探：1 也算质数吗"),
        (91, "质数小侦探：91 的伪装术"),
    ]:
        add(exercise(
            topic="math", level=3, title=title,
            desc=f"质数就是大于 1、并且只能被 1 和它自己整除的整数。\n"
                 f"现在嫌疑人 n = {n}，请你写程序给它做个体检。\n"
                 f"输入：一行，一个整数 n。\n输出：一行，如果 n 是质数就打印「是质数」，否则打印「不是质数」。",
            hint="从 2 开始一个一个试，只要发现能整除 n 的数，它就不是质数，可以马上 break 跳出。"
                 "小技巧：试到 n 的平方根就够了，循环条件写成 i * i <= n。",
            answer=prime_code, cases=[cs(n)], tags=["质数", "循环", "break"]))

    # ---- 2. 找出所有因数 ----
    div_list_code = (
        'n = int(input())\n'
        'res = []\n'
        'for i in range(1, n + 1):\n'
        '    if n % i == 0:\n'
        '        res.append(i)\n'
        'print(*res)\n'
    )
    for n, title in [
        (12, "因数清单：给 12 的因数排排坐"),
        (36, "因数清单：36 的因数真不少"),
        (50, "因数清单：50 的因数大点名"),
    ]:
        add(exercise(
            topic="math", level=3, title=title,
            desc=f"输入一个正整数 n，请从小到大把它所有的因数都找出来（1 和它自己也算）。\n"
                 f"输入：一行，一个正整数 n（本题 n = {n}）。\n"
                 f"输出：一行，n 的所有因数，用一个空格隔开。",
            hint="用 for i in range(1, n + 1) 挨个试：只要 n % i == 0，i 就是因数。"
                 "先装进列表，最后 print(*列表) 就能一行打印出来。",
            answer=div_list_code, cases=[cs(n)], tags=["因数", "列表"]))

    # ---- 3. 因数个数 ----
    div_cnt_code = (
        'n = int(input())\n'
        'cnt = 0\n'
        'for i in range(1, n + 1):\n'
        '    if n % i == 0:\n'
        '        cnt += 1\n'
        'print(cnt)\n'
    )
    for n, title in [
        (49, "因数个数：49 有几个因数"),
        (100, "因数个数：100 的因数大军"),
        (13, "因数个数：质数 13 的小秘密"),
    ]:
        add(exercise(
            topic="math", level=3, title=title,
            desc=f"输入一个正整数 n，数一数它一共有多少个因数。\n"
                 f"输入：一行，一个正整数 n（本题 n = {n}）。\n输出：一行，一个整数，表示 n 的因数个数。",
            hint="和「找因数」一样挨个试，只是这次不用存列表，找到一个就给计数器加 1。",
            answer=div_cnt_code, cases=[cs(n)], tags=["因数", "计数"]))

    # ---- 4. 因数的总和 ----
    div_sum_code = (
        'n = int(input())\n'
        'total = 0\n'
        'for i in range(1, n + 1):\n'
        '    if n % i == 0:\n'
        '        total += i\n'
        'print(total)\n'
    )
    for n, title in [
        (28, "因数求和：28 的因数加起来是多少"),
        (60, "因数求和：60 的因数总分"),
        (16, "因数求和：16 的因数全相加"),
    ]:
        add(exercise(
            topic="math", level=3, title=title,
            desc=f"输入一个正整数 n，把它所有因数（包括 1 和 n）加起来，输出这个总和。\n"
                 f"输入：一行，一个正整数 n（本题 n = {n}）。\n输出：一行，一个整数，表示因数之和。",
            hint="先在循环外面准备 total = 0，每找到一个因数就 total += i，循环结束再打印 total。",
            answer=div_sum_code, cases=[cs(n)], tags=["因数", "累加"]))

    # ---- 5. 完全数判断 ----
    perfect_code = (
        'n = int(input())\n'
        's = 0\n'
        'for i in range(1, n):\n'
        '    if n % i == 0:\n'
        '        s += i\n'
        'if s == n:\n'
        '    print("是完全数")\n'
        'else:\n'
        '    print("不是完全数")\n'
    )
    for n, title in [
        (6, "完全数鉴定：6 号选手"),
        (28, "完全数鉴定：28 号选手"),
        (8, "完全数鉴定：8 号选手"),
    ]:
        add(exercise(
            topic="math", level=3, title=title,
            desc=f"如果一个数正好等于它所有「真因数」（不包括它自己的因数）之和，它就是完全数，"
                 f"比如 6 = 1 + 2 + 3。\n"
                 f"输入：一行，一个正整数 n（本题 n = {n}）。\n"
                 f"输出：一行，是完全数打印「是完全数」，否则打印「不是完全数」。",
            hint="真因数不含 n 自己，所以循环写 for i in range(1, n) 而不是 range(1, n + 1)。",
            answer=perfect_code, cases=[cs(n)], tags=["完全数", "因数"]))

    # ---- 6. 找出区间内所有完全数 ----
    add(exercise(
        topic="math", level=4, title="完全数寻宝：1 到 500 里有几个宝贝",
        desc="完全数非常稀有！请找出 1 到 500 之间所有的完全数（真因数之和等于自己）。\n"
             "输入：本题没有输入（程序直接开跑即可）。\n输出：一行，按从小到大的顺序输出这些完全数，空格隔开。",
        hint="外面套一层 for n in range(2, 501)，里面再用一个小循环求 n 的真因数之和，相等就收进列表。",
        answer=(
            'res = []\n'
            'for n in range(2, 501):\n'
            '    s = 0\n'
            '    for i in range(1, n):\n'
            '        if n % i == 0:\n'
            '            s += i\n'
            '    if s == n:\n'
            '        res.append(n)\n'
            'print(*res)\n'
        ),
        cases=[""], tags=["完全数", "双重循环", "枚举"]))

    # ---- 7. 三位水仙花数 ----
    add(exercise(
        topic="math", level=4, title="水仙花数大搜捕（三位数专场）",
        desc="三位水仙花数：各位数字的立方和正好等于它自己，例如 153 = 1³ + 5³ + 3³。\n"
             "输入：本题没有输入。\n输出：一行，按从小到大输出所有三位水仙花数，空格隔开。",
        hint="把百位写成 n // 100，十位写成 n // 10 % 10，个位写成 n % 10，"
             "再用 a ** 3 + b ** 3 + c ** 3 == n 比较。",
        answer=(
            'res = []\n'
            'for n in range(100, 1000):\n'
            '    a = n // 100\n'
            '    b = n // 10 % 10\n'
            '    c = n % 10\n'
            '    if a ** 3 + b ** 3 + c ** 3 == n:\n'
            '        res.append(n)\n'
            'print(*res)\n'
        ),
        cases=[""], tags=["水仙花数", "拆位", "枚举"]))

    # ---- 8. 四位自幂数 ----
    add(exercise(
        topic="math", level=4, title="四叶玫瑰数：四位数的自幂数挑战",
        desc="四位自幂数（又叫四叶玫瑰数）：各位数字的四次方之和等于它自己，例如 1634 = 1⁴ + 6⁴ + 3⁴ + 4⁴。\n"
             "输入：本题没有输入。\n输出：一行，按从小到大输出所有四位自幂数，空格隔开。",
        hint="先想办法取出四位数的每一位数字，再判断四个四次方相加是否等于原数。想一想 1000 到 9999 怎么循环。",
        answer=(
            'res = []\n'
            'for n in range(1000, 10000):\n'
            '    s = 0\n'
            '    m = n\n'
            '    while m > 0:\n'
            '        d = m % 10\n'
            '        s += d ** 4\n'
            '        m //= 10\n'
            '    if s == n:\n'
            '        res.append(n)\n'
            'print(*res)\n'
        ),
        cases=[""], tags=["自幂数", "拆位", "枚举"]))

    # ---- 9. 判断一个数是不是水仙花数 ----
    flower_check = (
        'n = int(input())\n'
        's = 0\n'
        'm = n\n'
        'while m > 0:\n'
        '    d = m % 10\n'
        '    s += d ** 3\n'
        '    m //= 10\n'
        'if s == n:\n'
        '    print("是水仙花数")\n'
        'else:\n'
        '    print("不是水仙花数")\n'
    )
    for n, title in [
        (153, "水仙花体检：153 是不是水仙花数"),
        (123, "水仙花体检：123 是不是水仙花数"),
        (407, "水仙花体检：407 是不是水仙花数"),
    ]:
        add(exercise(
            topic="math", level=3, title=title,
            desc=f"判断一个三位数是不是水仙花数：各位数字的立方和等于它自己。\n"
                 f"输入：一行，一个三位整数 n（本题 n = {n}）。\n"
                 f"输出：一行，是水仙花数打印「是水仙花数」，否则打印「不是水仙花数」。",
            hint="用 while m > 0 配合 m % 10 把每一位挑出来，记得用 m //= 10 把最后一位去掉，"
                 "否则循环停不下来。",
            answer=flower_check, cases=[cs(n)], tags=["水仙花数", "while", "拆位"]))

    # ---- 10. 最大公约数 ----
    gcd_code = (
        'a, b = map(int, input().split())\n'
        'x, y = a, b\n'
        'while y != 0:\n'
        '    x, y = y, x % y\n'
        'print(x)\n'
    )
    for a, b, title in [
        (12, 18, "最大公约数：12 和 18 的公共因数之王"),
        (100, 75, "最大公约数：100 和 75 谁更大"),
        (7, 13, "最大公约数：两个质数的答案"),
    ]:
        add(exercise(
            topic="math", level=3, title=title,
            desc=f"输入两个正整数 a 和 b，输出它们的最大公约数（能同时整除 a 和 b 的最大整数）。\n"
                 f"输入：一行，两个正整数 a b，用空格隔开（本题 a = {a}, b = {b}）。\n"
                 f"输出：一行，一个整数，表示最大公约数。",
            hint="用辗转相除法：while y != 0 时，把 (x, y) 换成 (y, x % y)，"
                 "循环结束时 x 就是答案。Python 允许一行同时给两个变量赋值。",
            answer=gcd_code, cases=[cs(f"{a} {b}")], tags=["gcd", "辗转相除"]))

    # ---- 11. 最小公倍数 ----
    lcm_code = (
        'a, b = map(int, input().split())\n'
        'x, y = a, b\n'
        'while y != 0:\n'
        '    x, y = y, x % y\n'
        'print(a * b // x)\n'
    )
    for a, b, title in [
        (4, 6, "最小公倍数：4 和 6 什么时候会师"),
        (12, 18, "最小公倍数：12 和 18 的共同倍数"),
        (5, 7, "最小公倍数：5 和 7 的第一次相遇"),
    ]:
        add(exercise(
            topic="math", level=3, title=title,
            desc=f"输入两个正整数 a 和 b，输出它们的最小公倍数（能同时被 a 和 b 整除的最小正整数）。\n"
                 f"输入：一行，两个正整数 a b，空格隔开（本题 a = {a}, b = {b}）。\n"
                 f"输出：一行，一个整数，表示最小公倍数。",
            hint="有个漂亮公式：a * b = 最大公约数 × 最小公倍数。先用辗转相除法求出最大公约数，"
                 "再用 a * b // 最大公约数 就得到答案。",
            answer=lcm_code, cases=[cs(f"{a} {b}")], tags=["lcm", "gcd"]))

    # ---- 12. 分数约分 ----
    reduce_code = (
        'a, b = map(int, input().split())\n'
        'x, y = a, b\n'
        'while y != 0:\n'
        '    x, y = y, x % y\n'
        'print(f"{a // x}/{b // x}")\n'
    )
    for a, b, title in [
        (8, 12, "分数化简：把 8/12 约成最简分数"),
        (18, 24, "分数化简：18/24 减肥计划"),
        (7, 21, "分数化简：7/21 变身最简"),
    ]:
        add(exercise(
            topic="math", level=3, title=title,
            desc=f"输入一个分数的分子和分母，请把它约成最简分数（分子分母除以它们的最大公约数）。\n"
                 f"输入：一行，两个正整数 a b，表示分数 a/b（本题 {a}/{b}）。\n"
                 f"输出：一行，最简分数，格式像 2/3 这样，中间的斜杠是英文斜杠。",
            hint="先求最大公约数 g，再分别输出 a // g 和 b // g，用 f\"{a // g}/{b // g}\" 拼成一行。",
            answer=reduce_code, cases=[cs(f"{a} {b}")], tags=["gcd", "分数"]))

    # ---- 13. 十进制转二进制（手写循环）----
    to_bin_code = (
        'n = int(input())\n'
        's = ""\n'
        'if n == 0:\n'
        '    s = "0"\n'
        'while n > 0:\n'
        '    s = str(n % 2) + s\n'
        '    n //= 2\n'
        'print(s)\n'
    )
    for n, title in [
        (13, "进制转换：把 13 变成二进制"),
        (255, "进制转换：255 的二进制长什么样"),
        (1, "进制转换：1 的二进制最简单"),
    ]:
        add(exercise(
            topic="math", level=3, title=title,
            desc=f"请用「除 2 取余、倒着读」的方法，自己动手把一个十进制数转成二进制字符串。\n"
                 f"输入：一行，一个非负整数 n（本题 n = {n}）。\n输出：一行，n 的二进制表示（不带 0b 前缀）。",
            hint="每次 n % 2 取出最低位，把它拼到结果字符串的最前面（s = str(n % 2) + s），"
                 "然后 n //= 2。别忘了 n 等于 0 时结果是 \"0\"。",
            answer=to_bin_code, cases=[cs(n)], tags=["进制转换", "二进制", "while"]))

    # ---- 14. 二进制转十进制 ----
    bin_to_dec = (
        's = input().strip()\n'
        'n = 0\n'
        'for ch in s:\n'
        '    n = n * 2 + int(ch)\n'
        'print(n)\n'
    )
    for s, title in [
        ("1101", "二进制解密：1101 是十进制的几"),
        ("101010", "二进制解密：101010 到底多大"),
        ("11111111", "二进制解密：八个 1 的威力"),
    ]:
        add(exercise(
            topic="math", level=3, title=title,
            desc=f"输入一个二进制字符串（只有 0 和 1），请算出它对应的十进制数。\n"
                 f"输入：一行，一个二进制字符串 s（本题 s = {s}）。\n输出：一行，一个整数，表示它换算成十进制的结果。",
            hint="从左到右扫：每读一位就先 n = n * 2，再加上这一位（int(ch)）。"
                 "这样「读一位乘二」重复下去就等价于按位权展开。",
            answer=bin_to_dec, cases=[cs(s)], tags=["进制转换", "二进制"]))

    # ---- 15. 十进制转十六进制 ----
    to_hex_code = (
        'n = int(input())\n'
        'digits = "0123456789ABCDEF"\n'
        's = ""\n'
        'if n == 0:\n'
        '    s = "0"\n'
        'while n > 0:\n'
        '    s = digits[n % 16] + s\n'
        '    n //= 16\n'
        'print(s)\n'
    )
    for n, title in [
        (255, "十六进制：255 为什么是 FF"),
        (26, "十六进制：26 换成十六进制"),
        (4096, "十六进制：4096 的漂亮结果"),
    ]:
        add(exercise(
            topic="math", level=4, title=title,
            desc=f"十六进制用 0-9 和 A-F 表示数字，其中 A 代表 10、F 代表 15。请把一个十进制数转成十六进制。\n"
                 f"输入：一行，一个非负整数 n（本题 n = {n}）。\n"
                 f"输出：一行，n 的十六进制表示，字母要大写，不带 0x 前缀。",
            hint="和转二进制几乎一样，只是把除以 2 改成除以 16，余数用字符串 "
                 "\"0123456789ABCDEF\" 当下标去查对应的字符。",
            answer=to_hex_code, cases=[cs(n)], tags=["进制转换", "十六进制"]))

    # ---- 16. 位运算三兄弟 ----
    bit_three = (
        'a, b = map(int, input().split())\n'
        'print(f"与：{a & b}")\n'
        'print(f"或：{a | b}")\n'
        'print(f"异或：{a ^ b}")\n'
    )
    for a, b, title in [
        (12, 10, "位运算三兄弟：12 和 10 的与或异或"),
        (7, 3, "位运算三兄弟：7 和 3 的暗号"),
        (20, 15, "位运算三兄弟：20 和 15 的较量"),
    ]:
        add(exercise(
            topic="math", level=3, title=title,
            desc=f"位运算直接对二进制每一位动手，& 是按位与、| 是按位或、^ 是按位异或。\n"
                 f"输入：一行，两个非负整数 a b，空格隔开（本题 a = {a}, b = {b}）。\n"
                 f"输出：三行，依次是「与：结果」「或：结果」「异或：结果」，冒号是中文冒号。",
            hint="Python 里 & | ^ 三个符号可以直接对整数用，但也别忘了它们能算出来：比如 12 & 10 就是 1100 和 1010 逐位比较。",
            answer=bit_three, cases=[cs(f"{a} {b}")], tags=["位运算", "二进制"]))

    # ---- 17. 左移与右移 ----
    shift_code = (
        'n, k = map(int, input().split())\n'
        'print(f"左移：{n << k}")\n'
        'print(f"右移：{n >> k}")\n'
    )
    for n, k, title in [
        (3, 4, "移位运算：3 左移右移各是多少"),
        (100, 2, "移位运算：100 搬家两格"),
        (1, 10, "移位运算：1 左移十位有多猛"),
    ]:
        add(exercise(
            topic="math", level=3, title=title,
            desc=f"n << k 表示把 n 的二进制整体左移 k 位（等于乘 2 的 k 次方），n >> k 表示右移 k 位（等于整除 2 的 k 次方）。\n"
                 f"输入：一行，两个非负整数 n k，空格隔开（本题 n = {n}, k = {k}）。\n"
                 f"输出：两行，第一行「左移：结果」，第二行「右移：结果」。",
            hint="先自己在纸上写出 n 的二进制，左移就在尾巴上补 k 个 0，右移就砍掉最后 k 位。",
            answer=shift_code, cases=[cs(f"{n} {k}")], tags=["位运算", "移位"]))

    # ---- 18. 二进制里 1 的个数 ----
    popcount_code = (
        'n = int(input())\n'
        'cnt = 0\n'
        'while n > 0:\n'
        '    n = n & (n - 1)\n'
        '    cnt += 1\n'
        'print(cnt)\n'
    )
    for n, title in [
        (13, "数一数：13 的二进制里有几个 1"),
        (255, "数一数：255 的二进制里有几个 1"),
        (1000, "数一数：1000 的二进制里有几个 1"),
    ]:
        add(exercise(
            topic="math", level=4, title=title,
            desc=f"输入一个正整数 n，请统计它二进制表示里有多少个 1。\n"
                 f"输入：一行，一个正整数 n（本题 n = {n}）。\n输出：一行，一个整数，表示二进制中 1 的个数。",
            hint="有个超酷的技巧：n & (n - 1) 会把 n 二进制里最右边的那个 1 变成 0。"
                 "每做一次就少一个 1，数一数能做几次就知道答案了。",
            answer=popcount_code, cases=[cs(n)], tags=["位运算", "二进制", "计数"]))

    # ---- 19. 平方与立方 ----
    sq_cube = (
        'n = int(input())\n'
        'print(f"平方：{n * n}")\n'
        'print(f"立方：{n * n * n}")\n'
    )
    for n, title in [
        (7, "平方与立方：7 的两次变身"),
        (12, "平方与立方：12 长大以后"),
        (25, "平方与立方：25 的平方真好算"),
    ]:
        add(exercise(
            topic="math", level=2, title=title,
            desc=f"输入一个整数 n，请输出它的平方和立方。\n"
                 f"输入：一行，一个整数 n（本题 n = {n}）。\n"
                 f"输出：两行，第一行「平方：结果」，第二行「立方：结果」。",
            hint="n ** 2 是平方，n ** 3 是立方；也可以直接写 n * n 和 n * n * n。",
            answer=sq_cube, cases=[cs(n)], tags=["幂运算"]))

    # ---- 20. 完全平方数判断 ----
    perfect_sq = (
        'n = int(input())\n'
        'r = int(n ** 0.5)\n'
        'if r * r == n:\n'
        '    print("是完全平方数")\n'
        'else:\n'
        '    print("不是完全平方数")\n'
    )
    for n, title in [
        (16, "完全平方数：16 方方正正"),
        (20, "完全平方数：20 能摆成正方形吗"),
        (144, "完全平方数：144 的方阵"),
    ]:
        add(exercise(
            topic="math", level=3, title=title,
            desc=f"如果一个数能写成某个整数的平方，它就是完全平方数。\n"
                 f"输入：一行，一个正整数 n（本题 n = {n}）。\n"
                 f"输出：一行，是完全平方数打印「是完全平方数」，否则打印「不是完全平方数」。",
            hint="把 n 开平方取整数部分 r = int(n ** 0.5)，再看 r * r 是不是正好等于 n。"
                 "注意别用浮点数直接比较，会有小误差。",
            answer=perfect_sq, cases=[cs(n)], tags=["平方", "判断"]))

    # ---- 21. 平方和 ----
    sq_sum = (
        'n = int(input())\n'
        'total = 0\n'
        'for i in range(1, n + 1):\n'
        '    total += i * i\n'
        'print(total)\n'
    )
    for n, title in [
        (5, "平方和：1² + 2² + … + 5²"),
        (100, "平方和：算到 100 的平方和"),
        (20, "平方和：前 20 个平方相加"),
    ]:
        add(exercise(
            topic="math", level=3, title=title,
            desc=f"输入正整数 n，求 1² + 2² + 3² + … + n² 的结果。\n"
                 f"输入：一行，一个正整数 n（本题 n = {n}）。\n输出：一行，一个整数，表示平方和。",
            hint="for i in range(1, n + 1) 里累加 i * i，注意累加变量要在循环前设为 0。",
            answer=sq_sum, cases=[cs(n)], tags=["循环", "累加"]))

    # ---- 22. 立方和 ----
    add(exercise(
        topic="math", level=3, title="立方和：前 10 个自然数的立方加起来",
        desc="输入正整数 n，求 1³ + 2³ + 3³ + … + n³ 的结果。\n"
             "输入：一行，一个正整数 n（本题 n = 10）。\n输出：一行，一个整数，表示立方和。",
        hint="和平方和只差一个乘号：把 total += i * i 改成 total += i * i * i。",
        answer=(
            'n = int(input())\n'
            'total = 0\n'
            'for i in range(1, n + 1):\n'
            '    total += i ** 3\n'
            'print(total)\n'
        ),
        cases=[cs(10)], tags=["循环", "累加"]))

    # ---- 23. 整数平方根 ----
    isqrt_code = (
        'n = int(input())\n'
        'r = 0\n'
        'while (r + 1) * (r + 1) <= n:\n'
        '    r += 1\n'
        'print(r)\n'
    )
    for n, title in [
        (17, "平方根取整：17 的整数平方根"),
        (144, "平方根取整：144 开方正好是整数"),
        (1000, "平方根取整：1000 开方是多少"),
    ]:
        add(exercise(
            topic="math", level=3, title=title,
            desc=f"输入一个正整数 n，输出它的整数平方根，也就是「平方不超过 n 的最大整数」。\n"
                 f"输入：一行，一个正整数 n（本题 n = {n}）。\n输出：一行，一个整数。",
            hint="可以用 while (r + 1) * (r + 1) <= n: r += 1 一点点试上去，"
                 "也可以直接用 int(n ** 0.5)，两种写法都很好。",
            answer=isqrt_code, cases=[cs(n)], tags=["平方根", "while"]))

    # ---- 24. 平均数 ----
    avg_code = (
        'n = int(input())\n'
        'a = list(map(int, input().split()))\n'
        'print(f"{sum(a) / n:.1f}")\n'
    )
    for lines, title in [
        (cs(3, "80 90 100"), "平均分：三门课的成绩单"),
        (cs(5, "60 75 88 92 100"), "平均分：五科成绩算一算"),
        (cs(4, "10 20 30 41"), "平均分：四个数求平均"),
    ]:
        add(exercise(
            topic="math", level=3, title=title,
            desc="输入 n 个整数，求它们的平均值。\n"
                 "输入：第一行一个整数 n；第二行 n 个整数，用空格隔开。\n"
                 "输出：一行，平均值，保留 1 位小数。",
            hint="用 list(map(int, input().split())) 一次读完整行数字，再用 sum(a) / n。"
                 "要保留小数就用 f\"{值:.1f}\"，它会自动四舍五入到 1 位小数。",
            answer=avg_code, cases=[lines], tags=["平均数", "格式化"]))

    # ---- 25. 中位数 ----
    median_code = (
        'n = int(input())\n'
        'a = sorted(map(int, input().split()))\n'
        'if n % 2 == 1:\n'
        '    print(a[n // 2])\n'
        'else:\n'
        '    print(f"{(a[n // 2 - 1] + a[n // 2]) / 2:.1f}")\n'
    )
    for lines, title in [
        (cs(5, "7 3 9 1 5"), "中位数：五个数的正中间"),
        (cs(4, "10 2 8 4"), "中位数：偶数个怎么办"),
        (cs(6, "100 90 80 70 60 50"), "中位数：六个人的身高"),
    ]:
        add(exercise(
            topic="math", level=3, title=title,
            desc="中位数是把数据从小到大排好之后，位置在最中间的那个数；"
                 "如果个数是偶数，就取中间两个数的平均值。\n"
                 "输入：第一行一个整数 n；第二行 n 个整数，空格隔开。\n"
                 "输出：一行，中位数。奇数个时输出整数，偶数个时保留 1 位小数。",
            hint="先用 sorted() 排好序。奇数个取下标 n // 2；偶数个取下标 n // 2 - 1 和 n // 2 的平均值。",
            answer=median_code, cases=[lines], tags=["中位数", "排序"]))

    # ---- 26. 去掉最高分最低分再求平均 ----
    trim_avg = (
        'n = int(input())\n'
        'a = list(map(int, input().split()))\n'
        'print(f"{(sum(a) - max(a) - min(a)) / (n - 2):.1f}")\n'
    )
    for lines, title in [
        (cs(5, "90 80 70 100 60"), "去掉最高最低分：体操比赛计分法"),
        (cs(6, "88 92 79 95 85 90"), "去掉最高最低分：六位评委打分"),
        (cs(4, "10 20 30 100"), "去掉最高最低分：四个分数去掉两头"),
    ]:
        add(exercise(
            topic="math", level=4, title=title,
            desc="比赛计分常常去掉一个最高分和一个最低分，再算平均分。\n"
                 "输入：第一行一个整数 n（n 至少 3）；第二行 n 个整数，空格隔开。\n"
                 "输出：一行，去掉一个最高分和一个最低分之后的平均分，保留 1 位小数。",
            hint="总和减去 max(a) 再减去 min(a)，然后除以 n - 2 就对了。",
            answer=trim_avg, cases=[lines], tags=["平均数", "max", "min"]))

    # ---- 27. 等差数列求第 n 项 ----
    ap_term = (
        'a1, d, n = map(int, input().split())\n'
        'print(a1 + (n - 1) * d)\n'
    )
    for lines, title in [
        (cs("2 3 10"), "等差数列：2、5、8…的第 10 项"),
        (cs("1 1 100"), "等差数列：1 到 100 的第 100 项"),
        (cs("5 7 20"), "等差数列：公差是 7 的第 20 项"),
    ]:
        add(exercise(
            topic="math", level=3, title=title,
            desc="等差数列的每一项都比前一项多一个固定的「公差」。\n"
                 "输入：一行三个整数 a1 d n，分别表示首项、公差、项数。\n"
                 "输出：一行，这个等差数列的第 n 项。",
            hint="记住公式：第 n 项 = 首项 + (n - 1) × 公差。想一想为什么是 n - 1 而不是 n。",
            answer=ap_term, cases=[lines], tags=["等差数列", "公式"]))

    # ---- 28. 等差数列求和 ----
    ap_sum = (
        'a1, d, n = map(int, input().split())\n'
        'print(n * (2 * a1 + (n - 1) * d) // 2)\n'
    )
    for lines, title in [
        (cs("2 3 10"), "等差数列求和：2、5、8…前十项之和"),
        (cs("1 2 50"), "等差数列求和：前 50 个奇数之和"),
        (cs("10 5 8"), "等差数列求和：从 10 开始每次加 5"),
    ]:
        add(exercise(
            topic="math", level=4, title=title,
            desc="等差数列求和有个又快又好的公式，不用一个一个加。\n"
                 "输入：一行三个整数 a1 d n，表示首项、公差、项数。\n"
                 "输出：一行，前 n 项的总和。",
            hint="和 = 项数 × (首项 + 末项) ÷ 2，其中末项 = a1 + (n - 1) * d。"
                 "整理一下就是 n * (2 * a1 + (n - 1) * d) // 2。",
            answer=ap_sum, cases=[lines], tags=["等差数列", "求和", "公式"]))

    # ---- 29. 高斯求和（1 到 n）----
    gauss_code = (
        'n = int(input())\n'
        's = 0\n'
        'for i in range(1, n + 1):\n'
        '    s += i\n'
        'print(s)\n'
    )
    for n, title in [
        (100, "高斯的小把戏：1 加到 100"),
        (10, "高斯的小把戏：1 加到 10"),
        (1000, "高斯的小把戏：1 加到 1000"),
    ]:
        add(exercise(
            topic="math", level=2, title=title,
            desc=f"传说高斯小时候几秒钟就算出了 1 + 2 + 3 + … + 100。现在让电脑来算。\n"
                 f"输入：一行，一个正整数 n（本题 n = {n}）。\n输出：一行，1 到 n 所有整数的和。",
            hint="用 for 循环累加当然可以；如果你知道公式 n * (n + 1) // 2，也可以一行搞定，"
                 "两种写法都试试看结果一样不一样。",
            answer=gauss_code, cases=[cs(n)], tags=["求和", "循环"]))

    # ---- 30. 奇数和与偶数和 ----
    odd_even = (
        'n = int(input())\n'
        'odd = 0\n'
        'even = 0\n'
        'for i in range(1, n + 1):\n'
        '    if i % 2 == 1:\n'
        '        odd += i\n'
        '    else:\n'
        '        even += i\n'
        'print(f"奇数和：{odd}")\n'
        'print(f"偶数和：{even}")\n'
    )
    for n, title in [
        (10, "奇偶分队：1 到 10 的奇数和偶数和"),
        (100, "奇偶分队：1 到 100 分组求和"),
        (15, "奇偶分队：1 到 15 谁的总分高"),
    ]:
        add(exercise(
            topic="math", level=3, title=title,
            desc=f"把 1 到 n 的整数分成奇数和偶数两队，分别求两队的和。\n"
                 f"输入：一行，一个正整数 n（本题 n = {n}）。\n"
                 f"输出：两行，第一行「奇数和：结果」，第二行「偶数和：结果」。",
            hint="一个循环里用 if i % 2 == 1 分情况，两个累加变量分别加。",
            answer=odd_even, cases=[cs(n)], tags=["循环", "分支", "求和"]))

    # ---- 31. 鸡兔同笼 ----
    chicken_rabbit = (
        'heads, legs = map(int, input().split())\n'
        'rabbit = (legs - heads * 2) // 2\n'
        'chicken = heads - rabbit\n'
        'print(f"鸡：{chicken} 只")\n'
        'print(f"兔：{rabbit} 只")\n'
    )
    for lines, title in [
        (cs("8 26"), "鸡兔同笼：8 个头 26 只脚"),
        (cs("35 94"), "鸡兔同笼：经典 35 头 94 脚"),
        (cs("10 30"), "鸡兔同笼：10 个头 30 只脚"),
    ]:
        add(exercise(
            topic="math", level=3, title=title,
            desc="笼子里有鸡和兔，鸡 2 只脚、兔 4 只脚。已知头的总数和脚的总数，求各有多少只。\n"
                 "输入：一行两个整数 heads legs，表示头数和脚数。\n"
                 "输出：两行，第一行「鸡：x 只」，第二行「兔：y 只」。",
            hint="假设全是鸡，那么脚会有 heads * 2 只；实际多出来的脚，每 2 只就对应一只兔子。"
                 "所以兔 = (legs - heads * 2) // 2，鸡 = heads - 兔。",
            answer=chicken_rabbit, cases=[lines], tags=["鸡兔同笼", "数学建模"]))

    # ---- 32. 闰年判断 ----
    leap_code = (
        'y = int(input())\n'
        'if (y % 4 == 0 and y % 100 != 0) or y % 400 == 0:\n'
        '    print("是闰年")\n'
        'else:\n'
        '    print("不是闰年")\n'
    )
    for y, title in [
        (2024, "闰年鉴定：2024 年有没有 2 月 29 日"),
        (1900, "闰年鉴定：1900 年的世纪陷阱"),
        (2000, "闰年鉴定：2000 年是不是闰年"),
    ]:
        add(exercise(
            topic="math", level=3, title=title,
            desc=f"闰年的规则是：能被 4 整除但不能被 100 整除，或者能被 400 整除。\n"
                 f"输入：一行，一个年份 y（本题 y = {y}）。\n"
                 f"输出：一行，是闰年打印「是闰年」，否则打印「不是闰年」。",
            hint="把规则直接翻译成条件：(y % 4 == 0 and y % 100 != 0) or y % 400 == 0。"
                 "注意 and 的优先级比 or 高，但加括号更清楚。",
            answer=leap_code, cases=[cs(y)], tags=["闰年", "分支"]))

    # ---- 33. 某年二月有多少天 ----
    feb_days = (
        'y = int(input())\n'
        'if (y % 4 == 0 and y % 100 != 0) or y % 400 == 0:\n'
        '    print(29)\n'
        'else:\n'
        '    print(28)\n'
    )
    for y, title in [
        (2024, "二月天数：2024 年的 2 月"),
        (2023, "二月天数：2023 年的 2 月"),
        (2100, "二月天数：2100 年的 2 月有点特殊"),
    ]:
        add(exercise(
            topic="math", level=3, title=title,
            desc=f"输入一个年份，输出这一年 2 月有多少天（闰年 29 天，平年 28 天）。\n"
                 f"输入：一行，一个年份 y（本题 y = {y}）。\n输出：一行，一个整数，表示 2 月的天数。",
            hint="先判断闰年，闰年打印 29，否则打印 28。判断条件和上一题一模一样。",
            answer=feb_days, cases=[cs(y)], tags=["闰年", "日历"]))

    # ---- 34. 一年有多少天 ----
    add(exercise(
        topic="math", level=3, title="一年有多少天：闰年 366 的由来",
        desc="输入一个年份，输出这一年一共有多少天（闰年 366 天，平年 365 天）。\n"
             "输入：一行，一个年份 y（本题 y = 2024）。\n输出：一行，一个整数，表示这一年的天数。",
        hint="闰年判断 + 一个 if/else：闰年打印 366，平年打印 365。想想多出来的那一天加在哪个月。",
        answer=(
            'y = int(input())\n'
            'if (y % 4 == 0 and y % 100 != 0) or y % 400 == 0:\n'
            '    print(366)\n'
            'else:\n'
            '    print(365)\n'
        ),
        cases=[cs(2024), cs(2023)], tags=["闰年", "天数"]))

    # ---- 35. 秒数换算时分秒 ----
    hms_code = (
        's = int(input())\n'
        'h = s // 3600\n'
        'm = s % 3600 // 60\n'
        'sec = s % 60\n'
        'print(f"{h}时{m}分{sec}秒")\n'
    )
    for s, title in [
        (3661, "时间换算：3661 秒是几时几分几秒"),
        (7200, "时间换算：7200 秒刚好整点"),
        (59, "时间换算：59 秒还不到一分钟"),
    ]:
        add(exercise(
            topic="math", level=3, title=title,
            desc=f"输入一个秒数，把它换算成「几时几分几秒」。\n"
                 f"输入：一行，一个非负整数 s，表示总秒数（本题 s = {s}）。\n"
                 f"输出：一行，格式像 1时1分1秒 这样，数字和汉字之间不加空格。",
            hint="1 小时 = 3600 秒，1 分钟 = 60 秒。小时用 s // 3600，"
                 "剩下的分钟用 s % 3600 // 60，最后的秒用 s % 60。",
            answer=hms_code, cases=[cs(s)], tags=["时间换算", "整除取余"]))

    # ---- 36. 分钟换算成几小时几分 ----
    hour_min = (
        'm = int(input())\n'
        'print(f"{m // 60}小时{m % 60}分")\n'
    )
    for m, title in [
        (135, "电影时长：135 分钟是几小时几分"),
        (60, "电影时长：60 分钟整"),
        (200, "电影时长：200 分钟换算"),
    ]:
        add(exercise(
            topic="math", level=2, title=title,
            desc=f"输入一个分钟数，换算成「几小时几分」。\n"
                 f"输入：一行，一个非负整数 m，表示分钟数（本题 m = {m}）。\n"
                 f"输出：一行，格式像 2小时15分 这样。",
            hint="小时数是 m // 60（整除），剩下的分钟是 m % 60（取余）。",
            answer=hour_min, cases=[cs(m)], tags=["时间换算", "整除取余"]))

    # ---- 37. 天数换算成几周几天 ----
    add(exercise(
        topic="math", level=2, title="暑假倒计时：100 天是几周零几天",
        desc="输入一个天数，换算成「几周零几天」。\n"
             "输入：一行，一个非负整数 d，表示天数（本题 d = 100）。\n"
             "输出：一行，格式像 14周零2天 这样。",
        hint="一周 7 天：周数是 d // 7，剩下的天数是 d % 7。",
        answer=(
            'd = int(input())\n'
            'print(f"{d // 7}周零{d % 7}天")\n'
        ),
        cases=[cs(100), cs(7)], tags=["时间换算", "整除取余"]))

    # ---- 38. 各位数字之和 ----
    digit_sum = (
        'n = int(input())\n'
        's = 0\n'
        'while n > 0:\n'
        '    s += n % 10\n'
        '    n //= 10\n'
        'print(s)\n'
    )
    for n, title in [
        (1234, "数位之和：1234 的每一位加起来"),
        (9999, "数位之和：9999 的最大和"),
        (100, "数位之和：100 其实只有 1"),
    ]:
        add(exercise(
            topic="math", level=3, title=title,
            desc=f"输入一个正整数 n，把它每一位上的数字加起来。\n"
                 f"输入：一行，一个正整数 n（本题 n = {n}）。\n输出：一行，一个整数，表示各位数字之和。",
            hint="n % 10 拿到最后一位，n //= 10 把它去掉，反复做直到 n 变成 0。",
            answer=digit_sum, cases=[cs(n)], tags=["拆位", "while"]))

    # ---- 39. 数字反转 ----
    reverse_num = (
        'n = int(input())\n'
        'r = 0\n'
        'while n > 0:\n'
        '    r = r * 10 + n % 10\n'
        '    n //= 10\n'
        'print(r)\n'
    )
    for n, title in [
        (1230, "数字反转：1230 倒过来念"),
        (700, "数字反转：700 反转以后是几"),
        (98765, "数字反转：98765 掉个头"),
    ]:
        add(exercise(
            topic="math", level=3, title=title,
            desc=f"输入一个正整数，把它倒过来输出（前面的 0 不要，比如 1230 反转后是 321）。\n"
                 f"输入：一行，一个正整数 n（本题 n = {n}）。\n输出：一行，反转后的整数。",
            hint="每取出一位 d = n % 10，就把它接到结果右边：r = r * 10 + d。"
                 "因为用整数保存，前导零会自动消失。",
            answer=reverse_num, cases=[cs(n)], tags=["拆位", "反转"]))

    # ---- 40. 数字是几位数 ----
    count_digits = (
        'n = int(input())\n'
        'cnt = 0\n'
        'while n > 0:\n'
        '    cnt += 1\n'
        '    n //= 10\n'
        'print(cnt)\n'
    )
    for n, title in [
        (98765, "位数统计：98765 有几位"),
        (7, "位数统计：7 是一位数"),
        (20240907, "位数统计：一个长数字有几位"),
    ]:
        add(exercise(
            topic="math", level=3, title=title,
            desc=f"输入一个正整数，数一数它是几位数。\n"
                 f"输入：一行，一个正整数 n（本题 n = {n}）。\n输出：一行，一个整数，表示位数。",
            hint="每做一次 n //= 10 就少一位，用计数器数一共做了几次。"
                 "也可以偷懒用 len(str(n))，但建议先用循环练练手。",
            answer=count_digits, cases=[cs(n)], tags=["拆位", "计数"]))

    # ---- 41. 数位中的最大值 ----
    add(exercise(
        topic="math", level=3, title="数位擂台：28416 里最大的数字是谁",
        desc="输入一个正整数，找出它每一位数字里最大的那一个。\n"
             "输入：一行，一个正整数 n（本题 n = 28416）。\n输出：一行，一个整数，表示最大的数字。",
        hint="一边拆位一边打擂台：先设 mx = 0，每拿到一位就和 mx 比一比，大的留下。",
        answer=(
            'n = int(input())\n'
            'mx = 0\n'
            'while n > 0:\n'
            '    d = n % 10\n'
            '    if d > mx:\n'
            '        mx = d\n'
            '    n //= 10\n'
            'print(mx)\n'
        ),
        cases=[cs(28416), cs(9010)], tags=["拆位", "打擂台"]))

    # ---- 42. 回文数判断 ----
    palindrome_code = (
        's = input().strip()\n'
        'if s == s[::-1]:\n'
        '    print("是回文数")\n'
        'else:\n'
        '    print("不是回文数")\n'
    )
    for s, title in [
        ("12321", "回文数：12321 正着反着都一样"),
        ("1234", "回文数：1234 是不是回文"),
        ("7", "回文数：一位数全都算"),
    ]:
        add(exercise(
            topic="math", level=3, title=title,
            desc=f"回文数就是正着读和倒着读一样的数，比如 12321。\n"
                 f"输入：一行，一个正整数（本题输入 {s}）。\n"
                 f"输出：一行，是回文数打印「是回文数」，否则打印「不是回文数」。",
            hint="把数字当字符串处理最省事：s[::-1] 就是反转后的字符串，和原来的比一比就行。",
            answer=palindrome_code, cases=[cs(s)], tags=["回文", "字符串切片"]))

    # ---- 43. 阶乘 ----
    factorial_code = (
        'n = int(input())\n'
        'r = 1\n'
        'for i in range(1, n + 1):\n'
        '    r *= i\n'
        'print(r)\n'
    )
    for n, title in [
        (5, "阶乘：5! 是多少"),
        (10, "阶乘：10! 涨得真快"),
        (0, "阶乘：0! 为什么等于 1"),
    ]:
        add(exercise(
            topic="math", level=3, title=title,
            desc=f"n! 表示 1 × 2 × 3 × … × n。请计算 n 的阶乘。\n"
                 f"输入：一行，一个非负整数 n（本题 n = {n}）。\n输出：一行，一个整数，表示 n! 的结果。",
            hint="累乘变量的初始值必须是 1，不能是 0（乘 0 全没了）。range(1, n + 1) 在 n = 0 时不循环，"
                 "结果正好是 1。",
            answer=factorial_code, cases=[cs(n)], tags=["阶乘", "累乘"]))

    # ---- 44. 斐波那契数列前 n 项 ----
    fib_list = (
        'n = int(input())\n'
        'a, b = 1, 1\n'
        'res = []\n'
        'for i in range(n):\n'
        '    res.append(a)\n'
        '    a, b = b, a + b\n'
        'print(*res)\n'
    )
    for n, title in [
        (8, "斐波那契：前 8 项排排队"),
        (1, "斐波那契：只要第一项"),
        (15, "斐波那契：前 15 项有多长"),
    ]:
        add(exercise(
            topic="math", level=4, title=title,
            desc=f"斐波那契数列：1, 1, 2, 3, 5, 8, …，从第三项起每一项都是前两项之和。\n"
                 f"输入：一行，一个正整数 n（本题 n = {n}）。\n输出：一行，斐波那契数列的前 n 项，空格隔开。",
            hint="用两个变量 a, b 保存相邻两项，每轮打印 a 之后做 a, b = b, a + b，"
                 "这一行同时赋值可以避免覆盖问题。",
            answer=fib_list, cases=[cs(n)], tags=["斐波那契", "递推"]))

    # ---- 45. 斐波那契第 n 项 ----
    add(exercise(
        topic="math", level=4, title="斐波那契：第 15 项藏着多少只兔子",
        desc="还是那个兔子数列 1, 1, 2, 3, 5, 8, …，这次只要第 n 项。\n"
             "输入：一行，一个正整数 n（本题 n = 15）。\n输出：一行，一个整数，表示第 n 项。",
        hint="只要不停做 a, b = b, a + b，循环 n - 1 次以后 a 就是第 n 项了。想想为什么是 n - 1 次。",
        answer=(
            'n = int(input())\n'
            'a, b = 1, 1\n'
            'for i in range(n - 1):\n'
            '    a, b = b, a + b\n'
            'print(a)\n'
        ),
        cases=[cs(15), cs(30)], tags=["斐波那契", "递推"]))

    # ---- 46. 统计质数个数 ----
    count_primes = (
        'n = int(input())\n'
        'cnt = 0\n'
        'for x in range(2, n + 1):\n'
        '    ok = True\n'
        '    i = 2\n'
        '    while i * i <= x:\n'
        '        if x % i == 0:\n'
        '            ok = False\n'
        '            break\n'
        '        i += 1\n'
        '    if ok:\n'
        '        cnt += 1\n'
        'print(cnt)\n'
    )
    for n, title in [
        (20, "质数普查：20 以内有几个质数"),
        (100, "质数普查：100 以内的质数有多少个"),
        (2, "质数普查：最小质数也要算进去"),
    ]:
        add(exercise(
            topic="math", level=4, title=title,
            desc=f"输入正整数 n，统计 2 到 n 之间（包括 n）一共有多少个质数。\n"
                 f"输入：一行，一个正整数 n（本题 n = {n}）。\n输出：一行，一个整数，表示质数的个数。",
            hint="双层循环：外层枚举每个数，内层判断它是不是质数，是的话计数器加 1。"
                 "内层判断记得用 i * i <= x 提速。",
            answer=count_primes, cases=[cs(n)], tags=["质数", "双重循环", "计数"]))

    # ---- 47. 质因数分解 ----
    factorize_code = (
        'n = int(input())\n'
        'm = n\n'
        'parts = []\n'
        'd = 2\n'
        'while d * d <= m:\n'
        '    while m % d == 0:\n'
        '        parts.append(str(d))\n'
        '        m //= d\n'
        '    d += 1\n'
        'if m > 1:\n'
        '    parts.append(str(m))\n'
        'print(str(n) + " = " + " * ".join(parts))\n'
    )
    for n, title in [
        (12, "质因数分解：把 12 拆成质数相乘"),
        (100, "质因数分解：100 拆开看看"),
        (97, "质因数分解：质数自己的分解"),
    ]:
        add(exercise(
            topic="math", level=4, title=title,
            desc=f"把一个数拆成若干个质数相乘，就叫质因数分解。\n"
                 f"输入：一行，一个大于 1 的整数 n（本题 n = {n}）。\n"
                 f"输出：一行，格式像 12 = 2 * 2 * 3 这样（原数和质因数之间是 等号，质因数之间是 星号，两边都有空格）。",
            hint="从最小的质数 2 开始试：只要 m % d == 0 就把 d 收进结果并让 m //= d，"
                 "一直到 d * d > m 为止；最后如果 m 还大于 1，它本身就是最后一个质因数。",
            answer=factorize_code, cases=[cs(n)], tags=["质因数", "分解"]))

    # ---- 48. 最大质因数 ----
    largest_pf = (
        'n = int(input())\n'
        'ans = n\n'
        'd = 2\n'
        'while d * d <= n:\n'
        '    while n % d == 0:\n'
        '        ans = d\n'
        '        n //= d\n'
        '    d += 1\n'
        'if n > 1:\n'
        '    ans = n\n'
        'print(ans)\n'
    )
    for n, title in [
        (13195, "最大质因数：13195 里最大的质数因子"),
        (600851, "最大质因数：再大一点也难不倒你"),
        (49, "最大质因数：49 的最大质因数"),
    ]:
        add(exercise(
            topic="math", level=4, title=title,
            desc=f"输入一个大于 1 的整数，找出它所有质因数里最大的那一个。\n"
                 f"输入：一行，一个大于 1 的整数 n（本题 n = {n}）。\n输出：一行，一个整数，表示最大的质因数。",
            hint="边分解边记录：每次成功除掉一个质因子 d，就更新答案 ans = d；"
                 "循环结束后如果剩下的 n 还大于 1，那它就是最大的质因数。",
            answer=largest_pf, cases=[cs(n)], tags=["质因数", "打擂台"]))

    # ---- 49. 海伦公式求三角形面积 ----
    heron_code = (
        'import math\n'
        'a, b, c = map(float, input().split())\n'
        'p = (a + b + c) / 2\n'
        's = math.sqrt(p * (p - a) * (p - b) * (p - c))\n'
        'print(f"面积：{s:.2f}")\n'
    )
    for lines, title in [
        (cs("3 4 5"), "海伦公式：3、4、5 直角三角形的面积"),
        (cs("6 8 10"), "海伦公式：6、8、10 的面积"),
        (cs("5 5 6"), "海伦公式：等腰三角形求面积"),
    ]:
        add(exercise(
            topic="math", level=4, title=title,
            desc="已知三角形三条边，可以用海伦公式求面积：p = (a+b+c)/2，面积 = √(p(p-a)(p-b)(p-c))。\n"
                 "输入：一行三个数 a b c，表示三条边长（可能带小数点）。\n"
                 "输出：一行，格式「面积：结果」，结果保留 2 位小数。",
            hint="要开平方就 import math 然后用 math.sqrt()。"
                 "别忘记格式化输出 f\"{s:.2f}\" 保留两位小数。",
            answer=heron_code, cases=[lines], tags=["海伦公式", "math", "格式化"]))

    # ---- 50. 圆的周长与面积 ----
    circle_code = (
        'r = float(input())\n'
        'pi = 3.14\n'
        'print(f"周长：{2 * pi * r:.2f}")\n'
        'print(f"面积：{pi * r * r:.2f}")\n'
    )
    for r, title in [
        (3, "圆的周长与面积：半径 3 的圆"),
        (10, "圆的周长与面积：半径 10 的圆"),
        (2.5, "圆的周长与面积：半径带小数也照样算"),
    ]:
        add(exercise(
            topic="math", level=3, title=title,
            desc=f"输入圆的半径，输出它的周长和面积（本题约定 π = 3.14）。\n"
                 f"输入：一行，一个数 r，表示半径（本题 r = {r}）。\n"
                 f"输出：两行，第一行「周长：结果」，第二行「面积：结果」，都保留 2 位小数。",
            hint="周长 = 2 × π × r，面积 = π × r × r。用 float(input()) 读入以支持小数。",
            answer=circle_code, cases=[cs(r)], tags=["圆", "浮点数", "格式化"]))

    # ---- 51. 摄氏温度转华氏温度 ----
    temp_code = (
        'c = float(input())\n'
        'f = c * 9 / 5 + 32\n'
        'print(f"{f:.1f}")\n'
    )
    for c, title in [
        (37, "温度换算：37℃ 是多少华氏度"),
        (0, "温度换算：0℃ 结冰点"),
        (100, "温度换算：100℃ 沸腾了"),
    ]:
        add(exercise(
            topic="math", level=2, title=title,
            desc=f"华氏温度和摄氏温度的换算公式是：华氏 = 摄氏 × 9 ÷ 5 + 32。\n"
                 f"输入：一行，一个数 c，表示摄氏温度（本题 c = {c}）。\n输出：一行，换算后的华氏温度，保留 1 位小数。",
            hint="注意运算顺序：先乘 9 再除以 5，最后加 32。用 f\"{f:.1f}\" 保留一位小数。",
            answer=temp_code, cases=[cs(c)], tags=["温度", "公式", "浮点数"]))


def _math_b(items):
    add = items.append

    # ---- 52. 三边能否构成三角形 ----
    tri_code = (
        'a, b, c = map(int, input().split())\n'
        'if a + b > c and a + c > b and b + c > a:\n'
        '    print("能构成三角形")\n'
        'else:\n'
        '    print("不能构成三角形")\n'
    )
    for lines, title in [
        (cs("3 4 5"), "三角形体检：3、4、5 能围起来吗"),
        (cs("1 2 5"), "三角形体检：1、2、5 为什么不行"),
        (cs("6 6 6"), "三角形体检：等边三角形"),
    ]:
        add(exercise(
            topic="math", level=3, title=title,
            desc="三条线段要围成三角形，必须满足「任意两边之和大于第三边」。\n"
                 "输入：一行三个正整数 a b c，表示三条边长。\n"
                 "输出：一行，能构成三角形打印「能构成三角形」，否则打印「不能构成三角形」。",
            hint="三个条件要用 and 连起来：a + b > c、a + c > b、b + c > a 都得满足才行。",
            answer=tri_code, cases=[lines], tags=["判断", "几何"]))

    # ---- 53. 两个数的所有公约数 ----
    common_div = (
        'a, b = map(int, input().split())\n'
        'res = []\n'
        'for i in range(1, min(a, b) + 1):\n'
        '    if a % i == 0 and b % i == 0:\n'
        '        res.append(i)\n'
        'print(*res)\n'
    )
    for lines, title in [
        (cs("12 18"), "公约数名册：12 和 18 的共同因数"),
        (cs("24 36"), "公约数名册：24 和 36 的公共因数"),
        (cs("8 9"), "公约数名册：8 和 9 只有 1 吗"),
    ]:
        add(exercise(
            topic="math", level=3, title=title,
            desc="输入两个正整数，从小到大输出它们所有的公约数（能同时整除两个数的数）。\n"
                 "输入：一行两个正整数 a b，空格隔开。\n输出：一行，所有公约数，空格隔开。",
            hint="循环上限只需要到 min(a, b)：比小数还大的数不可能整除小数。"
                 "同时整除写成 a % i == 0 and b % i == 0。",
            answer=common_div, cases=[lines], tags=["公约数", "min"]))

    # ---- 54. 互质判断 ----
    coprime_code = (
        'a, b = map(int, input().split())\n'
        'x, y = a, b\n'
        'while y != 0:\n'
        '    x, y = y, x % y\n'
        'if x == 1:\n'
        '    print("互质")\n'
        'else:\n'
        '    print("不互质")\n'
    )
    for lines, title in [
        (cs("8 9"), "互质判断：8 和 9 是好搭档吗"),
        (cs("12 18"), "互质判断：12 和 18 有没有公因数"),
        (cs("7 13"), "互质判断：两个质数一定互质"),
    ]:
        add(exercise(
            topic="math", level=3, title=title,
            desc="如果两个数的最大公约数是 1，我们就说它们互质。\n"
                 "输入：一行两个正整数 a b，空格隔开。\n"
                 "输出：一行，互质打印「互质」，否则打印「不互质」。",
            hint="先用辗转相除法求出最大公约数，再判断它是不是等于 1。",
            answer=coprime_code, cases=[lines], tags=["互质", "gcd"]))

    # ---- 55. 四舍五入到整数 ----
    round_code = (
        'x = float(input())\n'
        'print(int(x + 0.5))\n'
    )
    for x, title in [
        (3.4, "四舍五入：3.4 应该变成几"),
        (3.6, "四舍五入：3.6 往上还是往下"),
        (7.5, "四舍五入：7.5 的经典分界线"),
    ]:
        add(exercise(
            topic="math", level=2, title=title,
            desc=f"输入一个小数，把它四舍五入成整数。\n"
                 f"输入：一行，一个小数 x（本题 x = {x}）。\n输出：一行，一个整数。",
            hint="一个小技巧：先加 0.5，再取整数部分 int(x + 0.5)。"
                 "想一想为什么加 0.5 就能实现四舍五入。",
            answer=round_code, cases=[cs(x)], tags=["四舍五入", "浮点数"]))

    # ---- 56. 及格率统计 ----
    pass_rate = (
        'n = int(input())\n'
        'a = list(map(int, input().split()))\n'
        'cnt = 0\n'
        'for x in a:\n'
        '    if x >= 60:\n'
        '        cnt += 1\n'
        'print(f"及格率：{cnt / n * 100:.1f}%")\n'
    )
    for lines, title in [
        (cs(5, "58 62 90 45 77"), "及格率：五个人里有几个过关"),
        (cs(8, "100 90 80 70 60 50 40 30"), "及格率：八个人的成绩单"),
        (cs(4, "60 60 59 61"), "及格率：四个人刚刚好"),
    ]:
        add(exercise(
            topic="math", level=3, title=title,
            desc="统计一批成绩的及格率：分数大于等于 60 分算及格。\n"
                 "输入：第一行一个整数 n；第二行 n 个整数，表示成绩，空格隔开。\n"
                 "输出：一行，格式「及格率：xx.x%」，百分号前保留 1 位小数。",
            hint="先数出及格人数 cnt，再算 cnt / n * 100。"
                 "注意 60 分也算及格，所以判断是 x >= 60。",
            answer=pass_rate, cases=[lines], tags=["统计", "百分比", "格式化"]))

    # ---- 57. 两个时刻相差多少分钟 ----
    time_gap = (
        'h1, m1, h2, m2 = map(int, input().split())\n'
        'print((h2 * 60 + m2) - (h1 * 60 + m1))\n'
    )
    for lines, title in [
        (cs("8 30 10 15"), "时间差：从 8:30 到 10:15 过了多久"),
        (cs("9 0 9 45"), "时间差：一节课的时长"),
        (cs("23 30 23 59"), "时间差：睡前还差多少分钟"),
    ]:
        add(exercise(
            topic="math", level=3, title=title,
            desc="输入两个时刻，算一算它们相差多少分钟。\n"
                 "输入：一行四个整数 h1 m1 h2 m2，表示第一个时刻的时和分、第二个时刻的时和分，空格隔开。\n"
                 "输出：一行，一个整数，表示相差的分钟数。",
            hint="把时刻都换成「从 0 点开始过了多少分钟」：小时 × 60 + 分钟，两个数一减就得到答案。",
            answer=time_gap, cases=[lines], tags=["时间换算", "公式"]))

    # ---- 58. 质因数的和 ----
    pf_sum = (
        'n = int(input())\n'
        'm = n\n'
        'total = 0\n'
        'd = 2\n'
        'while d * d <= m:\n'
        '    while m % d == 0:\n'
        '        total += d\n'
        '        m //= d\n'
        '    d += 1\n'
        'if m > 1:\n'
        '    total += m\n'
        'print(total)\n'
    )
    for n, title in [
        (12, "质因数求和：12 的质因数加起来"),
        (100, "质因数求和：100 的质因数总分"),
        (30, "质因数求和：30 的质因数之和"),
    ]:
        add(exercise(
            topic="math", level=4, title=title,
            desc=f"输入一个大于 1 的整数，把它分解成质因数，再求这些质因数的和"
                 f"（重复出现的要重复计算，例如 12 = 2 × 2 × 3，和就是 2 + 2 + 3 = 7）。\n"
                 f"输入：一行，一个大于 1 的整数 n（本题 n = {n}）。\n输出：一行，一个整数，表示质因数之和。",
            hint="在分解质因数的基础上，每除掉一个质因子就把它加到总和里；"
                 "循环结束后别忘了剩下的 m 如果大于 1 也要加进去。",
            answer=pf_sum, cases=[cs(n)], tags=["质因数", "累加"]))

    # ---- 59. 判断是不是 2 的幂 ----
    pow2_code = (
        'n = int(input())\n'
        'if n > 0 and (n & (n - 1)) == 0:\n'
        '    print("是 2 的幂")\n'
        'else:\n'
        '    print("不是 2 的幂")\n'
    )
    for n, title in [
        (64, "2 的幂：64 是不是 2 的幂"),
        (48, "2 的幂：48 差在哪里"),
        (1, "2 的幂：1 也算哦（2 的 0 次方）"),
    ]:
        add(exercise(
            topic="math", level=4, title=title,
            desc=f"如果 n 能写成 2 × 2 × … × 2，它就是 2 的幂（1 也算，它是 2 的 0 次方）。\n"
                 f"输入：一行，一个正整数 n（本题 n = {n}）。\n"
                 f"输出：一行，是 2 的幂打印「是 2 的幂」，否则打印「不是 2 的幂」。",
            hint="2 的幂的二进制长得像 1000…，把它减 1 就变成 0111…，两者按位与的结果一定是 0。"
                 "所以判断条件可以写 (n & (n - 1)) == 0，别忘了 n 要大于 0。",
            answer=pow2_code, cases=[cs(n)], tags=["位运算", "2 的幂"]))

    # ---- 60. 阶乘末尾有几个 0 ----
    trailing_zero = (
        'n = int(input())\n'
        'cnt = 0\n'
        'd = 5\n'
        'while d <= n:\n'
        '    cnt += n // d\n'
        '    d *= 5\n'
        'print(cnt)\n'
    )
    for n, title in [
        (10, "阶乘末尾的 0：10! 后面有几个 0"),
        (100, "阶乘末尾的 0：100! 的尾巴"),
        (25, "阶乘末尾的 0：25! 有点特别"),
    ]:
        add(exercise(
            topic="math", level=4, title=title,
            desc=f"n! 就是 1 × 2 × … × n。请数一数 n! 的结果末尾一共有几个 0。\n"
                 f"输入：一行，一个非负整数 n（本题 n = {n}）。\n输出：一行，一个整数，表示末尾 0 的个数。",
            hint="末尾的 0 来自因数 2 × 5，而 2 总是比 5 多，所以只要数有多少个 5。"
                 "5 的个数 = n//5 + n//25 + n//125 + …，用 while 循环不断把 d 乘 5 就行。",
            answer=trailing_zero, cases=[cs(n)], tags=["阶乘", "数论"]))

    # ---- 61. 十进制转八进制 ----
    to_oct_code = (
        'n = int(input())\n'
        's = ""\n'
        'if n == 0:\n'
        '    s = "0"\n'
        'while n > 0:\n'
        '    s = str(n % 8) + s\n'
        '    n //= 8\n'
        'print(s)\n'
    )
    for n, title in [
        (64, "八进制转换：64 换成八进制"),
        (100, "八进制转换：100 的八进制是多少"),
        (9, "八进制转换：9 的八进制很好猜"),
    ]:
        add(exercise(
            topic="math", level=3, title=title,
            desc=f"用「除 8 取余、倒着读」的方法把十进制转成八进制。\n"
                 f"输入：一行，一个非负整数 n（本题 n = {n}）。\n输出：一行，n 的八进制表示（不带 0o 前缀）。",
            hint="和转二进制一模一样，只是除数和取余都换成 8。别忘记 n = 0 时结果是 \"0\"。",
            answer=to_oct_code, cases=[cs(n)], tags=["进制转换", "八进制"]))

    # ---- 62. 各位数字的平方和 ----
    sq_digit_sum = (
        'n = int(input())\n'
        's = 0\n'
        'while n > 0:\n'
        '    d = n % 10\n'
        '    s += d * d\n'
        '    n //= 10\n'
        'print(s)\n'
    )
    for n, title in [
        (123, "数位平方和：123 的每位平方相加"),
        (999, "数位平方和：999 会得到多少"),
        (2024, "数位平方和：2024 的平方和"),
    ]:
        add(exercise(
            topic="math", level=3, title=title,
            desc=f"输入一个正整数，把它每一位数字的平方加起来。\n"
                 f"输入：一行，一个正整数 n（本题 n = {n}）。\n输出：一行，一个整数，表示各位数字平方之和。",
            hint="还是拆位的老套路：d = n % 10 拿到一位，s += d * d，然后 n //= 10。",
            answer=sq_digit_sum, cases=[cs(n)], tags=["拆位", "平方"]))

    # ---- 63. 数根（反复求各位数字之和直到一位数）----
    digital_root = (
        'n = int(input())\n'
        'while n >= 10:\n'
        '    s = 0\n'
        '    while n > 0:\n'
        '        s += n % 10\n'
        '        n //= 10\n'
        '    n = s\n'
        'print(n)\n'
    )
    for n, title in [
        (9875, "数根：9875 一路加到最后"),
        (99999, "数根：99999 的数字根"),
        (100, "数根：100 的数字根是几"),
    ]:
        add(exercise(
            topic="math", level=4, title=title,
            desc=f"把一个数的各位数字反复相加，直到只剩一位数，这个一位数就叫它的「数根」。\n"
                 f"输入：一行，一个正整数 n（本题 n = {n}）。\n输出：一行，一个整数，表示 n 的数根。",
            hint="外面套一个 while n >= 10 的大循环，里面用老办法求各位数字之和，再把和赋回给 n。",
            answer=digital_root, cases=[cs(n)], tags=["数根", "嵌套循环"]))

    # ---- 64. 互质数对统计 ----
    add(exercise(
        topic="math", level=4, title="互质数对统计：1 到 10 有多少对好朋友",
        desc="请统计 1 到 n 之间有多少对整数 (a, b) 满足 a < b 并且 a 与 b 互质（最大公约数为 1）。\n"
             "输入：一行，一个正整数 n（本题 n = 10）。\n输出：一行，一个整数，表示互质数对的个数。",
        hint="两层 for 循环枚举 a 和 b（a 从 1 到 n，b 从 a + 1 到 n），"
             "再写一个求最大公约数的小循环判断是不是 1，是的话计数器加 1。",
        answer=(
            'n = int(input())\n'
            'cnt = 0\n'
            'for a in range(1, n + 1):\n'
            '    for b in range(a + 1, n + 1):\n'
            '        x, y = a, b\n'
            '        while y != 0:\n'
            '            x, y = y, x % y\n'
            '        if x == 1:\n'
            '            cnt += 1\n'
            'print(cnt)\n'
        ),
        cases=[cs(10), cs(6)], tags=["互质", "双重循环", "枚举"]))

    # ---- 65. 牛顿法开平方 ----
    add(exercise(
        topic="math", level=4, title="牛顿法开平方：不用 ** 0.5 也能算平方根",
        desc="用「猜一个数、再不断修正」的牛顿法求整数平方根：从 x = n 开始，"
             "反复做 x = (x + n // x) // 2，直到 x * x <= n，最后输出 x。\n"
             "输入：一行，一个正整数 n（本题 n = 99）。\n输出：一行，一个整数，表示 n 的整数平方根。",
        hint="把公式 x = (x + n // x) // 2 放进 while 循环，循环条件是 x * x > n，"
             "循环结束时 x 就是答案。先自己在纸上试一遍 n = 99 的过程。",
        answer=(
            'n = int(input())\n'
            'x = n\n'
            'while x * x > n:\n'
            '    x = (x + n // x) // 2\n'
            'print(x)\n'
        ),
        cases=[cs(99), cs(1000)], tags=["平方根", "牛顿法", "while"]))


# =====================================================================
# 二、algo —— 算法思维
# =====================================================================

def _algo_a(items):
    add = items.append

    # ---- 66. 枚举：百钱买百鸡 ----
    add(exercise(
        topic="algo", level=4, title="百钱买百鸡：枚举法的经典一战",
        desc="公鸡 5 元一只，母鸡 3 元一只，小鸡 1 元三只。用 100 元正好买 100 只鸡，"
             "请把所有买法都找出来。\n"
             "输入：本题没有输入。\n"
             "输出：若干行，每行格式「公鸡x只，母鸡y只，小鸡z只」，按公鸡数量从小到大排列。",
        hint="枚举公鸡 x（0 到 20）和母鸡 y（0 到 33），小鸡就是 z = 100 - x - y，"
             "再检查总价 5*x + 3*y + z/3 是不是 100（别忘了 z 要能被 3 整除）。",
        answer=(
            'for x in range(21):\n'
            '    for y in range(34):\n'
            '        z = 100 - x - y\n'
            '        if z >= 0 and z % 3 == 0 and 5 * x + 3 * y + z // 3 == 100:\n'
            '            print(f"公鸡{x}只，母鸡{y}只，小鸡{z}只")\n'
        ),
        cases=[""], tags=["枚举", "双重循环", "经典题"]))

    # ---- 67. 枚举：3 和 5 的公倍数 ----
    multi35 = (
        'n = int(input())\n'
        'res = []\n'
        'for i in range(1, n + 1):\n'
        '    if i % 3 == 0 and i % 5 == 0:\n'
        '        res.append(i)\n'
        'print(*res)\n'
    )
    for n, title in [
        (50, "公倍数点名：50 以内谁同时被 3 和 5 整除"),
        (100, "公倍数点名：100 以内一起报数"),
        (15, "公倍数点名：15 自己也算一个"),
    ]:
        add(exercise(
            topic="algo", level=3, title=title,
            desc=f"请找出 1 到 n 之间所有既能被 3 整除、又能被 5 整除的数。\n"
                 f"输入：一行，一个正整数 n（本题 n = {n}）。\n输出：一行，符合条件的数，从小到大，空格隔开。",
            hint="一个一个试（枚举）就行：同时整除要写成 i % 3 == 0 and i % 5 == 0。",
            answer=multi35, cases=[cs(n)], tags=["枚举", "整除"]))

    # ---- 68. 枚举：1 到 n 中的所有完全平方数 ----
    squares_upto = (
        'n = int(input())\n'
        'res = []\n'
        'i = 1\n'
        'while i * i <= n:\n'
        '    res.append(i * i)\n'
        '    i += 1\n'
        'print(*res)\n'
    )
    for n, title in [
        (100, "铺瓷砖：100 块以内能摆成正方形的数量"),
        (50, "铺瓷砖：50 以内哪些数能摆正方形"),
        (1, "铺瓷砖：最小的一块也能"),
    ]:
        add(exercise(
            topic="algo", level=3, title=title,
            desc=f"输入正整数 n，输出 1 到 n 之间所有的完全平方数（能摆成正方形的数量）。\n"
                 f"输入：一行，一个正整数 n（本题 n = {n}）。\n输出：一行，所有完全平方数，从小到大，空格隔开。",
            hint="不用一个一个数去开方，直接枚举 1、2、3…，把 i * i 收进列表，"
                 "只要 i * i 不超过 n 就继续。",
            answer=squares_upto, cases=[cs(n)], tags=["枚举", "平方"]))

    # ---- 69. 累加：一叠数字求和 ----
    sum_list = (
        'n = int(input())\n'
        'a = list(map(int, input().split()))\n'
        'total = 0\n'
        'for x in a:\n'
        '    total += x\n'
        'print(total)\n'
    )
    for lines, title in [
        (cs(5, "1 2 3 4 5"), "累加练习：1 到 5 的和"),
        (cs(6, "10 20 30 40 50 60"), "累加练习：六个整数的总和"),
        (cs(4, "9 9 9 9"), "累加练习：四个 9 加起来"),
    ]:
        add(exercise(
            topic="algo", level=3, title=title,
            desc="输入 n 个整数，求它们的总和。\n"
                 "输入：第一行一个整数 n；第二行 n 个整数，空格隔开。\n输出：一行，一个整数，表示总和。",
            hint="先 total = 0，再 for x in a: total += x。虽然 sum() 一行就能搞定，"
                 "但手动累加是算法基本功，一定要会写。",
            answer=sum_list, cases=[lines], tags=["累加", "列表"]))

    # ---- 70. 累乘：连乘一串小数字 ----
    prod_list = (
        'n = int(input())\n'
        'a = list(map(int, input().split()))\n'
        'r = 1\n'
        'for x in a:\n'
        '    r *= x\n'
        'print(r)\n'
    )
    for lines, title in [
        (cs(4, "1 2 3 4"), "累乘练习：1×2×3×4 等于多少"),
        (cs(3, "5 6 7"), "累乘练习：5、6、7 连乘"),
        (cs(5, "2 2 2 2 2"), "累乘练习：五个 2 相乘"),
    ]:
        add(exercise(
            topic="algo", level=3, title=title,
            desc="输入 n 个正整数，求它们的乘积。\n"
                 "输入：第一行一个整数 n；第二行 n 个正整数，空格隔开。\n输出：一行，一个整数，表示乘积。",
            hint="累乘变量的初始值必须是 1（写 0 的话全变成 0 了），然后 r *= x 一路乘下去。",
            answer=prod_list, cases=[lines], tags=["累乘", "列表"]))

    # ---- 71. 打擂台：最大最小 ----
    maxmin = (
        'n = int(input())\n'
        'a = list(map(int, input().split()))\n'
        'mx = a[0]\n'
        'mn = a[0]\n'
        'for x in a:\n'
        '    if x > mx:\n'
        '        mx = x\n'
        '    if x < mn:\n'
        '        mn = x\n'
        'print(f"最大值：{mx}")\n'
        'print(f"最小值：{mn}")\n'
    )
    for lines, title in [
        (cs(5, "3 7 1 9 4"), "打擂台：3、7、1、9、4 里的最强者"),
        (cs(6, "88 92 75 60 100 83"), "打擂台：六个人的成绩高低"),
        (cs(3, "-5 -1 -9"), "打擂台：负数也要比一比"),
    ]:
        add(exercise(
            topic="algo", level=3, title=title,
            desc="输入 n 个整数，找出其中最大的数和最小的数。\n"
                 "输入：第一行一个整数 n；第二行 n 个整数，空格隔开。\n"
                 "输出：两行，第一行「最大值：x」，第二行「最小值：y」。",
            hint="打擂台的思想：先把第一个数当成擂主 mx = a[0]，后面每个数都来挑战，"
                 "比它大就换人。最小值同理。",
            answer=maxmin, cases=[lines], tags=["打擂台", "最大最小"]))

    # ---- 72. 最大值在第几个位置 ----
    max_pos = (
        'n = int(input())\n'
        'a = list(map(int, input().split()))\n'
        'pos = 1\n'
        'for i in range(1, n):\n'
        '    if a[i] > a[pos - 1]:\n'
        '        pos = i + 1\n'
        'print(pos)\n'
    )
    for lines, title in [
        (cs(5, "3 7 1 9 4"), "冠军在第几位：找出最大值的编号"),
        (cs(6, "10 20 30 40 50 60"), "冠军在第几位：一路递增"),
        (cs(4, "5 5 5 9"), "冠军在第几位：最后一位逆袭"),
    ]:
        add(exercise(
            topic="algo", level=3, title=title,
            desc="输入 n 个整数，输出最大数所在的位置（从 1 开始编号，如果最大的数出现多次，输出第一次出现的位置）。\n"
                 "输入：第一行一个整数 n；第二行 n 个整数，空格隔开。\n输出：一行，一个整数，表示最大数的位置。",
            hint="用 pos 记录当前冠军的编号（从 1 开始），循环时用 a[i] 和 a[pos - 1] 比较，"
                 "严格大于才更新，这样就能保证留下最靠前的那个。",
            answer=max_pos, cases=[lines], tags=["打擂台", "下标"]))

    # ---- 73. 第二大的数 ----
    second_max = (
        'n = int(input())\n'
        'a = sorted(set(map(int, input().split())), reverse=True)\n'
        'print(a[1])\n'
    )
    for lines, title in [
        (cs(5, "3 7 1 9 4"), "亚军是谁：第二大的数"),
        (cs(6, "88 92 75 60 100 83"), "亚军是谁：成绩榜第二名"),
        (cs(4, "10 10 8 6"), "亚军是谁：去掉重复再看"),
    ]:
        add(exercise(
            topic="algo", level=3, title=title,
            desc="输入 n 个整数（保证至少有两个不同的数），输出第二大的数（重复的数只算一次）。\n"
                 "输入：第一行一个整数 n；第二行 n 个整数，空格隔开。\n输出：一行，一个整数，表示第二大的数。",
            hint="小技巧：set() 去重、sorted(..., reverse=True) 从大到小排序，"
                 "排好之后下标 1 就是第二大的数。",
            answer=second_max, cases=[lines], tags=["排序", "去重"]))

    # ---- 74. 计数排序思想：统计 0-9 出现次数 ----
    digit_count = (
        's = input().split()\n'
        'cnt = [0] * 10\n'
        'for ch in s:\n'
        '    cnt[int(ch)] += 1\n'
        'print(*cnt)\n'
    )
    for lines, title in [
        (cs("3 1 4 1 5 9 2 6"), "计数排序思想：统计每个数字出现了几次"),
        (cs("0 0 0 9 9 8"), "计数排序思想：数一数彩票号码"),
        (cs("7"), "计数排序思想：只有一个数字"),
    ]:
        add(exercise(
            topic="algo", level=4, title=title,
            desc="输入一串 0 到 9 之间的数字（用空格隔开），请统计每个数字各出现了几次。\n"
                 "输入：一行，若干个 0-9 的整数，空格隔开。\n"
                 "输出：一行，10 个整数，依次表示数字 0、1、2、…、9 出现的次数，空格隔开。",
            hint="这是计数排序的核心思想：开一个长度为 10 的列表 cnt = [0] * 10，"
                 "读到数字 d 就 cnt[d] += 1，最后依次打印 cnt。",
            answer=digit_count, cases=[lines], tags=["计数排序", "桶思想"]))

    # ---- 75. 二分查找 ----
    binary_search = (
        'n, k = map(int, input().split())\n'
        'a = list(map(int, input().split()))\n'
        'lo = 0\n'
        'hi = n - 1\n'
        'ans = -1\n'
        'while lo <= hi:\n'
        '    mid = (lo + hi) // 2\n'
        '    if a[mid] == k:\n'
        '        ans = mid + 1\n'
        '        break\n'
        '    elif a[mid] < k:\n'
        '        lo = mid + 1\n'
        '    else:\n'
        '        hi = mid - 1\n'
        'print(ans)\n'
    )
    for lines, title in [
        (cs("8 23", "2 5 8 12 16 23 38 56"), "二分查找：在有序名单里找 23"),
        (cs("6 10", "1 3 5 7 9 11"), "二分查找：找不到就输出 -1"),
        (cs("7 2", "2 4 6 8 10 12 14"), "二分查找：第一项就是目标"),
    ]:
        add(exercise(
            topic="algo", level=4, title=title,
            desc="在一串排好序的数字里找一个目标值，请用二分查找（每次砍掉一半）的方法。\n"
                 "输入：第一行两个整数 n k，表示数字个数和目标值；第二行 n 个从小到大排好序的整数。\n"
                 "输出：一行，目标值的位置（从 1 开始编号）；如果找不到，输出 -1。",
            hint="用 lo 和 hi 两个指针圈定范围，每次看中间那个 mid = (lo + hi) // 2："
                 "小了就把 lo 挪到 mid + 1，大了就把 hi 挪到 mid - 1。",
            answer=binary_search, cases=[lines], tags=["二分查找", "while"]))

    # ---- 76. 二分法猜数需要几次 ----
    guess_times = (
        'n = int(input())\n'
        'lo, hi = 1, n\n'
        'cnt = 0\n'
        'while lo < hi:\n'
        '    mid = (lo + hi) // 2\n'
        '    cnt += 1\n'
        '    hi = mid\n'
        'print(cnt)\n'
    )
    for n, title in [
        (100, "猜数游戏：1 到 100 最少猜几次"),
        (1000, "猜数游戏：1 到 1000 要几次"),
        (1, "猜数游戏：只有 1 个数就不用猜"),
    ]:
        add(exercise(
            topic="algo", level=4, title=title,
            desc=f"玩猜数字游戏，答案在 1 到 n 之间，每猜一次都会告诉你「大了」或「小了」。"
                 f"用二分法（每次都猜中间那个数），最坏情况下要猜几次？\n"
                 f"输入：一行，一个正整数 n（本题 n = {n}）。\n输出：一行，一个整数，表示最少的猜测次数。",
            hint="每猜一次剩下的范围就少一半：不断把范围的上界换成中点，看要换几次才能把范围缩到只剩一个数。",
            answer=guess_times, cases=[cs(n)], tags=["二分思想", "计数"]))

    # ---- 77. 冒泡排序 ----
    bubble_sort = (
        'n = int(input())\n'
        'a = list(map(int, input().split()))\n'
        'for i in range(n - 1):\n'
        '    for j in range(n - 1 - i):\n'
        '        if a[j] > a[j + 1]:\n'
        '            a[j], a[j + 1] = a[j + 1], a[j]\n'
        'print(*a)\n'
    )
    for lines, title in [
        (cs(5, "5 2 9 1 7"), "冒泡排序：把 5 个数排好队"),
        (cs(6, "6 5 4 3 2 1"), "冒泡排序：完全倒过来的情况"),
        (cs(4, "1 2 3 4"), "冒泡排序：本来就排好了"),
    ]:
        add(exercise(
            topic="algo", level=4, title=title,
            desc="用冒泡排序把 n 个整数从小到大排好序再输出（相邻两个数比较，大的往后冒）。\n"
                 "输入：第一行一个整数 n；第二行 n 个整数，空格隔开。\n输出：一行，排好序的数字，空格隔开。",
            hint="外层循环控制轮数（n - 1 轮），内层循环控制每轮的比较次数（range(n - 1 - i)），"
                 "交换用 a[j], a[j + 1] = a[j + 1], a[j] 一行搞定。",
            answer=bubble_sort, cases=[lines], tags=["冒泡排序", "双重循环"]))

    # ---- 78. 冒泡排序第一趟的结果 ----
    bubble_one_pass = (
        'n = int(input())\n'
        'a = list(map(int, input().split()))\n'
        'for j in range(n - 1):\n'
        '    if a[j] > a[j + 1]:\n'
        '        a[j], a[j + 1] = a[j + 1], a[j]\n'
        'print(*a)\n'
    )
    for lines, title in [
        (cs(5, "5 2 9 1 7"), "冒泡第一趟：最大的数跑到哪去了"),
        (cs(6, "3 8 1 6 2 9"), "冒泡第一趟：只扫一遍会变成什么样"),
    ]:
        add(exercise(
            topic="algo", level=4, title=title,
            desc="冒泡排序的第一趟只会从左到右扫一遍，请输出只做这一趟之后的结果。\n"
                 "输入：第一行一个整数 n；第二行 n 个整数，空格隔开。\n输出：一行，只扫一趟之后的数字序列，空格隔开。",
            hint="只用一层 for j in range(n - 1) 循环：相邻比较、大的换到后面。"
                 "想一想一趟之后哪个数一定到最终位置了。",
            answer=bubble_one_pass, cases=[lines], tags=["冒泡排序", "过程模拟"]))

    # ---- 79. 冒泡排序交换次数 ----
    bubble_swaps = (
        'n = int(input())\n'
        'a = list(map(int, input().split()))\n'
        'cnt = 0\n'
        'for i in range(n - 1):\n'
        '    for j in range(n - 1 - i):\n'
        '        if a[j] > a[j + 1]:\n'
        '            a[j], a[j + 1] = a[j + 1], a[j]\n'
        '            cnt += 1\n'
        'print(cnt)\n'
    )
    for lines, title in [
        (cs(5, "5 2 9 1 7"), "冒泡计数：排好这 5 个数要交换几次"),
        (cs(4, "4 3 2 1"), "冒泡计数：完全倒序要换多少次"),
        (cs(4, "1 2 3 4"), "冒泡计数：排好的数据一次都不用换"),
    ]:
        add(exercise(
            topic="algo", level=4, title=title,
            desc="统计冒泡排序过程中一共发生了多少次交换。\n"
                 "输入：第一行一个整数 n；第二行 n 个整数，空格隔开。\n输出：一行，一个整数，表示交换的总次数。",
            hint="在冒泡排序的交换语句后面加一个计数器 cnt += 1 就行，最后打印 cnt。",
            answer=bubble_swaps, cases=[lines], tags=["冒泡排序", "计数"]))

    # ---- 80. 选择排序 ----
    selection_sort = (
        'n = int(input())\n'
        'a = list(map(int, input().split()))\n'
        'for i in range(n - 1):\n'
        '    m = i\n'
        '    for j in range(i + 1, n):\n'
        '        if a[j] < a[m]:\n'
        '            m = j\n'
        '    a[i], a[m] = a[m], a[i]\n'
        'print(*a)\n'
    )
    for lines, title in [
        (cs(5, "5 2 9 1 7"), "选择排序：每轮挑出最小的那个"),
        (cs(6, "11 4 7 2 9 3"), "选择排序：六个数字排队"),
    ]:
        add(exercise(
            topic="algo", level=4, title=title,
            desc="用选择排序把 n 个整数从小到大排序：每一轮从未排序的部分里挑出最小的，换到前面来。\n"
                 "输入：第一行一个整数 n；第二行 n 个整数，空格隔开。\n输出：一行，排好序的数字，空格隔开。",
            hint="外层 i 表示「已经排好的个数」，内层用 m 记录最小值的下标，"
                 "内层循环结束后再交换 a[i] 和 a[m]。",
            answer=selection_sort, cases=[lines], tags=["选择排序", "双重循环"]))

    # ---- 81. 插入排序 ----
    insertion_sort = (
        'n = int(input())\n'
        'a = list(map(int, input().split()))\n'
        'for i in range(1, n):\n'
        '    key = a[i]\n'
        '    j = i - 1\n'
        '    while j >= 0 and a[j] > key:\n'
        '        a[j + 1] = a[j]\n'
        '        j -= 1\n'
        '    a[j + 1] = key\n'
        'print(*a)\n'
    )
    for lines, title in [
        (cs(5, "5 2 9 1 7"), "插入排序：像整理扑克牌一样"),
        (cs(6, "8 3 5 1 9 2"), "插入排序：一张张插到该在的位置"),
    ]:
        add(exercise(
            topic="algo", level=4, title=title,
            desc="用插入排序把 n 个整数从小到大排序：把每个新数字插到左边已经排好的队伍里。\n"
                 "输入：第一行一个整数 n；第二行 n 个整数，空格隔开。\n输出：一行，排好序的数字，空格隔开。",
            hint="先把当前牌记下来 key = a[i]，然后用 while 把左边比它大的数统统往右挪一格，"
                 "腾出空位再放 key。",
            answer=insertion_sort, cases=[lines], tags=["插入排序", "while"]))

    # ---- 82. 去重（保持原来的顺序）----
    dedup_code = (
        'n = int(input())\n'
        'a = list(map(int, input().split()))\n'
        'res = []\n'
        'for x in a:\n'
        '    if x not in res:\n'
        '        res.append(x)\n'
        'print(*res)\n'
    )
    for lines, title in [
        (cs(7, "3 1 3 2 1 5 3"), "去重练习：删掉重复的数字"),
        (cs(6, "8 8 8 8 8 8"), "去重练习：全都是同一个数"),
        (cs(5, "1 2 3 4 5"), "去重练习：本来就没有重复"),
    ]:
        add(exercise(
            topic="algo", level=3, title=title,
            desc="输入 n 个整数，请去掉重复的数字，并保持第一次出现的先后顺序输出。\n"
                 "输入：第一行一个整数 n；第二行 n 个整数，空格隔开。\n输出：一行，去重之后的数字，空格隔开。",
            hint="建一个空列表 res，遍历原列表：如果 x 还不在 res 里就加进去。"
                 "判断用 x not in res，顺序就自然保住了。",
            answer=dedup_code, cases=[lines], tags=["去重", "列表"]))

    # ---- 83. 去重后还剩几个 ----
    dedup_count = (
        'n = int(input())\n'
        'a = list(map(int, input().split()))\n'
        'res = []\n'
        'for x in a:\n'
        '    if x not in res:\n'
        '        res.append(x)\n'
        'print(len(res))\n'
    )
    for lines, title in [
        (cs(7, "3 1 3 2 1 5 3"), "去重统计：还剩几个不同的数"),
        (cs(8, "1 1 2 2 3 3 4 4"), "去重统计：成对出现的数字"),
    ]:
        add(exercise(
            topic="algo", level=3, title=title,
            desc="输入 n 个整数，数一数其中一共有多少种不同的数。\n"
                 "输入：第一行一个整数 n；第二行 n 个整数，空格隔开。\n输出：一行，一个整数，表示不同数字的个数。",
            hint="先去重（不重复才 append），最后打印 len(res)。"
                 "也可以想一想：用 set(a) 是不是一步就能搞定？",
            answer=dedup_count, cases=[lines], tags=["去重", "计数"]))

    # ---- 84. 第 k 小 ----
    kth_small = (
        'n, k = map(int, input().split())\n'
        'a = sorted(map(int, input().split()))\n'
        'print(a[k - 1])\n'
    )
    for lines, title in [
        (cs("6 3", "9 4 7 1 8 3"), "第 k 小：找第 3 小的数"),
        (cs("5 1", "5 3 8 2 9"), "第 k 小：其实就是最小值"),
        (cs("8 8", "4 4 2 9 1 7 6 3"), "第 k 小：最大的那一个"),
    ]:
        add(exercise(
            topic="algo", level=3, title=title,
            desc="输入 n 个整数和一个整数 k，找出其中第 k 小的数（最小的数排第 1）。\n"
                 "输入：第一行两个整数 n k；第二行 n 个整数，空格隔开。\n输出：一行，一个整数，表示第 k 小的数。",
            hint="先从小到大排好序（sorted），第 k 小的数就在下标 k - 1 的位置。"
                 "想一想为什么是 k - 1 而不是 k。",
            answer=kth_small, cases=[lines], tags=["排序", "第k小"]))

    # ---- 85. 第 k 大 ----
    kth_big = (
        'n, k = map(int, input().split())\n'
        'a = sorted(map(int, input().split()), reverse=True)\n'
        'print(a[k - 1])\n'
    )
    for lines, title in [
        (cs("6 2", "9 4 7 1 8 3"), "第 k 大：成绩榜第 2 名"),
        (cs("5 5", "10 20 30 40 50"), "第 k 大：倒数第一名"),
    ]:
        add(exercise(
            topic="algo", level=3, title=title,
            desc="输入 n 个整数和一个整数 k，找出其中第 k 大的数（最大的数排第 1）。\n"
                 "输入：第一行两个整数 n k；第二行 n 个整数，空格隔开。\n输出：一行，一个整数，表示第 k 大的数。",
            hint="从大到小排序：sorted(a, reverse=True)，然后取下标 k - 1。",
            answer=kth_big, cases=[lines], tags=["排序", "第k大"]))

    # ---- 86. 模拟：排队点名 ----
    queue_code = (
        'n = int(input())\n'
        'q = []\n'
        'for i in range(n):\n'
        '    q.append(input().strip())\n'
        'print("、".join(q))\n'
        'print(f"队首：{q[0]}")\n'
        'print(f"队尾：{q[-1]}")\n'
    )
    for lines, title in [
        (cs(3, "小明", "小红", "小刚"), "排队模拟：三个人依次站好"),
        (cs(4, "丁丁", "冬冬", "小美", "阿力"), "排队模拟：四个人的队伍"),
    ]:
        add(exercise(
            topic="algo", level=3, title=title,
            desc="n 个小朋友一个接一个来排队，请把队伍打印出来，并报告队首和队尾是谁。\n"
                 "输入：第一行一个整数 n；接下来 n 行，每行一个名字。\n"
                 "输出：三行，第一行是所有名字用顿号「、」连起来，第二行「队首：名字」，第三行「队尾：名字」。",
            hint="用列表模拟队伍：来一个人就 append 到队尾。队首是 q[0]，队尾是 q[-1]，"
                 "用 \"、\".join(q) 可以把名字连成一行。",
            answer=queue_code, cases=[lines], tags=["模拟", "列表", "队列"]))

    # ---- 87. 模拟：买东西找零 ----
    change_code = (
        'price, pay = map(int, input().split())\n'
        'change = pay - price\n'
        'print(f"应找零：{change} 元")\n'
        'for m in [50, 20, 10, 5, 1]:\n'
        '    c = change // m\n'
        '    if c > 0:\n'
        '        print(f"{m} 元：{c} 张")\n'
        '    change %= m\n'
    )
    for lines, title in [
        (cs("38 100"), "找零钱：买 38 元付 100 元"),
        (cs("67 80"), "找零钱：付 80 元找回多少"),
        (cs("9 50"), "找零钱：50 元买 9 元的东西"),
    ]:
        add(exercise(
            topic="algo", level=4, title=title,
            desc="收银员要找零，希望用最少的张数。纸币面额有 50、20、10、5、1 元。\n"
                 "输入：一行两个整数 price pay，表示商品价格和顾客付的钱（pay 一定不小于 price）。\n"
                 "输出：第一行「应找零：x 元」，接下来每一行「面额 元：n 张」（只要张数大于 0 的面额），"
                 "面额从大到小排列。",
            hint="贪心思想：能用大面额就用大面额。依次对 50、20、10、5、1 做整除和取余，"
                 "整除得到张数，取余得到剩下的钱。",
            answer=change_code, cases=[lines], tags=["模拟", "贪心", "找零"]))

    # ---- 88. 模拟：公交车上下客 ----
    bus_code = (
        'n = int(input())\n'
        'now = 0\n'
        'mx = 0\n'
        'for i in range(n):\n'
        '    up, down = map(int, input().split())\n'
        '    now = now + up - down\n'
        '    if now > mx:\n'
        '        mx = now\n'
        'print(f"最终车上：{now} 人")\n'
        'print(f"最多时：{mx} 人")\n'
    )
    for lines, title in [
        (cs(4, "5 0", "3 2", "1 4", "6 1"), "公交车模拟：四站路上的乘客变化"),
        (cs(3, "10 0", "0 5", "2 3"), "公交车模拟：三站的变化"),
        (cs(2, "4 1", "0 3"), "公交车模拟：只有两站"),
    ]:
        add(exercise(
            topic="algo", level=3, title=title,
            desc="公交车一路开过去，每一站都有人上车、有人下车，请记录车上人数的变化。\n"
                 "输入：第一行一个整数 n，表示站数；接下来 n 行，每行两个整数 up down，"
                 "表示这一站上车人数和下车人数，空格隔开。\n"
                 "输出：两行，第一行「最终车上：x 人」，第二行「最多时：y 人」（含起点之后的最大值）。",
            hint="用一个变量 now 记录当前人数，每站做 now = now + up - down；"
                 "再准备一个 mx，每次更新完都和它比一比。",
            answer=bus_code, cases=[lines], tags=["模拟", "打擂台"]))

    # ---- 89. 模拟：存钱罐 ----
    piggy_code = (
        'target = int(input())\n'
        'day = 0\n'
        'total = 0\n'
        'while total < target:\n'
        '    day += 1\n'
        '    total += day\n'
        'print(day)\n'
    )
    for target, title in [
        (28, "存钱罐：第几天能存够 28 元"),
        (100, "存钱罐：存够 100 元要几天"),
        (1, "存钱罐：第一天就够了"),
    ]:
        add(exercise(
            topic="algo", level=3, title=title,
            desc=f"小明第 1 天存 1 元，第 2 天存 2 元，第 3 天存 3 元……每天比前一天多存 1 元。"
                 f"问他第几天能存够 target 元（达到或超过都算）。\n"
                 f"输入：一行，一个正整数 target（本题 target = {target}）。\n输出：一行，一个整数，表示需要的天数。",
            hint="用 while total < target 循环：每轮 day += 1、total += day，"
                 "循环结束时 day 就是答案。",
            answer=piggy_code, cases=[cs(target)], tags=["模拟", "while"]))

    # ---- 90. 前缀和：区间求和 ----
    prefix_sum = (
        'n, q = map(int, input().split())\n'
        'a = list(map(int, input().split()))\n'
        'pre = [0] * (n + 1)\n'
        'for i in range(n):\n'
        '    pre[i + 1] = pre[i] + a[i]\n'
        'for i in range(q):\n'
        '    l, r = map(int, input().split())\n'
        '    print(pre[r] - pre[l - 1])\n'
    )
    for lines, title in [
        (cs("5 2", "3 1 4 1 5", "1 3", "2 5"), "前缀和：快速算区间和"),
        (cs("6 3", "10 20 30 40 50 60", "1 6", "3 4", "2 2"), "前缀和：多次查询也不怕"),
    ]:
        add(exercise(
            topic="algo", level=4, title=title,
            desc="输入一串数字，然后回答 q 次提问：第 l 个数到第 r 个数的和是多少？\n"
                 "输入：第一行两个整数 n q；第二行 n 个整数；接下来 q 行，每行两个整数 l r（从 1 开始编号）。\n"
                 "输出：q 行，每行一个整数，表示对应区间的和。",
            hint="预处理一个前缀和数组 pre，其中 pre[i] 表示前 i 个数的和（pre[0] = 0），"
                 "那么区间 [l, r] 的和就是 pre[r] - pre[l - 1]，一次询问只要一步减法。",
            answer=prefix_sum, cases=[lines], tags=["前缀和", "预处理"]))

    # ---- 91. 双指针：能不能凑出目标和 ----
    two_sum = (
        'n, t = map(int, input().split())\n'
        'a = sorted(map(int, input().split()))\n'
        'i, j = 0, n - 1\n'
        'ok = False\n'
        'while i < j:\n'
        '    s = a[i] + a[j]\n'
        '    if s == t:\n'
        '        ok = True\n'
        '        break\n'
        '    elif s < t:\n'
        '        i += 1\n'
        '    else:\n'
        '        j -= 1\n'
        'print("能找到" if ok else "找不到")\n'
    )
    for lines, title in [
        (cs("6 10", "1 3 5 7 9 2"), "凑数游戏：哪两个数加起来是 10"),
        (cs("5 100", "1 2 3 4 5"), "凑数游戏：凑不出来的情况"),
        (cs("4 7", "3 4 5 6"), "凑数游戏：3 + 4 正好"),
    ]:
        add(exercise(
            topic="algo", level=4, title=title,
            desc="在这串数字里找两个不同的数，看看它们能不能加起来正好等于目标值 t。\n"
                 "输入：第一行两个整数 n t；第二行 n 个整数，空格隔开。\n"
                 "输出：一行，能找到打印「能找到」，找不到打印「找不到」。",
            hint="先排序，再用双指针：一个指向最左（最小的），一个指向最右（最大的）。"
                 "和太小就把左指针往右挪，和太大就把右指针往左挪，直到两个指针相遇。",
            answer=two_sum, cases=[lines], tags=["双指针", "排序"]))

    # ---- 92. 众数 ----
    mode_code = (
        'n = int(input())\n'
        'a = list(map(int, input().split()))\n'
        'best = a[0]\n'
        'bestc = 0\n'
        'for x in a:\n'
        '    c = a.count(x)\n'
        '    if c > bestc:\n'
        '        bestc = c\n'
        '        best = x\n'
        'print(f"众数：{best}")\n'
        'print(f"出现次数：{bestc}")\n'
    )
    for lines, title in [
        (cs(8, "1 3 3 2 3 1 5 3"), "众数：出现次数最多的数字"),
        (cs(6, "9 9 9 2 2 7"), "众数：谁是人气王"),
        (cs(5, "4 4 5 5 6"), "众数：并列时取先出现的"),
    ]:
        add(exercise(
            topic="algo", level=3, title=title,
            desc="输入 n 个整数，找出出现次数最多的那个数（众数），并输出它的出现次数。"
                 "如果出现次数并列，输出最先出现的那个数。\n"
                 "输入：第一行一个整数 n；第二行 n 个整数，空格隔开。\n"
                 "输出：两行，第一行「众数：x」，第二行「出现次数：c」。",
            hint="遍历每个数，用 a.count(x) 数一数它出现了几次；"
                 "只有严格大于当前最多的时候才更新，这样并列时就会保留先出现的那个。",
            answer=mode_code, cases=[lines], tags=["统计", "众数"]))

    # ---- 93. 最大子段和（暴力枚举）----
    max_subarray = (
        'n = int(input())\n'
        'a = list(map(int, input().split()))\n'
        'best = a[0]\n'
        'for i in range(n):\n'
        '    s = 0\n'
        '    for j in range(i, n):\n'
        '        s += a[j]\n'
        '        if s > best:\n'
        '            best = s\n'
        'print(best)\n'
    )
    for lines, title in [
        (cs(8, "2 -3 4 -1 2 1 -5 4"), "连续子段：哪一段加起来最大"),
        (cs(5, "-2 -1 -5 -3 -4"), "连续子段：全是负数怎么办"),
        (cs(6, "1 2 3 4 5 6"), "连续子段：全正数当然全要"),
    ]:
        add(exercise(
            topic="algo", level=4, title=title,
            desc="在一串整数里找一段连续的数，让它们的和最大（至少要选一个数），输出这个最大的和。\n"
             "输入：第一行一个整数 n；第二行 n 个整数（可能有负数），空格隔开。\n输出：一行，一个整数，表示最大子段和。",
            hint="用枚举：起点 i 从 0 到 n - 1，终点 j 从 i 到 n - 1，一边走一边累加 s，"
                 "每加一个就和 best 比一比。",
            answer=max_subarray, cases=[lines], tags=["枚举", "最大子段和"]))

    # ---- 94. 合并两个有序列表 ----
    merge_sorted = (
        'n, m = map(int, input().split())\n'
        'a = list(map(int, input().split()))\n'
        'b = list(map(int, input().split()))\n'
        'i = 0\n'
        'j = 0\n'
        'res = []\n'
        'while i < n and j < m:\n'
        '    if a[i] <= b[j]:\n'
        '        res.append(a[i])\n'
        '        i += 1\n'
        '    else:\n'
        '        res.append(b[j])\n'
        '        j += 1\n'
        'res += a[i:]\n'
        'res += b[j:]\n'
        'print(*res)\n'
    )
    for lines, title in [
        (cs("3 4", "1 5 9", "2 3 7 10"), "合并队伍：两组有序数字合成一组"),
        (cs("4 3", "2 4 6 8", "1 3 5"), "合并队伍：交替取数"),
        (cs("2 2", "1 2", "3 4"), "合并队伍：一队完全在后面"),
    ]:
        add(exercise(
            topic="algo", level=4, title=title,
            desc="有两队已经从小到大排好序的数字，请把它们合并成一队，仍然保持从小到大。\n"
                 "输入：第一行两个整数 n m，表示两队各有多少个数；第二行 n 个整数；第三行 m 个整数。\n"
                 "输出：一行，合并后的数字，空格隔开。",
            hint="两个指针 i 和 j 分别指向两队开头，每次比较 a[i] 和 b[j]，"
                 "谁小就先输出谁并让它的指针前进。一队空了以后，把另一队剩下的直接接在后面。",
            answer=merge_sorted, cases=[lines], tags=["归并思想", "双指针"]))

    # ---- 95. 交集与并集 ----
    set_ops = (
        'n, m = map(int, input().split())\n'
        'a = list(map(int, input().split()))\n'
        'b = list(map(int, input().split()))\n'
        'common = []\n'
        'for x in a:\n'
        '    if x in b and x not in common:\n'
        '        common.append(x)\n'
        'allv = []\n'
        'for x in a + b:\n'
        '    if x not in allv:\n'
        '        allv.append(x)\n'
        'print(f"交集：{len(common)} 个")\n'
        'print(*common)\n'
        'print(f"并集：{len(allv)} 个")\n'
        'print(*allv)\n'
    )
    for lines, title in [
        (cs("5 4", "1 2 3 4 5", "3 4 5 6"), "交集与并集：两个小组的成员对比"),
        (cs("3 3", "7 8 9", "1 2 3"), "交集与并集：完全没有重合"),
        (cs("4 4", "1 2 3 4", "1 2 3 4"), "交集与并集：两个组一模一样"),
    ]:
        add(exercise(
            topic="algo", level=4, title=title,
            desc="输入两组数字，分别求它们的交集（都有的数）和并集（所有出现过的数，不重复）。\n"
                 "输入：第一行两个整数 n m；第二行 n 个整数；第三行 m 个整数。\n"
                 "输出：四行，依次是「交集：x 个」、交集里的数字、"
                 "「并集：y 个」、并集里的数字。",
            hint="交集用 x in b 判断，并集则把两个列表接起来一起遍历，没见过的才加进去。"
                 "注意别把重复的数字算两次。",
            answer=set_ops, cases=[lines], tags=["集合思想", "去重"]))

    # ---- 96. 爬楼梯 ----
    climb_code = (
        'n = int(input())\n'
        'a, b = 1, 1\n'
        'for i in range(n):\n'
        '    a, b = b, a + b\n'
        'print(a)\n'
    )
    for n, title in [
        (5, "爬楼梯：5 级台阶有几种走法"),
        (10, "爬楼梯：10 级台阶的走法数"),
        (1, "爬楼梯：只有 1 级台阶"),
    ]:
        add(exercise(
            topic="algo", level=4, title=title,
            desc=f"一段楼梯有 n 级，每次可以跨 1 级或者 2 级，问走到顶一共有多少种不同的走法。\n"
                 f"输入：一行，一个正整数 n（本题 n = {n}）。\n输出：一行，一个整数，表示走法的总数。",
            hint="想一想最后一步：它可能从第 n-1 级跨上来，也可能从第 n-2 级跨上来，"
                 "所以走法数就是前两级之和——又是斐波那契！",
            answer=climb_code, cases=[cs(n)], tags=["递推", "斐波那契"]))

    # ---- 97. 约瑟夫环 ----
    josephus = (
        'n, k = map(int, input().split())\n'
        'people = list(range(1, n + 1))\n'
        'i = 0\n'
        'while len(people) > 1:\n'
        '    i = (i + k - 1) % len(people)\n'
        '    people.pop(i)\n'
        'print(people[0])\n'
    )
    for lines, title in [
        (cs("10 3"), "报数出列：10 个人数到 3 出列"),
        (cs("5 2"), "报数出列：5 个人数到 2 出列"),
    ]:
        add(exercise(
            topic="algo", level=4, title=title,
            desc="n 个人围成一圈，从 1 号开始报数，报到 k 的人出圈，然后下一个人重新从 1 报数，"
                 "直到只剩一个人。请问最后留下的是几号？\n"
                 "输入：一行两个整数 n k。\n输出：一行，一个整数，表示最后剩下的人的编号。",
            hint="用列表模拟圆圈：people = list(range(1, n + 1))，"
                 "出圈位置是 (i + k - 1) % len(people)，pop 掉它以后再从这个位置继续数。",
            answer=josephus, cases=[lines], tags=["模拟", "约瑟夫环"]))

    # ---- 98. 模拟：石头剪刀布战绩 ----
    rps_code = (
        'n = int(input())\n'
        'win = 0\n'
        'draw = 0\n'
        'lose = 0\n'
        'for i in range(n):\n'
        '    a, b = input().split()\n'
        '    if a == b:\n'
        '        draw += 1\n'
        '    elif (a == "石头" and b == "剪刀") or (a == "剪刀" and b == "布") or (a == "布" and b == "石头"):\n'
        '        win += 1\n'
        '    else:\n'
        '        lose += 1\n'
        'print(f"赢：{win} 局")\n'
        'print(f"平：{draw} 局")\n'
        'print(f"输：{lose} 局")\n'
    )
    for lines, title in [
        (cs(3, "石头 剪刀", "布 石头", "剪刀 剪刀"), "猜拳战绩：三局两胜统计"),
        (cs(4, "石头 布", "布 剪刀", "剪刀 石头", "石头 石头"), "猜拳战绩：四局全记录"),
    ]:
        add(exercise(
            topic="algo", level=3, title=title,
            desc="小明和小红玩石头剪刀布，请统计战绩（小明是左边那个）。\n"
                 "输入：第一行一个整数 n，表示局数；接下来 n 行，每行两个词，"
                 "是小明和小红出的手势（石头/剪刀/布），空格隔开。\n"
                 "输出：三行，依次是「赢：x 局」「平：y 局」「输：z 局」。",
            hint="先判断平局（两人一样），再判断小明赢的三种情况（石头赢剪刀、剪刀赢布、布赢石头），"
                 "剩下的就是输了。",
            answer=rps_code, cases=[lines], tags=["模拟", "分支"]))

    # ---- 99. 模拟：超市购物小计 ----
    shopping_code = (
        'n = int(input())\n'
        'total = 0\n'
        'for i in range(n):\n'
        '    name, price, num = input().split()\n'
        '    total += int(price) * int(num)\n'
        'print(f"原价：{total} 元")\n'
        'if total >= 200:\n'
        '    print(f"打八折：{total * 8 // 10} 元")\n'
        'else:\n'
        '    print(f"没有折扣，实付：{total} 元")\n'
    )
    for lines, title in [
        (cs(3, "苹果 5 10", "牛奶 12 3", "面包 8 5"), "超市结账：满 200 打八折"),
        (cs(2, "铅笔 2 5", "橡皮 3 4"), "超市结账：金额不够打折"),
    ]:
        add(exercise(
            topic="algo", level=3, title=title,
            desc="小明去超市买东西，请帮他算钱：每样商品给出名称、单价和数量。"
                 "总价满 200 元打八折，否则不打折。\n"
                 "输入：第一行一个整数 n，表示商品种数；接下来 n 行，每行是「名称 单价 数量」，空格隔开。\n"
                 "输出：先打印「原价：x 元」；如果满 200 元，再打印「打八折：y 元」（y 取整），"
                 "否则打印「没有折扣，实付：x 元」。",
            hint="输入可能混着文字和数字，可以用 name, price, num = input().split() 一次拆成三份，"
                 "再用 int() 把后两个转成整数。八折就是乘 8 再整除 10。",
            answer=shopping_code, cases=[lines], tags=["模拟", "分支", "计算"]))

    # ---- 100. 找出所有不及格的分数 ----
    fail_list = (
        'n = int(input())\n'
        'a = list(map(int, input().split()))\n'
        'res = []\n'
        'for x in a:\n'
        '    if x < 60:\n'
        '        res.append(x)\n'
        'print(f"不及格人数：{len(res)}")\n'
        'print(*res)\n'
    )
    for lines, title in [
        (cs(6, "58 72 45 90 60 33"), "补考名单：谁需要再来一次"),
        (cs(5, "60 61 62 63 64"), "补考名单：一个都不用补考"),
    ]:
        add(exercise(
            topic="algo", level=3, title=title,
            desc="输入全班同学的成绩，找出所有不及格（低于 60 分）的分数。\n"
                 "输入：第一行一个整数 n；第二行 n 个整数，表示成绩，空格隔开。\n"
                 "输出：两行，第一行「不及格人数：x」，第二行是不及格的分数（原来的顺序），空格隔开；"
                 "如果没人不及格，第二行就什么也不打印。",
            hint="先收集到列表 res 里，再打印 len(res) 和 res。"
                 "空列表用 print(*[]) 打印出来就是空行，正好符合要求。",
            answer=fail_list, cases=[lines], tags=["筛选", "列表"]))

    # ---- 101. 插入到有序队伍的正确位置 ----
    insert_pos = (
        'n = int(input())\n'
        'a = list(map(int, input().split()))\n'
        'x = int(input())\n'
        'pos = n + 1\n'
        'for i in range(n):\n'
        '    if a[i] > x:\n'
        '        pos = i + 1\n'
        '        break\n'
        'print(pos)\n'
    )
    for lines, title in [
        (cs(5, "2 5 8 12 16", 7), "插队排位：7 应该站在第几个"),
        (cs(4, "10 20 30 40", 50), "插队排位：最大的数站最后"),
        (cs(4, "10 20 30 40", 1), "插队排位：最小的数站最前"),
    ]:
        add(exercise(
            topic="algo", level=3, title=title,
            desc="有一队数字已经从小到大排好，现在来了一个新数字 x，"
                 "它应该插到第几个位置才能继续保持从小到大？（位置从 1 开始编号）\n"
                 "输入：第一行一个整数 n；第二行 n 个从小到大排好的整数；第三行一个整数 x。\n"
                 "输出：一行，一个整数，表示 x 应该插入的位置。",
            hint="从左往右找第一个比 x 大的数：它的位置就是 x 该站的位置。"
                 "如果找不到（x 比谁都大），那就站到最后，位置是 n + 1。",
            answer=insert_pos, cases=[lines], tags=["查找", "顺序"]))

    # ---- 102. 数组逆序输出 ----
    reverse_list = (
        'n = int(input())\n'
        'a = list(map(int, input().split()))\n'
        'print(*a[::-1])\n'
    )
    for lines, title in [
        (cs(5, "1 2 3 4 5"), "倒着排队：把队伍从后往前打印"),
        (cs(6, "9 8 7 6 5 4"), "倒着排队：六个数反过来"),
    ]:
        add(exercise(
            topic="algo", level=2, title=title,
            desc="输入 n 个整数，请把它们倒过来输出。\n"
                 "输入：第一行一个整数 n；第二行 n 个整数，空格隔开。\n输出：一行，倒序后的数字，空格隔开。",
            hint="列表切片 a[::-1] 就是倒序后的列表；也可以用 for i in range(n - 1, -1, -1) 手动倒着走。",
            answer=reverse_list, cases=[lines], tags=["切片", "列表"]))

    # ---- 103. 数组左移 k 位 ----
    rotate_left = (
        'n, k = map(int, input().split())\n'
        'a = list(map(int, input().split()))\n'
        'k %= n\n'
        'print(*(a[k:] + a[:k]))\n'
    )
    for lines, title in [
        (cs("5 2", "1 2 3 4 5"), "循环左移：整体往左挪两格"),
        (cs("6 4", "1 2 3 4 5 6"), "循环左移：挪四格的结果"),
        (cs("4 4", "7 8 9 10"), "循环左移：挪一整圈等于没动"),
    ]:
        add(exercise(
            topic="algo", level=4, title=title,
            desc="把 n 个数字排成一圈，整体向左移动 k 个位置（移出去的从右边补回来）。\n"
                 "输入：第一行两个整数 n k；第二行 n 个整数，空格隔开。\n输出：一行，移动之后的数字序列，空格隔开。",
            hint="先做 k %= n（挪一整圈等于没动），再把列表切成两段交换位置：a[k:] + a[:k]。",
            answer=rotate_left, cases=[lines], tags=["列表切片", "模拟"]))

    # ---- 104. 找出缺失的那个数 ----
    missing_num = (
        'n = int(input())\n'
        'a = list(map(int, input().split()))\n'
        'print((n + 1) * (n + 2) // 2 - sum(a))\n'
    )
    for lines, title in [
        (cs(4, "1 2 4 5"), "找失踪的数字：1 到 5 少了谁"),
        (cs(5, "3 1 2 6 4"), "找失踪的数字：顺序乱了也能找"),
        (cs(3, "1 2 3"), "找失踪的数字：少的是最大的那个"),
    ]:
        add(exercise(
            topic="algo", level=3, title=title,
            desc="数字 1 到 n+1 中有一个数不见了，剩下的 n 个数打乱顺序给了你，请找出失踪的那个数。\n"
                 "输入：第一行一个整数 n；第二行 n 个整数，空格隔开。\n输出：一行，一个整数，表示失踪的数。",
            hint="1 到 n+1 的总和可以用公式 (n+1)*(n+2)//2 快速算出来，"
                 "再减去实际给你的数字之和，差就是失踪的那个数。",
            answer=missing_num, cases=[lines], tags=["数学技巧", "查找"]))

    # ---- 105. 只出现一次的数字（异或）----
    single_once = (
        'n = int(input())\n'
        'a = list(map(int, input().split()))\n'
        'r = 0\n'
        'for x in a:\n'
        '    r ^= x\n'
        'print(r)\n'
    )
    for lines, title in [
        (cs(7, "2 3 2 4 4 5 3"), "独一无二：找出只出现一次的数"),
        (cs(5, "9 1 9 2 2"), "独一无二：异或的魔法"),
        (cs(1, "7"), "独一无二：只有一个数"),
    ]:
        add(exercise(
            topic="algo", level=4, title=title,
            desc="一串数字里，除了一个数只出现一次，其他数都正好出现两次。请找出那个独一无二的数。\n"
                 "输入：第一行一个整数 n；第二行 n 个整数，空格隔开。\n输出：一行，一个整数，表示只出现一次的那个数。",
            hint="异或有个神奇的性质：a ^ a = 0，a ^ 0 = a。"
                 "把所有数从头异或到尾，成对的会互相抵消，剩下的就是答案。",
            answer=single_once, cases=[lines], tags=["位运算", "异或"]))

    # ---- 106. 报数游戏（逢七过）----
    clap7_code = (
        'n = int(input())\n'
        'cnt = 0\n'
        'for i in range(1, n + 1):\n'
        '    if i % 7 == 0 or "7" in str(i):\n'
        '        cnt += 1\n'
        'print(cnt)\n'
    )
    for n, title in [
        (30, "逢七过：1 到 30 要拍手几次"),
        (100, "逢七过：1 到 100 的拍手次数"),
        (6, "逢七过：还没到 7 的时候"),
    ]:
        add(exercise(
            topic="algo", level=3, title=title,
            desc=f"报数游戏规则：数字里含有 7，或者是 7 的倍数，都不能说出来，要拍一下手。"
                 f"请问从 1 报到 n，一共要拍几次手？\n"
                 f"输入：一行，一个正整数 n（本题 n = {n}）。\n输出：一行，一个整数，表示拍手的次数。",
            hint="两个条件用 or 连起来：i % 7 == 0（7 的倍数）或者 \"7\" in str(i)（数字里带 7）。"
                 "注意 70、71 这些也要算进去。",
            answer=clap7_code, cases=[cs(n)], tags=["枚举", "字符串", "计数"]))

    # ---- 107. 分糖果 ----
    share_candy = (
        'n, m = map(int, input().split())\n'
        'print(f"每人 {m // n} 颗")\n'
        'print(f"还剩 {m % n} 颗")\n'
    )
    for lines, title in [
        (cs("5 23"), "分糖果：5 个人分 23 颗糖"),
        (cs("3 9"), "分糖果：3 个人分 9 颗正好"),
        (cs("4 3"), "分糖果：糖不够分怎么办"),
    ]:
        add(exercise(
            topic="algo", level=2, title=title,
            desc="把 m 颗糖果平均分给 n 个小朋友，每人能分到几颗？还剩几颗？\n"
                 "输入：一行两个正整数 n m，分别表示人数和糖果数。\n"
                 "输出：两行，第一行「每人 x 颗」，第二行「还剩 y 颗」。",
            hint="平均分用整除 m // n，剩下的用取余 m % n。",
            answer=share_candy, cases=[lines], tags=["整除取余", "模拟"]))

    # ---- 108. 模拟：红绿灯 ----
    traffic_light = (
        't = int(input()) % 60\n'
        'if t < 30:\n'
        '    print("红灯")\n'
        'elif t < 50:\n'
        '    print("绿灯")\n'
        'else:\n'
        '    print("黄灯")\n'
    )
    for t, title in [
        (15, "红绿灯：第 15 秒是什么灯"),
        (42, "红绿灯：第 42 秒是什么灯"),
        (95, "红绿灯：第 95 秒转了一圈"),
    ]:
        add(exercise(
            topic="algo", level=3, title=title,
            desc=f"路口的信号灯每 60 秒循环一次：第 0~29 秒是红灯，第 30~49 秒是绿灯，第 50~59 秒是黄灯。"
                 f"请输入一个秒数，判断这时是什么灯。\n"
                 f"输入：一行，一个非负整数 t，表示从红灯开始计时的秒数（本题 t = {t}）。\n"
                 f"输出：一行，红灯 / 绿灯 / 黄灯 三者之一。",
            hint="先用 t = t % 60 把时间折到一个周期内，再用 if / elif / else 分三段判断。"
                 "注意判断顺序：先判断 t < 30，再判断 t < 50，剩下的就是黄灯。",
            answer=traffic_light, cases=[cs(t)], tags=["模拟", "分支", "取余"]))

    # ---- 109. 食堂打饭：前 k 个人要等多久 ----
    canteen_code = (
        'n, k = map(int, input().split())\n'
        'a = list(map(int, input().split()))\n'
        'total = 0\n'
        'for i in range(k):\n'
        '    total += a[i]\n'
        'print(total)\n'
    )
    for lines, title in [
        (cs("5 3", "4 2 6 3 5"), "食堂打饭：前 3 个人一共要多久"),
        (cs("4 4", "1 1 1 1"), "食堂打饭：四个人都打完"),
        (cs("6 1", "7 2 9 4 1 3"), "食堂打饭：第一个人要多久"),
    ]:
        add(exercise(
            topic="algo", level=3, title=title,
            desc="食堂窗口前有 n 个人排队，第 i 个人打饭需要 a[i] 秒。"
                 "请算一算前 k 个人打完饭一共需要多少秒。\n"
                 "输入：第一行两个整数 n k；第二行 n 个整数，表示每个人打饭需要的时间。\n"
                 "输出：一行，一个整数，表示总时间（秒）。",
            hint="只需要累加列表的前 k 个元素：for i in range(k): total += a[i]。",
            answer=canteen_code, cases=[lines], tags=["累加", "模拟"]))

    # ---- 110. 枚举：凑硬币的方案数 ----
    coin_ways = (
        'n = int(input())\n'
        'cnt = 0\n'
        'for a in range(n + 1):\n'
        '    for b in range(n // 2 + 1):\n'
        '        c = n - a - 2 * b\n'
        '        if c >= 0 and c % 5 == 0:\n'
        '            cnt += 1\n'
        'print(cnt)\n'
    )
    for n, title in [
        (10, "凑硬币：用 1、2、5 元凑出 10 元有几种方法"),
        (5, "凑硬币：凑出 5 元的方法数"),
        (20, "凑硬币：凑出 20 元的方法数"),
    ]:
        add(exercise(
            topic="algo", level=4, title=title,
            desc=f"用 1 元、2 元、5 元的硬币凑出 n 元，硬币数量不限，一共有多少种不同的凑法"
                 f"（只看各面额用了几枚，不考虑顺序）？\n"
                 f"输入：一行，一个正整数 n（本题 n = {n}）。\n输出：一行，一个整数，表示方案数。",
            hint="枚举 1 元硬币的枚数 a 和 2 元硬币的枚数 b，剩下的钱 n - a - 2b 必须是非负的 5 的倍数，"
                 "这样 5 元硬币的枚数就唯一确定了，方案数加 1。",
            answer=coin_ways, cases=[cs(n)], tags=["枚举", "双重循环", "计数"]))


def _algo_b(items):
    add = items.append

    # ---- 111. 滑动窗口：连续 k 个数的最大和 ----
    window_sum = (
        'n, k = map(int, input().split())\n'
        'a = list(map(int, input().split()))\n'
        's = 0\n'
        'for i in range(k):\n'
        '    s += a[i]\n'
        'best = s\n'
        'for i in range(k, n):\n'
        '    s = s + a[i] - a[i - k]\n'
        '    if s > best:\n'
        '        best = s\n'
        'print(best)\n'
    )
    for lines, title in [
        (cs("6 3", "1 4 2 9 3 5"), "滑动窗口：连续 3 个数的最大和"),
        (cs("8 2", "5 1 7 2 9 4 3 8"), "滑动窗口：连续 2 个数谁最厉害"),
        (cs("5 5", "1 2 3 4 5"), "滑动窗口：窗口就是整排数字"),
    ]:
        add(exercise(
            topic="algo", level=4, title=title,
            desc="在一串数字里找连续 k 个数，使它们的和最大，输出这个最大的和。\n"
                 "输入：第一行两个整数 n k；第二行 n 个整数，空格隔开。\n输出：一行，一个整数，表示最大的连续 k 个数之和。",
            hint="先把前 k 个加起来当作初始窗口，然后窗口每往右滑一格：加上右边进来的、"
                 "减去左边出去的（s = s + a[i] - a[i - k]），再和最大值比一比。",
            answer=window_sum, cases=[lines], tags=["滑动窗口", "优化"]))

    # ---- 112. 最长连续相同的数字 ----
    longest_run = (
        'n = int(input())\n'
        'a = list(map(int, input().split()))\n'
        'best = 1\n'
        'cur = 1\n'
        'for i in range(1, n):\n'
        '    if a[i] == a[i - 1]:\n'
        '        cur += 1\n'
        '    else:\n'
        '        cur = 1\n'
        '    if cur > best:\n'
        '        best = cur\n'
        'print(best)\n'
    )
    for lines, title in [
        (cs(10, "1 2 2 3 3 3 4 4 4 4"), "最长连号：连续相同数字最长有多长"),
        (cs(6, "5 5 1 2 2 2"), "最长连号：中间那段最长"),
        (cs(5, "1 2 3 4 5"), "最长连号：全都不一样"),
    ]:
        add(exercise(
            topic="algo", level=4, title=title,
            desc="输入 n 个整数，找出最长的「连续相同数字」的长度。\n"
                 "输入：第一行一个整数 n；第二行 n 个整数，空格隔开。\n输出：一行，一个整数，表示最长连续相同数字的个数。",
            hint="用 cur 记录当前连了几个，用 best 记录历史最长。"
                 "每走一步：和前一个相同就 cur += 1，不同就把 cur 重置为 1。",
            answer=longest_run, cases=[lines], tags=["遍历", "打擂台"]))

    # ---- 113. 相邻两数的最大差 ----
    max_gap = (
        'n = int(input())\n'
        'a = sorted(map(int, input().split()))\n'
        'best = 0\n'
        'for i in range(1, n):\n'
        '    gap = a[i] - a[i - 1]\n'
        '    if gap > best:\n'
        '        best = gap\n'
        'print(best)\n'
    )
    for lines, title in [
        (cs(6, "1 4 9 16 25 36"), "最大间隔：排好队之后谁和谁离得最远"),
        (cs(5, "10 2 8 20 30"), "最大间隔：乱序也要找出来"),
    ]:
        add(exercise(
            topic="algo", level=3, title=title,
            desc="输入 n 个整数，把它们从小到大排好后，相邻两个数之间最大的差值是多少？\n"
                 "输入：第一行一个整数 n；第二行 n 个整数，空格隔开。\n输出：一行，一个整数，表示最大的相邻差值。",
            hint="先排序，再一间一间地看邻居之间的差：a[i] - a[i - 1]，"
                 "一路打擂台留下最大的那个。",
            answer=max_gap, cases=[lines], tags=["排序", "差值"]))

    # ---- 114. 分数段统计（桶思想）----
    score_bucket = (
        'n = int(input())\n'
        'a = list(map(int, input().split()))\n'
        'low = 0\n'
        'mid = 0\n'
        'high = 0\n'
        'for x in a:\n'
        '    if x < 60:\n'
        '        low += 1\n'
        '    elif x < 85:\n'
        '        mid += 1\n'
        '    else:\n'
        '        high += 1\n'
        'print(f"不及格：{low} 人")\n'
        'print(f"良好：{mid} 人")\n'
        'print(f"优秀：{high} 人")\n'
    )
    for lines, title in [
        (cs(8, "58 72 45 90 60 33 88 95"), "分数段统计：不及格、良好、优秀各几人"),
        (cs(5, "100 99 98 97 96"), "分数段统计：全班都是学霸"),
    ]:
        add(exercise(
            topic="algo", level=3, title=title,
            desc="把成绩分成三段统计：60 分以下是不及格，60 到 84 分是良好，85 分及以上是优秀。\n"
                 "输入：第一行一个整数 n；第二行 n 个整数，表示成绩，空格隔开。\n"
                 "输出：三行，依次是「不及格：x 人」「良好：y 人」「优秀：z 人」。",
            hint="这就是「桶」的思想：准备三个计数器，每个成绩看它落进哪个桶就加 1。"
                 "注意 60 分属于良好（用 elif 就不会重复计数）。",
            answer=score_bucket, cases=[lines], tags=["统计", "分桶", "分支"]))

    # ---- 115. 模拟：电梯停靠 ----
    elevator_code = (
        'n = int(input())\n'
        'floor = 1\n'
        'total = 0\n'
        'for i in range(n):\n'
        '    target = int(input())\n'
        '    total += abs(target - floor)\n'
        '    floor = target\n'
        'print(f"总层数：{total}")\n'
        'print(f"最终停在：{floor} 层")\n'
    )
    for lines, title in [
        (cs(3, 5, 2, 8), "电梯模拟：从 1 楼出发跑三个地方"),
        (cs(4, 3, 3, 7, 1), "电梯模拟：同层也要停一下"),
    ]:
        add(exercise(
            topic="algo", level=3, title=title,
            desc="电梯一开始停在 1 楼，按顺序去 n 个楼层。请统计它一共跑了多少层（上下都算），最后停在哪一层。\n"
                 "输入：第一行一个整数 n；接下来 n 行，每行一个整数，表示要去的楼层。\n"
                 "输出：两行，第一行「总层数：x」，第二行「最终停在：y 层」。",
            hint="用 abs(target - floor) 求这一次上下的层数（不管上楼还是下楼都是正的），"
                 "累加完再把 floor 更新成目标楼层。",
            answer=elevator_code, cases=[lines], tags=["模拟", "abs"]))

    # ---- 116. 贪心：排队打水总等待时间 ----
    water_queue = (
        'n = int(input())\n'
        'a = sorted(map(int, input().split()))\n'
        'total = 0\n'
        'wait = 0\n'
        'for x in a:\n'
        '    wait += x\n'
        '    total += wait\n'
        'print(total)\n'
    )
    for lines, title in [
        (cs(4, "5 3 10 1"), "排队打水：怎样让大家的等待时间最短"),
        (cs(3, "2 2 2"), "排队打水：三个人一样快"),
    ]:
        add(exercise(
            topic="algo", level=4, title=title,
            desc="n 个人排队打水，第 i 个人接水要花 a[i] 分钟。请安排顺序，"
                 "让大家等待时间的总和最小，输出这个最小的总和（每个人的等待时间包含自己接水的时间）。\n"
                 "输入：第一行一个整数 n；第二行 n 个整数，表示每个人接水需要的分钟数。\n"
                 "输出：一行，一个整数，表示最小的等待时间总和。",
            hint="贪心策略：接水快的人先上！先从小到大排序，"
                 "然后一边累加每个人的接水时间，一边把这些时间再加进总和里。",
            answer=water_queue, cases=[lines], tags=["贪心", "排序"]))

    # ---- 117. 递归：用函数算阶乘 ----
    fact_func = (
        'def fact(n):\n'
        '    if n <= 1:\n'
        '        return 1\n'
        '    return n * fact(n - 1)\n'
        '\n'
        'n = int(input())\n'
        'print(fact(n))\n'
    )
    for n, title in [
        (6, "递归阶乘：函数自己调用自己"),
        (12, "递归阶乘：12! 有多大"),
    ]:
        add(exercise(
            topic="algo", level=4, title=title,
            desc=f"请定义一个递归函数 fact(n) 计算 n 的阶乘，然后读入 n 并输出结果。"
                 f"递归的意思是：函数在自己内部调用自己。\n"
                 f"输入：一行，一个非负整数 n（本题 n = {n}）。\n输出：一行，一个整数，表示 n! 的值。",
            hint="递归要有「出口」：n <= 1 时直接返回 1；否则返回 n * fact(n - 1)。"
                 "别忘了出口，不然会一直调用下去。",
            answer=fact_func, cases=[cs(n)], tags=["递归", "函数"]))

    # ---- 118. 汉诺塔最少步数 ----
    hanoi_code = (
        'n = int(input())\n'
        'steps = 1\n'
        'for i in range(n):\n'
        '    steps *= 2\n'
        'print(steps - 1)\n'
    )
    for n, title in [
        (3, "汉诺塔：3 个盘子最少几步"),
        (10, "汉诺塔：10 个盘子要几步"),
        (1, "汉诺塔：只有 1 个盘子"),
    ]:
        add(exercise(
            topic="algo", level=4, title=title,
            desc=f"汉诺塔游戏：把 n 个盘子从一根柱子搬到另一根柱子，一次只能搬一个，"
                 f"大盘子不能压在小盘子上。最少需要搬几步？\n"
                 f"输入：一行，一个正整数 n（本题 n = {n}）。\n输出：一行，一个整数，表示最少的步数。",
            hint="规律是 2 的 n 次方减 1。可以用循环把 1 连乘 n 次 2（steps *= 2），最后输出 steps - 1。",
            answer=hanoi_code, cases=[cs(n)], tags=["递推", "规律"]))

    # ---- 119. 二分查找变体：第一个大于等于 x 的位置 ----
    lower_bound = (
        'n, x = map(int, input().split())\n'
        'a = list(map(int, input().split()))\n'
        'lo = 0\n'
        'hi = n\n'
        'while lo < hi:\n'
        '    mid = (lo + hi) // 2\n'
        '    if a[mid] < x:\n'
        '        lo = mid + 1\n'
        '    else:\n'
        '        hi = mid\n'
        'print(lo + 1)\n'
    )
    for lines, title in [
        (cs("8 20", "2 5 8 12 16 23 38 56"), "找位置：第一个不小于 20 的数在哪"),
        (cs("6 3", "1 3 5 7 9 11"), "找位置：第一个不小于 3 的数"),
        (cs("5 100", "1 2 3 4 5"), "找位置：比所有数都大怎么办"),
    ]:
        add(exercise(
            topic="algo", level=4, title=title,
            desc="在一串从小到大排好的数字里，找出第一个「大于等于 x」的数的位置（位置从 1 开始编号）。"
                 "如果所有数都比 x 小，输出 n + 1，表示应该排在最后。\n"
                 "输入：第一行两个整数 n x；第二行 n 个从小到大排好的整数。\n输出：一行，一个整数，表示位置。",
            hint="这是二分查找的经典变形：中点小于 x 就把左边界挪到 mid + 1（答案一定在右半边），"
                 "否则把右边界挪到 mid（mid 自己还可能是答案）。循环结束时 lo 就是答案位置。",
            answer=lower_bound, cases=[lines], tags=["二分查找", "边界"]))

    # ---- 120. 差集：a 里有 b 里没有 ----
    diff_set = (
        'n, m = map(int, input().split())\n'
        'a = list(map(int, input().split()))\n'
        'b = list(map(int, input().split()))\n'
        'res = []\n'
        'for x in a:\n'
        '    if x not in b and x not in res:\n'
        '        res.append(x)\n'
        'print(len(res))\n'
        'print(*res)\n'
    )
    for lines, title in [
        (cs("6 3", "1 2 3 4 5 6", "2 4 6"), "差集：我有你没有的数字"),
        (cs("4 2", "7 8 9 10", "1 2"), "差集：完全没有重合"),
        (cs("3 3", "1 1 2", "3 4 5"), "差集：自己还有重复"),
    ]:
        add(exercise(
            topic="algo", level=3, title=title,
            desc="输入两组数字，找出「在 A 组里出现、但没有在 B 组里出现」的数字（重复的只算一次）。\n"
                 "输入：第一行两个整数 n m；第二行 n 个整数（A 组）；第三行 m 个整数（B 组）。\n"
                 "输出：两行，第一行是这样的数字有几个，第二行是这些数字，空格隔开。",
            hint="遍历 A 组：x not in b 而且 x 还没被收进结果，就把它加进去。",
            answer=diff_set, cases=[lines], tags=["集合思想", "筛选"]))

    # ---- 121. 模拟：零花钱存银行的利息 ----
    interest_code = (
        'money, rate, years = map(int, input().split())\n'
        'for i in range(years):\n'
        '    money = money + money * rate // 100\n'
        'print(money)\n'
    )
    for lines, title in [
        (cs("100 10 3"), "存钱利息：100 元存 3 年"),
        (cs("1000 5 2"), "存钱利息：1000 元存 2 年"),
        (cs("500 0 5"), "存钱利息：利率是 0 的情况"),
    ]:
        add(exercise(
            topic="algo", level=4, title=title,
            desc="把压岁钱存进银行，每年利息按「年初金额 × 利率」计算，利息也存进本金继续生利息。\n"
                 "输入：一行三个整数 money rate years，分别是本金、年利率（百分数）、年数。\n"
                 "输出：一行，一个整数，表示最后的本金总额（利息向下取整）。",
            hint="循环 years 次，每次都做 money = money + money * rate // 100。"
                 "注意要用本金更新后的值继续算下一年。",
            answer=interest_code, cases=[lines], tags=["模拟", "循环", "复利"]))

    # ---- 122. 不用 sort 的计数排序 ----
    counting_sort = (
        'n = int(input())\n'
        'a = list(map(int, input().split()))\n'
        'cnt = [0] * 10\n'
        'for x in a:\n'
        '    cnt[x] += 1\n'
        'res = []\n'
        'for d in range(10):\n'
        '    for k in range(cnt[d]):\n'
        '        res.append(d)\n'
        'print(*res)\n'
    )
    for lines, title in [
        (cs(8, "3 1 4 1 5 9 2 6"), "计数排序：不用 sort 也能排序"),
        (cs(6, "9 9 0 0 5 5"), "计数排序：有重复也能排"),
    ]:
        add(exercise(
            topic="algo", level=4, title=title,
            desc="输入 n 个 0 到 9 之间的整数，请用「计数排序」的思想把它们从小到大排好（不许用 sort）。\n"
                 "输入：第一行一个整数 n；第二行 n 个 0-9 的整数，空格隔开。\n输出：一行，排好序的数字，空格隔开。",
            hint="第一步：开一个长度 10 的计数数组，统计每个数字出现了几次。"
                 "第二步：从 0 到 9 依次把数字按出现次数放进结果列表，自然就是有序的。",
            answer=counting_sort, cases=[lines], tags=["计数排序", "桶思想"]))

    # ---- 123. 统计出现次数最多的长度 ----
    longest_word = (
        'n = int(input())\n'
        'best = ""\n'
        'for i in range(n):\n'
        '    w = input().strip()\n'
        '    if len(w) > len(best):\n'
        '        best = w\n'
        'print(f"最长的单词：{best}")\n'
        'print(f"长度：{len(best)}")\n'
    )
    for lines, title in [
        (cs(3, "cat", "elephant", "dog"), "最长单词：谁的字母最多"),
        (cs(4, "apple", "banana", "pear", "watermelon"), "最长单词：水果名字大比拼"),
    ]:
        add(exercise(
            topic="algo", level=3, title=title,
            desc="输入 n 个英文单词，找出最长的那一个（如果一样长，输出先出现的那个）。\n"
                 "输入：第一行一个整数 n；接下来 n 行，每行一个单词。\n"
                 "输出：两行，第一行「最长的单词：xxx」，第二行「长度：k」。",
            hint="打擂台的老套路，只是这次比的是 len(w)。先把 best 设成空字符串 \"\"，"
                 "这样任何单词都比它长。",
            answer=longest_word, cases=[lines], tags=["打擂台", "字符串长度"]))

    # ---- 124. 模拟：快递驿站取件排队 ----
    pickup_code = (
        'n = int(input())\n'
        'a = list(map(int, input().split()))\n'
        'total = 0\n'
        'for i in range(n):\n'
        '    total += a[i] * (n - i)\n'
        'print(total)\n'
    )
    for lines, title in [
        (cs(4, "3 2 5 1"), "快递驿站：每个人的等待时间加起来"),
        (cs(3, "1 1 1"), "快递驿站：三个人的总等待"),
    ]:
        add(exercise(
            topic="algo", level=4, title=title,
            desc="n 个人按顺序排队取快递，第 i 个人办理要 a[i] 分钟。"
                 "第 i 个人的等待时间 = 前面所有人办理时间的总和 + 自己办理的时间。"
                 "请算出所有人的等待时间总和（按给定的顺序，不重新排队）。\n"
                 "输入：第一行一个整数 n；第二行 n 个整数，表示办理时间。\n输出：一行，一个整数，表示等待时间的总和。",
            hint="第 1 个人办理的时间会被后面每个人各等一次，所以它要乘 n；"
                 "第 2 个人乘 n - 1；第 i 个人乘 n - i + 1。用循环 total += a[i] * (n - i) 就能算出来。",
            answer=pickup_code, cases=[lines], tags=["累加", "规律", "模拟"]))

    # ---- 125. 查找：数组里的最小值下标 ----
    min_index = (
        'n = int(input())\n'
        'a = list(map(int, input().split()))\n'
        'idx = 0\n'
        'for i in range(1, n):\n'
        '    if a[i] < a[idx]:\n'
        '        idx = i\n'
        'print(f"最小值的下标：{idx}")\n'
        'print(f"最小值：{a[idx]}")\n'
    )
    for lines, title in [
        (cs(6, "8 3 5 1 9 2"), "最小值下标：它排在第几个（从 0 开始）"),
        (cs(5, "4 4 4 1 4"), "最小值下标：只有一个是例外"),
    ]:
        add(exercise(
            topic="algo", level=3, title=title,
            desc="输入 n 个整数，找出最小值所在的下标（从 0 开始编号，如果有多个最小值，输出最前面的那个）。\n"
                 "输入：第一行一个整数 n；第二行 n 个整数，空格隔开。\n"
                 "输出：两行，第一行「最小值的下标：i」，第二行「最小值：x」。",
            hint="用 idx 记住当前最小值的下标（初始为 0），"
                 "后面每个数都和 a[idx] 比，严格更小才更新 idx。",
            answer=min_index, cases=[lines], tags=["打擂台", "下标"]))


# =====================================================================
# 三、file —— 文件读写
# 说明：判题时程序跑在隔离的虚拟文件系统里，文件名请照题目要求写死。
#       参考答案最后会删掉自己写的练习文件，环境始终保持干净。
# =====================================================================

def _file_answer(body, *names):
    """给文件题的参考答案加上 import os 和收尾清理。"""
    if not names:
        names = ("data.txt",)
    code = "import os\n\n" + body.rstrip("\n") + "\n\n# 练习完把文件删掉，保持环境干干净净\n"
    for name in names:
        code += 'if os.path.exists("%s"):\n    os.remove("%s")\n' % (name, name)
    return code


def _file_a(items):
    add = items.append

    # ---- 126. 写一句话再读出来 ----
    add(exercise(
        topic="file", level=3, title="文件第一课：把一句话写进 data.txt 再读出来",
        desc="请先把输入的一句话写进文件 data.txt，再把文件读出来打印。\n"
             "输入：一行文字。\n"
             "输出：一行，格式「文件里有：xxx」（xxx 是刚才写进去的那句话，不含多余空格）。",
        hint="写文件用 open(\"data.txt\", \"w\", encoding=\"utf-8\")，配合 f.write(内容)；"
             "读文件用 open(\"data.txt\", \"r\", encoding=\"utf-8\") 配合 f.read()。"
             "用 with open(...) as f 的写法，程序会自动帮你关文件。",
        answer=_file_answer(
            'line = input()\n'
            'with open("data.txt", "w", encoding="utf-8") as f:\n'
            '    f.write(line + "\\n")\n'
            'with open("data.txt", "r", encoding="utf-8") as f:\n'
            '    content = f.read()\n'
            'print("文件里有：" + content.strip())\n'
        ),
        cases=[cs("你好，Python"), cs("今天天气真好")], tags=["文件写入", "文件读取"]))

    # ---- 127. 名单写入后加序号打印 ----
    add(exercise(
        topic="file", level=3, title="值日表：把名字写进 names.txt 再编号打印",
        desc="请把 n 个名字写进文件 names.txt（每行一个），再读出来，给每行加上序号打印。\n"
             "输入：第一行一个整数 n；接下来 n 行，每行一个名字。\n"
             "输出：n 行，格式「序号. 名字」，序号从 1 开始，点和名字之间有一个空格。",
        hint="写的时候每个名字后面要补一个 \"\\n\" 才能换行。"
             "读的时候用 f.readlines() 一次读成列表，再用 for i in range(len(lines)) 编号。",
        answer=_file_answer(
            'n = int(input())\n'
            'with open("names.txt", "w", encoding="utf-8") as f:\n'
            '    for i in range(n):\n'
            '        f.write(input().strip() + "\\n")\n'
            'with open("names.txt", "r", encoding="utf-8") as f:\n'
            '    lines = f.readlines()\n'
            'for i in range(len(lines)):\n'
            '    print(f"{i + 1}. {lines[i].strip()}")\n'
        , "names.txt"),
        cases=[cs(3, "小明", "小红", "小刚"), cs(2, "阿力", "丁丁")], tags=["文件读写", "编号"]))

    # ---- 128. 追加写入 ----
    add(exercise(
        topic="file", level=3, title="日记本：先写两行，再追加一行",
        desc="请先把前两行写进文件 diary.txt，再用追加模式（\"a\"）写第三行，最后读出整个文件。\n"
             "输入：三行文字。\n"
             "输出：第一行「一共写了 3 行：」，接下来三行就是文件里的内容。",
        hint="第一次用 \"w\" 模式写前两行，第二次用 \"a\" 模式（append 追加）写第三行。"
             "如果用 \"w\" 写第三次，前面的内容会被清空哦。",
        answer=_file_answer(
            'a = input()\n'
            'b = input()\n'
            'c = input()\n'
            'with open("diary.txt", "w", encoding="utf-8") as f:\n'
            '    f.write(a + "\\n")\n'
            '    f.write(b + "\\n")\n'
            'with open("diary.txt", "a", encoding="utf-8") as f:\n'
            '    f.write(c + "\\n")\n'
            'with open("diary.txt", "r", encoding="utf-8") as f:\n'
            '    lines = f.readlines()\n'
            'print(f"一共写了 {len(lines)} 行：")\n'
            'for x in lines:\n'
            '    print(x.strip())\n'
        , "diary.txt"),
        cases=[cs("今天学了文件", "有点难但很好玩", "明天继续加油")], tags=["追加写入", "append"]))

    # ---- 129. 数字写入文件后求和 ----
    add(exercise(
        topic="file", level=4, title="成绩单：把分数写进文件再算总分",
        desc="请把 n 个分数写进文件 score.txt（每行一个），再读出来算总分。\n"
             "输入：第一行一个整数 n；第二行 n 个整数，空格隔开。\n"
             "输出：一行「总分：x」（x 是所有分数的和）。",
        hint="写文件时要把数字转成字符串 str(x) 才能 write。"
             "读文件时每行末尾有换行符，用 int(line) 转换前可以先 strip()，其实 int() 自己也能处理换行。",
        answer=_file_answer(
            'n = int(input())\n'
            'nums = list(map(int, input().split()))\n'
            'with open("score.txt", "w", encoding="utf-8") as f:\n'
            '    for x in nums:\n'
            '        f.write(str(x) + "\\n")\n'
            'total = 0\n'
            'with open("score.txt", "r", encoding="utf-8") as f:\n'
            '    for line in f:\n'
            '        total += int(line)\n'
            'print(f"总分：{total}")\n'
        , "score.txt"),
        cases=[cs(4, "88 92 75 60"), cs(5, "100 90 80 70 50")], tags=["文件读写", "累加"]))

    # ---- 130. 文件里的最高分与平均分 ----
    add(exercise(
        topic="file", level=4, title="成绩分析：从文件里读出最高分和平均分",
        desc="请把成绩写进 score.txt（每行一个），再读出来求最高分和平均分。\n"
             "输入：第一行一个整数 n；第二行 n 个整数，空格隔开。\n"
             "输出：两行，第一行「最高分：x」，第二行「平均分：y」（保留 1 位小数）。",
        hint="读出来之后可以用 f.read().split() 把整个文件切成一个个小字符串，"
             "再用列表推导式 [int(x) for x in ...] 一次转成整数列表，接着就能用 max 和 sum 了。",
        answer=_file_answer(
            'n = int(input())\n'
            'nums = list(map(int, input().split()))\n'
            'with open("score.txt", "w", encoding="utf-8") as f:\n'
            '    for x in nums:\n'
            '        f.write(str(x) + "\\n")\n'
            'with open("score.txt", "r", encoding="utf-8") as f:\n'
            '    data = [int(x) for x in f.read().split()]\n'
            'print(f"最高分：{max(data)}")\n'
            'print(f"平均分：{sum(data) / len(data):.1f}")\n'
        , "score.txt"),
        cases=[cs(4, "88 92 75 60"), cs(3, "100 59 61")], tags=["文件读取", "统计"]))

    # ---- 131. 购物清单 ----
    add(exercise(
        topic="file", level=3, title="购物清单：写进 shop.txt 再读出来报数",
        desc="请把购物清单写进 shop.txt（每行一样东西），再读出来统计有几样。\n"
             "输入：第一行一个整数 n；接下来 n 行，每行一样东西的名字。\n"
             "输出：第一行「清单一共有 n 样东西：」，第二行把所有东西用顿号「、」连起来。",
        hint="读出来之后用 readlines() 得到列表，len(列表) 就是样数；"
             "用 \"、\".join(名字列表) 可以把它们连成一行。",
        answer=_file_answer(
            'n = int(input())\n'
            'with open("shop.txt", "w", encoding="utf-8") as f:\n'
            '    for i in range(n):\n'
            '        f.write(input().strip() + "\\n")\n'
            'with open("shop.txt", "r", encoding="utf-8") as f:\n'
            '    lines = f.readlines()\n'
            'items = []\n'
            'for x in lines:\n'
            '    items.append(x.strip())\n'
            'print(f"清单一共有 {len(items)} 样东西：")\n'
            'print("、".join(items))\n'
        , "shop.txt"),
        cases=[cs(3, "苹果", "牛奶", "面包"), cs(4, "铅笔", "橡皮", "尺子", "本子")], tags=["文件读写", "统计"]))

    # ---- 132. 统计某个字出现的次数 ----
    add(exercise(
        topic="file", level=4, title="诗句统计：文件里某个字出现了几次",
        desc="请把一句诗写进 poem.txt，再读出来统计其中某个字出现了几次。\n"
             "输入：第一行一句诗；第二行一个汉字（要统计的字）。\n"
             "输出：一行，格式「「x」出现了 n 次」（x 是要统计的字，外面是中文书名号那种直角引号）。",
        hint="字符串的 count() 方法可以直接数字符：s.count(字)。"
                 "记得先 f.read() 把整个文件读成一个字符串。",
        answer=_file_answer(
            'text = input()\n'
            'key = input()\n'
            'with open("poem.txt", "w", encoding="utf-8") as f:\n'
            '    f.write(text + "\\n")\n'
            'with open("poem.txt", "r", encoding="utf-8") as f:\n'
            '    s = f.read()\n'
            'print(f"「{key}」出现了 {s.count(key)} 次")\n'
        , "poem.txt"),
        cases=[cs("春眠不觉晓处处闻啼鸟", "春"), cs("床前明月光疑是地上霜", "明")], tags=["文件读取", "字符串统计"]))

    # ---- 133. 每行有几个字 ----
    add(exercise(
        topic="file", level=3, title="单词量尺：读出文件里每个词有几个字母",
        desc="请把 n 个英文单词写进 words.txt（每行一个），再读出来报告每个单词的长度。\n"
             "输入：第一行一个整数 n；接下来 n 行，每行一个英文单词。\n"
             "输出：n 行，每行格式「单词 -> k 个字符」。",
        hint="读文件时用 for line in f 一行一行读，line.strip() 去掉换行符之后，"
             "len() 就是单词长度。",
        answer=_file_answer(
            'n = int(input())\n'
            'with open("words.txt", "w", encoding="utf-8") as f:\n'
            '    for i in range(n):\n'
            '        f.write(input().strip() + "\\n")\n'
            'with open("words.txt", "r", encoding="utf-8") as f:\n'
            '    for line in f:\n'
            '        w = line.strip()\n'
            '        print(f"{w} -> {len(w)} 个字符")\n'
        , "words.txt"),
        cases=[cs(3, "cat", "elephant", "dog")], tags=["文件读取", "len"]))

    # ---- 134. 复制文件 ----
    add(exercise(
        topic="file", level=4, title="文件备份：把一个文件的内容复制到另一个文件",
        desc="请把一句话写进 source.txt，再把它读出来写到 backup.txt，最后读出 backup.txt 打印，"
             "看看备份成功没有。\n"
             "输入：一行文字。\n输出：一行「备份内容：xxx」。",
        hint="三步走：写 source.txt → 读出来存进变量 → 用 \"w\" 模式写进 backup.txt，"
             "最后再读一次 backup.txt 打印。",
        answer=_file_answer(
            'text = input()\n'
            'with open("source.txt", "w", encoding="utf-8") as f:\n'
            '    f.write(text + "\\n")\n'
            'with open("source.txt", "r", encoding="utf-8") as f:\n'
            '    content = f.read()\n'
            'with open("backup.txt", "w", encoding="utf-8") as f:\n'
            '    f.write(content)\n'
            'with open("backup.txt", "r", encoding="utf-8") as f:\n'
            '    print("备份内容：" + f.read().strip())\n'
        , "source.txt", "backup.txt"),
        cases=[cs("重要资料要备份"), cs("Python 文件读写真有趣")], tags=["文件复制", "读写结合"]))

    # ---- 135. 行顺序倒过来 ----
    add(exercise(
        topic="file", level=4, title="倒放机：把文件的行顺序倒过来另存一份",
        desc="请把 n 行文字写进 data.txt，再倒着顺序写进 reversed.txt，最后读出 reversed.txt 打印。\n"
             "输入：第一行一个整数 n；接下来 n 行文字。\n输出：n 行，就是倒序之后的内容。",
        hint="用 readlines() 拿到行列表，倒着遍历：for i in range(len(lines) - 1, -1, -1)。"
             "注意写回去的时候每行要自带 \"\\n\"（lines 里的元素本来就带换行符，可以直接写）。",
        answer=_file_answer(
            'n = int(input())\n'
            'with open("data.txt", "w", encoding="utf-8") as f:\n'
            '    for i in range(n):\n'
            '        f.write(input().strip() + "\\n")\n'
            'with open("data.txt", "r", encoding="utf-8") as f:\n'
            '    lines = f.readlines()\n'
            'with open("reversed.txt", "w", encoding="utf-8") as f:\n'
            '    for i in range(len(lines) - 1, -1, -1):\n'
            '        f.write(lines[i])\n'
            'with open("reversed.txt", "r", encoding="utf-8") as f:\n'
            '    for line in f:\n'
            '        print(line.strip())\n'
        , "data.txt", "reversed.txt"),
        cases=[cs(3, "第一行", "第二行", "第三行"), cs(2, "开头", "结尾")], tags=["文件读写", "倒序"]))

    # ---- 136. 统计大写字母 ----
    add(exercise(
        topic="file", level=4, title="大写字母普查：文件里藏着几个大写字母",
        desc="请把一行英文写进 letters.txt，再读出来统计里面有几个大写字母。\n"
             "输入：一行英文（可能有大写也有小写）。\n输出：一行「大写字母有 n 个」。",
        hint="每个字符都有 isupper() 方法，是字母而且是大写时返回 True。"
             "用 for ch in 内容 一个个检查，是就加 1。",
        answer=_file_answer(
            'text = input()\n'
            'with open("letters.txt", "w", encoding="utf-8") as f:\n'
            '    f.write(text + "\\n")\n'
            'cnt = 0\n'
            'with open("letters.txt", "r", encoding="utf-8") as f:\n'
            '    for ch in f.read():\n'
            '        if ch.isupper():\n'
            '            cnt += 1\n'
            'print(f"大写字母有 {cnt} 个")\n'
        , "letters.txt"),
        cases=[cs("Hello Python World"), cs("abcDEF")], tags=["文件读取", "字符判断"]))

    # ---- 137. 及格人数与平均分 ----
    add(exercise(
        topic="file", level=4, title="班级档案：读文件算及格人数和平均分",
        desc="请把全班成绩写进 score.txt（每行一个），再读出来统计及格人数（60 分及以上）和平均分。\n"
             "输入：第一行一个整数 n；第二行 n 个整数，空格隔开。\n"
             "输出：两行，第一行「及格人数：x」，第二行「平均分：y」（保留 1 位小数）。",
        hint="先把文件读成整数列表，再用 for 循环数及格的人数。"
             "平均分用 sum(列表) / len(列表)，格式化保留一位小数。",
        answer=_file_answer(
            'n = int(input())\n'
            'nums = list(map(int, input().split()))\n'
            'with open("score.txt", "w", encoding="utf-8") as f:\n'
            '    for x in nums:\n'
            '        f.write(str(x) + "\\n")\n'
            'with open("score.txt", "r", encoding="utf-8") as f:\n'
            '    data = [int(x) for x in f.read().split()]\n'
            'cnt = 0\n'
            'for x in data:\n'
            '    if x >= 60:\n'
            '        cnt += 1\n'
            'print(f"及格人数：{cnt}")\n'
            'print(f"平均分：{sum(data) / len(data):.1f}")\n'
        , "score.txt"),
        cases=[cs(6, "58 72 45 90 60 33"), cs(4, "100 100 100 100")], tags=["文件读取", "统计", "格式化"]))

    # ---- 138. 最长的一行 ----
    add(exercise(
        topic="file", level=4, title="找最长的一行：从 note.txt 里挑出最长的那句话",
        desc="请把 n 行文字写进 note.txt，再读出来找出最长的那一行。\n"
             "输入：第一行一个整数 n；接下来 n 行文字。\n输出：一行「最长的一行：xxx」（如果一样长，输出先出现的那个）。",
        hint="打擂台：best 先设成空字符串 \"\"，每读一行就和它比 len()，严格更长才替换。",
        answer=_file_answer(
            'n = int(input())\n'
            'with open("note.txt", "w", encoding="utf-8") as f:\n'
            '    for i in range(n):\n'
            '        f.write(input().strip() + "\\n")\n'
            'best = ""\n'
            'with open("note.txt", "r", encoding="utf-8") as f:\n'
            '    for line in f:\n'
            '        w = line.strip()\n'
            '        if len(w) > len(best):\n'
            '            best = w\n'
            'print(f"最长的一行：{best}")\n'
        , "note.txt"),
        cases=[cs(3, "短句", "这是一句比较长的话", "中等长度的话")], tags=["文件读取", "打擂台"]))

    # ---- 139. 给每行加装饰 ----
    add(exercise(
        topic="file", level=3, title="菜单美化：给文件里的每一行加上星星边框",
        desc="请把 n 行菜名写进 menu.txt，再读出来，给每一行加上星星装饰打印。\n"
             "输入：第一行一个整数 n；接下来 n 行菜名。\n"
             "输出：第一行和最后一行各是 20 颗星（★）；中间每行格式「★ 菜名 ★」。",
        hint="如果想要每行都对齐，可以试试用 ljust() 补空格，但本题不要求对齐，"
             "照着「★ 菜名 ★」的样子拼字符串就行。",
        answer=_file_answer(
            'n = int(input())\n'
            'with open("menu.txt", "w", encoding="utf-8") as f:\n'
            '    for i in range(n):\n'
            '        f.write(input().strip() + "\\n")\n'
            'print("★" * 20)\n'
            'with open("menu.txt", "r", encoding="utf-8") as f:\n'
            '    for line in f:\n'
            '        print("★ " + line.strip() + " ★")\n'
            'print("★" * 20)\n'
        , "menu.txt"),
        cases=[cs(3, "红烧肉", "番茄炒蛋", "紫菜汤")], tags=["文件读取", "装饰输出"]))

    # ---- 140. 读出后按字典序排序 ----
    add(exercise(
        topic="file", level=4, title="名字排序：把文件里的名字按字母顺序排好",
        desc="请把 n 个名字写进 names.txt，再读出来按从小到大的顺序（字典序）排好打印。\n"
             "输入：第一行一个整数 n；接下来 n 行，每行一个名字。\n输出：n 行，排好序的名字。",
        hint="读出来的每一行都带着换行符，先 strip() 去掉，再用 sorted() 排序。"
             "sorted() 不会改动原列表，会返回排好序的新列表。",
        answer=_file_answer(
            'n = int(input())\n'
            'with open("names.txt", "w", encoding="utf-8") as f:\n'
            '    for i in range(n):\n'
            '        f.write(input().strip() + "\\n")\n'
            'with open("names.txt", "r", encoding="utf-8") as f:\n'
            '    lines = sorted(x.strip() for x in f.readlines())\n'
            'for w in lines:\n'
            '    print(w)\n'
        , "names.txt"),
        cases=[cs(4, "banana", "apple", "pear", "orange")], tags=["文件读取", "排序"]))

    # ---- 141. 统计单词个数 ----
    add(exercise(
        topic="file", level=3, title="单词计数器：数一数文件里有多少个英文单词",
        desc="请把一行英文写进 words.txt，再读出来统计一共有多少个单词（按空格分开算）。\n"
             "输入：一行英文，单词之间用空格隔开。\n输出：一行「单词个数：n」。",
        hint="字符串的 split() 不带参数时会按空白（空格、换行）自动切分，"
             "切出来的列表长度就是单词个数。",
        answer=_file_answer(
            'line = input()\n'
            'with open("words.txt", "w", encoding="utf-8") as f:\n'
            '    f.write(line + "\\n")\n'
            'with open("words.txt", "r", encoding="utf-8") as f:\n'
            '    s = f.read()\n'
            'print(f"单词个数：{len(s.split())}")\n'
        , "words.txt"),
        cases=[cs("I love Python very much"), cs("hello")], tags=["文件读取", "split"]))

    # ---- 142. 覆盖写入 ----
    add(exercise(
        topic="file", level=3, title="橡皮擦模式：用 w 覆盖写入会擦掉旧内容",
        desc="请先往 data.txt 写第一行文字，再用 \"w\" 模式写第二行文字（注意体会覆盖的效果），"
             "最后读出来打印文件里现在是什么。\n"
             "输入：两行文字。\n输出：一行「现在文件里是：xxx」（xxx 是第二行文字）。",
        hint="\"w\" 模式每次打开都会把文件清空重写，所以第二次写进去的内容会完全替换掉第一次的。"
             "想保留旧内容要用 \"a\" 追加模式。",
        answer=_file_answer(
            'old = input()\n'
            'new = input()\n'
            'with open("data.txt", "w", encoding="utf-8") as f:\n'
            '    f.write(old + "\\n")\n'
            'with open("data.txt", "w", encoding="utf-8") as f:\n'
            '    f.write(new + "\\n")\n'
            'with open("data.txt", "r", encoding="utf-8") as f:\n'
            '    print("现在文件里是：" + f.read().strip())\n'
        ),
        cases=[cs("旧的内容", "新的内容")], tags=["覆盖写入", "w 模式"]))


def _file_b(items):
    add = items.append

    # ---- 143. 追加结束标记并读出全文 ----
    add(exercise(
        topic="file", level=3, title="结尾盖章：用追加模式补上一行结束语",
        desc="请把 n 行内容写进 data.txt，再用追加模式在文件末尾补上一行「--- 完 ---」，最后读出全文。\n"
             "输入：第一行一个整数 n；接下来 n 行文字。\n输出：n + 1 行：原来的 n 行，最后一行是 --- 完 ---。",
        hint="追加模式是 \"a\"，它不会清空原内容，只在末尾接着写。"
             "写完再切回 \"r\" 模式读出来。",
        answer=_file_answer(
            'n = int(input())\n'
            'with open("data.txt", "w", encoding="utf-8") as f:\n'
            '    for i in range(n):\n'
            '        f.write(input().strip() + "\\n")\n'
            'with open("data.txt", "a", encoding="utf-8") as f:\n'
            '    f.write("--- 完 ---\\n")\n'
            'with open("data.txt", "r", encoding="utf-8") as f:\n'
            '    for line in f:\n'
            '        print(line.strip())\n'
        ),
        cases=[cs(2, "第一件事", "第二件事"), cs(1, "只有一件事")], tags=["追加写入", "a 模式"]))

    # ---- 144. 文件里的奇偶统计 ----
    add(exercise(
        topic="file", level=3, title="奇偶分队：把数字写进文件再统计奇偶",
        desc="请把 n 个整数写进 nums.txt（每行一个），再读出来统计奇数和偶数各有几个。\n"
             "输入：第一行一个整数 n；第二行 n 个整数，空格隔开。\n"
             "输出：两行，第一行「奇数：x 个」，第二行「偶数：y 个」。",
        hint="读出来之后逐个判断 x % 2 是不是 0：是偶数，否则是奇数。"
             "数字每行一个，可以用 int(line) 直接转换。",
        answer=_file_answer(
            'n = int(input())\n'
            'nums = list(map(int, input().split()))\n'
            'with open("nums.txt", "w", encoding="utf-8") as f:\n'
            '    for x in nums:\n'
            '        f.write(str(x) + "\\n")\n'
            'odd = 0\n'
            'even = 0\n'
            'with open("nums.txt", "r", encoding="utf-8") as f:\n'
            '    for line in f:\n'
            '        if int(line) % 2 == 0:\n'
            '            even += 1\n'
            '        else:\n'
            '            odd += 1\n'
            'print(f"奇数：{odd} 个")\n'
            'print(f"偶数：{even} 个")\n'
        , "nums.txt"),
        cases=[cs(6, "3 8 1 4 7 10"), cs(5, "2 4 6 8 10")], tags=["文件读取", "分支", "统计"]))

    # ---- 145. 数字翻倍后写入新文件 ----
    add(exercise(
        topic="file", level=4, title="翻倍工厂：读出数字乘 2 再写进新文件",
        desc="请把 n 个整数写进 data.txt，读出来每个数都乘 2，把结果写进 double.txt（每行一个），"
             "最后读出 double.txt 打印。\n"
             "输入：第一行一个整数 n；第二行 n 个整数，空格隔开。\n输出：n 行，每行一个翻倍后的数字。",
        hint="读出来的字符串要转成 int 才能算，算完再转回 str 写进新文件。"
             "别忘了新文件也要用 with open(..., \"w\") 打开。",
        answer=_file_answer(
            'n = int(input())\n'
            'nums = list(map(int, input().split()))\n'
            'with open("data.txt", "w", encoding="utf-8") as f:\n'
            '    for x in nums:\n'
            '        f.write(str(x) + "\\n")\n'
            'with open("data.txt", "r", encoding="utf-8") as f:\n'
            '    data = [int(x) for x in f.read().split()]\n'
            'with open("double.txt", "w", encoding="utf-8") as f:\n'
            '    for x in data:\n'
            '        f.write(str(x * 2) + "\\n")\n'
            'with open("double.txt", "r", encoding="utf-8") as f:\n'
            '    for line in f:\n'
            '        print(line.strip())\n'
        , "data.txt", "double.txt"),
        cases=[cs(4, "1 2 3 4"), cs(3, "10 20 30")], tags=["文件读写", "转换"]))

    # ---- 146. 行数与总字符数 ----
    add(exercise(
        topic="file", level=4, title="体检报告：数一数文件有几行、一共几个字符",
        desc="请把 n 行文字写进 data.txt，再读出来统计文件里一共有多少行、多少个字符（不算换行符）。\n"
             "输入：第一行一个整数 n；接下来 n 行文字。\n"
             "输出：两行，第一行「行数：x」，第二行「总字符数：y」。",
        hint="readlines() 得到的列表长度就是行数。字符数要把每行的 strip() 结果用 len() 量一量，再累加起来。",
        answer=_file_answer(
            'n = int(input())\n'
            'with open("data.txt", "w", encoding="utf-8") as f:\n'
            '    for i in range(n):\n'
            '        f.write(input().strip() + "\\n")\n'
            'with open("data.txt", "r", encoding="utf-8") as f:\n'
            '    lines = f.readlines()\n'
            'total = 0\n'
            'for line in lines:\n'
            '    total += len(line.strip())\n'
            'print(f"行数：{len(lines)}")\n'
            'print(f"总字符数：{total}")\n'
        ),
        cases=[cs(3, "abc", "de", "f"), cs(2, "Python", "好玩")], tags=["文件读取", "统计"]))

    # ---- 147. 小账本 ----
    add(exercise(
        topic="file", level=4, title="小账本：读文件逐条报账并算合计",
        desc="请把 n 笔开销写进 money.txt，每行格式是「名称 金额」，再读出来逐条打印并算合计。\n"
             "输入：第一行一个整数 n；接下来 n 行，每行一个名称和一个整数金额，空格隔开。\n"
             "输出：n 行「名称：金额 元」，最后一行「合计：总金额 元」。",
        hint="每一行用 line.split() 拆成两部分，[0] 是名称、[1] 是金额（记得 int() 转一下）。"
             "一边打印一边把钱累加到 total 里。",
        answer=_file_answer(
            'n = int(input())\n'
            'with open("money.txt", "w", encoding="utf-8") as f:\n'
            '    for i in range(n):\n'
            '        item, price = input().split()\n'
            '        f.write(item + " " + price + "\\n")\n'
            'total = 0\n'
            'with open("money.txt", "r", encoding="utf-8") as f:\n'
            '    for line in f:\n'
            '        parts = line.split()\n'
            '        print(f"{parts[0]}：{parts[1]} 元")\n'
            '        total += int(parts[1])\n'
            'print(f"合计：{total} 元")\n'
        , "money.txt"),
        cases=[cs(3, "早餐 8", "午餐 15", "文具 12"), cs(2, "车费 5", "零食 6")], tags=["文件读取", "split", "累加"]))

    # ---- 148. 同一句话写 n 遍 ----
    add(exercise(
        topic="file", level=3, title="抄写罚站：把一句话在文件里写 5 遍",
        desc="请把输入的一句话写进 data.txt，重复 n 遍（每行一遍），再读出来打印并报告行数。\n"
             "输入：第一行一句话；第二行一个整数 n。\n"
             "输出：第一行「一共 n 行：」，接下来 n 行是这句话。",
        hint="在外面套一个 for i in range(n) 循环，循环里 f.write(line + \"\\n\") 就行。",
        answer=_file_answer(
            'line = input()\n'
            'n = int(input())\n'
            'with open("data.txt", "w", encoding="utf-8") as f:\n'
            '    for i in range(n):\n'
            '        f.write(line + "\\n")\n'
            'with open("data.txt", "r", encoding="utf-8") as f:\n'
            '    lines = f.readlines()\n'
            'print(f"一共 {len(lines)} 行：")\n'
            'for x in lines:\n'
            '    print(x.strip())\n'
        ),
        cases=[cs("我要认真学 Python", 3), cs("加油", 5)], tags=["文件写入", "循环"]))

    # ---- 149. 交换两行的顺序 ----
    add(exercise(
        topic="file", level=3, title="交换位置：把文件里的两行调个头",
        desc="请把两行文字写进 data.txt，读出后交换顺序写回文件，最后再读出来打印。\n"
             "输入：两行文字。\n输出：两行，顺序和输入相反。",
        hint="读出来放在列表里，交换就是 lines[0], lines[1] = lines[1], lines[0]，"
             "然后再用 \"w\" 模式写回去。",
        answer=_file_answer(
            'a = input()\n'
            'b = input()\n'
            'with open("data.txt", "w", encoding="utf-8") as f:\n'
            '    f.write(a + "\\n")\n'
            '    f.write(b + "\\n")\n'
            'with open("data.txt", "r", encoding="utf-8") as f:\n'
            '    lines = f.readlines()\n'
            'lines[0], lines[1] = lines[1], lines[0]\n'
            'with open("data.txt", "w", encoding="utf-8") as f:\n'
            '    for x in lines:\n'
            '        f.write(x)\n'
            'with open("data.txt", "r", encoding="utf-8") as f:\n'
            '    for x in f:\n'
            '        print(x.strip())\n'
        ),
        cases=[cs("上面这一行", "下面这一行")], tags=["文件读写", "交换"]))

    # ---- 150. 统计元音字母 ----
    add(exercise(
        topic="file", level=4, title="元音搜查：文件里有多少个 a e i o u",
        desc="请把一行英文小写字母写进 letters.txt，再读出来统计其中元音字母（a、e、i、o、u）的个数"
             "（大小写都算）。\n"
             "输入：一行英文。\n输出：一行「元音字母有 n 个」。",
        hint="把要统计的字母放进字符串 \"aeiouAEIOU\"，再用 in 判断每个字符在不在里面。",
        answer=_file_answer(
            'text = input()\n'
            'with open("letters.txt", "w", encoding="utf-8") as f:\n'
            '    f.write(text + "\\n")\n'
            'cnt = 0\n'
            'with open("letters.txt", "r", encoding="utf-8") as f:\n'
            '    for ch in f.read():\n'
            '        if ch in "aeiouAEIOU":\n'
            '            cnt += 1\n'
            'print(f"元音字母有 {cnt} 个")\n'
        , "letters.txt"),
        cases=[cs("hello world"), cs("PYTHON IS FUN"), cs("xyz")], tags=["文件读取", "字符统计"]))

    # ---- 151. 每一行倒着写 ----
    add(exercise(
        topic="file", level=4, title="镜子文件：把每一行文字倒着写进新文件",
        desc="请把 n 行文字写进 data.txt，读出后把每一行倒过来（字符顺序反转），"
             "写进 mirror.txt，最后读出 mirror.txt 打印。\n"
             "输入：第一行一个整数 n；接下来 n 行文字。\n输出：n 行，每行都是倒过来的文字。",
        hint="字符串切片 [::-1] 就能把一行文字倒过来，"
             "记得先用 strip() 去掉换行符，倒完再补上 \"\\n\" 写进新文件。",
        answer=_file_answer(
            'n = int(input())\n'
            'with open("data.txt", "w", encoding="utf-8") as f:\n'
            '    for i in range(n):\n'
            '        f.write(input().strip() + "\\n")\n'
            'with open("data.txt", "r", encoding="utf-8") as f:\n'
            '    lines = f.readlines()\n'
            'with open("mirror.txt", "w", encoding="utf-8") as f:\n'
            '    for x in lines:\n'
            '        f.write(x.strip()[::-1] + "\\n")\n'
            'with open("mirror.txt", "r", encoding="utf-8") as f:\n'
            '    for x in f:\n'
            '        print(x.strip())\n'
        , "data.txt", "mirror.txt"),
        cases=[cs(3, "abc", "hello", "12345")], tags=["文件读写", "字符串反转"]))

    # ---- 152. 文件里的最大最小值 ----
    add(exercise(
        topic="file", level=4, title="数据体检：读文件找最大最小和平均值",
        desc="请把 n 个整数写进 data.txt（每行一个），再读出来求最大值、最小值和平均值。\n"
             "输入：第一行一个整数 n；第二行 n 个整数，空格隔开。\n"
             "输出：三行，依次是「最大值：x」「最小值：y」「平均值：z」（z 保留 1 位小数）。",
        hint="读成整数列表后，最大值和最小值可以用打擂台写，也可以用 max()、min()。"
             "平均值别忘了格式化保留一位小数。",
        answer=_file_answer(
            'n = int(input())\n'
            'nums = list(map(int, input().split()))\n'
            'with open("data.txt", "w", encoding="utf-8") as f:\n'
            '    for x in nums:\n'
            '        f.write(str(x) + "\\n")\n'
            'with open("data.txt", "r", encoding="utf-8") as f:\n'
            '    data = [int(x) for x in f.read().split()]\n'
            'print(f"最大值：{max(data)}")\n'
            'print(f"最小值：{min(data)}")\n'
            'print(f"平均值：{sum(data) / len(data):.1f}")\n'
        , "data.txt"),
        cases=[cs(5, "7 3 9 1 5"), cs(4, "100 20 55 80")], tags=["文件读取", "统计"]))



# =====================================================================
# 四、turtle —— 海龟绘图（画出来的图形没法用文字比对，所以用 self_check 自评）
# =====================================================================

def _turtle(items):
    add = items.append

    def draw(title, level, desc, hint, code, tags):
        add(self_check(topic="turtle", level=level, title=title,
                       desc=desc, hint=hint, answer=code, tags=tags))

    draw("海龟第一课：画一个正方形",
         2,
         "请让海龟画一个边长为 100 的正方形（四条边一样长，每个角都是直角）。\n"
         "要求：程序运行后能看到一个完整的正方形。",
         "正方形有 4 条边，每次 forward(100) 走一条边，再 right(90) 转 90 度。"
         "想偷懒可以用 for i in range(4) 循环 4 次。",
         'import turtle\n'
         '\n'
         't = turtle.Turtle()\n'
         'for i in range(4):\n'
         '    t.forward(100)\n'
         '    t.right(90)\n'
         '\n'
         'turtle.done()\n',
         ["正方形", "循环"])

    draw("长方形画框：两条长边两条短边",
         2,
         "请画一个长 200、宽 100 的长方形。\n要求：长边和短边交替出现，四个角都是直角。",
         "长方形就是「走两步转一下」重复两次：forward(200)、right(90)、forward(100)、right(90)，"
         "再用循环重复两遍。",
         'import turtle\n'
         '\n'
         't = turtle.Turtle()\n'
         'for i in range(2):\n'
         '    t.forward(200)\n'
         '    t.right(90)\n'
         '    t.forward(100)\n'
         '    t.right(90)\n'
         '\n'
         'turtle.done()\n',
         ["长方形", "循环"])

    draw("等边三角形：60 度的魔法",
         2,
         "请画一个边长为 120 的等边三角形。\n要求：三条边一样长，海龟一共转过 360 度。",
         "画正多边形时，每次转的角度 = 360 ÷ 边数，三角形就是 right(120)。",
         'import turtle\n'
         '\n'
         't = turtle.Turtle()\n'
         'for i in range(3):\n'
         '    t.forward(120)\n'
         '    t.right(120)\n'
         '\n'
         'turtle.done()\n',
         ["三角形", "角度"])

    draw("正五边形：五角星的好兄弟",
         2,
         "请画一个边长为 100 的正五边形。\n要求：五条边一样长。",
         "正五边形每次转 360 ÷ 5 = 72 度。想一想：边数变了，循环次数和角度要怎么改？",
         'import turtle\n'
         '\n'
         't = turtle.Turtle()\n'
         'for i in range(5):\n'
         '    t.forward(100)\n'
         '    t.right(72)\n'
         '\n'
         'turtle.done()\n',
         ["正多边形", "角度"])

    draw("画一个圆：半径 80",
         2,
         "请用 circle() 画一个半径为 80 的圆。",
         "circle(80) 一句话就能画出半径 80 的圆，海龟会原地绕圈，最后回到起点。",
         'import turtle\n'
         '\n'
         't = turtle.Turtle()\n'
         't.circle(80)\n'
         '\n'
         'turtle.done()\n',
         ["圆", "circle"])

    draw("五角星：一闪一闪亮晶晶",
         3,
         "请画一个标准的五角星。\n要求：用「前进 → 转 144 度」重复 5 次的方法画出来。",
         "画五角星每次要转 144 度（不是 72 度哦）。先试着走 150 步，看看星星多大。",
         'import turtle\n'
         '\n'
         't = turtle.Turtle()\n'
         't.pencolor("gold")\n'
         't.pensize(3)\n'
         'for i in range(5):\n'
         '    t.forward(150)\n'
         '    t.right(144)\n'
         '\n'
         'turtle.done()\n',
         ["五角星", "角度"])

    draw("彩虹同心圆：一圈一圈往外长",
         3,
         "请画 6 个同心圆，半径依次是 20、40、60、80、100、120，每个圆换一种颜色。\n"
         "要求：圆心都在同一个点上（画完一个圆要回到圆心再画下一个）。",
         "画圆之前先 t.penup() 抬起笔、移动到正确位置再 t.pendown() 落笔。"
         "每画一个圆，海龟其实回到了起点，所以可以直接把半径改大接着画。",
         'import turtle\n'
         '\n'
         'colors = ["red", "orange", "yellow", "green", "blue", "purple"]\n'
         't = turtle.Turtle()\n'
         't.speed(0)\n'
         'for i in range(6):\n'
         '    t.pencolor(colors[i])\n'
         '    t.penup()\n'
         '    t.goto(0, -20 * (i + 1))\n'
         '    t.pendown()\n'
         '    t.circle(20 * (i + 1))\n'
         '\n'
         'turtle.done()\n',
         ["圆", "颜色", "循环"])

    draw("螺旋线：越走越远的小蜗牛",
         3,
         "请画一条螺旋线：从中心出发，每走一小段就转一点弯，并且每次走得更远一点。\n"
         "要求：至少转 3 圈，看起来像蚊香一样。",
         "用 for i in range(60) 循环，每次 forward(i * 2) 走得越来越远，再 right(30) 慢慢转弯。",
         'import turtle\n'
         '\n'
         't = turtle.Turtle()\n'
         't.speed(0)\n'
         'for i in range(60):\n'
         '    t.forward(i * 2)\n'
         '    t.right(30)\n'
         '\n'
         'turtle.done()\n',
         ["螺旋线", "循环"])

    draw("小房子：三角形屋顶加方形墙",
         3,
         "请画一座小房子：下面是边长 150 的正方形墙，上面是一个三角形屋顶。\n"
         "要求：屋顶正好盖在墙上面，不会歪。",
         "先画正方形（回到起点），再画屋顶。"
         "画屋顶前要想清楚海龟朝哪个方向，需要的话用 left/right 转好角度。",
         'import turtle\n'
         '\n'
         't = turtle.Turtle()\n'
         'for i in range(4):\n'
         '    t.forward(150)\n'
         '    t.right(90)\n'
         '\n'
         't.left(90)\n'
         't.forward(150)\n'
         't.right(90)\n'
         't.forward(75)\n'
         't.right(90)\n'
         't.forward(106)\n'
         't.right(90)\n'
         't.forward(106)\n'
         't.right(90)\n'
         't.forward(75)\n'
         '\n'
         'turtle.done()\n',
         ["组合图形", "房子"])

    draw("小太阳：圆脸加光芒",
         3,
         "请画一个太阳：中间是一个黄色的圆，周围有 12 条橙色的光芒线。\n"
         "要求：光芒均匀分布在圆的外面。",
         "画完圆以后海龟回到圆心，可以先 penup 移到圆外，"
         "再用 for 循环重复 12 次「画一条线 + 转 30 度」。",
         'import turtle\n'
         '\n'
         't = turtle.Turtle()\n'
         't.speed(0)\n'
         't.color("orange")\n'
         't.begin_fill()\n'
         't.circle(60)\n'
         't.end_fill()\n'
         '\n'
         't.penup()\n'
         't.goto(0, 60)\n'
         't.pendown()\n'
         'for i in range(12):\n'
         '    t.forward(40)\n'
         '    t.backward(40)\n'
         '    t.right(30)\n'
         '\n'
         'turtle.done()\n',
         ["太阳", "填充", "循环"])

    draw("一朵小花：五个花瓣",
         3,
         "请画一朵小花：5 个圆当花瓣，中间一个黄色的小圆当花心。\n"
         "要求：花瓣围成一圈，看起来像花。",
         "每个花瓣就是一个圆，画完一个就用 right(72) 转到下一个方向，"
         "重复 5 次刚刚好转一圈。",
         'import turtle\n'
         '\n'
         't = turtle.Turtle()\n'
         't.speed(0)\n'
         't.color("pink")\n'
         'for i in range(5):\n'
         '    t.circle(50)\n'
         '    t.right(72)\n'
         '\n'
         't.penup()\n'
         't.goto(0, -20)\n'
         't.pendown()\n'
         't.color("yellow")\n'
         't.begin_fill()\n'
         't.circle(20)\n'
         't.end_fill()\n'
         '\n'
         'turtle.done()\n',
         ["花", "circle", "填充"])

    draw("棋盘格：画 8×8 的黑白方格",
         4,
         "请画出 8 行 8 列的棋盘格，一共 64 个小方格，相邻方格的颜色黑白交替。\n"
         "要求：每个小方格边长 40。",
         "两层循环：外层控制行，内层控制列；每画完一个格子往前走 40，"
         "画完一行回到行首并往下移 40。颜色的规律可以用 (i + j) % 2 来判断。",
         'import turtle\n'
         '\n'
         'size = 40\n'
         't = turtle.Turtle()\n'
         't.speed(0)\n'
         'for i in range(8):\n'
         '    for j in range(8):\n'
         '        t.penup()\n'
         '        t.goto(j * size, -i * size)\n'
         '        t.pendown()\n'
         '        if (i + j) % 2 == 0:\n'
         '            t.color("black")\n'
         '        else:\n'
         '            t.color("white")\n'
         '        t.begin_fill()\n'
         '        for k in range(4):\n'
         '            t.forward(size)\n'
         '            t.right(90)\n'
         '        t.end_fill()\n'
         '\n'
         'turtle.done()\n',
         ["棋盘", "双重循环", "填充"])

    draw("楼梯：一级一级往上爬",
         3,
         "请画出 6 级楼梯：每级都是「往右走 40，再往上走 40」。\n"
         "要求：楼梯总宽度 240，总高度也是 240。",
         "循环 6 次，每次 forward(40)、left(90)、forward(40)、right(90)，"
         "这样就能一级一级往上走。",
         'import turtle\n'
         '\n'
         't = turtle.Turtle()\n'
         'for i in range(6):\n'
         '    t.forward(40)\n'
         '    t.left(90)\n'
         '    t.forward(40)\n'
         '    t.right(90)\n'
         '\n'
         'turtle.done()\n',
         ["楼梯", "循环"])

    draw("虚线：抬笔落笔画线段",
         2,
         "请画一条虚线：一共 10 段短横线，每段长 20，间隔 10。",
         "画实线用 pendown()，不画的地方用 penup() 跳过去。"
         "循环里「落笔画 20、抬笔走 10」重复 10 次。",
         'import turtle\n'
         '\n'
         't = turtle.Turtle()\n'
         'for i in range(10):\n'
         '    t.pendown()\n'
         '    t.forward(20)\n'
         '    t.penup()\n'
         '    t.forward(10)\n'
         '\n'
         'turtle.done()\n',
         ["虚线", "penup"])

    draw("笑脸：圆脸加两只眼睛和一张嘴",
         3,
         "请画一个笑脸：大大的圆脸，两只眼睛是两个小圆，嘴巴是一条弧线。\n"
         "要求：五官位置大致对称、看起来开心。",
         "眼睛可以用 penup 移过去再画小圆；嘴巴可以用 circle(60, 120) 画一段圆弧"
         "（第二个参数是画多少度）。",
         'import turtle\n'
         '\n'
         't = turtle.Turtle()\n'
         't.speed(0)\n'
         't.pensize(3)\n'
         't.circle(100)\n'
         '\n'
         'for x in (-40, 40):\n'
         '    t.penup()\n'
         '    t.goto(x, 40)\n'
         '    t.pendown()\n'
         '    t.begin_fill()\n'
         '    t.circle(10)\n'
         '    t.end_fill()\n'
         '\n'
         't.penup()\n'
         't.goto(-50, 0)\n'
         't.pendown()\n'
         't.setheading(-60)\n'
         't.circle(60, 120)\n'
         '\n'
         'turtle.done()\n',
         ["笑脸", "圆弧", "goto"])

    draw("雪花：六角形的对称图案",
         4,
         "请画一片雪花：从中心伸出 6 条「树枝」，每条树枝上再分出两根小枝。\n"
         "要求：6 条树枝均匀分布（每条之间转 60 度）。",
         "画一条树枝可以这样：penup 回到中心、setheading 对准方向、"
         "再落笔往前画一根主枝，并在两个位置各分出一根小枝。",
         'import turtle\n'
         '\n'
         't = turtle.Turtle()\n'
         't.speed(0)\n'
         'for i in range(6):\n'
         '    t.penup()\n'
         '    t.goto(0, 0)\n'
         '    t.setheading(i * 60)\n'
         '    t.pendown()\n'
         '    t.forward(100)\n'
         '    for j in (40, 70):\n'
         '        t.penup()\n'
         '        t.goto(0, 0)\n'
         '        t.setheading(i * 60)\n'
         '        t.forward(j)\n'
         '        t.pendown()\n'
         '        t.left(45)\n'
         '        t.forward(25)\n'
         '        t.backward(25)\n'
         '        t.right(45)\n'
         '\n'
         'turtle.done()\n',
         ["雪花", "对称", "setheading"])

    draw("大风车：四个叶片转起来",
         3,
         "请画一个风车：从中心伸出 4 片叶子，每片之间转 90 度。\n"
         "要求：每片叶子用两条线组成一个细长的三角形。",
         "一片叶子可以这样画：forward(100) 画长边，right(90) 再 forward(30) 画短边，"
         "然后 goto(0, 0) 回到中心，转向 90 度画下一片。",
         'import turtle\n'
         '\n'
         't = turtle.Turtle()\n'
         't.speed(0)\n'
         'for i in range(4):\n'
         '    t.penup()\n'
         '    t.goto(0, 0)\n'
         '    t.setheading(i * 90)\n'
         '    t.pendown()\n'
         '    t.forward(100)\n'
         '    t.right(90)\n'
         '    t.forward(30)\n'
         '    t.goto(0, 0)\n'
         '\n'
         'turtle.done()\n',
         ["风车", "goto"])

    draw("爱心：两个半圆加一个尖尖",
         4,
         "请画一个爱心：用圆弧拼出来，并且填充成红色。\n"
         "要求：爱心左右对称，看起来圆润。",
         "爱心可以用「左转 140 度前进、再画两段圆弧」的方法："
         "circle(-60, 200) 画一段圆弧，调好方向再画另一段，最后回到起点闭合。",
         'import turtle\n'
         '\n'
         't = turtle.Turtle()\n'
         't.speed(0)\n'
         't.color("red")\n'
         't.begin_fill()\n'
         't.left(140)\n'
         't.forward(120)\n'
         't.circle(-60, 200)\n'
         't.setheading(60)\n'
         't.circle(-60, 200)\n'
         't.forward(120)\n'
         't.end_fill()\n'
         '\n'
         'turtle.done()\n',
         ["爱心", "圆弧", "填充"])

    draw("小树：树干加三个三角形树冠",
         3,
         "请画一棵小树：下面是棕色树干（长方形），上面是绿色树冠（三个大小递减的三角形）。\n"
         "要求：三个三角形叠在一起，越往上越小。",
         "把「画三角形」写成一个循环，每画完一个就往上挪一点、并且让边长变小。"
         "可以用 penup() + goto() 快速换位置。",
         'import turtle\n'
         '\n'
         't = turtle.Turtle()\n'
         't.speed(0)\n'
         't.color("brown")\n'
         't.begin_fill()\n'
         'for i in range(2):\n'
         '    t.forward(30)\n'
         '    t.left(90)\n'
         '    t.forward(60)\n'
         '    t.left(90)\n'
         't.end_fill()\n'
         '\n'
         't.color("green")\n'
         'size = 90\n'
         'for k in range(3):\n'
         '    t.penup()\n'
         '    t.goto(-size / 2, 60 + k * 45)\n'
         '    t.pendown()\n'
         '    t.begin_fill()\n'
         '    for i in range(3):\n'
         '        t.forward(size)\n'
         '        t.left(120)\n'
         '    t.end_fill()\n'
         '    size -= 25\n'
         '\n'
         'turtle.done()\n',
         ["树", "三角形", "循环"])

    draw("数字 8：两个圆叠在一起",
         2,
         "请用两个圆画出数字 8：下面的圆大一点（半径 60），上面的圆小一点（半径 40）。",
         "画圆要用 penup/goto 把海龟放到圆的底部再画，"
         "circle(半径) 是从当前位置往左绕一圈。",
         'import turtle\n'
         '\n'
         't = turtle.Turtle()\n'
         't.pensize(4)\n'
         't.penup()\n'
         't.goto(0, -60)\n'
         't.pendown()\n'
         't.circle(60)\n'
         't.penup()\n'
         't.goto(0, 60)\n'
         't.pendown()\n'
         't.circle(40)\n'
         '\n'
         'turtle.done()\n',
         ["数字", "circle"])

    draw("彩虹色带：七种颜色排排站",
         3,
         "请画 7 条彩色横带，从下到上依次是红、橙、黄、绿、青、蓝、紫，每条宽 200、高 30。\n"
         "要求：颜色顺序和彩虹一致，看上去像一道彩虹。",
         "用 penup/goto 把海龟放到每条色带的左下角，落笔后用 "
         "begin_fill() + 走一个长方形 + end_fill() 填色。",
         'import turtle\n'
         '\n'
         'colors = ["red", "orange", "yellow", "green", "cyan", "blue", "purple"]\n'
         't = turtle.Turtle()\n'
         't.speed(0)\n'
         'for i in range(7):\n'
         '    t.penup()\n'
         '    t.goto(-100, -105 + i * 30)\n'
         '    t.pendown()\n'
         '    t.color(colors[i])\n'
         '    t.begin_fill()\n'
         '    for k in range(2):\n'
         '        t.forward(200)\n'
         '        t.left(90)\n'
         '        t.forward(30)\n'
         '        t.left(90)\n'
         '    t.end_fill()\n'
         '\n'
         'turtle.done()\n',
         ["彩虹", "颜色", "填充"])

    draw("写名字：用海龟写出自己的名字",
         3,
         "请用 turtle 的 write() 在画面中央写出自己的名字，字体大一点、颜色选自己喜欢的。\n"
         "要求：文字出现在画面中间，看得清楚。",
         "先 penup() 移到合适的位置，再 t.write(\"你的名字\", font=(\"Arial\", 40, \"bold\"))；"
         "想要居中可以加上 align=\"center\"。",
         'import turtle\n'
         '\n'
         't = turtle.Turtle()\n'
         't.hideturtle()\n'
         't.penup()\n'
         't.goto(0, 0)\n'
         't.color("blue")\n'
         't.write("我的名字", align="center", font=("Arial", 40, "bold"))\n'
         '\n'
         'turtle.done()\n',
         ["文字", "write"])

    draw("同心方框：一层套一层的正方形",
         3,
         "请画 5 个同心正方形：最外面边长 200，每往里面一个边长减少 30，颜色各不相同。\n"
         "要求：所有正方形的中心都在同一点。",
         "每画一个正方形，都把起点往左下角挪一点点，"
         "这样四个方向缩进一样多，中心就不会跑偏。",
         'import turtle\n'
         '\n'
         'colors = ["red", "orange", "green", "blue", "purple"]\n'
         't = turtle.Turtle()\n'
         't.speed(0)\n'
         'size = 200\n'
         'for i in range(5):\n'
         '    t.penup()\n'
         '    t.goto(-size / 2, -size / 2)\n'
         '    t.pendown()\n'
         '    t.color(colors[i])\n'
         '    for k in range(4):\n'
         '        t.forward(size)\n'
         '        t.left(90)\n'
         '    size -= 30\n'
         '\n'
         'turtle.done()\n',
         ["同心图形", "循环", "颜色"])

    draw("网格纸：画出 5×5 的方格纸",
         4,
         "请画一张 5 行 5 列的方格纸，每个小方格边长 50。\n"
         "要求：横线和竖线都要画满，形成完整的网格。",
         "先画 6 条横线（每条长 250），再画 6 条竖线。"
         "每条线开始前用 penup/goto 移到起点，画完记得把方向摆正。",
         'import turtle\n'
         '\n'
         't = turtle.Turtle()\n'
         't.speed(0)\n'
         'step = 50\n'
         'length = 250\n'
         'for i in range(6):\n'
         '    t.penup()\n'
         '    t.goto(0, i * step)\n'
         '    t.setheading(0)\n'
         '    t.pendown()\n'
         '    t.forward(length)\n'
         'for i in range(6):\n'
         '    t.penup()\n'
         '    t.goto(i * step, 0)\n'
         '    t.setheading(90)\n'
         '    t.pendown()\n'
         '    t.forward(length)\n'
         '\n'
         'turtle.done()\n',
         ["网格", "循环"])

    draw("操场跑道：两个直道加两个弯道",
         3,
         "请画一条操场跑道：两条平行的直道（各长 200），两头用半圆连起来。\n"
         "要求：看起来像体育课的跑道。",
         "直道用 forward(200)，弯道用 circle(50, 180)（画半圆）。"
         "画完一个弯道方向正好转过来，就能接着画下一条直道。",
         'import turtle\n'
         '\n'
         't = turtle.Turtle()\n'
         't.pensize(3)\n'
         't.forward(200)\n'
         't.circle(50, 180)\n'
         't.forward(200)\n'
         't.circle(50, 180)\n'
         '\n'
         'turtle.done()\n',
         ["跑道", "圆弧"])

    draw("星空：点缀几颗小星星",
         4,
         "请画一片夜空：黑色的背景上，散布着 5 颗大小不同的黄色五角星。\n"
         "要求：星星的位置各不相同，看起来自然。",
         "把「画一个五角星」写成一个循环，每次画之前先用 penup/goto 换一个位置，"
         "大小也换一换。想让背景变黑可以试试 turtle.bgcolor(\"black\")。",
         'import turtle\n'
         '\n'
         'turtle.bgcolor("black")\n'
         't = turtle.Turtle()\n'
         't.speed(0)\n'
         't.color("yellow")\n'
         'spots = [(-150, 80, 40), (-40, -30, 60), (60, 100, 30), (140, -60, 50), (0, 150, 25)]\n'
         'for x, y, size in spots:\n'
         '    t.penup()\n'
         '    t.goto(x, y)\n'
         '    t.setheading(0)\n'
         '    t.pendown()\n'
         '    for i in range(5):\n'
         '        t.forward(size)\n'
         '        t.right(144)\n'
         '\n'
         'turtle.done()\n',
         ["星空", "五角星", "列表"])

    draw("彩色窗花：用循环画 12 个彩色正方形",
         4,
         "请以同一个中心点画 12 个正方形，每画一个就把方向转 30 度，形成漂亮的窗花图案。\n"
         "要求：每个正方形颜色不同，看起来像万花筒。",
         "每个正方形都从同一个起点开始（penup/goto 回到起点），"
         "画完后 t.right(30) 转一点角度，再画下一个。",
         'import turtle\n'
         '\n'
         'colors = ["red", "orange", "yellow", "green", "cyan", "blue",\n'
         '          "purple", "pink", "brown", "gold", "violet", "teal"]\n'
         't = turtle.Turtle()\n'
         't.speed(0)\n'
         'for i in range(12):\n'
         '    t.penup()\n'
         '    t.goto(0, 0)\n'
         '    t.setheading(i * 30)\n'
         '    t.pendown()\n'
         '    t.color(colors[i])\n'
         '    for k in range(4):\n'
         '        t.forward(120)\n'
         '        t.right(90)\n'
         '\n'
         'turtle.done()\n',
         ["窗花", "循环", "颜色"])

    draw("七彩螺旋：边转边换颜色",
         4,
         "请画一条彩色螺旋线：一共转 36 次，每次前进一点点、右转 10 度，"
         "并且每转一次就换一种颜色。\n"
         "要求：颜色像彩虹一样循环变化。",
         "可以准备一个颜色列表，用 colors[i % len(colors)] 让颜色循环使用，"
         "这样转多少圈都不会越界。",
         'import turtle\n'
         '\n'
         'colors = ["red", "orange", "yellow", "green", "cyan", "blue", "purple"]\n'
         't = turtle.Turtle()\n'
         't.speed(0)\n'
         't.pensize(3)\n'
         'for i in range(36):\n'
         '    t.pencolor(colors[i % len(colors)])\n'
         '    t.forward(10 + i * 2)\n'
         '    t.right(10)\n'
         '\n'
         'turtle.done()\n',
         ["螺旋", "颜色循环", "取余"])

    draw("正 n 边形生成器：边数自己定",
         4,
         "请写一段程序：先让用户输入边数 n（3 到 12 之间），再画出对应的正 n 边形。\n"
         "要求：无论 n 是多少，画出来的图形都是封闭的、边长都是 100。",
         "正 n 边形每次转的角度是 360 / n。循环 n 次，每次 forward(100) 再 right(360 / n)。",
         'import turtle\n'
         '\n'
         'n = int(input("请输入边数（3 到 12）："))\n'
         't = turtle.Turtle()\n'
         'for i in range(n):\n'
         '    t.forward(100)\n'
         '    t.right(360 / n)\n'
         '\n'
         'turtle.done()\n',
         ["正多边形", "参数化", "input"])

    draw("风筝：菱形加波浪线尾巴",
         3,
         "请画一个风筝：主体是一个菱形（四条边都是 120，两个角是 60 度），"
         "下面再画一条波浪线的尾巴。\n"
         "要求：风筝看起来左右对称。",
         "菱形就是「两条边夹一个 60 度角」重复两次：forward(120)、right(60)、forward(120)、right(120)。",
         'import turtle\n'
         '\n'
         't = turtle.Turtle()\n'
         't.pensize(3)\n'
         'for i in range(2):\n'
         '    t.forward(120)\n'
         '    t.right(60)\n'
         '    t.forward(120)\n'
         '    t.right(120)\n'
         '\n'
         't.penup()\n'
         't.goto(0, -120)\n'
         't.pendown()\n'
         'for i in range(5):\n'
         '    t.circle(15, 180)\n'
         '\n'
         'turtle.done()\n',
         ["风筝", "菱形", "波浪线"])


# =====================================================================
# 五、fun —— 趣味编程（都是好玩又能练手的综合小题，结果都是确定的）
# =====================================================================

def _fun_a(items):
    add = items.append

    # ---- 153. 猜数字（固定答案版）----
    guess_number = (
        'answer = 7\n'
        'guess = int(input())\n'
        'if guess > answer:\n'
        '    print("猜大了，往小一点试试")\n'
        'elif guess < answer:\n'
        '    print("猜小了，往大一点试试")\n'
        'else:\n'
        '    print("恭喜你，猜对啦！")\n'
    )
    for g, title in [
        (5, "猜数字：小明猜了 5"),
        (10, "猜数字：小红猜了 10"),
        (7, "猜数字：这次终于猜对了"),
    ]:
        add(exercise(
            topic="fun", level=2, title=title,
            desc="电脑心里想好了一个数字（本题固定是 7），请你读入小明猜的数字，"
                 "告诉他是猜大了、猜小了还是猜对了。\n"
                 "输入：一行，一个整数，表示猜的数字。\n"
                 "输出：一行提示语：猜大了打印「猜大了，往小一点试试」，"
                 "猜小了打印「猜小了，往大一点试试」，猜对了打印「恭喜你，猜对啦！」。",
            hint="先把答案存成变量 answer = 7，再用 if / elif / else 比较三种情况。"
                 "想一想：如果先判断「猜小了」，顺序会有影响吗？",
            answer=guess_number, cases=[cs(g)], tags=["分支", "猜数字", "游戏"]))

    # ---- 154. 凯撒密码 ----
    caesar_code = (
        's = input()\n'
        'res = ""\n'
        'for ch in s:\n'
        '    if "a" <= ch <= "z":\n'
        '        res += chr((ord(ch) - ord("a") + 3) % 26 + ord("a"))\n'
        '    else:\n'
        '        res += ch\n'
        'print("密文：" + res)\n'
    )
    for s, title in [
        ("hello", "凯撒密码：把 hello 加密"),
        ("abc", "凯撒密码：abc 变成什么"),
        ("python", "凯撒密码：给 python 上锁"),
    ]:
        add(exercise(
            topic="fun", level=4, title=title,
            desc=f"凯撒密码的规则是：每个小写字母都往后移动 3 位（a 变 d、x 绕回来变 a），"
                 f"其他字符不变。请把输入的文字加密。\n"
                 f"输入：一行小写英文字母（可能夹着空格）。\n输出：一行，格式「密文：xxxx」。",
            hint="ord(字符) 得到字母的编号，chr(编号) 变回字母。"
                 "关键公式：chr((ord(ch) - ord(\"a\") + 3) % 26 + ord(\"a\"))，"
                 "% 26 是为了让 x、y、z 绕回到 a、b、c。",
            answer=caesar_code, cases=[cs(s)], tags=["密码", "字符串", "ord"]))

    # ---- 155. 数字密码本 ----
    number_code = (
        'nums = list(map(int, input().split()))\n'
        'res = ""\n'
        'for x in nums:\n'
        '    res += chr(ord("a") + x - 1)\n'
        'print("解出来是：" + res)\n'
    )
    for lines, title in [
        (cs("8 5 12 12 15"), "数字密码本：8 5 12 12 15 是什么意思"),
        (cs("16 25 20 8 15 14"), "数字密码本：解开这串数字"),
        (cs("3 15 4 5"), "数字密码本：四个数字的秘密"),
    ]:
        add(exercise(
            topic="fun", level=3, title=title,
            desc="有一种密码：1 代表 a、2 代表 b、3 代表 c……26 代表 z。"
                 "请把一串数字翻译成小写字母。\n"
                 "输入：一行，若干个 1 到 26 之间的整数，空格隔开。\n"
                 "输出：一行，格式「解出来是：xyz」。",
            hint="字母表和数字的对应关系是：chr(ord(\"a\") + x - 1)。"
                 "比如 x = 1 时得到 a，x = 26 时得到 z。",
            answer=number_code, cases=[lines], tags=["密码", "chr", "字符串"]))

    # ---- 156. 打字机效果 ----
    typewriter = (
        'import sys\n'
        'text = input()\n'
        'for ch in text:\n'
        '    sys.stdout.write(ch)\n'
        '    sys.stdout.flush()\n'
        'print()\n'
    )
    for s, title in [
        ("你好，欢迎来到 Python 世界！", "打字机效果：一个字符一个字符地打印"),
        ("Loading...", "打字机效果：英文也能慢慢打出来"),
    ]:
        add(exercise(
            topic="fun", level=3, title=title,
            desc="打字机效果就是让文字一个字符一个字符地出现。请读入一行文字，"
                 "然后用「逐个字符输出」的方式打印出来（输出结果和原文一样，但是一个字符一个字符写的）。\n"
                 "输入：一行文字。\n输出：一行，就是原文本身。",
            hint="用 for ch in text 一个个取字符，再用 sys.stdout.write(ch) 输出（它不会自动换行），"
                 "最后补一个 print() 换行。想真的有「慢慢打字」的感觉，可以在循环里加 time.sleep(0.05)，"
                 "不过为了让判题快一点，本题不加也没关系。",
            answer=typewriter, cases=[cs(s)], tags=["sys", "循环", "效果"]))

    # ---- 157. 星座判断 ----
    zodiac_code = (
        'm, d = map(int, input().split())\n'
        'days = [0, 31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]\n'
        'n = sum(days[:m]) + d\n'
        'if n >= 356 or n <= 19:\n'
        '    print("摩羯座")\n'
        'elif n <= 49:\n'
        '    print("水瓶座")\n'
        'elif n <= 79:\n'
        '    print("双鱼座")\n'
        'elif n <= 109:\n'
        '    print("白羊座")\n'
        'elif n <= 140:\n'
        '    print("金牛座")\n'
        'elif n <= 172:\n'
        '    print("双子座")\n'
        'elif n <= 203:\n'
        '    print("巨蟹座")\n'
        'elif n <= 234:\n'
        '    print("狮子座")\n'
        'elif n <= 265:\n'
        '    print("处女座")\n'
        'elif n <= 296:\n'
        '    print("天秤座")\n'
        'elif n <= 326:\n'
        '    print("天蝎座")\n'
        'else:\n'
        '    print("射手座")\n'
    )
    for lines, title in [
        (cs("8 15"), "星座查询：8 月 15 日是什么座"),
        (cs("3 21"), "星座查询：3 月 21 日的分界线"),
        (cs("12 25"), "星座查询：圣诞节出生的小可爱"),
    ]:
        add(exercise(
            topic="fun", level=4, title=title,
            desc="输入出生的月和日，查一查是什么星座。星座分界线是："
                 "1.20 水瓶、2.19 双鱼、3.21 白羊、4.20 金牛、5.21 双子、6.22 巨蟹、"
                 "7.23 狮子、8.23 处女、9.23 天秤、10.24 天蝎、11.23 射手、12.22 摩羯"
                 "（摩羯座跨年，从 12 月 22 日到 1 月 19 日）。\n"
                 "输入：一行两个整数 m d，表示月和日。\n输出：一行，星座名称，例如「狮子座」。",
            hint="一个好办法：先把「几月几日」换算成「一年中的第几天」，再用一串 if / elif 比较天数。"
                 "每个月的天数可以放在列表里，前面补一个 0 方便用月份当下标。",
            answer=zodiac_code, cases=[lines], tags=["星座", "分支", "换算"]))

    # ---- 158. 生肖判断 ----
    shengxiao_code = (
        'y = int(input())\n'
        'animals = ["猴", "鸡", "狗", "猪", "鼠", "牛", "虎", "兔", "龙", "蛇", "马", "羊"]\n'
        'print(f"{y} 年是{animals[y % 12]}年")\n'
    )
    for y, title in [
        (2024, "生肖查询：2024 年是什么年"),
        (2023, "生肖查询：2023 年是什么年"),
        (2012, "生肖查询：2012 年的龙宝宝"),
    ]:
        add(exercise(
            topic="fun", level=3, title=title,
            desc=f"十二生肖按顺序是：猴、鸡、狗、猪、鼠、牛、虎、兔、龙、蛇、马、羊（从公元 0 年轮到猴年开始）。"
                 f"请根据年份算出这一年是什么生肖年。\n"
                 f"输入：一行，一个年份 y（本题 y = {y}）。\n"
                 f"输出：一行，格式像「2024 年是龙年」这样。",
            hint="把生肖放进列表，用 y % 12 当下标取。"
                 "可以先想想 2024 年是龙年，验证一下 2024 % 12 是不是正好对应「龙」。",
            answer=shengxiao_code, cases=[cs(y)], tags=["生肖", "取余", "列表"]))

    # ---- 159. 幸运抽奖 ----
    lottery_code = (
        'n = int(input())\n'
        'names = []\n'
        'for i in range(n):\n'
        '    names.append(input().strip())\n'
        'lucky = int(input())\n'
        'print(f"中奖的是：{names[lucky % n]}")\n'
    )
    for lines, title in [
        (cs(4, "小明", "小红", "小刚", "小美", 7), "班级抽奖：幸运数字 7 花落谁家"),
        (cs(3, "阿力", "丁丁", "冬冬", 3), "班级抽奖：三个人抽一个"),
        (cs(5, "小 A", "小 B", "小 C", "小 D", "小 E", 0), "班级抽奖：幸运数字是 0"),
    ]:
        add(exercise(
            topic="fun", level=3, title=title,
            desc="班级联欢会抽奖：n 个同学站成一排，主持人报一个幸运数字 lucky，"
                 "从第 1 个同学开始数，数到 lucky 就中奖（数字很大时会一圈一圈绕回来）。\n"
                 "输入：第一行一个整数 n；接下来 n 行，每行一个名字；最后一行一个整数 lucky。\n"
                 "输出：一行，格式「中奖的是：名字」。",
            hint="「绕圈数数」在程序里就是取余：第 lucky 个数等价于下标 lucky % n。"
                 "这样不管数字多大都不会越界。",
            answer=lottery_code, cases=[lines], tags=["取余", "抽奖", "列表"]))

    # ---- 160. 小票打印 ----
    receipt_code = (
        'n = int(input())\n'
        'print("===== 小小超市 =====")\n'
        'total = 0\n'
        'for i in range(n):\n'
        '    name, price, num = input().split()\n'
        '    sub = int(price) * int(num)\n'
        '    total += sub\n'
        '    print(f"{name} x{num} = {sub} 元")\n'
        'print("--------------------")\n'
        'print(f"合计：{total} 元")\n'
        'print("谢谢惠顾，欢迎再来！")\n'
    )
    for lines, title in [
        (cs(3, "苹果 5 2", "牛奶 12 1", "面包 8 3"), "小票打印：三样东西的购物小票"),
        (cs(2, "铅笔 2 5", "本子 4 2"), "小票打印：文具店的小票"),
    ]:
        add(exercise(
            topic="fun", level=3, title=title,
            desc="请写一个收银小程序，打印一张漂亮的小票：表头、每样商品的小计、分隔线、合计和结束语。\n"
                 "输入：第一行一个整数 n，表示商品种数；接下来 n 行，每行是「名称 单价 数量」，空格隔开。\n"
                 "输出：第一行 ===== 小小超市 =====；接着每样商品一行「名称 x数量 = 小计 元」；"
                 "然后一行 20 个减号；再一行「合计：x 元」；最后一行「谢谢惠顾，欢迎再来！」。",
            hint="小计 = 单价 × 数量，一边打印一边累加到 total。"
                 "表头里的等号和分隔线直接用 \"=\" * 5 这样重复打印出来就行。",
            answer=receipt_code, cases=[lines], tags=["小票", "综合", "格式化"]))

    # ---- 161. 诗句排版 ----
    poem_frame = (
        'line = input()\n'
        'print("+" + "-" * (len(line) + 2) + "+")\n'
        'print("| " + line + " |")\n'
        'print("+" + "-" * (len(line) + 2) + "+")\n'
    )
    for s, title in [
        ("床前明月光", "诗句排版：给古诗加个相框"),
        ("春眠不觉晓", "诗句排版：五言诗排版"),
        ("海内存知己天涯若比邻", "诗句排版：长句子也要框得住"),
    ]:
        add(exercise(
            topic="fun", level=3, title=title,
            desc="请给输入的一句诗加上漂亮的相框：上下各一行加号加减号，中间是竖线和诗句。\n"
                 "输入：一行诗。\n"
                 "输出：三行，第一行和第三行格式是 +---+（长度要和诗句匹配），"
                 "第二行格式是 | 诗句 |（竖线后面有一个空格）。",
            hint="相框的宽度要跟着诗句长度走：len(line) + 2 个减号，"
                 "字符串乘数字 \"-\" * n 可以重复打印。",
            answer=poem_frame, cases=[cs(s)], tags=["字符串", "排版", "len"]))

    # ---- 162. 彩虹屁生成器 ----
    praise_code = (
        'name = input()\n'
        'print(f"{name}，你今天也太厉害了吧！")\n'
        'print(f"{name} 写的代码，连电脑看了都想鼓掌！")\n'
        'print(f"继续保持，{name} 就是未来的程序员之星！")\n'
    )
    for name, title in [
        ("小明", "彩虹屁生成器：给小明加加油"),
        ("小红", "彩虹屁生成器：夸夸小红"),
        ("未来的程序员", "彩虹屁生成器：自己夸自己"),
    ]:
        add(exercise(
            topic="fun", level=2, title=title,
            desc="写一个「彩虹屁生成器」：读入一个名字，输出三句鼓励的话。\n"
                 "输入：一行，一个名字。\n"
                 "输出：三行，第一行「名字，你今天也太厉害了吧！」，"
                 "第二行「名字 写的代码，连电脑看了都想鼓掌！」，"
                 "第三行「继续保持，名字 就是未来的程序员之星！」。",
            hint="用 f 字符串最方便：f\"{name}，你今天也太厉害了吧！\"。"
                 "注意标点符号要和题目要求一模一样。",
            answer=praise_code, cases=[cs(name)], tags=["f-string", "输出"]))

    # ---- 163. 生日幸运数字 ----
    lucky_number = (
        'y, m, d = map(int, input().split())\n'
        'n = y + m + d\n'
        'while n >= 10:\n'
        '    s = 0\n'
        '    while n > 0:\n'
        '        s += n % 10\n'
        '        n //= 10\n'
        '    n = s\n'
        'print(f"你的幸运数字是：{n}")\n'
    )
    for lines, title in [
        (cs("2014 5 20"), "生日幸运数字：2014 年 5 月 20 日"),
        (cs("2010 12 31"), "生日幸运数字：2010 年最后一天"),
        (cs("2013 1 1"), "生日幸运数字：元旦出生"),
    ]:
        add(exercise(
            topic="fun", level=4, title=title,
            desc="把出生的年、月、日加起来，再把结果的各位数字反复相加，直到剩下一位数，"
                 "这个数字就是你的幸运数字。\n"
                 "输入：一行三个整数 y m d，表示出生的年、月、日。\n"
                 "输出：一行，格式「你的幸运数字是：n」。",
            hint="先算 n = y + m + d，再用数根的老办法：while n >= 10 时不断求各位数字之和。",
            answer=lucky_number, cases=[lines], tags=["数根", "趣味", "while"]))

    # ---- 164. 九九乘法表 ----
    multiplication_table = (
        'for i in range(1, 10):\n'
        '    row = []\n'
        '    for j in range(1, i + 1):\n'
        '        row.append(f"{j}x{i}={i * j}")\n'
        '    print(" ".join(row))\n'
    )
    add(exercise(
        topic="fun", level=4, title="九九乘法表：打印左下三角的乘法口诀",
        desc="请打印九九乘法表的下三角：第 1 行只有 1x1=1，第 2 行是 1x2=2 2x2=4，"
             "一直到第 9 行。\n"
             "输入：本题没有输入。\n"
             "输出：9 行，每行里的每个算式之间用一个空格隔开，算式格式像 2x3=6。",
        hint="两层循环：外层 i 从 1 到 9 控制行，内层 j 从 1 到 i 控制这一行有几个算式。"
             "把算式的字符串收进列表，最后用 \" \".join(列表) 拼成一行。",
        answer=multiplication_table,
        cases=[""], tags=["双重循环", "乘法表", "join"]))

    # ---- 165. BMI 计算 ----
    bmi_code = (
        'h = float(input())\n'
        'w = float(input())\n'
        'bmi = w / (h * h)\n'
        'print(f"你的 BMI 是：{bmi:.1f}")\n'
        'if bmi < 18.5:\n'
        '    print("有点瘦，要多吃一点哦")\n'
        'elif bmi < 24:\n'
        '    print("很棒，继续保持！")\n'
        'else:\n'
        '    print("稍微有点重，多运动吧")\n'
    )
    for lines, title in [
        (cs(1.5, 40), "健康小助手：身高 1.5 米体重 40 千克"),
        (cs(1.6, 50), "健康小助手：身高 1.6 米体重 50 千克"),
        (cs(1.5, 60), "健康小助手：需要多运动的情况"),
    ]:
        add(exercise(
            topic="fun", level=3, title=title,
            desc="BMI（身体质量指数）= 体重 ÷ 身高的平方。请计算并给出小建议："
                 "BMI 小于 18.5 偏瘦，18.5 到 24 之间很健康，24 及以上偏重。\n"
                 "输入：第一行身高（米，可能是小数）；第二行体重（千克）。\n"
                 "输出：第一行「你的 BMI 是：x.x」（保留 1 位小数）；"
                 "第二行是建议：「有点瘦，要多吃一点哦」/「很棒，继续保持！」/「稍微有点重，多运动吧」。",
            hint="身高和体重都可能是小数，所以要用 float(input()) 读入。"
                 "身高的平方写成 h * h 或者 h ** 2。",
            answer=bmi_code, cases=[lines], tags=["计算", "分支", "浮点数"]))

    # ---- 166. 奶茶店点单 ----
    milk_tea_code = (
        'n = int(input())\n'
        'total = 0\n'
        'for i in range(n):\n'
        '    name, price, num = input().split()\n'
        '    total += int(price) * int(num)\n'
        'if total >= 30:\n'
        '    print(f"原价 {total} 元，满 30 减 5，实付 {total - 5} 元")\n'
        'else:\n'
        '    print(f"一共 {total} 元，谢谢光临！")\n'
    )
    for lines, title in [
        (cs(3, "珍珠奶茶 12 2", "柠檬水 8 1", "布丁 6 1"), "奶茶店点单：满 30 减 5"),
        (cs(1, "红豆奶茶 10 1"), "奶茶店点单：只买一杯"),
    ]:
        add(exercise(
            topic="fun", level=3, title=title,
            desc="奶茶店搞活动：总价满 30 元减 5 元。请帮店员算一算顾客要付多少钱。\n"
                 "输入：第一行一个整数 n，表示点了几种；接下来 n 行，每行「名称 单价 数量」，空格隔开。\n"
                 "输出：如果满 30 元，打印「原价 x 元，满 30 减 5，实付 y 元」；"
                 "否则打印「一共 x 元，谢谢光临！」。",
            hint="先把每种的小计加起来得到 total，再用 if total >= 30 决定怎么打印。"
                 "注意减 5 元以后的价格是 total - 5。",
            answer=milk_tea_code, cases=[lines], tags=["模拟", "计算", "分支"]))

    # ---- 167. 猜拳裁判（一局）----
    rps_judge = (
        'a = input().strip()\n'
        'b = input().strip()\n'
        'if a == b:\n'
        '    print("平局！")\n'
        'elif (a == "石头" and b == "剪刀") or (a == "剪刀" and b == "布") or (a == "布" and b == "石头"):\n'
        '    print("小明赢！")\n'
        'else:\n'
        '    print("小红赢！")\n'
    )
    for lines, title in [
        (cs("石头", "剪刀"), "猜拳裁判：石头对剪刀"),
        (cs("布", "石头"), "猜拳裁判：布对石头"),
        (cs("剪刀", "剪刀"), "猜拳裁判：两个人出的一样"),
    ]:
        add(exercise(
            topic="fun", level=3, title=title,
            desc="小明和小红玩石头剪刀布，请你当裁判，判断这一局谁赢了。\n"
                 "输入：两行，第一行是小明出的（石头/剪刀/布），第二行是小红出的。\n"
                 "输出：一行，平局打印「平局！」，小明赢打印「小明赢！」，否则打印「小红赢！」。",
            hint="先判断平局（两个人一样），再判断小明赢的三种组合，剩下的自然就是小红赢。"
                 "记得把三种赢的情况用 or 连起来。",
            answer=rps_judge, cases=[lines], tags=["分支", "游戏", "判断"]))

    # ---- 168. 心情表情包 ----
    mood_code = (
        'mood = input().strip()\n'
        'if mood == "开心":\n'
        '    print("(＾▽＾) 今天也要开开心心！")\n'
        'elif mood == "难过":\n'
        '    print("(╥_╥) 抱抱你，明天会更好")\n'
        'elif mood == "生气":\n'
        '    print("(╬ Ò﹏Ó) 深呼吸，先数到十")\n'
        'else:\n'
        '    print("(・_・) 说不清楚也没关系")\n'
    )
    for mood, title in [
        ("开心", "心情表情包：开心的时候"),
        ("难过", "心情表情包：难过的时候"),
        ("生气", "心情表情包：生气的时候"),
    ]:
        add(exercise(
            topic="fun", level=3, title=title,
            desc="写一个心情表情包程序：根据输入的心情，打印一个对应的颜文字和一句安慰或祝福。\n"
                 "输入：一行，一个词：开心 / 难过 / 生气（其他词算说不清楚）。\n"
                 "输出：一行，格式是「颜文字 空格 一句话」：\n"
                 "开心 → (＾▽＾) 今天也要开开心心！\n"
                 "难过 → (╥_╥) 抱抱你，明天会更好\n"
                 "生气 → (╬ Ò﹏Ó) 深呼吸，先数到十\n"
                 "其他 → (・_・) 说不清楚也没关系",
            hint="用 if / elif / else 依次判断。字符串比较要用 ==，而且内容要完全一样"
                 "（不能多空格），所以先 strip() 一下更保险。",
            answer=mood_code, cases=[cs(mood)], tags=["字符串比较", "分支", "趣味"]))

    # ---- 169. 成绩等级与鼓励语 ----
    grade_code = (
        'score = int(input())\n'
        'if score >= 90:\n'
        '    print("等级：A")\n'
        '    print("太棒了，你是小学霸！")\n'
        'elif score >= 80:\n'
        '    print("等级：B")\n'
        '    print("很不错，再冲一冲就是 A 了！")\n'
        'elif score >= 60:\n'
        '    print("等级：C")\n'
        '    print("及格啦，继续加油！")\n'
        'else:\n'
        '    print("等级：D")\n'
        '    print("别灰心，把错题弄懂就是进步！")\n'
    )
    for s, title in [
        (95, "成绩小管家：95 分的评语"),
        (85, "成绩小管家：85 分的评语"),
        (72, "成绩小管家：72 分的评语"),
    ]:
        add(exercise(
            topic="fun", level=3, title=title,
            desc=f"输入考试分数，输出等级和一句鼓励语。等级规则：90 分及以上 A，80~89 分 B，"
                 f"60~79 分 C，60 分以下 D。\n"
                 f"输入：一行，一个整数分数（0 到 100）。\n"
                 f"输出：两行，第一行「等级：X」，第二行是对应的鼓励语"
                 f"（A：太棒了，你是小学霸！  B：很不错，再冲一冲就是 A 了！  "
                 f"C：及格啦，继续加油！  D：别灰心，把错题弄懂就是进步！）。",
            hint="用 if / elif / else 一层层往下判断，顺序很重要：先判断 >= 90，再 >= 80……"
                 "这样就不用写 80 <= score < 90 这种复杂条件了。",
            answer=grade_code, cases=[cs(s)], tags=["分支", "评级", "鼓励"]))

    # ---- 170. 火箭发射倒计时 ----
    countdown_code = (
        'n = int(input())\n'
        'for i in range(n, 0, -1):\n'
        '    print(i)\n'
        'print("点火！发射成功！")\n'
    )
    for n, title in [
        (10, "火箭发射：从 10 秒开始倒数"),
        (3, "火箭发射：短一点的倒计时"),
    ]:
        add(exercise(
            topic="fun", level=2, title=title,
            desc=f"火箭发射前要倒计时。请输入一个整数 n，从 n 倒数到 1（每个数字占一行），"
                 f"最后打印一句「点火！发射成功！」。\n"
                 f"输入：一行，一个正整数 n（本题 n = {n}）。\n输出：n 行倒数的数字，最后一行是点火的话。",
            hint="range 也可以倒着数：range(n, 0, -1) 就是 n、n-1、…、1。"
                 "第三个参数 -1 表示每次减 1。",
            answer=countdown_code, cases=[cs(n)], tags=["range", "倒序", "趣味"]))

    # ---- 171. 谜语问答 ----
    riddle_code = (
        'ans = input().strip()\n'
        'if ans == "影子":\n'
        '    print("答对啦，你真聪明！")\n'
        'else:\n'
        '    print("再想想哦，答案是：影子")\n'
    )
    for ans, title in [
        ("影子", "猜谜语：答对的情况"),
        ("镜子", "猜谜语：答错也没关系"),
    ]:
        add(exercise(
            topic="fun", level=2, title=title,
            desc="谜语：「你走它也走，你停它也停，太阳底下跟着你，黑天它就躲起来。」"
                 "请读入小朋友的答案，判断他猜对没有（正确答案是「影子」）。\n"
                 "输入：一行，一个词，表示猜的答案。\n"
                 "输出：答对打印「答对啦，你真聪明！」，答错打印「再想想哦，答案是：影子」。",
            hint="字符串比较用 ==，判断前先 strip() 去掉多余的空格会更稳妥。",
            answer=riddle_code, cases=[cs(ans)], tags=["字符串比较", "分支", "谜语"]))

    # ---- 172. 儿童火车票 ----
    ticket_code = (
        'age = int(input())\n'
        'price = int(input())\n'
        'if age < 6:\n'
        '    print("免票，票价 0 元")\n'
        'elif age <= 12:\n'
        '    print(f"儿童票半价：{price // 2} 元")\n'
        'else:\n'
        '    print(f"全价票：{price} 元")\n'
    )
    for lines, title in [
        (cs(4, 120), "火车票：4 岁的小朋友"),
        (cs(9, 120), "火车票：9 岁买半价票"),
        (cs(15, 200), "火车票：15 岁要买全价票"),
    ]:
        add(exercise(
            topic="fun", level=3, title=title,
            desc="火车票规则：不到 6 岁免票，6 到 12 岁半价，12 岁以上全价。请帮售票员算一算。\n"
                 "输入：第一行一个整数 age（年龄）；第二行一个整数 price（全价票价格）。\n"
                 "输出：免票打印「免票，票价 0 元」；半价打印「儿童票半价：x 元」；"
                 "全价打印「全价票：x 元」。",
            hint="半价就是整除 2：price // 2。"
                 "判断顺序要从小到大，先判断 age < 6，再判断 age <= 12。",
            answer=ticket_code, cases=[lines], tags=["分支", "计算", "生活场景"]))


def _fun_b(items):
    add = items.append

    # ---- 173. 家庭作业清单 ----
    homework_code = (
        'n = int(input())\n'
        'print("今日作业清单：")\n'
        'for i in range(n):\n'
        '    print(f"[ ] {i + 1}. {input().strip()}")\n'
        'print("加油，写完就可以玩啦！")\n'
    )
    for lines, title in [
        (cs(3, "语文生字", "数学口算", "英语单词"), "作业清单：打印带勾选框的待办列表"),
        (cs(2, "练琴 30 分钟", "读课外书"), "作业清单：两件事也要列清楚"),
    ]:
        add(exercise(
            topic="fun", level=3, title=title,
            desc="请做一个作业清单打印器：把每项作业前面加上「[ ] 」和序号，做成待办清单的样子。\n"
                 "输入：第一行一个整数 n，表示作业项数；接下来 n 行，每行一项作业。\n"
                 "输出：第一行「今日作业清单：」，接着 n 行「[ ] 序号. 作业名」，最后一行「加油，写完就可以玩啦！」。",
            hint="序号是 i + 1。方括号和点号都要照抄，"
                 "可以用 f 字符串一次拼好：f\"[ ] {i + 1}. {作业名}\"。",
            answer=homework_code, cases=[lines], tags=["清单", "循环", "格式化"]))

    # ---- 174. 幸运大转盘 ----
    wheel_code = (
        'n = int(input())\n'
        'prizes = ["谢谢参与", "一支铅笔", "一块橡皮", "一本笔记本", "神秘大奖"]\n'
        'print(f"转盘停下：{prizes[n % 5]}")\n'
    )
    for n, title in [
        (7, "幸运大转盘：转到 7 号会得到什么"),
        (4, "幸运大转盘：4 号的结果"),
        (25, "幸运大转盘：数字很大就绕回来"),
    ]:
        add(exercise(
            topic="fun", level=3, title=title,
            desc=f"游乐园的转盘上有 5 个奖项，按顺序是：谢谢参与、一支铅笔、一块橡皮、一本笔记本、神秘大奖。"
                 f"输入一个数字 n，转盘停在 n % 5 对应的奖项上。\n"
                 f"输入：一行，一个非负整数 n（本题 n = {n}）。\n输出：一行，格式「转盘停下：奖品名」。",
            hint="5 个奖项的下标是 0 到 4，用 n % 5 就能把任意数字压到这个范围里。",
            answer=wheel_code, cases=[cs(n)], tags=["取余", "列表", "抽奖"]))

    # ---- 175. 星球体重 ----
    planet_code = (
        'w = float(input())\n'
        'print(f"地球：{w:.1f} 千克")\n'
        'print(f"月球：{w / 6:.2f} 千克")\n'
        'print(f"火星：{w * 0.38:.2f} 千克")\n'
    )
    for w, title in [
        (36, "星球体重：36 千克的小朋友去旅行"),
        (45.5, "星球体重：体重带小数也算得清"),
    ]:
        add(exercise(
            topic="fun", level=3, title=title,
            desc=f"同一个物体在不同星球上重量不一样：月球上只有地球的六分之一，火星上大约是地球的 0.38 倍。"
                 f"请输入地球上的体重，算出月球和火星上的体重。\n"
                 f"输入：一行，一个数 w，表示地球上的体重（千克）。\n"
                 f"输出：三行，依次是「地球：x 千克」（保留 1 位小数）、"
                 f"「月球：y 千克」「火星：z 千克」（都保留 2 位小数）。",
            hint="月球体重是 w / 6，火星体重是 w * 0.38。"
                 "保留 2 位小数用 f\"{值:.2f}\"。",
            answer=planet_code, cases=[cs(w)], tags=["计算", "浮点数", "格式化"]))

    # ---- 176. 折纸厚度 ----
    paper_code = (
        'n = int(input())\n'
        'h = 0.1\n'
        'for i in range(n):\n'
        '    h *= 2\n'
        'print(f"对折 {n} 次后厚度：{h:.1f} 毫米")\n'
    )
    for n, title in [
        (10, "折纸实验：对折 10 次有多厚"),
        (20, "折纸实验：对折 20 次惊人厚度"),
        (1, "折纸实验：只对折 1 次"),
    ]:
        add(exercise(
            topic="fun", level=3, title=title,
            desc=f"一张纸厚 0.1 毫米，每对折一次厚度就翻一倍。请问对折 n 次以后有多厚？\n"
                 f"输入：一行，一个正整数 n（本题 n = {n}）。\n"
                 f"输出：一行，格式「对折 n 次后厚度：x 毫米」（x 保留 1 位小数）。",
            hint="厚度从 0.1 开始，循环 n 次，每次乘 2（h *= 2）。"
                 "想一想：为什么对折 20 次就能超过 100 米？",
            answer=paper_code, cases=[cs(n)], tags=["循环", "倍增", "科学"]))

    # ---- 177. 金币兑换 ----
    coin_exchange = (
        'coins = int(input())\n'
        'print(f"可以兑换 {coins // 100} 个金币礼包")\n'
        'print(f"还剩 {coins % 100} 枚金币")\n'
    )
    for c, title in [
        (350, "金币兑换：350 枚金币能换什么"),
        (1000, "金币兑换：1000 枚金币的兑换结果"),
        (99, "金币兑换：还差一枚金币"),
    ]:
        add(exercise(
            topic="fun", level=2, title=title,
            desc="游戏里 100 枚金币可以兑换 1 个金币礼包。请输入金币数量，算一算能换几个礼包、还剩多少。\n"
                 "输入：一行，一个非负整数，表示金币数量。\n"
                 "输出：两行，第一行「可以兑换 x 个金币礼包」，第二行「还剩 y 枚金币」。",
            hint="能换几个用整除 //，剩下多少用取余 %。",
            answer=coin_exchange, cases=[cs(c)], tags=["整除取余", "游戏", "计算"]))

    # ---- 178. 藏头诗 ----
    acrostic_code = (
        'n = int(input())\n'
        'head = ""\n'
        'for i in range(n):\n'
        '    line = input().strip()\n'
        '    head += line[0]\n'
        'print("藏头：" + head)\n'
    )
    for lines, title in [
        (cs(4, "春光明媚", "风轻云淡", "快意人生", "乐在其中"), "藏头诗：把每行第一个字取出来"),
        (cs(3, "学而时习之", "海内存知己", "编程真有趣"), "藏头诗：三行也能藏头"),
    ]:
        add(exercise(
            topic="fun", level=3, title=title,
            desc="藏头诗的秘密藏在每一行的第一个字里。请把 n 行文字的第一个字依次取出来，拼成一句话。\n"
                 "输入：第一行一个整数 n；接下来 n 行文字。\n输出：一行，格式「藏头：xxxx」。",
            hint="字符串可以用下标取值：line[0] 就是第一个字符。"
                 "把每行的第一个字用 += 接到结果字符串后面。",
            answer=acrostic_code, cases=[lines], tags=["字符串", "下标", "趣味"]))

    # ---- 179. 单词倒着写 ----
    reverse_words = (
        'line = input().split()\n'
        'res = []\n'
        'for w in line:\n'
        '    res.append(w[::-1])\n'
        'print(" ".join(res))\n'
    )
    for s, title in [
        ("I love Python", "单词倒着写：每个单词都反过来"),
        ("hello world", "单词倒着写：经典组合"),
        ("abc de f", "单词倒着写：短单词也不放过"),
    ]:
        add(exercise(
            topic="fun", level=3, title=title,
            desc="请把一句话里的每个单词都倒过来写，单词的顺序不变。\n"
                 "输入：一行英文，单词之间用空格隔开。\n"
                 "输出：一行，每个单词都倒过来的句子，单词之间还是用空格隔开。",
            hint="先用 split() 把句子拆成单词列表，每个单词用切片 [::-1] 倒过来，"
                 "最后再用 \" \".join(列表) 拼回去。",
            answer=reverse_words, cases=[cs(s)], tags=["字符串", "切片", "split"]))

    # ---- 180. 一周日历 ----
    calendar_code = (
        'n = int(input())\n'
        'week = ["周一", "周二", "周三", "周四", "周五", "周六", "周日"]\n'
        'for i in range(n):\n'
        '    print(f"第 {i + 1} 天：{week[i % 7]}")\n'
    )
    for n, title in [
        (10, "一周日历：连着上 10 天课"),
        (7, "一周日历：刚好排满一周"),
    ]:
        add(exercise(
            topic="fun", level=3, title=title,
            desc="请打印连续 n 天的星期：从周一开始，一周七天循环。\n"
                 "输入：一行，一个正整数 n。\n"
                 "输出：n 行，格式「第 x 天：周几」，例如「第 1 天：周一」「第 8 天：周一」。",
            hint="星期放进列表，用 i % 7 当下标就能循环取到。"
                 "注意「第几天」是 i + 1，而星期下标用的是 i。",
            answer=calendar_code, cases=[cs(n)], tags=["取余", "列表", "日历"]))

    # ---- 181. 电影票选座图 ----
    seat_map = (
        'rows = int(input())\n'
        'cols = int(input())\n'
        'taken = input().split()\n'
        'print("  屏幕在这边")\n'
        'for r in range(1, rows + 1):\n'
        '    line = ""\n'
        '    for c in range(1, cols + 1):\n'
        '        if f"{r}-{c}" in taken:\n'
        '            line += "[X]"\n'
        '        else:\n'
        '            line += "[ ]"\n'
        '    print(line)\n'
    )
    for lines, title in [
        (cs(3, 4, "1-2 2-3 3-4"), "电影选座：打印座位图看看哪里空着"),
        (cs(2, 5, "2-1"), "电影选座：小影厅的座位图"),
    ]:
        add(exercise(
            topic="fun", level=4, title=title,
            desc="电影院选座系统要打印座位图：空座位显示 [ ]，已卖出的显示 [X]。\n"
                 "输入：第一行行数 rows；第二行列数 cols；第三行是已卖出的座位，"
                 "格式像 1-2 2-3（第 1 行第 2 列、第 2 行第 3 列），用空格隔开。\n"
                 "输出：第一行是「  屏幕在这边」（前面有两个空格），"
                 "接下来 rows 行，每行 cols 个座位标记，座位之间不空格，直接连在一起。",
            hint="两层循环遍历每一行每一列，用 f\"{r}-{c}\" 拼出座位号，"
                 "看它在不在已卖出的列表里。座位标记用字符串累加（line += \"[X]\"）拼成一行。",
            answer=seat_map, cases=[lines], tags=["双重循环", "列表", "模拟"]))

    # ---- 182. 密码强度判断 ----
    password_strength = (
        'pw = input()\n'
        'score = 0\n'
        'if len(pw) >= 8:\n'
        '    score += 1\n'
        'has_digit = False\n'
        'has_upper = False\n'
        'for ch in pw:\n'
        '    if ch.isdigit():\n'
        '        has_digit = True\n'
        '    if ch.isupper():\n'
        '        has_upper = True\n'
        'if has_digit:\n'
        '    score += 1\n'
        'if has_upper:\n'
        '    score += 1\n'
        'if score >= 3:\n'
        '    print("密码强度：强")\n'
        'elif score == 2:\n'
        '    print("密码强度：中")\n'
        'else:\n'
        '    print("密码强度：弱")\n'
    )
    for pw, title in [
        ("abc12345", "密码体检：abc12345 够安全吗"),
        ("Abc12345", "密码体检：有大写小写还有数字"),
        ("abc", "密码体检：太短的密码"),
    ]:
        add(exercise(
            topic="fun", level=4, title=title,
            desc="给密码打分：长度满 8 位得 1 分，含有数字得 1 分，含有大写字母得 1 分。"
                 "3 分是强密码，2 分是中等，1 分及以下算弱。\n"
                 "输入：一行，一个密码字符串。\n"
                 "输出：一行，「密码强度：强」/「密码强度：中」/「密码强度：弱」。",
            hint="准备两个布尔变量记录「有没有数字」「有没有大写字母」，"
                 "遍历每个字符时用 isdigit() 和 isupper() 判断并置为 True。"
                 "最后把三项得分加起来判断等级。",
            answer=password_strength, cases=[cs(pw)], tags=["字符串判断", "分支", "安全"]))

    # ---- 183. 天气穿衣建议 ----
    weather_code = (
        't = int(input())\n'
        'if t >= 30:\n'
        '    print("短袖短裤，记得防晒！")\n'
        'elif t >= 20:\n'
        '    print("薄外套刚刚好")\n'
        'elif t >= 10:\n'
        '    print("穿上外套，别着凉")\n'
        'else:\n'
        '    print("羽绒服安排上，注意保暖！")\n'
    )
    for t, title in [
        (33, "穿衣建议：33℃ 的大热天"),
        (22, "穿衣建议：22℃ 很舒服"),
        (15, "穿衣建议：15℃ 有点凉"),
    ]:
        add(exercise(
            topic="fun", level=3, title=title,
            desc="输入今天的气温，输出穿衣建议：30℃ 及以上短袖；20~29℃ 薄外套；"
                 "10~19℃ 穿外套；10℃ 以下要羽绒服。\n"
                 "输入：一行，一个整数 t，表示气温（摄氏度）。\n"
                 "输出：一行建议：「短袖短裤，记得防晒！」/「薄外套刚刚好」/"
                 "「穿上外套，别着凉」/「羽绒服安排上，注意保暖！」。",
            hint="判断顺序从高温往低温排，用 if / elif / else 一层层过滤，"
                 "这样每个条件只要写一个比较就够了。",
            answer=weather_code, cases=[cs(t)], tags=["分支", "生活场景", "建议"]))

    # ---- 184. 购物车满减 ----
    cart_code = (
        'total = int(input())\n'
        'if total >= 300:\n'
        '    print(f"满 300 减 60，实付 {total - 60} 元")\n'
        'elif total >= 200:\n'
        '    print(f"满 200 减 30，实付 {total - 30} 元")\n'
        'elif total >= 100:\n'
        '    print(f"满 100 减 10，实付 {total - 10} 元")\n'
        'else:\n'
        '    print(f"没有满减，实付 {total} 元")\n'
    )
    for t, title in [
        (350, "购物车满减：350 元能减多少"),
        (220, "购物车满减：220 元的订单"),
        (120, "购物车满减：刚好够 100 减 10"),
    ]:
        add(exercise(
            topic="fun", level=3, title=title,
            desc="网店满减活动：满 100 减 10，满 200 减 30，满 300 减 60（只能享受最高的一档）。"
                 "请输入购物车总价，算出实付金额。\n"
                 "输入：一行，一个整数，表示购物车总价。\n"
                 "输出：一行，格式「满 x 减 y，实付 z 元」，如果不够 100 元就打印「没有满减，实付 x 元」。",
            hint="从最高档开始判断：先看满 300 没有，再看满 200，最后看满 100。"
                 "这样自动就享受了最优惠的那一档。",
            answer=cart_code, cases=[cs(t)], tags=["分支", "计算", "生活场景"]))

    # ---- 185. 电子宠物打招呼 ----
    pet_code = (
        'name = input().strip()\n'
        'times = int(input())\n'
        'for i in range(times):\n'
        '    print(f"{name}：汪！我在呢（第 {i + 1} 次）")\n'
    )
    for lines, title in [
        (cs("豆豆", 3), "电子宠物：豆豆叫了三声"),
        (cs("旺财", 1), "电子宠物：只叫一声"),
    ]:
        add(exercise(
            topic="fun", level=2, title=title,
            desc="你养了一只电子宠物，给它取个名字，然后让它叫几声。\n"
                 "输入：第一行一个名字；第二行一个整数 times，表示叫几声。\n"
                 "输出：times 行，格式「名字：汪！我在呢（第 x 次）」。",
            hint="用 for i in range(times) 循环，次数从 1 开始数就是 i + 1。",
            answer=pet_code, cases=[lines], tags=["循环", "f-string", "趣味"]))

    # ---- 186. 数字转中文 ----
    number_chinese = (
        'n = int(input())\n'
        'cn = ["零", "一", "二", "三", "四", "五", "六", "七", "八", "九"]\n'
        'if n < 10:\n'
        '    print(cn[n])\n'
        'else:\n'
        '    res = cn[n // 10] + "十"\n'
        '    if n % 10 != 0:\n'
        '        res += cn[n % 10]\n'
        '    print(res)\n'
    )
    cn_titles = ["数字读法：把 7 读成中文", "数字读法：25 用中文怎么念", "数字读法：整十数怎么念"]
    for i, n in enumerate([7] + nums(25, 30, 5)):
        add(exercise(
            topic="fun", level=3, title=pick(cn_titles, i),
            desc="请把输入的数字（0 到 99）读成中文，例如 7 读作「七」，25 读作「二十五」，"
                 "30 读作「三十」。\n"
                 "输入：一行，一个 0 到 99 之间的整数。\n输出：一行，这个数字的中文读法。",
            hint="把「零一二三四五六七八九」放进列表当下标表。"
                 "小于 10 直接查表；大于等于 10 就先输出十位、加个「十」，"
                 "个位不是 0 时才接上后面的数字。",
            answer=number_chinese, cases=[cs(n)], tags=["列表", "分支", "中文数字"]))

    # ---- 187. 名字缩写 ----
    initials_code = (
        'n = int(input())\n'
        'res = ""\n'
        'for i in range(n):\n'
        '    w = input().strip()\n'
        '    res += w[0].upper()\n'
        'print("缩写：" + res)\n'
    )
    for lines, title in [
        (cs(3, "li", "hua", "ming"), "名字缩写：三个字的拼音缩写"),
        (cs(2, "wang", "fang"), "名字缩写：两个字的名字"),
        (cs(1, "python"), "名字缩写：一个词也能缩写"),
    ]:
        add(exercise(
            topic="fun", level=3, title=title,
            desc="请把 n 个单词的首字母取出来，变成大写，拼成一个缩写。\n"
                 "输入：第一行一个整数 n；接下来 n 行，每行一个英文单词（小写）。\n"
                 "输出：一行，格式「缩写：ABC」。",
            hint="word[0] 取首字母，.upper() 把它变成大写，再用 += 一个个接起来。",
            answer=initials_code, cases=[lines], tags=["字符串", "upper", "趣味"]))

    # ---- 188. 星星树 ----
    star_tree = (
        'n = int(input())\n'
        'for i in range(1, n + 1):\n'
        '    print(" " * (n - i) + "*" * (2 * i - 1))\n'
    )
    for n, title in [
        (5, "星星树：打印 5 层的星星塔"),
        (3, "星星树：只打印 3 层"),
    ]:
        add(exercise(
            topic="fun", level=3, title=title,
            desc="请打印一棵星星树：第 1 层 1 颗星，第 2 层 3 颗星，第 3 层 5 颗星……"
                 "每层比上一层多 2 颗，而且要居中排列。\n"
                 "输入：一行，一个正整数 n，表示层数。\n输出：n 行星星，每层都比上一层多两颗，整体居中。",
            hint="第 i 层前面要补 n - i 个空格，再打印 2 * i - 1 颗星。"
                 "字符串乘数字就能重复：\" \" * 3 是三个空格。",
            answer=star_tree, cases=[cs(n)], tags=["循环", "图案", "字符串乘法"]))

    # ---- 189. 生日报数 ----
    birthday_wish = (
        'name = input().strip()\n'
        'age = int(input())\n'
        'print(f"🎂 祝 {name} {age} 岁生日快乐！")\n'
        'for i in range(age):\n'
        '    print("🎈", end="")\n'
        'print()\n'
    )
    for lines, title in [
        (cs("小明", 3), "生日祝福：小明三岁生日"),
        (cs("小红", 5), "生日祝福：小红五岁生日"),
    ]:
        add(exercise(
            topic="fun", level=3, title=title,
            desc="请给过生日的小朋友打印祝福：第一行是祝福语，第二行按年龄打印对应数量的气球。\n"
                 "输入：第一行一个名字；第二行一个整数，表示年龄。\n"
                 "输出：第一行「🎂 祝 名字 年龄 岁生日快乐！」；"
                 "第二行是「🎈」重复年龄次（中间不换行、不加空格）。",
            hint="print 默认会换行，如果不想换行可以写 print(\"🎈\", end=\"\")，"
                 "循环结束后再单独 print() 换一次行。",
            answer=birthday_wish, cases=[lines], tags=["循环", "end", "趣味"]))

    # ---- 190. 早餐店找零 ----
    breakfast_change = (
        'need = int(input())\n'
        'paid = int(input())\n'
        'back = paid - need\n'
        'print(f"需要找零：{back} 元")\n'
        'print(f"十元纸币：{back // 10} 张")\n'
        'print(f"一元硬币：{back % 10} 枚")\n'
    )
    for lines, title in [
        (cs(7, 20), "早餐店找零：买 7 元付 20 元"),
        (cs(12, 20), "早餐店找零：买 12 元付 20 元"),
        (cs(20, 20), "早餐店找零：刚好不用找"),
    ]:
        add(exercise(
            topic="fun", level=2, title=title,
            desc="早餐店只收整钱，找零时尽量用十元纸币，剩下用一元硬币。\n"
                 "输入：第一行一个整数 need（应付金额）；第二行一个整数 paid（顾客付的钱）。\n"
                 "输出：三行，依次是「需要找零：x 元」「十元纸币：a 张」「一元硬币：b 枚」。",
            hint="找零 = paid - need；十元纸币张数用整除 // 10，剩下的一元硬币用取余 % 10。",
            answer=breakfast_change, cases=[lines], tags=["整除取余", "生活场景", "计算"]))

