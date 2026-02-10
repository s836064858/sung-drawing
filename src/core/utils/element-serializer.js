/**
 * 元素序列化/反序列化工具
 * 用于复制粘贴、导入导出等场景
 */

import { Rect, Ellipse, Text, Image, Group, Frame, Box, Line, Polygon, Star } from 'leafer-ui'
import { Arrow } from '@leafer-in/arrow'
import { setupFrameLabel } from './frame-helper'

// 支持的元素类型映射
const ELEMENT_TYPE_MAP = {
  Rect,
  Ellipse,
  Text,
  Image,
  Group,
  Frame,
  Box,
  Line,
  Polygon,
  Star,
  Arrow
}

/**
 * 序列化单个元素
 * @param {Object} element Leafer 元素
 * @returns {Object} 序列化后的数据
 */
export function serializeElement(element) {
  if (!element) return null

  try {
    const jsonData = element.toJSON()

    const data = {
      tag: element.tag,
      innerId: element.innerId,
      ...jsonData
    }

    // 处理子元素
    data.children = serializeChildren(element)

    return data
  } catch (error) {
    console.error('序列化元素失败:', error)
    return null
  }
}

/**
 * 序列化子元素列表
 * @param {Object} element 父元素
 * @returns {Array} 子元素数据数组
 */
export function serializeChildren(element) {
  if (!element.children) return []

  try {
    const childrenArray = Array.isArray(element.children)
      ? element.children
      : Array.from(element.children)

    return childrenArray
      .filter((child) => !child.isInternal)
      .map((child) => serializeElement(child))
      .filter(Boolean)
  } catch (error) {
    console.error('序列化子元素失败:', error)
    return []
  }
}

/**
 * 反序列化元素数据
 * @param {Object} data 序列化的数据
 * @returns {Object} Leafer 元素
 */
export function deserializeElement(data) {
  if (!data || !data.tag) return null

  try {
    const ElementClass = ELEMENT_TYPE_MAP[data.tag]
    if (!ElementClass) {
      console.warn(`不支持的元素类型: ${data.tag}`)
      return null
    }

    // 创建新元素（移除内部标记）
    const { innerId, children, _parentFrameId, _isInFrame, ...elementData } = data
    const element = new ElementClass(elementData)

    // 特殊处理 Frame
    if (data.tag === 'Frame') {
      setupFrameLabel(element)
    }

    // 递归创建子元素
    if (children && Array.isArray(children) && children.length > 0) {
      deserializeChildren(element, children)
    }

    return element
  } catch (error) {
    console.error('反序列化元素失败:', error)
    return null
  }
}

/**
 * 反序列化子元素列表
 * @param {Object} parent 父元素
 * @param {Array} children 子元素数据数组
 */
export function deserializeChildren(parent, children) {
  try {
    children.forEach((childData) => {
      if (childData.isInternal) return

      const childElement = deserializeElement(childData)
      if (childElement) {
        parent.add(childElement)
      }
    })
  } catch (error) {
    console.error('反序列化子元素失败:', error)
  }
}

/**
 * 获取元素类型映射
 * @returns {Object} 类型映射对象
 */
export function getElementTypeMap() {
  return ELEMENT_TYPE_MAP
}
