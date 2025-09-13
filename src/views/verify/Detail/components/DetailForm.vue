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
              <a-input-number
                :value="value.patientAge"
                style="width: 100%"
                :min="1"
                @change="handleFormChange($event, 'patientAge')"
              />
            </a-form-item>
          </a-col>

          <!-- 第二行：辨病、辩证、治疗思路 -->
          <a-col :span="6">
            <a-form-item label="辨病">
              <a-input
                :value="value.symptom"
                placeholder="请输入辨病"
                @input="handleFormChange($event, 'symptom')"
              />
            </a-form-item>
          </a-col>
          <a-col :span="6">
            <a-form-item label="辩证">
              <a-input
                :value="value.dialectical"
                placeholder="请输入辩证"
                @input="handleFormChange($event, 'dialectical')"
              />
            </a-form-item>
          </a-col>
          <a-col :span="6">
            <a-form-item label="治疗思路">
              <a-input
                :value="value.trainofthought"
                placeholder="请输入治疗思路"
                @input="handleFormChange($event, 'trainofthought')"
              />
            </a-form-item>
          </a-col>

          <!-- 第三行：药方信息 -->
          <a-col :span="6">
            <a-form-item label="处方方案">
              <a-select
                :value="value.issecurity"
                style="width: 100%"
                @change="handleFormChange($event, 'issecurity')"
              >
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
              <a-select
                :value="value.medicationMethod"
                style="width: 100%"
                @change="handleFormChange($event, 'medicationMethod')"
              >
                <a-select-option v-for="item in medicationMethodList" :key="item.value" :value="item.value">
                  {{ item.text }}
                </a-select-option>
              </a-select>
            </a-form-item>
          </a-col>

          <!-- 第四行：剂量信息 -->
          <a-col :span="6">
            <a-form-item :label="(dosesTotalObject.left || '共') + (dosesTotalObject.right || '剂')">
              <a-input-number
                :value="value.dosesTotal"
                style="width: 100%"
                :min="1"
                @change="handleFormChange($event, 'dosesTotal')"
              />
            </a-form-item>
          </a-col>
          <a-col :span="6">
            <a-form-item :label="(dosesDailyObject.left || '每日') + (dosesDailyObject.right || '次')">
              <a-input-number
                :value="value.dosesDaily"
                style="width: 100%"
                :min="1"
                @change="handleFormChange($event, 'dosesDaily')"
              />
            </a-form-item>
          </a-col>
          <a-col :span="6">
            <a-form-item :label="(dosesEachUseNumObject.left || '每次') + (dosesEachUseNumObject.right || '次')">
              <a-input-number
                :value="value.dosesEachUseNum"
                style="width: 100%"
                :min="1"
                @change="handleFormChange($event, 'dosesEachUseNum')"
              />
            </a-form-item>
          </a-col>
          <a-col :span="6">
            <a-form-item :label="(useDayCountObject.left || '可用') + (useDayCountObject.right || '天')">
              <a-input-number
                :value="value.useDayCount"
                style="width: 100%"
                :min="1"
                @change="handleFormChange($event, 'useDayCount')"
              />
            </a-form-item>
          </a-col>

          <!-- 第五行：医嘱和其他信息 -->
          <a-col :span="6">
            <a-form-item label="医嘱说明">
              <div class="advice-input-container" @click="showMedicalAdviceModal">
                <a-input :value="value.doctorAdvice" placeholder="点击编辑医嘱" read-only />
              </div>
            </a-form-item>
          </a-col>

          <!-- 其他字段，按需显示 -->
          <a-col :span="6" v-if="packMethodList.length > 0">
            <a-form-item label="包装方式">
              <a-select :value="value.packMethod" style="width: 100%" @change="handleFormChange($event, 'packMethod')">
                <a-select-option v-for="item in packMethodList" :key="item.value" :value="item.value">
                  {{ item.text }}
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
                  {{ item.text }}
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
              <a-input-number :value="value.priceDrug" style="width: 100%" :min="0" :precision="2" disabled />
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

  </a-card>
