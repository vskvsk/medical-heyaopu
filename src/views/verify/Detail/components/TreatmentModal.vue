<template>
  <a-modal
    title="治疗思路"
    :visible="visible"
    :confirmLoading="loading"
    @ok="handleSave"
    @cancel="handleCancel"
    width="600px"
  >
    <div class="treatment-modal-content">
      <a-form-item label="治疗思路">
        <SearchableTagInput
          title="治疗思路"
          placeholder="请输入治疗思路"
          :value="selectedItems"
          :dataSource="dataSource"
          type="treatment"
          tagColor="#13c2c2"
          @change="handleItemsChange"
        />
      </a-form-item>
    </div>
  </a-modal>
</template>

<script>
import SearchableTagInput from './SearchableTagInput'

export default {
  name: 'TreatmentModal',
  components: {
    SearchableTagInput
  },
  props: {
    visible: {
      type: Boolean,
      default: false
    },
    initialValue: {
      type: Array,
      default: () => []
    },
    dataSource: {
      type: Array,
      default: () => []
    }
  },
  data () {
    return {
      loading: false,
      selectedItems: []
    }
  },
  watch: {
    visible (val) {
      if (val) {
        // 当弹窗显示时，初始化选中项
        this.selectedItems = [...this.initialValue]
      }
    }
  },
  methods: {
    handleItemsChange (items) {
      this.selectedItems = items
    },
    handleSave () {
      this.loading = true
      // 延迟一下，模拟保存过程
      setTimeout(() => {
        this.$emit('save', this.selectedItems)
        this.loading = false
      }, 300)
    },
    handleCancel () {
      this.$emit('cancel')
    }
  }
}
</script>

<style lang="less" scoped>
.treatment-modal-content {
  padding: 10px;
}
</style>
