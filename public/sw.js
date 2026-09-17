/* ============================================================================
 * 萌学园 · 离线 Service Worker（覆盖全站，除了 /en/）
 *
 * 为什么要做：国内到 Cloudflare 不稳，上一轮实测两个站都间歇超时。
 * 孩子做题做到一半"网络错误"，比少一个功能难受得多。
 *
 * 策略（刻意保守，宁可少缓存也不要"新 HTML + 旧 JS"的错版）：
 *
 *   ① 页面导航          → **network-first**（新 HTML 必须能立刻生效）
 *                          离线时回退缓存，缓存也没有就给一张"没网"提示页
 *   ② 带扩展名的静态文件 → cache-first（它们的 URL 上都有 ?v= 指纹，
 *                          内容变了 URL 就变，所以缓存不会过期错版）
 *   ③ /api/*            → **完全不碰**（云同步绝不缓存，绝不能拿旧数据糊弄）
 *   ④ Range 请求        → 直接放行（音频/视频分段，缓存会拼坏）
 *
 * 和 /en/sw.js 的关系：英语站有自己的一份，作用域是 /en/。
 * 两个作用域重叠时浏览器按**最长作用域**选，所以 /en/ 归它、其余归这里。
 * ⚠️ 代价是两边的 activate 都不能"清掉所有别的缓存" —— 见 en/sw.js 里的注释。
 *
 * 登记在 shared/core/pwa.js，只有真的注册成功才会走到这里。
 * ========================================================================== */

const SHELL = "mian-shell-v1";     // 页面外壳（HTML）
const ASSETS = "mian-assets-v1";   // 运行时缓存（css / js / 图片 / 数据）

/* 预缓存：只要来过一次，这几个页面离线都能打开。
   刻意**不**预缓存各学科的 js 和数据（数学题库、汉字表加起来 1MB+），
   它们交给运行时缓存：孩子真去过哪个学科，那个学科才离线可用。
   也**不**碰 /vendor/*（pyodide 十几 MB，进不进缓存由孩子的使用决定）。 */
const CORE = [
  "/",
  "/python/",
  "/typing/",
  "/math/",
  "/cn/",
  "/review/",
  "/parent/",
  "/shared/styles/tokens.css",
  "/shared/styles/base.css",
  "/shared/styles/components.css",
  "/shared/styles/chrome.css",
  "/shared/core/store.js",
  "/shared/core/srs.js",
  "/shared/core/progress.js",
  "/shared/core/sync.js",
  "/shared/core/registry.js",
  "/shared/core/topbar.js",
  "/shared/core/account-ui.js",
  "/shared/subjects.js",
  "/icons/icon.svg"
];

self.addEventListener("install", (e) => {
  e.waitUntil((async () => {
    const cache = await caches.open(SHELL);
    // 一条失败不能拖垮整个 install（某个学科还没上线、某个文件改名）
    await Promise.all(CORE.map((u) =>
      cache.add(new Request(u, { cache: "reload" })).catch(() => null)));
    self.skipWaiting();
  })());
});

self.addEventListener("activate", (e) => {
  e.waitUntil((async () => {
    const keys = await caches.keys();
    // ⚠️ 只清自己前缀的旧版本。清"所有不等于自己的缓存"会顺手删掉
    // 英语站的 en-v1（那份缓存里是孩子下载的离线音频包），反过来它也会删我们。
    await Promise.all(keys
      .filter((k) => /^mian-(shell|assets)-/.test(k) && k !== SHELL && k !== ASSETS)
      .map((k) => caches.delete(k)));
    await self.clients.claim();
    await prefetchPages();
  })());
});

/* ----------------------------------------------------------------------------
 * 后台补齐：把每个页面**真正引用到的** js / css 也缓存下来。
 *
 * 为什么不直接把文件清单写在这里：那些 URL 上都有 ?v= 内容指纹，
 * 写死在这儿就等于把版本号抄了一份 —— 部署后指纹变了，清单还是旧的，
 * 离线时页面去要 problems.js?v=新指纹，缓存里只有旧指纹，照样白屏。
 * 所以这里反过来做：把已经缓存的 HTML 读出来，抠出它引用的资源地址。
 * 页面怎么引用，这里就怎么缓存，永远对得上。
 *
 * 这一步让"没去过的学科"离线也能用（数学题库 132K、汉字表 820K）。
 * Python 的 pyodide 十几 MB 刻意不碰：那属于"用到才下载"。
 * -------------------------------------------------------------------------- */
const PREFETCH_PAGES = ["/", "/python/", "/typing/", "/math/", "/cn/", "/review/", "/parent/"];
const ASSET_RE = /(?:src|href)="([^"#]+?\.(?:js|css)(?:\?[^"]*)?)"/g;

/* Python 特殊对待：它的运行时（pyodide）在 /vendor 下有十几 MB，
   离线本来就跑不起来，把 1.4MB 的课件 JS 预下下来只是白烧流量。
   所以这个页面只预热共享层 —— 它自己的 js 交给"用到才缓存"。 */
