<template>
  <a-modal
    title="辨病"
    :visible="visible"
    :confirmLoading="loading"
    @ok="handleSave"
    @cancel="handleCancel"
    width="600px"
  >
    <div class="disease-modal-content">
      <a-form-item label="辨病">
        <SearchableTagInput
          title="辨病"
          placeholder="请输入辨病"
          :value="selectedItems"
          :type="2"
          tagColor="#13c2c2"
          :preloadedResults="preloadedResults"
          @change="handleItemsChange"
        />
      </a-form-item>
    </div>
  </a-modal>
</template>

<script>
import SearchableTagInput from './SearchableTagInput'

export default {
  name: 'DiseaseModal',
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
    preloadedResults: {
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
.disease-modal-content {
  padding: 10px;
}
</style>
