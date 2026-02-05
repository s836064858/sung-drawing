<template>
  <div class="property-panel" @keydown.stop>
    <div class="panel-header">
      <el-icon class="icon"><Setting /></el-icon>
      <h3>属性</h3>
    </div>
    <div class="panel-content">
      <div v-if="hasSelection">
        <!-- Position Section -->
        <div class="section-title">位置</div>

        <div class="property-grid">
          <div class="property-input-wrapper">
            <div class="input-label">X</div>
            <el-input-number
              v-model="formData.x"
              :controls="false"
              :precision="1"
              :disabled="formData.locked"
              size="small"
              class="figma-input"
              @change="(val) => updateProperty('x', val)"
            />
          </div>
          <div class="property-input-wrapper">
            <div class="input-label">Y</div>
            <el-input-number
              v-model="formData.y"
              :controls="false"
              :precision="1"
              :disabled="formData.locked"
              size="small"
              class="figma-input"
              @change="(val) => updateProperty('y', val)"
            />
          </div>
        </div>

        <div class="property-grid" style="margin-top: 8px">
          <div class="property-input-wrapper">
            <div class="input-label" style="width: 24px">角度</div>
            <el-input-number
              v-model="formData.rotation"
              :controls="false"
              :precision="1"
              :disabled="formData.locked"
              size="small"
              class="figma-input input-with-label-2"
              @change="(val) => updateProperty('rotation', val)"
            >
              <template #suffix>°</template>
            </el-input-number>
          </div>
          <div class="property-input-wrapper">
            <!-- Flip icons as buttons for now -->
            <div class="flip-actions">
              <div
                class="icon-btn"
                :class="{ active: formData.scaleX < 0, disabled: formData.locked }"
                title="水平翻转"
                @click="!formData.locked && toggleFlip('horizontal')"
              >
                <i class="ri-refund-line" style="transform: rotate(90deg)"></i>
              </div>
              <div
                class="icon-btn"
                :class="{ active: formData.scaleY < 0, disabled: formData.locked }"
                title="垂直翻转"
                @click="!formData.locked && toggleFlip('vertical')"
              >
                <i class="ri-refund-line"></i>
              </div>
            </div>
          </div>
        </div>

        <div class="separator"></div>

        <!-- Layout Section -->
        <div class="section-title">布局</div>
        <div class="property-grid">
          <div class="property-input-wrapper">
            <div class="input-label">宽</div>
            <el-input-number
              v-model="formData.width"
              :controls="false"
              :precision="1"
              :min="0"
              :disabled="formData.locked"
              size="small"
              class="figma-input"
              @change="(val) => updateProperty('width', val)"
            />
          </div>
          <div class="property-input-wrapper">
            <div class="input-label">高</div>
            <el-input-number
              v-model="formData.height"
              :controls="false"
              :precision="1"
              :min="0"
              :disabled="formData.locked"
              size="small"
              class="figma-input"
              @change="(val) => updateProperty('height', val)"
            />
          </div>
        </div>

        <div class="separator"></div>

        <!-- Typography Section -->
        <div v-if="isTextElement">
          <div class="separator"></div>
          <div class="section-title">排版</div>
          <div class="property-grid">
            <!-- Font Family -->
            <div class="property-input-wrapper" style="grid-column: span 2">
              <el-select
                v-model="formData.fontFamily"
                size="small"
                class="figma-select"
                placeholder="字体"
                :loading="isLoadingFont"
                :disabled="formData.locked"
                loading-text="加载字体中..."
                @change="(val) => updateProperty('fontFamily', val)"
              >
                <el-option v-for="font in fontFamilies" :key="font.value" :label="font.label" :value="font.value" />
              </el-select>
            </div>

            <!-- Weight & Size -->
            <div class="property-input-wrapper">
              <el-select
                v-model="formData.fontWeight"
                size="small"
                class="figma-select"
                placeholder="字重"
                :disabled="formData.locked"
                @change="(val) => updateProperty('fontWeight', val)"
              >
                <el-option label="Regular" value="normal" />
                <el-option label="Bold" value="bold" />
                <el-option label="Light" value="light" />
                <el-option label="Black" value="900" />
              </el-select>
            </div>

            <div class="property-input-wrapper">
              <div class="flip-actions">
                <el-tooltip content="粗体" placement="top">
                  <div
                    class="icon-btn"
                    :class="{ active: formData.fontWeight === 'bold', disabled: formData.locked }"
                    @click="!formData.locked && updateProperty('fontWeight', formData.fontWeight === 'bold' ? 'normal' : 'bold')"
                  >
                    <i class="ri-bold"></i>
                  </div>
                </el-tooltip>
                <el-tooltip content="斜体" placement="top">
                  <div
                    class="icon-btn"
                    :class="{ active: formData.italic, disabled: formData.locked }"
                    @click="!formData.locked && updateProperty('italic', !formData.italic)"
                  >
                    <i class="ri-italic"></i>
                  </div>
                </el-tooltip>
                <el-tooltip content="下划线" placement="top">
                  <div
                    class="icon-btn"
                    :class="{ active: formData.textDecoration === 'under', disabled: formData.locked }"
                    @click="!formData.locked && updateProperty('textDecoration', formData.textDecoration === 'under' ? 'none' : 'under')"
                  >
                    <i class="ri-underline"></i>
                  </div>
                </el-tooltip>
                <el-tooltip content="删除线" placement="top">
                  <div
                    class="icon-btn"
                    :class="{ active: formData.textDecoration === 'delete', disabled: formData.locked }"
                    @click="!formData.locked && updateProperty('textDecoration', formData.textDecoration === 'delete' ? 'none' : 'delete')"
                  >
                    <i class="ri-strikethrough"></i>
                  </div>
                </el-tooltip>
              </div>
            </div>

            <!-- Alignment & Decoration -->
            <div class="property-input-wrapper" style="grid-column: span 2; justify-content: space-between; margin-bottom: 4px">
              <div class="flip-actions">
                <el-tooltip content="左对齐" placement="top">
                  <div
                    class="icon-btn"
                    :class="{ active: formData.textAlign === 'left', disabled: formData.locked }"
                    @click="!formData.locked && updateProperty('textAlign', 'left')"
                  >
                    <i class="ri-align-left"></i>
                  </div>
                </el-tooltip>
                <el-tooltip content="居中" placement="top">
                  <div
                    class="icon-btn"
                    :class="{ active: formData.textAlign === 'center', disabled: formData.locked }"
                    @click="!formData.locked && updateProperty('textAlign', 'center')"
                  >
                    <i class="ri-align-center"></i>
                  </div>
                </el-tooltip>
                <el-tooltip content="右对齐" placement="top">
                  <div
                    class="icon-btn"
                    :class="{ active: formData.textAlign === 'right', disabled: formData.locked }"
                    @click="!formData.locked && updateProperty('textAlign', 'right')"
                  >
                    <i class="ri-align-right"></i>
                  </div>
                </el-tooltip>
              </div>

              <div class="flip-actions">
                <el-tooltip content="顶部对齐" placement="top">
                  <div
                    class="icon-btn"
                    :class="{ active: formData.verticalAlign === 'top', disabled: formData.locked }"
                    @click="!formData.locked && updateProperty('verticalAlign', 'top')"
                  >
                    <i class="ri-align-top"></i>
                  </div>
                </el-tooltip>
                <el-tooltip content="垂直居中" placement="top">
                  <div
                    class="icon-btn"
                    :class="{ active: formData.verticalAlign === 'middle', disabled: formData.locked }"
                    @click="!formData.locked && updateProperty('verticalAlign', 'middle')"
                  >
                    <i class="ri-align-vertically"></i>
                  </div>
                </el-tooltip>
                <el-tooltip content="底部对齐" placement="top">
                  <div
                    class="icon-btn"
                    :class="{ active: formData.verticalAlign === 'bottom', disabled: formData.locked }"
                    @click="!formData.locked && updateProperty('verticalAlign', 'bottom')"
                  >
                    <i class="ri-align-bottom"></i>
                  </div>
                </el-tooltip>
              </div>
            </div>

            <!-- Line Height & Letter Spacing & Font Size -->
            <div style="grid-column: span 2; display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 6px">
              <div class="property-input-wrapper">
                <div class="input-label">字距</div>
                <el-input-number
                  v-model="formData.letterSpacing"
                  :controls="false"
                  size="small"
                  :disabled="formData.locked"
                  class="figma-input input-with-label-2"
                  @change="(val) => updateProperty('letterSpacing', val)"
                />
              </div>
              <div class="property-input-wrapper">
                <div class="input-label">字号</div>
                <el-input-number
                  v-model="formData.fontSize"
                  :controls="false"
                  size="small"
                  :disabled="formData.locked"
                  class="figma-input input-with-label-2"
                  @change="(val) => updateProperty('fontSize', val)"
                />
              </div>
              <div class="property-input-wrapper">
                <div class="input-label">行高</div>
                <el-input-number
                  v-model="formData.lineHeight"
                  :controls="false"
                  size="small"
                  :disabled="formData.locked"
                  class="figma-input input-with-label-2"
                  @change="(val) => updateProperty('lineHeight', val)"
                />
              </div>
            </div>

            <!-- Text Content -->
            <div class="property-input-wrapper" style="grid-column: span 2; height: auto; align-items: flex-start; padding-top: 4px">
              <el-input
                v-model="formData.text"
                type="textarea"
                :rows="2"
                resize="none"
                :disabled="formData.locked"
                class="figma-textarea"
                @change="(val) => updateProperty('text', val)"
              />
            </div>
          </div>
        </div>

        <div class="separator" v-if="isTextElement"></div>

        <!-- Appearance Section -->
        <div class="section-title">外观</div>
        <div class="property-grid">
          <div class="property-input-wrapper">
            <div class="input-label" style="width: 40px">透明度</div>
            <el-input-number
              v-model="formData.opacity"
              :controls="false"
              :precision="0"
              :min="0"
              :max="100"
              size="small"
              :disabled="formData.locked"
              class="figma-input input-with-label-3"
              @change="(val) => updateProperty('opacity', val / 100)"
            />
            <span class="suffix">%</span>
          </div>
          <div class="property-input-wrapper">
            <div class="input-label" style="width: 30px">圆角</div>
            <el-input-number
              v-model="formData.cornerRadius"
              :controls="false"
              :precision="0"
              :min="0"
              size="small"
              :disabled="formData.locked"
              class="figma-input input-with-label-2"
              @change="(val) => updateProperty('cornerRadius', val)"
            />
          </div>
        </div>

        <div class="separator"></div>

        <!-- Style Section -->
        <div class="section-title">样式</div>

        <!-- Fill -->
        <div class="style-section">
          <div class="style-row">
            <div class="style-label">填充</div>
            <el-popover
              v-model:visible="showFillPopover"
              placement="left-start"
              :width="320"
              trigger="click"
              :popper-options="{
                modifiers: [
                  {
                    name: 'preventOverflow',
                    options: {
                      padding: 8
                    }
                  }
                ]
              }"
            >
              <template #reference>
                <div class="fill-preview">
                  <div 
                    class="fill-preview-box" 
                    :style="{ background: getFillPreview(formData.fill) }"
                  ></div>
                  <span class="fill-type-text">{{ getFillTypeText(formData.fill) }}</span>
                </div>
              </template>
              <div @click.stop>
                <GradientEditor
                  v-model="formData.fill"
                  :element-type="currentElement?.tag"
                  @change="(val) => updateProperty('fill', val)"
                />
              </div>
            </el-popover>
          </div>
        </div>

        <!-- Stroke -->
        <div class="style-row">
          <div class="style-label">描边</div>
          <div class="stroke-controls">
            <div class="color-picker-wrapper" :class="{ disabled: formData.locked }">
              <el-color-picker v-model="formData.stroke" show-alpha size="small" :disabled="formData.locked" @change="(val) => updateProperty('stroke', val)" />
              <span class="color-text">{{ getDisplayColor(currentElement?.stroke) }}</span>
            </div>
            <div class="property-input-wrapper" style="width: 80px">
              <div class="input-label">宽度</div>
              <el-input-number
                v-model="formData.strokeWidth"
                :controls="false"
                :precision="1"
                :min="0"
                size="small"
                :disabled="formData.locked"
                class="figma-input input-with-label-2"
                @change="(val) => updateProperty('strokeWidth', val)"
              />
            </div>
          </div>
        </div>

        <div class="separator"></div>

        <!-- Effects Section -->
        <div class="section-title">效果</div>

        <!-- Shadow -->
        <div class="effect-row">
          <div class="effect-header">
            <el-checkbox v-model="formData.shadowEnabled" size="small" :disabled="formData.locked" @change="(val) => updateProperty('shadowEnabled', val)">
              外阴影
            </el-checkbox>
          </div>
          <div v-if="formData.shadowEnabled" class="effect-controls">
            <div class="property-grid" style="margin-top: 8px">
              <div class="property-input-wrapper">
                <div class="input-label">X</div>
                <el-input-number
                  v-model="formData.shadowX"
                  :controls="false"
                  :precision="1"
                  size="small"
                  :disabled="formData.locked"
                  class="figma-input"
                  @change="(val) => updateProperty('shadowX', val)"
                />
              </div>
              <div class="property-input-wrapper">
                <div class="input-label">Y</div>
                <el-input-number
                  v-model="formData.shadowY"
                  :controls="false"
                  :precision="1"
                  size="small"
                  :disabled="formData.locked"
                  class="figma-input"
                  @change="(val) => updateProperty('shadowY', val)"
                />
              </div>
            </div>
            <div class="property-grid" style="margin-top: 8px">
              <div class="property-input-wrapper">
                <div class="input-label">模糊</div>
                <el-input-number
                  v-model="formData.shadowBlur"
                  :controls="false"
                  :precision="1"
                  :min="0"
                  size="small"
                  :disabled="formData.locked"
                  class="figma-input input-with-label-2"
                  @change="(val) => updateProperty('shadowBlur', val)"
                />
              </div>
              <div class="color-picker-wrapper" :class="{ disabled: formData.locked }">
                <el-color-picker
                  v-model="formData.shadowColor"
                  show-alpha
                  size="small"
                  :disabled="formData.locked"
                  @change="(val) => updateProperty('shadowColor', val)"
                />
                <span class="color-text">颜色</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Inner Shadow -->
        <div class="effect-row" style="margin-top: 12px">
          <div class="effect-header">
            <el-checkbox
              v-model="formData.innerShadowEnabled"
              size="small"
              :disabled="formData.locked"
              @change="(val) => updateProperty('innerShadowEnabled', val)"
            >
              内阴影
            </el-checkbox>
          </div>
          <div v-if="formData.innerShadowEnabled" class="effect-controls">
            <div class="property-grid" style="margin-top: 8px">
              <div class="property-input-wrapper">
                <div class="input-label">X</div>
                <el-input-number
                  v-model="formData.innerShadowX"
                  :controls="false"
                  :precision="1"
                  size="small"
                  :disabled="formData.locked"
                  class="figma-input"
                  @change="(val) => updateProperty('innerShadowX', val)"
                />
              </div>
              <div class="property-input-wrapper">
                <div class="input-label">Y</div>
                <el-input-number
                  v-model="formData.innerShadowY"
                  :controls="false"
                  :precision="1"
                  size="small"
                  :disabled="formData.locked"
                  class="figma-input"
                  @change="(val) => updateProperty('innerShadowY', val)"
                />
              </div>
            </div>
            <div class="property-grid" style="margin-top: 8px">
              <div class="property-input-wrapper">
                <div class="input-label">模糊</div>
                <el-input-number
                  v-model="formData.innerShadowBlur"
                  :controls="false"
                  :precision="1"
                  :min="0"
                  size="small"
                  :disabled="formData.locked"
                  class="figma-input input-with-label-2"
                  @change="(val) => updateProperty('innerShadowBlur', val)"
                />
              </div>
              <div class="color-picker-wrapper" :class="{ disabled: formData.locked }">
                <el-color-picker
                  v-model="formData.innerShadowColor"
                  show-alpha
                  size="small"
                  :disabled="formData.locked"
                  @change="(val) => updateProperty('innerShadowColor', val)"
                />
                <span class="color-text">颜色</span>
              </div>
            </div>
          </div>
        </div>

        <div class="separator"></div>
      </div>

      <!-- Export Section (Show if has ANY selection) -->
      <div v-if="hasAnySelection">
        <div class="section-title">导出</div>
        <div class="export-row">
          <div class="property-grid" style="grid-template-columns: 1fr 1fr; gap: 8px">
            <el-select v-model="formData.exportScale" size="small" class="figma-select" placeholder="倍数">
              <el-option label="1x" :value="1" />
              <el-option label="2x" :value="2" />
              <el-option label="3x" :value="3" />
              <el-option label="0.5x" :value="0.5" />
            </el-select>
            <el-select v-model="formData.exportFormat" size="small" class="figma-select" placeholder="格式">
              <el-option label="PNG" value="png" />
              <el-option label="JPG" value="jpg" />
              <el-option label="WEBP" value="webp" />
              <el-option label="SVG" value="svg" />
              <el-option label="PDF" value="pdf" />
              <el-option label="JSON" value="json" />
            </el-select>
          </div>
          <el-button size="small" class="export-btn" @click="handleExport"> 导出 {{ exportButtonText }} </el-button>
        </div>
      </div>

      <div v-if="!hasAnySelection" class="empty-state">
        <div class="empty-icon">
          <i class="ri-cursor-line"></i>
        </div>
        <div class="empty-text">选择画布上的元素以编辑属性</div>
        <div class="empty-subtext">点击图层或直接在画布上选择</div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, inject, onUnmounted, reactive, nextTick } from 'vue'
