<template>
  <div class="annotation-area">
    <a-spin :spinning="loading">
      <a-alert v-if="error" type="error" :message="error" banner />
      <div ref="labelStudioContainer" id="label-studio"></div>
    </a-spin>
  </div>
</template>

<script>
import LabelStudio from 'label-studio'
import 'label-studio/build/static/css/main.css'
import { mapGetters } from 'vuex'

export default {
  name: 'AnnotationArea',
  props: {
    detail: {
      type: Object,
      required: true
    }
  },
  data () {
    return {
      labelStudio: null,
      loading: true,
      error: null,
      // 添加默认的放大倍数及旋转角度变量
      defaultZoom: 1, // 默认放大倍数，将从detail中获取
      currentZoom: 1, // 当前放大倍数
      defaultRotation: 0, // 默认旋转角度，将从detail中获取
      currentRotation: 0, // 当前旋转角度
      zoomStep: 0.2, // 每次放大/缩小的步长
      rotationStep: 90, // 每次旋转的角度
      isUpdatingFromButtons: false, // 标记是否是由按钮操作引起的更新
      annotationLabels: [
        { value: '药剂药量', background: 'red' },
        { value: '煎制方法', background: 'blue' },
        { value: '医嘱', background: 'green' },
        { value: '医师', background: 'purple' }
      ],
      // 添加防抖定时器
      updateTimer: null,
      // 存储事件监听器引用
      buttonListeners: null,
      // 存储鼠标事件监听器引用
      mouseEventListeners: null,
      saveLabelList: null
    }
  },
  computed: {
    ...mapGetters('annotation', [
      'getActiveRegionId',
      'getActivateAnnotation',
      'getPendingAnnotationKey'
    ])
  },
  watch: {
    getActiveRegionId: {
      handler (newRegionId) {
        if (newRegionId && this.labelStudio) {
          this.selectRegion(newRegionId)
        }
      },
      immediate: true
    },
    getActivateAnnotation: {
      handler (newValue) {
        if (newValue) {
          this.activateAnnotationTool()
        }
      },
      immediate: true
    },
    // 监听detail变化，更新默认缩放和旋转值
    detail: {
      handler (newDetail, oldDetail) {
        console.log('detail变化', newDetail)
        if (newDetail) {
          // 从detail中获取缩放和旋转值，如果不存在则使用默认值
          const newZoom = newDetail.zoomLevel || 1
          const newRotation = newDetail.rotationDegree || 0

          // 只有当值真正变化且不是由按钮操作引起的变化时才更新
          const zoomChanged = !oldDetail || newZoom !== this.defaultZoom
          const rotationChanged = !oldDetail || newRotation !== this.defaultRotation

          if (zoomChanged || rotationChanged) {
            this.defaultZoom = newZoom
            this.defaultRotation = newRotation

            // 如果已经初始化了标注工具，且变化不是由按钮操作引起的，则应用新的设置
            if (this.labelStudio && !this.isUpdatingFromButtons) {
              this.applyDefaultSettings()
            }
          }
        }
      },
      immediate: true,
      deep: true
    }
  },
  methods: {
    // 获取图片URL列表，优先使用recipeimage字段
    getImageUrls () {
      // 优先使用 recipeimage 字段
      if (this.detail?.recipeimage) {
        // 如果 recipeimage 是字符串，转换为数组
        if (typeof this.detail.recipeimage === 'string') {
          return this.detail.recipeimage ? [this.detail.recipeimage] : this.getMockImageUrls()
        }
        // 如果 recipeimage 是数组，直接使用
        if (Array.isArray(this.detail.recipeimage)) {
          const validUrls = this.detail.recipeimage.filter(url => url && url.trim())
          return validUrls.length > 0 ? validUrls : this.getMockImageUrls()
        }
      }

      // 如果 recipeimage 不存在或为空，返回mock图片
      return this.getMockImageUrls()
    },

    // 获取mock图片URL列表
    getMockImageUrls () {
      // 返回一个mock的网络图片URL
      return [
        'https://www.baidu.com/img/PCtm_d9c8750bed0b3c7d089fa7d55720d6cf.png'
      ]
    },
    handleRegionClick (regionId) {
      this.$store.dispatch('annotation/setActiveRegionId', regionId)
    },
    initializeLabelStudio () {
      // 优先使用 recipeimage 字段，如果不存在则使用 imgUrls
      const imageUrls = this.getImageUrls()

      if (!imageUrls || !imageUrls.length) {
        console.warn('No image URLs available from recipeimage or imgUrls')
        this.error = '没有可用的图片'
        this.loading = false
        return
      }

      console.log(this.detail, 'detail==>')
      // 确保 DOM 元素存在
      if (!this.$refs.labelStudioContainer) {
        console.error('智赋岐黄标柱系统 container not found')
        this.error = '智赋岐黄标柱系统 container not found'
        return
      }

      // 从detail中获取缩放和旋转值
      if (this.detail) {
        this.defaultZoom = this.detail.zoomLevel || 1
        this.defaultRotation = this.detail.rotationDegree || 0
        this.currentZoom = this.defaultZoom
        this.currentRotation = this.defaultRotation
      }

      // 确保detail数据已加载
      // if (!this.detail || !this.detail.labelList) {
      //   console.warn('Detail data not loaded yet')
      //   return
      // }

      this.loading = true
      this.error = null

      // 添加延时确保 DOM 完全渲染
      this.$nextTick(() => {
        try {
          // 判断是单图还是多图
          const isMultiImage = imageUrls.length > 1

          // 生成标注配置
          let configTemplate = ''
          const dataObject = {}

          if (isMultiImage) {
            // 多图配置 - 横排展示
            configTemplate = `
              <View>
                <View style="display: flex; flex-direction: row; flex-wrap: wrap">
                  ${imageUrls.map((url, index) => `
                  <View style="width: ${Math.floor(100 / imageUrls.length) - (imageUrls.length > 1 ? 1 : 0)}%; ${index < imageUrls.length - 1 ? 'margin-right: 2%;' : ''} margin-bottom: 10px">
                    <Header value="图片 ${index + 1}" />
                    <RectangleLabels 
                      name="label${index + 1}" 
                      toName="image${index + 1}"
                      opacity="0.5"
                      strokeWidth="2"
                      strokeColor="#000000"
                    >
                      ${this.annotationLabels.map(label =>
                        `<Label value="${label.value}" background="${label.background}">${label.value}</Label>`
                      ).join('\n                      ')}
                    </RectangleLabels>
                    <Image 
                      name="image${index + 1}" 
                      value="$image${index + 1}" 
                      rotateControl="true" 
                      zoomControl="true" 
                      crossOrigin="anonymous" 
                      horizontalAlignment="center" 
                      verticalAlignment="top"
                    />
                  </View>`).join('\n                  ')}
                </View>
              </View>
            `

            // 准备多图数据对象
            imageUrls.forEach((url, index) => {
              dataObject[`image${index + 1}`] = url
            })
          } else {
            // 单图配置 - 铺满展示
            configTemplate = `
              <View>
                <RectangleLabels 
                  name="label" 
                  toName="image"
                  opacity="0.5"
                  strokeWidth="2"
                  strokeColor="#000000"
                >
                  ${this.annotationLabels.map(label =>
                    `<Label value="${label.value}" background="${label.background}">${label.value}</Label>`
                  ).join('\n              ')}
                </RectangleLabels>
                <Image name="image" value="$image" rotateControl="true" zoomControl="true" crossOrigin="anonymous" horizontalAlignment="center" verticalAlignment="top"/>
              </View>
            `

            // 准备单图数据对象
            dataObject.image = imageUrls[0]
          }

          const config = {
            config: configTemplate,
            interfaces: [
              'controls'
              // 'panel'
              // 'update'
            ],
            user: {
              pk: 1,
              firstName: 'User',
              lastName: 'Example'
            },
            task: {
              annotations: [{
                id: 1,
                // 添加默认标注数据
                result: this.detail.labelList || []
              }],
              predictions: [],
              id: 1,
              data: dataObject
            },
            onLabelStudioLoad: (LS) => {
              console.log('智赋岐黄标柱系统 has loaded!')
              console.log('初始化时的labelList数据:', this.detail.labelList)
              console.log('LabelStudio任务数据:', LS.task)
              // 标注插件加载完成后，设置默认的放大倍数和旋转角度
              this.$nextTick(() => {
                // 延迟执行以确保DOM完全渲染和按钮可用
                setTimeout(() => {
                  this.applyDefaultSettings()
                  // 添加鼠标事件监听器，在鼠标松开时取消选中
                  this.setupMouseEventListeners()
                }, 1000) // 增加延迟时间确保按钮已渲染
              })
            },
            // 标注创建
            onEntityCreate: (region) => {
              console.log(region, 'onEntityCreate ===>')
              // 判断是单图还是多图
              const currentImageUrls = this.getImageUrls()
              const isMultiImage = currentImageUrls.length > 1

              if (isMultiImage) {
                // 多图模式
                // 查找标签类型，可能来自不同图片的标签
                let fullLabel = null

                if (region.results && region.results.length > 0) {
                  // 查找第一个包含 rectanglelabels 的结果
                  for (const result of region.results) {
                    if (result.value && result.value.rectanglelabels && result.value.rectanglelabels.length > 0) {
                      fullLabel = result.value.rectanglelabels[0]
                      break
                    }
                  }
                }

                if (!fullLabel) {
                  console.warn('未找到标签信息')
                  return
                }

                this.saveLabelList = this.detail.labelList

                setTimeout(() => {
                  const regionWidth = region.width
                  console.log(regionWidth, 'regionWidth 多图模式 ===>')
                  const label = fullLabel.split(' (')[0]

                  // 更新 activeLabel
                  this.$store.dispatch('annotation/setActiveLabel', label)

                  // 更新 activeRegionId
                  this.$store.dispatch('annotation/setActiveRegionId', region.id)

                  this.labelStudio.updateAnnotation()

                  // 清空 pendingKey
                  this.$store.dispatch('annotation/setActivateAnnotation', {
                    active: false,
                    pendingKey: null
                  })
                }, 200)
              } else {
                // 单图模式，使用原有逻辑
                const fullLabel = region.results[0]?.value?.rectanglelabels[0]
                console.log(fullLabel, 'fullLabel===>')

                this.saveLabelList = this.detail.labelList

                setTimeout(() => {
                  const regionWidth = region.width
                  console.log(regionWidth, 'regionWidth 22===>')
                  const label = fullLabel.split(' (')[0]

                  // 更新 activeLabel
                  this.$store.dispatch('annotation/setActiveLabel', label)

                  // 更新 activeRegionId
                  this.$store.dispatch('annotation/setActiveRegionId', region.id)

                  this.labelStudio.updateAnnotation()

                  // 清空 pendingKey
                  this.$store.dispatch('annotation/setActivateAnnotation', {
                    active: false,
                    pendingKey: null
                  })
                }, 200)
              }
            },
            // 标注删除
            onEntityDelete: (region) => {
              // 判断是单图还是多图
              const currentImageUrls = this.getImageUrls()
              const isMultiImage = currentImageUrls.length > 1

              // 获取标签类型和ID
              let labelType = null
              const regionId = region.id

              if (isMultiImage) {
                // 多图模式
                if (region.results && region.results.length > 0) {
                  // 查找第一个包含 rectanglelabels 的结果
                  for (const result of region.results) {
                    if (result.value && result.value.rectanglelabels && result.value.rectanglelabels.length > 0) {
                      labelType = result.value.rectanglelabels[0]
                      break
                    }
                  }
                }
              } else {
                // 单图模式
                if (region.results?.length > 0 &&
                    region.results[0]?.value?.rectanglelabels?.length > 0) {
                  labelType = region.results[0].value.rectanglelabels[0]
                }
              }

              // 如果获取到标签类型和ID，进行处理
              if (labelType && regionId) {
                // 如果删除的是当前选中的region，清除activeRegionId
                if (this.getActiveRegionId === regionId) {
                  this.$store.dispatch('annotation/setActiveRegionId', null)
                }

                // 清空 pendingKey
                this.$store.dispatch('annotation/setActivateAnnotation', {
                  active: false,
                  pendingKey: null
                })

                // 更新detail数据
                if (this.detail) {
                  const updatedDetail = { ...this.detail }

                  // 从labelList中移除对应的标注
                  updatedDetail.labelList = (updatedDetail.labelList || []).filter(
                    label => label.id !== regionId
                  )

                  // 如果是药剂药量标注，同时更新usageDrugs
                  if (labelType === '药剂药量') {
                    updatedDetail.usageDrugs = (updatedDetail.usageDrugs || []).filter(
                      drug => drug.labelId !== regionId
                    )
                  }

                  // 更新detail
                  this.$emit('update:detail', updatedDetail)
                }
              }
            },
            // 标注更新
            onUpdateAnnotation: (LS, annotation) => {
              const annotations = annotation.serializeAnnotation()
              // 判断是单图还是多图
              const currentImageUrls = this.getImageUrls()
              const isMultiImage = currentImageUrls.length > 1
              console.log('onUpdateAnnotation - 当前标注数据:', annotations)
              console.log('onUpdateAnnotation - 保存的标注列表:', this.saveLabelList)
              // 如果存在保存的标注列表，进行比对和更新
              if (this.saveLabelList && this.saveLabelList.length > 0) {
                // 遍历当前的标注列表
                annotations.forEach(currentAnnotation => {
                  // 在保存的标注列表中查找匹配的项
                  const savedAnnotation = this.saveLabelList.find(
                    savedItem => savedItem.id === currentAnnotation.id
                  )

                  // 如果找到匹配项，则更新meta信息
                  if (savedAnnotation && savedAnnotation.meta) {
                    currentAnnotation.meta = { ...savedAnnotation.meta }
                    console.log(`更新标注 ${currentAnnotation.id} 的meta信息:`, currentAnnotation.meta)
                  }
                })
              }

              if (this.detail) {
                const updatedDetail = {
                  ...this.detail,
                  labelList: annotations
                }

                // 处理药剂药量标注的更新
                let medicineLabels = []

                // 根据单图还是多图模式，查找药剂药量标签
                if (isMultiImage) {
                  // 多图模式
                  medicineLabels = annotations.filter(label => {
                    // 检查不同图片的label值
                    const rectangleLabels = Object.keys(label.value).filter(key => key.startsWith('rectanglelabels'))
                    for (const key of rectangleLabels) {
                      if (label.value[key][0] === '药剂药量') {
                        return true
                      }
                    }
                    return false
                  })
                } else {
                  // 单图模式
                  medicineLabels = annotations.filter(
                    label => label.value.rectanglelabels[0] === '药剂药量'
                  )
                }

                // 如果有药剂药量标注
                if (medicineLabels.length > 0) {
                  // 获取现有的 usageDrugs
                  const newUsageDrugs = [...(this.detail.usageDrugs || [])]
                  const pendingKey = this.getPendingAnnotationKey

                  // 如果有 pendingKey，更新对应的 usageDrugs
                  if (pendingKey) {
                    const lastLabel = medicineLabels[medicineLabels.length - 1]

                    const targetIndex = newUsageDrugs.findIndex(drug => drug.key === pendingKey)

                    if (targetIndex !== -1 && lastLabel) {
                      newUsageDrugs[targetIndex] = {
                        ...newUsageDrugs[targetIndex],
                        labelId: lastLabel.id,
                        area: `区域${targetIndex + 1}`,
                        content: lastLabel.meta?.text?.[0] || ''
                      }
                    }
                  } else {
                    const processedLabelIds = new Set()

                    medicineLabels.forEach((label, index) => {
                      const labelId = label.id
                      processedLabelIds.add(labelId)

                      const existingIndex = newUsageDrugs.findIndex(drug => drug.labelId === labelId)
                      if (existingIndex !== -1) {
                        newUsageDrugs[existingIndex] = {
                          ...newUsageDrugs[existingIndex],
                          area: `区域${existingIndex + 1}`,
                          content: label.meta?.text?.[0] || ''
                        }
                      } else {
                        newUsageDrugs.push({
                          key: `medicine-${labelId}`,
                          labelId: labelId,
                          area: `区域${newUsageDrugs.length + 1}`,
                          content: label.meta?.text?.[0] || '',
                          drugForshort: '',
                          medicineCode: '',
                          medicineName: '',
                          quantity: '',
                          unit: 'g',
                          retailPrice: '',
                          conversionRate: '',
                          processMethod: '',
                          remarks: ''
                        })
                      }
                    })
                  }

                  // 更新 detail
                  updatedDetail.usageDrugs = newUsageDrugs
                }

                // 处理其他类型标注的更新（煎制方法、医嘱、医师等）
                this.annotationLabels.forEach(labelConfig => {
                  const labelType = labelConfig.value

                  // 跳过药剂药量类型，因为已经处理过了
                  if (labelType === '药剂药量') return

                  // 根据单图还是多图模式，查找当前类型的所有标注
                  let typeLabels = []

                  if (isMultiImage) {
                    // 多图模式
                    typeLabels = annotations.filter(label => {
                      // 检查不同图片的label值
                      const rectangleLabels = Object.keys(label.value).filter(key => key.startsWith('rectanglelabels'))
                      for (const key of rectangleLabels) {
                        if (label.value[key][0] === labelType) {
                          return true
                        }
                      }
                      return false
                    })
                  } else {
                    // 单图模式
                    typeLabels = annotations.filter(
                      label => label.value.rectanglelabels[0] === labelType
                    )
                  }

                  // 如果有此类型的标注，确保在detail中有对应的数据结构
                  if (typeLabels.length > 0) {
                    // 根据标注类型设置对应的detail字段
                    if (labelType === '医嘱') {
                      // 合并所有医嘱内容
                      const adviceTexts = typeLabels.map(label => label.meta?.text?.[0] || '').filter(Boolean)
                      if (adviceTexts.length > 0) {
                        updatedDetail.doctorAdvice = adviceTexts.join(' ')
                      }
                    } else if (labelType === '医师') {
                      // 合并所有医师内容
                      const doctorTexts = typeLabels.map(label => label.meta?.text?.[0] || '').filter(Boolean)
                      if (doctorTexts.length > 0) {
                        updatedDetail.doctorName = doctorTexts.join(' ')
                      }
                    }
                  }
                })

                console.log(updatedDetail, 'updatedDetail===>')
                this.$emit('update:detail', updatedDetail)
              }
              console.log('标注已更新:', annotations)
            },
            // 标注提交
            onSubmitAnnotation: (LS, annotation) => {
              this.annotations = annotation.serializeAnnotation()
              console.log('标注已完成:', this.annotations)
            }
          }
          this.labelStudio = new LabelStudio('label-studio', config)
          this.loading = false
        } catch (error) {
          console.error('Failed to initialize 智赋岐黄标柱系统:', error)
          this.error = error.message
          this.loading = false
        }
      })
    },
    // 应用默认设置
    applyDefaultSettings () {
      console.log('applyDefaultSettings')
      try {
        // 判断是单图还是多图
        const currentImageUrls = this.getImageUrls()
        const isMultiImage = currentImageUrls.length > 1

        if (isMultiImage) {
          // 多图情况下，处理每个图片的控制按钮
          currentImageUrls.forEach((url, index) => {
            // 为每个图片查找控制按钮
            const controlsContainer = document.querySelectorAll('.lsf-image-container')[index]
            if (!controlsContainer) return

            const zoomInButton = controlsContainer.querySelector('.anticon-zoom-in')?.closest('button')
            const zoomOutButton = controlsContainer.querySelector('.anticon-zoom-out')?.closest('button')
            const rotateLeftButton = controlsContainer.querySelector('.anticon-rotate-left')?.closest('button')
            const rotateRightButton = controlsContainer.querySelector('.anticon-rotate-right')?.closest('button')

            if (!zoomInButton || !zoomOutButton || !rotateLeftButton || !rotateRightButton) {
              console.warn(`图片 ${index + 1} 的控制按钮尚未渲染，延迟设置默认参数`)
              return
            }

            // 重置当前的缩放和旋转值
            this.currentZoom = 1
            this.currentRotation = 0

            // 模拟点击缩放按钮
            const targetZoom = this.detail.zoomLevel || 1
            const zoomClicks = Math.round(Math.abs(targetZoom - 1) / this.zoomStep)
            const zoomButton = targetZoom > 1 ? zoomInButton : zoomOutButton

            for (let i = 0; i < zoomClicks; i++) {
              zoomButton.click()
            }

            // 模拟点击旋转按钮
            const targetRotation = this.detail.rotationDegree || 0
            const normalizedTargetRotation = ((targetRotation % 360) + 360) % 360
            const rotationClicks = Math.round(Math.abs(normalizedTargetRotation) / this.rotationStep)
            const rotateButton = normalizedTargetRotation >= 0 ? rotateRightButton : rotateLeftButton

            for (let i = 0; i < rotationClicks; i++) {
              rotateButton.click()
            }
          })
        } else {
          // 单图情况，使用原来的逻辑
          // 检查控制按钮是否已经渲染
          const zoomInButton = document.querySelector('.anticon-zoom-in')?.closest('button')
          const zoomOutButton = document.querySelector('.anticon-zoom-out')?.closest('button')
          const rotateLeftButton = document.querySelector('.anticon-rotate-left')?.closest('button')
          const rotateRightButton = document.querySelector('.anticon-rotate-right')?.closest('button')

          if (!zoomInButton || !zoomOutButton || !rotateLeftButton || !rotateRightButton) {
            console.warn('控制按钮尚未渲染，延迟设置默认参数')
            setTimeout(() => this.applyDefaultSettings(), 500)
            return
          }

          // 设置默认放大倍数和旋转角度
          this.currentZoom = 1 // 重置为1
          this.currentRotation = 0 // 重置为0

          // 模拟点击缩放按钮
          const targetZoom = this.detail.zoomLevel || 1
          const zoomClicks = Math.round(Math.abs(targetZoom - 1) / this.zoomStep)
          const zoomButton = targetZoom > 1 ? zoomInButton : zoomOutButton

          for (let i = 0; i < zoomClicks; i++) {
            zoomButton.click()
          }

          // 模拟点击旋转按钮
          const targetRotation = this.detail.rotationDegree || 0
          const normalizedTargetRotation = ((targetRotation % 360) + 360) % 360 // 将角度标准化到0-360范围
          const rotationClicks = Math.round(Math.abs(normalizedTargetRotation) / this.rotationStep)
          const rotateButton = normalizedTargetRotation >= 0 ? rotateRightButton : rotateLeftButton

          for (let i = 0; i < rotationClicks; i++) {
            rotateButton.click()
          }
        }

        // 添加按钮事件监听
        this.setupButtonListeners()
      } catch (error) {
        console.error('应用默认设置失败:', error)
      }
    },
    // 设置按钮事件监听
    setupButtonListeners () {
      // 如果已经设置过监听器，先移除
      this.removeButtonListeners()

      // 判断是单图还是多图
      const currentImageUrls = this.getImageUrls()
      const isMultiImage = currentImageUrls.length > 1

      if (isMultiImage) {
        // 多图情况下，为每个图片设置事件监听
        this.buttonListeners = {}

        currentImageUrls.forEach((url, index) => {
          // 为每个图片查找控制按钮
          const controlsContainer = document.querySelectorAll('.lsf-image-container')[index]
          if (!controlsContainer) return

          const zoomInButton = controlsContainer.querySelector('.anticon-zoom-in')?.closest('button')
          const zoomOutButton = controlsContainer.querySelector('.anticon-zoom-out')?.closest('button')
          const rotateLeftButton = controlsContainer.querySelector('.anticon-rotate-left')?.closest('button')
          const rotateRightButton = controlsContainer.querySelector('.anticon-rotate-right')?.closest('button')

          if (!zoomInButton || !zoomOutButton || !rotateLeftButton || !rotateRightButton) {
            console.warn(`图片 ${index + 1} 的控制按钮尚未渲染，将在500ms后重试`)
            return
          }

          // 为每个图片创建单独的事件处理函数
          const handlers = {
            zoomIn: () => {
              this.currentZoom = Number((this.currentZoom + this.zoomStep).toFixed(2))
              this.debouncedUpdateSettings()
            },
            zoomOut: () => {
              this.currentZoom = Number(Math.max(this.defaultZoom, this.currentZoom - this.zoomStep).toFixed(2))
              this.debouncedUpdateSettings()
            },
            rotateLeft: () => {
              this.currentRotation = Number((this.currentRotation - this.rotationStep).toFixed(2))
              this.debouncedUpdateSettings()
            },
            rotateRight: () => {
              this.currentRotation = Number((this.currentRotation + this.rotationStep).toFixed(2))
              this.debouncedUpdateSettings()
            }
          }

          // 为每个图片保存事件监听器引用
          this.buttonListeners[`image${index + 1}`] = {
            zoomIn: { element: zoomInButton, handler: handlers.zoomIn },
            zoomOut: { element: zoomOutButton, handler: handlers.zoomOut },
            rotateLeft: { element: rotateLeftButton, handler: handlers.rotateLeft },
            rotateRight: { element: rotateRightButton, handler: handlers.rotateRight }
          }

          // 添加事件监听器
          Object.values(this.buttonListeners[`image${index + 1}`]).forEach(({ element, handler }) => {
            element.addEventListener('click', handler)
          })
        })
      } else {
        // 单图情况，使用原来的逻辑
        // 获取所有按钮
        const zoomInButton = document.querySelector('.anticon-zoom-in')?.closest('button')
        const zoomOutButton = document.querySelector('.anticon-zoom-out')?.closest('button')
        const rotateLeftButton = document.querySelector('.anticon-rotate-left')?.closest('button')
        const rotateRightButton = document.querySelector('.anticon-rotate-right')?.closest('button')

        if (!zoomInButton || !zoomOutButton || !rotateLeftButton || !rotateRightButton) {
          console.warn('未找到所有控制按钮，将在500ms后重试')
          setTimeout(() => this.setupButtonListeners(), 500)
          return
        }

        // 创建事件处理函数
        const handlers = {
          zoomIn: () => {
            this.currentZoom = Number((this.currentZoom + this.zoomStep).toFixed(2))
            this.debouncedUpdateSettings()
          },
          zoomOut: () => {
            this.currentZoom = Number(Math.max(this.defaultZoom, this.currentZoom - this.zoomStep).toFixed(2))
            this.debouncedUpdateSettings()
          },
          rotateLeft: () => {
            this.currentRotation = Number((this.currentRotation - this.rotationStep).toFixed(2))
            this.debouncedUpdateSettings()
          },
          rotateRight: () => {
            this.currentRotation = Number((this.currentRotation + this.rotationStep).toFixed(2))
            this.debouncedUpdateSettings()
          }
        }

        // 保存事件监听器引用以便后续移除
        this.buttonListeners = {
          zoomIn: { element: zoomInButton, handler: handlers.zoomIn },
          zoomOut: { element: zoomOutButton, handler: handlers.zoomOut },
          rotateLeft: { element: rotateLeftButton, handler: handlers.rotateLeft },
          rotateRight: { element: rotateRightButton, handler: handlers.rotateRight }
        }

        // 添加事件监听器
        Object.values(this.buttonListeners).forEach(({ element, handler }) => {
          element.addEventListener('click', handler)
        })
      }

      console.log('所有按钮事件监听器已设置')
    },

    // 移除按钮事件监听器
    removeButtonListeners () {
      if (this.buttonListeners) {
        // 检查是否是多图配置（buttonListeners包含image1, image2等键）
        const isMultiImage = Object.keys(this.buttonListeners).some(key => key.startsWith('image'))

        if (isMultiImage) {
          // 多图配置下移除所有图片的事件监听器
          Object.keys(this.buttonListeners).forEach(imageKey => {
            const listeners = this.buttonListeners[imageKey]
            Object.values(listeners).forEach(({ element, handler }) => {
              if (element && handler) {
                element.removeEventListener('click', handler)
              }
            })
          })
        } else {
          // 单图配置下移除事件监听器
          Object.values(this.buttonListeners).forEach(({ element, handler }) => {
            if (element && handler) {
              element.removeEventListener('click', handler)
            }
          })
        }

        this.buttonListeners = null
      }
    },

    // 防抖更新设置
    debouncedUpdateSettings () {
      if (this.updateTimer) {
        clearTimeout(this.updateTimer)
      }
      this.updateTimer = setTimeout(() => {
        this.updateImageSettings()
      }, 100) // 100ms 的防抖延迟
    },

    // 更新图片设置
    updateImageSettings () {
      // 只有当值发生变化时才更新
      if (this.detail && (this.detail.zoomLevel !== this.currentZoom || this.detail.rotationDegree !== this.currentRotation)) {
        // 标记当前更新是由按钮操作引起的
        this.isUpdatingFromButtons = true

        const updatedDetail = {
          ...this.detail,
          zoomLevel: this.currentZoom,
          rotationDegree: this.currentRotation
        }
        console.log('更新图片设置:', {
          zoom: this.currentZoom,
          rotation: this.currentRotation
        })
        this.$nextTick(() => {
          this.$emit('update:detail', updatedDetail)
          // 在下一个事件循环中重置标记
          setTimeout(() => {
            this.isUpdatingFromButtons = false
          }, 0)
        })
      }
    },

    selectRegion (regionId) {
      if (!this.labelStudio) return

      const store = this.labelStudio.annotationStore
      const selected = store.selected

      if (!selected) {
        console.warn('没有选中的标注集合')
        return
      }

      // 判断是单图还是多图
      const currentImageUrls = this.getImageUrls()
      const isMultiImage = currentImageUrls.length > 1

      if (isMultiImage) {
        // 多图情况下，需要查找所有图片的regions
        const imageIndices = Array.from({ length: currentImageUrls.length }, (_, i) => i + 1)
        let targetRegion = null

        for (const index of imageIndices) {
          // 获取当前图片的所有regions
          const regionsKey = `label${index}`
          const regions = selected.regionStore.regions.filter(r => r.labeling?.from_name?.name === regionsKey)

          if (regions.length > 0) {
            // 查找匹配的region
            targetRegion = regions.find(region => region.id.indexOf(regionId) !== -1)

            if (targetRegion) {
              // 选中目标region
              selected.selectArea(targetRegion)

              // 如果region在可视区域外，滚动到该region
              if (targetRegion.node) {
                targetRegion.node.scrollIntoView({
                  behavior: 'smooth',
                  block: 'center'
                })
              }

              break // 找到目标region后退出循环
            }
          }
        }

        if (!targetRegion) {
          console.warn(`未找到ID为${regionId}的标注区域`)
          return
        }
      } else {
        // 单图情况下，使用原来的逻辑
        // 获取所有regions
        const regions = selected.regionStore.regions

        if (regions.length === 0) {
          this.$message.warning('当前没有任何标注')
          return
        }
        console.log(regionId, 'regionId===>')
        console.log(regions, 'regions ===>')
        // 查找匹配的region
        const targetRegion = regions.find(region => region.id.indexOf(regionId) !== -1)

        if (!targetRegion) {
          console.warn(`未找到ID为${regionId}的标注区域`)
          return
        }

        // 选中目标region
        selected.selectArea(targetRegion)

        // 如果region在可视区域外，滚动到该region
        if (targetRegion.node) {
          targetRegion.node.scrollIntoView({
            behavior: 'smooth',
            block: 'center'
          })
        }
      }

      // 清空 pendingKey
      this.$store.dispatch('annotation/setActivateAnnotation', {
        active: false,
        pendingKey: null
      })
    },
    activateAnnotationTool () {
      if (!this.labelStudio) return
      console.log('activateAnnotationTool')

      // 判断是单图还是多图
      const currentImageUrls = this.getImageUrls()
      const isMultiImage = currentImageUrls.length > 1

      // 查找并点击标签
      this.$nextTick(() => {
        if (isMultiImage) {
          // 多图模式，点击第一个图片的标签
          const labels = document.querySelectorAll('.ant-tag')
          if (labels && labels.length > 0) {
            // 尝试找到第一个可见的标签
            let foundVisibleLabel = false
            for (const label of labels) {
              if (label.offsetParent !== null) { // 检查元素是否可见
                label.click()
                foundVisibleLabel = true
                break
              }
            }

            // 如果没有找到可见标签，尝试点击第一个标签
            if (!foundVisibleLabel && labels.length > 0) {
              labels[0].click()
            }
          }
        } else {
          // 单图模式，点击标签
          const labelElement = document.querySelector('.ant-tag')
          if (labelElement) {
            labelElement.click()
          }
        }
      })
    },
    // 添加处理删除标注的方法
    handleRemoveAnnotation (labelId) {
      if (!this.labelStudio) return

      const store = this.labelStudio.annotationStore
      const selected = store.selected

      if (!selected) {
        console.warn('没有选中的标注集合')
        return
      }

      // 判断是单图还是多图
      const currentImageUrls = this.getImageUrls()
      const isMultiImage = currentImageUrls.length > 1

      if (isMultiImage) {
        // 多图情况下，需要查找所有图片的regions
        const imageIndices = Array.from({ length: currentImageUrls.length }, (_, i) => i + 1)
        let targetRegion = null

        for (const index of imageIndices) {
          // 获取当前图片的所有regions
          const regionsKey = `label${index}`
          const regions = selected.regionStore.regions.filter(r => r.labeling?.from_name?.name === regionsKey)

          if (regions.length > 0) {
            // 查找匹配的region
            targetRegion = regions.find(region => region.id.indexOf(labelId) !== -1)

            if (targetRegion) {
              // 删除目标region
              targetRegion.deleteRegion()
              break // 找到目标region后退出循环
            }
          }
        }
      } else {
        // 单图情况下，使用原来的逻辑
        // 获取所有regions
        const regions = selected.regionStore.regions

        if (regions.length === 0) {
          return
        }

        // 查找匹配的region
        const targetRegion = regions.find(region => region.id.indexOf(labelId) !== -1)

        if (targetRegion) {
          // 删除目标region
          targetRegion.deleteRegion()
        }
      }
    },
    // 获取当前的缩放和旋转值
    getImageSettings () {
      return {
        zoomLevel: this.currentZoom,
        rotationDegree: this.currentRotation
      }
    },
    // 取消选中所有区域
    unselectAllRegions () {
      if (!this.labelStudio) return

      const store = this.labelStudio.annotationStore
      const selected = store.selected

      if (!selected) {
        console.warn('没有选中的标注集合')
        return
      }

      try {
        // 方法1: 尝试使用Label Studio的API取消选中
        if (selected.unselectAll && typeof selected.unselectAll === 'function') {
          selected.unselectAll()
          return
        }

        // 方法2: 尝试清空选中的区域
        if (selected.regionStore && selected.regionStore.unselectAll && typeof selected.regionStore.unselectAll === 'function') {
          selected.regionStore.unselectAll()
          return
        }

        // 方法3: 模拟按键'u'来取消选中
        const labelStudioElement = document.querySelector('#label-studio')
        if (labelStudioElement) {
          const keyEvent = new KeyboardEvent('keydown', {
            key: 'u',
            code: 'KeyU',
            keyCode: 85,
            which: 85,
            bubbles: true,
            cancelable: true
          })
          labelStudioElement.dispatchEvent(keyEvent)
        }
      } catch (error) {
        console.warn('取消选中区域失败:', error)
      }
    },
    // 设置鼠标事件监听器
    setupMouseEventListeners () {
      const labelStudioElement = document.querySelector('#label-studio')
      if (!labelStudioElement) {
        console.warn('未找到Label Studio容器')
        return
      }

      // 标记是否正在绘制标注
      let isDrawing = false
      let hasDrawn = false

      // 监听鼠标按下事件
      const handleMouseDown = (event) => {
        // 检查是否点击在图片区域内
        const imageElement = event.target.closest('img, canvas, .lsf-image')
        if (imageElement) {
          isDrawing = true
          hasDrawn = false
        }
      }

      // 监听鼠标移动事件
      const handleMouseMove = (event) => {
        if (isDrawing) {
          hasDrawn = true
        }
      }

      // 监听鼠标松开事件
      const handleMouseUp = (event) => {
        if (isDrawing && hasDrawn) {
          // 延迟200ms执行取消选中，确保标注创建完成
          setTimeout(() => {
            this.unselectAllRegions()
          }, 200)
        }
        isDrawing = false
        hasDrawn = false
      }

      // 添加事件监听器
      labelStudioElement.addEventListener('mousedown', handleMouseDown)
      labelStudioElement.addEventListener('mousemove', handleMouseMove)
      labelStudioElement.addEventListener('mouseup', handleMouseUp)

      // 保存事件监听器引用以便清理
      this.mouseEventListeners = {
        mousedown: handleMouseDown,
        mousemove: handleMouseMove,
        mouseup: handleMouseUp,
        element: labelStudioElement
      }

      console.log('鼠标事件监听器已设置')
    },
    // 移除鼠标事件监听器
    removeMouseEventListeners () {
      if (this.mouseEventListeners) {
        const { element, mousedown, mousemove, mouseup } = this.mouseEventListeners
        if (element) {
          element.removeEventListener('mousedown', mousedown)
          element.removeEventListener('mousemove', mousemove)
          element.removeEventListener('mouseup', mouseup)
        }
        this.mouseEventListeners = null
        console.log('鼠标事件监听器已移除')
      }
    }
  },
  mounted () {
    console.log(this.detail, 'detail')
    // 在 mounted 钩子中初始化
    this.initializeLabelStudio()
  },
  beforeDestroy () {
    if (this.labelStudio) {
      try {
        // 清理定时器
        if (this.updateTimer) {
          clearTimeout(this.updateTimer)
        }
        // 移除按钮事件监听
        this.removeButtonListeners()
        // 移除鼠标事件监听器
        this.removeMouseEventListeners()
      } catch (error) {
        console.error('Failed to cleanup event listeners:', error)
      }
    }
  }
}
</script>

<style lang="less" scoped>
.annotation-area {
  width: 100%;
  height: 100%;
  background-color: #fff;
  padding: 20px;

  #label-studio {
    width: 100%;
    height: 100%;
    min-height: 600px;
    border: 1px solid #e8e8e8;
    /deep/ .App_editor__CIAJZ{
      width: 100%;
    }
  }
}
</style>
