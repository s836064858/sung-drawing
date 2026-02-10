/**
 * 元素类型相关常量和工具函数
 */

// 容器类型元素（可以包含子元素）
export const CONTAINER_TAGS = new Set(['Frame', 'Box', 'Group'])

// 判断是否为容器类型
export const isContainerTag = (tag) => CONTAINER_TAGS.has(tag)

// 元素类型图标映射
export const TYPE_ICON_MAP = {
  Rect: 'ri-rectangle-line',
  Ellipse: 'ri-circle-line',
  Polygon: 'ri-vip-diamond-line',
  Text: 'ri-text',
  Frame: 'ri-layout-line',
  Group: 'ri-group-line',
  Box: 'ri-checkbox-blank-line',
  Image: 'ri-image-line',
  Line: 'ri-subtract-line',
  Arrow: 'ri-arrow-right-line'
}

// 获取元素类型图标
export const getTypeIcon = (type) => TYPE_ICON_MAP[type] || 'ri-file-line'
