/**
 * ☁️ 云同步（匿名同步码）
 * - 本地 localStorage 仍是主存储（离线也能用）
 * - 用「同步码」识别账号：只上传作品与配置，不含任何个人信息
 * - 增量推送：按行内容哈希找出变化，未变化的行不重复上传
 * - 增量拉取：服务端用单调递增 rev 递增版本号，避免设备时钟不一致
 */
const CloudSync = (() => {
  const STATE_KEY = "codepanda_cloud_v1";
  const SENT_KEY = "codepanda_cloud_sent_v1";
  const FILES_KEY = "codepanda_python_files_v1";
  const PROFILES_KEY = "codepanda_profiles_v1";
  const STATS_PREFIX = "codepanda_stats_v1_";
  const VFS_KEY = "codepanda_vfs_v1";
  const DEBOUNCE_MS = 3000;
  const API = "/api";

  let state = { code: "", pin: "", accountId: "", rev: 0, hasPin: false, nickname: "", avatar: "" };
  let lastSent = {};          // rowKey -> { h: 内容哈希, t: 该行的 updated_at, row: 上次发送的行 }
  let status = "idle";        // idle | syncing | ok | error
  let lastError = "";
  let lastSyncAt = 0;
  let timer = null;
  let busy = false;
  let listeners = [];

  function readJson(key, fallback) {
    try { const v = JSON.parse(localStorage.getItem(key) || "null"); return v === null ? fallback : v; }
    catch (e) { return fallback; }
  }
  function writeJson(key, val) { try { localStorage.setItem(key, JSON.stringify(val)); } catch (e) {} }

  function load() {
    const s = readJson(STATE_KEY, null);
    if (s && typeof s === "object") state = Object.assign(state, s);
    const sent = readJson(SENT_KEY, null);
    if (sent && typeof sent === "object") lastSent = sent;
  }
  function saveState() { writeJson(STATE_KEY, state); }
  function saveSent() { writeJson(SENT_KEY, lastSent); }

  function isSignedIn() { return !!state.code; }

  function setStatus(s, err) {
    status = s;
    if (err !== undefined) lastError = err || "";
    notify();
  }

  function notify() {
    listeners.forEach(fn => { try { fn(getStatus()); } catch (e) {} });
    try { renderChip(); } catch (e) {}
  }

  function getStatus() {
    return {
      signedIn: isSignedIn(), status: status, error: lastError, lastSyncAt: lastSyncAt,
      code: state.code, hasPin: !!state.hasPin, rev: state.rev || 0,
      accountId: state.accountId, nickname: state.nickname, avatar: state.avatar
    };
  }

  // ---------- 本地数据读取 ----------
  function readProfiles() { return readJson(PROFILES_KEY, []) || []; }
  function writeProfiles(list) { writeJson(PROFILES_KEY, list); }
  function readWorkspace(pid) { return readJson(FILES_KEY + "__" + pid, null); }
  function writeWorkspace(pid, ws) { writeJson(FILES_KEY + "__" + pid, ws); }
  function readStats(pid) { return readJson(STATS_PREFIX + pid, null); }
  function writeStats(pid, st) { writeJson(STATS_PREFIX + pid, st); }
  function readVfs() { return readJson(VFS_KEY, []) || []; }
  function writeVfs(list) { writeJson(VFS_KEY, list); }

  function currentProfileId() {
    try {
      // 注意：这个键是 JSON.stringify 存的（带引号），要解析后再用
      const raw = readJson("codepanda_current_profile_v1", "");
      const id = typeof raw === "string" ? raw : (raw && raw.id ? raw.id : "");
      if (id) return id;
      const ps = readProfiles();
      return ps.length ? ps[0].id : "p_default";
    } catch (e) { return "p_default"; }
  }

  function hash(str) {
    let h = 5381;
    const s = String(str);
    for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0;
    return h.toString(36) + ":" + s.length;
  }

  // ---------- 收集本地所有行（带变化检测，只推变化的） ----------
  function collectChanges() {
    const now = Date.now();
    const changes = { profiles: [], folders: [], files: [], progress: [], vfs: [] };
    const seen = {};
    const push = (key, row, payload) => {
      seen[key] = 1;
      const h = hash(payload);
      const prev = lastSent[key];
      if (prev && prev.h === h) return;            // 没变，不传
      const t = now;
      lastSent[key] = { h: h, t: t, row: row };
      return { row: row, t: t };
    };

    readProfiles().forEach(p => {
      const r = push("profile|" + p.id, { id: p.id, name: p.name, emoji: p.emoji || "" }, JSON.stringify([p.name, p.emoji]));
      if (r) changes.profiles.push(Object.assign({ updated_at: r.t }, r.row));
    });

    readProfiles().forEach(p => {
      const ws = readWorkspace(p.id);
      if (ws) {
        (ws.folders || []).forEach(f => {
          const r = push("folder|" + f.id, { id: f.id, profile_id: p.id, name: f.name, emoji: f.emoji || "", builtin: f.builtin ? 1 : 0, keep: f.keep ? 1 : 0, position: f.position || 0 }, JSON.stringify([f.name, f.emoji, f.builtin, f.keep, f.position]));
          if (r) changes.folders.push(Object.assign({ updated_at: r.t }, r.row));
        });
        (ws.files || []).forEach(f => {
          const r = push("file|" + f.id, { id: f.id, profile_id: p.id, folder_id: f.folderId || "", name: f.name, content: f.content || "" }, JSON.stringify([f.name, f.folderId, f.content]));
          if (r) changes.files.push(Object.assign({ updated_at: r.t }, r.row));
        });
      }
      const st = readStats(p.id);
      if (st) {
        const r = push("progress|" + p.id, { profile_id: p.id, stats: st }, JSON.stringify(st));
        if (r) changes.progress.push(Object.assign({ updated_at: r.t }, r.row));
      }
    });

    const pid = currentProfileId();
    readVfs().forEach(v => {
      const key = "vfs|" + pid + "|" + v.path;
      const r = push(key, { profile_id: pid, path: v.path, text: v.text || "" }, JSON.stringify(v.text));
      if (r) changes.vfs.push(Object.assign({ updated_at: r.t }, r.row));
    });

    // 墓碑：上次发过、现在没了的行
    Object.keys(lastSent).forEach(key => {
      if (seen[key]) return;
      const prev = lastSent[key];
      const row = prev.row || {};
      const t = now;
      if (key.startsWith("file|")) changes.files.push({ id: row.id, profile_id: row.profile_id, folder_id: row.folder_id || "", name: row.name || "", content: "", updated_at: t, deleted: 1 });
      else if (key.startsWith("folder|")) changes.folders.push({ id: row.id, profile_id: row.profile_id, name: row.name || "", emoji: row.emoji || "", updated_at: t, deleted: 1 });
      else if (key.startsWith("profile|")) changes.profiles.push({ id: row.id, name: row.name || "小朋友", emoji: row.emoji || "", updated_at: t, deleted: 1 });
      else if (key.startsWith("vfs|")) changes.vfs.push({ profile_id: row.profile_id, path: row.path, text: "", updated_at: t });
      delete lastSent[key];
    });

    return changes;
  }

  function countRows(c) {
    return (c.profiles || []).length + (c.folders || []).length + (c.files || []).length +
      (c.progress || []).length + (c.vfs || []).length;
  }

  // ---------- 应用远端数据 ----------
  function applyPull(data) {
    const touchedProfiles = {};
    const now = Date.now();

    (data.profiles || []).forEach(p => {
      const list = readProfiles();
      const i = list.findIndex(x => x.id === p.id);
      if (p.deleted) {
        if (i !== -1) list.splice(i, 1);
        writeProfiles(list);
        touchedProfiles[p.id] = 1;
        lastSent["profile|" + p.id] = { h: hash(JSON.stringify([p.name, p.emoji || ""])), t: p.updated_at, row: { id: p.id, name: p.name, emoji: p.emoji || "" } };
        return;
      }
      const row = { id: p.id, name: p.name, emoji: p.emoji || "🐼", createdAt: p.updated_at };
      if (i === -1) list.push(row); else list[i] = Object.assign({}, list[i], row);
      writeProfiles(list);
      touchedProfiles[p.id] = 1;
      lastSent["profile|" + p.id] = { h: hash(JSON.stringify([p.name, p.emoji || ""])), t: p.updated_at, row: { id: p.id, name: p.name, emoji: p.emoji || "" } };
    });

    (data.folders || []).forEach(f => {
      const ws = readWorkspace(f.profile_id) || { folders: [], files: [], collapsed: {} };
      ws.folders = ws.folders || [];
      const i = ws.folders.findIndex(x => x.id === f.id);
      if (f.deleted) { if (i !== -1) ws.folders.splice(i, 1); }
      else {
        const row = { id: f.id, name: f.name, emoji: f.emoji || "📁", builtin: !!f.builtin, keep: !!f.keep, position: f.position || 0 };
        if (i === -1) ws.folders.push(row); else ws.folders[i] = Object.assign({}, ws.folders[i], row);
      }
      writeWorkspace(f.profile_id, ws);
      touchedProfiles[f.profile_id] = 1;
      lastSent["folder|" + f.id] = { h: hash(JSON.stringify([f.name, f.emoji, f.builtin, f.keep, f.position])), t: f.updated_at, row: { id: f.id, profile_id: f.profile_id, name: f.name, emoji: f.emoji || "" } };
    });

    (data.files || []).forEach(f => {
      const ws = readWorkspace(f.profile_id) || { folders: [], files: [], collapsed: {} };
      ws.files = ws.files || [];
      const i = ws.files.findIndex(x => x.id === f.id);
      if (f.deleted) { if (i !== -1) ws.files.splice(i, 1); }
      else {
        const row = { id: f.id, name: f.name, content: f.content || "", folderId: f.folder_id || "" };
        if (i === -1) ws.files.push(row); else ws.files[i] = Object.assign({}, ws.files[i], row);
      }
      writeWorkspace(f.profile_id, ws);
      touchedProfiles[f.profile_id] = 1;
      lastSent["file|" + f.id] = { h: hash(JSON.stringify([f.name, f.folder_id, f.content || ""])), t: f.updated_at, row: { id: f.id, profile_id: f.profile_id, name: f.name, folder_id: f.folder_id, content: "" } };
    });

    (data.progress || []).forEach(p => {
      let st = {};
      try { st = JSON.parse(p.stats_json || "{}"); } catch (e) { st = {}; }
      // 学习记录里的「本地时间戳」不进 synced（避免每次都被判定为变化）
      writeStats(p.profile_id, st);
      touchedProfiles[p.profile_id] = 1;
      lastSent["progress|" + p.profile_id] = { h: hash(JSON.stringify(st)), t: p.updated_at, row: { profile_id: p.profile_id, stats: st } };
    });

    const pid = currentProfileId();
    const vfs = readVfs();
    (data.vfs || []).forEach(v => {
      if (v.profile_id !== pid) return;      // 虚拟文件目前只同步当前档案
      const i = vfs.findIndex(x => x.path === v.path);
      if (i === -1) vfs.push({ path: v.path, text: v.text || "", updatedAt: v.updated_at });
      else vfs[i] = Object.assign({}, vfs[i], { text: v.text || "", updatedAt: v.updated_at });
      lastSent["vfs|" + pid + "|" + v.path] = { h: hash(JSON.stringify(v.text || "")), t: v.updated_at, row: { profile_id: pid, path: v.path } };
    });
    writeVfs(vfs);

    return touchedProfiles;
  }

  function refreshUI(touched) {
    try {
      const keys = touched ? Object.keys(touched) : [];
      if (!keys.length || keys.indexOf(currentProfileId()) !== -1) {
        if (typeof FileManager !== "undefined" && FileManager.reload) FileManager.reload();
      }
      if (typeof Progress !== "undefined" && Progress.reload) Progress.reload();
    } catch (e) { console.warn("刷新界面失败", e); }
  }

  async function apiCall(path, opts) {
    const res = await fetch(API + path, opts);
    let data = {};
    try { data = await res.json(); } catch (e) {}
    if (!res.ok || data.ok === false) {
      const err = new Error(data.error || ("请求失败（" + res.status + "）"));
      err.status = res.status;
      throw err;
    }
    return data;
  }

  // ---------- 对外操作 ----------
  async function createAccount(pin) {
    const prof = (typeof Progress !== "undefined" && Progress.getCurrentProfile) ? Progress.getCurrentProfile() : null;
    const data = await apiCall("/account", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ action: "create", pin: pin || "", nickname: prof ? prof.name : "", avatar: prof ? prof.emoji : "" })
    });
    state.code = data.code; state.pin = pin || ""; state.accountId = data.accountId;
    state.rev = 0; state.hasPin = !!data.hasPin;
    state.nickname = prof ? prof.name : ""; state.avatar = prof ? prof.emoji : "";
    saveState();
    await pushChanges();          // 把本机已有作品先传上去
    return data.code;
  }

  async function login(code, pin) {
    const data = await apiCall("/account", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ action: "login", code: code, pin: pin || "" })
    });
    state.code = code.replace(/[^0-9A-Za-z]/g, "").toUpperCase();
    state.pin = pin || ""; state.accountId = data.accountId; state.hasPin = !!data.hasPin;
    state.nickname = data.nickname || ""; state.avatar = data.avatar || "";
    state.rev = 0;
    saveState();
    lastSent = {}; saveSent();
    const pulled = await pullChanges(true);
    refreshUI(pulled);
    await pushChanges();          // 本机独有、云端没有的内容补传
    return data;
  }

  async function setPin(newPin) {
    const data = await apiCall("/account", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ action: "setpin", code: state.code, pin: state.pin, newPin: newPin })
    });
    state.pin = newPin; state.hasPin = !!data.hasPin; saveState();
    return state.hasPin;
  }

  async function rotateCode() {
    const data = await apiCall("/account", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ action: "rotate", code: state.code, pin: state.pin })
    });
    state.code = data.code; saveState();
    return data.code;
  }

  function signOutLocal() {
    state.code = ""; state.pin = ""; state.accountId = ""; state.rev = 0; state.hasPin = false;
    saveState();
    lastSent = {}; saveSent();
    notify();
  }

  async function pushChanges() {
    if (!isSignedIn() || busy) return 0;
    busy = true;
    setStatus("syncing");
    try {
      const changes = collectChanges();
      const n = countRows(changes);
      if (n === 0) { setStatus("ok"); busy = false; return 0; }
      const data = await apiCall("/sync", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ code: state.code, pin: state.pin, changes: changes })
      });
      state.rev = data.rev || state.rev;
      saveState();
      saveSent();
      lastSyncAt = Date.now();
      setStatus("ok", "");
      busy = false;
      return n;
    } catch (e) {
      busy = false;
      setStatus("error", String(e.message || e));
      throw e;
    }
  }

  async function pullChanges(full) {
    if (!isSignedIn()) return {};
    const since = full ? 0 : (state.rev || 0);
    const q = "/sync?code=" + encodeURIComponent(state.code) + "&pin=" + encodeURIComponent(state.pin || "") + "&since=" + since;
    const data = await apiCall(q, { method: "GET" });
    const touched = applyPull(data);
    state.rev = data.rev || state.rev;
    state.hasPin = !!data.hasPin;
    if (data.nickname) state.nickname = data.nickname;
    if (data.avatar) state.avatar = data.avatar;
    saveState();
    saveSent();
    lastSyncAt = Date.now();
    setStatus("ok", "");
    return touched;
  }

  async function syncNow(silent) {
    if (!isSignedIn() || busy) return;
    if (!navigator.onLine) { setStatus("error", "现在没有网络，等联网后会自动同步"); return; }
    try {
      if (!silent) setStatus("syncing");
      const touched = await pullChanges(false);
      refreshUI(touched);
      await pushChanges();
    } catch (e) { /* 状态已在内部设置 */ }
  }

  function noteDirty() {
    if (!isSignedIn()) return;
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => { timer = null; syncNow(true); }, DEBOUNCE_MS);
  }

  // ---------- 顶栏：头像 + 昵称 + 云状态 ----------
  function renderChip() {
    const avatar = document.getElementById("userAvatar");
    const name = document.getElementById("userName");
    const dot = document.getElementById("cloudDot");
    if (!avatar) return;
    const prof = (typeof Progress !== "undefined" && Progress.getCurrentProfile) ? Progress.getCurrentProfile() : null;
    avatar.textContent = prof ? prof.emoji : "🐼";
    if (name) name.textContent = prof ? prof.name : "小朋友";
    if (dot) {
      const map = { idle: "⚪", syncing: "🟡", ok: "🟢", error: "🔴" };
      dot.textContent = isSignedIn() ? (map[status] || "⚪") : "☁️";
      dot.title = isSignedIn()
        ? (status === "error"
            ? ("同步出问题了：" + lastError)
            : (lastSyncAt ? ("上次同步 " + new Date(lastSyncAt).toLocaleTimeString("zh-CN")) : "还没同步过"))
        : "还没有开启云同步，点我看看";
    }
    const pa = document.getElementById("panelAvatar");
    const pn = document.getElementById("panelName");
    const pd = document.getElementById("panelCloudDot");
    if (pa) pa.textContent = prof ? prof.emoji : "🐼";
    if (pn) pn.textContent = prof ? prof.name : "小朋友";
    if (pd) {
      const map2 = { idle: "⚪", syncing: "🟡", ok: "🟢", error: "🔴" };
      pd.textContent = isSignedIn() ? (map2[status] || "⚪") : "☁️";
    }
    const chip = document.getElementById("btnUserChip");
    if (chip) {
      chip.title = (prof ? prof.name : "小朋友") + " · " + (isSignedIn() ? "已开启云同步" : "未开启云同步") + " · 点我打开云同步";
    }
  }

  // ---------- 云同步面板 ----------
  function esc(s) {
    return String(s === undefined || s === null ? "" : s).replace(/[&<>"]/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;" }[c];
    });
  }

  function statusLine() {
    if (status === "syncing") return "🟡 正在同步…";
    if (status === "error") return "🔴 " + esc(lastError || "同步失败");
    if (lastSyncAt) return "🟢 上次同步：" + new Date(lastSyncAt).toLocaleTimeString("zh-CN");
    return "⚪ 还没同步过";
  }

  function openPanel() {
    renderPanel();
    const m = document.getElementById("cloudModal");
    if (m) m.classList.add("active");
  }

  function closePanel() {
    const m = document.getElementById("cloudModal");
    if (m) m.classList.remove("active");
  }

  function renderPanel() {
    const body = document.getElementById("cloudBody");
    if (!body) return;
    const prof = (typeof Progress !== "undefined" && Progress.getCurrentProfile) ? Progress.getCurrentProfile() : null;

    if (!isSignedIn()) {
      body.innerHTML =
        '<div class="cloud-alert">👋 还没有开启云同步：点下面的「生成同步码」一下就搞定，作品会自动传到云端，换电脑也能找回。</div>' +
        '<div class="cloud-hero"><div class="cloud-emoji">☁️</div><div>' +
        '<div class="cloud-title">把作品存到云端</div>' +
        '<div class="cloud-sub">换电脑、换浏览器，输入同步码就能找回全部作品和学习记录。不需要手机号，也不需要邮箱。</div></div></div>' +
        '<div class="cloud-block"><div class="cloud-block-title">① 第一次用：生成我的同步码</div>' +
        '<div class="cloud-row"><input class="modal-input" id="cloudPin" maxlength="6" placeholder="可选：4~6 位 PIN（防止别人乱用你的码）">' +
        '<button class="btn-run-magic" id="cloudCreate" style="white-space:nowrap;">生成同步码</button></div></div>' +
        '<div class="cloud-block"><div class="cloud-block-title">② 已有同步码：在这台设备上登录</div>' +
        '<div class="cloud-row"><input class="modal-input" id="cloudCode" maxlength="12" placeholder="输入同步码，例如 4K7F-P2M9">' +
        '<input class="modal-input" id="cloudPin2" maxlength="6" placeholder="PIN（没设过就留空）">' +
        '<button class="header-btn" id="cloudLogin">登录</button></div></div>' +
        '<div class="cloud-tip">💡 同步码只存在你的浏览器里，我们不知道你是谁。码弄丢了就用「📦 打包下载」的备份恢复。</div>';
    } else {
      body.innerHTML =
        '<div class="cloud-hero"><div class="cloud-emoji">' + esc(prof ? prof.emoji : "🐼") + '</div><div>' +
        '<div class="cloud-title">' + esc(prof ? prof.name : "小朋友") + ' 的云端空间</div>' +
        '<div class="cloud-sub">作品、文件夹、学习记录会自动同步，改完几秒钟就会上传。</div></div></div>' +
        '<div class="cloud-code-box"><div class="cloud-code-label">我的同步码（抄下来，换设备时用）</div>' +
        '<div class="cloud-code">' + esc(state.code) + '</div>' +
        '<div class="cloud-row"><button class="header-btn" id="cloudCopy">📋 复制同步码</button>' +
        '<button class="header-btn" id="cloudSyncNow">🔄 立即同步</button>' +
        '<button class="header-btn" id="cloudRotate">♻️ 换一个新码</button>' +
        '<button class="header-btn" id="cloudSignOut">🚪 本机退出</button></div></div>' +
        '<div class="cloud-block"><div class="cloud-block-title">PIN（可选，' + (state.hasPin ? "已设置" : "未设置") + '）</div>' +
        '<div class="cloud-row"><input class="modal-input" id="cloudNewPin" maxlength="6" placeholder="4~6 位数字，留空表示取消 PIN">' +
        '<button class="header-btn" id="cloudSavePin">保存</button></div></div>' +
        '<div class="cloud-status">' + statusLine() + '</div>';
    }
    bindPanelEvents();
  }

  function bindPanelEvents() {
    const on = (id, fn) => { const el = document.getElementById(id); if (el) el.addEventListener("click", fn); };
    const toast = (msg, icon) => { if (window.App && window.App.showToast) window.App.showToast(msg, icon); };

    on("cloudCreate", async () => {
      const pin = (document.getElementById("cloudPin") || {}).value || "";
      try {
        const code = await createAccount(pin);
        renderPanel(); renderChip();
        toast("☁️ 云同步已开启，同步码：" + code, "☁️");
      } catch (e) { toast("开启失败：" + e.message, "⚠️"); }
    });

    on("cloudLogin", async () => {
      const code = (document.getElementById("cloudCode") || {}).value || "";
      const pin = (document.getElementById("cloudPin2") || {}).value || "";
      if (!code.trim()) { toast("先输入同步码哦", "⚠️"); return; }
      try {
        await login(code, pin);
        renderPanel(); renderChip();
        toast("🎉 登录成功，作品已同步过来", "☁️");
      } catch (e) { toast(e.message, "⚠️"); }
    });

    on("cloudCopy", () => {
      const text = state.code;
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(() => toast("同步码已复制", "📋"))
          .catch(() => toast("复制失败，请手动抄一下：" + text, "📋"));
      } else {
        toast("请手动抄一下：" + text, "📋");
      }
    });

    on("cloudSyncNow", async () => {
      toast("正在同步…", "🔄");
      await syncNow(false);
      renderPanel(); renderChip();
      toast(status === "ok" ? "🟢 同步完成" : ("同步失败：" + lastError), status === "ok" ? "☁️" : "⚠️");
    });

    on("cloudRotate", () => {
      if (!window.App || !App.showConfirmModal) return;
      App.showConfirmModal("♻️ 换一个新的同步码？",
        "旧码会立刻失效，需要用新码在其他设备上重新登录。<br>作品和学习记录都不会丢。",
        async () => {
          try { const nc = await rotateCode(); renderPanel(); toast("新同步码：" + nc, "♻️"); }
          catch (e) { toast("换码失败：" + e.message, "⚠️"); }
        });
    });

    on("cloudSignOut", () => {
      if (!window.App || !App.showConfirmModal) return;
      App.showConfirmModal("🚪 在这台设备上退出云同步？",
        "本机作品不会被删除，只是不再自动上传；随时可以用同步码再登录。",
        () => { signOutLocal(); renderPanel(); renderChip(); toast("已退出云同步（本机作品都还在）", "🚪"); });
    });

    on("cloudSavePin", async () => {
      const v = ((document.getElementById("cloudNewPin") || {}).value || "").replace(/[^0-9]/g, "");
      try {
        const has = await setPin(v);
        renderPanel();
        toast(has ? "PIN 已保存" : "已取消 PIN", "🔒");
      } catch (e) { toast("保存失败：" + e.message, "⚠️"); }
    });
  }

  // ================= 分享（作品短链 / 学习进度只读页） =================
  async function shareCurrentFile() {
    if (!isSignedIn()) throw new Error("先开启云同步才能生成短链哦");
    const file = (typeof FileManager !== "undefined") ? FileManager.getActiveFile() : null;
    if (!file) throw new Error("先打开一个作品吧");
    const content = (typeof CodeEditor !== "undefined" && CodeEditor.getValue) ? CodeEditor.getValue() : (file.content || "");
    const data = await apiCall("/share", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ code: state.code, pin: state.pin, kind: "code", title: file.name.replace(/\.py$/, ""), content: content, profileId: currentProfileId() })
    });
    return data.url;
  }

  async function shareProgress() {
    if (!isSignedIn()) throw new Error("先开启云同步才能分享进度哦");
    const prof = (typeof Progress !== "undefined" && Progress.getCurrentProfile) ? Progress.getCurrentProfile() : null;
    const stats = (typeof Progress !== "undefined" && Progress.getStats) ? Progress.getStats() : {};
    const missions = (typeof Progress !== "undefined" && Progress.getMissions) ? Progress.getMissions() : [];
    const badges = (typeof Progress !== "undefined" && Progress.getBadges) ? Progress.getBadges() : [];
    const data = await apiCall("/share", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        code: state.code, pin: state.pin, kind: "progress", profileId: currentProfileId(),
        title: (prof ? prof.name : "小朋友") + " 的学习进度",
        progress: { nickname: prof ? prof.name : "小朋友", avatar: prof ? prof.emoji : "🐼", stats: stats, missions: missions, badges: badges }
      })
    });
    return data.url;
  }

  async function copyText(text) {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) { await navigator.clipboard.writeText(text); return true; }
    } catch (e) {}
    try {
      const ta = document.createElement("textarea");
      ta.value = text; ta.style.position = "fixed"; ta.style.opacity = "0";
      document.body.appendChild(ta); ta.select();
      const ok = document.execCommand("copy");
      document.body.removeChild(ta);
      return ok;
    } catch (e) { return false; }
  }

  function renderShareTab() {
    const box = document.getElementById("shareBody");
    if (!box) return;
    const toast = (msg, icon) => { if (window.App && window.App.showToast) window.App.showToast(msg, icon); };

    box.innerHTML =
      '<div class="share-block"><div class="share-block-title">📤 分享我的作品</div>' +
      '<div class="share-block-sub">生成一条短链接（<code>/s/xxxx</code>），同学打开就能看代码，还能一键在萌码里打开继续改。</div>' +
      '<div class="cloud-row"><button class="btn-run-magic" id="shareFileBtn" style="padding:7px 16px;font-size:13px;">生成作品短链</button></div>' +
      '<div id="shareFileResult"></div></div>' +
      '<div class="share-block"><div class="share-block-title">🎓 把学习进度给家长 / 老师看</div>' +
      '<div class="share-block-sub">生成一个<b>只读</b>页面：能看到运行次数、完成任务、获得的徽章，不能修改作品。</div>' +
      '<div class="cloud-row"><button class="header-btn" id="shareProgressBtn">生成进度链接</button></div>' +
      '<div id="shareProgressResult"></div></div>' +
      (isSignedIn() ? "" : '<div class="share-empty">💡 分享需要先开启云同步（在「☁️ 云同步」标签页里一键开启）</div>');

    const fileBtn = document.getElementById("shareFileBtn");
    if (fileBtn) {
      fileBtn.addEventListener("click", async () => {
        try {
          const url = await shareCurrentFile();
          const ok = await copyText(url);
          document.getElementById("shareFileResult").innerHTML = '<div class="share-link-box">' + esc(url) + '</div>';
          toast(ok ? "作品短链已复制，发给同学吧！" : "短链已生成，请手动复制", "🔗");
        } catch (e) { toast(e.message, "⚠️"); }
      });
    }
    const progBtn = document.getElementById("shareProgressBtn");
    if (progBtn) {
      progBtn.addEventListener("click", async () => {
        try {
          const url = await shareProgress();
          const ok = await copyText(url);
          document.getElementById("shareProgressResult").innerHTML = '<div class="share-link-box">' + esc(url) + '</div>';
          toast(ok ? "进度链接已复制，发给家长看看！" : "进度链接已生成，请手动复制", "🎓");
        } catch (e) { toast(e.message, "⚠️"); }
      });
    }
  }

  return {
    init() {
      load();
      notify();
      if (isSignedIn()) setTimeout(() => syncNow(true), 1500);
      if (typeof FileManager !== "undefined" && FileManager.onChange) FileManager.onChange(() => noteDirty());
      window.addEventListener("online", () => { if (isSignedIn()) syncNow(true); });
    },
    isSignedIn, getStatus, createAccount, login, setPin, rotateCode, signOutLocal,
    syncNow, noteDirty, openPanel, closePanel, renderPanel, renderChip, renderShareTab,
    shareCurrentFile, shareProgress, copyText,
    onStatus(fn) { listeners.push(fn); },
    getCode() { return state.code; }
  };
})();
