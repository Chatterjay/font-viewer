<script setup>
import { ref, provide, onMounted, computed, watch, reactive, nextTick } from "vue";
import FontList from "./components/FontList.vue";
import FontPreview from "./components/FontPreview.vue";
import FavoriteList from "./components/FavoriteList.vue";
import SearchBar from "./components/SearchBar.vue";
import ThemeToggle from "./components/ThemeToggle.vue";
import SettingsSidebar from "./components/SettingsSidebar.vue";
import AppActions from "./components/AppActions.vue";
import { saveToStorage, getFromStorage } from "./utils/storage";
import { STORAGE_KEYS, LAYOUT_MODES, APP_INFO } from "./constants/index.js";
import { invoke } from "@tauri-apps/api/tauri";
import BatchSelectableFontList from "./components/BatchSelectableFontList.vue";
import { useRouter } from "vue-router";

// 导入组合式函数
import { useFontManagement } from "./composables/useFontManagement";
import { useLayoutManagement } from "./composables/useLayoutManagement";
import { useSearchManagement } from "./composables/useSearchManagement";
import { useTabManagement } from "./composables/useTabManagement";

// 检测字体兼容性
const checkFontCompatibility = () => {
  // 检测字符是否在字体中正确显示
  const testFallbackFont = () => {
    const appLogo = document.querySelector(".app-logo");
    if (appLogo) {
      // 添加回退字体确保显示
      appLogo.style.fontFamily = "'Microsoft YaHei', 'SimHei', sans-serif";
    }
  };

  // DOM加载完成后执行
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", testFallbackFont);
  } else {
    testFallbackFont();
  }
};

// 使用组合式函数
const {
  fonts,
  loading,
  selectedFont,
  favorites,
  commercialFonts,
  commercialCount,
  loadFavorites,
  loadCommercialFonts,
  toggleFavorite,
  toggleCommercial,
  batchRemoveFavorites,
  batchRemoveCommercial,
  removeFavorite,
  handleSelectFont,
  getSystemFonts,
} = useFontManagement();

const {
  currentPage,
  isSideBySide,
  switchPageMode,
  loadPageMode,
  loadLayout,
  toggleLayout,
} = useLayoutManagement();

const { searchQuery, handleSearch, clearSearchQuery } = useSearchManagement();

const { activeTab, switchTab } = useTabManagement();

// 处理字体选择并切换标签页
const selectFontAndSwitchTab = (fontName) => {
  handleSelectFont(fontName);

  // 如果不在预览标签页，切换到预览标签页以便查看字体
  if (activeTab.value !== "preview") {
    switchTab("preview", fontName);
  }
};

// 为组件提供共享数据
provide("fonts", fonts);
provide("loading", loading);
provide("favorites", favorites);
provide("commercialFonts", commercialFonts);
provide("selectedFont", selectedFont);
provide("searchQuery", searchQuery);
provide("currentPage", currentPage);
provide("activeTab", activeTab);
provide("isSideBySide", isSideBySide);
provide("toggleLayout", toggleLayout);

// 监听选中字体的变化
watch(selectedFont, (newFont) => {
  if (newFont && activeTab.value !== "preview") {
    switchTab("preview");
  }
});

// 页面加载时执行的操作
onMounted(async () => {
  // 加载用户偏好设置
  loadPageMode();
  loadLayout();
  loadFavorites();
  loadCommercialFonts();

  // 检测字体兼容性
  checkFontCompatibility();

  // 获取系统字体
  await getSystemFonts();
});

// 应用版本信息
const appVersion = computed(() => APP_INFO.VERSION);
const router = useRouter();
</script>

