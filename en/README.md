# 🐼 萌语岛 English Island

给 6–10 岁孩子的英语学习岛：**每天 15 分钟**，在探险地图上打通「听 → 说 → 读 → 写 → 玩」五小关，
单词自动进「记忆盒」，家长看得到成长周报。

线上地址：<https://mian.lihaiyang.net/en/>（与萌码 Python 同一个 Cloudflare Pages 项目）

> 设计与取舍的完整说明见仓库根目录的 **英语学习网站设计方案.md**（v1.1）。
> 模块与数据契约见 **en/CONTRACT.md**。

---

## 一、它是什么

| | 说明 |
| --- | --- |
| 形态 | 单页 Web 应用（PWA），iPad / 学习机 / 电脑打开即用，可「添加到主屏幕」离线学 |
| 零构建 | 原生 JS（IIFE 挂 window）、无 npm、无打包；改完直接部署 |
| 零外部依赖 | 字体、图标（emoji）、音频全部自托管，**不请求任何第三方 CDN** |
| 离线优先 | localStorage + IndexedDB 是主存储，Service Worker 缓存；联网后增量同步到 D1 |
| 隐私 | 不收集姓名/手机号；**录音只存本机，永不上传**；不接云端发音评测 |

## 二、六座岛

| 岛 | 内容 | 规模 |
| --- | --- | --- |
| 🔤 字母岛 | 26 个字母的名称音、字母音、首字母词 | 26 关 |
| 🧩 拼读岛 | 短元音 CVC → 辅音组合 → 二合字母 → 元音组合 → 魔法 e；另有 👂 **听辨小挑战**（20 组最小对立对） | 30 关 + 20 对 |
| 🏠 生活岛 | 12 个主题（颜色/数字/身体/家庭/食物/动物/衣物/玩具/学校/天气/交通/家居） | 600 词 · 120 关 |
| 💬 句子岛 | 100 个高频句型 + 替换练习 | 100 关 |
| 📚 故事岛 | 分级点读绘本（A/B/C 三级，每本 8 页 + 3 道理解题） | 20 本 |
| 🏆 挑战岛 | 模拟卷（5 题听力 + 5 题认读），出成绩单 | 20 套 |

## 三、每天 15 分钟怎么过

```
🎒 进门（今日路线） → 🔁 复习 3 分钟（记忆盒到期卡，最多 20 张）
                    → 🏝 新关 9 分钟（听→说→读→写→玩，每小关 60–90 秒）
                    → 📖 收尾 3 分钟（点读绘本 / 跟读）
                    → 🏁 结算：星星 · 经验 · 盖章 · 打卡
```

## 四、关键技术决策

1. **音频精灵（audio sprite）**：一个主题的单词 + 例句合成一个 `m4a`，用 `currentTime` 定位播放。
   切词零延迟、请求数 1、体积远小于 N 个 mp3；播放器三级降级：**音频精灵 → 系统 TTS → 界面提示**。
2. **本地发音评测（不接云端）**：`MediaRecorder` 录音 → `decodeAudioData` 拿 PCM → 20ms RMS 包络 →
   与示范音包络做**归一化互相关**（节奏相似度）+ 音节峰计数（完整性）+ 时长/音量/停顿。
   能判断：读没读、读完整没有、节奏像不像、快慢、声音大小、停顿多少；
   **不能判断音准** —— 所以界面上只给可验证的信号，绝不给假的音准分。
   音准训练改为：🎧 三明治回放（示范音→自己的录音→示范音）+ 👂 最小对立对听辨 + 👄 口型提示 + 👨‍👩‍👧 家长人工确认。
3. **记忆盒（Leitner 5 盒）**：1/2/4/7/15 天，答对晋级、答错回第 1 格（不惩罚）；
   同一张卡每次换题型（听音选图/看图选词/拼写/跟读），避免背位置；每日上限 20 张，超出顺延。
4. **成长系统**：30 级 · 69 枚徽章 · 49 枚奖牌 · 20 个闯关任务 · 每日 3 任务 · 连续打卡 · 多小伙伴档案。
5. **共用同步码**：和萌码 Python 共用同一张 `accounts` 表 —— 一个 8 位码管两站。

