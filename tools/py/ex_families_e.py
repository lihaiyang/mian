"""题目家族 E —— 图形打印 / 字典 / 函数 / 趣味编程 / 海龟绘图

这几个主题原本由并行的家族模块负责，但那边中途中断了，所以由这里补齐：
    shape   图形打印（用循环排图案，GESP 一级、二级的必考题型）
    dict    字典（三级重点）
    func    函数（三级重点）
    fun     趣味编程（综合应用，孩子最喜欢）
    turtle  海龟绘图（这类题没法用文字判题，用 self_check 让孩子自己看效果）
另外补一些 loop 的题型，让循环部分的练习量更均衡。
"""

from exlib import exercise, self_check, pick, nums

ITEMS = []


def add(topic, level, title, desc, hint, answer, cases, tags=None):
    ITEMS.append(exercise(topic=topic, level=level, title=title, desc=desc,
                          hint=hint, answer=answer, cases=cases, tags=tags))


# =====================================================================
# 一、图形打印 shape
# =====================================================================

def shape_right_triangle():
    """直角三角形（星号）"""
    scenes = [("小旗子", 3, 6), ("圣诞树的一角", 4, 7), ("楼梯", 5, 8)]
    for scene, lo, hi in scenes:
        for n in range(lo, hi + 1):
            add("shape", 1, "%s：%d 行的星号直角三角形" % (scene, n),
                "【任务】用循环打印一个直角三角形。\n"
                "【输入】不需要输入。\n"
                "【输出】%d 行，第 1 行 1 个星号，第 2 行 2 个星号……第 %d 行 %d 个星号，左边顶格。\n"
                "【样例】如果 n = 3，就打印：\n*\n**\n***" % (n, n, n),
                "让 i 从 1 数到 n，每一行打印 i 个星号：print(\"*\" * i)。",
                'n = %d\n'
                'for i in range(1, n + 1):\n'
                '    print("*" * i)\n' % n,
                [""])


def shape_inverted_triangle():
    """倒直角三角形"""
    for n in nums(3, 7):
        add("shape", 1, "倒过来的星号三角形（%d 行）" % n,
            "【任务】打印一个倒着的直角三角形。\n"
            "【输入】不需要输入。\n"
            "【输出】%d 行，第 1 行 %d 个星号，最后一行 1 个星号。\n"
            "【样例】n = 3 时：\n***\n**\n*" % (n, n),
            "让 i 从 n 一路减小到 1：range(n, 0, -1)，每行打印 i 个星号。",
            'n = %d\n'
            'for i in range(n, 0, -1):\n'
            '    print("*" * i)\n' % n,
            [""])


def shape_square():
    """正方形"""
    for n, name in [(3, "小方糖"), (4, "田字格"), (5, "棋盘"), (6, "大广场")]:
        add("shape", 1, "%s：%d×%d 的星号正方形" % (name, n, n),
            "【任务】打印一个实心正方形。\n"
            "【输入】不需要输入。\n"
            "【输出】%d 行，每行 %d 个星号。\n"
            "【样例】n = 2 时：\n**\n**" % (n, n),
            "用两层循环：外面管「第几行」，里面管「这一行有几个星号」；也可以直接 print(\"*\" * n)。",
            'n = %d\n'
            'for i in range(n):\n'
            '    print("*" * n)\n' % n,
            [""])


def shape_pyramid():
    """等腰三角形（金字塔）"""
    for n, name in [(3, "小帐篷"), (4, "小山"), (5, "金字塔"), (6, "大树")]:
        add("shape", 2, "%s：%d 层星星金字塔" % (name, n),
            "【任务】打印一座等腰三角形的星星塔。\n"
            "【输入】不需要输入。\n"
            "【输出】%d 行：第 i 行先打印 %d - i 个空格，再打印 2×i - 1 个星号。\n"
            "【样例】n = 3 时：\n  *\n ***\n*****" % (n, n),
            "空格数 = n - i，星号数 = 2 * i - 1，两个都用乘法拼出来再相加。",
            'n = %d\n'
            'for i in range(1, n + 1):\n'
            '    print(" " * (n - i) + "*" * (2 * i - 1))\n' % n,
            [""])


def shape_diamond():
    """菱形"""
    for n in [2, 3, 4]:
        add("shape", 2, "菱形宝石（半径 %d）" % n,
            "【任务】先变大再变小，打印一个菱形。\n"
            "【输入】不需要输入。\n"
            "【输出】上半部分是 %d 行越来越宽的星星，下半部分是 %d 行越来越窄的星星。\n"
            "【样例】n = 2 时：\n *\n***\n *" % (n, n - 1),
            "上半部分从 1 到 n 用金字塔的写法，下半部分再从 n - 1 倒回到 1 重复一遍。",
            'n = %d\n'
            'for i in range(1, n + 1):\n'
            '    print(" " * (n - i) + "*" * (2 * i - 1))\n'
            'for i in range(n - 1, 0, -1):\n'
            '    print(" " * (n - i) + "*" * (2 * i - 1))\n' % n,
            [""])


def shape_hollow_square():
    """空心正方形"""
    for n, ch in [(4, "*"), (5, "#"), (6, "*")]:
        add("shape", 2, "空心正方形（边长 %d，用 %s）" % (n, ch),
            "【任务】只画四条边，中间是空的。\n"
            "【输入】不需要输入。\n"
            "【输出】%d 行：第一行和最后一行是 %d 个 %s；中间几行是「一个 %s + 空格 + 一个 %s」。\n"
            "【样例】边长 3 时：\n%s%s%s\n%s %s\n%s%s%s" % (n, n, ch, ch, ch, ch, ch, ch, ch, ch, ch, ch, ch),
            "用 if 判断是不是第一行 / 最后一行；不是的话就拼「符号 + 空格 + 符号」。",
            'n = %d\n'
            'for i in range(n):\n'
            '    if i == 0 or i == n - 1:\n'
            '        print("%s" * n)\n'
            '    else:\n'
            '        print("%s" + " " * (n - 2) + "%s")\n' % (n, ch, ch, ch),
            [""])


def shape_number_triangle():
    """数字三角形"""
    for n in nums(3, 6):
        add("shape", 2, "数字三角形（%d 行）" % n,
            "【任务】把数字排成三角形。\n"
            "【输入】不需要输入。\n"
            "【输出】%d 行，第 i 行是从 1 到 i 的数字，数字之间用一个空格隔开。\n"
            "【样例】n = 3 时：\n1\n1 2\n1 2 3" % n,
            "里面再用一个小循环，把 1 到 i 的数字拼成字符串，注意最后一个数字后面不要多空格。",
            'n = %d\n'
            'for i in range(1, n + 1):\n'
            '    row = ""\n'
            '    for j in range(1, i + 1):\n'
            '        row = row + str(j) + " "\n'
            '    print(row.rstrip())\n' % n,
            [""])


