/* ============================================================================
 * 今日复习 · 逻辑
 *
 * 一张卡一张卡地过，**不管它来自哪个学科**。
 * 排序只按"什么时候到期"，不按学科 —— 这正是把记忆盒做成平台级的意义。
 *
 * 卡片由各学科自己放进来（SRS.add）。这个页面只负责：拿出来、问、判、放回去。
 * ========================================================================== */
(function () {
  "use strict";

  var SUBJECT_NAME = {
    math: "🔢 数学岛",
    en: "🌴 萌语岛",
    typing: "⌨️ 键盘岛",
    cn: "📖 汉字岛",
    python: "🐼 萌码 Python",
    srs: "🔁 复习"
  };

  var S = { queue: [], idx: 0, done: 0, right: 0 };

  function $(id) { return document.getElementById(id); }
  function esc(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  }

  function renderSummary() {
    var st = (typeof SRS !== "undefined") ? SRS.stats() : { total: 0, due: 0, bySubject: {} };
    $("sumDue").textContent = st.due;
    $("sumTotal").textContent = st.total;
    $("sumDone").textContent = S.done;

    var keys = Object.keys(st.bySubject || {});
    $("bySubject").innerHTML = keys.length ? keys.map(function (k) {
      var v = st.bySubject[k];
      return '<span class="rv-chip">' + esc(SUBJECT_NAME[k] || k) +
        " <b>" + v.due + "</b>/" + v.total + "</span>";
    }).join("") : "";
  }

  function showCard() {
    var c = S.queue[S.idx];
    if (!c) return finish();

    $("cardBox").hidden = false;
    $("doneBox").hidden = true;
    $("cardFrom").textContent = SUBJECT_NAME[c.s] || c.s || "复习";
    $("cardFront").textContent = c.f || "（这张卡没有正面内容）";
    $("cardAnswer").textContent = c.b || "—";
    $("cardHint").textContent = c.h || "";
    $("cardBack").hidden = true;
    $("actionsFront").hidden = false;
    $("actionsBack").hidden = true;

    $("qCount").textContent = (S.idx + 1) + " / " + S.queue.length;
    $("barFill").style.width = Math.round((S.idx / Math.max(1, S.queue.length)) * 100) + "%";
  }

  function reveal() {
    $("cardBack").hidden = false;
    $("actionsFront").hidden = true;
    $("actionsBack").hidden = false;
    $("btnYes").focus();
  }

  function judge(ok) {
    var c = S.queue[S.idx];
    if (!c) return;
    if (typeof SRS !== "undefined") SRS.answer(c.s, c.id, ok);
    S.done++;
    if (ok) S.right++;
    renderSummary();
    S.idx++;
    if (S.idx >= S.queue.length) return finish();
    showCard();
  }

  function finish() {
    $("cardBox").hidden = true;
    $("doneBox").hidden = false;
    var st = (typeof SRS !== "undefined") ? SRS.stats() : { total: 0, due: 0 };
    $("barFill").style.width = "100%";

    if (S.done > 0) {
      $("doneIco").textContent = S.right === S.done ? "🌟" : "👍";
      $("doneTitle").textContent = "复习完了 " + S.done + " 张";
      $("doneSub").textContent = "记住了 " + S.right + " 张，另外 " + (S.done - S.right) +
        " 张过一两天还会回来。" + (st.due > 0 ? "盒子里还有 " + st.due + " 张到期了，明天再来吧。" : "");
    } else {
      $("doneIco").textContent = "🎉";
      $("doneTitle").textContent = "今天没有要复习的";
      $("doneSub").textContent = st.total
        ? "盒子里有 " + st.total + " 张卡，都还没到期。到期了它们会自己回来找你。"
        : "去各个学科做题，做错的会自动进这里的盒子。隔一天、两天、四天……它会自己回来找你。";
    }
    renderSummary();
  }

  function init() {
    S.queue = (typeof SRS !== "undefined") ? SRS.due() : [];
    renderSummary();

    $("btnShow").addEventListener("click", reveal);
    $("btnYes").addEventListener("click", function () { judge(true); });
    $("btnNo").addEventListener("click", function () { judge(false); });
    // 键盘也能操作：空格/回车看答案，1 = 再想想，2 = 记住了
    document.addEventListener("keydown", function (ev) {
      if ($("cardBox").hidden) return;
      var backShown = !$("cardBack").hidden;
      if ((ev.key === " " || ev.key === "Enter") && !backShown) {
        ev.preventDefault();
        reveal();
      } else if (backShown) {
        if (ev.key === "1") judge(false);
        if (ev.key === "2") judge(true);
      }
    });

    // 这一页**不初始化 Progress**：它不是学科，没有 define 过，
    // init() 只会打一条"init() 之前要先 define()"的警告。
    // 记忆盒自己的进度（盒号、到期日）由 SRS 管，和学科的 XP 体系是两回事。
    if (typeof Sync !== "undefined") {
      Sync.init({
        subject: "srs",
        entities: {
          cards: {
            collect: function () {
              return [{
                row_id: "cards__" + (Progress && Progress.profileId ? Progress.profileId() : "p_default"),
                profile_id: (Progress && Progress.profileId) ? Progress.profileId() : "p_default",
                payload_json: SRS.exportJson(),
                updated_at: Date.now()
              }];
            },
            apply: function (rows) {
              var n = 0;
              (rows || []).forEach(function (r) {
                if (r.deleted || !r.payload_json) return;
                n += SRS.importJson(r.payload_json, true);
              });
              if (n) { S.queue = SRS.due(); renderSummary(); }
              return n;
            }
          }
        }
      });
    }

    if (S.queue.length) showCard(); else finish();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
