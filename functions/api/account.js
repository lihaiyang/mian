// POST /api/account —— 创建同步码 / 登录 / 设置 PIN / 换新码
import { json, bad, sha256Hex, genCode, normalizeCode, pepperOf, rateLimit, authAccount, nowSec, clientIp } from "./_utils.js";

export async function onRequestPost({ request, env }) {
  const db = env.DB;
  if (!db) return bad("服务端还没配置数据库（缺少 D1 绑定）", 503);

  let body = {};
  try { body = await request.json(); } catch (e) { return bad("请求格式不对"); }
  const action = String(body.action || "");
  const ip = clientIp(request);
  if (!(await rateLimit(db, "acct:" + ip, 40, 60))) return bad("操作有点频繁，休息一下再试", 429);

  // ---------- 创建新账号：发一个同步码 ----------
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
        id, codeHash, pinHash,
        String(body.nickname || "").slice(0, 20) || null,
        String(body.avatar || "").slice(0, 8) || null,
        nowSec(), nowSec()
      ).run();
      return json({ ok: true, code: code, accountId: id, hasPin: !!pinHash, serverTime: Date.now() });
    }
    return bad("生成同步码失败，请重试", 500);
  }

  // ---------- 用同步码登录（换设备） ----------
  if (action === "login") {
    if (!(await rateLimit(db, "login:" + ip, 20, 60))) return bad("试得太频繁啦，等一分钟再试", 429);
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

  // ---------- 其它操作都要先验证同步码 ----------
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
      return json({ ok: true, code: code });
    }
    return bad("生成新码失败，请重试", 500);
  }

  return bad("未知操作");
}