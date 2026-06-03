import type OpenSeadragonType from 'openseadragon'
import OpenSeadragon from 'openseadragon'

import { ShapeLabelsFormatter, injectShapeLabelStyles } from '@/plugins/ShapeLabelsFormatter'

import { AnnoAnnotator } from './AnnoAnnotator'
import { ColorAdjustPlugin, type ColorAdjustOptions } from './ColorAdjustPlugin'
import { MagnificationPlugin, type MagnificationOptions } from './Magnification'
import { ScalebarPlugin, type ScalebarOptions } from './Scalebar'
import { SelectionPlugin, type SelectionOptions } from './SelectionPlugin'
import { MedToolbar, type ToolbarOptions } from './Toolbar'

import { Locale, setLocale } from '../i18n/i18n'
import { ThemeManager, type ThemeConfig, type ThemeColors, cssVar } from './Theme'

export interface AnnotoriousOptions {
  onCreateAnnotation?: (annotation: any) => void
  onUpdateAnnotation?: (annotation: any, previous: any) => void
  onDeleteAnnotation?: (annotation: any) => void
  [key: string]: any
}

/**
 * 引擎配置接口
 */
export interface MedEngineOptions {
  osdOptions: OpenSeadragonType.Options
  locale?: Locale // 国际化语言设置
  theme?: ThemeConfig // 主题配置：预设名称 / 自定义主题
  plugins?: {
    annotorious?: boolean | AnnotoriousOptions // 是否启用 Annotorious 插件
    toolbar?: boolean | ToolbarOptions // 是否启用工具栏插件
    colorAdjust?: boolean | ColorAdjustOptions // 是否启用色彩调节插件
    selection?: boolean | SelectionOptions // 是否启用选择插件
    scalebar?: boolean | ScalebarOptions // 是否启用比例尺插件
    magnification?: boolean | MagnificationOptions // 是否启用放大镜插件
  }
}

export interface AiBoxRectLabel {
  label: string
  value: string
  style?: {
    color: string
    fontSize: number
    [key: string]: any // 允许任意扩展
  }
}

export interface AiBoxRect {
  x: number
  y: number
  width: number
  height: number
  style: {
    border: string
    fontSize: number
    [key: string]: any // 允许任意扩展
  }
  labels: Array<AiBoxRectLabel>
}

export interface SelectionBox {
  x: number
  y: number
  width: number
  height: number
  style: {
    border: string
    fontSize: number
    [key: string]: any // 允许任意扩展
  }
}

/**
 * 医学影像核心引擎
 * 职责：初始化 OpenSeadragon，管理插件生命周期
 */
export class MedViewerEngine {
  public viewer: OpenSeadragon.Viewer
  // public konva: KonvaAnnotator | null = null;
  public anno: AnnoAnnotator | null = null
  public toolbar: MedToolbar | null = null
  public colorAdjust: ColorAdjustPlugin | null = null
  public selection: SelectionPlugin | null = null
  public scalebar: ScalebarPlugin | null = null
  public magnification: MagnificationPlugin | null = null
  public themeManager: ThemeManager | null = null
  private options: MedEngineOptions
  private events: Map<string, Set<Function>> = new Map()

