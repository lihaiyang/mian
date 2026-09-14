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
      await CloudSync.syncNow(true);          // 现在会等这一轮真的跑完
      await CloudSync.whenIdle();
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

// 统计 /api/sync 请求数（用来抓「同步空转」这类问题）
async function startCounting(page) {
  await page.evaluate(() => {
    window.__syncCalls = 0;
    if (!window.__origFetch) {
      window.__origFetch = window.fetch;
      window.fetch = function (url, opts) {
        if (String(url).indexOf("/api/sync") !== -1) window.__syncCalls++;
        return window.__origFetch.apply(this, arguments);
      };
    }
    window.__syncCalls = 0;
  });
}
const syncCalls = (page) => page.evaluate(() => window.__syncCalls || 0);

const A = await newDevice("A");
const B = await newDevice("B");

// ---------- A 生成同步码 ----------
const code = await A.page.evaluate(async () => await CloudSync.createAccount(""));
check("A 能生成同步码", /^[0-9A-Z]{4}-[0-9A-Z]{4}$/.test(code || ""), code);
await sync(A.page);

// ---------- A 建一个作品：不自动同步，而是显示「未同步」 ----------
await A.page.evaluate(() => {
  FileManager.createFile("来自设备A.py", "print('设备A写的')\n");
});
await sleep(4000);                                  // 等一会儿：不应该有任何自动同步
const notYet = await A.page.evaluate(async (c) => {
  const st = CloudSync.getStatus();
  const r = await fetch("/api/sync?code=" + encodeURIComponent(c) + "&since=0");
  const d = await r.json();
  return { status: st.status, dirty: st.dirty,
           onServer: (d.files || []).some((f) => f.name === "来自设备A.py"),
           label: (document.getElementById("syncLabel") || {}).textContent };
}, code);
check("新建文件后不会自己同步，而是显示「未同步」",
  !notYet.onServer && notYet.status === "dirty" && notYet.label === "未同步",
  JSON.stringify(notYet));

// ---------- 在编辑器里改代码，同样是「未同步」 ----------
await A.page.evaluate(() => {
  const f = FileManager.getFiles().find((x) => x.name === "来自设备A.py");
  FileManager.setActiveFile(f.id);
  CodeEditor.setValue("print('设备A改过的内容')\n");
});
await sleep(3000);
const stillDirty = await A.page.evaluate(() => CloudSync.getStatus());
check("改代码之后状态仍是「未同步」", stillDirty.status === "dirty" && stillDirty.dirty === true, stillDirty.status);

// 手动点同步 → 两个改动一起上去
await A.page.click("#btnSyncNow");
await sleep(3000);
const afterManual = await A.page.evaluate(async (c) => {
  const r = await fetch("/api/sync?code=" + encodeURIComponent(c) + "&since=0");
  const d = await r.json();
  const f = (d.files || []).find((x) => x.name === "来自设备A.py");
  return { status: CloudSync.getStatus().status, label: document.getElementById("syncLabel").textContent,
           content: f ? f.content : "(没有这个文件)" };
}, code);
check("点一下同步：新建 + 改内容都传上去了",
  /设备A改过的内容/.test(afterManual.content) && afterManual.status === "ok" && afterManual.label === "已同步",
  JSON.stringify(afterManual).slice(0, 120));

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
await sync(A.page);          // 再跑一轮：A 把自己的并集结果推上去
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
  offlineStatus.status === "error" && /没有网络|网络不太好/.test(offlineStatus.error || ""),
  offlineStatus.status + " / " + (offlineStatus.error || ""));

await B.ctx.setOffline(false);
await sleep(1500);
const stillOffline = await statusOf(B.page);
check("恢复网络后不会自己偷偷同步（状态仍是未同步/失败）",
  stillOffline.status === "dirty" || stillOffline.status === "error", stillOffline.status);
await B.page.click("#btnSyncNow");                    // 手动点一下
await sleep(3000);
const uploaded = (await statusOf(B.page)).status === "ok";
check("点一下同步就补传上去了", uploaded, JSON.stringify(await statusOf(B.page)));
// 确认这一步真的传到云端（只查一次）
const uploadedOnServer = await B.page.evaluate(async (c) => {
  const r = await fetch("/api/sync?code=" + encodeURIComponent(c) + "&since=0");
  const d = await r.json();
  return (d.files || []).some((f) => f.name === "断网时写的.py");
}, code);
check("补传的内容确实到了云端", uploadedOnServer);

// ---------- B 的作品也应回到 A ----------
const aSyncOk = await sync(A.page);
const aDiag = await A.page.evaluate(async (c) => {
  const st = CloudSync.getStatus();
  const r = await fetch("/api/sync?code=" + encodeURIComponent(c) + "&since=0");
  const d = await r.json();
  return { status: st.status, err: st.error, rev: st.rev, serverRev: d.rev,
           remoteNames: (d.files || []).filter((f) => !f.deleted).map((f) => f.name) };
}, code);
check("A 能同步成功（诊断）", aSyncOk, JSON.stringify(aDiag));
await sleep(300);
const aFiles = await filesOf(A.page);
check("A 那边也能看到 B 在断网期间写的作品",
  aFiles.indexOf("断网时写的.py") !== -1,
  aFiles.join(" | ") + " ／ 云端: " + aDiag.remoteNames.join(" | ") + " ／ rev " + aDiag.rev + "→" + aDiag.serverRev);

