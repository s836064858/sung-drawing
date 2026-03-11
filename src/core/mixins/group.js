import { Group } from 'leafer-ui'

export const groupMixin = {
  /**
   * 将选中元素编组
   */
  groupSelected() {
    const list = this.app.editor.list
    if (list.length === 0) return

    // 1. 获取选中元素的共同父级（通常取第一个元素的父级，或者根据层级决定）
    // 为了简化，我们假设主要是在同一层级操作，或者将 Group 放入第一个元素的父级
    // 如果是跨层级多选，Figma 会将 Group 放在层级最浅（视觉最上）的那个元素的父级中
    // 这里我们简单取 list[0].parent
    let parent = list[list.length - 1].parent || this.app.tree
    
    // 找到插入位置：选中元素中索引最大的那个（最上面）
    let insertIndex = parent.children.indexOf(list[list.length - 1])
    
    // 2. 计算所有选中元素的世界包围盒
    // Leafer Editor 的 element 属性本身就是一个包含选中元素的临时 Group (Frame)，可以直接获取它的 worldBoxBounds
    // 但为了保险，我们手动计算一下
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity
    
    list.forEach(node => {
        const bounds = node.worldBoxBounds
        if (bounds.x < minX) minX = bounds.x
        if (bounds.y < minY) minY = bounds.y
        if (bounds.x + bounds.width > maxX) maxX = bounds.x + bounds.width
        if (bounds.y + bounds.height > maxY) maxY = bounds.y + bounds.height
    })
    
    const groupX = minX
    const groupY = minY
    const groupWidth = maxX - minX
    const groupHeight = maxY - minY
    
    // 3. 创建 Group
    const group = new Group({
        name: 'Group',
        editable: true,
        // Group 的宽高通常是自适应的，不需要显式设置，但设置了也没坏处，Leafer 的 Group 默认是容器
        // 关键是位置。我们需要将 World 坐标转换为 Parent 的 Local 坐标
    })

    // 将 Group 添加到 Parent
    // 注意：add 之后，我们需要设置 group 的位置
    parent.add(group, insertIndex)

    // 将 Group 的世界坐标设置为计算出的包围盒左上角
    // 这一步非常关键，需要处理父级的变换
    // 简单方法：利用 Leafer 的 setWorld 方法如果存在，或者手动转换
    // 这里我们先尝试手动转换：
    // 如果 parent 是 tree (World)，则 local = world
    // 如果 parent 是 Frame，则 local = world - frame.world
    // 更严谨的做法是使用 parent.worldToInner(point)
    
    const localPoint = parent.getInnerPoint({ x: groupX, y: groupY })
    group.x = localPoint.x
    group.y = localPoint.y
    
    // 4. 将选中元素移动到 Group 中
    // 需要对列表进行排序，保持原有的层级关系（从下到上）
    // list 通常是按选中顺序，可能不是层级顺序。我们需要按 parent.children 的顺序排序
    const sortedList = [...list].sort((a, b) => {
        return parent.children.indexOf(a) - parent.children.indexOf(b)
    })

    // 这一步会修改 parent.children，所以 sortedList 必须是副本
    sortedList.forEach(node => {
        // 计算 node 相对于 Group 的位置
        // node.worldBoxBounds.x - groupX
        const nodeWorld = node.worldBoxBounds
        const relativeX = nodeWorld.x - groupX
        const relativeY = nodeWorld.y - groupY
        
        // 从原父级移除并添加到 Group
        group.add(node)
        
        // 设置新的相对坐标
        node.x = relativeX
        node.y = relativeY
    })
    
    // 5. 选中新的 Group
    this.app.editor.select(group)
    
    // 6. 记录历史
    this.recordState('group')
    this.syncLayers()
  },

  /**
   * 将选中元素解组
   */
  ungroupSelected() {
    const list = this.app.editor.list
    if (list.length === 0) return

    // 筛选出 Group 类型的元素
    const groups = list.filter(node => node.tag === 'Group')
    if (groups.length === 0) return

    const newSelection = []

    groups.forEach(group => {
        const parent = group.parent
        if (!parent) return
        
        const groupIndex = parent.children.indexOf(group)
        const children = [...group.children] // 复制子元素列表
        
        // 倒序遍历，因为我们要插入到 groupIndex 位置，保持顺序
        // 或者正序遍历，每次插入到 groupIndex + i
        children.forEach((child, index) => {
            // 计算 child 的世界坐标
            const childWorld = child.worldBoxBounds
            
            // 将 child 移动到 parent
            parent.add(child, groupIndex + index)
            
            // 计算 child 相对于 parent 的新坐标
            const localPoint = parent.getInnerPoint({ x: childWorld.x, y: childWorld.y })
            child.x = localPoint.x
            child.y = localPoint.y
            
            newSelection.push(child)
        })
        
        // 删除 Group
        group.remove()
    })
    
    // 选中解散出来的所有子元素
    if (newSelection.length > 0) {
        this.app.editor.select(newSelection)
    }
    
    // 记录历史
    this.recordState('ungroup')
    this.syncLayers()
  }
}
