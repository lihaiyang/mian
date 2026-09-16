/**
 * 判题引擎（PythonRunner.judge）的边界测试 —— Playwright
 *
 * 用法：
 *   python3 tools/dev_server.py 8791 &
 *   PLAYWRIGHT_PATH=<一份现成的 playwright 目录> node tools/e2e_judge.mjs [地址]
 *   （PLAYWRIGHT_PATH 指向 node_modules/playwright，例如 npx 缓存里的那一份）
 *
 * 覆盖：带标准输入的判题、多测试点、死循环超时中断（必须由主线程写 SIGINT，
 *       Worker 自己的 setTimeout 是没用的）、中断后引擎可恢复、语法错误、EOFError。
 */
const pwSpec = process.env.PLAYWRIGHT_PATH
  ? "file://" + process.env.PLAYWRIGHT_PATH.replace(/\/$/, "") + "/index.mjs"
  : "playwright";
const { chromium } = await import(pwSpec);

const BASE = process.argv[2] || process.env.BASE || "http://127.0.0.1:8791";
const out = [];
let failed = 0;
function check(name, ok, extra = "") {
  out.push(`${ok ? "✅" : "❌"} ${name}${extra ? " —— " + extra : ""}`);
  if (!ok) failed++;
}

const browser = await chromium.launch({ channel: process.env.PW_CHANNEL || "chrome" });
const page = await browser.newPage();
const pageErrors = [];
page.on("pageerror", (e) => pageErrors.push(e.message));

await page.goto(BASE + "/", { waitUntil: "domcontentloaded" });
await page.waitForFunction(() => document.getElementById("statusText")?.textContent.includes("就绪"), null, { timeout: 60000 });

// 打开「练习」把题库（懒加载）拉起来
await page.evaluate(() => Learn.open("exercise"));
await page.waitForFunction(() => typeof EXERCISE_BANK !== "undefined" && EXERCISE_BANK.length > 1000, null, { timeout: 60000 });

// 1. 带标准输入的题：直接把参考答案喂进去，输出应当完全一致
const r1 = await page.evaluate(async () => {
  const ex = EXERCISE_BANK.find(e => e.tests && e.tests[0].in.trim() && e.level === 1);
  const res = await PythonRunner.judge(ex.answer, ex.tests[0].in, 4000);
  return { id: ex.id, ok: !res.err && res.out.trim() === ex.tests[0].out.trim(), err: res.err };
});
check(`带输入的题判题正确（${r1.id}）`, r1.ok, r1.err || "");

// 2. 多测试点（多行输入）
const r2 = await page.evaluate(async () => {
  const ex = EXERCISE_BANK.find(e => e.tests && e.tests.length >= 2 && e.tests.every(t => t.in.includes("\n")));
  if (!ex) return { skip: true };
  for (const t of ex.tests) {
    const res = await PythonRunner.judge(ex.answer, t.in, 4000);
    if (res.err || res.out.trim() !== t.out.trim()) return { id: ex.id, ok: false, bad: t.in };
  }
  return { id: ex.id, n: ex.tests.length, ok: true };
});
check("多组测试点全部通过", r2.skip || r2.ok, r2.id ? `${r2.id} × ${r2.n}` : "题库里没有多行输入题");

// 3. 死循环：主线程按时写 SIGINT，Worker 报 timedOut
const r3 = await page.evaluate(async () => {
  const res = await PythonRunner.judge("while True:\n    pass\n", "", 1500);
  return { timedOut: res.timedOut, ms: res.ms, err: (res.err || "").slice(-40) };
});
check("死循环会被超时中断", r3.timedOut === true, JSON.stringify(r3));

// 4. 中断之后引擎仍然可用
const r4 = await page.evaluate(async () => {
  const res = await PythonRunner.judge("print(6 * 7)", "", 4000);
  return { out: res.out.trim(), err: res.err };
});
check("中断后引擎恢复正常", r4.out === "42", JSON.stringify(r4));

// 5. 语法错误
const r5 = await page.evaluate(async () => {
  const res = await PythonRunner.judge("print('未闭合", "", 4000);
  return { syntax: (res.err || "").includes("SyntaxError") };
});
check("语法错误能被识别", r5.syntax === true);

// 6. 输入不够用 → EOFError
const r6 = await page.evaluate(async () => {
  const res = await PythonRunner.judge("a = input()\nb = input()\nprint(a, b)", "只有一行", 4000);
  return { eof: (res.err || "").includes("EOFError") };
});
check("输入不够时报 EOFError", r6.eof === true);

// 7. 出错的代码不会污染终端输出（判题是静默的）
const r7 = await page.evaluate(async () => {
  const before = document.getElementById("terminalLogs").childElementCount;
  await PythonRunner.judge("print('这段输出不该出现在终端')", "", 4000);
  return { before, after: document.getElementById("terminalLogs").childElementCount };
});
check("判题不会往终端打印内容", r7.before === r7.after, `${r7.before} → ${r7.after}`);

check("页面没有 JS 报错", pageErrors.length === 0, pageErrors.slice(0, 2).join(" | "));

await browser.close();
console.log(out.join("\n"));
console.log(failed === 0 ? `\n🎉 全部 ${out.length} 项通过` : `\n❌ ${failed} / ${out.length} 项失败`);
process.exit(failed === 0 ? 0 : 1);