</template>

<script>
import { TreeSelect } from 'ant-design-vue'
import { getDosageFormsData } from '@/api/annotation'
import SearchableTagInput from './SearchableTagInput'
import MedicalAdviceModal from './MedicalAdviceModal'

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
    },
    dictionaries: {
      type: Array,
      default: () => []
    }
  },
  components: {
    'a-tree-select': TreeSelect,
    SearchableTagInput,
    MedicalAdviceModal
  },
  data () {
    return {
      dosageFormsTree: [],
      drugLevelList: [],
      medicationMethodList: [], // 用药方法列表
      packMethodList: [], // 包装方式列表
      packingSizeList: [], // 包装规格列表
      loadingPackingSizes: false, // 包装规格加载状态
      dosesTotalObject: { left: '共', value: 1, right: '剂' }, // 共多少剂对象
      dosesDailyObject: { left: '每日', value: 1, right: '次' }, // 每日多少剂对象
      dosesEachUseNumObject: { left: '每次', value: 1, right: '次' }, // 一剂服几次对象
      useDayCountObject: { left: '共', value: 1, right: '包' }, // 可用天数对象
      isAccessories: false, // 是否为膏方
      accessoriesList: [], // 辅料列表
      searchValue: '',
      phoneError: false,
      // 治疗思路数据源
      treatmentDataSource: [],
      // 查看方案列表 - 更新为处方方案映射
      patientViewPlanList: [
        {
          id: 1501,
          label: '购药前药材和克数都不可见',
          value: '3',
          dictType: 'patient_view_plan'
        },
        {
          id: 1553,
          label: '购药前后都不可见',
          value: '4',
          dictType: 'patient_view_plan'
        }
      ],
      // 验证状态
      errors: {
        symptom: false,
        dialectical: false,
        trainofthought: false,
        issecurity: false
      },
      // 弹窗显示状态
      medicalAdviceModalVisible: false
    }
  },
  computed: {
    form () {
      return this.$refs.form
    }
  },
  created () {
    this.fetchDosageFormsData()
  },
  watch: {
    'value.packMethod': {
      handler (newValue) {
        console.log('包装方式改变:', newValue)

        if (newValue && this.dictionaries.length > 0) {
          // 根据包装方式的value值，在字典中找到对应的包装规格
          this.updatePackingSizeList(newValue)
        } else {
          // 清空包装规格选择
          this.packingSizeList = []
          const newFormValue = {
            ...this.value,
            packingSize: ''
          }
          this.$emit('input', newFormValue)
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
              const childItem = parentItem.children.find((child) => child.value === newValue)
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
            console.log('药材等级列表:', this.drugLevelList)

            // 更新用药方法列表
            this.medicationMethodList = selectedDosageForm.medicationMethodList || []
            console.log('用药方法列表:', this.medicationMethodList)

            // 更新包装方式列表
            this.packMethodList = selectedDosageForm.packMethodList || []
            console.log('包装方式列表:', this.packMethodList)

            // 每次切换开方剂型时，先清空包装方式和包装规格
            const newValue = {
              ...this.value,
              packMethod: '',
              packingSize: ''
            }
            this.$emit('input', newValue)
            this.packingSizeList = []

            // 更新剂量相关对象，使用$set确保响应式更新
            this.$set(
              this,
              'dosesTotalObject',
              selectedDosageForm.dosesTotalObject || { left: '共', value: 1, right: '剂' }
            )
            this.$set(
              this,
              'dosesDailyObject',
              selectedDosageForm.dosesDailyObject || { left: '每日', value: 1, right: '次' }
            )
            this.$set(
              this,
              'dosesEachUseNumObject',
              selectedDosageForm.dosesEachUseNumObject || {
                left: '每次',
                value: 1,
                right: '次'
              }
            )
            this.$set(
              this,
              'useDayCountObject',
              selectedDosageForm.useDayCountObject || { left: '共', value: 1, right: '包' }
            )

            // 更新是否为膏方标志
            this.isAccessories = selectedDosageForm.isAccessories || false

            // 更新辅料列表
            this.accessoriesList = selectedDosageForm.accessoriesList || []

            // 如果是膏方，设置辅料列表（即使不显示在UI上，也需要传递给API）
            if (this.isAccessories && this.accessoriesList.length > 0) {
              this.handleFormChange(
                this.accessoriesList.map((item) => item.value),
                'accessoriesList'
              )
            }

            // 更新表单默认值
            // 设置药材等级默认值
            if (this.drugLevelList.length > 0) {
              // 优先使用接口返回的默认值，如果没有或当前值不在列表中，则使用第一个
              const defaultLevel = selectedDosageForm.defaultDrugLevel || this.drugLevelList[0].value
              if (!this.value.drugLevel || !this.drugLevelList.find((item) => item.value === this.value.drugLevel)) {
                this.handleFormChange(defaultLevel, 'drugLevel')
              }
            }

            // 设置用药方式默认值
            if (this.medicationMethodList.length > 0) {
              const defaultMethod = selectedDosageForm.defaultMedicationMethod || this.medicationMethodList[0].value
              if (
                !this.value.medicationMethod ||
                !this.medicationMethodList.find((item) => item.value === this.value.medicationMethod)
              ) {
                this.handleFormChange(defaultMethod, 'medicationMethod')
              }
            }

            console.log(this.dosesTotalObject, 'this.dosesTotalObject==>')
            // 更新剂量默认值，确保值不为0或undefined
            const dosesTotal =
              this.dosesTotalObject && typeof this.dosesTotalObject.value === 'number' ? this.dosesTotalObject.value : 1
            const dosesDaily =
              this.dosesDailyObject && typeof this.dosesDailyObject.value === 'number' ? this.dosesDailyObject.value : 1
            const dosesEachUseNum =
              this.dosesEachUseNumObject && typeof this.dosesEachUseNumObject.value === 'number'
                ? this.dosesEachUseNumObject.value
                : 1
            const useDayCount =
              this.useDayCountObject && typeof this.useDayCountObject.value === 'number'
                ? this.useDayCountObject.value
                : 1

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
                // 如果有包装方式列表，设置默认值
                if (this.packMethodList.length > 0) {
                  const defaultPackMethod = selectedDosageForm.defaultPackMethod || this.packMethodList[0].value
                  console.log('设置默认包装方式:', defaultPackMethod)
                  console.log('可用包装方式列表:', this.packMethodList)
                  this.handleFormChange(defaultPackMethod, 'packMethod')
                } else {
                  console.log('没有可用的包装方式选项')
                }

                // 设置药材等级默认值
                if (this.drugLevelList.length > 0) {
                  const defaultDrugLevel = selectedDosageForm.defaultDrugLevel || this.drugLevelList[0].value
                  console.log('设置默认药材等级:', defaultDrugLevel)
                  console.log('可用药材等级列表:', this.drugLevelList)
                  if (!this.value.drugLevel || !this.drugLevelList.find(item => item.value === this.value.drugLevel)) {
                    this.handleFormChange(defaultDrugLevel, 'drugLevel')
                  }
                } else {
                  console.log('没有可用的药材等级选项')
                }

                // 设置用药方式默认值
                if (this.medicationMethodList.length > 0) {
                  const defaultMedicationMethod = selectedDosageForm.defaultMedicationMethod || this.medicationMethodList[0].value
                  console.log('设置默认用药方式:', defaultMedicationMethod)
                  console.log('可用用药方式列表:', this.medicationMethodList)
                  if (!this.value.medicationMethod || !this.medicationMethodList.find(item => item.value === this.value.medicationMethod)) {
                    this.handleFormChange(defaultMedicationMethod, 'medicationMethod')
                  }
                } else {
                  console.log('没有可用的用药方式选项')
                }
              })
            })
          }
        }
      },
      immediate: true
    }
  },
  methods: {
    // 根据包装方式更新包装规格列表
    updatePackingSizeList (packMethodValue) {
      console.log('开始更新包装规格列表，包装方式值:', packMethodValue)
      console.log('当前字典数据:', this.dictionaries)

      // 1. 首先在包装方式字典中找到对应的包装方式项
      const packMethodDict = this.dictionaries.find(dict => dict.code === 'Packmethod')
      if (!packMethodDict || !packMethodDict.childrens) {
        console.log('未找到包装方式字典')
        this.packingSizeList = []
        return
      }

      // 2. 在包装方式的childrens中找到选中的包装方式
      const selectedPackMethod = packMethodDict.childrens.find(item => item.value === packMethodValue)
      if (!selectedPackMethod) {
        console.log('未找到选中的包装方式:', packMethodValue)
        this.packingSizeList = []
        return
      }

      console.log('找到选中的包装方式:', selectedPackMethod)

      // 3. 使用包装方式的code去找对应的包装规格字典
      const packSizeDict = this.dictionaries.find(dict => dict.code === selectedPackMethod.code)
      if (!packSizeDict || !packSizeDict.childrens) {
        console.log('未找到对应的包装规格字典，code:', selectedPackMethod.code)
        this.packingSizeList = []
        return
      }

      console.log('找到包装规格字典:', packSizeDict)

      // 4. 设置包装规格列表
      this.packingSizeList = packSizeDict.childrens.map(item => ({
        value: item.value,
        label: item.text,
        code: item.code
      }))

      console.log('更新后的包装规格列表:', this.packingSizeList)

      // 5. 自动选择第一个包装规格
      if (this.packingSizeList.length > 0) {
        const defaultPackingSize = this.packingSizeList[0].value
        console.log('自动选择第一个包装规格:', defaultPackingSize)
        this.handleFormChange(defaultPackingSize, 'packingSize')
      } else {
        // 清空包装规格选择
        this.handleFormChange('', 'packingSize')
      }
    },

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
    validateSymptom () {
      const isEmpty = !this.value.symptom || this.value.symptom.trim() === ''
      this.errors.symptom = isEmpty
      return !isEmpty
    },

    // 验证辩证字段
    validateDialectical () {
      const isEmpty = !this.value.dialectical || this.value.dialectical.trim() === ''
      this.errors.dialectical = isEmpty
      return !isEmpty
    },

    // 验证治疗思路字段
    validateTrainofthought () {
      const isEmpty = !this.value.trainofthought || this.value.trainofthought.trim() === ''
      this.errors.trainofthought = isEmpty
      return !isEmpty
    },

    // 验证处方方案字段
    validateIssecurity () {
      const isEmpty = !this.value.issecurity
      this.errors.issecurity = isEmpty
      return !isEmpty
    },

    // 验证所有必填字段
    validateRequiredFields () {
      const symptomValid = this.validateSymptom()
      const dialecticalValid = this.validateDialectical()
      const trainofthoughtValid = this.validateTrainofthought()
      const issecurityValid = this.validateIssecurity()

      const isValid = symptomValid && dialecticalValid && trainofthoughtValid && issecurityValid

      if (!isValid) {
        // 显示错误提示
        this.$message.error('请填写所有必填字段：辨病、辩证、治疗思路、处方方案')
      }

      return isValid
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

    // 获取药剂类型数据
    async fetchDosageFormsData () {
      try {
        const res = await getDosageFormsData()
        console.log('药剂类型数据:', res)
        console.log('原始数据第一项:', res.data && res.data[0])
        if (res.code === 0 && res.data) {
          // 处理药剂类型数据
          if (res.data && res.data.length > 0) {
            // 转换为树形结构，适配新的接口数据格式
            this.dosageFormsTree = res.data.map((item) => {
              console.log('处理药剂类型数据:', item.dt_name, {
                drug_level_combox: item.drug_level_combox,
                drug_mmode_combox: item.drug_mmode_combox,
                dt_packmethod_combox: item.dt_packmethod_combox
              })
              return {
                value: item.pk_drugtypes,
                title: item.dt_name,
                key: item.pk_drugtypes,
                isLeaf: !item.childrens || item.childrens.length === 0,
                // 保存完整的药剂类型数据
                drugLevelList: item.drug_level_combox || [],
                medicationMethodList: item.drug_mmode_combox || [],
                packMethodList: item.dt_packmethod_combox || [],
                // 剂量相关对象，使用新接口的字段
                dosesTotalObject: {
                  left: item.tally1_left || '共',
                  value: item.tally1_value || 1,
                  right: item.tally1_right || '剂'
                },
                dosesDailyObject: {
                  left: item.tally2_left || '每日',
                  value: item.tally2_value || 1,
                  right: item.tally2_right || '次'
                },
                dosesEachUseNumObject: {
                  left: item.tally4_left || '每次',
                  value: item.tally4_value || 1,
                  right: item.tally4_right || '包'
                },
                useDayCountObject: {
                  left: item.tally3_left || '共',
                  value: item.tally3_value || 1,
                  right: item.tally3_right || '包'
                },
                remarks: item.dt_remarks || '',
                isAccessories: item.dt_isaccessories === 1,
                isHalf: item.dt_ishalf === 1,
                isExcess: item.dt_isexcess === 1,
                tallyDescription: item.tally_description || '',
                // 默认选项
                defaultDrugLevel: item.drug_level,
                defaultMedicationMethod: item.drug_mmode,
                defaultPackMethod: item.dt_packmethod,
                children: item.childrens
                  ? item.childrens.map((child) => {
                      console.log('处理子项数据:', child.dt_name, {
                        drug_level_combox: child.drug_level_combox,
                        drug_mmode_combox: child.drug_mmode_combox,
                        dt_packmethod_combox: child.dt_packmethod_combox
                      })
                      return {
                        value: child.pk_drugtypes,
                        title: child.dt_name,
                        key: child.pk_drugtypes,
                        isLeaf: true,
                        // 子项的完整数据
                        drugLevelList: child.drug_level_combox || [],
                        medicationMethodList: child.drug_mmode_combox || [],
                        packMethodList: child.dt_packmethod_combox || [],
                        dosesTotalObject: {
                          left: child.tally1_left || '共',
                          value: child.tally1_value || 1,
                          right: child.tally1_right || '剂'
                        },
                        dosesDailyObject: {
                          left: child.tally2_left || '每日',
                          value: child.tally2_value || 1,
                          right: child.tally2_right || '次'
                        },
                        dosesEachUseNumObject: {
                          left: child.tally4_left || '每次',
                          value: child.tally4_value || 1,
                          right: child.tally4_right || '包'
                        },
                        useDayCountObject: {
                          left: child.tally3_left || '共',
                          value: child.tally3_value || 1,
                          right: child.tally3_right || '包'
                        },
                        remarks: child.dt_remarks || '',
                        isAccessories: child.dt_isaccessories === 1,
                        isHalf: child.dt_ishalf === 1,
                        isExcess: child.dt_isexcess === 1,
                        tallyDescription: child.tally_description || '',
                        defaultDrugLevel: child.drug_level,
                        defaultMedicationMethod: child.drug_mmode,
                        defaultPackMethod: child.dt_packmethod
                      }
                    })
                  : []
              }
            })
            console.log(this.dosageFormsTree, 'dosageFormsTree')

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
            } else if (this.dosageFormsTree.length > 0) {
              // 如果没有选中的药剂类型，选择第一个项目
              // 如果有子项，选择第一个子项；否则选择父项
              const firstItem = this.dosageFormsTree[0]
              const defaultValue =
                firstItem.children && firstItem.children.length > 0 ? firstItem.children[0].value : firstItem.value
              this.handleFormChange(defaultValue, 'dosageForms')
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
