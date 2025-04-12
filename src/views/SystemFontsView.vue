<script setup>
import { ref, onMounted } from "vue";
import FontList from "../components/FontList.vue";
import FontPreview from "../components/FontPreview.vue";

const fonts = ref([]);
const favorites = ref([]);
const commercialFonts = ref([]);
const currentFont = ref("");
const isLoading = ref(true);
const error = ref(null);

const selectFont = (font) => {
  currentFont.value = font;
};
</script>

<template>
  <div class="system-fonts-view">
    <FontList
      :fonts="fonts"
      :favorites="favorites"
      :commercial-fonts="commercialFonts"
      :current-font="currentFont"
      @select-font="selectFont"
    />
    <FontPreview
      :font="currentFont"
      :favorites="favorites"
      :commercial-fonts="commercialFonts"
      @toggle-favorite="toggleFavorite"
      @toggle-commercial="toggleCommercial"
    />
  </div>
</template>
