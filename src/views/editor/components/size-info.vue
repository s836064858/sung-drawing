<template>
  <div v-if="visible" class="size-info" :style="{ left: `${left}px`, top: `${top}px` }">
    <span class="size-text">{{ width }} × {{ height }}</span>
  </div>
</template>

<script setup>
import { ref, computed, inject, watch, onMounted, onUnmounted } from 'vue'
import { useStore } from 'vuex'
import { DragEvent, ResizeEvent, RotateEvent, MoveEvent, ZoomEvent, PropertyEvent } from 'leafer-ui'

const store = useStore()
const getCanvasCore = inject('getCanvasCore')

const visible = ref(false)
const width = ref(0)
const height = ref(0)
const left = ref(0)
const top = ref(0)

let rafId = null

const selectedLayerIds = computed(() => store.state.selectedLayerIds)

// 使用 requestAnimationFrame 优化更新频率
const scheduleUpdate = () => {
  if (rafId) return
  rafId = requestAnimationFrame(() => {
    updatePosition()
    rafId = null
  })
}

// 绑定/解绑事件监听
const bindEvents = (bind = true) => {
  const core = getCanvasCore()
  if (!core || !core.app) return

  const method = bind ? 'on' : 'off'

  // 监听元素变换（拖拽、缩放、旋转）
  // 注意：监听 editor 或 app 上的事件以捕获交互
  if (method) {
    core.app.on(DragEvent.DRAG, scheduleUpdate)
    core.app.on(ResizeEvent.RESIZE, scheduleUpdate)
    core.app.on(RotateEvent.ROTATE, scheduleUpdate)
    core.app.tree.on(MoveEvent.MOVE, scheduleUpdate)
    core.app.tree.on(ZoomEvent.ZOOM, scheduleUpdate)
    core.app.on(PropertyEvent.CHANGE, scheduleUpdate)
    // 监听 tree 的属性变化（捕获视口平移）
    core.app.tree.on(PropertyEvent.CHANGE, scheduleUpdate)

    // 监听窗口滚动和调整大小
    window.addEventListener('scroll', scheduleUpdate, true)
    window.addEventListener('resize', scheduleUpdate)
  } else {
    core.app.off(DragEvent.DRAG, scheduleUpdate)
    core.app.off(ResizeEvent.RESIZE, scheduleUpdate)
    core.app.off(RotateEvent.ROTATE, scheduleUpdate)
    core.app.tree.off(MoveEvent.MOVE, scheduleUpdate)
    core.app.tree.off(ZoomEvent.ZOOM, scheduleUpdate)
    core.app.off(PropertyEvent.CHANGE, scheduleUpdate)
    core.app.tree.off(PropertyEvent.CHANGE, scheduleUpdate)

    window.removeEventListener('scroll', scheduleUpdate, true)
    window.removeEventListener('resize', scheduleUpdate)
  }
}

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

  // worldBoxBounds 已经是相对于 Canvas 的世界坐标（包含缩放和平移）
  // 直接加上 Canvas 的屏幕偏移即可得到屏幕坐标
  const screenX = worldBounds.x + canvasRect.left
  const screenY = worldBounds.y + canvasRect.top
  const screenWidth = worldBounds.width
  const screenHeight = worldBounds.height

  // 计算尺寸信息的位置（元素底部中央下方 20px）
  left.value = screenX + screenWidth / 2
  top.value = screenY + screenHeight + 20

  visible.value = true
}

// 监听选中变化
watch(
  selectedLayerIds,
  (newIds) => {
    updatePosition()
    // 仅在有选中元素时才更新位置，但事件监听需要一直保持（或者优化为仅在选中时监听交互，全局监听视口）
    // 为了简单且性能足够好，我们可以一直监听视口变化，但元素交互可以仅在选中时监听
    // 这里简化为：组件挂载即监听所有相关事件，updatePosition 内部会判断是否 visible
  },
  { immediate: true }
)

onMounted(() => {
  // 延迟绑定，确保 canvasCore 已初始化
  setTimeout(() => {
    bindEvents(true)
    updatePosition()
  }, 100)
})

onUnmounted(() => {
  bindEvents(false)
  if (rafId) {
    cancelAnimationFrame(rafId)
    rafId = null
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
