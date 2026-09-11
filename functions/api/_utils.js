// Cloudflare Pages Functions 公共工具

export function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status: status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store"
    }
  });
}

export function bad(msg, status = 400) {
  return json({ ok: false, error: msg }, status);
}

export async function sha256Hex(text) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, "0")).join("");
}

// 同步码字母表：去掉容易看混的 0 O 1 I L
const ALPHABET = "23456789ABCDEFGHJKMNPQRSTUVWXYZ";

export function genCode(len = 8) {
  const rnd = new Uint8Array(len);
  crypto.getRandomValues(rnd);
  let s = "";
  for (let i = 0; i < len; i++) s += ALPHABET[rnd[i] % ALPHABET.length];
  return s.slice(0, 4) + "-" + s.slice(4);
}

export function normalizeCode(input) {
  return String(input || "").toUpperCase().replace(/[^0-9A-Z]/g, "");
}

export function pepperOf(env) {
  return env.CODE_PEPPER || "mian-dev-pepper";
}

// 简单滑动窗口限流（D1 计数），用来挡住暴力猜码
export async function rateLimit(db, key, limit, windowSec) {
  const now = Math.floor(Date.now() / 1000);
  const w = now - (now % windowSec);
  try {
    await db.prepare(
      "INSERT INTO rate (k, w, n) VALUES (?, ?, 1) ON CONFLICT(k, w) DO UPDATE SET n = n + 1"
    ).bind(key, w).run();
    const row = await db.prepare("SELECT n FROM rate WHERE k = ? AND w = ?").bind(key, w).first();
    return (row && row.n ? row.n : 1) <= limit;
  } catch (e) {
    return true;   // 限流表出错时不阻塞用户
  }
}

// 校验同步码（+ 可选 PIN），返回账号行；失败返回 { error }
export async function authAccount(db, env, code, pin) {
  const clean = normalizeCode(code);
  if (clean.length < 8) return { error: "同步码是 8 位，检查一下有没有抄漏" };
  const hash = await sha256Hex(clean + "|" + pepperOf(env));
  const acc = await db.prepare("SELECT * FROM accounts WHERE code_hash = ?").bind(hash).first();
  if (!acc) return { error: "找不到这个同步码，检查一下有没有抄错" };
  if (acc.pin_hash) {
    const ph = await sha256Hex(String(pin || "") + "|" + acc.id + "|" + pepperOf(env));
    if (ph !== acc.pin_hash) return { error: "PIN 不对哦" };
  }
  return { account: acc };
}

export function nowSec() {
  return Math.floor(Date.now() / 1000);
}

export function clientIp(request) {
  return request.headers.get("cf-connecting-ip") || "local";
}