import { useStore } from 'vuex'
import { Setting } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { PropertyEvent } from 'leafer-ui'
import GradientEditor from './gradient-editor.vue'
import '@leafer-in/export' // 引入导出插件

const store = useStore()
const getCanvasCore = inject('getCanvasCore')

const fontFamilies = [
  // macOS 系统中文字体
  { label: '苹方-简', value: 'PingFang SC' },
  { label: '苹方-繁', value: 'PingFang TC' },
  { label: '华文黑体', value: 'STHeiti' },
  { label: '华文楷体', value: 'STKaiti' },
  { label: '华文宋体', value: 'STSong' },
  { label: '华文仿宋', value: 'STFangsong' },

  // 跨平台中文字体（带 fallback）
  { label: '黑体', value: 'SimHei, STHeiti, sans-serif' },
  { label: '宋体', value: 'SimSun, STSong, serif' },
  { label: '楷体', value: 'KaiTi, STKaiti, serif' },
  { label: '微软雅黑', value: 'Microsoft YaHei, PingFang SC, sans-serif' },

  // 英文字体
  { label: 'Arial', value: 'Arial' },
  { label: 'Helvetica', value: 'Helvetica' },
  { label: 'Times New Roman', value: 'Times New Roman' },
  { label: 'Courier New', value: 'Courier New' },
  { label: 'Verdana', value: 'Verdana' },
  { label: 'Georgia', value: 'Georgia' },
  { label: 'Impact', value: 'Impact' },

  // 远程字体
  {
    label: '阿里巴巴普惠体 (远程)',
    value: 'Alibaba PuHuiTi',
    url: 'https://figma-mj.oss-cn-hangzhou.aliyuncs.com/font/AlibabaPuHuiTi-3-55-RegularL3.woff2'
  }
]

