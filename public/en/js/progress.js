/**
 * 🏅 Progress —— 成长档案：多小伙伴 · 等级经验 · 徽章 · 奖牌 · 每日任务 · 连续打卡
 * 设计原则（沿用萌码 Python 验证过的做法）：
 *   ① 一切都由"统计数字 + 判定函数"算出来，不手工记账；
 *   ② 多孩各自独立（按档案 id 隔离存储）；
 *   ③ 任何奖励都只加不扣（儿童产品不做惩罚）。
 */
const Progress = (() => {
  const EMOJIS = ["🐼", "🦊", "🐯", "🐰", "🐨", "🦄", "🐳", "🐙", "🦖", "🐝", "🐧", "🐵"];

  const LEVEL_TITLES = [
    ["🥚", "字母小萌新"], ["🐣", "字母小达人"], ["🔤", "会认字母啦"], ["🧩", "拼读小新手"], ["🐱", "会拼 CVC"],
    ["👂", "听力小耳朵"], ["🗣", "敢开口啦"], ["🍎", "生活词汇王"], ["🎨", "颜色小画家"], ["🔢", "数字小行家"],
    ["🐶", "动物好朋友"], ["👕", "穿衣小能手"], ["🏫", "校园小达人"], ["☀️", "天气小预报员"], ["🚌", "交通小司机"],
    ["🏠", "家居小管家"], ["💬", "句子小工匠"], ["❓", "提问小能手"], ["📖", "认词小读者"], ["📚", "绘本小书虫"],
    ["🎧", "听辨小高手"], ["🎤", "朗读小明星"], ["✍️", "拼写小能手"], ["🧠", "记忆小超人"], ["🏅", "剑桥小勇士"],
    ["🌟", "英语小达人"], ["🚀", "单词火箭"], ["🛰️", "英语小工程师"], ["👑", "英语小王者"], ["🌈", "萌语岛传奇"]
  ];
  const MAX_LEVEL = LEVEL_TITLES.length;
  const levelNeed = lv => 80 + (lv - 2) * 20;

  function levelInfo(xp) {
    let lv = 1, rest = Math.max(0, Number(xp) || 0);
    while (lv < MAX_LEVEL && rest >= levelNeed(lv + 1)) { rest -= levelNeed(lv + 1); lv++; }
    const need = lv >= MAX_LEVEL ? 0 : levelNeed(lv + 1);
    const t = LEVEL_TITLES[lv - 1] || LEVEL_TITLES[0];
    return { level: lv, emoji: t[0], title: t[1], xp: Math.max(0, Number(xp) || 0), cur: rest, need,
      percent: need ? Math.min(100, Math.round(rest / need * 100)) : 100, isMax: lv >= MAX_LEVEL };
  }

  /* ---------------- 档案 ---------------- */
  function profiles() {
    let list = Store.get("profiles", null);
    if (!list || !list.length) {
      list = [{ id: "p_default", name: "小朋友", emoji: "🐼", grade: 2, createdAt: Date.now() }];
      Store.set("profiles", list);
      Store.set("profile", "p_default");
    }
    return list;
  }
  function profileId() {
    const cur = Store.get("profile", null);
    const list = profiles();
    if (cur && list.some(p => p.id === cur)) return cur;
    Store.set("profile", list[0].id);
    return list[0].id;
  }
  function currentProfile() { const id = profileId(); return profiles().find(p => p.id === id) || profiles()[0]; }
  function switchProfile(id) { if (profiles().some(p => p.id === id)) { Store.set("profile", id); _cache = null; emit(); } }
  function addProfile(name, emoji, grade) {
    const list = profiles();
    const id = "p_" + Date.now().toString(36) + Math.floor(Math.random() * 999).toString(36);
    list.push({ id, name: name || "小朋友", emoji: emoji || EMOJIS[list.length % EMOJIS.length], grade: grade || 2, createdAt: Date.now() });
    Store.set("profiles", list);
    return id;
  }
  function updateProfile(id, patch) {
    const list = profiles();
    const p = list.find(x => x.id === id);
    if (p) { Object.assign(p, patch); Store.set("profiles", list); emit(); }
  }
  function removeProfile(id) {
    const list = profiles().filter(p => p.id !== id);
    if (list.length === 0) list.push({ id: "p_default", name: "小朋友", emoji: "🐼", grade: 2, createdAt: Date.now() });
    Store.set("profiles", list);
    Store.del("stats__" + id);
    Store.del("srs__" + id);
    if (Store.get("profile") === id) Store.set("profile", list[0].id);
    // 记一笔"墓碑"。不记的话服务端只知道"这个档案还没同步过"，
    // 于是下一次整拉（换设备登录）会把删掉的档案又带回来 —— 复活 bug。
    const tomb = Store.get("profile_tomb", []);
    if (tomb.indexOf(id) === -1) tomb.push(id);
    Store.set("profile_tomb", tomb);
    _cache = null; emit();
  }

  /** 待上报的墓碑（cloud.js 会以 deleted:1 推上去） */
  function deletedProfiles() { return Store.get("profile_tomb", []); }
  /** 推送成功后清掉——已经告诉服务端了，不用反复发 */
  function clearDeletedProfiles() { Store.set("profile_tomb", []); }

  /* ---------------- 统计 ---------------- */
  function blank() {
    return {
      xp: 0,
      days: [], streak: 0, bestStreak: 0, lastDay: "",
      lessons: {},        // levelId -> stars
      phonics: {},        // phonicsId -> 1
      readers: {},        // readerId -> 1
      games: {},          // gameId -> bestScore
      exams: {},          // examId -> score
      letters: {},        // letter -> 1
      words: {},          // wordId -> {s, r, w}  见过/对/错
      missions: {},       // missionId -> 1
      badges: [], medals: [],
      today: { date: "", c: {} },     // 今天的计数
      dayMinutes: {},                 // 按天的学习时长（家长周报与云同步用）
      all: {},                        // 累计计数
      dailyDone: 0, dailyFull: 0, quizRight: 0, quizTotal: 0,
      speakSeconds: 0, minutes: 0,
      updated: 0,       // 新设备上必须是 0：空档案不能比云端数据"更新"，否则永远拉不下来
      syncedAt: 0       // 上一次合并进来的云端版本号（避免重复合并，也不怕本地刚加载就被 save() 刷了 updated）
    };
  }

  let _cache = null, _key = null;
  function skey() { return "stats__" + profileId(); }
  function migrate(s) {
    const b = blank();
    const out = Object.assign(b, s || {});
    ["lessons", "phonics", "readers", "games", "exams", "letters", "words", "missions", "all"].forEach(k => {
      if (!out[k] || typeof out[k] !== "object" || Array.isArray(out[k])) out[k] = {};
    });
    ["days", "badges", "medals"].forEach(k => { if (!Array.isArray(out[k])) out[k] = []; });
    if (!out.today || typeof out.today !== "object") out.today = { date: "", c: {} };
    if (!out.today.c) out.today.c = {};
    return out;
  }
  function load() {
    const k = skey();
    if (_cache && _key === k) return _cache;
    _key = k;
    _cache = migrate(Store.get(k, {}));
    rollDay(_cache);
    return _cache;
  }
  function save(s) { s.updated = Date.now(); Store.set(skey(), s); }
  let _t = null;
  function emit() {
    if (_t) clearTimeout(_t);
    _t = setTimeout(() => { listeners.forEach(cb => { try { cb(); } catch (e) {} }); }, 30);
  }
  const listeners = [];
  function onChange(cb) { if (typeof cb === "function") listeners.push(cb); }

  function rollDay(s) {
    const t = UI.today();
    if (s.today.date !== t) {
      const prev = s.today.date;
      if (prev) {
        const allDone = dailyFor(prev).every(d => (s.today.c[d.key] || 0) >= d.need);
        if (allDone) s.dailyFull = (s.dailyFull || 0) + 1;
      }
      s.today = { date: t, c: {} };
      if (!s.days.includes(t)) {
        const y = UI.today(Date.now() - 86400000);
        s.streak = s.days.includes(y) ? (s.streak || 0) + 1 : 1;
        s.days.push(t);
        if (s.days.length > 400) s.days = s.days.slice(-400);
        s.bestStreak = Math.max(s.bestStreak || 0, s.streak);
      }
      s.lastDay = t;
      save(s);
    }
  }

  function touchToday() { const s = load(); rollDay(s); save(s); emit(); }
  function streak() { return load().streak || 0; }

  function bump(key, n) {
    const s = load();
    rollDay(s);
    s.today.c[key] = (s.today.c[key] || 0) + (n == null ? 1 : n);
    s.all[key] = (s.all[key] || 0) + (n == null ? 1 : n);
    save(s);
    checkBadges(s);
    emit();
    return s.today.c[key];
  }

  function addXp(n) {
    const s = load();
    const before = levelInfo(s.xp).level;
    s.xp = Math.max(0, (s.xp || 0) + (n || 0));
    const after = levelInfo(s.xp);
    save(s);
    const up = after.level > before;
    if (up && typeof AudioFX !== "undefined") AudioFX.playLevelUp();
    checkBadges(s);
    emit();
    return { levelUp: up, level: after.level, info: after };
  }

  /* ---------------- 每日任务 ---------------- */
  const DAILY_POOL = [
    { id: "d_words", emoji: "🆕", title: "学 5 个新词", key: "newWords", need: 5, xp: 20 },
    { id: "d_review", emoji: "🔁", title: "复习 10 张卡片", key: "reviews", need: 10, xp: 20 },
    { id: "d_listen", emoji: "👂", title: "听 10 个词", key: "listens", need: 10, xp: 15 },
    { id: "d_speak", emoji: "🎤", title: "跟读 5 次", key: "speaks", need: 5, xp: 25 },
    { id: "d_right", emoji: "✅", title: "答对 12 题", key: "right", need: 12, xp: 20 },
    { id: "d_game", emoji: "🎮", title: "玩 1 局小游戏", key: "games", need: 1, xp: 15 },
    { id: "d_phonics", emoji: "🧩", title: "学 1 关拼读", key: "phonics", need: 1, xp: 20 },
    { id: "d_page", emoji: "📖", title: "读 4 页绘本", key: "pages", need: 4, xp: 20 },
    { id: "d_star", emoji: "⭐", title: "拿 3 颗星", key: "stars", need: 3, xp: 20 },
    { id: "d_say", emoji: "⏱", title: "开口说满 60 秒", key: "speakSeconds", need: 60, xp: 25 }
  ];

  function dailyFor(dateStr) {
    return UI.pick(DAILY_POOL, 3, "daily:" + dateStr + ":" + profileId());
  }
  function daily() {
    const s = load();
    const date = s.today.date || UI.today();
    return dailyFor(date).map(d => {
      const have = Math.min(d.need, s.today.c[d.key] || 0);
      return { id: d.id, emoji: d.emoji, title: d.title, have, need: d.need, xp: d.xp, done: have >= d.need };
    });
  }
  function claimDaily() {
    const s = load();
    let got = 0;
    daily().forEach(d => {
      if (d.done && !s.missions["done_" + s.today.date + "_" + d.id]) {
        s.missions["done_" + s.today.date + "_" + d.id] = 1;
        s.xp = (s.xp || 0) + d.xp;
        s.dailyDone = (s.dailyDone || 0) + 1;
        got += d.xp;
      }
    });
    if (got) { save(s); checkBadges(s); emit(); }
    return got;
  }

  /* ---------------- 闯关任务 ---------------- */
  const MISSIONS = [
    { id: "m_first_word", emoji: "🍎", title: "第一个单词", hint: "学完第一关", check: s => Object.keys(s.lessons).length >= 1 },
    { id: "m_letter_all", emoji: "🔤", title: "26 个字母", hint: "学完字母岛全部", check: s => Object.keys(s.letters).length >= 26 },
    { id: "m_phonics5", emoji: "🧩", title: "拼读初体验", hint: "学 5 关拼读", check: s => Object.keys(s.phonics).length >= 5 },
    { id: "m_phonics_all", emoji: "🏆", title: "拼读通关", hint: "学完全部拼读关", check: s => Object.keys(s.phonics).length >= 30 },
    { id: "m_words50", emoji: "📚", title: "五十词", hint: "学过 50 个单词", check: s => Object.keys(s.words).length >= 50 },
    { id: "m_words200", emoji: "🚀", title: "两百词", hint: "学过 200 个单词", check: s => Object.keys(s.words).length >= 200 },
    { id: "m_speak10", emoji: "🎤", title: "开口十次", hint: "跟读 10 次", check: s => (s.all.speaks || 0) >= 10 },
    { id: "m_speak100", emoji: "🗣", title: "朗读小明星", hint: "跟读 100 次", check: s => (s.all.speaks || 0) >= 100 },
    { id: "m_reader1", emoji: "📖", title: "读完第一本", hint: "读完 1 本绘本", check: s => Object.keys(s.readers).length >= 1 },
    { id: "m_reader10", emoji: "📚", title: "小书虫", hint: "读完 10 本绘本", check: s => Object.keys(s.readers).length >= 10 },
    { id: "m_game1", emoji: "🎮", title: "第一次玩游戏", hint: "玩 1 局小游戏", check: s => Object.keys(s.games).length >= 1 },
    { id: "m_exam1", emoji: "📝", title: "第一次模拟卷", hint: "做 1 套模拟卷", check: s => Object.keys(s.exams).length >= 1 },
    { id: "m_exam_pass", emoji: "🎖", title: "模拟卷 80 分", hint: "模拟卷拿到 80 分", check: s => Object.values(s.exams).some(v => v >= 80) },
    { id: "m_streak3", emoji: "📅", title: "坚持三天", hint: "连续 3 天来学习", check: s => (s.streak || 0) >= 3 },
    { id: "m_streak7", emoji: "🔥", title: "坚持七天", hint: "连续 7 天来学习", check: s => (s.streak || 0) >= 7 },
    { id: "m_level5", emoji: "🌟", title: "五级小达人", hint: "等级升到 5 级", check: s => levelInfo(s.xp).level >= 5 },
    { id: "m_level10", emoji: "💫", title: "十级大关", hint: "等级升到 10 级", check: s => levelInfo(s.xp).level >= 10 },
    { id: "m_level20", emoji: "👑", title: "二十级", hint: "等级升到 20 级", check: s => levelInfo(s.xp).level >= 20 },
    { id: "m_all_star", emoji: "⭐", title: "满星关卡", hint: "有一关拿到 3 星", check: s => Object.values(s.lessons).some(v => v >= 3) },
    { id: "m_daily_full", emoji: "🌈", title: "今日任务全清", hint: "一天之内完成 3 个任务", check: s => (s.dailyFull || 0) >= 1 }
  ];
  function missions() { const s = load(); return MISSIONS.map(m => ({ id: m.id, emoji: m.emoji, title: m.title, hint: m.hint, got: !!s.missions[m.id] })); }

  /* ---------------- 徽章 ---------------- */
  const BADGES = (() => {
    const B = (id, emoji, cat, title, desc, check) => ({ id, emoji, cat, title, desc, check });
    const wc = s => Object.keys(s.words).length;
    const allc = (s, k) => s.all[k] || 0;
    return [
      // 学习
      B("b_lesson1", "🎓", "学习", "第一关", "完成第一个关卡", s => Object.keys(s.lessons).length >= 1),
      B("b_lesson10", "📗", "学习", "十关", "完成 10 个关卡", s => Object.keys(s.lessons).length >= 10),
      B("b_lesson30", "📘", "学习", "三十关", "完成 30 个关卡", s => Object.keys(s.lessons).length >= 30),
      B("b_lesson60", "📙", "学习", "六十关", "完成 60 个关卡", s => Object.keys(s.lessons).length >= 60),
      B("b_lesson120", "📕", "学习", "全岛通关", "完成全部 120 关", s => Object.keys(s.lessons).length >= 120),
      B("b_star30", "⭐", "学习", "三十颗星", "累计拿到 30 颗星", s => Object.values(s.lessons).reduce((a, b) => a + b, 0) >= 30),
      B("b_star100", "🌟", "学习", "一百颗星", "累计拿到 100 颗星", s => Object.values(s.lessons).reduce((a, b) => a + b, 0) >= 100),
      // 字母与拼读
      B("b_letter10", "🔤", "拼读", "认得十个字母", "学 10 个字母", s => Object.keys(s.letters).length >= 10),
      B("b_letter26", "🅰️", "拼读", "二十六个字母", "学完全部字母", s => Object.keys(s.letters).length >= 26),
      B("b_phonics1", "🧩", "拼读", "第一次拼读", "学 1 关拼读", s => Object.keys(s.phonics).length >= 1),
      B("b_phonics10", "🔡", "拼读", "拼读十关", "学 10 关拼读", s => Object.keys(s.phonics).length >= 10),
      B("b_phonics30", "🏆", "拼读", "拼读大师", "学完全部拼读关", s => Object.keys(s.phonics).length >= 30),
      // 词汇
      B("b_words10", "🍎", "词汇", "十个词", "学过 10 个词", s => wc(s) >= 10),
      B("b_words50", "🧺", "词汇", "五十个词", "学过 50 个词", s => wc(s) >= 50),
      B("b_words150", "🎒", "词汇", "一百五十词", "学过 150 个词", s => wc(s) >= 150),
      B("b_words300", "🏔", "词汇", "三百词", "学过 300 个词", s => wc(s) >= 300),
      B("b_words600", "🌍", "词汇", "词汇王", "学过 600 个词", s => wc(s) >= 600),
      B("b_master50", "🎯", "词汇", "掌握五十", "50 个词进入记忆盒毕业", s => Object.values(s.words).filter(w => w.s >= 4).length >= 50),
      B("b_master150", "💎", "词汇", "掌握一百五", "150 个词毕业", s => Object.values(s.words).filter(w => w.s >= 4).length >= 150),
      // 听力
      B("b_listen10", "👂", "听力", "小耳朵", "听 10 个词", s => allc(s, "listens") >= 10),
      B("b_listen100", "🎧", "听力", "听力高手", "听 100 个词", s => allc(s, "listens") >= 100),
      B("b_listen500", "🦻", "听力", "顺风耳", "听 500 个词", s => allc(s, "listens") >= 500),
      B("b_pairs20", "👂", "听力", "听得出区别", "做完 20 组听辨", s => allc(s, "pairs") >= 20),
      B("b_pairs100", "🎧", "听力", "金耳朵", "做完 100 组听辨", s => allc(s, "pairs") >= 100),
      // 口语
      B("b_speak1", "🎤", "口语", "第一次开口", "跟读 1 次", s => allc(s, "speaks") >= 1),
      B("b_speak20", "🗣", "口语", "敢说二十次", "跟读 20 次", s => allc(s, "speaks") >= 20),
      B("b_speak100", "📢", "口语", "朗读小明星", "跟读 100 次", s => allc(s, "speaks") >= 100),
      B("b_speak5min", "⏱", "口语", "开口五分钟", "累计开口 5 分钟", s => (s.speakSeconds || 0) >= 300),
      B("b_speak30min", "🕰", "口语", "开口半小时", "累计开口 30 分钟", s => (s.speakSeconds || 0) >= 1800),
      // 阅读
      B("b_read1", "📖", "阅读", "第一本书", "读完 1 本绘本", s => Object.keys(s.readers).length >= 1),
      B("b_read5", "📚", "阅读", "五本书", "读完 5 本绘本", s => Object.keys(s.readers).length >= 5),
      B("b_read12", "🦉", "阅读", "十二本书", "读完 12 本绘本", s => Object.keys(s.readers).length >= 12),
      B("b_read20", "🐛", "阅读", "书虫", "读完全部 20 本绘本", s => Object.keys(s.readers).length >= 20),
      B("b_page100", "📄", "阅读", "读了一百页", "累计读 100 页", s => allc(s, "pages") >= 100),
      // 拼写与答题
      B("b_right10", "✅", "答题", "答对十题", "累计答对 10 题", s => allc(s, "right") >= 10),
      B("b_right100", "💯", "答题", "答对一百题", "累计答对 100 题", s => allc(s, "right") >= 100),
      B("b_right500", "🏅", "答题", "答对五百题", "累计答对 500 题", s => allc(s, "right") >= 500),
      B("b_review100", "🔁", "答题", "复习一百次", "累计复习 100 张卡", s => allc(s, "reviews") >= 100),
      B("b_review500", "♻️", "答题", "复习五百次", "累计复习 500 张卡", s => allc(s, "reviews") >= 500),
      // 游戏
      B("b_game1", "🎮", "游戏", "玩一局", "玩 1 局小游戏", s => Object.keys(s.games).length >= 1),
      B("b_game5", "🕹", "游戏", "五个游戏都玩过", "把 5 个小游戏都玩一遍", s => Object.keys(s.games).length >= 5),
      B("b_game10", "👾", "游戏", "玩十局", "累计玩 10 局", s => allc(s, "games") >= 10),
      // 挑战
      B("b_exam1", "📝", "挑战", "第一套卷", "做 1 套模拟卷", s => Object.keys(s.exams).length >= 1),
      B("b_exam60", "🥉", "挑战", "模拟卷 60", "模拟卷拿到 60 分", s => Object.values(s.exams).some(v => v >= 60)),
      B("b_exam80", "🥈", "挑战", "模拟卷 80", "模拟卷拿到 80 分", s => Object.values(s.exams).some(v => v >= 80)),
      B("b_exam95", "🥇", "挑战", "模拟卷 95", "模拟卷拿到 95 分", s => Object.values(s.exams).some(v => v >= 95)),
      B("b_exam5", "🗂", "挑战", "五套卷", "做 5 套模拟卷", s => Object.keys(s.exams).length >= 5),
      // 坚持
      B("b_streak2", "📅", "坚持", "连续两天", "连续 2 天来学习", s => (s.streak || 0) >= 2),
      B("b_streak7", "🔥", "坚持", "连续七天", "连续 7 天来学习", s => (s.streak || 0) >= 7),
      B("b_streak14", "⚡", "坚持", "连续十四天", "连续 14 天来学习", s => (s.streak || 0) >= 14),
      B("b_streak30", "🌋", "坚持", "连续三十天", "连续 30 天来学习", s => (s.streak || 0) >= 30),
      B("b_days20", "🗓", "坚持", "来过二十天", "累计学习 20 天", s => (s.days || []).length >= 20),
      // 任务
      B("b_daily1", "📋", "任务", "完成第一个任务", "完成 1 个每日任务", s => (s.dailyDone || 0) >= 1),
      B("b_daily10", "🗒", "任务", "完成十个任务", "累计完成 10 个每日任务", s => (s.dailyDone || 0) >= 10),
      B("b_daily30", "📊", "任务", "完成三十个任务", "累计完成 30 个每日任务", s => (s.dailyDone || 0) >= 30),
      B("b_dailyfull1", "🌈", "任务", "任务全清", "一天之内完成当天全部任务", s => (s.dailyFull || 0) >= 1),
      B("b_dailyfull7", "🌞", "任务", "任务周全清", "累计 7 天全清", s => (s.dailyFull || 0) >= 7),
      // 特殊
      B("b_badge20", "🎖", "特殊", "徽章收集者", "集齐 20 枚徽章", s => (s.badges || []).length >= 20),
      B("b_badge40", "🏵", "特殊", "徽章达人", "集齐 40 枚徽章", s => (s.badges || []).length >= 40),
      B("b_badge60", "👑", "特殊", "徽章之王", "集齐 60 枚徽章", s => (s.badges || []).length >= 60),
      B("b_medal1", "🥉", "特殊", "第一枚奖牌", "拿到任意一枚奖牌", s => (s.medals || []).length >= 1),
      B("b_medal10", "🥈", "特殊", "十枚奖牌", "集齐 10 枚奖牌", s => (s.medals || []).length >= 10),
      B("b_medal25", "🥇", "特殊", "二十五枚奖牌", "集齐 25 枚奖牌", s => (s.medals || []).length >= 25),
      B("b_medal_all", "💎", "特殊", "奖牌全收集", "集齐全部奖牌", s => (s.medals || []).length >= 49),
      B("b_level5", "🚀", "特殊", "五级小达人", "等级升到 5 级", s => levelInfo(s.xp).level >= 5),
      B("b_level10", "🌟", "特殊", "十级高手", "等级升到 10 级", s => levelInfo(s.xp).level >= 10),
      B("b_level20", "💫", "特殊", "二十级大师", "等级升到 20 级", s => levelInfo(s.xp).level >= 20),
      B("b_level30", "🌈", "特殊", "满级大魔法师", "等级升到最高级", s => levelInfo(s.xp).level >= MAX_LEVEL)
    ];
  })();

  /* ---------------- 奖牌（13 个领域 × 铜银金 + 10 枚特别） ---------------- */
  const DOMAINS = [
    { id: "letter", name: "字母", emoji: "🔤", count: s => Object.keys(s.letters).length, tiers: [10, 20, 26] },
    { id: "phonics", name: "拼读", emoji: "🧩", count: s => Object.keys(s.phonics).length, tiers: [5, 15, 30] },
    { id: "words", name: "词汇", emoji: "🍎", count: s => Object.keys(s.words).length, tiers: [30, 150, 400] },
    { id: "listen", name: "听力", emoji: "👂", count: s => s.all.listens || 0, tiers: [30, 150, 500] },
    { id: "speak", name: "口语", emoji: "🎤", count: s => s.all.speaks || 0, tiers: [10, 50, 150] },
    { id: "read", name: "阅读", emoji: "📖", count: s => Object.keys(s.readers).length, tiers: [3, 10, 20] },
    { id: "write", name: "拼写", emoji: "✍️", count: s => s.all.spells || 0, tiers: [20, 80, 200] },
    { id: "sentence", name: "句子", emoji: "💬", count: s => Object.keys(s.sentences || {}).length, tiers: [10, 40, 100] },
    { id: "level", name: "闯关", emoji: "🏝", count: s => Object.keys(s.lessons).length, tiers: [10, 40, 120] },
    { id: "game", name: "游戏", emoji: "🎮", count: s => s.all.games || 0, tiers: [5, 20, 60] },
    { id: "exam", name: "挑战", emoji: "🏆", count: s => Object.keys(s.exams).length, tiers: [1, 5, 15] },
    { id: "streak", name: "坚持", emoji: "🔥", count: s => s.streak || 0, tiers: [3, 7, 30] },
    { id: "daily", name: "任务", emoji: "📋", count: s => s.dailyDone || 0, tiers: [5, 20, 60] }
  ];
  const TIERS = [
    { id: "bronze", name: "铜", emoji: "🥉" },
    { id: "silver", name: "银", emoji: "🥈" },
    { id: "gold", name: "金", emoji: "🥇" }
  ];
  const MEDALS = (() => {
    const out = [];
    DOMAINS.forEach(d => d.tiers.forEach((need, i) => {
      out.push({ id: "md_" + d.id + "_" + TIERS[i].id, emoji: TIERS[i].emoji, domain: d.name,
        tier: TIERS[i].id, title: d.name + "·" + TIERS[i].name, desc: d.name + "达到 " + need + " 个", need,
        got: s => (d.count(s) || 0) >= need });
    }));
    const specials = [
      { id: "md_streak7", emoji: "🔥", tier: "silver", title: "七日之火", desc: "连续 7 天来学习", got: s => (s.streak || 0) >= 7 },
      { id: "md_streak30", emoji: "🏛", tier: "gold", title: "三十日坚持", desc: "连续 30 天来学习", got: s => (s.streak || 0) >= 30 },
      { id: "md_level15", emoji: "💫", tier: "gold", title: "十五级勋章", desc: "等级升到 15 级", got: s => levelInfo(s.xp).level >= 15 },
      { id: "md_level30", emoji: "🌈", tier: "gold", title: "满级勋章", desc: "等级升到 30 级", got: s => levelInfo(s.xp).level >= MAX_LEVEL },
      { id: "md_daily30", emoji: "📋", tier: "gold", title: "任务达人", desc: "累计完成 30 个每日任务", got: s => (s.dailyDone || 0) >= 30 },
      { id: "md_all_badge", emoji: "👑", tier: "gold", title: "徽章之王", desc: "集齐 60 枚徽章", got: s => (s.badges || []).length >= 60 },
      { id: "md_all_reader", emoji: "🐛", tier: "gold", title: "绘本书虫", desc: "读完全部绘本", got: s => Object.keys(s.readers).length >= 20 },
      { id: "md_exam95", emoji: "🎖", tier: "gold", title: "模拟卷高手", desc: "模拟卷拿到 95 分", got: s => Object.values(s.exams).some(v => v >= 95) },
      { id: "md_speak300", emoji: "📢", tier: "gold", title: "开口三百次", desc: "累计跟读 300 次", got: s => (s.all.speaks || 0) >= 300 },
      { id: "md_words_all", emoji: "🌍", tier: "gold", title: "词汇大满贯", desc: "学过 600 个单词", got: s => Object.keys(s.words).length >= 600 }
    ];
    specials.forEach(sp => out.push(Object.assign({ domain: "特别" }, sp)));
    return out;
  })();

  function checkBadges(s) {
    s = s || load();
    let got = 0;
    BADGES.forEach(b => {
      if (s.badges.indexOf(b.id) === -1) {
        let ok = false;
        try { ok = !!b.check(s); } catch (e) { ok = false; }
        if (ok) { s.badges.push(b.id); got++; }
      }
    });
    MEDALS.forEach(m => {
      if (s.medals.indexOf(m.id) === -1) {
        let ok = false;
        try { ok = !!m.got(s); } catch (e) { ok = false; }
        if (ok) s.medals.push(m.id);
      }
    });
    MISSIONS.forEach(m => {
      if (!s.missions[m.id]) {
        let ok = false;
        try { ok = !!m.check(s); } catch (e) { ok = false; }
        if (ok) s.missions[m.id] = 1;
      }
    });
    if (got) save(s);
    return got;
  }

  function badges() { const s = load(); checkBadges(s); return BADGES.map(b => ({ id: b.id, emoji: b.emoji, cat: b.cat, title: b.title, desc: b.desc, got: s.badges.indexOf(b.id) !== -1 })); }
  function medals() { const s = load(); checkBadges(s); return MEDALS.map(m => ({ id: m.id, emoji: m.emoji, domain: m.domain, tier: m.tier, title: m.title, desc: m.desc, got: s.medals.indexOf(m.id) !== -1 })); }

  /* ---------------- 业务打点 ---------------- */
  function markLevel(id, stars) {
    const s = load();
    const prev = s.lessons[id] || 0;
    s.lessons[id] = Math.max(prev, stars || 1);
    save(s); checkBadges(s); emit();
    return s.lessons[id];
  }
  function isLevelDone(id) { return (load().lessons[id] || 0) > 0; }
  function levelStars(id) { return load().lessons[id] || 0; }
  function markReader(id) { const s = load(); s.readers[id] = 1; save(s); checkBadges(s); emit(); }
  function isReaderDone(id) { return !!load().readers[id]; }
  function markPhonics(id) { const s = load(); s.phonics[id] = 1; save(s); bump("phonics", 1); checkBadges(s); emit(); }
  function isPhonicsDone(id) { return !!load().phonics[id]; }
  function markLetter(l) { const s = load(); s.letters[l] = 1; save(s); checkBadges(s); emit(); }
  function isLetterDone(l) { return !!load().letters[l]; }
  function markGame(id, score) { const s = load(); s.games[id] = Math.max(s.games[id] || 0, score || 0); save(s); bump("games", 1); checkBadges(s); emit(); }
  function markExam(id, score) { const s = load(); s.exams[id] = Math.max(s.exams[id] || 0, score || 0); save(s); checkBadges(s); emit(); }
  function markSentence(id) { const s = load(); if (!s.sentences) s.sentences = {}; s.sentences[id] = 1; save(s); checkBadges(s); emit(); }
  function isSentenceDone(id) { return !!(load().sentences || {})[id]; }
  function markWord(id, correct) {
    const s = load();
    const w = s.words[id] || { s: 0, r: 0, w: 0 };
    w.s = (w.s || 0) + 1;
    if (correct) w.r = (w.r || 0) + 1; else w.w = (w.w || 0) + 1;
    s.words[id] = w;
    save(s);
  }
  function wordStat(id) { return load().words[id] || null; }
  function markSpell(correct) { bump("spells", 1); if (correct) bump("right", 1); }
  function markQuiz(correct) {
    const s = load();
    s.quizTotal = (s.quizTotal || 0) + 1;
    if (correct) { s.quizRight = (s.quizRight || 0) + 1; bump("right", 1); }
    save(s);
  }
  function addSpeakSeconds(sec) {
    const s = load();
    s.speakSeconds = (s.speakSeconds || 0) + Math.round(sec || 0);
    save(s);
    bump("speakSeconds", Math.round(sec || 0));
    bump("speaks", 1);
  }
  function addMinutes(sec) {
    const s = load();
    const add = (sec || 0) / 60;
    s.minutes = (s.minutes || 0) + add;
    rollDay(s);
    if (!s.dayMinutes) s.dayMinutes = {};
    s.dayMinutes[s.today.date] = (s.dayMinutes[s.today.date] || 0) + add;
    save(s);
  }

  function stats() {
    const s = load();
    checkBadges(s);
    const words = Object.keys(s.words).length;
    const mastered = Object.values(s.words).filter(w => w.s >= 4).length;
    return {
      profile: currentProfile(),
      xp: s.xp || 0,
      level: levelInfo(s.xp),
      streak: s.streak || 0, bestStreak: s.bestStreak || 0,
      days: (s.days || []).length,
      lessons: Object.keys(s.lessons).length,
      stars: Object.values(s.lessons).reduce((a, b) => a + b, 0),
      phonics: Object.keys(s.phonics).length,
      letters: Object.keys(s.letters).length,
      readers: Object.keys(s.readers).length,
      sentences: Object.keys(s.sentences || {}).length,
      games: Object.keys(s.games).length,
      exams: Object.keys(s.exams).length,
      words, mastered,
      speaking: s.speakSeconds || 0,
      minutes: Math.round(s.minutes || 0),
      badges: s.badges.length, medals: s.medals.length,
      quizRight: s.quizRight || 0, quizTotal: s.quizTotal || 0,
      today: s.today.c || {}, all: s.all || {},
      raw: s
    };
  }

  /* 家长周报用的按天数据 */
  function dayStats(days) {
    const s = load();
    const out = [];
    const n = days || 7;
    const dm = s.dayMinutes || {};
    for (let i = n - 1; i >= 0; i--) {
      const d = UI.today(Date.now() - i * 86400000);
      out.push({
        date: d,
        minutes: Math.round((dm[d] || 0) * 10) / 10,
        visited: (s.days || []).includes(d)
      });
    }
    return out;
  }

  /* 云同步：今天的按天记录（只有今天有实时计数，历史来自 dayMinutes） */
  function exportDaily() {
    const s = load();
    const c = s.today.c || {};
    const dm = s.dayMinutes || {};
    return Object.keys(dm).map(date => ({
      profile_id: profileId(),
      date: date,
      minutes: Math.round((dm[date] || 0) * 10) / 10,
      new_words: date === s.today.date ? (c.newWords || 0) : 0,
      reviews: date === s.today.date ? (c.reviews || 0) : 0,
      speak_count: date === s.today.date ? (c.speaks || 0) : 0,
      speak_seconds: date === s.today.date ? (c.speakSeconds || 0) : 0,
      updated_at: Date.now()
    }));
  }
  function importDaily(rows) {
    if (!Array.isArray(rows)) return 0;
    const s = load();
    if (!s.dayMinutes) s.dayMinutes = {};
    let n = 0;
    rows.forEach(r => {
      if (!r || !r.date) return;
      const cur = s.dayMinutes[r.date] || 0;
      if ((r.minutes || 0) > cur) { s.dayMinutes[r.date] = r.minutes; n++; }
    });
    if (n) save(s);
    return n;
  }

  /* ---------------- 云同步 ---------------- */
  function exportRow() {
    const s = load();
    return { stats_json: JSON.stringify(s), updated_at: s.updated || Date.now() };
  }
  function importRow(row) {
    if (!row || !row.stats_json) return false;
    let remote;
    try { remote = JSON.parse(row.stats_json); } catch (e) { return false; }
    const cur = load();
    const stamp = row.updated_at || 0;
    // 用"上次合并过的云端版本"去重：不能用 cur.updated 比较 ——
    // 空档案一加载就会 save() 一次把 updated 刷成 now，那样任何云端数据都会被判成"太旧"。
    if (stamp && cur.syncedAt === stamp) return false;
    const merged = migrate(remote);
    // 并集合并：学习记录只增不减
    ["lessons", "phonics", "readers", "games", "exams", "letters", "words", "missions", "all"].forEach(k => {
      const a = cur[k] || {}, b = merged[k] || {};
      const out = Object.assign({}, a);
      for (const id in b) {
        if (out[id] == null) out[id] = b[id];
        else if (typeof out[id] === "number" && typeof b[id] === "number") out[id] = Math.max(out[id], b[id]);
      }
      merged[k] = out;
    });
    merged.badges = Array.from(new Set((cur.badges || []).concat(merged.badges || [])));
    merged.medals = Array.from(new Set((cur.medals || []).concat(merged.medals || [])));
    merged.days = Array.from(new Set((cur.days || []).concat(merged.days || []))).sort();
    merged.xp = Math.max(cur.xp || 0, merged.xp || 0);
    merged.streak = Math.max(cur.streak || 0, merged.streak || 0);
    merged.bestStreak = Math.max(cur.bestStreak || 0, merged.bestStreak || 0);
    merged.dailyDone = Math.max(cur.dailyDone || 0, merged.dailyDone || 0);
    merged.dailyFull = Math.max(cur.dailyFull || 0, merged.dailyFull || 0);
    merged.speakSeconds = Math.max(cur.speakSeconds || 0, merged.speakSeconds || 0);
    merged.minutes = Math.max(cur.minutes || 0, merged.minutes || 0);
    merged.today = cur.today;
    merged.dayMinutes = Object.assign({}, merged.dayMinutes || {}, cur.dayMinutes || {});
    merged.syncedAt = stamp;
    _cache = merged; _key = skey();
    save(merged);
    emit();
    return true;
  }

  function reset() { _cache = blank(); _key = skey(); save(_cache); emit(); }

  return {
    profiles, profileId, currentProfile, switchProfile, addProfile, updateProfile, removeProfile,
    deletedProfiles, clearDeletedProfiles,
    get: load, addXp, level: () => levelInfo(load().xp), levelInfo,
    streak, touchToday, daily, claimDaily, missions, badges, medals, DOMAINS, TIERS, BADGES, MEDALS,
    markLevel, isLevelDone, levelStars, markReader, isReaderDone, markPhonics, isPhonicsDone,
    markLetter, isLetterDone, markGame, markExam, markSentence, isSentenceDone,
    markWord, wordStat, markSpell, markQuiz, addSpeakSeconds, addMinutes, bump,
    stats, dayStats, checkBadges, onChange, exportRow, importRow, exportDaily, importDaily, reset, MAX_LEVEL, LEVEL_TITLES
  };
})();
window.Progress = Progress;
