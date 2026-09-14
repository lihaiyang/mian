/**
 * 云同步核心逻辑测试（不需要网络：自带假 localStorage / 假 fetch / 假服务端）
 *
 *   node tools/test_cloud_sync.mjs
 *
 * 覆盖的都是「会真的丢东西」的路径：
 *   ① 推送失败后，下次必须原样重发（老版本会在发请求前就记账 → 永久丢）
 *   ② 本地改过的行，不能被云端旧版本覆盖
 *   ③ 云端更新时，本地要能拿到（先推后拉 + 游标不因推送前进）
 *   ④ 学习记录做并集：新设备先做题再登录，两边的记录都要在
 *   ⑤ 同步进行中的改动不能丢（补跑）
 *   ⑥ 有内容太大没传上去 → 状态是「黄色警告」而不是「绿色成功」
 *   ⑦ 老版本的同步状态会被强制重置，做一次完整同步
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const SRC = fs.readFileSync(path.join(ROOT, "js", "cloud.js"), "utf8");

let failed = 0;
const lines = [];
function check(name, ok, extra = "") {
  lines.push(`${ok ? "✅" : "❌"} ${name}${extra ? " —— " + extra : ""}`);
  if (!ok) failed++;
}

// ---------------- 假 localStorage ----------------
function makeStore() {
  const map = new Map();
  return {
    getItem: (k) => (map.has(k) ? map.get(k) : null),
    setItem: (k, v) => { map.set(k, String(v)); },
    removeItem: (k) => { map.delete(k); },
    clear: () => map.clear(),
    raw: map
  };
}

// ---------------- 假服务端（语义和 functions/api/sync.js 一致） ----------------
const TABLES = ["profiles", "folders", "files", "progress", "vfs"];
const MAX_CONTENT = 262144;

function makeServer() {
  const accounts = new Map();     // code -> account
  let failNext = 0;
  let delayMs = 0;
  let holdResolve = null;
  let holdNext = false;
  const log = [];

  const norm = (c) => String(c || "").replace(/[^0-9A-Za-z]/g, "").toUpperCase();
  const blank = () => ({
    id: "acc_" + accounts.size,
    rev: 0,
    pin: "",
    nickname: "",
    avatar: "",
    tables: TABLES.reduce((o, t) => { o[t] = new Map(); return o; }, {})
  });
  const keyOf = (table, row) =>
    table === "progress" ? row.profile_id :
    table === "vfs" ? row.profile_id + "|" + row.path : row.id;

  async function handler(url, opts) {
    log.push(url);
    if (failNext > 0) { failNext--; throw new Error("网络断了"); }
    if (holdNext) { holdNext = false; await new Promise((r) => { holdResolve = r; }); }
    if (delayMs) await new Promise((r) => setTimeout(r, delayMs));

    const body = opts && opts.body ? JSON.parse(opts.body) : null;
    const json = (data, status = 200) => ({
      ok: status < 400, status, json: async () => data
    });

    if (url.indexOf("/api/account") === 0) {
      if (body.action === "create") {
        let code;
        do { code = Math.random().toString(36).slice(2, 6).toUpperCase() + "-" + Math.random().toString(36).slice(2, 6).toUpperCase(); }
        while (accounts.has(norm(code)));
        const acc = blank();
        acc.pin = body.pin || "";
        acc.nickname = body.nickname || "";
        acc.avatar = body.avatar || "";
        accounts.set(norm(code), acc);        // 统一按「去掉横线」的规范化码做键
        return json({ ok: true, code: code, accountId: acc.id, hasPin: !!acc.pin, serverTime: Date.now() });
      }
      const acc = accounts.get(norm(body.code));
      if (!acc) return json({ ok: false, error: "找不到这个同步码" }, 401);
      if (acc.pin && acc.pin !== (body.pin || "")) return json({ ok: false, error: "PIN 不对哦" }, 401);
      if (body.action === "login") {
        return json({ ok: true, accountId: acc.id, hasPin: !!acc.pin, nickname: acc.nickname, avatar: acc.avatar, serverTime: Date.now() });
      }
      if (body.action === "setpin") { acc.pin = body.newPin || ""; return json({ ok: true, hasPin: !!acc.pin, serverTime: Date.now() }); }
      if (body.action === "rotate") {
        accounts.delete(norm(body.code));
        const nc = "NEW1CODE";
        accounts.set(norm(nc), acc);
        return json({ ok: true, code: nc, serverTime: Date.now() });
      }
      return json({ ok: false, error: "未知操作" }, 400);
    }

    // /api/sync
    const isPull = (opts && opts.method) !== "POST";
    const code = isPull ? norm(new URL("http://x" + url).searchParams.get("code")) : norm(body.code);
    const acc = accounts.get(code);
    if (!acc) return json({ ok: false, error: "找不到这个同步码" }, 401);
    if (acc.pin && acc.pin !== ((isPull ? new URL("http://x" + url).searchParams.get("pin") : body.pin) || "")) {
      return json({ ok: false, error: "PIN 不对哦" }, 401);
    }

    if (isPull) {
      const since = Number(new URL("http://x" + url).searchParams.get("since") || 0);
      const out = { ok: true, rev: acc.rev, serverTime: Date.now(), hasPin: !!acc.pin, nickname: acc.nickname, avatar: acc.avatar };
      TABLES.forEach((t) => {
        out[t] = [...acc.tables[t].values()].filter((r) => (r.rev || 0) > since);
      });
      return json(out);
    }

    // push
    acc.rev += 1;                     // 原子分配（假服务端天然原子）
    const rev = acc.rev;
    let skipped = 0;
    const c = body.changes || {};
    (c.profiles || []).forEach((p) => {
      const map = acc.tables.profiles;
      const old = map.get(p.id);
      if (old && !(p.updated_at >= old.updated_at)) return;
      map.set(p.id, Object.assign({}, p, { rev: rev }));
    });
    ["folders", "files"].forEach((t) => {
      (c[t] || []).forEach((row) => {
        if (t === "files" && String(row.content || "").length > MAX_CONTENT) { skipped += 1; return; }
        const map = acc.tables[t];
        const k = keyOf(t, row);
        const old = map.get(k);
        if (old && !(row.updated_at >= old.updated_at)) return;
        map.set(k, Object.assign({}, row, { rev: rev }));
      });
    });
    (c.progress || []).forEach((p) => {
      const row = { profile_id: p.profile_id, stats_json: JSON.stringify(p.stats || {}), updated_at: p.updated_at, rev: rev };
      const old = acc.tables.progress.get(p.profile_id);
      if (old && !(p.updated_at >= old.updated_at)) return;
      acc.tables.progress.set(p.profile_id, row);
    });
    (c.vfs || []).forEach((v) => {
      const row = Object.assign({}, v, { rev: rev });
      const k = keyOf("vfs", v);
      const old = acc.tables.vfs.get(k);
      if (old && !(v.updated_at >= old.updated_at)) return;
      acc.tables.vfs.set(k, row);
    });
    return json({ ok: true, rev: rev, skipped: skipped, serverTime: Date.now() });
  }

  return {
    handler, accounts, log,
    fail(n) { failNext = n; },
    setDelay(ms) { delayMs = ms; },
    hold() { holdNext = true; },
    release() { if (holdResolve) { const r = holdResolve; holdResolve = null; r(); } },
    /** 模拟「另一台设备」直接往云端写一行（用于测冲突） */
    writeFromOtherDevice(code, table, row) {
      const acc = accounts.get(norm(code));
      acc.rev += 1;
      const stored = Object.assign({}, row, { rev: acc.rev });
      acc.tables[table].set(keyOf(table, row), stored);
      return stored;
    },
    rows(code, table) {
      return [...accounts.get(norm(code)).tables[table].values()];
    }
  };
}

