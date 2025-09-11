import Mock from 'mockjs2'

const prescriptionStatus = ['pending', 'verified', 'completed']
const orderStatus = ['unpaid', 'paid', 'partial']
const validStatus = ['有效', '无效']
const sendTypes = ['邮寄', '自取']
const identityTypes = ['医师', '代理医师']
// const genders = ['男', '女']
const packagingMethods = ['真空包装', '纸包装']
const medicineCategories = ['中药饮片', '中成药']

// 生成固定的数据列表，避免翻页时数据变化
const allList = (() => {
  const list = []
  for (let i = 0; i < 125; i++) {
    const status = Mock.Random.pick(prescriptionStatus)
    list.push({
      id: `${i + 1}`,
      prescriptionNo: `YP${Mock.Random.string('number', 10)}`,
      validStatus: Mock.Random.pick(validStatus),
      isConfidential: Mock.Random.boolean() ? '是' : '否',
      isUrgent: Mock.Random.boolean() ? '是' : '否',
      prescribeType: Mock.Random.pick([1, 2]),
      sendType: Mock.Random.pick(sendTypes),
      prescriptionStatus: Mock.Random.pick(prescriptionStatus),
      orderStatus: Mock.Random.pick(orderStatus),
      expiryDate: Mock.Random.date('yyyy-MM-dd'),
      doctorId: Mock.Random.integer(1000, 9999),
      identityType: Mock.Random.pick(identityTypes),
      salesperson: Mock.Random.cname(),
      expectedDeliveryTime: Mock.Random.datetime('yyyy-MM-dd HH:mm:ss'),
      prescriptionDate: Mock.Random.date('yyyy-MM-dd'),
      patientName: Mock.Random.cname(),
      patientPhone: Mock.Random.string('number', 11),
      patientSex: Mock.Random.pick([1, 0]),
      patientAge: Mock.Random.integer(1, 100),
      medicineCategory: Mock.Random.pick(medicineCategories),
      medicineSpec: `${Mock.Random.integer(50, 500)}g`,
      packagingMethod: Mock.Random.pick(packagingMethods),
      packagingSpec: `${Mock.Random.integer(1, 10)}包/盒`,
      prescriptionQuantity: Mock.Random.integer(1, 10),
      priceConsult: Mock.Random.integer(5000, 20000),
      processingFee: Mock.Random.float(20, 100, 2, 2),
      priceDrug: Mock.Random.integer(10000, 100000),
      shippingFee: Mock.Random.float(10, 50, 2, 2),
      discountAmount: Mock.Random.float(0, 100, 2, 2),
      priceTotal: Mock.Random.integer(20000, 200000),
      processingOutsourced: Mock.Random.boolean() ? '是' : '否',
      shareSource: Mock.Random.pick(['微信', 'APP', '网站']),
      prescriptionOrg: Mock.Random.pick(['北京同仁堂', '北京同仁堂', '北京同仁堂']),
      prescribeStatus: Mock.Random.pick([1, 2, 3, 4, 5]),
      status
    })
  }
  return list
})()

// 处方详情Mock数据
// export const mockPrescriptionDetail = {
//   // 基础信息
//   id: 'YP202401001',
//   merchantOrderId: 'YP202401001', // 商户订单号
//   payOrderNo: 'YP202401001', // 单方编号-支付订单编号
//   createTime: '2024-01-10 10:00:00', // 创建时间

//   // 患者信息
//   patientName: '张三', // 患者姓名
//   patientAge: 35, // 患者年龄
//   patientSex: 1, // 患者性别 1-男 0-女
//   patientPhone: '13800138000', // 患者手机号
//   patientChiefComplaint: '感冒发烧', // 主诉
//   patientSyndrome: '气虚血瘀', // 患者中医辩证

//   // 医生信息
//   doctorId: 1001,
//   doctorName: '王医生',
//   doctorType: 1, // 职称
//   doctorAdvice: '忌生冷', // 医嘱

//   // 处方信息
//   diagnose: '感冒', // 诊断
//   dosageForms: '汤剂', // 剂型
//   dosesTotal: 7, // 共多少剂
//   dosesDaily: 1, // 每日多少剂
//   dosesEachUseNum: 2, // 一剂服几次
//   drugLevel: '1', // 药材等级

//   // 费用信息
//   priceConsult: 50.00, // 诊金
//   priceDrug: 100.00, // 药价
//   priceMake: 30.00, // 加工费
//   postage: 20.00, // 快递费
//   priceTotal: 200.00, // 总价