const formData = reactive({
  x: 0,
  y: 0,
  width: 0,
  height: 0,
  rotation: 0,
  cornerRadius: 0,
  opacity: 100,
  scaleX: 1,
  scaleY: 1,
  fill: '',
  stroke: '',
  strokeWidth: 0,
  // Typography
  text: '',
  fontSize: 12,
  fontFamily: 'Arial',
  fontWeight: 'normal',
  textAlign: 'left',
  verticalAlign: 'top',
  lineHeight: 0,
  letterSpacing: 0,
  italic: false,
  textDecoration: 'none',
  // Shadow properties
  shadowEnabled: false,
  shadowX: 0,
  shadowY: 0,
  shadowBlur: 10,
  shadowColor: 'rgba(0,0,0,0.5)',
  // Inner shadow properties
  innerShadowEnabled: false,
  innerShadowX: 0,
  innerShadowY: 0,
  innerShadowBlur: 10,
  innerShadowColor: 'rgba(0,0,0,0.5)',
  // Export properties
  exportScale: 1,
  exportFormat: 'png',
  // Layer State
  locked: false
})

const handleExport = async () => {
  const canvasCore = getCanvasCore()
  if (!canvasCore) return

  const { exportScale, exportFormat } = formData

  await canvasCore.exportSelection({
    scale: exportScale,
    format: exportFormat
  })
}

