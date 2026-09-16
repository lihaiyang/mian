/* ============================================================================
 * 键盘岛 · 打字引擎与界面
 *
 * 这个文件是"学科特有"的部分：打字这件事本身。它**不碰**等级、打卡、
 * 徽章、云同步——那些由平台层（shared/core/*）根据 subject.js 的声明自动处理。
 * 这里只做三件事：
 *   1. 把一关的文本渲染出来，逐字符跟踪对错
 *   2. 算 WPM / 准确率 / 每个键的错误率（热力图）
 *   3. 打完一关时调用 Progress.emit(...)，让平台去发经验、徽章、奖牌
 * ========================================================================== */
(function () {
  "use strict";

  // ---------------------------------------------------------------- 键盘布局与指法

  var ROWS = ["`1234567890-=", "qwertyuiop[]\\", "asdfghjkl;'", "zxcvbnm,./"];

  // 每个键归哪根手指（用来给提示：这一下该用哪个指头）
  var FINGER = {
    "`": "左小指", "1": "左小指", "q": "左小指", "a": "左小指", "z": "左小指",
    "2": "左无名", "w": "左无名", "s": "左无名", "x": "左无名",
    "3": "左中指", "e": "左中指", "d": "左中指", "c": "左中指",
    "4": "左食指", "5": "左食指", "r": "左食指", "t": "左食指",
    "f": "左食指", "g": "左食指", "v": "左食指", "b": "左食指",
    "6": "右食指", "7": "右食指", "y": "右食指", "u": "右食指",
    "h": "右食指", "j": "右食指", "n": "右食指", "m": "右食指",
    "8": "右中指", "i": "右中指", "k": "右中指", ",": "右中指",
    "9": "右无名", "o": "右无名", "l": "右无名", ".": "右无名",
    "0": "右小指", "-": "右小指", "=": "右小指", "p": "右小指",
    "[": "右小指", "]": "右小指", "\\": "右小指", ";": "右小指",
    "'": "右小指", "/": "右小指", " ": "大拇指"
  };

  // 需要按 Shift 的字符 → 它对应的物理键
  var SHIFT_MAP = {
    "~": "`", "!": "1", "@": "2", "#": "3", "$": "4", "%": "5", "^": "6",
    "&": "7", "*": "8", "(": "9", ")": "0", "_": "-", "+": "=",
    "{": "[", "}": "]", "|": "\\", ":": ";", "\"": "'", "<": ",", ">": ".", "?": "/"
  };

  function baseKey(ch) {
    if (SHIFT_MAP[ch]) return SHIFT_MAP[ch];
    return ch.toLowerCase();
  }
  function needsShift(ch) {
    return !!SHIFT_MAP[ch] || (ch !== ch.toLowerCase() && ch !== ch.toUpperCase() === false && /[A-Z]/.test(ch));
  }
  function fingerOf(ch) {
    return FINGER[baseKey(ch)] || "";
  }

  // ---------------------------------------------------------------- 状态

  var S = {
    lessons: [],
    stages: [],
    stageId: null,
    lesson: null,
    chars: [],          // 文本拆成的字符
    state: [],          // null | true | false，逐字符
    idx: 0,
    keys: 0,            // 总击键
    errors: 0,          // 错误击键
    errByKey: {},       // 每个键错了几次
    typedByKey: {},     // 每个键打了几次
    startedAt: 0,
    timer: null,
    finished: false
  };

  function $(id) { return document.getElementById(id); }
  function esc(s) {
    return String(s === null || s === undefined ? "" : s)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  // ---------------------------------------------------------------- 关卡列表

  function doneKey(id) { return "done__" + id; }
  function bestKey(id) { return "best__" + id; }

  function isDone(id) {
    return !!Store.ns("typing").get(doneKey(id), false);
  }
  function bestOf(id) {
    return Store.ns("typing").get(bestKey(id), null);
  }
  function markDone(id, result) {
    var s = Store.ns("typing");
    s.set(doneKey(id), true);
    var prev = bestOf(id);
    if (!prev || result.wpm > prev.wpm) s.set(bestKey(id), result);
  }

  function renderLessonList() {
    var host = $("lessonList");
    var html = "";
    S.stages.forEach(function (st) {
      var list = S.lessons.filter(function (l) { return l.stageId === st.id; });
      var doneN = list.filter(function (l) { return isDone(l.id); }).length;
      html += '<div class="ty-stage">' +
        '<div class="ty-stage-head"><span>' + esc(st.name) + '</span>' +
        '<span class="ty-stage-count">' + doneN + "/" + list.length + "</span></div>";
      list.forEach(function (l) {
        var done = isDone(l.id);
        var best = bestOf(l.id);
        html += '<button class="ty-lesson' + (done ? " done" : "") +
          (S.lesson && S.lesson.id === l.id ? " active" : "") +
          '" data-lesson="' + esc(l.id) + '">' +
          '<span class="ty-lesson-mark">' + (done ? "✅" : "▫️") + "</span>" +
          '<span class="ty-lesson-title">' + esc(l.title) + "</span>" +
          (best ? '<span class="ty-lesson-best">' + Math.round(best.wpm) + "</span>" : "") +
          "</button>";
      });
      html += "</div>";
    });
    host.innerHTML = html;
  }

  // ---------------------------------------------------------------- 打字区

  function renderText() {
    var host = $("typingText");
    var html = "";
    S.chars.forEach(function (c, i) {
      var cls = "ch";
      if (S.state[i] === true) cls += " ok";
      else if (S.state[i] === false) cls += " bad";
      if (i === S.idx && !S.finished) cls += " cur";
      var show = c === "\n" ? "⏎" : c === " " ? "&nbsp;" : esc(c);
      html += '<span class="' + cls + '">' + show + "</span>";
    });
    host.innerHTML = html;
    var cur = host.querySelector(".ch.cur");
    if (cur && cur.scrollIntoView) {
      cur.scrollIntoView({ block: "nearest", inline: "nearest" });
    }
  }

  function renderKeyboard() {
    var next = S.finished ? null : S.chars[S.idx];
    var host = $("kbd");
    var html = "";
    ROWS.forEach(function (row) {
      html += '<div class="kbd-row">';
      row.split("").forEach(function (k) {
        var isNext = next !== null && next !== undefined && baseKey(next) === k;
        var bad = S.errByKey[k] || 0;
        var cls = "kbd-key";
        if (isNext) cls += " next";
        // 热力图：错得越多的键越红（只在练过之后才有意义）
        if (bad >= 1) cls += " heat-" + Math.min(3, bad);
        html += '<span class="' + cls + '" data-k="' + esc(k) + '">' + esc(k) + "</span>";
      });
      html += "</div>";
    });
    html += '<div class="kbd-row"><span class="kbd-key kbd-space' +
      (next === " " ? " next" : "") + '">空格</span></div>';
    host.innerHTML = html;

    var shift = next !== null && next !== undefined && needsShift(next);
    $("shiftHint").textContent = shift ? "⇧ Shift + " : "";
    $("fingerHint").textContent = next ? fingerOf(next) : "";
  }

  function liveStats() {
    var el = S.startedAt ? (Date.now() - S.startedAt) / 1000 : 0;
    var correct = S.state.filter(function (x) { return x === true; }).length;
    // 时间下限按 1 秒算：否则刚打两个字就会算出几百 WPM 的荒唐值。
    // 也别用"太小就显示 0"——那会让孩子一边打字一边看到 0，像是坏了。
    var min = Math.max(el, 1) / 60;
    var wpm = S.startedAt ? (correct / 5) / min : 0;
    var acc = S.keys ? Math.max(0, (S.keys - S.errors) / S.keys * 100) : 100;
    var pct = S.chars.length ? Math.round(S.idx / S.chars.length * 100) : 0;
    return { wpm: wpm, acc: acc, pct: pct, seconds: el, correct: correct };
  }

  function renderLive() {
    var st = liveStats();
    $("hudWpm").textContent = Math.round(st.wpm);
    $("hudAcc").textContent = Math.round(st.acc) + "%";
    $("hudPct").textContent = st.pct + "%";
    $("progressFill").style.width = st.pct + "%";
  }

  function tick() { renderLive(); }

  // ---------------------------------------------------------------- 开始 / 结束

  function startLesson(id) {
    var l = S.lessons.filter(function (x) { return x.id === id; })[0];
    if (!l) return;
    S.lesson = l;
    S.stageId = l.stageId;
    S.chars = l.text.split("");
    S.state = S.chars.map(function () { return null; });
    S.idx = 0; S.keys = 0; S.errors = 0;
    S.errByKey = {}; S.typedByKey = {};
    S.startedAt = 0; S.finished = false;

    if (S.timer) { clearInterval(S.timer); S.timer = null; }

    $("stageTitle").textContent = l.stage;
    $("lessonTitle").textContent = l.title;
    // 顶栏也显示当前在练哪一关 —— 否则孩子在关卡里看不出自己在哪
    if (window.Topbar) Topbar.setSection(l.title);
    $("lessonDesc").textContent = l.desc;
    $("lessonTip").textContent = l.tip || "";
    $("lessonTip").style.display = l.tip ? "" : "none";
    $("typingPanel").style.display = "";
    $("resultCard").style.display = "none";
    $("kbdHint").style.display = "";

    renderText(); renderKeyboard(); renderLive(); renderLessonList();
    $("typingText").focus();
  }

  function handleKey(ev) {
    if (!S.lesson || S.finished) return;

    var k = ev.key;
    if (k === "Shift" || k === "Control" || k === "Alt" || k === "Meta" ||
        k === "CapsLock" || k === "Tab") return;

    // 只处理单个可见字符 + Enter + Backspace
    if (k === "Backspace") {
      ev.preventDefault();
      if (S.idx > 0) { S.idx--; S.state[S.idx] = null; renderText(); renderKeyboard(); renderLive(); }
      return;
    }
    if (k === "Enter") {
      ev.preventDefault();
      typeChar("\n");
      return;
    }
    if (k.length !== 1) return;

    ev.preventDefault();
    typeChar(k);
  }

  function typeChar(ch) {
    // 第一次击键才开始计时（否则"看着题发呆"会拉低速度）
    if (!S.startedAt) {
      S.startedAt = Date.now();
      S.timer = setInterval(tick, 200);
    }

    var want = S.chars[S.idx];
    if (want === undefined) return;

    var ok = ch === want;
    S.keys++;
    var bk = baseKey(want);
    S.typedByKey[bk] = (S.typedByKey[bk] || 0) + 1;
    if (!ok) {
      S.errors++;
      S.errByKey[bk] = (S.errByKey[bk] || 0) + 1;
    }
    S.state[S.idx] = ok;
    S.idx++;

    renderText();
    renderKeyboard();
    renderLive();

    if (S.idx >= S.chars.length) finish();
  }

  function stars(st, l) {
    // 只看准确率与目标速度，规则简单到孩子能自己算
    if (st.acc >= 98 && st.wpm >= l.targetWpm) return 3;
    if (st.acc >= 93 && st.wpm >= l.targetWpm * 0.7) return 2;
    if (st.acc >= 85) return 1;
    return 0;
  }

  function finish() {
    S.finished = true;
    if (S.timer) { clearInterval(S.timer); S.timer = null; }

    var l = S.lesson;
    var st = liveStats();
    var star = stars(st, l);
    var result = {
      wpm: st.wpm, acc: st.acc, stars: star,
      chars: l.text.length, seconds: st.seconds
    };

    markDone(l.id, result);

    // ---- 交给平台：经验、徽章、奖牌、任务、打卡都在这几句里 ----
    // 注意要把每次 emit 的奖励**累加**起来。早先这里只留了最后一次的返回值，
    // 结果成绩单上永远看不到"打完这一关"本身给的经验。
    var rewards = { xp: 0, newBadges: [], newMedals: [], newMissions: [] };
    function collect(r) {
      if (!r) return;
      rewards.xp += r.xp || 0;
      rewards.newBadges = rewards.newBadges.concat(r.newBadges || []);
      rewards.newMedals = rewards.newMedals.concat(r.newMedals || []);
      rewards.newMissions = rewards.newMissions.concat(r.newMissions || []);
    }

    if (typeof Progress !== "undefined") {
      Progress.recordBest("bestWpm", Math.round(st.wpm));
      collect(Progress.emit("finish", {
        acc: st.acc, wpm: st.wpm, chars: l.text.length, stageId: l.stageId
      }));
      collect(Progress.emit("perfect", { acc: st.acc }));
      collect(Progress.emit("fast", { hitTarget: st.wpm >= l.targetWpm }));
      collect(Progress.emit("code", { stageId: l.stageId }));
      // 打准了才算"通关这个阶段"
      if (st.acc >= 95 && st.wpm >= l.targetWpm * 0.8) {
        collect(Progress.emit("clear_" + l.stageId, {}));
      }
      // 同一次可能有多个事件，去重一下再展示
      rewards.newBadges = dedupe(rewards.newBadges);
      rewards.newMedals = dedupe(rewards.newMedals);
      rewards.newMissions = dedupe(rewards.newMissions);
    }

    showResult(result, rewards.xp || rewards.newBadges.length ? rewards : null);
    renderLessonList();
  }

  function dedupe(list) {
    var seen = {}, out = [];
    list.forEach(function (x) {
      if (x && x.id && !seen[x.id]) { seen[x.id] = 1; out.push(x); }
    });
    return out;
  }

  function showResult(r, rewards) {
    var starsHtml = "";
    for (var i = 0; i < 3; i++) {
      starsHtml += '<span class="ty-star' + (i < r.stars ? " on" : "") + '">★</span>';
    }
    var lines = [];
    if (rewards && rewards.xp) lines.push("+" + rewards.xp + " 经验");
    if (rewards && rewards.newBadges) {
      rewards.newBadges.forEach(function (b) {
        lines.push("🎖️ 新徽章：" + b.title);
      });
    }
    if (rewards && rewards.newMedals) {
      rewards.newMedals.forEach(function (m) {
        lines.push("🏅 新奖牌：" + m.title);
      });
    }
    if (rewards && rewards.newMissions) {
      rewards.newMissions.forEach(function (m) { lines.push("🎯 完成目标：" + m.title); });
    }

    var heat = topErrors();
    $("resultBody").innerHTML =
      '<div class="ty-stars">' + starsHtml + "</div>" +
      '<div class="ty-result-grid">' +
        "<div><b>" + Math.round(r.wpm) + "</b><span>WPM</span></div>" +
        "<div><b>" + Math.round(r.acc) + "%</b><span>准确率</span></div>" +
        "<div><b>" + r.chars + "</b><span>字符</span></div>" +
        "<div><b>" + r.seconds.toFixed(1) + "s</b><span>用时</span></div>" +
      "</div>" +
      (lines.length ? '<div class="ty-rewards">' + lines.map(function (x) {
        return "<div>" + esc(x) + "</div>";
      }).join("") + "</div>" : "") +
      (heat.length ? '<div class="ty-heat-note">最常打错的键：' +
        heat.map(function (h) { return "<kbd>" + esc(h.k) + "</kbd>×" + h.n; }).join(" ") +
        "</div>" : '<div class="ty-heat-note">一个键都没打错，厉害！</div>');

    $("resultCard").style.display = "";
    $("kbdHint").style.display = "none";
    $("typingPanel").style.display = "none";
    refreshProgressPanel();
  }

  function topErrors() {
    var out = [];
    Object.keys(S.errByKey).forEach(function (k) {
      if (S.errByKey[k] > 0) out.push({ k: k, n: S.errByKey[k] });
    });
    out.sort(function (a, b) { return b.n - a.n; });
    return out.slice(0, 5);
  }

  // ---------------------------------------------------------------- 进度面板

  function refreshProgressPanel() {
    if (typeof Progress === "undefined") return;
    var info = Progress.levelInfo();
    $("pfLevel").textContent = "Lv." + info.level;
    $("pfTitle").textContent = info.title;
    $("pfXp").textContent = info.cur + " / " + (info.need || "MAX");
    $("pfBar").style.width = info.percent + "%";
    $("pfStreak").textContent = Progress.streak().cur;

    $("pfDaily").innerHTML = Progress.daily().map(function (d) {
      var st = Progress.stats();
      var c = (st.counters || {})[d.key] || 0;
      return '<div class="ty-daily' + (d.got ? " got" : "") + '">' +
        '<span>' + esc(d.emoji) + "</span>" +
        '<span class="ty-daily-t">' + esc(d.title) + "</span>" +
        '<span class="ty-daily-n">' + (d.got ? "✅" : Math.min(c, d.need) + "/" + d.need) + "</span>" +
        "</div>";
    }).join("") || '<div class="note">今天的任务还没生成</div>';

    var badges = Progress.badges();
    var gotN = badges.filter(function (b) { return b.got; }).length;
    $("pfBadgeCount").textContent = gotN + " / " + badges.length;
    $("pfBadges").innerHTML = badges.map(function (b) {
      return '<div class="ty-badge' + (b.got ? " got" : "") + '" title="' + esc(b.desc || "") + '">' +
        '<span class="ty-badge-e">' + (b.got ? esc(b.emoji) : "🔒") + "</span>" +
        '<span class="ty-badge-t">' + esc(b.title) + "</span></div>";
    }).join("");

    var medals = Progress.medals();
    var gotM = medals.filter(function (m) { return m.got; }).length;
    $("pfMedalCount").textContent = gotM + " / " + medals.length;
    $("pfMedals").innerHTML = medals.map(function (m) {
      return '<div class="ty-medal ' + esc(m.tier || "") + (m.got ? " got" : "") + '" title="' + esc(m.desc || "") + '">' +
        '<span class="ty-medal-e">' + (m.got ? esc(m.emoji) : "🔒") + "</span>" +
        '<span class="ty-medal-t">' + esc(m.title) + "</span></div>";
    }).join("");
  }

  // ---------------------------------------------------------------- 云同步面板

  function refreshSyncPanel() {
    if (typeof Sync === "undefined") return;
    var st = Sync.state();
    $("syncStatus").innerHTML = st.loggedIn
      ? "已开启 · 同步码 <b>" + esc(st.code) + "</b>" +
        (st.lastAt ? "<br><span class=\"muted\">上次同步：" +
          new Date(st.lastAt).toLocaleString("zh-CN") + "</span>" : "")
      : "还没开启云同步。开启后会得到一个 8 位同步码，换设备用它就能找回进度。";
    $("syncLoggedOut").style.display = st.loggedIn ? "none" : "";
    $("syncLoggedIn").style.display = st.loggedIn ? "" : "none";
    $("syncBusy").textContent = st.busy ? "同步中…" : "";
  }

  function say(msg) {
    var el = $("syncMsg");
    el.textContent = msg;
    el.style.display = msg ? "" : "none";
  }

  // ---------------------------------------------------------------- 初始化

  function init() {
    S.lessons = window.TYPING_LESSONS || [];
    S.stages = window.TYPING_STAGES || [];
    if (!S.lessons.length) {
      $("lessonList").innerHTML = '<div class="note">关卡数据没加载出来。</div>';
      return;
    }

    if (typeof Progress !== "undefined") {
      Progress.init();
      Progress.onChange(function () { refreshProgressPanel(); refreshSyncPanel(); });
    }

    if (typeof Sync !== "undefined") {
      Sync.init({
        subject: "typing",
        entities: {
          progress: {
            collect: function () {
              var row = Progress.exportRow();
              return [{
                // row_id 必须带上档案 id。sub_rows 的主键是
                // (account_id, subject, entity, row_id)，**不含 profile_id** ——
                // 写死 "progress" 的话，一个账号下两个孩子的进度会落到同一行，
                // 后推的覆盖先推的。
                row_id: "progress__" + Progress.profileId(),
                profile_id: Progress.profileId(),
                payload_json: row.stats_json,
                updated_at: row.updated_at
              }];
            },
            apply: function (rows) {
              var n = 0;
              var me = Progress.profileId();
              (rows || []).forEach(function (r) {
                if (r.deleted) return;
                // 只应用属于**当前档案**的行：一个账号下可能有多个孩子，
                // 他们的进度是并列的行，不能互相导入。
                // （profile_id 由 /api/v1/sync 的 GET 回传，见该文件里的注释）
                if (r.profile_id && r.profile_id !== me) return;
                if (Progress.importRow({ stats_json: r.payload_json, updated_at: r.updated_at })) n++;
              });
              return n;
            }
          }
        }
      });
      Sync.onChange(function () { refreshSyncPanel(); });
    }

    renderLessonList();
    renderKeyboard();
    refreshProgressPanel();
    refreshSyncPanel();

    // 事件
    $("lessonList").addEventListener("click", function (ev) {
      var el = ev.target;
      while (el && el !== this && !el.getAttribute("data-lesson")) el = el.parentNode;
      if (el && el !== this) startLesson(el.getAttribute("data-lesson"));
    });

    document.addEventListener("keydown", handleKey);
    $("typingText").addEventListener("click", function () { /* 保持焦点用 */ });

    $("btnAgain").addEventListener("click", function () {
      if (S.lesson) startLesson(S.lesson.id);
    });
    $("btnNext").addEventListener("click", function () {
      var i = S.lessons.indexOf(S.lesson);
      var next = S.lessons[i + 1];
      if (next) startLesson(next.id);
      else $("btnNext").disabled = true;
    });

    // 进度 / 同步弹窗
    function bindModal(btnId, modalId, onOpen) {
      var b = $(btnId), m = $(modalId);
      if (!b || !m) return;
      b.addEventListener("click", function () {
        m.classList.add("open");
        if (onOpen) onOpen();
      });
      m.addEventListener("click", function (ev) {
        if (ev.target === m) m.classList.remove("open");
      });
      m.querySelectorAll("[data-close]").forEach(function (x) {
        x.addEventListener("click", function () { m.classList.remove("open"); });
      });
    }
    bindModal("btnProgress", "progressModal", refreshProgressPanel);
    // 「云同步」胶囊改成打开**全平台共用**的账号面板（AccountUI）——
    // 一个同步码管所有学科，孩子只需要记住一个。
    // 绑定在 index.html 的顶栏脚本里做；只有当那个脚本没跑起来时，
    // 才退回打字自己的同步弹窗（保证功能不丢）。
    if (!(window.AccountUI && document.getElementById("btnSync")
          && document.getElementById("btnSync").dataset.accBound === "1")) {
      bindModal("btnSync", "syncModal", refreshSyncPanel);
    }

    // 同步操作
    $("btnCreateCode").addEventListener("click", function () {
      say("正在创建…");
      Sync.createAccount($("nickInput").value.trim()).then(function (r) {
        if (!r.ok) return say(r.error);
        Sync.sync(true).then(function () {
          say("已开启！你的同步码是 " + r.code + "，抄下来，换设备时用它找回进度。");
          refreshSyncPanel();
        });
      });
    });
    $("btnLogin").addEventListener("click", function () {
      say("正在登录…");
      Sync.login($("codeInput").value, $("pinInput").value).then(function (r) {
        if (!r.ok) return say(r.error);
        Sync.pull(true).then(function () {
          say("登录成功，进度已经拉下来了。");
          refreshProgressPanel(); refreshSyncPanel();
        });
      });
    });
    $("btnSyncNow").addEventListener("click", function () {
      say("同步中…");
      Sync.sync().then(function (r) {
        say(r.ok ? "同步完成。" : r.error);
        refreshSyncPanel();
      });
    });
    $("btnLogout").addEventListener("click", function () {
      Sync.logout(); say("已关闭云同步（本机进度不受影响）。"); refreshSyncPanel();
    });

    // 大厅那边记一笔"来过这里"（「继续上次」要用）
    if (typeof Platform !== "undefined" && Platform.markVisited) {
      Platform.markVisited("typing");
    }
    if (typeof Platform !== "undefined" && Platform.remember) Platform.remember();

    window.__typingReady = true;
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
