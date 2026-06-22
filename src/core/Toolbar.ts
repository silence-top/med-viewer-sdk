import type { MedViewerEngine } from './Engine'
import buttonAnno from '@/assets/icons/tool_anno.png'
import buttonSelection from '@/assets/icons/tool_selection.png'
import buttonColorAdjust from '@/assets/icons/tool_color.png'
import buttonReset from '@/assets/icons/tool_reset.png'
import buttonRotate from '@/assets/icons/tool_rotate.png'
import { t } from '../i18n/i18n'
import { cssVar } from './Theme'

// export type ToolbarPosition =
//   | "TOP_LEFT"
//   | "TOP_CENTER"
//   | "TOP_RIGHT"
//   | "BOTTOM_LEFT"
//   | "BOTTOM_CENTER"
//   | "BOTTOM_RIGHT"
//   | "MIDDLE_LEFT"
//   | "MIDDLE_RIGHT";
export enum ToolbarPosition {
  TOP_LEFT = 'TOP_LEFT',
  TOP_CENTER = 'TOP_CENTER',
  TOP_RIGHT = 'TOP_RIGHT',
  BOTTOM_LEFT = 'BOTTOM_LEFT',
  BOTTOM_CENTER = 'BOTTOM_CENTER',
  BOTTOM_RIGHT = 'BOTTOM_RIGHT',
  MIDDLE_LEFT = 'MIDDLE_LEFT',
  MIDDLE_RIGHT = 'MIDDLE_RIGHT'
}

export interface ToolbarButton {
  id: string
  label?: string
  icon?: string
  dropdownContent?: (engine: MedViewerEngine, hide: () => void) => HTMLElement
  onClick?: (engine: MedViewerEngine, hide: () => void) => void
  /** 声明式激活状态：监听外部事件自动更新按钮激活态 */
  activeEvent?: {
    /** 事件发射器，需有 .on(event, callback) 方法 */
    emitter: any
    /** 监听的事件名 */
    event: string
    /** 将事件回调参数映射为 boolean 激活状态 */
    mapToActive: (data: any) => boolean
  }
  /** 下拉框按钮：下拉框打开时自动激活、关闭时自动取消（默认 false） */
  activeOnDropdown?: boolean
}

export interface ToolbarOptions {
  position?: ToolbarPosition

  buttons?: ToolbarButton[]
}

/**
 * 预设：标注工具下拉内容生成器
 */
const createAnnoDropdownContent = (engine: MedViewerEngine, hide: () => void): HTMLElement => {

  // 插件未就绪：返回友好提示面板
  if (!engine.anno) {
    const tip = document.createElement('div')
    tip.className = 'med-toolbar-dropdown-inner med-plugin-unavailable'
    tip.innerHTML = `<p>标注插件未启用，请在 plugins.annotorious 中开启</p>`
    return tip
  }

  const container = document.createElement('div')
  container.className = 'med-toolbar-dropdown-inner'
  let selectedColor = '#ff0000'
  const colorSection = document.createElement('div')
  colorSection.innerHTML = `<div class="med-toolbar-section-title">${t('toolbar.annoColor')}</div>`
  const colorGrid = document.createElement('div')
  colorGrid.className = 'med-color-grid'

  const colors = ['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#00ffff', '#ffffff']
  colors.forEach((c) => {
    const dot = document.createElement('div')

    dot.className = 'med-color-item'
    if (c === selectedColor) {
      dot.classList.add('active')
    }
    dot.style.backgroundColor = c
    dot.onclick = () => {
      selectedColor = c
      colorGrid.querySelectorAll('.med-color-item').forEach((el) => el.classList.remove('active'))
      dot.classList.add('active')
    }
    colorGrid.appendChild(dot)
  })
  colorSection.appendChild(colorGrid)
  container.appendChild(colorSection)

  const toolSection = document.createElement('div')
  toolSection.innerHTML = `<div class="med-toolbar-section-title">${t('toolbar.annoShape')}</div>`
  const toolGrid = document.createElement('div')
  toolGrid.className = 'med-tool-grid'

  const tools = [
    { id: 'rect', label: t('toolbar.rect') },
    { id: 'polygon', label: t('toolbar.polygon') },
    { id: 'circle', label: t('toolbar.circle') },
    { id: 'ellipse', label: t('toolbar.ellipse') },
    { id: 'line', label: t('toolbar.line') },
    { id: 'freehand', label: t('toolbar.freehand') }
  ]

  tools.forEach((tItem) => {
    const btn = document.createElement('button')
    btn.className = 'med-tool-item'
    btn.textContent = tItem.label
    btn.onclick = () => {
      //如果截图存在，要先取消截图的占用
      if (engine.selection) {
        engine.selection.disable()
      }
      if (engine.anno) engine.anno.setTool(tItem.id as any, selectedColor)
      hide()
    }
    toolGrid.appendChild(btn)
  })
  toolSection.appendChild(toolGrid)
  container.appendChild(toolSection)

  return container
}