def shape_stairs():
    """阶梯"""
    for n in nums(3, 6):
        add("shape", 2, "%d 级星星阶梯" % n,
            "【任务】打印一条越走越往右的阶梯。\n"
            "【输入】不需要输入。\n"
            "【输出】%d 行，第 i 行前面有 (i - 1) 个空格，然后是 i 个星号。\n"
            "【样例】n = 3 时：\n*\n **\n  ***" % n,
            "空格数比行号少 1：\" \" * (i - 1)，再接上 \"*\" * i。",
            'n = %d\n'
            'for i in range(1, n + 1):\n'
            '    print(" " * (i - 1) + "*" * i)\n' % n,
            [""])


def shape_parallelogram():
    """平行四边形"""
    for n in [3, 4, 5]:
        add("shape", 2, "斜斜的平行四边形（%d 行）" % n,
            "【任务】把正方形推斜一点。\n"
            "【输入】不需要输入。\n"
            "【输出】%d 行，每行 %d 个星号，第 i 行前面有 (n - i) 个空格。\n"
            "【样例】n = 3 时：\n  ***\n ***\n***" % (n, n),
            "每行都打印 n 个星号，只是前面的空格越来越少。",
            'n = %d\n'
            'for i in range(1, n + 1):\n'
            '    print(" " * (n - i) + "*" * n)\n' % n,
            [""])


def shape_sandglass():
    """沙漏"""
    for n in [2, 3]:
        add("shape", 3, "星星沙漏（%d 层）" % n,
            "【任务】上宽下窄，中间最细，像一个沙漏。\n"
            "【输入】不需要输入。\n"
            "【输出】先倒三角（%d 行）再正三角（%d 行），整体对称。\n"
            "【样例】n = 2 时：\n***\n *\n***" % (n, n - 1),
            "最宽的一行要重复一次放在中间：先倒着打印一遍，再正着打印一遍。",
            'n = %d\n'
            'for i in range(n, 0, -1):\n'
            '    print(" " * (n - i) + "*" * (2 * i - 1))\n'
            'for i in range(1, n):\n'
            '    print(" " * (n - i) + "*" * (2 * i - 1))\n' % n,
            [""])


def shape_multiplication_row():
    """乘法口诀表的一行"""
    for n in nums(2, 9):
        add("shape", 2, "乘法口诀表第 %d 行" % n,
            "【任务】打印九九乘法表的第 %d 行。\n"
            "【输入】不需要输入。\n"
            "【输出】一行，从 1x%d=… 一直到 %dx%d=…，每一项之间用一个空格隔开，最后不要多空格。\n"
            "【样例】n = 3 时：1x3=3 2x3=6 3x3=9" % (n, n, n, n),
            "用字符串累加：row += str(j) + \"x\" + str(n) + \"=\" + str(j * n) + \" \"，最后 rstrip() 去掉尾部空格。",
            'n = %d\n'
            'row = ""\n'
            'for j in range(1, n + 1):\n'
            '    row = row + str(j) + "x" + str(n) + "=" + str(j * n) + " "\n'
            'print(row.rstrip())\n' % n,
            [""])


# =====================================================================
# 二、字典 dict
# =====================================================================

def dict_lookup():
    """字典查分"""
    tables = [
        ("三年二班", {"小明": 95, "小红": 88, "小刚": 76}, ["小明", "小红", "小刚", "小美"]),
        ("水果价格表", {"苹果": 6, "香蕉": 4, "西瓜": 12}, ["苹果", "西瓜", "香蕉", "菠萝"]),
        ("动物叫声", {"猫": "喵喵", "狗": "汪汪", "牛": "哞哞"}, ["猫", "牛", "狗", "鸭子"]),
    ]
    for scene, data, names in tables:
        table_text = "、".join("%s→%s" % (k, v) for k, v in data.items())
        for name in names:
            add("dict", 2, "%s：查一查「%s」" % (scene, name),
                "【任务】用字典保存好资料，读入一个查询内容并输出结果。\n"
                "【输入】一行，一个查询内容（可能是字典里没有的）。\n"
                "【输出】如果字典里有，就输出它对应的值；如果没有，就输出「没有找到」。\n"
                "【样例】字典内容：%s。输入 %s 时按上面的规则输出。" % (table_text, name),
                "用 字典.get(键, 默认值)：找到就返回对应的值，找不到就返回你给的默认值，比用 [] 更安全。",
                'data = %r\n'
                'key = input().strip()\n'
                'print(data.get(key, "没有找到"))\n' % (data,),
                [name])


def dict_loop_print():
    """遍历字典"""
    tables = [
        ("课程表", {"语文": 8, "数学": 9, "体育": 3}),
        ("宠物数量", {"猫": 2, "狗": 1, "鱼": 5}),
        ("零花钱账本", {"零食": 15, "文具": 30, "玩具": 45}),
    ]
    for scene, data in tables:
        add("dict", 2, "%s：把字典一项一项念出来" % scene,
            "【任务】把字典里的内容按「键: 值」的格式逐行打印。\n"
            "【输入】不需要输入。\n"
            "【输出】每个键值对占一行，格式是 键: 值。\n"
            "【样例】字典里有两项时，就打印两行。" ,
            "用 for key, value in 字典.items(): 同时拿到键和值，再用 f\"{key}: {value}\" 打印。",
            'data = %r\n'
            'for key, value in data.items():\n'
            '    print(f"{key}: {value}")\n' % (data,),
            [""])


def dict_build_from_input():
    """读入数据建字典"""
    for n, scene in [(3, "小队身高"), (4, "同学成绩"), (5, "水果重量")]:
        lines = "\n".join("同学%d %d" % (i + 1, (i + 1) * 10) for i in range(n))
        add("dict", 3, "%s：读入 %d 条记录做成字典" % (scene, n),
            "【任务】前面 n 行每行是「名字 数值」，把它们存进字典，最后打印字典里有多少项。\n"
            "【输入】第一行一个整数 n（这里固定是 %d），接下来 n 行，每行一个名字和一个整数，用空格隔开。\n"
            "【输出】一行：字典里一共有几项（用 len()）。\n"
            "【样例】输入 3 行记录，就输出 3。" % n,
            "先 data = {}，然后循环 n 次：name, value = input().split()，再 data[name] = int(value)。",
            'n = int(input())\n'
            'data = {}\n'
            'for i in range(n):\n'
            '    name, value = input().split()\n'
            '    data[name] = int(value)\n'
            'print(len(data))\n',
            [str(n) + "\n" + lines])


