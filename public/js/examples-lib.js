/**
 * 📚 少儿 Python 示例宝库（纯数据文件）
 * 这里只有两个常量，没有函数、没有导入，小朋友可以直接看、直接改 ✨
 *
 *   LEARN_EXAMPLE_CATEGORIES ：10 个分类（id / name / emoji）
 *   LEARN_EXAMPLES            ：可以直接运行的小示例，每个都配有说明和「改一改」的小建议
 *
 * level 的含义：1 = 一看就懂，2 = 要动脑，3 = 有点挑战 🚀
 */

// 🗂️ 十个示例分类，每个分类都有 12 个小示例
const LEARN_EXAMPLE_CATEGORIES = [
  { id: "print", name: "打招呼与输出", emoji: "🗣️" },
  { id: "var", name: "变量百宝箱", emoji: "📦" },
  { id: "calc", name: "算术小能手", emoji: "➕" },
  { id: "if", name: "条件判断站", emoji: "🤔" },
  { id: "loop", name: "循环转圈圈", emoji: "🔁" },
  { id: "string", name: "字符串魔法", emoji: "✨" },
  { id: "list", name: "列表与字典", emoji: "📋" },
  { id: "func", name: "函数积木", emoji: "🧩" },
  { id: "math", name: "数学与随机", emoji: "🔢" },
  { id: "turtle", name: "海龟画图", emoji: "🐢" }
];