  constructor(options: MedEngineOptions) {
    if (!options.osdOptions) {
      throw new Error('osdOptions is required')
    }

    if (options.locale) {
      setLocale(options.locale)
    }

    // 合并默认配置
    const osdOptions: OpenSeadragonType.Options = {
      id: 'osd-container',
      crossOriginPolicy: 'Anonymous',
      prefixUrl: options.osdOptions?.prefixUrl || '',
      opacity: 1,
      preload: false,
      immediateRender: false,
      defaultZoomLevel: 0,
      degrees: 0,
      flipped: false,

      // --- 缩放控制 ---
      minZoomImageRatio: 0.9, // 文档/病理混合场景最佳
      maxZoomPixelRatio: 2.0, // 允许更高分辨率细节
      smoothTileEdgesMinZoom: 1.1,
      animationTime: 0.8, // 动画速度更自然
      springStiffness: 10, // 更适合标注（减少漂移）
      pixelsPerWheelLine: 120, // 标准滚轮灵敏度
      minScrollDeltaTime: 20,

      // --- 平移控制 ---
      panHorizontal: true,
      panVertical: true,
      constrainDuringPan: true, // 必须开：Konva overlay 才不会漂移
      visibilityRatio: 0.2, // 边缘可见比例

      // --- 禁止 wrap（你现在的配置是错误的）---
      wrapHorizontal: false,
      wrapVertical: false,

      // --- Navigator 小图 ---
      showNavigator: true,
      navigatorSizeRatio: 0.15,
      navigatorPosition: 'TOP_RIGHT',
      navigatorAutoFade: false,
      navigatorOpacity: 0.8,
      navigatorBackground: '#fff',
      navigatorBorderColor: '#aaa',
      navigatorDisplayRegionColor: '#f21616',

      // --- 控件 ---
      showNavigationControl: false, // 你自己做 UI 更专业
      // rotationIncrement: 90,

      // --- 性能 ---
      // maxTilesPerFrame: 3,
      maxImageCacheCount: 100,

      // --- 手势 ---
      gestureSettingsMouse: {
        dragToPan: true,
        clickToZoom: false,
        dblClickToZoom: false
      },
      gestureSettingsTouch: {
        flickEnabled: false,
        pinchToZoom: true
      },

      ...options.osdOptions
    }
    options.osdOptions = osdOptions

    this.options = options

    // 1. 初始化 OpenSeadragon

    this.viewer = OpenSeadragon(osdOptions)

    // 1.5 初始化主题管理器（必须在插件之前，确保 CSS 变量可用）
    this.themeManager = new ThemeManager(this.viewer.element, options.theme)

    // this.viewer.addOnceHandler("open", () => {
    //   this.viewer.viewport && this.viewer.viewport.resize();
    //   this.viewer.forceRedraw();
    //   // const isWebGL = this.viewer.drawer instanceof OpenSeadragon.WebGLDrawer;
    // });

    this.viewer.addOnceHandler('open', () => {
      // this.viewer.viewport && this.viewer.viewport.resize();
      this.viewer.viewport.goHome()
      this.emit('ready')
      console.log('[MedViewerEngine] First tile loaded, refreshing viewer layout.')
      // console.log(this.viewer.viewport.getBoundsNoRotate());

      // setTimeout(() => {
      //   this.viewer.viewport && this.viewer.viewport.resize();
      //   this.viewer.forceRedraw();
      //   console.log("[MedViewerEngine] Viewer layout refreshed after tile load.");
      // })
      // this.viewer.viewport.resize();
    })

    // 2. 初始化插件
    this.initPlugins()

    // 优化：强制刷新 OSD 布局，确保显示完整
  }

  /**
   * 内部插件初始化逻辑
   * 解决异步 DOM 挂载问题，防止 Annotorious 初始化时找不到 Canvas
   */
  private initPlugins(): void {
    const { plugins } = this.options
    if (!plugins) return
    // --- Scalebar 插件初始化 ---
    if (plugins.scalebar) {
      const scalebarConfig = typeof plugins.scalebar === 'object' ? plugins.scalebar : {}
      this.scalebar = new ScalebarPlugin(this.viewer, scalebarConfig)
      console.log('[MedEngine] Scalebar plugin initialized.')
    }

    // --- Annotorious 插件初始化 ---
    // 关键：解决 "Cannot set properties of undefined (setting 'display')"
    // Annotorious v3 必须等待 OSD 的 Canvas 元素创建并挂载后才能初始化
    if (plugins.annotorious) {
      const annoConfig = typeof plugins.annotorious === 'object' ? plugins.annotorious : {}
      if (!annoConfig.locale) {
        annoConfig.locale = this.options.locale || 'zh-CN'
      }

      // 如果formatter为对象，则渲染默认格式化，需要添加样式
      if (typeof annoConfig.options?.formatter === 'object') {
        const pixelsPerMeter = annoConfig.options?.formatter?.pixelsPerMeter || 1
        const showMeasure = annoConfig.options?.formatter?.showMeasure || false
        injectShapeLabelStyles()
        annoConfig.formatter = ShapeLabelsFormatter(pixelsPerMeter, showMeasure)
      }
      if (this.viewer.isOpen()) {
        console.log('[MedEngine] Viewer is already open, mounting Annotorious.', annoConfig)
        // 如果已经打开（极少见，除非 TileSource 是同步加载的本地对象）
        this.mountAnnotorious(annoConfig)
      } else {
        // 推荐：监听 open 事件，确保 OSD 内部 DOM 结构完全就绪
        this.viewer.addOnceHandler('open', () => {
          console.log('[MedEngine] Viewer is already open, mounting Annotorious.', annoConfig)
          this.mountAnnotorious(annoConfig)
        })
      }
    }

    // --- Toolbar 插件初始化 ---
    if (plugins.toolbar) {
      const toolbarConfig = typeof plugins.toolbar === 'object' ? plugins.toolbar : {}
      this.toolbar = new MedToolbar(this, toolbarConfig)
      console.log('[MedEngine] Toolbar plugin initialized.')
    }

    // --- Selection 插件初始化 ---
    if (plugins.selection) {
      const selectionConfig = typeof plugins.selection === 'object' ? plugins.selection : {}
      this.selection = new SelectionPlugin(this.viewer, selectionConfig)
      console.log('[MedEngine] Selection plugin initialized.')
    }

    // --- ColorAdjust 插件初始化 ---
    if (plugins.colorAdjust) {
      // 1. 显式提取配置对象，如果是 boolean 则给空对象
      const config: any = typeof plugins.colorAdjust === 'object' ? plugins.colorAdjust : {}

      // 2. 传入配置
      this.colorAdjust = new ColorAdjustPlugin(this.viewer, config)
      console.log('[MedEngine] ColorAdjust plugin initialized.')
      // if(this.viewer.isOpen()){

      // }
      // else {
      //   this.viewer.addOnceHandler("open", () => {
      //     this.colorAdjust = new ColorAdjustPlugin(this.viewer, config);
      //     console.log("[MedEngine] ColorAdjust plugin initialized.");
      //   });
      // }
    }

    // --- Magnification 插件初始化 ---
    if (plugins.magnification) {
      const config: any = typeof plugins.magnification === 'object' ? plugins.magnification : {}
      this.magnification = new MagnificationPlugin(this.viewer, config)
      console.log('[MedEngine] Magnification plugin initialized.')
    }
  }

