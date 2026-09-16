# en/ 模块契约（实现前先读这份）

> 这是「萌语岛 English Island」的实现契约。**任何模块只依赖这里写明的接口**，
> 不要在模块之间私自耦合。所有文件都在仓库根目录的 `en/` 下。

## 0. 全局约定

- **零构建**：原生 JS，无 npm、无打包、无 ESM。每个文件是一个 IIFE，挂到 `window`。
- **顶层 const 不挂 window**（参考项目的血泪教训）：跨模块调用一律写
  `typeof Player !== "undefined" && Player.say(...)`，不要直接假设存在。
- 所有跨模块调用都要能**降级**：模块缺失时功能退化，不抛异常。
- 数据文件是纯数据（`window.EN_* = [...]`），懒加载。
- 文件编码 UTF-8，缩进 2 空格，字符串用双引号。
- 中文注释，代码里的标识符用英文。

## 1. 数据 schema（data/*.js）

### 1.1 词库 `data/words-<theme>.js`（12 个文件）

```js
window.EN_WORDS = window.EN_WORDS || {};
window.EN_WORDS["food"] = [
  {
    id: "food_apple",          // 必须 <theme>_<word>，全站唯一
    word: "apple",
    ipa: "/ˈæpl/",              // 斜杠包裹，只放 IPA 字符
    zh: "苹果",
    pos: "n.",                   // n. / v. / adj. / num. / pron. / prep.
    theme: "food",
    grade: 2,                    // 1 | 2 | 3（1=启蒙 2=小学低年级 默认 3=中高年级）
    emoji: "🍎",                 // 一个 emoji，必须能一眼认出这个词
    syll: 2,                     // 音节数（本地发音评测要用，必须准确）
    sent: { en: "I eat an apple every day.", zh: "我每天吃一个苹果。" },
    phonics: ["a", "pp", "le"],  // 可选：拆音块
    rhyme: ["happy"],            // 可选：押韵词（必须也是本站词）
    tips: "a 在闭音节里读 /æ/"    // 可选：一句话人话提示
  }
];
```

**12 个主题（主题 id 必须完全一致）**：
`colors` 颜色 · `numbers` 数字 · `body` 身体 · `family` 家庭 · `food` 食物 · `animals` 动物 ·
`clothes` 衣物 · `toys` 玩具 · `school` 学校 · `weather` 天气 · `transport` 交通 · `home` 家居

### 1.2 字母与拼读 `data/phonics.js`

```js
window.EN_LETTERS = [   // 恰好 26 个，A→Z
  { letter: "A", lower: "a", name: "ay", sound: "/æ/", emoji: "🍎",
    words: ["apple", "ant", "ax"], zh: "苹果 / 蚂蚁 / 斧头" }
];
window.EN_PHONICS = [   // 30 关
  { id: "ph_cvc_a", unit: "短元音", title: "a 的短音 /æ/", emoji: "🐱", grade: 1,
    teach: ["a 夹在两个辅音中间时，读短音 /æ/，嘴巴要张大。", "试着把 c-a-t 三个音连起来：/k/ /æ/ /t/ → cat"],
    blends: [ { word: "cat", blocks: ["c", "a", "t"], emoji: "🐱" },
              { word: "hat", blocks: ["h", "a", "t"], emoji: "🎩" },
              { word: "bag", blocks: ["b", "a", "g"], emoji: "🎒" },
              { word: "map", blocks: ["m", "a", "p"], emoji: "🗺️" } ],
    tip: "读的时候三个音要连起来，中间不要停。" }
];
```

### 1.3 句子岛 `data/sentences.js`

```js
window.EN_SENTENCES = [   // 100 个句型
  { id: "s_like", pattern: "I like ___.", zh: "我喜欢___。", emoji: "😍", grade: 2,
    say: "I like apples.",                       // 示范音（整句）
    blanks: [ { word: "apples", emoji: "🍎", zh: "苹果" },
              { word: "cats", emoji: "🐱", zh: "猫" } ],   // 3–5 个替换词
    reply: { q: "What do you like?", a: "I like ___.", qzh: "你喜欢什么？" } }
];
```

