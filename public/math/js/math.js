/* ============================================================================
 * 数学岛 · 学科逻辑
 *
 * 只做"数学"这件事：挑单元、出题、判对错、给提示、出小结。
 * 等级 / 打卡 / 徽章 / 奖牌 / 云同步 / 家长报告 —— 一行都不写，全交给平台层。
 *
 * 题目来自 data/problems.js（由 tools/math/gen_problems.py 生成，
 * **答案都由 Python 真算过一遍**，不是手写的）。
 * ========================================================================== */
(function () {
  "use strict";

  var ROUND_SIZE = 10;
  var UNITS = window.MATH_UNITS || [];

  var S = {
    grade: 1,
    unitId: null,
    queue: [],
    idx: 0,
    right: 0,
    wrong: [],
    streak: 0,
    bestStreak: 0,
    answered: 0,
  };

  function $(id) { return document.getElementById(id); }

  // ---------------------------------------------------------------- 工具

  /** 答案归一化：去空格、全角转半角、统一各种减号 */
  function norm(s) {
    return String(s == null ? "" : s)
      .trim()
      .replace(/[\uFF10-\uFF19]/g, function (c) { return String.fromCharCode(c.charCodeAt(0) - 0xFEE0); })
      .replace(/[\uFF0B\uFF0D\uFF0A\uFF0F]/g, function (c) {
        return { "\uFF0B": "+", "\uFF0D": "-", "\uFF0A": "*", "\uFF0F": "/" }[c];
      })
      .replace(/[\u2212\u2013\u2014]/g, "-")
      .replace(/\s+/g, "");
  }

  /** 判对错：先按字符串比；两边都是纯数字时按数值比（0.30 = 0.3） */
  function same(given, expected) {
    var g = norm(given), e = norm(expected);
    if (!g) return false;
    if (g === e) return true;
    var numRe = /^-?\d+(\.\d+)?$/;
    if (numRe.test(g) && numRe.test(e)) {
      return Math.abs(parseFloat(g) - parseFloat(e)) < 1e-9;
    }
    return false;
  }

  function esc(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  }

  function shuffled(arr, seedStr) {
    var a = arr.slice(), seed = 0;
    for (var i = 0; i < String(seedStr).length; i++) seed = (seed * 31 + String(seedStr).charCodeAt(i)) >>> 0;
    for (var j = a.length - 1; j > 0; j--) {
      seed = (seed * 1103515245 + 12345) >>> 0;
      var k = seed % (j + 1);
      var t = a[j]; a[j] = a[k]; a[k] = t;
    }
    return a;
  }

  function unitById(id) {
    for (var i = 0; i < UNITS.length; i++) if (UNITS[i].id === id) return UNITS[i];
    return null;
  }

  function unitsOfGrade(g) {
    return UNITS.filter(function (u) { return u.grade === g; });
  }

  // ---------------------------------------------------------------- 左栏

  function renderGrades() {
    var host = $("gradeTabs");
    if (!host) return;
    host.innerHTML = "";
    [1, 2, 3, 4, 5, 6].forEach(function (g) {
      var b = document.createElement("button");
      b.type = "button";
      b.className = "ma-grade" + (g === S.grade ? " active" : "");
      b.textContent = g + " 年级";
      b.setAttribute("role", "tab");
      b.setAttribute("aria-selected", g === S.grade ? "true" : "false");
      b.addEventListener("click", function () {
        S.grade = g;
        renderGrades();
        renderUnits();
      });
      host.appendChild(b);
    });
  }

  function renderUnits() {
    var host = $("unitList");
    if (!host) return;
    host.innerHTML = "";
    var list = unitsOfGrade(S.grade);
    $("sideHint").textContent = list.length + " 个单元";

    // 按「单元」分组显示，同一单元下可能有多个小专题
    var groups = {};
    var order = [];
    list.forEach(function (u) {
      if (!groups[u.unit]) { groups[u.unit] = []; order.push(u.unit); }
      groups[u.unit].push(u);
    });

    order.forEach(function (gname) {
      var h = document.createElement("div");
      h.className = "ma-unit-group";
      h.textContent = gname;
      host.appendChild(h);
      groups[gname].forEach(function (u) {
        var b = document.createElement("button");
        b.type = "button";
        b.className = "ma-unit" + (u.id === S.unitId ? " active" : "");
        b.dataset.unit = u.id;
        var best = bestOf(u.id);
        b.innerHTML = '<span class="ma-unit-title">' + esc(u.title) + "</span>" +
          (best ? '<span class="ma-unit-best">' + best + "/" + ROUND_SIZE + "</span>" : "");
        b.addEventListener("click", function () { startRound(u.id); });
        host.appendChild(b);
      });
    });
  }

  function bestKey(id) { return "best__" + id; }
  function bestOf(id) {
    try {
      if (typeof Store === "undefined") return 0;
      return Number(Store.ns("math").get(bestKey(id), 0)) || 0;
    } catch (e) { return 0; }
  }
  function noteBest(id, score) {
    try {
      if (typeof Store === "undefined") return;
      if (score > bestOf(id)) Store.ns("math").set(bestKey(id), score);
    } catch (e) {}
  }

  // ---------------------------------------------------------------- 出题

  function startRound(unitId) {
    var u = unitById(unitId);
    if (!u || !u.items.length) return;
    S.unitId = unitId;
    // 每次换一批顺序，但同一单元的一批不重复
    S.queue = shuffled(u.items, unitId + ":" + Date.now()).slice(0, Math.min(ROUND_SIZE, u.items.length));
    S.idx = 0; S.right = 0; S.wrong = []; S.streak = 0; S.bestStreak = 0; S.answered = 0;

    $("introCard").style.display = "none";
    $("resultCard").style.display = "none";
    $("playCard").style.display = "";
    $("unitName").textContent = u.unit + " · " + u.title;
    renderUnits();
    showQuestion();
  }

  function showQuestion() {
    var u = unitById(S.unitId);
    var it = S.queue[S.idx];
    if (!it) return finishRound();
    $("question").textContent = it.q;
    $("qCount").textContent = (S.idx + 1) + " / " + S.queue.length;
    $("barFill").style.width = Math.round((S.idx / S.queue.length) * 100) + "%";
    var inp = $("answer");
    inp.value = "";
    inp.className = "ma-input";
    inp.disabled = false;
    $("feedback").textContent = "";
    $("feedback").className = "ma-feedback";
    $("btnCheck").disabled = false;
    $("btnSkip").disabled = false;
    inp.focus();
  }

  function check() {
    var u = unitById(S.unitId);
    var it = S.queue[S.idx];
    if (!it) return;
    var given = $("answer").value;
    if (!norm(given)) { $("answer").focus(); return; }

    S.answered++;
    if (typeof Progress !== "undefined") Progress.emit("answer", {});

    if (same(given, it.a)) {
      S.right++; S.streak++;
      if (S.streak > S.bestStreak) S.bestStreak = S.streak;
      $("answer").className = "ma-input right";
      $("feedback").className = "ma-feedback ok";
      $("feedback").textContent = "✅ 对了！" + (S.streak >= 3 ? "连对 " + S.streak + " 题 🔥" : "");
      if (typeof Progress !== "undefined") {
        Progress.emit("correct", {});
        // 专题计数（徽章用）
        var tag = topicTag(u);
        if (tag) Progress.emit("correct_" + tag, {});
        Progress.recordBest("bestStreak", S.bestStreak);
      }
    } else {
      S.streak = 0;
      S.wrong.push({ q: it.q, a: it.a, gave: given, tip: it.tip });
      // 做错的题进**跨学科记忆盒**：隔 1/2/4/7/15 天自己回来找你。
      // 放进去的是"题目 + 答案 + 提示"三件套，所以复习页完全不用知道
      // 数学岛的任何事 —— 这就是把记忆盒做成平台级的好处。
      if (typeof SRS !== "undefined") {
        SRS.add({ subject: "math", id: it.id, front: it.q, back: it.a, hint: it.tip });
      }
      $("answer").className = "ma-input wrong";
      $("feedback").className = "ma-feedback no";
      $("feedback").innerHTML = "🤔 差一点点。正确答案是 <b>" + esc(it.a) + "</b><br>" + esc(it.tip || "");
    }
    $("answer").disabled = true;
    $("btnCheck").disabled = true;
    $("btnSkip").disabled = true;
    setTimeout(next, same(given, it.a) ? 900 : 2600);
  }

  /** 专题标签：给"分数/小数/应用题"这类专题徽章计数用 */
  function topicTag(u) {
    if (!u) return "";
    if (/分数/.test(u.unit) || /分数/.test(u.title)) return "frac";
    if (/小数/.test(u.unit) || /小数/.test(u.title)) return "dec";
    if (/问题解决/.test(u.unit) || /应用/.test(u.title)) return "word";
    return "";
  }

  function skip() {
    var it = S.queue[S.idx];
    if (!it) return;
    S.answered++;
    S.streak = 0;
    S.wrong.push({ q: it.q, a: it.a, gave: "（跳过）", tip: it.tip });
    // 跳过的也进记忆盒 —— "不会"比"做错"更该再见到一次
    if (typeof SRS !== "undefined") {
      SRS.add({ subject: "math", id: it.id, front: it.q, back: it.a, hint: it.tip });
    }
    $("feedback").className = "ma-feedback no";
    $("feedback").innerHTML = "答案是 <b>" + esc(it.a) + "</b><br>" + esc(it.tip || "");
    $("answer").disabled = true;
    $("btnCheck").disabled = true;
    $("btnSkip").disabled = true;
    setTimeout(next, 2600);
  }

  function next() {
    S.idx++;
    if (S.idx >= S.queue.length) return finishRound();
    showQuestion();
  }

  function finishRound() {
    var u = unitById(S.unitId);
    $("playCard").style.display = "none";
    $("resultCard").style.display = "";

    var n = S.queue.length || 1;
    var pct = Math.round((S.right / n) * 100);
    var stars = pct >= 100 ? 3 : pct >= 80 ? 2 : pct >= 60 ? 1 : 0;
    var starsHtml = "";
    for (var i = 0; i < 3; i++) starsHtml += '<span class="ma-star' + (i < stars ? " on" : "") + '">★</span>';

    var perfect = S.right === n && n > 0;
    if (typeof Progress !== "undefined") {
      Progress.emit("round", {});
      if (perfect) Progress.emit("perfect", { perfect: true });
      // 这一组做完了 → 记一个"这个年级摸过了"
      if (S.right >= Math.ceil(n * 0.6)) Progress.emit("clear_g" + S.grade, {});
    }
    noteBest(S.unitId, S.right);

    var wrongHtml = "";
    if (S.wrong.length) {
      wrongHtml = '<div class="ma-wrongs"><div class="ma-sec-title">这次没做对的</div>' +
        S.wrong.map(function (w) {
          return '<div class="ma-wrong">' + esc(w.q) + " → <b>" + esc(w.a) + "</b>" +
            (w.gave && w.gave !== "（跳过）" ? "（你写的是 " + esc(w.gave) + "）" : "") +
            '<div class="muted">' + esc(w.tip || "") + "</div></div>";
        }).join("") + "</div>";
    }

    $("resultBody").innerHTML =
      '<div class="ma-stars">' + starsHtml + "</div>" +
      '<h2 style="text-align:center;margin-top:12px">' +
      (perfect ? "全对！太厉害了 🎉" : pct >= 60 ? "做得不错" : "再试一次会更好") + "</h2>" +
      '<div class="ma-result-grid">' +
        "<div><b>" + S.right + "</b><span>做对</span></div>" +
        "<div><b>" + (n - S.right) + "</b><span>没做对</span></div>" +
        "<div><b>" + S.bestStreak + "</b><span>最高连对</span></div>" +
      "</div>" +
      wrongHtml;

    renderUnits();
    refreshProgressPanel();
  }

  // ---------------------------------------------------------------- 数字键盘

  function renderKeypad() {
    var host = $("keypad");
    if (!host) return;
    var keys = ["7", "8", "9", "4", "5", "6", "1", "2", "3", "0", ".", "⌫", "万", "−", "/"];
    host.innerHTML = "";
    keys.forEach(function (k) {
      var b = document.createElement("button");
      b.type = "button";
      b.className = "ma-key";
      b.textContent = k;
      b.addEventListener("click", function () { tap(k); });
      host.appendChild(b);
    });
  }

  function tap(k) {
    var inp = $("answer");
    if (inp.disabled) return;
    if (k === "⌫") inp.value = inp.value.slice(0, -1);
    else inp.value += k;
    inp.focus();
  }

  // ---------------------------------------------------------------- 进度面板

  function bindModal(btnId, modalId, onOpen) {
    var b = $(btnId), m = $(modalId);
    if (!b || !m) return;
    b.addEventListener("click", function () {
      if (onOpen) onOpen();
      m.classList.add("open");
      m.setAttribute("aria-hidden", "false");
    });
    m.addEventListener("click", function (ev) {
      if (ev.target === m || ev.target.hasAttribute("data-close")) {
        m.classList.remove("open");
        m.setAttribute("aria-hidden", "true");
      }
    });
  }

  function refreshProgressPanel() {
    if (typeof Progress === "undefined") return;
    var info = Progress.levelInfo();
    $("pfLevel").textContent = "Lv." + info.level;
    $("pfTitle").textContent = info.title || "";
    $("pfXp").textContent = Progress.stats().xp || 0;
    var need = info.need || 0;
    $("pfBar").style.width = (need ? Math.round((info.rest / need) * 100) : 100) + "%";
    $("pfStreak").textContent = (Progress.streak() || {}).cur || 0;

    var ds = Progress.daily() || [];
    $("pfDaily").innerHTML = ds.length ? ds.map(function (d) {
      return '<div class="ma-daily' + (d.done ? " got" : "") + '">' +
        '<span class="ma-daily-t">' + esc(d.emoji || "") + " " + esc(d.title) + "</span>" +
        '<span class="ma-daily-n">' + (d.cur || 0) + "/" + d.need + "</span></div>";
    }).join("") : '<div class="muted">今天没有任务</div>';

    var bs = Progress.badges() || [];
    var gotB = bs.filter(function (b) { return b.got; }).length;
    $("pfBadgeCount").textContent = gotB + " / " + bs.length;
    $("pfBadges").innerHTML = bs.map(function (b) {
      return '<div class="ma-badge' + (b.got ? " got" : "") + '" title="' + esc(b.desc || "") + '">' +
        '<span class="ma-badge-e">' + (b.got ? b.emoji : "🔒") + "</span>" +
        '<span class="ma-badge-t">' + esc(b.title) + "</span></div>";
    }).join("");

    var ms = Progress.medals() || [];
    var gotM = ms.filter(function (m) { return m.got; }).length;
    $("pfMedalCount").textContent = gotM + " / " + ms.length;
    $("pfMedals").innerHTML = ms.map(function (m) {
      return '<div class="ma-medal' + (m.got ? " got " + (m.tier || "") : "") + '" title="' + esc(m.hint || "") + '">' +
        '<span class="ma-medal-e">' + (m.got ? m.emoji : "🔒") + "</span>" +
        '<span class="ma-medal-t">' + esc(m.title) + "</span></div>";
    }).join("");
  }

  // ---------------------------------------------------------------- 启动

  function init() {
    if (!UNITS.length) {
      $("unitList").innerHTML = '<div class="muted">题库没加载出来，刷新试试。</div>';
      return;
    }
    renderGrades();
    renderUnits();
    renderKeypad();

    $("btnCheck").addEventListener("click", check);
    $("btnSkip").addEventListener("click", skip);
    $("btnQuit").addEventListener("click", function () {
      $("playCard").style.display = "none";
      $("introCard").style.display = "";
    });
    $("btnAgain").addEventListener("click", function () { startRound(S.unitId); });
    $("btnNextUnit").addEventListener("click", function () {
      $("resultCard").style.display = "none";
      $("introCard").style.display = "";
      S.unitId = null;
      renderUnits();
    });
    $("answer").addEventListener("keydown", function (ev) {
      if (ev.key === "Enter") { ev.preventDefault(); check(); }
    });
    // 物理键盘直接输数字也顺手（孩子接了键盘就能用）
    document.addEventListener("keydown", function (ev) {
      if ($("playCard").style.display === "none") return;
      if (document.activeElement === $("answer")) return;
      if (/^[0-9.]$/.test(ev.key)) { $("answer").value += ev.key; $("answer").focus(); }
    });

    bindModal("btnProgress", "progressModal", refreshProgressPanel);

    if (typeof Progress !== "undefined") {
      Progress.init();
      Progress.onChange(function () { refreshProgressPanel(); });
    }
    if (typeof Sync !== "undefined") {
      Sync.init({
        subject: "math",
        entities: {
          progress: {
            collect: function () {
              var row = Progress.exportRow();
              return [{
                // row_id 带上档案 id：sub_rows 主键不含 profile_id
                row_id: "progress__" + Progress.profileId(),
                profile_id: Progress.profileId(),
                payload_json: row.stats_json,
                updated_at: row.updated_at
              }];
            },
            apply: function (rows) {
              var n = 0, me = Progress.profileId();
              (rows || []).forEach(function (r) {
                if (r.deleted) return;
                if (r.profile_id && r.profile_id !== me) return;
                if (Progress.importRow({ stats_json: r.payload_json, updated_at: r.updated_at })) n++;
              });
              return n;
            }
          }
        }
      });
    }
    refreshProgressPanel();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
