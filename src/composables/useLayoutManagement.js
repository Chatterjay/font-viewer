import { ref, computed } from 'vue';
import { saveToStorage, getFromStorage } from "../utils/storage";
import { STORAGE_KEYS, LAYOUT_MODES } from "../constants";

/**
 * 布局管理组合式函数
 * 提取自App.vue，集中管理布局相关的逻辑
 */
export function useLayoutManagement() {
    // 页面显示模式
    const currentPage = ref("horizontal"); // 默认使用左右布局模式

    // 布局模式
    const isSideBySide = computed(() => currentPage.value === "horizontal");

    // 切换页面模式
    const switchPageMode = (mode) => {
        currentPage.value = mode;
        savePageMode();

        // 更新HTML元素的类名，以便应用不同的滚动行为
        const htmlEl = document.documentElement;
        if (mode === "vertical") {
            htmlEl.classList.add("vertical-layout-mode");
        } else {
            htmlEl.classList.remove("vertical-layout-mode");
        }
    };

    // 从localStorage加载页面模式
    const loadPageMode = () => {
        const savedMode = getFromStorage(STORAGE_KEYS.PAGE_MODE, "horizontal");
        currentPage.value = savedMode;

        // 立即应用布局类
        const htmlEl = document.documentElement;
        if (currentPage.value === "vertical") {
            htmlEl.classList.add("vertical-layout-mode");
        } else {
            htmlEl.classList.remove("vertical-layout-mode");
        }
    };

    // 保存页面模式到localStorage
    const savePageMode = () => {
        saveToStorage(STORAGE_KEYS.PAGE_MODE, currentPage.value);
    };

    // 从localStorage加载布局状态（旧的兼容性方法）
    const loadLayout = () => {
        const savedLayout = getFromStorage(STORAGE_KEYS.LAYOUT);
        // 仅用于兼容旧版本的数据，新版本不使用此设置
        if (savedLayout === LAYOUT_MODES.HORIZONTAL) {
            currentPage.value = "horizontal";
        } else if (savedLayout === LAYOUT_MODES.VERTICAL) {
            currentPage.value = "vertical";
        }
        savePageMode(); // 保存到新的存储键中
    };

    // 保存布局状态到localStorage（旧的兼容性方法）
    const saveLayout = () => {
        // 为了兼容性保留此方法，但将数据转存到新的PAGE_MODE中
        saveToStorage(
            STORAGE_KEYS.LAYOUT,
            isSideBySide.value ? LAYOUT_MODES.HORIZONTAL : LAYOUT_MODES.VERTICAL
        );
        savePageMode();
    };

    // 切换布局模式 - 兼容旧版本代码
    const toggleLayout = () => {
        currentPage.value = currentPage.value === "horizontal" ? "vertical" : "horizontal";
        savePageMode();
        saveLayout(); // 同时保存旧版本数据
    };

    return {
        currentPage,
        isSideBySide,
        switchPageMode,
        loadPageMode,
        savePageMode,
        loadLayout,
        saveLayout,
        toggleLayout
    };
} 