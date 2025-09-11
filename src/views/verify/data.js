// 处理状态的颜色映射示例
export const prescriptionStatusMap = {
  pending: { text: '待核方', color: 'orange' },
  verified: { text: '待标注', color: 'blue' },
  completed: { text: '已完成', color: 'green' }
}

// 收款状态的颜色映射示例
export const orderStatusMap = {
  unpaid: { text: '未收款', color: 'red' },
  paid: { text: '已收款', color: 'green' },
  partial: { text: '部分收款', color: 'orange' }
}

// 性别
export const genderMap = {
  1: '男',
  0: '女'
}

// 开方订单状态(1-未支付,2-已支付,3-取消支付,4-已发货,5-已收货)
export const prescribeStatusMap = {
  1: '未支付',
  2: '已支付',
  3: '取消支付',
  4: '已发货',
  5: '已收货'
}
// 开方方式映射
export const prescribeTypeMap = {
  1: '在线开方',
  2: '拍照开方'
}

export const columns = [
  {
    title: '处方ID',
    dataIndex: 'id'
  },
  // {
  //   title: '有效状态',
  //   dataIndex: 'validStatus'
  // },
  // {
  //   title: '保密处方',
  //   dataIndex: 'isConfidential'
  // },
  // {
  //   title: '是否加急',
  //   dataIndex: 'isUrgent'
  // },
  {
    title: '处方状态',
    dataIndex: 'fstatusflag_name'
  },
  {
    title: '开方方式',
    dataIndex: 'prescribeType',
    customRender: (text) => prescribeTypeMap[text] || '--'
  },
  // {
  //   title: '发送方式',
  //   dataIndex: 'sendType'
  // },
  // {
  //   title: '处理状态',
  //   dataIndex: 'prescriptionStatus',
  //   scopedSlots: { customRender: 'prescriptionStatus' },
  //   key: 'prescriptionStatus'
  // },
  // {
  //   title: '收款状态',
  //   dataIndex: 'orderStatus',
  //   scopedSlots: { customRender: 'orderStatus' },
  //   key: 'orderStatus'
  // },
  // {
  //   title: '到期日期',
  //   dataIndex: 'expiryDate',
  //   sorter: true
  // },
  {
    title: '医生',
    dataIndex: 'doctorName'
  },
  // {
  //   title: '认证身份',
  //   dataIndex: 'identityType'
  // },
  // {
  //   title: '业务员',
  //   dataIndex: 'salesperson'
  // },
  // {
  //   title: '预计出药时间',
  //   dataIndex: 'expectedDeliveryTime'
  // },
  {
    title: '开方日期',
    dataIndex: 'creationtime',
    scopedSlots: { customRender: 'prescriptionDate' }
  },
  {
    title: '患者姓名',
    dataIndex: 'patientName'
  },
  {
    title: '电话',
    dataIndex: 'patientPhone'
  },
  {
    title: '性别',
    dataIndex: 'patientSex',
    customRender: (text) => genderMap[text] || '未知'
  },
  {
    title: '年龄',
    dataIndex: 'patientAge'
  },
  {
    title: '药剂类别',
    dataIndex: 'dosageFormsName'
  },
  // {
  //   title: '药材规格',
  //   dataIndex: 'medicineSpec'
  // },
  // {
  //   title: '包装方式',
  //   dataIndex: 'packagingMethod'
  // },
  // {
  //   title: '包装规格',
  //   dataIndex: 'packagingSpec'
  // },
  // {
  //   title: '开单数量',
  //   dataIndex: 'prescriptionQuantity'
  // },
  {
    title: '诊金(元)',
    dataIndex: 'priceConsult',
    customRender: (text) => text ? (Number(text) / 100).toFixed(2) : '0.00'
  },
  // {
  //   title: '加工费(元)',
  //   dataIndex: 'processingFee'
  // },
  {
    title: '药材费用(元)',
    dataIndex: 'priceDrug',
    customRender: (text) => text ? (Number(text) / 100).toFixed(2) : '0.00'
  },
  // {
  //   title: '运费(元)',
  //   dataIndex: 'shippingFee'
  // },
  // {
  //   title: '折扣金额',
  //   dataIndex: 'discountAmount'
  // },
  {
    title: '合计金额(元)',
    dataIndex: 'priceTotal',
    customRender: (text) => text ? (Number(text) / 100).toFixed(2) : '0.00'
  },
  // {
  //   title: '代加工',
  //   dataIndex: 'processingOutsourced'
  // },
  // {
  //   title: '分享来源',
  //   dataIndex: 'shareSource'
  // },
  // {
  //   title: '开方机构',
  //   dataIndex: 'prescriptionOrg'
  // },
  {
    title: '操作',
    key: 'action',
    fixed: 'right',
    width: 120,
    scopedSlots: { customRender: 'action' }
  }
]
