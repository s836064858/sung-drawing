export const layerMixin = {
  syncLayers() {
    if (this.callbacks.onLayersChange) {
      const layers = this.app.tree.children
        .filter((child) => !['SimulateElement'].includes(child.tag))
        .map((child) => ({
          id: child.innerId,
          name: child.tag === 'Text' ? child.text || '文本' : child.name || child.tag || child.innerId,
          type: child.tag,
          visible: child.visible !== false,
          locked: child.locked === true
        }))
        .reverse()

      this.callbacks.onLayersChange(layers)
    }
  },

  syncSelection() {
    if (this.callbacks.onSelectionChange) {
      const selectedIds = this.app.editor.list.map((item) => item.innerId)
      this.callbacks.onSelectionChange(selectedIds)
    }
  },

  removeSelectedLayers() {
    const selected = this.app.editor.list
    if (selected.length > 0) {
      // 复制一份列表，因为 remove 会改变 list
      const list = [...selected]
      list.forEach((item) => item.remove())
      this.app.editor.cancel() // 清除选中状态
    }
  },

  selectLayer(id) {
    const element = this.app.tree.findOne((child) => child.innerId === id)
    if (element) {
      this.app.editor.select(element)
    } else {
      this.app.editor.cancel()
    }
    // 手动触发一次同步，确保 UI 高亮及时更新
    this.syncSelection()
  },

  toggleVisible(id) {
    const element = this.app.tree.findOne((child) => child.innerId === id)
    if (element) {
      element.visible = !element.visible
    }
  },

  toggleLock(id) {
    const element = this.app.tree.findOne((child) => child.innerId === id)
    if (element) {
      element.locked = !element.locked
    }
  },

  removeLayer(id) {
    const element = this.app.tree.findOne((child) => child.innerId === id)
    if (element) {
      element.remove()
    }
  },

  /**
   * 图层重排序
   * @param {string} dragId 拖拽元素的ID
   * @param {string} targetId 目标元素的ID
   * @param {string} position 'before' | 'after' (相对于目标元素在图层列表中的位置 - 视觉上)
   * 注意：图层列表是倒序显示的 (z-index大的在上面)，所以：
   * position 'before' (视觉上方) -> z-index 更大 -> children 数组中在 target 后面
   * position 'after' (视觉下方) -> z-index 更小 -> children 数组中在 target 前面
   */
  reorderLayer(dragId, targetId, position) {
    const dragLayer = this.app.tree.findOne((child) => child.innerId === dragId)
    const targetLayer = this.app.tree.findOne((child) => child.innerId === targetId)

    if (dragLayer && targetLayer && dragLayer !== targetLayer) {
      // 先移除拖拽元素
      dragLayer.remove()

      // 获取目标元素在当前 children 中的索引
      // 注意：remove() 之后，索引可能会变，所以要在 remove 之后再次确认 target 的索引
      // 或者使用 addBefore / addAfter (如果 Leafer 支持)
      // 假设 Leafer 的 Group 支持 addAt 或者 addAfter/addBefore
      // 查看 Leafer 文档或源码，通常有 add(child, index) 或者直接操作 list

      // 尝试使用 children 数组操作
      const children = this.app.tree.children
      const targetIndex = children.indexOf(targetLayer)

      if (targetIndex !== -1) {
        if (position === 'before') {
          // 视觉上方 -> z-index 更大 -> 插入到 target 后面
          this.app.tree.add(dragLayer, targetIndex + 1)
        } else {
          // 视觉下方 -> z-index 更小 -> 插入到 target 前面
          this.app.tree.add(dragLayer, targetIndex)
        }
      } else {
        // 如果找不到目标（异常情况），直接添加到最后（最顶层）
        this.app.tree.add(dragLayer)
      }

      // 触发同步
      this.syncLayers()
    }
  }
}
