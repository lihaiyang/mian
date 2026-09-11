// POST /api/share  → 生成分享短链（作品 / 学习进度）
// GET  /api/share?id=xxx → 读取分享内容（公开，不需要同步码）
import { json, bad, rateLimit, authAccount } from "./_utils.js";

const ALPHABET = "23456789ABCDEFGHJKMNPQRSTUVWXYZ";
function shortId(n) {
  const r = new Uint8Array(n || 8);
  crypto.getRandomValues(r);
  let s = "";
  for (let i = 0; i < r.length; i++) s += ALPHABET[r[i] % ALPHABET.length];
  return s;
}

export async function onRequestPost({ request, env }) {
  const db = env.DB;
  if (!db) return bad("服务端还没配置数据库（缺少 D1 绑定）", 503);
  let body = {};
  try { body = await request.json(); } catch (e) { return bad("请求格式不对"); }

  const auth = await authAccount(db, env, body.code, body.pin);
  if (auth.error) return bad(auth.error, 401);
  const acc = auth.account;
  if (!(await rateLimit(db, "share:" + acc.id, 30, 60))) return bad("分享得有点频繁，稍等一下", 429);

  const kind = body.kind === "progress" ? "progress" : "code";
  const title = String(body.title || "我的作品").slice(0, 60);
  const profileId = String(body.profileId || "").slice(0, 60);
  let content = "";
  if (kind === "code") {
    content = String(body.content || "");
    if (!content.trim()) return bad("这个文件还是空的哦，先写点代码再分享吧");
    if (content.length > 200000) return bad("代码太长啦，换个短一点的分享吧", 413);
  } else {
    content = JSON.stringify({
      nickname: String((body.progress && body.progress.nickname) || "小朋友").slice(0, 20),
      avatar: String((body.progress && body.progress.avatar) || "🐼").slice(0, 8),
      stats: (body.progress && body.progress.stats) || {},
      missions: ((body.progress && body.progress.missions) || []).slice(0, 40),
      badges: ((body.progress && body.progress.badges) || []).slice(0, 40)
    });
    if (content.length > 100000) return bad("数据太大啦", 413);
  }

  const id = shortId(8);
  await db.prepare(
    "INSERT INTO shares (id, account_id, kind, profile_id, title, content, created_at, views, revoked) VALUES (?,?,?,?,?,?,?,0,0)"
  ).bind(id, acc.id, kind, profileId, title, content, Math.floor(Date.now() / 1000)).run();

  const origin = new URL(request.url).origin;
  return json({ ok: true, id: id, url: origin + (kind === "code" ? "/s/" : "/p/") + id });
}

export async function onRequestGet({ request, env }) {
  const db = env.DB;
  if (!db) return bad("服务端还没配置数据库（缺少 D1 绑定）", 503);
  const id = (new URL(request.url).searchParams.get("id") || "").toUpperCase();
  if (!/^[0-9A-Z]{6,12}$/.test(id)) return bad("分享编号不对", 400);
  const row = await db.prepare("SELECT id, kind, title, content, created_at, views FROM shares WHERE id = ? AND revoked = 0")
    .bind(id).first();
  if (!row) return bad("这个分享不存在，或者已经被撤销了", 404);
  return json({ ok: true, share: { id: row.id, kind: row.kind, title: row.title, content: row.content, createdAt: row.created_at, views: row.views } });
}