import { isContainerTag } from '../constants/element-types'

export const alignMixin = {
  /**
   * 检查选中元素是否在 Frame 中
   */
  isInFrame(element) {
    return element && element.parent && element.parent.tag === 'Frame'
  },

  /**
   * 对齐选中元素
   * @param {string} type - 对齐类型: 'left', 'center', 'right', 'top', 'middle', 'bottom'
   */
  alignSelected(type) {
    const list = this.app.editor.list
    if (list.length === 0) return

    let changed = false

    // 遍历所有选中的元素
    list.forEach((element) => {
      // 仅处理在 Frame 中的元素
      if (this.isInFrame(element)) {
        const frame = element.parent
        const frameWidth = frame.width
        const frameHeight = frame.height
        const elementWidth = element.width
        const elementHeight = element.height

        let newX = element.x
        let newY = element.y

        // 根据对齐类型调整位置
        switch (type) {
          case 'left':
            newX = 0
            break
          case 'center':
            // 水平居中
            newX = (frameWidth - elementWidth) / 2
            break
          case 'right':
            newX = frameWidth - elementWidth
            break
          case 'top':
            newY = 0
            break
          case 'middle':
            // 垂直居中
            newY = (frameHeight - elementHeight) / 2
            break
          case 'bottom':
            newY = frameHeight - elementHeight
            break
        }

        if (element.x !== newX || element.y !== newY) {
          element.x = newX
          element.y = newY
          changed = true
        }
      }
    })

    if (changed) {
      this.app.editor.update() // 更新编辑器选框
      if (this.recordState) {
        this.recordState(`align-${type}`)
      }
    }
  }
}