const ONLY_SHARED = { "/python/": /^\/shared\// };

/** 把一批地址缓存起来。并发 4：一次全下会把带宽吃满，串行又太慢。 */
async function cacheUrls(list) {
  const assets = await caches.open(ASSETS);
  let i = 0;
  await Promise.all(Array.from({ length: 4 }, async () => {
    while (i < list.length) {
      const u = list[i++];
      try {
        if (await assets.match(u)) continue;
        const res = await fetch(u, { credentials: "same-origin" });
        if (res && res.ok && res.type === "basic") await assets.put(u, res.clone());
      } catch (err) { /* 单个文件失败不影响其他 */ }
    }
  }));
}

/** 页面运行时主动申报的资源（例如汉字岛动态注入的字表） */
self.addEventListener("message", (e) => {
  const d = e.data || {};
  if (d.type !== "cache" || !Array.isArray(d.urls)) return;
  const list = d.urls
    .map((u) => { try { return new URL(u, location.origin).href; } catch (err) { return null; } })
    .filter((u) => u && u.indexOf(location.origin) === 0);
  if (list.length) e.waitUntil(cacheUrls(list));
});

async function prefetchPages() {
  // 省流量 / 2G：不主动下
  const conn = navigator.connection;
  if (conn && (conn.saveData || /(^|-)2g/.test(conn.effectiveType || ""))) return;

  // 让首屏先加载完，别和页面自己抢带宽
  await new Promise((r) => setTimeout(r, 2500));

  const shell = await caches.open(SHELL);
  const urls = new Set();

  for (const p of PREFETCH_PAGES) {
    const res = await shell.match(p);
    if (!res) continue;
    let html = "";
    try { html = await res.text(); } catch (err) { continue; }
    const base = new URL(p, location.origin);
    const only = ONLY_SHARED[p];
    for (const m of html.matchAll(ASSET_RE)) {
      try {
        const u = new URL(m[1], base);
        if (u.origin !== location.origin) continue;
        if (only && !only.test(u.pathname)) continue;
        urls.add(u.href);
      } catch (err) {}
    }
  }

  await cacheUrls(Array.from(urls));
}

/** 带扩展名的静态文件：css / js / json / 图片 / 字体 / 音频 */
function isAsset(pathname) {
  return /\.[a-z0-9]+$/i.test(pathname);
}

function offlinePage() {
  const html =
    '<!DOCTYPE html><html lang="zh-CN"><head><meta charset="UTF-8">' +
    '<meta name="viewport" content="width=device-width,initial-scale=1">' +
    "<title>现在没网 · 萌学园</title>" +
    "<style>body{margin:0;min-height:100vh;display:flex;align-items:center;justify-content:center;" +
    "background:#F8F5F1;color:#3A3330;font:16px/1.7 -apple-system,BlinkMacSystemFont,'PingFang SC',sans-serif;" +
    "padding:24px;text-align:center}h1{font-size:22px;margin:0 0 8px}p{margin:0 0 20px;color:#7A6E66}" +
    "a{display:inline-block;padding:10px 20px;background:#6A4C93;color:#fff;border-radius:999px;" +
    "text-decoration:none;font-weight:700}</style></head><body><div>" +
    "<div style='font-size:44px'>📡</div><h1>现在没网</h1>" +
    "<p>这个页面还没下载到本地。<br>已经去过的学科，没网也能进。</p>" +
    '<a href="/">回大厅</a></div></body></html>';
  return new Response(html, {
    status: 200,
    headers: { "Content-Type": "text/html; charset=utf-8" }
  });
}

/** 页面导航：先走网络（新 HTML 要能生效），失败回退缓存 */
async function pageFirst(req) {
  const cache = await caches.open(SHELL);
  try {
    const res = await fetch(req);
    if (res && res.ok && res.type === "basic") cache.put(req, res.clone());
    return res;
  } catch (err) {
    const hit = await cache.match(req, { ignoreSearch: true });
    if (hit) return hit;
    return offlinePage();
  }
}

/** 静态文件：先看缓存（URL 带 ?v= 指纹），没有再去网络 */
async function assetFirst(req) {
  const cache = await caches.open(ASSETS);
  const hit = await cache.match(req);
  if (hit) return hit;
  try {
    const res = await fetch(req);
    // 只缓存自己域下的正常响应：opaque / 206 / 错误页塞进缓存会一直错下去
    if (res && res.ok && res.type === "basic" && res.status === 200) {
      cache.put(req, res.clone());
    }
    return res;
  } catch (err) {
    // 离线又没缓存：让页面自己处理（图裂、样式缺一点，但别整页崩）
    return new Response("", { status: 504, statusText: "offline" });
  }
}

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;

  let url;
  try { url = new URL(req.url); } catch (err) { return; }
  if (url.origin !== location.origin) return;          // 跨源交给浏览器自己处理
  if (url.pathname.startsWith("/api/")) return;        // 云同步：绝不缓存
  if (req.headers.get("range")) return;                // 分段请求：缓存会拼坏

  if (req.mode === "navigate") { e.respondWith(pageFirst(req)); return; }
  if (isAsset(url.pathname)) { e.respondWith(assetFirst(req)); return; }
  e.respondWith(pageFirst(req));
});
