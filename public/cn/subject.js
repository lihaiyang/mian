/* ============================================================================
 * 学科 manifest · 汉字岛
 *
 * 定位和别的学科**不一样**：它是给**家长和老师**用的教学辅助，
 * 不是给孩子刷题的游戏。所以：
 *   · 主功能是「查字 / 看组词 / 生成字帖打印」
 *   · 成长规则刻意做得轻（不搞连续打卡和一堆徽章去逼孩子每天来）
 *
 * 数据是 3500 个常用字（按使用频率分 6 级），每字带拼音/笔画/部首/释义/常用组词。
 * 由 tools/cn/gen_chars.py 生成，来源与授权见那个脚本开头。
 * ========================================================================== */
(function () {
  "use strict";

  // 不提前返回：学科页面不加载大厅注册表，但成长规则必须照常定义
  if (typeof Platform !== "undefined" && Platform.register) Platform.register({
    id: "cn",
    name: "汉字岛",
    emoji: "📖",
    tagline: "3500 常用字的字表与词表 —— 查字、组词、打印字帖",
    url: "/cn/",
    accent: "#C4562F",
    accentSoft: "#F9E7DE",
    grades: [1, 2, 3, 4, 5, 6],
    summary: function () {
      try {
        var s = (typeof Store !== "undefined") ? Store.ns("cn").get("stats__p_default", null) : null;
        if (!s) return { level: 1, xp: 0 };
        return { level: (typeof Progress !== "undefined" && Progress.levelInfoOf)
          ? Progress.levelInfoOf(s.xp || 0).level : 1, xp: s.xp || 0 };
      } catch (e) { return { level: 1, xp: 0 }; }
    }
  });

  var defineWhenReady = function () {
    if (typeof Progress === "undefined") {
      console.warn("[cn] Progress 没加载，成长规则跳过");
      return;
    }
    Progress.define("cn", {
      // 这个学科是工具，不是练习册 —— 事件只统计"用了多少"，
      // 不做"每天必须来"的打卡压力。
      events: {
        lookup:   { xp: 1, counters: ["lookups"] },
        sheet:    { xp: 5, counters: ["sheets"] },
        browse:   { xp: 1, counters: ["browses"], when: function (e) { return (e.n || 0) >= 12; } }
      },

      badges: [
        { id: "cn_first", emoji: "🔍", title: "第一次查字", cat: "入门", desc: "查了第一个字",
          when: function (s) { return s.lookups >= 1; } },
        { id: "cn_50", emoji: "📖", title: "查过 50 个字", cat: "常用", desc: "累计查 50 个字",
          when: function (s) { return s.lookups >= 50; } },
        { id: "cn_300", emoji: "📚", title: "查过 300 个字", cat: "常用", desc: "累计查 300 个字",
          when: function (s) { return s.lookups >= 300; } },
        { id: "cn_sheet1", emoji: "🖨️", title: "第一张字帖", cat: "字帖", desc: "打印了第一张字帖",
          when: function (s) { return s.sheets >= 1; } },
        { id: "cn_sheet10", emoji: "✍️", title: "十张字帖", cat: "字帖", desc: "打印了 10 张字帖",
          when: function (s) { return s.sheets >= 10; } },
        { id: "cn_alllevel", emoji: "🗂️", title: "六级都看过", cat: "常用", desc: "六个级别都浏览过",
          when: function (s) {
            for (var i = 1; i <= 6; i++) if (!(s["lv" + i] >= 1)) return false;
            return true;
          } }
      ],

      medals: [
        { id: "cn_md_1", emoji: "🥉", tier: "bronze", title: "查了 100 个字", hint: "给孩子讲生字的时候顺手查",
          xp: 30, when: function (s) { return s.lookups >= 100; } },
        { id: "cn_md_2", emoji: "🥈", tier: "silver", title: "打印 5 张字帖", hint: "一天一张，一周就够了",
          xp: 40, when: function (s) { return s.sheets >= 5; } },
        { id: "cn_md_3", emoji: "🥇", tier: "gold", title: "查满 1000 个字", hint: "把常用字都过一遍",
          xp: 60, when: function (s) { return s.lookups >= 1000; } }
      ],

      // 给"陪读"设计：一天一两件，不逼人
      daily: [
        { id: "cn_d_1", emoji: "🔍", title: "查 5 个字", key: "lookups", need: 5, xp: 8 },
        { id: "cn_d_2", emoji: "🖨️", title: "打印 1 张字帖", key: "sheets", need: 1, xp: 12 },
        { id: "cn_d_3", emoji: "📖", title: "查 10 个字", key: "lookups", need: 10, xp: 12 }
      ]
    });
  };

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", defineWhenReady);
  else defineWhenReady();
})();