/**
 * 默认按钮配置
 */

/**
 * 预设：颜色调整工具下拉内容生成器
 */
// 防抖函数：只在用户停止拖动 200ms 后执行一次
const debounce = (fn: Function, delay: number) => {
  let timer: number | null = null
  return (...args: any[]) => {
    if (timer) clearTimeout(timer)
    timer = window.setTimeout(() => fn(...args), delay)
  }
}

const createColorAdjustDropdownContent = (
  engine: MedViewerEngine,
  hide: () => void
): HTMLElement => {
  // 插件未就绪：返回友好提示面板
  if (!engine.colorAdjust) {
    const tip = document.createElement('div')
    tip.className = 'med-toolbar-dropdown-inner med-plugin-unavailable'
    tip.innerHTML = `<p>颜色调整插件未启用，请在 plugins.colorAdjust 中开启</p>`
    return tip
  }
  const container = document.createElement('div')
  container.className = 'med-toolbar-dropdown-inner med-color-adjust-dropdown'
  if (engine.anno) engine.anno.setEnabled(false)
  if (engine.selection) engine.selection.disable()

  // Helper to create a slider
  const createSlider = (
    labelText: string,
    id: string,
    min: number,
    max: number,
    step: number,
    initialValue: number,
    onChange: (value: number) => void
  ) => {
    const section = document.createElement('div')
    section.className = 'med-toolbar-section'
    section.innerHTML = `<div class="med-toolbar-section-title">${labelText}</div>`

    const input = document.createElement('input')
    input.type = 'range'
    input.id = id
    input.min = String(min)
    input.max = String(max)
    input.step = String(step)
    input.value = String(initialValue)

    const valueDisplay = document.createElement('span')
    valueDisplay.className = 'med-slider-value'
    valueDisplay.textContent = String(initialValue)

    // 使用防抖包装 onChange
    const debouncedOnChange = debounce(onChange, 200)

    input.oninput = (e) => {
      const value = parseFloat((e.target as HTMLInputElement).value)
      valueDisplay.textContent = value.toFixed(2)
      debouncedOnChange(value)
    }

    section.appendChild(input)
    section.appendChild(valueDisplay)
    return section
  }

  // Helper to create a checkbox
  const createCheckbox = (
    labelText: string,
    id: string,
    initialValue: boolean,
    onChange: (value: boolean) => void
  ) => {
    const section = document.createElement('div')
    section.className = 'med-toolbar-section med-checkbox-section'

    const label = document.createElement('label')
    label.htmlFor = id
    label.textContent = labelText

    const input = document.createElement('input')
    input.type = 'checkbox'
    input.id = id
    input.checked = initialValue
    input.onchange = (e) => onChange((e.target as HTMLInputElement).checked)

    section.appendChild(label)
    section.appendChild(input)
    return section
  }

  // Get current adjustments or defaults

  const currentAdjustments = engine.colorAdjust?.adjustments || {
    brightness: 1.0,
    contrast: 1.0,
    saturation: 1.0,
    gamma: 1.0,
    hue: 0,
    invert: false,
    sepia: false,
    greyscale: false
  }

  // Brightness
  container.appendChild(
    createSlider(
      t('toolbar.brightness'),
      'brightness-slider',
      0.0,
      2.0,
      0.01,
      currentAdjustments.brightness || 1.0,
      (val) => engine.colorAdjust?.setAdjustments({ brightness: val })
    )
  )

  // Contrast
  container.appendChild(
    createSlider(
      t('toolbar.contrast'),
      'contrast-slider',
      0.0,
      2.0,
      0.01,
      currentAdjustments.contrast || 1.0,
      (val) => engine.colorAdjust?.setAdjustments({ contrast: val })
    )
  )

  // Saturation
  container.appendChild(
    createSlider(
      t('toolbar.saturation'),
      'saturation-slider',
      0.0,
      3.0,
      0.01,
      currentAdjustments.saturation || 1.0,
      (val) => {
        engine.colorAdjust?.setAdjustments({
          saturation: val,
          sepia: false,
          greyscale: false
        })
        ;(container.querySelector('#sepia-checkbox') as HTMLInputElement).checked = false
        ;(container.querySelector('#greyscale-checkbox') as HTMLInputElement).checked = false
      }
    )
  )

  // Hue
  container.appendChild(
    createSlider(t('toolbar.hue'), 'hue-slider', 0, 360, 1, currentAdjustments.hue || 0, (val) => {
      engine.colorAdjust?.setAdjustments({
        hue: val,
        sepia: false,
        greyscale: false
      })
      ;(container.querySelector('#sepia-checkbox') as HTMLInputElement).checked = false
      ;(container.querySelector('#greyscale-checkbox') as HTMLInputElement).checked = false
    })
  )

  // Gamma
  container.appendChild(
    createSlider(
      t('toolbar.gamma'),
      'gamma-slider',
      0.1,
      3.0,
      0.01,
      currentAdjustments.gamma || 1.0,
      (val) => engine.colorAdjust?.setAdjustments({ gamma: val })
    )
  )

  // Invert
  container.appendChild(
    createCheckbox(
      t('toolbar.invert'),
      'invert-checkbox',
      currentAdjustments.invert || false,
      (val) => engine.colorAdjust?.setAdjustments({ invert: val })
    )
  )

  // Sepia
  container.appendChild(
    createCheckbox(
      t('toolbar.sepia'),
      'sepia-checkbox',
      currentAdjustments.sepia || false,
      (val) => {
        if (val) {
          engine.colorAdjust?.setAdjustments({
            sepia: true,
            greyscale: false,
            saturation: 1.0,
            hue: 0
          })
          ;(container.querySelector('#saturation-slider') as HTMLInputElement).value = '1.0'
          ;(container.querySelector('#hue-slider') as HTMLInputElement).value = '0'
          ;(container.querySelector('#greyscale-checkbox') as HTMLInputElement).checked = false
        } else {
          engine.colorAdjust?.setAdjustments({ sepia: false })
        }
      }
    )
  )

  // Greyscale
  container.appendChild(
    createCheckbox(
      t('toolbar.greyscale'),
      'greyscale-checkbox',
      currentAdjustments.greyscale || false,
      (val) => {
        if (val) {
          engine.colorAdjust?.setAdjustments({
            greyscale: true,
            sepia: false,
            saturation: 1.0,
            hue: 0
          })
          ;(container.querySelector('#saturation-slider') as HTMLInputElement).value = '1.0'
          ;(container.querySelector('#hue-slider') as HTMLInputElement).value = '0'
          ;(container.querySelector('#sepia-checkbox') as HTMLInputElement).checked = false
        } else {
          engine.colorAdjust?.setAdjustments({ greyscale: false })
        }
      }
    )
  )

  // Reset Button
  const resetButton = document.createElement('button')
  resetButton.className = 'med-main-btn med-reset-btn'
  resetButton.textContent = t('toolbar.reset')
  resetButton.onclick = () => {
    engine.colorAdjust?.reset()
    ;(container.querySelector('#brightness-slider') as HTMLInputElement).value = '1.0'
    ;(container.querySelector('#contrast-slider') as HTMLInputElement).value = '1.0'
    ;(container.querySelector('#saturation-slider') as HTMLInputElement).value = '1.0'
    ;(container.querySelector('#hue-slider') as HTMLInputElement).value = '0'
    ;(container.querySelector('#gamma-slider') as HTMLInputElement).value = '1.0'
    ;(container.querySelector('#invert-checkbox') as HTMLInputElement).checked = false
    ;(container.querySelector('#sepia-checkbox') as HTMLInputElement).checked = false
    ;(container.querySelector('#greyscale-checkbox') as HTMLInputElement).checked = false

    container.querySelectorAll('.med-slider-value').forEach((el) => {
      const inputId = (el.previousElementSibling as HTMLInputElement).id
      if (
        inputId === 'brightness-slider' ||
        inputId === 'contrast-slider' ||
        inputId === 'saturation-slider' ||
        inputId === 'gamma-slider'
      ) {
        el.textContent = '1.00'
      } else if (inputId === 'hue-slider') {
        el.textContent = '0'
      }
    })
  }
  container.appendChild(resetButton)

  return container
}

