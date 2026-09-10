#!/usr/bin/env bash
# 重新拉取 Pyodide 运行时到 vendor/pyodide/，并把 lockfile 的 wheel 地址指向 CDN。
# 用法：bash tools/fetch-vendor.sh
set -euo pipefail

VER=v0.26.2
BASE="https://cdn.jsdelivr.net/pyodide/${VER}/full"
DEST="$(cd "$(dirname "$0")/.." && pwd)/vendor/pyodide"
mkdir -p "$DEST"

for f in pyodide.js pyodide.asm.js pyodide.asm.wasm python_stdlib.zip pyodide-lock.json; do
  echo "下载 $f"
  curl -fL "$BASE/$f" -o "$DEST/$f"
done

# Pyodide 0.26.2 还不支持 packageBaseUrl：loadPackage() 是按 pyodide-lock.json 里的
# file_name 相对 indexURL 解析 wheel 地址的。这里把 file_name 改写成 CDN 绝对 URL，
# 于是 numpy / matplotlib 等按需包从 CDN 下载，而核心运行时（asm.wasm/stdlib）仍自托管。
python3 - "$DEST/pyodide-lock.json" "$BASE/" <<'PY'
import re, sys
path, base = sys.argv[1], sys.argv[2]
s = open(path, encoding="utf-8").read()
s = re.sub(r'"file_name": "(?!https?://)([^"]+)"', lambda m: '"file_name": "' + base + m.group(1) + '"', s)
open(path, "w", encoding="utf-8").write(s)
print("pyodide-lock.json 的 file_name 已指向:", base)
PY

PY

# 内置 numpy（无依赖、孩子最常用）：下载到仓库里，避免受第三方 CDN 可用性影响
WHEEL="numpy-1.26.4-cp312-cp312-pyodide_2024_0_wasm32.whl"
mkdir -p "$DEST/wheels"
if [ ! -f "$DEST/wheels/$WHEEL" ]; then
  echo "下载内置 wheel: $WHEEL"
  curl -fL "$BASE/$WHEEL" -o "$DEST/wheels/$WHEEL"
fi

python3 - "$DEST/pyodide-lock.json" "$WHEEL" <<'PY2'
import re, sys
path, wheel = sys.argv[1], sys.argv[2]
s = open(path, encoding="utf-8").read()
new = "/vendor/pyodide/wheels/" + wheel
s = re.sub(r'"file_name": "[^"]*/' + re.escape(wheel) + '"', '"file_name": "' + new + '"', s)
open(path, "w", encoding="utf-8").write(s)
print("numpy 改为使用内置 wheel:", new)
PY2

# 校验内置 wheel 与 lockfile 记录的 sha256 一致
python3 - "$DEST/pyodide-lock.json" "$DEST/wheels/$WHEEL" <<'PY3'
import hashlib, json, sys
lock = json.load(open(sys.argv[1], encoding="utf-8"))
actual = hashlib.sha256(open(sys.argv[2], "rb").read()).hexdigest()
expected = lock["packages"]["numpy"]["sha256"]
assert actual == expected, "wheel 校验失败: %s != %s" % (actual, expected)
print("内置 numpy wheel 校验通过:", actual[:16], "...")
PY3
