/**
 * Figma 文件解析器
 * 将 Figma REST API 返回的节点树转换为 Leafer 元素结构
 */

// Figma 混合模式 → CSS/Leafer 混合模式映射
const BLEND_MODE_MAP = {
  NORMAL: 'normal',
  DARKEN: 'darken',
  MULTIPLY: 'multiply',
  COLOR_BURN: 'color-burn',
  LIGHTEN: 'lighten',
  SCREEN: 'screen',
  COLOR_DODGE: 'color-dodge',
  OVERLAY: 'overlay',
  SOFT_LIGHT: 'soft-light',
  HARD_LIGHT: 'hard-light',
  DIFFERENCE: 'difference',
  EXCLUSION: 'exclusion',
  HUE: 'hue',
  SATURATION: 'saturation',
  COLOR: 'color',
  LUMINOSITY: 'luminosity'
}

/**
 * 将 Figma RGBA 颜色转为 CSS 颜色字符串
 */
function figmaColorToCSS(color, opacity = 1) {
  if (!color) return undefined
  const r = Math.round((color.r || 0) * 255)
  const g = Math.round((color.g || 0) * 255)
  const b = Math.round((color.b || 0) * 255)
  const a = (color.a !== undefined ? color.a : 1) * opacity
  if (a === 1) {
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`
  }
  return `rgba(${r}, ${g}, ${b}, ${a.toFixed(2)})`
}

/**
 * 解析 Figma 填充为 Leafer fill
 * 仅处理第一个可见的 SOLID 填充
 */
function parseFill(fills) {
  if (!fills || !Array.isArray(fills)) return undefined
  const visible = fills.filter((f) => f.visible !== false)
  if (visible.length === 0) return undefined

  const fill = visible[0]
  if (fill.type === 'SOLID') {
    return figmaColorToCSS(fill.color, fill.opacity !== undefined ? fill.opacity : 1)
  }
  if (fill.type === 'GRADIENT_LINEAR' && fill.gradientStops) {
    return {
      type: 'linear',
      stops: fill.gradientStops.map((s) => ({
        offset: s.position,
        color: figmaColorToCSS(s.color)
      }))
    }
  }
  if (fill.type === 'IMAGE' && fill.imageRef) {
    // 返回图片引用标记，后续可替换为实际 URL
    return undefined
  }
  return undefined
}

/**
 * 解析 Figma 描边
 */
function parseStroke(strokes, strokeWeight) {
  if (!strokes || !Array.isArray(strokes) || strokes.length === 0) return {}
  const visible = strokes.filter((s) => s.visible !== false)
  if (visible.length === 0) return {}

  const stroke = visible[0]
  const result = {}
  if (stroke.type === 'SOLID') {
    result.stroke = figmaColorToCSS(stroke.color, stroke.opacity !== undefined ? stroke.opacity : 1)
  }
  if (strokeWeight) {
    result.strokeWidth = strokeWeight
  }
  return result
}

/**
 * 解析 Figma 阴影效果
 */
function parseShadow(effects) {
  if (!effects || !Array.isArray(effects)) return undefined
  const shadow = effects.find((e) => (e.type === 'DROP_SHADOW' || e.type === 'INNER_SHADOW') && e.visible !== false)
  if (!shadow) return undefined

  return {
    x: shadow.offset?.x || 0,
    y: shadow.offset?.y || 0,
    blur: shadow.radius || 0,
    spread: shadow.spread || 0,
    color: figmaColorToCSS(shadow.color)
  }
}

/**
 * 解析圆角
 */
function parseCornerRadius(node) {
  if (node.rectangleCornerRadii) {
    const [tl, tr, br, bl] = node.rectangleCornerRadii
    if (tl === tr && tr === br && br === bl) return tl
    return [tl, tr, br, bl]
  }
  return node.cornerRadius || 0
}

/**
 * 解析 Figma 文字样式
 */
function parseTextStyle(node) {
  const style = node.style || {}
  const result = {}

  if (style.fontSize) result.fontSize = style.fontSize
  if (style.fontWeight) result.fontWeight = style.fontWeight >= 700 ? 'bold' : 'normal'
  if (style.letterSpacing) result.letterSpacing = style.letterSpacing
  if (style.lineHeightPx) {
    result.lineHeight = {
      type: 'percent',
      value: style.lineHeightPx / (style.fontSize || 14)
    }
  }
  if (style.textAlignHorizontal) {
    const alignMap = { LEFT: 'left', CENTER: 'center', RIGHT: 'right', JUSTIFIED: 'justify' }
    result.textAlign = alignMap[style.textAlignHorizontal] || 'left'
  }
  if (style.textAlignVertical) {
    const vAlignMap = { TOP: 'top', CENTER: 'middle', BOTTOM: 'bottom' }
    result.verticalAlign = vAlignMap[style.textAlignVertical] || 'top'
  }

  return result
}

/**
 * 将单个 Figma 节点转换为 Leafer 元素数据
 */
function convertNode(node, parentAbsX = 0, parentAbsY = 0) {
  if (!node || node.visible === false) return null

  // 计算相对于父节点的位置
  const absX = node.absoluteBoundingBox?.x || 0
  const absY = node.absoluteBoundingBox?.y || 0
  const width = node.absoluteBoundingBox?.width || node.size?.x || 0
  const height = node.absoluteBoundingBox?.height || node.size?.y || 0
  const x = absX - parentAbsX
  const y = absY - parentAbsY

  // 基础属性
  const base = {
    name: node.name || '',
    x,
    y,
    width,
    height,
    opacity: node.opacity !== undefined ? node.opacity : 1,
    rotation: node.rotation ? -node.rotation : 0, // Figma 旋转方向相反
    editable: true
  }

  // 填充 & 描边 & 阴影
  const fill = parseFill(node.fills)
  if (fill !== undefined) base.fill = fill

  const strokeProps = parseStroke(node.strokes, node.strokeWeight)
  Object.assign(base, strokeProps)

  const shadow = parseShadow(node.effects)
  if (shadow) base.shadow = shadow

  // 混合模式
  if (node.blendMode && node.blendMode !== 'PASS_THROUGH' && BLEND_MODE_MAP[node.blendMode]) {
    base.blendMode = BLEND_MODE_MAP[node.blendMode]
  }

  // 根据 Figma 节点类型映射
  switch (node.type) {
    case 'FRAME':
    case 'COMPONENT':
    case 'COMPONENT_SET':
    case 'INSTANCE': {
      const cornerRadius = parseCornerRadius(node)
      const element = {
        tag: 'Frame',
        ...base,
        cornerRadius,
        overflow: node.clipsContent ? 'hidden' : 'show',
        children: []
      }
      if (node.children) {
        node.children.forEach((child) => {
          const childEl = convertNode(child, absX, absY)
          if (childEl) element.children.push(childEl)
        })
      }
      return element
    }

    case 'GROUP': {
      const element = {
        tag: 'Group',
        ...base,
        children: []
      }
      if (node.children) {
        node.children.forEach((child) => {
          const childEl = convertNode(child, absX, absY)
          if (childEl) element.children.push(childEl)
        })
      }
      return element
    }

    case 'RECTANGLE':
    case 'ROUNDED_RECTANGLE': {
      const cornerRadius = parseCornerRadius(node)
      return {
        tag: 'Rect',
        ...base,
        cornerRadius
      }
    }

    case 'ELLIPSE': {
      return {
        tag: 'Ellipse',
        ...base
      }
    }

    case 'POLYGON':
    case 'STAR': {
      return {
        tag: node.type === 'STAR' ? 'Star' : 'Polygon',
        ...base
      }
    }

    case 'LINE': {
      return {
        tag: 'Line',
        ...base,
        points: [0, 0, width, 0]
      }
    }

    case 'VECTOR': {
      // 矢量路径 → 简化为矩形占位（完整 SVG path 转换较复杂）
      return {
        tag: 'Rect',
        ...base,
        name: `[Vector] ${node.name || ''}`
      }
    }

    case 'TEXT': {
      const textStyle = parseTextStyle(node)
      const textFill = parseFill(node.fills)
      return {
        tag: 'Text',
        ...base,
        text: node.characters || '',
        fill: textFill || base.fill || '#000000',
        ...textStyle
      }
    }

    case 'BOOLEAN_OPERATION': {
      // 布尔运算 → 简化为 Group
      const element = {
        tag: 'Group',
        ...base,
        name: `[Boolean] ${node.name || ''}`,
        children: []
      }
      if (node.children) {
        node.children.forEach((child) => {
          const childEl = convertNode(child, absX, absY)
          if (childEl) element.children.push(childEl)
        })
      }
      return element
    }

    case 'SECTION': {
      const element = {
        tag: 'Frame',
        ...base,
        children: []
      }
      if (node.children) {
        node.children.forEach((child) => {
          const childEl = convertNode(child, absX, absY)
          if (childEl) element.children.push(childEl)
        })
      }
      return element
    }

    default:
      // 未知类型 → 跳过
      console.warn(`Figma 节点类型未支持: ${node.type} (${node.name})`)
      return null
  }
}

/**
 * 检测是否为 .fig 原生导出格式（小写 type，直接属性）
 */
function isFigNativeFormat(data) {
  if (data.version && data.children) {
    const first = data.children[0]
    if (first && first.type && first.type === first.type.toLowerCase()) {
      return true
    }
  }
  // 单个节点
  if (data.type && data.type === data.type.toLowerCase() && (data.x !== undefined || data.width !== undefined)) {
    return true
  }
  return false
}

/**
 * 将 .fig 原生格式节点转换为 Leafer 元素数据
 */
function convertFigNativeNode(node) {
  if (!node || !node.type) return null

  const type = node.type.toLowerCase()

  const base = {
    name: node.name || '',
    x: node.x || 0,
    y: node.y || 0,
    width: node.width || 0,
    height: node.height || 0,
    opacity: node.opacity !== undefined ? node.opacity : 1,
    rotation: node.rotation || 0,
    editable: true
  }

  // 填充：.fig 格式中 fill 直接是颜色字符串
  if (node.fill) base.fill = node.fill

  // 描边
  if (node.stroke) base.stroke = node.stroke
  if (node.strokeWidth) base.strokeWidth = node.strokeWidth

  // 圆角
  if (node.cornerRadius) base.cornerRadius = node.cornerRadius

  // 阴影
  if (node.shadow) base.shadow = node.shadow

  switch (type) {
    case 'frame': {
      const element = {
        tag: 'Frame',
        ...base,
        overflow: node.clip ? 'hidden' : 'show',
        children: []
      }
      if (node.children) {
        node.children.forEach((child) => {
          const childEl = convertFigNativeNode(child)
          if (childEl) element.children.push(childEl)
        })
      }
      return element
    }

    case 'group': {
      const element = {
        tag: 'Group',
        ...base,
        children: []
      }
      if (node.children) {
        node.children.forEach((child) => {
          const childEl = convertFigNativeNode(child)
          if (childEl) element.children.push(childEl)
        })
      }
      return element
    }

    case 'rectangle':
    case 'rect': {
      return { tag: 'Rect', ...base }
    }

    case 'ellipse':
    case 'circle': {
      return { tag: 'Ellipse', ...base }
    }

    case 'polygon': {
      return { tag: 'Polygon', ...base }
    }

    case 'star': {
      return { tag: 'Star', ...base }
    }

    case 'line': {
      return {
        tag: 'Line',
        ...base,
        points: node.points || [0, 0, base.width, 0]
      }
    }

    case 'arrow': {
      return {
        tag: 'Arrow',
        ...base,
        points: node.points || [0, 0, base.width, 0]
      }
    }

    case 'text': {
      const textProps = {}
      if (node.fontSize) textProps.fontSize = node.fontSize
      if (node.fontWeight) textProps.fontWeight = node.fontWeight
      if (node.fontFamily) textProps.fontFamily = node.fontFamily
      if (node.textAlign) textProps.textAlign = node.textAlign
      if (node.lineHeight) textProps.lineHeight = node.lineHeight
      if (node.letterSpacing) textProps.letterSpacing = node.letterSpacing

      return {
        tag: 'Text',
        ...base,
        text: node.content || node.text || node.characters || '',
        ...textProps
      }
    }

    case 'image': {
      return {
        tag: 'Image',
        ...base,
        url: node.url || node.src || ''
      }
    }

    case 'vector': {
      return {
        tag: 'Rect',
        ...base,
        name: `[Vector] ${node.name || ''}`
      }
    }

    case 'boolean':
    case 'boolean_operation': {
      const element = {
        tag: 'Group',
        ...base,
        name: `[Boolean] ${node.name || ''}`,
        children: []
      }
      if (node.children) {
        node.children.forEach((child) => {
          const childEl = convertFigNativeNode(child)
          if (childEl) element.children.push(childEl)
        })
      }
      return element
    }

    default:
      console.warn(`Figma .fig 节点类型未支持: ${node.type} (${node.name})`)
      return null
  }
}

/**
 * 解析 Figma 文件数据（自动检测格式）
 * 支持两种格式：
 *   1. Figma REST API 返回的 JSON（大写 type，absoluteBoundingBox，fills 数组等）
 *   2. .fig 原生导出格式（小写 type，直接 x/y/width/height，fill 为字符串等）
 *
 * @param {Object} figmaData - Figma 数据
 * @param {Object} options - 解析选项
 * @param {string} options.nodeId - 指定导入的节点 ID（可选）
 * @returns {Array} Leafer 元素数据数组
 */
export function parseFigmaFile(figmaData, options = {}) {
  if (!figmaData) {
    throw new Error('无效的 Figma 数据')
  }

  // 检测 .fig 原生格式
  if (isFigNativeFormat(figmaData)) {
    return parseFigNativeFile(figmaData, options)
  }

  // REST API 格式
  const document = figmaData.document || figmaData

  if (!document.children) {
    throw new Error('Figma 数据中未找到页面内容')
  }

  const elements = []

  if (options.nodeId) {
    const targetNode = findNodeById(document, options.nodeId)
    if (targetNode) {
      const el = convertNode(targetNode)
      if (el) elements.push(el)
    }
    return elements
  }

  document.children.forEach((page) => {
    if (page.type === 'CANVAS' || page.type === 'PAGE') {
      if (page.children) {
        page.children.forEach((child) => {
          const el = convertNode(child)
          if (el) elements.push(el)
        })
      }
    } else {
      const el = convertNode(page)
      if (el) elements.push(el)
    }
  })

  return elements
}

/**
 * 解析 .fig 原生导出格式
 */
function parseFigNativeFile(figmaData, options = {}) {
  const elements = []

  if (options.nodeId) {
    const targetNode = findNodeById(figmaData, options.nodeId)
    if (targetNode) {
      const el = convertFigNativeNode(targetNode)
      if (el) elements.push(el)
    }
    return elements
  }

  // 顶层有 children（文件级别）
  if (figmaData.children) {
    figmaData.children.forEach((child) => {
      const el = convertFigNativeNode(child)
      if (el) elements.push(el)
    })
  } else {
    // 单个节点
    const el = convertFigNativeNode(figmaData)
    if (el) elements.push(el)
  }

  return elements
}

/**
 * 通过 Figma REST API 获取文件数据
 * @param {string} fileKey - Figma 文件 Key（URL 中的部分）
 * @param {string} token - Figma Personal Access Token
 * @param {string} nodeId - 可选，指定节点 ID
 * @returns {Promise<Object>} Figma 文件数据
 */
export async function fetchFigmaFile(fileKey, token, nodeId) {
  let url = `https://api.figma.com/v1/files/${fileKey}`
  if (nodeId) {
    url += `?ids=${encodeURIComponent(nodeId)}`
  }

  const response = await fetch(url, {
    headers: {
      'X-Figma-Token': token
    }
  })

  if (!response.ok) {
    if (response.status === 403) {
      throw new Error('Figma Token 无效或无权限访问该文件')
    }
    if (response.status === 404) {
      throw new Error('未找到该 Figma 文件，请检查文件 Key')
    }
    throw new Error(`Figma API 请求失败: ${response.status}`)
  }

  return response.json()
}

/**
 * 从 Figma URL 中提取文件 Key
 * 支持格式:
 *   https://www.figma.com/file/XXXXX/...
 *   https://www.figma.com/design/XXXXX/...
 */
export function extractFigmaFileKey(url) {
  const match = url.match(/figma\.com\/(?:file|design)\/([a-zA-Z0-9]+)/)
  return match ? match[1] : null
}

/**
 * 从 Figma URL 中提取节点 ID
 * 支持格式: ?node-id=X-Y 或 ?node-id=X:Y
 */
export function extractFigmaNodeId(url) {
  const match = url.match(/node-id=([^&]+)/)
  if (!match) return null
  return decodeURIComponent(match[1]).replace('-', ':')
}

/**
 * 递归查找指定 ID 的节点
 */
function findNodeById(node, targetId) {
  if (node.id === targetId) return node
  if (node.children) {
    for (const child of node.children) {
      const found = findNodeById(child, targetId)
      if (found) return found
    }
  }
  return null
}
