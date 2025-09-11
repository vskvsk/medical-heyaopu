<template>
  <a-card :bordered="false">
    <div class="detail-form">
      <a-form :form="form" :label-col="{ span: 8 }" :wrapper-col="{ span: 16 }">
        <a-row :gutter="16">
          <!-- 第一行：基本信息 -->
          <a-col :span="6">
            <a-form-item label="药方编号">
              <a-input :value="value.payOrderNo" disabled />
            </a-form-item>
          </a-col>
          <a-col :span="6">
            <a-form-item label="患者">
              <a-input :value="value.patientName" @input="handleFormChange($event, 'patientName')" />
            </a-form-item>
          </a-col>
          <a-col :span="6">
            <a-form-item label="手机号">
              <a-input
                :value="value.patientPhone"
                @input="handleFormChange($event, 'patientPhone')"
                @blur="validatePhone"
                :class="{ 'has-error': phoneError }"
              />
            </a-form-item>
          </a-col>

          <a-col :span="6">
            <a-form-item label="医生名称">
              <a-input :value="value.doctorName" disabled />
            </a-form-item>
          </a-col>
          <a-col :span="6">
            <a-form-item label="性别">
              <a-select :value="value.patientSex" style="width: 100%" @change="handleFormChange($event, 'patientSex')">
                <a-select-option :value="1">男</a-select-option>
                <a-select-option :value="0">女</a-select-option>
              </a-select>
            </a-form-item>
          </a-col>
          <a-col :span="6">
            <a-form-item label="年龄">
              <a-input-number :value="value.patientAge" style="width: 100%" :min="1" @change="handleFormChange($event, 'patientAge')" />
            </a-form-item>
          </a-col>

          <!-- 第二行：辨病、辩证、治疗思路 -->
          <a-col :span="6">
            <a-form-item label="辨病" class="disease-form-item">
              <div class="advice-input-container" @click="showDiseaseModal">
                <a-input
                  :value="value.diseaseList && value.diseaseList.length > 0 ? value.diseaseList.map(item => item.name).join(', ') : ''"
                  placeholder="点击编辑辨病"
                  read-only
                />
              </div>
            </a-form-item>
          </a-col>
          <a-col :span="6">
            <a-form-item label="辩证" class="disease-form-item">
              <div class="advice-input-container" @click="showSyndromeModal">
                <a-input
                  :value="value.syndromeList && value.syndromeList.length > 0 ? value.syndromeList.map(item => item.name).join(', ') : ''"
                  placeholder="点击编辑辩证"
                  read-only
                />
              </div>
            </a-form-item>
          </a-col>
          <a-col :span="6">
            <a-form-item label="治疗思路" class="disease-form-item">
              <div class="advice-input-container" @click="showTreatmentModal">
                <a-input
                  :value="value.treatmentList && value.treatmentList.length > 0 ? value.treatmentList.map(item => item.name).join(', ') : ''"
                  placeholder="点击编辑治疗思路"
                  read-only
                />
              </div>
            </a-form-item>
          </a-col>

          <!-- 第三行：药方信息 -->
          <a-col :span="6">
            <a-form-item label="处方方案">
              <a-select :value="value.patientViewPlan" style="width: 100%" @change="handleFormChange($event, 'patientViewPlan')">
                <a-select-option v-for="item in patientViewPlanList" :key="item.value" :value="item.value">
                  {{ item.label }}
                </a-select-option>
              </a-select>
            </a-form-item>
          </a-col>
          <a-col :span="6">
            <a-form-item label="开方剂型">
              <a-tree-select
                :value="value.dosageForms"
                style="width: 100%"
                :tree-data="dosageFormsTree"
                placeholder="请选择药剂类型"
                show-search
                :filter-tree-node="filterTreeNode"
                :dropdown-style="{ maxHeight: '400px', overflow: 'auto' }"
                @change="handleFormChange($event, 'dosageForms')"
              />
            </a-form-item>
          </a-col>
          <a-col :span="6" v-if="medicationMethodList.length > 0">
            <a-form-item label="服用方式">
              <a-select :value="value.medicationMethod" style="width: 100%" @change="handleFormChange($event, 'medicationMethod')">
                <a-select-option v-for="item in medicationMethodList" :key="item.value" :value="item.value">
                  {{ item.label }}
                </a-select-option>
              </a-select>
            </a-form-item>
          </a-col>

          <!-- 第四行：剂量信息 -->
          <a-col :span="6">
            <a-form-item :label="(dosesTotalObject.left || '共') + (dosesTotalObject.right || '剂')">
              <a-input-number :value="value.dosesTotal" style="width: 100%" :min="1" @change="handleFormChange($event, 'dosesTotal')" />
            </a-form-item>
          </a-col>
          <a-col :span="6">
            <a-form-item :label="(dosesDailyObject.left || '每日') + (dosesDailyObject.right || '剂')">
              <a-input-number :value="value.dosesDaily" style="width: 100%" :min="1" @change="handleFormChange($event, 'dosesDaily')" />
            </a-form-item>
          </a-col>
          <a-col :span="6">
            <a-form-item :label="(dosesEachUseNumObject.left || '每次') + (dosesEachUseNumObject.right || '次')">
              <a-input-number :value="value.dosesEachUseNum" style="width: 100%" :min="1" @change="handleFormChange($event, 'dosesEachUseNum')" />
            </a-form-item>
          </a-col>
          <a-col :span="6">
            <a-form-item :label="(useDayCountObject.left || '可用') + (useDayCountObject.right || '天')">
              <a-input-number :value="value.useDayCount" style="width: 100%" :min="1" @change="handleFormChange($event, 'useDayCount')" />
            </a-form-item>
          </a-col>

          <!-- 第五行：医嘱和其他信息 -->
          <a-col :span="6">
            <a-form-item label="医嘱说明">
              <div class="advice-input-container" @click="showMedicalAdviceModal">
                <a-input
                  :value="value.doctorAdvice"
                  placeholder="点击编辑医嘱"
                  read-only
                />
              </div>
            </a-form-item>
          </a-col>

          <!-- 其他字段，按需显示 -->
          <a-col :span="6" v-if="packMethodList.length > 0">
            <a-form-item label="包装方式">
              <a-select :value="value.packMethod" style="width: 100%" @change="handleFormChange($event, 'packMethod')">
                <a-select-option v-for="item in packMethodList" :key="item.value" :value="item.value">
                  {{ item.label }}
                </a-select-option>
              </a-select>
            </a-form-item>
          </a-col>
          <a-col :span="6" v-if="value.packMethod">
            <a-form-item label="包装规格">
              <a-select
                :value="value.packingSize"
                style="width: 100%"
                @change="handleFormChange($event, 'packingSize')"
                :loading="loadingPackingSizes"
                placeholder="请选择包装规格"
              >
                <a-select-option v-for="item in packingSizeList" :key="item.value" :value="item.value">
                  {{ item.label }}
                </a-select-option>
              </a-select>
            </a-form-item>
          </a-col>
          <a-col :span="6">
            <a-form-item label="药材等级">
              <a-select :value="value.drugLevel" style="width: 100%" @change="handleFormChange($event, 'drugLevel')">
                <a-select-option v-for="item in drugLevelList" :key="item.value" :value="item.value">
                  {{ item.label }}
                </a-select-option>
              </a-select>
            </a-form-item>
          </a-col>
          <a-col :span="6" v-if="value.canSetPriceConsult">
            <a-form-item label="诊金">
              <a-input-number
                :value="value.priceConsult"
                style="width: 100%"
                :min="0"
                :precision="2"
                @change="handleFormChange($event, 'priceConsult')"
              />
            </a-form-item>
          </a-col>
          <a-col :span="6">
            <a-form-item label="药材费用">
              <a-input-number
                :value="value.priceDrug"
                style="width: 100%"
                :min="0"
                :precision="2"
                disabled
              />
            </a-form-item>
          </a-col>
          <a-col :span="6">
            <a-form-item label="药房留言">
              <a-input
                :value="value.drugstoreMessage"
                style="width: 100%"
                placeholder="请输入药房留言"
                @change="handleFormChange($event, 'drugstoreMessage')"
              />
            </a-form-item>
          </a-col>
        </a-row>
      </a-form>
    </div>

    <!-- 医嘱弹窗 -->
    <MedicalAdviceModal
      :visible="medicalAdviceModalVisible"
      :initialValue="value.doctorAdvice"
      @save="handleMedicalAdviceSave"
      @cancel="handleMedicalAdviceCancel"
    />

    <!-- 辨病弹窗 -->
    <DiseaseModal
      :visible="diseaseModalVisible"
      :initialValue="value.diseaseList || []"
      :preloadedResults="diseasePreloadedResults"
      @save="handleDiseaseSave"
      @cancel="handleDiseaseCancel"
    />

    <!-- 辩证弹窗 -->
    <SyndromeModal
      :visible="syndromeModalVisible"
      :initialValue="value.syndromeList || []"
      :preloadedResults="syndromePreloadedResults"
      @save="handleSyndromeSave"
      @cancel="handleSyndromeCancel"
    />

    <!-- 治疗思路弹窗 -->
    <TreatmentModal
      :visible="treatmentModalVisible"
      :initialValue="value.treatmentList || []"
      :dataSource="treatmentDataSource"
      @save="handleTreatmentSave"
      @cancel="handleTreatmentCancel"
    />
  </a-card>
