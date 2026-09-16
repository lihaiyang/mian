/**
 * 学习中心 / 判题功能的端到端冒烟测试（Playwright）
 *
 * 用法：
 *   python3 tools/dev_server.py 8791 &
 *   node tools/e2e_learn.mjs [http://127.0.0.1:8791]
 *
 * 如果本机没有把 playwright 装成依赖，可以指定一份现成的副本：
 *   PLAYWRIGHT_PATH=/path/to/node_modules/playwright node tools/e2e_learn.mjs
 *
 * 覆盖：Python 引擎就绪 → 学习中心六个标签页 → 教程小测/标记学完 →
 *       练习筛选与自动判题（做对 / 做错）→ 模拟考 → 成长面板等级与奖牌
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

await page.goto(BASE + "/index.html", { waitUntil: "domcontentloaded" });

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

// 3. 打开成长面板（顶栏头像）→ 等级卡 / 每日任务 / 奖牌
await page.click("#btnUserChip");
await sleep(300);
check("成长面板打开", await page.isVisible("#myPanel .level-card"));
check("等级卡有内容", (await page.textContent("#levelCard")).includes("Lv."));
check("每日任务有 3 条", (await page.locator("#dailyBox .daily-row").count()) === 3);
check("奖牌墙已渲染", (await page.locator("#medalList .medal-item").count()) >= 30);
check("徽章已渲染", (await page.locator("#badgeList .badge-item").count()) >= 100);

// 4. 进入学习中心
await page.click("#btnOpenLearn");
await page.waitForSelector("#learnModal.active");
await sleep(800);
check("学习中心已打开", await page.isVisible("#learnModal.active"));
check("学习地图有阶段卡片", (await page.locator(".stage-card").count()) === 4);
check("学习地图有今日推荐", (await page.locator(".path-today .today-item").count()) >= 3);

// 5. 教程
await page.click('.learn-tab[data-tab="lesson"]');
await page.waitForSelector(".lesson-main", { timeout: 15000 });
const lessonCount = await page.locator(".lesson-item").count();
check("教程列表已加载", lessonCount >= 50, `${lessonCount} 课`);
check("教程正文有示例代码", (await page.locator(".lesson-code").count()) >= 1);
const quizBtns = await page.locator(".quiz-option").count();
check("教程小测已渲染", quizBtns >= 3);

// 答对第一题小测
await page.locator(".quiz-option.right").first().click().catch(async () => {
  // 没有现成的 .right 类，就点第一题的正确选项（由数据决定，这里点击第 2 个）
  await page.locator(".quiz-option").nth(1).click();
});
await sleep(400);
const fb = await page.locator(".quiz-feedback").first().textContent();
check("小测有反馈", /答对|再想想/.test(fb || ""), (fb || "").slice(0, 40));

// 标记学完
await page.click('[data-act="finish-lesson"]');
await sleep(600);
const lessonDone = await page.evaluate(() => Object.keys(Progress.getStats().lessons).length);
check("完成课程被记录", lessonDone >= 1, `lessons=${lessonDone}`);

// 6. 示例
await page.click('.learn-tab[data-tab="example"]');
await page.waitForSelector(".ex-card", { timeout: 20000 });
const exCount = await page.locator(".ex-card").count();
check("示例库已加载", exCount >= 100, `${exCount} 个示例`);
await page.locator(".ex-card").first().click();
await page.waitForSelector(".ex-detail");
check("示例详情可打开", await page.isVisible(".ex-detail .lesson-code"));
await page.click('[data-act="ex-back"]');

// 7. 练习：判题
await page.click('.learn-tab[data-tab="exercise"]');
await page.waitForSelector(".ex-row", { timeout: 30000 });
const exRows = await page.locator(".ex-row").count();
check("练习列表已加载", exRows >= 20, `首屏 ${exRows} 条`);
const totalText = await page.textContent(".ex-list-head");
check("题库总量 ≥1000", /共找到\s*(\d+)\s*道题/.test(totalText) && Number(totalText.match(/(\d+)/)[1]) >= 1000, totalText.trim());

// 直接选一道最简单的 print 题：用第一道
const firstId = await page.locator(".ex-row").first().getAttribute("data-id");
await page.locator(".ex-row").first().click();
await page.waitForSelector(".ex-detail");
const fileCountBefore = await page.evaluate(() => FileManager.getFiles().length);
await page.click('[data-act="ex-goto"]');
await sleep(800);

// 「去编辑器写这道题」应该：把面板收起来 + 建好一个带题目说明的答题文件 + 冒出悬浮小按钮
check("做题时会收起面板", !(await page.isVisible("#learnModal.active")));
check("悬浮小按钮出现", await page.isVisible("#learnChip"));
const fileCountAfter = await page.evaluate(() => FileManager.getFiles().length);
check("自动建好了答题文件", fileCountAfter === fileCountBefore + 1, `${fileCountBefore} → ${fileCountAfter}`);
const editorCode = await page.evaluate(() => CodeEditor.getValue());
check("答题文件里有题目说明", editorCode.includes(firstId) && editorCode.includes("#"));

// 把标准答案写进编辑器，再回来批改
const answer = await page.evaluate((id) => {
  const ex = EXERCISE_BANK.find((e) => e.id === id);
  return ex ? ex.answer : "";
}, firstId);
await page.evaluate((code) => {
  const cm = document.querySelector(".CodeMirror");
  if (cm && cm.CodeMirror) { cm.CodeMirror.setValue(code); return true; }
  window.CodeEditor.setValue(code);
  return true;
}, answer);
await page.click("#learnChip");
await page.waitForSelector("#learnModal.active");
await sleep(300);
await page.click('[data-act="ex-judge"]');
await page.waitForSelector(".judge-result", { timeout: 60000 });
const judgeText = await page.textContent(".judge-result");
check("标准答案能通过判题", judgeText.includes("全部通过"), judgeText.slice(0, 60));
const solvedCount = await page.evaluate(() => Object.keys(Progress.getStats().solved).length);
check("做对的题被记进成长档案", solvedCount >= 1, `solved=${solvedCount}`);

// 故意写错，应该判不通过
await page.evaluate(() => {
  const cm = document.querySelector(".CodeMirror");
  if (cm && cm.CodeMirror) cm.CodeMirror.setValue("print(1)");
});
await page.click('[data-act="ex-judge"]');
await page.waitForSelector(".judge-result.fail", { timeout: 30000 });
check("错误答案会被判错", await page.isVisible(".judge-result.fail"));

// 8. 模拟考
await page.click('.learn-tab[data-tab="exam"]');
await page.waitForSelector(".exam-intro");
await page.click('[data-act="exam-start"]');
await page.waitForSelector(".exam-bar", { timeout: 15000 });
check("模拟考可以开考", (await page.locator(".exam-nav-dot").count()) === 10);
await page.click('[data-act="exam-quit"]');

// 9. 成就页
await page.click('.learn-tab[data-tab="award"]');
await page.waitForSelector(".award-hero");
check("成就页有等级与奖牌", (await page.textContent(".award-stats")).includes("奖牌"));
check("技能熟练度已渲染", (await page.locator(".skill-row").count()) >= 10);

// 10. 控制台错误
const realErrors = consoleErrors.filter((e) => !/favicon|ERR_FILE_NOT_FOUND|Failed to load resource/.test(e));
check("没有 JS 报错", realErrors.length === 0, realErrors.slice(0, 3).join(" | "));

await page.screenshot({ path: "/tmp/learn-award.png" });
await page.click('.learn-tab[data-tab="path"]');
await sleep(400);
await page.screenshot({ path: "/tmp/learn-path.png" });
await page.click('.learn-tab[data-tab="exercise"]');
await sleep(600);
await page.screenshot({ path: "/tmp/learn-exercise.png" });

await browser.close();

console.log(results.join("\n"));
console.log(failed === 0 ? `\n🎉 全部 ${results.length} 项通过` : `\n❌ ${failed} / ${results.length} 项失败`);
process.exit(failed === 0 ? 0 : 1);
