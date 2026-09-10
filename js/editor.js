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
        cmInstance.on("change", (cm) => {
          updateStatusBar();
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
    getPunctuationCount,
    fixChinesePunctuation,
    refresh() {
      if (cmInstance) cmInstance.refresh();
    }
  };
})();
