import { App } from 'leafer-ui'
import '@leafer-in/editor'
import '@leafer-in/text-editor'
import '@leafer-in/find'
import '@leafer-in/view'
import '@leafer-in/viewport'
import { DotMatrix } from 'leafer-x-dotwuxian'
import { Snap } from 'leafer-x-easy-snap'

export const initMixin = {
  init() {
    this.app = new App({
      view: this.view,
      editor: {},
      tree: {
        type: 'design'
      }
    })

    // 初始化插件
    this.initPlugins()

    // 监听事件
    this.initEvents()

    // 初始同步
    this.syncLayers()
  },

  initPlugins() {
    // 初始化点阵背景
    this.dotMatrix = new DotMatrix(this.app)
    this.dotMatrix.enableDotMatrix(true)

    // 初始化吸附功能
    this.snap = new Snap(this.app)
    this.snap.enable(true)
  },

  /**
   * 销毁实例
   */
  destroy() {
    if (this.app) {
      if (this.__handleKeydown) window.removeEventListener('keydown', this.__handleKeydown)
      if (this.__handlePaste) window.removeEventListener('paste', this.__handlePaste)
      if (this.app.view) {
        if (this.__handleDragOver) this.app.view.removeEventListener('dragover', this.__handleDragOver)
        if (this.__handleDrop) this.app.view.removeEventListener('drop', this.__handleDrop)
      }
      this.app.destroy()
      this.app = null
    }
  }
}
