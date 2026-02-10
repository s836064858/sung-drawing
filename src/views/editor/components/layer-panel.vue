<template>
  <div class="layer-panel" @click.stop="closeContextMenu">
    <div class="panel-header">
      <i class="ri-stack-line icon"></i>
      <h3>图层</h3>
    </div>
    <div class="panel-content custom-scrollbar" @dragover.prevent @drop="onPanelDrop">
      <div v-if="layers.length > 0" class="layer-list">
        <LayerItem
          v-for="layer in layers.filter((l) => !l.isInternal)"
          :key="layer.id"
          :layer="layer"
          :selected-ids="selectedLayerIds"
          :dragging-id="draggingId"
          :drag-over-id="dragOverId"
          :drop-position="dropPosition"
          :hovered-id="hoveredLayerId"
          :renaming-id="renamingLayerId"
          @select="handleSelect"
          @toggle-visible="handleToggleVisible"
          @toggle-lock="handleToggleLock"
          @remove="handleRemove"
          @drag-start="onDragStart"
          @drag-over="onDragOver"
          @drag-leave="onDragLeave"
          @drop="onDrop"
          @drag-end="onDragEnd"
          @hover-start="handleHoverStart"
          @hover-end="handleHoverEnd"
          @context-menu="handleContextMenu"
          @rename-confirm="handleRenameConfirm"
          @rename-cancel="handleRenameCancel"
        />
      </div>
      <!-- 空状态 -->
      <div v-else class="empty-state">
        <div class="empty-icon-wrapper">
          <i class="ri-stack-line"></i>
        </div>
        <div class="empty-title">暂无图层</div>
        <div class="empty-desc">在画布上绘制或从工具栏<br />添加元素以开始创作</div>
      </div>
    </div>

    <!-- 右键菜单 -->
    <div v-if="contextMenuVisible" class="context-menu" :style="{ left: contextMenuPosition.x + 'px', top: contextMenuPosition.y + 'px' }" @click.stop>
      <div class="menu-group">
        <div class="menu-label">图层</div>
        <div class="menu-item" @click="handleMenuAction('moveUp')">移动上一层</div>
        <div class="menu-item" @click="handleMenuAction('moveDown')">移动下一层</div>
        <div class="menu-item" @click="handleMenuAction('moveTop')">图层置顶</div>
        <div class="menu-item" @click="handleMenuAction('moveBottom')">图层置底</div>
      </div>
      <div class="menu-divider"></div>
      <div class="menu-group">
        <div class="menu-label">操作</div>
        <div class="menu-item" @click="handleMenuAction('duplicate')">
          <span>复制图层</span>
          <span class="shortcut">⌘D</span>
        </div>
        <div class="menu-item" @click="handleMenuAction('rename')">重命名</div>
        <div class="menu-item" @click="handleMenuAction('toggleLock')">
          {{ contextMenuTarget?.locked ? '解锁' : '加锁' }}
        </div>
        <div class="menu-item" @click="handleMenuAction('toggleVisible')">
          {{ contextMenuTarget?.visible ? '隐藏' : '显示' }}
        </div>
        <div class="menu-item delete" @click="handleMenuAction('delete')">删除</div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, inject, ref, onMounted, onUnmounted } from 'vue'
import { useStore } from 'vuex'
import LayerItem from './layer-item.vue'
import { ElMessageBox } from 'element-plus'
import { isContainerTag } from '@/core/constants/element-types'

const store = useStore()

// 重命名状态
const renamingLayerId = ref(null)

// 右键菜单状态
const contextMenuVisible = ref(false)
const contextMenuPosition = ref({ x: 0, y: 0 })
const contextMenuTarget = ref(null)

const closeContextMenu = () => {
  contextMenuVisible.value = false
}

const handleContextMenu = (e, layer) => {
  contextMenuVisible.value = true
  // 简单的边界处理，防止菜单溢出屏幕（可选优化）
  contextMenuPosition.value = { x: e.clientX, y: e.clientY }
  contextMenuTarget.value = layer
}

const handleMenuAction = (action) => {
  const core = getCore()
  if (!core || !contextMenuTarget.value) return

  const id = contextMenuTarget.value.id

  switch (action) {
    case 'moveUp':
      core.moveLayerUp(id)
      break
    case 'moveDown':
      core.moveLayerDown(id)
      break
    case 'moveTop':
      core.moveLayerTop(id)
      break
    case 'moveBottom':
      core.moveLayerBottom(id)
      break
    case 'duplicate':
      core.duplicateLayer(id)
      break
    case 'rename':
      renamingLayerId.value = id
      break
    case 'toggleLock':
      core.toggleLock(id)
      break
    case 'toggleVisible':
      core.toggleVisible(id)
      break
    case 'delete':
      ElMessageBox.confirm('确定要删除该图层吗？', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      })
        .then(() => {
          core.removeLayer(id)
        })
        .catch(() => {
          // catch cancel
        })
      break
  }

  closeContextMenu()
}

const handleRenameConfirm = (id, newName) => {
  const core = getCore()
  if (core && newName && newName.trim()) {
    core.renameLayer(id, newName.trim())
  }
  renamingLayerId.value = null
}

const handleRenameCancel = () => {
  renamingLayerId.value = null
}

onMounted(() => {
  window.addEventListener('click', closeContextMenu)
})

onUnmounted(() => {
  window.removeEventListener('click', closeContextMenu)
})

// 拖拽状态
const draggingId = ref(null)
const dragOverId = ref(null)
const dropPosition = ref(null) // 'before' | 'after'

// 从 Store 获取图层数据
const layers = computed(() => store.state.layers)
const selectedLayerIds = computed(() => store.state.selectedLayerIds)
const hoveredLayerId = computed(() => store.state.hoveredLayerId)

