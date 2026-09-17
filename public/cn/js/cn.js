/* ============================================================================
 * 汉字岛 · 学科逻辑
 *
 * 面向**家长和老师**：查字、看组词、选一批字生成田字格字帖打印。
 * 不是给孩子刷题的，所以没有计时、没有连击、没有积分动画。
 *
 * 数据：3500 常用字分 6 级（tools/cn/gen_chars.py 生成），
 * 每字带 拼音 / 笔画 / 部首 / 释义 / 常用组词。
 * ========================================================================== */
(function () {
  "use strict";

  var GRADES = [1, 2, 3, 4, 5, 6];
  var PAGE = 240;              // 一次最多渲染多少格，其余点「显示更多」

  var S = {
    all: [],                   // 全部字（按加载顺序 = 频率顺序）
    level: 1,                  // 当前级别筛选（"all" 表示全部）
    stroke: "all",
    radical: "all",
    q: "",
    shown: PAGE,
    current: null,             // 当前选中的字
    basket: [],                // 字帖篮（存的字）
  };

  function $(id) { return document.getElementById(id); }
  function esc(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  }

  // ---------------------------------------------------------------- 拼音

  // 去声调，让 "shui" 也能搜到 "shuǐ"
  var TONE = {
    "ā": "a", "á": "a", "ǎ": "a", "à": "a",
    "ē": "e", "é": "e", "ě": "e", "è": "e",
    "ī": "i", "í": "i", "ǐ": "i", "ì": "i",
    "ō": "o", "ó": "o", "ǒ": "o", "ò": "o",
    "ū": "u", "ú": "u", "ǔ": "u", "ù": "u",
    "ǖ": "v", "ǘ": "v", "ǚ": "v", "ǜ": "v", "ü": "v",
    "ń": "n", "ň": "n", "ḿ": "m", "ế": "e", "ề": "e"
  };
  function stripTone(s) {
    // ⚠️ 顺序很重要：**先去声调，再剥非字母**。
    // 反过来写的话，"xué" 里的 é 会被 [^a-z] 先剥掉，变成 "xu"，
    // 于是搜 "xue" 一个结果都没有 —— 实测踩过。
    return String(s || "").toLowerCase()
      .replace(/[\u00c0-\u024f\u1e00-\u1eff]/g, function (c) { return TONE[c] || c; })
      .replace(/[^a-z\u4e00-\u9fff]/g, "");
  }

  // ---------------------------------------------------------------- 数据

  /** 字表全局变量。离线又没下载过时它整个是 undefined ——
   *  直接写 window.CN_GRADE[1] 会抛 "Cannot read properties of undefined"（踩过）。 */
  function grades() { return window.CN_GRADE || {}; }

  function loadGrades() {
    // 这几份是**运行时才注入**的（HTML 里没有 <script src>），
    // 所以离线缓存要主动跟平台层报一声，否则后台预热扫不到它们。
    var want = GRADES.map(function (g) { return "data/chars-g" + g + ".js"; });
    if (window.Pwa && Pwa.want) Pwa.want(want);
    return Promise.all(GRADES.map(function (g) {
      return new Promise(function (res) {
        var el = document.createElement("script");
        el.src = "data/chars-g" + g + ".js";
        el.onload = res;
        el.onerror = res;
        document.head.appendChild(el);
      });
    }));
  }

  function flatten() {
    var out = [];
    GRADES.forEach(function (g) {
      (grades()[g] || []).forEach(function (it) {
        out.push(Object.assign({ g: g }, it));
      });
    });
    return out;
  }

  // ---------------------------------------------------------------- 筛选

  function strokeBand(n) {
    return n <= 3 ? "1-3" : n <= 6 ? "4-6" : n <= 9 ? "7-9" : n <= 12 ? "10-12" : "13+";
  }

  function filtered() {
    var q = S.q.trim();
    var qc = q.length === 1 && /[\u4e00-\u9fff]/.test(q) ? q : "";
    var qp = stripTone(q);
    return S.all.filter(function (it) {
      // 搜索时**不按级别过滤** —— 家长/老师不知道某个字在第几级，
      // 只按当前级别搜会让他们以为"查不到这个字"。
      if (!q && S.level !== "all" && it.g !== S.level) return false;
      if (S.stroke !== "all" && strokeBand(it.s) !== S.stroke) return false;
      if (S.radical !== "all" && it.r !== S.radical) return false;
      if (q) {
        if (qc) return it.c === qc;
        // 拼音搜索：要么整串匹配，要么从音节开头匹配
        var p = stripTone(it.p);
        return p === qp || p.indexOf(qp) === 0 || (" " + p).indexOf(" " + qp) >= 0;
      }
      return true;
    });
  }

  // ---------------------------------------------------------------- 渲染

  function chip(label, active, onClick) {
    var b = document.createElement("button");
    b.type = "button";
    b.className = "cn-chip" + (active ? " active" : "");
    b.textContent = label;
    b.addEventListener("click", onClick);
    return b;
  }

  function renderFilters() {
    // 级别
    var lv = $("levelChips");
    lv.innerHTML = "";
    lv.appendChild(chip("全部", S.level === "all", function () { S.level = "all"; reset(); }));
    GRADES.forEach(function (g) {
      var n = (grades()[g] || []).length;
      lv.appendChild(chip(g + " 级 (" + n + ")", S.level === g, function () {
        S.level = g; reset();
        if (typeof Progress !== "undefined") Progress.emit("lv" + g, {});
      }));
    });

    // 笔画
    var st = $("strokeChips");
    st.innerHTML = "";
    [["all", "全部"], ["1-3", "1-3 画"], ["4-6", "4-6 画"], ["7-9", "7-9 画"],
     ["10-12", "10-12 画"], ["13+", "13 画以上"]].forEach(function (p) {
      st.appendChild(chip(p[1], S.stroke === p[0], function () { S.stroke = p[0]; reset(); }));
    });

    // 部首：取当前筛选结果里出现最多的 14 个
    var pool = filtered();
    var cnt = {};
    pool.forEach(function (it) { if (it.r) cnt[it.r] = (cnt[it.r] || 0) + 1; });
    var top = Object.keys(cnt).sort(function (a, b) { return cnt[b] - cnt[a]; }).slice(0, 14);
    var rd = $("radicalChips");
    rd.innerHTML = "";
    rd.appendChild(chip("全部", S.radical === "all", function () { S.radical = "all"; reset(); }));
    top.forEach(function (r) {
      rd.appendChild(chip(r + " (" + cnt[r] + ")", S.radical === r, function () {
        S.radical = r; reset();
      }));
    });

    // 当前选的部首如果不在候选里了，清掉，避免"筛完是空的"
    if (S.radical !== "all" && top.indexOf(S.radical) < 0) {
      S.radical = "all";
      return renderFilters();
    }
  }

  function renderGrid() {
    var list = filtered();
    var host = $("grid");
    host.innerHTML = "";
    $("count").textContent = "共 " + list.length + " 个字" +
      (list.length > S.shown ? "（显示前 " + S.shown + " 个）" : "");

    list.slice(0, S.shown).forEach(function (it) {
      var b = document.createElement("button");
      b.type = "button";
      b.className = "cn-char" +
        (S.current && S.current.c === it.c ? " active" : "") +
        (S.basket.indexOf(it.c) >= 0 ? " inbasket" : "");
      b.textContent = it.c;
      b.title = it.p + " · " + it.s + " 画 · 部首 " + (it.r || "无");
      b.setAttribute("role", "option");
      b.addEventListener("click", function () { showDetail(it); });
      host.appendChild(b);
    });

    var more = $("more");
    more.innerHTML = "";
    if (list.length > S.shown) {
      var b2 = document.createElement("button");
      b2.type = "button";
      b2.className = "btn ghost sm";
      b2.textContent = "显示更多（还有 " + (list.length - S.shown) + " 个）";
      b2.addEventListener("click", function () { S.shown += PAGE; renderGrid(); });
      more.appendChild(b2);
    }
    if (!list.length) {
      host.innerHTML = '<div class="cn-muted" style="grid-column:1/-1;padding:24px;text-align:center">' +
        "没找到。换个拼音或清掉筛选试试。</div>";
    }
  }

  function showDetail(it) {
    S.current = it;
    $("detail").innerHTML =
      '<div class="cn-detail-head">' +
        '<div class="cn-tian"><span>' + esc(it.c) + "</span></div>" +
        '<div class="cn-detail-meta">' +
          '<div class="cn-detail-py">' + esc(it.p || "—") + "</div>" +
          '<div class="cn-detail-sub">' + it.s + " 画 · 部首 " + esc(it.r || "无") +
            " · " + it.g + " 级</div>" +
          '<button type="button" class="btn ghost sm" id="btnAdd" style="margin-top:8px">' +
            (S.basket.indexOf(it.c) >= 0 ? "✓ 已在字帖篮" : "＋ 加入字帖篮") + "</button>" +
        "</div>" +
      "</div>" +
      (it.m ? '<div class="cn-detail-m">' + esc(it.m) + "</div>" : "") +
      '<div class="cn-detail-w"><span class="cn-wlabel">组词</span>' +
        '<div class="cn-words">' +
          (it.w.length ? it.w.map(function (w) {
            return '<span class="cn-word">' + esc(w) + "</span>";
          }).join("") : '<span class="cn-muted">这个词表里暂时没有</span>') +
        "</div></div>";

    var add = $("btnAdd");
    if (add) add.addEventListener("click", function () { toggleBasket(it.c); });
    renderGrid();

    if (typeof Progress !== "undefined") Progress.emit("lookup", {});
  }

  function toggleBasket(c) {
    var i = S.basket.indexOf(c);
    if (i >= 0) S.basket.splice(i, 1);
    else if (S.basket.length < 80) S.basket.push(c);
    renderBasket();
    if (S.current) showDetailNoEmit(S.current);
  }
  function showDetailNoEmit(it) {
    var btn = $("btnAdd");
    if (btn) btn.textContent = S.basket.indexOf(it.c) >= 0 ? "✓ 已在字帖篮" : "＋ 加入字帖篮";
    renderGrid();
  }

  function renderBasket() {
    $("basketCount").textContent = S.basket.length + " 个字";
    var host = $("basketList");
    host.innerHTML = "";
    S.basket.forEach(function (c) {
      var b = document.createElement("button");
      b.type = "button";
      b.className = "cn-basket-item";
      b.textContent = c;
      b.title = "点一下移出";
      b.addEventListener("click", function () { toggleBasket(c); });
      host.appendChild(b);
    });
    $("btnMakeSheet").disabled = S.basket.length === 0;
  }

  // ---------------------------------------------------------------- 字帖

  function makeSheet() {
    if (!S.basket.length) return;
    var perRow = 8;
    var rows = [];
    // 一行一个字：第一格是示范，后面留给练习
    S.basket.forEach(function (c) {
      var cells = ['<div class="cn-cell demo"><span>' + esc(c) + "</span></div>"];
      for (var i = 1; i < perRow; i++) cells.push("<div class='cn-cell'></div>");
      rows.push('<div class="cn-sheet-row">' + cells.join("") + "</div>");
    });
    var today = new Date();
    var date = today.getFullYear() + " 年 " + (today.getMonth() + 1) + " 月 " + today.getDate() + " 日";
    $("sheet").innerHTML =
      '<div class="cn-sheet-title"><span>汉字练习 · 萌学园汉字岛</span><span>' + date + "</span></div>" +
      rows.join("") +
      '<div class="cn-sheet-foot"><span>姓名：____________</span><span>共 ' +
        S.basket.length + " 个字</span></div>";
    $("sheetInfo").textContent = S.basket.length + " 个字 · 每字一行（第一格示范，后面练习）";
    $("sheetOverlay").hidden = false;
    document.body.style.overflow = "hidden";
    if (typeof Progress !== "undefined") Progress.emit("sheet", {});
  }

  function closeSheet() {
    $("sheetOverlay").hidden = true;
    document.body.style.overflow = "";
  }

  // ---------------------------------------------------------------- 进度面板

  function bindModal(btnId, modalId, onOpen) {
    var b = $(btnId), m = $(modalId);
    if (!b || !m) return;
    b.addEventListener("click", function () {
      if (onOpen) onOpen();
      m.classList.add("open");
    });
    m.addEventListener("click", function (ev) {
      if (ev.target === m || ev.target.hasAttribute("data-close")) m.classList.remove("open");
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
      return '<div class="cn-daily' + (d.done ? " got" : "") + '">' +
        '<span class="cn-daily-t">' + esc(d.emoji || "") + " " + esc(d.title) + "</span>" +
        '<span class="cn-daily-n">' + (d.cur || 0) + "/" + d.need + "</span></div>";
    }).join("") : '<div class="cn-muted">今天没有任务</div>';

    var bs = Progress.badges() || [];
    $("pfBadgeCount").textContent = bs.filter(function (b) { return b.got; }).length + " / " + bs.length;
    $("pfBadges").innerHTML = bs.map(function (b) {
      return '<div class="cn-badge' + (b.got ? " got" : "") + '" title="' + esc(b.desc || "") + '">' +
        '<span class="cn-badge-e">' + (b.got ? b.emoji : "🔒") + "</span>" +
        '<span class="cn-badge-t">' + esc(b.title) + "</span></div>";
    }).join("");

    var ms = Progress.medals() || [];
    $("pfMedalCount").textContent = ms.filter(function (m) { return m.got; }).length + " / " + ms.length;
    $("pfMedals").innerHTML = ms.map(function (m) {
      return '<div class="cn-medal' + (m.got ? " got " + (m.tier || "") : "") + '" title="' + esc(m.hint || "") + '">' +
        '<span class="cn-medal-e">' + (m.got ? m.emoji : "🔒") + "</span>" +
        '<span class="cn-medal-t">' + esc(m.title) + "</span></div>";
    }).join("");
  }

  // ---------------------------------------------------------------- 启动

  function reset() {
    S.shown = PAGE;
    renderFilters();
    renderGrid();
  }

  function init() {
    renderBasket();
    bindModal("btnProgress", "progressModal", refreshProgressPanel);
    // 顶栏的「字帖」按钮：**不要**用 bindModal 绑（那样只会显示空白覆盖层）。
    // 它应该直接生成字帖；没选字就给一句明确的提示。
    var bs = $("btnSheet");
    if (bs) {
      bs.addEventListener("click", function () {
        if (!S.basket.length) {
          alert("先在字格里点几个字，加进右边的「字帖篮」，再点「生成字帖」。");
          return;
        }
        makeSheet();
      });
    }

    $("btnMakeSheet").addEventListener("click", makeSheet);
    $("btnPrint").addEventListener("click", function () { window.print(); });
    $("btnCloseSheet").addEventListener("click", closeSheet);
    $("btnClearBasket").addEventListener("click", function () {
      S.basket = []; renderBasket(); renderGrid();
    });
    $("q").addEventListener("input", function (ev) {
      S.q = ev.target.value; S.shown = PAGE; renderFilters(); renderGrid();
    });
    $("btnClear").addEventListener("click", function () {
      $("q").value = ""; S.q = ""; reset();
    });
    document.addEventListener("keydown", function (ev) {
      if (ev.key === "Escape" && !$("sheetOverlay").hidden) closeSheet();
    });

    if (typeof Progress !== "undefined") {
      Progress.init();
      Progress.onChange(function () { refreshProgressPanel(); });
    }
    if (typeof Sync !== "undefined") {
      Sync.init({
        subject: "cn",
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

    $("count").textContent = "正在加载字表…";
    loadGrades().then(function () {
      S.all = flatten();
      S.level = 1;
      // 离线且这份字表还没下载到本地：说清楚原因，别给一个空页面
      if (!S.all.length) {
        $("count").textContent = "字表没加载出来";
        $("grid").innerHTML = '<div class="cn-muted" style="padding:24px 0">' +
          "字表没加载出来。如果是<b>没网</b>，连上网刷新一次就好 —— " +
          "之后这个学科就能离线用了。</div>";
        return;
      }
      reset();
      refreshProgressPanel();
    });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
