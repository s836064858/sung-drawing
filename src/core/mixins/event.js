import { ChildEvent, PropertyEvent, PointerEvent, Polygon, DragEvent, RotateEvent, ResizeEvent } from 'leafer-ui'
import { EditorEvent } from '@leafer-in/editor'
import { isContainerTag } from '../constants/element-types'

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

    // 画布交互事件
    this.app.on(PointerEvent.TAP, this.handleTap.bind(this))
    this.app.on(PointerEvent.DOWN, this.handlePointerDown.bind(this))
    this.app.on(PointerEvent.MOVE, this.handlePointerMove.bind(this))
    this.app.on(PointerEvent.UP, this.handlePointerUp.bind(this))
    this.app.on(PointerEvent.UP, this.checkFrameIntersection.bind(this))
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

    // 如果元素在容器内，需要加上容器的坐标
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
   * 排除被拖拽元素自身及其后代，防止循环嵌套
   */
  findFrameAtPoint(x, y, excludeElement = null) {
    const containers = this.app.tree.children.filter((child) => isContainerTag(child.tag))

    for (const frame of containers) {
      if (frame === excludeElement) continue

      // 防止将容器拖入自己的后代
      if (excludeElement && this._isDescendantOf(frame, excludeElement)) continue

      const frameX = frame.x || 0
      const frameY = frame.y || 0
      const frameWidth = frame.width || 0
      const frameHeight = frame.height || 0

      if (frameWidth === 0 || frameHeight === 0) continue

      if (this.isPointInRect(x, y, frameX, frameY, frameWidth, frameHeight)) {
        return frame
      }
    }

    return null
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
   * 处理粘贴事件（支持粘贴图片和图层）
   * 优先级：图片 > 图层
   */
  handlePaste(e) {
    if (this.isEditableElement(e.target)) return

    const items = e.clipboardData?.items

    // 如果没有剪贴板项，尝试粘贴图层
    if (!items) {
      if (this.clipboard && this.clipboard.length > 0) {
        this.pasteLayer()
        e.preventDefault()
      }
      return
    }

    // 优先检查是否有图片
    const hasImage = this.tryPasteImage(items)

    if (hasImage) {
      e.preventDefault()
      return
    }

    // 如果没有图片，尝试粘贴图层
    if (this.clipboard && this.clipboard.length > 0) {
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

    // 恢复交互能力
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
      // 简单平滑处理：如果新点距离上一个点太近（< 2px），则忽略
      if (points.length >= 2) {
        const lastX = points[points.length - 2]
        const lastY = points[points.length - 1]
        const dist = Math.sqrt((currentX - lastX) ** 2 + (currentY - lastY) ** 2)
        if (dist < 2) return
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
      // 菱形的四个顶点
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
    // 恢复交互能力，防止 editor.select 出错
    this.app.tree.hitChildren = true

    const minSize = 5

    // 重置粘贴偏移计数器
    this.resetPasteOffset()

    if (this.currentDrawingShape) {
      // 钢笔的验证
      if (this.mode === 'pen') {
        const points = this.currentDrawingShape.points
        if (points.length < 6) {
          // 至少3个点才算有效线条
          this.currentDrawingShape.remove()
        } else {
          const startX = points[0]
          const startY = points[1]
          const endX = points[points.length - 2]
          const endY = points[points.length - 1]

          const dx = endX - startX
          const dy = endY - startY
          const dist = Math.sqrt(dx * dx + dy * dy)

          // 如果起点和终点距离小于 20，则闭合为自定义图形
          if (dist < 20) {
            // 闭合优化：从尾部开始修剪掉所有距离起点 < 20 的点
            // 这样可以去除为了闭合而画的多余笔迹，使闭合更自然
            let prunedPoints = [...points]

            // 至少保留前3个点（6个坐标）
            while (prunedPoints.length > 6) {
              const lastX = prunedPoints[prunedPoints.length - 2]
              const lastY = prunedPoints[prunedPoints.length - 1]
              const d = Math.sqrt((lastX - startX) ** 2 + (lastY - startY) ** 2)

              if (d < 20) {
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
            this.currentDrawingShape.remove()
            this.app.tree.add(polygon)
            this.app.editor.select(polygon)
            this.recordState('create-polygon')
          } else {
            this.app.editor.select(this.currentDrawingShape)
            this.recordState('create-pen')
          }
        }
      } else if (this.mode === 'line') {
        // 直线的验证
        const points = this.currentDrawingShape.points
        const dx = points[2] - points[0]
        const dy = points[3] - points[1]
        const length = Math.sqrt(dx * dx + dy * dy)

        if (length < minSize) {
          this.currentDrawingShape.remove()
        } else {
          this.app.editor.select(this.currentDrawingShape)
          this.recordState('create-line')
        }
      } else if (this.mode === 'arrow') {
        // 箭头的验证
        const toPoint = this.currentDrawingShape.toPoint
        const dx = toPoint.x - this.currentDrawingShape.x
        const dy = toPoint.y - this.currentDrawingShape.y
        const length = Math.sqrt(dx * dx + dy * dy)

        if (length < minSize) {
          this.currentDrawingShape.remove()
        } else {
          this.app.editor.select(this.currentDrawingShape)
          this.recordState('create-arrow')
        }
      } else {
        const { width, height } = this.currentDrawingShape

        if (width < minSize || height < minSize) {
          this.currentDrawingShape.remove()
        } else {
          this.app.editor.select(this.currentDrawingShape)
          this.recordState('create-shape')
        }
      }
    }

    this.currentDrawingShape = null
    this.startPoint = null
    this.setMode('select')
    this.clearFrameHighlight()
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

    // 更新高亮状态
    if (targetFrame !== this.highlightedFrame) {
      this.clearFrameHighlight()
      if (targetFrame) {
        this.highlightFrame(targetFrame)
      }
    }
  },

  /**
   * 高亮 Frame（显示蓝色边框）
   */
  highlightFrame(frame) {
    this.highlightedFrame = frame

    if (!frame.__originalStroke) {
      frame.__originalStroke = frame.stroke
      frame.__originalStrokeWidth = frame.strokeWidth
    }

    frame.stroke = '#409EFF'
    frame.strokeWidth = 2
  },

  /**
   * 清除 Frame 高亮
   */
  clearFrameHighlight() {
    if (this.highlightedFrame) {
      if (this.highlightedFrame.__originalStroke !== undefined) {
        this.highlightedFrame.stroke = this.highlightedFrame.__originalStroke
        this.highlightedFrame.strokeWidth = this.highlightedFrame.__originalStrokeWidth
        delete this.highlightedFrame.__originalStroke
        delete this.highlightedFrame.__originalStrokeWidth
      }

      this.highlightedFrame = null
    }
  },

  /**
   * 检查元素是否应该移入/移出 Frame
   */
  checkFrameIntersection() {
    setTimeout(() => {
      const selectedElements = this.app.editor.list

      if (!selectedElements || selectedElements.length !== 1) return

      const draggedElement = selectedElements[0]

      if (!draggedElement) return

      const { width, height } = this.getElementSize(draggedElement)
      if (width === 0 || height === 0) return

      const { x: worldX, y: worldY } = this.getElementWorldPosition(draggedElement)
      const { x: centerX, y: centerY } = this.getElementWorldCenter(draggedElement)

      // 查找目标 Frame
      const foundFrame = this.findFrameAtPoint(centerX, centerY, draggedElement)

      const currentParent = draggedElement.parent
      const isInFrame = currentParent && isContainerTag(currentParent.tag)

      if (foundFrame) {
        // 元素应该在 Frame 内
        if (isInFrame && currentParent === foundFrame) return

        draggedElement.remove()

        // 计算相对于 Frame 的本地坐标
        const { x: frameWorldX, y: frameWorldY } = this.getElementWorldPosition(foundFrame)
        const localX = worldX - frameWorldX
        const localY = worldY - frameWorldY

        draggedElement.x = localX
        draggedElement.y = localY

        foundFrame.add(draggedElement)
        this.app.editor.select(draggedElement)
        this.syncLayers()
        this.recordState('move-into-frame')
      } else if (isInFrame) {
        // 元素应该移出 Frame
        draggedElement.remove()

        draggedElement.x = worldX
        draggedElement.y = worldY

        this.app.tree.add(draggedElement)
        this.app.editor.select(draggedElement)
        this.syncLayers()
        this.recordState('move-out-of-frame')
      }

      this.clearFrameHighlight()
    }, 100)
  },

  /**
   * 处理画布元素悬浮开始（高亮对应图层）
   */
  handleElementHoverStart(e) {
    const element = e.target

    // 忽略内部元素和画布本身
    if (!element || element.isInternal || element === this.app.tree) return

    // 如果正在绘制或拖拽，不触发高亮
    if (this.isDrawing || this.app.editor.dragging) return

    // 通知外部高亮图层
    if (this.callbacks.onLayerHover && element.innerId) {
      this.callbacks.onLayerHover(element.innerId)
    }
  },

  /**
   * 处理画布元素悬浮结束（取消高亮）
   */
  handleElementHoverEnd(e) {
    const element = e.target

    // 忽略内部元素和画布本身
    if (!element || element.isInternal || element === this.app.tree) return

    // 通知外部取消高亮
    if (this.callbacks.onLayerUnhover && element.innerId) {
      this.callbacks.onLayerUnhover(element.innerId)
    }
  },

  /**
   * 处理键盘事件（复制、粘贴、删除、撤销等）
   */
  handleKeydown(e) {
    if (this.isEditableElement(e.target)) return

    const isMod = e.metaKey || e.ctrlKey // Cmd(Mac) 或 Ctrl(Win/Linux)

    // 复制快捷键: Cmd/Ctrl + C
    if (isMod && e.key === 'c') {
      e.preventDefault()
      this.copySelectedLayers()
      return
    }

    // 快速复制快捷键: Cmd/Ctrl + D
    if (isMod && e.key === 'd') {
      e.preventDefault()
      const selected = this.app.editor.list

      if (selected.length === 1) {
        // 单选：直接复制该图层
        this.duplicateLayer(selected[0].innerId)
      } else if (selected.length > 1) {
        // 多选：使用复制粘贴
        this.copySelectedLayers()
        this.pasteLayer()
      }
      return
    }

    // 撤销快捷键: Cmd/Ctrl + Z
    if (isMod && e.key === 'z') {
      e.preventDefault()
      if (e.shiftKey) {
        // Cmd/Ctrl + Shift + Z: 重做
        this.redo()
      } else {
        // Cmd/Ctrl + Z: 撤销
        this.undo()
      }
      return
    }

    // 重做快捷键: Cmd/Ctrl + Y
    if (isMod && e.key === 'y') {
      e.preventDefault()
      this.redo()
      return
    }

    // 删除快捷键: Backspace 或 Delete
    if (e.key === 'Backspace' || e.key === 'Delete') {
      e.preventDefault()
      this.removeSelectedLayers()
      this.recordState('delete')
    }
  }
}
