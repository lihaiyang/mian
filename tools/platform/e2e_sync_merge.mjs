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

// 默认超时：本地 20s 够用，线上要放大 —— 这个站本来就是为"国内到 Cloudflare 不稳"做离线的，
// 拿 20s 卡线上测出来的是网络抖动，不是产品问题。超时放大不拖慢通过的运行。
const E2E_WAIT = Number(process.env.E2E_WAIT_MS || (/^https?:\/\/(127\.|localhost)/.test(BASE) ? 20000 : 60000));
if (browser && browser.setDefaultTimeout) browser.setDefaultTimeout(E2E_WAIT);
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

// ---------------------------------------------------------------- 8. 多档案不撞行 + 档案改名 LWW
// 用拦截网络的方式测：把 /api/v1/sync 的请求体截下来看，再伪造响应喂回去。
let pushBodies = [];
let fakeProfiles = [];
await page.route("**/api/v1/sync**", async (route) => {
  const req = route.request();
  const ok = { status: 200, contentType: "application/json" };
  if (req.method() === "POST") {
    try { pushBodies.push(JSON.parse(req.postData() || "{}")); } catch (e) { pushBodies.push({}); }
    return route.fulfill(Object.assign({}, ok, {
      body: JSON.stringify({ ok: true, rev: 9, serverTime: Date.now() }) }));
  }
  return route.fulfill(Object.assign({}, ok, {
    body: JSON.stringify({ ok: true, rev: 9, serverTime: Date.now(), subject: "typing",
                           profiles: fakeProfiles, rows: {} }) }));
});

// 设一个登录态（不联网，只写本地），再加一个档案
await page.evaluate(() => {
  AccountUI.applyCode("TESTCODE", {});
  if (Progress.profiles().length < 2) Progress.addProfile("老二", "🐼");
});
await sleep(200);

async function pushCurrent() {
  pushBodies = [];
  await page.evaluate(() => Sync.push().catch(() => null));
  await sleep(500);
  return pushBodies[0] || null;
}

const first = await page.evaluate(() => Progress.profileId());
const b1 = await pushCurrent();
const row1 = b1 && b1.rows && b1.rows.progress && b1.rows.progress[0] && b1.rows.progress[0].row_id;

await page.evaluate(() => {
  const other = Progress.profiles().find(p => p.id !== Progress.profileId());
  Progress.switchProfile(other.id);
});
await sleep(200);
const second = await page.evaluate(() => Progress.profileId());
const b2 = await pushCurrent();
const row2 = b2 && b2.rows && b2.rows.progress && b2.rows.progress[0] && b2.rows.progress[0].row_id;

check("两个档案推的 row_id 不同（sub_rows 主键不含 profile_id，写死就会互相覆盖）",
      !!row1 && !!row2 && row1 !== row2, `${row1} vs ${row2}`);
check("row_id 里带了档案 id", /^progress__/.test(row1 || "") && row1.indexOf(first) > 0,
      `${row1} / 档案=${first}`);
check("第二个档案的 row_id 也带了它自己的 id", (row2 || "").indexOf(second) > 0, `${row2} / 档案=${second}`);

// 档案时间戳：必须是档案自己的，不能是 now()（否则 A 设备改名会被 B 设备推回）
const profPayload = b1 && b1.profiles && b1.profiles[0];
check("推送的档案带着自己的 updated_at（不是 Date.now()）",
      !!profPayload && typeof profPayload.updated_at === "number",
      JSON.stringify(profPayload));

// 远端档案行的时间戳更旧 → 不许覆盖本地改过的名字
const renamed = await page.evaluate(() => {
  const id = Progress.profileId();
  Progress.updateProfile(id, { name: "本地改的名字" });
  const p = Progress.profiles().find(x => x.id === id);
  return { id, name: p.name, updatedAt: p.updatedAt };
});
check("本地改档案会推进 updatedAt", renamed.updatedAt > 0, `updatedAt=${renamed.updatedAt}`);

fakeProfiles = [{ id: renamed.id, name: "别的设备改的", emoji: "🐼",
                  updated_at: Math.max(0, renamed.updatedAt - 60000), deleted: 0 }];
await page.evaluate(() => Sync.pull().catch(() => null));
await sleep(500);
const afterOld = await page.evaluate((id) =>
  (Progress.profiles().find(x => x.id === id) || {}).name, renamed.id);
check("更旧的远端档案行不会覆盖本地改名（LWW 方向正确）",
      afterOld === "本地改的名字", `现在是「${afterOld}」`);

// 远端档案行更新 → 要能覆盖
fakeProfiles = [{ id: renamed.id, name: "别的设备改的", emoji: "🐼",
                  updated_at: renamed.updatedAt + 60000, deleted: 0 }];
await page.evaluate(() => Sync.pull().catch(() => null));
await sleep(500);
const afterNew = await page.evaluate((id) =>
  (Progress.profiles().find(x => x.id === id) || {}).name, renamed.id);
check("更新的远端档案行能覆盖本地", afterNew === "别的设备改的", `现在是「${afterNew}」`);

// ---------------------------------------------------------------- 9. 没有 JS 报错
check("没有 JS 报错", pageErrors.length === 0, pageErrors.slice(0, 2).join(" | "));

console.log(out.join("\n"));
console.log(failed === 0 ? `\n🎉 全部 ${out.length} 项通过` : `\n❌ ${failed} / ${out.length} 项失败`);
await browser.close();
process.exit(failed === 0 ? 0 : 1);
