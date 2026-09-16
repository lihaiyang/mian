/* ============================================================================
 * 学科 manifest · 萌码 Python
 *
 * 这是「学科契约」的一个真实样例。注意它有多短：
 * 等级、打卡、徽章、任务、云同步、家长报告全都不在这里——
 * 那些由平台层负责（见 docs/多学科平台架构设计.md 第 4 节）。
 * ========================================================================== */
(function () {
  "use strict";

  // 读 Python 站自己的进度，给大厅卡片显示一行摘要。
  // 读不到就返回 null —— 大厅会当没有这行，绝不能因为读不到而报错或卡片消失。
  // 注意：这里**故意不去算等级**。等级曲线长在 python/js/progress.js 里，
  // 在 manifest 里再抄一遍就是设计文档里警告的"漂移"。
  // 等 M1 把 progress.js 收进 shared/core/ 之后，等级徽章就是免费的了。
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

  // 平台注册表没加载出来时不要抛异常（仓库约定：模块缺失要能降级）
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
