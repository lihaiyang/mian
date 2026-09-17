/* ============================================================================
 * 学科 manifest · 数学岛
 *
 * 平台契约的**第二个真实用户**（第一个是键盘岛）。和它一样：
 * 等级、连续打卡、徽章墙、奖牌墙、云同步、家长报告 —— 这个文件
 * **一行都不写**，全部由平台层按下面的声明自动生成。
 *
 * 三件事：
 *   1. subject.js（本文件）：声明"我是什么" + 成长规则
 *   2. index.html + js/ + css/：数学特有的界面（出题、答题、对答案）
 *   3. data/problems.js：1025 道题，由 tools/math/gen_problems.py 生成并自检
 *
 * 后端和数据库**完全没动**。
 * ========================================================================== */
(function () {
  "use strict";

  // 注意这两件事是**分开的**：
  //   * 在大厅里要 Platform.register（登记卡片）
  //   * 在学科页面里不需要登记，但**成长规则必须照常定义**
  // 早先键盘岛写成"没有 Platform 就 return"，结果学科页面（不加载大厅注册表）
  // 整个文件直接退出，成长规则没定义，Progress.init() 当场崩。
  // 所以下面只是条件调用，**不提前返回**。
  if (typeof Platform !== "undefined" && Platform.register) Platform.register({
    id: "math",
    name: "数学岛",
    emoji: "🔢",
    tagline: "口算、竖式、应用题、图形 —— 把算术练成直觉",
    url: "/math/",
    accent: "#2E9E8F",
    accentSoft: "#DFF3EF",
    grades: [1, 2, 3, 4, 5, 6],
    summary: function () {
      // 大厅卡片上显示的进度。读平台存储（不带就显示 0）。
      try {
        var s = (typeof Store !== "undefined") ? Store.ns("math").get("stats__p_default", null) : null;
        if (!s) return { level: 1, xp: 0 };
        return { level: (typeof Progress !== "undefined" && Progress.levelInfoOf)
          ? Progress.levelInfoOf(s.xp || 0).level : 1, xp: s.xp || 0 };
      } catch (e) { return { level: 1, xp: 0 }; }
    }
  });

  var GRADES = [1, 2, 3, 4, 5, 6];

  var defineWhenReady = function () {
    if (typeof Progress === "undefined") {
      console.warn("[math] Progress 没加载，成长规则跳过");
      return;
    }

    var events = {
      // 答完一题（不论对错）—— 只要肯做就给正反馈
      answer: { xp: 2, counters: ["answered"] },
      // 答对
      correct: { xp: 3, counters: ["correct"] },
      // 做满一组（默认 10 题）
      round: { xp: 15, counters: ["rounds"] },
      // 一组全对
      perfect: { xp: 20, counters: ["perfect"], when: function (e) { return !!e.perfect; } },
      // 生成一张可打印的题卡（家长/老师用，和做题是两条通道）
      sheet: { xp: 4, counters: ["sheets"] },
      // 专题计数：数学岛在答对时会 emit "correct_frac" / "correct_dec" / "correct_word"。
      // ⚠️ 事件名必须在这里声明，否则 Progress.emit 会**静默丢掉**（只打一句 console.warn），
      // 于是"分数小能手""小数小能手""应用题达人"三个徽章和"做对 3 道应用题"这个每日任务
      // 永远拿不到计数、永远解锁不了。
      correct_frac: { xp: 1, counters: ["frac_correct"] },
      correct_dec: { xp: 1, counters: ["dec_correct"] },
      correct_word: { xp: 1, counters: ["word_correct"] }
    };
    // 每个年级一条"通关"事件，徽章能精确到年级
    GRADES.forEach(function (g) {
      events["clear_g" + g] = { xp: 25, counters: ["clear_g" + g] };
    });

    Progress.define("math", {
      events: events,

      badges: [
        { id: "ma_first", emoji: "🎉", title: "第一次出手", cat: "入门", desc: "做对第一道题",
          when: function (s) { return s.correct >= 1; } },
        { id: "ma_10", emoji: "🔟", title: "十题不误", cat: "入门", desc: "累计做对 10 题",
          when: function (s) { return s.correct >= 10; } },
        { id: "ma_50", emoji: "💪", title: "五十题", cat: "练习", desc: "累计做对 50 题",
          when: function (s) { return s.correct >= 50; } },
        { id: "ma_200", emoji: "🏅", title: "两百题", cat: "练习", desc: "累计做对 200 题",
          when: function (s) { return s.correct >= 200; } },
        { id: "ma_500", emoji: "🚀", title: "五百题", cat: "练习", desc: "累计做对 500 题",
          when: function (s) { return s.correct >= 500; } },
        { id: "ma_perfect", emoji: "💯", title: "一组全对", cat: "准确", desc: "一组题一道不错",
          when: function (s) { return s.perfect >= 1; } },
        { id: "ma_perfect5", emoji: "🎯", title: "五组全对", cat: "准确", desc: "累计五组全对",
          when: function (s) { return s.perfect >= 5; } },
        { id: "ma_streak10", emoji: "🔥", title: "连对十题", cat: "准确", desc: "一口气连对 10 题",
          when: function (s) { return s.bestStreak >= 10; } },
        { id: "ma_streak20", emoji: "⚡", title: "连对二十题", cat: "准确", desc: "一口气连对 20 题",
          when: function (s) { return s.bestStreak >= 20; } },
        { id: "ma_round10", emoji: "📚", title: "做完十组", cat: "坚持", desc: "累计做完 10 组",
          when: function (s) { return s.rounds >= 10; } },
        { id: "ma_g1", emoji: "1️⃣", title: "一年级通关", cat: "年级", desc: "把一年级的单元都做过",
          when: function (s) { return s.clear_g1 >= 1; } },
        { id: "ma_g2", emoji: "2️⃣", title: "二年级通关", cat: "年级", desc: "把二年级的单元都做过",
          when: function (s) { return s.clear_g2 >= 1; } },
        { id: "ma_g3", emoji: "3️⃣", title: "三年级通关", cat: "年级", desc: "把三年级的单元都做过",
          when: function (s) { return s.clear_g3 >= 1; } },
        { id: "ma_g4", emoji: "4️⃣", title: "四年级通关", cat: "年级", desc: "把四年级的单元都做过",
          when: function (s) { return s.clear_g4 >= 1; } },
        { id: "ma_g5", emoji: "5️⃣", title: "五年级通关", cat: "年级", desc: "把五年级的单元都做过",
          when: function (s) { return s.clear_g5 >= 1; } },
        { id: "ma_g6", emoji: "6️⃣", title: "六年级通关", cat: "年级", desc: "把六年级的单元都做过",
          when: function (s) { return s.clear_g6 >= 1; } },
        { id: "ma_frac", emoji: "🍰", title: "分数小能手", cat: "专题", desc: "分数单元做对 30 题",
          when: function (s) { return (s.frac_correct || 0) >= 30; } },
        { id: "ma_decimal", emoji: "🔬", title: "小数小能手", cat: "专题", desc: "小数单元做对 30 题",
          when: function (s) { return (s.dec_correct || 0) >= 30; } },
        { id: "ma_word", emoji: "🧩", title: "应用题达人", cat: "专题", desc: "应用题做对 30 题",
          when: function (s) { return (s.word_correct || 0) >= 30; } },
        { id: "ma_sheet1", emoji: "🖨️", title: "第一张题卡", cat: "打印", desc: "生成第一张可打印的题卡",
          when: function (s) { return (s.sheets || 0) >= 1; } },
        { id: "ma_sheet10", emoji: "📄", title: "十张题卡", cat: "打印", desc: "累计生成 10 张题卡",
          when: function (s) { return (s.sheets || 0) >= 10; } },
        { id: "ma_allgrade", emoji: "👑", title: "六个年级都摸过", cat: "坚持", desc: "每个年级都做过题",
          when: function (s) {
            return GRADES.every(function (g) { return (s["clear_g" + g] || 0) >= 1; });
          } }
      ],

      medals: [
        { id: "ma_md_1", emoji: "🥉", tier: "bronze", title: "做完第一组", hint: "一组 10 题，做完就有",
          xp: 30, when: function (s) { return s.rounds >= 1; } },
        { id: "ma_md_2", emoji: "🥈", tier: "silver", title: "做对一百题", hint: "一天 10 题，十天就到了",
          xp: 45, when: function (s) { return s.correct >= 100; } },
        { id: "ma_md_3", emoji: "🥇", tier: "gold", title: "做对五百题", hint: "把六个年级都练一遍",
          xp: 60, when: function (s) { return s.correct >= 500; } },
        { id: "ma_md_4", emoji: "🏆", tier: "gold", title: "十个单元通关", hint: "每个年级都别落下",
          xp: 60, when: function (s) {
            var n = 0;
            GRADES.forEach(function (g) { if ((s["clear_g" + g] || 0) >= 1) n++; });
            return n >= 6;
          } },
        { id: "ma_md_5", emoji: "🎖️", tier: "silver", title: "连对二十题", hint: "慢一点，先看清题",
          xp: 45, when: function (s) { return s.bestStreak >= 20; } },
        { id: "ma_md_6", emoji: "🌟", tier: "gold", title: "一组全对十次", hint: "准确比速度重要",
          xp: 70, when: function (s) { return s.perfect >= 10; } }
      ],

      // 每天从这个池子里按日期挑 3 条（同一天刷新也不会变）
      daily: [
        { id: "ma_d_1", emoji: "🔢", title: "做对 10 道题", key: "correct", need: 10, xp: 12 },
        { id: "ma_d_2", emoji: "📚", title: "做完 1 组", key: "rounds", need: 1, xp: 15 },
        { id: "ma_d_3", emoji: "💯", title: "拿到 1 次全对", key: "perfect", need: 1, xp: 18 },
        { id: "ma_d_4", emoji: "✏️", title: "做满 20 道题", key: "answered", need: 20, xp: 15 },
        { id: "ma_d_5", emoji: "🔥", title: "连对 8 题", key: "bestStreakToday", need: 8, xp: 20 },
        { id: "ma_d_6", emoji: "🧩", title: "做对 3 道应用题", key: "word_correct", need: 3, xp: 18 },
        { id: "ma_d_7", emoji: "🖨️", title: "打印 1 张题卡", key: "sheets", need: 1, xp: 12 }
      ]
    });
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", defineWhenReady);
  } else {
    defineWhenReady();
  }
})();
