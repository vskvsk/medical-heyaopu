import request from '@/utils/request'
import { isMockMode } from '@/utils/util'
import { getMockList, mockPrescriptionDetail, mockDrugTypeFatherList, mockDrugTypeSubList, mockDrugMaterialList, mockEnabledDictDataList } from './mock'
import { jwtDecode } from 'jwt-decode'

// 标注系统API接口 - 适配和药铺接口
const labelApi = {
  // 登录相关 - 和药铺接口
  login: '/htai/token/login',

  // 处方相关 - 和药铺接口
  prescriptionList: '/htai/prescribe/photo',
  prescriptionExport: '/label/prescribe/export',
  prescriptionDetail: '/htai/prescribe/load',
  updateImagePrescription: '/htai/prescribe/update',
  getNewCount: '/label/prescribe/getNewCount',

  // 药剂和药材相关
  drugTypeFatherList: '/label/drugType/father_list',
  drugTypeSubList: '/label/drugType/sub_list',
  drugMaterailList: '/label/drugMaterail/list',
  getEnabledDictDataListByType: '/label/dict/getEnabledDictDataListByType?type=prod_method',

  // 保存详情
  savePrescribeDetail: '/label/prescribe/savePrescribeDetail',
  // 小助手-拍照开方-生成电子处方
  robotPrescribeHelperImageSubmit: '/robot/prescribe/helper-image-submit',
  // 获取开方详情
  robotPrescribeGetDetail: '/robot/prescribe/get-detail',

  // 辨病辨证查询
  queryLabel: '/robot/business-label/query-label',

  // 查看方案字典数据
  getPatientViewPlanDict: '/system/dict-data/type',

  // 服药时间和禁忌数据
  getMedicineTimeDict: '/system/dict-data/type',
  getContraindicationDict: '/system/dict-data/type',

  // 获取药剂类型数据
  getDosageFormsData: '/robot/prescribe/get-dosage-forms-data',

  // 获取包装规格列表
  getPackingSizeList: '/robot/prescribe/get-packing-size-list'
}

// 登录 - 适配和药铺接口
export function login (data) {
  // 在开发环境下返回 mock 数据
  if (isMockMode()) {
    return new Promise((resolve) => {
      // 检查用户名和密码是否匹配默认值
      if (data.mobile === '18655350329' && data.password === '123456') {
        resolve({
          code: 0,
          data: {
            accessToken: 'mock-access-token-123456',
            userId: '1',
            username: '18655350329',
            mobile: '18655350329'
          },
          message: 'success'
        })
      } else {
        resolve({
          code: 401,
          data: null,
          message: '用户名或密码错误'
        })
      }
    })
  }

  // 生产环境使用和药铺接口格式
  // 将mobile和password转换为和药铺接口需要的code和pwd
  const requestData = {
    code: data.mobile,
    pwd: data.password
  }

  return request({
    url: labelApi.login,
    method: 'post',
    data: requestData,
    headers: {
      'Content-Type': 'application/json'
    }
  }).then(response => {
    console.log(response, 'response==>')
    // 适配和药铺接口返回格式
    if (response.errcode === 0 && response.data && response.data.access_token) {
      return {
        code: 0,
        data: {
          accessToken: response.data.access_token
        },
        message: response.errmsg || 'success'
      }
    } else {
      return {
        code: response.errcode || 500,
        data: null,
        message: response.errmsg || '登录失败'
      }
    }
  })
}

