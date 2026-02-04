<template>
  <div class="toolbar-panel">
    <el-tooltip content="选择模式 (V)" placement="top">
      <div class="tool-item" :class="{ active: activeTool === 'select' }">
        <i class="ri-cursor-fill"></i>
      </div>
    </el-tooltip>

    <div class="divider"></div>

    <el-tooltip content="矩形 (R)" placement="top">
      <div class="tool-item" @click="handleToolClick('rect')">
        <i class="ri-shape-line"></i>
      </div>
    </el-tooltip>

    <el-tooltip content="文字 (T)" placement="top">
      <div class="tool-item" @click="handleToolClick('text')">
        <i class="ri-text"></i>
      </div>
    </el-tooltip>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const activeTool = ref('select')
const emit = defineEmits(['tool-change'])

const handleToolClick = (tool) => {
  if (tool === 'rect') {
    emit('tool-change', { type: 'action', value: 'add-rect' })
  } else if (tool === 'text') {
    emit('tool-change', { type: 'action', value: 'add-text' })
  }
}
</script>

<style scoped>
.toolbar-panel {
  display: flex;
  align-items: center;
  padding: 8px;
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  gap: 8px;
  pointer-events: auto; /* 确保能点击 */
}

.tool-item {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
  cursor: pointer;
  color: var(--text-color);
  transition: all 0.2s;
}

.tool-item:hover {
  background-color: #f5f7fa;
  color: var(--primary-color);
}

.tool-item.active {
  background-color: #ecf5ff;
  color: var(--primary-color);
}

.tool-item i {
  font-size: 20px;
}

.divider {
  width: 1px;
  height: 20px;
  background-color: var(--border-color);
  margin: 0 4px;
}
</style>
