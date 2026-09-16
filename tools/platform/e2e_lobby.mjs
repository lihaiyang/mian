/**
 * 学科大厅端到端测试（Playwright）
 *
 * 用法：
 *   wrangler pages dev --port 8791
 *   node tools/platform/e2e_lobby.mjs [http://127.0.0.1:8791]
 *
 * 如果本机没有把 playwright 装成依赖，可以指定一份现成的副本：
 *   PLAYWRIGHT_PATH=/path/to/node_modules/playwright node tools/platform/e2e_lobby.mjs
 *
 * 覆盖：大厅渲染 → 学科卡片（可进入的 / 敬请期待的）→ 进入学科 → 「继续上次」→
 *       资源不 404 → 无 JS 报错
 *
 * 这个测试的价值：大厅是学科的「插座」。以后每加一个学科，只要它出现在卡片里
 * 并且能点进去，这条链路就是通的。
 */
const pwSpec = process.env.PLAYWRIGHT_PATH
  ? "file://" + process.env.PLAYWRIGHT_PATH.replace(/\/$/, "") + "/index.mjs"
  : "playwright";
const { chromium } = await import(pwSpec);

const BASE = process.argv[2] || "http://127.0.0.1:8791";
const results = [];
let failed = 0;

function check(name, ok, extra = "") {
  results.push(`${ok ? "✅" : "❌"} ${name}${extra ? " —— " + extra : ""}`);
  if (!ok) failed++;
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

let browser;
try {
  browser = await chromium.launch({ channel: process.env.PW_CHANNEL || "chrome" });
} catch (e) {
  browser = await chromium.launch();
}
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

const consoleErrors = [];
const badResponses = [];
page.on("console", (msg) => { if (msg.type() === "error") consoleErrors.push(msg.text()); });
page.on("pageerror", (err) => consoleErrors.push("pageerror: " + err.message));
page.on("response", (r) => { if (r.status() >= 400) badResponses.push(r.status() + " " + r.url()); });

// 从干净状态开始，否则「继续上次」会被上一次的运行污染
await page.goto(BASE + "/", { waitUntil: "domcontentloaded" });
await page.evaluate(() => { try { localStorage.removeItem("mian_platform_v1__last"); } catch (e) {} });

// ---------------------------------------------------------------- 1. 大厅渲染
await page.goto(BASE + "/", { waitUntil: "domcontentloaded" });
await page.waitForSelector(".subject-card", { timeout: 15000 });
await sleep(500);

check("大厅标题在", (await page.textContent("h1")).includes("今天想学点什么"));

const cards = await page.locator(".subject-card").count();
check("学科卡片已渲染", cards >= 6, `共 ${cards} 张`);

// ---------------------------------------------------------------- 2. 可进入的学科
const ready = page.locator('a.subject-card[data-subject]');
const readyCount = await ready.count();
check("有可进入的学科", readyCount >= 2, `${readyCount} 个`);

const py = page.locator('a.subject-card[data-subject="python"]');
check("萌码 Python 卡片在", (await py.count()) === 1);
check("Python 卡片指向 /python/", (await py.getAttribute("href")) === "/python/");

const en = page.locator('a.subject-card[data-subject="en"]');
check("萌语岛卡片在", (await en.count()) === 1);
check("英语卡片指向 /en/（PWA 路径不能变）", (await en.getAttribute("href")) === "/en/");

// ---------------------------------------------------------------- 3. 敬请期待的学科
const soon = page.locator('.subject-card[aria-disabled="true"]');
const soonCount = await soon.count();
check("「敬请期待」占位卡片在", soonCount >= 4, `${soonCount} 个`);
check("占位卡片不是链接（点了不会进空白页）",
  (await page.locator('a.subject-card[aria-disabled="true"]').count()) === 0);

const soonText = await page.textContent("#lobby");
for (const name of ["数学岛", "键盘岛", "拼音岛", "汉字岛"]) {
  check(`占位里有「${name}」`, soonText.includes(name));
}

// ---------------------------------------------------------------- 4. 没访问过时不该有「继续上次」
check("首次访问不显示「继续上次」", (await page.locator(".resume").count()) === 0);

// ---------------------------------------------------------------- 5. 进入学科 + 继续上次
await py.click();
await page.waitForLoadState("domcontentloaded");
await sleep(1200);
check("点卡片能进 Python", page.url().includes("/python/"), page.url());

// 进 Python 后应该能起引擎（说明搬迁没把资源路径搞坏）
await page.waitForFunction(
  () => document.getElementById("statusText")?.textContent.includes("就绪"),
  null, { timeout: 60000 }
).catch(() => {});
const engineOk = await page.evaluate(
  () => (document.getElementById("statusText")?.textContent || "").includes("就绪")
);
check("Python 引擎仍能就绪（资源路径没搬坏）", engineOk);

// 回大厅 → 应该出现「继续上次」
await page.goto(BASE + "/", { waitUntil: "domcontentloaded" });
await page.waitForSelector(".subject-card", { timeout: 15000 });
await sleep(400);
check("回大厅出现「继续上次」", (await page.locator(".resume").count()) === 1);
if (await page.locator(".resume").count()) {
  check("「继续上次」指向 Python", (await page.locator(".resume").getAttribute("href")) === "/python/");
}

// ---------------------------------------------------------------- 6. 无障碍与错误
check("有跳过导航链接", (await page.locator("a.skip-link").count()) === 1);

await page.goto(BASE + "/", { waitUntil: "domcontentloaded" });
await sleep(800);
check("没有 JS 报错", consoleErrors.length === 0, consoleErrors.slice(0, 3).join(" | "));
check("没有 4xx/5xx 资源", badResponses.length === 0, badResponses.slice(0, 3).join(" | "));

await page.screenshot({ path: "/tmp/lobby.png" });
await browser.close();

console.log(results.join("\n"));
console.log(failed === 0 ? `\n🎉 全部 ${results.length} 项通过` : `\n❌ ${failed} / ${results.length} 项失败`);
process.exit(failed === 0 ? 0 : 1);