// 获取处方列表 - 适配和药铺接口
export function getPrescriptionList (parameter) {
  // 在mock环境下返回mock数据
  if (isMockMode()) {
    return new Promise((resolve) => {
      // 使用 mock.js 中的数据生成函数
      getMockList(parameter).then(res => {
        console.log(res, 'res')
        resolve({
          code: 0,
          data: res,
          message: 'success'
        })
      })
    })
  }

  // 转换参数格式以适配和药铺接口
  const requestData = {
    page: parameter.pageNo || 1,
    rows: parameter.pageSize || 10
  }

  // 根据状态参数添加相应的查询条件
  if (parameter.keyword) {
    // 如果关键词是纯数字，可能是处方单号
    if (/^\d+$/.test(parameter.keyword)) {
      requestData.pk_prescribe = parameter.keyword
    } else {
      // 否则作为医生姓名搜索
      requestData.doctor = parameter.keyword
    }
  }

  // 添加时间范围查询（如果需要的话）
  if (parameter.startTime) {
    requestData.created_start = parameter.startTime
  }
  if (parameter.endTime) {
    requestData.created_end = parameter.endTime
  }

  return request({
    url: labelApi.prescriptionList,
    method: 'post',
    headers: {
      'Content-Type': 'application/json',
      'access_token': localStorage.getItem('Access-Token')?.replace('Bearer ', '') || ''
    },
    data: requestData
  }).then(response => {
    // 适配和药铺接口返回格式
    if (response.errcode === 0 && response.data) {
      let prescriptionData = []
      // 检查数据是否是JWT加密的
      if (typeof response.data.data === 'string' && response.data.data.includes('.')) {
        try {
          // 解密JWT数据
          const decoded = jwtDecode(response.data.data)
          prescriptionData = JSON.parse(decoded.body)
          console.log('解密后的处方数据:', prescriptionData)
        } catch (error) {
          console.error('JWT解密失败:', error)
          prescriptionData = []
        }
      } else {
        // 如果不是JWT格式，直接使用原数据
        prescriptionData = response.data.data || []
      }

      const transformedData = {
        list: prescriptionData.map(item => ({
          id: item.pk_prescribe,
          merchantOrderId: item.vbillcode,
          payOrderNo: item.vbillcode,
          createTime: item.creationtime,
          patientName: item.patient,
          patientPhone: item.cellphone,
          doctorName: item.doctor,
          prescriptionStatus: item.fstatusflag_code,
          fstatusflag_name: item.fstatusflag_name, // 添加处方状态名称
          orderStatus: item.ispayment_name,
          priceTotal: parseFloat(item.cost_total || 0),
          isNuclearSide: item.fstatusflag_code === '31', // 根据状态判断是否已核方
          isSign: false // 默认未标注
        })),
        total: response.data.total || 0,
        pageNo: response.data.page || 1,
        pageSize: response.data.rows || 10
      }

      return {
        code: 0,
        data: transformedData,
        message: 'success'
      }
    } else {
      return {
        code: response.errcode || 500,
        data: { list: [], total: 0 },
        message: response.errmsg || '获取列表失败'
      }
    }
  })
}

// 导出处方列表
export function exportPrescriptionList (parameter) {
  return request({
    url: labelApi.prescriptionExport,
    method: 'post',
    data: parameter,
    responseType: 'blob' // 设置响应类型为blob以处理文件下载
  })
}

// 获取开方详情 - 机器人接口（保持原有逻辑，用于获取AI处理后的数据）
export function getRobotPrescribeGetDetail (params) {
  // 在开发环境下返回 mock 数据
  if (isMockMode()) {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          code: 0,
          data: mockPrescriptionDetail,
          message: 'success'
        })
      }, 500) // 模拟网络延迟
    })
  }

  // 生产环境使用真实接口
  // 注意：这个接口可能需要根据实际情况调整，目前保持原有逻辑
  return request({
    url: labelApi.robotPrescribeGetDetail,
    method: 'get',
    params
  })
}

