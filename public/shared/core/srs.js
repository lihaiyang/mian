/* ============================================================================
 * 萌学园 · 记忆盒（跨学科 Leitner）
 *
 * 为什么要有「平台级」的这一个：
 * 英语站自己早有一套 SRS（en/js/srs.js），做得很好 —— 但它只管英语单词。
 * 数学算错的题、汉字认错的字、打字打错的键，都进不了那个盒子。
 * 孩子于是有四个互不相干的"错题本"，而**复习应该是跨学科的一件事**：
 * 今天该复习什么，应该由"什么时候到期"决定，而不是由"在哪个学科"决定。
 *
 * 节奏沿用英语那套（已经验证过、而且不制造"欠债感"）：
 *   盒 0：明天见 · 盒 1：2 天后 · 盒 2：4 天后 · 盒 3：7 天后 · 盒 4：15 天后 → 出师
 *   答对往上走一格，答错回到盒 0（不惩罚，只重排）。
 *   每日上限 20 张，多出来的顺延到明天。
 *
 * 每个学科只管往里**放卡片**，不管什么时候复习：
 *   SRS.add({ subject: "math", id: "g1_add10_003",
 *             front: "3 + 4", back: "7", hint: "把两个数合起来数一数" });
 *
 * 卡片 key 是 `subject:id`，所以不同学科的同名 id 不会撞。
 *
 * 依赖：store.js（命名空间存储）。没有 Progress 也能跑（档案 id 缺省用 p_default）。
 * ========================================================================== */
