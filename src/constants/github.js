/**
 * GitHub配置
 * 集中管理与GitHub相关的配置项
 */

// 仓库所有者和仓库名称
export const GITHUB_OWNER = 'Chatterjay';
export const GITHUB_REPO = 'font-viewer';

// 完整的仓库URL
export const GITHUB_REPO_URL = `https://github.com/${GITHUB_OWNER}/${GITHUB_REPO}`;

// 原始内容URL（用于直接访问文件内容）
export const GITHUB_RAW_URL = `https://raw.githubusercontent.com/${GITHUB_OWNER}/${GITHUB_REPO}`;

// 常用API端点
export const GITHUB_API_URL = 'https://api.github.com';
export const GITHUB_REPO_API_URL = `${GITHUB_API_URL}/repos/${GITHUB_OWNER}/${GITHUB_REPO}`;

// 发布相关URL
export const GITHUB_RELEASES_URL = `${GITHUB_REPO_URL}/releases`;
export const GITHUB_LATEST_RELEASE_URL = `${GITHUB_RELEASES_URL}/latest`;
export const GITHUB_LATEST_JSON_URL = `${GITHUB_RELEASES_URL}/latest/download/latest.json`;

// 更新日志URL
export const GITHUB_CHANGELOG_URL = `${GITHUB_RAW_URL}/main/CHANGELOG.md`;

/**
 * 构建特定分支或标签的原始内容URL
 * @param {string} path - 文件路径
 * @param {string} branch - 分支或标签名称（默认为main）
 * @returns {string} 完整的GitHub原始内容URL
 */
export function buildRawUrl(path, branch = 'main') {
    return `${GITHUB_RAW_URL}/${branch}/${path}`;
}

/**
 * 构建发布资源的URL
 * @param {string} tag - 标签名称
 * @param {string} assetName - 资源文件名
 * @returns {string} 完整的资源URL
 */
export function buildReleaseAssetUrl(tag, assetName) {
    return `${GITHUB_RELEASES_URL}/download/${tag}/${assetName}`;
} 