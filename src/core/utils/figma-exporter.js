/**
 * Leafer 元素到 Figma JSON 转换器
 * 用于将画布内容导出为 Figma 兼容的 JSON 格式
 */

/**
 * 将 Leafer 元素转换为 Figma 节点结构
 * @param {Object} element Leafer 元素
 * @returns {Object} Figma 节点对象
 */
export function convertToFigma(element) {
  if (!element) return null

  // 基础属性
  const figmaNode = {
    id: element.innerId || `node-${Math.random().toString(36).substr(2, 9)}`,
    name: element.name || element.tag || 'Layer',
    visible: element.visible !== false,
    opacity: element.opacity !== undefined ? element.opacity : 1,
    blendMode: 'PASS_THROUGH',
    isMask: false,
    isMaskOutline: false,
    // 变换属性
    x: element.x || 0,
    y: element.y || 0,
    width: element.width || 0,
    height: element.height || 0,
    rotation: element.rotation || 0
  }

  // 类型映射与特定属性处理
  switch (element.tag) {
    case 'Rect':
      figmaNode.type = 'RECTANGLE'
      if (element.cornerRadius) {
        figmaNode.cornerRadius = typeof element.cornerRadius === 'number' ? element.cornerRadius : element.cornerRadius[0]
      }
      break
    
    case 'Ellipse':
      figmaNode.type = 'ELLIPSE'
      break
      
    case 'Text':
      figmaNode.type = 'TEXT'
      figmaNode.characters = element.text || ''
      figmaNode.style = {
        fontFamily: element.fontFamily || 'Inter',
        fontPostScriptName: null,
        fontWeight: mapFontWeight(element.fontWeight),
        fontSize: element.fontSize || 12,
        textAlignHorizontal: mapTextAlign(element.textAlign),
        textAlignVertical: mapVerticalAlign(element.verticalAlign),
        letterSpacing: element.letterSpacing || 0,
        lineHeightPx: typeof element.lineHeight === 'number' ? element.lineHeight : (element.fontSize || 12) * 1.2,
      }
      break
      
    case 'Frame':
      figmaNode.type = 'FRAME'
      figmaNode.clipsContent = element.overflow === 'hidden'
      // Frame 背景色通常也通过 fills 表达，但 Figma 也有 backgroundColor 属性
      if (element.fill) {
        const color = parseColor(element.fill)
        if (color) {
          figmaNode.backgroundColor = { r: color.r, g: color.g, b: color.b, a: color.a }
        }
      }
      break
      
    case 'Group':
      figmaNode.type = 'GROUP'
      break
      
    case 'Line':
      figmaNode.type = 'LINE'
      break
      
    case 'Star':
      figmaNode.type = 'STAR'
      break
      
    case 'Polygon':
      figmaNode.type = 'REGULAR_POLYGON'
      break
      
    default:
      // 默认为矩形，或者如果不支持则忽略
      figmaNode.type = 'RECTANGLE'
  }

  // 填充属性 (Group 通常没有填充)
  if (element.tag !== 'Group' && element.fill) {
    figmaNode.fills = []
    // 目前仅支持纯色填充
    if (typeof element.fill === 'string') {
      const color = parseColor(element.fill)
      if (color) {
        figmaNode.fills.push({
          type: 'SOLID',
          visible: true,
          opacity: color.a,
          blendMode: 'NORMAL',
          color: { r: color.r, g: color.g, b: color.b }
        })
      }
    } else if (typeof element.fill === 'object' && element.fill.type === 'linear') {
      // 简单的线性渐变支持
      // 这里简化处理，Figma 的渐变结构比较复杂
    }
  } else if (element.tag !== 'Group') {
    // 默认空填充
    figmaNode.fills = []
  }

  // 描边属性
  if (element.stroke) {
    figmaNode.strokes = []
    if (typeof element.stroke === 'string') {
      const color = parseColor(element.stroke)
      if (color) {
        figmaNode.strokes.push({
          type: 'SOLID',
          visible: true,
          opacity: color.a,
          blendMode: 'NORMAL',
          color: { r: color.r, g: color.g, b: color.b }
        })
      }
    }
    figmaNode.strokeWeight = element.strokeWidth || 1
    figmaNode.strokeAlign = mapStrokeAlign(element.strokeAlign)
    
    if (element.dashPattern) {
      figmaNode.strokeDashes = element.dashPattern
    }
  } else {
    figmaNode.strokes = []
  }

  // 阴影与特效
  if (element.shadow) {
    figmaNode.effects = []
    const shadow = element.shadow
    const color = parseColor(shadow.color || '#000000')
    if (color) {
      figmaNode.effects.push({
        type: shadow.inner ? 'INNER_SHADOW' : 'DROP_SHADOW',
        visible: shadow.visible !== false,
        radius: shadow.blur || 0,
        offset: { x: shadow.x || 0, y: shadow.y || 0 },
        spread: shadow.spread || 0,
        color: { r: color.r, g: color.g, b: color.b, a: color.a },
        blendMode: 'NORMAL'
      })
    }
  }

  // 递归处理子元素
  if (element.children && element.children.length > 0) {
    // 过滤掉内部元素
    const children = element.children.filter(child => !child.isInternal)
    if (children.length > 0) {
      figmaNode.children = children.map(child => convertToFigma(child)).filter(Boolean)
    }
  }

  return figmaNode
}