const currentElement = ref(null)
const isLoadingFont = ref(false)
const loadedFonts = new Set() // 记录已加载的字体
const isUpdating = ref(false) // 防止循环更新
const showFillPopover = ref(false) // 显示填充弹出框
const showStrokePopover = ref(false) // 显示描边弹出框

const selectedLayerIds = computed(() => store.state.selectedLayerIds)
const hasSelection = computed(() => selectedLayerIds.value.length === 1)
const hasAnySelection = computed(() => selectedLayerIds.value.length > 0)
const isTextElement = computed(() => currentElement.value && currentElement.value.tag === 'Text')

const exportButtonText = computed(() => {
  const count = selectedLayerIds.value.length
  if (count === 0) return ''
  if (count === 1) return currentElement.value?.name || '元素'
  return `${count} 个元素`
})

// 监听选中变化
watch(
  selectedLayerIds,
  (ids) => {
    // 清理旧元素的监听
    if (currentElement.value) {
      currentElement.value.off(PropertyEvent.CHANGE, handlePropertyChange)
      currentElement.value = null
    }

    if (ids.length === 1) {
      const canvasCore = getCanvasCore()
      if (!canvasCore) return

      const element = canvasCore.findElementById(ids[0])
      if (element) {
        currentElement.value = element
        syncFromElement(element)
        // 监听元素属性变化（来自画布操作）
        element.on(PropertyEvent.CHANGE, handlePropertyChange)
      }
    }
  },
  { immediate: true }
)

