<template>
  <div>
    <div class="table-header">
      <div class="tabs-wrapper">
        <a-tabs
          :activeKey="activeLabel"
          @change="handleTabChange"
        >
          <a-tab-pane
            v-for="label in labelConfigs"
            :key="label.value"
            :tab="`${label.value} ${label.list.length>0 ? label.list.length :''}`"
          >
            <a-card>
              <template v-if="label.value === '药剂药量'">
                <a-table
                  :columns="medicineColumns"
                  :dataSource="detail.usageDrugs"
                  :pagination="false"
                  :loading="loading"
                  :scroll="{ x: 1000 }"
                >
                  <template v-for="col in ['area', 'medicineCode', 'content', 'quantity', 'unit', 'retailPrice', 'conversionRate','drugProcessing', 'processMethod']" :slot="col" slot-scope="text, record">
                    <a-form-item
                      v-if="col === 'content'"
                      :key="col"
                      :validate-status="getValidateStatus(record, 'content')"
                      :help="getValidateHelp(record, 'content')"
                      style="margin-bottom: 0"
                    >
                      <a-input
                        :value="text"
                        :placeholder="medicineColumns.find(c => c.dataIndex === col).title"
                        @change="e => handleChange(e.target.value, record.key, col)"
                      />
                    </a-form-item>

                    <a-form-item
                      v-else-if="col === 'quantity'"
                      :key="col"
                      :validate-status="getValidateStatus(record, 'quantity')"
                      :help="getValidateHelp(record, 'quantity')"
                      style="margin-bottom: 0"
                    >
                      <a-input-number
                        :value="text"
                        style="width: 100%"
                        :placeholder="medicineColumns.find(c => c.dataIndex === col).title"
                        @change="value => handleChange(value, record.key, col)"
                        :min="0"
                      />
                    </a-form-item>

                    <template v-else-if="col === 'retailPrice' || col === 'conversionRate'">
                      <a-input
                        :key="col"
                        style="margin: -5px 0"
                        :value="text"
                        :placeholder="medicineColumns.find(c => c.dataIndex === col).title"
                        :disabled="true"
                      />
                    </template>
                    <a-input
                      v-else
                      :key="col"
                      style="margin: -5px 0"
                      :value="text"
                      :placeholder="medicineColumns.find(c => c.dataIndex === col).title"
                      @change="e => handleChange(e.target.value, record.key, col)"
                    />
                  </template>
                  <template slot="drugProcessing" slot-scope="text, record">
                    <a-select
                      style="margin: -5px 0; width: 100%"
                      :value="text"
                      @change="value => handleChange(value, record.key, 'drugProcessing')"
                      allowClear
                      placeholder="请选择加工工艺"
                      :defaultValue="record.drugProcessing"
                    >
                      <a-select-option v-for="method in drugProcessingList" :key="method.id" :value="method.id">
                        {{ method.label }}
                      </a-select-option>
                    </a-select>
                  </template>
                  <template slot="medicineCode" slot-scope="text, record">
                    <template>
                      <a-form-item
                        :validate-status="getValidateStatus(record, 'medicineCode')"
                        :help="getValidateHelp(record, 'medicineCode')"
                        style="margin-bottom: 0"
                      >
                        <a-select
                          show-search
                          style="width: 120px"
                          :value="record.medicineName"
                          placeholder="请输入搜索药材"
                          :filter-option="false"
                          :not-found-content="searching ? undefined : (!searching && searchResults.length === 0 ? '暂无数据' : null)"
                          allowClear
                          @search="debounceSearch"
                          @change="value => handlemedicineCodeChange(value, record)"
                          @focus="() => handleSelectFocus(record)"
                        >
                          <a-select-option v-for="item in searchResults" :key="item.code" :value="item.code">
                            {{ item.name }} ({{ item.code }})
                          </a-select-option>
                        </a-select>
                      </a-form-item>
                    </template>
                  </template>
                  <template slot="area" slot-scope="text, record">
                    <template v-if="record.labelId">
                      <a-button
                        type="link"
                        size="small"
                        icon="environment"
                        @click="handleAreaClick(record)"
                      >
                        {{ text }}
                      </a-button>
                    </template>
                    <template v-else>
                      <a-button
                        type="dashed"
                        size="small"
                        icon="plus"
                        @click="handleAddAnnotation(record)"
                      >
                        添加标注
                      </a-button>
                    </template>
                  </template>
                  <template slot="operation" slot-scope="text, record">
                    <a-popconfirm title="是否要删除此行？" @confirm="remove(record.key)">
                      <a>删除</a>
                    </a-popconfirm>
                  </template>
                </a-table>
                <div style="display: flex; gap: 16px; margin-top: 16px; margin-bottom: 8px">
                  <a-button
                    style="flex: 1"
                    type="dashed"
                    icon="plus"
                    @click="newMedicine"
                  >
                    添加
                  </a-button>
                </div>
              </template>
              <template v-else>
                <a-table
                  :columns="annotationColumns"
                  :dataSource="label.list"
                  :pagination="false"
                >
                  <template slot="area" slot-scope="text, record">
                    <a-button
                      type="link"
                      size="small"
                      icon="environment"
                      @click="handleAreaClick(record)"
                    >
                      {{ text }}
                    </a-button>
                  </template>
                  <template slot="content" slot-scope="text, record">
                    <a-textarea
                      v-model="record.content"
                      :placeholder="'请输入内容'"
                      :auto-size="{ minRows: 2, maxRows: 4 }"
                      @change="handleContentChange($event.target.value, record)"
                    />
                  </template>
                </a-table>
              </template>
            </a-card>
          </a-tab-pane>
        </a-tabs>
      </div>

    </div>

    <!-- 添加结果内容区域 -->
    <div class="result-content">
      <a-card title="结果内容">
        <div class="result-text">
          <div class="prescription-header">
            方剂内容如下:
          </div>
          <div class="prescription-separator">
            {{ '*'.repeat(80) }}
          </div>
          <div class="prescription-medicines">
            **药剂**: {{ formatMedicines }}
          </div>
          <div class="prescription-separator">
            {{ '-'.repeat(80) }}
          </div>
          <!-- <div class="prescription-method">
            **煎制方法**: {{ getAnnotationContent('煎制方法') }}
          </div> -->
          <!-- <div class="prescription-separator">
            {{ '-'.repeat(80) }}
          </div> -->
          <div class="prescription-method">
            **医嘱**: {{ detail.doctorAdvice }}
          </div>
          <div class="prescription-separator">
            {{ '-'.repeat(80) }}
          </div>
          <div class="prescription-method">
            **医师**: {{ detail.doctorName }}
          </div>
          <div class="prescription-separator">
            {{ '-'.repeat(80) }}
          </div>
          <div class="prescription-dosage">
            **药量(付/帖/剂)**: {{ `共${detail.dosesTotal}剂，每日${detail.dosesDaily}剂，一剂服${detail.dosesEachUseNum}次` }}
          </div>
          <div class="prescription-separator">
            {{ '*'.repeat(80) }}
          </div>
        </div>

        <a-form layout="horizontal">
          <a-form-item label="图片类型（只针对标注有效）">
            <a-radio-group v-model="detail.imgType" :default-value="2">
              <a-radio :value="1">打印药方</a-radio>
              <a-radio :value="2">手写药方</a-radio>
            </a-radio-group>
          </a-form-item>

          <a-form-item label="操作">
            <div class="control-buttons">
              <!-- <a-button icon="sync">图片更新</a-button> -->
              <a-checkbox v-model="detail.labeled" :disabled="isVerified">
                同步标注
              </a-checkbox>
            </div>
          </a-form-item>
        </a-form>

        <div class="prescription-actions">
          <div style="display: flex; gap: 16px;">
            <a-button
              type="primary"
              icon="audit"
              style="flex: 1"
              :disabled="isVerified"
              @click="showConfirmModal('verify')"
            >
              核方
            </a-button>
            <a-button
              type="primary"
              icon="check"
              style="flex: 1"
              @click="showConfirmModal('annotation')"
            >
              标注
            </a-button>
          </div>
        </div>
      </a-card>
    </div>

    <!-- 添加确认模态框 -->
    <a-modal
      title="确认提交"
      :visible="confirmModalVisible"
      @ok="handleSubmit"
      @cancel="confirmModalVisible = false"
      okText="确认"
      cancelText="取消"
    >
      <p v-if="currentAction === 'verify'">核方以后，处方就只有医生可以修改，请仔细确认提交信息</p>
      <p v-else>确认要提交吗？</p>
    </a-modal>
  </div>
