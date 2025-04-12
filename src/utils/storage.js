/**
 * 本地存储工具函数
 */

/**
 * 保存数据到本地存储
 * @param {string} key - 存储键名
 * @param {any} value - 要存储的值
 */
export const saveToStorage = (key, value) => {
    try {
        const serializedValue = JSON.stringify(value);
        localStorage.setItem(key, serializedValue);
    } catch (error) {
        console.error(`保存到本地存储失败: ${key}`, error);
    }
};

/**
 * 从本地存储获取数据
 * @param {string} key - 存储键名
 * @param {any} defaultValue - 默认值
 * @returns {any} 存储的值或默认值
 */
export const getFromStorage = (key, defaultValue = null) => {
    try {
        const serializedValue = localStorage.getItem(key);
        return serializedValue ? JSON.parse(serializedValue) : defaultValue;
    } catch (error) {
        console.error(`从本地存储获取数据失败: ${key}`, error);
        return defaultValue;
    }
};

/**
 * 从本地存储移除数据
 * @param {string} key - 存储键名
 */
export const removeFromStorage = (key) => {
    try {
        localStorage.removeItem(key);
    } catch (error) {
        console.error(`从本地存储移除数据失败: ${key}`, error);
    }
};

/**
 * 清空本地存储
 */
export const clearStorage = () => {
    try {
        localStorage.clear();
    } catch (error) {
        console.error('清空本地存储失败', error);
    }
}; 