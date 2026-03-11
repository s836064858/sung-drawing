# Sung Drawing

<p align="center">
  <img src="public/logo.png" alt="Sung Drawing Logo" width="120" />
</p>

<p align="center">
  <a href="https://vuejs.org/"><img src="https://img.shields.io/badge/Vue-3.0+-4FC08D?style=flat-square&logo=vue.js" alt="Vue 3"></a>
  <a href="https://www.leaferjs.com/"><img src="https://img.shields.io/badge/Leafer_UI-1.0+-blue?style=flat-square" alt="Leafer UI"></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/License-MIT-blue?style=flat-square" alt="License"></a>
  <a href="https://github.com/s836064858/sung-drawing"><img src="https://img.shields.io/github/stars/s836064858/sung-drawing" alt="GitHub stars"></a>
</p>

<p align="center">
  <strong>基于 Leafer UI 的高性能矢量绘图工具</strong>
</p>

<p align="center">
  <a href="https://s836064858.github.io/sung-drawing/">🔗 <strong>在线预览</strong></a>
</p>

---

## 📖 项目简介

**Sung Drawing** 是一款基于 **Vue 3** + **Leafer UI** 打造的专业级矢量绘图引擎。它深度复刻了 Figma/Sketch 的核心交互体验，旨在为开发者提供一个高性能、可扩展的 Web 图形编辑解决方案。

无论是构建在线设计工具、流程图编辑器，还是复杂的图形可视化应用，Sung Drawing 都能提供坚实的底层支持。

## ✨ 核心亮点

- 🚀 **极致性能**：基于 Leafer UI 引擎，轻松应对海量图形渲染，操作丝般顺滑。
- 🎨 **专业绘图**：内置矩形、圆形、多边形、钢笔（贝塞尔曲线）等全套绘图工具。
- 🧩 **智能交互**：支持智能吸附、多选编组、层级管理、快捷键操作。
- 🛠 **现代架构**：采用 Vue 3 Composition API + Vite + Pinia/Vuex，代码规范，易于二开。
- 📦 **开箱即用**：提供完整的画布交互、属性面板、右键菜单和快捷键系统。

## � 功能概览

### 1. 绘图能力

- **基础图形**：矩形、圆形、菱形、星形、多边形。
- **矢量路径**：
  - **钢笔工具**：支持自由绘制贝塞尔曲线，自动平滑与闭合修正。
  - **线条工具**：直线、箭头，支持端点样式定制。
- **媒体支持**：图片拖拽导入，智能适配视口尺寸。

### 2. 画布交互

- **无限画布**：支持无限平移与缩放（`Ctrl` + 滚轮）。
- **视图控制**：空格键抓手工具、快捷键重置视图。
- **右键菜单**：画布/图层右键菜单，支持复制、粘贴、删除、编组等高频操作。
- **辅助工具**：标尺显示/隐藏、智能对齐（开发中）。

### 3. 图层管理

- **层级结构**：清晰的树形结构展示 Frame、Group 及图层。
- **编组管理**：
  - **编组**：`Ctrl + G` 将多个元素合并。
  - **解组**：`Ctrl + Shift + G` 释放组内元素。
- **层级调整**：支持置顶、置底、上移、下移。
- **状态控制**：一键锁定/解锁、显示/隐藏。

### 4. 属性编辑

- **几何变换**：精确控制坐标 (X/Y)、尺寸 (W/H)、旋转、翻转。
- **样式系统**：
  - **填充**：纯色、线性渐变、径向渐变、图片填充。
  - **描边**：颜色、粗细、虚线样式、端点样式。
  - **效果**：不透明度、圆角、阴影（外阴影/内阴影）。
- **文本排版**：字体、字号、字重、对齐方式、行高、字间距。

### 5. 导入导出

- **导出**：支持 PNG, JPG, WEBP, SVG, PDF, JSON 多种格式。
- **导入**：支持解析 JSON 数据还原画布，支持 Figma 文件解析（实验性）。

## ⌨️ 快捷键指南

| 功能类别 | 功能名称 | Windows                  | macOS                   |
| :------- | :------- | :----------------------- | :---------------------- |
| **编辑** | 撤销     | `Ctrl + Z`               | `Cmd + Z`               |
|          | 恢复     | `Ctrl + Shift + Z` / `Y` | `Cmd + Shift + Z` / `Y` |
|          | 复制     | `Ctrl + C`               | `Cmd + C`               |
|          | 粘贴     | `Ctrl + V`               | `Cmd + V`               |
|          | 快速复制 | `Ctrl + D`               | `Cmd + D`               |
|          | 删除     | `Delete` / `Backspace`   | `Delete` / `Backspace`  |
|          | 全选     | `Ctrl + A`               | `Cmd + A`               |
| **组合** | 编组     | `Ctrl + G`               | `Cmd + G`               |
|          | 解组     | `Ctrl + Shift + G`       | `Cmd + Shift + G`       |
| **视图** | 缩放     | `Ctrl + 滚轮`            | `Cmd + 滚轮`            |
|          | 抓手移动 | `Space + 拖拽`           | `Space + 拖拽`          |
|          | 重置视图 | `Ctrl + 0`               | `Cmd + 0`               |
|          | 标尺开关 | `Shift + R`              | `Shift + R`             |
| **文件** | 保存     | `Ctrl + S`               | `Cmd + S`               |

## 🚀 快速开始

### 环境要求

- Node.js 16+
- npm / yarn / pnpm

### 安装步骤

1.  **克隆仓库**

    ```bash
    git clone https://github.com/s836064858/sung-drawing.git
    cd sung-drawing
    ```

2.  **安装依赖**

    ```bash
    # 推荐使用 npm 并开启 legacy-peer-deps 以解决 Leafer 插件依赖问题
    npm install --legacy-peer-deps
    ```

3.  **启动开发服**

    ```bash
    npm run dev
    ```

4.  **构建生产包**
    ```bash
    npm run build
    ```

## 🛠 技术栈

- **核心框架**: [Vue 3](https://vuejs.org/)
- **构建工具**: [Vite](https://vitejs.dev/)
- **图形引擎**: [Leafer UI](https://www.leaferjs.com/) - 下一代高性能 2D 图形引擎
- **UI 组件**: [Element Plus](https://element-plus.org/)
- **状态管理**: [Vuex 4](https://vuex.vuejs.org/)
- **图标库**: [Remix Icon](https://remixicon.com/)

## 🤝 贡献与支持

欢迎提交 **Issue** 和 **Pull Request**！如果您觉得这个项目对您有帮助，请给一个 ⭐️ **Star** 支持一下！

1.  Fork 本仓库
2.  新建 Feat_xxx 分支
3.  提交代码
4.  新建 Pull Request

## 📄 许可证

本项目采用 [MIT License](LICENSE) 开源许可证。
