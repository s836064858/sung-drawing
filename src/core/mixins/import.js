import { parseFigmaFile, fetchFigmaFile, extractFigmaFileKey, extractFigmaNodeId } from '../utils/figma-parser'
import { setupFrameLabel } from '../utils/frame-helper'
import { getElementTypeMap } from '../utils/element-serializer'

const ELEMENT_TYPE_MAP = getElementTypeMap()

export const importMixin = {
  /**
   * 统一导入入口
   * @param {Object|string} data 导入的数据 (JSON 对象或字符串)
   * @param {string} type 导入类型 'json' | 'figma-api'
   * @param {Object} options 导入选项
   */
  async importData(data, type = 'json', options = {}) {
    if (!data) return 0

    try {
      if (type === 'figma-api') {
        const { url, token } = data
        return await this.importFromFigmaAPI(url, token)
      }

      // JSON 导入处理
      const content = typeof data === 'string' ? JSON.parse(data) : data

      // 1. 尝试检测是否为原生 Leafer JSON
      if (this._isNativeFormat(content)) {
        return this._importNativeJson(content, options)
      }

      // 2. 尝试作为 Figma JSON 导入
      return this.importFromFigmaJSON(content)
    } catch (error) {
      console.error('导入失败:', error)
      throw error
    }
  },

  /**
   * 检测是否为原生 Leafer 格式
   */
  _isNativeFormat(data) {
    if (Array.isArray(data)) {
      return data.some((item) => item.tag && item.innerId)
    }
    if (data.tag && (data.children || data.innerId)) {
      return true
    }
    return false
  },

  /**
   * 导入原生 JSON
   */
  _importNativeJson(data, options = {}) {
    const { clear = true } = options

    if (clear) {
      this.app.tree.clear()
    }

    let count = 0

    // 如果根节点是 Leafer，遍历添加其子节点
    if (data.tag === 'Leafer' && data.children) {
      data.children.forEach((child) => {
        this.app.tree.add(child)
        count++
      })
    } else {
      // 否则直接添加该节点
      this.app.tree.add(data)
      count = 1
    }

    if (count > 0) {
      this.syncLayers()
      if (this.recordState) {
        this.recordState('import-json')
      }
    }

    return count
  },

  /**
   * 从 Figma API 导入文件
   */
  async importFromFigmaAPI(urlOrKey, token) {
    if (!token) throw new Error('请提供 Figma Personal Access Token')

    let fileKey = urlOrKey
    let nodeId = null

    // 如果是 URL，提取 key 和 nodeId
    if (urlOrKey.includes('figma.com')) {
      fileKey = extractFigmaFileKey(urlOrKey)
      nodeId = extractFigmaNodeId(urlOrKey)
      if (!fileKey) throw new Error('无法从 URL 中提取 Figma 文件 Key')
    }

    const figmaData = await fetchFigmaFile(fileKey, token, nodeId)
    return this._importFigmaElements(parseFigmaFile(figmaData, { nodeId }))
  },

  /**
   * 从 Figma JSON 数据导入（粘贴或文件上传）
   * @param {Object|string} jsonData - Figma JSON 数据
   * @returns {number} 导入的元素数量
   */
  importFromFigmaJSON(jsonData) {
    const data = typeof jsonData === 'string' ? JSON.parse(jsonData) : jsonData
    const elements = parseFigmaFile(data)
    return this._importFigmaElements(elements)
  },

  /**
   * 将解析后的元素数据添加到画布
   * @param {Array} elements - Leafer 格式的元素数据数组
   * @returns {number} 成功添加的元素数量
   */
  _importFigmaElements(elements) {
    if (!elements || elements.length === 0) return 0

    let count = 0
    const treeWidth = this.app.tree.width || 800
    const treeHeight = this.app.tree.height || 600

    // 计算所有元素的包围盒，用于居中放置
    let minX = Infinity,
      minY = Infinity,
      maxX = -Infinity,
      maxY = -Infinity
    elements.forEach((el) => {
      minX = Math.min(minX, el.x || 0)
      minY = Math.min(minY, el.y || 0)
      maxX = Math.max(maxX, (el.x || 0) + (el.width || 0))
      maxY = Math.max(maxY, (el.y || 0) + (el.height || 0))
    })

    const totalWidth = maxX - minX
    const totalHeight = maxY - minY
    const offsetX = treeWidth / 2 - totalWidth / 2 - minX
    const offsetY = treeHeight / 2 - totalHeight / 2 - minY

    elements.forEach((elData) => {
      const node = this._createNodeFromData({
        ...elData,
        x: (elData.x || 0) + offsetX,
        y: (elData.y || 0) + offsetY
      })
      if (node) {
        this.app.tree.add(node)
        count++
      }
    })

    if (count > 0) {
      this.syncLayers()
      if (this.recordState) {
        this.recordState('import-figma')
      }
    }

    return count
  },

  /**
   * 递归创建 Leafer 节点
   */
  _createNodeFromData(data) {
    if (!data || !data.tag) return null

    const { tag, children, ...props } = data
    const ClassName = ELEMENT_TYPE_MAP[tag]

    if (!ClassName) {
      console.warn(`导入时跳过未知类型: ${tag}`)
      return null
    }

    const node = new ClassName(JSON.parse(JSON.stringify(props)))
    node.editable = true

    if (tag === 'Frame') {
      setupFrameLabel(node)
    }

    if (children && Array.isArray(children)) {
      children.forEach((childData) => {
        const childNode = this._createNodeFromData(childData)
        if (childNode) node.add(childNode)
      })
    }

    return node
  }
}
