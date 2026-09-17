/**
 * 🐼 萌语岛 Service Worker —— 离线也能学
 *
 * 策略（刻意保守，避免"新 HTML + 旧 JS"的错版）：
 *   ① HTML / 数据文件（data/*.js）→ network-first，失败回退缓存；
 *   ② 静态资源（css / js / assets 字体音频）→ cache-first（它们都带 ?v= 版本号）；
 *   ③ 其他 → 直接走网络。
 * 音频精灵体积不大（每主题几百 KB），用户点"下载离线包"时会把主题音频也塞进缓存。
 */
const VERSION = "en-v1";
const CORE = [
  "./",
  "./index.html",
  "./css/style.css",
  "./css/games.css",
  "./js/store.js",
  "./js/audio-fx.js",
  "./js/ui.js",
  "./js/player.js",
  "./js/speech.js",
  "./js/srs.js",
  "./js/progress.js",
  "./js/cloud.js",
  "./js/games.js",
  "./js/stage.js",
  "./js/app.js",
  "./assets/fonts/Andika-Regular.woff2",
  "./assets/fonts/Andika-Bold.woff2",
  "./assets/fonts/Baloo2.woff2",
  "./img/icon.svg"
];

self.addEventListener("install", e => {
  e.waitUntil((async () => {
    const cache = await caches.open(VERSION);
    await Promise.all(CORE.map(u => cache.add(new Request(u, { cache: "reload" })).catch(() => null)));
    self.skipWaiting();
  })());
});

self.addEventListener("activate", e => {
  e.waitUntil((async () => {
    const keys = await caches.keys();
    // ⚠️ 只清**自己前缀**（en-）的旧版本。
    // 原来写的是"清掉所有不等于自己的缓存"，现在平台层有了一份根 SW
    // （mian-shell-v1 / mian-assets-v1），那样会顺手删掉别的学科的离线缓存，
    // 反过来它也会删我们 —— 两个 SW 互相拆台，离线就永远不可靠。
    await Promise.all(keys
      .filter(k => /^en-/.test(k) && k !== VERSION)
      .map(k => caches.delete(k)));
    await self.clients.claim();
  })());
});

function isStatic(url) {
  return /\/(css|js|assets)\/.*\.(css|js|woff2|m4a|json|svg|png)$/.test(url.pathname);
}

self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== location.origin) return;
  if (!url.pathname.includes("/en/")) return;

  // 静态资源：cache-first（URL 里带 ?v= 版本号，内容变了 URL 就变）
  if (isStatic(url)) {
    e.respondWith((async () => {
      const cache = await caches.open(VERSION);
      const hit = await cache.match(req, { ignoreSearch: false });
      if (hit) return hit;
      try {
        const res = await fetch(req);
        if (res && res.ok) cache.put(req, res.clone());
        return res;
      } catch (err) {
        const loose = await cache.match(req, { ignoreSearch: true });
        if (loose) return loose;
        throw err;
      }
    })());
    return;
  }

  // HTML 与数据文件：network-first
  e.respondWith((async () => {
    const cache = await caches.open(VERSION);
    try {
      const res = await fetch(req);
      if (res && res.ok) cache.put(req, res.clone());
      return res;
    } catch (err) {
      const hit = await cache.match(req, { ignoreSearch: true });
      if (hit) return hit;
      if (req.mode === "navigate") {
        const shell = await cache.match("./index.html", { ignoreSearch: true });
        if (shell) return shell;
      }
      throw err;
    }
  })());
});

// 页面里点"下载离线音频包"时，把主题音频一次性塞进缓存
self.addEventListener("message", e => {
  const data = e.data || {};
  if (data.type === "cache-audio" && Array.isArray(data.urls)) {
    e.waitUntil((async () => {
      const cache = await caches.open(VERSION);
      await Promise.all(data.urls.map(u => cache.add(new Request(u, { cache: "reload" })).catch(() => null)));
    })());
  }
});