// 获取处方详情 - 适配和药铺接口
export function getPrescriptionDetail (id) {
  // 在开发环境下返回 mock 数据
  if (isMockMode()) {
    return new Promise((resolve) => {
      setTimeout(() => {
        // 转换数据结构为新的四个键值格式
        const originalData = mockPrescriptionDetail
        const transformedData = {
          labelList: originalData.labelList || [],
          prescribeId: originalData.id || '',
          isSign: originalData.isSign || false,
          params: {
            ...originalData,
            // 移除已提取到顶层的字段
            labelList: undefined,
            isSign: undefined
          }
        }
        // 清理params中的undefined值
        Object.keys(transformedData.params).forEach(key => {
          if (transformedData.params[key] === undefined) {
            delete transformedData.params[key]
          }
        })

        resolve({
          code: 0,
          data: transformedData,
          message: 'success'
        })
      }, 500) // 模拟网络延迟
    })
  }

  // 生产环境使用和药铺接口
  const requestData = {
    pk_prescribe: id
  }

  return request({
    url: labelApi.prescriptionDetail,
    method: 'post',
    headers: {
      'Content-Type': 'application/json',
      'access_token': localStorage.getItem('Access-Token')?.replace('Bearer ', '') || ''
    },
    data: requestData
  }).then(response => {
    // 适配和药铺接口返回格式
    if (response.errcode === 0 && response.data) {
      let data = response.data
      // 检查数据是否是JWT加密的
      if (typeof response.data === 'string' && response.data.includes('.')) {
        try {
          // 解密JWT数据
          const decoded = jwtDecode(response.data)
          data = JSON.parse(decoded.body)
          console.log('解密后的处方详情数据:', data)
        } catch (error) {
          console.error('处方详情JWT解密失败:', error)
          data = response.data
        }
      }
      // 转换药材明细数据
      const materialList = (data.Details || []).map(detail => ({
        pkMaterial: detail.pk_materials,
        medicineCode: detail.drug_code,
        medicineName: detail.drug_name,
        drugName: detail.drug_name,
        quantity: detail.drug_quantity,
        dosage: detail.drug_quantity,
        unit: detail.pk_drug_unit_name,
        drugUnitName: detail.pk_drug_unit_name,
        drugProcessingName: detail.pk_drug_processing_name,
        drugProcessing: detail.pk_drug_processing,
        retailPrice: '0' // 和药铺接口中没有价格信息，设为默认值
      }))

      const transformedData = {
        labelList: [], // 和药铺接口中没有标注信息，设为空数组
        prescribeId: data.pk_prescribe,
        isSign: false, // 默认未标注
        params: {
          id: data.pk_prescribe,
          merchantOrderId: data.vbillcode,
          payOrderNo: data.vbillcode,
          createTime: data.creationtime,
          patientName: data.patient || '',
          patientAge: data.age || '',
          patientSex: data.sex === '男' ? 1 : (data.sex === '女' ? 0 : undefined),
          patientPhone: data.cellphone || '',
          doctorName: data.doctor || '',
          doctorAdvice: data.instructions || '',
          // 中医相关信息
          patientChiefComplaint: data.mainsuit || '',
          patientSyndrome: data.syndrome || '',
          diagnose: data.diagnosis || '',
          // 处方用法信息
          dosageForms: data.pk_drugtype || '',
          drugLevel: data.pk_druglevel || '1',
          dosesTotal: parseInt(data.drug_count) || 1,
          dosesDaily: parseInt(data.drug_evyday) || 1,
          dosesEachUseNum: parseInt(data.drug_dosis) || 1,
          // 费用信息
          priceConsult: parseFloat(data.cost_consultation) || 0,
          priceDrug: parseFloat(data.cost_medicinals) || 0,
          priceMake: parseFloat(data.cost_process) || 0,
          postage: parseFloat(data.cost_express) || 0,
          priceTotal: parseFloat(data.cost_total) || 0,
          // 药材列表
          materialList: materialList,
          // 其他信息
          drugstoreMessage: data.additionalremarks || '',
          medicationTime: data.medicat_time || '',
          medicationTaboo: data.medicat_taboo || ''
        }
      }

      return {
        code: 0,
        data: transformedData,
        message: 'success'
      }
    } else {
      return {
        code: response.errcode || 500,
        data: null,
        message: response.errmsg || '获取详情失败'
      }
    }
  })
}

