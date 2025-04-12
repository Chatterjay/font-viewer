<script setup>
import { ref, inject, onMounted, onUnmounted } from "vue";
import ThemeToggle from "./ThemeToggle.vue";
import ChangelogModal from "./ChangelogModal.vue";
import { APP_INITIAL_VERSION } from "../constants/index.js";
import { GITHUB_REPO_URL } from "../constants/github.js";

// 应用版本 - 改为响应式
const appVersion = ref(APP_INITIAL_VERSION);

// 注入布局状态和方法
const isSideBySide = inject("isSideBySide");
const toggleLayout = inject("toggleLayout");

// 侧边栏位置状态
const sidebarPosition = ref("right"); // 'left' 或 'right'

// 是否显示侧边栏
const isVisible = ref(false);

// 更新日志模态框状态
const showChangelogModal = ref(false);

// 获取应用版本
const getAppVersion = () => {
  // 使用默认值
  return appVersion.value 
};

// 切换侧边栏位置
const toggleSidebarPosition = () => {
  sidebarPosition.value = sidebarPosition.value === "right" ? "left" : "right";
  localStorage.setItem("sidebarPosition", sidebarPosition.value);
};

// 切换侧边栏可见性
const toggleSidebar = () => {
  isVisible.value = !isVisible.value;
};

// 显示更新日志
const showChangelog = () => {
  showChangelogModal.value = true;
};

// 导出配置
const exportConfig = async () => {
  try {
    // 准备配置数据
    const config = {
      favorites: JSON.parse(localStorage.getItem("favoriteFonts") || "[]"),
      commercialFonts: JSON.parse(localStorage.getItem("commercialFonts") || "[]"),
      theme: localStorage.getItem("theme") || "system",
      layout: localStorage.getItem("layout") || "vertical",
      sidebarPosition: localStorage.getItem("sidebarPosition") || "right",
      version: appVersion.value,
      exportDate: new Date().toISOString(),
    };

    // 格式化JSON数据
    const jsonData = JSON.stringify(config, null, 2);

    // 检测环境 - 是否在Tauri环境中运行
    const isTauriEnv = typeof window.__TAURI__ !== "undefined";

    if (isTauriEnv) {
      try {
        // 使用Tauri API处理文件保存
        const { save } = window.__TAURI__.dialog;
        const { writeTextFile } = window.__TAURI__.fs;

        // 打开保存文件对话框
        const savePath = await save({
          filters: [
            {
              name: "配置文件",
              extensions: ["json"],
            },
          ],
          defaultPath: "font-viewer-config.json",
        });

        if (savePath) {
          // 使用Tauri的文件系统API写入文件
          await writeTextFile(savePath, jsonData);
          showToast("配置已成功导出", 2000, "success");
        } else {
          // 用户取消了操作
          console.log("用户取消了导出操作");
        }
      } catch (tauriError) {
        console.error("Tauri导出失败:", tauriError);
        // 降级到浏览器API
        showToast("Tauri导出失败，尝试使用浏览器方式导出...", 1500, "info");
        exportConfigBrowser(jsonData);
      }
    } else {
      // 非Tauri环境使用浏览器API
      exportConfigBrowser(jsonData);
    }
  } catch (error) {
    console.error("导出配置失败:", error);
    showToast("导出配置失败，请重试", 3000, "error");
  }
};

