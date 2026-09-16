/**
 * 平台同步合并的回归测试（Playwright）
 *
 * 用法：
 *   node tools/platform/e2e_sync_merge.mjs [http://127.0.0.1:8788]
 *
 * ---------------------------------------------------------------------------
 * 为什么专门有这个文件
 *
 * 独立审计在平台内核里发现了一个**会真丢数据**的 bug：
 *
 *   progress.js 的 save() 无条件把 `updated` 刷成 now()，而页面一加载就会
 *   save() 一次（初始化 / 补齐默认字段）。于是 importRow() 的守卫
 *   `stamp < cur.updated` 会把**所有**云端行判成「比本地旧」而拒绝 →
 *
 *     · 跨设备恢复永远不生效（换了设备看着像"进度全没了"）
 *     · 更糟：sync() 是先推后拉，紧接着的一次推送会拿本地的空进度、
 *       以"更新的时间戳"覆盖云端（服务端行级 LWW，照收不误）
 *
 * 而原来的 tools/typing/e2e_typing.mjs 只断言 `typeof Sync === "object"`，
 * **这条链路完全没有覆盖**，所以测试全绿但数据会丢。
 *
 * 这个文件盯的就是它：把「云端行能不能落到本地」「本地会不会反向覆盖云端」
 * 两条不变量钉死。改 shared/core/progress.js 的 save/importRow/exportRow 时
 * 必须让这些断言保持通过。
 * ---------------------------------------------------------------------------
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

// 用 /typing/ 当宿主：它是平台契约的样板，Progress / Sync 都挂着。
// 带一段假时间戳的"云端行"由测试自己构造，不需要真的连服务端。
await page.goto(BASE + "/typing/", { waitUntil: "domcontentloaded" });
await page.waitForFunction(() => window.Progress && window.Progress.stats, null, { timeout: 20000 });
await sleep(600);

/** 把一条"云端行"喂给 importRow，返回它是否被接受 + 之后的本地状态 */
const feed = (stats, stamp) => page.evaluate(
  ([s, t]) => {
    var accepted = Progress.importRow({ stats_json: JSON.stringify(s), updated_at: t });
    var after = Progress.stats();
    return { accepted, xp: after.xp, updated: after.updated, syncedAt: after.syncedAt };
  },
  [stats, stamp]
);

const localState = () => page.evaluate(() => {
  var r = Progress.exportRow();
  var s = Progress.stats();
  return { xp: s.xp, updated: s.updated, pushedStamp: r.updated_at };
});

// ---------------------------------------------------------------- 1. 新档案
const fresh = await localState();
check("新档案的 updated 是 0（不是 now）", fresh.updated === 0, `updated=${fresh.updated}`);
// 这条是"新设备一登录就把云端清零"的直接防线：
// sync() 是先推后拉，如果这里给的是 now()，服务端 LWW 就会用空进度覆盖云端。
check("新档案推出去的时间戳是 0（不会覆盖云端）", fresh.pushedStamp === 0,
      `pushedStamp=${fresh.pushedStamp}`);

// ---------------------------------------------------------------- 2. 云端有进度，本地是空的
const HOUR = 3600 * 1000;
const cloudStamp = Date.now() - HOUR;          // 一小时前的云端进度
const cloudStats = { xp: 500, counters: { sessions: 20 }, days: {}, streak: {}, badges: [], medals: [], missions: {}, daily: {}, best: {} };

const r1 = await feed(cloudStats, cloudStamp);
check("空档案能接受云端行（跨设备恢复）", r1.accepted === true);
check("云端 xp 真的落到本地了", r1.xp === 500, `xp=${r1.xp}`);
check("导入后 syncedAt 记下了云端时间戳", r1.syncedAt === cloudStamp);

// ---------------------------------------------------------------- 3. 导入不能反手覆盖云端
const afterImport = await localState();
check("导入后 pushedStamp 没有变成 now（不会反向覆盖云端）",
      afterImport.pushedStamp <= cloudStamp,
      `pushedStamp=${afterImport.pushedStamp} cloud=${cloudStamp} now=${Date.now()}`);

// ---------------------------------------------------------------- 4. 同一行重复拉取要去重
const r2 = await feed(cloudStats, cloudStamp);
check("同一条云端行重复导入会被去重", r2.accepted === false);

// ---------------------------------------------------------------- 5. 更新的云端行要能覆盖
const newerStamp = Date.now() - 60 * 1000;
const r3 = await feed(Object.assign({}, cloudStats, { xp: 900 }), newerStamp);
check("更新的云端行能覆盖本地", r3.accepted === true);
check("xp 更新到 900", r3.xp === 900, `xp=${r3.xp}`);

// ---------------------------------------------------------------- 6. 本地真的改了才推进 updated
await page.evaluate(() => Progress.emit("finish", { chars: 40, acc: 100 }));
await sleep(200);
const afterLocal = await localState();
check("本地产生真实改动后 updated 被推进", afterLocal.updated > 0, `updated=${afterLocal.updated}`);
check("本地改动的时间戳晚于云端", afterLocal.updated > newerStamp,
      `updated=${afterLocal.updated} cloud=${newerStamp}`);

// ---------------------------------------------------------------- 7. 本地新改动要赢过旧云端
const r4 = await feed(Object.assign({}, cloudStats, { xp: 123 }), newerStamp - 5000);
check("本地改过之后，更旧的云端行被拒绝（LWW 方向正确）", r4.accepted === false);
check("被拒绝时本地 xp 没被改掉", r4.xp !== 123, `xp=${r4.xp}`);

// ---------------------------------------------------------------- 8. 没有 JS 报错
check("没有 JS 报错", pageErrors.length === 0, pageErrors.slice(0, 2).join(" | "));

console.log(out.join("\n"));
console.log(failed === 0 ? `\n🎉 全部 ${out.length} 项通过` : `\n❌ ${failed} / ${out.length} 项失败`);
await browser.close();
process.exit(failed === 0 ? 0 : 1);
