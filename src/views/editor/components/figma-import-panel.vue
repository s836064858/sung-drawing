<template>
  <div class="import-panel">
    <div class="import-tabs">
      <div class="import-tab" :class="{ active: mode === 'file' }" @click="mode = 'file'">本地文件</div>
      <div class="import-tab" :class="{ active: mode === 'json' }" @click="mode = 'json'">粘贴 JSON</div>
      <div class="import-tab" :class="{ active: mode === 'url' }" @click="mode = 'url'">Figma URL</div>
    </div>

    <div class="import-content">
      <!-- 本地 .fig 文件 -->
      <div v-show="mode === 'file'" class="import-section">
        <div
          class="drop-zone"
          :class="{ dragging: isDragging, 'has-file': fileName }"
          @dragover.prevent="isDragging = true"
          @dragleave="isDragging = false"
          @drop.prevent="handleFileDrop"
          @click="triggerFileInput"
        >
          <template v-if="fileName">
            <i class="ri-file-check-line drop-icon success"></i>
            <div class="drop-text">{{ fileName }}</div>
            <div class="drop-hint" @click.stop="clearFile">点击移除</div>
          </template>
          <template v-else>
            <i class="ri-upload-cloud-line drop-icon"></i>
            <div class="drop-text">拖拽 .fig 文件到此处</div>
            <div class="drop-hint">或点击选择文件</div>
          </template>
        </div>
        <input ref="fileInputRef" type="file" accept=".fig,.json" style="display: none" @change="handleFileInput" />
      </div>

      <!-- 粘贴 JSON -->
      <div v-show="mode === 'json'" class="import-section">
        <textarea
          v-model="jsonText"
          class="json-input"
          placeholder="粘贴 Figma 导出的 JSON 数据..."
          :disabled="loading"
        ></textarea>
      </div>

      <!-- Figma URL -->
      <div v-show="mode === 'url'" class="import-section">
        <input
          v-model="figmaUrl"
          class="text-input"
          placeholder="https://www.figma.com/design/XXXXX/..."
          :disabled="loading"
        />
        <input
          v-model="figmaToken"
          class="text-input"
          type="password"
          placeholder="Personal Access Token"
          :disabled="loading"
          style="margin-top: 8px"
        />
        <div class="field-tip">在 Figma 设置 → Personal Access Tokens 中生成</div>
      </div>
    </div>

    <div v-if="errorMsg" class="error-msg">{{ errorMsg }}</div>
    <div v-if="successMsg" class="success-msg">{{ successMsg }}</div>

    <button class="import-btn" :disabled="loading || !canImport" @click="handleImport">
      <i v-if="loading" class="ri-loader-4-line spinning"></i>
      <i v-else class="ri-import-line"></i>
      <span>{{ loading ? '导入中...' : '导入到画布' }}</span>
    </button>
  </div>
</template>

<script setup>
import { ref, computed, inject } from 'vue'

const getCanvasCore = inject('getCanvasCore')

const mode = ref('file')
const loading = ref(false)
const errorMsg = ref('')
const successMsg = ref('')

// file mode
const fileInputRef = ref(null)
const fileContent = ref(null)
const fileName = ref('')
const isDragging = ref(false)

// json mode
const jsonText = ref('')

// url mode
const figmaUrl = ref('')
const figmaToken = ref('')

const canImport = computed(() => {
  if (mode.value === 'file') return !!fileContent.value
  if (mode.value === 'json') return !!jsonText.value.trim()
  if (mode.value === 'url') return !!figmaUrl.value.trim() && !!figmaToken.value.trim()
  return false
})

const triggerFileInput = () => {
  if (!fileName.value) fileInputRef.value?.click()
}

const clearFile = () => {
  fileContent.value = null
  fileName.value = ''
  if (fileInputRef.value) fileInputRef.value.value = ''
}

const readFile = (file) => {
  errorMsg.value = ''
  successMsg.value = ''
  const reader = new FileReader()
  reader.onload = (e) => {
    try {
      fileContent.value = JSON.parse(e.target.result)
      fileName.value = file.name
    } catch {
      errorMsg.value = '文件内容不是有效的 JSON'
      fileContent.value = null
      fileName.value = ''
    }
  }
  reader.readAsText(file)
}

const handleFileDrop = (e) => {
  isDragging.value = false
  const file = e.dataTransfer?.files?.[0]
  if (file) readFile(file)
}

const handleFileInput = (e) => {
  const file = e.target.files?.[0]
  if (file) readFile(file)
}