// 更新处方（标注完成）- 适配和药铺接口
export function updateImagePrescription (data) {
  // 在mock环境下返回mock数据
  if (isMockMode()) {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          code: 0,
          data: {
            pk_prescribe: data.pk_prescribe || data.id,
            vbillcode: 'HYF' + Date.now(),
            unixtimestamp: Date.now().toString()
          },
          message: 'success'
        })
      }, 500)
    })
  }

  // 转换数据格式以适配和药铺接口
  const requestData = {
    pk_prescribe: data.pk_prescribe || data.id || data.prescribeId,
    unixtimestamp: data.unixtimestamp || Date.now().toString(),
    fstatusflag: data.fstatusflag || '30', // 默认已付款状态
    doctor: data.doctorName || data.doctor || '',
    patient: data.patientName || data.patient || '',
    cellphone: data.patientPhone || data.cellphone || '',
    sex: data.patientSex === 1 ? '男' : (data.patientSex === 0 ? '女' : ''),
    age: data.patientAge?.toString() || data.age || '',
    // 中医相关信息
    dialectical: data.patientSyndrome || data.dialectical || '',
    mainsuit: data.patientChiefComplaint || data.mainsuit || '',
    symptom: data.symptom || '',
    tonguepulse: data.tonguepulse || '',
    diagnosis: data.diagnose || data.diagnosis || '',
    syndrome: data.patientSyndrome || data.syndrome || '',
    trainofthought: data.trainofthought || '',
    // 处方用法信息
    pk_drugtype: data.dosageForms || data.pk_drugtype || '',
    pk_druglevel: data.drugLevel || data.pk_druglevel || '1',
    drug_count: parseInt(data.dosesTotal) || parseInt(data.drug_count) || 1,
    drug_evyday: parseInt(data.dosesDaily) || parseInt(data.drug_evyday) || 1,
    drug_dosis: parseInt(data.dosesEachUseNum) || parseInt(data.drug_dosis) || 1,
    drug_frequency: parseInt(data.drug_frequency) || 7,
    pk_drugmmode: data.pk_drugmmode || '',
    pk_packmethod: data.pk_packmethod || '',
    pk_packingsize: data.pk_packingsize || '',
    medicat_time: data.medicationTime || data.medicat_time || '',
    medicat_taboo: data.medicationTaboo || data.medicat_taboo || '',
    additionalremarks: data.drugstoreMessage || data.additionalremarks || '',
    instructions: data.doctorAdvice || data.instructions || '',
    isurgent: data.isurgent || 0,
    issecurity: data.issecurity || 0,
    // 费用信息
    cost_consultation: parseFloat(data.priceConsult) || parseFloat(data.cost_consultation) || 0,
    cost_blankfee: parseFloat(data.cost_blankfee) || 0,
    cost_medicinals: parseFloat(data.priceDrug) || parseFloat(data.cost_medicinals) || 0,
    cost_process: parseFloat(data.priceMake) || parseFloat(data.cost_process) || 0,
    cost_express: parseFloat(data.postage) || parseFloat(data.cost_express) || 0,
    cost_total: parseFloat(data.priceTotal) || parseFloat(data.cost_total) || 0,
    // 收件信息
    consignee: data.consignee || '',
    contactnumber: data.contactnumber || '',
    express_province: data.express_province || '',
    express_address: data.express_address || '',
    express_corpname: data.express_corpname || '',
    // 药材明细
    Details: (data.usageDrugs || data.materialList || data.Details || []).map(drug => ({
      pk_materials: drug.medicineCode || drug.pkMaterial || drug.pk_materials,
      drug_origquantity: parseFloat(drug.quantity) || parseFloat(drug.dosage) || parseFloat(drug.drug_origquantity) || 0,
      drug_quantity: parseFloat(drug.quantity) || parseFloat(drug.dosage) || parseFloat(drug.drug_quantity) || 0,
      drug_unit: drug.unitCode || drug.drug_unit || 'DIC2019020026', // 默认单位
      drug_isaccessories: drug.drug_isaccessories || 0,
      drug_processing: drug.drugProcessing || drug.drug_processing || ''
    }))
  }

  return request({
    url: labelApi.updateImagePrescription,
    method: 'post',
    headers: {
      'Content-Type': 'application/json',
      'access_token': localStorage.getItem('Access-Token')?.replace('Bearer ', '') || ''
    },
    data: requestData
  }).then(response => {
    // 适配和药铺接口返回格式
    if (response.errcode === 0) {
      return {
        code: 0,
        data: response.data,
        message: response.errmsg || 'success'
      }
    } else {
      return {
        code: response.errcode || 500,
        data: null,
        message: response.errmsg || '更新失败'
      }
    }
  })
}

