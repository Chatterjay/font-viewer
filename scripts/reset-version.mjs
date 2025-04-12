#!/usr/bin/env node

/**
 * 版本重置脚本
 * 将所有版本相关文件重置为0.0.0，并可选择性地删除Git标签
 * 用法: 
 *   node scripts/reset-version.mjs [--clear-tags]
 *   
 * 参数:
 *   --clear-tags: 同时删除Git上的版本标签
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// 获取当前目录和项目根目录
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

// 文件路径
const PACKAGE_JSON_PATH = path.join(rootDir, 'package.json');
const TAURI_CONF_PATH = path.join(rootDir, 'src-tauri', 'tauri.conf.json');
const CARGO_TOML_PATH = path.join(rootDir, 'src-tauri', 'Cargo.toml');
const VERSION_JS_PATH = path.join(rootDir, 'src', 'constants', 'version.js');

// 目标版本号
const RESET_VERSION = '0.0.0';
const RESET_VERSION_WITH_V = `v${RESET_VERSION}`;

// 检查命令行参数
const shouldClearTags = process.argv.includes('--clear-tags');

/**
 * 获取远程仓库名称
 * @returns {string|null} 远程仓库名称或null
 */
function getRemoteRepo() {
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

        // 尝试通过origin配置
        try {
            const originUrl = execSync('git config --get remote.origin.url').toString().trim();
            if (originUrl) {
                console.log('找到origin远程仓库配置');
                return 'origin';
            }
        } catch (e) {
            // 忽略错误
        }

        // 检查其他常用的远程仓库名称
        for (const remoteName of ['font', 'github', 'gitlab', 'upstream']) {
            try {
                const remoteUrl = execSync(`git config --get remote.${remoteName}.url`).toString().trim();
                if (remoteUrl) {
                    console.log(`找到${remoteName}远程仓库配置`);
                    return remoteName;
                }
            } catch (e) {
                // 忽略错误
            }
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

        console.log('未找到远程仓库配置');
        return null;
    } catch (e) {
        console.log('获取远程仓库信息时出错:', e.message);
        return null;
    }
}

/**
 * 删除本地和远程Git标签
 */
function clearGitTags() {
    console.log('\n开始清理Git标签...');

    try {
        // 获取所有本地标签
        const tagsOutput = execSync('git tag').toString().trim();
        const tags = tagsOutput.split(/\r?\n/).filter(tag => tag.startsWith('v'));

        if (tags.length === 0) {
            console.log('没有找到需要删除的版本标签');
            return;
        }

        console.log(`找到 ${tags.length} 个版本标签`);

        // 获取远程仓库名称
        const remoteRepo = getRemoteRepo();

        // 删除远程标签
        if (remoteRepo) {
            console.log(`\n删除远程标签 (${remoteRepo})...`);
            for (const tag of tags) {
                try {
                    console.log(`  删除远程标签: ${tag}`);
                    execSync(`git push ${remoteRepo} --delete ${tag}`, { stdio: 'inherit' });
                } catch (e) {
                    console.warn(`  ⚠️ 删除远程标签 ${tag} 失败: ${e.message}`);
                    console.warn('  该标签可能不存在于远程仓库，将继续删除其他标签');
                }
            }
        } else {
            console.warn('未找到远程仓库，跳过删除远程标签');
        }

        // 删除本地标签
        console.log('\n删除本地标签...');
        for (const tag of tags) {
            try {
                console.log(`  删除本地标签: ${tag}`);
                execSync(`git tag -d ${tag}`, { stdio: 'inherit' });
            } catch (e) {
                console.warn(`  ⚠️ 删除本地标签 ${tag} 失败: ${e.message}`);
            }
        }

        console.log('\n✅ Git标签清理完成！');
    } catch (error) {
        console.error('\n❌ 清理Git标签失败:', error.message);
        console.error('请尝试手动删除标签');
    }
}

/**
 * 主函数
 */
async function resetVersion() {
    try {
        console.log('开始重置版本号...');
        console.log(`目标版本: ${RESET_VERSION}`);

        // 更新 package.json
        console.log('更新 package.json...');
        const packageJsonContent = fs.readFileSync(PACKAGE_JSON_PATH, 'utf8');
        const packageJson = JSON.parse(packageJsonContent);
        const oldVersion = packageJson.version;
        packageJson.version = RESET_VERSION;
        fs.writeFileSync(PACKAGE_JSON_PATH, JSON.stringify(packageJson, null, 2) + '\n');

        // 更新 tauri.conf.json
        console.log('更新 tauri.conf.json...');
        const tauriConfContent = fs.readFileSync(TAURI_CONF_PATH, 'utf8');
        const tauriConf = JSON.parse(tauriConfContent);
        tauriConf.package.version = RESET_VERSION;
        fs.writeFileSync(TAURI_CONF_PATH, JSON.stringify(tauriConf, null, 2) + '\n');

        // 更新 Cargo.toml（使用正则表达式以保留文件格式）
        console.log('更新 Cargo.toml...');
        let cargoContent = fs.readFileSync(CARGO_TOML_PATH, 'utf8');
        cargoContent = cargoContent.replace(
            /^version\s*=\s*["']([0-9.]+)["']/m,
            `version = "${RESET_VERSION}"`
        );
        fs.writeFileSync(CARGO_TOML_PATH, cargoContent);

        // 更新 version.js 中的 CURRENT_VERSION
        console.log('更新 constants/version.js...');
        let versionJsContent = fs.readFileSync(VERSION_JS_PATH, 'utf8');
        versionJsContent = versionJsContent.replace(
            /export const CURRENT_VERSION\s*=\s*["']v[0-9.]+["']/,
            `export const CURRENT_VERSION = '${RESET_VERSION_WITH_V}'`
        );

        // 添加版本重置记录到VERSION_HISTORY（如果存在）
        if (versionJsContent.includes('VERSION_HISTORY')) {
            const today = new Date().toISOString().split('T')[0];
            versionJsContent = versionJsContent.replace(
                /export const VERSION_HISTORY\s*=\s*\[/,
                `export const VERSION_HISTORY = [\n    {\n        version: '${RESET_VERSION_WITH_V}',\n        date: '${today}',\n        changes: [\n            { type: 'other', text: '版本重置' },\n        ]\n    },`
            );
        }

        fs.writeFileSync(VERSION_JS_PATH, versionJsContent);

        // 清理Git标签
        if (shouldClearTags) {
            clearGitTags();
        }

        console.log('\n✅ 版本重置完成！');
        console.log(`原版本号: ${oldVersion} → 新版本号: ${RESET_VERSION}`);
        console.log('\n注意: 此操作只修改了本地文件');

        if (!shouldClearTags) {
            console.log('\n要同时清理Git标签，请运行:');
            console.log('  npm run version:reset -- --clear-tags');
        }

        console.log('\n如需提交更改，请手动运行:');
        console.log('  git add ./package.json ./src-tauri/tauri.conf.json ./src-tauri/Cargo.toml ./src/constants/version.js');
        console.log('  git commit -m "chore: 重置版本号至 v0.0.0"');

    } catch (error) {
        console.error('❌ 版本重置失败:', error);
        process.exit(1);
    }
}

// 执行主函数
resetVersion().catch((error) => {
    console.error('脚本执行错误:', error);
    process.exit(1);
}); 