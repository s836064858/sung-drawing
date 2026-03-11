<template>
  <div class="canvas-container" ref="canvasRef" @contextmenu.prevent="handleContextMenu">
    <!-- 画布右键菜单 -->
    <div v-if="contextMenuVisible" class="context-menu" :style="{ left: contextMenuPosition.x + 'px', top: contextMenuPosition.y + 'px' }" @click.stop>
      <div v-if="hasSelection">
        <div class="menu-group">
          <div class="menu-item" @click="handleMenuAction('copy')">
            <span>复制</span>
            <span class="shortcut">⌘C</span>
          </div>
          <div class="menu-item" @click="handleMenuAction('duplicate')">
            <span>快速复制</span>
            <span class="shortcut">⌘D</span>
          </div>
          <div class="menu-item" @click="handleMenuAction('delete')">
            <span class="delete-text">删除</span>
            <span class="shortcut">Del</span>
          </div>
        </div>
        <div class="menu-divider"></div>
        <div class="menu-group">
          <div class="menu-item" @click="handleMenuAction('group')">
            <span>编组</span>
            <span class="shortcut">⌘G</span>
          </div>
          <div class="menu-item" @click="handleMenuAction('ungroup')">
            <span>解组</span>
            <span class="shortcut">⇧⌘G</span>
          </div>
        </div>
        <div class="menu-divider"></div>
        <div class="menu-group">
          <div class="menu-item" @click="handleMenuAction('moveTop')">置于顶层</div>
          <div class="menu-item" @click="handleMenuAction('moveUp')">上移一层</div>
          <div class="menu-item" @click="handleMenuAction('moveDown')">下移一层</div>
          <div class="menu-item" @click="handleMenuAction('moveBottom')">置于底层</div>
        </div>
        <div class="menu-divider"></div>
        <div class="menu-group">
          <div class="menu-item" @click="handleMenuAction('toggleLock')">
            {{ isSelectionLocked ? '解锁' : '锁定' }}
            <span class="shortcut">⇧⌘L</span>
          </div>
          <div class="menu-item" @click="handleMenuAction('toggleVisible')">
            {{ isSelectionHidden ? '显示' : '隐藏' }}
            <span class="shortcut">⇧⌘H</span>
          </div>
        </div>
      </div>

      <!-- 空白处菜单 -->
      <div v-else>
        <div class="menu-group">
          <div class="menu-item" @click="handleMenuAction('paste')">
            <span>粘贴</span>
            <span class="shortcut">⌘V</span>
          </div>
          <div class="menu-item" @click="handleMenuAction('selectAll')">
            <span>全选</span>
            <span class="shortcut">⌘A</span>
          </div>
        </div>
        <div class="menu-divider"></div>
        <div class="menu-group">
          <div class="menu-item" @click="handleMenuAction('resetZoom')">
            <span>重置视图</span>
            <span class="shortcut">⌘0</span>
          </div>
          <div class="menu-item" @click="handleMenuAction('showRuler')">
            {{ showRuler ? '隐藏标尺' : '显示标尺' }}
            <span class="shortcut">⇧R</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted, onUnmounted, ref, computed } from 'vue'
import { useStore } from 'vuex'
import { CanvasCore } from '@/core/CanvasCore'

const store = useStore()
const canvasRef = ref(null)
const emit = defineEmits(['mode-change'])
let canvasCore = null

// 上下文菜单状态
const contextMenuVisible = ref(false)
const contextMenuPosition = ref({ x: 0, y: 0 })
const showRuler = ref(true)

const selectedLayerIds = computed(() => store.state.selectedLayerIds)
const hasSelection = computed(() => selectedLayerIds.value.length > 0)

// 简单的多选状态判断 (实际应该去 canvasCore 查询更准确的状态)
const isSelectionLocked = computed(() => {
  if (!canvasCore || !hasSelection.value) return false
  const element = canvasCore.findElementById(selectedLayerIds.value[0])
  return element ? element.locked : false
})

const isSelectionHidden = computed(() => {
  if (!canvasCore || !hasSelection.value) return false
  const element = canvasCore.findElementById(selectedLayerIds.value[0])
  return element ? !element.visible : false
})

const handleContextMenu = (e) => {
  // 阻止默认右键菜单
  e.preventDefault()

  contextMenuPosition.value = { x: e.clientX, y: e.clientY }
  contextMenuVisible.value = true
}

