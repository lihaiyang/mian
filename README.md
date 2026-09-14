# 🐼 萌码 Python · 奇幻编程工坊

给小朋友用的在线 Python 编程工坊：浏览器里直接跑真正的 Python 3，配上小海龟画画、积木代码、趣味宝库、闯关任务和成长档案，**还能自己跟着教程学、刷 1300+ 道练习题、做 GESP 模拟考**。

线上地址：<https://mian.lihaiyang.net> （备用：<https://mian-1ri.pages.dev>）

> 🆕 **同一个仓库里还有第二个站**：**🐼 萌语岛 English Island** —— 给 6–10 岁孩子的英语学习岛，
> 每天 15 分钟在探险地图上打通「听 → 说 → 读 → 写 → 玩」，单词自动进记忆盒，家长看得到周报。
> 线上地址 <https://mian.lihaiyang.net/en/>，代码在 [`en/`](./en/)，说明见 [`en/README.md`](./en/README.md)，
> 设计方案见 [`英语学习网站设计方案.md`](./英语学习网站设计方案.md)。
> **两站共用一次部署、共用一张 `accounts` 表（一个同步码管两站）**；改 `_headers`、`wrangler.toml`
> 这类共用文件时，记得两站的 e2e 都跑一遍。

## 功能一览

| 模块 | 说明 |
| --- | --- |
| 🎓 学习中心 | 孩子的自学主场（顶栏「🎓 学习中心」一键进入）：**54 课教程**（GESP 一级→四级，含讲解/示例/小测/动手任务）、**120 个示例**、**1318 道练习题**、**GESP 模拟考**、**奖牌墙** |
| 🆕 学堂模式（v2） | 把上面这些做成**工作台的一种模式**而不是弹窗：题目左、代码中、批改右，不再来回跳；练习代码存进「学堂草稿」，不污染作品库 → 见下方「v2：学堂模式」 |
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
| 示例宝库 | **145 个**（132 个在 `examples-lib.js`：11 个分类 + 12 个小游戏；13 个内置示例在 `examples.js`） | `js/examples-lib.js`、`js/examples.js`、`v2/js/examples-lib.js` | `python3 tools/check_examples.py [路径]` |
| 练习题 | **1318 道**（16 主题 × 4 难度，全部带测试数据与参考答案） | `js/exercises.js`（自动生成，勿手改） | `python3 tools/gen_exercises.py` |
| 成就徽章 | 117 枚（运行/教程/练习/技能/海龟/坚持/考试/任务/特殊 9 类） | `js/progress.js` | — |
| 奖牌 | 49 枚（13 个技能领域 × 铜/银/金 + 10 枚特别奖牌） | `js/progress.js` | — |

每道练习题的「期望输出」都是**真的把参考答案跑一遍**得到的，不是手写的：`tools/exlib.py` 负责执行与比对，
`tools/gen_exercises.py` 在生成前会把全部题目重跑校验一次，任何一道对不上都会直接报错、不写文件。

## 目录结构

