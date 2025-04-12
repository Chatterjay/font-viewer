<script setup>
import { ref, computed, watch, onMounted } from "vue";

// 接收父组件传递的属性
const props = defineProps({
  selectedFont: {
    type: String,
    default: "",
  },
  isFavorite: {
    type: Boolean,
    default: false,
  },
  isCommercial: {
    type: Boolean,
    default: false,
  },
});

// 向父组件发送事件
const emit = defineEmits(["toggle-favorite", "toggle-commercial"]);

// 预览文本
const previewText = ref("你好，世界。汉字测试 AaBbCc 0123456789");
// 自定义文本
const customText = ref("");
// 是否使用默认文本
const useDefaultText = ref(true);
// 字体大小
const fontSize = ref(36);
// 字体加粗
const fontWeight = ref(400);
// 字体样式
const fontStyle = ref("normal");
// 字间距
const letterSpacing = ref(0);
// 行高
const lineHeight = ref(1.5);
// 预览背景颜色
const bgColor = ref("#ffffff");
// 预览文本颜色
const textColor = ref("#000000");
// 是否可编辑
const isEditing = ref(false);
// 对齐方式
const textAlign = ref("left");

// 字体样式对象
const fontStyles = computed(() => {
  return {
    fontFamily: props.selectedFont || "inherit",
    fontSize: `${fontSize.value}px`,
    fontWeight: fontStyle.value.includes("bold") ? 700 : fontWeight.value,
    fontStyle: fontStyle.value.includes("italic") ? "italic" : "normal",
    letterSpacing: `${letterSpacing.value}px`,
    lineHeight: lineHeight.value,
    backgroundColor: bgColor.value,
    color: textColor.value,
    textAlign: textAlign.value,
  };
});

// 显示的文本
const displayText = computed(() => {
  return useDefaultText.value ? previewText.value : customText.value;
});

// 切换收藏状态
const toggleFavorite = () => {
  emit("toggle-favorite", props.selectedFont);
};

// 切换商用标记
const toggleCommercial = () => {
  emit("toggle-commercial", props.selectedFont);
};

// 切换编辑状态
const toggleEditing = () => {
  isEditing.value = !isEditing.value;
};

// 更新自定义文本
const updateCustomText = (event) => {
  customText.value = event.target.value;
  useDefaultText.value = false;
};

// 重置预览设置
const resetSettings = () => {
  fontSize.value = 36;
  fontWeight.value = 400;
  fontStyle.value = "normal";
  letterSpacing.value = 0;
  lineHeight.value = 1.5;
  bgColor.value = "#ffffff";
  textColor.value = "#000000";
  textAlign.value = "left";
};

// 重置为默认文本
const resetToDefaultText = () => {
  useDefaultText.value = true;
};

// 复制CSS样式到剪贴板
const copyCss = () => {
  const css = `font-family: '${props.selectedFont}';
font-size: ${fontSize.value}px;
font-weight: ${fontStyle.value.includes("bold") ? 700 : fontWeight.value};
font-style: ${fontStyle.value.includes("italic") ? "italic" : "normal"};
letter-spacing: ${letterSpacing.value}px;
line-height: ${lineHeight.value};
text-align: ${textAlign.value};`;

  navigator.clipboard
    .writeText(css)
    .then(() => {
      alert("CSS样式已复制到剪贴板");
    })
    .catch((err) => {
      console.error("复制CSS样式失败:", err);
    });
};

// 监听字体变化
watch(
  () => props.selectedFont,
  (newFont) => {
    if (newFont) {
      // 不清空自定义文本，保持用户输入状态
    }
  }
);

onMounted(() => {
  // 初始化
  // 设置默认选中的选项焦点
  setTimeout(() => {
    const selects = document.querySelectorAll(".custom-select select");
    if (selects.length > 0) {
      selects.forEach((select) => {
        // 模拟一个默认选中的动画效果
        select.classList.add("initial-select");
        setTimeout(() => {
          select.classList.remove("initial-select");
        }, 300);
      });
    }
  }, 500);
});
</script>

