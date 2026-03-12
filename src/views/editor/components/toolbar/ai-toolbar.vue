<template>
  <div v-if="visible" class="ai-toolbar" :style="{ left: `${left}px`, top: `${top}px` }">
    <!-- 功能菜单 -->
    <div v-if="!activeFunction" class="toolbar-menu">
      <div v-for="item in functionList" :key="item.key" class="menu-item" @click="activateFunction(item.key)">
        <i :class="item.icon"></i>
        <span>{{ item.label }}</span>
      </div>
    </div>

    <!-- 具体功能面板 -->
    <div v-else class="function-panel" @mousedown.stop>
      <!-- AI 生图面板 -->
      <div v-if="activeFunction === 'generate-image'" class="panel-content ai-image-panel">
        <div class="close-btn header-close" @click="closePanel">
          <i class="ri-close-line"></i>
        </div>
        <div class="input-row">
          <el-input
            v-model="prompt"
            type="textarea"
            :rows="3"
            placeholder="描述你想要的图片..."
            class="ai-textarea"
            resize="none"
            ref="inputRef"
            @keydown.enter.prevent="handleSend"
          />
          <div class="right-col">
            <el-select v-model="selectedSize" size="small" class="size-select" :teleported="false" placeholder="尺寸">
              <el-option v-for="item in sizeOptions" :key="item.value" :label="item.label" :value="item.value" />
            </el-select>
            <el-button type="primary" size="small" :loading="loading" @click="handleSend" class="send-btn"> 发送 </el-button>
          </div>
        </div>
      </div>

      <!-- AI 润色面板 -->
      <div v-else-if="activeFunction === 'ai-polish'" class="panel-content ai-input-area">
        <el-input v-model="prompt" placeholder="输入润色要求 (可空)" size="small" class="ai-input" @keyup.enter="handleSend" ref="inputRef" />
        <el-button type="primary" size="small" :loading="loading" @click="handleSend"> 发送 </el-button>
        <div class="close-btn" @click="closePanel">
          <i class="ri-close-line"></i>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, inject, watch, onMounted, onUnmounted, nextTick } from 'vue'
import { useStore } from 'vuex'
import { DragEvent, ResizeEvent, RotateEvent, MoveEvent, ZoomEvent, PropertyEvent } from 'leafer-ui'
import { ElMessage } from 'element-plus'
import { generateImage as callVolcEngine, polishText } from '@/services/volcengine'

const store = useStore()
const getCanvasCoreInject = inject('getCanvasCore')
const getCanvasCore = () => {
  return getCanvasCoreInject ? getCanvasCoreInject() : null
}

const visible = ref(false)
const left = ref(0)
const top = ref(0)
const activeFunction = ref(null) // 当前激活的功能 key
const prompt = ref('')
const loading = ref(false)
const inputRef = ref(null)
const currentElementType = ref('') // 当前选中元素的类型
const selectedSize = ref('2048x2048')

// 生图尺寸配置
const sizeOptions = [
  { label: '1:1', value: '2048x2048' },
  { label: '4:3', value: '2304x1728' },
  { label: '3:4', value: '1728x2304' },
  { label: '16:9', value: '2848x1600' },
  { label: '9:16', value: '1600x2848' },
  { label: '3:2', value: '2496x1664' },
  { label: '2:3', value: '1664x2496' },
  { label: '21:9', value: '3136x1344' }
]

// 根据选中元素类型动态生成功能列表
const functionList = computed(() => {
  if (currentElementType.value === 'Text') {
    return [
      { key: 'generate-image', label: 'AI 生图', icon: 'ri-magic-line' },
      { key: 'ai-polish', label: 'AI 润色', icon: 'ri-edit-2-line' }
    ]
  }

  // 默认显示 AI 生图
  return [{ key: 'generate-image', label: 'AI 生图', icon: 'ri-magic-line' }]
})

