<script setup>
import { ref, onMounted, inject, computed, watch, onUnmounted } from "vue";
import { useVirtualScroll } from "../composables/useVirtualScroll";

const props = defineProps({
  searchQuery: {
    type: String,
    default: "",
  },
  fonts: {
    type: Array,
    default: () => [],
  },
  favorites: {
    type: Array,
    default: () => [],
  },
  commercialFonts: {
    type: Array,
    default: () => [],
  },
  currentFont: {
    type: String,
    default: "",
  },
  isSideBySide: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(["select-font", "clear-search", "toggle-favorite", "toggle-commercial"]);

// 字体列表 - 重命名以避免与props冲突
const fontsList = ref(props.fonts);
const { containerRef, visibleItems, wrapperStyle, scrollToFont } = useVirtualScroll(fontsList, {
  itemHeight: 60,
  overscan: 10
});

// 加载状态
const isLoading = ref(false);
// 搜索状态
const isSearching = ref(false);
// 加载进度 (0-100)
const loadingProgress = ref(0);
// 搜索计时器
const searchTimer = ref(null);
// 错误状态
const error = ref(null);
// 每页加载数量
const PAGE_SIZE = 50; // 增加每页加载数量
// 当前页码
const currentPage = ref(1);
// 是否还有更多字体
const hasMore = ref(true);
// 懒加载阈值 - 当字体数量大于此值时才使用懒加载
const LAZY_LOAD_THRESHOLD = 100;
// 是否使用懒加载
const useLazyLoading = ref(false);
// 从父组件注入收藏相关的数据和方法
const favorites = inject("favorites", ref([]));
// 直接从父组件注入toggleFavorite方法
// const toggleFavorite = inject("toggleFavorite", () => {});
// 商用字体标记
const commercialFonts = inject("commercialFonts", ref(new Set()));
// 字体总数
const totalFonts = ref(0);
// 当前选中的字体粗细
const selectedWeight = ref("normal");
// 批量选择状态
const isBatchMode = ref(false);
const selectedFonts = ref(new Set());
// 每次搜索的数量限制
const SEARCH_BATCH_SIZE = 100;
// 信息面板显示状态
const showInfoPanel = ref(false);
// 是否显示悬浮提示
const showStatsTooltip = ref(false);

// 商用字体计数
const commercialCount = computed(() => commercialFonts.value.size);

// 切换信息面板显示
const toggleInfoPanel = () => {
  showInfoPanel.value = !showInfoPanel.value;
};

// 切换统计数据悬浮提示
const toggleStatsTooltip = () => {
  showStatsTooltip.value = !showStatsTooltip.value;
};

// 常用系统字体列表
const commonFonts = [
  "Arial",
  "Arial Black",
  "Calibri",
  "Cambria",
  "Comic Sans MS",
  "Courier New",
  "Georgia",
  "Helvetica",
  "Impact",
  "Microsoft YaHei",
  "MS Sans Serif",
  "MS Serif",
  "Segoe UI",
  "Tahoma",
  "Times New Roman",
  "Trebuchet MS",
  "Verdana",
  "宋体",
];

// 检查字体是否被收藏
const isFavorite = (fontName) => {
  return Array.isArray(favorites.value) && favorites.value.includes(fontName);
};

// 切换收藏状态
const toggleFavorite = (fontName, event) => {
  // 触发父组件的toggleFavorite方法
  emit("toggle-favorite", fontName);
  
  // 防止事件冒泡，确保只处理点击收藏按钮的事件
  if(event) event.stopPropagation();
};

// 检查字体是否商用
const isCommercial = (fontName) => {
  return commercialFonts.value.has(fontName);
};

// 切换商用标记
const toggleCommercial = (fontName, event) => {
  // 触发父组件的toggleCommercial方法
  emit("toggle-commercial", fontName);
  
  // 防止事件冒泡
  if(event) event.stopPropagation();
};

// 从 localStorage 加载商用字体列表
const loadCommercialFonts = () => {
  const savedFonts = localStorage.getItem("commercialFonts");
  if (savedFonts) {
    commercialFonts.value = new Set(JSON.parse(savedFonts));
  }
};

// 获取系统字体列表
const getSystemFonts = async (page = 1) => {
  try {
    if (page === 1) {
      isLoading.value = true;
      error.value = null;
    }

    // 检查页面是否可见
    if (document.hidden) {
      await new Promise((resolve) => {
        const handleVisibilityChange = () => {
          if (!document.hidden) {
            document.removeEventListener("visibilitychange", handleVisibilityChange);
            resolve();
          }
        };
        document.addEventListener("visibilitychange", handleVisibilityChange);
      });
    }

    // 使用 queryLocalFonts API 获取系统字体列表
    const localFonts = await window.queryLocalFonts();

    // 使用 Set 对象进行去重（按字体族名去重）
    const uniqueFontFamilies = new Set();
    const uniqueFonts = localFonts.filter((font) => {
      // 如果字体族名已存在，则跳过
      if (uniqueFontFamilies.has(font.family)) {
        return false;
      }
      // 否则将字体族名添加到 Set 中并保留该字体
      uniqueFontFamilies.add(font.family);
      return true;
    });

    // 记录去重前后数量
    console.log(
      `字体去重：原始数量 ${localFonts.length}，去重后数量 ${uniqueFonts.length}`
    );

    totalFonts.value = uniqueFonts.length;

    // 确定是否使用懒加载 - 调整阈值
    useLazyLoading.value = uniqueFonts.length > LAZY_LOAD_THRESHOLD;

    // 如果字体数量超过阈值，使用懒加载模式，否则一次性加载所有字体
    if (useLazyLoading.value) {
      console.log(
        `字体数量${uniqueFonts.length}超过阈值${LAZY_LOAD_THRESHOLD}，使用懒加载`
      );

      // 计算当前页应该加载哪些字体
      const startIndex = (page - 1) * PAGE_SIZE;
      const endIndex = startIndex + PAGE_SIZE;
      const fontsToLoad = uniqueFonts.slice(startIndex, endIndex);

      // 检查是否还有更多字体可加载
      hasMore.value = endIndex < uniqueFonts.length;

      // 转换字体对象，保留更多属性
      const fontObjects = fontsToLoad.map((font) => ({
        family: font.family,
        weight: font.weight || "Regular",
        style: font.style || "",
        italic: font.style?.toLowerCase().includes("italic") || false,
        variableAxes: font.variableAxes || [],
        fullName: font.fullName || font.family,
        postscriptName: font.postscriptName || "",
      }));

      // 更新字体列表
      fontsList.value = page === 1 ? fontObjects : [...fontsList.value, ...fontObjects];

      // 更新加载进度
      loadingProgress.value = Math.min(
        100,
        Math.round((endIndex / uniqueFonts.length) * 100)
      );

      console.log(
        `懒加载进度：${loadingProgress.value}%，已加载 ${fontsList.value.length} 个字体`
      );
    } else {
      // 一次性加载所有字体，但使用批次加载以避免UI阻塞
      console.log(
        `字体数量${uniqueFonts.length}未超过阈值${LAZY_LOAD_THRESHOLD}，全部加载`
      );

      // 使用增强的字体对象
      const enhancedFonts = uniqueFonts.map((font) => ({
        family: font.family,
        weight: font.weight || "Regular",
        style: font.style || "",
        italic: font.style?.toLowerCase().includes("italic") || false,
        variableAxes: font.variableAxes || [],
        fullName: font.fullName || font.family,
        postscriptName: font.postscriptName || "",
      }));

      // 分批加载所有字体
      loadAllFontsInBatches(enhancedFonts);

      // 没有更多字体可加载
      hasMore.value = false;
    }

    // 如果是第一页，滚动到顶部
    if (page === 1) {
      const container = document.querySelector(".font-list-scrollable");
      if (container) {
        container.scrollTop = 0;
      }
    }

    // 当完成加载时
    if (page === 1 || !hasMore.value) {
      isLoading.value = false;
    }
  } catch (error) {
    console.error("获取系统字体失败:", error);
    error.value = `加载字体失败: ${error.message || "未知错误"}`;
    isLoading.value = false;
  }
};

// 分批加载所有字体
const loadAllFontsInBatches = (allFonts) => {
  // 已加载的字体数量
  let loadedCount = 0;
  // 批次大小
  const batchSize = 50;

  // 加载单个批次
  const loadBatch = () => {
    const remainingFonts = allFonts.length - loadedCount;
    if (remainingFonts <= 0) return;

    const currentBatchSize = Math.min(batchSize, remainingFonts);
    const batch = allFonts.slice(loadedCount, loadedCount + currentBatchSize);

    // 直接使用已处理过的字体对象，不需要再次转换
    const fontObjects = batch;

    // 更新字体列表
    if (loadedCount === 0) {
      fontsList.value = fontObjects;
    } else {
      fontsList.value = [...fontsList.value, ...fontObjects];
    }

    // 更新计数
    loadedCount += currentBatchSize;

    // 更新加载进度
    loadingProgress.value = Math.round((loadedCount / allFonts.length) * 100);
    console.log(`字体加载进度: ${loadingProgress.value}%`);

    // 如果还有更多字体，继续加载下一批
    if (loadedCount < allFonts.length) {
      setTimeout(loadBatch, 10);
    }
  };

  // 开始加载
  loadBatch();
};

// 加载更多字体
const loadMore = () => {
  if (!hasMore.value || isLoading.value) return;
  console.log("加载更多字体，当前页:", currentPage.value);
  currentPage.value++;
  getSystemFonts(currentPage.value);
};

// 过滤后的字体列表 - 改为计算属性
const filteredFonts = computed(() => {
  // 如果没有搜索关键词或者搜索关键词为空（只包含空格），返回当前加载的所有字体
  if (!props.searchQuery || props.searchQuery.trim() === "") {
    // 如果之前进行过搜索，需要重置字体列表
    if (hasSearched.value) {
      resetAfterSearch();
    }
    return fontsList.value;
  }

  // 搜索关键词
  const query = props.searchQuery.toLowerCase().trim();

  // 标记已经进行过搜索
  hasSearched.value = true;

  // 如果是懒加载模式并且有搜索关键词，触发一次性加载所有字体
  if (useLazyLoading.value && query.length > 0 && hasMore.value) {
    performFullSearch(query);
    // 返回当前已加载的并且匹配的字体
    return fontsList.value.filter((font) => font.family.toLowerCase().includes(query));
  }

  // 普通过滤
  return fontsList.value.filter((font) => font.family.toLowerCase().includes(query));
});

// 是否进行过搜索
const hasSearched = ref(false);

// 搜索后清除搜索关键词时重置字体列表
const resetAfterSearch = () => {
  console.log("重置搜索状态和字体列表...");
  // 重置标记
  hasSearched.value = false;

  // 重新启用懒加载
  hasMore.value = true;

  // 只有当不处于搜索状态时才进行重置
  if (!isSearching.value) {
    // 重置页码
    currentPage.value = 1;

    // 清空字体列表
    fontsList.value = [];

    // 重新加载字体
    getSystemFonts(1);
  }
};

// 完成搜索
const finishSearch = (results) => {
  updateSearchResults(results);
  hasMore.value = false; // 标记为已加载所有匹配项
  console.log(`搜索完成，找到 ${results.length} 个匹配字体`);
  isSearching.value = false;

  // 如果在搜索完成时搜索框已被清空，则立即恢复原始列表
  if (!props.searchQuery || props.searchQuery.trim() === "") {
    resetAfterSearch();
  }
};

// 执行一次完整的搜索（异步）
const performFullSearch = (query) => {
  // 清除之前的计时器
  if (searchTimer.value) {
    clearTimeout(searchTimer.value);
  }

  // 如果搜索字符为空或只包含空格，重置搜索状态
  if (!query || query.trim().length === 0) {
    if (hasSearched.value) {
      resetAfterSearch();
    }
    return;
  }

  // 如果查询字符过少，避免大量搜索
  if (query.length < 2) return;

  // 避免多次触发
  if (isSearching.value) return;

  // 设置防抖
  searchTimer.value = setTimeout(async () => {
    isSearching.value = true;
    console.log("执行完整搜索...");

    try {
      // 获取所有字体
      const allLocalFonts = await window.queryLocalFonts();

      // 对字体进行去重处理
      const uniqueFontFamilies = new Set();
      const uniqueFonts = allLocalFonts.filter((font) => {
        if (uniqueFontFamilies.has(font.family)) {
          return false;
        }
        uniqueFontFamilies.add(font.family);
        return true;
      });

      const totalFontsCount = uniqueFonts.length;

      // 如果在开始搜索后搜索框已被清空，则中止搜索
      if (!props.searchQuery || props.searchQuery.trim() === "") {
        isSearching.value = false;
        resetAfterSearch();
        return;
      }

      // 确认搜索词没有发生变化
      const currentQuery = props.searchQuery.toLowerCase().trim();
      if (currentQuery !== query) {
        console.log("搜索词已变化，中止当前搜索");
        isSearching.value = false;
        if (!currentQuery) {
          resetAfterSearch();
        } else {
          // 使用新的搜索词重新搜索
          performFullSearch(currentQuery);
        }
        return;
      }

      // 为了避免UI卡顿，分批处理搜索结果
      const processBatch = (start, allFonts, foundResults = []) => {
        // 如果已经处理完或搜索词已改变，停止处理
        if (
          start >= allFonts.length ||
          !props.searchQuery ||
          props.searchQuery.trim() === "" ||
          props.searchQuery.toLowerCase().trim() !== query
        ) {
          finishSearch(foundResults);
          return;
        }

        const end = Math.min(start + SEARCH_BATCH_SIZE, allFonts.length);
        const batch = allFonts.slice(start, end);

        // 在当前批次中过滤匹配的字体
        const matchedInBatch = batch
          .filter((font) => font.family.toLowerCase().includes(query))
          .map((font) => ({
            family: font.family,
            weight: font.weight || "Regular",
            style: font.style || "",
            italic: font.style?.toLowerCase().includes("italic") || false,
            variableAxes: font.variableAxes || [],
            fullName: font.fullName || font.family,
            postscriptName: font.postscriptName || "",
          }));

        // 合并结果
        const results = [...foundResults, ...matchedInBatch];

        // 更新进度状态
        const progress = Math.floor((end / totalFontsCount) * 100);
        loadingProgress.value = progress;
        console.log(`搜索进度: ${progress}%`);

        // 每处理一批后，更新界面并继续处理下一批
        requestAnimationFrame(() => {
          // 临时更新结果，提供即时反馈
          updateSearchResults(results);

          // 如果还有未处理的批次，继续处理
          setTimeout(() => {
            // 再次检查搜索是否被清除或改变
            if (
              !props.searchQuery ||
              props.searchQuery.trim() === "" ||
              props.searchQuery.toLowerCase().trim() !== query
            ) {
              finishSearch(results);
              return;
            }
            processBatch(end, allFonts, results);
          }, 10); // 短暂延迟，让UI有机会更新
        });
      };

      // 开始批处理
      processBatch(0, uniqueFonts);
    } catch (err) {
      console.error("搜索出错:", err);
      isSearching.value = false;
    }
  }, 300); // 300ms防抖延迟
};

// 更新搜索结果
const updateSearchResults = (results) => {
  // 使用Map进行更高效的去重，以字体族名为键
  const uniqueFontsMap = new Map();

  // 遍历结果，保留每个字体族名的第一个实例
  results.forEach((font) => {
    if (!uniqueFontsMap.has(font.family)) {
      uniqueFontsMap.set(font.family, font);
    }
  });

  // 转换Map为数组
  const uniqueFonts = Array.from(uniqueFontsMap.values());

  console.log(
    `搜索结果去重：原始数量 ${results.length}，去重后数量 ${uniqueFonts.length}`
  );

  // 更新字体列表
  fontsList.value = uniqueFonts;
};

// 监听滚动事件
const handleScroll = (event) => {
  if (!useLazyLoading.value) return; // 不使用懒加载模式时直接返回

  const container = event.target;
  const scrollBottom =
    container.scrollHeight - container.scrollTop - container.clientHeight;
  // console.log("滚动位置:", scrollBottom);

  if (scrollBottom < 200) {
    console.log("触发加载更多...");
    loadMore();
  }
};

// 切换字体粗细
const toggleFontWeight = (font) => {
  if (selectedWeight.value === "normal") {
    selectedWeight.value = "medium";
  } else {
    selectedWeight.value = "normal";
  }
};

// 检查字体是否支持中等粗细
const hasMediumWeight = (font) => {
  return font.weight === 500;
};

// 选择字体
const selectFont = (fontName) => {
  emit("select-font", fontName);
};

// 切换批量模式
const toggleBatchMode = () => {
  isBatchMode.value = !isBatchMode.value;
  if (!isBatchMode.value) {
    selectedFonts.value.clear();
  }
};

// 选择/取消选择字体
const toggleFontSelection = (fontName) => {
  if (selectedFonts.value.has(fontName)) {
    selectedFonts.value.delete(fontName);
  } else {
    selectedFonts.value.add(fontName);
  }
};

// 批量收藏
const batchFavorite = () => {
  selectedFonts.value.forEach((fontName) => {
    if (!isFavorite(fontName)) {
      emit("toggle-favorite", fontName);
    }
  });
  toggleBatchMode();
};

// 批量取消收藏
const batchUnfavorite = () => {
  selectedFonts.value.forEach((fontName) => {
    if (isFavorite(fontName)) {
      emit("toggle-favorite", fontName);
    }
  });
  toggleBatchMode();
};

// 批量标记商用
const batchCommercial = () => {
  selectedFonts.value.forEach((fontName) => {
    if (!isCommercial(fontName)) {
      toggleCommercial(fontName);
    }
  });
  toggleBatchMode();
};

// 批量取消商用
const batchUncommercial = () => {
  selectedFonts.value.forEach((fontName) => {
    if (isCommercial(fontName)) {
      toggleCommercial(fontName);
    }
  });
  toggleBatchMode();
};

// 清除搜索
const clearSearch = () => {
  // 发出事件通知父组件清除搜索内容
  emit("clear-search");

  // 重置搜索状态和字体列表
  resetAfterSearch();
};

// 滚动到当前选中的字体
const scrollToSelectedFont = (fontName) => {
  if (!fontName) return;

  // 确保DOM已渲染完成
  setTimeout(() => {
    // 查找当前选中的字体元素
    const fontCard = document.querySelector(`.font-card[class*="current-preview"]`);
    if (fontCard) {
      const container = document.querySelector(".font-list-scrollable");
      if (container) {
        // 计算需要滚动的位置，让选中的字体尽量居中显示
        const cardTop = fontCard.offsetTop;
        const containerHeight = container.offsetHeight;
        const scrollTo = cardTop - containerHeight / 2 + fontCard.offsetHeight / 2;

        // 使用平滑滚动效果
        container.scrollTo({
          top: scrollTo,
          behavior: "smooth",
        });
      }
    }
  }, 100);
};

// 监听当前字体变化，自动滚动到该字体
watch(
  () => props.currentFont,
  (newFont) => {
    if (newFont) {
      scrollToSelectedFont(newFont);
    }
  },
  { immediate: true }
);

// 增加拖动选择相关状态
const isDragging = ref(false);
const lastSelectedFont = ref(null);
const dragStartElement = ref(null);

// 处理拖动开始
const handleDragStart = (fontName, event) => {
  if (!isBatchMode.value) return;

  isDragging.value = true;
  dragStartElement.value = event.target.closest(".font-card");
  lastSelectedFont.value = fontName;

  // 如果按住Ctrl键，则不改变当前字体的选择状态
  if (!event.ctrlKey && !event.metaKey) {
    toggleFontSelection(fontName);
  }

  // 防止文本选择
  event.preventDefault();
};

// 处理拖动过程中
const handleDragOver = (fontName, event) => {
  if (!isDragging.value || !isBatchMode.value) return;

  // 如果拖到了新的字体上
  if (lastSelectedFont.value !== fontName) {
    lastSelectedFont.value = fontName;
    toggleFontSelection(fontName);

    // 添加触感反馈（如果浏览器支持）
    if (window.navigator && window.navigator.vibrate) {
      window.navigator.vibrate(50); // 短振动50毫秒
    }
  }

  // 防止文本选择
  event.preventDefault();
};

// 处理拖动结束
const handleDragEnd = () => {
  isDragging.value = false;
  dragStartElement.value = null;
  lastSelectedFont.value = null;
};

// 批量同时添加收藏和商用标记
const batchFavoriteAndCommercial = () => {
  selectedFonts.value.forEach((fontName) => {
    // 添加收藏
    if (!isFavorite(fontName)) {
      toggleFavorite(fontName);
    }

    // 添加商用标记
    if (!isCommercial(fontName)) {
      toggleCommercial(fontName);
    }
  });
  toggleBatchMode();
};

// 批量同时取消收藏和商用标记
const batchRemoveBoth = () => {
  selectedFonts.value.forEach((fontName) => {
    // 取消收藏
    if (isFavorite(fontName)) {
      toggleFavorite(fontName);
    }

    // 取消商用标记
    if (isCommercial(fontName)) {
      toggleCommercial(fontName);
    }
  });
  toggleBatchMode();
};

// 全选功能
const selectAll = () => {
  filteredFonts.value.forEach((font) => {
    selectedFonts.value.add(font.family);
  });
};

// 反选功能
const invertSelection = () => {
  filteredFonts.value.forEach((font) => {
    if (selectedFonts.value.has(font.family)) {
      selectedFonts.value.delete(font.family);
    } else {
      selectedFonts.value.add(font.family);
    }
  });
};

// 区域选择功能变量
const selectionRectangle = ref(null);
const isAreaSelecting = ref(false);
const startPos = ref({ x: 0, y: 0 });
const currentPos = ref({ x: 0, y: 0 });
const fontCardsInArea = ref(new Set());

// 开始区域选择
const startAreaSelection = (event) => {
  if (!isBatchMode.value) return;

  // 如果按住了Shift键，启动区域选择
  if (event.shiftKey) {
    event.preventDefault();

    isAreaSelecting.value = true;

    // 获取鼠标相对于容器的位置
    const container = document.querySelector(".font-list-scrollable");
    const containerRect = container.getBoundingClientRect();
    startPos.value = {
      x: event.clientX - containerRect.left,
      y: event.clientY - containerRect.top + container.scrollTop,
    };
    currentPos.value = { ...startPos.value };

    // 创建选择矩形
    if (!selectionRectangle.value) {
      selectionRectangle.value = document.createElement("div");
      selectionRectangle.value.className = "selection-rectangle";
      container.appendChild(selectionRectangle.value);
    }

    // 更新选择矩形位置
    updateSelectionRectangle();
  }
};

// 更新区域选择
const updateAreaSelection = (event) => {
  if (!isAreaSelecting.value) return;

  event.preventDefault();

  // 获取鼠标当前位置
  const container = document.querySelector(".font-list-scrollable");
  const containerRect = container.getBoundingClientRect();
  currentPos.value = {
    x: event.clientX - containerRect.left,
    y: event.clientY - containerRect.top + container.scrollTop,
  };

  // 更新选择矩形位置和尺寸
  updateSelectionRectangle();

  // 检查哪些字体卡片在选择区域内
  checkFontCardsInArea();
};

// 结束区域选择
const endAreaSelection = () => {
  if (!isAreaSelecting.value) return;

  isAreaSelecting.value = false;

  // 更新选中的字体
  fontCardsInArea.value.forEach((fontName) => {
    toggleFontSelection(fontName);
  });

  // 清空临时集合
  fontCardsInArea.value.clear();

  // 移除选择矩形
  if (selectionRectangle.value && selectionRectangle.value.parentNode) {
    selectionRectangle.value.parentNode.removeChild(selectionRectangle.value);
    selectionRectangle.value = null;
  }
};

// 更新选择矩形的位置和尺寸
const updateSelectionRectangle = () => {
  if (!selectionRectangle.value) return;

  const left = Math.min(startPos.value.x, currentPos.value.x);
  const top = Math.min(startPos.value.y, currentPos.value.y);
  const width = Math.abs(currentPos.value.x - startPos.value.x);
  const height = Math.abs(currentPos.value.y - startPos.value.y);

  selectionRectangle.value.style.left = `${left}px`;
  selectionRectangle.value.style.top = `${top}px`;
  selectionRectangle.value.style.width = `${width}px`;
  selectionRectangle.value.style.height = `${height}px`;
};

// 检查哪些字体卡片在选择区域内
const checkFontCardsInArea = () => {
  // 获取选择区域的边界
  const left = Math.min(startPos.value.x, currentPos.value.x);
  const top = Math.min(startPos.value.y, currentPos.value.y);
  const right = Math.max(startPos.value.x, currentPos.value.x);
  const bottom = Math.max(startPos.value.y, currentPos.value.y);

  // 获取所有字体卡片
  const container = document.querySelector(".font-list-scrollable");
  const fontCards = container.querySelectorAll(".font-card");

  // 清空临时集合
  fontCardsInArea.value.clear();

  // 检查每个字体卡片是否在选择区域内
  fontCards.forEach((card) => {
    const cardRect = card.getBoundingClientRect();
    const containerRect = container.getBoundingClientRect();

    // 计算卡片相对于容器的位置
    const cardLeft = cardRect.left - containerRect.left;
    const cardTop = cardRect.top - containerRect.top + container.scrollTop;
    const cardRight = cardLeft + cardRect.width;
    const cardBottom = cardTop + cardRect.height;

    // 判断是否有交集
    if (!(cardRight < left || cardLeft > right || cardBottom < top || cardTop > bottom)) {
      // 添加到临时集合
      const fontName = card.querySelector(".font-name").textContent.trim();
      fontCardsInArea.value.add(fontName);

      // 添加高亮样式
      card.classList.add("in-selection-area");
    } else {
      // 移除高亮样式
      card.classList.remove("in-selection-area");
    }
  });
};

// 在初始化时加载数据
onMounted(() => {
  loadCommercialFonts();

  // 添加控制台信息，标记组件已经初始化
  console.log("FontList组件已初始化，开始加载系统字体...");

  // 创建事件处理函数引用
  const handleLocateFontEvent = (event) => {
    if (event.detail && event.detail.fontName) {
      scrollToSelectedFont(event.detail.fontName);
    }
  };

  const handleSearchClearedEvent = () => {
    console.log("接收到搜索清除事件");
    if (hasSearched.value) {
      resetAfterSearch();
    }
  };

  // 监听字体定位自定义事件
  document.addEventListener("locateFontInList", handleLocateFontEvent);

  // 添加全局鼠标抬起事件，确保即使鼠标移出元素也能停止拖动
  document.addEventListener("mouseup", handleDragEnd);
  document.addEventListener("touchend", handleDragEnd);

  // 区域选择相关事件
  const container = document.querySelector(".font-list-scrollable");
  if (container) {
    container.addEventListener("mousedown", startAreaSelection);
    container.addEventListener("mousemove", updateAreaSelection);
    container.addEventListener("mouseup", endAreaSelection);
  }

  // 添加搜索清除事件监听
  document.addEventListener("search-cleared", handleSearchClearedEvent);

  // 先检查是否支持字体API
  if (window.queryLocalFonts) {
    console.log("检测到支持字体API，正在加载系统字体...");
    getSystemFonts();
  } else {
    error.value = "您的浏览器不支持字体API，无法获取系统字体列表";
    console.error("浏览器不支持queryLocalFonts API");
    isLoading.value = false;
  }

  // 组件卸载时移除事件监听
  onUnmounted(() => {
    // 使用相同的处理函数引用来移除事件监听器
    document.removeEventListener("locateFontInList", handleLocateFontEvent);
    document.removeEventListener("search-cleared", handleSearchClearedEvent);

    document.removeEventListener("mouseup", handleDragEnd);
    document.removeEventListener("touchend", handleDragEnd);

    const container = document.querySelector(".font-list-scrollable");
    if (container) {
      container.removeEventListener("mousedown", startAreaSelection);
      container.removeEventListener("mousemove", updateAreaSelection);
      container.removeEventListener("mouseup", endAreaSelection);
    }
  });
});

// 监听搜索查询变化
watch(
  () => props.searchQuery,
  (newVal, oldVal) => {
    // 当搜索查询从有内容变为空时，重置搜索状态
    if (oldVal && oldVal.trim() !== "" && (!newVal || newVal.trim() === "")) {
      console.log("搜索查询已清空，重置搜索状态");
      resetAfterSearch();
    }
  }
);

// 监听外部定位字体的事件
onMounted(() => {
  document.addEventListener("locateFontInList", (event) => {
    if (event.detail && event.detail.fontName) {
      scrollToFont(event.detail.fontName);
    }
  });
});

onUnmounted(() => {
  document.removeEventListener("locateFontInList", scrollToFont);
});
</script>

<template>
  <div
    class="font-list-container"
    :class="{ 'side-by-side': isSideBySide, 'lazy-loading': useLazyLoading }"
  >
    <div class="font-list-header">
      <div class="header-left">
        <h2>系统字体列表</h2>
        <div
          class="stats-pill"
          @mouseenter="toggleStatsTooltip"
          @mouseleave="toggleStatsTooltip"
        >
          <span class="total-count">{{ totalFonts }}</span>
          <span class="divider"></span>
          <span v-if="hasSearched" class="matched-count">{{ filteredFonts.length }}</span>

          <!-- 悬浮提示 -->
          <transition name="fade">
            <div class="stats-tooltip" v-if="showStatsTooltip">
              <div class="tooltip-arrow"></div>
              <div class="tooltip-inner">
                <div class="tooltip-row">
                  <span>总字体数量:</span>
                  <span>{{ totalFonts }}</span>
                </div>
                <div class="tooltip-row" v-if="hasSearched">
                  <span>匹配字体数量:</span>
                  <span>{{ filteredFonts.length }}</span>
                </div>
                <div class="tooltip-row">
                  <span>已启用字体去重</span>
                </div>
              </div>
            </div>
          </transition>
        </div>

        <!-- 重新设计信息切换按钮 -->
        <button
          class="info-toggle-btn"
          @click="toggleInfoPanel"
          :class="{ active: showInfoPanel }"
          title="显示/隐藏统计信息"
        >
          <svg v-if="!showInfoPanel" viewBox="0 0 24 24" width="16" height="16">
            <path
              fill="currentColor"
              d="M12 8V4H8v4H4v4h4v4h4v-4h4V8h-4zM8 20v-4H4v4h4zm12-8h4v4h-4v-4zm0 8v-4h-4v4h4zm0-16v4h-4V4h4z"
            />
          </svg>
          <svg v-else viewBox="0 0 24 24" width="16" height="16">
            <path fill="currentColor" d="M20 11H4v2h16v-2z" />
          </svg>
          <span class="info-toggle-text">{{ showInfoPanel ? "收起" : "统计" }}</span>
        </button>
      </div>

      <div class="header-actions">
        <transition name="fade">
          <span class="search-status" v-if="isSearching">
            <div class="loading-spinner-small"></div>
            <span>搜索中...</span>
            <div class="search-progress-bar">
              <div class="progress-fill" :style="{ width: `${loadingProgress}%` }"></div>
            </div>
          </span>
        </transition>

        <transition name="fade">
          <button
            v-if="hasSearched"
            class="clear-search-btn"
            @click="clearSearch"
            title="清除搜索并恢复原始列表"
          >
            <svg viewBox="0 0 24 24" width="16" height="16">
              <path
                fill="currentColor"
                d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"
              />
            </svg>
            清除搜索
          </button>
        </transition>

        <button
          class="batch-mode-btn"
          :class="{ 'is-active': isBatchMode }"
          @click="toggleBatchMode"
        >
          {{ isBatchMode ? "退出批量模式" : "批量操作" }}
        </button>
      </div>
    </div>

    <!-- 信息面板 - 使用过渡动画 -->
    <transition name="slide-down">
      <div class="info-panel" v-if="showInfoPanel">
        <div class="info-panel-flex">
          <div class="mini-info-card" style="--index: 0">
            <div class="mini-info-icon favorite-icon">
              <svg viewBox="0 0 24 24" width="16" height="16">
                <path
                  fill="currentColor"
                  d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"
                />
              </svg>
            </div>
            <span class="mini-info-value">{{ favorites.length }}</span>
            <span class="mini-info-label">收藏字体</span>
          </div>

          <div class="mini-info-card" style="--index: 1">
            <div class="mini-info-icon commercial-icon">
              <svg viewBox="0 0 24 24" width="16" height="16">
                <path
                  fill="currentColor"
                  d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"
                />
              </svg>
            </div>
            <span class="mini-info-value">{{ commercialCount }}</span>
            <span class="mini-info-label">商用字体</span>
          </div>

          <div class="mini-info-card" style="--index: 2">
            <div class="mini-info-icon mode-icon">
              <svg viewBox="0 0 24 24" width="16" height="16">
                <path
                  fill="currentColor"
                  d="M4 14h4v-4H4v4zm0 5h4v-4H4v4zM4 9h4V5H4v4zm5 5h12v-4H9v4zm0 5h12v-4H9v4zM9 5v4h12V5H9z"
                />
              </svg>
            </div>
            <span class="mini-info-label">加载方式:</span>
            <span class="mini-info-mode">{{
              useLazyLoading ? "懒加载" : "全部加载"
            }}</span>
          </div>

          <button class="close-info-panel" @click="toggleInfoPanel" title="关闭信息面板">
            <svg viewBox="0 0 24 24" width="14" height="14">
              <path
                fill="currentColor"
                d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"
              />
            </svg>
          </button>
        </div>
      </div>
    </transition>

    <div class="font-list-scrollable" @scroll="handleScroll">
      <div v-if="isLoading && fontsList.length === 0" class="loading-container">
        <div class="loading-spinner"></div>
        <p>正在加载系统字体...</p>
        <div v-if="loadingProgress > 0" class="progress-bar-container">
          <div class="progress-fill" :style="{ width: `${loadingProgress}%` }"></div>
        </div>
      </div>

      <div v-else-if="error" class="error-state">
        <svg viewBox="0 0 24 24" width="24" height="24" class="error-icon">
          <path
            fill="currentColor"
            d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10s10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"
          />
        </svg>
        <p>{{ error }}</p>
        <button class="retry-btn" @click="getSystemFonts">重试</button>
      </div>

      <div v-else class="font-grid">
        <div
          v-for="font in filteredFonts"
          :key="font.family"
          class="font-card"
          :class="{
            'is-commercial': isCommercial(font.family),
            'is-selected': isBatchMode && selectedFonts.has(font.family),
            favorite: isFavorite(font.family),
            'current-preview': font.family === currentFont,
            dragging: isDragging && lastSelectedFont === font.family,
          }"
          @mousedown="isBatchMode ? handleDragStart(font.family, $event) : null"
          @touchstart="isBatchMode ? handleDragStart(font.family, $event) : null"
          @mouseover="isBatchMode ? handleDragOver(font.family, $event) : null"
          @touchmove="isBatchMode ? handleDragOver(font.family, $event) : null"
        >
          <div class="commercial-badge" v-if="isCommercial(font.family)">
            <svg viewBox="0 0 24 24" width="16" height="16">
              <path
                fill="currentColor"
                d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"
              />
            </svg>
            <span>商用</span>
          </div>
          <div class="favorite-badge" v-if="isFavorite(font.family)">
            <svg viewBox="0 0 24 24" width="16" height="16">
              <path
                fill="currentColor"
                d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"
              />
            </svg>
            <span>收藏</span>
          </div>
          <div
            class="font-card-content"
            @click="
              isBatchMode ? toggleFontSelection(font.family) : selectFont(font.family)
            "
          >
            <div
              class="font-name"
              :style="{
                fontFamily: font.family,
                fontWeight: hasMediumWeight(font) ? selectedWeight : 'normal',
              }"
            >
              {{ font.family }}
            </div>
            <div class="font-info">
              <span class="info-badge weight-badge" v-if="font.weight">{{
                font.weight
              }}</span>
              <span class="info-badge style-badge" v-if="font.style">{{
                font.style
              }}</span>
              <span class="info-badge italic-badge" v-if="font.italic">斜体</span>
              <span
                class="info-badge variable-badge"
                v-if="font.variableAxes && font.variableAxes.length > 0"
                >可变</span
              >
            </div>
            <div
              class="font-sample"
              :style="{
                fontFamily: font.family,
                fontWeight: hasMediumWeight(font) ? selectedWeight : 'normal',
              }"
            >
              AaBbCc 123 你好世界
            </div>
            <button
              v-if="hasMediumWeight(font)"
              class="weight-toggle"
              @click.stop="toggleFontWeight(font)"
              :title="selectedWeight === 'normal' ? '切换到中等粗细' : '切换到正常粗细'"
            >
              {{ selectedWeight === "normal" ? "M" : "N" }}
            </button>
          </div>
          <div class="font-card-actions">
            <div v-if="isBatchMode" class="selection-indicator">
              <svg
                v-if="selectedFonts.has(font.family)"
                viewBox="0 0 24 24"
                width="16"
                height="16"
              >
                <path
                  fill="currentColor"
                  d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"
                />
              </svg>
            </div>
            <button
              class="action-btn commercial-btn"
              @click.stop="toggleCommercial(font.family)"
              :class="{ 'is-commercial': isCommercial(font.family) }"
              :title="isCommercial(font.family) ? '取消商用标记' : '标记为商用'"
              aria-label="商用标记"
              type="button"
            >
              <svg viewBox="0 0 24 24" width="20" height="20">
                <path
                  fill="currentColor"
                  d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"
                />
              </svg>
            </button>
            <button
              class="action-btn favorite-btn"
              @click.stop="toggleFavorite(font.family)"
              :class="{ 'is-favorite': isFavorite(font.family) }"
              :title="isFavorite(font.family) ? '取消收藏' : '收藏'"
              aria-label="收藏字体"
              type="button"
            >
              <svg viewBox="0 0 24 24" width="20" height="20">
                <path
                  fill="currentColor"
                  d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>

      <!-- 懒加载滚动提示 -->
      <div v-if="useLazyLoading && hasMore" class="scroll-indicator compatibility-fix">
        <div class="scroll-arrow">
          <svg viewBox="0 0 24 24" width="24" height="24">
            <path
              fill="currentColor"
              d="M12 4l-1.41 1.41L16.17 11H4v2h12.17l-5.58 5.59L12 20l8-8z"
            />
          </svg>
        </div>
        <p>向下滚动加载更多字体</p>
      </div>

      <div
        v-if="isLoading && fontsList.length > 0"
        class="loading-more compatibility-fix"
      >
        <div class="loading-spinner-small"></div>
        <p>加载更多字体...</p>
      </div>

      <div v-if="!hasMore && fontsList.length > 0" class="all-loaded compatibility-fix">
        <p>已加载全部字体</p>
      </div>
    </div>

    <!-- 批量操作工具栏 -->
    <div v-if="isBatchMode" class="batch-toolbar compatibility-fix">
      <div class="batch-toolbar-row">
        <div class="batch-info">
          <span v-if="selectedFonts.size > 0"
            >已选择 {{ selectedFonts.size }} 个字体</span
          >
          <span v-else>未选择字体</span>
        </div>
        <div class="selection-controls">
          <button class="tool-btn" @click="selectAll" title="全选当前列表字体">
            <svg viewBox="0 0 24 24" width="16" height="16">
              <path
                fill="currentColor"
                d="M3 5h2V3H3v2zm0 8h2v-2H3v2zm4 8h2v-2H7v2zM3 9h2V7H3v2zm10-6h-2v2h2V3zm6 0v2h2V3h-2zm-6 18h2v-2h-2v2zm-8-8h2v-2H5v2zm0-4h2V7H5v2zm8 8h2v-2h-2v2zm4 4h2v-2h-2v2zm-4-16h2V3h-2v2zm8 2h2V3h-2v2zm0 8h2v-2h-2v2zm0 8h2v-2h-2v2zm-4-4h2v-2h-2v2zm0-16h2V3h-2v2zm8 8h2v-2h-2v2zm0-8h2v-2h-2v2zm-4 8h2v-2h-2v2zm-8 8h2v-2H7v2z"
              />
            </svg>
            全选
          </button>
          <button class="tool-btn" @click="invertSelection" title="反选当前列表字体">
            <svg viewBox="0 0 24 24" width="16" height="16">
              <path
                fill="currentColor"
                d="M3,3v18h18V3H3z M19,19H5V5h14V19z M13,17h-2v-2h2V17z M13,13h-2v-2h2V13z M13,9h-2V7h2V9z"
              />
            </svg>
            反选
          </button>
          <div class="separator"></div>
          <div class="hint">
            <span class="hint-text">提示: 按住Shift键可框选多个字体</span>
          </div>
        </div>
      </div>

      <div v-if="selectedFonts.size > 0" class="batch-toolbar-row">
        <div class="batch-actions">
          <button class="batch-btn" @click="batchFavorite">
            <svg viewBox="0 0 24 24" width="16" height="16">
              <path
                fill="currentColor"
                d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"
              />
            </svg>
            批量收藏
          </button>
          <button class="batch-btn" @click="batchUnfavorite">
            <svg viewBox="0 0 24 24" width="16" height="16">
              <path
                fill="currentColor"
                d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"
              />
            </svg>
            取消收藏
          </button>
          <button class="batch-btn" @click="batchCommercial">
            <svg viewBox="0 0 24 24" width="16" height="16">
              <path
                fill="currentColor"
                d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"
              />
            </svg>
            标记商用
          </button>
          <button class="batch-btn" @click="batchUncommercial">
            <svg viewBox="0 0 24 24" width="16" height="16">
              <path
                fill="currentColor"
                d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"
              />
            </svg>
            取消商用
          </button>
          <button class="batch-btn both-action" @click="batchFavoriteAndCommercial">
            <div class="stacked-icons">
              <svg viewBox="0 0 24 24" width="16" height="16" class="icon-top">
                <path
                  fill="currentColor"
                  d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"
                />
              </svg>
              <svg viewBox="0 0 24 24" width="16" height="16" class="icon-bottom">
                <path
                  fill="currentColor"
                  d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"
                />
              </svg>
            </div>
            同时标记
          </button>
          <button class="batch-btn both-action remove" @click="batchRemoveBoth">
            <div class="stacked-icons">
              <svg viewBox="0 0 24 24" width="16" height="16" class="icon-top">
                <path
                  fill="currentColor"
                  d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"
                />
              </svg>
            </div>
            取消全部
          </button>
        </div>
        <button class="exit-batch-btn" @click="toggleBatchMode">退出批量模式</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.font-list-container {
  width: 100%;
  background-color: var(--background-primary);
  transition: var(--transition-normal);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-md);
  display: flex;
  flex-direction: column;
  position: relative;
}

