/* ============================================================================
 * 萌学园 · 成长内核（shared/core/progress.js）
 *
 * 这一层负责**所有学科都一样**的那部分：档案、经验等级、连续打卡、
 * 每日任务、徽章、奖牌、闯关任务、变更通知、导出/导入（给云同步用）。
 *
 * 学科**不写这段代码**，只写一份声明：
 *
 *   Progress.define("typing", {
 *     events:  { finish: { xp: 20, counters: ["sessions"] },
 *                perfect:{ xp: 15, counters: ["perfect"], when: e => e.acc >= 100 } },
 *     badges:  [{ id:"t_speed40", emoji:"⚡", title:"闪电手", when: s => s.bestWpm >= 40 }],
 *     medals:  [...], missions: [...], daily: [...]
 *   });
 *   Progress.emit("finish", { acc: 100, wpm: 45 });
 *
 * 这套东西在萌码 Python（60KB progress.js）和萌语岛（33KB）里各写了一遍，
 * 加五个学科就会变成五遍——所以抽到这里，学科只留声明。
 *
 * 不能直接抄老站实现的原因：两边的等级曲线、徽章定义、每日任务池都不一样，
 * 这里取的是两者的**公共形状**（xp / counters / days / badges / medals /
 * missions / daily / streak / updated），学科差异全部由声明补足。
 * ========================================================================== */
