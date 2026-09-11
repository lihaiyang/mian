/**
 * 🚀 主应用入口控制器 (Main Application Controller)
 * 负责各功能模块生命周期协调、用户交互、事件响应与状态同步
 */
window.App = (() => {
  let activeTab = "console"; // "console" | "turtle"
  let modalMode = "create";  // create | rename | createFolder | renameFolder
  let modalTargetId = null;
  let modalFolderId = null;  // 新建文件时放进哪个文件夹

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

    // 1.1 成长档案：按当前小伙伴切换作品库 + 载入学习记录
    if (typeof Progress !== "undefined") {
      Progress.init();
    }

    // 1.2 云同步：登录后自动同步；同时负责顶栏的头像 / 昵称
    if (typeof CloudSync !== "undefined") {
      CloudSync.init();
      const chip = document.getElementById("btnUserChip");
      if (chip) chip.addEventListener("click", () => CloudSync.openPanel());
      const cloudClose = document.getElementById("cloudClose");
      if (cloudClose) cloudClose.addEventListener("click", () => CloudSync.closePanel());
      const cloudModal = document.getElementById("cloudModal");
      if (cloudModal) {
        cloudModal.addEventListener("click", (e) => { if (e.target === cloudModal) CloudSync.closePanel(); });
      }
      if (typeof Progress !== "undefined" && Progress.onChange) {
        Progress.onChange(() => CloudSync.renderChip());
      }
      CloudSync.renderChip();
    }

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
  // 渲染左侧文件列表（按文件夹分组）
  function renderFileList(files, activeId) {
    const listElem = document.getElementById("fileList");
    const badge = document.getElementById("fileCountBadge");
    if (!listElem) return;

    if (badge) badge.textContent = `${files.length} 个文件`;

    const folders = FileManager.getFolders();
    const collapsedMap = FileManager.getCollapsed();
    const myFolderId = FileManager.getMyFolderId();

    listElem.innerHTML = "";

    folders.forEach(folder => {
      const inFolder = files.filter(f => (f.folderId || myFolderId) === folder.id);
      const isCollapsed = !!collapsedMap[folder.id];

      const head = document.createElement("div");
      head.className = "folder-head" + (isCollapsed ? " collapsed" : "") + (folder.builtin ? " builtin" : "");
      head.title = (isCollapsed ? "展开" : "收起") + folder.name;
      head.innerHTML = '<span class="folder-arrow">▾</span><span class="folder-emoji"></span>' +
        '<span class="folder-name"></span><span class="folder-count"></span>';

      if (folder.builtin) {
        head.querySelector(".folder-name").textContent = folder.name;
        head.querySelector(".folder-emoji").textContent = folder.emoji;
        head.querySelector(".folder-name").title = folder.name;
      } else {
        head.querySelector(".folder-name").textContent = folder.name;
        head.querySelector(".folder-emoji").textContent = folder.emoji;
      }
      head.querySelector(".folder-count").textContent = inFolder.length;

      const headActions = document.createElement("div");
      headActions.className = "folder-actions";
      headActions.appendChild(makeActionBtn("➕", "在这个文件夹里新建文件", () => openCreateModal(folder.id)));
      if (!folder.builtin) {
        headActions.appendChild(makeActionBtn("✏️", "文件夹改名", () => openFolderRenameModal(folder.id, folder.name)));
        headActions.appendChild(makeActionBtn("🗑️", "删除文件夹（文件会移到「我的作品」）", () => confirmDeleteFolder(folder)));
      }
      head.appendChild(headActions);

      head.addEventListener("click", () => {
        FileManager.toggleFolder(folder.id);
        SoundEffects.playPop();
      });
      listElem.appendChild(head);

      if (isCollapsed) return;

      if (!inFolder.length) {
        const empty = document.createElement("div");
        empty.className = "folder-empty";
        empty.textContent = folder.builtin ? "这里空空的" : "还没有文件，点上面的 ➕ 新建一个吧";
        listElem.appendChild(empty);
        return;
      }

      inFolder.forEach(file => listElem.appendChild(buildFileItem(file, activeId, folders)));
    });
  }

  function makeActionBtn(icon, title, fn) {
    const btn = document.createElement("button");
    btn.className = "file-action-btn";
    btn.title = title;
    btn.innerHTML = icon;
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      fn(e);
    });
    return btn;
  }

  // 单个文件条目
  function buildFileItem(file, activeId, folders) {
    const isExample = FileManager.isExampleFile(file.id);
    const isClosed = closedTabIds.has(file.id);
    const item = document.createElement("div");
    item.className = `file-item sub ${file.id === activeId ? "active" : ""} ${isClosed ? "closed-tab" : ""}`;

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

    const actions = document.createElement("div");
    actions.className = "file-actions";

    if (folders.length > 1) {
      actions.appendChild(makeActionBtn("📁", "移动到其他文件夹", (e) => showFolderMenu(e.currentTarget, file)));
    }
    if (!isExample) {
      actions.appendChild(makeActionBtn("✏️", "重命名", () => openRenameModal(file.id, file.name)));
      actions.appendChild(makeActionBtn("🗑️", "删除", () => confirmDeleteFile(file.id, file.name)));
    }

    item.appendChild(info);
    item.appendChild(actions);
    return item;
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

      // 右键菜单：关闭这个 / 关闭其他 / 关闭全部
      tab.addEventListener("contextmenu", (e) => {
        e.preventDefault();
        const openCount = FileManager.getFiles().filter(f => !closedTabIds.has(f.id)).length;
        showFloatingMenu(tab, [
          { label: "✕ 关闭这个标签", fn: () => closeTab(file.id, isExample) },
          { label: "✕ 关闭其他标签", disabled: openCount <= 1, fn: () => closeOtherTabs(file.id) },
          { label: "✕ 关闭全部标签", fn: closeAllTabs }
        ]);
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
      placeholder.textContent = "💡 点左侧文件重新打开标签";
      tabsList.appendChild(placeholder);
    }
    updateTabActionButtons();
  }

  // ================= 浮动小菜单（移动文件 / 标签右键菜单） =================
  let floatingMenu = null;

  function closeFloatingMenu() {
    if (floatingMenu && floatingMenu.parentNode) floatingMenu.parentNode.removeChild(floatingMenu);
    floatingMenu = null;
  }

  function showFloatingMenu(anchor, items) {
    closeFloatingMenu();
    const menu = document.createElement("div");
    menu.className = "floating-menu";
    items.forEach(it => {
      const b = document.createElement("button");
      b.className = "floating-menu-item" + (it.disabled ? " disabled" : "");
      b.textContent = it.label;
      if (it.disabled) {
        b.disabled = true;
      } else {
        b.addEventListener("click", (e) => {
          e.stopPropagation();
          closeFloatingMenu();
          try { it.fn(); } catch (err) { console.warn("菜单操作失败", err); }
        });
      }
      menu.appendChild(b);
    });
    document.body.appendChild(menu);
    const rect = anchor.getBoundingClientRect();
    const mw = menu.offsetWidth || 150;
    const mh = menu.offsetHeight || 0;
    let left = Math.min(rect.left, window.innerWidth - mw - 8);
    let top = rect.bottom + 4;
    if (top + mh > window.innerHeight - 8) top = Math.max(8, rect.top - mh - 4);
    menu.style.left = Math.max(8, left) + "px";
    menu.style.top = Math.max(8, top) + "px";
    floatingMenu = menu;
  }

  document.addEventListener("click", closeFloatingMenu);
  window.addEventListener("resize", closeFloatingMenu);

  // 移动到文件夹的小选单
  function showFolderMenu(anchor, file) {
    showFloatingMenu(anchor, FileManager.getFolders().map(folder => ({
      label: folder.emoji + " " + folder.name + (folder.id === file.folderId ? "（当前）" : ""),
      disabled: folder.id === file.folderId,
      fn: () => {
        if (FileManager.moveFile(file.id, folder.id)) {
          showToast("已移动到「" + folder.name + "」", "📁");
          SoundEffects.playPop();
        }
      }
    })));
  }

  // 标签栏上的「关闭其他 / 关闭全部」按钮可用状态
  function updateTabActionButtons() {
    const openCount = FileManager.getFiles().filter(f => !closedTabIds.has(f.id)).length;
    const btnOther = document.getElementById("btnCloseOtherTabs");
    const btnAll = document.getElementById("btnCloseAllTabs");
    if (btnOther) btnOther.disabled = openCount <= 1;
    if (btnAll) btnAll.disabled = openCount === 0;
  }

  // 关闭全部标签（文件不会被删掉）
  function closeAllTabs() {
    const allFiles = FileManager.getFiles();
    if (!allFiles.length) return;
    allFiles.forEach(f => closedTabIds.add(f.id));
    saveClosedTabs();
    CodeEditor.setValue("");
    renderEditorTabs(allFiles, null);
    showToast("🧹 标签都关掉了，文件还在左边哦~", "🧹");
    SoundEffects.playPop();
  }

  // 关闭其他标签（保留 keepId 或当前标签）
  function closeOtherTabs(keepId) {
    const allFiles = FileManager.getFiles();
    const keep = keepId || (FileManager.getActiveFile() || {}).id;
    if (!keep) return;
    allFiles.forEach(f => { if (f.id !== keep) closedTabIds.add(f.id); });
    closedTabIds.delete(keep);
    saveClosedTabs();
    FileManager.setActiveFile(keep);
    renderEditorTabs(allFiles, keep);
    showToast("🧹 已关闭其他标签", "🧹");
    SoundEffects.playPop();
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
    updateTabActionButtons();
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
    btnReset.addEventListener("click", openGallery);

    // 趣味宝库：关闭 / 恢复初始示例
    const btnGalleryClose = document.getElementById("btnGalleryClose");
    if (btnGalleryClose) {
      btnGalleryClose.addEventListener("click", closeGalleryModal);
    }
    const galleryOverlay = document.getElementById("galleryModal");
    if (galleryOverlay) {
      galleryOverlay.addEventListener("click", (e) => {
        if (e.target === galleryOverlay) closeGalleryModal();
      });
    }
    const btnGalleryReset = document.getElementById("btnGalleryReset");
    if (btnGalleryReset) {
      btnGalleryReset.addEventListener("click", () => {
        showConfirmModal(
          "⚠️ 注意啦！",
          "恢复示例宝库会【替换掉你现在的所有文件】哦！<br>想保留自己的代码的话，先点「取消」，用左侧 📦 打包下载备份~<br><br>确定要恢复示例宝库吗？",
          () => {
            closedTabIds.clear();
            saveClosedTabs();
            FileManager.resetToDefault();
            closeGalleryModal();
            showToast("🎉 示例宝库已重新装满！", "🎁");
            SoundEffects.playSuccess();
          }
        );
      });
    }

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
      openCreateModal(FileManager.getMyFolderId());
    });

    // 新建文件夹
    const btnNewFolder = document.getElementById("btnNewFolder");
    if (btnNewFolder) {
      btnNewFolder.addEventListener("click", openFolderCreateModal);
    }

    // 标签：关闭其他 / 关闭全部
    const btnCloseOther = document.getElementById("btnCloseOtherTabs");
    if (btnCloseOther) {
      btnCloseOther.addEventListener("click", () => closeOtherTabs());
    }
    const btnCloseAll = document.getElementById("btnCloseAllTabs");
    if (btnCloseAll) {
      btnCloseAll.addEventListener("click", closeAllTabs);
    }

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
          // 按文件夹分层打包，解压后结构清晰
          const blob = ZipWriter.build(all.map(f => ({
            name: f.folderName ? f.folderName + "/" + f.name : f.name,
            content: f.content
          })));
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

    // 生成作品卡（海报分享）
    const btnPoster = document.getElementById("btnMakePoster");
    if (btnPoster) {
      btnPoster.addEventListener("click", () => {
        const file = FileManager.getActiveFile();
        const turtleCanvas = document.getElementById("turtleCanvas");
        showToast("🖼️ 正在制作作品卡...", "🎨");
        Poster.toBlob({
          filename: file ? file.name : "我的作品",
          code: CodeEditor.getValue(),
          turtleCanvas: turtleCanvas
        }).then((blob) => {
          if (!blob) { showToast("作品卡生成失败了", "😢"); return; }
          downloadBlob(blob, `${(file ? file.name : "作品").replace(/\.py$/i, "")}_作品卡.png`);
          showToast("🖼️ 作品卡已生成，快发给爸爸妈妈看看吧！", "🎉");
          SoundEffects.playSuccess();
        }).catch((err) => {
          console.error("作品卡生成失败", err);
          showToast("作品卡生成失败了", "😢");
        });
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

  // ================= 趣味宝库（分类示例库） =================
  let galleryCategory = "basic";

  function renderGallery() {
    const tabs = document.getElementById("galleryTabs");
    const list = document.getElementById("galleryList");
    if (!tabs || !list || typeof DEFAULT_EXAMPLES === "undefined") return;
    const cats = typeof EXAMPLE_CATEGORIES !== "undefined" ? EXAMPLE_CATEGORIES : [];
    if (cats.length && !cats.some(c => c.id === galleryCategory)) galleryCategory = cats[0].id;

    tabs.innerHTML = "";
    cats.forEach(cat => {
      const btn = document.createElement("button");
      btn.className = "gallery-tab" + (cat.id === galleryCategory ? " active" : "");
      btn.textContent = cat.emoji + " " + cat.name;
      btn.addEventListener("click", () => {
        galleryCategory = cat.id;
        renderGallery();
        SoundEffects.playPop();
      });
      tabs.appendChild(btn);
    });

    const meta = typeof EXAMPLE_META !== "undefined" ? EXAMPLE_META : {};
    const items = DEFAULT_EXAMPLES.filter(ex => ((meta[ex.id] || {}).category || "basic") === galleryCategory);
    list.innerHTML = "";
    if (!items.length) {
      list.innerHTML = "<div class=\"gallery-empty\">这个分类还在准备中，先玩别的吧~</div>";
      return;
    }
    items.forEach(ex => {
      const info = meta[ex.id] || {};
      const card = document.createElement("button");
      card.className = "gallery-item";
      const head = document.createElement("div");
      head.className = "gallery-item-head";
      const nameEl = document.createElement("span");
      nameEl.className = "gallery-item-name";
      nameEl.textContent = ex.name.replace(/\.py$/, "");
      const starEl = document.createElement("span");
      starEl.className = "gallery-item-star";
      starEl.textContent = "⭐".repeat(Math.max(1, Math.min(3, info.level || 1)));
      head.appendChild(nameEl);
      head.appendChild(starEl);
      const descEl = document.createElement("div");
      descEl.className = "gallery-item-desc";
      descEl.textContent = info.desc || "点开看看这个作品吧";
      card.appendChild(head);
      card.appendChild(descEl);
      card.addEventListener("click", () => openExample(ex));
      list.appendChild(card);
    });
  }

  function openGallery() {
    renderGallery();
    document.getElementById("galleryModal").classList.add("active");
    SoundEffects.playPop();
  }

  function closeGalleryModal() {
    document.getElementById("galleryModal").classList.remove("active");
  }

  // 打开示例：已有同名文件就直接用（保留孩子的改动），没有才新建
  function openExample(ex) {
    const files = FileManager.getAllFiles();
    let target = files.find(f => f.name === ex.name);
    if (!target) {
      target = FileManager.createFile(ex.name, ex.content);
    } else {
      FileManager.setActiveFile(target.id);
    }
    if (target) {
      closedTabIds.delete(target.id);
      saveClosedTabs();
      const active = FileManager.getActiveFile();
      if (active) CodeEditor.setValue(active.content);
    }
    closeGalleryModal();
    showToast("🎁 已打开：" + ex.name.replace(/\.py$/, ""), "🎁");
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

  // ================= 文件 / 文件夹弹窗管理 =================
  function openFileModal(titleHtml, desc, value, mode, targetId) {
    modalMode = mode;
    modalTargetId = targetId || null;
    document.getElementById("fileModalTitle").innerHTML = titleHtml;
    document.getElementById("fileModalDesc").textContent = desc;
    const input = document.getElementById("fileModalInput");
    input.value = value;
    document.getElementById("fileModal").classList.add("active");
    input.focus();
    input.select();
  }

  function openCreateModal(folderId) {
    modalFolderId = folderId || null;
    const folder = FileManager.getFolders().find(f => f.id === folderId);
    openFileModal(
      "<span>✨ 新建 Python 代码文件</span>",
      folder ? `会放到「${folder.name}」里，给你的代码起个名字吧（建议以 .py 结尾）` : "给你的代码起一个酷酷的名字吧（建议以 .py 结尾）",
      `新代码_${FileManager.getFiles().length + 1}.py`,
      "create",
      null
    );
  }

  function openRenameModal(fileId, currentName) {
    openFileModal("<span>✏️ 重命名文件</span>", "修改一个新名字：", currentName, "rename", fileId);
  }

  function openFolderCreateModal() {
    openFileModal(
      "<span>📁 新建文件夹</span>",
      "给文件夹起个名字吧（例如：我的游戏、练习本）",
      `新文件夹${FileManager.getFolders().length + 1}`,
      "createFolder",
      null
    );
  }

  function openFolderRenameModal(folderId, currentName) {
    openFileModal("<span>✏️ 文件夹改名</span>", "修改一个新名字：", currentName, "renameFolder", folderId);
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
      FileManager.createFile(name, undefined, modalFolderId);
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
    } else if (modalMode === "createFolder") {
      const folder = FileManager.createFolder(name);
      showToast(`📁 文件夹「${folder.name}」建好啦`, "📁");
      SoundEffects.playSuccess();
    } else if (modalMode === "renameFolder") {
      if (FileManager.renameFolder(modalTargetId, name)) {
        showToast("✏️ 文件夹改名完成！", "✨");
        SoundEffects.playSuccess();
      } else {
        showToast("⚠️ 改名失败，可能已经有同名文件夹了", "❌");
        return;
      }
    }
    modalFolderId = null;
    closeModal();
  }

  function confirmDeleteFolder(folder) {
    const count = FileManager.getFilesIn(folder.id).length;
    showConfirmModal(
      "🗑️ 删除文件夹",
      `确定要删除文件夹【${escapeHtml(folder.name)}】吗？<br>` +
      (count ? `里面的 <b>${count}</b> 个文件会移到「我的作品」，不会丢～` : "这个文件夹是空的。"),
      () => {
        const res = FileManager.deleteFolder(folder.id);
        if (res.success) {
          showToast(`已删除文件夹 ${folder.name}`, "🗑️");
          SoundEffects.playPop();
        } else {
          showToast(res.reason, "⚠️");
        }
      }
    );
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
        "💡 点击右侧运行舞台上的 <b>🚀 运行代码</b> 按钮，看看会发生什么吧！",
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