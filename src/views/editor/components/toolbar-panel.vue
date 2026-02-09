<template>
  <div class="toolbar-panel">
    <el-tooltip content="撤销 (Ctrl+Z)" placement="top" :disabled="!canUndo">
      <div class="tool-item" :class="{ disabled: !canUndo }" @click="canUndo && handleAction('undo')">
        <i class="ri-arrow-go-back-line"></i>
      </div>
    </el-tooltip>
    <el-tooltip content="恢复 (Ctrl+Shift+Z)" placement="top" :disabled="!canRedo">
      <div class="tool-item" :class="{ disabled: !canRedo }" @click="canRedo && handleAction('redo')">
        <i class="ri-arrow-go-forward-line"></i>
      </div>
    </el-tooltip>

    <div class="divider"></div>

    <el-tooltip content="选择模式 (V)" placement="top">
      <div class="tool-item" :class="{ active: activeTool === 'select' }" @click="handleToolClick('select')">
        <i class="ri-cursor-fill"></i>
      </div>
    </el-tooltip>

    <el-tooltip content="移动模式 (H)" placement="top">
      <div class="tool-item" :class="{ active: activeTool === 'move' }" @click="handleToolClick('move')">
        <i class="ri-drag-move-line"></i>
      </div>
    </el-tooltip>

    <div class="divider"></div>

    <el-tooltip content="钢笔 (P)" placement="top">
      <div class="tool-item" :class="{ active: activeTool === 'pen' }" @click="handleToolClick('pen')">
        <i class="ri-pen-nib-line"></i>
      </div>
    </el-tooltip>

    <el-dropdown trigger="click" @command="handleShapeCommand">
      <span class="dropdown-trigger">
        <el-tooltip content="形状" placement="top">
          <div class="tool-item" :class="{ active: ['rect', 'diamond', 'ellipse', 'line', 'arrow'].includes(activeTool) }">
            <i class="ri-shape-line"></i>
            <i class="ri-arrow-down-s-fill arrow-icon"></i>
          </div>
        </el-tooltip>
      </span>
      <template #dropdown>
        <el-dropdown-menu>
          <el-dropdown-item command="rect"> <i class="ri-rectangle-line" style="margin-right: 6px"></i>矩形 </el-dropdown-item>
          <el-dropdown-item command="diamond"> <i class="ri-vip-diamond-line" style="margin-right: 6px"></i>菱形 </el-dropdown-item>
          <el-dropdown-item command="ellipse"> <i class="ri-circle-line" style="margin-right: 6px"></i>圆形 </el-dropdown-item>
          <el-dropdown-item command="line"> <i class="ri-subtract-line" style="margin-right: 6px"></i>直线 </el-dropdown-item>
          <el-dropdown-item command="arrow"> <i class="ri-arrow-right-line" style="margin-right: 6px"></i>箭头 </el-dropdown-item>
        </el-dropdown-menu>
      </template>
    </el-dropdown>

    <el-tooltip content="Frame (F)" placement="top">
      <div class="tool-item" :class="{ active: activeTool === 'frame' }" @click="handleToolClick('frame')">
        <i class="ri-layout-line"></i>
      </div>
    </el-tooltip>

    <el-tooltip content="文字 (T)" placement="top">
      <div class="tool-item" :class="{ active: activeTool === 'text' }" @click="handleToolClick('text')">
        <i class="ri-text"></i>
      </div>
    </el-tooltip>

    <div class="divider"></div>

    <el-tooltip content="插入图片" placement="top">
      <div class="tool-item" @click="handleImageClick">
        <i class="ri-image-line"></i>
      </div>
    </el-tooltip>
    <input type="file" ref="fileInput" accept="image/*" @change="handleFileChange" style="display: none" />

    <div class="divider"></div>

    <el-tooltip content="标尺" placement="top">
      <div class="tool-item" :class="{ active: showRuler }" @click="handleRulerClick">
        <i class="ri-ruler-2-line"></i>
      </div>
    </el-tooltip>
  </div>
</template>

<script setup>
import { defineProps, defineEmits, ref } from 'vue'

const props = defineProps({
  activeTool: {
    type: String,
    default: 'select'
  },
  canUndo: {
    type: Boolean,
    default: false
  },
  canRedo: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['tool-change'])
const fileInput = ref(null)
const showRuler = ref(true)

const handleToolClick = (tool) => {
  if (tool === 'text') {
    emit('tool-change', { type: 'mode', value: 'text' })
  } else if (tool === 'frame') {
    emit('tool-change', { type: 'mode', value: 'frame' })
  } else if (tool === 'select') {
    emit('tool-change', { type: 'mode', value: 'select' })
  } else if (tool === 'move') {
    emit('tool-change', { type: 'mode', value: 'move' })
  } else if (tool === 'pen') {
    emit('tool-change', { type: 'mode', value: 'pen' })
  }
}

const handleAction = (action) => {
  emit('tool-change', { type: 'action', value: action })
}

const handleShapeCommand = (command) => {
  emit('tool-change', { type: 'mode', value: command })
}

const handleImageClick = () => {
  fileInput.value.click()
}

const handleFileChange = (e) => {
  const file = e.target.files[0]
  if (file) {
    const reader = new FileReader()
    reader.onload = (e) => {
      emit('tool-change', { type: 'action', value: 'add-image', data: e.target.result })
    }
    reader.readAsDataURL(file)
  }
  // 清空 input 以便重复选择同一文件
  e.target.value = ''
}

const handleRulerClick = () => {
  showRuler.value = !showRuler.value
  emit('tool-change', { type: 'action', value: 'toggle-ruler', data: showRuler.value })
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

.tool-item.disabled {
  opacity: 0.4;
  cursor: not-allowed;
  background-color: transparent;
  color: #999;
}

.tool-item.disabled:hover {
  background-color: transparent;
  color: #999;
}

.tool-item i {
  font-size: 20px;
}

.arrow-icon {
  font-size: 12px !important;
  margin-left: 2px;
  color: #909399;
}

.divider {
  width: 1px;
  height: 20px;
  background-color: var(--border-color);
  margin: 0 4px;
}
</style>