/* 水平布局模式下的样式 */
.font-list-container.side-by-side {
  max-height: calc(100vh - 220px); /* 减小高度，增加底部边距 */
  height: calc(100vh - 220px);
}

/* 垂直布局模式下的样式 */
.font-list-container:not(.side-by-side) {
  max-height: 58vh; /* 在垂直布局中使用视口百分比 */
  height: 58vh;
  border: 1px solid var(--border-color); /* 添加边框 */
  transition: all 0.3s ease; /* 添加平滑过渡 */
}

/* 垂直布局模式下的文字和样式调整 */
.font-list-container:not(.side-by-side) .font-card {
  transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease;
}

/* 垂直布局模式下滚动时的阴影效果 */
.font-list-container:not(.side-by-side):hover {
  box-shadow: var(--shadow-lg);
}

.font-list-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin: 0;
  padding: var(--spacing-md) var(--spacing-lg);
  border-bottom: 1px solid var(--border-color);
  position: sticky;
  top: 0;
  background-color: var(--background-primary);
  z-index: 20;
  border-top-left-radius: var(--radius-lg);
  border-top-right-radius: var(--radius-lg);
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
}

.font-list-scrollable {
  flex: 1;
  overflow-y: auto;
  position: relative;
  padding: var(--spacing-md);
}

