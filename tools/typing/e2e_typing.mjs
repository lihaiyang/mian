/**
 * 键盘岛端到端测试（Playwright）
 *
 * 用法：
 *   wrangler pages dev --port 8791
 *   node tools/typing/e2e_typing.mjs [http://127.0.0.1:8791]
 *
 * 覆盖：关卡列表 → 选关 → 键盘图与下一个键提示 → 真的把一关打完 →
 *       成绩单与星级 → 经验/徽章由平台层发放 → 打错计数与热力图 →
 *       关卡完成状态被记住 → 进度面板 → 无 JS 报错
 *
 * 这个测试同时是**平台契约的验收**：键盘岛没有写任何等级/徽章/打卡代码，
 * 全部靠 shared/core 按 subject.js 的声明自动产生。如果这里的经验、徽章、
 * 打卡断言能过，就证明"加一个学科只要写声明"是成立的。
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
try { browser = await chromium.launch({ channel: process.env.PW_CHANNEL || "chrome" });

// 默认超时：本地 20s 够用，线上要放大 —— 这个站本来就是为"国内到 Cloudflare 不稳"做离线的，
// 拿 20s 卡线上测出来的是网络抖动，不是产品问题。超时放大不拖慢通过的运行。
const E2E_WAIT = Number(process.env.E2E_WAIT_MS || (/^https?:\/\/(127\.|localhost)/.test(BASE) ? 20000 : 60000));
if (browser && browser.setDefaultTimeout) browser.setDefaultTimeout(E2E_WAIT); }
catch (e) { browser = await chromium.launch(); }
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

const consoleErrors = [];
page.on("console", (m) => { if (m.type() === "error") consoleErrors.push(m.text()); });
page.on("pageerror", (e) => consoleErrors.push("pageerror: " + e.message));

// 从干净状态开始，否则"第一次"类徽章早就拿到了
await page.goto(BASE + "/typing/", { waitUntil: "domcontentloaded" });
await page.evaluate(() => {
  Object.keys(localStorage)
    .filter((k) => k.indexOf("mian_typing__") === 0)
    .forEach((k) => localStorage.removeItem(k));
});
await page.goto(BASE + "/typing/", { waitUntil: "domcontentloaded" });
await page.waitForSelector(".ty-lesson", { timeout: 15000 });
await sleep(400);

// ---------------------------------------------------------------- 1. 页面与列表
check("页面标题对", (await page.title()).includes("键盘岛"));

const lessons = await page.locator(".ty-lesson").count();
check("关卡列表渲染", lessons === 17, `${lessons} 关`);

const stages = await page.locator(".ty-stage").count();
check("六个阶段都在", stages === 6, `${stages} 个`);

// ---------------------------------------------------------------- 2. 平台层已挂载
const mods = await page.evaluate(() => ({
  store: typeof Store, progress: typeof Progress, sync: typeof Sync,
  lessons: Array.isArray(window.TYPING_LESSONS) ? window.TYPING_LESSONS.length : 0,
  ready: !!window.__typingReady
}));
check("平台层已挂载", mods.store === "object" && mods.progress === "object" && mods.sync === "object",
  JSON.stringify(mods));
check("学科初始化完成", mods.ready === true);

// ---------------------------------------------------------------- 3. 选一关
await page.locator(".ty-lesson").first().click();
await sleep(300);
check("打字区出现", await page.isVisible("#typingPanel"));
check("键盘图渲染", (await page.locator(".kbd-key").count()) > 40);

const firstChar = await page.evaluate(() =>
  (window.TYPING_LESSONS[0].text || "")[0]);
const nextKey = await page.locator(".kbd-key.next").first().getAttribute("data-k");
check("高亮了下一个要按的键", nextKey === firstChar.toLowerCase(), `期望 ${firstChar} 实际 ${nextKey}`);
check("给出了指法提示", ((await page.textContent("#fingerHint")) || "").length > 0,
  await page.textContent("#fingerHint"));

// ---------------------------------------------------------------- 4. 先故意打错一个，验证错误计数
await page.keyboard.press("Shift");
const wrong = firstChar === "z" ? "q" : "z";
await page.keyboard.type(wrong);
await sleep(150);
check("打错会被标红", (await page.locator(".ty-text .ch.bad").count()) === 1);
check("打错计入错误率", (await page.textContent("#hudAcc")).indexOf("100%") === -1,
  await page.textContent("#hudAcc"));

// ---------------------------------------------------------------- 5. 重开一关，完整打完
await page.locator(".ty-lesson").first().click();
await sleep(300);
const text = await page.evaluate(() => window.TYPING_LESSONS[0].text);
await page.keyboard.type(text, { delay: 25 });
await sleep(600);

check("成绩单出现", await page.isVisible("#resultCard"));
check("三星（全对且够快）", (await page.locator(".ty-star.on").count()) === 3,
  `${await page.locator(".ty-star.on").count()} 星`);

const wpm = await page.textContent("#hudWpm");
check("算出了速度", Number(wpm) > 0, `WPM=${wpm}`);
check("准确率 100%", (await page.textContent("#hudAcc")).indexOf("100%") === 0);
check("没有打错的键", ((await page.textContent(".ty-heat-note")) || "").includes("一个键都没打错"));

// ---------------------------------------------------------------- 6. 平台层发放了奖励（契约验收）
const after = await page.evaluate(() => {
  const s = Store.ns("typing");
  const pid = s.get("profile", "p_default");
  const st = s.get("stats__" + pid, {});
  return {
    xp: st.xp || 0,
    sessions: (st.counters || {}).sessions || 0,
    perfect: (st.counters || {}).perfect || 0,
    chars: (st.counters || {}).chars || 0,
    badges: (st.badges || []).length,
    streak: (st.streak || {}).cur || 0,
    bestWpm: (st.best || {}).bestWpm || 0
  };
});
check("平台层记了经验", after.xp > 0, `xp=${after.xp}`);
check("平台层记了完成次数", after.sessions === 1, `sessions=${after.sessions}`);
check("平台层记了全对次数", after.perfect === 1, `perfect=${after.perfect}`);
check("平台层累计了字符数", after.chars === text.length, `chars=${after.chars}`);
check("平台层算出了连续打卡", after.streak >= 1, `streak=${after.streak}`);
check("平台层记了最好速度", after.bestWpm > 0, `bestWpm=${after.bestWpm}`);
check("平台层自动发了徽章", after.badges >= 1, `${after.badges} 枚`);
check("成绩单里显示了奖励", ((await page.textContent("#resultBody")) || "").includes("经验"));

// ---------------------------------------------------------------- 7. 关卡完成状态被记住
check("关卡被标记为已完成", (await page.locator(".ty-lesson.done").count()) === 1);
await page.reload({ waitUntil: "domcontentloaded" });
await page.waitForSelector(".ty-lesson", { timeout: 15000 });
await sleep(300);
check("刷新后完成状态还在", (await page.locator(".ty-lesson.done").count()) === 1);

// ---------------------------------------------------------------- 8. 进度面板
await page.click("#btnProgress");
await sleep(300);
check("进度面板打开", await page.isVisible("#progressModal .ty-pf-level"));
check("显示等级", ((await page.textContent("#pfLevel")) || "").indexOf("Lv.") === 0,
  await page.textContent("#pfLevel"));
check("每日任务 3 条", (await page.locator("#pfDaily .ty-daily").count()) === 3);
check("徽章墙渲染", (await page.locator("#pfBadges .ty-badge").count()) >= 20);
check("奖牌墙渲染", (await page.locator("#pfMedals .ty-medal").count()) >= 8);
check("有徽章已点亮", (await page.locator("#pfBadges .ty-badge.got").count()) >= 1);
await page.click("#progressModal [data-close]");
await sleep(200);

// ---------------------------------------------------------------- 9. 触摸设备（手机/平板）
// 这一节是回归测试：键盘图原来是一堆 <span>（aria-hidden、没绑任何事件），
// 手机上点它毫无反应也没有提示 —— 整个学科在触摸设备上是 0% 可用的。
// 现在它是一组真按钮，所以这里用**真的触摸上下文**验一遍。
const touchCtx = await browser.newContext({
  viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2
});
const tp = await touchCtx.newPage();
const touchErrors = [];
tp.on("pageerror", (e) => touchErrors.push(e.message));
await tp.goto(BASE + "/typing/", { waitUntil: "domcontentloaded" });
await tp.waitForSelector(".ty-lesson", { timeout: 20000 });
await sleep(400);

check("触摸设备上提示怎么用（不再是「点它不会输入」）",
  /点下面的屏幕键盘|手指/.test(await tp.textContent("#touchNote")),
  (await tp.textContent("#touchNote")).replace(/\s+/g, " ").trim().slice(0, 46));

await tp.locator(".ty-lesson").first().click();
await sleep(500);

const kb = await tp.evaluate(() => {
  const keys = Array.from(document.querySelectorAll("#kbd .kbd-key"));
  const rects = keys.map((e) => e.getBoundingClientRect());
  return {
    total: keys.length,
    buttons: keys.filter((e) => e.tagName === "BUTTON").length,
    ariaHidden: document.getElementById("kbd").getAttribute("aria-hidden"),
    role: document.getElementById("kbd").getAttribute("role"),
    left: Math.min(...rects.map((r) => r.left)),
    right: Math.max(...rects.map((r) => r.right)),
    height: Math.round(rects[0].height),
    vw: document.documentElement.clientWidth,
    scroll: document.documentElement.scrollWidth,
    hasShift: !!document.querySelector('#kbd .kbd-key[data-k="__shift"]'),
    hasBack: !!document.querySelector('#kbd .kbd-key[data-k="__back"]')
  };
});
check("屏幕键盘是真的按钮", kb.total >= 48 && kb.buttons === kb.total, `${kb.buttons}/${kb.total} 个 button`);
check("屏幕键盘不再对读屏隐藏", kb.ariaHidden === null && kb.role === "group");
check("键盘整块落在屏幕里（不用横向滚动）",
  kb.left >= 0 && kb.right <= kb.vw + 1 && kb.scroll <= kb.vw + 1,
  `left=${Math.round(kb.left)} right=${Math.round(kb.right)} vw=${kb.vw}`);
check("键够大（≥44px 高，手指够得着）", kb.height >= 44, `${kb.height}px`);
check("底行有 Shift 和退格", kb.hasShift && kb.hasBack);

// 真的点它 → 必须打进一个字
const progBefore = await tp.evaluate(() => document.getElementById("progressFill").style.width);
const touchNextKey = await tp.evaluate(() => {
  const n = document.querySelector("#kbd .kbd-key.next");
  return n ? n.getAttribute("data-k") : null;
});
if (touchNextKey) await tp.click(`#kbd .kbd-key[data-k="${touchNextKey}"]`);
await sleep(300);
const afterTap = await tp.evaluate(() => ({
  prog: document.getElementById("progressFill").style.width,
  ok: document.querySelectorAll(".ty-text .ch.ok").length,
  note: document.getElementById("touchNote").classList.contains("kb-ok")
}));
check("点屏幕键盘真的能打字（进度会动）",
  afterTap.ok >= 1 && afterTap.prog !== progBefore,
  `进度 ${progBefore} → ${afterTap.prog}，正确 ${afterTap.ok} 字`);
check("打过之后顶部提示自动收起", afterTap.note);

// 粘性 Shift：标点关里「?」必须靠它打得出来
const punctIdx = await tp.evaluate(() => {
  const ls = Array.from(document.querySelectorAll(".ty-lesson"));
  return ls.findIndex((el) => /标点/.test(el.textContent));
});
await tp.goto(BASE + "/typing/", { waitUntil: "domcontentloaded" });
await tp.waitForSelector(".ty-lesson");
await sleep(300);
await tp.locator(".ty-lesson").nth(punctIdx >= 0 ? punctIdx : 0).click();
await sleep(400);
let shiftOk = false, shiftUsed = 0;
for (let i = 0; i < 130; i++) {
  const st = await tp.evaluate(() => {
    const cur = document.querySelector(".ty-text .ch.cur");
    const nx = document.querySelector("#kbd .kbd-key.next");
    return {
      ch: cur ? cur.textContent : null,
      next: nx ? nx.getAttribute("data-k") : null,
      hint: document.getElementById("shiftHint").textContent.trim()
    };
  });
  if (st.ch === null || !st.next) break;
  if (st.hint) {
    await tp.click('#kbd .kbd-key[data-k="__shift"]');
    shiftUsed++;
    await sleep(50);
    shiftOk = true;
  }
  await tp.click(`#kbd .kbd-key[data-k="${st.next}"]`).catch(() => {});
  await sleep(50);
}
const punctRes = await tp.evaluate(() => ({
  ok: document.querySelectorAll(".ty-text .ch.ok").length,
  bad: document.querySelectorAll(".ty-text .ch.bad").length
}));
check("靠屏幕键盘 + 粘性 Shift 能打完标点关（一个都不错）",
  shiftOk && punctRes.bad === 0 && punctRes.ok > 20,
  `用了 ${shiftUsed} 次 Shift，正确 ${punctRes.ok} / 错 ${punctRes.bad}`);

check("触摸设备上没有 JS 报错", touchErrors.length === 0, touchErrors.slice(0, 2).join(" | "));
await touchCtx.close();

// ---------------------------------------------------------------- 10. 大厅里键盘岛已可进入
await page.goto(BASE + "/", { waitUntil: "domcontentloaded" });
await page.waitForSelector(".subject-card", { timeout: 15000 });
await sleep(400);
const ty = page.locator('a.subject-card[data-subject="typing"]');
check("大厅里键盘岛是可进入的", (await ty.count()) === 1);
check("卡片指向 /typing/", (await ty.getAttribute("href")) === "/typing/");
check("大厅卡片显示了我的经验", ((await ty.textContent()) || "").includes("经验"),
  (await ty.textContent() || "").trim().slice(0, 40));

// ---------------------------------------------------------------- 11. 没有 JS 报错
check("没有 JS 报错", consoleErrors.length === 0, consoleErrors.slice(0, 3).join(" | "));

await browser.close();
console.log(results.join("\n"));
console.log(failed === 0 ? `\n🎉 全部 ${results.length} 项通过` : `\n❌ ${failed} / ${results.length} 项失败`);
process.exit(failed === 0 ? 0 : 1);
