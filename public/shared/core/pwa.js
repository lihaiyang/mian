/* ============================================================================
 * 萌学园 · 离线登记（shared/core/pwa.js）
 *
 * 只做一件事：把根 Service Worker 登记上。
 * 具体缓存策略全在 /sw.js 里，页面不用管。
 *
 * 三条约定：
 *   1. **失败必须静默**。SW 注册不上（老浏览器、隐私模式、被墙）不影响任何功能，
 *      这只是"锦上添花"，不是"没有就崩"。
 *   2. 英语站不进这里（它自己有作用域 /en/ 的一份），
 *      两边都注册会打架，而且它的离线音频包已经跑通了，别去动。
 *   3. **等 load 之后再注册**。首页的渲染不该和 SW 抢带宽。
 * ========================================================================== */
(function () {
  "use strict";

  if (!("serviceWorker" in navigator)) return;
  // file:// 下注册不了，本地直接开文件调试时别报错
  if (location.protocol !== "http:" && location.protocol !== "https:") return;
  // 英语站有自己的 SW（作用域 /en/）
  if (location.pathname.indexOf("/en/") === 0) return;

  // ---------------------------------------------------------------- 主动申报

  // 有些文件是**运行时才注入**的（汉字岛的字表 data/chars-gN.js 就是），
  // HTML 里没有 <script src>，后台预热扫不到。学科用 Pwa.want([...]) 报一声，
  // SW 就会把这些地址也缓存下来。
  var queued = [];

  function flush() {
    var sw = navigator.serviceWorker.controller;
    if (!sw) return;
    queued.forEach(function (urls) {
      try { sw.postMessage({ type: "cache", urls: urls }); } catch (e) {}
    });
    queued = [];
  }

  function want(urls) {
    if (!urls || !urls.length) return;
    var abs = [];
    for (var i = 0; i < urls.length; i++) {
      try { abs.push(new URL(urls[i], location.href).href); } catch (e) {}
    }
    if (!abs.length) return;
    queued.push(abs);
    flush();
  }

  // 第一次进来时 controller 还是空的（SW 正在装），等它接管了再发
  navigator.serviceWorker.addEventListener("controllerchange", flush);

  // ---------------------------------------------------------------- 登记

  function register() {
    navigator.serviceWorker.register("/sw.js", { scope: "/" }).then(flush).catch(function (e) {
      console.warn("[PWA] 离线缓存没开起来（不影响使用）：" + (e && e.message ? e.message : e));
    });
  }

  if (document.readyState === "complete") register();
  else window.addEventListener("load", register);

  window.Pwa = { want: want, register: register };
})();
