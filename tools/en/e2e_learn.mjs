/**
 * 萌语岛 · 学习流程端到端测试（Playwright）
 * 覆盖：关卡五小关全流程 → 结算与经验 → 记忆盒入库 → 单词本 → 复习 → 小游戏 → 音频精灵
 * 用法：PLAYWRIGHT_PATH=... node en/tools/e2e_learn.mjs [http://127.0.0.1:8799]
 */
const pwSpec = process.env.PLAYWRIGHT_PATH
  ? "file://" + process.env.PLAYWRIGHT_PATH.replace(/\/$/, "") + "/index.mjs"
  : "playwright";
const { chromium } = await import(pwSpec);
const BASE = process.argv[2] || "http://127.0.0.1:8799";
const results = [];
let failed = 0;
function check(name, ok, extra = "") {
  results.push((ok ? "✅" : "❌") + " " + name + (extra ? " —— " + extra : ""));
  if (!ok) failed++;
}
const sleep = ms => new Promise(r => setTimeout(r, ms));
let browser;
try { browser = await chromium.launch({ channel: process.env.PW_CHANNEL || "chrome", args: ["--autoplay-policy=no-user-gesture-required"] });

// 默认超时：本地 20s 够用，线上要放大 —— 这个站本来就是为"国内到 Cloudflare 不稳"做离线的，
// 拿 20s 卡线上测出来的是网络抖动，不是产品问题。超时放大不拖慢通过的运行。
const E2E_WAIT = Number(process.env.E2E_WAIT_MS || (/^https?:\/\/(127\.|localhost)/.test(BASE) ? 20000 : 60000));
if (browser && browser.setDefaultTimeout) browser.setDefaultTimeout(E2E_WAIT); }
catch (e) { browser = await chromium.launch({ args: ["--autoplay-policy=no-user-gesture-required"] }); }
const ctx = await browser.newContext({ viewport: { width: 1024, height: 768 } });
const page = await ctx.newPage();
const errors = [];
page.on("pageerror", e => errors.push("pageerror: " + e.message));
page.on("console", m => { if (m.type() === "error" && !/404|Failed to load resource/i.test(m.text())) errors.push(m.text()); });
const URL = BASE + "/en/index.html";

// ---------- 1. 一个完整关卡 ----------
await page.goto(URL + "#/island/life", { waitUntil: "domcontentloaded" });
await sleep(1500);
const lvCount = await page.locator("[data-lv]").count();
check("生活岛有关卡", lvCount > 0, "共 " + lvCount + " 关");
await page.locator("[data-lv]").first().click();
await sleep(1200);
check("关卡舞台打开", await page.locator("#stageRoot .stage").count() === 1);
check("进度显示 1/N", (await page.locator("#stageRoot .stage-top").innerText()).includes("1/"));

let rounds = 0;
for (let i = 0; i < 12; i++) {
  await Promise.race([
    page.waitForSelector("#qOptions .option:not([disabled])", { timeout: 4000 }).catch(() => {}),
    page.waitForSelector("#micBtn, #blendNext, #spellOK", { timeout: 4000 }).catch(() => {})
  ]);
  const kind = await page.evaluate(() => {
    if (document.querySelector("#micBtn")) return "speak";
    if (document.querySelector("#blendNext")) return "blend";
    if (document.querySelector("#spellOK")) return "spell";
    if (document.querySelectorAll("#qOptions .option:not([disabled])").length) return "choice";
    return "none";
  });
  if (kind === "none") {
    if (await page.locator(".result-hero").count()) break;
    await sleep(900);
    continue;
  }
  rounds++;
  if (kind === "speak") await page.evaluate(() => document.querySelector("#spNext").click());
  else if (kind === "blend") await page.evaluate(() => document.querySelector("#blendNext").click());
  else if (kind === "spell") {
    await page.evaluate(() => document.querySelector("#spellOK").click());
    await sleep(1400);
    await page.evaluate(() => { const b = document.querySelector("#spellOK"); if (b && !b.disabled) b.click(); });
  } else {
    await page.evaluate(() => {
      const opts = Array.from(document.querySelectorAll("#qOptions .option:not([disabled])"));
      const c = opts.find(o => o.classList.contains("correct"));
      (c || opts[0]).click();
    });
    await sleep(400);
    await page.evaluate(() => {
      const opts = Array.from(document.querySelectorAll("#qOptions .option:not([disabled])"));
      if (opts.length) {
        const c = opts.find(o => o.classList.contains("correct"));
        (c || opts[0]).click();
      }
    });
  }
  await sleep(1400);
  if (await page.locator(".result-hero").count()) break;
}
check("顺利走完 5 个小关", rounds >= 4, "实际经历 " + rounds + " 题");
await sleep(900);
const resultShown = await page.locator(".result-hero").count();
check("出现结算页", resultShown === 1);
if (resultShown) {
  const txt = await page.locator("#stageRoot").innerText();
  check("结算页有星星与经验", txt.includes("★") && txt.includes("经验 +"));
  await page.locator("#resNext").click();
  await sleep(900);
}

