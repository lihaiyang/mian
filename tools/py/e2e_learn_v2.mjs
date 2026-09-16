/**
 * v2「学堂模式」端到端测试（Playwright）
 *
 * 用法：
 *   python3 tools/dev_server.py 8791 &
 *   PLAYWRIGHT_PATH=<一份现成的 playwright 目录> node tools/e2e_learn_v2.mjs [地址]
 *
 * 重点验证 v2 的核心承诺：
 *   1. 进入学堂 = 工作台换模式（不是弹窗）：左栏变学习面板，编辑器/输出原地复用；
 *   2. 做题全流程不跳场：题目在左、代码在中、批改结果在右；
 *   3. 学堂草稿：练习代码不进作品库、切题再回来还在、刷新也还在；
 *   4. 回工坊：编辑区恢复成作品库里的文件，工坊 UI 复原；
 *   5. 教程左读右练、示例进沙盒、模拟考照常。
 */
const pwSpec = process.env.PLAYWRIGHT_PATH
  ? "file://" + process.env.PLAYWRIGHT_PATH.replace(/\/$/, "") + "/index.mjs"
  : "playwright";
const { chromium } = await import(pwSpec);

const BASE = process.argv[2] || process.env.BASE || "http://127.0.0.1:8791";
const out = [];
let failed = 0;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
function check(name, ok, extra = "") {
  out.push(`${ok ? "✅" : "❌"} ${name}${extra ? " —— " + extra : ""}`);
  if (!ok) failed++;
}

const browser = await chromium.launch({ channel: process.env.PW_CHANNEL || "chrome" });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
const pageErrors = [];
page.on("pageerror", (e) => pageErrors.push(e.message));
page.on("console", (m) => { if (m.type() === "error") pageErrors.push("console: " + m.text()); });

await page.goto(BASE + "/python/", { waitUntil: "domcontentloaded" });
// 150s 不是随便给的：Pyodide 首屏要拉约 13.6MB（wasm 10.1MB +
// stdlib 2.3MB + 胶水 1.2MB），冷启动或慢网络下 60s 真的会超。
await page.waitForFunction(() => document.getElementById("statusText")?.textContent.includes("就绪"), null, { timeout: 150000 });
check("v2 页面加载 + Python 引擎就绪", true);

await sleep(1500);
if (await page.isVisible("#confirmModal.active")) await page.click("#btnConfirmCancel");

// ---------- 进入学堂：工作台换模式，而不是弹窗 ----------
await page.click("#btnOpenLearnTop");
await page.waitForSelector("#learnBar", { state: "visible", timeout: 10000 });
check("进入学堂（顶栏按钮）", await page.isVisible("#learnBar"));
check("左栏换成学习面板", await page.isVisible("#learnPanel"));
check("文件树已让位（不是盖在上面）", !(await page.isVisible(".filetree-panel")));
check("没有弹窗遮罩", (await page.locator(".modal-overlay.active").count()) === 0);
check("学习地图是整页视图（编辑器按设计让位）", !(await page.isVisible(".editor-panel")));
check("学习地图渲染", (await page.locator(".stage-card").count()) === 4);

// ---------- 教程：左目录 + 上讲下练 ----------
await page.click('.learn-tab[data-tab="lesson"]');
await page.waitForSelector(".lesson-main-head", { timeout: 20000 });
check("教程：左侧目录", (await page.locator(".lesson-item").count()) >= 50,
  `${await page.locator(".lesson-item").count()} 课`);
check("教程：讲解显示在编辑器上方", await page.isVisible("#learnLessonHost .lesson-teach"));
check("教程：讲解里的示例代码", await page.isVisible("#learnLessonHost .lesson-code"));
check("教程：操作条是「我学会了」", (await page.textContent("#learnActionBar")).includes("我学会了"));

// ---------- 教程布局：三种预设 + 拖拽 + 记忆 ----------
const editorBox = () => page.evaluate(() => {
  const w = document.querySelector(".editor-body-wrapper");
  const cm = document.querySelector(".CodeMirror");
  const lh = cm && cm.CodeMirror ? cm.CodeMirror.defaultTextHeight() : 20;
  const h = w ? w.getBoundingClientRect().height : 0;
  const host = document.getElementById("learnLessonHost");
  return {
    editor: Math.round(h),
    lines: Math.floor(h / lh),
    lesson: host && host.offsetParent ? Math.round(host.getBoundingClientRect().height) : 0,
    collapsedCode: !!document.querySelector(".learn-code-row.collapsed"),
    splitter: !!document.querySelector("#learnSplitter.show")
  };
});

