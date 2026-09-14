/**
 * 云同步端到端测试（真后端：wrangler pages dev + 本地 D1；两个浏览器上下文＝两台设备）
 *
 *   npx wrangler pages dev . --port 8788 &
 *   PLAYWRIGHT_PATH=<playwright 目录> node tools/e2e_sync.mjs http://127.0.0.1:8788
 *
 * 覆盖「两台设备 + 云端」的真实链路：
 *   A 建号 → 传作品 → B 用同步码登录能拿到
 *   A、B 各做一道题 → 学习记录并集（谁都不丢）
 *   A 删文件 → B 同步后也删掉（墓碑）
 *   自动触发：在编辑器里敲字，不手动点同步也应该上传
 *   断网 → 状态报错；恢复网络 → 自动补传
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

const browser = await chromium.launch({ channel: process.env.PW_CHANNEL || "chrome" });
const pageErrors = [];

async function newDevice(name) {
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 860 } });
  const page = await ctx.newPage();
  page.on("pageerror", (e) => pageErrors.push(name + ": " + e.message));
  await page.goto(BASE + "/v2/index.html", { waitUntil: "domcontentloaded" });
  await page.waitForFunction(() => document.getElementById("statusText")?.textContent.includes("就绪"), null, { timeout: 60000 });
  await sleep(1400);
  if (await page.isVisible("#confirmModal.active")) await page.click("#btnConfirmCancel");
  return { ctx, page, name };
}

// 手动同步：如果正好有一轮在跑（busy），稍等一下再叫
async function sync(page, tries = 6) {
  for (let i = 0; i < tries; i++) {
    const ok = await page.evaluate(async () => {
      if (!CloudSync.isSignedIn()) return false;
      await CloudSync.syncNow(true);
      return CloudSync.getStatus().status === "ok";
    });
    if (ok) return true;
    await sleep(700);
  }
  return false;
}
const statusOf = (page) => page.evaluate(() => CloudSync.getStatus());
const filesOf = (page) => page.evaluate(() => FileManager.getFiles().map((f) => f.name));
const serverFiles = (page, code) => page.evaluate(async (c) => {
  const r = await fetch("/api/sync?code=" + encodeURIComponent(c) + "&since=0");
  const d = await r.json();
  // 服务器保留墓碑行（deleted=1），所以这里把删除状态一起带出来
  return (d.files || []).filter((f) => !f.deleted).map((f) => f.name);
}, code);

const A = await newDevice("A");
const B = await newDevice("B");

// ---------- A 生成同步码 ----------
const code = await A.page.evaluate(async () => await CloudSync.createAccount(""));
check("A 能生成同步码", /^[0-9A-Z]{4}-[0-9A-Z]{4}$/.test(code || ""), code);
await sync(A.page);

// ---------- A 建一个作品，应该自动上传（不手动点同步） ----------
await A.page.evaluate(() => {
  FileManager.createFile("来自设备A.py", "print('设备A写的')\n");
});
await sleep(4500);                                  // 等自动同步（防抖 3 秒）
const autoUploaded = await A.page.evaluate(async (c) => {
  const r = await fetch("/api/sync?code=" + encodeURIComponent(c) + "&since=0");
  const d = await r.json();
  return (d.files || []).some((f) => f.name === "来自设备A.py");
}, code);
check("在工坊里新建文件会自动同步（不用手动点）", autoUploaded);

// ---------- 在编辑器里敲字也应该自动上传 ----------
await A.page.evaluate(() => {
  const f = FileManager.getFiles().find((x) => x.name === "来自设备A.py");
  FileManager.setActiveFile(f.id);
  CodeEditor.setValue("print('设备A改过的内容')\n");
});
await sleep(4500);
const editedUploaded = await A.page.evaluate(async (c) => {
  const r = await fetch("/api/sync?code=" + encodeURIComponent(c) + "&since=0");
  const d = await r.json();
  const f = (d.files || []).find((x) => x.name === "来自设备A.py");
  return f && /设备A改过的内容/.test(f.content);
}, code);
check("在编辑器里改代码会自动同步", editedUploaded);

// ---------- B 用同步码登录，拿到 A 的作品 ----------
const loginOk = await B.page.evaluate(async (c) => {
  await CloudSync.login(c, "");
  return CloudSync.getStatus().signedIn;
}, code);
check("B 用同步码登录成功", loginOk);
await sleep(600);
const bFiles = await filesOf(B.page);
check("B 登录后拿到 A 的作品", bFiles.indexOf("来自设备A.py") !== -1, bFiles.join(" | "));

// ---------- 两台设备各做一道题 → 学习记录并集 ----------
await A.page.evaluate(() => Progress.recordExercise({ id: "E0001", topic: "print", level: 1, passed: true }));
await B.page.evaluate(() => Progress.recordExercise({ id: "E0002", topic: "print", level: 1, passed: true }));
await sync(A.page);
await sync(B.page);
await sleep(400);
const merged = await B.page.evaluate(async (c) => {
  const r = await fetch("/api/sync?code=" + encodeURIComponent(c) + "&since=0");
  const d = await r.json();
  const row = (d.progress || [])[0];
  const st = row ? JSON.parse(row.stats_json || "{}") : {};
  return Object.keys(st.solved || {}).sort();
}, code);
check("两台设备做的题在云端是并集", merged.indexOf("E0001") !== -1 && merged.indexOf("E0002") !== -1, merged.join(","));

await sync(A.page);
const aSolved = await A.page.evaluate(() => Object.keys(Progress.getStats().solved).sort());
check("A 也能看到 B 做的那道题（学习进度双向同步）", aSolved.indexOf("E0002") !== -1, aSolved.join(","));

// ---------- A 删文件 → B 那边也要消失（墓碑） ----------
await A.page.evaluate(() => {
  const f = FileManager.getFiles().find((x) => x.name === "来自设备A.py");
  FileManager.deleteFile(f.id);
});
await sync(A.page);
await sync(B.page);
await sleep(400);
const afterDelete = await filesOf(B.page);
check("A 删掉的文件在 B 那边也没了", afterDelete.indexOf("来自设备A.py") === -1, afterDelete.join(" | "));
const serverAfterDelete = await serverFiles(B.page, code);
check("云端也标记成删除了（墓碑行）", serverAfterDelete.indexOf("来自设备A.py") === -1, serverAfterDelete.join(" | "));
const tombstone = await B.page.evaluate(async (c) => {
  const r = await fetch("/api/sync?code=" + encodeURIComponent(c) + "&since=0");
  const d = await r.json();
  const row = (d.files || []).find((f) => f.name === "来自设备A.py");
  return row ? !!row.deleted : false;
}, code);
check("云端确实留下了 deleted 墓碑（别的设备才能同步到删除）", tombstone);

// ---------- 断网 → 报错；恢复 → 自动补传 ----------
await B.page.evaluate(() => FileManager.createFile("断网时写的.py", "print('断网时的作品')\n"));
await B.ctx.setOffline(true);
const offlineStatus = await B.page.evaluate(async () => {
  await CloudSync.syncNow(true);
  return CloudSync.getStatus();
});
check("断网时状态是错误并给出提示",
  offlineStatus.status === "error" && /没有网络/.test(offlineStatus.error || ""), offlineStatus.error);

await B.ctx.setOffline(false);
let uploaded = false;
for (let i = 0; i < 16 && !uploaded; i++) {           // 不手动点同步，等自动重试
  await sleep(1000);
  uploaded = await B.page.evaluate(async (c) => {
    const r = await fetch("/api/sync?code=" + encodeURIComponent(c) + "&since=0");
    const d = await r.json();
    return (d.files || []).some((f) => f.name === "断网时写的.py");
  }, code);
}
check("恢复网络后自动补传（不需要手动点）", uploaded);

// ---------- B 的作品也应回到 A ----------
await sync(A.page);
await sleep(300);
const aFiles = await filesOf(A.page);
check("A 那边也能看到 B 在断网期间写的作品", aFiles.indexOf("断网时写的.py") !== -1, aFiles.join(" | "));

const realErrors = pageErrors.filter((e) => !/favicon|Failed to load resource|ERR_INTERNET_DISCONNECTED|net::/.test(e));
check("没有 JS 报错", realErrors.length === 0, realErrors.slice(0, 2).join(" | "));

await browser.close();
console.log(out.join("\n"));
console.log(failed === 0 ? `\n🎉 云同步端到端 ${out.length} 项全部通过` : `\n❌ ${failed} / ${out.length} 项失败`);
process.exit(failed === 0 ? 0 : 1);