//   // 状态信息
//   status: 0, // 状态
//   verified: false, // 是否核方
//   labeled: false, // 是否标注
//   finished: false, // 是否完成

//   // 药材列表
//   usageDrugs: [
//     {
//       id: 1,
//       pkMaterial: 'YP100000011111',
//       drugName: '甘草',
//       drugForshort: '甘草',
//       dosage: 10, // 克数
//       drugProcessing: '1', // 默认加工工艺
//       drugProcessingName: '普通炮制',
//       prodMethod: '先煎', // 制作方法
//       price: 500, // 单价（分）
//       drugUpperLimit: '0', // 上限量
//       prescribeId: 1001
//     },
//     {
//       id: 2,
//       pkMaterial: 'YP100000011114',
//       drugName: '当归',
//       drugForshort: '当归',
//       dosage: 15,
//       drugProcessing: '1',
//       drugProcessingName: '普通炮制',
//       prodMethod: '后下',
//       price: 800,
//       drugUpperLimit: '0',
//       prescribeId: 1001
//     }
//   ],

//   // 图片信息
//   imgUrls: ['https://k.sinaimg.cn/n/front/533/w615h718/20181028/rjfv-hnaivxp9211733.jpg/w700d1q75cms.jpg'],
//   imgList: [
//     'https://k.sinaimg.cn/n/front/533/w615h718/20181028/rjfv-hnaivxp9211733.jpg/w700d1q75cms.jpg',
//     'https://htx-pub.s3.amazonaws.com/demo/images/demo_stock_purchase_agreement/0002.jpg',
//     'https://htx-pub.s3.amazonaws.com/demo/images/demo_stock_purchase_agreement/0003.jpg'
//   ]
// }

