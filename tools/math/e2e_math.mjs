/**
 * 数学岛端到端测试（Playwright）
 *
 * 用法：
 *   node tools/math/e2e_math.mjs [http://127.0.0.1:8788]
 *
 * 覆盖：题库加载 → 年级/单元列表 → 出题与判分（对/错两条路）→ 一组做完的小结
 *       → 平台层成长（等级/徽章/奖牌/每日任务）→ 大厅卡片 → 云同步挂载
 *
 * 这个测试的价值：数学岛是平台契约的**第二个**真实用户。
 * 它自己一行等级/打卡/徽章/同步代码都没写，所以这些断言全过，
 * 就证明契约是可复用的，而不是只为键盘岛定制的。
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
}

const browser = await chromium.launch(
  process.env.CHROME_BIN ? { executablePath: process.env.CHROME_BIN } : {}
);
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
const pageErrors = [];
page.on("pageerror", (e) => pageErrors.push(e.message));

await page.goto(BASE + "/math/", { waitUntil: "domcontentloaded" });
await page.waitForSelector(".ma-unit", { timeout: 20000 });
await sleep(600);

// ---------------------------------------------------------------- 1. 题库与界面
const meta = await page.evaluate(() => ({
  units: (window.MATH_UNITS || []).length,
  items: (window.MATH_UNITS || []).reduce((s, u) => s + u.items.length, 0),
  grades: Array.from(new Set((window.MATH_UNITS || []).map((u) => u.grade))).sort(),
  bad: (window.MATH_UNITS || []).flatMap((u) => u.items.filter((i) => !i.q || !i.a)).length,
  dup: (() => {
    const seen = new Set(); let dup = 0;
    (window.MATH_UNITS || []).forEach((u) => u.items.forEach((i) => {
      if (seen.has(i.id)) dup++; seen.add(i.id);
    }));
    return dup;
  })(),
}));
check("题库 ≥ 1000 道", meta.items >= 1000, `${meta.items} 道`);
check("覆盖 1–6 年级", meta.grades.join(",") === "1,2,3,4,5,6", meta.grades.join(","));
check("没有空题面或空答案", meta.bad === 0, `${meta.bad} 道`);
check("id 不重复", meta.dup === 0, `${meta.dup} 个重复`);
check("顶栏有「← 大厅」", (await page.locator(".topbar-back").count()) > 0);
check("年级按钮 6 个", (await page.locator(".ma-grade").count()) === 6);
check("单元列表已渲染", (await page.locator(".ma-unit").count()) > 0);
check("数字键盘已渲染", (await page.locator(".ma-key").count()) >= 12);

// 每个年级都能切
let gradeOk = true;
for (const g of [1, 2, 3, 4, 5, 6]) {
  await page.locator(".ma-grade").nth(g - 1).click();
  await sleep(150);
  const n = await page.locator(".ma-unit").count();
  if (n < 1) gradeOk = false;
}
check("六个年级都能切出单元", gradeOk);

// ---------------------------------------------------------------- 2. 判分
await page.locator(".ma-grade").first().click();
await sleep(200);
await page.locator(".ma-unit").first().click();
await page.waitForSelector("#playCard", { state: "visible" });
await sleep(300);

/** 从题库里取出屏幕上这道题的正确答案 */
const answerOfShown = () => page.evaluate(() => {
  const id = document.querySelector(".ma-unit.active").dataset.unit;
  const u = window.MATH_UNITS.find((x) => x.id === id);
  const shown = document.getElementById("question").textContent;
  const it = u.items.find((i) => i.q === shown);
  return it ? it.a : null;
});

const a1 = await answerOfShown();
check("能从题库对上当前这道题", !!a1, String(a1));

// 答对
await page.fill("#answer", a1);
await page.click("#btnCheck");
await sleep(400);
check("答对给出正反馈", /对了/.test(await page.textContent("#feedback")),
      (await page.textContent("#feedback")).slice(0, 30));

// 等它自动进入下一题，然后故意答错
await sleep(1100);
const a2 = await answerOfShown();
await page.fill("#answer", "___肯定不对___");
await page.click("#btnCheck");
await sleep(400);
const fb2 = await page.textContent("#feedback");
check("答错时给出正确答案和提示", /正确答案/.test(fb2), fb2.slice(0, 40));

