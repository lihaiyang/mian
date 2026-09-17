/* ============================================================================
 * 萌学园 · 学科清单
 *
 * 这个文件是「加一个学科」唯一需要动的公共文件。
 *
 *   manifests —— 已经有独立目录的学科，写它的 manifest 路径。
 *                每个 manifest 自己调用 Platform.register()。
 *   planned   —— 还没开始做的学科，直接在这里写成占位（不需要目录），
 *                大厅会把它渲染成「敬请期待」的卡片，让孩子知道还有的玩。
 *
 * 顺序 = 大厅里的展示顺序。
 * ========================================================================== */
window.MIAN_SUBJECTS = {
  manifests: [
    "/python/subject.js",
    "/en/subject.js",
    "/typing/subject.js",
    "/math/subject.js",
    "/cn/subject.js",
    "/pinyin/subject.js"
  ],

  // 目前没有"敬请期待"的学科了 —— 五个学科全部上线
  planned: []
};
