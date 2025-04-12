<template>
  <div class="update-view">
    <div class="update-container">
      <div class="update-header">
        <h1>{{ state.completed ? '更新完成' : '正在更新...' }}</h1>
        <div class="app-version">
          <span>当前版本: {{ state.currentVersion }}</span>
          <span v-if="state.newVersion"> → </span>
          <span v-if="state.newVersion">新版本: {{ state.newVersion }}</span>
        </div>
      </div>

      <!-- 更新进度 -->
      <div v-if="!state.completed" class="progress-section">
        <div class="progress-bar">
          <div 
            class="progress-fill"
            :style="{ width: `${state.progress}%` }"
          ></div>
        </div>
        <div class="progress-text">{{ state.statusText }}</div>
        <div v-if="state.errorMessage" class="error-message">
          {{ state.errorMessage }}
        </div>
      </div>

      <!-- 更新完成 -->
      <div v-else class="completed-section">
        <div class="success-icon">
          <svg viewBox="0 0 24 24" width="48" height="48">
            <path
              fill="currentColor"
              d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"
            />
          </svg>
        </div>
        <p>应用已更新至最新版本，请查看下方更新日志了解详情。</p>
        <button @click="restart" class="restart-btn">重启应用</button>
      </div>

      <!-- 更新日志 -->
      <div v-if="state.changelog.length > 0" class="changelog-section">
        <h2>更新日志</h2>
        <div class="changelog-list">
          <div 
            v-for="(version, index) in state.changelog" 
            :key="index"
            class="changelog-item"
          >
            <div class="version-header">
              <h3>{{ version.version }}</h3>
              <span class="version-date">{{ version.date }}</span>
            </div>

            <ul class="changes-list">
              <li 
                v-for="(change, changeIndex) in version.changes" 
                :key="changeIndex"
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
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue';
import { APP_INITIAL_VERSION } from '../constants';

// 更新状态
const state = reactive({
  progress: 0,
  statusText: '正在检查更新...',
  completed: false,
  errorMessage: '',
  currentVersion: APP_INITIAL_VERSION,
  newVersion: 'v1.2.0', // 模拟版本
  changelog: [
    {
      version: 'v1.2.0',
      date: '2023-12-25',
      changes: [
        { type: 'feature', text: '添加新的字体过滤功能' },
        { type: 'improvement', text: '优化了字体预览性能' },
        { type: 'fix', text: '修复了收藏夹显示问题' }
      ]
    }
  ]
});

// 计算进度条函数
const updateProgress = (progress, status) => {
  state.progress = progress;
  if (status) {
    state.statusText = status;
  }
};

// 获取更新类型标签
const getTypeLabel = (type) => {
  const types = {
    feature: '新功能',
    improvement: '优化',
    fix: '修复',
    other: '其他'
  };
  return types[type] || '其他';
};

// 模拟更新过程
const simulateUpdate = async () => {
  try {
    // 步骤1: 检查更新
    updateProgress(10, '正在检查更新...');
    await new Promise(resolve => setTimeout(resolve, 800));
    
    // 步骤3: 下载更新
    updateProgress(30, '正在下载更新...');
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // 步骤4: 验证更新包
    updateProgress(60, '正在验证更新包...');
    await new Promise(resolve => setTimeout(resolve, 800));
    
    // 步骤5: 应用更新
    updateProgress(80, '正在应用更新...');
    await new Promise(resolve => setTimeout(resolve, 1200));
    
    // 步骤6: 获取更新日志
    updateProgress(90, '正在获取更新日志...');
    await new Promise(resolve => setTimeout(resolve, 800));
    
    // 完成更新
    updateProgress(100, '更新完成');
    state.completed = true;
    
  } catch (error) {
    console.error('更新过程中发生错误:', error);
    state.errorMessage = `更新失败: ${error.message || '未知错误'}`;
  }
};

// 重启应用
const restart = () => {
  // 在实际应用中，这里应调用Tauri API重启应用
  alert('应用将重新启动以完成更新');
  window.location.reload();
};

// 组件挂载时开始更新流程
onMounted(() => {
  simulateUpdate();
});
</script>

<style scoped>
.update-view {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  background-color: var(--background-primary);
  color: var(--text-primary);
  padding: var(--spacing-lg);
}

.update-container {
  max-width: 600px;
  width: 100%;
  background-color: var(--background-secondary);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-lg);
  padding: var(--spacing-xl);
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg);
}

.update-header {
  text-align: center;
  margin-bottom: var(--spacing-lg);
}

.update-header h1 {
  font-size: 1.8rem;
  margin-bottom: var(--spacing-md);
  color: var(--text-primary);
  font-weight: 600;
}

.app-version {
  font-size: 0.9rem;
  color: var(--text-secondary);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-sm);
}

/* 进度条样式 */
.progress-section {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}

.progress-bar {
  width: 100%;
  height: 8px;
  background-color: var(--background-tertiary);
  border-radius: 4px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background-color: var(--primary-color);
  border-radius: 4px;
  transition: width 0.3s ease;
}

.progress-text {
  text-align: center;
  font-size: 0.9rem;
  color: var(--text-secondary);
}

.error-message {
  margin-top: var(--spacing-md);
  color: var(--error-color);
  text-align: center;
  padding: var(--spacing-md);
  background-color: var(--error-bg);
  border-radius: var(--radius-md);
  font-size: 0.9rem;
}

/* 完成状态样式 */
.completed-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--spacing-lg);
  margin: var(--spacing-lg) 0;
}

.success-icon {
  color: var(--success-color);
  background-color: var(--success-bg);
  width: 64px;
  height: 64px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.restart-btn {
  background-color: var(--primary-color);
  color: white;
  border: none;
  border-radius: var(--radius-md);
  padding: var(--spacing-md) var(--spacing-xl);
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.restart-btn:hover {
  background-color: var(--primary-hover);
  transform: translateY(-2px);
}

/* 更新日志样式 */
.changelog-section {
  margin-top: var(--spacing-xl);
  border-top: 1px solid var(--border-color);
  padding-top: var(--spacing-lg);
}

.changelog-section h2 {
  font-size: 1.4rem;
  margin-bottom: var(--spacing-lg);
  color: var(--text-primary);
  font-weight: 600;
}

.changelog-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xl);
}

.changelog-item {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}

.version-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid var(--border-subtle);
  padding-bottom: var(--spacing-sm);
}

.version-header h3 {
  font-size: 1.2rem;
  color: var(--text-primary);
  font-weight: 600;
}

.version-date {
  font-size: 0.8rem;
  color: var(--text-tertiary);
}

.changes-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
  list-style: none;
  padding: 0;
}

.changes-list li {
  font-size: 0.9rem;
  color: var(--text-primary);
  padding: var(--spacing-sm) 0;
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
}

.change-badge {
  padding: 2px 6px;
  border-radius: var(--radius-sm);
  font-size: 0.75rem;
  font-weight: 500;
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
@media (max-width: 640px) {
  .update-container {
    padding: var(--spacing-lg);
  }
  
  .update-header h1 {
    font-size: 1.5rem;
  }
  
  .version-header {
    flex-direction: column;
    align-items: flex-start;
    gap: var(--spacing-xs);
  }
}
</style> 