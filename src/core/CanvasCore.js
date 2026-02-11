import { initMixin } from './mixins/init'
import { eventMixin } from './mixins/event'
import { layerMixin } from './mixins/layer'
import { toolMixin } from './mixins/tool'
import { exportMixin } from './mixins/export'
import { historyMixin } from './mixins/history'
import { importMixin } from './mixins/import'
import '@leafer-in/export' // 引入导出插件

/**
 * 画布核心类，负责管理 Leafer 实例和相关操作
 */
export class CanvasCore {
  constructor(view, callbacks = {}) {
    this.view = view
    this.callbacks = callbacks
    this.mode = 'select' // 当前模式: select, text, rect, ellipse, diamond, frame, line, arrow

    // 绘制状态
    this.isDrawing = false
    this.startPoint = null
    this.currentDrawingShape = null

    // Frame 拖拽状态
    this.isDraggingIntoFrame = false
    this.highlightedFrame = null

    // 剪贴板
    this.clipboard = []
    this.pasteOffset = 0 // 粘贴偏移计数器

    // 事件处理器引用（用于清理）
    this.eventHandlers = {}

    // 初始化 (在 initMixin 中定义)
    this.init()
  }

  /**
   * 根据 ID 查找元素（带缓存优化）
   */
  findElementById(id) {
    return this.app?.tree?.findOne((child) => child.innerId === id)
  }

  /**
   * 导出当前画布内容为 JSON
   */
  exportJson() {
    return this.app.tree.toJSON()
  }

  /**
   * 导入 JSON 数据到画布
   */
  importJson(json) {
    if (!json) {
      this.app.tree.clear()
      return
    }
    
    // 如果是 JSON 字符串，先解析
    const data = typeof json === 'string' ? JSON.parse(json) : json
    
    // 清空当前画布
    this.app.tree.clear()
    
    // 添加新内容
    // Leafer 的 add 方法支持直接添加 JSON 对象结构
    if (data.children) {
        data.children.forEach(child => {
             this.app.tree.add(child)
        })
    } else {
         this.app.tree.add(data)
    }
  }

  /**
   * 切换标尺显示状态
   */
  toggleRuler(enabled) {
    if (this.ruler) {
      this.ruler.enabled = enabled
    }
  }
}

// 挂载 Mixins 到原型链
Object.assign(CanvasCore.prototype, initMixin)
Object.assign(CanvasCore.prototype, eventMixin)
Object.assign(CanvasCore.prototype, layerMixin)
Object.assign(CanvasCore.prototype, toolMixin)
Object.assign(CanvasCore.prototype, exportMixin)
Object.assign(CanvasCore.prototype, historyMixin)
Object.assign(CanvasCore.prototype, importMixin)
