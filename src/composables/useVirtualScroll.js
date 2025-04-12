import { ref, computed, onMounted, onUnmounted } from 'vue';

/**
 * 虚拟滚动组合式函数
 * 用于优化大型字体列表的显示性能
 */
export function useVirtualScroll(listData, options = {}) {
    // 默认配置
    const defaultOptions = {
        itemHeight: 40, // 每项的高度，单位像素
        overscan: 5,    // 视口之外额外渲染的项数
        visibleItems: 20 // 可见项数量
    };

    // 合并选项
    const opts = { ...defaultOptions, ...options };

    // 滚动容器引用
    const containerRef = ref(null);
    // 当前滚动位置
    const scrollTop = ref(0);
    // 可视区域高度
    const viewportHeight = ref(window.innerHeight);

    // 计算开始索引
    const startIndex = computed(() => {
        return Math.max(0, Math.floor(scrollTop.value / opts.itemHeight) - opts.overscan);
    });

    // 计算结束索引
    const endIndex = computed(() => {
        return Math.min(
            listData.value?.length || 0,
            Math.ceil((scrollTop.value + viewportHeight.value) / opts.itemHeight) + opts.overscan
        );
    });

    // 计算可见项
    const visibleItems = computed(() => {
        if (!listData.value?.length) return [];
        return listData.value.slice(startIndex.value, endIndex.value).map((item, index) => {
            return {
                ...item,
                __index: startIndex.value + index,
                __style: {
                    position: 'absolute',
                    top: `${(startIndex.value + index) * opts.itemHeight}px`,
                    height: `${opts.itemHeight}px`,
                    width: '100%'
                }
            };
        });
    });

    // 计算占位容器高度
    const wrapperHeight = computed(() => {
        return `${(listData.value?.length || 0) * opts.itemHeight}px`;
    });

    // 滚动处理函数
    const handleScroll = (event) => {
        scrollTop.value = event.target.scrollTop;
    };

    // 窗口大小改变处理函数
    const handleResize = () => {
        if (containerRef.value) {
            viewportHeight.value = containerRef.value.clientHeight;
        }
    };

    // 滚动到特定索引
    const scrollToIndex = (index) => {
        if (containerRef.value) {
            containerRef.value.scrollTop = index * opts.itemHeight;
        }
    };

    // 滚动到特定字体
    const scrollToFont = (fontName) => {
        if (!listData.value?.length) return;

        const index = listData.value.findIndex(item => item.name === fontName);
        if (index !== -1) {
            scrollToIndex(index);
        }
    };

    // 监听DOM相关事件
    onMounted(() => {
        if (containerRef.value) {
            containerRef.value.addEventListener('scroll', handleScroll);
            viewportHeight.value = containerRef.value.clientHeight;
        }
        window.addEventListener('resize', handleResize);
    });

    // 清理事件监听
    onUnmounted(() => {
        if (containerRef.value) {
            containerRef.value.removeEventListener('scroll', handleScroll);
        }
        window.removeEventListener('resize', handleResize);
    });

    return {
        containerRef,
        visibleItems,
        wrapperStyle: {
            position: 'relative',
            height: wrapperHeight.value,
            width: '100%'
        },
        scrollToIndex,
        scrollToFont
    };
} 