/**
 * 预设：角度调整工具下拉内容生成器
 */
const createRotateAdjustDropdownContent = (
  engine: MedViewerEngine,
  hide: () => void
): HTMLElement => {
  const container = document.createElement('div')
  container.className = 'med-toolbar-dropdown-inner med-rotate-adjust-dropdown'
  if (engine.anno) engine.anno.setEnabled(false)
  if (engine.selection) engine.selection.disable()

  // --- 旋转角度滑块 ---
  const rotationSection = document.createElement('div')
  rotationSection.className = 'med-toolbar-section'
  rotationSection.innerHTML = `<div class="med-toolbar-section-title">${t('toolbar.rotation')}</div>`

  const rotationSlider = document.createElement('input')
  rotationSlider.type = 'range'
  rotationSlider.id = 'rotation-slider'
  rotationSlider.min = '0'
  rotationSlider.max = '360'
  rotationSlider.step = '1'
  // OSD rotation 是逆时针度数，我们用顺时针更直观
  const currentRotation = engine.viewer.viewport.getRotation() || 0
  rotationSlider.value = String(currentRotation)

  const rotationValue = document.createElement('span')
  rotationValue.className = 'med-slider-value'
  rotationValue.textContent = `${currentRotation}°`

  const debouncedRotation = debounce((val: number) => {
    engine.viewer.viewport.setRotation(val)
  }, 100)

  rotationSlider.oninput = (e) => {
    const val = parseFloat((e.target as HTMLInputElement).value)
    rotationValue.textContent = `${val}°`
    debouncedRotation(val)
  }

  rotationSection.appendChild(rotationSlider)
  rotationSection.appendChild(rotationValue)
  container.appendChild(rotationSection)

  // --- 快捷旋转按钮 ---
  const quickRotateSection = document.createElement('div')
  quickRotateSection.className = 'med-rotate-quick-btns'

  const createQuickBtn = (label: string, onClick: () => void) => {
    const btn = document.createElement('button')
    btn.className = 'med-tool-item'
    btn.textContent = label
    btn.onclick = onClick
    return btn
  }

  quickRotateSection.appendChild(
    createQuickBtn(t('toolbar.rotateLeft'), () => {
      const cur = engine.viewer.viewport.getRotation() || 0
      const next = (cur - 90 + 360) % 360
      engine.viewer.viewport.setRotation(next)
      rotationSlider.value = String(next)
      rotationValue.textContent = `${next}°`
    })
  )

  quickRotateSection.appendChild(
    createQuickBtn(t('toolbar.rotateRight'), () => {
      const cur = engine.viewer.viewport.getRotation() || 0
      const next = (cur + 90) % 360
      engine.viewer.viewport.setRotation(next)
      rotationSlider.value = String(next)
      rotationValue.textContent = `${next}°`
    })
  )

  container.appendChild(quickRotateSection)

  // --- 水平镜像 ---
  const flipSection = document.createElement('div')
  flipSection.className = 'med-toolbar-section med-checkbox-section'

  const flipLabel = document.createElement('label')
  flipLabel.htmlFor = 'flip-checkbox'
  flipLabel.textContent = t('toolbar.flipH')

  const flipCheckbox = document.createElement('input')
  flipCheckbox.type = 'checkbox'
  flipCheckbox.id = 'flip-checkbox'
  flipCheckbox.checked = (engine.viewer.viewport as any).flipped || false
  flipCheckbox.onchange = (e) => {
    engine.viewer.viewport.setFlip((e.target as HTMLInputElement).checked)
  }

  flipSection.appendChild(flipLabel)
  flipSection.appendChild(flipCheckbox)
  container.appendChild(flipSection)

  // --- 重置按钮 ---
  const resetButton = document.createElement('button')
  resetButton.className = 'med-main-btn med-reset-btn'
  resetButton.textContent = t('toolbar.reset')
  resetButton.onclick = () => {
    engine.viewer.viewport.setRotation(0)
    engine.viewer.viewport.setFlip(false)
    rotationSlider.value = '0'
    rotationValue.textContent = '0°'
    flipCheckbox.checked = false
  }
  container.appendChild(resetButton)

  return container
}

