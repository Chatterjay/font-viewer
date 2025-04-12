#!/usr/bin/env node

/**
 * 版本发布脚本
 * 统一更新所有版本相关文件并提交tag
 * 用法: 
 *   node scripts/version-release.mjs [major|minor|patch]
 *   - major: 主版本更新，如 1.0.0 -> 2.0.0
 *   - minor: 次版本更新，如 1.0.0 -> 1.1.0
 *   - patch: 补丁版本更新，如 1.0.0 -> 1.0.1（默认）
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

import updatelog from './updatelog.mjs';

// 获取当前目录和项目根目录
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

// 文件路径
const PACKAGE_JSON_PATH = path.join(rootDir, 'package.json');
const TAURI_CONF_PATH = path.join(rootDir, 'src-tauri', 'tauri.conf.json');
const CARGO_TOML_PATH = path.join(rootDir, 'src-tauri', 'Cargo.toml');
const VERSION_JS_PATH = path.join(rootDir, 'src', 'constants', 'version.js');

/**
 * 比较两个版本号
 * @param {string} versionA 版本A
 * @param {string} versionB 版本B
 * @returns {number} 1表示A大，-1表示B大，0表示相等
 */
function compareVersions(versionA, versionB) {
    if (!versionA || !versionB) return 0;

    const partsA = versionA.split('.').map(Number);
    const partsB = versionB.split('.').map(Number);

    for (let i = 0; i < Math.max(partsA.length, partsB.length); i++) {
        const partA = i < partsA.length ? partsA[i] : 0;
        const partB = i < partsB.length ? partsB[i] : 0;

        if (partA > partB) return 1;
        if (partA < partB) return -1;
    }

    return 0;
}

/**
 * 主函数
 */
