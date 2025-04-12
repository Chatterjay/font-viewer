<template>
  <div 
    v-if="isVisible" 
    class="update-notification"
    :class="{ 
      'expanded': isExpanded,
      'minimized': isMinimized && !isExpanded 
    }"
  >
    <!-- 最小化状态 -->
    <div v-if="isMinimized && !isExpanded" class="notification-badge" @click="expand">
      <div class="badge-content">
        <svg viewBox="0 0 24 24" width="16" height="16">
          <path
            fill="currentColor"
            d="M13 7h-2v4H7v2h4v4h2v-4h4v-2h-4V7zm-1-5C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"
          />
        </svg>
        <span>新版本可用</span>
      </div>
    </div>

    <!-- 展开状态 -->
    <div v-else class="notification-content">
      <div class="notification-header">
        <h3>发现新版本</h3>
        <div class="notification-actions">
          <button 
            v-if="!isMinimized" 
            class="action-btn minimize-btn" 
            @click="minimize"
            title="最小化"
          >
            <svg viewBox="0 0 24 24" width="16" height="16">
              <path
                fill="currentColor"
                d="M19 13H5v-2h14v2z"
              />
            </svg>
          </button>
          <button class="action-btn close-btn" @click="close" title="关闭">
            <svg viewBox="0 0 24 24" width="16" height="16">
              <path
                fill="currentColor"
                d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"
              />
            </svg>
          </button>
        </div>
      </div>

      <div class="notification-body">
        <p>
          当前版本: <strong>{{ currentVersion }}</strong> 
          &nbsp;&rarr;&nbsp;
          新版本: <strong>{{ newVersion }}</strong>
        </p>

        <div class="update-options">
          <button 
            class="primary-btn" 
            @click="startUpdate"
            :disabled="updating"
          >
            <span v-if="updating">
              <svg class="loading-spinner" viewBox="0 0 24 24" width="16" height="16">
                <circle
                  cx="12"
                  cy="12"
                  r="10"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="4"
                  stroke-dasharray="30 60"
                />
              </svg>
              正在更新...
            </span>
            <span v-else>立即更新</span>
          </button>
          <button class="secondary-btn" @click="remind">稍后提醒</button>
        </div>

        <div v-if="recentChanges.length > 0" class="recent-changes">
          <div class="recent-changes-header">
            <span>主要更新内容</span>
            <button 
              v-if="hasMoreChanges"
              class="view-all-btn" 
              @click="viewAllChanges"
            >
              查看完整更新日志
            </button>
          </div>
          <ul class="changes-list">
            <li 
              v-for="(change, index) in recentChanges" 
              :key="index"
              :class="`change-type-${change.type}`"
            >
              <span class="change-badge">{{ getTypeLabel(change.type) }}</span>
              {{ change.text }}
            </li>
          </ul>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';

// 组件属性
const props = defineProps({
  currentVersion: {
    type: String,
    required: true
  },
  newVersion: {
    type: String,
    required: true
  },
  changelog: {
    type: Array,
    default: () => []
  }
});

// 路由实例
const router = useRouter();

// 组件状态
const isVisible = ref(true);
const isExpanded = ref(true);
const isMinimized = ref(false);
const updating = ref(false);

// 关闭通知
const close = () => {
  isVisible.value = false;
};

// 最小化通知
const minimize = () => {
  isMinimized.value = true;
  isExpanded.value = false;
};

// 展开通知
const expand = () => {
  isExpanded.value = true;
};

// 开始更新
const startUpdate = async () => {
  updating.value = true;
  
  try {
    // 这里可以添加预更新检查
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // 导航到更新页面
    router.push('/update');
  } catch (error) {
    console.error('启动更新失败:', error);
    updating.value = false;
  }
};

// 稍后提醒
const remind = () => {
  // 隐藏通知，并设置一个定时器稍后再次显示
  isVisible.value = false;
  
  // 2小时后再次显示
  setTimeout(() => {
    isVisible.value = true;
    isExpanded.value = true;
    isMinimized.value = false;
  }, 2 * 60 * 60 * 1000);
};

// 查看完整更新日志
const viewAllChanges = () => {
  router.push('/changelog');
};

// 计算最近的变更（只显示最新版本的前3个变更）
const recentChanges = computed(() => {
  if (!props.changelog || props.changelog.length === 0) return [];
  
  // 获取最新版本的变更
  const latestVersion = props.changelog[0];
  if (!latestVersion || !latestVersion.changes) return [];
  
  // 返回前3个变更
  return latestVersion.changes.slice(0, 3);
});

// 是否有更多变更未显示
const hasMoreChanges = computed(() => {
  if (!props.changelog || props.changelog.length === 0) return false;
  
  // 检查是否有更多版本
  if (props.changelog.length > 1) return true;
  
  // 或者当前版本的变更数超过显示数量
  const latestVersion = props.changelog[0];
  return latestVersion && latestVersion.changes && latestVersion.changes.length > 3;
});

