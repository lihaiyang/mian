/* ============================================================================
 * 萌学园 · 顶栏（全平台统一导航）
 *
 * 为什么要有这个文件：以前三个学科各写各的头部，结果
 *   · Python 页一个链接都没有，「回不去大厅」
 *   · 英语页的底部标签栏是「地图/复习/绘本/游戏/我的」，也没有大厅
 *   · 键盘岛自己写了一个「← 大厅」，长得又和别人不一样
 * 现在所有页面都用这里渲染。
 *
 * 统一后的形态（2026-09）：
 *
 *   [← 大厅]  🐼 萌码 Python · 学习中心     [🎓 学习中心]  [🟢就绪][☁️已同步][⚙️]
 *    └─ 返回       └─ 学科 + 当前子页        └─ 学科主操作    └─ 状态   └─ 设置
 *
 * 四条约定：
 *   1. 左边永远是「← 大厅」（大厅自己没有，它就是「家」）
 *   2. 学科名后面跟**当前子页**（"学习中心"、"复习"…），
 *      孩子才知道自己在哪 —— 以前四个页面的标题都是写死的学科名
 *   3. 学科自己的主操作最多 2 个，再多就进 ⚙️ 菜单
 *   4. 右侧三件套固定顺序：状态 → 设置。状态里包含同步，**不要另开一个同步按钮**
 *      （Python 以前就是「小熊猫档案」和「开启同步」两个按钮点开同一个面板）
 *
 * 零依赖：Python / 英语页不加载平台的 store.js 和 registry.js，
 * 所以这个文件不能依赖它们，必须是纯 DOM 操作。
 *
 * 用法：
 *   <link rel="stylesheet" href="/shared/styles/tokens.css">
 *   <link rel="stylesheet" href="/shared/styles/chrome.css">
 *   <script src="/shared/core/topbar.js"></script>
 *   <header id="topbar"><a class="topbar-back" href="/">← 大厅</a></header>
 *   <script>
 *     Topbar.mount({
 *       mount: "#topbar",
 *       emoji: "🐼", name: "萌码 Python",
 *       section: "学习中心",
 *       actions:  [{ id: "btnLearn", emoji: "🎓", label: "学习中心" }],
 *       status:   [{ id: "engineStatus", tone: "busy", emoji: "⏳", label: "加载中" },
 *                  { id: "syncStatus",   tone: "off",  emoji: "☁️", label: "未同步" }],
 *       settings: [{ id: "setTheme",  emoji: "🌙", label: "夜间模式" },
 *                  { id: "setAbout",  emoji: "ℹ️", label: "关于" }]
 *     });
 *     Topbar.setSection("练习");                       // 子页切换
 *     Topbar.setStatus("engineStatus", { tone: "ok", emoji: "🟢", label: "就绪" });
 *   </script>
 *
 * ⚠️ HTML 里必须手写一份静态兜底（上面那个 <header>），导航不该依赖脚本跑成功。
 * ========================================================================== */