def dict_word_count():
    """词频统计"""
    texts = [
        ("小猫钓鱼的故事关键词", "cat dog cat bird cat dog"),
        ("水果篮", "apple banana apple apple orange banana"),
        ("运动打卡", "run swim run run bike swim run"),
    ]
    for scene, text in texts:
        words = sorted(set(text.split()))
        add("dict", 3, "%s：统计每个词出现几次" % scene,
            "【任务】读入一行用空格隔开的单词，统计每个单词出现了多少次，然后按单词的字母顺序输出。\n"
            "【输入】一行，若干个用空格隔开的单词。\n"
            "【输出】每个出现过的单词占一行，格式是 单词 次数（按单词从小到大排序）。\n"
            "【样例】输入：%s" % text,
            "用字典 counts[word] = counts.get(word, 0) + 1 来数数，最后用 sorted(counts) 把键排好序再打印。",
            'counts = {}\n'
            'for word in input().split():\n'
            '    counts[word] = counts.get(word, 0) + 1\n'
            'for word in sorted(counts):\n'
            '    print(word, counts[word])\n',
            [text]),
        # 同一题型的另一组数据（换标题，避免雷同）
        add("dict", 3, "字母计数器：数一数「%s」里各字母" % words[0],
            "【任务】读入一行小写字母（可能连着写），统计每个字母出现次数并按字母顺序输出。\n"
            "【输入】一行，只包含小写字母。\n"
            "【输出】每个出现过的字母占一行，格式是 字母 次数（按字母从小到大）。\n"
            "【样例】输入：%s" % text.replace(" ", ""),
            "把字符串当成一串字符，用 for ch in 字符串 一个一个数，字典就派上用场了。",
            'counts = {}\n'
            'for ch in input().strip():\n'
            '    counts[ch] = counts.get(ch, 0) + 1\n'
            'for ch in sorted(counts):\n'
            '    print(ch, counts[ch])\n',
            [text.replace(" ", "")])


def dict_max_score():
    """字典里找最大值"""
    for scene, data in [
        ("跳绳比赛", {"小明": 120, "小红": 135, "小刚": 128}),
        ("投篮比赛", {"阿力": 8, "阿美": 12, "阿强": 10}),
        ("背单词", {"周一": 20, "周二": 25, "周三": 18}),
    ]:
        best = max(data, key=data.get)
        add("dict", 3, "%s：谁最厉害？" % scene,
            "【任务】字典里存着每个人的成绩，找出数值最大的那个人并输出。\n"
            "【输入】不需要输入。\n"
            "【输出】一行，格式是 名字 分数。\n"
            "【样例】如果字典是 %s，就输出 %s %d。" % (data, best, data[best]),
            "max(字典, key=字典.get) 能直接拿到「值最大」的那个键，很好用。",
            'data = %r\n'
            'best = max(data, key=data.get)\n'
            'print(best, data[best])\n' % (data,),
            [""])


def dict_update():
    """字典增删改"""
    add("dict", 3, "购物清单：加一样、去一样",
        "【任务】清单里先有 3 样东西，程序要读入两条指令：第一条是「要增加的东西」，第二条是「要划掉的东西」。\n"
        "【输入】两行文字，第一行是要加进清单的东西，第二行是要从清单里删掉的东西。\n"
        "【输出】先打印一行「加了xxx」，再打印一行「删了xxx」，最后打印剩下的清单（用 sorted 排序后一次性打印列表）。\n"
        "【样例】输入 牛奶 / 苹果，就按上面的顺序打印。",
        "用 列表.append() 加、用 列表.remove() 删；删除前先用 if 判断在不在，避免报错。",
        'items = ["苹果", "面包", "鸡蛋"]\n'
        'new_item = input().strip()\n'
        'items.append(new_item)\n'
        'print("加了" + new_item)\n'
        'old_item = input().strip()\n'
        'if old_item in items:\n'
        '    items.remove(old_item)\n'
        'print("删了" + old_item)\n'
        'print(sorted(items))\n',
        ["牛奶\n苹果", "巧克力\n面包", "香蕉\n鸡蛋"])


def dict_student_average():
    """用字典存多科成绩算平均"""
    add("dict", 3, "三科成绩算平均分",
        "【任务】读入三行分数（语文、数学、英语），存进字典，算出平均分。\n"
        "【输入】三行，每行一个整数。\n"
        "【输出】两行：第一行按 科目: 分数 打印，第二行打印平均分（保留 1 位小数）。\n"
        "【样例】输入 90 / 80 / 100，就按上面的格式输出。",
        "用字典把三科存起来，sum(字典.values()) / len(字典) 就是平均分，f\"{平均分:.1f}\" 保留一位小数。",
        'subjects = ["语文", "数学", "英语"]\n'
        'scores = {}\n'
        'for s in subjects:\n'
        '    scores[s] = int(input())\n'
        'for k, v in scores.items():\n'
        '    print(f"{k}: {v}")\n'
        'print(f"平均分 {sum(scores.values()) / len(scores):.1f}")\n',
        ["90\n80\n100", "75\n88\n92", "60\n60\n60"])


def dict_phone_book():
    """通讯录查询"""
    add("dict", 3, "小通讯录：查电话号码",
        "【任务】通讯录里存着几个人和他们的电话，读入一个名字，把电话打印出来。\n"
        "【输入】一行，一个人的名字。\n"
        "【输出】找到就输出「名字的电话是 号码」，找不到就输出「通讯录里没有这个人」。\n"
        "【样例】输入通讯录里有的名字时，就打印他的电话。",
        "用 if 名字 in 字典: 先判断，再决定打印哪一句，这样不会出现 KeyError。",
        'book = {"妈妈": "13800001111", "爸爸": "13900002222", "奶奶": "13700003333"}\n'
        'name = input().strip()\n'
        'if name in book:\n'
        '    print(name + "的电话是 " + book[name])\n'
        'else:\n'
        '    print("通讯录里没有这个人")\n',
        ["妈妈\n", "爸爸\n", "爷爷\n", "奶奶\n"])


# =====================================================================
# 三、函数 func
# =====================================================================

def func_add():
    """定义加法函数"""
    for a, b in [(3, 5), (12, 8), (100, 250), (7, 0)]:
        add("func", 2, "写一个加法函数：%d + %d" % (a, b),
            "【任务】自己定义一个函数 add(a, b) 返回两个数的和，然后调用它算出结果。\n"
            "【输入】不需要输入。\n"
            "【输出】一行，两个数的和。\n"
            "【样例】add(3, 5) 的结果是 8。",
            "定义函数的写法是 def 函数名(参数): 然后 return 结果；写完别忘了调用它并 print 出来。",
            'def add(a, b):\n'
            '    return a + b\n'
            '\n'
            'print(add(%d, %d))\n' % (a, b),
            [""])


def func_is_even():
    """判断偶数的函数"""
    for n in [4, 7, 12, 25, 100, 0]:
        add("func", 2, "写一个判断偶数的函数（%d）" % n,
            "【任务】定义函数 is_even(n)，是偶数返回 True，否则返回 False；用它判断一个数并打印「偶数」或「奇数」。\n"
            "【输入】不需要输入。\n"
            "【输出】一行，偶数 或 奇数。\n"
            "【样例】%d 应该输出 %s。" % (n, "偶数" if n % 2 == 0 else "奇数"),
            "n % 2 == 0 就是偶数；函数里可以直接 return n % 2 == 0。",
            'def is_even(n):\n'
            '    return n %% 2 == 0\n'
            '\n'
            'n = %d\n'
            'if is_even(n):\n'
            '    print("偶数")\n'
            'else:\n'
            '    print("奇数")\n' % n,
            [""])


