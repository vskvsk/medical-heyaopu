<template>
  <page-header-wrapper>
    <a-spin :spinning="loading" class="centered-spin">
      <!-- 只有当数据加载完成后才渲染子组件 -->
      <template v-if="isDataReady">
        <!-- 顶部表单 -->
        <DetailForm
          :value="detail"
          :dictionaries="dictionaries"
          @input="handleDetailChange" />

        <!-- 内容区 -->
        <div class="annotation-layout">
          <AnnotationArea
            ref="annotationArea"
            class="annotation-left"
            :detail="detail"
            @update:detail="handleDetailChange"
            @remove-annotation="handleRemoveAnnotation" />
          <MedicineTable
            class="annotation-right"
            :detail="detail"
            :isNuclearSide="isNuclearSide"
            :isSign="isSign"
            :dictionaries="dictionaries"
            @update:detail="handleDetailChange"
            @remove-annotation="handleRemoveAnnotation" />
        </div>
      </template>
    </a-spin>
  </page-header-wrapper>
</template>

<script>
import { getPrescriptionDetail, getDictionaries } from '@/api/annotation'
import { message } from 'ant-design-vue'
import DetailForm from './components/DetailForm.vue'
import MedicineTable from './components/MedicineTable.vue'
import AnnotationArea from './components/AnnotationArea.vue'

