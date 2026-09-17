/* ============================================================================
 * 学科 manifest · 拼音岛
 *
 * 平台契约的**第五个真实用户**（前面是键盘岛、数学岛、汉字岛、以及大厅自建）。
 * 和它们一样：等级、连续打卡、徽章墙、奖牌墙、云同步、家长报告 —— 这个文件
 * **一行都不写**，全部由平台层按下面的声明自动生成。
 *
 * 这个学科的特点在"听"：拼音是**听觉技能**，不是知识题。
 * 所以成长规则里给"听"单独记了一笔（pinyin_listen），
 * 而不只是记"答对几题"——愿意反复听，本身就是拼音学好的关键。
 *
 * 三件事：
 *   1. subject.js（本文件）：声明"我是什么" + 成长规则
 *   2. index.html + js/ + css/：拼音特有的界面（点读、四声、拼读）
 *   3. data/*.js + assets/audio/*：音节表与发音，由 tools/pinyin/ 生成并自检
 *
 * 后端和数据库**完全没动**。
 * ========================================================================== */
(function () {
  "use strict";

  // 不提前返回：学科页面不加载大厅注册表，但成长规则必须照常定义
  if (typeof Platform !== "undefined" && Platform.register) Platform.register({
    id: "pinyin",
    name: "拼音岛",
    emoji: "🅰️",
    tagline: "声母韵母、四声、拼读 —— 听准了才读得对",
    url: "/pinyin/",
    accent: "#E8735A",
    accentSoft: "#FCE8E3",
    grades: [1, 2],
    summary: function () {
      try {
        var s = (typeof Store !== "undefined") ? Store.ns("pinyin").get("stats__p_default", null) : null;
        if (!s) return { level: 1, xp: 0 };
        return { level: (typeof Progress !== "undefined" && Progress.levelInfoOf)
          ? Progress.levelInfoOf(s.xp || 0).level : 1, xp: s.xp || 0 };
      } catch (e) { return { level: 1, xp: 0 }; }
    }
  });

  var defineWhenReady = function () {
    if (typeof Progress === "undefined") {
      console.warn("[pinyin] Progress 没加载，成长规则跳过");
      return;
    }

    Progress.define("pinyin", {
      events: {
        // 点一次发音（愿意反复听 = 拼音学好的关键，给一点正反馈）
        pinyin_listen: { xp: 1, counters: ["listens"] },
        // 拼读题：答了就有分，答对更多
        pinyin_answer: { xp: 2, counters: ["answered"] },
        pinyin_correct: { xp: 3, counters: ["correct"] },
        // 做完一组（8 题）
        pinyin_round: { xp: 15, counters: ["rounds"] },
        pinyin_perfect: { xp: 20, counters: ["perfect"], when: function (e) { return !!e.perfect; } }
      },

      badges: [
        { id: "py_first", emoji: "👂", title: "第一次听音", cat: "入门", desc: "听了第一个拼音",
          when: function (s) { return s.listens >= 1; } },
        { id: "py_listen30", emoji: "🎧", title: "听了 30 次", cat: "入门", desc: "累计听 30 次发音",
          when: function (s) { return s.listens >= 30; } },
        { id: "py_listen200", emoji: "🔊", title: "听了 200 次", cat: "习惯", desc: "累计听 200 次发音",
          when: function (s) { return s.listens >= 200; } },
        { id: "py_c1", emoji: "🎉", title: "第一次拼对", cat: "入门", desc: "拼对第一个音节",
          when: function (s) { return s.correct >= 1; } },
        { id: "py_c20", emoji: "🌱", title: "拼对 20 个", cat: "练习", desc: "累计拼对 20 个音节",
          when: function (s) { return s.correct >= 20; } },
        { id: "py_c60", emoji: "🌿", title: "拼对 60 个", cat: "练习", desc: "累计拼对 60 个音节",
          when: function (s) { return s.correct >= 60; } },
        { id: "py_c150", emoji: "🌳", title: "拼对 150 个", cat: "练习", desc: "累计拼对 150 个音节",
          when: function (s) { return s.correct >= 150; } },
        { id: "py_round10", emoji: "📚", title: "做完十组", cat: "坚持", desc: "累计做完 10 组拼读",
          when: function (s) { return s.rounds >= 10; } },
        { id: "py_perfect1", emoji: "💯", title: "一组全对", cat: "准确", desc: "一组拼读一个不错",
          when: function (s) { return s.perfect >= 1; } },
        { id: "py_perfect5", emoji: "🎯", title: "五组全对", cat: "准确", desc: "累计五组全对",
          when: function (s) { return s.perfect >= 5; } },
        { id: "py_1000", emoji: "🏅", title: "千次听音", cat: "习惯", desc: "累计听 1000 次发音",
          when: function (s) { return s.listens >= 1000; } },
        { id: "py_500", emoji: "🚀", title: "拼对 500 个", cat: "练习", desc: "累计拼对 500 个音节",
          when: function (s) { return s.correct >= 500; } }
      ],

      medals: [
        { id: "py_md_1", emoji: "🥉", tier: "bronze", title: "听完一遍声母表", hint: "23 个声母，挨个点一遍",
          xp: 30, when: function (s) { return s.listens >= 23; } },
        { id: "py_md_2", emoji: "🥈", tier: "silver", title: "拼对 100 个音节", hint: "一天 8 个，两周就到了",
          xp: 45, when: function (s) { return s.correct >= 100; } },
        { id: "py_md_3", emoji: "🥇", tier: "gold", title: "拼对 400 个音节", hint: "把常用音节都过一遍",
          xp: 60, when: function (s) { return s.correct >= 400; } },
        { id: "py_md_4", emoji: "🎖️", tier: "silver", title: "做完 20 组", hint: "每天一组，坚持三周",
          xp: 50, when: function (s) { return s.rounds >= 20; } },
        { id: "py_md_5", emoji: "🏆", tier: "gold", title: "十组全对", hint: "听准了再选，别急",
          xp: 70, when: function (s) { return s.perfect >= 10; } },
        { id: "py_md_6", emoji: "🌟", tier: "gold", title: "听满 500 次", hint: "多听是拼音唯一的捷径",
          xp: 60, when: function (s) { return s.listens >= 500; } }
      ],

      // 每天从这个池子里按日期挑 3 条（同一天刷新也不会变）
      daily: [
        { id: "py_d_1", emoji: "👂", title: "听 10 次发音", key: "listens", need: 10, xp: 12 },
        { id: "py_d_2", emoji: "✏️", title: "拼对 8 个音节", key: "correct", need: 8, xp: 15 },
        { id: "py_d_3", emoji: "📚", title: "做完 1 组拼读", key: "rounds", need: 1, xp: 15 },
        { id: "py_d_4", emoji: "💯", title: "拿到 1 次全对", key: "perfect", need: 1, xp: 18 },
        { id: "py_d_5", emoji: "🎧", title: "听 20 次发音", key: "listens", need: 20, xp: 15 },
        { id: "py_d_6", emoji: "🔢", title: "拼对 20 个音节", key: "correct", need: 20, xp: 18 }
      ]
    });
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", defineWhenReady);
  } else {
    defineWhenReady();
  }
})();