def func_factorial():
    """阶乘函数"""
    for n in [3, 4, 5, 6, 7]:
        add("func", 3, "阶乘函数：%d! 等于多少" % n,
            "【任务】定义函数 fact(n)，返回 1×2×…×n；调用它算出结果。\n"
            "【输入】不需要输入。\n"
            "【输出】一行，一个整数。\n"
            "【样例】fact(5) = 120。",
            "先 result = 1，再 for i in range(1, n + 1): result *= i，最后 return result。",
            'def fact(n):\n'
            '    result = 1\n'
            '    for i in range(1, n + 1):\n'
            '        result = result * i\n'
            '    return result\n'
            '\n'
            'print(fact(%d))\n' % n,
            [""])


def func_is_prime():
    """质数判断函数"""
    for n in [7, 9, 13, 21, 29, 49, 97]:
        add("func", 3, "质数判断函数：%d 是质数吗" % n,
            "【任务】定义函数 is_prime(n)，是质数返回 True，否则返回 False；打印「质数」或「合数」。\n"
            "【输入】不需要输入。\n"
            "【输出】一行：质数 或 合数（1 也算合数，方便处理）。\n"
            "【样例】7 是质数，9 是合数。",
            "从 2 试到 n - 1，只要有一个能整除就不是质数；别忘了先排除小于 2 的情况。",
            'def is_prime(n):\n'
            '    if n < 2:\n'
            '        return False\n'
            '    for i in range(2, n):\n'
            '        if n %% i == 0:\n'
            '            return False\n'
            '    return True\n'
            '\n'
            'n = %d\n'
            'print("质数" if is_prime(n) else "合数")\n' % n,
            [""])


def func_list_average():
    """列表平均值函数"""
    for data in [[80, 90, 100], [60, 70], [5, 10, 15, 20], [1, 2, 3, 4, 5, 6]]:
        add("func", 3, "求平均值的函数（%d 个数）" % len(data),
            "【任务】定义函数 average(nums)，返回一组数字的平均数（保留 2 位小数打印）。\n"
            "【输入】不需要输入。\n"
            "【输出】一行，平均数，保留 2 位小数。\n"
            "【样例】average(%s) 的结果见输出。" % data,
            "sum(nums) / len(nums) 就是平均数，f\"{值:.2f}\" 可以保留两位小数。",
            'def average(nums):\n'
            '    return sum(nums) / len(nums)\n'
            '\n'
            'data = %r\n'
            'print(f"{average(data):.2f}")\n' % (data,),
            [""])


def func_reverse():
    """字符串反转函数"""
    for word in ["python", "panda", "12345", "hello", "星星"]:
        add("func", 3, "把字符串倒过来：%s" % word,
            "【任务】定义函数 reverse_text(s)，返回倒过来的字符串并打印。\n"
            "【输入】不需要输入。\n"
            "【输出】一行，倒过来的文字。\n"
            "【样例】%s 反过来是 %s。" % (word, word[::-1]),
            "Python 里 s[::-1] 就能把字符串倒过来；用循环一位一位拼也可以。",
            'def reverse_text(s):\n'
            '    return s[::-1]\n'
            '\n'
            'print(reverse_text(%r))\n' % word,
            [""])


def func_gcd():
    """最大公约数函数"""
    for a, b in [(12, 18), (9, 6), (100, 75), (7, 13)]:
        add("func", 3, "最大公约数函数：%d 和 %d" % (a, b),
            "【任务】定义函数 gcd(a, b) 求两个数的最大公约数并打印。\n"
            "【输入】不需要输入。\n"
            "【输出】一行，一个整数。\n"
            "【样例】gcd(12, 18) = 6。",
            "从大到小试：for i in range(min(a, b), 0, -1)，第一个能同时整除 a 和 b 的就是答案。",
            'def gcd(a, b):\n'
            '    for i in range(min(a, b), 0, -1):\n'
            '        if a %% i == 0 and b %% i == 0:\n'
            '            return i\n'
            '\n'
            'print(gcd(%d, %d))\n' % (a, b),
            [""])


def func_multiple_return():
    """函数返回多个结果"""
    for data in [[3, 9, 1, 7], [10, 20, 30], [5, 5, 5, 5, 2]]:
        add("func", 3, "一个函数同时算出最大、最小、总和（%d 个数）" % len(data),
            "【任务】定义函数 stat(nums)，同时返回最大值、最小值和总和，然后打印出来。\n"
            "【输入】不需要输入。\n"
            "【输出】三行：最大 xxx、最小 xxx、总和 xxx。\n"
            "【样例】数据是 %s 时按上面的格式输出。" % data,
            "return a, b, c 可以一次返回三个值；接收时写 x, y, z = 函数(...)。",
            'def stat(nums):\n'
            '    return max(nums), min(nums), sum(nums)\n'
            '\n'
            'big, small, total = stat(%r)\n'
            'print("最大", big)\n'
            'print("最小", small)\n'
            'print("总和", total)\n' % (data,),
            [""])


def func_recursion():
    """递归入门"""
    for n in [3, 5, 10]:
        add("func", 4, "递归函数：1 加到 %d" % n,
            "【任务】用递归写函数 total(n)：n 等于 1 时返回 1，否则返回 n + total(n - 1)。\n"
            "【输入】不需要输入。\n"
            "【输出】一行，一个整数。\n"
            "【样例】total(5) = 15。",
            "递归函数一定要有「什么时候停下来」的分支，不然会一直叫自己（RecursionError）。",
            'def total(n):\n'
            '    if n == 1:\n'
            '        return 1\n'
            '    return n + total(n - 1)\n'
            '\n'
            'print(total(%d))\n' % n,
            [""])


def func_seconds_to_hms():
    """秒数换算函数"""
    for sec in [65, 3600, 3725, 86399, 100]:
        add("func", 3, "把 %d 秒换成「几时几分几秒」" % sec,
            "【任务】定义函数 to_hms(seconds)，把它换成「x时y分z秒」并打印。\n"
            "【输入】不需要输入。\n"
            "【输出】一行，格式是 x时y分z秒（x 可以是 0）。\n"
            "【样例】65 秒 = 0时1分5秒。",
            "小时 = 秒 // 3600，剩下的秒 % 3600，再分出分钟和秒。",
            'def to_hms(seconds):\n'
            '    h = seconds // 3600\n'
            '    m = seconds %% 3600 // 60\n'
            '    s = seconds %% 60\n'
            '    return f"{h}时{m}分{s}秒"\n'
            '\n'
            'print(to_hms(%d))\n' % sec,
            [""])


