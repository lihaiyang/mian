// 公共页面渲染工具（文件名以 _ 开头，Pages 不会把它当成路由）

export function escapeHtml(s) {
  return String(s === undefined || s === null ? "" : s).replace(/[&<>"]/g, function (c) {
    return { "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;" }[c];
  });
}

export function html(body, status = 200) {
  return new Response(body, {
    status: status,
    headers: { "content-type": "text/html; charset=utf-8", "cache-control": "no-store" }
  });
}

export function shell(title, bodyHtml) {
  const t = escapeHtml(title);
  return "<!DOCTYPE html>" +
    '<html lang="zh-CN"><head><meta charset="UTF-8">' +
    '<meta name="viewport" content="width=device-width, initial-scale=1.0">' +
    "<title>" + t + " · 萌码 Python</title>" +
    '<link rel="icon" href="data:,">' +
    "<style>" +
    ':root{--bg:#F5F7FF;--card:#fff;--text:#1E293B;--muted:#64748B;--primary:#5B5FED;--soft:#EEF2F7}' +
    "*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--text);" +
    "font-family:-apple-system,BlinkMacSystemFont,'PingFang SC','Microsoft YaHei',sans-serif;line-height:1.7}" +
    ".wrap{max-width:820px;margin:0 auto;padding:28px 18px 60px}" +
    ".brand{display:flex;align-items:center;gap:8px;font-weight:800;font-size:15px;color:var(--primary);margin-bottom:18px}" +
    ".card{background:var(--card);border-radius:18px;padding:20px;box-shadow:0 8px 30px rgba(15,23,42,.07);margin-bottom:16px}" +
    "h1{font-size:20px;margin:0 0 6px}.sub{color:var(--muted);font-size:13px;margin-bottom:14px}" +
    "pre{background:#1E1E2E;color:#CDD6F4;padding:16px;border-radius:12px;overflow:auto;font-size:13px;line-height:1.6}" +
    ".row{display:flex;gap:10px;flex-wrap:wrap;align-items:center}" +
    "a.btn,button.btn{display:inline-flex;align-items:center;gap:6px;border:none;cursor:pointer;" +
    "background:var(--primary);color:#fff;padding:9px 16px;border-radius:999px;font-weight:700;font-size:13px;text-decoration:none}" +
    ".btn.ghost{background:var(--soft);color:var(--text)}" +
    ".stats{display:grid;grid-template-columns:repeat(auto-fit,minmax(96px,1fr));gap:10px}" +
    ".stat{background:var(--soft);border-radius:14px;padding:10px;text-align:center}" +
    ".stat b{display:block;font-size:20px}.stat span{font-size:11px;color:var(--muted)}" +
    ".list{display:flex;flex-direction:column;gap:8px}" +
    ".item{display:flex;gap:8px;align-items:flex-start;background:var(--soft);border-radius:12px;padding:9px 12px;font-size:13px}" +
    ".item.done{background:#F0FDF4}" +
    ".badges{display:grid;grid-template-columns:repeat(auto-fill,minmax(96px,1fr));gap:8px}" +
    ".badge{background:linear-gradient(160deg,#FFFBEB,#FEF3C7);border:2px solid #FDE68A;border-radius:12px;padding:8px;text-align:center;font-size:11px}" +
    ".badge.locked{background:#F8FAFC;border-color:#E2E8F0;color:#94A3B8}" +
    ".foot{color:var(--muted);font-size:12px;text-align:center;margin-top:20px}" +
    "</style></head><body><div class=\"wrap\">" +
    '<div class="brand"><span>🐼</span><span>萌码 Python · 奇幻编程工坊</span></div>' +
    bodyHtml +
    '<div class="foot">用「萌码 Python」创作 · <a href="/">打开工坊</a></div>' +
    "</div></body></html>";
}