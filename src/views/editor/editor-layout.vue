<template>
  <el-container class="editor-layout">
    <el-aside width="250px">
      <layer-panel />
    </el-aside>
    <el-main class="main-content">
      <canvas-area ref="canvasAreaRef" @mode-change="handleModeChange" />
      <div class="toolbar-container">
        <toolbar-panel :active-tool="activeTool" @tool-change="handleToolChange" />
      </div>
    </el-main>
    <el-aside width="300px">
      <property-panel />
    </el-aside>
  </el-container>
</template>

<script setup>
import { ref, provide } from 'vue'
import LayerPanel from './components/layer-panel.vue'
import CanvasArea from './components/canvas-area.vue'
import PropertyPanel from './components/property-panel.vue'
import ToolbarPanel from './components/toolbar-panel.vue'

const canvasAreaRef = ref(null)
const activeTool = ref('select')

// 提供 getCanvasCore 方法给子组件 (LayerPanel) 使用
provide('getCanvasCore', () => canvasAreaRef.value?.getCanvasCore())

const handleModeChange = (mode) => {
  activeTool.value = mode
}

const handleToolChange = (event) => {
  const canvasCore = canvasAreaRef.value?.getCanvasCore()
  if (!canvasCore) return

  if (event.type === 'mode') {
    activeTool.value = event.value
    canvasCore.setMode(event.value)
  } else if (event.type === 'action' && event.value === 'add-image') {
    canvasCore.addImage(event.data)
  }
}
</script>

<style scoped>
.editor-layout {
  height: 100vh;
  width: 100vw;
  overflow: hidden;
}

.main-content {
  padding: 0;
  position: relative;
}

.toolbar-container {
  position: absolute;
  bottom: 24px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 100;
}
</style>
