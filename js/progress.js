/**
 * 🌟 成长档案（多孩子档案 + 学习记录 + 等级经验 + 闯关任务 + 成就徽章 + 奖牌 + 每日任务）
 * 所有数据保存在浏览器本地，按「小伙伴」分开存放，互不干扰。
 *
 * 这一版新增：
 *   - 等级 / 经验（XP）：运行、学课、做题、考试都会长经验
 *   - 练习题记录：做对多少题、每个主题做对多少题、连对多少题
 *   - 教程记录：学完哪些课、各阶段（GESP 一级～四级）学完多少
 *   - 每日任务：每天 3 个小任务，做完加经验
 *   - 奖牌：13 个技能领域 × 铜/银/金 + 特别奖牌
 */
const Progress = (() => {
  const PROFILES_KEY = "codepanda_profiles_v1";
  const CURRENT_KEY = "codepanda_current_profile_v1";
  const STATS_PREFIX = "codepanda_stats_v1_";
  const EMOJIS = ["🐼", "🦊", "🐯", "🐰", "🐨", "🦄", "🐳", "🐙", "🦖", "🐝", "🐧", "🐵"];

  // 课程总数兜底（真正的数量以 lessons.js / lessons-adv.js 为准，加载后自动覆盖）
  let LESSON_TOTAL_FALLBACK = 56;
  function allLessons() {
    const base = (typeof LEARN_LESSONS !== "undefined" && LEARN_LESSONS) ? LEARN_LESSONS : [];
    const adv = (typeof LEARN_LESSONS_ADV !== "undefined" && LEARN_LESSONS_ADV) ? LEARN_LESSONS_ADV : [];
    return adv.length ? base.concat(adv.filter(l => !base.some(x => x.id === l.id))) : base;
  }
  function lessonTotal() {
    const list = allLessons();
    return list.length || LESSON_TOTAL_FALLBACK;
  }
  function exerciseTotal() {
    try {
      if (typeof EXERCISE_BANK !== "undefined" && EXERCISE_BANK.length) return EXERCISE_BANK.length;
    } catch (e) {}
    return 1000;
  }

  // ================= 等级 / 经验 =================
  const LEVEL_TITLES = [
    ["🥚", "编程小萌新"], ["🐣", "代码小新手"], ["🗣️", "打印小能手"], ["📦", "变量小管家"],
    ["➕", "运算小达人"], ["🤔", "判断小侦探"], ["🔁", "循环小旋风"], ["✍️", "字符串小魔法师"],
    ["🎒", "列表小管家"], ["📖", "字典小博士"], ["🧩", "函数小工匠"], ["🐢", "海龟小画家"],
    ["🧮", "数学小神童"], ["🔺", "图案设计师"], ["🧠", "算法小勇士"], ["💾", "文件小管家"],
    ["🩺", "调试小医生"], ["🥇", "GESP 一级合格"], ["🥈", "GESP 二级合格"], ["🥉", "GESP 三级合格"],
    ["🏅", "GESP 四级合格"], ["🎓", "Python 小讲师"], ["🚀", "代码飞行员"], ["🛰️", "编程小工程师"],
    ["🌟", "闪耀编程星"], ["💫", "代码魔法师"], ["🔮", "算法预言家"], ["👑", "少儿编程王者"],
    ["🏆", "萌码传奇"], ["🌈", "编程大魔法师"]
  ];
  const MAX_LEVEL = LEVEL_TITLES.length;

  function levelNeed(level) {
    // 升到第 level 级需要多少经验（level 从 2 开始）
    return 80 + (level - 2) * 20;
  }

  function levelInfo(xp) {
    let level = 1;
    let rest = Math.max(0, Number(xp) || 0);
    while (level < MAX_LEVEL && rest >= levelNeed(level + 1)) {
      rest -= levelNeed(level + 1);
      level += 1;
    }
    const need = level >= MAX_LEVEL ? 0 : levelNeed(level + 1);
    const title = LEVEL_TITLES[level - 1] || LEVEL_TITLES[0];
    return {
      level: level,
      emoji: title[0],
      title: title[1],
      xp: Math.max(0, Number(xp) || 0),
      cur: rest,
      need: need,
      percent: need ? Math.min(100, Math.round(rest / need * 100)) : 100,
      isMax: level >= MAX_LEVEL
    };
  }

  // ================= 闯关任务 =================
  const MISSIONS = [
    { id: "m_print",   emoji: "🗣️", title: "说出第一句魔法", hint: "用 print(\"你好\") 跟电脑打个招呼", check: (c, s) => /print\s*\(/.test(c.code) && c.success },
    { id: "m_var",     emoji: "📦", title: "会变的名字",     hint: "把东西装进变量，例如 名字 = \"小熊猫\"", check: (c, s) => /^[ \t]*[A-Za-z_]\w*[ \t]*=[^=]/m.test(c.code) && c.success },
    { id: "m_loop",    emoji: "🔁", title: "重复的力量",     hint: "用 for i in range(3): 让电脑重复做事", check: (c, s) => /^[ \t]*for\s+.+:/m.test(c.code) && c.success },
    { id: "m_if",      emoji: "🤔", title: "会思考的程序",   hint: "用 if 判断让程序自己选一条路走", check: (c, s) => /^[ \t]*if\s+.+:/m.test(c.code) && c.success },
    { id: "m_input",   emoji: "💬", title: "和我聊天",       hint: "用 input(\"你叫什么名字？\") 让程序提问", check: (c, s) => /input\s*\(/.test(c.code) && c.success },
    { id: "m_turtle",  emoji: "🐢", title: "海龟画家",       hint: "import turtle 后让小海龟画几笔", check: (c, s) => !!c.turtle && c.success },
    { id: "m_random",  emoji: "🎲", title: "幸运抽奖",       hint: "用 random.randint(1, 6) 掷个骰子", check: (c, s) => /random\s*\./.test(c.code) && c.success },
    { id: "m_list",    emoji: "🎒", title: "收进百宝箱",     hint: "用列表存东西，例如 水果 = [\"苹果\", \"香蕉\"]", check: (c, s) => /=\s*\[[^\]]*\]/.test(c.code) && c.success },
    { id: "m_dict",    emoji: "📖", title: "钥匙与宝箱",     hint: "用字典存「名字 → 内容」，例如 分数 = {\"语文\": 95}", check: (c, s) => /=\s*\{[^}]*\}/.test(c.code) && c.success },
    { id: "m_def",     emoji: "🧩", title: "我的积木",       hint: "用 def 定义属于自己的函数积木", check: (c, s) => /^[ \t]*def\s+\w+/m.test(c.code) && c.success },
    { id: "m_while",   emoji: "♾️", title: "停不下来的循环", hint: "用 while 循环，并且记得写结束条件", check: (c, s) => /^[ \t]*while\s+.+:/m.test(c.code) && c.success },
    { id: "m_import",  emoji: "🧰", title: "打开工具箱",     hint: "import math 或 import random，用别人写好的本领", check: (c, s) => /^[ \t]*(import|from)\s+\w+/m.test(c.code) && c.success },
    { id: "m_numpy",   emoji: "🧮", title: "数学小助手",     hint: "试试 import numpy 让电脑算得更快", check: (c, s) => (s.packages || []).indexOf("numpy") !== -1 },
    { id: "m_file",    emoji: "💾", title: "数据保管员",     hint: "用 open(\"日记.txt\", \"w\") 把文字存进文件", check: (c, s) => (s.vfsFiles || 0) > 0 },
    { id: "m_ten",     emoji: "🔟", title: "练习十次",       hint: "累计成功运行 10 次代码", check: (c, s) => (s.successes || 0) >= 10 },
    { id: "m_fifty",   emoji: "💯", title: "熟能生巧",       hint: "累计成功运行 50 次代码", check: (c, s) => (s.successes || 0) >= 50 },
    { id: "m_lesson1", emoji: "🎓", title: "上了第一堂课",   hint: "打开学习中心，学完第 1 课教程", check: (c, s) => Object.keys(s.lessons || {}).length >= 1 },
    { id: "m_lesson10", emoji: "📚", title: "认真学习",     hint: "学完 10 课教程", check: (c, s) => Object.keys(s.lessons || {}).length >= 10 },
    { id: "m_solve1",  emoji: "✅", title: "做对第一题",     hint: "在学习中心的练习里做对 1 道题", check: (c, s) => solvedCount(s) >= 1 },
    { id: "m_solve10", emoji: "✏️", title: "练习小能手",     hint: "做对 10 道练习题", check: (c, s) => solvedCount(s) >= 10 },
    { id: "m_solve50", emoji: "📝", title: "刷题达人",       hint: "做对 50 道练习题", check: (c, s) => solvedCount(s) >= 50 },
    { id: "m_solve100", emoji: "🏅", title: "百题斩",       hint: "做对 100 道练习题", check: (c, s) => solvedCount(s) >= 100 },
    { id: "m_solve300", emoji: "⚔️", title: "三百题大关",   hint: "做对 300 道练习题", check: (c, s) => solvedCount(s) >= 300 },
    { id: "m_quiz1",   emoji: "🧠", title: "小测验答对啦",   hint: "在教程里答对 1 道课后小测", check: (c, s) => (s.quizCorrect || 0) >= 1 },
    { id: "m_exam1",   emoji: "📝", title: "第一次模拟考",   hint: "参加一次 GESP 模拟考", check: (c, s) => (s.exams || []).length >= 1 },
    { id: "m_exam_pass", emoji: "🎖️", title: "模拟考及格",  hint: "模拟考拿到 60 分以上", check: (c, s) => (s.exams || []).some(e => e.score >= 60) },
    { id: "m_medal1",  emoji: "🥉", title: "第一枚奖牌",     hint: "拿到任意一枚奖牌", check: (c, s) => (s.medals || []).length >= 1 },
    { id: "m_medal10", emoji: "🥇", title: "奖牌收藏家",     hint: "集齐 10 枚奖牌", check: (c, s) => (s.medals || []).length >= 10 },
    { id: "m_level5",  emoji: "🚀", title: "五级小达人",     hint: "等级升到 5 级", check: (c, s) => levelInfo(s.xp).level >= 5 },
    { id: "m_level10", emoji: "🌟", title: "十级大关",       hint: "等级升到 10 级", check: (c, s) => levelInfo(s.xp).level >= 10 },
    { id: "m_day3",    emoji: "📅", title: "坚持三天",       hint: "连续 3 天来写代码", check: (c, s) => (s.days || []).length >= 3 },
    { id: "m_combo5",  emoji: "🔥", title: "连对五题",       hint: "连续做对 5 道练习题", check: (c, s) => (s.bestCombo || 0) >= 5 }
  ];

  // ================= 技能领域（奖牌用） =================
  const DOMAINS = [
    { id: "print",      name: "输出打印",   emoji: "🗣️", topics: ["print"] },
    { id: "input",      name: "输入与变量", emoji: "💬", topics: ["input", "var"] },
    { id: "calc",       name: "算术运算",   emoji: "➕", topics: ["calc"] },
    { id: "branch",     name: "条件判断",   emoji: "🤔", topics: ["if"] },
    { id: "loop",       name: "循环重复",   emoji: "🔁", topics: ["loop"] },
    { id: "string",     name: "字符串",     emoji: "✍️", topics: ["str"] },
    { id: "list",       name: "列表",       emoji: "🎒", topics: ["list"] },
    { id: "dict",       name: "字典",       emoji: "📖", topics: ["dict"] },
    { id: "func",       name: "函数",       emoji: "🧩", topics: ["func"] },
    { id: "math",       name: "数学与数论", emoji: "🧮", topics: ["math"] },
    { id: "algo",       name: "算法思维",   emoji: "🧠", topics: ["algo"] },
    { id: "art",        name: "图形与绘图", emoji: "🎨", topics: ["shape", "turtle"] },
    { id: "life",       name: "文件与趣味", emoji: "🎪", topics: ["file", "fun"] }
  ];

  const TIERS = [
    { id: "bronze", name: "铜牌", emoji: "🥉", need: 6 },
    { id: "silver", name: "银牌", emoji: "🥈", need: 20 },
    { id: "gold",   name: "金牌", emoji: "🥇", need: 45 }
  ];

  function domainScore(s, domain) {
    const skill = s.skill || {};
    let sum = 0;
    domain.topics.forEach(t => { sum += skill[t] || 0; });
    return sum;
  }

  const MEDALS = (() => {
    const list = [];
    DOMAINS.forEach(d => {
      TIERS.forEach(t => {
        list.push({
          id: "md_" + d.id + "_" + t.id,
          emoji: t.emoji,
          tier: t.id,
          category: "技能奖牌",
          title: d.name + "·" + t.name,
          desc: "在「" + d.name + "」里做对 " + t.need + " 道练习题（" + d.emoji + "）",
          got: s => domainScore(s, d) >= t.need
        });
      });
    });
    [
      { id: "md_lesson_all", emoji: "🎓", tier: "gold", title: "教程大师", desc: "学完全部课程", got: s => Object.keys(s.lessons || {}).length >= lessonTotal() },
      { id: "md_solve_500",  emoji: "⚔️", tier: "gold", title: "五百题勋章", desc: "做对 500 道练习题", got: s => solvedCount(s) >= 500 },
      { id: "md_solve_all",  emoji: "🌌", tier: "gold", title: "题海征服者", desc: "把题库里 1000 道题全部做对", got: s => solvedCount(s) >= exerciseTotal() },
      { id: "md_exam_ace",   emoji: "💯", tier: "gold", title: "模拟考满分", desc: "任意一次 GESP 模拟考拿到满分", got: s => (s.exams || []).some(e => e.total && e.score >= e.total) },
      { id: "md_streak_7",   emoji: "🔥", tier: "silver", title: "七日之火", desc: "连续 7 天来学习", got: s => (s.streak || 0) >= 7 },
      { id: "md_streak_30",  emoji: "🏛️", tier: "gold", title: "三十日坚持", desc: "连续 30 天来学习", got: s => (s.streak || 0) >= 30 },
      { id: "md_level_15",   emoji: "💫", tier: "gold", title: "十五级勋章", desc: "等级升到 15 级", got: s => levelInfo(s.xp).level >= 15 },
      { id: "md_daily_30",   emoji: "📋", tier: "gold", title: "任务达人", desc: "累计完成 30 个每日任务", got: s => (s.dailyDone || 0) >= 30 },
      { id: "md_turtle_20",  emoji: "🖼️", tier: "silver", title: "画展作者", desc: "画出 20 幅海龟画", got: s => (s.turtleRuns || 0) >= 20 },
      { id: "md_all_badge",  emoji: "👑", tier: "gold", title: "徽章之王", desc: "集齐 60 枚成就徽章", got: s => (s.badges || []).length >= 60 }
    ].forEach(m => list.push(Object.assign({ category: "特别奖牌" }, m)));
    return list;
  })();

  // ================= 成就徽章 =================
  function B(id, emoji, cat, title, desc, got) {
    return { id, emoji, cat, title, desc, got };
  }
  const BADGES = [
    // ---- 运行 ----
    B("b_first_run", "🚀", "运行", "第一次运行", "点一次「运行代码」", s => (s.runs || 0) >= 1),
    B("b_run10", "🔁", "运行", "运行 10 次", "累计运行 10 次代码", s => (s.runs || 0) >= 10),
    B("b_run50", "⚙️", "运行", "运行 50 次", "累计运行 50 次代码", s => (s.runs || 0) >= 50),
    B("b_run200", "🏭", "运行", "运行 200 次", "累计运行 200 次代码", s => (s.runs || 0) >= 200),
    B("b_run500", "🛰️", "运行", "运行 500 次", "累计运行 500 次代码", s => (s.runs || 0) >= 500),
    B("b_first_ok", "🎯", "运行", "第一次成功", "第一次成功跑通代码", s => (s.successes || 0) >= 1),
    B("b_ok10", "✨", "运行", "成功 10 次", "累计成功运行 10 次", s => (s.successes || 0) >= 10),
    B("b_ok20", "💯", "运行", "成功 20 次", "累计成功运行 20 次", s => (s.successes || 0) >= 20),
    B("b_ok50", "✅", "运行", "成功 50 次", "累计成功运行 50 次", s => (s.successes || 0) >= 50),
    B("b_ok200", "🏆", "运行", "成功 200 次", "累计成功运行 200 次", s => (s.successes || 0) >= 200),
    B("b_err10", "🩺", "运行", "被报错教过 10 次", "报错不可怕，改好就是进步（累计 10 次报错）", s => ((s.runs || 0) - (s.successes || 0)) >= 10),
    B("b_night", "🌙", "运行", "深夜编程家", "在 22 点以后还来写代码", s => (s.nightRuns || 0) >= 1),
    B("b_early", "🌅", "运行", "早起编程家", "在 7 点前就来写代码", s => (s.earlyRuns || 0) >= 1),
    B("b_long500", "📜", "运行", "长篇大作", "一次写下 500 个字符的代码", s => (s.longestCode || 0) >= 500),
    B("b_long1500", "📚", "运行", "代码长卷", "一次写下 1500 个字符的代码", s => (s.longestCode || 0) >= 1500),
    B("b_pkg_any", "📦", "运行", "安装工具箱", "成功加载过任意一个第三方库", s => (s.packages || []).length >= 1),
    B("b_numpy", "🧮", "运行", "数学小助手", "成功用上 numpy", s => (s.packages || []).indexOf("numpy") !== -1),
    B("b_file", "💾", "运行", "数据保管员", "用 open() 写出了一个数据文件", s => (s.vfsFiles || 0) > 0),
    B("b_file5", "🗄️", "运行", "五个数据文件", "一共写出 5 个数据文件", s => (s.vfsFiles || 0) >= 5),

    // ---- 教程 ----
    B("b_lesson1", "🎓", "教程", "第一堂课", "学完第 1 课教程", s => lessonCount(s) >= 1),
    B("b_lesson5", "📖", "教程", "学了 5 课", "累计学完 5 课教程", s => lessonCount(s) >= 5),
    B("b_lesson10", "📗", "教程", "学了 10 课", "累计学完 10 课教程", s => lessonCount(s) >= 10),
    B("b_lesson20", "📘", "教程", "学了 20 课", "累计学完 20 课教程", s => lessonCount(s) >= 20),
    B("b_lesson30", "📙", "教程", "学了 30 课", "累计学完 30 课教程", s => lessonCount(s) >= 30),
    B("b_lesson48", "📕", "教程", "学了 48 课", "累计学完 48 课教程", s => lessonCount(s) >= 48),
    B("b_stage1", "🌱", "教程", "一级通关", "学完 GESP 一级的全部课程", s => stageDone(s, 1)),
    B("b_stage2", "🌿", "教程", "二级通关", "学完 GESP 二级的全部课程", s => stageDone(s, 2)),
    B("b_stage3", "🌳", "教程", "三级通关", "学完 GESP 三级的全部课程", s => stageDone(s, 3)),
    B("b_stage4", "🏔️", "教程", "四级通关", "学完 GESP 四级打基础的课程", s => stageDone(s, 4)),
    B("b_lesson_all", "👑", "教程", "课程全通关", "把学习中心里的课全部学完", s => lessonCount(s) >= lessonTotal()),
    B("b_lesson_day3", "⚡", "教程", "一天三课", "一天之内学完 3 课", s => (s.lessonDayMax || 0) >= 3),
    B("b_lesson_day5", "🌀", "教程", "一天五课", "一天之内学完 5 课", s => (s.lessonDayMax || 0) >= 5),
    B("b_quiz1", "🧠", "教程", "小测答对啦", "课后小测答对 1 道", s => (s.quizCorrect || 0) >= 1),
    B("b_quiz10", "🎯", "教程", "小测十连", "课后小测累计答对 10 道", s => (s.quizCorrect || 0) >= 10),
    B("b_quiz50", "🎖️", "教程", "小测五十", "课后小测累计答对 50 道", s => (s.quizCorrect || 0) >= 50),
    B("b_code_run", "▶️", "教程", "边学边练", "把教程里的示例代码运行过", s => (s.lessonRuns || 0) >= 1),
    B("b_code_run10", "🔬", "教程", "实验小达人", "运行教程示例代码 10 次", s => (s.lessonRuns || 0) >= 10),

    // ---- 练习 ----
    B("b_solve1", "✅", "练习", "做对第一题", "在练习里做对 1 道题", s => solvedCount(s) >= 1),
    B("b_solve10", "🔟", "练习", "做对 10 题", "累计做对 10 道练习题", s => solvedCount(s) >= 10),
    B("b_solve25", "💪", "练习", "做对 25 题", "累计做对 25 道练习题", s => solvedCount(s) >= 25),
    B("b_solve50", "🏅", "练习", "做对 50 题", "累计做对 50 道练习题", s => solvedCount(s) >= 50),
    B("b_solve100", "💯", "练习", "百题斩", "累计做对 100 道练习题", s => solvedCount(s) >= 100),
    B("b_solve200", "🥈", "练习", "两百题", "累计做对 200 道练习题", s => solvedCount(s) >= 200),
    B("b_solve300", "⚔️", "练习", "三百题", "累计做对 300 道练习题", s => solvedCount(s) >= 300),
    B("b_solve500", "🥇", "练习", "五百题", "累计做对 500 道练习题", s => solvedCount(s) >= 500),
    B("b_solve800", "🌟", "练习", "八百题", "累计做对 800 道练习题", s => solvedCount(s) >= 800),
    B("b_solve1000", "🌌", "练习", "千题王者", "把 1000 道练习题全部做对", s => solvedCount(s) >= exerciseTotal()),
    B("b_tried50", "✏️", "练习", "试过 50 题", "累计动手做过 50 道题（不管对错）", s => triedCount(s) >= 50),
    B("b_tried200", "📝", "练习", "试过 200 题", "累计动手做过 200 道题", s => triedCount(s) >= 200),
    B("b_first_try", "🎯", "练习", "一次就对", "第一次提交就答对一道题", s => (s.firstTry || 0) >= 1),
    B("b_first_try20", "🧿", "练习", "一次就对 20 次", "第一次提交就答对 20 道题", s => (s.firstTry || 0) >= 20),
    B("b_combo5", "🔥", "练习", "连对 5 题", "连续做对 5 道题", s => (s.bestCombo || 0) >= 5),
    B("b_combo10", "☄️", "练习", "连对 10 题", "连续做对 10 道题", s => (s.bestCombo || 0) >= 10),
    B("b_combo20", "🌠", "练习", "连对 20 题", "连续做对 20 道题", s => (s.bestCombo || 0) >= 20),
    B("b_solve_day20", "📈", "练习", "一天 20 题", "一天之内做对 20 道题", s => (s.solveDayMax || 0) >= 20),
    B("b_solve_day50", "🚄", "练习", "一天 50 题", "一天之内做对 50 道题", s => (s.solveDayMax || 0) >= 50),
    B("b_fast", "⚡", "练习", "飞快的手速", "60 秒内做对一道题", s => (s.fastSolve || 0) >= 1),
    B("b_level3_solve", "🌳", "练习", "三级题 10 道", "做对 10 道三级难度的题", s => (s.levelSolved && s.levelSolved[3] || 0) >= 10),
    B("b_level4_solve", "🏔️", "练习", "四级题 10 道", "做对 10 道四级难度的题", s => (s.levelSolved && s.levelSolved[4] || 0) >= 10),

    // ---- 技能 ----
    B("b_sk_print", "🗣️", "技能", "输出小能手", "做对 20 道「输出打印」题", s => topicSolved(s, "print") >= 20),
    B("b_sk_input", "💬", "技能", "问答小能手", "做对 20 道「输入问答」题", s => topicSolved(s, "input") >= 20),
    B("b_sk_var", "📦", "技能", "变量小管家", "做对 20 道「变量与类型」题", s => topicSolved(s, "var") >= 20),
    B("b_sk_calc", "➕", "技能", "运算小达人", "做对 20 道「算术运算」题", s => topicSolved(s, "calc") >= 20),
    B("b_sk_if", "🤔", "技能", "判断小侦探", "做对 20 道「条件判断」题", s => topicSolved(s, "if") >= 20),
    B("b_sk_loop", "🔁", "技能", "循环小旋风", "做对 20 道「循环重复」题", s => topicSolved(s, "loop") >= 20),
    B("b_sk_str", "✍️", "技能", "字符串魔法师", "做对 20 道「字符串」题", s => topicSolved(s, "str") >= 20),
    B("b_sk_list", "🎒", "技能", "列表小管家", "做对 20 道「列表」题", s => topicSolved(s, "list") >= 20),
    B("b_sk_dict", "📖", "技能", "字典小博士", "做对 20 道「字典」题", s => topicSolved(s, "dict") >= 20),
    B("b_sk_func", "🧩", "技能", "函数小工匠", "做对 20 道「函数」题", s => topicSolved(s, "func") >= 20),
    B("b_sk_math", "🧮", "技能", "数学小神童", "做对 20 道「数学与数论」题", s => topicSolved(s, "math") >= 20),
    B("b_sk_algo", "🧠", "技能", "算法小勇士", "做对 20 道「算法思维」题", s => topicSolved(s, "algo") >= 20),
    B("b_sk_shape", "🔺", "技能", "图案设计师", "做对 20 道「图形打印」题", s => topicSolved(s, "shape") >= 20),
    B("b_sk_file", "💾", "技能", "文件小管家", "做对 10 道「文件读写」题", s => topicSolved(s, "file") >= 10),
    B("b_sk_fun", "🎲", "技能", "趣味玩家", "做对 10 道「趣味编程」题", s => topicSolved(s, "fun") >= 10),

    // ---- 海龟 ----
    B("b_turtle", "🐢", "海龟", "海龟小画家", "让小海龟画第一幅画", s => (s.turtleRuns || 0) >= 1),
    B("b_turtle5", "🎨", "海龟", "画画达人", "画出 5 幅海龟画", s => (s.turtleRuns || 0) >= 5),
    B("b_turtle20", "🖼️", "海龟", "小画家", "画出 20 幅海龟画", s => (s.turtleRuns || 0) >= 20),
    B("b_turtle50", "🏞️", "海龟", "画展作者", "画出 50 幅海龟画", s => (s.turtleRuns || 0) >= 50),
    B("b_turtle100", "🖌️", "海龟", "百幅画作", "画出 100 幅海龟画", s => (s.turtleRuns || 0) >= 100),
    B("b_turtle_save", "📸", "海龟", "保存画作", "把海龟画作保存成图片", s => (s.turtleSaves || 0) >= 1),
    B("b_turtle_lesson", "🌀", "海龟", "循环画图", "学完海龟循环画图的课程", s => !!(s.lessons && (s.lessons.L14 || s.lessons.L15 || s.lessons.L16))),

    // ---- 坚持 ----
    B("b_day3", "📅", "坚持", "坚持三天", "累计学习 3 天", s => (s.days || []).length >= 3),
    B("b_day7", "🗓️", "坚持", "坚持七天", "累计学习 7 天", s => (s.days || []).length >= 7),
    B("b_day14", "📆", "坚持", "坚持十四天", "累计学习 14 天", s => (s.days || []).length >= 14),
    B("b_day30", "🎖️", "坚持", "坚持三十天", "累计学习 30 天", s => (s.days || []).length >= 30),
    B("b_day100", "🏛️", "坚持", "百日坚持", "累计学习 100 天", s => (s.days || []).length >= 100),
    B("b_streak3", "🔥", "坚持", "连续三天", "连续 3 天来学习", s => (s.streak || 0) >= 3),
    B("b_streak7", "⚡", "坚持", "连续七天", "连续 7 天来学习", s => (s.streak || 0) >= 7),
    B("b_streak30", "🌋", "坚持", "连续三十天", "连续 30 天来学习", s => (s.streak || 0) >= 30),

    // ---- 考试 ----
    B("b_exam1", "📝", "考试", "第一次模拟考", "参加一次 GESP 模拟考", s => (s.exams || []).length >= 1),
    B("b_exam10", "📋", "考试", "考了 10 次", "累计参加 10 次模拟考", s => (s.exams || []).length >= 10),
    B("b_exam1_60", "✅", "考试", "一级及格", "一级模拟考 60 分以上", s => examBest(s, 1) >= 60),
    B("b_exam1_90", "🏅", "考试", "一级优秀", "一级模拟考 90 分以上", s => examBest(s, 1) >= 90),
    B("b_exam2_60", "✅", "考试", "二级及格", "二级模拟考 60 分以上", s => examBest(s, 2) >= 60),
    B("b_exam2_90", "🏅", "考试", "二级优秀", "二级模拟考 90 分以上", s => examBest(s, 2) >= 90),
    B("b_exam3_60", "✅", "考试", "三级及格", "三级模拟考 60 分以上", s => examBest(s, 3) >= 60),
    B("b_exam3_90", "🏅", "考试", "三级优秀", "三级模拟考 90 分以上", s => examBest(s, 3) >= 90),
    B("b_exam4_60", "✅", "考试", "四级及格", "四级模拟考 60 分以上", s => examBest(s, 4) >= 60),
    B("b_exam_full", "💯", "考试", "模拟考满分", "任意一次模拟考拿到满分", s => (s.exams || []).some(e => e.total && e.score >= e.total)),
    B("b_exam_all", "🎓", "考试", "四级全考过", "一、二、三、四级模拟考都及格", s => [1, 2, 3, 4].every(l => examBest(s, l) >= 60)),

    // ---- 每日任务 ----
    B("b_daily1", "📋", "任务", "完成第一个任务", "完成 1 个每日任务", s => (s.dailyDone || 0) >= 1),
    B("b_daily10", "🗒️", "任务", "完成 10 个任务", "累计完成 10 个每日任务", s => (s.dailyDone || 0) >= 10),
    B("b_daily30", "📊", "任务", "完成 30 个任务", "累计完成 30 个每日任务", s => (s.dailyDone || 0) >= 30),
    B("b_daily_all", "🌈", "任务", "任务全清", "一天之内完成当天全部 3 个任务", s => (s.dailyFull || 0) >= 1),
    B("b_daily_all7", "🌞", "任务", "任务周清", "累计 7 天完成当天全部任务", s => (s.dailyFull || 0) >= 7),

    // ---- 特殊 ----
    B("b_badge20", "🎖️", "特殊", "徽章收集者", "集齐 20 枚成就徽章", s => (s.badges || []).length >= 20),
    B("b_badge50", "🏵️", "特殊", "徽章达人", "集齐 50 枚成就徽章", s => (s.badges || []).length >= 50),
    B("b_badge80", "👑", "特殊", "徽章之王", "集齐 80 枚成就徽章", s => (s.badges || []).length >= 80),
    B("b_medal1", "🥉", "特殊", "第一枚奖牌", "拿到任意一枚奖牌", s => (s.medals || []).length >= 1),
    B("b_medal10", "🥈", "特殊", "十枚奖牌", "集齐 10 枚奖牌", s => (s.medals || []).length >= 10),
    B("b_medal25", "🥇", "特殊", "二十五枚奖牌", "集齐 25 枚奖牌", s => (s.medals || []).length >= 25),
    B("b_medal_all", "💎", "特殊", "奖牌全收集", "集齐全部奖牌", s => (s.medals || []).length >= MEDALS.length),
    B("b_level5", "🚀", "特殊", "五级小达人", "等级升到 5 级", s => levelInfo(s.xp).level >= 5),
    B("b_level10", "🌟", "特殊", "十级高手", "等级升到 10 级", s => levelInfo(s.xp).level >= 10),
    B("b_level20", "💫", "特殊", "二十级大师", "等级升到 20 级", s => levelInfo(s.xp).level >= 20),
    B("b_level30", "🌈", "特殊", "满级大魔法师", "等级升到最高级", s => levelInfo(s.xp).level >= MAX_LEVEL),
    B("b_gesp_ready", "🎯", "特殊", "GESP 备考完成", "学完 30 课并且做对 100 道题", s => lessonCount(s) >= 30 && solvedCount(s) >= 100)
  ];

  // ================= 每日任务 =================
  const DAILY_POOL = [
    { id: "d_run3",    emoji: "🚀", title: "运行 3 次代码",     key: "run",    need: 3,  xp: 10 },
    { id: "d_run10",   emoji: "🔁", title: "运行 10 次代码",    key: "run",    need: 10, xp: 20 },
    { id: "d_solve3",  emoji: "✏️", title: "做对 3 道练习",     key: "solve",  need: 3,  xp: 12 },
    { id: "d_solve5",  emoji: "📝", title: "做对 5 道练习",     key: "solve",  need: 5,  xp: 18 },
    { id: "d_solve10", emoji: "🔥", title: "做对 10 道练习",    key: "solve",  need: 10, xp: 30 },
    { id: "d_lesson1", emoji: "📚", title: "学完 1 课教程",     key: "lesson", need: 1,  xp: 12 },
    { id: "d_lesson2", emoji: "📖", title: "学完 2 课教程",     key: "lesson", need: 2,  xp: 22 },
    { id: "d_quiz3",   emoji: "🧠", title: "答对 3 道课后小测", key: "quiz",   need: 3,  xp: 15 },
    { id: "d_turtle1", emoji: "🐢", title: "画一幅海龟画",       key: "turtle", need: 1,  xp: 12 },
    { id: "d_medal1",  emoji: "🥉", title: "今天拿 1 枚新奖牌",  key: "medal",  need: 1,  xp: 25 },
    { id: "d_badge1",  emoji: "🏅", title: "今天拿 1 枚新徽章",  key: "badge",  need: 1,  xp: 15 },
    { id: "d_exam1",   emoji: "📋", title: "参加 1 次模拟考",    key: "exam",   need: 1,  xp: 30 }
  ];

  let profiles = [];
  let currentId = "";
  let stats = null;
  const changeListeners = [];     // 外部订阅（云同步 / 顶栏头像）

  // ================= 存储 =================
  function readJson(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      const val = raw ? JSON.parse(raw) : null;
      return val === null || val === undefined ? fallback : val;
    } catch (e) {
      return fallback;
    }
  }

  function writeJson(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (e) {
      console.warn("成长档案保存失败", e);
      return false;
    }
  }

  function emptyStats() {
    return {
      runs: 0, successes: 0, turtleRuns: 0, vfsFiles: 0, longestCode: 0,
      days: [], missions: {}, badges: [], packages: [], lastRunDate: "",
      // 新增：等级与学习
      xp: 0,
      lessons: {}, lessonStage: {}, lessonDayMax: 0, lessonDay: "", lessonRuns: 0,
      solved: {}, tried: {}, skill: {}, levelSolved: {},
      quizCorrect: 0, combo: 0, bestCombo: 0, firstTry: 0,
      solveDayMax: 0, solveDay: "", fastSolve: 0,
      medals: [], exams: [],
      streak: 0, bestStreak: 0,
      turtleSaves: 0, nightRuns: 0, earlyRuns: 0,
      daily: { date: "", progress: {}, done: [] },
      dailyDone: 0, dailyFull: 0
    };
  }

  function statsKey(id) {
    return STATS_PREFIX + id;
  }

  function loadStats() {
    const raw = readJson(statsKey(currentId), null);
    const base = emptyStats();
    if (!raw || typeof raw !== "object") return base;
    const merged = Object.assign(base, raw);
    ["days", "badges", "packages", "medals", "exams"].forEach(k => {
      if (!Array.isArray(merged[k])) merged[k] = [];
    });
    ["missions", "lessons", "solved", "tried", "skill", "levelSolved", "lessonStage"].forEach(k => {
      if (!merged[k] || typeof merged[k] !== "object") merged[k] = {};
    });
    if (!merged.daily || typeof merged.daily !== "object") merged.daily = { date: "", progress: {}, done: [] };
    if (!merged.daily.progress || typeof merged.daily.progress !== "object") merged.daily.progress = {};
    if (!Array.isArray(merged.daily.done)) merged.daily.done = [];
    return merged;
  }

  function saveStats() {
    writeJson(statsKey(currentId), stats);
  }

  function loadProfiles() {
    let list = readJson(PROFILES_KEY, null);
    if (!Array.isArray(list) || !list.length) {
      list = [{ id: "p_default", name: "小熊猫", emoji: "🐼", createdAt: Date.now() }];
      writeJson(PROFILES_KEY, list);
    }
    return list;
  }

  function todayStr(offsetDays) {
    const d = new Date(Date.now() - (offsetDays || 0) * 86400000);
    const m = d.getMonth() + 1;
    const day = d.getDate();
    return d.getFullYear() + "-" + (m < 10 ? "0" + m : m) + "-" + (day < 10 ? "0" + day : day);
  }

  // ================= 统计小助手 =================
  function doneCount(s) {
    return MISSIONS.filter(m => s.missions && s.missions[m.id]).length;
  }
  function solvedCount(s) { return Object.keys(s.solved || {}).length; }
  function triedCount(s) { return Object.keys(s.tried || {}).length; }
  function lessonCount(s) { return Object.keys(s.lessons || {}).length; }
  function topicSolved(s, topic) { return (s.skill || {})[topic] || 0; }
  function examBest(s, level) {
    return (s.exams || []).filter(e => e.level === level).reduce((m, e) => Math.max(m, e.score || 0), 0);
  }
  function stageDone(s, stage) {
    try {
      const all = allLessons();
      if (!all.length) {
        // 课程数据还没加载时，用「学完的课数」粗略估算，避免误判
        const need = { 1: 16, 2: 32, 3: 46, 4: 56 }[stage] || 999;
        return lessonCount(s) >= need;
      }
      const list = all.filter(l => l.stage === stage);
      if (!list.length) return false;
      return list.every(l => s.lessons && s.lessons[l.id]);
    } catch (e) {
      return false;
    }
  }

  // ================= 经验 =================
  function addXp(amount, reason) {
    const gain = Math.max(0, Math.round(Number(amount) || 0));
    if (!gain) return null;
    const before = levelInfo(stats.xp).level;
    stats.xp = (stats.xp || 0) + gain;
    const after = levelInfo(stats.xp);
    return { gain: gain, reason: reason || "", levelUp: after.level > before, level: after.level, info: after };
  }

  // ================= 每日任务 =================
  function dailySeed(dateStr) {
    let h = 0;
    for (let i = 0; i < dateStr.length; i++) h = (h * 31 + dateStr.charCodeAt(i)) % 100000;
    return h;
  }

  function dailyTasks() {
    const seed = dailySeed(stats.daily.date || todayStr());
    const picked = [];
    for (let i = 0; i < 3; i++) {
      picked.push(DAILY_POOL[(seed + i * 5) % DAILY_POOL.length]);
    }
    // 去重（万一撞上同一个任务）
    const uniq = [];
    picked.forEach(t => { if (!uniq.some(u => u.id === t.id)) uniq.push(t); });
    let extra = 7;
    while (uniq.length < 3 && extra < 40) {
      const t = DAILY_POOL[(seed + extra) % DAILY_POOL.length];
      if (!uniq.some(u => u.id === t.id)) uniq.push(t);
      extra += 3;
    }
    return uniq;
  }

  function rollDaily() {
    const today = todayStr();
    if (stats.daily.date === today) return false;
    // 昨天任务是否全清 → 累计「全清天数」
    const yesterday = stats.daily.date;
    if (yesterday && stats.daily.done && stats.daily.done.length >= 3) {
      stats.dailyFull = (stats.dailyFull || 0) + 1;
    }
    stats.daily = { date: today, progress: {}, done: [] };
    return true;
  }

  function bump(key, n) {
    if (!key) return;
    rollDaily();
    stats.daily.progress[key] = (stats.daily.progress[key] || 0) + (n || 1);
  }

  function checkDaily() {
    const finished = [];
    dailyTasks().forEach(t => {
      if (stats.daily.done.indexOf(t.id) !== -1) return;
      const have = stats.daily.progress[t.key] || 0;
      if (have >= t.need) {
        stats.daily.done.push(t.id);
        stats.dailyDone = (stats.dailyDone || 0) + 1;
        addXp(t.xp, "每日任务：" + t.title);
        finished.push(t);
      }
    });
    return finished;
  }

  // ================= 打卡 / 连续天数 =================
  function touchDay() {
    const today = todayStr();
    if (stats.days.indexOf(today) === -1) stats.days.push(today);
    stats.lastRunDate = today;
    // 连续天数：昨天也来过 → +1，否则重新开始
    const yesterday = todayStr(1);
    if (stats.lastStreakDate === yesterday) {
      stats.streak = (stats.streak || 0) + 1;
    } else if (stats.lastStreakDate !== today) {
      stats.streak = 1;
    }
    stats.lastStreakDate = today;
    if ((stats.streak || 0) > (stats.bestStreak || 0)) stats.bestStreak = stats.streak;
  }

  // ================= 检查成就 / 奖牌 =================
  function checkRewards() {
    const newMissions = [];
    MISSIONS.forEach(m => {
      if (stats.missions[m.id]) return;
      let ok = false;
      try { ok = !!m.check({ code: "", success: true }, stats); } catch (e) { ok = false; }
      if (ok) { stats.missions[m.id] = true; newMissions.push(m); }
    });

    const newBadges = [];
    BADGES.forEach(b => {
      if (stats.badges.indexOf(b.id) !== -1) return;
      let ok = false;
      try { ok = !!b.got(stats); } catch (e) { ok = false; }
      if (ok) { stats.badges.push(b.id); newBadges.push(b); }
    });
    // 第一次拿徽章也长经验
    if (newBadges.length) {
      stats.xp = (stats.xp || 0) + newBadges.length * 5;
      bump("badge", newBadges.length);
    }

    const newMedals = [];
    MEDALS.forEach(m => {
      if (stats.medals.indexOf(m.id) !== -1) return;
      let ok = false;
      try { ok = !!m.got(stats); } catch (e) { ok = false; }
      if (ok) { stats.medals.push(m.id); newMedals.push(m); }
    });
    if (newMedals.length) {
      stats.xp = (stats.xp || 0) + newMedals.length * 30;
      bump("medal", newMedals.length);
    }

    const dailyDone = checkDaily();
    return { newMissions: newMissions, newBadges: newBadges, newMedals: newMedals, dailyDone: dailyDone };
  }

  // ================= 记录：运行代码 =================
  function recordRun(ctx) {
    const c = ctx || {};
    stats.runs += 1;
    if (c.success) stats.successes += 1;
    if (c.turtle) stats.turtleRuns += 1;
    if ((c.code || "").length > stats.longestCode) stats.longestCode = (c.code || "").length;
    const hour = new Date().getHours();
    if (hour >= 22 || hour < 5) stats.nightRuns = (stats.nightRuns || 0) + 1;
    if (hour < 7) stats.earlyRuns = (stats.earlyRuns || 0) + 1;
    (c.packages || []).forEach(p => {
      if (stats.packages.indexOf(p) === -1) stats.packages.push(p);
    });
    touchDay();
    rollDaily();
    bump("run");
    if (c.turtle) bump("turtle");
    if (c.success) addXp(2, "运行成功");

    // 检查闯关任务（每次运行都重新检查未完成的任务）
    const newMissions = [];
    MISSIONS.forEach(m => {
      if (stats.missions[m.id]) return;
      let ok = false;
      try { ok = !!m.check(c, stats); } catch (e) { ok = false; }
      if (ok) {
        stats.missions[m.id] = true;
        newMissions.push(m);
      }
    });

    const rewards = checkRewards();
    rewards.newMissions = newMissions.concat(rewards.newMissions);

    saveStats();
    renderAll();
    return rewards;
  }

  // 记录数据文件数量（open() 写出的文件）
  function recordVfs(count) {
    if (!count || count <= (stats.vfsFiles || 0)) return null;
    stats.vfsFiles = count;
    const before = stats.missions.m_file;
    stats.missions.m_file = true;
    const rewards = checkRewards();
    if (!before) {
      rewards.newMissions.unshift(MISSIONS.filter(m => m.id === "m_file")[0]);
    }
    saveStats();
    renderAll();
    return { newMission: before ? null : MISSIONS.filter(m => m.id === "m_file")[0], newBadges: rewards.newBadges, newMedals: rewards.newMedals };
  }

  // ================= 记录：学完一课 =================
  function recordLesson(lesson, extra) {
    if (!lesson || !lesson.id) return null;
    const first = !stats.lessons[lesson.id];
    stats.lessons[lesson.id] = true;
    const stage = lesson.stage || 1;
    stats.lessonStage[stage] = (stats.lessonStage[stage] || 0) + (first ? 1 : 0);

    const today = todayStr();
    if (stats.lessonDay !== today) { stats.lessonDay = today; stats.lessonDayCount = 0; }
    if (first) {
      stats.lessonDayCount = (stats.lessonDayCount || 0) + 1;
      if (stats.lessonDayCount > (stats.lessonDayMax || 0)) stats.lessonDayMax = stats.lessonDayCount;
    }

    touchDay();
    rollDaily();
    bump("lesson");
    let gained = 0;
    if (first) { const r = addXp(15, "学完一课"); gained = r ? r.gain : 0; }

    const rewards = checkRewards();
    saveStats();
    renderAll();
    return {
      first: first, xp: gained,
      newBadges: rewards.newBadges, newMedals: rewards.newMedals,
      newMissions: rewards.newMissions, dailyDone: rewards.dailyDone,
      levelInfo: levelInfo(stats.xp)
    };
  }

  // 教程里的示例代码被运行过
  function recordLessonRun() {
    stats.lessonRuns = (stats.lessonRuns || 0) + 1;
    touchDay();
    rollDaily();
    bump("run");
    const rewards = checkRewards();
    saveStats();
    renderAll();
    return rewards;
  }

  // 课后小测答对
  function recordQuiz(correct) {
    if (!correct) { saveStats(); return []; }
    stats.quizCorrect = (stats.quizCorrect || 0) + 1;
    rollDaily();
    bump("quiz");
    addXp(3, "课后小测");
    const rewards = checkRewards();
    saveStats();
    renderAll();
    return rewards.newBadges;
  }

  function recordTurtleSave() {
    stats.turtleSaves = (stats.turtleSaves || 0) + 1;
    const rewards = checkRewards();
    saveStats();
    renderAll();
    return rewards;
  }

  // ================= 记录：练习题结果 =================
  /**
   * @param {{id:string, topic:string, level:number, passed:boolean, seconds?:number, attempts?:number}} result
   */
  function recordExercise(result) {
    const r = result || {};
    const id = String(r.id || "");
    if (!id) return null;
    const solvedBefore = !!stats.solved[id];
    const firstTryNow = r.passed && !stats.tried[id] && !solvedBefore;

    stats.tried[id] = (stats.tried[id] || 0) + 1;
    rollDaily();

    let gained = 0;
    if (r.passed) {
      stats.solved[id] = (stats.solved[id] || 0) + 1;
      const topic = r.topic || "";
      if (topic) stats.skill[topic] = (stats.skill[topic] || 0) + (solvedBefore ? 0 : 1);
      const lv = Number(r.level) || 1;
      stats.levelSolved[lv] = (stats.levelSolved[lv] || 0) + (solvedBefore ? 0 : 1);

      // 连对
      stats.combo = (stats.combo || 0) + 1;
      if (stats.combo > (stats.bestCombo || 0)) stats.bestCombo = stats.combo;
      if (firstTryNow) stats.firstTry = (stats.firstTry || 0) + 1;
      if (r.seconds && r.seconds <= 60) stats.fastSolve = (stats.fastSolve || 0) + 1;

      const today = todayStr();
      if (stats.solveDay !== today) { stats.solveDay = today; stats.solveDayCount = 0; }
      stats.solveDayCount = (stats.solveDayCount || 0) + 1;
      if (stats.solveDayCount > (stats.solveDayMax || 0)) stats.solveDayMax = stats.solveDayCount;

      if (!solvedBefore) { const x = addXp(8, "做对一题"); gained = x ? x.gain : 0; }
      else { const x = addXp(1, "复习一题"); gained = x ? x.gain : 0; }
      bump("solve");
    } else {
      stats.combo = 0;
    }

    touchDay();
    const rewards = checkRewards();
    saveStats();
    renderAll();
    return {
      solvedBefore: solvedBefore,
      firstTry: firstTryNow,
      xp: gained,
      newBadges: rewards.newBadges,
      newMedals: rewards.newMedals,
      newMissions: rewards.newMissions,
      dailyDone: rewards.dailyDone,
      levelInfo: levelInfo(stats.xp)
    };
  }

  // ================= 记录：模拟考 =================
  function recordExam(exam) {
    const e = exam || {};
    const record = {
      level: Number(e.level) || 1,
      score: Math.max(0, Math.min(100, Math.round(Number(e.score) || 0))),
      total: Math.max(1, Math.round(Number(e.total) || 10)),
      at: Date.now()
    };
    stats.exams.push(record);
    if (stats.exams.length > 60) stats.exams = stats.exams.slice(-60);
    touchDay();
    rollDaily();
    bump("exam");
    addXp(20, "参加模拟考");
    const rewards = checkRewards();
    saveStats();
    renderAll();
    return { record: record, newBadges: rewards.newBadges, newMedals: rewards.newMedals, newMissions: rewards.newMissions, dailyDone: rewards.dailyDone, levelInfo: levelInfo(stats.xp) };
  }

  // ================= 档案切换 =================
  function switchTo(id) {
    const target = profiles.find(p => p.id === id);
    if (!target || id === currentId) return;
    currentId = id;
    writeJson(CURRENT_KEY, currentId);
    stats = loadStats();
    rollDaily();
    if (typeof FileManager !== "undefined" && FileManager.setNamespace) {
      FileManager.setNamespace(currentId);
    }
    renderAll();
  }

  function createProfile(name, emoji) {
    const clean = String(name || "").trim().slice(0, 12) || ("小伙伴" + (profiles.length + 1));
    const id = "p_" + Date.now();
    profiles.push({ id: id, name: clean, emoji: emoji || EMOJIS[profiles.length % EMOJIS.length], createdAt: Date.now() });
    writeJson(PROFILES_KEY, profiles);
    switchTo(id);
    return id;
  }

  function renameProfile(name, emoji) {
    const me = profiles.find(p => p.id === currentId);
    if (!me) return;
    const clean = String(name || "").trim().slice(0, 12);
    if (clean) me.name = clean;
    if (emoji) me.emoji = emoji;
    writeJson(PROFILES_KEY, profiles);
    renderAll();
  }

  // ================= 渲染 =================
  function el(id) {
    return document.getElementById(id);
  }

  function starCount() {
    return MISSIONS.length;
  }

  function renderProfiles() {
    const row = el("profileRow");
    if (!row) return;
    row.innerHTML = "";
    profiles.forEach(p => {
      const btn = document.createElement("button");
      btn.className = "profile-chip" + (p.id === currentId ? " active" : "");
      btn.innerHTML = '<span class="profile-chip-emoji"></span><span class="profile-chip-name"></span>';
      btn.querySelector(".profile-chip-emoji").textContent = p.emoji;
      btn.querySelector(".profile-chip-name").textContent = p.name;
      btn.addEventListener("click", () => {
        switchTo(p.id);
        if (window.App && window.App.showToast) window.App.showToast("已切换到「" + p.name + "」的档案", p.emoji);
      });
      row.appendChild(btn);
    });
  }

  // 等级卡：头衔 + 经验条
  function renderLevel() {
    const box = el("levelCard");
    if (!box) return;
    const info = levelInfo(stats.xp);
    const solved = solvedCount(stats);
    const lessons = lessonCount(stats);
    box.innerHTML =
      '<div class="level-emoji"></div>' +
      '<div class="level-main">' +
      '  <div class="level-line"><span class="level-num"></span><span class="level-title"></span>' +
      '    <span class="level-xp"></span></div>' +
      '  <div class="level-bar"><div class="level-bar-fill"></div></div>' +
      '  <div class="level-sub"></div>' +
      '</div>';
    box.querySelector(".level-emoji").textContent = info.emoji;
    box.querySelector(".level-num").textContent = "Lv." + info.level;
    box.querySelector(".level-title").textContent = info.title;
    box.querySelector(".level-xp").textContent = info.isMax ? "已满级 ✨" : (info.cur + " / " + info.need + " 经验");
    box.querySelector(".level-bar-fill").style.width = info.percent + "%";
    box.querySelector(".level-sub").textContent =
      "🎓 学完 " + lessons + " 课 · ✅ 做对 " + solved + " 题 · 🏅 " + (stats.badges || []).length + " 徽章 · 🥇 " + (stats.medals || []).length + " 奖牌";
  }

  function renderStats() {
    const box = el("progressStats");
    if (!box) return;
    const done = doneCount(stats);
    const gotBadges = BADGES.filter(b => stats.badges.indexOf(b.id) !== -1).length;
    const gotMedals = MEDALS.filter(m => stats.medals.indexOf(m.id) !== -1).length;
    const info = levelInfo(stats.xp);
    const cards = [
      { label: "等级", value: "Lv." + info.level, emoji: info.emoji },
      { label: "总经验", value: stats.xp || 0, emoji: "✨" },
      { label: "学完课程", value: lessonCount(stats), emoji: "🎓" },
      { label: "做对练习", value: solvedCount(stats), emoji: "✅" },
      { label: "运行次数", value: stats.runs, emoji: "🚀" },
      { label: "成功次数", value: stats.successes, emoji: "🎯" },
      { label: "闯关任务", value: done + "/" + starCount(), emoji: "🎯" },
      { label: "徽章", value: gotBadges + "/" + BADGES.length, emoji: "🏅" },
      { label: "奖牌", value: gotMedals + "/" + MEDALS.length, emoji: "🥇" },
      { label: "连续学习", value: (stats.streak || 0) + " 天", emoji: "🔥" },
      { label: "学习天数", value: (stats.days || []).length, emoji: "📅" }
    ];
    box.innerHTML = "";
    cards.forEach(c => {
      const div = document.createElement("div");
      div.className = "stat-card";
      div.innerHTML = '<div class="stat-emoji"></div><div class="stat-value"></div><div class="stat-label"></div>';
      div.querySelector(".stat-emoji").textContent = c.emoji;
      div.querySelector(".stat-value").textContent = c.value;
      div.querySelector(".stat-label").textContent = c.label;
      box.appendChild(div);
    });
  }

  // 每日任务
  function renderDaily() {
    const box = el("dailyBox");
    if (!box) return;
    rollDaily();
    const tasks = dailyTasks();
    const doneAll = stats.daily.done.length >= tasks.length;
    box.innerHTML = "";
    const head = document.createElement("div");
    head.className = "daily-head";
    head.innerHTML = '<span>📋 今日任务</span><span class="daily-count"></span>';
    head.querySelector(".daily-count").textContent = stats.daily.done.length + "/" + tasks.length + (doneAll ? " 🎉 全清！" : "");
    box.appendChild(head);

    tasks.forEach(t => {
      const have = Math.min(stats.daily.progress[t.key] || 0, t.need);
      const ok = stats.daily.done.indexOf(t.id) !== -1;
      const row = document.createElement("div");
      row.className = "daily-row" + (ok ? " done" : "");
      row.innerHTML = '<span class="daily-state"></span><span class="daily-emoji"></span>' +
        '<span class="daily-body"><span class="daily-title"></span><span class="daily-bar"><span></span></span></span>' +
        '<span class="daily-xp"></span>';
      row.querySelector(".daily-state").textContent = ok ? "✅" : "⬜";
      row.querySelector(".daily-emoji").textContent = t.emoji;
      row.querySelector(".daily-title").textContent = t.title;
      row.querySelector(".daily-bar > span").style.width = Math.round(have / t.need * 100) + "%";
      row.querySelector(".daily-xp").textContent = "+" + t.xp + "✨";
      box.appendChild(row);
    });
  }

  function renderMissions() {
    const list = el("missionList");
    const label = el("missionProgress");
    if (!list) return;
    const done = doneCount(stats);
    if (label) label.textContent = "(" + done + "/" + starCount() + ")";
    list.innerHTML = "";
    MISSIONS.forEach(m => {
      const ok = !!stats.missions[m.id];
      const row = document.createElement("div");
      row.className = "mission-row" + (ok ? " done" : "");
      row.innerHTML = '<span class="mission-state"></span><span class="mission-emoji"></span>' +
        '<span class="mission-body"><span class="mission-title"></span><span class="mission-hint"></span></span>';
      row.querySelector(".mission-state").textContent = ok ? "✅" : "⬜";
      row.querySelector(".mission-emoji").textContent = m.emoji;
      row.querySelector(".mission-title").textContent = m.title;
      row.querySelector(".mission-hint").textContent = m.hint;
      list.appendChild(row);
    });
  }

  // 徽章：按分类折叠展示
  function renderBadges() {
    const box = el("badgeList");
    if (!box) return;
    box.innerHTML = "";
    const cats = [];
    BADGES.forEach(b => { if (cats.indexOf(b.cat) === -1) cats.push(b.cat); });
    cats.forEach(cat => {
      const group = BADGES.filter(b => b.cat === cat);
      const got = group.filter(b => stats.badges.indexOf(b.id) !== -1).length;
      const title = document.createElement("div");
      title.className = "badge-cat-title";
      title.textContent = cat + "  (" + got + "/" + group.length + ")";
      box.appendChild(title);
      const grid = document.createElement("div");
      grid.className = "badge-list";
      group.forEach(b => {
        const ok = stats.badges.indexOf(b.id) !== -1;
        const div = document.createElement("div");
        div.className = "badge-item" + (ok ? "" : " locked");
        div.title = b.title + "：" + b.desc;
        div.innerHTML = '<span class="badge-emoji"></span><span class="badge-title"></span><span class="badge-desc"></span>';
        div.querySelector(".badge-emoji").textContent = ok ? b.emoji : "🔒";
        div.querySelector(".badge-title").textContent = b.title;
        div.querySelector(".badge-desc").textContent = b.desc;
        grid.appendChild(div);
      });
      box.appendChild(grid);
    });
  }

  // 奖牌墙
  function renderMedals() {
    const box = el("medalList");
    if (!box) return;
    box.innerHTML = "";
    const cats = [];
    MEDALS.forEach(m => { if (cats.indexOf(m.category) === -1) cats.push(m.category); });
    cats.forEach(cat => {
      const group = MEDALS.filter(m => m.category === cat);
      const got = group.filter(m => stats.medals.indexOf(m.id) !== -1).length;
      const title = document.createElement("div");
      title.className = "badge-cat-title";
      title.textContent = cat + "  (" + got + "/" + group.length + ")";
      box.appendChild(title);
      const grid = document.createElement("div");
      grid.className = "medal-grid";
      group.forEach(m => {
        const ok = stats.medals.indexOf(m.id) !== -1;
        const d = document.createElement("div");
        d.className = "medal-item tier-" + (m.tier || "bronze") + (ok ? "" : " locked");
        d.title = m.title + "：" + m.desc;
        d.innerHTML = '<span class="medal-emoji"></span><span class="medal-title"></span>';
        d.querySelector(".medal-emoji").textContent = ok ? m.emoji : "🔒";
        d.querySelector(".medal-title").textContent = m.title;
        grid.appendChild(d);
      });
      box.appendChild(grid);
    });
  }

  function renderAll() {
    if (!stats) return;
    renderProfiles();
    renderLevel();
    renderStats();
    renderDaily();
    renderMissions();
    renderBadges();
    renderMedals();
    changeListeners.forEach(fn => { try { fn(); } catch (e) {} });
  }

  // ================= 面板事件 =================
  let editingId = null;

  function openEditor(profile) {
    const box = el("profileEditor");
    if (!box) return;
    box.style.display = "block";
    const input = el("profileNameInput");
    if (input) input.value = profile ? profile.name : "";
    editingId = profile ? profile.id : null;
    const row = el("profileEmojiRow");
    if (row) {
      row.innerHTML = "";
      const selected = profile ? profile.emoji : EMOJIS[(profiles.length) % EMOJIS.length];
      EMOJIS.forEach(e => {
        const b = document.createElement("button");
        b.className = "emoji-choice" + (e === selected ? " active" : "");
        b.textContent = e;
        b.addEventListener("click", () => {
          Array.prototype.forEach.call(row.querySelectorAll(".emoji-choice"), x => x.classList.remove("active"));
          b.classList.add("active");
        });
        row.appendChild(b);
      });
    }
    if (input) input.focus();
  }

  function closeEditor() {
    const box = el("profileEditor");
    if (box) box.style.display = "none";
    editingId = null;
  }

  function saveEditor() {
    const input = el("profileNameInput");
    const row = el("profileEmojiRow");
    const active = row ? row.querySelector(".emoji-choice.active") : null;
    const emoji = active ? active.textContent : null;
    if (editingId) {
      renameProfile(input ? input.value : "", emoji);
    } else {
      createProfile(input ? input.value : "", emoji);
    }
    closeEditor();
    if (window.App && window.App.showToast) window.App.showToast("档案已保存！", emoji || "🌟");
    try { SoundEffects.playSuccess(); } catch (e) {}
  }

  function openPanel() {
    renderAll();
    closeEditor();
    if (window.App && window.App.openMyPanel) { window.App.openMyPanel("profile"); return; }
    const modal = el("myPanel");
    if (modal) modal.classList.add("active");
    try { SoundEffects.playPop(); } catch (e) {}
  }

  function closePanel() {
    if (window.App && window.App.closeMyPanel) { window.App.closeMyPanel(); return; }
    const modal = el("myPanel");
    if (modal) modal.classList.remove("active");
  }

  function bindEvents() {
    const btnOpen = el("btnProgress");
    if (btnOpen) btnOpen.addEventListener("click", openPanel);
    const btnClose = el("btnProgressClose");
    if (btnClose) btnClose.addEventListener("click", closePanel);
    const modal = el("progressModal");
    if (modal) {
      modal.addEventListener("click", (e) => { if (e.target === modal) closePanel(); });
    }
    const btnNew = el("btnNewProfile");
    if (btnNew) btnNew.addEventListener("click", () => openEditor(null));
    const btnEdit = el("btnEditProfile");
    if (btnEdit) btnEdit.addEventListener("click", () => openEditor(profiles.find(p => p.id === currentId)));
    const btnCancel = el("btnProfileCancel");
    if (btnCancel) btnCancel.addEventListener("click", closeEditor);
    const btnSave = el("btnProfileSave");
    if (btnSave) btnSave.addEventListener("click", saveEditor);
  }

  // ================= 初始化 =================
  function init() {
    profiles = loadProfiles();
    currentId = readJson(CURRENT_KEY, "") || "";
    if (!profiles.some(p => p.id === currentId)) currentId = profiles[0].id;
    writeJson(CURRENT_KEY, currentId);
    stats = loadStats();
    rollDaily();

    // 老版本（还没有「成长档案」时）的作品库，迁移到默认小伙伴名下，别让孩子以为作品丢了
    try {
      const legacyKey = "codepanda_python_files_v1";
      const namespacedKey = legacyKey + "__" + currentId;
      const legacy = localStorage.getItem(legacyKey);
      if (legacy && !localStorage.getItem(namespacedKey) && currentId === profiles[0].id) {
        localStorage.setItem(namespacedKey, legacy);
        const legacyActive = localStorage.getItem("codepanda_active_file_id");
        if (legacyActive) {
          localStorage.setItem("codepanda_active_file_id__" + currentId, legacyActive);
        }
      }
    } catch (e) { /* 迁移失败也不影响使用 */ }

    if (typeof FileManager !== "undefined" && FileManager.setNamespace) {
      FileManager.setNamespace(currentId);
    }
    bindEvents();
    renderAll();
  }

  // 把「新成就」翻译成孩子看得懂的一行话，方便各处统一播报
  function describeRewards(rewards) {
    const out = [];
    if (!rewards) return out;
    (rewards.newMissions || []).forEach(m => { if (m) out.push("🎉 闯关成功【" + m.title + "】" + m.emoji); });
    (rewards.newBadges || []).forEach(b => out.push("🏅 新徽章【" + b.title + "】" + b.emoji));
    (rewards.newMedals || []).forEach(m => out.push("🥇 新奖牌【" + m.title + "】" + m.emoji));
    (rewards.dailyDone || []).forEach(t => out.push("📋 今日任务完成【" + t.title + "】+" + t.xp + "✨"));
    return out;
  }

  return {
    init,

    // 云同步应用远端数据后重新载入
    reload() {
      profiles = loadProfiles();
      stats = loadStats();
      rollDaily();
      renderAll();
    },

    // 档案 / 学习记录变化时通知外部（云同步、顶栏头像）
    onChange(fn) {
      changeListeners.push(fn);
    },

    recordRun,
    recordVfs,
    recordLesson,
    recordLessonRun,
    recordQuiz,
    recordExercise,
    recordExam,
    recordTurtleSave,

    // 查询
    getMissions: () => MISSIONS.map(m => ({ id: m.id, title: m.title, hint: m.hint, emoji: m.emoji, done: !!stats.missions[m.id] })),
    getBadges: () => BADGES.map(b => ({ id: b.id, title: b.title, desc: b.desc, emoji: b.emoji, cat: b.cat, got: stats.badges.indexOf(b.id) !== -1 })),
    getMedals: () => MEDALS.map(m => ({ id: m.id, title: m.title, desc: m.desc, emoji: m.emoji, tier: m.tier, category: m.category, got: stats.medals.indexOf(m.id) !== -1 })),
    getDomains: () => DOMAINS.map(d => ({ id: d.id, name: d.name, emoji: d.emoji, score: domainScore(stats, d) })),
    getDaily: () => {
      rollDaily();
      return dailyTasks().map(t => ({
        id: t.id, emoji: t.emoji, title: t.title, xp: t.xp, need: t.need,
        have: Math.min(stats.daily.progress[t.key] || 0, t.need),
        done: stats.daily.done.indexOf(t.id) !== -1
      }));
    },
    getLevel: () => levelInfo(stats.xp),
    /**
     * 学习中心的题目状态查询
     */
    isLessonDone: id => !!stats.lessons[id],
    isSolved: id => !!stats.solved[id],
    isTried: id => !!stats.tried[id],
    solvedInTopic: topic => topicSolved(stats, topic),
    getStats: () => stats,
    getCurrentProfile: () => profiles.find(p => p.id === currentId) || profiles[0],
    switchTo,
    createProfile,
    openPanel,
    closePanel,
    renderAll,
    describeRewards,
    addXp
  };
})();