// 浏览器环境下的导出实现
const exportConfigBrowser = (jsonData) => {
  try {
    const blob = new Blob([jsonData], { type: "application/json" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = `font-viewer-config-${new Date().toISOString().split("T")[0]}.json`;
    a.style.display = "none";
    document.body.appendChild(a);

    // 触发下载
    a.click();

    // 延迟清理资源
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 100);

    showToast("配置已成功导出", 2000, "success");
  } catch (error) {
    console.error("浏览器导出失败:", error);
    showToast("导出配置失败，请重试", 3000, "error");
  }
};

// 导入配置
const importConfig = async () => {
  try {
    // 检测环境 - 是否在Tauri环境中运行
    const isTauriEnv = typeof window.__TAURI__ !== "undefined";

    if (isTauriEnv) {
      try {
        // 使用Tauri API处理文件选择和读取
        const { open } = window.__TAURI__.dialog;
        const { readTextFile } = window.__TAURI__.fs;

        // 打开文件选择对话框
        const selected = await open({
          filters: [
            {
              name: "配置文件",
              extensions: ["json"],
            },
          ],
          multiple: false,
        });

        if (selected) {
          // 读取所选文件内容
          const content = await readTextFile(selected);
          // 处理配置数据
          processImportedConfig(content);
        } else {
          // 用户取消了操作
          console.log("用户取消了导入操作");
        }
      } catch (tauriError) {
        console.error("Tauri导入失败:", tauriError);
        // 降级到浏览器API
        showToast("Tauri导入失败，尝试使用浏览器方式导入...", 1500, "info");
        importConfigBrowser();
      }
    } else {
      // 非Tauri环境使用浏览器API
      importConfigBrowser();
    }
  } catch (error) {
    console.error("导入配置失败:", error);
    showToast("导入配置失败，请重试", 3000, "error");
  }
};

// 浏览器环境下的导入实现
const importConfigBrowser = () => {
  const input = document.createElement("input");
  input.type = "file";
  input.accept = ".json";

  input.onchange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        // 获取文件内容
        const content = event.target?.result || "{}";
        // 处理配置数据
        processImportedConfig(content);
      } catch (error) {
        console.error("读取文件失败:", error);
        showToast("读取文件失败，请检查文件格式", 3000, "error");
      }
    };

    reader.onerror = () => {
      showToast("读取文件失败，请重试", 3000, "error");
    };

    reader.readAsText(file);
  };

  input.click();
};

