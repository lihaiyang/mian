// 萌学园平台 · 通用云同步
//
//   GET  /api/v1/sync?subject=typing&code=..&pin=..&since=<rev>  → 增量拉取
//   POST /api/v1/sync { subject, code, pin, profiles:[…], rows:{ entity:[…] } } → 推送
//
// 与 /api/sync（萌码 Python）、/api/en/sync（萌语岛）**同构**，协议完全一样：
//   account_id 作用域 + 账号级单调 rev + 按行 updated_at 做 LWW + 软删除墓碑。
//
// 区别只有一个，也是它存在的理由：**它是通用的**。
// 所有学科的状态都落在同一张 sub_rows 表里，payload_json 对服务端是黑盒，
// 服务端不理解内容、也不校验内容。所以：
//
//   ★ 以后加一个学科，后端一行都不用改，数据库也不用迁移。 ★
//
// 这是"加一科很便宜"的关键。详见 docs/多学科平台架构设计.md 第 5 节。
//
// 老站的两个端点（/api/sync、/api/en/sync）保持原样不动——它们服务于
// 各自的专用表，改它们只有审美收益，风险却是孩子们的作品和进度。
import { json, bad, rateLimit, authAccount, nowSec } from "../_utils.js";

const MAX_TOTAL = 262144;                    // 一次推送 256KB
const MAX_PAYLOAD = 120000;                  // 单行 payload 上限
const MAX_ROWS_PER_ENTITY = 2000;
const MAX_ENTITIES = 12;
const BATCH = 40;

function str(v, n) { return String(v === undefined || v === null ? "" : v).slice(0, n); }
function num(v) { return Number(v) || 0; }

// 学科 id：小写字母开头，只允许小写字母/数字/下划线。防止把奇怪的东西写进 subject 列。
const SUBJECT_RE = /^[a-z][a-z0-9_]{0,30}$/;
// 实体名：同上
const ENTITY_RE = /^[a-z][a-z0-9_]{0,30}$/;

function subjectOf(v) {
  const s = str(v, 32);
  return SUBJECT_RE.test(s) ? s : null;
}

export async function onRequestGet({ request, env }) {
  const db = env.DB;
  if (!db) return bad("服务端还没配置数据库（缺少 D1 绑定）", 503);

  const url = new URL(request.url);
  const subject = subjectOf(url.searchParams.get("subject"));
  if (!subject) return bad("缺少或非法的 subject");

  const code = url.searchParams.get("code");
  const pin = url.searchParams.get("pin");
  const since = parseInt(url.searchParams.get("since") || "0", 10) || 0;

  const auth = await authAccount(db, env, code, pin);
  if (auth.error) return bad(auth.error, 401);
  const acc = auth.account;
  if (!(await rateLimit(db, "v1pull:" + acc.id, 240, 60))) return bad("同步太频繁啦，稍等一下", 429);

  // 档案是跨学科共用的（一个小朋友在哪个学科都是同一个人），所以每次都带回来
  const profiles = (await db.prepare(
    "SELECT id, name, emoji, created_at, updated_at, deleted, rev FROM profiles WHERE account_id = ? AND rev > ?"
  ).bind(acc.id, since).all()).results || [];

  const rows = (await db.prepare(
    "SELECT entity, row_id, profile_id, payload_json, updated_at, deleted, rev FROM sub_rows " +
    "WHERE account_id = ? AND subject = ? AND rev > ?"
  ).bind(acc.id, subject, since).all()).results || [];

  // 按实体分组，前端拿到就能直接用（和 /api/en/sync 的形状保持一致）
  //
  // ⚠️ profile_id 必须回传。sub_rows 的主键是
  // (account_id, subject, entity, row_id) —— **不含 profile_id**，
  // 所以一个账号下多个孩子的行是并列的。客户端不拿到 profile_id 就无法
  // 分辨"这行是谁的"，会把别人的进度导进当前档案。
  const grouped = {};
  for (const r of rows) {
    (grouped[r.entity] = grouped[r.entity] || []).push({
      row_id: r.row_id,
      profile_id: r.profile_id,
      payload_json: r.payload_json,
      updated_at: r.updated_at,
      deleted: r.deleted
    });
  }

  return json({
    ok: true, serverTime: Date.now(), rev: num(acc.rev), subject,
    nickname: acc.nickname || null, avatar: acc.avatar || null, hasPin: !!acc.pin_hash,
    profiles, rows: grouped
  });
}

