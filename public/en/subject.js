/* ============================================================================
 * 学科 manifest · 萌语岛 English Island
 *
 * 平台版（m.lihaiyang.net）自带这一份，**不指向任何外部站点**。
 * 英语站是 PWA（孩子可以"添加到主屏幕"），manifest 的 scope 绑在
 * /en/ 上，所以这个路径要一直保持稳定。
 * ========================================================================== */
(function () {
  "use strict";

  /* ==========================================================================
   * 每日任务池 —— 放在 manifest 里的原因只有一个：**大厅也要读**。
   *
   * 大厅加载的是各学科的 manifest（/en/subject.js），不是学科自己的 js/*。
   * 任务池留在 js/progress.js 里的话，大厅要么读不到，要么就得抄一份 ——
   * 而"抄一份"迟早会漂移：大厅说"答对 12 题"，孩子点进去看到"读 4 页绘本"，
   * 那比不显示更糟。
   *
   * 所以这里是**唯一一份**「英语今天哪三条任务」的实现：
   *   · 英语站自己的页面：js/progress.js 调 EN_DAILY.items()
   *   · 大厅的「今天各学科做什么」：平台层 peekLegacy("en") 调同一个函数
   * 同一天、同一档案，两边拿到的一定是同一批（大厅那条断言的依据）。
   *
   * ⚠️ 挑选算法必须和 js/ui.js 的 UI.pick() **逐位一致**（FNV-1a 哈希 +
   *    mulberry32），否则升级那一刻，孩子今天已经做了一半的任务会突然换一批。
   *    tools/en/e2e_learn.mjs 里有一条断言把 EN_DAILY.items() 和
   *    UI.pick(pool, 3, 同一个 seed) 对一遍 —— 两条实现分叉会立刻报红。
   * ======================================================================== */

  var DAILY_COUNT = 3;

  var DAILY_POOL = [
    { id: "d_words", emoji: "🆕", title: "学 5 个新词", key: "newWords", need: 5, xp: 20 },
    { id: "d_review", emoji: "🔁", title: "复习 10 张卡片", key: "reviews", need: 10, xp: 20 },
    { id: "d_listen", emoji: "👂", title: "听 10 个词", key: "listens", need: 10, xp: 15 },
    { id: "d_speak", emoji: "🎤", title: "跟读 5 次", key: "speaks", need: 5, xp: 25 },
    { id: "d_right", emoji: "✅", title: "答对 12 题", key: "right", need: 12, xp: 20 },
    { id: "d_game", emoji: "🎮", title: "玩 1 局小游戏", key: "games", need: 1, xp: 15 },
    { id: "d_phonics", emoji: "🧩", title: "学 1 关拼读", key: "phonics", need: 1, xp: 20 },
    { id: "d_page", emoji: "📖", title: "读 4 页绘本", key: "pages", need: 4, xp: 20 },
    { id: "d_star", emoji: "⭐", title: "拿 3 颗星", key: "stars", need: 3, xp: 20 },
    { id: "d_say", emoji: "⏱", title: "开口说满 60 秒", key: "speakSeconds", need: 60, xp: 25 }
  ];

  function hashSeed(str) {
    var h = 2166136261, s = String(str);
    for (var i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
    return h >>> 0;
  }
  function rng(seed) {
    var a = typeof seed === "number" ? seed : hashSeed(seed);
    return function () {
      a |= 0; a = a + 0x6D2B79F5 | 0;
      var t = Math.imul(a ^ a >>> 15, 1 | a);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }
  function pickN(arr, n, seed) {
    var a = (arr || []).slice(), r = rng(seed), i, j, t;
    for (i = a.length - 1; i > 0; i--) {
      j = Math.floor(r() * (i + 1));
      t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a.slice(0, n);
  }

  /** 今天的三条（返回池子里的原始条目，带 key / need / xp）。
   *  种子只跟"日期 + 档案"有关 —— 同一天反复打开拿到的是同一批。 */
  function items(dateStr, pid) {
    return pickN(DAILY_POOL, DAILY_COUNT, "daily:" + dateStr + ":" + (pid || "p_default"));
  }

  window.EN_DAILY = {
    pool: DAILY_POOL,
    count: DAILY_COUNT,
    hashSeed: hashSeed,
    pickN: pickN,
    items: items
  };

  // 英语站自己的存储前缀是 en_，进度键是 en_stats__<档案id>。
  // 同源，所以大厅可以直接读（这也是"以后能做家长中心"的原因）。
  // 读不到就返回 null，绝不影响卡片显示。
  function summary() {
    try {
      var pid = JSON.parse(localStorage.getItem("en_profile") || "null");
      if (!pid) return null;
      var raw = localStorage.getItem("en_stats__" + pid);
      if (!raw) return null;
      var stats = JSON.parse(raw) || {};
      var xp = Number(stats.xp) || 0;
      if (xp <= 0) return null;
      return { text: "经验 " + xp };
    } catch (e) {
      return null;
    }
  }

  if (typeof Platform === "undefined" || !Platform.register) {
    console.warn("[en] 平台注册表不可用，学科 manifest 已跳过");
    return;
  }

  Platform.register({
    id: "en",
    name: "萌语岛",
    emoji: "🌴",
    tagline: "每天 15 分钟：听 → 说 → 读 → 写 → 玩，单词自动进记忆盒",
    url: "/en/",
    accent: "#6A4C93",
    accentSoft: "#EDE4F5",
    grades: [1, 2, 3, 4],
    capabilities: ["srs", "speech", "audio"],   // 记忆盒 + 录音评测 + 音频精灵
    feedbackNote: "每天 15 分钟",
    summary: summary
  });
})();
