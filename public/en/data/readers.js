// 绘本（分级读物）数据 —— window.EN_READERS
// 共 20 本，每本 8 页 + 3 道理解小测；每页 = 英文句子 + 中文翻译 + 一个 emoji 插画。
//   A 级 6 本（grade 1）：每页 3-5 个词，以 CVC 短元音词为主
//   B 级 7 本（grade 2）：每页 5-8 个词，加入高频词
//   C 级 7 本（grade 3）：每页 8-12 个词，含 and / but / because
// 每本只围绕注释中列出的少量核心词反复出现，孩子读起来不费力。
// quiz 每题 { q, zh, options:[3 个不重复选项], answer:正确选项下标 }。

window.EN_READERS = [
  {
    id: "r_mycat",
    title: "My Cat",
    titleZh: "我的猫",
    emoji: "🐱",
    grade: 1,
    level: "A",
    // 核心词：cat / fat / nap / sit / hat / red / sad / hug
    pages: [
      { en: "I have a cat.", zh: "我有一只猫。", emoji: "🐱" },
      { en: "My cat is fat.", zh: "我的猫胖胖的。", emoji: "🐈" },
      { en: "My cat can nap.", zh: "我的猫会打盹。", emoji: "😴" },
      { en: "My cat can sit.", zh: "我的猫会坐下。", emoji: "🪑" },
      { en: "My cat has a hat.", zh: "我的猫有一顶帽子。", emoji: "🎩" },
      { en: "The hat is red.", zh: "帽子是红色的。", emoji: "🔴" },
      { en: "My cat is sad.", zh: "我的猫有点难过。", emoji: "😿" },
      { en: "I hug my cat.", zh: "我抱抱我的猫。", emoji: "🤗" }
    ],
    quiz: [
      { q: "What do I have?", zh: "我有什么？", options: ["a cat", "a dog", "a fish"], answer: 0 },
      { q: "What color is the hat?", zh: "帽子是什么颜色？", options: ["blue", "green", "red"], answer: 2 },
      { q: "How do I help my sad cat?", zh: "我怎样安慰难过的小猫？", options: ["I run away.", "I hug my cat.", "I hide the hat."], answer: 1 }
    ]
  },
  {
    id: "r_mydog",
    title: "My Dog",
    titleZh: "我的狗",
    emoji: "🐶",
    grade: 1,
    level: "A",
    // 核心词：dog / big / run / dig / see / box / bone / nap
    pages: [
      { en: "I have a dog.", zh: "我有一只狗。", emoji: "🐶" },
      { en: "My dog is big.", zh: "我的狗很大。", emoji: "🐕" },
      { en: "My dog can run.", zh: "我的狗会跑。", emoji: "🏃" },
      { en: "My dog can dig.", zh: "我的狗会刨土。", emoji: "🕳️" },
      { en: "My dog sees a box.", zh: "我的狗看见一个盒子。", emoji: "📦" },
      { en: "The box has a bone.", zh: "盒子里有一根骨头。", emoji: "🦴" },
      { en: "My dog has the bone.", zh: "我的狗拿到了骨头。", emoji: "😄" },
      { en: "My dog can nap.", zh: "我的狗可以打盹啦。", emoji: "😴" }
    ],
    quiz: [
      { q: "What can my dog do?", zh: "我的狗会做什么？", options: ["run and dig", "read and write", "sing and dance"], answer: 0 },
      { q: "What is in the box?", zh: "盒子里有什么？", options: ["a ball", "a bone", "a hat"], answer: 1 },
      { q: "What does my dog do at the end?", zh: "最后我的狗做了什么？", options: ["It naps.", "It runs away.", "It digs a hole."], answer: 0 }
    ]
  },
  {
    id: "r_rainyday",
    title: "A Rainy Day",
    titleZh: "下雨天",
    emoji: "🌧️",
    grade: 1,
    level: "A",
    // 核心词：wet / day / rain / sad / get / hat / boots / jump / mud / sun / happy
    pages: [
      { en: "It is a wet day.", zh: "今天湿漉漉的。", emoji: "🌧️" },
      { en: "I see the rain.", zh: "我看见下雨了。", emoji: "☔" },
      { en: "I am sad.", zh: "我有点不开心。", emoji: "😞" },
      { en: "I get my hat.", zh: "我拿上我的帽子。", emoji: "🧢" },
      { en: "I get my boots.", zh: "我穿上我的雨靴。", emoji: "👢" },
      { en: "I jump in the mud.", zh: "我在泥坑里跳呀跳。", emoji: "💦" },
      { en: "The sun is up.", zh: "太阳出来啦。", emoji: "🌤️" },
      { en: "I am happy.", zh: "我好开心。", emoji: "😄" }
    ],
    quiz: [
      { q: "How is the weather at the start?", zh: "一开始天气怎么样？", options: ["rainy", "sunny", "snowy"], answer: 0 },
      { q: "What do I put on?", zh: "我穿戴了什么？", options: ["a coat and gloves", "a hat and boots", "a shirt and socks"], answer: 1 },
      { q: "Why am I happy at the end?", zh: "最后我为什么开心？", options: ["It rains more.", "I lose my hat.", "The sun comes up."], answer: 2 }
    ]
  },
  {
    id: "r_zoo",
    title: "At the Zoo",
    titleZh: "去动物园",
    emoji: "🦁",
    grade: 1,
    level: "A",
    // 核心词：go / zoo / see / big / lion / fat / pig / red / fox / bear / run / jump / happy
    pages: [
      { en: "We go to the zoo.", zh: "我们去动物园。", emoji: "🚌" },
      { en: "I see a big lion.", zh: "我看见一只大狮子。", emoji: "🦁" },
      { en: "I see a fat pig.", zh: "我看见一只胖小猪。", emoji: "🐷" },
      { en: "I see a red fox.", zh: "我看见一只红狐狸。", emoji: "🦊" },
      { en: "I see a big bear.", zh: "我看见一只大熊。", emoji: "🐻" },
      { en: "The bear can run.", zh: "大熊会跑。", emoji: "🐾" },
      { en: "The bear can jump.", zh: "大熊会跳。", emoji: "🤸" },
      { en: "We are happy.", zh: "我们很开心。", emoji: "😄" }
    ],
    quiz: [
      { q: "Where do we go?", zh: "我们去了哪里？", options: ["the zoo", "the park", "the school"], answer: 0 },
      { q: "Which animal is fat?", zh: "哪只动物胖胖的？", options: ["the lion", "the pig", "the fox"], answer: 1 },
      { q: "What can the bear do?", zh: "大熊会做什么？", options: ["It can run and jump.", "It can read books.", "It can cook rice."], answer: 0 }
    ]
  },
  {
    id: "r_family",
    title: "My Family",
    titleZh: "我的家人",
    emoji: "👪",
    grade: 1,
    level: "A",
    // 核心词：mom / dad / sister / brother / cook / help / sit / eat / love / family
    pages: [
      { en: "This is my mom.", zh: "这是我的妈妈。", emoji: "👩" },
      { en: "This is my dad.", zh: "这是我的爸爸。", emoji: "👨" },
      { en: "This is my sister.", zh: "这是我的姐姐。", emoji: "👧" },
      { en: "This is my brother.", zh: "这是我的弟弟。", emoji: "👦" },
      { en: "Mom can cook.", zh: "妈妈会做好吃的。", emoji: "🍳" },
      { en: "Dad can help.", zh: "爸爸会来帮忙。", emoji: "🤝" },
      { en: "We sit and eat.", zh: "我们坐下来一起吃饭。", emoji: "🍽️" },
      { en: "I love my family.", zh: "我爱我的家人。", emoji: "❤️" }
    ],
    quiz: [
      { q: "Who can cook?", zh: "谁很会做饭？", options: ["Mom", "Dad", "My sister"], answer: 0 },
      { q: "What do we do together?", zh: "我们一起做什么？", options: ["We run away.", "We sit and eat.", "We go to bed."], answer: 1 },
      { q: "How do I feel about my family?", zh: "我对家人的感觉是什么？", options: ["I love my family.", "I am sleepy.", "I am wet."], answer: 0 }
    ]
  },
  {
    id: "r_lunch",
    title: "My Lunch",
    titleZh: "好吃的午饭",
    emoji: "🍱",
    grade: 1,
    level: "A",
    // 核心词：hungry / lunch / time / get / box / see / egg / bun / apple / eat / up / full
    pages: [
      { en: "I am hungry.", zh: "我肚子饿啦。", emoji: "😋" },
      { en: "It is lunch time.", zh: "到午饭时间了。", emoji: "🕛" },
      { en: "I get my box.", zh: "我拿出我的饭盒。", emoji: "🍱" },
      { en: "I see an egg.", zh: "我看见一个鸡蛋。", emoji: "🥚" },
      { en: "I see a bun.", zh: "我看见一个小面包。", emoji: "🍞" },
      { en: "I see an apple.", zh: "我看见一个苹果。", emoji: "🍎" },
      { en: "I eat it up.", zh: "我把它们都吃光。", emoji: "🍽️" },
      { en: "I am full.", zh: "我吃饱啦。", emoji: "😊" }
    ],
    quiz: [
      { q: "How do I feel at the start?", zh: "一开始我感觉怎么样？", options: ["hungry", "full", "sleepy"], answer: 0 },
      { q: "What is NOT in my box?", zh: "我的饭盒里没有什么？", options: ["an egg", "a bun", "a cake"], answer: 2 },
      { q: "How do I feel after lunch?", zh: "吃完午饭后我感觉怎么样？", options: ["I am full.", "I am hungry.", "I am wet."], answer: 0 }
    ]
  },
  {
    id: "r_toys",
    title: "My Toys",
    titleZh: "我的玩具",
    emoji: "🧸",
    grade: 2,
    level: "B",
    // 核心词：box / toys / red / car / big / ball / little / bear / floor / mom / clean / room / put
    pages: [
      { en: "I have a box of toys.", zh: "我有一箱玩具。", emoji: "🧸" },
      { en: "I have a red car.", zh: "我有一辆红色小汽车。", emoji: "🚗" },
      { en: "I have a big ball.", zh: "我有一个大皮球。", emoji: "⚽" },
      { en: "I have a little bear.", zh: "我有一只小熊。", emoji: "🐻" },
      { en: "My toys are on the floor.", zh: "我的玩具在地上。", emoji: "🧹" },
      { en: "Mom says to clean up.", zh: "妈妈说，收拾一下吧。", emoji: "👩" },
      { en: "I put them in the box.", zh: "我把它们放进箱子里。", emoji: "📦" },
      { en: "My room is clean now.", zh: "我的房间现在很整洁。", emoji: "✨" }
    ],
    quiz: [
      { q: "What do I have?", zh: "我有什么？", options: ["a box of toys", "a box of books", "a bag of food"], answer: 0 },
      { q: "Where are my toys at first?", zh: "一开始我的玩具在哪里？", options: ["in the box", "on the floor", "on the bed"], answer: 1 },
      { q: "What does Mom say?", zh: "妈妈说了什么？", options: ["Go to bed.", "Eat your lunch.", "Clean up your toys."], answer: 2 }
    ]
  },
  {
    id: "r_count",
    title: "I Can Count",
    titleZh: "我会数数",
    emoji: "🔢",
    grade: 2,
    level: "B",
    // 核心词：count / ten / one-ten / cat / dog / fish / bird / bee / lot
    pages: [
      { en: "I can count to ten.", zh: "我能数到十。", emoji: "🔢" },
      { en: "One cat and two cats.", zh: "一只猫，两只猫。", emoji: "🐱" },
      { en: "Three dogs and four dogs.", zh: "三只狗，四只狗。", emoji: "🐶" },
      { en: "Five fish and six fish.", zh: "五条鱼，六条鱼。", emoji: "🐟" },
      { en: "Seven birds and eight birds.", zh: "七只鸟，八只鸟。", emoji: "🐦" },
      { en: "Nine bees and ten bees.", zh: "九只蜜蜂，十只蜜蜂。", emoji: "🐝" },
      { en: "Ten bees is a lot.", zh: "十只蜜蜂可真多呀。", emoji: "🔟" },
      { en: "I can count to ten!", zh: "我能数到十啦！", emoji: "🎉" }
    ],
    quiz: [
      { q: "How many cats are there?", zh: "一共有几只猫？", options: ["one and two", "three and four", "five and six"], answer: 0 },
      { q: "What comes after eight birds?", zh: "八只小鸟后面是什么？", options: ["ten fish", "nine bees", "seven dogs"], answer: 1 },
      { q: "How high can I count?", zh: "我能数到几？", options: ["to five", "to ten", "to three"], answer: 1 }
    ]
  },
  {
    id: "r_park",
    title: "To the Park",
    titleZh: "去公园",
    emoji: "🌳",
    grade: 2,
    level: "B",
    // 核心词：go / park / see / big / tree / run / grass / play / dog / sit / eat / snack / home / happy / now
    pages: [
      { en: "We go to the park.", zh: "我们去公园。", emoji: "🌳" },
      { en: "I see a big tree.", zh: "我看见一棵大树。", emoji: "🌲" },
      { en: "I run on the grass.", zh: "我在草地上跑。", emoji: "🌿" },
      { en: "I play with my dog.", zh: "我和我的狗一起玩。", emoji: "🐕" },
      { en: "My dog runs and jumps.", zh: "我的狗又跑又跳。", emoji: "🐾" },
      { en: "We sit on the grass.", zh: "我们坐在草地上。", emoji: "🧺" },
      { en: "We eat a good snack.", zh: "我们吃好吃的点心。", emoji: "🍎" },
      { en: "We go home happy now.", zh: "我们开开心心回家啦。", emoji: "🏠" }
    ],
    quiz: [
      { q: "Where do we go?", zh: "我们去了哪里？", options: ["the park", "the zoo", "the beach"], answer: 0 },
      { q: "Who plays with me?", zh: "谁和我一起玩？", options: ["my cat", "my dog", "my sister"], answer: 1 },
      { q: "What do we do on the grass?", zh: "我们在草地上做什么？", options: ["We swim.", "We sleep.", "We sit and eat a snack."], answer: 2 }
    ]
  },
  {
    id: "r_school",
    title: "My School",
    titleZh: "我的学校",
    emoji: "🏫",
    grade: 2,
    level: "B",
    // 核心词：this / my / new / school / teacher / kind / friends / read / books / sing / play / games / lunch / like / happy / place
    pages: [
      { en: "This is my new school.", zh: "这是我的新学校。", emoji: "🏫" },
      { en: "My teacher is very kind.", zh: "我的老师很亲切。", emoji: "🍎" },
      { en: "I have many good friends.", zh: "我有很多好朋友。", emoji: "👫" },
      { en: "We read fun books together.", zh: "我们一起读有趣的书。", emoji: "📚" },
      { en: "We sing and play games.", zh: "我们唱歌，还做游戏。", emoji: "🎵" },
      { en: "We eat our lunch together.", zh: "我们一起吃午饭。", emoji: "🍱" },
      { en: "I like my school now.", zh: "现在我喜欢我的学校啦。", emoji: "😊" },
      { en: "School is a happy place.", zh: "学校是个快乐的地方。", emoji: "🌟" }
    ],
    quiz: [
      { q: "How is my teacher?", zh: "我的老师怎么样？", options: ["very kind", "very big", "very tall"], answer: 0 },
      { q: "What do we do at school?", zh: "我们在学校做什么？", options: ["We cook dinner.", "We read, sing and play.", "We drive a bus."], answer: 1 },
      { q: "How do I feel about school now?", zh: "现在我觉得学校怎么样？", options: ["I feel sleepy there.", "I want to go home.", "I like it. It is a happy place."], answer: 2 }
    ]
  },
  {
    id: "r_seasons",
    title: "Four Seasons",
    titleZh: "四季",
    emoji: "🌸",
    grade: 2,
    level: "B",
    // 核心词：spring / warm / green / see / flowers / summer / hot / bright / swim / fall / cool / windy / leaves / winter / cold / white / love / seasons
    pages: [
      { en: "Spring is warm and green.", zh: "春天暖暖的，绿绿的。", emoji: "🌷" },
      { en: "I see flowers in spring.", zh: "春天里我看见花朵。", emoji: "🌸" },
      { en: "Summer is hot and bright.", zh: "夏天热热的，亮亮的。", emoji: "☀️" },
      { en: "I can swim in summer.", zh: "夏天我可以去游泳。", emoji: "🏊" },
      { en: "Fall is cool and windy.", zh: "秋天凉凉的，风轻轻的。", emoji: "🍂" },
      { en: "Leaves fall down in fall.", zh: "秋天叶子飘落下来。", emoji: "🍁" },
      { en: "Winter is cold and white.", zh: "冬天冷冷的，白白的。", emoji: "❄️" },
      { en: "I love all four seasons.", zh: "四个季节我都喜欢。", emoji: "❤️" }
    ],
    quiz: [
      { q: "What is spring like?", zh: "春天是什么样子的？", options: ["warm and green", "cold and white", "hot and bright"], answer: 0 },
      { q: "What can I do in summer?", zh: "夏天我可以做什么？", options: ["I can make a snowman.", "I can swim.", "I can pick leaves."], answer: 1 },
      { q: "What color is winter?", zh: "冬天是什么颜色的？", options: ["green", "yellow", "white"], answer: 2 }
    ]
  },
  {
    id: "r_birthday",
    title: "My Birthday",
    titleZh: "我的生日",
    emoji: "🎂",
    grade: 2,
    level: "B",
    // 核心词：today / birthday / party / six / years / old / mom / makes / cake / friends / come / home / sing / song / get / big / red / box / little / dog / best / day
    pages: [
      { en: "Today is my birthday party.", zh: "今天是我的生日派对。", emoji: "🎂" },
      { en: "I am six years old.", zh: "我六岁啦。", emoji: "🎈" },
      { en: "My mom makes a big cake.", zh: "妈妈做了一个大蛋糕。", emoji: "🍰" },
      { en: "My friends come to my home.", zh: "朋友们来到我家。", emoji: "🏠" },
      { en: "We sing a happy song.", zh: "我们唱一首快乐的歌。", emoji: "🎵" },
      { en: "I get a big red box.", zh: "我收到一个大红盒子。", emoji: "🎁" },
      { en: "It is a little dog!", zh: "里面是一只小狗！", emoji: "🐶" },
      { en: "This is my best day.", zh: "这是我最棒的一天。", emoji: "🥳" }
    ],
    quiz: [
      { q: "How old am I?", zh: "我几岁了？", options: ["six", "five", "seven"], answer: 0 },
      { q: "What does Mom make?", zh: "妈妈做了什么？", options: ["a red box", "a big cake", "a little dog"], answer: 1 },
      { q: "What is in the big red box?", zh: "大红盒子里是什么？", options: ["a cake", "a song", "a little dog"], answer: 2 }
    ]
  },
  {
    id: "r_transport",
    title: "Things That Go",
    titleZh: "交通工具",
    emoji: "🚌",
    grade: 2,
    level: "B",
    // 核心词：go / see / grandma / take / big / red / bus / down / street / little / blue / car / very / fast / long / green / train / sea / happy
    pages: [
      { en: "We go to see my grandma.", zh: "我们去看外婆。", emoji: "👵" },
      { en: "We take a big red bus.", zh: "我们坐一辆大红公交车。", emoji: "🚌" },
      { en: "The bus goes down the street.", zh: "公交车沿着街道开。", emoji: "🛣️" },
      { en: "We take a little blue car.", zh: "我们坐一辆蓝色小车。", emoji: "🚗" },
      { en: "The car goes very fast.", zh: "小车跑得飞快。", emoji: "💨" },
      { en: "We take a long green train.", zh: "我们坐一列长长的绿火车。", emoji: "🚂" },
      { en: "The train goes to the sea.", zh: "火车开到大海边。", emoji: "🌊" },
      { en: "Grandma is happy to see us.", zh: "外婆见到我们真开心。", emoji: "🤗" }
    ],
    quiz: [
      { q: "Who do we go to see?", zh: "我们去看谁？", options: ["my grandma", "my teacher", "my friend"], answer: 0 },
      { q: "Which one is little and blue?", zh: "哪一个是蓝色的小小的？", options: ["the bus", "the car", "the train"], answer: 1 },
      { q: "Where does the train go?", zh: "火车开到哪里？", options: ["to the school", "to the park", "to the sea"], answer: 2 }
    ]
  },
  {
    id: "r_colors",
    title: "The World of Colors",
    titleZh: "颜色世界",
    emoji: "🌈",
    grade: 3,
    level: "C",
    // 核心词：world / colors / sky / blue / grass / green / sun / yellow / bright / red / pink / mix / white / make / box / draw / rainbow / happy
    pages: [
      { en: "The world is full of many pretty colors.", zh: "这个世界到处都是漂亮的颜色。", emoji: "🌈" },
      { en: "The sky is blue, and the grass is green.", zh: "天空是蓝色的，草地是绿色的。", emoji: "☁️" },
      { en: "The sun is yellow, and it is very bright.", zh: "太阳是黄色的，非常明亮。", emoji: "☀️" },
      { en: "My favorite color is red, but my sister likes pink.", zh: "我最喜欢红色，但妹妹喜欢粉色。", emoji: "❤️" },
      { en: "We mix blue and yellow to make green.", zh: "我们把蓝色和黄色调成绿色。", emoji: "🎨" },
      { en: "We mix red and white to make pink.", zh: "我们把红色和白色调成粉色。", emoji: "🌸" },
      { en: "Now we have a big box of pretty colors.", zh: "现在我们有一大盒漂亮的颜色。", emoji: "🖍️" },
      { en: "We draw a rainbow, because colors make us happy.", zh: "我们画一道彩虹，因为颜色让我们快乐。", emoji: "🌟" }
    ],
    quiz: [
      { q: "What color is the grass?", zh: "草是什么颜色？", options: ["blue", "green", "yellow"], answer: 1 },
      { q: "What do we get when we mix blue and yellow?", zh: "蓝色和黄色调在一起会变成什么颜色？", options: ["green", "pink", "red"], answer: 0 },
      { q: "Why do we draw a rainbow?", zh: "我们为什么画彩虹？", options: ["Because it is rainy.", "Because colors make us happy.", "Because we are tired."], answer: 1 }
    ]
  },
  {
    id: "r_myday",
    title: "My Day",
    titleZh: "我的一天",
    emoji: "🌅",
    grade: 3,
    level: "C",
    // 核心词：wake / morning / wash / brush / breakfast / family / school / learn / noon / lunch / friends / outside / tired / evening / read / bed / nine / tomorrow
    pages: [
      { en: "I wake up early in the morning, and I am happy.", zh: "我早上早早醒来，心情很好。", emoji: "🌅" },
      { en: "I wash my face and brush my teeth.", zh: "我洗脸，刷牙。", emoji: "🪥" },
      { en: "I eat breakfast with my family at seven.", zh: "七点我和家人一起吃早饭。", emoji: "🥣" },
      { en: "I go to school and learn many new things.", zh: "我去学校，学到很多新东西。", emoji: "🏫" },
      { en: "At noon, I eat lunch with my good friends.", zh: "中午我和好朋友们一起吃午饭。", emoji: "🍱" },
      { en: "After school, I am tired, but I play with my dog.", zh: "放学后我有点累，但还是和我的狗一起玩。", emoji: "🐕" },
      { en: "In the evening, I read a book with my mom.", zh: "晚上，我和妈妈一起看书。", emoji: "📖" },
      { en: "I go to bed at nine, because tomorrow is a new day.", zh: "我九点就上床睡觉，因为明天又是新的一天。", emoji: "🌙" }
    ],
    quiz: [
      { q: "What do I do in the morning?", zh: "早上我做什么？", options: ["I wash my face and brush my teeth.", "I read a book.", "I go to bed."], answer: 0 },
      { q: "Who do I play with after school?", zh: "放学后我和谁一起玩？", options: ["my teacher", "my dog", "my friends"], answer: 1 },
      { q: "Why do I go to bed at nine?", zh: "我为什么九点就上床睡觉？", options: ["Because I am hungry.", "Because it is rainy.", "Because tomorrow is a new day."], answer: 2 }
    ]
  },
  {
    id: "r_goodnight",
    title: "Goodnight, Moon",
    titleZh: "晚安月亮",
    emoji: "🌙",
    grade: 3,
    level: "C",
    // 核心词：moon / high / dark / sky / stars / twinkling / night / quiet / soft / pajamas / teddy bear / story / brave / rabbit / warm / milk / sleepy / song / eyes / goodnight / close
    pages: [
      { en: "The moon is high in the dark sky.", zh: "月亮高高挂在天上。", emoji: "🌙" },
      { en: "The stars are twinkling, and the night is quiet.", zh: "星星眨着眼睛，夜里安安静静。", emoji: "⭐" },
      { en: "I put on my soft pajamas and hug my teddy bear.", zh: "我穿上软软的睡衣，抱抱我的小熊。", emoji: "🧸" },
      { en: "Mom reads me a story about a brave little rabbit.", zh: "妈妈给我读一个勇敢小兔子的故事。", emoji: "📖" },
      { en: "I drink some warm milk, but I am still not sleepy.", zh: "我喝了一点温牛奶，可我还是不困。", emoji: "🥛" },
      { en: "Mom sings a soft song, and my eyes get heavy.", zh: "妈妈轻轻唱歌，我的眼睛慢慢睁不开了。", emoji: "🎵" },
      { en: "I say goodnight to the moon and the stars.", zh: "我对月亮和星星说晚安。", emoji: "🌜" },
      { en: "I close my eyes, because tomorrow will be a happy day.", zh: "我闭上眼睛，因为明天会是快乐的一天。", emoji: "😴" }
    ],
    quiz: [
      { q: "What is in the dark sky?", zh: "黑黑的天空里有什么？", options: ["the sun", "the moon", "a kite"], answer: 1 },
      { q: "What does Mom read to me?", zh: "妈妈给我读了什么？", options: ["a story about a rabbit", "a book about cars", "a song about the sea"], answer: 0 },
      { q: "Why do I close my eyes?", zh: "我为什么闭上眼睛？", options: ["Because I am hungry.", "Because it is morning.", "Because tomorrow will be a happy day."], answer: 2 }
    ]
  },
  {
    id: "r_farm",
    title: "A Day on the Farm",
    titleZh: "农场的一天",
    emoji: "🚜",
    grade: 3,
    level: "C",
    // 核心词：grandpa / farm / hills / rooster / wakes / cows / grass / hens / feed / pigs / sheep / soft / goats / playful / pick / apples / basket / tractor / field / tired / happy / fun
    pages: [
      { en: "My grandpa has a big farm near the green hills.", zh: "爷爷在绿色的山脚下有一个大农场。", emoji: "🌻" },
      { en: "Every morning, the rooster wakes us up with a loud song.", zh: "每天早晨，公鸡用响亮的歌声叫醒我们。", emoji: "🐓" },
      { en: "The cows eat grass, and the hens look for food.", zh: "奶牛吃草，母鸡找食吃。", emoji: "🐄" },
      { en: "I help my grandpa feed the hungry little pigs.", zh: "我帮爷爷喂饿肚子的小猪。", emoji: "🐷" },
      { en: "The sheep are soft, but the goats are very playful.", zh: "绵羊软软的，但山羊特别爱玩闹。", emoji: "🐑" },
      { en: "We pick red apples and put them in a big basket.", zh: "我们摘红苹果，放进大篮子里。", emoji: "🍎" },
      { en: "In the afternoon, we ride a slow tractor to the field.", zh: "下午我们坐着慢悠悠的拖拉机去田里。", emoji: "🌾" },
      { en: "I am tired, but I am happy, because the farm is fun.", zh: "我有点累，但很开心，因为农场太好玩了。", emoji: "🌟" }
    ],
    quiz: [
      { q: "Who wakes us up in the morning?", zh: "早上谁叫我们起床？", options: ["the cows", "the rooster", "the goats"], answer: 1 },
      { q: "What do we pick?", zh: "我们摘了什么？", options: ["red apples", "green leaves", "yellow flowers"], answer: 0 },
      { q: "How do I feel at the end of the day?", zh: "一天结束时我感觉怎么样？", options: ["sad and cold", "hungry and angry", "tired but happy"], answer: 2 }
    ]
  },
  {
    id: "r_beach",
    title: "At the Beach",
    titleZh: "海边",
    emoji: "🏖️",
    grade: 3,
    level: "C",
    // 核心词：family / beach / sand / warm / sea / blue / build / sand castle / sister / shells / wave / knocks / again / bigger / sun / down / tired / favorite / place
    pages: [
      { en: "Today my family and I go to the beach.", zh: "今天我和家人去海边。", emoji: "🏖️" },
      { en: "The sand is warm, and the sea is very blue.", zh: "沙子暖暖的，大海蓝蓝的。", emoji: "🌊" },
      { en: "I build a big sand castle with my little sister.", zh: "我和妹妹一起堆一个大沙堡。", emoji: "🏰" },
      { en: "We look for shells, but we cannot find any.", zh: "我们找贝壳，可是一个也没找到。", emoji: "🐚" },
      { en: "A big wave comes, and it knocks down our castle.", zh: "一个大浪打来，把我们的城堡冲倒了。", emoji: "💦" },
      { en: "I am sad, but mom says we can build again.", zh: "我有点难过，但妈妈说我们可以再堆一次。", emoji: "😢" },
      { en: "We build a bigger castle, and the sun goes down.", zh: "我们堆了一个更大的城堡，太阳慢慢落下来。", emoji: "⛱️" },
      { en: "I am tired and happy, because the beach is my favorite place.", zh: "我又累又开心，因为海边是我最喜欢的地方。", emoji: "🌅" }
    ],
    quiz: [
      { q: "Who do I build a castle with?", zh: "我和谁一起堆城堡？", options: ["my little sister", "my teacher", "my dog"], answer: 0 },
      { q: "What knocks down our castle?", zh: "什么冲倒了我们的城堡？", options: ["a big dog", "a big wave", "a strong wind"], answer: 1 },
      { q: "Why am I happy at the end?", zh: "最后我为什么开心？", options: ["Because we go home.", "Because it is raining.", "Because the beach is my favorite place."], answer: 2 }
    ]
  },
  {
    id: "r_body",
    title: "My Body",
    titleZh: "我的身体",
    emoji: "👀",
    grade: 3,
    level: "C",
    // 核心词：eyes / see / sky / ears / hear / birds / nose / smell / sweet / flowers / mouth / taste / yummy / hands / draw / picture / legs / run / faster / warm / heart / love / body / great
    pages: [
      { en: "I have two eyes, and I can see the blue sky.", zh: "我有两只眼睛，我能看见蓝蓝的天空。", emoji: "👀" },
      { en: "I have two ears, and I can hear the birds sing.", zh: "我有两只耳朵，我能听见小鸟唱歌。", emoji: "👂" },
      { en: "I have a nose, and I can smell the sweet flowers.", zh: "我有一个鼻子，我能闻到香香的花。", emoji: "👃" },
      { en: "I have a mouth, and I can taste my yummy lunch.", zh: "我有一张嘴巴，我能尝到好吃的午饭。", emoji: "👄" },
      { en: "I have two hands, and I can draw a big picture.", zh: "我有两只手，我能画一幅大大的画。", emoji: "✋" },
      { en: "I have two legs, but my dog runs faster than me.", zh: "我有两条腿，不过我的狗跑得比我还快。", emoji: "🦵" },
      { en: "I have a warm heart, because I love my family.", zh: "我有一颗暖暖的心，因为我爱我的家人。", emoji: "❤️" },
      { en: "My body is great, and I can do many things!", zh: "我的身体真棒，我能做很多事情！", emoji: "🎉" }
    ],
    quiz: [
      { q: "What can I do with my eyes?", zh: "我可以用眼睛做什么？", options: ["see the blue sky", "hear the birds", "smell the flowers"], answer: 0 },
      { q: "What can I do with my nose?", zh: "我可以用鼻子做什么？", options: ["draw a picture", "smell the sweet flowers", "run very fast"], answer: 1 },
      { q: "Why do I have a warm heart?", zh: "我为什么有一颗暖暖的心？", options: ["Because I am hungry.", "Because it is cold.", "Because I love my family."], answer: 2 }
    ]
  },
  {
    id: "r_bone",
    title: "The Dog Finds a Bone",
    titleZh: "小狗找骨头",
    emoji: "🦴",
    grade: 3,
    level: "C",
    // 核心词：sunny / morning / little dog / finds / big bone / happy / loves / takes / walks / park / water / another / bigger / wants / opens / mouth / bark / falls / shadow / learns
    pages: [
      { en: "One sunny morning, a little dog finds a big bone.", zh: "一个晴朗的早晨，小狗找到一根大骨头。", emoji: "🦴" },
      { en: "He is very happy, because he loves bones.", zh: "他非常开心，因为他最爱骨头了。", emoji: "😊" },
      { en: "He takes the bone and walks to the park.", zh: "他叼着骨头，走去公园。", emoji: "🐕" },
      { en: "On the way, he sees another dog in the water.", zh: "路上，他看见水里还有一只狗。", emoji: "💧" },
      { en: "The other dog has a bigger bone, and he wants it too.", zh: "那只狗的骨头更大，他也想要。", emoji: "🐶" },
      { en: "He opens his mouth to bark, but his bone falls down.", zh: "他张开嘴想叫一声，骨头却掉下去了。", emoji: "😮" },
      { en: "The other dog is only his shadow in the water.", zh: "原来那只狗只是他在水里的影子。", emoji: "🌊" },
      { en: "He learns to be happy with what he has.", zh: "他懂得了：要为自己拥有的感到快乐。", emoji: "🌟" }
    ],
    quiz: [
      { q: "What does the little dog find?", zh: "小狗找到了什么？", options: ["a big bone", "a red ball", "a small cat"], answer: 0 },
      { q: "Who is the other dog in the water?", zh: "水里的另一只狗是谁？", options: ["his friend", "his shadow", "his brother"], answer: 1 },
      { q: "What does the dog learn?", zh: "小狗明白了什么？", options: ["Bones are not good.", "Water is scary.", "Be happy with what you have."], answer: 2 }
    ]
  }
];