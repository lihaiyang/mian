/* ============================================================================
 * 学科 manifest · 萌码 Python
 *
 * 平台版（m.lihaiyang.net）自带这一份，**不指向任何外部站点**。
 * 所有学科都在同一个域下，所以：
 *   * 大厅、学科、家长中心同源 —— localStorage 共享，卡片能直接读出进度
 *   * 账号是平台版自己库里的（与老站完全无关）
 *
 * 等级、打卡、徽章、任务、云同步、家长报告都不在这个文件里——
 * 那些由平台层负责（见 docs/多学科平台架构设计.md 第 4 节）。
 * ========================================================================== */
(function () {
  "use strict";

  // 读本学科的进度，给大厅卡片显示一行摘要。
  // 读不到就返回 null —— 大厅会当没有这行，绝不能因为读不到而报错或卡片消失。
  // 注意：这里**故意不去算等级**。等级曲线长在 python/js/progress.js 里，
  // 在 manifest 里再抄一遍就是设计文档里警告的"漂移"。
  // 等把 python 的 progress.js 收进 shared/core/ 之后，等级徽章就是免费的了。
  function summary() {
    try {
      var pid = JSON.parse(localStorage.getItem("codepanda_current_profile_v1") || "null");
      if (!pid) return null;
      var raw = localStorage.getItem("codepanda_stats_v1_" + pid);
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
    console.warn("[python] 平台注册表不可用，学科 manifest 已跳过");
    return;
  }

  Platform.register({
    id: "python",
    name: "萌码 Python",
    emoji: "🐼",
    tagline: "在奇幻工坊里写代码：54 课教程、145 个示例、1318 道练习题",
    url: "/python/",
    accent: "#3B7DD8",
    accentSoft: "#E3EEFB",
    grades: [3, 4, 5, 6],
    capabilities: ["judge"],          // 需要判题能力（Pyodide）
    feedbackNote: "GESP 考级",
    summary: summary
  });
})();
