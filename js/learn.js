/**
 * 🎓 学习中心（Learn）
 * 让孩子自己学 Python、备考 GESP 的主界面，包含六个部分：
 *   🗺️ 学习地图 · 📚 教程 · 🎁 示例 · ✏️ 练习 · 📝 模拟考 · 🏆 成就
 *
 * 数据来源：
 *   js/lessons.js     教程内容（懒加载）
 *   js/examples-lib.js 示例宝库（懒加载）
 *   js/exercises.js   练习题题库（懒加载，1000+ 题）
 *   js/progress.js    学习记录 / 等级 / 徽章 / 奖牌
 *   js/python-runner.js 的 PythonRunner.judge() 负责自动批改
 */
const Learn = (() => {
  // 资源版本号：和 index.html 里的 ?v= 保持一致，方便 CDN 刷新
  const V = "20260913a";
  const PAGE_SIZE = 40;          // 练习列表每次多加载多少题
  const JUDGE_TIMEOUT_MS = 4000; // 单个测试点判题超时

  let activeTab = "path";
  let assets = { lessons: false, lessonsAdv: false, examples: false, exercises: false };
  let assetErrors = {};

  // 各标签页的界面状态（关掉面板再打开还会回到原来位置）
  let state = {
    lessonId: "",
    lessonStageFilter: 0,
    exampleCat: "all",
    exampleLevel: 0,
    exampleQuery: "",
    exampleId: "",
    exTopic: "all",
    exLevel: 0,
    exStatus: "all",
    exQuery: "",
    exShown: PAGE_SIZE,
    exId: "",
    exResult: null,      // 最近一次批改结果
    exBusy: false,
    examLevel: 1,
    examPaper: null,     // {level, ids:[], answers:{}, startedAt, finished:false}
    examIndex: 0
  };

  // ================= 小工具 =================
  function esc(s) {
    return String(s === null || s === undefined ? "" : s).replace(/[&<>"']/g, c => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
    })[c]);
  }

  // 支持 **加粗** 和 `行内代码` 两种轻量标记
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

  function ensureAssets(which) {
    const jobs = [];
    const wrap = (key, src) => {
      if (assets[key]) return Promise.resolve();
      return loadScript(src).then(() => { assets[key] = true; }).catch(err => {
        assetErrors[key] = err.message || "加载失败";
        throw err;
      });
    };
    if (which.indexOf("lessons") !== -1) {
      jobs.push(wrap("lessons", "js/lessons.js"));
      jobs.push(wrap("lessonsAdv", "js/lessons-adv.js"));
    }
    if (which.indexOf("examples") !== -1) jobs.push(wrap("examples", "js/examples-lib.js"));
    if (which.indexOf("exercises") !== -1) jobs.push(wrap("exercises", "js/exercises.js"));
    return Promise.all(jobs);
  }

  // 基础篇 + 高级篇合并成一份课程表
  function lessons() {
    const base = typeof LEARN_LESSONS !== "undefined" ? LEARN_LESSONS : [];
    const adv = typeof LEARN_LESSONS_ADV !== "undefined" ? LEARN_LESSONS_ADV : [];
    if (!adv.length) return base;
    const out = base.slice();
    adv.forEach(l => { if (!out.some(x => x.id === l.id)) out.push(l); });
    return out;
  }
  function exampleList() {
    return typeof LEARN_EXAMPLES !== "undefined" ? LEARN_EXAMPLES : [];
  }
  function exampleCats() {
    return typeof LEARN_EXAMPLE_CATEGORIES !== "undefined" ? LEARN_EXAMPLE_CATEGORIES : [];
  }
  function bank() {
    return typeof EXERCISE_BANK !== "undefined" ? EXERCISE_BANK : [];
  }
  function topics() {
    return typeof EXERCISE_TOPICS !== "undefined" ? EXERCISE_TOPICS : [];
  }
  function levels() {
    return typeof EXERCISE_LEVELS !== "undefined" ? EXERCISE_LEVELS : [];
  }
  function topicMeta(id) {
    return topics().find(t => t.id === id) || { id: id, name: id, emoji: "✏️" };
  }
  function levelMeta(id) {
    return levels().find(l => l.id === Number(id)) || { id: id, name: "关卡 " + id, emoji: "🌱" };
  }

  // ================= 打开 / 关闭 =================
  function open(tab) {
    const modal = document.getElementById("learnModal");
    if (!modal) return;
    hideChip();
    modal.classList.add("active");
    switchTab(tab || activeTab || "path");
    sound("playPop");
  }

  function close() {
    const modal = document.getElementById("learnModal");
    if (modal) modal.classList.remove("active");
  }

  function switchTab(tab) {
    activeTab = tab;
    Array.prototype.forEach.call(document.querySelectorAll("#learnTabs .learn-tab"), b => {
      b.classList.toggle("active", b.dataset.tab === tab);
    });
    render();
  }

  function render() {
    const body = document.getElementById("learnBody");
    if (!body) return;
    renderHud();
    const loaders = {
      path: ["lessons"],
      lesson: ["lessons"],
      example: ["examples"],
      exercise: ["exercises"],
      exam: ["exercises"],
      award: []
    }[activeTab] || [];

    if (loaders.length) {
      const missing = loaders.filter(k => !assets[k]);
      if (missing.length) {
        body.innerHTML = '<div class="learn-loading">📦 正在打开知识宝箱…</div>';
        ensureAssets(missing).then(() => {
          if (activeTab) render();
        }).catch(() => {
          body.innerHTML = '<div class="learn-error">😢 内容没能加载出来（' +
            esc(missing.map(k => assetErrors[k] || k).join("；")) +
            '）。检查一下网络，然后重新打开学习中心试试~</div>';
        });
        return;
      }
    }

    if (activeTab === "path") renderPath(body);
    else if (activeTab === "lesson") renderLesson(body);
    else if (activeTab === "example") renderExample(body);
    else if (activeTab === "exercise") renderExercise(body);
    else if (activeTab === "exam") renderExam(body);
    else if (activeTab === "award") renderAward(body);
  }

  // 顶部 HUD：等级 + 经验条 + 学习战果
  function renderHud() {
    const hud = document.getElementById("learnHud");
    if (!hud) return;
    const p = progress();
    if (!p) { hud.innerHTML = ""; return; }
    const info = p.getLevel();
    const st = p.getStats();
    hud.innerHTML =
      '<span class="hud-level"><span class="hud-emoji">' + info.emoji + '</span>Lv.' + info.level + ' ' + esc(info.title) + '</span>' +
      '<span class="hud-bar"><span style="width:' + info.percent + '%"></span></span>' +
      '<span class="hud-num">✨ ' + (st.xp || 0) + '</span>' +
      '<span class="hud-num">✅ ' + Object.keys(st.solved || {}).length + '</span>' +
      '<span class="hud-num">🏅 ' + (st.badges || []).length + '</span>' +
      '<span class="hud-num">🥇 ' + (st.medals || []).length + '</span>';
  }

  // ================= 🗺️ 学习地图 =================
  const STAGE_INFO = {
    1: { name: "GESP 一级 · 顺序与输入输出", emoji: "🌱", desc: "会打印、会用变量、会读入数字、会算加减乘除" },
    2: { name: "GESP 二级 · 分支与循环", emoji: "🌿", desc: "会判断、会重复、会画图形、能读懂小段程序" },
    3: { name: "GESP 三级 · 字符串·列表·函数", emoji: "🌳", desc: "会处理文字和一批数据、会写自己的函数" },
    4: { name: "GESP 四级 · 算法思维", emoji: "🏔️", desc: "枚举、排序、查找、模拟题，向四级和更难的比赛出发" }
  };

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

    // 今日推荐
    const daily = p ? p.getDaily() : [];
    const nextLesson = ls.find(l => !(p && p.isLessonDone(l.id)));
    const nextEx = bank().find(e => !(p && p.isSolved(e.id)));
    html += '<div class="path-today">' +
      '<div class="path-today-title">🎯 今天做点什么？</div>' +
      '<div class="path-today-list">' +
      (daily.length ? daily.map(d =>
        '<div class="today-item' + (d.done ? " done" : "") + '"><span>' + d.emoji + '</span>' + esc(d.title) +
        '<b>' + d.have + '/' + d.need + '</b> <i>+' + d.xp + '✨</i></div>').join("") :
        '<div class="today-item">📋 每日任务准备中…</div>') +
      (nextLesson ? '<div class="today-item link" data-act="go-lesson" data-id="' + nextLesson.id + '"><span>' + nextLesson.emoji + '</span>接着学：' + esc(nextLesson.title) + '<b>去上课 ▶</b></div>' : '<div class="today-item done"><span>🎓</span>课程都学完啦，太棒了！</div>') +
      (nextEx ? '<div class="today-item link" data-act="go-ex" data-id="' + nextEx.id + '"><span>' + topicMeta(nextEx.topic).emoji + '</span>接着做：' + esc(nextEx.title) + '<b>去练习 ▶</b></div>' : '<div class="today-item done"><span>✅</span>题目都做对啦，厉害！</div>') +
      '</div></div>';

    // 四个阶段
    html += '<div class="path-stages">';
    [1, 2, 3, 4].forEach(stage => {
      const list = ls.filter(l => l.stage === stage);
      const done = list.filter(l => p && p.isLessonDone(l.id)).length;
      const si = STAGE_INFO[stage];
      const pct = list.length ? Math.round(done / list.length * 100) : 0;
      html += '<div class="stage-card" data-act="stage" data-stage="' + stage + '">' +
        '<div class="stage-head"><span class="stage-emoji">' + si.emoji + '</span>' +
        '<span class="stage-name">' + esc(si.name) + '</span>' +
        '<span class="stage-count">' + done + "/" + list.length + '</span></div>' +
        '<div class="stage-desc">' + esc(si.desc) + '</div>' +
        '<div class="stage-bar"><span style="width:' + pct + '%"></span></div>' +
        '</div>';
    });
    html += '</div>';

    // 单元列表
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
      html += '<button class="unit-chip" data-act="unit" data-stage="' + u.stage + '" data-unit="' + esc(u.unit) + '">' +
        '<span class="unit-name">' + esc(u.unit) + '</span>' +
        '<span class="unit-meta">' + done + "/" + u.list.length + ' 课 · ' + STAGE_INFO[u.stage].emoji + '</span>' +
        '</button>';
    });
    html += '</div>';

    body.innerHTML = html;
  }

  // ================= 📚 教程 =================
  function renderLesson(body) {
    const p = progress();
    const ls = lessons();
    if (!ls.length) { body.innerHTML = '<div class="learn-error">教程内容还没准备好…</div>'; return; }
    if (!state.lessonId || !ls.some(l => l.id === state.lessonId)) {
      const first = ls.find(l => !(p && p.isLessonDone(l.id))) || ls[0];
      state.lessonId = first.id;
    }
    const cur = ls.find(l => l.id === state.lessonId);
    const units = [];
    ls.forEach(l => {
      const key = l.stage + "|" + (l.unit || "其他");
      let u = units.find(x => x.key === key);
      if (!u) { u = { key: key, stage: l.stage, unit: l.unit || "其他", list: [] }; units.push(u); }
      u.list.push(l);
    });

    let side = '<div class="lesson-side">';
    units.forEach(u => {
      const done = u.list.filter(l => p && p.isLessonDone(l.id)).length;
      side += '<div class="lesson-unit-head">' + STAGE_INFO[u.stage].emoji + ' ' + esc(u.unit) +
        '<span>' + done + "/" + u.list.length + '</span></div>';
      u.list.forEach(l => {
        const ok = p && p.isLessonDone(l.id);
        side += '<button class="lesson-item' + (l.id === cur.id ? " active" : "") + (ok ? " done" : "") +
          '" data-act="lesson" data-id="' + l.id + '"><span class="lesson-item-emoji">' + l.emoji + '</span>' +
          '<span class="lesson-item-title">' + esc(l.title) + '</span>' +
          '<span class="lesson-item-state">' + (ok ? "✅" : "") + '</span></button>';
      });
    });
    side += '</div>';

    const idx = ls.findIndex(l => l.id === cur.id);
    const prev = idx > 0 ? ls[idx - 1] : null;
    const next = idx < ls.length - 1 ? ls[idx + 1] : null;
    const done = p && p.isLessonDone(cur.id);

    let main = '<div class="lesson-main">';
    main += '<div class="lesson-head"><span class="lesson-head-emoji">' + cur.emoji + '</span>' +
      '<div><div class="lesson-head-title">' + esc(cur.title) + '</div>' +
      '<div class="lesson-head-meta">' + STAGE_INFO[cur.stage].emoji + ' ' + esc(cur.unit) +
      ' · 约 ' + (cur.minutes || 8) + ' 分钟' + (done ? ' · <b class="ok">已学完 ✅</b>' : '') + '</div></div></div>';

    if (cur.goals && cur.goals.length) {
      main += '<div class="lesson-goals"><div class="lesson-block-title">🎯 学完这节课，你会：</div><ul>' +
        cur.goals.map(g => '<li>' + rich(g) + '</li>').join("") + '</ul></div>';
    }

    main += '<div class="lesson-teach">' + (cur.teach || []).map(t => '<p>' + rich(t) + '</p>').join("") + '</div>';

    if (cur.code) {
      main += '<div class="lesson-code-block"><div class="lesson-code-head">💻 示例代码（可以点「运行看看」直接跑）</div>' +
        '<pre class="lesson-code">' + esc(cur.code) + '</pre>' +
        '<div class="lesson-code-actions">' +
        '<button class="learn-btn primary" data-act="run-lesson" data-id="' + cur.id + '">▶ 运行看看</button>' +
        '<button class="learn-btn" data-act="open-lesson" data-id="' + cur.id + '">✏️ 打开到编辑器改一改</button>' +
        '</div></div>';
    }

    if (cur.explain && cur.explain.length) {
      main += '<div class="lesson-explain"><div class="lesson-block-title">🔍 代码里的小秘密</div>' +
        cur.explain.map(x => '<div class="explain-line">💡 ' + rich(x) + '</div>').join("") + '</div>';
    }

    if (cur.quiz && cur.quiz.length) {
      cur.quiz.forEach((q, qi) => {
        main += '<div class="lesson-quiz" data-quiz="' + qi + '">' +
          '<div class="lesson-block-title">🧠 小测验：' + rich(q.q) + '</div>' +
          '<div class="quiz-options">' +
          (q.options || []).map((o, oi) =>
            '<button class="quiz-option" data-act="quiz" data-id="' + cur.id + '" data-q="' + qi + '" data-o="' + oi + '">' +
            String.fromCharCode(65 + oi) + '. ' + esc(o) + '</button>').join("") +
          '</div><div class="quiz-feedback"></div></div>';
      });
    }

    if (cur.task) {
      main += '<div class="lesson-task"><div class="lesson-block-title">🛠️ 动手任务</div><div>' + rich(cur.task) + '</div></div>';
    }

    if (cur.practiceTopics && cur.practiceTopics.length && bank().length) {
      const count = bank().filter(e => cur.practiceTopics.indexOf(e.topic) !== -1).length;
      main += '<div class="lesson-practice"><div class="lesson-block-title">✏️ 配套练习</div>' +
        '<div class="lesson-practice-row">' +
        cur.practiceTopics.map(t => {
          const tm = topicMeta(t);
          return '<button class="learn-chip" data-act="practice-topic" data-topic="' + t + '">' + tm.emoji + ' ' + esc(tm.name) + '</button>';
        }).join("") +
        '<span class="lesson-practice-count">这一课相关的练习共 ' + count + ' 道</span></div></div>';
    }

    main += '<div class="lesson-nav">' +
      (prev ? '<button class="learn-btn" data-act="lesson" data-id="' + prev.id + '">← 上一课</button>' : '<span></span>') +
      '<button class="learn-btn success" data-act="finish-lesson" data-id="' + cur.id + '">' +
      (done ? "✅ 已学完（再点一次复习一遍）" : "✅ 我学会了！+15✨") + '</button>' +
      (next ? '<button class="learn-btn primary" data-act="lesson" data-id="' + next.id + '">下一课 →</button>' : '<span></span>') +
      '</div>';
    main += '</div>';

    body.innerHTML = '<div class="lesson-wrap">' + side + main + '</div>';
    const sideEl = body.querySelector(".lesson-side");
    const activeEl = body.querySelector(".lesson-item.active");
    if (sideEl && activeEl && activeEl.offsetTop > sideEl.clientHeight - 40) {
      sideEl.scrollTop = Math.max(0, activeEl.offsetTop - sideEl.clientHeight / 2);
    }
  }

  // ================= 🎁 示例 =================
  function renderExample(body) {
    const list = exampleList();
    const cats = exampleCats();
    if (!list.length) { body.innerHTML = '<div class="learn-error">示例库还没准备好…</div>'; return; }

    if (state.exampleId) {
      const ex = list.find(e => e.id === state.exampleId);
      if (!ex) { state.exampleId = ""; renderExample(body); return; }
      renderExampleDetail(body, ex);
      return;
    }

    let html = '<div class="lib-toolbar">' +
      '<button class="learn-chip' + (state.exampleCat === "all" ? " active" : "") + '" data-act="ex-cat" data-cat="all">全部 ' + list.length + '</button>' +
      cats.map(c => {
        const n = list.filter(e => e.category === c.id).length;
        if (!n) return "";
        return '<button class="learn-chip' + (state.exampleCat === c.id ? " active" : "") + '" data-act="ex-cat" data-cat="' + c.id + '">' +
          c.emoji + ' ' + esc(c.name) + ' ' + n + '</button>';
      }).join("") +
      '</div><div class="lib-toolbar">' +
      '<button class="learn-chip' + (state.exampleLevel === 0 ? " active" : "") + '" data-act="ex-level" data-level="0">全部难度</button>' +
      [1, 2, 3].map(l => '<button class="learn-chip' + (state.exampleLevel === l ? " active" : "") + '" data-act="ex-level" data-level="' + l + '">' + "⭐".repeat(l) + '</button>').join("") +
      '<input class="learn-search" id="exSearch" placeholder="🔍 搜索示例（输入关键字）" value="' + esc(state.exampleQuery) + '">' +
      '</div>';

    let items = list.filter(e => state.exampleCat === "all" || e.category === state.exampleCat);
    if (state.exampleLevel) items = items.filter(e => e.level === state.exampleLevel);
    const q = state.exampleQuery.trim().toLowerCase();
    if (q) {
      items = items.filter(e =>
        (e.title + e.desc + (e.tip || "") + (e.code || "")).toLowerCase().indexOf(q) !== -1);
    }

    html += '<div class="ex-grid">';
    if (!items.length) html += '<div class="learn-empty">没有找到符合条件的示例，换个关键字试试~</div>';
    items.forEach(e => {
      html += '<button class="ex-card" data-act="ex-open" data-id="' + e.id + '">' +
        '<span class="ex-card-emoji">' + e.emoji + '</span>' +
        '<span class="ex-card-title">' + esc(e.title) + '</span>' +
        '<span class="ex-card-desc">' + esc(e.desc) + '</span>' +
        '<span class="ex-card-star">' + "⭐".repeat(Math.max(1, Math.min(3, e.level || 1))) + '</span>' +
        '</button>';
    });
    html += '</div>';
    body.innerHTML = html;

    const search = document.getElementById("exSearch");
    if (search) {
      search.addEventListener("input", () => {
        state.exampleQuery = search.value;
        const pos = search.selectionStart;
        renderExample(body);
        const el2 = document.getElementById("exSearch");
        if (el2) { el2.focus(); try { el2.setSelectionRange(pos, pos); } catch (e) {} }
      });
    }
  }

  function renderExampleDetail(body, ex) {
    const codeLines = String(ex.code || "").split("\n").length;
    let html = '<div class="ex-detail">' +
      '<button class="learn-btn" data-act="ex-back">← 返回示例列表</button>' +
      '<div class="ex-detail-head"><span class="ex-detail-emoji">' + ex.emoji + '</span>' +
      '<div><div class="ex-detail-title">' + esc(ex.title) + '</div>' +
      '<div class="ex-detail-meta">' + "⭐".repeat(Math.max(1, Math.min(3, ex.level || 1))) + ' · ' + codeLines + ' 行代码 · ' +
      esc((exampleCats().find(c => c.id === ex.category) || {}).name || ex.category) + '</div></div></div>' +
      '<div class="ex-detail-desc">' + esc(ex.desc) + '</div>' +
      '<pre class="lesson-code">' + esc(ex.code) + '</pre>' +
      '<div class="ex-detail-tip">💡 试试看：' + esc(ex.tip || "改一改数字或文字，再运行一次，看看有什么变化。") + '</div>' +
      '<div class="lesson-code-actions">' +
      '<button class="learn-btn primary" data-act="run-example" data-id="' + ex.id + '">▶ 运行看看</button>' +
      '<button class="learn-btn" data-act="open-example" data-id="' + ex.id + '">✏️ 打开到编辑器改一改</button>' +
      '</div></div>';
    body.innerHTML = html;
  }

  // ================= ✏️ 练习 =================
  function filteredExercises() {
    const p = progress();
    let items = bank();
    if (state.exTopic !== "all") items = items.filter(e => e.topic === state.exTopic);
    if (state.exLevel) items = items.filter(e => e.level === state.exLevel);
    if (state.exStatus === "solved") items = items.filter(e => p && p.isSolved(e.id));
    else if (state.exStatus === "todo") items = items.filter(e => !(p && p.isSolved(e.id)));
    else if (state.exStatus === "tried") items = items.filter(e => p && p.isTried(e.id) && !p.isSolved(e.id));
    const q = state.exQuery.trim().toLowerCase();
    if (q) {
      items = items.filter(e => (e.id + e.title + e.desc + (e.tags || []).join("")).toLowerCase().indexOf(q) !== -1);
    }
    return items;
  }

  function renderExercise(body) {
    const all = bank();
    if (!all.length) { body.innerHTML = '<div class="learn-error">题库还没准备好…</div>'; return; }

    if (state.exId) {
      const ex = all.find(e => e.id === state.exId);
      if (!ex) { state.exId = ""; renderExercise(body); return; }
      renderExerciseDetail(body, ex);
      return;
    }

    const p = progress();
    const st = p ? p.getStats() : { solved: {} };
    const solvedN = Object.keys(st.solved || {}).length;

    let html = '<div class="ex-summary">' +
      '<div class="ex-summary-item"><b>' + all.length + '</b><span>题库总题数</span></div>' +
      '<div class="ex-summary-item"><b>' + solvedN + '</b><span>已做对</span></div>' +
      '<div class="ex-summary-item"><b>' + (st.combo || 0) + '</b><span>当前连对</span></div>' +
      '<div class="ex-summary-item"><b>' + (st.bestCombo || 0) + '</b><span>最高连对</span></div>' +
      '</div>';

    html += '<div class="lib-toolbar">' +
      '<button class="learn-chip' + (state.exTopic === "all" ? " active" : "") + '" data-act="ex-topic" data-topic="all">全部主题</button>' +
      topics().filter(t => all.some(e => e.topic === t.id)).map(t => {
        const n = all.filter(e => e.topic === t.id).length;
        const done = all.filter(e => e.topic === t.id && st.solved[e.id]).length;
        return '<button class="learn-chip' + (state.exTopic === t.id ? " active" : "") + '" data-act="ex-topic" data-topic="' + t.id + '">' +
          t.emoji + ' ' + esc(t.name) + ' <i>' + done + "/" + n + '</i></button>';
      }).join("") +
      '</div>';

    html += '<div class="lib-toolbar">' +
      '<button class="learn-chip' + (state.exLevel === 0 ? " active" : "") + '" data-act="ex-lv" data-level="0">全部关卡</button>' +
      levels().map(l => {
        const n = all.filter(e => e.level === l.id).length;
        if (!n) return "";
        return '<button class="learn-chip' + (state.exLevel === l.id ? " active" : "") + '" data-act="ex-lv" data-level="' + l.id + '">' +
          l.emoji + ' ' + esc(l.name.split(" · ")[0]) + ' <i>' + n + '</i></button>';
      }).join("") +
      '<span class="lib-sep"></span>' +
      ["all", "todo", "tried", "solved"].map(s => {
        const label = { all: "全部", todo: "还没做对", tried: "做过没对", solved: "已做对" }[s];
        return '<button class="learn-chip' + (state.exStatus === s ? " active" : "") + '" data-act="ex-status" data-status="' + s + '">' + label + '</button>';
      }).join("") +
      '<input class="learn-search" id="exQuery" placeholder="🔍 搜索题目" value="' + esc(state.exQuery) + '">' +
      '</div>';

    const items = filteredExercises();
    html += '<div class="ex-list-head">共找到 <b>' + items.length + '</b> 道题，已显示前 ' + Math.min(state.exShown, items.length) + ' 道</div>';
    html += '<div class="ex-list">';
    items.slice(0, state.exShown).forEach(e => {
      const ok = st.solved && st.solved[e.id];
      const tried = st.tried && st.tried[e.id];
      const tm = topicMeta(e.topic);
      html += '<button class="ex-row' + (ok ? " solved" : "") + '" data-act="ex-open-item" data-id="' + e.id + '">' +
        '<span class="ex-row-state">' + (ok ? "✅" : (tried ? "🔸" : "⬜")) + '</span>' +
        '<span class="ex-row-id">' + e.id + '</span>' +
        '<span class="ex-row-title">' + esc(e.title) + '</span>' +
        '<span class="ex-row-tag">' + tm.emoji + ' ' + esc(tm.name) + '</span>' +
        '<span class="ex-row-lv">' + levelMeta(e.level).emoji + '</span>' +
        '</button>';
    });
    if (!items.length) html += '<div class="learn-empty">没有符合条件的题目，换个筛选条件试试~</div>';
    html += '</div>';
    if (items.length > state.exShown) {
      html += '<div class="ex-more"><button class="learn-btn primary" data-act="ex-more">加载更多题目（还有 ' +
        (items.length - state.exShown) + ' 道）</button></div>';
    }
    body.innerHTML = html;

    const q = document.getElementById("exQuery");
    if (q) {
      q.addEventListener("input", () => {
        state.exQuery = q.value;
        state.exShown = PAGE_SIZE;
        const pos = q.selectionStart;
        renderExercise(body);
        const el2 = document.getElementById("exQuery");
        if (el2) { el2.focus(); try { el2.setSelectionRange(pos, pos); } catch (e) {} }
      });
    }
  }

  // 给孩子一个「题目说明 + 空白答题区」的起始文件
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

  function exerciseFileName(ex) {
    const safe = String(ex.title).replace(/[\\/:*?"<>|]/g, "").slice(0, 16);
    return "练习_" + ex.id + "_" + safe + ".py";
  }

  function openFileInWorkspace(name, content) {
    if (typeof FileManager === "undefined") return null;
    const files = FileManager.getAllFiles();
    let target = files.find(f => f.name === name);
    if (!target) {
      target = FileManager.createFile(name, content);
    } else {
      FileManager.setActiveFile(target.id);
    }
    if (target && window.App && window.App.switchToTab) window.App.switchToTab("console");
    return target;
  }

  function runFileInWorkspace(name, content) {
    const file = openFileInWorkspace(name, content);
    if (!file) return;
    if (typeof PythonRunner !== "undefined") {
      const code = (typeof CodeEditor !== "undefined" && CodeEditor.getValue) ? CodeEditor.getValue() : file.content;
      PythonRunner.run(code);
    }
  }

  function renderExerciseDetail(body, ex) {
    const p = progress();
    const st = p ? p.getStats() : { solved: {}, tried: {} };
    const ok = st.solved && st.solved[ex.id];
    const tm = topicMeta(ex.topic);
    const lm = levelMeta(ex.level);
    const tests = ex.tests || [];

    let html = '<div class="ex-detail">' +
      '<div class="ex-detail-top"><button class="learn-btn" data-act="ex-back">← 返回题目列表</button>' +
      '<span class="ex-detail-tags">' + tm.emoji + ' ' + esc(tm.name) + ' · ' + lm.emoji + ' ' + esc(lm.name) +
      (ok ? ' · <b class="ok">已做对 ✅</b>' : (st.tried && st.tried[ex.id] ? ' · <b class="warn">做过还没全对</b>' : '')) +
      '</span></div>' +
      '<div class="ex-detail-title">' + ex.id + ' · ' + esc(ex.title) + '</div>' +
      '<div class="ex-detail-body">' + rich(ex.desc) + '</div>';

    if (tests.length) {
      const t = tests[0];
      html += '<div class="ex-sample"><div class="ex-sample-title">📋 样例</div>' +
        '<div class="ex-sample-grid">' +
        '<div><div class="ex-sample-label">输入</div><pre class="ex-sample-pre">' + (t.in && t.in.trim() ? esc(t.in) : "（这道题不需要输入）") + '</pre></div>' +
        '<div><div class="ex-sample-label">输出</div><pre class="ex-sample-pre">' + esc(norm(t.out)) + '</pre></div>' +
        '</div></div>';
      html += '<div class="ex-judge-note">🔍 批改时会用 <b>' + tests.length + '</b> 组数据检查你的程序，全部通过才算做对哦。</div>';
    } else {
      html += '<div class="ex-judge-note">🎨 这道题要自己看效果给分：画出来 / 做出来以后，点下面的按钮就算完成。</div>';
    }

    html += '<details class="ex-hint"><summary>💡 想不出来？点这里看提示</summary><div>' + rich(ex.hint) + '</div></details>';

    html += '<div class="ex-actions">' +
      '<button class="learn-btn primary" data-act="ex-goto">✏️ 去编辑器写这道题</button>' +
      (tests.length
        ? '<button class="learn-btn success" data-act="ex-judge"' + (state.exBusy ? " disabled" : "") + '>' +
          (state.exBusy ? "⏳ 正在批改…" : "✅ 批改我现在写的代码") + '</button>'
        : '<button class="learn-btn success" data-act="ex-selfcheck">🙋 我做出来了，打勾</button>') +
      '<button class="learn-btn" data-act="ex-answer">👀 看参考答案</button>' +
      '</div>';

    if (state.exResult && state.exResult.id === ex.id) {
      html += renderJudgeResult(state.exResult);
    }

    html += '</div>';
    body.innerHTML = html;
  }

  function renderJudgeResult(res) {
    if (!res) return "";
    let html = '<div class="judge-result ' + (res.pass ? "pass" : "fail") + '">';
    html += '<div class="judge-head">' + (res.pass ? "🎉 全部通过，太棒啦！" : "🤔 还没全对，一起看看哪里不一样") +
      '<span class="judge-time">用时 ' + Math.round((res.totalMs || 0)) + ' 毫秒</span></div>';

    if (res.syntax) {
      html += '<div class="judge-syntax">📛 你的代码暂时跑不起来：<br><code>' + esc((res.syntaxMessage || "").split("\n").slice(-1)[0] || "") + '</code>' +
        '<div class="judge-tip">小提示：检查一下括号、引号是不是成对的，if / for / while / def 那行末尾有没有漏掉英文冒号 <b>:</b>。也可以用顶部「🩺 标点体检」。</div></div>';
      if (res.line) html += '<div class="judge-tip">出问题的大概在第 ' + res.line + ' 行附近。</div>';
      html += '</div>';
      return html;
    }

    res.cases.forEach((c, i) => {
      html += '<div class="judge-case ' + (c.ok ? "ok" : "bad") + '">' +
        '<div class="judge-case-head">' + (c.ok ? "✅ 第 " + (i + 1) + " 组数据通过" : "❌ 第 " + (i + 1) + " 组数据没通过") + '</div>' +
        '<div class="judge-case-grid">' +
        '<div><div class="judge-label">题目给的输入</div><pre>' + (c.input && c.input.trim() ? esc(c.input) : "（不需要输入）") + '</pre></div>' +
        '<div><div class="judge-label">应该输出</div><pre>' + esc(norm(c.want)) + '</pre></div>' +
        '<div><div class="judge-label">你的程序输出</div><pre>' + (c.got && c.got.trim() ? esc(norm(c.got)) : "（没有任何输出）") + '</pre></div>' +
        '</div>';
      if (!c.ok && c.err) {
        html += '<div class="judge-err">' + esc(kidFriendlyError(c.err, c.timedOut)) + '</div>';
      } else if (!c.ok && !norm(c.got)) {
        html += '<div class="judge-err">你的程序什么都没打印出来。记得用 print() 把答案输出哦。</div>';
      } else if (!c.ok) {
        html += '<div class="judge-err">再仔细对比一下：是不是多了空格、少了换行，或者题目要求的格式不一样？</div>';
      }
      html += '</div>';
    });
    html += '</div>';
    return html;
  }

  function kidFriendlyError(errText, timedOut) {
    const t = String(errText || "");
    if (timedOut || t.indexOf("KeyboardInterrupt") !== -1) {
      return "⏰ 程序跑太久被停下来了：检查一下循环有没有能结束的条件。";
    }
    if (t.indexOf("EOFError") !== -1) {
      return "💬 程序还在等输入，但题目的输入已经用完了：检查一下 input() 是不是写多了，或者该用一次 input().split() 读一行。";
    }
    if (t.indexOf("SyntaxError") !== -1 || t.indexOf("IndentationError") !== -1) {
      return "📛 语法有点小问题：检查标点是不是英文、缩进是不是对齐、冒号有没有漏。";
    }
    if (t.indexOf("NameError") !== -1) {
      const m = t.match(/name '([^']+)' is not defined/);
      return "🔍 电脑不认识这个名字" + (m ? "「" + m[1] + "」" : "") + "：检查有没有拼错，或者变量还没赋值就先用了。";
    }
    if (t.indexOf("ValueError") !== -1) {
      return "🔢 数字转换出了问题：如果输入里可能有非数字，用 int(input()) 之前要想清楚哦。";
    }
    if (t.indexOf("TypeError") !== -1) {
      return "🧩 类型对不上：文字和数字不能直接相加，可以先用 str() 或 int() 转换。";
    }
    if (t.indexOf("IndexError") !== -1) {
      return "📚 下标越界了：记住列表是从 0 开始数的，最后一个位置是 len(列表) - 1。";
    }
    if (t.indexOf("ZeroDivisionError") !== -1) {
      return "➗ 不能除以 0 哦，检查一下除数是不是 0。";
    }
    const last = t.trim().split("\n").filter(Boolean).slice(-1)[0] || "出现了未知的小状况";
    return "❌ " + last.slice(0, 120);
  }

  // ================= 批改 =================
  function currentEditorCode() {
    try {
      if (typeof CodeEditor !== "undefined" && CodeEditor.getValue) return CodeEditor.getValue();
    } catch (e) {}
    return "";
  }

  async function judgeExercise(ex, body) {
    if (state.exBusy) return;
    const code = currentEditorCode();
    if (!code.trim()) {
      toast("编辑器里还是空的：先点「✏️ 去编辑器写这道题」，写完再回来批改~", "📝");
      return;
    }
    if (typeof PythonRunner === "undefined" || !PythonRunner.judge) {
      toast("Python 还没准备好，稍等几秒再试~", "⏳");
      return;
    }
    const p = progress();
    const startedAt = Date.now();
    state.exBusy = true;
    state.exResult = null;
    renderExercise(body);

    const tests = ex.tests || [];
    const cases = [];
    let totalMs = 0;
    let firstErr = "";
    let errLine = 0;
    let pass = true;

    for (let i = 0; i < tests.length; i++) {
      const t = tests[i];
      let r = null;
      try {
        r = await PythonRunner.judge(code, t.in || "", JUDGE_TIMEOUT_MS);
      } catch (err) {
        r = { out: "", err: (err && err.message) || "批改失败", timedOut: false, ms: 0 };
      }
      totalMs += r.ms || 0;
      const got = norm(r.out);
      const want = norm(t.out);
      const ok = !r.err && got === want;
      if (!ok) {
        pass = false;
        if (r.err && !firstErr) { firstErr = r.err; errLine = r.line || 0; }
      }
      cases.push({ ok: ok, input: t.in || "", got: r.out || "", want: t.out || "", err: r.err || "", timedOut: !!r.timedOut });
      // 题目只有一组数据却报语法错 → 直接不再重复跑同样的错误
      if (r.err && /SyntaxError|IndentationError|TabError/.test(r.err)) break;
    }

    const syntax = !!firstErr && /SyntaxError|IndentationError|TabError/.test(firstErr);
    state.exResult = {
      id: ex.id, pass: pass, cases: cases, totalMs: totalMs,
      syntax: syntax, syntaxMessage: syntax ? firstErr : "", line: errLine
    };
    state.exBusy = false;

    // 记录到成长档案
    const seconds = Math.round((Date.now() - startedAt) / 1000);
    let rewards = null;
    if (p) {
      rewards = p.recordExercise({ id: ex.id, topic: ex.topic, level: ex.level, passed: pass, seconds: seconds });
    }
    renderExercise(body);
    renderHud();

    if (pass) {
      celebrate();
      sound("playSuccess");
      const first = rewards && !rewards.solvedBefore;
      toast(first ? ("🎉 第 " + (Object.keys((p ? p.getStats().solved : {})).length) + " 题做对啦！+" + (rewards ? rewards.xp : 8) + "✨") : "✅ 又复习了一遍，真棒！", "🎉");
      const lines = p ? p.describeRewards(rewards) : [];
      if (lines.length) lines.forEach((l, i) => setTimeout(() => toast(l, "🌟"), 700 * (i + 1)));
    } else {
      sound("playWarning");
      toast("差一点点，看看下面的对比就知道啦~", "🔍");
    }
  }

  // ================= 📝 模拟考 =================
  function buildPaper(level, count) {
    const p = progress();
    const pool = bank().filter(e => e.level === level && (e.tests || []).length);
    if (!pool.length) return [];
    // 优先出「还没做对过」的题，这样每次考试都在练新东西
    const unsolved = pool.filter(e => !(p && p.isSolved(e.id)));
    const source = unsolved.length >= count ? unsolved : pool;

    // 按主题分组、打乱后轮流抽题：保证覆盖面，同时每次卷子都不一样
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

  function renderExam(body) {
    const st = state.examPaper;
    if (!st) {
      const p = progress();
      const stats = p ? p.getStats() : { exams: [] };
      let html = '<div class="exam-intro">' +
        '<div class="exam-intro-title">📝 GESP 模拟考</div>' +
        '<div class="exam-intro-desc">选一个级别，系统会从题库里抽 10 道题组成一份小卷子。每题 10 分，60 分及格。' +
        '做完一题就点「批改」，全部做完点「交卷」看成绩。</div>' +
        '<div class="exam-levels">' +
        levels().map(l => {
          const best = (stats.exams || []).filter(e => e.level === l.id).reduce((m, e) => Math.max(m, e.score || 0), 0);
          return '<button class="exam-level-card' + (state.examLevel === l.id ? " active" : "") + '" data-act="exam-level" data-level="' + l.id + '">' +
            '<span class="exam-level-emoji">' + l.emoji + '</span>' +
            '<span class="exam-level-name">' + esc(l.name) + '</span>' +
            '<span class="exam-level-best">' + (best ? "最好成绩 " + best + " 分" : "还没考过") + '</span>' +
            '</button>';
        }).join("") +
        '</div>' +
        '<button class="learn-btn primary big" data-act="exam-start">🚀 开始考试（' + levelMeta(state.examLevel).name.split(" · ")[0] + '）</button>' +
        '</div>';

      if ((stats.exams || []).length) {
        html += '<div class="exam-history"><div class="lesson-block-title">📊 我的考试记录</div>' +
          stats.exams.slice(-8).reverse().map(e =>
            '<div class="exam-history-row">' + levelMeta(e.level).emoji + ' ' + esc(levelMeta(e.level).name.split(" · ")[0]) +
            '<b class="' + (e.score >= 60 ? "ok" : "warn") + '">' + e.score + ' 分</b>' +
            '<span>' + new Date(e.at).toLocaleString("zh-CN", { month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" }) + '</span></div>').join("") +
          '</div>';
      }
      body.innerHTML = html;
      return;
    }

    // 考试中
    const ids = st.ids;
    const cur = bank().find(e => e.id === ids[state.examIndex]);
    const answered = Object.keys(st.answers).length;
    const rightCount = Object.values(st.answers).filter(a => a.pass).length;
    let html = '<div class="exam-bar">' +
      '<span class="exam-bar-title">' + levelMeta(st.level).emoji + ' ' + esc(levelMeta(st.level).name.split(" · ")[0]) + ' 模拟考</span>' +
      '<span class="exam-bar-info">已批改 ' + answered + '/' + ids.length + ' 题 · 正确 ' + rightCount + ' 题</span>' +
      '<span class="exam-bar-score">预计 ' + (answered ? Math.round(rightCount / ids.length * 100) : 0) + ' 分</span>' +
      '<button class="learn-btn" data-act="exam-quit">退出考试</button>' +
      '<button class="learn-btn success" data-act="exam-submit">📮 交卷</button>' +
      '</div>';

    html += '<div class="exam-nav">' + ids.map((id, i) => {
      const a = st.answers[id];
      const cls = a ? (a.pass ? "ok" : "bad") : (i === state.examIndex ? "active" : "");
      return '<button class="exam-nav-dot ' + cls + '" data-act="exam-goto" data-i="' + i + '">' + (i + 1) + '</button>';
    }).join("") + '</div>';

    if (cur) {
      html += '<div class="exam-question">';
      html += '<div class="exam-q-title">第 ' + (state.examIndex + 1) + ' 题 · ' + cur.id + ' ' + esc(cur.title) + '</div>';
      const tm = topicMeta(cur.topic);
      html += '<div class="ex-detail-tags">' + tm.emoji + ' ' + esc(tm.name) + ' · ' + levelMeta(cur.level).emoji + '</div>';
      html += '<div class="ex-detail-body">' + rich(cur.desc) + '</div>';
      const t = (cur.tests || [])[0];
      if (t) {
        html += '<div class="ex-sample"><div class="ex-sample-title">📋 样例</div><div class="ex-sample-grid">' +
          '<div><div class="ex-sample-label">输入</div><pre class="ex-sample-pre">' + (t.in && t.in.trim() ? esc(t.in) : "（不需要输入）") + '</pre></div>' +
          '<div><div class="ex-sample-label">输出</div><pre class="ex-sample-pre">' + esc(norm(t.out)) + '</pre></div>' +
          '</div></div>';
      }
      const a = st.answers[cur.id];
      if (a) {
        html += '<div class="exam-answer ' + (a.pass ? "ok" : "bad") + '">' +
          (a.pass ? "✅ 这题批改通过（得 10 分）" : "❌ 这题还没通过，改一改再批改一次") + '</div>';
        if (!a.pass && a.cases) html += renderJudgeResult({ pass: false, cases: a.cases, totalMs: a.ms, syntax: false });
      }
      html += '<div class="ex-actions">' +
        '<button class="learn-btn primary" data-act="exam-goto-file">✏️ 去编辑器写这道题</button>' +
        '<button class="learn-btn success" data-act="exam-judge"' + (state.exBusy ? " disabled" : "") + '>' + (state.exBusy ? "⏳ 批改中…" : "✅ 批改这题") + '</button>' +
        '<button class="learn-btn" data-act="exam-prev">← 上一题</button>' +
        '<button class="learn-btn" data-act="exam-next">下一题 →</button>' +
        '</div>';
      html += '</div>';
    }

    body.innerHTML = html;
  }

  async function judgeExamQuestion(body) {
    const st = state.examPaper;
    if (!st || state.exBusy) return;
    const ex = bank().find(e => e.id === st.ids[state.examIndex]);
    if (!ex) return;
    const code = currentEditorCode();
    if (!code.trim()) { toast("先写点代码再来批改吧~", "📝"); return; }
    state.exBusy = true;
    renderExam(body);

    const cases = [];
    let pass = true;
    let ms = 0;
    for (const t of (ex.tests || [])) {
      let r;
      try { r = await PythonRunner.judge(code, t.in || "", JUDGE_TIMEOUT_MS); }
      catch (e) { r = { out: "", err: (e && e.message) || "批改失败", ms: 0 }; }
      ms += r.ms || 0;
      const ok = !r.err && norm(r.out) === norm(t.out);
      if (!ok) pass = false;
      cases.push({ ok: ok, input: t.in || "", got: r.out || "", want: t.out || "", err: r.err || "", timedOut: !!r.timedOut });
    }
    st.answers[ex.id] = { pass: pass, cases: cases, ms: ms };
    state.exBusy = false;
    if (pass) { sound("playSuccess"); } else { sound("playWarning"); }
    renderExam(body);
    renderHud();
  }

  function submitExam() {
    const st = state.examPaper;
    if (!st) return;
    const ids = st.ids;
    const right = Object.values(st.answers).filter(a => a.pass).length;
    const score = Math.round(right / ids.length * 100);
    const p = progress();
    let rewards = null;
    if (p) rewards = p.recordExam({ level: st.level, score: score, total: 100 });
    state.examPaper = null;
    render();
    renderHud();
    if (score >= 60) { celebrate(); sound("playSuccess"); } else { sound("playWarning"); }
    const msg = score >= 90 ? "🏆 太厉害了！" + score + " 分，可以放心去考 GESP 啦！"
      : score >= 60 ? "👏 及格啦！" + score + " 分，再练一练就更稳了。"
      : "💪 这次 " + score + " 分，我们一起把没做对的题再练一遍吧！";
    toast(msg, score >= 60 ? "🎉" : "📝");
    const lines = p ? p.describeRewards(rewards) : [];
    lines.forEach((l, i) => setTimeout(() => toast(l, "🌟"), 800 * (i + 1)));
    const modal = document.getElementById("confirmModal");
    if (window.App && window.App.showConfirmModal) {
      window.App.showConfirmModal("📮 成绩单", msg + "<br><br>正确 " + right + " / " + ids.length + " 题" +
        (lines.length ? "<br><br>" + lines.join("<br>") : ""), () => {});
    } else if (modal) { /* 没有确认弹窗就只用 toast */ }
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
      '</div>';

    // 技能进度条（离奖牌还有多远）
    html += '<div class="lesson-block-title">💪 技能熟练度（做对越多，奖牌越亮）</div><div class="skill-grid">';
    domains.forEach(d => {
      const next = d.score < 6 ? 6 : d.score < 20 ? 20 : d.score < 45 ? 45 : d.score;
      const pct = Math.min(100, Math.round(d.score / next * 100));
      html += '<div class="skill-row"><span class="skill-name">' + d.emoji + ' ' + esc(d.name) + '</span>' +
        '<span class="skill-bar"><span style="width:' + pct + '%"></span></span>' +
        '<span class="skill-count">' + d.score + (d.score >= 45 ? " 🥇" : d.score >= 20 ? " 🥈" : d.score >= 6 ? " 🥉" : "/6") + '</span></div>';
    });
    html += '</div>';

    // 奖牌墙
    html += '<div class="lesson-block-title">🥇 奖牌墙 ' + gotMedals + "/" + medals.length + '</div><div class="medal-grid big">';
    medals.forEach(m => {
      html += '<div class="medal-item tier-' + (m.tier || "bronze") + (m.got ? "" : " locked") + '" title="' + esc(m.desc) + '">' +
        '<span class="medal-emoji">' + (m.got ? m.emoji : "🔒") + '</span>' +
        '<span class="medal-title">' + esc(m.title) + '</span>' +
        '<span class="medal-desc">' + esc(m.desc) + '</span></div>';
    });
    html += '</div>';

    // 徽章墙
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

  // ================= 悬浮小按钮（做题时收起面板） =================
  function showChip(text, onClick) {
    let chip = document.getElementById("learnChip");
    if (!chip) {
      chip = document.createElement("button");
      chip.id = "learnChip";
      chip.className = "learn-chip-float";
      document.body.appendChild(chip);
    }
    chip.textContent = text;
    chip.onclick = onClick;
    chip.style.display = "flex";
  }

  function hideChip() {
    const chip = document.getElementById("learnChip");
    if (chip) chip.style.display = "none";
  }

  // ================= 事件 =================
  function bindEvents() {
    const tabs = document.getElementById("learnTabs");
    if (tabs) {
      tabs.addEventListener("click", (e) => {
        const btn = e.target.closest(".learn-tab");
        if (btn) { switchTab(btn.dataset.tab); sound("playPop"); }
      });
    }
    const closeBtn = document.getElementById("learnClose");
    if (closeBtn) closeBtn.addEventListener("click", close);
    const modal = document.getElementById("learnModal");
    if (modal) {
      modal.addEventListener("click", (e) => { if (e.target === modal) close(); });
    }
    const body = document.getElementById("learnBody");
    if (body) body.addEventListener("click", handleAction);
  }

  function handleAction(e) {
    const btn = e.target.closest("[data-act]");
    if (!btn) return;
    const act = btn.dataset.act;
    const body = document.getElementById("learnBody");
    const p = progress();

    switch (act) {
      // ---- 地图 ----
      case "stage":
        state.lessonStageFilter = Number(btn.dataset.stage);
        switchTab("lesson");
        break;
      case "unit": {
        const unit = btn.dataset.unit;
        const l = lessons().find(x => x.unit === unit);
        if (l) { state.lessonId = l.id; switchTab("lesson"); }
        break;
      }
      case "go-lesson":
        state.lessonId = btn.dataset.id;
        switchTab("lesson");
        break;
      case "go-ex":
        state.exId = btn.dataset.id;
        state.exShown = PAGE_SIZE;
        switchTab("exercise");
        break;

      // ---- 教程 ----
      case "lesson":
        state.lessonId = btn.dataset.id;
        renderLesson(body);
        sound("playPop");
        break;
      case "run-lesson": {
        const l = lessons().find(x => x.id === btn.dataset.id);
        if (!l) break;
        runFileInWorkspace("教程_" + l.id + "_" + String(l.title).replace(/[\\/:*?"<>|]/g, "").slice(0, 14) + ".py", l.code);
        if (p) p.recordLessonRun();
        toast("▶ 教程示例已经在工坊里运行啦，去右边看看结果~", "🚀");
        break;
      }
      case "open-lesson": {
        const l = lessons().find(x => x.id === btn.dataset.id);
        if (!l) break;
        openFileInWorkspace("教程_" + l.id + "_" + String(l.title).replace(/[\\/:*?"<>|]/g, "").slice(0, 14) + ".py", l.code);
        toast("✏️ 已经放到编辑器里了，改一改再运行试试~", "✏️");
        break;
      }
      case "quiz": {
        const l = lessons().find(x => x.id === btn.dataset.id);
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
        if (fb) fb.innerHTML = right
          ? '<span class="ok">🎉 答对啦！</span> ' + rich(q.tip || "")
          : '<span class="warn">再想想～</span> ' + rich(q.tip || "");
        if (p) p.recordQuiz(right);
        if (right) { sound("playSuccess"); renderHud(); }
        break;
      }
      case "finish-lesson": {
        const l = lessons().find(x => x.id === btn.dataset.id);
        if (!l) break;
        if (!p) break;
        const wasDone = p.isLessonDone(l.id);
        const res = p.recordLesson(l);
        renderLesson(body);
        renderHud();
        if (!wasDone) {
          celebrate();
          sound("playSuccess");
          toast("🎓 学完《" + l.title + "》，+" + ((res && res.xp) || 15) + " 经验！", "🎉");
          (p.describeRewards(res) || []).forEach((line, i) => setTimeout(() => toast(line, "🌟"), 750 * (i + 1)));
        } else {
          toast("又复习了一遍，真棒！", "👍");
        }
        break;
      }
      case "practice-topic":
        state.exTopic = btn.dataset.topic;
        state.exId = "";
        state.exShown = PAGE_SIZE;
        switchTab("exercise");
        break;

      // ---- 示例 ----
      case "ex-cat":
        state.exampleCat = btn.dataset.cat;
        state.exampleId = "";
        renderExample(body);
        break;
      case "ex-level":
        state.exampleLevel = Number(btn.dataset.level);
        state.exampleId = "";
        renderExample(body);
        break;
      case "ex-open":
        state.exampleId = btn.dataset.id;
        renderExample(body);
        break;
      case "ex-back":
        state.exampleId = "";
        renderExample(body);
        break;
      case "run-example": {
        const ex = exampleList().find(x => x.id === btn.dataset.id);
        if (!ex) break;
        runFileInWorkspace("示例_" + String(ex.title).replace(/[\\/:*?"<>|]/g, "").slice(0, 16) + ".py", ex.code);
        toast("▶ 示例已经在工坊里运行啦，去右边看看~", "🚀");
        break;
      }
      case "open-example": {
        const ex = exampleList().find(x => x.id === btn.dataset.id);
        if (!ex) break;
        openFileInWorkspace("示例_" + String(ex.title).replace(/[\\/:*?"<>|]/g, "").slice(0, 16) + ".py", ex.code);
        toast("✏️ 已经放进编辑器，改改看会有什么变化？", "✏️");
        break;
      }

      // ---- 练习 ----
      case "ex-topic":
        state.exTopic = btn.dataset.topic;
        state.exShown = PAGE_SIZE;
        state.exId = "";
        renderExercise(body);
        break;
      case "ex-lv":
        state.exLevel = Number(btn.dataset.level);
        state.exShown = PAGE_SIZE;
        state.exId = "";
        renderExercise(body);
        break;
      case "ex-status":
        state.exStatus = btn.dataset.status;
        state.exShown = PAGE_SIZE;
        state.exId = "";
        renderExercise(body);
        break;
      case "ex-more":
        state.exShown += PAGE_SIZE;
        renderExercise(body);
        break;
      case "ex-open-item":
        state.exId = btn.dataset.id;
        state.exResult = null;
        renderExercise(body);
        sound("playPop");
        break;
      case "ex-back":
        state.exId = "";
        state.exResult = null;
        renderExercise(body);
        break;
      case "ex-goto": {
        const ex = bank().find(x => x.id === state.exId);
        if (!ex) break;
        openFileInWorkspace(exerciseFileName(ex), starterCode(ex));
        showChip("✏️ 做 " + ex.id + "：点我回来批改", () => open("exercise"));
        close();
        toast("✏️ 题目已经放进编辑器啦：写完代码先点 🚀 运行，再点右下角小按钮回来批改~", "📝");
        break;
      }
      case "ex-judge": {
        const ex = bank().find(x => x.id === state.exId);
        if (ex) judgeExercise(ex, body);
        break;
      }
      case "ex-selfcheck": {
        const ex = bank().find(x => x.id === state.exId);
        if (!ex || !p) break;
        const res = p.recordExercise({ id: ex.id, topic: ex.topic, level: ex.level, passed: true });
        renderExercise(body);
        renderHud();
        celebrate();
        sound("playSuccess");
        toast("🙋 太棒了，完成一道动手题！", "🎉");
        (p.describeRewards(res) || []).forEach((line, i) => setTimeout(() => toast(line, "🌟"), 750 * (i + 1)));
        break;
      }
      case "ex-answer": {
        const ex = bank().find(x => x.id === state.exId);
        if (!ex) break;
        const wrap = btn.closest(".ex-detail");
        let box = wrap.querySelector(".ex-answer-box");
        if (box) { box.remove(); return; }
        box = document.createElement("div");
        box.className = "ex-answer-box";
        box.innerHTML = '<div class="ex-sample-title">👀 参考答案（先自己想 3 分钟再看哦）</div>' +
          '<pre class="lesson-code">' + esc(ex.answer || "") + '</pre>' +
          '<div class="ex-answer-tip">看懂了就把它关掉，凭记忆自己再写一遍，这样才记得牢 💪</div>';
        wrap.appendChild(box);
        break;
      }

      // ---- 模拟考 ----
      case "exam-level":
        state.examLevel = Number(btn.dataset.level);
        renderExam(body);
        break;
      case "exam-start": {
        const ids = buildPaper(state.examLevel, 10);
        if (!ids.length) { toast("这个级别还没有可考的题目，换一个级别试试~", "📝"); return; }
        state.examPaper = { level: state.examLevel, ids: ids, answers: {}, startedAt: Date.now() };
        state.examIndex = 0;
        renderExam(body);
        toast("📝 开始考试！做完一题点一次「批改这题」~", "🚀");
        break;
      }
      case "exam-goto":
        state.examIndex = Number(btn.dataset.i);
        renderExam(body);
        break;
      case "exam-prev":
        state.examIndex = Math.max(0, state.examIndex - 1);
        renderExam(body);
        break;
      case "exam-next":
        state.examIndex = Math.min(state.examPaper.ids.length - 1, state.examIndex + 1);
        renderExam(body);
        break;
      case "exam-goto-file": {
        const ex = bank().find(x => x.id === state.examPaper.ids[state.examIndex]);
        if (!ex) break;
        openFileInWorkspace(exerciseFileName(ex), starterCode(ex));
        showChip("📝 考试第 " + (state.examIndex + 1) + " 题：点我回来批改", () => open("exam"));
        close();
        break;
      }
      case "exam-judge":
        judgeExamQuestion(body);
        break;
      case "exam-quit":
        state.examPaper = null;
        render();
        break;
      case "exam-submit":
        submitExam();
        break;
    }
  }

  // ================= 初始化 =================
  function init() {
    bindEvents();
    // 预取课程数据，让「学习地图」秒开
    ensureAssets(["lessons"]).then(() => {
      if (document.getElementById("learnModal").classList.contains("active")) render();
      renderHud();
    }).catch(() => {});
  }

  return {
    init,
    open,
    close,
    switchTab,
    render,
    /** 供外部（成长面板按钮）打开指定标签页 */
    openTab: (tab) => open(tab)
  };
})();

window.Learn = Learn;