// 属性变化处理函数
const handlePropertyChange = (e) => {
  if (isUpdating.value) return // 防止循环更新

  const relevantProps = [
    'x',
    'y',
    'width',
    'height',
    'rotation',
    'cornerRadius',
    'opacity',
    'scaleX',
    'scaleY',
    'fill',
    'stroke',
    'strokeWidth',
    'text',
    'fontSize',
    'fontFamily',
    'fontWeight',
    'textAlign',
    'verticalAlign',
    'lineHeight',
    'letterSpacing',
    'italic',
    'textDecoration',
    'shadow',
    'innerShadow',
    'locked'
  ]

  if (!relevantProps.includes(e.attrName)) return

  if (e.attrName === 'opacity') {
    formData.opacity = Math.round((currentElement.value.opacity ?? 1) * 100)
  } else if (e.attrName === 'lineHeight') {
    formData.lineHeight = typeof currentElement.value.lineHeight === 'object' ? 0 : currentElement.value.lineHeight || 0
  } else if (e.attrName === 'fill' || e.attrName === 'stroke') {
    formData[e.attrName] = getColorValue(currentElement.value[e.attrName])
  } else if (e.attrName === 'shadow' || e.attrName === 'innerShadow') {
    syncShadowFromElement(e.attrName)
  } else {
    formData[e.attrName] = currentElement.value[e.attrName]
  }
}

// 从元素同步数据到表单
const syncFromElement = (element) => {
  formData.x = element.x ?? 0
  formData.y = element.y ?? 0
  formData.width = element.width ?? 0
  formData.height = element.height ?? 0
  formData.rotation = element.rotation ?? 0
  formData.cornerRadius = element.cornerRadius ?? 0
  formData.opacity = Math.round((element.opacity ?? 1) * 100)
  formData.scaleX = element.scaleX ?? 1
  formData.scaleY = element.scaleY ?? 1
  
  // 处理填充颜色/渐变
  if (typeof element.fill === 'object' && element.fill?.type) {
    formData.fill = element.fill
  } else {
    formData.fill = getColorValue(element.fill)
  }
  
  // 处理描边颜色/渐变
  if (typeof element.stroke === 'object' && element.stroke?.type) {
    formData.stroke = element.stroke
  } else {
    formData.stroke = getColorValue(element.stroke)
  }
  
  formData.strokeWidth = element.strokeWidth ?? 0
  formData.locked = element.locked ?? false

  // 同步文本属性
  if (element.tag === 'Text') {
    formData.text = element.text ?? ''
    formData.fontSize = element.fontSize ?? 12
    formData.fontFamily = element.fontFamily ?? 'Arial'
    formData.fontWeight = element.fontWeight ?? 'normal'
    formData.textAlign = element.textAlign ?? 'left'
    formData.verticalAlign = element.verticalAlign ?? 'top'
    formData.lineHeight = typeof element.lineHeight === 'object' ? 0 : (element.lineHeight ?? 0)
    formData.letterSpacing = element.letterSpacing ?? 0
    formData.italic = element.italic ?? false
    formData.textDecoration = element.textDecoration ?? 'none'
  }

  // 同步阴影属性
  syncShadowFromElement('shadow')
  syncShadowFromElement('innerShadow')
}

