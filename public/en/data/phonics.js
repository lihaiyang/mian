// 字母与拼读数据 —— window.EN_LETTERS / window.EN_PHONICS
// 字段严格遵循 en/CONTRACT.md 第 1.2 节；本文件是纯数据，不含逻辑。
// EN_LETTERS：26 个字母。name 是字母名的读音提示（给语音合成读，A → ay）；
//             sound 是这个字母最常见的发音（IPA）；words 是 3 个以该字母开头的简单小写单词。
// EN_PHONICS：30 关，顺序为 短元音 5 → 辅音组合 4 → 词尾组合 4 → 二合字母 6 → 元音组合 7 → 魔法 e 4；
//             每关 4 个拼读词，blocks 拼起来必须等于 word；grade：1-15 关为 1，16-25 关为 2，26-30 关为 3。

window.EN_LETTERS = [
  {
    letter: "A",
    lower: "a",
    name: "ay",
    sound: "/æ/",
    emoji: "🍎",
    words: ["apple", "ant", "ax"],
    zh: "苹果 / 蚂蚁 / 斧头"
  },
  {
    letter: "B",
    lower: "b",
    name: "bee",
    sound: "/b/",
    emoji: "🐻",
    words: ["bear", "ball", "bus"],
    zh: "熊 / 球 / 公共汽车"
  },
  {
    letter: "C",
    lower: "c",
    name: "see",
    sound: "/k/",
    emoji: "🐱",
    words: ["cat", "cup", "car"],
    zh: "猫 / 杯子 / 小汽车"
  },
  {
    letter: "D",
    lower: "d",
    name: "dee",
    sound: "/d/",
    emoji: "🐶",
    words: ["dog", "duck", "door"],
    zh: "狗 / 鸭子 / 门"
  },
  {
    letter: "E",
    lower: "e",
    name: "ee",
    sound: "/e/",
    emoji: "🥚",
    words: ["egg", "elephant", "elf"],
    zh: "鸡蛋 / 大象 / 小精灵"
  },
  {
    letter: "F",
    lower: "f",
    name: "ef",
    sound: "/f/",
    emoji: "🐟",
    words: ["fish", "fox", "fan"],
    zh: "鱼 / 狐狸 / 扇子"
  },
  {
    letter: "G",
    lower: "g",
    name: "jee",
    sound: "/g/",
    emoji: "🐐",
    words: ["goat", "gate", "gum"],
    zh: "山羊 / 大门 / 口香糖"
  },
  {
    letter: "H",
    lower: "h",
    name: "aitch",
    sound: "/h/",
    emoji: "🎩",
    words: ["hat", "hand", "house"],
    zh: "帽子 / 手 / 房子"
  },
  {
    letter: "I",
    lower: "i",
    name: "eye",
    sound: "/ɪ/",
    emoji: "🍦",
    words: ["ink", "igloo", "insect"],
    zh: "墨水 / 冰屋 / 小虫"
  },
  {
    letter: "J",
    lower: "j",
    name: "jay",
    sound: "/dʒ/",
    emoji: "🧃",
    words: ["jam", "jet", "jump"],
    zh: "果酱 / 喷气机 / 跳"
  },
  {
    letter: "K",
    lower: "k",
    name: "kay",
    sound: "/k/",
    emoji: "🔑",
    words: ["key", "kite", "king"],
    zh: "钥匙 / 风筝 / 国王"
  },
  {
    letter: "L",
    lower: "l",
    name: "el",
    sound: "/l/",
    emoji: "🦁",
    words: ["lion", "leg", "leaf"],
    zh: "狮子 / 腿 / 叶子"
  },
  {
    letter: "M",
    lower: "m",
    name: "em",
    sound: "/m/",
    emoji: "🌙",
    words: ["moon", "map", "milk"],
    zh: "月亮 / 地图 / 牛奶"
  },
  {
    letter: "N",
    lower: "n",
    name: "en",
    sound: "/n/",
    emoji: "🥜",
    words: ["net", "nose", "nest"],
    zh: "网 / 鼻子 / 鸟巢"
  },
  {
    letter: "O",
    lower: "o",
    name: "oh",
    sound: "/ɒ/",
    emoji: "🐙",
    words: ["ox", "octopus", "olive"],
    zh: "公牛 / 章鱼 / 橄榄"
  },
  {
    letter: "P",
    lower: "p",
    name: "pee",
    sound: "/p/",
    emoji: "🐷",
    words: ["pig", "pen", "panda"],
    zh: "猪 / 钢笔 / 熊猫"
  },
  {
    letter: "Q",
    lower: "q",
    name: "cue",
    sound: "/kw/",
    emoji: "👑",
    words: ["queen", "quilt", "quiz"],
    zh: "女王 / 被子 / 小测验"
  },
  {
    letter: "R",
    lower: "r",
    name: "ar",
    sound: "/r/",
    emoji: "🌈",
    words: ["red", "rabbit", "rain"],
    zh: "红色 / 兔子 / 雨"
  },
  {
    letter: "S",
    lower: "s",
    name: "es",
    sound: "/s/",
    emoji: "☀️",
    words: ["sun", "sock", "star"],
    zh: "太阳 / 袜子 / 星星"
  },
  {
    letter: "T",
    lower: "t",
    name: "tee",
    sound: "/t/",
    emoji: "🐯",
    words: ["tiger", "top", "tree"],
    zh: "老虎 / 陀螺 / 树"
  },
  {
    letter: "U",
    lower: "u",
    name: "you",
    sound: "/ʌ/",
    emoji: "☂️",
    words: ["umbrella", "up", "us"],
    zh: "雨伞 / 向上 / 我们"
  },
  {
    letter: "V",
    lower: "v",
    name: "vee",
    sound: "/v/",
    emoji: "🎻",
    words: ["van", "vest", "violin"],
    zh: "面包车 / 背心 / 小提琴"
  },
  {
    letter: "W",
    lower: "w",
    name: "double-u",
    sound: "/w/",
    emoji: "💧",
    words: ["water", "web", "wind"],
    zh: "水 / 蜘蛛网 / 风"
  },
  {
    letter: "X",
    lower: "x",
    name: "ex",
    sound: "/ks/",
    emoji: "🎹",
    words: ["xylophone", "xray", "xmas"],
    zh: "木琴 / X 光片 / 圣诞节"
  },
  {
    letter: "Y",
    lower: "y",
    name: "why",
    sound: "/j/",
    emoji: "🪀",
    words: ["yak", "yoyo", "yam"],
    zh: "牦牛 / 悠悠球 / 山药"
  },
  {
    letter: "Z",
    lower: "z",
    name: "zee",
    sound: "/z/",
    emoji: "🦓",
    words: ["zebra", "zoo", "zip"],
    zh: "斑马 / 动物园 / 拉链"
  }
];

