import { App, Rect, Text, Group, ChildEvent, PropertyEvent } from 'leafer-ui'
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
      const relevantProps = ['visible', 'locked', 'name', 'tag', 'zIndex']
      if (relevantProps.includes(e.attrName)) {
        this.syncLayers()
      }
    })

    // 监听选中变化
    editor.on(EditorEvent.SELECT, () => {
      this.syncSelection()
    })
  }

  syncLayers() {
    if (this.callbacks.onLayersChange) {
      const layers = this.app.tree.children
        .filter((child) => !['SimulateElement'].includes(child.tag))
        .map((child) => ({
          id: child.innerId,
          name: child.name || child.tag || child.innerId,
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
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return

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
   * 添加一个矩形
   */
  addRect() {
    const rect = new Rect({
      x: 100,
      y: 100,
      width: 100,
      height: 100,
      fill: '#32cd79',
      editable: true,
      draggable: true,
      cornerRadius: 10
    })
    this.app.tree.add(rect)
    return rect
  }

  /**
   * 添加文字
   */
  addText() {
    const text = new Text({
      x: 250,
      y: 100,
      text: '双击编辑文字',
      fill: '#333',
      fontSize: 24,
      editable: true,
      draggable: true
    })
    this.app.tree.add(text)
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
      this.app.destroy()
      this.app = null
    }
  }
}
