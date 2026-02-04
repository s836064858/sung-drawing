import { initMixin } from './mixins/init'
import { eventMixin } from './mixins/event'
import { layerMixin } from './mixins/layer'
import { toolMixin } from './mixins/tool'

/**
 * 画布核心类，负责管理 Leafer 实例和相关操作
 */
export class CanvasCore {
  constructor(view, callbacks = {}) {
    this.view = view
    this.callbacks = callbacks
    this.mode = 'select' // 当前模式: select, text, rect, etc.

    // 初始化 (在 initMixin 中定义)
    this.init()
  }
}

// 挂载 Mixins 到原型链
Object.assign(CanvasCore.prototype, initMixin)
Object.assign(CanvasCore.prototype, eventMixin)
Object.assign(CanvasCore.prototype, layerMixin)
Object.assign(CanvasCore.prototype, toolMixin)
