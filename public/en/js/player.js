/**
 * 🔊 Player —— 音频精灵播放器（英语站的"命脉"）
 *
 * 为什么用音频精灵：一个主题的单词+例句合成一个 m4a，用 currentTime 定位播放。
 * 好处：① 一次请求 ② 切词零延迟 ③ 体积远小于 N 个 mp3 ④ 可以离线缓存。
 * 三级降级：音频精灵 → 系统 TTS（Web Speech API）→ 界面提示（绝不出现"没声音的死界面"）。
 *
 * 分组规则（与 tools/gen_audio.py 对应）：
 *   food_apple#w  → 组 food
 *   A#n           → 组 letters
 *   ph:xxx#w      → 组 phonics
 *   s_like#s      → 组 sentences
 *   r_mycat#p1    → 组 readers-1 … readers-4（探测一次后记住）
 */
const Player = (() => {
  const BASE = "assets/audio/";
  const groups = {};        // group -> {json, ok:bool, promise}
  const readergroup = {};   // readerId -> group
  let audio = null;
  let audioGroup = null;
  let stopTimer = null;
  let ttsVoice = null;
  let fallbackCb = null;
  let usedFallback = false;

  function el() {
    if (!audio) {
      audio = document.createElement("audio");
      audio.preload = "auto";
      audio.setAttribute("playsinline", "");
      document.body.appendChild(audio);
    }
    return audio;
  }

  function hashKey(key) {
    if (/^ph:/.test(key)) return "phonics";
    if (/^[A-Za-z]#n$/.test(key)) return "letters";
    if (/^s_/.test(key)) return "sentences";
    if (/^r_/.test(key)) {
      const rid = key.split("#")[0];
      return readergroup[rid] || null;      // 未知时返回 null，交给探测器
    }
    const theme = key.split("_")[0];
    return theme || null;
  }

  function loadGroup(g) {
    if (groups[g]) return groups[g].promise;
    const rec = { ok: false, json: null, promise: null };
    groups[g] = rec;
    rec.promise = fetch(BASE + g + ".json", { cache: "force-cache" })
      .then(r => (r.ok ? r.json() : null))
      .then(j => {
        if (j && j.clip) { rec.json = j; rec.ok = true; }
        return rec.ok;
      })
      .catch(() => false);
    return rec.promise;
  }

  /** 探测绘本属于哪一组（readers-1 … readers-4） */
  async function probeReader(rid) {
    if (readergroup[rid]) return readergroup[rid];
    for (let i = 1; i <= 4; i++) {
      const g = "readers-" + i;
      const ok = await loadGroup(g);
      if (!ok) continue;
      const json = groups[g].json;
      if (json && json.clip && Object.keys(json.clip).some(k => k.startsWith(rid + "#"))) {
        readergroup[rid] = g;
        return g;
      }
    }
    return null;
  }

  async function ready(group) {
    if (group && groups[group] && groups[group].ok) return true;
    if (group) return loadGroup(group);
    // 不传参时预热常用组
    await Promise.all(["letters", "phonics", "sentences"].map(loadGroup));
    return true;
  }

  function stop() {
    if (stopTimer) { clearTimeout(stopTimer); stopTimer = null; }
    if (audio) { try { audio.pause(); } catch (e) {} }
    if (window.speechSynthesis) { try { speechSynthesis.cancel(); } catch (e) {} }
  }

  /** 播放一个精灵片段；返回 Promise<boolean> */
  async function clip(key, opts) {
    opts = opts || {};
    let g = hashKey(key);
    if (!g && /^r_/.test(key)) g = await probeReader(key.split("#")[0]);
    if (!g) return false;
    const ok = await loadGroup(g);
    if (!ok) return false;
    const json = groups[g].json;
    const seg = json.clip[key];
    if (!seg) return false;
    const a = el();
    if (audioGroup !== g) {
      a.src = BASE + json.file;
      audioGroup = g;
    }
    const rate = opts.rate || 1;
    try { a.playbackRate = rate; } catch (e) {}
    const start = seg[0];
    const dur = seg[1];
    try {
      a.currentTime = start;
      await a.play();
    } catch (e) {
      return false;   // 自动播放被拦：调用方应已在其之前有用户手势
    }
    return await new Promise(resolve => {
      if (stopTimer) clearTimeout(stopTimer);
      stopTimer = setTimeout(() => {
        try { a.pause(); } catch (e) {}
        resolve(true);
      }, Math.max(200, (dur / rate) * 1000 + 90));
    });
  }

  /* ---------------- TTS 兜底 ---------------- */
  function ttsAvailable() {
    return !!(window.speechSynthesis && window.SpeechSynthesisUtterance);
  }
  function pickVoice() {
    if (ttsVoice || !ttsAvailable()) return ttsVoice;
    const vs = speechSynthesis.getVoices() || [];
    ttsVoice = vs.find(v => /en[-_]US/i.test(v.lang) && /Samantha|Google|Microsoft|Ava|Allison/i.test(v.name))
      || vs.find(v => /en[-_]US/i.test(v.lang))
      || vs.find(v => /^en/i.test(v.lang)) || null;
    return ttsVoice;
  }
  if (ttsAvailable()) {
    try { speechSynthesis.onvoiceschanged = () => { ttsVoice = null; pickVoice(); }; } catch (e) {}
  }

  function speakText(text, opts) {
    return new Promise(resolve => {
      if (!ttsAvailable() || !text) { resolve(false); return; }
      opts = opts || {};
      try { speechSynthesis.cancel(); } catch (e) {}
      const u = new SpeechSynthesisUtterance(String(text));
      const v = pickVoice();
      if (v) u.voice = v;
      u.lang = (v && v.lang) || "en-US";
      u.rate = opts.rate || 0.92;
      u.pitch = 1.05;
      u.onend = () => resolve(true);
      u.onerror = () => resolve(false);
      try { speechSynthesis.speak(u); } catch (e) { resolve(false); }
    });
  }

  /* ---------------- 文本解析（兜底时要知道读什么） ---------------- */
  function textOf(key) {
    const m = String(key).match(/^([^#]+)#(.*)$/);
    if (!m) return null;
    const id = m[1], kind = m[2];
    try {
      if (kind === "w" || kind === "s") {
        let w = null;
        const bank = window.EN_WORDS || {};
        for (const t in bank) { const hit = bank[t].find(x => x.id === id); if (hit) { w = hit; break; } }
        if (w) return kind === "w" ? w.word : (w.sent && w.sent.en);
        const lv = (window.EN_LEVELS || []).find(x => x.id === id);
        if (lv) return lv.title;
      }
      if (kind === "n") return id;
      if (/^p\d+$/.test(kind)) {
        const r = (window.EN_READERS || []).find(x => x.id === id);
        if (r) { const p = r.pages[parseInt(kind.slice(1), 10) - 1]; return p && p.en; }
      }
    } catch (e) {}
    return null;
  }

  /**
   * 播放：优先音频精灵，失败自动退到 TTS。
   * @param {string} key  例如 food_apple#w
   * @param {object} opts {rate, text}
   */
  async function say(key, kindOrOpts, maybeOpts) {
    let opts = maybeOpts || {};
    if (typeof kindOrOpts === "string") key = key + "#" + kindOrOpts;
    else if (kindOrOpts && typeof kindOrOpts === "object") opts = kindOrOpts;

    const played = await clip(key, opts);
    if (played) return true;

    const text = opts.text || textOf(key);
    if (text) {
      const ok = await speakText(text, opts);
      if (ok && !usedFallback) { usedFallback = true; if (fallbackCb) fallbackCb(); }
      return ok;
    }
    return false;
  }

  /** 取参考音的能量包络（本地发音评测要用它做节奏对比） */
  const envCache = {};
  async function envelope(key) {
    if (envCache[key]) return envCache[key];
    let g = hashKey(key);
    if (!g && /^r_/.test(key)) g = await probeReader(key.split("#")[0]);
    if (!g) return null;
    const ok = await loadGroup(g);
    if (!ok) return null;
    const json = groups[g].json;
    const seg = json.clip[key];
    if (!seg) return null;
    try {
      const buf = await (await fetch(BASE + json.file, { cache: "force-cache" })).arrayBuffer();
      const AC = window.AudioContext || window.webkitAudioContext;
      const ctx = new AC();
      const audioBuf = await ctx.decodeAudioData(buf.slice(0));
      const data = audioBuf.getChannelData(0);
      const rate = audioBuf.sampleRate;
      const from = Math.floor(seg[0] * rate);
      const to = Math.min(data.length, Math.floor((seg[0] + seg[1]) * rate));
      const env = rmsEnvelope(data.subarray(from, to), rate);
      ctx.close && ctx.close();
      envCache[key] = env;
      return env;
    } catch (e) { return null; }
  }

  /** 20ms 一帧的 RMS 包络（归一化到 0..1） */
  function rmsEnvelope(pcm, sampleRate, frameMs) {
    const step = Math.max(1, Math.floor(sampleRate * (frameMs || 20) / 1000));
    const out = [];
    for (let i = 0; i < pcm.length; i += step) {
      let sum = 0, n = 0;
      for (let j = i; j < Math.min(pcm.length, i + step); j++) { sum += pcm[j] * pcm[j]; n++; }
      out.push(Math.sqrt(sum / Math.max(1, n)));
    }
    let max = 0;
    for (const v of out) if (v > max) max = v;
    return max > 0 ? out.map(v => v / max) : out;
  }

  function onFallback(cb) { fallbackCb = cb; }
  function has(group) { return !!(groups[group] && groups[group].ok); }
  function loadedGroups() { return Object.keys(groups).filter(g => groups[g].ok); }

  return { ready, clip, say, speakText, stop, ttsAvailable, onFallback, has, envelope, rmsEnvelope, textOf, loadedGroups };
})();
window.Player = Player;
