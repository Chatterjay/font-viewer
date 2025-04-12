<script setup>
import { ref, onMounted, onUnmounted, inject, computed } from "vue";

// 注入布局状态和方法
const isSideBySide = inject("isSideBySide");
const toggleLayout = inject("toggleLayout");

// 右键菜单状态 - 使用独立的ref而不是嵌套在对象中
const menuVisible = ref(false);
const menuIsClosing = ref(false);
const menuX = ref(0);
const menuY = ref(0);
const showScrollTop = ref(false);

// 使用防抖函数优化滚动检测
const debounce = (fn, delay) => {
  let timer = null;
  return function (...args) {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => {
      fn.apply(this, args);
      timer = null;
    }, delay);
  };
};

// 检查是否需要显示回到顶部
const checkScrollPosition = () => {
  const fontList = document.querySelector(".font-list-container");
  const targetElement = document.elementFromPoint(menuX.value, menuY.value);

  if (fontList && fontList.contains(targetElement)) {
    // 在字体列表中，检查字体列表的滚动位置
    showScrollTop.value = fontList.scrollTop > 100;
  } else {
    // 在其他区域，检查页面的滚动位置
    showScrollTop.value = window.scrollY > 100;
  }
};

// 阻止默认右键菜单 - 使用事件委托优化性能
const handleContextMenu = (e) => {
  e.preventDefault();
  menuIsClosing.value = false;
  menuVisible.value = true;

  // 获取实际菜单尺寸和可视区域
  const viewportHeight = window.innerHeight;
  const viewportWidth = window.innerWidth;
  
  // 初始化菜单位置为点击位置
  let x = e.clientX;
  let y = e.clientY;
  
  // 先显示菜单，再进行位置调整
  menuX.value = x;
  menuY.value = y;
  
  // 使用setTimeout确保DOM更新后再获取菜单尺寸
  setTimeout(() => {
    const menu = document.querySelector('.context-menu');
    if (!menu) return;
    
    const menuWidth = menu.offsetWidth;
    const menuHeight = menu.offsetHeight;
    
    // 右侧空间不足时，向左显示
    if (x + menuWidth > viewportWidth) {
      x = Math.max(0, viewportWidth - menuWidth - 5);
    }
    
    // 底部空间不足时，向上显示
    if (y + menuHeight > viewportHeight) {
      y = Math.max(0, y - menuHeight);
    }
    
    // 更新菜单位置
    menuX.value = x;
    menuY.value = y;
  }, 0);

  // 检查是否需要显示回到顶部
  checkScrollPosition();
};

// 关闭菜单 - 优化动画结束处理
const closeMenu = () => {
  if (menuVisible.value && !menuIsClosing.value) {
    menuIsClosing.value = true;
    setTimeout(() => {
      menuVisible.value = false;
      menuIsClosing.value = false;
    }, 200);
  }
};

// 检查当前是否有可用的字体名称 - 使用computed优化重复计算
const hasFontName = computed(() => {
  if (!menuVisible.value) return false;

  // 优先检查右键点击处是否在字体卡片内
  const element = document.elementFromPoint(menuX.value, menuY.value);
  if (element?.closest(".font-card")) {
    return true;
  }

  // 其次检查是否在预览区域
  return !!document.querySelector(".font-preview");
});