export default {
  name: 'VerifyDetail',
  components: {
    DetailForm,
    MedicineTable,
    AnnotationArea
  },
  data () {
    return {
      loading: false,
      isDataReady: false,

      // 是否核方状态，从接口数据获取
      isNuclearSide: false,
      // 是否标注状态，从接口数据获取
      isSign: false,
      // 字典数据
      dictionaries: [],
      detail: {
        // 基础信息
        id: '',
        merchantOrderId: '',
        payOrderNo: '',
        createTime: '',

        // 患者信息
        patientName: '',
        patientAge: undefined,
        patientSex: undefined,
        patientPhone: '',
        patientChiefComplaint: '',
        patientSyndrome: '',

        // 医生信息
        doctorId: undefined,
        doctorName: '',
        doctorType: undefined,
        doctorAdvice: '',

        // 处方信息
        diagnose: '',
        dosageForms: '',
        dosesTotal: 1,
        dosesDaily: 1,
        dosesEachUseNum: 1,
        drugLevel: '1',

        // 费用信息
        priceConsult: 0.00,
        priceDrug: 0.00,
        priceMake: 0.00,
        postage: 0.00,
        priceTotal: 0.00,
        canSetPriceConsult: false, // 是否可以设置诊金

        // 状态信息
        status: 0,
        verified: false,
        labeled: false,
        finished: false,

        // 图片信息
        imgUrls: [],
        labelList: [],
        drugLabelList: [], // 药材标签列表

        // 状态信息
        activeLabel: '药剂药量',
        activeRegionId: null,
        usageDrugs: [],
        imgType: 2,

        // 辨病、辩证、治疗思路数据
        diseaseList: [],
        syndromeList: [],
        treatmentList: [],

        // 查看方案
        patientViewPlan: '',
        illnessLabelList: [],
        drugstoreMessage: '',
        // 处方ID
        prescribeId: ''
      }
    }
  },
  created () {
    // 从路由参数中获取 isNuclearSide
    const isNuclearSide = this.$route.query.isNuclearSide
    // 将字符串转换为布尔值
    this.isNuclearSide = isNuclearSide === 'true' || isNuclearSide === true
    console.log('是否核方状态:', this.isNuclearSide)

    // 加载字典数据
    this.loadDictionaries()
    this.getDetail()
  },
  methods: {
    // 加载字典数据
    async loadDictionaries () {
      try {
        console.log('开始加载字典数据...')
        const res = await getDictionaries()
        console.log('字典数据加载结果:', res)

        if (res.code === 0 && res.data) {
          this.dictionaries = res.data
          console.log('字典数据加载成功:', this.dictionaries)
        } else {
          console.error('字典数据加载失败:', res.message)
          message.error('字典数据加载失败')
        }
      } catch (error) {
        console.error('字典数据加载异常:', error)
        message.error('字典数据加载异常')
      }
    },

    handleDetailChange (newDetail) {
      this.detail = { ...this.detail, ...newDetail }
    },
    getDetail () {
      const id = this.$route.params.id
      this.loading = true
      this.isDataReady = false

      // 只使用 getPrescriptionDetail 接口获取数据
      getPrescriptionDetail(id)
        .then((prescriptionRes) => {
          // 处理处方详情数据
          const prescriptionData = prescriptionRes?.data || null

          if (prescriptionRes.code === 0 && prescriptionData) {
            // 合并两个接口的数据
            const detail = { ...this.detail }

            // 处理医生处方详情数据 - 新结构包含labelList, prescribeId, isSign, params
            if (prescriptionData) {
              // 从新结构中提取数据
              const { labelList, prescribeId, isSign, params } = prescriptionData

              // 设置状态信息
              this.isSign = isSign
              if (params?.isNuclearSide !== undefined) {
                this.isNuclearSide = params.isNuclearSide
              }
              // 基础信息从params中获取
              detail.id = params?.id || prescribeId || detail.id
              detail.prescribeId = prescribeId || params?.id || detail.id
              detail.merchantOrderId = params?.merchantOrderId || detail.merchantOrderId
              detail.payOrderNo = params?.payOrderNo || detail.payOrderNo
              detail.createTime = params?.createTime || detail.createTime
              detail.unixtimestamp = params?.unixtimestamp || detail.unixtimestamp

              // 表单字段
              detail.symptom = params?.symptom || detail.symptom
              detail.dialectical = params?.dialectical || detail.dialectical
              detail.trainofthought = params?.trainofthought || detail.trainofthought
              detail.issecurity = params?.issecurity || detail.issecurity
              detail.instructions = params?.instructions || detail.instructions

              // 患者信息字段
              detail.patientName = params?.patientName || detail.patientName
              detail.patientPhone = params?.patientPhone || detail.patientPhone
              detail.patientAge = params?.patientAge || detail.patientAge
              detail.patientSex = params?.patientSex || detail.patientSex
              detail.drugstoreMessage = params?.drugstoreMessage || detail.drugstoreMessage
              detail.recipeimage = params?.recipeimage || detail.recipeimage

              // 图片信息 - 特殊处理数值字段
              detail.imgType = params?.imgType !== undefined
                ? params.imgType
                : detail.imgType
              detail.rotationDegree = params?.rotationDegree !== undefined
                ? params.rotationDegree
                : detail.rotationDegree
              detail.zoomLevel = params?.zoomLevel !== undefined
                ? params.zoomLevel
                : detail.zoomLevel

              // 保存标注数据
              if (labelList && Array.isArray(labelList)) {
                detail.labelList = labelList
              }

              // 处理药材列表 (drugLabelList)
              if (params?.drugLabelList && Array.isArray(params.drugLabelList)) {
                const drugLabelList = params.drugLabelList.map((drug, index) => ({
                  id: drug.id,
                  prescribeId: drug.prescribeId,
                  key: `medicine-${drug.id}`,
                  area: `区域${index + 1}`,
                  regionId: '',
                  usageId: drug.usageId,
                  editable: false,
                  isNew: false
                }))
                // 暂存药材标签列表，后续与机器人接口数据合并
                detail.drugLabelList = drugLabelList
              }
            }
            const robotData = prescriptionData?.robotData || null
            // 处理机器人处方详情数据
            if (robotData) {
              // 基础信息
              detail.id = robotData.id || detail.id
              detail.merchantOrderId = robotData.orderId || detail.merchantOrderId
              detail.payOrderNo = robotData.prescribeNo || detail.payOrderNo
              console.log('设置药方编号:', robotData.prescribeNo)
              detail.createTime = robotData.createTime || detail.createTime

              // 患者信息
              detail.patientName = robotData.patientName || detail.patientName
              detail.patientAge = robotData.patientAge || detail.patientAge
              // 特殊处理 patientSex，因为 0 是有效值（女性）
              detail.patientSex = robotData.patientSex !== undefined
                ? robotData.patientSex
                : detail.patientSex
              detail.patientPhone = robotData.patientPhone || detail.patientPhone
              detail.patientSyndrome = (robotData.patientSyndromeList || []).join(', ') || detail.patientSyndrome
              detail.illnessLabelList = robotData.illnessLabelList || detail.illnessLabelList || []
              detail.drugstoreMessage = robotData.drugstoreMessage || detail.drugstoreMessage

              // 处理辨病、辩证、治疗思路数据
              if (robotData.patientDiseaseList && Array.isArray(robotData.patientDiseaseList)) {
                detail.diseaseList = robotData.patientDiseaseList.map(name => ({
                  id: `${name}-${Date.now()}`,
                  name: name
                }))
              }

              if (robotData.patientSyndromeList && Array.isArray(robotData.patientSyndromeList)) {
                detail.syndromeList = robotData.patientSyndromeList.map(name => ({
                  id: `${name}-${Date.now()}`,
                  name: name
                }))
              }

              if (robotData.treatmentList && Array.isArray(robotData.treatmentList)) {
                detail.treatmentList = robotData.treatmentList.map(name => ({
                  id: `${name}-${Date.now()}`,
                  name: name
                }))
              }

              // 医生信息
              detail.doctorId = robotData.doctorId || detail.doctorId
              detail.doctorName = robotData.doctorName || detail.doctorName
              detail.doctorType = robotData.doctorTypeMessage || detail.doctorType
              detail.doctorAdvice = robotData.doctorAdvice || detail.doctorAdvice

              // 处方信息
              if (robotData.prescribeUsage) {
                detail.dosageForms = robotData.prescribeUsage.dosageForms || detail.dosageForms
                // 特殊处理数值字段，因为 0 是有效值
                detail.dosesTotal = robotData.prescribeUsage.dosesTotalObject?.value !== undefined
                  ? robotData.prescribeUsage.dosesTotalObject.value
                  : detail.dosesTotal
                detail.dosesDaily = robotData.prescribeUsage.dosesDailyObject?.value !== undefined
                  ? robotData.prescribeUsage.dosesDailyObject.value
                  : detail.dosesDaily
                detail.dosesEachUseNum = robotData.prescribeUsage.dosesEachUseNumObject?.value !== undefined
                  ? robotData.prescribeUsage.dosesEachUseNumObject.value
                  : detail.dosesEachUseNum
                detail.drugLevel = robotData.prescribeUsage.drugLevel || detail.drugLevel
              }
            }

            // 统一处理药材列表，确保在两个接口数据都处理完毕后执行
            let materialListSource = null
            console.log(prescriptionData, 'prescriptionData=====>')
            if (prescriptionData?.params?.materialList && Array.isArray(prescriptionData.params.materialList)) {
              materialListSource = prescriptionData.params.materialList
              console.log('使用params.materialList:', materialListSource)
            } else if (robotData?.prescribeUsage?.materialList && Array.isArray(robotData.prescribeUsage.materialList)) {
              materialListSource = robotData.prescribeUsage.materialList
              console.log('使用robotData.prescribeUsage.materialList:', materialListSource)
            }

            if (materialListSource) {
              // 先找出所有"药剂药量"类型的标注
              const medicineLabels = detail.labelList?.filter(label =>
                label.value?.rectanglelabels?.[0] === '药剂药量'
              ) || []

              console.log('找到的药剂药量标注:', medicineLabels)

              // 创建一个已使用标注ID的集合
              const usedLabelIds = new Set()

              const medicineList = materialListSource.map((drug, index) => {
                // 查找对应的药材标签
                const drugLabel = detail.drugLabelList?.find(label => label.usageId === (drug.pkMaterial || drug.medicineCode)) || {}

                // 从 labelList 中找到对应的标注数据
                let labelContent = drug.content || drug.drugName || drug.medicineName
                let labelId = drug.labelId || drugLabel.id

                // 1. 首先尝试通过 labelId 精确匹配
                if (labelId && detail.labelList && Array.isArray(detail.labelList)) {
                  const labelData = detail.labelList.find(label =>
                    label.id === labelId &&
                    label.value?.rectanglelabels?.[0] === '药剂药量'
                  )
                  if (labelData?.meta?.text?.[0]) {
                    labelContent = labelData.meta.text[0]
                    usedLabelIds.add(labelData.id)
                  }
                }

                // 2. 如果没找到匹配的标注，尝试分配一个未使用的"药剂药量"标注
                if (!labelId && medicineLabels.length > 0) {
                  const availableLabel = medicineLabels.find(label => !usedLabelIds.has(label.id))
                  if (availableLabel) {
                    labelId = availableLabel.id
                    if (availableLabel.meta?.text?.[0]) {
                      labelContent = availableLabel.meta.text[0]
                    }
                    usedLabelIds.add(availableLabel.id)
                  }
                }

                console.log(`药材${index}: labelId=${labelId}, content=${labelContent}, drug=`, drug)

                return {
                  id: drugLabel.id || null,
                  prescribeId: drugLabel.prescribeId || detail.id,
                  key: labelId ? `medicine-${labelId}` : `medicine-${index}`,
                  area: drug.area || `区域${index + 1}`,
                  regionId: drugLabel.regionId || '',
                  drugForshort: drug.drugForshort || drug.drugName || drug.medicineName,
                  medicineCode: drug.medicineCode || drug.pkMaterial,
                  medicineName: drug.medicineName || drug.drugName,
                  quantity: drug.quantity?.toString() || drug.dosage?.toString(),
                  unit: drug.unit || drug.drugUnitName || 'g',
                  retailPrice: drug.retailPrice || (parseFloat(drug.drugPrice) || 0).toFixed(2),
                  conversionRate: drug.conversionRate || '1',
                  processMethod: drug.processMethod || drug.drugProcessingName || '',
                  drugProcessing: drug.drugProcessing || '',
                  remarks: drug.remarks || '',
                  editable: false,
                  isNew: false,
                  labelId: labelId,
                  content: labelContent
                }
              })
              detail.usageDrugs = medicineList
            }

            // 处理机器人接口的费用信息
            if (robotData) {
              // 费用信息
              // 特殊处理价格字段，确保 0 也能正确显示
              detail.priceConsult = robotData.priceConsult !== undefined
                ? parseFloat(robotData.priceConsult)
                : detail.priceConsult
              detail.priceDrug = robotData.priceDrug
                ? parseFloat(robotData.priceDrug) / 100
                : detail.priceDrug
              detail.priceMake = robotData.priceMake
                ? parseFloat(robotData.priceMake) / 100
                : detail.priceMake
              detail.postage = robotData.postage
                ? parseFloat(robotData.postage) / 100
                : detail.postage
              detail.priceTotal = robotData.priceTotal
                ? parseFloat(robotData.priceTotal) / 100
                : detail.priceTotal

              // 处理是否可以设置诊金
              detail.canSetPriceConsult = robotData.canSetPriceConsult === 1

              // 状态信息
              detail.status = robotData.prescribeStatus || detail.status

              // 图片信息
              if (robotData.images && Array.isArray(robotData.images)) {
                detail.imgUrls = robotData.images
              }

              // 查看方案
              if (robotData.patientViewPlan) {
                detail.patientViewPlan = robotData.patientViewPlan
              }
            }

            // 确保 imgUrls 是数组
            detail.imgUrls = Array.isArray(detail.imgUrls) ? detail.imgUrls : (detail.imgUrls ? [detail.imgUrls] : [])

            this.detail = detail
            console.log(this.detail, 'detail')

            // 直接设置数据准备完成
            this.isDataReady = true
          }
        })
        .catch(error => {
          message.error('获取详情失败：' + (error.message || '未知错误'))
        })
        .finally(() => {
          this.loading = false
        })
    },
    handleRemoveAnnotation (labelId) {
      // 将事件传递给 AnnotationArea 组件
      this.$refs.annotationArea.handleRemoveAnnotation(labelId)
    }
  }
}
</script>

<style lang="less" scoped>
.centered-spin {
  :global(.ant-spin-container) {
    min-height: 200px;
  }
  :global(.ant-spin) {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
  }
}

.annotation-layout {
  display: flex;
  flex-direction: column;
  gap: 16px;
  width: 100%;
  margin-top: 10px;

  // @media screen and (min-width: 1200px) {
  //   flex-direction: row;

  //   .annotation-left {
  //     width: 850px;
  //     flex-shrink: 0;
  //   }

  //   .annotation-right {
  //     overflow: auto;
  //     width: 100%;
  //   }
  // }

  @media screen and (min-width: 1200px) {
    flex-direction: row;
    .annotation-left,
    .annotation-right {
      width: 50%;
      flex-shrink: 0;
    }
  }
}

.detail-actions {
  margin-top: 24px;
  text-align: center;
}
</style>
