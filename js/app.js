/**
 * 🚀 主应用入口控制器 (Main Application Controller)
 * 负责各功能模块生命周期协调、用户交互、事件响应与状态同步
 */
window.App = (() => {
  let activeTab = "console"; // "console" | "turtle"
  let modalMode = "create";  // "create" | "rename"
  let modalTargetId = null;

  // 确认弹窗回调
  let confirmCallback = null;

  // 已关闭的标签 ID 集合（文件仍在，只是标签页隐藏）
  let closedTabIds = new Set();

  // 存储 key
  const CLOSED_TABS_KEY = "codepanda_closed_tabs_v1";

  function init() {
    // 0. 恢复已关闭标签状态
    try {
      const saved = localStorage.getItem(CLOSED_TABS_KEY);
      if (saved) {
        const arr = JSON.parse(saved);
        if (Array.isArray(arr)) closedTabIds = new Set(arr);
      }
    } catch (e) {}

    // 1. 初始化文件管理器
    FileManager.init();

    // 2. 初始化代码编辑器
    const editorArea = document.getElementById("codeEditorArea");
    CodeEditor.init(editorArea);

    // 3. 初始化海龟画布
    const canvas = document.getElementById("turtleCanvas");
    const sprite = document.getElementById("turtleSprite");
    TurtleEngine.init(canvas, sprite);

    // 4. 监听文件变化，更新 UI
    FileManager.onChange((files, activeId) => {
      renderFileList(files, activeId);
      // 当前激活的文件如果被关闭了标签，自动重新打开
      if (activeId) closedTabIds.delete(activeId);
      renderEditorTabs(files, activeId);
      const activeFile = FileManager.getActiveFile();
      if (activeFile) {
        CodeEditor.setValue(activeFile.content);
      }
    });

    // 初始渲染
    const initialFiles = FileManager.getFiles();
    const activeFile = FileManager.getActiveFile();
    renderFileList(initialFiles, activeFile ? activeFile.id : null);
    renderEditorTabs(initialFiles, activeFile ? activeFile.id : null);
    if (activeFile) {
      CodeEditor.setValue(activeFile.content);
    }

    // 4.5 恢复上次的主题（避免每次刷新都回到白天模式）
    applySavedTheme();

    // 5. 绑定所有用户界面事件
    bindUIEvents();

    // 5.1 监听本地存储写入失败（配额溢出等），避免静默丢代码
    FileManager.onStorageError((msg) => {
      if (msg) showToast("⚠️ " + msg, "💾");
    });

    // 5.2 若链接里带了分享代码，导入为一个新文件
    loadSharedCodeFromUrl();

    // 6. 异步启动 Python 引擎初始化
    PythonRunner.init();

    // 7. 启动自动保存
    initAutoSave();

    // 8. 显示新手引导提示
    showOnboardingGuide();

    console.log("🐼 萌码 Python 少儿工坊初始化就绪！");
  }

  // ================= 主题持久化 =================
  const THEME_KEY = "codepanda_theme";

  function applySavedTheme() {
    let isDark = false;
    try { isDark = localStorage.getItem(THEME_KEY) === "dark"; } catch (e) {}
    document.body.classList.toggle("dark-mode", isDark);
    const icon = document.getElementById("themeIcon");
    if (icon) icon.textContent = isDark ? "☀️" : "🌙";
  }

  function saveTheme(isDark) {
    try { localStorage.setItem(THEME_KEY, isDark ? "dark" : "light"); } catch (e) {}
  }

  // ================= 下载 / 剪贴板 =================
  function downloadBlob(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  // 复制文本（带超时与降级，绝不使用阻塞式弹窗）
  function copyText(text) {
    const fallback = () => fallbackCopy(text);
    if (navigator.clipboard && navigator.clipboard.writeText) {
      return Promise.race([
        navigator.clipboard.writeText(text).then(() => true).catch(fallback),
        new Promise(resolve => setTimeout(() => resolve(fallback()), 1200))
      ]);
    }
    return Promise.resolve(fallback());
  }

  // 老式复制方案：临时 textarea + execCommand
  function fallbackCopy(text) {
    try {
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.setAttribute("readonly", "");
      ta.style.position = "fixed";
      ta.style.top = "-1000px";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      ta.setSelectionRange(0, text.length);
      const ok = document.execCommand && document.execCommand("copy");
      ta.remove();
      return !!ok;
    } catch (e) {
      return false;
    }
  }

  // ================= 代码分享链接 =================
  function utf8ToB64(str) {
    const bytes = new TextEncoder().encode(str);
    let bin = "";
    bytes.forEach(b => { bin += String.fromCharCode(b); });
    return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  }

  function b64ToUtf8(b64) {
    let s = String(b64).replace(/-/g, "+").replace(/_/g, "/");
    while (s.length % 4) s += "=";
    const bin = atob(s);
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    return new TextDecoder().decode(bytes);
  }

  function buildShareUrl(name, code) {
    const base = location.origin + location.pathname;
    return `${base}#code=${utf8ToB64(code)}&name=${encodeURIComponent(name)}`;
  }

  function loadSharedCodeFromUrl() {
    const hash = location.hash || "";
    if (hash.indexOf("#code=") !== 0) return;
    try {
      const params = new URLSearchParams(hash.slice(1));
      const b64 = params.get("code");
      const name = params.get("name") || "分享的代码.py";
      if (!b64) return;
      const code = b64ToUtf8(b64);
      const created = FileManager.createFile(name.replace(/\.py$/i, "") + "_分享版.py", code);
      showToast(`🔗 已打开分享的代码「${created.name}」`, "🎁");
      history.replaceState(null, "", location.pathname);
    } catch (e) {
      console.warn("解析分享链接失败", e);
    }
  }

  // ================= 运行快照（上次成功运行） =================
  const SNAPSHOT_KEY = "codepanda_snapshots_v1";

  function readSnapshots() {
    try {
      return JSON.parse(localStorage.getItem(SNAPSHOT_KEY) || "{}") || {};
    } catch (e) {
      return {};
    }
  }

  function readSnapshot(fileId) {
    const all = readSnapshots();
    return all[fileId] || "";
  }

  // 由 python-runner 在运行成功时调用
  function saveSnapshot() {
    try {
      const file = FileManager.getActiveFile();
      if (!file) return;
      const all = readSnapshots();
      all[file.id] = CodeEditor.getValue();
      localStorage.setItem(SNAPSHOT_KEY, JSON.stringify(all));
    } catch (e) {
      // 快照失败不影响主流程
    }
  }

  // HTML 转义：文件名由用户输入，避免特殊字符破坏渲染
  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, c => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      "\"": "&quot;",
      "'": "&#39;"
    })[c]);
  }

  // 渲染左侧文件树列表
  function renderFileList(files, activeId) {
    const listElem = document.getElementById("fileList");
    const badge = document.getElementById("fileCountBadge");
    if (!listElem) return;

    if (badge) {
      badge.textContent = `${files.length} 个文件`;
    }

    listElem.innerHTML = "";
    files.forEach(file => {
      const isExample = FileManager.isExampleFile(file.id);
      const isClosed = closedTabIds.has(file.id);
      const item = document.createElement("div");
      item.className = `file-item ${file.id === activeId ? "active" : ""} ${isClosed ? "closed-tab" : ""}`;

      // 文件图标与名称
      const info = document.createElement("div");
      info.className = "file-info";
      info.title = file.name;
      info.innerHTML = `<span class="file-icon">${isExample ? '🎁' : '🐍'}</span><span class="file-name">${escapeHtml(file.name)}</span>`;
      info.addEventListener("click", () => {
        // 从文件树点击文件时，重新打开标签（如果之前关闭了）
        closedTabIds.delete(file.id);
        saveClosedTabs();
        FileManager.setActiveFile(file.id);
        SoundEffects.playPop();
      });

      // 操作小按钮（重命名、删除）- 仅用户文件显示
      const actions = document.createElement("div");
      actions.className = "file-actions";

      if (!isExample) {
        const btnRename = document.createElement("button");
        btnRename.className = "file-action-btn";
        btnRename.title = "重命名";
        btnRename.innerHTML = "✏️";
        btnRename.addEventListener("click", (e) => {
          e.stopPropagation();
          openRenameModal(file.id, file.name);
        });

        const btnDel = document.createElement("button");
        btnDel.className = "file-action-btn";
        btnDel.title = "删除";
        btnDel.innerHTML = "🗑️";
        btnDel.addEventListener("click", (e) => {
          e.stopPropagation();
          confirmDeleteFile(file.id, file.name);
        });

        actions.appendChild(btnRename);
        actions.appendChild(btnDel);
      }

      item.appendChild(info);
      item.appendChild(actions);
      listElem.appendChild(item);
    });
  }

  // 渲染编辑器上方标签页（过滤已关闭的标签）
  function renderEditorTabs(files, activeId) {
    const tabsList = document.getElementById("editorTabsList");
    if (!tabsList) return;

    tabsList.innerHTML = "";
    files.forEach(file => {
      // 跳过已关闭的标签
      if (closedTabIds.has(file.id)) return;

      const isExample = FileManager.isExampleFile(file.id);
      const tab = document.createElement("div");
      tab.className = `editor-tab ${file.id === activeId ? "active" : ""}`;
      tab.title = file.name;
      tab.innerHTML = `<span>${isExample ? '🎁' : '🐍'} ${escapeHtml(file.name)}</span>`;

      tab.addEventListener("click", (e) => {
        // 点击标签切换到该文件（关闭按钮点击时不触发）
        if (e.target.closest('.editor-tab-close')) return;
        FileManager.setActiveFile(file.id);
        SoundEffects.playPop();
      });

      // 关闭按钮：仅关闭标签，不删除文件
      const closeBtn = document.createElement("button");
      closeBtn.className = "editor-tab-close";
      closeBtn.title = "关闭标签";
      closeBtn.innerHTML = "×";
      closeBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        closeTab(file.id, isExample);
      });
      tab.appendChild(closeBtn);

      tabsList.appendChild(tab);
    });

    // 如果所有标签都关闭了，显示占位提示
    if (tabsList.children.length === 0) {
      const placeholder = document.createElement("div");
      placeholder.className = "editor-tab-placeholder";
      placeholder.textContent = "💡 点击左侧文件重新打开标签";
      tabsList.appendChild(placeholder);
    }
  }

  // 关闭标签（不删除文件）
  function closeTab(fileId, isExample) {
    closedTabIds.add(fileId);
    saveClosedTabs();

    // 如果关闭的是当前激活的文件，自动切换到下一个未关闭的标签
    const allFiles = FileManager.getFiles();
    const activeFile = FileManager.getActiveFile();
    if (activeFile && activeFile.id === fileId) {
      // 找到第一个未关闭的文件
      const nextFile = allFiles.find(f => !closedTabIds.has(f.id));
      if (nextFile) {
        FileManager.setActiveFile(nextFile.id);
      } else {
        // 所有文件标签都关闭了，清空编辑器
        CodeEditor.setValue("");
        renderEditorTabs(allFiles, null);
        return;
      }
    }

    // 重新渲染标签栏
    const files = FileManager.getFiles();
    const currentActive = FileManager.getActiveFile();
    renderEditorTabs(files, currentActive ? currentActive.id : null);
  }

  // 保存已关闭标签状态到 localStorage
  function saveClosedTabs() {
    try {
      localStorage.setItem(CLOSED_TABS_KEY, JSON.stringify(Array.from(closedTabIds)));
    } catch (e) {}
  }

  // 绑定各类交互事件
  function bindUIEvents() {
    // 运行按钮
    const btnRun = document.getElementById("btnRunCode");
    btnRun.addEventListener("click", runCurrentCode);

    // 保存按钮
    const btnSave = document.getElementById("btnSaveFile");
    btnSave.addEventListener("click", saveCurrentFile);

    // 恢复示例库
    const btnReset = document.getElementById("btnResetDemos");
    btnReset.addEventListener("click", () => {
      showConfirmModal(
        "⚠️ 注意啦！",
        "恢复示例宝库会【替换掉你现在的所有文件】哦！<br>想保留自己的代码的话，先点「取消」，用左侧 ⬇️ 按钮下载保存~<br><br>确定要恢复示例宝库吗？",
        () => {
          closedTabIds.clear();
          saveClosedTabs();
          FileManager.resetToDefault();
          showToast("🎉 示例宝库已重新装满！", "🎁");
          SoundEffects.playSuccess();
        }
      );
    });

    // 暗黑太空模式切换
    const btnTheme = document.getElementById("btnToggleTheme");
    const themeIcon = document.getElementById("themeIcon");
    btnTheme.addEventListener("click", () => {
      document.body.classList.toggle("dark-mode");
      const isDark = document.body.classList.contains("dark-mode");
      themeIcon.textContent = isDark ? "☀️" : "🌙";
      saveTheme(isDark);
      CodeEditor.refresh();
      SoundEffects.playPop();
    });

    // 新建文件按钮
    const btnNew = document.getElementById("btnNewFile");
    btnNew.addEventListener("click", () => {
      openCreateModal();
    });

    // 下载当前文件为 .py
    const btnExport = document.getElementById("btnExportZip");
    btnExport.addEventListener("click", () => {
      const file = FileManager.getActiveFile();
      if (!file) return;
      // 先把编辑器里的最新内容写回文件
      FileManager.updateActiveContent(CodeEditor.getValue());
      const blob = new Blob([file.content], { type: "text/x-python;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = file.name;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      showToast(`⬇️ 已把「${file.name}」下载到你的电脑！`, "📦");
      SoundEffects.playSuccess();
    });

    // 标点体检修复
    const btnFix = document.getElementById("btnFixPunctuation");
    btnFix.addEventListener("click", () => {
      const res = CodeEditor.fixChinesePunctuation();
      if (res.success) {
        showToast(`🩺 太棒啦！已帮你把 ${res.count} 个中文符号改成了 Python 标准标点！`, "✨");
      } else {
        showToast("👍 检查完毕！你的代码符号非常健康，没有任何中文标点！", "💯");
        SoundEffects.playSuccess();
      }
    });

    // 字体缩放
    document.getElementById("btnZoomIn").addEventListener("click", () => {
      CodeEditor.zoomIn();
      SoundEffects.playPop();
    });
    document.getElementById("btnZoomOut").addEventListener("click", () => {
      CodeEditor.zoomOut();
      SoundEffects.playPop();
    });

    // 积木代码点击一键插入（包括新编辑器上方积木栏和旧积木区）
    document.querySelectorAll(".snippet-chip").forEach(btn => {
      btn.addEventListener("click", () => {
        const snippet = btn.getAttribute("data-code");
        if (snippet) {
          CodeEditor.insertSnippet(snippet);
          showToast("🧩 积木已放入代码工坊！", "🪄");
        }
      });
    });

    // 积木栏折叠/展开
    const snippetsToggle = document.getElementById("snippetsToggle");
    if (snippetsToggle) {
      snippetsToggle.addEventListener("click", () => {
        document.getElementById("snippetsBar").classList.toggle("collapsed");
      });
    }

    // 右侧运行视窗 Tab 切换 (控制台 / 海龟画布)
    const tabConsole = document.getElementById("tabBtnConsole");
    const tabTurtle = document.getElementById("tabBtnTurtle");
    tabConsole.addEventListener("click", () => switchToTab("console"));
    tabTurtle.addEventListener("click", () => switchToTab("turtle"));

    // 清空输出
    document.getElementById("btnClearOutput").addEventListener("click", () => {
      if (activeTab === "console") {
        document.getElementById("terminalLogs").innerHTML = "";
      } else {
        TurtleEngine.reset();
      }
      SoundEffects.playPop();
      showToast("🧹 已经清理得干干净净啦！", "✨");
    });

    // 海龟画图调速
    const speedRange = document.getElementById("turtleSpeedRange");
    const speedLabel = document.getElementById("speedLabel");
    speedRange.addEventListener("input", (e) => {
      const val = parseInt(e.target.value);
      TurtleEngine.setSpeed(val);
      const labels = ["超慢", "很慢", "慢速", "适中", "正常", "稍快", "快速", "飞快", "超快", "闪电飞速⚡"];
      speedLabel.textContent = labels[val - 1] || "正常";
    });

    // 保存海龟画作
    document.getElementById("btnDownloadDrawing").addEventListener("click", () => {
      TurtleEngine.exportImage();
      showToast("📸 海龟画作已保存为图片！", "🎨");
    });

    // 文件模态弹窗事件
    document.getElementById("btnCancelModal").addEventListener("click", closeModal);
    document.getElementById("btnConfirmModal").addEventListener("click", handleModalConfirm);
    document.getElementById("fileModalInput").addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        handleModalConfirm();
      }
    });

    // 点击文件弹窗遮罩空白处也可关闭
    const fileModalOverlay = document.getElementById("fileModal");
    fileModalOverlay.addEventListener("click", (e) => {
      if (e.target === fileModalOverlay) {
        closeModal();
      }
    });

    // 自定义确认弹窗事件
    document.getElementById("btnConfirmCancel").addEventListener("click", closeConfirmModal);
    document.getElementById("btnConfirmOk").addEventListener("click", () => {
      if (confirmCallback) {
        confirmCallback();
      }
      closeConfirmModal();
    });
    const confirmModalOverlay = document.getElementById("confirmModal");
    confirmModalOverlay.addEventListener("click", (e) => {
      if (e.target === confirmModalOverlay) {
        closeConfirmModal();
      }
    });

    // 终端输入行：回车提交输入（通过 Worker 通信方式）
    const terminalInput = document.getElementById("terminalInput");
    if (terminalInput) {
      terminalInput.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          PythonRunner.submitTerminalInput();
        }
        // 阻止全局快捷键在输入时触发（如 Ctrl+S）
        e.stopPropagation();
      });
    }

    // ================= 导入 / 打包下载 / 分享 / 复原 / 大字号 =================

    // 导入电脑里的 .py 文件
    const btnImport = document.getElementById("btnImportFile");
    const fileInput = document.getElementById("fileImportInput");
    if (btnImport && fileInput) {
      btnImport.addEventListener("click", () => fileInput.click());
      fileInput.addEventListener("change", (e) => {
        const file = e.target.files && e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = () => {
          const created = FileManager.createFile(file.name, String(reader.result || ""));
          showToast(`📂 已导入「${created.name}」`, "✨");
          SoundEffects.playSuccess();
        };
        reader.onerror = () => showToast("⚠️ 读取文件失败，换一个文件试试？", "😢");
        reader.readAsText(file, "utf-8");
        fileInput.value = "";   // 允许连续导入同一个文件
      });
    }

    // 打包下载全部作品
    const btnExportAll = document.getElementById("btnExportAll");
    if (btnExportAll) {
      btnExportAll.addEventListener("click", () => {
        const all = FileManager.getAllFiles();
        if (!all.length) { showToast("还没有作品可以打包哦~", "📦"); return; }
        try {
          const blob = ZipWriter.build(all.map(f => ({ name: f.name, content: f.content })));
          downloadBlob(blob, `我的代码宝箱_${new Date().toISOString().slice(0, 10)}.zip`);
          showToast(`📦 已打包 ${all.length} 个作品，快看看下载文件夹吧！`, "🎉");
          SoundEffects.playSuccess();
        } catch (err) {
          console.error("打包失败", err);
          showToast("打包失败了，可以先用 ⬇️ 一个个下载", "😢");
        }
      });
    }

    // 生成分享链接
    const btnShare = document.getElementById("btnShareCode");
    if (btnShare) {
      btnShare.addEventListener("click", () => {
        const file = FileManager.getActiveFile();
        if (!file) return;
        const code = CodeEditor.getValue();
        if (!code.trim()) { showToast("代码是空的，先写点内容再分享吧~", "📝"); return; }

        const url = buildShareUrl(file.name, code);
        if (url.length > 8000) {
          showToast("代码太长啦，分享链接装不下，建议用 📦 打包发送", "😅");
          return;
        }
        copyText(url).then((ok) => {
          if (ok) {
            showToast("🔗 分享链接已复制！发给同学就能打开你的代码", "✨");
          } else {
            // 无法自动复制时，把链接打印到控制台，方便手动选中复制
            window.App.switchToTab("console");
            if (window.PythonRunner && window.PythonRunner.showShareLink) {
              window.PythonRunner.showShareLink(url);
            }
            showToast("🔗 链接已显示在控制台，长按或选中复制即可", "📋");
          }
          SoundEffects.playSuccess();
        });
      });
    }

    // 复原到上次成功运行的代码
    const btnSnapshot = document.getElementById("btnSnapshot");
    if (btnSnapshot) {
      btnSnapshot.addEventListener("click", () => {
        const file = FileManager.getActiveFile();
        if (!file) return;
        const snap = readSnapshot(file.id);
        if (!snap) { showToast("还没有成功运行的记录哦，先点 🚀 运行一次吧！", "💡"); return; }
        if (snap === CodeEditor.getValue()) { showToast("当前代码就是上次成功的版本呀~", "👍"); return; }
        showConfirmModal(
          "⏪ 回到上次成功的代码？",
          "会把当前编辑区的代码替换成<b>上一次成功运行</b>的版本。<br>如果现在写了新东西，建议先点 💾 保存或用 ⬇️ 下载备份哦！",
          () => {
            CodeEditor.setValue(snap);
            FileManager.updateActiveContent(snap);
            showToast("⏪ 已经回到上次成功的版本啦！", "✨");
            SoundEffects.playSuccess();
          }
        );
      });
    }

    // 护眼大字号切换
    const btnBigFont = document.getElementById("btnBigFont");
    if (btnBigFont) {
      btnBigFont.addEventListener("click", () => {
        const isBig = CodeEditor.toggleBigFont();
        showToast(isBig ? "🔤 已切换到护眼大字号！" : "🔤 已恢复普通字号", "👀");
        SoundEffects.playPop();
      });
    }

    // 全局快捷键拦截
    window.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        // 关闭任何打开的弹窗
        const activeModal = document.querySelector(".modal-overlay.active");
        if (activeModal) {
          activeModal.classList.remove("active");
          if (activeModal.id === "confirmModal") {
            confirmCallback = null;
          }
        }
        return;
      }
      if ((e.ctrlKey || e.metaKey) && e.key === "s") {
        e.preventDefault();
        saveCurrentFile();
      } else if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
        e.preventDefault();
        runCurrentCode();
      }
    });
  }

  function switchToTab(tabName) {
    activeTab = tabName;
    const btnConsole = document.getElementById("tabBtnConsole");
    const btnTurtle = document.getElementById("tabBtnTurtle");
    const viewConsole = document.getElementById("consoleView");
    const viewTurtle = document.getElementById("turtleView");

    if (tabName === "console") {
      btnConsole.classList.add("active");
      btnTurtle.classList.remove("active");
      viewConsole.style.display = "flex";
      viewTurtle.style.display = "none";
    } else {
      btnTurtle.classList.add("active");
      btnConsole.classList.remove("active");
      viewTurtle.style.display = "flex";
      viewConsole.style.display = "none";
      requestAnimationFrame(() => TurtleEngine.fit());
    }
  }

  function runCurrentCode() {
    SoundEffects.playPop();
    const code = CodeEditor.getValue();
    if (!code || !code.trim()) {
      showToast("📝 代码空空如也，先写两行代码再运行吧！", "💡");
      return;
    }
    // 运行前自动保存
    FileManager.updateActiveContent(code);
    PythonRunner.run(code);
  }

  function saveCurrentFile() {
    const content = CodeEditor.getValue();
    FileManager.updateActiveContent(content);
    showToast("💾 保存成功！你的代码安然无恙~", "🌟");
    SoundEffects.playSuccess();
  }

  // ================= 自定义确认弹窗 =================
  function showConfirmModal(title, descHtml, onConfirm) {
    document.getElementById("confirmModalTitle").innerHTML = `<span>${title}</span>`;
    document.getElementById("confirmModalDesc").innerHTML = descHtml;
    confirmCallback = onConfirm;
    document.getElementById("confirmModal").classList.add("active");
  }

  function closeConfirmModal() {
    document.getElementById("confirmModal").classList.remove("active");
    confirmCallback = null;
  }

  // ================= 文件弹窗管理 =================
  function openCreateModal() {
    modalMode = "create";
    document.getElementById("fileModalTitle").innerHTML = "<span>✨ 新建 Python 代码文件</span>";
    document.getElementById("fileModalDesc").textContent = "给你的代码起一个酷酷的名字吧（建议以 .py 结尾）";
    const input = document.getElementById("fileModalInput");
    input.value = `新代码_${FileManager.getFiles().length + 1}.py`;
    document.getElementById("fileModal").classList.add("active");
    input.focus();
    input.select();
  }

  function openRenameModal(fileId, currentName) {
    modalMode = "rename";
    modalTargetId = fileId;
    document.getElementById("fileModalTitle").innerHTML = "<span>✏️ 重命名文件</span>";
    document.getElementById("fileModalDesc").textContent = "修改一个新名字：";
    const input = document.getElementById("fileModalInput");
    input.value = currentName;
    document.getElementById("fileModal").classList.add("active");
    input.focus();
    input.select();
  }

  function closeModal() {
    document.getElementById("fileModal").classList.remove("active");
    modalTargetId = null;
  }

  function handleModalConfirm() {
    const input = document.getElementById("fileModalInput");
    const name = input.value.trim();
    if (!name) {
      showToast("名字不能为空哦！", "⚠️");
      return;
    }

    if (modalMode === "create") {
      FileManager.createFile(name);
      showToast(`🎉 文件 ${name} 创建成功！`, "📄");
      SoundEffects.playSuccess();
    } else if (modalMode === "rename") {
      const ok = FileManager.renameFile(modalTargetId, name);
      if (ok) {
        showToast("✏️ 文件名称修改完成！", "✨");
        SoundEffects.playSuccess();
      } else {
        showToast("⚠️ 重命名失败，可能已经有同名文件了哦", "❌");
        return;
      }
    }
    closeModal();
  }

  function confirmDeleteFile(fileId, fileName) {
    showConfirmModal(
      "🗑️ 删除文件",
      `确定要删除文件【${escapeHtml(fileName)}】吗？删除后就找不回来了哦！`,
      () => {
        const res = FileManager.deleteFile(fileId);
        if (res.success) {
          showToast(`已删除文件 ${fileName}`, "🗑️");
          SoundEffects.playPop();
        } else {
          showToast(res.reason, "⚠️");
        }
      }
    );
  }

  // ================= 自动保存 =================
  let autoSaveTimer = null;
  let autoSaveIndicatorTimer = null;

  function initAutoSave() {
    // 每 30 秒自动保存一次
    autoSaveTimer = setInterval(() => {
      const content = CodeEditor.getValue();
      if (content) {
        FileManager.updateActiveContent(content);
        showAutoSaveIndicator();
      }
    }, 30000);

    // 页面关闭或隐藏前保存
    window.addEventListener("beforeunload", () => {
      const content = CodeEditor.getValue();
      if (content) {
        FileManager.updateActiveContent(content);
      }
    });
  }

  function showAutoSaveIndicator() {
    const indicator = document.getElementById("autoSaveIndicator");
    if (!indicator) return;
    indicator.classList.add("show");
    if (autoSaveIndicatorTimer) clearTimeout(autoSaveIndicatorTimer);
    autoSaveIndicatorTimer = setTimeout(() => {
      indicator.classList.remove("show");
    }, 2000);
  }

  // ================= 新手引导 =================
  function showOnboardingGuide() {
    // 只在首次访问时显示
    if (localStorage.getItem("codepanda_onboarding_done")) return;
    localStorage.setItem("codepanda_onboarding_done", "1");

    setTimeout(() => {
      showConfirmModal(
        "🌟 欢迎来到萌码 Python！",
        "这里是一个专为小朋友设计的编程工坊！<br><br>" +
        "📂 <b>左侧</b>：代码宝箱，管理你的 Python 文件<br>" +
        "✏️ <b>中间</b>：写代码的地方<br>" +
        "✨ <b>右侧</b>：运行结果展示区（控制台 + 海龟画布）<br><br>" +
        "💡 点击右上角 <b>🚀 运行代码</b> 按钮，看看会发生什么吧！",
        () => {}
      );
    }, 800);
  }

  // ================= Toast 提示 =================
  let toastTimer = null;
  function showToast(msg, icon = "🎉") {
    const box = document.getElementById("toastBox");
    const msgElem = document.getElementById("toastMsg");
    const iconElem = document.getElementById("toastIcon");
    if (!box) return;

    if (toastTimer) clearTimeout(toastTimer);
    iconElem.textContent = icon;
    msgElem.textContent = msg;
    box.classList.add("show");

    toastTimer = setTimeout(() => {
      box.classList.remove("show");
    }, 2800);
  }

  return {
    init,
    saveSnapshot,
    runCurrentCode,
    saveCurrentFile,
    switchToTab,
    showToast,
    showConfirmModal,
    closeConfirmModal,
    showAutoSaveIndicator
  };
})();

// DOM 就绪后启动
document.addEventListener("DOMContentLoaded", () => {
  window.App.init();
});