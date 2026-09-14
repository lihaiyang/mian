// 句子岛数据 —— window.EN_SENTENCES
// 字段严格遵循 en/CONTRACT.md 第 1.3 节；本文件是纯数据，不含逻辑。
// 共 100 个高频句型，由易到难：问候 → 介绍 → 我有/我喜欢/我会 → 请求 → 提问 → 位置 →
// 数量 → 颜色天气时间 → 祈使句 → There is/are → 我想要 → 你喜欢吗 → 什么颜色 →
// Let's → May I → 礼貌用语与感受。
// pattern 里的 ___ 是替换位；say 是完整示范音（不含占位符）；
// blanks 是能自然替换进 pattern 的词；reply.a 是回答示范，同样保留 ___。

window.EN_SENTENCES = [
  // ---- 问候与自我介绍（8 个） ----
  {
    id: "s_hi",
    pattern: "Hi, I am ___.",
    zh: "嗨，我是___。",
    emoji: "👋",
    grade: 1,
    say: "Hi, I am Lily.",
    blanks: [
      { word: "Lily", emoji: "👧", zh: "莉莉" },
      { word: "Tom", emoji: "👦", zh: "汤姆" },
      { word: "Ben", emoji: "🧒", zh: "本" }
    ],
    reply: { q: "What is your name?", a: "Hi, I am ___.", qzh: "你叫什么名字？" }
  },
  {
    id: "s_myname",
    pattern: "My name is ___.",
    zh: "我的名字是___。",
    emoji: "📛",
    grade: 1,
    say: "My name is Anna.",
    blanks: [
      { word: "Anna", emoji: "👧", zh: "安娜" },
      { word: "Mike", emoji: "👦", zh: "迈克" },
      { word: "Coco", emoji: "🐶", zh: "可可" }
    ],
    reply: { q: "What is your name?", a: "My name is ___.", qzh: "你叫什么名字？" }
  },
  {
    id: "s_nicetomeet",
    pattern: "Nice to meet you, ___.",
    zh: "很高兴认识你，___。",
    emoji: "🤝",
    grade: 1,
    say: "Nice to meet you, Tom.",
    blanks: [
      { word: "Tom", emoji: "👦", zh: "汤姆" },
      { word: "Anna", emoji: "👧", zh: "安娜" },
      { word: "Miss Li", emoji: "👩‍🏫", zh: "李老师" }
    ],
    reply: { q: "This is my new friend. Say hello!", a: "Nice to meet you, ___!", qzh: "这是我的新朋友，打个招呼吧！" }
  },
  {
    id: "s_goodmorning",
    pattern: "Good morning, ___!",
    zh: "早上好，___！",
    emoji: "🌅",
    grade: 1,
    say: "Good morning, Mum!",
    blanks: [
      { word: "Mum", emoji: "👩", zh: "妈妈" },
      { word: "Dad", emoji: "👨", zh: "爸爸" },
      { word: "teacher", emoji: "👩‍🏫", zh: "老师" }
    ],
    reply: { q: "Who do you greet in the morning?", a: "Good morning, ___!", qzh: "早上你向谁问好？" }
  },
  {
    id: "s_goodnight",
    pattern: "Good night, ___.",
    zh: "晚安，___。",
    emoji: "🌙",
    grade: 1,
    say: "Good night, Mum.",
    blanks: [
      { word: "Mum", emoji: "👩", zh: "妈妈" },
      { word: "Dad", emoji: "👨", zh: "爸爸" },
      { word: "baby", emoji: "👶", zh: "宝宝" }
    ],
    reply: { q: "It is time to sleep. What do you say?", a: "Good night, ___!", qzh: "该睡觉啦，你说什么？" }
  },
  {
    id: "s_howareyou",
    pattern: "I am ___, thank you.",
    zh: "我___，谢谢你。",
    emoji: "🙂",
    grade: 1,
    say: "I am fine, thank you.",
    blanks: [
      { word: "fine", emoji: "😊", zh: "很好" },
      { word: "happy", emoji: "😄", zh: "很开心" },
      { word: "OK", emoji: "👌", zh: "还不错" }
    ],
    reply: { q: "How are you?", a: "I am ___, thank you.", qzh: "你好吗？" }
  },
  {
    id: "s_iamfrom",
    pattern: "I am from ___.",
    zh: "我来自___。",
    emoji: "🌍",
    grade: 2,
    say: "I am from China.",
    blanks: [
      { word: "China", emoji: "🇨🇳", zh: "中国" },
      { word: "Beijing", emoji: "🏙️", zh: "北京" },
      { word: "Shanghai", emoji: "🌆", zh: "上海" }
    ],
    reply: { q: "Where are you from?", a: "I am from ___.", qzh: "你来自哪里？" }
  },
  {
    id: "s_howold",
    pattern: "I am ___ years old.",
    zh: "我___岁了。",
    emoji: "🎂",
    grade: 1,
    say: "I am six years old.",
    blanks: [
      { word: "six", emoji: "6️⃣", zh: "六" },
      { word: "seven", emoji: "7️⃣", zh: "七" },
      { word: "eight", emoji: "8️⃣", zh: "八" }
    ],
    reply: { q: "How old are you?", a: "I am ___ years old.", qzh: "你几岁啦？" }
  },

  // ---- This is… / 介绍（5 个） ----
  {
    id: "s_thisismy",
    pattern: "This is my ___.",
    zh: "这是我的___。",
    emoji: "👉",
    grade: 1,
    say: "This is my mum.",
    blanks: [
      { word: "mum", emoji: "👩", zh: "妈妈" },
      { word: "dad", emoji: "👨", zh: "爸爸" },
      { word: "book", emoji: "📖", zh: "书" },
      { word: "cat", emoji: "🐱", zh: "猫" }
    ],
    reply: { q: "Who is this?", a: "This is my ___.", qzh: "这是谁？" }
  },
  {
    id: "s_thisisa",
    pattern: "This is a ___.",
    zh: "这是一个___。",
    emoji: "🎁",
    grade: 1,
    say: "This is a dog.",
    blanks: [
      { word: "dog", emoji: "🐶", zh: "狗" },
      { word: "cat", emoji: "🐱", zh: "猫" },
      { word: "bird", emoji: "🐦", zh: "小鸟" },
      { word: "ball", emoji: "⚽", zh: "球" }
    ],
    reply: { q: "What is this?", a: "This is a ___.", qzh: "这是什么？" }
  },
  {
    id: "s_thatis",
    pattern: "That is a ___.",
    zh: "那是一个___。",
    emoji: "🌈",
    grade: 2,
    say: "That is a kite.",
    blanks: [
      { word: "kite", emoji: "🪁", zh: "风筝" },
      { word: "bus", emoji: "🚌", zh: "公共汽车" },
      { word: "tree", emoji: "🌳", zh: "树" },
      { word: "star", emoji: "⭐", zh: "星星" }
    ],
    reply: { q: "What is that?", a: "That is a ___.", qzh: "那是什么？" }
  },
  {
    id: "s_theseare",
    pattern: "These are my ___.",
    zh: "这些是我的___。",
    emoji: "👟",
    grade: 2,
    say: "These are my shoes.",
    blanks: [
      { word: "shoes", emoji: "👟", zh: "鞋子" },
      { word: "books", emoji: "📚", zh: "书" },
      { word: "hands", emoji: "✋", zh: "手" },
      { word: "toys", emoji: "🧸", zh: "玩具" }
    ],
    reply: { q: "What are these?", a: "These are my ___.", qzh: "这些是什么？" }
  },
  {
    id: "s_sheismy",
    pattern: "She is my ___.",
    zh: "她是我的___。",
    emoji: "👧",
    grade: 2,
    say: "She is my sister.",
    blanks: [
      { word: "sister", emoji: "👧", zh: "姐姐" },
      { word: "mother", emoji: "👩", zh: "妈妈" },
      { word: "friend", emoji: "🧒", zh: "朋友" },
      { word: "teacher", emoji: "👩‍🏫", zh: "老师" }
    ],
    reply: { q: "Who is she?", a: "She is my ___.", qzh: "她是谁？" }
  },

  // ---- I have… / 我有（5 个） ----
  {
    id: "s_ihavea",
    pattern: "I have a ___.",
    zh: "我有一个___。",
    emoji: "🎁",
    grade: 1,
    say: "I have a ball.",
    blanks: [
      { word: "ball", emoji: "⚽", zh: "球" },
      { word: "dog", emoji: "🐶", zh: "狗" },
      { word: "book", emoji: "📖", zh: "书" },
      { word: "bike", emoji: "🚲", zh: "自行车" }
    ],
    reply: { q: "What do you have?", a: "I have a ___.", qzh: "你有什么？" }
  },
  {
    id: "s_ihavetwo",
    pattern: "I have two ___.",
    zh: "我有两个___。",
    emoji: "✌️",
    grade: 1,
    say: "I have two apples.",
    blanks: [
      { word: "apples", emoji: "🍎", zh: "苹果" },
      { word: "hands", emoji: "✋", zh: "手" },
      { word: "eyes", emoji: "👀", zh: "眼睛" },
      { word: "cats", emoji: "🐱", zh: "猫" }
    ],
    reply: { q: "What do you have?", a: "I have two ___.", qzh: "你有什么？" }
  },
  {
    id: "s_ihavebig",
    pattern: "I have a big ___.",
    zh: "我有一个大___。",
    emoji: "🐘",
    grade: 2,
    say: "I have a big box.",
    blanks: [
      { word: "box", emoji: "📦", zh: "盒子" },
      { word: "ball", emoji: "⚽", zh: "球" },
      { word: "bag", emoji: "🎒", zh: "书包" },
      { word: "cake", emoji: "🍰", zh: "蛋糕" }
    ],
    reply: { q: "What is in your hand?", a: "I have a big ___.", qzh: "你手里是什么？" }
  },
  {
    id: "s_ihavesmall",
    pattern: "I have a small ___.",
    zh: "我有一个小___。",
    emoji: "🐭",
    grade: 2,
    say: "I have a small cat.",
    blanks: [
      { word: "cat", emoji: "🐱", zh: "猫" },
      { word: "cup", emoji: "☕", zh: "杯子" },
      { word: "hat", emoji: "🎩", zh: "帽子" },
      { word: "toy", emoji: "🧸", zh: "玩具" }
    ],
    reply: { q: "Do you have a big cat?", a: "No, I have a small ___.", qzh: "你有一只大猫吗？" }
  },
  {
    id: "s_wehavea",
    pattern: "We have a ___.",
    zh: "我们有一个___。",
    emoji: "👨‍👩‍👧",
    grade: 2,
    say: "We have a dog.",
    blanks: [
      { word: "dog", emoji: "🐶", zh: "狗" },
      { word: "cat", emoji: "🐱", zh: "猫" },
      { word: "garden", emoji: "🌷", zh: "花园" },
      { word: "car", emoji: "🚗", zh: "小汽车" }
    ],
    reply: { q: "Do you have a pet?", a: "We have a ___.", qzh: "你们家有宠物吗？" }
  },

  // ---- I like… / 我喜欢（6 个） ----
  {
    id: "s_ilike",
    pattern: "I like ___.",
    zh: "我喜欢___。",
    emoji: "😍",
    grade: 1,
    say: "I like apples.",
    blanks: [
      { word: "apples", emoji: "🍎", zh: "苹果" },
      { word: "cats", emoji: "🐱", zh: "猫" },
      { word: "milk", emoji: "🥛", zh: "牛奶" },
      { word: "books", emoji: "📚", zh: "书" }
    ],
    reply: { q: "What do you like?", a: "I like ___.", qzh: "你喜欢什么？" }
  },
  {
    id: "s_iliketodo",
    pattern: "I like to ___.",
    zh: "我喜欢___。",
    emoji: "🏃",
    grade: 2,
    say: "I like to run.",
    blanks: [
      { word: "run", emoji: "🏃", zh: "跑步" },
      { word: "sing", emoji: "🎤", zh: "唱歌" },
      { word: "draw", emoji: "🎨", zh: "画画" },
      { word: "swim", emoji: "🏊", zh: "游泳" }
    ],
    reply: { q: "What do you like to do?", a: "I like to ___.", qzh: "你喜欢做什么？" }
  },
  {
    id: "s_ilikeverymuch",
    pattern: "I like ___ very much.",
    zh: "我很喜欢___。",
    emoji: "💖",
    grade: 2,
    say: "I like pandas very much.",
    blanks: [
      { word: "pandas", emoji: "🐼", zh: "熊猫" },
      { word: "candy", emoji: "🍬", zh: "糖果" },
      { word: "music", emoji: "🎵", zh: "音乐" },
      { word: "dogs", emoji: "🐶", zh: "狗" }
    ],
    reply: { q: "Do you like pandas?", a: "Yes, I like ___ very much.", qzh: "你喜欢熊猫吗？" }
  },
  {
    id: "s_ilovemy",
    pattern: "I love my ___.",
    zh: "我爱我的___。",
    emoji: "❤️",
    grade: 1,
    say: "I love my mum.",
    blanks: [
      { word: "mum", emoji: "👩", zh: "妈妈" },
      { word: "dad", emoji: "👨", zh: "爸爸" },
      { word: "family", emoji: "👨‍👩‍👧‍👦", zh: "家人" },
      { word: "dog", emoji: "🐶", zh: "狗" }
    ],
    reply: { q: "Who do you love?", a: "I love my ___.", qzh: "你爱谁？" }
  },
  {
    id: "s_idontlike",
    pattern: "I don't like ___.",
    zh: "我不喜欢___。",
    emoji: "🙈",
    grade: 2,
    say: "I don't like bugs.",
    blanks: [
      { word: "bugs", emoji: "🐛", zh: "虫子" },
      { word: "rain", emoji: "🌧️", zh: "下雨" },
      { word: "onions", emoji: "🧅", zh: "洋葱" },
      { word: "cold", emoji: "🥶", zh: "寒冷" }
    ],
    reply: { q: "Do you like bugs?", a: "No, I don't like ___.", qzh: "你喜欢虫子吗？" }
  },
  {
    id: "s_ilikebest",
    pattern: "I like ___ best.",
    zh: "我最喜欢___。",
    emoji: "🥇",
    grade: 3,
    say: "I like spring best.",
    blanks: [
      { word: "spring", emoji: "🌸", zh: "春天" },
      { word: "summer", emoji: "☀️", zh: "夏天" },
      { word: "winter", emoji: "❄️", zh: "冬天" },
      { word: "autumn", emoji: "🍂", zh: "秋天" }
    ],
    reply: { q: "Which season do you like best?", a: "I like ___ best.", qzh: "你最喜欢哪个季节？" }
  },

  // ---- I can… / 我会（6 个） ----
  {
    id: "s_ican",
    pattern: "I can ___.",
    zh: "我会___。",
    emoji: "💪",
    grade: 1,
    say: "I can jump.",
    blanks: [
      { word: "jump", emoji: "🤸", zh: "跳" },
      { word: "run", emoji: "🏃", zh: "跑" },
      { word: "sing", emoji: "🎤", zh: "唱歌" },
      { word: "swim", emoji: "🏊", zh: "游泳" }
    ],
    reply: { q: "What can you do?", a: "I can ___.", qzh: "你会做什么？" }
  },
  {
    id: "s_icant",
    pattern: "I can't ___ yet.",
    zh: "我还不会___。",
    emoji: "🌱",
    grade: 2,
    say: "I can't swim yet.",
    blanks: [
      { word: "swim", emoji: "🏊", zh: "游泳" },
      { word: "dance", emoji: "💃", zh: "跳舞" },
      { word: "skate", emoji: "⛸️", zh: "滑冰" },
      { word: "cook", emoji: "🍳", zh: "做饭" }
    ],
    reply: { q: "Can you swim?", a: "Not yet. I can't ___ yet.", qzh: "你会游泳吗？" }
  },
  {
    id: "s_canyou",
    pattern: "Can you ___?",
    zh: "你会___吗？",
    emoji: "🤔",
    grade: 1,
    say: "Can you swim?",
    blanks: [
      { word: "swim", emoji: "🏊", zh: "游泳" },
      { word: "dance", emoji: "💃", zh: "跳舞" },
      { word: "sing", emoji: "🎤", zh: "唱歌" },
      { word: "draw", emoji: "🎨", zh: "画画" }
    ],
    reply: { q: "Let's play together. Can you ___?", a: "Yes, I can ___.", qzh: "我们一起玩吧，你会___吗？" }
  },
  {
    id: "s_icanwell",
    pattern: "I can ___ very well.",
    zh: "我___得很好。",
    emoji: "🌟",
    grade: 2,
    say: "I can sing very well.",
    blanks: [
      { word: "sing", emoji: "🎤", zh: "唱歌" },
      { word: "dance", emoji: "💃", zh: "跳舞" },
      { word: "draw", emoji: "🎨", zh: "画画" },
      { word: "swim", emoji: "🏊", zh: "游泳" }
    ],
    reply: { q: "Can you sing?", a: "Yes, I can ___ very well.", qzh: "你会唱歌吗？" }
  },
  {
    id: "s_icanhelp",
    pattern: "I can help ___.",
    zh: "我可以帮___。",
    emoji: "🤝",
    grade: 2,
    say: "I can help Mum.",
    blanks: [
      { word: "Mum", emoji: "👩", zh: "妈妈" },
      { word: "Dad", emoji: "👨", zh: "爸爸" },
      { word: "you", emoji: "👉", zh: "你" },
      { word: "my friend", emoji: "🧒", zh: "我的朋友" }
    ],
    reply: { q: "Can you help me?", a: "Yes, I can help ___.", qzh: "你能帮我吗？" }
  },
  {
    id: "s_icannnow",
    pattern: "I can ___ now!",
    zh: "我现在会___啦！",
    emoji: "🎉",
    grade: 1,
    say: "I can read now!",
    blanks: [
      { word: "read", emoji: "📖", zh: "读书" },
      { word: "write", emoji: "✍️", zh: "写字" },
      { word: "swim", emoji: "🏊", zh: "游泳" },
      { word: "cook", emoji: "🍳", zh: "做饭" }
    ],
    reply: { q: "Can you read?", a: "Yes! I can ___ now.", qzh: "你会读书了吗？" }
  },

  // ---- Can I…? / 请求（5 个） ----
  {
    id: "s_caniplay",
    pattern: "Can I ___?",
    zh: "我可以___吗？",
    emoji: "🙋",
    grade: 1,
    say: "Can I play?",
    blanks: [
      { word: "play", emoji: "🎮", zh: "玩" },
      { word: "go", emoji: "🚶", zh: "走" },
      { word: "look", emoji: "👀", zh: "看一看" },
      { word: "sit", emoji: "🪑", zh: "坐" }
    ],
    reply: { q: "Can I ___?", a: "Sure! You can ___.", qzh: "我可以___吗？" }
  },
  {
    id: "s_caniplaywith",
    pattern: "Can I play with ___?",
    zh: "我可以和___玩吗？",
    emoji: "🧸",
    grade: 2,
    say: "Can I play with Tom?",
    blanks: [
      { word: "Tom", emoji: "👦", zh: "汤姆" },
      { word: "you", emoji: "👉", zh: "你" },
      { word: "the dog", emoji: "🐶", zh: "小狗" },
      { word: "Lily", emoji: "👧", zh: "莉莉" }
    ],
    reply: { q: "Can I play with ___?", a: "Sure! You can play with ___.", qzh: "我可以和___玩吗？" }
  },
  {
    id: "s_canihave",
    pattern: "Can I have some ___?",
    zh: "我可以要一些___吗？",
    emoji: "🥛",
    grade: 2,
    say: "Can I have some water?",
    blanks: [
      { word: "water", emoji: "💧", zh: "水" },
      { word: "milk", emoji: "🥛", zh: "牛奶" },
      { word: "juice", emoji: "🧃", zh: "果汁" },
      { word: "bread", emoji: "🍞", zh: "面包" }
    ],
    reply: { q: "Can I have some ___?", a: "Sure, here is some ___.", qzh: "我可以要一些___吗？" }
  },
  {
    id: "s_canigo",
    pattern: "Can I go to the ___?",
    zh: "我可以去___吗？",
    emoji: "🚪",
    grade: 2,
    say: "Can I go to the park?",
    blanks: [
      { word: "park", emoji: "🏞️", zh: "公园" },
      { word: "zoo", emoji: "🦁", zh: "动物园" },
      { word: "shop", emoji: "🏪", zh: "商店" },
      { word: "beach", emoji: "🏖️", zh: "海滩" }
    ],
    reply: { q: "Can I go to the ___?", a: "Yes, we can go to the ___.", qzh: "我可以去___吗？" }
  },
  {
    id: "s_canilook",
    pattern: "Can I look at your ___?",
    zh: "我可以看看你的___吗？",
    emoji: "👀",
    grade: 3,
    say: "Can I look at your book?",
    blanks: [
      { word: "book", emoji: "📖", zh: "书" },
      { word: "toy", emoji: "🧸", zh: "玩具" },
      { word: "picture", emoji: "🖼️", zh: "画" },
      { word: "new bike", emoji: "🚲", zh: "新自行车" }
    ],
    reply: { q: "Can I look at your ___?", a: "Sure, you can look at my ___.", qzh: "我可以看看你的___吗？" }
  },

  // ---- 提问：这是什么 / 他是谁（6 个） ----
  {
    id: "s_whatisthis",
    pattern: "What is this? It is a ___.",
    zh: "这是什么？这是一只___。",
    emoji: "❓",
    grade: 1,
    say: "What is this? It is a cat.",
    blanks: [
      { word: "cat", emoji: "🐱", zh: "猫" },
      { word: "dog", emoji: "🐶", zh: "狗" },
      { word: "duck", emoji: "🦆", zh: "鸭子" },
      { word: "bird", emoji: "🐦", zh: "小鸟" }
    ],
    reply: { q: "What is this?", a: "It is a ___.", qzh: "这是什么？" }
  },
  {
    id: "s_whatisthat",
    pattern: "What is that? It is a ___.",
    zh: "那是什么？那是一个___。",
    emoji: "🔭",
    grade: 2,
    say: "What is that? It is a bus.",
    blanks: [
      { word: "bus", emoji: "🚌", zh: "公共汽车" },
      { word: "kite", emoji: "🪁", zh: "风筝" },
      { word: "star", emoji: "⭐", zh: "星星" },
      { word: "plane", emoji: "✈️", zh: "飞机" }
    ],
    reply: { q: "What is that?", a: "It is a ___.", qzh: "那是什么？" }
  },
  {
    id: "s_whatarethese",
    pattern: "What are these? They are ___.",
    zh: "这些是什么？它们是___。",
    emoji: "🧦",
    grade: 2,
    say: "What are these? They are socks.",
    blanks: [
      { word: "socks", emoji: "🧦", zh: "袜子" },
      { word: "apples", emoji: "🍎", zh: "苹果" },
      { word: "books", emoji: "📚", zh: "书" },
      { word: "ducks", emoji: "🦆", zh: "鸭子" }
    ],
    reply: { q: "What are these?", a: "They are ___.", qzh: "这些是什么？" }
  },
  {
    id: "s_whoishe",
    pattern: "Who is he? He is my ___.",
    zh: "他是谁？他是我的___。",
    emoji: "🙋‍♂️",
    grade: 2,
    say: "Who is he? He is my brother.",
    blanks: [
      { word: "brother", emoji: "👦", zh: "哥哥" },
      { word: "father", emoji: "👨", zh: "爸爸" },
      { word: "friend", emoji: "🧒", zh: "朋友" },
      { word: "teacher", emoji: "👨‍🏫", zh: "老师" }
    ],
    reply: { q: "Who is he?", a: "He is my ___.", qzh: "他是谁？" }
  },
  {
    id: "s_whatisfavorite",
    pattern: "What is your favorite ___?",
    zh: "你最喜欢什么___？",
    emoji: "🌟",
    grade: 3,
    say: "What is your favorite color?",
    blanks: [
      { word: "color", emoji: "🎨", zh: "颜色" },
      { word: "animal", emoji: "🐼", zh: "动物" },
      { word: "food", emoji: "🍚", zh: "食物" },
      { word: "book", emoji: "📖", zh: "书" }
    ],
    reply: { q: "What is your favorite ___?", a: "I like this ___ best.", qzh: "你最喜欢什么___？" }
  },
  {
    id: "s_whatishedoing",
    pattern: "What is he doing? He is ___.",
    zh: "他在做什么？他在___。",
    emoji: "🏃",
    grade: 3,
    say: "What is he doing? He is running.",
    blanks: [
      { word: "running", emoji: "🏃", zh: "跑步" },
      { word: "sleeping", emoji: "😴", zh: "睡觉" },
      { word: "eating", emoji: "🍚", zh: "吃饭" },
      { word: "reading", emoji: "📖", zh: "看书" }
    ],
    reply: { q: "What is he doing?", a: "He is ___.", qzh: "他在做什么？" }
  },

  // ---- Where is…? / 在哪里（6 个） ----
  {
    id: "s_whereismy",
    pattern: "Where is my ___?",
    zh: "我的___在哪里？",
    emoji: "🔍",
    grade: 1,
    say: "Where is my cat?",
    blanks: [
      { word: "cat", emoji: "🐱", zh: "猫" },
      { word: "book", emoji: "📖", zh: "书" },
      { word: "bag", emoji: "🎒", zh: "书包" },
      { word: "hat", emoji: "🎩", zh: "帽子" }
    ],
    reply: { q: "Where is my ___?", a: "Look! Your ___ is here.", qzh: "我的___在哪里？" }
  },
  {
    id: "s_whereisthe",
    pattern: "Where is the ___?",
    zh: "___在哪里？",
    emoji: "🏠",
    grade: 2,
    say: "Where is the ball?",
    blanks: [
      { word: "ball", emoji: "⚽", zh: "球" },
      { word: "dog", emoji: "🐶", zh: "狗" },
      { word: "pen", emoji: "🖊️", zh: "钢笔" },
      { word: "bus", emoji: "🚌", zh: "公共汽车" }
    ],
    reply: { q: "Where is the ___?", a: "The ___ is over there.", qzh: "___在哪里？" }
  },
  {
    id: "s_itisin",
    pattern: "It is in the ___.",
    zh: "它在___里面。",
    emoji: "📦",
    grade: 2,
    say: "It is in the box.",
    blanks: [
      { word: "box", emoji: "📦", zh: "盒子" },
      { word: "bag", emoji: "🎒", zh: "书包" },
      { word: "room", emoji: "🚪", zh: "房间" },
      { word: "classroom", emoji: "🏫", zh: "教室" }
    ],
    reply: { q: "Where is the ball?", a: "It is in the ___.", qzh: "球在哪里？" }
  },
  {
    id: "s_itison",
    pattern: "It is on the ___.",
    zh: "它在___上面。",
    emoji: "🍽️",
    grade: 2,
    say: "It is on the table.",
    blanks: [
      { word: "table", emoji: "🍽️", zh: "桌子" },
      { word: "bed", emoji: "🛏️", zh: "床" },
      { word: "chair", emoji: "🪑", zh: "椅子" },
      { word: "shelf", emoji: "📚", zh: "书架" }
    ],
    reply: { q: "Where is my book?", a: "It is on the ___.", qzh: "我的书在哪里？" }
  },
  {
    id: "s_whereareyou",
    pattern: "Where are you? I am ___.",
    zh: "你在哪里？我在___。",
    emoji: "📍",
    grade: 2,
    say: "Where are you? I am here.",
    blanks: [
      { word: "here", emoji: "📍", zh: "这里" },
      { word: "at home", emoji: "🏠", zh: "在家" },
      { word: "in the park", emoji: "🏞️", zh: "在公园" },
      { word: "at school", emoji: "🏫", zh: "在学校" }
    ],
    reply: { q: "Where are you?", a: "I am ___.", qzh: "你在哪里？" }
  },
  {
    id: "s_whereisyour",
    pattern: "Where is your ___?",
    zh: "你的___在哪里？",
    emoji: "🧭",
    grade: 3,
    say: "Where is your school?",
    blanks: [
      { word: "school", emoji: "🏫", zh: "学校" },
      { word: "home", emoji: "🏠", zh: "家" },
      { word: "teacher", emoji: "👩‍🏫", zh: "老师" },
      { word: "pencil", emoji: "✏️", zh: "铅笔" }
    ],
    reply: { q: "Where is your ___?", a: "My ___ is over there.", qzh: "你的___在哪里？" }
  },

  // ---- How many…? / 有多少（5 个） ----
  {
    id: "s_howmanyhave",
    pattern: "How many ___ do you have?",
    zh: "你有多少___？",
    emoji: "🔢",
    grade: 2,
    say: "How many apples do you have?",
    blanks: [
      { word: "apples", emoji: "🍎", zh: "苹果" },
      { word: "books", emoji: "📚", zh: "书" },
      { word: "cats", emoji: "🐱", zh: "猫" },
      { word: "pencils", emoji: "✏️", zh: "铅笔" }
    ],
    reply: { q: "How many ___ do you have?", a: "I have three ___.", qzh: "你有多少___？" }
  },
  {
    id: "s_howmanyare",
    pattern: "How many ___ are there?",
    zh: "那里有多少___？",
    emoji: "🧮",
    grade: 2,
    say: "How many ducks are there?",
    blanks: [
      { word: "ducks", emoji: "🦆", zh: "鸭子" },
      { word: "birds", emoji: "🐦", zh: "小鸟" },
      { word: "stars", emoji: "⭐", zh: "星星" },
      { word: "flowers", emoji: "🌸", zh: "花" }
    ],
    reply: { q: "How many ___ are there?", a: "There are five ___.", qzh: "那里有多少___？" }
  },
  {
    id: "s_ihavethree",
    pattern: "I have three ___.",
    zh: "我有三个___。",
    emoji: "3️⃣",
    grade: 1,
    say: "I have three balls.",
    blanks: [
      { word: "balls", emoji: "⚽", zh: "球" },
      { word: "apples", emoji: "🍎", zh: "苹果" },
      { word: "pens", emoji: "🖊️", zh: "钢笔" },
      { word: "toys", emoji: "🧸", zh: "玩具" }
    ],
    reply: { q: "How many balls do you have?", a: "I have three ___.", qzh: "你有几个球？" }
  },
  {
    id: "s_letscount",
    pattern: "Let's count: one, two, ___!",
    zh: "我们一起数：一、二、___！",
    emoji: "🔢",
    grade: 1,
    say: "Let's count: one, two, three!",
    blanks: [
      { word: "three", emoji: "3️⃣", zh: "三" },
      { word: "four", emoji: "4️⃣", zh: "四" },
      { word: "five", emoji: "5️⃣", zh: "五" }
    ],
    reply: { q: "Can you count with me?", a: "Let's count: one, two, ___!", qzh: "和我一起数好吗？" }
  },
  {
    id: "s_howmanysee",
    pattern: "How many ___ can you see?",
    zh: "你能看见多少___？",
    emoji: "👀",
    grade: 2,
    say: "How many kites can you see?",
    blanks: [
      { word: "kites", emoji: "🪁", zh: "风筝" },
      { word: "cars", emoji: "🚗", zh: "小汽车" },
      { word: "dogs", emoji: "🐶", zh: "狗" },
      { word: "trees", emoji: "🌳", zh: "树" }
    ],
    reply: { q: "How many ___ can you see?", a: "I can see six ___.", qzh: "你能看见多少___？" }
  },

  // ---- 颜色 / 天气 / 时间（8 个） ----
  {
    id: "s_favoritecolor",
    pattern: "My favorite color is ___.",
    zh: "我最喜欢的颜色是___。",
    emoji: "🌈",
    grade: 2,
    say: "My favorite color is blue.",
    blanks: [
      { word: "blue", emoji: "🟦", zh: "蓝色" },
      { word: "red", emoji: "🟥", zh: "红色" },
      { word: "green", emoji: "🟩", zh: "绿色" },
      { word: "yellow", emoji: "🟨", zh: "黄色" }
    ],
    reply: { q: "What is your favorite color?", a: "My favorite color is ___.", qzh: "你最喜欢什么颜色？" }
  },
  {
    id: "s_isitcolor",
    pattern: "Is it ___? Yes, it is.",
    zh: "它是___吗？是的。",
    emoji: "🔍",
    grade: 2,
    say: "Is it red? Yes, it is.",
    blanks: [
      { word: "red", emoji: "🟥", zh: "红色" },
      { word: "blue", emoji: "🟦", zh: "蓝色" },
      { word: "green", emoji: "🟩", zh: "绿色" },
      { word: "yellow", emoji: "🟨", zh: "黄色" }
    ],
    reply: { q: "Is it ___?", a: "Yes, it is ___.", qzh: "它是___吗？" }
  },
  {
    id: "s_weather",
    pattern: "It is ___ today.",
    zh: "今天___。",
    emoji: "🌤️",
    grade: 1,
    say: "It is sunny today.",
    blanks: [
      { word: "sunny", emoji: "☀️", zh: "晴天" },
      { word: "rainy", emoji: "🌧️", zh: "下雨" },
      { word: "windy", emoji: "🌬️", zh: "刮风" },
      { word: "snowy", emoji: "❄️", zh: "下雪" }
    ],
    reply: { q: "How is the weather today?", a: "It is ___ today.", qzh: "今天天气怎么样？" }
  },
  {
    id: "s_ilikeweather",
    pattern: "I like ___ days.",
    zh: "我喜欢___的日子。",
    emoji: "🌈",
    grade: 2,
    say: "I like sunny days.",
    blanks: [
      { word: "sunny", emoji: "☀️", zh: "晴天" },
      { word: "rainy", emoji: "🌧️", zh: "雨天" },
      { word: "snowy", emoji: "❄️", zh: "雪天" },
      { word: "windy", emoji: "🌬️", zh: "风天" }
    ],
    reply: { q: "What kind of day do you like?", a: "I like ___ days.", qzh: "你喜欢什么样的天气？" }
  },
  {
    id: "s_timeoclock",
    pattern: "It is ___ o'clock.",
    zh: "现在___点。",
    emoji: "🕐",
    grade: 2,
    say: "It is seven o'clock.",
    blanks: [
      { word: "seven", emoji: "7️⃣", zh: "七" },
      { word: "eight", emoji: "8️⃣", zh: "八" },
      { word: "nine", emoji: "9️⃣", zh: "九" },
      { word: "ten", emoji: "🔟", zh: "十" }
    ],
    reply: { q: "What time is it?", a: "It is ___ o'clock.", qzh: "现在几点了？" }
  },
  {
    id: "s_timefor",
    pattern: "It is time for ___.",
    zh: "该___了。",
    emoji: "⏰",
    grade: 2,
    say: "It is time for bed.",
    blanks: [
      { word: "bed", emoji: "🛏️", zh: "睡觉" },
      { word: "lunch", emoji: "🍱", zh: "午饭" },
      { word: "school", emoji: "🏫", zh: "上学" },
      { word: "dinner", emoji: "🍽️", zh: "晚饭" }
    ],
    reply: { q: "What do we do at eight o'clock?", a: "It is time for ___.", qzh: "八点钟我们做什么？" }
  },
  {
    id: "s_todayis",
    pattern: "Today is ___.",
    zh: "今天是___。",
    emoji: "📅",
    grade: 2,
    say: "Today is Monday.",
    blanks: [
      { word: "Monday", emoji: "🏫", zh: "星期一" },
      { word: "Friday", emoji: "🎉", zh: "星期五" },
      { word: "Saturday", emoji: "🎡", zh: "星期六" },
      { word: "Sunday", emoji: "🏖️", zh: "星期日" }
    ],
    reply: { q: "What day is it today?", a: "Today is ___.", qzh: "今天星期几？" }
  },
  {
    id: "s_birthday",
    pattern: "My birthday is in ___.",
    zh: "我的生日在___。",
    emoji: "🎂",
    grade: 3,
    say: "My birthday is in May.",
    blanks: [
      { word: "May", emoji: "🌷", zh: "五月" },
      { word: "June", emoji: "🌞", zh: "六月" },
      { word: "October", emoji: "🍂", zh: "十月" },
      { word: "January", emoji: "❄️", zh: "一月" }
    ],
    reply: { q: "When is your birthday?", a: "My birthday is in ___.", qzh: "你的生日在什么时候？" }
  },

  // ---- 祈使句 / 请这样做（6 个） ----
  {
    id: "s_pleasesit",
    pattern: "Please ___.",
    zh: "请___。",
    emoji: "🙏",
    grade: 1,
    say: "Please sit down.",
    blanks: [
      { word: "sit down", emoji: "🪑", zh: "坐下" },
      { word: "come in", emoji: "🚪", zh: "进来" },
      { word: "stand up", emoji: "🧍", zh: "站起来" },
      { word: "wait a minute", emoji: "⏳", zh: "等一下" }
    ],
    reply: { q: "What does the teacher say?", a: "Please ___.", qzh: "老师会说什么？" }
  },
  {
    id: "s_lookat",
    pattern: "Look at the ___.",
    zh: "看这个___。",
    emoji: "👀",
    grade: 1,
    say: "Look at the moon.",
    blanks: [
      { word: "moon", emoji: "🌙", zh: "月亮" },
      { word: "bird", emoji: "🐦", zh: "小鸟" },
      { word: "picture", emoji: "🖼️", zh: "画" },
      { word: "rainbow", emoji: "🌈", zh: "彩虹" }
    ],
    reply: { q: "What can you see?", a: "Look at the ___!", qzh: "你看见了什么？" }
  },
  {
    id: "s_listen",
    pattern: "Listen to the ___.",
    zh: "听___。",
    emoji: "👂",
    grade: 2,
    say: "Listen to the teacher.",
    blanks: [
      { word: "teacher", emoji: "👩‍🏫", zh: "老师" },
      { word: "music", emoji: "🎵", zh: "音乐" },
      { word: "bird", emoji: "🐦", zh: "小鸟" },
      { word: "song", emoji: "🎶", zh: "歌" }
    ],
    reply: { q: "What should we listen to?", a: "Listen to the ___.", qzh: "我们应该听什么？" }
  },
  {
    id: "s_dont",
    pattern: "Please don't ___.",
    zh: "请不要___。",
    emoji: "🚦",
    grade: 2,
    say: "Please don't run.",
    blanks: [
      { word: "run", emoji: "🏃", zh: "跑" },
      { word: "shout", emoji: "📢", zh: "大叫" },
      { word: "push", emoji: "👐", zh: "推" },
      { word: "hurry", emoji: "⏳", zh: "着急" }
    ],
    reply: { q: "Can I run in the classroom?", a: "Please don't ___.", qzh: "我可以在教室里跑吗？" }
  },
  {
    id: "s_comeand",
    pattern: "Come and ___!",
    zh: "来___吧！",
    emoji: "🎈",
    grade: 1,
    say: "Come and play!",
    blanks: [
      { word: "play", emoji: "🎮", zh: "玩" },
      { word: "see", emoji: "👀", zh: "看看" },
      { word: "help", emoji: "🤝", zh: "帮忙" },
      { word: "sing", emoji: "🎤", zh: "唱歌" }
    ],
    reply: { q: "I have a new game. What do you say?", a: "Come and ___!", qzh: "我有一个新游戏，你说什么？" }
  },
  {
    id: "s_putit",
    pattern: "Put it ___.",
    zh: "把它放在___。",
    emoji: "🧺",
    grade: 2,
    say: "Put it here.",
    blanks: [
      { word: "here", emoji: "📍", zh: "这里" },
      { word: "there", emoji: "👉", zh: "那里" },
      { word: "in the box", emoji: "📦", zh: "盒子里" },
      { word: "on the desk", emoji: "🍽️", zh: "桌子上" }
    ],
    reply: { q: "Where should I put it?", a: "Put it ___.", qzh: "我该把它放在哪里？" }
  },

  // ---- There is / There are（6 个） ----
  {
    id: "s_thereis",
    pattern: "There is a ___ in my room.",
    zh: "我的房间里有一个___。",
    emoji: "🏠",
    grade: 2,
    say: "There is a bed in my room.",
    blanks: [
      { word: "bed", emoji: "🛏️", zh: "床" },
      { word: "clock", emoji: "🕐", zh: "钟" },
      { word: "lamp", emoji: "💡", zh: "台灯" },
      { word: "dog", emoji: "🐶", zh: "狗" }
    ],
    reply: { q: "What is in your room?", a: "There is a ___ in my room.", qzh: "你的房间里有什么？" }
  },
  {
    id: "s_thereare",
    pattern: "There are many ___ in the park.",
    zh: "公园里有很多___。",
    emoji: "🌳",
    grade: 2,
    say: "There are many trees in the park.",
    blanks: [
      { word: "trees", emoji: "🌳", zh: "树" },
      { word: "flowers", emoji: "🌸", zh: "花" },
      { word: "birds", emoji: "🐦", zh: "小鸟" },
      { word: "children", emoji: "🧒", zh: "孩子" }
    ],
    reply: { q: "What is in the park?", a: "There are many ___ in the park.", qzh: "公园里有什么？" }
  },
  {
    id: "s_isthere",
    pattern: "Is there a ___ near here?",
    zh: "这附近有___吗？",
    emoji: "🔍",
    grade: 2,
    say: "Is there a cat near here?",
    blanks: [
      { word: "cat", emoji: "🐱", zh: "猫" },
      { word: "shop", emoji: "🏪", zh: "商店" },
      { word: "park", emoji: "🏞️", zh: "公园" },
      { word: "bathroom", emoji: "🛁", zh: "洗手间" }
    ],
    reply: { q: "Is there a ___ near here?", a: "Yes, there is a ___ near here.", qzh: "这附近有___吗？" }
  },
  {
    id: "s_thereisno",
    pattern: "There is no ___ today.",
    zh: "今天没有___。",
    emoji: "🌥️",
    grade: 2,
    say: "There is no rain today.",
    blanks: [
      { word: "rain", emoji: "🌧️", zh: "雨" },
      { word: "school", emoji: "🏫", zh: "课" },
      { word: "homework", emoji: "✍️", zh: "作业" },
      { word: "wind", emoji: "🌬️", zh: "风" }
    ],
    reply: { q: "Is there rain today?", a: "No, there is no ___ today.", qzh: "今天下雨吗？" }
  },
  {
    id: "s_familypeople",
    pattern: "There are ___ people in my family.",
    zh: "我家有___口人。",
    emoji: "👨‍👩‍👧",
    grade: 2,
    say: "There are four people in my family.",
    blanks: [
      { word: "four", emoji: "4️⃣", zh: "四" },
      { word: "three", emoji: "3️⃣", zh: "三" },
      { word: "five", emoji: "5️⃣", zh: "五" },
      { word: "six", emoji: "6️⃣", zh: "六" }
    ],
    reply: {
      q: "How many people are in your family?",
      a: "There are ___ people in my family.",
      qzh: "你家有几口人？"
    }
  },
  {
    id: "s_thereisacat",
    pattern: "There is a ___ on the bed.",
    zh: "床上有一个___。",
    emoji: "🛏️",
    grade: 1,
    say: "There is a cat on the bed.",
    blanks: [
      { word: "cat", emoji: "🐱", zh: "猫" },
      { word: "dog", emoji: "🐶", zh: "狗" },
      { word: "toy", emoji: "🧸", zh: "玩具" },
      { word: "hat", emoji: "🎩", zh: "帽子" }
    ],
    reply: { q: "What is on the bed?", a: "There is a ___ on the bed.", qzh: "床上有什么？" }
  },

  // ---- I want… / 我想要（5 个） ----
  {
    id: "s_iwant",
    pattern: "I want a ___.",
    zh: "我想要一个___。",
    emoji: "🙋",
    grade: 1,
    say: "I want a cake.",
    blanks: [
      { word: "cake", emoji: "🍰", zh: "蛋糕" },
      { word: "ball", emoji: "⚽", zh: "球" },
      { word: "book", emoji: "📖", zh: "书" },
      { word: "puppy", emoji: "🐶", zh: "小狗" }
    ],
    reply: { q: "What do you want?", a: "I want a ___.", qzh: "你想要什么？" }
  },
  {
    id: "s_iwantto",
    pattern: "I want to ___.",
    zh: "我想___。",
    emoji: "🎯",
    grade: 2,
    say: "I want to play.",
    blanks: [
      { word: "play", emoji: "🎮", zh: "玩" },
      { word: "sleep", emoji: "😴", zh: "睡觉" },
      { word: "go home", emoji: "🏠", zh: "回家" },
      { word: "eat", emoji: "🍚", zh: "吃东西" }
    ],
    reply: { q: "What do you want to do?", a: "I want to ___.", qzh: "你想做什么？" }
  },
  {
    id: "s_iwantsome",
    pattern: "I want some ___.",
    zh: "我想要一些___。",
    emoji: "🥤",
    grade: 2,
    say: "I want some juice.",
    blanks: [
      { word: "juice", emoji: "🧃", zh: "果汁" },
      { word: "water", emoji: "💧", zh: "水" },
      { word: "rice", emoji: "🍚", zh: "米饭" },
      { word: "apples", emoji: "🍎", zh: "苹果" }
    ],
    reply: { q: "What do you want to drink?", a: "I want some ___.", qzh: "你想喝什么？" }
  },
  {
    id: "s_doyouwantsome",
    pattern: "Do you want some ___?",
    zh: "你想要一些___吗？",
    emoji: "🍪",
    grade: 2,
    say: "Do you want some milk?",
    blanks: [
      { word: "milk", emoji: "🥛", zh: "牛奶" },
      { word: "bread", emoji: "🍞", zh: "面包" },
      { word: "cake", emoji: "🍰", zh: "蛋糕" },
      { word: "tea", emoji: "🍵", zh: "茶" }
    ],
    reply: { q: "Do you want some ___?", a: "Yes, please. I want some ___.", qzh: "你想要一些___吗？" }
  },
  {
    id: "s_iwanttobe",
    pattern: "I want to be a ___.",
    zh: "我想当一名___。",
    emoji: "🚀",
    grade: 3,
    say: "I want to be a teacher.",
    blanks: [
      { word: "teacher", emoji: "👩‍🏫", zh: "老师" },
      { word: "doctor", emoji: "👨‍⚕️", zh: "医生" },
      { word: "pilot", emoji: "👨‍✈️", zh: "飞行员" },
      { word: "singer", emoji: "🎤", zh: "歌手" }
    ],
    reply: { q: "What do you want to be?", a: "I want to be a ___.", qzh: "你长大后想当什么？" }
  },

  // ---- Do you like…? / 你喜欢吗（5 个） ----
  {
    id: "s_doyoulike",
    pattern: "Do you like ___?",
    zh: "你喜欢___吗？",
    emoji: "🤗",
    grade: 1,
    say: "Do you like apples?",
    blanks: [
      { word: "apples", emoji: "🍎", zh: "苹果" },
      { word: "cats", emoji: "🐱", zh: "猫" },
      { word: "music", emoji: "🎵", zh: "音乐" },
      { word: "ice cream", emoji: "🍦", zh: "冰淇淋" }
    ],
    reply: { q: "Do you like ___?", a: "Yes, I like ___.", qzh: "你喜欢___吗？" }
  },
  {
    id: "s_doyouliketodo",
    pattern: "Do you like to ___?",
    zh: "你喜欢___吗？",
    emoji: "🎨",
    grade: 2,
    say: "Do you like to draw?",
    blanks: [
      { word: "draw", emoji: "🎨", zh: "画画" },
      { word: "sing", emoji: "🎤", zh: "唱歌" },
      { word: "swim", emoji: "🏊", zh: "游泳" },
      { word: "dance", emoji: "💃", zh: "跳舞" }
    ],
    reply: { q: "Do you like to ___?", a: "Yes, I like to ___.", qzh: "你喜欢___吗？" }
  },
  {
    id: "s_yesido",
    pattern: "Yes, I do. I like ___.",
    zh: "是的，我喜欢___。",
    emoji: "✅",
    grade: 2,
    say: "Yes, I do. I like dogs.",
    blanks: [
      { word: "dogs", emoji: "🐶", zh: "狗" },
      { word: "books", emoji: "📚", zh: "书" },
      { word: "apples", emoji: "🍎", zh: "苹果" },
      { word: "milk", emoji: "🥛", zh: "牛奶" }
    ],
    reply: { q: "Do you like dogs?", a: "Yes, I do. I like ___.", qzh: "你喜欢狗吗？" }
  },
  {
    id: "s_noidont",
    pattern: "No, I don't like ___.",
    zh: "不，我不喜欢___。",
    emoji: "🙃",
    grade: 2,
    say: "No, I don't like onions.",
    blanks: [
      { word: "onions", emoji: "🧅", zh: "洋葱" },
      { word: "peppers", emoji: "🌶️", zh: "辣椒" },
      { word: "bugs", emoji: "🐛", zh: "虫子" },
      { word: "thunder", emoji: "⛈️", zh: "打雷" }
    ],
    reply: { q: "Do you like onions?", a: "No, I don't like ___.", qzh: "你喜欢洋葱吗？" }
  },
  {
    id: "s_whataboutyou",
    pattern: "I like ___. What about you?",
    zh: "我喜欢___。你呢？",
    emoji: "💬",
    grade: 3,
    say: "I like pandas. What about you?",
    blanks: [
      { word: "pandas", emoji: "🐼", zh: "熊猫" },
      { word: "music", emoji: "🎵", zh: "音乐" },
      { word: "soccer", emoji: "⚽", zh: "足球" },
      { word: "drawing", emoji: "🎨", zh: "画画" }
    ],
    reply: { q: "I like pandas. What about you?", a: "I like ___ too!", qzh: "我喜欢熊猫，你呢？" }
  },

  // ---- What color is it? / 什么颜色（4 个） ----
  {
    id: "s_whatcolorisit",
    pattern: "What color is it? It is ___.",
    zh: "它是什么颜色？它是___。",
    emoji: "🎨",
    grade: 1,
    say: "What color is it? It is red.",
    blanks: [
      { word: "red", emoji: "🟥", zh: "红色" },
      { word: "blue", emoji: "🟦", zh: "蓝色" },
      { word: "green", emoji: "🟩", zh: "绿色" },
      { word: "yellow", emoji: "🟨", zh: "黄色" }
    ],
    reply: { q: "What color is it?", a: "It is ___.", qzh: "它是什么颜色？" }
  },
  {
    id: "s_whatcolorisyour",
    pattern: "What color is your ___?",
    zh: "你的___是什么颜色？",
    emoji: "🖍️",
    grade: 2,
    say: "What color is your bag?",
    blanks: [
      { word: "bag", emoji: "🎒", zh: "书包" },
      { word: "hat", emoji: "🎩", zh: "帽子" },
      { word: "pen", emoji: "🖊️", zh: "钢笔" },
      { word: "bike", emoji: "🚲", zh: "自行车" }
    ],
    reply: { q: "What color is your ___?", a: "My ___ is blue.", qzh: "你的___是什么颜色？" }
  },
  {
    id: "s_thecoloris",
    pattern: "The ___ is red.",
    zh: "这个___是红色的。",
    emoji: "🍎",
    grade: 1,
    say: "The apple is red.",
    blanks: [
      { word: "apple", emoji: "🍎", zh: "苹果" },
      { word: "sun", emoji: "☀️", zh: "太阳" },
      { word: "rose", emoji: "🌹", zh: "玫瑰" },
      { word: "bus", emoji: "🚌", zh: "公共汽车" }
    ],
    reply: { q: "What color is the apple?", a: "The ___ is red.", qzh: "苹果是什么颜色？" }
  },
  {
    id: "s_crayon",
    pattern: "I have a ___ crayon.",
    zh: "我有一支___蜡笔。",
    emoji: "🖍️",
    grade: 2,
    say: "I have a red crayon.",
    blanks: [
      { word: "red", emoji: "🟥", zh: "红色" },
      { word: "blue", emoji: "🟦", zh: "蓝色" },
      { word: "green", emoji: "🟩", zh: "绿色" },
      { word: "purple", emoji: "🟪", zh: "紫色" }
    ],
    reply: { q: "Which crayon do you want?", a: "I have a ___ crayon.", qzh: "你想要哪支蜡笔？" }
  },

  // ---- Let's… / 我们一起（5 个） ----
  {
    id: "s_lets",
    pattern: "Let's ___!",
    zh: "我们一起___吧！",
    emoji: "🎉",
    grade: 1,
    say: "Let's play!",
    blanks: [
      { word: "play", emoji: "🎮", zh: "玩" },
      { word: "go", emoji: "🚶", zh: "走吧" },
      { word: "sing", emoji: "🎤", zh: "唱歌" },
      { word: "dance", emoji: "💃", zh: "跳舞" }
    ],
    reply: { q: "I have a new ball. What do you say?", a: "Let's ___!", qzh: "我有一个新球，你说什么？" }
  },
  {
    id: "s_letstogether",
    pattern: "Let's ___ together!",
    zh: "我们一起___吧！",
    emoji: "🤝",
    grade: 2,
    say: "Let's play together!",
    blanks: [
      { word: "play", emoji: "🎮", zh: "玩" },
      { word: "sing", emoji: "🎤", zh: "唱歌" },
      { word: "read", emoji: "📖", zh: "读书" },
      { word: "draw", emoji: "🎨", zh: "画画" }
    ],
    reply: { q: "Do you want to play with me?", a: "Sure! Let's ___ together!", qzh: "你想和我一起玩吗？" }
  },
  {
    id: "s_letsgoto",
    pattern: "Let's go to the ___!",
    zh: "我们去___吧！",
    emoji: "🚗",
    grade: 2,
    say: "Let's go to the park!",
    blanks: [
      { word: "park", emoji: "🏞️", zh: "公园" },
      { word: "zoo", emoji: "🦁", zh: "动物园" },
      { word: "beach", emoji: "🏖️", zh: "海滩" },
      { word: "library", emoji: "📚", zh: "图书馆" }
    ],
    reply: { q: "Where do you want to go?", a: "Let's go to the ___!", qzh: "你想去哪里？" }
  },
  {
    id: "s_letseat",
    pattern: "Let's eat ___!",
    zh: "我们吃___吧！",
    emoji: "🍽️",
    grade: 1,
    say: "Let's eat noodles!",
    blanks: [
      { word: "noodles", emoji: "🍜", zh: "面条" },
      { word: "rice", emoji: "🍚", zh: "米饭" },
      { word: "cake", emoji: "🍰", zh: "蛋糕" },
      { word: "fruit", emoji: "🍓", zh: "水果" }
    ],
    reply: { q: "I am hungry. What do you say?", a: "Let's eat ___!", qzh: "我饿了，你说什么？" }
  },
  {
    id: "s_letshelp",
    pattern: "Let's help ___.",
    zh: "我们来帮___吧。",
    emoji: "🌟",
    grade: 2,
    say: "Let's help Mum.",
    blanks: [
      { word: "Mum", emoji: "👩", zh: "妈妈" },
      { word: "Dad", emoji: "👨", zh: "爸爸" },
      { word: "the teacher", emoji: "👩‍🏫", zh: "老师" },
      { word: "our friend", emoji: "🧒", zh: "我们的朋友" }
    ],
    reply: { q: "Mum is busy. What can we do?", a: "Let's help ___.", qzh: "妈妈很忙，我们能做什么？" }
  },

  // ---- May I…? / 礼貌请求（4 个） ----
  {
    id: "s_mayi",
    pattern: "May I ___?",
    zh: "我可以___吗？",
    emoji: "🙋",
    grade: 2,
    say: "May I come in?",
    blanks: [
      { word: "come in", emoji: "🚪", zh: "进来" },
      { word: "sit here", emoji: "🪑", zh: "坐这里" },
      { word: "go now", emoji: "🚶", zh: "现在走" },
      { word: "have one", emoji: "🍪", zh: "拿一个" }
    ],
    reply: { q: "May I ___?", a: "Yes, you may ___.", qzh: "我可以___吗？" }
  },
  {
    id: "s_mayiuseyour",
    pattern: "May I use your ___?",
    zh: "我可以用你的___吗？",
    emoji: "✏️",
    grade: 2,
    say: "May I use your pencil?",
    blanks: [
      { word: "pencil", emoji: "✏️", zh: "铅笔" },
      { word: "ruler", emoji: "📏", zh: "尺子" },
      { word: "crayon", emoji: "🖍️", zh: "蜡笔" },
      { word: "eraser", emoji: "🧽", zh: "橡皮" }
    ],
    reply: { q: "May I use your ___?", a: "Sure, here is my ___.", qzh: "我可以用你的___吗？" }
  },
  {
    id: "s_mayihave",
    pattern: "May I have a ___?",
    zh: "我可以要一个___吗？",
    emoji: "🍪",
    grade: 2,
    say: "May I have a cookie?",
    blanks: [
      { word: "cookie", emoji: "🍪", zh: "饼干" },
      { word: "cup of tea", emoji: "☕", zh: "一杯茶" },
      { word: "apple", emoji: "🍎", zh: "苹果" },
      { word: "sticker", emoji: "⭐", zh: "贴纸" }
    ],
    reply: { q: "May I have a ___?", a: "Of course. Here is a ___.", qzh: "我可以要一个___吗？" }
  },
  {
    id: "s_yesyoumay",
    pattern: "Yes, you may ___.",
    zh: "好的，你可以___。",
    emoji: "👍",
    grade: 2,
    say: "Yes, you may go.",
    blanks: [
      { word: "go", emoji: "🚶", zh: "走" },
      { word: "play", emoji: "🎮", zh: "玩" },
      { word: "come in", emoji: "🚪", zh: "进来" },
      { word: "sit here", emoji: "🪑", zh: "坐这里" }
    ],
    reply: { q: "May I go now?", a: "Yes, you may ___.", qzh: "我现在可以走吗？" }
  },

  // ---- 谢谢 / 对不起 / 感受（5 个） ----
  {
    id: "s_thankyou",
    pattern: "Thank you for the ___.",
    zh: "谢谢你的___。",
    emoji: "💝",
    grade: 1,
    say: "Thank you for the gift.",
    blanks: [
      { word: "gift", emoji: "🎁", zh: "礼物" },
      { word: "help", emoji: "🤝", zh: "帮助" },
      { word: "cake", emoji: "🍰", zh: "蛋糕" },
      { word: "book", emoji: "📖", zh: "书" }
    ],
    reply: { q: "What do you say when you get a gift?", a: "Thank you for the ___!", qzh: "收到礼物时你说什么？" }
  },
  {
    id: "s_sorry",
    pattern: "Sorry, I ___.",
    zh: "对不起，我___。",
    emoji: "🙇",
    grade: 1,
    say: "Sorry, I am late.",
    blanks: [
      { word: "am late", emoji: "⏰", zh: "迟到了" },
      { word: "broke it", emoji: "🧩", zh: "弄坏了" },
      { word: "forgot", emoji: "😅", zh: "忘记了" },
      { word: "am wrong", emoji: "🙈", zh: "弄错了" }
    ],
    reply: { q: "You are late today. What do you say?", a: "Sorry, I ___.", qzh: "你今天迟到了，你说什么？" }
  },
  {
    id: "s_excuseme",
    pattern: "Excuse me, where is the ___?",
    zh: "打扰一下，___在哪里？",
    emoji: "🙋",
    grade: 2,
    say: "Excuse me, where is the restroom?",
    blanks: [
      { word: "restroom", emoji: "🚻", zh: "洗手间" },
      { word: "library", emoji: "📚", zh: "图书馆" },
      { word: "bus stop", emoji: "🚏", zh: "公交站" },
      { word: "classroom", emoji: "🏫", zh: "教室" }
    ],
    reply: {
      q: "Excuse me, where is the ___?",
      a: "Go straight. The ___ is over there.",
      qzh: "打扰一下，___在哪里？"
    }
  },
  {
    id: "s_thatisok",
    pattern: "That is OK. Let's ___.",
    zh: "没关系，我们___吧。",
    emoji: "💛",
    grade: 2,
    say: "That is OK. Let's try again.",
    blanks: [
      { word: "try again", emoji: "🔁", zh: "再试一次" },
      { word: "play", emoji: "🎮", zh: "玩" },
      { word: "go on", emoji: "🚶", zh: "继续" },
      { word: "be friends", emoji: "🤝", zh: "做好朋友" }
    ],
    reply: { q: "Sorry, I broke your toy.", a: "That is OK. Let's ___.", qzh: "对不起，我弄坏了你的玩具。" }
  },
  {
    id: "s_feelings",
    pattern: "I feel ___ today.",
    zh: "我今天觉得___。",
    emoji: "😊",
    grade: 1,
    say: "I feel happy today.",
    blanks: [
      { word: "happy", emoji: "😄", zh: "开心" },
      { word: "good", emoji: "😊", zh: "很好" },
      { word: "tired", emoji: "😴", zh: "有点累" },
      { word: "excited", emoji: "🤩", zh: "很兴奋" }
    ],
    reply: { q: "How do you feel today?", a: "I feel ___ today.", qzh: "你今天感觉怎么样？" }
  }
];
