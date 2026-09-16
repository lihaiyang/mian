/**
 * 🎵 声音动效与撒花特效模块 (Web Audio API 合成，零外部依赖，100%可靠)
 */
const SoundEffects = (() => {
  let audioCtx = null;

  function getContext() {
    if (!audioCtx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) {
        audioCtx = new AudioContext();
      }
    }
    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
    return audioCtx;
  }

  return {
    // 成功提示音（清脆甜美的上升三连音：哆来咪~）
    playSuccess() {
      try {
        const ctx = getContext();
        if (!ctx) return;

        const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
        notes.forEach((freq, index) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();

          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, ctx.currentTime + index * 0.08);

          gain.gain.setValueAtTime(0, ctx.currentTime + index * 0.08);
          gain.gain.linearRampToValueAtTime(0.18, ctx.currentTime + index * 0.08 + 0.02);
          gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + index * 0.08 + 0.25);

          osc.connect(gain);
          gain.connect(ctx.destination);

          osc.start(ctx.currentTime + index * 0.08);
          osc.stop(ctx.currentTime + index * 0.08 + 0.28);
        });
      } catch (e) {
        console.warn('Audio not allowed or supported', e);
      }
    },

    // 点击按钮轻快啵啵声
    playPop() {
      try {
        const ctx = getContext();
        if (!ctx) return;

        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(440, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.08);

        gain.gain.setValueAtTime(0.12, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.08);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start();
        osc.stop(ctx.currentTime + 0.09);
      } catch (e) {}
    },

    // 报错轻柔提示（不刺耳，像敲击小木鱼提醒）
    playWarning() {
      try {
        const ctx = getContext();
        if (!ctx) return;

        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(320, ctx.currentTime);
        osc.frequency.linearRampToValueAtTime(240, ctx.currentTime + 0.15);

        gain.gain.setValueAtTime(0.15, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.18);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start();
        osc.stop(ctx.currentTime + 0.2);
      } catch (e) {}
    }
  };
})();

/**
 * 🎊 五彩纸屑庆祝特效封装
 */
const ConfettiFX = (() => {
  return {
    celebrate() {
      SoundEffects.playSuccess();
      if (typeof confetti === 'function') {
        // 左边发射
        confetti({
          particleCount: 45,
          angle: 60,
          spread: 55,
          origin: { x: 0.15, y: 0.7 },
          colors: ['#5B5FED', '#10B981', '#F472B6', '#FBBF24', '#38BDF8']
        });
        // 右边发射
        confetti({
          particleCount: 45,
          angle: 120,
          spread: 55,
          origin: { x: 0.85, y: 0.7 },
          colors: ['#5B5FED', '#10B981', '#F472B6', '#FBBF24', '#38BDF8']
        });
      }
    }
  };
})();
