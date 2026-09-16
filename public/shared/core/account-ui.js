/* ============================================================================
 * 萌学园 · 账号与同步面板（全平台共用一份）
 *
 * 为什么要这个文件
 * ---------------------------------------------------------------------------
 * 独立审计查清了一件事：**账号其实早就是统一的** —— Python / 英语 / 打字
 * 三个入口用的是同一个 D1、同一张 `accounts` 表、同一个 `POST /api/account`。
 *
 * 不统一的是**同步层**：三套客户端实现，各读各的 localStorage：
 *
 *   平台层    mian_sync__code / __pin / __rev / __accountId / __nickname
 *   Python    codepanda_cloud_v1  = {code, pin, accountId, rev, hasPin, nickname, avatar, version}
 *   英语      en_cloud            = {code, rev, lastSyncAt, lastPushAt, nick}
 *
 * 所以「统一登录」在客户端这一步就是：**一次登录，把同步码写进三个地方**；
 * 退出时三个地方一起清。孩子只看见一个入口、只记一个码。
 *
 * 这是一个**兼容垫片**，不是终点：各学科的同步引擎仍然各跑各的。
 * 真正把协议也统一掉，是后续的事（见 docs/下一阶段方案.md 第 4 节）。
 * 这样做的好处是低风险 —— 不需要重写 Python 那 1000 行 cloud.js。
 *
 * 它直接打 /api/account，**不依赖 Sync** ——
 * 因为 Python / 英语页不加载 shared/core/sync.js，加载了也不该被它绑住。
 *
 * 用法（任意页面，只要引了 tokens.css + chrome.css + 这个文件）：
 *     AccountUI.open();
 * ========================================================================== */
