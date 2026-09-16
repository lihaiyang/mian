/* ============================================================================
 * 学科 manifest · 键盘岛（打字）
 *
 * 这是"加一个新学科"的第一个真实样本，也是平台契约的验收标准：
 * 看看这个文件有多长——等级、打卡、徽章墙、奖牌墙、云同步、家长报告
 * **一行都没有写**，全部由平台层根据下面的声明自动生成。
 *
 * 一共三件事：
 *   1. subject.js（本文件）：声明"我是什么" + 成长规则
 *   2. index.html + js/ + css/：本学科特有的界面（打字这件事本身）
 *   3. data/lessons.js：内容，由 tools/typing/gen_lessons.py 生成并校验
 *
 * 后端和数据库**完全没动**。
 * ========================================================================== */
(function () {
  "use strict";

  var STAGES = ["home", "top", "bottom", "num", "code", "words"];

  // 每个阶段单独声明一个"通关"事件（打准了才算），这样徽章能精确到阶段
  var stageEvents = {};
  STAGES.forEach(function (s) {
    stageEvents["clear_" + s] = { xp: 10, counters: ["clear_" + s] };
  });

  // 注意这两件事是**分开的**：
  //   * 在大厅里要 Platform.register（登记卡片）
  //   * 在学科页面里不需要登记，但**成长规则必须照常定义**
  // 早先这里写成"没有 Platform 就 return"，结果学科页面（不加载大厅注册表）
  // 整个文件直接退出，成长规则没定义，Progress.init() 当场崩。
  // 所以下面只是条件调用，不再提前返回。
  if (typeof Platform !== "undefined" && Platform.register) Platform.register({
    id: "typing",
    name: "键盘岛",
    emoji: "⌨️",
    tagline: "从盲打指法到编程符号，练出手感和速度",
    url: "/typing/",
    accent: "#4A5568",
    accentSoft: "#E7EAF0",
    grades: [2, 3, 4, 5, 6],
    capabilities: ["typing"],
    feedbackNote: "每天 10 分钟",

    // 大厅卡片上那一行：读自己的进度（读不到就返回 null，不影响卡片）
    summary: function () {
      try {
        if (typeof Store === "undefined") return null;
        var s = Store.ns("typing");
        var pid = s.get("profile", "p_default");
        var stats = s.get("stats__" + pid, null);
        if (!stats) return null;
        var xp = Number(stats.xp) || 0;
        if (xp <= 0) return null;
        return { text: "经验 " + xp };
      } catch (e) { return null; }
    }
  });

  // ---------------------------------------------------------------- 成长规则
  // 注意：这段必须在 define() 时交给平台，平台负责判定与展示。
  // 学科自己不写等级、不写打卡、不写徽章墙。

  var defineWhenReady = function () {
    if (typeof Progress === "undefined") {
      console.warn("[typing] Progress 没加载，成长规则跳过");
      return;
    }

    var events = Object.assign({
      // 打完一关（不论成绩）
      finish: { xp: 15, counters: ["sessions"], add: { chars: "chars" } },
      // 全对
      perfect: { xp: 15, counters: ["perfect"], when: function (e) { return (e.acc || 0) >= 100; } },
      // 达到这一关的目标速度
      fast: { xp: 10, counters: ["fast"], when: function (e) { return !!e.hitTarget; } },
      // 打的是编程符号/代码那一类
      code: { xp: 5, counters: ["codeSessions"], when: function (e) { return e.stageId === "code" || e.stageId === "words"; } }
    }, stageEvents);

    Progress.define("typing", {
      events: events,

      badges: [
        { id: "ty_first", emoji: "🎉", title: "第一次出手", cat: "入门", desc: "打完第一关",
          when: function (s) { return s.sessions >= 1; } },
        { id: "ty_10", emoji: "🔟", title: "十关达成", cat: "入门", desc: "打完 10 关",
          when: function (s) { return s.sessions >= 10; } },
        { id: "ty_50", emoji: "🏅", title: "五十关", cat: "坚持", desc: "打完 50 关",
          when: function (s) { return s.sessions >= 50; } },
        { id: "ty_200", emoji: "🎖️", title: "两百关", cat: "坚持", desc: "打完 200 关",
          when: function (s) { return s.sessions >= 200; } },

        { id: "ty_perfect1", emoji: "💯", title: "一个都没错", cat: "准确", desc: "某一关全对",
          when: function (s) { return s.perfect >= 1; } },
        { id: "ty_perfect10", emoji: "🎯", title: "稳如老手", cat: "准确", desc: "10 关全对",
          when: function (s) { return s.perfect >= 10; } },
        { id: "ty_perfect50", emoji: "🧿", title: "零失误大师", cat: "准确", desc: "50 关全对",
          when: function (s) { return s.perfect >= 50; } },

        { id: "ty_wpm20", emoji: "🐢", title: "上路了", cat: "速度", desc: "速度达到 20 WPM",
          when: function (s) { return s.bestWpm >= 20; } },
        { id: "ty_wpm30", emoji: "🐇", title: "越打越快", cat: "速度", desc: "速度达到 30 WPM",
          when: function (s) { return s.bestWpm >= 30; } },
        { id: "ty_wpm45", emoji: "⚡", title: "手速惊人", cat: "速度", desc: "速度达到 45 WPM",
          when: function (s) { return s.bestWpm >= 45; } },
        { id: "ty_wpm60", emoji: "🚀", title: "快到模糊", cat: "速度", desc: "速度达到 60 WPM",
          when: function (s) { return s.bestWpm >= 60; } },

        { id: "ty_chars1k", emoji: "✍️", title: "一千字", cat: "积累", desc: "累计打过 1000 个字符",
          when: function (s) { return s.chars >= 1000; } },
        { id: "ty_chars10k", emoji: "📚", title: "一万字", cat: "积累", desc: "累计打过 10000 个字符",
          when: function (s) { return s.chars >= 10000; } },
        { id: "ty_chars50k", emoji: "🏔️", title: "五万字", cat: "积累", desc: "累计打过 50000 个字符",
          when: function (s) { return s.chars >= 50000; } },

        { id: "ty_stage_home", emoji: "🏠", title: "找得到家", cat: "阶段", desc: "基准键位打准过关",
          when: function (s) { return s.clear_home >= 1; } },
        { id: "ty_stage_top", emoji: "⬆️", title: "向上够得着", cat: "阶段", desc: "上排打准过关",
          when: function (s) { return s.clear_top >= 1; } },
        { id: "ty_stage_bottom", emoji: "⬇️", title: "往下也不怕", cat: "阶段", desc: "下排打准过关",
          when: function (s) { return s.clear_bottom >= 1; } },
        { id: "ty_stage_num", emoji: "🔢", title: "数字也顺", cat: "阶段", desc: "数字与符号过关",
          when: function (s) { return s.clear_num >= 1; } },
        { id: "ty_stage_code", emoji: "🧩", title: "符号不慌", cat: "阶段", desc: "编程符号过关",
          when: function (s) { return s.clear_code >= 1; } },
        { id: "ty_stage_words", emoji: "📖", title: "连词成句", cat: "阶段", desc: "单词与短句过关",
          when: function (s) { return s.clear_words >= 1; } },
        { id: "ty_all_stages", emoji: "🌈", title: "六阶全通", cat: "阶段", desc: "六个阶段都打准过关",
          when: function (s) {
            return STAGES.every(function (x) { return (s["clear_" + x] || 0) >= 1; });
          } },

        { id: "ty_code50", emoji: "👨‍💻", title: "小小程序员", cat: "编程", desc: "代码类关卡打满 50 次",
          when: function (s) { return s.codeSessions >= 50; } },

        { id: "ty_streak3", emoji: "🔥", title: "连着三天", cat: "坚持", desc: "连续打卡 3 天",
          when: function (s) { return s.streak >= 3; } },
        { id: "ty_streak7", emoji: "🔥", title: "整整一周", cat: "坚持", desc: "连续打卡 7 天",
          when: function (s) { return s.streak >= 7; } },
        { id: "ty_streak30", emoji: "💎", title: "一个月", cat: "坚持", desc: "连续打卡 30 天",
          when: function (s) { return s.streak >= 30; } }
      ],

      medals: [
        { id: "ty_m_home", emoji: "🥉", title: "基准键位铜牌", tier: "bronze", desc: "基准键位 3 关都打准",
          when: function (s) { return (s.clear_home || 0) >= 3; } },
        { id: "ty_m_top", emoji: "🥈", title: "上排银牌", tier: "silver", desc: "上排 3 关都打准",
          when: function (s) { return (s.clear_top || 0) >= 3; } },
        { id: "ty_m_bottom", emoji: "🥈", title: "下排银牌", tier: "silver", desc: "下排 3 关都打准",
          when: function (s) { return (s.clear_bottom || 0) >= 3; } },
        { id: "ty_m_num", emoji: "🥈", title: "数字符号银牌", tier: "silver", desc: "数字与符号都打准",
          when: function (s) { return (s.clear_num || 0) >= 2; } },
        { id: "ty_m_code", emoji: "🥇", title: "编程符号金牌", tier: "gold", desc: "编程符号 3 关都打准",
          when: function (s) { return (s.clear_code || 0) >= 3; } },
        { id: "ty_m_words", emoji: "🥇", title: "连词成句金牌", tier: "gold", desc: "单词短句 3 关都打准",
          when: function (s) { return (s.clear_words || 0) >= 3; } },
        { id: "ty_m_speed", emoji: "⚡", title: "速度勋章", tier: "gold", desc: "速度达到 40 WPM",
          when: function (s) { return s.bestWpm >= 40; } },
        { id: "ty_m_typing", emoji: "🏆", title: "键盘岛通关", tier: "gold", desc: "六个阶段全部打准",
          when: function (s) {
            return STAGES.every(function (x) { return (s["clear_" + x] || 0) >= 1; });
          } }
      ],

      missions: [
        { id: "ty_ms_1", emoji: "🎯", title: "先打完 3 关", hint: "不用管速度，先把指法做对",
          xp: 20, when: function (s) { return s.sessions >= 3; } },
        { id: "ty_ms_2", emoji: "💯", title: "拿一次全对", hint: "慢一点，准确比快重要",
          xp: 30, when: function (s) { return s.perfect >= 1; } },
        { id: "ty_ms_3", emoji: "⌨️", title: "把六个阶段都摸一遍", hint: "每关都试试，找到自己最弱的那排键",
          xp: 40, when: function (s) {
            return STAGES.every(function (x) { return (s["clear_" + x] || 0) >= 0; }) && s.sessions >= 6;
          } },
        { id: "ty_ms_4", emoji: "🚀", title: "速度上 25", hint: "在不出错的前提下加快",
          xp: 50, when: function (s) { return s.bestWpm >= 25; } },
        { id: "ty_ms_5", emoji: "🧩", title: "编程符号全通", hint: "写代码的手感就靠这一组",
          xp: 60, when: function (s) { return (s.clear_code || 0) >= 3; } },
        { id: "ty_ms_6", emoji: "📚", title: "累计一万字", hint: "每天 10 分钟，很快就到了",
          xp: 80, when: function (s) { return s.chars >= 10000; } }
      ],

      // 每天从这个池子里按日期挑 3 条（同一天刷新也不会变）
      daily: [
        { id: "ty_d_1", emoji: "⌨️", title: "打完 2 关", key: "sessions", need: 2, xp: 10 },
        { id: "ty_d_2", emoji: "💯", title: "拿到 1 次全对", key: "perfect", need: 1, xp: 15 },
        { id: "ty_d_3", emoji: "✍️", title: "打满 300 个字符", key: "chars", need: 300, xp: 12 },
        { id: "ty_d_4", emoji: "🧩", title: "练 1 次编程符号", key: "codeSessions", need: 1, xp: 12 },
        { id: "ty_d_5", emoji: "⚡", title: "达到 1 次目标速度", key: "fast", need: 1, xp: 15 },
        { id: "ty_d_6", emoji: "🏁", title: "打完 4 关", key: "sessions", need: 4, xp: 20 }
      ]
    });
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", defineWhenReady);
  } else {
    defineWhenReady();
  }
})();
