<template>
  <div class="page-list-panel">
    <div class="panel-header">
      <span class="title">页面</span>
      <div class="actions">
        <el-tooltip content="新建页面" placement="top">
          <div class="icon-btn" @click="handleAddPage">
            <i class="ri-add-line"></i>
          </div>
        </el-tooltip>
      </div>
    </div>

    <div class="page-list" @contextmenu.prevent>
      <div
        v-for="page in pages"
        :key="page.id"
        class="page-item"
        :class="{ active: activePageId === page.id }"
        @click="handleSwitchPage(page.id)"
        @contextmenu.prevent="handleContextMenu($event, page)"
      >
        <span class="page-name" v-if="!editingId || editingId !== page.id" @dblclick="startRename(page)">{{ page.name }}</span>
        <el-input v-else v-model="editingName" size="small" ref="renameInput" @blur="finishRename(page)" @keyup.enter="finishRename(page)" />

        <div class="item-actions" v-if="pages.length > 1">
          <el-popconfirm title="确定删除此页面吗？" confirm-button-text="确定" cancel-button-text="取消" @confirm="handleDeletePage(page.id, $event)">
            <template #reference>
              <div class="icon-btn delete-btn" @click.stop>
                <i class="ri-delete-bin-line"></i>
              </div>
            </template>
          </el-popconfirm>
        </div>
      </div>
    </div>

    <div class="divider"></div>

    <!-- 右键菜单 -->
    <div v-show="contextMenuVisible" class="context-menu" :style="{ top: contextMenuY + 'px', left: contextMenuX + 'px' }" @click.stop>
      <div class="menu-item" @click="handleRename">重命名</div>
      <div class="menu-item" @click="handleDuplicate">创建副本</div>
      <div class="menu-item" @click="handleExportJson">导出 JSON</div>
      <div class="menu-divider"></div>
      <div class="menu-item delete" @click="handleDeleteFromMenu">删除</div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, nextTick, inject, onMounted, onUnmounted } from 'vue'
import { useStore } from 'vuex'
import { ElMessage } from 'element-plus'

const store = useStore()
const getCanvasCore = inject('getCanvasCore')

const pages = computed(() => store.state.pages)
const activePageId = computed(() => store.state.activePageId)

const editingId = ref(null)
const editingName = ref('')
const renameInput = ref(null)

// 上下文菜单状态
const contextMenuVisible = ref(false)
const contextMenuX = ref(0)
const contextMenuY = ref(0)
const contextMenuTargetPage = ref(null)

const handleAddPage = () => {
  // 保存当前页面数据
  saveCurrentPageData()

  // 创建新页面
  const newPageId = `page-${Date.now()}`
  const newPageName = `页面 ${pages.value.length + 1}`

  store.commit('addPage', {
    id: newPageId,
    name: newPageName,
    json: null // 空页面
  })

  // 切换到新页面
  switchPage(newPageId)
}

const handleSwitchPage = (pageId) => {
  if (pageId === activePageId.value) return

  // 保存当前页面数据
  saveCurrentPageData()

  // 切换
  switchPage(pageId)
}

const saveCurrentPageData = () => {
  const core = getCanvasCore && getCanvasCore()
  if (core) {
    const json = core.exportJson()
    store.commit('updatePage', {
      id: activePageId.value,
      data: { json }
    })
  }
}

const switchPage = (pageId) => {
  store.commit('setActivePageId', pageId)

  // 加载新页面数据
  const page = pages.value.find((p) => p.id === pageId)
  const core = getCanvasCore && getCanvasCore()

  if (page && core) {
    core.importJson(page.json)
  }
}

const handleDeletePage = (pageId) => {
  if (pages.value.length <= 1) {
    ElMessage.warning('至少保留一个页面')
    return
  }

  const isCurrent = pageId === activePageId.value
  store.commit('removePage', pageId)

  if (isCurrent) {
    // 如果删除的是当前页，切换到第一个页面
    const firstPage = pages.value[0]
    switchPage(firstPage.id)
  }
}

const startRename = (page) => {
  editingId.value = page.id
  editingName.value = page.name
  nextTick(() => {
    renameInput.value?.focus()
  })
}

const finishRename = (page) => {
  if (editingName.value.trim()) {
    store.commit('updatePage', {
      id: page.id,
      data: { name: editingName.value }
    })
  }
  editingId.value = null
}

// 右键菜单逻辑
const handleContextMenu = (event, page) => {
  contextMenuTargetPage.value = page
  contextMenuX.value = event.clientX
  contextMenuY.value = event.clientY
  contextMenuVisible.value = true
}

