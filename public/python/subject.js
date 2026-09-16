/* ============================================================================
 * 学科 manifest · 萌码 Python（指向老站）
 *
 * ⚠️ 这个学科**不在平台版**，它指向老站 https://mian.lihaiyang.net/
 *
 * 为什么：平台版和老站是两个 Cloudflare Pages 项目、两个数据库、两套账号。
 * 孩子**真实**的作品和进度在老站里；平台版虽然也部署了一份同样的代码，
 * 但那份连的是空库——孩子在那儿登录同一个同步码会看到空作品库。
 * 所以大厅必须把他送到有数据的那一边。
 *
 * 长期怎么合、要不要迁数据，见 docs/多学科平台架构设计.md 第 5.3 节。
 * ========================================================================== */
(function () {
  "use strict";

  // 这里**故意没有 summary()**：跨域名读不到老站的 localStorage
  // （浏览器按 origin 隔离），写了也只会永远返回 null。
  // 所以这张卡片不显示"经验 N" —— 想知道进度就点进去看。

  if (typeof Platform === "undefined" || !Platform.register) {
    console.warn("[python] 平台注册表不可用，学科 manifest 已跳过");
    return;
  }

  Platform.register({
    id: "python",
    name: "萌码 Python",
    emoji: "🐼",
    tagline: "在奇幻工坊里写代码：54 课教程、145 个示例、1318 道练习题",
    url: "https://mian.lihaiyang.net/",     // ← 老站（数据在那边）
    external: true,
    accent: "#3B7DD8",
    accentSoft: "#E3EEFB",
    grades: [3, 4, 5, 6],
    capabilities: ["judge"],          // 需要判题能力（Pyodide）
    feedbackNote: "GESP 考级"
  });
})();
