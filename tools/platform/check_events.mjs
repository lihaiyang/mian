/* ============================================================================
 * 成长事件静态自检：**代码里 emit 的事件，学科有没有声明？**
 *
 * 为什么值得单独写一个检查：
 *   Progress.emit("correct_word") 遇到没声明的事件时**不报错**，
 *   只打一句 console.warn 就返回 null。于是：
 *     · 数学岛的"应用题达人"徽章、"做对 3 道应用题"每日任务 —— 永远拿不到计数
 *     · 汉字岛的"六级都看过"徽章 —— 永远解不开
 *   这两个 bug 在浏览器里**看不出来**：页面不崩、XP 照涨、只是某个徽章永远灰着。
 *   绿测试也照不出来，因为 e2e 只测"点得动、答得对"。
 *
 * 所以这里做一件很笨但有效的事：把学科代码里所有 Progress.emit("X") 抠出来，
 * 和 subject.js 里 Progress.define({events:{...}}) 声明的名字对一遍。
 *
 * 用法：node tools/platform/check_events.mjs
 * ========================================================================== */

import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..");

/** 学科清单的**唯一来源**是 public/shared/subjects.js。从它推导，
 *  而不是在这里再写一份名单 —— 拼音岛就是这么被漏掉的：
 *  这个检查写于数学/汉字那一轮，名单是写死的 ["typing","math","cn"]，
 *  后来加拼音岛时没人想起这里，于是它的事件一个都没被检查过。
 *  （这正是仓库里反复记的那条教训：**测试里写死"当前有哪些学科"，
 *    加学科时就会静默失效。**） */
function subjectIds() {
  const src = readFileSync(join(ROOT, "public", "shared", "subjects.js"), "utf8");
  const out = [];
  for (const m of src.matchAll(/["']\/([a-z0-9-]+)\/subject\.js["']/g)) out.push(m[1]);
  return out;
}

/** 这两个老站各有自己的 progress.js，不走平台成长契约（也没法走）。 */
const NO_PLATFORM = new Set(["python", "en"]);

let fails = 0;
let checks = 0;

function ok(msg) { checks++; console.log("  ✅ " + msg); }
function bad(msg) { checks++; fails++; console.log("  ❌ " + msg); }

/** 在沙箱里跑 subject.js，把它 define() 的成长规则接住 */
function loadSpec(file) {
  const code = readFileSync(file, "utf8");
  let spec = null;
  const store = { get: () => null, set: () => {} };
  const sandbox = {
    console: { log() {}, warn() {}, error() {} },
    document: { readyState: "complete", addEventListener() {} },
    Platform: { register() {} },
    Progress: { define: (_id, s) => { spec = s; }, levelInfoOf: () => ({ level: 1 }) },
    Store: { ns: () => store },
    setTimeout, clearTimeout
  };
  sandbox.window = sandbox;
  new Function(
    "window", "document", "console", "Platform", "Progress", "Store", "setTimeout", "clearTimeout",
    code
  )(sandbox, sandbox.document, sandbox.console, sandbox.Platform, sandbox.Progress,
    sandbox.Store, setTimeout, clearTimeout);
  return spec;
}

/** 递归收集 .js 文件 */
function jsFiles(dir) {
  const out = [];
  for (const e of readdirSync(dir)) {
    const p = join(dir, e);
    if (statSync(p).isDirectory()) out.push(...jsFiles(p));
    else if (e.endsWith(".js")) out.push(p);
  }
  return out;
}

console.log("=== 成长事件自检（emit 的名字必须声明过）===\n");

const ids = subjectIds();
if (!ids.length) {
  console.log("❌ 从 shared/subjects.js 里没解析出任何学科，检查清单文件的格式是不是变了");
  process.exit(1);
}

for (const id of ids) {
  console.log(`[${id}]`);
  if (NO_PLATFORM.has(id)) {
    console.log("  ℹ️  自带 progress.js，不走平台成长契约，跳过\n");
    continue;
  }
  const dir = join(ROOT, "public", id);
  let spec;
  try {
    spec = loadSpec(join(dir, "subject.js"));
  } catch (e) {
    bad(`subject.js 跑不起来：${e.message}`);
    continue;
  }
  if (!spec) { bad("subject.js 没有调用 Progress.define()，成长规则是空的"); continue; }

  const declared = new Set(Object.keys(spec.events || {}));
  ok(`声明了 ${declared.size} 个事件`);

  // 抠出所有 emit 的名字；带字符串拼接的记成前缀
  const literal = [];   // 完整名字
  const dynamic = [];   // 前缀（运行时才拼出全名）
  for (const f of jsFiles(dir)) {
    if (f.endsWith("subject.js")) continue;
    const text = readFileSync(f, "utf8");
    const rel = f.slice(ROOT.length + 1);
    for (const m of text.matchAll(/Progress\.emit\(\s*"([^"]*)"\s*(\+?)/g)) {
      const [, name, plus] = m;
      if (plus === "+") dynamic.push({ name, rel });
      else literal.push({ name, rel });
    }
  }

  for (const { name, rel } of literal) {
    if (declared.has(name)) ok(`emit("${name}") ← ${rel}`);
    else bad(`emit("${name}") 没声明 ← ${rel}：这个事件会被静默丢掉`);
  }
  for (const { name, rel } of dynamic) {
    const hit = [...declared].filter((x) => x.startsWith(name));
    if (hit.length) ok(`emit("${name}"+…) 匹配到 ${hit.length} 个声明 ← ${rel}`);
    else bad(`emit("${name}"+…) 一个都没匹配上 ← ${rel}：整组事件会被静默丢掉`);
  }
  // 反向：声明了却没人 emit（不算错，只是提醒）
  const emittedNames = new Set([
    ...literal.map((x) => x.name),
    ...dynamic.flatMap(({ name }) => [...declared].filter((x) => x.startsWith(name)))
  ]);
  const unused = [...declared].filter((x) => !emittedNames.has(x));
  if (unused.length) console.log(`  ⚠️  声明了但没有代码 emit：${unused.join(", ")}`);
  console.log("");
}

console.log(fails === 0 ? `全部通过（${checks} 项）` : `${fails} / ${checks} 项失败`);
process.exit(fails === 0 ? 0 : 1);
