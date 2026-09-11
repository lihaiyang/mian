# 🐼 萌码 Python · 奇幻编程工坊

给小朋友用的在线 Python 编程工坊：浏览器里直接跑真正的 Python 3，配上小海龟画画、积木代码、趣味宝库、闯关任务和成长档案。

线上地址：<https://mian.lihaiyang.net> （备用：<https://mian-1ri.pages.dev>）

## 功能一览

| 模块 | 说明 |
| --- | --- |
| 代码宝箱 | 多文件管理、新建/重命名/删除、自动保存、导入 .py、打包下载 zip、分享链接 |
| 编辑器 | CodeMirror 5 语法高亮、智能补全（按 import 与别名推断，带中文说明）、中文标点实时体检、护眼大字号、字号与主题记忆 |
| 运行引擎 | Pyodide（Python 3.12，WebAssembly）跑在 **Web Worker** 里，主界面永不卡死；命令行式 `input()`；⏹ 可中断死循环 |
| 单步调试 | 🐾 单步模式：逐行暂停、高亮当前行，「下一步 / 一路跑完」 |
| 海龟画室 | Canvas 小海龟：前进转向、画圆填色、速度调节、保存画作、作品卡（合成分享图） |
| 趣味宝库 | 13 个示例、5 个分类（入门/海龟/游戏/数学/文字），星级 + 一句话说明，点击即打开 |
| 成长档案 | 多小伙伴档案（各自独立的作品库与统计）、学习记录、12 个闯关任务、13 枚成就徽章 |
| 数据文件 | Python 里 `open("日记.txt","w")` 写出的文件会被保存，刷新后自动找回 |
| 小侦探报错 | 17 类常见错误的中文诊断、出错源码行、跨函数「出错路线」、一键标点体检 / 回到上次成功 |
| 第三方库 | `import numpy` / `matplotlib` 等按需从 CDN 拉取 wheel，仓库不用塞 15MB |

## 目录结构

```
index.html              页面结构（含各弹窗）
css/style.css           全部样式（含暗色模式）
js/app.js               主流程：文件/弹窗/主题/分享/快照/趣味宝库
js/editor.js            CodeMirror 封装：补全、标点体检、单步行高亮
js/file-tree.js         文件库（按档案命名空间隔离存储）
js/progress.js          成长档案：多档案 + 学习记录 + 闯关任务 + 徽章
js/python-runner.js     主线程侧：消息分发、终端、输入、单步控制、报错向导
js/python-worker.js     Worker 侧：Pyodide、输入 SAB、单步 tracer、虚拟文件系统
js/turtle-canvas.js     海龟画布引擎
js/examples.js          示例库与分类元数据
js/poster.js            作品卡（PNG 合成）
js/zip-writer.js        零依赖 ZIP 打包
vendor/                 CodeMirror / Pyodide / confetti（全部自托管，含 python_stdlib.zip）
tools/fetch-vendor.sh   重新拉取 Pyodide 并把 lockfile 指向 CDN
_headers                COOP/COEP（SharedArrayBuffer 必需）与缓存策略
```

## ⚠️ 改完 css/js 后必须做的一件事：改版本号

`mian.lihaiyang.net` 上 CDN 对 `/css/*`、`/js/*` 用的是 **4 小时**默认缓存（实测 `cache-control: public, max-age=14400`，会盖掉 `_headers` 里的设置）。
如果只改文件不改 URL，浏览器最长 4 小时内仍会用旧文件，于是出现**新 HTML + 旧 CSS** 的错版（例如工具按钮竖着堆成一列）。

所以每次改 `css/style.css` 或 `js/*.js` 之后，把这两处的版本号一起改掉再部署：

1. `index.html` 里所有 `css/....css?v=xxxxxxxx` 和 `js/....js?v=xxxxxxxx`
2. `js/python-runner.js` 里 `new Worker("js/python-worker.js?v=xxxxxxxx")`

命令（把版本号换成当天，例如 `20260912a`）：

```bash
OLD=20260911b; NEW=20260912a
sed -i "" "s/$OLD/$NEW/g" index.html js/python-runner.js
```

`vendor/*` 不需要版本号（它是 `immutable` 长期缓存；内容变了要改自己的路径，例如 `pyodide-lock.json?v=2`）。

## 本地调试

因为要用 `SharedArrayBuffer`，必须带 COOP/COEP 响应头，**不能直接双击 index.html**。最简做法：

```bash
# 任意静态服务器 + 两个响应头，例如：
python3 -m http.server 8080   # 然后自行补 Cross-Origin-Opener-Policy / Cross-Origin-Embedder-Policy
```

或者直接用 Cloudflare Pages 预览：`wrangler pages dev .`。

## 部署

```bash
wrangler pages deploy . --project-name mian --branch main
```

## 几个容易踩的坑（都已在代码里注释）

1. **`input()` 必须同步阻塞**：所以 Python 跑在 Worker 里，用 `SharedArrayBuffer + Atomics.wait` 等输入；没有 COOP/COEP 就没有 `SharedArrayBuffer`。
2. **Pyodide 0.26.2 不支持 `packageBaseUrl`**：`loadPackage()` 是按 `pyodide-lock.json` 的 `file_name` 相对 `indexURL` 解析的，所以本项目把 `file_name` 改写成 CDN 绝对地址（见 `tools/fetch-vendor.sh`）。
3. **`/vendor/*` 是 immutable 强缓存**：lockfile 内容一变就要换 URL（现在用 `lockFileURL: "...?v=2"`），否则老用户会一直读到旧 lockfile。
4. **不要给 Python 暴露 `__` 开头的 JS 全局名**：Python 类体里会被名字改写成 `_类名__foo`，看起来像「方法不存在」。
5. **单步调试复用 input 的 SAB 通道**：`[0]=1` 走一步、`[0]=2` 一路跑完；Python 侧用带超时的 `Atomics.wait` 轮询停止标志，保证 ⏹ 仍然有效。