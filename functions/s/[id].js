// GET /s/<id> —— 公开的作品分享页（只读）
import { shell, escapeHtml, html } from "../_page.js";

export async function onRequestGet({ params, env }) {
  const db = env.DB;
  const id = String(params.id || "").toUpperCase();
  if (!/^[0-9A-Z]{6,12}$/.test(id)) return html(shell("分享不存在", "<div class=\"card\"><h1>分享不存在</h1></div>"), 404);
  const row = await db.prepare("SELECT id, kind, title, content, created_at, views FROM shares WHERE id = ? AND revoked = 0 AND kind = 'code'")
    .bind(id).first();
  if (!row) return html(shell("分享不存在", "<div class=\"card\"><h1>这个分享看不到啦</h1><p class=\"sub\">可能是链接抄错了，或者作者撤销了分享。</p></div>"), 404);
  try { await db.prepare("UPDATE shares SET views = views + 1 WHERE id = ?").bind(id).run(); } catch (e) {}

  const code = escapeHtml(row.content || "");
  const date = new Date((row.created_at || 0) * 1000).toLocaleDateString("zh-CN");
  const body =
    '<div class="card"><h1>' + escapeHtml(row.title || "我的作品") + '</h1>' +
    '<div class="sub">来自萌码 Python 小朋友的作品 · ' + date + ' · 看过 ' + (row.views || 0) + ' 次</div>' +
    '<pre id="code">' + code + '</pre>' +
    '<div class="row" style="margin-top:14px">' +
    '<button class="btn" onclick="navigator.clipboard.writeText(document.getElementById(\'code\').textContent).then(function(){this.textContent=\'✅ 已复制\'}.bind(this))">📋 复制代码</button>' +
    '<a class="btn ghost" href="/?share=' + encodeURIComponent(id) + '">🚀 在萌码里打开</a>' +
    '</div></div>';
  return html(shell(row.title || "我的作品", body));
}