# =====================================================================
# 四、趣味编程 fun
# =====================================================================

def fun_caesar():
    """凯撒密码"""
    for text, shift in [("abc", 3), ("hello", 1), ("xyz", 2), ("python", 5)]:
        add("fun", 3, "小侦探密码本：把「%s」往后移 %d 位" % (text, shift),
            "【任务】把每个小写字母往后移动 %d 位（超过 z 就绕回 a），读入一行文字，输出密码。\n"
            "【输入】一行，只包含小写字母。\n"
            "【输出】一行，加密后的文字。\n"
            "【样例】输入 %s，输出加密结果。" % (shift, text),
            "用 ord() 把字母变成数字，减去 a 的编号、加位移、对 26 取余，再用 chr() 变回字母。",
            'def encode(text, shift):\n'
            '    result = ""\n'
            '    for ch in text:\n'
            '        result += chr((ord(ch) - ord("a") + shift) %% 26 + ord("a"))\n'
            '    return result\n'
            '\n'
            'print(encode(input().strip(), %d))\n' % shift,
            [text])


def fun_zodiac():
    """十二生肖"""
    for year in [2000, 2011, 2018, 2024, 2035]:
        add("fun", 2, "%d 年是什么生肖？" % year,
            "【任务】读入一个年份，算出它的生肖。规则：生肖顺序固定为 鼠牛虎兔龙蛇马羊猴鸡狗猪，用「(年份 - 4) 除以 12 的余数」当下标。\n"
            "【输入】一行，一个整数年份。\n"
            "【输出】一行，一个生肖字。\n"
            "【样例】输入 %d，输出对应的生肖。" % year,
            "生肖表的顺序是固定的：鼠牛虎兔龙蛇马羊猴鸡狗猪。「(year - 4) 除以 12 的余数」正好是这个表的下标，用 % 求余数。",
            'animals = ["鼠", "牛", "虎", "兔", "龙", "蛇", "马", "羊", "猴", "鸡", "狗", "猪"]\n'
            'year = int(input())\n'
            'print(animals[(year - 4) % 12])\n',
            [str(year)])


def fun_receipt():
    """小票打印"""
    for name, price, count in [("铅笔", 3, 5), ("笔记本", 8, 2), ("橡皮", 2, 10)]:
        add("fun", 2, "小超市收银小票（%s × %d）" % (name, count),
            "【任务】读入商品名、单价、数量，打印一张小票。\n"
            "【输入】第一行商品名，第二行单价（整数），第三行数量（整数）。\n"
            "【输出】三行：第一行「商品：名字」，第二行「单价：x 元 × 数量 y」，第三行「合计：z 元」。\n"
            "【样例】输入 %s / %d / %d，按上面的格式输出。" % (name, price, count),
            "input() 拿到的是文字，单价和数量要用 int() 转成数字才能相乘。",
            'name = input().strip()\n'
            'price = int(input())\n'
            'count = int(input())\n'
            'print("商品：" + name)\n'
            'print(f"单价：{price} 元 × 数量 {count}")\n'
            'print(f"合计：{price * count} 元")\n',
            ["%s\n%d\n%d" % (name, price, count)])


def fun_center_text():
    """居中对齐打印"""
    for text, width in [("你好", 10), ("Python", 12), ("我爱编程", 14)]:
        add("fun", 2, "把「%s」打印在 %d 格宽的中间" % (text, width),
            "【任务】读入一行文字，把它居中打印在固定宽度里（用空格补两边）。\n"
            "【输入】一行文字。\n"
            "【输出】一行，文字在中间，两边用空格补齐到指定宽度（Python 的 center 会自动分配空格）。\n"
            "【样例】宽度是 %d 时，%s 会居中显示。" % (width, text),
            "字符串的 .center(宽度) 方法可以自动帮你在两边补空格。",
            'text = input().strip()\n'
            'print(text.center(%d))\n' % width,
            [text + "\n"])


def fun_bar_chart():
    """用方块画柱状图"""
    for data in [[3, 5, 2], [1, 4, 4, 2], [6, 2, 3, 1]]:
        add("fun", 2, "用★画一张小柱状图（%d 根柱子）" % len(data),
            "【任务】把一组数字画成柱状图，每个数字对应一行方块。\n"
            "【输入】不需要输入。\n"
            "【输出】%d 行，第 i 行是「数字: ★★★」，星号个数等于这个数字。\n"
            "【样例】数字 3 就打印 3: ★★★。" % len(data),
            "一行一行处理：先打印数字和冒号，再用 \"★\" * 数字。",
            'data = %r\n'
            'for n in data:\n'
            '    print(n, ":", "★" * n)\n' % (data,),
            [""])


def fun_binary():
    """十进制转二进制"""
    for n in [5, 10, 13, 100, 255]:
        add("fun", 3, "把 %d 换成二进制" % n,
            "【任务】读入一个十进制整数，用「除以 2 取余数」的办法手写转换，输出它的二进制。\n"
            "【输入】一行，一个正整数。\n"
            "【输出】一行，二进制数字（不要前缀 0b）。\n"
            "【样例】5 的二进制是 101。",
            "反复 n //= 2 并把 n % 2 记下来，最后把余数倒过来拼成字符串。",
            'n = int(input())\n'
            'bits = ""\n'
            'while n > 0:\n'
            '    bits = str(n % 2) + bits\n'
            '    n = n // 2\n'
            'print(bits if bits else "0")\n',
            [str(n)])


def fun_guess_hint():
    """猜数字提示机"""
    add("fun", 3, "猜数字提示机",
        "【任务】电脑心里想好了数字 42。读入 3 次猜测，每次给出提示：猜对了输出「猜对了」，猜小了输出「小了」，猜大了输出「大了」。\n"
        "【输入】三行，每行一个整数。\n"
        "【输出】三行提示。\n"
        "【样例】输入 30 就会输出「小了」。",
        "用 for 循环读三次，每次和 42 比较，注意三种情况要写完整。",
        'secret = 42\n'
        'for i in range(3):\n'
        '    guess = int(input())\n'
        '    if guess == secret:\n'
        '        print("猜对了")\n'
        '    elif guess < secret:\n'
        '        print("小了")\n'
        '    else:\n'
        '        print("大了")\n',
        ["30\n50\n42", "10\n20\n30", "99\n98\n97"])


def fun_poem():
    """诗句排版"""
    add("fun", 2, "古诗排版：一句一行",
        "【任务】读入一整句诗，把它按逗号拆开，每句占一行。\n"
        "【输入】一行诗句，用中文逗号分隔。\n"
        "【输出】每小句占一行。\n"
        "【样例】输入「床前明月光，疑是地上霜」就输出两行。",
        "字符串的 .split(\"，\") 可以按中文逗号切开，得到一个列表，再逐行打印。",
        'line = input().strip()\n'
        'for part in line.split("，"):\n'
        '    print(part)\n',
        ["床前明月光，疑是地上霜", "白日依山尽，黄河入海流", "春眠不觉晓，处处闻啼鸟"])


