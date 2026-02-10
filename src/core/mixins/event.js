import { ChildEvent, PropertyEvent, PointerEvent, Polygon, DragEvent, RotateEvent, ResizeEvent } from 'leafer-ui'
import { EditorEvent } from '@leafer-in/editor'
import { isContainerTag } from '../constants/element-types'

// 用 WeakMap 存储 Frame 原始样式，避免污染元素属性
const frameOriginalStyles = new WeakMap()

export const eventMixin = {
  initEvents() {
    const { tree, editor } = this.app

    // 绑定事件处理器
    this.eventHandlers.keydown = this.handleKeydown.bind(this)
    this.eventHandlers.paste = this.handlePaste.bind(this)
    this.eventHandlers.dragover = this.handleDragOver.bind(this)
    this.eventHandlers.drop = this.handleDrop.bind(this)

    // 全局事件监听
    window.addEventListener('keydown', this.eventHandlers.keydown)
    window.addEventListener('paste', this.eventHandlers.paste)

    // 画布拖拽事件
    if (this.app.view) {
      this.app.view.addEventListener('dragover', this.eventHandlers.dragover)
      this.app.view.addEventListener('drop', this.eventHandlers.drop)
    }

    this.initLeaferEvents(tree, editor)
  },

  /**
   * 销毁事件监听，防止内存泄漏
   */
  destroyEvents() {
    const { keydown, paste, dragover, drop } = this.eventHandlers
    if (keydown) window.removeEventListener('keydown', keydown)
    if (paste) window.removeEventListener('paste', paste)

    if (this.app?.view) {
      if (dragover) this.app.view.removeEventListener('dragover', dragover)
      if (drop) this.app.view.removeEventListener('drop', drop)
    }

    this.eventHandlers = {}
  },

  initLeaferEvents(tree, editor) {
    // 监听元素添加/移除
    tree.on([ChildEvent.ADD, ChildEvent.REMOVE], () => {
      this.syncLayers()
    })

    // 监听属性变化
    const relevantProps = new Set(['visible', 'locked', 'name', 'tag', 'zIndex', 'text'])
    tree.on(PropertyEvent.CHANGE, (e) => {
      if (relevantProps.has(e.attrName)) {
        this.syncLayers()
      }
    })

    // 监听选中变化
    editor.on(EditorEvent.SELECT, () => {
      this.syncSelection()
    })

    // 监听变换结束（移动、旋转、缩放）
    editor.on([DragEvent.END, RotateEvent.END, ResizeEvent.END], () => {
      this.recordState('transform')
    })

    // 拖拽结束时检查 Frame 交叉（替代 PointerEvent.UP + setTimeout）
    editor.on(DragEvent.END, () => {
      this.checkFrameIntersection()
    })

    // 画布交互事件
    this.app.on(PointerEvent.TAP, this.handleTap.bind(this))
    this.app.on(PointerEvent.DOWN, this.handlePointerDown.bind(this))
    this.app.on(PointerEvent.MOVE, this.handlePointerMove.bind(this))
    this.app.on(PointerEvent.UP, this.handlePointerUp.bind(this))
    this.app.on(PointerEvent.MOVE, this.updateFrameHighlight.bind(this))

    // 监听画布元素悬浮事件，高亮对应图层
    tree.on(PointerEvent.ENTER, this.handleElementHoverStart.bind(this), { capture: false })
    tree.on(PointerEvent.LEAVE, this.handleElementHoverEnd.bind(this), { capture: false })
  },

  /**
   * 检查是否在可编辑元素中
   */
  isEditableElement(target) {
    return target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable
  },

  /**
   * 获取当前画布缩放比例
   */
  getScale() {
    return this.app.tree.scaleX || 1
  },

  /**
   * 获取缩放感知的距离阈值
   * @param {number} basePx 基准像素值（在 1x 缩放下的值）
   */
  getScaledThreshold(basePx) {
    return basePx / this.getScale()
  },

  /**
   * 获取元素的世界坐标
   */
  getElementWorldPosition(element) {
    if (element.worldTransform) {
      return {
        x: element.worldTransform.e,
        y: element.worldTransform.f
      }
    }

    const x = element.x || 0
    const y = element.y || 0

    if (element.parent && isContainerTag(element.parent.tag)) {
      return {
        x: x + (element.parent.x || 0),
        y: y + (element.parent.y || 0)
      }
    }

    return { x, y }
  },

  /**
   * 获取元素的尺寸
   */
  getElementSize(element) {
    if (element.worldBoxBounds) {
      return {
        width: element.worldBoxBounds.width,
        height: element.worldBoxBounds.height
      }
    }
    return {
      width: element.width || 0,
      height: element.height || 0
    }
  },

  /**
   * 获取元素中心点的世界坐标
   */
  getElementWorldCenter(element) {
    if (element.worldBoxBounds) {
      return {
        x: element.worldBoxBounds.x + element.worldBoxBounds.width / 2,
        y: element.worldBoxBounds.y + element.worldBoxBounds.height / 2
      }
    }

    const { x, y } = this.getElementWorldPosition(element)
    const { width, height } = this.getElementSize(element)

    return {
      x: x + width / 2,
      y: y + height / 2
    }
  },

  /**
   * 检查点是否在矩形内
   */
  isPointInRect(pointX, pointY, rectX, rectY, rectWidth, rectHeight) {
    return pointX >= rectX && pointX <= rectX + rectWidth && pointY >= rectY && pointY <= rectY + rectHeight
  },

  /**
   * 查找包含指定点的容器（Frame/Box）
   * 递归查找并按层级优先返回最内层的容器
   * 排除被拖拽元素自身及其后代，防止循环嵌套
   */
  findFrameAtPoint(x, y, excludeElement = null) {
    const findInChildren = (children) => {
      // 倒序遍历，优先匹配 zIndex 更高（后添加）的容器
      for (let i = children.length - 1; i >= 0; i--) {
        const child = children[i]
        if (!isContainerTag(child.tag)) continue
        if (child === excludeElement) continue
        if (excludeElement && this._isDescendantOf(child, excludeElement)) continue

        const frameX = child.x || 0
        const frameY = child.y || 0
        const frameWidth = child.width || 0
        const frameHeight = child.height || 0

        if (frameWidth === 0 || frameHeight === 0) continue

        if (this.isPointInRect(x, y, frameX, frameY, frameWidth, frameHeight)) {
          // 递归查找内层容器
          if (child.children && child.children.length > 0) {
            // 将坐标转换为子容器的本地坐标
            const localX = x - frameX
            const localY = y - frameY
            const innerFrame = findInChildren(child.children)
            if (innerFrame) {
              // 内层容器的坐标需要用本地坐标重新检查
              const innerX = innerFrame.x || 0
              const innerY = innerFrame.y || 0
              const innerW = innerFrame.width || 0
              const innerH = innerFrame.height || 0
              if (this.isPointInRect(localX, localY, innerX, innerY, innerW, innerH)) {
                return innerFrame
              }
            }
          }
          return child
        }
      }
      return null
    }

    return findInChildren(this.app.tree.children)
  },

  /**
   * 判断 target 是否是 ancestor 的后代
   */
  _isDescendantOf(target, ancestor) {
    let node = target
    while (node) {
      if (node === ancestor) return true
      node = node.parent
    }
    return false
  },

  /**
   * 检查剪贴板是否有图层数据
   */
  hasClipboardLayers() {
    return this.clipboard && this.clipboard.length > 0
  },

  /**
   * 处理粘贴事件（支持粘贴图片和图层）
   * 优先级：图片 > 图层
   */
  handlePaste(e) {
    if (this.isEditableElement(e.target)) return

    const items = e.clipboardData?.items

    if (!items) {
      if (this.hasClipboardLayers()) {
        this.pasteLayer()
        e.preventDefault()
      }
      return
    }

    // 优先检查是否有图片
    if (this.tryPasteImage(items)) {
      e.preventDefault()
      return
    }

    if (this.hasClipboardLayers()) {
      this.pasteLayer()
      e.preventDefault()
    }
  },

  /**
   * 尝试从剪贴板粘贴图片
   * @returns {boolean} 是否成功粘贴图片
   */
  tryPasteImage(items) {
    for (const item of items) {
      if (item.type.startsWith('image/')) {
        const blob = item.getAsFile()
        if (blob) {
          const url = URL.createObjectURL(blob)
          this.addImage(url)
          return true
        }
      }
    }
    return false
  },

  handleDragOver(e) {
    e.preventDefault()
  },

  /**
   * 处理拖拽文件到画布
   */
  handleDrop(e) {
    e.preventDefault()

    // 1. 尝试处理 JSON 数据（来自资源面板）
    const jsonData = e.dataTransfer?.getData('application/json')
    if (jsonData) {
      try {
        const item = JSON.parse(jsonData)
        const point = this.app.tree.getInnerPoint({ x: e.offsetX, y: e.offsetY })
        this.addLayerFromResource(item, point.x, point.y)
        return
      } catch (err) {
        console.error('Failed to parse dropped JSON', err)
      }
    }

    // 2. 处理文件（图片等）
    const items = e.dataTransfer?.items
    if (!items) return

    for (const item of items) {
      if (item.kind === 'file' && item.type.startsWith('image/')) {
        const file = item.getAsFile()
        if (file) {
          const url = URL.createObjectURL(file)
          const point = this.app.tree.getInnerPoint({ x: e.offsetX, y: e.offsetY })
          this.addImage(url, { x: point.x, y: point.y })
        }
      }
    }
  },

  /**
   * 处理点击事件（文字模式）
   */
  handleTap(e) {
    if (this.mode !== 'text') return

    this.app.tree.hitChildren = true

    const { x, y } = this.app.tree.getInnerPoint(e)
    this.addText(x, y)
    this.setMode('select')
  },

  /**
   * 处理鼠标按下（开始绘制形状）
   */
  handlePointerDown(e) {
    const drawingModes = ['rect', 'ellipse', 'diamond', 'frame', 'line', 'arrow', 'pen']
    if (!drawingModes.includes(this.mode)) return

    this.app.editor.cancel()
    this.isDrawing = true

    const { x, y } = this.app.tree.getInnerPoint(e)
    this.startPoint = { x, y }
    this.currentDrawingShape = this.createShape(this.mode, x, y)
  },

  /**
   * 处理鼠标移动（绘制形状过程）
   */
  handlePointerMove(e) {
    if (!this.isDrawing || !this.currentDrawingShape) return

    const { x: currentX, y: currentY } = this.app.tree.getInnerPoint(e)
    const { x: startX, y: startY } = this.startPoint

    // 钢笔的绘制（自由绘制）
    if (this.mode === 'pen') {
      const points = this.currentDrawingShape.points
      if (points.length >= 2) {
        const lastX = points[points.length - 2]
        const lastY = points[points.length - 1]
        const dist = Math.sqrt((currentX - lastX) ** 2 + (currentY - lastY) ** 2)
        // 缩放感知：基准 2px 在当前缩放下的等效距离
        if (dist < this.getScaledThreshold(2)) return
      }

      this.currentDrawingShape.set({
        points: [...points, currentX, currentY]
      })
      return
    }

    // 直线的绘制
    if (this.mode === 'line' || this.mode === 'arrow') {
      this.currentDrawingShape.set({
        points: [startX, startY, currentX, currentY]
      })
      return
    }

    const width = Math.abs(currentX - startX)
    const height = Math.abs(currentY - startY)
    const x = Math.min(currentX, startX)
    const y = Math.min(currentY, startY)

    if (this.mode === 'diamond') {
      this.currentDrawingShape.set({
        x,
        y,
        width,
        height,
        points: [width / 2, 0, width, height / 2, width / 2, height, 0, height / 2]
      })
    } else {
      this.currentDrawingShape.set({ x, y, width, height })
    }
  },

  /**
   * 处理鼠标释放（完成绘制）
   */
  handlePointerUp() {
    if (!this.isDrawing) return

    this.isDrawing = false
    this.app.tree.hitChildren = true
    this.resetPasteOffset()

    if (this.currentDrawingShape) {
      this._finalizeDrawing()
    }

    this.currentDrawingShape = null
    this.startPoint = null
    this.setMode('select')
    this.clearFrameHighlight()
  },

  /**
   * 完成绘制：根据模式分发到对应的验证逻辑
   */
  _finalizeDrawing() {
    const shape = this.currentDrawingShape
    const minSize = this.getScaledThreshold(5)

    if (this.mode === 'pen') {
      this._finalizePenDrawing(shape)
    } else if (this.mode === 'line') {
      this._finalizeLineDrawing(shape, minSize)
    } else if (this.mode === 'arrow') {
      this._finalizeArrowDrawing(shape, minSize)
    } else {
      this._finalizeShapeDrawing(shape, minSize)
    }
  },

  /**
   * 完成钢笔绘制
   */
  _finalizePenDrawing(shape) {
    const points = shape.points
    if (points.length < 6) {
      // 至少 3 个点才算有效线条
      shape.remove()
      return
    }

    const startX = points[0]
    const startY = points[1]
    const endX = points[points.length - 2]
    const endY = points[points.length - 1]
    const dist = Math.sqrt((endX - startX) ** 2 + (endY - startY) ** 2)

    // 缩放感知的闭合阈值
    const closeThreshold = this.getScaledThreshold(20)

    if (dist < closeThreshold) {
      // 闭合为自定义图形：修剪尾部距离起点过近的点
      let prunedPoints = [...points]
      while (prunedPoints.length > 6) {
        const lastX = prunedPoints[prunedPoints.length - 2]
        const lastY = prunedPoints[prunedPoints.length - 1]
        const d = Math.sqrt((lastX - startX) ** 2 + (lastY - startY) ** 2)
        if (d < closeThreshold) {
          prunedPoints.pop()
          prunedPoints.pop()
        } else {
          break
        }
      }

      const polygon = new Polygon({
        points: prunedPoints,
        fill: '#32cd79',
        editable: true,
        draggable: true,
        name: '自定义图形'
      })
      if (polygon.innerId) {
        polygon.name = `自定义图形 ${polygon.innerId}`
      }
      shape.remove()
      this.app.tree.add(polygon)
      this.app.editor.select(polygon)
      this.recordState('create-polygon')
    } else {
      this.app.editor.select(shape)
      this.recordState('create-pen')
    }
  },

  /**
   * 完成直线绘制
   */
  _finalizeLineDrawing(shape, minSize) {
    const points = shape.points
    const dx = points[2] - points[0]
    const dy = points[3] - points[1]
    const length = Math.sqrt(dx * dx + dy * dy)

    if (length < minSize) {
      shape.remove()
    } else {
      this.app.editor.select(shape)
      this.recordState('create-line')
    }
  },

  /**
   * 完成箭头绘制
   */
  _finalizeArrowDrawing(shape, minSize) {
    const toPoint = shape.toPoint
    const dx = toPoint.x - shape.x
    const dy = toPoint.y - shape.y
    const length = Math.sqrt(dx * dx + dy * dy)

    if (length < minSize) {
      shape.remove()
    } else {
      this.app.editor.select(shape)
      this.recordState('create-arrow')
    }
  },

  /**
   * 完成矩形/圆形/菱形/Frame 绘制
   */
  _finalizeShapeDrawing(shape, minSize) {
    const { width, height } = shape

    if (width < minSize || height < minSize) {
      shape.remove()
    } else {
      this.app.editor.select(shape)
      this.recordState('create-shape')
    }
  },

  /**
   * 实时更新 Frame 高亮状态（拖拽过程中）
   */
  updateFrameHighlight() {
    if (this.mode !== 'select') return

    const selectedElements = this.app.editor.list
    if (!selectedElements || selectedElements.length !== 1) {
      this.clearFrameHighlight()
      return
    }

    const draggedElement = selectedElements[0]
    if (!draggedElement || !this.app.editor.dragging) {
      this.clearFrameHighlight()
      return
    }

    const { width, height } = this.getElementSize(draggedElement)
    if (width === 0 || height === 0) {
      this.clearFrameHighlight()
      return
    }

    const { x: centerX, y: centerY } = this.getElementWorldCenter(draggedElement)
    const targetFrame = this.findFrameAtPoint(centerX, centerY, draggedElement)

    if (targetFrame !== this.highlightedFrame) {
      this.clearFrameHighlight()
      if (targetFrame) {
        this.highlightFrame(targetFrame)
      }
    }
  },

  /**
   * 高亮 Frame（显示蓝色边框），用 WeakMap 存储原始样式
   */
  highlightFrame(frame) {
    this.highlightedFrame = frame

    if (!frameOriginalStyles.has(frame)) {
      frameOriginalStyles.set(frame, {
        stroke: frame.stroke,
        strokeWidth: frame.strokeWidth
      })
    }

    frame.stroke = '#409EFF'
    frame.strokeWidth = 2
  },

  /**
   * 清除 Frame 高亮，从 WeakMap 恢复原始样式
   */
  clearFrameHighlight() {
    if (this.highlightedFrame) {
      const original = frameOriginalStyles.get(this.highlightedFrame)
      if (original) {
        this.highlightedFrame.stroke = original.stroke
        this.highlightedFrame.strokeWidth = original.strokeWidth
        frameOriginalStyles.delete(this.highlightedFrame)
      }
      this.highlightedFrame = null
    }
  },

  /**
   * 检查元素是否应该移入/移出 Frame
   * 由 DragEvent.END 触发，不再依赖 setTimeout
   */
  checkFrameIntersection() {
    const selectedElements = this.app.editor.list

    if (!selectedElements || selectedElements.length !== 1) return

    const draggedElement = selectedElements[0]
    if (!draggedElement) return

    const { width, height } = this.getElementSize(draggedElement)
    if (width === 0 || height === 0) return

    const { x: worldX, y: worldY } = this.getElementWorldPosition(draggedElement)
    const { x: centerX, y: centerY } = this.getElementWorldCenter(draggedElement)

    const foundFrame = this.findFrameAtPoint(centerX, centerY, draggedElement)

    const currentParent = draggedElement.parent
    const isInFrame = currentParent && isContainerTag(currentParent.tag)

    if (foundFrame) {
      if (isInFrame && currentParent === foundFrame) return

      draggedElement.remove()

      const { x: frameWorldX, y: frameWorldY } = this.getElementWorldPosition(foundFrame)
      draggedElement.x = worldX - frameWorldX
      draggedElement.y = worldY - frameWorldY

      foundFrame.add(draggedElement)
      this.app.editor.select(draggedElement)
      this.syncLayers()
      this.recordState('move-into-frame')
    } else if (isInFrame) {
      draggedElement.remove()

      draggedElement.x = worldX
      draggedElement.y = worldY

      this.app.tree.add(draggedElement)
      this.app.editor.select(draggedElement)
      this.syncLayers()
      this.recordState('move-out-of-frame')
    }

    this.clearFrameHighlight()
  },

  /**
   * 处理画布元素悬浮开始（高亮对应图层）
   */
  handleElementHoverStart(e) {
    const element = e.target
    if (!element || element.isInternal || element === this.app.tree) return
    if (this.isDrawing || this.app.editor.dragging) return

    if (this.callbacks.onLayerHover && element.innerId) {
      this.callbacks.onLayerHover(element.innerId)
    }
  },

  /**
   * 处理画布元素悬浮结束（取消高亮）
   */
  handleElementHoverEnd(e) {
    const element = e.target
    if (!element || element.isInternal || element === this.app.tree) return

    if (this.callbacks.onLayerUnhover && element.innerId) {
      this.callbacks.onLayerUnhover(element.innerId)
    }
  },

  /**
   * 处理键盘事件（复制、粘贴、删除、撤销等）
   */
  handleKeydown(e) {
    if (this.isEditableElement(e.target)) return

    const isMod = e.metaKey || e.ctrlKey

    // 复制: Cmd/Ctrl + C
    if (isMod && e.key === 'c') {
      e.preventDefault()
      this.copySelectedLayers()
      return
    }

    // 快速复制: Cmd/Ctrl + D
    if (isMod && e.key === 'd') {
      e.preventDefault()
      const selected = this.app.editor.list

      if (selected.length === 1) {
        this.duplicateLayer(selected[0].innerId)
      } else if (selected.length > 1) {
        this.copySelectedLayers()
        this.pasteLayer()
      }
      return
    }

    // 撤销/重做: Cmd/Ctrl + Z / Cmd/Ctrl + Shift + Z
    if (isMod && e.key === 'z') {
      e.preventDefault()
      e.shiftKey ? this.redo() : this.undo()
      return
    }

    // 重做: Cmd/Ctrl + Y
    if (isMod && e.key === 'y') {
      e.preventDefault()
      this.redo()
      return
    }

    // 删除: Backspace 或 Delete
    if (e.key === 'Backspace' || e.key === 'Delete') {
      e.preventDefault()
      this.removeSelectedLayers()
      this.recordState('delete')
    }
  }
}