// 判断当前是否是需要输入框的面板
const isInputPanel = computed(() => {
  return ['generate-image', 'ai-polish'].includes(activeFunction.value)
})

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

  if (method === 'on') {
    core.app.on(DragEvent.DRAG, scheduleUpdate)
    core.app.on(ResizeEvent.RESIZE, scheduleUpdate)
    core.app.on(RotateEvent.ROTATE, scheduleUpdate)
    core.app.tree.on(MoveEvent.MOVE, scheduleUpdate)
    core.app.tree.on(ZoomEvent.ZOOM, scheduleUpdate)
    core.app.on(PropertyEvent.CHANGE, scheduleUpdate)
    core.app.tree.on(PropertyEvent.CHANGE, scheduleUpdate)

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

// 更新位置
const updatePosition = () => {
  const canvasCore = getCanvasCore()
  if (!canvasCore || !selectedLayerIds.value || selectedLayerIds.value.length !== 1) {
    visible.value = false
    activeFunction.value = null // 选中改变时重置状态
    currentElementType.value = ''
    return
  }

  const element = canvasCore.findElementById(selectedLayerIds.value[0])
  if (!element) {
    visible.value = false
    return
  }

  // 更新当前元素类型
  currentElementType.value = element.tag

  const worldBounds = element.worldBoxBounds
  if (!worldBounds) {
    visible.value = false
    return
  }

  const canvasView = canvasCore.app.view
  if (!canvasView) {
    visible.value = false
    return
  }

  const canvasRect = canvasView.getBoundingClientRect()

  const screenX = worldBounds.x + canvasRect.left
  const screenY = worldBounds.y + canvasRect.top
  const screenWidth = worldBounds.width

  // 计算位置：水平居中，垂直在元素上方
  left.value = screenX + screenWidth / 2
  // 距离元素顶部 10px，结合 transform: translateY(-100%)，bottom 位于 top 坐标处
  top.value = screenY - 10

  visible.value = true
}

const activateFunction = (key) => {
  activeFunction.value = key
  prompt.value = null
  if (['generate-image', 'ai-polish'].includes(key)) {
    // 如果是 AI 生图且选中了文本元素，自动填充文本内容
    if (key === 'generate-image') {
      const element = getCanvasCore().findElementById(selectedLayerIds.value[0])
      if (element && element.tag === 'Text' && element.text) {
        prompt.value = element.text
      }
    }

    nextTick(() => {
      inputRef.value?.focus()
    })
  }
}

const closePanel = (e) => {
  e?.stopPropagation()
  activeFunction.value = null
  prompt.value = ''
}

const handleAiPolish = async () => {
  const element = getCanvasCore().findElementById(selectedLayerIds.value[0])
  if (element && element.tag === 'Text') {
    const originalText = element.text
    // 调用润色接口 (如果 prompt 为空，传入默认提示)
    const polishPrompt = prompt.value.trim() || '请优化这段文字，使其更通顺专业'
    const polished = await polishText(polishPrompt, originalText)

    // 更新文本内容
    element.text = polished
    // 记录历史操作
    const core = getCanvasCore()
    if (core && core.recordState) {
      core.recordState('ai-polish')
    }
    ElMessage.success('AI 润色成功')
  } else {
    throw new Error('未选中有效的文本元素')
  }
}

const handleGenerateImage = async () => {
  const element = getCanvasCore().findElementById(selectedLayerIds.value[0])

  // 检查当前选中元素是否为图片，如果是，则提取 URL 作为参考图
  let sourceImageUrl = null
  if (element) {
    if (element.tag === 'Text') {
      sourceImageUrl = null
    } else if (element.tag === 'Image') {
      sourceImageUrl = element.url
    } else {
      // 尝试导出非图片元素为 base64
      try {
        const result = await element.export('png')
        if (result && result.data) {
          sourceImageUrl = result.data
        }
      } catch (e) {
        console.error('导出元素失败', e)
      }
    }
  }

  const [width, height] = selectedSize.value.split('x').map(Number)

  const generatedImageUrl = await callVolcEngine(prompt.value, {
    image: sourceImageUrl, // 传入参考图
    width,
    height
  })

  const core = getCanvasCore()
  if (core && core.addImage) {
    // 计算生成图片的位置：显示在原图正下方，间隔 20px
    let options = {}
    if (element && element.worldBoxBounds) {
      const bounds = element.worldBoxBounds

      options = {
        x: bounds.x,
        y: bounds.y + bounds.height + 20,
        // 尺寸保持一致，或者使用生成的尺寸
        width: width,
        height: height
      }

      // 如果是文本元素生成的图片，可能不需要强制宽高一致，而是保持比例
      if (element.tag === 'Text') {
        delete options.width
        delete options.height
      }
    } else {
      // 如果是文生图（没有参考图或参考图没有位置），则需要传递尺寸
      options = {
        width: width / (core.app.tree.scaleX || 1), // 考虑到画布缩放，可能需要调整
        height: height / (core.app.tree.scaleX || 1)
      }
    }

    // 添加图片到画布
    core.addImage(generatedImageUrl, options)
    ElMessage.success('图片生成成功')
  } else {
    throw new Error('Canvas Core not found')
  }
}

const handleSend = async () => {
  // 如果是生图，prompt 不能为空；如果是润色，prompt 可以为空（表示默认润色）
  if (activeFunction.value === 'generate-image' && !prompt.value.trim()) return

  loading.value = true
  try {
    if (activeFunction.value === 'ai-polish') {
      await handleAiPolish()
    } else {
      await handleGenerateImage()
    }

    closePanel()
  } catch (error) {
    console.error(error)
    ElMessage.error(error.message || '操作失败')
  } finally {
    loading.value = false
  }
}

watch(
  selectedLayerIds,
  (newIds) => {
    updatePosition()
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
.ai-toolbar {
  position: fixed;
  transform: translateX(-50%) translateY(-100%); /* 向上偏移自身的 100% 以便定位在 top 坐标之上 */
  z-index: 9998;
  pointer-events: auto;
  user-select: none;
}

.toolbar-menu {
  background-color: #fff;
  border-radius: 20px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  display: flex;
  align-items: center;
  padding: 4px;
  gap: 4px;
  border: 1px solid rgba(0, 0, 0, 0.05);
}

.menu-item {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border-radius: 16px;
  font-size: 13px;
  font-weight: 500;
  color: #333;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.25, 0.8, 0.25, 1);
  white-space: nowrap;
}

.menu-item:hover {
  background-color: #f3f4f6;
  color: var(--primary-color);
  transform: translateY(-1px);
}

.menu-item i {
  font-size: 16px;
  background: linear-gradient(135deg, #a78bfa, #8b5cf6);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

/* 覆盖 element input 样式以匹配风格 */
:deep(.el-input__wrapper),
:deep(.el-textarea__inner) {
  box-shadow: 0 0 0 1px #e5e7eb inset;
  border-radius: 6px;
}

:deep(.el-input__wrapper.is-focus),
:deep(.el-textarea__inner:focus) {
  box-shadow: 0 0 0 1px var(--primary-color) inset;
}

/* 功能面板样式 */
.function-panel {
  animation: slideIn 0.2s cubic-bezier(0.25, 0.8, 0.25, 1);
}

.panel-content {
  background-color: #fff;
  padding: 8px;
  border-radius: 12px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
  border: 1px solid rgba(0, 0, 0, 0.05);
  display: flex;
  gap: 8px;
  min-width: 320px;
}

/* AI 生图面板特殊布局 */
.ai-image-panel {
  flex-direction: column;
  align-items: stretch;
  min-width: 380px;
  position: relative;
  padding: 12px;
  padding-top: 36px; /* 为关闭按钮留出顶部空间 */
}

.header-close {
  position: absolute;
  right: 8px;
  top: 8px;
  z-index: 2;
}

.input-row {
  display: flex;
  gap: 8px;
  align-items: stretch; /* 拉伸以对齐高度 */
}

.right-col {
  display: flex;
  flex-direction: column;
  gap: 8px;
  width: 110px; /* 稍微加宽 */
}

.size-select {
  width: 100%;
}

.ai-textarea {
  flex: 1;
}

.send-btn {
  width: 100%;
  height: 36px; /* 稍微增加高度 */
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  padding: 0;
  margin-top: auto; /* 靠下对齐 */
}

.ai-input-area {
  align-items: center;
}

.ai-input {
  width: 220px;
}

.close-btn {
  cursor: pointer;
  width: 24px;
  height: 24px;
  border-radius: 4px;
  color: #909399;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.close-btn:hover {
  background-color: #f3f4f6;
  color: #606266;
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: scale(0.95);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}
</style>
