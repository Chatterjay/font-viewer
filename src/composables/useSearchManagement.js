import { ref } from 'vue';

/**
 * 搜索管理组合式函数
 * 提取自App.vue，集中管理搜索相关的逻辑
 */
export function useSearchManagement() {
    // 搜索查询
    const searchQuery = ref("");

    // 处理搜索
    const handleSearch = (query) => {
        searchQuery.value = query;
    };

    // 清除搜索
    const clearSearchQuery = () => {
        // 先设置为空字符串
        searchQuery.value = "";

        // 使用微任务优化DOM操作
        setTimeout(() => {
            // 通过触发搜索框自身的清除功能
            const clearButton = document.querySelector(".search-input-wrapper .clear-btn");
            if (clearButton) {
                // 直接点击清除按钮
                clearButton.click();
            } else {
                // 找不到清除按钮时，手动触发输入事件
                const searchInput = document.querySelector(".search-input");
                if (searchInput) {
                    // 确保搜索框值被更新
                    searchInput.value = "";
                    searchInput.dispatchEvent(new Event("input", { bubbles: true }));
                }
            }

            // 确保FontList组件收到空查询
            document.dispatchEvent(new CustomEvent("search-cleared"));
        }, 0);
    };

    return {
        searchQuery,
        handleSearch,
        clearSearchQuery
    };
} 