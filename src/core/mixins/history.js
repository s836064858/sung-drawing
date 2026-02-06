export const historyMixin = {
  initHistory() {
    this.historyStack = []
    this.historyIndex = -1
    this.maxHistorySteps = 50
    this.isUndoingRedoing = false

    // 创建防抖版本的 recordState
    this.debouncedRecordState = this.debounce(this.recordState, 500)

    // 延迟记录初始状态，确保初始化完成
    setTimeout(() => {
      this.recordState('init')
    }, 100)
  },

  /**
   * 防抖函数
   */
  debounce(fn, delay) {
    let timer = null
    return function (...args) {
      if (timer) clearTimeout(timer)
      timer = setTimeout(() => {
        fn.apply(this, args)
      }, delay)
    }
  },

  /**
   * 记录当前状态
   * @param {string} tag 操作标签
   */
  recordState(tag = 'unknown') {
    if (this.isUndoingRedoing) return
    if (!this.app || !this.app.tree) return

    // 如果当前处于历史中间，且有了新操作，则丢弃当前位置之后的历史
    if (this.historyIndex < this.historyStack.length - 1) {
      this.historyStack = this.historyStack.slice(0, this.historyIndex + 1)
    }

    // 保存快照
    const snapshot = this.app.tree.toJSON()

    this.historyStack.push({
      tag,
      timestamp: Date.now(),
      data: snapshot
    })

    // 限制历史记录长度
    if (this.historyStack.length > this.maxHistorySteps) {
      this.historyStack.shift()
      // 移除头部后，当前索引需要减1保持指向正确
      // 但因为我们通常是在 push 之后才更新 index 为 length-1
      // 所以这里不需要手动减 index，因为下面会直接设置为 length - 1
    }

    this.historyIndex = this.historyStack.length - 1

    this.syncHistoryState()

    console.log(`[History] Recorded: ${tag}, Stack: ${this.historyStack.length}, Index: ${this.historyIndex}`)
  },

  /**
   * 撤销
   */
  undo() {
    if (this.historyIndex <= 0) return

    this.isUndoingRedoing = true
    this.historyIndex--
    const state = this.historyStack[this.historyIndex]
    this.restoreState(state.data)
    this.isUndoingRedoing = false

    this.syncHistoryState()

    console.log(`[History] Undo to Index: ${this.historyIndex}`)
  },

  /**
   * 恢复
   */
  redo() {
    if (this.historyIndex >= this.historyStack.length - 1) return

    this.isUndoingRedoing = true
    this.historyIndex++
    const state = this.historyStack[this.historyIndex]
    this.restoreState(state.data)
    this.isUndoingRedoing = false

    this.syncHistoryState()

    console.log(`[History] Redo to Index: ${this.historyIndex}`)
  },

  /**
   * 同步历史记录状态到外部
   */
  syncHistoryState() {
    if (!this.callbacks.onHistoryChange) return

    this.callbacks.onHistoryChange({
      canUndo: this.historyIndex > 0,
      canRedo: this.historyIndex < this.historyStack.length - 1,
      historyIndex: this.historyIndex,
      historyLength: this.historyStack.length
    })
  },

  /**
   * 修复恢复后的内部元素状态
   * 历史记录恢复时，isInternal 属性可能丢失，需要重新标记
   */
  fixInternalElements(parent) {
    if (!parent.children) return

    parent.children.forEach((child) => {
      // 识别 Frame 标签
      // 1. 检查 data 标记 (新数据)
      // 2. 检查特征 (旧数据兼容)
      const isFrameLabel =
        (child.data && child.data.isFrameLabel) ||
        (child.tag === 'Text' &&
          parent.tag === 'Frame' &&
          child.y === -20 &&
          child.editable === false &&
          child.hittable === false)

      if (isFrameLabel) {
        child.isInternal = true
      }

      // 递归处理
      if (child.children) {
        this.fixInternalElements(child)
      }
    })
  },

  /**
   * 恢复状态数据到画布
   */
  restoreState(json) {
    if (!this.app || !this.app.tree) return

    // 清空当前画布
    this.app.tree.removeAll()

    // 重新添加保存的元素
    // 注意：toJSON 出来的是 children 数组还是对象？
    // Leafer 的 toJSON 通常返回 { tag: 'App', children: [...] } 或类似结构
    // 如果是 tree.toJSON()，它可能包含自身属性。
    // 如果我们保存的是 tree 的 json，我们需要小心结构。

    // 如果 json 是 { tag: 'Group', children: [...] } (tree 也是个 Group/Frame)
    if (json.children) {
      json.children.forEach((child) => {
        this.app.tree.add(child)
      })
    }

    // 修复内部元素状态（如 Frame 的标签）
    this.fixInternalElements(this.app.tree)

    // 恢复后同步图层面板
    this.syncLayers()

    // 清除选择框（避免引用已删除的元素）
    if (this.app.editor) {
      this.app.editor.cancel()
    }
  }
}