// 从元素同步阴影数据
const syncShadowFromElement = (type) => {
  const shadow = currentElement.value?.[type]
  const prefix = type === 'shadow' ? 'shadow' : 'innerShadow'

  if (shadow && typeof shadow === 'object' && !Array.isArray(shadow)) {
    formData[`${prefix}Enabled`] = true
    formData[`${prefix}X`] = shadow.x ?? 0
    formData[`${prefix}Y`] = shadow.y ?? 0
    formData[`${prefix}Blur`] = shadow.blur ?? 10
    formData[`${prefix}Color`] = shadow.color ?? 'rgba(0,0,0,0.5)'
  } else {
    formData[`${prefix}Enabled`] = false
    formData[`${prefix}X`] = 0
    formData[`${prefix}Y`] = 0
    formData[`${prefix}Blur`] = 10
    formData[`${prefix}Color`] = 'rgba(0,0,0,0.5)'
  }
}

const getColorValue = (val) => {
  if (!val) return ''
  if (typeof val === 'object') return ''
  return val
}

const getDisplayColor = (val) => {
  if (typeof val === 'object') return ''
  if (!val) return '无'
  return val
}

// 获取填充预览
// 获取填充预览
const getFillPreview = (fill) => {
  // 处理空值
  if (!fill || fill === '') return 'transparent'
  
  // 处理纯色字符串
  if (typeof fill === 'string') {
    return fill
  }
  
  // 处理渐变对象
  if (typeof fill === 'object' && fill.type) {
    // 检查是否有色标
    if (!fill.stops || fill.stops.length === 0) {
      return 'transparent'
    }
    
    const stops = fill.stops.map(s => `${s.color} ${s.offset * 100}%`).join(', ')
    
    if (fill.type === 'linear') {
      // 根据方向计算角度
      let angle = 180
      if (fill.from && fill.to) {
        const dirMap = {
          'top-bottom': 180,
          'left-right': 90,
          'top-left-bottom-right': 135,
          'top-right-bottom-left': 225
        }
        const key = `${fill.from}-${fill.to}`
        angle = dirMap[key] || 180
      }
      return `linear-gradient(${angle}deg, ${stops})`
    }
    
    if (fill.type === 'radial') {
      return `radial-gradient(circle, ${stops})`
    }
  }
  
  return 'transparent'
}

// 获取填充类型文本
const getFillTypeText = (fill) => {
  // 处理空值
  if (!fill || fill === '') return '无'
  
  // 处理纯色字符串
  if (typeof fill === 'string') {
    return '纯色'
  }
  
  // 处理渐变对象
  if (typeof fill === 'object' && fill.type) {
    if (fill.type === 'linear') return '线性渐变'
    if (fill.type === 'radial') return '径向渐变'
  }
  
  return '纯色'
}

// 加载远程字体
const loadRemoteFont = async (fontName, fontUrl) => {
  if (loadedFonts.has(fontName)) return true

  try {
    const fontFace = new FontFace(fontName, `url(${fontUrl})`, {
      style: 'normal',
      weight: '400'
    })

    const loadedFont = await fontFace.load()
    document.fonts.add(loadedFont)
    await document.fonts.ready

    loadedFonts.add(fontName)
    console.log(`Font ${fontName} loaded successfully`)
    return true
  } catch (error) {
    console.error(`Failed to load font ${fontName}:`, error)
    throw error
  }
}

// 更新属性到元素
const updateProperty = async (key, value) => {
  if (!currentElement.value) return

  try {
    if (key === 'opacity') {
      currentElement.value.opacity = value
    } else if (key === 'fontFamily') {
      await handleFontFamilyChange(value)
    } else if (key.startsWith('shadow') || key.startsWith('innerShadow')) {
      updateShadowProperty(key, value)
    } else if (key === 'textAlign' || key === 'verticalAlign') {
      const el = currentElement.value
      if (el && el.tag === 'Text') {
        const oldBounds = { x: el.worldBoxBounds.x, y: el.worldBoxBounds.y }
        el[key] = value
        // 同步更新 formData，防止计算属性延迟
        formData[key] = value

        const newBounds = el.worldBoxBounds
        const diffX = oldBounds.x - newBounds.x
        const diffY = oldBounds.y - newBounds.y

        if (diffX !== 0 || diffY !== 0) {
          el.x += diffX
          el.y += diffY
        }
      } else {
        el[key] = value
      }
    } else {
      currentElement.value[key] = value
      // 同步更新 formData，确保 UI 立即响应
      if (key === 'fill' || key === 'stroke') {
        formData[key] = value
      }
    }

    const canvasCore = getCanvasCore()
    if (canvasCore && canvasCore.recordState) {
      canvasCore.recordState('property-change')
    }
  } finally {
    // 使用 nextTick 确保 DOM 更新后再解锁
    // await nextTick()
    // isUpdating.value = false
  }
}

// 更新阴影属性
const updateShadowProperty = (key, value) => {
  const isShadow = key.startsWith('shadow') && !key.startsWith('innerShadow')
  const type = isShadow ? 'shadow' : 'innerShadow'
  const prefix = isShadow ? 'shadow' : 'innerShadow'

  // 如果是启用/禁用开关
  if (key === `${prefix}Enabled`) {
    if (value) {
      // 启用阴影
      currentElement.value[type] = {
        x: formData[`${prefix}X`],
        y: formData[`${prefix}Y`],
        blur: formData[`${prefix}Blur`],
        color: formData[`${prefix}Color`]
      }
    } else {
      // 禁用阴影
      currentElement.value[type] = null
    }
  } else if (formData[`${prefix}Enabled`]) {
    // 更新阴影的具体属性
    const propName = key.replace(prefix, '').toLowerCase()
    currentElement.value[type] = {
      x: formData[`${prefix}X`],
      y: formData[`${prefix}Y`],
      blur: formData[`${prefix}Blur`],
      color: formData[`${prefix}Color`]
    }
  }
}

