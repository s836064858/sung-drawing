<template>
  <el-container class="editor-layout">
    <el-aside :width="isCollapsed ? '0px' : '250px'" class="left-aside" :class="{ collapsed: isCollapsed }">
      <div class="app-brand">
        <div class="logo-wrapper">
          <img :src="logoUrl" alt="Logo" class="logo-img" />
        </div>
        <span class="app-title">Sung Drawing</span>
        <div class="collapse-btn-header" @click="toggleCollapse">
          <i class="ri-side-bar-fill"></i>
        </div>
      </div>

      <div class="left-panel-content">
        <!-- 顶部 Tab 切换 -->
        <div class="panel-tabs">
          <div class="tab-item" :class="{ active: activeTab === 'layers' }" @click="activeTab = 'layers'">图层</div>
          <div class="tab-item" :class="{ active: activeTab === 'resources' }" @click="activeTab = 'resources'">资源</div>
          <div class="tab-item" :class="{ active: activeTab === 'import' }" @click="activeTab = 'import'">导入</div>
        </div>

        <!-- 内容区域 -->
        <div class="panel-body" v-show="activeTab === 'layers'">
          <page-list />
          <div class="layer-panel-container">
            <layer-panel />
          </div>
        </div>

        <div class="panel-body" v-show="activeTab === 'resources'">
          <resource-panel />
        </div>

        <div class="panel-body" v-show="activeTab === 'import'">
          <figma-import-panel />
        </div>
      </div>

      <div class="copyright-info">
        <span>© 2026 Sung Drawing by 荛子</span>
      </div>
    </el-aside>

    <div class="collapsed-brand" v-show="isCollapsed" @click="toggleCollapse">
      <img :src="logoUrl" alt="Logo" class="mini-logo" />
      <i class="ri-side-bar-line expand-icon"></i>
    </div>

    <el-main class="main-content">
      <canvas-area ref="canvasAreaRef" @mode-change="handleModeChange" />
      <div class="toolbar-container">
        <toolbar-panel :active-tool="activeTool" :can-undo="canUndo" :can-redo="canRedo" @tool-change="handleToolChange" />
      </div>
      <size-info />
    </el-main>
    <el-aside width="300px">
      <property-panel />
    </el-aside>
  </el-container>
</template>

<script setup>
import { ref, provide, onMounted } from 'vue'
import PageList from './components/page-list.vue'
import LayerPanel from './components/layer-panel.vue'
import ResourcePanel from './components/resource-panel.vue'
import CanvasArea from './components/canvas-area.vue'
import PropertyPanel from './components/property-panel.vue'
import ToolbarPanel from './components/toolbar-panel.vue'
import SizeInfo from './components/size-info.vue'
import FigmaImportPanel from './components/figma-import-panel.vue'
import logoUrl from '@/assets/image/logo.png'

const canvasAreaRef = ref(null)
const activeTool = ref('select')
const canUndo = ref(false)
const canRedo = ref(false)
const isCollapsed = ref(false)
const activeTab = ref('layers') // 'layers' | 'resources' | 'import'

const toggleCollapse = () => {
  isCollapsed.value = !isCollapsed.value
}

// 提供 getCanvasCore 方法给子组件 (LayerPanel) 使用
provide('getCanvasCore', () => canvasAreaRef.value?.getCanvasCore())

const handleModeChange = (mode) => {
  activeTool.value = mode
}

const handleHistoryChange = (state) => {
  canUndo.value = state.canUndo
  canRedo.value = state.canRedo
}

onMounted(() => {
  // 监听历史记录变化
  const checkCore = setInterval(() => {
    const core = canvasAreaRef.value?.getCanvasCore()
    if (core) {
      clearInterval(checkCore)
      // 注入回调
      core.callbacks.onHistoryChange = handleHistoryChange
    }
  }, 100)
})

