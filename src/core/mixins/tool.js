import { Text, Image, Rect, Ellipse, Polygon, Frame, Line } from 'leafer-ui'
import { Arrow } from '@leafer-in/arrow' 

// 模式配置
const MODE_CONFIGS = {
  text: {
    cursor: 'text',
    editorVisible: true,
    editorHittable: true,
    hitChildren: true
  },
  rect: {
    cursor: 'crosshair',
    editorVisible: false,
    editorHittable: false,
    hitChildren: true
  },
  ellipse: {
    cursor: 'crosshair',
    editorVisible: false,
    editorHittable: false,
    hitChildren: true
  },
  diamond: {
    cursor: 'crosshair',
    editorVisible: false,
    editorHittable: false,
    hitChildren: true
  },
  frame: {
    cursor: 'crosshair',
    editorVisible: false,
    editorHittable: false,
    hitChildren: true
  },
  line: {
    cursor: 'crosshair',
    editorVisible: false,
    editorHittable: false,
    hitChildren: true
  },
  arrow: {
    cursor: 'crosshair',
    editorVisible: false,
    editorHittable: false,
    hitChildren: true
  },
  select: {
    cursor: 'auto',
    editorVisible: true,
    editorHittable: true,
    hitChildren: true
  }
}

export const toolMixin = {
  setMode(mode) {
    this.mode = mode

    const config = MODE_CONFIGS[mode] || MODE_CONFIGS.select

    // 应用模式配置
    this.app.cursor = config.cursor
    this.app.editor.visible = config.editorVisible
    this.app.editor.hittable = config.editorHittable
    this.app.tree.hitChildren = config.hitChildren

    // 取消当前选中（除了 select 模式）
    if (mode !== 'select') {
      this.app.editor.cancel()
    }

    // 触发模式变更回调
    this.callbacks.onModeChange?.(mode)
  },

  /**
   * 创建形状
   */
  createShape(type, x, y) {
    const shapeConfigs = {
      rect: {
        class: Rect,
        props: {
          fill: '#32cd79',
          cornerRadius: 10,
          name: '矩形'
        }
      },
      ellipse: {
        class: Ellipse,
        props: {
          fill: '#ffff00',
          name: '圆形'
        }
      },
      diamond: {
        class: Polygon,
        props: {
          fill: '#0000ff',
          points: [],
          name: '菱形'
        }
      },
      frame: {
        class: Frame,
        props: {
          fill: '#ffffff',
          stroke: '#e0e0e0',
          strokeWidth: 1,
          cornerRadius: 8,
          name: 'Frame',
          overflow: 'show'
        }
      },
      line: {
        class: Line,
        props: {
          stroke: '#333333',
          strokeWidth: 2,
          name: '直线'
        }
      },
      arrow: {
        class: Arrow,
        props: {
          stroke: '#32cd79',
          strokeWidth: 3,
          name: '箭头'
        }
      }
    }

    const config = shapeConfigs[type]
    if (!config) return null

    // 直线使用 points 方式创建
    if (type === 'line'||type === 'arrow') {
      const line = new config.class({
        points: [x, y, x, y],
        editable: true,
        draggable: true,
        ...config.props
      })
      this.app.tree.add(line)
      return line
    }


    const shape = new config.class({
      x,
      y,
      width: 0,
      height: 0,
      editable: true,
      draggable: true,
      ...config.props
    })

    this.app.tree.add(shape)
    return shape
  },

  /**
   * 添加图片
   */
  addImage(url, options = {}) {
    // 使用原生的 Image 对象预加载以获取尺寸
    const img = new window.Image()
    img.src = url
    img.onload = () => {
      // 获取视口信息
      const tree = this.app.tree
      const { width: appWidth, height: appHeight } = this.app
      const scaleX = tree.scaleX || 1
      const scaleY = tree.scaleY || 1

      // 视口在世界坐标系下的范围
      const viewport = {
        x: -tree.x / scaleX,
        y: -tree.y / scaleY,
        width: appWidth / scaleX,
        height: appHeight / scaleY
      }

      let width = img.width
      let height = img.height

      // 1. 尺寸适配：如果图片大于视口的 80%，则等比缩放
      const maxW = viewport.width * 0.8
      const maxH = viewport.height * 0.8

      if (width > maxW || height > maxH) {
        const ratio = Math.min(maxW / width, maxH / height)
        width *= ratio
        height *= ratio
      }

      // 2. 位置适配
      let x = options.x
      let y = options.y

      if (x === undefined || y === undefined) {
        // 如果未指定位置，居中显示
        x = viewport.x + (viewport.width - width) / 2
        y = viewport.y + (viewport.height - height) / 2
      }

      const image = new Image({
        url: url,
        x: x,
        y: y,
        width: width,
        height: height,
        editable: true,
        draggable: true,
        name: '图片'
      })
      this.app.tree.add(image)
      this.app.editor.select(image)
    }
  },

  /**
   * 添加文字
   */
  addText(x, y) {
    const scale = this.app.tree.scaleX || 1
    const fontSize = 24 / scale

    const text = new Text({
      x,
      y,
      text: '双击编辑文字',
      fill: '#333',
      fontSize,
      editable: true,
      draggable: true
    })

    this.app.tree.add(text)
    this.app.editor.select(text)
    return text
  },

  /**
   * 清空画布
   */
  clear() {
    this.app.tree.clear()
  }
}
