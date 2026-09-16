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
    // 老版本会在「请求发出去之前」就记账，可能把根本没传上去的行记成已传。
    // 升级后清一次记账 + 游标归零，强制完整同步一遍，把这笔糊涂账抹掉。
    if (state.version !== STATE_VERSION) {
      lastSent = {};
      state.rev = 0;
      state.version = STATE_VERSION;
      saveState();
      saveSent();
      console.info("云同步：同步状态已升级，将重新完整同步一次");
    }
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
      signedIn: isSignedIn(), status: status, error: lastError, lastSyncAt: lastSyncAt, dirty: dirtyCount > 0,
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

  // 学堂草稿：在做题 / 上课 / 看示例时写的代码（{ id: {code, at} }）
  const DRAFTS_PREFIX = "codepanda_learn_drafts_v1__";
  function draftsKey(pid) { return DRAFTS_PREFIX + pid; }
  function readDrafts(pid) { return readJson(draftsKey(pid), null); }
  function writeDrafts(pid, obj) { writeJson(draftsKey(pid), obj); }

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

  // ================= 同步核心（只有四条规则） =================
  //   ① 推送：上次成功同步后被改过的行 → 推上去（服务端按 updated_at 做行级 LWW）
  //   ② 拉取：本地改过的行「不被覆盖」，等下一轮推送；本地没改过的行用云端版本覆盖
  //   ③ 学习记录是累加型数据 → 不覆盖，只做并集合并（两台设备各做一半时谁都不丢）
  //   ④ lastSent 只在推送成功后记账；同步中再有改动就补跑一轮；失败退避重试
  const STATE_VERSION = 2;      // 老版本「发请求前就记账」有 bug，升级后强制重新同步一次

  let dirty = false;
  let syncing = false;
  let scheduled = false;        // 已经排好「补跑」的那一轮
  let dirtyCount = 0;            // 本机有多少处改动还没同步（只用来显示「未同步」）
  const idleWaiters = [];       // 等「这一轮真的跑完」的人（手动同步按钮 / 测试用）
  let clockOffset = 0;          // 服务端时间 - 本地时间，让多台设备的时间戳对齐
  let skippedNote = "";         // 有文件太大没传上去时的说明

  function serverNow() { return Date.now() + clockOffset; }

  function isIdle() { return !syncing && !dirty && !scheduled; }

  function releaseIdleWaiters() {
    if (!isIdle()) return;
    const list = idleWaiters.splice(0);
    list.forEach((fn) => { try { fn(); } catch (e) {} });
  }

  function whenIdle() {
    if (isIdle()) return Promise.resolve();
    return new Promise((resolve) => { idleWaiters.push(resolve); });
  }

  function syncClock(serverTime) {
    if (typeof serverTime === "number" && serverTime > 0) clockOffset = serverTime - Date.now();
  }

  // ---------- 每行的「内容签名」：推送和拉取必须用同一个算法，否则会来回重推 ----------
  function sigProfile(p) { return JSON.stringify([p.name, p.emoji || ""]); }
  function sigFolder(f) {
    return JSON.stringify([f.name, f.emoji || "", f.builtin ? 1 : 0, f.keep ? 1 : 0, Number(f.position) || 0]);
  }
  // 文件夹要归一化：老数据 / 老客户端推上来的行 folder_id 可能是空的，
  // 而本地 FileManager 的 ensureFolders() 会把它补成默认文件夹「我的作品」。
  // 如果两边算出来的签名不一致，这台设备就会永远认为"本地改过"，
  // 于是云端对这个文件的更新每次都被跳过 —— 表现就是"改了文件在别的设备上永远看不到"。
  const DEFAULT_FOLDER_ID = "f_mine";
  function folderOf(f) {
    const id = f.folderId || f.folder_id || "";
    return id || DEFAULT_FOLDER_ID;
  }
  function sigFile(f) { return JSON.stringify([f.name, folderOf(f), f.content || ""]); }
  function sigStats(st) { return JSON.stringify(st || {}); }
  function sigVfs(text) { return JSON.stringify(text || ""); }
  function sigDraft(code) { return JSON.stringify(code || ""); }

  // 墓碑只需要记住「这一行是谁」，不要把文件内容也存进同步状态
  function tombRow(row) {
    const out = {};
    ["id", "profile_id", "path", "name", "folder_id", "draft_id"].forEach(k => {
      if (row && row[k] !== undefined && row[k] !== null && row[k] !== "") out[k] = row[k];
    });
    return out;
  }

  // ---------- 学习记录合并（唯一的「合并」：累加型数据覆盖任何一边都会丢） ----------
  const STATS_MAX = ["runs", "successes", "turtleRuns", "vfsFiles", "longestCode", "xp",
    "quizCorrect", "bestCombo", "firstTry", "solveDayMax", "lessonDayMax", "dailyDone",
    "dailyFull", "turtleSaves", "nightRuns", "earlyRuns", "streak", "bestStreak", "lessonRuns"];
  const STATS_SET = ["days", "badges", "packages", "medals"];                                    // 数组并集
  // 映射：键并集、值取大。必须幂等 —— 每次拉取都会合并一次，相加会越合越多
  const STATS_FLAG = ["missions", "lessons", "solved", "tried", "levelSolved", "lessonStage", "skill"];
  const STATS_DATE = ["lastRunDate", "lastStreakDate", "lessonDay", "solveDay"];                 // 字符串日期取较晚的

  function asArray(v) { return Array.isArray(v) ? v : []; }
  function asMap(v) { return (v && typeof v === "object") ? v : {}; }

  function mergeStats(local, remote) {
    const a = local || {};
    const b = remote || {};
    const out = Object.assign({}, b, a);

    STATS_MAX.forEach(k => { out[k] = Math.max(Number(a[k]) || 0, Number(b[k]) || 0); });

    STATS_SET.forEach(k => {
      const set = {};
      asArray(b[k]).forEach(v => { set[v] = 1; });
      asArray(a[k]).forEach(v => { set[v] = 1; });
      out[k] = Object.keys(set);
    });

    STATS_FLAG.forEach(k => {
      const ma = asMap(a[k]);
      const mb = asMap(b[k]);
      const m = Object.assign({}, mb);
      Object.keys(ma).forEach(key => {
        const x = ma[key];
        const y = m[key];
        if (typeof x === "number" || typeof y === "number") m[key] = Math.max(Number(x) || 0, Number(y) || 0);
        else m[key] = x || y;
      });
      out[k] = m;
    });

    STATS_DATE.forEach(k => {
      const x = String(a[k] || "");
      const y = String(b[k] || "");
      out[k] = x > y ? x : y;
    });

    // 考试记录：按时间合并去重
    const exams = {};
    asArray(a.exams).concat(asArray(b.exams)).forEach(e => {
      if (!e || typeof e !== "object") return;
      exams[String(e.at || 0) + "|" + (e.level || 0)] = e;
    });
    out.exams = Object.keys(exams).map(k => exams[k]).sort((x, y) => (x.at || 0) - (y.at || 0)).slice(-60);

    // 每日任务：同一天就合并进度，不同天取较晚的那天
    const da = asMap(a.daily);
    const db = asMap(b.daily);
    if (String(db.date || "") > String(da.date || "")) out.daily = db;
    else if (String(da.date || "") > String(db.date || "")) out.daily = da;
    else {
      const progress = Object.assign({}, asMap(db.progress));
      Object.keys(asMap(da.progress)).forEach(k => {
        progress[k] = Math.max(Number(progress[k]) || 0, Number(da.progress[k]) || 0);
      });
      const done = {};
      asArray(da.done).forEach(v => { done[v] = 1; });
      asArray(db.done).forEach(v => { done[v] = 1; });
      out.daily = { date: da.date || db.date || "", progress: progress, done: Object.keys(done) };
    }

    return out;
  }

  // ---------- 收集本地所有行（纯函数：不改任何状态，改完状态放在 commitSent） ----------
  function collectChanges() {
    const t = serverNow();
    const changes = { profiles: [], folders: [], files: [], progress: [], vfs: [], learn: [] };
    const sent = [];                    // 成功之后才写进 lastSent
    const seen = {};

    const add = (bucket, key, sig, row) => {
      seen[key] = 1;
      const h = hash(sig);
      const prev = lastSent[key];
      if (prev && prev.h === h) return;                  // 上次同步后没变过
      changes[bucket].push(Object.assign({ updated_at: t }, row));
      sent.push({ key: key, h: h, row: tombRow(row) });
    };

    const profiles = readProfiles();
    profiles.forEach(p => {
      add("profiles", "profile|" + p.id, sigProfile(p), { id: p.id, name: p.name, emoji: p.emoji || "" });
    });

    profiles.forEach(p => {
      const ws = readWorkspace(p.id);
      if (ws) {
        (ws.folders || []).forEach(f => {
          add("folders", "folder|" + f.id, sigFolder(f), {
            id: f.id, profile_id: p.id, name: f.name, emoji: f.emoji || "",
            builtin: f.builtin ? 1 : 0, keep: f.keep ? 1 : 0, position: f.position || 0
          });
        });
        (ws.files || []).forEach(f => {
          add("files", "file|" + f.id, sigFile(f), {
            id: f.id, profile_id: p.id, folder_id: f.folderId || "", name: f.name, content: f.content || ""
          });
        });
      }
      const st = readStats(p.id);
      if (st) {
        add("progress", "progress|" + p.id, sigStats(st), { profile_id: p.id, stats: st });
      }
    });

    // 学堂草稿：孩子的练习答案也在里面，必须一起同步（以前只存本机，换设备就没了）
    profiles.forEach(p => {
      const drafts = readDrafts(p.id);
      if (!drafts) return;
      Object.keys(drafts).forEach(id => {
        const code = (drafts[id] && drafts[id].code) || "";
        add("learn", "learn|" + p.id + "|" + id, sigDraft(code), {
          profile_id: p.id, draft_id: id, code: code
        });
      });
    });

    const pid = currentProfileId();
    readVfs().forEach(v => {
      add("vfs", "vfs|" + pid + "|" + v.path, sigVfs(v.text), { profile_id: pid, path: v.path, text: v.text || "" });
    });

    // 墓碑：上次发过、这次本地已经没有的行
    const tombstones = [];                 // 待发墓碑的行键：拉取时要保护它们，见 syncNow
    Object.keys(lastSent).forEach(key => {
      if (seen[key]) return;
      // vfs 只同步「当前档案」的数据文件：切换档案时不能把别的档案当成已删除推上去
      if (key.indexOf("vfs|") === 0 && key.indexOf("vfs|" + pid + "|") !== 0) return;
      tombstones.push(key);
      const row = lastSent[key].row || {};
      const t2 = serverNow();
      if (key.indexOf("file|") === 0) {
        changes.files.push({ id: row.id, profile_id: row.profile_id, folder_id: row.folder_id || "", name: row.name || "", content: "", updated_at: t2, deleted: 1 });
      } else if (key.indexOf("folder|") === 0) {
        changes.folders.push({ id: row.id, profile_id: row.profile_id, name: row.name || "", emoji: row.emoji || "", updated_at: t2, deleted: 1 });
      } else if (key.indexOf("profile|") === 0) {
        changes.profiles.push({ id: row.id, name: row.name || "小朋友", emoji: row.emoji || "", updated_at: t2, deleted: 1 });
      } else if (key.indexOf("vfs|") === 0) {
        changes.vfs.push({ profile_id: row.profile_id, path: row.path, text: "", updated_at: t2 });
      } else if (key.indexOf("learn|") === 0) {
        changes.learn.push({ profile_id: row.profile_id, draft_id: row.draft_id, code: "", updated_at: t2, deleted: 1 });
      }
      sent.push({ key: key, h: "tombstone", row: null });   // 墓碑发成功后就别再发了
    });

    return { changes: changes, sent: sent, tombstones: tombstones };
  }

  // 只有服务器确认收到之后，才把这些行的哈希记下来（失败就原样重发，服务端 LWW 幂等）
  function commitSent(sent) {
    sent.forEach(item => {
      if (item.row) lastSent[item.key] = { h: item.h, t: serverNow(), row: item.row };
      else delete lastSent[item.key];
    });
    saveSent();
  }

  function countRows(c) {
    return (c.profiles || []).length + (c.folders || []).length + (c.files || []).length +
      (c.progress || []).length + (c.vfs || []).length + (c.learn || []).length;
  }

  // 本地这行在「上次成功同步」之后被改过吗？
  //   cloudWins=true（登录新设备）：云端是权威，本地旧数据让位（学习记录仍然走并集）
  //   默认：本地改过就保留本地，等下一轮推送去和服务端比时间
  function localChanged(key, sig, cloudWins) {
    if (cloudWins) return false;
    const prev = lastSent[key];
    if (!prev) return true;                 // 本地有、从没同步过 → 别丢孩子的东西
    return prev.h !== hash(sig);
  }

  // ---------- 应用远端数据（按行合并，不整体覆盖） ----------
  function applyPull(data, opts) {
    const cloudWins = !!(opts && opts.cloudWins);
    // 本地删掉、墓碑还没推上去的行（见 syncNow 里的 pending）：
    // 云端那份「还没删除」的旧行不能把它们复活，否则删除动作永远发不出去
    const protect = (opts && opts.protect) || null;
    const touchedProfiles = {};
    let localOnly = 0;                      // 本地有、云端也有、但本地更新 → 等推送

    (data.profiles || []).forEach(p => {
      const list = readProfiles();
      const i = list.findIndex(x => x.id === p.id);
      const key = "profile|" + p.id;
      const local = i === -1 ? null : list[i];
      if (i === -1 && !p.deleted && protect && protect[key]) { localOnly++; return; }
      if (local && localChanged(key, sigProfile(local), cloudWins)) { localOnly++; return; }
      if (p.deleted) { if (i !== -1) list.splice(i, 1); }
      else {
        const row = { id: p.id, name: p.name, emoji: p.emoji || "🐼", createdAt: p.updated_at };
        if (i === -1) list.push(row); else list[i] = Object.assign({}, list[i], row);
      }
      writeProfiles(list);
      touchedProfiles[p.id] = 1;
      // 云端已经是墓碑的行不用记账：记了下一轮会被当成「本地新删除」再推一次，永远推不完
      if (p.deleted) delete lastSent[key];
      else lastSent[key] = { h: hash(sigProfile(p)), t: p.updated_at, row: tombRow(p) };
    });

    (data.folders || []).forEach(f => {
      const ws = readWorkspace(f.profile_id) || { folders: [], files: [], collapsed: {} };
      ws.folders = ws.folders || [];
      const i = ws.folders.findIndex(x => x.id === f.id);
      const key = "folder|" + f.id;
      if (i === -1 && !f.deleted && protect && protect[key]) { localOnly++; return; }
      if (i !== -1 && localChanged(key, sigFolder(ws.folders[i]), cloudWins)) { localOnly++; return; }
      if (f.deleted) { if (i !== -1) ws.folders.splice(i, 1); }
      else {
        const row = { id: f.id, name: f.name, emoji: f.emoji || "📁", builtin: !!f.builtin, keep: !!f.keep, position: f.position || 0 };
        if (i === -1) ws.folders.push(row); else ws.folders[i] = Object.assign({}, ws.folders[i], row);
      }
      writeWorkspace(f.profile_id, ws);
      touchedProfiles[f.profile_id] = 1;
      if (f.deleted) delete lastSent[key];
      else lastSent[key] = { h: hash(sigFolder(f)), t: f.updated_at, row: tombRow(f) };
    });

    (data.files || []).forEach(f => {
      const ws = readWorkspace(f.profile_id) || { folders: [], files: [], collapsed: {} };
      ws.files = ws.files || [];
      const i = ws.files.findIndex(x => x.id === f.id);
      const key = "file|" + f.id;
      if (i === -1 && !f.deleted && protect && protect[key]) { localOnly++; return; }
      if (i !== -1 && localChanged(key, sigFile(ws.files[i]), cloudWins)) { localOnly++; return; }
      if (f.deleted) { if (i !== -1) ws.files.splice(i, 1); }
      else {
        const row = { id: f.id, name: f.name, content: f.content || "", folderId: folderOf(f) };
        if (i === -1) ws.files.push(row); else ws.files[i] = Object.assign({}, ws.files[i], row);
      }
      writeWorkspace(f.profile_id, ws);
      touchedProfiles[f.profile_id] = 1;
      // 云端墓碑不记账（否则每轮同步都会把它当成「本地新删除」再推一次，rev 无限上涨）
      if (f.deleted) delete lastSent[key];
      else lastSent[key] = { h: hash(sigFile(f)), t: f.updated_at, row: tombRow(f) };
    });

    (data.progress || []).forEach(p => {
      let remote = {};
      try { remote = JSON.parse(p.stats_json || "{}"); } catch (e) { remote = {}; }
      const key = "progress|" + p.profile_id;
      const local = readStats(p.profile_id) || {};
      // 学习记录永远不覆盖：本地 ∪ 云端
      const merged = cloudWins ? mergeStats(remote, local) : mergeStats(local, remote);
      writeStats(p.profile_id, merged);
      touchedProfiles[p.profile_id] = 1;
      if (sigStats(merged) !== sigStats(remote)) {
        // 本地有云端没有的记录 → 清掉记账，下一轮推上去，让云端也补全
        delete lastSent[key];
        localOnly++;
      } else {
        lastSent[key] = { h: hash(sigStats(merged)), t: p.updated_at, row: { profile_id: p.profile_id } };
      }
    });

    // 学堂草稿：和文件一样，本地改过的保留，其余用云端版本
    (data.learn || []).forEach(d => {
      const drafts = readDrafts(d.profile_id) || {};
      const key = "learn|" + d.profile_id + "|" + d.draft_id;
      const local = drafts[d.draft_id];
      if (!local && !d.deleted && protect && protect[key]) { localOnly++; return; }
      if (local && localChanged(key, sigDraft(local.code), cloudWins)) { localOnly++; return; }
      if (d.deleted) delete drafts[d.draft_id];
      else drafts[d.draft_id] = { code: d.code || "", at: d.updated_at };
      writeDrafts(d.profile_id, drafts);
      touchedProfiles[d.profile_id] = 1;
      if (d.deleted) delete lastSent[key];
      else lastSent[key] = { h: hash(sigDraft(d.code)), t: d.updated_at, row: tombRow(d) };
    });
    // 草稿变了要让学堂里的界面也跟着刷新
    if (typeof Learn !== "undefined" && Learn.reloadDrafts) {
      try { Learn.reloadDrafts(); } catch (e) {}
    }

    const pid = currentProfileId();
    const vfs = readVfs();
    (data.vfs || []).forEach(v => {
      if (v.profile_id !== pid) return;      // 数据文件目前只同步当前档案
      const i = vfs.findIndex(x => x.path === v.path);
      const key = "vfs|" + pid + "|" + v.path;
      const text = v.text || "";
      // 空文本 = 删除墓碑；这里的 protect 装的是「本地删了、墓碑还没推上去」的行：
      // 远端这份还是活的（有内容）时不能把它拉回来，否则删除动作永远发不出去
      if (i === -1 && text && protect && protect[key]) { localOnly++; return; }
      if (i !== -1 && localChanged(key, sigVfs(vfs[i].text), cloudWins)) { localOnly++; return; }
      if (i === -1 && !text) {
        // 空文本是删除墓碑：本地本来就没有这个文件，别再凭空造一个空文件出来
        // （代价：别的设备上「真正的空文件」不会出现在这台设备，比"删了又回来"划算）
        delete lastSent[key];
        return;
      }
      if (i === -1) vfs.push({ path: v.path, text: text, updatedAt: v.updated_at });
      else vfs[i] = Object.assign({}, vfs[i], { text: text, updatedAt: v.updated_at });
      lastSent[key] = { h: hash(sigVfs(text)), t: v.updated_at, row: { profile_id: pid, path: v.path } };
    });
    writeVfs(vfs);

    return { touched: touchedProfiles, localOnly: localOnly };
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
    syncClock(data.serverTime);
    return data;
  }

  // ---------- 账号操作（同步码 = 账号 + 密码合体，服务端只存哈希） ----------
  async function createAccount(pin) {
    const prof = (typeof Progress !== "undefined" && Progress.getCurrentProfile) ? Progress.getCurrentProfile() : null;
    const data = await apiCall("/account", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ action: "create", pin: pin || "", nickname: prof ? prof.name : "", avatar: prof ? prof.emoji : "" })
    });
    state.code = data.code;
    state.pin = pin || "";
    state.accountId = data.accountId;
    state.rev = 0;
    state.hasPin = !!data.hasPin;
    state.nickname = prof ? prof.name : "";
    state.avatar = prof ? prof.emoji : "";
    saveState();
    dirty = true;
    await syncNow(true);            // 把本机已有的作品传上去
    return data.code;
  }

  async function login(code, pin) {
    const data = await apiCall("/account", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ action: "login", code: code, pin: pin || "" })
    });
    state.code = code.replace(/[^0-9A-Za-z]/g, "").toUpperCase();
    state.pin = pin || "";
    state.accountId = data.accountId;
    state.hasPin = !!data.hasPin;
    state.nickname = data.nickname || "";
    state.avatar = data.avatar || "";
    state.rev = 0;
    saveState();
    lastSent = {};
    saveSent();
    // 登录时「云端优先」：新设备上的默认数据不该反过来盖掉云端；
    // 但学习记录例外 —— 永远做并集，本机刚做的题不会丢
    const pulled = await pullChanges(true, { cloudWins: true });
    refreshUI(pulled.touched);
    dirty = true;
    await syncNow(true);            // 再推：本机独有、云端没有的内容补传
    return data;
  }

  async function setPin(newPin) {
    const data = await apiCall("/account", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ action: "setpin", code: state.code, pin: state.pin, newPin: newPin })
    });
    state.pin = newPin;
    state.hasPin = !!data.hasPin;
    saveState();
    return state.hasPin;
  }

  async function rotateCode() {
    const data = await apiCall("/account", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ action: "rotate", code: state.code, pin: state.pin })
    });
    state.code = data.code;
    saveState();
    return data.code;
  }

  function signOutLocal() {
    state.code = "";
    state.pin = "";
    state.accountId = "";
    state.rev = 0;
    state.hasPin = false;
    saveState();
    lastSent = {};
    saveSent();
    dirty = false;
    syncing = false;
    dirtyCount = 0;
    skippedNote = "";
    notify();
  }

  // ---------- 推送（成功才记账） ----------
  async function pushChanges() {
    if (!isSignedIn()) return { sent: 0, skipped: 0, dropped: 0 };
    const collected = collectChanges();
    const n = countRows(collected.changes);
    if (!n && !collected.sent.length) return { sent: 0, skipped: 0, dropped: 0 };
    const data = await apiCall("/sync", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ code: state.code, pin: state.pin, changes: collected.changes })
    });
    commitSent(collected.sent);            // ← 关键：只有服务器确认了才记账
    const dropped = data.dropped || {};
    const droppedN = Object.keys(dropped).reduce((n, k) => n + (Number(dropped[k]) || 0), 0);
    return { sent: collected.sent.length, skipped: data.skipped || 0, dropped: droppedN };
  }

  // ---------- 拉取（游标只在拉取成功后推进，避免漏掉别人在中间写的行） ----------
  async function pullChanges(full, opts) {
    if (!isSignedIn()) return { touched: {}, localOnly: 0 };
    const since = full ? 0 : (state.rev || 0);
    const q = "/sync?code=" + encodeURIComponent(state.code) + "&pin=" + encodeURIComponent(state.pin || "") + "&since=" + since;
    const data = await apiCall(q, { method: "GET" });
    const res = applyPull(data, opts);
    state.rev = data.rev || state.rev;
    state.hasPin = !!data.hasPin;
    if (data.nickname) state.nickname = data.nickname;
    if (data.avatar) state.avatar = data.avatar;
    saveState();
    saveSent();
    return res;
  }

  // ---------- 同步一轮：先拉后推（拉取时保护「待发墓碑」的行） ----------
  async function syncNow(silent) {
    if (!isSignedIn()) return false;
    // 正在同步：记下「还有改动」，并等这一轮 + 补跑那一轮真正结束再返回。
    // （以前这里直接 return，调用方会读到上一轮留下的旧状态，看起来像"同步成功了"）
    if (syncing) { dirty = true; await whenIdle(); return true; }
    if (typeof navigator !== "undefined" && navigator.onLine === false) {
      setStatus("error", "现在没有网络，等联网后会自动同步");
      return false;
    }
    syncing = true;
    dirty = false;
    if (!silent) setStatus("syncing");
    let ok = true;
    try {
      // ① 先算出「本地删掉了、墓碑还没推上去」的行，拉取时保护它们。
      //    同步是「先拉后推」：云端那份还没删除的旧行会在 applyPull 里把刚删掉的
      //    文件/文件夹/草稿重新拉回本机（删除动作永远发不出去）。
      const protect = {};
      collectChanges().tombstones.forEach(k => { protect[k] = 1; });
      // ② 先拉：把云端更新的合并进来（学习记录在这一步就并集好了；
      //    本地改过的行不会被覆盖，等下面推上去）
      const pulled = await pullChanges(false, { protect: protect });
      // ③ 再推：本机改过的、刚删掉的、以及并集出来的学习记录
      const pushed = await pushChanges();
      refreshUI(pulled.touched);
      lastSyncAt = Date.now();
      dirtyCount = 0;                       // 同步成功 → 本机没有未同步的改动了
      const droppedN = pushed.dropped || 0;
      if (pushed.skipped > 0) {
        skippedNote = "有 " + pushed.skipped + " 个内容太大（单个文件上限 256KB），没能上传";
        setStatus("warn", skippedNote);
      } else if (droppedN > 0) {
        skippedNote = "有 " + droppedN + " 行没能上传（大概率是本机档案和云端对不上）";
        setStatus("warn", skippedNote);
      } else {
        skippedNote = "";
        setStatus("ok", "");
      }
    } catch (e) {
      ok = false;
      const msg = String((e && e.message) || e);
      const friendly = /Failed to fetch|NetworkError|Load failed|network error|ERR_/i.test(msg)
        ? "网络不太好，没能同步。改动都还在本机，点一下「云同步」再试一次就行"
        : msg;
      setStatus("error", friendly);
    } finally {
      syncing = false;
      if (dirty) {                          // 同步期间又改了 → 标记为「还没同步」，等下次手动同步
        dirty = false;
        dirtyCount += 1;
      }
      releaseIdleWaiters();
    }
    return ok;
  }

  // 本机有改动 → 只做一件事：把状态标成「未同步」，等用户点同步。
  // （不做任何自动同步：不防抖、不定时、不后台重试 —— 按孩子和家长的心理模型，
  //   "我点它才同步"最可预期；也让「未同步」这个提示变得有意义）
  function noteDirty() {
    if (!isSignedIn()) return;
    dirty = true;
    dirtyCount += 1;
    if (syncing) return;
    // 只在状态「从别的变成未同步」时通知一次，避免每敲一个字都重算一遍
    if (status !== "dirty") setStatus(status === "error" ? "error" : "dirty", lastError);
  }

  // ---------- 顶栏：头像 + 昵称 + 云状态 ----------
  // 顶栏「云同步」按钮：显示状态，点一下立即同步
  function renderSyncButton() {
    const btn = document.getElementById("btnSyncNow");
    const dot = document.getElementById("syncDot");
    const label = document.getElementById("syncLabel");
    if (!btn || !dot || !label) return;
    const map3 = { idle: "⚪", syncing: "🟡", ok: "🟢", warn: "🟡", error: "🔴", dirty: "🟡" };
    if (!isSignedIn()) {
      dot.textContent = "☁️";
      label.textContent = "开启同步";
      btn.title = "还没有开启云同步：点我打开云同步面板";
      btn.classList.remove("is-ok", "is-warn", "is-error", "is-dirty");
      return;
    }
    dot.textContent = map3[status] || "⚪";
    label.textContent = status === "syncing" ? "同步中…"
      : status === "error" ? "同步失败"
      : status === "warn" ? "部分未传"
      : status === "dirty" ? "未同步"
      : "已同步";
    btn.title = statusLine() + "（点一下立即同步）";
    btn.classList.toggle("is-ok", status === "ok");
    btn.classList.toggle("is-warn", status === "syncing" || status === "warn");
    btn.classList.toggle("is-error", status === "error");
    btn.classList.toggle("is-dirty", status === "dirty");
  }

  function renderChip() {
    renderSyncButton();
    const avatar = document.getElementById("userAvatar");
    const name = document.getElementById("userName");
    const dot = document.getElementById("cloudDot");
    if (!avatar) return;
    const prof = (typeof Progress !== "undefined" && Progress.getCurrentProfile) ? Progress.getCurrentProfile() : null;
    avatar.textContent = prof ? prof.emoji : "🐼";
    if (name) name.textContent = prof ? prof.name : "小朋友";
    if (dot) {
      const map = { idle: "⚪", syncing: "🟡", ok: "🟢", warn: "🟡", error: "🔴", dirty: "🟡" };
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
      const map2 = { idle: "⚪", syncing: "🟡", ok: "🟢", warn: "🟡", error: "🔴", dirty: "🟡" };
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
    if (status === "dirty") return "🟡 本机有改动还没同步，点一下同步";
    if (status === "error") return "🔴 " + esc(lastError || "同步失败") + "（会自动重试）";
    if (status === "warn") return "🟡 " + esc(skippedNote || "同步完成，但有内容没能上传");
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
      await whenIdle();
      renderPanel(); renderChip();
      const st = getStatus();
      toast(st.status === "ok" ? "🟢 同步完成" : (st.status === "warn" ? ("🟡 " + (st.error || skippedNote)) : ("🔴 " + (st.error || "同步失败"))),
        st.status === "ok" ? "☁️" : "⚠️");
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

  // 未开启云同步时的就地提示条（比底部 toast 更显眼）
  function showNeedSyncNotice() {
    let el = document.getElementById("needSyncNotice");
    if (!el) {
      el = document.createElement("div");
      el.id = "needSyncNotice";
      el.className = "need-sync-notice";
      const head = document.querySelector(".filetree-panel .panel-header");
      if (head && head.parentNode) head.parentNode.insertBefore(el, head.nextSibling);
      else document.body.appendChild(el);
    }
    el.innerHTML = "<span>☁️ 分享要先开启云同步</span><button class=\"header-btn\" id=\"needSyncGo\" style=\"height:24px;padding:0 10px;font-size:12px;\">去开启</button>";
    el.style.display = "flex";
    const go = document.getElementById("needSyncGo");
    if (go) go.addEventListener("click", () => { el.style.display = "none"; openPanel(); });
    clearTimeout(showNeedSyncNotice._t);
    showNeedSyncNotice._t = setTimeout(() => { el.style.display = "none"; }, 12000);
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
      // 恢复联网时只把红点清掉，**不自动同步**（等用户点）
      window.addEventListener("online", () => {
        if (!isSignedIn()) return;
        if (status === "error") setStatus(dirtyCount ? "dirty" : "idle", "");
      });
    },
    isSignedIn, getStatus, createAccount, login, setPin, rotateCode, signOutLocal,
    syncNow, noteDirty, whenIdle, isIdle,
    /** 本机还有哪些内容没同步（给界面打标记用） */
    getPending() {
      const out = { files: {}, drafts: {}, count: 0 };
      if (!isSignedIn()) return out;
      try {
        const collected = collectChanges();
        (collected.changes.files || []).forEach(r => { if (r.id) out.files[r.id] = 1; });
        (collected.changes.learn || []).forEach(r => { if (r.draft_id) out.drafts[r.draft_id] = 1; });
        (collected.changes.profiles || []).forEach(r => { out.progress = true; });
        if ((collected.changes.progress || []).length) out.progress = true;
        out.count = countRows(collected.changes);
      } catch (e) { /* 计算失败不影响界面 */ }
      return out;
    },
    openPanel, closePanel, renderPanel, renderChip, renderShareTab, showNeedSyncNotice,
    shareCurrentFile, shareProgress, copyText,
    onStatus(fn) { listeners.push(fn); },
    getCode() { return state.code; }
  };
})();