let lb = await editorBox();
check("默认「各一半」：编辑器至少 10 行", lb.lines >= 10, `${lb.lesson}/${lb.editor}px → ${lb.lines} 行`);
check("「各一半」时有可拖的分隔条", lb.splitter);

await page.click('[data-act="layout"][data-mode="read"]');
await sleep(350);
lb = await editorBox();
check("📖 讲解优先：讲解区铺满（≥500px）", lb.lesson >= 500, `讲解 ${lb.lesson}px`);
check("📖 讲解优先：代码区收成提示栏", lb.collapsedCode);
check("📖 讲解优先：提示栏可以点开", await page.isVisible(".learn-code-row.collapsed"));

await page.click(".learn-code-row.collapsed");
await sleep(350);
lb = await editorBox();
check("点提示栏回到「各一半」", !lb.collapsedCode && lb.editor >= 280, `${lb.editor}px`);

await page.keyboard.press("Alt+3");
await sleep(350);
lb = await editorBox();
check("⌨️ 代码优先（Alt+3）：编辑器 ≥20 行", lb.lines >= 20, `${lb.editor}px → ${lb.lines} 行`);
check("⌨️ 代码优先：讲解收成标题栏", lb.lesson <= 60, `${lb.lesson}px`);

await page.keyboard.press("Alt+2");
await sleep(350);
lb = await editorBox();
check("Alt+2 回到「各一半」", lb.splitter && lb.lines >= 10 && lb.lines <= 18, `${lb.lines} 行`);

// 往上拖分隔条：讲解变小、编辑器变大
const sp = await page.locator("#learnSplitter").boundingBox();
await page.mouse.move(sp.x + sp.width / 2, sp.y + sp.height / 2);
await page.mouse.down();
await page.mouse.move(sp.x + sp.width / 2, sp.y - 150, { steps: 8 });
await page.mouse.up();
await sleep(350);
const dragged = await editorBox();
check("拖分隔条可以自己调比例", dragged.editor > lb.editor + 60, `${lb.editor}px → ${dragged.editor}px`);

// 记忆：切到「代码优先」后刷新页面，布局还在
await page.keyboard.press("Alt+3");
await sleep(300);
await page.reload({ waitUntil: "domcontentloaded" });
// 150s 不是随便给的：Pyodide 首屏要拉约 13.6MB（wasm 10.1MB +
// stdlib 2.3MB + 胶水 1.2MB），冷启动或慢网络下 60s 真的会超。
await page.waitForFunction(() => document.getElementById("statusText")?.textContent.includes("就绪"), null, { timeout: 150000 });
await sleep(700);
if (await page.isVisible("#confirmModal.active")) await page.click("#btnConfirmCancel");
await page.click("#btnOpenLearnTop");
await page.waitForSelector("#learnBar", { state: "visible" });
await page.click('.learn-tab[data-tab="lesson"]');
await page.waitForSelector(".lesson-main-head", { timeout: 20000 });
await sleep(500);
const afterReload = await editorBox();
check("刷新后布局比例会记住（仍是代码优先）", afterReload.lines >= 18, `${afterReload.lines} 行`);

// 恢复到「各一半」，后面的用例继续
await page.keyboard.press("Alt+2");
await sleep(350);

// 小测答对（按数据里的正确答案点，避免依赖渲染出来的 class）
const quizAnswer = await page.evaluate(() => {
  const all = (typeof LEARN_LESSONS !== "undefined" ? LEARN_LESSONS : []).concat(
    typeof LEARN_LESSONS_ADV !== "undefined" ? LEARN_LESSONS_ADV : []);
  const id = Learn.currentLearnId();
  const l = all.find((x) => x.id === id);
  return l && l.quiz && l.quiz[0] ? Number(l.quiz[0].answer) : 0;
});
await page.locator("#learnLessonHost .lesson-quiz").first()
  .locator(".quiz-option").nth(quizAnswer).click();
await sleep(300);
check("课后小测有反馈", /答对|再想想/.test(await page.textContent("#learnLessonHost .quiz-feedback")));

// 示例代码送进编辑器
await page.click('[data-act="lesson-code-to-editor"]');
await sleep(300);
const lessonCodeInEditor = await page.evaluate(() => CodeEditor.getValue());
check("示例代码可以一键放进编辑器", lessonCodeInEditor.trim().length > 0);