const handleToolChange = (event) => {
  const canvasCore = canvasAreaRef.value?.getCanvasCore()
  if (!canvasCore) return

  if (event.type === 'mode') {
    activeTool.value = event.value
    canvasCore.setMode(event.value)
  } else if (event.type === 'action') {
    if (event.value === 'add-image') {
      canvasCore.addImage(event.data)
    } else if (event.value === 'undo') {
      canvasCore.undo()
    } else if (event.value === 'redo') {
      canvasCore.redo()
    } else if (event.value === 'toggle-ruler') {
      canvasCore.toggleRuler(event.data)
    }
  }
}
</script>

<style scoped>
/* 左侧面板布局优化 */
.left-panel-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  min-height: 0;
}

.panel-tabs {
  display: flex;
  padding: 6px;
  background-color: #fff;
  border-bottom: 1px solid #f0f2f5;
  flex-shrink: 0;
  gap: 4px;
}

.tab-item {
  flex: 1;
  text-align: center;
  padding: 8px 0;
  font-size: 13px;
  color: #606266;
  cursor: pointer;
  transition: all 0.2s ease;
  border-radius: 6px;
  background-color: transparent;
  user-select: none;
}

.tab-item:hover {
  color: #303133;
  background-color: rgba(0, 0, 0, 0.04);
}

.tab-item.active {
  color: var(--primary-color);
  background-color: var(--primary-color-light);
  font-weight: 600;
}

.panel-body {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  min-height: 0;
}

.layer-panel-container {
  flex: 1;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.editor-layout {
  height: 100vh;
  width: 100vw;
  overflow: hidden;
  position: relative;
}

.left-aside {
  display: flex;
  flex-direction: column;
  border-right: 1px solid #e5e7eb;
  background-color: #fff;
  z-index: 10;
  transition: width 0.3s ease;
  position: relative;
  overflow: hidden;
}

.left-aside.collapsed {
  border-right: none;
}

.collapse-btn-header {
  margin-left: auto;
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: #909399;
  border-radius: 6px;
  transition: all 0.2s ease;
  flex-shrink: 0;
}

.collapse-btn-header:hover {
  color: var(--primary-color);
  background-color: rgba(0, 0, 0, 0.04);
}

.collapsed-brand {
  position: absolute;
  top: 10px;
  left: 10px;
  z-index: 20;
  display: flex;
  align-items: center;
  gap: 4px;
  background-color: #fff;
  border-radius: 8px;
  padding: 4px 8px 4px 4px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  cursor: pointer;
  animation: fadeIn 0.3s ease;
  transition: box-shadow 0.2s ease;
}

.collapsed-brand:hover {
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.15);
}

.collapsed-brand .expand-icon {
  font-size: 16px;
  color: #909399;
  transition: color 0.2s;
}

.collapsed-brand:hover .expand-icon {
  color: var(--primary-color);
}

.mini-logo {
  width: 24px;
  height: 24px;
  object-fit: contain;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: scale(0.8);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

.app-brand {
  height: 56px;
  display: flex;
  align-items: center;
  padding: 0 16px;
  border-bottom: 1px solid #f3f4f6;
  flex-shrink: 0;
}

.logo-wrapper {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 12px;
}

.logo-img {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.app-title {
  font-size: 16px;
  font-weight: 700;
  color: #1f2937;
  letter-spacing: -0.5px;
}

.layer-panel-container {
  flex: 1;
  overflow: hidden;
}

/* 覆盖 layer-panel 的边框，因为已经移到 aside 上了 */
:deep(.layer-panel) {
  border-right: none !important;
}

.copyright-info {
  padding: 12px;
  text-align: center;
  font-size: 11px;
  color: #9ca3af;
  border-top: 1px solid #f3f4f6;
  background-color: #fff;
  flex-shrink: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.main-content {
  padding: 0;
  position: relative;
}

.toolbar-container {
  position: absolute;
  bottom: 24px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 100;
}
</style>