(function () {
  "use strict";

  var BOX_DAYS = [1, 2, 4, 7, 15];
  var MAX_BOX = BOX_DAYS.length;      // = 5 表示已出师
  var DAILY_LIMIT = 20;
  var GRADUATED_DAYS = 3650;          // 出师之后基本不再出现

  var PREFIX = "mian_srs__items__";
  var cache = null;
  var cacheKey = null;

  // ⚠️ 这里**不经过 `window.Store`**。
  // 英语站自己也定义了一个 `window.Store`（前缀 en_、签名和平台的不是一回事），
  // 而英语页要用这个记忆盒。认错了 Store 会读出一个假值 ——
  // 同一类坑在 account-ui.js 里踩过一次，这里直接避开：
  // 平台 Store 的落盘格式就是 JSON.stringify(value)，照这个格式自己读写即可。
  function storageGet(key, fallback) {
    try {
      var raw = localStorage.getItem(key);
      if (raw === null || raw === undefined) return fallback;
      var v = JSON.parse(raw);
      return (v === null || v === undefined) ? fallback : v;
    } catch (e) { return fallback; }
  }
  function storageSet(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); return true; }
    catch (e) { console.warn("[SRS] 本地存储写满了，这次的记忆盒没保存", e); return false; }
  }

  function pid() {
    try {
      if (typeof Progress !== "undefined" && Progress.profileId) return Progress.profileId();
    } catch (e) {}
    return "p_default";
  }
  function key() { return PREFIX + pid(); }
  function dayNum(ts) { return Math.floor((ts == null ? Date.now() : ts) / 86400000); }

  function load() {
    var k = key();
    if (cache && cacheKey === k) return cache;
    cacheKey = k;
    cache = storageGet(k, {});
    if (typeof cache !== "object" || Array.isArray(cache)) cache = {};
    return cache;
  }
  function save() { storageSet(key(), cache); }

  function kOf(card) { return String(card.subject || "?") + ":" + String(card.id || "?"); }

  /** 往盒子里放一张卡（已存在就不动它的进度） */
  function add(card) {
    if (!card || !card.id) return null;
    var d = load();
    var k = kOf(card);
    var it = d[k];
    if (!it) {
      it = d[k] = {
        // s/i 是"这张卡是谁的"；f/b/h 是展示内容。
        // ⚠️ id 必须存下来：due() 返回的是卡片对象，调用方要拿它去
        // answer()。只存一个复合 key 的话，answer 那边拼不出原始的
        // subject+id（id 里可能带冒号），判完等于没判 —— 实测踩过。
        s: card.subject || "", i: String(card.id), f: card.front || "", b: card.back || "", h: card.hint || "",
        box: 0, due: dayNum() + BOX_DAYS[0], streak: 0, lapses: 0, seen: 0, updated: Date.now()
      };
    } else {
      // 内容可能更新（例如题目文案改了）—— 刷新展示字段，但**不动进度**
      it.f = card.front || it.f;
      it.b = card.back || it.b;
      it.h = card.hint || it.h;
    }
    save();
    return it;
  }

  function addMany(cards) {
    (cards || []).forEach(add);
  }

  function has(subject, id) { return !!load()[subject + ":" + id]; }

  function get(subject, id) { return load()[subject + ":" + id] || null; }

  /** 今天该复习的卡片（按到期时间、再按加入时间排） */
  function due(limit) {
    var d = load(), today = dayNum();
    var keys = Object.keys(d).filter(function (k) { return d[k].due <= today; })
      .sort(function (a, b) { return (d[a].due - d[b].due) || (d[a].updated - d[b].updated); });
    return keys.slice(0, limit == null ? DAILY_LIMIT : limit).map(function (k) {
      var it = d[k];
      // 兼容早期存的卡（那时没存 i 字段）：从复合 key 里剥掉学科前缀还原 id
      var id = it.i;
      if (id == null) {
        var sub = it.s || "";
        id = (sub && k.indexOf(sub + ":") === 0) ? k.slice(sub.length + 1) : k;
      }
      return Object.assign({ key: k, id: id }, it);
    });
  }

  /** 答对 / 答错 */
  function answer(subject, id, correct) {
    var d = load();
    var k = subject + ":" + id;
    var it = d[k];
    if (!it) return null;
    it.seen = (it.seen || 0) + 1;
    it.updated = Date.now();
    if (correct) {
      it.box = Math.min(MAX_BOX, it.box + 1);
      it.streak = (it.streak || 0) + 1;
      it.due = dayNum() + (it.box >= MAX_BOX ? GRADUATED_DAYS : BOX_DAYS[it.box]);
    } else {
      it.box = 0;
      it.streak = 0;
      it.lapses = (it.lapses || 0) + 1;
      it.due = dayNum() + BOX_DAYS[0];
    }
    save();
    return it;
  }

  function remove(subject, id) {
    var d = load();
    delete d[subject + ":" + id];
    save();
  }

  function stats() {
    var d = load(), today = dayNum();
    var total = 0, dueN = 0, graduated = 0, bySubject = {};
    Object.keys(d).forEach(function (k) {
      var it = d[k];
      total++;
      if (it.due <= today) dueN++;
      if (it.box >= MAX_BOX) graduated++;
      var s = it.s || "?";
      bySubject[s] = bySubject[s] || { total: 0, due: 0 };
      bySubject[s].total++;
      if (it.due <= today) bySubject[s].due++;
    });
    return {
      total: total, due: dueN, graduated: graduated,
      learning: total - graduated, bySubject: bySubject, limit: DAILY_LIMIT
    };
  }

  function clear() {
    cache = {};
    save();
  }

  /** 导出/导入：跟着平台云同步走（和其它学科一样是"一行"） */
  function exportJson() { return JSON.stringify(load()); }
  function importJson(text, merge) {
    var remote;
    try { remote = JSON.parse(text); } catch (e) { return 0; }
    if (!remote || typeof remote !== "object") return 0;
    var d = merge ? load() : {};
    var n = 0;
    Object.keys(remote).forEach(function (k) {
      var r = remote[k], cur = d[k];
      // 逐卡 LWW：谁的 updated 新用谁的
      if (!cur || (Number(r.updated) || 0) > (Number(cur.updated) || 0)) {
        d[k] = r; n++;
      }
    });
    cache = d;
    save();
    return n;
  }

  var API = {
    add: add, addMany: addMany, has: has, get: get,
    due: due, answer: answer, remove: remove,
    stats: stats, clear: clear,
    exportJson: exportJson, importJson: importJson,
    BOX_DAYS: BOX_DAYS, MAX_BOX: MAX_BOX, DAILY_LIMIT: DAILY_LIMIT,
    dayNum: dayNum
  };

  // 两个名字指向同一个对象。
  //
  // 为什么要别名：英语站**自己**也有一套 SRS（en/js/srs.js），它挂的就是
  // `window.SRS` —— 而且它在页面里后加载，会把平台这份覆盖掉。
  // 所以英语页要用平台记忆盒时得走 `window.MianSRS`，
  // 这样它自己那套单词记忆盒和跨学科复习页可以同时存在、互不干扰。
  window.SRS = API;
  window.MianSRS = API;
})();