</template>

<script>
import { message } from 'ant-design-vue'
import { cloneDeep, debounce } from 'lodash-es'
import { getDrugMaterialList, savePrescribeDetail, getEnabledDictDataListByType, robotPrescribeHelperImageSubmit } from '@/api/annotation'
import { mapGetters } from 'vuex'
import { validatePhoneNumber } from './DetailForm'

export default {
  name: 'MedicineTable',
  props: {
    detail: {
      type: Object,
      required: true
    },
    loading: {
      type: Boolean,
      default: false
    },
    isNuclearSide: {
      type: Boolean,
      default: false
    }
  },
  computed: {
    ...mapGetters('annotation', ['getActiveLabel']),
    activeLabel () {
      return this.getActiveLabel
    },
    labelConfigs () {
      const configs = [
        { value: '药剂药量', list: [] },
        { value: '煎制方法', list: [] },
        { value: '医嘱', list: [] },
        { value: '医师', list: [] }
      ]

      // 处理药剂药量数据
      const medicineConfig = configs.find(config => config.value === '药剂药量')
      if (medicineConfig && this.detail.usageDrugs) {
        // 先找出所有"药剂药量"类型的标注
        const medicineLabels = this.detail.labelList?.filter(label =>
          label.value?.rectanglelabels?.[0] === '药剂药量'
        ) || []

        console.log('找到的药剂药量标注:', medicineLabels)

        medicineConfig.list = this.detail.usageDrugs.map((drug, index) => {
          // 从 labelList 中找到对应的标注数据
          // 1. 首先尝试通过 labelId 精确匹配
          let labelData = this.detail.labelList?.find(label =>
            label.id === drug.labelId &&
            label.value?.rectanglelabels?.[0] === '药剂药量'
          )

          // 2. 如果没找到，尝试从所有"药剂药量"标注中找一个未使用的
          if (!labelData && medicineLabels.length > 0) {
            // 找出已经被使用的标注ID
            const usedLabelIds = this.detail.usageDrugs
              .filter(d => d.labelId && d !== drug)
              .map(d => d.labelId)

            // 找一个未被使用的标注
            labelData = medicineLabels.find(label => !usedLabelIds.includes(label.id))

            // 如果找到了，更新药材项的 labelId
            if (labelData) {
              drug.labelId = labelData.id
            }
          }

          return {
            ...drug,
            labelId: drug.labelId || `temp-${drug.key}`,
            area: `区域${index + 1}`,
            content: labelData?.meta?.text?.[0] || drug.content || ''
          }
        })
      }

      // 处理其他标签数据
      if (this.detail.labelList && Array.isArray(this.detail.labelList)) {
        console.log(this.detail.labelList, 'this.detail.labelList===>')
        this.detail.labelList.forEach(label => {
          if (label.value && Array.isArray(label.value?.rectanglelabels)) {
            const rectangleLabel = label.value?.rectanglelabels?.[0]
            if (rectangleLabel && rectangleLabel !== '药剂药量') {
              const config = configs.find(c => c.value === rectangleLabel)
              if (config) {
                const existingLabel = config.list.find(item => item.labelId === label.id)
                if (!existingLabel) {
                  config.list.push({
                    key: `label-${label.id}`,
                    area: `区域${config.list.length + 1}`,
                    labelId: label.id,
                    content: label.meta?.text?.[0] || ''
                  })
                } else {
                  existingLabel.content = label.meta?.text?.[0] || ''
                }
              }
            }
          }
        })
      }

      return configs
    },
    // 格式化药材列表
    formatMedicines () {
      if (!this.detail.usageDrugs || this.detail.usageDrugs.length === 0) return ''

      return this.detail.usageDrugs
        .filter(medicine => medicine.medicineName && medicine.quantity)
        .map(medicine => {
          return `${medicine.medicineName} ${medicine.quantity}${medicine.unit}`
        })
        .join(' ')
    },

    // 获取煎制方式
    processingMethod () {
      const methods = new Set(this.detail.usageDrugs
        .filter(medicine => medicine.drugProcessing)
        .map(medicine => medicine.drugProcessing))
      return Array.from(methods).join(' ') || ''
    },
    // 获取标注内容的方法改为计算属性
    annotationContents () {
      const contents = {}
      if (this.detail.labelList && Array.isArray(this.detail.labelList)) {
        this.detail.labelList.forEach(label => {
          if (label.value && Array.isArray(label.value?.rectanglelabels)) {
            const labelType = label.value?.rectanglelabels?.[0]
            if (labelType && labelType !== '药剂药量') {
              if (!contents[labelType]) {
                contents[labelType] = []
              }
              const text = label.meta?.text?.[0]
              if (text) {
                contents[labelType].push(text)
              }
            }
          }
        })

        // 合并每种类型的内容
        Object.keys(contents).forEach(key => {
          contents[key] = contents[key].join(' ')
        })
      }
      return contents
    },

    // 是否已核方
    isVerified () {
      // 根据传入的 isNuclearSide 参数判断是否已核方
      return this.isNuclearSide
    }
  },
  data () {
    return {
      confirmModalVisible: false,
      form: this.$form.createForm(this),
      labeled: false,
      medicineColumns: [
        {
          title: '标注区域',
          dataIndex: 'area',
          width: 100,
          scopedSlots: { customRender: 'area' }
        },
        {
          title: '识别数据',
          dataIndex: 'content',
          width: 100,
          scopedSlots: { customRender: 'content' }
        },
        {
          title: '药材名称',
          dataIndex: 'medicineCode',
          width: 100,
          scopedSlots: { customRender: 'medicineCode' }
        },
        {
          title: '数量',
          dataIndex: 'quantity',
          width: 80,
          scopedSlots: { customRender: 'quantity' }
        },
        {
          title: '零售价',
          dataIndex: 'retailPrice',
          width: 80,
          scopedSlots: { customRender: 'retailPrice' }
        },
        {
          title: '换算率',
          dataIndex: 'conversionRate',
          width: 80,
          scopedSlots: { customRender: 'conversionRate' }
        },
        {
          title: '加工工艺',
          dataIndex: 'drugProcessing',
          width: 100,
          scopedSlots: { customRender: 'drugProcessing' }
        },
        {
          title: '备注',
          dataIndex: 'processMethod',
          width: 80,
          scopedSlots: { customRender: 'processMethod' }
        },
        {
          title: '操作',
          dataIndex: 'operation',
          width: 80,
          scopedSlots: { customRender: 'operation' },
          fixed: 'right',
          align: 'center'
        }
      ],
      medicineCache: [],
      annotationColumns: [
        {
          title: '标注区域',
          dataIndex: 'area',
          width: '30%',
          scopedSlots: { customRender: 'area' }
        },
        {
          title: '输入内容',
          dataIndex: 'content',
          scopedSlots: { customRender: 'content' }
        }
      ],
      searchResults: [],
      allMedicines: [],
      searching: false,
      drugProcessingList: [],
      validationErrors: {},
      currentAction: '' // 当前操作类型：'annotation' 或 'verify'
    }
  },
  methods: {
    async getDrugMaterialList () {
      try {
        const res = await getDrugMaterialList({ name: '' })
        if (res.code === 0 && res.data) {
          this.allMedicines = res.data.map(item => ({
            code: item.pkMaterial,
            name: item.drugName
          }))
          this.searchResults = [...this.allMedicines]
        } else {
          message.error(res.msg || '获取药材列表失败')
        }
      } catch (error) {
        console.error('获取药材列表失败:', error)
        message.error('获取药材列表失败')
      }
    },
    async getEnabledDictDataListByType () {
      try {
        const res = await getEnabledDictDataListByType()
        if (res.code === 0 && res.data) {
          this.drugProcessingList = res.data.map(item => ({
            id: String(item.id), // 转为字符串是为了同步后端数据类型
            label: item.remark,
            remark: item.remark
          }))
        } else {
          message.error(res.msg || '获取下拉列表失败')
        }
      } catch (error) {
        console.error('获取下拉列表失败:', error)
      }
    },
    handleContentChange (value, record) {
      if (record.labelId && this.detail.labelList) {
        const newLabelList = [...this.detail.labelList]
        const labelItem = newLabelList.find(item => item.id === record.labelId)
        if (labelItem) {
          if (!labelItem.meta) {
            labelItem.meta = {}
          }
          labelItem.meta.text = [value]

          this.$emit('update:detail', {
            ...this.detail,
            labelList: newLabelList
          })
        }
      }
    },
    handleChange (value, key, column) {
      console.log(value, key, column, 'value, key, column')
      const newUsageDrugs = [...this.detail.usageDrugs]
      const target = newUsageDrugs.find(item => key === item.key)
      if (target) {
        const params = {}
        target[column] = value

        // 同步更新 Details 对应字段
        if (column === 'quantity') {
          target.drug_quantity = value // 同步更新 Details.drug_quantity
        } else if (column === 'drugProcessing') {
          target.pk_drug_processing = value // 同步更新 Details.pk_drug_processing
          // 查找对应的加工类型名称
          const processingItem = this.drugProcessingList.find(item => item.id === value)
          if (processingItem) {
            target.pk_drug_processing_name = processingItem.label
          }
        } else if (column === 'unit') {
          target.pk_drug_unit_name = value // 同步更新 Details.pk_drug_unit_name
        }

        const errorKey = `${key}-${column}`
        if (this.validationErrors[errorKey]) {
          this.$delete(this.validationErrors, errorKey)
        }

        const isRowValid = this.checkRowValidation(target)
        if (isRowValid) {
          Object.keys(this.validationErrors).forEach(key => {
            if (key.startsWith(`${target.key}-`)) {
              this.$delete(this.validationErrors, key)
            }
          })
        }

        // 如果修改的是 content 字段，同时更新对应的 labelList 中的 meta.text
        if (column === 'content' && target.labelId && this.detail.labelList) {
          const newLabelList = [...this.detail.labelList]
          const labelItem = newLabelList.find(item => item.id === target.labelId)
          if (labelItem) {
            if (!labelItem.meta) {
              labelItem.meta = {}
            }
            labelItem.meta.text = [value]
            params.labelList = newLabelList
          }
        }

        params.usageDrugs = newUsageDrugs
        this.$emit('update:detail', params)
      }
    },
    newMedicine () {
      const newUsageDrugs = [...this.detail.usageDrugs]
      newUsageDrugs.push({
        key: `new-${Date.now()}`,
        area: `区域${newUsageDrugs.length + 1}`,
        // 对应 Details 字段的完整映射
        pk_detail: '', // 明细主键 - 新增时为空，保存后由后端生成
        pk_prescribe: this.detail.pk_prescribe || '', // 处方主键
        pk_materials: '', // 药材PK (对应原 medicineCode)
        drug_code: '', // 药材编码 - 新增字段
        drug_name: '', // 药材名称 (对应原 medicineName)
        drug_origquantity: '', // 原使用量 - 新增字段
        drug_quantity: '', // 使用量 (对应原 quantity)
        pk_drug_processing: '', // 加工类型PK (对应原 drugProcessing)
        pk_drug_processing_name: '', // 加工类型名称 - 新增字段
        pk_drug_unit: '', // 计量单位PK - 新增字段
        pk_drug_unit_name: 'g', // 计量单位名称 (对应原 unit)

        // 保留原有字段以兼容现有逻辑
        medicineCode: '', // 兼容字段，映射到 pk_materials
        medicineName: '', // 兼容字段，映射到 drug_name
        drugForshort: '',
        quantity: '', // 兼容字段，映射到 drug_quantity
        unit: 'g', // 兼容字段，映射到 pk_drug_unit_name
        retailPrice: '',
        conversionRate: '',
        processMethod: '',
        drugProcessing: '', // 兼容字段，映射到 pk_drug_processing
        remarks: ''
      })
      this.$emit('update:detail', {
        ...this.detail,
        usageDrugs: newUsageDrugs
      })
    },
    remove (key) {
      // 获取要删除的药材项
      const drugToRemove = this.detail.usageDrugs.find(item => item.key === key)

      // 过滤掉要删除的药材项
      const newUsageDrugs = this.detail.usageDrugs.filter(item => item.key !== key)

      // 准备更新的数据
      const updateData = {
        ...this.detail,
        usageDrugs: newUsageDrugs
      }

      // 如果药材项有关联的标注ID，同时从labelList中删除对应的标注
      if (drugToRemove && drugToRemove.labelId && this.detail.labelList) {
        // 过滤掉要删除的标注项
        updateData.labelList = this.detail.labelList.filter(label => label.id !== drugToRemove.labelId)

        // 通过事件通知 AnnotationArea 组件删除标注
        this.$emit('remove-annotation', drugToRemove.labelId)
      }

      // 更新数据
      this.$emit('update:detail', updateData)
    },
    saveRow: debounce(function (record) {
      this.$emit('update:loading', true)
      const { key, content, medicineCode, quantity } = record

      // 重置验证错误
      this.validationErrors = {}

      // 验证必填字段
      let hasError = false
      if (!content) {
        this.validationErrors[`${key}-content`] = '识别数据不能为空'
        hasError = true
      }
      if (!medicineCode) {
        this.validationErrors[`${key}-medicineCode`] = '请选择药材'
        hasError = true
      }
      if (!quantity) {
        this.validationErrors[`${key}-quantity`] = '请填写数量'
        hasError = true
      }

      if (hasError) {
        this.$emit('update:loading', false)
        return
      }

      const newUsageDrugs = [...this.detail.usageDrugs]
      const target = newUsageDrugs.find(item => item.key === key)
      if (target) {
        target.editable = false
        this.$emit('update:detail', {
          ...this.detail,
          usageDrugs: newUsageDrugs
        })
        this.medicineCache = cloneDeep(newUsageDrugs)
        message.success('保存成功')
      }
      this.$emit('update:loading', false)
    }, 300),
    cancel (key) {
      const newUsageDrugs = [...this.detail.usageDrugs]
      const target = newUsageDrugs.find(item => key === item.key)
      if (target) {
        Object.assign(target, this.medicineCache.find(item => item.key === key))
        delete target.editable
        this.$emit('update:detail', {
          ...this.detail,
          usageDrugs: newUsageDrugs
        })
      }
    },
    handleTabChange (key) {
      this.$store.dispatch('annotation/setActiveLabel', key)
    },
    handleSearch: async function (value) {
      if (!value) {
        this.searchResults = []
        this.searching = false
        return
      }
      this.searching = true
      try {
        const res = await getDrugMaterialList({ name: value })
        if (res.code === 0 && res.data) {
          this.searchResults = res.data.map(item => ({
            code: item.pkMaterial,
            name: item.drugName,
            quantity: item.quantity || '',
            retailPrice: item.drugPrice ? parseFloat(item.drugPrice).toFixed(2) : '',
            conversionRate: item.drugRate || ''
          }))
        } else {
          message.error(res.msg || '获取药材列表失败')
        }
      } catch (error) {
        console.error('获取药材列表失败:', error)
        message.error('获取药材列表失败')
      } finally {
        this.searching = false
      }
    },
    debounceSearch: debounce(function (value) {
      this.handleSearch(value)
    }, 300),
    handlemedicineCodeChange (value, record) {
      const newUsageDrugs = [...this.detail.usageDrugs]
      const target = newUsageDrugs.find(item => item.key === record.key)

      if (!target) return

      if (!value) {
        // 处理清除操作 - 清空所有药材相关字段
        // Details 字段
        target.pk_materials = ''
        target.drug_code = ''
        target.drug_name = ''
        target.drug_quantity = ''
        target.drug_origquantity = ''
        target.pk_drug_processing = ''
        target.pk_drug_processing_name = ''
        target.pk_drug_unit = ''
        target.pk_drug_unit_name = 'g'

        // 兼容字段
        target.medicineCode = ''
        target.medicineName = ''
        target.quantity = ''
        target.retailPrice = ''
        target.conversionRate = ''
        target.drugProcessing = ''
        target.processMethod = ''
      } else {
        const selectedMedicine = this.searchResults.find(item => item.code === value)
        if (selectedMedicine) {
          // 更新 Details 对应字段
          target.pk_materials = selectedMedicine.code
          target.drug_code = selectedMedicine.code // 药材编码通常与PK相同
          target.drug_name = selectedMedicine.name
          target.drug_quantity = selectedMedicine.quantity || ''
          target.drug_origquantity = selectedMedicine.quantity || '' // 原使用量初始等于使用量

          // 更新兼容字段
          target.medicineCode = selectedMedicine.code
          target.medicineName = selectedMedicine.name
          target.quantity = selectedMedicine.quantity
          target.retailPrice = selectedMedicine.retailPrice
          target.conversionRate = selectedMedicine.conversionRate
        } else {
          return // 如果找不到对应药材，不执行后续操作
        }
      }

      // 清除对应字段的验证错误
      const medicineCodeKey = `${record.key}-medicineCode`
      const drugForshortKey = `${record.key}-drugForshort`
      const quantityKey = `${record.key}-quantity`

      // 清除相关字段的验证错误
      if (this.validationErrors[medicineCodeKey]) {
        this.$delete(this.validationErrors, medicineCodeKey)
      }
      if (this.validationErrors[drugForshortKey]) {
        this.$delete(this.validationErrors, drugForshortKey)
      }
      if (this.validationErrors[quantityKey]) {
        this.$delete(this.validationErrors, quantityKey)
      }

      // 检查当前行是否所有必填字段都已填写
      const isRowValid = this.checkRowValidation(target)
      if (isRowValid) {
        // 如果所有必填字段都已填写，清除所有相关的验证错误
        Object.keys(this.validationErrors).forEach(key => {
          if (key.startsWith(`${record.key}-`)) {
            this.$delete(this.validationErrors, key)
          }
        })
      }

      this.$emit('update:detail', {
        ...this.detail,
        usageDrugs: newUsageDrugs
      })
    },
    // 添加一个新方法用于检查行数据的验证状态
    checkRowValidation (record) {
      return (
        record.content &&
        record.medicineCode &&
        record.quantity
      )
    },
    getAnnotationContent (labelValue) {
      return this.annotationContents[labelValue] || ''
    },
    /**
     * 点击"标注"或"核方"按钮
     * @param {string} action - 操作类型：'annotation' 或 'verify'
     */
    showConfirmModal (action = 'annotation') {
      // 保存当前操作类型
      this.currentAction = action

      // 重置验证错误
      this.validationErrors = {}

      const usageDrugs = this.detail.usageDrugs || []
      let hasError = false

      // 检查药剂类型是否已填写
      if (!this.detail.dosageForms) {
        message.error('请选择药剂类型')
        return
      }

      // 检查手机号码格式
      if (!validatePhoneNumber(this.detail.patientPhone)) {
        message.error('请输入正确的联系电话格式')
        this.$store.dispatch('annotation/setActiveLabel', '基本信息')
        return
      }

      // 检查辨病、辩证、治疗思路、查看方案等必填字段
      const { diseaseList, syndromeList, treatmentList, patientViewPlan } = this.detail
      const requiredFieldErrors = []

      if (!diseaseList || diseaseList.length === 0) {
        requiredFieldErrors.push('辨病')
      }

      if (!syndromeList || syndromeList.length === 0) {
        requiredFieldErrors.push('辩证')
      }

      if (!treatmentList || treatmentList.length === 0) {
        requiredFieldErrors.push('治疗思路')
      }

      if (!patientViewPlan) {
        requiredFieldErrors.push('查看方案')
      }

      if (requiredFieldErrors.length > 0) {
        message.error(`请填写所有必填字段：${requiredFieldErrors.join('、')}`)
        return
      }

      // 检查每条记录的必填字段
      usageDrugs.forEach(drug => {
        if (!drug.content) {
          this.validationErrors[`${drug.key}-content`] = '识别数据不能为空'
          hasError = true
        }
        if (!drug.medicineCode) {
          this.validationErrors[`${drug.key}-medicineCode`] = '请选择药材'
          hasError = true
        }
        if (!drug.quantity) {
          this.validationErrors[`${drug.key}-quantity`] = '请填写数量'
          hasError = true
        }
      })

      if (hasError) {
        message.error('请完整填写药剂药量表格中的必填信息')
        this.$store.dispatch('annotation/setActiveLabel', '药剂药量')
        return
      }

      // 显示确认模态框
      this.confirmModalVisible = true
    },
    handleSubmit: debounce(async function () {
      // 验证必填字段
      if (!this.validateRequiredFields()) {
        this.confirmModalVisible = false
        return
      }

      try {
        // 根据不同的操作类型设置不同的状态值和调用不同的接口
        let labeledValue, verifiedValue

        if (this.currentAction === 'annotation') {
          // 点击"标注"按钮 - 只调用 savePrescribeDetail
          labeledValue = true
          verifiedValue = this.detail.verified // 保持原有的核方状态
        } else if (this.currentAction === 'verify') {
          // 点击"核方"按钮
          labeledValue = this.detail.labeled // 保持原有的标注状态
          verifiedValue = true // 核方状态设为true
        }

        // 准备提交数据
        const requestData = {
          ...this.detail,
          labeled: labeledValue,
          verified: verifiedValue,
          // 确保包含缩放和旋转参数
          zoomLevel: this.detail.zoomLevel || 1,
          rotationDegree: this.detail.rotationDegree || 0,
          // 添加必填字段的默认值
          useDayCount: this.detail.useDayCount || 1,
          packingSize: '',
          // 传递药房留言字段
          drugstoreMessage: this.detail.drugstoreMessage || '',
          // 传递疾病标签列表字段
          illnessLabelList: this.detail.illnessLabelList || [],
          // 确保药材列表数据正确传递
          usageDrugs: this.detail.usageDrugs || [],
          // materialList 传递实际的药材数据
          materialList: this.detail.usageDrugs || [],
          // 是否标注的字段：标注操作 或 核方时勾选了同步标注
          isSign: this.currentAction === 'annotation' || (this.currentAction === 'verify' && this.detail.labeled),
          followUpContent: '注意饮食',
          medicationEndDelivery: false,
          medicalRecordContent: '注意饮食',
          medicalRecordVersion: '1',
          // 如果是膏方，添加辅料列表
          accessoriesList: this.detail.isAccessories ? (this.detail.accessoriesList || []) : []
        }

        // 添加调试日志
        console.log('提交数据 requestData:', {
          usageDrugs: requestData.usageDrugs,
          materialList: requestData.materialList,
          drugstoreMessage: requestData.drugstoreMessage,
          illnessLabelList: requestData.illnessLabelList
        })

        if (this.currentAction === 'annotation') {
          // 标注操作：只调用 savePrescribeDetail
          const saveRes = await savePrescribeDetail(requestData)

          if (saveRes.code === 0) {
            message.success('标注保存成功')
            this.confirmModalVisible = false
            this.$router.push('/verify/list')
          } else {
            message.error(saveRes.msg || '保存标注详情失败')
          }
        } else if (this.currentAction === 'verify') {
          // 核方操作：根据"同步标注"复选框决定调用哪些接口
          if (this.detail.labeled) {
            // 勾选了"同步标注"：调用两个接口
            const saveRes = await savePrescribeDetail(requestData)
            if (saveRes.code !== 0) {
              message.error(saveRes.msg || '保存标注详情失败')
              return
            }

            const submitRes = await robotPrescribeHelperImageSubmit(requestData)
            if (submitRes.code === 0) {
              message.success('核方完成')
              this.confirmModalVisible = false
              this.$router.push('/verify/list')
            } else {
              message.error(submitRes.msg || '生成电子处方失败')
            }
          } else {
            // 没有勾选"同步标注"：只调用 robotPrescribeHelperImageSubmit
            const submitRes = await robotPrescribeHelperImageSubmit(requestData)
            if (submitRes.code === 0) {
              message.success('核方完成')
              this.confirmModalVisible = false
              this.$router.push('/verify/list')
            } else {
              message.error(submitRes.msg || '生成电子处方失败')
            }
          }
        }
      } catch (error) {
        console.error('提交失败:', error)
        message.error('提交失败：' + (error.message || '未知错误'))
      }
    }, 500),
    // 点击定位到标注
    handleAreaClick (record) {
      console.log(record.labelId, 'record.labelId==>')
      if (record && record.labelId) {
        this.$store.dispatch('annotation/setActiveRegionId', record.labelId)
      }
    },
    // 点击添加标注
    handleAddAnnotation (record) {
      console.log(record, 'handleAddAnnotation record==>')
      // 先切换到药剂药量标签
      this.$store.dispatch('annotation/setActiveLabel', '药剂药量')

      // 通知 AnnotationArea 组件激活标注工具，并传递当前记录的 key
      this.$store.dispatch('annotation/setActivateAnnotation', {
        active: true,
        pendingKey: record.key
      })

      console.log('handleAddAnnotation', record.key)
    },
    // 获取验证状态
    getValidateStatus (record, field) {
      if (!record.editable) return ''
      const key = `${record.key}-${field}`
      if (this.validationErrors[key]) return 'error'
      if (record[field]) return 'success'
      return ''
    },

    // 获取验证提示信息
    getValidateHelp (record, field) {
      if (!record.editable) return ''
      const key = `${record.key}-${field}`
      return this.validationErrors[key]
    },

    handleSelectFocus (record) {
      if (record.medicineName) {
        this.handleSearch(record.medicineName)
      } else {
        this.searchResults = []
      }
    },

    // 验证必填字段
    validateRequiredFields () {
      const { diseaseList, syndromeList, treatmentList, patientViewPlan } = this.detail

      const errors = []

      if (!diseaseList || diseaseList.length === 0) {
        errors.push('辨病')
      }

      if (!syndromeList || syndromeList.length === 0) {
        errors.push('辩证')
      }

      if (!treatmentList || treatmentList.length === 0) {
        errors.push('治疗思路')
      }

      if (!patientViewPlan) {
        errors.push('查看方案')
      }

      if (errors.length > 0) {
        message.error(`请填写所有必填字段：${errors.join('、')}`)
        return false
      }

      return true
    }
  },
  created () {
    // 初始化药材列表和处理方法列表
    this.getDrugMaterialList()
    this.getEnabledDictDataListByType()
  }
}
</script>

