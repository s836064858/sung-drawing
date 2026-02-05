<template>
  <div class="layer-panel" @click.stop>
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
          @select="handleSelect"
          @toggle-visible="handleToggleVisible"
          @toggle-lock="handleToggleLock"
          @remove="handleRemove"
          @drag-start="onDragStart"
          @drag-over="onDragOver"
          @drag-leave="onDragLeave"
          @drop="onDrop"
          @drag-end="onDragEnd"
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
  </div>
</template>

<script setup>
import { computed, inject, ref } from 'vue'
import { useStore } from 'vuex'
import LayerItem from './layer-item.vue'

const store = useStore()

// 拖拽状态
const draggingId = ref(null)
const dragOverId = ref(null)
const dropPosition = ref(null) // 'before' | 'after'

// 从 Store 获取图层数据
const layers = computed(() => store.state.layers)
const selectedLayerIds = computed(() => store.state.selectedLayerIds)

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

  if (offsetY < rect.height / 2) {
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
}

const onPanelDrop = (e) => {
  clearDragState()
}

const onDragEnd = (e) => {
  e.target.style.opacity = ''
  clearDragState()
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
  color: #6b7280;
  text-align: center;
  line-height: 1.5;
}
</style>
