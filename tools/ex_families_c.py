"""题目家族 C —— 字符串 / 列表 / 字典 / 函数（GESP 二级、三级练习册）

覆盖 4 个主题：
  · str   字符串：长度、下标、切片、upper/lower/strip/split/join/replace/find/count、
                 反转、回文、统计字母、密码变形
  · list  列表：创建、下标、append/insert/remove/pop、sort/sorted、切片、
                 求和/最大/最小/平均、去重、查找、合并、二维列表
  · dict  字典：建字典、get、遍历 items/keys/values、词频统计、成绩表查询、增删改
  · func  函数：def、参数、return、默认参数、多个返回值、递归入门、用函数拆分问题

说明：所有题的期望输出都不是手写的，而是 exlib.exercise() 真正把参考答案跑一遍
      得到的真实输出。参考答案全部是能跑通的 Python 3。
"""

from exlib import exercise, self_check, pick, nums

# ======================= 场景词库（换着说，避免标题重复） =======================
FRUITS = ["apple", "banana", "watermelon", "strawberry", "pineapple", "mango",
          "grape", "cherry", "orange", "peach", "lemon", "coconut"]
ANIMALS = ["tiger", "panda", "dolphin", "elephant", "butterfly", "penguin",
           "giraffe", "monkey", "rabbit", "kangaroo", "squirrel", "turtle"]
SCHOOL = ["pencil", "notebook", "eraser", "ruler", "backpack", "classroom",
          "homework", "teacher", "student", "library"]
SPORTS = ["basketball", "football", "swimming", "running", "skating",
          "badminton", "tennis", "cycling"]
WEATHER = ["sunny", "rainy", "cloudy", "windy", "snowy", "stormy", "foggy"]
FOODS = ["noodles", "dumpling", "sandwich", "chocolate", "pancake", "popcorn"]


def _add(items, topic, level, title, desc, hint, answer, cases, tags=None):
    """把一道题加进题库：标准答案由 exlib.exercise 真正运行参考答案得到。"""
    items.append(exercise(topic=topic, level=level, title=title, desc=desc,
                          hint=hint, answer=answer, cases=cases, tags=tags))


def _d(pairs):
    """[("小明", 95), ...]  ->  '{"小明": 95, ...}'（拼出字典字面量文本）"""
    return "{" + ", ".join('"%s": %r' % (k, v) for k, v in pairs) + "}"


