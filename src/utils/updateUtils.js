/**
 * 提供简单的环境检测工具函数
 */
import { GITHUB_CHANGELOG_URL } from '../constants/github.js';

/**
 * 检查是否为生产环境
 * @returns {boolean} 是否为生产环境
 */
export const isProduction = () => {
    return import.meta.env.PROD;
};

/**
 * 获取当前环境信息
 * @returns {string} 环境描述
 */
export const getEnvironment = () => {
    return isProduction() ? '生产环境' : '开发环境';
};

/**
 * 解析版本号为可比较的数字
 * @param {string} version 版本号字符串，如 'v1.0.1'
 * @returns {number} 处理后的版本号数字
 */
export const parseVersionToNumber = (version) => {
    if (!version) return 0;
    return parseInt(version.replace('v', '').replace(/\./g, ''));
};

/**
 * 比较两个版本号
 * @param {string} versionA 第一个版本号
 * @param {string} versionB 第二个版本号
 * @returns {number} 1表示versionA大，-1表示versionB大，0表示相等
 */
export const compareVersions = (versionA, versionB) => {
    const versionANum = parseVersionToNumber(versionA);
    const versionBNum = parseVersionToNumber(versionB);

    if (versionANum > versionBNum) return 1;
    if (versionANum < versionBNum) return -1;
    return 0;
};

/**
 * 从服务器获取最新版本
 * @param {string} currentVersion 当前版本
 * @returns {Promise<{version: string, hasUpdate: boolean}>} 版本信息
 */
export const fetchLatestVersion = async (currentVersion) => {
    if (!isProduction()) {
        // 在开发环境中使用模拟数据
        await new Promise(resolve => setTimeout(resolve, 800));
        const serverVersion = CURRENT_VERSION; // 使用与当前版本相同的版本号，避免开发环境中触发更新

        // 比较版本并返回结果
        const comparisonResult = compareVersions(serverVersion, currentVersion);
        const hasUpdate = comparisonResult > 0;

        console.log(`[开发环境] 版本比较: 当前版本=${currentVersion}, 服务器版本=${serverVersion}, 有更新=${hasUpdate}`);

        return {
            version: serverVersion,
            hasUpdate,
            currentVersion
        };
    } else {
        // 在生产环境中，尝试获取最新版本信息
        try {
            console.log(`[生产环境] 检查更新，当前版本: ${currentVersion}`);

            // 先尝试从Tauri API获取更新信息
            const { checkUpdate } = await import('@tauri-apps/api/updater');
            const { shouldUpdate, manifest } = await checkUpdate();

            // 如果有更新信息
            if (shouldUpdate && manifest) {
                const serverVersion = manifest.version;
                // 强制转换为字符串并确保前缀为'v'
                const formattedServerVersion = formatVersion(serverVersion);

                // 比较版本
                const comparisonResult = compareVersions(formattedServerVersion, currentVersion);
                const hasUpdate = comparisonResult > 0;

                console.log(`[生产环境] 版本比较: 当前版本=${currentVersion}, 服务器版本=${formattedServerVersion}, 有更新=${hasUpdate}`);

                return {
                    version: formattedServerVersion,
                    hasUpdate,
                    currentVersion
                };
            } else {
                // 如果Tauri API返回没有更新，使用CURRENT_VERSION进行二次检查
                const comparisonResult = compareVersions(CURRENT_VERSION, currentVersion);
                const hasUpdate = comparisonResult > 0;

                console.log(`[生产环境] 二次版本比较: 当前版本=${currentVersion}, 集中定义版本=${CURRENT_VERSION}, 有更新=${hasUpdate}`);

                return {
                    version: hasUpdate ? CURRENT_VERSION : currentVersion,
                    hasUpdate,
                    currentVersion
                };
            }
        } catch (error) {
            console.error('[生产环境] 检查更新出错:', error);

            // 出错时使用CURRENT_VERSION作为后备
            const comparisonResult = compareVersions(CURRENT_VERSION, currentVersion);
            const hasUpdate = comparisonResult > 0;

            console.log(`[生产环境] 错误后备版本比较: 当前版本=${currentVersion}, 集中定义版本=${CURRENT_VERSION}, 有更新=${hasUpdate}`);

            return {
                version: hasUpdate ? CURRENT_VERSION : currentVersion,
                hasUpdate,
                currentVersion
            };
        }
    }
};

/**
 * 从Markdown格式的更新日志文本中解析出结构化数据
 * @param {string} markdownText Markdown格式的更新日志
 * @returns {Array} 结构化的更新日志数据
 */
