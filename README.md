# font-viewer Viewer

一个用于浏览和管理字体的桌面应用程序，基于 Tauri + Vue.js 构建。

![版本](https://img.shields.io/github/v/release/Chatterjay/font-viewer)
![许可证](https://img.shields.io/github/license/Chatterjay/font-viewer)

## ✨ 功能特点

- 🔍 轻松浏览系统已安装的所有字体
- 📊 按类型、样式分类查看字体
- 📝 实时预览不同大小和样式的文本效果
- 📥 支持导入新字体
- 🌈 自定义主题和界面
- 🔄 自动更新功能

## 📸 预览

![应用预览](./public/preview.png)

## 🚀 安装

### 下载安装包

访问 [GitHub Releases](https://github.com/Chatterjay/font-viewer-viewer/releases) 页面下载最新版本的安装包。

### 支持的平台

- Windows (`.msi`, `.exe`)

## 🛠️ 开发

### 前提条件

- [Node.js](https://nodejs.org/) (v14 或更高版本)
- [Rust](https://www.rust-lang.org/) (最新稳定版)
- [Tauri CLI](https://tauri.app/v1/guides/getting-started/prerequisites)

### 设置开发环境

1. 克隆仓库

```bash
git clone https://github.com/Chatterjay/font-viewer.git
cd font-viewer
```

2. 安装依赖

```bash
npm install
```

3. 启动开发服务器

```bash
npm run desktop
```

### 构建应用

```bash
npm run build:desktop
```

构建后的文件将位于 `src-tauri/target/release` 目录中。

## 📦 版本管理

本项目使用统一的版本管理方案，通过自定义脚本同步更新所有相关文件的版本号。

### 版本更新命令

```bash
# 补丁版本更新 (0.0.1 -> 0.0.2)
npm run version:patch

# 次要版本更新 (0.1.0 -> 0.2.0)
npm run version:minor

# 主要版本更新 (1.0.0 -> 2.0.0)
npm run version:major

# 重置版本号
npm run version:reset
```

详细信息请查看 [scripts/README.md](./scripts/README.md)。

## 📝 更新日志

查看 [UPDATE_LOG.md](./UPDATE_LOG.md) 了解所有版本的变更历史。

## 🤝 贡献

欢迎提交问题和功能请求！如果您想贡献代码，请遵循以下步骤：

1. Fork 本仓库
2. 创建您的功能分支 (`git checkout -b feature/amazing-feature`)
3. 提交您的更改 (`git commit -m 'Add some amazing feature'`)
4. 推送到分支 (`git push origin feature/amazing-feature`)
5. 创建一个 Pull Request

## 📄 许可证

本项目采用 [MIT 许可证](./LICENSE)。

## 🙏 鸣谢

- [Tauri](https://tauri.app/) - 提供桌面应用框架
- [Vue.js](https://vuejs.org/) - 前端框架
- [Vite](https://vitejs.dev/) - 构建工具
