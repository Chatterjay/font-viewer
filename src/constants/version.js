/**
 * 版本管理
 * 集中管理应用程序的版本信息
 */

// 当前版本 - 更新此处会自动更新所有配置文件中的版本号
// 格式: vX.Y.Z，带前缀v
export const CURRENT_VERSION = 'v1.0.1'

/**
 * 版本历史记录
 * 用于生成更新日志
 * @type {Array<{version: string, date: string, changes: Array<{type: string, text: string}>}>}
 */
export const VERSION_HISTORY = [
    {
        version: 'v1.0.1',
        date: '2025-04-12',
        changes: [
            { type: 'feature', text: '版本更新' },
        ]
    },
    {
        version: 'v1.0.0',
        date: '2025-04-12',
        changes: [
            { type: 'feature', text: '版本更新' },
        ]
    },
    {
        version: 'v0.0.0',
        date: '2025-04-12',
        changes: [
            { type: 'other', text: '版本重置' },
        ]
    },
    {
        version: 'v0.0.0',
        date: '2025-04-12',
        changes: [
            { type: 'other', text: '版本重置' },
        ]
    },
    {
        version: 'v0.0.0',
        date: '2025-04-12',
        changes: [
            { type: 'other', text: '版本重置' },
        ]
    },
    {
        version: 'v0.0.3',
        date: '2025-04-12',
        changes: [
            { type: 'feature', text: '版本更新' },
        ]
    },
    {
        version: 'v0.0.2',
        date: '2025-04-12',
        changes: [
            { type: 'feature', text: '版本更新' },
        ]
    },
    {
        version: 'v0.0.1',
        date: '2025-04-12',
        changes: [
            { type: 'feature', text: '版本更新' },
        ]
    },
    {
        version: 'v0.0.0',
        date: '2025-04-12',
        changes: [
            { type: 'other', text: '版本重置' },
        ]
    },
    {
        version: 'v0.0.0',
        date: '2025-04-12',
        changes: [
            { type: 'other', text: '版本重置' },
        ]
    },
    {
        version: 'v0.0.2',
        date: '2025-04-12',
        changes: [
            { type: 'feature', text: '版本更新' },
        ]
    },
    {
        version: 'v0.0.1',
        date: '2025-04-12',
        changes: [
            { type: 'feature', text: '版本更新' },
        ]
    },
    {
        version: 'v0.0.0',
        date: '2025-04-12',
        changes: [
            { type: 'other', text: '版本重置' },
        ]
    },
    {
        version: 'v0.0.1',
        date: '2025-04-12',
        changes: [
            { type: 'feature', text: '版本更新' },
        ]
    },
    {
        version: 'v0.0.0',
        date: '2025-04-12',
        changes: [
            { type: 'other', text: '版本重置' },
        ]
    },
    {
        version: 'v0.0.5',
        date: '2025-04-12',
        changes: [
            { type: 'feature', text: '版本更新' },
        ]
    },
    {
        version: 'v0.0.4',
        date: '2025-04-12',
        changes: [
            { type: 'feature', text: '版本更新' },
        ]
    },
    {
        version: 'v0.0.3',
        date: '2025-04-12',
        changes: [
            { type: 'feature', text: '版本更新' },
        ]
    },
    {
        version: 'v0.0.1',
        date: '2025-04-03',
        changes: [
            { type: 'feature', text: '初始版本发布' },
        ]
    },
    {
        version: 'v0.0.0',
        date: '2025-04-03',
        changes: [
            { type: 'feature', text: '初始版本发布' },
            { type: 'feature', text: '支持查看系统字体' },
            { type: 'feature', text: '支持自定义文本预览' }
        ]
    }
];

/**
 * 格式化版本号
 * 将版本号转换为不同的格式
 * @param {string} version - 版本号（带v前缀）
 * @param {Object} options - 格式化选项
 * @param {boolean} options.removePrefix - 是否移除v前缀
 * @returns {string} 格式化后的版本号
 */
export function formatVersion(version, options = {}) {
    const { removePrefix = false } = options;
    if (removePrefix) {
        return version.replace(/^v/, '');
    }
    return version;
}

/**
 * 获取最新版本的变更记录
 * @returns {Array<{type: string, text: string}>} 变更记录
 */
export function getLatestChanges() {
    if (VERSION_HISTORY.length === 0) {
        return [];
    }
    return VERSION_HISTORY[0].changes || [];
}

/**
 * 将版本历史格式化为Markdown
 * @param {number} limit - 限制显示的版本数量，0表示所有
 * @returns {string} Markdown格式的变更记录
 */
export function formatChangelogToMarkdown(limit = 0) {
    const history = limit > 0 ? VERSION_HISTORY.slice(0, limit) : VERSION_HISTORY;

    let markdown = '# 更新日志\n\n';

    history.forEach(release => {
        markdown += `## ${release.version} (${release.date})\n\n`;

        // 按类型分组变更
        const featureChanges = release.changes.filter(c => c.type === 'feature');
        const improvementChanges = release.changes.filter(c => c.type === 'improvement');
        const fixChanges = release.changes.filter(c => c.type === 'fix');
        const otherChanges = release.changes.filter(c => !['feature', 'improvement', 'fix'].includes(c.type));

        if (featureChanges.length > 0) {
            markdown += '### ✨ 新功能\n\n';
            featureChanges.forEach(change => {
                markdown += `- ${change.text}\n`;
            });
            markdown += '\n';
        }

        if (improvementChanges.length > 0) {
            markdown += '### 🚀 优化改进\n\n';
            improvementChanges.forEach(change => {
                markdown += `- ${change.text}\n`;
            });
            markdown += '\n';
        }

        if (fixChanges.length > 0) {
            markdown += '### 🐛 问题修复\n\n';
            fixChanges.forEach(change => {
                markdown += `- ${change.text}\n`;
            });
            markdown += '\n';
        }

        if (otherChanges.length > 0) {
            markdown += '### 其他变更\n\n';
            otherChanges.forEach(change => {
                markdown += `- ${change.text}\n`;
            });
            markdown += '\n';
        }
    });

    return markdown;
}

// 导出用于显示在更新通知中的变更日志
export const CHANGELOG = formatChangelogToMarkdown(1); 