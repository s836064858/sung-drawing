import { Text, Image, Rect, Ellipse, Polygon, Frame, Line, PropertyEvent } from 'leafer-ui'
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
  pen: {
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
  },
  move: {
    cursor: 'grab',
    editorVisible: false,
    editorHittable: false,
    hitChildren: false
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

    if (this.app.tree.config.move) {
      this.app.tree.config.move.drag = mode === 'move' ? true : false
    } else {
      this.app.tree.config.move = { drag: mode === 'move' ? true : false }
    }

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
      },
      pen: {
        class: Line,
        props: {
          stroke: '#333333',
          strokeWidth: 2,
          strokeJoin: 'round',
          strokeCap: 'round',
          name: '钢笔'
        }
      }
    }

    const config = shapeConfigs[type]
    if (!config) return null

    // 直线/箭头/钢笔使用 points 方式创建
    if (type === 'line' || type === 'arrow' || type === 'pen') {
      const points = type === 'pen' ? [x, y] : [x, y, x, y]
      const line = new config.class({
        points,
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

    // 特殊处理 Frame：自动命名并添加标题标签
    if (type === 'frame') {
      // 1. 设置 Frame 名称
      shape.name = `Frame ${shape.innerId}`

      // 2. 创建标题标签 (显示在 Frame 上方)
      const label = new Text({
        text: shape.name,
        fontSize: 12,
        fill: '#999999',
        x: 0,
        y: -20, // 位于 Frame 上方
        hittable: false, // 不可交互
        editable: false, // 不可编辑
        isInternal: true // 标记为内部元素，在图层面板中隐藏
      })
      shape.add(label)

      // 3. 监听 Frame 名称变化，同步更新标签文本
      shape.on(PropertyEvent.CHANGE, (e) => {
        if (e.attrName === 'name') {
          label.text = e.newValue
        }
      })
    }

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
      if (this.recordState) {
        this.recordState('add-image')
      }
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
      draggable: true,
      fontFamily:'SimHei, STHeiti, sans-serif'
    })

    this.app.tree.add(text)
    this.app.editor.select(text)
    if (this.recordState) {
      this.recordState('add-text')
    }
    return text
  },

  /**
   * 清空画布
   */
  clear() {
    this.app.tree.clear()
  }
}