// 处理导入的配置数据
const processImportedConfig = (content) => {
  try {
    // 解析JSON
    const config = JSON.parse(content);

    // 验证配置版本
    if (!config.version) {
      showToast("无效的配置文件，缺少版本信息", 3000, "error");
      return;
    }

    // 验证配置版本兼容性
    if (config.version !== appVersion.value) {
      showToast(`配置文件版本(${config.version})不兼容`, 3000, "error");
      return;
    }

    // 验证必要的字段
    if (!Array.isArray(config.favorites) || !Array.isArray(config.commercialFonts)) {
      showToast("配置文件缺少必要的字段", 3000, "error");
      return;
    }

    // 更新本地存储
    const updates = [
      ["favoriteFonts", JSON.stringify(config.favorites || [])],
      ["commercialFonts", JSON.stringify(config.commercialFonts || [])],
      ["theme", config.theme || "system"],
      ["layout", config.layout || "vertical"],
      ["sidebarPosition", config.sidebarPosition || "right"],
    ];

    try {
      // 执行更新
      updates.forEach(([key, value]) => {
        localStorage.setItem(key, value);
      });

      // 显示成功消息
      showToast("配置导入成功，正在刷新页面...", 1500, "success");

      // 延迟刷新页面，以便用户看到成功消息
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (storageError) {
      console.error("本地存储更新失败:", storageError);
      showToast("导入失败，无法更新本地存储", 3000, "error");
    }
  } catch (error) {
    console.error("处理配置数据失败:", error);
    showToast("导入失败，配置文件格式错误", 3000, "error");
  }
};

// 清理缓存
const clearCache = () => {
  if (confirm("确定要清理所有缓存数据吗？这将清除所有收藏、商用标记和主题设置。")) {
    localStorage.clear();
    window.location.reload();
  }
};

// 刷新页面
const refreshPage = () => {
  window.location.reload();
};

// 显示提示消息
const showToast = (message, duration = 2000, type = "info") => {
  // 检查是否已有toast，避免创建多个
  let toast = document.querySelector(".app-copy-toast");

  // 确定toast的样式类
  const typeClass =
    type === "error"
      ? "toast-error"
      : type === "success"
      ? "toast-success"
      : "toast-info";

  if (toast) {
    // 重置所有类型类
    toast.classList.remove("toast-error", "toast-success", "toast-info");
    // 更新已有toast的内容、类型和显示状态
    toast.textContent = message;
    toast.classList.add(typeClass);
    toast.classList.add("show");
  } else {
    // 创建新的toast
    toast = document.createElement("div");
    toast.className = `app-copy-toast ${typeClass}`;
    toast.textContent = message;
    document.body.appendChild(toast);

    // 使用requestAnimationFrame确保DOM更新后添加show类
    requestAnimationFrame(() => {
      toast.classList.add("show");
    });
  }

  // 清除可能已存在的定时器
  if (toast._hideTimeout) {
    clearTimeout(toast._hideTimeout);
  }

  // 设置自动隐藏
  toast._hideTimeout = setTimeout(() => {
    toast.classList.remove("show");

    // 移除DOM元素以避免内存泄漏
    setTimeout(() => {
      if (toast && toast.parentNode) {
        document.body.removeChild(toast);
      }
    }, 300);
  }, duration);
};

// 关闭侧边栏的点击处理
const handleClickOutside = (event) => {
  const sidebar = document.querySelector(".settings-sidebar");
  const toggleBtn = document.querySelector(".settings-toggle-btn");
  if (
    isVisible.value &&
    sidebar &&
    !sidebar.contains(event.target) &&
    !toggleBtn.contains(event.target)
  ) {
    isVisible.value = false;
  }
};

// 加载保存的侧边栏位置和版本信息
onMounted(() => {
  const savedPosition = localStorage.getItem("sidebarPosition");
  if (savedPosition) {
    sidebarPosition.value = savedPosition;
  }

  // 获取最新版本信息
  getAppVersion();

  document.addEventListener("click", handleClickOutside);
});

onUnmounted(() => {
  document.removeEventListener("click", handleClickOutside);
});
</script>

<template>
  <!-- 设置按钮 -->
  <button class="settings-toggle-btn" @click="toggleSidebar" title="设置">
    <svg viewBox="0 0 24 24" width="24" height="24">
      <path
        fill="currentColor"
        d="M19.14,12.94c0.04-0.3,0.06-0.61,0.06-0.94c0-0.32-0.02-0.64-0.07-0.94l2.03-1.58c0.18-0.14,0.23-0.41,0.12-0.61 l-1.92-3.32c-0.12-0.22-0.37-0.29-0.59-0.22l-2.39,0.96c-0.5-0.38-1.03-0.7-1.62-0.94L14.4,2.81c-0.04-0.24-0.24-0.41-0.48-0.41 h-3.84c-0.24,0-0.43,0.17-0.47,0.41L9.25,5.35C8.66,5.59,8.12,5.92,7.63,6.29L5.24,5.33c-0.22-0.08-0.47,0-0.59,0.22L2.74,8.87 C2.62,9.08,2.66,9.34,2.86,9.48l2.03,1.58C4.84,11.36,4.8,11.69,4.8,12s0.02,0.64,0.07,0.94l-2.03,1.58 c-0.18,0.14-0.23,0.41-0.12,0.61l1.92,3.32c0.12,0.22,0.37,0.29,0.59,0.22l2.39-0.96c0.5,0.38,1.03,0.7,1.62,0.94l0.36,2.54 c0.05,0.24,0.24,0.41,0.48,0.41h3.84c0.24,0,0.44-0.17,0.47-0.41l0.36-2.54c0.59-0.24,1.13-0.56,1.62-0.94l2.39,0.96 c0.22,0.08,0.47,0,0.59-0.22l1.92-3.32c0.12-0.22,0.07-0.47-0.12-0.61L19.14,12.94z M12,15.6c-1.98,0-3.6-1.62-3.6-3.6 s1.62-3.6,3.6-3.6s3.6,1.62,3.6,3.6S13.98,15.6,12,15.6z"
      />
    </svg>
  </button>

  <!-- 设置侧边栏 -->
  <div
    class="settings-sidebar"
    :class="{
      visible: isVisible,
      'sidebar-left': sidebarPosition === 'left',
      'sidebar-right': sidebarPosition === 'right',
    }"
  >
    <div class="settings-header">
      <h2>设置</h2>
      <button class="close-btn" @click="toggleSidebar">
        <svg viewBox="0 0 24 24" width="20" height="20">
          <path
            fill="currentColor"
            d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"
          />
        </svg>
      </button>
    </div>

    <div class="settings-content">
      <div class="settings-section">
        <h3>界面设置</h3>

        <div class="settings-item">
          <label>布局方式</label>
          <button class="action-btn" @click="toggleLayout">
            <svg viewBox="0 0 24 24" width="20" height="20">
              <path
                fill="currentColor"
                d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z"
              />
            </svg>
            <span>{{ isSideBySide ? "左右布局" : "上下布局" }}</span>
          </button>
        </div>

        <div class="settings-item">
          <label>侧边栏位置</label>
          <button class="action-btn" @click="toggleSidebarPosition">
            <svg viewBox="0 0 24 24" width="20" height="20">
              <path
                fill="currentColor"
                d="M4 18h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2H4c-1.1 0-2 .9-2 2v8c0 1.1.9 2 2 2zm0-12h16v8H4V6z"
              />
            </svg>
            <span>{{ sidebarPosition === "right" ? "切换到左侧" : "切换到右侧" }}</span>
          </button>
        </div>

        <div class="settings-item">
          <label>主题设置</label>
          <ThemeToggle />
        </div>
      </div>

      <div class="settings-section">
        <h3>数据管理</h3>

        <div class="settings-item">
          <button class="action-btn" @click="exportConfig">
            <svg viewBox="0 0 24 24" width="20" height="20">
              <path
                fill="currentColor"
                d="M19 12v7H5v-7H3v7c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2v-7h-2zm-6 .67l2.59-2.58L17 11.5l-5 5-5-5 1.41-1.41L11 12.67V3h2v9.67z"
              />
            </svg>
            <span>导出配置</span>
          </button>
        </div>

        <div class="settings-item">
          <button class="action-btn" @click="importConfig">
            <svg viewBox="0 0 24 24" width="20" height="20">
              <path fill="currentColor" d="M9 16h6v-6h4l-7-7-7 7h4zm-4 2h14v2H5z" />
            </svg>
            <span>导入配置</span>
          </button>
        </div>

        <div class="settings-item">
          <button class="action-btn" @click="clearCache">
            <svg viewBox="0 0 24 24" width="20" height="20">
              <path
                fill="currentColor"
                d="M15 16h4v2h-4zm0-8h7v2h-7zm0 4h6v2h-6zM3 18c0 1.1.9 2 2 2h6c1.1 0 2-.9 2-2V8H3v10zm2-8h6v8H5v-8zm5-6H6L5 5H2v2h12V5h-3z"
              />
            </svg>
            <span>清除缓存</span>
          </button>
        </div>
      </div>

      <div class="settings-section">
        <h3>其他</h3>

        <div class="settings-item">
          <button class="action-btn" @click="refreshPage">
            <svg viewBox="0 0 24 24" width="20" height="20">
              <path
                fill="currentColor"
                d="M17.65 6.35C16.2 4.9 14.21 4 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 12h7V5l-2.35 1.35z"
              />
            </svg>
            <span>刷新页面</span>
          </button>
        </div>

        <div class="settings-item">
          <label>版本</label>
          <span class="version-text">{{ appVersion }}</span>
        </div>

        <div class="settings-item">
          <a :href="GITHUB_REPO_URL" target="_blank" class="github-link">
            <svg viewBox="0 0 24 24" width="20" height="20">
              <path
                fill="currentColor"
                d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"
              />
            </svg>
            <span>GitHub</span>
          </a>
        </div>
      </div>
    </div>
  </div>

  <!-- 更新日志模态框 -->
  <ChangelogModal
    :visible="showChangelogModal"
    :current-version="appVersion"
    @close="showChangelogModal = false"
  />