const DEFAULT_BUTTONS: ToolbarButton[] = [
  {
    id: 'reset',
    icon: buttonReset,
    label: t('toolbar.reset'),
    onClick: (engine: MedViewerEngine, hide: () => void) => {
      engine.viewer.viewport.goHome()
      //如果截图存在，要先取消截图的占用
      if (engine.selection) {
        engine.selection.disable()
      }
      if (engine.anno) {
        engine.anno.setEnabled(false)
      }
      hide()
    }
  },
  {
    id: 'anno',
    icon: buttonAnno,
    dropdownContent: createAnnoDropdownContent,
    label: t('toolbar.annoSettings')
  },
  {
    id: 'colorAdjust',
    icon: buttonColorAdjust,
    dropdownContent: createColorAdjustDropdownContent,
    label: t('toolbar.colorAdjust'),
    activeOnDropdown: true
  },
  {
    id: 'rotateAdjust',
    icon: buttonRotate,
    dropdownContent: createRotateAdjustDropdownContent,
    label: t('toolbar.rotateAdjust'),
    activeOnDropdown: true
  },
  {
    id: 'selection',
    icon: buttonSelection,
    label: t('toolbar.screenshot'),
    onClick: (engine: MedViewerEngine, hide: () => void) => {
      if (!engine.selection) {
        console.warn('[MedToolbar] 截图插件未启用，请在 plugins.selection 中开启')
        hide()
        return
      }
      console.log('selection toggleState')
      engine.selection.toggleState()
      if (engine.anno) {
        engine.anno.setEnabled(false)
      }
      hide()
    }
  }
]

const STYLE_ID = 'med-toolbar-styles'

/**
 * MedToolbar 主类
 */
export class MedToolbar {
  private engine: MedViewerEngine
  private options: ToolbarOptions
  private element: HTMLDivElement
  private dropdownElement: HTMLDivElement | null = null
  private outsideClickHandler: ((e: MouseEvent) => void) | null = null
  private buttonElements: Map<string, HTMLButtonElement> = new Map()
  private buttonConfigs: Map<string, ToolbarButton> = new Map()
  private activeButtons: Set<string> = new Set()
  private activeDropdownButtonId: string | null = null
  private _annoListenerBound: boolean = false
  private _selectionListenerBound: boolean = false
  private _bindRetryCount: number = 0