// 处理字体变更
const handleFontFamilyChange = async (value) => {
  const selectedFont = fontFamilies.find((f) => f.value === value)

  if (selectedFont?.url) {
    // 远程字体
    isLoadingFont.value = true
    try {
      await loadRemoteFont(value, selectedFont.url)

      // 确保用户没有切换到其他元素或字体
      if (formData.fontFamily === value && currentElement.value) {
        currentElement.value.fontFamily = value

        // 尝试强制更新（如果方法存在）
        if (typeof currentElement.value.forceUpdate === 'function') {
          currentElement.value.forceUpdate()
        }
      }
    } catch (error) {
      ElMessage.error(`字体 ${selectedFont.label} 加载失败`)
      // 恢复到之前的字体
      if (currentElement.value) {
        formData.fontFamily = currentElement.value.fontFamily
      }
    } finally {
      isLoadingFont.value = false
    }
  } else {
    // 系统字体，直接应用
    currentElement.value.fontFamily = value
  }
}

const toggleFlip = (type) => {
  if (!currentElement.value) return

  if (type === 'horizontal') {
    const newScaleX = (currentElement.value.scaleX ?? 1) * -1
    updateProperty('scaleX', newScaleX)
  } else if (type === 'vertical') {
    const newScaleY = (currentElement.value.scaleY ?? 1) * -1
    updateProperty('scaleY', newScaleY)
  }
}

onUnmounted(() => {
  if (currentElement.value) {
    currentElement.value.off(PropertyEvent.CHANGE, handlePropertyChange)
  }
})
</script>

<style scoped>
.property-panel {
  height: 100%;
  display: flex;
  flex-direction: column;
  background-color: #fff;
  border-left: 1px solid #e5e5e5;
  z-index: 10;
  font-family:
    'Inter',
    -apple-system,
    BlinkMacSystemFont,
    'PingFang SC',
    'Microsoft YaHei',
    sans-serif;
  user-select: none;
}

.panel-header {
  height: 40px;
  padding: 0 12px;
  display: flex;
  align-items: center;
  border-bottom: 1px solid #e5e5e5;
  background-color: #fff;
  flex-shrink: 0;
}

.panel-header h3 {
  margin: 0;
  font-size: 13px;
  font-weight: 600;
  color: #333;
}

.icon {
  margin-right: 6px;
  font-size: 14px;
  color: #666;
}

.panel-content {
  flex: 1;
  overflow-y: overlay; /* Overlay scrollbar for cleaner look */
  padding: 12px;
}

/* Custom Scrollbar */
.panel-content::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}

.panel-content::-webkit-scrollbar-track {
  background: transparent;
}

.panel-content::-webkit-scrollbar-thumb {
  background: rgba(0, 0, 0, 0.1);
  border-radius: 3px;
}

.panel-content::-webkit-scrollbar-thumb:hover {
  background: rgba(0, 0, 0, 0.2);
}

.section-title {
  font-size: 11px;
  font-weight: 600;
  color: #333;
  margin-bottom: 6px; /* Reduced from 8px */
  margin-top: 4px;
  letter-spacing: 0.5px;
}

.separator {
  height: 1px;
  background-color: #eee; /* Lighter separator */
  margin: 12px -12px;
}

/* Empty State */
.empty-state {
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #999;
  text-align: center;
  padding: 0 20px;
}

.empty-icon {
  font-size: 32px;
  margin-bottom: 12px;
  color: #ccc;
  width: 64px;
  height: 64px;
  background-color: #f5f5f5;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.empty-text {
  font-size: 13px;
  font-weight: 500;
  color: #666;
  margin-bottom: 4px;
}

.empty-subtext {
  font-size: 12px;
  color: #999;
}

/* Property Grid */
.property-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 6px; /* Reduced from 8px */
}

/* Figma-style Input Wrapper */
.property-input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
  background-color: #fff;
  border-radius: 2px;
}

.property-input-wrapper:hover .input-label,
.property-input-wrapper:hover .input-icon {
  color: #333;
}

.input-label {
  position: absolute;
  left: 8px;
  z-index: 2;
  font-size: 10px; /* Slightly smaller */
  color: #999;
  pointer-events: none;
  font-weight: 500;
  transform: translateY(0.5px); /* Optical alignment */
}

.input-icon {
  position: absolute;
  left: 6px;
  z-index: 2;
  font-size: 14px;
  color: #999;
  pointer-events: none;
  display: flex;
  align-items: center;
}

.suffix {
  position: absolute;
  right: 8px;
  font-size: 10px;
  color: #999;
  pointer-events: none;
}

.flip-actions {
  display: flex;
  gap: 4px;
  padding-left: 4px;
}

.icon-btn {
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  cursor: pointer;
  color: #666;
  font-size: 16px;
  transition: all 0.2s;
}

.icon-btn.active {
  background-color: #e6f7ff;
  color: #1890ff;
}

.icon-btn:hover {
  background-color: #f0f0f0;
}

.icon-btn.disabled {
  opacity: 0.5;
  cursor: not-allowed;
  pointer-events: none;
}

