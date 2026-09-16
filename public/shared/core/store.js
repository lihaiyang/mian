/* ============================================================================
 * 萌学园 · 存储层（shared/core/store.js）
 *
 * 全平台所有持久化都走这里。为什么不让各学科直接写 localStorage：
 *
 *   1. **命名空间**：键长这样 mian_<命名空间>__<键>。双下划线分隔，
 *      所以命名空间叫 "type" 和 "typing" 不会互相干扰，
 *      也不会撞上老站的 codepanda_* / en_* 键。
 *   2. **配额**：localStorage 写满会抛异常。整个应用挂在一个保存动作上是最蠢的死法，
 *      这里统一 catch 并且只提示一次。
 *   3. **数据损坏**：JSON 解析失败时返回默认值而不是抛异常——
 *      孩子不该因为一条脏数据就打不开网站。
 *   4. **换存储后端**：以后要挪到 IndexedDB，只改这一个文件。
 *
 * 约定：值一律是 JSON 可序列化的。不要往这里塞 File / Blob。
 * ========================================================================== */
(function () {
  "use strict";

  var PREFIX = "mian_";
  var SEP = "__";
  var quotaWarned = false;

  function fullKey(ns, key) {
    return ns ? PREFIX + ns + SEP + key : PREFIX + key;
  }

  function warnQuota(e) {
    if (quotaWarned) return;
    quotaWarned = true;
    console.warn(
      "[Store] 本地存储写满了，这次的数据没能保存。\n" +
      "建议清理一下浏览器数据，或删掉一些旧作品。", e
    );
  }

  function get(ns, key, fallback) {
    try {
      var raw = localStorage.getItem(fullKey(ns, key));
      if (raw === null || raw === undefined) return fallback;
      var v = JSON.parse(raw);
      return v === null || v === undefined ? fallback : v;
    } catch (e) {
      // 数据坏了：返回默认值，并把坏数据留着（别删，万一还能救）
      console.warn("[Store] 读取失败，已返回默认值：" + fullKey(ns, key), e);
      return fallback;
    }
  }

  function set(ns, key, value) {
    try {
      localStorage.setItem(fullKey(ns, key), JSON.stringify(value));
      return true;
    } catch (e) {
      warnQuota(e);
      return false;
    }
  }

  function del(ns, key) {
    try { localStorage.removeItem(fullKey(ns, key)); } catch (e) {}
  }

  /** 列出某个命名空间下所有键（去掉前缀，返回短键名） */
  function keys(ns) {
    var out = [];
    var head = ns ? PREFIX + ns + SEP : PREFIX;
    try {
      for (var i = 0; i < localStorage.length; i++) {
        var k = localStorage.key(i);
        if (k && k.indexOf(head) === 0) {
          // 不带命名空间时，别把带命名空间的键也捞出来
          var rest = k.slice(head.length);
          if (ns || rest.indexOf(SEP) === -1) out.push(rest);
        }
      }
    } catch (e) {}
    return out;
  }

  /** 清空某个命名空间（只清自己的，不碰别人的数据） */
  function clear(ns) {
    if (!ns) {
      console.warn("[Store] 拒绝清空空命名空间——那会把所有学科的数据都删掉");
      return;
    }
    keys(ns).forEach(function (k) { del(ns, k); });
  }

  // 带命名空间的句柄，学科平时用这个
  function ns(name) {
    if (!name) throw new Error("[Store] ns() 需要一个命名空间名字");
    return {
      name: name,
      get: function (k, d) { return get(name, k, d); },
      set: function (k, v) { return set(name, k, v); },
      del: function (k) { return del(name, k); },
      keys: function () { return keys(name); },
      clear: function () { return clear(name); }
    };
  }

  window.Store = {
    ns: ns,
    get: get,
    set: set,
    del: del,
    keys: keys,
    clear: clear,
    PREFIX: PREFIX
  };
})();