<template>
  <div class="font-preview-container">
    <div class="preview-header">
      <div>
        <h2>字体预览</h2>
        <div class="selected-font" :style="{ fontFamily: selectedFont || 'inherit' }">
          {{ selectedFont || "请选择字体" }}
        </div>
        <div v-if="selectedFont" class="font-tip">
          <svg viewBox="0 0 24 24">
            <path
              fill="currentColor"
              d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"
            />
          </svg>
          如果字体切换后无变化，说明该字体不支持当前使用的文字，请尝试切换英文、日文等
        </div>
      </div>
      <div class="preview-actions">
        <button
          v-if="selectedFont"
          class="action-btn commercial-btn"
          :class="{ active: isCommercial }"
          @click="toggleCommercial"
          :title="isCommercial ? '取消商用标记' : '标记为商用字体'"
          type="button"
        >
          <svg viewBox="0 0 24 24" width="20" height="20">
            <path
              fill="currentColor"
              d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"
            />
          </svg>
          <span class="btn-text">{{ isCommercial ? '取消商用' : '商用字体' }}</span>
        </button>
        <button
          v-if="selectedFont"
          class="action-btn favorite-btn"
          :class="{ active: isFavorite }"
          @click="toggleFavorite"
          :title="isFavorite ? '取消收藏' : '收藏字体'"
          type="button"
        >
          <svg viewBox="0 0 24 24" width="20" height="20">
            <path
              fill="currentColor"
              :d="
                isFavorite
                  ? 'M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z'
                  : 'M16.5 3c-1.74 0-3.41.81-4.5 2.09C10.91 3.81 9.24 3 7.5 3 4.42 3 2 5.42 2 8.5c0 3.78 3.4 6.86 8.55 11.54L12 21.35l1.45-1.32C18.6 15.36 22 12.28 22 8.5 22 5.42 19.58 3 16.5 3zm-4.4 15.55l-.1.1-.1-.1C7.14 14.24 4 11.39 4 8.5 4 6.5 5.5 5 7.5 5c1.54 0 3.04.99 3.57 2.36h1.87C13.46 5.99 14.96 5 16.5 5c2 0 3.5 1.5 3.5 3.5 0 2.89-3.14 5.74-7.9 10.05z'
              "
            />
          </svg>
          <span class="btn-text">{{ isFavorite ? '取消收藏' : '收藏字体' }}</span>
        </button>
      </div>
    </div>

    <div v-if="!selectedFont" class="empty-preview">
      <div class="empty-preview-icon">
        <svg viewBox="0 0 24 24" width="64" height="64">
          <path fill="currentColor" d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8h5z" />
        </svg>
      </div>
      <p>请从字体列表中选择一个字体进行预览</p>
    </div>

    <div v-else class="preview-content">
      <div class="status-badges" v-if="isFavorite || isCommercial">
        <div v-if="isFavorite" class="status-badge favorite">
          <svg viewBox="0 0 24 24" width="16" height="16">
            <path
              fill="currentColor"
              d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"
            />
          </svg>
          已收藏
        </div>
        <div v-if="isCommercial" class="status-badge commercial">
          <svg viewBox="0 0 24 24" width="16" height="16">
            <path
              fill="currentColor"
              d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"
            />
          </svg>
          商用
        </div>
      </div>

      <div class="preview-settings">
        <div class="settings-row">
          <div class="setting">
            <label>字体大小</label>
            <div class="setting-control">
              <input type="range" min="8" max="120" v-model="fontSize" />
              <span class="setting-value">{{ fontSize }}px</span>
            </div>
          </div>
          <div class="setting">
            <label>字重</label>
            <div class="setting-control">
              <div class="custom-select">
                <select v-model="fontWeight">
                  <option value="100">Thin (100)</option>
                  <option value="200">ExtraLight (200)</option>
                  <option value="300">Light (300)</option>
                  <option value="400">Regular (400)</option>
                  <option value="500">Medium (500)</option>
                  <option value="600">SemiBold (600)</option>
                  <option value="700">Bold (700)</option>
                  <option value="800">ExtraBold (800)</option>
                  <option value="900">Black (900)</option>
                </select>
                <div class="select-arrow">
                  <svg viewBox="0 0 24 24" width="16" height="16">
                    <path fill="currentColor" d="M7 10l5 5 5-5z" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="settings-row">
          <div class="setting">
            <label>字体样式</label>
            <div class="setting-control">
              <div class="custom-select">
                <select v-model="fontStyle">
                  <option value="normal">正常</option>
                  <option value="italic">斜体</option>
                  <option value="bold">加粗</option>
                  <option value="italic bold">斜体加粗</option>
                </select>
                <div class="select-arrow">
                  <svg viewBox="0 0 24 24" width="16" height="16">
                    <path fill="currentColor" d="M7 10l5 5 5-5z" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
          <div class="setting">
            <label>字间距</label>
            <div class="setting-control">
              <input type="range" min="-5" max="20" v-model="letterSpacing" />
              <span class="setting-value">{{ letterSpacing }}px</span>
            </div>
          </div>
        </div>

        <div class="settings-row">
          <div class="setting">
            <label>行高</label>
            <div class="setting-control">
              <input type="range" min="0.5" max="3" step="0.1" v-model="lineHeight" />
              <span class="setting-value">{{ lineHeight }}</span>
            </div>
          </div>
          <div class="setting">
            <label>对齐方式</label>
            <div class="setting-control align-buttons">
              <button
                class="align-btn"
                :class="{ active: textAlign === 'left' }"
                @click="textAlign = 'left'"
                title="左对齐"
              >
                <svg viewBox="0 0 24 24" width="18" height="18">
                  <path
                    fill="currentColor"
                    d="M15 15H3v2h12v-2zm0-8H3v2h12V7zM3 13h18v-2H3v2zm0 8h18v-2H3v2z"
                  />
                </svg>
              </button>
              <button
                class="align-btn"
                :class="{ active: textAlign === 'center' }"
                @click="textAlign = 'center'"
                title="居中对齐"
              >
                <svg viewBox="0 0 24 24" width="18" height="18">
                  <path
                    fill="currentColor"
                    d="M7 15v2h10v-2H7zm-4 6h18v-2H3v2zm0-8h18v-2H3v2zm4-6v2h10V7H7zM3 3v2h18V3H3z"
                  />
                </svg>
              </button>
              <button
                class="align-btn"
                :class="{ active: textAlign === 'right' }"
                @click="textAlign = 'right'"
                title="右对齐"
              >
                <svg viewBox="0 0 24 24" width="18" height="18">
                  <path
                    fill="currentColor"
                    d="M3 21h18v-2H3v2zm6-4h12v-2H9v2zm-6-4h18v-2H3v2zm6-4h12V7H9v2zM3 3v2h18V3H3z"
                  />
                </svg>
              </button>
              <button
                class="align-btn"
                :class="{ active: textAlign === 'justify' }"
                @click="textAlign = 'justify'"
                title="两端对齐"
              >
                <svg viewBox="0 0 24 24" width="18" height="18">
                  <path
                    fill="currentColor"
                    d="M3 21h18v-2H3v2zm0-4h18v-2H3v2zm0-4h18v-2H3v2zm0-4h18V7H3v2zm0-6v2h18V3H3z"
                  />
                </svg>
              </button>
            </div>
          </div>
        </div>

        <div class="settings-row">
          <div class="setting">
            <label>背景颜色</label>
            <div class="setting-control">
              <div class="color-picker">
                <input type="color" v-model="bgColor" />
                <div class="color-preview" :style="{ backgroundColor: bgColor }"></div>
                <span class="color-value">{{ bgColor }}</span>
              </div>
            </div>
          </div>
          <div class="setting">
            <label>文字颜色</label>
            <div class="setting-control">
              <div class="color-picker">
                <input type="color" v-model="textColor" />
                <div class="color-preview" :style="{ backgroundColor: textColor }"></div>
                <span class="color-value">{{ textColor }}</span>
              </div>
            </div>
          </div>
        </div>

        <div class="settings-actions">
          <button class="secondary-btn" @click="resetSettings">重置设置</button>
          <button class="secondary-btn" @click="resetToDefaultText">恢复默认文本</button>
          <button class="primary-btn" @click="copyCss">复制CSS</button>
          <button class="edit-btn" @click="toggleEditing">
            {{ isEditing ? "完成编辑" : "编辑文本" }}
          </button>
        </div>
      </div>

      <div class="preview-area" :style="fontStyles">
        <textarea
          v-if="isEditing"
          v-model="customText"
          @input="updateCustomText"
          placeholder="输入自定义预览文本..."
          :style="fontStyles"
        ></textarea>
        <div
          v-else
          class="preview-text"
          :style="{ backgroundColor: bgColor, color: textColor }"
        >
          {{ displayText }}
        </div>
      </div>

      <div class="font-info" v-if="selectedFont">
        <div class="info-row">
          <div class="info-item">
            <h4>字体名称</h4>
            <p>{{ selectedFont }}</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.font-preview-container {
  background-color: var(--background-primary);
  border-radius: var(--radius-xl);
  overflow: hidden;
}