def fun_score_level():
    """成绩评语机"""
    for score in [95, 82, 71, 60, 45]:
        add("fun", 2, "%d 分的评语是什么" % score,
            "【任务】读入一个分数，打印对应的评语：90 分以上「优秀」，80 分以上「良好」，60 分以上「及格」，否则「加油」。\n"
            "【输入】一行，一个整数。\n"
            "【输出】一行评语。\n"
            "【样例】%d 分应输出对应的评语。" % score,
            "从高到低用 if / elif 判断，顺序反了就会出现「60 分也算优秀」的错误。",
            'score = int(input())\n'
            'if score >= 90:\n'
            '    print("优秀")\n'
            'elif score >= 80:\n'
            '    print("良好")\n'
            'elif score >= 60:\n'
            '    print("及格")\n'
            'else:\n'
            '    print("加油")\n',
            [str(score)])


def fun_ticket_price():
    """门票计价"""
    add("fun", 2, "动物园门票计算器",
        "【任务】成人票 40 元，儿童票 20 元。读入成人人数和儿童人数，算出总价。\n"
        "【输入】一行，两个用空格隔开的整数（成人 儿童）。\n"
        "【输出】一行：总价 x 元。\n"
        "【样例】输入 2 1，输出 总价 100 元。",
        "用 input().split() 一次读两个数，再分别 int() 转换。",
        'adult, child = input().split()\n'
        'total = int(adult) * 40 + int(child) * 20\n'
        'print(f"总价 {total} 元")\n',
        ["2 1", "0 3", "5 5", "1 0"])


def fun_countdown():
    """火箭倒计时"""
    add("fun", 1, "火箭发射倒计时",
        "【任务】读入一个整数 n，从 n 倒数到 1，每个数字一行，最后打印「发射！」。\n"
        "【输入】一行，一个整数。\n"
        "【输出】n 行数字，最后一行是 发射！\n"
        "【样例】输入 3，输出 3 / 2 / 1 / 发射！。",
        "for i in range(n, 0, -1) 就是倒着数；循环结束后再打印最后那一句。",
        'n = int(input())\n'
        'for i in range(n, 0, -1):\n'
        '    print(i)\n'
        'print("发射！")\n',
        ["3", "5", "1"])


# =====================================================================
# 五、海龟绘图 turtle（自己看效果，手动打勾）
# =====================================================================