  constructor(engine: MedViewerEngine, options: ToolbarOptions = {}) {
    this.engine = engine
    this.options = options
    this.element = document.createElement('div')
    this.element.className = this.getClassName()

    this.injectStyles()
    this.render()
    this.mount()
    this.bindActiveEvents()
    this.deferBindPluginListeners()
  }

  /**
   * 显示工具栏
   */
  public show(): void {
    this.element.style.display = 'flex'
  }

  /**
   * 隐藏工具栏
   */
  public hide(): void {
    this.element.style.display = 'none'
  }

  /**
   * 切换工具栏的可见性
   */
  public toggle(): void {
    this.element.style.display = this.element.style.display === 'none' ? 'flex' : 'none'
  }

  /**
   * 检查工具栏是否可见
   */
  public isVisible(): boolean {
    return this.element.style.display !== 'none'
  }

  /**
   * 设置按钮激活状态（公开接口，供外部自定义按钮控制）
   */
  public setButtonActive(id: string, active: boolean): void {
    const btn = this.buttonElements.get(id)
    if (!btn) return
    if (active) {
      this.activeButtons.add(id)
      btn.classList.add('active')
    } else {
      this.activeButtons.delete(id)
      btn.classList.remove('active')
    }
  }

  /**
   * 绑定自定义按钮的 activeEvent 声明式事件
   */
  private bindActiveEvents(): void {
    this.buttonConfigs.forEach((config, id) => {
      if (config.activeEvent) {
        try {
          config.activeEvent.emitter.on(config.activeEvent.event, (data: any) => {
            this.setButtonActive(id, config.activeEvent!.mapToActive(data))
          })
        } catch (e) {
          console.warn(`[MedToolbar] Failed to bind activeEvent for button "${id}":`, e)
        }
      }
    })
  }

  /**
   * 延迟绑定插件事件监听
   */
  private deferBindPluginListeners(): void {
    setTimeout(() => this.bindPluginListeners(), 0)
  }

  /**
   * 绑定插件事件监听（anno modeChange / selection selectionEnabled）
   */
  private bindPluginListeners(): void {
    if (this.engine.anno && !this._annoListenerBound) {
      this.engine.anno.on('modeChange', (state: { enabled: boolean }) => {
        this.setButtonActive('anno', state.enabled)
      })
      this._annoListenerBound = true
    }

    if (this.engine.selection && !this._selectionListenerBound) {
      this.engine.selection.on('selectionEnabled', (enabled: boolean) => {
        console.log('selectionEnabled', enabled)
        this.setButtonActive('selection', enabled)
      })
      this._selectionListenerBound = true
    }

    // anno 在 viewer 'open' 事件后才初始化，需要重试
    if (!this._annoListenerBound && ++this._bindRetryCount < 20) {
      setTimeout(() => this.bindPluginListeners(), 500)
    }
  }

  public destroy(): void {
    this.closeDropdown(true) // 销毁时强制立即移除
    this.element.remove()
    this.buttonElements.clear()
    this.buttonConfigs.clear()
    this.activeButtons.clear()
    ;(this.engine as any) = null
  }

  private render(): void {
    this.element.innerHTML = ''
    this.buttonElements.clear()
    this.buttonConfigs.clear()
    let buttonsToRender: ToolbarButton[]

    if (this.options.buttons && this.options.buttons.length > 0) {
      // User has provided custom buttons, use only these, merging with defaults if IDs match
      const defaultButtonMap = new Map(DEFAULT_BUTTONS.map((btn) => [btn.id, btn]))
      buttonsToRender = this.options.buttons.map((userBtn) => {
        const defaultBtn = defaultButtonMap.get(userBtn.id)
        return defaultBtn ? { ...defaultBtn, ...userBtn } : userBtn
      })
    } else {
      // No custom buttons provided, use all default buttons
      buttonsToRender = DEFAULT_BUTTONS
    }

    buttonsToRender.forEach((btnConfig) => {
      const wrapper = document.createElement('div')
      wrapper.className = 'med-toolbar-item-wrapper'

      const btn = document.createElement('button')
      btn.className = 'med-main-btn'
      this.buttonElements.set(btnConfig.id, btn)
      this.buttonConfigs.set(btnConfig.id, btnConfig)
      if (btnConfig.icon) {
        const img = document.createElement('img')
        img.src = btnConfig.icon
        img.alt = btnConfig.label || btnConfig.id
        btn.appendChild(img)
      } else if (btnConfig.label) {
        btn.textContent = btnConfig.label
      }

      btn.onclick = (e) => {
        e.stopPropagation()
        // 如果当前点击的按钮对应的下拉框已打开，则关闭它
        if (this.dropdownElement && this.dropdownElement.parentElement === wrapper) {
          this.closeDropdown()
          return
        }

        // 先尝试关闭现有下拉框
        this.closeDropdown()

        if (btnConfig.onClick) {
          btnConfig.onClick(this.engine, () => this.closeDropdown())
        } else if (btnConfig.dropdownContent) {
          this.showDropdown(wrapper, btnConfig)
        }
      }

      wrapper.appendChild(btn)

      // Add tooltip if label exists
      if (btnConfig.label) {
        const tooltip = document.createElement('div')
        tooltip.className = 'med-tooltip'
        tooltip.textContent = btnConfig.label
        wrapper.appendChild(tooltip)
      }

      this.element.appendChild(wrapper)
    })
  }