(function () {
  "use strict";

  var esc = function (s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  };

  // 状态胶囊的色调 → CSS 用 [data-tone]
  //   ok 绿 / warn 黄 / bad 红 / busy 加载中（呼吸） / off 灰（未启用）
  var TONES = { ok: 1, warn: 1, bad: 1, busy: 1, off: 1 };

  var uid = 0;
  function nextId(prefix) { uid += 1; return prefix + "-" + uid; }

  /** 生成顶栏的 HTML 字符串。
   *  返回字符串而不是直接插入，这样学科页可以把它拼进自己已有的 header 里。 */
  function html(o) {
    o = o || {};
    var out = [];

    // ---- 左：返回大厅 ----
    // back:false 用于大厅自己（它就是「家」，没有上一层）
    // aria-label 是必要的：窄屏下「大厅」两个字会藏起来，只剩箭头，
    // 那时候读屏和悬浮提示只能靠这个标签。
    if (o.back !== false) {
      out.push(
        '<a class="topbar-back" href="/" aria-label="回到大厅" title="回到大厅，换一个学科">',
        '<span class="tb-arrow" aria-hidden="true">←</span>',
        '<span class="tb-back-label">大厅</span>',
        '</a>'
      );
    }

    // ---- 学科标识 + 当前子页 ----
    if (o.name) {
      out.push('<span class="topbar-brand">');
      if (o.emoji) {
        out.push('<span class="tb-emoji" aria-hidden="true">', esc(o.emoji), '</span>');
      }
      out.push('<span class="tb-name">', esc(o.name), '</span>');
      // 子页标题：随路由变，让孩子知道自己在哪
      out.push('<span class="tb-section" id="topbarSection"',
               o.section ? "" : ' hidden', '>',
               o.section ? '<span class="tb-dot" aria-hidden="true">·</span>' + esc(o.section) : "",
               '</span>');
      out.push('</span>');
    }

    out.push('<span class="topbar-spacer"></span>');

    // ---- 学科主操作（最多 2 个）----
    var acts = o.actions || [];
    if (acts.length) {
      out.push('<span class="topbar-actions">');
      for (var i = 0; i < acts.length; i++) {
        var a = acts[i];
        var cls = a.cls || "btn ghost sm";
        var inner = (a.emoji ? '<span class="tb-ico" aria-hidden="true">' + esc(a.emoji) + "</span>" : "")
                  + '<span class="tb-label">' + esc(a.label) + "</span>";
        var aid = a.id ? ' id="' + esc(a.id) + '"' : "";
        if (a.href) {
          out.push('<a class="' + esc(cls) + '" href="' + esc(a.href) + '"' + aid
                 + (a.target ? ' target="' + esc(a.target) + '" rel="noopener"' : "")
                 + ">" + inner + "</a>");
        } else {
          out.push('<button type="button" class="' + esc(cls) + '"' + aid + ">" + inner + "</button>");
        }
      }
      out.push('</span>');
    }

    // ---- 给学科自己塞内容的插槽（英语站把 #hud 搬进来）----
    if (o.hudHost) {
      out.push('<span class="topbar-hud" id="' + esc(o.hudHost === true ? "topbarHud" : o.hudHost) + '"></span>');
    }

    // ---- 右侧状态区：状态胶囊（含同步）----
    var st = o.status || [];
    if (st.length) {
      out.push('<span class="topbar-status">');
      for (var j = 0; j < st.length; j++) {
        var s = st[j];
        if (!s) continue;
        var tone = TONES[s.tone] ? s.tone : "off";
        // title 放长文案：窄屏只显示图标，鼠标悬停/读屏仍拿得到完整信息
        out.push(
          '<button type="button" class="status-pill" data-tone="' + tone + '"',
          s.id ? ' id="' + esc(s.id) + '"' : "",
          ' title="' + esc(s.title || s.label || "") + '"',
          s.label ? ' aria-label="' + esc(s.label) + '"' : "",
          ">",
          s.emoji ? '<span class="sp-ico" aria-hidden="true">' + esc(s.emoji) + "</span>" : "",
          s.label ? '<span class="sp-label">' + esc(s.label) + "</span>" : "",
          "</button>"
        );
      }
      out.push('</span>');
    }

    // ---- 设置 ----
    var set = o.settings || [];
    if (set.length) {
      out.push(
        '<span class="topbar-settings">',
        '<button type="button" class="topbar-gear" id="topbarGear"',
        ' aria-haspopup="true" aria-expanded="false" aria-label="设置" title="设置">',
        '<span aria-hidden="true">⚙️</span>',
        "</button>",
        '<div class="settings-menu" id="topbarMenu" role="menu" hidden>'
      );
      for (var k = 0; k < set.length; k++) {
        var m = set[k];
        var mid = m.id ? ' id="' + esc(m.id) + '"' : "";
        var inner2 = (m.emoji ? '<span class="sm-ico" aria-hidden="true">' + esc(m.emoji) + "</span>" : "")
                   + '<span class="sm-label">' + esc(m.label) + "</span>"
                   + (m.note ? '<span class="sm-note">' + esc(m.note) + "</span>" : "");
        if (m.href) {
          out.push('<a class="settings-item" role="menuitem" href="' + esc(m.href) + '"' + mid + ">"
                 + inner2 + "</a>");
        } else {
          out.push('<button type="button" class="settings-item" role="menuitem"' + mid + ">"
                 + inner2 + "</button>");
        }
        if (m.sepAfter) out.push('<div class="settings-sep" role="separator"></div>');
      }
      out.push("</div></span>");
    }

    return out.join("");
  }

  // 保存最后一次 mount 的配置，供 setSection / setStatus 使用
  var current = { el: null, o: null };

  /** 给一对「齿轮按钮 + 菜单」接上开合行为。
   *  导出来是给「不用 Topbar.mount 渲染整条顶栏」的页面用的：
   *  Python 的顶栏每个控件都被自己的 JS 绑着，所以它保留自有 DOM，
   *  只借用这个菜单组件。 */
  function bindMenu(gear, menu) {
    if (!gear || !menu) return;

    function close() {
      menu.hidden = true;
      gear.setAttribute("aria-expanded", "false");
    }
    function open() {
      menu.hidden = false;
      gear.setAttribute("aria-expanded", "true");
      var first = menu.querySelector(".settings-item");
      if (first) first.focus({ preventScroll: true });
    }
    // 幂等：重复 bind 不会叠加监听
    if (gear.dataset.menuBound === "1") return;
    gear.dataset.menuBound = "1";

    gear.addEventListener("click", function (ev) {
      ev.stopPropagation();
      if (menu.hidden) open(); else close();
    });
    // 点菜单里的东西之后自动收起
    menu.addEventListener("click", function () {
      close();
      gear.focus({ preventScroll: true });
    });
    // 点外面 / 按 Esc 收起
    document.addEventListener("click", function (ev) {
      if (!menu.hidden && !menu.contains(ev.target) && ev.target !== gear
          && !gear.contains(ev.target)) close();
    });
    document.addEventListener("keydown", function (ev) {
      if (ev.key === "Escape" && !menu.hidden) { close(); gear.focus({ preventScroll: true }); }
    });
  }

  /** 把顶栏塞进页面。mount 可以是选择器或元素。 */
  function mount(o) {
    o = o || {};
    var el = typeof o.mount === "string" ? document.querySelector(o.mount) : o.mount;
    if (!el) return null;

    // 学科主色只作用于顶栏内部，不污染整个页面（页面自己会覆盖 :root 的 --accent）
    if (o.accent) el.style.setProperty("--accent", o.accent);
    if (o.accentSoft) el.style.setProperty("--accent-soft", o.accentSoft);

    el.className = "topbar" + (o.extraClass ? " " + o.extraClass : "");
    el.innerHTML = html(o);
    bindMenu(el.querySelector("#topbarGear"), el.querySelector("#topbarMenu"));

    // 挂上之后状态胶囊才有 id，学科这时才能绑事件
    if (typeof o.onMount === "function") o.onMount(el);

    current = { el: el, o: o };
    return el;
  }

  /** 更新某个元素里的「当前子页」。传空字符串则隐藏那一段。
   *  通常直接用 setSection；这个泛化版本给自建顶栏的页面用（Python）。 */
  function setSectionEl(el, text) {
    if (typeof el === "string") el = document.querySelector(el);
    if (!el) return;
    if (text) {
      el.innerHTML = '<span class="tb-dot" aria-hidden="true">·</span>' + esc(text);
      el.hidden = false;
    } else {
      el.textContent = "";
      el.hidden = true;
    }
  }

  /** 更新已挂载顶栏的「当前子页」。 */
  function setSection(text) {
    setSectionEl(current.el && current.el.querySelector("#topbarSection"), text);
  }

  /** 更新一个状态胶囊。patch 形如 {tone, emoji, label, title}。 */
  function setStatus(id, patch) {
    var el = document.getElementById(id);
    if (!el) return;
    patch = patch || {};
    if (patch.tone && TONES[patch.tone]) el.dataset.tone = patch.tone;
    if (patch.emoji != null) {
      var ico = el.querySelector(".sp-ico");
      if (ico) ico.textContent = patch.emoji;
    }
    if (patch.label != null) {
      var lab = el.querySelector(".sp-label");
      if (lab) lab.textContent = patch.label;
      el.setAttribute("aria-label", patch.label);
    }
    if (patch.title != null || patch.label != null) {
      el.title = patch.title != null ? patch.title : (patch.label || "");
    }
  }

  window.Topbar = {
    html: html,
    mount: mount,
    bindMenu: bindMenu,          // 自建顶栏的页面只借菜单组件时用
    setSection: setSection,
    setSectionEl: setSectionEl,  // 同上，指定元素
    setStatus: setStatus,
    esc: esc
  };
})();
