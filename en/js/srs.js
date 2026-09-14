/**
 * 🗃 SRS —— 记忆盒（Leitner 5 盒）
 * 盒 0：明天见 · 盒 1：2 天后 · 盒 2：4 天后 · 盒 3：7 天后 · 盒 4：15 天后 → 出师
 * 答对往上走一格，答错回到第 1 格（不惩罚，只重排）。
 * 每日复习有上限（默认 20），多出来的顺延到明天 —— 避免"欠债感"把孩子劝退。
 */
const SRS = (() => {
  const BOX_DAYS = [1, 2, 4, 7, 15];
  const MAX_BOX = BOX_DAYS.length;      // = 5 表示已出师
  const DAILY_LIMIT = 20;
  let cache = null;
  let cacheKey = null;

  function pid() {
    if (typeof Progress !== "undefined" && Progress.profileId) return Progress.profileId();
    return Store.get("profile", "p_default");
  }
  function key() { return "srs__" + pid(); }
  function dayNum(ts) { return Math.floor((ts == null ? Date.now() : ts) / 86400000); }

  function load() {
    const k = key();
    if (cache && cacheKey === k) return cache;
    cacheKey = k;
    cache = Store.get(k, {}) || {};
    if (typeof cache !== "object" || Array.isArray(cache)) cache = {};
    return cache;
  }
  function save() { Store.set(key(), cache); }

  function add(itemId, opts) {
    const d = load();
    if (d[itemId] && !d[itemId].deleted) return d[itemId];
    d[itemId] = {
      box: 0, due: dayNum() + BOX_DAYS[0], streak: 0, lapses: 0,
      last: 0, seen: (d[itemId] && d[itemId].seen) || 0,
      updated: Date.now(), deleted: 0
    };
    if (opts && opts.dueToday) d[itemId].due = dayNum();
    save();
    return d[itemId];
  }

  function addMany(ids, opts) { (ids || []).forEach(id => add(id, opts)); }

  function has(itemId) { const d = load(); return !!d[itemId] && !d[itemId].deleted; }

  function due(limit) {
    const d = load();
    const today = dayNum();
    const list = Object.keys(d)
      .filter(id => !d[id].deleted && d[id].due <= today)
      .sort((a, b) => (d[a].due - d[b].due) || (d[a].updated - d[b].updated));
    return list.slice(0, limit == null ? DAILY_LIMIT : limit);
  }

  function answer(itemId, correct) {
    const d = load();
    const it = d[itemId] || add(itemId);
    it.seen = (it.seen || 0) + 1;
    it.last = correct ? 1 : 0;
    it.updated = Date.now();
    if (correct) {
      it.box = Math.min(MAX_BOX, it.box + 1);
      it.streak = (it.streak || 0) + 1;
      it.due = dayNum() + (it.box >= MAX_BOX ? 3650 : BOX_DAYS[it.box]);
    } else {
      it.box = 0;
      it.streak = 0;
      it.lapses = (it.lapses || 0) + 1;
      it.due = dayNum() + BOX_DAYS[0];
    }
    save();
    if (typeof Progress !== "undefined" && Progress.markWord) Progress.markWord(itemId, !!correct);
    return { box: it.box, dueAt: it.due };
  }

  function mark(itemId, box) {
    const d = load();
    const it = d[itemId] || add(itemId);
    it.box = Math.max(0, Math.min(MAX_BOX, box));
    it.due = dayNum() + (it.box >= MAX_BOX ? 3650 : BOX_DAYS[it.box]);
    it.updated = Date.now();
    save();
    return it;
  }

  function remove(itemId) {
    const d = load();
    if (d[itemId]) { d[itemId].deleted = 1; d[itemId].updated = Date.now(); save(); }
  }

  function stats() {
    const d = load();
    const boxes = [0, 0, 0, 0, 0];
    let learned = 0, learning = 0, dueN = 0;
    const today = dayNum();
    for (const id in d) {
      const it = d[id];
      if (it.deleted) continue;
      if (it.box >= MAX_BOX) { learned++; continue; }
      learning++;
      boxes[it.box] = (boxes[it.box] || 0) + 1;
      if (it.due <= today) dueN++;
    }
    return { boxes, due: dueN, learning, learned, total: learned + learning, limit: DAILY_LIMIT };
  }

  function byBox(box) {
    const d = load();
    return Object.keys(d).filter(id => !d[id].deleted && d[id].box === box)
      .sort((a, b) => d[b].updated - d[a].updated);
  }

  function exportRows() {
    const d = load();
    return Object.keys(d).map(id => ({
      item_id: id,
      box: d[id].box,
      due_at: d[id].due,
      streak: d[id].streak || 0,
      lapses: d[id].lapses || 0,
      last_result: d[id].last || 0,
      updated_at: d[id].updated || Date.now(),
      deleted: d[id].deleted ? 1 : 0
    }));
  }

  function importRows(rows) {
    if (!Array.isArray(rows)) return 0;
    const d = load();
    let n = 0;
    rows.forEach(r => {
      if (!r || !r.item_id) return;
      const cur = d[r.item_id];
      if (!cur || (r.updated_at || 0) > (cur.updated || 0)) {
        d[r.item_id] = {
          box: r.box || 0, due: r.due_at || dayNum(), streak: r.streak || 0,
          lapses: r.lapses || 0, last: r.last_result || 0,
          updated: r.updated_at || Date.now(), deleted: r.deleted ? 1 : 0
        };
        n++;
      }
    });
    if (n) save();
    return n;
  }

  function reset() { cache = {}; cacheKey = key(); save(); }

  return { add, addMany, has, due, answer, mark, remove, stats, byBox, exportRows, importRows, reset, BOX_DAYS, MAX_BOX, dayNum };
})();
window.SRS = SRS;
