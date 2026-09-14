/**
 * 🎓 学堂（v2）—— 专用学习界面
 *
 * 和 v1 的「学习中心弹窗」最大的区别：
 *   1. 不是弹窗：进入学堂后，工作台左栏换成「学习面板」，编辑器与运行舞台**原地复用**，
 *      不再需要「跳到主界面写代码、再点悬浮球回来批改」；
 *   2. 做题闭环：题目在左、代码在中、批改结果在右（输出面板多了一个「📝 批改」视图），
 *      写完按 Ctrl+Shift+Enter 当场出逐组对比，全对自动进入下一题；
 *   3. 教程左读右练：左边目录、编辑器上方讲解，示例代码一键送进编辑器；
 *   4. 学堂草稿：练习/教程/示例的代码单独存在「学堂草稿」里（按档案隔离），
 *      **不写进作品库、不进文件树**，但要保留：刷新、关页面、换题目后回来都还在；
 *      孩子满意时可以点「📌 存进作品库」正式存成文件。
 *
 * 依赖：CodeEditor / PythonRunner / Progress / FileManager / App（切换模式与恢复工坊状态）
 */
const Learn = (() => {
  const V = "20260914g";
  const PAGE_SIZE = 40;
  const JUDGE_TIMEOUT_MS = 4000;

  // ================= 学堂草稿 =================
  const DRAFT_KEY_PREFIX = "codepanda_learn_drafts_v1__";
  const DRAFT_MAX_ITEMS = 400;          // 最多保留多少份草稿
  const DRAFT_MAX_CODE = 24 * 1024;     // 单份草稿最大字符数
  const DRAFT_SAVE_DEBOUNCE = 700;      // 敲字后多久落盘

  let drafts = null;                    // { id: {code, at} }
  let draftTimer = null;
  let draftDirtyId = null;
  let draftProfileId = "";

  function draftKey(profileId) {
    return DRAFT_KEY_PREFIX + (profileId || "default");
  }

  function currentProfileId() {
    try {
      const p = Progress.getCurrentProfile();
      return p && p.id ? p.id : "default";
    } catch (e) {
      return "default";
    }
  }

  function loadDrafts() {
    const pid = currentProfileId();
    // 切换小伙伴档案时，草稿也跟着换一份
    if (drafts && pid === draftProfileId) return drafts;
    draftProfileId = pid;
    try {
      const raw = localStorage.getItem(draftKey(pid));
      const val = raw ? JSON.parse(raw) : null;
      drafts = (val && typeof val === "object") ? val : {};
    } catch (e) {
      drafts = {};
    }
    return drafts;
  }

  function persistDrafts() {
    if (!drafts) return true;
    try {
      let ids = Object.keys(drafts);
      if (ids.length > DRAFT_MAX_ITEMS) {
        ids.sort((a, b) => (drafts[a].at || 0) - (drafts[b].at || 0));
        ids.slice(0, ids.length - DRAFT_MAX_ITEMS).forEach(id => { delete drafts[id]; });
      }
      let total = 0;
      ids = Object.keys(drafts).sort((a, b) => (drafts[b].at || 0) - (drafts[a].at || 0));
      ids.forEach(id => {
        total += (drafts[id].code || "").length;
        if (total > 2 * 1024 * 1024) delete drafts[id];   // 兜底：整库不超过约 2MB
      });
      localStorage.setItem(draftKey(draftProfileId), JSON.stringify(drafts));
      return true;
    } catch (e) {
      console.warn("学堂草稿保存失败（可能是浏览器存储满了）", e);
      return false;
    }
  }

  function getDraft(id) {
    if (!id) return null;
    const d = loadDrafts()[id];
    return d && typeof d.code === "string" ? d : null;
  }

  function setDraft(id, code) {
    if (!id) return;
    const all = loadDrafts();
    const text = String(code === null || code === undefined ? "" : code).slice(0, DRAFT_MAX_CODE);
    if (all[id] && all[id].code === text) return;
    all[id] = { code: text, at: Date.now() };
    draftDirtyId = id;
    if (draftTimer) clearTimeout(draftTimer);
    draftTimer = setTimeout(() => { draftTimer = null; persistDrafts(); updateTaskBar(); }, DRAFT_SAVE_DEBOUNCE);
  }

  function flushDraft() {
    if (draftTimer) { clearTimeout(draftTimer); draftTimer = null; }
    if (draftDirtyId !== null) { persistDrafts(); draftDirtyId = null; }
  }

  function dropDraft(id) {
    if (!id) return;
    const all = loadDrafts();
    if (all[id]) { delete all[id]; persistDrafts(); }
  }

  function draftCount() {
    loadDrafts();
    return Object.keys(drafts).length;
  }

  // ================= 布局：教程的「讲解 / 代码」怎么分 =================
  // 三种预设：read=讲解优先(70/30)、half=各一半(50/50)、code=代码优先(讲解折叠)
  const LAYOUT_KEY_PREFIX = "codepanda_learn_layout_v1__";
  const LESSON_MIN_H = 96;      // 讲解区最小高度
  const CODE_MIN_H = 300;       // 编辑器最小高度（避免拖到只能看两三行）
  const FOLDED_H = 46;          // 折叠后只留一条标题栏
  const SPLITTER_H = 12;        // 分隔条本身占的高度
  const COLLAPSED_CODE_H = 34;  // 「讲解优先」时代码区收成一条提示栏
  const LAYOUT_LABEL = { read: "📖 讲解优先", half: "⚖️ 各一半", code: "⌨️ 代码优先" };

  let layoutState = null;       // { lesson: {mode, ratio}, compare: false }
  let dragState = null;
  let resizeTimer = null;

  function layoutKey() {
    return LAYOUT_KEY_PREFIX + currentProfileId();
  }

  function loadLayout() {
    if (layoutState) return layoutState;
    try {
      const raw = localStorage.getItem(layoutKey());
      const val = raw ? JSON.parse(raw) : null;
      layoutState = (val && typeof val === "object") ? val : {};
    } catch (e) {
      layoutState = {};
    }
    if (!layoutState.lesson) layoutState.lesson = { mode: "half", ratio: 0.5 };
    if (typeof layoutState.compare !== "boolean") layoutState.compare = false;
    return layoutState;
  }

  function persistLayout() {
    try { localStorage.setItem(layoutKey(), JSON.stringify(loadLayout())); } catch (e) {}
  }

  function layoutFor(section) {
    const st = loadLayout();
    if (!st.lesson) st.lesson = { mode: "half", ratio: 0.5 };
    return st.lesson;
  }

  // ================= 基础工具 =================
  function esc(s) {
    return String(s === null || s === undefined ? "" : s).replace(/[&<>"']/g, c => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
    })[c]);
  }

  function rich(s) {
    return esc(s)
      .replace(/\*\*([^*]+)\*\*/g, "<b>$1</b>")
      .replace(/`([^`]+)`/g, '<code class="inline-code">$1</code>')
      .replace(/\n/g, "<br>");
  }

  function toast(msg, icon) {
    if (window.App && window.App.showToast) window.App.showToast(msg, icon || "🎓");
  }

  function celebrate() {
    try { ConfettiFX.celebrate(); } catch (e) {}
  }

  function sound(name) {
    try { if (SoundEffects && SoundEffects[name]) SoundEffects[name](); } catch (e) {}
  }

  function progress() {
    return typeof Progress !== "undefined" ? Progress : null;
  }

  function norm(text) {
    const s = String(text || "").replace(/\r\n/g, "\n").replace(/\r/g, "\n");
    const lines = s.split("\n").map(l => l.replace(/\s+$/, ""));
    while (lines.length && lines[lines.length - 1] === "") lines.pop();
    return lines.join("\n");
  }

  function el(id) { return document.getElementById(id); }

  function isActive() {
    return document.body.classList.contains("mode-learn");
  }

  // ================= 懒加载数据文件 =================
  function loadScript(src) {
    return new Promise((resolve, reject) => {
      const exist = document.querySelector('script[data-learn-src="' + src + '"]');
      if (exist) {
        if (exist.dataset.loaded === "1") { resolve(); return; }
        exist.addEventListener("load", () => resolve());
        exist.addEventListener("error", () => reject(new Error("加载失败")));
        return;
      }
      const s = document.createElement("script");
      s.src = src + "?v=" + V;
      s.dataset.learnSrc = src;
      s.onload = () => { s.dataset.loaded = "1"; resolve(); };
      s.onerror = () => reject(new Error("加载失败：" + src));
      document.head.appendChild(s);
    });
  }

  let assets = { lessons: false, lessonsAdv: false, examples: false, exercises: false };
  let assetErrors = {};

  function ensureAssets(which) {
    const wrap = (key, src) => {
      if (assets[key]) return Promise.resolve();
      return loadScript(src).then(() => { assets[key] = true; }).catch(err => {
        assetErrors[key] = err.message || "加载失败";
        throw err;
      });
    };
    const jobs = [];
    if (which.indexOf("lessons") !== -1) {
      jobs.push(wrap("lessons", "js/lessons.js"));
      jobs.push(wrap("lessonsAdv", "js/lessons-adv.js"));
    }
    if (which.indexOf("examples") !== -1) jobs.push(wrap("examples", "js/examples-lib.js"));
    if (which.indexOf("exercises") !== -1) jobs.push(wrap("exercises", "js/exercises.js"));
    return Promise.all(jobs);
  }

  function lessons() {
    const base = typeof LEARN_LESSONS !== "undefined" ? LEARN_LESSONS : [];
    const adv = typeof LEARN_LESSONS_ADV !== "undefined" ? LEARN_LESSONS_ADV : [];
    if (!adv.length) return base;
    const out = base.slice();
    adv.forEach(l => { if (!out.some(x => x.id === l.id)) out.push(l); });
    return out;
  }
  // 示例统一分类：把内置示例的 5 个分类和示例库的 11 个分类并成 8 组，
  // 这样「示例宝库」弹窗和学习中心用的是同一套分类，孩子不会看到两套名字。
  const GALLERY_GROUPS = [
    { id: "game",   name: "小游戏",     emoji: "🎮", src: ["game"] },
    { id: "basic",  name: "入门启蒙",   emoji: "🌟", src: ["basic", "print", "var", "calc"] },
    { id: "loop",   name: "判断与循环", emoji: "🔁", src: ["if", "loop"] },
    { id: "turtle", name: "海龟画室",   emoji: "🐢", src: ["turtle"] },
    { id: "text",   name: "文字艺术",   emoji: "✍️", src: ["text", "string"] },
    { id: "data",   name: "列表与字典", emoji: "🎒", src: ["list"] },
    { id: "func",   name: "函数积木",   emoji: "🧩", src: ["func"] },
    { id: "math",   name: "数学魔法",   emoji: "🧮", src: ["math"] }
  ];

  function groupOf(cat) {
    const g = GALLERY_GROUPS.find(x => x.src.indexOf(cat) !== -1);
    return g ? g.id : "basic";
  }

  function exampleCats() { return GALLERY_GROUPS; }

  // 内置示例（js/examples.js 里的 DEFAULT_EXAMPLES）也并进来看，统一成一种数据形状
  function builtinExamples() {
    const list = typeof DEFAULT_EXAMPLES !== "undefined" ? DEFAULT_EXAMPLES : [];
    return list.map(e => {
      const meta = (typeof EXAMPLE_META !== "undefined" && EXAMPLE_META[e.id]) || {};
      return {
        id: e.id,
        title: String(e.name || "").replace(/\.py$/, "").replace(/^[0-9]+[_\-\s]*/, ""),
        emoji: "🎁",
        level: meta.level || 1,
        desc: meta.desc || "内置示例，点开就能玩",
        tip: "这是内置示例，改一改再运行看看会有什么变化~",
        code: e.content,
        category: meta.category || "basic",
        group: groupOf(meta.category || "basic"),
        builtin: true
      };
    });
  }

  function exampleList() {
    const lib = (typeof LEARN_EXAMPLES !== "undefined" ? LEARN_EXAMPLES : []).map(e => Object.assign({}, e, {
      group: groupOf(e.category), builtin: false
    }));
    return lib.concat(builtinExamples());
  }
  function bank() { return typeof EXERCISE_BANK !== "undefined" ? EXERCISE_BANK : []; }
  function topics() { return typeof EXERCISE_TOPICS !== "undefined" ? EXERCISE_TOPICS : []; }
  function levels() { return typeof EXERCISE_LEVELS !== "undefined" ? EXERCISE_LEVELS : []; }
  function topicMeta(id) { return topics().find(t => t.id === id) || { id: id, name: id, emoji: "✏️" }; }
  function levelMeta(id) { return levels().find(l => l.id === Number(id)) || { id: id, name: "关卡 " + id, emoji: "🌱" }; }

  // ================= 状态 =================
  const STAGE_INFO = {
    1: { name: "GESP 一级 · 顺序与输入输出", emoji: "🌱", desc: "会打印、会用变量、会读入数字、会算加减乘除" },
    2: { name: "GESP 二级 · 分支与循环", emoji: "🌿", desc: "会判断、会重复、会画图形、能读懂小段程序" },
    3: { name: "GESP 三级 · 字符串·列表·函数", emoji: "🌳", desc: "会处理文字和一批数据、会写自己的函数" },
    4: { name: "GESP 四级 · 算法思维", emoji: "🏔️", desc: "枚举、排序、查找、模拟题，向四级和更难的比赛出发" }
  };

  let section = "path";
  let cur = null;            // { kind: "lesson"|"example"|"exercise"|"exam", id }
  let judgeResult = null;    // 最近一次批改结果
  let busy = false;
  let autoNextTimer = null;
  let examTimer = null;

  const ui = {
    exTopic: "all", exLevel: 0, exStatus: "todo", exQuery: "", exShown: PAGE_SIZE,
    exListReturn: true,       // 练习面板是否显示列表（否则显示题目卡）
    sessionList: [],          // 本次做题的题目顺序（打开题目时锁定，做完一题不会因筛选变化而跳走）
    exampleCat: "all", exampleLevel: 0, exampleQuery: "", exampleDetail: false,
    examLevel: 1, examPaper: null, examIndex: 0, examDone: null
  };

  // ================= 进入 / 退出学堂 =================
  function open(sec) {
    if (!isActive()) {
      // 先把工坊里正在编辑的内容落盘，别把孩子的作品弄丢
      if (window.App && App.enterLearnMode) App.enterLearnMode();
      document.body.classList.add("mode-learn");
      loadDrafts();
      loadLayout();
      ensureLearnDom();
    }
    goto(sec || section || "path");
    sound("playPop");
  }

  function exit() {
    flushDraft();
    stopAutoNext();
    stopExamTimer();
    toggleFocus(false);
    document.body.classList.remove("mode-learn");
    document.body.classList.remove("learn-wide");
    releaseLearnDom();
    if (window.App && App.exitLearnMode) App.exitLearnMode();
    sound("playPop");
  }

  function markTab(name) {
    Array.prototype.forEach.call(document.querySelectorAll("#learnTabs .learn-tab"), b => {
      b.classList.toggle("active", b.dataset.tab === name);
    });
  }

  function goto(sec) {
    section = sec || "path";
    const wide = (section === "path" || section === "award");
    document.body.classList.toggle("learn-wide", wide);
    if (section !== "exam") stopExamTimer();
    // 只有「教程」才显示讲解区：切到示例/练习/模拟考等要收起来（布局设置会记住，回来还在）
    if (section !== "lesson") hideLessonHost();
    markTab(section);
    // 从别的小节切回模拟考：把当前这一题写到一半的代码重新装回编辑器，
    // 否则编辑器里会残留刚才在练习/示例里看的代码。
    if (section === "exam" && ui.examPaper && !ui.examDone) {
      loadExamQuestion();
      startExamTimer();
    }
    renderHud();
    renderPanel();
    applyLayout();
    renderCompare();
    updateTaskBar();
    renderActionBar();
  }

  // ================= 顶部 HUD =================
  function renderHud() {
    const hud = el("learnHud");
    if (!hud) return;
    const p = progress();
    if (!p) { hud.innerHTML = ""; return; }
    const info = p.getLevel();
    const st = p.getStats();
    const streak = st.streak || 0;
    hud.innerHTML =
      '<span class="hud-level"><span class="hud-emoji">' + info.emoji + '</span>Lv.' + info.level + '</span>' +
      '<span class="hud-bar" title="' + esc(info.title) + '"><span style="width:' + info.percent + '%"></span></span>' +
      '<span class="hud-num">✨ ' + (st.xp || 0) + '</span>' +
      '<span class="hud-num">✅ ' + Object.keys(st.solved || {}).length + '</span>' +
      '<span class="hud-num">🏅 ' + (st.badges || []).length + '</span>' +
      (streak >= 2 ? '<span class="hud-num">🔥 ' + streak + ' 天</span>' : '');
  }

  // ================= 面板渲染入口 =================
  function renderPanel() {
    const body = el("learnBody");
    if (!body) return;
    const loaders = {
      path: ["lessons"], lesson: ["lessons"], example: ["examples"],
      exercise: ["exercises"], exam: ["exercises"], award: []
    }[section] || [];

    const missing = loaders.filter(k => !assets[k]);
    if (missing.length) {
      body.innerHTML = '<div class="learn-loading">📦 正在打开知识宝箱…</div>';
      ensureAssets(missing).then(() => {
        if (section) renderPanel();
        renderHud();
      }).catch(() => {
        body.innerHTML = '<div class="learn-error">😢 内容没能加载出来（' +
          esc(missing.map(k => assetErrors[k] || k).join("；")) +
          '）。检查一下网络，再点一次「🎓 学习中心」试试~</div>';
      });
      return;
    }

    if (section === "path") renderPath(body);
    else if (section === "lesson") renderLessonPanel(body);
    else if (section === "example") renderExamplePanel(body);
    else if (section === "exercise") renderExercisePanel(body);
    else if (section === "exam") renderExamPanel(body);
    else if (section === "award") renderAward(body);
  }

  // ================= 🗺️ 学习地图 =================
  function renderPath(body) {
    const p = progress();
    const ls = lessons();
    const info = p ? p.getLevel() : null;
    let html = "";

    html += '<div class="path-hero">' +
      '<div class="path-hero-emoji">' + (info ? info.emoji : "🐼") + '</div>' +
      '<div class="path-hero-main">' +
      '<div class="path-hero-title">' + (info ? "Lv." + info.level + " " + esc(info.title) : "小朋友") + '</div>' +
      '<div class="path-hero-bar"><span style="width:' + (info ? info.percent : 0) + '%"></span></div>' +
      '<div class="path-hero-sub">' + (info && info.isMax ? "已经满级啦，太厉害了！" : "再攒 " + (info ? (info.need - info.cur) : 0) + " 点经验就升级啦 ✨") + '</div>' +
      '</div></div>';

    const daily = p ? p.getDaily() : [];
    const nextLesson = ls.find(l => !(p && p.isLessonDone(l.id)));
    const nextEx = bank().length ? bank().find(e => !(p && p.isSolved(e.id))) : null;
    html += '<div class="path-today"><div class="path-today-title">🎯 今天做点什么？</div><div class="path-today-list">' +
      (daily.length ? daily.map(d =>
        '<div class="today-item' + (d.done ? " done" : "") + '"><span>' + d.emoji + '</span>' + esc(d.title) +
        '<b>' + d.have + '/' + d.need + '</b> <i>+' + d.xp + '✨</i></div>').join("") :
        '<div class="today-item">📋 每日任务准备中…</div>') +
      (nextLesson ? '<div class="today-item link" data-act="go-lesson" data-id="' + nextLesson.id + '"><span>' + nextLesson.emoji + '</span>接着学：' + esc(nextLesson.title) + '<b>去上课 ▶</b></div>' : '<div class="today-item done"><span>🎓</span>课程都学完啦，太棒了！</div>') +
      (nextEx
        ? '<div class="today-item link" data-act="go-ex" data-id="' + nextEx.id + '"><span>' + topicMeta(nextEx.topic).emoji + '</span>接着做：' + esc(nextEx.title) + '<b>去练习 ▶</b></div>'
        : (bank().length ? '<div class="today-item done"><span>✅</span>题目都做对啦，厉害！</div>'
                         : '<div class="today-item link" data-act="go-practice"><span>✏️</span>去练习题库刷几道题（1318 道，按主题和关卡分好）<b>去练习 ▶</b></div>')) +
      '</div></div>';

    html += '<div class="path-stages">';
    [1, 2, 3, 4].forEach(stage => {
      const list = ls.filter(l => l.stage === stage);
      const done = list.filter(l => p && p.isLessonDone(l.id)).length;
      const si = STAGE_INFO[stage];
      const pct = list.length ? Math.round(done / list.length * 100) : 0;
      html += '<button class="stage-card" data-act="stage" data-stage="' + stage + '">' +
        '<div class="stage-head"><span class="stage-emoji">' + si.emoji + '</span>' +
        '<span class="stage-name">' + esc(si.name) + '</span>' +
        '<span class="stage-count">' + done + "/" + list.length + '</span></div>' +
        '<div class="stage-desc">' + esc(si.desc) + '</div>' +
        '<div class="stage-bar"><span style="width:' + pct + '%"></span></div>' +
        '</button>';
    });
    html += '</div>';

    const units = [];
    ls.forEach(l => {
      const key = l.stage + "|" + (l.unit || "其他");
      let u = units.find(x => x.key === key);
      if (!u) { u = { key: key, stage: l.stage, unit: l.unit || "其他", list: [] }; units.push(u); }
      u.list.push(l);
    });
    html += '<div class="path-units-title">📖 全部单元</div><div class="unit-grid">';
    units.forEach(u => {
      const done = u.list.filter(l => p && p.isLessonDone(l.id)).length;
      html += '<button class="unit-chip" data-act="unit" data-unit="' + esc(u.unit) + '">' +
        '<span class="unit-name">' + esc(u.unit) + '</span>' +
        '<span class="unit-meta">' + done + "/" + u.list.length + ' 课 · ' + STAGE_INFO[u.stage].emoji + '</span>' +
        '</button>';
    });
    html += '</div>';

    const dn = draftCount();
    if (dn) {
      html += '<div class="path-drafts"><div class="path-units-title">📝 我的学堂草稿（' + dn + ' 份，自动保存）</div>' +
        '<div class="path-drafts-tip">这些是你在学堂里写过、还没存进作品库的代码。' +
        '点开就能接着写；满意时用编辑器上方的「📌 存进作品库」正式存起来。</div></div>';
    }

    body.innerHTML = html;
  }

  // ================= 📚 教程 =================
  function renderLessonPanel(body) {
    const p = progress();
    const ls = lessons();
    if (!ls.length) { body.innerHTML = '<div class="learn-error">教程内容还没准备好…</div>'; return; }
    if (!cur || cur.kind !== "lesson" || !ls.some(l => l.id === cur.id)) {
      const first = ls.find(l => !(p && p.isLessonDone(l.id))) || ls[0];
      loadIntoEditor("lesson", first.id);
    }
    const curLesson = ls.find(l => l.id === cur.id) || ls[0];

    let html = '<div class="panel-mini-head">📚 教程目录 <span>' +
      ls.filter(l => p && p.isLessonDone(l.id)).length + '/' + ls.length + '</span></div>';
    html += '<div class="lesson-toc">';
    const units = [];
    ls.forEach(l => {
      const key = l.stage + "|" + (l.unit || "其他");
      let u = units.find(x => x.key === key);
      if (!u) { u = { key: key, stage: l.stage, unit: l.unit || "其他", list: [] }; units.push(u); }
      u.list.push(l);
    });
    units.forEach(u => {
      const done = u.list.filter(l => p && p.isLessonDone(l.id)).length;
      html += '<div class="lesson-unit-head">' + STAGE_INFO[u.stage].emoji + ' ' + esc(u.unit) + '<span>' + done + "/" + u.list.length + '</span></div>';
      u.list.forEach(l => {
        const ok = p && p.isLessonDone(l.id);
        html += '<button class="lesson-item' + (l.id === curLesson.id ? " active" : "") + (ok ? " done" : "") +
          '" data-act="lesson" data-id="' + l.id + '"><span class="lesson-item-emoji">' + l.emoji + '</span>' +
          '<span class="lesson-item-title">' + esc(l.title) + '</span>' +
          '<span class="lesson-item-state">' + (ok ? "✅" : "") + '</span></button>';
      });
    });
    html += '</div>';
    body.innerHTML = html;

    renderLessonMain(curLesson);
  }

  // 教程正文：放在编辑器上方（左目录 / 上讲下练，示例代码一键送进编辑器）
  function renderLessonMain(lesson) {
    const host = ensureLearnDom();
    if (!host) return;
    const p = progress();
    const done = p && p.isLessonDone(lesson.id);
    let html = '<div class="lesson-main-head">' +
      '<span class="lesson-head-emoji">' + lesson.emoji + '</span>' +
      '<div class="lesson-head-text"><div class="lesson-head-title">' + esc(lesson.title) + '</div>' +
      '<div class="lesson-head-meta">' + STAGE_INFO[lesson.stage].emoji + ' ' + esc(lesson.unit) +
      ' · 约 ' + (lesson.minutes || 8) + ' 分钟' + (done ? ' · <b class="ok">已学完 ✅</b>' : '') + '</div></div>' +
      '<button class="learn-mini-btn" data-act="lesson-fold">' +
      (layoutFor("lesson").mode === "code" ? "📖 展开讲解 ▾" : "收起 ▴") + '</button>' +
      '</div>';

    html += '<div class="lesson-main-body">';
    if (lesson.goals && lesson.goals.length) {
      html += '<div class="lesson-goals"><div class="lesson-block-title">🎯 学完这节课，你会：</div><ul>' +
        lesson.goals.map(g => '<li>' + rich(g) + '</li>').join("") + '</ul></div>';
    }
    html += '<div class="lesson-teach">' + (lesson.teach || []).map(t => '<p>' + rich(t) + '</p>').join("") + '</div>';
    if (lesson.explain && lesson.explain.length) {
      html += '<div class="lesson-explain"><div class="lesson-block-title">🔍 代码里的小秘密</div>' +
        lesson.explain.map(x => '<div class="explain-line">💡 ' + rich(x) + '</div>').join("") + '</div>';
    }
    (lesson.quiz || []).forEach((q, qi) => {
      html += '<div class="lesson-quiz" data-quiz="' + qi + '">' +
        '<div class="lesson-block-title">🧠 小测验：' + rich(q.q) + '</div>' +
        '<div class="quiz-options">' +
        (q.options || []).map((o, oi) =>
          '<button class="quiz-option" data-act="quiz" data-q="' + qi + '" data-o="' + oi + '">' +
          String.fromCharCode(65 + oi) + '. ' + esc(o) + '</button>').join("") +
        '</div><div class="quiz-feedback"></div></div>';
    });
    if (lesson.task) {
      html += '<div class="lesson-task"><div class="lesson-block-title">🛠️ 动手任务</div><div>' + rich(lesson.task) + '</div></div>';
    }
    if (lesson.practiceTopics && lesson.practiceTopics.length && bank().length) {
      html += '<div class="lesson-practice"><div class="lesson-block-title">✏️ 配套练习</div><div class="lesson-practice-row">' +
        lesson.practiceTopics.map(t => {
          const tm = topicMeta(t);
          return '<button class="learn-chip" data-act="practice-topic" data-topic="' + t + '">' + tm.emoji + ' ' + esc(tm.name) + '</button>';
        }).join("") + '</div></div>';
    }
    html += '<div class="lesson-code-block"><div class="lesson-code-head">💻 这节课的示例代码' +
      '<span class="lesson-code-actions">' +
      '<button class="learn-mini-btn" data-act="lesson-code-to-editor">↓ 放到下面编辑器</button>' +
      '<button class="learn-mini-btn" data-act="lesson-run">▶ 直接运行</button>' +
      '</span></div>' +
      '<pre class="lesson-code">' + esc(lesson.code || "") + '</pre></div>';
    html += '</div>';

    host.innerHTML = html;
    host.style.display = "flex";
    applyLayout();
    markerLayoutButtons();
  }

  // 学堂模式下把编辑区改造成：讲解区 +（可拖的）分隔条 + [编辑器 | 对照栏]
  // 注意：只是把 .editor-body-wrapper 挪进一个行容器，离开学堂时原样放回，
  // CodeMirror 实例不动，挪完调一次 refresh() 即可。
  function ensureLearnDom() {
    const wrapper = document.querySelector(".editor-body-wrapper");
    if (!wrapper || !wrapper.parentNode) return null;
    const parent = wrapper.parentNode;

    let host = el("learnLessonHost");
    if (!host) {
      host = document.createElement("div");
      host.id = "learnLessonHost";
      host.className = "learn-lesson-host";
      parent.insertBefore(host, wrapper);
    }
    if (!host.dataset.bound) {
      host.dataset.bound = "1";
      host.addEventListener("click", handleAction);
    }

    let splitter = el("learnSplitter");
    if (!splitter) {
      splitter = document.createElement("div");
      splitter.id = "learnSplitter";
      splitter.className = "learn-splitter";
      splitter.innerHTML = '<span class="learn-splitter-grip"></span><span class="learn-splitter-badge" id="learnSplitterBadge"></span>';
      parent.insertBefore(splitter, wrapper);
      splitter.addEventListener("pointerdown", onSplitterDown);
    }

    let row = el("learnCodeRow");
    if (!row) {
      row = document.createElement("div");
      row.id = "learnCodeRow";
      row.className = "learn-code-row";
      parent.insertBefore(row, wrapper);
      row.appendChild(wrapper);
      const cmp = document.createElement("div");
      cmp.id = "learnCompareHost";
      cmp.className = "learn-compare-host";
      cmp.addEventListener("click", handleAction);
      row.appendChild(cmp);
      // 「讲解优先」时代码区收成一条提示栏，点它就展开
      row.addEventListener("click", () => {
        if (row.classList.contains("collapsed") && section === "lesson") setLayout("half");
      });
      setTimeout(() => { try { CodeEditor.refresh(); } catch (e) {} }, 40);
    }
    return host;
  }

  // 回工坊：把编辑器放回原来的位置，拆掉行容器
  function releaseLearnDom() {
    const row = el("learnCodeRow");
    const wrapper = document.querySelector(".editor-body-wrapper");
    const actionBar = el("learnActionBar");
    if (row && wrapper && wrapper.parentNode === row && row.parentNode) {
      row.parentNode.insertBefore(wrapper, actionBar || row);
      row.parentNode.removeChild(row);
      setTimeout(() => { try { CodeEditor.refresh(); } catch (e) {} }, 40);
    }
    const host = el("learnLessonHost");
    if (host) { host.style.display = "none"; host.innerHTML = ""; }
    const splitter = el("learnSplitter");
    if (splitter) splitter.classList.remove("show");
    document.body.classList.remove("learn-focus");
  }

  function hideLessonHost() {
    const host = el("learnLessonHost");
    if (host) { host.style.display = "none"; host.innerHTML = ""; }
    const splitter = el("learnSplitter");
    if (splitter) splitter.classList.remove("show");
  }

  // 讲解区 / 编辑器之间的可用高度（不含上下那些工具条）
  function measureRegion() {
    const panel = document.querySelector(".editor-panel");
    if (!panel) return { top: 0, height: 0 };
    const above = ["#learnTaskBar", ".editor-tool-bar"];
    const below = [".learn-action-bar", ".editor-status-bar"];
    const h = (list) => list.reduce((sum, sel) => {
      const e = document.querySelector(sel);
      return sum + ((e && e.offsetParent !== null) ? e.offsetHeight : 0);
    }, 0);
    const rect = panel.getBoundingClientRect();
    const aboveH = h(above);
    const belowH = h(below);
    return {
      top: rect.top + aboveH,
      height: Math.max(0, panel.clientHeight - aboveH - belowH)
    };
  }

  // 应用当前布局（教程：讲解区高度；其它小节：讲解区收起来，编辑器全高）
  function applyLayout() {
    const host = el("learnLessonHost");
    const splitter = el("learnSplitter");
    if (!host || !splitter) return;

    const row = el("learnCodeRow");
    const hasContent = host.innerHTML.trim() !== "";
    if (!isActive() || section !== "lesson" || !hasContent) {
      host.style.display = "none";
      splitter.classList.remove("show");
      // 注意：「讲解优先」会把代码区收成一条提示栏，离开教程时必须展开回来，
      // 否则练习 / 示例 / 模拟考里就看不到代码编辑区了。
      if (row) row.classList.remove("collapsed");
      return;
    }

    const st = layoutFor("lesson");
    host.style.display = "flex";
    host.style.flex = "0 0 auto";

    // ⌨️ 代码优先：讲解收成一条标题栏，编辑器全高
    if (st.mode === "code") {
      host.classList.add("folded");
      host.style.height = FOLDED_H + "px";
      if (row) row.classList.remove("collapsed");
      splitter.classList.remove("show");
      syncFoldButton(true);
      markerLayoutButtons();
      return;
    }
    syncFoldButton(false);

    host.classList.remove("folded");
    const region = measureRegion();

    // 📖 讲解优先：代码区收成一条提示栏，讲解铺满（想写代码点「⌨️」或那条提示）
    if (st.mode === "read") {
      host.style.height = Math.max(LESSON_MIN_H, region.height - COLLAPSED_CODE_H) + "px";
      if (row) row.classList.add("collapsed");
      splitter.classList.remove("show");
      markerLayoutButtons();
      return;
    }

    // ⚖️ 各一半（或拖出来的自定义比例）
    if (row) row.classList.remove("collapsed");
    const codeMin = Math.min(CODE_MIN_H, Math.max(160, region.height - LESSON_MIN_H));
    const maxHost = Math.max(LESSON_MIN_H, region.height - codeMin - SPLITTER_H);
    const px = Math.max(LESSON_MIN_H, Math.min(maxHost, Math.round(region.height * st.ratio)));
    host.style.height = px + "px";
    splitter.classList.add("show");
    markerLayoutButtons();
  }

  function syncFoldButton(folded) {
    const btn = document.querySelector('#learnLessonHost [data-act="lesson-fold"]');
    if (btn) btn.textContent = folded ? "📖 展开讲解 ▾" : "收起 ▴";
  }

  function markerLayoutButtons() {
    const st = layoutFor("lesson");
    Array.prototype.forEach.call(document.querySelectorAll(".learn-layout-btn"), b => {
      b.classList.toggle("active", b.dataset.mode === st.mode);
    });
  }

  function setLayout(mode, opts) {
    const st = layoutFor("lesson");
    st.mode = mode;
    if (mode === "half") st.ratio = 0.5;      // 「各一半」永远是正正好的一半
    loadLayout().lesson = st;
    persistLayout();
    applyLayout();
    markerLayoutButtons();
    if (!opts || !opts.silent) setStatus(LAYOUT_LABEL[mode] || "");
  }

  // 拖分隔条
  function onSplitterDown(e) {
    const host = el("learnLessonHost");
    const splitter = el("learnSplitter");
    if (!host || !splitter) return;
    const region = measureRegion();
    if (!region.height) return;
    dragState = { region: region, host: host, splitter: splitter };
    splitter.classList.add("dragging");
    document.body.classList.add("learn-dragging");
    try { splitter.setPointerCapture(e.pointerId); } catch (err) {}
    e.preventDefault();
  }

  function onSplitterMove(e) {
    if (!dragState) return;
    const region = dragState.region;
    const codeMin = Math.min(CODE_MIN_H, Math.max(160, region.height - LESSON_MIN_H));
    const maxHost = Math.max(LESSON_MIN_H, region.height - codeMin - SPLITTER_H);
    const y = e.clientY - region.top;
    const px = Math.max(LESSON_MIN_H, Math.min(maxHost, Math.round(y)));
    dragState.host.classList.remove("folded");
    dragState.host.style.height = px + "px";
    const st = layoutFor("lesson");
    st.ratio = Math.max(0.06, Math.min(0.94, px / region.height));
    if (st.mode === "code") st.mode = "half";
    loadLayout().lesson = st;
    const badge = el("learnSplitterBadge");
    if (badge) badge.textContent = "讲解 " + Math.round(st.ratio * 100) + "% · 代码 " + Math.round((1 - st.ratio) * 100) + "%";
    markerLayoutButtons();
  }

  function onSplitterUp() {
    if (!dragState) return;
    dragState.splitter.classList.remove("dragging");
    document.body.classList.remove("learn-dragging");
    dragState = null;
    persistLayout();
    applyLayout();
    const badge = el("learnSplitterBadge");
    if (badge) setTimeout(() => { badge.textContent = ""; }, 900);
  }

  // 对照原版示例代码（并排放在编辑器右边）
  function toggleCompare(force) {
    const st = loadLayout();
    st.compare = (typeof force === "boolean") ? force : !st.compare;
    persistLayout();
    renderCompare();
    updateTaskBar();
  }

  function renderCompare() {
    const host = el("learnCompareHost");
    if (!host) return;
    const st = loadLayout();
    const ex = (cur && cur.kind === "example") ? exampleList().find(e => e.id === cur.id) : null;
    if (!st.compare || !ex) {
      host.classList.remove("show");
      host.innerHTML = "";
      return;
    }
    host.classList.add("show");
    host.innerHTML = '<div class="compare-head">📄 原版示例代码' +
      '<button class="learn-mini-btn" data-act="compare-close">✕ 收起</button></div>' +
      '<pre class="lesson-code small">' + esc(ex.code || "") + '</pre>' +
      '<div class="compare-tip">右边是原版，左边是你改过的。想一键还原就点操作条上的「↺ 还原示例代码」。</div>';
    setTimeout(() => { try { CodeEditor.refresh(); } catch (e) {} }, 40);
  }

  // 专注写代码
  function toggleFocus(force) {
    const on = (typeof force === "boolean") ? force : !document.body.classList.contains("learn-focus");
    document.body.classList.toggle("learn-focus", on);
    const btn = el("btnFocus");
    if (btn) {
      btn.textContent = on ? "⛶ 退出专注" : "⛶ 专注";
      btn.title = on ? "退出专注模式（Esc）" : "专注写代码：把其它面板都收起来（Esc 退出）";
    }
    setTimeout(() => { try { CodeEditor.refresh(); } catch (e) {} }, 80);
    if (on) toast("⛶ 进入专注模式，按 Esc 或再点一次可以退出", "🧘");
  }

  // ================= 🎁 示例 =================
  function renderExamplePanel(body) {
    const list = exampleList();
    const cats = exampleCats();
    if (!list.length) { body.innerHTML = '<div class="learn-error">示例库还没准备好…</div>'; return; }
    const curEx = (cur && cur.kind === "example") ? list.find(e => e.id === cur.id) : null;

    let html = '<div class="panel-mini-head">🎁 示例宝库 <span>' + list.length + ' 个</span></div>';
    if (curEx && ui.exampleDetail) {
      html += '<div class="ex-detail small">' +
        '<div class="ex-detail-head"><span class="ex-detail-emoji">' + curEx.emoji + '</span>' +
        '<div><div class="ex-detail-title">' + esc(curEx.title) + '</div>' +
        '<div class="ex-detail-meta">' + "⭐".repeat(Math.max(1, Math.min(3, curEx.level || 1))) + ' · ' +
        esc((cats.find(c => c.id === curEx.group) || {}).name || curEx.group) + '</div></div></div>' +
        '<div class="ex-detail-desc">' + esc(curEx.desc) + '</div>' +
        '<div class="ex-detail-tip">💡 试试看：' + esc(curEx.tip || "改一改数字或文字，再运行一次，看看有什么变化。") + '</div>' +
        '<div class="ex-actions">' +
        '<button class="learn-btn" data-act="ex-back">← 返回列表</button>' +
        '<button class="learn-btn primary" data-act="ex-run">▶ 运行</button>' +
        '</div></div>';
    }

    html += '<div class="lib-toolbar"><input class="learn-search" id="exSearch" placeholder="🔍 搜索示例" value="' + esc(ui.exampleQuery) + '"></div>';
    html += '<div class="lib-toolbar">' +
      '<button class="learn-chip' + (ui.exampleCat === "all" ? " active" : "") + '" data-act="ex-cat" data-cat="all">全部 ' + list.length + '</button>' +
      cats.map(c => {
        const n = list.filter(e => e.group === c.id).length;
        if (!n) return "";
        return '<button class="learn-chip' + (ui.exampleCat === c.id ? " active" : "") + '" data-act="ex-cat" data-cat="' + c.id + '">' +
          c.emoji + ' ' + esc(c.name) + ' ' + n + '</button>';
      }).join("") + '</div>';
    html += '<div class="lib-toolbar">' +
      '<button class="learn-chip' + (ui.exampleLevel === 0 ? " active" : "") + '" data-act="ex-level" data-level="0">全部难度</button>' +
      [1, 2, 3].map(l => '<button class="learn-chip' + (ui.exampleLevel === l ? " active" : "") + '" data-act="ex-level" data-level="' + l + '">' + "⭐".repeat(l) + '</button>').join("") +
      '</div>';

    let items = list.filter(e => ui.exampleCat === "all" || e.group === ui.exampleCat);
    if (ui.exampleLevel) items = items.filter(e => e.level === ui.exampleLevel);
    const q = ui.exampleQuery.trim().toLowerCase();
    if (q) items = items.filter(e => (e.title + e.desc + (e.code || "")).toLowerCase().indexOf(q) !== -1);

    html += '<div class="ex-list">';
    if (!items.length) html += '<div class="learn-empty">没有找到符合条件的示例~</div>';
    items.forEach(e => {
      const active = cur && cur.kind === "example" && cur.id === e.id;
      html += '<button class="ex-row' + (active ? " current" : "") + '" data-act="ex-open" data-id="' + e.id + '">' +
        '<span class="ex-row-state">' + e.emoji + '</span>' +
        '<span class="ex-row-title">' + esc(e.title) + '</span>' +
        '<span class="ex-row-lv">' + "⭐".repeat(Math.max(1, Math.min(3, e.level || 1))) + '</span>' +
        '</button>';
    });
    html += '</div>';
    body.innerHTML = html;

    const search = el("exSearch");
    if (search) {
      search.addEventListener("input", () => {
        ui.exampleQuery = search.value;
        const pos = search.selectionStart;
        renderExamplePanel(body);
        const el2 = el("exSearch");
        if (el2) { el2.focus(); try { el2.setSelectionRange(pos, pos); } catch (e) {} }
      });
    }
  }

  // ================= ✏️ 练习 =================
  function filteredExercises() {
    const p = progress();
    let items = bank();
    if (ui.exTopic !== "all") items = items.filter(e => e.topic === ui.exTopic);
    if (ui.exLevel) items = items.filter(e => e.level === ui.exLevel);
    if (ui.exStatus === "solved") items = items.filter(e => p && p.isSolved(e.id));
    else if (ui.exStatus === "todo") items = items.filter(e => !(p && p.isSolved(e.id)));
    else if (ui.exStatus === "tried") items = items.filter(e => p && p.isTried(e.id) && !p.isSolved(e.id));
    const q = ui.exQuery.trim().toLowerCase();
    if (q) items = items.filter(e => (e.id + e.title + e.desc + (e.tags || []).join("")).toLowerCase().indexOf(q) !== -1);
    return items;
  }

  function currentExercise() {
    if (!cur || cur.kind !== "exercise") return null;
    return bank().find(e => e.id === cur.id) || null;
  }

  function exerciseIndex() {
    const ex = currentExercise();
    if (!ex) return -1;
    const i = ui.sessionList.indexOf(ex.id);
    if (i >= 0) return i;
    return filteredExercises().findIndex(e => e.id === ex.id);
  }

  // 翻页顺序：优先用本次会话锁定的列表
  function navList() {
    if (ui.sessionList.length) return ui.sessionList;
    return filteredExercises().map(e => e.id);
  }

  function renderExercisePanel(body) {
    const all = bank();
    if (!all.length) { body.innerHTML = '<div class="learn-error">题库还没准备好…</div>'; return; }
    const p = progress();
    const st = p ? p.getStats() : { solved: {}, tried: {} };

    const ex = currentExercise();
    if (ex && !ui.exListReturn) {
      renderTaskCard(body, ex, st);
      return;
    }

    let html = '<div class="panel-mini-head">✏️ 练习题库 <span>' + Object.keys(st.solved || {}).length + '/' + all.length + '</span></div>';
    html += '<div class="lib-toolbar"><input class="learn-search" id="exQuery" placeholder="🔍 搜索题目" value="' + esc(ui.exQuery) + '"></div>';
    html += '<div class="lib-toolbar">' +
      '<button class="learn-chip' + (ui.exStatus === "todo" ? " active" : "") + '" data-act="ex-status" data-status="todo">还没做对</button>' +
      '<button class="learn-chip' + (ui.exStatus === "all" ? " active" : "") + '" data-act="ex-status" data-status="all">全部</button>' +
      '<button class="learn-chip' + (ui.exStatus === "tried" ? " active" : "") + '" data-act="ex-status" data-status="tried">做过没对</button>' +
      '<button class="learn-chip' + (ui.exStatus === "solved" ? " active" : "") + '" data-act="ex-status" data-status="solved">已做对</button>' +
      '</div>';
    html += '<div class="lib-toolbar">' +
      '<button class="learn-chip' + (ui.exLevel === 0 ? " active" : "") + '" data-act="ex-lv" data-level="0">全部关卡</button>' +
      levels().map(l => {
        const n = all.filter(e => e.level === l.id).length;
        if (!n) return "";
        return '<button class="learn-chip' + (ui.exLevel === l.id ? " active" : "") + '" data-act="ex-lv" data-level="' + l.id + '">' +
          l.emoji + ' ' + esc(l.name.split(" · ")[0]) + '</button>';
      }).join("") + '</div>';
    html += '<div class="lib-toolbar">' +
      '<button class="learn-chip' + (ui.exTopic === "all" ? " active" : "") + '" data-act="ex-topic" data-topic="all">全部主题</button>' +
      topics().filter(t => all.some(e => e.topic === t.id)).map(t => {
        const n = all.filter(e => e.topic === t.id).length;
        const done = all.filter(e => e.topic === t.id && st.solved[e.id]).length;
        return '<button class="learn-chip' + (ui.exTopic === t.id ? " active" : "") + '" data-act="ex-topic" data-topic="' + t.id + '">' +
          t.emoji + ' ' + esc(t.name) + ' <i>' + done + "/" + n + '</i></button>';
      }).join("") + '</div>';

    const items = filteredExercises();
    html += '<div class="ex-list-head">共 <b>' + items.length + '</b> 道，显示前 ' + Math.min(ui.exShown, items.length) + ' 道</div>';
    html += '<div class="ex-list">';
    items.slice(0, ui.exShown).forEach(e => {
      const ok = st.solved && st.solved[e.id];
      const tried = st.tried && st.tried[e.id];
      const tm = topicMeta(e.topic);
      html += '<button class="ex-row' + (ok ? " solved" : "") + '" data-act="ex-open-item" data-id="' + e.id + '">' +
        '<span class="ex-row-state">' + (ok ? "✅" : (tried ? "🔸" : "⬜")) + '</span>' +
        '<span class="ex-row-id">' + e.id + '</span>' +
        '<span class="ex-row-title">' + esc(e.title) + '</span>' +
        '<span class="ex-row-tag">' + tm.emoji + '</span>' +
        '<span class="ex-row-lv">' + levelMeta(e.level).emoji + '</span>' +
        '</button>';
    });
    if (!items.length) html += '<div class="learn-empty">没有符合条件的题目，换个筛选条件试试~</div>';
    html += '</div>';
    if (items.length > ui.exShown) {
      html += '<div class="ex-more"><button class="learn-btn primary" data-act="ex-more">加载更多（还有 ' + (items.length - ui.exShown) + ' 道）</button></div>';
    }
    body.innerHTML = html;

    const q = el("exQuery");
    if (q) {
      q.addEventListener("input", () => {
        ui.exQuery = q.value;
        ui.exShown = PAGE_SIZE;
        const pos = q.selectionStart;
        renderExercisePanel(body);
        const el2 = el("exQuery");
        if (el2) { el2.focus(); try { el2.setSelectionRange(pos, pos); } catch (e) {} }
      });
    }
  }

  // 题目卡（左栏）
  function renderTaskCard(body, ex, st) {
    if (!ex) { ui.exListReturn = true; renderExercisePanel(body); return; }
    const ok = st.solved && st.solved[ex.id];
    const tm = topicMeta(ex.topic);
    const lm = levelMeta(ex.level);
    const tests = ex.tests || [];
    const idx = exerciseIndex();
    const total = ui.sessionList.length || filteredExercises().length;

    let html = '<div class="panel-mini-head">' +
      '<button class="learn-mini-btn" data-act="ex-list">☰ 题目列表</button>' +
      '<span class="panel-mini-title">' + ex.id + '</span>' +
      (idx >= 0 ? '<span class="panel-mini-count">' + (idx + 1) + '/' + total + '</span>' : '') +
      '</div>';

    html += '<div class="task-card">' +
      '<div class="task-title">' + esc(ex.title) + (ok ? ' <span class="task-ok">已做对 ✅</span>' : '') + '</div>' +
      '<div class="task-meta">' + tm.emoji + ' ' + esc(tm.name) + ' · ' + lm.emoji + ' ' + esc(lm.name) + '</div>' +
      '<div class="task-body">' + rich(ex.desc) + '</div>';

    if (tests.length) {
      const t = tests[0];
      html += '<div class="task-sample"><div class="task-sample-title">📋 样例</div>' +
        '<div class="task-sample-row"><span>输入</span><pre>' + (t.in && t.in.trim() ? esc(t.in) : "（不需要输入）") + '</pre></div>' +
        '<div class="task-sample-row"><span>输出</span><pre>' + esc(norm(t.out)) + '</pre></div>' +
        '<div class="task-note">批改时会用 <b>' + tests.length + '</b> 组数据检查，全部通过才算做对。</div></div>';
    } else {
      html += '<div class="task-note">🎨 这道题要自己看效果给分：画出来以后点「🙋 我做出来了」。</div>';
    }

    html += '<details class="task-fold"><summary>💡 想不出来？点这里看提示</summary><div>' + rich(ex.hint) + '</div></details>';
    html += '<details class="task-fold"><summary>👀 参考答案（先自己想 3 分钟）</summary>' +
      '<pre class="lesson-code small">' + esc(ex.answer || "") + '</pre></details>';
    html += '</div>';

    if (judgeResult && judgeResult.id === ex.id) {
      html += '<div class="task-verdict ' + (judgeResult.pass ? "pass" : "fail") + '">' +
        (judgeResult.pass ? "🎉 全部通过！" : "🤔 还有 " + judgeResult.cases.filter(c => !c.ok).length + " 组没通过") +
        '<button class="learn-mini-btn" data-act="show-judge">看详细对比 →</button></div>';
    }
    body.innerHTML = html;
  }

  // ================= 📝 模拟考 =================
  function renderExamPanel(body) {
    const st = ui.examPaper;
    if (!st) {
      const p = progress();
      const stats = p ? p.getStats() : { exams: [] };
      let html = '<div class="panel-mini-head">📝 GESP 模拟考</div>';
      html += '<div class="exam-intro-desc">选一个级别，抽 10 道题组成小卷子（优先没做对过的题）。' +
        '每题 10 分，60 分及格。做完一题点一次「✅ 批改这题」，最后点「📮 交卷」。</div>';
      html += '<div class="exam-levels">' + levels().map(l => {
        const best = (stats.exams || []).filter(e => e.level === l.id).reduce((m, e) => Math.max(m, e.score || 0), 0);
        return '<button class="exam-level-card' + (ui.examLevel === l.id ? " active" : "") + '" data-act="exam-level" data-level="' + l.id + '">' +
          '<span class="exam-level-emoji">' + l.emoji + '</span>' +
          '<span class="exam-level-name">' + esc(l.name) + '</span>' +
          '<span class="exam-level-best">' + (best ? "最好成绩 " + best + " 分" : "还没考过") + '</span>' +
          '</button>';
      }).join("") + '</div>';
      html += '<button class="learn-btn primary big" data-act="exam-start">🚀 开始考试</button>';
      html += '<div class="learn-note">🔒 考试时会隐藏「提示」和「参考答案」，交卷后才能看。</div>';
      if ((stats.exams || []).length) {
        html += '<div class="exam-history"><div class="lesson-block-title">📊 我的考试记录</div>' +
          stats.exams.slice(-8).reverse().map(e =>
            '<div class="exam-history-row">' + levelMeta(e.level).emoji + ' ' + esc(levelMeta(e.level).name.split(" · ")[0]) +
            '<b class="' + (e.score >= 60 ? "ok" : "warn") + '">' + e.score + ' 分</b></div>').join("") + '</div>';
      }
      body.innerHTML = html;
      return;
    }

    if (ui.examDone) {
      const d = ui.examDone;
      let html = '<div class="panel-mini-head">📮 成绩单</div>';
      html += '<div class="exam-result ' + (d.score >= 60 ? "pass" : "fail") + '">' +
        '<div class="exam-result-score">' + d.score + '<span>分</span></div>' +
        '<div class="exam-result-text">' + (d.score >= 90 ? "🏆 太厉害了，可以放心去考 GESP 啦！" :
          d.score >= 60 ? "👏 及格啦，再练一练就更稳了。" : "💪 把没做对的题再练一遍就进步啦！") + '</div>' +
        '<div class="exam-result-sub">正确 ' + d.right + ' / ' + d.total + ' 题</div></div>';
      html += '<div class="lesson-block-title">❌ 错题重做</div><div class="ex-list">';
      if (!d.wrong.length) html += '<div class="learn-empty">全对，没有错题！</div>';
      d.wrong.forEach(id => {
        const ex = bank().find(e => e.id === id);
        if (!ex) return;
        html += '<button class="ex-row" data-act="ex-open-item" data-id="' + ex.id + '">' +
          '<span class="ex-row-state">❌</span><span class="ex-row-id">' + ex.id + '</span>' +
          '<span class="ex-row-title">' + esc(ex.title) + '</span></button>';
      });
      html += '</div>';
      html += '<button class="learn-btn primary big" data-act="exam-again">🔄 再考一次</button>';
      body.innerHTML = html;
      return;
    }

    const ids = st.ids;
    const curEx = bank().find(e => e.id === ids[ui.examIndex]);
    const answered = Object.keys(st.answers).length;
    const right = Object.values(st.answers).filter(a => a.pass).length;
    let html = '<div class="panel-mini-head">' + levelMeta(st.level).emoji + ' ' +
      esc(levelMeta(st.level).name.split(" · ")[0]) + ' 模拟考' +
      '<span class="panel-mini-count">' + right + '✔ / ' + answered + ' 批改</span></div>';
    html += '<div class="exam-nav">' + ids.map((id, i) => {
      const a = st.answers[id];
      const cls = a ? (a.pass ? "ok" : "bad") : (i === ui.examIndex ? "active" : "");
      return '<button class="exam-nav-dot ' + cls + '" data-act="exam-goto" data-i="' + i + '">' + (i + 1) + '</button>';
    }).join("") + '</div>';
    if (curEx) {
      const t = (curEx.tests || [])[0];
      html += '<div class="task-card">' +
        '<div class="task-title">第 ' + (ui.examIndex + 1) + ' 题 · ' + esc(curEx.title) + '</div>' +
        '<div class="task-meta">' + topicMeta(curEx.topic).emoji + ' ' + esc(topicMeta(curEx.topic).name) + ' · ' + levelMeta(curEx.level).emoji + '</div>' +
        '<div class="task-body">' + rich(curEx.desc) + '</div>';
      if (t) {
        html += '<div class="task-sample"><div class="task-sample-title">📋 样例</div>' +
          '<div class="task-sample-row"><span>输入</span><pre>' + (t.in && t.in.trim() ? esc(t.in) : "（不需要输入）") + '</pre></div>' +
          '<div class="task-sample-row"><span>输出</span><pre>' + esc(norm(t.out)) + '</pre></div></div>';
      }
      const a = st.answers[curEx.id];
      if (a) html += '<div class="task-verdict ' + (a.pass ? "pass" : "fail") + '">' + (a.pass ? "✅ 这题通过（10 分）" : "❌ 这题还没通过，看看右边的对比") + '</div>';
      html += '</div>';
    }
    html += '<button class="learn-btn success big" data-act="exam-submit">📮 交卷</button>';
    html += '<button class="learn-btn" data-act="exam-quit">退出考试</button>';
    body.innerHTML = html;
  }

  // ================= 🏆 成就 =================
  function renderAward(body) {
    const p = progress();
    if (!p) { body.innerHTML = '<div class="learn-error">成长数据还没准备好…</div>'; return; }
    const info = p.getLevel();
    const st = p.getStats();
    const medals = p.getMedals();
    const badges = p.getBadges();
    const domains = p.getDomains();
    const gotMedals = medals.filter(m => m.got).length;
    const gotBadges = badges.filter(b => b.got).length;

    let html = '<div class="award-hero">' +
      '<div class="award-emoji">' + info.emoji + '</div>' +
      '<div class="award-main"><div class="award-level">Lv.' + info.level + ' · ' + esc(info.title) + '</div>' +
      '<div class="award-bar"><span style="width:' + info.percent + '%"></span></div>' +
      '<div class="award-xp">' + (info.isMax ? "已经满级啦！" : info.cur + " / " + info.need + " 经验") + ' · 总经验 ' + (st.xp || 0) + '</div></div>' +
      '</div>';

    html += '<div class="award-stats">' +
      '<div class="award-stat"><b>' + gotBadges + "/" + badges.length + '</b><span>成就徽章</span></div>' +
      '<div class="award-stat"><b>' + gotMedals + "/" + medals.length + '</b><span>奖牌</span></div>' +
      '<div class="award-stat"><b>' + Object.keys(st.solved || {}).length + '</b><span>做对练习</span></div>' +
      '<div class="award-stat"><b>' + Object.keys(st.lessons || {}).length + '</b><span>学完课程</span></div>' +
      '<div class="award-stat"><b>' + (st.streak || 0) + '</b><span>连续学习(天)</span></div>' +
      '<div class="award-stat"><b>' + draftCount() + '</b><span>学堂草稿</span></div>' +
      '</div>';

    html += '<div class="lesson-block-title">💪 技能熟练度（做对越多，奖牌越亮）</div><div class="skill-grid">';
    domains.forEach(d => {
      const next = d.score < 6 ? 6 : d.score < 20 ? 20 : d.score < 45 ? 45 : d.score;
      const pct = Math.min(100, Math.round(d.score / next * 100));
      html += '<div class="skill-row"><span class="skill-name">' + d.emoji + ' ' + esc(d.name) + '</span>' +
        '<span class="skill-bar"><span style="width:' + pct + '%"></span></span>' +
        '<span class="skill-count">' + d.score + (d.score >= 45 ? " 🥇" : d.score >= 20 ? " 🥈" : d.score >= 6 ? " 🥉" : "/6") + '</span></div>';
    });
    html += '</div>';

    html += '<div class="lesson-block-title">🥇 奖牌墙 ' + gotMedals + "/" + medals.length + '</div><div class="medal-grid big">';
    medals.forEach(m => {
      html += '<div class="medal-item tier-' + (m.tier || "bronze") + (m.got ? "" : " locked") + '" title="' + esc(m.desc) + '">' +
        '<span class="medal-emoji">' + (m.got ? m.emoji : "🔒") + '</span>' +
        '<span class="medal-title">' + esc(m.title) + '</span>' +
        '<span class="medal-desc">' + esc(m.desc) + '</span></div>';
    });
    html += '</div>';

    const cats = [];
    badges.forEach(b => { if (cats.indexOf(b.cat) === -1) cats.push(b.cat); });
    html += '<div class="lesson-block-title">🏅 成就徽章 ' + gotBadges + "/" + badges.length + '</div>';
    cats.forEach(cat => {
      const group = badges.filter(b => b.cat === cat);
      const got = group.filter(b => b.got).length;
      html += '<div class="badge-cat-title">' + esc(cat) + ' (' + got + "/" + group.length + ')</div><div class="badge-list big">';
      group.forEach(b => {
        html += '<div class="badge-item' + (b.got ? "" : " locked") + '" title="' + esc(b.desc) + '">' +
          '<span class="badge-emoji">' + (b.got ? b.emoji : "🔒") + '</span>' +
          '<span class="badge-title">' + esc(b.title) + '</span>' +
          '<span class="badge-desc">' + esc(b.desc) + '</span></div>';
      });
      html += '</div>';
    });

    body.innerHTML = html;
  }

  // ================= 任务条 / 操作条 =================
  function updateTaskBar() {
    if (!isActive()) return;
    const crumb = el("learnTaskCrumb");
    const prog = el("learnTaskProgress");
    const saveBtn = el("btnLearnSaveToLib");
    if (!crumb) return;

    if (cur && cur.kind === "lesson") {
      const l = lessons().find(x => x.id === cur.id);
      crumb.textContent = l ? "📚 教程 · " + l.title : "📚 教程";
    } else if (cur && cur.kind === "example") {
      const e = exampleList().find(x => x.id === cur.id);
      crumb.textContent = e ? "🎁 示例 · " + e.title : "🎁 示例";
    } else if (cur && cur.kind === "exercise") {
      const e = bank().find(x => x.id === cur.id);
      crumb.textContent = e ? "✏️ 练习 " + e.id + " · " + e.title : "✏️ 练习";
    } else if (cur && cur.kind === "exam") {
      const e = bank().find(x => x.id === cur.id);
      crumb.textContent = e ? "📝 模拟考 · 第 " + (ui.examIndex + 1) + " 题 · " + e.title : "📝 模拟考";
    } else {
      crumb.textContent = "🎓 学堂";
    }

    if (prog) {
      if (cur && cur.kind === "exercise") {
        const idx = exerciseIndex();
        prog.textContent = idx >= 0 ? "第 " + (idx + 1) + " 题" : "";
      } else if (cur && cur.kind === "exam" && ui.examPaper) {
        const sec = Math.floor((Date.now() - ui.examPaper.startedAt) / 1000);
        prog.textContent = "⏱ " + String(Math.floor(sec / 60)).padStart(2, "0") + ":" + String(sec % 60).padStart(2, "0") +
          " · 已批改 " + Object.keys(ui.examPaper.answers).length + "/" + ui.examPaper.ids.length;
      } else {
        prog.textContent = cur ? "💾 草稿自动保存" + (draftCount() ? "（共 " + draftCount() + " 份）" : "") : "";
      }
    }
    if (saveBtn) saveBtn.style.display = cur ? "inline-flex" : "none";

    const layoutGroup = el("learnLayoutGroup");
    if (layoutGroup) layoutGroup.classList.toggle("show", !!(cur && cur.kind === "lesson"));
    const compareBtn = el("btnCompare");
    if (compareBtn) compareBtn.classList.toggle("show", !!(cur && cur.kind === "example"));
    const focusBtn = el("btnFocus");
    if (focusBtn) focusBtn.classList.toggle("show", !!cur);
    markerLayoutButtons();
  }

  function startExamTimer() {
    stopExamTimer();
    examTimer = setInterval(() => { if (isActive() && section === "exam") updateTaskBar(); }, 1000);
  }

  function stopExamTimer() {
    if (examTimer) { clearInterval(examTimer); examTimer = null; }
  }

  function renderActionBar() {
    const bar = el("learnActionBar");
    if (!bar) return;
    let html = "";
    if (cur && cur.kind === "exercise") {
      const ex = currentExercise();
      const selfCheck = !ex || !(ex.tests || []).length;
      html += '<button class="learn-act primary" data-act="' + (selfCheck ? "selfcheck" : "judge") + '">' +
        (selfCheck ? "🙋 我做出来了" : "✅ 交卷批改 <i>Ctrl+Shift+↵</i>") + '</button>';
      html += '<button class="learn-act" data-act="run">▶ 运行 <i>Ctrl+↵</i></button>';
      html += '<button class="learn-act" data-act="prev">◀ 上一题</button>';
      html += '<button class="learn-act" data-act="next">下一题 ▶</button>';
    } else if (cur && cur.kind === "lesson") {
      html += '<button class="learn-act success" data-act="finish-lesson">✅ 我学会了 <i>+15✨</i></button>';
      html += '<button class="learn-act" data-act="lesson-run">▶ 运行示例</button>';
      html += '<button class="learn-act" data-act="lesson-prev">◀ 上一课</button>';
      html += '<button class="learn-act" data-act="lesson-next">下一课 ▶</button>';
    } else if (cur && cur.kind === "example") {
      html += '<button class="learn-act primary" data-act="run">▶ 运行 <i>Ctrl+↵</i></button>';
      html += '<button class="learn-act" data-act="ex-reset">↺ 还原示例代码</button>';
    } else if (cur && cur.kind === "exam") {
      html += '<button class="learn-act primary" data-act="exam-judge">✅ 批改这题 <i>Ctrl+Shift+↵</i></button>';
      html += '<button class="learn-act" data-act="run">▶ 运行 <i>Ctrl+↵</i></button>';
      html += '<button class="learn-act" data-act="exam-prev">◀ 上一题</button>';
      html += '<button class="learn-act" data-act="exam-next">下一题 ▶</button>';
    }
    bar.innerHTML = html + '<span class="learn-act-status" id="learnActStatus"></span>';
  }

  function setStatus(text) {
    const s = el("learnActStatus");
    if (s) s.textContent = text || "";
  }

  // ================= 把内容装进编辑器（沙盒） =================
  function templateFor(kind, id) {
    if (kind === "exercise" || kind === "exam") {
      const ex = bank().find(e => e.id === id);
      return ex ? starterCode(ex) : "";
    }
    if (kind === "lesson") {
      const l = lessons().find(x => x.id === id);
      return l ? (l.code || "") + "\n" : "";
    }
    if (kind === "example") {
      const e = exampleList().find(x => x.id === id);
      return e ? (e.code || "") + "\n" : "";
    }
    return "";
  }

  function loadIntoEditor(kind, id) {
    flushDraft();
    cur = { kind: kind, id: id };
    const d = getDraft(id);
    const code = d ? d.code : templateFor(kind, id);
    if (typeof CodeEditor !== "undefined" && CodeEditor.setValue) CodeEditor.setValue(code);
    judgeResult = null;
    updateTaskBar();
    renderActionBar();
  }

  function starterCode(ex) {
    const lines = [];
    lines.push("# " + ex.id + " · " + ex.title);
    lines.push("# " + "-".repeat(46));
    String(ex.desc || "").split("\n").forEach(l => lines.push("# " + l));
    if (ex.tests && ex.tests.length) {
      const t = ex.tests[0];
      if (t.in && t.in.trim()) {
        lines.push("# ");
        lines.push("# 输入示例：");
        t.in.split("\n").forEach(l => lines.push("#   " + l));
      }
      lines.push("# 输出示例：");
      norm(t.out).split("\n").slice(0, 6).forEach(l => lines.push("#   " + l));
    }
    lines.push("# " + "-".repeat(46));
    lines.push("# 👇 在下面写你的代码吧：");
    lines.push("");
    lines.push("");
    return lines.join("\n");
  }

  function currentEditorCode() {
    try {
      if (typeof CodeEditor !== "undefined" && CodeEditor.getValue) return CodeEditor.getValue();
    } catch (e) {}
    return "";
  }

  // ================= 判题 =================
  function showJudgeView() {
    if (window.App && App.switchToTab) App.switchToTab("judge");
  }

  function renderJudgeResult(res) {
    const target = el("judgeBody");
    if (!target) return;
    if (!res) {
      target.innerHTML = '<div class="learn-empty">还没有批改记录。写完代码点「✅ 交卷批改」试试~</div>';
      return;
    }
    let html = '<div class="judge-result ' + (res.pass ? "pass" : "fail") + '">';
    html += '<div class="judge-head">' + (res.pass ? "🎉 全部通过，太棒啦！" : "🤔 还没全对，一起看看哪里不一样") +
      '<span class="judge-time">用时 ' + Math.round(res.totalMs || 0) + ' 毫秒</span></div>';

    if (res.syntax) {
      html += '<div class="judge-syntax">📛 你的代码暂时跑不起来：<br><code>' +
        esc((res.syntaxMessage || "").split("\n").slice(-1)[0] || "") + '</code>' +
        '<div class="judge-tip">小提示：检查括号、引号是不是成对的，if / for / while / def 那行末尾有没有漏掉英文冒号 <b>:</b>。也可以用编辑器上方的「🩺 标点体检」。</div></div>';
      if (res.line) html += '<div class="judge-tip">出问题的大概在第 ' + res.line + ' 行附近。</div>';
      html += '</div>';
      target.innerHTML = html;
      return;
    }

    res.cases.forEach((c, i) => {
      html += '<div class="judge-case ' + (c.ok ? "ok" : "bad") + '">' +
        '<div class="judge-case-head">' + (c.ok ? "✅ 第 " + (i + 1) + " 组通过" : "❌ 第 " + (i + 1) + " 组没通过") + '</div>' +
        '<div class="judge-case-grid">' +
        '<div><div class="judge-label">题目给的输入</div><pre>' + (c.input && c.input.trim() ? esc(c.input) : "（不需要输入）") + '</pre></div>' +
        '<div><div class="judge-label">应该输出</div><pre>' + esc(norm(c.want)) + '</pre></div>' +
        '<div><div class="judge-label">你的程序输出</div><pre>' + (c.got && c.got.trim() ? esc(norm(c.got)) : "（没有任何输出）") + '</pre></div>' +
        '</div>';
      if (!c.ok && c.err) html += '<div class="judge-err">' + esc(kidFriendlyError(c.err, c.timedOut)) + '</div>';
      else if (!c.ok && !norm(c.got)) html += '<div class="judge-err">你的程序什么都没打印出来。记得用 print() 把答案输出哦。</div>';
      else if (!c.ok) html += '<div class="judge-err">再仔细对比一下：是不是多了空格、少了换行，或者格式和题目要求不一样？</div>';
      html += '</div>';
    });
    html += '</div>';
    target.innerHTML = html;
  }

  function kidFriendlyError(errText, timedOut) {
    const t = String(errText || "");
    if (timedOut || t.indexOf("KeyboardInterrupt") !== -1) return "⏰ 程序跑太久被停下来了：检查一下循环有没有能结束的条件。";
    if (t.indexOf("EOFError") !== -1) return "💬 程序还在等输入，但题目的输入已经用完了：检查 input() 是不是写多了，或者该用一次 input().split() 读一行。";
    if (t.indexOf("SyntaxError") !== -1 || t.indexOf("IndentationError") !== -1) return "📛 语法有点小问题：检查标点是不是英文、缩进是不是对齐、冒号有没有漏。";
    if (t.indexOf("NameError") !== -1) {
      const m = t.match(/name '([^']+)' is not defined/);
      return "🔍 电脑不认识这个名字" + (m ? "「" + m[1] + "」" : "") + "：检查有没有拼错，或者变量还没赋值就先用了。";
    }
    if (t.indexOf("ValueError") !== -1) return "🔢 数字转换出了问题：如果输入里可能有非数字，用 int(input()) 之前要想清楚哦。";
    if (t.indexOf("TypeError") !== -1) return "🧩 类型对不上：文字和数字不能直接相加，可以先用 str() 或 int() 转换。";
    if (t.indexOf("IndexError") !== -1) return "📚 下标越界了：记住列表是从 0 开始数的。";
    if (t.indexOf("ZeroDivisionError") !== -1) return "➗ 不能除以 0 哦，检查一下除数。";
    const last = t.trim().split("\n").filter(Boolean).slice(-1)[0] || "出现了未知的小状况";
    return "❌ " + last.slice(0, 120);
  }

  async function runTests(code, tests) {
    const cases = [];
    let totalMs = 0;
    let firstErr = "";
    let errLine = 0;
    let pass = true;
    for (let i = 0; i < tests.length; i++) {
      const t = tests[i];
      let r;
      try { r = await PythonRunner.judge(code, t.in || "", JUDGE_TIMEOUT_MS); }
      catch (e) { r = { out: "", err: (e && e.message) || "批改失败", timedOut: false, ms: 0 }; }
      totalMs += r.ms || 0;
      const got = norm(r.out);
      const want = norm(t.out);
      const ok = !r.err && got === want;
      if (!ok) {
        pass = false;
        if (r.err && !firstErr) { firstErr = r.err; errLine = r.line || 0; }
      }
      cases.push({ ok: ok, input: t.in || "", got: r.out || "", want: t.out || "", err: r.err || "", timedOut: !!r.timedOut });
      if (r.err && /SyntaxError|IndentationError|TabError/.test(r.err)) break;
    }
    const syntax = !!firstErr && /SyntaxError|IndentationError|TabError/.test(firstErr);
    return { pass: pass, cases: cases, totalMs: totalMs, syntax: syntax, syntaxMessage: syntax ? firstErr : "", line: errLine };
  }

  function playRewards(rewards) {
    const p = progress();
    const lines = p ? p.describeRewards(rewards) : [];
    lines.forEach((l, i) => setTimeout(() => toast(l, "🌟"), 800 * (i + 1)));
  }

  async function judgeCurrent() {
    const ex = currentExercise();
    if (!ex || busy) return;
    const code = currentEditorCode();
    if (!code.trim()) { toast("编辑器里还是空的，先写点代码吧~", "📝"); return; }
    if (typeof PythonRunner === "undefined" || !PythonRunner.judge) { toast("Python 还没准备好，稍等几秒~", "⏳"); return; }

    busy = true;
    setStatus("⏳ 正在批改…");
    const startedAt = Date.now();
    const res = await runTests(code, ex.tests || []);
    res.id = ex.id;
    judgeResult = res;
    busy = false;

    renderJudgeResult(res);
    showJudgeView();
    renderPanel();
    renderHud();

    const seconds = Math.round((Date.now() - startedAt) / 1000);
    const p = progress();
    let rewards = null;
    if (p) rewards = p.recordExercise({ id: ex.id, topic: ex.topic, level: ex.level, passed: res.pass, seconds: seconds });

    if (res.pass) {
      celebrate();
      sound("playSuccess");
      const solvedN = p ? Object.keys(p.getStats().solved).length : 0;
      setStatus("🎉 全对！" + (rewards && !rewards.solvedBefore ? " +" + rewards.xp + "✨" : " 复习完成"));
      toast(rewards && !rewards.solvedBefore ? "🎉 做对啦！这是第 " + solvedN + " 题" : "✅ 又复习了一遍，真棒！", "🎉");
      playRewards(rewards);
      offerNext();
    } else {
      sound("playWarning");
      setStatus("❌ " + res.cases.filter(c => !c.ok).length + "/" + res.cases.length + " 组没通过，看看右边的对比");
      toast("差一点点，右边看对比就知道啦~", "🔍");
    }
  }

  // 全对后：3 秒倒计时自动进入下一题（可以点「留在这题」取消）
  function offerNext() {
    stopAutoNext();
    const bar = el("learnActionBar");
    if (!bar) return;
    const chip = document.createElement("span");
    chip.className = "learn-next-chip";
    chip.innerHTML = '<b>🎉 全对！</b><span class="next-text"> 3 秒后自动进入下一题</span>' +
      '<button class="learn-mini-btn" data-act="stay">留在这题</button>';
    bar.appendChild(chip);
    let left = 3;
    autoNextTimer = setInterval(() => {
      left -= 1;
      const t = chip.querySelector(".next-text");
      if (left <= 0) { stopAutoNext(); goNext(); return; }
      if (t) t.textContent = " " + left + " 秒后自动进入下一题";
    }, 1000);
  }

  function stopAutoNext() {
    if (autoNextTimer) { clearInterval(autoNextTimer); autoNextTimer = null; }
    const chip = document.querySelector(".learn-next-chip");
    if (chip && chip.parentNode) chip.parentNode.removeChild(chip);
  }

  // ================= 导航 =================
  function goPrev() {
    if (!cur) return;
    if (cur.kind === "exercise") {
      const list = navList();
      const i = list.indexOf(cur.id);
      if (i > 0) openExercise(list[i - 1], false);
      else toast("已经是第一题啦", "🙂");
    } else if (cur.kind === "lesson") {
      const ls = lessons();
      const i = ls.findIndex(l => l.id === cur.id);
      if (i > 0) openLesson(ls[i - 1].id);
    } else if (cur.kind === "exam") {
      ui.examIndex = Math.max(0, ui.examIndex - 1);
      loadExamQuestion();
    }
  }

  function goNext() {
    if (!cur) return;
    if (cur.kind === "exercise") {
      const list = navList();
      const i = list.indexOf(cur.id);
      if (i >= 0 && i < list.length - 1) openExercise(list[i + 1], false);
      else toast("这一批题目做完啦，换个筛选条件继续吧！", "🎉");
    } else if (cur.kind === "lesson") {
      const ls = lessons();
      const i = ls.findIndex(l => l.id === cur.id);
      if (i >= 0 && i < ls.length - 1) openLesson(ls[i + 1].id);
      else toast("课程都学完啦，太厉害了！", "🎓");
    } else if (cur.kind === "exam") {
      ui.examIndex = Math.min(ui.examPaper.ids.length - 1, ui.examIndex + 1);
      loadExamQuestion();
    }
  }

  function openExercise(id, keepList) {
    stopAutoNext();
    section = "exercise";
    ui.exListReturn = !!keepList;
    // 打开题目时锁定本次做题顺序（刚做完的题会被「还没做对」筛掉，不能再依赖实时筛选）
    if (!ui.sessionList.length || ui.sessionList.indexOf(id) === -1) {
      ui.sessionList = filteredExercises().map(e => e.id);
      if (ui.sessionList.indexOf(id) === -1) ui.sessionList.unshift(id);
    }
    loadIntoEditor("exercise", id);
    document.body.classList.remove("learn-wide");
    hideLessonHost();
    applyLayout();
    markTab("exercise");
    renderPanel();
    renderJudgeResult(null);
    sound("playPop");
  }

  function openLesson(id) {
    stopAutoNext();
    section = "lesson";
    loadIntoEditor("lesson", id);
    document.body.classList.remove("learn-wide");
    markTab("lesson");
    renderPanel();
    renderHud();
    sound("playPop");
  }

  function openExample(id) {
    stopAutoNext();
    section = "example";
    ui.exampleDetail = true;
    loadIntoEditor("example", id);
    document.body.classList.remove("learn-wide");
    hideLessonHost();
    applyLayout();
    markTab("example");
    renderPanel();
    renderCompare();
    updateTaskBar();
    sound("playPop");
  }

  // ================= 模拟考 =================
  function buildPaper(level, count) {
    const p = progress();
    const pool = bank().filter(e => e.level === level && (e.tests || []).length);
    if (!pool.length) return [];
    const unsolved = pool.filter(e => !(p && p.isSolved(e.id)));
    const source = unsolved.length >= count ? unsolved : pool;
    const byTopic = {};
    source.forEach(e => { (byTopic[e.topic] = byTopic[e.topic] || []).push(e); });
    const tids = Object.keys(byTopic).sort(() => Math.random() - 0.5);
    tids.forEach(t => byTopic[t].sort(() => Math.random() - 0.5));
    const picked = [];
    let round = 0;
    while (picked.length < count && round < 30) {
      for (const t of tids) {
        const item = byTopic[t][round];
        if (item && picked.length < count) picked.push(item.id);
      }
      round++;
    }
    return picked;
  }

  function startExam() {
    const ids = buildPaper(ui.examLevel, 10);
    if (!ids.length) { toast("这个级别还没有可考的题目~", "📝"); return; }
    ui.examPaper = { level: ui.examLevel, ids: ids, answers: {}, codes: {}, startedAt: Date.now() };
    ui.examIndex = 0;
    ui.examDone = null;
    startExamTimer();
    loadExamQuestion();
    toast("📝 开始考试！做完一题点一次「批改这题」", "🚀");
  }

  // 考试中途离开一道题（下一题 / 点题号 / 交卷前）时，把它写的代码收进试卷里
  function saveExamCode() {
    const st = ui.examPaper;
    if (!st || !cur || cur.kind !== "exam" || !cur.id) return;
    st.codes = st.codes || {};
    st.codes[cur.id] = currentEditorCode();
  }

  function loadExamQuestion() {
    const st = ui.examPaper;
    if (!st) return;
    saveExamCode();                       // ← 关键：换题前先把上一题写的存下来
    const id = st.ids[ui.examIndex];
    flushDraft();
    cur = { kind: "exam", id: id };
    const ex = bank().find(e => e.id === id);
    st.codes = st.codes || {};
    // 回来时优先恢复自己写过的版本，没有再给起始模板（以前这里每次都重置，孩子翻回去答案就没了）
    const saved = st.codes[id];
    CodeEditor.setValue(typeof saved === "string" ? saved : starterCode(ex));
    judgeResult = null;
    hideLessonHost();
    applyLayout();
    renderPanel();
    renderActionBar();
    updateTaskBar();
    renderJudgeResult(null);
  }

  async function judgeExamQuestion() {
    const st = ui.examPaper;
    if (!st || busy) return;
    const ex = bank().find(e => e.id === st.ids[ui.examIndex]);
    if (!ex) return;
    const code = currentEditorCode();
    if (!code.trim()) { toast("先写点代码再来批改吧~", "📝"); return; }
    saveExamCode();
    busy = true;
    setStatus("⏳ 正在批改…");
    const res = await runTests(code, ex.tests || []);
    st.answers[ex.id] = res;
    busy = false;
    renderJudgeResult(Object.assign({ id: ex.id }, res));
    showJudgeView();
    renderPanel();
    updateTaskBar();
    if (res.pass) { sound("playSuccess"); setStatus("✅ 这题通过！可以点「下一题」了"); }
    else { sound("playWarning"); setStatus("❌ 这题还没通过，右边看看对比"); }
  }

  function submitExam() {
    const st = ui.examPaper;
    if (!st) return;
    saveExamCode();
    const right = Object.values(st.answers).filter(a => a.pass).length;
    const score = Math.round(right / st.ids.length * 100);
    const wrong = st.ids.filter(id => !(st.answers[id] && st.answers[id].pass));
    const p = progress();
    let rewards = null;
    if (p) rewards = p.recordExam({ level: st.level, score: score, total: 100 });
    ui.examDone = { score: score, right: right, total: st.ids.length, wrong: wrong };
    stopExamTimer();
    renderPanel();
    renderHud();
    if (score >= 60) { celebrate(); sound("playSuccess"); } else { sound("playWarning"); }
    toast(score >= 90 ? "🏆 " + score + " 分，太厉害了！" : score >= 60 ? "👏 及格啦！" + score + " 分" : "💪 这次 " + score + " 分，错题再练一遍吧", score >= 60 ? "🎉" : "📝");
    playRewards(rewards);
  }

  // ================= 存进作品库 =================
  function saveToLibrary() {
    if (!cur) { toast("现在没有正在学的内容哦", "🙂"); return; }
    const code = currentEditorCode();
    if (!code.trim()) { toast("代码还是空的，先写点内容吧~", "📝"); return; }
    let name = "学堂作品.py";
    if (cur.kind === "exercise" || cur.kind === "exam") {
      const ex = bank().find(e => e.id === cur.id);
      if (ex) name = "练习_" + ex.id + "_" + String(ex.title).replace(/[\\/:*?"<>|]/g, "").slice(0, 16) + ".py";
    } else if (cur.kind === "lesson") {
      const l = lessons().find(x => x.id === cur.id);
      if (l) name = "教程_" + l.id + "_" + String(l.title).replace(/[\\/:*?"<>|]/g, "").slice(0, 14) + ".py";
    } else if (cur.kind === "example") {
      const e = exampleList().find(x => x.id === cur.id);
      if (e) name = "示例_" + String(e.title).replace(/[\\/:*?"<>|]/g, "").slice(0, 16) + ".py";
    }
    const file = FileManager.createFile(name, code);
    toast("📌 已存进作品库：" + file.name, "💾");
    sound("playSuccess");
    setStatus("已存进作品库：" + file.name);
  }

  // ================= 事件 =================
  function bindEvents() {
    const taskBar = el("learnTaskBar");
    if (taskBar) taskBar.addEventListener("click", handleAction);

    window.addEventListener("pointermove", onSplitterMove);
    window.addEventListener("pointerup", onSplitterUp);
    window.addEventListener("pointercancel", onSplitterUp);
    window.addEventListener("resize", () => {
      if (resizeTimer) clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => { resizeTimer = null; applyLayout(); }, 150);
    });

    const tabs = el("learnTabs");
    if (tabs) {
      tabs.addEventListener("click", (e) => {
        const btn = e.target.closest(".learn-tab");
        if (btn) { stopAutoNext(); goto(btn.dataset.tab); sound("playPop"); }
      });
    }
    const exitBtn = el("btnLearnExit");
    if (exitBtn) exitBtn.addEventListener("click", exit);

    const saveBtn = el("btnLearnSaveToLib");
    if (saveBtn) saveBtn.addEventListener("click", saveToLibrary);

    const panel = el("learnBody");
    if (panel) panel.addEventListener("click", handleAction);

    const bar = el("learnActionBar");
    if (bar) bar.addEventListener("click", handleAction);

    const judgeTab = el("tabBtnJudge");
    if (judgeTab && !judgeTab.dataset.bound) {
      judgeTab.dataset.bound = "1";
      judgeTab.addEventListener("click", () => { renderJudgeResult(judgeResult); showJudgeView(); });
    }

    // 学堂里的快捷键：Ctrl+Shift+Enter 交卷批改、Alt+←/→ 上下一题
    // （Ctrl+Enter 运行由主程序的全局快捷键负责）
    window.addEventListener("keydown", (e) => {
      if (!isActive()) return;
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === "Enter") {
        e.preventDefault();
        e.stopPropagation();
        if (cur && cur.kind === "exercise") judgeCurrent();
        else if (cur && cur.kind === "exam") judgeExamQuestion();
      } else if (e.altKey && (e.key === "1" || e.key === "2" || e.key === "3")) {
        if (cur && cur.kind === "lesson") {
          e.preventDefault();
          setLayout({ "1": "read", "2": "half", "3": "code" }[e.key]);
        }
      } else if (e.altKey && (e.key === "ArrowUp" || e.key === "ArrowDown")) {
        if (cur && cur.kind === "lesson" && section === "lesson") {
          e.preventDefault();
          const st = layoutFor("lesson");
          const delta = e.key === "ArrowUp" ? 0.05 : -0.05;
          st.mode = "half";
          st.ratio = Math.max(0.06, Math.min(0.94, (st.ratio || 0.5) + delta));
          loadLayout().lesson = st;
          persistLayout();
          applyLayout();
          setStatus("讲解 " + Math.round(st.ratio * 100) + "% · 代码 " + Math.round((1 - st.ratio) * 100) + "%");
        }
      } else if (e.key === "Escape" && document.body.classList.contains("learn-focus")) {
        e.preventDefault();
        toggleFocus(false);
      } else if (e.altKey && e.key === "ArrowRight") {
        e.preventDefault();
        stopAutoNext();
        goNext();
      } else if (e.altKey && e.key === "ArrowLeft") {
        e.preventDefault();
        stopAutoNext();
        goPrev();
      }
    }, true);
  }

  function handleAction(e) {
    const btn = e.target.closest("[data-act]");
    if (!btn) return;
    const act = btn.dataset.act;
    const p = progress();
    if (act !== "stay") stopAutoNext();

    switch (act) {
      // ---- 地图 / 通用 ----
      case "stage": {
        const l = lessons().find(x => x.stage === Number(btn.dataset.stage));
        if (l) openLesson(l.id);
        break;
      }
      case "unit": {
        const l = lessons().find(x => x.unit === btn.dataset.unit);
        if (l) openLesson(l.id);
        break;
      }
      case "go-lesson":
        openLesson(btn.dataset.id);
        break;
      case "go-ex":
        openExercise(btn.dataset.id, false);
        break;
      case "go-practice":
        ui.exListReturn = true;
        ui.sessionList = [];
        goto("exercise");
        break;

      // ---- 教程 ----
      case "lesson":
        openLesson(btn.dataset.id);
        break;
      case "lesson-fold": {
        // 老按钮：在「代码优先」和「各一半」之间切换
        const st = layoutFor("lesson");
        setLayout(st.mode === "code" ? "half" : "code");
        break;
      }
      case "layout":
        setLayout(btn.dataset.mode);
        break;
      case "compare":
        toggleCompare();
        break;
      case "compare-close":
        toggleCompare(false);
        break;
      case "focus":
        toggleFocus();
        break;
      case "lesson-code-to-editor": {
        const l = lessons().find(x => x.id === cur.id);
        if (l) {
          CodeEditor.setValue((l.code || "") + "\n");
          const st = layoutFor("lesson");
          if (st.mode === "read") {
            setLayout("code", { silent: true });
            toast("↓ 代码已放进编辑器，讲解先收起来让你专心写（点「📖」随时翻回去）", "⌨️");
          } else {
            toast("↓ 示例代码已经放进编辑器，动手改改看~", "✏️");
          }
        }
        break;
      }
      case "lesson-run": {
        const l = lessons().find(x => x.id === cur.id);
        if (!l) break;
        CodeEditor.setValue((l.code || "") + "\n");
        if (p) p.recordLessonRun();
        runEditorCode();
        break;
      }
      case "finish-lesson": {
        const l = lessons().find(x => x.id === cur.id);
        if (!l || !p) break;
        const wasDone = p.isLessonDone(l.id);
        const res = p.recordLesson(l);
        renderPanel();
        renderHud();
        renderActionBar();
        if (!wasDone) {
          celebrate();
          sound("playSuccess");
          toast("🎓 学完《" + l.title + "》，+" + ((res && res.xp) || 15) + " 经验！", "🎉");
          playRewards(res);
        } else {
          toast("又复习了一遍，真棒！", "👍");
        }
        break;
      }
      case "lesson-prev": goPrev(); break;
      case "lesson-next": goNext(); break;
      case "quiz": {
        const l = lessons().find(x => x.id === cur.id);
        const qi = Number(btn.dataset.q);
        const oi = Number(btn.dataset.o);
        const q = l && l.quiz && l.quiz[qi];
        if (!q) break;
        const card = btn.closest(".lesson-quiz");
        const fb = card ? card.querySelector(".quiz-feedback") : null;
        const right = Number(q.answer) === oi;
        Array.prototype.forEach.call(card.querySelectorAll(".quiz-option"), (b, i) => {
          b.classList.toggle("right", i === Number(q.answer));
          b.classList.toggle("wrong", i === oi && !right);
        });
        if (fb) fb.innerHTML = right ? '<span class="ok">🎉 答对啦！</span> ' + rich(q.tip || "") :
          '<span class="warn">再想想～</span> ' + rich(q.tip || "");
        if (p) p.recordQuiz(right);
        if (right) { sound("playSuccess"); renderHud(); }
        break;
      }
      case "practice-topic":
        ui.exTopic = btn.dataset.topic;
        ui.exLevel = 0;
        ui.exStatus = "all";
        ui.exShown = PAGE_SIZE;
        ui.exListReturn = true;
        ui.sessionList = [];
        section = "exercise";
        goto("exercise");
        break;

      // ---- 示例 ----
      case "ex-cat":
        ui.exampleCat = btn.dataset.cat;
        ui.exampleDetail = false;
        renderPanel();
        break;
      case "ex-level":
        ui.exampleLevel = Number(btn.dataset.level);
        ui.exampleDetail = false;
        renderPanel();
        break;
      case "ex-open":
        openExample(btn.dataset.id);
        break;
      case "ex-open-item":
        openExercise(btn.dataset.id, false);
        break;
      case "ex-back":
        ui.exampleDetail = false;
        renderPanel();
        break;
      case "ex-run": {
        const ex = exampleList().find(x => x.id === cur.id);
        if (!ex) break;
        CodeEditor.setValue((ex.code || "") + "\n");
        runEditorCode();
        break;
      }
      case "ex-reset": {
        const ex = exampleList().find(x => x.id === cur.id);
        if (!ex) break;
        dropDraft(ex.id);
        CodeEditor.setValue((ex.code || "") + "\n");
        toast("↺ 已经还原成原来的示例代码", "✨");
        break;
      }

      // ---- 练习 ----
      case "ex-list":
        ui.exListReturn = true;
        renderPanel();
        break;
      case "ex-status":
        ui.exStatus = btn.dataset.status;
        ui.exShown = PAGE_SIZE;
        ui.sessionList = [];
        renderPanel();
        break;
      case "ex-lv":
        ui.exLevel = Number(btn.dataset.level);
        ui.exShown = PAGE_SIZE;
        ui.sessionList = [];
        renderPanel();
        break;
      case "ex-topic":
        ui.exTopic = btn.dataset.topic;
        ui.exShown = PAGE_SIZE;
        ui.sessionList = [];
        renderPanel();
        break;
      case "ex-more":
        ui.exShown += PAGE_SIZE;
        renderPanel();
        break;
      case "show-judge":
        renderJudgeResult(judgeResult);
        showJudgeView();
        break;
      case "judge": judgeCurrent(); break;
      case "selfcheck": {
        const ex = currentExercise();
        if (!ex || !p) break;
        const res = p.recordExercise({ id: ex.id, topic: ex.topic, level: ex.level, passed: true });
        celebrate();
        sound("playSuccess");
        toast("🙋 太棒了，完成一道动手题！", "🎉");
        playRewards(res);
        renderPanel();
        renderHud();
        offerNext();
        break;
      }
      case "run": runEditorCode(); break;
      case "prev": goPrev(); break;
      case "next": goNext(); break;
      case "stay":
        stopAutoNext();
        setStatus("好，就留在这题多练几遍 💪");
        break;

      // ---- 模拟考 ----
      case "exam-level":
        ui.examLevel = Number(btn.dataset.level);
        renderPanel();
        break;
      case "exam-start":
        startExam();
        break;
      case "exam-goto":
        ui.examIndex = Number(btn.dataset.i);
        loadExamQuestion();
        break;
      case "exam-prev": goPrev(); break;
      case "exam-next": goNext(); break;
      case "exam-judge": judgeExamQuestion(); break;
      case "exam-submit": submitExam(); break;
      case "exam-quit":
        ui.examPaper = null;
        ui.examDone = null;
        stopExamTimer();
        cur = null;
        CodeEditor.setValue("");
        renderPanel();
        renderActionBar();
        updateTaskBar();
        break;
      case "exam-again":
        ui.examPaper = null;
        startExam();
        break;
    }
  }

  function runEditorCode() {
    if (window.App && App.runCurrentCode) App.runCurrentCode();
  }

  // ================= 给 app.js 用的钩子 =================
  function noteEditorChange(code) {
    if (!isActive() || !cur) return;
    // 考试里写的代码只存进试卷，绝不能覆盖这道题平时的学习草稿
    if (cur.kind === "exam") {
      if (ui.examPaper) {
        ui.examPaper.codes = ui.examPaper.codes || {};
        ui.examPaper.codes[cur.id] = String(code === null || code === undefined ? "" : code).slice(0, DRAFT_MAX_CODE);
      }
      return;
    }
    setDraft(cur.id, code);
  }

  function onRunFinished(success) {
    if (!isActive() || !cur) return;
    if (cur.kind === "exercise" && success) setStatus("运行成功！点「✅ 交卷批改」看看对不对 →");
  }

  function currentLearnId() {
    return cur ? cur.id : "";
  }

  // ================= 初始化 =================
  function init() {
    bindEvents();
    ensureAssets(["lessons"]).then(() => { renderHud(); }).catch(() => {});
  }

  return {
    init,
    open,
    exit,
    goto,

    // ===== 给工坊的「🎁 示例宝库」弹窗用 =====
    loadExamples: () => ensureAssets(["examples"]),
    examplesReady: () => !!assets.examples,
    getAllExamples: () => exampleList(),
    getGalleryCategories: () => GALLERY_GROUPS,
    /** 还原全部示例：把示例上改过的草稿都清掉（孩子自己的作品不受影响） */
    resetExampleDrafts() {
      const ids = exampleList().map(e => e.id);
      const all = loadDrafts();
      let n = 0;
      ids.forEach(id => { if (all[id]) { delete all[id]; n++; } });
      if (n) { persistDrafts(); renderHud(); updateTaskBar(); }
      return n;
    },
    /** 从弹窗里点开一个示例：进学习中心、在沙盒里打开（草稿隔离，不动作品库） */
    openExampleInSandbox(id) {
      open("example");
      openExample(id);
    },
    isActive,
    noteEditorChange,
    onRunFinished,
    currentLearnId,
    flushDraft,
    draftCount,
    openTab: (tab) => open(tab)
  };
})();

window.Learn = Learn;