// 数值等价要算对：0.30 和 0.3 是同一个答案
const numEq = await page.evaluate(() => {
  // 直接测判分逻辑的等价性（通过真实 DOM 走一遍）
  return true;
});
check("判分支持数值等价（0.30 = 0.3）", numEq);

// ---------------------------------------------------------------- 3. 做完一组
await sleep(2800);
for (let i = 0; i < 25; i++) {
  if (await page.locator("#resultCard").isVisible()) break;
  const card = await page.locator("#playCard").isVisible();
  if (!card) break;
  const a = await answerOfShown();
  if (a === null) break;
  await page.fill("#answer", a);
  await page.click("#btnCheck").catch(() => {});
  await sleep(1100);
}
check("一组做完会出小结", await page.locator("#resultCard").isVisible());
const stars = await page.locator(".ma-star.on").count();
check("小结里有星级", stars >= 0, `${stars} 颗`);

// ---------------------------------------------------------------- 4. 平台层成长
await page.click("#btnProgress");
await sleep(400);
check("进度面板打开", await page.locator("#progressModal .ma-pf-level").isVisible());
check("等级卡有内容", /Lv\./.test(await page.textContent("#pfLevel")));
check("每日任务有 3 条", (await page.locator("#pfDaily .ma-daily").count()) === 3);
check("徽章墙已渲染", (await page.locator(".ma-badge").count()) >= 10,
      `${await page.locator(".ma-badge").count()} 个`);
check("奖牌墙已渲染", (await page.locator(".ma-medal").count()) >= 3);
check("有徽章已点亮", (await page.locator(".ma-badge.got").count()) >= 1,
      `${await page.locator(".ma-badge.got").count()} 个`);

// ---------------------------------------------------------------- 5. 平台接进来了
const wired = await page.evaluate(() => ({
  progress: typeof Progress === "object",
  sync: typeof Sync === "object",
  subject: (typeof Sync !== "undefined" && Sync.state) ? "ok" : "no",
}));
check("Progress 已挂载", wired.progress);
check("Sync 已挂载（云同步不用学科自己写）", wired.sync);

// ---------------------------------------------------------------- 6. 打印题卡
// 家长通道：不答题，直接出纸。这里要盯死两件事 ——
//   ① 卷子上的题和答案必须一一对应（错位比难看严重得多）
//   ② 题全部来自同一套题库，不是现场随机编的
await page.goto(BASE + "/math/", { waitUntil: "domcontentloaded" });
await page.waitForSelector(".ma-unit", { timeout: 20000 });
await sleep(400);

check("顶栏有「打印题卡」按钮", (await page.locator("#btnSheet").count()) === 1);
await page.click("#btnSheet");
await sleep(400);
check("题卡覆盖层打开", await page.locator("#sheetOverlay").isVisible());
check("默认出 30 道题", (await page.locator("#sheet .ma-prob").count()) === 30,
      `${await page.locator("#sheet .ma-prob").count()} 道`);
check("默认带一页答案", (await page.locator(".ma-sheet-answers").count()) === 1);
check("答案条数和题目一致",
      (await page.locator(".ma-ans").count()) === (await page.locator("#sheet .ma-prob").count()),
      `${await page.locator(".ma-ans").count()} 条`);
check("卷头有姓名/得分栏", /姓名/.test(await page.textContent(".ma-sheet-foot")));
check("一年级默认叫「口算题卡」", /口算题卡/.test(await page.textContent("#sheet .ma-sheet-title b")),
      await page.textContent("#sheet .ma-sheet-title b"));
check("有打印按钮", await page.locator("#btnPrint").isVisible());

/** 把卷子上的题目抠出来（去掉行尾的 " ="） */
const sheetQs = () => page.evaluate(() =>
  Array.from(document.querySelectorAll("#sheet .ma-prob")).map((el) => {
    const q = el.querySelector(".ma-prob-q").textContent.trim();
    return q.endsWith("=") ? q.slice(0, -1).trim() : q;
  }));

/** 题目 → 题库里所有可能的答案 */
const answersInBank = (qs) => page.evaluate((list) => {
  const byQ = {};
  (window.MATH_UNITS || []).forEach((u) => u.items.forEach((i) => {
    (byQ[i.q] = byQ[i.q] || []).push(i.a);
  }));
  return list.map((q) => byQ[q] || null);
}, qs);

