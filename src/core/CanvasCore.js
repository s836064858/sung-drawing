import { App, Rect, Text, Group, ChildEvent, PropertyEvent, PointerEvent, Ellipse, Polygon, Image } from 'leafer-ui'
import '@leafer-in/editor'
import '@leafer-in/text-editor'
import '@leafer-in/find'
import '@leafer-in/view'
import '@leafer-in/viewport'
import { DotMatrix } from 'leafer-x-dotwuxian'
import { Snap } from 'leafer-x-easy-snap'
import { EditorEvent } from '@leafer-in/editor' // 导入图形编辑器插件 //

/**
 * 画布核心类，负责管理 Leafer 实例和相关操作
 */
export class CanvasCore {
  constructor(view, callbacks = {}) {
    this.app = new App({
      view: view,
      editor: {},
      tree: {
        type: 'design'
      }
    })

    this.callbacks = callbacks
    this.mode = 'select' // 当前模式: select, text, rect, etc.
    this.init()
  }

  init() {
    // 初始化插件
    this.initPlugins()

    // 监听事件
    this.initEvents()

    // 初始同步
    this.syncLayers()
  }

  initEvents() {
    const { tree, editor } = this.app

    // 监听键盘事件 (删除)
    // 监听全局 keydown 事件，或者使用 leafer-ui 的 key 插件（如果有）
    // 这里简单使用 window 监听，注意要在 destroy 时移除
    window.addEventListener('keydown', this.handleKeydown)

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
    this.app.on(PointerEvent.TAP, this.handleTap)

    // 监听拖拽绘制（用于矩形等）
    this.app.on(PointerEvent.DOWN, this.handlePointerDown)
    this.app.on(PointerEvent.MOVE, this.handlePointerMove)
    this.app.on(PointerEvent.UP, this.handlePointerUp)

    // 监听粘贴事件
    window.addEventListener('paste', this.handlePaste)

    // 监听拖拽上传
    if (this.app.view) {
      this.app.view.addEventListener('dragover', this.handleDragOver)
      this.app.view.addEventListener('drop', this.handleDrop)
    }
  }

  handlePaste = (e) => {
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
  }

  handleDragOver = (e) => {
    e.preventDefault()
  }

  handleDrop = (e) => {
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
  }

  handleTap = (e) => {
    // 如果是文本模式，点击添加文本
    if (this.mode === 'text') {
      // 获取点击坐标并转换为 tree 内部坐标
      const { x, y } = this.app.tree.getInnerPoint(e)
      this.addText(x, y)

      // 添加完后切换回选择模式
      this.setMode('select')
    }
  }

  handlePointerDown = (e) => {
    if (['rect', 'ellipse', 'diamond'].includes(this.mode)) {
      // 禁用编辑器，避免干扰
      this.app.editor.cancel()

      this.isDrawing = true
      // 转换为 tree 内部坐标
      const { x, y } = this.app.tree.getInnerPoint(e)
      this.startPoint = { x, y }

      // 根据模式创建初始图形
      if (this.mode === 'rect') {
        this.currentDrawingShape = new Rect({
          x: x,
          y: y,
          width: 0,
          height: 0,
          fill: '#32cd79',
          editable: true,
          draggable: true,
          cornerRadius: 10,
          name: '矩形'
        })
      } else if (this.mode === 'ellipse') {
        this.currentDrawingShape = new Ellipse({
          x: x,
          y: y,
          width: 0,
          height: 0,
          fill: '#32cd79',
          editable: true,
          draggable: true,
          name: '圆形'
        })
      } else if (this.mode === 'diamond') {
        // 菱形使用多边形，初始化时只需设置基本属性，具体点在 move 中计算
        this.currentDrawingShape = new Polygon({
          x: x,
          y: y,
          width: 0,
          height: 0,
          fill: '#32cd79',
          editable: true,
          draggable: true,
          points: [], // 初始空点
          name: '菱形'
        })
      }

      this.app.tree.add(this.currentDrawingShape)
    }
  }

  handlePointerMove = (e) => {
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
  }

  handlePointerUp = (e) => {
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
  }

  setMode(mode) {
    this.mode = mode

    // 根据模式调整光标或编辑器状态
    if (mode === 'text') {
      this.app.cursor = 'text'
      this.app.editor.cancel() // 取消当前选中
    } else if (['rect', 'ellipse', 'diamond'].includes(mode)) {
      this.app.cursor = 'crosshair'
      this.app.editor.cancel()
    } else {
      this.app.cursor = 'auto'
    }

    // 触发模式变更回调
    if (this.callbacks.onModeChange) {
      this.callbacks.onModeChange(mode)
    }
  }

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
  }

  syncSelection() {
    if (this.callbacks.onSelectionChange) {
      const selectedIds = this.app.editor.list.map((item) => item.innerId)
      this.callbacks.onSelectionChange(selectedIds)
    }
  }

  // --- 外部调用方法 ---

  handleKeydown = (e) => {
    // 按下 Backspace 或 Delete 键
    if (e.key === 'Backspace' || e.key === 'Delete') {
      // 确保没有在输入框中
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.isContentEditable) return

      this.removeSelectedLayers()
    }
  }

  removeSelectedLayers() {
    const selected = this.app.editor.list
    if (selected.length > 0) {
      // 复制一份列表，因为 remove 会改变 list
      const list = [...selected]
      list.forEach((item) => item.remove())
      this.app.editor.cancel() // 清除选中状态
    }
  }

  selectLayer(id) {
    const element = this.app.tree.findOne((child) => child.innerId === id)
    if (element) {
      this.app.editor.select(element)
    } else {
      this.app.editor.cancel()
    }
    // 手动触发一次同步，确保 UI 高亮及时更新
    this.syncSelection()
  }

  toggleVisible(id) {
    const element = this.app.tree.findOne((child) => child.innerId === id)
    if (element) {
      element.visible = !element.visible
    }
  }

  toggleLock(id) {
    const element = this.app.tree.findOne((child) => child.innerId === id)
    if (element) {
      element.locked = !element.locked
    }
  }

  removeLayer(id) {
    const element = this.app.tree.findOne((child) => child.innerId === id)
    if (element) {
      element.remove()
    }
  }

  initPlugins() {
    // 初始化点阵背景
    this.dotMatrix = new DotMatrix(this.app)
    this.dotMatrix.enableDotMatrix(true)

    // 初始化吸附功能
    this.snap = new Snap(this.app)
    this.snap.enable(true)
  }

  /**
   * 添加图片
   */
  addImage(url, options = {}) {
    const image = new Image({
      url: url,
      x: options.x || 100,
      y: options.y || 100,
      editable: true,
      draggable: true,
      name: '图片'
    })
    this.app.tree.add(image)
    this.app.editor.select(image)
    return image
  }

  /**
   * 添加文字 (内部调用)
   */
  addText(x, y) {
    const text = new Text({
      x: x,
      y: y,
      text: '双击编辑文字',
      fill: '#333',
      fontSize: 24,
      editable: true,
      draggable: true
    })
    this.app.tree.add(text)
    // 自动选中新添加的元素
    this.app.editor.select(text)
    return text
  }

  /**
   * 清空画布
   */
  clear() {
    this.app.tree.clear()
  }

  /**
   * 销毁实例
   */
  destroy() {
    if (this.app) {
      window.removeEventListener('keydown', this.handleKeydown)
      window.removeEventListener('paste', this.handlePaste)
      if (this.app.view) {
        this.app.view.removeEventListener('dragover', this.handleDragOver)
        this.app.view.removeEventListener('drop', this.handleDrop)
      }
      this.app.destroy()
      this.app = null
    }
  }
}