(function () {
  "use strict";

  var PLAT_NS = "mian_sync__";
  var PY_KEY = "codepanda_cloud_v1";
  var PY_VERSION = 2;               // 必须跟 python/js/cloud.js 的 STATE_VERSION 一致
  var EN_KEY = "en_cloud";

  var overlay = null;

  function esc(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  }
  function readJson(k, d) {
    try { var v = JSON.parse(localStorage.getItem(k) || "null"); return v === null ? d : v; }
    catch (e) { return d; }
  }
  function writeJson(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
  function raw(k) { try { return localStorage.getItem(k) || ""; } catch (e) { return ""; } }

  // 平台层的键：直接用 localStorage 读写，**不经过 window.Store**。
  //
  // 为什么不用 Store：英语站自己也定义了一个 `window.Store`
  // （前缀 en_、签名是 get(key, fallback)），和平台的 Store
  // （前缀 mian_、签名是 get(ns, key, fallback)）完全不是一回事。
  // 认错了会把 "sync" 当成一个 key 去读，拿回一个假值 —— 实测踩过这个坑：
  // 英语站的面板因此误判成「已登录」，直接跳到已登录界面。
  //
  // 平台 Store 的落盘格式就是 JSON.stringify(value)，所以这里直接照着写。
  function platGet(key) { return readJson(PLAT_NS + key, ""); }
  function platSet(key, val) { writeJson(PLAT_NS + key, val); }

  /** 同步码的显示格式：服务端存的是 8 位纯字母数字，连字符只是给人看的
   *  （见 functions/api/_utils.js 的 genCode / normalizeCode）。 */
  function fmtCode(c) {
    c = String(c || "").toUpperCase().replace(/[^0-9A-Z]/g, "");
    return c.length === 8 ? c.slice(0, 4) + "-" + c.slice(4) : c;
  }

  // ---------------------------------------------------------------- 状态

  function status() {
    var code = platGet("code") || "";
    if (!code) {
      var py = readJson(PY_KEY, null);
      if (py && py.code) code = py.code;
    }
    if (!code) {
      var en = readJson(EN_KEY, null);
      if (en && en.code) code = en.code;
    }
    return {
      loggedIn: !!code,
      code: code,
      nickname: platGet("nickname") || "",
      lastAt: Number(platGet("lastAt", 0)) || 0,
      // 各学科分别有没有拿到这个码 —— 面板上要显示，孩子才知道是不是都同步上了
      perSubject: {
        platform: !!platGet("code"),
        python: !!(readJson(PY_KEY, null) || {}).code,
        en: !!(readJson(EN_KEY, null) || {}).code
      }
    };
  }

  /** 一次登录，写进所有学科。
   *  rev 归零：换了账号必须全量重拉，不能拿旧账号的游标做增量。 */
  function applyCode(code, info) {
    info = info || {};
    code = String(code || "").toUpperCase().replace(/[^A-Z0-9]/g, "");

    // 1) 平台层
    platSet("code", code);
    platSet("pin", info.pin || "");
    platSet("accountId", info.accountId || "");
    platSet("nickname", info.nickname || "");
    platSet("rev", 0);

    // 2) Python（形状见 python/js/cloud.js 的 state 默认值）
    writeJson(PY_KEY, {
      code: code,
      pin: info.pin || "",
      accountId: info.accountId || "",
      rev: 0,
      hasPin: !!info.hasPin,
      nickname: info.nickname || "",
      avatar: info.avatar || "",
      version: PY_VERSION
    });

    // 3) 英语（形状见 en/js/cloud.js 的 save()）
    var now = Date.now();
    writeJson(EN_KEY, {
      code: code, rev: 0,
      lastSyncAt: now, lastPushAt: 0,
      nick: info.nickname || ""
    });

    // 让已经活着的学科引擎立刻用上新身份
    nudge();
  }

  /** 退出：三个地方一起清。
   *  只清身份，不动学习数据 —— 本机进度和作品留在原地。 */
  function clear() {
    ["code", "pin", "accountId", "nickname", "rev", "lastAt"].forEach(function (k) { platSet(k, ""); });
    var py = readJson(PY_KEY, null);
    if (py && typeof py === "object") {
      py.code = ""; py.pin = ""; py.accountId = ""; py.rev = 0; py.hasPin = false;
      writeJson(PY_KEY, py);
    } else {
      writeJson(PY_KEY, { code: "", pin: "", accountId: "", rev: 0, hasPin: false, nickname: "", avatar: "", version: PY_VERSION });
    }
    var en = readJson(EN_KEY, null);
    if (en && typeof en === "object") {
      en.code = ""; en.rev = 0;
      writeJson(EN_KEY, en);
    } else {
      writeJson(EN_KEY, { code: "", rev: 0, lastSyncAt: 0, lastPushAt: 0, nick: "" });
    }
    nudge();
  }

  /** 通知页面里活着的同步引擎：身份变了，重新读一次。 */
  function nudge() {
    try {
      if (window.Sync && Sync.onChange) { /* 平台层自己会读 Store，不需要额外动作 */ }
      // 老学科的引擎没有"重新登录"的公开入口，最稳的是让页面自己重载
      // —— 但这会打断孩子。所以这里只广播一个事件，页面愿意听就听。
      window.dispatchEvent(new CustomEvent("mian:account-changed", { detail: status() }));
    } catch (e) {}
  }

  // ---------------------------------------------------------------- 网络

  function api(body) {
    return fetch("/api/account", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body)
    }).then(function (r) {
      return r.json().catch(function () { return { ok: false, error: "服务器返回了看不懂的内容" }; })
        .then(function (d) {
          if (!r.ok || d.ok === false) throw new Error(d.error || ("请求失败（" + r.status + "）"));
          return d;
        });
    });
  }

  // ---------------------------------------------------------------- 界面

  function card(html) {
    if (!overlay) {
      overlay = document.createElement("div");
      overlay.className = "acc-overlay";
      overlay.id = "accOverlay";
      overlay.addEventListener("click", function (ev) { if (ev.target === overlay) close(); });
      document.body.appendChild(overlay);
    }
    overlay.innerHTML = '<div class="acc-card" role="dialog" aria-modal="true" aria-label="账号与云同步">' + html + "</div>";
    overlay.classList.add("open");
    bind();   // innerHTML 换过之后必须重绑按钮（bind 是函数声明，已提升）
    var f = overlay.querySelector("input, button");
    if (f) f.focus();
  }

  function close() { if (overlay) overlay.classList.remove("open"); }

  function fmtTime(ts) {
    if (!ts) return "还没同步过";
    var d = new Date(ts), n = new Date();
    var sameDay = d.toDateString() === n.toDateString();
    var hm = ("0" + d.getHours()).slice(-2) + ":" + ("0" + d.getMinutes()).slice(-2);
    return sameDay ? ("今天 " + hm) : ((d.getMonth() + 1) + " 月 " + d.getDate() + " 日 " + hm);
  }

  function renderMain(msg) {
    var s = status();
    if (!s.loggedIn) return renderLoggedOut(msg);

    var subj = [
      ["大厅 / 键盘岛", s.perSubject.platform],
      ["萌码 Python", s.perSubject.python],
      ["萌语岛", s.perSubject.en]
    ].map(function (p) {
      return '<div class="acc-subj"><span>' + (p[1] ? "✅" : "⬜") + " " + esc(p[0]) + "</span>" +
             '<span class="acc-subj-note">' + (p[1] ? "已接入" : "还没接入") + "</span></div>";
    }).join("");

    card(
      '<div class="acc-title">☁️ 账号与云同步</div>' +
      '<div class="acc-desc">这是你的同步码。在别的设备上输入它，进度就回来了。</div>' +
      '<div class="acc-codebox"><span class="acc-code">' + esc(fmtCode(s.code)) + "</span></div>" +
      '<div class="acc-hint">抄在纸上收好。任何一台设备输入它都能接着学 —— 丢了就找不回来了。</div>' +
      '<div class="acc-sec">各学科的接入情况</div>' + subj +
      '<div class="acc-sec">上次同步</div><div class="acc-muted">' + esc(fmtTime(s.lastAt)) + "</div>" +
      '<div class="acc-msg" data-role="msg">' + esc(msg || "") + "</div>" +
      '<div class="acc-row">' +
        '<button type="button" class="acc-btn" data-act="sync">🔄 立即同步</button>' +
        '<button type="button" class="acc-btn ghost" data-act="out">关闭同步</button>' +
      "</div>" +
      '<div class="acc-hint">关闭只是停止同步，本机的进度和作品不会被删掉。</div>'
    );
  }

  function renderLoggedOut(msg) {
    card(
      '<div class="acc-title">☁️ 账号与云同步</div>' +
      '<div class="acc-desc">开启之后，换一台设备输入同步码就能接着学。' +
      "不收集姓名、手机号，也不用注册。</div>" +
      '<button type="button" class="acc-btn wide" data-act="create">🔑 生成一个同步码</button>' +
      '<div class="acc-sec">已经有同步码了？</div>' +
      '<label class="acc-field"><span>8 位同步码</span>' +
        '<input class="acc-input" id="accCode" maxlength="12" autocapitalize="characters" ' +
        'autocomplete="off" spellcheck="false" placeholder="例如 GH3W-WUFD"></label>' +
      '<label class="acc-field"><span>PIN（设过才填）</span>' +
        '<input class="acc-input" id="accPin" maxlength="6" inputmode="numeric" ' +
        'autocomplete="off" placeholder="4-6 位数字，可不填"></label>' +
      '<button type="button" class="acc-btn ghost wide" data-act="login">🔓 登录并同步</button>' +
      '<div class="acc-msg" data-role="msg">' + esc(msg || "") + "</div>" +
      '<div class="acc-row acc-row-end"><button type="button" class="acc-btn ghost" data-act="close">关闭</button></div>'
    );
  }

  function say(text) {
    var el = overlay && overlay.querySelector('[data-role="msg"]');
    if (el) el.textContent = text || "";
  }

  function busy(on, label) {
    var btns = overlay ? overlay.querySelectorAll(".acc-btn") : [];
    for (var i = 0; i < btns.length; i++) btns[i].disabled = !!on;
    if (on) say(label || "处理中…");
  }

  /** 绑定按钮（每次 render 后都要重绑，因为 innerHTML 被换了） */
  function bind() {
    var acts = {
      close: function () { close(); },
      create: function () {
        busy(true, "正在生成…");
        // 昵称取当前档案名（用得上就用，取不到就算了）
        var nick = "";
        try {
          if (window.Progress && Progress.currentProfile) nick = (Progress.currentProfile() || {}).name || "";
        } catch (e) {}
        api({ action: "create", nickname: nick })
          .then(function (d) {
            applyCode(d.code, { accountId: d.accountId, hasPin: d.hasPin, nickname: nick });
            renderMain("同步码生成好了。抄下来，别的设备就能接着学。");
          })
          .catch(function (e) { busy(false); say("没能生成：" + e.message); });
      },
      login: function () {
        var c = (overlay.querySelector("#accCode") || {}).value || "";
        var pin = (overlay.querySelector("#accPin") || {}).value || "";
        c = c.toUpperCase().replace(/[^A-Z0-9]/g, "");
        if (c.length < 6) { say("同步码看起来不太对，应该是 8 位。"); return; }
        busy(true, "正在登录…");
        api({ action: "login", code: c, pin: pin })
          .then(function (d) {
            applyCode(c, { pin: pin, accountId: d.accountId, nickname: d.nickname, avatar: d.avatar, hasPin: d.hasPin });
            renderMain("登录成功。现在去各个学科看看，进度会自己同步过来。");
          })
          .catch(function (e) { busy(false); say("登录失败：" + e.message); });
      },
      sync: function () {
        busy(true, "正在同步…");
        var done = function () { renderMain("同步完成。"); };
        var fail = function (e) { busy(false); say("同步遇到问题：" + (e && e.message ? e.message : e)); };
        try {
          // 平台层（键盘岛等）有现成的 Sync；老学科各自的引擎由页面自己驱动
          if (window.Sync && Sync.sync) Sync.sync().then(done).catch(fail);
          else done();
        } catch (e) { fail(e); }
      },
      out: function () {
        clear();
        renderLoggedOut("已经关闭同步。本机的进度和作品都还在。");
      }
    };
    if (!overlay) return;
    overlay.querySelectorAll("[data-act]").forEach(function (b) {
      b.addEventListener("click", function () {
        var fn = acts[b.getAttribute("data-act")];
        if (fn) fn();
      });
    });
  }

  function open() {
    var s = status();
    if (s.loggedIn) renderMain(""); else renderLoggedOut("");
  }

  document.addEventListener("keydown", function (ev) {
    if (ev.key === "Escape" && overlay && overlay.classList.contains("open")) close();
  });

  window.AccountUI = {
    open: open, close: close, status: status,
    applyCode: applyCode, clear: clear,
    isLoggedIn: function () { return status().loggedIn; }
  };
})();
