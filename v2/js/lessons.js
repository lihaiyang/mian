/**
 * 📚 萌码自学教程（基础篇：GESP 一级 / 二级）
 * 纯数据文件：LEARN_LESSONS
 *
 * 每一课都有：讲解 / 可运行示例 / 代码解读 / 小测验 / 动手任务 / 配套练习主题
 * 高级篇（字符串、列表、字典、函数、算法）在 js/lessons-adv.js
 *
 * 字符串里的换行用 \n 转义；示例代码里不使用反斜杠，避免转义麻烦。
 */
const LEARN_LESSONS = [
  // ================= 第 1 单元 · 和电脑打招呼 =================
  {
    id: "L01", stage: 1, unit: "第 1 单元 · 和电脑打招呼",
    title: "print：让电脑开口说话", emoji: "🗣️", minutes: 6,
    goals: ["会用 print 输出文字", "知道文字要放在英文引号里"],
    teach: [
      "电脑本身不会说话，但它可以听我们的命令。**print** 就是最常用的命令，意思是「打印出来」。",
      "print 后面要跟一对英文小括号，括号里放你想让电脑说的话。如果是文字，要用**英文引号**包起来：单引号或双引号都可以，但不能一边单一边双。"
    ],
    code: "print(\"你好，世界！\")\nprint(\"我是小小程序员\")\nprint(2026)",
    explain: [
      "print(\"你好，世界！\") 会让屏幕出现一行字。",
      "文字必须放进英文引号里，中文引号“”电脑是不认识的。",
      "数字可以不用引号，直接写 print(2026) 也能打印。"
    ],
    quiz: [
      { q: "下面哪一句能让电脑打印出「你好」？", options: ["print(你好)", "print(\"你好\")", "print '你好'"], answer: 1, tip: "文字要放进英文引号，而且要写在括号里面。" }
    ],
    task: "把代码里的文字换成你自己的名字，再点一次运行。",
    practiceTopics: ["print"]
  },
  {
    id: "L02", stage: 1, unit: "第 1 单元 · 和电脑打招呼",
    title: "注释：写给自己的小纸条", emoji: "📝", minutes: 5,
    goals: ["知道 # 号后面的内容是写给人看的", "会给代码加上说明"],
    teach: [
      "**#** 号后面的内容叫「注释」，电脑会直接跳过不看。它是写给自己和同学看的笔记。",
      "写注释是个好习惯：过了一个星期再打开代码，看到注释就能马上想起当时在想什么。"
    ],
    code: "# 这是给我的第一个程序写的说明\nprint(\"我正在学习 Python\")  # 也可以写在代码后面\n# print(\"这一行被注释掉了，不会运行\")",
    explain: [
      "# 后面的整行都会被电脑忽略。",
      "注释可以单独占一行，也可以跟在代码后面。",
      "想临时关掉某一行代码时，在它前面加一个 # 就行，不用删掉。"
    ],
    quiz: [
      { q: "print(\"A\")  # print(\"B\") 会打印出什么？", options: ["A 和 B", "只有 A", "只有 B"], answer: 1, tip: "# 后面的内容电脑不看。" }
    ],
    task: "给你自己的代码加一行注释，写上今天为什么写这段程序。",
    practiceTopics: ["print"]
  },
  {
    id: "L03", stage: 1, unit: "第 1 单元 · 和电脑打招呼",
    title: "变量：给东西起个名字", emoji: "📦", minutes: 8,
    goals: ["会用 名字 = 值 存东西", "会打印变量里的内容"],
    teach: [
      "**变量**就像贴了名字的盒子：把东西放进去，以后叫名字就能拿出来用。",
      "写法是 `名字 = 值`。这个等号不是数学里的「等于」，而是「把右边的放进左边的盒子」。",
      "变量名要用英文或拼音，不能用数字开头，也不能有空格。取有意义的名字，例如 `age`、`名字`、`score`。"
    ],
    code: "name = \"小熊猫\"\nage = 10\nhobby = \"画画\"\nprint(name)\nprint(age)\nprint(\"我的爱好是\", hobby)",
    explain: [
      "name = \"小熊猫\" 把文字装进了名叫 name 的盒子。",
      "同一个变量可以反复使用，也可以随时换掉里面的内容。",
      "print 里用逗号隔开多项内容，它们会依次打印出来，中间自动加一个空格。"
    ],
    quiz: [
      { q: "a = 5 之后又写 a = 8，那么 print(a) 会打印什么？", options: ["5", "8", "5 8"], answer: 1, tip: "盒子里的东西会被新的盖掉。" }
    ],
    task: "再创建两个变量：favorite_color（喜欢的颜色）和 pet（宠物名字），并打印出来。",
    practiceTopics: ["var"]
  },
  {
    id: "L04", stage: 1, unit: "第 1 单元 · 和电脑打招呼",
    title: "数字和文字：两种不同的东西", emoji: "🔢", minutes: 7,
    goals: ["分清整数、小数和文字", "知道数字和文字不能直接相加"],
    teach: [
      "Python 里的东西分类型：**整数**（如 10）、**小数**（如 3.14）、**文字**（如 \"你好\"，也叫字符串）。",
      "数字可以直接算：10 + 5 得到 15。但文字加数字会报错，因为电脑不知道你是想「拼起来」还是想「加起来」。",
      "想知道一个东西是什么类型，可以用 `type()` 看一看。"
    ],
    code: "a = 10\nb = 3.14\nc = \"10\"\nprint(type(a))\nprint(type(b))\nprint(type(c))\nprint(a + 5)\nprint(c + \"5\")",
    explain: [
      "type(a) 会告诉你是 int（整数）。",
      "b 是 float（小数），c 是 str（字符串）。",
      "c + \"5\" 是把两段文字拼在一起，得到 \"105\"，不是数学上的加法。"
    ],
    quiz: [
      { q: "\"10\" + \"5\" 的结果是什么？", options: ["15", "105", "会报错"], answer: 1, tip: "两个都是文字，加号就变成了「拼接」。" }
    ],
    task: "用 type() 看看 True 是什么类型，再看看 3.0 是什么类型。",
    practiceTopics: ["var", "calc"]
  },
  {
    id: "L05", stage: 1, unit: "第 1 单元 · 和电脑打招呼",
    title: "input：让程序会提问", emoji: "💬", minutes: 8,
    goals: ["会用 input() 读入小朋友输入的内容", "知道 input 拿到的一定是文字"],
    teach: [
      "**input()** 会让程序停下来等你打字，你按回车以后，它把你输入的内容接住。",
      "注意：`input()` 拿到的**永远是文字**，哪怕你输入的是 8，它也是文字 \"8\"。",
      "括号里可以写一句提示语，例如 input(\"你叫什么名字？\")，这样别人就知道该输入什么了。"
    ],
    code: "name = input(\"你叫什么名字？\")\nprint(\"你好呀，\" + name + \"！\")\nprint(\"欢迎来到 Python 的世界 🌟\")",
    explain: [
      "运行后控制台下面会出现输入框，输入名字再按回车。",
      "input(...) 的括号里是提示语，不是要打印的正文。",
      "拿到的 name 是文字，可以直接用 + 拼在别的文字后面。"
    ],
    quiz: [
      { q: "x = input() 时，如果输入 8，那么 x 是什么？", options: ["数字 8", "文字 \"8\"", "什么都没有"], answer: 1, tip: "input 拿到的永远是文字。" }
    ],
    task: "问一问你的年龄，然后打印「我今年 x 岁」。",
    practiceTopics: ["input"]
  },
  {
    id: "L06", stage: 1, unit: "第 1 单元 · 和电脑打招呼",
    title: "int 与 float：把文字变成数字", emoji: "🔄", minutes: 8,
    goals: ["会用 int() 把文字变成整数", "会用 float() 变成小数"],
    teach: [
      "因为 input 拿到的是文字，所以想做算术，就得先**转换**成数字。",
      "`int(\"8\")` 把文字 8 变成数字 8；`float(\"3.5\")` 变成小数 3.5。",
      "常见写法：`n = int(input())`，一行就把「读入 + 转换」都做完了。"
    ],
    code: "age = int(input(\"你几岁啦？\"))\nprint(\"明年你就\", age + 1, \"岁啦！\")\nprint(\"十年后你就\", age + 10, \"岁了\")",
    explain: [
      "int(...) 把括号里的文字转成整数。",
      "如果不转换，age + 1 会报错，因为文字不能和数字相加。",
      "输入小数（比如 3.5）时要用 float()，用 int() 会报错。"
    ],
    quiz: [
      { q: "想让输入的身高 1.65 变成数字，应该用哪个？", options: ["int()", "float()", "str()"], answer: 1, tip: "带小数点的数字要用 float。" }
    ],
    task: "写一个程序：读入两个整数，打印它们的和。",
    practiceTopics: ["input", "var"]
  },
  {
    id: "L07", stage: 1, unit: "第 1 单元 · 和电脑打招呼",
    title: "f-string：把变量塞进句子里", emoji: "🎀", minutes: 7,
    goals: ["会用 f\"...{变量}...\" 拼句子", "会控制小数位数"],
    teach: [
      "把变量和文字拼在一起，最方便的写法是 **f-string**：在引号前面加一个小写 f，然后用大括号把变量包起来。",
      "还可以顺手做格式化：`{分数:.2f}` 表示保留两位小数。",
      "f-string 比用加号拼接更好读，也不容易漏空格。"
    ],
    code: "name = \"小海龟\"\nspeed = 12.3456\nprint(f\"{name} 跑得飞快！\")\nprint(f\"速度是 {speed:.2f} 米每秒\")\nprint(f\"2 加 3 等于 {2 + 3}\")",
    explain: [
      "引号前的小 f 是必须的，漏掉的话大括号会被原样打印出来。",
      "{speed:.2f} 表示保留 2 位小数，会自动四舍五入。",
      "大括号里不仅能放变量，还能直接写算式。"
    ],
    quiz: [
      { q: "print(f\"{3 + 4}\") 会输出什么？", options: ["{3 + 4}", "7", "3 + 4"], answer: 1, tip: "大括号里会先算出结果。" }
    ],
    task: "用 f-string 打印「我叫 ___，今年 ___ 岁，明年 ___ 岁」。",
    practiceTopics: ["print", "var"]
  },
  {
    id: "L08", stage: 1, unit: "第 1 单元 · 和电脑打招呼",
    title: "算术运算符：加减乘除", emoji: "➕", minutes: 7,
    goals: ["会用 + - * / 做四则运算", "知道除法的结果是小数"],
    teach: [
      "Python 的算术符号和数学课上差不多：加 `+`、减 `-`、乘 `*`、除 `/`。",
      "注意乘法要用星号 `*`，不能用字母 x，也不能省略（2a 是错的，要写 2 * a）。",
      "除法 `/` 的结果总是小数，比如 10 / 2 得到 5.0。"
    ],
    code: "a = 12\nb = 5\nprint(\"和\", a + b)\nprint(\"差\", a - b)\nprint(\"积\", a * b)\nprint(\"商\", a / b)\nprint(\"混合\", 2 + 3 * 4)",
    explain: [
      "先乘除后加减，和数学课一样；想改变顺序就加小括号。",
      "a / b 得到 2.4，是小数。",
      "print(\"和\", a + b) 会打印「和 17」。"
    ],
    quiz: [
      { q: "2 + 3 * 4 的结果是多少？", options: ["20", "14", "24"], answer: 1, tip: "先算乘法 3 * 4 = 12，再加 2。" }
    ],
    task: "算一算：一支铅笔 3 元，买 7 支要多少钱？用变量存单价和数量再打印。",
    practiceTopics: ["calc"]
  },
  {
    id: "L09", stage: 1, unit: "第 1 单元 · 和电脑打招呼",
    title: "整除 // 和取余 %", emoji: "🍰", minutes: 8,
    goals: ["会用 // 求商", "会用 % 求余数", "会判断奇偶和能不能整除"],
    teach: [
      "`//` 叫**整除**：只留商的整数部分，不要小数。比如 17 // 5 得到 3。",
      "`%` 叫**取余**：只留余数。比如 17 % 5 得到 2。",
      "这两个符号特别有用：分东西够分几份用 `//`，判断奇偶用 `% 2`，判断能不能整除也用 `%`。"
    ],
    code: "candies = 17\npeople = 5\nprint(\"每人分到\", candies // people, \"颗\")\nprint(\"还剩\", candies % people, \"颗\")\nprint(\"7 是偶数吗？\", 7 % 2 == 0)\nprint(\"8 是偶数吗？\", 8 % 2 == 0)",
    explain: [
      "17 // 5 = 3，17 % 5 = 2，验证一下：3 * 5 + 2 = 17。",
      "n % 2 == 0 是判断偶数的经典写法。",
      "== 是比较「相等」，和赋值的 = 不一样，别写混。"
    ],
    quiz: [
      { q: "20 % 6 等于多少？", options: ["3", "2", "3.33"], answer: 1, tip: "6 × 3 = 18，20 - 18 = 2。" }
    ],
    task: "输入一个两位数，分别打印它的十位和个位（提示：用 // 10 和 % 10）。",
    practiceTopics: ["calc"]
  },
  {
    id: "L10", stage: 1, unit: "第 1 单元 · 和电脑打招呼",
    title: "乘方 ** 与运算小技巧", emoji: "⚡", minutes: 6,
    goals: ["会用 ** 做乘方", "知道 0.5 次方就是开平方"],
    teach: [
      "`**` 是乘方：`2 ** 3` 表示 2 的 3 次方，得到 8。",
      "开平方可以写成 `n ** 0.5`，不过要更精确的话，后面会学到 math 模块的 `math.sqrt()`。",
      "小括号可以嵌套，`((2 + 3) * 4) ** 2` 也能算。"
    ],
    code: "print(2 ** 3)\nprint(5 ** 2)\nprint(9 ** 0.5)\nprint((2 + 3) * 4)\nside = 6\nprint(\"正方形面积\", side ** 2)",
    explain: [
      "2 ** 3 = 2 × 2 × 2 = 8。",
      "9 ** 0.5 = 3.0，就是 9 开平方。",
      "乘方的优先级比加减乘除都高。"
    ],
    quiz: [
      { q: "3 ** 3 等于多少？", options: ["9", "27", "33"], answer: 1, tip: "3 × 3 × 3 = 27。" }
    ],
    task: "输入正方形的边长，打印它的面积和周长。",
    practiceTopics: ["calc"]
  },
  {
    id: "L11", stage: 1, unit: "第 1 单元 · 和电脑打招呼",
    title: "报错不可怕：读懂错误信息", emoji: "🩺", minutes: 8,
    goals: ["认识 3 种最常见的报错", "知道怎么自己排查"],
    teach: [
      "写程序一定会遇到报错，这不代表你笨，只是电脑在告诉你「这里我看不懂」。",
      "最常见的三种：**SyntaxError**（标点、引号、括号写错了）、**NameError**（用了一个没定义的名字）、**TypeError**（文字和数字混在一起算了）。",
      "看到报错先看最后一行，它会告诉你错在哪里；再看行号，跳到那一行检查。平台里的「🩺 标点体检」也能帮你把中文标点改成英文标点。"
    ],
    code: "# 故意写错一行，看看报错长什么样\nprint(\"开始\")\n# print(\"漏了引号)\nprint(\"结束\")",
    explain: [
      "被注释掉的那一行其实是错的，但因为被 # 关掉了，程序不会报错。",
      "把 # 去掉再运行，你会看到 SyntaxError 的提示。",
      "改好以后程序就能继续往下跑了。"
    ],
    quiz: [
      { q: "NameError 通常意味着什么？", options: ["标点写错了", "用了一个没定义过的名字", "数字太大了"], answer: 1, tip: "比如变量名拼错了，电脑就不认识。" }
    ],
    task: "把上面那行的 # 去掉，运行一次，读一读报错信息，再把它改对。",
    practiceTopics: ["print"]
  },

  // ================= 第 2 单元 · 让小海龟画画 =================
  {
    id: "L12", stage: 1, unit: "第 2 单元 · 让小海龟画画",
    title: "turtle 入门：前进与转弯", emoji: "🐢", minutes: 8,
    goals: ["会 import turtle 并创建海龟", "会用 forward / right 让海龟动起来"],
    teach: [
      "Python 自带一只会画画的小海龟。先写 `import turtle` 把它请出来，再写 `t = turtle.Turtle()` 得到一只属于你的海龟。",
      "`t.forward(100)` 让它往前爬 100 步，同时画出一条线；`t.right(90)` 让它向右转 90 度。",
      "运行以后，右边的「海龟画布」上就会出现它走过的痕迹。"
    ],
    code: "import turtle\n\nt = turtle.Turtle()\nt.forward(100)\nt.right(90)\nt.forward(100)\nt.right(90)\nt.forward(100)",
    explain: [
      "import turtle 是「把海龟工具箱拿来」。",
      "t = turtle.Turtle() 创建一只海龟，名字叫 t。",
      "forward 是前进，right 是右转，left 是左转，backward 是后退。"
    ],
    quiz: [
      { q: "想让海龟往前走 50 步，应该写什么？", options: ["t.go(50)", "t.forward(50)", "t.walk(50)"], answer: 1, tip: "前进的英文是 forward。" }
    ],
    task: "让海龟画一个「L」形（先前进 120，右转 90，再前进 60）。",
    practiceTopics: ["turtle"]
  },
  {
    id: "L13", stage: 1, unit: "第 2 单元 · 让小海龟画画",
    title: "用循环画正方形", emoji: "🔁", minutes: 8,
    goals: ["发现重复的动作", "会用 for 循环让海龟重复画"],
    teach: [
      "画正方形时，「前进 100，右转 90」要重复 4 次。重复的事情，交给**循环**做最省力。",
      "`for i in range(4):` 的意思是「把下面的动作做 4 遍」，注意结尾的**英文冒号**不能丢。",
      "冒号下面的代码要**缩进**（往右空 4 格），表示它们是循环的一部分。"
    ],
    code: "import turtle\n\nt = turtle.Turtle()\nfor i in range(4):\n    t.forward(100)\n    t.right(90)",
    explain: [
      "range(4) 会给出 0、1、2、3 四个数，所以循环刚好跑 4 次。",
      "缩进是 Python 的规矩：冒号后面的内容必须往右缩进。",
      "把 range(4) 改成 range(3) 再右转 120 度，就变成三角形啦。"
    ],
    quiz: [
      { q: "画正六边形，每次应该右转多少度？", options: ["45 度", "60 度", "90 度"], answer: 1, tip: "360 ÷ 6 = 60。" }
    ],
    task: "把正方形改成六边形：循环 6 次，每次右转 60 度。",
    practiceTopics: ["turtle", "loop"]
  },
  {
    id: "L14", stage: 1, unit: "第 2 单元 · 让小海龟画画",
    title: "颜色、粗细与速度", emoji: "🎨", minutes: 7,
    goals: ["会设置画笔颜色和粗细", "会调整绘画速度"],
    teach: [
      "`t.pensize(5)` 把画笔变粗，`t.color(\"red\")` 换颜色，还可以直接写色号 `t.color(\"#EF4444\")`。",
      "`t.speed(0)` 是最快的速度（几乎瞬间画完），数字越小越慢，方便观察。",
      "颜色可以英文名（red、blue、gold），也可以用 # 开头的十六进制色号。"
    ],
    code: "import turtle\n\nt = turtle.Turtle()\nt.speed(3)\nt.pensize(5)\nt.color(\"#EF4444\")\nfor i in range(4):\n    t.forward(120)\n    t.right(90)",
    explain: [
      "pensize 是笔的粗细，数字越大线越粗。",
      "color 决定线条颜色。",
      "speed 只影响画得快慢，不影响画出来的形状。"
    ],
    quiz: [
      { q: "想让海龟画得最快，speed 里填几？", options: ["0", "10", "100"], answer: 0, tip: "speed(0) 是不带动画的极速模式。" }
    ],
    task: "画一个金色的三角形：pensize(6)、color(\"gold\")，循环 3 次每次右转 120 度。",
    practiceTopics: ["turtle"]
  },
  {
    id: "L15", stage: 1, unit: "第 2 单元 · 让小海龟画画",
    title: "抬笔与落笔：画出分开的图形", emoji: "🖌️", minutes: 7,
    goals: ["会用 penup / pendown 移动位置", "会用 goto 跳到指定坐标"],
    teach: [
      "海龟一路爬都会留下痕迹。想让它「空运」到别的地方，就先 `t.penup()` 抬笔，移动完再 `t.pendown()` 落笔。",
      "`t.goto(x, y)` 可以直接把海龟送到坐标 (x, y)。画布中心是 (0, 0)，往右 x 变大，往上 y 变大。",
      "画多个分开的图形时，抬笔落笔是必备技能。"
    ],
    code: "import turtle\n\nt = turtle.Turtle()\nt.speed(0)\n\nfor i in range(3):\n    t.penup()\n    t.goto(-150 + i * 150, 0)\n    t.pendown()\n    t.circle(40)",
    explain: [
      "penup() 之后的移动不会画线。",
      "goto 用的是坐标，负数表示往左或往下。",
      "循环里让 x 每次都变，就能画出一排圆。"
    ],
    quiz: [
      { q: "想让海龟移动但不在画布上留线，要先做什么？", options: ["t.penup()", "t.speed(0)", "t.clear()"], answer: 0, tip: "抬笔以后移动就不会留痕。" }
    ],
    task: "画三个分开的圆，圆心在同一水平线上。",
    practiceTopics: ["turtle", "loop"]
  },

  // ================= 第 3 单元 · 让程序会思考 =================
  {
    id: "L16", stage: 2, unit: "第 3 单元 · 让程序会思考",
    title: "比较运算与 True / False", emoji: "⚖️", minutes: 7,
    goals: ["会用 > < == != 比较", "知道比较的结果是 True 或 False"],
    teach: [
      "比较两个东西，结果只有两种：**True**（对）或 **False**（不对），这叫布尔值。",
      "常用符号：大于 `>`、小于 `<`、大于等于 `>=`、小于等于 `<=`、等于 `==`、不等于 `!=`。",
      "特别注意：判断相等要用**两个等号** `==`，一个等号 `=` 是赋值，别写错。"
    ],
    code: "score = 85\nprint(score > 60)\nprint(score == 100)\nprint(score != 0)\nprint(60 <= score)\nprint(\"及格了吗？\", score >= 60)",
    explain: [
      "score > 60 得到 True，因为 85 确实大于 60。",
      "score == 100 得到 False。",
      "True 和 False 的首字母要大写。"
    ],
    quiz: [
      { q: "判断「a 等于 b」应该怎么写？", options: ["a = b", "a == b", "a != b"], answer: 1, tip: "一个等号是赋值，两个等号才是比较。" }
    ],
    task: "读入两个整数，分别打印「第一个更大吗」「两个一样大吗」。",
    practiceTopics: ["if"]
  },
  {
    id: "L17", stage: 2, unit: "第 3 单元 · 让程序会思考",
    title: "if：如果……就……", emoji: "🤔", minutes: 8,
    goals: ["会写最简单的 if 判断", "知道条件后面要加冒号"],
    teach: [
      "`if` 让程序学会选择：条件成立就做某件事，不成立就跳过。",
      "写法：`if 条件:` 然后换行**缩进**写要做的事。冒号和缩进是 Python 的硬规矩。",
      "条件通常是一个比较，例如 `score >= 60`。"
    ],
    code: "score = 92\n\nif score >= 60:\n    print(\"恭喜，及格啦！\")\n    print(\"继续加油 💪\")\n\nprint(\"程序结束\")",
    explain: [
      "score >= 60 成立，所以缩进的两行都会执行。",
      "最后一行没有缩进，所以它不属于 if，一定会执行。",
      "把 score 改成 50 再运行，缩进的两行就都不会执行了。"
    ],
    quiz: [
      { q: "if 那一行的末尾必须写上什么？", options: ["分号 ;", "英文冒号 :", "什么都不用写"], answer: 1, tip: "冒号表示「下面是属于它的代码块」。" }
    ],
    task: "读入一个数字，如果它大于 100，就打印「好大的数！」。",
    practiceTopics: ["if"]
  },
  {
    id: "L18", stage: 2, unit: "第 3 单元 · 让程序会思考",
    title: "if-else：两条路选一条", emoji: "🛤️", minutes: 7,
    goals: ["会用 else 处理不成立的情况", "理解二选一的逻辑"],
    teach: [
      "`else` 表示「否则」：条件成立走 if 那条路，不成立就走 else 那条路。",
      "else 后面**不需要写条件**，直接跟冒号就行。",
      "两个分支只会执行其中一个，永远不会同时执行。"
    ],
    code: "n = 7\n\nif n % 2 == 0:\n    print(n, \"是偶数\")\nelse:\n    print(n, \"是奇数\")\n\nprint(\"判断完毕\")",
    explain: [
      "n % 2 == 0 成立说明能整除 2，就是偶数。",
      "7 % 2 是 1，不成立，所以走 else。",
      "if 和 else 要对齐写在同一列，里面的内容各自缩进。"
    ],
    quiz: [
      { q: "else 后面需要写条件吗？", options: ["需要", "不需要", "看情况"], answer: 1, tip: "else 就是「其它所有情况」。" }
    ],
    task: "读入一个数，是正数就打印「正数」，否则打印「不是正数」。",
    practiceTopics: ["if"]
  },
  {
    id: "L19", stage: 2, unit: "第 3 单元 · 让程序会思考",
    title: "elif：好多条岔路", emoji: "🚦", minutes: 8,
    goals: ["会用 elif 处理多个区间", "知道判断要从上往下按顺序"],
    teach: [
      "情况超过两种时，用 `elif`（else if 的缩写）继续往下判断。",
      "电脑会从上往下依次检查，**只要有一个成立，后面的就都不看了**。所以顺序很重要：要先写范围小的、分数高的。",
      "最后可以再加一个 else 兜底。"
    ],
    code: "score = 86\n\nif score >= 90:\n    print(\"优秀 ⭐⭐⭐\")\nelif score >= 80:\n    print(\"良好 ⭐⭐\")\nelif score >= 60:\n    print(\"及格 ⭐\")\nelse:\n    print(\"继续努力 💪\")",
    explain: [
      "86 不满足 >= 90，但满足 >= 80，所以打印「良好」。",
      "如果把 >= 60 写在最前面，86 就会被判成「及格」，那就不对了。",
      "每个分支的代码都要缩进。"
    ],
    quiz: [
      { q: "score = 95 时，上面代码会打印什么？", options: ["优秀", "良好", "三个都打印"], answer: 0, tip: "第一个条件就成立，后面的不再检查。" }
    ],
    task: "写一个「考试等第」程序，把分数分成 A/B/C/D 四档。",
    practiceTopics: ["if"]
  },
  {
    id: "L20", stage: 2, unit: "第 3 单元 · 让程序会思考",
    title: "and / or / not：把条件组合起来", emoji: "🔗", minutes: 8,
    goals: ["会用 and 表示「都要满足」", "会用 or 表示「满足一个就行」", "会用 not 取反"],
    teach: [
      "`and`：两个条件**都**成立才为真。例如「下雨 and 没带伞」。",
      "`or`：只要**有一个**成立就为真。例如「考了 100 分 or 作业全对」。",
      "`not`：把结果反过来，`not True` 就是 False。"
    ],
    code: "age = 10\nheight = 135\n\nprint(\"能玩过山车吗？\", age >= 12 and height >= 140)\nprint(\"可以买儿童票吗？\", age < 12 or height < 140)\nprint(\"不是小孩了吗？\", not (age < 12))\n\nif age >= 6 and age <= 12:\n    print(\"是小学生\")",
    explain: [
      "and 两边都要成立才算 True。",
      "or 只要一边成立就是 True。",
      "not 常常和括号一起用，表示「反过来」。"
    ],
    quiz: [
      { q: "True and False 的结果是什么？", options: ["True", "False", "会报错"], answer: 1, tip: "and 要求两边都成立。" }
    ],
    task: "写一个判断：分数在 60 到 100 之间才算有效成绩（用 and）。",
    practiceTopics: ["if"]
  },
  {
    id: "L21", stage: 2, unit: "第 3 单元 · 让程序会思考",
    title: "嵌套判断：判断里面还有判断", emoji: "🪆", minutes: 8,
    goals: ["会写嵌套的 if", "理解逐层筛选的思路"],
    teach: [
      "if 里面还能再写 if，这叫**嵌套**。第一层先筛掉大部分情况，第二层再细分。",
      "缩进会变成两层：外层 4 格，内层 8 格。写的时候要特别小心对齐。",
      "嵌套适合「先判断一个大类，再判断小类」的场景，比如先判断是不是闰年，再判断月份天数。"
    ],
    code: "score = 95\nattend = 0.9\n\nif score >= 90:\n    if attend >= 0.8:\n        print(\"全勤学霸，太厉害了！🏆\")\n    else:\n        print(\"成绩很好，要是能多来上课就更棒了\")\nelse:\n    print(\"继续加油 💪\")",
    explain: [
      "先判断成绩，再在成绩优秀的里面判断出勤。",
      "内层的 if 和 else 要和内层对齐。",
      "嵌套不要太深，最多两三层就够用了，太深容易看晕。"
    ],
    quiz: [
      { q: "嵌套 if 时最容易出错的是什么？", options: ["缩进对齐", "变量名太长", "print 用太多"], answer: 0, tip: "缩进错了，代码的归属关系就变了。" }
    ],
    task: "写一个程序：先判断一个数是不是正数，如果是，再判断它是不是偶数。",
    practiceTopics: ["if"]
  },

  // ================= 第 4 单元 · 重复的力量 =================
  {
    id: "L22", stage: 2, unit: "第 4 单元 · 重复的力量",
    title: "for 与 range：重复做事情", emoji: "🔁", minutes: 8,
    goals: ["会用 for i in range(n) 重复 n 次", "知道 range 的三种写法"],
    teach: [
      "`for i in range(5):` 会让下面的代码执行 5 次，i 依次等于 0、1、2、3、4。",
      "三种常用写法：`range(5)` 是 0~4；`range(1, 6)` 是 1~5；`range(1, 10, 2)` 是 1、3、5、7、9（步长 2）。",
      "重要的口诀：**range 的右边不包含**。所以想数到 n，要写 range(1, n + 1)。"
    ],
    code: "for i in range(5):\n    print(\"第\", i, \"次\")\n\nprint(\"----\")\n\nfor i in range(1, 6):\n    print(i)\n\nprint(\"----\")\n\nfor i in range(2, 11, 2):\n    print(i)",
    explain: [
      "range(5) 从 0 开始，到 4 结束。",
      "range(1, 6) 从 1 开始，到 5 结束。",
      "range(2, 11, 2) 每次加 2，打印所有偶数。"
    ],
    quiz: [
      { q: "range(1, 4) 会给出哪些数字？", options: ["1 2 3 4", "1 2 3", "0 1 2 3"], answer: 1, tip: "右边不包含，所以到 3 就停了。" }
    ],
    task: "用 for 循环打印 1 到 20 中所有 3 的倍数。",
    practiceTopics: ["loop"]
  },
  {
    id: "L23", stage: 2, unit: "第 4 单元 · 重复的力量",
    title: "累加器：把一串数字加起来", emoji: "🧮", minutes: 8,
    goals: ["会用一个变量累计结果", "知道累加器要在循环前准备好"],
    teach: [
      "想算 1 + 2 + 3 + … + n，要用一个「**累加器**」：先准备 total = 0，然后每圈把数字加进去。",
      "顺序很重要：total = 0 一定要写在**循环前面**，写在里面就会被反复清零。",
      "`total += i` 是 `total = total + i` 的简写。"
    ],
    code: "total = 0\n\nfor i in range(1, 11):\n    total += i\n\nprint(\"1 加到 10 等于\", total)\n\nproduct = 1\nfor i in range(1, 6):\n    product *= i\nprint(\"5 的阶乘是\", product)",
    explain: [
      "total 一开始是 0，每圈加一个 i。",
      "循环结束后 total 就是总和 55。",
      "求乘积时初值要设成 1，设成 0 的话乘出来永远是 0。"
    ],
    quiz: [
      { q: "求乘积时，累乘变量的初值应该设成多少？", options: ["0", "1", "随便"], answer: 1, tip: "0 乘任何数都是 0。" }
    ],
    task: "读入 n，算 1 + 2 + … + n，并打印结果。",
    practiceTopics: ["loop", "calc"]
  },
  {
    id: "L24", stage: 2, unit: "第 4 单元 · 重复的力量",
    title: "计数器与统计", emoji: "📊", minutes: 8,
    goals: ["会用计数器统计个数", "会在循环里挑出符合条件的数据"],
    teach: [
      "想数「有几个满足条件」，就用计数器：先 count = 0，遇到一个就 count += 1。",
      "配合 if 使用威力很大：遍历一批数据，只统计符合条件的那些。",
      "同一个循环里可以同时做多件事：求和、计数、找最大。"
    ],
    code: "nums = [12, 7, 20, 5, 18, 3]\n\ncount = 0\ntotal = 0\nfor n in nums:\n    total += n\n    if n >= 10:\n        count += 1\n\nprint(\"一共\", len(nums), \"个数\")\nprint(\"总和\", total)\nprint(\"大于等于 10 的有\", count, \"个\")",
    explain: [
      "for n in nums 会依次把列表里的每个数交给 n。",
      "满足 n >= 10 时才 count += 1。",
      "len(nums) 直接告诉我们列表有几个元素。"
    ],
    quiz: [
      { q: "计数器变量应该在什么时候设为 0？", options: ["循环开始前", "循环里面", "循环结束后"], answer: 0, tip: "和累加器一样，要在循环前准备好。" }
    ],
    task: "读入 5 个分数，统计其中及格（≥60）的有几个。",
    practiceTopics: ["loop", "list"]
  },
  {
    id: "L25", stage: 2, unit: "第 4 单元 · 重复的力量",
    title: "while 循环：条件成立就一直做", emoji: "♾️", minutes: 8,
    goals: ["会用 while 写循环", "知道要给循环留一条「出路」"],
    teach: [
      "`while 条件:` 表示条件成立就一直重复，直到条件不成立为止。",
      "while 最怕**死循环**：如果条件永远成立，程序就停不下来了。所以循环里一定要有让条件改变的动作。",
      "不确定要循环几次时用 while；知道次数时用 for 更方便。"
    ],
    code: "n = 5\n\nwhile n > 0:\n    print(n)\n    n -= 1\n\nprint(\"发射！🚀\")",
    explain: [
      "n 从 5 开始，每圈减 1，减到 0 时条件不成立，循环结束。",
      "如果忘了写 n -= 1，程序就会一直打印 5，变成死循环。",
      "真遇到死循环，可以点平台上的「⏹ 停止」按钮中断它。"
    ],
    quiz: [
      { q: "while 循环里最需要小心的是什么？", options: ["死循环", "变量名太长", "不能用 print"], answer: 0, tip: "一定要让条件有机会变成不成立。" }
    ],
    task: "用 while 循环打印 10、9、8……一直到 1。",
    practiceTopics: ["loop"]
  },
  {
    id: "L26", stage: 2, unit: "第 4 单元 · 重复的力量",
    title: "break 与 continue", emoji: "🚪", minutes: 7,
    goals: ["会用 break 提前结束循环", "会用 continue 跳过这一圈"],
    teach: [
      "`break` 是「不干了」：立刻跳出整个循环。",
      "`continue` 是「这圈不算」：跳过剩下的代码，直接开始下一圈。",
      "它们常常和 if 一起用：条件成立时提前退出或跳过。"
    ],
    code: "for i in range(1, 11):\n    if i == 5:\n        break\n    print(i)\n\nprint(\"----\")\n\nfor i in range(1, 11):\n    if i % 3 == 0:\n        continue\n    print(i)",
    explain: [
      "第一段循环到 i 等于 5 就停了，所以只打印 1 到 4。",
      "第二段遇到 3、6、9 就跳过，其它都打印。",
      "break 是彻底结束，continue 只是跳过这一圈。"
    ],
    quiz: [
      { q: "想「跳过这一圈继续下一圈」应该用哪个？", options: ["break", "continue", "return"], answer: 1, tip: "continue 是继续下一轮。" }
    ],
    task: "打印 1 到 20，遇到 7 的倍数就跳过。",
    practiceTopics: ["loop"]
  },
  {
    id: "L27", stage: 2, unit: "第 4 单元 · 重复的力量",
    title: "嵌套循环：里面还有一个循环", emoji: "🌀", minutes: 9,
    goals: ["会写两层循环", "理解外层管行、内层管列"],
    teach: [
      "循环里面再写循环，叫**嵌套循环**。外层跑一圈，内层要跑完整整一遍。",
      "画图形时特别好用：**外层管第几行，内层管这一行打印几个**。",
      "两层都用 i、j 当变量名是常见习惯：i 管外，j 管内。"
    ],
    code: "for i in range(1, 4):\n    for j in range(1, 4):\n        print(i, \"x\", j, \"=\", i * j)\n    print(\"----\")",
    explain: [
      "外层 i 从 1 到 3，内层 j 每次都要从 1 到 3 走一遍。",
      "所以一共打印 3 × 3 = 9 行。",
      "内层的 print 后面不换行的话，还能拼出图案（后面会学）。"
    ],
    quiz: [
      { q: "外层循环跑 3 次、内层跑 4 次，内层的代码一共执行几次？", options: ["7 次", "12 次", "4 次"], answer: 1, tip: "3 × 4 = 12。" }
    ],
    task: "用嵌套循环打印一个 3 行 4 列的星号方阵。",
    practiceTopics: ["loop", "shape"]
  },

  // ================= 第 5 单元 · 用循环画图案 =================
  {
    id: "L28", stage: 2, unit: "第 5 单元 · 用循环画图案",
    title: "打印星星三角形", emoji: "🔺", minutes: 8,
    goals: ["会用字符串乘法重复符号", "会打印直角三角形"],
    teach: [
      "在 Python 里，`\"*\" * 3` 会得到 `\"***\"`，字符串乘以数字就是重复几次。",
      "有了它，第 i 行要打印 i 个星号，只要写 `print(\"*\" * i)`。",
      "想要倒过来的三角形，就让 i 从大到小跑。"
    ],
    code: "n = 5\n\nfor i in range(1, n + 1):\n    print(\"*\" * i)\n\nprint(\"----\")\n\nfor i in range(n, 0, -1):\n    print(\"*\" * i)",
    explain: [
      "第一段是正三角形，越往下越宽。",
      "range(n, 0, -1) 让 i 从 5 减到 1，画出倒三角。",
      "字符串乘法让代码变得特别短。"
    ],
    quiz: [
      { q: "\"=\" * 4 的结果是什么？", options: ["====", "=4", "会报错"], answer: 0, tip: "字符串乘数字就是重复。" }
    ],
    task: "打印一个 6 行的星星直角三角形。",
    practiceTopics: ["shape", "loop"]
  },
  {
    id: "L29", stage: 2, unit: "第 5 单元 · 用循环画图案",
    title: "九九乘法表", emoji: "✖️", minutes: 9,
    goals: ["会用嵌套循环做表格", "会把一行内容拼成字符串"],
    teach: [
      "九九乘法表是嵌套循环的经典练习：外层 i 是行号，内层 j 从 1 数到 i。",
      "想让一行的内容排在同一行，可以先把它们拼成一个字符串，最后一次性打印。",
      "`print()` 后面不加东西就是换行；`print(x, end=\"\")` 可以不换行（进阶用法）。"
    ],
    code: "for i in range(1, 10):\n    row = \"\"\n    for j in range(1, i + 1):\n        row += str(j) + \"x\" + str(i) + \"=\" + str(i * j) + \"  \"\n    print(row)",
    explain: [
      "row 是这一行要打印的内容，每算一项就拼上去。",
      "数字要先用 str() 转成文字才能拼。",
      "内层是 range(1, i + 1)，所以第 i 行有 i 项。"
    ],
    quiz: [
      { q: "第 5 行会有几项乘法？", options: ["5 项", "9 项", "4 项"], answer: 0, tip: "内层是 range(1, i + 1)，i = 5 时是 5 项。" }
    ],
    task: "把乘法表改成只打印偶数行（提示：在循环里用 if 判断）。",
    practiceTopics: ["shape", "loop"]
  },
  {
    id: "L30", stage: 2, unit: "第 5 单元 · 用循环画图案",
    title: "海龟画彩色螺旋", emoji: "🌈", minutes: 8,
    goals: ["会把循环和颜色结合起来", "理解「每次转一点点」为什么能画出螺旋"],
    teach: [
      "如果每画一段就转一个**不是整圈约数**的角度，比如 59 度，线段就会绕着绕着形成螺旋。",
      "再把颜色列表循环使用，就能画出彩虹螺旋。`colors[i % len(colors)]` 是取颜色的常用技巧。",
      "让 forward 的距离一圈比一圈长，螺旋就会越来越大。"
    ],
    code: "import turtle\n\nt = turtle.Turtle()\nt.speed(0)\nt.pensize(2)\ncolors = [\"#EF4444\", \"#F97316\", \"#FACC15\", \"#22C55E\", \"#3B82F6\", \"#8B5CF6\"]\n\nfor i in range(90):\n    t.pencolor(colors[i % len(colors)])\n    t.forward(i * 2)\n    t.right(59)",
    explain: [
      "i % len(colors) 会让颜色循环使用：0,1,2,3,4,5,0,1…",
      "forward(i * 2) 让线段越来越长。",
      "把 59 改成 91，会画出另一种图案，试一试！"
    ],
    quiz: [
      { q: "colors 里有 6 种颜色时，colors[7 % 6] 是第几种颜色？", options: ["第 1 种", "第 2 种", "第 7 种"], answer: 1, tip: "7 % 6 = 1，下标 1 是第二种。" }
    ],
    task: "把角度改成 91 度、颜色换成 3 种，看看会画出什么。",
    practiceTopics: ["turtle", "loop"]
  },
  {
    id: "L31", stage: 2, unit: "第 5 单元 · 用循环画图案",
    title: "综合小项目：会动的彩虹风车", emoji: "🎡", minutes: 12,
    goals: ["把循环、颜色、海龟组合成作品", "学会自己调整参数做变化"],
    teach: [
      "现在把学过的东西合起来：用循环画四片叶子，每画完一片就转 90 度，就是一个风车。",
      "再用一个外循环换颜色，就能得到彩虹风车。",
      "写作品时不用一次写完美：先画出一片叶子，确认没问题再加循环，这样最稳。"
    ],
    code: "import turtle\n\nt = turtle.Turtle()\nt.speed(0)\nt.pensize(2)\ncolors = [\"#EF4444\", \"#F59E0B\", \"#10B981\", \"#3B82F6\"]\n\nfor i in range(4):\n    t.color(colors[i])\n    t.begin_fill()\n    t.forward(120)\n    t.right(90)\n    t.forward(40)\n    t.right(90)\n    t.forward(120)\n    t.end_fill()\n    t.left(180)\n    t.right(90)\n\nprint(\"彩虹风车画好啦！试着改改颜色吧 🎡\")",
    explain: [
      "begin_fill() 和 end_fill() 之间画出的形状会被填色。",
      "每画完一片叶子就把海龟转回原来的方向，才能接着画下一片。",
      "改 colors 里的色号，就能换一套配色。"
    ],
    quiz: [
      { q: "想让风车有 6 片叶子，循环次数和每次转的角度应该怎么改？", options: ["6 次、60 度", "6 次、90 度", "4 次、60 度"], answer: 0, tip: "360 ÷ 6 = 60。" }
    ],
    task: "把风车改成 6 片叶子、6 种颜色，然后保存你的画作。",
    practiceTopics: ["turtle", "shape"]
  },
  {
    id: "L32", stage: 2, unit: "第 5 单元 · 用循环画图案",
    title: "阶段小结：一级、二级都学会了什么", emoji: "🏁", minutes: 6,
    goals: ["回顾一级、二级的核心知识", "知道接下来该练什么"],
    teach: [
      "一级的重点是**顺序**：会输出、会输入、会用变量、会算数。二级的重点是**选择与重复**：会用 if 判断、会用 for/while 循环。",
      "这两部分正是 GESP 一级、二级考试的主力题型：读入数据 → 计算 → 按格式输出。",
      "接下来去「练习」里把「输出打印、输入问答、算术运算、条件判断、循环重复、图形打印」这些主题刷一刷，做错的题一定要看懂为什么。"
    ],
    code: "# 综合小测：读入两个整数，输出它们的和、差、积、商\n# 把下面两行的注释去掉就能用\n# a = int(input())\n# b = int(input())\n\na = 12\nb = 5\nprint(\"和\", a + b)\nprint(\"差\", a - b)\nprint(\"积\", a * b)\nprint(\"商\", a // b, \"余\", a % b)",
    explain: [
      "读入 + 计算 + 输出，就是最典型的考试题型。",
      "整除和取余经常一起出现，要记牢。",
      "打印时的格式要和题目要求一模一样，多一个空格都可能不对。"
    ],
    quiz: [
      { q: "GESP 一级、二级最常考的两大结构是什么？", options: ["顺序与循环", "类和对象", "多线程"], answer: 0, tip: "顺序、分支、循环是程序的基本结构。" }
    ],
    task: "去「练习」里挑 10 道一级难度的题做完，看看能不能连对 10 道。",
    practiceTopics: ["print", "calc", "if", "loop", "shape"]
  }
];

// 高级篇（字符串、列表、字典、函数、算法）在 js/lessons-adv.js 里，
// learn.js 加载完成后会把两份课程合并到一起。