<template>
  <div
    class="app-container"
    :class="{
      'horizontal-layout': currentPage === 'horizontal',
      'vertical-layout': currentPage === 'vertical',
    }"
  >
    <!-- 设置侧边栏组件 -->
    <SettingsSidebar />

    <!-- 使用路由视图 -->
    <router-view v-slot="{ Component }">
      <transition name="fade" mode="out-in">
        <component :is="Component" />
      </transition>
    </router-view>

    <!-- 主页内容 -->
    <div class="main-content" v-if="$route.path === '/'">
      <header class="app-header">
        <h1>系统字体查看器</h1>
        <div class="search-actions-container">
          <SearchBar @search="handleSearch" class="search-component" />
          <AppActions />
        </div>
      </header>

      <!-- 使用transition组件添加过渡动画 -->
      <transition name="layout-fade" mode="out-in">
        <!-- 水平布局页面 -->
        <main
          v-if="currentPage === 'horizontal'"
          key="horizontal"
          class="app-content horizontal-layout"
        >
          <div class="panels-container horizontal">
            <div class="left-panel">
              <div class="app-font-list-wrapper">
                <FontList
                  :fonts="fonts"
                  :search-query="searchQuery"
                  :is-side-by-side="true"
                  :current-font="selectedFont"
                  @select-font="selectFontAndSwitchTab"
                  @clear-search="clearSearchQuery"
                  @toggle-favorite="toggleFavorite"
                  @toggle-commercial="toggleCommercial"
                />
              </div>
            </div>

            <div class="right-panel">
              <div class="tabs-container">
                <div class="tabs-header">
                  <button
                    class="tab-btn"
                    :class="{ active: activeTab === 'preview' }"
                    @click="switchTab('preview')"
                  >
                    <svg viewBox="0 0 24 24" width="16" height="16">
                      <path
                        fill="currentColor"
                        d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"
                      />
                    </svg>
                    字体预览
                  </button>
                  <button
                    class="tab-btn"
                    :class="{ active: activeTab === 'favorites' }"
                    @click="switchTab('favorites')"
                  >
                    <svg viewBox="0 0 24 24" width="16" height="16">
                      <path
                        fill="currentColor"
                        d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"
                      />
                    </svg>
                    收藏字体
                    <span class="badge" v-if="favorites.length > 0">{{
                      favorites.length
                    }}</span>
                  </button>
                  <button
                    class="tab-btn"
                    :class="{ active: activeTab === 'commercial' }"
                    @click="switchTab('commercial')"
                  >
                    <svg viewBox="0 0 24 24" width="16" height="16">
                      <path
                        fill="currentColor"
                        d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"
                      />
                    </svg>
                    商用字体
                    <span class="badge" v-if="commercialCount > 0">{{
                      commercialCount
                    }}</span>
                  </button>
                </div>

                <div class="tab-content">
                  <div v-if="activeTab === 'preview'" class="tab-pane">
                    <FontPreview
                      :selected-font="selectedFont"
                      :is-favorite="favorites.includes(selectedFont)"
                      :is-commercial="commercialFonts.has(selectedFont)"
                      @toggle-favorite="toggleFavorite"
                      @toggle-commercial="toggleCommercial"
                    />
                  </div>

                  <div v-if="activeTab === 'favorites'" class="tab-pane">
                    <BatchSelectableFontList
                      :fonts="favorites"
                      :current-font="selectedFont"
                      type="favorites"
                      @select-font="selectFontAndSwitchTab"
                      @remove-font="removeFavorite"
                      @batch-remove="batchRemoveFavorites"
                    />
                  </div>

                  <div v-if="activeTab === 'commercial'" class="tab-pane">
                    <BatchSelectableFontList
                      :fonts="Array.from(commercialFonts)"
                      :current-font="selectedFont"
                      type="commercial"
                      @select-font="selectFontAndSwitchTab"
                      @remove-font="toggleCommercial"
                      @batch-remove="batchRemoveCommercial"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>

        <!-- 垂直布局页面 -->
        <main v-else key="vertical" class="app-content vertical-layout">
          <div class="panels-container vertical">
            <div class="top-panel">
              <div class="app-font-list-wrapper">
                <FontList
                  :fonts="fonts"
                  :search-query="searchQuery"
                  :is-side-by-side="false"
                  :current-font="selectedFont"
                  @select-font="selectFontAndSwitchTab"
                  @clear-search="clearSearchQuery"
                  @toggle-favorite="toggleFavorite"
                  @toggle-commercial="toggleCommercial"
                />
              </div>
            </div>

            <div class="bottom-panel">
              <div class="tabs-container">
                <div class="tabs-header">
                  <button
                    class="tab-btn"
                    :class="{ active: activeTab === 'preview' }"
                    @click="switchTab('preview')"
                  >
                    <svg viewBox="0 0 24 24" width="16" height="16">
                      <path
                        fill="currentColor"
                        d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"
                      />
                    </svg>
                    字体预览
                  </button>
                  <button
                    class="tab-btn"
                    :class="{ active: activeTab === 'favorites' }"
                    @click="switchTab('favorites')"
                  >
                    <svg viewBox="0 0 24 24" width="16" height="16">
                      <path
                        fill="currentColor"
                        d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"
                      />
                    </svg>
                    收藏字体
                    <span class="badge" v-if="favorites.length > 0">{{
                      favorites.length
                    }}</span>
                  </button>
                  <button
                    class="tab-btn"
                    :class="{ active: activeTab === 'commercial' }"
                    @click="switchTab('commercial')"
                  >
                    <svg viewBox="0 0 24 24" width="16" height="16">
                      <path
                        fill="currentColor"
                        d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"
                      />
                    </svg>
                    商用字体
                    <span class="badge" v-if="commercialCount > 0">{{
                      commercialCount
                    }}</span>
                  </button>
                </div>

                <div class="tab-content">
                  <div v-if="activeTab === 'preview'" class="tab-pane">
                    <FontPreview
                      :selected-font="selectedFont"
                      :is-favorite="favorites.includes(selectedFont)"
                      :is-commercial="commercialFonts.has(selectedFont)"
                      @toggle-favorite="toggleFavorite"
                      @toggle-commercial="toggleCommercial"
                    />
                  </div>

                  <div v-if="activeTab === 'favorites'" class="tab-pane">
                    <BatchSelectableFontList
                      :fonts="favorites"
                      :current-font="selectedFont"
                      type="favorites"
                      @select-font="selectFontAndSwitchTab"
                      @remove-font="removeFavorite"
                      @batch-remove="batchRemoveFavorites"
                    />
                  </div>

                  <div v-if="activeTab === 'commercial'" class="tab-pane">
                    <BatchSelectableFontList
                      :fonts="Array.from(commercialFonts)"
                      :current-font="selectedFont"
                      type="commercial"
                      @select-font="selectFontAndSwitchTab"
                      @remove-font="toggleCommercial"
                      @batch-remove="batchRemoveCommercial"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </transition>
    </div>
  </div>