## 五、目录结构

```
en/
├── index.html                页面骨架（顶栏 / 路由视图 / 底栏 / 舞台 / 全局层）
├── css/style.css             设计系统（旅行手账 × 丝网印刷贴纸）
├── css/games.css             游戏厅样式
├── css/print.css             单词卡与周报的 A4 打印样式
├── js/store.js               存储层：localStorage + IndexedDB
├── js/audio-fx.js            Web Audio 合成音效（零音频文件）
├── js/ui.js                  通用 UI：贴纸卡 / 印章 / 撒花 / 弹窗 / 种子随机
├── js/player.js              音频精灵播放器 + TTS 兜底 + 参考音包络提取
├── js/speech.js              录音 + 本地节奏评测
├── js/srs.js                 记忆盒（Leitner）
├── js/progress.js            成长档案（等级/徽章/奖牌/任务/打卡/多档案）
├── js/cloud.js               D1 增量同步（离线优先）
├── js/stage.js               学习舞台与题型引擎
├── js/games.js               5 个小游戏
├── js/app.js                 hash 路由与全部页面
├── data/words-*.js           词库（12 个主题，纯数据）
├── data/phonics.js           26 字母 + 30 关拼读
├── data/sentences.js         100 个句型
├── data/readers.js           20 本分级绘本
├── data/lessons.js           关卡编排（由 tools/gen_lessons.py 生成，勿手改）
├── assets/fonts/             Andika（识字友好，含 IPA）+ Baloo 2，均为 OFL 授权
├── assets/audio/             音频精灵（*.m4a + *.json），由 tools/gen_audio.py 生成
├── img/                      PWA 图标
├── sw.js  manifest.webmanifest
└── tools/                    构建、校验、测试脚本（见下）
```

## 六、本地跑起来

```bash
# 1. 起本地预览服务器（静态根 = 仓库根，带 no-store，默认端口 8799）
python3 en/tools/dev_server.py --port 8799
# 2. 浏览器打开
open http://127.0.0.1:8799/en/index.html
```

英语站**不需要** COOP/COEP（用不到 SharedArrayBuffer），所以也可以用任何静态服务器。
（萌码 Python 主站需要，见根 README。）

## 七、内容生产管线

```bash
# ① 校验内容（词库/拼读/句子/绘本/关卡的一致性）
python3 en/tools/check_content.py

# ② 从词库生成生活岛关卡（120 关），并校验 6 座岛
python3 en/tools/gen_lessons.py            # --check 只校验不写；--print 打印分组

# ②b 生成「最小对立对」听辨题库（只挑词库里已有的词，因此天然有音频）
python3 en/tools/gen_pairs.py              # --check 只校验不写

# ③ 合成音频精灵（macOS：say + afconvert；8 并发；增量）
python3 en/tools/gen_audio.py              # --force 全量；--only food,colors 只做几组；--list 看分组
python3 en/tools/check_audio.py            # 校验：覆盖度 / 时长 / 重叠 / 孤儿片段

# ④ 字体覆盖检查（IPA 字符缺一个都会变豆腐块）
python3 en/tools/check_fonts.py

# ⑤ 端到端测试（Playwright）：两个文件，一个测页面骨架，一个测学习闭环
export PLAYWRIGHT_PATH=$(ls -d ~/.npm/_npx/*/node_modules/playwright | head -1)
node en/tools/e2e_smoke.mjs   http://127.0.0.1:8799   # 19 项：首屏/地图/档案/设置/绘本/单词本/字母岛
node en/tools/e2e_learn.mjs   http://127.0.0.1:8799   # 22 项：五小关→结算→记忆盒→复习→5 个小游戏→音频精灵→听辨挑战
node en/tools/e2e_offline.mjs http://127.0.0.1:8799   # 5 项：SW 预缓存 → 断网后仍能打开地图与六座岛
# 云同步测试要先起本地 D1：
#   wrangler d1 execute mian-db --local --file=./schema.sql
#   wrangler d1 execute mian-db --local --file=./en/schema-en.sql
#   wrangler pages dev . --port 8788
node en/tools/e2e_sync.mjs    http://127.0.0.1:8788   # 10 项：两台"设备"同一个同步码双向同步

# ⑥ 截图（肉眼验收设计）
node en/tools/shots.mjs http://127.0.0.1:8799 /tmp/en-shots
```