export async function onRequestPost({ request, env }) {
  const db = env.DB;
  if (!db) return bad("服务端还没配置数据库（缺少 D1 绑定）", 503);

  let body = {};
  try { body = await request.json(); } catch (e) { return bad("请求格式不对"); }

  const subject = subjectOf(body.subject);
  if (!subject) return bad("缺少或非法的 subject");

  const auth = await authAccount(db, env, body.code, body.pin);
  if (auth.error) return bad(auth.error, 401);
  const acc = auth.account;
  if (!(await rateLimit(db, "v1push:" + acc.id, 120, 60))) return bad("同步太频繁啦，稍等一下", 429);

  const profiles = Array.isArray(body.profiles) ? body.profiles : [];
  const rows = (body.rows && typeof body.rows === "object") ? body.rows : {};

  let raw = "";
  try { raw = JSON.stringify({ profiles, rows }); } catch (e) { return bad("请求格式不对"); }
  if (raw.length > MAX_TOTAL) return bad("这次要保存的内容太多了，稍后再试", 413);

  // rev 原子分配：两台设备同时推必须拿到不同的 rev，否则第三台增量拉取会漏
  let rev = num(acc.rev) + 1;
  try {
    const bumped = await db.prepare("UPDATE accounts SET rev = rev + 1 WHERE id = ? RETURNING rev")
      .bind(acc.id).first();
    if (bumped && bumped.rev) rev = num(bumped.rev);
  } catch (e) { /* 兼容不支持 RETURNING 的环境 */ }

  const now = Date.now();
  const stmts = [];
  const applied = { profiles: 0, rows: 0 };
  // 被丢弃的行要**记账并回报**。原来是静默丢弃 —— 客户端只拿到一个计数，
  // 根本发现不了自己少传了东西（Python 那个端点专门做了 dropped 记账，
  // 注释写着"绝不静默丢数据"，平台端点当时漏了）。
  const dropped = { entities: 0, profiles: 0, rows: 0, badRows: 0, noProfile: 0, oversized: 0 };

  // ---------- 档案（跨学科共用表）----------
  // 先写档案，这样下面 sub_rows 的 profile_id 才有归属可查
  dropped.profiles = Math.max(0, profiles.length - 8);
  profiles.slice(0, 8).forEach(p => {
    const id = str(p.id, 60);
    if (!id) return;
    stmts.push(db.prepare(
      "INSERT INTO profiles (id, account_id, name, emoji, created_at, updated_at, deleted, rev) " +
      "VALUES (?,?,?,?,?,?,?,?) " +
      "ON CONFLICT(account_id, id) DO UPDATE SET name=excluded.name, emoji=excluded.emoji, " +
      "updated_at=excluded.updated_at, deleted=excluded.deleted, rev=excluded.rev " +
      "WHERE excluded.updated_at >= profiles.updated_at"
    ).bind(id, acc.id, str(p.name, 20) || "小朋友", str(p.emoji, 8) || null,
      num(p.created_at) || now, num(p.updated_at) || now, p.deleted ? 1 : 0, rev));
    applied.profiles++;
  });

  // ---------- 学科状态 ----------
  // 账号下已有哪些档案：推送里出现不属于本账号的 profile_id 一律丢弃（防串号）
  const owned = new Set(((await db.prepare(
    "SELECT id FROM profiles WHERE account_id = ?").bind(acc.id).all()).results || []).map(r => r.id));
  profiles.forEach(p => { if (p && p.id) owned.add(str(p.id, 60)); });

  const validEntities = Object.keys(rows).filter(e => ENTITY_RE.test(e));
  const entityNames = validEntities.slice(0, MAX_ENTITIES);
  dropped.entities = Math.max(0, validEntities.length - MAX_ENTITIES);

  entityNames.forEach(entity => {
    const list = Array.isArray(rows[entity]) ? rows[entity] : [];
    dropped.rows += Math.max(0, list.length - MAX_ROWS_PER_ENTITY);
    list.slice(0, MAX_ROWS_PER_ENTITY).forEach(r => {
      const rowId = str(r && (r.row_id || r.id), 80);
      if (!rowId) { dropped.badRows++; return; }
      const pid = str(r.profile_id, 60);
      if (!pid || !owned.has(pid)) { dropped.noProfile++; return; }   // 不属于本账号的档案

      let payload = r.payload_json;
      if (payload === undefined || payload === null) payload = "";
      payload = String(payload);
      if (payload.length > MAX_PAYLOAD) { dropped.oversized++; return; }

      // 关键：sub_rows 的主键是 (account_id, subject, entity, row_id)，
      // **不含 profile_id** —— profile_id 只是 payload 的一部分。
      // 这样学科可以自己决定一行是"每个档案一行"还是"账号级一行"。
      stmts.push(db.prepare(
        "INSERT INTO sub_rows (account_id, subject, entity, row_id, profile_id, payload_json, updated_at, deleted, rev) " +
        "VALUES (?,?,?,?,?,?,?,?,?) " +
        "ON CONFLICT(account_id, subject, entity, row_id) DO UPDATE SET " +
        "payload_json=excluded.payload_json, updated_at=excluded.updated_at, " +
        "deleted=excluded.deleted, rev=excluded.rev " +
        "WHERE excluded.updated_at >= sub_rows.updated_at"
      ).bind(acc.id, subject, entity, rowId, pid, payload,
        num(r.updated_at) || now, r.deleted ? 1 : 0, rev));
      applied.rows++;
    });
  });

  try {
    for (let i = 0; i < stmts.length; i += BATCH) {
      await db.batch(stmts.slice(i, i + BATCH));
    }
  } catch (e) {
    return bad("保存失败：" + String(e && e.message || e).slice(0, 120), 500);
  }

  // dropped 全为 0 时不占地方；有值就带上，客户端可以据此提示"这次没传完"
  const anyDropped = Object.keys(dropped).some(k => dropped[k] > 0);
  return json({ ok: true, rev, serverTime: Date.now(), subject, applied,
                dropped: anyDropped ? dropped : undefined });
}
