# 🐼 萌码 Python · 奇幻编程工坊

给小朋友用的在线 Python 编程工坊：浏览器里直接跑真正的 Python 3，配上小海龟画画、积木代码、趣味宝库、闯关任务和成长档案，**还能自己跟着教程学、刷 1300+ 道练习题、做 GESP 模拟考**。

线上地址：<https://mian.lihaiyang.net> （备用：<https://mian-1ri.pages.dev>）

## 功能一览

| 模块 | 说明 |
| --- | --- |
| 🎓 学习中心 | 孩子的自学主场（顶栏「🎓 学习中心」一键进入）：**54 课教程**（GESP 一级→四级，含讲解/示例/小测/动手任务）、**120 个示例**、**1318 道练习题**、**GESP 模拟考**、**奖牌墙** |
| 教程 | 12 个单元 54 课：print → 变量 → 输入 → 运算 → 分支 → 循环 → 图形打印 → 字符串 → 列表 → 字典 → 函数 → 文件 → 算法思维；每课可「运行看看 / 打开到编辑器改一改 / 我学会了」 |
| 练习与自动判题 | 16 个主题、4 个难度（GESP 一~四级），点「批改」就用题目自带的测试数据跑一遍孩子的代码，逐组对比输入/期望输出/实际输出，并给出儿童化的错误解释 |
| 模拟考 | 按级别抽 10 题组卷（优先没做对过的题，每次卷子都不同），逐题批改，交卷出成绩单并存档 |
| 代码宝箱 | **文件夹分组**（内置示例自动收进「🎁 示例宝库」）、多文件管理、新建/重命名/删除/移动、自动保存、导入 .py、打包下载 zip（按文件夹分层）、分享链接 |
| 标签栏 | 单标签关闭 / **✕ 其他 / ✕ 全部** 一键批量关闭（只关标签不删文件），标签右键也能操作 |
| 编辑器 | CodeMirror 5 语法高亮、智能补全（按 import 与别名推断，带中文说明）、中文标点实时体检、护眼大字号、字号与主题记忆 |
| 运行引擎 | Pyodide（Python 3.12，WebAssembly）跑在 **Web Worker** 里，主界面永不卡死；命令行式 `input()`；⏹ 可中断死循环 |
| 单步调试 | 🐾 单步模式：逐行暂停、高亮当前行，「下一步 / 一路跑完」 |
| 海龟画室 | Canvas 小海龟：前进转向、画圆填色、速度调节、保存画作、作品卡（合成分享图） |
| 趣味宝库 | 13 个内置示例、5 个分类（入门/海龟/游戏/数学/文字），星级 + 一句话说明，点击即打开 |
| 成长档案 | 多小伙伴档案（各自独立的作品库与统计）、**等级与经验（30 级）**、**32 个闯关任务**、**117 枚成就徽章**、**49 枚奖牌**（13 个技能领域 × 铜/银/金 + 特别奖牌）、**每日任务**、连续打卡 |
| 数据文件 | Python 里 `open("日记.txt","w")` 写出的文件会被保存，刷新后自动找回 |
| 小侦探报错 | 17 类常见错误的中文诊断、出错源码行、跨函数「出错路线」、一键标点体检 / 回到上次成功 |
| 第三方库 | `import numpy` / `matplotlib` 等按需从 CDN 拉取 wheel，仓库不用塞 15MB |

### 学习内容的规模（都有脚本可复现）

| 内容 | 数量 | 来源文件 | 生成/校验脚本 |
| --- | --- | --- | --- |
| 教程课程 | 54 课 / 12 单元 / 4 个阶段 | `js/lessons.js`（32 课）、`js/lessons-adv.js`（22 课） | `python3 tools/check_lessons.py` |
| 示例宝库 | 120 个（10 个分类，每个 12 个） | `js/examples-lib.js` | `python3 tools/check_examples.py` |
| 练习题 | **1318 道**（16 主题 × 4 难度，全部带测试数据与参考答案） | `js/exercises.js`（自动生成，勿手改） | `python3 tools/gen_exercises.py` |
| 成就徽章 | 117 枚（运行/教程/练习/技能/海龟/坚持/考试/任务/特殊 9 类） | `js/progress.js` | — |
| 奖牌 | 49 枚（13 个技能领域 × 铜/银/金 + 10 枚特别奖牌） | `js/progress.js` | — |

