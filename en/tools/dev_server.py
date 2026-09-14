#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""dev_server.py —— 萌语岛本地预览服务器（只读静态文件，不写任何东西）。

和仓库根目录 tools/dev_server.py 的区别：
    * 默认端口 8799；静态根是**仓库根**，所以 /en/... 这类路径能直接访问
    * 默认**不加** COOP / COEP（英语岛不需要 SharedArrayBuffer）；要加就传 --coop
    * 404 给一页友好的提示（含「你是不是想找」候选），不是干巴巴的 Not Found

用法：
    python3 en/tools/dev_server.py                # http://127.0.0.1:8799/en/
    python3 en/tools/dev_server.py --port 9000
    python3 en/tools/dev_server.py --coop         # 额外带上 COOP/COEP 两个响应头
    python3 en/tools/dev_server.py --root .       # 换个静态根（默认仓库根）
"""

import argparse
import difflib
import functools
import html
import http.server
import os
import socketserver
import sys
import urllib.parse

EN_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
REPO_ROOT = os.path.dirname(EN_ROOT)      # 静态根：仓库根，/en/... 才访问得到
DEFAULT_PORT = 8799


class Handler(http.server.SimpleHTTPRequestHandler):
    server_version = "MengYuDaoDev/1.0"
    protocol_version = "HTTP/1.1"
    coop = False

    # 语料/音频/字体的 MIME，别让浏览器把 m4a 当文本
    extensions_map = dict(http.server.SimpleHTTPRequestHandler.extensions_map)
    extensions_map.update({
        ".m4a": "audio/mp4",
        ".m4b": "audio/mp4",
        ".opus": "audio/ogg",
        ".ogg": "audio/ogg",
        ".woff2": "font/woff2",
        ".woff": "font/woff",
        ".mjs": "text/javascript",
        ".js": "text/javascript",
        ".json": "application/json",
        ".webmanifest": "application/manifest+json",
        ".svg": "image/svg+xml",
    })

    def end_headers(self):
        # 本地调试：永远拿最新的，别被缓存骗
        self.send_header("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0")
        self.send_header("Pragma", "no-cache")
        if self.coop:
            self.send_header("Cross-Origin-Opener-Policy", "same-origin")
            self.send_header("Cross-Origin-Embedder-Policy", "require-corp")
        super().end_headers()

    def log_message(self, fmt, *args):
        # 只打印出错的那几条，正常请求不刷屏
        if len(args) >= 2 and str(args[1]).startswith(("4", "5")):
            sys.stderr.write("  %s - %s\n" % (self.address_string(), fmt % args))

    # ------------------------------------------------------------ 404

    def send_error(self, code, message=None, explain=None):
        if code == 404:
            self.send_friendly_404()
            return
        super().send_error(code, message, explain)

    def _suggest(self, fs_path):
        """在所在目录里找几个名字相近的文件，帮孩子/家长少走弯路。"""
        folder = fs_path if os.path.isdir(fs_path) else os.path.dirname(fs_path)
        base = "" if os.path.isdir(fs_path) else os.path.basename(fs_path)
        if not base or not os.path.isdir(folder):
            return []
        try:
            names = [n for n in os.listdir(folder) if not n.startswith(".")]
        except OSError:
            return []
        hit = difflib.get_close_matches(base, names, n=5, cutoff=0.5)
        if not hit:
            hit = [n for n in names if n.lower().startswith(base[:3].lower())][:5]
        return hit

    def send_friendly_404(self):
        raw = urllib.parse.unquote(self.path.split("?", 1)[0])
        clean = raw.split("?")[0]
        fs_path = os.path.join(self.directory, clean.lstrip("/"))
        rel_dir = os.path.dirname(clean) or "/"
        if not rel_dir.endswith("/"):
            rel_dir += "/"

        links = []
        for name in self._suggest(fs_path):
            href = urllib.parse.quote(rel_dir + name)
            links.append('<li><a href="%s">%s</a></li>' % (href, html.escape(name)))
        tips = "".join(links) or "<li>这个目录下没有名字相近的文件</li>"

        body = """<!DOCTYPE html>