const closeContextMenu = () => {
  contextMenuVisible.value = false
}

const handleMenuAction = (action) => {
  if (!canvasCore) return

  switch (action) {
    case 'copy':
      canvasCore.copySelectedLayers()
      break
    case 'paste':
      canvasCore.pasteLayer()
      break
    case 'duplicate':
      // 如果选中多个，使用 copy + paste，如果单个使用 duplicate
      if (selectedLayerIds.value.length > 1) {
        canvasCore.copySelectedLayers()
        canvasCore.pasteLayer()
      } else if (selectedLayerIds.value.length === 1) {
        canvasCore.duplicateLayer(selectedLayerIds.value[0])
      }
      break
    case 'delete':
      canvasCore.removeSelectedLayers()
      break
    case 'group':
      canvasCore.groupSelected()
      break
    case 'ungroup':
      canvasCore.ungroupSelected()
      break
    case 'moveTop':
      selectedLayerIds.value.forEach((id) => canvasCore.moveLayerTop(id))
      break
    case 'moveBottom':
      // 倒序处理，保持相对顺序
      ;[...selectedLayerIds.value].reverse().forEach((id) => canvasCore.moveLayerBottom(id))
      break
    case 'moveUp':
      ;[...selectedLayerIds.value].reverse().forEach((id) => canvasCore.moveLayerUp(id))
      break
    case 'moveDown':
      selectedLayerIds.value.forEach((id) => canvasCore.moveLayerDown(id))
      break
    case 'toggleLock':
      selectedLayerIds.value.forEach((id) => canvasCore.toggleLock(id))
      break
    case 'toggleVisible':
      selectedLayerIds.value.forEach((id) => canvasCore.toggleVisible(id))
      break
    case 'selectAll':
      canvasCore.selectAllLayers()
      break
    case 'resetZoom':
      canvasCore.app.tree.zoom(1)
      break
    case 'showRuler':
      showRuler.value = !showRuler.value
      canvasCore.toggleRuler(showRuler.value)
      break
  }

  closeContextMenu()
}

onMounted(() => {
  if (canvasRef.value) {
    // 初始化 CanvasCore，传入回调以同步状态
    canvasCore = new CanvasCore(canvasRef.value, {
      onLayersChange: (layers) => {
        store.commit('setLayers', layers)
      },
      onSelectionChange: (selectedIds) => {
        store.commit('setSelectedLayerIds', selectedIds)
      },
      onModeChange: (mode) => {
        emit('mode-change', mode)
      },
      onLayerHover: (layerId) => {
        store.commit('setHoveredLayerId', layerId)
      },
      onLayerUnhover: (layerId) => {
        store.commit('setHoveredLayerId', null)
      }
    })

    // 添加测试元素以验证功能
    // canvasCore.addRect()
    // canvasCore.addText()
  }

  // 全局点击关闭菜单
  window.addEventListener('click', closeContextMenu)
})

onUnmounted(() => {
  if (canvasCore) {
    canvasCore.destroy()
  }
  window.removeEventListener('click', closeContextMenu)
})

// 暴露给父组件（如果有需要）
defineExpose({
  getCanvasCore: () => canvasCore
})
</script>

<style scoped>
.canvas-container {
  width: 100%;
  height: 100%;
  background-color: #f0f2f5;
  position: relative; /* 确保菜单定位相对于容器或 viewport */
}

.context-menu {
  position: fixed;
  z-index: 9999;
  background: white;
  border-radius: 6px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
  border: 1px solid rgba(0, 0, 0, 0.08);
  padding: 4px 0;
  min-width: 160px;
  animation: fadeIn 0.1s ease-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: scale(0.95);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

.menu-group {
  padding: 2px 0;
}

.menu-item {
  padding: 0 16px;
  height: 32px;
  cursor: pointer;
  font-size: 13px;
  color: #333;
  display: flex;
  justify-content: space-between;
  align-items: center;
  transition: all 0.1s;
}

.menu-item:hover {
  background-color: #f5f7fa;
  color: var(--primary-color);
}

.menu-item .shortcut {
  font-size: 11px;
  color: #999;
  margin-left: 24px;
}

.menu-item .delete-text {
  color: #ff4d4f;
}

.menu-item:hover .delete-text {
  color: #ff4d4f;
}

.menu-divider {
  height: 1px;
  background-color: #f0f0f0;
  margin: 4px 0;
}
</style>
