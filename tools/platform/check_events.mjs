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

/** 用平台内核的学科（Python 和英语各有自己的 progress.js，不在这个契约里） */
const SUBJECTS = ["typing", "math", "cn"];

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

for (const id of SUBJECTS) {
  console.log(`[${id}]`);
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
