<template>
  <el-dialog v-model="visible" title="设置" width="500px" :close-on-click-modal="false" append-to-body>
    <el-form label-position="top">
      <el-form-item label="火山引擎 API Key">
        <el-input v-model="apiKey" placeholder="请输入 API Key" type="password" show-password>
          <template #prefix>
            <i class="ri-key-2-line"></i>
          </template>
        </el-input>
        <div class="form-tip">
          用于 AI 生图和润色功能。
          <a href="https://console.volcengine.com/ark/region:ark+cn-beijing/apiKey" target="_blank">获取 Key</a>
        </div>
      </el-form-item>
    </el-form>
    <template #footer>
      <span class="dialog-footer">
        <el-button @click="visible = false">取消</el-button>
        <el-button type="primary" @click="saveSettings">保存</el-button>
      </span>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, watch } from 'vue'
import { ElMessage } from 'element-plus'

const visible = ref(false)
const apiKey = ref('')

const open = () => {
  // 从 localStorage 读取
  const savedKey = localStorage.getItem('VITE_VOLC_API_KEY')
  // 如果 localStorage 没有，尝试读取环境变量（仅用于显示默认值，实际生产环境不建议暴露）
  apiKey.value = savedKey || ''
  visible.value = true
}

const saveSettings = () => {
  if (apiKey.value) {
    localStorage.setItem('VITE_VOLC_API_KEY', apiKey.value)
  } else {
    localStorage.removeItem('VITE_VOLC_API_KEY')
  }
  visible.value = false
  ElMessage.success('设置已保存')
}

defineExpose({
  open
})
</script>

<style scoped>
.form-tip {
  font-size: 12px;
  color: #909399;
  margin-top: 4px;
}

.form-tip a {
  color: var(--primary-color);
  text-decoration: none;
}

.form-tip a:hover {
  text-decoration: underline;
}
</style>
