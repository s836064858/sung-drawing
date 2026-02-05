<template>
  <div class="gradient-editor">
    <!-- 渐变类型选择 -->
    <div class="gradient-type-selector">
      <el-radio-group v-model="gradientType" size="small" @change="handleTypeChange">
        <el-radio-button value="solid">纯色</el-radio-button>
        <el-radio-button value="linear">线性</el-radio-button>
        <el-radio-button v-if="props.elementType !== 'Text'" value="radial">径向</el-radio-button>
      </el-radio-group>
    </div>

    <!-- 纯色选择器 -->
    <div v-if="gradientType === 'solid'" class="solid-color-section">
      <el-color-picker-panel 
        v-model="solidColor" 
        show-alpha
        @change="handleSolidColorChange"
      />
    </div>

    <!-- 渐变编辑器 -->
    <div v-else class="gradient-controls">
      <!-- 渐变预览条 -->
      <div class="gradient-preview-wrapper">
        <div 
          class="gradient-preview" 
          :style="{ background: previewGradient }"
          @click="handlePreviewClick"
        >
          <!-- 色标控制点 -->
          <div
            v-for="(stop, index) in stops"
            :key="index"
            class="color-stop"
            :class="{ active: activeStopIndex === index }"
            :style="{ left: `${stop.offset * 100}%` }"
            @mousedown="handleStopMouseDown(index, $event)"
            @click.stop="selectStop(index)"
          >
            <div class="stop-handle" :style="{ backgroundColor: stop.color }"></div>
          </div>
        </div>
      </div>

      <!-- 添加色标按钮 -->
      <div class="stops-header">
        <span class="stops-title">Stops</span>
        <el-button 
          size="small" 
          :icon="Plus" 
          circle 
          @click="addStop"
        />
      </div>

      <!-- 色标列表 -->
      <div class="stops-list">
        <div
          v-for="(stop, index) in stops"
          :key="index"
          class="stop-item"
          :class="{ active: activeStopIndex === index }"
          @click="selectStop(index)"
        >
          <div class="stop-position">{{ Math.round(stop.offset * 100) }}%</div>
          <el-color-picker 
            v-model="stop.color" 
            show-alpha 
            size="small"
            :teleported="false"
            @change="handleStopColorChange(index)"
            @click.stop
          />
          <input 
            v-model="stop.colorHex" 
            class="color-input"
            @input="handleColorInputChange(index, $event)"
          />
          <div class="stop-opacity">{{ stop.opacity }}%</div>
          <el-button
            v-if="stops.length > 2"
            size="small"
            :icon="Minus"
            text
            @click.stop="removeStop(index)"
          />
        </div>
      </div>

      <!-- 渐变方向控制（仅线性渐变） -->
      <div v-if="gradientType === 'linear'" class="gradient-direction">
        <div class="control-label">方向</div>
        <el-select 
          v-model="direction" 
          size="small" 
          :teleported="false"
          @change="handleDirectionChange"
          @click.stop
        >
          <el-option label="从上到下" value="top-bottom" />
          <el-option label="从左到右" value="left-right" />
          <el-option label="从左上到右下" value="top-left-bottom-right" />
          <el-option label="从右上到左下" value="top-right-bottom-left" />
        </el-select>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { Plus, Minus } from '@element-plus/icons-vue'
import { ElColorPickerPanel } from 'element-plus'

const props = defineProps({
  modelValue: {
    type: [String, Object],
    default: '#000000'
  },
  elementType: {
    type: String,
    default: ''
  }
})

const emit = defineEmits(['update:modelValue', 'change'])

// 渐变类型
const gradientType = ref('solid')
const solidColor = ref('#000000')
const stops = ref([
  { offset: 0, color: '#000000', colorHex: '000000', opacity: 100 },
  { offset: 1, color: '#ffffff', colorHex: 'ffffff', opacity: 100 }
])
const activeStopIndex = ref(0)
const direction = ref('top-bottom')
const isInternalChange = ref(false) // 标记是否为内部更改

// 初始化
const initFromValue = (value) => {
  if (typeof value === 'string') {
    gradientType.value = 'solid'
    solidColor.value = value
  } else if (value && typeof value === 'object' && value.type) {
    if (value.type === 'linear') {
      gradientType.value = 'linear'
      if (value.stops && value.stops.length > 0) {
        stops.value = value.stops.map(stop => ({
          offset: stop.offset,
          color: stop.color,
          colorHex: parseColorToHex(stop.color),
          opacity: 100
        }))
      }
      // 解析方向
      parseDirection(value.from, value.to)
    } else if (value.type === 'radial') {
      gradientType.value = 'radial'
      if (value.stops && value.stops.length > 0) {
        stops.value = value.stops.map(stop => ({
          offset: stop.offset,
          color: stop.color,
          colorHex: parseColorToHex(stop.color),
          opacity: 100
        }))
      }
    }
  } else {
    // 默认为纯色
    gradientType.value = 'solid'
    solidColor.value = value || '#000000'
  }
}

