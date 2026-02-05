# Sung Drawing

[![Vue 3](https://img.shields.io/badge/Vue-3.0+-4FC08D?style=flat-square&logo=vue.js)](https://vuejs.org/) [![Leafer UI](https://img.shields.io/badge/Leafer_UI-1.0+-blue?style=flat-square)](https://www.leaferjs.com/) [![License](https://img.shields.io/badge/License-MIT-blue?style=flat-square)](LICENSE) [![GitHub stars](https://img.shields.io/github/stars/s836064858/sung-drawing)](https://github.com/s836064858/sung-drawing)

> **基于 Leafer UI 的高性能矢量绘图工具**

## 📖 项目定位

Sung Drawing 是一款基于 **Vue 3** + **Leafer UI** 开发的专业级矢量绘图工具。它提供了类似 Figma/Sketch 的操作体验，支持高性能的图形渲染和复杂的交互逻辑，旨在为开发者提供一个可扩展的 Web 绘图引擎解决方案。

## ✨ 核心优势

- **高性能渲染**：基于 Leafer UI 引擎，支持海量图形流畅渲染。
- **专业级绘图**：内置矩形、圆形、多边形、钢笔等专业绘图工具。
- **现代化架构**：采用 Vue 3 Composition API + Vite + Pinia/Vuex，代码结构清晰。
- **完整交互**：支持图层管理、属性编辑、快捷键操作、历史记录（撤销/恢复）。
- **无限画布**：支持画布无限缩放、平移，适合大屏展示或复杂设计场景。

## 🚀 快速上手

### 1. 安装依赖

```bash
# 克隆项目
git clone https://github.com/s836064858/sung-drawing.git

# 进入目录
cd sung-drawing

# 安装依赖
npm install
```

### 2. 启动开发服务器

```bash
npm run dev
```

### 3. 构建生产版本

```bash
npm run build
```

## 📚 功能特性

### 🎨 绘图工具

- **基础图形**：矩形、圆形、菱形、星形、多边形。
- **线条工具**：直线、箭头。
- **钢笔工具**：支持自由绘制，具备自动平滑处理和智能闭合修正功能。
- **图片导入**：支持拖拽上传图片，自动适配视口大小。

### 📝 图层管理

- **树形结构**：清晰展示 Frame、Group 及各类图形的层级关系。
- **拖拽排序**：支持图层上下拖拽调整层级。
- **成组/解组**：支持多选元素进行成组（Frame）操作。
- **状态控制**：一键锁定/解锁、显示/隐藏图层。

### ⚙️ 属性编辑

- **变换属性**：精确调整 X/Y 坐标、宽度/高度、旋转角度、水平/垂直翻转。
- **外观样式**：
  - **填充**：支持纯色填充、图片填充。
  - **描边**：支持描边颜色、粗细调整。
  - **效果**：支持不透明度、圆角设置。
- **文本排版**：支持字体、字号、字重、对齐方式（左/中/右）、行高、字间距调整。

### ⌨️ 快捷键支持

| 功能     | Windows                         | macOS                         |
| -------- | ------------------------------- | ----------------------------- |
| 撤销     | `Ctrl + Z`                      | `Cmd + Z`                     |
| 恢复     | `Ctrl + Shift + Z` / `Ctrl + Y` | `Cmd + Shift + Z` / `Cmd + Y` |
| 复制     | `Ctrl + C`                      | `Cmd + C`                     |
| 粘贴     | `Ctrl + V`                      | `Cmd + V`                     |
| 删除     | `Delete` / `Backspace`          | `Delete` / `Backspace`        |
| 全选     | `Ctrl + A`                      | `Cmd + A`                     |
| 保存     | `Ctrl + S`                      | `Cmd + S`                     |
| 缩放     | `Ctrl + 滚轮`                   | `Cmd + 滚轮`                  |
| 移动画布 | `空格 + 拖拽`                   | `空格 + 拖拽`                 |

### 📤 导入导出

- **格式支持**：支持导出为 PNG, JPG, WEBP, SVG, PDF, JSON。
- **选区导出**：支持仅导出选中元素或整个画布。

## 🛠 技术栈

- **核心框架**: [Vue 3](https://vuejs.org/)
- **构建工具**: [Vite](https://vitejs.dev/)
- **图形引擎**: [Leafer UI](https://www.leaferjs.com/)
- **UI 组件库**: [Element Plus](https://element-plus.org/)
- **状态管理**: [Vuex 4](https://vuex.vuejs.org/)
- **路由管理**: [Vue Router 4](https://router.vuejs.org/)
- **图标库**: [Remix Icon](https://remixicon.com/)

## 🤝 贡献指南

欢迎提交 Issue 和 Pull Request！

1. **Fork** 本仓库
2. 新建 Feat_xxx 分支
3. 提交代码
4. 新建 **Pull Request**

## 📄 许可证

本项目采用 [MIT License](LICENSE) 开源许可证。
