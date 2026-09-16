/* ============================================================================
 * 萌学园 · 云同步（shared/core/sync.js）
 *
 * 通用增量同步：账号级单调 rev + 按行 updated_at 的 LWW + 软删除墓碑。
 * 协议和后端都和老站那两个端点同构，区别是**由学科声明实体**，
 * 所以新学科接同步只需要写两个函数（collect / apply），不用碰协议。
 *
 *   Sync.init({
 *     subject: "typing",
 *     entities: {
 *       progress: {
 *         collect() { return [{ row_id, profile_id, payload_json, updated_at }]; },
 *         apply(rows) { … }
 *       }
 *     }
 *   });
 *
 * 设计取舍（有意为之）：
 *   * **本地是主存储**，没网照常学；联网后增量推送。离线优先是老站验证过的做法。
 *   * 推送时**把当前全量行发上去**（而不是只发"改动过的"）。服务端按
 *     updated_at 做 LWW，所以全量推是安全的；学科的数据量很小（几行到几百行），
 *     换来的是不必维护一套"脏行"追踪——那正是老站反复出 bug 的地方。
 *   * 账号是**匿名同步码**：服务端只存 hash，不收集姓名手机号。
 * ========================================================================== */
(function () {
  "use strict";

  if (typeof Store === "undefined") {
    console.error("[Sync] 依赖 Store，请先加载 shared/core/store.js");
    return;
  }

  var ns = Store.ns("sync");
  var cfg = null;
  var busy = false;
  var timer = null;
  var listeners = [];

  var KEYS = {
    code: "code", pin: "pin", rev: "rev",
    accountId: "accountId", nickname: "nickname", lastAt: "lastAt"
  };

  function emit() {
    listeners.forEach(function (fn) {
      try { fn(state()); } catch (e) { console.warn("[Sync] 监听器出错", e); }
    });
  }

  // ---------------------------------------------------------------- 状态

  function state() {
    return {
      loggedIn: !!ns.get(KEYS.code, ""),
      code: ns.get(KEYS.code, ""),
      nickname: ns.get(KEYS.nickname, ""),
      rev: Number(ns.get(KEYS.rev, 0)) || 0,
      lastAt: Number(ns.get(KEYS.lastAt, 0)) || 0,
      busy: busy,
      online: (typeof navigator === "undefined") ? true : navigator.onLine !== false
    };
  }

  // ---------------------------------------------------------------- 账号

  function api(path, opts) {
    return fetch("/api/v1/sync" + path, opts).then(function (r) {
      return r.json().catch(function () { return { ok: false, error: "服务器返回了看不懂的内容" }; });
    }).catch(function () {
      return { ok: false, error: "网络不通，稍后再试" };
    });
  }

  function createAccount(nickname) {
    return fetch("/api/account", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "create", nickname: nickname || "" })
    }).then(function (r) { return r.json(); }).then(function (d) {
      if (!d || !d.ok) return { ok: false, error: (d && d.error) || "创建失败" };
      ns.set(KEYS.code, d.code);
      ns.set(KEYS.accountId, d.accountId || "");
      ns.set(KEYS.nickname, nickname || "");
      ns.set(KEYS.pin, "");
      ns.set(KEYS.rev, 0);
      emit();
      return { ok: true, code: d.code };
    }).catch(function () {
      return { ok: false, error: "网络不通，稍后再试" };
    });
  }

  function login(code, pin) {
    var clean = String(code || "").toUpperCase().replace(/[^0-9A-Z]/g, "");
    if (clean.length !== 8) return Promise.resolve({ ok: false, error: "同步码是 8 位哦" });
    // 登录也走 /api/account（和 Python 站共用一个实现）
    return fetch("/api/account", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "login", code: clean, pin: pin || "" })
    }).then(function (r) { return r.json(); }).then(function (d) {
      if (!d || !d.ok) return { ok: false, error: (d && d.error) || "登录失败" };
      ns.set(KEYS.code, clean);
      ns.set(KEYS.pin, pin || "");
      ns.set(KEYS.accountId, d.accountId || "");
      ns.set(KEYS.nickname, d.nickname || "");
      ns.set(KEYS.rev, 0);          // 换了账号，rev 必须归零重新全量拉
      emit();
      return { ok: true };
    }).catch(function () {
      return { ok: false, error: "网络不通，稍后再试" };
    });
  }

  function logout() {
    Object.keys(KEYS).forEach(function (k) { ns.del(KEYS[k]); });
    emit();
  }

  // ---------------------------------------------------------------- 收集 / 应用

  function collectProfiles() {
    if (typeof Progress === "undefined") return [];
    return Progress.profiles().map(function (p) {
      return { id: p.id, name: p.name, emoji: p.emoji, updated_at: Date.now() };
    });
  }

  function applyProfiles(rows) {
    if (typeof Progress === "undefined" || !Array.isArray(rows) || !rows.length) return 0;
    var local = Progress.profiles();
    var byId = {};
    local.forEach(function (p) { byId[p.id] = p; });
    var added = 0;
    rows.forEach(function (r) {
      if (!r || r.deleted) return;
      if (byId[r.id]) {
        // 远端更新就更新名字/头像；不切当前档案（那是本机的事）
        if (r.name && r.name !== byId[r.id].name) Progress.updateProfile(r.id, { name: r.name });
      } else {
        // 远端有、本地没有：加进来（换设备时靠这个把档案带过来）
        var list = Progress.profiles();
        if (list.length < 8) {
          list.push({ id: r.id, name: r.name || "小朋友", emoji: r.emoji || "🐼" });
          Store.ns(cfg.subject).set("profiles", list);
          added++;
        }
      }
    });
    return added;
  }

  function entities() { return (cfg && cfg.entities) || {}; }

  // ---------------------------------------------------------------- 拉 / 推

  function pull(silent) {
    var st = state();
    if (!st.loggedIn) return Promise.resolve({ ok: false, error: "还没登录" });
    busy = true; emit();
    var since = st.rev || 0;
    var url = "?subject=" + encodeURIComponent(cfg.subject) +
      "&code=" + encodeURIComponent(st.code) +
      "&pin=" + encodeURIComponent(ns.get(KEYS.pin, "")) +
      "&since=" + since;
    return api(url).then(function (d) {
      busy = false;
      if (!d || !d.ok) { emit(); return { ok: false, error: (d && d.error) || "拉取失败" }; }

      applyProfiles(d.profiles);

      var applied = 0;
      var rows = d.rows || {};
      Object.keys(rows).forEach(function (name) {
        var e = entities()[name];
        if (e && typeof e.apply === "function") {
          try { applied += (e.apply(rows[name]) || 0); }
          catch (err) { console.warn("[Sync] apply(" + name + ") 出错", err); }
        }
      });

      ns.set(KEYS.rev, Number(d.rev) || 0);
      if (d.nickname) ns.set(KEYS.nickname, d.nickname);
      ns.set(KEYS.lastAt, Date.now());
      emit();
      if (!silent) console.info("[Sync] 拉取完成，应用了 " + applied + " 行");
      return { ok: true, applied: applied };
    });
  }

  function push() {
    var st = state();
    if (!st.loggedIn) return Promise.resolve({ ok: false, error: "还没登录" });
    busy = true; emit();

    var payload = { subject: cfg.subject, code: st.code, pin: ns.get(KEYS.pin, ""), rows: {} };
    Object.keys(entities()).forEach(function (name) {
      var e = entities()[name];
      if (e && typeof e.collect === "function") {
        try { payload.rows[name] = e.collect() || []; }
        catch (err) { console.warn("[Sync] collect(" + name + ") 出错", err); payload.rows[name] = []; }
      }
    });
    // 档案只在有本地档案时推（避免把默认档案覆盖上去）
    var profs = collectProfiles();
    if (profs.length) payload.profiles = profs;

    return api("", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    }).then(function (d) {
      busy = false;
      if (!d || !d.ok) { emit(); return { ok: false, error: (d && d.error) || "推送失败" }; }
      ns.set(KEYS.rev, Number(d.rev) || 0);
      ns.set(KEYS.lastAt, Date.now());
      emit();
      return { ok: true };
    });
  }

  /**
   * 一次完整同步：**先推后拉**。
   * 顺序很重要：先推能把本机的新进度送上去，再拉就不会用旧快照把自己盖掉。
   * （老站在这里踩过坑，见 git log 里的"云同步"系列提交。）
   */
  function sync(silent) {
    return push().then(function (r) {
      if (!r.ok) return r;
      return pull(silent);
    });
  }

  // ---------------------------------------------------------------- 自动同步

  function scheduleAuto() {
    if (!state().loggedIn) return;
    if (timer) clearTimeout(timer);
    timer = setTimeout(function () { sync(true); }, 3000);   // 3 秒防抖
  }

  function init(config) {
    cfg = config || {};
    if (!cfg.subject) throw new Error("[Sync] 需要 subject");
    if (typeof Progress !== "undefined" && Progress.onChange) {
      Progress.onChange(scheduleAuto);
    }
    if (typeof window !== "undefined") {
      window.addEventListener("online", function () { sync(true); });
    }
    return Sync;
  }

  var Sync = {
    init: init,
    state: state,
    createAccount: createAccount,
    login: login,
    logout: logout,
    pull: pull,
    push: push,
    sync: sync,
    scheduleAuto: scheduleAuto,
    onChange: function (fn) { if (typeof fn === "function") listeners.push(fn); }
  };

  window.Sync = Sync;
})();