</template>

<style scoped>
/* 设置按钮样式 */
.settings-toggle-btn {
  position: fixed;
  z-index: 1000;
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background-color: var(--primary-color);
  color: white;
  border: none;
  box-shadow: var(--shadow-md);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s ease;
}

.settings-toggle-btn:hover {
  transform: rotate(30deg);
  background-color: var(--accent-color);
}

/* 动态设置按钮位置 */
.settings-toggle-btn {
  top: 20px;
  right: 20px;
}

/* 侧边栏基础样式 */
.settings-sidebar {
  position: fixed;
  top: 0;
  width: 300px;
  height: 100vh;
  background-color: var(--background-primary);
  box-shadow: var(--shadow-lg);
  z-index: 1001;
  display: flex;
  flex-direction: column;
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  overflow-y: auto;
}

/* 侧边栏位置 */
.sidebar-right {
  right: 0;
  transform: translateX(100%);
}

.sidebar-left {
  left: 0;
  transform: translateX(-100%);
}

/* 侧边栏可见状态 */
.settings-sidebar.visible {
  transform: translateX(0);
}

/* 侧边栏头部 */
.settings-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 15px 20px;
  border-bottom: 1px solid var(--border-color);
}

.settings-header h2 {
  margin: 0;
  font-size: 1.2rem;
  color: var(--text-primary);
}

