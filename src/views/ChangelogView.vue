<template>
  <div class="changelog-view">
    <div class="changelog-container">
      <div class="changelog-header">
        <h1>更新日志</h1>
        <p class="subtitle">查看应用的完整更新历史记录</p>
      </div>

      <div class="changelog-content">
        <!-- 当前版本 -->
        <div class="current-version">
          <div class="version-badge">当前版本</div>
          <h2>{{ appInfo.VERSION }}</h2>
        </div>

        <!-- 时间线 -->
        <div class="version-timeline">
          <div 
            v-for="(version, index) in changelog" 
            :key="index"
            class="timeline-item"
          >
            <div class="timeline-header">
              <div class="version-details">
                <h3>{{ version.version }}</h3>
                <span class="version-date">{{ version.date }}</span>
              </div>
              <div 
                v-if="index === 0 && changelog.length > 1" 
                class="latest-tag"
              >
                最新版本
              </div>
            </div>

            <div class="timeline-content">
              <div class="change-groups">
                <!-- 特性更新 -->
                <div 
                  v-if="getChangesByType(version.changes, 'feature').length > 0" 
                  class="change-group feature-group"
                >
                  <h4>新功能</h4>
                  <ul>
                    <li 
                      v-for="(change, changeIndex) in getChangesByType(version.changes, 'feature')" 
                      :key="changeIndex"
                    >
                      {{ change.text }}
                    </li>
                  </ul>
                </div>

                <!-- 优化更新 -->
                <div 
                  v-if="getChangesByType(version.changes, 'improvement').length > 0" 
                  class="change-group improvement-group"
                >
                  <h4>优化</h4>
                  <ul>
                    <li 
                      v-for="(change, changeIndex) in getChangesByType(version.changes, 'improvement')" 
                      :key="changeIndex"
                    >
                      {{ change.text }}
                    </li>
                  </ul>
                </div>

                <!-- 修复更新 -->
                <div 
                  v-if="getChangesByType(version.changes, 'fix').length > 0" 
                  class="change-group fix-group"
                >
                  <h4>修复</h4>
                  <ul>
                    <li 
                      v-for="(change, changeIndex) in getChangesByType(version.changes, 'fix')" 
                      :key="changeIndex"
                    >
                      {{ change.text }}
                    </li>
                  </ul>
                </div>

                <!-- 其他更新 -->
                <div 
                  v-if="getChangesByType(version.changes, 'other').length > 0" 
                  class="change-group other-group"
                >
                  <h4>其他</h4>
                  <ul>
                    <li 
                      v-for="(change, changeIndex) in getChangesByType(version.changes, 'other')" 
                      :key="changeIndex"
                    >
                      {{ change.text }}
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 无更新日志 -->
        <div v-if="!changelog || changelog.length === 0" class="no-changelog">
          <p>暂无更新日志</p>
        </div>
      </div>

      <!-- 底部导航 -->
      <div class="changelog-footer">
        <button @click="goBack" class="back-btn">
          <svg viewBox="0 0 24 24" width="16" height="16">
            <path
              fill="currentColor"
              d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"
            />
          </svg>
          返回
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { CHANGELOG, APP_INFO } from '../constants/index';

// 路由实例
const router = useRouter();

// 数据
const changelog = ref([]);
const appInfo = APP_INFO;

// 按类型获取变更
const getChangesByType = (changes, type) => {
  if (!changes) return [];
  return changes.filter(change => change.type === type);
};

// 导航返回
const goBack = () => {
  router.back();
};

// 获取更新日志
const loadChangelog = async () => {
  try {
    // 使用全局常量中的更新日志
    if (CHANGELOG && CHANGELOG.length > 0) {
      changelog.value = CHANGELOG;
    } else {
      // 如果没有，则使用空数组
      changelog.value = [];
    }
  } catch (error) {
    console.error('加载更新日志失败:', error);
  }
};

// 组件挂载时获取更新日志
onMounted(() => {
  loadChangelog();
});
</script>

<style scoped>
.changelog-view {
  min-height: 100vh;
  background-color: var(--background-primary);
  color: var(--text-primary);
  padding: var(--spacing-lg);
  display: flex;
  justify-content: center;
}

.changelog-container {
  max-width: 800px;
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xl);
}

/* 页面头部 */
.changelog-header {
  text-align: center;
  margin-bottom: var(--spacing-lg);
}

.changelog-header h1 {
  font-size: 2rem;
  font-weight: 600;
  margin-bottom: var(--spacing-sm);
  color: var(--text-primary);
}

