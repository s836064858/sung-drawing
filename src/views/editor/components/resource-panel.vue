<template>
  <div class="resource-panel">
    <div v-for="category in resourceCategories" :key="category.id" class="resource-group">
      <div class="group-title" @click="toggleCollapse(category.id)">
        <i :class="isCollapsed(category.id) ? 'ri-arrow-right-s-fill' : 'ri-arrow-down-s-fill'" class="collapse-icon"></i>
        <span>{{ category.name }}</span>
      </div>
      <div class="resource-list" v-show="!isCollapsed(category.id)">
        <div
          v-for="item in category.items"
          :key="item.id"
          class="resource-item"
          draggable="true"
          @dragstart="(e) => handleDragStart(e, item)"
          @click="handleClick(item)"
        >
          <div class="resource-icon">
            <i :class="item.icon"></i>
          </div>
          <div class="resource-name">{{ item.name }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { inject, ref } from 'vue'
import { resourceCategories } from '@/config/resources'

const getCanvasCore = inject('getCanvasCore')
const collapsedCategories = ref(new Set())

const toggleCollapse = (id) => {
  if (collapsedCategories.value.has(id)) {
    collapsedCategories.value.delete(id)
  } else {
    collapsedCategories.value.add(id)
  }
}

const isCollapsed = (id) => collapsedCategories.value.has(id)

const handleDragStart = (e, item) => {
  // 设置拖拽数据
  e.dataTransfer.setData('application/json', JSON.stringify(item))
  e.dataTransfer.effectAllowed = 'copy'
}

const handleClick = (item) => {
  const canvasCore = getCanvasCore()
  if (!canvasCore) return

  canvasCore.addLayerFromResource(item)
}
</script>

<style scoped>
.resource-panel {
  padding: 12px;
  height: 100%;
  overflow-y: auto;
}

.resource-group {
  margin-bottom: 8px;
}

.group-title {
  font-size: 13px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 8px;
  padding: 6px 4px;
  display: flex;
  align-items: center;
  cursor: pointer;
  user-select: none;
  border-radius: 4px;
  transition: background-color 0.2s;
}

.group-title:hover {
  background-color: #f5f7fa;
}

.collapse-icon {
  margin-right: 4px;
  font-size: 16px;
  color: #909399;
  transition: color 0.2s;
}

.group-title:hover .collapse-icon {
  color: #606266;
}

.resource-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 0 4px;
}

.resource-item {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: flex-start;
  background-color: transparent;
  border: 1px solid transparent;
  border-radius: 6px;
  padding: 8px 12px;
  cursor: pointer;
  transition: all 0.2s ease;
  width: 100%;
  box-sizing: border-box;
}

.resource-item:hover {
  background-color: var(--primary-color-light);
  color: var(--primary-color);
}

.resource-icon {
  font-size: 18px;
  color: #606266;
  margin-right: 12px;
  margin-bottom: 0;
  transition: color 0.2s;
  display: flex;
  align-items: center;
}

.resource-item:hover .resource-icon {
  color: var(--primary-color);
}

.resource-name {
  font-size: 13px;
  color: #606266;
  text-align: left;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  flex: 1;
  transform: none;
  width: auto;
  transition: color 0.2s;
}

.resource-item:hover .resource-name {
  color: var(--primary-color);
}
</style>
