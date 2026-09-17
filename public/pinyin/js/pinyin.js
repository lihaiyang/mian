/* ============================================================================
 * 拼音岛 · 学科逻辑
 *
 * 一年级语文的第一道坎：**听准了才读得对**。所以这个学科的重点全在"听"：
 *   声母表 / 韵母表  → 点一下就发音（呼读音）
 *   四声            → 妈麻马骂，同一个音节四个调对比着听
 *   整体认读         → 16 个要整体记的音节
 *   拼读练习         → b + ā = bā，一步一步拼给孩子听
 *   听音写拼音       → 听一个音，自己写出字母 + 标出声调（比"选"难一档）
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
    tab: "sm",          // sm / ym / sd / zt / pd / xz
    // 拼读练习
    pd: null,           // 当前题
    pdRight: 0,
    pdWrong: 0,
    pdDone: 0,
    pdRound: 0,         // 这一组做了几题
    pdOrder: [],
    // 看拼音选字
    cx: null,
    // 听音写拼音
    xzRow: null,        // 当前题（音节行）
    xzLetters: "",      // 孩子写的字母
    xzTone: 0,          // 孩子选的声调（1–4，0 = 还没选）
    xzRight: 0,
    xzWrong: 0,
    xzDone: 0,
    xzRound: 0,
    xzOrder: [],
    xzSettled: false    // 本题已经判过（锁定输入，等自动下一题）
  };

  var PD_ROUND = 8;     // 拼读一组 8 题
  var XZ_ROUND = 8;     // 写拼音一组 8 题

  var TONE_NAME = { 1: "第一声", 2: "第二声", 3: "第三声", 4: "第四声" };
  // 声调键上写什么：**带字母的样例**（ā á ǎ à），不是光秃秃的调号 ˉ ˊ ˇ ˋ ——
  // 调号离开字母就没有形状，一年级孩子认不出来（实测截图里就是四个小符号）。
  var TONE_SIGN = { 1: "ā", 2: "á", 3: "ǎ", 4: "à" };

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
    S.pdChoices = shuffled([row].concat(pickDistractors(row)), row.s + ":pick");
    renderPd();
  }

  /**
   * 选 3 个干扰项。**这是这个学科最需要想清楚的地方**：
   * 干扰项决定孩子到底在练什么。
   *
   * 逐级降级（越靠前越好，因为越接近"只差一个音素"）：
   *   ① 同韵母 + 同声调、不同声母 —— 只差声母，练的正是 b/p、n/l、zh/z 这些最容易混的
   *   ② 同韵母、不同声母（声调可以不同）—— 还是练声母，但多了声调线索
   *   ③ 同韵母（允许同声母，但**必须不同声调**，否则就是同音字）
   *   ④ 实在没有同韵母的（实测 352 个里只有 6 个），退到声母相同、韵母不同
   *
   * ⚠️ 两条硬约束：
   *   · 绝不能出现**读音完全相同**的干扰项 —— 那等于两个正确答案，孩子选哪个都对/都错
   *   · 同一个字也不能重复出现
   */
  function pickDistractors(row) {
    var pool = pdPool().filter(function (r) {
      return r.s !== row.s && r.c !== row.c && r.py !== row.py;
    });
    var tiers = [
      function (r) { return r.f === row.f && r.t === row.t && r.i !== row.i; },
      function (r) { return r.f === row.f && r.i !== row.i; },
      function (r) { return r.f === row.f && r.t !== row.t; },
      function (r) { return r.i === row.i && r.f !== row.f; }
    ];
    for (var i = 0; i < tiers.length; i++) {
      var hit = pool.filter(tiers[i]);
      if (hit.length >= 3) return shuffled(hit, row.s + ":" + i).slice(0, 3);
    }
    // 最后兜底：任何读音不同的音节（不让练习空着）
    return shuffled(pool, row.s + ":x").slice(0, 3);
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

  // ---------------------------------------------------------------- 听音写拼音
  //
  // 比"听音选字"难一档：选字是**认**，写是**产出**，是真正掌握的门槛。
  // 判分把答案拆成两半分别判：字母（b + a）和声调（第几声）。
  // 这样才能给出"字母对了、声调再听听"这种有用的反馈 —— 只报对错的话，
  // 孩子不知道自己错在哪一半。

  /** 调号 → 不带调的字母表；ɡ(U+0261) 是数据源里的手写体 g，孩子打不出来；
   *  v 是键盘上代替 ü 的写法（lü 打成 lv 算对）。 */
  var TONE_MAP = {
    "ā": "a", "á": "a", "ǎ": "a", "à": "a",
    "ē": "e", "é": "e", "ě": "e", "è": "e",
    "ī": "i", "í": "i", "ǐ": "i", "ì": "i",
    "ō": "o", "ó": "o", "ǒ": "o", "ò": "o",
    "ū": "u", "ú": "u", "ǔ": "u", "ù": "u",
    "ǖ": "ü", "ǘ": "ü", "ǚ": "ü", "ǜ": "ü", "ü": "ü"
  };

  function lettersOf(s) {
    var str = String(s == null ? "" : s).toLowerCase()
      .replace(/\u0261/g, "g").replace(/v/g, "ü");
    var out = "";
    for (var i = 0; i < str.length; i++) {
      var c = str.charAt(i);
      if (TONE_MAP[c]) out += TONE_MAP[c];
      else if (/[a-z]/.test(c)) out += c;
    }
    return out;
  }

  /** 能听写的音节：要有声调可写。轻声/无调的那几个（的/了/么/呢）
   *  没有调号可标，判分只会变成猜谜，直接排除。 */
  function xzPool() {
    return pdPool().filter(function (r) { return r.t >= 1 && r.t <= 4; });
  }

  function newXz(reshuffle) {
    if (reshuffle || !S.xzOrder.length) {
      S.xzOrder = shuffled(xzPool(), "xz:" + Date.now() + ":" + Math.random());
      S.xzRound = 0;
    }
    var row = S.xzOrder.pop();
    if (!row) { S.xzOrder = []; return newXz(false); }
    S.xzRow = row;
    S.xzLetters = "";
    S.xzTone = 0;
    S.xzSettled = false;
    renderXz();
    speak("p:" + row.s, row.c);          // 进来先听一遍
  }

  function renderXz(result) {
    var host = $("xzBox");
    if (!host) return;
    var r = S.xzRow;
    if (!r) { host.innerHTML = '<p class="py-note">数据没加载出来。</p>'; return; }

    var tones = [1, 2, 3, 4].map(function (n) {
      return '<button type="button" class="py-tbtn' + (S.xzTone === n ? " active" : "") + '"' +
        ' data-tone="' + n + '"' + (S.xzSettled ? " disabled" : "") +
        ' aria-pressed="' + (S.xzTone === n ? "true" : "false") + '">' +
        "<b>" + TONE_SIGN[n] + "</b><span>" + TONE_NAME[n] + "</span></button>";
    }).join("");

    var head = '<div class="py-pd-head">' +
      '<span class="py-pd-progress">第 ' + (S.xzRound + 1) + " / " + XZ_ROUND + " 题</span>" +
      '<span class="py-pd-score">✅ ' + S.xzRight + "　❌ " + S.xzWrong + "</span>" +
      "</div>";

    var play = '<div class="py-xz-play">' +
      '<button type="button" class="btn py-play" data-key="p:' + esc(r.s) + '" data-say="' + esc(r.c) + '">' +
      "🔊 再听一遍</button></div>";

    var ask = '<p class="py-ask">听一听，把这个音节写下来</p>';

    var input = '<div class="py-xz-input-row">' +
      '<label class="sr-only" for="xzInput">写下你听到的拼音字母</label>' +
      '<input id="xzInput" class="py-xz-input" type="text" value="' + esc(S.xzLetters) + '"' +
      ' inputmode="latin" autocomplete="off" autocorrect="off" autocapitalize="off"' +
      ' spellcheck="false" enterkeyhint="done" placeholder="写拼音字母"' +
      (S.xzSettled ? " disabled" : "") + ">" +
      '<button type="button" class="py-xz-hk" data-k="ü"' + (S.xzSettled ? " disabled" : "") + ">ü</button>" +
      '<button type="button" class="py-xz-hk" data-k="⌫"' + (S.xzSettled ? " disabled" : "") +
      ' aria-label="删掉一个字母">⌫</button>' +
      "</div>" +
      '<div class="py-tone-pick">' + tones + "</div>";

    var ans = "";
    if (S.xzSettled && result) {
      var parts = [];
      if (r.i) parts.push("声母 " + r.i);
      if (r.f) parts.push("韵母 " + r.f);
      ans = '<div class="py-xz-ans' + (result.ok ? " ok" : " no") + '">' +
        '<div class="py-xz-ans-main">' +
          '<span class="py-xz-ans-py">' + esc(r.py) + "</span>" +
          '<span class="py-xz-ans-c">' + esc(r.c) + "</span>" +
          '<span class="py-xz-ans-t">' + esc(TONE_NAME[r.t] || "") + "</span>" +
        "</div>" +
        '<div class="py-xz-ans-say">' + esc(result.msg) + "</div>" +
        (parts.length ? '<div class="py-note">' + esc(parts.join("　＋　")) + "</div>" : "") +
        "</div>";
    }

    var actions = S.xzSettled ? "" :
      '<div class="py-pd-actions">' +
        '<button type="button" class="btn" id="btnXzCheck">检查</button>' +
        '<button type="button" class="btn ghost sm" id="btnXzSkip">不会，看答案</button>' +
      "</div>";

    host.innerHTML = head + play + ask + input + ans + actions;
  }

  function setTone(n) {
    if (S.xzSettled || !n) return;
    S.xzTone = n;
    // 只改按键的高亮状态，**不重画** —— 重画会把输入框里的光标和键盘焦点丢掉
    var host = $("xzBox");
    if (host) {
      var btns = host.querySelectorAll("[data-tone]");
      for (var i = 0; i < btns.length; i++) {
        var on = Number(btns[i].getAttribute("data-tone")) === n;
        btns[i].classList.toggle("active", on);
        btns[i].setAttribute("aria-pressed", on ? "true" : "false");
      }
      var warn = $("xzToneWarn");
      if (warn && warn.parentNode) warn.parentNode.removeChild(warn);
    }
  }

  function xzKey(k) {
    if (S.xzSettled) return;
    if (k === "⌫") S.xzLetters = S.xzLetters.slice(0, -1);
    else S.xzLetters = (S.xzLetters + k).slice(0, 12);
    var inp = $("xzInput");
    if (inp) inp.value = S.xzLetters;      // 直接改值，同样是为了不丢光标
    else renderXz();
  }

  function checkXz() {
    var r = S.xzRow;
    if (!r || S.xzSettled) return;
    var give = lettersOf(S.xzLetters);
    if (!give) { var i = $("xzInput"); if (i) i.focus(); return; }
    if (!S.xzTone) {
      var host = $("xzBox");
      if (host && !$("xzToneWarn")) {
        var w = document.createElement("p");
        w.id = "xzToneWarn";
        w.className = "py-xz-warn";
        w.textContent = "别忘了标声调：先选一个声调再检查。";
        host.insertBefore(w, host.firstChild);
      }
      return;
    }

    var want = lettersOf(r.py);
    var okLetters = give === want;
    var okTone = S.xzTone === r.t;
    var ok = okLetters && okTone;
    var msg;
    if (ok) msg = "全对！";
    else if (okLetters) msg = "字母写对了，声调再听一遍 —— 你标的是" + TONE_NAME[S.xzTone] + "，应该是" + TONE_NAME[r.t] + "。";
    else msg = "字母差一点，你写的是 " + esc(S.xzLetters.trim() || "（空）") + "。";

    S.xzSettled = true;
    S.xzDone++;
    if (ok) S.xzRight++; else S.xzWrong++;

    if (typeof Progress !== "undefined") {
      Progress.emit("pinyin_write", {});
      if (ok) Progress.emit("pinyin_write_ok", {});
    }
    renderXz({ ok: ok, msg: msg });
    // 对了要把正确读音再放一遍，让"写的"和"听的"重新对上
    speak("p:" + r.s, r.c);
    var delay = ok ? 1500 : 3000;
    setTimeout(function () {
      S.xzRound++;
      if (S.xzRound >= XZ_ROUND) return finishXz();
      newXz(false);
    }, delay);
  }

  function skipXz() {
    var r = S.xzRow;
    if (!r || S.xzSettled) return;
    S.xzSettled = true;
    S.xzDone++;
    S.xzWrong++;
    if (typeof Progress !== "undefined") Progress.emit("pinyin_write", {});
    renderXz({ ok: false, msg: "没写出来没关系，先记住它怎么读。" });
    speak("p:" + r.s, r.c);
    setTimeout(function () {
      S.xzRound++;
      if (S.xzRound >= XZ_ROUND) return finishXz();
      newXz(false);
    }, 3000);
  }

  function finishXz() {
    var total = S.xzRight + S.xzWrong || 1;
    var pct = Math.round(S.xzRight / total * 100);
    $("xzBox").innerHTML =
      '<div class="py-finish">' +
        "<h2>" + (pct >= 100 ? "全对！会写拼音啦 🎉" : pct >= 60 ? "写得不错" : "再来一组会更好") + "</h2>" +
        '<div class="py-finish-grid">' +
          "<div><b>" + S.xzRight + "</b><span>写对</span></div>" +
          "<div><b>" + S.xzWrong + "</b><span>没写对</span></div>" +
          "<div><b>" + pct + "%</b><span>正确率</span></div>" +
        "</div>" +
        '<button type="button" class="btn" id="btnXzAgain">🔁 再来一组</button>' +
      "</div>";
    if (typeof Progress !== "undefined") {
      Progress.emit("pinyin_write_round", {});
      if (pct === 100) Progress.emit("pinyin_write_perfect", { perfect: true });
    }
    S.xzRight = 0; S.xzWrong = 0; S.xzOrder = []; S.xzRow = null; S.xzSettled = false;
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
    ["sm", "ym", "zt", "sd", "pd", "xz"].forEach(function (t) {
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
    if (tab === "xz") { if (!S.xzRow) newXz(true); else renderXz(); }
    // 预热：切过去之前就把音频拉下来
    if (window.PinyinVoice) {
      // 写拼音的题是随机抽的，可能是 bd1…bd4 任意一组，四组都要备好
      if (tab === "xz") PinyinVoice.warm(["bd1", "bd2", "bd3", "bd4"]);
      else {
        PinyinVoice.warm(tab === "sm" ? ["sm"] : tab === "ym" ? ["ym"] :
                         tab === "zt" ? ["zt"] : tab === "sd" ? ["sd"] : ["bd1"]);
      }
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
      // 听音写拼音：声调键 / ü / ⌫ / 检查 / 跳过 / 再来一组
      var toneBtn = el.closest ? el.closest("[data-tone]") : null;
      if (toneBtn) { setTone(Number(toneBtn.getAttribute("data-tone"))); return; }
      var hk = el.closest ? el.closest("[data-k]") : null;
      if (hk) { xzKey(hk.getAttribute("data-k")); return; }
      if (el.id === "btnXzCheck") { checkXz(); return; }
      if (el.id === "btnXzSkip") { skipXz(); return; }
      if (el.id === "btnXzAgain") { S.xzOrder = []; newXz(true); return; }
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

    // 写拼音的输入框是每题重画的，所以输入事件也要委托
    document.addEventListener("input", function (ev) {
      if (ev.target && ev.target.id === "xzInput") {
        S.xzLetters = String(ev.target.value || "").slice(0, 12);
      }
    });
    document.addEventListener("keydown", function (ev) {
      if (ev.key === "Enter" && ev.target && ev.target.id === "xzInput") {
        ev.preventDefault();
        checkXz();
      }
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

  /* 给测试用的最小出口。
     为什么值得开这个口子：干扰项的挑选规则（pickDistractors）是这个学科
     最需要盯住的地方，而它只在"点进来的某一道题"上体现 ——
     352 个音节里抽样测几道是看不出问题的（实测有 22 个音节凑不出同韵母干扰项，
     抽样测试完全没发现，是压测才抓到的）。
     tools/pinyin/check_choices.mjs 会拿这个出口在**全部音节**上跑一遍。
     ⚠️ 测试必须调这里的真函数，不能抄一份实现 —— 抄了迟早跟实现漂移。 */
  window.PinyinDebug = {
    pickDistractors: typeof pickDistractors === "function" ? pickDistractors : null,
    pdPool: pdPool,
    xzPool: xzPool,
    lettersOf: lettersOf,
    TONE_MAP: TONE_MAP,
    // 当前这道听写题 —— e2e 要能"按正确答案作答"，否则只能瞎点
    xzRow: function () { return S.xzRow; },
    xzState: function () {
      return { right: S.xzRight, wrong: S.xzWrong, round: S.xzRound,
               settled: S.xzSettled, tone: S.xzTone, letters: S.xzLetters };
    }
  };
})();
