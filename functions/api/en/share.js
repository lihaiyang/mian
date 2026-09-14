// 英语站分享：只读周报（给爷爷奶奶看的那种）
//   POST /api/en/share { code, pin, kind, title, content } → { ok, id }
//   GET  /api/en/share?id=<id>                            → { ok, title, content, createdAt }
// 内容上限 32KB；音频永远不上传（录音只在本机）。
import { json, bad, rateLimit, authAccount, genCode, normalizeCode, nowSec, clientIp } from "../_utils.js";

const MAX_CONTENT = 32768;

function str(v, n) { return String(v === undefined || v === null ? "" : v).slice(0, n); }

export async function onRequestPost({ request, env }) {
  const db = env.DB;
  if (!db) return bad("服务端还没配置数据库（缺少 D1 绑定）", 503);
  let body = {};
  try { body = await request.json(); } catch (e) { return bad("请求格式不对"); }
  const auth = await authAccount(db, env, body.code, body.pin);
  if (auth.error) return bad(auth.error, 401);
  const acc = auth.account;
  if (!(await rateLimit(db, "en:share:" + acc.id, 20, 60))) return bad("分享得有点频繁，歇一会再试", 429);

  const content = String(body.content || "");
  if (!content) return bad("没有要分享的内容");
  if (content.length > MAX_CONTENT) return bad("内容太长啦（超过 32KB）", 413);

  let id = "";
  for (let i = 0; i < 5; i++) {
    const cand = normalizeCode(genCode(8)).slice(0, 8).toLowerCase();
    const exists = await db.prepare("SELECT id FROM en_shares WHERE id = ?").bind(cand).first();
    if (!exists) { id = cand; break; }
  }
  if (!id) return bad("生成分享链接失败，请重试", 500);

  await db.prepare(
    "INSERT INTO en_shares (id, account_id, kind, profile_id, title, content, created_at, views, revoked) VALUES (?,?,?,?,?,?,?,0,0)"
  ).bind(id, acc.id, str(body.kind, 20) || "report", str(body.profile_id, 60) || null,
    str(body.title, 60) || "学习周报", content, nowSec()).run();

  return json({ ok: true, id: id, url: "/en/share.html?id=" + id });
}

export async function onRequestGet({ request, env }) {
  const db = env.DB;
  if (!db) return bad("服务端还没配置数据库（缺少 D1 绑定）", 503);
  const url = new URL(request.url);
  const id = normalizeCode(url.searchParams.get("id") || "").toLowerCase().slice(0, 12);
  if (!id) return bad("缺少 id");
  if (!(await rateLimit(db, "en:shareget:" + clientIp(request), 240, 60))) return bad("访问太频繁", 429);

  const row = await db.prepare(
    "SELECT id, kind, title, content, created_at, views, revoked FROM en_shares WHERE id = ?"
  ).bind(id).first();
  if (!row || row.revoked) return bad("这个分享已经失效了", 404);

  try { await db.prepare("UPDATE en_shares SET views = views + 1 WHERE id = ?").bind(id).run(); } catch (e) {}

  return json({ ok: true, id: row.id, kind: row.kind, title: row.title,
    content: row.content, createdAt: row.created_at, views: (row.views || 0) + 1 });
}
