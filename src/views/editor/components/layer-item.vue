<template>
  <div class="layer-item-wrapper">
    <div
      class="layer-item"
      :class="{
        active: isSelected,
        hovered: isHovered,
        'is-dragging': draggingId === layer.id,
        'drag-over-top': dragOverId === layer.id && dropPosition === 'before',
        'drag-over-bottom': dragOverId === layer.id && dropPosition === 'after'
      }"
      :style="{ paddingLeft: `${depth * 16 + 12}px` }"
      draggable="true"
      @click="$emit('select', layer)"
      @dragstart="$emit('drag-start', $event, layer)"
      @dragover.prevent="$emit('drag-over', $event, layer)"
      @dragleave="$emit('drag-leave', $event)"
      @drop.stop="$emit('drop', $event, layer)"
      @dragend="$emit('drag-end', $event)"
      @mouseenter="$emit('hover-start', layer)"
      @mouseleave="$emit('hover-end', layer)"
    >
      <!-- 选中指示条 -->
      <div class="active-bar" v-show="isSelected"></div>

      <!-- 展开/收起按钮 (仅 Frame 有子元素时显示) -->
      <div v-if="hasChildren" class="expand-btn" @click.stop="toggleExpand">
        <i :class="isExpanded ? 'ri-arrow-down-s-line' : 'ri-arrow-right-s-line'"></i>
      </div>
      <div v-else class="expand-placeholder"></div>

      <!-- 图层名称 -->
      <div class="layer-info">
        <i class="type-icon" :class="getTypeIcon(layer.type)"></i>
        <span class="name-text">{{ layer.name }}</span>
      </div>

      <div class="layer-actions">
        <!-- 锁定切换 -->
        <div class="layer-action lock-btn" @click.stop="$emit('toggle-lock', layer)" :class="{ 'is-locked': layer.locked }">
          <i v-if="layer.locked" class="ri-lock-2-line"></i>
          <i v-else class="ri-lock-unlock-line"></i>
        </div>

        <!-- 显隐切换 -->
        <div class="layer-action visible-btn" @click.stop="$emit('toggle-visible', layer)" :class="{ 'is-hidden': !layer.visible }">
          <i :class="layer.visible ? 'ri-eye-line' : 'ri-eye-off-line'"></i>
        </div>

        <!-- 删除按钮 -->
        <div class="layer-action delete-btn" @click.stop="$emit('remove', layer)">
          <i class="ri-delete-bin-line"></i>
        </div>
      </div>
    </div>

    <!-- 递归渲染子图层 -->
    <div v-if="hasChildren && isExpanded" class="children-list">
      <LayerItem
        v-for="child in (layer.children || []).filter((c) => !c.isInternal)"
        :key="child.id"
        :layer="child"
        :depth="depth + 1"
        :selected-ids="selectedIds"
        :dragging-id="draggingId"
        :drag-over-id="dragOverId"
        :drop-position="dropPosition"
        :hovered-id="hoveredId"
        @select="$emit('select', $event)"
        @toggle-visible="$emit('toggle-visible', $event)"
        @toggle-lock="$emit('toggle-lock', $event)"
        @remove="$emit('remove', $event)"
        @drag-start="$emit('drag-start', $event, child)"
        @drag-over="$emit('drag-over', $event, child)"
        @drag-leave="$emit('drag-leave', $event)"
        @drop="$emit('drop', $event, child)"
        @drag-end="$emit('drag-end', $event)"
        @hover-start="$emit('hover-start', $event)"
        @hover-end="$emit('hover-end', $event)"
      />
    </div>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'

const props = defineProps({
  layer: {
    type: Object,
    required: true
  },
  depth: {
    type: Number,
    default: 0
  },
  selectedIds: {
    type: Array,
    default: () => []
  },
  draggingId: {
    type: [String, Number],
    default: null
  },
  dragOverId: {
    type: [String, Number],
    default: null
  },
  dropPosition: {
    type: String,
    default: null
  },
  hoveredId: {
    type: [String, Number],
    default: null
  }
})

defineEmits(['select', 'toggle-visible', 'toggle-lock', 'remove', 'drag-start', 'drag-over', 'drag-leave', 'drop', 'drag-end', 'hover-start', 'hover-end'])

const isExpanded = ref(true)

