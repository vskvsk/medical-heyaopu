<template>
  <page-header-wrapper>
    <a-card :bordered="false">
      <!-- 搜索区域 -->
      <div class="table-page-search-wrapper">
        <a-form layout="inline">
          <a-row :gutter="48" style="width: 100%;">
            <a-col :md="16" :sm="24">
              <a-form-item>
                <a-input-search
                  v-model="queryParam.keyword"
                  placeholder="输入开方医生姓名或者药方编号搜索"
                  @search="onSearch"
                />
              </a-form-item>
            </a-col>
            <a-col :md="8" :sm="24">
              <span class="table-page-search-submitButtons">
                <a-button type="primary" @click="handleExport" icon="download">
                  导出项目
                </a-button>
              </span>
            </a-col>
          </a-row>
        </a-form>
      </div>

      <!-- 状态筛选区 -->
      <div class="table-filter-wrapper">
        <a-row type="flex" align="middle" :gutter="16">
          <a-col>
            <a-radio-group v-model="queryParam.status" @change="onStatusChange">
              <a-radio-button value="all">全部</a-radio-button>
              <a-radio-button value="unverified">待核方 <span v-if="unverifiedCount > 0" class="count-badge">({{ unverifiedCount }})</span></a-radio-button>
              <a-radio-button value="verified">已核方</a-radio-button>
              <a-radio-button value="unlabeled">待标注</a-radio-button>
              <a-radio-button value="labeled">已标注</a-radio-button>
              <a-radio-button value="finished">已完成</a-radio-button>
            </a-radio-group>
          </a-col>

        </a-row>
      </div>

      <!-- 表格 -->
      <s-table
        ref="table"
        size="default"
        :columns="columns"
        :data="loadData"
        :rowKey="(record) => record.id"
        :scroll="{ x: 3200 }"
        :loading="loading"
        :showSizeChanger="false"
        :pagination="{
          showSizeChanger: false,
          pageSize: 10,
        }"
      >

        <!-- 添加时间格式化插槽 -->
        <template slot="prescriptionDate" slot-scope="text, record">
          {{ formatDateTime(record.createTime) }}
        </template>
        <template slot="prescriptionStatus" slot-scope="text, record">
          <a-tag :color="prescriptionStatusMap[record.prescriptionStatus]?.color">
            {{ prescriptionStatusMap[record.prescriptionStatus]?.text || '未知状态' }}
          </a-tag>
        </template>

        <template slot="orderStatus" slot-scope="text, record">
          <a-tag :color="orderStatusMap[record.orderStatus]?.color">
            {{ orderStatusMap[record.orderStatus]?.text || '未知状态' }}
          </a-tag>
        </template>

        <template slot="action" slot-scope="text, record">
          <div class="action-btns">
            <a-button
              type="link"
              @click="handleDetail(record)"
            >
              查看详情
            </a-button>
          </div>
        </template>
      </s-table>
    </a-card>
  </page-header-wrapper>
</template>

<script>
import { STable } from '@/components'
import { columns, prescriptionStatusMap, orderStatusMap } from './data'
import { getPrescriptionList, exportPrescriptionList } from '@/api/annotation'
import { message } from 'ant-design-vue'

