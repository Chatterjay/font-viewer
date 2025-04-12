<template>
  <div class="loading-wrapper" :class="{ small, overlay }">
    <div v-if="overlay" class="overlay-background"></div>
    <div class="spinner-container">
      <div class="spinner">
        <div class="spinner-inner">
          <div class="spinner-circle"></div>
          <div class="spinner-circle-outer"></div>
        </div>
      </div>
      <div v-if="showText" class="loading-text">
        <slot>{{ text }}</slot>
      </div>
      <div v-if="progress > 0" class="progress-bar">
        <div class="progress-fill" :style="{ width: `${progress}%` }"></div>
        <div class="progress-text">{{ progress }}%</div>
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  text: {
    type: String,
    default: "加载中...",
  },
  showText: {
    type: Boolean,
    default: true,
  },
  small: {
    type: Boolean,
    default: false,
  },
  overlay: {
    type: Boolean,
    default: false,
  },
  progress: {
    type: Number,
    default: 0,
  },
});
</script>

<style scoped>
.loading-wrapper {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 2rem;
  position: relative;
}

.loading-wrapper.overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 100;
  padding: 0;
}

.overlay-background {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: var(--background-primary);
  opacity: 0.85;
  backdrop-filter: blur(4px);
}

.spinner-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  position: relative;
  z-index: 101;
}

.spinner {
  width: 60px;
  height: 60px;
  position: relative;
}

.loading-wrapper.small .spinner {
  width: 30px;
  height: 30px;
}

.spinner-inner {
  position: relative;
  width: 100%;
  height: 100%;
  animation: spin 2s linear infinite;
}

.spinner-circle {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  border: 3px solid transparent;
  border-top-color: var(--primary-color);
  position: absolute;
  animation: spin-reverse 1s linear infinite;
}

.spinner-circle-outer {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  border: 3px solid transparent;
  border-bottom-color: var(--accent-color);
  position: absolute;
  animation: spin 1.5s linear infinite;
}

.loading-wrapper.small .spinner-circle,
.loading-wrapper.small .spinner-circle-outer {
  border-width: 2px;
}

.loading-text {
  margin-top: 1rem;
  color: var(--text-secondary);
  font-size: 1rem;
  text-align: center;
  animation: pulse 1.5s ease infinite alternate;
}

.loading-wrapper.small .loading-text {
  margin-top: 0.5rem;
  font-size: 0.8rem;
}

.progress-bar {
  margin-top: 1rem;
  width: 200px;
  height: 6px;
  background-color: var(--background-tertiary);
  border-radius: 3px;
  overflow: hidden;
  position: relative;
}

.loading-wrapper.small .progress-bar {
  margin-top: 0.5rem;
  width: 100px;
  height: 4px;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(to right, var(--primary-color), var(--accent-color));
  border-radius: 3px;
  transition: width 0.3s ease;
}

.progress-text {
  position: absolute;
  top: -18px;
  right: 0;
  font-size: 0.8rem;
  color: var(--text-secondary);
}

.loading-wrapper.small .progress-text {
  top: -16px;
  font-size: 0.7rem;
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

@keyframes spin-reverse {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(-360deg);
  }
}

@keyframes pulse {
  0% {
    opacity: 0.6;
  }
  100% {
    opacity: 1;
  }
}

/* 高对比度模式适配 */
[data-theme="high-contrast"] .spinner-circle {
  border-top-color: black;
}

[data-theme="high-contrast"] .spinner-circle-outer {
  border-bottom-color: black;
}

[data-theme="high-contrast"] .progress-fill {
  background: black;
}

[data-theme="high-contrast"] .loading-text,
[data-theme="high-contrast"] .progress-text {
  color: black;
  animation: none;
}
</style>
