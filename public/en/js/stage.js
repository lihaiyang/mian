/**
 * 🏝 Stage —— 学习舞台与题型引擎
 *
 * 一个关卡 = 5 个小关（听 → 说 → 读 → 写 → 玩），每小关就是一个问题。
 * 题型都注册在 Stage.types 里；每个题型给出一个"题目对象"：
 *   { kind: "choice" | "speak" | "spell", ... }
 * 具体渲染由通用渲染器负责，这样加新题型不用改流程。
 *
 * 反馈原则：答错只是"差一点点"，不变红、不震动、不扣分；
 * 连续错两次就直接给正确答案 + 示范音，不让孩子卡住。
 */
const Stage = (() => {
  const root = () => document.getElementById("stageRoot");

  const state = {
    open: false,
    mode: "level",        // level | phonics | letter | sentence | reader
    title: "",
    emoji: "🏝",
    items: [],            // 本轮要考的"题目对象"
    idx: 0,
    right: 0, wrong: 0, firstTry: 0,
    startedAt: 0,
    words: [],            // 本关涉及的词条
    onFinish: null,
    studied: [],          // 本关学过的 itemId（进记忆盒）
    results: [],          // 每题的 {id, ok}，复习模式据此结算记忆盒
    exitArmed: false
  };

  /* ---------------- 工具 ---------------- */
  function wordsOf(level) {
    const bank = window.EN_WORDS || {};
    const all = [];
    for (const t in bank) all.push.apply(all, bank[t]);
    const byId = {};
    all.forEach(w => { byId[w.id] = w; });
    return (level.words || []).map(id => byId[id]).filter(Boolean);
  }

  function allWords() {
    const bank = window.EN_WORDS || {};
    const out = [];
    for (const t in bank) out.push.apply(out, bank[t]);
    return out;
  }

  function distractors(word, n) {
    // 干扰项的配图不能和正确答案、也不能彼此撞图 ——
    // 撞了的话题目里会出现两张一模一样的图，孩子点哪张都可能被判错。
    // family 主题里 👦 被 son / brother / nephew / boy / grandson 共用，
    // 种子又是固定的，所以这不是"偶发"，每次进那一关都会出现。
    // 从选干扰项这一步保证唯一，比要求数据里每张图都不重复更可靠。
    const used = new Set([word.emoji]);
    const take = (list, want) => {
      const out = [];
      UI.shuffle(list, "d" + word.id).forEach(w => {
        if (out.length >= want) return;
        if (used.has(w.emoji)) return;
        used.add(w.emoji);
        out.push(w);
      });
      return out;
    };
    const same = allWords().filter(w => w.id !== word.id && w.theme === word.theme);
    const others = allWords().filter(w => w.id !== word.id && w.theme !== word.theme);
    const out = take(same, n - 1);
    if (out.length < n - 1) out.push(...take(others, n - 1 - out.length));
    return out;
  }

  /* ---------------- 题型 ---------------- */
  const types = {
    /** 听音选图 */
    listen(word) {
      const wrongs = distractors(word, 3);
      const options = UI.shuffle([word].concat(wrongs), "l" + word.id);
      return {
        kind: "choice", type: "listen", label: "听一听", emoji: "👂", word,
        audioKey: word.id + "#w",
        prompt: "听一听，哪个是 " + word.word + "？",
        promptZh: "点一下正确的图片",
        render: "emoji",
        options: options.map(w => ({ id: w.id, emoji: w.emoji, text: w.word, correct: w.id === word.id }))
      };
    },

    /** 看词选义（读） */
    read(word) {
      const wrongs = distractors(word, 3);
      const options = UI.shuffle([word].concat(wrongs), "r" + word.id);
      return {
        kind: "choice", type: "read", label: "读一读", emoji: "📖", word,
        audioKey: word.id + "#w",
        prompt: "这是哪个东西？",
        promptZh: word.word,
        render: "word",
        options: options.map(w => ({ id: w.id, emoji: w.emoji, text: w.zh, correct: w.id === word.id }))
      };
    },

    /** 写一写：用字母块拼出单词 */
    write(word) {
      // ⚠️ 多词词条（"pencil box"、"yo-yo"、"hide-and-seek"）要**保留空格和连字符**。
      // 原来这里是 replace(/[^a-z]/g,"")，把 "pencil box" 变成 "pencilbox" ——
      // 一个根本不存在的拼写 —— 而字母块里又没有空格，
      // 孩子只能拼出那个错的，系统还判他对。实测 12 条中招。
      const letters = String(word.word).toLowerCase().replace(/[^a-z -]/g, "").split("");
      // 干扰块只从 a–z 里取，不加空格/连字符（否则会凭空多出几个空格块）
      const extra = "abcdefghijklmnopqrstuvwxyz".split("");
      const pool = letters.concat(UI.shuffle(extra.filter(c => letters.indexOf(c) === -1), "w" + word.id).slice(0, Math.min(3, Math.max(2, 6 - letters.length))));
      return {
        kind: "spell", type: "write", label: "写一写", emoji: "✍️", word,
        audioKey: word.id + "#w",
        prompt: "把单词拼出来",
        promptZh: word.zh,
        letters: UI.shuffle(pool, "s" + word.id),
        answer: letters.join("")
      };
    },

    /** 说一说：跟读 */
    speak(word) {
      return {
        kind: "speak", type: "speak", label: "说一说", emoji: "🗣", word,
        audioKey: word.id + "#w",
        refKey: word.id + "#w",
        prompt: "跟着读一遍",
        promptZh: word.zh,
        syll: word.syll || 1
      };
    },

    /** 玩一玩：听音抓词（快节奏巩固） */
    play(word) {
      const wrongs = distractors(word, 5);
      const options = UI.shuffle([word].concat(wrongs), "p" + word.id);
      return {
        kind: "choice", type: "play", label: "玩一玩", emoji: "🎮", word,
        audioKey: word.id + "#w",
        prompt: "听到哪个词，就抓住它！",
        promptZh: "眼疾手快",
        render: "word",
        options: options.map(w => ({ id: w.id, emoji: w.emoji, text: w.word, correct: w.id === word.id }))
      };
    }
  };

  /**
   * 最小对立对听辨（cap/cup、l/w 这种）。
   * 为什么要有它：本站只做本地节奏评测、**不给音准分**，所以把音准训练挪到听力端 ——
   * 听力是可以自动判分的，而且「先听得出区别，才可能读得出区别」。
   */
  types.pair = function (pair, side) {
    const isB = side === "b";
    const target = isB ? pair.bInfo : pair.aInfo;
    const targetId = isB ? pair.b : pair.a;
    const other = isB ? pair.aInfo : pair.bInfo;
    const otherId = isB ? pair.a : pair.b;
    const opts = UI.shuffle([
      { id: targetId, emoji: target.emoji, text: target.word, correct: true },
      { id: otherId, emoji: other.emoji, text: other.word, correct: false }
    ], "pair" + pair.id + side);
    return {
      kind: "choice", type: "listen", label: "听辨", emoji: "👂",
      pair: pair,
      audioKey: targetId + "#w",
      prompt: "听一听，是哪一个？",
      promptZh: target.word + " 还是 " + other.word,
      render: "pair",
      options: opts
    };
  };

  /** 拼读关的题型：把音块连起来读 */
  types.blend = function (blend, lesson) {
    return {
      kind: "blend", type: "read", label: "拼一拼", emoji: "🧩",
      blend, lesson,
      prompt: "把音块连起来读",
      promptZh: blend.word,
      audioKey: "ph:" + lesson.id + ":" + blend.word + "#w",
      refKey: "ph:" + lesson.id + ":" + blend.word + "#w"
    };
  };

  /** 字母关的题型：听字母音，选字母 */
  types.letter = function (letter, all) {
    const wrongs = UI.shuffle(all.filter(l => l.letter !== letter.letter), "lt" + letter.letter).slice(0, 3);
    const options = UI.shuffle([letter].concat(wrongs), "lo" + letter.letter);
    return {
      kind: "choice", type: "listen", label: "听一听", emoji: "👂",
      letter, audioKey: letter.letter + "#n",
      prompt: "听一听，是哪个字母？",
      // ⚠️ 这里**不能**放 letter.sound。
      // audioKey 的 "#n" 播的是字母的**名字**（A 读 "ay"），
      // 而 letter.sound 是它在单词里的**发音**（A 读 /æ/）——
      // 原来题面写 /æ/、音频放 "ay"，26 个字母**全部**对不上。
      // 字母卡（学习页）上名字和发音都该有，但听力题只能对上一个。
      promptZh: "听的是字母的名字，不是它在单词里的发音",
      render: "letter",
      options: options.map(l => ({ id: l.letter, emoji: l.emoji, text: l.letter, correct: l.letter === letter.letter }))
    };
  };

  /** 句子关的题型：替换词填空 */
  types.sentence = function (sent, blank) {
    // 干扰项按词面去重：词库里同形词（cat/dog 这类）混进来会出现"两个选项都对"
    const seen = {};
    const wrongs = UI.shuffle(sent.blanks.concat(
      allWords().map(w => ({ word: w.word, emoji: w.emoji, zh: w.zh }))
    ), "se" + sent.id + blank.word).filter(o => {
      const k = String(o.word).toLowerCase();
      if (k === String(blank.word).toLowerCase() || seen[k]) return false;
      seen[k] = 1;
      return true;
    }).slice(0, 3);
    const options = UI.shuffle([blank].concat(wrongs), "so" + sent.id + blank.word);
    return {
      kind: "choice", type: "read", label: "选一选", emoji: "💬",
      sentence: sent, blank,
      prompt: "哪一句是对的？",
      promptZh: sent.zh,
      audioKey: sent.id + "#s",
      render: "sentence",
      options: options.map(o => ({ id: o.word, emoji: o.emoji, text: String(sent.pattern).replace("___", o.word), correct: o.word === blank.word }))
    };
  };

  /** 绘本理解题 */
  types.quiz = function (reader, q, i) {
    return {
      kind: "choice", type: "read", label: "想一想", emoji: "📖",
      reader, q,
      prompt: q.q,
      promptZh: q.zh,
      render: "quiz",
      options: q.options.map((t, idx) => ({ id: "o" + idx, emoji: "", text: t, correct: idx === q.answer }))
    };
  };

  /* ---------------- 渲染 ---------------- */
  function shell(inner) {
    const total = state.items.length || 1;
    const pct = Math.round((state.idx / total) * 100);
    return '' +
      '<div class="stage">' +
        '<div class="stage-top">' +
          '<button class="btn btn-sm" id="stageExit" aria-label="退出关卡">← 退出</button>' +
          '<div class="stage-title">' + UI.esc(state.title) + '</div>' +
          '<div class="stage-track"><div class="fill" style="width:' + pct + '%"></div>' +
            '<div class="walker" style="left:' + pct + '%" aria-hidden="true">🐼</div></div>' +
          '<div class="stage-title">' + (state.idx + 1) + "/" + total + '</div>' +
        '</div>' +
        '<div id="stageBody">' + inner + '</div>' +
      '</div>';
  }

  function renderQuestion() {
    const q = state.items[state.idx];
    if (!q) { finish(); return; }
    const r = root();
    r.innerHTML = shell('<div class="qcard" id="qcard"></div>');
    bindExit();
    const host = document.getElementById("qcard");
    if (q.kind === "choice") renderChoice(host, q);
    else if (q.kind === "speak") renderSpeak(host, q);
    else if (q.kind === "spell") renderSpell(host, q);
    else if (q.kind === "blend") renderBlend(host, q);
    else next();
  }

  function badge(q) {
    return '<div class="chip active" style="align-self:flex-start">' + q.emoji + " " + UI.esc(q.label) + "</div>";
  }

  function renderChoice(host, q) {
    const isEmoji = q.render === "emoji";
    host.innerHTML =
      badge(q) +
      (q.render === "sentence"
        ? '<div class="figure small" aria-hidden="true">' + UI.esc(q.sentence.emoji || "💬") + '</div>'
        : (isEmoji || q.render === "pair") ? '<button class="speaker" id="qPlay" aria-label="播放读音">🔊 点我听一听</button>'
          : '<div class="figure" aria-hidden="true">' + UI.esc((q.word && q.word.emoji) || (q.letter && q.letter.emoji) || "❓") + "</div>") +
      '<div class="big-word">' + UI.esc(q.promptZh || "") + "</div>" +
      '<div class="muted">' + UI.esc(q.prompt) + "</div>" +
      '<div class="options" id="qOptions"></div>' +
      '<div id="qFeedback" aria-live="polite"></div>';

    const box = document.getElementById("qOptions");
    q.options.forEach(o => {
      const btn = UI.el("button", {
        class: "option", "aria-label": o.text,
        html: (o.emoji ? '<span class="opt-emoji" aria-hidden="true">' + UI.esc(o.emoji) + "</span>" : "") +
          '<span class="' + (q.render === "sentence" ? "sent-en" : "") + '">' + UI.esc(o.text) + "</span>"
      });
      btn.addEventListener("click", () => answerChoice(q, o, btn));
      box.appendChild(btn);
    });

    const play = document.getElementById("qPlay");
    if (play) play.addEventListener("click", () => playPrompt(q));
    playPrompt(q);
  }

  async function playPrompt(q) {
    if (!q.audioKey && !q.promptZh && !q.prompt) return;
    if (q.audioKey && typeof Player !== "undefined") {
      if (q.type === "listen") bump("listens");
      await Player.say(q.audioKey);
      return;
    }
    if (typeof Player !== "undefined" && Player.speakText) await Player.speakText(q.promptZh || q.prompt);
  }

  function bump(key, n) {
    if (typeof Progress !== "undefined" && Progress.bump) Progress.bump(key, n || 1);
  }

  /**
   * 显示小熊猫点评。host 是可选的兜底容器：
   * answerChoice 等异步回调里已经没有 host 变量了，所以默认全靠 #qFeedback。
   */
  function feedback(host, ok, text) {
    const box = document.getElementById("qFeedback") || host || document.getElementById("qcard");
    if (!box) return;
    box.innerHTML = UI.panda(text, ok ? "cheer" : "think");
  }

  async function answerChoice(q, opt, btn) {
    const buttons = Array.from(document.querySelectorAll("#qOptions .option"));
    if (btn.disabled) return;
    buttons.forEach(b => { b.disabled = true; });
    const ok = !!opt.correct;
    const firstTry = !q.tried;
    q.tried = true;

    if (ok) {
      btn.classList.add("correct");
      AudioFX.playSuccess();
      record(true, firstTry);
      if (q.word) Progress.markWord(q.word.id, true);
      if (q.type === "listen" && q.word) await Player.say(q.word.id + "#w");
      if (q.render === "sentence" && q.sentence) await Player.say(q.sentence.id + "#s");
      feedback(null, true, pickPraise(q));
      setTimeout(() => next(), 1100);
    } else {
      btn.classList.add("wrong");
      AudioFX.playWrong();
      record(false, firstTry);
      if (q.word) Progress.markWord(q.word.id, false);
      const right = q.options.find(o => o.correct);
      const rb = buttons.find(b => b.getAttribute("aria-label") === (right && right.text));
      if (rb) rb.classList.add("correct");
      // 连续错两次就直接给答案，别让孩子卡住
      q.misses = (q.misses || 0) + 1;
      if (q.misses >= 2) {
        feedback(null, false, "没关系，我们一起看：" + ((right && right.text) || "") + "。记住它，明天还会见到它 🐼");
        setTimeout(() => next(), 1900);
      } else {
        feedback(null, false, "差一点点～再听一次：" + (q.word ? q.word.word : ""));
        if (q.audioKey) setTimeout(() => Player.say(q.audioKey), 420);
        setTimeout(() => { buttons.forEach(b => { if (b !== btn) b.disabled = false; }); }, 900);
      }
    }
  }

  function pickPraise(q) {
    const w = q.word ? q.word.word : "";
    const pool = ["太棒了！", "答对啦！", "就是这个 👏", "好耳朵！", "厉害！"];
    const base = pool[Math.floor(Math.random() * pool.length)];
    return w ? base + " " + w : base;
  }

  /* -------- 跟读题 -------- */
  function renderSpeak(host, q) {
    const w = q.word;
    const mode = Speech.degradeMode();
    host.innerHTML =
      badge(q) +
      '<div class="figure" aria-hidden="true">' + UI.esc(w.emoji || "🔊") + "</div>" +
      '<div class="big-word">' + UI.esc(w.word) + "</div>" +
      '<div class="ipa">' + UI.esc(w.ipa || "") + " " + UI.esc(w.zh) + "</div>" +
      '<div class="btn-row" style="justify-content:center">' +
        '<button class="speaker" id="spSlow">🐢 慢速听</button>' +
        '<button class="speaker" id="spNorm">🔊 听一听</button>' +
        '<button class="speaker" id="spMine" hidden>🎧 听我自己</button>' +
      "</div>" +
      (mode === "none"
        ? '<div class="panda"><div class="panda-face">🐼</div><div class="panda-text">这个浏览器不能录音，我们先"听 + 跟读"也一样能练！</div></div>'
        : '<button class="mic-btn" id="micBtn" aria-label="按住说话"><span class="mic-emoji" aria-hidden="true">🎤</span><span id="micLabel">点一下开始</span></button>') +
      '<canvas class="wave" id="wave" width="600" height="148" aria-hidden="true"></canvas>' +
      '<div class="signal-row" id="signals"></div>' +
      '<div id="qFeedback" aria-live="polite"></div>' +
      '<div class="btn-row" style="justify-content:center"><button class="btn btn-primary" id="spNext">下一个 →</button></div>';

    document.getElementById("spNorm").addEventListener("click", () => playSpeakRef(q, 1));
    document.getElementById("spSlow").addEventListener("click", () => playSpeakRef(q, 0.62));
    playSpeakRef(q, 1);

    const mic = document.getElementById("micBtn");
    let lastBlob = null;
    if (mic) setupMic(mic, q, (blob) => {
      lastBlob = blob;
      const mine = document.getElementById("spMine");
      mine.hidden = false;
      mine.onclick = () => Speech.play(blob);
    });

    document.getElementById("spNext").addEventListener("click", () => {
      // 跟读不判对错：只要开口了就记一次
      if (lastBlob) { record(true, true); if (w) Progress.markWord(w.id, true); }
      else { record(false, true); }
      next();
    });
  }

  async function playSpeakRef(q, rate) {
    if (typeof Player === "undefined") return;
    const key = q.refKey || q.audioKey;
    if (key) await Player.say(key, { rate: rate || 1, text: q.word ? q.word.word : "" });
  }

  function setupMic(mic, q, onBlob) {
    const wave = document.getElementById("wave");
    const ctx2d = wave ? wave.getContext("2d") : null;
    const levels = [];
    let recording = false;

    Speech.onLevel(v => {
      levels.push(v);
      if (levels.length > 150) levels.shift();
      if (!ctx2d) return;
      const W = wave.width, H = wave.height;
      ctx2d.clearRect(0, 0, W, H);
      ctx2d.strokeStyle = getComputedStyle(document.body).getPropertyValue("--ink") || "#241E19";
      ctx2d.lineWidth = 4;
      ctx2d.beginPath();
      const n = levels.length;
      for (let i = 0; i < n; i++) {
        const x = (i / 149) * W;
        const y = H / 2 - levels[i] * H * 0.9;
        if (i === 0) ctx2d.moveTo(x, y); else ctx2d.lineTo(x, y);
      }
      ctx2d.stroke();
    });

    mic.addEventListener("click", async () => {
      if (!recording) {
        const ok = await Speech.start();
        if (!ok) { UI.toast("没有拿到麦克风权限，我们先听和跟读吧", "warn"); return; }
        recording = true;
        mic.classList.add("rec");
        document.getElementById("micLabel").textContent = "再点一下结束";
        levels.length = 0;
      } else {
        recording = false;
        mic.classList.remove("rec");
        mic.disabled = true;
        document.getElementById("micLabel").textContent = "听听看…";
        const rec = await Speech.stop();
        if (!rec) { mic.disabled = false; document.getElementById("micLabel").textContent = "点一下开始"; return; }
        onBlob(rec.blob);
        Speech.saveLocal(q.word ? q.word.id : "unknown", rec.blob);
        const res = await Speech.grade(rec, { syll: q.syll, refKey: q.refKey });
        Progress.addSpeakSeconds((rec.ms || 0) / 1000);
        const sig = document.getElementById("signals");
        sig.innerHTML = Object.keys(res.signals).map(k => {
          const s = res.signals[k];
          return '<span class="signal ' + (s.ok ? "ok" : "no") + '">' + (s.ok ? "✓" : "○") + " " + UI.esc(s.label) + "</span>";
        }).join("");
        document.getElementById("qFeedback").innerHTML = UI.panda(res.tips[0] || "读得不错！", res.stars >= 2 ? "cheer" : "think");
        if (res.stars >= 2) { AudioFX.playSuccess(); UI.confetti(18); } else AudioFX.playPop();
        mic.disabled = false;
        document.getElementById("micLabel").textContent = "再读一次";
      }
    });
  }

  /* -------- 拼写题 -------- */
  function renderSpell(host, q) {
    let typed = [];
    host.innerHTML =
      badge(q) +
      '<div class="figure" aria-hidden="true">' + UI.esc(q.word.emoji || "✍️") + "</div>" +
      '<div class="zh-word">' + UI.esc(q.promptZh) + " · " + UI.esc(q.word.ipa || "") + "</div>" +
      '<button class="speaker" id="qPlay">🔊 再听一次</button>' +
      '<div class="blocks" id="slots" aria-label="拼写槽"></div>' +
      '<div class="blocks" id="tiles"></div>' +
      '<div class="btn-row" style="justify-content:center">' +
        '<button class="btn btn-sm" id="spellUndo">← 退一格</button>' +
        '<button class="btn btn-sm btn-primary" id="spellOK">就是它！</button>' +
      "</div>" +
      '<div id="qFeedback" aria-live="polite"></div>';

    const slots = document.getElementById("slots");
    const tiles = document.getElementById("tiles");
    const answer = q.answer;
    let misses = 0;

    function draw() {
      slots.innerHTML = answer.split("").map((c, i) =>
        '<div class="block' + (typed[i] ? " on" : "") + '">' + UI.esc(typed[i] || "&nbsp;") + "</div>").join("");
      Array.from(tiles.children).forEach(b => { b.disabled = typed.length >= answer.length || b.dataset.used === "1"; });
    }
    q.letters.forEach((c, i) => {
      const b = UI.el("button", { class: "block", text: c, "aria-label": "字母 " + c });
      b.addEventListener("click", () => {
        if (typed.length >= answer.length) return;
        typed.push(c); b.dataset.used = "1";
        AudioFX.playClick();
        draw();
      });
      tiles.appendChild(b);
    });
    document.getElementById("spellUndo").addEventListener("click", () => {
      const c = typed.pop();
      if (c) {
        const b = Array.from(tiles.children).find(x => x.dataset.used === "1" && x.textContent === c);
        if (b) b.dataset.used = "0";
      }
      draw();
    });
    document.getElementById("qPlay").addEventListener("click", () => Player.say(q.audioKey));
    document.getElementById("spellOK").addEventListener("click", () => {
      const ok = typed.join("") === answer;
      if (ok) {
        AudioFX.playSuccess();
        Progress.markSpell(true);
        if (q.word) Progress.markWord(q.word.id, true);
        record(true, misses === 0);
        feedback(host, true, "拼对啦！" + answer);
        Player.say(q.audioKey);
        setTimeout(next, 1000);
      } else {
        misses++;
        AudioFX.playWrong();
        Progress.markSpell(false);
        if (q.word) Progress.markWord(q.word.id, false);
        record(false, misses === 1);
        if (misses >= 2) {
          feedback(host, false, "正确的拼法是 " + answer + "，跟着读一遍就好 🐼");
          typed = answer.split(""); draw();
          Player.say(q.audioKey);
          setTimeout(next, 2000);
        } else {
          feedback(host, false, "差一点点，再听听看～");
          typed = []; Array.from(tiles.children).forEach(b => { b.dataset.used = "0"; }); draw();
          Player.say(q.audioKey);
        }
      }
      draw();
    });
    draw();
    Player.say(q.audioKey);
  }

  /* -------- 拼读题 -------- */
  function renderBlend(host, q) {
    const blocks = q.blend.blocks || [];
    host.innerHTML =
      badge(q) +
      '<div class="figure" aria-hidden="true">' + UI.esc(q.blend.emoji || "🧩") + "</div>" +
      '<div class="blocks" id="blocks">' + blocks.map((b, i) =>
        '<div class="block ' + (/[aeiou]/.test(b) ? "vowel" : "") + '" data-i="' + i + '">' + UI.esc(b) + "</div>").join("") + "</div>" +
      '<button class="speaker" id="blendPlay">🔊 听一听</button>' +
      '<div class="muted">点上面的音块，一个一个读出来，再连起来</div>' +
      '<div id="qFeedback" aria-live="polite"></div>' +
      '<div class="btn-row" style="justify-content:center"><button class="btn btn-primary" id="blendNext">我读好了 →</button></div>';

    document.getElementById("blendPlay").addEventListener("click", () => Player.say(q.audioKey, { text: q.blend.word }));
    Array.from(document.querySelectorAll("#blocks .block")).forEach(el => {
      el.addEventListener("click", async () => {
        el.classList.add("on");
        AudioFX.playPop();
        await Player.speakText(el.textContent, { rate: 0.75 });
        setTimeout(() => el.classList.remove("on"), 500);
      });
    });
    document.getElementById("blendNext").addEventListener("click", () => { record(true, true); next(); });
    Player.say(q.audioKey, { text: q.blend.word });
  }

  /* ---------------- 流程 ---------------- */
  function record(ok, firstTry) {
    const q = state.items[state.idx] || {};
    const id = (q.word && q.word.id) || (q.blend && ("ph_" + q.blend.word)) || (q.letter && q.letter.letter) || null;
    state.results.push({ id, ok: !!ok, firstTry: !!firstTry });
    if (ok) { state.right++; if (firstTry) state.firstTry++; }
    else state.wrong++;
  }

  function next() {
    state.idx++;
    if (state.idx >= state.items.length) finish();
    else renderQuestion();
  }

  function starsOf() {
    const total = state.items.length || 1;
    const rate = state.firstTry / total;
    if (rate >= 0.8) return 3;
    if (rate >= 0.5) return 2;
    return 1;
  }

  async function finish() {
    const stars = starsOf();
    const xp = 10 + stars * 6;
    const before = Progress.level().level;
    const r = Progress.addXp(xp);
    const got = Progress.claimDaily();

    if (state.mode === "level" && state.levelId) Progress.markLevel(state.levelId, stars);
    if (state.mode === "phonics" && state.lessonId) Progress.markPhonics(state.lessonId);
    if (state.mode === "reader" && state.readerId) Progress.markReader(state.readerId);
    if (state.mode === "exam" && state.examId) {
      const score = Math.round((state.firstTry / Math.max(1, state.items.length)) * 100);
      Progress.markExam(state.examId, score);
    }

    if (state.mode === "pairs") bump("pairs", state.items.length);
    // 复习模式：按每题对错结算记忆盒（对→升一格，错→回第一格）
    if (state.mode === "review" && typeof SRS !== "undefined") {
      state.results.forEach(r => { if (r.id) SRS.answer(r.id, r.ok); });
      bump("reviews", state.results.length);
    }
    // 新词进记忆盒
    if (state.studied.length && typeof SRS !== "undefined") SRS.addMany(state.studied);

    Progress.addMinutes((Date.now() - state.startedAt) / 1000);
    bump("stars", stars);

    const r2 = root();
    r2.innerHTML = shell(
      '<div class="qcard result-hero">' +
        '<div class="result-stars">' + UI.stars(stars, 3) + "</div>" +
        '<div class="figure" aria-hidden="true">' + (stars >= 3 ? "🎉" : stars === 2 ? "👏" : "🌱") + "</div>" +
        "<h2 style=\"margin:0\">" + (stars >= 3 ? "太棒了！" : stars === 2 ? "完成啦！" : "又学了一关！") + "</h2>" +
        '<div class="muted">答对 ' + state.right + " 题 · 经验 +" + xp + (got ? " · 任务 +" + got : "") + "</div>" +
        '<div style="width:100%;max-width:460px">' +
          '<div class="row"><span>Lv.' + r.level + "</span>" +
          '<div class="bar xp-bar" style="flex:1"><span style="width:' + Progress.level().percent + '%"></span></div>' +
          '<span>' + Progress.level().cur + "/" + Progress.level().need + "</span></div>" +
        "</div>" +
        ((r.levelUp || before !== r.level) ? '<div class="chip active">🎊 升级到 Lv.' + r.level + " · " + UI.esc(Progress.level().title) + "</div>" : "") +
        '<div class="btn-row" style="justify-content:center;margin-top:14px">' +
          '<button class="btn" id="resAgain">再练一次</button>' +
          '<button class="btn btn-primary" id="resNext">回到地图 →</button>' +
        "</div>" +
      "</div>"
    );
    bindExit();
    AudioFX.playSuccess();
    UI.confetti(stars >= 3 ? 60 : 26);
    UI.stamp(stars >= 3 ? "太棒了" : "完成啦");
    if (state.onFinish) state.onFinish({ stars, xp, right: state.right, wrong: state.wrong });

    document.getElementById("resAgain").addEventListener("click", () => open(state.reopen));
    document.getElementById("resNext").addEventListener("click", () => {
      close();
      if (typeof App !== "undefined") App.go(state.returnTo || "#/map");
    });
  }

  function bindExit() {
    const b = document.getElementById("stageExit");
    if (!b) return;
    b.addEventListener("click", () => {
      UI.confirm("今天的进度已经存好啦，明天接着来 🐼", () => {
        close();
        if (typeof App !== "undefined") App.go(state.returnTo || "#/map");
      }, "先退出");
    });
  }

  /* ---------------- 对外：打开关卡 ---------------- */
  function open(levelId) {
    const lv = (window.EN_LEVELS || []).find(x => x.id === levelId);
    if (!lv) { UI.toast("找不到这个关卡"); return; }
    const words = wordsOf(lv);
    if (!words.length) { UI.toast("关卡内容还没准备好"); return; }
    const order = ["listen", "speak", "read", "write", "play"];
    const items = [];
    words.forEach((w, i) => {
      const t = order[i % order.length];
      items.push(types[t](w));
    });
    // 只取前 5 个词（一关 5 个小关），但保证每关至少有一个跟读
    const picked = items.slice(0, Math.max(3, Math.min(5, words.length)));
    if (!picked.some(p => p.kind === "speak") && words[0]) picked[picked.length - 1] = types.speak(words[0]);

    start({
      mode: "level", levelId, title: lv.title, emoji: lv.emoji,
      items: picked, studied: words.map(w => w.id), reopen: levelId,
      returnTo: "#/island/life"
    });
  }

  /** 拼音关 */
  function openPhonics(id) {
    const p = (window.EN_PHONICS || []).find(x => x.id === id);
    if (!p) { UI.toast("找不到这一关"); return; }
    const items = (p.blends || []).slice(0, 4).map(b => types.blend(b, p));
    if (p.teach && p.teach.length) {
      UI.modal({ title: p.emoji + " " + p.title, html: p.teach.map(t => "<p>" + UI.esc(t) + "</p>").join("") + (p.tip ? '<p class="muted">💡 ' + UI.esc(p.tip) + "</p>" : ""), actions: [{ label: "开始拼读 →", kind: "primary" }] });
    }
    start({ mode: "phonics", lessonId: id, title: p.title, emoji: p.emoji, items, studied: [], reopen: null, returnTo: "#/island/phonics" });
    state.items.forEach(it => { if (it.blend) Progress.markWord("ph_" + it.blend.word, true); });
  }

  /** 字母关 */
  function openLetter(letter) {
    const all = window.EN_LETTERS || [];
    const L = all.find(x => x.letter === letter);
    if (!L) return;
    const items = [];
    items.push(types.letter(L, all));
    (L.words || []).slice(0, 3).forEach(w => {
      const word = allWords().find(x => x.word.toLowerCase() === w.toLowerCase());
      if (word) items.push(types.listen(word));
    });
    start({ mode: "letter", letterId: letter, title: L.letter + " · " + L.sound, emoji: L.emoji, items, studied: [], reopen: null, returnTo: "#/island/letter" });
    Progress.markLetter(letter);
  }

  /** 句子关 */
  function openSentence(id) {
    const s = (window.EN_SENTENCES || []).find(x => x.id === id);
    if (!s) return;
    const items = UI.shuffle(s.blanks, "sb" + id).slice(0, 4).map(b => types.sentence(s, b));
    start({ mode: "sentence", sentenceId: id, title: s.pattern, emoji: s.emoji, items, studied: [], reopen: null, returnTo: "#/island/sentence" });
    Progress.markSentence(id);
  }

  /** 绘本理解小测 */
  function openReaderQuiz(reader) {
    const items = (reader.quiz || []).map((q, i) => types.quiz(reader, q, i));
    start({ mode: "reader", readerId: reader.id, title: reader.title + " · 小测验", emoji: "📖", items, studied: [], reopen: null, returnTo: "#/library" });
  }

  /** 听辨小挑战：一次 8 组最小对立对 */
  function openPairs() {
    const pairs = window.EN_PAIRS || [];
    if (!pairs.length) { UI.toast("听辨题库还没准备好"); return; }
    const chosen = UI.pick(pairs, 8, "pairs" + UI.today());
    const items = chosen.map((p, i) => types.pair(p, UI.rng("side" + p.id + i)() < 0.5 ? "a" : "b"));
    start({ mode: "pairs", title: "听辨小挑战", emoji: "👂", items, studied: [], reopen: null, returnTo: "#/island/phonics" });
  }

  /** 今日复习：多模态轮换出题（同一张卡每次见的题型不同，避免背位置） */
  function openReview(ids) {
    const bank = {};
    allWords().forEach(w => { bank[w.id] = w; });
    const items = [];
    (ids || []).forEach((id, i) => {
      const w = bank[id];
      if (!w) return;
      const mods = ["listen", "read", "write", "speak"];
      const r = UI.rng("rv" + id + i)();
      const m = mods[Math.floor(r * mods.length)];
      items.push(types[m](w));
    });
    if (!items.length) { UI.toast("今天没有要复习的卡片，去学新词吧 🐼"); return; }
    start({ mode: "review", title: "今日复习", emoji: "🔁", items, studied: [], reopen: null, returnTo: "#/map" });
  }

  /** 挑战岛：一套 10 题的模拟卷（5 题听力 + 5 题认读） */
  function openExam(setId) {
    // 取**完整**序号，不是首位数字。
    // 原来 /(\d)/ 只匹配一个字符：ex10–ex19 全被读成 1（难度退回启蒙），
    // ex20 读成 2。实测标题就是 ex10=G1、ex20=G2，一半模拟卷难度不对。
    const m = String(setId).match(/(\d+)/);
    const n = m ? parseInt(m[1], 10) : 1;
    // 20 套卷分 3 档：1–7 → G1，8–14 → G2，15–20 → G3
    const grade = Math.max(1, Math.min(3, Math.ceil(n / 7)));
    const gradePool = allWords().filter(w => w.grade === grade);
    const pool = gradePool.length >= 10 ? gradePool : allWords();
    const chosen = UI.pick(pool, 10, "exam" + setId);
    const items = chosen.map((w, i) => (i < 5 ? types.listen(w) : types.read(w)));
    start({ mode: "exam", examId: setId, title: "模拟卷 · Grade " + grade, emoji: "🏆",
      items, studied: [], reopen: null, returnTo: "#/island/challenge" });
  }

  function start(cfg) {
    Object.assign(state, {
      open: true, items: cfg.items || [], idx: 0, right: 0, wrong: 0, firstTry: 0,
      startedAt: Date.now(), mode: cfg.mode, title: cfg.title, emoji: cfg.emoji,
      studied: cfg.studied || [], results: [], onFinish: cfg.onFinish || null,
      levelId: cfg.levelId, lessonId: cfg.lessonId, letterId: cfg.letterId,
      sentenceId: cfg.sentenceId, readerId: cfg.readerId,
      reopen: cfg.reopen || null, returnTo: cfg.returnTo || "#/map"
    });
    const r = root();
    r.classList.remove("hidden");
    document.body.style.overflow = "hidden";
    Progress.touchToday();
    AudioFX.unlock();
    renderQuestion();
  }

  function close() {
    const r = root();
    r.classList.add("hidden");
    r.innerHTML = "";
    document.body.style.overflow = "";
    state.open = false;
    if (typeof Player !== "undefined") Player.stop();
    if (typeof App !== "undefined" && App.render) App.render();
  }

  function exitGuard() { return state.open; }

  return { open, openPhonics, openLetter, openSentence, openReaderQuiz, openReview, openExam, openPairs, close, exitGuard, types, state,
    register(name, def) { types[name] = def; } };
})();
window.Stage = Stage;
