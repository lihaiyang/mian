/* ============================================================================
 * 萌学园 · 平台注册表（shared/core/registry.js）
 *
 * 这是「学科契约」的落地处。学科只负责声明自己是什么（manifest），
 * 大厅、学科切换、"继续上次"、以及将来的家长中心都由这里统一处理。
 *
 * 加一个新学科 = 建一个目录 + 写一份 subject.js + 在 shared/subjects.js 里加一行。
 * 不需要改这个文件。如果你发现必须改这里，说明契约没设计好
 * （见 docs/多学科平台架构设计.md 第 4.1 节）。
 *
 * 约定（沿用仓库既有习惯）：
 *   - 零构建、IIFE、挂到 window
 *   - 顶层 const 不挂 window，跨模块一律 typeof 判断后调用
 *   - 任何模块缺失都要能降级，不抛异常
 * ========================================================================== */
(function () {
  "use strict";

  var NS = "mian_platform_v1";     // 平台自己的存储命名空间
  var LAST_KEY = NS + "__last";    // 上次进入的学科

  var subjects = [];               // 已注册的 manifest
  var byId = {};

  // ---------------------------------------------------------------- 工具

  function esc(s) {
    return String(s === undefined || s === null ? "" : s)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  }

  function readStore(key, fallback) {
    try {
      var raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (e) { return fallback; }
  }

  function writeStore(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch (e) {}
  }

  // ---------------------------------------------------------------- 注册

  /**
   * 学科调用这个函数把自己登记进来。
   * 只有 id / name / url 是必填的，其余都有安全默认值——
   * 一个刚开始写的学科也应该能出现在大厅里，而不是直接消失。
   */
  function register(manifest) {
    if (!manifest || !manifest.id) {
      console.warn("[Platform] 学科 manifest 缺少 id，已忽略：", manifest);
      return;
    }
    // 「计划中」的学科还没有目录，所以不要求 url；能进入的学科必须有 url
    var isPlanned = manifest.ready === false;
    if (!isPlanned && !manifest.url) {
      console.warn("[Platform] 可进入的学科缺少 url，已忽略：", manifest.id);
      return;
    }
    if (byId[manifest.id]) {
      console.warn("[Platform] 学科 id 重复，后一个被忽略：", manifest.id);
      return;
    }
    var m = {
      id: manifest.id,
      name: manifest.name || manifest.id,
      emoji: manifest.emoji || "📘",
      tagline: manifest.tagline || "",
      url: manifest.url || "",
      accent: manifest.accent || "#6A4C93",
      accentSoft: manifest.accentSoft || "",
      grades: manifest.grades || [],
      ready: !isPlanned,                 // ready:false = 占位（"敬请期待"）
      capabilities: manifest.capabilities || [],
      // 可选：学科自己的一句短标（例如"每天 15 分钟"），显示在卡片底部
      feedbackNote: manifest.feedbackNote || "",
      // 学科自己报"这个孩子学到哪了"；读不到就返回 null，不影响大厅渲染
      summary: typeof manifest.summary === "function" ? manifest.summary : null
    };
    subjects.push(m);
    byId[m.id] = m;
  }

  function all() { return subjects.slice(); }
  function get(id) { return byId[id] || null; }

  // ---------------------------------------------------------------- 进入学科

  function markVisited(id) {
    var m = byId[id];
    writeStore(LAST_KEY, { id: id, at: Date.now(), name: m ? m.name : id });
  }

  function lastVisited() {
    var v = readStore(LAST_KEY, null);
    if (!v || !v.id || !byId[v.id]) return null;
    return v;
  }

  /** 大厅的卡片点击走这里：先记一笔，再跳转 */
  function go(id) {
    var m = byId[id];
    if (!m || !m.ready) return false;
    markVisited(id);
    location.href = m.url;
    return true;
  }

  // ---------------------------------------------------------------- 渲染大厅

  function gradeText(grades) {
    if (!grades || !grades.length) return "";
    var lo = Math.min.apply(null, grades), hi = Math.max.apply(null, grades);
    return lo === hi ? lo + " 年级" : lo + "–" + hi + " 年级";
  }

  function cardHtml(m) {
    // 学科主色通过 inline 变量注入，卡片样式本身是共用的一份
    var style = "--accent:" + esc(m.accent) + ";";
    if (m.accentSoft) style += "--accent-soft:" + esc(m.accentSoft) + ";";

    // 学科自报进度；读不到就什么也不显示（绝不因为读不到而让卡片消失）
    var s = null;
    if (m.ready && m.summary) {
      try { s = m.summary(); } catch (e) { s = null; }
    }

    var flags = "";
    if (!m.ready) flags += '<span class="sc-flag">敬请期待</span>';
    else if (s && s.level != null) flags += '<span class="sc-flag">Lv.' + esc(s.level) + "</span>";

    var meta = "";
    var g = gradeText(m.grades);
    if (g) meta += '<span class="chip plain">' + esc(g) + "</span>";
    if (m.feedbackNote) meta += '<span class="chip plain">' + esc(m.feedbackNote) + "</span>";
    if (s && s.text) meta += '<span class="chip">' + esc(s.text) + "</span>";

    var inner =
      flags +
      '<div class="sc-emoji" aria-hidden="true">' + esc(m.emoji) + "</div>" +
      '<div class="sc-name">' + esc(m.name) + "</div>" +
      '<div class="sc-tagline">' + esc(m.tagline) + "</div>" +
      (meta ? '<div class="sc-meta">' + meta + "</div>" : "");

    if (!m.ready) {
      return '<div class="subject-card" style="' + style + '" aria-disabled="true">' + inner + "</div>";
    }
    return '<a class="subject-card" style="' + style + '" href="' + esc(m.url) + '" ' +
           'data-subject="' + esc(m.id) + '">' + inner + "</a>";
  }

  function resumeHtml() {
    var v = lastVisited();
    if (!v) return "";
    var m = byId[v.id];
    if (!m || !m.ready) return "";
    return '<a class="resume" style="--accent:' + esc(m.accent) + '" href="' + esc(m.url) + '" ' +
           'data-subject="' + esc(m.id) + '">' +
           '<span class="resume-emoji" aria-hidden="true">' + esc(m.emoji) + "</span>" +
           '<span class="resume-text">' +
             '<span class="resume-label">继续上次</span><br>' +
             '<span class="resume-name">' + esc(m.name) + "</span>" +
           "</span>" +
           '<span class="resume-go">进去 →</span>' +
           "</a>";
  }

  /** 把大厅渲染到指定容器 */
  function renderLobby(rootId) {
    var root = document.getElementById(rootId || "lobby");
    if (!root) return;

    var ready = subjects.filter(function (m) { return m.ready; });
    var soon = subjects.filter(function (m) { return !m.ready; });

    var html = resumeHtml();

    // 这里不放可见标题：大厅的 <h1>「今天想学点什么？」已经承担了这个角色，
    // 再来一个同样的标题就成了重复。但读屏用户仍需要一个区块标签，
    // 所以放一个视觉隐藏的 h2。
    html += '<h2 class="sr-only">可以学习的学科</h2>';

    if (!ready.length) {
      html += '<div class="note">还没有可进入的学科。</div>';
    } else {
      html += '<div class="subject-grid">' + ready.map(cardHtml).join("") + "</div>";
    }

    if (soon.length) {
      html += '<h2 class="section-title">正在建设中<span class="st-sub">做好了就会出现在上面</span></h2>';
      html += '<div class="subject-grid">' + soon.map(cardHtml).join("") + "</div>";
    }

    root.innerHTML = html;

    // 进入学科前记一笔（"继续上次"要用）。用事件委托，卡片再多也只挂一个监听。
    root.addEventListener("click", function (ev) {
      var el = ev.target;
      while (el && el !== root && !el.getAttribute("data-subject")) el = el.parentNode;
      if (el && el !== root) markVisited(el.getAttribute("data-subject"));
    });
  }

  // ---------------------------------------------------------------- 启动

  /**
   * 大厅启动流程：
   *   1. 先把「计划中」的学科登记进去（它们没有目录，只是占位卡片）
   *   2. 再动态加载真实学科的 manifest，每个 manifest 自己调用 Platform.register
   *   3. 全部就绪后渲染
   *
   * 某个 manifest 加载失败（文件被删、路径写错、语法错误）**不会**拖垮大厅，
   * 只是那一张卡片不出现，并在控制台留一条明确的日志。
   */
  function loadScript(src) {
    return new Promise(function (resolve) {
      var el = document.createElement("script");
      el.src = src;
      el.onload = function () { resolve(true); };
      el.onerror = function () {
        console.warn("[Platform] 学科 manifest 加载失败，已跳过：" + src);
        resolve(false);
      };
      document.head.appendChild(el);
    });
  }

  function boot(config, rootId) {
    var cfg = config || {};
    (cfg.planned || []).forEach(function (m) {
      register(Object.assign({}, m, { ready: false }));
    });

    var list = cfg.manifests || [];
    return Promise.all(list.map(loadScript)).then(function () {
      renderLobby(rootId);
      return subjects.length;
    });
  }

  // ---------------------------------------------------------------- 导出

  window.Platform = {
    register: register,
    all: all,
    get: get,
    go: go,
    markVisited: markVisited,
    lastVisited: lastVisited,
    renderLobby: renderLobby,
    boot: boot,
    NS: NS
  };
})();
