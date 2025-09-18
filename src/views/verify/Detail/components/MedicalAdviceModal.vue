<template>
  <a-modal
    title="医嘱"
    :visible="visible"
    :footer="null"
    @cancel="handleCancel"
    width="500px"
    :destroyOnClose="false"
  >
    <div class="medical-advice-container">
      <!-- 医嘱输入框 -->
      <a-textarea
        v-model="adviceText"
        :rows="4"
        placeholder="请输入医嘱内容"
        class="advice-textarea"
        @input="handleAdviceTextInput"
      />

      <!-- 服药时间 Tab -->
      <div class="tab-section">
        <div class="tab-title">服药时间</div>
        <div class="tag-container">
          <a-tag
            v-for="item in medicineTimeList"
            :key="item.id"
            class="advice-tag"
            :class="{ 'advice-tag-selected': selectedMedicineTimes.includes(item.value) }"
            @click="handleTagClick(item.value, 'medicineTime')"
          >
            {{ item.label }}
          </a-tag>
        </div>
      </div>

      <!-- 服药禁忌 Tab -->
      <div class="tab-section">
        <div class="tab-title">服药禁忌</div>
        <div class="tag-container">
          <a-tag
            v-for="item in contraindicationList"
            :key="item.id"
            class="advice-tag"
            :class="{ 'advice-tag-selected': selectedContraindications.includes(item.value) }"
            @click="handleTagClick(item.value, 'contraindication')"
          >
            {{ item.label }}
          </a-tag>
        </div>
      </div>

      <!-- 底部按钮 -->
      <div class="modal-footer">
        <a-button @click="handleCancel" class="cancel-btn">取消</a-button>
        <a-button type="primary" @click="handleSave" class="save-btn">保存</a-button>
      </div>
    </div>
  </a-modal>
</template>

<script>
import { getMedicineTimeDict, getContraindicationDict } from '@/api/annotation'

