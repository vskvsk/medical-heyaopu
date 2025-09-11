<template>
  <div class="searchable-tag-input">
    <div class="input-container" :class="{ 'has-tags': selectedTags.length > 0 }">

      <!-- 输入框和确认按钮 -->
      <div class="input-with-button">
        <a-input
          ref="searchInput"
          :placeholder="placeholder"
          v-model="searchText"
          @input="handleSearch"
          @keydown.enter="handleEnterKey"
          @focus="handleFocus"
          @blur="handleBlur"
        >
          <a-icon slot="suffix" type="loading" v-if="loading" />
        </a-input>
        <a-button
          v-if="searchText"
          type="primary"
          class="confirm-button"
          @click="handleConfirm"
        >
          确定
        </a-button>
      </div>

      <!-- 搜索结果列表 -->
      <div class="search-results" v-if="searchResults.length > 0">
        <a-tag
          v-for="item in filteredResults"
          :key="item.id"
          class="result-tag"
          :class="{ 'selected': isSelected(item) }"
          @click="selectTag(item)"
        >
          {{ item.name || item }}
        </a-tag>
      </div>

      <!-- 标签 -->
      <div class="selected-tags" v-if="selectedTags.length > 0">
        <a-tag
          v-for="tag in selectedTags"
          :key="tag.id"
          :color="tagColor"
          closable
          @close="removeTag(tag)"
        >
          {{ tag.name || tag }}
        </a-tag>
      </div>
    </div>
  </div>
</template>

<script>
import { queryLabel } from '@/api/annotation'
// Use lodash instead of lodash-es to avoid TypeScript issues
import debounce from 'lodash/debounce'

export default {
  name: 'SearchableTagInput',
  props: {
    title: {
      type: String,
      required: true
    },
    placeholder: {
      type: String,
      default: '请输入'
    },
    type: {
      type: [String, Number],
      default: 'default'
    },
    tagColor: {
      type: String,
      default: '#13c2c2'
    },
    value: {
      type: Array,
      default: () => []
    },
    // 可选项数据源
    dataSource: {
      type: Array,
      default: () => []
    },
    // 是否允许创建新标签
    allowCreate: {
      type: Boolean,
      default: true
    },
    // 预加载的搜索结果
    preloadedResults: {
      type: Array,
      default: () => []
    }
  },
  data () {
    return {
      searchText: '',
      selectedTags: this.value || [],
      showResults: false,
      searchResults: [],
      isFocused: false,
      loading: false
    }
  },
  computed: {
    filteredResults () {
      // 不过滤已选择的项，直接返回所有搜索结果
      return this.searchResults
    }
  },
  watch: {
    value: {
      handler (newVal) {
        if (newVal) {
          this.selectedTags = newVal
        }
      },
      deep: true
    },
    preloadedResults: {
      handler (newVal) {
        if (newVal && newVal.length > 0) {
          this.processSearchResults(newVal)
        }
      },
      immediate: true
    }
  },
  created () {
    // 创建一个防抖的搜索函数
    this.debouncedSearch = debounce(this.fetchSearchResults, 300)
  },

  mounted () {
    // 组件挂载时加载初始数据
    // 使用setTimeout避免影响输入框的聚焦
    setTimeout(() => {
      // 如果有预加载的搜索结果，直接使用
      if (this.preloadedResults && this.preloadedResults.length > 0 && (this.type === 2 || this.type === 3)) {
        // 处理预加载的搜索结果
        this.processSearchResults(this.preloadedResults)
      } else if (this.type === 2 || this.type === 3) {
        // 只在有已选中项目时加载数据，避免不必要的请求
        if (this.selectedTags.length > 0) {
          this.fetchSearchResults()
        }
      } else if (this.type === 'treatment' && this.dataSource.length > 0) {
        // 如果是治疗思路类型，直接使用数据源
        this.searchResults = this.dataSource
        // 初始化时不显示搜索结果，避免干扰用户
        this.showResults = false
      }
    }, 300)
  },
  methods: {
    handleSearch () {
      // 如果是治疗思路类型，使用本地数据源过滤
      if (this.type === 'treatment') {
        if (!this.searchText) {
          this.searchResults = this.dataSource
        } else {
          this.searchResults = this.dataSource.filter(item =>
            item.name.toLowerCase().includes(this.searchText.toLowerCase())
          )
        }
        // 只在有搜索文本时显示搜索结果，避免干扰用户
        this.showResults = !!this.searchText
      } else {
        // 如果是辨病或辨证类型，使用API查询
        this.debouncedSearch()
      }
    },

    // 处理搜索结果数据
    processSearchResults (data) {
      // 处理返回的字符串数组格式
      if (Array.isArray(data) && typeof data[0] === 'string') {
        // 将字符串数组转换为对象数组
        this.searchResults = data.map(name => ({
          id: `${name}-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`,
          name: name
        }))
      } else {
        // 原来的对象数组格式
        this.searchResults = data
      }
      // 只在有搜索文本时显示搜索结果，避免干扰用户
      this.showResults = !!this.searchText
    },

    // 从服务器获取搜索结果
    async fetchSearchResults () {
      if (this.type !== 2 && this.type !== 3) {
        return
      }

      this.loading = true
      try {
        const res = await queryLabel(this.type, this.searchText)
        if (res.code === 0 && res.data) {
          this.processSearchResults(res.data)
        } else {
          this.searchResults = []
          this.showResults = false
          console.error('Failed to fetch search results:', res.message)
        }
      } catch (error) {
        console.error('Error fetching search results:', error)
        this.searchResults = []
        this.showResults = false
      } finally {
        this.loading = false
      }
    },

    handleEnterKey (e) {
      // 如果搜索框为空，也触发查询并显示结果
      if (!this.searchText) {
        this.fetchSearchResults()
        // 特别处理：当用户按回车且搜索框为空时，显示搜索结果
        // 使用setTimeout避免影响输入框的聚焦
        setTimeout(() => {
          if (this.searchResults.length > 0) {
            this.showResults = true
          }
        }, 300)
        e.preventDefault()
        return
      }

      // 如果没有匹配项且允许创建，则创建新标签
      if (this.filteredResults.length === 0 && this.allowCreate) {
        const newTag = {
          id: `new-${Date.now()}`,
          name: this.searchText,
          isNew: true
        }
        this.selectTag(newTag)
        e.preventDefault()
      } else if (this.filteredResults.length > 0) {
        // 选择第一个匹配项
        this.selectTag(this.filteredResults[0])
        e.preventDefault()
      }

      // 选择后清空搜索文本，但不触发新的搜索
      // 保持当前搜索结果显示
    },

    // 处理确定按钮点击
    handleConfirm () {
      if (!this.searchText) return

      // 如果有匹配项，选择第一个
      if (this.filteredResults.length > 0) {
        this.selectTag(this.filteredResults[0])
      } else if (this.allowCreate) {
        // 否则创建新标签
        const newTag = {
          id: `new-${Date.now()}`,
          name: this.searchText,
          isNew: true
        }
        this.selectTag(newTag)
      }

      // 选择后清空搜索文本，但不触发新的搜索
      // 保持当前搜索结果显示
    },

    // 选择标签
    selectTag (tag) {
      if (!this.isSelected(tag)) {
        const newSelectedTags = [...this.selectedTags, tag]
        this.selectedTags = newSelectedTags
        this.$emit('input', newSelectedTags)
        this.$emit('change', newSelectedTags)
        this.searchText = ''
        // 保持搜索结果显示，不清空搜索结果
        // this.searchResults = []
        // this.showResults = false
      }
    },

    // 移除标签
    removeTag (tag) {
      const newSelectedTags = this.selectedTags.filter(t => t.id !== tag.id)
      this.selectedTags = newSelectedTags
      this.$emit('input', newSelectedTags)
      this.$emit('change', newSelectedTags)
    },

    // 检查标签是否已选中
    isSelected (item) {
      // 处理不同格式的数据，包括字符串和对象
      if (!item) return false

      const itemName = typeof item === 'string' ? item : item.name

      return this.selectedTags.some(tag => {
        const tagName = typeof tag === 'string' ? tag : tag.name
        return tagName === itemName || (tag.id && tag.id === item.id)
      })
    },

    // 处理输入框获得焦点
    handleFocus () {
      this.isFocused = true

      // 当有搜索结果时显示搜索结果
      if (this.searchResults.length > 0) {
        this.showResults = true
      }
      // 不在聚焦时触发搜索，避免频繁请求和聚焦问题
    },

    // 处理输入框失去焦点
    handleBlur () {
      // 只更新焦点状态，不隐藏搜索结果
      setTimeout(() => {
        this.isFocused = false
        // 不隐藏搜索结果
        // this.showResults = false
      }, 200)
    }
  }
}
</script>

