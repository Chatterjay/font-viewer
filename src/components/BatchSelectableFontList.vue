<script setup>
import { ref, computed, onMounted, onUnmounted } from "vue";
import BatchOperationBar from "./BatchOperationBar.vue";

const props = defineProps({
  // 字体列表
  fonts: {
    type: Array,
    default: () => [],
  },
  // 当前选中的字体
  currentFont: {
    type: String,
    default: "",
  },
  // 列表类型：'favorites' 或 'commercial'
  type: {
    type: String,
    default: "favorites",
    validator: (value) => ["favorites", "commercial"].includes(value),
  },
});

const emit = defineEmits(["select-font", "remove-font", "batch-remove"]);

// 批量模式状态
const isBatchMode = ref(false);
// 已选择的字体
const selectedFonts = ref(new Set());
// 拖动选择相关状态
const isDragging = ref(false);
const lastSelectedFont = ref(null);
const dragStartElement = ref(null);

// 计算按钮文本
const actionText = computed(() => {
  return props.type === "favorites" ? "收藏" : "商用";
});

// 进入批量模式
const enterBatchMode = () => {
  isBatchMode.value = true;
  selectedFonts.value.clear();
};

// 切换批量模式
const toggleBatchMode = () => {
  isBatchMode.value = !isBatchMode.value;
  if (!isBatchMode.value) {
    selectedFonts.value.clear();
  }
};

// 选择字体（非批量模式）
const selectFont = (fontName) => {
  emit("select-font", fontName);
};

// 移除字体
const removeFont = (fontName) => {
  emit("remove-font", fontName);
};

// 选择/取消选择字体（批量模式）
const toggleFontSelection = (fontName) => {
  if (selectedFonts.value.has(fontName)) {
    selectedFonts.value.delete(fontName);
  } else {
    selectedFonts.value.add(fontName);
  }
};

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

// 全选
const selectAll = () => {
  props.fonts.forEach((font) => {
    // 根据类型判断是否直接使用font还是font.family
    const fontName = typeof font === "string" ? font : font.family;
    selectedFonts.value.add(fontName);
  });
};

// 反选
const invertSelection = () => {
  props.fonts.forEach((font) => {
    // 根据类型判断是否直接使用font还是font.family
    const fontName = typeof font === "string" ? font : font.family;
    if (selectedFonts.value.has(fontName)) {
      selectedFonts.value.delete(fontName);
    } else {
      selectedFonts.value.add(fontName);
    }
  });
};

// 批量移除
const batchRemove = () => {
  emit("batch-remove", Array.from(selectedFonts.value));
  selectedFonts.value.clear();
  toggleBatchMode(); // 操作完成后退出批量模式
};

// 组件挂载时监听事件
onMounted(() => {
  // 监听全局鼠标事件，确保拖动功能在鼠标移出元素后也能停止
  document.addEventListener("mouseup", handleDragEnd);
  document.addEventListener("touchend", handleDragEnd);
});

// 组件卸载时清除事件监听
onUnmounted(() => {
  document.removeEventListener("mouseup", handleDragEnd);
  document.removeEventListener("touchend", handleDragEnd);
});
</script>

