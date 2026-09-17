/**
 * 跨学科记忆盒 · 端到端测试（Playwright）
 *
 * 用法：
 *   node tools/platform/e2e_review.mjs [http://127.0.0.1:8788]
 *
 * 测的是**跨学科**这条链路：
 *   在数学岛做错一道题  →  卡片进平台记忆盒  →  大厅出现「今日复习」入口
 *   →  /review/ 按到期时间拿出来  →  判对之后盒子往后走一格
 *
 * 为什么值得单独一个文件：这是"多学科平台"和"几个互不相干的网站"的分界线。
 * 没有它，数学的错题、英语的错词各自躺在本学科的存储里，复习要分四次做。
 *
 * 注意 Leitner 的节奏：新卡是**明天见**（不是当天再塞一遍），
 * 所以测试里要把 due 改成今天，才能验"到期了会拿出来"。
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

// 默认超时：本地 20s 够用，线上要放大 —— 这个站本来就是为"国内到 Cloudflare 不稳"做离线的，
// 拿 20s 卡线上测出来的是网络抖动，不是产品问题。超时放大不拖慢通过的运行。
const E2E_WAIT = Number(process.env.E2E_WAIT_MS || (/^https?:\/\/(127\.|localhost)/.test(BASE) ? 20000 : 60000));
if (browser && browser.setDefaultTimeout) browser.setDefaultTimeout(E2E_WAIT);
const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
const page = await ctx.newPage();
const pageErrors = [];
page.on("pageerror", (e) => pageErrors.push(e.message));

const boxItems = () => page.evaluate(() => {
  const raw = localStorage.getItem("mian_srs__items__p_default");
  try { return JSON.parse(raw || "{}"); } catch (e) { return {}; }
});

// ---------------------------------------------------------------- 1. 数学做错 → 进盒
await page.goto(BASE + "/math/", { waitUntil: "domcontentloaded" });
await page.waitForSelector(".ma-unit", { timeout: 25000 });
await sleep(600);
check("数学岛加载了平台记忆盒", await page.evaluate(() => typeof SRS === "object" && typeof SRS.add === "function"));

await page.locator(".ma-grade").first().click();
await sleep(200);
await page.locator(".ma-unit").first().click();
await page.waitForSelector("#playCard", { state: "visible" });
await sleep(300);

const q1 = await page.evaluate(() => {
  const id = document.querySelector(".ma-unit.active").dataset.unit;
  const u = window.MATH_UNITS.find((x) => x.id === id);
  const shown = document.getElementById("question").textContent;
  const it = u.items.find((i) => i.q === shown);
  return it ? { q: it.q, a: it.a, id: it.id } : null;
});
check("拿到当前这道题", !!q1, q1 && q1.q);

await page.fill("#answer", "___肯定不对___");
await page.click("#btnCheck");
await sleep(500);

let box = await boxItems();
let keys = Object.keys(box);
check("做错的题进了记忆盒", keys.length === 1, `${keys.length} 张`);
check("卡片 key 带学科前缀（数学和英语的同名 id 不会撞）",
      keys[0] === "math:" + (q1 && q1.id), keys[0]);
check("卡片存了题面", box[keys[0]] && box[keys[0]].f === (q1 && q1.q), box[keys[0]] && box[keys[0]].f);
check("卡片存了答案", box[keys[0]] && box[keys[0]].b === (q1 && q1.a), box[keys[0]] && box[keys[0]].b);
check("卡片存了解题提示", !!(box[keys[0]] && box[keys[0]].h));
check("新卡盒号是 0（第一次见）", box[keys[0]] && box[keys[0]].box === 0);
check("新卡是「明天见」，不是当天再塞一遍",
      box[keys[0]] && box[keys[0]].due === Math.floor(Date.now() / 86400000) + 1,
      `due=${box[keys[0]] && box[keys[0]].due}`);

// ---------------------------------------------------------------- 2. 大厅入口
await page.goto(BASE + "/", { waitUntil: "domcontentloaded" });
await page.waitForSelector(".subject-card", { timeout: 15000 });
await sleep(500);
const hiddenToday = await page.locator("#reviewEntry").isHidden();
check("今天没到期 → 大厅不显示复习入口（免打扰）", hiddenToday);

// 模拟"到了明天"
await page.evaluate(() => {
  const k = "mian_srs__items__p_default";
  const d = JSON.parse(localStorage.getItem(k) || "{}");
  Object.keys(d).forEach((x) => { d[x].due = 0; });
  localStorage.setItem(k, JSON.stringify(d));
});
await page.reload({ waitUntil: "domcontentloaded" });
await page.waitForSelector(".subject-card", { timeout: 15000 });
await sleep(600);
const shown = await page.locator("#reviewEntry").isVisible();
check("到期后大厅出现复习入口", shown);
if (shown) {
  const label = await page.textContent("#reviewLabel");
  check("入口上写了到期张数", /1 张卡到期/.test(label), label);
  check("入口指向 /review/", ((await page.locator("#reviewEntry").getAttribute("href")) || "").includes("/review/"));
}

// ---------------------------------------------------------------- 3. 复习页
await page.locator("#reviewEntry").click();
await page.waitForLoadState("domcontentloaded");
await sleep(800);
check("复习页打开", page.url().includes("/review/"));
check("顶栏有「← 大厅」", (await page.locator(".topbar-back").count()) > 0);

const cardShown = await page.locator("#cardBox").isVisible();
check("到期卡片被拿出来", cardShown);
if (cardShown) {
  check("卡片写了来自哪个学科", /数学岛/.test(await page.textContent("#cardFrom")),
        await page.textContent("#cardFrom"));
  check("卡片正面是题目", (await page.textContent("#cardFront")).length > 0, await page.textContent("#cardFront"));
  check("答案一开始是藏着的", await page.locator("#cardBack").isHidden());

  await page.click("#btnShow");
  await sleep(250);
  check("点「看答案」后答案出现", await page.locator("#cardBack").isVisible());
  check("答案内容非空", (await page.textContent("#cardAnswer")).length > 0);

  await page.click("#btnYes");
  await sleep(400);
  check("判完之后进入结束态", await page.locator("#doneBox").isVisible());
  check("小结说了复习了几张", /复习完了 1 张/.test(await page.textContent("#doneTitle")),
        await page.textContent("#doneTitle"));
}

// ---------------------------------------------------------------- 4. 盒子往后走了一格
box = await boxItems();
keys = Object.keys(box);
check("答对后盒号 +1", box[keys[0]] && box[keys[0]].box === 1, `box=${box[keys[0]] && box[keys[0]].box}`);
check("答对后到期时间往后推（不是明天，是 2 天后）",
      box[keys[0]] && box[keys[0]].due === Math.floor(Date.now() / 86400000) + 2,
      `due=${box[keys[0]] && box[keys[0]].due}`);

// ---------------------------------------------------------------- 5. 跨学科：再放一张英语卡
await page.evaluate(() => {
  window.SRS.add({ subject: "en", id: "food_apple", front: "apple", back: "苹果　/ˈæpl/", hint: "An apple a day." });
  const k = "mian_srs__items__p_default";
  const d = JSON.parse(localStorage.getItem(k) || "{}");
  Object.keys(d).forEach((x) => { d[x].due = 0; });
  localStorage.setItem(k, JSON.stringify(d));
});
await page.goto(BASE + "/review/", { waitUntil: "domcontentloaded" });
await sleep(700);
check("两个学科的卡片在同一个队列里", (await page.locator("#bySubject .rv-chip").count()) >= 2,
      `${await page.locator("#bySubject .rv-chip").count()} 个学科`);
const chips = await page.textContent("#bySubject");
check("队列里能看到数学和英语", /数学岛/.test(chips) && /萌语岛/.test(chips), chips.replace(/\s+/g, " "));

// 键盘操作
await page.keyboard.press("Space");
await sleep(250);
check("空格键能翻到答案", await page.locator("#cardBack").isVisible());
await page.keyboard.press("1");
await sleep(350);
check("按 1 = 再想想（不放回盒子）", !(await page.locator("#cardBox").isVisible()) ||
      (await page.textContent("#qCount")).startsWith("2"), await page.textContent("#qCount"));

check("没有 JS 报错", pageErrors.length === 0, pageErrors.slice(0, 2).join(" | "));

console.log(out.join("\n"));
console.log(failed === 0 ? `\n🎉 全部 ${out.length} 项通过` : `\n❌ ${failed} / ${out.length} 项失败`);
await browser.close();
process.exit(failed === 0 ? 0 : 1);
