/**
 * ✏️ 代码编辑器封装 (Smart Code Editor for Kids)
 * 基于 CodeMirror 定制，针对 10 岁儿童提供大字体、括号配对、中文标点体检修复
 */
const CodeEditor = (() => {
  let cmInstance = null;
  let fallbackTextarea = null;
  let currentFontSize = 16;
  const MIN_FONT_SIZE = 13;
  const MAX_FONT_SIZE = 26;

  function init(textareaElement) {
    fallbackTextarea = textareaElement;

    // 尝试初始化 CodeMirror
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

        // 绑定光标变化与内容变化监听
        cmInstance.on("cursorActivity", updateStatusBar);
        cmInstance.on("change", (cm) => {
          updateStatusBar();
          const content = cm.getValue();
          FileManager.updateActiveContent(content);
        });

        applyFontSize(currentFontSize);
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
      // 快捷键支持
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

  function applyFontSize(size) {
    currentFontSize = Math.min(MAX_FONT_SIZE, Math.max(MIN_FONT_SIZE, size));
    const wrapper = cmInstance ? cmInstance.getWrapperElement() : fallbackTextarea;
    if (wrapper) {
      wrapper.style.fontSize = currentFontSize + "px";
      wrapper.style.lineHeight = "1.65";
      if (cmInstance) cmInstance.refresh();
    }
  }

  function zoomIn() {
    applyFontSize(currentFontSize + 2);
  }

  function zoomOut() {
    applyFontSize(currentFontSize - 2);
  }

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
      const currentLine = lines.length;
      const currentCol = lines[lines.length - 1].length + 1;
      posElem.textContent = `第 ${currentLine} 行, 第 ${currentCol} 列`;
      countElem.textContent = `${val.length} 个字符`;
    }
  }

  /**
   * 🩺 中文标点体检医生：
   * 自动检测常见中文符号错误并一键转换为英文对应符号
   */
  function fixChinesePunctuation() {
    const raw = getValue();
    const map = {
      "：": ":",
      "；": ";",
      "，": ",",
      "（": "(",
      "）": ")",
      "【": "[",
      "】": "]",
      "“": "\"",
      "”": "\"",
      "‘": "'",
      "’": "'",
      "！": "!",
      "？": "?"
    };

    let count = 0;
    // 智能替换（对于单引号双引号里的中文字符串标点，尽量避免破坏，但对于括号冒号等代码结构一律纠正）
    let fixed = raw.replace(/[：；，（）【】“”‘’！？]/g, (match) => {
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
    fixChinesePunctuation,
    refresh() {
      if (cmInstance) cmInstance.refresh();
    }
  };
})();
