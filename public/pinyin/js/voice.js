/* ============================================================================
 * 拼音岛 · 发音（音频精灵播放器）
 *
 * 和英语站的 Player 是同一套思路（一次请求、切音零延迟、可离线），
 * 但**不能复用那一份**：它的 key 规则（food_apple#w / A#n / r_xxx#p1）
 * 是英语单词表长出来的，拼音岛的分组是按"孩子正在练什么"切的。
 *
 * 三级降级（和英语站一致，绝不出现"点了没声音的死界面"）：
 *   ① 音频精灵（say -v Tingting 合成，最标准）
 *   ② 系统 TTS（Web Speech API 的 zh-CN，音色因设备而异但总能出声）
 *   ③ 返回 false，由调用方给一句人话提示
 *
 * 分组（对应 tools/pinyin/gen_pinyin_audio.py）：
 *   i:b  声母    f:a  韵母    d:1 四声示范    tn:1 声调名称
 *   w:zhi 整体认读    p:ba 拼读（bd1…bd4 四个难度）
 * ========================================================================== */
(function () {
  "use strict";

  var BASE = "assets/audio/";
  var groups = {};        // name -> { json, ok, promise }
  var audio = null;
  var audioGroup = null;
  var stopTimer = null;
  var usedFallback = 0;   // 用了几次系统 TTS（给页面提示用）

  function el() {
    if (!audio) {
      audio = document.createElement("audio");
      audio.preload = "auto";
      audio.setAttribute("playsinline", "");
      document.body.appendChild(audio);
    }
    return audio;
  }

  /** key 属于哪一组 —— 前缀直接就是组名，除了拼读要按音节查表 */
  function groupOf(key) {
    var p = key.split(":")[0];
    if (p === "i") return "sm";
    if (p === "f") return "ym";
    if (p === "d" || p === "tn") return "sd";
    if (p === "w") return "zt";
    if (p === "p") return bdOf(key.slice(2));
    return null;
  }

  /** 拼读分成 bd1…bd4 四组（按声母韵母难度），加载后才查得到，见 index() */
  var sylIndex = null;      // 音节 -> 组名
  function bdOf(syl) {
    if (sylIndex && sylIndex[syl]) return sylIndex[syl];
    return null;
  }
  /** 页面把音节表交进来，播放器才知道 ba 属于哪一组 */
  function index(rows) {
    sylIndex = {};
    var SINGLE = { a: 1, o: 1, e: 1, i: 1, u: 1, "ü": 1 };
    var COMPOUND = { ai: 1, ei: 1, ui: 1, ao: 1, ou: 1, iu: 1, ie: 1, "üe": 1, er: 1 };
    (rows || []).forEach(function (r) {
      if (!r.i) return;
      var f = r.f;
      var g;
      if (SINGLE[f]) g = "bd1";
      else if (COMPOUND[f]) g = "bd2";
      else if (r.i === "zh" || r.i === "ch" || r.i === "sh" || r.i === "r" || /ng$/.test(f)) g = "bd4";
      else g = "bd3";
      sylIndex[r.s] = g;
    });
  }

  function loadGroup(g) {
    if (groups[g]) return groups[g].promise;
    var rec = { ok: false, json: null, promise: null };
    groups[g] = rec;
    rec.promise = fetch(BASE + g + ".json", { cache: "force-cache" })
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (j) {
        if (j && j.clip) { rec.json = j; rec.ok = true; }
        return rec.ok;
      })
      .catch(function () { return false; });
    return rec.promise;
  }

  function stop() {
    if (stopTimer) { clearTimeout(stopTimer); stopTimer = null; }
    if (audio) { try { audio.pause(); } catch (e) {} }
    if (window.speechSynthesis) { try { speechSynthesis.cancel(); } catch (e) {} }
  }

  /** ② 系统 TTS 兜底：读汉字（拼音的"音"就是这些字的音） */
  function speak(text) {
    if (!window.speechSynthesis || !text) return false;
    try {
      var u = new SpeechSynthesisUtterance(text);
      u.lang = "zh-CN";
      u.rate = 0.85;                 // 教拼音要慢一点
      u.pitch = 1.05;
      speechSynthesis.cancel();
      speechSynthesis.speak(u);
      usedFallback++;
      return true;
    } catch (e) { return false; }
  }

  /**
   * 播一条。text 是给系统 TTS 兜底用的汉字（精灵里没有时读它）。
   * 返回 Promise<boolean>：true = 确实出声了。
   */
  function play(key, text) {
    var g = groupOf(key);
    if (!g) return Promise.resolve(speak(text));
    return loadGroup(g).then(function (ok) {
      if (!ok) return speak(text);
      var j = groups[g].json;
      var seg = j.clip[key];
      if (!seg) return speak(text);
      var a = el();
      if (audioGroup !== g) { a.src = BASE + j.file; audioGroup = g; }
      a.playbackRate = 1;
      try { a.currentTime = seg[0]; } catch (e) {}
      var p;
      try { p = a.play(); } catch (e) { return speak(text); }
      if (!p || !p.then) return true;
      return p.then(function () {
        return new Promise(function (resolve) {
          if (stopTimer) clearTimeout(stopTimer);
          stopTimer = setTimeout(function () {
            try { a.pause(); } catch (e) {}
            resolve(true);
          }, Math.max(300, seg[1] * 1000 + 120));
        });
      }).catch(function () { return speak(text); });
    });
  }

  /** 预热：把接下来要用的组提前拉下来（点了才有声音会很卡） */
  function warm(names) {
    return Promise.all((names || []).map(loadGroup));
  }

  window.PinyinVoice = {
    play: play,
    stop: stop,
    warm: warm,
    index: index,
    groups: groups,
    usedFallback: function () { return usedFallback; }
  };
})();