const closeContextMenu = () => {
  contextMenuVisible.value = false
}

const handleRename = () => {
  if (contextMenuTargetPage.value) {
    startRename(contextMenuTargetPage.value)
  }
  closeContextMenu()
}

const handleDuplicate = () => {
  if (!contextMenuTargetPage.value) return

  // 保存当前页面数据，确保数据最新
  if (contextMenuTargetPage.value.id === activePageId.value) {
    saveCurrentPageData()
  }

  // 获取最新数据
  const sourcePage = pages.value.find((p) => p.id === contextMenuTargetPage.value.id)

  // 深拷贝 JSON 数据
  let jsonClone = null
  if (sourcePage.json) {
    // 简单的深拷贝
    jsonClone = JSON.parse(JSON.stringify(sourcePage.json))
  }

  const newPageId = `page-${Date.now()}`
  const newPageName = `${sourcePage.name} 副本`

  store.commit('addPage', {
    id: newPageId,
    name: newPageName,
    json: jsonClone
  })

  closeContextMenu()
}

const handleExportJson = () => {
  if (!contextMenuTargetPage.value) return

  // 同样确保数据最新
  if (contextMenuTargetPage.value.id === activePageId.value) {
    saveCurrentPageData()
  }

  const sourcePage = pages.value.find((p) => p.id === contextMenuTargetPage.value.id)
  const jsonStr = JSON.stringify(sourcePage.json || {}, null, 2)

  // 创建 Blob 并下载
  const blob = new Blob([jsonStr], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${sourcePage.name}.json`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)

  closeContextMenu()
}

const handleDeleteFromMenu = () => {
  if (contextMenuTargetPage.value) {
    handleDeletePage(contextMenuTargetPage.value.id)
  }
  closeContextMenu()
}

// 点击外部关闭菜单
onMounted(() => {
  window.addEventListener('click', closeContextMenu)
})

onUnmounted(() => {
  window.removeEventListener('click', closeContextMenu)
})
</script>

<style scoped>
.page-list-panel {
  display: flex;
  flex-direction: column;
  background-color: #fff;
  border-bottom: 1px solid #ebeef5;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 12px;
  font-size: 13px;
  font-weight: 600;
  color: #303133;
  user-select: none;
}

.actions {
  display: flex;
  gap: 4px;
}

.icon-btn {
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  cursor: pointer;
  color: #909399;
  transition: all 0.2s;
  font-size: 14px;
}

.icon-btn:hover {
  background-color: #f2f6fc;
  color: var(--primary-color);
}

.page-list {
  min-height: 100px;
  overflow-y: auto;
  padding: 4px 8px 8px;
}

/* 自定义滚动条 */
.page-list::-webkit-scrollbar {
  width: 4px;
}
.page-list::-webkit-scrollbar-thumb {
  background: #e4e7ed;
  border-radius: 2px;
}
.page-list::-webkit-scrollbar-track {
  background: transparent;
}

.page-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 32px;
  padding: 0 8px;
  margin-bottom: 2px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 13px;
  color: #606266;
  transition: all 0.2s;
  position: relative;
}

.page-item:hover {
  background-color: #f5f7fa;
  color: #303133;
}

.page-item.active {
  background-color: var(--primary-color-light);
  color: var(--primary-color);
  font-weight: 500;
}

.page-item.active::before {
  content: '';
  position: absolute;
  left: 0;
  top: 6px;
  bottom: 6px;
  width: 3px;
  background-color: var(--primary-color);
  border-radius: 0 2px 2px 0;
}

.page-name {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  line-height: 32px;
  user-select: none;
}

.item-actions {
  display: none;
  align-items: center;
}

.page-item:hover .item-actions {
  display: flex;
}

.delete-btn {
  font-size: 13px;
}

.delete-btn:hover {
  color: #f56c6c;
  background-color: #fef0f0;
}

.divider {
  display: none; /* 移除分割线，用 border-bottom 代替 */
}

/* 上下文菜单样式 */
.context-menu {
  position: fixed;
  z-index: 2000;
  background: #fff;
  border-radius: 4px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  border: 1px solid #e4e7ed;
  padding: 4px 0;
  min-width: 120px;
}

.menu-item {
  padding: 8px 16px;
  font-size: 13px;
  color: #606266;
  cursor: pointer;
  transition: background-color 0.2s;
}

.menu-item:hover {
  background-color: #f5f7fa;
  color: var(--primary-color);
}

.menu-item.delete:hover {
  color: #f56c6c;
  background-color: #fef0f0;
}

.menu-divider {
  height: 1px;
  background-color: #ebeef5;
  margin: 4px 0;
}
</style>
