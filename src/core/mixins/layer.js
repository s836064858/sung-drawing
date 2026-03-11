import { Rect } from 'leafer-ui'
import { isContainerTag } from '../constants/element-types'
import { serializeElement, deserializeElement, getElementTypeMap } from '../utils/element-serializer'

// 复制粘贴配置
const PASTE_OFFSET_STEP = 20

// 获取元素类型映射（用于 addLayerFromResource）
const ELEMENT_TYPE_MAP = getElementTypeMap()

export const layerMixin = {
  /**
   * 从资源配置创建图层
   * @param {Object} item 资源项配置
   * @param {Number} x 插入位置 x (世界坐标)
   * @param {Number} y 插入位置 y (世界坐标)
   */
  addLayerFromResource(item, x, y) {
    let elementData = item.data

    // 处理 Leafer 导出结构中的顶层 tag
    if (elementData.tag === 'Leafer' && elementData.children && elementData.children.length > 0) {
      // 如果是 Leafer 根节点，通常取其第一个子节点作为实际图层
      elementData = elementData.children[0]
    }

    const createNode = (data) => {
      const { tag, children, ...props } = data
      const ClassName = ELEMENT_TYPE_MAP[tag]

      if (!ClassName) {
        console.warn(`Unknown tag: ${tag}`)
        return null
      }

      // 深拷贝属性
      const node = new ClassName(JSON.parse(JSON.stringify(props)))

      // 默认开启交互，除非明确设置为 false
      if (props.editable !== false) {
        node.editable = true
      }

      if (children && Array.isArray(children)) {
        children.forEach((childData) => {
          const childNode = createNode(childData)
          if (childNode) node.add(childNode)
        })
      }
      return node
    }

    const element = createNode(elementData)

    if (element) {
      // 如果没有指定位置，默认放置在画布中心
      if (x === undefined || y === undefined) {
        element.x = this.app.tree.width / 2 - (element.width || 0) / 2
        element.y = this.app.tree.height / 2 - (element.height || 0) / 2
      } else {
        element.x = x - (element.width || 0) / 2
        element.y = y - (element.height || 0) / 2
      }

      this.app.tree.add(element)
      this.app.editor.select(element)

      // 同步图层列表
      this.syncLayers()

      // 记录历史
      if (this.recordState) {
        this.recordState('add-layer')
      }
    }

    return element
  },

  /**
   * 全选图层
   */
  selectAllLayers() {
    if (!this.app || !this.app.tree) return

    // 获取所有非锁定、非隐藏的可编辑图层
    const selectCandidates = this.app.tree.children.filter((child) => {
      // 排除辅助元素
      if (child.isInternal || child.isFrameLabel || child.tag === 'SimulateElement') return false
      // 排除锁定和隐藏的元素
      if (child.locked || !child.visible) return false
      // 必须是可交互的
      if (!child.hittable) return false
      return true
    })

    if (selectCandidates.length > 0) {
      this.app.editor.select(selectCandidates)
    }
  },

  /**
   * 同步图层列表到外部
   */
  syncLayers() {
    if (!this.callbacks.onLayersChange) return

    const excludedTags = new Set(['SimulateElement'])
    const layers = this.app.tree.children
      .filter((child) => !excludedTags.has(child.tag) && !child.isInternal && !child.isFrameLabel)
      .map((child) => this.formatLayerData(child))
      .reverse()

    this.callbacks.onLayersChange(layers)
  },

  /**
   * 格式化图层数据（支持子图层）
   */
  formatLayerData(child) {
    const layerData = {
      id: child.innerId,
      name: this.getLayerName(child),
      type: child.tag,
      visible: child.visible !== false,
      locked: child.locked === true,
      isInternal: child.isInternal
    }

    // 如果是容器类型（Frame/Box/Group），递归处理子图层
    if (isContainerTag(child.tag) && child.children && child.children.length > 0) {
      layerData.children = child.children
        .filter((subChild) => !subChild.isInternal && !(subChild.data && subChild.data.isFrameLabel))
        .map((subChild) => this.formatLayerData(subChild))
        .reverse()
    }

    return layerData
  },

  /**
   * 获取图层显示名称
   */
  getLayerName(child) {
    if (child.name) return child.name
    if (child.tag === 'Text') {
      return child.text || '文本'
    }
    return child.tag || child.innerId
  },

  /**
   * 上移图层
   */
  moveLayerUp(id) {
    const element = this.findElementById(id)
    if (!element || !element.parent) return

    const parent = element.parent
    const index = parent.children.indexOf(element)

    if (index < parent.children.length - 1) {
      parent.add(element, index + 1)
      this.syncLayers()
      if (this.recordState) this.recordState('move-layer-up')
    }
  },

  /**
   * 下移图层
   */
  moveLayerDown(id) {
    const element = this.findElementById(id)
    if (!element || !element.parent) return

    const parent = element.parent
    const index = parent.children.indexOf(element)

    if (index > 0) {
      parent.add(element, index - 1)
      this.syncLayers()
      if (this.recordState) this.recordState('move-layer-down')
    }
  },

  /**
   * 置顶图层
   */
  moveLayerTop(id) {
    const element = this.findElementById(id)
    if (!element || !element.parent) return

    const parent = element.parent
    parent.add(element)
    this.syncLayers()
    if (this.recordState) this.recordState('move-layer-top')
  },

  /**
   * 置底图层
   */
  moveLayerBottom(id) {
    const element = this.findElementById(id)
    if (!element || !element.parent) return

    const parent = element.parent
    parent.add(element, 0)
    this.syncLayers()
    if (this.recordState) this.recordState('move-layer-bottom')
  },

  /**
   * 重命名图层
   */
  renameLayer(id, name) {
    const element = this.findElementById(id)
    if (element) {
      element.name = name
      this.syncLayers()
      if (this.recordState) this.recordState('rename-layer')
    }
  },

  /**
   * 同步选中状态到外部
   */
  syncSelection() {
    if (!this.callbacks.onSelectionChange) return

    const selectedIds = this.app.editor.list.map((item) => item.innerId)
    this.callbacks.onSelectionChange(selectedIds)
  },

  /**
   * 删除选中的图层
   */
  removeSelectedLayers() {
    const selected = this.app.editor.list
    if (selected.length === 0) return

    // 复制列表，因为 remove 会改变原列表
    const list = [...selected]

    // 取消选择，清除高亮框 (关键修复：先取消选择，再删除)
    this.app.editor.cancel()

    // 清除自定义高亮框
    if (this.highlightShape && this.highlightShape.visible) {
      this.highlightShape.visible = false
    }

    list.forEach((item) => item.remove())
    this.resetPasteOffset()
  },

  /**
   * 选中指定图层
   */
  selectLayer(id) {
    const element = this.findElementById(id)

    if (element) {
      this.app.editor.select(element)
    } else {
      this.app.editor.cancel()
    }

    this.syncSelection()
    this.resetPasteOffset()
  },

  /**
   * 切换图层选中状态（多选）
   */
  toggleLayerSelection(id) {
    const element = this.findElementById(id)
    if (!element) return

    const currentSelection = this.app.editor.list
    const isSelected = currentSelection.some((item) => item.innerId === id)

    if (isSelected) {
      // 取消选中该图层
      const newSelection = currentSelection.filter((item) => item.innerId !== id)
      if (newSelection.length === 0) {
        this.app.editor.cancel()
      } else {
        this.app.editor.select(newSelection)
      }
    } else {
      // 添加到选中列表
      this.app.editor.select([...currentSelection, element])
    }

    this.syncSelection()
    this.resetPasteOffset()
  },

  /**
   * 范围选择图层（Shift 点击）
   */
  selectLayerRange(targetId) {
    const currentSelection = this.app.editor.list
    
    // 如果没有选中任何图层，直接选中目标图层
    if (currentSelection.length === 0) {
      this.selectLayer(targetId)
      return
    }

    // 获取最后一个选中的图层
    const lastSelectedId = currentSelection[currentSelection.length - 1].innerId
    
    // 获取所有图层的扁平列表（包括嵌套图层）
    const flatLayers = this.getFlatLayerList()
    
    // 找到起始和结束索引
    const startIndex = flatLayers.findIndex((l) => String(l.id) === String(lastSelectedId))
    const endIndex = flatLayers.findIndex((l) => String(l.id) === String(targetId))
    
    if (startIndex === -1 || endIndex === -1) {
      this.selectLayer(targetId)
      return
    }

    // 确定范围
    const minIndex = Math.min(startIndex, endIndex)
    const maxIndex = Math.max(startIndex, endIndex)
    
    // 选中范围内的所有图层
    const rangeLayerIds = flatLayers.slice(minIndex, maxIndex + 1).map((l) => l.id)
    const elementsToSelect = rangeLayerIds
      .map((id) => this.findElementById(id))
      .filter((el) => el && !el.locked && el.visible)
    
    if (elementsToSelect.length > 0) {
      this.app.editor.select(elementsToSelect)
    }

    this.syncSelection()
    this.resetPasteOffset()
  },

  /**
   * 获取扁平化的图层列表（用于范围选择）
   */
  getFlatLayerList() {
    const result = []
    
    const flatten = (layers) => {
      layers.forEach((layer) => {
        result.push(layer)
        if (layer.children && layer.children.length > 0) {
          flatten(layer.children)
        }
      })
    }
    
    // 从 Store 获取图层列表（已经是倒序的）
    const layers = this.callbacks.getLayers ? this.callbacks.getLayers() : []
    flatten(layers)
    
    return result
  },

  /**
   * 切换图层可见性
   */
  toggleVisible(id) {
    const element = this.findElementById(id)
    if (element) {
      element.visible = !element.visible

      // 如果隐藏了选中元素，取消其选中状态，否则高亮框会留在原地
      if (!element.visible) {
        const isSelected = this.app.editor.list.some((item) => item.innerId === id)
        if (isSelected) {
          const remainingSelection = this.app.editor.list.filter((item) => item.innerId !== id)
          if (remainingSelection.length === 0) {
            this.app.editor.cancel()
          } else {
            this.app.editor.select(remainingSelection)
          }
        }
      }

      if (this.recordState) this.recordState('toggle-visible')
    }
  },

  /**
   * 切换图层锁定状态
   */
  toggleLock(id) {
    const element = this.findElementById(id)
    if (element) {
      element.locked = !element.locked
      if (this.recordState) this.recordState('toggle-lock')
    }
  },

  /**
   * 删除指定图层
   */
  removeLayer(id) {
    const element = this.findElementById(id)
    if (element) {
      // 检查被删除的元素是否是当前选中的元素（或选中元素的一部分）
      const isSelected = this.app.editor.list.some((item) => item.innerId === id)

      element.remove()

      // 清除高亮框（如果有）
      if (this.highlightShape && this.highlightShape.visible) {
        this.highlightShape.visible = false
      }

      // 如果删除了选中元素，取消选择以清除高亮框
      if (isSelected) {
        // 如果只是多选中的一个被删除，重新计算选中列表会更复杂，
        // 但简单起见，如果删除了选中的元素，我们尝试更新选中状态
        // Leafer Editor 应该会自动处理，但如果有残留，手动取消一下更稳妥

        // 过滤掉已被移除的元素
        const remainingSelection = this.app.editor.list.filter((item) => item.parent)

        if (remainingSelection.length === 0) {
          this.app.editor.cancel()
        } else {
          this.app.editor.select(remainingSelection)
        }
      }

      if (this.recordState) this.recordState('remove-layer')
    }
  },

  /**
   * 图层重排序
   * @param {string} dragId 拖拽元素的ID
   * @param {string} targetId 目标元素的ID
   * @param {string} position 'before' | 'after' | 'inside' (相对于目标元素的位置)
   *
   * 注意：图层列表是倒序显示的 (z-index大的在上面)
   * - position 'before' (视觉上方) -> z-index 更大 -> children 数组中在 target 后面
   * - position 'after' (视觉下方) -> z-index 更小 -> children 数组中在 target 前面
   * - position 'inside' -> 成为 target 的子元素 (target 必须是容器)
   */
  reorderLayer(dragId, targetId, position) {
    const dragLayer = this.findElementById(dragId)
    const targetLayer = this.findElementById(targetId)

    if (!dragLayer || !targetLayer || dragLayer === targetLayer) return

    // 记录原始状态以便撤销（简单起见，这里记录操作名）
    // 实际撤销由历史记录快照处理

    // 计算世界坐标，以便在移动后保持视觉位置不变
    const worldPosition = this.getElementWorldPosition(dragLayer)

    // 移除拖拽元素
    dragLayer.remove()

    if (position === 'inside') {
      // 拖入容器内部
      if (isContainerTag(targetLayer.tag)) {
        // 添加到容器末尾（最上层）
        targetLayer.add(dragLayer)
      } else {
        // 如果目标不是容器，回退到 after
        const parent = targetLayer.parent || this.app.tree
        const index = parent.children.indexOf(targetLayer)
        parent.add(dragLayer, index)
      }
    } else {
      // 拖到目标元素的上方或下方
      const parent = targetLayer.parent || this.app.tree
      const targetIndex = parent.children.indexOf(targetLayer)

      if (targetIndex === -1) {
        parent.add(dragLayer)
      } else {
        const insertIndex = position === 'before' ? targetIndex + 1 : targetIndex
        parent.add(dragLayer, insertIndex)
      }
    }

    // 更新位置以保持视觉一致性
    // 1. 获取新父级的世界坐标
    const newParent = dragLayer.parent
    let parentWorldX = 0
    let parentWorldY = 0

    if (newParent && newParent.tag !== 'App' && newParent.tag !== 'Leafer') {
      const parentWorldPos = this.getElementWorldPosition(newParent)
      parentWorldX = parentWorldPos.x
      parentWorldY = parentWorldPos.y
    }

    // 2. 设置新的本地坐标
    dragLayer.x = worldPosition.x - parentWorldX
    dragLayer.y = worldPosition.y - parentWorldY

    this.syncLayers()
    if (this.recordState) this.recordState('reorder-layer')
  },

  /**
   * 高亮图层 (悬浮时)
   */
  highlightLayer(id) {
    const element = this.findElementById(id)
    if (!element) return

    // 懒加载创建高亮框
    if (!this.highlightShape) {
      this.highlightShape = new Rect({
        stroke: '#836dff',
        strokeWidth: 3,
        fill: null,
        hitChildren: false,
        hittable: false,
        visible: false,
        zIndex: 9999, // 确保在最上层
        isInternal: true // 标记为内部元素，避免被同步/导出
      })
      this.app.sky.add(this.highlightShape)
    }

    // 确保在 sky 层 (防止从 tree 层移动过来或初始化错误)
    if (this.highlightShape.parent !== this.app.sky) {
      this.app.sky.add(this.highlightShape)
    }

    // 获取世界坐标包围盒
    const bounds = element.worldBoxBounds

    // 更新高亮框位置和大小
    this.highlightShape.set({
      x: bounds.x,
      y: bounds.y,
      width: bounds.width,
      height: bounds.height,
      visible: true
    })
  },

  /**
   * 取消高亮
   */
  unhighlightLayer(id) {
    if (this.highlightShape) {
      this.highlightShape.visible = false
    }
  },

  /**
   * 复制选中的图层到剪贴板
   */
  copySelectedLayers() {
    const selected = this.app.editor.list
    if (selected.length === 0) return

    try {
      // 序列化选中的元素，并记录父级关系
      this.clipboard = selected.map((item) => {
        const data = serializeElement(item)

        // 记录父级信息
        if (item.parent && item.parent.tag === 'Frame') {
          data._parentFrameId = item.parent.innerId
          data._isInFrame = true
        }

        return data
      })

      // 重置粘贴偏移计数器
      this.resetPasteOffset()

      // 清除系统剪贴板中的图片内容
      this.clearSystemClipboard()
    } catch (error) {
      console.error('复制图层失败:', error)
    }
  },

  /**
   * 从剪贴板粘贴图层
   */
  pasteLayer() {
    if (!this.clipboard || this.clipboard.length === 0) return

    try {
      // 取消当前选中
      this.app.editor.cancel()

      // 增加偏移量
      this.pasteOffset = (this.pasteOffset || 0) + PASTE_OFFSET_STEP

      // 第一步：创建所有元素并建立映射
      const oldIdToNewElement = new Map() // 原始 innerId -> 新元素
      const elementsToAdd = [] // 需要添加到根节点的元素

      this.clipboard.forEach((data) => {
        const element = this.createElementFromData(data, this.pasteOffset)
        if (element) {
          // 建立原始 ID 到新元素的映射
          if (data.innerId) {
            oldIdToNewElement.set(data.innerId, element)
          }

          // 如果不在 Frame 中，或者是 Frame 本身，标记为需要添加到根节点
          if (!data._isInFrame || data.tag === 'Frame') {
            elementsToAdd.push(element)
          }
        }
      })

      // 第二步：处理 Frame 中的元素，建立父子关系
      this.clipboard.forEach((data) => {
        if (data._isInFrame && data._parentFrameId && data.tag !== 'Frame') {
          const element = oldIdToNewElement.get(data.innerId)
          let parentFrame = oldIdToNewElement.get(data._parentFrameId)

          // 如果在剪贴板中找不到父 Frame，尝试在画布上查找
          if (!parentFrame) {
            parentFrame = this.findElementById(data._parentFrameId)
          }

          if (element && parentFrame) {
            // 将元素添加到对应的 Frame 中
            parentFrame.add(element)
          } else if (element) {
            // 如果找不到父 Frame，添加到根节点
            elementsToAdd.push(element)
          }
        }
      })

      // 第三步：将顶层元素添加到画布
      elementsToAdd.forEach((element) => this.app.tree.add(element))

      // 选中新创建的所有元素
      const allNewElements = Array.from(oldIdToNewElement.values())
      if (allNewElements.length > 0) {
        this.app.editor.select(allNewElements)
      }

      this.syncLayers()
      if (this.recordState) this.recordState('paste-layer')
    } catch (error) {
      console.error('粘贴图层失败:', error)
    }
  },

  /**
   * 复制指定图层（快速复制）
   */
  duplicateLayer(id) {
    const element = this.findElementById(id)
    if (!element) return

    try {
      const data = serializeElement(element)
      const newElement = this.createElementFromData(data, PASTE_OFFSET_STEP)

      if (newElement) {
        // 添加到相同的父级
        const parent = element.parent || this.app.tree
        parent.add(newElement)

        // 选中新元素
        this.app.editor.select(newElement)

        this.syncLayers()
        if (this.recordState) this.recordState('duplicate-layer')
      }
    } catch (error) {
      console.error('复制图层失败:', error)
    }
  },

  /**
   * 从序列化数据创建元素（带偏移）
   * @returns {Object} { element, originalId }
   */
  createElementFromData(data, offset = 0) {
    const element = deserializeElement(data)
    if (element) {
      element.x = (element.x || 0) + offset
      element.y = (element.y || 0) + offset
    }
    return element
  },

  /**
   * 重置粘贴偏移计数器
   */
  resetPasteOffset() {
    this.pasteOffset = 0
  },

  /**
   * 清除系统剪贴板
   */
  clearSystemClipboard() {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText('')
      }
    } catch (err) {
      // 忽略错误，某些浏览器可能不支持
      console.warn('无法清除系统剪贴板:', err)
    }
  }
}
