/**
 * 萌语岛 · 离线测试（Service Worker）
 * 用法：python3 en/tools/dev_server.py --port 8799 & node en/tools/e2e_offline.mjs http://127.0.0.1:8799
 * 覆盖：首次访问注册 SW 并预缓存 → 断网后刷新仍能打开地图 → 已缓存的数据/音频仍可用
 */
const pwSpec = process.env.PLAYWRIGHT_PATH
  ? "file://" + process.env.PLAYWRIGHT_PATH.replace(/\/$/, "") + "/index.mjs"
  : "playwright";
const { chromium } = await import(pwSpec);
const BASE = process.argv[2] || "http://127.0.0.1:8799";
const results = [];
let failed = 0;
function check(name, ok, extra = "") {
  results.push((ok ? "✅" : "❌") + " " + name + (extra ? " —— " + extra : ""));
  if (!ok) failed++;
}
const sleep = ms => new Promise(r => setTimeout(r, ms));
let browser;
try { browser = await chromium.launch({ channel: process.env.PW_CHANNEL || "chrome" });

// 默认超时：本地 20s 够用，线上要放大 —— 这个站本来就是为"国内到 Cloudflare 不稳"做离线的，
// 拿 20s 卡线上测出来的是网络抖动，不是产品问题。超时放大不拖慢通过的运行。
const E2E_WAIT = Number(process.env.E2E_WAIT_MS || (/^https?:\/\/(127\.|localhost)/.test(BASE) ? 20000 : 60000));
if (browser && browser.setDefaultTimeout) browser.setDefaultTimeout(E2E_WAIT); }
catch (e) { browser = await chromium.launch(); }
const ctx = await browser.newContext({ viewport: { width: 1024, height: 768 } });
const page = await ctx.newPage();
const URL = BASE + "/en/index.html";

// ---------- 1. 首次访问：注册 SW 并等预缓存完成 ----------
await page.goto(URL, { waitUntil: "domcontentloaded" });
const swReady = await page.evaluate(async () => {
  if (!("serviceWorker" in navigator)) return "unsupported";
  const reg = await navigator.serviceWorker.ready;
  return reg && reg.active ? "active" : "no-active";
});
check("Service Worker 已激活", swReady === "active", swReady);
// 让页面把数据文件也拉一遍（进缓存）
await page.goto(URL + "#/island/life", { waitUntil: "domcontentloaded" });
await sleep(2500);
const cacheInfo = await page.evaluate(async () => {
  const keys = await caches.keys();
  if (!keys.length) return { keys: [], n: 0 };
  const c = await caches.open(keys[0]);
  const all = await c.keys();
  return { keys, n: all.length, sample: all.slice(0, 6).map(r => r.url.split("/en/")[1] || r.url) };
});
check("SW 预缓存了核心资源", cacheInfo.n >= 10, cacheInfo.n + " 个：" + cacheInfo.sample.join(", "));

// ---------- 2. 断网 ----------
await ctx.setOffline(true);
await page.goto(URL + "#/map", { waitUntil: "domcontentloaded" }).catch(() => {});
await sleep(2500);
const offline = await page.evaluate(() => ({
  online: navigator.onLine,
  hasMap: !!document.querySelector(".map-hero"),
  islands: document.querySelectorAll("#islandMap .island-card").length,
  tabs: document.querySelectorAll("#tabbar .tab").length,
  title: document.title
}));
check("断网后页面仍能打开", offline.hasMap && offline.tabs === 5, JSON.stringify({ map: offline.hasMap, tabs: offline.tabs }));
check("断网后六座岛仍在（数据走了缓存）", offline.islands === 6, "岛屿 " + offline.islands);

// ---------- 3. 恢复网络 ----------
await ctx.setOffline(false);
await page.goto(URL + "#/map", { waitUntil: "domcontentloaded" });
await sleep(1200);
check("恢复网络后正常", await page.locator(".map-hero").count() === 1);

console.log(results.join("\n"));
console.log("\n" + (failed ? "❌ 失败 " + failed + " 项" : "✅ 全部通过") + "（共 " + results.length + " 项）");
await browser.close();
process.exit(failed ? 1 : 0);
