#!/usr/bin/env node
/**
 * 版本号自动打标（tools/stamp.mjs）
 *
 *   node tools/stamp.mjs          # 按文件内容重算 ?v= 并写回 HTML
 *   node tools/stamp.mjs --check  # 只检查，过时了就退出 1（给 CI / 部署前用）
 *
 * 为什么需要它：
 *   CDN 对 /js/* /css/* 有 4 小时默认缓存，会盖掉 _headers 里的设置。
 *   老站只有两个页面时，"改完记得手动改 ?v=" 还能靠人记；现在有了共享层，
 *   改一次 shared/core/progress.js 就要改**所有**学科页面的版本号，
 *   漏一个就会出现"新共享层 + 旧学科页"的错版——而且只在老用户身上复现，
 *   本地永远是好的。
 *
 *   **这仍然不是打包器**：产物就是源文件本身，没有构建、没有依赖、没有 npm。
 *   它只是把"人肉改版本号"这件容易忘的事自动化了。
 *
 * 做法：把 HTML 里本地 .js/.css 的 ?v= 换成该文件内容的 sha256 前 8 位。
 *   内容没变 → 版本号不变（不会白白让用户重下）
 *   内容变了 → 版本号跟着变（缓存必然失效）
 * /vendor/* 跳过：那是第三方资源，走 immutable 强缓存 + 自己的 lockfile 版本号。
 */
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";

const REPO = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const PUBLIC = path.join(REPO, "public");
const CHECK = process.argv.includes("--check");

function walk(dir, out = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, out);
    else out.push(p);
  }
  return out;
}

function hash8(file) {
  const buf = fs.readFileSync(file);
  return crypto.createHash("sha256").update(buf).digest("hex").slice(0, 8);
}

/** 把 HTML 里的一个资源 URL 解析成 public/ 下的真实文件；解析不到就返回 null */
function resolveAsset(url, htmlFile) {
  let p = url.replace(/[?#].*$/, "");
  if (!p) return null;
  if (/^https?:|^data:|^\/\//.test(p)) return null;   // 外链不管
  let abs;
  if (p.startsWith("/")) {
    abs = path.join(PUBLIC, p);
  } else {
    abs = path.resolve(path.dirname(htmlFile), p);
  }
  if (!abs.startsWith(PUBLIC)) return null;
  if (!/\.(js|css)$/.test(abs)) return null;
  if (abs.includes(`${path.sep}vendor${path.sep}`)) return null;
  return fs.existsSync(abs) ? abs : null;
}

// 匹配 src="..." / href="..."（只处理 js/css，其余原样留着）
const ATTR_RE = /(\b(?:src|href)\s*=\s*")([^"]+\.(?:js|css))(\?v=[0-9a-zA-Z._-]+)?(")/g;

function stampFile(htmlFile) {
  const src = fs.readFileSync(htmlFile, "utf8");
  let changed = 0;
  const out = src.replace(ATTR_RE, (m, pre, url, oldV, post) => {
    const abs = resolveAsset(url, htmlFile);
    if (!abs) return m;
    const want = "?v=" + hash8(abs);
    const had = oldV || "";
    if (had === want) return m;
    changed++;
    return pre + url + want + post;
  });
  return { out, changed, src };
}

const htmls = walk(PUBLIC).filter((f) => f.endsWith(".html"));
let totalChanged = 0;
const stale = [];

for (const h of htmls) {
  const { out, changed } = stampFile(h);
  const rel = path.relative(REPO, h);
  if (changed) {
    totalChanged += changed;
    if (CHECK) {
      stale.push(`${rel}（${changed} 处）`);
    } else {
      fs.writeFileSync(h, out);
      console.log(`  ✏️  ${rel}  更新了 ${changed} 处`);
    }
  }
}

if (CHECK) {
  if (stale.length) {
    console.error("❌ 有页面的资源版本号过时了（先跑一次 node tools/stamp.mjs）：");
    stale.forEach((s) => console.error("   - " + s));
    process.exit(1);
  }
  console.log(`✅ 全部 ${htmls.length} 个页面的版本号都是最新的`);
} else {
  console.log(totalChanged
    ? `✅ 共更新 ${totalChanged} 处（检查了 ${htmls.length} 个页面）`
    : `✅ 全部 ${htmls.length} 个页面都是最新的，无需改动`);
}