</template>

<style>
@import "./styles/variables.css";

body {
  background-color: var(--background-color);
  color: var(--text-primary);
  font-family: var(--font-family-base);
  margin: 0;
  padding: 0;
  line-height: 1.6;
  transition: background-color var(--transition-normal), color var(--transition-normal);
}

#app {
  margin: 0;
  padding: 0;
  width: 100%;
  height: 100%;
  overflow: hidden;
}

/* 标签页默认选中动画 */
.tab-btn.active {
  position: relative;
  overflow: hidden;
}

.tab-btn.active::after {
  content: "";
  position: absolute;
  left: 0;
  bottom: 0;
  height: 3px;
  width: 100%;
  background: linear-gradient(to right, var(--primary-color), var(--accent-color));
  animation: tabIndicatorAppear 0.5s ease forwards;
}

/* 初始聚焦效果 */
.tab-btn.initial-focus {
  box-shadow: 0 0 0 2px rgba(var(--primary-rgb), 0.3);
  animation: tabPulse 0.8s ease;
}

@keyframes tabPulse {
  0% {
    box-shadow: 0 0 0 0 rgba(var(--primary-rgb), 0.3);
  }
  50% {
    box-shadow: 0 0 0 4px rgba(var(--primary-rgb), 0.3);
  }
  100% {
    box-shadow: 0 0 0 0 rgba(var(--primary-rgb), 0.3);
  }
}

