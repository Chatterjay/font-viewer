import { ref } from 'vue';

/**
 * 标签页管理组合式函数
 * 提取自App.vue，集中管理标签页相关的逻辑
 */
export function useTabManagement() {
    // 当前激活的标签页
    const activeTab = ref("all");

    // 切换标签页
    const switchTab = (tab, selectedFont = null) => {
        activeTab.value = tab;

        // 如果有选中的字体，切换标签页后触发字体定位
        if (selectedFont) {
            // 使用微任务确保DOM已更新后再滚动到对应字体
            setTimeout(() => {
                const event = new CustomEvent("locateFontInList", {
                    detail: { fontName: selectedFont },
                });
                document.dispatchEvent(event);
            }, 200);
        }
    };

    return {
        activeTab,
        switchTab
    };
} 