def build():
    items = []

    # ==================================================================
    #                         str  字符串
    # ==================================================================

    # -- str-01 求字符串长度 -------------------------------------------
    for i, (cn, w) in enumerate([("西瓜", "watermelon"), ("蝴蝶", "butterfly"),
                                 ("笔记本", "notebook"), ("篮球", "basketball"),
                                 ("巧克力", "chocolate"), ("企鹅", "penguin")]):
        _add(items, "str", 2,
             "数一数：%s的英文有几个字母" % cn,
             "输入一行，一个英文单词。输出这个单词一共有多少个字符。",
             "字符串也是有长度的哦，用 len(s) 一量就知道。",
             "s = input()\nprint(len(s))",
             [w, pick(ANIMALS, i + 3)])

    # -- str-02 取下标的字符 -------------------------------------------
    for i, (cn, w, k) in enumerate([("小猫", "kitten", 2), ("长颈鹿", "giraffe", 4),
                                    ("彩虹", "rainbow", 3), ("火箭", "rocket", 5)]):
        _add(items, "str", 2,
             "取出%s英文里的第 %d 个字母" % (cn, k),
             "输入一行，一个英文单词。输出它从左往右数第 %d 个字符。" % k,
             "下标从 0 开始数，所以「第 %d 个」要写成 s[%d]。" % (k, k - 1),
             "s = input()\nprint(s[%d])" % (k - 1),
             [w, pick(FRUITS, i)])

    # -- str-03 最后一个字符 -------------------------------------------
    for i, (cn, w) in enumerate([("书包", "backpack"), ("河马", "hippo"), ("风筝", "kite")]):
        _add(items, "str", 2,
             "%s的英文最后一个字母是什么" % cn,
             "输入一行，一个英文单词。输出这个单词的最后一个字符。",
             "下标写 -1 就是最后一个字符：print(s[-1])。",
             "s = input()\nprint(s[-1])",
             [w, pick(SCHOOL, i + 2)])

    # -- str-04 切片：前 n 个字符 --------------------------------------
    for i, (cn, w, n) in enumerate([("早餐", "breakfast", 4), ("图书馆", "library", 3),
                                    ("太阳花", "sunflower", 5)]):
        _add(items, "str", 2,
             "只取%s英文的前 %d 个字母" % (cn, n),
             "输入一行，一个英文单词。输出它最前面的 %d 个字符（连在一起，不要空格）。" % n,
             "切片 s[:%d] 表示「从头取到第 %d 个为止，不含第 %d 个」。" % (n, n, n),
             "s = input()\nprint(s[:%d])" % n,
             [w, pick(FOODS, i)])

    # -- str-05 切片：后 n 个字符 --------------------------------------
    for i, (cn, w, n) in enumerate([("芒果", "mango", 2), ("海豚", "dolphin", 3)]):
        _add(items, "str", 2,
             "取%s英文的最后 %d 个字母" % (cn, n),
             "输入一行，一个英文单词。输出它最后面的 %d 个字符（连在一起）。" % n,
             "s[-%d:] 就是从倒数第 %d 个一直取到最后。" % (n, n),
             "s = input()\nprint(s[-%d:])" % n,
             [w, pick(ANIMALS, i + 5)])

    # -- str-06 切片：中间一段 -----------------------------------------
    for i, (cn, w, a, b) in enumerate([("草莓", "strawberry", 2, 6), ("相机", "camera", 1, 4)]):
        _add(items, "str", 2,
             "剪下%s英文中间的一小段" % cn,
             "输入一行，一个英文单词。输出从第 %d 个字符到第 %d 个字符（含第 %d 个，不含第 %d 个）。"
             % (a + 1, b, a + 1, b + 1),
             "切片 s[%d:%d] 取的是下标 %d 到 %d 之间的字符。" % (a, b, a, b - 1),
             "s = input()\nprint(s[%d:%d])" % (a, b),
             [w, pick(FRUITS, i + 2)])

    # -- str-07 转大写 --------------------------------------------------
    for i, (cn, w) in enumerate([("班级口号", "go go go"), ("队名", "thunder"),
                                 ("城市名", "beijing")]):
        _add(items, "str", 2,
             "把%s全部变成大写" % cn,
             "输入一行英文（可能有好几个单词）。输出它全部大写的样子。",
             "upper() 负责把字母变成大写：print(s.upper())。",
             "s = input()\nprint(s.upper())",
             [w, pick(SPORTS, i)])

    # -- str-08 转小写 --------------------------------------------------
    for i, (cn, w) in enumerate([("英文名字", "ALICE"), ("星期", "MONDAY")]):
        _add(items, "str", 2,
             "把%s统一写成小写" % cn,
             "输入一行英文（大写字母组成）。输出它全部小写的样子。",
             "lower() 刚好和 upper() 相反，把字母变小写。",
             "s = input()\nprint(s.lower())",
             [w, pick(SCHOOL, i + 1).upper()])

    # -- str-09 去掉首尾空格 -------------------------------------------
    for i, (cn, raw) in enumerate([("输入框里的名字", "   xiaoming   "),
                                   ("抄错的单词", "  python  "),
                                   ("多打了空格的班级", "  class3  ")]):
        _add(items, "str", 2,
             "帮%s清理多余的空格" % cn,
             "输入一行，前后可能带着多余的空格。请先去掉首尾空格，再输出这个内容，"
             "第二行输出它去掉空格后的长度。",
             "strip() 会去掉字符串两头的空格，中间的空格不受影响。",
             "s = input().strip()\nprint(s)\nprint(len(s))",
             [raw, "   " + pick(FRUITS, i) + "   "])

    # -- str-10a 分割成列表 --------------------------------------------
    for i, (cn, line) in enumerate([("书包里的文具", "pen book ruler"),
                                    ("动物园名单", "panda tiger lion")]):
        _add(items, "str", 2,
             "把%s拆成一个列表" % cn,
             "输入一行，几个英文单词用空格隔开。输出拆开后的列表"
             "（就是方括号里用逗号分开的样子）。",
             "split() 会按空格把字符串切成一个列表：print(s.split())。",
             "s = input()\nprint(s.split())",
             [line, pick(WEATHER, i) + " " + pick(WEATHER, i + 2) + " rain"])

    # -- str-10b 每个单词占一行 -----------------------------------------
    for i, (cn, line) in enumerate([("购物清单", "milk bread egg"),
                                    ("旅行物品", "map camera hat")]):
        _add(items, "str", 2,
             "%s：一个单词打印一行" % cn,
             "输入一行，几个英文单词用空格隔开。请把每个单词单独打印一行。",
             "先用 split() 切开，再 for 循环一个词一行地 print。",
             "for w in input().split():\n    print(w)",
             [line, "apple " + pick(FOODS, i) + " water"])

    # -- str-11 用 join 连接 -------------------------------------------
    for i, (sep, cn, line) in enumerate([("-", "电话号码分组", "138 0013 8000"),
                                         ("+", "算式拼接", "1 2 3"),
                                         ("_", "文件名", "my first program")]):
        _add(items, "str", 2,
             "%s：用「%s」把它们连起来" % (cn, sep),
             "输入一行，几个单词或数字用空格隔开。输出用「%s」把它们连成一串的结果。" % sep,
             "「%s」.join(列表) 能把列表里的东西用「%s」粘起来。" % (sep, sep),
             "s = input()\nprint(\"%s\".join(s.split()))" % sep,
             [line, "a b c"])

    # -- str-12 replace 替换 -------------------------------------------
    for i, (cn, line, old, new) in enumerate([("把句子里的小狗换成小猫", "I like dog", "dog", "cat"),
                                              ("把句号换成感叹号", "good good", "good", "great"),
                                              ("把空格换成星号", "a b c", " ", "*")]):
        _add(items, "str", 3,
             "%s（replace 上场）" % cn,
             "输入一行文本。请把里面所有的「%s」都换成「%s」，然后输出结果。" % (old, new),
             "replace(旧, 新) 会把所有旧内容统统换掉。",
             "s = input()\nprint(s.replace(\"%s\", \"%s\"))" % (old, new),
             [line, "one two three"])

    # -- str-13 find 查找位置 -------------------------------------------
    for i, (cn, line, sub) in enumerate([("字母 a 藏在第几位", "banana", "n"),
                                         ("看看有没有 py", "happy day", "py")]):
        _add(items, "str", 3,
             "%s（用 find）" % cn,
             "输入一行文本。输出子串「%s」第一次出现的位置"
             "（下标从 0 开始数；如果一次都没出现，输出 -1）。" % sub,
             "find() 找不到时会返回 -1，找到就给下标。",
             "s = input()\nprint(s.find(\"%s\"))" % sub,
             [line, "zzz " + line])

    # -- str-14 count 数次数 -------------------------------------------
    for i, (ch, cn, line) in enumerate([("e", "字母 e 出现了几次", "elephant"),
                                        ("a", "字母 a 出现了几次", "banana"),
                                        ("l", "字母 l 出现了几次", "hello world")]):
        _add(items, "str", 2,
             "%s" % cn,
             "输入一行文本。输出字母「%s」在里面一共出现了多少次。" % ch,
             "count(字符) 专门用来数某个字符出现了几次。",
             "s = input()\nprint(s.count(\"%s\"))" % ch,
             [line, line + ch + ch])

    # -- str-15 反转字符串 ---------------------------------------------
    for i, (cn, w) in enumerate([("把单词倒过来写", "python"),
                                 ("倒着念的动物", "elephant"),
                                 ("反转的口令", "abcde")]):
        _add(items, "str", 2,
             "%s（切片反转）" % cn,
             "输入一行字符串。输出把它整个倒过来的结果。",
             "s[::-1] 是反转字符串的经典写法，步长写 -1 就是倒着走。",
             "s = input()\nprint(s[::-1])",
             [w, pick(SPORTS, i)])

    # -- str-16 判断回文 ------------------------------------------------
    for i, (cn, w) in enumerate([("「level」是不是回文", "level"),
                                 ("「radar」是不是回文", "radar"),
                                 ("「python」是不是回文", "python")]):
        _add(items, "str", 3,
             "%s" % cn,
             "输入一行字符串（全是小写字母）。如果它正着读和倒着读一样，输出「是回文」，"
             "否则输出「不是回文」。",
             "先把它倒过来，再和原来的比较：if s == s[::-1]:",
             "s = input().lower()\nif s == s[::-1]:\n    print(\"是回文\")\nelse:\n    print(\"不是回文\")",
             [w, pick(ANIMALS, i)])

    # -- str-17 数元音字母 ----------------------------------------------
    for i, (cn, w) in enumerate([("数一数单词里有几个元音", "beautiful"),
                                 ("元音大搜查", "education"),
                                 ("把元音找出来数一数", "computer")]):
        _add(items, "str", 3,
             "%s（a e i o u）" % cn,
             "输入一行小写英文。输出里面元音字母（a、e、i、o、u）一共有几个。",
             "一个字符一个字符地看：if ch in \"aeiou\": 就说明它是元音。",
             "s = input().lower()\nn = 0\nfor ch in s:\n    if ch in \"aeiou\":\n        n += 1\nprint(n)",
             [w, pick(FOODS, i)])

    # -- str-18 数大写字母 ----------------------------------------------
    for i, (cn, s) in enumerate([("数数这句口号有几个人写字母", "Go GO GO"),
                                 ("混合大小写的密码", "AbCdEfG")]):
        _add(items, "str", 3,
             "%s" % cn,
             "输入一行字符串（里面有大写、小写和符号）。输出大写字母一共有几个。",
             "判断大写可以写 if \"A\" <= ch <= \"Z\":，也可以用 ch.isupper()。",
             "s = input()\nn = 0\nfor ch in s:\n    if \"A\" <= ch <= \"Z\":\n        n += 1\nprint(n)",
             [s, s + "XYZ"])

    # -- str-19 数数字字符 ----------------------------------------------
    for i, (cn, s) in enumerate([("密码里有几个数字", "abc123xy9"),
                                 ("统计号码里的数字", "a1b2c3d4")]):
        _add(items, "str", 3,
             "%s" % cn,
             "输入一行字符串（字母和数字混在一起）。输出数字字符一共有几个。",
             "数字字符可以写 if \"0\" <= ch <= \"9\":，也可以用 ch.isdigit()。",
             "s = input()\nn = 0\nfor ch in s:\n    if \"0\" <= ch <= \"9\":\n        n += 1\nprint(n)",
             [s, s + "77"])

    # -- str-20 首字母缩写 ----------------------------------------------
    for i, (cn, line) in enumerate([("把机构名变成缩写", "world health organization"),
                                    ("给口号做缩写", "as soon as possible")]):
        _add(items, "str", 3,
             "%s" % cn,
             "输入一行英文（几个单词，全小写）。取每个单词的第一个字母并变成大写，"
             "拼在一起输出。",
             "先用 split() 分成单词，再取每个词的 w[0]，最后 upper()。",
             "words = input().split()\nr = \"\"\nfor w in words:\n    r += w[0].upper()\nprint(r)",
             [line, "happy new year"])

    # -- str-21 数单词个数 ----------------------------------------------
    for i, (cn, line) in enumerate([("数一数这句话有几个单词", "I love python very much"),
                                    ("作文有多少个词", "today is a sunny day")]):
        _add(items, "str", 2,
             "%s" % cn,
             "输入一行英文句子（单词之间用一个空格隔开）。输出它一共有多少个单词。",
             "split() 切出来的列表有多长，就有多少个单词。",
             "s = input()\nprint(len(s.split()))",
             [line, "one two three four"])

    # -- str-22 每个单词首字母大写 --------------------------------------
    for i, (cn, line) in enumerate([("把书名每个单词首字母变大写", "harry potter and the stone"),
                                    ("把标题写规范", "my first python program")]):
        _add(items, "str", 3,
             "%s" % cn,
             "输入一行英文（全小写，几个单词）。把每个单词的第一个字母变成大写，"
             "其余字母不动，再拼回一句话输出（单词之间一个空格）。",
             "w[0].upper() + w[1:] 就是「首字母大写 + 后面的部分」。",
             "words = input().split()\nout = []\nfor w in words:\n    out.append(w[0].upper() + w[1:])\nprint(\" \".join(out))",
             [line, "hello beautiful world"])

    # -- str-23 找最长的单词 --------------------------------------------
    for i, (cn, line) in enumerate([("谁的名字最长", "tom alice bob christopher"),
                                    ("哪个单词最长", "cat elephant dog")]):
        _add(items, "str", 3,
             "%s" % cn,
             "输入一行英文单词，用空格隔开。输出其中最长的那一个单词"
             "（如果有好几个一样长，输出最先出现的那个）。",
             "先假设第一个最长，然后一个个比 len()，遇到更长的就换掉。",
             "words = input().split()\nbest = words[0]\nfor w in words:\n    if len(w) > len(best):\n        best = w\nprint(best)",
             [line, "a bb ccc dddd"])

    # -- str-24 删掉所有空格 --------------------------------------------
    for i, (cn, line) in enumerate([("把句子里的空格全删掉", "p y t h o n"),
                                    ("挤在一起的问候", "hello world")]):
        _add(items, "str", 2,
             "%s" % cn,
             "输入一行文本。请删掉里面所有的空格，输出剩下的内容。",
             "replace(\" \", \"\") 把空格换成「什么都没有」，就等于删掉了。",
             "s = input()\nprint(s.replace(\" \", \"\"))",
             [line, "a b c"])

    # -- str-25 数字字符串求和 ------------------------------------------
    for i, (cn, line) in enumerate([("把一行数字加起来", "10 20 30"),
                                    ("购物小票求和", "5 8 12 3")]):
        _add(items, "str", 3,
             "%s" % cn,
             "输入一行，几个整数用空格隔开。输出这些数的总和。",
             "split() 之后每个还是字符串，要先用 int() 转成整数才能相加。",
             "a = input().split()\ntotal = 0\nfor x in a:\n    total += int(x)\nprint(total)",
             [line, "1 2 3 4 5"])

    # -- str-26 交换首尾字符 --------------------------------------------
    for i, (cn, w) in enumerate([("把首尾两个字母换个位置", "python"),
                                 ("首尾调换的游戏", "tiger")]):
        _add(items, "str", 3,
             "%s" % cn,
             "输入一行字符串。把第一个字符和最后一个字符交换位置，输出新的字符串。",
             "s[-1] + s[1:-1] + s[0] 就拼出了「尾巴 + 中间 + 头」。",
             "s = input()\nprint(s[-1] + s[1:-1] + s[0])",
             [w, pick(FRUITS, i)])

    # -- str-27 判断结尾 ------------------------------------------------
    for i, (cn, tail, yes_w, no_w) in enumerate([("判断是不是进行时", "ing", "running", "cat"),
                                                 ("判断是不是复数", "s", "apples", "book")]):
        _add(items, "str", 3,
             "%s（endswith）" % cn,
             "输入一行英文单词。如果它以「%s」结尾，输出「是」，否则输出「不是」。" % tail,
             "s.endswith(\"%s\") 会给你 True 或 False，直接拿去 if 判断。" % tail,
             "s = input()\nif s.endswith(\"%s\"):\n    print(\"是\")\nelse:\n    print(\"不是\")" % tail,
             [yes_w, no_w])

    # -- str-28 逐字符打印 ----------------------------------------------
    for i, (cn, w) in enumerate([("把单词拆成一个个字母打印", "star"),
                                 ("密码逐位显示", "0721")]):
        _add(items, "str", 2,
             "%s" % cn,
             "输入一行字符串。请把每个字符单独打印一行。",
             "字符串可以直接 for 循环，每次拿到一个字符。",
             "s = input()\nfor ch in s:\n    print(ch)",
             [w, pick(ANIMALS, i)])

    # -- str-29 字符串重复 ----------------------------------------------
    for i, (cn, w, n) in enumerate([("口号喊三遍", "hey ", 3), ("打印两行星星", "*", 5)]):
        _add(items, "str", 2,
             "%s" % cn,
             "第一行输入一个字符串，第二行输入一个整数 n。输出把这个字符串重复 n 遍的结果。",
             "字符串乘整数就是重复：s * n。两行输入记得写两个 input()。",
             "s = input()\nn = int(input())\nprint(s * n)",
             ["%s\n%d" % (w, n), "%s\n%d" % (pick(["go ", "ha "], i), n + 1)])

    # -- str-30 拼接两行 ------------------------------------------------
    for i, (cn, a, b) in enumerate([("把姓和名拼起来", "xiao", "ming"),
                                    ("把城市和国家拼起来", "beijing", "china")]):
        _add(items, "str", 2,
             "%s" % cn,
             "第一行输入一段文字，第二行再输入一段文字。输出把它们直接连在一起的结果。",
             "字符串相加就是拼接：a + b。",
             "a = input()\nb = input()\nprint(a + b)",
             ["%s\n%s" % (a, b), "%s\n%s" % (b, a)])

    # -- str-31 凯撒密码（后移 k 位） ------------------------------------
    for k in [1, 3]:
        _add(items, "str", 4,
             "密码变形：每个字母向后移动 %d 位" % k,
             "输入一行小写英文（不含空格）。请把每个字母在字母表里向后移动 %d 位"
             "（z 后面绕回 a），输出变形后的密码。" % k,
             "ord(ch) 得到字母编号，减去 97 再加 %d，对 26 取余，最后 chr() 变回字母。" % k,
             "s = input()\nout = \"\"\nfor ch in s:\n"
             "    out += chr((ord(ch) - 97 + %d) %% 26 + 97)\nprint(out)" % k,
             [pick(["cat", "dog", "zebra", "pizza"], k), "abcxyz"])

    # -- str-32 密码变形：首字母大写 + 编号 ---------------------------------
    for i, (cn, w, num) in enumerate([("给%s做游戏密码" % "王牌", "tiger", "77"),
                                      ("给冠军队伍做密码", "champion", "01")]):
        _add(items, "str", 3,
             "%s" % cn,
             "输入一行小写单词。请把第一个字母变成大写，其余不变，再在末尾接上「%s」，"
             "输出这个新密码。" % num,
             "w[0].upper() + w[1:] 完成首字母大写，再接上编号就行。",
             "s = input()\nprint(s[0].upper() + s[1:] + \"%s\")" % num,
             [w, pick(ANIMALS, i + 4)])

    # -- str-33 找出某个字母的所有位置 -----------------------------------
    for i, (cn, ch, w) in enumerate([("字母 a 都躲在哪里", "a", "banana"),
                                     ("字母 o 都躲在哪里", "o", "tomorrow")]):
        _add(items, "str", 3,
             "%s（输出下标）" % cn,
             "输入一行小写英文。请找出字母「%s」出现的每一个位置（下标从 0 开始），"
             "从小到大输出，中间用一个空格隔开。" % ch,
             "用 for i in range(len(s)) 拿到每个下标，再判断 s[i] 是不是要找的字母。",
             "s = input()\npos = []\nfor i in range(len(s)):\n"
             "    if s[i] == \"%s\":\n        pos.append(str(i))\nprint(\" \".join(pos))" % ch,
             [w, pick(["anaconda", "potato", "cabana"], i)])

    # -- str-34 字符排序 -------------------------------------------------
    for i, (cn, w) in enumerate([("把字母排排队（从小到大）", "python"),
                                 ("给密码的字符排序", "tiger")]):
        _add(items, "str", 3,
             "%s" % cn,
             "输入一行小写英文。把里面的字符按字母表顺序从小到大重新排列，"
             "拼成一个新字符串输出。",
             "sorted(s) 会得到一个排好序的字符列表，再用 \"\".join() 拼回去。",
             "s = input()\nprint(\"\".join(sorted(s)))",
             [w, pick(ANIMALS, i + 2)])

    # -- str-35 字母分类统计 ---------------------------------------------
    for i, (cn, s) in enumerate([("一句话里大写、小写、数字各有多少", "Abc123XY"),
                                 ("密码体检报告", "aB3dE5")]):
        _add(items, "str", 3,
             "%s" % cn,
             "输入一行字符串（字母数字混在一起）。请按顺序输出三个数：大写字母个数、"
             "小写字母个数、数字个数，中间用一个空格隔开。",
             "用三个计数器，一边 for 循环一边分类累加，最后 print(up, low, dig)。",
             "s = input()\nup = 0\nlow = 0\ndig = 0\nfor ch in s:\n"
             "    if \"A\" <= ch <= \"Z\":\n        up += 1\n"
             "    elif \"a\" <= ch <= \"z\":\n        low += 1\n"
             "    elif \"0\" <= ch <= \"9\":\n        dig += 1\nprint(up, low, dig)",
             [s, s + "Zz9"])

    # -- str-36 逗号连接 + 全大写 -----------------------------------------
    for i, (cn, line) in enumerate([("把单词表变成大写的逗号串", "red green blue"),
                                    ("把菜单写成一行", "rice soup fish")]):
        _add(items, "str", 3,
             "%s" % cn,
             "输入一行英文单词，用空格隔开。请先把整行变成大写，再用逗号「,」把单词连起来输出。",
             "可以链式调用：input().upper().split() 先大写再切分。",
             "words = input().upper().split()\nprint(\",\".join(words))",
             [line, "a b c d"])

    # -- str-37 生成用户名 -----------------------------------------------
    for i, (cn, name, num) in enumerate([("给新同学生成用户名", "xiaoming", "2026"),
                                         ("给社团成员生成账号", "Lihua", "007")]):
        _add(items, "str", 3,
             "%s" % cn,
             "第一行输入姓名（英文），第二行输入学号（数字）。请取姓名的前 3 个字母并变成小写，"
             "再接上学号，输出这个用户名。",
             "name[:3].lower() 拿到前三个字母并变小写，再用 + 接上学号。",
             "name = input()\nnum = input()\nprint(name[:3].lower() + num)",
             ["%s\n%s" % (name, num), "%s\n%s" % (pick(ANIMALS, i), "123")])

    # -- str-38 比较两行是否一样 ------------------------------------------
    for i, (cn, a, b) in enumerate([("两次输入的密码一样吗", "abc123", "abc123"),
                                    ("核对两行文字", "hello", "world")]):
        _add(items, "str", 2,
             "%s" % cn,
             "第一行输入一段文字，第二行再输入一段文字。如果两行完全一样，输出「相同」，"
             "否则输出「不同」。",
             "用 == 比较两个字符串，再交给 if 判断。",
             "a = input()\nb = input()\nif a == b:\n    print(\"相同\")\nelse:\n    print(\"不同\")",
             ["%s\n%s" % (a, b), "%s\n%s" % (b, a)])

    # -- str-39 判断子串是否存在 ------------------------------------------
    for i, (cn, sub) in enumerate([("句子里有没有「an」", "an"), ("名字里有没有「li」", "li")]):
        _add(items, "str", 3,
             "%s（用 in）" % cn,
             "输入一行英文。如果里面包含「%s」这两个字母（连在一起），输出「有」，"
             "否则输出「没有」。" % sub,
             "子串判断很简单：if \"%s\" in s:" % sub,
             "s = input()\nif \"%s\" in s:\n    print(\"有\")\nelse:\n    print(\"没有\")" % sub,
             [pick(["banana", "panda", "orange"], i), pick(["tiger", "dog"], i)])

    # ==================================================================
    #                         list  列表
    # ==================================================================

    # -- list-01 读成列表并输出 -----------------------------------------
    for i, (cn, line) in enumerate([("把考试成绩存进列表", "95 88 76 60"),
                                    ("把跳绳次数存进列表", "120 98 135 110 150"),
                                    ("把一周气温存进列表", "28 30 27 31 29")]):
        _add(items, "list", 2,
             "%s" % cn,
             "输入一行，几个整数用空格隔开。请把它们读成一个列表并原样输出"
             "（方括号里用逗号隔开的样子）。",
             "标准写法：a = list(map(int, input().split()))，然后 print(a)。",
             "a = list(map(int, input().split()))\nprint(a)",
             [line, pick(["1 2 3 4 5", "7 7 7", "10 20 30"], i)])

    # -- list-02 列表长度 ------------------------------------------------
    for i, (cn, line) in enumerate([("书架上一共有几本书", "3 5 8 2 9 4"),
                                    ("篮子里有几个水果", "12 7 9")]):
        _add(items, "list", 2,
             "%s" % cn,
             "输入一行，几个整数用空格隔开。输出这个列表里一共有几个元素。",
             "len(a) 就是列表的长度，也就是里面装了几个元素。",
             "a = list(map(int, input().split()))\nprint(len(a))",
             [line, "1 2 3 4 5 6 7"])

    # -- list-03 取第 k 个元素 -------------------------------------------
    for i, (cn, k) in enumerate([("第 %d 位选手的得分" % 3, 3),
                                 ("第 %d 个星期的销量" % 2, 2),
                                 ("第 %d 天的降雨量" % 4, 4)]):
        _add(items, "list", 2,
             "%s" % cn,
             "输入一行，至少 %d 个整数用空格隔开。输出从左数第 %d 个元素（从 1 开始数）。" % (k, k),
             "列表下标也从 0 开始，所以第 %d 个元素是 a[%d]。" % (k, k - 1),
             "a = list(map(int, input().split()))\nprint(a[%d])" % (k - 1),
             [pick(["88 92 75 60 99", "5 10 15 20 25", "3 6 9 12 15"], i)])

    # -- list-04 最后一个元素 --------------------------------------------
    for i, (cn, line) in enumerate([("最后一位冲过终点的是谁", "12 8 15 20"),
                                    ("今天最后一次测量的温度", "26 27 29 31")]):
        _add(items, "list", 2,
             "%s" % cn,
             "输入一行，几个整数用空格隔开。输出列表里最后一个元素。",
             "a[-1] 就是最后一个元素，不用去数长度。",
             "a = list(map(int, input().split()))\nprint(a[-1])",
             [line, pick(["4 5 6 7 8", "9 9 2"], i)])

    # -- list-05 倒数第 k 个 ---------------------------------------------
    for i, (cn, k) in enumerate([("倒数第 %d 名的分数" % 2, 2), ("倒数第 %d 个数据" % 3, 3)]):
        _add(items, "list", 3,
             "%s" % cn,
             "输入一行，至少 %d 个整数用空格隔开。输出从右往左数第 %d 个元素。" % (k, k),
             "倒数第 %d 个写成 a[-%d]。" % (k, k),
             "a = list(map(int, input().split()))\nprint(a[-%d])" % k,
             [pick(["70 85 90 66 100", "11 22 33 44 55"], i)])

    # -- list-06 修改某个元素 --------------------------------------------
    for i, (cn, k, new) in enumerate([("把第 %d 个成绩改成 %d" % (2, 100), 2, 100),
                                      ("把第 %d 天的温度改成 %d" % (1, 35), 1, 35)]):
        _add(items, "list", 2,
             "%s" % cn,
             "输入一行，至少 %d 个整数用空格隔开。请把第 %d 个元素改成 %d，"
             "然后输出整个列表。" % (k, k, new),
             "列表可以像这样直接改：a[%d] = %d。" % (k - 1, new),
             "a = list(map(int, input().split()))\na[%d] = %d\nprint(a)" % (k - 1, new),
             [pick(["60 70 80 90", "12 15 18 21"], i)])

    # -- list-07 append 追加 ---------------------------------------------
    for i, (cn, num) in enumerate([("又来了一个新同学的成绩", 66), ("新买的一本书的页数", 320)]):
        _add(items, "list", 2,
             "%s（append 追加）" % cn,
             "第一行输入几个整数用空格隔开，第二行输入一个整数。请把这个整数追加到列表末尾，"
             "再输出整个列表。",
             "a.append(x) 会把 x 加到列表最后面。",
             "a = list(map(int, input().split()))\nx = int(input())\na.append(x)\nprint(a)",
             ["%s\n%d" % (pick(["85 90 78", "100 200 150"], i), num),
              "%s\n%d" % ("1 2 3", num + 1)])

    # -- list-08 insert 插入 ---------------------------------------------
    for i, (cn, k, num) in enumerate([("把新成绩插到第 %d 位" % 2, 2, 99),
                                      ("把新数据插到最前面", 1, 0)]):
        _add(items, "list", 3,
             "%s" % cn,
             "第一行输入几个整数用空格隔开，第二行输入一个整数 x。请把 x 插入到第 %d 个位置"
             "（原来的元素整体往后挪），再输出整个列表。" % k,
             "a.insert(位置下标, x) 会把 x 插到指定下标处，原来的元素往后让位。",
             "a = list(map(int, input().split()))\nx = int(input())\na.insert(%d, x)\nprint(a)" % (k - 1),
             ["%s\n%d" % (pick(["70 80 90", "5 6 7"], i), num),
              "%s\n%d" % ("1 2 3 4", num)])

    # -- list-09 remove 删除值 -------------------------------------------
    for i, (cn, num) in enumerate([("删掉这个不及格的分数", 45), ("删掉这个重复的数字", 7)]):
        _add(items, "list", 3,
             "%s（remove）" % cn,
             "第一行输入几个整数用空格隔开，第二行输入一个整数 x（保证它在列表里）。"
             "请把列表里第一个等于 x 的元素删掉，再输出整个列表。",
             "a.remove(x) 是按「值」删除，只删掉找到的第一个。",
             "a = list(map(int, input().split()))\nx = int(input())\na.remove(x)\nprint(a)",
             ["%s\n%d" % (pick(["45 88 60 45 72", "7 3 7 9"], i), num),
              "%s\n%d" % ("10 20 30", 20)])

    # -- list-10 pop 删末尾 ----------------------------------------------
    for i, (cn, line) in enumerate([("去掉最后一项成绩", "88 76 95 60"), ("退掉最后一件商品", "12 8 15 20")]):
        _add(items, "list", 2,
             "%s（pop）" % cn,
             "输入一行，几个整数用空格隔开。请删掉最后一个元素，再输出剩下的列表。",
             "a.pop() 会把最后一个元素取走，列表就少了一个。",
             "a = list(map(int, input().split()))\na.pop()\nprint(a)",
             [line, pick(["1 2 3 4 5", "9 8 7"], i)])

    # -- list-11 pop 指定位置并输出被删的 ---------------------------------
    for i, (cn, k) in enumerate([("被取消的是第 %d 项" % 2, 2), ("取走排在第 %d 位的数据" % 3, 3)]):
        _add(items, "list", 3,
             "%s" % cn,
             "输入一行，至少 %d 个整数用空格隔开。请取走第 %d 个元素：第一行输出被取走的数，"
             "第二行输出剩下的列表。" % (k, k),
             "a.pop(%d) 会取走下标 %d 的元素并把它返回，可以用变量接住再打印。" % (k - 1, k - 1),
             "a = list(map(int, input().split()))\nx = a.pop(%d)\nprint(x)\nprint(a)" % (k - 1),
             [pick(["10 20 30 40", "5 6 7 8 9"], i)])

    # -- list-12 sort 升序 -----------------------------------------------
    for i, (cn, line) in enumerate([("把成绩从低到高排一排", "88 60 95 72 100"),
                                    ("把身高从矮到高排队", "135 128 150 142"),
                                    ("把销量从小到大排序", "30 12 45 8")]):
        _add(items, "list", 2,
             "%s（sort）" % cn,
             "输入一行，几个整数用空格隔开。请从小到大排序，输出排好序的列表。",
             "a.sort() 会原地把列表排成从小到大。",
             "a = list(map(int, input().split()))\na.sort()\nprint(a)",
             [line, pick(["3 1 4 1 5", "9 2 7"], i)])

    # -- list-13 sort 降序 -----------------------------------------------
    for i, (cn, line) in enumerate([("从高到低排出名次", "88 60 95 72"), ("把分数从大到小排", "5 19 3 12")]):
        _add(items, "list", 2,
             "%s（sort 降序）" % cn,
             "输入一行，几个整数用空格隔开。请从大到小排序，输出排好序的列表。",
             "a.sort(reverse=True) 就是倒着排（从大到小）。注意 sort() 本身不会返回东西。",
             "a = list(map(int, input().split()))\na.sort(reverse=True)\nprint(a)",
             [line, pick(["7 7 2 9", "100 20 55"], i)])

    # -- list-14 sorted 不改原列表 ----------------------------------------
    for i, (cn, line) in enumerate([("排序但不动原来的成绩单", "88 60 95"),
                                    ("临时排个序看看", "5 3 9 1")]):
        _add(items, "list", 3,
             "%s（sorted）" % cn,
             "输入一行，几个整数用空格隔开。第一行输出从小到大排好的新列表，"
             "第二行输出原来那个还没排序的列表。",
             "b = sorted(a) 会得到一个新列表，原来的 a 一点没变，这就是它和 a.sort() 的区别。",
             "a = list(map(int, input().split()))\nb = sorted(a)\nprint(b)\nprint(a)",
             [line, pick(["4 4 1 8", "6 5 4 3"], i)])

    # -- list-15 reverse 逆序 --------------------------------------------
    for i, (cn, line) in enumerate([("把跑步记录倒过来看", "15 20 18 25"),
                                    ("倒着读的分数表", "60 70 80 90")]):
        _add(items, "list", 2,
             "%s（reverse）" % cn,
             "输入一行，几个整数用空格隔开。请把列表里的顺序整个倒过来，再输出。",
             "a.reverse() 会把列表原地倒过来（它不返回新列表，别写 print(a.reverse())）。",
             "a = list(map(int, input().split()))\na.reverse()\nprint(a)",
             [line, pick(["1 2 3 4", "9 8 7 6"], i)])

    # -- list-16 切片：前 n 个 -------------------------------------------
    for i, (cn, n) in enumerate([("只看前 %d 名同学的成绩" % 3, 3), ("取前 %d 天的温度" % 2, 2)]):
        _add(items, "list", 2,
             "%s（切片）" % cn,
             "输入一行，至少 %d 个整数用空格隔开。输出最前面的 %d 个元素组成的新列表。" % (n, n),
             "a[:%d] 表示从头取 %d 个，是一个新列表，原来的列表不变。" % (n, n),
             "a = list(map(int, input().split()))\nprint(a[:%d])" % n,
             [pick(["88 76 95 60 100", "20 21 22 23"], i)])

    # -- list-17 切片：后 n 个 -------------------------------------------
    for i, (cn, n) in enumerate([("最后 %d 次跳绳的成绩" % 2, 2), ("取最后 %d 箱库存" % 3, 3)]):
        _add(items, "list", 2,
             "%s（切片）" % cn,
             "输入一行，至少 %d 个整数用空格隔开。输出最后 %d 个元素组成的新列表。" % (n, n),
             "a[-%d:] 表示从倒数第 %d 个一直取到末尾。" % (n, n),
             "a = list(map(int, input().split()))\nprint(a[-%d:])" % n,
             [pick(["12 15 18 20 25", "30 31 32 33 34"], i)])

    # -- list-18 切片：中间一段 -------------------------------------------
    for i, (cn, a1, b1) in enumerate([("取出第 2 到第 4 项", 1, 4), ("取出第 1 到第 3 项", 0, 3)]):
        _add(items, "list", 3,
             "%s（切片）" % cn,
             "输入一行，至少 %d 个整数用空格隔开。输出从第 %d 个到第 %d 个元素"
             "（含第 %d 个，不含第 %d 个）组成的新列表。" % (b1, a1 + 1, b1, a1 + 1, b1 + 1),
             "a[%d:%d] 取的是下标 %d 到 %d 之前的元素。" % (a1, b1, a1, b1 - 1),
             "a = list(map(int, input().split()))\nprint(a[%d:%d])" % (a1, b1),
             [pick(["10 20 30 40 50", "1 2 3 4 5 6"], i)])

    # -- list-19 求和 -----------------------------------------------------
    for i, (cn, line) in enumerate([("算一算总成绩", "88 76 95 60"),
                                    ("算一算一共跳了多少下", "120 98 135"),
                                    ("一周一共花了多少钱", "15 20 8 30 12")]):
        _add(items, "list", 2,
             "%s（sum）" % cn,
             "输入一行，几个整数用空格隔开。输出它们的总和。",
             "sum(a) 一行就能把所有元素加起来。",
             "a = list(map(int, input().split()))\nprint(sum(a))",
             [line, pick(["1 2 3 4", "50 50"], i)])

    # -- list-20 最大值 ---------------------------------------------------
    for i, (cn, line) in enumerate([("最高分是多少", "88 76 95 60"),
                                    ("跑得最快的一次是多少秒", "18 15 20 14"),
                                    ("哪个数据最大", "3 9 2 7")]):
        _add(items, "list", 2,
             "%s（max）" % cn,
             "输入一行，几个整数用空格隔开。输出其中最大的那个数。",
             "max(a) 直接告诉你列表里最大的元素。",
             "a = list(map(int, input().split()))\nprint(max(a))",
             [line, pick(["100 20 55 99", "7"], i)])

    # -- list-21 最小值 ---------------------------------------------------
    for i, (cn, line) in enumerate([("最低分是多少", "88 76 95 60"),
                                    ("最省的一次花了多少", "15 20 8 30"),
                                    ("最小值在哪里", "12 4 19 7")]):
        _add(items, "list", 2,
             "%s（min）" % cn,
             "输入一行，几个整数用空格隔开。输出其中最小的那个数。",
             "min(a) 直接给你列表里最小的元素。",
             "a = list(map(int, input().split()))\nprint(min(a))",
             [line, pick(["3 3 5", "42 17 88"], i)])

    # -- list-22 平均值 ---------------------------------------------------
    for i, (cn, line) in enumerate([("平均分是多少", "88 76 95 61"),
                                    ("平均每天跳绳多少下", "120 90 150 100"),
                                    ("平均气温是多少", "28 30 27 31")]):
        _add(items, "list", 3,
             "%s（求和再除以个数）" % cn,
             "输入一行，几个整数用空格隔开。输出它们的平均值，保留 1 位小数。",
             "sum(a) / len(a) 就是平均值，再用 round(结果, 1) 保留一位小数。",
             "a = list(map(int, input().split()))\nprint(round(sum(a) / len(a), 1))",
             [line, pick(["1 2 3", "10 20 30 40"], i)])

    # -- list-23 去重（保持原来的先后顺序） ---------------------------------
    for i, (cn, line) in enumerate([("把重复的分数只留一个", "88 76 88 95 76"),
                                    ("去掉重复的号码", "3 5 3 7 5 9"),
                                    ("名单去重", "1 1 2 3 3 3")]):
        _add(items, "list", 3,
             "%s（保持顺序）" % cn,
             "输入一行，几个整数用空格隔开（里面有重复的）。请去掉重复的元素，"
             "每个数只保留第一次出现的那一个，输出新列表。",
             "准备一个空列表 b，遍历 a 的时候：if x not in b 就 b.append(x)。",
             "a = list(map(int, input().split()))\nb = []\nfor x in a:\n"
             "    if x not in b:\n        b.append(x)\nprint(b)",
             [line, pick(["2 2 2", "9 8 9 7 8"], i)])

    # -- list-24 index 查下标 ---------------------------------------------
    for i, (cn, num) in enumerate([("这个分数排在第几位", 95), ("这个号码在第几个位置", 7)]):
        _add(items, "list", 3,
             "%s（index）" % cn,
             "第一行输入几个整数用空格隔开，第二行输入一个整数 x（保证它在列表里）。"
             "输出 x 在列表中的下标（从 0 开始数）。",
             "a.index(x) 返回第一个等于 x 的元素下标。",
             "a = list(map(int, input().split()))\nx = int(input())\nprint(a.index(x))",
             ["%s\n%d" % (pick(["88 76 95 60", "3 7 11 7"], i), num),
              "%s\n%d" % ("5 6 7 8", 6)])

    # -- list-25 in 判断存在 ----------------------------------------------
    for i, (cn, num) in enumerate([("成绩单里有 100 分吗", 100), ("购物车里有这件商品吗", 15)]):
        _add(items, "list", 2,
             "%s（in）" % cn,
             "第一行输入几个整数用空格隔开，第二行输入一个整数 x。如果 x 在列表里，"
             "输出「找到了」，否则输出「没找到」。",
             "if x in a: 就是判断 x 在不在列表里。",
             "a = list(map(int, input().split()))\nx = int(input())\nif x in a:\n"
             "    print(\"找到了\")\nelse:\n    print(\"没找到\")",
             ["%s\n%d" % (pick(["88 100 60", "12 8 15"], i), num),
              "%s\n%d" % ("1 2 3", num)])

    # -- list-26 合并两个列表 ---------------------------------------------
    for i, (cn, l1, l2) in enumerate([("把两个小组的分数合起来", "88 76", "95 60"),
                                      ("两天的销量合在一起", "12 15 18", "20 9")]):
        _add(items, "list", 2,
             "%s（列表相加）" % cn,
             "第一行输入几个整数，第二行再输入几个整数，都用空格隔开。"
             "输出把它们接在一起后的新列表。",
             "两个列表相加就是拼接：a + b，会得到一个新列表。",
             "a = list(map(int, input().split()))\nb = list(map(int, input().split()))\nprint(a + b)",
             ["%s\n%s" % (l1, l2), "%s\n%s" % (l2, l1)])

    # -- list-27 合并后排序 -----------------------------------------------
    for i, (cn, l1, l2) in enumerate([("两个班的分数合起来排序", "88 76", "95 60"),
                                      ("两箱水果的重量一起排", "30 12", "25 18")]):
        _add(items, "list", 3,
             "%s" % cn,
             "第一行输入几个整数，第二行再输入几个整数，都用空格隔开。"
             "请把它们合并成一个列表并从小到大排序，输出结果。",
             "先 c = a + b 合并，再 c.sort() 排序。",
             "a = list(map(int, input().split()))\nb = list(map(int, input().split()))\n"
             "c = a + b\nc.sort()\nprint(c)",
             ["%s\n%s" % (l1, l2), "%s\n%s" % (l2, l1)])

    # -- list-28 二维列表：读进来并输出 -------------------------------------
    for i, (cn, r1, r2) in enumerate([("把座位表读成二维列表", "1 2 3", "4 5 6"),
                                      ("把两行数据读成二维列表", "10 20", "30 40")]):
        _add(items, "list", 3,
             "%s" % cn,
             "输入两行，每行几个整数用空格隔开。请把它们存成一个二维列表"
             "（列表里面套列表），然后输出这个二维列表。",
             "先建空列表 a = []，再 for i in range(2) 把每一行 append 进去。",
             "a = []\nfor i in range(2):\n    a.append(list(map(int, input().split())))\nprint(a)",
             ["%s\n%s" % (r1, r2), "%s\n%s" % (r2, r1)])

    # -- list-29 二维列表：取某一行 -----------------------------------------
    for i, (cn, k) in enumerate([("取出第 %d 行的数据" % 2, 2), ("取出第 %d 行" % 1, 1)]):
        _add(items, "list", 3,
             "%s（二维下标）" % cn,
             "输入两行，每行几个整数用空格隔开。输出第 %d 行这个列表。" % k,
             "二维列表 a 的第 %d 行就是 a[%d]。" % (k, k - 1),
             "a = []\nfor i in range(2):\n    a.append(list(map(int, input().split())))\nprint(a[%d])" % (k - 1),
             [pick(["1 2 3\n4 5 6", "7 8\n9 10"], i)])

    # -- list-30 二维列表：取某个格子 ---------------------------------------
    for i, (cn, r, c) in enumerate([("第 2 行第 3 列是几", 2, 3), ("第 1 行第 2 列是几", 1, 2)]):
        _add(items, "list", 3,
             "%s（a[行][列]）" % cn,
             "输入两行，每行至少 %d 个整数用空格隔开。输出第 %d 行第 %d 列的那个数。" % (c, r, c),
             "先取第 %d 行 a[%d]，再从这行里取第 %d 个 a[%d][%d]。" % (r, r - 1, c, r - 1, c - 1),
             "a = []\nfor i in range(2):\n    a.append(list(map(int, input().split())))\n"
             "print(a[%d][%d])" % (r - 1, c - 1),
             [pick(["1 2 3\n4 5 6", "7 8 9\n10 11 12"], i)])

    # -- list-31 二维列表：每行求和 -----------------------------------------
    for i, (cn, data) in enumerate([("每个小组的总分", "10 20 30\n5 5 5"),
                                    ("每行数字加起来", "1 2 3 4\n6 7 8 9")]):
        _add(items, "list", 3,
             "%s（按行求和）" % cn,
             "输入两行，每行几个整数用空格隔开。请分别算出每一行数字的和，"
             "每行结果占一行输出。",
             "先 for row in a 一行一行拿到，再 print(sum(row))。",
             "a = []\nfor i in range(2):\n    a.append(list(map(int, input().split())))\n"
             "for row in a:\n    print(sum(row))",
             [data, "1 1\n2 2 2"])

    # -- list-32 二维列表：所有元素求和 --------------------------------------
    for i, (cn, data) in enumerate([("整张表格的数字总和", "1 2 3\n4 5 6"),
                                    ("所有库存加起来", "10 20\n30 40")]):
        _add(items, "list", 3,
             "%s（双重循环）" % cn,
             "输入两行，每行几个整数用空格隔开。请把所有数字加起来，输出总和。",
             "两层 for：外层拿每一行，内层拿行里的每个数，一个个累加。",
             "a = []\nfor i in range(2):\n    a.append(list(map(int, input().split())))\n"
             "total = 0\nfor row in a:\n    for x in row:\n        total += x\nprint(total)",
             [data, "2 4 6\n8 10 12"])

    # -- list-33 二维列表：找最大值 -----------------------------------------
    for i, (cn, data) in enumerate([("全表最高的分数", "88 76 95\n60 99 72"),
                                    ("表格里最大的数", "3 8\n12 5")]):
        _add(items, "list", 3,
             "%s" % cn,
             "输入两行，每行几个整数用空格隔开。输出所有数字中最大的那个。",
             "先假设第一个数最大，再用两层循环一个个比过去。",
             "a = []\nfor i in range(2):\n    a.append(list(map(int, input().split())))\n"
             "best = a[0][0]\nfor row in a:\n    for x in row:\n        if x > best:\n"
             "            best = x\nprint(best)",
             [data, "9 1\n2 7"])

    # -- list-34 二维列表：按行打印 -----------------------------------------
    for i, (cn, data) in enumerate([("把表格一行一行打印出来", "1 2 3\n4 5 6"),
                                    ("打印座位号", "7 8\n9 10 11")]):
        _add(items, "list", 3,
             "%s（同行用空格隔开）" % cn,
             "输入两行，每行几个整数用空格隔开。请一行一行地输出，"
             "每行的数字之间用一个空格隔开。",
             "用 \" \".join(map(str, row)) 把一行数字变成用空格连起来的字符串。",
             "a = []\nfor i in range(2):\n    a.append(list(map(int, input().split())))\n"
             "for row in a:\n    print(\" \".join(map(str, row)))",
             [data, "5 5 5\n6 6 6"])

    # -- list-35 count 数出现次数 -------------------------------------------
    for i, (cn, num) in enumerate([("有几个同学考了 100 分", 100), ("这种水果出现几次", 5)]):
        _add(items, "list", 2,
             "%s（count）" % cn,
             "第一行输入几个整数用空格隔开，第二行输入一个整数 x。输出 x 在列表里出现了几次。",
             "a.count(x) 专门数一个元素出现了几次。",
             "a = list(map(int, input().split()))\nx = int(input())\nprint(a.count(x))",
             ["%s\n%d" % (pick(["100 88 100 76 100", "5 3 5 9"], i), num),
              "%s\n%d" % ("7 7 7", 7)])

    # -- list-36 每个元素乘 2 -----------------------------------------------
    for i, (cn, line) in enumerate([("把每个分数都翻倍", "88 76 95"),
                                    ("每袋水果的重量翻倍", "3 5 8")]):
        _add(items, "list", 3,
             "%s（生成新列表）" % cn,
             "输入一行，几个整数用空格隔开。请把每个元素都乘以 2，"
             "把结果放进一个新列表并输出。",
             "新建 b = []，for x in a 时 b.append(x * 2)，最后 print(b)。",
             "a = list(map(int, input().split()))\nb = []\nfor x in a:\n"
             "    b.append(x * 2)\nprint(b)",
             [line, "1 2 3 4"])

    # -- list-37 筛选偶数 ---------------------------------------------------
    for i, (cn, line) in enumerate([("把偶数挑出来", "1 2 3 4 5 6"),
                                    ("挑出双号座位", "11 12 13 14")]):
        _add(items, "list", 3,
             "%s（筛选）" % cn,
             "输入一行，几个整数用空格隔开。请把所有偶数挑出来放进新列表，保持原来的先后顺序，"
             "然后输出这个新列表。",
             "if x % 2 == 0: 说明它是偶数，就 b.append(x)。",
             "a = list(map(int, input().split()))\nb = []\nfor x in a:\n"
             "    if x % 2 == 0:\n        b.append(x)\nprint(b)",
             [line, "2 4 5 7 8 10"])

    # -- list-38 筛选超过阈值的 ---------------------------------------------
    for i, (cn, k) in enumerate([("挑出 60 分以上的成绩", 60), ("挑出超过 20 的数据", 20)]):
        _add(items, "list", 3,
             "%s（筛选）" % cn,
             "输入一行，几个整数用空格隔开。请把所有大于等于 %d 的元素挑出来放进新列表，"
             "保持原来的顺序，然后输出。" % k,
             "在循环里加一个 if x >= %d 判断，满足就 append。" % k,
             "a = list(map(int, input().split()))\nb = []\nfor x in a:\n"
             "    if x >= %d:\n        b.append(x)\nprint(b)" % k,
             [pick(["88 45 60 72 30", "11 25 30 19 40"], i)])

    # -- list-39 交换首尾元素 -----------------------------------------------
    for i, (cn, line) in enumerate([("把队首和队尾换个位置", "12 15 18 20"),
                                    ("首尾交换的分数表", "60 70 80 90")]):
        _add(items, "list", 3,
             "%s" % cn,
             "输入一行，至少 2 个整数用空格隔开。请把第一个元素和最后一个元素交换位置，"
             "输出交换后的列表。",
             "Python 可以一行交换两个位置：a[0], a[-1] = a[-1], a[0]。",
             "a = list(map(int, input().split()))\na[0], a[-1] = a[-1], a[0]\nprint(a)",
             [line, "5 6 7 8 9"])

    # -- list-40 用 join 输出成一串 -----------------------------------------
    for i, (cn, sep, line) in enumerate([("把成绩用逗号连起来打印", ",", "88 76 95"),
                                         ("把号码用横线连起来", "-", "3 5 7 9")]):
        _add(items, "list", 3,
             "%s" % cn,
             "输入一行，几个整数用空格隔开。请把它们用「%s」连成一串输出"
             "（像 %s 这样）。" % (sep, sep.join(["a", "b", "c"])),
             "join 只吃字符串，所以要先把数字转成字符串：\"%s\".join(map(str, a))。" % sep,
             "a = list(map(int, input().split()))\nprint(\"%s\".join(map(str, a)))" % sep,
             [line, "1 2 3"])

    # -- list-41 第二名（第二大） --------------------------------------------
    for i, (cn, line) in enumerate([("亚军是多少分", "88 76 95 60 95"),
                                    ("第二高的身高", "135 128 150 142 150")]):
        _add(items, "list", 4,
             "%s（排除并列第一）" % cn,
             "输入一行，几个整数用空格隔开（保证至少有两种不同的数）。"
             "输出第二大的那个数（先把重复的去掉再找第二大）。",
             "先 b = sorted(set(a)) 去重并排序，再取 b[-2] 就是第二大。",
             "a = list(map(int, input().split()))\nb = sorted(set(a))\nprint(b[-2])",
             [line, "10 20 30 40"])

    # -- list-42 中位数 ------------------------------------------------------
    for i, (cn, line) in enumerate([("中间那个分数是多少", "88 60 95 72 100"),
                                    ("正中间的身高", "150 135 142 128 155")]):
        _add(items, "list", 3,
             "%s（奇数个数据）" % cn,
             "输入一行，奇数个整数用空格隔开。请先从小到大排序，"
             "再输出正中间那个数（中位数）。",
             "排好序后，正中间的下标是 len(a) // 2。",
             "a = list(map(int, input().split()))\na.sort()\nprint(a[len(a) // 2])",
             [line, "1 2 3 4 5 6 7"])

    # -- list-43 编号输出 ----------------------------------------------------
    for i, (cn, line) in enumerate([("给选手编号后打印成绩", "88 76 95"),
                                    ("给商品编号后打印价格", "12 8 15 20")]):
        _add(items, "list", 3,
             "%s（enumerate）" % cn,
             "输入一行，几个整数用空格隔开。请从 1 开始编号，每行输出「编号 数值」，"
             "中间用一个空格隔开。",
             "for i, x in enumerate(a, 1) 会同时给你编号（从 1 开始）和元素值。",
             "a = list(map(int, input().split()))\nfor i, x in enumerate(a, 1):\n    print(i, x)",
             [line, "5 10 15"])

    # -- list-44 zip 配对 ----------------------------------------------------
    for i, (cn, names) in enumerate([("把姓名和成绩配对打印", "tom alice bob"),
                                     ("把水果和价格配对打印", "apple pear plum")]):
        _add(items, "list", 3,
             "%s（zip）" % cn,
             "第一行输入几个英文名字（空格隔开），第二行输入同样多的整数（空格隔开）。"
             "请一行一行输出「名字 数值」，中间用一个空格隔开。",
             "zip(名字列表, 数字列表) 能把两边一对一配起来。",
             "names = input().split()\nscores = list(map(int, input().split()))\n"
             "for n, s in zip(names, scores):\n    print(n, s)",
             ["%s\n%s" % (names, "88 76 95"), "%s\n%s" % (names, "10 20 30")])

    # -- list-45 最大值所在的下标 ---------------------------------------------
    for i, (cn, line) in enumerate([("最高分是第几个同学", "88 76 95 60 99"),
                                    ("最大值排在第几位", "12 45 8 33")]):
        _add(items, "list", 3,
             "%s（找下标）" % cn,
             "输入一行，几个整数用空格隔开（保证最大值只有一个）。"
             "输出最大值所在的下标（从 0 开始数）。",
             "用一个变量 k 记住目前最大值的下标，找到更大的就更新 k。",
             "a = list(map(int, input().split()))\nk = 0\nfor i in range(len(a)):\n"
             "    if a[i] > a[k]:\n        k = i\nprint(k)",
             [line, "3 1 4 1 5 9"])

    # -- list-46 相邻两个数的差 -----------------------------------------------
    for i, (cn, line) in enumerate([("每天比前一天多跳几下", "100 120 115 140"),
                                    ("相邻两次成绩的变化", "60 70 65 80")]):
        _add(items, "list", 4,
             "%s（相邻差）" % cn,
             "输入一行，几个整数用空格隔开。请依次输出后一个数减前一个数的差，"
             "每行一个（一共有 n-1 行）。",
             "用 for i in range(len(a) - 1)，输出 a[i + 1] - a[i]。",
             "a = list(map(int, input().split()))\nfor i in range(len(a) - 1):\n"
             "    print(a[i + 1] - a[i])",
             [line, "5 5 5 5"])

    # -- list-47 前缀和 -------------------------------------------------------
    for i, (cn, line) in enumerate([("累计得分", "10 20 30 40"),
                                    ("存钱罐里的累计金额", "5 5 10 20")]):
        _add(items, "list", 4,
             "%s（前缀和）" % cn,
             "输入一行，几个整数用空格隔开。请输出每一步的累计和：第一个数输出第 1 项，"
             "第二个数输出前 2 项之和，依此类推，每行一个。",
             "用一个变量 s 一路累加，每加一次就 print(s)。",
             "a = list(map(int, input().split()))\ns = 0\nfor x in a:\n    s += x\n    print(s)",
             [line, "1 2 3"])

    # -- list-48 判断是否升序 --------------------------------------------------
    for i, (cn, line) in enumerate([("这份成绩单是从小到大排的吗", "60 70 76 88"),
                                    ("记录是递增的吗", "10 20 15 30")]):
        _add(items, "list", 3,
             "%s" % cn,
             "输入一行，几个整数用空格隔开。如果它们是从小到大排好的"
             "（允许相等），输出「是升序」，否则输出「不是升序」。",
             "先假设 ok = True，一旦发现前一个比后一个大，就把 ok 改成 False。",
             "a = list(map(int, input().split()))\nok = True\nfor i in range(len(a) - 1):\n"
             "    if a[i] > a[i + 1]:\n        ok = False\nif ok:\n    print(\"是升序\")\n"
             "else:\n    print(\"不是升序\")",
             [line, "1 2 2 3"])

    # -- list-49 正数负数各几个 ------------------------------------------------
    for i, (cn, line) in enumerate([("温度里零上和零下各有几天", "-3 5 0 -1 8"),
                                    ("正数和负数各有多少个", "2 -4 -6 7 0")]):
        _add(items, "list", 3,
             "%s（0 不算）" % cn,
             "输入一行，几个整数用空格隔开。请按顺序输出两个数：正数的个数、负数的个数，"
             "中间用一个空格隔开（0 既不是正数也不是负数）。",
             "两个计数器，循环里分别判断 x > 0 和 x < 0。",
             "a = list(map(int, input().split()))\np = 0\nn = 0\nfor x in a:\n"
             "    if x > 0:\n        p += 1\n    elif x < 0:\n        n += 1\nprint(p, n)",
             [line, "1 2 3"])

    # -- list-50 用循环数个数（不用 len） ---------------------------------------
    for i, (cn, line) in enumerate([("不用 len 数一数有几个数", "3 5 7 9 11"),
                                    ("一个个数过去", "8 6 4")]):
        _add(items, "list", 2,
             "%s（自己数）" % cn,
             "输入一行，几个整数用空格隔开。请用循环一个一个数，输出元素个数"
             "（这次不许用 len 哦）。",
             "c = 0，for x in a 时 c += 1，循环结束后 print(c)。",
             "a = list(map(int, input().split()))\nc = 0\nfor x in a:\n    c += 1\nprint(c)",
             [line, "1 2 3 4"])

    # -- list-51 倒着输出（切片） ----------------------------------------------
    for i, (cn, line) in enumerate([("把成绩表倒着打印", "88 76 95 60"),
                                    ("倒着输出数据", "1 2 3 4 5")]):
        _add(items, "list", 2,
             "%s（切片反转）" % cn,
             "输入一行，几个整数用空格隔开。请倒着输出整个列表"
             "（保持 Python 列表的格式）。",
             "a[::-1] 会给你一个倒过来的新列表，原来的列表没变。",
             "a = list(map(int, input().split()))\nprint(a[::-1])",
             [line, "9 8 7"])

    # -- list-52 及格人数 ------------------------------------------------------
    for i, (cn, k) in enumerate([("数一数有几个同学及格了", 60), ("数一数有几个超过 20", 20)]):
        _add(items, "list", 3,
             "%s（第一行 n，第二行 n 个数）" % cn,
             "第一行输入一个整数 n，第二行输入 n 个整数用空格隔开，表示成绩。"
             "输出其中大于等于 %d 的个数。" % k,
             "先 n = int(input()) 读个数，再读一行数据，用循环统计。",
             "n = int(input())\na = list(map(int, input().split()))\nc = 0\nfor x in a:\n"
             "    if x >= %d:\n        c += 1\nprint(c)" % k,
             ["%d\n%s" % (len(pick([["85", "59", "90", "45", "72"], ["30", "25", "11", "40"]], i)),
                          " ".join(pick([["85", "59", "90", "45", "72"], ["30", "25", "11", "40"]], i))),
              "4\n60 60 60 59"])

    # -- list-53 前三名 --------------------------------------------------------
    for i, (cn, line) in enumerate([("领奖台上的前三名", "88 76 95 60 99 72"),
                                    ("销量最高的前三名", "30 12 45 8 50")]):
        _add(items, "list", 3,
             "%s（从高到低取前三个）" % cn,
             "输入一行，至少 3 个整数用空格隔开。请从大到小排序后，"
             "输出排在最前面的 3 个元素组成的列表。",
             "先 a.sort(reverse=True)，再用切片 a[:3] 取前三个。",
             "a = list(map(int, input().split()))\na.sort(reverse=True)\nprint(a[:3])",
             [line, "5 4 3 2 1"])

    # -- list-54 二维列表：每行最大值 -------------------------------------------
    for i, (cn, data) in enumerate([("每个小组的最高分", "88 76 95\n60 99 72\n50 55 51"),
                                    ("每一行的最大值", "3 8 1\n9 2 7\n4 4 4")]):
        _add(items, "list", 3,
             "%s" % cn,
             "输入三行，每行几个整数用空格隔开。请分别求出每一行的最大值，每行输出一个结果。",
             "先 for row in a 拿到每一行，再 print(max(row))。",
             "a = []\nfor i in range(3):\n    a.append(list(map(int, input().split())))\n"
             "for row in a:\n    print(max(row))",
             [data, "1 2\n3 4\n5 6"])

    # @@NEXT@@

    return items
