/**
 * 🚀 主应用入口控制器 (Main Application Controller)
 * 负责各功能模块生命周期协调、用户交互、事件响应与状态同步
 */
window.App = (() => {
  let activeTab = "console"; // "console" | "turtle"
  let modalMode = "create";  // "create" | "rename"
  let modalTargetId = null;

  function init() {
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

    // 5. 绑定所有用户界面事件
    bindUIEvents();

    // 6. 异步启动 Python 引擎初始化
    PythonRunner.init();

    console.log("🐼 萌码 Python 少儿工坊初始化就绪！");
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
      const item = document.createElement("div");
      item.className = `file-item ${file.id === activeId ? "active" : ""}`;

      // 文件图标与名称
      const info = document.createElement("div");
      info.className = "file-info";
      info.title = file.name;
      info.innerHTML = `<span class="file-icon">🐍</span><span class="file-name">${escapeHtml(file.name)}</span>`;
      info.addEventListener("click", () => {
        FileManager.setActiveFile(file.id);
        SoundEffects.playPop();
      });

      // 操作小按钮（重命名、删除）
      const actions = document.createElement("div");
      actions.className = "file-actions";

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

      item.appendChild(info);
      item.appendChild(actions);
      listElem.appendChild(item);
    });
  }

  // 渲染编辑器上方标签页
  function renderEditorTabs(files, activeId) {
    const tabsList = document.getElementById("editorTabsList");
    if (!tabsList) return;

    tabsList.innerHTML = "";
    files.forEach(file => {
      const tab = document.createElement("div");
      tab.className = `editor-tab ${file.id === activeId ? "active" : ""}`;
      tab.title = file.name;
      tab.innerHTML = `<span>🐍 ${escapeHtml(file.name)}</span>`;

      tab.addEventListener("click", () => {
        FileManager.setActiveFile(file.id);
        SoundEffects.playPop();
      });

      tabsList.appendChild(tab);
    });
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
      if (confirm("⚠️ 注意啦！恢复示例宝库会【替换掉你现在的所有文件】哦！\n\n想保留自己的代码的话，先点「取消」，用左侧 ⬇️ 按钮下载保存~\n确定要恢复示例宝库吗？")) {
        FileManager.resetToDefault();
        showToast("🎉 示例宝库已重新装满！", "🎁");
        SoundEffects.playSuccess();
      }
    });

    // 暗黑太空模式切换
    const btnTheme = document.getElementById("btnToggleTheme");
    const themeIcon = document.getElementById("themeIcon");
    btnTheme.addEventListener("click", () => {
      document.body.classList.toggle("dark-mode");
      const isDark = document.body.classList.contains("dark-mode");
      themeIcon.textContent = isDark ? "☀️" : "🌙";
      CodeEditor.refresh();
      SoundEffects.playPop();
    });

    // 新建文件按钮
    const btnNew = document.getElementById("btnNewFile");
    btnNew.addEventListener("click", () => {
      openCreateModal();
    });

    // 下载当前文件为 .py（对孩子来说比 JSON 包更直观，可直接双击打开）
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

    // 积木代码点击一键插入
    document.querySelectorAll(".snippet-chip").forEach(btn => {
      btn.addEventListener("click", () => {
        const snippet = btn.getAttribute("data-code");
        if (snippet) {
          CodeEditor.insertSnippet(snippet);
          showToast("🧩 积木已放入代码工坊！", "🪄");
        }
      });
    });

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

    // 模态弹窗事件
    document.getElementById("btnCancelModal").addEventListener("click", closeModal);
    document.getElementById("btnConfirmModal").addEventListener("click", handleModalConfirm);
    document.getElementById("fileModalInput").addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        handleModalConfirm();
      }
    });

    // 点击弹窗遮罩空白处也可关闭
    const modalOverlay = document.getElementById("fileModal");
    modalOverlay.addEventListener("click", (e) => {
      if (e.target === modalOverlay) {
        closeModal();
      }
    });

    // 全局快捷键拦截 (Ctrl+S / Cmd+S / Ctrl+Enter / Esc 关弹窗)
    window.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        closeModal();
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
      // 视窗从隐藏变为可见后，重算画布缩放
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
    PythonRunner.run(code);
  }

  function saveCurrentFile() {
    const content = CodeEditor.getValue();
    FileManager.updateActiveContent(content);
    showToast("💾 保存成功！你的代码安然无恙~", "🌟");
    SoundEffects.playSuccess();
  }

  // 弹窗管理
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
    if (confirm(`🗑️ 确定要删除文件【${fileName}】吗？删除后就找不回来了哦！`)) {
      const res = FileManager.deleteFile(fileId);
      if (res.success) {
        showToast(`已删除文件 ${fileName}`, "🗑️");
        SoundEffects.playPop();
      } else {
        showToast(res.reason, "⚠️");
      }
    }
  }

  // 优雅的悬浮提示小气泡
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
    runCurrentCode,
    saveCurrentFile,
    switchToTab,
    showToast
  };
})();

// DOM 就绪后启动
document.addEventListener("DOMContentLoaded", () => {
  window.App.init();
});