async function release() {
    try {
        // 导入GitHub配置
        const githubModule = await import('../src/constants/github.js');
        const GITHUB_OWNER = githubModule.GITHUB_OWNER;
        const GITHUB_REPO = githubModule.GITHUB_REPO;

        // 获取版本类型参数（默认为patch）
        const versionType = process.argv[2]?.toLowerCase() ?? 'patch';

        // 验证版本类型
        if (!['major', 'minor', 'patch'].includes(versionType)) {
            console.error(`错误: 无效的版本类型 "${versionType}"\n有效选项: major, minor, patch`);
            process.exit(1);
        }

        console.log(`开始${getVersionTypeLabel(versionType)}更新...`);

        // 检查所有文件的版本号
        console.log('检查当前版本号...');

        // 读取 package.json 的版本
        const packageJsonContent = fs.readFileSync(PACKAGE_JSON_PATH, 'utf8');
        const packageJson = JSON.parse(packageJsonContent);
        const packageVersion = packageJson.version;
        console.log(`package.json 版本: ${packageVersion}`);

        // 读取 tauri.conf.json 的版本
        const tauriConfContent = fs.readFileSync(TAURI_CONF_PATH, 'utf8');
        const tauriConf = JSON.parse(tauriConfContent);
        const tauriVersion = tauriConf.package.version;
        console.log(`tauri.conf.json 版本: ${tauriVersion}`);

        // 读取 Cargo.toml 的版本
        const cargoContent = fs.readFileSync(CARGO_TOML_PATH, 'utf8');
        const cargoVersionMatch = cargoContent.match(/^version\s*=\s*["']([0-9.]+)["']/m);
        const cargoVersion = cargoVersionMatch ? cargoVersionMatch[1] : 'unknown';
        console.log(`Cargo.toml 版本: ${cargoVersion}`);

        // 选择最高版本作为基准
        const versions = [packageVersion, tauriVersion, cargoVersion].filter(v => v !== 'unknown');
        let currentVersion = versions[0];

        for (const version of versions) {
            if (compareVersions(version, currentVersion) > 0) {
                currentVersion = version;
            }
        }

        console.log(`使用最高版本作为基准: ${currentVersion}`);

        // 计算新版本号
        let [major, minor, patch] = currentVersion.split('.').map(Number);

        if (versionType === 'major') {
            major += 1;
            minor = 0;
            patch = 0;
        } else if (versionType === 'minor') {
            minor += 1;
            patch = 0;
        } else { // patch
            patch += 1;
        }

        const nextVersion = `${major}.${minor}.${patch}`;
        const nextVersionWithV = `v${nextVersion}`;

        console.log(`新版本: ${nextVersion}`);

        // 更新 UPDATE_LOG.md
        console.log('更新日志文件...');
        try {
            const logContent = await updatelog(nextVersionWithV, 'release');
            if (logContent) {
                console.log('日志文件更新成功');
            } else {
                console.log('日志文件未变更或已存在');
            }
        } catch (error) {
            console.warn('更新日志文件时出现警告:', error.message);
            // 我们会继续执行，即使更新日志失败
            console.log('继续执行，不中断流程');
        }

        // 更新 package.json
        console.log('更新 package.json...');
        packageJson.version = nextVersion;
        fs.writeFileSync(PACKAGE_JSON_PATH, JSON.stringify(packageJson, null, 2) + '\n');

        // 更新 package-lock.json
        console.log('更新 package-lock.json...');
        try {
            // 使用npm install来更新package-lock.json
            execSync('npm install --package-lock-only', { stdio: 'inherit' });
            console.log('package-lock.json 更新成功');
        } catch (error) {
            console.warn('更新 package-lock.json 失败:', error.message);
            console.warn('继续执行，但可能导致版本不一致');
        }

        // 更新 tauri.conf.json
        console.log('更新 tauri.conf.json...');
        tauriConf.package.version = nextVersion;
        fs.writeFileSync(TAURI_CONF_PATH, JSON.stringify(tauriConf, null, 2) + '\n');

        // 更新 Cargo.toml（使用正则表达式以保留文件格式）
        console.log('更新 Cargo.toml...');
        const updatedCargoContent = cargoContent.replace(
            /^version\s*=\s*["']([0-9.]+)["']/m,
            `version = "${nextVersion}"`
        );
        fs.writeFileSync(CARGO_TOML_PATH, updatedCargoContent);

        // 更新 version.js 中的 CURRENT_VERSION
        console.log('更新 constants/version.js...');
        let versionJsContent = fs.readFileSync(VERSION_JS_PATH, 'utf8');
        versionJsContent = versionJsContent.replace(
            /export const CURRENT_VERSION\s*=\s*["']v[0-9.]+["']/,
            `export const CURRENT_VERSION = '${nextVersionWithV}'`
        );

        // 添加新版本历史记录
        if (versionJsContent.includes('VERSION_HISTORY')) {
            const today = new Date().toISOString().split('T')[0];
            // 在版本历史数组开头插入新版本
            versionJsContent = versionJsContent.replace(
                /export const VERSION_HISTORY\s*=\s*\[/,
                `export const VERSION_HISTORY = [\n    {\n        version: '${nextVersionWithV}',\n        date: '${today}',\n        changes: [\n            { type: 'feature', text: '版本更新' },\n        ]\n    },`
            );
        }

        fs.writeFileSync(VERSION_JS_PATH, versionJsContent);

        // Git 操作
        console.log('提交更改到 Git...');

        // 添加所有更改的文件
        execSync('git add ./package.json ./package-lock.json ./src-tauri/tauri.conf.json ./src-tauri/Cargo.toml ./src/constants/version.js ./UPDATE_LOG.md', { stdio: 'inherit' });

        // 提交更改
        execSync(`git commit -m "chore: 版本更新 ${nextVersionWithV}"`, { stdio: 'inherit' });

        // 创建标签
        console.log(`创建标签 ${nextVersionWithV}...`);
        try {
            // 检查标签是否已存在
            const tagsOutput = execSync('git tag').toString().trim();
            const tags = tagsOutput.split(/\r?\n/);
            const tagExists = tags.includes(nextVersionWithV);

            if (tagExists) {
                console.log(`标签 ${nextVersionWithV} 已存在，正在删除...`);
                execSync(`git tag -d ${nextVersionWithV}`, { stdio: 'inherit' });
            }

            // 创建新标签
            execSync(`git tag -a ${nextVersionWithV} -m "版本 ${nextVersionWithV} 发布"`, { stdio: 'inherit' });
        } catch (error) {
            console.error(`标签创建失败: ${error.message}`);
            console.error('继续执行剩余步骤...');
        }

        // 推送到远程仓库
        console.log('推送到远程仓库...');
        execSync('git push', { stdio: 'inherit' });

        // 推送标签 - 查找合适的远程仓库名称
        console.log('准备推送标签...');

        // 查找可用的远程仓库
        const getRemoteRepo = () => {
            try {
                // 尝试获取git remote列表
                const remoteOutput = execSync('git remote').toString().trim();
                if (remoteOutput) {
                    const remotes = remoteOutput.split(/\r?\n/).filter(r => r);
                    if (remotes.length > 0) {
                        console.log(`找到远程仓库: ${remotes[0]}`);
                        return remotes[0]; // 返回第一个远程仓库
                    }
                }

                // 如果没有远程列表，尝试检查是否有origin配置
                try {
                    const originUrl = execSync('git config --get remote.origin.url').toString().trim();
                    if (originUrl) {
                        console.log('找到origin远程仓库配置');
                        return 'origin';
                    }
                } catch (e) {
                    // 忽略错误
                }

                // 尝试检查是否有font配置
                try {
                    const fontUrl = execSync('git config --get remote.font.url').toString().trim();
                    if (fontUrl) {
                        console.log('找到font远程仓库配置');
                        return 'font';
                    }
                } catch (e) {
                    // 忽略错误
                }

                // 最后尝试通过当前分支的上游追踪分支
                try {
                    const branchInfo = execSync('git branch -vv').toString();
                    const currentBranchMatch = branchInfo.match(/\*\s+(\w+).*\[(.*?)\/.*?\]/);
                    if (currentBranchMatch && currentBranchMatch[2]) {
                        console.log(`找到当前分支追踪的远程: ${currentBranchMatch[2]}`);
                        return currentBranchMatch[2];
                    }
                } catch (e) {
                    // 忽略错误
                }

                // 如果所有尝试都失败，使用硬编码的远程仓库
                console.log('未找到远程仓库配置，使用硬编码URL');
                // 这里返回null，将在后面使用URL
                return null;
            } catch (e) {
                console.log('获取远程仓库信息时出错:', e.message);
                return null;
            }
        };

        const remoteRepo = getRemoteRepo();

        // 推送标签
        try {
            if (remoteRepo) {
                console.log(`推送标签 ${nextVersionWithV} 到 ${remoteRepo}...`);

                // 检查远程标签是否存在
                try {
                    const lsRemoteOutput = execSync(`git ls-remote --tags ${remoteRepo} ${nextVersionWithV}`).toString().trim();
                    if (lsRemoteOutput) {
                        console.log(`远程标签 ${nextVersionWithV} 已存在，正在删除...`);
                        execSync(`git push ${remoteRepo} --delete ${nextVersionWithV}`, { stdio: 'inherit' });
                    }
                } catch (e) {
                    // 忽略错误，ls-remote失败可能是因为标签不存在，这是正常的
                }

                // 推送标签
                execSync(`git push ${remoteRepo} ${nextVersionWithV}`, { stdio: 'inherit' });
            } else {
                // 直接使用URL推送
                const repoUrl = `https://github.com/${GITHUB_OWNER}/${GITHUB_REPO}.git`;
                console.log(`推送标签 ${nextVersionWithV} 到 ${repoUrl}...`);
                execSync(`git push ${repoUrl} ${nextVersionWithV}`, { stdio: 'inherit' });
            }
            console.log('标签推送成功');
        } catch (e) {
            console.warn(`标签推送失败: ${e.message}`);
            console.log('但基本更新已完成，您可以稍后手动推送标签:');
            console.log(`git push <remote> ${nextVersionWithV}`);
        }

        console.log('\n✅ 版本发布完成！');
        console.log(`版本号: ${nextVersionWithV}`);
        console.log(`\n等待 GitHub Actions 构建完成后，请前往 https://github.com/${GITHUB_OWNER}/${GITHUB_REPO}/releases 检查发布状态。`);
        console.log('如果看不到新版本的发布，请检查GitHub Actions是否已成功运行。');

    } catch (error) {
        console.error('❌ 版本发布失败:', error);
        process.exit(1);
    }
}

/**
 * 获取版本类型的中文标签
 */
function getVersionTypeLabel(type) {
    switch (type) {
        case 'major': return '主版本';
        case 'minor': return '次版本';
        case 'patch': return '补丁版本';
        default: return '版本';
    }
}

// 执行主函数
release().catch((error) => {
    console.error('脚本执行错误:', error);
    process.exit(1);
}); 