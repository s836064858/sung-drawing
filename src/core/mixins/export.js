import { Group } from 'leafer-ui'

export const exportMixin = {
  /**
   * 导出选中元素
   * @param {object} options 导出选项 { scale, format, quality }
   */
  async exportSelection(options = {}) {
    // 获取编辑器选中的元素列表
    const { list } = this.app.editor
    if (!list || list.length === 0) return

    const { scale = 1, format = 'png', quality = 1 } = options

    // 如果只选中一个元素，直接导出
    // 这也涵盖了 "如果选中的为frame，则导出其下所有" 的情况（Frame 本身就是个容器）
    if (list.length === 1) {
      const element = list[0]
      const name = element.name || 'export'
      const filename = `${name}.${format}`
      return await element.export(filename, { scale, format, quality })
    }

    // 多选情况：创建一个临时组，将所有选中元素克隆并放入其中，然后导出该组
    // 这样可以导出成一张图
    const tempGroup = new Group()

    // 我们不将 tempGroup 添加到画布树中，以免造成闪烁
    // 直接操作 tempGroup 进行导出

    // 计算包围盒并调整位置
    // 我们需要将所有元素在世界坐标系下的相对位置保持一致

    // 1. 收集所有克隆体并计算整体的世界包围盒
    // 注意：这里我们通过克隆体来计算，或者直接用 list 计算

    // 为了简单，我们先把所有克隆体加到 tempGroup，并应用它们的世界变换
    list.forEach((element) => {
      if (element.clone) {
        const clone = element.clone()
        // 获取原始元素的世界变换矩阵
        const worldTransform = element.worldTransform
        // 应用到克隆体 (将克隆体的局部变换设置为原始元素的世界变换)
        if (worldTransform && clone.setTransform) {
          clone.setTransform(worldTransform)
        }
        tempGroup.add(clone)
      }
    })

    // 2. 获取临时组的包围盒（此时它是世界坐标系下的）
    const bounds = tempGroup.getBounds()

    // 3. 导出
    // 使用 bounds 来指定导出区域，避免导出多余的空白（如果 tempGroup 在 0,0，而内容在 1000,1000）
    const filename = `export_selection.${format}`

    try {
      await tempGroup.export(filename, {
        scale,
        format,
        quality,
        // 裁剪导出区域
        x: bounds.x,
        y: bounds.y,
        width: bounds.width,
        height: bounds.height
      })
    } catch (error) {
      console.error('Export failed:', error)
    } finally {
      // 销毁临时组
      tempGroup.destroy()
    }
  }
}
