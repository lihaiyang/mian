// 英语站云同步
//   GET  /api/en/sync?code=..&pin=..&since=<rev>  → 增量拉取
//   POST /api/en/sync { code, pin, rows:{profiles,progress,srs,daily} } → 推送本地改动
//
// 与萌码 Python 的 /api/sync 同构：account_id 作用域 + 账号级单调 rev + 按行 updated_at 做 LWW + 软删除墓碑。
// 差异只在表：英语站是 en_profiles / en_progress / en_srs / en_daily（内容全部是静态资源，不入库）。
import { json, bad, rateLimit, authAccount, nowSec } from "../_utils.js";

const MAX_TOTAL = 262144;        // 一次推送 256KB
const BATCH = 40;                // 每次 db.batch 合并的语句数
const LIMITS = { profiles: 8, progress: 8, srs: 4000, daily: 800 };

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
  if (!(await rateLimit(db, "en:pull:" + acc.id, 240, 60))) return bad("同步太频繁啦，稍等一下", 429);

  const profiles = (await db.prepare(
    "SELECT id, name, emoji, grade, goal, created_at, updated_at, deleted, rev FROM en_profiles WHERE account_id = ? AND rev > ?"
  ).bind(acc.id, since).all()).results || [];

  const progress = (await db.prepare(
    "SELECT profile_id, stats_json, updated_at, rev FROM en_progress WHERE account_id = ? AND rev > ?"
  ).bind(acc.id, since).all()).results || [];

  const srs = (await db.prepare(
    "SELECT profile_id, item_id, box, due_at, streak, lapses, last_result, updated_at, deleted, rev " +
    "FROM en_srs WHERE account_id = ? AND rev > ?"
  ).bind(acc.id, since).all()).results || [];

  const daily = (await db.prepare(
    "SELECT profile_id, date, minutes, new_words, reviews, speak_count, speak_seconds, updated_at, rev " +
    "FROM en_daily WHERE account_id = ? AND rev > ?"
  ).bind(acc.id, since).all()).results || [];

  return json({
    ok: true, serverTime: Date.now(), rev: num(acc.rev),
    nickname: acc.nickname || null, avatar: acc.avatar || null, hasPin: !!acc.pin_hash,
    rows: { profiles, progress, srs, daily }
  });
}

