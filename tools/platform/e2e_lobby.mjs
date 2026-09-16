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
check("学科卡片已渲染", cards >= 7, `共 ${cards} 张`);

// ---------------------------------------------------------------- 2. 可进入的学科
const ready = page.locator('a.subject-card[data-subject]');
const readyCount = await ready.count();
check("有可进入的学科", readyCount >= 3, `${readyCount} 个`);

const py = page.locator('a.subject-card[data-subject="python"]');
check("萌码 Python 卡片在", (await py.count()) === 1);
check("Python 卡片指向老站（数据在那边）",
  (await py.getAttribute("href")) === "https://mian.lihaiyang.net/");

const en = page.locator('a.subject-card[data-subject="en"]');
check("萌语岛卡片在", (await en.count()) === 1);
check("英语卡片指向老站的 /en/（PWA 装在这边）",
  (await en.getAttribute("href")) === "https://mian.lihaiyang.net/en/");

// 卡片顺序必须由 shared/subjects.js 的声明决定，不能由"哪个 manifest 先下载完"决定。
// （之前用 Promise.all 时顺序会飘，这里钉住它，防止回归。）
const order = await page.evaluate(() =>
  Array.from(document.querySelectorAll("a.subject-card[data-subject]"))
       .map(el => el.getAttribute("data-subject"))
);
check("可进入学科的卡片顺序 = 声明顺序",
  order.join(",") === "python,en,typing", `实际 ${order.join(",")}`);

const allOrder = await page.evaluate(() =>
  Array.from(document.querySelectorAll(".subject-card"))
       .map(el => el.getAttribute("data-subject") || (el.querySelector(".sc-name") || {}).textContent)
);
check("「敬请期待」排在可进入学科之后",
  allOrder.slice(0, 3).join(",") === "python,en,typing", `实际 ${allOrder.slice(0, 4).join(",")}`);

// ---------------------------------------------------------------- 3. 敬请期待的学科
const soon = page.locator('.subject-card[aria-disabled="true"]');
const soonCount = await soon.count();
check("「敬请期待」占位卡片在", soonCount >= 3, `${soonCount} 个`);
check("占位卡片不是链接（点了不会进空白页）",
  (await page.locator('a.subject-card[aria-disabled="true"]').count()) === 0);

// 只取「敬请期待」那几张卡的文字（不能取整个 #lobby，否则会把已上线的学科也算进来）
const soonText = await page.evaluate(() =>
  Array.from(document.querySelectorAll('.subject-card[aria-disabled="true"]'))
       .map(el => el.textContent).join(" | ")
);
for (const name of ["数学岛", "拼音岛", "汉字岛", "C++ 工坊"]) {
  check(`占位里有「${name}」`, soonText.includes(name));
}
// 键盘岛已经上线了，不该再出现在占位里
check("已上线的学科不在占位区", !soonText.includes("键盘岛"));

// ---------------------------------------------------------------- 4. 没访问过时不该有「继续上次」
check("首次访问不显示「继续上次」", (await page.locator(".resume").count()) === 0);

// ---------------------------------------------------------------- 5. 进入学科 + 继续上次
await page.locator('a.subject-card[data-subject="typing"]').click();
await page.waitForLoadState("domcontentloaded");
await sleep(1200);
check("点卡片能进学科", page.url().includes("/typing/"), page.url());

// 进打字学科后应该真的能用（说明平台层与学科资源都加载成功了）
await page.waitForSelector(".ty-lesson", { timeout: 20000 }).catch(() => {});
check("打字学科可用", (await page.locator(".ty-lesson").count()) >= 17,
  `${await page.locator(".ty-lesson").count()} 关`);

// 回大厅 → 应该出现「继续上次」
await page.goto(BASE + "/", { waitUntil: "domcontentloaded" });
await page.waitForSelector(".subject-card", { timeout: 15000 });
await sleep(400);
check("回大厅出现「继续上次」", (await page.locator(".resume").count()) === 1);
if (await page.locator(".resume").count()) {
  check("「继续上次」指向打字", (await page.locator(".resume").getAttribute("href")) === "/typing/");
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