/* 水平布局模式下的滚动区域样式 */
.font-list-container.side-by-side .font-list-scrollable {
  padding: var(--spacing-md) var(--spacing-md) var(--spacing-lg) var(--spacing-md); /* 增加底部内边距 */
  max-height: calc(100vh - 280px); /* 减小高度，增加与边缘的间距 */
}

/* 垂直布局模式下的滚动区域样式 */
.font-list-container:not(.side-by-side) .font-list-scrollable {
  max-height: calc(58vh - 80px); /* 考虑标头高度 */
  padding-bottom: var(--spacing-lg); /* 增加底部内边距 */
}

.font-list-scrollable::-webkit-scrollbar {
  width: 12px;
  height: 12px;
  display: block;
}

.font-list-scrollable::-webkit-scrollbar-track {
  background: var(--background-secondary);
  border-radius: 6px;
}

.font-list-scrollable::-webkit-scrollbar-thumb {
  background: var(--background-tertiary);
  border-radius: 6px;
  transition: var(--transition-fast);
  border: 3px solid var(--background-secondary);
}

.font-list-scrollable::-webkit-scrollbar-thumb:hover {
  background: var(--text-tertiary);
}

/* Firefox 滚动条样式 */
.font-list-scrollable {
  scrollbar-width: auto;
  scrollbar-color: var(--background-tertiary) var(--background-secondary);
}

