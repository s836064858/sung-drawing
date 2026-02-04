import { ChildEvent, PropertyEvent, PointerEvent } from 'leafer-ui'
import { EditorEvent } from '@leafer-in/editor'

export const eventMixin = {
  initEvents() {
    const { tree, editor } = this.app

    // 监听键盘事件 (删除)
    // 监听全局 keydown 事件，或者使用 leafer-ui 的 key 插件（如果有）
    // 这里简单使用 window 监听，注意要在 destroy 时移除
    this.__handleKeydown = this.handleKeydown.bind(this)
    window.addEventListener('keydown', this.__handleKeydown)

    // 监听元素添加/移除
    tree.on([ChildEvent.ADD, ChildEvent.REMOVE], () => {
      this.syncLayers()
    })

    // 监听属性变化 (例如 visible, lock, name 等)
    // 注意：监听所有 PropertyEvent 可能会有性能影响，实际项目中需按需监听或防抖
    tree.on(PropertyEvent.CHANGE, (e) => {
      // 过滤掉不影响图层列表的属性变化
      const relevantProps = ['visible', 'locked', 'name', 'tag', 'zIndex', 'text']
      if (relevantProps.includes(e.attrName)) {
        this.syncLayers()
      }
    })

    // 监听选中变化
    editor.on(EditorEvent.SELECT, () => {
      this.syncSelection()
    })

    // 监听画布点击（用于放置元素）
    this.app.on(PointerEvent.TAP, this.handleTap.bind(this))

    // 监听拖拽绘制（用于矩形等）
    this.app.on(PointerEvent.DOWN, this.handlePointerDown.bind(this))
    this.app.on(PointerEvent.MOVE, this.handlePointerMove.bind(this))
    this.app.on(PointerEvent.UP, this.handlePointerUp.bind(this))

    // 监听粘贴事件
    this.__handlePaste = this.handlePaste.bind(this)
    window.addEventListener('paste', this.__handlePaste)

    // 监听拖拽上传
    if (this.app.view) {
      this.__handleDragOver = this.handleDragOver.bind(this)
      this.__handleDrop = this.handleDrop.bind(this)
      this.app.view.addEventListener('dragover', this.__handleDragOver)
      this.app.view.addEventListener('drop', this.__handleDrop)
    }
  },

  handlePaste(e) {
    // 忽略输入框中的粘贴
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.isContentEditable) return

    const items = e.clipboardData && e.clipboardData.items
    if (items) {
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
          const blob = items[i].getAsFile()
          const url = URL.createObjectURL(blob)
          this.addImage(url)
          e.preventDefault()
          break
        }
      }
    }
  },

  handleDragOver(e) {
    e.preventDefault()
  },

  handleDrop(e) {
    e.preventDefault()
    if (e.dataTransfer.items) {
      for (let i = 0; i < e.dataTransfer.items.length; i++) {
        if (e.dataTransfer.items[i].kind === 'file' && e.dataTransfer.items[i].type.match('^image/')) {
          const file = e.dataTransfer.items[i].getAsFile()
          const url = URL.createObjectURL(file)
          // 简单处理坐标，默认放置在鼠标位置附近（相对于画布视口）
          // 由于坐标转换比较复杂，这里暂使用 offset，后续可优化为 screenToWorld
          this.addImage(url, { x: e.offsetX, y: e.offsetY })
        }
      }
    }
  },

  handleTap(e) {
    // 如果是文本模式，点击添加文本
    if (this.mode === 'text') {
      // 获取点击坐标并转换为 tree 内部坐标
      const { x, y } = this.app.tree.getInnerPoint(e)
      this.addText(x, y)

      // 添加完后切换回选择模式
      this.setMode('select')
    }
  },

  handlePointerDown(e) {
    if (['rect', 'ellipse', 'diamond'].includes(this.mode)) {
      // 禁用编辑器，避免干扰
      this.app.editor.cancel()

      this.isDrawing = true
      // 转换为 tree 内部坐标
      const { x, y } = this.app.tree.getInnerPoint(e)
      this.startPoint = { x, y }

      // 创建形状
      this.currentDrawingShape = this.createShape(this.mode, x, y)
    }
  },

  handlePointerMove(e) {
    if (this.isDrawing && this.currentDrawingShape) {
      // 转换为 tree 内部坐标
      const point = this.app.tree.getInnerPoint(e)
      const currentX = point.x
      const currentY = point.y

      // 计算新的位置和尺寸
      const width = Math.abs(currentX - this.startPoint.x)
      const height = Math.abs(currentY - this.startPoint.y)
      const x = Math.min(currentX, this.startPoint.x)
      const y = Math.min(currentY, this.startPoint.y)

      if (this.mode === 'diamond') {
        // 更新菱形：需要更新 x, y, width, height 以便正确包围，同时更新 points
        // 菱形的四个顶点相对于 (0,0) 的宽高：(w/2, 0), (w, h/2), (w/2, h), (0, h/2)
        // Polygon 的 points 是相对于自身的
        this.currentDrawingShape.set({
          x,
          y,
          width,
          height,
          points: [width / 2, 0, width, height / 2, width / 2, height, 0, height / 2]
        })
      } else {
        // 矩形和圆形
        this.currentDrawingShape.set({ x, y, width, height })
      }
    }
  },

  handlePointerUp(e) {
    if (this.isDrawing) {
      this.isDrawing = false

      if (this.currentDrawingShape) {
        // 如果图形太小，视为无效操作，移除它
        if (this.currentDrawingShape.width < 5 || this.currentDrawingShape.height < 5) {
          this.currentDrawingShape.remove()
        } else {
          // 选中新绘制的图形
          this.app.editor.select(this.currentDrawingShape)
        }
      }

      this.currentDrawingShape = null
      this.startPoint = null

      // 绘制完成后切回选择模式
      this.setMode('select')
    }
  },

  handleKeydown(e) {
    // 按下 Backspace 或 Delete 键
    if (e.key === 'Backspace' || e.key === 'Delete') {
      // 确保没有在输入框中
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.isContentEditable) return

      this.removeSelectedLayers()
    }
  }
}
