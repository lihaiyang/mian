/**
 * 💾 Store —— 存储层
 * localStorage（小数据：档案/进度/记忆盒/设置）+ IndexedDB（录音与离线缓存）
 * 约定：所有 key 都带 en_ 前缀；按档案隔离的数据用 en_xxx__<档案id>
 */
const Store = (() => {
  const PREFIX = "en_";
  const DB_NAME = "en_db";
  const DB_VER = 1;
  const STORES = ["en_rec", "en_cache"];

  function get(k, d) {
    try {
      const raw = localStorage.getItem(PREFIX + k);
      if (raw === null) return d;
      return JSON.parse(raw);
    } catch (e) { return d; }
  }

  function set(k, v) {
    try {
      localStorage.setItem(PREFIX + k, JSON.stringify(v));
      return true;
    } catch (e) {
      // localStorage 写满时不要静默丢数据：提示一次
      if (typeof UI !== "undefined" && UI.toast) UI.toast("浏览器存储满了，去「设置」清理一下旧录音吧", "warn");
      return false;
    }
  }

  function del(k) { try { localStorage.removeItem(PREFIX + k); } catch (e) {} }

  function keys() {
    const out = [];
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && k.startsWith(PREFIX)) out.push(k.slice(PREFIX.length));
      }
    } catch (e) {}
    return out;
  }

  function usage() {
    let n = 0;
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && k.startsWith(PREFIX)) n += k.length + (localStorage.getItem(k) || "").length;
      }
    } catch (e) {}
    return n * 2; // UTF-16
  }

  /* ---------------- IndexedDB ---------------- */
  let dbPromise = null;

  function openDB() {
    if (dbPromise) return dbPromise;
    dbPromise = new Promise(resolve => {
      if (!window.indexedDB) { resolve(null); return; }
      let req;
      try { req = indexedDB.open(DB_NAME, DB_VER); } catch (e) { resolve(null); return; }
      req.onupgradeneeded = () => {
        const db = req.result;
        STORES.forEach(s => { if (!db.objectStoreNames.contains(s)) db.createObjectStore(s); });
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => resolve(null);
    });
    return dbPromise;
  }

  async function idb(store, mode, fn) {
    const db = await openDB();
    if (!db) return null;
    return new Promise(resolve => {
      let tx;
      try { tx = db.transaction(store, mode); } catch (e) { resolve(null); return; }
      const os = tx.objectStore(store);
      let result = null;
      try { result = fn(os); } catch (e) { resolve(null); return; }
      tx.oncomplete = () => resolve(result && result.result !== undefined ? result.result : result);
      tx.onerror = () => resolve(null);
      tx.onabort = () => resolve(null);
    });
  }

  async function idbPut(store, key, val) { return idb(store, "readwrite", os => os.put(val, key)); }
  async function idbGet(store, key) { return idb(store, "readonly", os => os.get(key)); }
  async function idbDel(store, key) { return idb(store, "readwrite", os => os.delete(key)); }
  async function idbAll(store) {
    const db = await openDB();
    if (!db) return [];
    return new Promise(resolve => {
      try {
        const tx = db.transaction(store, "readonly");
        const req = tx.objectStore(store).getAll();
        const ks = tx.objectStore(store).getAllKeys();
        tx.oncomplete = () => resolve((req.result || []).map((v, i) => ({ key: ks.result[i], value: v })));
        tx.onerror = () => resolve([]);
      } catch (e) { resolve([]); }
    });
  }
  async function idbClear(store) { return idb(store, "readwrite", os => os.clear()); }

  /** 估算 IndexedDB 占用（字节），用于设置页展示 */
  async function idbUsage() {
    try {
      if (navigator.storage && navigator.storage.estimate) {
        const e = await navigator.storage.estimate();
        return e.usage || 0;
      }
    } catch (err) {}
    return 0;
  }

  return { get, set, del, keys, usage, idbPut, idbGet, idbDel, idbAll, idbClear, idbUsage };
})();
window.Store = Store;