// 处方详情Mock数据
export const mockPrescriptionDetail = {
  'id': '349',
  'payOrderNo': null,
  'doctorId': 796,
  'doctorName': '测试医生01',
  'doctorAdvice': '饭前半小时用,空腹服用',
  'drugstoreMessage': '测试',
  'patientName': 'ssss',
  'patientSex': 1,
  'patientAge': 55,
  'dosageForms': 'DT2020090002',
  'patientPhone': '13645552212',
  'patientSyndrome': 'ceshi ceshi 111',
  'doctorType': null,
  'dosesTotal': 12,
  'dosesDaily': 1,
  'dosesEachUseNum': 1,
  'drugLevel': 'DIC2022010001',
  'priceConsult': '0.00',
  'priceDrug': '21.71',
  'priceTotal': '241.71',
  'priceMake': '220.00',
  'postage': '0.00',
  'verified': false,
  'labeled': false,
  'finished': false,
  'prescribeUsageId': null,
  'status': 1,
  'successTime': null,
  'no': null,
  'merchantOrderId': null,
  'createTime': '2025-02-07',
  'usageDrugs': [
      {
          'id': 1790,
          'prescribeId': 349,
          'drugName': '槟榔',
          'dosage': '10.00',
          'prodMethod': '先煎',
          'price': 2171,
          'pkMaterial': 'YP012501',
          'drugForshort': '槟榔,炒槟榔',
          'drugUpperLimit': '30.00',
          'drugProcessing': 'DIC2019020008',
          'drugProcessingName': '',
          'pkPrescriptB': 'XTFB2020010001',
          'labelId': null
      },
      {
          'id': 1791,
          'prescribeId': 349,
          'drugName': '生姜',
          'dosage': '10.00',
          'prodMethod': '包煎',
          'price': 2171,
          'pkMaterial': 'YP032501',
          'drugForshort': '生姜',
          'drugUpperLimit': '30.00',
          'drugProcessing': 'DIC2019020011',
          'drugProcessingName': '',
          'pkPrescriptB': 'XTFB2020010002',
          'labelId': null
      },
      {
          'id': 1792,
          'prescribeId': 349,
          'drugName': '羌活',
          'dosage': '10.00',
          'prodMethod': '冲服',
          'price': 2171,
          'pkMaterial': 'YP011501',
          'drugForshort': '羌活',
          'drugUpperLimit': '20.00',
          'drugProcessing': 'DIC2019020012',
          'drugProcessingName': '',
          'pkPrescriptB': 'XTFB2020010003',
          'labelId': null
      },
      {
          'id': 1793,
          'prescribeId': 349,
          'drugName': '麻黄',
          'dosage': '5.00',
          'prodMethod': '冲服',
          'price': 2171,
          'pkMaterial': 'YP017601',
          'drugForshort': '麻黄',
          'drugUpperLimit': '9.00',
          'drugProcessing': 'DIC2019020012',
          'drugProcessingName': '',
          'pkPrescriptB': 'XTFB2020010004',
          'labelId': null
      },
      {
          'id': 1794,
          'prescribeId': 349,
          'drugName': '草果',
          'dosage': '6.00',
          'prodMethod': '冲服',
          'price': 2171,
          'pkMaterial': 'YP022701',
          'drugForshort': '草果',
          'drugUpperLimit': '15.00',
          'drugProcessing': 'DIC2019020012',
          'drugProcessingName': '',
          'pkPrescriptB': 'XTFB2020010005',
          'labelId': null
      },
      {
          'id': 1795,
          'prescribeId': 349,
          'drugName': '广藿香',
          'dosage': '10.00',
          'prodMethod': '',
          'price': 2171,
          'pkMaterial': 'YP009401',
          'drugForshort': '藿香,藿香、藿香梗',
          'drugUpperLimit': '30.00',
          'drugProcessing': null,
          'drugProcessingName': '',
          'pkPrescriptB': 'XTFB2020010006',
          'labelId': null
      },
      {
          'id': 1796,
          'prescribeId': 349,
          'drugName': '厚朴',
          'dosage': '10.00',
          'prodMethod': '',
          'price': 2171,
          'pkMaterial': 'YP008901',
          'drugForshort': '厚朴',
          'drugUpperLimit': '30.00',
          'drugProcessing': null,
          'drugProcessingName': '',
          'pkPrescriptB': 'XTFB2020010007',
          'labelId': null
      },
      {
          'id': 1797,
          'prescribeId': 349,
          'drugName': '陈皮',
          'dosage': '10.00',
          'prodMethod': '',
          'price': 2171,
          'pkMaterial': 'YP003201',
          'drugForshort': '橘皮',
          'drugUpperLimit': '25.00',
          'drugProcessing': null,
          'drugProcessingName': '',
          'pkPrescriptB': 'XTFB2020010008',
          'labelId': null
      },
      {
          'id': 1798,
          'prescribeId': 349,
          'drugName': '苍术',
          'dosage': '15.00',
          'prodMethod': '',
          'price': 2171,
          'pkMaterial': 'YP007201',
          'drugForshort': '苍术',
          'drugUpperLimit': '30.00',
          'drugProcessing': null,
          'drugProcessingName': '',
          'pkPrescriptB': 'XTFB2020010009',
          'labelId': 'RwVM8BlxOk'
      }
  ],
  'patientChiefComplaint': '',
  'diagnose': '',
  'imgUrls': [
      'https://dev-zfqh-1325025287.cos.ap-nanjing.myqcloud.com/20250207110916uvlzrrbt9mifhW4MZPE1jLfiFex19Q0iWNYE0SSD8OyunUq9mb.png'
  ],
  'labelList': [
    {
        'original_width': 2048,
        'original_height': 1365,
        'image_rotation': 0,
        'value': {
            'x': 23.322147651006713,
            'y': 25.44080604534005,
            'width': 31.375838926174495,
            'height': 21.662468513853906,
            'rotation': 0,
            'rectanglelabels': [
                '药剂药量'
            ]
        },
        'meta': {
            'text': [
                '药剂描述111'
            ]
        },
        'id': 'RwVM8BlxOk',
        'from_name': 'label',
        'to_name': 'image',
        'type': 'rectanglelabels'
    },
    {
        'original_width': 2048,
        'original_height': 1365,
        'image_rotation': 0,
        'value': {
            'x': 61.74496644295302,
            'y': 15.617128463476071,
            'width': 18.79194630872483,
            'height': 17.38035264483627,
            'rotation': 0,
            'rectanglelabels': [
                '煎制方法'
            ]
        },
        'meta': {
            'text': [
                '煎制方法111'
            ]
        },
        'id': 'kPeF9peXtC',
        'from_name': 'label',
        'to_name': 'image',
        'type': 'rectanglelabels'
    },
    {
        'original_width': 2048,
        'original_height': 1365,
        'image_rotation': 0,
        'value': {
            'x': 60.90604026845637,
            'y': 49.87405541561713,
            'width': 31.879194630872483,
            'height': 34.25692695214106,
            'rotation': 0,
            'rectanglelabels': [
                '医嘱'
            ]
        },
        'meta': {
            'text': [
                '医嘱222'
            ]
        },
        'id': 'k_XlkM0Tjg',
        'from_name': 'label',
        'to_name': 'image',
        'type': 'rectanglelabels'
    }
]
}