const getCanvasCore = inject('getCanvasCore')

const getCore = () => {
  if (getCanvasCore) return getCanvasCore()
  return null
}

// 拖拽事件处理
const onDragStart = (e, layer) => {
  draggingId.value = layer.id
  e.dataTransfer.effectAllowed = 'move'
  e.dataTransfer.setData('text/plain', layer.id)
  e.target.style.opacity = '0.5'
}

const onDragOver = (e, layer) => {
  if (draggingId.value === layer.id) {
    dragOverId.value = null
    dropPosition.value = null
    return
  }

  dragOverId.value = layer.id

  const rect = e.currentTarget.getBoundingClientRect()
  const offsetY = e.clientY - rect.top
  const height = rect.height

  // 检查是否是容器类型
  const isContainer = isContainerTag(layer.type)

  if (isContainer) {
    // 容器判定区域：中间 50%
    const threshold = height * 0.25
    if (offsetY > threshold && offsetY < height - threshold) {
      dropPosition.value = 'inside'
      return
    }
  }

  if (offsetY < height / 2) {
    dropPosition.value = 'before'
  } else {
    dropPosition.value = 'after'
  }
}

const onDragLeave = (e) => {
  // 简单处理
}

const onDrop = (e, targetLayer) => {
  e.preventDefault()

  if (draggingId.value && draggingId.value !== targetLayer.id) {
    const core = getCore()
    if (core) {
      core.reorderLayer(draggingId.value, targetLayer.id, dropPosition.value)
    }
  }

  clearDragState()
  if (e.target.style) {
    e.target.style.opacity = ''
  }
}

const onPanelDrop = (e) => {
  e.preventDefault()
  // 处理放置在面板空白处的情况（移动到顶层末尾）
  if (draggingId.value && !dragOverId.value) {
    const core = getCore()
    // 暂时未实现移动到根节点的逻辑，或者复用 reorderLayer
  }
  clearDragState()
}

const onDragEnd = (e) => {
  clearDragState()
  if (e.target.style) {
    e.target.style.opacity = ''
  }
}

const clearDragState = () => {
  draggingId.value = null
  dragOverId.value = null
  dropPosition.value = null
}

const handleSelect = (layer) => {
  const core = getCore()
  if (core) {
    core.selectLayer(layer.id)
  }
}

const handleToggleVisible = (layer) => {
  const core = getCore()
  if (core) {
    core.toggleVisible(layer.id)
  }
}

const handleToggleLock = (layer) => {
  const core = getCore()
  if (core) {
    core.toggleLock(layer.id)
  }
}

const handleRemove = (layer) => {
  const core = getCore()
  if (core) {
    core.removeLayer(layer.id)
  }
}

const handleHoverStart = (layer) => {
  const core = getCore()
  if (core) {
    core.highlightLayer(layer.id)
  }
}

const handleHoverEnd = (layer) => {
  const core = getCore()
  if (core) {
    core.unhighlightLayer(layer.id)
  }
}
</script>

<style scoped>
.layer-panel {
  height: 100%;
  display: flex;
  flex-direction: column;
  background-color: #fff;
  border-right: 1px solid #e5e7eb;
  user-select: none;
}

.panel-header {
  height: 40px;
  padding: 0 12px;
  display: flex;
  align-items: center;
  border-bottom: 1px solid #f3f4f6;
  background-color: #fff;
}

.panel-header h3 {
  margin: 0;
  font-size: 13px;
  font-weight: 600;
  color: #374151;
}

.icon {
  margin-right: 8px;
  font-size: 16px;
  color: #6b7280;
}

.panel-content {
  flex: 1;
  overflow-y: overlay;
  padding: 4px 0;
}

.layer-list {
  display: flex;
  flex-direction: column;
}

/* 滚动条样式 */
.custom-scrollbar::-webkit-scrollbar {
  width: 4px;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background: transparent;
  border-radius: 2px;
}
.custom-scrollbar:hover::-webkit-scrollbar-thumb {
  background: #d1d5db;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}

/* 空状态样式 */
.empty-state {
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #9ca3af;
  padding-bottom: 40px;
}

.empty-icon-wrapper {
  width: 64px;
  height: 64px;
  background-color: #f3f4f6;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 16px;
}

.empty-icon-wrapper i {
  font-size: 32px;
  color: #9ca3af;
}

.empty-title {
  font-size: 14px;
  font-weight: 600;
  color: #374151;
  margin-bottom: 8px;
}

.empty-desc {
  font-size: 12px;
  text-align: center;
  line-height: 1.5;
}

.context-menu {
  position: fixed;
  z-index: 9999;
  background: white;
  border-radius: 4px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  border: 1px solid #ebeef5;
  padding: 4px 0;
  min-width: 120px;
}

.menu-group {
  padding: 4px 0;
}

.menu-label {
  padding: 0 12px;
  font-size: 12px;
  color: #909399;
  line-height: 24px;
}

.menu-item {
  padding: 0 12px;
  line-height: 32px;
  cursor: pointer;
  font-size: 13px;
  color: #606266;
  transition: all 0.1s;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.menu-item .shortcut {
  font-size: 11px;
  color: #909399;
  margin-left: 16px;
}

.menu-item:hover {
  background-color: #f5f7fa;
  color: var(--el-color-primary);
}

.menu-item.delete {
  color: #ef4444; /* red-500 */
}

.menu-item.delete:hover {
  background-color: #fee2e2; /* red-100 */
  color: #dc2626; /* red-600 */
}

.menu-divider {
  height: 1px;
  background-color: #ebeef5;
  margin: 2px 0;
}
</style>