.font-list-header h2 {
  color: var(--text-primary);
  font-size: 1.5rem;
  font-weight: 600;
  margin: 0;
  background: linear-gradient(135deg, var(--primary-color), var(--accent-color));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.header-left {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
}

.total-count {
  color: var(--text-secondary);
  font-size: 0.875rem;
  background-color: var(--background-secondary);
  padding: var(--spacing-xs) var(--spacing-sm);
  border-radius: var(--radius-md);
}

.divider {
  width: 1px;
  height: 16px;
  background-color: var(--text-secondary);
  margin: 0 var(--spacing-xs);
}

.matched-count {
  color: var(--text-secondary);
  font-size: 0.875rem;
  background-color: var(--background-secondary);
  padding: var(--spacing-xs) var(--spacing-sm);
  border-radius: var(--radius-md);
}

.header-actions {
  display: flex;
  gap: var(--spacing-md);
  align-items: center;
}

.search-status {
  color: var(--primary-color);
  font-size: 0.875rem;
  background-color: var(--background-secondary);
  padding: var(--spacing-xs) var(--spacing-sm);
  border-radius: var(--radius-md);
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  animation: pulse 1s infinite alternate;
  position: relative;
  min-width: 120px;
}

.search-status .loading-spinner-small {
  width: 12px;
  height: 12px;
  border: 2px solid rgba(var(--primary-rgb), 0.2);
  border-top-color: var(--primary-color);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

@keyframes pulse {
  from {
    opacity: 0.8;
  }
  to {
    opacity: 1;
  }
}

.favorite-count {
  color: var(--warning-color);
  font-size: 0.875rem;
  background-color: var(--background-secondary);
  padding: var(--spacing-xs) var(--spacing-sm);
  border-radius: var(--radius-md);
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
}

.favorite-count::before {
  content: "";
  display: inline-block;
  width: 8px;
  height: 8px;
  background-color: var(--warning-color);
  border-radius: 50%;
}

.commercial-count {
  color: var(--success-color);
  font-size: 0.875rem;
  background-color: var(--background-secondary);
  padding: var(--spacing-xs) var(--spacing-sm);
  border-radius: var(--radius-md);
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
}

.commercial-count::before {
  content: "";
  display: inline-block;
  width: 8px;
  height: 8px;
  background-color: var(--success-color);
  border-radius: 50%;
}

.load-mode-indicator {
  color: var(--primary-color);
  font-size: 0.875rem;
  background-color: var(--background-secondary);
  padding: var(--spacing-xs) var(--spacing-sm);
  border-radius: var(--radius-md);
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
}

.load-mode-indicator::before {
  content: "";
  display: inline-block;
  width: 8px;
  height: 8px;
  background-color: var(--primary-color);
  border-radius: 50%;
}

.font-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: var(--spacing-md);
  padding-bottom: var(--spacing-md);
  width: 100%;
}

/* 非side-by-side模式下可以适当调整间距 */
.font-list-container:not(.side-by-side) .font-grid {
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
}

.font-card {
  position: relative;
  background-color: var(--background-secondary);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-lg);
  padding: var(--spacing-md);
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
  min-height: 110px;
  overflow: visible;
  z-index: 1;
  margin-top: 12px;
}