```
index.html              页面结构（含各弹窗：趣味宝库 / 我的档案；v1 的学习中心是弹窗）
v2/                     🆕 学堂模式整套（独立副本：v2/index.html + v2/css + v2/js，vendor 走绝对路径共用）
v2/js/learn.js          v2 学堂控制器：学习面板 / 任务卡 / 教程左读右练 / 学堂草稿 / 判题 / 模拟考
v2/js/app.js            v2 增加模式切换与「内容分流」（工坊写文件、学堂写草稿）
v2/js/editor.js         v2 增加 persistContent：落盘按模式分流
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
tools/e2e_learn_v2.mjs  v2 学堂模式端到端测试（模式切换/不跳场做题/布局拖拽/草稿/回工坊，61 项断言）
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


## 🆕 v2：学堂模式（<https://mian.lihaiyang.net/v2/index.html>）

v1 的学习中心是个**弹窗**：看题 → 跳到主界面写代码 → 再点悬浮球回来批改，来回三次很打断。
v2 把学习做成工作台的一种**模式**：进去之后左栏换成学习面板，**编辑器和运行舞台原地复用**，
题目在左、代码在中、批改在右，写完当场出结果。v1 保持原样不动。

| | v1（`/index.html`） | v2（`/v2/index.html`） |
| --- | --- | --- |
| 学习界面 | 96vw 弹窗盖在主界面上 | 工作台换模式：左栏学习面板 + 中间编辑器 + 右侧批改视图 |
| 做练习 | 跳到主界面写代码，点悬浮球回来批改 | 点题目 → 代码直接出现在中间 → `Ctrl+Shift+Enter` 当场批改 |
| 学教程 | 弹窗里看讲解，运行要跳出去 | 左目录 + 编辑器上方讲解，示例代码一键送进编辑器 |
| 练习代码存哪 | 每题在「我的作品」新建一个 .py 文件 | 存进**学堂草稿**（按档案隔离，不进文件树、不进云同步），满意时点「📌 存进作品库」 |
| 全对之后 | 手动找下一题 | 3 秒倒计时自动下一题（可点「留在这题」取消） |
| 模拟考 | 弹窗卷子 | 学堂里的专注卷子：题号点阵 + 计时 + 交卷成绩单 + 错题重做 |

### 🎁 示例宝库（v2 的右上角入口）

顶栏右上角的按钮从「趣味宝库」改名成 **🎁 示例宝库**，点开是一个弹窗：

- **全部分类都在里面**：🎁 全部 145 / 🎮 小游戏 14 / 🌟 入门启蒙 38 / 🔁 判断与循环 24 /
  🐢 海龟画室 16 / ✍️ 文字艺术 14 / 🎒 列表与字典 12 / 🧩 函数积木 12 / 🧮 数学魔法 15
- **示例从 13 个加到 145 个**：其中新增 **12 个小游戏**（猜数字、石头剪刀布、心算抢答、比大小、
  贪吃蛇脚印、21 点、打地鼠、记忆翻牌、躲陨石、幸运老虎机、井字棋、乒乓球计分板），
  游戏都会做输入校验，孩子打错字不会看到红色报错
- 点开示例会**在学习中心的沙盒里打开**（有草稿、随手改随手跑），不会往作品库塞文件
- 分类和学习中心里的**同一套**（8 组），不会出现两套名字
- **示例只有这一处**：左侧「代码宝箱」里的「🎁 示例宝库」不再是一个装着 13 个文件的文件夹，
  而是**通往宝库的入口**（点一下＝点右上角那个按钮）。工作区只留孩子自己的作品，
  新用户进来只有 1 个起步文件；老用户那 13 个示例文件会在载入时被收进宝库
  （**改过的示例会保留成「我的作品」里的普通文件**，不会丢）
- 弹窗底部的按钮从「恢复初始示例」改成「**♻️ 还原全部示例**」：把示例上改过的草稿清回原样，
  孩子自己的作品不受影响

### v2 的教程 / 示例布局（可拖 + 三种预设）

教程不再是「上面固定 58% 讲解、下面一小条编辑器」（那样编辑器只剩 8 行）。
中间列现在是**可拖拽的两段**，任务条上有三个一键布局：

| 布局 | 效果（1440×900 实测） | 什么时候用 |
| --- | --- | --- |
| 📖 讲解优先 | 讲解铺满 591px，代码区收成一条可点的提示栏 | 专心读课文 |
| ⚖️ 各一半（默认） | 讲解 313px / 编辑器 300px ≈ **12 行** | 边读边写 |
| ⌨️ 代码优先 | 讲解收成标题栏 46px，编辑器 579px ≈ **23 行** | 专心写长代码 |

- 中间的**分隔条可以上下拖**，比例自动记住（按档案存 `codepanda_learn_layout_v1__<档案id>`，刷新、换设备都在）
- 快捷键：`Alt+1/2/3` 切三种布局，`Alt+↑/↓` 微调比例
- 防呆：讲解最少 96px、编辑器最少 300px，拖不出「看不见」的状态
- 讲解优先时点「↓ 放到下面编辑器」会**自动切到代码优先**，孩子不用自己调
- **示例新增「↔ 对照原版」**：原版示例代码并排贴在编辑器右边（编辑器 726px → 407px），边看边改不占垂直空间
- **`⛶ 专注`**：一键收掉顶栏/学习面板/运行舞台，编辑器铺满 728px，`Esc` 退出
- 修掉一个 bug：切到 示例/练习/模拟考 时，上一课的讲解**不会**再赖在编辑器上面了

几个实现要点：

1. **不搬 DOM、不换实例**：v2 没有重写编辑器，而是用 `body.mode-learn` 这一个 CSS 状态切换工作台布局
   （`.filetree-panel` 让位、`.learn-panel` 顶上、`.judge-view` 成为输出面板的第三个视图）。
   CodeMirror 的补全 / 标点体检 / 单步 / 字号、海龟画布、报错小侦探全部零改动复用。
2. **参数化判题**：`PythonRunner.judge(code, stdin, timeout)` 在 v2 里只是被复用（v1 已经做好）。
3. **布局只是「量高度」**：讲解区与编辑器之间插一个分隔条，用 `measureRegion()` 量出可用高度后
   按比例设像素高度（而不是 CSS 百分比），这样最小高度、拖拽、记忆都好控制；
   示例的对照栏是把 `.editor-body-wrapper` 临时挪进一个 flex 行容器（离开学堂原样放回），
   CodeMirror 实例不换、挪完 `refresh()` 一次。
4. **学堂草稿**：`localStorage["codepanda_learn_drafts_v1__<档案id>"]`，每份草稿按题目/课程 id 存，
   最多 400 份、单份 24KB，敲字后 0.7 秒防抖落盘；`editor.js` 的落盘钩子按模式分流：
   工坊模式写文件、学堂模式写草稿。
5. **顶栏不动**：学堂入口仍然是顶栏的「🎓 学习中心」，模式切换靠工作区里的标签条 + 「⏸ 回到工坊」。

维护提醒：**v2 是完整副本**（`v2/css`、`v2/js` 都是独立文件），只有 `vendor/` 通过绝对路径
`/vendor/...` 与 v1 共用（避免仓库里多塞 25MB）。所以：

- 只改内容数据（题库 / 示例 / 教程）时，两份都要更新，或者只更新你要用的那一份；
- v2 的资源版本号在 `v2/index.html` 与 `v2/js/learn.js` 的 `const V` 里（当前 `20260914a`）。

v2 的自动化测试：

```bash
python3 tools/dev_server.py 8791
PLAYWRIGHT_PATH=$(ls -d ~/.npm/_npx/*/node_modules/playwright | head -1) \
  node tools/e2e_learn_v2.mjs http://127.0.0.1:8791   # 61 项：模式切换 / 不跳场做题 / 布局 / 草稿 / 回工坊
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

## ☁️ 云同步的设计（v2：只有四条规则）

原则一句话：**本地永远是主数据；同步就是把「本机各副本」和云端合并成一份——累加型的合并，内容型的比新旧。**

| # | 规则 | 说明 |
| --- | --- | --- |
| ① | **先推后拉** | 每次同步先把"上次成功同步后被改过的行"推上去，再把云端更新的拉回来。合并交给服务端已有的行级 LWW（`ON CONFLICT … WHERE updated_at`），客户端不写合并逻辑 |
| ② | **本地改过的不被覆盖** | 拉取时，本地这一行若在"上次成功同步"之后被改过，就跳过（等下一轮推送）；没改过的才用云端版本覆盖 |
| ③ | **学习记录只并集** | `progress` 是累加型数据：计数器取大、集合取并、映射键并值取大（合并必须幂等，否则每次拉取都会重复计数）。所以在新设备上先做题、再登录，两边的记录**都在** |
| ④ | **成功才记账** | `lastSent`（"发过什么"）只在服务器确认 200 之后才写；失败/超时/429 一律不记账 → 下一轮原样重发（服务端 LWW 幂等，重发无害） |

配套的几件小事：

- **触发点齐全**：`FileManager.saveToStorage()` 与 `Progress.saveStats()` 成功后都会 `noteDirty()` —— 新建/删除/重命名/移动文件、以及做题/学课/XP/徽章/模拟考都会自动上传（老版本只有"在编辑器里敲字"才触发，进度根本不上传）。
  ⚠️ **但只在内容真的变了才通知**：一轮同步结束会走 `refreshUI → FileManager.reload() → init() → saveToStorage()`，
  如果无条件通知，就变成「同步→落盘→再同步」的**死循环**（实测一分钟 280 次请求，把服务端限流打满 →
  所有同步 429 失败，表现就是"改了不同步"）。`tools/e2e_sync.mjs` 里有一条「静置 12 秒 `/api/sync` 请求数 ≤ 1」
  专门盯这个回归。
- **后台自动同步**：页面在前台时每 45 秒自动跑一轮（有改动就推、没改动也会拉一次别人的改动）；
  切回页面 / 窗口重新聚焦时立刻补一次；关页面 / 切走时用 `keepalive` 请求把还没传的改动尽力推出去
  （这条**不记账**，万一没发出去下次会重发，靠服务端 LWW 幂等兜底）。
- **顶栏「☁️ 云同步」按钮**：直接显示状态（🟢 已同步 / 🟡 同步中·部分未传 / 🔴 同步失败 / ☁️ 开启同步），
  点一下立即同步并弹出结果；没开启同步时点它会打开云同步面板。
- **防抖 + 最长等待**：安静 1.5 秒就同步；一直敲字的话最多等 8 秒也必须传一次（不会因为连续输入而一直不上传）。
- **忙时不丢，而且会等**：同步进行中再有改动 → 结束后立刻补跑一轮；此时调用 `syncNow()`
  会**等这一轮真正跑完再返回**（`CloudSync.whenIdle()`），不会再出现"点了一下同步、状态还停在上一轮的绿灯"。
  失败按 2s→4s→8s…（上限 30s）退避重试，联网 / 从后台切回来时也会补一次。
- **顺序是先拉后推**：先把自己的学习记录和云端并集好，再推上去 —— 否则拿着过期的快照推上去，会把云端已有的记录盖掉。
- **时间戳对齐**：客户端用服务端返回的 `serverTime` 算出偏移再打时间戳，避免某台设备时钟不准导致改动永远推不上去。
- **状态说真话**：单个文件超过 256KB 没传上去时显示 🟡 警告（不是绿灯）；请求失败显示 🔴 并注明"会自动重试"。
- **升级自动重来一遍**：老版本的记账方式有 bug，升级后检测到旧状态会清空记账 + 游标归零，强制完整同步一次。
- **服务端 `rev` 原子分配**（`UPDATE accounts SET rev = rev + 1 … RETURNING rev`）：两台设备同时推不会拿到同一个 rev，避免第三台设备漏拉。

**已知取舍**：两台设备同时改**同一个文件**时，以最后同步的那份为准（整个文件级，不做逐字符合并）。学习记录不受影响，永远是并集。

怎么测（都不需要联网就能跑第一条）：

```bash
node tools/test_cloud_sync.mjs                      # 21 项：失败重发/本地优先/并集/补跑/警告/升级迁移
npx wrangler pages dev . --port 8788 &              # 真后端（本地 D1）
PLAYWRIGHT_PATH=… node tools/e2e_sync.mjs http://127.0.0.1:8788   # 14 项：两台设备真链路
```

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