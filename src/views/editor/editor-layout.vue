<template>
  <el-container class="editor-layout">
    <el-aside :width="isCollapsed ? '0px' : '250px'" class="left-aside" :class="{ collapsed: isCollapsed }">
      <div class="app-brand">
        <div class="logo-wrapper">
          <img :src="logoUrl" alt="Logo" class="logo-img" />
        </div>
        <span class="app-title">Sung Drawing</span>
        <a class="github-link" href="https://github.com/s836064858/sung-drawing" target="_blank" rel="noopener noreferrer" title="GitHub">
          <img src="https://github.githubassets.com/favicons/favicon.svg" alt="GitHub" class="github-icon" />
        </a>
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

        <!-- 底部设置按钮 -->
        <div class="bottom-settings">
          <div class="setting-item" @click="openSettings">
            <i class="ri-settings-3-line"></i>
            <span>设置</span>
          </div>
        </div>
      </div>

      <div class="copyright-info">
        <span>© 2026 Sung Drawing by 荛子</span>
      </div>
    </el-aside>

    <settings-panel ref="settingsPanelRef" />

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
      <ai-toolbar />
      <shortcut-guide />
      <transition name="mode-toast-fade">
        <div v-if="modeToastVisible" class="mode-toast">{{ modeToastText }}</div>
      </transition>
    </el-main>

    <div class="right-collapsed-brand" v-show="isRightCollapsed" @click="toggleRightCollapse">
      <i class="ri-side-bar-line expand-icon" style="transform: rotate(180deg)"></i>
    </div>

    <el-aside :width="isRightCollapsed ? '0px' : '300px'" class="right-aside" :class="{ collapsed: isRightCollapsed }">
      <div class="right-collapse-btn" @click="toggleRightCollapse">
        <i class="ri-side-bar-fill" style="transform: rotate(180deg)"></i>
      </div>
      <property-panel />
    </el-aside>
  </el-container>
</template>

<script setup>
import { ref, provide, onMounted, onUnmounted } from 'vue'
import PageList from './components/panels/left/page-list.vue'
import LayerPanel from './components/panels/left/layer-panel.vue'
import ResourcePanel from './components/panels/left/resource-panel.vue'
import FigmaImportPanel from './components/panels/left/figma-import-panel.vue'
import CanvasArea from './components/canvas/canvas-area.vue'
import SizeInfo from './components/canvas/size-info.vue'
import PropertyPanel from './components/panels/right/property-panel.vue'
import ToolbarPanel from './components/toolbar/toolbar-panel.vue'
import AiToolbar from './components/toolbar/ai-toolbar.vue'
import SettingsPanel from './components/modals/settings-panel.vue'
import ShortcutGuide from './components/modals/shortcut-guide.vue'
import logoUrl from '@/assets/image/logo.png'

const canvasAreaRef = ref(null)
const settingsPanelRef = ref(null)
const activeTool = ref('select')
const canUndo = ref(false)
const canRedo = ref(false)
const isCollapsed = ref(false)
const isRightCollapsed = ref(false)
const activeTab = ref('layers') // 'layers' | 'resources' | 'import'
const modeToastVisible = ref(false)
const modeToastText = ref('')
let modeToastTimer = null

const modeToastMap = {
  select: { label: '选择模式', key: 'V / Esc' },
  move: { label: '移动模式', key: 'H' },
  pen: { label: '钢笔工具', key: 'P' },
  rect: { label: '矩形工具', key: 'R' },
  ellipse: { label: '圆形工具', key: 'O' },
  diamond: { label: '菱形工具', key: 'D' },
  line: { label: '直线工具', key: 'L' },
  arrow: { label: '箭头工具', key: 'A' },
  frame: { label: 'Frame 工具', key: 'F' },
  text: { label: '文字工具', key: 'T' }
}

const showModeToast = (message) => {
  modeToastText.value = message
  modeToastVisible.value = true
  if (modeToastTimer) clearTimeout(modeToastTimer)
  modeToastTimer = setTimeout(() => {
    modeToastVisible.value = false
    modeToastTimer = null
  }, 1100)
}

