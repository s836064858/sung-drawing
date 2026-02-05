export const layerMixin = {
  /**
   * 同步图层列表到外部
   */
  syncLayers() {
    if (!this.callbacks.onLayersChange) return

    const excludedTags = new Set(['SimulateElement'])
    const layers = this.app.tree.children
      .filter((child) => !excludedTags.has(child.tag) && !child.isInternal)
      .map((child) => this.formatLayerData(child))
      .reverse()

    this.callbacks.onLayersChange(layers)
  },

  /**
   * 格式化图层数据（支持子图层）
   */
  formatLayerData(child) {
    const layerData = {
      id: child.innerId,
      name: this.getLayerName(child),
      type: child.tag,
      visible: child.visible !== false,
      locked: child.locked === true,
      isInternal: child.isInternal
    }

    // 如果是 Frame，递归处理子图层
    if (child.tag === 'Frame' && child.children && child.children.length > 0) {
      layerData.children = child.children
        .filter((subChild) => !subChild.isInternal)
        .map((subChild) => this.formatLayerData(subChild))
        .reverse()
    }

    return layerData
  },

  /**
   * 获取图层显示名称
   */
  getLayerName(child) {
    if (child.tag === 'Text') {
      return child.text || '文本'
    }
    return child.name || child.tag || child.innerId
  },

  /**
   * 同步选中状态到外部
   */
  syncSelection() {
    if (!this.callbacks.onSelectionChange) return

    const selectedIds = this.app.editor.list.map((item) => item.innerId)
    this.callbacks.onSelectionChange(selectedIds)
  },

  /**
   * 删除选中的图层
   */
  removeSelectedLayers() {
    const selected = this.app.editor.list
    if (selected.length === 0) return

    // 复制列表，因为 remove 会改变原列表
    const list = [...selected]
    list.forEach((item) => item.remove())
    this.app.editor.cancel()
  },

  /**
   * 选中指定图层
   */
  selectLayer(id) {
    const element = this.findElementById(id)

    if (element) {
      this.app.editor.select(element)
    } else {
      this.app.editor.cancel()
    }

    this.syncSelection()
  },

  /**
   * 切换图层可见性
   */
  toggleVisible(id) {
    const element = this.findElementById(id)
    if (element) {
      element.visible = !element.visible
      if (this.recordState) this.recordState('toggle-visible')
    }
  },

  /**
   * 切换图层锁定状态
   */
  toggleLock(id) {
    const element = this.findElementById(id)
    if (element) {
      element.locked = !element.locked
      if (this.recordState) this.recordState('toggle-lock')
    }
  },

  /**
   * 删除指定图层
   */
  removeLayer(id) {
    const element = this.findElementById(id)
    if (element) {
      element.remove()
      if (this.recordState) this.recordState('remove-layer')
    }
  },

  /**
   * 图层重排序
   * @param {string} dragId 拖拽元素的ID
   * @param {string} targetId 目标元素的ID
   * @param {string} position 'before' | 'after' (相对于目标元素在图层列表中的位置)
   *
   * 注意：图层列表是倒序显示的 (z-index大的在上面)
   * - position 'before' (视觉上方) -> z-index 更大 -> children 数组中在 target 后面
   * - position 'after' (视觉下方) -> z-index 更小 -> children 数组中在 target 前面
   */
  reorderLayer(dragId, targetId, position) {
    const dragLayer = this.findElementById(dragId)
    const targetLayer = this.findElementById(targetId)

    if (!dragLayer || !targetLayer || dragLayer === targetLayer) return

    // 移除拖拽元素
    dragLayer.remove()

    // 获取目标元素索引（在 remove 之后）
    const children = this.app.tree.children
    const targetIndex = children.indexOf(targetLayer)

    if (targetIndex === -1) {
      // 异常情况，添加到最顶层
      this.app.tree.add(dragLayer)
    } else {
      const insertIndex = position === 'before' ? targetIndex + 1 : targetIndex
      this.app.tree.add(dragLayer, insertIndex)
    }

    this.syncLayers()
    if (this.recordState) this.recordState('reorder-layer')
  }
}