export async function onRequestPost({ request, env }) {
  const db = env.DB;
  if (!db) return bad("服务端还没配置数据库（缺少 D1 绑定）", 503);

  let body = {};
  try { body = await request.json(); } catch (e) { return bad("请求格式不对"); }
  const auth = await authAccount(db, env, body.code, body.pin);
  if (auth.error) return bad(auth.error, 401);
  const acc = auth.account;
  if (!(await rateLimit(db, "en:push:" + acc.id, 120, 60))) return bad("同步太频繁啦，稍等一下", 429);

  const rows = body.rows || {};
  let raw = "";
  try { raw = JSON.stringify(rows); } catch (e) { return bad("请求格式不对"); }
  if (raw.length > MAX_TOTAL) return bad("这次要保存的内容太多了，稍后再试", 413);

  // rev 原子分配：两台设备同时推时必须拿到不同的 rev，否则第三台设备增量拉取会漏数据
  let rev = num(acc.rev) + 1;
  try {
    const bumped = await db.prepare("UPDATE accounts SET rev = rev + 1 WHERE id = ? RETURNING rev")
      .bind(acc.id).first();
    if (bumped && bumped.rev) rev = num(bumped.rev);
  } catch (e) { /* 兼容不支持 RETURNING 的环境 */ }

  // 账号下已有哪些档案（防止串号：推送里出现别人的 profile_id 一律丢弃）
  const owned = new Set(((await db.prepare(
    "SELECT id FROM en_profiles WHERE account_id = ?").bind(acc.id).all()).results || []).map(r => r.id));

  const stmts = [];
  const applied = { profiles: 0, progress: 0, srs: 0, daily: 0 };
  const now = Date.now();

  (rows.profiles || []).slice(0, LIMITS.profiles).forEach(p => {
    const id = str(p.id, 60);
    if (!id) return;
    stmts.push(db.prepare(
      "INSERT INTO en_profiles (id, account_id, name, emoji, grade, goal, created_at, updated_at, deleted, rev) " +
      "VALUES (?,?,?,?,?,?,?,?,?,?) " +
      "ON CONFLICT(account_id, id) DO UPDATE SET name=excluded.name, emoji=excluded.emoji, grade=excluded.grade, " +
      "goal=excluded.goal, updated_at=excluded.updated_at, deleted=excluded.deleted, rev=excluded.rev " +
      "WHERE excluded.updated_at >= en_profiles.updated_at"
    ).bind(id, acc.id, str(p.name, 20) || "小朋友", str(p.emoji, 8) || null,
      num(p.grade) || 2, num(p.goal) || 15, num(p.created_at) || now, num(p.updated_at) || now,
      p.deleted ? 1 : 0, rev));
    owned.add(id);
    applied.profiles++;
  });

  (rows.progress || []).slice(0, LIMITS.progress).forEach(p => {
    if (!owned.has(str(p.profile_id, 60))) return;
    const stats = String(p.stats_json || "");
    if (stats.length > 200000) return;
    stmts.push(db.prepare(
      "INSERT INTO en_progress (account_id, profile_id, stats_json, updated_at, rev) VALUES (?,?,?,?,?) " +
      "ON CONFLICT(account_id, profile_id) DO UPDATE SET stats_json=excluded.stats_json, " +
      "updated_at=excluded.updated_at, rev=excluded.rev WHERE excluded.updated_at >= en_progress.updated_at"
    ).bind(acc.id, str(p.profile_id, 60), stats, num(p.updated_at) || now, rev));
    applied.progress++;
  });

  (rows.srs || []).slice(0, LIMITS.srs).forEach(s => {
    if (!owned.has(str(s.profile_id, 60))) return;
    const item = str(s.item_id, 80);
    if (!item) return;
    stmts.push(db.prepare(
      "INSERT INTO en_srs (account_id, profile_id, item_id, box, due_at, streak, lapses, last_result, updated_at, deleted, rev) " +
      "VALUES (?,?,?,?,?,?,?,?,?,?,?) " +
      "ON CONFLICT(account_id, profile_id, item_id) DO UPDATE SET box=excluded.box, due_at=excluded.due_at, " +
      "streak=excluded.streak, lapses=excluded.lapses, last_result=excluded.last_result, " +
      "updated_at=excluded.updated_at, deleted=excluded.deleted, rev=excluded.rev " +
      "WHERE excluded.updated_at >= en_srs.updated_at"
    ).bind(acc.id, str(s.profile_id, 60), item, num(s.box), num(s.due_at), num(s.streak),
      num(s.lapses), num(s.last_result) || 0, num(s.updated_at) || now, s.deleted ? 1 : 0, rev));
    applied.srs++;
  });

  (rows.daily || []).slice(0, LIMITS.daily).forEach(d => {
    if (!owned.has(str(d.profile_id, 60))) return;
    const date = str(d.date, 10);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return;
    stmts.push(db.prepare(
      "INSERT INTO en_daily (account_id, profile_id, date, minutes, new_words, reviews, speak_count, speak_seconds, updated_at, rev) " +
      "VALUES (?,?,?,?,?,?,?,?,?,?) " +
      "ON CONFLICT(account_id, profile_id, date) DO UPDATE SET minutes=excluded.minutes, new_words=excluded.new_words, " +
      "reviews=excluded.reviews, speak_count=excluded.speak_count, speak_seconds=excluded.speak_seconds, " +
      "updated_at=excluded.updated_at, rev=excluded.rev WHERE excluded.updated_at >= en_daily.updated_at"
    ).bind(acc.id, str(d.profile_id, 60), date, num(d.minutes), num(d.new_words), num(d.reviews),
      num(d.speak_count), num(d.speak_seconds), num(d.updated_at) || now, rev));
    applied.daily++;
  });

  // 分批执行，避免单条 SQL 太长
  try {
    for (let i = 0; i < stmts.length; i += BATCH) {
      await db.batch(stmts.slice(i, i + BATCH));
    }
  } catch (e) {
    return bad("保存失败：" + String(e && e.message || e).slice(0, 120), 500);
  }

  return json({ ok: true, rev, serverTime: Date.now(), applied });
}