.subtitle {
  color: var(--text-secondary);
  font-size: 1rem;
}

/* 内容区域 */
.changelog-content {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xl);
  background-color: var(--background-secondary);
  border-radius: var(--radius-lg);
  padding: var(--spacing-xl);
  box-shadow: var(--shadow-md);
}

/* 当前版本 */
.current-version {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  padding-bottom: var(--spacing-lg);
  border-bottom: 1px solid var(--border-color);
}

.current-version h2 {
  font-size: 1.5rem;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0;
}

.version-badge {
  background-color: var(--primary-color);
  color: white;
  padding: var(--spacing-xs) var(--spacing-sm);
  border-radius: var(--radius-sm);
  font-size: 0.8rem;
  font-weight: 500;
}

/* 时间线 */
.version-timeline {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xl);
  position: relative;
}

.version-timeline::before {
  content: '';
  position: absolute;
  top: 0;
  bottom: 0;
  left: 1rem;
  width: 2px;
  background-color: var(--border-color);
  z-index: 0;
}

.timeline-item {
  position: relative;
  padding-left: calc(2rem + var(--spacing-md));
  margin-bottom: var(--spacing-xl);
}

.timeline-item::before {
  content: '';
  position: absolute;
  top: 0.5rem;
  left: 0;
  width: 2rem;
  height: 2rem;
  background-color: var(--background-tertiary);
  border: 2px solid var(--border-color);
  border-radius: 50%;
  z-index: 1;
}

.timeline-item:first-child::before {
  background-color: var(--primary-color);
  border-color: var(--primary-color);
}

.timeline-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-md);
}

.version-details {
  display: flex;
  align-items: baseline;
  gap: var(--spacing-md);
}

.version-details h3 {
  font-size: 1.2rem;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0;
}

.version-date {
  font-size: 0.9rem;
  color: var(--text-secondary);
}

.latest-tag {
  background-color: var(--info-bg);
  color: var(--info-color);
  padding: var(--spacing-xs) var(--spacing-sm);
  border-radius: var(--radius-sm);
  font-size: 0.8rem;
  font-weight: 500;
}

.timeline-content {
  background-color: var(--background-tertiary);
  border-radius: var(--radius-md);
  padding: var(--spacing-lg);
}

/* 变更分组 */
.change-groups {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg);
}

.change-group h4 {
  font-size: 1rem;
  font-weight: 600;
  margin-bottom: var(--spacing-sm);
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
}

.change-group h4::before {
  content: '';
  display: inline-block;
  width: 0.5rem;
  height: 0.5rem;
  border-radius: 50%;
}

.feature-group h4 {
  color: var(--info-color);
}

.feature-group h4::before {
  background-color: var(--info-color);
}

.improvement-group h4 {
  color: var(--success-color);
}

.improvement-group h4::before {
  background-color: var(--success-color);
}

.fix-group h4 {
  color: var(--warning-color);
}

.fix-group h4::before {
  background-color: var(--warning-color);
}

.other-group h4 {
  color: var(--text-secondary);
}

.other-group h4::before {
  background-color: var(--text-secondary);
}

.change-group ul {
  margin: 0;
  padding-left: 1.5rem;
}

.change-group li {
  margin-bottom: var(--spacing-sm);
  font-size: 0.95rem;
  color: var(--text-primary);
}

/* 无更新日志 */
.no-changelog {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: var(--spacing-xl);
  color: var(--text-tertiary);
  font-size: 1.1rem;
  font-style: italic;
  text-align: center;
}

/* 底部导航 */
.changelog-footer {
  display: flex;
  justify-content: flex-start;
  margin-top: var(--spacing-lg);
}

.back-btn {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-sm) var(--spacing-md);
  background-color: var(--background-secondary);
  color: var(--text-primary);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all 0.2s ease;
}

.back-btn:hover {
  background-color: var(--background-tertiary);
  transform: translateX(-3px);
}

/* 响应式调整 */
@media (max-width: 640px) {
  .changelog-container {
    padding: 0;
  }
  
  .changelog-content {
    padding: var(--spacing-md);
  }
  
  .timeline-item {
    padding-left: calc(1.5rem + var(--spacing-md));
  }
  
  .timeline-item::before {
    width: 1.5rem;
    height: 1.5rem;
  }
  
  .version-timeline::before {
    left: 0.75rem;
  }
  
  .version-details {
    flex-direction: column;
    align-items: flex-start;
    gap: var(--spacing-xs);
  }
  
  .timeline-header {
    flex-direction: column;
    align-items: flex-start;
    gap: var(--spacing-xs);
  }
}
</style> 