window.EN_PHONICS = [
  // ---- ① 短元音 5 关：a / e / i / o / u 的 CVC 词 ----
  {
    id: "ph_cvc_a",
    unit: "短元音",
    title: "a 的短音 /æ/",
    emoji: "🐱",
    grade: 1,
    teach: [
      "a 夹在两个辅音中间时，读短音 /æ/，嘴巴要张大。",
      "试着把 c-a-t 三个音连起来：/k/ /æ/ /t/ → cat。",
      "连得快一点，就是 cat 啦。"
    ],
    blends: [
      {
        word: "cat",
        blocks: ["c", "a", "t"],
        emoji: "🐱"
      },
      {
        word: "hat",
        blocks: ["h", "a", "t"],
        emoji: "🎩"
      },
      {
        word: "bag",
        blocks: ["b", "a", "g"],
        emoji: "🎒"
      },
      {
        word: "map",
        blocks: ["m", "a", "p"],
        emoji: "🗺️"
      }
    ],
    tip: "三个音要连起来读，中间不要停。"
  },
  {
    id: "ph_cvc_e",
    unit: "短元音",
    title: "e 的短音 /e/",
    emoji: "🛏️",
    grade: 1,
    teach: [
      "e 在词中间时读短音 /e/，嘴巴扁扁地笑一笑。",
      "p-e-n 连起来：/p/ /e/ /n/ → pen。",
      "多读几遍，嘴巴就记住啦。"
    ],
    blends: [
      {
        word: "pen",
        blocks: ["p", "e", "n"],
        emoji: "🖊️"
      },
      {
        word: "bed",
        blocks: ["b", "e", "d"],
        emoji: "🛏️"
      },
      {
        word: "hen",
        blocks: ["h", "e", "n"],
        emoji: "🐔"
      },
      {
        word: "red",
        blocks: ["r", "e", "d"],
        emoji: "🟥"
      }
    ],
    tip: "/e/ 的声音短短的，不要拖长。"
  },
  {
    id: "ph_cvc_i",
    unit: "短元音",
    title: "i 的短音 /ɪ/",
    emoji: "🐷",
    grade: 1,
    teach: [
      "i 在词中间时读短音 /ɪ/，嘴角轻轻往两边拉。",
      "p-i-g 连起来：/p/ /ɪ/ /g/ → pig。",
      "短音 /ɪ/ 又轻又快，很好听。"
    ],
    blends: [
      {
        word: "pig",
        blocks: ["p", "i", "g"],
        emoji: "🐷"
      },
      {
        word: "six",
        blocks: ["s", "i", "x"],
        emoji: "6️⃣"
      },
      {
        word: "fish",
        blocks: ["f", "i", "sh"],
        emoji: "🐟"
      },
      {
        word: "sit",
        blocks: ["s", "i", "t"],
        emoji: "🪑"
      }
    ],
    tip: "/ɪ/ 别读成长音 /iː/，短短的就好。"
  },
  {
    id: "ph_cvc_o",
    unit: "短元音",
    title: "o 的短音 /ɒ/",
    emoji: "🐶",
    grade: 1,
    teach: [
      "o 在词中间时读短音 /ɒ/，嘴巴圆圆地张开一点。",
      "d-o-g 连起来：/d/ /ɒ/ /g/ → dog。",
      "跟小狗打个招呼：dog！"
    ],
    blends: [
      {
        word: "dog",
        blocks: ["d", "o", "g"],
        emoji: "🐶"
      },
      {
        word: "box",
        blocks: ["b", "o", "x"],
        emoji: "📦"
      },
      {
        word: "hot",
        blocks: ["h", "o", "t"],
        emoji: "🔥"
      },
      {
        word: "mop",
        blocks: ["m", "o", "p"],
        emoji: "🧹"
      }
    ],
    tip: "嘴形圆圆，声音短短的。"
  },
  {
    id: "ph_cvc_u",
    unit: "短元音",
    title: "u 的短音 /ʌ/",
    emoji: "🚌",
    grade: 1,
    teach: [
      "u 在词中间时读短音 /ʌ/，像轻轻地说一声“啊”。",
      "b-u-s 连起来：/b/ /ʌ/ /s/ → bus。",
      "校车来啦，一起说 bus！"
    ],
    blends: [
      {
        word: "bus",
        blocks: ["b", "u", "s"],
        emoji: "🚌"
      },
      {
        word: "cup",
        blocks: ["c", "u", "p"],
        emoji: "☕"
      },
      {
        word: "sun",
        blocks: ["s", "u", "n"],
        emoji: "☀️"
      },
      {
        word: "bug",
        blocks: ["b", "u", "g"],
        emoji: "🐛"
      }
    ],
    tip: "/ʌ/ 不用张大嘴，轻松一点读。"
  },

  // ---- ② 辅音组合 4 关：bl/cl/fl、br/cr/dr、sm/sn/st、sh/ch ----
  {
    id: "ph_blend_l",
    unit: "辅音组合",
    title: "bl / cl / fl 开头",
    emoji: "💙",
    grade: 1,
    teach: [
      "两个辅音挨在一起开头时，要一口气读出来。",
      "blue 先读 /bl/，再加 /uː/ → blue。",
      "中间的 /l/ 别丢掉，轻轻带过去。"
    ],
    blends: [
      {
        word: "blue",
        blocks: ["b", "l", "ue"],
        emoji: "💙"
      },
      {
        word: "flag",
        blocks: ["f", "l", "a", "g"],
        emoji: "🚩"
      },
      {
        word: "clap",
        blocks: ["c", "l", "a", "p"],
        emoji: "👏"
      },
      {
        word: "clock",
        blocks: ["c", "l", "o", "ck"],
        emoji: "🕐"
      }
    ],
    tip: "读 /bl/ 时嘴巴先闭上再打开。"
  },
  {
    id: "ph_blend_r",
    unit: "辅音组合",
    title: "br / cr / dr 开头",
    emoji: "🦀",
    grade: 1,
    teach: ["br、cr、dr 也都是两个音贴在一起。", "crab：/kr/ + /æb/ → crab，像小螃蟹横着走。", "先慢慢读，再快一点点。"],
    blends: [
      {
        word: "crab",
        blocks: ["c", "r", "a", "b"],
        emoji: "🦀"
      },
      {
        word: "drum",
        blocks: ["d", "r", "u", "m"],
        emoji: "🥁"
      },
      {
        word: "dress",
        blocks: ["d", "r", "e", "ss"],
        emoji: "👗"
      },
      {
        word: "bread",
        blocks: ["b", "r", "ea", "d"],
        emoji: "🍞"
      }
    ],
    tip: "不要读成 c-r-ab 三段，要连成 /kr/。"
  },
  {
    id: "ph_blend_s",
    unit: "辅音组合",
    title: "sm / sn / st 开头",
    emoji: "⭐",
    grade: 1,
    teach: ["s 和后面的辅音要贴在一起读。", "star：/st/ + /ɑːr/ → star。", "snake 的 /sn/ 像小蛇“嘶”的一声。"],
    blends: [
      {
        word: "snake",
        blocks: ["s", "n", "a", "ke"],
        emoji: "🐍"
      },
      {
        word: "star",
        blocks: ["s", "t", "a", "r"],
        emoji: "⭐"
      },
      {
        word: "smile",
        blocks: ["s", "m", "i", "le"],
        emoji: "😊"
      },
      {
        word: "stop",
        blocks: ["s", "t", "o", "p"],
        emoji: "✋"
      }
    ],
    tip: "/s/ 读得轻一点，后面的音要跟上。"
  },
  {
    id: "ph_blend_sh",
    unit: "辅音组合",
    title: "sh / ch 开头",
    emoji: "🚢",
    grade: 1,
    teach: [
      "sh 读 /ʃ/，像请别人安静：嘘——",
      "ch 读 /tʃ/，像小火车：切克切克。",
      "ship 是 /ʃ/ 开头，chair 是 /tʃ/ 开头。"
    ],
    blends: [
      {
        word: "ship",
        blocks: ["sh", "i", "p"],
        emoji: "🚢"
      },
      {
        word: "shoe",
        blocks: ["sh", "oe"],
        emoji: "👟"
      },
      {
        word: "chair",
        blocks: ["ch", "air"],
        emoji: "🪑"
      },
      {
        word: "cheese",
        blocks: ["ch", "ee", "se"],
        emoji: "🧀"
      }
    ],
    tip: "读 /ʃ/ 时嘴巴往前撅一点点。"
  },

  // ---- ③ 词尾组合 4 关：-at/-an、-ed/-en、-ig/-in、-ot/-op ----
  {
    id: "ph_end_at",
    unit: "词尾组合",
    title: "-at / -an 词族",
    emoji: "🦇",
    grade: 1,
    teach: ["很多词的尾巴是一样的，换掉第一个音就是新词。", "b-at 是 bat，r-at 是 rat。", "会读一个，就会读一串！"],
    blends: [
      {
        word: "bat",
        blocks: ["b", "a", "t"],
        emoji: "🦇"
      },
      {
        word: "rat",
        blocks: ["r", "a", "t"],
        emoji: "🐀"
      },
      {
        word: "pan",
        blocks: ["p", "a", "n"],
        emoji: "🍳"
      },
      {
        word: "van",
        blocks: ["v", "a", "n"],
        emoji: "🚐"
      }
    ],
    tip: "先读词尾 -at，再加上前面的音。"
  },
  {
    id: "ph_end_en",
    unit: "词尾组合",
    title: "-ed / -en 词族",
    emoji: "🔟",
    grade: 1,
    teach: ["-ed 和 -en 也是很常见的词尾。", "b-ed 是 bed，t-en 是 ten。", "换一个开头音，就多认识一个词。"],
    blends: [
      {
        word: "pen",
        blocks: ["p", "e", "n"],
        emoji: "🖊️"
      },
      {
        word: "ten",
        blocks: ["t", "e", "n"],
        emoji: "🔟"
      },
      {
        word: "hen",
        blocks: ["h", "e", "n"],
        emoji: "🐔"
      },
      {
        word: "bed",
        blocks: ["b", "e", "d"],
        emoji: "🛏️"
      }
    ],
    tip: "-en 里的 e 读短音 /e/，别读成字母名。"
  },
  {
    id: "ph_end_in",
    unit: "词尾组合",
    title: "-ig / -in 词族",
    emoji: "🐷",
    grade: 1,
    teach: ["-ig 和 -in 里都是短音 /ɪ/。", "p-ig 是 pig，p-in 是 pin。", "读的时候 /ɪ/ 要短短的。"],
    blends: [
      {
        word: "pig",
        blocks: ["p", "i", "g"],
        emoji: "🐷"
      },
      {
        word: "big",
        blocks: ["b", "i", "g"],
        emoji: "🐘"
      },
      {
        word: "pin",
        blocks: ["p", "i", "n"],
        emoji: "📌"
      },
      {
        word: "win",
        blocks: ["w", "i", "n"],
        emoji: "🏆"
      }
    ],
    tip: "元音要短，别拖成长音。"
  },
  {
    id: "ph_end_op",
    unit: "词尾组合",
    title: "-ot / -op 词族",
    emoji: "🍲",
    grade: 1,
    teach: ["-ot 和 -op 里都是短音 /ɒ/。", "h-ot 是 hot，t-op 是 top。", "一口气读下来，中间不要停。"],
    blends: [
      {
        word: "pot",
        blocks: ["p", "o", "t"],
        emoji: "🍲"
      },
      {
        word: "hot",
        blocks: ["h", "o", "t"],
        emoji: "🔥"
      },
      {
        word: "mop",
        blocks: ["m", "o", "p"],
        emoji: "🧹"
      },
      {
        word: "top",
        blocks: ["t", "o", "p"],
        emoji: "🔝"
      }
    ],
    tip: "词尾的 t 和 p 要轻轻收住。"
  },

  // ---- ④ 二合字母 6 关：sh、ch、th、wh、ck、ng ----
  {
    id: "ph_di_sh",
    unit: "二合字母",
    title: "sh 的 /ʃ/",
    emoji: "🐟",
    grade: 1,
    teach: ["s 和 h 手拉手，只发一个音 /ʃ/。", "fish 的尾巴就是 sh，读 /fɪʃ/。", "看到 sh 就撅起小嘴：嘘——"],
    blends: [
      {
        word: "fish",
        blocks: ["f", "i", "sh"],
        emoji: "🐟"
      },
      {
        word: "ship",
        blocks: ["sh", "i", "p"],
        emoji: "🚢"
      },
      {
        word: "shop",
        blocks: ["sh", "o", "p"],
        emoji: "🏪"
      },
      {
        word: "brush",
        blocks: ["b", "r", "u", "sh"],
        emoji: "🖌️"
      }
    ],
    tip: "sh 是一个音，不能拆成 /s/ 和 /h/。"
  },
  {
    id: "ph_di_ch",
    unit: "二合字母",
    title: "ch 的 /tʃ/",
    emoji: "🧀",
    grade: 1,
    teach: ["c 和 h 手拉手，读 /tʃ/。", "chair 是 /tʃ/ 开头，lunch 是 /tʃ/ 结尾。", "像小火车一样：切、切、切。"],
    blends: [
      {
        word: "chair",
        blocks: ["ch", "air"],
        emoji: "🪑"
      },
      {
        word: "cheese",
        blocks: ["ch", "ee", "se"],
        emoji: "🧀"
      },
      {
        word: "lunch",
        blocks: ["l", "u", "n", "ch"],
        emoji: "🍱"
      },
      {
        word: "chick",
        blocks: ["ch", "i", "ck"],
        emoji: "🐤"
      }
    ],
    tip: "ch 是一个音，不要读成 /k/ 加 /h/。"
  },
  {
    id: "ph_di_th",
    unit: "二合字母",
    title: "th 的 /θ/ 和 /ð/",
    emoji: "👍",
    grade: 2,
    teach: ["读 th 时，舌尖轻轻放在上下牙之间。", "three 是轻轻的 /θ/，this 是带震动的 /ð/。", "多读几遍，舌尖会越来越灵活。"],
    blends: [
      {
        word: "three",
        blocks: ["th", "r", "ee"],
        emoji: "3️⃣"
      },
      {
        word: "thumb",
        blocks: ["th", "u", "mb"],
        emoji: "👍"
      },
      {
        word: "bath",
        blocks: ["b", "a", "th"],
        emoji: "🛁"
      },
      {
        word: "this",
        blocks: ["th", "i", "s"],
        emoji: "👉"
      }
    ],
    tip: "舌尖露一点点就好，别咬疼自己。"
  },
  {
    id: "ph_di_wh",
    unit: "二合字母",
    title: "wh 的 /w/",
    emoji: "❓",
    grade: 2,
    teach: ["wh 大多读 /w/，和 w 一样。", "what、when、white 都是这样开头。", "先把嘴巴收圆，再滑到后面的音。"],
    blends: [
      {
        word: "what",
        blocks: ["wh", "a", "t"],
        emoji: "❓"
      },
      {
        word: "when",
        blocks: ["wh", "e", "n"],
        emoji: "⏰"
      },
      {
        word: "white",
        blocks: ["wh", "i", "te"],
        emoji: "⚪"
      },
      {
        word: "wheel",
        blocks: ["wh", "ee", "l"],
        emoji: "🎡"
      }
    ],
    tip: "wh 里的 h 不发音，直接读 /w/。"
  },
  {
    id: "ph_di_ck",
    unit: "二合字母",
    title: "ck 的 /k/",
    emoji: "🦆",
    grade: 2,
    teach: ["ck 常出现在短词结尾，读 /k/。", "duck、sock、rock 都是这样收尾。", "看到 ck，就干脆地说 /k/。"],
    blends: [
      {
        word: "duck",
        blocks: ["d", "u", "ck"],
        emoji: "🦆"
      },
      {
        word: "sock",
        blocks: ["s", "o", "ck"],
        emoji: "🧦"
      },
      {
        word: "rock",
        blocks: ["r", "o", "ck"],
        emoji: "🪨"
      },
      {
        word: "black",
        blocks: ["b", "l", "a", "ck"],
        emoji: "⬛"
      }
    ],
    tip: "短元音后面一般写 ck，不写单个 k。"
  },
  {
    id: "ph_di_ng",
    unit: "二合字母",
    title: "ng 的 /ŋ/",
    emoji: "👑",
    grade: 2,
    teach: ["ng 读鼻音 /ŋ/，声音从鼻子里出来。", "sing、king、ring 的尾巴都是 ng。", "读的时候舌根抬起来，嘴巴不用闭。"],
    blends: [
      {
        word: "sing",
        blocks: ["s", "i", "ng"],
        emoji: "🎤"
      },
      {
        word: "king",
        blocks: ["k", "i", "ng"],
        emoji: "👑"
      },
      {
        word: "ring",
        blocks: ["r", "i", "ng"],
        emoji: "💍"
      },
      {
        word: "long",
        blocks: ["l", "o", "ng"],
        emoji: "📏"
      }
    ],
    tip: "ng 是一个音，别读成 /n/ 加 /g/。"
  },

  // ---- ⑤ 元音组合 7 关：ai/ay、ee/ea、oa/ow、oo、ou/ow、oi/oy、ar/or ----
  {
    id: "ph_vt_ai",
    unit: "元音组合",
    title: "ai / ay 的 /eɪ/",
    emoji: "🌧️",
    grade: 2,
    teach: [
      "ai 和 ay 都读 /eɪ/，就是字母 A 的名字。",
      "ai 多在词中间：rain；ay 多在词尾：day。",
      "记住位置，写的时候就不会错。"
    ],
    blends: [
      {
        word: "rain",
        blocks: ["r", "ai", "n"],
        emoji: "🌧️"
      },
      {
        word: "train",
        blocks: ["t", "r", "ai", "n"],
        emoji: "🚂"
      },
      {
        word: "day",
        blocks: ["d", "ay"],
        emoji: "☀️"
      },
      {
        word: "play",
        blocks: ["p", "l", "ay"],
        emoji: "⚽"
      }
    ],
    tip: "读 /eɪ/ 时嘴巴从大慢慢变扁。"
  },
  {
    id: "ph_vt_ee",
    unit: "元音组合",
    title: "ee / ea 的 /iː/",
    emoji: "🐝",
    grade: 2,
    teach: ["ee 和 ea 都读长音 /iː/，嘴巴扁扁地笑一笑。", "bee、tree、tea、sea 都是这个音。", "长音要读得长一点点。"],
    blends: [
      {
        word: "bee",
        blocks: ["b", "ee"],
        emoji: "🐝"
      },
      {
        word: "tree",
        blocks: ["t", "r", "ee"],
        emoji: "🌳"
      },
      {
        word: "tea",
        blocks: ["t", "ea"],
        emoji: "🍵"
      },
      {
        word: "sea",
        blocks: ["s", "ea"],
        emoji: "🌊"
      }
    ],
    tip: "ee 和 ea 读音一样，只是写法不同。"
  },
  {
    id: "ph_vt_oa",
    unit: "元音组合",
    title: "oa / ow 的 /oʊ/",
    emoji: "⛵",
    grade: 2,
    teach: [
      "oa 和 ow 常常读 /oʊ/，就是字母 O 的名字。",
      "boat、coat 用 oa；snow 用 ow。",
      "ow 有时也读 /aʊ/，遇到新词多听一遍。"
    ],
    blends: [
      {
        word: "boat",
        blocks: ["b", "oa", "t"],
        emoji: "⛵"
      },
      {
        word: "coat",
        blocks: ["c", "oa", "t"],
        emoji: "🧥"
      },
      {
        word: "snow",
        blocks: ["s", "n", "ow"],
        emoji: "❄️"
      },
      {
        word: "cow",
        blocks: ["c", "ow"],
        emoji: "🐮"
      }
    ],
    tip: "先记住最常见的 /oʊ/，特殊的词单独记。"
  },
  {
    id: "ph_vt_oo",
    unit: "元音组合",
    title: "oo 的 /uː/ 和 /ʊ/",
    emoji: "🌙",
    grade: 2,
    teach: ["oo 最常见读长音 /uː/：moon、food。", "有时候读短一点的 /ʊ/：book、foot。", "两个音都试试，听听哪个更顺口。"],
    blends: [
      {
        word: "moon",
        blocks: ["m", "oo", "n"],
        emoji: "🌙"
      },
      {
        word: "book",
        blocks: ["b", "oo", "k"],
        emoji: "📖"
      },
      {
        word: "food",
        blocks: ["f", "oo", "d"],
        emoji: "🍚"
      },
      {
        word: "foot",
        blocks: ["f", "oo", "t"],
        emoji: "🦶"
      }
    ],
    tip: "moon 的 oo 长，book 的 oo 短，比一比。"
  },
  {
    id: "ph_vt_ou",
    unit: "元音组合",
    title: "ou / ow 的 /aʊ/",
    emoji: "🏠",
    grade: 2,
    teach: [
      "ou 和 ow 都可以读 /aʊ/，像轻轻“哎哟”一声。",
      "house、cloud 用 ou；owl、brown 用 ow。",
      "嘴巴先张大，再收圆。"
    ],
    blends: [
      {
        word: "house",
        blocks: ["h", "ou", "se"],
        emoji: "🏠"
      },
      {
        word: "cloud",
        blocks: ["c", "l", "ou", "d"],
        emoji: "☁️"
      },
      {
        word: "owl",
        blocks: ["ow", "l"],
        emoji: "🦉"
      },
      {
        word: "brown",
        blocks: ["b", "r", "ow", "n"],
        emoji: "🟤"
      }
    ],
    tip: "把 /a/ 和 /ʊ/ 快速连起来就是 /aʊ/。"
  },
  {
    id: "ph_vt_oi",
    unit: "元音组合",
    title: "oi / oy 的 /ɔɪ/",
    emoji: "🪙",
    grade: 2,
    teach: ["oi 和 oy 都读 /ɔɪ/。", "oi 多在词中间：coin、soil；oy 多在词尾：boy、toy。", "读的时候嘴巴从圆变扁。"],
    blends: [
      {
        word: "coin",
        blocks: ["c", "oi", "n"],
        emoji: "🪙"
      },
      {
        word: "soil",
        blocks: ["s", "oi", "l"],
        emoji: "🪴"
      },
      {
        word: "boy",
        blocks: ["b", "oy"],
        emoji: "👦"
      },
      {
        word: "toy",
        blocks: ["t", "oy"],
        emoji: "🧸"
      }
    ],
    tip: "记住小规律：词尾一般写 oy。"
  },
  {
    id: "ph_vt_ar",
    unit: "元音组合",
    title: "ar / or 的 /ɑːr/ 和 /ɔːr/",
    emoji: "🚗",
    grade: 3,
    teach: [
      "ar 读 /ɑːr/，or 读 /ɔːr/，都要把 r 的音带出来。",
      "car、shark 是 ar；fork、horse 是 or。",
      "美式发音里，r 要轻轻卷一下舌。"
    ],
    blends: [
      {
        word: "car",
        blocks: ["c", "ar"],
        emoji: "🚗"
      },
      {
        word: "shark",
        blocks: ["sh", "ar", "k"],
        emoji: "🦈"
      },
      {
        word: "fork",
        blocks: ["f", "or", "k"],
        emoji: "🍴"
      },
      {
        word: "horse",
        blocks: ["h", "or", "se"],
        emoji: "🐴"
      }
    ],
    tip: "读 ar 嘴巴张大，读 or 嘴唇圆一点。"
  },

  // ---- ⑥ 魔法 e 4 关：a_e、i_e、o_e、u_e ----
  {
    id: "ph_me_a",
    unit: "魔法 e",
    title: "a_e：a 读名字音 /eɪ/",
    emoji: "🍰",
    grade: 3,
    teach: [
      "词尾加一个不发音的 e，前面的 a 就读名字音 /eɪ/。",
      "cap 变成 cape，mad 变成 made。",
      "魔法 e 自己不发音，却让前面的元音变长。"
    ],
    blends: [
      {
        word: "cake",
        blocks: ["c", "a", "ke"],
        emoji: "🍰"
      },
      {
        word: "name",
        blocks: ["n", "a", "me"],
        emoji: "🏷️"
      },
      {
        word: "gate",
        blocks: ["g", "a", "te"],
        emoji: "🚪"
      },
      {
        word: "plane",
        blocks: ["p", "l", "a", "ne"],
        emoji: "✈️"
      }
    ],
    tip: "最后的 e 不出声，只提醒你前面读长音。"
  },
  {
    id: "ph_me_i",
    unit: "魔法 e",
    title: "i_e：i 读名字音 /aɪ/",
    emoji: "🚲",
    grade: 3,
    teach: [
      "i 后面隔一个辅音再加 e，i 就读 /aɪ/。",
      "kit 变成 kite，pin 变成 pine。",
      "对比着读一读，区别一下就听出来了。"
    ],
    blends: [
      {
        word: "bike",
        blocks: ["b", "i", "ke"],
        emoji: "🚲"
      },
      {
        word: "kite",
        blocks: ["k", "i", "te"],
        emoji: "🪁"
      },
      {
        word: "nine",
        blocks: ["n", "i", "ne"],
        emoji: "9️⃣"
      },
      {
        word: "rice",
        blocks: ["r", "i", "ce"],
        emoji: "🍚"
      }
    ],
    tip: "词尾的 e 不发音，只是提醒你读长音。"
  },
  {
    id: "ph_me_o",
    unit: "魔法 e",
    title: "o_e：o 读名字音 /oʊ/",
    emoji: "👃",
    grade: 3,
    teach: ["o 后面隔一个辅音再加 e，o 就读 /oʊ/。", "not 变成 note，hop 变成 hope。", "读长音时嘴唇圆圆地收一下。"],
    blends: [
      {
        word: "nose",
        blocks: ["n", "o", "se"],
        emoji: "👃"
      },
      {
        word: "home",
        blocks: ["h", "o", "me"],
        emoji: "🏠"
      },
      {
        word: "rose",
        blocks: ["r", "o", "se"],
        emoji: "🌹"
      },
      {
        word: "bone",
        blocks: ["b", "o", "ne"],
        emoji: "🦴"
      }
    ],
    tip: "先读 /oʊ/，再接后面的音，中间别断开。"
  },
  {
    id: "ph_me_u",
    unit: "魔法 e",
    title: "u_e：u 读 /juː/",
    emoji: "🧊",
    grade: 3,
    teach: [
      "u 后面隔一个辅音再加 e，u 常读 /juː/。",
      "cub 变成 cube，cut 变成 cute。",
      "这个音有点像“优”，嘴巴先扁再圆。"
    ],
    blends: [
      {
        word: "cube",
        blocks: ["c", "u", "be"],
        emoji: "🧊"
      },
      {
        word: "cute",
        blocks: ["c", "u", "te"],
        emoji: "🥰"
      },
      {
        word: "mute",
        blocks: ["m", "u", "te"],
        emoji: "🔇"
      },
      {
        word: "huge",
        blocks: ["h", "u", "ge"],
        emoji: "🐘"
      }
    ],
    tip: "不是每个 u_e 都读 /juː/，多听几遍最准。"
  }
];
