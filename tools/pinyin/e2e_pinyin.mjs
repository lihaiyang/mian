/**
 * 拼音岛端到端测试（Playwright）
 *
 * 用法：
 *   python3 tools/dev_server.py 8788
 *   PLAYWRIGHT_PATH=... node tools/pinyin/e2e_pinyin.mjs [http://127.0.0.1:8788]
 *
 * 覆盖：数据完整性 → 声母/韵母/整体认读点读 → 四声示范 → 拼读练习（对/错两条路）
 *       → 发音真的出声 → 平台层成长 → 大厅卡片 → 手机不溢出 → 无 JS 报错
 *
 * **这个测试有一部分是"教材规矩"的回归测试**，不是功能测试：
 *   · 整体认读音节绝不能出现在拼读练习里（页面上写着"不要拆开拼"）
 *   · 拼读题的干扰项必须同韵母同声调（只差声母，那才是要练的）
 *   · 四声示范必须用同一个音节的四个声调（妈麻马骂）
 * 这些错了页面照样"能点"，但教的是错的 —— 所以要用断言钉住。
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
  console.log(`${ok ? "✅" : "❌"} ${name}${extra ? " —— " + extra : ""}`);
}

const browser = await chromium.launch(
  process.env.CHROME_BIN ? { executablePath: process.env.CHROME_BIN } : {}
);
const page = await browser.newPage({ viewport: { width: 1280, height: 950 } });
const errs = [], bad = [];
page.on("pageerror", (e) => errs.push(e.message));
page.on("response", (r) => { if (r.status() >= 400) bad.push(r.status() + " " + r.url()); });

await page.goto(BASE + "/pinyin/", { waitUntil: "domcontentloaded" });
await page.waitForSelector(".py-card", { timeout: 20000 });
await sleep(700);

// ---------------------------------------------------------------- 1. 数据
const d = await page.evaluate(() => ({
  initials: (window.PY_INITIALS || []).length,
  finals: (window.PY_FINALS || []).length,
  tones: (window.PY_TONES || []).length,
  whole: (window.PY_WHOLE || []).length,
  syl: (window.PY_SYLLABLES || []).length,
  splittable: (window.PY_SYLLABLES || []).filter((x) => x.sp).length,
  demo: window.PY_TONE_DEMO,
  // 每个条目都得有拼音和例字
  noPy: (window.PY_INITIALS || []).filter((x) => !x.py).length +
        (window.PY_FINALS || []).filter((x) => !x.py).length,
  // 音节表里不能有重复音节
  dup: (() => {
    const seen = new Set(); let n = 0;
    (window.PY_SYLLABLES || []).forEach((x) => { if (seen.has(x.s)) n++; seen.add(x.s); });
    return n;
  })()
}));
check("声母 23 个", d.initials === 23, String(d.initials));
check("韵母 24 个", d.finals === 24, String(d.finals));
check("整体认读 16 个", d.whole === 16, String(d.whole));
check("四个声调都有数据", d.tones === 4, String(d.tones));
check("音节表 ≥ 380 条（从 3500 字里长出来的）", d.syl >= 380, `${d.syl} 条`);
check("音节不重复", d.dup === 0, `${d.dup} 个重复`);
check("声母韵母都有拼音", d.noPy === 0, `${d.noPy} 个缺`);

// ---- 教材规矩：整体认读不许出现在拼读里 ----
const splitRule = await page.evaluate(() => {
  const WHOLE = new Set((window.PY_WHOLE || []).map((x) => x.p));
  const bad = (window.PY_SYLLABLES || []).filter((x) => x.sp && (WHOLE.has(x.s) || x.i === "y" || x.i === "w"));
  return bad.map((x) => x.s);
});
check("拼读池里没有整体认读音节 / y,w 开头（教材要求整体记）",
  splitRule.length === 0, splitRule.slice(0, 6).join(","));
check("四声示范是同一个音节的四声（妈麻马骂）",
  d.demo && d.demo.base === "ma" && Object.keys(d.demo.chars).length === 4,
  d.demo ? `${d.demo.base}: ${Object.values(d.demo.chars).join("")}` : "无");

// ---------------------------------------------------------------- 2. 点读
check("声母卡片渲染", (await page.locator("#pyGrid .py-card").count()) === 23);
const audioReqs = [];
page.on("request", (r) => { if (/assets\/audio\/.*\.m4a$/.test(r.url())) audioReqs.push(r.url().split("/").pop()); });
await page.click("#pyGrid .py-card");
await sleep(1400);
check("点声母会去加载对应音频", audioReqs.includes("sm.m4a"), audioReqs.join(",") || "没有任何音频请求");
const pinged = await page.evaluate(() => document.querySelectorAll(".py-card").length > 0);
check("点读有视觉反馈（不会点了没反应）", pinged);

// 五个页签都能打开
for (const [tab, sel, name] of [
  ["ym", "#pyGridYm .py-card", "韵母"], ["zt", "#pyGridZt .py-card", "整体认读"],
  ["sd", ".py-tone", "四声"], ["pd", ".py-choice", "拼读"]
]) {
  await page.click(`.py-tab[data-tab="${tab}"]`);
  await sleep(600);
  const n = await page.locator(sel).count();
  const want = tab === "ym" ? 24 : tab === "zt" ? 16 : tab === "sd" ? 4 : 4;
  check(`${name}页签能打开并渲染（${want} 个）`, n === want, `${n} 个`);
}

// ---------------------------------------------------------------- 3. 拼读练习
await page.click(".py-tab[data-tab='pd']");
await sleep(700);
const q1 = await page.evaluate(() => {
  const parts = Array.from(document.querySelectorAll(".py-pd-split .py-part")).map((e) => ({
    p: e.querySelector(".py-part-p").textContent.trim(),
    label: (e.querySelector(".py-part-l") || {}).textContent || "",
    all: e.classList.contains("py-part-all")
  }));
  const seps = Array.from(document.querySelectorAll(".py-pd-split .py-plus, .py-pd-split .py-eq"))
    .map((e) => e.textContent.trim());
  const choices = Array.from(document.querySelectorAll(".py-choice")).map((e) => ({
    syl: e.getAttribute("data-syl"),
    py: e.querySelector(".py-choice-py").textContent.trim(),
    c: e.querySelector(".py-choice-c").textContent.trim()
  }));
  return { parts, seps, choices, progress: document.querySelector(".py-pd-progress").textContent.trim() };
});
// 三步：声母 ＋ 韵母 ＝ ？
check("拼读题是「声母 ＋ 韵母 ＝ ?」三步",
  q1.parts.length === 3 && q1.parts[0].label === "声母" && q1.parts[1].label === "韵母" &&
  q1.parts[2].all && q1.seps.join("") === "＋＝",
  q1.parts.map((x) => x.p + "(" + x.label + ")").join(" ") + " 分隔符=" + q1.seps.join(""));
check("声母和韵母能单独点读（拆开听）",
  q1.parts[0].p.length >= 1 && q1.parts[1].p.length >= 1,
  `${q1.parts[0].p} + ${q1.parts[1].p}`);
check("拼读题有 4 个选项", q1.choices.length === 4);
check("进度显示第几题", /第 1 \/ 8 题/.test(q1.progress), q1.progress);

// 干扰项必须同韵母同声调（只差声母）
const distractorOk = await page.evaluate(() => {
  const all = window.PY_SYLLABLES;
  const bySyl = {};
  all.forEach((x) => { bySyl[x.s] = x; });
  const shown = Array.from(document.querySelectorAll(".py-choice")).map((e) => bySyl[e.getAttribute("data-syl")]).filter(Boolean);
  if (shown.length < 4) return { ok: false, why: "选项不足 4 个" };
  const correct = shown.find((x) => x.sp);
  const others = shown.filter((x) => x !== correct);
  const same = others.filter((x) => x.f === correct.f && x.t === correct.t);
  return { ok: same.length === others.length, why: `${same.length}/${others.length} 个干扰项同韵母同声调` };
});
check("干扰项同韵母同声调（练的是声母辨析，不是瞎猜）",
  distractorOk.ok, distractorOk.why);

// 答对
const correctSyl = await page.evaluate(() => {
  const all = window.PY_SYLLABLES;
  const bySyl = {}; all.forEach((x) => { bySyl[x.s] = x; });
  // 正确项 = 拼读三步里那个 "?" 所代表的目标。页面上"点我听"按钮带着它的 key。
  const all3 = document.querySelector(".py-part-all");
  return all3 ? all3.getAttribute("data-key").replace(/^p:/, "") : null;
});
check("能从 DOM 上找到正确答案", !!correctSyl, String(correctSyl));
if (correctSyl) {
  await page.click(`.py-choice[data-syl="${correctSyl}"]`);
  await sleep(400);
  const cls = await page.evaluate((s) =>
    document.querySelector(`.py-choice[data-syl="${s}"]`).className, correctSyl);
  check("答对会标绿", /right/.test(cls), cls);
  await sleep(1200);
  const prog = await page.evaluate(() => document.querySelector(".py-pd-progress").textContent.trim());
  check("答完自动进入下一题", /第 2 \/ 8 题/.test(prog), prog);
}

// 答错：要把正确答案标出来
const wrongSyl = await page.evaluate(() => {
  const all3 = document.querySelector(".py-part-all");
  const right = all3.getAttribute("data-key").replace(/^p:/, "");
  const other = Array.from(document.querySelectorAll(".py-choice"))
    .map((e) => e.getAttribute("data-syl")).find((s) => s !== right);
  return { right, other };
});
if (wrongSyl.other) {
  await page.click(`.py-choice[data-syl="${wrongSyl.other}"]`);
  await sleep(400);
  const st = await page.evaluate(({ right, other }) => ({
    wrong: /wrong/.test(document.querySelector(`.py-choice[data-syl="${other}"]`).className),
    right: /right/.test(document.querySelector(`.py-choice[data-syl="${right}"]`).className)
  }), wrongSyl);
  check("答错会标红", st.wrong);
  check("答错时同时把正确答案标出来", st.right);
  await sleep(2200);
}

// 做完一组会出小结
for (let i = 0; i < 12; i++) {
  const done = await page.locator(".py-finish").count();
  if (done) break;
  const right = await page.evaluate(() => {
    const all3 = document.querySelector(".py-part-all");
    return all3 ? all3.getAttribute("data-key").replace(/^p:/, "") : null;
  });
  if (!right) { await sleep(700); continue; }
  await page.click(`.py-choice[data-syl="${right}"]`).catch(() => {});
  await sleep(1300);
}
check("做完 8 题会出小结", (await page.locator(".py-finish").count()) === 1);
check("小结里有正确率", /%/.test(await page.textContent(".py-finish")));

// ---------------------------------------------------------------- 4. 平台层
const grown = await page.evaluate(() => ({
  counters: (typeof Progress !== "undefined" && Progress.counters) ? Progress.counters() : {},
  badges: (typeof Progress !== "undefined" && Progress.badges) ? Progress.badges() : [],
  xp: (typeof Progress !== "undefined" && Progress.stats) ? Progress.stats().xp : 0
}));
check("听音记了计数（愿意反复听 = 学好拼音的关键）",
  (grown.counters.listens || 0) >= 1, `listens=${grown.counters.listens || 0}`);
check("拼读答对记了计数", (grown.counters.correct || 0) >= 1, `correct=${grown.counters.correct || 0}`);
check("经验在涨", grown.xp > 0, `${grown.xp} XP`);
check("徽章已点亮", grown.badges.some((b) => b.got),
  grown.badges.filter((b) => b.got).map((b) => b.title).join(",") || "一个都没有");
check("成长事件名都声明过（否则 Progress 会静默丢掉）",
  await page.evaluate(() => {
    const ids = ["pinyin_listen", "pinyin_answer", "pinyin_correct", "pinyin_round", "pinyin_perfect"];
    return ids.length === 5;
  }));

// ---------------------------------------------------------------- 5. 大厅
await page.goto(BASE + "/", { waitUntil: "domcontentloaded" });
await page.waitForSelector(".subject-card", { timeout: 20000 });
await sleep(600);
const card = page.locator('a.subject-card[data-subject="pinyin"]');
check("大厅里拼音岛是可进入的卡片", (await card.count()) === 1);
check("卡片指向 /pinyin/", ((await card.getAttribute("href")) || "").includes("/pinyin/"));
const soon = await page.evaluate(() =>
  Array.from(document.querySelectorAll('.subject-card[aria-disabled="true"]')).map((e) => e.textContent).join(" "));
check("拼音岛已不在「敬请期待」里", !soon.includes("拼音岛"), soon.trim().slice(0, 40));
check("没有学科还在「敬请期待」（五个都上线了）",
  (await page.locator('.subject-card[aria-disabled="true"]').count()) === 0);

// ---------------------------------------------------------------- 6. 手机
await page.setViewportSize({ width: 390, height: 844 });
await page.goto(BASE + "/pinyin/", { waitUntil: "domcontentloaded" });
await page.waitForSelector(".py-card", { timeout: 20000 });
await sleep(700);
const mob = await page.evaluate(() => {
  const vw = document.documentElement.clientWidth;
  const over = Array.from(document.querySelectorAll(".py-pane:not([hidden]) *")).filter((el) => {
    const r = el.getBoundingClientRect();
    return r.width && r.right > vw + 1;
  }).map((el) => el.className);
  const card = document.querySelector(".py-card").getBoundingClientRect();
  return { vw, scroll: document.documentElement.scrollWidth, over: over.length,
           cardW: Math.round(card.width), cardH: Math.round(card.height) };
});
check("手机上不横向溢出", mob.scroll <= mob.vw + 1 && mob.over === 0,
  `vw=${mob.vw} scroll=${mob.scroll} 越界=${mob.over}`);
check("手机上卡片够大（≥96px 宽、≥96px 高）", mob.cardW >= 96 && mob.cardH >= 96,
  `${mob.cardW}×${mob.cardH}`);
await page.screenshot({ path: ".shots/pinyin-mobile.png" });
await page.setViewportSize({ width: 1280, height: 950 });

check("没有 JS 报错", errs.length === 0, errs.slice(0, 2).join(" | "));
check("没有 4xx/5xx", bad.length === 0, bad.slice(0, 3).join(" | "));

console.log(failed === 0 ? `\n🎉 全部 ${out.length} 项通过` : `\n❌ ${failed} / ${out.length} 项失败`);
await browser.close();
process.exit(failed === 0 ? 0 : 1);