// 我学会了
await page.click('[data-act="finish-lesson"]');
await sleep(500);
check("「我学会了」记录到成长档案",
  (await page.evaluate(() => Object.keys(Progress.getStats().lessons).length)) >= 1);

// ---------- 练习：题目在左、代码在中、批改在右 ----------
const studioFileBefore = await page.evaluate(() => {
  const f = FileManager.getActiveFile();
  return { id: f.id, name: f.name, content: f.content, count: FileManager.getFiles().length };
});

await page.click('.learn-tab[data-tab="exercise"]');
await page.waitForSelector(".ex-row", { timeout: 40000 });
check("练习：题目列表（默认只看没做对的）",
  (await page.textContent(".ex-list-head")).includes("共"), (await page.textContent(".ex-list-head")).trim());
check("题库 ≥1000", Number((await page.textContent(".ex-list-head")).match(/(\d+)/)[1]) >= 1000);

const firstId = await page.locator(".ex-row").first().getAttribute("data-id");
await page.locator(".ex-row").first().click();
await page.waitForSelector(".task-card");
check("题目卡在左栏（不用跳出去看题）", await page.isVisible(".task-card .task-body"));
check("任务条显示正在做哪一题", (await page.textContent("#learnTaskCrumb")).includes(firstId));
check("起始模板自动进了编辑器",
  (await page.evaluate(() => CodeEditor.getValue())).includes(firstId));
check("做题时编辑器就在中间（原地复用，没有换地方）", await page.isVisible(".CodeMirror"));
check("操作条出现「交卷批改」", (await page.textContent("#learnActionBar")).includes("交卷批改"));
check("做题期间没有新建作品库文件",
  (await page.evaluate(() => FileManager.getFiles().length)) === studioFileBefore.count);

// 写入标准答案 → 交卷批改
const answer = await page.evaluate((id) => (EXERCISE_BANK.find((e) => e.id === id) || {}).answer || "", firstId);
await page.evaluate((code) => {
  const cm = document.querySelector(".CodeMirror");
  if (cm && cm.CodeMirror) { cm.CodeMirror.setValue(code); return; }
  CodeEditor.setValue(code);
}, answer);
await page.click('[data-act="judge"]');
await page.waitForSelector(".judge-result", { timeout: 60000 });
const judgeText = await page.textContent(".judge-result");
check("批改结果就在右边（输出面板的「批改」视图）", await page.isVisible("#judgeView"));
check("标准答案全部通过", judgeText.includes("全部通过"), judgeText.slice(0, 40));
check("做对后写入成长档案",
  (await page.evaluate(() => Object.keys(Progress.getStats().solved).length)) >= 1);

// 全对后出现「下一题」倒计时，可以取消
check("全对后出现自动下一题提示", (await page.locator(".learn-next-chip").count()) === 1);
await page.click('[data-act="stay"]');
await sleep(200);
check("可以点「留在这题」取消自动跳转", (await page.locator(".learn-next-chip").count()) === 0);

// 故意写错 → 判错
await page.evaluate(() => {
  const cm = document.querySelector(".CodeMirror");
  if (cm && cm.CodeMirror) cm.CodeMirror.setValue("print(0)");
});
await page.click('[data-act="judge"]');
await page.waitForSelector(".judge-result.fail", { timeout: 30000 });
check("错误答案会被判错并给出对比", await page.isVisible(".judge-result.fail"));

// ---------- 学堂草稿：换题再回来还在，且不进作品库 ----------
await page.evaluate(() => {
  const cm = document.querySelector(".CodeMirror");
  if (cm && cm.CodeMirror) cm.CodeMirror.setValue("# 我的独家解法\nprint(12345)");
});
await sleep(1200);   // 等草稿防抖落盘
await page.click('[data-act="next"]');
await sleep(800);
const secondId = await page.evaluate(() => Learn.currentLearnId());
check("「下一题」直接换题（还在学堂里）", secondId && secondId !== firstId, `${firstId} → ${secondId}`);
await page.click('[data-act="prev"]');
await sleep(800);
const draftBack = await page.evaluate(() => CodeEditor.getValue());
check("切回上一题，草稿原样回来", draftBack.includes("我的独家解法"), draftBack.split("\n")[0]);
const draftCount = await page.evaluate(() => Learn.draftCount());
check("学堂草稿单独存在（不进作品库）", draftCount >= 2, `${draftCount} 份`);
check("作品库文件数量没有变多",
  (await page.evaluate(() => FileManager.getFiles().length)) === studioFileBefore.count);

