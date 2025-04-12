# 📜 Scripts

项目自动化脚本集合，用于版本管理、发布和更新。

## 🔄 版本管理脚本

### version-release.mjs

**功能**: 统一更新所有与版本相关的文件并创建 Git 标签

**用法**:
```bash
# 通过 npm scripts 使用
npm run version:patch  # 补丁版本更新 (x.x.1 -> x.x.2)
npm run version:minor  # 次要版本更新 (x.1.x -> x.2.0)
npm run version:major  # 主要版本更新 (1.x.x -> 2.0.0)

# 直接使用脚本
node scripts/version-release.mjs patch
node scripts/version-release.mjs minor
node scripts/version-release.mjs major
```

**工作原理**:
1. 检查所有相关文件中的当前版本，并选择最高版本作为基准
2. 根据指定的版本类型（patch/minor/major）计算新版本号
3. 更新以下文件中的版本号:
   - `package.json`
   - `package-lock.json`
   - `src-tauri/tauri.conf.json`
   - `src-tauri/Cargo.toml`
   - `src/constants/version.js`
4. 更新 `UPDATE_LOG.md` 添加新版本记录
5. 提交所有更改并创建带版本号的 Git 标签
6. 推送更改和标签到远程仓库

**修改的文件**:
- `package.json`: 项目基本版本
- `package-lock.json`: 依赖锁定文件
- `src-tauri/tauri.conf.json`: Tauri 配置
- `src-tauri/Cargo.toml`: Rust 项目配置
- `src/constants/version.js`: 前端版本常量
- `UPDATE_LOG.md`: 版本更新日志

### reset-version.mjs

**功能**: 将所有版本相关文件重置为 0.0.0，并可选择性地清理 Git 标签

**用法**:
```bash
# 通过 npm scripts 使用
npm run version:reset          # 只重置版本号
npm run version:reset -- --clear-tags  # 重置版本号并清理Git标签

# 直接使用脚本
node scripts/reset-version.mjs
node scripts/reset-version.mjs --clear-tags
```

**工作原理**:
1. 将所有相关文件中的版本号重置为 0.0.0
2. 如果指定了 `--clear-tags` 参数，则删除所有以 "v" 开头的本地和远程 Git 标签
3. 不创建 Git 提交，只修改本地文件

## 📋 更新日志管理

### updatelog.mjs

**功能**: 管理 UPDATE_LOG.md 文件中的版本记录

**用法**:
```javascript
// 在其他脚本中导入使用
import updatelog from './updatelog.mjs';

// 添加新版本记录
await updatelog('v1.0.0', 'release');

// 检索特定版本的更新日志
const logContent = await updatelog('v1.0.0', 'updater');
```

**工作原理**:
1. 解析 UPDATE_LOG.md 文件，提取所有版本标签和内容
2. 根据操作类型执行不同的操作：
   - `release`: 如果指定版本标签不存在，则创建新的版本记录
   - `updater`: 检索并返回指定版本标签的内容
3. 自动处理文件格式和错误情况

## 🚀 发布与更新脚本

### release.mjs

**功能**: 旧版的发布脚本（已被 version-release.mjs 替代）

### updater.mjs

**功能**: 生成应用自动更新所需的 JSON 文件

**用法**:
```bash
npm run updater
```

**工作原理**:
1. 读取当前版本信息
2. 从已发布的资源中获取下载链接
3. 生成符合 Tauri 更新器要求的 JSON 配置文件
4. 输出到 `latest.json` 用于应用自动更新

## 📈 版本号规范 (SemVer)

本项目遵循语义化版本规范 (Semantic Versioning):

- **主版本号 (MAJOR)**: 当进行不兼容的 API 更改时增加
- **次版本号 (MINOR)**: 当添加向后兼容的功能时增加
- **补丁版本号 (PATCH)**: 当进行向后兼容的错误修复时增加

示例: `1.2.3` 表示主版本 1，次版本 2，补丁版本 3

## 🤔 常见问题

### Q: 如何处理版本冲突?
A: 脚本会自动检测并处理本地和远程的版本标签冲突。如果遇到推送冲突，脚本会尝试先拉取再推送，必要时执行受保护的强制推送。

### Q: 我可以自定义版本号吗?
A: 当前脚本不支持直接设置自定义版本号，但您可以先使用 `reset-version.mjs` 重置到特定版本，然后再使用版本更新命令递增。

### Q: 更新日志格式是什么?
A: 更新日志使用 Markdown 格式，遵循以下结构:
```markdown
# 更新日志

## v1.0.0
- 新功能 1
- 修复问题 2

## v0.9.0
- 早期版本功能
``` 