/**
 * 应用常量配置
 */
import { GITHUB_REPO_URL } from './github.js'
import { CURRENT_VERSION, VERSION_HISTORY } from './version.js';

// 存储键名
export const STORAGE_KEYS = {
    FAVORITES: 'font-viewer-favorites',
    COMMERCIAL_FONTS: 'commercialFonts',
    THEME: 'font-viewer-theme',
    LAYOUT: 'font-viewer-layout',
    PAGE_MODE: 'pageMode',
    SETTINGS: 'font-viewer-settings',
    HISTORY: 'font-viewer-history',
    DISMISSED_TIPS: 'font-viewer-dismissed-tips',
};

// 主题模式
export const THEME_MODES = {
    LIGHT: 'light',
    DARK: 'dark',
    SYSTEM: 'system',
};

// 布局模式
export const LAYOUT_MODES = {
    VERTICAL: 'vertical',
    HORIZONTAL: 'horizontal',
    SIDE_BY_SIDE: 'side-by-side',
    STACKED: 'stacked',
};

// 分页配置
export const PAGINATION = {
    PAGE_SIZE: 20,
};

// 响应式断点
export const BREAKPOINTS = {
    MOBILE: 640,
    TABLET: 1024,
    DESKTOP: 1440,
};

// 动画配置
export const ANIMATION = {
    DURATION: {
        FAST: 150,
        NORMAL: 250,
        SLOW: 400,
    },
    EASING: 'ease-in-out',
};

// 应用版本
export const APP_INITIAL_VERSION = CURRENT_VERSION;

// 更新日志 - 使用VERSION_HISTORY
export const CHANGELOG = VERSION_HISTORY;

// 应用状态
export const APP_STATUS = {
    INITIALIZING: 'initializing',
    LOADING: 'loading',
    READY: 'ready',
    ERROR: 'error',
};

// 主题选项
export const THEME_OPTIONS = [
    { value: 'system', label: '跟随系统' },
    { value: 'light', label: '浅色模式' },
    { value: 'dark', label: '深色模式' },
    { value: 'sepia', label: '护眼模式' }
];

// 字体大小选项
export const FONT_SIZE_OPTIONS = [
    { value: 12, label: '12px' },
    { value: 14, label: '14px' },
    { value: 16, label: '16px' },
    { value: 18, label: '18px' },
    { value: 20, label: '20px' },
    { value: 24, label: '24px' },
    { value: 28, label: '28px' },
    { value: 32, label: '32px' },
    { value: 36, label: '36px' },
    { value: 42, label: '42px' },
    { value: 48, label: '48px' },
    { value: 64, label: '64px' },
    { value: 72, label: '72px' },
    { value: 96, label: '96px' },
    { value: 120, label: '120px' },
];

// 字体分类
export const FONT_CATEGORIES = {
    ALL: 'all',
    SANS_SERIF: 'sans-serif',
    SERIF: 'serif',
    MONOSPACE: 'monospace',
    DISPLAY: 'display',
    HANDWRITING: 'handwriting',
    OTHER: 'other',
};

// 程序信息
export const APP_INFO = {
    NAME: 'font-viewer',
    VERSION: CURRENT_VERSION,
    AUTHOR: 'Chatterjay',
    REPOSITORY: GITHUB_REPO_URL,
    COPYRIGHT: `© ${new Date().getFullYear()} Chatterjay`,
};

// 字体列表中每页显示的字体数量
export const FONTS_PER_PAGE = 20;

// 最大历史记录数量
export const MAX_HISTORY_ITEMS = 50;

// 默认设置
export const DEFAULT_SETTINGS = {
    fontSize: 36,
    showFontFamily: true,
    showCategory: true,
    showPreviewText: true,
    customPreviewText: 'AaBbCcDdEe 123456789 こんにちは 你好',
    useCustomPreviewText: false,
    sortFontsBy: 'name',
    sortDirection: 'asc',
    fontSizeSliderMin: 12,
    fontSizeSliderMax: 72,
    previewTextRows: 2,
}; 