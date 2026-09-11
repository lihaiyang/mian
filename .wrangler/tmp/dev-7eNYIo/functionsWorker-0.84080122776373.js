var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

// .wrangler/tmp/pages-AxBpkw/functionsWorker-0.84080122776373.mjs
var __defProp2 = Object.defineProperty;
var __name2 = /* @__PURE__ */ __name((target, value) => __defProp2(target, "name", { value, configurable: true }), "__name");
function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store"
    }
  });
}
__name(json, "json");
__name2(json, "json");
function bad(msg, status = 400) {
  return json({ ok: false, error: msg }, status);
}
__name(bad, "bad");
__name2(bad, "bad");
async function sha256Hex(text) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");
}
__name(sha256Hex, "sha256Hex");
__name2(sha256Hex, "sha256Hex");
var ALPHABET = "23456789ABCDEFGHJKMNPQRSTUVWXYZ";
function genCode(len = 8) {
  const rnd = new Uint8Array(len);
  crypto.getRandomValues(rnd);
  let s = "";
  for (let i = 0; i < len; i++) s += ALPHABET[rnd[i] % ALPHABET.length];
  return s.slice(0, 4) + "-" + s.slice(4);
}
__name(genCode, "genCode");
__name2(genCode, "genCode");
function normalizeCode(input) {
  return String(input || "").toUpperCase().replace(/[^0-9A-Z]/g, "");
}
__name(normalizeCode, "normalizeCode");
__name2(normalizeCode, "normalizeCode");
function pepperOf(env) {
  return env.CODE_PEPPER || "mian-dev-pepper";
}
__name(pepperOf, "pepperOf");
__name2(pepperOf, "pepperOf");
async function rateLimit(db, key, limit, windowSec) {
  const now = Math.floor(Date.now() / 1e3);
  const w = now - now % windowSec;
  try {
    await db.prepare(
      "INSERT INTO rate (k, w, n) VALUES (?, ?, 1) ON CONFLICT(k, w) DO UPDATE SET n = n + 1"
    ).bind(key, w).run();
    const row = await db.prepare("SELECT n FROM rate WHERE k = ? AND w = ?").bind(key, w).first();
    return (row && row.n ? row.n : 1) <= limit;
  } catch (e) {
    return true;
  }
}
__name(rateLimit, "rateLimit");
__name2(rateLimit, "rateLimit");
async function authAccount(db, env, code, pin) {
  const clean = normalizeCode(code);
  if (clean.length < 8) return { error: "\u540C\u6B65\u7801\u662F 8 \u4F4D\uFF0C\u68C0\u67E5\u4E00\u4E0B\u6709\u6CA1\u6709\u6284\u6F0F" };
  const hash = await sha256Hex(clean + "|" + pepperOf(env));
  const acc = await db.prepare("SELECT * FROM accounts WHERE code_hash = ?").bind(hash).first();
  if (!acc) return { error: "\u627E\u4E0D\u5230\u8FD9\u4E2A\u540C\u6B65\u7801\uFF0C\u68C0\u67E5\u4E00\u4E0B\u6709\u6CA1\u6709\u6284\u9519" };
  if (acc.pin_hash) {
    const ph = await sha256Hex(String(pin || "") + "|" + acc.id + "|" + pepperOf(env));
    if (ph !== acc.pin_hash) return { error: "PIN \u4E0D\u5BF9\u54E6" };
  }
  return { account: acc };
}
__name(authAccount, "authAccount");
__name2(authAccount, "authAccount");
function nowSec() {
  return Math.floor(Date.now() / 1e3);
}
__name(nowSec, "nowSec");
__name2(nowSec, "nowSec");
function clientIp(request) {
  return request.headers.get("cf-connecting-ip") || "local";
}
__name(clientIp, "clientIp");
__name2(clientIp, "clientIp");
async function onRequestPost({ request, env }) {
  const db = env.DB;
  if (!db) return bad("\u670D\u52A1\u7AEF\u8FD8\u6CA1\u914D\u7F6E\u6570\u636E\u5E93\uFF08\u7F3A\u5C11 D1 \u7ED1\u5B9A\uFF09", 503);
  let body = {};
  try {
    body = await request.json();
  } catch (e) {
    return bad("\u8BF7\u6C42\u683C\u5F0F\u4E0D\u5BF9");
  }
  const action = String(body.action || "");
  const ip = clientIp(request);
  if (!await rateLimit(db, "acct:" + ip, 40, 60)) return bad("\u64CD\u4F5C\u6709\u70B9\u9891\u7E41\uFF0C\u4F11\u606F\u4E00\u4E0B\u518D\u8BD5", 429);
  if (action === "create") {
    for (let i = 0; i < 5; i++) {
      const code = genCode();
      const codeHash = await sha256Hex(normalizeCode(code) + "|" + pepperOf(env));
      const exists = await db.prepare("SELECT id FROM accounts WHERE code_hash = ?").bind(codeHash).first();
      if (exists) continue;
      const id = "a_" + crypto.randomUUID();
      const cleanPin = String(body.pin || "").replace(/[^0-9]/g, "").slice(0, 6);
      const pinHash = cleanPin ? await sha256Hex(cleanPin + "|" + id + "|" + pepperOf(env)) : null;
      await db.prepare(
        "INSERT INTO accounts (id, code_hash, pin_hash, nickname, avatar, rev, created_at, last_seen) VALUES (?,?,?,?,?,0,?,?)"
      ).bind(
        id,
        codeHash,
        pinHash,
        String(body.nickname || "").slice(0, 20) || null,
        String(body.avatar || "").slice(0, 8) || null,
        nowSec(),
        nowSec()
      ).run();
      return json({ ok: true, code, accountId: id, hasPin: !!pinHash, serverTime: Date.now() });
    }
    return bad("\u751F\u6210\u540C\u6B65\u7801\u5931\u8D25\uFF0C\u8BF7\u91CD\u8BD5", 500);
  }
  if (action === "login") {
    if (!await rateLimit(db, "login:" + ip, 20, 60)) return bad("\u8BD5\u5F97\u592A\u9891\u7E41\u5566\uFF0C\u7B49\u4E00\u5206\u949F\u518D\u8BD5", 429);
    const r = await authAccount(db, env, body.code, body.pin);
    if (r.error) return bad(r.error, 401);
    await db.prepare("UPDATE accounts SET last_seen = ? WHERE id = ?").bind(nowSec(), r.account.id).run();
    const profs = await db.prepare(
      "SELECT id, name, emoji FROM profiles WHERE account_id = ? AND deleted = 0 ORDER BY created_at"
    ).bind(r.account.id).all();
    return json({
      ok: true,
      accountId: r.account.id,
      nickname: r.account.nickname,
      avatar: r.account.avatar,
      hasPin: !!r.account.pin_hash,
      rev: r.account.rev || 0,
      profiles: profs.results || [],
      serverTime: Date.now()
    });
  }
  const auth = await authAccount(db, env, body.code, body.pin);
  if (auth.error) return bad(auth.error, 401);
  const acc = auth.account;
  if (action === "setpin") {
    const newPin = String(body.newPin || "").replace(/[^0-9]/g, "").slice(0, 6);
    const pinHash = newPin ? await sha256Hex(newPin + "|" + acc.id + "|" + pepperOf(env)) : null;
    await db.prepare("UPDATE accounts SET pin_hash = ? WHERE id = ?").bind(pinHash, acc.id).run();
    return json({ ok: true, hasPin: !!pinHash });
  }
  if (action === "rotate") {
    for (let i = 0; i < 5; i++) {
      const code = genCode();
      const codeHash = await sha256Hex(normalizeCode(code) + "|" + pepperOf(env));
      const exists = await db.prepare("SELECT id FROM accounts WHERE code_hash = ?").bind(codeHash).first();
      if (exists) continue;
      await db.prepare("UPDATE accounts SET code_hash = ? WHERE id = ?").bind(codeHash, acc.id).run();
      return json({ ok: true, code });
    }
    return bad("\u751F\u6210\u65B0\u7801\u5931\u8D25\uFF0C\u8BF7\u91CD\u8BD5", 500);
  }
  return bad("\u672A\u77E5\u64CD\u4F5C");
}
__name(onRequestPost, "onRequestPost");
__name2(onRequestPost, "onRequestPost");
var MAX_CONTENT = 262144;
var MAX_TOTAL = 1048576;
var LIMITS = { profiles: 20, folders: 60, files: 800, progress: 20, vfs: 200 };
var BATCH = 50;
var COLS = {
  folders: "id, account_id, profile_id, name, emoji, builtin, keep, position, updated_at, deleted, rev",
  files: "id, account_id, profile_id, folder_id, name, content, updated_at, deleted, rev",
  progress: "account_id, profile_id, stats_json, updated_at, rev",
  vfs: "account_id, profile_id, path, text, updated_at, rev"
};
function str(v, n) {
  return String(v === void 0 || v === null ? "" : v).slice(0, n);
}
__name(str, "str");
__name2(str, "str");
function num(v) {
  return Number(v) || 0;
}
__name(num, "num");
__name2(num, "num");
async function onRequestGet({ request, env }) {
  const db = env.DB;
  if (!db) return bad("\u670D\u52A1\u7AEF\u8FD8\u6CA1\u914D\u7F6E\u6570\u636E\u5E93\uFF08\u7F3A\u5C11 D1 \u7ED1\u5B9A\uFF09", 503);
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const pin = url.searchParams.get("pin");
  const since = parseInt(url.searchParams.get("since") || "0", 10) || 0;
  const auth = await authAccount(db, env, code, pin);
  if (auth.error) return bad(auth.error, 401);
  const acc = auth.account;
  if (!await rateLimit(db, "pull:" + acc.id, 240, 60)) return bad("\u540C\u6B65\u592A\u9891\u7E41\u5566\uFF0C\u7A0D\u7B49\u4E00\u4E0B", 429);
  const profRows = (await db.prepare(
    "SELECT id, account_id, name, emoji, updated_at, deleted, rev FROM profiles WHERE account_id = ? AND rev > ?"
  ).bind(acc.id, since).all()).results || [];
  const out = {
    ok: true,
    serverTime: Date.now(),
    rev: acc.rev || 0,
    nickname: acc.nickname || null,
    avatar: acc.avatar || null,
    hasPin: !!acc.pin_hash,
    profiles: profRows
  };
  for (const table of ["folders", "files", "progress", "vfs"]) {
    const res = await db.prepare(
      "SELECT " + COLS[table] + " FROM " + table + " WHERE account_id = ? AND rev > ?"
    ).bind(acc.id, since).all();
    out[table] = res.results || [];
  }
  return json(out);
}
__name(onRequestGet, "onRequestGet");
__name2(onRequestGet, "onRequestGet");
async function onRequestPost2({ request, env }) {
  const db = env.DB;
  if (!db) return bad("\u670D\u52A1\u7AEF\u8FD8\u6CA1\u914D\u7F6E\u6570\u636E\u5E93\uFF08\u7F3A\u5C11 D1 \u7ED1\u5B9A\uFF09", 503);
  let body = {};
  try {
    body = await request.json();
  } catch (e) {
    return bad("\u8BF7\u6C42\u683C\u5F0F\u4E0D\u5BF9");
  }
  const auth = await authAccount(db, env, body.code, body.pin);
  if (auth.error) return bad(auth.error, 401);
  const acc = auth.account;
  if (!await rateLimit(db, "push:" + acc.id, 120, 60)) return bad("\u540C\u6B65\u592A\u9891\u7E41\u5566\uFF0C\u7A0D\u7B49\u4E00\u4E0B", 429);
  const c = body.changes || {};
  let raw = "";
  try {
    raw = JSON.stringify(c);
  } catch (e) {
    return bad("\u8BF7\u6C42\u683C\u5F0F\u4E0D\u5BF9");
  }
  if (raw.length > MAX_TOTAL) return bad("\u8FD9\u6B21\u8981\u4FDD\u5B58\u7684\u5185\u5BB9\u592A\u591A\u5566\uFF0C\u5148\u5220\u6389\u4E00\u4E9B\u4E0D\u7528\u7684\u6587\u4EF6\u5427", 413);
  const rev = num(acc.rev) + 1;
  const owned = new Set((await db.prepare("SELECT id FROM profiles WHERE account_id = ?").bind(acc.id).all()).results.map((r) => r.id));
  const stmts = [];
  let skipped = 0;
  (c.profiles || []).slice(0, LIMITS.profiles).forEach((p) => {
    const id = str(p.id, 60);
    if (!id) return;
    stmts.push(db.prepare(
      "INSERT INTO profiles (id, account_id, name, emoji, updated_at, deleted, rev) VALUES (?,?,?,?,?,?,?) ON CONFLICT(account_id, id) DO UPDATE SET name=excluded.name, emoji=excluded.emoji, updated_at=excluded.updated_at, deleted=excluded.deleted, rev=excluded.rev WHERE excluded.updated_at >= profiles.updated_at"
    ).bind(
      id,
      acc.id,
      str(p.name, 20) || "\u5C0F\u670B\u53CB",
      str(p.emoji, 8) || null,
      num(p.updated_at) || Date.now(),
      p.deleted ? 1 : 0,
      rev
    ));
    owned.add(id);
  });
  (c.folders || []).slice(0, LIMITS.folders).forEach((f) => {
    if (!owned.has(str(f.profile_id, 60))) return;
    stmts.push(db.prepare(
      "INSERT INTO folders (id, account_id, profile_id, name, emoji, builtin, keep, position, updated_at, deleted, rev) VALUES (?,?,?,?,?,?,?,?,?,?,?) ON CONFLICT(account_id, id) DO UPDATE SET profile_id=excluded.profile_id, name=excluded.name, emoji=excluded.emoji, builtin=excluded.builtin, keep=excluded.keep, position=excluded.position, updated_at=excluded.updated_at, deleted=excluded.deleted, rev=excluded.rev WHERE excluded.updated_at >= folders.updated_at"
    ).bind(
      str(f.id, 60),
      acc.id,
      str(f.profile_id, 60),
      str(f.name, 30),
      str(f.emoji, 8) || null,
      f.builtin ? 1 : 0,
      f.keep ? 1 : 0,
      num(f.position),
      num(f.updated_at) || Date.now(),
      f.deleted ? 1 : 0,
      rev
    ));
  });
  (c.files || []).slice(0, LIMITS.files).forEach((f) => {
    if (!owned.has(str(f.profile_id, 60))) return;
    const content = String(f.content === void 0 || f.content === null ? "" : f.content);
    if (content.length > MAX_CONTENT) {
      skipped += 1;
      return;
    }
    stmts.push(db.prepare(
      "INSERT INTO files (id, account_id, profile_id, folder_id, name, content, updated_at, deleted, rev) VALUES (?,?,?,?,?,?,?,?,?) ON CONFLICT(account_id, id) DO UPDATE SET profile_id=excluded.profile_id, folder_id=excluded.folder_id, name=excluded.name, content=excluded.content, updated_at=excluded.updated_at, deleted=excluded.deleted, rev=excluded.rev WHERE excluded.updated_at >= files.updated_at"
    ).bind(
      str(f.id, 60),
      acc.id,
      str(f.profile_id, 60),
      str(f.folder_id, 60) || null,
      str(f.name, 60),
      content,
      num(f.updated_at) || Date.now(),
      f.deleted ? 1 : 0,
      rev
    ));
  });
  (c.progress || []).slice(0, LIMITS.progress).forEach((p) => {
    if (!owned.has(str(p.profile_id, 60))) return;
    const stats = JSON.stringify(p.stats || {});
    if (stats.length > MAX_CONTENT) {
      skipped += 1;
      return;
    }
    stmts.push(db.prepare(
      "INSERT INTO progress (account_id, profile_id, stats_json, updated_at, rev) VALUES (?,?,?,?,?) ON CONFLICT(account_id, profile_id) DO UPDATE SET stats_json=excluded.stats_json, updated_at=excluded.updated_at, rev=excluded.rev WHERE excluded.updated_at >= progress.updated_at"
    ).bind(acc.id, str(p.profile_id, 60), stats, num(p.updated_at) || Date.now(), rev));
  });
  (c.vfs || []).slice(0, LIMITS.vfs).forEach((v) => {
    if (!owned.has(str(v.profile_id, 60))) return;
    const text = String(v.text === void 0 || v.text === null ? "" : v.text);
    if (text.length > MAX_CONTENT) {
      skipped += 1;
      return;
    }
    stmts.push(db.prepare(
      "INSERT INTO vfs (account_id, profile_id, path, text, updated_at, rev) VALUES (?,?,?,?,?,?) ON CONFLICT(account_id, profile_id, path) DO UPDATE SET text=excluded.text, updated_at=excluded.updated_at, rev=excluded.rev WHERE excluded.updated_at >= vfs.updated_at"
    ).bind(acc.id, str(v.profile_id, 60), str(v.path, 120), text, num(v.updated_at) || Date.now(), rev));
  });
  try {
    for (let i = 0; i < stmts.length; i += BATCH) {
      await db.batch(stmts.slice(i, i + BATCH));
    }
    await db.prepare("UPDATE accounts SET rev = ?, last_seen = ? WHERE id = ?").bind(rev, nowSec(), acc.id).run();
  } catch (e) {
    return bad("\u4FDD\u5B58\u5230\u4E91\u7AEF\u5931\u8D25\uFF1A" + String(e && e.message || e).slice(0, 120), 500);
  }
  return json({ ok: true, rev, applied: stmts.length, skipped, serverTime: Date.now() });
}
__name(onRequestPost2, "onRequestPost2");
__name2(onRequestPost2, "onRequestPost");
var routes = [
  {
    routePath: "/api/account",
    mountPath: "/api",
    method: "POST",
    middlewares: [],
    modules: [onRequestPost]
  },
  {
    routePath: "/api/sync",
    mountPath: "/api",
    method: "GET",
    middlewares: [],
    modules: [onRequestGet]
  },
  {
    routePath: "/api/sync",
    mountPath: "/api",
    method: "POST",
    middlewares: [],
    modules: [onRequestPost2]
  }
];
function lexer(str2) {
  var tokens = [];
  var i = 0;
  while (i < str2.length) {
    var char = str2[i];
    if (char === "*" || char === "+" || char === "?") {
      tokens.push({ type: "MODIFIER", index: i, value: str2[i++] });
      continue;
    }
    if (char === "\\") {
      tokens.push({ type: "ESCAPED_CHAR", index: i++, value: str2[i++] });
      continue;
    }
    if (char === "{") {
      tokens.push({ type: "OPEN", index: i, value: str2[i++] });
      continue;
    }
    if (char === "}") {
      tokens.push({ type: "CLOSE", index: i, value: str2[i++] });
      continue;
    }
    if (char === ":") {
      var name = "";
      var j = i + 1;
      while (j < str2.length) {
        var code = str2.charCodeAt(j);
        if (
          // `0-9`
          code >= 48 && code <= 57 || // `A-Z`
          code >= 65 && code <= 90 || // `a-z`
          code >= 97 && code <= 122 || // `_`
          code === 95
        ) {
          name += str2[j++];
          continue;
        }
        break;
      }
      if (!name)
        throw new TypeError("Missing parameter name at ".concat(i));
      tokens.push({ type: "NAME", index: i, value: name });
      i = j;
      continue;
    }
    if (char === "(") {
      var count = 1;
      var pattern = "";
      var j = i + 1;
      if (str2[j] === "?") {
        throw new TypeError('Pattern cannot start with "?" at '.concat(j));
      }
      while (j < str2.length) {
        if (str2[j] === "\\") {
          pattern += str2[j++] + str2[j++];
          continue;
        }
        if (str2[j] === ")") {
          count--;
          if (count === 0) {
            j++;
            break;
          }
        } else if (str2[j] === "(") {
          count++;
          if (str2[j + 1] !== "?") {
            throw new TypeError("Capturing groups are not allowed at ".concat(j));
          }
        }
        pattern += str2[j++];
      }
      if (count)
        throw new TypeError("Unbalanced pattern at ".concat(i));
      if (!pattern)
        throw new TypeError("Missing pattern at ".concat(i));
      tokens.push({ type: "PATTERN", index: i, value: pattern });
      i = j;
      continue;
    }
    tokens.push({ type: "CHAR", index: i, value: str2[i++] });
  }
  tokens.push({ type: "END", index: i, value: "" });
  return tokens;
}
__name(lexer, "lexer");
__name2(lexer, "lexer");
function parse(str2, options) {
  if (options === void 0) {
    options = {};
  }
  var tokens = lexer(str2);
  var _a = options.prefixes, prefixes = _a === void 0 ? "./" : _a, _b = options.delimiter, delimiter = _b === void 0 ? "/#?" : _b;
  var result = [];
  var key = 0;
  var i = 0;
  var path = "";
  var tryConsume = /* @__PURE__ */ __name2(function(type) {
    if (i < tokens.length && tokens[i].type === type)
      return tokens[i++].value;
  }, "tryConsume");
  var mustConsume = /* @__PURE__ */ __name2(function(type) {
    var value2 = tryConsume(type);
    if (value2 !== void 0)
      return value2;
    var _a2 = tokens[i], nextType = _a2.type, index = _a2.index;
    throw new TypeError("Unexpected ".concat(nextType, " at ").concat(index, ", expected ").concat(type));
  }, "mustConsume");
  var consumeText = /* @__PURE__ */ __name2(function() {
    var result2 = "";
    var value2;
    while (value2 = tryConsume("CHAR") || tryConsume("ESCAPED_CHAR")) {
      result2 += value2;
    }
    return result2;
  }, "consumeText");
  var isSafe = /* @__PURE__ */ __name2(function(value2) {
    for (var _i = 0, delimiter_1 = delimiter; _i < delimiter_1.length; _i++) {
      var char2 = delimiter_1[_i];
      if (value2.indexOf(char2) > -1)
        return true;
    }
    return false;
  }, "isSafe");
  var safePattern = /* @__PURE__ */ __name2(function(prefix2) {
    var prev = result[result.length - 1];
    var prevText = prefix2 || (prev && typeof prev === "string" ? prev : "");
    if (prev && !prevText) {
      throw new TypeError('Must have text between two parameters, missing text after "'.concat(prev.name, '"'));
    }
    if (!prevText || isSafe(prevText))
      return "[^".concat(escapeString(delimiter), "]+?");
    return "(?:(?!".concat(escapeString(prevText), ")[^").concat(escapeString(delimiter), "])+?");
  }, "safePattern");
  while (i < tokens.length) {
    var char = tryConsume("CHAR");
    var name = tryConsume("NAME");
    var pattern = tryConsume("PATTERN");
    if (name || pattern) {
      var prefix = char || "";
      if (prefixes.indexOf(prefix) === -1) {
        path += prefix;
        prefix = "";
      }
      if (path) {
        result.push(path);
        path = "";
      }
      result.push({
        name: name || key++,
        prefix,
        suffix: "",
        pattern: pattern || safePattern(prefix),
        modifier: tryConsume("MODIFIER") || ""
      });
      continue;
    }
    var value = char || tryConsume("ESCAPED_CHAR");
    if (value) {
      path += value;
      continue;
    }
    if (path) {
      result.push(path);
      path = "";
    }
    var open = tryConsume("OPEN");
    if (open) {
      var prefix = consumeText();
      var name_1 = tryConsume("NAME") || "";
      var pattern_1 = tryConsume("PATTERN") || "";
      var suffix = consumeText();
      mustConsume("CLOSE");
      result.push({
        name: name_1 || (pattern_1 ? key++ : ""),
        pattern: name_1 && !pattern_1 ? safePattern(prefix) : pattern_1,
        prefix,
        suffix,
        modifier: tryConsume("MODIFIER") || ""
      });
      continue;
    }
    mustConsume("END");
  }
  return result;
}
__name(parse, "parse");
__name2(parse, "parse");
function match(str2, options) {
  var keys = [];
  var re = pathToRegexp(str2, keys, options);
  return regexpToFunction(re, keys, options);
}
__name(match, "match");
__name2(match, "match");
function regexpToFunction(re, keys, options) {
  if (options === void 0) {
    options = {};
  }
  var _a = options.decode, decode = _a === void 0 ? function(x) {
    return x;
  } : _a;
  return function(pathname) {
    var m = re.exec(pathname);
    if (!m)
      return false;
    var path = m[0], index = m.index;
    var params = /* @__PURE__ */ Object.create(null);
    var _loop_1 = /* @__PURE__ */ __name2(function(i2) {
      if (m[i2] === void 0)
        return "continue";
      var key = keys[i2 - 1];
      if (key.modifier === "*" || key.modifier === "+") {
        params[key.name] = m[i2].split(key.prefix + key.suffix).map(function(value) {
          return decode(value, key);
        });
      } else {
        params[key.name] = decode(m[i2], key);
      }
    }, "_loop_1");
    for (var i = 1; i < m.length; i++) {
      _loop_1(i);
    }
    return { path, index, params };
  };
}
__name(regexpToFunction, "regexpToFunction");
__name2(regexpToFunction, "regexpToFunction");
function escapeString(str2) {
  return str2.replace(/([.+*?=^!:${}()[\]|/\\])/g, "\\$1");
}
__name(escapeString, "escapeString");
__name2(escapeString, "escapeString");
function flags(options) {
  return options && options.sensitive ? "" : "i";
}
__name(flags, "flags");
__name2(flags, "flags");
function regexpToRegexp(path, keys) {
  if (!keys)
    return path;
  var groupsRegex = /\((?:\?<(.*?)>)?(?!\?)/g;
  var index = 0;
  var execResult = groupsRegex.exec(path.source);
  while (execResult) {
    keys.push({
      // Use parenthesized substring match if available, index otherwise
      name: execResult[1] || index++,
      prefix: "",
      suffix: "",
      modifier: "",
      pattern: ""
    });
    execResult = groupsRegex.exec(path.source);
  }
  return path;
}
__name(regexpToRegexp, "regexpToRegexp");
__name2(regexpToRegexp, "regexpToRegexp");
function arrayToRegexp(paths, keys, options) {
  var parts = paths.map(function(path) {
    return pathToRegexp(path, keys, options).source;
  });
  return new RegExp("(?:".concat(parts.join("|"), ")"), flags(options));
}
__name(arrayToRegexp, "arrayToRegexp");
__name2(arrayToRegexp, "arrayToRegexp");
function stringToRegexp(path, keys, options) {
  return tokensToRegexp(parse(path, options), keys, options);
}
__name(stringToRegexp, "stringToRegexp");
__name2(stringToRegexp, "stringToRegexp");
function tokensToRegexp(tokens, keys, options) {
  if (options === void 0) {
    options = {};
  }
  var _a = options.strict, strict = _a === void 0 ? false : _a, _b = options.start, start = _b === void 0 ? true : _b, _c = options.end, end = _c === void 0 ? true : _c, _d = options.encode, encode = _d === void 0 ? function(x) {
    return x;
  } : _d, _e = options.delimiter, delimiter = _e === void 0 ? "/#?" : _e, _f = options.endsWith, endsWith = _f === void 0 ? "" : _f;
  var endsWithRe = "[".concat(escapeString(endsWith), "]|$");
  var delimiterRe = "[".concat(escapeString(delimiter), "]");
  var route = start ? "^" : "";
  for (var _i = 0, tokens_1 = tokens; _i < tokens_1.length; _i++) {
    var token = tokens_1[_i];
    if (typeof token === "string") {
      route += escapeString(encode(token));
    } else {
      var prefix = escapeString(encode(token.prefix));
      var suffix = escapeString(encode(token.suffix));
      if (token.pattern) {
        if (keys)
          keys.push(token);
        if (prefix || suffix) {
          if (token.modifier === "+" || token.modifier === "*") {
            var mod = token.modifier === "*" ? "?" : "";
            route += "(?:".concat(prefix, "((?:").concat(token.pattern, ")(?:").concat(suffix).concat(prefix, "(?:").concat(token.pattern, "))*)").concat(suffix, ")").concat(mod);
          } else {
            route += "(?:".concat(prefix, "(").concat(token.pattern, ")").concat(suffix, ")").concat(token.modifier);
          }
        } else {
          if (token.modifier === "+" || token.modifier === "*") {
            throw new TypeError('Can not repeat "'.concat(token.name, '" without a prefix and suffix'));
          }
          route += "(".concat(token.pattern, ")").concat(token.modifier);
        }
      } else {
        route += "(?:".concat(prefix).concat(suffix, ")").concat(token.modifier);
      }
    }
  }
  if (end) {
    if (!strict)
      route += "".concat(delimiterRe, "?");
    route += !options.endsWith ? "$" : "(?=".concat(endsWithRe, ")");
  } else {
    var endToken = tokens[tokens.length - 1];
    var isEndDelimited = typeof endToken === "string" ? delimiterRe.indexOf(endToken[endToken.length - 1]) > -1 : endToken === void 0;
    if (!strict) {
      route += "(?:".concat(delimiterRe, "(?=").concat(endsWithRe, "))?");
    }
    if (!isEndDelimited) {
      route += "(?=".concat(delimiterRe, "|").concat(endsWithRe, ")");
    }
  }
  return new RegExp(route, flags(options));
}
__name(tokensToRegexp, "tokensToRegexp");
__name2(tokensToRegexp, "tokensToRegexp");
function pathToRegexp(path, keys, options) {
  if (path instanceof RegExp)
    return regexpToRegexp(path, keys);
  if (Array.isArray(path))
    return arrayToRegexp(path, keys, options);
  return stringToRegexp(path, keys, options);
}
__name(pathToRegexp, "pathToRegexp");
__name2(pathToRegexp, "pathToRegexp");
var escapeRegex = /[.+?^${}()|[\]\\]/g;
function* executeRequest(request) {
  const requestPath = new URL(request.url).pathname;
  for (const route of [...routes].reverse()) {
    if (route.method && route.method !== request.method) {
      continue;
    }
    const routeMatcher = match(route.routePath.replace(escapeRegex, "\\$&"), {
      end: false
    });
    const mountMatcher = match(route.mountPath.replace(escapeRegex, "\\$&"), {
      end: false
    });
    const matchResult = routeMatcher(requestPath);
    const mountMatchResult = mountMatcher(requestPath);
    if (matchResult && mountMatchResult) {
      for (const handler of route.middlewares.flat()) {
        yield {
          handler,
          params: matchResult.params,
          path: mountMatchResult.path
        };
      }
    }
  }
  for (const route of routes) {
    if (route.method && route.method !== request.method) {
      continue;
    }
    const routeMatcher = match(route.routePath.replace(escapeRegex, "\\$&"), {
      end: true
    });
    const mountMatcher = match(route.mountPath.replace(escapeRegex, "\\$&"), {
      end: false
    });
    const matchResult = routeMatcher(requestPath);
    const mountMatchResult = mountMatcher(requestPath);
    if (matchResult && mountMatchResult && route.modules.length) {
      for (const handler of route.modules.flat()) {
        yield {
          handler,
          params: matchResult.params,
          path: matchResult.path
        };
      }
      break;
    }
  }
}
__name(executeRequest, "executeRequest");
__name2(executeRequest, "executeRequest");
var pages_template_worker_default = {
  async fetch(originalRequest, env, workerContext) {
    let request = originalRequest;
    const handlerIterator = executeRequest(request);
    let data = {};
    let isFailOpen = false;
    const next = /* @__PURE__ */ __name2(async (input, init) => {
      if (input !== void 0) {
        let url = input;
        if (typeof input === "string") {
          url = new URL(input, request.url).toString();
        }
        request = new Request(url, init);
      }
      const result = handlerIterator.next();
      if (result.done === false) {
        const { handler, params, path } = result.value;
        const context = {
          request: new Request(request.clone()),
          functionPath: path,
          next,
          params,
          get data() {
            return data;
          },
          set data(value) {
            if (typeof value !== "object" || value === null) {
              throw new Error("context.data must be an object");
            }
            data = value;
          },
          env,
          waitUntil: workerContext.waitUntil.bind(workerContext),
          passThroughOnException: /* @__PURE__ */ __name2(() => {
            isFailOpen = true;
          }, "passThroughOnException")
        };
        const response = await handler(context);
        if (!(response instanceof Response)) {
          throw new Error("Your Pages function should return a Response");
        }
        return cloneResponse(response);
      } else if ("ASSETS") {
        const response = await env["ASSETS"].fetch(request);
        return cloneResponse(response);
      } else {
        const response = await fetch(request);
        return cloneResponse(response);
      }
    }, "next");
    try {
      return await next();
    } catch (error) {
      if (isFailOpen) {
        const response = await env["ASSETS"].fetch(request);
        return cloneResponse(response);
      }
      throw error;
    }
  }
};
var cloneResponse = /* @__PURE__ */ __name2((response) => (
  // https://fetch.spec.whatwg.org/#null-body-status
  new Response(
    [101, 204, 205, 304].includes(response.status) ? null : response.body,
    response
  )
), "cloneResponse");
var drainBody = /* @__PURE__ */ __name2(async (request, env, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env);
  } finally {
    try {
      if (request.body !== null && !request.bodyUsed) {
        const reader = request.body.getReader();
        while (!(await reader.read()).done) {
        }
      }
    } catch (e) {
      console.error("Failed to drain the unused request body.", e);
    }
  }
}, "drainBody");
var middleware_ensure_req_body_drained_default = drainBody;
function reduceError(e) {
  return {
    name: e?.name,
    message: e?.message ?? String(e),
    stack: e?.stack,
    cause: e?.cause === void 0 ? void 0 : reduceError(e.cause)
  };
}
__name(reduceError, "reduceError");
__name2(reduceError, "reduceError");
var jsonError = /* @__PURE__ */ __name2(async (request, env, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env);
  } catch (e) {
    const error = reduceError(e);
    return Response.json(error, {
      status: 500,
      headers: { "MF-Experimental-Error-Stack": "true" }
    });
  }
}, "jsonError");
var middleware_miniflare3_json_error_default = jsonError;
var __INTERNAL_WRANGLER_MIDDLEWARE__ = [
  middleware_ensure_req_body_drained_default,
  middleware_miniflare3_json_error_default
];
var middleware_insertion_facade_default = pages_template_worker_default;
var __facade_middleware__ = [];
function __facade_register__(...args) {
  __facade_middleware__.push(...args.flat());
}
__name(__facade_register__, "__facade_register__");
__name2(__facade_register__, "__facade_register__");
function __facade_invokeChain__(request, env, ctx, dispatch, middlewareChain) {
  const [head, ...tail] = middlewareChain;
  const middlewareCtx = {
    dispatch,
    next(newRequest, newEnv) {
      return __facade_invokeChain__(newRequest, newEnv, ctx, dispatch, tail);
    }
  };
  return head(request, env, ctx, middlewareCtx);
}
__name(__facade_invokeChain__, "__facade_invokeChain__");
__name2(__facade_invokeChain__, "__facade_invokeChain__");
function __facade_invoke__(request, env, ctx, dispatch, finalMiddleware) {
  return __facade_invokeChain__(request, env, ctx, dispatch, [
    ...__facade_middleware__,
    finalMiddleware
  ]);
}
__name(__facade_invoke__, "__facade_invoke__");
__name2(__facade_invoke__, "__facade_invoke__");
var __Facade_ScheduledController__ = class ___Facade_ScheduledController__ {
  static {
    __name(this, "___Facade_ScheduledController__");
  }
  constructor(scheduledTime, cron, noRetry) {
    this.scheduledTime = scheduledTime;
    this.cron = cron;
    this.#noRetry = noRetry;
  }
  static {
    __name2(this, "__Facade_ScheduledController__");
  }
  #noRetry;
  noRetry() {
    if (!(this instanceof ___Facade_ScheduledController__)) {
      throw new TypeError("Illegal invocation");
    }
    this.#noRetry();
  }
};
function wrapExportedHandler(worker) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return worker;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  const fetchDispatcher = /* @__PURE__ */ __name2(function(request, env, ctx) {
    if (worker.fetch === void 0) {
      throw new Error("Handler does not export a fetch() function.");
    }
    return worker.fetch(request, env, ctx);
  }, "fetchDispatcher");
  return {
    ...worker,
    fetch(request, env, ctx) {
      const dispatcher = /* @__PURE__ */ __name2(function(type, init) {
        if (type === "scheduled" && worker.scheduled !== void 0) {
          const controller = new __Facade_ScheduledController__(
            Date.now(),
            init.cron ?? "",
            () => {
            }
          );
          return worker.scheduled(controller, env, ctx);
        }
      }, "dispatcher");
      return __facade_invoke__(request, env, ctx, dispatcher, fetchDispatcher);
    }
  };
}
__name(wrapExportedHandler, "wrapExportedHandler");
__name2(wrapExportedHandler, "wrapExportedHandler");
function wrapWorkerEntrypoint(klass) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return klass;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  return class extends klass {
    #fetchDispatcher = /* @__PURE__ */ __name2((request, env, ctx) => {
      this.env = env;
      this.ctx = ctx;
      if (super.fetch === void 0) {
        throw new Error("Entrypoint class does not define a fetch() function.");
      }
      return super.fetch(request);
    }, "#fetchDispatcher");
    #dispatcher = /* @__PURE__ */ __name2((type, init) => {
      if (type === "scheduled" && super.scheduled !== void 0) {
        const controller = new __Facade_ScheduledController__(
          Date.now(),
          init.cron ?? "",
          () => {
          }
        );
        return super.scheduled(controller);
      }
    }, "#dispatcher");
    fetch(request) {
      return __facade_invoke__(
        request,
        this.env,
        this.ctx,
        this.#dispatcher,
        this.#fetchDispatcher
      );
    }
  };
}
__name(wrapWorkerEntrypoint, "wrapWorkerEntrypoint");
__name2(wrapWorkerEntrypoint, "wrapWorkerEntrypoint");
var WRAPPED_ENTRY;
if (typeof middleware_insertion_facade_default === "object") {
  WRAPPED_ENTRY = wrapExportedHandler(middleware_insertion_facade_default);
} else if (typeof middleware_insertion_facade_default === "function") {
  WRAPPED_ENTRY = wrapWorkerEntrypoint(middleware_insertion_facade_default);
}
var middleware_loader_entry_default = WRAPPED_ENTRY;

