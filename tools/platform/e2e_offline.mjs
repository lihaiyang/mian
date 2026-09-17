/**
 * 离线（PWA）端到端测试
 *
 * 用法：
 *   python3 tools/dev_server.py 8788
 *   PLAYWRIGHT_PATH=... node tools/platform/e2e_offline.mjs [http://127.0.0.1:8788]
 *
 * 为什么值得单独测：Service Worker 的失败方式是**静默**的 ——
 *   · 注册失败：页面照常，只是没网就白屏
 *   · 缓存策略写错：线上永远是旧页面，而且本地开发（杀了 SW）永远看不到
 * 所以这里不但要断言"注册上了"，还要**真的把网络断掉**再打开页面。
 */
const pwSpec = process.env.PLAYWRIGHT_PATH
  ? "file://" + process.env.PLAYWRIGHT_PATH.replace(/\/$/, "") + "/index.mjs"
  : "playwright";
const { chromium } = await import(pwSpec);

const BASE = process.argv[2] || process.env.BASE || "http://127.0.0.1:8788";
const out = [];
let failed = 0;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
function check(name, ok, extra = "") {
  out.push(`${ok ? "✅" : "❌"} ${name}${extra ? " —— " + extra : ""}`);
  if (!ok) failed++;
  // 立刻打一行：这套用例里有一条会**等 SW ready**，
  // 万一注册没成功，攒到最后再打印就什么都看不到了（踩过一次）
  console.log(`${ok ? "✅" : "❌"} ${name}${extra ? " —— " + extra : ""}`);
}

/** 给页面里的 Promise 加超时 —— SW 没注册上时 ready 会永远挂着 */
const withTimeout = (page, fn, ms) => page.evaluate(
  ({ src, ms }) => Promise.race([
    new Function("return (" + src + ")()")(),
    new Promise((_, rej) => setTimeout(() => rej(new Error("timeout")), ms))
  ]).catch((e) => ({ error: String(e && e.message || e) })),
  { src: fn.toString(), ms }
);

const browser = await chromium.launch(
  process.env.CHROME_BIN ? { executablePath: process.env.CHROME_BIN } : {}
);
const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
const page = await ctx.newPage();
const errs = [];
page.on("pageerror", (e) => errs.push(e.message));

// ---------------------------------------------------------------- 1. 注册
await page.goto(BASE + "/math/", { waitUntil: "domcontentloaded" });
await page.waitForSelector(".ma-unit", { timeout: 20000 });

const reg = await withTimeout(page, async () => {
  if (!("serviceWorker" in navigator)) return { ok: false, why: "浏览器不支持" };
  const r = await navigator.serviceWorker.ready;
  return { ok: !!r, scope: r ? r.scope : "", script: r && r.active ? r.active.scriptURL : "" };
}, 15000);
check("Service Worker 注册成功", reg.ok && /\/sw\.js$/.test(reg.script || ""),
      `scope=${reg.scope} script=${reg.script} ${reg.error || ""}`);

// 等它接管这个页面（首次访问要等 claim 生效，刷新一下最稳）
await page.reload({ waitUntil: "domcontentloaded" });
await page.waitForSelector(".ma-unit", { timeout: 20000 });
const controlled = await page.evaluate(() => !!navigator.serviceWorker.controller);
check("页面已被 Service Worker 接管", controlled);

// 预缓存要真的落盘（install 是异步的，给它一点时间）
let shellKeys = [];
for (let i = 0; i < 20; i++) {
  shellKeys = await page.evaluate(async () => {
    const c = await caches.open("mian-shell-v1");
    return (await c.keys()).map((r) => new URL(r.url).pathname);
  });
  if (shellKeys.includes("/") && shellKeys.includes("/math/")) break;
  await sleep(500);
}
check("预缓存里有大厅和数学岛", shellKeys.includes("/") && shellKeys.includes("/math/"),
      `${shellKeys.length} 个：${shellKeys.slice(0, 6).join(",")}…`);
check("预缓存里有共享层", shellKeys.some((k) => k.indexOf("/shared/core/") === 0),
      shellKeys.filter((k) => k.indexOf("/shared/") === 0).length + " 个共享文件");

// 后台补齐：页面引用到的 js/css（含数学题库 132K）也要进缓存，
// 这样**没去过**的学科离线也能用。给 1MB 一点时间。
let assetKeys = [];
for (let i = 0; i < 40; i++) {
  assetKeys = await page.evaluate(async () => {
    const c = await caches.open("mian-assets-v1");
    return (await c.keys()).map((r) => new URL(r.url).pathname);
  });
  if (assetKeys.some((k) => /problems\.js$/.test(k))) break;
  await sleep(700);
}
check("后台补齐了数学题库", assetKeys.some((k) => /problems\.js$/.test(k)),
      assetKeys.filter((k) => /\.js$/.test(k)).length + " 个 js 进了缓存");
check("没有把 pyodide 一起拖下来（那是用到才下）",
  !assetKeys.some((k) => /pyodide/.test(k)));