  private showDropdown(parent: HTMLElement, config: ToolbarButton) {
    this.activeDropdownButtonId = config.id
    // 下拉框按钮：activeOnDropdown 为 true 时，下拉打开自动激活
    if (config.activeOnDropdown) {
      this.setButtonActive(config.id, true)
    }
    this.dropdownElement = document.createElement('div')
    this.dropdownElement.className = 'med-toolbar-dropdown'

    const content = config.dropdownContent!(this.engine, () => this.closeDropdown())
    this.dropdownElement.appendChild(content)
    parent.appendChild(this.dropdownElement)

    // 1. 边界检查调整位置
    this.adjustDropdownPosition()

    // 2. 触发动画 (下一帧添加 show 类)
    requestAnimationFrame(() => {
      this.dropdownElement?.classList.add('show')
    })

    // 3. 点击外部关闭
    this.outsideClickHandler = (e: MouseEvent) => {
      if (this.dropdownElement && !this.dropdownElement.contains(e.target as Node)) {
        this.closeDropdown()
      }
    }
    setTimeout(() => document.addEventListener('click', this.outsideClickHandler!), 0)
  }

  private adjustDropdownPosition() {
    if (!this.dropdownElement) return

    const rect = this.dropdownElement.getBoundingClientRect()
    const viewportWidth = window.innerWidth
    // const padding = 12;

    // 检查右边缘
    if (rect.right > viewportWidth) {
      this.dropdownElement.style.left = 'auto'
      this.dropdownElement.style.right = '0'
      this.dropdownElement.style.transform = 'translateX(0) translateY(10px)'
      this.dropdownElement.setAttribute('data-adjusted', 'true')
    }
    // 检查左边缘
    else if (rect.left < 0) {
      this.dropdownElement.style.left = '0'
      this.dropdownElement.style.transform = 'translateX(0) translateY(10px)'
      this.dropdownElement.setAttribute('data-adjusted', 'true')
    }

    // 针对顶部位置调整动画起始点
    const isTop = (this.options.position || '').includes('TOP')
    if (isTop) {
      const currentTransform = this.dropdownElement.style.transform
      this.dropdownElement.style.transform = currentTransform.replace(
        'translateY(10px)',
        'translateY(-10px)'
      )
    }
  }

  private closeDropdown(immediate = false) {
    // 下拉框关闭时，取消 activeOnDropdown 按钮的激活态
    if (this.activeDropdownButtonId) {
      const btnConfig = this.buttonConfigs.get(this.activeDropdownButtonId)
      if (btnConfig?.activeOnDropdown) {
        this.setButtonActive(this.activeDropdownButtonId, false)
      }
    }
    this.activeDropdownButtonId = null
    if (this.dropdownElement) {
      const el = this.dropdownElement
      this.dropdownElement = null // 立即清除引用防止重复触发

      if (immediate) {
        el.remove()
      } else {
        el.classList.remove('show')
        // 等待 CSS 过渡动画结束后移除元素
        setTimeout(() => el.remove(), 200)
      }
    }
    if (this.outsideClickHandler) {
      document.removeEventListener('click', this.outsideClickHandler)
      this.outsideClickHandler = null
    }
  }

  private mount(): void {
    const container = this.engine.viewer?.element
    if (container) container.appendChild(this.element)

  }

  private getClassName(): string {
    const pos = this.options.position || 'BOTTOM_CENTER'
    return `med-toolbar med-toolbar--${pos}`
  }

