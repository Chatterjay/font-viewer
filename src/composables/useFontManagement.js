import { ref, computed } from 'vue';
import { invoke } from "@tauri-apps/api/tauri";
import { saveToStorage, getFromStorage } from "../utils/storage";
import { STORAGE_KEYS } from "../constants";

/**
 * 字体管理组合式函数
 * 提取自App.vue，集中管理字体相关的逻辑
 */
export function useFontManagement() {
    // 字体数据
    const fonts = ref([]);
    const loading = ref(true);
    const selectedFont = ref("");
    const favorites = ref([]);
    const commercialFonts = ref(new Set());

    // 从localStorage加载收藏的字体
    const loadFavorites = () => {
        favorites.value = getFromStorage(STORAGE_KEYS.FAVORITES, []);
    };

    // 从localStorage加载商用字体
    const loadCommercialFonts = () => {
        const savedFonts = getFromStorage(STORAGE_KEYS.COMMERCIAL_FONTS, []);
        commercialFonts.value = new Set(savedFonts);
    };

    // 保存收藏的字体到localStorage
    const saveFavorites = () => {
        saveToStorage(STORAGE_KEYS.FAVORITES, favorites.value);
    };

    // 保存商用字体到localStorage
    const saveCommercialFonts = () => {
        saveToStorage(STORAGE_KEYS.COMMERCIAL_FONTS, Array.from(commercialFonts.value));
    };

    // 切换收藏状态
    const toggleFavorite = (fontName) => {
        if (favorites.value.includes(fontName)) {
            favorites.value = favorites.value.filter((name) => name !== fontName);
        } else {
            favorites.value.push(fontName);
        }
        saveFavorites();
    };

    // 切换商用状态
    const toggleCommercial = (fontName) => {
        if (commercialFonts.value.has(fontName)) {
            commercialFonts.value.delete(fontName);
        } else {
            commercialFonts.value.add(fontName);
        }
        saveCommercialFonts();
    };

    // 批量移除收藏
    const batchRemoveFavorites = (fontNames) => {
        fontNames.forEach((fontName) => {
            favorites.value = favorites.value.filter((name) => name !== fontName);
        });
        saveFavorites();
    };

    // 批量移除商用标记
    const batchRemoveCommercial = (fontNames) => {
        fontNames.forEach((fontName) => {
            commercialFonts.value.delete(fontName);
        });
        saveCommercialFonts();
    };

    // 移除收藏
    const removeFavorite = (fontName) => {
        favorites.value = favorites.value.filter((name) => name !== fontName);
        saveFavorites();
    };

    // 处理字体选择
    const handleSelectFont = (fontName) => {
        selectedFont.value = fontName;
    };

    // 获取系统字体
    const getSystemFonts = async () => {
        try {
            // 使用内存缓存避免不必要的调用
            loading.value = true;
            const result = await invoke("get_system_fonts");
            fonts.value = result.map((font) => ({
                name: font.name,
                family: font.family,
                style: font.style,
                path: font.path,
            }));
            loading.value = false;
        } catch (error) {
            console.error("获取系统字体失败:", error);
            loading.value = false;
        }
    };

    // 计算商用字体数量
    const commercialCount = computed(() => commercialFonts.value.size);

    return {
        fonts,
        loading,
        selectedFont,
        favorites,
        commercialFonts,
        commercialCount,
        loadFavorites,
        loadCommercialFonts,
        toggleFavorite,
        toggleCommercial,
        batchRemoveFavorites,
        batchRemoveCommercial,
        removeFavorite,
        handleSelectFont,
        getSystemFonts
    };
} 