.preview-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-md);
  padding-bottom: var(--spacing-sm);
  border-bottom: 1px solid var(--border-color);
}

.preview-header h2 {
  font-size: 1.25rem;
  font-weight: 600;
  margin: 0;
  background: linear-gradient(135deg, var(--primary-color), var(--accent-color));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.selected-font {
  font-size: 1.1rem;
  font-weight: 600;
  margin-top: var(--spacing-xs);
  color: var(--text-primary);
}

.font-tip {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  margin-top: var(--spacing-xs);
  color: var(--text-tertiary);
  font-size: 0.75rem;
}

.font-tip svg {
  width: 14px;
  height: 14px;
  flex-shrink: 0;
}

.preview-actions {
  display: flex;
  gap: var(--spacing-sm);
}

.action-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 8px 16px;
  border-radius: var(--radius-lg);
  background-color: var(--background-secondary);
  border: 1px solid var(--border-color);
  color: var(--text-secondary);
  cursor: pointer;
  transition: all var(--transition-fast);
  font-size: 0.9rem;
  font-weight: 500;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
}

.action-btn svg {
  width: 18px;
  height: 18px;
  transition: transform 0.2s ease;
}

.action-btn:hover {
  background-color: var(--background-tertiary);
  transform: translateY(-2px);
  box-shadow: 0 3px 6px rgba(0, 0, 0, 0.1);
}

