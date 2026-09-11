# -*- coding: utf-8 -*-
"""题目家族 A —— GESP 一级打地基：print / input / var / calc

自查命令（只跑这一个家族）：
    python3 tools/gen_exercises.py --only a

约定：本文件里每道题的期望输出，都由 exlib.exercise() 真正运行参考答案得到，
      这里不手写任何一行答案输出。
"""

from exlib import exercise, self_check, pick, nums


# --------------------------------------------------------------- 小工具

def p(text):
    """打印一行固定文字的参考答案：print(...)，repr 会自动处理引号和反斜杠。"""
    return "print(%r)" % (text,)


def pn(*lines):
    """一次 print 打印多行：引号里写 \\n。"""
    return "print('%s')" % "\\n".join(lines)


def code(*lines):
    """把多行参考答案拼起来，读起来更像真正的代码。"""
    return "\n".join(lines)


SCENES = ["小海龟", "小花猫", "小企鹅", "小松鼠", "小熊猫", "小恐龙",
          "小蜜蜂", "小狐狸", "小雨燕", "小章鱼", "小考拉", "小浣熊"]

HINT_PRINT = [
    "用 print() 把这句话打印出来，文字要放进一对英文引号里，标点也要和题目一模一样。",
    "先在 print 后面的小括号里写一对英文引号，引号中间写要输出的句子；括号和引号都必须是英文的。",
    "把要输出的句子整句抄进英文引号里，交给 print()；感叹号、句号都不能漏。",
]


