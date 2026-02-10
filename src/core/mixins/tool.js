import { Text, Image, Rect, Ellipse, Polygon, Frame, Line } from 'leafer-ui'
import { Arrow } from '@leafer-in/arrow'
import { setupFrameLabel } from '../utils/frame-helper'

// 绘制模式的通用配置
const DRAWING_MODE_CONFIG = {
  cursor: 'crosshair',
  editorVisible: false,
  editorHittable: false,
  hitChildren: false
}

// 模式配置：绘制模式共享同一份配置
const DRAWING_MODES = ['rect', 'ellipse', 'diamond', 'frame', 'line', 'arrow', 'pen']

const MODE_CONFIGS = {
  ...Object.fromEntries(DRAWING_MODES.map((mode) => [mode, DRAWING_MODE_CONFIG])),
  text: {
    cursor: 'text',
    editorVisible: true,
    editorHittable: true,
    hitChildren: false
  },
  select: {
    cursor: 'auto',
    editorVisible: true,
    editorHittable: true,
    hitChildren: true
  },
  move: {
    cursor: 'grab',
    editorVisible: false,
    editorHittable: false,
    hitChildren: false
  }
}

// 形状创建配置（提到模块顶层，避免每次调用都重新创建）
const SHAPE_CONFIGS = {
  rect: {
    class: Rect,
    props: { fill: '#32cd79', cornerRadius: 10, name: '矩形' }
  },
  ellipse: {
    class: Ellipse,
    props: { fill: '#ffff00', name: '圆形' }
  },
  diamond: {
    class: Polygon,
    props: { fill: '#0000ff', points: [], name: '菱形' }
  },
  frame: {
    class: Frame,
    props: { fill: '#ffffff', stroke: '#e0e0e0', strokeWidth: 1, cornerRadius: 8, overflow: 'show' }
  },
  line: {
    class: Line,
    props: { stroke: '#333333', strokeWidth: 2, name: '直线' }
  },
  arrow: {
    class: Arrow,
    props: { stroke: '#32cd79', strokeWidth: 3, name: '箭头' }
  },
  pen: {
    class: Line,
    props: { stroke: '#333333', strokeWidth: 2, strokeJoin: 'round', strokeCap: 'round', name: '钢笔' }
  }
}

// 线条类型（使用 points 方式创建）
const LINE_TYPES = new Set(['line', 'arrow', 'pen'])

// fontSize 的安全范围
const MIN_FONT_SIZE = 8
const MAX_FONT_SIZE = 120

export const toolMixin = {
  setMode(mode) {
    this.mode = mode

    const config = MODE_CONFIGS[mode] || MODE_CONFIGS.select

    this.app.cursor = config.cursor
    this.app.editor.visible = config.editorVisible
    this.app.editor.hittable = config.editorHittable
    this.app.tree.hitChildren = config.hitChildren

    const moveConfig = this.app.tree.config.move
    const isDragMode = mode === 'move'
    if (moveConfig) {
      moveConfig.drag = isDragMode
    } else {
      this.app.tree.config.move = { drag: isDragMode }
    }

    if (mode !== 'select') {
      this.app.editor.cancel()
    }

    this.callbacks.onModeChange?.(mode)
  },

  /**
   * 创建形状
   */
  createShape(type, x, y) {
    const config = SHAPE_CONFIGS[type]
    if (!config) return null

    if (LINE_TYPES.has(type)) {
      return this._createLineShape(config, type, x, y)
    }
    return this._createBoxShape(config, type, x, y)
  },

  /**
   * 创建线条类型形状（line/arrow/pen）
   */
  _createLineShape(config, type, x, y) {
    const points = type === 'pen' ? [x, y] : [x, y, x, y]
    const line = new config.class({
      points,
      editable: true,
      draggable: true,
      ...config.props
    })
    if (line.innerId) {
      line.name = `${config.props.name} ${line.innerId}`
    }
    this.app.tree.add(line)
    return line
  },

  /**
   * 创建矩形类型形状（rect/ellipse/diamond/frame）
   */
  _createBoxShape(config, type, x, y) {
    const shape = new config.class({
      x,
      y,
      width: 0,
      height: 0,
      editable: true,
      draggable: true,
      ...config.props
    })

    if (type === 'frame') {
      setupFrameLabel(shape)
    } else if (shape.innerId) {
      shape.name = `${config.props.name} ${shape.innerId}`
    }

    this.app.tree.add(shape)
    return shape
  },

  /**
   * 计算适配视口的尺寸和位置
   * @param {number} origWidth 原始宽度
   * @param {number} origHeight 原始高度
   * @param {object} options 可选的 { x, y } 指定位置
   * @returns {{ x, y, width, height }}
   */
  fitToViewport(origWidth, origHeight, options = {}) {
    const tree = this.app.tree
    const { width: appWidth, height: appHeight } = this.app
    const scaleX = tree.scaleX || 1
    const scaleY = tree.scaleY || 1

    const viewport = {
      x: -tree.x / scaleX,
      y: -tree.y / scaleY,
      width: appWidth / scaleX,
      height: appHeight / scaleY
    }

    let width = origWidth
    let height = origHeight

    // 尺寸适配：大于视口 80% 时等比缩放
    const maxW = viewport.width * 0.8
    const maxH = viewport.height * 0.8

    if (width > maxW || height > maxH) {
      const ratio = Math.min(maxW / width, maxH / height)
      width *= ratio
      height *= ratio
    }

    // 位置适配
    const x = options.x ?? viewport.x + (viewport.width - width) / 2
    const y = options.y ?? viewport.y + (viewport.height - height) / 2

    return { x, y, width, height }
  },

  /**
   * 添加图片
   */
  addImage(url, options = {}) {
    this.resetPasteOffset()

    const img = new window.Image()
    img.src = url

    img.onload = () => {
      const { x, y, width, height } = this.fitToViewport(img.width, img.height, options)

      const image = new Image({
        url,
        x,
        y,
        width,
        height,
        editable: true,
        draggable: true,
        name: '图片'
      })
      if (image.innerId) {
        image.name = `图片 ${image.innerId}`
      }
      this.app.tree.add(image)
      this.app.editor.select(image)
      if (this.recordState) {
        this.recordState('add-image')
      }
    }

    img.onerror = () => {
      console.error('图片加载失败:', url)
      this.callbacks.onError?.('图片加载失败')
    }
  },

  /**
   * 添加文字
   */
  addText(x, y) {
    this.resetPasteOffset()

    const scale = this.app.tree.scaleX || 1
    const fontSize = Math.min(Math.max(24 / scale, MIN_FONT_SIZE), MAX_FONT_SIZE)

    const text = new Text({
      x,
      y,
      text: '双击编辑文字',
      fill: '#333',
      fontSize,
      editable: true,
      draggable: true,
      fontFamily: 'SimHei, STHeiti, sans-serif'
    })

    this.app.tree.add(text)
    this.app.editor.select(text)
    if (this.recordState) {
      this.recordState('add-text')
    }
    return text
  },

  /**
   * 清空画布（同时重置关联状态）
   */
  clear() {
    this.app.tree.clear()

    // 重置关联状态
    this.clipboard = []
    this.resetPasteOffset()
    if (this.app.editor) {
      this.app.editor.cancel()
    }
    if (this.initHistory) {
      this.initHistory()
    }
  }
}