@keyframes tabIndicatorAppear {
  from {
    transform: translateX(-100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

/* 标签内容切换动画 */
.tab-pane {
  animation: tabContentAppear 0.4s ease-out;
}

@keyframes tabContentAppear {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

:root {
  --font-family-base: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto,
    "Helvetica Neue", Arial, "Noto Sans", sans-serif, "Apple Color Emoji",
    "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji", "Microsoft YaHei", "SimHei";

  /* 其他CSS变量 */
}

/* 确保特定字符的兼容性 */
.compatibility-fix {
  font-family: var(--font-family-base) !important;
}
</style>

<style scoped>
.app-container {
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden; /* 默认防止容器溢出 */
}

/* 垂直布局时允许滚动 */
.app-container.vertical-layout {
  overflow-y: auto; /* 垂直布局时允许滚动 */
}

.main-content {
  flex: 1;
  padding: var(--spacing-lg);
  max-width: 100%;
  width: 100%;
}

/* 垂直布局时允许内容滚动 */
.vertical-layout .main-content {
  overflow-y: visible; /* 允许垂直滚动 */
}

/* 水平布局时防止内容溢出 */
.horizontal-layout .main-content {
  overflow: hidden;
}

.app-header {
  margin-bottom: var(--spacing-md);
  padding-top: var(--spacing-md);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-md);
}

.app-header h1 {
  font-size: 2rem;
  font-weight: 700;
  margin: 0;
  background: linear-gradient(135deg, var(--primary-color), var(--accent-color));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.search-actions-container {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  gap: var(--spacing-md);
}

.search-component {
  width: 500px;
  max-width: 100%;
}

/* 布局切换按钮样式 */
.layout-switcher {
  display: flex;
  gap: var(--spacing-xs);
  background-color: var(--background-secondary);
  border-radius: var(--radius-lg);
  padding: var(--spacing-xs);
}

.layout-btn {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  padding: var(--spacing-xs) var(--spacing-sm);
  border-radius: var(--radius-md);
  font-size: 0.85rem;
  color: var(--text-secondary);
  background-color: transparent;
  transition: all 0.2s ease;
}

.layout-btn.active {
  background-color: var(--primary-color);
  color: white;
}

.layout-btn:hover:not(.active) {
  background-color: var(--background-tertiary);
  color: var(--primary-color);
}

.app-content {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg);
  height: calc(100% - 150px); /* 考虑到头部的高度 */
}

/* 垂直布局内容区不限制高度 */
.vertical-layout.app-content {
  height: auto;
  min-height: calc(100% - 150px);
}

/* 水平布局样式 */
.panels-container.horizontal {
  display: flex;
  flex-direction: row;
  gap: var(--spacing-lg);
  transition: all 0.5s ease;
  overflow: hidden;
  height: calc(100vh - 200px);
  align-items: flex-start;
}

.horizontal-layout .left-panel,
.horizontal-layout .right-panel {
  flex: 1;
  border-radius: var(--radius-xl);
  overflow: hidden;
  transition: all 0.5s ease;
  min-height: calc(100vh - 220px);
  max-height: calc(100vh - 220px);
}

/* 垂直布局样式 */
.panels-container.vertical {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg);
  transition: all 0.5s ease;
  overflow: visible; /* 允许内容溢出，使用全局滚动条 */
  height: auto;
  padding-bottom: var(--spacing-xl); /* 增加底部填充，防止内容靠近底部 */
}

.vertical-layout .top-panel,
.vertical-layout .bottom-panel {
  width: 100%;
  border-radius: var(--radius-xl);
  overflow: hidden;
  transition: all 0.5s ease;
}

.vertical-layout .top-panel {
  max-height: 60vh; /* 上方面板可调整高度 */
  min-height: 400px; /* 设置最小高度 */
  margin-bottom: var(--spacing-lg); /* 增加底部边距 */
}

.vertical-layout .bottom-panel {
  flex: 1;
  margin-bottom: var(--spacing-xl); /* 增加底部边距 */
}

/* 布局切换过渡动画 */
.layout-fade-enter-active,
.layout-fade-leave-active {
  transition: opacity 0.3s ease, transform 0.3s ease;
}

.layout-fade-enter-from,
.layout-fade-leave-to {
  opacity: 0;
  transform: translateY(10px);
}

/* 通用面板样式 */
.app-font-list-wrapper {
  background-color: var(--background-primary);
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-md);
  transition: all var(--transition-normal);
  height: 100%;
  display: flex;
  flex-direction: column;
}

.tabs-container {
  background-color: var(--background-primary);
  border-radius: var(--radius-xl);
  overflow: hidden;
  box-shadow: var(--shadow-md);
  transition: all var(--transition-normal);
}

.tabs-header {
  display: flex;
  border-bottom: 1px solid var(--border-color);
  background-color: var(--background-secondary);
}

.tab-btn {
  flex: 1;
  padding: var(--spacing-md);
  background: none;
  border: none;
  color: var(--text-secondary);
  font-size: 0.9rem;
  font-weight: 500;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-xs);
  transition: var(--transition-fast);
  position: relative;
  overflow: hidden;
}

