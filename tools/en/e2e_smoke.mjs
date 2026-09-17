/**
 * 萌语岛 · 端到端冒烟测试（Playwright）
 *
 * 用法：
 *   python3 en/tools/dev_server.py --port 8799 &
 *   PLAYWRIGHT_PATH=$(ls -d ~/.npm/_npx/<hash>/node_modules/playwright | head -1) node en/tools/e2e_smoke.mjs http://127.0.0.1:8799
 *
 * 覆盖：首屏无报错 → 顶栏/底栏 → 地图与今日路线 → 成长档案 → 设置 →
 *       绘本架与点读 → 单词本 → 复习页 → 岛屿页 → 本地存储写入
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
const errors = [];
page.on("console", m => { if (m.type() === "error") errors.push(m.text()); });
page.on("pageerror", e => errors.push("pageerror: " + e.message));

const URL = BASE + "/en/index.html";

// 1. 首屏
await page.goto(URL, { waitUntil: "domcontentloaded" });
await page.waitForSelector("#hud .hud-chip", { timeout: 15000 }).catch(() => {});
// ⚠️ HUD 渲染得很早，但**岛屿地图要等数据文件加载完**才渲染。
// 只等 HUD 就去数 .island-card，在真实 CDN 上（数据文件要走网络）会数到 0，
// 于是"地图 hero / 六座岛 / 今日任务"三项会假失败——本地因为文件在磁盘上太快，
// 反而一直是绿的。这里显式等地图渲染出来再断言。
await page.waitForSelector("#islandMap .island-card", { timeout: 30000 }).catch(() => {});
check("页面标题正确", (await page.title()).includes("萌语岛"));
check("顶栏 HUD 渲染", await page.locator("#hud .hud-chip").count() >= 3);
check("底部导航 5 个入口", await page.locator("#tabbar .tab").count() === 5);
check("地图 hero 出现", await page.locator(".map-hero").count() === 1);
check("六座岛渲染", await page.locator("#islandMap .island-card").count() === 6);
check("今日任务 3 条", await page.locator(".today-item").count() >= 3);

// 2. 成长档案
await page.goto(URL + "#/me", { waitUntil: "domcontentloaded" });
await sleep(900);
check("成长档案渲染等级", await page.locator(".level-medal").count() === 1);
check("徽章网格非空", await page.locator(".badge").count() > 20);

// 3. 设置
await page.goto(URL + "#/settings", { waitUntil: "domcontentloaded" });
await sleep(800);
check("设置页渲染", await page.locator("#cloudBox").count() === 1);
check("字号切换可点", await page.locator("button[data-size]").count() === 3);

// 4. 绘本架 + 点读
await page.goto(URL + "#/library", { waitUntil: "domcontentloaded" });
await sleep(1100);
const books = await page.locator(".book-card").count();
check("绘本架有 20 本", books === 20, "实际 " + books);
if (books) {
  await page.locator(".book-card").first().click();
  await sleep(1200);
  check("绘本可打开", await page.locator(".book-page .bp-en").count() >= 1);
  check("页码点阵 8 个", await page.locator(".page-dot").count() === 8);
  await page.locator("#nextPage").click();
  await sleep(800);
  check("翻页生效", (await page.locator(".muted.small").first().innerText()).includes("2/8"));
}

// 5. 单词本 / 复习
await page.goto(URL + "#/review", { waitUntil: "domcontentloaded" });
await sleep(900);
check("复习页渲染记忆盒", await page.locator(".boxes").count() >= 1);
await page.goto(URL + "#/wordbook", { waitUntil: "domcontentloaded" });
await sleep(900);
check("单词本渲染", await page.locator(".boxes").count() >= 1);

// 6. 岛屿页（拼读岛，phonics 数据可能还没到）
await page.goto(URL + "#/island/letter", { waitUntil: "domcontentloaded" });
await sleep(1200);
const letters = await page.locator(".level-card").count();
check("字母岛 26 个字母", letters === 26, "实际 " + letters);

// 7. 本地存储写入
const ls = await page.evaluate(() => Object.keys(localStorage).filter(k => k.startsWith("en_")));
check("本地存储已写入进度", ls.some(k => k.includes("stats")));

// 8. 无 JS 报错
const missing = errors.filter(e => /404|Failed to load resource/i.test(e));
const realErrors = errors.filter(e => !/404|Failed to load resource|favicon|manifest|ServiceWorker/i.test(e));
check("没有 JS 运行时报错", realErrors.length === 0, realErrors.slice(0, 3).join(" | "));
console.log("（提示）加载失败的资源 " + missing.length + " 个" + (missing.length ? "：多半是内容/音频还没生成" : ""));

console.log(results.join("\n"));
console.log("\n" + (failed ? "❌ 失败 " + failed + " 项" : "✅ 全部通过") + "（共 " + results.length + " 项）");
await browser.close();
process.exit(failed ? 1 : 0);
