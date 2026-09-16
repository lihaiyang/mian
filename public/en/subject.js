/* ============================================================================
 * 学科 manifest · 萌语岛 English Island（指向老站）
 *
 * ⚠️ 和萌码 Python 一样：这个学科**不在平台版**，它指向老站
 *    https://mian.lihaiyang.net/en/
 *
 * 英语站是 PWA（已装在孩子的平板上），它的 manifest scope 绑在
 * mian.lihaiyang.net/en/ —— 换域名等于把已安装的应用卸载掉。
 * 而且孩子的进度和录音都在老站的库和那台设备的存储里。
 * ========================================================================== */
(function () {
  "use strict";

  // 同 python/subject.js：跨域名读不到老站的 localStorage，故意不写 summary()

  if (typeof Platform === "undefined" || !Platform.register) {
    console.warn("[en] 平台注册表不可用，学科 manifest 已跳过");
    return;
  }

  Platform.register({
    id: "en",
    name: "萌语岛",
    emoji: "🌴",
    tagline: "每天 15 分钟：听 → 说 → 读 → 写 → 玩，单词自动进记忆盒",
    url: "https://mian.lihaiyang.net/en/",   // ← 老站（PWA 装在这边）
    external: true,
    accent: "#6A4C93",
    accentSoft: "#EDE4F5",
    grades: [1, 2, 3, 4],
    capabilities: ["srs", "speech", "audio"],   // 记忆盒 + 录音评测 + 音频精灵
    feedbackNote: "每天 15 分钟"
  });
})();