  /**
   * 真正挂载 Annotorious 的私有方法
   */
  private mountAnnotorious(config: any): void {
    try {
      this.anno = new AnnoAnnotator(this, config)
      console.log('[MedEngine] Annotorious plugin initialized. version: 2.7.17')
    } catch (error) {
      console.error('[MedEngine] Failed to initialize Annotorious:', error)
    }
  }

  public loadAIMarks(aiBoxes: AiBoxRect[] = [], showLabel = false) {
    // 清理旧的标注（如果需要）
    this.clearAIMarks()

    const tiledImage = this.viewer.world.getItemAt(0)
    if (!tiledImage) return

    aiBoxes.forEach((box: AiBoxRect) => {
      var elt = document.createElement('div')
      elt.classList.add('ld-ai-box')
      if (box.style) {
        Object.assign(elt.style, box.style)
      }

      if (showLabel) {
        let text = document.createElement('div')
        text.className = 'celltext'
        text.style.position = 'absolute'
        // text.style.display = "none";
        text.style.right = '102%'
        text.style.top = '0'
        text.style.color = '#333'
        text.style.background = '#F5F5F5'
        text.style.opacity = '0.7'
        text.style.width = 'max-content'
        text.style.padding = '5px'
        text.style.borderRadius = '8px'
        box.labels.forEach((label: AiBoxRectLabel) => {
          const labelStyle = label.style || {}
          text.innerHTML += `<div style="${Object.entries(labelStyle)
            .map(([key, value]) => `${key}:${value}`)
            .join(';')}">${label.label}&nbsp;:&nbsp;${label.value}</div>`
        })
        elt.appendChild(text)
      }

      const imageRect = new OpenSeadragon.Rect(box.x, box.y, box.width, box.height)
      const viewportRect = this.viewer.viewport.imageToViewportRectangle(imageRect)

      this.viewer.addOverlay({
        element: elt,
        location: viewportRect,
        // 如果你希望标注在缩放时不变得过大或过小，可以使用 placement
        checkResize: true
      })
    })
  }

  updateAIMarks(aiBoxes: AiBoxRect[] = [], showLabel = false) {
    this.loadAIMarks(aiBoxes, showLabel)
  }
  public async goToPosition(
    target: { x: number; y: number },
    animate: boolean = true,
    mag: number | null = null
  ) {
    const point = this.viewer.viewport.imageToViewportCoordinates(target.x, target.y)
    if (!point) return
    if (!mag) {
      this.viewer.viewport.panTo(point, animate)
      return
    }
    const { plugins } = this.options
    const config: any = typeof plugins?.magnification === 'object' ? plugins.magnification : {}
    if (config.type === 'LD') {
      const tiledImage = this.viewer.world.getItemAt(0)

      if (!tiledImage) return
      const source = (this.viewer as any).source as any
      const width = (source as any).width
      const height = (source as any).height

      const pixelsPerMeter =
        typeof plugins?.scalebar === 'object' && plugins?.scalebar?.pixelsPerMeter
          ? plugins?.scalebar?.pixelsPerMeter
          : (this.viewer as any).scalebarInstance?.pixelsPerMeter || 96

      // const currentZoom = this.viewer.viewport.getZoom()
      // const len = Math.max(width, height);
      const conversionFactor = (20 * 0.0011 * pixelsPerMeter) / width
      const targetZoom = mag / conversionFactor

      await this.viewer.viewport.zoomTo(targetZoom, undefined, animate).panTo(point, animate)
    } else {
      const tiledImage = this.viewer.world.getItemAt(0)
      if (!tiledImage) return

      const baseMag = ((this.viewer as any).source as any)?.max_magnification || 40

      // 计算目标图像缩放比例 (Target Image Zoom)
      // 例如：目标 20X / 基准 40X = 0.5 图像缩放
      const targetImageZoom = mag / baseMag

      // 将图像缩放转换为视口缩放并应用
      const targetViewportZoom = this.viewer.viewport.imageToViewportZoom(targetImageZoom)

      await this.viewer.viewport
        .zoomTo(targetViewportZoom, undefined, animate)
        .panTo(point, animate)
    }
  }

