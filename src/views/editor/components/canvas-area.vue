<template>
  <div class="canvas-container" ref="canvasRef"></div>
</template>

<script setup>
import { onMounted, onUnmounted, ref } from 'vue'
import { useStore } from 'vuex'
import { CanvasCore } from '@/core/CanvasCore'

const store = useStore()
const canvasRef = ref(null)
let canvasCore = null

onMounted(() => {
  if (canvasRef.value) {
    // 初始化 CanvasCore，传入回调以同步状态
    canvasCore = new CanvasCore(canvasRef.value, {
      onLayersChange: (layers) => {
        store.commit('setLayers', layers)
      },
      onSelectionChange: (selectedIds) => {
        store.commit('setSelectedLayerIds', selectedIds)
      }
    })

    // 添加测试元素以验证功能
    // canvasCore.addRect()
    // canvasCore.addText()
  }
})

onUnmounted(() => {
  if (canvasCore) {
    canvasCore.destroy()
  }
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
}
</style>
