/**
 * 萌语岛 · 云同步端到端测试（两个浏览器上下文 = 两台设备）
 *
 * 前置：
 *   wrangler d1 execute mian-db --local --file=./schema.sql
 *   wrangler d1 execute mian-db --local --file=./en/schema-en.sql
 *   wrangler pages dev . --port 8788
 * 用法：
 *   PLAYWRIGHT_PATH=... node en/tools/e2e_sync.mjs http://127.0.0.1:8788
 */
const pwSpec = process.env.PLAYWRIGHT_PATH
  ? "file://" + process.env.PLAYWRIGHT_PATH.replace(/\/$/, "") + "/index.mjs"
  : "playwright";
const { chromium } = await import(pwSpec);
const BASE = process.argv[2] || "http://127.0.0.1:8788";
const results = [];
let failed = 0;
function check(name, ok, extra = "") {
  results.push((ok ? "✅" : "❌") + " " + name + (extra ? " —— " + extra : ""));
  if (!ok) failed++;
}
const sleep = ms => new Promise(r => setTimeout(r, ms));
let browser;
try { browser = await chromium.launch({ channel: process.env.PW_CHANNEL || "chrome" }); }
catch (e) { browser = await chromium.launch(); }
const URL = BASE + "/en/index.html";

// ---------- 设备 A：学习一点东西，然后创建同步码 ----------
const ctxA = await browser.newContext({ viewport: { width: 1024, height: 768 } });
const A = await ctxA.newPage();
const errsA = [];
A.on("pageerror", e => errsA.push(e.message));
await A.goto(URL + "#/settings", { waitUntil: "domcontentloaded" });
await sleep(1500);
// 造一点本地学习数据
await A.evaluate(() => {
  Progress.addXp(88);
  Progress.markLevel("lv_food_1", 3);
  Progress.markWord("food_apple", true);
  Progress.bump("listens", 5);
  SRS.addMany(["food_apple", "food_banana", "animals_cat"]);
  SRS.answer("food_apple", true);
});
check("本地已产生学习数据", (await A.evaluate(() => Progress.stats().xp)) >= 88);

await A.click("#cloudNew");
await sleep(2200);
const codeText = await A.evaluate(() => {
  const el = document.querySelector(".modal-body .big-word");
  return el ? el.textContent.trim() : "";
});
check("成功创建同步码", /^[0-9A-Z]{4}-[0-9A-Z]{4}$/.test(codeText), codeText);

// 触发一次同步
await A.evaluate(async () => { await Cloud.sync(); });
await sleep(1200);
const statusA = await A.evaluate(() => Cloud.status());
check("设备 A 同步成功", !!statusA.lastSyncAt && !statusA.error, JSON.stringify({ rev: statusA.rev, err: statusA.error }));

// ---------- 设备 B：用同一个同步码登录，看数据是否回来 ----------
const ctxB = await browser.newContext({ viewport: { width: 1024, height: 768 } });
const B = await ctxB.newPage();
const errsB = [];
B.on("pageerror", e => errsB.push(e.message));
await B.goto(URL + "#/settings", { waitUntil: "domcontentloaded" });
await sleep(1500);
const before = await B.evaluate(() => Progress.stats().xp);
check("设备 B 一开始是空的", before === 0, "xp=" + before);

const login = await B.evaluate(async (code) => {
  const r = await Cloud.login(code);
  return { r, xp: Progress.stats().xp, levels: Object.keys(Progress.get().lessons || {}).length,
           srs: SRS.stats().learning + SRS.stats().learned };
}, codeText);
check("设备 B 登录成功", login.r.ok === true, JSON.stringify(login.r));
check("经验同步过来了", login.xp >= 88, "xp=" + login.xp);
check("关卡记录同步过来了", login.levels >= 1, "关卡 " + login.levels);
check("记忆盒同步过来了", login.srs >= 3, "卡片 " + login.srs);

// ---------- 设备 B 再学一点，推回去，设备 A 拉下来 ----------
await B.evaluate(async () => {
  Progress.addXp(50);
  Progress.markLevel("lv_food_2", 2);
  await Cloud.sync();
});
await sleep(1200);
const backA = await A.evaluate(async () => {
  await Cloud.sync();
  return { xp: Progress.stats().xp, levels: Object.keys(Progress.get().lessons || {}).length };
});
check("设备 A 拉到了设备 B 的新进度", backA.xp >= 138 && backA.levels >= 2, JSON.stringify(backA));

check("没有 JS 运行时报错", errsA.length + errsB.length === 0, errsA.concat(errsB).slice(0, 2).join(" | "));
console.log(results.join("\n"));
console.log("\n" + (failed ? "❌ 失败 " + failed + " 项" : "✅ 全部通过") + "（共 " + results.length + " 项）");
await browser.close();
process.exit(failed ? 1 : 0);
