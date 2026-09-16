/**
 * 成长档案（我的档案）端到端冒烟测试（Playwright）
 *
 * 为什么单独有这么一个文件：
 *   原来这些断言住在 e2e_learn.mjs 里，而那个文件是围绕 **v1 的学习中心弹窗**
 *   （#learnModal / .learn-tab / #learnChip）写的。v2 学堂模式成为唯一正式版之后，
 *   弹窗退休，那一整套标签页断言由 e2e_learn_v2.mjs（80 项）覆盖。
 *   但成长档案那几项**只在这里有**：e2e_learn_v2.mjs 完全不碰
 *   等级 / 每日任务 / 奖牌 / 徽章（grep「成就|奖牌|徽章」= 0 次），
 *   所以把 e2e_learn.mjs 整个删掉会静默丢掉这部分覆盖。此文件就是那份覆盖。
 *
 * 用法：
 *   python3 tools/dev_server.py 8791 &
 *   node tools/py/e2e_growth.mjs [http://127.0.0.1:8791]
 *
 * 如果本机没有把 playwright 装成依赖，可以指定一份现成的副本：
 *   PLAYWRIGHT_PATH=/path/to/node_modules/playwright node tools/py/e2e_growth.mjs
 *
 * 覆盖：Python 引擎就绪 → 模块挂载 → 新手引导 → 成长面板（等级卡 / 每日任务 /
 *       奖牌墙 / 徽章）→ 无 JS 报错
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

// 优先用系统 Chrome（本机已装，免得再下载一份浏览器）；失败则回退到 Playwright 自带内核
let browser;
try {
  browser = await chromium.launch({ channel: process.env.PW_CHANNEL || "chrome" });
} catch (e) {
  browser = await chromium.launch();
}
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

const consoleErrors = [];
page.on("console", (msg) => {
  if (msg.type() === "error") consoleErrors.push(msg.text());
});
page.on("pageerror", (err) => consoleErrors.push("pageerror: " + err.message));

await page.goto(BASE + "/python/", { waitUntil: "domcontentloaded" });

// 1. 引擎就绪
await page.waitForFunction(() => document.getElementById("statusText")?.textContent.includes("就绪"), null, { timeout: 60000 });
check("Python 引擎就绪", true);

// 2. 模块挂载
const mods = await page.evaluate(() => {
  // 注意：progress.js / learn.js 用的是顶层 const，不是 window 上的属性，
  // 所以在页面里要用裸标识符判断（window.Progress 会是 undefined）
  const t = (name) => { try { return eval("typeof " + name); } catch (e) { return "error"; } };
  return { learn: t("Learn"), progress: t("Progress"), runner: t("PythonRunner") };
});
check("模块已挂载", mods.learn === "object" && mods.progress === "object" && mods.runner === "object", JSON.stringify(mods));

// 关掉新手引导弹窗（首次访问会出现，挡住了后面的点击）
await sleep(1500);
if (await page.isVisible("#confirmModal.active")) {
  await page.click("#btnConfirmCancel");
  await sleep(300);
}
check("新手引导可关闭", !(await page.isVisible("#confirmModal.active")));

// 3. 打开成长面板（顶栏头像）→ 等级卡 / 每日任务 / 奖牌 / 徽章
await page.click("#btnUserChip");
await sleep(300);
check("成长面板打开", await page.isVisible("#myPanel .level-card"));
check("等级卡有内容", (await page.textContent("#levelCard")).includes("Lv."));
check("每日任务有 3 条", (await page.locator("#dailyBox .daily-row").count()) === 3);
check("奖牌墙已渲染", (await page.locator("#medalList .medal-item").count()) >= 30);
check("徽章已渲染", (await page.locator("#badgeList .badge-item").count()) >= 100);

await page.screenshot({ path: "/tmp/growth-panel.png" });

// 4. 没有 JS 报错
check("没有 JS 报错", consoleErrors.length === 0, consoleErrors.slice(0, 3).join(" | "));

await browser.close();

console.log(results.join("\n"));
console.log(failed === 0 ? `\n🎉 全部 ${results.length} 项通过` : `\n❌ ${failed} / ${results.length} 项失败`);
process.exit(failed === 0 ? 0 : 1);