def build():
    items = []

    # ==========================================================
    # 一、print 输出打印
    # ==========================================================

    # ── P01 用 print 打印一句固定的话（最基础的输出）──────────
    for i, (title, text) in enumerate([
        ("小海龟的第一句问候", "你好，Python！"),
        ("欢迎来到少儿编程工坊", "欢迎来到少儿编程工坊！"),
        ("小猫的自我介绍", "我叫咪咪，我喜欢写代码。"),
        ("写给小小程序员的一句话", "今天也要加油呀！"),
        ("打印一个神奇的数字", "计算结果是 42。"),
        ("第一次运行成功", "我的第一个程序跑起来啦！"),
        ("清晨练习曲", "早上好，小小程序员！"),
        ("贴在铅笔盒上的话", "每天练一题，越练越厉害。"),
    ]):
        items.append(exercise(
            topic="print", level=1, title=title,
            desc="请让程序在屏幕上输出下面这一行文字，一个字、一个标点都不能差：\n%s" % text,
            hint=pick(HINT_PRINT, i),
            answer=p(text),
            cases=[""]))

    # ── P02 两次 print，输出两行 ────────────────────────────
    for title, one, two in [
        ("我的电子名片", "姓名：小宇", "年龄：11 岁"),
        ("今天的天气播报", "今天天气：晴", "最高气温：26 度"),
        ("周一的课程表", "第一节：语文", "第二节：数学"),
        ("小树苗生长日记", "第 1 天：冒出小芽", "第 2 天：长高一点点"),
        ("我的书包清单", "书包里有一个铅笔盒", "书包里还有一只水壶"),
        ("生日祝福卡", "祝小美生日快乐", "愿你天天都有好心情"),
    ]:
        items.append(exercise(
            topic="print", level=1, title=title,
            desc="请让屏幕上一共出现两行，顺序不能反：\n第一行：%s\n第二行：%s" % (one, two),
            hint="写两条 print()，一条打印一行；程序是从上往下执行的，先写的先输出。",
            answer=code(p(one), p(two)),
            cases=[""]))

    # ── P03 只写一条 print，用 \n 输出三行 ───────────────────
    for title, lines in [
        ("三行小诗：春天", ["春天来了", "花儿开了", "小鸟在唱歌"]),
        ("编程课前的小提醒", ["今天下午有编程课", "记得带上笔记本电脑", "下课前要交作业"]),
        ("数字小台阶", ["1", "2", "3"]),
        ("小蝌蚪找妈妈", ["小蝌蚪游啊游", "路上遇到了鸭妈妈", "终于找到了自己的妈妈"]),
    ]:
        items.append(exercise(
            topic="print", level=2, title=title,
            desc="请只写一条 print()，让屏幕上出现三行，内容依次是：\n%s" % "\n".join(lines),
            hint="换行符 \\n 写在引号里面，你想在哪里换行，就在哪里写 \\n。",
            answer=pn(*lines),
            cases=[""]))

    # ── P04 用逗号一次打印「文字 + 数字」─────────────────────
    for title, label, value in [
        ("记录今天的得分", "得分：", 95),
        ("记录小宇的身高", "身高：", 138),
        ("动物园门票的价格", "票价：", 25),
        ("贴纸收集册的数量", "贴纸数量：", 12),
        ("全班人数统计表", "全班人数：", 41),
    ]:
        items.append(exercise(
            topic="print", level=1, title=title,
            desc="请用一条 print()，先打印文字 %s，紧接着打印数字 %d。\n"
                 "小心：两个值中间用逗号隔开时，print 会自动补上一个空格。"
                 % (label, value),
            hint="print 的小括号里可以放好几样东西，用逗号隔开，它会依次打印出来，中间自动加空格。",
            answer="print(%r, %d)" % (label, value),
            cases=[""]))

    # ── P05 用 sep 参数把几段拼成一行 ────────────────────────
    for title, parts, sep_, shown in [
        ("用横线拼出日期", ["2026", "09", "07"], "-", "2026-09-07"),
        ("用点拼出软件版本号", ["3", "11", "2"], ".", "3.11.2"),
        ("用斜杠拼出春游日期", ["2026", "3", "15"], "/", "2026/3/15"),
        ("用短横线拼出电话号码", ["138", "0000", "1234"], "-", "138-0000-1234"),
    ]:
        items.append(exercise(
            topic="print", level=2, title=title,
            desc="请用一条 print() 把这几个值连成一行：%s。\n"
                 "要求各段之间用「%s」连接，中间不要出现空格。" % ("、".join(parts), sep_),
            hint="print 有个 sep 参数：写 sep=\"%s\"，各段之间就会用「%s」连接，也不会多出空格。"
                 % (sep_, sep_),
            answer="print(%s, sep=%r)" % (", ".join(repr(x) for x in parts), sep_),
            cases=[""]))

    # ── P06 用 end 参数让两次 print 挤在同一行 ────────────────
    items.append(exercise(
        topic="print", level=2, title="把两句问候拼成一行",
        desc="请写两条 print()，但屏幕上只能出现一行：你好，世界\n"
             "（第一条打印「你好，」，第二条打印「世界」，两段要接在一起。）",
        hint="print 打印完默认会换行，写 end=\"\" 就能让它先别换行。",
        answer=code('print("你好，", end="")', 'print("世界")'),
        cases=[""]))

    items.append(exercise(
        topic="print", level=2, title="给小海龟三个字之间加横线",
        desc="请让屏幕上出现一行：小-海-龟\n"
             "要求每打印一个字就用短横线结尾，最后一个字不带横线。",
        hint="每次 print 都写 end=\"-\"，最后一个字直接 print(…) 让它自然换行。",
        answer=code('print("小", end="-")', 'print("海", end="-")', 'print("龟")'),
        cases=[""]))

    items.append(exercise(
        topic="print", level=2, title="Python 真好玩连成一句",
        desc="请让屏幕上出现一行：Python 真好玩\n"
             "要求前半段和后半段分两次打印，中间留一个空格。",
        hint="第一条 print 打印「Python」，用 end=\" \" 结尾，就能把空格留在行末。",
        answer=code('print("Python", end=" ")', 'print("真好玩")'),
        cases=[""]))

    # ── P07 输出带英文双引号的句子（单引号套双引号）──────────
    for title, text in [
        ("老师说过的一句话", '老师说："认真练习就会进步。"'),
        ("同学课间的问题", '同学问："今天有编程课吗？"'),
        ("电脑弹出的提示", '电脑提示："保存成功！"'),
    ]:
        items.append(exercise(
            topic="print", level=2, title=title,
            desc="请输出下面这一行，句子里的英文双引号也要原样打印出来：\n%s" % text,
            hint="字符串外面用一对单引号，里面就可以直接写双引号；也可以给双引号前面加反斜杠转义。",
            answer=p(text),
            cases=[""]))

    # ── P08 输出带反斜杠的路径 ──────────────────────────────
    for title, path in [
        ("文件的保存路径", "C:\\Users\\Python\\hello.py"),
        ("游戏素材文件夹", "D:\\game\\images\\cat.png"),
    ]:
        items.append(exercise(
            topic="print", level=2, title=title,
            desc="请输出下面这一行路径（反斜杠也要打印出来）：\n%s" % path,
            hint="反斜杠在字符串里是特殊字符，想打印一个反斜杠，要连着写两个 \\\\ 。",
            answer=p(path),
            cases=[""]))

    # ── P09 用 \t 制表符做出对齐的表格 ──────────────────────
    for title, lines in [
        ("成绩单上的小表格", ["科目\t分数", "语文\t92", "数学\t95"]),
        ("水果店的价格牌", ["水果\t单价", "苹果\t5", "香蕉\t3"]),
    ]:
        items.append(exercise(
            topic="print", level=2, title=title,
            desc="请用制表符 \\t 把每一项分开，输出下面三行：\n%s" % "\n".join(lines),
            hint="在引号里写 \\t，它会在那个位置插入一个制表符（相当于按一下 Tab 键），各列就能对齐。",
            answer=pn(*lines),
            cases=[""]))

    # ── P10 中间空一行（print() 打印空行）────────────────────
    items.append(exercise(
        topic="print", level=1, title="分成两段的课程通知",
        desc="请输出三行：第一行是「上午：编程课」，第二行什么都不写（空行），第三行是「下午：自由练习」。",
        hint="什么都不放的 print() 就会输出一个空行，别丢下那对小括号。",
        answer=code(p("上午：编程课"), "print()", p("下午：自由练习")),
        cases=[""]))

    items.append(exercise(
        topic="print", level=1, title="古诗和作者分开排",
        desc="请输出三行：第一行是「床前明月光」，第二行是空行，第三行是「——李白」。",
        hint="空行靠一个空的 print() 来打印，注意是空的小括号，不是不打。",
        answer=code(p("床前明月光"), "print()", p("——李白")),
        cases=[""]))

    # ── P11 用字符串乘法打印一排符号 ────────────────────────
    for title, ch, n in [
        ("画一条十星分隔线", "*", 10),
        ("画一条二十格的等号线", "=", 20),
        ("点亮十二颗小星星", "★", 12),
        ("来一排三十二个减号", "-", 32),
    ]:
        items.append(exercise(
            topic="print", level=1, title=title,
            desc="请输出一行：%d 个连续的「%s」，中间不要有空格。" % (n, ch),
            hint="字符串也能做乘法：「\"%s\" * %d」就会得到 %d 个连续的符号，一行就搞定。"
                 % (ch, n, n),
            answer="print(%r * %d)" % (ch, n),
            cases=[""]))

    # ── P12 用 for 循环打印一座小塔 ─────────────────────────
    for title, lo, hi, step_, ch, shape in [
        ("搭一座四层星星塔", 1, 5, 1, "*", "第 1 行 1 个星号，第 2 行 2 个星号，一直到第 4 行 4 个星号"),
        ("搭一座六层等号塔", 1, 7, 1, "=", "第 1 行 1 个等号，第 2 行 2 个等号，一直到第 6 行 6 个等号"),
        ("搭一座倒过来的四层星星塔", 4, 0, -1, "*", "第 1 行 4 个星号，一行比一行少一个，最后一行 1 个星号"),
        ("搭一座五层井号塔", 1, 6, 1, "#", "第 1 行 1 个井号，第 2 行 2 个井号，一直到第 5 行 5 个井号"),
    ]:
        items.append(exercise(
            topic="print", level=2, title=title,
            desc="请输出一座小塔，共 %d 行：%s。" % (abs(hi - lo), shape),
            hint="用 for i in range(%d, %d, %d) 让 i 依次取到每层的个数，再用 print(\"%s\" * i) 打印。"
                 % (lo, hi, step_, ch),
            answer=code("for i in range(%d, %d, %d):" % (lo, hi, step_),
                        "    print(%r * i)" % ch),
            cases=[""]))

    # ── P13 print 的小括号里直接写算式 ──────────────────────
    for title, expr, shown in [
        ("打印 38 加 57 的结果", "38 + 57", "95"),
        ("打印 100 减 64 的结果", "100 - 64", "36"),
        ("打印 7 乘 8 的结果", "7 * 8", "56"),
        ("打印 45 除以 9 的结果", "45 / 9", "5.0"),
        ("打印 10 除以 4 的结果", "10 / 4", "2.5"),
    ]:
        items.append(exercise(
            topic="print", level=1, title=title,
            desc="请只输出算式 %s 的结果（屏幕上只有算出来的数，不要写别的字）。\n"
                 "这一题的结果是 %s。" % (expr, shown),
            hint="print 的小括号里可以直接写算式，Python 会先算好，再把结果打印出来。",
            answer="print(%s)" % expr,
            cases=[""]))

    # ── P14 用 f-string 把算式摆成一句话 ────────────────────
    for title, a, b in [
        ("把加法算式摆得漂漂亮亮", 3, 5),
        ("给小搭档看一道加法", 12, 30),
        ("水果店里的加法小票", 7, 8),
    ]:
        items.append(exercise(
            topic="print", level=2, title=title,
            desc="请先把 %d 存进变量 a，把 %d 存进变量 b，然后输出一行：%d + %d = %d 。\n"
                 "（格式就是「数字，空格，加号，空格，数字，空格，等号，空格，结果」）"
                 % (a, b, a, b, a + b),
            hint="f-string 写法：print(f\"{a} + {b} = {a + b}\")，花括号里可以放变量和算式。",
            answer=code("a = %d" % a, "b = %d" % b, 'print(f"{a} + {b} = {a + b}")'),
            cases=[""]))

    # ==========================================================
    # 二、input 输入问答
    # ==========================================================

    # ── I01 读一个名字，打印一句问候 ────────────────────────
    for title, greet in [
        ("和新同学打个招呼", "你好"),
        ("欢迎小客人的到来", "欢迎你"),
        ("早上见到教练", "早上好"),
        ("认识一位新朋友", "很高兴认识你"),
        ("图书管理员的问候", "欢迎"),
        ("迎接小宇航员回家", "欢迎回家"),
        ("和小企鹅说句话", "你好呀"),
        ("向快递员叔叔问好", "辛苦啦"),
        ("画室门口的招呼", "欢迎来到画室"),
        ("机器人小助手上线", "我是小助手"),
    ]:
        items.append(exercise(
            topic="input", level=1, title=title,
            desc="输入一行，是一个名字。请输出一行问候：%s，名字！\n"
                 "例如输入 小明，就输出 %s，小明！" % (greet, greet),
            hint="先用 name = input() 把这一行读进变量，再用 print 把「%s，」、name、「！」拼起来。" % greet,
            answer=code("name = input()", 'print(f"%s，{name}！")' % greet),
            cases=["小明", "小红", "阿宝"]))

    # ── I02 复读机：把输入原样输出 ──────────────────────────
    for title in ["复读机一号", "录音笔的小测试", "镜子里的那句话"]:
        items.append(exercise(
            topic="input", level=1, title=title,
            desc="输入一行文字，请把这一行原样输出（一个字都不能改）。",
            hint="s = input() 把读到的内容存进变量，再 print(s) 就能原样打印出来。",
            answer=code("s = input()", "print(s)"),
            cases=["今天天气真好", "Python 你好", "我要成为编程小达人"]))

    # ── I03 回声：在输入前面加上一句提示语 ──────────────────
    for title, prefix in [
        ("山谷里的回声机", "回声："),
        ("校园小喇叭广播", "广播内容："),
        ("班级留言板", "留言："),
    ]:
        items.append(exercise(
            topic="input", level=1, title=title,
            desc="输入一行文字。请输出一行：先写「%s」，紧接着把输入的内容写在后面。\n"
                 "例如输入 早上好，就输出 %s早上好。" % (prefix, prefix),
            hint="读进来的文字是一个字符串，可以用 + 把它和「%s」拼在一起再打印。" % prefix,
            answer=code("s = input()", 'print(%r + s)' % prefix),
            cases=["早上好", "我爱学 Python", "下课啦"]))

    # ── I04 读一个整数，输出它的 2 倍 ───────────────────────
    for title, scene in [
        ("糖果数量翻一倍", "糖果"),
        ("铅笔数量翻一倍", "铅笔"),
        ("零花钱翻一倍", "零花钱"),
        ("小乌龟的步数翻一倍", "步数"),
        ("苹果个数翻一倍", "苹果"),
    ]:
        items.append(exercise(
            topic="input", level=1, title=title,
            desc="输入一行，是一个整数 n，表示%s的数量（例如 7）。\n"
                 "请输出一行，表示翻一倍以后的%s数量（例如 14）。" % (scene, scene),
            hint="input() 读到的是文字，要先 int() 转成整数，再乘 2 打印。",
            answer=code("n = int(input())", "print(n * 2)"),
            cases=["7", "12", "25"]))

    # ── I05 读一个整数，输出它的平方 ────────────────────────
    for title in ["正方形地砖的面积", "正方形手帕有多大"]:
        items.append(exercise(
            topic="input", level=1, title=title,
            desc="输入一行，是一个整数，表示正方形的边长。\n"
                 "请输出一行，正方形的面积（边长乘边长）。",
            hint="把边长存进变量 a，面积就是 a * a，也可以写成 a ** 2。",
            answer=code("a = int(input())", "print(a * a)"),
            cases=["4", "9", "15"]))

    # ── I06 读一个小数，输出它的 2 倍 ───────────────────────
    for title, scene in [
        ("称一称，苹果重量翻倍", "重量"),
        ("量一量，绳长翻倍", "长度"),
        ("水温升高一倍", "温度"),
    ]:
        items.append(exercise(
            topic="input", level=2, title=title,
            desc="输入一行，是一个可能带小数点的数（例如 3.5），表示%s。\n"
                 "请输出一行，它的 2 倍。" % scene,
            hint="带小数点的数要用 float(input()) 读进来，再乘 2。",
            answer=code("x = float(input())", "print(x * 2)"),
            cases=["3.5", "1.25", "10.5"]))

    # ── I07 读两行整数，输出第一个减第二个 ──────────────────
    for title, scene in [
        ("相差多少岁", "年龄"),
        ("谁的糖果更多", "糖果"),
        ("两队人数的差距", "人数"),
        ("跳绳个数的差距", "跳绳"),
    ]:
        items.append(exercise(
            topic="input", level=1, title=title,
            desc="输入两行，每行一个整数，分别表示两个人的%s。\n"
                 "请输出一行：第一个数减第二个数的结果（结果是负数也要照样输出）。" % scene,
            hint="连着写两条 int(input())，分别存进 a 和 b，再打印 a - b。",
            answer=code("a = int(input())", "b = int(input())", "print(a - b)"),
            cases=["12\n7", "5\n9", "100\n45"]))

    # ── I08 读两行，交换顺序输出 ────────────────────────────
    for title in ["先来后到，换个顺序", "上下两行掉个个儿", "排队顺序反过来"]:
        items.append(exercise(
            topic="input", level=1, title=title,
            desc="输入两行文字。请输出两行：第一行输出原来的第二行，第二行输出原来的第一行。",
            hint="用两个变量分别接住两行，打印的时候先 print(b) 再 print(a)。",
            answer=code("a = input()", "b = input()", "print(b)", "print(a)"),
            cases=["苹果\n香蕉", "第一行\n第二行", "小猫\n小狗"]))

    # ── I09 读两行，拼成一句话 ──────────────────────────────
    for title, tail in [
        ("我们做好朋友吧", "是好朋友"),
        ("同桌互相介绍", "是同桌"),
        ("一起组队参加比赛", "是一队的"),
    ]:
        items.append(exercise(
            topic="input", level=1, title=title,
            desc="输入两行，每行是一个名字。请输出一行，把两个名字用「和」连起来，"
                 "最后再加上「%s」。\n例如输入 小明 和 小红，就输出 小明和小红%s。" % (tail, tail),
            hint="用 + 把 a、「和」、b、「%s」按顺序拼成一个字符串再打印。" % tail,
            answer=code("a = input()", "b = input()", 'print(a + "和" + b + "%s")' % tail),
            cases=["小明\n小红", "小宇\n乐乐", "丁丁\n当当"]))

    # ── I10 读一行两个词，交换后输出 ────────────────────────
    for title, scene in [
        ("早餐吃了什么", "两样早点"),
        ("交换位置的两个词", "两个词"),
        ("把词序倒过来念", "两个词"),
    ]:
        items.append(exercise(
            topic="input", level=2, title=title,
            desc="输入一行，是%s，中间用一个空格隔开（例如 牛奶 面包）。\n"
                 "请输出一行，把它们换个位置，中间仍然用一个空格隔开（例如 面包 牛奶）。" % scene,
            hint="a, b = input().split() 能一次读进两个词；打印时写 print(b, a)，逗号会自动补一个空格。",
            answer=code("a, b = input().split()", "print(b, a)"),
            cases=["牛奶 面包", "语文 数学", "红 蓝"]))

    # ── I11 读一行两个整数，摆成一句话 ──────────────────────
    for title, op_word, op in [
        ("加法小报幕员", "加", "+"),
        ("减法小报幕员", "减", "-"),
        ("乘法小报幕员", "乘", "*"),
    ]:
        items.append(exercise(
            topic="input", level=2, title=title,
            desc="输入一行，两个用空格隔开的整数 a 和 b（例如 3 5）。\n"
                 "请输出一行：a 空格%s空格 b 空格等于空格 结果。\n"
                 "例如输入 3 5，就输出 3 %s 5 = 8。" % (op_word, op_word),
            hint="a, b = map(int, input().split()) 一次读两个整数，"
                 "再用 f-string：print(f\"{a} %s {b} = {a %s b}\")。" % (op_word, op),
            answer=code("a, b = map(int, input().split())",
                        'print(f"{a} %s {b} = {a %s b}")' % (op_word, op)),
            cases=["3 5", "12 4", "7 8"]))

    # ── I12 读一行，输出字符个数 ────────────────────────────
    for title, scene in [
        ("数一数这句话有几个字", "一句话"),
        ("给英文单词量身高", "一个英文单词"),
        ("名字里藏着几个字", "一个名字"),
    ]:
        items.append(exercise(
            topic="input", level=2, title=title,
            desc="输入一行%s（中间不要空格）。请输出一行，这一行一共有多少个字符。" % scene,
            hint="len(s) 能数出字符串的长度，把 input() 读到的内容交给它就行。",
            answer=code("s = input()", "print(len(s))"),
            cases=["Python", "少儿编程", "abcde"]))

    # ── I13 读一行，输出第一个和最后一个字符 ────────────────
    for title in ["抓出第一个和最后一个字", "句子的头和尾", "首尾两个字连起来"]:
        items.append(exercise(
            topic="input", level=2, title=title,
            desc="输入一行文字，长度至少 2 个字符。\n"
                 "请输出一行：它的第一个字符和最后一个字符，中间不加任何东西。\n"
                 "例如输入 Python，就输出 Pn。",
            hint="字符串的下标从 0 开始：s[0] 是第一个字符，s[-1] 是最后一个字符。",
            answer=code("s = input()", "print(s[0] + s[-1])"),
            cases=["Python", "编程", "abc"]))

    # ── I14 读一行，连续输出三遍 ────────────────────────────
    items.append(exercise(
        topic="input", level=1, title="把口号连喊三遍",
        desc="输入一行短文字。请输出一行，把这行文字连着写三遍，中间不要加空格。\n"
             "例如输入 加油，就输出 加油加油加油。",
        hint="字符串乘 3 就是重复三遍：print(s * 3)。",
        answer=code("s = input()", "print(s * 3)"),
        cases=["加油", "abc", "喵"]))

    items.append(exercise(
        topic="input", level=1, title="把小旗子插成一排",
        desc="输入一行短文字（例如 ★）。请输出一行，把它连续输出 5 遍，中间用空格隔开。\n"
             "例如输入 ★，就输出 ★ ★ ★ ★ ★。",
        hint="先读进变量，再用 print(s, s, s, s, s)，逗号会自动补空格。",
        answer=code("s = input()", "print(s, s, s, s, s)"),
        cases=["★", "旗", "x"]))

    # ── I15 读名字和年龄，输出自我介绍 ──────────────────────
    for title, tail in [
        ("制作一张小名片", "今年"),
        ("新生登记表", "今年"),
        ("成长记录卡", "已经"),
    ]:
        items.append(exercise(
            topic="input", level=2, title=title,
            desc="第一行输入一个名字，第二行输入一个整数表示年龄（例如 11）。\n"
                 "请输出一行：名字 + 「%s」+ 年龄 + 「岁。」\n"
                 "例如输入 小明 和 11，就输出 小明%s11岁。" % (tail, tail),
            hint="第一行用 input() 读名字，第二行用 int(input()) 读年龄，再用 f-string 拼起来。",
            answer=code("name = input()", "age = int(input())",
                        'print(f"{name}%s{age}岁。")' % tail),
            cases=["小明\n11", "乐乐\n9", "丁丁\n13"]))

    # ── I16 读三行，倒着输出 ────────────────────────────────
    items.append(exercise(
        topic="input", level=2, title="三层小书架，从上往下搬",
        desc="输入三行文字。请输出三行：先输出原来的第三行，再输出第二行，最后输出第一行。",
        hint="用三个变量分别接住三行，打印的时候顺序倒过来写：c、b、a。",
        answer=code("a = input()", "b = input()", "c = input()",
                    "print(c)", "print(b)", "print(a)"),
        cases=["第一层\n第二层\n第三层", "A\nB\nC"]))

    items.append(exercise(
        topic="input", level=2, title="把三张卡片顺序翻过来",
        desc="输入三行文字（每行一个词）。请把它们的顺序完全倒过来，输出三行。",
        hint="读进来三个变量，输出顺序写成第三个、第二个、第一个。",
        answer=code("a = input()", "b = input()", "c = input()",
                    "print(c)", "print(b)", "print(a)"),
        cases=["红\n黄\n蓝", "猫\n狗\n兔"]))

    # ── I17 读一行英文，变成大写 ────────────────────────────
    for title, scene in [
        ("把名字变成大写", "一个英文名字"),
        ("口号要用大写喊出来", "一句英文口号"),
        ("给英文单词换个响亮的样子", "一个英文单词"),
    ]:
        items.append(exercise(
            topic="input", level=2, title=title,
            desc="输入一行%s（小写字母）。请输出一行，把它全部变成大写字母。" % scene,
            hint="字符串有个 upper() 方法：s = input() 之后打印 s.upper()。",
            answer=code("s = input()", "print(s.upper())"),
            cases=["python", "hello", "gesp"]))

    # ── I18 用星号做一个欢迎小相框 ──────────────────────────
    for title, word in [
        ("做一个欢迎小相框", "同学"),
        ("给小客人做个相框", "客人"),
    ]:
        items.append(exercise(
            topic="input", level=2, title=title,
            desc="输入一行，是一个名字（不含空格）。请输出三行：\n"
                 "第一行和第三行是一样长的星号线，星号个数 = 名字长度 + 10；\n"
                 "第二行是：星号 + 空格 + 欢迎 + 空格 + 名字 + 空格 + %s + 空格 + 星号。\n"
                 "例如输入 小宇，中间那行就是 * 欢迎 小宇 %s *" % (word, word),
            hint="先用 len(name) 算出名字长度，再用 \"*\" * 长度 造星号线；中间那行用 + 把几段拼起来。",
            answer=code("name = input()",
                        'line = "*" * (len(name) + 10)',
                        "print(line)",
                        'print("* 欢迎 " + name + " %s *")' % word,
                        "print(line)"),
            cases=["小宇", "Amy", "乐乐"]))

    # ── I19 读一个正整数，求各位数字之和 ────────────────────
    items.append(exercise(
        topic="input", level=2, title="把数字拆开加起来",
        desc="输入一行，是一个正整数（例如 1234）。\n"
             "请输出一行：它各位数字的和（1 + 2 + 3 + 4 = 10）。",
        hint="把输入当成字符串，用 for 一个一个字取出来，再用 int() 变成数字累加到总和里。",
        answer=code("s = input()", "total = 0", "for ch in s:",
                    "    total = total + int(ch)", "print(total)"),
        cases=["1234", "999", "50"]))

    items.append(exercise(
        topic="input", level=2, title="幸运数字的秘密",
        desc="输入一行，是一个三位数（例如 258）。\n"
             "请输出一行：它三个数位上的数字之和（2 + 5 + 8 = 15）。",
        hint="同上：把字符串一个一个字符取出来转成整数再加起来；也可以试试 n // 100 这类办法。",
        answer=code("s = input()", "total = 0", "for ch in s:",
                    "    total = total + int(ch)", "print(total)"),
        cases=["258", "100", "731"]))

    # ── I20 读一行若干整数，求和 ────────────────────────────
    items.append(exercise(
        topic="input", level=2, title="五个小朋友的苹果数",
        desc="输入一行，是 5 个用空格隔开的整数，表示 5 个小朋友的苹果数。\n"
             "请输出一行：他们一共有多少个苹果。",
        hint="parts = input().split() 会得到一串小块，用 for 把它们逐个 int() 之后加起来。",
        answer=code("parts = input().split()", "total = 0", "for x in parts:",
                    "    total = total + int(x)", "print(total)"),
        cases=["1 2 3 4 5", "10 20 30 40 50"]))

    items.append(exercise(
        topic="input", level=2, title="五科成绩的总分",
        desc="输入一行，是 5 个用空格隔开的整数，表示五科成绩。\n"
             "请输出一行：五科的总分。",
        hint="先用 input().split() 切开，再一个一个转成整数相加。",
        answer=code("parts = input().split()", "total = 0", "for x in parts:",
                    "    total = total + int(x)", "print(total)"),
        cases=["90 85 78 92 88", "60 60 60 60 60"]))

    # ── I21 读一行逗号分隔的内容，数一数有几项 ──────────────
    items.append(exercise(
        topic="input", level=2, title="购物清单里有几样东西",
        desc="输入一行，是若干项用英文逗号隔开的内容（例如 苹果,香蕉,葡萄）。\n"
             "请输出一行：一共有几项。",
        hint="input().split(\",\") 会按英文逗号切开，len() 一数就知道有几项。",
        answer=code('parts = input().split(",")', "print(len(parts))"),
        cases=["苹果,香蕉,葡萄", "红,橙,黄,绿,蓝"]))

    # ── I22 读两行，判断是否完全相同 ────────────────────────
    items.append(exercise(
        topic="input", level=2, title="是不是同一句话",
        desc="输入两行文字。如果两行完全一样，请输出 True；如果不一样，请输出 False。",
        hint="== 可以比较两个字符串，比较的结果本身就是一个 True 或 False，直接打印它。",
            answer=code("a = input()", "b = input()", "print(a == b)"),
            cases=["苹果\n苹果", "苹果\n香蕉"]))

    # ── I23 读一行，去掉首尾多余的空格 ──────────────────────
    items.append(exercise(
        topic="input", level=2, title="把多余的空格擦掉",
        desc="输入一行文字，前后可能粘着多余的空格。\n"
             "请输出去掉首尾空格之后的那行文字（中间的空格要保留）。",
        hint="字符串的 strip() 方法能去掉首尾的空白：input().strip()。",
        answer=code("s = input()", "print(s.strip())"),
        cases=["  你好，Python   ", " 编程 真好玩 "]))

    # ── I24 读一行，倒过来输出 ──────────────────────────────
    items.append(exercise(
        topic="input", level=2, title="把句子倒过来念",
        desc="输入一行文字（不含空格）。请把它倒过来输出。\n"
             "例如输入 编程，就输出 程编。",
        hint="切片写法 s[::-1] 可以把字符串整个倒过来。",
        answer=code("s = input()", "print(s[::-1])"),
        cases=["编程", "abc", "12345"]))

    # ── I25 读秒数，输出「几分几秒」─────────────────────────
    for title, scene in [
        ("把秒数说成几分几秒", "总秒数"),
        ("跑步计时器读出来", "跑步用时"),
        ("动画片看了多久", "观看时间"),
    ]:
        items.append(exercise(
            topic="input", level=2, title=title,
            desc="输入一行，是一个整数，表示%s（单位：秒，例如 150）。\n"
                 "请输出一行：X 空格 分 空格 Y 空格 秒。\n"
                 "例如输入 150，就输出 2 分 30 秒。" % scene,
            hint="整分钟数是 n // 60，剩下的秒数是 n % 60，再用 f-string 拼成一句话。",
            answer=code("n = int(input())",
                        'print(f"{n // 60} 分 {n % 60} 秒")'),
            cases=["150", "75", "3600"]))

    # ── I26 读两行整数，分别输出和与积 ──────────────────────
    items.append(exercise(
        topic="input", level=2, title="两个数的和与积都报出来",
        desc="输入两行，每行一个整数。\n"
             "请输出两行：第一行是它们的和，第二行是它们的积。",
        hint="读两个整数存进 a、b，先 print(a + b)，再 print(a * b)。",
        answer=code("a = int(input())", "b = int(input())",
                    "print(a + b)", "print(a * b)"),
        cases=["3\n4", "12\n5", "7\n9"]))

    # ==========================================================
    # 三、var 变量与类型
    # ==========================================================

    # ── V01 把数字存进变量再打印 ────────────────────────────
    for title, name, value, scene in [
        ("把糖果数存进变量", "candy", 7, "糖果"),
        ("把年龄存进变量", "age", 11, "年龄"),
        ("把身高存进变量", "height", 138, "身高（厘米）"),
    ]:
        items.append(exercise(
            topic="var", level=1, title=title,
            desc="请先把数字 %d 存进变量 %s，再把这个变量打印出来。\n"
                 "屏幕上应该出现：%d" % (value, name, value),
            hint="赋值用等号：变量名写在等号左边，要存的东西写在右边，然后再 print(变量名)。",
            answer=code("%s = %d" % (name, value), "print(%s)" % name),
            cases=[""]))

    # ── V02 把文字存进变量再打印 ────────────────────────────
    items.append(exercise(
        topic="var", level=1, title="给好朋友存一句祝福",
        desc="请把文字「祝你天天开心」存进变量 word，再把这个变量打印出来。",
        hint="文字要放进英文引号里才能存进变量：word = \"……\"。",
        answer=code('word = "祝你天天开心"', "print(word)"),
        cases=[""]))

    items.append(exercise(
        topic="var", level=1, title="把宠物名字存起来",
        desc="请把文字「小豆丁」存进变量 pet，再把 pet 打印出来。",
        hint="先写 pet = \"小豆丁\"，再 print(pet)，注意引号是英文的。",
        answer=code('pet = "小豆丁"', "print(pet)"),
        cases=[""]))

    # ── V03 两个变量相加 ────────────────────────────────────
    for title, a, b in [
        ("苹果和梨一共有几个", 12, 8),
        ("两盒彩笔一共几支", 24, 16),
        ("上午和下午一共写了几行代码", 15, 27),
    ]:
        items.append(exercise(
            topic="var", level=1, title=title,
            desc="请把 %d 存进变量 a，把 %d 存进变量 b，然后打印 a + b 的结果。" % (a, b),
            hint="a 和 b 都是整数变量，print(a + b) 会先把它们加起来再打印。",
            answer=code("a = %d" % a, "b = %d" % b, "print(a + b)"),
            cases=[""]))

    # ── V04 交换两个变量的值（Python 写法）──────────────────
    for title, a, b in [
        ("两只小乌龟换位置", 3, 8),
        ("红球和蓝球交换", 5, 9),
        ("两个座位上的同学互换", 6, 1),
    ]:
        items.append(exercise(
            topic="var", level=2, title=title,
            desc="先把 %d 存进 a，把 %d 存进 b，然后交换 a 和 b 的值，最后用一条 print(a, b) 输出。\n"
                 "屏幕上应该是：%d %d" % (a, b, b, a),
            hint="Python 交换两个变量很简单：写 a, b = b, a 就换好了。",
            answer=code("a = %d" % a, "b = %d" % b, "a, b = b, a", "print(a, b)"),
            cases=[""]))

    # ── V05 用临时变量交换 ──────────────────────────────────
    for title, a, b in [
        ("借一个临时变量来交换", 5, 9),
        ("像换水杯一样交换值", 2, 7),
    ]:
        items.append(exercise(
            topic="var", level=2, title=title,
            desc="先把 %d 存进 a，把 %d 存进 b，再借一个临时变量 t，交换 a 和 b 的值，"
                 "最后用一条 print(a, b) 输出。" % (a, b),
            hint="三步走：t = a，a = b，b = t。临时变量就像一个中转的小盒子。",
            answer=code("a = %d" % a, "b = %d" % b, "t = a", "a = b", "b = t",
                        "print(a, b)"),
            cases=[""]))

    # ── V06 用 type() 看看是什么类型 ────────────────────────
    for title, value, kind in [
        ("整数是什么类型", "10", "int"),
        ("小数是什么类型", "3.14", "float"),
        ("一句话是什么类型", "'你好'", "str"),
        ("True 是什么类型", "True", "bool"),
    ]:
        items.append(exercise(
            topic="var", level=1, title=title,
            desc="请把 %s 交给 type() 看一看，并把这个类型打印出来。\n"
                 "答案里会出现尖括号和 <class ...> 这样的字样，照原样输出就行。" % value,
            hint="print(type(%s)) 会打印出这个东西的类型。" % value,
            answer="print(type(%s))" % value,
            cases=[""]))

    # ── V07 用 int() 把文字变成整数 ─────────────────────────
    for title, text, add in [
        ("把字符串 25 变成整数", "25", 5),
        ("把字符串 40 变成整数", "40", 8),
        ("把字符串 13 变成整数", "13", 7),
    ]:
        items.append(exercise(
            topic="var", level=2, title=title,
            desc="请把字符串 %s 用 int() 变成整数存进变量 n，再打印 n + %d 的结果。"
                 % (text, add),
            hint="n = int(\"%s\") 之后 n 就是真正的整数了，可以拿来做加法。" % text,
            answer=code('n = int("%s")' % text, "print(n + %d)" % add),
            cases=[""]))

    # ── V08 用 float() 把文字变成小数 ───────────────────────
    for title, text, times in [
        ("把字符串 3.5 变成小数", "3.5", 2),
        ("把字符串 1.5 变成小数", "1.5", 4),
        ("把字符串 2.25 变成小数", "2.25", 2),
    ]:
        items.append(exercise(
            topic="var", level=2, title=title,
            desc="请把字符串 %s 用 float() 变成小数存进变量 x，再打印 x 乘 %d 的结果。"
                 % (text, times),
            hint="float(\"%s\") 会把它变成带小数点的数，注意结果里可能出现 .0 结尾。" % text,
            answer=code('x = float("%s")' % text, "print(x * %d)" % times),
            cases=[""]))

    # ── V09 用 str() 把数字变成文字再拼接 ───────────────────
    for title, name, age in [
        ("做一张自我介绍卡", "小宇", 11),
        ("给新同学介绍自己", "乐乐", 10),
        ("报出自己的年龄", "丁丁", 12),
    ]:
        items.append(exercise(
            topic="var", level=2, title=title,
            desc="请把名字「%s」存进变量 name，把年龄 %d 存进变量 age，"
                 "然后用 + 拼出一行：%s今年%d岁。" % (name, age, name, age),
            hint="字符串和整数不能直接用 + 拼，要用 str(age) 把它变成文字再拼。",
            answer=code('name = "%s"' % name, "age = %d" % age,
                        'print("我" + "叫" + name + "，今年" + str(age) + "岁。")'),
            cases=[""]))

    # ── V10 用逗号打印，就不用 str() 了 ─────────────────────
    items.append(exercise(
        topic="var", level=1, title="用逗号报出自己的年龄",
        desc="请把 12 存进变量 age，然后用一条 print，把「我今年」、age、「岁」三样东西"
             "用逗号隔开打印出来。\n注意：逗号会自动多出一个空格。",
        hint="print(\"我今年\", age, \"岁\") 就能直接打印，不用 str()。",
        answer=code("age = 12", 'print("我今年", age, "岁")'),
        cases=[""]))

    items.append(exercise(
        topic="var", level=1, title="用逗号报出铅笔的数量",
        desc="请把 8 存进变量 n，再用一条 print 打印：铅笔、n、支，三样东西用逗号隔开。\n"
             "（屏幕上会多出两个空格，这是逗号的功劳。）",
        hint="和上一题一样：逗号分隔，print 自动补空格。",
        answer=code("n = 8", 'print("铅笔", n, "支")'),
        cases=[""]))

    # ── V11 一行给多个变量赋值 ──────────────────────────────
    for title, a, b, c in [
        ("一次给三个盒子装糖", 1, 2, 3),
        ("一次记下三个分数", 10, 20, 30),
        ("一次存三个边长", 2, 4, 6),
    ]:
        items.append(exercise(
            topic="var", level=2, title=title,
            desc="请用一行代码把 %d、%d、%d 分别存进变量 a、b、c，然后打印 a + b + c 的结果。"
                 % (a, b, c),
            hint="Python 支持一次赋多个值：a, b, c = %d, %d, %d。" % (a, b, c),
            answer=code("a, b, c = %d, %d, %d" % (a, b, c), "print(a + b + c)"),
            cases=[""]))

    # ── V12 链式赋值 ────────────────────────────────────────
    items.append(exercise(
        topic="var", level=2, title="三个盒子装一样多的糖",
        desc="请用一行代码让 a、b、c 三个变量都等于 6，然后打印 a * b 的结果。",
        hint="可以连着写：a = b = c = 6，三个变量就都是 6 了。",
        answer=code("a = b = c = 6", "print(a * b)"),
        cases=[""]))

    items.append(exercise(
        topic="var", level=2, title="三个一模一样的存钱罐",
        desc="请用一行代码让 x、y、z 三个变量都等于 3，然后打印 x + y + z 的结果。",
        hint="链式赋值：x = y = z = 3，一次就搞定。",
        answer=code("x = y = z = 3", "print(x + y + z)"),
        cases=[""]))

    # ── V13 复合赋值：+=  -=  *= ────────────────────────────
    for title, start, delta, op, shown in [
        ("存钱罐里又放进 5 元", 10, 5, "+=", 15),
        ("树上的果子被摘走 4 个", 12, 4, "-=", 8),
        ("零花钱攒成原来的 3 倍", 6, 3, "*=", 18),
    ]:
        items.append(exercise(
            topic="var", level=2, title=title,
            desc="请把 %d 存进变量 x，再用 %s 把 x 变成 %d，最后打印 x。"
                 % (start, op, shown),
            hint="%s 是复合赋值：x %s %d 就等于 x = x %s %d，写起来更短。"
                 % (op, op, delta, op.rstrip("="), delta),
            answer=code("x = %d" % start, "x %s %d" % (op, delta), "print(x)"),
            cases=[""]))

    # ── V14 读入整数存进变量再计算 ──────────────────────────
    for title, scene, add, tail in [
        ("明年我几岁", "年龄", 1, "岁"),
        ("存钱罐里又多了 100 元", "存款金额", 100, "元"),
        ("小树苗又长高 3 厘米", "现在的高度", 3, "厘米"),
    ]:
        items.append(exercise(
            topic="var", level=1, title=title,
            desc="输入一行，是一个整数，表示%s。请把它存进变量，加上 %d 之后再输出。\n"
                 "屏幕上只输出一个数字（单位是%s，不用写出来）。" % (scene, add, tail),
            hint="n = int(input()) 先读进来，再 print(n + %d)。" % add,
            answer=code("n = int(input())", "print(n + %d)" % add),
            cases=["10", "25", "138"]))

    # ── V15 先存、再转、再计算 ──────────────────────────────
    for title in ["先接住输入，再变成整数", "把读到的文字变成数字再算"]:
        items.append(exercise(
            topic="var", level=2, title=title,
            desc="输入一行，是一个整数（写在纸上时它是文字）。\n"
                 "请先用变量接住它，再用 int() 变成整数，最后输出它的平方。",
            hint="s = input() 之后 n = int(s)，再 print(n * n)，分三步做更清楚。",
            answer=code("s = input()", "n = int(s)", "print(n * n)"),
            cases=["6", "11", "20"]))

    # ── V16 变量的值一步步变化 ──────────────────────────────
    for title, ops in [
        ("变量的三步变身", ["x = 1", "x = x + 2", "x = x * 3"]),
        ("存钱罐的三次变化", ["x = 5", "x = x * 2", "x = x - 4"]),
        ("数字的两次跳跃", ["x = 10", "x = x + 5", "x = x * 2"]),
    ]:
        items.append(exercise(
            topic="var", level=2, title=title,
            desc="请照着顺序写三行赋值，每一步都在上一步的基础上变化，最后打印 x。\n"
                 "第一步：%s\n第二步：%s\n第三步：%s" % (ops[0], ops[1], ops[2]),
            hint="等号右边的 x 是旧值，算完之后才会存回 x，所以一步一步看就不会乱。",
            answer=code(ops[0], ops[1], ops[2], "print(x)"),
            cases=[""]))

    # ── V17 整数除以 2 会变成小数 ───────────────────────────
    for title, start in [("整数除以 2 之后变成了什么", 10), ("10 的一半是什么类型", 10)]:
        items.append(exercise(
            topic="var", level=2, title=title,
            desc="请把 %d 存进变量 a，然后让 a = a / 2。\n"
                 "输出两行：第一行是 a 的值，第二行是 a 的类型。" % start,
            hint="/ 得到的结果一定是小数（float），所以 10 / 2 会变成 5.0 而不是 5。",
            answer=code("a = %d" % start, "a = a / 2", "print(a)", "print(type(a))"),
            cases=[""]))

    # ── V18 字符串相加和数字相加不一样 ──────────────────────
    items.append(exercise(
        topic="var", level=2, title="加号的两个身份",
        desc="请输出两行：\n"
             "第一行打印 \"3\" + \"5\" 的结果；\n"
             "第二行打印 3 + 5 的结果。\n"
             "看一看加号在文字中间和在数字中间有什么不一样。",
        hint="加号遇到字符串是「粘起来」，遇到数字才是「加起来」。引号里的 3 是文字。",
        answer=code('print("3" + "5")', "print(3 + 5)"),
        cases=[""]))

    items.append(exercise(
        topic="var", level=2, title="文字拼起来的数字",
        desc="请把 \"12\" 和 \"30\" 两个字符串用 + 连起来打印成一行。\n"
             "（提示：结果看起来像 1230，其实它是一段文字。）",
        hint="两个字符串相加就是首尾相接，不会做数学加法。",
        answer=code('print("12" + "30")'),
        cases=[""]))

    # ── V19 布尔值 True / False ─────────────────────────────
    for title, expr, shown in [
        ("5 比 3 大吗", "5 > 3", "True"),
        ("5 比 3 小吗", "5 < 3", "False"),
        ("7 比 2 大吗", "7 > 2", "True"),
    ]:
        items.append(exercise(
            topic="var", level=1, title=title,
            desc="请把比较式 %s 的结果直接打印出来。\n"
                 "比较的结果只有两种：True（成立）或 False（不成立），本题是 %s。"
                 % (expr, shown),
            hint="比较运算的结果就是布尔值，直接 print(%s) 就能看到。" % expr,
            answer="print(%s)" % expr,
            cases=[""]))

    # ── V20 用 bool() 看真假 ────────────────────────────────
    items.append(exercise(
        topic="var", level=2, title="0 和 7 谁是真的",
        desc="请输出两行：第一行打印 bool(0) 的结果，第二行打印 bool(7) 的结果。",
        hint="bool() 会把值变成 True 或 False：0 和空的东西是 False，其它一般是 True。",
        answer=code("print(bool(0))", "print(bool(7))"),
        cases=[""]))

    items.append(exercise(
        topic="var", level=2, title="空句子和有声的句子",
        desc="请输出两行：第一行打印 bool(\"\") 的结果，第二行打印 bool(\"hi\") 的结果。",
        hint="空字符串 \"\" 里什么都没有，bool() 会告诉你它是 False。",
        answer=code('print(bool(""))', 'print(bool("hi"))'),
        cases=[""]))

    # ── V21 把算式的结果存进变量 ────────────────────────────
    for title, a, b in [("先把结果存好再打印", 12, 4), ("把乘积装进新变量", 9, 7)]:
        items.append(exercise(
            topic="var", level=1, title=title,
            desc="请把 %d 存进 a，把 %d 存进 b，把 a * b 的结果存进 c。\n"
                 "输出两行：第一行打印 c，第二行打印 c + 10。" % (a, b),
            hint="c = a * b 之后，c 就是一个普通变量，可以继续参与计算。",
            answer=code("a = %d" % a, "b = %d" % b, "c = a * b",
                        "print(c)", "print(c + 10)"),
            cases=[""]))

    # ── V23 变量名要看得懂 ──────────────────────────────────
    items.append(exercise(
        topic="var", level=1, title="起个看得懂的名字",
        desc="请把苹果的个数 5 存进变量 apple，把铅笔的支数 3 存进变量 pencil，"
             "然后打印它们的总数。",
        hint="变量名用英文小写单词，一看就知道里面装的是什么，比 a、b 好读多了。",
        answer=code("apple = 5", "pencil = 3", "print(apple + pencil)"),
        cases=[""]))

    items.append(exercise(
        topic="var", level=1, title="给文具盒记账",
        desc="请把橡皮的块数 7 存进变量 eraser，把尺子的把数 2 存进变量 ruler，"
             "然后打印一共有多少件文具。",
        hint="先分别赋值，再把两个变量相加打印出来。",
        answer=code("eraser = 7", "ruler = 2", "print(eraser + ruler)"),
        cases=[""]))

    # ── V24 一次输出值和类型 ────────────────────────────────
    items.append(exercise(
        topic="var", level=2, title="把读到的数连类型一起报出来",
        desc="输入一行，是一个整数。请把它变成整数存进变量 n。\n"
             "输出一行：先输出 n 的值，再输出 n 的类型，中间用一个空格隔开。",
        hint="print(n, type(n)) 会用逗号把两样东西连起来，中间自动加一个空格。",
        answer=code("n = int(input())", "print(n, type(n))"),
        cases=["5", "128"]))

    items.append(exercise(
        topic="var", level=2, title="小数也要亮出身份",
        desc="输入一行，是一个小数。请把它变成小数存进变量 x。\n"
             "输出一行：先输出 x 的值，再输出 x 的类型，中间用一个空格隔开。",
        hint="float(input()) 读进来的就是 float 类型，print(x, type(x)) 一次打印两样。",
        answer=code("x = float(input())", "print(x, type(x))"),
        cases=["3.5", "10.25"]))

    # ── V25 变量的类型会变化 ────────────────────────────────
    items.append(exercise(
        topic="var", level=2, title="同一个变量，两种身份",
        desc="请把字符串 \"10\" 存进变量 x，先打印 x 的类型；\n"
             "再用 int() 把 x 变成整数存回 x，再打印 x 的类型。",
        hint="同一个变量名可以先后装不同类型的东西，type() 一看就知道变了没有。",
        answer=code('x = "10"', "print(type(x))", "x = int(x)", "print(type(x))"),
        cases=[""]))

    items.append(exercise(
        topic="var", level=2, title="从文字到小数的变身",
        desc="请把字符串 \"2.5\" 存进变量 x，先打印 x 的类型；\n"
             "再用 float() 转换后存回 x，再打印 x 的类型。",
        hint="第一次是 str，转换之后就是 float 了。",
        answer=code('x = "2.5"', "print(type(x))", "x = float(x)", "print(type(x))"),
        cases=[""]))

    # ==========================================================
    # 四、calc 算术运算
    # ==========================================================

    # ── C01 两个整数相加 ────────────────────────────────────
    for title, scene in [
        ("数一数苹果的总数", "两筐苹果的个数"),
        ("数一数铅笔的总数", "两盒铅笔的支数"),
        ("数一数糖果的总数", "两袋糖果的颗数"),
        ("公交车上一共有多少乘客", "先上车和后又上车的人数"),
        ("储蓄罐里的硬币总数", "两个储蓄罐里的硬币数"),
    ]:
        items.append(exercise(
            topic="calc", level=1, title=title,
            desc="输入一行，两个用空格隔开的整数，表示%s。\n"
                 "请输出一行，它们的和。" % scene,
            hint="a, b = map(int, input().split()) 一次读两个整数，再打印 a + b。",
            answer=code("a, b = map(int, input().split())", "print(a + b)"),
            cases=["3 5", "12 30", "100 250", "7 8"]))

    # ── C02 两个整数相减 ────────────────────────────────────
    for title, scene in [
        ("谁跳得更远", "两个人立定跳远的成绩（厘米）"),
        ("谁跑得更快", "两个人 50 米跑的成绩（秒）"),
        ("还剩多少个气球", "原来的个数和飞走的个数"),
    ]:
        items.append(exercise(
            topic="calc", level=1, title=title,
            desc="输入一行，两个用空格隔开的整数，表示%s。\n"
                 "请输出一行：第一个数减第二个数的结果。" % scene,
            hint="读进来两个整数存进 a 和 b，打印 a - b 就行（结果是负数也要照原样输出）。",
            answer=code("a, b = map(int, input().split())", "print(a - b)"),
            cases=["18 7", "5 9", "120 45"]))

    # ── C03 两个整数相乘 ────────────────────────────────────
    for title, scene in [
        ("算一算一盒鸡蛋有多少个", "每排的个数和排数"),
        ("列队做操一共有多少人", "每行人数和行数"),
        ("买苹果要花多少钱", "每斤的价格和买的斤数"),
        ("图书角一共放了多少本书", "每层的本数和层数"),
    ]:
        items.append(exercise(
            topic="calc", level=1, title=title,
            desc="输入一行，两个用空格隔开的整数，表示%s。\n"
                 "请输出一行，它们的乘积。" % scene,
            hint="乘法用 * 号：print(a * b)。注意键盘上的 * 在数字 8 上面。",
            answer=code("a, b = map(int, input().split())", "print(a * b)"),
            cases=["6 5", "9 8", "12 12"]))

    # ── C04 两个整数相除（结果是小数）───────────────────────
    for title, scene in [
        ("把果汁平均分到杯子里", "果汁的总毫升数和杯子数"),
        ("把绳子平均剪成几段", "绳子的总长度和段数"),
        ("平均每人分到几颗糖", "糖果总数和人数"),
    ]:
        items.append(exercise(
            topic="calc", level=1, title=title,
            desc="输入一行，两个用空格隔开的整数，表示%s。\n"
                 "请输出一行：第一个数除以第二个数的结果（可能带小数点）。" % scene,
            hint="除法用 / 号，除不尽时 Python 会给出小数，例如 10 / 4 的结果是 2.5。",
            answer=code("a, b = map(int, input().split())", "print(a / b)"),
            cases=["10 4", "100 5", "7 2"]))

    # ── C05 整除和取余（输出两行）───────────────────────────
    for title, scene in [
        ("分糖果，能分给几个人", "糖果总数和每人分到的颗数"),
        ("装盒子，能装满几盒", "小球总数和每盒装的个数"),
        ("分铅笔，每人几支", "铅笔总数和人数"),
        ("坐车去春游，能坐满几辆车", "总人数和每辆车能坐的人数"),
    ]:
        items.append(exercise(
            topic="calc", level=2, title=title,
            desc="输入一行，两个用空格隔开的整数，表示%s。\n"
                 "请输出两行：第一行是整除的结果（a // b），第二行是余数（a %% b）。"
                 % scene,
            hint="// 是整除，只保留整数部分；% 是取余数。两个都算一遍，分两行打印。",
            answer=code("a, b = map(int, input().split())",
                        "print(a // b)", "print(a % b)"),
            cases=["17 5", "23 4", "100 7"]))

    # ── C06 幂运算 ──────────────────────────────────────────
    for title, scene in [
        ("细胞分裂多少次", "初始个数和分裂次数"),
        ("折纸能折多厚", "每次翻倍的层数和折的次数"),
        ("电脑里的小方块", "每行方块数和行数"),
    ]:
        items.append(exercise(
            topic="calc", level=2, title=title,
            desc="输入一行，两个用空格隔开的整数 a 和 b，表示%s。\n"
                 "请输出一行：a 的 b 次方。" % scene,
            hint="Python 里幂运算写两个星号：print(a ** b)。本题的数字都不大，放心算。",
            answer=code("a, b = map(int, input().split())", "print(a ** b)"),
            cases=["2 10", "3 4", "5 3"]))

    # ── C07 三个整数相加 ────────────────────────────────────
    for title, scene in [
        ("三天一共读了多少页", "三天读的页数"),
        ("三次投篮一共得了几分", "三次投篮的得分"),
        ("三筐橘子一共有多少个", "三筐橘子的个数"),
    ]:
        items.append(exercise(
            topic="calc", level=1, title=title,
            desc="输入一行，三个用空格隔开的整数，表示%s。\n"
                 "请输出一行，它们的和。" % scene,
            hint="a, b, c = map(int, input().split()) 一次读三个整数，再打印 a + b + c。",
            answer=code("a, b, c = map(int, input().split())", "print(a + b + c)"),
            cases=["12 15 20", "1 2 3", "100 200 300"]))

    # ── C08 三个数的平均数（保留 2 位小数）──────────────────
    for title, scene in [
        ("三科成绩的平均分", "三科的成绩"),
        ("三次跳远的平均成绩", "三次跳远的厘米数"),
        ("三天读书的平均页数", "三天读的页数"),
    ]:
        items.append(exercise(
            topic="calc", level=3, title=title,
            desc="输入一行，三个用空格隔开的整数，表示%s。\n"
                 "请输出一行，它们的平均数，保留 2 位小数（例如 87.33）。" % scene,
            hint="先算 (a + b + c) / 3，再用 f-string 的 :.2f 保留两位小数："
                 "print(f\"{(a + b + c) / 3:.2f}\")。",
            answer=code("a, b, c = map(int, input().split())",
                        'print(f"{(a + b + c) / 3:.2f}")'),
            cases=["80 90 92", "100 100 99", "75 80 88"]))

    # ── C09 秒数换成「几时几分几秒」─────────────────────────
    for title, scene in [
        ("把秒数说成几时几分几秒", "一共经过的秒数"),
        ("视频播放了多久", "视频的总秒数"),
        ("马拉松用了多长时间", "跑步的总秒数"),
    ]:
        items.append(exercise(
            topic="calc", level=2, title=title,
            desc="输入一行，一个整数，表示%s。\n"
                 "请输出一行：H 空格 时 空格 M 空格 分 空格 S 空格 秒。\n"
                 "例如输入 3725，就输出 1 时 2 分 5 秒。" % scene,
            hint="先用 total // 3600 得到小时，再用 total % 3600 // 60 得到分钟，"
                 "最后用 total % 60 得到秒。",
            answer=code("total = int(input())",
                        "h = total // 3600",
                        "m = total % 3600 // 60",
                        "s = total % 60",
                        'print(f"{h} 时 {m} 分 {s} 秒")'),
            cases=["3725", "59", "3600"]))

    # ── C10 分钟换成小时和分钟（分两行）─────────────────────
    for title, scene in [
        ("看动画片看了多久", "观看的分钟数"),
        ("每天跑步多少分钟", "跑步的分钟数"),
        ("一节自习课有多长", "自习课的分钟数"),
    ]:
        items.append(exercise(
            topic="calc", level=2, title=title,
            desc="输入一行，一个整数，表示%s。\n"
                 "请输出两行：第一行是换算后的小时数，第二行是剩下的分钟数。" % scene,
            hint="小时数是 n // 60，剩下的分钟数是 n % 60，分两行打印。",
            answer=code("n = int(input())", "print(n // 60)", "print(n % 60)"),
            cases=["150", "90", "59"]))

    # ── C11 厘米换成米和厘米（同一行）───────────────────────
    for title, scene in [
        ("量一量教室有多长", "长度（厘米）"),
        ("小树苗长到多高了", "高度（厘米）"),
        ("跳绳有多长", "绳长（厘米）"),
    ]:
        items.append(exercise(
            topic="calc", level=2, title=title,
            desc="输入一行，一个整数，表示%s。1 米 = 100 厘米。\n"
                 "请输出一行：X 空格 米 空格 Y 空格 厘米。\n"
                 "例如输入 145，就输出 1 米 45 厘米。" % scene,
            hint="米数是 n // 100，剩下的厘米数是 n % 100；两部分要打印在同一行里。",
            answer=code("n = int(input())", 'print(f"{n // 100} 米 {n % 100} 厘米")'),
            cases=["145", "200", "87"]))

    # ── C12 摄氏度换算成华氏度 ──────────────────────────────
    for title, scene in [
        ("把摄氏度换成华氏度", "摄氏温度"),
        ("天气预报里的温度换算", "摄氏温度"),
        ("烤箱温度换算小助手", "摄氏温度"),
    ]:
        items.append(exercise(
            topic="calc", level=2, title=title,
            desc="输入一行，一个数，表示%s（可能是小数）。\n"
                 "换算公式：华氏度 = 摄氏度 × 9 ÷ 5 + 32。\n"
                 "请输出一行，华氏温度，保留 1 位小数。" % scene,
            hint="写成 f = c * 9 / 5 + 32，再用 f\"{f:.1f}\" 保留一位小数。",
            answer=code("c = float(input())", "f = c * 9 / 5 + 32", 'print(f"{f:.1f}")'),
            cases=["37", "0", "25.5"]))

    # ── C13 长方形的面积和周长 ──────────────────────────────
    for title, scene in [
        ("算一算长方形菜地", "长和宽（米）"),
        ("给课桌配一块桌布", "桌子的长和宽（厘米）"),
        ("操场跑道的长方形球场", "球场的长和宽（米）"),
    ]:
        items.append(exercise(
            topic="calc", level=1, title=title,
            desc="输入一行，两个用空格隔开的整数，表示%s。\n"
                 "请输出两行：第一行是面积（长 × 宽），第二行是周长（（长 + 宽）× 2）。"
                 % scene,
            hint="面积是 a * b；周长是 (a + b) * 2，别忘了小括号。",
            answer=code("a, b = map(int, input().split())",
                        "print(a * b)", "print((a + b) * 2)"),
            cases=["5 3", "12 8", "100 50"]))

    # ── C14 圆的周长（圆周率取 3.14）────────────────────────
    for title, scene in [
        ("给圆形花坛围一圈栅栏", "半径（米）"),
        ("圆形蛋糕的边长", "半径（厘米）"),
        ("给圆形桌面包边", "半径（分米）"),
    ]:
        items.append(exercise(
            topic="calc", level=3, title=title,
            desc="输入一行，一个数，表示%s（可能是小数）。圆周率取 3.14。\n"
                 "请输出一行，圆的周长（2 × 3.14 × 半径），保留 2 位小数。" % scene,
            hint="周长 = 2 * 3.14 * r，再用 f-string 的 :.2f 保留两位小数。",
            answer=code("r = float(input())",
                        'print(f"{2 * 3.14 * r:.2f}")'),
            cases=["2", "1.5", "10"]))

    # ── C15 打折后的价格 ────────────────────────────────────
    for title, scene in [
        ("书店打八折", "原价（元）"),
        ("文具店打八折", "原价（元）"),
        ("儿童乐园门票打八折", "原价（元）"),
    ]:
        items.append(exercise(
            topic="calc", level=2, title=title,
            desc="输入一行，一个数，表示%s（可能是小数）。\n"
                 "打八折就是按原价的 0.8 倍付款。\n"
                 "请输出一行，打折后的价格，保留 2 位小数。" % scene,
            hint="现价 = 原价 * 0.8，再用 f\"{现价:.2f}\" 输出两位小数。",
            answer=code("price = float(input())", 'print(f"{price * 0.8:.2f}")'),
            cases=["50", "19.9", "128.5"]))

    # ── C16 买两件商品的总价 ────────────────────────────────
    for title, scene in [
        ("买两样文具要多少钱", "第一样的单价和数量，第二样的单价和数量"),
        ("超市小票的第一行", "两种商品的单价和数量"),
        ("买水果一共花多少", "两种水果的单价和数量"),
        ("给班级买两样奖品", "两种奖品的单价和数量"),
    ]:
        items.append(exercise(
            topic="calc", level=2, title=title,
            desc="输入一行，四个用空格隔开的整数：单价1 数量1 单价2 数量2，表示%s。\n"
                 "请输出一行，两件商品的总价。" % scene,
            hint="总价 = 单价1 * 数量1 + 单价2 * 数量2；读入写成 a, b, c, d = map(int, input().split())。",
            answer=code("a, b, c, d = map(int, input().split())",
                        "print(a * b + c * d)"),
            cases=["3 4 5 2", "10 2 8 3", "6 6 7 1"]))

    # ── C17 三位数的各位数字之和 ────────────────────────────
    for title, scene in [
        ("三位数的数字之和", "三位数"),
        ("车牌号上的数字加起来", "三位数"),
        ("密码里的数字之和", "三位数"),
    ]:
        items.append(exercise(
            topic="calc", level=2, title=title,
            desc="输入一行，一个三位整数（例如 123）。\n"
                 "请输出一行：它三个数位上的数字之和（1 + 2 + 3 = 6）。",
            hint="百位是 n // 100，十位是 n // 10 % 10，个位是 n % 10，三个加起来打印。",
            answer=code("n = int(input())",
                        "print(n // 100 + n // 10 % 10 + n % 10)"),
            cases=["123", "456", "999"]))

    # ── C18 求个位数字 ──────────────────────────────────────
    items.append(exercise(
        topic="calc", level=1, title="看一个数的个位是几",
        desc="输入一行，一个整数。请输出一行，它的个位数字。\n"
             "例如输入 1234，就输出 4。",
        hint="一个数除以 10 的余数就是它的个位数字，用 % 10 求出来。",
        answer=code("n = int(input())", "print(n % 10)"),
        cases=["1234", "57", "100"]))

    items.append(exercise(
        topic="calc", level=1, title="猜猜这个数的尾巴",
        desc="输入一行，一个整数。请输出一行，它除以 10 的余数（也就是个位数字）。",
        hint="取余运算符是 %：n % 10 就能拿到个位。",
        answer=code("n = int(input())", "print(n % 10)"),
        cases=["2026", "888", "9"]))

    # ── C19 把三位数倒过来 ──────────────────────────────────
    for title in ["把三位数倒过来写", "数字翻个跟头"]:
        items.append(exercise(
            topic="calc", level=2, title=title,
            desc="输入一行，一个三位整数（个位不是 0）。\n"
                 "请输出一行，把它倒过来得到的数。例如输入 123，输出 321。",
            hint="拆出百位、十位、个位：a = n // 100，b = n // 10 % 10，c = n % 10，"
                 "再打印 c * 100 + b * 10 + a。",
            answer=code("n = int(input())",
                        "a = n // 100",
                        "b = n // 10 % 10",
                        "c = n % 10",
                        "print(c * 100 + b * 10 + a)"),
            cases=["123", "508", "462"]))

    # ── C20 时间往后推算 ────────────────────────────────────
    for title, scene in [
        ("看完电影是几点", "现在的时间（时和分）以及电影多少分钟"),
        ("下课后是几点几分", "上课的时间（时和分）以及这节课多少分钟"),
        ("做完作业是几点", "开始的时间（时和分）以及用了多少分钟"),
    ]:
        items.append(exercise(
            topic="calc", level=2, title=title,
            desc="输入一行，三个用空格隔开的整数：时 分 经过的分钟数，表示%s。\n"
                 "请输出两行：第一行是 24 小时制的小时数，第二行是分钟数。\n"
                 "例如 8 30 90 表示 8:30 再过 90 分钟，输出 10 和 0。" % scene,
            hint="先都换成分钟：total = h * 60 + m + d；小时是 total // 60 % 24，分钟是 total % 60。",
            answer=code("h, m, d = map(int, input().split())",
                        "total = h * 60 + m + d",
                        "print(total // 60 % 24)",
                        "print(total % 60)"),
            cases=["8 30 90", "23 50 30", "7 0 45"]))

    # ── C21 求速度（保留 2 位小数）──────────────────────────
    for title, scene in [
        ("小乌龟爬得快不快", "路程（厘米）和时间（秒）"),
        ("跑步的平均速度", "路程（米）和时间（秒）"),
    ]:
        items.append(exercise(
            topic="calc", level=3, title=title,
            desc="输入一行，两个用空格隔开的整数，表示%s。\n"
                 "请输出一行：速度 = 路程 ÷ 时间，保留 2 位小数。" % scene,
            hint="速度 = s / t，再用 f\"{速度:.2f}\" 输出两位小数。",
            answer=code("s, t = map(int, input().split())", 'print(f"{s / t:.2f}")'),
            cases=["100 8", "60 7", "150 4"]))

    # ── C22 正方体的体积 ────────────────────────────────────
    for title, scene in [
        ("正方体魔方的体积", "棱长（厘米）"),
        ("正方体礼盒能装多少", "棱长（分米）"),
    ]:
        items.append(exercise(
            topic="calc", level=1, title=title,
            desc="输入一行，一个整数，表示%s。\n"
                 "请输出一行，正方体的体积（棱长 × 棱长 × 棱长）。" % scene,
            hint="体积 = a * a * a，也可以写成 a ** 3。",
            answer=code("a = int(input())", "print(a * a * a)"),
            cases=["3", "5", "10"]))

    # ── C23 付钱找零 ────────────────────────────────────────
    for title, pay, shop in [
        ("买文具找回多少钱", 100, "文具"),
        ("买早餐找回多少钱", 50, "早餐"),
        ("买贴纸找回多少钱", 20, "贴纸"),
    ]:
        items.append(exercise(
            topic="calc", level=1, title=title,
            desc="输入一行，一个整数，表示%s的价格（元）。\n"
                 "你付给收银员 %d 元，请输出一行应该找回多少钱。" % (shop, pay),
            hint="找零 = 付出的钱 - 价格，直接 print(%d - price)。" % pay,
            answer=code("price = int(input())", "print(%d - price)" % pay),
            cases=["37", "68", "15"]))

    # ── C25 至少需要几只船 ──────────────────────────────────
    for title, scene in [
        ("至少需要几只小船", "总人数和每只船能坐的人数"),
        ("至少需要几个盒子", "小球总数和每盒能装的个数"),
        ("至少需要几辆车", "总人数和每辆车能坐的人数"),
    ]:
        items.append(exercise(
            topic="calc", level=2, title=title,
            desc="输入一行，两个用空格隔开的整数，表示%s。\n"
                 "每个容器都要装满才能走，装不满的也要单独用一个。\n"
                 "请输出一行，至少需要几个。\n"
                 "例如 17 个人，每只船坐 5 人，需要 4 只船。" % scene,
            hint="先想 n // k：如果还有剩下的人怎么办？可以用 (n + k - 1) // k 一次算出来。",
            answer=code("n, k = map(int, input().split())", "print((n + k - 1) // k)"),
            cases=["17 5", "20 4", "1 6"]))

    # ── C27 天数换成秒数 ────────────────────────────────────
    items.append(exercise(
        topic="calc", level=1, title="一天有多少秒",
        desc="输入一行，一个整数，表示天数。请输出一行，这些天一共有多少秒。\n"
             "（1 天 = 24 小时，1 小时 = 60 分钟，1 分钟 = 60 秒）",
        hint="一天是 24 * 60 * 60 = 86400 秒，再乘上天数。",
        answer=code("n = int(input())", "print(n * 86400)"),
        cases=["1", "3", "7"]))

    items.append(exercise(
        topic="calc", level=2, title="一年大约有多少秒",
        desc="输入一行，一个整数，表示天数（按 365 天算一年）。\n"
             "请输出一行，这些天一共有多少秒。",
        hint="先算一天 86400 秒，再乘天数。数字会比较大，不用担心。",
        answer=code("n = int(input())", "print(n * 86400)"),
        cases=["365", "30"]))

    # ── C28 计算正确率（带百分号）───────────────────────────
    for title, scene in [
        ("算一算今天的正确率", "答对的题数和总题数"),
        ("投篮命中率是多少", "投中的次数和总次数"),
        ("听写正确率", "写对的词数和总词数"),
    ]:
        items.append(exercise(
            topic="calc", level=3, title=title,
            desc="输入一行，两个用空格隔开的整数，表示%s。\n"
                 "请输出一行正确率，保留 1 位小数，末尾带上百分号。\n"
                 "例如 17 题对 17 题，就输出 100.0%%。" % scene,
            hint="正确率 = 答对数 / 总题数 * 100，再用 f\"{值:.1f}%\" 保留一位小数并加上百分号。",
            answer=code("a, b = map(int, input().split())",
                        'print(f"{a / b * 100:.1f}%")'),
            cases=["17 20", "45 50", "3 8"]))

    # ── C29 算单价 ──────────────────────────────────────────
    for title, scene in [
        ("算一算每支笔多少钱", "总价和支数"),
        ("算一算每斤苹果多少钱", "总价和斤数"),
    ]:
        items.append(exercise(
            topic="calc", level=3, title=title,
            desc="输入一行，两个用空格隔开的整数，表示%s。\n"
                 "请输出一行，单价（总价 ÷ 数量），保留 2 位小数。" % scene,
            hint="单价 = total / n，用 f\"{单价:.2f}\" 保留两位小数。",
            answer=code("total, n = map(int, input().split())",
                        'print(f"{total / n:.2f}")'),
            cases=["30 4", "100 3", "25 8"]))

    # ── C30 两个温度相差多少 ────────────────────────────────
    for title, scene in [
        ("两个城市温差有多大", "两个城市的温度"),
        ("早晚温差是多少", "早上和晚上的温度"),
    ]:
        items.append(exercise(
            topic="calc", level=2, title=title,
            desc="输入一行，两个用空格隔开的整数，表示%s（摄氏度，可能一高一低）。\n"
                 "请输出一行，它们相差多少度（结果不会是负数）。" % scene,
            hint="先用 abs(a - b) 把差变成正数，再打印。abs 就是取绝对值。",
            answer=code("a, b = map(int, input().split())", "print(abs(a - b))"),
            cases=["28 15", "3 9", "0 0"]))

    # ── C33 三位数各位数字之积 ──────────────────────────────
    items.append(exercise(
        topic="calc", level=2, title="三位数数字相乘",
        desc="输入一行，一个三位整数（例如 246）。\n"
             "请输出一行：它三个数位上的数字相乘的结果（2 × 4 × 6 = 48）。",
        hint="百位 n // 100，十位 n // 10 % 10，个位 n % 10，三个数相乘。",
        answer=code("n = int(input())",
                    "print(n // 100 * (n // 10 % 10) * (n % 10))"),
        cases=["246", "123", "999"]))

    items.append(exercise(
        topic="calc", level=2, title="车牌密码的乘积",
        desc="输入一行，一个三位整数。\n"
             "请输出一行：把它三个数位上的数字相乘得到的结果。",
        hint="和上一题一样，先拆出三个数字，再乘起来。",
        answer=code("n = int(input())",
                    "print(n // 100 * (n // 10 % 10) * (n % 10))"),
        cases=["135", "500", "812"]))

    # ── C34 过了多少天是星期几 ──────────────────────────────
    for title, scene in [
        ("过了多少天是星期几", "经过的天数"),
        ("值日表上的循环", "经过的天数"),
    ]:
        items.append(exercise(
            topic="calc", level=2, title=title,
            desc="输入一行，一个整数，表示%s。\n"
                 "请输出一行：这些天以后是星期几，用 0 到 6 表示，"
                 "其中 0 表示星期日、1 表示星期一……6 表示星期六。" % scene,
            hint="一个星期 7 天循环一次，用 n % 7 就能得到答案。",
            answer=code("n = int(input())", "print(n % 7)"),
            cases=["10", "7", "100"]))

    # ── C37 单价乘数量（保留两位小数）───────────────────────
    for title, scene in [
        ("按重量算总价", "每千克的单价和买的千克数"),
        ("买布做手工", "每米的价钱和买的米数"),
        ("按小时算费用", "每小时的费用和使用的小时数"),
    ]:
        items.append(exercise(
            topic="calc", level=3, title=title,
            desc="输入两行：第一行是一个数，表示%s中的单价（可能带小数）；"
                 "第二行是一个整数，表示数量。\n"
                 "请输出一行，总价，保留 2 位小数。" % scene,
            hint="第一行用 float(input()) 读，第二行用 int(input()) 读，"
                 "相乘后用 f\"{总价:.2f}\" 输出。",
            answer=code("price = float(input())", "n = int(input())",
                        'print(f"{price * n:.2f}")'),
            cases=["3.5\n4", "12.8\n3", "0.5\n7"]))

    # ── C38 平方和 ──────────────────────────────────────────
    items.append(exercise(
        topic="calc", level=2, title="两块正方形地砖的面积和",
        desc="输入一行，两个用空格隔开的整数，表示两块正方形地砖的边长。\n"
             "请输出一行，它们的面积之和（a × a + b × b）。",
        hint="平方可以用 a * a 或者 a ** 2，两块地的面积相加再打印。",
        answer=code("a, b = map(int, input().split())", "print(a * a + b * b)"),
        cases=["3 4", "6 8", "5 12"]))

    items.append(exercise(
        topic="calc", level=2, title="两个正方形的面积之和",
        desc="输入一行，两个用空格隔开的整数，表示两个正方形的边长。\n"
             "请输出一行，两个正方形面积的和。",
        hint="先分别算面积，再相加。想一想 5 和 12 的结果是多少？",
        answer=code("a, b = map(int, input().split())", "print(a * a + b * b)"),
        cases=["5 12", "9 1"]))

    # ── C39 和与差的乘积 ────────────────────────────────────
    items.append(exercise(
        topic="calc", level=2, title="两数之和乘两数之差",
        desc="输入一行，两个用空格隔开的整数 a 和 b。\n"
             "请输出一行：(a + b) × (a − b) 的结果。",
        hint="别忘了加小括号：print((a + b) * (a - b))，不然运算顺序会不一样。",
        answer=code("a, b = map(int, input().split())", "print((a + b) * (a - b))"),
        cases=["7 3", "10 4", "9 2"]))

    items.append(exercise(
        topic="calc", level=2, title="先加后减还是先乘",
        desc="输入一行，两个用空格隔开的整数 a 和 b。\n"
             "请输出一行：(a + b) × 2 的结果。",
        hint="小括号里的先算，再乘 2。",
        answer=code("a, b = map(int, input().split())", "print((a + b) * 2)"),
        cases=["6 4", "15 5"]))

    # ── C40 平均数只取整数部分 ──────────────────────────────
    items.append(exercise(
        topic="calc", level=2, title="平均分只要整数部分",
        desc="输入一行，三个用空格隔开的整数，表示三次测验的分数。\n"
             "请输出一行，它们的平均值，只保留整数部分（不要小数点）。",
        hint="先用 // 做整除：(a + b + c) // 3，得到的就是整数部分。",
        answer=code("a, b, c = map(int, input().split())",
                    "print((a + b + c) // 3)"),
        cases=["80 90 100", "70 75 80", "91 92 93"]))

    items.append(exercise(
        topic="calc", level=2, title="平均每人分到几颗糖（只要整数）",
        desc="输入一行，两个用空格隔开的整数：糖果总数和人数。\n"
             "请输出一行，平均每人能分到几颗（只要整数部分）。",
        hint="用整除 // 而不是 /，这样结果不会带小数点。",
        answer=code("a, b = map(int, input().split())", "print(a // b)"),
        cases=["17 5", "100 8", "7 2"]))

    # ── C41 综合小挑战：三科成绩单 ──────────────────────────
    items.append(exercise(
        topic="calc", level=3, title="综合挑战：三科成绩单",
        desc="输入一行，三个用空格隔开的整数，表示语文、数学、英语的成绩。\n"
             "请输出两行：第一行是三科总分，第二行是三科平均分（保留 2 位小数）。",
        hint="第一行 print(total)；第二行用 f\"{total / 3:.2f}\" 输出平均分。",
        answer=code("a, b, c = map(int, input().split())",
                    'total = a + b + c',
                    "print(total)",
                    'print(f"{total / 3:.2f}")'),
        cases=["90 85 95", "100 100 100", "76 82 91"]))

    # ── C42 综合小挑战：小小收银员 ──────────────────────────
    items.append(exercise(
        topic="calc", level=4, title="综合挑战：小小收银员",
        desc="输入三行：第一行是单价（可能带小数），第二行是数量（整数），"
             "第三行是顾客付的钱（可能带小数）。\n"
             "请输出两行：第一行是总价，第二行是应该找回的钱，都保留 2 位小数。",
        hint="总价 = 单价 * 数量；找零 = 付款 - 总价。两行都用 :.2f 输出。",
        answer=code("price = float(input())", "n = int(input())", "pay = float(input())",
                    "total = price * n",
                    'print(f"{total:.2f}")',
                    'print(f"{pay - total:.2f}")'),
        cases=["3.5\n4\n20", "12.8\n3\n50", "0.5\n7\n5"]))

    # ── C43 综合小挑战：买文具算总价再加运费 ────────────────
    items.append(exercise(
        topic="calc", level=3, title="综合挑战：买文具加运费",
        desc="输入一行，两个用空格隔开的整数：每本本子的价钱和本数。\n"
             "快递费固定 5 元。请输出一行，一共要付多少钱（保留 2 位小数）。",
        hint="总价 = 单价 * 本数 + 5，再用 f\"{总价:.2f}\" 输出两位小数。",
        answer=code("p, n = map(int, input().split())", 'print(f"{p * n + 5:.2f}")'),
        cases=["8 3", "15 2", "4 10"]))

    # ==========================================================
    # 五、两道动手观察题（没有标准输出，自己对照着看）
    # ==========================================================

    items.append(self_check(
        topic="print", level=1, title="动动手：逗号和加号有什么不一样",
        desc="请在电脑上分别运行 print(1, 2) 和 print(1 + 2)，看看屏幕上出现了什么，"
             "再跟爸爸、妈妈或同桌说说你的发现。",
        hint="一条语句中间是逗号，另一条中间是加号，仔细比较两次输出的内容有什么差别。",
        answer=code("print(1, 2)", "print(1 + 2)"),
        tags=["手动检查", "观察题"]))

    items.append(self_check(
        topic="input", level=1, title="动动手：让程序和你聊两句",
        desc="请写一个小程序：先问「你叫什么名字」，再问「今天心情怎么样」，"
             "最后把两句话拼起来说给小朋友听。运行三次，每次输入不同的答案试试看。",
        hint="用两次 input()，每次先用一句 print() 给出提示语，最后把两个变量拼起来输出。",
        answer=code('name = input("你叫什么名字？")',
                    'mood = input("今天心情怎么样？")',
                    'print("你好，" + name + "！今天的心情是" + mood + "。")'),
        tags=["手动检查", "创意题"]))

    return items