// 刷新页面：草稿仍然在
await page.reload({ waitUntil: "domcontentloaded" });
// 150s 不是随便给的：Pyodide 首屏要拉约 13.6MB（wasm 10.1MB +
// stdlib 2.3MB + 胶水 1.2MB），冷启动或慢网络下 60s 真的会超。
await page.waitForFunction(() => document.getElementById("statusText")?.textContent.includes("就绪"), null, { timeout: 150000 });
await sleep(800);
if (await page.isVisible("#confirmModal.active")) await page.click("#btnConfirmCancel");
await page.click("#btnOpenLearnTop");
await page.waitForSelector("#learnBar", { state: "visible" });
await page.click('.learn-tab[data-tab="exercise"]');
await page.waitForSelector(".ex-row", { timeout: 40000 });
await page.locator(`.ex-row[data-id="${firstId}"]`).first().click().catch(async () => {
  // 已做对的题默认被“还没做对”筛掉了，切到全部
  await page.click('[data-act="ex-status"][data-status="all"]');
  await sleep(400);
  await page.locator(`.ex-row[data-id="${firstId}"]`).first().click();
});
await page.waitForSelector(".task-card");
check("刷新后草稿还在（学堂草稿会保留）",
  (await page.evaluate(() => CodeEditor.getValue())).includes("我的独家解法"));

// ---------- 示例：直接进沙盒 ----------
await page.click('.learn-tab[data-tab="example"]');
await page.waitForSelector(".ex-row", { timeout: 30000 });
await page.locator('.learn-panel .ex-row').first().click();
await sleep(600);
check("示例点开就进沙盒（代码在编辑器里）",
  (await page.evaluate(() => CodeEditor.getValue())).trim().length > 0);
check("示例也在学堂里运行，不建作品库文件",
  (await page.evaluate(() => FileManager.getFiles().length)) === studioFileBefore.count);

// 示例：对照原版（并排）
const beforeCompare = await page.evaluate(() => Math.round(document.querySelector(".editor-body-wrapper").getBoundingClientRect().width));
await page.click("#btnCompare");
await sleep(400);
const cmp = await page.evaluate(() => {
  const c = document.getElementById("learnCompareHost");
  return { show: c.classList.contains("show"), text: (c.textContent || "").slice(0, 12),
           editorW: Math.round(document.querySelector(".editor-body-wrapper").getBoundingClientRect().width) };
});
check("示例「↔ 对照原版」出现并排的原始代码", cmp.show && cmp.text.includes("原版"), cmp.text);
check("对照时编辑器自动让出一半宽度", cmp.editorW < beforeCompare - 100, `${beforeCompare}px → ${cmp.editorW}px`);
await page.click('[data-act="compare-close"]');
await sleep(300);
check("可以收起对照栏",
  !(await page.evaluate(() => document.getElementById("learnCompareHost").classList.contains("show"))));

// 专注写代码
await page.keyboard.press("Escape");
await page.click("#btnFocus");
await sleep(500);
const focusBox = await page.evaluate(() => ({
  header: !!(document.querySelector(".app-header") || {}).offsetParent,
  panel: !!(document.querySelector(".learn-panel") || {}).offsetParent,
  output: !!(document.querySelector(".output-panel") || {}).offsetParent,
  editor: Math.round(document.querySelector(".editor-body-wrapper").getBoundingClientRect().height)
}));
check("⛶ 专注模式：其它面板都让位", !focusBox.header && !focusBox.panel && !focusBox.output);
check("⛶ 专注模式：编辑器铺满（≥650px）", focusBox.editor >= 650, `${focusBox.editor}px`);
await page.keyboard.press("Escape");
await sleep(400);
check("Esc 退出专注模式", !(await page.evaluate(() => document.body.classList.contains("learn-focus"))));

// ---------- 存进作品库 ----------
const savedContent = await page.evaluate(() => CodeEditor.getValue());
await page.click("#btnLearnSaveToLib");
await sleep(600);
check("「📌 存进作品库」会正式存成文件",
  (await page.evaluate(() => FileManager.getFiles().length)) === studioFileBefore.count + 1);

