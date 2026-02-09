<template>
  <el-container class="editor-layout">
    <el-aside :width="isCollapsed ? '0px' : '250px'" class="left-aside" :class="{ collapsed: isCollapsed }">
      <div class="app-brand">
        <div class="logo-wrapper">
          <img :src="logoUrl" alt="Logo" class="logo-img" />
        </div>
        <span class="app-title">Sung Drawing</span>
      </div>

      <div class="left-panel-content">
        <page-list />
        <div class="layer-panel-container">
          <layer-panel />
        </div>
      </div>

      <div class="copyright-info">
        <span>© 2026 Sung Drawing by 荛子</span>
      </div>
    </el-aside>

    <div class="collapse-btn" @click="toggleCollapse" :style="{ left: isCollapsed ? '0' : '250px' }">
      <i :class="isCollapsed ? 'ri-arrow-right-s-line' : 'ri-arrow-left-s-line'"></i>
    </div>

    <div class="collapsed-logo" v-show="isCollapsed">
      <img :src="logoUrl" alt="Logo" class="mini-logo" />
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
import CanvasArea from './components/canvas-area.vue'
import PropertyPanel from './components/property-panel.vue'
import ToolbarPanel from './components/toolbar-panel.vue'
import SizeInfo from './components/size-info.vue'
import logoUrl from '@/assets/image/logo.png'

const canvasAreaRef = ref(null)
const activeTool = ref('select')
const canUndo = ref(false)
const canRedo = ref(false)
const isCollapsed = ref(false)

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
  min-height: 0; /* 关键：允许 flex 子项收缩 */
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

.collapse-btn {
  position: absolute;
  top: 50%;
  width: 24px;
  height: 24px;
  background-color: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 0 50% 50% 0;
  border-left: none;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  z-index: 20;
  transform: translateY(-50%);
  color: #909399;
  box-shadow: 2px 0 4px rgba(0, 0, 0, 0.05);
  transition:
    left 0.3s ease,
    color 0.2s,
    box-shadow 0.2s;
}

.collapse-btn:hover {
  color: var(--primary-color);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.collapsed-logo {
  position: absolute;
  top: 12px;
  left: 12px;
  width: 32px;
  height: 32px;
  z-index: 20;
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  animation: fadeIn 0.3s ease;
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