// ../../.npm/_npx/32026684e21afda6/node_modules/wrangler/templates/middleware/middleware-ensure-req-body-drained.ts
var drainBody2 = /* @__PURE__ */ __name(async (request, env, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env);
  } finally {
    try {
      if (request.body !== null && !request.bodyUsed) {
        const reader = request.body.getReader();
        while (!(await reader.read()).done) {
        }
      }
    } catch (e) {
      console.error("Failed to drain the unused request body.", e);
    }
  }
}, "drainBody");
var middleware_ensure_req_body_drained_default2 = drainBody2;

// ../../.npm/_npx/32026684e21afda6/node_modules/wrangler/templates/middleware/middleware-miniflare3-json-error.ts
function reduceError2(e) {
  return {
    name: e?.name,
    message: e?.message ?? String(e),
    stack: e?.stack,
    cause: e?.cause === void 0 ? void 0 : reduceError2(e.cause)
  };
}
__name(reduceError2, "reduceError");
var jsonError2 = /* @__PURE__ */ __name(async (request, env, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env);
  } catch (e) {
    const error = reduceError2(e);
    return Response.json(error, {
      status: 500,
      headers: { "MF-Experimental-Error-Stack": "true" }
    });
  }
}, "jsonError");
var middleware_miniflare3_json_error_default2 = jsonError2;