const toggleCollapse = () => {
  isCollapsed.value = !isCollapsed.value
}

const openSettings = () => {
  settingsPanelRef.value?.open()
}

const toggleRightCollapse = () => {
  isRightCollapsed.value = !isRightCollapsed.value
}

// 提供 getCanvasCore 方法给子组件 (LayerPanel) 使用
provide('getCanvasCore', () => canvasAreaRef.value?.getCanvasCore())

const handleModeChange = (mode) => {
  if (activeTool.value === mode) return
  activeTool.value = mode

  const modeInfo = modeToastMap[mode]
  if (!modeInfo) return

  showModeToast(`已切换到${modeInfo.label} (${modeInfo.key})`)
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

onUnmounted(() => {
  if (modeToastTimer) {
    clearTimeout(modeToastTimer)
    modeToastTimer = null
  }
})

const handleToolChange = (event) => {
  const canvasCore = canvasAreaRef.value?.getCanvasCore()
  if (!canvasCore) return

  if (event.type === 'mode') {
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
.left-panel-content {
  flex: 1;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.bottom-settings {
  padding: 4px 8px;
  /* border-top: 1px solid var(--border-color); */
  background-color: transparent;
  margin-top: auto;
}

.setting-item {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 6px;
  cursor: pointer;
  border-radius: 4px;
  color: #909399;
  font-size: 12px;
  transition: all 0.2s;
  width: fit-content;
  margin: 0 auto 8px;
}

.setting-item:hover {
  background-color: rgba(0, 0, 0, 0.04);
  color: #606266;
}

.setting-item i {
  font-size: 14px;
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

.mode-toast {
  position: fixed;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  background-color: rgba(155, 155, 155, 0.7);
  color: #fff;
  padding: 10px 16px;
  border-radius: 10px;
  font-size: 13px;
  font-weight: 500;
  z-index: 10010;
  pointer-events: none;
  backdrop-filter: blur(3px);
  white-space: nowrap;
}

.mode-toast-fade-enter-active,
.mode-toast-fade-leave-active {
  transition: opacity 0.18s ease;
}

.mode-toast-fade-enter-from,
.mode-toast-fade-leave-to {
  opacity: 0;
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

.github-link {
  margin-left: auto;
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
  transition: all 0.2s ease;
  flex-shrink: 0;
}

.github-link:hover {
  background-color: rgba(0, 0, 0, 0.04);
}

.github-icon {
  width: 18px;
  height: 18px;
  object-fit: contain;
  opacity: 0.6;
  transition: opacity 0.2s ease;
}

.github-link:hover .github-icon {
  opacity: 1;
}

.collapse-btn-header {
  margin-left: 4px;
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

.right-aside {
  border-left: 1px solid #e5e7eb;
  background-color: #fff;
  z-index: 10;
  transition: width 0.3s ease;
  position: relative;
  overflow: hidden;
}

.right-aside.collapsed {
  border-left: none;
}

.right-aside :deep(.property-panel) {
  min-width: 300px;
}

.right-collapse-btn {
  position: absolute;
  top: 6px;
  right: 12px;
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: #909399;
  border-radius: 6px;
  transition: all 0.2s ease;
  z-index: 20;
}

.right-collapse-btn:hover {
  color: var(--primary-color);
  background-color: rgba(0, 0, 0, 0.04);
}

.right-collapsed-brand {
  position: absolute;
  top: 10px;
  right: 10px;
  z-index: 20;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  cursor: pointer;
  animation: fadeIn 0.3s ease;
  transition: box-shadow 0.2s ease;
}

.right-collapsed-brand:hover {
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.15);
}

.right-collapsed-brand .expand-icon {
  font-size: 16px;
  color: #909399;
  transition: color 0.2s;
}

.right-collapsed-brand:hover .expand-icon {
  color: var(--primary-color);
}
</style>
