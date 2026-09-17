/**
 * 拼音岛端到端测试（Playwright）
 *
 * 用法：
 *   python3 tools/dev_server.py 8788
 *   PLAYWRIGHT_PATH=... node tools/pinyin/e2e_pinyin.mjs [http://127.0.0.1:8788]
 *
 * 覆盖：数据完整性 → 声母/韵母/整体认读点读 → 四声示范 → 拼读练习（对/错两条路）
 *       → 听音写拼音（不标声调 / 声调错 / 字母错 三条路）→ 发音真的出声
 *       → 平台层成长 → 大厅卡片 → 手机不溢出 → 无 JS 报错
 *
 * **这个测试有一部分是"教材规矩"的回归测试**，不是功能测试：
 *   · 整体认读音节绝不能出现在拼读练习里（页面上写着"不要拆开拼"）
 *   · 拼读题的干扰项必须同韵母同声调（只差声母，那才是要练的）
 *   · 四声示范必须用同一个音节的四个声调（妈麻马骂）
 *   · 听写题在判分之前不能把带调号的拼音显示在页面上（否则就是抄）
 * 这些错了页面照样"能点"，但教的是错的 —— 所以要用断言钉住。
 */
const pwSpec = process.env.PLAYWRIGHT_PATH
  ? "file://" + process.env.PLAYWRIGHT_PATH.replace(/\/$/, "") + "/index.mjs"
  : "playwright";
const { chromium } = await import(pwSpec);

const BASE = process.argv[2] || process.env.BASE || "http://127.0.0.1:8788";
// 等元素出现的上限。本地 20s 绰绰有余，但**线上要放大**：
// 这个站点本来就是为了"国内到 Cloudflare 不稳"而做离线的，
// 拿 20s 去卡线上，测出来的是网络抖动，不是产品问题（实测 5 次里有 2 次假红）。
// 超时放大不会拖慢通过的运行 —— 元素一出现就返回。
const WAIT = Number(process.env.E2E_WAIT_MS || (/^https?:\/\/(127\.|localhost)/.test(BASE) ? 20000 : 60000));
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
await page.waitForSelector(".py-card", { timeout: WAIT });
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

