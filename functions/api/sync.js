// GET  /api/sync?code=..&pin=..&since=<rev>   → 增量拉取
// POST /api/sync  { code, pin, changes:{profiles,folders,files,progress,vfs} }  → 推送本地改动
//
// 所有行都以 account_id 为作用域：本地 id（p_default / ex_1 …）在不同账号之间可以重复。
import { json, bad, rateLimit, authAccount, nowSec, clientIp } from "./_utils.js";

const MAX_CONTENT = 262144;      // 单个文件 256KB
const MAX_TOTAL = 1048576;       // 一次推送 1MB
const LIMITS = { profiles: 20, folders: 60, files: 800, progress: 20, vfs: 200, learn: 600 };
const BATCH = 50;

const COLS = {
  folders: "id, account_id, profile_id, name, emoji, builtin, keep, position, updated_at, deleted, rev",
  files: "id, account_id, profile_id, folder_id, name, content, updated_at, deleted, rev",
  progress: "account_id, profile_id, stats_json, updated_at, rev",
  vfs: "account_id, profile_id, path, text, updated_at, rev",
  learn: "account_id, profile_id, draft_id, code, updated_at, deleted, rev"
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
  for (const table of ["folders", "files", "progress", "vfs", "learn"]) {
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

  // rev 必须原子分配：两台设备同时推时若都基于同一个 acc.rev 计算，会拿到同一个 rev，
  // 第三台设备按 rev 增量拉取时就会漏掉其中一批。RETURNING 不支持时退回旧算法。
  let rev = num(acc.rev) + 1;
  try {
    const bumped = await db.prepare("UPDATE accounts SET rev = rev + 1 WHERE id = ? RETURNING rev")
      .bind(acc.id).first();
    if (bumped && bumped.rev) rev = num(bumped.rev);
  } catch (e) { /* 兼容不支持 RETURNING 的环境 */ }

  const owned = new Set((await db.prepare("SELECT id FROM profiles WHERE account_id = ?").bind(acc.id).all())
    .results.map(r => r.id));
  const stmts = [];
  let skipped = 0;
  // 被丢掉的行走这里记账，最后回报给客户端 —— 绝不静默丢数据
  const dropped = { profiles: 0, folders: 0, files: 0, progress: 0, vfs: 0, learn: 0 };

  // 1) 档案
  (c.profiles || []).forEach((p, idx) => {
    const id = str(p.id, 60);
    if (idx >= LIMITS.profiles || !id) { dropped.profiles += 1; return; }
    stmts.push(db.prepare(
      "INSERT INTO profiles (id, account_id, name, emoji, updated_at, deleted, rev) VALUES (?,?,?,?,?,?,?) " +
      "ON CONFLICT(account_id, id) DO UPDATE SET name=excluded.name, emoji=excluded.emoji, updated_at=excluded.updated_at, deleted=excluded.deleted, rev=excluded.rev " +
      "WHERE excluded.updated_at >= profiles.updated_at"
    ).bind(id, acc.id, str(p.name, 20) || "小朋友", str(p.emoji, 8) || null,
      num(p.updated_at) || Date.now(), p.deleted ? 1 : 0, rev));
    owned.add(id);
  });

  // 2) 文件夹
  (c.folders || []).forEach((f, idx) => {
    if (idx >= LIMITS.folders || !owned.has(str(f.profile_id, 60))) { dropped.folders += 1; return; }
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
  (c.files || []).forEach((f, idx) => {
    if (idx >= LIMITS.files || !owned.has(str(f.profile_id, 60))) { dropped.files += 1; return; }
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
  (c.progress || []).forEach((p, idx) => {
    if (idx >= LIMITS.progress || !owned.has(str(p.profile_id, 60))) { dropped.progress += 1; return; }
    const stats = JSON.stringify(p.stats || {});
    if (stats.length > MAX_CONTENT) { skipped += 1; return; }
    stmts.push(db.prepare(
      "INSERT INTO progress (account_id, profile_id, stats_json, updated_at, rev) VALUES (?,?,?,?,?) " +
      "ON CONFLICT(account_id, profile_id) DO UPDATE SET stats_json=excluded.stats_json, updated_at=excluded.updated_at, rev=excluded.rev " +
      "WHERE excluded.updated_at >= progress.updated_at"
    ).bind(acc.id, str(p.profile_id, 60), stats, num(p.updated_at) || Date.now(), rev));
  });

  // 5) Python 写出的数据文件
  (c.vfs || []).forEach((v, idx) => {
    if (idx >= LIMITS.vfs || !owned.has(str(v.profile_id, 60))) { dropped.vfs += 1; return; }
    const text = String(v.text === undefined || v.text === null ? "" : v.text);
    if (text.length > MAX_CONTENT) { skipped += 1; return; }
    stmts.push(db.prepare(
      "INSERT INTO vfs (account_id, profile_id, path, text, updated_at, rev) VALUES (?,?,?,?,?,?) " +
      "ON CONFLICT(account_id, profile_id, path) DO UPDATE SET text=excluded.text, updated_at=excluded.updated_at, rev=excluded.rev " +
      "WHERE excluded.updated_at >= vfs.updated_at"
    ).bind(acc.id, str(v.profile_id, 60), str(v.path, 120), text, num(v.updated_at) || Date.now(), rev));
  });

  // 6) 学堂草稿（练习 / 教程 / 示例里写的代码）
  (c.learn || []).forEach((d, idx) => {
    if (idx >= LIMITS.learn || !owned.has(str(d.profile_id, 60))) { dropped.learn += 1; return; }
    const code = String(d.code === undefined || d.code === null ? "" : d.code);
    if (code.length > MAX_CONTENT) { skipped += 1; return; }
    stmts.push(db.prepare(
      "INSERT INTO learn (account_id, profile_id, draft_id, code, updated_at, deleted, rev) VALUES (?,?,?,?,?,?,?) " +
      "ON CONFLICT(account_id, profile_id, draft_id) DO UPDATE SET code=excluded.code, updated_at=excluded.updated_at, " +
      "deleted=excluded.deleted, rev=excluded.rev " +
      "WHERE excluded.updated_at >= learn.updated_at"
    ).bind(acc.id, str(d.profile_id, 60), str(d.draft_id, 40), code,
      num(d.updated_at) || Date.now(), d.deleted ? 1 : 0, rev));
  });

  try {
    for (let i = 0; i < stmts.length; i += BATCH) {
      await db.batch(stmts.slice(i, i + BATCH));
    }
    await db.prepare("UPDATE accounts SET last_seen = ? WHERE id = ?")
      .bind(nowSec(), acc.id).run();
  } catch (e) {
    return bad("保存到云端失败：" + String((e && e.message) || e).slice(0, 120), 500);
  }

  return json({
    ok: true, rev: rev, applied: stmts.length, skipped: skipped, dropped: dropped,
    serverTime: Date.now()
  });
}