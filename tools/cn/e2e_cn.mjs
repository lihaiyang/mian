/**
 * 汉字岛端到端测试（Playwright）
 *
 * 用法：
 *   node tools/cn/e2e_cn.mjs [http://127.0.0.1:8788]
 *
 * 覆盖：字表加载 → 级别/笔画/部首筛选 → 汉字与拼音搜索 → 详情（拼音/笔画/部首/组词）
 *       → 字帖篮 → 生成可打印字帖 → 平台层成长 → 大厅卡片 → 云同步挂载
 *
 * 这个学科和别的**不一样**：它面向家长/老师，是查字与打印的工具，不是刷题游戏。
 * 所以断言的重点在"查得到、查得准、印得出"，而不是积分和连击。
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
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
const pageErrors = [];
page.on("pageerror", (e) => pageErrors.push(e.message));

await page.goto(BASE + "/cn/", { waitUntil: "domcontentloaded" });
await page.waitForSelector(".cn-char", { timeout: 25000 });
await sleep(800);

// ---------------------------------------------------------------- 1. 字表
const meta = await page.evaluate(() => {
  const g = window.CN_GRADE || {};
  const all = [1, 2, 3, 4, 5, 6].flatMap((i) => g[i] || []);
  return {
    total: all.length,
    perGrade: [1, 2, 3, 4, 5, 6].map((i) => (g[i] || []).length),
    noPinyin: all.filter((x) => !x.p).length,
    noStroke: all.filter((x) => !x.s).length,
    noRadical: all.filter((x) => !x.r).length,
    withWords: all.filter((x) => x.w && x.w.length).length,
    avgWords: all.length ? (all.reduce((s, x) => s + (x.w || []).length, 0) / all.length) : 0,
    dupId: (() => { const s = new Set(); let d = 0; all.forEach((x) => { if (s.has(x.c)) d++; s.add(x.c); }); return d; })(),
  };
});
check("字表 3500 字", meta.total === 3500, `${meta.total} 字`);
check("六个级别都有字", meta.perGrade.every((n) => n > 0), meta.perGrade.join("/"));
check("每个字都有拼音", meta.noPinyin === 0, `${meta.noPinyin} 个缺`);
check("每个字都有笔画数", meta.noStroke === 0, `${meta.noStroke} 个缺`);
check("每个字都有部首", meta.noRadical === 0, `${meta.noRadical} 个缺`);
check("≥95% 的字有组词", meta.withWords / meta.total >= 0.95,
      `${meta.withWords}/${meta.total}（平均 ${meta.avgWords.toFixed(1)} 个词）`);
check("没有重复字", meta.dupId === 0, `${meta.dupId} 个`);

// 组词里不能有脏话 / 不当内容（字表是给小学生看的）
const unsafe = await page.evaluate(() => {
  const PAT = /他妈|妈的|傻逼|牛逼|装逼|妓|娼|嫖|淫|强奸|强暴|色情|裸|做爱|性交|自杀|自残|吸毒|毒品|赌博|赌场|凶杀|尸体|流氓|屌|屄|癌|艾滋/;
  const g = window.CN_GRADE || {};
  const hits = [];
  [1, 2, 3, 4, 5, 6].forEach((i) => (g[i] || []).forEach((x) =>
    (x.w || []).forEach((w) => { if (PAT.test(w)) hits.push(x.c + "→" + w); })));
  return hits;
});
check("组词里没有不当内容", unsafe.length === 0, unsafe.slice(0, 5).join(" , ") || "0 条");

// ---------------------------------------------------------------- 2. 界面
check("顶栏有「← 大厅」", (await page.locator(".topbar-back").count()) > 0);
check("字格已渲染", (await page.locator(".cn-char").count()) > 100);
check("默认选中 1 级", /1 级/.test(await page.textContent("#levelChips .cn-chip.active")));
check("笔画筛选有 6 档", (await page.locator("#strokeChips .cn-chip").count()) === 6);
check("部首筛选有候选", (await page.locator("#radicalChips .cn-chip").count()) > 5);

// 切级别
await page.locator("#levelChips .cn-chip").nth(2).click();
await sleep(300);
check("切到 2 级会重渲染", (await page.locator(".cn-char").count()) > 50);

// ---------------------------------------------------------------- 3. 搜索
await page.fill("#q", "水");
await sleep(350);
check("汉字搜索只剩 1 个结果", (await page.locator(".cn-char").count()) === 1);

await page.locator(".cn-char").first().click();
await sleep(300);
const detail = await page.textContent("#detail");
check("详情有拼音", /shuǐ/.test(detail));
check("详情有笔画与部首", /4 画/.test(detail) && /部首 水/.test(detail));
check("详情有组词", /水平|水产|水面|降水量/.test(detail));

await page.fill("#q", "xue");
await sleep(350);
const xue = await page.locator(".cn-char").count();
check("拼音搜索（不带声调）有结果", xue >= 1, `${xue} 个`);

await page.fill("#q", "shuǐ");
await sleep(350);
check("拼音搜索（带声调）也有结果", (await page.locator(".cn-char").count()) >= 1);

await page.click("#btnClear");
await sleep(350);
check("清空搜索后恢复", (await page.locator(".cn-char").count()) > 100);

// ---------------------------------------------------------------- 4. 字帖
await page.fill("#q", "水");
await sleep(300);
await page.locator(".cn-char").first().click();
await sleep(250);
await page.click("#btnAdd");
await sleep(250);
check("字能加进字帖篮", (await page.locator(".cn-basket-item").count()) === 1);

await page.click("#btnMakeSheet");
await sleep(400);
check("字帖覆盖层打开", await page.locator("#sheetOverlay").isVisible());
check("字帖有练习行", (await page.locator(".cn-sheet-row").count()) >= 1);
check("字帖第一格是示范字", (await page.locator(".cn-cell.demo").count()) >= 1);
check("字帖一行的格子数 = 8", (await page.locator(".cn-sheet-row").first().locator(".cn-cell").count()) === 8);
check("字帖有姓名栏", /姓名/.test(await page.textContent(".cn-sheet-foot")));
await page.click("#btnCloseSheet");
await sleep(300);
check("字帖可以关掉", !(await page.locator("#sheetOverlay").isVisible()));

// ---------------------------------------------------------------- 5. 平台层
await page.click("#btnProgress");
await sleep(400);
check("进度面板打开", await page.locator("#progressModal .cn-pf-level").isVisible());
check("等级卡有内容", /Lv\./.test(await page.textContent("#pfLevel")));
check("徽章墙已渲染", (await page.locator(".cn-badge").count()) >= 3);
check("奖牌墙已渲染", (await page.locator(".cn-medal").count()) >= 1);
const wired = await page.evaluate(() => ({
  progress: typeof Progress === "object",
  sync: typeof Sync === "object",
}));
check("Progress 已挂载", wired.progress);
check("Sync 已挂载（云同步不用学科自己写）", wired.sync);

// ---------------------------------------------------------------- 6. 大厅
await page.goto(BASE + "/", { waitUntil: "domcontentloaded" });
await page.waitForSelector(".subject-card", { timeout: 15000 });
await sleep(500);
const card = page.locator('a.subject-card[data-subject="cn"]');
check("大厅里汉字岛是可进入的卡片", (await card.count()) === 1);
check("卡片指向 /cn/", ((await card.getAttribute("href")) || "").includes("/cn/"));
const soon = await page.evaluate(() =>
  Array.from(document.querySelectorAll('.subject-card[aria-disabled="true"]'))
       .map((el) => el.textContent).join(" | "));
check("汉字岛已经不在「敬请期待」里", !soon.includes("汉字岛"));

check("没有 JS 报错", pageErrors.length === 0, pageErrors.slice(0, 2).join(" | "));

console.log(out.join("\n"));
console.log(failed === 0 ? `\n🎉 全部 ${out.length} 项通过` : `\n❌ ${failed} / ${out.length} 项失败`);
await browser.close();
process.exit(failed === 0 ? 0 : 1);
