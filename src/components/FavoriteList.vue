<script setup>
import { inject, onMounted, ref, watch } from "vue";

const emit = defineEmits(["select-font"]);

// 从父组件注入收藏相关的数据和方法
const favorites = inject("favorites");
const removeFavorite = inject("removeFavorite");
// 注入当前选中的字体
const selectedFont = inject("selectedFont", ref(""));

// 存储元素引用和已加载字体
const itemRefs = ref([]);
const loadedFonts = new Set();

// 选择字体
const selectFont = (fontName) => {
  emit("select-font", fontName);
};

// 加载字体资源
const loadFont = (fontName) => {
  if (loadedFonts.has(fontName)) return;
  loadedFonts.add(fontName);

  // 这里使用 Google Fonts 的示例，根据实际情况修改
  const fontId = fontName.replace(/\s+/g, "+");
  const link = document.createElement("link");
  link.href = `https://fonts.googleapis.com/css2?family=${fontId}&display=swap`;
  link.rel = "stylesheet";
  document.head.appendChild(link);
};

// 滚动到选中的字体
const scrollToSelectedFont = (fontName) => {
  if (!fontName || favorites.value.length === 0) return;

  // 延迟执行，确保DOM已更新
  setTimeout(() => {
    // 查找选中的字体元素
    const fontCards = document.querySelectorAll(".favorite-card");
    const fontIndex = favorites.value.indexOf(fontName);

    if (fontIndex >= 0 && fontCards[fontIndex]) {
      // 获取滚动容器
      const container = document.querySelector(".favorites-grid");
      if (container) {
        // 计算需要滚动的位置
        const cardTop = fontCards[fontIndex].offsetTop;
        container.scrollTo({
          top: cardTop,
          behavior: "smooth",
        });
      }
    }
  }, 100);
};

// 监听selectedFont变化
watch(
  () => selectedFont.value,
  (newFont) => {
    if (newFont && favorites.value.includes(newFont)) {
      scrollToSelectedFont(newFont);
    }
  }
);

// 初始化 Intersection Observer
onMounted(() => {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const fontName = entry.target.dataset.font;
          loadFont(fontName);
          observer.unobserve(entry.target);
        }
      });
    },
    { rootMargin: "0px 0px 100px 0px" }
  );

  itemRefs.value.forEach((el) => {
    if (el) observer.observe(el);
  });

  // 监听字体定位事件
  document.addEventListener("locateFontInList", (event) => {
    if (
      event.detail &&
      event.detail.fontName &&
      favorites.value.includes(event.detail.fontName)
    ) {
      scrollToSelectedFont(event.detail.fontName);
    }
  });
});
</script>

<template>
  <div class="favorites-container">
    <div class="favorites-header">
      <h2>收藏的字体</h2>
      <span class="favorites-count" v-if="favorites.length > 0">{{
        favorites.length
      }}</span>
    </div>

    <div v-if="favorites.length === 0" class="empty-state">
      <div class="empty-icon">
        <svg viewBox="0 0 24 24" width="48" height="48">
          <path
            fill="currentColor"
            d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
          />
        </svg>
      </div>
      <p>暂无收藏的字体</p>
      <span class="empty-hint">点击字体列表中的星标添加收藏</span>
    </div>

    <div v-else class="favorites-grid">
      <div
        v-for="(font, index) in favorites"
        :key="font"
        class="favorite-card"
        :class="{ 'is-selected': font === selectedFont }"
        @click="selectFont(font)"
        :data-font="font"
        :ref="(el) => (itemRefs[index] = el)"
      >
        <div class="card-content">
          <div class="font-name" :style="{ fontFamily: `'${font}'` }">
            {{ font }}
          </div>
          <div class="font-preview" :style="{ fontFamily: `'${font}'` }">
            AaBbCc 123 你好世界
          </div>
        </div>
        <button
          class="remove-btn"
          @click.stop="removeFavorite(font)"
          title="移除收藏"
          aria-label="移除收藏"
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
  </div>
</template>

<style scoped>
.favorites-container {
  background-color: var(--background-primary);
  border-radius: var(--radius-xl);
  padding: var(--spacing-lg);
  margin-top: var(--spacing-md);
  transition: all var(--transition-normal);
}

.favorites-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-md);

  padding-bottom: var(--spacing-sm);
  border-bottom: 1px solid var(--border-color);
}

.favorites-header h2 {
  font-size: 1.25rem;
  font-weight: 600;
  margin: 0;
  background: linear-gradient(135deg, var(--primary-color), var(--accent-color));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.favorites-count {
  background-color: var(--primary-color);
  color: white;
  border-radius: var(--radius-full);
  padding: 2px 8px;
  font-size: 0.75rem;
  font-weight: 600;
  min-width: 24px;
  text-align: center;
}

.empty-state {
  text-align: center;
  padding: var(--spacing-lg) 0;
  color: var(--text-tertiary);
}

.empty-icon {
  margin-bottom: var(--spacing-md);
  color: var(--text-tertiary);
  opacity: 0.5;
}

.empty-hint {
  display: block;
  margin-top: var(--spacing-md);
  font-size: 0.875rem;
  color: var(--text-tertiary);
}

.favorites-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(230px, 1fr));
  gap: var(--spacing-md);
  max-height: 180px;
  overflow-y: auto;
  padding-right: var(--spacing-xs);
}

.favorite-card {
  position: relative;
  background-color: var(--background-secondary);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-lg);
  padding: var(--spacing-sm);
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.favorite-card:hover {
  transform: translateY(-4px);
  background-color: var(--background-primary);
  border-color: var(--primary-color);
  box-shadow: var(--shadow-md);
}

.card-content {
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

.font-preview {
  font-size: 0.875rem;
  color: var(--text-secondary);
  line-height: 1.3;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
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
}

.favorite-card:hover .remove-btn {
  opacity: 1;
}

.remove-btn:hover {
  background-color: var(--danger-color);
  border-color: var(--danger-color);
  color: white;
  transform: scale(1.1);
}

.favorite-card.is-selected {
  background-color: var(--primary-color-10);
  border-color: var(--primary-color);
  box-shadow: 0 0 0 2px var(--primary-color-20);
}

@media (max-width: 870px) {
  .favorites-container {
    padding: var(--spacing-md);
  }

  .favorites-grid {
    grid-template-columns: 1fr;
  }
}
</style>
