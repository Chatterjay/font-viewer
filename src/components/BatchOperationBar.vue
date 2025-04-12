<script setup>
import { ref, computed } from "vue";

const props = defineProps({
  // 是否处于批量模式
  isBatchMode: {
    type: Boolean,
    default: false,
  },
  // 已选择的字体数组
  selectedFonts: {
    type: Set,
    default: () => new Set(),
  },
  // 可操作的字体列表
  fontsList: {
    type: Array,
    default: () => [],
  },
  // 操作类型：'favorites' 或 'commercial'
  type: {
    type: String,
    default: "favorites",
    validator: (value) => ["favorites", "commercial"].includes(value),
  },
});

const emit = defineEmits([
  "toggle-batch-mode",
  "select-all",
  "invert-selection",
  "batch-remove",
  "update:selected-fonts",
]);

// 计算操作按钮文本
const actionText = computed(() => {
  return props.type === "favorites" ? "收藏" : "商用";
});

// 选中数量
const selectedCount = computed(() => props.selectedFonts.size);

// 全选
const selectAll = () => {
  emit("select-all");
};

// 反选
const invertSelection = () => {
  emit("invert-selection");
};

// 批量移除
const batchRemove = () => {
  emit("batch-remove");
};

// 切换批量模式
const toggleBatchMode = () => {
  emit("toggle-batch-mode");
};
</script>

<template>
  <div class="batch-toolbar" v-if="isBatchMode">
    <div class="batch-toolbar-row">
      <div class="batch-info">
        <span v-if="selectedCount > 0">已选择 {{ selectedCount }} 个字体</span>
        <span v-else>未选择字体</span>
      </div>
      <div class="selection-controls">
        <button class="tool-btn" @click="selectAll" title="全选当前列表字体">
          <svg viewBox="0 0 24 24" width="16" height="16">
            <path
              fill="currentColor"
              d="M3 5h2V3H3v2zm0 8h2v-2H3v2zm4 8h2v-2H7v2zM3 9h2V7H3v2zm10-6h-2v2h2V3zm6 0v2h2V3h-2zm-6 18h2v-2h-2v2zm-8-8h2v-2H5v2zm0-4h2V7H5v2zm8 8h2v-2h-2v2zm4 4h2v-2h-2v2z"
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
        <button class="tool-btn hint" title="框选批量选择提示">
          <svg viewBox="0 0 24 24" width="16" height="16">
            <path
              fill="currentColor"
              d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"
            />
          </svg>
          <span class="hint-text">按住鼠标拖动可批量选择</span>
        </button>
      </div>
    </div>

    <div v-if="selectedCount > 0" class="batch-toolbar-row">
      <div class="batch-actions">
        <button class="batch-btn" @click="batchRemove">
          <svg viewBox="0 0 24 24" width="16" height="16">
            <path
              fill="currentColor"
              d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"
            />
          </svg>
          批量取消{{ actionText }}
        </button>
      </div>
      <button class="exit-batch-btn" @click="toggleBatchMode">退出批量模式</button>
    </div>
  </div>
</template>

<style scoped>
/* 批量工具栏样式 */
.batch-toolbar {
  position: sticky;
  bottom: 0;
  left: 0;
  right: 0;
  background-color: var(--background-primary);
  border-top: 1px solid var(--border-color);
  padding: var(--spacing-md);
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

.batch-toolbar-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: var(--spacing-md);
  padding: var(--spacing-xs) 0;
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

.hint-text {
  font-size: 0.75rem;
}

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
    margin-top: var(--spacing-xs);
    flex-wrap: wrap;
    justify-content: flex-start;
    width: 100%;
  }
}
</style>