<style lang="less" scoped>
.searchable-tag-input {
  margin-bottom: 16px;

  .input-title {
    font-size: 14px;
    margin-bottom: 8px;
    font-weight: 500;
  }

  .input-container {
    position: relative;
    border-radius: 4px;
    padding: 4px 0px;
    background-color: #fff;
    transition: all 0.3s;

    &:hover {
      border-color: #40a9ff;
    }

    &.has-tags {
      padding-top: 8px;
    }

    .input-with-button {
      display: flex;
      align-items: center;

      .ant-input-affix-wrapper {
        flex: 1;
      }

      .confirm-button {
        margin-left: 8px;
        border-radius: 4px;
        height: 32px;
        line-height: 32px;
        padding: 0 15px;
      }
    }

    .selected-tags {
      display: flex;
      flex-wrap: wrap;
      margin-top: 10px;

      .ant-tag {
        margin-right: 8px;
        margin-bottom: 4px;
        display: flex;
        align-items: center;

        .anticon-close {
          color: rgba(255, 255, 255, 0.85);
          margin-left: 4px;
        }
      }
    }

    .search-results {
      max-height: 200px;
      overflow-y: auto;
      background-color: #fff;
      border-radius: 0 0 4px 4px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
      z-index: 1050;
      padding: 8px 0;
      display: flex;
      flex-wrap: wrap;

      .result-tag {
        margin: 4px;
        cursor: pointer;
        transition: all 0.3s;

        &:hover {
          opacity: 0.8;
        }

        &.selected {
          background-color: #e6f7ff;
          color: #1890ff;
          border-color: #1890ff;
        }
      }
    }
  }
}
</style>
