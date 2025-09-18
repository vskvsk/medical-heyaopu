const state = {
  prescriptionDetail: null,
  medicineData: [],
  activeLabel: '药剂药量',
  activeRegionId: null,
  activateAnnotation: false,
  pendingAnnotationKey: null
}

const mutations = {
  SET_PRESCRIPTION_DETAIL (state, detail) {
    state.prescriptionDetail = detail
  },
  SET_MEDICINE_DATA (state, data) {
    state.medicineData = data
  },
  SET_ACTIVE_LABEL (state, labelValue) {
    state.activeLabel = labelValue
  },
  SET_ACTIVE_REGION_ID (state, regionId) {
    state.activeRegionId = regionId
  },
  SET_ACTIVATE_ANNOTATION (state, { active, pendingKey }) {
    state.activateAnnotation = active
    state.pendingAnnotationKey = pendingKey
  }
}

const actions = {
  setPrescriptionDetail ({ commit }, detail) {
    commit('SET_PRESCRIPTION_DETAIL', detail)
  },
  setMedicineData ({ commit }, data) {
    commit('SET_MEDICINE_DATA', data)
  },
  setActiveLabel ({ commit }, labelValue) {
    commit('SET_ACTIVE_LABEL', labelValue)
  },
  setActiveRegionId ({ commit }, regionId) {
    commit('SET_ACTIVE_REGION_ID', regionId)
  },
  setActivateAnnotation ({ commit }, { active, pendingKey }) {
    commit('SET_ACTIVATE_ANNOTATION', { active, pendingKey })
  }
}

const getters = {
  getLabelConfigs: state => {
    const defaultConfigs = [
      { value: '药剂药量', background: 'red', list: [] },
      { value: '煎制方法', background: 'blue', list: [] },
      { value: '医嘱', background: 'green', list: [] },
      { value: '医师', background: 'purple', list: [] }
    ]

    if (!state.prescriptionDetail) return defaultConfigs

    // 处理药剂药量数据
    const medicineConfig = defaultConfigs.find(config => config.value === '药剂药量')
    if (medicineConfig && state.medicineData.length > 0) {
      medicineConfig.list = state.medicineData
    }

    // 处理其他标签数据
    if (state.prescriptionDetail.labelList && Array.isArray(state.prescriptionDetail.labelList)) {
      // 先初始化所有非药剂药量标签的 list 为空数组
      defaultConfigs.forEach(config => {
        if (config.value !== '药剂药量') {
          config.list = []
        }
      })

      // 遍历标注数据并追加到对应的 list 中
      state.prescriptionDetail.labelList.forEach(label => {
        const rectangleLabel = label.value.rectanglelabels[0]
        if (rectangleLabel !== '药剂药量') {
          const config = defaultConfigs.find(c => c.value === rectangleLabel)
          if (config) {
            config.list.push({
              key: `label-${label.id}`,
              area: `区域${label.id}`,
              labelId: label.id,
              content: label.content || ''
            })
          }
        }
      })
    }

    return defaultConfigs
  },
  getActiveLabel: state => state.activeLabel,
  getPrescriptionDetail: state => state.prescriptionDetail,
  getMedicineData: state => state.medicineData,
  getActiveRegionId: state => state.activeRegionId,
  getActivateAnnotation: state => state.activateAnnotation,
  getPendingAnnotationKey: state => state.pendingAnnotationKey
}

export default {
  namespaced: true,
  state,
  mutations,
  actions,
  getters
}