// 解析颜色为十六进制
const parseColorToHex = (color) => {
  if (typeof color === 'string') {
    const hex = color.replace('#', '').replace(/^rgba?\(|\)$/g, '')
    if (/^[0-9A-Fa-f]{6}$/.test(hex)) {
      return hex
    }
    // 处理 rgb/rgba 格式
    const match = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/)
    if (match) {
      const r = parseInt(match[1]).toString(16).padStart(2, '0')
      const g = parseInt(match[2]).toString(16).padStart(2, '0')
      const b = parseInt(match[3]).toString(16).padStart(2, '0')
      return r + g + b
    }
  }
  return '000000'
}

// 解析方向
const parseDirection = (from, to) => {
  if (from === 'top' && to === 'bottom') {
    direction.value = 'top-bottom'
  } else if (from === 'left' && to === 'right') {
    direction.value = 'left-right'
  } else if (from === 'top-left' && to === 'bottom-right') {
    direction.value = 'top-left-bottom-right'
  } else if (from === 'top-right' && to === 'bottom-left') {
    direction.value = 'top-right-bottom-left'
  }
}

// 预览渐变
const previewGradient = computed(() => {
  if (gradientType.value === 'solid') {
    return solidColor.value
  }
  
  const colorStops = stops.value
    .map(stop => `${stop.color} ${stop.offset * 100}%`)
    .join(', ')
  
  if (gradientType.value === 'linear') {
    const angle = getAngleFromDirection(direction.value)
    return `linear-gradient(${angle}deg, ${colorStops})`
  } else {
    return `radial-gradient(circle, ${colorStops})`
  }
})

// 获取角度
const getAngleFromDirection = (dir) => {
  const angles = {
    'top-bottom': 180,
    'left-right': 90,
    'top-left-bottom-right': 135,
    'top-right-bottom-left': 225
  }
  return angles[dir] || 180
}

// 生成渐变对象
const generateGradientObject = () => {
  if (gradientType.value === 'solid') {
    return solidColor.value
  }
  
  const gradientStops = stops.value.map(stop => ({
    offset: stop.offset,
    color: stop.color
  }))
  
  if (gradientType.value === 'linear') {
    const dirMap = {
      'top-bottom': { from: 'top', to: 'bottom' },
      'left-right': { from: 'left', to: 'right' },
      'top-left-bottom-right': { from: 'top-left', to: 'bottom-right' },
      'top-right-bottom-left': { from: 'top-right', to: 'bottom-left' }
    }
    const { from, to } = dirMap[direction.value]
    
    return {
      type: 'linear',
      from,
      to,
      stops: gradientStops
    }
  } else {
    return {
      type: 'radial',
      stops: gradientStops
    }
  }
}

// 事件处理
const handleTypeChange = () => {
  // 切换类型时初始化默认值
  if (gradientType.value === 'linear' || gradientType.value === 'radial') {
    if (stops.value.length === 0) {
      stops.value = [
        { offset: 0, color: '#000000', colorHex: '000000', opacity: 100 },
        { offset: 1, color: '#ffffff', colorHex: 'ffffff', opacity: 100 }
      ]
    }
  }
  emitChange()
}

const handleSolidColorChange = () => {
  emitChange()
}

const handleDirectionChange = () => {
  emitChange()
}

const selectStop = (index) => {
  activeStopIndex.value = index
}

const addStop = () => {
  const newOffset = stops.value.length > 0 
    ? (stops.value[stops.value.length - 1].offset + stops.value[0].offset) / 2 
    : 0.5
  
  stops.value.push({
    offset: newOffset,
    color: '#808080',
    colorHex: '808080',
    opacity: 100
  })
  stops.value.sort((a, b) => a.offset - b.offset)
  activeStopIndex.value = stops.value.findIndex(s => s.offset === newOffset)
  emitChange()
}

const removeStop = (index) => {
  if (stops.value.length <= 2) return
  stops.value.splice(index, 1)
  activeStopIndex.value = Math.min(activeStopIndex.value, stops.value.length - 1)
  emitChange()
}

const handleStopColorChange = (index) => {
  stops.value[index].colorHex = parseColorToHex(stops.value[index].color)
  emitChange()
}

const handleColorInputChange = (index, event) => {
  let hex = event.target.value.replace('#', '').toUpperCase()
  // 只允许输入十六进制字符
  hex = hex.replace(/[^0-9A-F]/g, '')
  stops.value[index].colorHex = hex
  
  if (/^[0-9A-F]{6}$/.test(hex)) {
    stops.value[index].color = `#${hex}`
    emitChange()
  }
}

