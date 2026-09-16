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
    "/math/subject.js"
  ],

  planned: [
    {
      id: "pinyin", name: "拼音岛", emoji: "🅰️",
      tagline: "声母韵母、四声、拼读 —— 听准了才读得对",
      accent: "#E8735A", accentSoft: "#FCE8E3",
      grades: [1, 2]
    },
    {
      id: "chinese", name: "汉字岛", emoji: "📖",
      tagline: "认字、笔顺、组词、古诗、阅读理解",
      accent: "#C4562F", accentSoft: "#F9E7DE",
      grades: [1, 2, 3, 4, 5, 6]
    }
  ]
};
