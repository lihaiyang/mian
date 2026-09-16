/* ============================================================================
 * 萌学园 · 顶栏（全平台统一导航）
 *
 * 为什么要有这个文件：以前三个学科各写各的头部，结果
 *   · Python 页一个链接都没有，「回不去大厅」
 *   · 英语页的底部标签栏是「地图/复习/绘本/游戏/我的」，也没有大厅
 *   · 键盘岛自己写了一个「← 大厅」，长得又和别人不一样
 * 现在所有页面都用这里渲染，左边永远是「← 大厅」。
 *
 * 零依赖：Python / 英语页不加载平台的 store.js 和 registry.js，
 * 所以这个文件不能依赖它们，必须是纯 DOM 操作。
 *
 * 用法（在 <head> 里引 CSS，在 <body> 里留一个占位元素）：
 *   <link rel="stylesheet" href="/shared/styles/tokens.css">
 *   <link rel="stylesheet" href="/shared/styles/components.css">
 *   <script src="/shared/core/topbar.js"></script>
 *   <div id="topbar"></div>
 *   <script>
 *     Topbar.mount({
 *       mount: "#topbar",
 *       emoji: "⌨️", name: "键盘岛",
 *       accent: "#4A5568", accentSoft: "#EDEFF3",
 *       actions: [{ href: "/typing/", label: "我的进度", emoji: "📊" }]
 *     });
 *   </script>
 *
 * 注意：即使 JS 没跑起来，也应该在 HTML 里手写一个 <a href="/">← 大厅</a>
 * 兜底（见各学科页的 <noscript> 或静态回退）。顶栏是导航，不该依赖脚本。
 * ========================================================================== */
(function () {
  "use strict";

  function esc(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  }

  /** 生成顶栏的 HTML 字符串。返回字符串而不是直接插入，
   *  这样学科页可以把它拼进自己已有的 header 里（Python 就是这么用的）。 */
  function html(o) {
    o = o || {};
    var out = [];

    // 左边：返回大厅。学科页默认有；大厅自己没有（back:false）
    if (o.back !== false) {
      out.push(
        '<a class="topbar-back" href="/" title="回到大厅，换一个学科">',
        '<span class="tb-arrow" aria-hidden="true">←</span>',
        '<span>大厅</span>',
        '</a>'
      );
    }

    // 学科标识
    if (o.name) {
      out.push('<span class="topbar-brand">');
      if (o.emoji) {
        out.push('<span class="tb-emoji" aria-hidden="true">', esc(o.emoji), '</span>');
      }
      out.push('<span class="tb-name">', esc(o.name), '</span>');
      out.push('</span>');
    }

    out.push('<span class="topbar-spacer"></span>');

    // 右侧操作区
    var acts = o.actions || [];
    if (acts.length) {
      out.push('<span class="topbar-actions">');
      for (var i = 0; i < acts.length; i++) {
        var a = acts[i];
        var cls = a.cls || "btn ghost sm";
        var inner = (a.emoji ? '<span aria-hidden="true">' + esc(a.emoji) + "</span> " : "")
                  + esc(a.label);
        if (a.href) {
          var attrs = ' href="' + esc(a.href) + '"';
          if (a.target) attrs += ' target="' + esc(a.target) + '" rel="noopener"';
          out.push('<a class="' + esc(cls) + '"' + attrs
                 + (a.id ? ' id="' + esc(a.id) + '"' : "") + ">" + inner + "</a>");
        } else {
          out.push('<button type="button" class="' + esc(cls) + '"'
                 + (a.id ? ' id="' + esc(a.id) + '"' : "") + ">" + inner + "</button>");
        }
      }
      out.push('</span>');
    }
    return out.join("");
  }

  /** 把顶栏塞进页面。mount 可以是选择器或元素。附加类名用 extraClass。 */
  function mount(o) {
    o = o || {};
    var el = typeof o.mount === "string"
      ? document.querySelector(o.mount)
      : o.mount;
    if (!el) return null;

    // 学科主色只作用于顶栏内部，不污染整个页面（页面自己会覆盖 :root 的 --accent）
    if (o.accent) el.style.setProperty("--accent", o.accent);
    if (o.accentSoft) el.style.setProperty("--accent-soft", o.accentSoft);

    el.className = "topbar" + (o.extraClass ? " " + o.extraClass : "");
    el.innerHTML = html(o);
    return el;
  }

  window.Topbar = { html: html, mount: mount, esc: esc };
})();
