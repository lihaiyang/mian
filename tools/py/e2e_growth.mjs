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

// 默认超时：本地 20s 够用，线上要放大 —— 这个站本来就是为"国内到 Cloudflare 不稳"做离线的，
// 拿 20s 卡线上测出来的是网络抖动，不是产品问题。超时放大不拖慢通过的运行。
const E2E_WAIT = Number(process.env.E2E_WAIT_MS || (/^https?:\/\/(127\.|localhost)/.test(BASE) ? 20000 : 60000));
if (browser && browser.setDefaultTimeout) browser.setDefaultTimeout(E2E_WAIT);
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
// 150s 不是随便给的：Pyodide 首屏要拉约 13.6MB（wasm 10.1MB +
// stdlib 2.3MB + 胶水 1.2MB），冷启动或慢网络下 60s 真的会超。
await page.waitForFunction(() => document.getElementById("statusText")?.textContent.includes("就绪"), null, { timeout: 150000 });
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

// 3. 打开成长面板 → 等级卡 / 每日任务 / 奖牌 / 徽章
//    「我的档案」已经从顶栏搬进 ⚙️ 设置菜单（顶栏 6 个控件收敛成 3 个），
//    所以要先开菜单再点里头那一项。
await page.click("#pyGear");
await page.waitForSelector("#pyMenu:not([hidden])", { timeout: 5000 });
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