.close-btn {
  background: none;
  border: none;
  color: var(--text-secondary);
  cursor: pointer;
  width: 30px;
  height: 30px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

.close-btn:hover {
  background-color: var(--background-tertiary);
  color: var(--text-primary);
}

/* 设置内容 */
.settings-content {
  flex: 1;
  padding: 15px;
  overflow-y: auto;
  position: relative;
  overflow-x: visible;
}

.settings-section {
  margin-bottom: 25px;
  position: relative;
}

.settings-section h3 {
  font-size: 1rem;
  margin: 0 0 15px 0;
  padding-bottom: 8px;
  border-bottom: 1px solid var(--border-color);
  color: var(--text-primary);
}

.settings-item {
  margin-bottom: 15px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  position: relative;
  overflow: visible;
}

.settings-item label {
  font-size: 0.9rem;
  color: var(--text-secondary);
}

/* 按钮样式 */
.action-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background-color: var(--background-secondary);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  color: var(--text-primary);
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

.action-btn:hover {
  background-color: var(--background-tertiary);
  border-color: var(--primary-color);
}

.action-btn svg {
  flex-shrink: 0;
}

/* 版本号样式 */
.version-text {
  font-size: 0.9rem;
  color: var(--text-secondary);
  padding: 4px 8px;
  background-color: var(--background-tertiary);
  border-radius: var(--radius-md);
}

/* GitHub链接样式 */
.github-link {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background-color: var(--background-secondary);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  color: var(--text-primary);
  font-size: 0.9rem;
  text-decoration: none;
  transition: all 0.2s ease;
  width: 100%;
}

.github-link:hover {
  background-color: var(--background-tertiary);
  border-color: var(--accent-color);
  color: var(--accent-color);
}

/* 提示信息样式 */
:global(.app-copy-toast) {
  position: fixed;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%) translateY(100px);
  background-color: var(--background-secondary);
  color: var(--text-primary);
  padding: 10px 20px;
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-lg);
  z-index: 1010;
  opacity: 0;
  transition: transform 0.3s ease, opacity 0.3s ease;
}

:global(.app-copy-toast.show) {
  transform: translateX(-50%) translateY(0);
  opacity: 1;
}

:global(.toast-success) {
  background-color: rgba(var(--success-rgb), 0.9);
  color: white;
}

:global(.toast-error) {
  background-color: rgba(var(--danger-rgb), 0.9);
  color: white;
}

:global(.toast-info) {
  background-color: rgba(var(--primary-rgb), 0.9);
  color: white;
}

/* 主题设置菜单相关样式 */
.settings-item .theme-toggle {
  position: static;
}
</style>
