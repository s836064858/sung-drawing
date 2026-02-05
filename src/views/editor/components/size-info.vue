<template>
  <div v-if="visible" class="size-info" :style="{ left: `${left}px`, top: `${top}px` }">
    <span class="size-text">{{ width }} × {{ height }}</span>
  </div>
</template>

<script setup>
import { ref, computed, inject, watch, onMounted, onUnmounted } from 'vue'
import { useStore } from 'vuex'

const store = useStore()
const getCanvasCore = inject('getCanvasCore')

const visible = ref(false)
const width = ref(0)
const height = ref(0)
const left = ref(0)
const top = ref(0)

let updateTimer = null

const selectedLayerIds = computed(() => store.state.selectedLayerIds)

// 更新尺寸信息位置
const updatePosition = () => {
  const canvasCore = getCanvasCore()
  if (!canvasCore || !selectedLayerIds.value || selectedLayerIds.value.length !== 1) {
    visible.value = false
    return
  }

  const element = canvasCore.findElementById(selectedLayerIds.value[0])
  if (!element) {
    visible.value = false
    return
  }

  // 直线和箭头不显示尺寸
  if (element.tag === 'Line' || element.tag === 'Arrow') {
    visible.value = false
    return
  }

  // 使用 worldBoxBounds 获取准确的世界坐标包围盒（兼容 Polygon、Frame 嵌套等情况）
  const worldBounds = element.worldBoxBounds
  if (!worldBounds) {
    visible.value = false
    return
  }

  const elemWidth = worldBounds.width
  const elemHeight = worldBounds.height
  width.value = Math.round(elemWidth)
  height.value = Math.round(elemHeight)

  // 获取画布容器的位置
  const canvasView = canvasCore.app.view
  if (!canvasView) {
    visible.value = false
    return
  }

  const canvasRect = canvasView.getBoundingClientRect()
  
  // 世界坐标
  const worldX = worldBounds.x
  const worldY = worldBounds.y

  // 获取画布的缩放和平移
  const tree = canvasCore.app.tree
  const scale = tree.scaleX || 1
  const treeX = tree.x || 0
  const treeY = tree.y || 0

  // 计算元素在屏幕上的位置
  const screenX = worldX * scale + treeX + canvasRect.left
  const screenY = worldY * scale + treeY + canvasRect.top
  const screenWidth = elemWidth * scale
  const screenHeight = elemHeight * scale

  // 计算尺寸信息的位置（元素底部中央下方 20px）
  left.value = screenX + screenWidth / 2
  top.value = screenY + screenHeight + 20

  visible.value = true
}

// 监听选中变化
watch(selectedLayerIds, () => {
  updatePosition()
}, { immediate: true })

// 定时更新位置（处理拖拽、缩放等情况）
onMounted(() => {
  updateTimer = setInterval(() => {
    if (visible.value) {
      updatePosition()
    }
  }, 50)
})

onUnmounted(() => {
  if (updateTimer) {
    clearInterval(updateTimer)
  }
})
</script>

<style scoped>
.size-info {
  position: fixed;
  transform: translateX(-50%);
  z-index: 9999;
  background-color: rgba(0, 0, 0, 0.75);
  color: #fff;
  padding: 6px 12px;
  border-radius: 6px;
  font-size: 12px;
  font-family: 'Monaco', 'Menlo', 'Consolas', monospace;
  pointer-events: none;
  user-select: none;
  backdrop-filter: blur(4px);
  white-space: nowrap;
}

.size-text {
  white-space: nowrap;
}
</style>
