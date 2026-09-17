/**
 * 拼音岛出题自检：把干扰项规则在**全部可拼音节**上跑一遍
 *
 * 用法：PLAYWRIGHT_PATH=... node tools/pinyin/check_choices.mjs [base]
 *
 * 为什么不能只在 e2e 里抽样测：干扰项的挑选有逐级降级，
 * 而"某一级凑不出 3 个"只发生在特定音节上 ——
 * 实测 352 个音节里有 22 个（6%）凑不出"同韵母同声调"的干扰项，
 * 抽样测几道题完全碰不到，只有全量跑才抓得到。
 * 当时的表现是"随机性的 0/3"，看起来像测试不稳定，其实是真 bug。
 *
 * 检查四件事（每一条错了孩子都会学到错的）：
 *   ① 选项必须够 4 个
 *   ② 绝不能有同音选项（同音 = 两个正确答案）
 *   ③ 不能重复出现同一个字
 *   ④ 干扰项里不能混进正确答案
 * 另外把"降级到第几级"统计出来 —— 第 0 级越多，题目越接近理想（只差声母）。
 */
const pwSpec = process.env.PLAYWRIGHT_PATH
  ? "file://" + process.env.PLAYWRIGHT_PATH.replace(/\/$/, "") + "/index.mjs"
  : "playwright";
const { chromium } = await import(pwSpec);

const BASE = process.argv[2] || process.env.BASE || "http://127.0.0.1:8788";
const browser = await chromium.launch(
  process.env.CHROME_BIN ? { executablePath: process.env.CHROME_BIN } : {}
);
const page = await browser.newPage();
await page.goto(BASE + "/pinyin/", { waitUntil: "domcontentloaded" });
await page.waitForFunction(() => window.PinyinDebug && window.PinyinDebug.pickDistractors, null, { timeout: 20000 });

const res = await page.evaluate(() => {
  const pool = window.PinyinDebug.pdPool();
  const problems = [];
  const tiers = {};
  pool.forEach((row) => {
    const picked = window.PinyinDebug.pickDistractors(row);
    const all = [row].concat(picked);
    // 降级级次：自己重算一遍，好把统计报出来
    const t = [0, 1, 2, 3].find((i) => {
      const f = [
        (r) => r.f === row.f && r.t === row.t && r.i !== row.i,
        (r) => r.f === row.f && r.i !== row.i,
        (r) => r.f === row.f && r.t !== row.t,
        (r) => r.i === row.i && r.f !== row.f
      ][i];
      return pool.filter((r) => r.s !== row.s && r.c !== row.c && r.py !== row.py && f(r)).length >= 3;
    });
    tiers[t === undefined ? "fallback" : t] = (tiers[t === undefined ? "fallback" : t] || 0) + 1;

    if (all.length !== 4) problems.push(`${row.s}: 只凑出 ${all.length} 个选项`);
    const pys = all.map((x) => x.py);
    if (new Set(pys).size !== pys.length) problems.push(`${row.s}: 有同音选项 ${pys.join("/")}`);
    const cs = all.map((x) => x.c);
    if (new Set(cs).size !== cs.length) problems.push(`${row.s}: 重复字 ${cs.join("/")}`);
    if (picked.some((x) => x.s === row.s)) problems.push(`${row.s}: 干扰项里混进了正确答案`);
    if (picked.some((x) => !x || !x.py)) problems.push(`${row.s}: 干扰项缺拼音`);
  });
  return { total: pool.length, tiers, problems };
});

console.log(`在 ${res.total} 个可拼音节上跑了出题规则`);
console.log(`降级分布（0 = 同韵母同声调、只差声母，最理想）：${JSON.stringify(res.tiers)}`);
if (res.problems.length) {
  console.log(`❌ ${res.problems.length} 个问题：`);
  res.problems.slice(0, 20).forEach((p) => console.log("   ·", p));
} else {
  console.log("✅ 选项都够 4 个、无同音、无重复字、干扰项不含正确答案");
}
await browser.close();
process.exit(res.problems.length ? 1 : 0);
