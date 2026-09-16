/**
 * 🎮 Games —— 游戏厅的 5 个小游戏
 *
 * 设计原则：
 *   ① 全部用"学过的词"（取自 EN_WORDS 词库），玩游戏就是在复习；
 *   ② 纯 DOM/CSS + emoji，零图片零依赖；触控目标 ≥ 64px，键盘也能玩；
 *   ③ 答错只是"差一点点"，温柔提示 + 低音效，**绝不出现红叉、倒计时压力、"你输了"**；
 *   ④ 每个游戏都返回 { destroy() }，计时器与监听全部清理干净，不泄漏。
 */
const Games = (() => {
  const LIST = [
    { id: "whack", name: "听音抓词", emoji: "🔨", desc: "听单词，敲中正确的那只地鼠", grade: 2 },
    { id: "match", name: "单词消消乐", emoji: "🀄", desc: "把英文和它的意思配成一对", grade: 2 },
    { id: "memory", name: "翻牌记忆", emoji: "🃏", desc: "翻开两张，找出配对的词", grade: 1 },
    { id: "chain", name: "单词接龙", emoji: "🔗", desc: "首字母接上一个词的尾字母", grade: 3 },
    { id: "bingo", name: "听音 Bingo", emoji: "🎯", desc: "听到哪个词就点哪一格，连线就赢", grade: 2 }
  ];

  let live = null;   // { timers:[], cleanups:[], destroy() }

  /* ---------------- 公共工具 ---------------- */
  function bank() {
    const all = (typeof App !== "undefined" && App.allWords) ? App.allWords() : (function () {
      const out = [];
      const b = window.EN_WORDS || {};
      for (const t in b) out.push.apply(out, b[t]);
      return out;
    })();
    return all.filter(w => w && w.word && w.emoji && w.zh);
  }

  function pickWords(n, seed) {
    const all = bank();
    if (!all.length) return [];
    const grade = (typeof Progress !== "undefined" && Progress.currentProfile) ? (Progress.currentProfile().grade || 2) : 2;
    const prefer = all.filter(w => w.grade === grade);
    const pool = prefer.length >= n * 2 ? prefer : all;
    return UI.shuffle(pool, seed == null ? Date.now() : seed).slice(0, n);
  }

  function say(w) {
    if (typeof Player === "undefined") return;
    Player.say(w.id + "#w", { text: w.word });
  }

  function newSession(root, title, total) {
    root.innerHTML =
      '<div class="gm">' +
        '<div class="gm-top">' +
          '<button class="btn btn-sm gm-exit" aria-label="退出游戏">← 退出</button>' +
          '<div class="gm-title">' + UI.esc(title) + '</div>' +
          '<div class="gm-score" aria-live="polite">0 分</div>' +
        '</div>' +
        '<div class="gm-track"><span></span></div>' +
        '<div class="gm-body"></div>' +
        '<div class="gm-tip" aria-live="polite"></div>' +
      '</div>';
    const s = {
      root,
      body: root.querySelector(".gm-body"),
      tip: root.querySelector(".gm-tip"),
      track: root.querySelector(".gm-track span"),
      scoreEl: root.querySelector(".gm-score"),
      total, score: 0, right: 0, wrong: 0, round: 0,
      timers: [], cleanups: []
    };
    root.querySelector(".gm-exit").addEventListener("click", () => {
      AudioFX.playClick();
      if (typeof App !== "undefined") App.go("#/games");
    });
    return s;
  }

  function score(s, ok) {
    s.round++;
    if (ok) { s.right++; s.score += 10; AudioFX.playSuccess(); }
    else { s.wrong++; AudioFX.playWrong(); }
    s.scoreEl.textContent = s.score + " 分";
    if (s.track) s.track.style.width = Math.min(100, Math.round(s.round / s.total * 100)) + "%";
  }

  function tip(s, text, mood) {
    s.tip.innerHTML = UI.panda(text, mood || "think");
  }

  function later(s, ms, fn) { const t = setTimeout(fn, ms); s.timers.push(t); return t; }

  function finish(s, gameId) {
    const rate = s.right / Math.max(1, s.round);
    const stars = rate >= 0.85 ? 3 : rate >= 0.6 ? 2 : 1;
    const xp = 8 + stars * 4;
    if (typeof Progress !== "undefined") {
      Progress.markGame(gameId, s.score);
      Progress.addXp(xp);
      Progress.claimDaily();
    }
    AudioFX.playSuccess();
    UI.confetti(stars >= 3 ? 50 : 24);
    if (stars >= 3) UI.stamp("太棒了");
    s.body.innerHTML =
      '<div class="gm-result">' +
        '<div class="result-stars">' + UI.stars(stars, 3) + "</div>" +
        '<div class="figure" aria-hidden="true">' + (stars >= 3 ? "🎉" : stars === 2 ? "👏" : "🌱") + "</div>" +
        "<h2>得了 " + s.score + " 分</h2>" +
        '<div class="muted">答对 ' + s.right + " · 答错 " + s.wrong + " · 经验 +" + xp + "</div>" +
        '<div class="btn-row" style="justify-content:center;margin-top:16px">' +
          '<button class="btn" id="gmAgain">再玩一局</button>' +
          '<button class="btn btn-primary" id="gmBack">回游戏厅</button>' +
        "</div>" +
      "</div>";
    s.body.querySelector("#gmAgain").addEventListener("click", () => open(s.root, gameId));
    s.body.querySelector("#gmBack").addEventListener("click", () => { if (typeof App !== "undefined") App.go("#/games"); });
  }

  /* ---------------- 1. 听音抓词 ---------------- */
  function gameWhack(root) {
    const words = pickWords(10);
    if (words.length < 4) { root.innerHTML = UI.empty("词库还没准备好，先去闯几关吧"); return; }
    const s = newSession(root, "🔨 听音抓词", words.length);
    let i = 0;

    function round() {
      if (i >= words.length) { finish(s, "whack"); return; }
      const target = words[i];
      const others = pickWords(8, "wh" + i).filter(w => w.id !== target.id).slice(0, 5);
      const opts = UI.shuffle([target].concat(others), "whack" + i);
      s.body.innerHTML = '<div class="gm-prompt">听一听，敲中 <b>' + UI.esc(target.zh) + "</b></div>" +
        '<div class="gm-holes">' + opts.map((w, k) =>
          '<button class="gm-hole" data-k="' + k + '" aria-label="' + UI.esc(w.word) + '">' +
            '<span class="gm-mole" aria-hidden="true">' + w.emoji + '</span>' +
            '<span class="gm-word">' + UI.esc(w.word) + "</span>" +
          "</button>").join("") + "</div>";
      say(target);
      Array.from(s.body.querySelectorAll(".gm-hole")).forEach(b => {
        b.addEventListener("click", () => {
          const w = opts[parseInt(b.dataset.k, 10)];
          const ok = w.id === target.id;
          b.classList.add(ok ? "ok" : "miss");
          score(s, ok);
          if (ok) {
            tip(s, "抓住了！" + w.word + " 🎉", "cheer");
            b.querySelector(".gm-mole").classList.add("pop");
          } else {
            tip(s, "差一点点～是 " + target.word + " 哦", "think");
            const right = s.body.querySelector(".gm-hole[data-k=\"" + opts.findIndex(x => x.id === target.id) + "\"]");
            if (right) right.classList.add("ok");
          }
          Array.from(s.body.querySelectorAll(".gm-hole")).forEach(x => { x.disabled = true; });
          later(s, 900, () => { i++; round(); });
        });
      });
    }
    round();
    return { destroy() {} };
  }

  /* ---------------- 2. 单词消消乐 ---------------- */
  function gameMatch(root) {
    const words = pickWords(6);
    if (words.length < 3) { root.innerHTML = UI.empty("词库还没准备好"); return; }
    const s = newSession(root, "🀄 单词消消乐", words.length);
    const cards = [];
    words.forEach(w => {
      cards.push({ key: w.id, kind: "en", label: w.word, emoji: w.emoji });
      cards.push({ key: w.id, kind: "zh", label: w.zh, emoji: "❓" });
    });
    const deck = UI.shuffle(cards, "mt" + Date.now());
    s.body.innerHTML = '<div class="gm-prompt">点两张配对的牌：英文 ↔ 中文</div><div class="gm-grid4" id="mtGrid"></div>';
    const grid = s.body.querySelector("#mtGrid");
    let first = null, lock = false, matched = 0;

    deck.forEach((c, idx) => {
      const b = UI.el("button", { class: "gm-card", "aria-label": c.label });
      b.innerHTML = '<span class="gm-face">' + (c.kind === "en" ? UI.esc(c.label) : "？") + "</span>";
      b.dataset.idx = String(idx);
      b.addEventListener("click", () => {
        if (lock || b.classList.contains("done") || b === first) return;
        AudioFX.playFlip();
        b.classList.add("open");
        b.querySelector(".gm-face").textContent = c.kind === "en" ? c.label : c.label;
        if (c.kind === "en" && words.find(w => w.id === c.key)) say(words.find(w => w.id === c.key));
        if (!first) { first = { b, c }; return; }
        const ok = first.c.key === c.key && first.c.kind !== c.kind;
        score(s, ok);
        if (ok) {
          matched++;
          first.b.classList.add("done"); b.classList.add("done");
          tip(s, "配对成功！", "cheer");
          first = null;
          if (matched >= words.length) later(s, 700, () => finish(s, "match"));
        } else {
          lock = true;
          tip(s, "这两张不是一对，再看看～", "think");
          const a = first;
          later(s, 750, () => {
            a.b.classList.remove("open"); b.classList.remove("open");
            a.b.querySelector(".gm-face").textContent = a.c.kind === "en" ? a.c.label : "？";
            b.querySelector(".gm-face").textContent = c.kind === "en" ? c.label : "？";
            first = null; lock = false;
          });
        }
      });
      grid.appendChild(b);
    });
    return { destroy() {} };
  }

  /* ---------------- 3. 翻牌记忆 ---------------- */
  function gameMemory(root) {
    const words = pickWords(6);
    if (words.length < 3) { root.innerHTML = UI.empty("词库还没准备好"); return; }
    const s = newSession(root, "🃏 翻牌记忆", words.length);
    const deck = UI.shuffle(words.concat(words).map((w, i) => ({ w, k: i })), "mm" + Date.now());
    s.body.innerHTML = '<div class="gm-prompt">翻开两张，找出同一个单词</div><div class="gm-grid4" id="mmGrid"></div>';
    const grid = s.body.querySelector("#mmGrid");
    let first = null, lock = false, matched = 0;

    deck.forEach((c, idx) => {
      const b = UI.el("button", { class: "gm-card gm-flip", "aria-label": "第 " + (idx + 1) + " 张牌" });
      b.innerHTML = '<span class="gm-back">🐼</span><span class="gm-face2">' + c.w.emoji + '<br><b>' + UI.esc(c.w.word) + "</b></span>";
      b.addEventListener("click", () => {
        if (lock || b.classList.contains("done") || b.classList.contains("open")) return;
        AudioFX.playFlip();
        b.classList.add("open");
        if (!first) { first = { b, c }; return; }
        const ok = first.c.w.id === c.w.id;
        score(s, ok);
        if (ok) {
          matched++;
          first.b.classList.add("done"); b.classList.add("done");
          say(c.w);
          tip(s, "记住啦！" + c.w.word, "cheer");
          first = null;
          if (matched >= words.length) later(s, 700, () => finish(s, "memory"));
        } else {
          lock = true;
          tip(s, "不一样哦，再想想～", "think");
          const a = first;
          later(s, 800, () => { a.b.classList.remove("open"); b.classList.remove("open"); first = null; lock = false; });
        }
      });
      grid.appendChild(b);
    });
    return { destroy() {} };
  }

  /* ---------------- 4. 单词接龙 ---------------- */
  function gameChain(root) {
    const all = bank().filter(w => /^[a-z]+$/.test(w.word));
    if (all.length < 20) { root.innerHTML = UI.empty("词库还没准备好"); return; }
    const s = newSession(root, "🔗 单词接龙", 8);
    let cur = UI.shuffle(all, Date.now())[0], i = 0;

    function round() {
      if (i >= 8) { finish(s, "chain"); return; }
      const last = cur.word.slice(-1);
      const good = all.filter(w => w.word[0] === last && w.id !== cur.id);
      if (!good.length) { i++; round(); return; }
      const target = UI.sample(good, "ch" + i);
      const bads = UI.shuffle(all.filter(w => w.word[0] !== last), "cb" + i).slice(0, 3);
      const opts = UI.shuffle([target].concat(bads), "co" + i);
      s.body.innerHTML =
        '<div class="gm-prompt">上一个词是 <b class="en">' + UI.esc(cur.word) + "</b>（结尾字母 <b>" + last + "</b>）</div>" +
        '<div class="gm-chain">' + opts.map((w, k) =>
          '<button class="gm-pick" data-k="' + k + '"><span class="gm-mole">' + w.emoji + '</span><span class="en">' + UI.esc(w.word) + "</span></button>").join("") + "</div>";
      Array.from(s.body.querySelectorAll(".gm-pick")).forEach(b => {
        b.addEventListener("click", () => {
          const w = opts[parseInt(b.dataset.k, 10)];
          const ok = w.id === target.id;
          b.classList.add(ok ? "ok" : "miss");
          score(s, ok);
          if (ok) { tip(s, "接上啦！" + cur.word + " → " + w.word, "cheer"); cur = w; i++; later(s, 800, round); }
          else { tip(s, "要用 " + last + " 开头的词哦～正确答案是 " + target.word, "think"); i++; later(s, 1500, round); }
        });
      });
    }
    round();
    return { destroy() {} };
  }

  /* ---------------- 5. 听音 Bingo ---------------- */
  function gameBingo(root) {
    const words = pickWords(9);
    if (words.length < 5) { root.innerHTML = UI.empty("词库还没准备好"); return; }
    const s = newSession(root, "🎯 听音 Bingo", 6);
    const pool = words.slice(0, 9);
    s.body.innerHTML = '<div class="gm-prompt">听单词，点对应的格子，连成一线就赢</div>' +
      '<div class="gm-grid3" id="bgGrid"></div>' +
      '<div class="btn-row" style="justify-content:center"><button class="btn" id="bgPlay">🔊 再听一次</button></div>';
    const grid = s.body.querySelector("#bgGrid");
    const picked = {};
    let current = null, i = 0, lines = 0;

    pool.forEach(w => {
      const b = UI.el("button", { class: "gm-cell", "aria-label": w.word });
      b.innerHTML = '<span class="gm-mole">' + w.emoji + '</span><span class="en">' + UI.esc(w.word) + "</span>";
      b.dataset.id = w.id;
      b.addEventListener("click", () => {
        if (current == null) return;
        const ok = w.id === current.id;
        score(s, ok);
        if (ok) {
          b.classList.add("mark");
          picked[w.id] = 1;
          tip(s, "对啦！" + w.word, "cheer");
          if (checkLine()) { lines++; UI.confetti(24); }
          i++;
          later(s, 700, next);
        } else {
          b.classList.add("miss");
          tip(s, "不是这个词哦，再听一次～", "think");
          say(current);
        }
      });
      grid.appendChild(b);
    });

    function checkLine() {
      const idx = pool.map(w => (picked[w.id] ? 1 : 0));
      const L = [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];
      return L.some(l => idx[l[0]] && idx[l[1]] && idx[l[2]]);
    }

    function next() {
      if (i >= 6) { finish(s, "bingo"); return; }
      current = UI.sample(pool.filter(w => !picked[w.id]), "bg" + i) || pool[0];
      say(current);
      tip(s, "听到的是哪个词？", "think");
    }
    s.body.querySelector("#bgPlay").addEventListener("click", () => { if (current) say(current); });
    next();
    return { destroy() {} };
  }

  const IMPL = { whack: gameWhack, match: gameMatch, memory: gameMemory, chain: gameChain, bingo: gameBingo };

  /* ---------------- 对外接口 ---------------- */
  function close() {
    if (!live) return;
    live.timers.forEach(t => clearTimeout(t));
    live.cleanups.forEach(fn => { try { fn(); } catch (e) {} });
    if (typeof Player !== "undefined") Player.stop();
    live = null;
  }

  function open(rootEl, id) {
    close();
    if (!rootEl) return null;
    if (typeof AudioFX !== "undefined") AudioFX.unlock();
    if (typeof Progress !== "undefined") Progress.touchToday();
    const fn = IMPL[id] || gameWhack;
    live = { timers: [], cleanups: [] };
    const handle = fn(rootEl) || {};
    const session = {
      destroy() {
        close();
        if (rootEl) rootEl.innerHTML = "";
        if (handle.destroy) { try { handle.destroy(); } catch (e) {} }
      }
    };
    live.cleanups.push(() => { if (handle.destroy) handle.destroy(); });
    return session;
  }

  return { list: LIST, open, close, IMPL };
})();
window.Games = Games;