<style lang="less" scoped>
.table-header {
  background-color: #fff;
  padding: 10px;
}

.tabs-wrapper {
  width: 100%;
  margin-bottom: 10px;
}

// 添加固定列样式
:deep(.ant-table-thead > tr > th.ant-table-fixed-column) {
  background: #fafafa;
}

:deep(.ant-table-tbody > tr > td.ant-table-fixed-column) {
  background: #fff;
}

// 添加以下样式规则
:deep(.ant-table-fixed-right) {
  background: #fff;
  z-index: 2;
}

.result-content {
  margin-top: 16px;
  background-color: #fff;

  .result-text {
    font-family: monospace;
    white-space: pre-wrap;
    line-height: 1.8;
    margin-bottom: 16px;
  }

  .prescription-header,
  .prescription-medicines,
  .prescription-method,
  .prescription-dosage {
    padding: 8px 0;
  }

  .prescription-separator {
    color: #999;
    line-height: 1;
  }

  .prescription-type {
    margin: 16px 0;

    span {
      margin-right: 16px;
    }
  }

  .prescription-actions {
    margin-top: 24px;

    .ant-btn {
      width: 100%;
      height: 40px;
    }
  }
}

.control-buttons {
  display: flex;
  gap: 16px;
  align-items: center;
}

// 调整卡片标题样式
:deep(.ant-card-head-title) {
  font-weight: bold;
}

// 调整单选按钮组样式
:deep(.ant-radio-group) {
  .ant-radio-wrapper {
    margin-right: 24px;
  }
}
</style>