// ---------- 2. 记忆盒入库 ----------
const srsData = await page.evaluate(() => localStorage.getItem("en_srs__p_default"));
check("单词进了记忆盒（SRS）", !!srsData && JSON.parse(srsData) && Object.keys(JSON.parse(srsData)).length >= 3);
const stats = await page.evaluate(() => JSON.parse(localStorage.getItem("en_stats__p_default") || "{}"));
check("经验已累计", (stats.xp || 0) > 0, "xp=" + (stats.xp || 0));
check("关卡完成已记录", Object.keys(stats.lessons || {}).length >= 1);

// ---------- 3. 单词本 / 复习 ----------
await page.goto(URL + "#/wordbook", { waitUntil: "domcontentloaded" });
await sleep(900);
check("单词本显示词条", await page.locator(".word-tile").count() >= 3);
await page.goto(URL + "#/review", { waitUntil: "domcontentloaded" });
await sleep(900);
const boxCount = await page.locator(".box-col").count();
check("记忆盒 5 个盒子", boxCount >= 5);

// ---------- 4. 小游戏 ----------
await page.goto(URL + "#/games", { waitUntil: "domcontentloaded" });
await sleep(900);
check("游戏厅 5 个游戏", await page.locator("[data-gm]").count() === 5);
for (const id of ["whack", "match", "memory", "chain", "bingo"]) {
  await page.goto(URL + "#/game/" + id, { waitUntil: "domcontentloaded" });
  await sleep(1100);
  const hasBody = await page.locator("#gameHost .gm-body").count();
  const hasCards = await page.locator("#gameHost .gm-hole, #gameHost .gm-card, #gameHost .gm-pick, #gameHost .gm-cell").count();
  check("游戏 " + id + " 能渲染", hasBody === 1 && hasCards > 0, "元素 " + hasCards + " 个");
}

// ---------- 5. 音频精灵 ----------
const audioOk = await page.evaluate(async () => {
  const a = document.querySelector("audio");
  if (!a) return "no-audio-el";
  await Player.say("food_apple#w", { text: "apple" });
  return a.src ? a.src.split("/").pop().split("?")[0] : "no-src";
});
check("音频精灵成功加载", /m4a$/.test(String(audioOk)), String(audioOk));

// ---------- 6. 听辨小挑战（最小对立对） ----------
await page.goto(URL + "#/island/phonics", { waitUntil: "domcontentloaded" });
await sleep(1600);
check("拼读岛有听辨入口", await page.locator("#startPairs").count() === 1);
if (await page.locator("#startPairs").count()) {
  await page.locator("#startPairs").click();
  await sleep(1500);
  check("听辨题正好两个选项", await page.locator("#qOptions .option").count() === 2);
  await page.evaluate(() => {
    const o = Array.from(document.querySelectorAll("#qOptions .option:not([disabled])"));
    if (o.length) o[0].click();
  });
  await sleep(1500);
  // 答错了的话，正确答案这时已经被标出来并且重新可点
  await page.evaluate(() => {
    const o = Array.from(document.querySelectorAll("#qOptions .option.correct:not([disabled])"));
    if (o.length) o[0].click();
  });
  await sleep(1800);
  const top = await page.locator("#stageRoot .stage-top").innerText();
  check("听辨能一题题往下走", top.includes("2/8") || (await page.locator(".result-hero").count()) === 1, top.replace(/\s+/g, " ").slice(0, 40));
  await page.locator("#stageExit").click();
  await sleep(400);
  const okBtn = page.locator(".modal-foot .btn-primary");
  if (await okBtn.count()) await okBtn.click();
  await sleep(600);
}