// .wrangler/tmp/bundle-iZswbe/middleware-insertion-facade.js
var __INTERNAL_WRANGLER_MIDDLEWARE__2 = [
  middleware_ensure_req_body_drained_default2,
  middleware_miniflare3_json_error_default2
];
var middleware_insertion_facade_default2 = middleware_loader_entry_default;

// ../../.npm/_npx/32026684e21afda6/node_modules/wrangler/templates/middleware/common.ts
var __facade_middleware__2 = [];
function __facade_register__2(...args) {
  __facade_middleware__2.push(...args.flat());
}
__name(__facade_register__2, "__facade_register__");
function __facade_invokeChain__2(request, env, ctx, dispatch, middlewareChain) {
  const [head, ...tail] = middlewareChain;
  const middlewareCtx = {
    dispatch,
    next(newRequest, newEnv) {
      return __facade_invokeChain__2(newRequest, newEnv, ctx, dispatch, tail);
    }
  };
  return head(request, env, ctx, middlewareCtx);
}
__name(__facade_invokeChain__2, "__facade_invokeChain__");
function __facade_invoke__2(request, env, ctx, dispatch, finalMiddleware) {
  return __facade_invokeChain__2(request, env, ctx, dispatch, [
    ...__facade_middleware__2,
    finalMiddleware
  ]);
}
__name(__facade_invoke__2, "__facade_invoke__");