.font-card:hover {
  transform: translateY(-4px);
  background-color: var(--background-primary);
  border-color: var(--primary-color);
  box-shadow: var(--shadow-md);
}

.font-card.is-selected {
  border-color: var(--primary-color);
  background-color: var(--background-primary);
}

.font-card.is-selected .font-name {
  color: var(--primary-color);
}

.font-card.is-selected .font-sample {
  color: var(--text-primary);
}

.font-card.is-selected .selection-indicator {
  background-color: var(--primary-color);
  color: var(--background-primary);
}

.font-card.is-selected .weight-toggle {
  background-color: var(--background-primary);
  color: var(--primary-color);
  border-color: var(--primary-color);
}

.font-card.is-selected .weight-toggle:hover {
  background-color: var(--background-tertiary);
}

.font-card-content {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

.font-name {
  font-size: 1.05rem;
  font-weight: 500;
  margin-bottom: var(--spacing-xs);
  color: var(--text-primary);
  transition: var(--transition-normal);
  position: relative;
  z-index: 1;
  white-space: nowrap;
  text-overflow: ellipsis;
  overflow: hidden;
  max-width: 95%;
}

.font-info {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  margin-bottom: var(--spacing-xs);
  min-height: 20px;
}

.info-badge {
  font-size: 0.65rem;
  padding: 1px 5px;
  border-radius: 3px;
  background-color: var(--background-secondary);
  color: var(--text-secondary);
  white-space: nowrap;
  font-weight: normal;
  font-family: var(--font-mono);
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.weight-badge {
  background-color: rgba(var(--primary-rgb), 0.1);
  color: rgba(var(--primary-rgb), 0.9);
}

.style-badge {
  background-color: rgba(var(--accent-rgb), 0.1);
  color: rgba(var(--accent-rgb), 0.9);
}

.italic-badge {
  background-color: rgba(var(--warning-rgb), 0.1);
  color: rgba(var(--warning-rgb), 0.9);
}

.variable-badge {
  background-color: rgba(var(--success-rgb), 0.1);
  color: rgba(var(--success-rgb), 0.9);
}

.font-sample {
  height: 25px;
  overflow: hidden;
  font-size: 1.2rem;
  color: var(--text-primary);
  opacity: 0.9;
  transition: all 0.2s ease-in-out;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 3;
  user-select: none;
}

.font-card-actions {
  position: absolute;
  top: var(--spacing-sm);
  right: var(--spacing-sm);
  display: flex;
  gap: var(--spacing-xs);
  opacity: 0;
  transition: var(--transition-fast);
}

.font-card:hover .font-card-actions {
  opacity: 1;
}

.action-btn {
  padding: var(--spacing-sm);
  border-radius: var(--radius-sm);
  color: var(--text-tertiary);
  transition: var(--transition-fast);
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: var(--background-primary);
  border: 1px solid var(--border-color);
  width: 36px;
  height: 36px;
}

.action-btn:hover {
  background-color: var(--background-tertiary);
  border-color: var(--primary-color);
  color: var(--primary-color);
}

.action-btn.is-commercial {
  color: var(--success-color);
  border-color: var(--success-color);
}

.action-btn.is-favorite {
  color: var(--warning-color);
  border-color: var(--warning-color);
}

.action-btn svg {
  width: 20px;
  height: 20px;
  transition: var(--transition-fast);
}

.action-btn:hover svg {
  transform: scale(1.1);
}

.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--spacing-xl) 0;
  color: var(--primary-color);
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 3px solid rgba(var(--primary-rgb), 0.1);
  border-radius: 50%;
  border-top-color: var(--primary-color);
  animation: spin 1s ease-in-out infinite;
  margin-bottom: var(--spacing-md);
}

.progress-bar-container {
  width: 80%;
  max-width: 300px;
  height: 8px;
  background-color: rgba(var(--primary-rgb), 0.1);
  border-radius: 4px;
  margin-top: var(--spacing-md);
  position: relative;
  overflow: hidden;
}

.progress-bar {
  height: 100%;
  background: linear-gradient(90deg, var(--primary-color), var(--accent-color));
  border-radius: 4px;
  transition: width 0.3s ease;
}

.progress-text {
  position: absolute;
  top: 10px;
  left: 50%;
  transform: translateX(-50%);
  font-size: 0.75rem;
  color: var(--text-secondary);
}

.loading-more {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-md);
  padding: var(--spacing-lg);
  background-color: var(--background-secondary);
  position: sticky;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 20;
  border-top: 1px solid var(--border-color);
  margin: 0 -var(--spacing-md);
}

.loading-spinner-small {
  width: 20px;
  height: 20px;
  border: 2px solid rgba(59, 130, 246, 0.1);
  border-radius: 50%;
  border-top-color: var(--primary-color);
  animation: spin 1s ease-in-out infinite;
}

