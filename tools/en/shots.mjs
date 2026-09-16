/**
 * 📸 截图脚本（开发用）：把主要页面各拍一张，方便肉眼验收设计
 * 用法：PLAYWRIGHT_PATH=... node en/tools/shots.mjs http://127.0.0.1:8799 /tmp/en-shots
 */
const pwSpec = process.env.PLAYWRIGHT_PATH
  ? "file://" + process.env.PLAYWRIGHT_PATH.replace(/\/$/, "") + "/index.mjs"
  : "playwright";
const { chromium } = await import(pwSpec);
const BASE = process.argv[2] || "http://127.0.0.1:8799";
const OUT = process.argv[3] || "/tmp/en-shots";
import fs from "node:fs";
fs.mkdirSync(OUT, { recursive: true });

let browser;
try { browser = await chromium.launch({ channel: process.env.PW_CHANNEL || "chrome" }); }
catch (e) { browser = await chromium.launch(); }
const ctx = await browser.newContext({ viewport: { width: 1024, height: 768 }, deviceScaleFactor: 1 });
const page = await ctx.newPage();
const sleep = ms => new Promise(r => setTimeout(r, ms));
const URL = BASE + "/en/index.html";

async function shot(name, hash, wait, fn) {
  await page.goto(URL + (hash || ""), { waitUntil: "domcontentloaded" });
  await sleep(wait || 1200);
  if (fn) await fn();
  await page.screenshot({ path: OUT + "/" + name + ".png", fullPage: false });
  console.log("📸 " + name);
}

await shot("01-map", "", 1500);
await shot("02-island-life", "#/island/life", 1500);
await shot("03-me", "#/me", 1200);
await shot("04-library", "#/library", 1500);
await shot("05-parent", "#/parent", 1200);
await shot("06-settings", "#/settings", 1600);
await shot("07-wordbook", "#/wordbook", 1200);
await shot("08-games", "#/games", 1200);

// 舞台：点第一个关卡
await page.goto(URL + "#/island/life", { waitUntil: "domcontentloaded" });
await sleep(1500);
const card = page.locator("[data-lv]").first();
if (await card.count()) {
  await card.click();
  await sleep(1800);
  await page.screenshot({ path: OUT + "/09-stage-listen.png" });
  console.log("📸 09-stage-listen");
  // 点一个选项
  const opt = page.locator(".option").first();
  if (await opt.count()) { await opt.click(); await sleep(1200); await page.screenshot({ path: OUT + "/10-stage-feedback.png" }); console.log("📸 10-stage-feedback"); }
}
// 夜间模式
await page.goto(URL + "#/settings", { waitUntil: "domcontentloaded" });
await sleep(1200);
const night = page.locator('button[data-theme="night"]');
if (await night.count()) { await night.click(); await sleep(900); await page.goto(URL + "#/map", { waitUntil: "domcontentloaded" }); await sleep(1500); await page.screenshot({ path: OUT + "/11-night.png" }); console.log("📸 11-night"); }
// 手机尺寸
const m = await ctx.newPage();
await m.setViewportSize({ width: 390, height: 844 });
await m.goto(URL + "#/map", { waitUntil: "domcontentloaded" });
await sleep(1500);
await m.screenshot({ path: OUT + "/12-phone.png" });
console.log("📸 12-phone");
await browser.close();
