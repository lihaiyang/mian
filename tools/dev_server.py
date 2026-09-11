#!/usr/bin/env python3
"""本地调试用的小服务器（等价于 wrangler pages dev 的静态部分）。

为什么需要它：Pyodide 的 input() 依赖 SharedArrayBuffer，
而 SharedArrayBuffer 要求页面带上 COOP / COEP 两个响应头，
直接双击 index.html 或者用普通的 python -m http.server 都不行。

用法：
    python3 tools/dev_server.py [端口]      # 默认 8788
然后浏览器打开 http://127.0.0.1:8788
（/api/* 的云同步接口这里不提供，页面会自动走离线模式。）
"""

import functools
import http.server
import os
import socketserver
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


class Handler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header("Cross-Origin-Opener-Policy", "same-origin")
        self.send_header("Cross-Origin-Embedder-Policy", "require-corp")
        self.send_header("Cache-Control", "no-store")
        super().end_headers()

    def log_message(self, fmt, *args):
        # 只打印错误，避免刷屏
        if args and str(args[1]).startswith(("4", "5")):
            sys.stderr.write("%s - %s\n" % (self.address_string(), fmt % args))


def main():
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 8788
    handler = functools.partial(Handler, directory=ROOT)
    socketserver.TCPServer.allow_reuse_address = True
    with socketserver.ThreadingTCPServer(("127.0.0.1", port), handler) as httpd:
        print("🐼 萌码本地预览：http://127.0.0.1:%d  (Ctrl+C 结束)" % port)
        httpd.serve_forever()


if __name__ == "__main__":
    main()