// 🎁 示例宝库：共 120 个小示例，分成 10 类，每一段都能直接运行
const LEARN_EXAMPLES = [
  // ===== 🗣️ 打招呼与输出（12 个）=====
  {
    id: "lb_p01",
    title: "我叫小小程序员",
    emoji: "🌟",
    category: "print",
    level: 1,
    desc: "用 print 说第一句话，认识 Python 的神奇嘴巴",
    tip: "把引号里的字换成你自己的名字，再运行一次看看～",
    code: "# 🌟 我的第一个 Python 程序\n# 💡 把引号里的话换成你想说的，再运行一次看看～\n\nprint(\"你好！我叫小小程序员 🐱\")\nprint(\"我正在学 Python，超酷的！\")\nprint(\"以后我要用代码做一个小游戏 🎮\")"
  },
  {
    id: "lb_p02",
    title: "三句话介绍我",
    emoji: "🗣️",
    category: "print",
    level: 1,
    desc: "想说几句话就写几行 print，简单又直接",
    tip: "把名字、年龄、爱好改成你自己的，就是你的自我介绍啦",
    code: "# 🗣️ 三句话介绍我自己\n# 💡 print 就是\"说出来\"的意思，想说几句就写几行～\n\nprint(\"我叫小海豚 🐬\")\nprint(\"我今年 10 岁啦 🎂\")\nprint(\"我最喜欢画画和编程 🎨\")\nprint(\"很高兴认识大家！👋\")"
  },
  {
    id: "lb_p03",
    title: "我的电子名片",
    emoji: "💳",
    category: "print",
    level: 1,
    desc: "用等号和文字排版，做一张自己的名片",
    tip: "姓名和爱好改成你的，这张名片就属于你啦",
    code: "# 💳 做一张自己的电子名片\n# 💡 用 \"=\" * 26 就能画出一条长长的分隔线～\n\nprint(\"=\" * 26)\nprint(\"  🌟 我 的 名 片 🌟\")\nprint(\"=\" * 26)\nprint(\"姓名：小星星\")\nprint(\"年龄：10 岁\")\nprint(\"爱好：编程、画画、踢足球\")\nprint(\"=\" * 26)"
  },
  {
    id: "lb_p04",
    title: "键盘画小房子",
    emoji: "🏠",
    category: "print",
    level: 1,
    desc: "只用键盘上的符号，也能画出一座小房子",
    tip: "数一数每行前面的空格，房子就站得端端正正",
    code: "# 🏠 用字符画一座小房子\n# 💡 每一行前面的空格很重要，它决定房子正不正～\n\nprint(\"   ^   \")\nprint(\"  ^^^  \")\nprint(\" ^^^^^ \")\nprint(\" |   | \")\nprint(\" | o | \")\nprint(\" |___| \")\nprint(\"小房子盖好啦，欢迎来做客 🏠\")"
  },
  {
    id: "lb_p05",
    title: "print 也会算术",
    emoji: "➕",
    category: "print",
    level: 1,
    desc: "print 不只是会说话，还会帮你算数",
    tip: "把里面的数字换掉，看看结果会变成多少？",
    code: "# ➕ print 里可以直接做算术\n# 💡 逗号会把前后的内容分开一格打印出来～\n\nprint(\"3 + 5 =\", 3 + 5)\nprint(\"10 - 4 =\", 10 - 4)\nprint(\"6 × 7 =\", 6 * 7)\nprint(\"20 ÷ 4 =\", 20 / 4)\nprint(\"2 的 3 次方 =\", 2 ** 3)"
  },
  {
    id: "lb_p06",
    title: "爱心发射准备",
    emoji: "💗",
    category: "print",
    level: 1,
    desc: "文字乘以数字，就能变出一长串爱心",
    tip: "把 3 改成 10，爱心会变成长长的一条哦",
    code: "# 💗 爱心发射，开始倒数！\n# 💡 字符串乘以数字，就是重复很多很多遍～\n\nprint(\"爱心发射倒计时：3️⃣ 2️⃣ 1️⃣\")\nprint(\"💗\" * 3)\nprint(\"爱心小火箭升空啦！🚀\")\nprint(\"💗\" * 8)\nprint(\"送给看到这里的你～\")"
  },
  {
    id: "lb_p07",
    title: "星星小金字塔",
    emoji: "⭐",
    category: "print",
    level: 1,
    desc: "用空格和星星，搭一座漂亮的金字塔",
    tip: "每一行都比上一行多两颗星，数数看对不对？",
    code: "# ⭐ 用 print 搭一座星星金字塔\n# 💡 前面空格越来越少，星星越来越多，塔就出现了～\n\nprint(\"    ⭐\")\nprint(\"   ⭐⭐⭐\")\nprint(\"  ⭐⭐⭐⭐⭐\")\nprint(\" ⭐⭐⭐⭐⭐⭐⭐\")\nprint(\"⭐⭐⭐⭐⭐⭐⭐⭐⭐\")\nprint(\"金字塔搭好啦！🎉\")"
  },
  {
    id: "lb_p08",
    title: "字符小猫咪",
    emoji: "🐱",
    category: "print",
    level: 1,
    desc: "用键盘符号画一只会喵喵叫的小猫",
    tip: "把 o.o 改成 -.- 小猫就睡着啦，试试看～",
    code: "# 🐱 字符小猫咪来啦\n# 💡 每一行都是一个 print，组合起来就是一幅画～\n\nprint(\" /\\\\_/\\\\ \")\nprint(\"( o.o )  喵~\")\nprint(\" > ^ < \")\nprint(\"\")\nprint(\"我是用键盘画出来的小猫 🐱\")"
  },
  {
    id: "lb_p09",
    title: "分隔线真好用",
    emoji: "➖",
    category: "print",
    level: 1,
    desc: "一条漂亮的分隔线，让内容变得清清爽爽",
    tip: "把 - 换成 = 或 ✧，分隔线立刻就换新装啦",
    code: "# ➖ 一条漂亮的分隔线\n# 💡 先把分隔线存进变量，用的时候直接拿出来～\n\nline = \"-\" * 30\nprint(line)\nprint(\"📅 今天的计划\")\nprint(line)\nprint(\"1. 读一本绘本\")\nprint(\"2. 写一个 Python 小程序\")\nprint(\"3. 出去玩一小时\")\nprint(line)"
  },
  {
    id: "lb_p10",
    title: "加油口号说三遍",
    emoji: "📣",
    category: "print",
    level: 1,
    desc: "给自己喊个口号，一句话重复说好多遍",
    tip: "把「加油！」换成你最喜欢的一句鼓励的话吧",
    code: "# 📣 把一句话说三遍\n# 💡 字符串乘以数字，想重复几遍就重复几遍～\n\nprint(\"加油！\" * 3)\nprint(\"我可以做到！\" * 2)\nprint(\"-\" * 24)\nprint(\"每天进步一点点 🌱\" * 2)"
  },
  {
    id: "lb_p11",
    title: "我的一周课程表",
    emoji: "📚",
    category: "print",
    level: 1,
    desc: "把一周的课表打印出来，贴在书桌前",
    tip: "换成你自己的课程，还能加上每天的心情哦",
    code: "# 📚 打印我的一周课程表\n# 💡 一行一天，写起来就像记日记一样轻松～\n\nprint(\"📅 我的一周课程表\")\nprint(\"星期一：语文、数学、体育 ⚽\")\nprint(\"星期二：英语、美术、音乐 🎵\")\nprint(\"星期三：数学、科学、编程 💻\")\nprint(\"星期四：语文、英语、书法 ✍️\")\nprint(\"星期五：体育、信息、班会 🎉\")\nprint(\"周末：睡懒觉 + 玩代码 😴\")"
  },
  {
    id: "lb_p12",
    title: "给妈妈的祝福卡",
    emoji: "💌",
    category: "print",
    level: 1,
    desc: "做一张暖暖的电子贺卡，送给最想感谢的人",
    tip: "把「妈妈」换成你想送的人，卡片就属于 TA 啦",
    code: "# 💌 给妈妈做一张祝福卡\n# 💡 用 emoji 排成边框，卡片一下子就漂亮了～\n\nprint(\"🌸\" * 20)\nprint(\"亲爱的妈妈：\")\nprint(\"    谢谢您每天给我做好吃的饭菜 🍚\")\nprint(\"    祝您天天开心，永远年轻漂亮！\")\nprint(\"                    爱您的小朋友 💗\")\nprint(\"🌸\" * 20)"
  },

  // ===== 📦 变量百宝箱（12 个）=====
  {
    id: "lb_v01",
    title: "变量是个小盒子",
    emoji: "📦",
    category: "var",
    level: 1,
    desc: "变量就像贴了名字的小盒子，里面能装东西",
    tip: "把盒子里的名字和年龄换成你自己的，再运行一次",
    code: "# 📦 变量就像一个小盒子\n# 💡 等号左边是盒子的名字，右边是装进去的东西～\n\nname = \"小海豚\"      # 装文字的小盒子\nage = 10             # 装数字的小盒子\ncolor = \"蓝色\"       # 装颜色的小盒子\n\nprint(f\"我叫{name}，今年{age}岁\")\nprint(f\"我最喜欢的颜色是{color} 💙\")"
  },
  {
    id: "lb_v02",
    title: "问问你叫什么",
    emoji: "🙋",
    category: "var",
    level: 1,
    desc: "用 input 问一句话，把回答装进变量里",
    tip: "在下面的输入框里写上你的名字，回车试试！",
    code: "# 🙋 用 input 问一问名字\n# 💡 input 会停下来等你打字，打完了再继续往下走～\n\nname = input(\"你叫什么名字呀？\").strip()\nif name == \"\":\n    name = \"神秘小客人\"\n\nprint(f\"你好，{name}！欢迎来到 Python 世界 🎉\")\nprint(f\"你的名字有 {len(name)} 个字，真好听！\")"
  },
  {
    id: "lb_v03",
    title: "年龄一年年长大",
    emoji: "🎂",
    category: "var",
    level: 1,
    desc: "变量的数字可以随时变大，就像年龄一样",
    tip: "把 age 改成你现在的年龄，看看 2 年后你几岁？",
    code: "# 🎂 年龄一年一年长大\n# 💡 把变量自己加 1，再放回这个变量里～\n\nage = 10\nprint(f\"我今年 {age} 岁\")\n\nage = age + 1\nprint(f\"过一年，我 {age} 岁啦 🎈\")\n\nage = age + 1\nprint(f\"再过一年，我 {age} 岁啦 🎈\")\nprint(\"变量里的数字随时可以变大哦！\")"
  },
  {
    id: "lb_v04",
    title: "两个盒子换东西",
    emoji: "🔄",
    category: "var",
    level: 1,
    desc: "Python 有一句神奇的话，能一次交换两个变量",
    tip: "把饮料名字换成你喜欢的，交换结果一样快",
    code: "# 🔄 两个盒子里的东西换一换\n# 💡 一行 cup_a, cup_b = cup_b, cup_a 就能交换，不用第三个杯子～\n\ncup_a = \"🍎 苹果汁\"\ncup_b = \"🍇 葡萄汁\"\nprint(\"交换前：\", cup_a, \"|\", cup_b)\n\ncup_a, cup_b = cup_b, cup_a\n\nprint(\"交换后：\", cup_a, \"|\", cup_b)\nprint(\"两杯饮料换好啦 ✨\")"
  },
  {
    id: "lb_v05",
    title: "看看变量是什么类型",
    emoji: "🔍",
    category: "var",
    level: 1,
    desc: "type() 像放大镜，能看出盒子里装的是什么",
    tip: "再试试 type(3.14) 和 type(\"1\")，看看有什么不同",
    code: "# 🔍 用 type() 看看变量是什么类型\n# 💡 文字、整数、小数、真假值，是四种最常见的类型～\n\nname = \"小星星\"\nage = 10\nheight = 1.42\nis_student = True\n\nprint(name, \"的类型是\", type(name))\nprint(age, \"的类型是\", type(age))\nprint(height, \"的类型是\", type(height))\nprint(is_student, \"的类型是\", type(is_student))"
  },
  {
    id: "lb_v06",
    title: "文字和数字不能直接相加",
    emoji: "🧩",
    category: "var",
    level: 1,
    desc: "文字加数字会报错，得先用 str() 变身",
    tip: "把 age 改成你的年龄，看看两句话是不是都对",
    code: "# 🧩 文字和数字不能直接相加\n# 💡 用 str() 把数字变成文字，就能拼在一起啦～\n\nage = 10\ntext = \"我今年 \" + str(age) + \" 岁\"\nprint(text)\n\n# f-string 更省事，什么都不用转 ✨\nprint(f\"用 f-string 写：我今年 {age} 岁\")"
  },
  {
    id: "lb_v07",
    title: "真和假两个开关",
    emoji: "🔘",
    category: "var",
    level: 1,
    desc: "True 和 False 就像开和关，用来表示对与错",
    tip: "把 5 > 3 改成 5 < 3，看看开关会不会翻个面？",
    code: "# 🔘 True 和 False 就像两个小开关\n# 💡 比较大小得到的结果，就是一个 True 或 False～\n\nis_sunny = True\nis_raining = False\n\nprint(\"今天出太阳了吗？\", is_sunny)\nprint(\"今天在下雨吗？\", is_raining)\nprint(\"5 比 3 大吗？\", 5 > 3)\nprint(\"5 比 3 小吗？\", 5 < 3)"
  },
  {
    id: "lb_v08",
    title: "一行装好几个盒子",
    emoji: "🎁",
    category: "var",
    level: 1,
    desc: "一行代码就能给好几个变量同时赋值",
    tip: "把 x、y、z 换成别的数字，看看它们的和怎么变",
    code: "# 🎁 一行就能给好几个盒子装东西\n# 💡 数一数左边几个名字、右边几个数字，它们要一一对应～\n\nx, y, z = 3, 6, 9\nprint(\"x =\", x, \" y =\", y, \" z =\", z)\nprint(\"它们的和是：\", x + y + z)\n\na = b = c = 100\nprint(\"a、b、c 都是：\", a, b, c)"
  },
  {
    id: "lb_v09",
    title: "给变量取个好名字",
    emoji: "🏷️",
    category: "var",
    level: 1,
    desc: "名字取得好，代码就像说话一样好读",
    tip: "再给语文成绩取个变量名，把三科都打印出来",
    code: "# 🏷️ 给变量取个好名字\n# 💡 my_score 比 a 好得多，一看就知道盒子里装的是什么～\n\nmy_score = 95\nmath_score = 98\nenglish_score = 92\n\nprint(\"数学成绩：\", math_score)\nprint(\"英语成绩：\", english_score)\nprint(f\"两科一共 {math_score + english_score} 分！\")\nprint(\"取好名字，代码就像说话一样好读 📖\")"
  },
  {
    id: "lb_v10",
    title: "小明的存钱罐",
    emoji: "🐷",
    category: "var",
    level: 1,
    desc: "用变量一点点累加，就像往存钱罐里丢硬币",
    tip: "把每天存的钱换成你的数字，算算多久能存够 50 元",
    code: "# 🐷 小明的存钱罐\n# 💡 每次都把新存的钱加到原来那个变量上～\n\nmoney = 0\nmoney = money + 5     # 第一天存 5 元\nmoney = money + 8     # 第二天存 8 元\nmoney = money + 12    # 第三天存 12 元\n\nprint(f\"存钱罐里一共有 {money} 元啦 🐷\")\nprint(f\"再存 {50 - money} 元就能买那本漫画书了 📖\")"
  },
  {
    id: "lb_v11",
    title: "把变量拼成一句话",
    emoji: "🧵",
    category: "var",
    level: 1,
    desc: "f-string 里的花括号就像小口袋，能塞变量进去",
    tip: "换掉动物和数字，编一句你自己的小句子吧",
    code: "# 🧵 把好几个变量拼成一句话\n# 💡 f 开头的字符串里，{} 中间写变量名就会被替换～\n\nanimal = \"小熊猫\"\nfood = \"竹子\"\ncount = 6\n\nprint(f\"{animal}最爱吃{food}了 🐼\")\nprint(f\"它一口气吃了 {count} 根，肚子圆滚滚的！\")\nprint(f\"还剩 {10 - count} 根，明天再吃～\")"
  },
  {
    id: "lb_v12",
    title: "变量随时可以换内容",
    emoji: "✏️",
    category: "var",
    level: 1,
    desc: "同一个变量，后写的会盖住先写的",
    tip: "把天气换成今天真实的天气，看看输出变了没",
    code: "# ✏️ 变量里的东西可以随时换掉\n# 💡 就像用橡皮擦掉重写，新的内容会盖住旧的～\n\nweather = \"晴天 ☀️\"\nprint(\"现在的天气：\", weather)\n\nweather = \"下雨 🌧️\"\nprint(\"过了一小时：\", weather)\n\nweather = \"彩虹 🌈\"\nprint(\"雨停之后：\", weather)\nprint(\"变量随时可以换新内容哦！\")"
  },

  // ===== ➕ 算术小能手（12 个）=====
  {
    id: "lb_c01",
    title: "加法和减法",
    emoji: "➕",
    category: "calc",
    level: 1,
    desc: "学会用 Python 做加法和减法",
    tip: "把数字换成你喜欢的，算一算结果对不对？",
    code: "# ➕ 加法和减法\n# 💡 + 是加，- 是减，写起来和数学课一样～\n\nprint(\"12 + 8 =\", 12 + 8)\nprint(\"30 - 7 =\", 30 - 7)\nprint(\"100 + 200 =\", 100 + 200)\nprint(\"甜甜圈 15 元，付了 20 元，找零\", 20 - 15, \"元 🍩\")"
  },
  {
    id: "lb_c02",
    title: "乘法和除法",
    emoji: "✖️",
    category: "calc",
    level: 1,
    desc: "乘号是星号，除号是斜杠，别记错啦",
    tip: "试试 8 / 2，看看结果是 4 还是 4.0？",
    code: "# ✖️ 乘法和除法\n# 💡 Python 里乘法写 *，除法写 /，除法结果带小数点～\n\nprint(\"6 × 7 =\", 6 * 7)\nprint(\"8 ÷ 2 =\", 8 / 2)\nprint(\"9 ÷ 2 =\", 9 / 2)\n\nprint(\"一盒彩笔 12 支，3 盒一共\", 12 * 3, \"支 🖍️\")\nprint(\"24 颗糖分给 4 个小朋友，每人\", 24 / 4, \"颗 🍬\")"
  },
  {
    id: "lb_c03",
    title: "整除和取余",
    emoji: "🔢",
    category: "calc",
    level: 1,
    desc: "两个斜杠要整数，百分号要零头",
    tip: "把 17 和 5 换成别的数字，看看商和余数怎么变",
    code: "# 🔢 整除 // 和取余 %\n# 💡 // 只要整数部分，% 只要剩下的零头～\n\nprint(\"17 ÷ 5 的整数部分：\", 17 // 5)\nprint(\"17 ÷ 5 的余数：\", 17 % 5)\n\ncandy = 17\nkids = 5\nprint(f\"{candy} 颗糖分给 {kids} 个小朋友：\")\nprint(f\"每人分到 {candy // kids} 颗，还剩 {candy % kids} 颗 🍬\")"
  },
  {
    id: "lb_c04",
    title: "分蛋糕学除法",
    emoji: "🍰",
    category: "calc",
    level: 1,
    desc: "用整除和取余，一次算出每人几块、还剩几块",
    tip: "把蛋糕数和人数改一改，看看分配结果",
    code: "# 🍰 分蛋糕学除法\n# 💡 每人几块用 //，剩下几块用 %，两个一起用最方便～\n\ncake = 20\npeople = 6\n\neach = cake // people\nleft = cake % people\n\nprint(f\"有 {cake} 块小蛋糕，分给 {people} 个人 🍰\")\nprint(f\"每人分到 {each} 块\")\nprint(f\"还剩下 {left} 块，留给你当宵夜吧 😋\")"
  },
  {
    id: "lb_c05",
    title: "会算数的计算器",
    emoji: "🧮",
    category: "calc",
    level: 1,
    desc: "输入两个数字，让 Python 帮你算加减乘",
    tip: "在输入框里写数字试试，写完再换个数字玩玩",
    code: "# 🧮 会算数的加法计算器\n# 💡 input 拿到的是文字，要用 int() 变成整数才能算～\n\na_text = input(\"请输入第一个数字：\").strip()\nb_text = input(\"请输入第二个数字：\").strip()\n\na = int(a_text) if a_text.isdigit() else 6\nb = int(b_text) if b_text.isdigit() else 7\n\nprint(f\"{a} + {b} = {a + b} ✅\")\nprint(f\"{a} - {b} = {a - b}\")\nprint(f\"{a} × {b} = {a * b}\")"
  },
  {
    id: "lb_c06",
    title: "2 的 10 次方",
    emoji: "🚀",
    category: "calc",
    level: 1,
    desc: "两个星号就是几次方的意思",
    tip: "把 2 换成 3 或 10，看看数字涨得多快",
    code: "# 🚀 2 的 10 次方有多大？\n# 💡 ** 是\"几次方\"，2 ** 3 就是 2 乘 2 再乘 2～\n\nprint(\"2 的 3 次方 =\", 2 ** 3)\nprint(\"2 的 10 次方 =\", 2 ** 10)\nprint(\"10 的 4 次方 =\", 10 ** 4)\n\nprint(\"一张纸对折 10 次，会有\", 2 ** 10, \"层厚 📄\")"
  },
  {
    id: "lb_c07",
    title: "算一算圆的面积",
    emoji: "⭕",
    category: "calc",
    level: 1,
    desc: "半径乘半径再乘 3.14，就是圆的面积",
    tip: "把半径 r 改成 10，看看面积和周长变成多少",
    code: "# ⭕ 算一算圆的面积\n# 💡 面积是 半径 × 半径 × 3.14，周长是 2 × 3.14 × 半径～\n\npi = 3.14\nr = 5\n\narea = pi * r * r\nprint(f\"半径 {r} 厘米的圆：\")\nprint(f\"面积是 {area} 平方厘米 ⭕\")\nprint(f\"周长是 {2 * pi * r} 厘米 📏\")"
  },
  {
    id: "lb_c08",
    title: "算一算平均分",
    emoji: "📊",
    category: "calc",
    level: 1,
    desc: "总分除以科目数，就是平均分",
    tip: "把三科成绩换成你的分数，看看平均分是多少",
    code: "# 📊 算一算平均分\n# 💡 先算总分，再除以科目数量，就是平均分～\n\nchinese = 92\nmath = 98\nenglish = 95\n\ntotal = chinese + math + english\naverage = total / 3\n\nprint(f\"语文 {chinese} 分，数学 {math} 分，英语 {english} 分\")\nprint(f\"总分是 {total} 分\")\nprint(f\"平均分是 {average:.1f} 分 📊\")"
  },
  {
    id: "lb_c09",
    title: "几秒是几分",
    emoji: "⏰",
    category: "calc",
    level: 1,
    desc: "把一大串秒数，换成几小时几分几秒",
    tip: "把 3725 改成你跑步的秒数，看看是什么结果",
    code: "# ⏰ 把秒数变成几分几秒\n# 💡 用 // 算分钟，用 % 算多出来的秒，搭配起来刚刚好～\n\ntotal_seconds = 3725\n\nminutes = total_seconds // 60\nseconds = total_seconds % 60\nhours = total_seconds // 3600\n\nprint(f\"{total_seconds} 秒 = {minutes} 分 {seconds} 秒 ⏰\")\nprint(f\"也就是 {hours} 小时多一点\")\nprint(\"跑一场马拉松大概就是这个时间 🏃\")"
  },
  {
    id: "lb_c10",
    title: "买东西算找零",
    emoji: "💰",
    category: "calc",
    level: 1,
    desc: "算算能买几份、要找多少钱",
    tip: "把笔的价钱和你的钱改一改，重新算一遍",
    code: "# 💰 买东西算找零\n# 💡 找零用减法，能买几份用整除，剩下的钱用取余～\n\nprice = 8\nmoney = 50\n\nprint(f\"一支笔 {price} 元，你有 {money} 元 💰\")\nprint(f\"买 1 支要找你 {money - price} 元\")\nprint(f\"这些钱最多能买 {money // price} 支，还剩 {money % price} 元\")"
  },
  {
    id: "lb_c11",
    title: "先算乘除后算加减",
    emoji: "🧠",
    category: "calc",
    level: 1,
    desc: "括号像优先通行证，里面的会先算",
    tip: "比较一下有括号和没括号的结果，差别很大哦",
    code: "# 🧠 先算乘除，后算加减\n# 💡 加上括号就会先算括号里面的，结果可能完全不一样～\n\nprint(\"2 + 3 * 4 =\", 2 + 3 * 4)\nprint(\"(2 + 3) * 4 =\", (2 + 3) * 4)\nprint(\"10 - 2 - 3 =\", 10 - 2 - 3)\nprint(\"10 - (2 - 3) =\", 10 - (2 - 3))\nprint(\"括号就是优先通行证 🎫\")"
  },
  {
    id: "lb_c12",
    title: "去掉负号和四舍五入",
    emoji: "🎯",
    category: "calc",
    level: 2,
    desc: "abs 能把负号去掉，round 能帮数字四舍五入",
    tip: "试试 round(3.14159, 3)，看看会保留几位小数",
    code: "# 🎯 abs 和 round 两个小工具\n# 💡 abs 把负号去掉，round 后面的数字表示保留几位小数～\n\nprint(\"abs(-7) =\", abs(-7))\nprint(\"abs(3 - 10) =\", abs(3 - 10))\nprint(\"round(3.14159, 2) =\", round(3.14159, 2))\nprint(\"round(2.567, 1) =\", round(2.567, 1))\nprint(\"今天和昨天温度差了\", abs(-3 - 8), \"度 🌡️\")"
  },

  // ===== 🤔 条件判断站（12 个）=====
  {
    id: "lb_i01",
    title: "你长大了吗",
    emoji: "🎫",
    category: "if",
    level: 1,
    desc: "如果……就……否则……，程序也会做选择",
    tip: "把 age 改成你自己的年龄，看看会走哪一条路",
    code: "# 🎫 你长大了吗？\n# 💡 if 后面的条件成立就走第一段，不成立就走 else 那段～\n\nage = 12\n\nif age >= 18:\n    print(\"你已经是大朋友啦，可以自己买票 🎫\")\nelse:\n    print(\"还是小朋友，买票可以半价哦 🧒\")\n\nprint(\"判断结束，程序继续往下走 ✨\")"
  },
  {
    id: "lb_i02",
    title: "奇数还是偶数",
    emoji: "🔢",
    category: "if",
    level: 1,
    desc: "除以 2 余数是 0，这个数就是偶数",
    tip: "把 number 改成 8 或 15，看看结果怎么变",
    code: "# 🔢 这个数是奇数还是偶数？\n# 💡 用 % 2 看余数：余 0 是偶数，余 1 是奇数～\n\nnumber = 7\n\nif number % 2 == 0:\n    print(f\"{number} 是偶数 🎈\")\nelse:\n    print(f\"{number} 是奇数 🎲\")\n\nprint(\"用 % 2 就能看穿奇偶数！\")"
  },
  {
    id: "lb_i03",
    title: "分数变成等级",
    emoji: "🏆",
    category: "if",
    level: 1,
    desc: "输入一个分数，看它是什么等级",
    tip: "在输入框里写 88 或 59 试试，等级会不一样哦",
    code: "# 🏆 分数变成等级\n# 💡 elif 就是\"再如果\"，可以一路往下判断好几层～\n\ntext = input(\"请输入你的分数（0~100）：\").strip()\nscore = int(text) if text.isdigit() else 88\n\nif score >= 90:\n    grade = \"A 优秀 🌟\"\nelif score >= 80:\n    grade = \"B 良好 👍\"\nelif score >= 60:\n    grade = \"C 及格 💪\"\nelse:\n    grade = \"D 要加油啦 🌱\"\n\nprint(f\"{score} 分，等级是 {grade}\")"
  },
  {
    id: "lb_i04",
    title: "小密码锁",
    emoji: "🔐",
    category: "if",
    level: 1,
    desc: "两个等号用来比较，是不是一模一样",
    tip: "把 secret 换成你自己的密码，再改改 guess 试试",
    code: "# 🔐 小密码锁\n# 💡 一个等号是赋值，两个等号才是比较相不相等～\n\nsecret = \"python\"\nguess = \"python\"\n\nif guess == secret:\n    print(\"密码正确，欢迎回来！🔓\")\nelse:\n    print(\"密码不对，再想一想 🔒\")\n\nprint(\"== 用来比较两个东西是不是一模一样\")"
  },
  {
    id: "lb_i05",
    title: "两个数比大小",
    emoji: "⚖️",
    category: "if",
    level: 1,
    desc: "谁大谁小，让程序帮你判断",
    tip: "把 a 和 b 换成一样的数字，看看会打印什么",
    code: "# ⚖️ 两个数比大小\n# 💡 三种情况分别用 if、elif、else 来对付～\n\na = 25\nb = 40\n\nif a > b:\n    print(f\"{a} 更大一些 🥇\")\nelif a < b:\n    print(f\"{b} 更大一些 🥇\")\nelse:\n    print(\"两个数一样大，打成平手 🤝\")"
  },
  {
    id: "lb_i06",
    title: "石头剪刀布擂台",
    emoji: "✊",
    category: "if",
    level: 2,
    desc: "和电脑玩一局石头剪刀布，看看谁赢",
    tip: "在输入框里写「石头」「剪刀」或「布」，多玩几局试试运气",
    code: "# ✊ 石头剪刀布小擂台\n# 💡 用 or 把三种赢的情况连起来，只要中一个就赢啦～\n\nimport random\n\nchoices = [\"石头\", \"剪刀\", \"布\"]\nme = input(\"你出什么？（石头/剪刀/布）\").strip()\n\nif me not in choices:\n    me = \"石头\"   # 没写对就默认出石头\n\ncpu = random.choice(choices)\nprint(f\"你出【{me}】，电脑出【{cpu}】\")\n\nif me == cpu:\n    print(\"平局！🤝\")\nelif (me == \"石头\" and cpu == \"剪刀\") or (me == \"剪刀\" and cpu == \"布\") or (me == \"布\" and cpu == \"石头\"):\n    print(\"你赢啦！🎉\")\nelse:\n    print(\"电脑赢了，再来一局！💪\")"
  },
  {
    id: "lb_i07",
    title: "两个条件都要满足",
    emoji: "🤝",
    category: "if",
    level: 2,
    desc: "and 就像两道门，两扇都开才能过去",
    tip: "把 height 改成 120，看看还能不能通过？",
    code: "# 🤝 and：两个条件都要满足\n# 💡 and 两边都为 True，整个条件才是 True～\n\nage = 12\nheight = 135\n\nif age >= 10 and height >= 130:\n    print(\"两个条件都满足，可以玩这个项目啦 🎢\")\nelse:\n    print(\"还差一点点，下次一定行 💪\")\n\nprint(\"and 就像两道门，两扇都打开才能过去 🚪\")"
  },
  {
    id: "lb_i08",
    title: "满足一个就行",
    emoji: "🚪",
    category: "if",
    level: 2,
    desc: "or 只要有一个条件成立，就算成立",
    tip: "把两个变量都改成 False，看看会走哪一条路？",
    code: "# 🚪 or：满足一个就可以\n# 💡 or 两边只要有一个 True，整个条件就是 True～\n\nis_weekend = True\nis_holiday = False\n\nif is_weekend or is_holiday:\n    print(\"今天是休息日，可以痛快玩啦 🎉\")\nelse:\n    print(\"今天是上学日，加油！📚\")\n\nprint(\"or 只要有一个成立，就算成立 ✨\")"
  },
  {
    id: "lb_i09",
    title: "把结果反过来",
    emoji: "🔄",
    category: "if",
    level: 2,
    desc: "not 会把 True 变成 False，像个反义词按钮",
    tip: "把 is_raining 改成 True，看看提示变成什么",
    code: "# 🔄 not：把结果反过来\n# 💡 not True 就是 False，not False 就是 True～\n\nis_raining = False\n\nif not is_raining:\n    print(\"没下雨，快出去玩吧 ⚽\")\nelse:\n    print(\"下雨啦，在家写代码吧 💻\")\n\nprint(\"not True 的结果是\", not True)\nprint(\"not False 的结果是\", not False)"
  },
  {
    id: "lb_i10",
    title: "水果在篮子里吗",
    emoji: "🧺",
    category: "if",
    level: 2,
    desc: "用 in 检查一样东西在不在列表里",
    tip: "把 fruit 换成「西瓜」再运行，看看答案变了没",
    code: "# 🧺 水果在篮子里吗？\n# 💡 in 用来问\"在不在里面\"，答案是 True 或 False～\n\nbasket = [\"苹果\", \"香蕉\", \"草莓\", \"葡萄\"]\nfruit = \"香蕉\"\n\nif fruit in basket:\n    print(f\"篮子里有{fruit} 🍌\")\nelse:\n    print(f\"篮子里没有{fruit}，下次买一点吧 🛒\")\n\nprint(\"篮子里的水果有：\" + \"、\".join(basket))"
  },
  {
    id: "lb_i11",
    title: "这一年是闰年吗",
    emoji: "📅",
    category: "if",
    level: 3,
    desc: "用 and 和 or 一起判断闰年，逻辑有点小挑战",
    tip: "改成 2000 或 1900 试试，看看闰年的规则对不对",
    code: "# 📅 这一年是闰年吗？\n# 💡 闰年的规则：能被 4 整除且不能被 100 整除，或者能被 400 整除～\n\nyear = 2024\n\nif (year % 4 == 0 and year % 100 != 0) or year % 400 == 0:\n    print(f\"{year} 年是闰年，2 月有 29 天 📅\")\nelse:\n    print(f\"{year} 年是平年，2 月有 28 天 📅\")"
  },
  {
    id: "lb_i12",
    title: "谁是跳远冠军",
    emoji: "🏅",
    category: "if",
    level: 2,
    desc: "三个小朋友比成绩，看看金牌归谁",
    tip: "把三个数字改成你自己的成绩，看看谁是冠军",
    code: "# 🏅 三个小朋友比谁跳得远\n# 💡 一个人要同时不输给另外两个，才是冠军～\n\nming = 1.85\nhong = 2.10\ngang = 1.98\n\nif ming >= hong and ming >= gang:\n    print(\"小明是冠军！🥇\")\nelif hong >= ming and hong >= gang:\n    print(\"小红是冠军！🥇\")\nelse:\n    print(\"小刚是冠军！🥇\")\n\nprint(f\"成绩：小明 {ming} 米，小红 {hong} 米，小刚 {gang} 米\")"
  },

  // ===== 🔁 循环转圈圈（12 个）=====
  {
    id: "lb_l01",
    title: "从 1 数到 10",
    emoji: "🔢",
    category: "loop",
    level: 1,
    desc: "for 配上 range，让电脑帮你数数",
    tip: "把 range(1, 11) 改成 range(1, 6)，就只数到 5 啦",
    code: "# 🔢 从 1 数到 10\n# 💡 range(1, 11) 表示从 1 开始，到 11 之前停下～\n\nfor i in range(1, 11):\n    print(f\"第 {i} 个数：{i} 🎈\")\n\nprint(\"数完啦，循环一共转了 10 圈！\")"
  },
  {
    id: "lb_l02",
    title: "九九乘法口诀表",
    emoji: "🧮",
    category: "loop",
    level: 2,
    desc: "两个循环套在一起，就变出一整张口诀表",
    tip: "把外面的 range(1, 10) 改成 range(1, 6)，只打印前五行",
    code: "# 🧮 九九乘法口诀表\n# 💡 外面的循环管第几行，里面的循环管这一行有几句～\n\nfor i in range(1, 10):\n    row = \"\"\n    for j in range(1, i + 1):\n        row += f\"{j}x{i}={i * j}  \"\n    print(row)\n\nprint(\"-\" * 30)\nprint(\"背熟它，你就是计算小达人 ✨\")"
  },
  {
    id: "lb_l03",
    title: "火箭发射倒计时",
    emoji: "🚀",
    category: "loop",
    level: 1,
    desc: "让循环倒着数，10、9、8……点火！",
    tip: "把 range(10, 0, -1) 改成 range(5, 0, -1)，倒数更快啦",
    code: "# 🚀 火箭发射倒计时\n# 💡 range(开始, 结束, -1) 里的 -1 表示每次减 1，就是倒数～\n\nfor i in range(10, 0, -1):\n    print(f\"倒计时：{i} ...\")\n\nprint(\"点火！🔥\")\nprint(\"🚀 火箭升空，冲向外太空！\")"
  },
  {
    id: "lb_l04",
    title: "书包里有什么",
    emoji: "🎒",
    category: "loop",
    level: 1,
    desc: "for 能把列表里的东西一个一个拿出来看",
    tip: "把书包里的东西换成你自己的，再数数有几样",
    code: "# 🎒 书包里有什么？\n# 💡 for 会挨个把列表里的东西拿出来，装进 thing 这个变量～\n\nbag = [\"语文书\", \"数学书\", \"铅笔盒\", \"水壶\", \"小零食\"]\n\nfor thing in bag:\n    print(f\"书包里有：{thing} 🎒\")\n\nprint(f\"一共装了 {len(bag)} 样东西，背上有点沉 😅\")"
  },
  {
    id: "lb_l05",
    title: "1 加到 100",
    emoji: "➕",
    category: "loop",
    level: 1,
    desc: "让电脑一个一个加，比手算快多啦",
    tip: "把 101 改成 51，算算 1 加到 50 是多少",
    code: "# ➕ 1 加到 100 等于多少？\n# 💡 用一个变量一直累加，循环转完答案就出来了～\n\ntotal = 0\nfor i in range(1, 101):\n    total = total + i\n\nprint(f\"1 + 2 + 3 + ... + 100 = {total}\")\nprint(\"答案是 5050，你算对了吗？🎉\")"
  },
  {
    id: "lb_l06",
    title: "找到就停下",
    emoji: "🛑",
    category: "loop",
    level: 2,
    desc: "break 能让循环提前收工，不用白跑好几圈",
    tip: "把 7 改成 9，看看最先找到的是哪个数字",
    code: "# 🛑 break：找到就马上停下\n# 💡 找到第一个能被 7 整除的数，就跳出循环不找了～\n\nfor i in range(1, 50):\n    if i % 7 == 0:\n        print(f\"找到啦！{i} 能被 7 整除 ✨\")\n        break\n    print(f\"{i} 不是，继续找...\")\n\nprint(\"循环结束，break 帮我们提前收工 🛑\")"
  },
  {
    id: "lb_l07",
    title: "跳过这一个",
    emoji: "⏭️",
    category: "loop",
    level: 2,
    desc: "continue 会跳过这一次，继续下一圈",
    tip: "把 i == 4 改成 i == 2，看看哪些小朋友被跳过了",
    code: "# ⏭️ continue：跳过这一个，继续下一个\n# 💡 遇到 4 就不打印了，直接开始下一圈循环～\n\nfor i in range(1, 8):\n    if i == 4:\n        print(\"哎呀，4 号被跳过去了 ⏭️\")\n        continue\n    print(f\"现在是 {i} 号小朋友 👦\")\n\nprint(\"循环结束啦！\")"
  },
  {
    id: "lb_l08",
    title: "猜数字大冒险",
    emoji: "🎲",
    category: "loop",
    level: 2,
    desc: "电脑想了一个数字，你有 3 次机会猜中它",
    tip: "在输入框里写一个 1 到 20 的数字，多试几次一定能中",
    code: "# 🎲 猜数字大冒险\n# 💡 while 循环会一直转，直到猜中或者机会用完～\n\nimport random\n\nsecret = random.randint(1, 20)\ntries = 3\n\nprint(\"🤖 我想好了一个 1~20 的数字，你有 3 次机会！\")\n\nwhile tries > 0:\n    text = input(\"请输入你猜的数字：\").strip()\n    guess = int(text) if text.isdigit() else 0\n    tries = tries - 1\n\n    if guess == secret:\n        print(f\"🎉 太棒了！答案就是 {secret}，你猜中啦！\")\n        break\n    elif guess < secret:\n        print(f\"📈 小了一点，还剩 {tries} 次机会\")\n    else:\n        print(f\"📉 大了一点，还剩 {tries} 次机会\")\n\nprint(f\"游戏结束，神秘数字是 {secret}，下次一定行！💪\")"
  },
  {
    id: "lb_l09",
    title: "一层层搭星星塔",
    emoji: "⭐",
    category: "loop",
    level: 1,
    desc: "空格越来越少，星星越来越多，塔就高了",
    tip: "把 range(1, 6) 改成 range(1, 9)，塔会更高哦",
    code: "# ⭐ 一层一层搭星星塔\n# 💡 空格控制位置，星星用乘法变多，塔就立起来啦～\n\nfor i in range(1, 6):\n    spaces = \" \" * (5 - i)\n    stars = \"⭐\" * (2 * i - 1)\n    print(spaces + stars)\n\nprint(\"星星塔搭好啦，好高呀！🗼\")"
  },
  {
    id: "lb_l10",
    title: "兔子家族的秘密",
    emoji: "🐰",
    category: "loop",
    level: 2,
    desc: "前两个数加起来就是下一个数，越加越多",
    tip: "把 range(10) 改成 range(15)，看看兔子涨到多少只",
    code: "# 🐰 兔子家族的秘密\n# 💡 数列是 0, 1, 1, 2, 3, 5, 8 ...，每个数是前两个数之和～\n\na = 0\nb = 1\nnumbers = []\n\nfor i in range(10):\n    numbers.append(a)\n    a, b = b, a + b\n\nprint(\"🐰 兔子家族的数量：\", numbers)\nprint(f\"第 10 个月有 {numbers[-1]} 只兔子！\")"
  },
  {
    id: "lb_l11",
    title: "循环画方块阵",
    emoji: "🟦",
    category: "loop",
    level: 2,
    desc: "两个循环一个管行、一个管列，就能铺满方块",
    tip: "把 4 行 6 列改成 6 行 4 列，看看变成什么形状",
    code: "# 🟦 用循环打印一个方块阵\n# 💡 外面的循环管有几行，里面的循环管一行有几个格子～\n\nfor row in range(4):\n    line = \"\"\n    for col in range(6):\n        line += \"🟦\"\n    print(line)\n\nprint(\"4 行 6 列，一共\", 4 * 6, \"个小方块 🧱\")"
  },
  {
    id: "lb_l12",
    title: "找出最高分",
    emoji: "🏆",
    category: "loop",
    level: 2,
    desc: "用循环一个个比过去，找出最大的那个数",
    tip: "把 best 先设成 0，看看结果会不会不一样？",
    code: "# 🏆 在一堆数字里找最大的\n# 💡 先假设第一个数最大，再拿后面的数一个个跟它比～\n\nscores = [78, 92, 65, 88, 99, 73]\nbest = scores[0]\n\nfor s in scores:\n    if s > best:\n        best = s\n\nprint(\"分数们：\", scores)\nprint(f\"最高分是 {best} 分 🏆\")\nprint(\"用循环也能找出最大值，厉害吧！\")"
  },

  // ===== ✨ 字符串魔法（12 个）=====
  {
    id: "lb_s01",
    title: "把文字接起来",
    emoji: "🧵",
    category: "string",
    level: 1,
    desc: "加号能把两段文字粘在一起，像搭积木",
    tip: "把「小」和「海豚」换成别的字，拼一个新词出来",
    code: "# 🧵 把文字接起来\n# 💡 用 + 就能把两段文字粘在一起，中间不会自动加空格哦～\n\nfirst = \"小\"\nsecond = \"海豚\"\n\nprint(first + second)\nprint(\"你好，\" + \"世界！\")\nprint(\"我最喜欢\" + \"编程\" + \"和\" + \"画画\" + \" 🎨\")"
  },
  {
    id: "lb_s02",
    title: "文字也能乘起来",
    emoji: "✨",
    category: "string",
    level: 1,
    desc: "文字乘以数字，就是重复很多遍",
    tip: "把 🎈 换成你喜欢的图案，再改改数字",
    code: "# ✨ 文字也能乘起来\n# 💡 文字 × 数字 = 把这段文字重复好几遍～\n\nprint(\"🎈\" * 10)\nprint(\"=\" * 20)\nprint(\"我很棒！\" * 3)\nprint(\"-\" * 5 + \"分割线\" + \"-\" * 5)"
  },
  {
    id: "lb_s03",
    title: "数一数有几个字",
    emoji: "📏",
    category: "string",
    level: 1,
    desc: "len() 能算出文字有多长",
    tip: "把自己的名字填进去，看看有几个字",
    code: "# 📏 数一数有几个字\n# 💡 len() 能数出字符个数，中文、英文字母都算一个～\n\nword = \"我爱学Python\"\nprint(word, \"一共有\", len(word), \"个字符\")\n\nname = \"小星星\"\nprint(f\"{name} 有 {len(name)} 个字\")\n\nprint(\"空字符串的长度是\", len(\"\"))"
  },
  {
    id: "lb_s04",
    title: "变大写变小写",
    emoji: "🔠",
    category: "string",
    level: 1,
    desc: "upper 全变大写，lower 全变小写",
    tip: "把 Hello Python 换成你自己的英文名试试",
    code: "# 🔠 变大写、变小写\n# 💡 upper() 全部变大写，lower() 全部变小写，title() 首字母大写～\n\nword = \"Hello Python\"\n\nprint(\"原来：\", word)\nprint(\"大写：\", word.upper())\nprint(\"小写：\", word.lower())\nprint(\"首字母大写：\", word.title())"
  },
  {
    id: "lb_s05",
    title: "扫掉多余的空格",
    emoji: "🧹",
    category: "string",
    level: 1,
    desc: "strip() 能把前后不小心敲的空格扫干净",
    tip: "把引号里的空格多敲几个，看看 strip 前后差多少",
    code: "# 🧹 去掉多余的空格\n# 💡 strip() 只打扫前后，中间的空格会保留～\n\nmessy = \"   Python 真好玩   \"\n\nprint(\"[\" + messy + \"]\")\nprint(\"[\" + messy.strip() + \"]\")\nprint(\"长度从\", len(messy), \"变成\", len(messy.strip()))"
  },
  {
    id: "lb_s06",
    title: "换掉句子里的词",
    emoji: "🔁",
    category: "string",
    level: 1,
    desc: "replace 能把句子里的词统统换掉",
    tip: "把「草莓」换成你最爱吃的水果，再运行一次",
    code: "# 🔁 换掉句子里的词\n# 💡 replace(旧词, 新词) 会把所有旧词都换成新词～\n\nsentence = \"我喜欢吃苹果，苹果很甜，苹果很脆\"\n\nnew_sentence = sentence.replace(\"苹果\", \"草莓\")\nprint(\"原句：\", sentence)\nprint(\"换后：\", new_sentence)\nprint(\"一共换掉了\", sentence.count(\"苹果\"), \"个词 🍓\")"
  },
  {
    id: "lb_s07",
    title: "找找看有没有",
    emoji: "🔍",
    category: "string",
    level: 1,
    desc: "in 问有没有，count 数有几个，find 找在哪里",
    tip: "把要找的词换成「鲨鱼」，看看结果变成什么",
    code: "# 🔍 找找看，有没有？\n# 💡 in 告诉你有没有，count 告诉你有几个，find 告诉你从第几个字开始～\n\ntext = \"小海豚在蓝色的大海里游泳\"\n\nprint(\"有「海豚」吗？\", \"海豚\" in text)\nprint(\"有「鲨鱼」吗？\", \"鲨鱼\" in text)\nprint(\"「的」出现了\", text.count(\"的\"), \"次\")\nprint(\"「大海」从第\", text.find(\"大海\"), \"个字开始\")"
  },
  {
    id: "lb_s08",
    title: "剪一段文字出来",
    emoji: "✂️",
    category: "string",
    level: 1,
    desc: "方括号里写两个数字，就能切出一段文字",
    tip: "试试 word[1:3]，看看切出来的是哪几个字母",
    code: "# ✂️ 把文字切一段出来\n# 💡 [开始:结束] 表示从第几个切到第几个之前，编号从 0 开始～\n\nword = \"ABCDEFG\"\n\nprint(\"全部：\", word)\nprint(\"前三个：\", word[0:3])\nprint(\"第 3 到第 5 个：\", word[2:5])\nprint(\"从第 4 个到最后：\", word[3:])\nprint(\"最后两个：\", word[-2:])"
  },
  {
    id: "lb_s09",
    title: "把文字倒过来念",
    emoji: "🔄",
    category: "string",
    level: 2,
    desc: "方括号里写 ::-1，文字就会倒过来",
    tip: "把自己的名字倒过来念，看看是什么效果",
    code: "# 🔄 把文字倒过来念\n# 💡 [::-1] 是 Python 里的倒放魔法，简单又好用～\n\nword = \"Python\"\nprint(\"原来的：\", word)\nprint(\"倒过来：\", word[::-1])\n\nname = \"小星星\"\nprint(f\"{name} 倒过来是 {name[::-1]} ✨\")\nprint(\"正着念反着念都一样的词，叫做回文哦\")"
  },
  {
    id: "lb_s10",
    title: "让数字排整齐",
    emoji: "💅",
    category: "string",
    level: 2,
    desc: "f-string 里的小尾巴，能控制小数位数和对齐",
    tip: "把 :.2f 改成 :.4f，看看小数位变多了没",
    code: "# 💅 让数字排得整整齐齐\n# 💡 :.2f 表示保留两位小数，:>6 表示靠右占 6 格～\n\npi = 3.1415926\nprint(f\"圆周率大约是 {pi:.2f}\")\nprint(f\"保留四位：{pi:.4f}\")\n\nfor i in range(1, 4):\n    print(f\"第 {i} 名：{i * 10:>4} 分\")\n\nprint(f\"价格：{9.9:>8.2f} 元 💰\")"
  },
  {
    id: "lb_s11",
    title: "我的名字艺术字",
    emoji: "✍️",
    category: "string",
    level: 1,
    desc: "输入名字，Python 帮你排成好看的艺术字",
    tip: "在输入框里写你的名字，看看它变成什么样子",
    code: "# ✍️ 我的名字艺术字\n# 💡 \" \".join(name) 会把名字里的每个字中间加一个空格～\n\nname = input(\"请输入你的名字：\").strip()\nif name == \"\":\n    name = \"小小程序员\"\n\nframe = \"✧\" * (len(name) * 2 + 2)\nprint(frame)\nprint(\"✧ \" + \" \".join(name) + \" ✧\")\nprint(frame)\n\nfor ch in name:\n    print(\"    \" + ch)\n\nprint(f\"你的名字一共 {len(name)} 个字，真好听 ✨\")"
  },
  {
    id: "lb_s12",
    title: "检查文字是什么类型",
    emoji: "🔎",
    category: "string",
    level: 2,
    desc: "isdigit 看是不是纯数字，isalpha 看是不是纯字母",
    tip: "试试 \"12ab\".isdigit()，看看答案是真是假",
    code: "# 🔎 检查文字是什么类型\n# 💡 isdigit() 判断是不是纯数字，isalpha() 判断是不是纯字母～\n\nprint(\"12345 是纯数字吗？\", \"12345\".isdigit())\nprint(\"abcde 是纯字母吗？\", \"abcde\".isalpha())\nprint(\"abc123 是纯数字吗？\", \"abc123\".isdigit())\n\ntext = \"2024\"\nif text.isdigit():\n    print(f\"{text} 是纯数字，加 1 就是 {int(text) + 1} 🎈\")\nelse:\n    print(\"这不是纯数字哦\")"
  },

  // ===== 📋 列表与字典（12 个）=====
  {
    id: "lb_ls01",
    title: "列表是个收纳盒",
    emoji: "📋",
    category: "list",
    level: 1,
    desc: "方括号里装东西，就是列表",
    tip: "把水果换成你喜欢的，再数数一共有几种",
    code: "# 📋 列表就像一个收纳盒\n# 💡 用方括号把东西装起来，中间用逗号隔开～\n\nfruits = [\"苹果\", \"香蕉\", \"草莓\", \"葡萄\"]\n\nprint(\"我的水果盒：\", fruits)\nprint(\"一共有\", len(fruits), \"种水果\")\nprint(\"第一个是：\", fruits[0])\nprint(\"最后一个是：\", fruits[-1])"
  },
  {
    id: "lb_ls02",
    title: "从 0 开始编号",
    emoji: "🔢",
    category: "list",
    level: 1,
    desc: "列表的第一个位置是 0，不是 1",
    tip: "试试 colors[5] 会怎样？数数看一共有几个颜色",
    code: "# 🔢 从 0 开始数数\n# 💡 列表第一个位置是 0，不是 1，千万别记错啦～\n\ncolors = [\"红\", \"橙\", \"黄\", \"绿\", \"蓝\"]\n\nprint(\"第 0 个：\", colors[0])\nprint(\"第 1 个：\", colors[1])\nprint(\"第 2 个：\", colors[2])\nprint(\"最后一个：\", colors[-1])\nprint(f\"一共 {len(colors)} 个颜色，编号从 0 到 {len(colors) - 1} 🎨\")"
  },
  {
    id: "lb_ls03",
    title: "往列表里加东西",
    emoji: "➕",
    category: "list",
    level: 1,
    desc: "append 会把新东西加到最后面",
    tip: "再 append 一件事，看看列表变成几件事",
    code: "# ➕ 往列表里加东西\n# 💡 append() 会把新东西加到最后面，列表变长了～\n\ntodo = [\"写作业\", \"练钢琴\"]\nprint(\"一开始：\", todo)\n\ntodo.append(\"读绘本\")\nprint(\"加了一件事：\", todo)\n\ntodo.append(\"散步\")\nprint(\"又加了一件事：\", todo)\nprint(f\"今天要做 {len(todo)} 件事，加油！💪\")"
  },
  {
    id: "lb_ls04",
    title: "列表的增删小工具",
    emoji: "🛠️",
    category: "list",
    level: 2,
    desc: "insert 插队，remove 删除，pop 拿走最后一个",
    tip: "把「小仓鼠」换成别的小动物，再试一次",
    code: "# 🛠️ 列表的增删小工具\n# 💡 insert 插到指定位置，remove 删掉指定的，pop 拿走最后一个～\n\npets = [\"小猫\", \"小狗\", \"小兔\"]\nprint(\"开始：\", pets)\n\npets.insert(1, \"小仓鼠\")\nprint(\"插入后：\", pets)\n\npets.remove(\"小狗\")\nprint(\"删掉小狗：\", pets)\n\nlast = pets.pop()\nprint(\"拿走最后一个：\", last)\nprint(\"剩下：\", pets)"
  },
  {
    id: "lb_ls05",
    title: "四个统计小助手",
    emoji: "📊",
    category: "list",
    level: 2,
    desc: "len 数个数，sum 求和，max 找最大，min 找最小",
    tip: "把 scores 里的数字改成你的成绩，再算一次平均分",
    code: "# 📊 列表的四个小助手\n# 💡 len 数个数，sum 求和，max 找最大，min 找最小～\n\nscores = [88, 76, 95, 60, 92]\n\nprint(\"成绩单：\", scores)\nprint(\"人数：\", len(scores))\nprint(\"总分：\", sum(scores))\nprint(\"最高分：\", max(scores))\nprint(\"最低分：\", min(scores))\nprint(\"平均分：\", round(sum(scores) / len(scores), 1))"
  },
  {
    id: "lb_ls06",
    title: "一个一个看过去",
    emoji: "🚶",
    category: "list",
    level: 1,
    desc: "for 配上列表，每样东西都能拿出来用一用",
    tip: "把动物换成你喜欢的，再看看一共认识了几种",
    code: "# 🚶 一个一个看过去\n# 💡 for 循环会把列表里的每一样东西都拿出来一次～\n\nanimals = [\"熊猫\", \"长颈鹿\", \"企鹅\", \"考拉\"]\n\nfor animal in animals:\n    print(f\"动物园里有 {animal} 🐾\")\n\nprint(f\"今天认识了 {len(animals)} 种动物，真开心！\")"
  },
  {
    id: "lb_ls07",
    title: "给列表排排队",
    emoji: "🔤",
    category: "list",
    level: 2,
    desc: "sort 直接改列表，sorted 给你一个排好的新列表",
    tip: "把 reverse=True 去掉，看看顺序有什么不同",
    code: "# 🔤 给列表排排队\n# 💡 sort() 会直接改原来的列表，sorted() 会给你一份新的排好序的～\n\nnumbers = [5, 2, 9, 1, 7]\nprint(\"原来：\", numbers)\n\nnumbers.sort()\nprint(\"从小到大：\", numbers)\n\nnumbers.sort(reverse=True)\nprint(\"从大到小：\", numbers)\n\nwords = [\"banana\", \"apple\", \"cherry\"]\nprint(\"字母顺序：\", sorted(words))"
  },
  {
    id: "lb_ls08",
    title: "列表也能剪一段",
    emoji: "✂️",
    category: "list",
    level: 2,
    desc: "方括号里写两个数字，就能切出一小段",
    tip: "试试 nums[2:5]，看看切出来的是哪几个数",
    code: "# ✂️ 列表也能切一段\n# 💡 [1:4] 表示从第 1 个拿到第 4 个之前，不包含第 4 个～\n\nnums = [10, 20, 30, 40, 50, 60]\n\nprint(\"全部：\", nums)\nprint(\"前三个：\", nums[:3])\nprint(\"中间三个：\", nums[1:4])\nprint(\"后两个：\", nums[-2:])\nprint(\"倒着排：\", nums[::-1])"
  },
  {
    id: "lb_ls09",
    title: "一行造出新列表",
    emoji: "⚡",
    category: "list",
    level: 3,
    desc: "列表推导式能把一整个列表快速变身",
    tip: "试试 [n + 100 for n in nums]，每个数都加 100",
    code: "# ⚡ 一行造出一个新列表\n# 💡 [表达式 for 变量 in 列表] 就是列表推导式，又快又酷～\n\nnums = [1, 2, 3, 4, 5]\n\ndoubles = [n * 2 for n in nums]\nprint(\"每个数乘 2：\", doubles)\n\nsquares = [n * n for n in nums]\nprint(\"每个数的平方：\", squares)\n\nevens = [n for n in nums if n % 2 == 0]\nprint(\"只留下偶数：\", evens)"
  },
  {
    id: "lb_ls10",
    title: "我的英汉小词典",
    emoji: "📖",
    category: "list",
    level: 1,
    desc: "字典用键查值，像查词典一样快",
    tip: "给词典再加一个单词，比如 \"cat\": \"小猫\"",
    code: "# 📖 我的英汉小词典\n# 💡 字典用「键: 值」存东西，用键就能马上查到值～\n\nwords = {\"apple\": \"苹果\", \"banana\": \"香蕉\", \"panda\": \"熊猫\"}\n\nprint(\"词典里有：\" + \"、\".join(words.keys()))\nprint(\"apple 的意思是：\", words[\"apple\"])\nprint(\"panda 的意思是：\", words[\"panda\"])\nprint(\"词典一共收了\", len(words), \"个单词 📚\")"
  },
  {
    id: "lb_ls11",
    title: "我的零食库存",
    emoji: "🍱",
    category: "list",
    level: 2,
    desc: "用字典记录每样零食还有几个",
    tip: "把零食数量和名字改成你自己的库存，再加一样新的",
    code: "# 🍱 用字典记录我的零食库存\n# 💡 用 [] 就能加新条目，或者改掉旧的数字～\n\nsnacks = {\"饼干\": 3, \"巧克力\": 5, \"果冻\": 2}\nprint(\"开始：\", snacks)\n\nsnacks[\"饼干\"] = 4        # 修改原来的\nsnacks[\"棒棒糖\"] = 6      # 加一样新的\nprint(\"更新后：\", snacks)\n\nfor name in snacks:\n    print(f\"{name} 还有 {snacks[name]} 个 🍬\")\n\nprint(f\"一共 {sum(snacks.values())} 个零食！\")"
  },
  {
    id: "lb_ls12",
    title: "小小成绩单",
    emoji: "🎓",
    category: "list",
    level: 3,
    desc: "列表里装字典，一个同学一条记录",
    tip: "再加一位同学的记录，看看最高分会变成谁",
    code: "# 🎓 小小成绩单\n# 💡 列表里可以装字典，一个同学一条记录，清清楚楚～\n\nstudents = [\n    {\"name\": \"小明\", \"score\": 92},\n    {\"name\": \"小红\", \"score\": 98},\n    {\"name\": \"小刚\", \"score\": 85}\n]\n\nfor s in students:\n    print(f\"{s['name']} 考了 {s['score']} 分 📝\")\n\nbest_name = \"\"\nbest_score = 0\nfor s in students:\n    if s[\"score\"] > best_score:\n        best_score = s[\"score\"]\n        best_name = s[\"name\"]\n\nprint(f\"最高分是 {best_name}，{best_score} 分 🏆\")"
  },

  // ===== 🧩 函数积木（12 个）=====
  {
    id: "lb_f01",
    title: "我的第一个函数",
    emoji: "🧩",
    category: "func",
    level: 2,
    desc: "def 就是打包一块积木，写好以后能反复用",
    tip: "在最后再加一行 say_hello()，看看会不会又说一遍",
    code: "# 🧩 我的第一个函数\n# 💡 def 就是\"做一块积木\"，写好以后叫它名字就能用～\n\ndef say_hello():\n    print(\"你好呀！👋\")\n    print(\"欢迎来到 Python 世界 🌍\")\n\nsay_hello()\nsay_hello()\nprint(\"叫了两次，就说了两遍 ✨\")"
  },
  {
    id: "lb_f02",
    title: "给函数送个参数",
    emoji: "🎁",
    category: "func",
    level: 2,
    desc: "括号里的小口袋，每次可以装不同的东西",
    tip: "加上 greet(\"小熊猫\")，看它会不会跟你打招呼",
    code: "# 🎁 给函数送一个参数\n# 💡 括号里的 name 就是函数的\"小口袋\"，每次可以装不同的东西～\n\ndef greet(name):\n    print(f\"你好，{name}！很高兴认识你 😊\")\n\ngreet(\"小明\")\ngreet(\"小红\")\ngreet(\"小熊猫\")"
  },
  {
    id: "lb_f03",
    title: "函数还会送回礼",
    emoji: "🎀",
    category: "func",
    level: 2,
    desc: "return 把结果送回来，谁调用谁就收到",
    tip: "改成 add(100, 200)，看看结果变成多少",
    code: "# 🎀 函数还会把结果送回来\n# 💡 return 就是函数的\"回礼\"，谁调用它，谁就收到结果～\n\ndef add(a, b):\n    return a + b\n\nresult = add(3, 5)\nprint(\"3 + 5 =\", result)\nprint(\"10 + 20 =\", add(10, 20))\nprint(\"函数算得又快又准 ✨\")"
  },
  {
    id: "lb_f04",
    title: "冰淇淋的默认口味",
    emoji: "🍦",
    category: "func",
    level: 3,
    desc: "参数可以带默认值，不写就用默认的",
    tip: "make_ice_cream(\"芒果\") 会做出什么口味？试试看",
    code: "# 🍦 参数也可以有默认值\n# 💡 调用时不写参数就用默认值，写了就用你给的～\n\ndef make_ice_cream(flavor=\"香草\", size=\"中杯\"):\n    print(f\"做一份{size}{flavor}冰淇淋 🍦\")\n\nmake_ice_cream()\nmake_ice_cream(\"巧克力\")\nmake_ice_cream(\"草莓\", \"大杯\")"
  },
  {
    id: "lb_f05",
    title: "一次送回两个结果",
    emoji: "📦",
    category: "func",
    level: 3,
    desc: "return 后面写两个值，会打包一起送回来",
    tip: "把 calc(4, 5) 改成 calc(8, 9)，看看两个结果怎么变",
    code: "# 📦 一个函数送回两个结果\n# 💡 return 后面写两个值，就会打包成一对一起送回来～\n\ndef calc(a, b):\n    return a + b, a * b\n\ns, p = calc(4, 5)\nprint(\"4 + 5 =\", s)\nprint(\"4 × 5 =\", p)\n\nprint(\"也可以直接打印出来：\", calc(6, 7))"
  },
  {
    id: "lb_f06",
    title: "函数之间互相帮忙",
    emoji: "🔗",
    category: "func",
    level: 3,
    desc: "大函数叫小函数帮忙，像搭积木一层层搭起来",
    tip: "再加一句 show_bill(10)，看看账单变成多少元",
    code: "# 🔗 函数之间可以互相帮忙\n# 💡 大函数调用小函数，就像搭积木一样一层层搭起来～\n\ndef get_price(count):\n    return count * 3\n\ndef show_bill(count):\n    price = get_price(count)\n    print(f\"买 {count} 支铅笔，一共 {price} 元 ✏️\")\n    return price\n\ntotal = show_bill(4)\nshow_bill(6)\nprint(f\"两次一共花了 {total + get_price(6)} 元 💰\")"
  },
  {
    id: "lb_f07",
    title: "自己叫自己的函数",
    emoji: "🔁",
    category: "func",
    level: 3,
    desc: "递归就是函数自己叫自己，一次比一次小",
    tip: "把 countdown(5) 改成 countdown(3)，倒数会变短",
    code: "# 🔁 函数自己叫自己（递归）\n# 💡 递归就是\"自己做不完，就叫一个更小的自己来做\"～\n\ndef countdown(n):\n    if n <= 0:\n        print(\"点火！🚀\")\n        return\n    print(f\"倒计时 {n} ...\")\n    countdown(n - 1)\n\ncountdown(5)\nprint(\"递归结束，火箭上天啦！\")"
  },
  {
    id: "lb_f08",
    title: "用递归算阶乘",
    emoji: "✖️",
    category: "func",
    level: 3,
    desc: "5 的阶乘就是 5 乘 4 乘 3 乘 2 乘 1",
    tip: "试试 factorial(10)，看看数字涨到多大",
    code: "# ✖️ 用递归算阶乘\n# 💡 5 的阶乘 = 5 × 4 × 3 × 2 × 1，递归写起来刚刚好～\n\ndef factorial(n):\n    if n <= 1:\n        return 1\n    return n * factorial(n - 1)\n\nprint(\"3! =\", factorial(3))\nprint(\"5! =\", factorial(5))\nprint(\"7! =\", factorial(7))"
  },
  {
    id: "lb_f09",
    title: "递归算兔子数列",
    emoji: "🐇",
    category: "func",
    level: 3,
    desc: "第 n 个数等于前两个数相加，和数学公式几乎一样",
    tip: "把 range(10) 改成 range(12)，多看几只兔子",
    code: "# 🐇 递归算兔子数列\n# 💡 第 n 个数 = 前两个数相加，写起来和数学公式几乎一样～\n\ndef fib(n):\n    if n <= 1:\n        return n\n    return fib(n - 1) + fib(n - 2)\n\nfor i in range(10):\n    print(f\"第 {i} 个月：{fib(i)} 只兔子 🐰\")"
  },
  {
    id: "lb_f10",
    title: "问答小助手",
    emoji: "🤖",
    category: "func",
    level: 2,
    desc: "用函数做一个小助手，还能给你打分",
    tip: "在输入框里回答问题，答错了也没关系，记住就好",
    code: "# 🤖 我的问答小助手\n# 💡 函数里也可以写 input，把问题和答案一起打包～\n\ndef ask(question, answer):\n    reply = input(question).strip()\n    if reply == answer:\n        print(\"✅ 答对啦，好厉害！\")\n        return 1\n    print(f\"😊 正确答案是「{answer}」，记住它啦！\")\n    return 0\n\nscore = 0\nscore += ask(\"1 + 1 等于几？\", \"2\")\nscore += ask(\"天空是什么颜色？\", \"蓝色\")\n\nprint(f\"你一共答对 {score} 题，很棒哦！🎉\")"
  },
  {
    id: "lb_f11",
    title: "厘米和米换算",
    emoji: "📏",
    category: "func",
    level: 2,
    desc: "把重复的计算写进函数，以后随时叫它帮忙",
    tip: "加上 print(cm_to_m(180))，算算爸爸的身高是多少米",
    code: "# 📏 写一个换算小函数\n# 💡 把常用的计算写进函数，以后随时叫它帮忙～\n\ndef cm_to_m(cm):\n    return cm / 100\n\ndef m_to_cm(m):\n    return m * 100\n\nprint(\"150 厘米 =\", cm_to_m(150), \"米\")\nprint(\"2.5 米 =\", m_to_cm(2.5), \"厘米\")\nprint(f\"我的身高是 {cm_to_m(135)} 米 📏\")"
  },
  {
    id: "lb_f12",
    title: "重复的活儿交给函数",
    emoji: "🎨",
    category: "func",
    level: 2,
    desc: "写一次，用很多次，这就是函数最厉害的地方",
    tip: "把 show_line(\"*\", 10) 加在最后，画一条短一点的线",
    code: "# 🎨 把重复的活儿交给函数\n# 💡 分隔线要画好几次，写成一个函数就省事多啦～\n\ndef show_line(char=\"-\", count=20):\n    print(char * count)\n\nshow_line()\nprint(\"📚 我的读书清单\")\nshow_line(\"=\", 20)\nprint(\"1. 小王子\")\nprint(\"2. 夏洛的网\")\nshow_line(\"=\", 20)\nprint(\"读完记得打勾哦 ✅\")"
  },

  // ===== 🔢 数学与随机（12 个）=====
  {
    id: "lb_m01",
    title: "开平方真好玩",
    emoji: "√",
    category: "math",
    level: 2,
    desc: "math.sqrt 能算平方根，81 的平方根就是 9",
    tip: "试试 math.sqrt(144)，看看答案是多少",
    code: "# √ 开平方真好玩\n# 💡 math.sqrt() 能算平方根，用之前要先 import math～\n\nimport math\n\nprint(\"9 的平方根：\", math.sqrt(9))\nprint(\"81 的平方根：\", math.sqrt(81))\nprint(\"2 的平方根：\", round(math.sqrt(2), 4))\n\nside = 12\nprint(f\"边长 {side} 的正方形，对角线长约 {round(math.sqrt(2) * side, 2)} 📐\")"
  },
  {
    id: "lb_m02",
    title: "圆周率 pi",
    emoji: "🥧",
    category: "math",
    level: 2,
    desc: "math.pi 就是 3.1415926…，算圆都要用它",
    tip: "把半径 r 改成 10，看看周长和面积变成多少",
    code: "# 🥧 math 里的圆周率\n# 💡 math.pi 就是 3.1415926...，算圆的东西都要请它出场～\n\nimport math\n\nprint(\"圆周率 pi =\", math.pi)\n\nr = 3\nprint(f\"半径 {r} 的圆：\")\nprint(f\"周长 = {round(2 * math.pi * r, 2)}\")\nprint(f\"面积 = {round(math.pi * r * r, 2)} ⭕\")"
  },
  {
    id: "lb_m03",
    title: "去掉负号和几次方",
    emoji: "💪",
    category: "math",
    level: 1,
    desc: "abs 去掉负号，pow 算几次方",
    tip: "算算 pow(5, 3) 是多少，再和 5 ** 3 比一比",
    code: "# 💪 abs 和 pow 两个小工具\n# 💡 abs 把负号去掉变成正的，pow(a, b) 就是 a 的 b 次方～\n\nprint(\"abs(-9) =\", abs(-9))\nprint(\"abs(3 - 12) =\", abs(3 - 12))\nprint(\"pow(2, 5) =\", pow(2, 5))\nprint(\"pow(3, 3) =\", pow(3, 3))\nprint(\"今天和昨天温度差了\", abs(-3 - 8), \"度 🌡️\")"
  },
  {
    id: "lb_m04",
    title: "向上取整和向下取整",
    emoji: "⬆️",
    category: "math",
    level: 2,
    desc: "ceil 往大里取，floor 往小里取",
    tip: "把 people 改成 20，看看需要几辆车",
    code: "# ⬆️ 向上取整和向下取整\n# 💡 ceil 往大里取，floor 往小里取，都是 math 模块的好帮手～\n\nimport math\n\nprint(\"math.ceil(4.1) =\", math.ceil(4.1))\nprint(\"math.floor(4.9) =\", math.floor(4.9))\nprint(\"round(4.5) =\", round(4.5))\n\npeople = 17\ncars = math.ceil(people / 5)\nprint(f\"{people} 个人坐车，每车坐 5 人，需要 {cars} 辆车 🚗\")"
  },
  {
    id: "lb_m05",
    title: "阶乘一次算好",
    emoji: "🎯",
    category: "math",
    level: 2,
    desc: "math.factorial 帮你从那个数一路乘到 1",
    tip: "算算 math.factorial(6)，再想想生活中哪里用得到",
    code: "# 🎯 math.factorial 算阶乘\n# 💡 阶乘就是从这个数一路乘到 1，math 已经帮你算好啦～\n\nimport math\n\nprint(\"3! =\", math.factorial(3))\nprint(\"5! =\", math.factorial(5))\nprint(\"10! =\", math.factorial(10))\nprint(\"排队的先后顺序，就是这样算出来的 🚶\")"
  },
  {
    id: "lb_m06",
    title: "最大公约数",
    emoji: "🤝",
    category: "math",
    level: 3,
    desc: "math.gcd 找出两个数最大的共同因数",
    tip: "换成 18 和 24 试试，看看能不能约分",
    code: "# 🤝 最大公约数\n# 💡 math.gcd 能找出两个数最大的共同因数，约分就靠它～\n\nimport math\n\na = 24\nb = 36\ng = math.gcd(a, b)\n\nprint(f\"{a} 和 {b} 的最大公约数是 {g}\")\nprint(f\"约分：{a}/{b} = {a // g}/{b // g} ✂️\")\nprint(f\"分子分母同时除以 {g}，就约好啦！\")"
  },
  {
    id: "lb_m07",
    title: "扔骰子的小随机",
    emoji: "🎲",
    category: "math",
    level: 1,
    desc: "random.randint 每次给你的数字都不一样",
    tip: "把 randint(1, 6) 改成 randint(1, 100)，就变成抽大奖啦",
    code: "# 🎲 随机数来啦\n# 💡 random.randint(1, 6) 就像扔骰子，每次结果都不一样～\n\nimport random\n\nprint(\"扔 5 次骰子：\")\nfor i in range(5):\n    print(\"🎲\", random.randint(1, 6))\n\nprint(\"随机抽一个幸运数字：\", random.randint(1, 100))"
  },
  {
    id: "lb_m08",
    title: "今天吃什么",
    emoji: "🍱",
    category: "math",
    level: 1,
    desc: "random.choice 能从列表里随机挑一个",
    tip: "把菜单换成你爱吃的菜，让电脑帮你决定",
    code: "# 🍱 今天吃什么？交给随机吧\n# 💡 random.choice 能从列表里随机挑一个出来～\n\nimport random\n\nfoods = [\"炒饭\", \"面条\", \"饺子\", \"汉堡\", \"沙拉\"]\n\nprint(\"候选菜单：\" + \"、\".join(foods))\nfor i in range(3):\n    print(f\"第 {i + 1} 天吃：{random.choice(foods)} 🍽️\")\n\nprint(\"再随机挑一个水果：\", random.choice([\"苹果\", \"香蕉\", \"草莓\"]) + \" 🍎\")"
  },
  {
    id: "lb_m09",
    title: "把顺序打乱",
    emoji: "🔀",
    category: "math",
    level: 2,
    desc: "random.shuffle 会把列表的顺序洗一洗",
    tip: "多运行几次，看看每次的抽签顺序是不是都不一样",
    code: "# 🔀 把顺序打乱\n# 💡 random.shuffle 会把列表里的顺序随机洗牌～\n\nimport random\n\ncards = [\"A\", \"2\", \"3\", \"4\", \"5\"]\nprint(\"洗牌前：\", cards)\n\nrandom.shuffle(cards)\nprint(\"洗牌后：\", cards)\n\nnumbers = [1, 2, 3, 4, 5, 6]\nrandom.shuffle(numbers)\nprint(\"抽签顺序：\", numbers)"
  },
  {
    id: "lb_m10",
    title: "让小数变整齐",
    emoji: "💰",
    category: "math",
    level: 2,
    desc: "round 和 f-string 都能把小数收拾得漂漂亮亮",
    tip: "把 :.2f 改成 :.1f，看看小数位变成几位",
    code: "# 💰 让小数变整齐\n# 💡 round 能四舍五入，f-string 里的 :.2f 能固定保留两位小数～\n\nprice = 19.9876\nprint(\"原价：\", price)\nprint(\"四舍五入两位：\", round(price, 2))\nprint(f\"价格标签：{price:.2f} 元 💰\")\n\ntotal = 100 / 3\nprint(f\"100 元分 3 份，每份 {total:.2f} 元\")\nprint(f\"百分数写法：{0.856:.1%} 📊\")"
  },
  {
    id: "lb_m11",
    title: "数字的另一种写法",
    emoji: "🔟",
    category: "math",
    level: 2,
    desc: "bin 是二进制，oct 是八进制，hex 是十六进制",
    tip: "试试 hex(255) 和 bin(255)，看看电脑眼里的 255",
    code: "# 🔟 数字的不同写法\n# 💡 bin 二进制、oct 八进制、hex 十六进制，都是给电脑看的写法～\n\nn = 10\nprint(f\"{n} 的二进制是 {bin(n)}\")\nprint(f\"{n} 的八进制是 {oct(n)}\")\nprint(f\"{n} 的十六进制是 {hex(n)}\")\n\nprint(\"255 的十六进制是\", hex(255))\nprint(\"电脑只认识 0 和 1 哦 💻\")"
  },
  {
    id: "lb_m12",
    title: "找一找完全平方数",
    emoji: "🌸",
    category: "math",
    level: 3,
    desc: "一个数等于某个整数的平方，它就是完全平方数",
    tip: "把 range(1, 101) 改成 range(1, 51)，只看前 50 个",
    code: "# 🌸 找一找完全平方数\n# 💡 一个数如果等于某个整数的平方，它就是完全平方数～\n\nimport math\n\ncount = 0\nfor n in range(1, 101):\n    root = int(math.sqrt(n))\n    if root * root == n:\n        print(f\"{n} 是完全平方数（{root} × {root}）✨\")\n        count += 1\n\nprint(f\"1 到 100 里一共有 {count} 个完全平方数 🌸\")"
  },

  // ===== 🐢 海龟画图（12 个）=====
  {
    id: "lb_tu01",
    title: "小海龟画正方形",
    emoji: "🟦",
    category: "turtle",
    level: 1,
    desc: "走一走、转一转，重复四次就是正方形",
    tip: "把 forward(120) 改成 forward(200)，正方形会变大",
    code: "# 🟦 小海龟画正方形\n# 💡 走 120 步转 90 度，重复 4 次就回到起点啦～\n\nimport turtle\n\nt = turtle.Turtle()\nt.pensize(4)\nt.color(\"#3B82F6\")\nt.speed(5)\n\nprint(\"小海龟出发啦 🐢\")\n\nfor i in range(4):\n    t.forward(120)\n    t.right(90)\n\nprint(\"正方形画好啦，边长 120 步 ✨\")"
  },
  {
    id: "lb_tu02",
    title: "小海龟画三角形",
    emoji: "🔺",
    category: "turtle",
    level: 1,
    desc: "三角形的外角是 120 度，转三次就回家",
    tip: "把 3 改成 5、120 改成 72，就变成五边形啦",
    code: "# 🔺 小海龟画三角形\n# 💡 海龟转的是外角，三角形每次要转 120 度～\n\nimport turtle\n\nt = turtle.Turtle()\nt.pensize(4)\nt.color(\"#F97316\")\nt.speed(5)\n\nfor i in range(3):\n    t.forward(150)\n    t.right(120)\n\nprint(\"三角形画好啦，像一顶小帐篷 ⛺\")"
  },
  {
    id: "lb_tu03",
    title: "闪闪的五角星",
    emoji: "⭐",
    category: "turtle",
    level: 2,
    desc: "每次转 144 度，转五次就画出一颗五角星",
    tip: "把 144 改成 145，看看星星会不会变形？",
    code: "# ⭐ 画一颗五角星\n# 💡 画五角星的秘诀：每次转 144 度，转 5 次就成啦～\n\nimport turtle\n\nt = turtle.Turtle()\nt.pensize(3)\nt.color(\"#FACC15\")\nt.speed(6)\nt.begin_fill()\n\nfor i in range(5):\n    t.forward(160)\n    t.right(144)\n\nt.end_fill()\nprint(\"闪闪的五角星画好啦！⭐\")"
  },
  {
    id: "lb_tu04",
    title: "彩虹螺旋",
    emoji: "🌈",
    category: "turtle",
    level: 2,
    desc: "每画一条线就转 59 度，线条越来越长就旋起来了",
    tip: "把 59 改成 91，会看到完全不一样的图案",
    code: "# 🌈 彩虹螺旋\n# 💡 每次转一点点角度，线条越来越长，就旋起来啦～\n\nimport turtle\n\nt = turtle.Turtle()\nt.speed(0)\nt.pensize(3)\n\ncolors = [\"#EF4444\", \"#F97316\", \"#FACC15\", \"#22C55E\", \"#3B82F6\", \"#8B5CF6\"]\n\nfor i in range(120):\n    t.pencolor(colors[i % len(colors)])\n    t.forward(i * 2)\n    t.right(59)\n\nprint(\"🌈 彩虹螺旋完成！换个角度会有新惊喜～\")"
  },
  {
    id: "lb_tu05",
    title: "彩虹风车",
    emoji: "🎡",
    category: "turtle",
    level: 2,
    desc: "画一条线转 75 度，颜色轮着用，风车就出现了",
    tip: "把 right(75) 改成 right(90)，风车会变成四个大扇叶",
    code: "# 🎡 彩虹风车转呀转\n# 💡 每次画一条线再转 75 度，颜色轮着来，风车就出现啦～\n\nimport turtle\n\nt = turtle.Turtle()\nt.pensize(3)\nt.speed(8)\n\ncolors = [\"#EF4444\", \"#F97316\", \"#FBBF24\", \"#10B981\", \"#06B6D4\", \"#6366F1\"]\n\nfor i in range(24):\n    t.color(colors[i % len(colors)])\n    t.forward(i * 6 + 20)\n    t.right(75)\n\nprint(\"风车做好啦，好像真的在转 🎡\")"
  },
  {
    id: "lb_tu06",
    title: "画一座小房子",
    emoji: "🏠",
    category: "turtle",
    level: 2,
    desc: "先画墙，再画屋顶，一座小房子就出现了",
    tip: "把 goto(75, 75) 改成 goto(75, 120)，屋顶会变高",
    code: "# 🏠 画一座小房子\n# 💡 先画墙（正方形），再用 goto 画屋顶（三角形）～\n\nimport turtle\n\nt = turtle.Turtle()\nt.pensize(3)\nt.speed(5)\n\n# 画墙：一个正方形\nt.color(\"#8B5CF6\")\nfor i in range(4):\n    t.forward(150)\n    t.right(90)\n\n# 画屋顶：一个三角形\nt.penup()\nt.goto(0, 0)\nt.pendown()\nt.color(\"#EF4444\")\nt.goto(75, 75)\nt.goto(150, 0)\n\nprint(\"🏠 小房子画好啦，红屋顶配紫墙壁～\")"
  },
  {
    id: "lb_tu07",
    title: "画一个笑脸",
    emoji: "😊",
    category: "turtle",
    level: 3,
    desc: "大圆是脸，小圆是眼睛，弧线是微笑",
    tip: "把 circle(100) 改成 circle(80)，脸会变小一点",
    code: "# 😊 画一个笑脸：圆脸 + 两只眼睛 + 微笑的嘴巴\n# 💡 大圆当脸，小圆当眼睛，再用弧线画出微笑～\n\nimport turtle\n\nt = turtle.Turtle()\nt.speed(5)\nt.begin_fill()\nt.color(\"#FACC15\")\nt.circle(100)          # 脸：一个大圆\nt.end_fill()\n\nt.color(\"black\")       # 眼睛：左右各一个小圆\nfor x in (-35, 35):\n    t.penup()\n    t.goto(x, 110)\n    t.pendown()\n    t.circle(12)\n\nt.penup()              # 嘴巴：一段弯弯的弧线\nt.goto(-45, 60)\nt.pendown()\nt.setheading(-60)\nt.circle(55, 120)\nprint(\"😊 笑脸画好啦，今天也要开开心心！\")"
  },
  {
    id: "lb_tu08",
    title: "光芒四射的太阳",
    emoji: "☀️",
    category: "turtle",
    level: 3,
    desc: "一个圆加一圈小三角，太阳就亮起来了",
    tip: "把 range(12) 改成 range(8)，光芒会变少变粗",
    code: "# ☀️ 画一个光芒四射的太阳\n# 💡 中间一个圆，外面一圈小三角形，就是太阳的光芒～\n\nimport turtle\n\nt = turtle.Turtle()\nt.speed(0)\nt.pensize(2)\nt.color(\"#F59E0B\")      # 圆圆的脸\nt.begin_fill()\nt.circle(60)\nt.end_fill()\n\nt.color(\"#FBBF24\")      # 一圈光芒\nfor i in range(12):\n    t.penup()\n    t.goto(0, 0)\n    t.setheading(i * 30)\n    t.forward(75)\n    t.pendown()\n    for k in range(3):\n        t.forward(30)\n        t.right(120)\nprint(\"☀️ 太阳画好啦，暖洋洋的！\")"
  },
  {
    id: "lb_tu09",
    title: "六角小雪花",
    emoji: "❄️",
    category: "turtle",
    level: 3,
    desc: "每根树枝画完就转 60 度，转六次就是雪花",
    tip: "把 forward(100) 改成 forward(140)，雪花会更大",
    code: "# ❄️ 画一片雪花\n# 💡 每画一根树枝就转 60 度，转 6 次就是一片六角雪花～\n\nimport turtle\n\nt = turtle.Turtle()\nt.speed(0)\nt.pensize(2)\nt.color(\"#38BDF8\")\n\nfor i in range(6):\n    t.forward(100)\n    # 左右两根小树枝\n    t.right(60)\n    t.forward(40)\n    t.backward(40)\n    t.left(120)\n    t.forward(40)\n    t.backward(40)\n    t.right(60)\n    # 回到中心，准备下一根\n    t.backward(100)\n    t.right(60)\n\nprint(\"❄️ 雪花画好啦，六角形真漂亮！\")"
  },
  {
    id: "lb_tu10",
    title: "圆圈开出一朵花",
    emoji: "🌸",
    category: "turtle",
    level: 2,
    desc: "每画一个圆就转一点点，花瓣就围成一圈",
    tip: "把 right(15) 改成 right(30)，花瓣会变少",
    code: "# 🌸 用圆圈画一朵花\n# 💡 每画一个圆就转 15 度，转 24 次就开出一朵花～\n\nimport turtle\n\nt = turtle.Turtle()\nt.speed(0)\nt.pensize(2)\n\ncolors = [\"#F472B6\", \"#FB7185\", \"#FBBF24\", \"#A78BFA\"]\n\nfor i in range(24):\n    t.pencolor(colors[i % len(colors)])\n    t.circle(80)\n    t.right(15)\n\nprint(\"🌸 花朵画好啦，五颜六色的真好看！\")"
  },
  {
    id: "lb_tu11",
    title: "夜空里的彩色星星",
    emoji: "🌌",
    category: "turtle",
    level: 3,
    desc: "随机的位置、大小和颜色，撒出一片星空",
    tip: "把 range(30) 改成 range(60)，星星会更多",
    code: "# 🌌 夜空里的彩色星星\n# 💡 让随机数决定位置、大小和颜色，每颗星星都不一样～\n\nimport turtle\nimport random\n\nt = turtle.Turtle()\nt.speed(0)\nt.hideturtle()\nturtle.bgcolor(\"#0B1026\")\ncolors = [\"#FDE68A\", \"#FCA5A5\", \"#93C5FD\", \"#C4B5FD\", \"#FFFFFF\"]\n\nfor i in range(30):\n    x = random.randint(-220, 220)\n    y = random.randint(-220, 220)\n    t.penup()\n    t.goto(x, y)\n    t.pendown()\n    t.color(random.choice(colors))\n    size = random.randint(5, 15)\n    for k in range(5):\n        t.forward(size)\n        t.right(144)\n\nprint(\"🌌 星空画好啦，一共撒了 30 颗星星，快许个愿吧！\")"
  },
  {
    id: "lb_tu12",
    title: "彩色小楼梯",
    emoji: "🪜",
    category: "turtle",
    level: 2,
    desc: "走一步再往上走一步，一级一级爬上台阶",
    tip: "把 range(5) 改成 range(10)，楼梯会变长",
    code: "# 🪜 画一段彩色楼梯\n# 💡 往前走一步，转弯往上走一步，一级台阶就画好了～\n\nimport turtle\n\nt = turtle.Turtle()\nt.speed(0)\nt.pensize(4)\n\ncolors = [\"#EF4444\", \"#F97316\", \"#FACC15\", \"#22C55E\", \"#3B82F6\"]\n\nfor i in range(5):\n    t.pencolor(colors[i % len(colors)])\n    t.forward(60)     # 往前走\n    t.left(90)\n    t.forward(60)     # 往上走\n    t.right(90)\n\nprint(\"🪜 楼梯画好啦，一步一步往上爬！\")"
  }
];
