/**
 * 🌟 成长档案（多孩子档案 + 学习记录 + 闯关任务 + 成就徽章）
 * 所有数据保存在浏览器本地，按「小伙伴」分开存放，互不干扰。
 */
const Progress = (() => {
  const PROFILES_KEY = "codepanda_profiles_v1";
  const CURRENT_KEY = "codepanda_current_profile_v1";
  const STATS_PREFIX = "codepanda_stats_v1_";
  const EMOJIS = ["🐼", "🦊", "🐯", "🐰", "🐨", "🦄", "🐳", "🐙", "🦖", "🐝", "🐧", "🐵"];

  // ================= 闯关任务 =================
  const MISSIONS = [
    { id: "m_print",   emoji: "🗣️", title: "说出第一句魔法", hint: "用 print(\"你好\") 跟电脑打个招呼", check: (c, s) => /print\s*\(/.test(c.code) && c.success },
    { id: "m_var",     emoji: "📦", title: "会变的名字",     hint: "把东西装进变量，例如 名字 = \"小熊猫\"", check: (c, s) => /^[ \t]*[A-Za-z_]\w*[ \t]*=[^=]/m.test(c.code) && c.success },
    { id: "m_loop",    emoji: "🔁", title: "重复的力量",     hint: "用 for i in range(3): 让电脑重复做事", check: (c, s) => /^[ \t]*for\s+.+:/m.test(c.code) && c.success },
    { id: "m_if",      emoji: "🤔", title: "会思考的程序",   hint: "用 if 判断让程序自己选一条路走", check: (c, s) => /^[ \t]*if\s+.+:/m.test(c.code) && c.success },
    { id: "m_input",   emoji: "💬", title: "和我聊天",       hint: "用 input(\"你叫什么名字？\") 让程序提问", check: (c, s) => /input\s*\(/.test(c.code) && c.success },
    { id: "m_turtle",  emoji: "🐢", title: "海龟画家",       hint: "import turtle 后让小海龟画几笔", check: (c, s) => !!c.turtle && c.success },
    { id: "m_random",  emoji: "🎲", title: "幸运抽奖",       hint: "用 random.randint(1, 6) 掷个骰子", check: (c, s) => /random\s*\./.test(c.code) && c.success },
    { id: "m_list",    emoji: "🎒", title: "收进百宝箱",     hint: "用列表存东西，例如 水果 = [\"苹果\", \"香蕉\"]", check: (c, s) => /=\s*\[[^\]]*\]/.test(c.code) && c.success },
    { id: "m_def",     emoji: "🧩", title: "我的积木",       hint: "用 def 定义属于自己的函数积木", check: (c, s) => /^[ \t]*def\s+\w+/m.test(c.code) && c.success },
    { id: "m_numpy",   emoji: "🧮", title: "数学小助手",     hint: "试试 import numpy 让电脑算得更快", check: (c, s) => (s.packages || []).indexOf("numpy") !== -1 },
    { id: "m_file",    emoji: "💾", title: "数据保管员",     hint: "用 open(\"日记.txt\", \"w\") 把文字存进文件", check: (c, s) => (s.vfsFiles || 0) > 0 },
    { id: "m_ten",     emoji: "🔟", title: "练习十次",       hint: "累计成功运行 10 次代码", check: (c, s) => (s.successes || 0) >= 10 }
  ];

  // ================= 成就徽章 =================
  const BADGES = [
    { id: "b_first_run",  emoji: "🚀", title: "第一次运行",   got: s => (s.runs || 0) >= 1 },
    { id: "b_first_ok",   emoji: "🎯", title: "第一次成功",   got: s => (s.successes || 0) >= 1 },
    { id: "b_run10",      emoji: "🔁", title: "运行 10 次",   got: s => (s.runs || 0) >= 10 },
    { id: "b_ok20",       emoji: "💯", title: "成功 20 次",   got: s => (s.successes || 0) >= 20 },
    { id: "b_turtle",     emoji: "🐢", title: "海龟小画家",   got: s => (s.turtleRuns || 0) >= 1 },
    { id: "b_turtle5",    emoji: "🎨", title: "画画达人",     got: s => (s.turtleRuns || 0) >= 5 },
    { id: "b_mission5",   emoji: "📚", title: "闯关小能手",   got: s => doneCount(s) >= 5 },
    { id: "b_mission_all", emoji: "👑", title: "闯关大满贯",  got: s => doneCount(s) >= MISSIONS.length },
    { id: "b_day3",       emoji: "📅", title: "坚持三天",     got: s => (s.days || []).length >= 3 },
    { id: "b_day7",       emoji: "🗓️", title: "坚持七天",     got: s => (s.days || []).length >= 7 },
    { id: "b_numpy",      emoji: "🧮", title: "数学小助手",   got: s => (s.packages || []).indexOf("numpy") !== -1 },
    { id: "b_file",       emoji: "💾", title: "数据保管员",   got: s => (s.vfsFiles || 0) > 0 },
    { id: "b_big",        emoji: "📜", title: "长篇大作",     got: s => (s.longestCode || 0) >= 500 }
  ];

  let profiles = [];
  let currentId = "";
  let stats = null;

  // ================= 存储 =================
  function readJson(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      const val = raw ? JSON.parse(raw) : null;
      return val === null || val === undefined ? fallback : val;
    } catch (e) {
      return fallback;
    }
  }

  function writeJson(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (e) {
      console.warn("成长档案保存失败", e);
      return false;
    }
  }

  function emptyStats() {
    return {
      runs: 0, successes: 0, turtleRuns: 0, vfsFiles: 0, longestCode: 0,
      days: [], missions: {}, badges: [], packages: [], lastRunDate: ""
    };
  }

  function statsKey(id) {
    return STATS_PREFIX + id;
  }

  function loadStats() {
    const raw = readJson(statsKey(currentId), null);
    const base = emptyStats();
    if (!raw || typeof raw !== "object") return base;
    return Object.assign(base, raw, {
      days: Array.isArray(raw.days) ? raw.days : [],
      badges: Array.isArray(raw.badges) ? raw.badges : [],
      packages: Array.isArray(raw.packages) ? raw.packages : [],
      missions: raw.missions && typeof raw.missions === "object" ? raw.missions : {}
    });
  }

  function saveStats() {
    writeJson(statsKey(currentId), stats);
  }

  function loadProfiles() {
    let list = readJson(PROFILES_KEY, null);
    if (!Array.isArray(list) || !list.length) {
      list = [{ id: "p_default", name: "小熊猫", emoji: "🐼", createdAt: Date.now() }];
      writeJson(PROFILES_KEY, list);
    }
    return list;
  }

  function todayStr() {
    const d = new Date();
    const m = d.getMonth() + 1;
    const day = d.getDate();
    return d.getFullYear() + "-" + (m < 10 ? "0" + m : m) + "-" + (day < 10 ? "0" + day : day);
  }

  function doneCount(s) {
    return MISSIONS.filter(m => s.missions && s.missions[m.id]).length;
  }

  // ================= 记录一次运行 =================
  function recordRun(ctx) {
    const c = ctx || {};
    const today = todayStr();
    stats.runs += 1;
    if (c.success) stats.successes += 1;
    if (c.turtle) stats.turtleRuns += 1;
    if ((c.code || "").length > stats.longestCode) stats.longestCode = (c.code || "").length;
    if (stats.days.indexOf(today) === -1) stats.days.push(today);
    stats.lastRunDate = today;
    (c.packages || []).forEach(p => {
      if (stats.packages.indexOf(p) === -1) stats.packages.push(p);
    });

    // 检查闯关任务（每次运行都重新检查未完成的任务）
    const newMissions = [];
    MISSIONS.forEach(m => {
      if (stats.missions[m.id]) return;
      let ok = false;
      try { ok = !!m.check(c, stats); } catch (e) { ok = false; }
      if (ok) {
        stats.missions[m.id] = true;
        newMissions.push(m);
      }
    });

    // 检查徽章
    const newBadges = [];
    BADGES.forEach(b => {
      if (stats.badges.indexOf(b.id) !== -1) return;
      let ok = false;
      try { ok = !!b.got(stats); } catch (e) { ok = false; }
      if (ok) {
        stats.badges.push(b.id);
        newBadges.push(b);
      }
    });

    saveStats();
    renderAll();
    return { newMissions: newMissions, newBadges: newBadges };
  }

  // 记录数据文件数量（open() 写出的文件）
  function recordVfs(count) {
    if (!count || count <= (stats.vfsFiles || 0)) return null;
    stats.vfsFiles = count;
    const before = stats.missions.m_file;
    stats.missions.m_file = true;
    const newBadges = [];
    BADGES.forEach(b => {
      if (stats.badges.indexOf(b.id) !== -1) return;
      let ok = false;
      try { ok = !!b.got(stats); } catch (e) { ok = false; }
      if (ok) { stats.badges.push(b.id); newBadges.push(b); }
    });
    saveStats();
    renderAll();
    return { newMission: before ? null : MISSIONS.filter(m => m.id === "m_file")[0], newBadges: newBadges };
  }

  // ================= 档案切换 =================
  function switchTo(id) {
    const target = profiles.find(p => p.id === id);
    if (!target || id === currentId) return;
    currentId = id;
    writeJson(CURRENT_KEY, currentId);
    stats = loadStats();
    if (typeof FileManager !== "undefined" && FileManager.setNamespace) {
      FileManager.setNamespace(currentId);
    }
    renderAll();
  }

  function createProfile(name, emoji) {
    const clean = String(name || "").trim().slice(0, 12) || ("小伙伴" + (profiles.length + 1));
    const id = "p_" + Date.now();
    profiles.push({ id: id, name: clean, emoji: emoji || EMOJIS[profiles.length % EMOJIS.length], createdAt: Date.now() });
    writeJson(PROFILES_KEY, profiles);
    switchTo(id);
    return id;
  }

  function renameProfile(name, emoji) {
    const me = profiles.find(p => p.id === currentId);
    if (!me) return;
    const clean = String(name || "").trim().slice(0, 12);
    if (clean) me.name = clean;
    if (emoji) me.emoji = emoji;
    writeJson(PROFILES_KEY, profiles);
    renderAll();
  }

  // ================= 渲染 =================
  function el(id) {
    return document.getElementById(id);
  }

  function starCount() {
    return MISSIONS.length;
  }

  function renderProfiles() {
    const row = el("profileRow");
    if (!row) return;
    row.innerHTML = "";
    profiles.forEach(p => {
      const btn = document.createElement("button");
      btn.className = "profile-chip" + (p.id === currentId ? " active" : "");
      btn.innerHTML = '<span class="profile-chip-emoji"></span><span class="profile-chip-name"></span>';
      btn.querySelector(".profile-chip-emoji").textContent = p.emoji;
      btn.querySelector(".profile-chip-name").textContent = p.name;
      btn.addEventListener("click", () => {
        switchTo(p.id);
        if (window.App && window.App.showToast) window.App.showToast("已切换到「" + p.name + "」的档案", p.emoji);
      });
      row.appendChild(btn);
    });
  }

  function renderStats() {
    const box = el("progressStats");
    if (!box) return;
    const done = doneCount(stats);
    const gotBadges = BADGES.filter(b => stats.badges.indexOf(b.id) !== -1).length;
    const cards = [
      { label: "运行次数", value: stats.runs, emoji: "🚀" },
      { label: "成功次数", value: stats.successes, emoji: "🎯" },
      { label: "完成任务", value: done + "/" + starCount(), emoji: "🎯" },
      { label: "徽章", value: gotBadges + "/" + BADGES.length, emoji: "🏅" },
      { label: "学习天数", value: (stats.days || []).length, emoji: "📅" }
    ];
    box.innerHTML = "";
    cards.forEach(c => {
      const div = document.createElement("div");
      div.className = "stat-card";
      div.innerHTML = '<div class="stat-emoji"></div><div class="stat-value"></div><div class="stat-label"></div>';
      div.querySelector(".stat-emoji").textContent = c.emoji;
      div.querySelector(".stat-value").textContent = c.value;
      div.querySelector(".stat-label").textContent = c.label;
      box.appendChild(div);
    });
  }

  function renderMissions() {
    const list = el("missionList");
    const label = el("missionProgress");
    if (!list) return;
    const done = doneCount(stats);
    if (label) label.textContent = "(" + done + "/" + starCount() + ")";
    list.innerHTML = "";
    MISSIONS.forEach(m => {
      const ok = !!stats.missions[m.id];
      const row = document.createElement("div");
      row.className = "mission-row" + (ok ? " done" : "");
      row.innerHTML = '<span class="mission-state"></span><span class="mission-emoji"></span>' +
        '<span class="mission-body"><span class="mission-title"></span><span class="mission-hint"></span></span>';
      row.querySelector(".mission-state").textContent = ok ? "✅" : "⬜";
      row.querySelector(".mission-emoji").textContent = m.emoji;
      row.querySelector(".mission-title").textContent = m.title;
      row.querySelector(".mission-hint").textContent = m.hint;
      list.appendChild(row);
    });
  }

  function renderBadges() {
    const box = el("badgeList");
    if (!box) return;
    box.innerHTML = "";
    BADGES.forEach(b => {
      const ok = stats.badges.indexOf(b.id) !== -1;
      const div = document.createElement("div");
      div.className = "badge-item" + (ok ? "" : " locked");
      div.innerHTML = '<span class="badge-emoji"></span><span class="badge-title"></span>';
      div.querySelector(".badge-emoji").textContent = ok ? b.emoji : "🔒";
      div.querySelector(".badge-title").textContent = b.title;
      box.appendChild(div);
    });
  }

  function renderAll() {
    if (!stats) return;
    renderProfiles();
    renderStats();
    renderMissions();
    renderBadges();
  }

  // ================= 面板事件 =================
  let editingId = null;

  function openEditor(profile) {
    const box = el("profileEditor");
    if (!box) return;
    box.style.display = "block";
    const input = el("profileNameInput");
    if (input) input.value = profile ? profile.name : "";
    editingId = profile ? profile.id : null;
    const row = el("profileEmojiRow");
    if (row) {
      row.innerHTML = "";
      const selected = profile ? profile.emoji : EMOJIS[(profiles.length) % EMOJIS.length];
      EMOJIS.forEach(e => {
        const b = document.createElement("button");
        b.className = "emoji-choice" + (e === selected ? " active" : "");
        b.textContent = e;
        b.addEventListener("click", () => {
          Array.prototype.forEach.call(row.querySelectorAll(".emoji-choice"), x => x.classList.remove("active"));
          b.classList.add("active");
        });
        row.appendChild(b);
      });
    }
    if (input) input.focus();
  }

  function closeEditor() {
    const box = el("profileEditor");
    if (box) box.style.display = "none";
    editingId = null;
  }

  function saveEditor() {
    const input = el("profileNameInput");
    const row = el("profileEmojiRow");
    const active = row ? row.querySelector(".emoji-choice.active") : null;
    const emoji = active ? active.textContent : null;
    if (editingId) {
      renameProfile(input ? input.value : "", emoji);
    } else {
      createProfile(input ? input.value : "", emoji);
    }
    closeEditor();
    if (window.App && window.App.showToast) window.App.showToast("档案已保存！", emoji || "🌟");
    try { SoundEffects.playSuccess(); } catch (e) {}
  }

  function openPanel() {
    renderAll();
    closeEditor();
    const modal = el("progressModal");
    if (modal) modal.classList.add("active");
    try { SoundEffects.playPop(); } catch (e) {}
  }

  function closePanel() {
    const modal = el("progressModal");
    if (modal) modal.classList.remove("active");
  }

  function bindEvents() {
    const btnOpen = el("btnProgress");
    if (btnOpen) btnOpen.addEventListener("click", openPanel);
    const btnClose = el("btnProgressClose");
    if (btnClose) btnClose.addEventListener("click", closePanel);
    const modal = el("progressModal");
    if (modal) {
      modal.addEventListener("click", (e) => { if (e.target === modal) closePanel(); });
    }
    const btnNew = el("btnNewProfile");
    if (btnNew) btnNew.addEventListener("click", () => openEditor(null));
    const btnEdit = el("btnEditProfile");
    if (btnEdit) btnEdit.addEventListener("click", () => openEditor(profiles.find(p => p.id === currentId)));
    const btnCancel = el("btnProfileCancel");
    if (btnCancel) btnCancel.addEventListener("click", closeEditor);
    const btnSave = el("btnProfileSave");
    if (btnSave) btnSave.addEventListener("click", saveEditor);
  }

  // ================= 初始化 =================
  function init() {
    profiles = loadProfiles();
    currentId = readJson(CURRENT_KEY, "") || "";
    if (!profiles.some(p => p.id === currentId)) currentId = profiles[0].id;
    writeJson(CURRENT_KEY, currentId);
    stats = loadStats();

    // 老版本（还没有「成长档案」时）的作品库，迁移到默认小伙伴名下，别让孩子以为作品丢了
    try {
      const legacyKey = "codepanda_python_files_v1";
      const namespacedKey = legacyKey + "__" + currentId;
      const legacy = localStorage.getItem(legacyKey);
      if (legacy && !localStorage.getItem(namespacedKey) && currentId === profiles[0].id) {
        localStorage.setItem(namespacedKey, legacy);
        const legacyActive = localStorage.getItem("codepanda_active_file_id");
        if (legacyActive) {
          localStorage.setItem("codepanda_active_file_id__" + currentId, legacyActive);
        }
      }
    } catch (e) { /* 迁移失败也不影响使用 */ }

    if (typeof FileManager !== "undefined" && FileManager.setNamespace) {
      FileManager.setNamespace(currentId);
    }
    bindEvents();
    renderAll();
  }

  return {
    init,
    recordRun,
    recordVfs,
    getMissions: () => MISSIONS.map(m => ({ id: m.id, title: m.title, hint: m.hint, emoji: m.emoji, done: !!stats.missions[m.id] })),
    getStats: () => stats,
    getCurrentProfile: () => profiles.find(p => p.id === currentId) || profiles[0],
    switchTo,
    createProfile,
    openPanel,
    closePanel
  };
})();
