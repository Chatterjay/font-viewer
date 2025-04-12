<script setup>
import { ref, watch } from "vue";

const searchQuery = ref("");
const emit = defineEmits(["search"]);

// 监听输入变化并发送事件
const handleInput = () => {
  emit("search", searchQuery.value.trim());
};

// 清除搜索框内容
const clearSearch = () => {
  searchQuery.value = "";
  // 确保触发search事件，传递空字符串
  emit("search", "");
};

// 监听props中的searchQuery变化，如果外部清空了，也要同步更新本地状态
watch(searchQuery, (newVal) => {
  if (newVal.trim() === "") {
    emit("search", "");
  }
});
</script>

<template>
  <div class="search-container">
    <div class="search-input-wrapper">
      <svg class="search-icon" viewBox="0 0 24 24" width="20" height="20">
        <path fill="currentColor" d="M15.5 14h-.79l-.28-.27a6.5 6.5 0 1 0-.7.7l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0A4.5 4.5 0 1 1 14 9.5 4.5 4.5 0 0 1 9.5 14z"/>
      </svg>
      <input
        type="text"
        v-model="searchQuery"
        placeholder="搜索字体..."
        @input="handleInput"
        class="search-input"
      />
      <button 
        v-if="searchQuery" 
        @click="clearSearch" 
        class="clear-btn" 
        title="清除搜索"
        aria-label="清除搜索"
        type="button"
      >
        <svg viewBox="0 0 24 24" width="16" height="16">
          <path fill="currentColor" d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
        </svg>
      </button>
    </div>
  </div>
</template>

<style scoped>
.search-container {
  width: 100%;
  margin-bottom: var(--spacing-md);
}

.search-input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
  background-color: var(--background-secondary);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-xl);
  padding: var(--spacing-sm) var(--spacing-md);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: var(--shadow-sm);
}

.search-input-wrapper:focus-within {
  border-color: var(--primary-color);
  box-shadow: 0 4px 10px rgba(var(--primary-rgb), 0.1);
  transform: translateY(-2px);
  background-color: var(--background-primary);
}

.search-icon {
  color: var(--primary-color);
  margin-right: var(--spacing-md);
  transition: all var(--transition-fast);
}

.search-input-wrapper:focus-within .search-icon {
  transform: scale(1.1);
}

.search-input {
  flex: 1;
  border: none;
  background: none;
  padding: var(--spacing-sm) var(--spacing-sm) var(--spacing-sm) 0;
  font-size: 1.1rem;
  color: var(--text-primary);
}

.search-input::placeholder {
  color: var(--text-secondary);
}

.search-input:focus {
  outline: none;
  box-shadow: none;
}

.clear-btn {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  color: var(--text-tertiary);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all var(--transition-fast);
  background-color: var(--background-tertiary);
}

.clear-btn:hover {
  color: var(--text-primary);
  background-color: var(--background-active);
  transform: scale(1.1);
}

@media (max-width: 870px) {
  .search-input-wrapper {
    padding: var(--spacing-xs) var(--spacing-sm);
  }
  
  .search-input {
    font-size: 0.875rem;
  }
}
</style>