// 获取一级药剂列表
export function getDrugTypeFatherList () {
  // 在mock环境下返回mock数据
  if (isMockMode()) {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(mockDrugTypeFatherList)
      }, 300) // 模拟网络延迟
    })
  }

  // 生产环境使用真实接口
  return request({
    url: labelApi.drugTypeFatherList,
    method: 'get'
  })
}

// 获取二级药剂列表
export function getDrugTypeSubList (fatherDrugType) {
  // 在mock环境下返回mock数据
  if (isMockMode()) {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(mockDrugTypeSubList)
      }, 300) // 模拟网络延迟
    })
  }

  // 生产环境使用真实接口
  return request({
    url: labelApi.drugTypeSubList,
    method: 'get',
    params: { fatherDrugType }
  })
}

// 获取药材列表
export function getDrugMaterialList (data) {
  // 在mock环境下返回mock数据
  if (isMockMode()) {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(mockDrugMaterialList)
      }, 300) // 模拟网络延迟
    })
  }

  // 生产环境使用真实接口
  return request({
    url: labelApi.drugMaterailList,
    method: 'post',
    data,
    headers: {
      'Content-Type': 'application/json'
    }
  })
}

// 保存标注详情
export function savePrescribeDetail (data) {
  // 根据用户要求调整参数结构为四个键值
  const requestData = {
    id: data.id || data.prescribeId, // 使用prescribeId作为主要标识符，如果没有则使用id
    labelList: data.labelList || [],
    prescribeId: data.id || data.prescribeId, // 确保prescribeId有值
    isSign: data.isSign || false,
    params: {
      imgType: data.imgType,
      materialList: data.materialList || data.usageDrugs?.map(drug => ({
        pkMaterial: drug.medicineCode || drug.id || '',
        drugName: drug.medicineName || drug.drugForshort || '',
        dosage: drug.quantity || '',
        drugUnitName: drug.unit || '',
        drugPrice: drug.retailPrice || '0',
        drugProcessingName: drug.processMethod || '',
        drugProcessing: drug.drugProcessing || ''
      })) || [],
      rotationDegree: data.rotationDegree,
      zoomLevel: data.zoomLevel
    }
  }

  return request({
    url: labelApi.savePrescribeDetail,
    method: 'post',
    data: requestData,
    headers: {
      'Content-Type': 'application/json'
    }
  })
}

// 小助手-拍照开方-生成电子处方
export function robotPrescribeHelperImageSubmit (data) {
  // 根据接口文档构造请求参数
  const requestData = {
    id: data.id,
    doctorAdvice: data.doctorAdvice,
    drugstoreMessage: data.drugstoreMessage, // 药房留言
    patientName: data.patientName,
    patientAge: data.patientAge,
    patientSex: data.patientSex,
    // 处理辨病、辩证、治疗思路数据
    patientDiseaseList: data.diseaseList ? data.diseaseList.map(item => item.name || item) : [],
    patientSyndromeList: data.syndromeList ? data.syndromeList.map(item => item.name || item) : [],
    treatmentList: data.treatmentList ? data.treatmentList.map(item => item.name || item) : [],
    prescribeUsage: {
      // 剂型
      dosageForms: data.dosageForms,
      // 药剂份数
      dosesTotal: data.dosesTotal,
      // 每日服用次数
      dosesDaily: data.dosesDaily,
      // 每次服用量
      dosesEachUseNum: data.dosesEachUseNum,
      // 药材等级
      drugLevel: data.drugLevel,
      // 用药方法
      medicationMethod: data.medicationMethod,
      // 包装方式
      packMethod: data.packMethod,
      // 包装规格
      packingSize: data.packingSize,
      // 预计服用天数
      useDayCount: data.useDayCount || 1,
      // 药材信息
      materialList: data.usageDrugs?.map(drug => ({
        pkMaterial: drug.medicineCode,
        dosage: parseFloat(drug.quantity),
        drugProcessing: drug.drugProcessing
      })) || [],
      // 辅料 膏方必填
      accessoriesList: data.accessoriesList || []
    },
    labeled: data.labeled,
    verified: data.verified,
    // 随访信息
    medicine: {
      followUpContent: data.followUpContent || '注意饮食',
      medicationEndDelivery: data.medicationEndDelivery || false
    },
    // 病历信息
    // medicalRecord: {
    //   content: data.medicalRecordContent || '注意饮食',
    //   version: data.medicalRecordVersion || '1'
    // },
    patientViewPlan: data.patientViewPlan || '',
    // 传递疾病标签列表字段
    illnessLabelList: data.illnessLabelList || []
  }

  return request({
    url: labelApi.robotPrescribeHelperImageSubmit,
    method: 'post',
    data: requestData,
    headers: {
      'Content-Type': 'application/json'
    }
  })
}

