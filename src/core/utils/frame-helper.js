import { Text, PropertyEvent } from 'leafer-ui'

/**
 * Frame 辅助工具
 */

/**
 * 为 Frame 设置名称标签
 * @param {Frame} frame - Frame 元素
 * @param {string} [customName] - 自定义名称（可选）
 */
export function setupFrameLabel(frame, customName) {
  if (!frame) return

  try {
    // 设置 Frame 名称
    if (!frame.name) {
      frame.name = customName || `Frame ${frame.innerId}`
    }

    // 创建标题标签（显示在 Frame 上方）
    const label = new Text({
      text: frame.name,
      fontSize: 12,
      fill: '#999999',
      x: 0,
      y: -20, // 位于 Frame 上方
      hittable: false, // 不可交互
      editable: false, // 不可编辑
      isInternal: true // 标记为内部元素，在图层面板中隐藏
    })

    frame.add(label)

    // 监听 Frame 名称变化，同步更新标签文本
    frame.on(PropertyEvent.CHANGE, (e) => {
      if (e.attrName === 'name') {
        label.text = e.newValue
      }
    })
  } catch (error) {
    console.error('设置 Frame 标签失败:', error)
  }
}