// ---------- N. 每日任务池并进平台契约 ----------
// 任务池与"今天挑哪三条"的**唯一**实现是 /en/subject.js 的 window.EN_DAILY
// （英语站自己和大厅共用同一份）。这里钉两件事：
//   ① 英语站显示的三条 == EN_DAILY 算出来的三条（没有第二份实现偷偷活着）
//   ② EN_DAILY 的挑选算法和 UI.pick() **逐位一致**
//      —— 分叉了不会报错，只会让孩子今天做了一半的任务突然换一批
const dailyInfo = await page.evaluate(() => {
  const d = window.EN_DAILY;
  if (!d) return { missing: true };
  let pid = "p_default";
  try { pid = JSON.parse(localStorage.getItem("en_profile")) || "p_default"; } catch (e) {}
  const today = UI.today();
  const drift = [];
  ["2026-01-01", "2026-06-15", "2026-10-31", today].forEach((date) => {
    ["p_default", "p_xiaoming"].forEach((p) => {
      const a = d.items(date, p).map((x) => x.id).join(",");
      const b = UI.pick(d.pool, 3, "daily:" + date + ":" + p).map((x) => x.id).join(",");
      if (a !== b) drift.push(date + "/" + p + "：" + a + " ≠ " + b);
    });
  });
  const mine = Progress.daily().map((x) => x.id).join(",");
  const viaApi = d.items(today, pid).map((x) => x.id).join(",");
  return { missing: false, drift, mine, viaApi, pool: d.pool.length, today };
});
check("每日任务池挂在 window.EN_DAILY 上（大厅读的就是它）", !dailyInfo.missing);
if (!dailyInfo.missing) {
  check("任务池有 10 条、每天挑 3 条", dailyInfo.pool === 10, String(dailyInfo.pool));
  check("英语站显示的三条 == EN_DAILY 算出的三条（没有第二份实现）",
    dailyInfo.mine === dailyInfo.viaApi, `${dailyInfo.mine} vs ${dailyInfo.viaApi}`);
  check("EN_DAILY 的挑选算法与 UI.pick 逐位一致（升级不会换一批任务）",
    dailyInfo.drift.length === 0, dailyInfo.drift.slice(0, 2).join(" | ") || "4 个日期 × 2 个档案全对得上");
  // 首页的「今日任务」卡片必须就是这三条（文案要对得上，不只是"有几个方块"）。
  // ⚠️ 不能用 `.today-item` 全页数数 —— 首页还有别的卡片复用这个类
  //    （复习记忆盒 / 接着学 / 读一本绘本），那会数出 6 个。按标题定位。
  await page.goto(URL + "#/", { waitUntil: "domcontentloaded" });
  await sleep(1200);
  const shown = await page.evaluate(() => {
    const t = Array.from(document.querySelectorAll(".section-title"))
      .find((e) => /今日任务/.test(e.textContent));
    const card = t && t.nextElementSibling;
    return {
      n: card ? card.querySelectorAll(".today-item").length : 0,
      text: card ? Array.from(card.querySelectorAll(".today-item")).map((e) => e.textContent.trim()) : []
    };
  });
  const expect = await page.evaluate(() => {
    let pid = "p_default";
    try { pid = JSON.parse(localStorage.getItem("en_profile")) || "p_default"; } catch (e) {}
    return window.EN_DAILY.items(UI.today(), pid).map((d) => d.title);
  });
  check("首页「今日任务」正好三条", shown.n === 3, String(shown.n));
  check("首页显示的标题和 EN_DAILY 一致",
    expect.every((t, i) => (shown.text[i] || "").includes(t)),
    shown.text.join(" / ") + "  ⟵ 期望 " + expect.join(" / "));
}

check("没有 JS 运行时报错", errors.length === 0, errors.slice(0, 3).join(" | "));
console.log(results.join("\n"));
console.log("\n" + (failed ? "❌ 失败 " + failed + " 项" : "✅ 全部通过") + "（共 " + results.length + " 项）");
await browser.close();
process.exit(failed ? 1 : 0);