// 获取加工工艺典数据列表
export function getEnabledDictDataListByType (type) {
  // 在mock环境下返回mock数据
  if (isMockMode()) {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(mockEnabledDictDataList)
      }, 300) // 模拟网络延迟
    })
  }

  // 生产环境使用真实接口
  return request({
    url: labelApi.getEnabledDictDataListByType,
    method: 'get',
    params: { type }
  })
}

// 查询新增的开方数量
export function getNewCount () {
  return request({
    url: labelApi.getNewCount,
    method: 'get'
  })
}

// 查询辨病辨证标签
export function queryLabel (type, keyword) {
  // 在mock环境下返回mock数据
  if (isMockMode()) {
    return new Promise((resolve) => {
      setTimeout(() => {
        // 根据type返回不同的mock数据
        let mockData = []
        if (type === 2) { // 辨病
          mockData = [
            '痛症',
            '心下痠',
            '痰气互结中焦',
            '气虚',
            '干血疨',
            '虚劳'
          ].filter(item => !keyword || item.includes(keyword))
        } else if (type === 3) { // 辨证
          mockData = [
            '气阴两伤',
            '阳虚',
            '阴虚火旺',
            '气滑血瓶',
            '气血两虚',
            '血瓶血滑'
          ].filter(item => !keyword || item.includes(keyword))
        }

        resolve({
          code: 0,
          data: mockData,
          message: 'success'
        })
      }, 300) // 模拟网络延迟
    })
  }

  // 生产环境使用真实接口
  return request({
    url: labelApi.queryLabel,
    method: 'get',
    params: { type, keyword }
  })
}

// 获取查看方案字典数据
export function getPatientViewPlanDict () {
  // 在mock环境下返回mock数据
  if (isMockMode()) {
    return new Promise((resolve) => {
      setTimeout(() => {
        // 模拟查看方案数据
        const mockData = [
          { id: 1501, label: '购药前药材和克数都不可见', value: '3', dictType: 'patient_view_plan' },
          { id: 1555, label: '购药前后都不可见', value: '4', dictType: 'patient_view_plan' }
        ]

        resolve({
          code: 0,
          data: mockData,
          message: 'success'
        })
      }, 300) // 模拟网络延迟
    })
  }

  // 生产环境使用真实接口
  return request({
    url: labelApi.getPatientViewPlanDict,
    method: 'get',
    params: { type: 'patient_view_plan' }
  })
}

