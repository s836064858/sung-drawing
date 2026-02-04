<template>
  <div class="property-panel">
    <div class="panel-header">
      <i class="ri-settings-3-line icon"></i>
      <h3>属性</h3>
    </div>
    <div class="panel-content">
      <!-- 属性编辑内容 -->
      <el-empty description="未选中元素" :image-size="80" />
    </div>
  </div>
</template>

<script setup>
// 属性面板逻辑
</script>

<style scoped>
.property-panel {
  height: 100%;
  display: flex;
  flex-direction: column;
  background-color: #fff;
  border-left: 1px solid var(--border-color);
  box-shadow: -2px 0 8px rgba(0, 0, 0, 0.02);
  z-index: 10;
}

.panel-header {
  height: 48px;
  padding: 0 16px;
  display: flex;
  align-items: center;
  border-bottom: 1px solid var(--border-color);
  background-color: #fff;
}

.panel-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: var(--text-color);
}

.icon {
  margin-right: 8px;
  font-size: 18px;
  color: var(--text-color);
}

.panel-content {
  flex: 1;
  overflow-y: auto;
  padding: 12px;
}
</style>
