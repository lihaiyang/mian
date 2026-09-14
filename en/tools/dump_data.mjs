#!/usr/bin/env node
// 把 en/data/*.js 里的纯数据倒成 JSON，供 check_content.py 校验。
// 用法：node en/tools/dump_data.mjs > /tmp/en_data.json
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const DATA = path.join(ROOT, "data");

const sandbox = {};
sandbox.window = sandbox;
sandbox.globalThis = sandbox;
vm.createContext(sandbox);

const files = fs.existsSync(DATA)
  ? fs.readdirSync(DATA).filter(f => f.endsWith(".js")).sort()
  : [];
const loaded = [];
for (const f of files) {
  const p = path.join(DATA, f);
  try {
    vm.runInContext(fs.readFileSync(p, "utf8"), sandbox, { filename: p });
    loaded.push(f);
  } catch (e) {
    console.error("LOAD_FAIL " + f + ": " + e.message);
  }
}

const out = {
  _files: loaded,
  words: sandbox.EN_WORDS || {},
  letters: sandbox.EN_LETTERS || [],
  phonics: sandbox.EN_PHONICS || [],
  sentences: sandbox.EN_SENTENCES || [],
  readers: sandbox.EN_READERS || [],
  islands: sandbox.EN_ISLANDS || [],
  levels: sandbox.EN_LEVELS || [],
  pairs: sandbox.EN_PAIRS || []
};
process.stdout.write(JSON.stringify(out));