export const parseChangelogFromMarkdown = (markdownText) => {
    if (!markdownText) return [];

    const changelog = [];
    let currentVersion = null;
    let currentDate = '';
    let currentChanges = [];

    // 按行分割Markdown文本
    const lines = markdownText.split('\n');

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();

        // 跳过空行
        if (!line) continue;

        // 检查是否是版本标题行 (## v1.0.1 (2023-11-15))
        const versionMatch = line.match(/^##\s+([vV]?\d+\.\d+\.\d+)(?:\s+\((\d{4}-\d{2}-\d{2})\))?/);
        if (versionMatch) {
            // 如果已经有一个版本在处理中，将其添加到changelog中
            if (currentVersion) {
                changelog.push({
                    version: currentVersion,
                    date: currentDate,
                    changes: [...currentChanges]
                });
            }

            // 开始新版本
            currentVersion = versionMatch[1];
            currentDate = versionMatch[2] || new Date().toISOString().split('T')[0];
            currentChanges = [];
            continue;
        }

        // 如果没有当前处理的版本，跳过这一行
        if (!currentVersion) continue;

        // 检查是否是变更项 (- [新功能] 添加了xxx功能)
        const changeMatch = line.match(/^-\s+\[(.+?)\]\s+(.+)$/);
        if (changeMatch && currentVersion) {
            const type = mapChangeType(changeMatch[1]);
            const text = changeMatch[2].trim();
            currentChanges.push({ type, text });
        }
    }

    // 添加最后一个处理的版本
    if (currentVersion) {
        changelog.push({
            version: currentVersion,
            date: currentDate,
            changes: [...currentChanges]
        });
    }

    return changelog;
};

/**
 * 将更新日志中的变更类型文本映射为标准类型
 * @param {string} typeText 变更类型文本
 * @returns {string} 标准化的变更类型
 */
const mapChangeType = (typeText) => {
    const text = typeText.toLowerCase();
    if (text.includes('新功能') || text.includes('feature')) return 'feature';
    if (text.includes('优化') || text.includes('improvement')) return 'improvement';
    if (text.includes('修复') || text.includes('fix')) return 'fix';
    return 'other';
};

/**
 * 更新全局CHANGELOG常量
 * @param {Array} changelog 更新日志数据
 */
export const updateChangelogData = (changelog) => {
    // 清空现有数据
    CHANGELOG.length = 0;

    // 添加新数据
    if (Array.isArray(changelog) && changelog.length > 0) {
        changelog.forEach(item => CHANGELOG.push(item));
    }

    console.log('更新日志数据已更新:', CHANGELOG);
};

/**
 * 从更新包中获取并解析更新日志
 * 在实际项目中，此函数应该从Tauri更新API获取更新日志
 */
export const fetchChangelogFromUpdatePackage = async () => {
    try {
        if (!isProduction()) {
            // 在开发环境中使用定义的版本历史
            console.log('[开发环境] 使用预定义的版本历史数据');
            return CHANGELOG;
        } else {
            // 在生产环境中，尝试从更新包中获取更新日志
            console.log('[生产环境] 尝试获取真实更新日志');

            // 强制重新导入版本历史以确保最新数据
            try {
                console.log('[生产环境] 尝试重新导入版本模块');
                // 使用动态导入尝试重新加载版本模块
                /* @vite-ignore */
                const versionModule = await import('../constants/version.js');
                if (versionModule && versionModule.VERSION_HISTORY) {
                    console.log('[生产环境] 成功重新导入版本历史:', versionModule.VERSION_HISTORY);
                    const freshChangelog = versionModule.VERSION_HISTORY;
                    updateChangelogData(freshChangelog);
                    return freshChangelog;
                }
            } catch (e) {
                console.warn('[生产环境] 重新导入版本模块失败:', e);
            }

            // 首先尝试从Tauri API获取
            try {
                const { invoke } = await import('@tauri-apps/api/tauri');
                const changelogText = await invoke('get_changelog_text');
                if (changelogText && changelogText.trim()) {
                    console.log('[生产环境] 通过Tauri API成功获取更新日志');
                    const parsedChangelog = parseChangelogFromMarkdown(changelogText);
                    if (parsedChangelog && parsedChangelog.length > 0) {
                        updateChangelogData(parsedChangelog);
                        return parsedChangelog;
                    }
                }
            } catch (e) {
                console.warn('[生产环境] 无法通过Tauri API获取更新日志:', e);
            }

            // 然后尝试从GitHub获取
            try {
                console.log('[生产环境] 尝试从GitHub获取更新日志');
                const response = await fetch(GITHUB_CHANGELOG_URL);
                if (response.ok) {
                    const changelogText = await response.text();
                    if (changelogText && changelogText.trim()) {
                        console.log('[生产环境] 从GitHub成功获取更新日志');
                        const parsedChangelog = parseChangelogFromMarkdown(changelogText);
                        if (parsedChangelog && parsedChangelog.length > 0) {
                            updateChangelogData(parsedChangelog);
                            return parsedChangelog;
                        }
                    }
                }
            } catch (e) {
                console.warn('[生产环境] 无法从GitHub获取更新日志:', e);
            }

            // 如果获取失败，重新生成一个基于当前版本的更新日志
            console.log('[生产环境] 所有获取尝试失败，基于版本生成临时更新日志');

            // 获取当前版本
            const version = CURRENT_VERSION;
            const now = new Date();
            const date = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

            // 创建临时更新日志
            const tempChangelog = [{
                version,
                date,
                changes: [
                    { type: 'improvement', text: '提升应用稳定性和性能' },
                    { type: 'fix', text: '修复已知问题' }
                ]
            }];

            console.log('[生产环境] 生成临时更新日志:', tempChangelog);
            updateChangelogData(tempChangelog);
            return tempChangelog;
        }
    } catch (error) {
        console.error('[生产环境] 获取更新日志失败:', error);
        // 确保提供备用更新日志
        return CHANGELOG;
    }
}; 