// 汉字岛的字表是**运行时注入**的（HTML 里没有 <script src>），
// 靠 Pwa.want() 主动申报才会进缓存 —— 去一次汉字岛就该拿到。
await page.goto(BASE + "/cn/", { waitUntil: "domcontentloaded" });
await page.waitForSelector(".cn-char", { timeout: 20000 });
let cnKeys = [];
for (let i = 0; i < 30; i++) {
  cnKeys = await page.evaluate(async () => {
    const c = await caches.open("mian-assets-v1");
    return (await c.keys()).map((r) => new URL(r.url).pathname);
  });
  if (cnKeys.some((k) => /chars-g6\.js$/.test(k))) break;
  await sleep(500);
}
check("去过汉字岛之后字表（820K）也进了缓存",
  cnKeys.some((k) => /chars-g1\.js$/.test(k)) && cnKeys.some((k) => /chars-g6\.js$/.test(k)),
  cnKeys.filter((k) => /chars-g/.test(k)).length + " 份字表");

// 大厅：学科 manifest 也是运行时注入的，靠 registry 报给 Pwa.want 才会进缓存。
// 不缓存的话，没网打开大厅只剩"敬请期待"那张占位卡。
await page.goto(BASE + "/", { waitUntil: "domcontentloaded" });
await page.waitForSelector(".subject-card", { timeout: 20000 });
let manKeys = [];
for (let i = 0; i < 20; i++) {
  manKeys = await page.evaluate(async () => {
    const c = await caches.open("mian-assets-v1");
    return (await c.keys()).map((r) => new URL(r.url).pathname);
  });
  if (manKeys.filter((k) => /subject\.js$/.test(k)).length >= 5) break;
  await sleep(400);
}
check("学科 manifest 进了缓存（没网时大厅不会只剩占位卡）",
  manKeys.filter((k) => /subject\.js$/.test(k)).length >= 5,
  manKeys.filter((k) => /subject\.js$/.test(k)).join(","));
check("Python 的课件没有一起预下（十几 MB 的运行时离线也跑不起来）",
  !manKeys.some((k) => /^\/python\/js\//.test(k)),
  manKeys.filter((k) => /python/.test(k)).length + " 个 python 资源在缓存里");

// ---------------------------------------------------------------- 2. 断网之后
await page.goto(BASE + "/math/", { waitUntil: "domcontentloaded" });
await sleep(300);
await ctx.setOffline(true);
await sleep(300);

// 已经来过的学科：断网也必须能打开
await page.goto(BASE + "/math/", { waitUntil: "domcontentloaded" });
await sleep(800);
const offMath = await page.evaluate(() => ({
  title: document.title,
  units: document.querySelectorAll(".ma-unit").length,
  back: !!document.querySelector(".topbar-back"),
  body: document.body.innerText.length
}));
check("断网后数学岛还能打开", offMath.units > 0 && offMath.back,
      `${offMath.units} 个单元 / ${offMath.body} 字`);
check("断网后题目数据也在（能出题）",
  await page.evaluate(() => (window.MATH_UNITS || []).length > 0),
  await page.evaluate(() => (window.MATH_UNITS || []).length + " 个单元"));

// 没去过的学科：预缓存里有外壳，也该能打开
await page.goto(BASE + "/cn/", { waitUntil: "domcontentloaded" });
await sleep(800);
const offCn = await page.evaluate(() => ({
  title: document.title,
  chars: document.querySelectorAll(".cn-char").length
}));
check("断网后汉字岛外壳能打开", /汉字岛/.test(offCn.title) && offCn.chars > 0,
      `${offCn.chars} 个字格`);

// 大厅也该能打开，而且是**完整**的（学科卡片一个都不能少）
await page.goto(BASE + "/", { waitUntil: "domcontentloaded" });
await sleep(1200);
const offLobby = await page.evaluate(() => ({
  cards: document.querySelectorAll("a.subject-card[data-subject]").length,
  soon: document.querySelectorAll('.subject-card[aria-disabled="true"]').length
}));
const wantCards = await page.evaluate(() => (window.MIAN_SUBJECTS.manifests || []).length);
check("断网后大厅的学科卡片一张不少",
  offLobby.cards === wantCards && offLobby.cards >= 5,
  `${offLobby.cards} 张可进入 / 声明 ${wantCards} 个，占位 ${offLobby.soon} 张`);

// 完全没缓存过的地址：给一张"没网"提示页，而不是浏览器的报错页
await page.goto(BASE + "/never-visited-page/", { waitUntil: "domcontentloaded" }).catch(() => {});
await sleep(500);
const fallback = await page.evaluate(() => document.body.innerText);
check("没缓存的地址给「没网」提示页（不是浏览器错误页）",
  /没网/.test(fallback) && /回大厅/.test(fallback), fallback.replace(/\s+/g, " ").slice(0, 40));

await ctx.setOffline(false);

// ---------------------------------------------------------------- 3. 该撇清的撇清
const swText = await page.evaluate(async () => {
  const r = await fetch("/sw.js", { cache: "no-store" });
  return r.text();
});
check("云同步接口绝不缓存（sw.js 里 /api/ 提前返回）",
  /pathname\.startsWith\("\/api\/"\)\s*\)\s*return/.test(swText));
check("只清自己前缀的缓存（不删英语站的离线音频包）",
  /mian-\(shell\|assets\)-/.test(swText));

check("没有 JS 报错", errs.length === 0, errs.slice(0, 2).join(" | "));

console.log(out.join("\n"));
console.log(failed === 0 ? `\n🎉 全部 ${out.length} 项通过` : `\n❌ ${failed} / ${out.length} 项失败`);
await browser.close();
process.exit(failed === 0 ? 0 : 1);
