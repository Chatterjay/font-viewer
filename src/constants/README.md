# GitHub 配置管理

本目录包含了项目的常量配置，特别是 `github.js` 文件用于集中管理所有与 GitHub 相关的配置。

## 使用方法

### 在 JavaScript/Vue 文件中使用

```javascript
// 导入需要的配置
import { GITHUB_OWNER, GITHUB_REPO, GITHUB_CHANGELOG_URL } from '../constants/github.js';

// 使用配置
console.log(`仓库所有者: ${GITHUB_OWNER}`);
console.log(`仓库名称: ${GITHUB_REPO}`);

// 使用辅助函数
import { buildRawUrl } from '../constants/github.js';
const readmeUrl = buildRawUrl('README.md');
```

### 在 MJS 文件中使用

在 `.mjs` 文件中，需要使用 `createRequire` 来导入:

```javascript
import { createRequire } from 'module';
const require = createRequire(import.meta.url);

// 导入GitHub配置
const { GITHUB_OWNER, GITHUB_REPO } = require('../src/constants/github.js');
```

## 可用配置项

以下是 `github.js` 中提供的所有配置：

| 配置名 | 描述 |
|--------|------|
| `GITHUB_OWNER` | 仓库所有者名称 |
| `GITHUB_REPO` | 仓库名称 |
| `GITHUB_REPO_URL` | 完整的仓库 URL |
| `GITHUB_RAW_URL` | 原始内容 URL 基础地址 |
| `GITHUB_API_URL` | GitHub API 基础地址 |
| `GITHUB_REPO_API_URL` | 当前仓库 API 地址 |
| `GITHUB_RELEASES_URL` | 发布页面地址 |
| `GITHUB_LATEST_RELEASE_URL` | 最新发布地址 |
| `GITHUB_LATEST_JSON_URL` | 最新发布 JSON 地址 |
| `GITHUB_CHANGELOG_URL` | 更新日志地址 |

## 辅助函数

`github.js` 还提供了以下辅助函数：

| 函数名 | 描述 |
|--------|------|
| `buildRawUrl(path, branch)` | 构建特定分支或标签的原始内容 URL |
| `buildReleaseAssetUrl(tag, assetName)` | 构建发布资源的 URL |

## 修改配置

如果项目的 GitHub 仓库地址发生变化，只需要修改 `github.js` 文件中的 `GITHUB_OWNER` 和 `GITHUB_REPO` 常量即可，所有依赖的 URL 都会自动更新。 