/* ============================================================================
 * 家长中心 · 读取各学科的学习记录并汇总
 *
 * 难点在于**三个学科体系的存储形状各不相同**，而且都不能改（老站还在用）：
 *
 *   平台学科（打字/数学/汉字）
 *       mian_<id>__stats__p_default
 *       { xp, days:{日期:{xp,n}}, streak:{cur,best,last}, badges:[], medals:[] }
 *       等级曲线 100 + (级-2)*60
 *
 *   Python  codepanda_stats_v1_p_default
 *       { xp, runs, successes, days:[...], streak: 数字, badges:[], medals:[] }
 *       等级曲线 80 + (级-2)*20
 *
 *   英语    en_stats__p_default
 *       { xp, days:[...], streak: 数字, badges:[], medals:[], words, readers… }
 *       等级曲线 80 + (级-2)*20
 *
 * 所以这里的读法是**防御性**的：字段缺了就当 0，形状不对就跳过，
 * 绝不让一条脏数据把整张周报打不开。
 * ========================================================================== */
(function () {
  "use strict";

  var NAMES = {
    python: "萌码 Python", en: "萌语岛", typing: "键盘岛",
    math: "数学岛", cn: "汉字岛", pinyin: "拼音岛"
  };
  var EMOJI = {
    python: "🐼", en: "🌴", typing: "⌨️", math: "🔢", cn: "📖", pinyin: "🅰️"
  };
  // 等级曲线：不同体系不一样，别用一个公式套
  var CURVE = {
    python: { first: 80, step: 20 },
    en: { first: 80, step: 20 },
    _platform: { first: 100, step: 60 }
  };
  var PID = "p_default";

  function $(id) { return document.getElementById(id); }
  function esc(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  }
  function read(key) {
    try {
      var raw = localStorage.getItem(key);
      if (!raw) return null;
      var v = JSON.parse(raw);
      return (v && typeof v === "object") ? v : null;
    } catch (e) { return null; }
  }

  function levelOf(xp, curve) {
    xp = Math.max(0, Number(xp) || 0);
    var c = curve || CURVE._platform;
    var need = function (lv) { return c.first + (lv - 2) * c.step; };
    var level = 1, rest = xp;
    while (level < 30 && rest >= need(level + 1)) {
      rest -= need(level + 1);
      level++;
    }
    return level;
  }

  /** days 可能是对象（平台）也可能是数组（Python / 英语），统一成 {count, last} */
  function daysInfo(days) {
    if (Array.isArray(days)) {
      var d = days.filter(function (x) { return x; }).map(String).sort();
      return { count: d.length, last: d.length ? d[d.length - 1] : "" };
    }
    if (days && typeof days === "object") {
      var k = Object.keys(days).sort();
      return { count: k.length, last: k.length ? k[k.length - 1] : "" };
    }
    return { count: 0, last: "" };
  }

  /** streak 可能是对象（平台）也可能是数字（Python / 英语） */
  function streakOf(s) {
    var v = s && s.streak;
    if (typeof v === "number") return Math.max(0, v);
    if (v && typeof v === "object") return Math.max(0, Number(v.cur) || 0);
    return 0;
  }

  function listOf(v) { return Array.isArray(v) ? v : []; }

  // ---------------------------------------------------------------- 收集

  /** 学科清单：平台学科从 subjects.js 的 manifests 推，另加两个老站学科 */
  function subjectList() {
    var out = [
      { id: "python", key: "codepanda_stats_v1_" + PID },
      { id: "en", key: "en_stats__" + PID }
    ];
    var man = (window.MIAN_SUBJECTS && window.MIAN_SUBJECTS.manifests) || [];
    man.forEach(function (p) {
      var id = String(p).split("/")[1];
      if (!id || id === "python" || id === "en") return;
      out.push({ id: id, key: "mian_" + id + "__stats__" + PID });
    });
    return out;
  }

  function collect() {
    var rows = [];
    subjectList().forEach(function (s) {
      var st = read(s.key);
      if (!st) return;
      var xp = Math.max(0, Number(st.xp) || 0);
      var di = daysInfo(st.days);
      var curve = CURVE[s.id] || CURVE._platform;
      rows.push({
        id: s.id,
        name: NAMES[s.id] || s.id,
        emoji: EMOJI[s.id] || "📘",
        xp: xp,
        level: levelOf(xp, curve),
        badges: listOf(st.badges).length,
        medals: listOf(st.medals).length,
        days: di.count,
        last: di.last,
        streak: streakOf(st)
      });
    });
    // 经验多的排前面；没数据的排后面
    rows.sort(function (a, b) { return b.xp - a.xp; });
    return rows;
  }

  // ---------------------------------------------------------------- 渲染

  function renderOverview(rows) {
    var bestStreak = rows.reduce(function (m, r) { return Math.max(m, r.streak); }, 0);
    var totalDays = rows.reduce(function (m, r) { return Math.max(m, r.days); }, 0);
    var box = (typeof SRS !== "undefined" && SRS.stats) ? SRS.stats() : { total: 0 };

    $("ovStreak").textContent = bestStreak;
    $("ovSubjects").textContent = rows.length;
    $("ovDays").textContent = totalDays;
    $("ovBox").textContent = box.total || 0;
  }

  function shortDate(s) {
    if (!s) return "—";
    var m = String(s).match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (m) return Number(m[2]) + " 月 " + Number(m[3]) + " 日";
    return String(s).slice(0, 10);
  }

  function renderTable(rows) {
    var body = $("subjBody");
    if (!rows.length) {
      body.innerHTML = '<tr><td colspan="7" class="pa-idle" style="text-align:center;padding:24px">' +
        "还没有任何学习记录。去大厅挑一个学科试试。</td></tr>";
      return;
    }
    body.innerHTML = rows.map(function (r) {
      // 等级进度：往下一级还差多少（用同一个曲线算）
      var curve = CURVE[r.id] || CURVE._platform;
      var need = curve.first + (r.level - 1) * curve.step;
      var rest = r.xp;
      for (var lv = 1; lv < r.level; lv++) rest -= curve.first + (lv - 1) * curve.step;
      var pct = need > 0 ? Math.max(0, Math.min(100, Math.round((rest / need) * 100))) : 100;

      return "<tr>" +
        '<td class="name">' + esc(r.emoji) + " " + esc(r.name) + "</td>" +
        '<td class="num"><span class="pa-bar"><i style="width:' + pct + '%"></i></span>Lv.' + r.level + "</td>" +
        '<td class="num">' + r.xp + "</td>" +
        '<td class="num">' + r.badges + "</td>" +
        '<td class="num">' + r.medals + "</td>" +
        '<td class="num">' + r.days + " 天</td>" +
        "<td>" + esc(shortDate(r.last)) + "</td>" +
        "</tr>";
    }).join("");
  }

  function renderWeak() {
    var host = $("weakBox");
    if (typeof SRS === "undefined" || !SRS.stats) {
      host.innerHTML = '<div class="pa-empty">记忆盒没加载出来。</div>';
      return;
    }
    // 盒子最浅的 = 还没掌握。取盒号 ≤1 的（刚错过、或刚答对一次）
    var items = [];
    try {
      var raw = localStorage.getItem("mian_srs__items__" + PID);
      var d = raw ? JSON.parse(raw) : {};
      Object.keys(d).forEach(function (k) {
        var it = d[k];
        if (it && it.box <= 1) items.push(it);
      });
    } catch (e) { items = []; }

    if (!items.length) {
      host.innerHTML = '<div class="pa-empty">还没有做错过的题 —— 或者已经都掌握了。</div>';
      return;
    }
    var by = {};
    items.forEach(function (it) {
      var s = it.s || "?";
      (by[s] = by[s] || []).push(it);
    });
    host.innerHTML = Object.keys(by).map(function (s) {
      var list = by[s].slice(0, 12);
      return '<div class="pa-weak-group">' +
        '<div class="pa-weak-title">' + esc(EMOJI[s] || "📘") + " " + esc(NAMES[s] || s) +
          " · " + by[s].length + " 项</div>" +
        '<div class="pa-weak-items">' +
        list.map(function (it) {
          // 中间加个箭头：不加的话「2 + 8」和答案「10」会连成「2 + 810」，
          // 家长一眼看不出哪部分是题、哪部分是答案
          return '<span class="pa-weak-item">' + esc(it.f || "") +
            '<i aria-hidden="true">→</i><b>' + esc(it.b || "") + "</b></span>";
        }).join("") +
        (by[s].length > list.length ? '<span class="pa-weak-item">…还有 ' + (by[s].length - list.length) + " 项</span>" : "") +
        "</div></div>";
    }).join("");
  }

  function init() {
    var d = new Date();
    $("paDate").textContent = d.getFullYear() + " 年 " + (d.getMonth() + 1) + " 月 " + d.getDate() + " 日";

    var rows = collect();
    renderOverview(rows);
    renderTable(rows);
    renderWeak();

    $("btnPrint").addEventListener("click", function () { window.print(); });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