(function () {
  "use strict";

  if (typeof Store === "undefined") {
    console.error("[Progress] 依赖 Store，请先加载 shared/core/store.js");
    return;
  }

  // ---------------------------------------------------------------- 配置

  var MAX_LEVEL = 30;
  var LEVEL_TITLES = [
    "初来乍到", "好奇宝宝", "小小新手", "认真练习", "渐入佳境",
    "熟练学徒", "稳扎稳打", "小有心法", "得心应手", "游刃有余",
    "高手在民间", "炉火纯青", "融会贯通", "独当一面", "小老师",
    "举一反三", "技高一筹", "出神入化", "深藏不露", "登堂入室",
    "一日千里", "心领神会", "信手拈来", "登峰造极", "一代宗师",
    "传说开端", "难逢对手", "孤独求败", "超凡入圣", "学海无涯"
  ];

  var DAILY_COUNT = 3;        // 每天几条任务
  var HISTORY_DAYS = 400;     // days 最多保留多少天，防止无限增长

  var def = null;             // 学科声明
  var ns = null;              // 存储命名空间
  var cache = null;           // 当前档案的 stats 缓存
  var cacheKey = null;
  var cacheSig = "";          // 缓存内容的签名，用来判断 save() 是不是真改了东西
  var listeners = [];

  // ---------------------------------------------------------------- 基础

  function today() {
    var d = new Date();
    return d.getFullYear() + "-" +
      String(d.getMonth() + 1).padStart(2, "0") + "-" +
      String(d.getDate()).padStart(2, "0");
  }

  function dayBefore(dateStr) {
    var p = dateStr.split("-");
    var d = new Date(Number(p[0]), Number(p[1]) - 1, Number(p[2]));
    d.setDate(d.getDate() - 1);
    return d.getFullYear() + "-" +
      String(d.getMonth() + 1).padStart(2, "0") + "-" +
      String(d.getDate()).padStart(2, "0");
  }

  function now() { return Date.now(); }

  function emitChange() {
    listeners.forEach(function (fn) {
      try { fn(); } catch (e) { console.warn("[Progress] onChange 回调出错", e); }
    });
  }

  // ---------------------------------------------------------------- 档案

  function profiles() {
    var list = ns.get("profiles", null);
    if (!Array.isArray(list) || !list.length) {
      list = [{ id: "p_default", name: "小朋友", emoji: "🐼" }];
      ns.set("profiles", list);
      ns.set("profile", list[0].id);
    }
    return list;
  }

  function profileId() {
    var cur = ns.get("profile", null);
    var list = profiles();
    if (!cur || !list.some(function (p) { return p.id === cur; })) {
      cur = list[0].id;
      ns.set("profile", cur);
    }
    return cur;
  }

  function currentProfile() {
    var id = profileId();
    return profiles().filter(function (p) { return p.id === id; })[0] || null;
  }

  function switchProfile(id) {
    if (!profiles().some(function (p) { return p.id === id; })) return false;
    ns.set("profile", id);
    cache = null; cacheKey = null; cacheSig = "";
    emitChange();
    return true;
  }

  function addProfile(name, emoji) {
    var list = profiles();
    if (list.length >= 8) return null;          // 一个账号最多 8 个小伙伴
    var p = {
      id: "p_" + Math.random().toString(36).slice(2, 9),
      name: String(name || "小朋友").slice(0, 12),
      emoji: emoji || "🐼"
    };
    list.push(p);
    ns.set("profiles", list);
    emitChange();
    return p;
  }

  function updateProfile(id, patch) {
    var list = profiles();
    var p = list.filter(function (x) { return x.id === id; })[0];
    if (!p) return false;
    Object.assign(p, patch);
    ns.set("profiles", list);
    emitChange();
    return true;
  }

  // ---------------------------------------------------------------- stats 读写

  function emptyStats() {
    return {
      xp: 0,
      counters: {},
      days: {},
      streak: { cur: 0, best: 0, last: "" },
      badges: [],
      medals: [],
      missions: {},
      daily: { date: "", done: {} },
      best: {},                 // 学科自报的最好成绩，例如 { wpm: 45 }
      updated: 0,
      syncedAt: 0
    };
  }

  function statsKey() { return "stats__" + profileId(); }

  /** 内容签名：判断「这次保存是不是真的改了东西」。
   *  刻意**不含** updated / syncedAt —— 那两个是同步元数据，不是学习内容。 */
  function contentSig(s) {
    return JSON.stringify([
      s.xp, s.counters, s.days, s.streak, s.badges,
      s.medals, s.missions, s.daily, s.best
    ]);
  }

  function load() {
    var k = statsKey();
    if (cache && cacheKey === k) return cache;
    cacheKey = k;
    var s = ns.get(k, null);
    cache = normalize(s);
    cacheSig = contentSig(cache);
    return cache;
  }

  /** 老数据 / 脏数据兜底：补齐缺失字段，绝不让页面因为一条脏数据打不开 */
  function normalize(s) {
    var base = emptyStats();
    if (!s || typeof s !== "object") return base;
    base.xp = Math.max(0, Number(s.xp) || 0);
    base.counters = (s.counters && typeof s.counters === "object") ? s.counters : {};
    base.days = (s.days && typeof s.days === "object") ? s.days : {};
    base.best = (s.best && typeof s.best === "object") ? s.best : {};
    base.badges = Array.isArray(s.badges) ? s.badges : [];
    base.medals = Array.isArray(s.medals) ? s.medals : [];
    base.missions = (s.missions && typeof s.missions === "object") ? s.missions : {};
    base.streak = Object.assign({ cur: 0, best: 0, last: "" }, s.streak || {});
    base.daily = Object.assign({ date: "", done: {} }, s.daily || {});
    base.updated = Number(s.updated) || 0;
    base.syncedAt = Number(s.syncedAt) || 0;
    return base;
  }

  /**
   * 保存。**只有内容真的变了才推进 updated** —— 这是丢数据 bug 的修复，别再改回去。
   *
   * 原来的写法是无条件 `s.updated = now()`。而页面一加载就会 save() 一次
   * （初始化 / 补齐默认字段），于是 importRow 的守卫 `stamp < cur.updated`
   * 会把**所有**云端行判成「比本地旧」而拒绝。结果：
   *   · 跨设备恢复永远不生效（换了设备看着像"进度全没了"）
   *   · 更糟的是紧接着的一次推送会拿本地的空进度、以"更新的时间戳"
   *     覆盖云端（服务端是行级 LWW，照收不误）—— 真的丢数据
   *
   * opts.keepUpdated —— 导入远端数据时用。解码/合并本身不是「本地编辑」，
   * 不能推进 updated，否则下一次远端更新又会被判成旧的。
   */
  function save(s, opts) {
    opts = opts || {};
    var sig = contentSig(s);
    if (!opts.keepUpdated && (sig !== cacheSig || opts.force)) {
      s.updated = now();
    }
    cacheSig = sig;
    ns.set(statsKey(), s);
    cache = s;
    cacheKey = statsKey();
  }

  // ---------------------------------------------------------------- 等级

  function levelNeed(level) {
    // 升到 level 级需要多少经验（level 从 2 起算）
    return 100 + (level - 2) * 60;
  }

  function levelInfo(xp) {
    var level = 1, rest = Math.max(0, Number(xp) || 0);
    while (level < MAX_LEVEL && rest >= levelNeed(level + 1)) {
      rest -= levelNeed(level + 1);
      level++;
    }
    var need = level >= MAX_LEVEL ? 0 : levelNeed(level + 1);
    return {
      level: level,
      title: LEVEL_TITLES[level - 1] || LEVEL_TITLES[0],
      xp: Math.max(0, Number(xp) || 0),
      cur: rest,
      need: need,
      percent: need ? Math.min(100, Math.round(rest / need * 100)) : 100,
      isMax: level >= MAX_LEVEL
    };
  }

  // ---------------------------------------------------------------- 打卡

  function touchDay(s, dateStr) {
    var d = s.days[dateStr] || { xp: 0, n: 0 };
    d.n = (d.n || 0) + 1;
    s.days[dateStr] = d;

    // 连续打卡：昨天也来过就 +1，否则从 1 重新算
    if (s.streak.last === dateStr) {
      // 今天已经算过
    } else if (s.streak.last === dayBefore(dateStr)) {
      s.streak.cur = (s.streak.cur || 0) + 1;
      s.streak.last = dateStr;
    } else {
      s.streak.cur = 1;
      s.streak.last = dateStr;
    }
    if (s.streak.cur > (s.streak.best || 0)) s.streak.best = s.streak.cur;

    // 修剪历史，别让它无限增长（localStorage 只有几 MB）
    var all = Object.keys(s.days);
    if (all.length > HISTORY_DAYS) {
      all.sort();
      all.slice(0, all.length - HISTORY_DAYS).forEach(function (k) { delete s.days[k]; });
    }
  }

  // ---------------------------------------------------------------- 每日任务

  /** 用日期做种子挑任务：同一天所有人拿到同一组，刷新也不会变 */
  function seededPick(list, count, seedStr) {
    var seed = 0;
    for (var i = 0; i < seedStr.length; i++) seed = (seed * 31 + seedStr.charCodeAt(i)) >>> 0;
    var pool = list.slice();
    var out = [];
    while (out.length < count && pool.length) {
      seed = (seed * 1103515245 + 12345) >>> 0;
      out.push(pool.splice(seed % pool.length, 1)[0]);
    }
    return out;
  }

  function rollDaily(s) {
    var t = today();
    if (!s.daily || s.daily.date === t) return s.daily;
    var pool = (def && def.daily) || [];
    s.daily = {
      date: t,
      done: {},
      items: seededPick(pool, Math.min(DAILY_COUNT, pool.length), t).map(function (d) { return d.id; })
    };
    return s.daily;
  }

  function daily() {
    var s = load();
    var d = rollDaily(s);
    var pool = (def && def.daily) || [];
    return (d.items || []).map(function (id) {
      var item = pool.filter(function (x) { return x.id === id; })[0];
      if (!item) return null;
      return {
        id: item.id, emoji: item.emoji, title: item.title,
        need: item.need, key: item.key, xp: item.xp,
        got: !!d.done[item.id]
      };
    }).filter(Boolean);
  }

  function dailyProgress(item, s) {
    if (!item) return 0;
    var c = (s.counters || {})[item.key] || 0;
    var base = (s.daily && s.daily.base && s.daily.base[item.key]) || 0;
    return Math.max(0, c - base);
  }

  function claimDaily(id) {
    var s = load();
    var item = daily().filter(function (x) { return x.id === id; })[0];
    if (!item || item.got) return null;
    if (dailyProgress(item, s) < item.need) return null;
    s.daily.done[id] = true;
    var gained = item.xp || 0;
    s.xp += gained;
    save(s);
    var rewards = checkRewards(s);
    emitChange();
    return { xp: gained, rewards: rewards };
  }

  // ---------------------------------------------------------------- 判定

  function countersView(s) {
    // 给学科写的 when(stats) 用的一份"好看"的视图：
    // 既有原始计数器，也有常用派生值（等级、打卡、最好成绩）
    var info = levelInfo(s.xp);
    return Object.assign({}, s.counters, s.best, {
      xp: s.xp,
      level: info.level,
      streak: s.streak.cur,
      bestStreak: s.streak.best,
      days: Object.keys(s.days).length,
      badgeCount: s.badges.length,
      medalCount: s.medals.length
    });
  }

  function safeWhen(when, view) {
    if (typeof when !== "function") return false;
    try { return !!when(view); } catch (e) { return false; }
  }

  /** 每次数据变化后跑一遍：谁该发徽章、谁该发奖牌、哪个任务完成了 */
  function checkRewards(s) {
    var view = countersView(s);
    var newBadges = [], newMedals = [], newMissions = [];

    ((def && def.badges) || []).forEach(function (b) {
      if (s.badges.indexOf(b.id) === -1 && safeWhen(b.when, view)) {
        s.badges.push(b.id);
        newBadges.push(b);
      }
    });

    ((def && def.medals) || []).forEach(function (m) {
      if (s.medals.indexOf(m.id) === -1 && safeWhen(m.when, view)) {
        s.medals.push(m.id);
        newMedals.push(m);
      }
    });

    ((def && def.missions) || []).forEach(function (m) {
      if (!s.missions[m.id] && safeWhen(m.when, view)) {
        s.missions[m.id] = true;
        if (m.xp) s.xp += m.xp;
        newMissions.push(m);
      }
    });

    return { newBadges: newBadges, newMedals: newMedals, newMissions: newMissions };
  }

  // ---------------------------------------------------------------- 记录事件

  /**
   * 学科的主要入口。name 必须在 define() 的 events 里声明过，
   * 没声明就直接忽略（并且只在控制台提示一次），避免打错字静默生效。
   */
  var warnedEvents = {};
  function emit(name, ctx) {
    if (!def) { console.warn("[Progress] 还没 define() 就 emit()"); return null; }
    var ev = (def.events || {})[name];
    if (!ev) {
      if (!warnedEvents[name]) {
        warnedEvents[name] = true;
        console.warn("[Progress] 未声明的事件：" + name + "（已忽略）");
      }
      return null;
    }
    ctx = ctx || {};
    if (ev.when && !safeWhen(ev.when, ctx)) return null;

    var s = load();
    var xp = Number(ev.xp) || 0;
    s.xp += xp;
    (ev.counters || []).forEach(function (c) {
      s.counters[c] = (s.counters[c] || 0) + 1;
    });
    // add: 把上下文里的**数量**累加进计数器（不是 +1）。
    // 例如打字要累计打过的字符数：add: { chars: "chars" }
    if (ev.add && typeof ev.add === "object") {
      Object.keys(ev.add).forEach(function (c) {
        var amount = Number(ctx[ev.add[c]]) || 0;
        if (amount > 0) s.counters[c] = (s.counters[c] || 0) + amount;
      });
    }

    var t = today();
    s.days[t] = s.days[t] || { xp: 0, n: 0 };
    s.days[t].xp += xp;
    touchDay(s, t);
    rollDaily(s);

    save(s);
    var rewards = checkRewards(s);
    if (rewards.newBadges.length || rewards.newMedals.length || rewards.newMissions.length) save(s);
    emitChange();

    return {
      xp: xp,
      levelInfo: levelInfo(s.xp),
      newBadges: rewards.newBadges,
      newMedals: rewards.newMedals,
      newMissions: rewards.newMissions
    };
  }

  /** 学科自报的最好成绩（打字的最快速度之类），会参与徽章判定 */
  function recordBest(key, value, higherIsBetter) {
    var s = load();
    var cur = s.best[key];
    var better = cur === undefined ||
      (higherIsBetter === false ? value < cur : value > cur);
    if (!better) return false;
    s.best[key] = value;
    save(s);
    var rewards = checkRewards(s);
    if (rewards.newBadges.length || rewards.newMedals.length) save(s);
    emitChange();
    return true;
  }

  // ---------------------------------------------------------------- 查询

  function viewBadges() {
    var s = load();
    return ((def && def.badges) || []).map(function (b) {
      return {
        id: b.id, emoji: b.emoji, title: b.title, desc: b.desc, cat: b.cat,
        got: s.badges.indexOf(b.id) !== -1
      };
    });
  }

  function viewMedals() {
    var s = load();
    return ((def && def.medals) || []).map(function (m) {
      return {
        id: m.id, emoji: m.emoji, title: m.title, desc: m.desc, tier: m.tier,
        got: s.medals.indexOf(m.id) !== -1
      };
    });
  }

  function viewMissions() {
    var s = load();
    return ((def && def.missions) || []).map(function (m) {
      return {
        id: m.id, emoji: m.emoji, title: m.title, hint: m.hint,
        done: !!s.missions[m.id]
      };
    });
  }

  function viewDays() {
    var s = load();
    return Object.keys(s.days).sort().map(function (d) {
      return { date: d, xp: s.days[d].xp || 0, n: s.days[d].n || 0 };
    });
  }

  // ---------------------------------------------------------------- 云同步接口

  function exportRow() {
    var s = load();
    // 这里**不能**回退成 now()。
    // 如果本地从没改过（updated 还是 0），推上去的时间戳必须保持 0，
    // 服务端 LWW 才不会用这份空进度覆盖云端已有的真实进度。
    // 原来的 `s.updated || now()` 会让「新设备一登录」就把云端进度清零 ——
    // 因为 sync() 是先推后拉。
    return { stats_json: JSON.stringify(s), updated_at: Number(s.updated) || 0 };
  }

  function importRow(row) {
    if (!row || !row.stats_json) return false;
    var remote;
    try { remote = JSON.parse(row.stats_json); } catch (e) { return false; }
    var stamp = Number(row.updated_at) || 0;
    var cur = load();
    // 用"上次合并过的云端版本"去重（不能比 cur.updated：空档案一加载就会写一次）
    if (stamp && cur.syncedAt === stamp) return false;
    if (stamp && cur.updated && stamp < cur.updated) return false;

    var merged = normalize(remote);
    // 徽章/奖牌取并集，绝不用远端覆盖掉本地的（宁可多留，不可丢）
    merged.badges = Array.from(new Set(cur.badges.concat(merged.badges)));
    merged.medals = Array.from(new Set(cur.medals.concat(merged.medals)));
    merged.missions = Object.assign({}, cur.missions, merged.missions);
    merged.syncedAt = stamp;
    // 导入不是「本地编辑」：updated 取两边较大的那个，并用 keepUpdated
    // 阻止 save() 把它刷成 now()。否则下一次远端更新会被
    // `stamp < cur.updated` 判成旧的而拒绝。
    merged.updated = Math.max(cur.updated || 0, Number(remote.updated) || 0);
    save(merged, { keepUpdated: true });
    emitChange();
    return true;
  }

  function reset() {
    ns.del(statsKey());
    cache = null; cacheKey = null; cacheSig = "";
    emitChange();
  }

  // ---------------------------------------------------------------- 定义与初始化

  function define(subjectId, spec) {
    def = Object.assign({ events: {}, badges: [], medals: [], missions: [], daily: [] }, spec || {});
    ns = Store.ns(subjectId);
    return Progress;
  }

  function init() {
    if (!def) { console.warn("[Progress] init() 之前要先 define()"); return; }
    var s = load();
    // ⚠️ 这里必须 keepUpdated。
    // rollDaily() 是「按本地日期算出来的派生状态」——每台设备都会自己算一遍，
    // 不是孩子的成就。如果这里推进 updated，那么「打开一次页面」就会让本地
    // 看起来比云端新，于是 importRow 把云端进度全部拒绝，紧接着一次推送
    // 再把云端覆盖成空。空档案第一次打开时 daily.date 从 "" 变成今天，
    // 正好会踩中这条路径。
    rollDaily(s);
    save(s, { keepUpdated: true });
    emitChange();
  }

  var Progress = {
    define: define,
    init: init,

    // 档案
    profiles: profiles,
    profileId: profileId,
    currentProfile: currentProfile,
    switchProfile: switchProfile,
    addProfile: addProfile,
    updateProfile: updateProfile,

    // 记录
    emit: emit,
    recordBest: recordBest,

    // 查询
    stats: load,
    counters: function () { return countersView(load()); },
    levelInfo: function () { return levelInfo(load().xp); },
    level: function () { return levelInfo(load().xp).level; },
    streak: function () { return load().streak; },
    daily: daily,
    claimDaily: claimDaily,
    missions: viewMissions,
    badges: viewBadges,
    medals: viewMedals,
    days: viewDays,

    // 同步 / 生命周期
    exportRow: exportRow,
    importRow: importRow,
    reset: reset,
    onChange: function (fn) { if (typeof fn === "function") listeners.push(fn); },

    MAX_LEVEL: MAX_LEVEL,
    levelInfoOf: levelInfo,
    today: today
  };

  window.Progress = Progress;
})();
