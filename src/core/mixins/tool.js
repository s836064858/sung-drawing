import { Text, Image, Rect, Ellipse, Polygon } from 'leafer-ui'

export const toolMixin = {
  setMode(mode) {
    this.mode = mode

    // 根据模式调整光标或编辑器状态
    if (mode === 'text') {
      this.app.cursor = 'text'
      this.app.editor.cancel() // 取消当前选中
      this.app.editor.visible = true
      this.app.editor.hittable = true
      this.app.tree.hitChildren = true
    } else if (['rect', 'ellipse', 'diamond'].includes(mode)) {
      this.app.cursor = 'crosshair'
      this.app.editor.cancel()
      this.app.editor.visible = false
      this.app.editor.hittable = false
      this.app.tree.hitChildren = true
    } else {
      this.app.cursor = 'auto'
      this.app.editor.visible = true
      this.app.editor.hittable = true
      this.app.tree.hitChildren = true
    }

    // 触发模式变更回调
    if (this.callbacks.onModeChange) {
      this.callbacks.onModeChange(mode)
    }
  },

  /**
   * 创建形状
   */
  createShape(type, x, y) {
    let shape = null
    if (type === 'rect') {
      shape = new Rect({
        x: x,
        y: y,
        width: 0,
        height: 0,
        fill: '#32cd79',
        editable: true,
        draggable: true,
        cornerRadius: 10,
        name: '矩形'
      })
    } else if (type === 'ellipse') {
      shape = new Ellipse({
        x: x,
        y: y,
        width: 0,
        height: 0,
        fill: '#ffff00',
        editable: true,
        draggable: true,
        name: '圆形'
      })
    } else if (type === 'diamond') {
      // 菱形使用多边形，初始化时只需设置基本属性，具体点在 move 中计算
      shape = new Polygon({
        x: x,
        y: y,
        width: 0,
        height: 0,
        fill: '#0000ff',
        editable: true,
        draggable: true,
        points: [], // 初始空点
        name: '菱形'
      })
    }

    if (shape) {
      this.app.tree.add(shape)
    }
    return shape
  },

  /**
   * 添加图片
   */
  addImage(url, options = {}) {
    const image = new Image({
      url: url,
      x: options.x || 100,
      y: options.y || 100,
      editable: true,
      draggable: true,
      name: '图片'
    })
    this.app.tree.add(image)
    this.app.editor.select(image)
    return image
  },

  /**
   * 添加文字 (内部调用)
   */
  addText(x, y) {
    // 根据当前缩放比例调整字号，确保视觉大小一致
    const scale = this.app.tree.scaleX || 1
    const fontSize = 24 / scale

    const text = new Text({
      x: x,
      y: y,
      text: '双击编辑文字',
      fill: '#333',
      fontSize: fontSize,
      editable: true,
      draggable: true
    })
    this.app.tree.add(text)
    // 自动选中新添加的元素
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
