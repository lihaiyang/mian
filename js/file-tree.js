/**
 * 📁 文件树管理器 (File Tree Manager)
 * 负责工程文件的新建、删除、重命名、本地持久化、多文件切换
 */
const FileManager = (() => {
  const STORAGE_KEY = "codepanda_python_files_v1";
  const ACTIVE_FILE_KEY = "codepanda_active_file_id";

  let files = [];
  let activeFileId = null;
  let listeners = [];

  // 初始化加载
  function init() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        files = JSON.parse(saved);
      }
    } catch (e) {
      console.warn("读取本地缓存失败，使用默认示例", e);
    }

    if (!files || files.length === 0) {
      resetToDefault();
    } else {
      activeFileId = localStorage.getItem(ACTIVE_FILE_KEY) || files[0].id;
      // 确认 activeFileId 是否有效
      if (!files.find(f => f.id === activeFileId)) {
        activeFileId = files[0].id;
      }
    }
  }

  // 重置回初始示例库
  function resetToDefault() {
    files = JSON.parse(JSON.stringify(DEFAULT_EXAMPLES));
    activeFileId = files[0].id;
    saveToStorage();
    notifyChange();
  }

  // 保存到本地存储
  function saveToStorage() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(files));
      if (activeFileId) {
        localStorage.setItem(ACTIVE_FILE_KEY, activeFileId);
      }
    } catch (e) {
      console.error("保存本地存储失败", e);
    }
  }

  // 广播变化
  function notifyChange() {
    listeners.forEach(fn => fn(files, activeFileId));
  }

  return {
    init,

    onChange(fn) {
      listeners.push(fn);
    },

    getFiles() {
      return files;
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
        localStorage.setItem(ACTIVE_FILE_KEY, activeFileId);
        notifyChange();
      }
    },

    // 更新当前文件内容
    updateActiveContent(content) {
      const file = this.getActiveFile();
      if (file && file.content !== content) {
        file.content = content;
        saveToStorage();
      }
    },

    // 新建文件
    createFile(name, content = "# 在这里写下你的 Python 代码魔法吧！✨\n\nprint(\"你好！今天也是元气满满的一天！\")\n") {
      let finalName = name.trim();
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

      const newFile = {
        id: "file_" + Date.now() + "_" + Math.floor(Math.random() * 1000),
        name: uniqueName,
        content: content
      };

      files.push(newFile);
      activeFileId = newFile.id;
      saveToStorage();
      notifyChange();
      return newFile;
    },

    // 判断是否为内置示例
    isExampleFile(id) {
      return id && id.startsWith("ex_");
    },

    // 重命名文件
    renameFile(id, newName) {
      const file = files.find(f => f.id === id);
      if (!file) return false;
      if (this.isExampleFile(id)) return false; // 内置示例不可重命名

      let trimmed = newName.trim();
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

    resetToDefault
  };
})();