// ---------- 学堂里写的代码（草稿）也要能同步 ----------
await A.page.evaluate(() => { CodeEditor.setValue(""); });
await A.page.evaluate(() => Learn.open("exercise"));
await A.page.waitForSelector(".ex-row", { timeout: 30000 });
await A.page.locator(".learn-panel .ex-row").first().click();
await A.page.waitForSelector(".task-card");
const draftId = await A.page.evaluate(() => Learn.currentLearnId());
await A.page.evaluate(() => {
  const cm = document.querySelector(".CodeMirror");
  if (cm && cm.CodeMirror) cm.CodeMirror.setValue("print('学堂里写的答案')\n");
});
await sleep(1500);
const draftDirty = await A.page.evaluate(() => CloudSync.getStatus());
check("在学堂里写代码也会标记「未同步」", draftDirty.status === "dirty", draftDirty.status);
await A.page.click("#btnSyncNow");
await sleep(3000);
const draftOnServer = await A.page.evaluate(async (c) => {
  const r = await fetch("/api/sync?code=" + encodeURIComponent(c) + "&since=0");
  const d = await r.json();
  return (d.learn || []).some((x) => /学堂里写的答案/.test(x.code || ""));
}, code);
check("学堂草稿真的传到了云端（以前的 bug：永远同步不上）", draftOnServer);
// B 手动同步一次，应该也能拿到这份草稿
await B.page.click("#btnSyncNow");
await sleep(3000);
const bDrafts = await B.page.evaluate(() => {
  const raw = localStorage.getItem("codepanda_learn_drafts_v1__" + Progress.getCurrentProfile().id) || "{}";
  const obj = JSON.parse(raw);
  return { ids: Object.keys(obj), text: Object.keys(obj).map((k) => obj[k].code || "").join("\n") };
});
check("另一台设备同步后也能拿到学堂草稿", /学堂里写的答案/.test(bDrafts.text),
  bDrafts.ids.join(",") + " / " + bDrafts.text.slice(0, 30));

// ---------- 顶栏「云同步」按钮 ----------
await B.page.bringToFront();
await sleep(500);
const btn = await B.page.evaluate(() => {
  const b = document.getElementById("btnSyncNow");
  return { label: (document.getElementById("syncLabel") || {}).textContent, dot: (document.getElementById("syncDot") || {}).textContent,
           title: b ? b.title : "" };
});
check("顶栏有「云同步」按钮并显示状态", /已同步|同步中|部分未传|同步失败/.test(btn.label || ""), JSON.stringify(btn));
await B.page.click("#btnSyncNow");
await sleep(2500);
const afterClick = await B.page.evaluate(() => document.getElementById("syncLabel").textContent);
check("点一下「云同步」会立即同步（状态回到已同步）", /已同步/.test(afterClick), afterClick);

// ---------- 闲置的设备靠「后台自动同步」收到改动 ----------
await A.page.bringToFront();
// 先回到工坊模式（前面进过学堂，学堂里改的是草稿，不是文件）
await A.page.evaluate(() => { if (typeof Learn !== "undefined" && Learn.isActive && Learn.isActive()) Learn.exit(); });
await sleep(600);
await A.page.evaluate(() => {
  const f = FileManager.getFiles().find((x) => x.name === "断网时写的.py") || FileManager.getFiles()[0];
  FileManager.setActiveFile(f.id);
  CodeEditor.setValue("print('闲置设备也要能收到这一行')\n");
});
await A.page.click("#btnSyncNow");                // 手动同步（现在没有自动同步了）
await sleep(3000);
const pushedByA = await A.page.evaluate(async (c) => {
  const r = await fetch("/api/sync?code=" + encodeURIComponent(c) + "&since=0");
  const d = await r.json();
  return (d.files || []).some((f) => /闲置设备也要能收到这一行/.test(f.content || ""));
}, code);
check("A 改内容后确实推到了云端", pushedByA);

// 现在没有后台自动同步了：B 重新打开页面时会同步一次（这是唯一的「自动」行为）
await B.page.reload({ waitUntil: "domcontentloaded" });
await B.page.waitForFunction(() => document.getElementById("statusText")?.textContent.includes("就绪"), null, { timeout: 60000 });
await sleep(3000);
const got = await B.page.evaluate(() => FileManager.getFiles().some((f) => /闲置设备也要能收到这一行/.test(f.content || "")));
check("另一台设备重新打开页面时会拉到改动", got);
const bStatus = await statusOf(B.page);
check("重新打开后状态是「已同步」", bStatus.status === "ok", bStatus.status);

// ---------- 静置 12 秒不应该有任何同步请求（防空转） ----------
await A.page.bringToFront();
await sleep(1500);
await startCounting(A.page);
await sleep(12000);
const idleCalls = await syncCalls(A.page);
check("静置时不会空转同步（12 秒内请求数 ≤ 1）", idleCalls <= 1, idleCalls + " 次 /api/sync");

const realErrors = pageErrors.filter((e) => !/favicon|Failed to load resource|ERR_INTERNET_DISCONNECTED|net::/.test(e));
check("没有 JS 报错", realErrors.length === 0, realErrors.slice(0, 2).join(" | "));

await browser.close();
console.log(out.join("\n"));
console.log(failed === 0 ? `\n🎉 云同步端到端 ${out.length} 项全部通过` : `\n❌ ${failed} / ${out.length} 项失败`);
process.exit(failed === 0 ? 0 : 1);
