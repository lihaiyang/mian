// GET /p/<id> —— 公开的学习进度页（只读，给家长/老师看）
import { shell, escapeHtml, html } from "../_page.js";

export async function onRequestGet({ params, env }) {
  const db = env.DB;
  const id = String(params.id || "").toUpperCase();
  if (!/^[0-9A-Z]{6,12}$/.test(id)) return html(shell("进度不存在", "<div class=\"card\"><h1>进度不存在</h1></div>"), 404);
  const row = await db.prepare("SELECT id, kind, title, content, created_at, views FROM shares WHERE id = ? AND revoked = 0 AND kind = 'progress'")
    .bind(id).first();
  if (!row) return html(shell("进度不存在", "<div class=\"card\"><h1>这份学习进度看不到啦</h1><p class=\"sub\">可能是链接抄错了，或者已撤销分享。</p></div>"), 404);
  try { await db.prepare("UPDATE shares SET views = views + 1 WHERE id = ?").bind(id).run(); } catch (e) {}

  let d = {};
  try { d = JSON.parse(row.content || "{}"); } catch (e) { d = {}; }
  const st = d.stats || {};
  const days = Array.isArray(st.days) ? st.days.length : 0;
  const date = new Date((row.created_at || 0) * 1000).toLocaleDateString("zh-CN");

  const stat = (v, label) => '<div class="stat"><b>' + escapeHtml(v) + '</b><span>' + label + '</span></div>';
  const stats =
    '<div class="stats">' + stat(st.runs || 0, "运行次数") + stat(st.successes || 0, "成功次数") +
    stat(days, "学习天数") + stat((d.badges || []).filter(b => b.got).length, "获得徽章") + '</div>';

  const missions = (d.missions || []).map(m =>
    '<div class="item' + (m.done ? " done" : "") + '"><span>' + (m.done ? "✅" : "⬜") + '</span><span>' + escapeHtml(m.emoji || "") + '</span><span>' + escapeHtml(m.title || "") + '</span></div>'
  ).join("");

  const badges = (d.badges || []).map(b =>
    '<div class="badge' + (b.got ? "" : " locked") + '"><div style="font-size:18px">' + (b.got ? escapeHtml(b.emoji || "🏅") : "🔒") + '</div>' + escapeHtml(b.title || "") + '</div>'
  ).join("");

  const body =
    '<div class="card"><h1>' + escapeHtml(d.avatar || "🐼") + " " + escapeHtml(d.nickname || "小朋友") + ' 的学习进度</h1>' +
    '<div class="sub">这份进度由小朋友自己分享 · ' + date + '</div>' + stats + '</div>' +
    (missions ? '<div class="card"><h1>🎯 闯关任务</h1><div class="list">' + missions + '</div></div>' : "") +
    (badges ? '<div class="card"><h1>🏅 成就徽章</h1><div class="badges">' + badges + '</div></div>' : "") +
    '<div class="card"><div class="sub" style="margin:0">💡 这是只读页面，家长和老师可以看到进度，但不能修改小朋友的作品。</div></div>';
  return html(shell((d.nickname || "小朋友") + " 的学习进度", body));
}