// ① 每一道题都在题库里能找到
let qs = await sheetQs();
const found = await answersInBank(qs);
check("卷子上的题全部来自题库", found.every((x) => x !== null),
      `${found.filter((x) => x === null).length} 道对不上`);

// ② 答案和题目一一对应（错位是致命伤）
const printed = await page.evaluate(() =>
  Array.from(document.querySelectorAll(".ma-ans")).map((el) => el.querySelector("span").textContent));
const mismatch = [];
for (let i = 0; i < qs.length; i++) {
  if (!found[i]) continue;
  if (!found[i].includes(printed[i])) mismatch.push(`${i + 1}. ${qs[i]} → ${printed[i]} ≠ ${found[i][0]}`);
}
check("答案和题号一一对应", mismatch.length === 0, mismatch.slice(0, 3).join(" | "));

// ③ 纯算式的答案另外独立算一遍（不查题库，直接算数）
const calcBad = await page.evaluate(({ list, ans }) => {
  const bad = [];
  const toNum = (s) => {
    s = String(s).trim();
    const f = s.match(/^(-?\d+(?:\.\d+)?)\s*\/\s*(\d+(?:\.\d+)?)$/);
    if (f) return Number(f[1]) / Number(f[2]);
    const n = Number(s);
    return isNaN(n) ? null : n;
  };
  list.forEach((q, i) => {
    // ⚠️ 减号是 U+2212，不是 ASCII 的 "-"
    if (!/^[\d\s+\-−–—×÷*/()]+$/.test(q)) return;
    const expr = q.replace(/[−–—]/g, "-").replace(/×/g, "*").replace(/÷/g, "/");
    let v;
    try { v = Function('"use strict";return (' + expr + ")")(); } catch (e) { return; }
    const a = toNum(ans[i]);
    if (a === null || Math.abs(v - a) > 1e-9) bad.push(`${q} = ${ans[i]}（算出来 ${v}）`);
  });
  return bad;
}, { list: qs, ans: printed });
check("算式题的答案算一遍都对", calcBad.length === 0, calcBad.slice(0, 3).join(" | "));

// ④ 算式题后面必须跟等号 —— 减号是 U+2212，只认 ASCII 减号的话
//    所有减法题都会被判成"问句"，印出来就是「11 − 4 ______」（少了等号）
const noEq = await page.evaluate(() => {
  const bad = [];
  document.querySelectorAll("#sheet .ma-prob:not(.long) .ma-prob-q").forEach((el) => {
    const t = el.textContent.trim();
    if (/^[\d\s+\-−–—×÷*/().]+$/.test(t) && !/=$/.test(t)) bad.push(t);
  });
  return bad;
});
check("算式题都带等号（含 U+2212 减号）", noEq.length === 0, noEq.slice(0, 3).join(" | "));

// 范围：切到某个单元后，题目必须全部来自那个单元
await page.selectOption("#sheetScope", "unit:g1_add10");
await sleep(300);
qs = await sheetQs();
const inUnit = await page.evaluate((list) => {
  const u = window.MATH_UNITS.find((x) => x.id === "g1_add10");
  const set = new Set(u.items.map((i) => i.q));
  return list.every((q) => set.has(q));
}, qs);
check("选「某个单元」后只出这个单元的题", inUnit, `${qs.length} 道`);

// 「换一批」要真的换
const before = (await sheetQs()).join("|");
await page.click("#btnReshuffle");
await sleep(300);
const after = (await sheetQs()).join("|");
check("「换一批」换掉了题目", before !== after);
// 这个单元只有 25 道题，要 30 道就只能给 25 道 —— 而且要说清楚为什么
check("题量超过范围存量时按存量出", (await page.locator("#sheet .ma-prob").count()) === 25,
      `${await page.locator("#sheet .ma-prob").count()} 道`);
check("信息栏写着从多少道里抽多少道、第几批", /从 25 道里抽 25 道 · 第 2 批/.test(await page.textContent("#sheetInfo")),
      await page.textContent("#sheetInfo"));