### 1.4 绘本 `data/readers.js`

```js
window.EN_READERS = [     // 20 本
  { id: "r_mycat", title: "My Cat", titleZh: "我的猫", emoji: "🐱", grade: 1, level: "A",
    pages: [ { en: "I have a cat.", zh: "我有一只猫。", emoji: "🐱" } ],   // 8 页
    quiz: [ { q: "What do I have?", zh: "我有什么？",
              options: ["a cat", "a dog", "a fish"], answer: 0 } ] }       // 3 题
];
```

### 1.5 关卡编排 `data/lessons.js`

```js
window.EN_ISLANDS = [
  { id: "letter",    name: "字母岛", emoji: "🔤", desc: "26 个字母的名字和声音", kind: "letters",    grade: 1 },
  { id: "phonics",   name: "拼读岛", emoji: "🧩", desc: "看到词就会读",           kind: "phonics",   grade: 1 },
  { id: "life",      name: "生活岛", emoji: "🏠", desc: "12 个主题的生活词",      kind: "themes",    grade: 2 },
  { id: "sentence",  name: "句子岛", emoji: "💬", desc: "100 个高频句型",         kind: "sentences", grade: 2 },
  { id: "story",     name: "故事岛", emoji: "📚", desc: "点读绘本",               kind: "readers",   grade: 2 },
  { id: "challenge", name: "挑战岛", emoji: "🏆", desc: "听力 + 读写模拟卷",      kind: "exams",     grade: 3 }
];
window.EN_LEVELS = [   // 生活岛的关卡（由 tools/gen_lessons.py 生成，勿手改）
  { id: "lv_food_1", island: "life", theme: "food", index: 1, title: "食物 1 · 水果", emoji: "🍎",
    grade: 2, words: ["food_apple", "food_banana", "food_orange", "food_pear", "food_grape"] }
];
```

### 1.6 音频索引 `assets/audio/<theme>.json`（构建生成，勿手写）

```json
{ "theme": "food", "file": "food.m4a", "rate": 32000,
  "clip": { "food_apple#w": [0.000, 1.234], "food_apple#s": [1.234, 3.100] } }
```
- key 规则：`<itemId>#w` = 单词音，`<itemId>#s` = 例句音，`<letter>#n` = 字母名，`<readerId>#p<页码>` = 绘本页。
- 单位是**秒**，`[起始, 时长]`。

## 2. 模块 API

### 2.1 `js/ui.js` → `window.UI`

```js
UI.esc(s)                       // HTML 转义
UI.el(tag, attrs, children)     // 建元素；attrs 支持 class/text/html/onclick/dataset/style
UI.toast(msg, kind)             // kind: "ok" | "warn" | "info"
UI.confetti(n)                  // 撒花
UI.stamp(text)                  // 全屏盖章动画
UI.stars(n, total)              // 返回星星 HTML
UI.panda(text, mood)            // 返回小熊猫点评 HTML；mood: "happy"|"think"|"cheer"
UI.modal({title, body, actions}) // 返回 { close() }；actions: [{label, kind, onClick}]
UI.shuffle(arr, seed)           // 种子洗牌（同 seed 结果一致），返回新数组
UI.pick(arr, n, seed)           // 种子取 n 个
UI.icon(name)                   // 内置 SVG 图标（map/star/lock/back/sound/mic/…）
UI.fmtSec(s)                    // 78 → "1 分 18 秒"
UI.today()                      // "2026-09-14" 本地日期
UI.qs(name) / UI.qsa(name)      // URL hash 查询参数工具
```

### 2.2 `js/audio-fx.js` → `window.AudioFX`

```js
AudioFX.playSuccess() / playWrong() / playStamp() / playFlip()
AudioFX.playLevelUp() / playClick() / playPop()
AudioFX.setEnabled(bool) / AudioFX.enabled()
```

### 2.3 `js/player.js` → `window.Player`

