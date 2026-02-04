import { createStore } from 'vuex'

export default createStore({
  state: {
    // 画布是否就绪
    canvasReady: false,
    // 图层列表 (扁平化或树形，这里简化为顶层元素列表)
    layers: [],
    // 当前选中的图层 ID 列表
    selectedLayerIds: []
  },
  mutations: {
    setCanvasReady(state, payload) {
      state.canvasReady = payload
    },
    setLayers(state, payload) {
      state.layers = payload
    },
    setSelectedLayerIds(state, payload) {
      state.selectedLayerIds = payload
    }
  },
  actions: {},
  modules: {}
})