.tab-btn:hover {
  color: var(--primary-color);
  background-color: var(--background-tertiary);
}

.tab-btn.active {
  color: var(--primary-color);
  font-weight: 600;
}

.tab-btn.active::after {
  content: "";
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: linear-gradient(90deg, var(--primary-color), var(--accent-color));
  animation: slideIn 0.3s ease-out;
}

@keyframes slideIn {
  from {
    transform: translateX(-100%);
  }
  to {
    transform: translateX(0);
  }
}

.tab-btn svg {
  width: 18px;
  height: 18px;
}

.badge {
  background-color: var(--primary-color);
  color: white;
  border-radius: 50%;
  width: 18px;
  height: 18px;
  font-size: 0.75rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  margin-left: var(--spacing-xs);
}

/* 水平布局的标签内容 */
.horizontal-layout .tab-content {
  padding: var(--spacing-md);
  max-height: calc(100vh - 300px);
  overflow-y: auto;
}

/* 垂直布局的标签内容 */
.vertical-layout .tab-content {
  padding: var(--spacing-md);
  max-height: calc(50vh - 100px);
  overflow-y: auto;
}

.tab-pane {
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

.section-title {
  font-size: 1.2rem;
  font-weight: 600;
  margin-top: 0;
  margin-bottom: var(--spacing-md);
  color: var(--text-primary);
  padding-bottom: var(--spacing-xs);
  border-bottom: 1px solid var(--border-color);
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--spacing-xl) 0;
  color: var(--text-tertiary);
  text-align: center;
}

.empty-state svg {
  color: var(--text-tertiary);
  opacity: 0.5;
  margin-bottom: var(--spacing-md);
}

.empty-state p {
  margin: var(--spacing-xs) 0;
}

.empty-state .hint {
  font-size: 0.875rem;
  opacity: 0.7;
}

.fonts-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: var(--spacing-md);
}

.font-card {
  position: relative;
  background-color: var(--background-secondary);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-lg);
  padding: var(--spacing-md);
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.font-card:hover {
  transform: translateY(-4px);
  background-color: var(--background-primary);
  border-color: var(--primary-color);
  box-shadow: var(--shadow-md);
}

.font-card-content {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

.font-name {
  font-size: 1rem;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: var(--spacing-xs);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.font-sample {
  font-size: 0.875rem;
  color: var(--text-secondary);
  line-height: 1.3;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.remove-btn {
  position: absolute;
  top: var(--spacing-sm);
  right: var(--spacing-sm);
  opacity: 0;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background-color: var(--background-primary);
  border: 1px solid var(--border-color);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-tertiary);
  transition: all var(--transition-fast);
}

.font-card:hover .remove-btn {
  opacity: 1;
}

.remove-btn:hover {
  background-color: var(--danger-color);
  border-color: var(--danger-color);
  color: white;
  transform: scale(1.1);
}

.remove-btn.commercial:hover {
  background-color: var(--success-color);
  border-color: var(--success-color);
}

.font-card.is-selected {
  background-color: var(--primary-color-10);
  border-color: var(--primary-color);
  box-shadow: 0 0 0 2px var(--primary-color-20);
  transform: translateY(-2px);
}

/* 响应式布局 */
@media (max-width: 1200px) {
  .panels-container.horizontal {
    flex-direction: column;
    height: auto;
  }

  .horizontal-layout .left-panel,
  .horizontal-layout .right-panel {
    max-height: none;
    min-height: auto;
  }

  .horizontal-layout .left-panel {
    margin-bottom: var(--spacing-lg);
  }
}

@media (max-width: 768px) {
  .main-content {
    padding-left: 0;
    padding-right: 0;
  }

  .app-header {
    padding-left: var(--spacing-sm);
    padding-right: var(--spacing-sm);
  }

  .app-header h1 {
    font-size: 1.6rem;
  }

  .search-actions-container {
    flex-direction: column;
  }

  .search-component {
    width: 100%;
  }
}
</style>