// 获取服药时间字典数据
export function getMedicineTimeDict () {
  // 在mock环境下返回mock数据
  if (isMockMode()) {
    return new Promise((resolve) => {
      setTimeout(() => {
        // 模拟服药时间数据
        const mockData = [
          { id: 1554, label: '饭后1小时用', value: '饭后1小时用', dictType: 'medicine_time' },
          { id: 1555, label: '饭前1小时用', value: '饭前1小时用', dictType: 'medicine_time' },
          { id: 1556, label: '饭后半小时用', value: '饭后半小时用', dictType: 'medicine_time' },
          { id: 1557, label: '饭前半小时用', value: '饭前半小时用', dictType: 'medicine_time' },
          { id: 1558, label: '空腹服用', value: '空腹服用', dictType: 'medicine_time' },
          { id: 1559, label: '睡前服用', value: '睡前服用', dictType: 'medicine_time' },
          { id: 1560, label: '晨起服用', value: '晨起服用', dictType: 'medicine_time' }
        ]

        resolve({
          code: 0,
          data: mockData,
          message: 'success'
        })
      }, 300) // 模拟网络延迟
    })
  }

  // 生产环境使用真实接口
  return request({
    url: labelApi.getMedicineTimeDict,
    method: 'get',
    params: { type: 'medicine_time' }
  })
}

// 获取服药禁忌字典数据
export function getContraindicationDict () {
  // 在mock环境下返回mock数据
  if (isMockMode()) {
    return new Promise((resolve) => {
      setTimeout(() => {
        // 模拟服药禁忌数据
        const mockData = [
          { id: 1601, label: '忌油腻', value: '忌油腻', dictType: 'contraindication' },
          { id: 1602, label: '忌辛辣', value: '忌辛辣', dictType: 'contraindication' },
          { id: 1603, label: '忌生冷', value: '忌生冷', dictType: 'contraindication' },
          { id: 1604, label: '忌烟', value: '忌烟', dictType: 'contraindication' },
          { id: 1605, label: '忌酒', value: '忌酒', dictType: 'contraindication' },
          { id: 1606, label: '忌发物', value: '忌发物', dictType: 'contraindication' },
          { id: 1607, label: '忌荤腥', value: '忌荤腥', dictType: 'contraindication' },
          { id: 1608, label: '忌刺激性食物', value: '忌刺激性食物', dictType: 'contraindication' },
          { id: 1609, label: '忌光敏性食物', value: '忌光敏性食物', dictType: 'contraindication' }
        ]

        resolve({
          code: 0,
          data: mockData,
          message: 'success'
        })
      }, 300) // 模拟网络延迟
    })
  }

  // 生产环境使用真实接口
  return request({
    url: labelApi.getContraindicationDict,
    method: 'get',
    params: { type: 'contraindication' }
  })
}

// 获取药剂类型数据
export function getDosageFormsData () {
  // 在mock环境下返回mock数据
  if (isMockMode()) {
    return new Promise((resolve) => {
      setTimeout(() => {
        // 模拟药剂类型数据
        const mockData = {
          dosageForms: [
            {
              value: '1',
              label: '汤剂',
              children: [
                { value: '11', label: '普通汤剂' },
                { value: '12', label: '精制汤剂' }
              ]
            },
            {
              value: '2',
              label: '丸剂',
              children: [
                { value: '21', label: '水丸' },
                { value: '22', label: '蜜丸' }
              ]
            }
          ],
          drugLevels: [
            { value: '1', label: '一级' },
            { value: '2', label: '二级' },
            { value: '3', label: '三级' }
          ]
        }

        resolve({
          code: 0,
          data: mockData,
          message: 'success'
        })
      }, 300) // 模拟网络延迟
    })
  }

  // 生产环境使用真实接口
  return request({
    url: labelApi.getDosageFormsData,
    method: 'get'
  })
}

// 获取包装规格列表
export function getPackingSizeList (packMethod) {
  // 在mock环境下返回mock数据
  if (isMockMode()) {
    return new Promise((resolve) => {
      setTimeout(() => {
        // 模拟包装规格数据
        const mockData = [
          { label: '120ml', value: 'DIC2020070005' },
          { label: '150ml', value: 'DIC2021050004' }
        ]

        resolve({
          code: 0,
          data: mockData,
          message: 'success'
        })
      }, 300) // 模拟网络延迟
    })
  }

  // 生产环境使用真实接口
  return request({
    url: labelApi.getPackingSizeList,
    method: 'get',
    params: { packMethod }
  })
}
