import { ref, onMounted } from "vue";
import { invoke } from "@tauri-apps/api/tauri";

// 获取系统字体
const getSystemFonts = async () => {
  try {
    const fonts = await invoke('get_system_fonts');
    systemFonts.value = fonts.map(font => ({
      name: font.name,
      family: font.family,
      style: font.style,
      path: font.path
    }));
    loading.value = false;
  } catch (error) {
    console.error('获取系统字体失败:', error);
    loading.value = false;
  }
}; 