  private injectStyles(): void {
    if (document.getElementById(STYLE_ID)) return
    const style = document.createElement('style')
    style.id = STYLE_ID
    style.textContent = `
      .med-toolbar {
        position: absolute;
        display: flex;
        gap: 12px;
        padding: 10px;
        z-index: 100;
        background: ${cssVar('panelBackground')};
        border-radius: 12px;
        backdrop-filter: blur(10px);
        border: 1px solid ${cssVar('panelBorder')};
        box-shadow: ${cssVar('panelShadow')};
      }

      /* 定位 */
      .med-toolbar--TOP_LEFT { top: 18px; left: 18px; }
      .med-toolbar--TOP_CENTER { top: 18px; left: 50%; transform: translateX(-50%); }
      .med-toolbar--TOP_RIGHT { top: 18px; right: 18px; }
      .med-toolbar--BOTTOM_LEFT { bottom: 18px; left: 18px; }
      .med-toolbar--BOTTOM_CENTER { bottom: 18px; left: 50%; transform: translateX(-50%); }
      .med-toolbar--BOTTOM_RIGHT { bottom: 18px; right: 18px; }
      .med-toolbar--MIDDLE_LEFT { top: 50%; left: 18px; transform: translateY(-50%); flex-direction: column; }
      .med-toolbar--MIDDLE_RIGHT { top: 50%; right: 18px; transform: translateY(-50%); flex-direction: column; }

      .med-toolbar-item-wrapper { position: relative; }
      
      /* 按钮及动画 */
      .med-main-btn {
        background: ${cssVar('btnBackground')};
        color: ${cssVar('textPrimary')};
        border: none;
        padding: 8px 16px;
        border-radius: 8px;
        cursor: pointer;
        transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        display: flex;
        align-items: center;
        justify-content: center;
      }
      .med-main-btn:hover, .med-main-btn.active { background: ${cssVar('accentBgHigh')}; }
      .med-main-btn:active { transform: scale(0.9); }
      .med-main-btn img { width: 24px; height: 24px; filter: ${cssVar('iconFilter')}; }

      /* 下拉框基础及进场动画 */
      .med-toolbar-dropdown {
        position: absolute;
        bottom: calc(100% + 12px); 
        left: 50%;
        background: ${cssVar('panelBackgroundSolid')};
        border: 1px solid ${cssVar('panelBorder')};
        border-radius: 12px;
        padding: 16px;
        box-shadow: ${cssVar('panelShadow')};
        min-width: 220px;
        z-index: 101;
        
        /* 初始动画状态 */
        opacity: 0;
        pointer-events: none;
        transform: translateX(-50%) translateY(10px);
        transition: opacity 0.2s ease, transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
      }

      /* 动画显示状态 */
      .med-toolbar-dropdown.show {
        opacity: 1;
        pointer-events: auto;
        transform: translateX(-50%) translateY(0) !important;
      }
      
      /* 边界修正后的显示状态 */
      .med-toolbar-dropdown[data-adjusted="true"].show {
        transform: translateX(0) translateY(0) !important;
      }

      /* 顶部位置下拉动画修正 */
      [class*="med-toolbar--TOP"] .med-toolbar-dropdown {
        bottom: auto;
        top: calc(100% + 12px);
        transform: translateX(-50%) translateY(-10px);
      }

      /* 侧边位置逻辑 */
      .med-toolbar--MIDDLE_LEFT .med-toolbar-dropdown {
        left: calc(100% + 12px); top: 0; bottom: auto; transform: translateX(-10px);
      }
      .med-toolbar--MIDDLE_LEFT .med-toolbar-dropdown.show { transform: translateX(0) !important; }

      .med-toolbar--MIDDLE_RIGHT .med-toolbar-dropdown {
        left: auto; right: calc(100% + 12px); top: 0; bottom: auto; transform: translateX(10px);
      }
      .med-toolbar--MIDDLE_RIGHT .med-toolbar-dropdown.show { transform: translateX(0) !important; }

      /* Tooltip styles */
      .med-tooltip {
        position: absolute;
        padding: 6px 10px;
        background: ${cssVar('tooltipBg')};
        color: ${cssVar('tooltipColor')};
        border-radius: 6px;
        font-size: 12px;
        white-space: nowrap;
        z-index: 102;
        opacity: 0;
        pointer-events: none;
        transition: opacity 0.2s ease, transform 0.2s ease;
      }

      .med-toolbar-item-wrapper:hover .med-tooltip {
        opacity: 1;
        pointer-events: auto;
      }

      /* Tooltip directions based on toolbar position */

      /* Default: bottom tooltip (for top toolbars) */
      .med-toolbar-item-wrapper .med-tooltip {
        top: calc(100% + 12px); /* Position below the button */
        left: 50%;
        transform: translateX(-50%) translateY(0px);
      }
      .med-toolbar-item-wrapper:hover .med-tooltip {
        transform: translateX(-50%) translateY(0);
      }


      /* Top tooltip (for bottom toolbars) */
      [class*="med-toolbar--BOTTOM"] .med-toolbar-item-wrapper .med-tooltip {
        bottom: calc(100% + 12px); /* Position above the button */
        top: auto;
        left: 50%;
        transform: translateX(-50%) translateY(0px);
      }
      [class*="med-toolbar--BOTTOM"] .med-toolbar-item-wrapper:hover .med-tooltip {
        transform: translateX(-50%) translateY(0);
      }

      /* Right tooltip (for middle-left toolbars) */
      [class*="med-toolbar--MIDDLE_LEFT"] .med-toolbar-item-wrapper .med-tooltip {
        left: calc(100% + 12px); /* Position to the right of the button */
        top: 50%;
        transform: translateY(-50%) translateX(0px);
      }
      [class*="med-toolbar--MIDDLE_LEFT"] .med-toolbar-item-wrapper:hover .med-tooltip {
        transform: translateY(-50%) translateX(0);
      }

      /* Left tooltip (for middle-right toolbars) */
      [class*="med-toolbar--MIDDLE_RIGHT"] .med-toolbar-item-wrapper .med-tooltip {
        right: calc(100% + 12px); /* Position to the left of the button */
        top: 50%;
        left: auto;
        transform: translateY(-50%) translateX(0px);
      }
      [class*="med-toolbar--MIDDLE_RIGHT"] .med-toolbar-item-wrapper:hover .med-tooltip {
        transform: translateY(-50%) translateX(0);
      }

      /* 内容样式 */
      .med-toolbar-section-title { font-size: 11px; color: ${cssVar('textMuted')}; margin-bottom: 10px; letter-spacing: 1px; }
      .med-color-grid { display: flex; gap: 10px; margin-bottom: 20px; }
      .med-color-item { width: 24px; height: 24px; border-radius: 50%; cursor: pointer; border: 2px solid transparent; transition: 0.2s; }
      .med-color-item.active { border-color: ${cssVar('colorItemActiveBorder')}; transform: scale(1.15); box-shadow: ${cssVar('colorItemActiveShadow')}; }
      .med-tool-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; }
      .med-tool-item { background: ${cssVar('toolItemBg')}; border: 1px solid ${cssVar('toolItemBorder')}; color: ${cssVar('textPrimary')}; padding: 8px 4px; border-radius: 6px; cursor: pointer; font-size: 12px; transition: 0.2s; }
      .med-tool-item:hover { background: ${cssVar('toolItemHoverBg')}; border-color: ${cssVar('toolItemHoverBorder')}; }

      /* 颜色调整下拉框样式 */
      .med-color-adjust-dropdown {
        min-width: 280px;
      }

      /* 角度调整下拉框样式 */
      .med-rotate-adjust-dropdown {
        min-width: 250px;
      }

      .med-rotate-quick-btns {
        display: flex;
        gap: 8px;
        margin-bottom: 15px;
      }
      .med-rotate-quick-btns .med-tool-item {
        flex: 1;
      }

      .med-toolbar-section {
        margin-bottom: 15px;
        display: flex;
        flex-direction: column;
      }

      .med-toolbar-section-title {
        margin-bottom: 8px;
        font-size: 13px;
        color: ${cssVar('textPrimary')};
      }

      .med-toolbar-section input[type="range"] {
        width: 100%;
        -webkit-appearance: none;
        height: 4px;
        background: ${cssVar('sliderTrackBg')};
        border-radius: 2px;
        outline: none;
        margin-top: 5px;
        margin-bottom: 5px;
      }

      .med-toolbar-section input[type="range"]::-webkit-slider-thumb {
        -webkit-appearance: none;
        width: 16px;
        height: 16px;
        border-radius: 50%;
        background: ${cssVar('sliderThumbColor')};
        cursor: pointer;
        border: 2px solid ${cssVar('panelBackgroundSolid')};
        transition: background 0.15s ease-in-out;
      }

      .med-toolbar-section input[type="range"]::-webkit-slider-thumb:hover {
        background: ${cssVar('sliderThumbHover')};
      }

      .med-slider-value {
        font-size: 12px;
        color: ${cssVar('textSecondary')};
        align-self: flex-end;
      }

      .med-checkbox-section {
        flex-direction: row;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 10px;
      }

      .med-checkbox-section label {
        font-size: 13px;
        color: ${cssVar('textPrimary')};
        cursor: pointer;
      }

      .med-checkbox-section input[type="checkbox"] {
        -webkit-appearance: none;
        -moz-appearance: none;
        appearance: none;
        width: 18px;
        height: 18px;
        border: 1px solid ${cssVar('checkboxBorder')};
        border-radius: 4px;
        background-color: transparent;
        cursor: pointer;
        position: relative;
        transition: all 0.2s ease;
      }

      .med-checkbox-section input[type="checkbox"]:checked {
        background-color: ${cssVar('checkboxCheckedBg')};
        border-color: ${cssVar('checkboxCheckedBg')};
      }

      .med-checkbox-section input[type="checkbox"]:checked::after {
        content: '';
        position: absolute;
        left: 5px;
        top: 2px;
        width: 4px;
        height: 9px;
        border: solid white;
        border-width: 0 2px 2px 0;
        transform: rotate(45deg);
      }

      .med-reset-btn {
        width: 100%;
        margin-top: 15px;
        background: ${cssVar('dangerBgLow')};
        color: ${cssVar('dangerColor')};
        border: 1px solid ${cssVar('dangerBgHigh')};
      }
      .med-reset-btn:hover {
        background: ${cssVar('dangerBgHigh')};
      }
      .med-plugin-unavailable {
        min-width: 200px;
        padding: 16px 12px;
        text-align: center;
      }
      .med-plugin-unavailable p {
        margin: 0;
        font-size: 13px;
        color: ${cssVar('textMuted')};
        line-height: 1.5;
      }
    `
    document.head.appendChild(style)
  }
}