export default {
  name: 'MedicalAdviceModal',
  props: {
    visible: {
      type: Boolean,
      default: false
    },
    initialValue: {
      type: String,
      default: ''
    }
  },
  data () {
    return {
      adviceText: '',
      medicineTimeList: [],
      contraindicationList: [],
      selectedMedicineTimes: [],
      selectedContraindications: [],
      loading: false,
      inputTimer: null
    }
  },
  watch: {
    visible (newVal) {
      console.log('Modal visible changed:', newVal)
      if (newVal) {
        this.adviceText = this.initialValue
        this.fetchData() // fetchData will call parseInitialValue after data is loaded
      }
    }
  },
  created () {
    console.log('MedicalAdviceModal created, visible:', this.visible)
  },
  methods: {
    // 获取服药时间和禁忌数据
    async fetchData () {
      this.loading = true
      try {
        // 同时请求两个接口
        const [medicineTimeRes, contraindicationRes] = await Promise.all([
          getMedicineTimeDict(),
          getContraindicationDict()
        ])

        // 处理服药时间数据
        if (medicineTimeRes.code === 0 && medicineTimeRes.data) {
          this.medicineTimeList = medicineTimeRes.data
        }

        // 处理服药禁忌数据
        if (contraindicationRes.code === 0 && contraindicationRes.data) {
          this.contraindicationList = contraindicationRes.data
        }

        // 数据加载完成后，解析初始值并选中匹配的标签
        this.parseInitialValue()
      } catch (error) {
        console.error('获取医嘱数据失败:', error)
      } finally {
        this.loading = false
      }
    },

    // 解析初始值，标记已选中的选项
    parseInitialValue () {
      if (!this.initialValue) return

      // 使用更新后的方法来处理初始值
      this.adviceText = this.initialValue
      this.updateSelectedTagsFromText()
    },

    // 处理标签点击
    handleTagClick (value, type) {
      if (type === 'medicineTime') {
        const index = this.selectedMedicineTimes.indexOf(value)
        if (index > -1) {
          // 如果已选中，则取消选中
          this.selectedMedicineTimes.splice(index, 1)
          this.removeItemFromAdviceText(value)
        } else {
          // 如果未选中，则添加选中
          this.selectedMedicineTimes.push(value)
          this.addItemToAdviceText(value)
        }
      } else if (type === 'contraindication') {
        const index = this.selectedContraindications.indexOf(value)
        if (index > -1) {
          // 如果已选中，则取消选中
          this.selectedContraindications.splice(index, 1)
          this.removeItemFromAdviceText(value)
        } else {
          // 如果未选中，则添加选中
          this.selectedContraindications.push(value)
          this.addItemToAdviceText(value)
        }
      }
    },

    // 向医嘱文本中添加项
    addItemToAdviceText (item) {
      if (!this.adviceText) {
        this.adviceText = item
      } else if (!this.adviceText.includes(item)) {
        this.adviceText = this.adviceText.trim()
        // 检查最后一个字符是否是逗号
        if (this.adviceText.endsWith('，')) {
          this.adviceText += item
        } else {
          this.adviceText += '，' + item
        }
      }
      // 更新选中的标签
      this.updateSelectedTagsFromText()
    },

    // 从医嘱文本中移除项
    removeItemFromAdviceText (item) {
      if (!this.adviceText) return

      // 处理项在文本开头的情况
      if (this.adviceText.startsWith(item + '，')) {
        this.adviceText = this.adviceText.substring(item.length + 1)
      } else if (this.adviceText.includes('，' + item + '，')) { // 处理项在文本中间的情况
        this.adviceText = this.adviceText.replace('，' + item + '，', '，')
      } else if (this.adviceText.endsWith('，' + item)) { // 处理项在文本末尾的情况
        this.adviceText = this.adviceText.substring(0, this.adviceText.length - item.length - 1)
      } else if (this.adviceText === item) { // 处理项是唯一内容的情况
        this.adviceText = ''
      } else { // 处理其他情况
        this.adviceText = this.adviceText.replace('，' + item, '')
        this.adviceText = this.adviceText.replace(item + '，', '')
      }
      // 更新选中的标签
      this.updateSelectedTagsFromText()
    },

    // 取消按钮处理
    handleCancel () {
      this.$emit('cancel')
    },

    // 保存按钮处理
    handleSave () {
      this.$emit('save', this.adviceText)
    },

    // 处理医嘱文本输入
    handleAdviceTextInput () {
      // 清除之前的定时器
      if (this.inputTimer) {
        clearTimeout(this.inputTimer)
      }

      // 替换空格和其他分隔符为中文逗号
      const normalizedText = this.adviceText.replace(/[\s,;，；]+/g, '，')
      if (normalizedText !== this.adviceText) {
        this.adviceText = normalizedText
      }

      // 设置500毫秒的定时器，如果用户停止输入，则检查并添加逗号
      this.inputTimer = setTimeout(() => {
        // 检查文本中是否有需要添加逗号的部分
        const items = this.adviceText.split('，').map(item => item.trim()).filter(item => item)
        if (items.length > 0) {
          // 检查最后一项是否为空（已经有逗号结尾）
          const lastItem = items[items.length - 1]
          if (lastItem && lastItem.trim() !== '') {
            // 如果最后一项不为空且不是以逗号结尾，添加逗号
            if (!this.adviceText.endsWith('，')) {
              this.adviceText += '，'
            }
          }
        }

        // 解析文本并自动选中匹配的标签
        this.updateSelectedTagsFromText()
      }, 500)
    },

    // 根据输入文本更新选中的标签
    updateSelectedTagsFromText () {
      if (!this.adviceText) {
        this.selectedMedicineTimes = []
        this.selectedContraindications = []
        return
      }

      // 分割文本为项目，并移除空项
      const items = this.adviceText.split('，').map(item => item.trim()).filter(item => item)

      // 重置选中状态
      this.selectedMedicineTimes = []
      this.selectedContraindications = []

      // 检查每个项是否完全匹配标签
      items.forEach(item => {
        // 检查服药时间
        if (this.medicineTimeList && this.medicineTimeList.length > 0) {
          const medicineTimeMatch = this.medicineTimeList.find(mt =>
            mt.value === item || mt.label === item
          )

          if (medicineTimeMatch) {
            if (!this.selectedMedicineTimes.includes(medicineTimeMatch.value)) {
              this.selectedMedicineTimes.push(medicineTimeMatch.value)

              // 如果文本中的项与标签的value不完全匹配，替换为标准值
              if (item !== medicineTimeMatch.value) {
                this.adviceText = this.adviceText.replace(item, medicineTimeMatch.value)
              }
            }
          }
        }

        // 检查服药禁忌
        if (this.contraindicationList && this.contraindicationList.length > 0) {
          const contraindicationMatch = this.contraindicationList.find(ci =>
            ci.value === item || ci.label === item
          )

          if (contraindicationMatch) {
            if (!this.selectedContraindications.includes(contraindicationMatch.value)) {
              this.selectedContraindications.push(contraindicationMatch.value)

              // 如果文本中的项与标签的value不完全匹配，替换为标准值
              if (item !== contraindicationMatch.value) {
                this.adviceText = this.adviceText.replace(item, contraindicationMatch.value)
              }
            }
          }
        }
      })

      console.log('更新后的选中服药时间:', this.selectedMedicineTimes)
      console.log('更新后的选中服药禁忌:', this.selectedContraindications)
    }
  }
}
</script>

<style lang="less" scoped>
.medical-advice-container {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.advice-textarea {
  background-color: #f5f5f5;
  border-radius: 4px;
  padding: 10px;
}

.tab-section {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.tab-title {
  font-size: 16px;
  font-weight: 500;
  color: #333;
}

.tag-container {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.advice-tag {
  cursor: pointer;
  padding: 6px 12px;
  border-radius: 20px;
  margin-right: 0;
  font-size: 14px;
  background-color: #e6f7ff;
  color: #00a3a3;
  border: none;

  &:hover {
    opacity: 0.8;
  }
}

.advice-tag-selected {
  background-color: #00c2c2 !important;
  color: white;
}

.modal-footer {
  display: flex;
  justify-content: space-between;
  margin-top: 20px;
}

.cancel-btn, .save-btn {
  width: 48%;
  height: 40px;
  border-radius: 4px;
}
</style>