.action-btn:hover svg {
  transform: scale(1.2);
}

.action-btn:active {
  transform: translateY(0px);
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
}

.action-btn.commercial-btn:hover {
  color: var(--success-color);
  border-color: var(--success-color);
  background-color: rgba(var(--success-rgb), 0.1);
}

.action-btn.favorite-btn:hover {
  color: var(--warning-color);
  border-color: var(--warning-color);
  background-color: rgba(var(--warning-rgb), 0.1);
}

.action-btn.active.commercial-btn {
  background-color: var(--success-color);
  border-color: var(--success-color);
  color: white;
}

.action-btn.active.favorite-btn {
  background-color: var(--warning-color);
  border-color: var(--warning-color);
  color: white;
}

.empty-preview {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--spacing-xl) 0;
  color: var(--text-tertiary);
  text-align: center;
}

.empty-preview-icon {
  margin-bottom: var(--spacing-md);
  color: var(--text-tertiary);
  opacity: 0.5;
}

.preview-content {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}

.status-badges {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-xs);
  margin-bottom: var(--spacing-sm);
}

.status-badge {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  padding: var(--spacing-xs) var(--spacing-sm);
  border-radius: var(--radius-sm);
  font-size: 0.75rem;
  font-weight: 600;
}

.status-badge.favorite {
  background-color: rgba(var(--warning-rgb), 0.15);
  color: var(--warning-color);
  border: 1px solid rgba(var(--warning-rgb), 0.3);
}

.status-badge.commercial {
  background-color: rgba(var(--success-rgb), 0.15);
  color: var(--success-color);
  border: 1px solid rgba(var(--success-rgb), 0.3);
}

.preview-settings {
  background-color: var(--background-secondary);
  border-radius: var(--radius-lg);
  padding: var(--spacing-md);
  border: 1px solid var(--border-color);
}