/**
 * 解析 CSS 颜色为 Figma RGBA (0-1)
 * 支持 hex, rgb, rgba, 颜色名(部分)
 */
function parseColor(colorStr) {
  if (!colorStr || typeof colorStr !== 'string') return null
  
  // 创建一个临时的 canvas context 来解析颜色
  // 这种方式兼容性最好，能解析所有浏览器支持的颜色格式
  try {
    const ctx = document.createElement('canvas').getContext('2d')
    ctx.fillStyle = colorStr
    // 获取解析后的颜色 (通常是 hex 或 rgba 格式)
    const computedColor = ctx.fillStyle
    
    if (computedColor.startsWith('#')) {
      // Hex 格式
      const r = parseInt(computedColor.slice(1, 3), 16) / 255
      const g = parseInt(computedColor.slice(3, 5), 16) / 255
      const b = parseInt(computedColor.slice(5, 7), 16) / 255
      return { r, g, b, a: 1 }
    } else if (computedColor.startsWith('rgba')) {
      // RGBA 格式
      const match = computedColor.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/)
      if (match) {
        return {
          r: parseInt(match[1]) / 255,
          g: parseInt(match[2]) / 255,
          b: parseInt(match[3]) / 255,
          a: match[4] !== undefined ? parseFloat(match[4]) : 1
        }
      }
    } else if (computedColor.startsWith('rgb')) {
       const match = computedColor.match(/rgb?\((\d+),\s*(\d+),\s*(\d+)\)/)
       if (match) {
        return {
          r: parseInt(match[1]) / 255,
          g: parseInt(match[2]) / 255,
          b: parseInt(match[3]) / 255,
          a: 1
        }
      }
    }
    
    // 兜底处理简单 Hex
    if (colorStr.startsWith('#')) {
      let hex = colorStr.slice(1)
      if (hex.length === 3) {
        hex = hex.split('').map(c => c + c).join('')
      }
      if (hex.length === 6) {
        return {
          r: parseInt(hex.slice(0, 2), 16) / 255,
          g: parseInt(hex.slice(2, 4), 16) / 255,
          b: parseInt(hex.slice(4, 6), 16) / 255,
          a: 1
        }
      }
    }
  } catch (e) {
    console.warn('Color parse failed:', colorStr)
  }
  
  return { r: 0, g: 0, b: 0, a: 1 } // 默认黑色
}

function mapTextAlign(align) {
  switch (align) {
    case 'center': return 'CENTER'
    case 'right': return 'RIGHT'
    case 'justify': return 'JUSTIFIED'
    default: return 'LEFT'
  }
}

function mapVerticalAlign(align) {
  switch (align) {
    case 'middle': return 'CENTER'
    case 'bottom': return 'BOTTOM'
    default: return 'TOP'
  }
}

function mapStrokeAlign(align) {
  switch (align) {
    case 'center': return 'CENTER'
    case 'outside': return 'OUTSIDE'
    default: return 'INSIDE'
  }
}

function mapFontWeight(weight) {
  // Figma 使用数值
  if (typeof weight === 'number') return weight
  
  const map = {
    'thin': 100,
    'hairline': 100,
    'extra-light': 200,
    'light': 300,
    'normal': 400,
    'regular': 400,
    'medium': 500,
    'semi-bold': 600,
    'demi-bold': 600,
    'bold': 700,
    'extra-bold': 800,
    'ultra-bold': 800,
    'black': 900,
    'heavy': 900
  }
  
  return map[weight] || 400
}