// 一级药剂列表 Mock 数据
export const mockDrugTypeFatherList = {
  code: 0,
  data: [
    {
      pkDrugType: 'DT2019020001',
      pkFather: '4558',
      dtName: '中药饮片',
      drugLevel: '1',
      drugLevelList: [
        {
          dic: '1',
          name: '一级'
        },
        {
          dic: '2',
          name: '二级'
        }
      ],
      dtRemarks: '传统中药材的饮片',
      dtIsaccessories: 0,
      drugMmode: '1',
      drugMmodeList: [
        {
          dic: '1',
          name: '内服'
        },
        {
          dic: '2',
          name: '外用'
        }
      ]
    },
    {
      pkDrugType: 'DT2019020002',
      pkFather: '4559',
      dtName: '中成药',
      drugLevel: '2',
      drugLevelList: [
        {
          dic: '1',
          name: '一级'
        },
        {
          dic: '2',
          name: '二级'
        }
      ],
      dtRemarks: '中药制剂',
      dtIsaccessories: 0,
      drugMmode: '1',
      drugMmodeList: [
        {
          dic: '1',
          name: '内服'
        }
      ]
    }
  ],
  msg: 'success'
}

// 二级药剂列表 Mock 数据
export const mockDrugTypeSubList = {
  code: 0,
  data: [
    {
      pkDrugType: 'DT2019020003',
      pkFather: 'DT2019020001',
      dtName: '解表药',
      drugLevel: '1',
      drugLevelList: [
        {
          dic: '1',
          name: '一级'
        },
        {
          dic: '2',
          name: '二级'
        }
      ],
      dtRemarks: '发散风寒、发散风热的药物',
      dtIsaccessories: 0,
      drugMmode: '1',
      drugMmodeList: [
        {
          dic: '1',
          name: '内服'
        }
      ]
    },
    {
      pkDrugType: 'DT2019020004',
      pkFather: 'DT2019020001',
      dtName: '清热药',
      drugLevel: '1',
      drugLevelList: [
        {
          dic: '1',
          name: '一级'
        }
      ],
      dtRemarks: '清热泻火、凉血的药物',
      dtIsaccessories: 0,
      drugMmode: '1',
      drugMmodeList: [
        {
          dic: '1',
          name: '内服'
        }
      ]
    }
  ],
  msg: 'success'
}

// 药材列表 Mock 数据
export const mockDrugMaterialList = {
  code: 0,
  data: [
    {
      pkMaterial: 'YC20240001',
      drugName: '金银花',
      drugForshort: '银花',
      drugUpperlimit: 15,
      drugProcessing: '生用',
      drugRemarks: '清热解毒，疏散风热',
      drugPrice: 45.5,
      drugUnit: '克',
      drugRate: '1'
    },
    {
      pkMaterial: 'YC20240002',
      drugName: '板蓝根',
      drugForshort: '板蓝根',
      drugUpperlimit: 30,
      drugProcessing: '生用',
      drugRemarks: '清热解毒，凉血利咽',
      drugPrice: 28.8,
      drugUnit: '克',
      drugRate: '1'
    }
  ],
  msg: 'success'
}

// 加工工艺典数据列表 Mock 数据
export const mockEnabledDictDataList = {
  code: 0,
  data: [
    {
      dic: 'DIC2019020001',
      name: '普通炮制'
    },
    {
      dic: 'DIC2019020002',
      name: '酒炙'
    },
    {
      dic: 'DIC2019020003',
      name: '醋制'
    },
    {
      dic: 'DIC2019020004',
      name: '盐制'
    },
    {
      dic: 'DIC2019020005',
      name: '蜜制'
    },
    {
      dic: 'DIC2019020006',
      name: '姜汁制'
    }
  ],
  msg: 'success'
}

export const getMockList = (parameter) => {
  const { pageSize = 10, pageNo = 1, status = 'all', searchText = '' } = parameter

  // 根据状态和搜索文本筛选数据
  let filteredList = [...allList]

  // 状态筛选
  if (status !== 'all') {
    filteredList = filteredList.filter(item => item.status === status)
  }

  // 搜索过滤
  if (searchText) {
    filteredList = filteredList.filter(item =>
      item.doctorId.toString().includes(searchText) ||
      item.prescriptionNo.includes(searchText)
    )
  }

  // 计算分页数据
  const totalCount = filteredList.length
  const startIndex = (pageNo - 1) * pageSize
  const endIndex = startIndex + pageSize
  const data = filteredList.slice(startIndex, endIndex)

  return Promise.resolve({
    list: data,
    pageSize: parseInt(pageSize),
    pageNumber: parseInt(pageNo),
    totalElements: totalCount,
    totalPages: Math.ceil(totalCount / pageSize)
  })
}