// 获取变更类型标签
const getTypeLabel = (type) => {
  const types = {
    feature: '新功能',
    improvement: '优化',
    fix: '修复',
    other: '其他'
  };
  return types[type] || '其他';
};
</script>

<style scoped>
.update-notification {
  position: fixed;
  bottom: 20px;
  right: 20px;
  background-color: var(--background-secondary);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-lg);
  border: 1px solid var(--border-color);
  z-index: 1000;
  transition: all 0.3s ease;
  max-width: 400px;
  width: calc(100% - 40px);
  overflow: hidden;
}

.update-notification.expanded {
  animation: slideIn 0.3s ease;
}

.update-notification.minimized {
  width: auto;
  max-width: 200px;
}

@keyframes slideIn {
  from {
    transform: translateY(100px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

/* 最小化状态 */
.notification-badge {
  cursor: pointer;
  padding: var(--spacing-sm) var(--spacing-md);
  display: flex;
  align-items: center;
  background-color: var(--info-bg);
  color: var(--info-color);
  font-weight: 500;
  font-size: 0.9rem;
  transition: all 0.2s ease;
}

.notification-badge:hover {
  background-color: var(--info-color);
  color: white;
}

.badge-content {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
}

/* 展开状态 */
.notification-content {
  display: flex;
  flex-direction: column;
}

.notification-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--spacing-md) var(--spacing-lg);
  border-bottom: 1px solid var(--border-subtle);
  background-color: var(--background-tertiary);
}

.notification-header h3 {
  margin: 0;
  font-size: 1.1rem;
  font-weight: 600;
  color: var(--text-primary);
}

.notification-actions {
  display: flex;
  gap: var(--spacing-sm);
}

.action-btn {
  padding: var(--spacing-xs);
  border-radius: var(--radius-sm);
  background-color: transparent;
  color: var(--text-secondary);
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

.action-btn:hover {
  background-color: var(--background-secondary);
  color: var(--text-primary);
}

.close-btn:hover {
  color: var(--error-color);
}

.notification-body {
  padding: var(--spacing-lg);
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}

.notification-body p {
  margin: 0;
  color: var(--text-secondary);
  font-size: 0.9rem;
}

.update-options {
  display: flex;
  gap: var(--spacing-md);
  margin-top: var(--spacing-sm);
}

.primary-btn {
  background-color: var(--primary-color);
  color: white;
  border: none;
  border-radius: var(--radius-md);
  padding: var(--spacing-md) var(--spacing-lg);
  font-size: 0.9rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-sm);
}

.primary-btn:hover:not(:disabled) {
  background-color: var(--primary-hover);
  transform: translateY(-2px);
}

.primary-btn:disabled {
  background-color: var(--background-tertiary);
  color: var(--text-secondary);
  cursor: not-allowed;
}

.secondary-btn {
  background-color: var(--background-tertiary);
  color: var(--text-secondary);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  padding: var(--spacing-md) var(--spacing-lg);
  font-size: 0.9rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.secondary-btn:hover {
  background-color: var(--background-quaternary);
  color: var(--text-primary);
  transform: translateY(-2px);
}

.loading-spinner {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

/* 最近更新内容 */
.recent-changes {
  margin-top: var(--spacing-md);
  border-top: 1px solid var(--border-subtle);
  padding-top: var(--spacing-md);
}

.recent-changes-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-sm);
}

.recent-changes-header span {
  font-size: 0.9rem;
  font-weight: 500;
  color: var(--text-secondary);
}

.view-all-btn {
  font-size: 0.8rem;
  color: var(--info-color);
  background: none;
  border: none;
  padding: 0;
  cursor: pointer;
  text-decoration: underline;
}

.view-all-btn:hover {
  color: var(--primary-hover);
}

.changes-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

.changes-list li {
  font-size: 0.85rem;
  color: var(--text-primary);
  padding: var(--spacing-xs) 0;
  display: flex;
  align-items: flex-start;
  gap: var(--spacing-sm);
}

.change-badge {
  padding: 2px 6px;
  border-radius: var(--radius-sm);
  font-size: 0.7rem;
  font-weight: 500;
  flex-shrink: 0;
}

.change-type-feature .change-badge {
  background-color: var(--info-bg);
  color: var(--info-color);
}

.change-type-improvement .change-badge {
  background-color: var(--success-bg);
  color: var(--success-color);
}

.change-type-fix .change-badge {
  background-color: var(--warning-bg);
  color: var(--warning-color);
}

.change-type-other .change-badge {
  background-color: var(--background-tertiary);
  color: var(--text-secondary);
}

/* 响应式调整 */
@media (max-width: 480px) {
  .update-notification {
    bottom: 10px;
    right: 10px;
    width: calc(100% - 20px);
  }
  
  .update-options {
    flex-direction: column;
  }
}
</style> 