/**
 * ✏️ 代码编辑器封装 (Smart Code Editor for Kids)
 * 基于 CodeMirror 定制：大字体、括号配对、中文标点实时体检、出错行跳转、字号记忆
 */
const CodeEditor = (() => {
  let cmInstance = null;
  let fallbackTextarea = null;
  let currentFontSize = 15;
  const MIN_FONT_SIZE = 12;
  const MAX_FONT_SIZE = 30;
  const BIG_FONT_SIZE = 22;
  const FONT_KEY = "codepanda_font_size";
  const BIG_FONT_KEY = "codepanda_big_font";

  // 中文标点实时检测
  const PUNCT_RE = /[：；，（）【】“”‘’！？]/g;
  let punctMarks = [];
  let punctTimer = null;
  let punctCount = 0;
  let runningLineHandle = null;   // 单步调试高亮的那一行


  // ================= 智能补全词库 =================
  const PY_KEYWORDS = ["and","as","assert","break","class","continue","def","del","elif","else","except","False","finally","for","from","global","if","import","in","is","lambda","None","not","or","pass","raise","return","True","try","while","with","yield","print","input","range","len","int","str","float","list","dict","set","tuple","bool","abs","round","max","min","sum","sorted","reversed","enumerate","zip","type","isinstance","open","help"];
  // 模块成员表：[成员名, 中文说明]；孩子写 turtle. / random. / math. 都能补全
  const MODULE_MEMBERS = {
    turtle: [["forward","前进"],["fd","前进(简写)"],["backward","后退"],["bk","后退(简写)"],["right","右转"],["rt","右转(简写)"],["left","左转"],["lt","左转(简写)"],["circle","画圆"],["color","设颜色"],["pencolor","画笔颜色"],["fillcolor","填充颜色"],["pensize","画笔粗细"],["penup","抬笔"],["pu","抬笔(简写)"],["pendown","落笔"],["pd","落笔(简写)"],["goto","去坐标"],["setpos","去坐标"],["setheading","设朝向"],["seth","设朝向(简写)"],["home","回原点"],["dot","画圆点"],["write","写字"],["begin_fill","开始填充"],["end_fill","结束填充"],["clear","清空画面"],["reset","全部重置"],["hideturtle","藏起海龟"],["ht","藏海龟(简写)"],["showturtle","显示海龟"],["st","显海龟(简写)"],["speed","速度"],["done","完成绘图"],["Screen","画布对象"]],
    random: [["randint","随机整数"],["random","随机小数"],["choice","随机选一个"],["shuffle","打乱顺序"],["uniform","随机浮点数"],["sample","随机抽取"],["seed","随机种子"]],
    math: [["sqrt","平方根"],["pi","圆周率"],["sin","正弦"],["cos","余弦"],["tan","正切"],["floor","向下取整"],["ceil","向上取整"],["pow","幂运算"],["fabs","绝对值"],["degrees","弧度转角度"],["radians","角度转弧度"]],
    time: [["sleep","等待几秒"],["time","当前时间戳"]],
    json: [["dumps","转成文字"],["loads","解析文字"]],
    numpy: [["array","创建数组"],["arange","生成等差数列"],["linspace","等分区间"],["zeros","全 0 数组"],["ones","全 1 数组"],["sqrt","平方根"],["sum","求和"],["mean","平均值"],["max","最大值"],["min","最小值"],["reshape","改变形状"],["random","随机数"]]
  };
  const MODULE_EMOJI = { turtle: "🐢", random: "🎲", math: "📐", time: "⏰", json: "📦", numpy: "🧮" };
  const STRING_METHODS = [["upper","变大写"],["lower","变小写"],["strip","去掉空格"],["split","切分"],["join","连接"],["replace","替换"],["find","找位置"],["count","数个数"],["startswith","是否以…开头"],["endswith","是否以…结尾"],["title","首字母大写"],["format","填空格式"]];

  // 扫描代码，得到「模块名 -> 可用别名」以及孩子自己取的名字（变量/函数）
  let scopeCache = { text: null, map: null, bare: null };
  function scanScope(cm) {
    const text = cm.getValue();
    if (scopeCache.text === text) return scopeCache;
    const map = Object.create(null);
    const bare = [];
    const seen = Object.create(null);
    const pushBare = (name, note) => {
      if (!name || seen[name]) return;
      seen[name] = 1;
      bare.push({ text: name, displayText: note ? name + "  " + note : name });
    };
    let m;
    const reImport = /^[ \t]*import[ \t]+([A-Za-z_][\w.]*)(?:[ \t]+as[ \t]+([A-Za-z_][\w]*))?/gm;
    while ((m = reImport.exec(text)) !== null) {
      const base = m[1].split(".")[0];
      const local = m[2] || base;
      if (!map[base]) map[base] = [];
      if (map[base].indexOf(local) === -1) map[base].push(local);
      pushBare(local, "📦 模块");
    }
    const reFrom = /^[ \t]*from[ \t]+([A-Za-z_][\w.]*)[ \t]+import[ \t]+([A-Za-z_][\w]*)(?:[ \t]+as[ \t]+([A-Za-z_][\w]*))?/gm;
    while ((m = reFrom.exec(text)) !== null) {
      pushBare(m[3] || m[1] + "." + m[2], "📦 " + m[1] + " 里的");
    }
    const reDef = /^[ \t]*def[ \t]+([A-Za-z_]\w*)/gm;
    while ((m = reDef.exec(text)) !== null) pushBare(m[1], "🔧 你定义的函数");
    const reVar = /^[ \t]*([A-Za-z_]\w*)[ \t]*=[^=]/gm;
    while ((m = reVar.exec(text)) !== null) pushBare(m[1], "📌 你定义的名字");
    scopeCache = { text: text, map: map, bare: bare };
    return scopeCache;
  }

  function moduleOf(cm, owner) {
    const scope = scanScope(cm);
    if (MODULE_MEMBERS[owner]) return owner;
    const aliases = scope.map[owner];
    if (aliases && aliases.length && MODULE_MEMBERS[owner]) return owner;
    // 反查：别名 -> 真实模块名（例如 import turtle as tt 后的 tt）
    for (const mod in scope.map) {
      if (scope.map[mod].indexOf(owner) !== -1) return mod;
    }
    return null;
  }

  // CodeMirror 补全源：按 import 实况 + 已输入内容过滤
  function pythonHint(cm) {
    const cursor = cm.getCursor();
    const line = cm.getLine(cursor.line).slice(0, cursor.ch);
    const match = line.match(/[A-Za-z_][\w.]*$/);
    if (!match) return null;
    const token = match[0];
    const dot = token.lastIndexOf(".");
    let list = [];
    let fromCh = cursor.ch - token.length;
    if (dot !== -1) {
      const owner = token.slice(0, dot);
      const prefix = token.slice(dot + 1).toLowerCase();
      fromCh = cursor.ch - prefix.length;
      const mod = moduleOf(cm, owner);
      if (mod) {
        const emoji = MODULE_EMOJI[mod] || "📦";
        list = MODULE_MEMBERS[mod]
          .filter(pair => pair[0].toLowerCase().indexOf(prefix) === 0)
          .map(pair => ({ text: pair[0], displayText: pair[0] + "  " + emoji + " " + pair[1] }));
      } else {
        list = STRING_METHODS
          .filter(pair => pair[0].toLowerCase().indexOf(prefix) === 0)
          .map(pair => ({ text: pair[0] + "()", displayText: pair[0] + "()  ✂️ " + pair[1] }));
      }
    } else {
      const lower = token.toLowerCase();
      const scope = scanScope(cm);
      const pool = scope.bare.concat(PY_KEYWORDS.map(k => ({ text: k, displayText: k })));
      list = pool.filter(item => item.text.toLowerCase().indexOf(lower) === 0 && item.text !== token);
    }
    if (!list.length) return null;
    return { list: list.slice(0, 12), from: CodeMirror.Pos(cursor.line, fromCh), to: cursor };
  }

  function maybeAutoHint(cm, change) {
    if (!change || !change.text) return;
    if (change.origin !== "+input") return;
    const typed = change.text.join("");
    // 只在「刚敲进去的是短片段（字母/数字/下划线/点号）且以字母或点结尾」时提示；
    // 粘贴整段代码（含空格换行）或长文本时不打扰
    if (!/^[A-Za-z0-9_.]{1,24}$/.test(typed)) return;
    if (!/[A-Za-z_.]$/.test(typed)) return;
    if (typeof cm.showHint === "function") {
      cm.showHint({ hint: pythonHint, completeSingle: false });
    }
  }

  function init(textareaElement) {
    fallbackTextarea = textareaElement;

    // 恢复上次的字号设置
    try {
      const savedSize = parseInt(localStorage.getItem(FONT_KEY), 10);
      if (!isNaN(savedSize)) currentFontSize = savedSize;
    } catch (e) {}

    if (typeof CodeMirror !== "undefined") {
      try {
        cmInstance = CodeMirror.fromTextArea(textareaElement, {
          mode: "python",
          theme: "default",
          lineNumbers: true,
          matchBrackets: true,
          autoCloseBrackets: true,
          indentUnit: 4,
          tabSize: 4,
          indentWithTabs: false,
          lineWrapping: true,
          extraKeys: {
            "Tab": function(cm) {
              cm.replaceSelection("    ", "end");
            },
            "Ctrl-Space": function(cm) {
              if (typeof cm.showHint === "function") {
                cm.showHint({ hint: pythonHint, completeSingle: false });
              }
            },
            "Ctrl-Enter": function() {
              if (window.App && window.App.runCurrentCode) {
                window.App.runCurrentCode();
              }
            },
            "Cmd-Enter": function() {
              if (window.App && window.App.runCurrentCode) {
                window.App.runCurrentCode();
              }
            }
          }
        });

        cmInstance.on("cursorActivity", updateStatusBar);
        cmInstance.on("change", (cm, change) => {
          updateStatusBar();
          maybeAutoHint(cm, change);
          const content = cm.getValue();
          FileManager.updateActiveContent(content);
          if (window.App && window.App.showAutoSaveIndicator) {
            window.App.showAutoSaveIndicator();
          }
          schedulePunctuationCheck();
        });

        applyFontSize(currentFontSize);
        syncBigFontButton();
        schedulePunctuationCheck();
        return;
      } catch (err) {
        console.warn("CodeMirror 初始化失败，使用极简备用编辑器", err);
      }
    }

    // 优雅降级处理
    textareaElement.addEventListener("input", () => {
      updateStatusBar();
      FileManager.updateActiveContent(textareaElement.value);
    });

    textareaElement.addEventListener("keydown", (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
        e.preventDefault();
        window.App && window.App.runCurrentCode && window.App.runCurrentCode();
      } else if ((e.ctrlKey || e.metaKey) && e.key === "s") {
        e.preventDefault();
        window.App && window.App.saveCurrentFile && window.App.saveCurrentFile();
      } else if (e.key === "Tab") {
        e.preventDefault();
        const start = textareaElement.selectionStart;
        const end = textareaElement.selectionEnd;
        textareaElement.value = textareaElement.value.substring(0, start) + "    " + textareaElement.value.substring(end);
        textareaElement.selectionStart = textareaElement.selectionEnd = start + 4;
      }
    });
  }

  function setValue(val) {
    if (cmInstance) {
      if (cmInstance.getValue() !== val) {
        cmInstance.setValue(val);
        cmInstance.clearHistory();
      }
    } else if (fallbackTextarea) {
      fallbackTextarea.value = val;
    }
    updateStatusBar();
    schedulePunctuationCheck();
  }

  function getValue() {
    if (cmInstance) {
      return cmInstance.getValue();
    }
    return fallbackTextarea ? fallbackTextarea.value : "";
  }

  function insertSnippet(codeSnippet) {
    if (cmInstance) {
      const doc = cmInstance.getDoc();
      const cursor = doc.getCursor();
      doc.replaceRange(codeSnippet + "\n", cursor);
      cmInstance.focus();
    } else if (fallbackTextarea) {
      const start = fallbackTextarea.selectionStart || fallbackTextarea.value.length;
      const before = fallbackTextarea.value.substring(0, start);
      const after = fallbackTextarea.value.substring(start);
      fallbackTextarea.value = before + codeSnippet + "\n" + after;
      fallbackTextarea.selectionStart = fallbackTextarea.selectionEnd = start + codeSnippet.length + 1;
      fallbackTextarea.focus();
    }
    SoundEffects.playPop();
  }

  // ================= 字号与护眼模式 =================
  function applyFontSize(size, persist = true) {
    currentFontSize = Math.min(MAX_FONT_SIZE, Math.max(MIN_FONT_SIZE, size));
    const wrapper = cmInstance ? cmInstance.getWrapperElement() : fallbackTextarea;
    if (wrapper) {
      wrapper.style.fontSize = currentFontSize + "px";
      wrapper.style.lineHeight = "1.65";
      if (cmInstance) cmInstance.refresh();
    }
    if (persist) {
      try { localStorage.setItem(FONT_KEY, String(currentFontSize)); } catch (e) {}
    }
  }

  function zoomIn() { applyFontSize(currentFontSize + 2); syncBigFontButton(); }
  function zoomOut() { applyFontSize(currentFontSize - 2); syncBigFontButton(); }

  function isBigFont() {
    try { return localStorage.getItem(BIG_FONT_KEY) === "1"; } catch (e) { return false; }
  }

  function toggleBigFont() {
    const next = !isBigFont();
    try { localStorage.setItem(BIG_FONT_KEY, next ? "1" : "0"); } catch (e) {}
    applyFontSize(next ? BIG_FONT_SIZE : 15);
    syncBigFontButton();
    return next;
  }

  function syncBigFontButton() {
    const btn = document.getElementById("btnBigFont");
    if (btn) btn.classList.toggle("active", isBigFont());
  }

  // ================= 出错行跳转 =================
  function gotoLine(line) {
    const n = Math.max(1, parseInt(line, 10) || 1) - 1;
    if (cmInstance) {
      cmInstance.setCursor({ line: n, ch: 0 });
      cmInstance.scrollIntoView({ line: n, ch: 0 }, 120);
      cmInstance.focus();
      // 闪烁高亮该行，帮助孩子找到位置
      cmInstance.addLineClass(n, "background", "cm-error-line");
      setTimeout(() => cmInstance.removeLineClass(n, "background", "cm-error-line"), 2200);
    } else if (fallbackTextarea) {
      const lines = fallbackTextarea.value.split("\n");
      let pos = 0;
      for (let i = 0; i < n && i < lines.length; i++) pos += lines[i].length + 1;
      fallbackTextarea.focus();
      fallbackTextarea.setSelectionRange(pos, pos + (lines[n] ? lines[n].length : 0));
    }
  }

  // ================= 中文标点实时体检 =================
  function schedulePunctuationCheck() {
    if (punctTimer) clearTimeout(punctTimer);
    punctTimer = setTimeout(() => {
      punctTimer = null;
      punctCount = checkPunctuation();
      const btn = document.getElementById("btnFixPunctuation");
      if (btn) {
        btn.classList.toggle("has-warn", punctCount > 0);
        btn.title = punctCount > 0
          ? `发现 ${punctCount} 处中文标点，点击一键修复`
          : "自动把中文引号、括号、冒号改成 Python 能认识的符号！";
      }
    }, 350);
  }

  function checkPunctuation() {
    if (!cmInstance) return 0;
    punctMarks.forEach(m => { try { m.clear(); } catch (e) {} });
    punctMarks = [];
    const text = cmInstance.getValue();
    PUNCT_RE.lastIndex = 0;
    let m, count = 0;
    while ((m = PUNCT_RE.exec(text)) !== null) {
      const from = cmInstance.posFromIndex(m.index);
      const to = cmInstance.posFromIndex(m.index + 1);
      try {
        punctMarks.push(cmInstance.markText(from, to, {
          className: "cm-punct-warn",
          title: "这是中文标点，Python 看不懂哦～点右上角【🩺 标点体检】可以一键修复"
        }));
      } catch (e) {}
      count++;
      if (count > 500) break;  // 安全上限
    }
    return count;
  }

  function getPunctuationCount() { return punctCount; }

  function updateStatusBar() {
    const posElem = document.getElementById("cursorPos");
    const countElem = document.getElementById("charCount");
    if (!posElem || !countElem) return;

    if (cmInstance) {
      const cursor = cmInstance.getCursor();
      posElem.textContent = `第 ${cursor.line + 1} 行, 第 ${cursor.ch + 1} 列`;
      countElem.textContent = `${cmInstance.getValue().length} 个字符`;
    } else if (fallbackTextarea) {
      const val = fallbackTextarea.value;
      const selStart = fallbackTextarea.selectionStart || 0;
      const lines = val.substring(0, selStart).split("\n");
      posElem.textContent = `第 ${lines.length} 行, 第 ${lines[lines.length - 1].length + 1} 列`;
      countElem.textContent = `${val.length} 个字符`;
    }
  }

  /**
   * 🩺 一键修复中文标点
   */
  function fixChinesePunctuation() {
    const raw = getValue();
    const map = {
      "：": ":", "；": ";", "，": ",", "（": "(", "）": ")",
      "【": "[", "】": "]", "“": "\"", "”": "\"",
      "‘": "'", "’": "'", "！": "!", "？": "?"
    };

    let count = 0;
    const fixed = raw.replace(PUNCT_RE, (match) => {
      count++;
      return map[match] || match;
    });

    if (count > 0) {
      setValue(fixed);
      FileManager.updateActiveContent(fixed);
      SoundEffects.playSuccess();
      return { success: true, count };
    }
    return { success: false, count: 0 };
  }

  return {
    init,
    setValue,
    getValue,
    insertSnippet,
    zoomIn,
    zoomOut,
    toggleBigFont,
    gotoLine,

    // 单步调试：高亮当前正在执行的那一行
    markRunningLine(line) {
      if (!cmInstance) return;
      this.clearRunningLine();
      const lineNo = Math.max(0, (parseInt(line, 10) || 1) - 1);
      if (lineNo >= cmInstance.lineCount()) return;
      runningLineHandle = cmInstance.addLineClass(lineNo, "background", "cm-run-line");
      cmInstance.scrollIntoView({ line: lineNo, ch: 0 }, 120);
    },

    clearRunningLine() {
      if (cmInstance && runningLineHandle !== null) {
        cmInstance.removeLineClass(runningLineHandle, "background", "cm-run-line");
        runningLineHandle = null;
      }
    },

    getPunctuationCount,
    fixChinesePunctuation,
    refresh() {
      if (cmInstance) cmInstance.refresh();
    }
  };
})();