/* Customizing Element Plus Input */
:deep(.figma-input.el-input-number) {
  width: 100%;
}

:deep(.figma-input .el-input__wrapper) {
  padding-left: 24px !important;
  padding-right: 8px !important;
  box-shadow: none !important;
  background-color: #f5f5f5; /* Light gray background */
  border-radius: 4px;
  height: 28px;
  transition: all 0.2s;
}

:deep(.figma-input .el-input__wrapper:hover) {
  background-color: #eeeeee; /* Slightly darker on hover */
  box-shadow: 0 0 0 1px #e0e0e0 inset !important;
}

:deep(.figma-input .el-input__wrapper.is-focus) {
  background-color: #fff;
  box-shadow: 0 0 0 1px #409eff inset !important;
}

:deep(.figma-input.input-with-label-2 .el-input__wrapper) {
  padding-left: 40px !important;
}

:deep(.figma-input.input-with-label-3 .el-input__wrapper) {
  padding-left: 52px !important;
}

:deep(.figma-input .el-input__inner) {
  text-align: left;
  font-size: 12px;
  color: #333;
  height: 28px;
  line-height: 28px;
}

.style-row {
  display: flex;
  align-items: center;
  margin-bottom: 8px;
  justify-content: space-between;
}

.style-label {
  color: #666; /* Slightly darker than #888 */
  font-size: 12px;
  width: 40px;
}

.color-picker-wrapper {
  display: flex;
  align-items: center;
  flex: 1;
  gap: 8px;
  background-color: #f5f5f5;
  border-radius: 4px;
  padding: 2px 4px;
  border: 1px solid transparent;
  transition: all 0.2s;
}

.color-picker-wrapper:hover {
  border-color: #e0e0e0;
  background-color: #eeeeee;
}

.color-picker-wrapper.disabled {
  opacity: 0.5;
  cursor: not-allowed;
  background-color: #f5f5f5;
  border-color: transparent;
}

.color-text {
  font-size: 11px;
  color: #333;
  font-family: monospace;
}

.stroke-controls {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
}

/* Custom styling for el-color-picker to match Figma */
:deep(.el-color-picker__trigger) {
  border: 1px solid rgba(0, 0, 0, 0.1);
  width: 20px;
  height: 20px;
  padding: 0;
  border-radius: 2px;
}

:deep(.el-color-picker__color) {
  border: none;
  border-radius: 2px;
}

:deep(.el-color-picker__color-inner) {
  border-radius: 2px;
}

:deep(.figma-select .el-input__wrapper) {
  box-shadow: none !important;
  background-color: #f5f5f5;
  padding: 0 8px !important;
  height: 28px;
}

:deep(.figma-select .el-input__wrapper:hover) {
  background-color: #eeeeee;
  box-shadow: 0 0 0 1px #e0e0e0 inset !important;
}

:deep(.figma-select .el-input__wrapper.is-focus) {
  background-color: #fff;
  box-shadow: 0 0 0 1px #409eff inset !important;
}

:deep(.figma-textarea .el-textarea__inner) {
  box-shadow: none !important;
  background-color: #f5f5f5;
  padding: 6px 8px;
  font-size: 12px;
  color: #333;
  border-radius: 4px;
}

:deep(.figma-textarea .el-textarea__inner:hover) {
  background-color: #eeeeee;
  box-shadow: 0 0 0 1px #e0e0e0 inset !important;
}

:deep(.figma-textarea .el-textarea__inner:focus) {
  box-shadow: 0 0 0 1px #409eff inset !important;
  background-color: #fff;
}

.effect-row {
  margin-bottom: 8px;
}

.effect-header {
  display: flex;
  align-items: center;
  margin-bottom: 4px;
}

.effect-controls {
  padding-left: 0; /* Align with other controls */
  margin-top: 4px;
}

:deep(.el-checkbox) {
  font-size: 12px;
  color: #333;
}

:deep(.el-checkbox__label) {
  font-size: 12px;
  color: #333;
  padding-left: 6px;
}

:deep(.el-checkbox__input.is-checked .el-checkbox__inner) {
  background-color: #409eff;
  border-color: #409eff;
}

.style-section {
  margin-bottom: 12px;
}

.style-section .style-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}

.style-section .color-picker-wrapper {
  margin-top: 8px;
}

.fill-preview {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 8px;
  background: #f5f5f5;
  border-radius: 4px;
  cursor: pointer;
  transition: background 0.2s;
}

.fill-preview:hover {
  background: #ebebeb;
}

.fill-preview-box {
  width: 24px;
  height: 24px;
  border-radius: 4px;
  border: 1px solid #dcdfe6;
  background-image: 
    linear-gradient(45deg, #ccc 25%, transparent 25%),
    linear-gradient(-45deg, #ccc 25%, transparent 25%),
    linear-gradient(45deg, transparent 75%, #ccc 75%),
    linear-gradient(-45deg, transparent 75%, #ccc 75%);
  background-size: 8px 8px;
  background-position: 0 0, 0 4px, 4px -4px, -4px 0px;
}

.fill-type-text {
  font-size: 12px;
  color: #666;
  flex: 1;
}

.export-row {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.export-btn {
  width: 100%;
  justify-content: center;
}
</style>