.settings-row {
  display: flex;
  gap: var(--spacing-md);
  margin-bottom: var(--spacing-md);
}

.setting {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
}

.setting label {
  font-size: 0.875rem;
  color: var(--text-secondary);
}

.setting-control {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
}

.setting-control input[type="range"] {
  flex: 1;
  -webkit-appearance: none;
  height: 6px;
  border-radius: 3px;
  background: var(--background-tertiary);
  outline: none;
  transition: var(--transition-fast);
}

.setting-control input[type="range"]::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: var(--primary-color);
  cursor: pointer;
  transition: var(--transition-fast);
}

.setting-control input[type="range"]::-webkit-slider-thumb:hover {
  background: var(--primary-hover);
  transform: scale(1.1);
}

.setting-value {
  font-size: 0.875rem;
  color: var(--text-secondary);
  min-width: 40px;
  text-align: right;
}

.custom-select {
  position: relative;
  flex: 1;
  display: flex;
  align-items: center;
  z-index: 10;
}

.select-arrow {
  position: absolute;
  right: 10px;
  pointer-events: none;
  color: var(--text-tertiary);
  transition: transform 0.3s ease;
}

.custom-select:hover .select-arrow {
  color: var(--primary-color);
}

.custom-select:focus-within .select-arrow {
  transform: rotate(180deg);
  color: var(--primary-color);
}

.setting-control select {
  flex: 1;
  padding: var(--spacing-xs) var(--spacing-sm);
  border-radius: var(--radius-sm);
  border: 1px solid var(--border-color);
  background-color: var(--background-primary);
  color: var(--text-primary);
  outline: none;
  cursor: pointer;
  transition: all 0.3s ease;
  appearance: none;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
}

.setting-control select:hover {
  border-color: var(--primary-color);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  transform: translateY(-1px);
}

.setting-control select:focus {
  border-color: var(--primary-color);
  box-shadow: 0 0 0 2px rgba(var(--primary-rgb), 0.2);
  transform: translateY(-2px);
}

.custom-select::after {
  content: "";
  position: absolute;
  bottom: -2px;
  left: 0;
  width: 0;
  height: 2px;
  background: linear-gradient(to right, var(--primary-color), var(--accent-color));
  transition: width 0.3s ease;
  border-radius: 1px;
}

.custom-select:hover::after {
  width: 100%;
}

.custom-select:focus-within::after {
  width: 100%;
}

.setting-control select option {
  background-color: var(--background-primary);
  color: var(--text-primary);
  padding: 8px;
  opacity: 0;
  animation: optionFadeIn 0.3s ease forwards;
}