.all-loaded {
  text-align: center;
  padding: var(--spacing-md);
  color: var(--text-tertiary);
  background-color: var(--background-secondary);
  position: sticky;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 10;
  border-top: 1px solid var(--border-color);
  margin: 0 -var(--spacing-md);
}

.error-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--spacing-xl);
  color: var(--text-secondary);
  text-align: center;
}

.error-icon {
  margin-bottom: var(--spacing-md);
  color: var(--text-tertiary);
}

.retry-btn {
  margin-top: var(--spacing-md);
  padding: var(--spacing-sm) var(--spacing-md);
  background-color: var(--primary-color);
  color: white;
  border: none;
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: var(--transition-fast);
}

.retry-btn:hover {
  background-color: var(--primary-hover);
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

@media (max-width: 870px) {
  .font-list-container {
    max-height: 400px;
    padding: var(--spacing-md);
  }

  .font-grid {
    grid-template-columns: 1fr;
  }

  .font-name {
    font-size: 1rem;
  }
}

.font-card.current-preview {
  border: 2px solid var(--primary-color);
  background-color: var(--background-tertiary);
  transform: translateY(-4px);
  box-shadow: 0 8px 20px rgba(var(--primary-rgb), 0.2);
  position: relative;
  overflow: visible;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  z-index: 10;
}

.font-card.current-preview::before {
  content: "当前预览";
  position: absolute;
  top: -12px;
  left: 20%;
  transform: translateX(-50%);
  background: linear-gradient(135deg, var(--primary-color), var(--primary-hover));
  color: white;
  padding: 3px 10px;
  border-radius: var(--radius-sm);
  font-size: 11px;
  font-weight: bold;
  white-space: nowrap;
  z-index: 20;
  animation: previewBadgePop 0.3s ease-out;
  box-shadow: 0 2px 8px rgba(var(--primary-rgb), 0.3);
  border: 1px solid rgba(255, 255, 255, 0.4);
}

.font-card.current-preview::after {
  content: "";
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  border: 2px solid var(--primary-color);
  border-radius: var(--radius-lg);
  pointer-events: none;
  animation: previewBorderPulse 2s ease-in-out infinite;
}

@keyframes previewBadgePop {
  0% {
    transform: translateX(-50%) scale(0.8);
    opacity: 0;
  }
  50% {
    transform: translateX(-50%) scale(1.1);
  }
  100% {
    transform: translateX(-50%) scale(1);
    opacity: 1;
  }
}

@keyframes previewBorderPulse {
  0%,
  100% {
    opacity: 0.6;
    transform: scale(1);
    box-shadow: 0 0 0 rgba(var(--primary-rgb), 0.2);
  }
  50% {
    opacity: 1;
    transform: scale(1.02);
    box-shadow: 0 0 15px rgba(var(--primary-rgb), 0.4);
  }
}

.font-card.current-preview .font-name {
  color: var(--primary-color);
  font-weight: 600;
}

.font-card.current-preview .font-sample {
  color: var(--text-primary);
}

.font-card.current-preview .weight-toggle {
  background-color: var(--primary-color);
  color: white;
  border-color: var(--primary-color);
}

.font-card.current-preview .weight-toggle:hover {
  background-color: var(--primary-hover);
}

.font-card.current-preview .action-btn {
  background-color: var(--background-primary);
  border-color: var(--primary-color);
}

.font-card.current-preview .action-btn:hover {
  background-color: var(--primary-color);
  color: white;
}

.font-card.current-preview .action-btn svg {
  color: var(--primary-color);
}

.font-card.current-preview .action-btn:hover svg {
  color: white;
}

.font-item {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  padding: var(--spacing-md);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: var(--transition-normal);
  position: relative;
  overflow: hidden;
}

.font-item:hover {
  background-color: var(--background-hover);
}

.font-item.selected {
  background-color: var(--background-active);
  transform: translateX(var(--spacing-sm));
  box-shadow: 0 4px 12px rgba(var(--primary-rgb), 0.2);
  background: linear-gradient(
    to right,
    var(--background-active),
    var(--background-hover)
  );
  border-left: 4px solid var(--primary-color);
}

.font-item.selected::before {
  content: "";
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 4px;
  background: linear-gradient(to bottom, var(--primary-color), var(--accent-color));
  animation: selectedIndicator 2s ease-in-out infinite;
}

.font-item.selected::after {
  content: "✓";
  position: absolute;
  right: var(--spacing-md);
  color: var(--primary-color);
  font-weight: bold;
  animation: checkmarkAppear 0.3s ease-out forwards;
  opacity: 0;
  transform: scale(0.8);
}

@keyframes selectedIndicator {
  0%,
  100% {
    opacity: 0.7;
  }
  50% {
    opacity: 1;
  }
}

@keyframes checkmarkAppear {
  from {
    opacity: 0;
    transform: scale(0.8) translateX(10px);
  }
  to {
    opacity: 1;
    transform: scale(1) translateX(0);
  }
}

.font-item .font-name {
  flex: 1;
  font-weight: 500;
  color: var(--text-primary);
  transition: var(--transition-fast);
}

.font-item.selected .font-name {
  color: var(--primary-color);
  font-weight: 600;
  font-size: calc(var(--font-size-base) * 1.05);
}

.font-item .font-style {
  color: var(--text-secondary);
  font-size: var(--font-size-sm);
  transition: var(--transition-fast);
}

.font-item.selected .font-style {
  color: var(--accent-color);
}

/* 添加选中时的阴影效果 */
.font-item.selected {
  box-shadow: 0 2px 8px rgba(var(--primary-rgb), 0.15);
}

/* 添加悬停时的过渡效果 */
.font-item {
  transform: translateX(0);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.font-item:hover {
  transform: translateX(var(--spacing-xs));
}

/* 添加选中时的字体大小变化 */
.font-item.selected .font-name {
  font-size: calc(var(--font-size-base) * 1.05);
}

/* 添加选中时的背景渐变效果 */
.font-item.selected {
  background: linear-gradient(
    to right,
    var(--background-active),
    var(--background-hover)
  );
}

.commercial-badge {
  position: absolute;
  top: -10px;
  right: 10px;
  background: linear-gradient(135deg, #10b981, #059669);
  color: white;
  padding: 3px 8px;
  border-radius: var(--radius-md);
  font-size: 0.75rem;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 4px;
  box-shadow: 0 2px 8px rgba(34, 197, 94, 0.3);
  z-index: 15;
  animation: badgePop 0.3s ease-out;
  animation-delay: 0.1s;
  transform-origin: center;
  border: 1px solid rgba(255, 255, 255, 0.4);
}

.commercial-badge svg {
  width: 14px;
  height: 14px;
  filter: drop-shadow(0 1px 1px rgba(0, 0, 0, 0.1));
}

.font-card.is-commercial {
  border-color: var(--success-color);
  background-color: var(--background-primary);
}

.font-card.is-commercial:hover {
  border-color: var(--success-color);
  box-shadow: 0 4px 12px rgba(34, 197, 94, 0.1);
}

@keyframes badgePop {
  0% {
    transform: scale(0.8);
    opacity: 0;
  }
  50% {
    transform: scale(1.1);
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
}

.favorite-badge {
  position: absolute;
  top: -10px;
  right: 90px;
  background: linear-gradient(135deg, #f59e0b, #d97706);
  color: white;
  padding: 3px 8px;
  border-radius: var(--radius-md);
  font-size: 0.75rem;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 4px;
  box-shadow: 0 2px 8px rgba(245, 158, 11, 0.3);
  z-index: 15;
  animation: badgePop 0.3s ease-out;
  transform-origin: center;
  border: 1px solid rgba(255, 255, 255, 0.4);
}

.favorite-badge svg {
  width: 14px;
  height: 14px;
  filter: drop-shadow(0 1px 1px rgba(0, 0, 0, 0.1));
}

.font-card.is-commercial .favorite-badge {
  right: 90px;
}

.weight-toggle {
  position: absolute;
  bottom: var(--spacing-sm);
  right: var(--spacing-sm);
  padding: 2px 6px;
  border-radius: var(--radius-sm);
  background-color: var(--background-tertiary);
  color: var(--text-secondary);
  font-size: 0.75rem;
  font-weight: 600;
  border: 1px solid var(--border-color);
  cursor: pointer;
  transition: var(--transition-fast);
}

.weight-toggle:hover {
  background-color: var(--background-primary);
  color: var(--primary-color);
  border-color: var(--primary-color);
}

.batch-mode-btn {
  padding: var(--spacing-sm) var(--spacing-md);
  border-radius: var(--radius-md);
  background-color: var(--background-secondary);
  color: var(--text-primary);
  border: 1px solid var(--border-color);
  cursor: pointer;
  transition: var(--transition-fast);
  font-size: 0.875rem;
}

.batch-mode-btn:hover {
  background-color: var(--background-tertiary);
  border-color: var(--primary-color);
  color: var(--primary-color);
}

.batch-mode-btn.is-active {
  background-color: var(--primary-color);
  color: white;
  border-color: var(--primary-color);
}

.font-card.is-selected {
  border-color: var(--primary-color);
  background-color: var(--background-primary);
}

.selection-indicator {
  position: absolute;
  top: 10px;
  right: 10px;
  width: 24px;
  height: 24px;
  background-color: var(--background-secondary);
  border: 2px solid var(--border-color);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-primary);
  transition: all var(--transition-fast);
  z-index: 10;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.font-card.is-selected .selection-indicator {
  background-color: var(--primary-color);
  border-color: var(--primary-color);
  color: white;
  box-shadow: 0 0 0 2px rgba(var(--primary-rgb), 0.3);
}

/* 批量工具栏样式增强 */
.batch-toolbar {
  position: sticky;
  bottom: 0;
  left: 0;
  right: 0;
  background-color: var(--background-primary);
  border-top: 1px solid var(--border-color);
  padding: var(--spacing-md) var(--spacing-lg);
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
  z-index: 30;
  box-shadow: 0 -4px 10px rgba(0, 0, 0, 0.1);
  border-bottom-left-radius: var(--radius-lg);
  border-bottom-right-radius: var(--radius-lg);
  animation: slideUp 0.3s ease-out;
}

@keyframes slideUp {
  from {
    transform: translateY(100%);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

.batch-info {
  font-size: 0.9rem;
  font-weight: 500;
  color: var(--text-secondary);
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
}

.batch-info::before {
  content: "";
  display: inline-block;
  width: 8px;
  height: 8px;
  background-color: var(--primary-color);
  border-radius: 50%;
  animation: pulse 1.5s infinite;
}

@keyframes pulse {
  0% {
    transform: scale(0.95);
    box-shadow: 0 0 0 0 rgba(var(--primary-rgb), 0.7);
  }
  70% {
    transform: scale(1);
    box-shadow: 0 0 0 6px rgba(var(--primary-rgb), 0);
  }
  100% {
    transform: scale(0.95);
    box-shadow: 0 0 0 0 rgba(var(--primary-rgb), 0);
  }
}

.batch-actions {
  display: flex;
  gap: var(--spacing-sm);
}

.batch-btn {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  padding: var(--spacing-sm) var(--spacing-md);
  border-radius: var(--radius-md);
  background-color: var(--background-secondary);
  color: var(--text-primary);
  border: 1px solid var(--border-color);
  cursor: pointer;
  transition: var(--transition-fast);
  font-size: 0.875rem;
}

.batch-btn:hover {
  background-color: var(--background-tertiary);
  border-color: var(--primary-color);
  color: var(--primary-color);
}

.batch-btn svg {
  width: 16px;
  height: 16px;
}

.scroll-indicator {
  position: sticky;
  bottom: 0;
  left: 0;
  right: 0;
  background-color: rgba(var(--primary-rgb), 0.1);
  padding: var(--spacing-md);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-sm);
  z-index: 10;
  animation: pulse 2s infinite;
  backdrop-filter: blur(4px);
  border-top: 1px solid var(--border-color);
  margin: 0 -var(--spacing-md);
}

.scroll-arrow {
  animation: bounce 1.5s infinite;
  color: var(--primary-color);
  transform: rotate(90deg);
}

@keyframes bounce {
  0%,
  100% {
    transform: rotate(90deg) translateX(0);
  }
  50% {
    transform: rotate(90deg) translateX(5px);
  }
}

@keyframes pulse {
  0%,
  100% {
    background-color: rgba(var(--primary-rgb), 0.1);
  }
  50% {
    background-color: rgba(var(--primary-rgb), 0.2);
  }
}

.loading-more {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-md);
  padding: var(--spacing-lg);
  background-color: var(--background-secondary);
  position: sticky;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 20;
  border-top: 1px solid var(--border-color);
  margin: 0 -var(--spacing-md);
}

.loading-spinner-small {
  width: 24px;
  height: 24px;
  border: 3px solid var(--background-tertiary);
  border-top-color: var(--primary-color);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

.all-loaded {
  text-align: center;
  padding: var(--spacing-md);
  color: var(--text-tertiary);
  background-color: var(--background-secondary);
  position: sticky;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 10;
  border-top: 1px solid var(--border-color);
  margin: 0 -var(--spacing-md);
}

/* 单独做一些移动端适配优化 */
@media (max-width: 768px) {
  .font-list-scrollable {
    padding: var(--spacing-sm);
  }

  .font-grid {
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    gap: var(--spacing-sm);
  }

  .loading-more,
  .all-loaded,
  .scroll-indicator {
    margin: 0 -var(--spacing-sm);
  }
}

.search-progress-bar {
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  height: 3px;
  background-color: rgba(var(--primary-rgb), 0.1);
  border-radius: 0 0 var(--radius-md) var(--radius-md);
  overflow: hidden;
}

.clear-search-btn {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  padding: var(--spacing-xs) var(--spacing-sm);
  border-radius: var(--radius-md);
  background-color: var(--background-secondary);
  color: var(--text-tertiary);
  border: 1px solid var(--border-color);
  font-size: 0.875rem;
  cursor: pointer;
  transition: var(--transition-fast);
}

.clear-search-btn:hover {
  background-color: rgba(var(--danger-rgb), 0.1);
  color: var(--danger-color);
  border-color: var(--danger-color);
}

.clear-search-btn svg {
  width: 16px;
  height: 16px;
}

.deduplication-info {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 0.8rem;
  padding: 2px 8px;
  border-radius: var(--radius-md);
  background-color: var(--info-500);
  color: var(--white);
  margin-left: 8px;
  transition: var(--transition-fast);
}

.deduplication-info svg {
  opacity: 0.8;
}

.deduplication-info:hover {
  background-color: var(--info-600);
}

/* 药丸样式的统计指示器 */
.stats-pill {
  display: flex;
  align-items: center;
  padding: var(--spacing-xs) var(--spacing-sm);
  background-color: var(--background-secondary);
  border-radius: 30px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  transition: all 0.3s ease;
  border: 1px solid var(--border-color);
  position: relative;
  cursor: help;
}

.stats-pill:hover {
  background-color: var(--background-tertiary);
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

.total-count {
  color: var(--text-secondary);
  font-size: 0.875rem;
  font-weight: 600;
}

.matched-count {
  color: var(--primary-color);
  font-size: 0.875rem;
  font-weight: 600;
  animation: pulseText 2s infinite alternate;
}

.divider {
  width: 1px;
  height: 16px;
  background-color: var(--border-color);
  margin: 0 var(--spacing-xs);
}

/* 统计信息悬浮提示 */
.stats-tooltip {
  position: absolute;
  top: 100%;
  left: 50%;
  transform: translateX(-50%);
  margin-top: 8px;
  background-color: var(--background-primary);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-lg);
  z-index: 100;
  width: 200px;
  border: 1px solid var(--border-color);
  padding: 0;
  overflow: hidden;
}

.tooltip-arrow {
  position: absolute;
  top: -8px;
  left: 50%;
  transform: translateX(-50%);
  width: 0;
  height: 0;
  border-left: 8px solid transparent;
  border-right: 8px solid transparent;
  border-bottom: 8px solid var(--background-primary);
  z-index: 1;
}

.tooltip-arrow::before {
  content: "";
  position: absolute;
  top: -1px;
  left: -8px;
  width: 0;
  height: 0;
  border-left: 8px solid transparent;
  border-right: 8px solid transparent;
  border-bottom: 8px solid var(--border-color);
  z-index: -1;
}

.tooltip-inner {
  padding: var(--spacing-sm);
}

.tooltip-row {
  display: flex;
  justify-content: space-between;
  padding: var(--spacing-xs) 0;
  font-size: 0.8rem;
  color: var(--text-secondary);
  border-bottom: 1px solid var(--border-color);
}

.tooltip-row:last-child {
  border-bottom: none;
  color: var(--primary-color);
  justify-content: center;
  font-weight: 500;
}

/* 信息切换按钮 */
.info-toggle-btn {
  background: none;
  border: 1px solid var(--border-color);
  padding: var(--spacing-xs) var(--spacing-sm);
  border-radius: var(--radius-md);
  color: var(--text-secondary);
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  background-color: var(--background-secondary);
  position: relative;
  overflow: hidden;
}

/* 添加切换按钮波纹效果 */
.info-toggle-btn::after {
  content: "";
  position: absolute;
  top: 50%;
  left: 50%;
  width: 0;
  height: 0;
  background-color: rgba(var(--primary-rgb), 0.2);
  border-radius: 50%;
  transform: translate(-50%, -50%);
  opacity: 0;
  z-index: 0;
}

.info-toggle-btn:active::after {
  content: "";
  position: absolute;
  top: 50%;
  left: 50%;
  width: 100%;
  height: 100%;
  background-color: rgba(var(--primary-rgb), 0.1);
  border-radius: 50%;
  transform: translate(-50%, -50%) scale(0);
  animation: ripple 0.4s ease-out;
}

@keyframes ripple {
  0% {
    transform: translate(-50%, -50%) scale(0);
    opacity: 1;
  }
  70% {
    transform: translate(-50%, -50%) scale(1.5);
    opacity: 0.3;
  }
  100% {
    transform: translate(-50%, -50%) scale(2);
    opacity: 0;
  }
}

.info-toggle-btn:hover {
  background-color: var(--background-tertiary);
  color: var(--primary-color);
  border-color: var(--primary-color);
  transform: translateY(-2px);
}

.info-toggle-btn.active {
  color: var(--primary-color);
  background-color: rgba(var(--primary-rgb), 0.1);
  border-color: var(--primary-color);
}

.info-toggle-text {
  font-size: 0.75rem;
  font-weight: 500;
}

/* 搜索状态显示 */
.search-status {
  color: var(--primary-color);
  font-size: 0.875rem;
  background-color: var(--background-secondary);
  padding: var(--spacing-xs) var(--spacing-sm);
  border-radius: var(--radius-md);
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  position: relative;
  min-width: 80px;
}

.loading-spinner-small {
  width: 12px;
  height: 12px;
  border: 2px solid rgba(var(--primary-rgb), 0.2);
  border-top-color: var(--primary-color);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

.search-progress-bar {
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  height: 3px;
  background-color: rgba(var(--primary-rgb), 0.1);
  border-radius: 0 0 var(--radius-md) var(--radius-md);
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--primary-color), var(--accent-color));
  transition: width 0.3s ease;
}

/* 清除搜索按钮 */
.clear-search-btn {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  padding: var(--spacing-xs) var(--spacing-sm);
  border-radius: var(--radius-md);
  background-color: var(--background-secondary);
  color: var(--text-tertiary);
  border: 1px solid var(--border-color);
  font-size: 0.875rem;
  cursor: pointer;
  transition: var(--transition-fast);
}

.clear-search-btn:hover {
  background-color: rgba(var(--danger-rgb), 0.1);
  color: var(--danger-color);
  border-color: var(--danger-color);
}

.clear-search-btn svg {
  width: 16px;
  height: 16px;
}

/* 批量操作按钮 */
.batch-mode-btn {
  padding: var(--spacing-sm) var(--spacing-md);
  border-radius: var(--radius-md);
  background-color: var(--background-secondary);
  color: var(--text-primary);
  border: 1px solid var(--border-color);
  cursor: pointer;
  transition: var(--transition-fast);
  font-size: 0.875rem;
}

.batch-mode-btn:hover {
  background-color: var(--background-tertiary);
  border-color: var(--primary-color);
  color: var(--primary-color);
}

.batch-mode-btn.is-active {
  background-color: var(--primary-color);
  color: white;
  border-color: var(--primary-color);
}

/* 信息面板 */
.info-panel {
  background-color: var(--background-primary);
  border-bottom: 1px solid var(--border-color);
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.05);
  overflow: hidden;
  padding: 0;
  z-index: 5;
  will-change: transform, opacity, max-height;
}

.info-panel-flex {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  gap: var(--spacing-lg);
  flex-wrap: wrap;
  position: relative;
  padding: var(--spacing-xs) var(--spacing-md);
}

.mini-info-card {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  padding: var(--spacing-xs) var(--spacing-sm);
  border-radius: var(--radius-md);
  border: 1px solid var(--border-color);
  background-color: var(--background-secondary);
  transition: all 0.2s ease;
}

.mini-info-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  border-color: var(--border-color-hover);
}

.mini-info-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  flex-shrink: 0;
}

.mini-info-value {
  font-weight: 600;
  font-size: 0.9rem;
  color: var(--text-primary);
}

.mini-info-label {
  font-size: 0.75rem;
  color: var(--text-secondary);
  white-space: nowrap;
}

.mini-info-mode {
  font-size: 0.75rem;
  color: var(--primary-color);
  font-weight: 500;
  white-space: nowrap;
}

.favorite-icon {
  color: var(--warning-color);
}

.commercial-icon {
  color: var(--success-color);
}

.mode-icon {
  color: var(--primary-color);
}

.close-info-panel {
  position: absolute;
  right: 0;
  top: 50%;
  transform: translateY(-50%);
  width: 24px;
  height: 24px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: var(--background-tertiary);
  color: var(--text-tertiary);
  border: 1px solid var(--border-color);
  cursor: pointer;
  transition: all 0.2s ease;
}

.close-info-panel:hover {
  background-color: rgba(var(--danger-rgb), 0.1);
  color: var(--danger-color);
  border-color: var(--danger-color);
}

/* 过渡动画优化 - 替换现有的动画定义 */
.slide-down-enter-active {
  animation: slideDown 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
  overflow: hidden;
}

.slide-down-leave-active {
  animation: slideUp 0.25s cubic-bezier(0.4, 0, 0.2, 1) forwards;
  overflow: hidden;
}

/* 为信息面板添加淡入淡出的背景色变化 */
@keyframes slideDown {
  0% {
    max-height: 0;
    opacity: 0;
    transform: translateY(-15px);
    background-color: rgba(var(--primary-rgb), 0.02);
    border-bottom-color: transparent;
  }
  50% {
    opacity: 0.8;
    background-color: rgba(var(--primary-rgb), 0.05);
  }
  100% {
    max-height: 200px;
    opacity: 1;
    transform: translateY(0);
    background-color: var(--background-primary);
    border-bottom-color: var(--border-color);
  }
}

@keyframes slideUp {
  0% {
    max-height: 200px;
    opacity: 1;
    transform: translateY(0);
    background-color: var(--background-primary);
    border-bottom-color: var(--border-color);
  }
  100% {
    max-height: 0;
    opacity: 0;
    transform: translateY(-15px);
    background-color: rgba(var(--primary-rgb), 0.02);
    border-bottom-color: transparent;
  }
}

/* 添加卡片动画效果 */
.mini-info-card {
  animation: cardAppear 0.4s cubic-bezier(0.17, 1.67, 0.38, 0.98) forwards;
  animation-delay: calc(var(--index, 0) * 0.08s);
  opacity: 0;
  transform: translateY(10px) scale(0.9);
  will-change: transform, opacity;
  transform-origin: center;
}

@keyframes cardAppear {
  0% {
    opacity: 0;
    transform: translateY(10px) scale(0.9);
  }
  70% {
    transform: translateY(-3px) scale(1.02);
  }
  100% {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

/* 动画效果 */
@keyframes pulseText {
  0%,
  100% {
    opacity: 0.7;
  }
  50% {
    opacity: 1;
  }
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s, transform 0.3s;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

/* 响应式调整 */
@media (max-width: 768px) {
  .header-left {
    flex-wrap: wrap;
  }

  .info-panel-flex {
    gap: var(--spacing-sm);
    justify-content: center;
    padding-right: 30px;
  }

  .mini-info-card {
    flex: 1;
    min-width: 80px;
    justify-content: center;
  }
}

/* 防止信息面板过大占据空间 */
.slide-down-enter-from,
.slide-down-leave-to {
  max-height: 0;
  min-height: 0;
  padding-top: 0;
  padding-bottom: 0;
  margin-top: 0;
  margin-bottom: 0;
  border-width: 0;
  opacity: 0;
  transform: translateY(-15px);
  overflow: hidden;
}

/* 添加切换按钮波纹效果 */
.info-toggle-btn:active::after {
  content: "";
  position: absolute;
  top: 50%;
  left: 50%;
  width: 100%;
  height: 100%;
  background-color: rgba(var(--primary-rgb), 0.1);
  border-radius: 50%;
  transform: translate(-50%, -50%) scale(0);
  animation: ripple 0.4s ease-out;
}

@keyframes ripple {
  0% {
    transform: translate(-50%, -50%) scale(0);
    opacity: 1;
  }
  70% {
    transform: translate(-50%, -50%) scale(1.5);
    opacity: 0.3;
  }
  100% {
    transform: translate(-50%, -50%) scale(2);
    opacity: 0;
  }
}

/* 优化下拉面板动画效果 */
.slide-down-enter-active {
  transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
  max-height: 200px;
  opacity: 1;
  transform: translateY(0);
  overflow: hidden;
}

.slide-down-leave-active {
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  max-height: 200px;
  opacity: 1;
  transform: translateY(0);
  overflow: hidden;
}

/* 添加卡片动画效果 */
.mini-info-card {
  animation: cardAppear 0.4s cubic-bezier(0.17, 1.67, 0.38, 0.98) forwards;
  animation-delay: calc(var(--index, 0) * 0.08s);
  opacity: 0;
  transform: translateY(10px) scale(0.9);
  will-change: transform, opacity;
  transform-origin: center;
}

@keyframes cardAppear {
  0% {
    opacity: 0;
    transform: translateY(10px) scale(0.9);
  }
  70% {
    transform: translateY(-3px) scale(1.02);
  }
  100% {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

/* 拖动时的高亮样式 */
.font-card.dragging {
  box-shadow: 0 0 0 2px var(--primary-color);
  transform: translateY(-2px);
  transition: none; /* 拖动时禁用过渡效果，使选择更加流畅 */
}

/* 批量操作工具栏增强 */
.batch-actions {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-sm);
}

.batch-btn {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  background-color: var(--background-secondary);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  padding: var(--spacing-xs) var(--spacing-sm);
  color: var(--text-primary);
  font-size: 0.875rem;
  cursor: pointer;
  transition: all var(--transition-fast);
}

.batch-btn:hover {
  background-color: var(--background-tertiary);
  transform: translateY(-2px);
}

/* 同时标记按钮样式 */
.batch-btn.both-action {
  background-color: var(--primary-color-10);
  border-color: var(--primary-color);
  color: var(--primary-color);
}

.batch-btn.both-action:hover {
  background-color: var(--primary-color);
  color: white;
}

.batch-btn.both-action.remove {
  background-color: var(--danger-color-10);
  border-color: var(--danger-color);
  color: var(--danger-color);
}

.batch-btn.both-action.remove:hover {
  background-color: var(--danger-color);
  color: white;
}

.stacked-icons {
  position: relative;
  width: 16px;
  height: 16px;
}

.icon-top {
  position: absolute;
  top: -3px;
  left: 0;
  z-index: 2;
  transform: scale(0.9);
}

.icon-bottom {
  position: absolute;
  bottom: -3px;
  right: -3px;
  z-index: 1;
  transform: scale(0.8);
}

/* 增加批量模式下的字体卡片交互样式 */
.font-card.is-selected {
  border-color: var(--primary-color);
  background-color: var(--primary-color-10);
  transform: translateY(-2px);
}

/* 在批量模式下，让选中指示器更加明显 */
.selection-indicator {
  position: absolute;
  top: 10px;
  right: 10px;
  width: 24px;
  height: 24px;
  background-color: var(--background-secondary);
  border: 2px solid var(--border-color);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-primary);
  transition: all var(--transition-fast);
  z-index: 10;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.font-card.is-selected .selection-indicator {
  background-color: var(--primary-color);
  border-color: var(--primary-color);
  color: white;
  box-shadow: 0 0 0 2px rgba(var(--primary-rgb), 0.3);
}

/* 区域选择矩形 */
.selection-rectangle {
  position: absolute;
  border: 2px dashed var(--primary-color);
  background-color: rgba(var(--primary-rgb), 0.1);
  pointer-events: none;
  z-index: 100;
}

/* 在区域内的卡片高亮 */
.font-card.in-selection-area {
  border-color: var(--primary-color);
  box-shadow: 0 0 0 2px rgba(var(--primary-rgb), 0.3);
}

/* 批量工具栏增强 */
.batch-toolbar {
  padding: var(--spacing-md);
}

.batch-toolbar-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: var(--spacing-md);
  padding: var(--spacing-xs) 0;
}

.selection-controls {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
}

.tool-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  background-color: var(--background-secondary);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  color: var(--text-secondary);
  font-size: 0.8rem;
  cursor: pointer;
  transition: all var(--transition-fast);
}

.tool-btn:hover {
  background-color: var(--background-tertiary);
  color: var(--text-primary);
}

.separator {
  width: 1px;
  height: 24px;
  background-color: var(--border-color);
  margin: 0 var(--spacing-xs);
}

.hint {
  font-size: 0.75rem;
  color: var(--text-tertiary);
  font-style: italic;
}

.exit-batch-btn {
  padding: 6px 12px;
  background-color: var(--background-secondary);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  color: var(--danger-color);
  font-size: 0.875rem;
  cursor: pointer;
  transition: all var(--transition-fast);
}

.exit-batch-btn:hover {
  background-color: var(--danger-color);
  color: white;
  border-color: var(--danger-color);
}

@media (max-width: 768px) {
  .batch-toolbar-row {
    flex-direction: column;
    align-items: flex-start;
  }

  .selection-controls {
    margin-top: var(--spacing-xs);
    width: 100%;
    justify-content: space-between;
  }

  .batch-actions {
    flex-wrap: wrap;
    justify-content: flex-start;
  }
}

/* 修改商用按钮和收藏按钮样式 */
.action-btn {
  background: none;
  border: none;
  padding: 6px;
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-tertiary);
  outline: none;
  z-index: 2;
}

.action-btn:hover {
  background-color: var(--background-tertiary);
  transform: translateY(-2px);
  color: var(--text-primary);
}

.action-btn.favorite-btn:hover {
  color: var(--warning-color);
}

.action-btn.commercial-btn:hover {
  color: var(--success-color);
}

.action-btn.is-favorite,
.action-btn.favorite-btn.is-favorite {
  color: var(--warning-color);
}

.action-btn.is-commercial,
.action-btn.commercial-btn.is-commercial {
  color: var(--success-color);
}

.action-btn:active {
  transform: scale(0.95);
}

/* 确保按钮在字体卡片中定位正确 */
.font-card-actions {
  position: absolute;
  right: 8px;
  bottom: 8px;
  display: flex;
  gap: 4px;
  z-index: 10;
}

/* 按钮动画效果 */
.action-btn svg {
  transition: transform 0.2s ease;
}

.action-btn:hover svg {
  transform: scale(1.2);
}

.action-btn.is-favorite svg,
.action-btn.is-commercial svg {
  filter: drop-shadow(0 0 2px currentColor);
}

/* 添加移动设备的触摸优化 */
@media (hover: none) {
  .action-btn {
    padding: 8px;
  }

  .action-btn svg {
    width: 24px;
    height: 24px;
  }

  .font-card-actions {
    gap: 8px;
  }
}
</style>