// ---------- 模拟考 ----------
await page.click('.learn-tab[data-tab="exam"]');
await page.waitForSelector('[data-act="exam-start"]');
await page.click('[data-act="exam-start"]');
await sleep(800);
check("模拟考可以在学堂里开考", (await page.locator(".exam-nav-dot").count()) === 10);
check("考试时任务条显示计时", (await page.textContent("#learnTaskProgress")).includes("⏱"));
check("考试时编辑器在位（≥300px）",
  (await page.evaluate(() => {
    const w = document.querySelector(".editor-body-wrapper");
    return !!w && !!w.offsetParent && w.getBoundingClientRect().height >= 300;
  })));

// 回归：考试里翻回上一题，写的代码不能丢
const examQ1 = await page.evaluate(() => Learn.currentLearnId());
await page.evaluate(() => {
  const cm = document.querySelector(".CodeMirror");
  if (cm && cm.CodeMirror) cm.CodeMirror.setValue("# 我的考试答案\nprint(2026)");
});
await sleep(800);
await page.click('[data-act="exam-next"]');
await sleep(700);
check("考试可以翻到下一题", (await page.evaluate(() => Learn.currentLearnId())) !== examQ1);
await page.click('[data-act="exam-prev"]');
await sleep(700);
check("翻回上一题，答案还在",
  (await page.evaluate(() => CodeEditor.getValue())).includes("我的考试答案"));

// 回归：考试里作答不能污染这道题平时的练习草稿
await page.click('.learn-tab[data-tab="exercise"]');
await page.waitForSelector(".ex-row", { timeout: 30000 });
await sleep(400);
const draftKeys = await page.evaluate(() => Object.keys(JSON.parse(
  localStorage.getItem("codepanda_learn_drafts_v1__" + Progress.getCurrentProfile().id) || "{}")));
check("考试中的代码不会写进练习草稿", draftKeys.indexOf(examQ1) === -1, "草稿 " + draftKeys.length + " 份");

// 回归：从别的小节切回模拟考，编辑器要装回这一题的代码
await page.click('.learn-tab[data-tab="exam"]');
await sleep(800);
check("切回模拟考会恢复这一题写的代码",
  (await page.evaluate(() => CodeEditor.getValue())).includes("我的考试答案"));

// 考试里「讲解优先」把代码区收起后，别的环节不受影响
await page.click('[data-act="layout"][data-mode="read"]').catch(() => {});
await page.click('.learn-tab[data-tab="example"]');
await page.waitForSelector(".learn-panel .ex-row", { timeout: 20000 });
await sleep(400);
check("在别的环节编辑器不会被「讲解优先」藏起来",
  await page.evaluate(() => {
    const w = document.querySelector(".editor-body-wrapper");
    return !!w && !!w.offsetParent && !document.querySelector(".learn-code-row").classList.contains("collapsed");
  }));

// ---------- 回工坊：编辑器恢复成作品库里的文件 ----------
await page.click("#btnLearnExit");
await sleep(600);
check("回到工坊：学习面板收起", !(await page.isVisible("#learnPanel")));
check("回到工坊：文件树回来", await page.isVisible(".filetree-panel"));
const afterExit = await page.evaluate(() => {
  const f = FileManager.getActiveFile();
  return { editor: CodeEditor.getValue(), file: f ? f.content : "", name: f ? f.name : "" };
});
check("回到工坊：编辑区恢复成当前作品库文件",
  afterExit.editor === afterExit.file && afterExit.file.length > 0,
  afterExit.name);
check("「存进作品库」的那份代码确实落盘了",
  afterExit.file === savedContent && savedContent.trim().length > 0,
  "文件 " + afterExit.name + " 共 " + afterExit.file.length + " 字");

// 工坊里正常编辑仍然写文件（模式分流没有把工坊弄坏）
await page.evaluate(() => { CodeEditor.setValue("# 工坊里改一改\nprint(1)\n"); });
await sleep(500);
check("工坊模式下编辑仍然写进文件",
  (await page.evaluate(() => (FileManager.getActiveFile() || {}).content)).includes("工坊里改一改"));

// ---------- 🎁 示例宝库（右上角按钮 + 弹窗分类 + 打开进沙盒） ----------
check("右上角按钮叫「示例宝库」", (await page.textContent("#btnResetDemos")).includes("示例宝库"));
check("左栏「示例宝库」是宝库入口（和右上角是同一个东西）",
  (await page.evaluate(() => (document.querySelector(".folder-entry .folder-name") || {}).textContent)) === "示例宝库");
