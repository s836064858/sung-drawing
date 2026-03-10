<template>
  <div class="shortcut-guide-container" :class="{ collapsed: isCollapsed }" ref="guideRef">
    <!-- 折叠后的图标按钮 -->
    <div class="shortcut-icon-btn" v-if="isCollapsed" @click.stop="toggleCollapse">
      <el-tooltip content="快捷键" placement="right">
        <i class="ri-keyboard-line icon"></i>
      </el-tooltip>
    </div>

    <!-- 展开后的面板 -->
    <div class="shortcut-panel" v-else>
      <div class="panel-header">
        <div class="title-area">
          <i class="ri-keyboard-line icon"></i>
          <span class="title">快捷键指南</span>
        </div>
        <div class="close-btn" @click="toggleCollapse">
          <i class="ri-close-line"></i>
        </div>
      </div>

      <div class="panel-content">
        <div class="shortcut-group">
          <div class="group-title">通用</div>
          <div class="shortcut-list">
            <div class="shortcut-item" v-for="item in commonShortcuts" :key="item.keys">
              <span class="label">{{ item.label }}</span>
              <div class="keys-wrapper">
                <span class="key" v-for="(key, index) in item.keys" :key="index">{{ key }}</span>
              </div>
            </div>
          </div>
        </div>

        <div class="divider"></div>

        <div class="shortcut-group">
          <div class="group-title">工具</div>
          <div class="shortcut-list">
            <div class="shortcut-item" v-for="item in toolShortcuts" :key="item.keys">
              <span class="label">{{ item.label }}</span>
              <div class="keys-wrapper">
                <span class="key" v-for="(key, index) in item.keys" :key="index">{{ key }}</span>
              </div>
            </div>
            <div class="empty-item" v-if="toolShortcuts.length === 0">
              <span class="label">暂无工具快捷键</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed } from 'vue'

const isCollapsed = ref(true)
const isMac = ref(true)
const guideRef = ref(null)

const toggleCollapse = () => {
  isCollapsed.value = !isCollapsed.value
}

const handleClickOutside = (event) => {
  if (isCollapsed.value) return
  if (guideRef.value && !guideRef.value.contains(event.target)) {
    isCollapsed.value = true
  }
}

onMounted(() => {
  // 检测是否为 Mac 系统
  isMac.value = /Mac|iPod|iPhone|iPad/.test(navigator.platform)

  // 监听全局点击事件
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})

const modKey = computed(() => (isMac.value ? '⌘' : 'Ctrl'))
const shiftKey = computed(() => (isMac.value ? '⇧' : 'Shift'))

const commonShortcuts = computed(() => [
  { keys: [modKey.value, 'Z'], label: '撤销' },
  { keys: [shiftKey.value, modKey.value, 'Z'], label: '重做' },
  { keys: [modKey.value, 'C'], label: '复制' },
  { keys: [modKey.value, 'D'], label: '快速复制' },
  { keys: [modKey.value, 'A'], label: '全选' },
  { keys: [modKey.value, '+'], label: '放大' },
  { keys: [modKey.value, '-'], label: '缩小' },
  { keys: [modKey.value, '0'], label: '重置缩放' },
  { keys: [isMac.value ? '⌫' : 'Del'], label: '删除' },
  { keys: ['Space'], label: '抓手工具' }
])

const toolShortcuts = []
</script>

<style scoped>
.shortcut-guide-container {
  position: absolute;
  left: 24px;
  bottom: 16px;
  z-index: 100;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
}

/* 折叠状态 - 圆形图标按钮 */
.shortcut-icon-btn {
  width: 40px;
  height: 40px;
  background-color: #fff;
  border-radius: 50%;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
  color: #606266;
}

.shortcut-icon-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.12);
  color: var(--primary-color);
}

.shortcut-icon-btn .icon {
  font-size: 20px;
}

/* 展开状态 - 面板 */
.shortcut-panel {
  width: 260px;
  background-color: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-radius: 12px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
  border: 1px solid rgba(0, 0, 0, 0.05);
  overflow: hidden;
  animation: slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1);
  display: flex;
  flex-direction: column;
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(10px) scale(0.95);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
  background-color: rgba(255, 255, 255, 0.5);
}

.title-area {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #303133;
  font-weight: 600;
  font-size: 14px;
}

.close-btn {
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  cursor: pointer;
  color: #909399;
  transition: all 0.2s;
}

.close-btn:hover {
  background-color: rgba(0, 0, 0, 0.05);
  color: #606266;
}

.panel-content {
  padding: 12px 0;
  max-height: 400px;
  overflow-y: auto;
}

.panel-content::-webkit-scrollbar {
  width: 4px;
}

.panel-content::-webkit-scrollbar-thumb {
  background-color: rgba(0, 0, 0, 0.1);
  border-radius: 2px;
}

.shortcut-group {
  padding: 0 16px;
}

.group-title {
  font-size: 12px;
  color: #909399;
  margin-bottom: 8px;
  font-weight: 500;
}

.shortcut-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.shortcut-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 13px;
  color: #606266;
}

.keys-wrapper {
  display: flex;
  gap: 4px;
}

.key {
  font-family:
    ui-monospace,
    SFMono-Regular,
    SF Mono,
    Menlo,
    Consolas,
    Liberation Mono,
    monospace;
  background-color: #f5f7fa;
  border: 1px solid #e4e7ed;
  border-radius: 4px;
  padding: 2px 6px;
  font-size: 12px;
  color: #303133;
  min-width: 20px;
  text-align: center;
  box-shadow: 0 1px 1px rgba(0, 0, 0, 0.05);
}

.divider {
  height: 1px;
  background-color: rgba(0, 0, 0, 0.05);
  margin: 12px 0;
}

.empty-item {
  font-size: 12px;
  color: #909399;
  text-align: center;
}
.empty-item .label {
  display: block;
}
</style>