<html lang="zh-CN"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>这里没有页面 · 萌语岛</title>
<style>
  :root { --paper:#F7EFE0; --ink:#241E19; --yellow:#F2B33D; --teal:#2E9E8F; --violet:#6A4C93; }
  body { margin:0; padding:48px 20px; background:var(--paper); color:var(--ink);
         font:18px/1.7 -apple-system,"PingFang SC","Microsoft YaHei",sans-serif; }
  .card { max-width:640px; margin:0 auto; background:#fff; border:3px solid var(--ink);
          border-radius:20px; padding:28px 30px; box-shadow:6px 6px 0 var(--yellow); }
  h1 { font-size:26px; margin:0 0 8px; }
  .big { font-size:52px; margin:0 0 4px; }
  code { background:#F2E9D8; padding:2px 8px; border-radius:8px; word-break:break-all; }
  a { color:var(--violet); }
  ul { padding-left:22px; }
  .go { display:inline-block; margin-top:8px; padding:12px 20px; border:3px solid var(--ink);
        border-radius:20px; background:var(--teal); color:#fff; text-decoration:none; font-weight:700; }
</style></head><body>
<div class="card">
  <p class="big" aria-hidden="true">🐼</p>
  <h1>这座小岛还没建好～</h1>
  <p>没有找到 <code>%(path)s</code>，我们换个地方逛逛吧。</p>
  <p><strong>你是不是想找：</strong></p>
  <ul>%(tips)s</ul>
  <p>常用入口：</p>
  <ul>
    <li><a href="/en/">/en/</a> —— 英语岛目录</li>
    <li><a href="/">/</a> —— 仓库首页</li>
  </ul>
  <a class="go" href="/en/">🏝 回英语岛</a>
</div></body></html>
""" % {"path": html.escape(clean), "tips": tips}

        payload = body.encode("utf-8")
        self.send_response(404)
        self.send_header("Content-Type", "text/html; charset=utf-8")
        self.send_header("Content-Length", str(len(payload)))
        self.end_headers()
        if self.command != "HEAD":
            self.wfile.write(payload)


class Server(socketserver.ThreadingTCPServer):
    allow_reuse_address = True
    daemon_threads = True


def main(argv=None):
    ap = argparse.ArgumentParser(description="萌语岛本地预览服务器（静态只读）")
    ap.add_argument("port_pos", nargs="?", type=int, default=None, help="端口（等价于 --port）")
    ap.add_argument("--port", type=int, default=None, help="端口，默认 %d" % DEFAULT_PORT)
    ap.add_argument("--host", default="127.0.0.1", help="监听地址，默认 127.0.0.1")
    ap.add_argument("--coop", action="store_true", help="带上 COOP/COEP 响应头（默认不带）")
    ap.add_argument("--root", default=REPO_ROOT, help="静态根目录，默认仓库根")
    args = ap.parse_args(argv if argv is not None else sys.argv[1:])

    port = args.port or args.port_pos or DEFAULT_PORT
    root = os.path.abspath(args.root)
    if not os.path.isdir(root):
        print("✗ 静态根不存在：%s" % root, file=sys.stderr)
        return 2

    Handler.coop = bool(args.coop)
    handler = functools.partial(Handler, directory=root)
    try:
        httpd = Server((args.host, port), handler)
    except OSError as e:
        print("✗ 端口 %d 用不了：%s" % (port, e), file=sys.stderr)
        print("  换一个端口试试：python3 en/tools/dev_server.py --port %d" % (port + 1), file=sys.stderr)
        return 2

    print("🐼 萌语岛本地预览")
    print("   地址：  http://%s:%d/en/" % (args.host, port))
    print("   静态根：%s" % root)
    print("   COOP/COEP：%s" % ("开启" if args.coop else "关闭（英语岛不需要；要开就加 --coop）"))
    print("   缓存：  Cache-Control: no-store（每次都拿最新的）")
    print("   Ctrl+C 结束")
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\n👋 已停止")
    finally:
        httpd.server_close()
    return 0


if __name__ == "__main__":
    sys.exit(main())