</template>

<script>
import { TreeSelect } from 'ant-design-vue'
import { getPatientViewPlanDict, getDosageFormsData, getPackingSizeList } from '@/api/annotation'
import SearchableTagInput from './SearchableTagInput'
import MedicalAdviceModal from './MedicalAdviceModal'
import DiseaseModal from './DiseaseModal'
import SyndromeModal from './SyndromeModal'
import TreatmentModal from './TreatmentModal'

// 导出手机号验证函数供其他组件使用
export const validatePhoneNumber = (phone) => {
  const phoneRegex = /^(1[3-9]\d{9}|(?:0\d{2,3}-?)[1-9]\d{6,7})$/
  return !phone || phoneRegex.test(phone)
}

export default {
  name: 'DetailForm',
  props: {
    value: {
      type: Object,
      required: true
    },
    diseasePreloadedResults: {
      type: Array,
      default: () => []
    },
    syndromePreloadedResults: {
      type: Array,
      default: () => []
    }
  },
  components: {
    'a-tree-select': TreeSelect,
    SearchableTagInput,
    MedicalAdviceModal,
    DiseaseModal,
    SyndromeModal,
    TreatmentModal
  },
  data () {
    return {
      dosageFormsTree: [],
      drugLevelList: [],
      medicationMethodList: [], // 用药方法列表
      packMethodList: [], // 包装方式列表
      packingSizeList: [], // 包装规格列表
      loadingPackingSizes: false, // 包装规格加载状态
      dosesTotalObject: {}, // 共多少剂对象
      dosesDailyObject: {}, // 每日多少剂对象
      dosesEachUseNumObject: {}, // 一剂服几次对象
      useDayCountObject: {}, // 可用天数对象
      isAccessories: false, // 是否为膏方
      accessoriesList: [], // 辅料列表
      searchValue: '',
      phoneError: false,
      // 治疗思路数据源
      treatmentDataSource: [],
      // 查看方案列表
      patientViewPlanList: [],
      // 验证状态
      errors: {
        diseaseList: false,
        syndromeList: false,
        treatmentList: false,
        patientViewPlan: false
      },
      // 弹窗显示状态
      medicalAdviceModalVisible: false,
      diseaseModalVisible: false,
      syndromeModalVisible: false,
      treatmentModalVisible: false
    }
  },
  computed: {
    form () {
      return this.$refs.form
    }
  },
  created () {
    this.fetchPatientViewPlanList()
    this.fetchDosageFormsData()
  },
  watch: {
    'value.packMethod': {
      handler (newValue) {
        if (newValue) {
          this.fetchPackingSizeList(newValue)
        } else {
          this.packingSizeList = []
        }
      }
    },
    'value.dosageForms': {
      handler (newValue) {
        if (newValue && this.dosageFormsTree.length > 0) {
          // 在所有节点中查找匹配的值（包括子节点）
          let selectedDosageForm = null

          // 遍历查找选中的药剂类型
          for (const parentItem of this.dosageFormsTree) {
            if (parentItem.value === newValue) {
              // 如果选中的是父节点，尝试使用第一个子节点
              if (parentItem.children && parentItem.children.length > 0) {
                selectedDosageForm = parentItem.children[0]
              }
              break
            }

            // 查找子节点
            if (parentItem.children) {
              const childItem = parentItem.children.find(child => child.value === newValue)
              if (childItem) {
                selectedDosageForm = childItem
                break
              }
            }
          }
          console.log(selectedDosageForm, 'selectedDosageForm==>')

          // 如果找到选中的药剂类型，更新相关数据
          if (selectedDosageForm) {
            // 更新药材等级列表
            this.drugLevelList = selectedDosageForm.drugLevelList || []

            // 更新用药方法列表
            this.medicationMethodList = selectedDosageForm.medicationMethodList || []

            // 更新包装方式列表
            this.packMethodList = selectedDosageForm.packMethodList || []

            // 每次切换开方剂型时，先清空包装方式和包装规格
            const newValue = {
              ...this.value,
              packMethod: '',
              packingSize: ''
            }
            this.$emit('input', newValue)
            this.packingSizeList = []

            // 更新剂量相关对象
            this.dosesTotalObject = selectedDosageForm.dosesTotalObject || { left: '共', value: 1, right: '剂' }
            this.dosesDailyObject = selectedDosageForm.dosesDailyObject || { left: '每日', value: 1, right: '剂' }
            this.dosesEachUseNumObject = selectedDosageForm.dosesEachUseNumObject || { left: '每次', value: 1, right: '次' }
            this.useDayCountObject = selectedDosageForm.useDayCountObject || { left: '可用', value: 1, right: '天' }

            // 更新是否为膏方标志
            this.isAccessories = selectedDosageForm.isAccessories || false

            // 更新辅料列表
            this.accessoriesList = selectedDosageForm.accessoriesList || []

            // 如果是膏方，设置辅料列表（即使不显示在UI上，也需要传递给API）
            if (this.isAccessories && this.accessoriesList.length > 0) {
              this.handleFormChange(this.accessoriesList.map(item => item.value), 'accessoriesList')
            }

            // 更新表单默认值
            if (this.drugLevelList.length > 0 &&
                (!this.value.drugLevel ||
                 !this.drugLevelList.find(item => item.value === this.value.drugLevel))) {
              this.handleFormChange(this.drugLevelList[0].value, 'drugLevel')
            }
            console.log(this.dosesTotalObject, 'this.dosesTotalObject==>')
            // 更新剂量默认值，确保值不为0或undefined
            const dosesTotal = (this.dosesTotalObject && typeof this.dosesTotalObject.value === 'number') ? this.dosesTotalObject.value : 1
            const dosesDaily = (this.dosesDailyObject && typeof this.dosesDailyObject.value === 'number') ? this.dosesDailyObject.value : 1
            const dosesEachUseNum = (this.dosesEachUseNumObject && typeof this.dosesEachUseNumObject.value === 'number') ? this.dosesEachUseNumObject.value : 1
            const useDayCount = (this.useDayCountObject && typeof this.useDayCountObject.value === 'number') ? this.useDayCountObject.value : 1

            console.log('设置剂量值:', { dosesTotal, dosesDaily, dosesEachUseNum, useDayCount })

            // 强制更新表单值，确保始终有值
            this.$nextTick(() => {
              // 创建一个新的值对象，包含所有剂量相关字段
              const updatedValue = {
                ...this.value,
                dosesTotal: dosesTotal > 0 ? dosesTotal : 1,
                dosesDaily: dosesDaily > 0 ? dosesDaily : 1,
                dosesEachUseNum: dosesEachUseNum > 0 ? dosesEachUseNum : 1,
                useDayCount: useDayCount > 0 ? useDayCount : 1
              }

              console.log('更新表单值:', updatedValue)
              this.$emit('input', updatedValue)

              // 在下一个tick中处理包装方式的默认选择
              this.$nextTick(() => {
                // 如果有包装方式列表，设置默认值为第一个
                if (this.packMethodList.length > 0) {
                  console.log('设置默认包装方式:', this.packMethodList[0].value)
                  this.handleFormChange(this.packMethodList[0].value, 'packMethod')
                }
              })
            })

            // 如果有用药方法，设置默认值
            if (this.medicationMethodList.length > 0 && !this.value.medicationMethod) {
              this.handleFormChange(this.medicationMethodList[0].value, 'medicationMethod')
            }
          }
        }
      },
      immediate: true
    }
  },
  methods: {
    handleFormChange (event, field) {
      const newValue = { ...this.value }
      if (event && event.target) {
        newValue[field] = event.target.value
      } else {
        newValue[field] = event
      }
      this.$emit('input', newValue)

      // 如果是包装方式字段变更，直接触发获取包装规格列表
      // 注意：这里不需要额外处理，因为watch已经会监听value.packMethod的变化
      // 并且fetchPackingSizeList方法会自动选择第一个选项
    },
    filterTreeNode (input, treeNode) {
      if (!input) return true
      const title = treeNode.title || treeNode.dataRef?.title || ''
      return title.toLowerCase().includes(input.toLowerCase())
    },

    validatePhone () {
      this.phoneError = !validatePhoneNumber(this.value.patientPhone)
    },

    // 验证辨病字段
    validateDiseaseList () {
      const isEmpty = !this.value.diseaseList || this.value.diseaseList.length === 0
      this.errors.diseaseList = isEmpty
      return !isEmpty
    },

    // 验证辩证字段
    validateSyndromeList () {
      const isEmpty = !this.value.syndromeList || this.value.syndromeList.length === 0
      this.errors.syndromeList = isEmpty
      return !isEmpty
    },

    // 验证治疗思路字段
    validateTreatmentList () {
      const isEmpty = !this.value.treatmentList || this.value.treatmentList.length === 0
      this.errors.treatmentList = isEmpty
      return !isEmpty
    },

    // 验证查看方案字段
    validatePatientViewPlan () {
      const isEmpty = !this.value.patientViewPlan
      this.errors.patientViewPlan = isEmpty
      return !isEmpty
    },

    // 验证所有必填字段
    validateRequiredFields () {
      const diseaseValid = this.validateDiseaseList()
      const syndromeValid = this.validateSyndromeList()
      const treatmentValid = this.validateTreatmentList()
      const viewPlanValid = this.validatePatientViewPlan()

      const isValid = diseaseValid && syndromeValid && treatmentValid && viewPlanValid

      if (!isValid) {
        // 显示错误提示
        this.$message.error('请填写所有必填字段：辨病、辩证、治疗思路、查看方案')
      }

      return isValid
    },

    // 获取查看方案列表
    async fetchPatientViewPlanList () {
      try {
        const res = await getPatientViewPlanDict()
        console.log('查看方案列表', res)
        if (res.code === 0) {
          this.patientViewPlanList = res.data
        }
      } catch (error) {
        console.error('获取查看方案列表失败:', error)
      }
    },

    // 处理辩病变更
    handleDiseaseChange (tags) {
      const newValue = { ...this.value }
      newValue.diseaseList = tags
      this.$emit('input', newValue)
    },

    // 处理辩证变更
    handleSyndromeChange (tags) {
      const newValue = { ...this.value }
      newValue.syndromeList = tags
      this.$emit('input', newValue)
    },

    // 处理治疗思路变更
    handleTreatmentChange (tags) {
      const newValue = { ...this.value }
      newValue.treatmentList = tags
      this.$emit('input', newValue)
    },

    // 显示辨病弹窗
    showDiseaseModal () {
      this.diseaseModalVisible = true
    },

    // 处理辨病保存
    handleDiseaseSave (tags) {
      const newValue = { ...this.value }
      newValue.diseaseList = tags
      this.$emit('input', newValue)
      this.diseaseModalVisible = false
    },

    // 处理辨病取消
    handleDiseaseCancel () {
      this.diseaseModalVisible = false
    },

    // 显示辩证弹窗
    showSyndromeModal () {
      this.syndromeModalVisible = true
    },

    // 处理辩证保存
    handleSyndromeSave (tags) {
      const newValue = { ...this.value }
      newValue.syndromeList = tags
      this.$emit('input', newValue)
      this.syndromeModalVisible = false
    },

    // 处理辩证取消
    handleSyndromeCancel () {
      this.syndromeModalVisible = false
    },

    // 显示治疗思路弹窗
    showTreatmentModal () {
      this.treatmentModalVisible = true
    },

    // 处理治疗思路保存
    handleTreatmentSave (tags) {
      const newValue = { ...this.value }
      newValue.treatmentList = tags
      this.$emit('input', newValue)
      this.treatmentModalVisible = false
    },

    // 处理治疗思路取消
    handleTreatmentCancel () {
      this.treatmentModalVisible = false
    },

    // 显示医嘱弹窗
    showMedicalAdviceModal () {
      this.medicalAdviceModalVisible = true
    },

    // 处理医嘱保存
    handleMedicalAdviceSave (adviceText) {
      const newValue = { ...this.value }
      newValue.doctorAdvice = adviceText
      this.$emit('input', newValue)
      this.medicalAdviceModalVisible = false
    },

    // 处理医嘱取消
    handleMedicalAdviceCancel () {
      this.medicalAdviceModalVisible = false
    },

    // 获取包装规格列表
    async fetchPackingSizeList (packMethod) {
      if (!packMethod) return

      this.loadingPackingSizes = true
      try {
        const res = await getPackingSizeList(packMethod)
        console.log('包装规格列表:', res)
        if (res.code === 0 && res.data) {
          this.packingSizeList = res.data

          // 每次修改包装方式，都将包装规格设置为第一个选项
          if (this.packingSizeList.length > 0) {
            // 无论之前是否有选中值，都选择第一个选项
            this.handleFormChange(this.packingSizeList[0].value, 'packingSize')
            console.log('自动选中第一个包装规格:', this.packingSizeList[0].value)
          } else {
            // 如果列表为空，清空当前选中的包装规格
            this.handleFormChange('', 'packingSize')
          }
        }
      } catch (error) {
        console.error('获取包装规格列表失败:', error)
      } finally {
        this.loadingPackingSizes = false
      }
    },

    // 获取药剂类型数据
    async fetchDosageFormsData () {
      try {
        const res = await getDosageFormsData()
        console.log('药剂类型数据:', res)
        if (res.code === 0 && res.data) {
          // 处理药剂类型数据
          if (res.data && res.data.length > 0) {
            // 转换为树形结构
            this.dosageFormsTree = res.data.map(item => {
              return {
                value: item.dosageForms,
                title: item.dosageFormsName,
                key: item.dosageForms,
                isLeaf: !item.childList || item.childList.length === 0,
                children: item.childList ? item.childList.map(child => ({
                  value: child.dosageForms,
                  title: child.dosageFormsName,
                  key: child.dosageForms,
                  isLeaf: true,
                  // 保存子项的所有数据，以便在选择时使用
                  drugLevelList: child.drugLevelList || [],
                  medicationMethodList: child.medicationMethodList || [],
                  packMethodList: child.packMethodList || [],
                  // 确保剂量相关对象有默认值
                  dosesTotalObject: child.dosesTotalObject || { left: '共', value: 1, right: '剂' },
                  dosesDailyObject: child.dosesDailyObject || { left: '每日', value: 1, right: '剂' },
                  dosesEachUseNumObject: child.dosesEachUseNumObject || { left: '每次', value: 1, right: '次' },
                  useDayCountObject: child.useDayCountObject || { left: '可用', value: 1, right: '天' },
                  remarks: child.remarks,
                  isAccessories: child.isAccessories,
                  accessoriesList: child.accessoriesList || []
                })) : []
              }
            })

            // 如果当前有选中的药剂类型，触发watch更新相关数据
            if (this.value.dosageForms) {
              // 手动触发watch
              this.$nextTick(() => {
                // 直接触发watch，确保在DOM更新后执行
                setTimeout(() => {
                  const handler = this.$options.watch['value.dosageForms'].handler
                  handler.call(this, this.value.dosageForms)
                }, 0)
              })
            } else if (this.dosageFormsTree.length > 0 &&
                      this.dosageFormsTree[0].children &&
                      this.dosageFormsTree[0].children.length > 0) {
              // 如果没有选中的药剂类型，选择第一个子项
              this.handleFormChange(this.dosageFormsTree[0].children[0].value, 'dosageForms')
            }
          }
        }
      } catch (error) {
        console.error('获取药剂类型数据失败:', error)
      }
    }
  }
}
</script>

<style lang="less" scoped>
.detail-form {
  padding: 24px;
  background-color: #fff;
  border-radius: 2px;

  :deep(.ant-form-item) {
    margin-bottom: 16px;
  }

  :deep(.ant-input-number) {
    width: 100%;
  }

  :deep(.has-error) {
    border-color: #f5222d;
    &:focus {
      border-color: #ff4d4f;
      box-shadow: 0 0 0 2px rgba(245, 34, 45, 0.2);
    }
  }

  // :deep(.disease-form-item) {
  //   .ant-form-item-label {
  //     flex:0 0 94px;
  //   }
  // }
}

.advice-input-container {
  position: relative;
  display: flex;
  align-items: center;
  cursor: pointer;

  :deep(.ant-input[disabled]) {
    cursor: pointer;
    background-color: #f9f9f9;
    color: rgba(0, 0, 0, 0.65);
    border-color: #d9d9d9;
  }

  .advice-edit-btn {
    position: absolute;
    right: 0;
    padding: 0 8px;
    height: 32px;
    z-index: 1; /* Ensure the button is above the input */
  }
}
</style>
