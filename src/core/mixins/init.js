import { App } from 'leafer-ui'
import '@leafer-in/editor'
import '@leafer-in/text-editor'
import '@leafer-in/find'
import '@leafer-in/view'
import '@leafer-in/viewport'
import { DotMatrix } from 'leafer-x-dotwuxian'
import { Snap } from 'leafer-x-easy-snap'
import { Ruler } from 'leafer-x-ruler'

export const initMixin = {
  init() {
    if (!this.view) {
      console.error('CanvasCore: view element is required')
      return
    }

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

    // 初始化历史记录
    if (this.initHistory) {
      this.initHistory()
    }
  },

  initPlugins() {
    try {
      // 初始化点阵背景
      this.dotMatrix = new DotMatrix(this.app)
      this.dotMatrix.enableDotMatrix(true)

      // 初始化吸附功能
      this.snap = new Snap(this.app)
      this.snap.enable(true)

      // 初始化标尺
      this.ruler = new Ruler(this.app, {
        theme: 'custom',
        themes: {
          custom: {
            backgroundColor: '#ffffff',
            textColor: '#303133',
            borderColor: '#dcdfe6',
            highlightColor: '#836dff'
          }
        }
      })
      this.ruler.enabled = true
    } catch (error) {
      console.error('CanvasCore: Failed to initialize plugins', error)
    }
  },

  /**
   * 销毁实例，清理所有事件监听和资源
   */
  destroy() {
    if (!this.app) return

    // 清理事件监听（委托给 eventMixin）
    if (this.destroyEvents) {
      this.destroyEvents()
    }

    // 清理插件
    if (this.dotMatrix) this.dotMatrix = null
    if (this.snap) this.snap = null
    if (this.ruler) {
      this.ruler.destroy()
      this.ruler = null
    }

    // 销毁应用实例
    this.app.destroy()
    this.app = null
  }
}
