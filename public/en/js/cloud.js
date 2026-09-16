/**
 * ☁️ Cloud —— 云同步（离线优先）
 *
 * 数据流：
 *   本地 localStorage / IndexedDB（主存储，永远先写这里）
 *        ↓ 3 秒防抖（Progress.onChange / SRS 变更后触发）
 *   POST /api/en/sync  →  Cloudflare D1（en_profiles / en_progress / en_srs / en_daily）
 *        ↑ GET /api/en/sync?since=<rev> 增量拉取，按行 updated_at 合并
 *
 * 原则：
 *   ① 没网、没后端（纯静态服务器）时**优雅降级成"离线模式"**，不刷错误、不影响孩子学习；
 *   ② 身份 = 8 位同步码，与萌码 Python 共用（只存 code；PIN 只在需要时输入，不落盘）；
 *   ③ 录音永远不上传（IndexedDB 里躺着，服务端没有任何音频字段）。
 */
const Cloud = (() => {
  const BASE = "/api/en";
  const state = {
    code: "", rev: 0, lastSyncAt: 0, lastPushAt: 0,
    error: "", syncing: false, offline: false, pending: 0, nick: ""
  };
  let listeners = [];
  let timer = null;
  let retry = 0;

  function load() {
    const s = Store.get("cloud", null);
    if (s && typeof s === "object") {
      state.code = String(s.code || "");
      state.rev = Number(s.rev) || 0;
      state.lastSyncAt = Number(s.lastSyncAt) || 0;
      state.lastPushAt = Number(s.lastPushAt) || 0;
      state.nick = s.nick || "";
    }
  }
  function save() {
    Store.set("cloud", {
      code: state.code, rev: state.rev,
      lastSyncAt: state.lastSyncAt, lastPushAt: state.lastPushAt, nick: state.nick
    });
  }
  function emit() { listeners.forEach(cb => { try { cb(status()); } catch (e) {} }); }
  function status() {
    return {
      signedIn: !!state.code, code: state.code, rev: state.rev,
      lastSyncAt: state.lastSyncAt, syncing: state.syncing,
      error: state.error, offline: state.offline, pending: state.pending
    };
  }
  function setErr(msg) { state.error = msg || ""; emit(); }

  async function api(path, opts) {
    const res = await fetch(BASE + path, Object.assign({
      headers: { "content-type": "application/json" }
    }, opts || {}));
    let data = null;
    try { data = await res.json(); } catch (e) { data = null; }
    if (!res.ok) {
      const msg = (data && data.error) || ("网络请求失败（" + res.status + "）");
      const err = new Error(msg);
      err.status = res.status;
      throw err;
    }
    return data || {};
  }

  /* ---------------- 收集与落地 ---------------- */
  function collect(since) {
    const rows = { profiles: [], progress: [], srs: [], daily: [] };
    try {
      const profs = (typeof Progress !== "undefined" && Progress.profiles) ? Progress.profiles() : [];
      const cur = (typeof Progress !== "undefined" && Progress.currentProfile) ? Progress.currentProfile() : null;
      profs.forEach(p => {
        const updated = p.updatedAt || (cur && cur.id === p.id ? Date.now() : 0) || p.createdAt || Date.now();
        if (p.dirty === false && since && updated <= since) return;
        rows.profiles.push({
          id: p.id, name: p.name, emoji: p.emoji, grade: p.grade || 2,
          goal: (typeof App !== "undefined" && App.getSettings) ? App.getSettings().goal : 15,
          created_at: p.createdAt || Date.now(),
          updated_at: p.updatedAt || p.createdAt || Date.now(),
          deleted: 0
        });
      });
      if (cur && typeof Progress.exportRow === "function") {
        const row = Progress.exportRow();
        rows.progress.push({ profile_id: cur.id, stats_json: row.stats_json, updated_at: row.updated_at });
      }
      if (typeof SRS !== "undefined" && SRS.exportRows) {
        SRS.exportRows().forEach(r => {
          rows.srs.push(Object.assign({ profile_id: cur ? cur.id : "p_default" }, r));
        });
      }
      if (typeof Progress.exportDaily === "function") {
        rows.daily = Progress.exportDaily();
      }
    } catch (e) { /* 收集失败就当这次没东西可推 */ }
    return rows;
  }

  function apply(rows) {
    if (!rows) return 0;
    let n = 0;
    try {
      (rows.profiles || []).forEach(rp => {
        if (!rp || !rp.id) return;
        const list = Progress.profiles();
        const hit = list.find(x => x.id === rp.id);
        if (!hit) {
          list.push({ id: rp.id, name: rp.name || "小朋友", emoji: rp.emoji || "🐼", grade: rp.grade || 2, createdAt: rp.created_at || Date.now() });
          Store.set("profiles", list);
          n++;
        } else if ((rp.updated_at || 0) > (hit.updatedAt || 0)) {
          Progress.updateProfile(rp.id, { name: rp.name, emoji: rp.emoji, grade: rp.grade || 2 });
          n++;
        }
      });
      if (typeof Progress.importRow === "function") {
        (rows.progress || []).forEach(r => { if (Progress.importRow(r)) n++; });
      }
      if (typeof SRS !== "undefined" && SRS.importRows) {
        n += SRS.importRows((rows.srs || []).map(r => ({
          item_id: r.item_id, box: r.box, due_at: r.due_at, streak: r.streak,
          lapses: r.lapses, last_result: r.last_result, updated_at: r.updated_at, deleted: r.deleted
        })));
      }
      if (typeof Progress.importDaily === "function") {
        n += Progress.importDaily(rows.daily || []);
      }
    } catch (e) {}
    return n;
  }

  /* ---------------- 同步 ---------------- */
  async function pull() {
    const data = await api("/sync?code=" + encodeURIComponent(state.code) + "&since=" + state.rev);
    if (data.serverTime) state.serverTime = data.serverTime;
    if (typeof data.rev === "number") state.rev = data.rev;
    if (data.nickname) state.nick = data.nickname;
    const changed = apply(data.rows || {});
    save();
    return changed;
  }

  async function push(rows) {
    const data = await api("/sync", { method: "POST", body: JSON.stringify({ code: state.code, rows: rows }) });
    if (typeof data.rev === "number" && data.rev > state.rev) state.rev = data.rev;
    state.lastPushAt = Date.now();
    save();
    return data;
  }

  async function sync(silent) {
    if (!state.code) return { ok: false, error: "还没登录同步码" };
    if (state.syncing) return { ok: false, error: "正在同步中" };
    state.syncing = true;
    state.error = "";
    emit();
    try {
      // 先拉后推：避免本地过期快照盖掉别的设备刚写的数据
      const pulled = await pull();
      const rows = collect();
      await push(rows);
      state.lastSyncAt = Date.now();
      state.offline = false;
      retry = 0;
      save();
      state.syncing = false;
      emit();
      if (!silent && typeof UI !== "undefined") UI.toast(pulled ? "同步完成，更新了 " + pulled + " 处" : "同步完成", "ok");
      return { ok: true, pulled };
    } catch (e) {
      state.syncing = false;
      state.offline = (e && e.status === 404) || !navigator.onLine;
      state.error = state.offline ? "" : (e && e.message) || "同步失败";
      emit();
      // 指数退避重试（最多 3 次）
      if (!state.offline && retry < 3) {
        retry++;
        const wait = 3000 * Math.pow(2, retry - 1);
        setTimeout(() => { sync(true); }, wait);
      }
      return { ok: false, error: state.error || "离线模式" };
    }
  }

  function scheduleSync() {
    if (!state.code) return;
    state.pending++;
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => { timer = null; state.pending = 0; sync(true); }, 3000);
  }

  /* ---------------- 账号 ---------------- */
  async function create(nickname, avatar) {
    try {
      const data = await api("/account", {
        method: "POST",
        body: JSON.stringify({ action: "create", nickname: nickname || "小朋友", avatar: avatar || "🐼" })
      });
      if (data.code) { state.code = data.code; save(); await sync(true); }
      return { ok: true, code: data.code };
    } catch (e) {
      return { ok: false, error: (e && e.message) || "创建失败" };
    }
  }

  async function login(code, pin) {
    try {
      const data = await api("/account", {
        method: "POST",
        body: JSON.stringify({ action: "login", code: code, pin: pin || "" })
      });
      state.code = data.code || String(code || "").toUpperCase();
      // 注意：这里**不能**把服务端当前 rev 当成"已见过的 rev" ——
      // 新设备本地 rev 是 0，必须从头把账号里的东西全拉一遍；
      // 只有同步响应（pull/push）才能推进 state.rev。
      state.nick = data.nickname || "";
      save();
      const r = await sync(true);
      return { ok: r.ok !== false, error: r.error };
    } catch (e) {
      return { ok: false, error: (e && e.message) || "登录失败" };
    }
  }

  async function setPin(pin) {
    try {
      await api("/account", { method: "POST", body: JSON.stringify({ action: "setpin", code: state.code, pin: pin }) });
      return { ok: true };
    } catch (e) { return { ok: false, error: (e && e.message) || "设置失败" }; }
  }

  function signOut() {
    state.code = "";
    state.rev = 0;
    state.lastSyncAt = 0;
    Store.del("cloud");
    emit();
  }

  function isSignedIn() { return !!state.code; }
  function code() { return state.code; }
  function onStatus(cb) { if (typeof cb === "function") listeners.push(cb); }

  /* ---------------- 启动 ---------------- */
  function boot() {
    load();
    emit();
    if (typeof Progress !== "undefined" && Progress.onChange) Progress.onChange(() => scheduleSync());
    window.addEventListener("online", () => { if (state.code) sync(true); });
    // 打开页面 8 秒后自动同步一次（不打扰孩子刚进来的操作）
    if (state.code) setTimeout(() => sync(true), 8000);
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();

  return { isSignedIn, code, create, login, setPin, sync, status, onStatus, signOut, collect, apply,
    scheduleSync, BASE };
})();
window.Cloud = Cloud;
