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
        <div class="panel-controls">
          <div class="search-box">
            <i class="ri-search-line"></i>
            <input v-model.trim="searchKeyword" type="text" placeholder="搜索快捷键" />
          </div>
          <div class="category-tabs">
            <button class="tab-btn" :class="{ active: activeCategory === 'all' }" @click="activeCategory = 'all'">全部</button>
            <button class="tab-btn" :class="{ active: activeCategory === 'common' }" @click="activeCategory = 'common'">
              通用 {{ commonShortcuts.length }}
            </button>
            <button class="tab-btn" :class="{ active: activeCategory === 'tool' }" @click="activeCategory = 'tool'">工具 {{ toolShortcuts.length }}</button>
          </div>
        </div>

        <div class="group-list" v-if="filteredShortcutGroups.length > 0">
          <div class="shortcut-group-card" v-for="group in filteredShortcutGroups" :key="group.key">
            <div class="group-header" @click="toggleGroup(group.key)">
              <div class="group-title-row">
                <span class="group-title">{{ group.title }}</span>
                <span class="group-count">{{ group.items.length }}</span>
              </div>
              <i class="ri-arrow-down-s-line group-arrow" :class="{ collapsed: collapsedGroups[group.key] }"></i>
            </div>
            <div class="shortcut-list" v-show="!collapsedGroups[group.key]">
              <div class="shortcut-item" v-for="item in group.items" :key="`${group.key}-${item.label}`">
                <span class="label">{{ item.label }}</span>
                <div class="keys-area">
                  <div class="keys-wrapper">
                    <span class="key" v-for="(key, index) in item.keys" :key="index">{{ key }}</span>
                  </div>
                  <span class="key-hint" v-if="item.hint">{{ item.hint }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div class="empty-item" v-else>
          <span class="label">未找到匹配的快捷键</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed, reactive } from 'vue'

const isCollapsed = ref(true)
const isMac = ref(true)
const guideRef = ref(null)
const searchKeyword = ref('')
const activeCategory = ref('all')
const collapsedGroups = reactive({
  common: false,
  tool: false
})

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
  { keys: [modKey.value, 'G'], label: '编组' },
  { keys: [shiftKey.value, modKey.value, 'G'], label: '解组' },
  { keys: [modKey.value, 'A'], label: '全选' },
  { keys: [modKey.value, '+'], label: '放大' },
  { keys: [modKey.value, '-'], label: '缩小' },
  { keys: [modKey.value, '0'], label: '重置缩放' },
  { keys: [isMac.value ? '⌫' : 'Del'], label: '删除' },
  { keys: ['Space'], label: '抓手工具' },
  { keys: ['↑', '↓', '←', '→'], label: '微调位移（1px）', hint: '方向键' },
  { keys: [shiftKey.value, '↑', '↓', '←', '→'], label: '微调位移（10px）', hint: 'shift + 方向键' }
])

const toolShortcuts = computed(() => [
  { keys: ['V'], label: '选择模式' },
  { keys: ['H'], label: '移动模式' },
  { keys: ['P'], label: '钢笔工具' },
  { keys: ['R'], label: '矩形工具' },
  { keys: ['O'], label: '圆形工具' },
  { keys: ['D'], label: '菱形工具' },
  { keys: ['L'], label: '直线工具' },
  { keys: ['A'], label: '箭头工具' },
  { keys: ['F'], label: 'Frame 工具' },
  { keys: ['T'], label: '文字工具' }
])

const allShortcutGroups = computed(() => [
  { key: 'common', title: '通用', items: commonShortcuts.value },
  { key: 'tool', title: '工具', items: toolShortcuts.value }
])

const filteredShortcutGroups = computed(() => {
  const keyword = searchKeyword.value.toLowerCase()
  const groups = allShortcutGroups.value.filter((group) => activeCategory.value === 'all' || group.key === activeCategory.value)

  if (!keyword) return groups

  return groups
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => `${item.label} ${item.keys.join(' ')} ${item.hint || ''}`.toLowerCase().includes(keyword))
    }))
    .filter((group) => group.items.length > 0)
})

const toggleGroup = (groupKey) => {
  collapsedGroups[groupKey] = !collapsedGroups[groupKey]
}
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
  width: 320px;
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
  padding: 12px;
  max-height: 460px;
  overflow-y: auto;
}

.panel-content::-webkit-scrollbar {
  width: 4px;
}

.panel-content::-webkit-scrollbar-thumb {
  background-color: rgba(0, 0, 0, 0.1);
  border-radius: 2px;
}

.panel-controls {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 10px;
}

.search-box {
  height: 32px;
  border: 1px solid #e4e7ed;
  border-radius: 8px;
  display: flex;
  align-items: center;
  padding: 0 10px;
  gap: 8px;
  color: #909399;
  background-color: #fff;
}

.search-box input {
  border: none;
  outline: none;
  width: 100%;
  font-size: 12px;
  color: #606266;
}

.category-tabs {
  display: flex;
  gap: 6px;
}

.tab-btn {
  border: 1px solid #e4e7ed;
  background-color: #fff;
  border-radius: 999px;
  padding: 4px 10px;
  font-size: 12px;
  color: #606266;
  cursor: pointer;
  transition: all 0.2s;
}

.tab-btn.active {
  color: var(--primary-color);
  border-color: var(--primary-color);
  background-color: var(--primary-color-light);
}

.group-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.shortcut-group-card {
  border: 1px solid #ebeef5;
  border-radius: 10px;
  overflow: hidden;
  background-color: #fff;
}

.group-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 10px;
  cursor: pointer;
  background-color: #f8fafc;
}

.group-title-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.group-title {
  font-size: 12px;
  color: #606266;
  font-weight: 600;
}

.group-count {
  font-size: 11px;
  color: #909399;
}

.group-arrow {
  color: #909399;
  transition: transform 0.2s;
}

.group-arrow.collapsed {
  transform: rotate(-90deg);
}

.shortcut-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 8px 10px;
}

.shortcut-item {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  font-size: 13px;
  color: #606266;
  padding: 4px 8px;
  border-radius: 6px;
  transition: background-color 0.2s;
  cursor: default;
}

.shortcut-item:hover {
  background-color: rgba(0, 0, 0, 0.04);
}

.keys-wrapper {
  display: flex;
  gap: 4px;
  justify-content: flex-end;
}

.keys-area {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 2px;
}

.key-hint {
  font-size: 11px;
  color: #c0c4cc;
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

.empty-item {
  font-size: 12px;
  color: #909399;
  text-align: center;
}
.empty-item .label {
  display: block;
}
</style>