// 回到顶部 - 增加平滑滚动体验
const scrollToTop = () => {
  const fontList = document.querySelector(".font-list-container");
  const targetElement = document.elementFromPoint(menuX.value, menuY.value);

  // 如果点击位置在字体列表内，滚动字体列表
  if (fontList && fontList.contains(targetElement)) {
    fontList.scrollTo({ top: 0, behavior: "smooth" });
  } else {
    // 否则滚动整个页面
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
  closeMenu();
};

// 修改showToast函数，使其更加可靠和统一化
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

// 导出配置 - 完全重写优化
const exportConfig = async () => {
  try {
    // 准备配置数据
    const config = {
      favorites: JSON.parse(localStorage.getItem("favoriteFonts") || "[]"),
      commercialFonts: JSON.parse(localStorage.getItem("commercialFonts") || "[]"),
      theme: localStorage.getItem("theme") || "system",
      layout: localStorage.getItem("layout") || "vertical",
      version: "1.0.0",
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

  closeMenu();
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

// 导入配置 - 完全重写优化
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

  closeMenu();
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
    if (config.version !== "1.0.0") {
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

// 刷新页面
const refreshPage = () => {
  window.location.reload();
  closeMenu();
};

// 清理缓存 - 优化确认流程
const clearCache = () => {
  closeMenu(); // 先关闭菜单避免UI卡顿

  // 延迟显示确认对话框，确保菜单关闭动画完成
  setTimeout(() => {
    if (confirm("确定要清理所有缓存数据吗？这将清除所有收藏、商用标记和主题设置。")) {
      localStorage.clear();
      window.location.reload();
    }
  }, 250);
};

// 复制字体名称 - 优化选择器性能和提示效果
const copyFontName = () => {
  // 尝试查找当前选中的字体元素
  const fontPreview = document.querySelector(".font-preview");
  const fontNameElement = fontPreview?.querySelector(".font-name");
  const fontCard = document
    .elementFromPoint(menuX.value, menuY.value)
    ?.closest(".font-card");
  const fontCardName = fontCard?.querySelector(".font-name");

  let fontName = "";

  // 优先使用右键点击的字体卡片
  if (fontCardName) {
    fontName = fontCardName.textContent?.trim() || "";
  } else if (fontNameElement) {
    fontName = fontNameElement.textContent?.trim() || "";
  }

  if (fontName) {
    // 使用剪贴板API复制文本
    navigator.clipboard
      .writeText(fontName)
      .then(() => showToast("已复制字体名称: " + fontName, 2000, "success"))
      .catch((err) => {
        console.error("复制失败:", err);
        showToast("复制失败，请重试", 3000, "error");
      });
  }

  closeMenu();
};

// 生命周期钩子和事件监听优化
onMounted(() => {
  // 使用捕获阶段来确保我们的处理程序最先执行
  document.addEventListener("contextmenu", handleContextMenu, {
    capture: true,
    passive: false,
  });
  document.addEventListener("click", closeMenu);

  // 初始化布局
  const savedLayout = localStorage.getItem("layout");
  if (isSideBySide) {
    isSideBySide.value = savedLayout === "horizontal";
  }
});

onUnmounted(() => {
  // 清理事件监听器避免内存泄漏
  document.removeEventListener("contextmenu", handleContextMenu, {
    capture: true,
    passive: false,
  });
  document.removeEventListener("click", closeMenu);
});
</script>

<template>
  <div class="app-actions">
    <!-- 自定义右键菜单 - 使用Teleport确保在DOM顶层 -->
    <teleport to="body">
      <div
        v-if="menuVisible"
        class="context-menu"
        :class="{ closing: menuIsClosing }"
        :style="{ left: menuX + 'px', top: menuY + 'px' }"
      >
        <div class="menu-item" @click="toggleLayout">
          <svg viewBox="0 0 24 24">
            <path
              fill="currentColor"
              d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z"
            />
          </svg>
          {{ isSideBySide ? "切换为上下布局" : "切换为左右布局" }}
        </div>
        <div class="menu-divider"></div>
        <div v-if="hasFontName" class="menu-item" @click="copyFontName">
          <svg viewBox="0 0 24 24">
            <path
              fill="currentColor"
              d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"
            />
          </svg>
          复制字体名称
        </div>
        <div class="menu-divider"></div>
        <div class="menu-item" @click="refreshPage">
          <svg viewBox="0 0 24 24">
            <path
              fill="currentColor"
              d="M17.65 6.35A7.958 7.958 0 0012 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08A5.99 5.99 0 0112 18c-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z"
            />
          </svg>
          刷新页面
        </div>
        <div v-if="showScrollTop" class="menu-item" @click="scrollToTop">
          <svg viewBox="0 0 24 24">
            <path
              fill="currentColor"
              d="M7.41 15.41L12 10.83l4.59 4.58L18 14l-6-6-6 6z"
            />
          </svg>
          回到顶部
        </div>
      </div>
    </teleport>
  </div>
</template>

<style scoped>
.app-actions {
  display: flex;
  gap: var(--spacing-sm);
  margin-right: var(--spacing-md);
}

.action-btn {
  padding: var(--spacing-md);
  border-radius: var(--radius-lg);
  color: var(--text-secondary);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: var(--transition-fast);
  background-color: var(--background-secondary);
  border: 1px solid var(--border-color);
  width: 48px;
  height: 48px;
}

.action-btn:hover {
  color: var(--text-primary);
  background-color: var(--background-tertiary);
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
}

.action-btn svg {
  width: 24px;
  height: 24px;
}
</style>

<!-- 菜单样式，使用全局样式，因为teleport将内容移到body -->
<style>
/* 右键菜单样式 - 性能优化 */
.context-menu {
  position: fixed;
  background-color: var(--background-primary);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-lg);
  padding: var(--spacing-xs) 0;
  min-width: 200px;
  z-index: 9999;
  animation: menuAppear 0.2s ease-out;
  transform-origin: top left;
  max-height: 80vh;
  overflow-y: auto;
  will-change: transform, opacity;
  contain: content; /* 启用内容隔离优化 */
  backface-visibility: hidden; /* 提升GPU加速 */
}

.context-menu.closing {
  animation: menuDisappear 0.2s ease-out forwards;
  pointer-events: none; /* 防止关闭动画中的交互 */
}

@keyframes menuAppear {
  from {
    opacity: 0;
    transform: scale(0.95);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

@keyframes menuDisappear {
  from {
    opacity: 1;
    transform: scale(1);
  }
  to {
    opacity: 0;
    transform: scale(0.95);
  }
}

.menu-item {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-sm) var(--spacing-md);
  color: var(--text-primary);
  cursor: pointer;
  transition: all 0.15s ease-out;
  animation: itemAppear 0.25s ease-out forwards;
  opacity: 0;
  will-change: opacity, transform;
  user-select: none; /* 防止文本选择，提高响应性 */
}

/* 优化动画性能 - 使用更少的延迟间隔 */
.menu-item:nth-child(1) {
  animation-delay: 0.03s;
}
.menu-item:nth-child(2) {
  animation-delay: 0.05s;
}
.menu-item:nth-child(3) {
  animation-delay: 0.07s;
}
.menu-item:nth-child(4) {
  animation-delay: 0.09s;
}
.menu-item:nth-child(5) {
  animation-delay: 0.11s;
}
.menu-item:nth-child(6) {
  animation-delay: 0.13s;
}
.menu-item:nth-child(7) {
  animation-delay: 0.15s;
}
.menu-item:nth-child(8) {
  animation-delay: 0.17s;
}

@keyframes itemAppear {
  from {
    opacity: 0;
    transform: translateX(-8px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

.menu-item:hover {
  background-color: var(--background-tertiary);
  color: var(--primary-color);
  transform: translateX(2px);
}

.menu-item:hover svg {
  color: var(--primary-color);
  transform: scale(1.1);
}

.menu-item svg {
  width: 16px;
  height: 16px;
  color: var(--text-secondary);
  transition: all 0.15s ease-out;
  will-change: transform, color;
  flex-shrink: 0; /* 防止图标被压缩 */
}

.menu-divider {
  height: 1px;
  background-color: var(--border-color);
  margin: var(--spacing-xs) 0;
  animation: dividerAppear 0.3s ease-out forwards;
  transform: scaleX(0);
  will-change: transform;
}

@keyframes dividerAppear {
  from {
    transform: scaleX(0);
  }
  to {
    transform: scaleX(1);
  }
}

/* 移动端优化 */
@media (max-width: 870px) {
  .context-menu {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    top: auto;
    border-radius: var(--radius-lg) var(--radius-lg) 0 0;
    margin: var(--spacing-md);
    max-height: 80vh;
    overflow-y: auto;
    transform-origin: bottom;
    animation: mobileMenuAppear 0.2s ease-out;
    overscroll-behavior: contain; /* 防止内部滚动影响外部 */
  }

  .context-menu.closing {
    animation: mobileMenuDisappear 0.2s ease-out forwards;
  }

  @keyframes mobileMenuAppear {
    from {
      opacity: 0;
      transform: translateY(30px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  @keyframes mobileMenuDisappear {
    from {
      opacity: 1;
      transform: translateY(0);
    }
    to {
      opacity: 0;
      transform: translateY(30px);
    }
  }

  /* 移动端菜单项加大触控区域 */
  .menu-item {
    padding: var(--spacing-md) var(--spacing-md);
  }
}

/* 全局样式 - 复制提示优化 */
.app-copy-toast {
  position: fixed;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%) translateY(20px);
  background-color: var(--primary-color);
  color: white;
  padding: 10px 16px;
  border-radius: 4px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  z-index: 10000;
  opacity: 0;
  transition: all 0.2s ease-out;
  will-change: transform, opacity;
  pointer-events: none; /* 防止干扰用户交互 */
  max-width: 90%; /* 限制最大宽度 */
  white-space: nowrap; /* 避免文本换行 */
  overflow: hidden; /* 隐藏过长内容 */
  text-overflow: ellipsis; /* 显示省略号 */
  backface-visibility: hidden; /* 优化渲染 */
  border-left: 4px solid var(--primary-color);
}

/* 不同类型的toast样式 */
.toast-success {
  background-color: rgba(16, 185, 129, 0.9); /* 成功绿色 */
  border-left-color: rgb(16, 185, 129);
}

.toast-error {
  background-color: rgba(239, 68, 68, 0.9); /* 错误红色 */
  border-left-color: rgb(239, 68, 68);
}

.toast-info {
  background-color: rgba(59, 130, 246, 0.9); /* 信息蓝色 */
  border-left-color: rgb(59, 130, 246);
}

.app-copy-toast.show {
  transform: translateX(-50%) translateY(0);
  opacity: 1;
}

/* 针对低性能设备的优化 - 这些设备可能不支持复杂动画 */
@media (prefers-reduced-motion: reduce) {
  .context-menu,
  .context-menu.closing,
  .menu-item,
  .menu-divider {
    animation: none !important;
    transition: opacity 0.1s linear !important;
    will-change: auto !important; /* 在低性能设备上禁用动画优化 */
  }

  .context-menu {
    transform: scale(1) !important;
  }

  .menu-item {
    opacity: 1 !important;
    transform: none !important;
  }

  .menu-divider {
    transform: scaleX(1) !important;
  }

  .app-copy-toast {
    transform: translateX(-50%) !important;
    transition: opacity 0.1s linear !important;
  }

  .app-copy-toast.show {
    transform: translateX(-50%) !important;
  }
}
</style>
