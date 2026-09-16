/* ============================================================================
 * 学科 manifest · 萌语岛 English Island
 *
 * 注意 url 是 "/en/" —— 这个路径**故意保持不变**：
 * 英语站是 PWA，已经装在孩子的平板上，manifest 的 scope 绑在 /en/。
 * 一改路径就等于把已安装的应用卸载掉。
 * ========================================================================== */
(function () {
  "use strict";

  // 英语站的存储前缀是 "en_"，进度键是 en_stats__<档案id>。
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
    // 注意：不用 🐼 —— 萌码 Python 已经用了熊猫，
    // 大厅里两张卡同图标会让孩子分不清。岛 + 旅行手账的风格用 🌴 更贴。
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