<template>
  <div class="batch-font-list-container">
    <!-- 批量模式切换按钮 -->
    <div class="list-header">
      <h3 class="section-title">
        {{ props.type === "favorites" ? "收藏的字体" : "商用字体" }}
      </h3>
      <button v-if="!isBatchMode" class="batch-mode-btn" @click="enterBatchMode">
        <svg viewBox="0 0 24 24" width="16" height="16">
          <path
            fill="currentColor"
            d="M3 5h2V3H3v2zm0 8h2v-2H3v2zm4 8h2v-2H7v2zM3 9h2V7H3v2zm10-6h-2v2h2V3zm6 0v2h2V3h-2zm-6 18h2v-2h-2v2zm-8-8h2v-2H5v2zm0-4h2V7H5v2zm8 8h2v-2h-2v2zm4 4h2v-2h-2v2z"
          />
        </svg>
        批量操作
      </button>
    </div>

    <!-- 空状态显示 -->
    <div v-if="props.fonts.length === 0" class="empty-state">
      <svg viewBox="0 0 24 24" width="48" height="48">
        <path
          v-if="props.type === 'favorites'"
          fill="currentColor"
          d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
        />
        <path
          v-else
          fill="currentColor"
          d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"
        />
      </svg>
      <p>暂无{{ actionText }}字体</p>
      <p class="hint">
        点击字体卡片右上角的{{ actionText === "收藏" ? "星标" : "商用标记"
        }}{{ actionText }}字体
      </p>
    </div>

    <!-- 字体列表 -->
    <div v-else class="fonts-grid">
      <div
        v-for="font in props.fonts"
        :key="typeof font === 'string' ? font : font.family"
        class="font-card"
        :class="{
          'is-selected':
            isBatchMode &&
            selectedFonts.has(typeof font === 'string' ? font : font.family),
          'current-preview':
            (typeof font === 'string' ? font : font.family) === currentFont,
          dragging:
            isDragging &&
            lastSelectedFont === (typeof font === 'string' ? font : font.family),
        }"
        @mousedown="
          isBatchMode
            ? handleDragStart(typeof font === 'string' ? font : font.family, $event)
            : null
        "
        @touchstart="
          isBatchMode
            ? handleDragStart(typeof font === 'string' ? font : font.family, $event)
            : null
        "
        @mouseover="
          isBatchMode
            ? handleDragOver(typeof font === 'string' ? font : font.family, $event)
            : null
        "
        @touchmove="
          isBatchMode
            ? handleDragOver(typeof font === 'string' ? font : font.family, $event)
            : null
        "
      >
        <div
          class="font-card-content"
          @click="
            isBatchMode
              ? toggleFontSelection(typeof font === 'string' ? font : font.family)
              : selectFont(typeof font === 'string' ? font : font.family)
          "
        >
          <div
            class="font-name"
            :style="{ fontFamily: typeof font === 'string' ? font : font.family }"
          >
            {{ typeof font === "string" ? font : font.family }}
          </div>
          <div
            class="font-sample"
            :style="{ fontFamily: typeof font === 'string' ? font : font.family }"
          >
            AaBbCc 123 你好世界
          </div>
        </div>

        <!-- 批量选择指示器 -->
        <div v-if="isBatchMode" class="selection-indicator">
          <svg
            v-if="selectedFonts.has(typeof font === 'string' ? font : font.family)"
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

        <!-- 移除按钮 -->
        <button
          v-if="!isBatchMode"
          class="remove-btn"
          :class="{ commercial: props.type === 'commercial' }"
          @click.stop="removeFont(typeof font === 'string' ? font : font.family)"
          :title="`取消${actionText}`"
        >
          <svg viewBox="0 0 24 24" width="16" height="16">
            <path
              fill="currentColor"
              d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"
            />
          </svg>
        </button>
      </div>
    </div>

    <!-- 批量操作工具栏 -->
    <BatchOperationBar
      :is-batch-mode="isBatchMode"
      :selected-fonts="selectedFonts"
      :fonts-list="props.fonts"
      :type="props.type"
      @toggle-batch-mode="toggleBatchMode"
      @select-all="selectAll"
      @invert-selection="invertSelection"
      @batch-remove="batchRemove"
    />
  </div>
</template>

<style scoped>
.batch-font-list-container {
  position: relative;
  min-height: 200px;
  max-height: 600px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.list-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-bottom: var(--spacing-sm);
  border-bottom: 1px solid var(--border-color);
  margin-bottom: var(--spacing-md);
}

.section-title {
  font-size: 1.25rem;
  font-weight: 600;
  margin: 0;
  background: linear-gradient(135deg, var(--primary-color), var(--accent-color));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.batch-mode-btn {
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

.batch-mode-btn:hover {
  background-color: var(--background-tertiary);
  transform: translateY(-2px);
}

.empty-state {
  text-align: center;
  padding: var(--spacing-lg) 0;
  color: var(--text-tertiary);
}

.hint {
  font-size: 0.875rem;
  color: var(--text-tertiary);
  margin-top: var(--spacing-sm);
}

.fonts-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: var(--spacing-md);
  overflow-y: auto;
  padding: var(--spacing-sm);
  max-height: 400px;
}

.font-card {
  position: relative;
  background-color: var(--background-secondary);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-lg);
  padding: var(--spacing-sm);
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.font-card:hover {
  transform: translateY(-4px);
  background-color: var(--background-primary);
  border-color: var(--primary-color);
  box-shadow: var(--shadow-md);
}

.font-card.is-selected {
  border-color: var(--primary-color);
  background-color: var(--primary-color-10);
  transform: translateY(-2px);
}

.font-card.current-preview {
  border-color: var(--primary-color);
  box-shadow: 0 0 0 2px var(--primary-color-20);
}

.font-card.dragging {
  box-shadow: 0 0 0 2px var(--primary-color);
  transform: translateY(-2px);
  transition: none; /* 拖动时禁用过渡效果，使选择更加流畅 */
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
  z-index: 20;
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

.remove-btn.commercial {
  color: var(--warning-color);
}

.remove-btn.commercial:hover {
  background-color: var(--warning-color);
  border-color: var(--warning-color);
  color: white;
}

@media (max-width: 768px) {
  .fonts-grid {
    grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
  }
}
</style>