  public clearAIMarks() {
    const aiBoxesList = Array.from(
      document.getElementsByClassName('ld-ai-box') as HTMLCollectionOf<HTMLDivElement>
    )
    // 删除所有 overlay
    aiBoxesList.forEach((box) => {
      this.viewer.removeOverlay(box)
    })
  }

  public loadSelectionBox(selections: SelectionBox[] = []) {
    const aiBoxesList = Array.from(
      document.getElementsByClassName('ld-selection-box') as HTMLCollectionOf<HTMLDivElement>
    )
    // 删除所有 overlay
    aiBoxesList.forEach((box) => {
      this.viewer.removeOverlay(box)
    })
    selections.forEach((selection: SelectionBox) => {
      let elt = document.createElement('div')
      elt.classList.add('ld-selection-box')
      if (selection.style) {
        Object.assign(elt.style, selection.style)
      }
      const img = this.viewer.world.getItemAt(0)
      const size = img.getContentSize() // { x: 10240, y: 10240 }
      const x = selection.x / size.x
      const y = selection.y / size.y
      const w = selection.width / size.x
      const h = selection.height / size.y
      this.viewer.addOverlay({
        element: elt,
        location: new OpenSeadragon.Rect(x, y, w, h)
      })
    })
  }
  public addHandler(event: string, handler: Function) {
    if (!this.events.has(event)) {
      this.events.set(event, new Set())
    }
    this.events.get(event)!.add(handler)
  }

  public addOnceHandler(event: string, handler: Function) {
    const wrapper = (...args: any[]) => {
      handler(...args)
      this.removeHandler(event, wrapper)
    }
    this.addHandler(event, wrapper)
  }

  public removeHandler(event: string, handler: Function) {
    this.events.get(event)?.delete(handler)
  }

  private emit(event: string, payload?: any) {
    this.events.get(event)?.forEach((fn) => fn(payload))
  }

  /**
   * 动态设置主题
   * @param config 主题配置：预设名称 / ThemeDefinition / Partial<ThemeColors>
   */
  public setTheme(config: ThemeConfig): void {
    if (this.themeManager) {
      this.themeManager.setTheme(config)
      // 通知需要感知主题变更的插件
      if (this.selection) {
        this.selection.updateTheme(this.themeManager.getColors())
      }
      if (this.scalebar) {
        this.scalebar.updateTheme(this.themeManager.getColors())
      }
    }
    console.log(`[MedEngine] Theme changed to ${this.themeManager?.getThemeName()}`)
  }

  /**
   * 获取当前主题颜色
   */
  public getThemeColors(): ThemeColors | null {
    return this.themeManager?.getColors() ?? null
  }

  /**
   * 销毁引擎与所有插件
   */
  public destroy(): void {
    // this.konva?.destroy();
    this.anno?.destroy()
    this.toolbar?.destroy()
    this.selection?.destroy()
    this.scalebar?.destroy()
    this.colorAdjust?.destroy()
    this.themeManager?.destroy()
    this.viewer.destroy()
  }

  /**
   * 动态设置语言
   * @param locale 语言标识，如 'en' 或 'zh-CN'
   */
  public setLocale(locale: Locale): void {
    // 1. 更新全局 i18n 实例的语言
    setLocale(locale)
    this.options.locale = locale

    // 2. 更新需要动态刷新的插件
    if (this.anno) {
      this.anno.setLocale(locale)
    }

    if (this.selection) {
      this.selection.updateLocale()
    }

    if (this.toolbar) {
      // this.toolbar.updateLocale() // 假设 Toolbar 也需要更新
    }

    console.log(`[MedEngine] Locale changed to ${locale}`)
  }
}