每道练习题的「期望输出」都是**真的把参考答案跑一遍**得到的，不是手写的：`tools/exlib.py` 负责执行与比对，
`tools/gen_exercises.py` 在生成前会把全部题目重跑校验一次，任何一道对不上都会直接报错、不写文件。

## 目录结构

```
index.html              页面结构（含各弹窗：趣味宝库 / 我的档案 / 学习中心）
css/style.css           全部样式（含暗色模式、学习中心）
js/app.js               主流程：文件/弹窗/主题/分享/快照/趣味宝库
js/learn.js             学习中心：学习地图 / 教程 / 示例 / 练习 / 模拟考 / 成就
js/lessons.js           教程内容（基础篇：GESP 一级、二级，32 课）
js/lessons-adv.js       教程内容（进阶篇：三级、四级，22 课）
js/examples-lib.js      示例宝库数据（120 个示例，懒加载）
js/exercises.js         练习题题库（1318 题，懒加载，自动生成）
js/editor.js            CodeMirror 封装：补全、标点体检、单步行高亮
js/file-tree.js         文件库（按档案命名空间隔离存储）
js/progress.js          成长档案：多档案 + 经验等级 + 闯关 + 徽章 + 奖牌 + 每日任务
js/python-runner.js     主线程侧：消息分发、终端、输入、单步控制、报错向导、判题接口
js/python-worker.js     Worker 侧：Pyodide、输入 SAB、单步 tracer、判题模式、虚拟文件系统
js/turtle-canvas.js     海龟画布引擎
js/examples.js          内置示例库与分类元数据
js/poster.js            作品卡（PNG 合成）
js/zip-writer.js        零依赖 ZIP 打包
vendor/                 CodeMirror / Pyodide / confetti（全部自托管，含 python_stdlib.zip）
tools/exlib.py          练习题生成公共库（真正执行参考答案 → 记录期望输出）
tools/ex_families_a~e.py 练习题「题目家族」（按主题分文件，共 1318 题）
tools/gen_exercises.py  合并家族 → 逐题重跑校验 → 写出 js/exercises.js
tools/check_lessons.py  校验每一课示例代码能跑通
tools/check_examples.py 校验每一个示例能跑通
tools/fix_families.py   批量修「% 占位符个数不匹配」的小毛病（生成题库时的辅助工具）
tools/dev_server.py     本地预览服务器（自动带上 COOP/COEP 响应头）
tools/e2e_learn.mjs     学习中心端到端冒烟测试（Playwright，31 项断言）
tools/e2e_judge.mjs     判题引擎边界测试（判题/超时中断/EOF，8 项断言）
tools/fetch-vendor.sh   重新拉取 Pyodide 并把 lockfile 指向 CDN
_headers                COOP/COEP（SharedArrayBuffer 必需）与缓存策略
```

## ✏️ 怎么加新题 / 改题库

1. 在 `tools/ex_families_*.py` 里按主题加一个「题目家族」函数，用 `exercise(...)` 造题：
   ```python
   from exlib import exercise
   items.append(exercise(
       topic="loop", level=1,
       title="打印 1 到 n", desc="【任务】...【输入】...【输出】...",
       hint="用 for i in range(1, n + 1):",
       answer="n = int(input())\nfor i in range(1, n + 1):\n    print(i)",
       cases=["3", "5"]))
   ```
   **不要手写期望输出**：`exercise()` 会真的把 `answer` 跑一遍，把真实输出记成标准答案。
2. 运行 `python3 tools/gen_exercises.py`：它会合并所有家族、逐题重跑校验、写出 `js/exercises.js`。
3. 别忘了改 `js/learn.js` 里的 `V`（资源版本号）和 `index.html` 里的 `?v=`。

