/**
 * 📁 文件树管理器 (File Tree Manager)
 * 负责工程文件 / 文件夹的新建、删除、重命名、本地持久化、多文件切换
 */
const FileManager = (() => {
  const STORAGE_KEY = "codepanda_python_files_v1";   // v1 存的是「文件数组」，v2 存 { folders, files, collapsed }
  const ACTIVE_FILE_KEY = "codepanda_active_file_id";
  const FORMAT_VERSION = 2;

  // 多孩子档案：每个小伙伴一套独立的文件存储（命名空间为空 = 老版本键，保证老数据不丢）
  let namespace = "";

  function filesKey() {
    return namespace ? STORAGE_KEY + "__" + namespace : STORAGE_KEY;
  }

  function activeKey() {
    return namespace ? ACTIVE_FILE_KEY + "__" + namespace : ACTIVE_FILE_KEY;
  }

  let files = [];
  let folders = [];
  let collapsed = {};      // 文件夹折叠状态 { folderId: true }
  let activeFileId = null;
  let listeners = [];
  let storageErrorListeners = [];
  let lastStorageError = null;

  // 内置文件夹：孩子的作品 / 官方示例
  const MY_FOLDER = { id: "f_mine", name: "我的作品", emoji: "📁", keep: true };   // keep: 默认文件夹，不允许删除
  const EXAMPLES_FOLDER = { id: "f_examples", name: "示例宝库", emoji: "🎁", builtin: true };

  function clone(obj) { return JSON.parse(JSON.stringify(obj)); }

  function defaultFolders() {
    return [clone(MY_FOLDER), clone(EXAMPLES_FOLDER)];
  }

  function isExampleId(id) {
    return typeof id === "string" && id.startsWith("ex_");
  }

  // 「我的作品」文件夹（放新文件的地方）
  function myFolderId() {
    const mine = folders.find(f => !f.builtin);
    return mine ? mine.id : (folders[0] ? folders[0].id : MY_FOLDER.id);
  }

  function ensureFolders() {
    if (!folders.length) folders = defaultFolders();
    if (!folders.some(f => f.id === EXAMPLES_FOLDER.id)) {
      folders.push(clone(EXAMPLES_FOLDER));
    }
    const ids = folders.map(f => f.id);
    files.forEach(f => {
      if (!f.folderId || ids.indexOf(f.folderId) === -1) {
        f.folderId = isExampleId(f.id) ? EXAMPLES_FOLDER.id : myFolderId();
      }
    });
  }

  // 初始化加载（会自动把老版本数据迁移到带文件夹的新格式）
  function init() {
    let raw = null;
    try {
      const saved = localStorage.getItem(filesKey());
      if (saved) raw = JSON.parse(saved);
    } catch (e) {
      console.warn("读取本地缓存失败，使用默认示例", e);
    }

    if (Array.isArray(raw)) {
      // v1：裸的文件数组 → 迁移；内置示例归入「示例宝库」，孩子自己的文件归入「我的作品」
      files = raw;
      folders = defaultFolders();
      collapsed = { f_examples: true };
    } else if (raw && Array.isArray(raw.files)) {
      files = raw.files;
      folders = Array.isArray(raw.folders) && raw.folders.length ? raw.folders : defaultFolders();
      collapsed = (raw.collapsed && typeof raw.collapsed === "object") ? raw.collapsed : { f_examples: true };
    } else {
      files = [];
      folders = defaultFolders();
      collapsed = { f_examples: true };
    }

    if (!files.length) {
      resetToDefault();
      return;
    }

    ensureFolders();
    activeFileId = localStorage.getItem(activeKey()) || files[0].id;
    if (!files.find(f => f.id === activeFileId)) {
      activeFileId = files[0].id;
    }
    saveToStorage();          // 迁移结果立刻落盘
  }

  // 重置回初始示例库（全部放进「示例宝库」，孩子自己的文件夹清空）
  function resetToDefault() {
    folders = defaultFolders();
    collapsed = { f_examples: true };
    files = clone(DEFAULT_EXAMPLES);
    files.forEach(f => { f.folderId = EXAMPLES_FOLDER.id; });
    activeFileId = files[0].id;
    saveToStorage();
    notifyChange();
  }

  // 保存到本地存储（失败时通知界面，避免静默丢失孩子的代码）
  function saveToStorage() {
    try {
      localStorage.setItem(filesKey(), JSON.stringify({
        v: FORMAT_VERSION, folders: folders, files: files, collapsed: collapsed
      }));
      if (activeFileId) {
        localStorage.setItem(activeKey(), activeFileId);
      }
      if (lastStorageError) {
        lastStorageError = null;
        storageErrorListeners.forEach(fn => { try { fn(null); } catch (e) {} });
      }
      return true;
    } catch (e) {
      console.error("保存本地存储失败", e);
      // 浏览器存储配额溢出等错误：必须让孩子知道，否则会静默丢代码
      lastStorageError = e && e.name === "QuotaExceededError"
        ? "浏览器存储空间满了，新改动可能无法保存！建议用 📦 打包下载备份后，删除一些不用的文件。"
        : "保存到浏览器失败，请用 📦 打包下载备份你的代码！";
      storageErrorListeners.forEach(fn => { try { fn(lastStorageError); } catch (e2) {} });
      return false;
    }
  }

  // 广播变化
  function notifyChange() {
    listeners.forEach(fn => fn(files, activeFileId));
  }

  return {
    init,

    // 切换档案的存储空间（会重新载入该小伙伴的作品库）
    setNamespace(id) {
      const next = id ? String(id) : "";
      if (next === namespace) return files;
      namespace = next;
      files = [];
      folders = [];
      collapsed = {};
      activeFileId = null;
      init();
      return files;
    },

    getNamespace() {
      return namespace;
    },

    // 从 localStorage 重新载入当前档案（云同步应用远端数据后调用）
    reload() {
      files = [];
      folders = [];
      collapsed = {};
      activeFileId = null;
      init();
      return files;
    },

    onChange(fn) {
      listeners.push(fn);
    },

    getFiles() {
      return files;
    },

    // ================= 文件夹 =================
    getFolders() {
      return folders.slice();
    },

    getCollapsed() {
      return Object.assign({}, collapsed);
    },

    getMyFolderId: myFolderId,

    toggleFolder(id) {
      collapsed[id] = !collapsed[id];
      saveToStorage();
      notifyChange();
      return !collapsed[id];
    },

    createFolder(name) {
      const base = (name || "").trim().slice(0, 12) || ("新文件夹" + (folders.length + 1));
      let unique = base;
      let i = 1;
      while (folders.some(f => f.name === unique)) { unique = base + "_" + i; i++; }
      const folder = { id: "fd_" + Date.now() + "_" + Math.floor(Math.random() * 1000), name: unique, emoji: "📁" };
      folders.push(folder);
      saveToStorage();
      notifyChange();
      return folder;
    },

    renameFolder(id, name) {
      const folder = folders.find(f => f.id === id);
      if (!folder) return false;
      if (folder.builtin) return false;            // 内置文件夹不允许改名
      const trimmed = (name || "").trim().slice(0, 12);
      if (!trimmed) return false;
      if (folders.some(f => f.id !== id && f.name === trimmed)) return false;
      folder.name = trimmed;
      saveToStorage();
      notifyChange();
      return true;
    },

    // 删除文件夹：里面的文件会移到「我的作品」，不会丢
    deleteFolder(id) {
      const index = folders.findIndex(f => f.id === id);
      if (index === -1) return { success: false, reason: "文件夹不存在" };
      if (folders[index].builtin) return { success: false, reason: "内置文件夹不能删除哦！" };
      if (folders[index].keep) return { success: false, reason: "这是默认文件夹，不能删除哦！把文件移走后改个名也行~" };
      folders.splice(index, 1);
      const fallback = myFolderId();
      let moved = 0;
      files.forEach(f => { if (f.folderId === id) { f.folderId = fallback; moved++; } });
      delete collapsed[id];
      saveToStorage();
      notifyChange();
      return { success: true, movedTo: fallback, moved: moved };
    },

    // 把文件移动到指定文件夹
    moveFile(fileId, folderId) {
      const file = files.find(f => f.id === fileId);
      if (!file) return false;
      if (!folders.some(f => f.id === folderId)) return false;
      if (file.folderId === folderId) return true;
      file.folderId = folderId;
      saveToStorage();
      notifyChange();
      return true;
    },

    // 某个文件夹里的文件
    getFilesIn(folderId) {
      return files.filter(f => f.folderId === folderId);
    },

    getActiveFile() {
      return files.find(f => f.id === activeFileId) || files[0];
    },

    getActiveFileId() {
      return activeFileId;
    },

    setActiveFile(id) {
      if (activeFileId === id) return;
      const file = files.find(f => f.id === id);
      if (file) {
        activeFileId = id;
        // 文件所在文件夹若是收起状态，自动展开，方便孩子看到它在哪里
        if (file.folderId && collapsed[file.folderId]) {
          collapsed[file.folderId] = false;
          saveToStorage();
        }
        localStorage.setItem(activeKey(), activeFileId);
        notifyChange();
      }
    },

    // 更新当前文件内容
    updateActiveContent(content) {
      const file = this.getActiveFile();
      if (file && file.content !== content) {
        file.content = content;
        saveToStorage();
        // 内容有改动 → 通知云同步（登录后会自动排队上传）
        if (typeof CloudSync !== "undefined" && CloudSync.noteDirty) CloudSync.noteDirty();
      }
    },

    // 新建文件（folderId 不传则放进「我的作品」）
    createFile(name, content = "# 在这里写下你的 Python 代码魔法吧！✨\n\nprint(\"你好！今天也是元气满满的一天！\")\n", folderId) {
      let finalName = (name || "").trim();
      if (!finalName) {
        finalName = `我的代码_${files.length + 1}.py`;
      }
      if (!finalName.endsWith(".py")) {
        finalName += ".py";
      }

      // 重名检查
      let count = 1;
      let uniqueName = finalName;
      while (files.some(f => f.name.toLowerCase() === uniqueName.toLowerCase())) {
        const base = finalName.replace(/\.py$/, "");
        uniqueName = `${base}_${count}.py`;
        count++;
      }

      const target = (folderId && folders.some(f => f.id === folderId)) ? folderId : myFolderId();
      const newFile = {
        id: "file_" + Date.now() + "_" + Math.floor(Math.random() * 1000),
        name: uniqueName,
        content: content,
        folderId: target
      };

      files.push(newFile);
      activeFileId = newFile.id;
      collapsed[target] = false;        // 新文件所在文件夹自动展开
      saveToStorage();
      notifyChange();
      return newFile;
    },

    // 判断是否为内置示例
    isExampleFile(id) {
      return isExampleId(id);
    },

    // 重命名文件
    renameFile(id, newName) {
      const file = files.find(f => f.id === id);
      if (!file) return false;
      if (this.isExampleFile(id)) return false; // 内置示例不可重命名

      let trimmed = (newName || "").trim();
      if (!trimmed) return false;
      if (!trimmed.endsWith(".py")) trimmed += ".py";

      // 检查其他文件是否重名
      if (files.some(f => f.id !== id && f.name.toLowerCase() === trimmed.toLowerCase())) {
        return false;
      }

      file.name = trimmed;
      saveToStorage();
      notifyChange();
      return true;
    },

    // 删除文件
    deleteFile(id) {
      if (this.isExampleFile(id)) {
        return { success: false, reason: "内置示例不能删除哦！" };
      }
      if (files.length <= 1) {
        return { success: false, reason: "至少要保留一个代码文件哦！" };
      }

      const index = files.findIndex(f => f.id === id);
      if (index === -1) return { success: false, reason: "文件不存在" };

      files.splice(index, 1);
      if (activeFileId === id) {
        activeFileId = files[Math.max(0, index - 1)].id;
      }

      saveToStorage();
      notifyChange();
      return { success: true };
    },

    // 监听本地存储写入失败（例如配额溢出）
    onStorageError(fn) {
      storageErrorListeners.push(fn);
    },

    getStorageError() {
      return lastStorageError;
    },

    // 粗略估算已用存储空间（字节）
    getStorageUsage() {
      try {
        let total = 0;
        for (const f of files) {
          total += (f.content || "").length + (f.name || "").length;
        }
        return total * 2; // UTF-16 约 2 字节/字符
      } catch (e) {
        return 0;
      }
    },

    // 全部作品（供打包下载），附带所在文件夹名字
    getAllFiles() {
      return files.map(f => {
        const folder = folders.find(x => x.id === f.folderId);
        return Object.assign({}, f, { folderName: folder ? folder.name : "" });
      });
    },

    resetToDefault
  };
})();