check("工作区里不再有内置示例文件（示例只住在宝库里）",
  (await page.evaluate(() => FileManager.getFiles().filter(f => /^ex_/.test(f.id)).length)) === 0);

const filesBeforeGallery = await page.evaluate(() => FileManager.getFiles().length);
await page.click(".folder-entry");   // 从左栏入口进宝库
await page.waitForSelector("#galleryList .gallery-item", { timeout: 30000 });
const galleryTabs = await page.evaluate(() => [...document.querySelectorAll("#galleryTabs .gallery-tab")].map(b => b.textContent.trim()));
check("弹窗展示全部分类（≥9 个标签）", galleryTabs.length >= 9, galleryTabs.slice(0, 4).join(" / "));
check("弹窗里有「小游戏」分类", galleryTabs.some(t => t.includes("小游戏")));
const galleryCount = await page.locator("#galleryList .gallery-item").count();
check("示例总数 ≥100", galleryCount >= 100, galleryCount + " 个");

await page.evaluate(() => {
  const t = [...document.querySelectorAll("#galleryTabs .gallery-tab")].find(b => b.textContent.includes("小游戏"));
  if (t) t.click();
});
await sleep(400);
const gameCount = await page.locator("#galleryList .gallery-item").count();
check("小游戏示例 ≥10 个", gameCount >= 10, gameCount + " 个");
await page.locator("#galleryList .gallery-item").first().click();
await sleep(1200);
check("从弹窗点开示例 → 进学习中心沙盒",
  (await page.evaluate(() => document.body.classList.contains("mode-learn"))) &&
  (await page.evaluate(() => document.querySelector("#learnTabs .learn-tab.active").dataset.tab)) === "example");
check("沙盒里已经有示例代码", (await page.evaluate(() => CodeEditor.getValue())).trim().length > 0);
check("打开示例不会新建作品库文件",
  (await page.evaluate(() => FileManager.getFiles().length)) === filesBeforeGallery);

// 改一个示例 → 用「♻️ 还原全部示例」清掉（顺便回归：确认弹窗要能点得到）
const exampleOpened = await page.evaluate(() => Learn.currentLearnId());
await page.evaluate(() => { const cm = document.querySelector(".CodeMirror"); if (cm && cm.CodeMirror) cm.CodeMirror.setValue("# 我改过了"); });
await sleep(900);
const hasExampleDraft = () => page.evaluate((id) => {
  const all = JSON.parse(localStorage.getItem("codepanda_learn_drafts_v1__" + Progress.getCurrentProfile().id) || "{}");
  return !!all[id];
}, exampleOpened);
check("改示例会产生学堂草稿", await hasExampleDraft());
await page.click("#btnResetDemos");
await page.waitForSelector("#galleryList .gallery-item", { timeout: 20000 });
await page.click("#btnGalleryReset");
await sleep(400);
check("确认弹窗盖在宝库弹窗之上（按钮可点）", await page.isVisible("#confirmModal.active"));
await page.click("#btnConfirmOk");
await sleep(800);
check("「还原全部示例」清掉了示例草稿", !(await hasExampleDraft()));

const realErrors = pageErrors.filter((e) => !/favicon|ERR_FILE_NOT_FOUND|Failed to load resource/.test(e));
check("没有 JS 报错", realErrors.length === 0, realErrors.slice(0, 2).join(" | "));

await page.screenshot({ path: "/tmp/v2-studio.png" });
await page.click("#btnOpenLearnTop");
await page.waitForSelector("#learnBar", { state: "visible" });
await page.click('.learn-tab[data-tab="lesson"]');
await page.waitForSelector(".lesson-main-head");
await sleep(500);
await page.screenshot({ path: "/tmp/v2-learn-lesson.png" });
await page.click('.learn-tab[data-tab="exercise"]');
await page.waitForSelector(".ex-row");
await page.locator(".learn-panel .ex-row").first().click();
await page.waitForSelector(".task-card");
await sleep(400);
await page.screenshot({ path: "/tmp/v2-learn-exercise.png" });

await browser.close();
console.log(out.join("\n"));
console.log(failed === 0 ? `\n🎉 v2 全部 ${out.length} 项通过` : `\n❌ ${failed} / ${out.length} 项失败`);
process.exit(failed === 0 ? 0 : 1);
