// GET  /api/sync?code=..&pin=..&since=<rev>   → 增量拉取
// POST /api/sync  { code, pin, changes:{profiles,folders,files,progress,vfs} }  → 推送本地改动
//
// 所有行都以 account_id 为作用域：本地 id（p_default / ex_1 …）在不同账号之间可以重复。
import { json, bad, rateLimit, authAccount, nowSec, clientIp } from "./_utils.js";

const MAX_CONTENT = 262144;      // 单个文件 256KB
const MAX_TOTAL = 1048576;       // 一次推送 1MB
const LIMITS = { profiles: 20, folders: 60, files: 800, progress: 20, vfs: 200 };
const BATCH = 50;

const COLS = {
  folders: "id, account_id, profile_id, name, emoji, builtin, keep, position, updated_at, deleted, rev",
  files: "id, account_id, profile_id, folder_id, name, content, updated_at, deleted, rev",
  progress: "account_id, profile_id, stats_json, updated_at, rev",
  vfs: "account_id, profile_id, path, text, updated_at, rev"
};

function str(v, n) { return String(v === undefined || v === null ? "" : v).slice(0, n); }
function num(v) { return Number(v) || 0; }

export async function onRequestGet({ request, env }) {
  const db = env.DB;
  if (!db) return bad("服务端还没配置数据库（缺少 D1 绑定）", 503);
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const pin = url.searchParams.get("pin");
  const since = parseInt(url.searchParams.get("since") || "0", 10) || 0;

  const auth = await authAccount(db, env, code, pin);
  if (auth.error) return bad(auth.error, 401);
  const acc = auth.account;
  if (!(await rateLimit(db, "pull:" + acc.id, 240, 60))) return bad("同步太频繁啦，稍等一下", 429);

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

export async function onRequestPost({ request, env }) {
  const db = env.DB;
  if (!db) return bad("服务端还没配置数据库（缺少 D1 绑定）", 503);

  let body = {};
  try { body = await request.json(); } catch (e) { return bad("请求格式不对"); }
  const auth = await authAccount(db, env, body.code, body.pin);
  if (auth.error) return bad(auth.error, 401);
  const acc = auth.account;
  if (!(await rateLimit(db, "push:" + acc.id, 120, 60))) return bad("同步太频繁啦，稍等一下", 429);

  const c = body.changes || {};
  let raw = "";
  try { raw = JSON.stringify(c); } catch (e) { return bad("请求格式不对"); }
  if (raw.length > MAX_TOTAL) return bad("这次要保存的内容太多啦，先删掉一些不用的文件吧", 413);

  const rev = num(acc.rev) + 1;
  const owned = new Set((await db.prepare("SELECT id FROM profiles WHERE account_id = ?").bind(acc.id).all())
    .results.map(r => r.id));
  const stmts = [];
  let skipped = 0;

  // 1) 档案
  (c.profiles || []).slice(0, LIMITS.profiles).forEach(p => {
    const id = str(p.id, 60);
    if (!id) return;
    stmts.push(db.prepare(
      "INSERT INTO profiles (id, account_id, name, emoji, updated_at, deleted, rev) VALUES (?,?,?,?,?,?,?) " +
      "ON CONFLICT(account_id, id) DO UPDATE SET name=excluded.name, emoji=excluded.emoji, updated_at=excluded.updated_at, deleted=excluded.deleted, rev=excluded.rev " +
      "WHERE excluded.updated_at >= profiles.updated_at"
    ).bind(id, acc.id, str(p.name, 20) || "小朋友", str(p.emoji, 8) || null,
      num(p.updated_at) || Date.now(), p.deleted ? 1 : 0, rev));
    owned.add(id);
  });

  // 2) 文件夹
  (c.folders || []).slice(0, LIMITS.folders).forEach(f => {
    if (!owned.has(str(f.profile_id, 60))) return;
    stmts.push(db.prepare(
      "INSERT INTO folders (id, account_id, profile_id, name, emoji, builtin, keep, position, updated_at, deleted, rev) VALUES (?,?,?,?,?,?,?,?,?,?,?) " +
      "ON CONFLICT(account_id, id) DO UPDATE SET profile_id=excluded.profile_id, name=excluded.name, emoji=excluded.emoji, " +
      "builtin=excluded.builtin, keep=excluded.keep, position=excluded.position, updated_at=excluded.updated_at, " +
      "deleted=excluded.deleted, rev=excluded.rev " +
      "WHERE excluded.updated_at >= folders.updated_at"
    ).bind(str(f.id, 60), acc.id, str(f.profile_id, 60), str(f.name, 30), str(f.emoji, 8) || null,
      f.builtin ? 1 : 0, f.keep ? 1 : 0, num(f.position), num(f.updated_at) || Date.now(),
      f.deleted ? 1 : 0, rev));
  });

  // 3) 文件
  (c.files || []).slice(0, LIMITS.files).forEach(f => {
    if (!owned.has(str(f.profile_id, 60))) return;
    const content = String(f.content === undefined || f.content === null ? "" : f.content);
    if (content.length > MAX_CONTENT) { skipped += 1; return; }
    stmts.push(db.prepare(
      "INSERT INTO files (id, account_id, profile_id, folder_id, name, content, updated_at, deleted, rev) VALUES (?,?,?,?,?,?,?,?,?) " +
      "ON CONFLICT(account_id, id) DO UPDATE SET profile_id=excluded.profile_id, folder_id=excluded.folder_id, name=excluded.name, " +
      "content=excluded.content, updated_at=excluded.updated_at, deleted=excluded.deleted, rev=excluded.rev " +
      "WHERE excluded.updated_at >= files.updated_at"
    ).bind(str(f.id, 60), acc.id, str(f.profile_id, 60), str(f.folder_id, 60) || null, str(f.name, 60),
      content, num(f.updated_at) || Date.now(), f.deleted ? 1 : 0, rev));
  });

  // 4) 学习记录
  (c.progress || []).slice(0, LIMITS.progress).forEach(p => {
    if (!owned.has(str(p.profile_id, 60))) return;
    const stats = JSON.stringify(p.stats || {});
    if (stats.length > MAX_CONTENT) { skipped += 1; return; }
    stmts.push(db.prepare(
      "INSERT INTO progress (account_id, profile_id, stats_json, updated_at, rev) VALUES (?,?,?,?,?) " +
      "ON CONFLICT(account_id, profile_id) DO UPDATE SET stats_json=excluded.stats_json, updated_at=excluded.updated_at, rev=excluded.rev " +
      "WHERE excluded.updated_at >= progress.updated_at"
    ).bind(acc.id, str(p.profile_id, 60), stats, num(p.updated_at) || Date.now(), rev));
  });

  // 5) Python 写出的数据文件
  (c.vfs || []).slice(0, LIMITS.vfs).forEach(v => {
    if (!owned.has(str(v.profile_id, 60))) return;
    const text = String(v.text === undefined || v.text === null ? "" : v.text);
    if (text.length > MAX_CONTENT) { skipped += 1; return; }
    stmts.push(db.prepare(
      "INSERT INTO vfs (account_id, profile_id, path, text, updated_at, rev) VALUES (?,?,?,?,?,?) " +
      "ON CONFLICT(account_id, profile_id, path) DO UPDATE SET text=excluded.text, updated_at=excluded.updated_at, rev=excluded.rev " +
      "WHERE excluded.updated_at >= vfs.updated_at"
    ).bind(acc.id, str(v.profile_id, 60), str(v.path, 120), text, num(v.updated_at) || Date.now(), rev));
  });

  try {
    for (let i = 0; i < stmts.length; i += BATCH) {
      await db.batch(stmts.slice(i, i + BATCH));
    }
    await db.prepare("UPDATE accounts SET rev = ?, last_seen = ? WHERE id = ?")
      .bind(rev, nowSec(), acc.id).run();
  } catch (e) {
    return bad("保存到云端失败：" + String((e && e.message) || e).slice(0, 120), 500);
  }

  return json({ ok: true, rev: rev, applied: stmts.length, skipped: skipped, serverTime: Date.now() });
}