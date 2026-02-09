import { createStore } from 'vuex'

export default createStore({
  state: {
    // 画布是否就绪
    canvasReady: false,
    // 页面列表
    pages: [{ id: 'page-1', name: '页面 1', json: null }],
    // 当前激活的页面 ID
    activePageId: 'page-1',
    // 图层列表 (扁平化或树形，这里简化为顶层元素列表)
    layers: [],
    // 当前选中的图层 ID 列表
    selectedLayerIds: [],
    // 当前悬浮的图层 ID
    hoveredLayerId: null
  },
  mutations: {
    setCanvasReady(state, payload) {
      state.canvasReady = payload
    },
    setPages(state, payload) {
      state.pages = payload
    },
    addPage(state, page) {
      state.pages.push(page)
    },
    updatePage(state, { id, data }) {
      const page = state.pages.find((p) => p.id === id)
      if (page) {
        Object.assign(page, data)
      }
    },
    removePage(state, id) {
      state.pages = state.pages.filter((p) => p.id !== id)
    },
    setActivePageId(state, id) {
      state.activePageId = id
    },
    setLayers(state, payload) {
      state.layers = payload
    },
    setSelectedLayerIds(state, payload) {
      state.selectedLayerIds = payload
    },
    setHoveredLayerId(state, payload) {
      state.hoveredLayerId = payload
    }
  },
  actions: {},
  modules: {}
})
