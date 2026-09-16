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

// 张数不再写死数字。以前写的是 `>= 7`，删掉 C++ 岛之后就红了 ——
// 加/删学科本来就不该弄红测试。改成和学科清单对账：
// 渲染张数必须等于「已上线 manifest 数 + 占位 planned 数」。
const expected = await page.evaluate(() => {
  const s = window.MIAN_SUBJECTS || {};
  return (s.manifests || []).length + (s.planned || []).length;
});
const cards = await page.locator(".subject-card").count();
check("学科卡片张数 = 清单里的学科数", cards === expected && cards > 0,
      `渲染 ${cards} 张 / 清单 ${expected} 个`);

// ---------------------------------------------------------------- 2. 可进入的学科
const ready = page.locator('a.subject-card[data-subject]');
const readyCount = await ready.count();
check("有可进入的学科", readyCount >= 3, `${readyCount} 个`);

const py = page.locator('a.subject-card[data-subject="python"]');
check("萌码 Python 卡片在", (await py.count()) === 1);
check("Python 卡片指向本站 /python/", (await py.getAttribute("href")) === "/python/");

const en = page.locator('a.subject-card[data-subject="en"]');
check("萌语岛卡片在", (await en.count()) === 1);
check("英语卡片指向本站 /en/（PWA 的 scope 绑在这）",
  (await en.getAttribute("href")) === "/en/");

// 卡片顺序必须由 shared/subjects.js 的声明决定，不能由"哪个 manifest 先下载完"决定。
// （之前用 Promise.all 时顺序会飘，这里钉住它，防止回归。）
const order = await page.evaluate(() =>
  Array.from(document.querySelectorAll("a.subject-card[data-subject]"))
       .map(el => el.getAttribute("data-subject"))
);
// 顺序 = subjects.js 里 manifests 的声明顺序。
// **不要写死 id 列表** —— 数学岛上线时这条就是写死的 "python,en,typing" 而红的。
// 现在改成和声明对账，加学科不用改测试。
const declared = await page.evaluate(() =>
  (window.MIAN_SUBJECTS.manifests || []).map(p => String(p).split("/")[1]));
check("可进入学科的卡片顺序 = 声明顺序",
  order.join(",") === declared.join(","), `实际 ${order.join(",")} / 声明 ${declared.join(",")}`);

// 所有学科都在本站：卡片里不能出现别的域名（曾短暂指向过老站，钉死防回归）
const offsite = await page.evaluate(() =>
  Array.from(document.querySelectorAll("a.subject-card[href]"))
       .map(el => el.getAttribute("href"))
       .filter(h => /^https?:/i.test(h))
);
check("没有任何卡片指向外部站点", offsite.length === 0, offsite.join(","));

const allOrder = await page.evaluate(() =>
  Array.from(document.querySelectorAll(".subject-card"))
       .map(el => el.getAttribute("data-subject") || (el.querySelector(".sc-name") || {}).textContent)
);
check("「敬请期待」排在可进入学科之后",
  allOrder.slice(0, 3).join(",") === "python,en,typing", `实际 ${allOrder.slice(0, 4).join(",")}`);

// ---------------------------------------------------------------- 3. 敬请期待的学科
const soon = page.locator('.subject-card[aria-disabled="true"]');
const soonCount = await soon.count();
// 同样和声明对账，不写死数字
const plannedCount = await page.evaluate(() => (window.MIAN_SUBJECTS.planned || []).length);
check("「敬请期待」占位卡片数 = 声明数", soonCount === plannedCount,
      `渲染 ${soonCount} 个 / 声明 ${plannedCount} 个`);
check("占位卡片不是链接（点了不会进空白页）",
  (await page.locator('a.subject-card[aria-disabled="true"]').count()) === 0);

// 只取「敬请期待」那几张卡的文字（不能取整个 #lobby，否则会把已上线的学科也算进来）
const soonText = await page.evaluate(() =>
  Array.from(document.querySelectorAll('.subject-card[aria-disabled="true"]'))
       .map(el => el.textContent).join(" | ")
);
// 占位区的学科名也从声明里取 —— 写死列表的话，每上线一个学科就要改一次测试
// （键盘岛、数学岛、汉字岛上线时都各红过一次）。
const plannedNames = await page.evaluate(() =>
  (window.MIAN_SUBJECTS.planned || []).map(p => p.name));
for (const name of plannedNames) {
  check(`占位里有「${name}」`, soonText.includes(name));
}
// 反过来：已经上线的学科不该再出现在占位里。名字同样从卡片上取。
const liveNames = await page.evaluate(() =>
  Array.from(document.querySelectorAll("a.subject-card[data-subject] .sc-name"))
       .map(el => el.textContent.trim()));
check("至少有一个学科已上线", liveNames.length > 0, liveNames.join(","));
for (const live of liveNames) {
  check(`已上线的学科不在占位区（${live}）`, !soonText.includes(live));
}
// C++ 岛已经从产品里去掉了（2026-09 决定）。这条断言是**反向**的：
// 防止以后有人照着旧文档/旧设计稿把它又抄回来。
check("已去掉的学科不在占位区（C++）", !soonText.includes("C++"));

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
