/**
 * 🎵 AudioFX —— 全部用 Web Audio 合成，零音频文件、零依赖
 * 儿童产品的音效原则：答对要"亮"、答错要"柔"（绝不刺耳、绝不像警报）
 */
const AudioFX = (() => {
  let ctx = null;
  let on = true;

  function ac() {
    if (!ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      try { ctx = new AC(); } catch (e) { return null; }
    }
    if (ctx.state === "suspended") { try { ctx.resume(); } catch (e) {} }
    return ctx;
  }

  function tone(freq, start, dur, type, gain) {
    const c = ac(); if (!c) return;
    const osc = c.createOscillator();
    const g = c.createGain();
    osc.type = type || "sine";
    osc.frequency.setValueAtTime(freq, c.currentTime + start);
    g.gain.setValueAtTime(0, c.currentTime + start);
    g.gain.linearRampToValueAtTime(gain == null ? 0.16 : gain, c.currentTime + start + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0008, c.currentTime + start + dur);
    osc.connect(g); g.connect(c.destination);
    osc.start(c.currentTime + start);
    osc.stop(c.currentTime + start + dur + 0.03);
  }

  function noise(start, dur, gain, freq) {
    const c = ac(); if (!c) return;
    const len = Math.floor(c.sampleRate * dur);
    const buf = c.createBuffer(1, len, c.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 3);
    const src = c.createBufferSource(); src.buffer = buf;
    const f = c.createBiquadFilter(); f.type = "lowpass"; f.frequency.value = freq || 900;
    const g = c.createGain(); g.gain.value = gain == null ? 0.22 : gain;
    src.connect(f); f.connect(g); g.connect(c.destination);
    src.start(c.currentTime + start);
  }

  const api = {
    setEnabled(v) { on = !!v; },
    enabled() { return on; },
    /** 解锁：iOS 需要用户手势后才能出声 */
    unlock() { ac(); },

    playSuccess() { if (!on) return; [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => tone(f, i * 0.075, 0.26, "sine", 0.15)); },
    playWrong() { if (!on) return; tone(392, 0, 0.18, "sine", 0.11); tone(311.13, 0.14, 0.3, "sine", 0.1); },
    playStamp() { if (!on) return; noise(0, 0.16, 0.3, 620); tone(146.83, 0.01, 0.2, "triangle", 0.13); },
    playFlip() { if (!on) return; noise(0, 0.08, 0.12, 3200); },
    playPop() { if (!on) return; tone(880, 0, 0.1, "triangle", 0.12); tone(1320, 0.05, 0.1, "sine", 0.07); },
    playClick() { if (!on) return; tone(660, 0, 0.06, "square", 0.05); },
    playLevelUp() { if (!on) return; [523.25, 659.25, 783.99, 1046.5, 1318.5].forEach((f, i) => tone(f, i * 0.09, 0.45, "triangle", 0.13)); },
    playStart() { if (!on) return; [659.25, 880].forEach((f, i) => tone(f, i * 0.1, 0.22, "sine", 0.12)); }
  };
  return api;
})();
window.AudioFX = AudioFX;