def turtle_drawings():
    tasks = [
        ("画一个正方形", "让小海龟前进 100 再右转 90 度，重复 4 次。",
         'import turtle\n\nt = turtle.Turtle()\nfor i in range(4):\n    t.forward(100)\n    t.right(90)\n'),
        ("画一个三角形", "每次右转 120 度，正好转一圈 360 度。",
         'import turtle\n\nt = turtle.Turtle()\nfor i in range(3):\n    t.forward(120)\n    t.right(120)\n'),
        ("画一个六边形", "正多边形每次转的角度 = 360 ÷ 边数。",
         'import turtle\n\nt = turtle.Turtle()\nfor i in range(6):\n    t.forward(80)\n    t.right(60)\n'),
        ("画一个五角星", "五角星每次要转 144 度，画 5 条边。",
         'import turtle\n\nt = turtle.Turtle()\nt.pensize(3)\nt.color("#F59E0B")\nfor i in range(5):\n    t.forward(150)\n    t.right(144)\n'),
        ("画一个圆", "用 t.circle(半径) 就能画圆。",
         'import turtle\n\nt = turtle.Turtle()\nt.pensize(4)\nt.color("#3B82F6")\nt.circle(80)\n'),
        ("画三个同心圆", "圆越画越大，圆心保持不变。",
         'import turtle\n\nt = turtle.Turtle()\nt.speed(0)\nfor r in [30, 60, 90]:\n    t.penup()\n    t.goto(0, -r)\n    t.pendown()\n    t.circle(r)\n'),
        ("画一条彩虹螺旋", "每画一段就转 59 度，并换一种颜色。",
         'import turtle\n\nt = turtle.Turtle()\nt.speed(0)\nt.pensize(2)\ncolors = ["#EF4444", "#F97316", "#FACC15", "#22C55E", "#3B82F6", "#8B5CF6"]\nfor i in range(120):\n    t.pencolor(colors[i % len(colors)])\n    t.forward(i * 2)\n    t.right(59)\n'),
        ("画一个风车", "四片叶子，每画完一片就转 90 度。",
         'import turtle\n\nt = turtle.Turtle()\nt.speed(6)\nt.pensize(2)\ncolors = ["#EF4444", "#F59E0B", "#10B981", "#3B82F6"]\nfor i in range(4):\n    t.color(colors[i])\n    t.begin_fill()\n    t.forward(120)\n    t.right(90)\n    t.forward(40)\n    t.right(90)\n    t.forward(120)\n    t.end_fill()\n    t.left(180)\n    t.right(90)\n'),
        ("画一座小房子", "先用正方形当墙，再画一个三角形的屋顶。",
         'import turtle\n\nt = turtle.Turtle()\nt.speed(6)\nt.color("#F59E0B")\nfor i in range(4):\n    t.forward(120)\n    t.right(90)\nt.penup()\nt.goto(0, 120)\nt.pendown()\nt.color("#EF4444")\nt.goto(60, 180)\nt.goto(120, 120)\n'),
        ("画一个笑脸", "用两个小圆当眼睛，一段弧当嘴巴。",
         'import turtle\n\nt = turtle.Turtle()\nt.speed(6)\nt.pensize(3)\nt.color("#FBBF24")\nt.begin_fill()\nt.circle(80)\nt.end_fill()\nt.penup()\nt.goto(-28, 20)\nt.pendown()\nt.color("#1E293B")\nt.dot(12)\nt.penup()\nt.goto(28, 20)\nt.pendown()\nt.dot(12)\nt.penup()\nt.goto(-30, -15)\nt.pendown()\nt.right(90)\nt.circle(30, 180)\n'),
        ("画一个太阳", "中间一个黄圆，四周画一圈光芒。",
         'import turtle\n\nt = turtle.Turtle()\nt.speed(0)\nt.color("#FBBF24")\nt.begin_fill()\nt.circle(50)\nt.end_fill()\nfor i in range(12):\n    t.penup()\n    t.goto(0, 0)\n    t.setheading(i * 30)\n    t.forward(60)\n    t.pendown()\n    t.forward(40)\n'),
        ("画一朵雪花", "六条线，每条线上再分出小枝。",
         'import turtle\n\nt = turtle.Turtle()\nt.speed(0)\nt.color("#38BDF8")\nfor i in range(6):\n    t.penup()\n    t.goto(0, 0)\n    t.setheading(i * 60)\n    t.pendown()\n    t.forward(100)\n    t.backward(30)\n    t.right(45)\n    t.forward(30)\n    t.backward(30)\n    t.left(90)\n    t.forward(30)\n    t.backward(30)\n    t.right(45)\n'),
        ("画一串彩色方块", "每画一个方块就挪一点位置，颜色也换一换。",
         'import turtle\n\nt = turtle.Turtle()\nt.speed(0)\ncolors = ["#EF4444", "#F97316", "#FACC15", "#22C55E", "#3B82F6"]\nfor i in range(5):\n    t.penup()\n    t.goto(-200 + i * 90, 0)\n    t.pendown()\n    t.color(colors[i])\n    t.begin_fill()\n    for k in range(4):\n        t.forward(60)\n        t.right(90)\n    t.end_fill()\n'),
        ("画一座楼梯", "每上一级：前进、左转、前进、右转。",
         'import turtle\n\nt = turtle.Turtle()\nt.speed(6)\nt.pensize(3)\nt.color("#6366F1")\nfor i in range(6):\n    t.forward(40)\n    t.left(90)\n    t.forward(40)\n    t.right(90)\n'),
        ("画一颗爱心并填色", "用两段圆弧和两条线拼出爱心。",
         'import turtle\n\nt = turtle.Turtle()\nt.speed(6)\nt.pensize(3)\nt.color("#EF4444")\nt.begin_fill()\nt.left(50)\nt.forward(120)\nt.circle(45, 200)\nt.right(140)\nt.circle(45, 200)\nt.forward(120)\nt.end_fill()\n'),
        ("画一朵小花", "五片花瓣围成一圈。",
         'import turtle\n\nt = turtle.Turtle()\nt.speed(0)\nt.color("#F472B6")\nfor i in range(5):\n    t.penup()\n    t.goto(0, 0)\n    t.setheading(i * 72)\n    t.pendown()\n    t.begin_fill()\n    t.circle(35)\n    t.end_fill()\n'),
        ("画一道彩虹拱桥", "几段半圆，一层套一层，颜色从红到紫。",
         'import turtle\n\nt = turtle.Turtle()\nt.speed(0)\nt.pensize(8)\ncolors = ["#EF4444", "#F97316", "#FACC15", "#22C55E", "#3B82F6", "#8B5CF6"]\nfor i, c in enumerate(colors):\n    t.penup()\n    t.goto(-150, -i * 8)\n    t.setheading(0)\n    t.pendown()\n    t.pencolor(c)\n    t.circle(150, 180)\n'),
        ("画一个棋盘格", "用两层循环，一行一行地画小方块。",
         'import turtle\n\nt = turtle.Turtle()\nt.speed(0)\nfor row in range(4):\n    for col in range(4):\n        t.penup()\n        t.goto(-120 + col * 60, 120 - row * 60)\n        t.pendown()\n        if (row + col) % 2 == 0:\n            t.color("#1E293B")\n            t.begin_fill()\n        else:\n            t.color("#FFFFFF")\n        for k in range(4):\n            t.forward(60)\n            t.right(90)\n        t.end_fill()\n'),
        ("画自己的名字首字母", "用直线把字母拼出来。",
         'import turtle\n\nt = turtle.Turtle()\nt.speed(6)\nt.pensize(6)\nt.color("#8B5CF6")\nt.penup()\nt.goto(-50, -80)\nt.pendown()\nt.goto(-50, 80)\nt.goto(50, 80)\nt.penup()\nt.goto(-50, 0)\nt.pendown()\nt.goto(30, 0)\n'),
        ("画一棵圣诞树", "三层三角形加上树干。",
         'import turtle\n\nt = turtle.Turtle()\nt.speed(6)\nt.color("#16A34A")\nfor i in range(3):\n    t.penup()\n    t.goto(-60 + i * 20, -60 + i * 50)\n    t.pendown()\n    t.begin_fill()\n    t.goto(0, 30 + i * 50)\n    t.goto(60 - i * 20, -60 + i * 50)\n    t.goto(-60 + i * 20, -60 + i * 50)\n    t.end_fill()\nt.color("#92400E")\nt.begin_fill()\nfor i in range(2):\n    t.forward(24)\n    t.right(90)\n    t.forward(30)\n    t.right(90)\nt.end_fill()\n'),
        ("画一朵云", "几个圆叠在一起。",
         'import turtle\n\nt = turtle.Turtle()\nt.speed(0)\nt.color("#BFDBFE")\nfor x, r in [(-60, 40), (0, 55), (60, 40)]:\n    t.penup()\n    t.goto(x, 0)\n    t.pendown()\n    t.begin_fill()\n    t.circle(r)\n    t.end_fill()\n'),
        ("画一个螺旋方块", "每画一个越来越大的方块，就转一点角度。",
         'import turtle\n\nt = turtle.Turtle()\nt.speed(0)\nt.pensize(2)\nt.color("#06B6D4")\nfor i in range(36):\n    for k in range(4):\n        t.forward(20 + i * 4)\n        t.right(90)\n    t.right(10)\n'),
        ("画一条虚线", "抬笔、前进、落笔、前进，交替进行。",
         'import turtle\n\nt = turtle.Turtle()\nt.speed(6)\nt.pensize(3)\nfor i in range(8):\n    t.pendown()\n    t.forward(20)\n    t.penup()\n    t.forward(15)\n'),
        ("画一个奥运五环", "五个圆排成两行。",
         'import turtle\n\nt = turtle.Turtle()\nt.speed(0)\nt.pensize(4)\ncolors = ["#3B82F6", "#111827", "#EF4444", "#FACC15", "#22C55E"]\npos = [(-100, 0), (0, 0), (100, 0), (-50, -50), (50, -50)]\nfor (x, y), c in zip(pos, colors):\n    t.penup()\n    t.goto(x, y - 40)\n    t.pendown()\n    t.pencolor(c)\n    t.circle(40)\n'),
        ("画一个指南针", "圆圈里画一个指针。",
         'import turtle\n\nt = turtle.Turtle()\nt.speed(6)\nt.pensize(3)\nt.color("#334155")\nt.circle(80)\nt.penup()\nt.goto(0, 60)\nt.pendown()\nt.color("#EF4444")\nt.goto(0, -60)\nt.penup()\nt.goto(-40, 0)\nt.pendown()\nt.color("#334155")\nt.goto(40, 0)\n'),
        ("画一串气球", "三个圆加三条线。",
         'import turtle\n\nt = turtle.Turtle()\nt.speed(0)\ncolors = ["#F87171", "#60A5FA", "#FBBF24"]\nfor i, c in enumerate(colors):\n    x = -80 + i * 80\n    t.penup()\n    t.goto(x, 20)\n    t.pendown()\n    t.color(c)\n    t.begin_fill()\n    t.circle(35)\n    t.end_fill()\n    t.penup()\n    t.goto(x, -15)\n    t.pendown()\n    t.goto(x, -100)\n'),
        ("画一个螺旋迷宫", "一圈一圈往外走。",
         'import turtle\n\nt = turtle.Turtle()\nt.speed(0)\nt.pensize(2)\nt.color("#7C3AED")\nfor i in range(60):\n    t.forward(i * 4)\n    t.right(90)\n'),
    ]
    for title, desc, code in tasks:
        ITEMS.append(self_check(
            "turtle", 2, title,
            "【任务】%s\n【输入】不需要输入。\n【输出】右边的海龟画布上会出现图案（这类题没有文字答案，自己看效果）。" % desc,
            "照着代码里的注释改数字试试：边长、角度、颜色、循环次数，都会画出不一样的作品。",
            code + "\nprint(\"画完啦，快看看右边的画布！\")",
            tags=["海龟绘图", "手动检查"],
        ))