@keyframes optionFadeIn {
  from {
    opacity: 0;
    transform: translateY(-5px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* 为select添加展开动画的样式 */
select:focus {
  animation: selectExpand 0.3s ease;
}

@keyframes selectExpand {
  0% {
    max-height: 36px;
  }
  30% {
    max-height: 50px;
  }
  100% {
    max-height: 300px;
  }
}

/* 初始选择动画 */
.initial-select {
  animation: initialSelect 0.5s ease-out;
}

@keyframes initialSelect {
  0% {
    box-shadow: 0 0 0 1px rgba(var(--primary-rgb), 0.1);
  }
  50% {
    box-shadow: 0 0 0 3px rgba(var(--primary-rgb), 0.2);
    border-color: var(--primary-color);
  }
  100% {
    box-shadow: 0 0 0 1px rgba(var(--primary-rgb), 0.1);
  }
}

/* 统一设置select在打开时的样式 */
select:-moz-focusring {
  color: transparent;
  text-shadow: 0 0 0 var(--text-primary);
}

select:focus option {
  animation-delay: calc(0.05s * var(--index));
}

select option:first-child {
  --index: 0;
}

select option:nth-child(2) {
  --index: 1;
}

select option:nth-child(3) {
  --index: 2;
}

select option:nth-child(4) {
  --index: 3;
}

select option:nth-child(5) {
  --index: 4;
}

select option:nth-child(6) {
  --index: 5;
}

select option:nth-child(7) {
  --index: 6;
}

select option:nth-child(8) {
  --index: 7;
}

select option:nth-child(9) {
  --index: 8;
}

.align-buttons {
  display: flex;
  gap: var(--spacing-xs);
}

.align-btn {
  padding: var(--spacing-xs);
  border-radius: var(--radius-sm);
  background-color: var(--background-primary);
  border: 1px solid var(--border-color);
  color: var(--text-tertiary);
  cursor: pointer;
  transition: var(--transition-fast);
}

.align-btn:hover {
  background-color: var(--background-tertiary);
  color: var(--primary-color);
}

.align-btn.active {
  background-color: var(--primary-color);
  border-color: var(--primary-color);
  color: white;
}

.settings-actions {
  display: flex;
  justify-content: flex-end;
  gap: var(--spacing-sm);
  margin-top: var(--spacing-sm);
}

.primary-btn,
.secondary-btn,
.edit-btn {
  padding: var(--spacing-xs) var(--spacing-md);
  border-radius: var(--radius-md);
  font-size: 0.875rem;
  cursor: pointer;
  transition: var(--transition-fast);
}

.primary-btn {
  background-color: var(--primary-color);
  border: 1px solid var(--primary-color);
  color: white;
}

.primary-btn:hover {
  background-color: var(--primary-hover);
  transform: translateY(-2px);
}

.secondary-btn {
  background-color: var(--background-primary);
  border: 1px solid var(--border-color);
  color: var(--text-primary);
}

.secondary-btn:hover {
  background-color: var(--background-tertiary);
  border-color: var(--primary-color);
  color: var(--primary-color);
  transform: translateY(-2px);
}

.edit-btn {
  background-color: var(--background-primary);
  border: 1px solid var(--border-color);
  color: var(--text-primary);
}

.edit-btn:hover {
  background-color: var(--background-tertiary);
  border-color: var(--primary-color);
  color: var(--primary-color);
  transform: translateY(-2px);
}

.preview-area {
  min-height: 200px;
  border-radius: var(--radius-lg);
  padding: var(--spacing-lg);
  transition: all var(--transition-fast);
  overflow: auto;
}

.preview-text {
  word-wrap: break-word;
  white-space: pre-wrap;
}

.preview-area textarea {
  width: 100%;
  height: 100%;
  min-height: 200px;
  background: none;
  border: none;
  outline: none;
  resize: vertical;
  padding: 0;
  margin: 0;
  font: inherit;
}

.font-info {
  margin-top: var(--spacing-sm);
  padding: var(--spacing-md);
  background-color: var(--background-secondary);
  border-radius: var(--radius-lg);
  border: 1px solid var(--border-color);
}

.info-row {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-md);
}

.info-item {
  flex: 1;
  min-width: 200px;
}

.info-item h4 {
  font-size: 0.875rem;
  color: var(--text-secondary);
  margin: 0 0 var(--spacing-xs);
}

.info-item p {
  margin: 0;
  color: var(--text-primary);
  font-weight: 500;
}

.color-picker {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  position: relative;
}

.color-picker input[type="color"] {
  -webkit-appearance: none;
  width: 30px;
  height: 30px;
  border: none;
  padding: 0;
  border-radius: var(--radius-sm);
  cursor: pointer;
  background: transparent;
}

.color-picker input[type="color"]::-webkit-color-swatch-wrapper {
  padding: 0;
}

.color-picker input[type="color"]::-webkit-color-swatch {
  border: 1px solid var(--border-color);
  border-radius: var(--radius-sm);
}

.color-preview {
  width: 30px;
  height: 30px;
  border-radius: var(--radius-sm);
  border: 1px solid var(--border-color);
  position: absolute;
  left: 0;
  pointer-events: none;
}

.color-value {
  font-size: 0.875rem;
  color: var(--text-secondary);
  margin-left: 38px;
}

@media (max-width: 870px) {
  .settings-row {
    flex-direction: column;
    gap: var(--spacing-sm);
  }
}

@media (max-width: 768px) {
  .action-btn .btn-text {
    display: none;
  }
  
  .action-btn {
    padding: 8px;
  }
}
</style>
