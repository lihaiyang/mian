/* 少儿 Python 在线编程工坊 · 进阶课程数据（第 7 ~ 12 单元，L33 ~ L54） */
const LEARN_LESSONS_ADV = [
  /* ================= 第 7 单元 · 字符串魔法 ================= */
  {
    id: "L33",
    stage: 3,
    unit: "第 7 单元 · 字符串魔法",
    title: "下标与切片：取出想要的那几个字",
    emoji: "✂️",
    minutes: 8,
    goals: ["会用下标取单个字符", "会用切片取一段文字"],
    teach: [
      "字符串就像一串糖葫芦，每个字都站在自己的位置上，位置从 0 开始编号。想知道第一个字是谁，就用 `s[0]` 把它请出来，记住是 0 不是 1 哦。",
      "想取一段连续的字，就用切片 `s[1:4]`，它取的是下标 1、2、3 这三个字，**右边不包含**。记住这个小规则，你就不会多拿一个字啦。",
      "负数下标也很好玩：`s[-1]` 是最后一个字，`s[-2]` 是倒数第二个。写的时候大胆试，报错了也没关系，改一改就懂了。"
    ],
    code: "s = 'python'\nprint('第一个字:', s[0])        # 下标从 0 开始 🐍\nprint('最后一个字:', s[-1])\nprint('中间三个字:', s[1:4])     # 取 1、2、3，不含 4\nprint('前三个字:', s[:3])\nprint('后面全部:', s[3:])\n\nname = '小明同学'\nprint(name[:2] + '，加油！💪')   # 拼一句鼓励的话",
    explain: [
      "下标从 0 开始数，s[0] 是第一个字符。",
      "切片 s[1:4] 取的是下标 1、2、3，右边不包含。",
      "s[-1] 是最后一个字符，s[:3] 表示从头取到下标 2。"
    ],
    quiz: [
      { q: "s = 'python' 的时候，s[1:3] 是什么？", options: ["py", "yt", "yth"], answer: 1, tip: "切片右边不包含，所以取的是下标 1 和 2，也就是 y 和 t。" },
      { q: "s = 'python' 的时候，s[-1] 是什么？", options: ["p", "n", "o"], answer: 1, tip: "负号表示从右边数，-1 就是最后一个字符 n。" }
    ],
    task: "把 s 换成你自己的名字，试着取出前两个字和最后一个字，打印一句自我介绍。",
    practiceTopics: ["str"]
  },
  {
    id: "L34",
    stage: 3,
    unit: "第 7 单元 · 字符串魔法",
    title: "字符串的百宝箱：upper、strip、split、join",
    emoji: "🧰",
    minutes: 10,
    goals: ["认识常用的字符串方法", "会用 split 和 join 处理文字"],
    teach: [
      "字符串自带很多小工具，用点号 `.` 就能把它们叫出来干活。`upper()` 把字母变大写，`lower()` 变小写，`strip()` 去掉两边的空格，像给文字洗了个澡。",
      "`split()` 能按分隔符把一句话切成列表，`join()` 反过来把列表拼成一句话，`replace()` 负责替换，`find()` 找位置，`count()` 数个数。这些名字都很像英文单词，读出来就记住了。",
      "有个小坑要提醒你：这些方法**不会改变原来的字符串**，而是返回一个新的结果，所以要用 `print` 或变量把它接住，不然它就悄悄飞走啦。"
    ],
    code: "s = '  Hello Python  '\nprint(s.strip())                    # 去掉两边空格 🧹\nprint(s.strip().upper())            # 全变大写\nprint(s.strip().lower())            # 全变小写\nprint('a,b,c'.split(','))           # 按逗号切开 → 列表 ✂️\nprint('-'.join(['我', '爱', '编程']))  # 用横线连起来\nprint('I like cat'.replace('cat', 'dog'))  # 替换文字\nprint('banana'.count('a'))          # 数一数有几个 a\nprint('hello'.find('l'))            # 第一次出现的位置",
    explain: [
      "strip() 去掉首尾空格，upper() 变大写，lower() 变小写。",
      "split() 把字符串切成列表，join() 把列表拼回字符串。",
      "replace() 替换文字，count() 数次数，find() 找位置。"
    ],
    quiz: [
      { q: "'a-b-c'.split('-') 的结果是什么？", options: ["['a', 'b', 'c']", "'abc'", "3"], answer: 0, tip: "split 按分隔符切开，返回的是一个列表。" },
      { q: "'  hi  '.strip() 的结果是？", options: ["'  hi  '", "'hi'", "'HI'"], answer: 1, tip: "strip 只去掉两边的空格，不会改大小写。" }
    ],
    task: "把 '  我喜欢  Python  ' 用 strip 和 replace 变成 '我喜欢Python' 再打印出来。",
    practiceTopics: ["str"]
  },
  {
    id: "L35",
    stage: 3,
    unit: "第 7 单元 · 字符串魔法",
    title: "一个字一个字地看：遍历与统计",
    emoji: "🔍",
    minutes: 10,
    goals: ["会用 for 遍历字符串", "会统计字符出现的次数"],
    teach: [
      "想一个字一个字地看字符串，写 `for ch in word:` 就行，ch 会依次变成每一个字符。这就像用手指点着字读课文，一个都不落下。",
      "遍历的时候配上 `if` 判断和一个计数器，就能做统计啦：数一数有几个 a，有几个元音字母，甚至数出每个字出现的次数。",
      "最后送你一个切片小魔法 `word[::-1]`，它能**把整个字符串倒过来**。自己动手试试，看看你的名字倒着念是什么样子。"
    ],
    code: "word = 'banana'\ncount = 0\nfor ch in word:              # 一个字符一个字符地看 👀\n    if ch == 'a':\n        count = count + 1\nprint('a 出现了', count, '次')\n\nvowels = 0\nfor ch in 'programming':\n    if ch in 'aeiou':        # 是元音字母就加 1\n        vowels += 1\nprint('元音字母有', vowels, '个')\nprint('倒着念:', word[::-1])   # 切片小魔法 ✨",
    explain: [
      "for ch in word 会把字符串里的每个字符依次交给 ch。",
      "在循环里用 if 加计数器，就能统计想要的信息。",
      "word[::-1] 是切片的特殊写法，效果是把字符串倒过来。"
    ],
    quiz: [
      { q: "要一个字符一个字符地遍历字符串 s，应该写？", options: ["for i in range(s)", "for ch in s", "while s"], answer: 1, tip: "字符串可以直接被 for 遍历，每次拿到一个字符。" },
      { q: "'abc'[::-1] 的结果是？", options: ["'abc'", "'cba'", "'a'"], answer: 1, tip: "步长为 -1 表示从右往左取，于是字符串被倒过来。" }
    ],
    task: "遍历你的英文名字，统计里面有几个字母 a（或者你名字里的某个字）。",
    practiceTopics: ["str", "loop"]
  },

  /* ================= 第 8 单元 · 列表百宝箱 ================= */
  {
    id: "L36",
    stage: 3,
    unit: "第 8 单元 · 列表百宝箱",
    title: "列表入门：一排格子装好多东西",
    emoji: "📦",
    minutes: 9,
    goals: ["会创建列表并用下标取值", "会用 len 和 sum 看整体"],
    teach: [
      "列表就像一排带编号的储物格，用方括号 `[]` 造出来，每样东西用逗号隔开。想拿第几个，就用下标 `fruits[0]`，还是从 0 开始数哦。",
      "列表里的东西是可以换的：`fruits[1] = '草莓'` 就把第二个格子换成了草莓。这一点比字符串灵活多了，字符串可是一个字都改不了的。",
      "`len()` 数一数有几个，`sum()` 加一加，`max()` 和 `min()` 找最大最小，这几个函数对列表特别友好，先用起来再说。"
    ],
    code: "fruits = ['苹果', '香蕉', '西瓜']   # 方括号就是列表 🧺\nprint(fruits)\nprint('第一个:', fruits[0], ' 最后一个:', fruits[-1])\nprint('一共有', len(fruits), '种水果')\n\nfruits[1] = '草莓'               # 换掉第二个格子\nprint('换过之后:', fruits)\n\nscores = [90, 85, 100]\nprint('总分:', sum(scores), ' 最高分:', max(scores), ' 最低分:', min(scores))",
    explain: [
      "列表用方括号创建，元素之间用逗号隔开。",
      "下标同样从 0 开始，列表元素可以直接修改。",
      "len 求长度，sum 求和，max 和 min 求最大最小值。"
    ],
    quiz: [
      { q: "nums = [10, 20, 30] 时，nums[1] 是？", options: ["10", "20", "30"], answer: 1, tip: "下标从 0 开始，所以 0 号是 10，1 号是 20。" },
      { q: "len([1, 2, 3, 4]) 的结果是？", options: ["3", "4", "10"], answer: 1, tip: "len 数的是元素个数，一共 4 个。" }
    ],
    task: "做一个「我喜欢的三种零食」列表，打印第一个、最后一个和总个数。",
    practiceTopics: ["list"]
  },
  {
    id: "L37",
    stage: 3,
    unit: "第 8 单元 · 列表百宝箱",
    title: "增删改：让列表长高又变瘦",
    emoji: "✏️",
    minutes: 10,
    goals: ["会用 append 和 insert 添加元素", "会用 remove 和 pop 删除元素"],
    teach: [
      "列表最厉害的地方是能长大也能缩小。`append()` 把新东西加到末尾，`insert()` 能插到指定位置，就像排队时有人插队进来。",
      "想删东西有两个办法：`remove('读书')` 按内容删掉，`pop()` 把最后一个拿出来（还能接住它继续用）。要删哪一个，看你的需要。",
      "小提醒：这些方法都是**直接改动原列表**的，不需要再用变量接住，写 `todo.append('练琴')` 就够了，别写成 `todo = todo.append(...)` 哦。"
    ],
    code: "todo = ['写作业']\ntodo.append('练钢琴')          # 加到末尾 ➕\ntodo.append('读书')\nprint('现在的清单:', todo)\n\ntodo.insert(0, '刷牙')         # 插到最前面\ntodo.remove('读书')            # 按内容删掉\nprint('调整之后:', todo)\n\nlast = todo.pop()              # 弹出最后一个\nprint('被弹出的:', last)\nprint('剩下的:', todo, ' 长度:', len(todo))",
    explain: [
      "append 加到末尾，insert(下标, 元素) 插到指定位置。",
      "remove 按内容删除，pop 弹出末尾元素并返回它。",
      "这些方法直接修改原列表，不需要重新赋值。"
    ],
    quiz: [
      { q: "想让 '数学' 出现在列表最前面，用哪个方法？", options: ["append", "insert", "pop"], answer: 1, tip: "insert(0, '数学') 可以插到最前面。" },
      { q: "pop() 的作用是？", options: ["删除全部元素", "取出并删除最后一个元素", "把列表排序"], answer: 1, tip: "pop 弹出末尾元素，并把这个元素作为结果返回。" }
    ],
    task: "建一个购物清单，用 append 加两样、insert 插一样、remove 删一样，最后打印出来。",
    practiceTopics: ["list"]
  },
  {
    id: "L38",
    stage: 3,
    unit: "第 8 单元 · 列表百宝箱",
    title: "排序与统计：给成绩排排队",
    emoji: "📊",
    minutes: 10,
    goals: ["会用 sort 和 sorted 排序", "会算总分、平均分和最高最低"],
    teach: [
      "`sort()` 让列表从小到大排好队，加个 `reverse=True` 就变成从大到小。它和 `sorted()` 的区别是：sort 直接改原列表，sorted 会给你一个**排好序的新列表**。",
      "统计三兄弟很好用：`sum()` 求总分，`len()` 数人数，两个一除就是平均分。`max()` 和 `min()` 一眼看出最好和最差。",
      "别忘了 Python 里 `/` 除出来是小数，想保留一位小数可以用 `round(值, 1)`，这样打印出来更整洁漂亮。"
    ],
    code: "scores = [88, 95, 72, 100, 63]\nscores.sort()                    # 从小到大排队 📈\nprint('排好队:', scores)\n\nscores.sort(reverse=True)        # 从大到小\nprint('从高到低:', scores)\nprint('总分:', sum(scores))\nprint('平均分:', round(sum(scores) / len(scores), 1))\nprint('最高:', max(scores), ' 最低:', min(scores))\n\nnames = ['Tom', 'Amy', 'Bob']\nprint('字母顺序:', sorted(names))  # sorted 不改原列表",
    explain: [
      "sort() 直接给原列表排序，sorted() 返回一个新的排好序的列表。",
      "reverse=True 表示从大到小排序。",
      "平均分 = sum(列表) / len(列表)，round 可以保留小数位。"
    ],
    quiz: [
      { q: "sorted([3, 1, 2]) 的结果是？", options: ["[3, 2, 1]", "[1, 2, 3]", "[1, 3, 2]"], answer: 1, tip: "默认从小到大排序。" },
      { q: "求 [2, 4, 6] 的平均分怎么写？", options: ["sum(x) / 3", "max(x) - min(x)", "len(x) * 2"], answer: 0, tip: "总分除以个数就是平均分。" }
    ],
    task: "写 5 个你朋友的年龄，排序后打印最大、最小和平均年龄。",
    practiceTopics: ["list", "calc"]
  },
  {
    id: "L39",
    stage: 3,
    unit: "第 8 单元 · 列表百宝箱",
    title: "切片、遍历与二维列表",
    emoji: "🧱",
    minutes: 12,
    goals: ["会切片和遍历列表", "会读写二维列表"],
    teach: [
      "列表也能像字符串一样切片：`nums[:3]` 取前三个，`nums[-2:]` 取最后两个。规则和字符串一模一样，右边不包含，负数从右边数。",
      "遍历列表时用 `enumerate()` 特别方便，它能**同时给你下标和值**，想打印「第几号格子是什么」的时候一句就够。",
      "二维列表就是「列表里面装着列表」，像一张表格。`grid[1][2]` 先找到第 1 行，再找这一行的第 2 个，双层 for 循环就能把整张表打印出来。"
    ],
    code: "nums = [10, 20, 30, 40, 50]\nprint('前三个:', nums[:3])        # 切片 ✂️\nprint('倒数两个:', nums[-2:])\n\nfor i, n in enumerate(nums):     # 同时拿到下标和值 🔢\n    print(i, '号格子是', n)\n\ngrid = [[1, 2, 3], [4, 5, 6]]    # 二维列表像一张表格\nprint('第二行:', grid[1])\nprint('第二行第三个:', grid[1][2])\nfor row in grid:\n    for x in row:\n        print(x, end=' ')\n    print()                      # 换行，画出一张表 🗺️",
    explain: [
      "列表切片和字符串切片写法完全一样。",
      "enumerate 在遍历时同时给出下标和元素。",
      "二维列表用 grid[行][列] 取值，双层循环可以逐行打印。"
    ],
    quiz: [
      { q: "grid = [[1, 2], [3, 4]] 时，grid[1][0] 是？", options: ["1", "3", "4"], answer: 1, tip: "先取第 1 行 [3, 4]，再取这一行的第 0 个，就是 3。" },
      { q: "[5, 6, 7, 8][-2:] 的结果是？", options: ["[5, 6]", "[7, 8]", "[8]"], answer: 1, tip: "-2: 表示从倒数第二个一直取到最后。" }
    ],
    task: "做一个 3 行 3 列的二维列表当座位表，用双层 for 循环把它打印成方阵。",
    practiceTopics: ["list", "loop"]
  },

  /* ================= 第 9 单元 · 字典小管家 ================= */
  {
    id: "L40",
    stage: 3,
    unit: "第 9 单元 · 字典小管家",
    title: "字典：给每个数据取个好记的名字",
    emoji: "🏷️",
    minutes: 10,
    goals: ["会创建字典并用键取值", "会用 items 遍历字典"],
    teach: [
      "列表靠下标找东西，字典靠**名字**找东西。写成 `{'name': '小明', 'age': 10}`，冒号前面叫键，后面叫值，用大括号包起来。",
      "取值就用 `student['name']`。如果怕键写错了报错，可以用 `get('score', '还没考试')`，找不到的时候它会给你一个默认值，特别贴心。",
      "想一次看完整本字典，用 `for k, v in student.items():`，k 是键、v 是值，两个一起拿到手里，打印起来又快又清楚。"
    ],
    code: "student = {'name': '小明', 'age': 10, 'city': '北京'}\nprint(student['name'])                     # 用键取值 🔑\nprint(student.get('score', '还没考试'))      # 取不到就用默认值\n\nstudent['score'] = 95                      # 没有就新增，有就修改\nstudent['age'] = 11\nprint(student)\n\nfor k, v in student.items():               # 一次拿到键和值 👀\n    print(k, '→', v)\nprint('所有的键:', list(student.keys()))",
    explain: [
      "字典用大括号创建，格式是 键: 值。",
      "用 d[键] 取值，get(键, 默认值) 可以避免报错。",
      "items() 配合 for 能同时遍历键和值。"
    ],
    quiz: [
      { q: "d = {'a': 1} 时，d['a'] 是？", options: ["'a'", "1", "报错"], answer: 1, tip: "用键取值，得到的是它对应的值。" },
      { q: "取字典里可能不存在的键，用哪个更安全？", options: ["d['x']", "d.get('x', 0)", "d.pop()"], answer: 1, tip: "get 取不到时会返回默认值，不会让程序报错停下。" }
    ],
    task: "做一个你自己的名片字典，写上名字、年龄、爱好，然后全部打印出来。",
    practiceTopics: ["dict"]
  },
  {
    id: "L41",
    stage: 3,
    unit: "第 9 单元 · 字典小管家",
    title: "词频统计：谁出现得最多",
    emoji: "🔠",
    minutes: 12,
    goals: ["会用字典做计数统计", "会找出出现次数最多的元素"],
    teach: [
      "统计次数是字典最拿手的活儿。思路很简单：遍历每个词，如果它在字典里就让计数加 1，不在就先记成 1。这就叫**累加计数**。",
      "写完字典，用 `max(counts, key=counts.get)` 就能找出次数最多的那个键。读法是「按值的大小挑出最大的键」，用一次就记住啦。",
      "这套方法不只适合数单词，数颜色、数骰子点数、数全班同学的生日月份都行，改一改输入就变成一个新程序。"
    ],
    code: "text = 'apple banana apple cherry apple banana'\ncounts = {}\n\nfor word in text.split():        # 把句子切成一个个单词\n    if word in counts:\n        counts[word] += 1        # 见过就加 1\n    else:\n        counts[word] = 1         # 第一次见就记 1\n\nprint(counts)\nbest = max(counts, key=counts.get)   # 挑出次数最多的 🏆\nprint('出现最多的是:', best, '，一共', counts[best], '次')",
    explain: [
      "统计的思路：见过就加 1，没见过就先记成 1。",
      "counts[word] += 1 是 counts[word] = counts[word] + 1 的简写。",
      "max(counts, key=counts.get) 按出现次数挑出次数最多的键。"
    ],
    quiz: [
      { q: "统计词频时，如果 word 还没在字典里，应该做什么？", options: ["counts[word] = 1", "counts[word] += 1", "删掉它"], answer: 0, tip: "第一次见到，先把它记成 1 次。" },
      { q: "max(counts, key=counts.get) 得到的是？", options: ["最大的次数", "次数最多的那个键", "字典的长度"], answer: 1, tip: "它按值比较，返回的仍然是字典里的键。" }
    ],
    task: "把 text 换成一句你喜欢的歌词，统计每个字出现了几次，找出出现最多的字。",
    practiceTopics: ["dict", "str"]
  },
  {
    id: "L42",
    stage: 3,
    unit: "第 9 单元 · 字典小管家",
    title: "字典实战：成绩单与价格表",
    emoji: "🧾",
    minutes: 12,
    goals: ["会用字典存成绩并统计", "会用字典做价格计算"],
    teach: [
      "字典最适合存「一一对应」的数据：科目对应分数，商品对应价格。有了它，程序读起来几乎和念句子一样顺。",
      "遍历成绩单的时候，一边打印一边把分数累加到 total，循环结束再除以科目数，平均分就出来了。**边遍历边累加**是特别常用的套路。",
      "价格表就更像生活了：购物车记录买了几支铅笔、几块橡皮，然后用 `prices[item] * num` 算出小计，全部加起来就是总价。试试改成你自己的购物车吧。"
    ],
    code: "scores = {'语文': 92, '数学': 88, '英语': 96}\ntotal = 0\nfor subject, score in scores.items():\n    print(subject, '考了', score, '分')\n    total += score                 # 边遍历边累加 ➕\nprint('平均分:', round(total / len(scores), 1))\n\nprices = {'铅笔': 2, '本子': 5, '橡皮': 1}\ncart = {'铅笔': 3, '橡皮': 2}\ncost = 0\nfor item, num in cart.items():\n    cost += prices[item] * num     # 单价 × 数量 💰\nprint('一共要花', cost, '元')",
    explain: [
      "字典很适合存放一一对应的数据，比如科目和分数。",
      "遍历时累加 total，循环结束就能算平均分。",
      "用 prices[商品] * 数量 可以算出每种商品的小计。"
    ],
    quiz: [
      { q: "scores = {'语文': 92, '数学': 88}，sum(scores.values()) 是？", options: ["180", "2", "92"], answer: 0, tip: "values() 取出所有分数，加起来是 180。" },
      { q: "购物车里铅笔 3 支、单价 2 元，小计怎么算？", options: ["2 + 3", "prices['铅笔'] * 3", "3 - 2"], answer: 1, tip: "小计 = 单价 × 数量。" }
    ],
    task: "做一张你最爱吃的三种零食价格表，再算一算买两份一共要多少钱。",
    practiceTopics: ["dict", "calc"]
  },

  /* ================= 第 10 单元 · 函数工坊 ================= */
  {
    id: "L43",
    stage: 3,
    unit: "第 10 单元 · 函数工坊",
    title: "函数：把常用动作打包起来",
    emoji: "🎁",
    minutes: 10,
    goals: ["会用 def 定义函数并调用", "会用参数和 return"],
    teach: [
      "函数就像一个打包好的小盒子：写好一次，随时能用。用 `def 名字(参数):` 定义它，盒子里缩进的几行就是要做的动作。",
      "括号里的东西叫**参数**，是你递给函数的材料；`return` 是函数送给你的回礼。有进有出，函数就活了。",
      "定义好之后不会自己运行，要写一行 `say_hello('小明')` 去**调用**它。函数名的括号和冒号最容易写漏，检查一遍再运行。"
    ],
    code: "def say_hello(name):          # def 就是定义一个动作 🎁\n    print('你好，' + name + '！')\n\nsay_hello('小明')              # 调用它\nsay_hello('小红')\n\ndef add(a, b):                # 括号里是参数\n    return a + b              # return 把结果送回来\n\nresult = add(3, 5)\nprint('3 + 5 =', result)\nprint('再来一次:', add(10, 20))",
    explain: [
      "def 用来定义函数，函数体要缩进。",
      "参数是传给函数的数据，return 把结果返回给调用者。",
      "定义之后必须调用，函数才会真正执行。"
    ],
    quiz: [
      { q: "定义函数用哪个关键字？", options: ["def", "func", "define"], answer: 0, tip: "Python 里用 def 定义函数，后面跟函数名和括号。" },
      { q: "函数里的 return 作用是？", options: ["打印结果", "把结果返回给调用处", "结束整个程序"], answer: 1, tip: "return 把值送回调用它的地方，可以再用变量接住。" }
    ],
    task: "写一个 double(x) 函数，把传进来的数字乘 2 返回，然后打印 double(7) 的结果。",
    practiceTopics: ["func"]
  },
  {
    id: "L44",
    stage: 3,
    unit: "第 10 单元 · 函数工坊",
    title: "默认参数与多返回值：函数更灵活",
    emoji: "🎛️",
    minutes: 11,
    goals: ["会给参数设置默认值", "会一次返回多个结果"],
    teach: [
      "有些参数大多数时候都一样，那就给它一个**默认值**：`def greet(name, word='你好')`。调用时只写名字就用默认的问候，写了第二个参数就按你的来。",
      "函数还能一次返回好几个结果，写成 `return min(nums), max(nums)` 就行，中间用逗号隔开，它其实偷偷打包成了一个元组。",
      "接收的时候也用逗号一起接：`low, high = min_max(nums)`，两个变量同时拿到值，比自己算两遍方便多啦。"
    ],
    code: "def greet(name, word='你好'):     # word 有默认值\n    return word + '，' + name\n\nprint(greet('小明'))               # 用默认问候\nprint(greet('小红', '早上好'))      # 传入就把默认值换掉\n\ndef min_max(nums):                # 一次返回两个结果 📦\n    return min(nums), max(nums)\n\nlow, high = min_max([3, 9, 1, 7])\nprint('最小值:', low, ' 最大值:', high)\n\nprint(min_max([5, 2, 8]))          # 也可以整体打印出来",
    explain: [
      "带默认值的参数放在后面，调用时不传就用默认值。",
      "return a, b 可以一次返回多个值，接收时用逗号分别接住。",
      "多返回值其实是一个元组，也可以直接整体打印。"
    ],
    quiz: [
      { q: "def f(a, b=10) 时，f(3) 的结果中 b 是？", options: ["3", "10", "报错"], answer: 1, tip: "没有传第二个参数，就使用默认值 10。" },
      { q: "low, high = min_max(nums) 这句在做什么？", options: ["调用两次函数", "一次接收两个返回值", "定义新函数"], answer: 1, tip: "逗号左边两个变量同时接收函数返回的两个值。" }
    ],
    task: "写一个 introduce(name, city='北京') 函数，再写一个返回「最大值和最小值」的函数试试。",
    practiceTopics: ["func"]
  },
  {
    id: "L45",
    stage: 3,
    unit: "第 10 单元 · 函数工坊",
    title: "变量作用域：函数里的小房间",
    emoji: "🚪",
    minutes: 11,
    goals: ["理解局部变量和全局变量", "会用参数和 return 传递数据"],
    teach: [
      "函数就像一间小房间，在房间里新建的变量，出了门就看不见了，这叫**局部变量**。房间里可以读到外面的变量，但直接改动它，改的其实是房间里新做的那一份。",
      "想真正修改外面的值，有两个正规办法：用 `return` 把新值送出来，或者用参数把数据带进去算。这样数据流向清清楚楚，也不容易出 bug。",
      "名字起得好也能少踩坑：房间里的变量和外面的变量**尽量不要重名**，一看就知道谁是谁，读代码的心情都会变好。"
    ],
    code: "score = 100            # 全局变量：大家都能看到 🌍\n\ndef change():\n    score = 60         # 这是函数里的小房间，不影响外面\n    print('函数里的 score =', score)\n\nchange()\nprint('外面的 score =', score)\n\ndef add_bonus(points):\n    return points + 5  # 用参数把数据带进来，再送回去 ✅\n\nscore = add_bonus(score)\nprint('加奖励后:', score)",
    explain: [
      "函数内部新建的变量是局部变量，函数结束后就消失了。",
      "直接给函数内同名变量赋值，不会改变外面的同名变量。",
      "推荐用参数传入、用 return 返回，数据流向最清楚。"
    ],
    quiz: [
      { q: "函数里新定义的变量，函数外面能直接用吗？", options: ["能", "不能", "加 print 就能"], answer: 1, tip: "局部变量只在函数内部有效，出了函数就访问不到。" },
      { q: "想把函数算出的结果给外面用，最推荐的方式是？", options: ["直接改全局变量", "用 return 返回", "多打印几次"], answer: 1, tip: "return 把结果交回调用处，清晰又安全。" }
    ],
    task: "写一个函数把分数加 10 分并返回，观察函数里外的同名变量分别是什么值。",
    practiceTopics: ["func", "var"]
  },
  {
    id: "L46",
    stage: 3,
    unit: "第 10 单元 · 函数工坊",
    title: "递归入门：函数自己叫自己",
    emoji: "🔄",
    minutes: 12,
    goals: ["理解递归的出口和递推", "会写简单的递归函数"],
    teach: [
      "递归就是函数自己调用自己，像照镜子里的镜子。听着有点玄，其实就是把大问题变成**小一点点的同一个问题**。",
      "写递归一定要有**出口**：`if n == 0: return`。没有出口它就会一直叫下去，程序会报「递归太深」的错，这是新手最常见的情况。",
      "看阶乘就懂了：5 的阶乘 = 5 × 4 的阶乘，4 的阶乘 = 4 × 3 的阶乘……一直到 1 停下来。顺着这个思路写，代码短得让你惊讶。"
    ],
    code: "def countdown(n):\n    if n == 0:              # 出口：不然会一直叫下去 🛑\n        print('起飞！🚀')\n        return\n    print(n)\n    countdown(n - 1)        # 自己调用自己\n\ncountdown(5)\n\ndef factorial(n):\n    if n == 1:              # 出口\n        return 1\n    return n * factorial(n - 1)   # 递推\n\nprint('5 的阶乘 =', factorial(5))",
    explain: [
      "递归就是函数在自己内部调用自己。",
      "递归必须有出口条件，否则会一直调用下去导致报错。",
      "阶乘的规律是 n! = n × (n-1)!，正好用递归表达。"
    ],
    quiz: [
      { q: "递归函数里最重要的是什么？", options: ["多打印几次", "出口条件", "变量名要短"], answer: 1, tip: "没有出口条件，函数会一直调用自己直到程序崩溃。" },
      { q: "factorial(3) 的结果是？", options: ["6", "3", "9"], answer: 0, tip: "3 × 2 × 1 = 6。" }
    ],
    task: "写一个递归函数 countdown(n)，从 n 倒数到 1，最后打印一句「完成！」。",
    practiceTopics: ["func", "algo"]
  },

  /* ================= 第 11 单元 · 模块与文件 ================= */
  {
    id: "L47",
    stage: 3,
    unit: "第 11 单元 · 模块与文件",
    title: "import math 与 random：把工具箱借过来",
    emoji: "🧰",
    minutes: 11,
    goals: ["会用 import 导入模块", "会用 math 和 random 的常用函数"],
    teach: [
      "Python 自带很多工具箱，用 `import math` 就能把数学工具箱借过来用，里面的东西用点号取：`math.pi`、`math.sqrt(16)`。",
      "`random` 是随机工具箱：`random.randint(1, 6)` 掷骰子，`random.choice(列表)` 抽一个，`random.shuffle(列表)` 洗牌。做小游戏少不了它。",
      "记住写 import 的位置：**放在文件最上面**。想一次借两个工具箱，写成 `import math, random` 也可以，中间用逗号隔开。"
    ],
    code: "import math, random\n\nprint('圆周率:', round(math.pi, 4))      # 3.1416 🥧\nprint('16 的平方根:', math.sqrt(16))\nprint('向上取整:', math.ceil(3.2), ' 向下取整:', math.floor(3.8))\n\ndice = random.randint(1, 6)              # 掷一次骰子 🎲\nprint('你掷出了:', dice)\n\ncolors = ['红', '黄', '蓝']\nprint('抽到的颜色:', random.choice(colors))\nrandom.shuffle(colors)                   # 洗牌\nprint('洗牌后:', colors)",
    explain: [
      "import 语句通常写在文件最上面，导入后才能用模块里的功能。",
      "math 提供数学工具，random 提供随机功能，都用点号调用。",
      "randint(1, 6) 包含 1 和 6 两个端点，正好模拟骰子。"
    ],
    quiz: [
      { q: "要用 math 里的函数，第一步应该做什么？", options: ["import math", "print(math)", "定义 math 函数"], answer: 0, tip: "先导入模块，才能使用它里面的功能。" },
      { q: "想随机得到 1 到 6 的整数，用哪个？", options: ["random.choice(6)", "random.randint(1, 6)", "math.random(6)"], answer: 1, tip: "randint(1, 6) 会随机返回 1 到 6 之间的整数。" }
    ],
    task: "用 random 做一个「今天吃什么」小助手，从你的三个菜名里随机抽一个。",
    practiceTopics: ["math", "fun"]
  },
  {
    id: "L48",
    stage: 3,
    unit: "第 11 单元 · 模块与文件",
    title: "open 读写文件：把数据存进小本本",
    emoji: "📒",
    minutes: 12,
    goals: ["会用 open 写入文件", "会读取文件内容并逐行处理"],
    teach: [
      "程序运行完，变量就忘了。想记住东西，就得写进文件。用 `open('diary.txt', 'w', encoding='utf-8')` 打开一个本子，`'w'` 表示写入，会**清空原来的内容**重新写。",
      "读的时候把 `'w'` 换成 `'r'`，然后用 `f.read()` 一次读完全部，或者用 `for line in f:` 一行一行地读，适合处理很多行的数据。",
      "推荐用 `with open(...) as f:` 的写法，好处是代码块结束后文件会**自动关闭**，不会忘记关文件，也不会丢数据。写中文记得加上 `encoding='utf-8'`。"
    ],
    code: "with open('diary.txt', 'w', encoding='utf-8') as f:   # w = 写入 ✍️\n    f.write('今天学会了文件操作\\n')\n    f.write('明天继续加油\\n')\n\nwith open('diary.txt', 'r', encoding='utf-8') as f:   # r = 读取 👀\n    text = f.read()\nprint('整篇内容:')\nprint(text)\n\nwith open('diary.txt', 'r', encoding='utf-8') as f:\n    for i, line in enumerate(f, 1):      # 一行一行地读\n        print('第', i, '行:', line.strip())",
    explain: [
      "open(文件名, 'w') 是写入模式，会清空并重写文件内容。",
      "open(文件名, 'r') 是读取模式，read() 一次读完，for 可以逐行读。",
      "with open(...) as f 会在代码块结束后自动关闭文件。"
    ],
    quiz: [
      { q: "用 'w' 模式打开一个已有内容的文件会怎样？", options: ["内容保留，追加在后面", "原内容被清空后重新写入", "文件自动被删除"], answer: 1, tip: "w 模式会清空原文件，想追加应该用 'a' 模式。" },
      { q: "with open(...) as f 的好处是？", options: ["文件会自动关闭", "运行更快", "不用写文件名"], answer: 0, tip: "离开 with 代码块时文件会自动关闭，数据更安全。" }
    ],
    task: "建一个 my_notes.txt，写入三行你今天的收获，再逐行读出来加上行号打印。",
    practiceTopics: ["file"]
  },

  /* ================= 第 12 单元 · 算法思维闯关（stage 4） ================= */
  {
    id: "L49",
    stage: 4,
    unit: "第 12 单元 · 算法思维闯关",
    title: "枚举与穷举：一个一个试过去",
    emoji: "🔎",
    minutes: 12,
    goals: ["理解枚举的解题思路", "会用循环加判断筛选答案"],
    teach: [
      "有些题目看起来很绕，其实最笨的办法最好用：把所有可能一个一个试过去，符合条件的就是答案。这种方法叫**枚举**，也叫穷举。",
      "鸡兔同笼就是典型：鸡可能是 0 到 10 只，那就让循环从 0 数到 10，每试一次就检查脚的数量对不对，对上了就打印出来。",
      "枚举的关键是**想清楚要试哪些数**，以及**判断条件怎么写**。这两步想明白了，代码往往只有五六行，比苦思冥想快得多。"
    ],
    code: "# 鸡兔同笼：一共 10 个头，28 只脚 🐔🐰\nfor chicken in range(0, 11):        # 鸡的只数一个一个试\n    rabbit = 10 - chicken\n    if chicken * 2 + rabbit * 4 == 28:\n        print('鸡有', chicken, '只，兔有', rabbit, '只')\n\n# 找出 100 以内所有 7 的倍数\nfound = []\nfor n in range(1, 101):\n    if n % 7 == 0:                  # 余数为 0 就是倍数\n        found.append(n)\nprint('7 的倍数:', found)",
    explain: [
      "枚举就是把所有可能的情况逐个试一遍。",
      "range(0, 11) 会产生 0 到 10，正好覆盖鸡可能的只数。",
      "n % 7 == 0 表示 n 能被 7 整除。"
    ],
    quiz: [
      { q: "枚举法的核心做法是？", options: ["随机猜一个答案", "把所有可能逐个试一遍", "直接背答案"], answer: 1, tip: "枚举就是把所有可能都试一次，靠判断条件筛出正确答案。" },
      { q: "range(0, 11) 会包含哪些数？", options: ["0 到 10", "0 到 11", "1 到 10"], answer: 0, tip: "range 右边不包含，所以是 0 到 10。" }
    ],
    task: "用枚举法算一算：一共 8 个头、22 只脚，鸡和兔各有几只？",
    practiceTopics: ["algo", "loop"]
  },
  {
    id: "L50",
    stage: 4,
    unit: "第 12 单元 · 算法思维闯关",
    title: "冒泡排序：让大的数字慢慢浮上来",
    emoji: "🫧",
    minutes: 13,
    goals: ["理解冒泡排序的比较与交换", "会写双重循环实现排序"],
    teach: [
      "冒泡排序的思路特别形象：从左到右两两比一比，左边的比右边大就交换位置。走完一轮，最大的数字就「冒」到了最后，像水里的气泡。",
      "一轮搞不定，就来第二轮、第三轮。每一轮都会把当前最大的送到后面，所以后面已经排好的部分**不用再比了**，内层循环要写 `len(nums) - 1 - i`。",
      "两个数交换位置，Python 里写 `a, b = b, a` 一行就够，不用像别的语言那样借一个临时变量。这个小技巧一定要记住。"
    ],
    code: "nums = [5, 2, 9, 1, 7]\nprint('排序前:', nums)\n\nfor i in range(len(nums) - 1):        # 一共要比几轮\n    for j in range(len(nums) - 1 - i):\n        if nums[j] > nums[j + 1]:     # 左边大就交换 🔁\n            nums[j], nums[j + 1] = nums[j + 1], nums[j]\n    print('第', i + 1, '轮后:', nums)\n\nprint('排序后:', nums)",
    explain: [
      "冒泡排序每轮把当前最大的数送到末尾。",
      "内层循环用 len(nums) - 1 - i，跳过已经排好的部分。",
      "a, b = b, a 是 Python 交换两个变量值的写法。"
    ],
    quiz: [
      { q: "冒泡排序每一轮结束后，最大的数会在哪里？", options: ["最前面", "已经排好的末尾部分", "中间"], answer: 1, tip: "大的数一轮一轮往后冒，末尾逐渐排好序。" },
      { q: "Python 里交换 a 和 b 的值怎么写？", options: ["a = b; b = a", "a, b = b, a", "swap(a, b)"], answer: 1, tip: "a, b = b, a 一步完成交换，不用临时变量。" }
    ],
    task: "把 nums 换成 [8, 3, 6, 2, 9, 1]，打印每一轮的结果，数一数一共比了几轮。",
    practiceTopics: ["algo", "list"]
  },
  {
    id: "L51",
    stage: 4,
    unit: "第 12 单元 · 算法思维闯关",
    title: "二分查找：猜数字的最快方法",
    emoji: "🎯",
    minutes: 13,
    goals: ["理解二分查找的前提和步骤", "会用 low、high、mid 写查找循环"],
    teach: [
      "玩过猜数字吗？1 到 100 我随便想一个数，你每猜一次我告诉你大了还是小了。最聪明的猜法是**每次猜中间那个**，一下就排除一半，最多 7 次就能猜中。",
      "这就是二分查找。它有一个前提：数据必须**已经排好序**，否则「中间」就没有意义了。用之前一定先确认列表是有序的。",
      "写的时候准备三个变量：`low` 左边界、`high` 右边界、`mid` 中间位置。猜小了就把 low 移到 mid + 1，猜大了就把 high 移到 mid - 1，直到找到为止。"
    ],
    code: "nums = [3, 7, 11, 19, 25, 33, 41, 58, 66, 79]   # 必须是有序的\nwant = 33\nlow, high = 0, len(nums) - 1\nsteps = 0\n\nwhile low <= high:\n    mid = (low + high) // 2          # 取中间位置\n    steps += 1\n    print('第', steps, '次猜: 下标', mid, '值是', nums[mid])\n    if nums[mid] == want:\n        print('找到啦！只用了', steps, '步 🎉')\n        break\n    elif nums[mid] < want:\n        low = mid + 1                # 目标在右半边 ➡️\n    else:\n        high = mid - 1               # 目标在左半边 ⬅️",
    explain: [
      "二分查找要求数据事先排好序。",
      "mid = (low + high) // 2 用整除取中间位置。",
      "每次比较后排除一半区间，所以速度非常快。"
    ],
    quiz: [
      { q: "二分查找的前提是什么？", options: ["数据必须有序", "数据必须是数字", "数据不能超过 10 个"], answer: 0, tip: "只有在有序数据里，取中间才能有效排除一半。" },
      { q: "中间位置 mid 怎么算？", options: ["(low + high) // 2", "low + high", "high - low"], answer: 0, tip: "用整除 // 取中间的下标。" }
    ],
    task: "把 want 改成 66，数一数二分查找用了几步；再换成顺序查找比一比谁更快。",
    practiceTopics: ["algo", "loop"]
  },
  {
    id: "L52",
    stage: 4,
    unit: "第 12 单元 · 算法思维闯关",
    title: "质数与因数：数字的小秘密",
    emoji: "🔢",
    minutes: 12,
    goals: ["会判断一个数是不是质数", "会求一个数的所有因数"],
    teach: [
      "质数是只能被 1 和它自己整除的数，比如 2、3、5、7。判断办法就是试着除一除：只要找到一个能整除它的数，它就不是质数。",
      "一个小优化特别重要：只要试到**平方根**就够了。因为如果 n 有一个大于平方根的因数，那一定有一个小于平方根的因数跟它配对，所以再往后试都是白费力气。",
      "求因数用枚举就行：从 1 试到 n，能整除的就是因数。配合列表推导式 `[i for i in range(1, n + 1) if n % i == 0]`，一行就写完了。"
    ],
    code: "def is_prime(n):\n    if n < 2:                     # 0 和 1 都不是质数\n        return False\n    for i in range(2, int(n ** 0.5) + 1):   # 试到平方根就够\n        if n % i == 0:\n            return False\n    return True\n\nprimes = [n for n in range(2, 51) if is_prime(n)]\nprint('50 以内的质数:', primes)\nprint('一共', len(primes), '个')\n\nn = 36\nfactors = [i for i in range(1, n + 1) if n % i == 0]\nprint(n, '的因数有:', factors)",
    explain: [
      "质数是大于 1 且只能被 1 和自身整除的数。",
      "判断质数只需要试到 n 的平方根，能省很多时间。",
      "列表推导式可以一行生成符合条件的列表。"
    ],
    quiz: [
      { q: "下面哪个数是质数？", options: ["9", "15", "17"], answer: 2, tip: "17 只能被 1 和 17 整除，是质数。" },
      { q: "判断 n 是不是质数，试除到多少就够了？", options: ["n / 2", "n 的平方根", "必须试到 n"], answer: 1, tip: "因数成对出现，试到平方根就能覆盖所有可能。" }
    ],
    task: "找出 100 以内所有的质数，数一数一共有多少个，再求出 60 的所有因数。",
    practiceTopics: ["algo", "math", "func"]
  },
  {
    id: "L53",
    stage: 4,
    unit: "第 12 单元 · 算法思维闯关",
    title: "模拟题：把题目一句一句翻译成代码",
    emoji: "📝",
    minutes: 12,
    goals: ["学会圈出题目里的关键条件", "会把文字规则翻译成 if 和循环"],
    teach: [
      "编程题最怕的不是写代码，而是**没读懂题**。拿到题先别急着敲键盘，用笔把数字、条件、要求圈出来，一句一句读清楚。",
      "圈完就翻译：一句中文对应一小段代码。「满 100 减 20」是 if，「否则打九折」是 else，「分别算出」是 for 循环。翻译完，题目就变成程序了。",
      "写完一定要**用题目给的例子测一遍**。如果例子对不上，说明某句话翻译错了，回去对照题目再读一遍，比重写代码快得多。"
    ],
    code: "# 题目：超市满 100 减 20，不到 100 打九折 💰\ndef pay(price):\n    if price >= 100:\n        return price - 20\n    return round(price * 0.9, 2)\n\nfor p in [45, 100, 128]:\n    print('原价', p, '元 → 实付', pay(p), '元')\n\n# 题目：统计成绩单里及格的人数和及格率\nscores = [59, 72, 88, 45, 90, 61]\npassed = [s for s in scores if s >= 60]\nprint('及格人数:', len(passed))\nprint('及格率:', round(len(passed) / len(scores) * 100, 1), '%')",
    explain: [
      "读题时先圈出数字和条件，再一句一句翻译成代码。",
      "if 对应条件判断，for 对应「分别计算」这类要求。",
      "写完用题目给的样例测试，看结果对不对。"
    ],
    quiz: [
      { q: "拿到一道编程题，第一步最该做什么？", options: ["马上敲代码", "先读懂题目并圈出条件", "先随便写个 print"], answer: 1, tip: "读懂题意再动手，比写完再返工快很多。" },
      { q: "题目说「分别统计每种水果的数量」，最可能用到？", options: ["for 循环", "只有 print", "turtle 画图"], answer: 0, tip: "「分别统计每一种」通常用 for 循环加字典。" }
    ],
    task: "给自己出一道小模拟题（比如满 50 减 5），写出规则再用代码算三个不同价格。",
    practiceTopics: ["algo", "if"]
  },
  {
    id: "L54",
    stage: 4,
    unit: "第 12 单元 · 算法思维闯关",
    title: "考试时间分配与检查方法",
    emoji: "⏱️",
    minutes: 11,
    goals: ["会为考试安排时间", "掌握检查代码的具体方法"],
    teach: [
      "考试就像跑长跑，一开始冲太猛后面会没力气。拿到卷子先花几分钟通读一遍，把简单题先拿下，难题留到最后，心里会踏实很多。",
      "时间分配可以这样：读题 5 分钟，简单题 45 分钟，难题 25 分钟，最后留 15 分钟检查。**留出检查时间**是很多人忽略的提分关键。",
      "检查也有套路：一看变量名有没有写错，二看循环的边界（`range(1, n)` 会不会漏掉 n），三看样例输入输出对不对得上。这三步走完，小错误基本跑不掉。"
    ],
    code: "# 考试时间分配表：一共 90 分钟 ⏱️\nplan = [('读题圈条件', 5), ('先做简单题', 45), ('攻克难题', 25), ('检查', 15)]\ntotal = 0\nfor name, minutes in plan:\n    total += minutes\n    print(name, '用', minutes, '分钟')\nprint('合计', total, '分钟，刚刚好 ✅')\n\n# 检查小助手：把我的答案和正确答案比一比\nmine = [3, 7, 12, 20]\nright = [3, 8, 12, 20]\nfor i in range(len(mine)):\n    if mine[i] != right[i]:\n        print('第', i + 1, '题要再检查一遍！🔍')",
    explain: [
      "先通读试卷，先易后难，最后一定要留出检查时间。",
      "检查重点：变量名、循环边界、样例输入输出是否对得上。",
      "用两个列表逐个比较，可以快速找出哪几题答案不一致。"
    ],
    quiz: [
      { q: "考试时留出检查时间有什么用？", options: ["可以提前交卷", "能发现变量名和边界这类小错误", "没什么用"], answer: 1, tip: "很多分都是检查出来的，尤其是循环边界和变量名。" },
      { q: "for i in range(len(mine)) 里的 i 表示？", options: ["答案的值", "答案的下标", "答案的个数"], answer: 1, tip: "range(len(mine)) 产生的正是列表的下标。" }
    ],
    task: "给自己设计一张 60 分钟的练习时间表，写进列表里累加，看看加起来是不是正好 60。",
    practiceTopics: ["algo", "fun"]
  }
];
