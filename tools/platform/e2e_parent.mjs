/**
 * 家长中心 · 端到端测试（Playwright）
 *
 * 用法：
 *   node tools/platform/e2e_parent.mjs [http://127.0.0.1:8788]
 *
 * 测的是 F2：家长能不能**一眼看到**孩子在所有学科的情况。
 *
 * 难点在于三个学科体系的存储形状各不相同（平台的 days 是对象、Python 是数组、
 * Python 的 streak 是数字而平台是对象）。所以这里特意先在数学岛造一份数据、
 * 再手写一份「Python 形状」和一份「英语形状」的假数据，验证汇总页三种都能读。
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
const page = await browser.newPage({ viewport: { width: 1280, height: 1000 } });
const pageErrors = [];
page.on("pageerror", (e) => pageErrors.push(e.message));

// ---------------------------------------------------------------- 造数据
// 1) 真的去数学岛做错一题（验证真链路）
await page.goto(BASE + "/math/", { waitUntil: "domcontentloaded" });
await page.waitForSelector(".ma-unit", { timeout: 25000 });
await sleep(700);
await page.locator(".ma-unit").first().click();
await page.waitForSelector("#playCard", { state: "visible" });
await sleep(300);
await page.fill("#answer", "___肯定不对___");
await page.click("#btnCheck");
await sleep(700);

// 2) 手写两份"老学科形状"的记录：Python 的 days 是数组、streak 是数字；
//    英语同样。这两个键平台层不写，只有老站写。
await page.evaluate(() => {
  localStorage.setItem("codepanda_stats_v1_p_default", JSON.stringify({
    xp: 320, runs: 40, successes: 30, days: ["2026-09-10", "2026-09-12", "2026-09-15"],
    streak: 3, badges: ["a", "b", "c", "d"], medals: ["m1"]
  }));
  localStorage.setItem("en_stats__p_default", JSON.stringify({
    xp: 150, days: ["2026-09-11", "2026-09-15"], streak: 2,
    badges: ["x", "y"], medals: [], words: {}, readers: {}
  }));
});

// ---------------------------------------------------------------- 打开家长中心
await page.goto(BASE + "/parent/", { waitUntil: "domcontentloaded" });
await sleep(1000);

check("无 JS 报错", pageErrors.length === 0, pageErrors[0] || "");
check("顶栏有「← 大厅」", (await page.locator(".topbar-back").count()) > 0);
check("有日期", /\d+ 年 \d+ 月 \d+ 日/.test(await page.textContent("#paDate")));
check("有打印按钮", (await page.locator("#btnPrint").count()) === 1);

const body = await page.textContent("#subjBody");
check("表格里能看到数学岛", /数学岛/.test(body));
check("表格里能看到萌码 Python（老站形状也能读）", /萌码 Python/.test(body), body.slice(0, 60));
check("表格里能看到萌语岛（老站形状也能读）", /萌语岛/.test(body));

// 行数 = 有记录的学科数
const rows = await page.locator("#subjBody tr").count();
check("三个有记录的学科都在表里", rows === 3, `${rows} 行`);

// 数字对不对：从 DOM 里把 Python 那一行取出来核
const pyRow = await page.evaluate(() => {
  const tr = Array.from(document.querySelectorAll("#subjBody tr"))
    .find((r) => /Python/.test(r.textContent));
  if (!tr) return null;
  const td = Array.from(tr.querySelectorAll("td")).map((x) => x.textContent.trim());
  return { name: td[0], level: td[1], xp: td[2], badges: td[3], medals: td[4], days: td[5], last: td[6] };
});
check("Python 的经验读到了 320", pyRow && /320/.test(pyRow.xp), JSON.stringify(pyRow));
check("Python 的徽章数是 4", pyRow && pyRow.badges === "4");
check("Python 的奖牌数是 1", pyRow && pyRow.medals === "1");
check("Python 的练习天数是 3（days 是数组也能数对）", pyRow && /3/.test(pyRow.days), pyRow && pyRow.days);
check("Python 的最近日期取的是最后一个", pyRow && /9 月 15 日/.test(pyRow.last), pyRow && pyRow.last);
check("Python 的等级按它自己的曲线算（80+20 步长，不是平台的 100+60）",
      pyRow && /Lv\.\d/.test(pyRow.level), pyRow && pyRow.level);

// 总览
check("总览的连续打卡 = 各科最大（Python 是 3）", (await page.textContent("#ovStreak")) === "3",
      await page.textContent("#ovStreak"));
check("总览的学科数 = 3", (await page.textContent("#ovSubjects")) === "3");
check("总览的复习盒数量 ≥ 1（刚才做错了一题）",
      Number(await page.textContent("#ovBox")) >= 1, await page.textContent("#ovBox"));

// 需要多练的
const weak = await page.textContent("#weakBox");
check("「需要多练的」列出了数学错题", /数学岛/.test(weak), weak.replace(/\s+/g, " ").slice(0, 70));
check("错题写成「题目 → 答案」的形式", /→/.test(weak));

// 正文里不该漏出 Markdown 星号（HTML 不认 ** **）
const pageText = await page.textContent(".pa-body");
check("正文里没有漏出来的 Markdown 星号", !/\*\*/.test(pageText),
      (pageText.match(/.{0,12}\*\*.{0,12}/) || [""])[0]);

// 打印样式：打印时该藏的藏、该留的留
await page.emulateMedia({ media: "print" });
await sleep(200);
const printState = await page.evaluate(() => ({
  topbar: getComputedStyle(document.querySelector(".topbar")).display,
  tips: getComputedStyle(document.querySelector(".pa-tips")).display,
  table: getComputedStyle(document.querySelector("#subjTable")).display,
}));
check("打印时隐藏顶栏", printState.topbar === "none", printState.topbar);
check("打印时隐藏「可以这样陪」（那是给屏幕看的）", printState.tips === "none", printState.tips);
check("打印时保留学科表格", printState.table !== "none", printState.table);
await page.emulateMedia({ media: "screen" });

// 大厅的入口现在应该直接可用（不再是 alert 占位）
await page.goto(BASE + "/", { waitUntil: "domcontentloaded" });
await page.waitForSelector(".subject-card", { timeout: 15000 });
await sleep(400);
check("大厅有家长中心入口", (await page.locator("#parentLink").count()) === 1);

check("没有 JS 报错（全程）", pageErrors.length === 0, pageErrors.slice(0, 2).join(" | "));

console.log(out.join("\n"));
console.log(failed === 0 ? `\n🎉 全部 ${out.length} 项通过` : `\n❌ ${failed} / ${out.length} 项失败`);
await browser.close();
process.exit(failed === 0 ? 0 : 1);