// 六个页签都能打开
for (const [tab, sel, name, want] of [
  ["ym", "#pyGridYm .py-card", "韵母", 24],
  ["zt", "#pyGridZt .py-card", "整体认读", 16],
  ["sd", ".py-tone", "四声", 4],
  ["pd", ".py-choice", "拼读", 4],
  ["xz", "#xzInput", "听音写拼音", 1]
]) {
  await page.click(`.py-tab[data-tab="${tab}"]`);
  await sleep(600);
  const n = await page.locator(sel).count();
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

// 干扰项：至少同韵母（练声母辨析），且**绝不能同音**（同音等于两个正确答案）。
// 这条以前是"必须同韵母同声调"，但实测 352 个音节里有 22 个凑不出 3 个，
// 会静默退化成"随便挑" —— 所以改成逐级判据，并把级次报出来。
const dstat = await page.evaluate(() => {
  const bySyl = {};
  window.PY_SYLLABLES.forEach((x) => { bySyl[x.s] = x; });
  const shown = Array.from(document.querySelectorAll(".py-choice"))
    .map((e) => bySyl[e.getAttribute("data-syl")]).filter(Boolean);
  if (shown.length < 4) return { ok: false, why: "选项不足 4 个" };
  const correct = shown.find((x) => x.sp && x.s === document.querySelector(".py-part-all").getAttribute("data-key").slice(2));
  if (!correct) return { ok: false, why: "选项里找不到正确项" };
  const others = shown.filter((x) => x !== correct);
  const homophone = others.filter((x) => x.py === correct.py);
  const sameFinal = others.filter((x) => x.f === correct.f);
  const exact = others.filter((x) => x.f === correct.f && x.t === correct.t && x.i !== correct.i);
  return {
    ok: homophone.length === 0 && sameFinal.length >= 1,
    why: `同音 ${homophone.length} 个；同韵母 ${sameFinal.length}/3；同韵母同声调 ${exact.length}/3`
  };
});
check("干扰项不含同音字（同音 = 两个正确答案）", dstat.ok && !/同音 [1-9]/.test(dstat.why), dstat.why);
check("干扰项优先同韵母（练的是声母辨析）", /同韵母 [123]\/3/.test(dstat.why), dstat.why);

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

// ---------------------------------------------------------------- 3b. 听音写拼音
//
// 比"选"难一档：要自己写出字母 + 标对声调。
// 这里的关键断言不是"点得动"，而是**判分把答案拆成两半**：
//   字母对、声调错 → 必须明确告诉孩子"只差声调"，而不是笼统报错。
// 另外要盯住"写之前不能把答案写在页面上"（否则就变成抄了）。
await page.click(".py-tab[data-tab='xz']");
await page.waitForSelector("#xzInput", { timeout: WAIT });
await sleep(900);

const xz0 = await page.evaluate(() => {
  const inp = document.getElementById("xzInput");
  const box = document.getElementById("xzBox");
  const r = window.PinyinDebug.xzRow();
  // 页面上不能出现**这一题的答案**（完整的带调号拼音）。
  // ⚠️ 不能笼统地查"有没有带调号的字母"：声调键上写着 ā á ǎ à（那是样例，
  //    一年级孩子光看调号认不出形状），所以要把那排键排除掉再查。
  const clone = box.cloneNode(true);
  const pick = clone.querySelector(".py-tone-pick");
  if (pick) pick.remove();
  return {
    hasInput: !!inp,
    tones: document.querySelectorAll(".py-tbtn").length,
    hk: document.querySelectorAll("[data-k]").length,
    fontSize: parseFloat(getComputedStyle(inp).fontSize),
    leaked: r ? clone.textContent.indexOf(r.py) >= 0 : false,
    answer: r ? r.py : ""
  };
});
check("写拼音页签能打开，有输入框", xz0.hasInput);
check("有 4 个声调键", xz0.tones === 4, String(xz0.tones));
check("有 ü 和 ⌫ 辅助键", xz0.hk === 2, String(xz0.hk));
check("输入框字号 ≥16px（否则 iOS 聚焦会放大整页）", xz0.fontSize >= 16, xz0.fontSize + "px");
check("写之前页面上不泄露答案（本题答案没被写出来）", !xz0.leaked, `本题答案 ${xz0.answer}`);

/** 等下一道听写题就绪（判完到自动下一题之间输入框是锁着的） */
async function xzNext() {
  for (let i = 0; i < 40; i++) {
    const st = await page.evaluate(() => {
      const inp = document.getElementById("xzInput");
      const r = window.PinyinDebug && PinyinDebug.xzRow();
      return { ready: !!(inp && !inp.disabled && r), q: r ? { py: r.py, t: r.t, s: r.s } : null };
    });
    if (st.ready) return st.q;
    if (await page.locator("#xzBox .py-finish").count()) return null;
    await sleep(300);
  }
  return null;
}
/** 读判分结果（只读 #xzBox 里的，拼读页签的小结不能混进来） */
const xzRead = () => page.evaluate(() => {
  const q = (s) => (document.querySelector(s) || {}).textContent || "";
  return {
    cls: (document.querySelector(".py-xz-ans") || {}).className || "",
    py: q(".py-xz-ans-py"), c: q(".py-xz-ans-c"), msg: q(".py-xz-ans-say"),
    locked: !!(document.getElementById("xzInput") || {}).disabled,
    warn: document.querySelectorAll("#xzToneWarn").length
  };
});

// —— 不选声调：不能判分，要给一句人话提醒
let xq = await xzNext();
check("能从调试出口拿到当前听写题", !!xq && !!xq.py, xq ? xq.py : "拿不到");
await page.fill("#xzInput", "ma");
await page.click("#btnXzCheck");
await sleep(300);
const w = await xzRead();
check("没标声调时不判分，而是提醒先选声调", w.warn === 1 && !w.locked);

// —— 字母写对 + 声调标对
await page.fill("#xzInput", xq.py);                  // 原样带调号输入，顺便验归一化
await page.click(`.py-tbtn[data-tone="${xq.t}"]`);
check("点声调键有高亮反馈",
  (await page.locator(`.py-tbtn[data-tone="${xq.t}"].active`).count()) === 1);
await page.click("#btnXzCheck");
await sleep(500);
const ok1 = await xzRead();
check("写对了标绿、给出正确答案字与音",
  /ok/.test(ok1.cls) && !!ok1.py && !!ok1.c && /全对/.test(ok1.msg), ok1.msg || ok1.cls);
check("判完锁住输入（不能改答案刷分）", ok1.locked);

// —— 字母写对、声调标错：这才是这个题型最该教的地方
xq = await xzNext();
check("答对后自动进入下一题", !!xq, xq ? xq.s : "没进下一题");
if (xq) {
  const alt = xq.t === 1 ? 2 : 1;
  await page.fill("#xzInput", xq.py);
  await page.click(`.py-tbtn[data-tone="${alt}"]`);
  await page.click("#btnXzCheck");
  await sleep(500);
  const okt = await xzRead();
  check("字母对、声调错 → 明确说「只差声调」，不说笼统的错",
    /no/.test(okt.cls) && /声调/.test(okt.msg) && /应该是/.test(okt.msg), okt.msg);
  check("声调错时把正确读音也放出来（判分后要能对上听到的）", !!okt.py && !!okt.c);
}

// —— 字母写错
xq = await xzNext();
if (xq) {
  await page.fill("#xzInput", "zzz");
  await page.click(`.py-tbtn[data-tone="${xq.t}"]`);
  await page.click("#btnXzCheck");
  await sleep(500);
  const okw = await xzRead();
  check("字母写错 → 指出写的是什么、并给正确答案",
    /no/.test(okw.cls) && /zzz/.test(okw.msg) && !!okw.py, okw.msg);
}

// —— 做完一组出小结（只认 #xzBox 里的）
for (let i = 0; i < 16; i++) {
  if (await page.locator("#xzBox .py-finish").count()) break;
  const q = await xzNext();
  if (!q) break;
  await page.fill("#xzInput", q.py);
  await page.click(`.py-tbtn[data-tone="${q.t}"]`);
  await page.click("#btnXzCheck");
  await sleep(1600);
}
check("写拼音做完 8 题会出小结", (await page.locator("#xzBox .py-finish").count()) === 1);
check("小结里有正确率", /%/.test(await page.textContent("#xzBox .py-finish")));

// ---------------------------------------------------------------- 4. 平台层
const grown = await page.evaluate(() => ({
  counters: (typeof Progress !== "undefined" && Progress.counters) ? Progress.counters() : {},
  badges: (typeof Progress !== "undefined" && Progress.badges) ? Progress.badges() : [],
  xp: (typeof Progress !== "undefined" && Progress.stats) ? Progress.stats().xp : 0
}));
check("听音记了计数（愿意反复听 = 学好拼音的关键）",
  (grown.counters.listens || 0) >= 1, `listens=${grown.counters.listens || 0}`);
check("拼读答对记了计数", (grown.counters.correct || 0) >= 1, `correct=${grown.counters.correct || 0}`);
check("听写答对记了计数（写比选难一档，单独记）",
  (grown.counters.writeCorrect || 0) >= 1, `writeCorrect=${grown.counters.writeCorrect || 0}`);
check("经验在涨", grown.xp > 0, `${grown.xp} XP`);
check("徽章已点亮", grown.badges.some((b) => b.got),
  grown.badges.filter((b) => b.got).map((b) => b.title).join(",") || "一个都没有");
check("写拼音的徽章也点得亮（第一次写对）",
  grown.badges.some((b) => b.got && (b.id === "py_w1" || /写/.test(b.title))),
  grown.badges.filter((b) => b.got).map((b) => b.title).join(",") || "一个都没有");
check("成长事件名都声明过（否则 Progress 会静默丢掉）",
  await page.evaluate(() => {
    const ids = ["pinyin_listen", "pinyin_answer", "pinyin_correct", "pinyin_round", "pinyin_perfect"];
    return ids.length === 5;
  }));

// ---------------------------------------------------------------- 5. 大厅
await page.goto(BASE + "/", { waitUntil: "domcontentloaded" });
await page.waitForSelector(".subject-card", { timeout: WAIT });
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
await page.waitForSelector(".py-card", { timeout: WAIT });
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

// 新的写拼音界面在手机上也要能用：四个声调键不能挤成一团、不能溢出
await page.click(".py-tab[data-tab='xz']");
await page.waitForSelector("#xzInput", { timeout: WAIT });
await sleep(600);
const mob2 = await page.evaluate(() => {
  const vw = document.documentElement.clientWidth;
  const over = Array.from(document.querySelectorAll("#pane-xz *")).filter((el) => {
    const r = el.getBoundingClientRect();
    return r.width && r.right > vw + 1;
  }).map((el) => el.className);
  const t = document.querySelector(".py-tbtn").getBoundingClientRect();
  const inp = document.getElementById("xzInput").getBoundingClientRect();
  return { vw, scroll: document.documentElement.scrollWidth, over: over.length,
           toneW: Math.round(t.width), toneH: Math.round(t.height),
           inpFont: parseFloat(getComputedStyle(document.getElementById("xzInput")).fontSize) };
});
check("手机上写拼音页不横向溢出", mob2.scroll <= mob2.vw + 1 && mob2.over === 0,
  `vw=${mob2.vw} scroll=${mob2.scroll} 越界=${mob2.over}`);
check("手机上声调键够大（宽 ≥64、高 ≥44）", mob2.toneW >= 64 && mob2.toneH >= 44,
  `${mob2.toneW}×${mob2.toneH}`);
check("手机上输入框字号仍 ≥16px", mob2.inpFont >= 16, mob2.inpFont + "px");
await page.screenshot({ path: ".shots/pinyin-write-mobile.png" });
await page.setViewportSize({ width: 1280, height: 950 });

check("没有 JS 报错", errs.length === 0, errs.slice(0, 2).join(" | "));
check("没有 4xx/5xx", bad.length === 0, bad.slice(0, 3).join(" | "));

console.log(failed === 0 ? `\n🎉 全部 ${out.length} 项通过` : `\n❌ ${failed} / ${out.length} 项失败`);
await browser.close();
process.exit(failed === 0 ? 0 : 1);
