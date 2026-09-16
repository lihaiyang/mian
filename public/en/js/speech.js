/**
 * 🎤 Speech —— 本地发音评测（已拍板：不接云端，录音不出本机）
 *
 * 能判断：读没读、读完整没有、节奏像不像、快慢、声音够不够大、停顿多不多。
 * 做不到：音准（ship / sheep 分不出来）—— 所以界面上绝不给"音准分"，
 *         音准训练交给「最小对立对听辨题」+「三明治回放」+「口型提示」。
 *
 * 实现：MediaRecorder 录音 → decodeAudioData 拿 PCM → 20ms RMS 包络 →
 *       与示范音包络做归一化互相关（节奏相似度）+ 音节峰计数（完整性）。
 */
const Speech = (() => {
  const FRAME_MS = 20;
  let stream = null;
  let recorder = null;
  let chunks = [];
  let levelTimer = null;
  let analyser = null;
  let actx = null;
  let levelCb = null;
  let startedAt = 0;
  let degrade = null;     // "full" | "nomic" | "none"

  function supported() {
    return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia &&
      window.MediaRecorder && (window.AudioContext || window.webkitAudioContext));
  }

  function degradeMode() {
    if (degrade) return degrade;
    if (!supported()) return (degrade = "none");
    if (stream) return (degrade = "full");
    return (degrade = "nomic");
  }

  async function requestMic() {
    if (stream) { degrade = "full"; return true; }
    if (!supported()) { degrade = "none"; return false; }
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true }
      });
      degrade = "full";
      return true;
    } catch (e) {
      degrade = "nomic";
      return false;
    }
  }

  function onLevel(cb) { levelCb = cb; }

  function pickMime() {
    const cands = ["audio/webm;codecs=opus", "audio/webm", "audio/mp4", "audio/ogg"];
    for (const m of cands) {
      try { if (MediaRecorder.isTypeSupported && MediaRecorder.isTypeSupported(m)) return m; } catch (e) {}
    }
    return "";
  }

  async function start() {
    if (!stream) {
      const ok = await requestMic();
      if (!ok) return false;
    }
    chunks = [];
    const mime = pickMime();
    try {
      recorder = mime ? new MediaRecorder(stream, { mimeType: mime }) : new MediaRecorder(stream);
    } catch (e) {
      try { recorder = new MediaRecorder(stream); } catch (e2) { degrade = "none"; return false; }
    }
    recorder.ondataavailable = e => { if (e.data && e.data.size) chunks.push(e.data); };
    recorder.start();
    startedAt = Date.now();

    // 实时音量（给波形用）
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      actx = actx || new AC();
      const src = actx.createMediaStreamSource(stream);
      analyser = actx.createAnalyser();
      analyser.fftSize = 1024;
      src.connect(analyser);
      const buf = new Uint8Array(analyser.fftSize);
      levelTimer = setInterval(() => {
        if (!analyser || !levelCb) return;
        analyser.getByteTimeDomainData(buf);
        let sum = 0;
        for (let i = 0; i < buf.length; i++) { const v = (buf[i] - 128) / 128; sum += v * v; }
        levelCb(Math.sqrt(sum / buf.length));
      }, 60);
    } catch (e) { /* 没有波形也不影响录音 */ }
    return true;
  }

  function stopMeter() {
    if (levelTimer) { clearInterval(levelTimer); levelTimer = null; }
    analyser = null;
  }

  function stop() {
    return new Promise(resolve => {
      if (!recorder || recorder.state === "inactive") { stopMeter(); resolve(null); return; }
      const ms = Date.now() - startedAt;
      recorder.onstop = () => {
        stopMeter();
        const blob = new Blob(chunks, { type: (chunks[0] && chunks[0].type) || "audio/webm" });
        resolve({ blob, ms });
      };
      try { recorder.stop(); } catch (e) { stopMeter(); resolve(null); }
    });
  }

  /* ---------------- PCM / 包络 ---------------- */
  async function decode(blob) {
    const AC = window.AudioContext || window.webkitAudioContext;
    const ctx = new AC();
    try {
      const buf = await blob.arrayBuffer();
      const audioBuf = await ctx.decodeAudioData(buf);
      const data = audioBuf.getChannelData(0);
      const env = Player.rmsEnvelope(data, audioBuf.sampleRate, FRAME_MS);
      const out = { env, sampleRate: audioBuf.sampleRate, duration: audioBuf.duration, pcm: data };
      ctx.close && ctx.close();
      return out;
    } catch (e) {
      ctx.close && ctx.close();
      return null;
    }
  }

  /** 平滑包络 */
  function smooth(env, w) {
    const k = w || 2, out = [];
    for (let i = 0; i < env.length; i++) {
      let s = 0, n = 0;
      for (let j = -k; j <= k; j++) { const idx = i + j; if (idx >= 0 && idx < env.length) { s += env[idx]; n++; } }
      out.push(s / n);
    }
    return out;
  }

  /** 数音节峰：超过阈值且间隔 ≥ 120ms 的局部极大值 */
  function countPeaks(env) {
    const sm = smooth(env, 2);
    const thr = 0.18;
    const peaks = [];
    const minGap = Math.round(120 / FRAME_MS);
    for (let i = 1; i < sm.length - 1; i++) {
      if (sm[i] >= thr && sm[i] >= sm[i - 1] && sm[i] > sm[i + 1]) {
        if (!peaks.length || i - peaks[peaks.length - 1] >= minGap) peaks.push(i);
        else if (sm[i] > sm[peaks[peaks.length - 1]]) peaks[peaks.length - 1] = i;
      }
    }
    return peaks;
  }

  /** 有效发声占比（简易 VAD） */
  function voicedRatio(env) {
    if (!env.length) return 0;
    let n = 0;
    for (const v of env) if (v > 0.12) n++;
    return n / env.length;
  }

  /** 句内停顿：连续静音 ≥ 300ms 的段数 */
  function pauses(env) {
    const minLen = Math.round(300 / FRAME_MS);
    let run = 0, n = 0;
    for (const v of env) {
      if (v <= 0.10) { run++; if (run === minLen) n++; }
      else run = 0;
    }
    return n;
  }

  /**
   * 归一化互相关：把录音包络与示范音包络对齐，取最大相似度。
   * 滞后范围 ±35%，这样"读快一点/慢一点"仍然能对齐。
   */
  function correlate(a, b) {
    if (!a || !b || a.length < 3 || b.length < 3) return 0;
    const mean = arr => arr.reduce((s, v) => s + v, 0) / arr.length;
    const ma = mean(a), mb = mean(b);
    const na = a.map(v => v - ma), nb = b.map(v => v - mb);
    const norm = arr => Math.sqrt(arr.reduce((s, v) => s + v * v, 0)) || 1;
    const Nb = norm(nb);
    let best = 0;
    const maxLag = Math.max(1, Math.round(b.length * 0.35));
    for (let lag = -maxLag; lag <= maxLag; lag += 1) {
      let dot = 0, count = 0;
      for (let i = 0; i < na.length; i++) {
        const j = i + lag;
        if (j < 0 || j >= nb.length) continue;
        dot += na[i] * nb[j];
        count++;
      }
      if (count < Math.min(na.length, nb.length) * 0.5) continue;
      const v = dot / (norm(na) * Nb);
      if (v > best) best = v;
    }
    return Math.max(0, best);
  }

  /**
   * 打分。绝不返回"音准"，只返回可以验证的六个信号。
   * @param {object} rec  stop() 的返回 {blob, ms}
   * @param {object} opts {syll 音节数, refKey 示范音 key, lang}
   */
  async function grade(rec, opts) {
    opts = opts || {};
    const syll = Math.max(1, opts.syll || 1);
    const decoded = await decode(rec.blob);
    if (!decoded || !decoded.env.length) {
      return { level: "rhythm", score: 0, stars: 1, ok: false,
        signals: {}, tips: ["这次没录到声音，再试一次吧～"] };
    }
    const env = decoded.env;
    const dur = decoded.duration;
    const ratio = voicedRatio(env);
    const peaks = countPeaks(env);
    const pauseN = pauses(env);
    let rms = 0;
    for (let i = 0; i < decoded.pcm.length; i += 7) rms += decoded.pcm[i] * decoded.pcm[i];
    rms = Math.sqrt(rms / Math.max(1, Math.floor(decoded.pcm.length / 7)));

    let refEnv = null, refDur = null;
    if (opts.refKey) {
      refEnv = await Player.envelope(opts.refKey);
      try {
        const g = Player.textOf(opts.refKey);
        if (refEnv) refDur = refEnv.length * FRAME_MS / 1000;
        void g;
      } catch (e) {}
    }

    const done = ratio >= 0.18 && rms > 0.012;
    const peakDiff = Math.abs(peaks.length - syll);
    const complete = peaks.length === 0 ? false : peakDiff <= Math.max(1, Math.round(syll * 0.34));
    const speedRatio = refDur ? dur / refDur : null;
    const speedOk = speedRatio == null ? true : (speedRatio > 0.55 && speedRatio < 1.85);
    const rhythm = refEnv ? correlate(smooth(env, 2), smooth(refEnv, 2)) : null;
    const loud = rms > 0.035;
    const fluent = pauseN <= Math.max(1, Math.round(syll / 2));

    // 综合分（不给音准留位置）
    let score = 40;
    if (done) score += 15;
    if (complete) score += 15;
    if (loud) score += 10;
    if (speedOk) score += 8;
    if (rhythm != null) score += Math.round(rhythm * 20);
    else score += 10;
    if (fluent) score += 7;
    score = Math.max(20, Math.min(100, score));

    let stars = 1;
    if (score >= 62) stars = 2;
    if (score >= 82 && done && complete && loud) stars = 3;

    const tips = [];
    if (!done) tips.push("这次声音有点小，凑近一点、大声一点点 🐼");
    if (done && !complete) {
      tips.push(peaks.length < syll
        ? "这个词有 " + syll + " 个音节，刚才好像少读了一点，我们一个音一个音来～"
        : "刚才稍微多读了一点点，慢一点会更清楚");
    }
    if (!loud && done) tips.push("声音再大一点就更好啦");
    if (!speedOk && speedRatio != null) tips.push(speedRatio > 1.85 ? "读得有点慢，可以再顺一点" : "读得有点赶，慢下来会更清楚");
    if (rhythm != null && rhythm >= 0.6) tips.push("节奏和示范音很像！");
    if (!fluent) tips.push("中间停了几次，试着一口气读完");
    if (!tips.length) tips.push("读得很完整、很有节奏！");

    return {
      level: "rhythm",
      score, stars, ok: true,
      duration: dur, peaks: peaks.length, syll,
      signals: {
        done: { ok: done, label: "读到声音了" },
        complete: { ok: !!complete, label: "读完整了" },
        rhythm: { ok: rhythm == null ? true : rhythm >= 0.45, label: "节奏很像" },
        loud: { ok: loud, label: "声音够大" },
        speed: { ok: speedOk, label: "快慢合适" },
        fluency: { ok: fluent, label: "很流利" }
      },
      tips
    };
  }

  function play(blob) {
    return new Promise(resolve => {
      if (!blob) { resolve(false); return; }
      const url = URL.createObjectURL(blob);
      const a = new Audio(url);
      a.onended = () => { URL.revokeObjectURL(url); resolve(true); };
      a.onerror = () => { URL.revokeObjectURL(url); resolve(false); };
      a.play().catch(() => resolve(false));
    });
  }

  /** 把录音存到本机 IndexedDB（永不上传） */
  async function saveLocal(itemId, blob) {
    try {
      const pid = (typeof Progress !== "undefined" && Progress.profileId) ? Progress.profileId() : "p_default";
      await Store.idbPut("en_rec", pid + ":" + itemId, { blob, at: Date.now(), itemId });
      return true;
    } catch (e) { return false; }
  }
  async function listLocal() {
    const all = await Store.idbAll("en_rec");
    const pid = (typeof Progress !== "undefined" && Progress.profileId) ? Progress.profileId() : "p_default";
    return all.filter(r => String(r.key).startsWith(pid + ":")).map(r => Object.assign({ key: r.key }, r.value));
  }
  async function removeLocal(key) { return Store.idbDel("en_rec", key); }

  return {
    supported, requestMic, start, stop, grade, play, onLevel, degradeMode,
    saveLocal, listLocal, removeLocal, decode
  };
})();
window.Speech = Speech;