## 🧪 本地自测

```bash
python3 tools/check_lessons.py                    # 54 课示例代码能否跑通
python3 tools/check_examples.py                   # 120 个示例能否跑通
python3 tools/gen_exercises.py --check            # 题库校验（不写文件）
python3 tools/dev_server.py 8791                  # 本地预览（自动带 COOP/COEP）
PLAYWRIGHT_PATH=$(ls -d ~/.npm/_npx/*/node_modules/playwright | head -1) \
  node tools/e2e_learn.mjs http://127.0.0.1:8791  # 学习中心端到端测试（31 项）
PLAYWRIGHT_PATH=$(ls -d ~/.npm/_npx/*/node_modules/playwright | head -1) \
  node tools/e2e_judge.mjs http://127.0.0.1:8791  # 判题引擎边界测试（8 项）
```


## ⚠️ 改完 css/js 后必须做的一件事：改版本号

`mian.lihaiyang.net` 上 CDN 对 `/css/*`、`/js/*` 用的是 **4 小时**默认缓存（实测 `cache-control: public, max-age=14400`，会盖掉 `_headers` 里的设置）。
如果只改文件不改 URL，浏览器最长 4 小时内仍会用旧文件，于是出现**新 HTML + 旧 CSS** 的错版（例如工具按钮竖着堆成一列）。

所以每次改 `css/style.css` 或 `js/*.js` 之后，把这两处的版本号一起改掉再部署：

1. `index.html` 里所有 `css/....css?v=xxxxxxxx` 和 `js/....js?v=xxxxxxxx`
2. `js/python-runner.js` 里 `new Worker("js/python-worker.js?v=xxxxxxxx")`
3. `js/learn.js` 里的 `const V = "xxxxxxxx"`（学习中心懒加载 `lessons.js` / `lessons-adv.js` / `examples-lib.js` / `exercises.js` 时用的版本号）

命令（把版本号换成当天，例如 `20260913a`）：

```bash
OLD=20260912f; NEW=20260913a
sed -i "" "s/$OLD/$NEW/g" index.html js/python-runner.js
sed -i "" "s/const V = \".*\"/const V = \"$NEW\"/" js/learn.js
```

`vendor/*` 不需要版本号（它是 `immutable` 长期缓存；内容变了要改自己的路径，例如 `pyodide-lock.json?v=2`）。

## ☁️ 云同步（Cloudflare D1 后端）

- **账号 = 匿名同步码**：服务端只存 `code_hash`（SHA-256 + 服务端 pepper），不收集姓名、邮箱、手机号；码由 8 位易辨认字符组成（去掉 0/O/1/I/L）。
- **数据表**：`accounts` / `profiles` / `folders` / `files` / `progress` / `vfs` / `rate`（限流）。
  所有数据行都带 `account_id`：本地 id（`p_default`、`ex_1`…）在不同账号间可以重复，互不干扰。
- **同步协议**：
  - `GET  /api/sync?code=&pin=&since=<rev>` → 增量拉取（`rev` 是账号级单调版本号，不受设备时钟影响）
  - `POST /api/sync` → 批量推送（按行 `updated_at` 做 last-write-wins，删除用软删除墓碑同步）
  - `POST /api/account` → `create` / `login` / `setpin` / `rotate`
- **离线优先**：本地 `localStorage` 仍是主存储，没网照常写代码；联网后 3 秒防抖自动增量上传。

首次部署：

```bash
wrangler d1 create mian-db                     # 把返回的 database_id 填进 wrangler.toml
wrangler d1 execute mian-db --remote --file=./schema.sql
wrangler pages secret put CODE_PEPPER --project-name mian
wrangler pages deploy . --project-name mian --branch main
```

本地联调（自带本地 D1，接口与线上一致）：

```bash
wrangler d1 execute mian-db --local --file=./schema.sql
wrangler pages dev . --port 8788
```

免费额度参考：D1 每天 500 万行读 / 10 万行写、5 GB 存储（按一个孩子一次会话约 30 行写入估算，够数千会话/天）。

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