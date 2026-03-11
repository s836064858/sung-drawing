import { Group } from 'leafer-ui'
import { convertToFigma } from '../utils/figma-exporter'

export const exportMixin = {
  /**
   * 导出选中元素
   * @param {string} type 导出类型 'json' | 'png' | 'jpg' | 'figma'
   * @param {string} filename 文件名
   */
  async exportSelection(type = 'json', filename) {
    // 获取选中的元素列表
    const selection = this.app.editor.list
    if (!selection || selection.length === 0) return

    if (type === 'json') {
      const json = selection.length === 1 ? selection[0].toJSON() : selection.map((node) => node.toJSON())
      const name = filename || (selection.length === 1 ? selection[0].name || 'layer' : 'layers')
      this.downloadJson(json, name)
      return
    }

    if (type === 'figma') {
      const figmaNodes = selection.map((node) => convertToFigma(node)).filter(Boolean)

      // 构造符合 Figma 文件结构的 JSON
      const figmaJson = {
        document: {
          id: '0:0',
          name: 'Document',
          type: 'DOCUMENT',
          children: [
            {
              id: '0:1',
              name: 'Page 1',
              type: 'CANVAS',
              backgroundColor: { r: 0.96, g: 0.96, b: 0.96, a: 1 },
              children: figmaNodes
            }
          ]
        },
        schemaVersion: 0,
        name: filename || 'figma-export'
      }

      this.downloadJson(figmaJson, (filename || 'figma-export') + '.fig')
      return
    }

    // 导出图片 (png/jpg)
    const format = type === 'jpg' ? 'jpg' : 'png'

    // 如果只选中一个元素，直接导出
    if (selection.length === 1) {
      const element = selection[0]
      const name = filename || element.name || 'export'
      // Leafer 的 export 方法会自动触发下载
      return await element.export(name + '.' + format, { type: format })
    }

    // 多选导出为一张图
    // 创建临时组
    const group = new Group()

    // 计算所有选中元素的包围盒
    let minX = Infinity,
      minY = Infinity,
      maxX = -Infinity,
      maxY = -Infinity

    selection.forEach((node) => {
      const bounds = node.worldBox
      minX = Math.min(minX, bounds.x)
      minY = Math.min(minY, bounds.y)
      maxX = Math.max(maxX, bounds.x + bounds.width)
      maxY = Math.max(maxY, bounds.y + bounds.height)
    })

    // 将选中元素克隆并添加到临时组
    selection.forEach((node) => {
      const clone = node.clone()
      // 保持相对位置
      clone.x = node.worldBox.x - minX
      clone.y = node.worldBox.y - minY
      group.add(clone)
    })

    const name = filename || 'export_selection'
    // 导出临时组
    await group.export(name + '.' + format, { type: format })
    group.destroy()
  },

  /**
   * 下载 JSON 文件
   */
  downloadJson(json, filename) {
    const jsonStr = JSON.stringify(json, null, 2)
    const blob = new Blob([jsonStr], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename.endsWith('.json') ? filename : `${filename}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }
}