const hasChildren = computed(() => {
  return props.layer.children && props.layer.children.length > 0
})

const isSelected = computed(() => {
  if (!props.selectedIds) return false
  return props.selectedIds.some((selId) => String(selId) === String(props.layer.id))
})

const isHovered = computed(() => {
  return String(props.hoveredId) === String(props.layer.id)
})

const toggleExpand = () => {
  isExpanded.value = !isExpanded.value
}

const getTypeIcon = (type) => {
  switch (type) {
    case 'Rect':
      return 'ri-rectangle-line'
    case 'Ellipse':
      return 'ri-circle-line'
    case 'Polygon':
      return 'ri-vip-diamond-line'
    case 'Text':
      return 'ri-text'
    case 'Frame':
      return 'ri-layout-line'
    case 'Group':
      return 'ri-group-line'
    case 'Image':
      return 'ri-image-line'
    case 'Line':
      return 'ri-subtract-line'
    case 'Arrow':
      return 'ri-arrow-right-line'
    default:
      return 'ri-file-line'
  }
}
</script>

<style scoped>
.layer-item-wrapper {
  display: flex;
  flex-direction: column;
}

.layer-item {
  position: relative;
  display: flex;
  align-items: center;
  height: 32px;
  padding-right: 8px;
  cursor: pointer;
  margin: 0 4px 1px 4px;
  border-radius: 4px;
  transition: all 0.1s ease;
  color: #374151;
  font-size: 12px;
}

.layer-item:hover {
  background-color: var(--el-fill-color-light);
}

.layer-item.active {
  background-color: var(--primary-color-light);
  color: var(--primary-color);
}

.layer-item.hovered {
  background-color: #f3f4f6;
  outline: 1px solid var(--primary-color);
  outline-offset: -1px;
}

.layer-item.active.hovered {
  background-color: var(--primary-color-light);
  outline: 1px solid var(--primary-color);
  outline-offset: -1px;
}

.layer-item.drag-over-top::before {
  content: '';
  position: absolute;
  top: -1px;
  left: 0;
  right: 0;
  height: 2px;
  background-color: var(--el-color-primary);
  z-index: 10;
  pointer-events: none;
}

.layer-item.drag-over-bottom::after {
  content: '';
  position: absolute;
  bottom: -1px;
  left: 0;
  right: 0;
  height: 2px;
  background-color: var(--el-color-primary);
  z-index: 10;
  pointer-events: none;
}

/* 选中状态指示条 - 稍微调整样式 */
.active-bar {
  display: none; /* 暂时隐藏侧边条，使用背景色高亮更符合Figma风格 */
}

.expand-btn {
  width: 16px;
  height: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 2px;
  cursor: pointer;
  color: #9ca3af;
  font-size: 14px;
  margin-right: 2px;
  flex-shrink: 0;
}

.expand-btn:hover {
  background-color: rgba(0, 0, 0, 0.05);
  color: #4b5563;
}

.expand-placeholder {
  width: 16px;
  margin-right: 2px;
  flex-shrink: 0;
}

.layer-info {
  flex: 1;
  display: flex;
  align-items: center;
  margin: 0 4px;
  overflow: hidden;
}

.name-text {
  font-size: 12px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  line-height: 1.2;
}

.type-icon {
  margin-right: 6px;
  font-size: 14px;
  opacity: 0.7;
  flex-shrink: 0;
}

.layer-actions {
  display: flex;
  align-items: center;
  margin-left: auto; /* Push to right */
}

.layer-action {
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 3px;
  color: #9ca3af;
  font-size: 13px;
  opacity: 0;
  transition: all 0.2s;
  margin-left: 1px;
  flex-shrink: 0;
}

.layer-item:hover .layer-action {
  opacity: 1;
}

.layer-action:hover {
  background-color: rgba(0, 0, 0, 0.05);
  color: #4b5563;
}

.delete-btn:hover {
  color: #ef4444;
  background-color: rgba(239, 68, 68, 0.1);
}

.layer-action.is-hidden,
.layer-action.is-locked {
  opacity: 1;
}

.visible-btn.is-hidden {
  color: #9ca3af;
}

.lock-btn.is-locked {
  color: #ef4444;
}

.children-list {
  display: flex;
  flex-direction: column;
}
</style>