```js
await Player.ready(themeId)            // 预加载音频精灵（幂等）；失败返回 false
Player.has(themeId)                    // 精灵是否可用
await Player.clip(key, {rate})         // 播放 sprites 里的一个片段
await Player.say(itemId, kind, {rate}) // kind: "w"|"s"，内部自动找主题、失败回退 TTS
await Player.speakText(text, {rate})   // TTS 兜底（Web Speech API）
Player.stop()
Player.ttsAvailable()
Player.onFallback(cb)                  // 用了 TTS 兜底时通知 UI（提示"当前设备用的是合成音"）
```

### 2.4 `js/speech.js` → `window.Speech`

```js
Speech.supported()                     // bool
await Speech.requestMic()              // Promise<bool>
Speech.onLevel(cb)                     // 实时音量回调（画波形）
await Speech.start()                   // 开始录音
const rec = await Speech.stop()        // {blob, ms, levels[], rms, durationSec}
Speech.grade(rec, {syll, refSec})      // → {score, stars, signals:{done,complete,rhythm,loud,speed,fluency}, tips:[]}
Speech.play(blob)                      // 回放录音
Speech.degradeMode()                   // "full" | "nomic" | "none"：当前降级档
```

### 2.5 `js/srs.js` → `window.SRS`（Leitner 5 盒）

```js
SRS.add(itemId)                        // 新词入盒 1
SRS.due(limit)                         // → [itemId]，按到期时间排序
SRS.answer(itemId, correct)            // → {box, dueAt}；对=进一级，错=回盒 1
SRS.mark(itemId, box)                  // 直接设盒
SRS.stats()                            // → {boxes:[5], due, learning, learned}
SRS.has(itemId)
SRS.exportRows() / SRS.importRows(rows)
SRS.reset()
```

### 2.6 `js/progress.js` → `window.Progress`

```js
Progress.get()                         // 原始 stats 对象
Progress.addXp(n)                      // → {levelUp:bool, level}
Progress.level()                       // → {level, emoji, title, cur, need, percent, isMax}
Progress.touchToday()                  // 记录今天来过（打卡/连续天数/每日任务）
Progress.streak()                      // 连续天数
Progress.daily()                       // → [{id,emoji,title,have,need,xp,done}]
Progress.badges() / Progress.medals()  // → [{id,emoji,title,desc,got}]
Progress.missions()                    // → [{id,emoji,title,hint,got}]
Progress.markLevel(levelId, stars) / Progress.levelStars(id) / Progress.isLevelDone(id)
Progress.markReader(id) / Progress.isReaderDone(id)
Progress.markPhonics(id) / Progress.markGame(id, score)
Progress.markExam(id, score)
Progress.stats()                       // 汇总：学了几个词、掌握几个、岛屿进度
Progress.exportRow() / Progress.importRow(row)
Progress.profileId() / Progress.profiles() / Progress.switchProfile(id) / Progress.addProfile(name, emoji, grade)
Progress.onChange(cb)                  // 数据变化通知（用于刷新顶栏）
```

### 2.7 `js/store.js` → `window.Store`

```js
Store.get(k, d) / Store.set(k, v) / Store.del(k)
await Store.idbPut(store, key, val) / Store.idbGet(store, key) / Store.idbAll(store) / Store.idbDel(store, key)
Store.usage()                          // 估算占用字节
```

### 2.8 `js/cloud.js` → `window.Cloud`

```js
Cloud.isSignedIn() / Cloud.code()
await Cloud.create(nickname, avatar)   // → {ok, code, pin?}
await Cloud.login(code, pin)           // → {ok, error?}
await Cloud.setPin(pin)
await Cloud.sync(silent)               // 增量同步；内部用 SRS/Progress 的 export/importRows
Cloud.status()                         // → {signedIn, syncing, lastSyncAt, error, pending}
Cloud.onStatus(cb)
Cloud.signOut()
```

### 2.9 `js/stage.js` → `window.Stage`

```js
Stage.open(levelId)                    // 打开一个关卡（渲染到 #stageRoot）
Stage.types                            // 题型注册表：{listen, speak, read, write, play}
Stage.register(name, def)              // def: {label, emoji, make(words, ctx) -> question}
Stage.close()
Stage.exitGuard()                      // 退出前保存进度
```

### 2.10 `js/app.js` → `window.App`