# =====================================================================
# 六、补充循环题型（让 loop 部分的练习量更均衡）
# =====================================================================

def loop_repeat_symbol():
    for n, ch in [(3, "*"), (5, "-"), (8, "=")]:
        add("loop", 1, "打印 %d 个「%s」" % (n, ch),
            "【任务】读入一个整数 n，把指定符号打印 n 次（在同一行）。\n"
            "【输入】一行，一个整数 n。\n"
            "【输出】一行，n 个符号连在一起。\n"
            "【样例】n = 3 时输出 3 个连在一起的符号。",
            "print(\"符号\" * n) 就能重复打印；也可以用循环一个一个拼。",
            'n = int(input())\n'
            'print("%s" * n)\n' % ch,
            [str(n)])


def loop_sum_evens():
    for n in [10, 20, 50, 7]:
        add("loop", 2, "求 1 到 %d 里所有偶数的和" % n,
            "【任务】读入 n，算出 1 到 n 之间所有偶数的和。\n"
            "【输入】一行，一个整数 n。\n"
            "【输出】一行，一个整数。\n"
            "【样例】n = 10 时，2+4+6+8+10 = 30。",
            "用 for i in range(2, n + 1, 2) 每次跳 2，就能只挑偶数。",
            'n = int(input())\n'
            'total = 0\n'
            'for i in range(2, n + 1, 2):\n'
            '    total += i\n'
            'print(total)\n',
            [str(n)])


def loop_count_digits():
    for n in [7, 42, 1234, 99999]:
        add("loop", 2, "数一数 %d 是几位数" % n,
            "【任务】读入一个正整数，输出它的位数。\n"
            "【输入】一行，一个正整数。\n"
            "【输出】一行，一个整数（位数）。\n"
            "【样例】1234 是 4 位数。",
            "最简单的办法：print(len(str(n)))。也可以用 while 循环不断 // 10 来数。",
            'n = int(input())\n'
            'count = 0\n'
            'while n > 0:\n'
            '    n = n // 10\n'
            '    count += 1\n'
            'print(count)\n',
            [str(n)])


def loop_sum_digits():
    for n in [123, 4567, 909, 1000]:
        add("loop", 2, "把 %d 各位数字加起来" % n,
            "【任务】读入一个正整数，把它每一位上的数字相加输出。\n"
            "【输入】一行，一个正整数。\n"
            "【输出】一行，一个整数。\n"
            "【样例】123 的各位数字和是 6。",
            "n % 10 拿到最后一位，n // 10 去掉最后一位，反复做直到 n 变成 0。",
            'n = int(input())\n'
            'total = 0\n'
            'while n > 0:\n'
            '    total += n % 10\n'
            '    n = n // 10\n'
            'print(total)\n',
            [str(n)])


def loop_max_of_inputs():
    scenes = [("称重量", "克"), ("测跳远", "厘米"), ("考试分数", "分")]
    for scene, unit in scenes:
        add("loop", 2, "%s：找出最大的数" % scene,
            "【任务】读入 n 个数，找出其中最大的一个。\n"
            "【输入】第一行一个整数 n，第二行 n 个用空格隔开的整数。\n"
            "【输出】一行，一个整数。\n"
            "【样例】输入 3 个数字，就输出其中最大的那个。",
            "先读第一行拿到 n，再 list(map(int, input().split())) 拿到所有数字，最后用 max()。",
            'n = int(input())\n'
            'nums = list(map(int, input().split()))\n'
            'print(max(nums))\n',
            ["3\n5 9 2", "5\n1 1 1 1 1", "4\n-3 -9 -1 -7"])


def loop_average_of_inputs():
    for case in ["3\n80 90 100", "4\n60 70 80 90", "5\n1 2 3 4 5", "2\n88 92"]:
        n = case.split("\n")[0]
        add("loop", 2, "算平均分（%s 个数）" % n,
            "【任务】读入 n 个数，输出它们的平均数（保留 2 位小数）。\n"
            "【输入】第一行一个整数 n，第二行 n 个用空格隔开的整数。\n"
            "【输出】一行，平均数，保留 2 位小数。\n"
            "【样例】输入 3 个数 80 90 100，输出 90.00。",
            "平均分 = sum(列表) / len(列表)；f\"{值:.2f}\" 可以保留两位小数。",
            'n = int(input())\n'
            'nums = list(map(int, input().split()))\n'
            'print(f"{sum(nums) / len(nums):.2f}")\n',
            [case])


FAMILIES = [
    shape_right_triangle, shape_inverted_triangle, shape_square, shape_pyramid,
    shape_diamond, shape_hollow_square, shape_number_triangle, shape_stairs,
    shape_parallelogram, shape_sandglass, shape_multiplication_row,
    dict_lookup, dict_loop_print, dict_build_from_input, dict_word_count,
    dict_max_score, dict_update, dict_student_average, dict_phone_book,
    func_add, func_is_even, func_factorial, func_is_prime, func_list_average,
    func_reverse, func_gcd, func_multiple_return, func_recursion, func_seconds_to_hms,
    fun_caesar, fun_zodiac, fun_receipt, fun_center_text, fun_bar_chart,
    fun_binary, fun_guess_hint, fun_poem, fun_score_level, fun_ticket_price,
    fun_countdown, turtle_drawings,
    loop_repeat_symbol, loop_sum_evens, loop_count_digits, loop_sum_digits,
    loop_max_of_inputs, loop_average_of_inputs,
]


def build():
    """一个家族出错不影响其它家族：坏掉的家族会被跳过并打印原因。"""
    ITEMS.clear()
    failed = []
    for fn in FAMILIES:
        before = len(ITEMS)
        try:
            fn()
        except Exception as exc:  # noqa: BLE001
            del ITEMS[before:]
            failed.append((fn.__name__, str(exc)[:110]))
    for name, why in failed:
        print("     ⚠️ 家族 %s 出错被跳过：%s" % (name, why))
    return ITEMS
