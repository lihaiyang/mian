/**
 * 🧭 App —— 路由与页面渲染
 * 纯 hash 路由（零依赖）：#/map #/island/life #/review #/wordbook #/library
 *   #/reader/r_mycat #/games #/game/whack #/exam #/me #/parent #/settings
 * 数据文件按需懒加载（带版本号），首屏只加载地图需要的 lessons.js 与一个主题词库。
 */
const App = (() => {
  const V = window.EN_V || "1";
  const loadedScripts = {};
  const view = () => document.getElementById("view");

  const THEMES = ["colors", "numbers", "body", "family", "food", "animals",
    "clothes", "toys", "school", "weather", "transport", "home"];
  const THEME_ZH = { colors: "颜色", numbers: "数字", body: "身体", family: "家庭", food: "食物",
    animals: "动物", clothes: "衣物", toys: "玩具", school: "学校", weather: "天气",
    transport: "交通", home: "家居" };
  const THEME_EMOJI = { colors: "🎨", numbers: "🔢", body: "🖐", family: "👨‍👩‍👧", food: "🍎",
    animals: "🐼", clothes: "👕", toys: "🧸", school: "🏫", weather: "☀️", transport: "🚌", home: "🏠" };

  /* ---------------- 懒加载 ---------------- */
  function loadScript(src) {
    if (loadedScripts[src]) return loadedScripts[src];
    loadedScripts[src] = new Promise(resolve => {
      const s = document.createElement("script");
      s.src = src + "?v=" + V;
      s.onload = () => resolve(true);
      s.onerror = () => { delete loadedScripts[src]; resolve(false); };
      document.head.appendChild(s);
    });
    return loadedScripts[src];
  }

  async function ensure(kind) {
    if (kind === "words") {
      const missing = THEMES.filter(t => !(window.EN_WORDS && window.EN_WORDS[t]));
      const r = await Promise.all(missing.map(t => loadScript("data/words-" + t + ".js")));
      return r.some(Boolean) || missing.length === 0;
    }
    if (kind === "phonics") { if (!window.EN_PHONICS) await loadScript("data/phonics.js"); return !!window.EN_PHONICS; }
    if (kind === "sentences") { if (!window.EN_SENTENCES) await loadScript("data/sentences.js"); return !!window.EN_SENTENCES; }
    if (kind === "readers") { if (!window.EN_READERS) await loadScript("data/readers.js"); return !!window.EN_READERS; }
    if (kind === "pairs") { if (!window.EN_PAIRS) await loadScript("data/minimal-pairs.js"); return !!window.EN_PAIRS; }
    if (kind === "lessons") { if (!window.EN_LEVELS || !window.EN_ISLANDS) await loadScript("data/lessons.js"); return !!window.EN_LEVELS; }
    return true;
  }

  function allWords() {
    const bank = window.EN_WORDS || {};
    const out = [];
    for (const t in bank) out.push.apply(out, bank[t]);
    return out;
  }
  function wordById(id) { return allWords().find(w => w.id === id) || null; }
  function levels() { return window.EN_LEVELS || []; }
  function islands() { return window.EN_ISLANDS || []; }

  /* ---------------- 顶栏 / 底部导航 ---------------- */
  function renderHud() {
    const hud = document.getElementById("hud");
    if (!hud) return;
    const s = Progress.stats();
    const due = typeof SRS !== "undefined" ? SRS.stats().due : 0;
    const p = s.profile;
    hud.innerHTML =
      '<span class="hud-chip" title="星星">⭐ ' + s.stars + "</span>" +
      '<span class="hud-chip ' + (s.streak >= 3 ? "hot" : "") + '" title="连续学习天数">🔥 ' + s.streak + " 天</span>" +
      '<span class="hud-chip ' + (due > 0 ? "warn" : "") + '" title="今天要复习的卡片">🔁 ' + due + "</span>" +
      '<button class="hud-chip hud-profile" id="hudProfile" title="成长档案">' +
        '<span class="hud-avatar" aria-hidden="true">' + UI.esc(p.emoji) + "</span>" +
        '<span>' + UI.esc(p.name) + "</span>" +
      "</button>";
    const b = document.getElementById("hudProfile");
    if (b) b.addEventListener("click", () => go("#/me"));
  }

  const TABS = [
    { hash: "#/map", emoji: "🗺", label: "地图" },
    { hash: "#/review", emoji: "🔁", label: "复习" },
    { hash: "#/library", emoji: "📚", label: "绘本" },
    { hash: "#/games", emoji: "🎮", label: "游戏" },
    { hash: "#/me", emoji: "🏅", label: "我的" }
  ];
  function renderTabs() {
    const bar = document.getElementById("tabbar");
    if (!bar) return;
    const cur = currentHash();
    bar.innerHTML = TABS.map(t =>
      '<button class="tab' + (cur.startsWith(t.hash) ? " active" : "") + '" data-hash="' + t.hash + '" aria-label="' + t.label + '">' +
        '<span class="tab-emoji" aria-hidden="true">' + t.emoji + "</span><span>" + t.label + "</span></button>").join("");
    Array.from(bar.children).forEach(b => b.addEventListener("click", () => go(b.dataset.hash)));
  }

  /* ---------------- 路由 ---------------- */
  function currentHash() {
    const h = location.hash || "#/map";
    return h.split("?")[0];
  }
  function go(hash) {
    if (location.hash === hash) render();
    else location.hash = hash;
  }

  async function render() {
    const h = currentHash();
    const parts = h.replace(/^#\/?/, "").split("/");
    const page = parts[0] || "map";
    renderTabs();
    renderHud();
    const v = view();
    v.innerHTML = UI.loading("正在准备…");
    try {
      if (page === "map") await pageMap(v);
      else if (page === "island") await pageIsland(v, parts[1] || "life");
      else if (page === "review") await pageReview(v);
      else if (page === "wordbook") await pageWordbook(v);
      else if (page === "library") await pageLibrary(v);
      else if (page === "reader") await pageReader(v, parts[1]);
      else if (page === "games") await pageGames(v);
      else if (page === "game") await pageGame(v, parts[1]);
      else if (page === "exam") await pageExam(v);
      else if (page === "me") await pageMe(v);
      else if (page === "parent") await pageParent(v);
      else if (page === "settings") await pageSettings(v);
      else if (page === "letter") { await ensure("phonics"); await letterPage(v, parts[1]); }
      else { await pageMap(v); }
    } catch (e) {
      v.innerHTML = '<div class="card"><div class="card-title">😵 出了点小状况</div><div class="muted">' +
        UI.esc(e && e.message ? e.message : String(e)) + "</div>" +
        '<div class="btn-row"><button class="btn btn-primary" id="toMap">回到地图</button></div></div>';
      const b = document.getElementById("toMap");
      if (b) b.addEventListener("click", () => go("#/map"));
    }
    v.scrollIntoView ? window.scrollTo(0, 0) : null;
  }

  /* ---------------- 地图首页 ---------------- */
  async function pageMap(v) {
    Progress.touchToday();
    const okLessons = await ensure("lessons");
    await ensure("words");
    const s = Progress.stats();
    const dueList = typeof SRS !== "undefined" ? SRS.due() : [];
    const pending = levels().filter(l => !Progress.isLevelDone(l.id));
    const next = pending[0] || null;

    let html = '<div class="map-hero"><div class="today-plan">' +
      '<div class="card-title">🎒 今天做点什么？</div>' +
      '<div class="today-item"><span aria-hidden="true">🔁</span> 复习记忆盒 <b>' + dueList.length + " 张卡</b></div>" +
      (next ? '<div class="today-item"><span aria-hidden="true">' + UI.esc(next.emoji) + "</span> 接着学：" + UI.esc(next.title) + " <b>去闯关 ▶</b></div>"
            : '<div class="today-item done"><span aria-hidden="true">🎉</span> 生活岛的关卡都学完啦！</div>') +
      '<div class="today-item"><span aria-hidden="true">📖</span> 读一本绘本 <b>去书架 ▶</b></div>' +
      '<div class="btn-row" style="margin-top:12px">' +
        '<button class="btn btn-big btn-primary" id="startToday">▶ 开始今天</button>' +
      "</div></div></div>";

    if (!okLessons || !levels().length) {
      html += '<div class="card" style="margin-top:16px"><div class="card-title">⏳ 关卡正在生成</div>' +
        '<div class="muted">词库到位后运行 <code>python3 en/tools/gen_lessons.py</code> 就能生成 120 个关卡。</div></div>';
    }

    html += '<div class="section-title">🏝 六座岛<span class="ribbon">按顺序探险</span></div><div class="island-map" id="islandMap"></div>';

    html += '<div class="section-title">📋 今日任务<span class="ribbon">每天 3 个</span></div>' +
      '<div class="card">' + Progress.daily().map(d =>
        '<div class="today-item' + (d.done ? " done" : "") + '"><span aria-hidden="true">' + d.emoji + "</span> " + UI.esc(d.title) +
        "<b>" + d.have + "/" + d.need + "</b> <i>+" + d.xp + "✨</i></div>").join("") + "</div>";

    v.innerHTML = html;

    const map = document.getElementById("islandMap");
    const info = Progress.level();
    islands().forEach(is => {
      const prog = islandProgress(is);
      const locked = prog.total === 0;
      const card = UI.el("button", { class: "island-card" + (locked ? " locked" : ""), "aria-label": is.name });
      card.innerHTML =
        '<div class="island-emoji" aria-hidden="true">' + is.emoji + "</div>" +
        '<div class="island-name">' + UI.esc(is.name) + (locked ? " 🔒" : "") + "</div>" +
        '<div class="island-desc">' + UI.esc(is.desc) + "</div>" +
        '<div class="island-bar"><span style="width:' + prog.percent + '%"></span></div>' +
        '<div class="island-foot"><span>' + prog.done + "/" + prog.total + "</span>" +
        '<span class="spacer"></span><span class="lock-tip">' + (locked ? "马上就来" : prog.percent >= 100 ? "全部完成 ✅" : "继续 ▶") + "</span></div>";
      card.addEventListener("click", () => { AudioFX.playClick(); go("#/island/" + is.id); });
      map.appendChild(card);
    });

    const st = document.getElementById("startToday");
    if (st) st.addEventListener("click", () => {
      AudioFX.unlock();
      if (dueList.length) Stage.openReview(dueList);
      else if (next) Stage.open(next.id);
      else go("#/library");
    });

    if (typeof Player !== "undefined" && !map.dataset.warmed) {
      map.dataset.warmed = "1";
      ["letters", "phonics", "sentences"].forEach(g => Player.ready(g));
    }
  }

  function islandProgress(is) {
    if (is.kind === "themes") {
      const ls = levels();
      return { total: ls.length || 120, done: ls.filter(l => Progress.isLevelDone(l.id)).length, percent: ls.length ? Math.round(ls.filter(l => Progress.isLevelDone(l.id)).length / ls.length * 100) : 0 };
    }
    if (is.kind === "letters") { const n = Object.keys(Progress.get().letters).length; return { total: 26, done: n, percent: Math.round(n / 26 * 100) }; }
    if (is.kind === "phonics") { const n = (window.EN_PHONICS || []).filter(p => Progress.isPhonicsDone(p.id)).length; const t = (window.EN_PHONICS || []).length || 30; return { total: t, done: n, percent: Math.round(n / t * 100) }; }
    if (is.kind === "sentences") { const n = (window.EN_SENTENCES || []).filter(x => Progress.isSentenceDone(x.id)).length; const t = (window.EN_SENTENCES || []).length || 100; return { total: t, done: n, percent: Math.round(n / t * 100) }; }
    if (is.kind === "readers") { const n = (window.EN_READERS || []).filter(r => Progress.isReaderDone(r.id)).length; const t = (window.EN_READERS || []).length || 20; return { total: t, done: n, percent: Math.round(n / t * 100) }; }
    if (is.kind === "exams") { const n = Object.keys(Progress.get().exams).length; return { total: 20, done: n, percent: Math.round(n / 20 * 100) }; }
    return { total: 0, done: 0, percent: 0 };
  }

  /* ---------------- 岛屿页 ---------------- */
  async function pageIsland(v, id) {
    await ensure("lessons");
    const is = islands().find(x => x.id === id) || islands()[2];
    if (!is) { v.innerHTML = UI.empty("这座岛还没开放"); return; }
    let html = '<div class="section-title">' + is.emoji + " " + UI.esc(is.name) +
      '<span class="ribbon">' + UI.esc(is.desc) + "</span></div>" +
      '<div class="btn-row"><button class="btn btn-sm" id="backMap">← 回地图</button></div><div style="height:12px"></div>';

    if (is.kind === "letters") {
      await ensure("phonics");
      html += '<div class="level-grid" id="grid"></div>';
      v.innerHTML = html;
      const grid = document.getElementById("grid");
      (window.EN_LETTERS || []).forEach(L => {
        const done = Progress.isLetterDone(L.letter);
        const c = UI.el("button", { class: "level-card" + (done ? " done" : ""), "aria-label": "字母 " + L.letter });
        c.innerHTML = '<div class="lv-emoji" aria-hidden="true">' + L.emoji + "</div>" +
          '<div class="lv-title">' + L.letter + " " + L.lower + "</div>" +
          '<div class="lv-meta">' + UI.esc(L.sound) + " · " + UI.esc((L.words || []).join(" ")) + "</div>" +
          (done ? '<div class="level-num">✓</div>' : "");
        c.addEventListener("click", () => Stage.openLetter(L.letter));
        grid.appendChild(c);
      });
    } else if (is.kind === "phonics") {
      await ensure("phonics");
      await ensure("pairs");
      html += '<div class="card" style="margin-bottom:14px"><div class="card-title">👂 听辨小挑战</div>' +
        '<div class="card-sub">机器不听音准，但耳朵可以先练出来：cap 还是 cup？light 还是 right？</div>' +
        '<div class="btn-row" style="margin-top:10px"><button class="btn btn-primary" id="startPairs">开始听辨（8 组）</button></div></div>';
      const units = [];
      (window.EN_PHONICS || []).forEach(p => {
        let u = units.find(x => x.name === p.unit);
        if (!u) { u = { name: p.unit, list: [] }; units.push(u); }
        u.list.push(p);
      });
      html += units.map(u => '<div class="section-title" style="font-size:18px">🧩 ' + UI.esc(u.name) + "</div>" +
        '<div class="level-grid">' + u.list.map(p => {
          const done = Progress.isPhonicsDone(p.id);
          return '<button class="level-card' + (done ? " done" : "") + '" data-ph="' + p.id + '">' +
            '<div class="lv-emoji" aria-hidden="true">' + p.emoji + "</div>" +
            '<div class="lv-title">' + UI.esc(p.title) + "</div>" +
            '<div class="lv-meta">' + (p.blends || []).map(b => UI.esc(b.word)).join(" · ") + "</div>" +
            (done ? '<div class="level-num">✓</div>' : "") + "</button>";
        }).join("") + "</div>").join("");
      v.innerHTML = html;
      const sp = document.getElementById("startPairs");
      if (sp) sp.addEventListener("click", () => { AudioFX.unlock(); Stage.openPairs(); });
      Array.from(v.querySelectorAll("[data-ph]")).forEach(b => b.addEventListener("click", () => Stage.openPhonics(b.dataset.ph)));
    } else if (is.kind === "themes") {
      await ensure("words");
      const byTheme = {};
      levels().forEach(l => { (byTheme[l.theme] = byTheme[l.theme] || []).push(l); });
      html += THEMES.map(t => {
        const list = byTheme[t] || [];
        const done = list.filter(l => Progress.isLevelDone(l.id)).length;
        return '<div class="section-title" style="font-size:18px">' + THEME_EMOJI[t] + " " + THEME_ZH[t] +
          '<span class="ribbon">' + done + "/" + (list.length || 10) + "</span></div>" +
          '<div class="level-grid">' + list.map(l => {
            const stars = Progress.levelStars(l.id);
            return '<button class="level-card' + (stars ? " done" : "") + '" data-lv="' + l.id + '">' +
              '<div class="level-num">' + l.index + "</div>" +
              '<div class="lv-emoji" aria-hidden="true">' + l.emoji + "</div>" +
              '<div class="lv-title">' + UI.esc(l.title) + "</div>" +
              '<div class="lv-meta">' + (stars ? UI.stars(stars, 3) : "还没学") + "</div></button>";
          }).join("") + "</div>";
      }).join("");
      v.innerHTML = html;
      Array.from(v.querySelectorAll("[data-lv]")).forEach(b => b.addEventListener("click", () => Stage.open(b.dataset.lv)));
    } else if (is.kind === "sentences") {
      await ensure("sentences");
      const list = window.EN_SENTENCES || [];
      html += '<div class="level-grid">' + list.map(x => {
        const done = Progress.isSentenceDone(x.id);
        return '<button class="level-card' + (done ? " done" : "") + '" data-se="' + x.id + '">' +
          '<div class="lv-emoji" aria-hidden="true">' + x.emoji + "</div>" +
          '<div class="lv-title sent-en">' + UI.esc(x.pattern) + "</div>" +
          '<div class="lv-meta">' + UI.esc(x.zh) + "</div></button>";
      }).join("") + "</div>";
      v.innerHTML = html;
      Array.from(v.querySelectorAll("[data-se]")).forEach(b => b.addEventListener("click", () => Stage.openSentence(b.dataset.se)));
    } else if (is.kind === "readers") {
      await pageLibrary(v, true);
      return;
    } else {
      html += '<div class="card"><div class="card-title">🏆 模拟卷</div><div class="muted">每套 10 题（5 题听力 + 5 题认读），做完出成绩单。</div>' +
        '<div class="level-grid" style="margin-top:12px">' +
        Array.from({ length: 20 }, (_, i) => {
          const id = "ex" + (i + 1);
          const score = Progress.get().exams[id];
          return '<button class="level-card' + (score != null ? " done" : "") + '" data-ex="' + id + '">' +
            '<div class="lv-emoji" aria-hidden="true">📝</div>' +
            '<div class="lv-title">第 ' + (i + 1) + " 套</div>" +
            '<div class="lv-meta">' + (score != null ? "最好成绩 " + score + " 分" : "还没做过") + "</div></button>";
        }).join("") + "</div></div>";
      v.innerHTML = html;
      Array.from(v.querySelectorAll("[data-ex]")).forEach(b => b.addEventListener("click", () => Stage.openExam(b.dataset.ex)));
    }

    const back = document.getElementById("backMap");
    if (back) back.addEventListener("click", () => go("#/map"));
  }

  async function letterPage(v, letter) { go("#/island/letter"); }

  /* ---------------- 今日复习 ---------------- */
  async function pageReview(v) {
    await ensure("words");
    const st = SRS.stats();
    const due = SRS.due();
    const dueWords = due.map(id => wordById(id)).filter(Boolean);
    let html = '<div class="section-title">🔁 今日复习<span class="ribbon">' + due.length + " 张</span></div>";
    html += '<div class="card"><div class="card-title">🗃 记忆盒</div>' +
      '<div class="boxes" style="margin-top:10px">' + st.boxes.map((n, i) =>
        '<div class="box-col"><div class="box-lid"><div class="box-num">第 ' + (i + 1) + ' 盒</div><div class="box-count">' + n + '</div>' +
        '<div class="box-num">' + SRS.BOX_DAYS[i] + " 天</div></div></div>").join("") + "</div>" +
      '<div class="btn-row" style="margin-top:14px">' +
        '<button class="btn btn-big btn-primary" id="startReview"' + (due.length ? "" : " disabled") + ">开始复习</button>" +
        '<button class="btn" id="toWordbook">看单词本</button>' +
      "</div></div>";

    if (dueWords.length) {
      html += '<div class="section-title" style="font-size:18px">今天要见的词</div><div class="word-grid">' +
        dueWords.slice(0, 20).map(w => '<div class="word-tile"><div class="wt-emoji" aria-hidden="true">' + w.emoji +
          '</div><div class="wt-word">' + UI.esc(w.word) + '</div><div class="wt-zh">' + UI.esc(w.zh) + "</div></div>").join("") + "</div>";
    } else {
      html += '<div class="card" style="margin-top:16px">' + UI.panda("今天没有到期的卡片～ 去学几个新词，明天就有得复习啦！", "happy") + "</div>";
    }
    v.innerHTML = html;

    const b = document.getElementById("startReview");
    if (b) b.addEventListener("click", () => { AudioFX.unlock(); Stage.openReview(due); });
    const wb = document.getElementById("toWordbook");
    if (wb) wb.addEventListener("click", () => go("#/wordbook"));
  }

  /* ---------------- 单词本 ---------------- */
  async function pageWordbook(v) {
    await ensure("words");
    const st = SRS.stats();
    const all = SRS.exportRows().filter(r => !r.deleted);
    const byBox = [0, 1, 2, 3, 4, 5].map(b => all.filter(r => r.box === b));
    let html = '<div class="section-title">🗃 我的单词本<span class="ribbon">学过 ' + st.total + " 个</span></div>";
    html += '<div class="card"><div class="boxes">' + st.boxes.map((n, i) =>
      '<div class="box-col"><div class="box-lid"><div class="box-num">第 ' + (i + 1) + '</div><div class="box-count">' + n +
      '</div><div class="box-num">' + SRS.BOX_DAYS[i] + " 天</div></div></div>").join("") +
      '<div class="box-col"><div class="box-lid" style="background:var(--teal-soft)"><div class="box-num">已掌握</div><div class="box-count">' +
      st.learned + '</div><div class="box-num">出师啦</div></div></div></div>' +
      '<div class="muted small" style="margin-top:10px">答对就往上走一格，答错了回到第 1 格 —— 不扣分，只是明天再见一次。</div></div>';

    const mastered = byBox[5].map(r => wordById(r.item_id)).filter(Boolean);
    const learning = byBox.slice(0, 5).reduce((a, b) => a.concat(b), []).map(r => wordById(r.item_id)).filter(Boolean);
    html += tileSection("✅ 已经掌握", mastered);
    html += tileSection("🌱 正在学", learning);
    if (!mastered.length && !learning.length) html += '<div class="card">' + UI.panda("还没有单词进记忆盒，去闯一关试试～", "think") + "</div>";
    v.innerHTML = html;
  }

  function tileSection(title, words) {
    if (!words.length) return "";
    return '<div class="section-title" style="font-size:18px">' + title + '<span class="ribbon">' + words.length + "</span></div>" +
      '<div class="word-grid">' + words.slice(0, 200).map(w =>
        '<button class="word-tile" data-say="' + w.id + '"><div class="wt-emoji" aria-hidden="true">' + w.emoji +
        '</div><div class="wt-word">' + UI.esc(w.word) + '</div><div class="wt-zh">' + UI.esc(w.zh) + "</div></button>").join("") + "</div>";
  }

  /* ---------------- 绘本 ---------------- */
  async function pageLibrary(v, embedded) {
    await ensure("readers");
    const list = window.EN_READERS || [];
    let html = (embedded ? "" : '<div class="section-title">📚 绘本架<span class="ribbon">' + list.length + " 本</span></div>") +
      '<div class="book-shelf">' + list.map(r => {
        const done = Progress.isReaderDone(r.id);
        return '<button class="book-card' + (done ? "" : "") + '" data-rd="' + r.id + '">' +
          '<div class="bc-emoji" aria-hidden="true">' + r.emoji + "</div>" +
          '<div class="bc-title">' + UI.esc(r.title) + "</div>" +
          '<div class="bc-zh">' + UI.esc(r.titleZh) + " · " + r.level + " 级</div>" +
          '<div style="margin-top:6px">' + (done ? '<span class="lvl-tag">已读过 ✓</span>' : '<span class="lvl-tag">点读 ▶</span>') + "</div></button>";
      }).join("") + "</div>";
    if (!embedded) html = '<div class="btn-row"><button class="btn btn-sm" id="backMap">← 回地图</button></div>' + html;
    v.innerHTML = html;
    Array.from(v.querySelectorAll("[data-rd]")).forEach(b => b.addEventListener("click", () => go("#/reader/" + b.dataset.rd)));
    const back = document.getElementById("backMap");
    if (back) back.addEventListener("click", () => go("#/map"));
  }

  async function pageReader(v, id) {
    await ensure("readers");
    const r = (window.EN_READERS || []).find(x => x.id === id);
    if (!r) { v.innerHTML = UI.empty("找不到这本书"); return; }
    let page = 0;
    function draw() {
      const p = r.pages[page];
      v.innerHTML =
        '<div class="btn-row"><button class="btn btn-sm" id="backLib">← 书架</button>' +
        '<div class="stage-title">' + UI.esc(r.title) + " · " + UI.esc(r.titleZh) + '</div><span class="spacer"></span>' +
        '<span class="muted small">第 ' + (page + 1) + "/" + r.pages.length + " 页</span></div>" +
        '<div class="book" id="book">' +
          '<div class="book-page" id="bp"><div class="bp-emoji" aria-hidden="true">' + p.emoji + "</div>" +
            '<div class="bp-en">' + UI.esc(p.en) + "</div>" +
            '<div class="bp-zh">' + UI.esc(p.zh) + "</div>" +
            '<button class="speaker" id="readPage">🔊 听这一页</button>' +
            '<button class="speaker" id="readSlow">🐢 慢速</button>' +
          "</div>" +
          '<div class="book-page">' +
            '<div class="muted small">点一下句子就能听；读完整本，做 3 道小测验。</div>' +
            '<div class="bp-emoji" aria-hidden="true">' + r.emoji + "</div>" +
            '<div class="btn-row" style="justify-content:center">' +
              '<button class="btn" id="prevPage"' + (page === 0 ? " disabled" : "") + ">← 上一页</button>" +
              '<button class="btn btn-primary" id="nextPage">' + (page === r.pages.length - 1 ? "做小测验 →" : "下一页 →") + "</button>" +
            "</div>" +
          "</div>" +
        "</div>" +
        '<div class="page-dots">' + r.pages.map((_, i) =>
          '<button class="page-dot' + (i === page ? " active" : "") + '" data-p="' + i + '">' + (i + 1) + "</button>").join("") + "</div>";

      const say = (slow) => Player.say(r.id + "#p" + (page + 1), { rate: slow ? 0.62 : 1, text: p.en });
      document.getElementById("readPage").addEventListener("click", () => { Progress.bump("pages", 1); say(false); });
      document.getElementById("readSlow").addEventListener("click", () => { Progress.bump("pages", 1); say(true); });
      document.getElementById("bp").addEventListener("click", e => { if (e.target.id !== "readPage" && e.target.id !== "readSlow") say(false); });
      document.getElementById("prevPage").addEventListener("click", () => { if (page > 0) { page--; AudioFX.playFlip(); draw(); } });
      document.getElementById("nextPage").addEventListener("click", () => {
        if (page < r.pages.length - 1) { page++; AudioFX.playFlip(); Progress.bump("pages", 1); draw(); say(false); }
        else { finishBook(); }
      });
      Array.from(v.querySelectorAll("[data-p]")).forEach(b => b.addEventListener("click", () => { page = parseInt(b.dataset.p, 10); draw(); }));
      const bl = document.getElementById("backLib");
      bl.addEventListener("click", () => go("#/library"));
    }
    function finishBook() {
      Progress.markReader(r.id);
      Progress.addXp(12);
      AudioFX.playSuccess();
      UI.confetti(30);
      UI.modal({ title: "🎉 读完《" + r.title + "》啦！", text: "经验 +12。做 3 道小测验，看看记住了多少？",
        actions: [{ label: "先不测", kind: "ghost", onClick: () => go("#/library") },
                  { label: "开始小测验 →", kind: "primary", onClick: () => Stage.openReaderQuiz(r) }] });
    }
    draw();
    Player.ready(r.id + "#p1") || Player.say(r.id + "#p1", { text: r.pages[0].en });
  }

  /* ---------------- 游戏 ---------------- */
  async function pageGames(v) {
    const list = (typeof Games !== "undefined" && Games.list) ? Games.list : [];
    let html = '<div class="section-title">🎮 游戏厅<span class="ribbon">用学过的词玩</span></div>';
    if (!list.length) html += '<div class="card">' + UI.panda("游戏正在准备中…", "think") + "</div>";
    else html += '<div class="grid-2">' + list.map(g =>
      '<button class="card" data-gm="' + g.id + '" style="text-align:left">' +
      '<div class="card-title">' + g.emoji + " " + UI.esc(g.name) + "</div>" +
      '<div class="card-sub">' + UI.esc(g.desc) + "</div></button>").join("") + "</div>";
    v.innerHTML = html;
    Array.from(v.querySelectorAll("[data-gm]")).forEach(b => b.addEventListener("click", () => go("#/game/" + b.dataset.gm)));
  }

  async function pageGame(v, id) {
    await ensure("words");
    v.innerHTML = '<div class="btn-row"><button class="btn btn-sm" id="backGames">← 游戏厅</button></div>' +
      '<div id="gameHost" style="margin-top:12px"></div>';
    document.getElementById("backGames").addEventListener("click", () => { if (typeof Games !== "undefined") Games.close(); go("#/games"); });
    const host = document.getElementById("gameHost");
    if (typeof Games === "undefined") { host.innerHTML = UI.empty("游戏模块没加载成功"); return; }
    Games.open(host, id);
  }

  /* ---------------- 模拟卷 ---------------- */
  async function pageExam(v) { go("#/island/challenge"); }

  /* ---------------- 成长档案 ---------------- */
  async function pageMe(v) {
    const s = Progress.stats();
    const lv = s.level;
    const badges = Progress.badges();
    const medals = Progress.medals();
    const missions = Progress.missions();
    const gotBadges = badges.filter(b => b.got).length;
    const gotMedals = medals.filter(m => m.got).length;

    let html = '<div class="card"><div class="level-card-hero">' +
      '<div class="level-medal" aria-hidden="true">' + lv.emoji + "</div>" +
      "<div style=\"flex:1\">" +
        '<div class="card-title">Lv.' + lv.level + " " + UI.esc(lv.title) + "</div>" +
        '<div class="bar xp-bar" style="margin:8px 0"><span style="width:' + lv.percent + '%"></span></div>' +
        '<div class="card-sub">' + (lv.isMax ? "已经满级啦，太厉害了！" : "再攒 " + (lv.need - lv.cur) + " 点经验就升级 ✨") + "</div>" +
      "</div></div>" +
      '<div class="report-kpi" style="margin-top:14px">' +
        kpi(s.words, "学过的词") + kpi(s.mastered, "掌握的词") + kpi(s.streak, "连续天数") +
        kpi(s.stars, "星星") + kpi(s.minutes, "学习分钟") + kpi(s.speaking + "s", "开口时长") +
      "</div></div>";

    html += '<div class="section-title">🎯 闯关任务<span class="ribbon">' + missions.filter(m => m.got).length + "/" + missions.length + "</span></div>" +
      '<div class="badge-grid">' + missions.map(m => badgeHtml(m.emoji, m.title, m.hint, m.got)).join("") + "</div>";

    html += '<div class="section-title">🏅 徽章<span class="ribbon">' + gotBadges + "/" + badges.length + "</span></div>" +
      '<div class="badge-grid">' + badges.map(b => badgeHtml(b.emoji, b.title, b.desc, b.got)).join("") + "</div>";

    html += '<div class="section-title">🥇 奖牌<span class="ribbon">' + gotMedals + "/" + medals.length + "</span></div>" +
      '<div class="medal-row">' + medals.map(m =>
        '<div class="medal ' + m.tier + '" style="opacity:' + (m.got ? 1 : .45) + '">' +
        '<div class="card-title" style="font-size:15px">' + m.emoji + " " + UI.esc(m.title) + "</div>" +
        '<div class="card-sub">' + UI.esc(m.desc) + "</div></div>").join("") + "</div>";

    html += '<div class="section-title">⚙️ 更多</div><div class="btn-row">' +
      '<button class="btn" id="toParent">📊 家长报告</button>' +
      '<button class="btn" id="toSettings">⚙️ 设置</button>' +
      '<button class="btn" id="toWordbook2">🗃 单词本</button>' +
      "</div>";

    v.innerHTML = html;
    document.getElementById("toParent").addEventListener("click", () => go("#/parent"));
    document.getElementById("toSettings").addEventListener("click", () => go("#/settings"));
    document.getElementById("toWordbook2").addEventListener("click", () => go("#/wordbook"));
  }

  function kpi(num, label) {
    return '<div class="kpi"><div class="k-num">' + UI.esc(String(num)) + '</div><div class="k-label">' + UI.esc(label) + "</div></div>";
  }
  function badgeHtml(emoji, title, desc, got) {
    return '<div class="badge' + (got ? "" : " locked") + '" title="' + UI.esc(desc) + '">' +
      '<div class="b-emoji" aria-hidden="true">' + (got ? emoji : "❔") + "</div>" +
      '<div class="b-title">' + UI.esc(title) + "</div>" +
      '<div class="b-desc">' + UI.esc(desc) + "</div></div>";
  }

  /* ---------------- 家长报告 ---------------- */
  async function pageParent(v) {
    await ensure("words");
    const s = Progress.stats();
    const days = Progress.dayStats(7);
    const maxM = Math.max(10, ...days.map(d => d.minutes));
    const rows = SRS.exportRows().filter(r => !r.deleted);
    const learning = rows.filter(r => r.box < 5);
    const hard = learning.map(r => wordById(r.item_id)).filter(Boolean)
      .filter(w => { const st = Progress.wordStat(w.id); return st && st.w > 0; })
      .sort((a, b) => (Progress.wordStat(b.id).w) - (Progress.wordStat(a.id).w)).slice(0, 8);
    const soon = learning.map(r => wordById(r.item_id)).filter(Boolean)
      .filter(w => { const st = Progress.wordStat(w.id); return st && st.r / st.s >= 0.7; }).slice(0, 10);

    let html = '<div class="section-title">📊 ' + UI.esc(s.profile.name) + " 的英语周报" +
      '<span class="ribbon">最近 7 天</span></div>';

    html += '<div class="card">' +
      '<div class="report-kpi">' +
        kpi(s.days, "学习天数") + kpi(s.minutes, "累计分钟") + kpi(s.words, "学过的词") +
        kpi(s.mastered, "已掌握") + kpi(s.streak, "连续天数") + kpi(s.speaking + "s", "开口时长") +
      "</div>" +
      '<div class="section-title" style="font-size:17px;margin:16px 0 6px">每天学习时长</div>' +
      '<div class="spark">' + days.map(d =>
        '<div class="sbar' + (d.visited ? "" : " zero") + '" style="height:' + Math.max(4, Math.round(d.minutes / maxM * 100)) + '%" title="' + d.date + '"></div>').join("") + "</div>" +
      '<div class="muted small">' + days.map(d => d.date.slice(5)).join(" · ") + "</div>" +
      "</div>";

    html += '<div class="card"><div class="card-title">🎤 开口与掌握情况</div>' +
      '<div class="row wrap" style="margin-top:8px">' +
        '<span class="chip">✅ 已掌握 ' + s.mastered + " 个</span>" +
        '<span class="chip">🟡 快会了 ' + soon.length + " 个</span>" +
        '<span class="chip">🔴 还要多听 ' + hard.length + " 个</span>" +
      "</div>" +
      '<div class="muted small" style="margin-top:10px">说明：本站在本机做「节奏评测」——能判断读完整没有、快慢、声音大小，' +
      "但<b>不能判断音准</b>（录音不会上传，也不接云端评分）。逐音纠音靠「听辨题 + 三明治回放 + 口型提示」。</div>" +
      "</div>";

    if (hard.length) {
      html += '<div class="card"><div class="card-title">⚠️ 这几个词多听两遍</div><div class="word-grid" style="margin-top:10px">' +
        hard.map(w => '<button class="word-tile" data-say2="' + w.id + '"><div class="wt-emoji" aria-hidden="true">' + w.emoji +
          '</div><div class="wt-word">' + UI.esc(w.word) + '</div><div class="wt-zh">' + UI.esc(w.zh) + "</div></button>").join("") + "</div></div>";
    }

    if (soon.length) {
      html += '<div class="card"><div class="card-title">🗣 今晚 5 分钟亲子任务</div>' +
        '<div class="card-sub">请孩子读这几个词给您听（不用纠发音，读完点一下就好）：</div>' +
        '<div class="word-grid" style="margin-top:10px">' +
        soon.slice(0, 5).map(w => '<div class="word-tile"><div class="wt-emoji" aria-hidden="true">' + w.emoji +
          '</div><div class="wt-word">' + UI.esc(w.word) + '</div><div class="wt-zh">' + UI.esc(w.zh) + "</div></div>").join("") + "</div>" +
        '<div class="btn-row" style="margin-top:12px">' +
          '<button class="btn btn-primary" id="parentOK">✅ 都读对了</button>' +
          '<button class="btn" id="parentAgain">🔁 再练练</button>' +
          '<button class="btn btn-ghost" id="parentPrint">🖨 打印这一页</button>' +
        "</div></div>";
    }

    html += '<div class="btn-row"><button class="btn" id="backMe">← 回成长档案</button>' +
      '<button class="btn" id="toSettings2">⚙️ 设置</button>' +
      '<button class="btn btn-ghost" id="shareReport">🔗 生成分享链接</button></div>';

    v.innerHTML = html;
    document.getElementById("backMe").addEventListener("click", () => go("#/me"));
    document.getElementById("toSettings2").addEventListener("click", () => go("#/settings"));
    Array.from(v.querySelectorAll("[data-say2]")).forEach(b => b.addEventListener("click", () => {
      const w = wordById(b.dataset.say2);
      if (w) Player.say(w.id + "#w", { text: w.word });
    }));
    const ok = document.getElementById("parentOK");
    if (ok) ok.addEventListener("click", () => {
      soon.slice(0, 5).forEach(w => Progress.markWord(w.id, true));
      Progress.addXp(20);
      UI.confetti(30); AudioFX.playSuccess();
      UI.toast("家长确认 +20 经验，孩子会看到 🎉", "ok");
    });
    const again = document.getElementById("parentAgain");
    if (again) again.addEventListener("click", () => UI.toast("好的，明天再试一次也没关系 🐼"));
    const pr = document.getElementById("parentPrint");
    if (pr) pr.addEventListener("click", () => window.print());
    const sr = document.getElementById("shareReport");
    if (sr) sr.addEventListener("click", async () => {
      if (typeof Cloud === "undefined" || !Cloud.isSignedIn()) {
        UI.modal({ title: "先登录同步码", text: "分享链接需要先把进度存到云端（设置 → 云同步 → 创建同步码），这样链接才不会因为换设备失效。" });
        return;
      }
      const summary = {
        "学习天数": s.days + " 天", "累计分钟": s.minutes + " 分钟", "学过的词": s.words + " 个",
        "已掌握": s.mastered + " 个", "连续打卡": s.streak + " 天", "开口时长": s.speaking + " 秒",
        "读完绘本": s.readers + " 本", "拿到星星": s.stars + " 颗"
      };
      try {
        const res = await fetch("/api/en/share", {
          method: "POST", headers: { "content-type": "application/json" },
          body: JSON.stringify({ code: Cloud.code(), kind: "report",
            title: s.profile.name + " 的英语周报", content: JSON.stringify(summary, null, 1),
            profile_id: Progress.profileId() })
        });
        const data = await res.json();
        if (data && data.ok) {
          const url = location.origin + "/en/share.html?id=" + data.id;
          UI.modal({ title: "🔗 分享链接做好了", html: '<div class="chip" style="width:100%;word-break:break-all">' + UI.esc(url) + "</div>" +
            '<div class="muted small" style="margin-top:8px">发给爷爷奶奶看看这周学了什么吧～ 只包含学习统计，不含录音与个人信息。</div>' });
        } else {
          UI.toast((data && data.error) || "生成失败，先登录同步码试试", "warn");
        }
      } catch (e) { UI.toast("离线模式：连上网络后再试", "warn"); }
    });
  }

  /* ---------------- 设置 ---------------- */
  async function pageSettings(v) {
    const st = getSettings();
    const profs = Progress.profiles();
    const cur = Progress.profileId();
    const recs = await Speech.listLocal();
    const usage = Store.usage();
    const idbUse = await Store.idbUsage();
    const groups = (typeof Player !== "undefined" && Player.loadedGroups) ? Player.loadedGroups() : [];

    let html = '<div class="section-title">⚙️ 设置</div>';

    html += '<div class="card"><div class="card-title">👦 小伙伴</div>' +
      '<div class="chip-row" style="margin-top:10px">' + profs.map(p =>
        '<button class="chip' + (p.id === cur ? " active" : "") + '" data-prof="' + p.id + '">' + p.emoji + " " + UI.esc(p.name) + "</button>").join("") +
        '<button class="chip" id="addProf">＋ 添加</button></div>' +
      '<div class="setting-row"><span class="setting-label">当前档位</span><div class="seg" id="gradeSeg">' +
        [1, 2, 3].map(g => '<button data-grade="' + g + '" class="' + (Progress.currentProfile().grade === g ? "on" : "") + '">Grade ' + g + "</button>").join("") +
      '</div><div class="setting-hint">Grade 1 启蒙 · Grade 2 小学低年级 · Grade 3 中高年级</div></div>' +
      '<div class="setting-row"><span class="setting-label">每日目标</span><div class="seg" id="goalSeg">' +
        [10, 15, 20].map(g => '<button data-goal="' + g + '" class="' + (st.goal === g ? "on" : "") + '">' + g + " 分钟</button>").join("") +
      "</div></div></div>";

    html += '<div class="card"><div class="card-title">🎨 显示与声音</div>' +
      '<div class="setting-row"><span class="setting-label">音效</span><div class="seg" id="soundSeg">' +
        '<button data-sound="1" class="' + (st.sound ? "on" : "") + '">开</button><button data-sound="0" class="' + (st.sound ? "" : "on") + '">关</button>' +
      "</div></div>" +
      '<div class="setting-row"><span class="setting-label">主题</span><div class="seg" id="themeSeg">' +
        '<button data-theme="day" class="' + (st.theme === "day" ? "on" : "") + '">☀️ 白天</button>' +
        '<button data-theme="night" class="' + (st.theme === "night" ? "on" : "") + '">🌙 夜间</button>' +
      "</div></div>" +
      '<div class="setting-row"><span class="setting-label">字号</span><div class="seg" id="sizeSeg">' +
        ["s", "m", "l"].map(s => '<button data-size="' + s + '" class="' + (st.size === s ? "on" : "") + '">' + ({ s: "小", m: "中", l: "大" }[s]) + "</button>").join("") +
      "</div></div></div>";

    html += '<div class="card"><div class="card-title">🔊 离线音频包</div>' +
      '<div class="card-sub">把主题音频存到浏览器里，断网也能学。已缓存：' + (groups.length ? UI.esc(groups.join("、")) : "还没有") + "</div>" +
      '<div class="btn-row" style="margin-top:10px">' +
        '<button class="btn" id="dlAudio">下载常用音频包</button>' +
        '<button class="btn btn-ghost" id="clearAudio">清空离线缓存</button>' +
      "</div></div>";

    html += '<div class="card"><div class="card-title">☁️ 云同步（换设备不丢进度）</div>' +
      '<div class="card-sub">用 8 位同步码登录，和「萌码 Python」共用同一个码。不收集姓名、手机号，录音永远不上传。</div>' +
      '<div id="cloudBox" style="margin-top:10px"></div></div>';

    html += '<div class="card"><div class="card-title">🎤 我的录音（只存在这台设备）</div>' +
      '<div class="card-sub">共 ' + recs.length + " 条</div>" +
      (recs.length ? '<div class="btn-row" style="margin-top:10px"><button class="btn btn-ghost" id="playLast">▶ 播放最近一条</button>' +
        '<button class="btn btn-ghost" id="clearRec">🗑 全部删除</button></div>' : "") + "</div>";

    html += '<div class="card"><div class="card-title">💾 存储</div>' +
      '<div class="setting-row"><span class="setting-label">本地数据</span><span class="muted">' +
      Math.round(usage / 1024) + " KB（设置与进度）+ " + Math.round(idbUse / 1024) + " KB（录音与缓存）</span></div>" +
      '<div class="btn-row"><button class="btn btn-ghost" id="exportData">导出学习数据（JSON）</button>' +
      '<button class="btn btn-danger" id="resetAll">清空本站数据</button></div></div>';

    html += '<div class="btn-row"><button class="btn" id="backMe2">← 回成长档案</button></div>';

    v.innerHTML = html;

    // 事件
    Array.from(v.querySelectorAll("[data-prof]")).forEach(b => b.addEventListener("click", () => { Progress.switchProfile(b.dataset.prof); render(); }));
    document.getElementById("addProf").addEventListener("click", () => {
      UI.modal({ title: "添加小伙伴", html: '<label class="setting-label">名字</label><input id="npName" class="chip" style="width:100%;margin:6px 0" value="小朋友">' +
        '<div class="setting-hint">会给 TA 一份独立的学习记录</div>', actions: [
        { label: "取消", kind: "ghost" },
        { label: "创建", kind: "primary", onClick: () => {
          const n = (document.getElementById("npName") || {}).value || "小朋友";
          const id = Progress.addProfile(n, "🐼", Progress.currentProfile().grade);
          Progress.switchProfile(id); UI.toast("创建好啦", "ok"); render();
        } }
      ] });
    });
    Array.from(v.querySelectorAll("[data-grade]")).forEach(b => b.addEventListener("click", () => {
      Progress.updateProfile(Progress.profileId(), { grade: parseInt(b.dataset.grade, 10) }); render();
    }));
    Array.from(v.querySelectorAll("[data-goal]")).forEach(b => b.addEventListener("click", () => { setSettings({ goal: parseInt(b.dataset.goal, 10) }); render(); }));
    Array.from(v.querySelectorAll("[data-sound]")).forEach(b => b.addEventListener("click", () => {
      const on = b.dataset.sound === "1"; setSettings({ sound: on }); AudioFX.setEnabled(on); render();
    }));
    Array.from(v.querySelectorAll("[data-theme]")).forEach(b => b.addEventListener("click", () => { setSettings({ theme: b.dataset.theme }); applySettings(); render(); }));
    Array.from(v.querySelectorAll("[data-size]")).forEach(b => b.addEventListener("click", () => { setSettings({ size: b.dataset.size }); applySettings(); render(); }));

    document.getElementById("dlAudio").addEventListener("click", async () => {
      UI.toast("正在下载音频包，请稍等…");
      const groupsToLoad = ["letters", "phonics", "sentences"].concat(THEMES);
      for (const g of groupsToLoad) await Player.ready(g);
      UI.toast("常用音频包已缓存 ✅", "ok");
      render();
    });
    document.getElementById("clearAudio").addEventListener("click", async () => {
      await Store.idbClear("en_cache");
      if (window.caches) { try { const ks = await caches.keys(); await Promise.all(ks.map(k => caches.delete(k))); } catch (e) {} }
      UI.toast("离线缓存清空啦（下次打开会重新下载）", "ok");
    });
    if (recs.length) {
      document.getElementById("playLast").addEventListener("click", () => Speech.play(recs[recs.length - 1].blob));
      document.getElementById("clearRec").addEventListener("click", async () => {
        for (const r of recs) await Speech.removeLocal(r.key);
        UI.toast("录音已全部删除", "ok"); render();
      });
    }
    document.getElementById("exportData").addEventListener("click", () => {
      const data = { profile: Progress.currentProfile(), stats: Progress.get(), srs: SRS.exportRows(), settings: getSettings(), at: new Date().toISOString() };
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = "moeisland-data.json";
      a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 4000);
    });
    document.getElementById("resetAll").addEventListener("click", () => {
      UI.confirm("会清掉本站的学习记录与录音（不会影响萌码 Python），确定吗？", () => {
        Store.keys().forEach(k => Store.del(k));
        Store.idbClear("en_rec");
        location.reload();
      }, "清空");
    });
    document.getElementById("backMe2").addEventListener("click", () => go("#/me"));

    renderCloudBox();
  }

  function renderCloudBox() {
    const box = document.getElementById("cloudBox");
    if (!box) return;
    if (typeof Cloud === "undefined") { box.innerHTML = '<div class="muted">同步模块没加载（离线模式）</div>'; return; }
    if (Cloud.isSignedIn()) {
      const st = Cloud.status();
      box.innerHTML = '<div class="chip-row"><span class="chip active">🔑 ' + UI.esc(Cloud.code()) + "</span>" +
        '<span class="chip">' + (st.syncing ? "同步中…" : st.lastSyncAt ? "上次同步 " + new Date(st.lastSyncAt).toLocaleTimeString("zh-CN") : "还没同步过") + "</span></div>" +
        (st.error ? '<div class="muted small" style="color:var(--red)">' + UI.esc(st.error) + "</div>" : "") +
        '<div class="btn-row" style="margin-top:10px"><button class="btn" id="cloudSync">立即同步</button>' +
        '<button class="btn btn-ghost" id="cloudOut">退出同步</button></div>';
      document.getElementById("cloudSync").addEventListener("click", async () => { await Cloud.sync(); UI.toast("同步完成", "ok"); render(); });
      document.getElementById("cloudOut").addEventListener("click", () => { Cloud.signOut(); render(); });
    } else {
      box.innerHTML = '<div class="btn-row"><button class="btn btn-primary" id="cloudNew">创建同步码</button>' +
        '<button class="btn" id="cloudLogin">我有同步码</button></div>';
      document.getElementById("cloudNew").addEventListener("click", async () => {
        const r = await Cloud.create(Progress.currentProfile().name, Progress.currentProfile().emoji);
        if (r && r.ok) { UI.modal({ title: "🔑 这是你的同步码", html: '<div class="big-word" style="font-size:30px">' + UI.esc(r.code) + '</div><div class="muted">抄下来，换设备时输入它就能找回进度。</div>' }); render(); }
        else UI.toast("创建失败：" + ((r && r.error) || "网络问题"), "warn");
      });
      document.getElementById("cloudLogin").addEventListener("click", () => {
        UI.modal({ title: "输入同步码", html: '<input id="inCode" class="chip" style="width:100%" placeholder="XXXX-XXXX">', actions: [
          { label: "取消", kind: "ghost" },
          { label: "登录", kind: "primary", onClick: async () => {
            const code = (document.getElementById("inCode") || {}).value || "";
            const r = await Cloud.login(code);
            if (r && r.ok) { UI.toast("登录成功，正在同步…", "ok"); await Cloud.sync(); render(); }
            else UI.toast((r && r.error) || "同步码不对哦", "warn");
          } }
        ] });
      });
    }
  }

  /* ---------------- 设置存取 ---------------- */
  function getSettings() {
    const s = Store.get("settings", {}) || {};
    return Object.assign({ sound: true, theme: "day", size: "m", goal: 15 }, s);
  }
  function setSettings(patch) { Store.set("settings", Object.assign(getSettings(), patch)); }

  function applySettings() {
    const s = getSettings();
    document.documentElement.setAttribute("data-theme", s.theme === "night" ? "night" : "day");
    document.documentElement.setAttribute("data-size", s.size || "m");
    AudioFX.setEnabled(!!s.sound);
  }

  /* ---------------- 启动 ---------------- */
  function boot() {
    applySettings();
    // 夜间自动切换（19:00 之后，且用户没手动设过）
    const raw = Store.get("settings", null);
    if (!raw || !raw.theme) {
      const h = new Date().getHours();
      if (h >= 19 || h < 6) document.documentElement.setAttribute("data-theme", "night");
    }
    Progress.touchToday();
    Progress.checkBadges(Progress.get());
    window.addEventListener("hashchange", () => {
      // 学习舞台是全屏覆盖层、不参与路由：用浏览器前进/后退离开时，把它一起收掉
      if (typeof Stage !== "undefined" && Stage.exitGuard && Stage.exitGuard()) { Stage.close(); return; }
      render();
    });
    const brand = document.getElementById("brandHome");
    if (brand) {
      brand.addEventListener("click", () => go("#/map"));
      brand.addEventListener("keydown", e => { if (e.key === "Enter") go("#/map"); });
    }
    document.addEventListener("click", () => AudioFX.unlock(), { once: true });
    if (typeof Player !== "undefined" && Player.onFallback) {
      Player.onFallback(() => UI.toast("这台设备的音频包没加载到，先用系统语音读给你听 🔊", "warn"));
    }
    Progress.onChange(() => renderHud());
    if ("serviceWorker" in navigator && location.protocol !== "file:") {
      navigator.serviceWorker.register("sw.js").catch(() => {});
    }
    render();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();

  return { go, render, ensure, allWords, wordById, THEMES, THEME_ZH, THEME_EMOJI, getSettings, setSettings, applySettings };
})();
window.App = App;