const handleImport = async () => {
  const canvasCore = getCanvasCore()
  if (!canvasCore) {
    errorMsg.value = '画布未就绪'
    return
  }

  errorMsg.value = ''
  successMsg.value = ''
  loading.value = true

  try {
    let count = 0

    if (mode.value === 'file') {
      count = canvasCore.importFromFigmaJSON(fileContent.value)
    } else if (mode.value === 'json') {
      count = canvasCore.importFromFigmaJSON(jsonText.value.trim())
    } else if (mode.value === 'url') {
      count = await canvasCore.importFromFigmaAPI(figmaUrl.value.trim(), figmaToken.value.trim())
    }

    if (count > 0) {
      successMsg.value = `成功导入 ${count} 个元素`
      errorMsg.value = ''
    } else {
      errorMsg.value = '未找到可导入的元素'
    }
  } catch (err) {
    errorMsg.value = err.message || '导入失败'
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.import-panel {
  padding: 12px;
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow-y: auto;
}

.import-tabs {
  display: flex;
  gap: 2px;
  background: #f5f7fa;
  border-radius: 6px;
  padding: 3px;
  flex-shrink: 0;
}

.import-tab {
  flex: 1;
  text-align: center;
  padding: 6px 0;
  font-size: 12px;
  color: #909399;
  cursor: pointer;
  border-radius: 4px;
  transition: all 0.2s;
  user-select: none;
}

.import-tab:hover {
  color: #606266;
}

.import-tab.active {
  background: #fff;
  color: var(--primary-color);
  font-weight: 600;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
}

.import-content {
  /* flex: 1; */
  margin-top: 12px;
  min-height: 0;
}

.import-section {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.drop-zone {
  border: 2px dashed #dcdfe6;
  border-radius: 8px;
  padding: 32px 16px;
  text-align: center;
  cursor: pointer;
  transition: all 0.2s;
  background: #fafafa;
}

.drop-zone:hover,
.drop-zone.dragging {
  border-color: var(--primary-color);
  background: var(--primary-color-light);
}

.drop-zone.has-file {
  border-color: #67c23a;
  border-style: solid;
  background: #f0f9eb;
  cursor: default;
}

.drop-icon {
  font-size: 36px;
  color: #c0c4cc;
  display: block;
  margin-bottom: 8px;
}

.drop-icon.success {
  color: #67c23a;
}

.drop-text {
  font-size: 13px;
  color: #606266;
  margin-bottom: 4px;
}

.drop-hint {
  font-size: 12px;
  color: #909399;
  cursor: pointer;
}

.drop-zone.has-file .drop-hint:hover {
  color: #f56c6c;
}

.json-input {
  width: 100%;
  min-height: 160px;
  padding: 10px;
  border: 1px solid #dcdfe6;
  border-radius: 6px;
  font-size: 12px;
  font-family: monospace;
  resize: vertical;
  outline: none;
  transition: border-color 0.2s;
  box-sizing: border-box;
}

.json-input:focus {
  border-color: var(--primary-color);
}

.text-input {
  width: 100%;
  padding: 8px 10px;
  border: 1px solid #dcdfe6;
  border-radius: 6px;
  font-size: 13px;
  outline: none;
  transition: border-color 0.2s;
  box-sizing: border-box;
}

.text-input:focus {
  border-color: var(--primary-color);
}

.field-tip {
  font-size: 11px;
  color: #909399;
  margin-top: 6px;
  line-height: 1.4;
}

.error-msg {
  color: #f56c6c;
  font-size: 12px;
  margin-top: 10px;
  padding: 6px 10px;
  background: #fef0f0;
  border-radius: 4px;
  flex-shrink: 0;
}

.success-msg {
  color: #67c23a;
  font-size: 12px;
  margin-top: 10px;
  padding: 6px 10px;
  background: #f0f9eb;
  border-radius: 4px;
  flex-shrink: 0;
}

.import-btn {
  margin-top: 12px;
  width: 100%;
  padding: 10px 0;
  border: none;
  border-radius: 6px;
  background: var(--primary-color);
  color: #fff;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  transition: all 0.2s;
  flex-shrink: 0;
}

.import-btn:hover:not(:disabled) {
  opacity: 0.85;
}

.import-btn:disabled {
  background: #c0c4cc;
  cursor: not-allowed;
}

.import-btn i {
  font-size: 16px;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.spinning {
  animation: spin 1s linear infinite;
}
</style>