**加新词的正确姿势**：改 `data/words-<theme>.js` → `check_content.py` → `gen_lessons.py` → `gen_audio.py`。
音频是"内容驱动"的：词表变了，重跑 `gen_audio.py` 只会重做变化的那一组（hash 比对）。

## 八、部署

```bash
# 前端（和萌码 Python 一次部署，两站一起发）
wrangler pages deploy . --project-name mian --branch main

# 后端表结构（第一次部署时执行一次；追加进同一个 mian-db，不动原有表）
wrangler d1 execute mian-db --remote --file=./en/schema-en.sql

# 本地联调（自带本地 D1）
wrangler d1 execute mian-db --local --file=./schema.sql
wrangler d1 execute mian-db --local --file=./en/schema-en.sql
wrangler pages dev . --port 8788
```

### ⚠️ 改完一定要改版本号

CDN 对 `/en/js/*`、`/en/css/*` 有默认缓存，只改文件不改 URL 会出现**新 HTML + 旧 JS** 的错版。三处一起改：

1. `en/index.html` 里所有 `?v=xxxxxxxx`，以及 `window.EN_V`；
2. `en/sw.js` 里的 `VERSION`（换了就重新预缓存）；
3. 数据文件是懒加载的，版本号取自 `window.EN_V`，不用单独改。

```bash
OLD=20260914a; NEW=20260915a
sed -i "" "s/$OLD/$NEW/g" en/index.html
sed -i "" "s/const VERSION = \"en-v1\"/const VERSION = \"en-v2\"/" en/sw.js
```

## 九、后端接口

```
POST /api/en/account  {action: create|login|setpin|rotate, code, pin, nickname, avatar}
GET  /api/en/sync?code=&pin=&since=<rev>   → {ok, rev, rows:{profiles,srs,progress,daily}}
POST /api/en/sync     {code, pin, rows}    → {ok, rev, applied}
GET  /api/en/share?id=<id>                 → {ok, title, content}
POST /api/en/share    {code, pin, kind, title, content} → {ok, id}
```

数据表：`en_profiles` / `en_progress` / `en_srs` / `en_daily` / `en_shares`（见 `en/schema-en.sql`），
身份复用萌码 Python 的 `accounts` 表（只存同步码哈希 + 可选 PIN 哈希，不存任何个人信息）。

**分享页**：家长在「家长报告」里点「🔗 生成分享链接」，会得到一个 `/en/share.html?id=<8位码>` 的只读链接
（发给爷爷奶奶看这周学了什么）。内容只有学习统计，**不含录音、不含任何个人信息**；需要先登录同步码才能生成。

## 十、设计系统速查

| 令牌 | 值 | 用途 |
| --- | --- | --- |
| `--paper` | `#F7EFE0` | 宣纸底（叠 5% 纸纹噪点） |
| `--ink` | `#241E19` | 油墨黑：描边与正文（不用纯黑） |
| `--red` | `#E4572E` | 印章、重点（配 ✗ 图标，不只靠颜色） |
| `--yellow` | `#F2B33D` | 星星、经验条、高亮 |
| `--teal` | `#2E9E8F` | 正确、主按钮（配 ✓ 图标） |
| `--violet` | `#6A4C93` | 次要强调 |

- 触控目标 ≥ 64×64px，主按钮 ≥ 88px 高，正文字号 ≥ 18px（三档可调）。
- 答错**不变红、不震动**，只左右轻晃 + 温和音效；文案永远是「差一点点～再听一次」。
- 夜间模式 19:00 后自动切换，也可手动；`prefers-reduced-motion` 下关闭全部动画。
