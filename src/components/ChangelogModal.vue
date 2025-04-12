<script setup>
import { ref, onMounted, watch } from 'vue';
import { CHANGELOG } from '../constants/index.js';

// 接收props
const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  },
  currentVersion: {
    type: String,
    default: 'v1.0.0'
  }
});

// 定义事件
const emit = defineEmits(['close']);

// 弹窗动画状态
const isClosing = ref(false);

// 更新日志数据 - 从常量导入
const changelogs = ref(CHANGELOG);

// 处理关闭弹窗
const handleClose = () => {
  isClosing.value = true;
  
  // 等待动画结束后才真正关闭
  setTimeout(() => {
    isClosing.value = false;
    emit('close');
  }, 300);
};

// 点击背景关闭弹窗
const handleBackdropClick = (event) => {
  // 仅当点击到背景而不是内容区域时关闭
  if (event.target.classList.contains('modal-backdrop')) {
    handleClose();
  }
};

// 监听可见性变化
watch(() => props.visible, (newVal) => {
  if (newVal) {
    // 弹窗打开时，禁止背景滚动
    document.body.style.overflow = 'hidden';
  } else {
    // 弹窗关闭时，恢复背景滚动
    document.body.style.overflow = '';
  }
});

// 组件卸载时确保恢复滚动
onMounted(() => {
  const handleEsc = (e) => {
    if (e.key === 'Escape' && props.visible) {
      handleClose();
    }
  };
  
  // 添加ESC键关闭功能
  document.addEventListener('keydown', handleEsc);
  
  return () => {
    document.removeEventListener('keydown', handleEsc);
    document.body.style.overflow = '';
  };
});
</script>

<template>
  <div
    v-if="visible"
    class="modal-backdrop"
    :class="{ 'closing': isClosing }"
    @click="handleBackdropClick"
  >
    <div class="modal-content changelog-modal">
      <div class="modal-header">
        <h2>更新日志</h2>
        <button class="close-btn" @click="handleClose">
          <svg viewBox="0 0 24 24" width="20" height="20">
            <path fill="currentColor" d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
          </svg>
        </button>
      </div>
      
      <div class="modal-body">
        <div class="current-version">当前版本: {{ currentVersion }}</div>
        
        <div class="changelog-list">
          <div v-for="log in changelogs" :key="log.version" class="changelog-item">
            <div class="version-header">
              <h3>{{ log.version }}</h3>
              <span class="version-date">{{ log.date }}</span>
            </div>
            
            <ul class="change-list">
              <li v-for="(change, idx) in log.changes" :key="idx" :class="change.type">
                <span class="change-badge" :class="change.type">
                  {{ change.type === 'feature' ? '新功能' : 
                     change.type === 'improvement' ? '优化' : 
                     change.type === 'fix' ? '修复' : '变更' }}
                </span>
                {{ change.text }}
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* 模态框背景 */
.modal-backdrop {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  z-index: 2000;
  display: flex;
  align-items: center;
  justify-content: center;
  animation: backdrop-appear 0.3s ease-out forwards;
}

.modal-backdrop.closing {
  animation: backdrop-disappear 0.3s ease-out forwards;
}

@keyframes backdrop-appear {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes backdrop-disappear {
  from {
    opacity: 1;
  }
  to {
    opacity: 0;
  }
}

/* 模态框内容 */
.modal-content {
  background-color: var(--background-primary);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-lg);
  width: 90%;
  max-width: 600px;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
  animation: modal-appear 0.3s ease-out forwards;
  overflow: hidden;
}

.modal-backdrop.closing .modal-content {
  animation: modal-disappear 0.3s ease-out forwards;
}

@keyframes modal-appear {
  from {
    opacity: 0;
    transform: scale(0.9);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

@keyframes modal-disappear {
  from {
    opacity: 1;
    transform: scale(1);
  }
  to {
    opacity: 0;
    transform: scale(0.9);
  }
}

/* 模态框头部 */
.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 15px 20px;
  border-bottom: 1px solid var(--border-color);
}

.modal-header h2 {
  margin: 0;
  font-size: 1.25rem;
  color: var(--text-primary);
}

.close-btn {
  background: none;
  border: none;
  color: var(--text-secondary);
  cursor: pointer;
  width: 30px;
  height: 30px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

.close-btn:hover {
  background-color: var(--background-tertiary);
  color: var(--text-primary);
}

/* 模态框内容区 */
.modal-body {
  padding: 20px;
  overflow-y: auto;
  flex: 1;
}

/* 当前版本信息 */
.current-version {
  font-size: 0.9rem;
  color: var(--text-secondary);
  margin-bottom: 20px;
  padding: 8px 12px;
  background-color: var(--background-secondary);
  border-radius: var(--radius-md);
  display: inline-block;
}

/* 更新日志列表 */
.changelog-list {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.changelog-item {
  padding-bottom: 20px;
  border-bottom: 1px dashed var(--border-color);
}

.changelog-item:last-child {
  border-bottom: none;
  padding-bottom: 0;
}

.version-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.version-header h3 {
  margin: 0;
  font-size: 1.1rem;
  color: var(--text-primary);
}

.version-date {
  font-size: 0.85rem;
  color: var(--text-secondary);
}

/* 变更列表 */
.change-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.change-list li {
  display: flex;
  align-items: flex-start;
  line-height: 1.5;
  color: var(--text-primary);
  font-size: 0.95rem;
}

.change-badge {
  display: inline-block;
  padding: 2px 6px;
  border-radius: var(--radius-sm);
  font-size: 0.75rem;
  margin-right: 8px;
  flex-shrink: 0;
  text-align: center;
  min-width: 48px;
}

.change-badge.feature {
  background-color: var(--success-color);
  color: white;
}

.change-badge.improvement {
  background-color: var(--primary-color);
  color: white;
}

.change-badge.fix {
  background-color: var(--warning-color);
  color: white;
}

/* 响应式样式 */
@media (max-width: 650px) {
  .modal-content {
    width: 95%;
    max-height: 85vh;
  }
  
  .version-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 4px;
  }
}
</style> 