export default {
  name: 'VerifyList',
  components: {
    STable
  },
  data () {
    return {
      // 查询参数
      queryParam: {
        status: 'unverified',
        keyword: ''
      },
      // 表格列定义
      columns: columns,
      // 添加状态映射到 data 中以便模板使用
      prescriptionStatusMap,
      orderStatusMap,
      // 添加 loading 状态
      loading: false,
      // 状态映射对象
      statusParamsMap: {
        unverified: { isNuclearSide: false, isSign: null },
        verified: { isNuclearSide: true, isSign: null },
        unlabeled: { isNuclearSide: null, isSign: false },
        labeled: { isNuclearSide: null, isSign: true },
        finished: { isNuclearSide: true, isSign: true }
      },
      // 新增数据属性
      unverifiedCount: 0
    }
  },
  methods: {
    loadData (parameter) {
      const params = {
        ...parameter,
        keyword: this.queryParam.keyword,
        pageNo: parameter.pageNo || 1,
        pageSize: parameter.pageSize || 10,
        manualQuery: true
      }

      if (this.queryParam.status !== 'all') {
        Object.assign(params, this.statusParamsMap[this.queryParam.status])
      }

      return getPrescriptionList(params).then(res => {
        // 在加载数据后立即获取未核方数量
        if (this.queryParam.status === 'unverified') {
          this.fetchUnverifiedCount()
        }
        return {
          data: res.data?.list || [],
          pageNo: parameter.pageNo || 1,
          totalCount: res.data?.total || 0
        }
      })
    },
    // 获取未核方数量
    async fetchUnverifiedCount () {
      // try {
      //   const res = await getNewCount()
      //   if (res.code === 0) {
      //     this.unverifiedCount = res.data || 0
      //   }
      // } catch (error) {
      //   console.error('获取未核方数量失败:', error)
      // }
    },
    async onSearch (value) {
      this.loading = true
      try {
        this.queryParam.keyword = value
        await this.$refs.table.refresh(true)
        // 搜索后立即获取未核方数量
        if (this.queryParam.status === 'unverified') {
          await this.fetchUnverifiedCount()
        }
      } catch (error) {
        console.error('搜索失败:', error)
        this.$message.error('搜索失败：' + (error.message || '未知错误'))
      } finally {
        this.loading = false
      }
    },
    onStatusChange (e) {
      this.queryParam.status = e.target.value
      if (e.target.value === 'unverified') {
        this.fetchUnverifiedCount()
      }
      this.$refs.table.refresh(true)
    },
    handleVerify (record) {
      // 处理标注操作
      console.log('标注:', record)
    },
    handleCheck (record) {
      // 处理核方操作
      console.log('核方:', record)
    },
    // 导出
    handleExport () {
      const hide = message.loading('正在导出...', 0)

      // 构造与查询列表一致的参数
      const params = {
        keyword: this.queryParam.keyword
      }

      // 添加状态参数，与查询列表保持一致
      if (this.queryParam.status !== 'all') {
        Object.assign(params, this.statusParamsMap[this.queryParam.status])
      }

      exportPrescriptionList(params).then(response => {
        // 创建 Blob 对象
        const blob = new Blob([response], { type: 'application/vnd.ms-excel' })
        // 创建下载链接
        const link = document.createElement('a')
        link.href = window.URL.createObjectURL(blob)
        // 设置文件名
        link.download = `核方列表_${new Date().getTime()}.xlsx`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        window.URL.revokeObjectURL(link.href)

        message.success('导出成功')
      }).catch(error => {
        console.error('导出失败:', error)
        message.error('导出失败：' + (error.message || '未知错误'))
      }).finally(() => {
        hide()
      })
    },
    // 查看详情
    handleDetail (record) {
      console.log(record, 'record==>')
      if (!record || !record.id) {
        this.$message.error('记录ID不存在')
        return
      }
      // isNuclearSide为false表示待核方
      this.$router.push({
        path: `/verify/detail/${record.id}`,
        query: { isNuclearSide: record.isNuclearSide }
      })
    },

    // 使用原生 JS 实现时间格式化
    formatDateTime (timestamp) {
      if (!timestamp) return ''
      // 处理不同格式的时间戳
      let date
      if (typeof timestamp === 'string') {
        // 如果是字符串格式（如 ISO 8601），直接创建 Date 对象
        date = new Date(timestamp)
      } else {
        // 如果是数字时间戳
        date = new Date(Number(timestamp))
      }
      // 检查日期是否有效
      if (isNaN(date.getTime())) {
        return '无效日期'
      }

      // 补零函数
      const pad = (num) => (num < 10 ? '0' + num : num)

      const year = date.getFullYear()
      const month = pad(date.getMonth() + 1)
      const day = pad(date.getDate())
      const hours = pad(date.getHours())
      const minutes = pad(date.getMinutes())

      return `${year}-${month}-${day} ${hours}:${minutes}`
    }

  },
  created () {
    // 如果初始状态是未核方，获取未核方数量
    if (this.queryParam.status === 'unverified') {
      this.fetchUnverifiedCount() // 初始化时获取未核方数量
    }
  }
}

</script>

<style lang="less" scoped>

.count-badge {
  color: #1890ff;
  font-weight: bold;
}
.table-page-search-wrapper {
  margin-bottom: 16px;
}

.table-filter-wrapper {
  margin-bottom: 16px;

  :deep(.ant-radio-group) {
    .ant-radio-button-wrapper {
      min-width: 88px;
      text-align: center;
    }
  }
}

.action-btns {
  button {
    padding: 0 4px;
  }
}

:deep(.ant-table-thead > tr > th.ant-table-fixed-column) {
  background: #fafafa;
}

:deep(.ant-table-tbody > tr > td.ant-table-fixed-column) {
  background: #fff;
}

.table-page-search-submitButtons {
  display: flex;
  justify-content: flex-end;
  margin-bottom: 24px;
}
</style>