// .wrangler/tmp/bundle-iZswbe/middleware-loader.entry.ts
var __Facade_ScheduledController__2 = class ___Facade_ScheduledController__2 {
  constructor(scheduledTime, cron, noRetry) {
    this.scheduledTime = scheduledTime;
    this.cron = cron;
    this.#noRetry = noRetry;
  }
  static {
    __name(this, "__Facade_ScheduledController__");
  }
  #noRetry;
  noRetry() {
    if (!(this instanceof ___Facade_ScheduledController__2)) {
      throw new TypeError("Illegal invocation");
    }
    this.#noRetry();
  }
};
function wrapExportedHandler2(worker) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__2 === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__2.length === 0) {
    return worker;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__2) {
    __facade_register__2(middleware);
  }
  const fetchDispatcher = /* @__PURE__ */ __name(function(request, env, ctx) {
    if (worker.fetch === void 0) {
      throw new Error("Handler does not export a fetch() function.");
    }
    return worker.fetch(request, env, ctx);
  }, "fetchDispatcher");
  return {
    ...worker,
    fetch(request, env, ctx) {
      const dispatcher = /* @__PURE__ */ __name(function(type, init) {
        if (type === "scheduled" && worker.scheduled !== void 0) {
          const controller = new __Facade_ScheduledController__2(
            Date.now(),
            init.cron ?? "",
            () => {
            }
          );
          return worker.scheduled(controller, env, ctx);
        }
      }, "dispatcher");
      return __facade_invoke__2(request, env, ctx, dispatcher, fetchDispatcher);
    }
  };
}
__name(wrapExportedHandler2, "wrapExportedHandler");
function wrapWorkerEntrypoint2(klass) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__2 === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__2.length === 0) {
    return klass;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__2) {
    __facade_register__2(middleware);
  }
  return class extends klass {
    #fetchDispatcher = /* @__PURE__ */ __name((request, env, ctx) => {
      this.env = env;
      this.ctx = ctx;
      if (super.fetch === void 0) {
        throw new Error("Entrypoint class does not define a fetch() function.");
      }
      return super.fetch(request);
    }, "#fetchDispatcher");
    #dispatcher = /* @__PURE__ */ __name((type, init) => {
      if (type === "scheduled" && super.scheduled !== void 0) {
        const controller = new __Facade_ScheduledController__2(
          Date.now(),
          init.cron ?? "",
          () => {
          }
        );
        return super.scheduled(controller);
      }
    }, "#dispatcher");
    fetch(request) {
      return __facade_invoke__2(
        request,
        this.env,
        this.ctx,
        this.#dispatcher,
        this.#fetchDispatcher
      );
    }
  };
}
__name(wrapWorkerEntrypoint2, "wrapWorkerEntrypoint");
var WRAPPED_ENTRY2;
if (typeof middleware_insertion_facade_default2 === "object") {
  WRAPPED_ENTRY2 = wrapExportedHandler2(middleware_insertion_facade_default2);
} else if (typeof middleware_insertion_facade_default2 === "function") {
  WRAPPED_ENTRY2 = wrapWorkerEntrypoint2(middleware_insertion_facade_default2);
}
var middleware_loader_entry_default2 = WRAPPED_ENTRY2;
export {
  __INTERNAL_WRANGLER_MIDDLEWARE__2 as __INTERNAL_WRANGLER_MIDDLEWARE__,
  middleware_loader_entry_default2 as default
};
//# sourceMappingURL=functionsWorker-0.84080122776373.js.map
