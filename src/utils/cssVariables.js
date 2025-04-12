/**
 * 为应用注入必要的CSS变量
 */
export const injectCssVariables = () => {
    // 获取根元素
    const root = document.documentElement;

    // 检查是否已经设置了RGB变量
    const hasRgbVars = getComputedStyle(root).getPropertyValue('--primary-rgb');

    // 如果尚未设置RGB变量，则添加它们
    if (!hasRgbVars) {
        // 主要颜色RGB
        const primaryColor = getComputedStyle(root).getPropertyValue('--primary-color').trim();
        const primaryRgb = hexToRgb(primaryColor) || '59, 130, 246';
        root.style.setProperty('--primary-rgb', primaryRgb);

        // 成功颜色RGB
        const successColor = getComputedStyle(root).getPropertyValue('--success-color').trim();
        const successRgb = hexToRgb(successColor) || '16, 185, 129';
        root.style.setProperty('--success-rgb', successRgb);

        // 警告颜色RGB
        const warningColor = getComputedStyle(root).getPropertyValue('--warning-color').trim();
        const warningRgb = hexToRgb(warningColor) || '245, 158, 11';
        root.style.setProperty('--warning-rgb', warningRgb);

        // 危险颜色RGB
        const dangerColor = getComputedStyle(root).getPropertyValue('--danger-color').trim();
        const dangerRgb = hexToRgb(dangerColor) || '239, 68, 68';
        root.style.setProperty('--danger-rgb', dangerRgb);
    }
};

/**
 * 将十六进制颜色转换为RGB格式
 * @param {string} hex 十六进制颜色代码
 * @returns {string|null} RGB格式的颜色字符串，如果转换失败则返回null
 */
const hexToRgb = (hex) => {
    if (!hex) return null;

    // 移除#号
    hex = hex.replace('#', '');

    // 处理简写形式的十六进制颜色
    if (hex.length === 3) {
        hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
    }

    // 转换为RGB
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);

    if (isNaN(r) || isNaN(g) || isNaN(b)) {
        return null;
    }

    return `${r}, ${g}, ${b}`;
}; 