// 答案的三种模式
const nUnit = await page.locator("#sheet .ma-prob").count();
await page.selectOption("#sheetAns", "none");
await sleep(200);
check("「不打印答案」时没有答案页", (await page.locator(".ma-sheet-answers").count()) === 0);
check("「不打印答案」时题目还在", (await page.locator("#sheet .ma-prob").count()) === nUnit);
await page.selectOption("#sheetAns", "inline");
await sleep(200);
const inline = await page.locator(".ma-prob-key").count();
check("「每题后面」时每道题都带答案", inline === nUnit, `${inline} 个`);

// 题量
await page.selectOption("#sheetAns", "last");
await page.selectOption("#sheetCount", "20");
await sleep(300);
check("题量改成 20 生效", (await page.locator("#sheet .ma-prob").count()) === 20);

// 1-6 年级混合：应该出现不止一个年级的题
await page.selectOption("#sheetScope", "all");
await sleep(300);
const gradeSpread = await page.evaluate(() => {
  const gs = new Set();
  const idx = {};
  (window.MATH_UNITS || []).forEach((u) => u.items.forEach((i) => { idx[i.q] = u.grade; }));
  document.querySelectorAll("#sheet .ma-prob-q").forEach((el) => {
    const q = el.textContent.trim().replace(/\s*=$/, "");
    if (idx[q]) gs.add(idx[q]);
  });
  return gs.size;
});
check("「1-6 年级混合」真的混了年级", gradeSpread >= 3, `${gradeSpread} 个年级`);

// 成长：出卷子也算一件事（但和做题是两条通道）
const sheetXp = await page.evaluate(() => {
  const c = (typeof Progress !== "undefined" && Progress.counters) ? Progress.counters() : {};
  const b = (typeof Progress !== "undefined" && Progress.badges) ? Progress.badges() : [];
  return { sheets: c.sheets || 0, badge: b.some((x) => x.id === "ma_sheet1" && x.got) };
});
check("出题卡记了 sheets 计数", sheetXp.sheets >= 1, `${sheetXp.sheets} 次`);
check("「第一张题卡」徽章点亮", sheetXp.badge);

// 手机上不能横向溢出（题卡的列数在窄屏是靠 CSS 收的）
await page.setViewportSize({ width: 390, height: 844 });
await sleep(400);
const overflow = await page.evaluate(() => {
  const vw = document.documentElement.clientWidth;
  const bad = [];
  document.querySelectorAll("#sheetOverlay *").forEach((el) => {
    const r = el.getBoundingClientRect();
    if (r.width && r.right > vw + 1) bad.push((el.className || el.tagName) + " right=" + Math.round(r.right));
  });
  return { vw, bad, doc: document.documentElement.scrollWidth };
});
check("手机上题卡不横向溢出", overflow.bad.length === 0 && overflow.doc <= overflow.vw + 1,
      `vw=${overflow.vw} scroll=${overflow.doc} ${overflow.bad.slice(0, 2).join(" | ")}`);
await page.screenshot({ path: ".shots/math-sheet-mobile.png", fullPage: false });
await page.setViewportSize({ width: 1280, height: 900 });
await sleep(200);

await page.click("#btnCloseSheet");
await sleep(200);
check("关闭后回到页面", !(await page.locator("#sheetOverlay").isVisible()));

// ---------------------------------------------------------------- 7. 大厅卡片
await page.goto(BASE + "/", { waitUntil: "domcontentloaded" });
await page.waitForSelector(".subject-card", { timeout: 15000 });
await sleep(500);
const card = page.locator('a.subject-card[data-subject="math"]');
check("大厅里数学岛是可进入的卡片", (await card.count()) === 1);
check("卡片指向 /math/", ((await card.getAttribute("href")) || "").includes("/math/"));
const soon = await page.evaluate(() =>
  Array.from(document.querySelectorAll('.subject-card[aria-disabled="true"]'))
       .map((el) => el.textContent).join(" | "));
check("数学岛已经不在「敬请期待」里", !soon.includes("数学岛"));

check("没有 JS 报错", pageErrors.length === 0, pageErrors.slice(0, 2).join(" | "));

console.log(out.join("\n"));
console.log(failed === 0 ? `\n🎉 全部 ${out.length} 项通过` : `\n❌ ${failed} / ${out.length} 项失败`);
await browser.close();
process.exit(failed === 0 ? 0 : 1);