const handlePreviewClick = (event) => {
  const rect = event.currentTarget.getBoundingClientRect()
  const x = event.clientX - rect.left
  const offset = Math.max(0, Math.min(1, x / rect.width))
  
  // 在点击位置插入新色标
  const newStop = {
    offset,
    color: interpolateColor(offset),
    colorHex: '808080',
    opacity: 100
  }
  
  stops.value.push(newStop)
  stops.value.sort((a, b) => a.offset - b.offset)
  activeStopIndex.value = stops.value.findIndex(s => s.offset === offset)
  emitChange()
}

const handleStopMouseDown = (index, event) => {
  event.preventDefault()
  selectStop(index)
  
  const preview = event.currentTarget.parentElement
  const rect = preview.getBoundingClientRect()
  
  const onMouseMove = (e) => {
    const x = e.clientX - rect.left
    const offset = Math.max(0, Math.min(1, x / rect.width))
    stops.value[index].offset = offset
    stops.value.sort((a, b) => a.offset - b.offset)
    activeStopIndex.value = stops.value.findIndex(s => s === stops.value[index])
  }
  
  const onMouseUp = () => {
    document.removeEventListener('mousemove', onMouseMove)
    document.removeEventListener('mouseup', onMouseUp)
    emitChange()
  }
  
  document.addEventListener('mousemove', onMouseMove)
  document.addEventListener('mouseup', onMouseUp)
}

// 插值计算颜色
const interpolateColor = (offset) => {
  // 简单返回灰色，实际可以根据现有色标插值
  return '#808080'
}

const emitChange = () => {
  isInternalChange.value = true
  const value = generateGradientObject()
  emit('update:modelValue', value)
  emit('change', value)
  // 使用 nextTick 确保更新完成后再重置标志
  setTimeout(() => {
    isInternalChange.value = false
  }, 0)
}

// 监听外部值变化
watch(() => props.modelValue, (newVal) => {
  // 如果是内部更改触发的，不重新初始化
  if (!isInternalChange.value) {
    initFromValue(newVal)
  }
}, { immediate: true, deep: true })
</script>

<style scoped>
.gradient-editor {
  width: 100%;
  padding: 12px;
  max-height: 500px;
  overflow-y: auto;
}

.gradient-type-selector {
  margin-bottom: 16px;
}

:deep(.el-radio-group) {
  display: flex;
  width: 100%;
}

:deep(.el-radio-button) {
  flex: 1;
}

:deep(.el-radio-button__inner) {
  width: 100%;
  font-size: 11px;
  padding: 6px 8px;
}

.solid-color-section {
  padding: 8px 0;
  display: flex;
  justify-content: center;
}

:deep(.solid-color-section .el-color-picker-panel) {
  width: 100%;
  box-shadow: none;
}

:deep(.solid-color-section .el-color-picker-panel__body) {
  padding: 0;
}

.gradient-controls {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.gradient-preview-wrapper {
  padding: 8px 0;
}

.gradient-preview {
  position: relative;
  height: 32px;
  border-radius: 4px;
  border: 1px solid #e0e0e0;
  cursor: crosshair;
}

.color-stop {
  position: absolute;
  top: 50%;
  transform: translate(-50%, -50%);
  cursor: pointer;
  z-index: 2;
}

.color-stop.active .stop-handle {
  border-color: #409eff;
  box-shadow: 0 0 0 2px rgba(64, 158, 255, 0.3);
}

.stop-handle {
  width: 16px;
  height: 16px;
  border: 2px solid #fff;
  border-radius: 50%;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
  transition: all 0.2s;
}

.stop-handle:hover {
  transform: scale(1.2);
}

.stops-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 4px 0;
}

.stops-title {
  font-size: 12px;
  font-weight: 600;
  color: #333;
}

.stops-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
  max-height: 180px;
  overflow-y: auto;
  padding: 4px 0;
}

.stop-item {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 8px;
  background: #f5f5f5;
  border-radius: 4px;
  cursor: pointer;
  transition: background 0.2s;
}

.stop-item:hover {
  background: #ebebeb;
}

.stop-item.active {
  background: #e6f7ff;
  border: 1px solid #91d5ff;
  padding: 5px 7px;
}

.stop-position {
  font-size: 11px;
  color: #666;
  min-width: 32px;
  font-family: monospace;
}

:deep(.stop-item .el-color-picker__trigger) {
  width: 24px;
  height: 24px;
  padding: 2px;
}

.color-input {
  flex: 1;
  height: 24px;
  padding: 0 6px;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  font-size: 11px;
  font-family: monospace;
  text-transform: uppercase;
}

.color-input:focus {
  outline: none;
  border-color: #409eff;
}

.stop-opacity {
  font-size: 11px;
  color: #666;
  min-width: 32px;
  text-align: right;
  font-family: monospace;
}

.gradient-direction {
  display: flex;
  align-items: center;
  gap: 8px;
}

.control-label {
  font-size: 11px;
  color: #666;
  min-width: 40px;
}

:deep(.el-select) {
  flex: 1;
}

.color-text {
  font-size: 11px;
  color: #666;
  font-family: monospace;
}
</style>