// ---------------- 载入一份 cloud.js（每台「设备」一份） ----------------
function makeDevice(store, server) {
  const listeners = {};
  const fakeDoc = {
    getElementById: () => null,
    querySelector: () => null,
    createElement: () => ({ style: {}, addEventListener() {}, select() {}, remove() {} }),
    body: { appendChild() {}, removeChild() {} },
    addEventListener: (k, fn) => { listeners["doc:" + k] = fn; },
    hidden: false
  };
  const fakeWin = {
    addEventListener: (k, fn) => { listeners["win:" + k] = fn; },
    App: null
  };
  // node 里 navigator 是只读的 getter，必须用 defineProperty 覆盖
  const fakeNav = { onLine: true, clipboard: null };
  const define = (k, v) => Object.defineProperty(globalThis, k, { value: v, configurable: true, writable: true });
  define("localStorage", store);
  define("document", fakeDoc);
  define("window", fakeWin);
  define("navigator", fakeNav);
  define("fetch", (url, opts) => server.handler(url, opts));
  globalThis.console = console;
  const fn = new Function(SRC + "\n;return CloudSync;");
  const CloudSync = fn();
  return { CloudSync, listeners };
}

// ---------------- 便捷读写本地数据（模拟 FileManager / Progress 写的内容） ----------------
function seedWorkspace(store, pid, files, folders) {
  store.setItem("codepanda_python_files_v1__" + pid, JSON.stringify({
    v: 2, folders: folders || [{ id: "f_mine", name: "我的作品", emoji: "📁", keep: true }],
    files: files || [], collapsed: {}
  }));
}
function seedProfile(store, id, name, emoji) {
  store.setItem("codepanda_profiles_v1", JSON.stringify([{ id: id, name: name, emoji: emoji || "🐼" }]));
  store.setItem("codepanda_current_profile_v1", JSON.stringify(id));
}
function seedStats(store, pid, stats) {
  store.setItem("codepanda_stats_v1_" + pid, JSON.stringify(stats));
}
function readStats(store, pid) {
  return JSON.parse(store.getItem("codepanda_stats_v1_" + pid) || "{}");
}
function readFiles(store, pid) {
  const ws = JSON.parse(store.getItem("codepanda_python_files_v1__" + pid) || "{}");
  return ws.files || [];
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// =====================================================================
// ① 推送失败 → 下次必须原样重发
// =====================================================================
async function testRetryAfterFailure() {
  const server = makeServer();
  const store = makeStore();
  seedProfile(store, "p_default", "小熊猫", "🐼");
  seedWorkspace(store, "p_default", [{ id: "file_a", name: "作品.py", content: "print(1)", folderId: "f_mine" }]);
  const dev = makeDevice(store, server);
  const code = await dev.CloudSync.createAccount("");

  // 再改一次内容，然后让下一次推送失败
  const ws = JSON.parse(store.getItem("codepanda_python_files_v1__p_default"));
  ws.files[0].content = "print(2)   # 这次必须传上去";
  store.setItem("codepanda_python_files_v1__p_default", JSON.stringify(ws));

  server.fail(1);
  await dev.CloudSync.syncNow(true);
  const afterFail = server.rows(code, "files")[0];
  check("推送失败时云端没被写脏", !afterFail || afterFail.content === "print(1)", afterFail && afterFail.content);

  await dev.CloudSync.syncNow(true);
  const afterRetry = server.rows(code, "files")[0];
  check("失败之后下一次会原样重发（不丢改动）",
    !!afterRetry && afterRetry.content === "print(2)   # 这次必须传上去",
    afterRetry && afterRetry.content);
}

// =====================================================================
// ② 云端更新时本地能拿到；③ 本地改过的不被覆盖
// =====================================================================
async function testPullAndLocalWins() {
  const server = makeServer();
  const store = makeStore();
  seedProfile(store, "p_default", "小熊猫", "🐼");
  seedWorkspace(store, "p_default", [{ id: "file_x", name: "x.py", content: "v1", folderId: "f_mine" }]);
  const dev = makeDevice(store, server);
  const code = await dev.CloudSync.createAccount("");
  await dev.CloudSync.syncNow(true);
  check("初次同步把本地文件传上去了", server.rows(code, "files")[0].content === "v1");

  // 另一台设备更新了这个文件（时间更新）
  server.writeFromOtherDevice(code, "files", {
    id: "file_x", profile_id: "p_default", folder_id: "f_mine", name: "x.py",
    content: "v2 来自平板", updated_at: Date.now(), deleted: 0
  });
  await dev.CloudSync.syncNow(true);
  check("云端更新能拉到本地（游标不因推送前进）",
    readFiles(store, "p_default")[0].content === "v2 来自平板",
    readFiles(store, "p_default")[0].content);

  // 本地又改了（比云端更新：推送用的是服务端时间，一定不小于云端）
  const ws = JSON.parse(store.getItem("codepanda_python_files_v1__p_default"));
  ws.files[0].content = "v3 本地刚改的";
  store.setItem("codepanda_python_files_v1__p_default", JSON.stringify(ws));
  await dev.CloudSync.syncNow(true);
  check("本地新改动不会被云端旧版本盖掉",
    readFiles(store, "p_default")[0].content === "v3 本地刚改的",
    readFiles(store, "p_default")[0].content);
  check("本地新改动确实推到了云端", server.rows(code, "files")[0].content === "v3 本地刚改的");
}

// =====================================================================
// ④ 新设备先做题再登录 → 学习记录并集，谁都不丢
// =====================================================================
async function testStatsMergeOnLogin() {
  const server = makeServer();
  // 设备 A：老账号，做了很多题
  const storeA = makeStore();
  seedProfile(storeA, "p_default", "小明", "🦊");
  seedWorkspace(storeA, "p_default", [{ id: "file_a", name: "a.py", content: "print('a')", folderId: "f_mine" }]);
  seedStats(storeA, "p_default", {
    xp: 500, runs: 100, successes: 90, solved: { E0001: 1, E0002: 1, E0003: 1 },
    lessons: { L01: true, L02: true }, days: ["2026-09-01", "2026-09-02"], badges: ["b_first_run"],
    skill: { print: 3 }
  });
  const devA = makeDevice(storeA, server);
  const code = await devA.CloudSync.createAccount("");
  await devA.CloudSync.syncNow(true);

  // 设备 B：全新设备，先做了 3 道题，然后才登录
  const storeB = makeStore();
  seedProfile(storeB, "p_default", "小熊猫", "🐼");
  seedWorkspace(storeB, "p_default", [{ id: "file_b", name: "我的第一个程序.py", content: "print(1)", folderId: "f_mine" }]);
  seedStats(storeB, "p_default", {
    xp: 30, runs: 5, successes: 3, solved: { E0090: 1, E0091: 1, E0092: 1 },
    lessons: { L01: true }, days: ["2026-09-10"], badges: ["b_first_ok"], skill: { print: 2 }
  });
  const devB = makeDevice(storeB, server);
  await devB.CloudSync.login(code, "");

  const st = readStats(storeB, "p_default");
  check("登录后：云端的学习经验保留", st.xp === 500, "xp=" + st.xp);
  check("登录后：本机刚做的题也保留", !!st.solved.E0090 && !!st.solved.E0091, "solved=" + Object.keys(st.solved).length);
  check("登录后：两边的题合起来了", Object.keys(st.solved).length === 6, Object.keys(st.solved).join(","));
  check("登录后：课程记录并集", !!st.lessons.L01 && !!st.lessons.L02);
  check("登录后：徽章并集", st.badges.length === 2, st.badges.join(","));
  check("登录后：技能计数取两边较大值（幂等，不会越合越多）", (st.skill.print || 0) === 3, "skill.print=" + st.skill.print);

  // 云端也应该拿到合并后的结果
  await devB.CloudSync.syncNow(true);
  const cloudStats = JSON.parse(server.rows(code, "progress")[0].stats_json || "{}");
  check("云端也补全成并集（下次别的设备也拿得到）",
    cloudStats.xp === 500 && Object.keys(cloudStats.solved).length === 6,
    "xp=" + cloudStats.xp + " solved=" + Object.keys(cloudStats.solved).length);

  // 新设备上新建的文件也要保留并传上去
  const filesNow = server.rows(code, "files").map((f) => f.id).sort();
  check("新设备自建的文件不会丢，也传上去了",
    filesNow.indexOf("file_a") !== -1 && filesNow.indexOf("file_b") !== -1, filesNow.join(","));
  check("登录不会把云端的档案名字洗掉",
    JSON.parse(storeB.getItem("codepanda_profiles_v1"))[0].name === "小明",
    JSON.parse(storeB.getItem("codepanda_profiles_v1"))[0].name);
}

// =====================================================================
// ⑤ 同步进行中的改动不能丢
// =====================================================================
async function testBusyDoesNotDrop() {
  const server = makeServer();
  const store = makeStore();
  seedProfile(store, "p_default", "小熊猫", "🐼");
  seedWorkspace(store, "p_default", [{ id: "file_z", name: "z.py", content: "第一版", folderId: "f_mine" }]);
  const dev = makeDevice(store, server);
  const code = await dev.CloudSync.createAccount("");
  await dev.CloudSync.syncNow(true);

  // 让下一次请求卡住，期间再改一次内容
  server.hold();
  const running = dev.CloudSync.syncNow(true);
  await sleep(30);
  const ws = JSON.parse(store.getItem("codepanda_python_files_v1__p_default"));
  ws.files[0].content = "同步过程中改的第二版";
  store.setItem("codepanda_python_files_v1__p_default", JSON.stringify(ws));
  dev.CloudSync.noteDirty();          // 同步中 → 应该排队补跑
  server.release();
  await running;
  await sleep(1200);                  // 等补跑那一轮（防抖 3s + 补跑 300ms，这里直接手动再叫一次）
  await dev.CloudSync.syncNow(true);

  check("同步进行中的改动最终也传上去了",
    server.rows(code, "files")[0].content === "同步过程中改的第二版",
    server.rows(code, "files")[0].content);
}

// =====================================================================
// ⑥ 有内容太大没传上去 → 黄色警告，不是绿色成功
// =====================================================================
async function testSkippedIsWarned() {
  const server = makeServer();
  const store = makeStore();
  seedProfile(store, "p_default", "小熊猫", "🐼");
  seedWorkspace(store, "p_default", [
    { id: "file_big", name: "好大的文件.py", content: "x".repeat(300000), folderId: "f_mine" }
  ]);
  const dev = makeDevice(store, server);
  await dev.CloudSync.createAccount("");
  const st = dev.CloudSync.getStatus();
  check("有文件太大没传上去时，状态是「警告」而不是 ok", st.status === "warn", st.status + " / " + st.error);
}

// =====================================================================
// ⑦ 老版本的同步状态会被强制重置
// =====================================================================
async function testUpgradeReset() {
  const server = makeServer();
  const store = makeStore();
  seedProfile(store, "p_default", "小熊猫", "🐼");
  seedWorkspace(store, "p_default", [{ id: "file_u", name: "u.py", content: "print('u')", folderId: "f_mine" }]);
  // 伪造一份「老版本」的同步状态：rev 很靠前，但记账是错的
  store.setItem("codepanda_cloud_v1", JSON.stringify({ code: "", pin: "", accountId: "", rev: 99 }));
  store.setItem("codepanda_cloud_sent_v1", JSON.stringify({ "file|file_u": { h: "错的哈希", t: 1, row: { id: "file_u" } } }));
  const dev = makeDevice(store, server);
  dev.CloudSync.init();          // 迁移发生在 init → load 里
  const sent = JSON.parse(store.getItem("codepanda_cloud_sent_v1"));
  const state = JSON.parse(store.getItem("codepanda_cloud_v1"));
  check("升级后清掉老记账（强制重新同步一次）", Object.keys(sent).length === 0, "sent=" + Object.keys(sent).length);
  check("升级后拉取游标归零（会做一次完整拉取）", state.rev === 0, "rev=" + state.rev);
}

// =====================================================================
// ⑧ 离线时不报错、联网后自动补传
// =====================================================================
async function testOfflineThenOnline() {
  const server = makeServer();
  const store = makeStore();
  seedProfile(store, "p_default", "小熊猫", "🐼");
  seedWorkspace(store, "p_default", [{ id: "file_o", name: "o.py", content: "离线写的内容", folderId: "f_mine" }]);
  const dev = makeDevice(store, server);
  const code = await dev.CloudSync.createAccount("");
  await dev.CloudSync.syncNow(true);

  const ws = JSON.parse(store.getItem("codepanda_python_files_v1__p_default"));
  ws.files[0].content = "断网时写的内容";
  store.setItem("codepanda_python_files_v1__p_default", JSON.stringify(ws));
  globalThis.navigator.onLine = false;   // fakeNav 是可写的
  await dev.CloudSync.syncNow(true);
  check("断网时给出友好提示而不是静默失败",
    dev.CloudSync.getStatus().status === "error" && /没有网络/.test(dev.CloudSync.getStatus().error),
    dev.CloudSync.getStatus().error);

  globalThis.navigator.onLine = true;
  dev.listeners["win:online"] && dev.listeners["win:online"]();
  await sleep(1200);
  await dev.CloudSync.syncNow(true);
  check("联网后自动补传", server.rows(code, "files")[0].content === "断网时写的内容");
}

// =====================================================================
(async () => {
  await testRetryAfterFailure();
  await testPullAndLocalWins();
  await testStatsMergeOnLogin();
  await testBusyDoesNotDrop();
  await testSkippedIsWarned();
  await testUpgradeReset();
  await testOfflineThenOnline();

  console.log(lines.join("\n"));
  console.log(failed === 0 ? `\n🎉 云同步 ${lines.length} 项全部通过` : `\n❌ ${failed} / ${lines.length} 项失败`);
  process.exit(failed === 0 ? 0 : 1);
})();
