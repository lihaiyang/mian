/* ============================================================================
 * 拼音岛 · 学科逻辑
 *
 * 一年级语文的第一道坎：**听准了才读得对**。所以这个学科的重点全在"听"：
 *   声母表 / 韵母表  → 点一下就发音（呼读音）
 *   四声            → 妈麻马骂，同一个音节四个调对比着听
 *   整体认读         → 16 个要整体记的音节
 *   拼读练习         → b + ā = bā，一步一步拼给孩子听
 *   看拼音选字       → 反过来练：给了音节，挑出对的字
 *
 * 和其它学科一样：等级 / 打卡 / 徽章 / 云同步 / 家长报告一行都不写，全交给平台层。
 * 发音走 PinyinVoice（音频精灵 → 系统 TTS 两级降级）。
 * ========================================================================== */
(function () {
  "use strict";

  var INITIALS = window.PY_INITIALS || [];
  var FINALS = window.PY_FINALS || [];
  var TONES = window.PY_TONES || [];
  var TONE_DEMO = window.PY_TONE_DEMO || null;
  var WHOLE = window.PY_WHOLE || [];
  var SYLLABLES = window.PY_SYLLABLES || [];

  var S = {
    tab: "sm",          // sm / ym / sd / zt / pd
    // 拼读练习
    pd: null,           // 当前题
    pdRight: 0,
    pdWrong: 0,
    pdDone: 0,
    pdRound: 0,         // 这一组做了几题
    pdOrder: [],
    // 看拼音选字
    cx: null
  };

  var PD_ROUND = 8;     // 拼读一组 8 题

  function $(id) { return document.getElementById(id); }
  function esc(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  }
  function shuffled(arr, seed) {
    var a = arr.slice(), s = 0, i;
    for (i = 0; i < String(seed).length; i++) s = (s * 31 + String(seed).charCodeAt(i)) >>> 0;
    for (i = a.length - 1; i > 0; i--) {
      s = (s * 1103515245 + 12345) >>> 0;
      var j = s % (i + 1), t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  }
  /** 给元素绑一次点击（重绘后仍然有效用事件委托，见 init） */
  function speak(key, text) {
    if (window.PinyinVoice) PinyinVoice.play(key, text);
  }

  // ---------------------------------------------------------------- 声母 / 韵母

  function cardHtml(row, kind) {
    var key = (kind === "sm" ? "i:" : "f:") + row.p;
    var tip = row.tip ? '<span class="py-card-tip">' + esc(row.tip) + "</span>" : "";
    return '<button type="button" class="py-card" data-key="' + esc(key) +
      '" data-say="' + esc(row.c) + '" aria-label="' + esc(row.p + "，" + row.c) + '">' +
      '<span class="py-card-p">' + esc(row.p) + "</span>" +
      '<span class="py-card-c">' + esc(row.c) + "</span>" +
      (row.py ? '<span class="py-card-py">' + esc(row.py) + "</span>" : "") +
      tip +
      '<span class="py-card-play" aria-hidden="true">🔊</span>' +
      "</button>";
  }

  /** 渲染某个页签的卡片网格。host 由调用方给（三个页签各一块容器） */
  function renderCards(tab, hostId) {
    tab = tab || S.tab;
    var host = $(hostId || (tab === "sm" ? "pyGrid" : tab === "ym" ? "pyGridYm" : "pyGridZt"));
    if (!host) return;
    var html = "";
    if (tab === "sm") {
      html = '<div class="py-grid py-grid-4">' + INITIALS.map(function (r) { return cardHtml(r, "sm"); }).join("") + "</div>";
    } else if (S.tab === "ym") {
      // 韵母按教学分组显示（单韵母 / 复韵母 / 鼻韵母），一组一行
      var groups = ["单韵母", "复韵母", "特殊韵母", "前鼻韵母", "后鼻韵母"];
      html = groups.map(function (g) {
        var list = FINALS.filter(function (x) { return x.group === g; });
        if (!list.length) return "";
        return '<div class="py-group"><span class="py-group-name">' + esc(g) + "</span>" +
          '<div class="py-grid py-grid-6">' + list.map(function (r) { return cardHtml(r, "ym"); }).join("") + "</div></div>";
      }).join("");
    } else if (tab === "zt") {
      html = '<div class="py-grid py-grid-4">' + WHOLE.map(function (r) {
        return '<button type="button" class="py-card" data-key="w:' + esc(r.p) + '" data-say="' + esc(r.c) + '">' +
          '<span class="py-card-p">' + esc(r.p) + "</span>" +
          '<span class="py-card-c">' + esc(r.c) + "</span>" +
          (r.py ? '<span class="py-card-py">' + esc(r.py) + "</span>" : "") +
          '<span class="py-card-play" aria-hidden="true">🔊</span></button>';
      }).join("") + "</div>" +
      '<p class="py-note">这 16 个音节要<b>整体记住</b>，不要拆开拼 —— 这是教材的要求。</p>';
    }
    host.innerHTML = html;
  }

  // ---------------------------------------------------------------- 四声

  function renderTones() {
    var host = $("sdBox");
    if (!host) return;
    if (!TONE_DEMO) { host.innerHTML = '<p class="py-note">四声数据没加载出来。</p>'; return; }
    var cards = TONES.map(function (t) {
      var ch = (TONE_DEMO.chars || {})[String(t.n)] || "";
      var py = (TONE_DEMO.pinyin || {})[String(t.n)] || "";
      return '<div class="py-tone' + (t.n === 3 ? " py-tone-hard" : "") + '">' +
        '<div class="py-tone-head"><span class="py-tone-n">第' + t.n + "声</span>" +
        '<span class="py-tone-mark">' + esc(t.mark) + "</span></div>" +
        '<button type="button" class="py-tone-big" data-key="d:' + t.n + '" data-say="' + esc(ch) + '">' +
        '<span class="py-tone-py">' + esc(py) + "</span>" +
        '<span class="py-tone-c">' + esc(ch) + "</span>" +
        '<span class="py-card-play" aria-hidden="true">🔊</span></button>' +
        '<div class="py-tone-tip">' + esc(t.tip) + "</div>" +
        '<button type="button" class="btn ghost sm py-tone-name" data-key="tn:' + t.n + '">听名称</button>' +
        "</div>";
    }).join("");
    host.innerHTML =
      '<div class="py-tone-bar">' +
        '<span>同一个音节 <b>' + esc(TONE_DEMO.base) + "</b> 的四个声调：</span>" +
        '<button type="button" class="btn py-play-all" id="btnToneAll">🔊 四个一起听</button>' +
      "</div>" +
      '<div class="py-tones">' + cards + "</div>";
  }

  function playAllTones() {
    if (!TONE_DEMO) return;
    var ns = [1, 2, 3, 4];
    var i = 0;
    (function next() {
      if (i >= ns.length) return;
      var n = ns[i++];
      var ch = (TONE_DEMO.chars || {})[String(n)];
      speak("d:" + n, ch);
      setTimeout(next, 1100);          // 留出声调之间的间隔，才听得出对比
    })();
  }

  // ---------------------------------------------------------------- 拼读练习

  /** 能拿去拼的音节 —— 判断在数据里（sp 字段）：
   *  整体认读音节要整体记、y/w 开头的不是"声母+韵母"拼出来的，都不能拆。
   *  页面上写着"不要拆开拼"，练习里就不能出 `y + i = yi`。 */
  function pdPool() {
    return SYLLABLES.filter(function (r) { return r.sp; });
  }

  function newPd(reshuffle) {
    if (reshuffle || !S.pdOrder.length) {
      S.pdOrder = shuffled(pdPool(), "pd:" + Date.now() + ":" + Math.random());
      S.pdRound = 0;
    }
    var row = S.pdOrder.pop();
    if (!row) { S.pdOrder = []; return newPd(false); }
    S.pd = row;
    // 干扰项：**同韵母 + 同声调**、只差声母的 3 个。
    // 这样考的是"听声母"（b/p、n/l、zh/z 这些正是孩子最容易混的），
    // 而不是靠声调或韵母的不同去猜。
    var same = pdPool().filter(function (r) {
      return r.s !== row.s && r.f === row.f && r.t === row.t && r.i !== row.i;
    });
    var pool = same.length >= 3 ? same
      : pdPool().filter(function (r) { return r.s !== row.s && r.i !== row.i; });
    S.pdChoices = shuffled([row].concat(shuffled(pool, row.s).slice(0, 3)), row.s + ":pick");
    renderPd();
  }

  function renderPd() {
    var host = $("pdBox");
    if (!host) return;
    var r = S.pd;
    if (!r) { host.innerHTML = '<p class="py-note">数据没加载出来。</p>'; return; }
    var choices = (S.pdChoices || []).map(function (c) {
      return '<button type="button" class="py-choice" data-syl="' + esc(c.s) + '" data-say="' + esc(c.c) + '">' +
        '<span class="py-choice-py">' + esc(c.py) + "</span>" +
        '<span class="py-choice-c">' + esc(c.c) + "</span></button>";
    }).join("");
    host.innerHTML =
      '<div class="py-pd-head">' +
        '<span class="py-pd-progress">第 ' + (S.pdRound + 1) + " / " + PD_ROUND + " 题</span>" +
        '<span class="py-pd-score">✅ ' + S.pdRight + "　❌ " + S.pdWrong + "</span>" +
      "</div>" +
      // 拼读三步：先听声母、再听韵母、最后拼起来
      '<div class="py-pd-split">' +
        '<button type="button" class="py-part" data-key="i:' + esc(r.i) + '">' +
          '<span class="py-part-p">' + esc(r.i) + "</span><span class=\"py-part-l\">声母</span></button>" +
        '<span class="py-plus">＋</span>' +
        '<button type="button" class="py-part" data-key="f:' + esc(r.f) + '">' +
          '<span class="py-part-p">' + esc(r.f) + "</span><span class=\"py-part-l\">韵母</span></button>" +
        '<span class="py-eq">＝</span>' +
        '<button type="button" class="py-part py-part-all" data-key="p:' + esc(r.s) + '" data-say="' + esc(r.c) + '">' +
          '<span class="py-part-p">?</span><span class="py-part-l">点我听</span></button>' +
      "</div>" +
      '<p class="py-ask">听一听，哪个字是这个音？</p>' +
      '<div class="py-choices">' + choices + "</div>" +
      '<div class="py-pd-actions">' +
        '<button type="button" class="btn ghost sm" id="btnPdSkip">不会，下一题</button>' +
        '<button type="button" class="btn ghost sm" id="btnPdShuffle">🔁 换一组</button>' +
      "</div>";
  }

  function answerPd(btn, syl) {
    var r = S.pd;
    if (!r) return;
    var ok = syl === r.s;
    var all = $("pdBox").querySelectorAll(".py-choice");
    for (var i = 0; i < all.length; i++) all[i].disabled = true;
    btn.classList.add(ok ? "right" : "wrong");
    if (!ok) {
      // 把正确的那个标出来 —— 错了也要让他看见对的
      for (var k = 0; k < all.length; k++) {
        if (all[k].getAttribute("data-syl") === r.s) all[k].classList.add("right");
      }
    }
    speak("p:" + r.s, r.c);
    if (typeof Progress !== "undefined") {
      Progress.emit("pinyin_answer", {});
      if (ok) { S.pdRight++; Progress.emit("pinyin_correct", {}); }
      else { S.pdWrong++; }
    }
    S.pdRound++;
    S.pdDone++;
    setTimeout(function () {
      if (S.pdRound >= PD_ROUND) return finishPd();
      newPd(false);
    }, ok ? 1100 : 2200);
  }

  function finishPd() {
    var total = S.pdRight + S.pdWrong || 1;
    var pct = Math.round(S.pdRight / total * 100);
    $("pdBox").innerHTML =
      '<div class="py-finish">' +
        "<h2>" + (pct >= 100 ? "全对！拼音小能手 🎉" : pct >= 60 ? "做得不错" : "再来一组会更好") + "</h2>" +
        '<div class="py-finish-grid">' +
          "<div><b>" + S.pdRight + "</b><span>做对</span></div>" +
          "<div><b>" + S.pdWrong + "</b><span>没做对</span></div>" +
          "<div><b>" + pct + "%</b><span>正确率</span></div>" +
        "</div>" +
        '<button type="button" class="btn" id="btnPdAgain">🔁 再来一组</button>' +
      "</div>";
    if (typeof Progress !== "undefined") {
      Progress.emit("pinyin_round", {});
      if (pct === 100) Progress.emit("pinyin_perfect", { perfect: true });
    }
    S.pdRight = 0; S.pdWrong = 0; S.pdOrder = [];
  }

  // ---------------------------------------------------------------- 切换

  function switchTab(tab) {
    S.tab = tab;
    var tabs = document.querySelectorAll(".py-tab");
    for (var i = 0; i < tabs.length; i++) {
      var on = tabs[i].getAttribute("data-tab") === tab;
      tabs[i].classList.toggle("active", on);
      tabs[i].setAttribute("aria-selected", on ? "true" : "false");
    }
    ["sm", "ym", "zt", "sd", "pd"].forEach(function (t) {
      var el = $("pane-" + t);
      if (el) el.hidden = t !== tab;
    });
    // 只在还没渲染过时才画（重画会把滚动位置抖掉，也没必要）
    if (tab === "sm" || tab === "ym" || tab === "zt") {
      var hostId = tab === "sm" ? "pyGrid" : tab === "ym" ? "pyGridYm" : "pyGridZt";
      var h = $(hostId);
      if (h && !h.getAttribute("data-ready")) { renderCards(tab, hostId); h.setAttribute("data-ready", "1"); }
    }
    if (tab === "sd" && !$("sdBox").getAttribute("data-ready")) {
      renderTones(); $("sdBox").setAttribute("data-ready", "1");
    }
    if (tab === "pd") { if (!S.pd) newPd(true); else renderPd(); }
    // 预热：切过去之前就把音频拉下来
    if (window.PinyinVoice) {
      PinyinVoice.warm(tab === "sm" ? ["sm"] : tab === "ym" ? ["ym"] :
                       tab === "zt" ? ["zt"] : tab === "sd" ? ["sd"] : ["bd1"]);
    }
  }

  // ---------------------------------------------------------------- 启动

  function init() {
    if (!INITIALS.length && !FINALS.length) {
      $("pyGrid").innerHTML = '<div class="py-note">拼音数据没加载出来，刷新试试。</div>';
      return;
    }
    if (window.PinyinVoice) PinyinVoice.index(SYLLABLES);

    // 卡片点击用事件委托：一屏几十个卡片，重绘也不怕
    document.addEventListener("click", function (ev) {
      var el = ev.target;
      // 往上找到带 data-key 的
      var keyEl = el;
      while (keyEl && keyEl !== document.body && !keyEl.getAttribute("data-key")) keyEl = keyEl.parentNode;
      if (keyEl && keyEl !== document.body) {
        var k = keyEl.getAttribute("data-key");
        var say = keyEl.getAttribute("data-say") || "";
        if (k) {
          keyEl.classList.add("py-ping");
          setTimeout(function () { keyEl.classList.remove("py-ping"); }, 320);
          speak(k, say);
          if (typeof Progress !== "undefined" && !/^tn:/.test(k)) Progress.emit("pinyin_listen", {});
        }
        return;
      }
      var ch = el.closest ? el.closest(".py-choice") : null;
      if (ch) { answerPd(ch, ch.getAttribute("data-syl")); return; }
      if (el.id === "btnToneAll") { playAllTones(); return; }
      if (el.id === "btnPdSkip") {
        var r = S.pd;
        if (r) { speak("p:" + r.s, r.c); S.pdWrong++; S.pdRound++; S.pdDone++; }
        setTimeout(function () { S.pdRound >= PD_ROUND ? finishPd() : newPd(false); }, 1200);
        return;
      }
      if (el.id === "btnPdShuffle") { S.pdOrder = []; newPd(true); return; }
      if (el.id === "btnPdAgain") { S.pdOrder = []; newPd(true); return; }
      var tab = el.closest ? el.closest(".py-tab") : null;
      if (tab) { switchTab(tab.getAttribute("data-tab")); }
    });

    switchTab("sm");

    if (typeof Progress !== "undefined") {
      Progress.init();
      Progress.onChange(function () {
        if ($("pfLevel")) refreshProgressPanel();
      });
    }
    if (typeof Sync !== "undefined") {
      Sync.init({
        subject: "pinyin",
        entities: {
          progress: {
            collect: function () {
              var row = Progress.exportRow();
              return [{
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
  }

  function refreshProgressPanel() {
    var info = Progress.levelInfo();
    $("pfLevel").textContent = "Lv." + info.level;
    $("pfTitle").textContent = info.title || "";
    $("pfXp").textContent = Progress.stats().xp || 0;
    $("pfStreak").textContent = (Progress.streak() || {}).cur || 0;
    var need = info.need || 0;
    $("pfBar").style.width = (need ? Math.round((info.rest / need) * 100) : 100) + "%";
    var ds = Progress.daily() || [];
    $("pfDaily").innerHTML = ds.length ? ds.map(function (d) {
      return '<div class="py-daily' + (d.done ? " got" : "") + '">' +
        '<span>' + esc(d.emoji || "") + " " + esc(d.title) + "</span>" +
        "<b>" + (d.cur || 0) + "/" + d.need + "</b></div>";
    }).join("") : '<div class="py-note">今天没有任务</div>';
    var bs = Progress.badges() || [];
    $("pfBadgeCount").textContent = bs.filter(function (b) { return b.got; }).length + " / " + bs.length;
    $("pfBadges").innerHTML = bs.map(function (b) {
      return '<div class="py-badge' + (b.got ? " got" : "") + '" title="' + esc(b.desc || "") + '">' +
        '<span class="py-badge-e">' + (b.got ? b.emoji : "🔒") + "</span>" +
        '<span class="py-badge-t">' + esc(b.title) + "</span></div>";
    }).join("");
    var ms = Progress.medals() || [];
    $("pfMedalCount").textContent = ms.filter(function (m) { return m.got; }).length + " / " + ms.length;
    $("pfMedals").innerHTML = ms.map(function (m) {
      return '<div class="py-medal' + (m.got ? " got " + (m.tier || "") : "") + '" title="' + esc(m.hint || "") + '">' +
        '<span class="py-medal-e">' + (m.got ? m.emoji : "🔒") + "</span>" +
        '<span class="py-medal-t">' + esc(m.title) + "</span></div>";
    }).join("");
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
