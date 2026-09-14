/**
 * 🎨 UI —— 通用界面工具（贴纸卡 / 印章 / 撒花 / 小熊猫点评 / 弹窗）
 * 所有模块都通过 window.UI 使用，不要各写各的 DOM 小工具。
 */
const UI = (() => {
  const ESC = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };

  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, c => ESC[c]); }

  function el(tag, attrs, children) {
    const node = document.createElement(tag);
    if (attrs) {
      for (const k in attrs) {
        const v = attrs[k];
        if (v == null || v === false) continue;
        if (k === "class") node.className = v;
        else if (k === "text") node.textContent = v;
        else if (k === "html") node.innerHTML = v;
        else if (k === "style" && typeof v === "object") Object.assign(node.style, v);
        else if (k === "dataset") Object.assign(node.dataset, v);
        else if (k.startsWith("on") && typeof v === "function") node.addEventListener(k.slice(2), v);
        else node.setAttribute(k, v === true ? "" : v);
      }
    }
    (children || []).forEach(c => node.appendChild(typeof c === "string" ? document.createTextNode(c) : c));
    return node;
  }

  /* ---------------- 种子随机（同一 seed 结果一致，方便"每天的题一样"） ---------------- */
  function hashSeed(str) {
    let h = 2166136261;
    const s = String(str);
    for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
    return h >>> 0;
  }
  function rng(seed) {
    let a = typeof seed === "number" ? seed : hashSeed(seed);
    return function () {
      a |= 0; a = a + 0x6D2B79F5 | 0;
      let t = Math.imul(a ^ a >>> 15, 1 | a);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }
  function shuffle(arr, seed) {
    const a = (arr || []).slice();
    const r = rng(seed == null ? Date.now() : seed);
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(r() * (i + 1));
      const t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  }
  function pick(arr, n, seed) { return shuffle(arr, seed).slice(0, n); }
  function sample(arr, seed) { const a = arr || []; return a.length ? a[Math.floor(rng(seed == null ? Date.now() : seed)() * a.length)] : null; }

  /* ---------------- 提示 ---------------- */
  function toast(msg, kind) {
    const wrap = document.getElementById("toastWrap");
    if (!wrap) return;
    const t = el("div", { class: "toast" + (kind ? " " + kind : ""), text: msg });
    wrap.appendChild(t);
    setTimeout(() => { t.style.transition = "opacity .3s"; t.style.opacity = "0"; }, 2100);
    setTimeout(() => t.remove(), 2450);
  }

  /* ---------------- 撒花 ---------------- */
  function confetti(n) {
    const layer = document.getElementById("confettiLayer");
    if (!layer) return;
    const colors = ["#E4572E", "#F2B33D", "#2E9E8F", "#6A4C93", "#F7EFE0"];
    const count = n || 46;
    for (let i = 0; i < count; i++) {
      const p = el("div", { class: "confetti-piece" });
      p.style.left = Math.random() * 100 + "%";
      p.style.top = "-20px";
      p.style.background = colors[i % colors.length];
      p.style.animationDuration = (1.5 + Math.random() * 1.4) + "s";
      p.style.animationDelay = (Math.random() * 0.35) + "s";
      p.style.width = (7 + Math.random() * 8) + "px";
      p.style.height = (9 + Math.random() * 10) + "px";
      layer.appendChild(p);
      setTimeout(() => p.remove(), 3200);
    }
  }

  /* ---------------- 盖章 ---------------- */
  function stamp(text) {
    const layer = document.getElementById("stampLayer");
    if (!layer) return;
    const m = el("div", { class: "stamp-mark", text: text || "太棒了" });
    layer.innerHTML = "";
    layer.appendChild(m);
    requestAnimationFrame(() => m.classList.add("go"));
    if (typeof AudioFX !== "undefined") AudioFX.playStamp();
    setTimeout(() => { if (m.parentNode) m.remove(); }, 1600);
  }

  /* ---------------- 小件 ---------------- */
  function stars(n, total) {
    const t = total || 3;
    let html = '<span class="stars" aria-label="' + n + ' 颗星">';
    for (let i = 0; i < t; i++) html += '<span class="' + (i < n ? "on" : "") + '">' + (i < n ? "★" : "☆") + "</span>";
    return html + "</span>";
  }

  function panda(text, mood) {
    const face = mood === "cheer" ? "🐼" : mood === "think" ? "🤔" : "🐼";
    return '<div class="panda ' + (mood || "happy") + '"><div class="panda-face" aria-hidden="true">' + face +
      '</div><div class="panda-text">' + esc(text) + "</div></div>";
  }

  function fmtSec(s) {
    s = Math.max(0, Math.round(s || 0));
    if (s < 60) return s + " 秒";
    const m = Math.floor(s / 60);
    return m + " 分 " + (s % 60) + " 秒";
  }

  function today(d) {
    const dt = d ? new Date(d) : new Date();
    const p = n => String(n).padStart(2, "0");
    return dt.getFullYear() + "-" + p(dt.getMonth() + 1) + "-" + p(dt.getDate());
  }

  /** 从 hash 里取查询参数：#/page?a=1&b=2 */
  function qs(name) {
    const m = String(location.hash || "").match(/[?&]([^=&]+)=([^&]*)/g) || [];
    for (const kv of m) {
      const i = kv.indexOf("=");
      if (decodeURIComponent(kv.slice(1, i)) === name) return decodeURIComponent(kv.slice(i + 1));
    }
    return null;
  }

  /* ---------------- 弹窗 ---------------- */
  function modal(opts) {
    const root = document.getElementById("modalRoot");
    const mask = el("div", { class: "modal-mask" });
    const card = el("div", { class: "modal-card", role: "dialog", "aria-modal": "true" });
    card.innerHTML = '<div class="modal-title">' + esc(opts.title || "") + '</div>' +
      '<div class="modal-body">' + (opts.html || esc(opts.text || "")) + '</div>';
    const foot = el("div", { class: "modal-foot" });
    const actions = opts.actions || [{ label: "知道啦", kind: "primary" }];
    function close() { mask.remove(); document.removeEventListener("keydown", onKey); }
    actions.forEach(a => {
      foot.appendChild(el("button", {
        class: "btn " + (a.kind ? "btn-" + a.kind : "btn-ghost"),
        text: a.label,
        onclick: () => { if (typeof AudioFX !== "undefined") AudioFX.playClick(); const keep = a.onClick && a.onClick(); if (keep !== false) close(); }
      }));
    });
    card.appendChild(foot);
    mask.appendChild(card);
    mask.addEventListener("click", e => { if (e.target === mask && opts.maskClose !== false) close(); });
    function onKey(e) { if (e.key === "Escape") close(); }
    document.addEventListener("keydown", onKey);
    root.appendChild(mask);
    const focusable = card.querySelector("button");
    if (focusable) focusable.focus();
    return { close, card };
  }

  function confirm(text, onYes, yesLabel) {
    return modal({
      title: "确认一下",
      text: text,
      actions: [
        { label: "再想想", kind: "ghost" },
        { label: yesLabel || "好的", kind: "primary", onClick: onYes }
      ]
    });
  }

  /* ---------------- 图标（少量自绘 SVG + emoji 兜底） ---------------- */
  const SVG = {
    map: '<svg viewBox="0 0 24 24" width="1em" height="1em" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 3 3 6v15l6-3 6 3 6-3V3l-6 3-6-3Z"/><path d="M9 3v15M15 6v15"/></svg>',
    sound: '<svg viewBox="0 0 24 24" width="1em" height="1em" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M11 5 6 9H3v6h3l5 4V5Z"/><path d="M16 9a4 4 0 0 1 0 6"/></svg>',
    back: '<svg viewBox="0 0 24 24" width="1em" height="1em" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M15 5l-7 7 7 7"/></svg>'
  };
  const EMOJI = { star: "⭐", lock: "🔒", review: "🔁", book: "📚", game: "🎮", me: "🏅", gear: "⚙️", mic: "🎤", listen: "👂", speak: "🗣", read: "📖", write: "✍️", play: "🎮" };

  function icon(name) { return SVG[name] || EMOJI[name] || "•"; }

  function loading(text) {
    return '<div class="loading"><span class="spin"></span><span>' + esc(text || "正在准备…") + "</span></div>";
  }

  function empty(text, emoji) {
    return '<div class="empty"><div class="e-emoji" aria-hidden="true">' + (emoji || "🐼") + '</div><div>' + esc(text) + "</div></div>";
  }

  return {
    esc, el, toast, confetti, stamp, stars, panda, fmtSec, today, qs,
    modal, confirm, icon, loading, empty,
    shuffle, pick, sample, rng, hashSeed
  };
})();
window.UI = UI;