```js
App.route(hash)                        // "#/map" | "#/stage/lv_food_1" | "#/review" | "#/wordbook"
                                       // "#/phonics" | "#/phonics/ph_cvc_a" | "#/library" | "#/reader/r_mycat"
                                       // "#/games" | "#/game/whack" | "#/exam" | "#/me" | "#/parent" | "#/settings"
App.go(hash)
App.render()                           // 重绘当前路由
App.toast(msg)
```

## 3. 存储 key（统一前缀 `en_`，按档案隔离）

| key | 内容 |
| --- | --- |
| `en_profile` | 当前档案 id |
| `en_profiles` | 档案列表 |
| `en_stats__<pid>` | 成长数据（Progress） |
| `en_srs__<pid>` | 记忆盒（SRS） |
| `en_settings` | 全局设置（音效/字号/夜间/目标） |
| IndexedDB `en_rec` | 录音（key = `<pid>:<itemId>`） |
| IndexedDB `en_cache` | 离线缓存（词库/音频索引） |

## 4. 后端（Cloudflare Pages Functions + D1）

**路由**：`functions/api/en/sync.js` → `/api/en/sync`，`functions/api/en/account.js` → `/api/en/account`，
`functions/api/en/share.js` → `/api/en/share`。复用 `functions/api/_utils.js`。

**身份复用**：与萌码 Python **共用同一张 `accounts` 表和同一个同步码**（一个码管两站，家长最省事）。
只存 `code_hash` + 可选 `pin_hash`，不收集任何儿童个人信息。

**新增表**（`en/schema-en.sql`，追加进同一个 `mian-db`，不动原有表）：
```sql
en_profiles(id, account_id, name, emoji, grade, goal, created_at, updated_at, deleted, rev)
en_progress(account_id, profile_id, stats_json, updated_at, rev)
en_srs(account_id, profile_id, item_id, box, due_at, streak, lapses, last_result, updated_at, deleted, rev)
en_daily(account_id, profile_id, date, minutes, new_words, reviews, speak_count, speak_seconds, updated_at, rev)
en_shares(id, account_id, kind, profile_id, title, content, created_at, views, revoked)
```
主键都以 `account_id` 为作用域；`rev` 是账号级单调版本号；删除用软删除墓碑；冲突按行 `updated_at` 做 LWW。

**协议**：
```
GET  /api/en/sync?code=&pin=&since=<rev>   → {ok, rev, serverTime, rows:{profiles,srs,progress,daily}}
POST /api/en/sync  {code, pin, rows:{...}} → {ok, rev, applied}
POST /api/en/account {action:"create"|"login"|"setpin"|"rotate", code, pin, nickname, avatar}
GET  /api/en/share?id=<id>                 → {ok, title, content}
POST /api/en/share {code, pin, kind, title, content} → {ok, id}
```
限流用 `rate` 表（`rateLimit`，key 用 `en:<ip>` 前缀，避免和 Python 站互相挤占配额）。

## 5. 视觉与交互规范（所有模块必须遵守）

- **色板**（CSS 变量，已在 style.css 定义）：`--paper #F7EFE0` `--ink #241E19` `--red #E4572E`
  `--yellow #F2B33D` `--teal #2E9E8F` `--violet #6A4C93` `--night #1A1714`
- 控件：**描边 3px + 圆角 20px + 贴纸白边**；触控目标 ≥ 64×64px；主按钮 ≥ 88px 高；正文字号 ≥ 18px。
- **不许出现**：红色叉号、红色报错文字、倒计时压力、"你输了"、排行榜垫底。
- 反馈文案：先肯定再建议（🐼「差一点点～再听一次」），绝不说「错误」。
- 答错**不变红不震动**，只左右轻晃 + 温和音效。
- 所有 emoji 图标都要给 `aria-hidden="true"`；可点元素给 `aria-label`。
- 三种反馈信号同时给：图标 + 文字 + 音效（色盲友好）。

## 6. 每个模块交付前必须自测

```bash
node --check en/js/<你的文件>.js        # 语法必须通过
python3 en/tools/check_content.py       # 数据类模块必须通过
```
