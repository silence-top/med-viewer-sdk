/*
 * @Author       : silence_top && 326221982@qq.com
 * @Date         : 2026-01-26 14:19:14
 * @LastEditors  : silence_top
 * @LastEditTime : 2026-03-24 08:57:05
 * @FilePath     : \med-viewer-sdk -v3\src\core\SelectionPlugin.ts
 * @Description  :
 */
import OpenSeadragon from 'openseadragon'
import { t } from '../i18n/i18n'
import '../plugins/openseadragon-selection.js'
import selectionRest from '@/assets/icons/selection_rest.png'
import selectionGroup from '@/assets/icons/selection_grouphover.png'
import selectionHover from '@/assets/icons/selection_hover.png'
import selectionDown from '@/assets/icons/selection_pressed.png'
//只需要换下面这几个图标
import selectionConfirmRest from '@/assets/icons/selection_confirm_new.png'
import selectionConfirmGroup from '@/assets/icons/selection_confirm_new.png'
import selectionConfirmHover from '@/assets/icons/selection_confirm_hover_new.png'
import selectionConfirmDown from '@/assets/icons/selection_confirm_hover_new.png'

import selectionCancelRest from '@/assets/icons/selection_cancel_new.png'
import selectionCancelGroup from '@/assets/icons/selection_cancel_new.png'
import selectionCancelHover from '@/assets/icons/selection_cancel_hover_new.png'
import selectionCancelDown from '@/assets/icons/selection_cancel_hover_new.png'

// 更新 OpenSeadragon 的内置工具提示
function updateOsdTooltips() {
  OpenSeadragon.setString('Tooltips.SelectionToggle', t('selection.toggle'))
  OpenSeadragon.setString('Tooltips.SelectionConfirm', t('selection.confirm'))
  OpenSeadragon.setString('Tooltips.SelectionCancel', t('selection.cancel'))
}

export interface SelectionOptions {
  element?: HTMLElement | null
  showSelectionControl?: boolean
  toggleButton?: HTMLElement | null
  showConfirmDenyButtons?: boolean
  styleConfirmDenyButtons?: boolean
  returnPixelCoordinates?: boolean
  keyboardShortcut?: string
  rect?: OpenSeadragon.Rect | null
  allowRotation?: boolean
  startRotated?: boolean
  startRotatedHeight?: number
  restrictToImage?: boolean
  onSelection?: (rect: OpenSeadragon.Rect, blob: Blob | null) => void
  onSelectionCanceled?: () => void
  onSelectionChange?: (rect: OpenSeadragon.Rect) => void
  onSelectionToggled?: (state: { enabled: boolean }) => void
  prefixUrl?: string | null
  navImages?: {
    selection: {
      REST: string
      GROUP: string
      HOVER: string
      DOWN: string
    }
    selectionConfirm: {
      REST: string
      GROUP: string
      HOVER: string
      DOWN: string
    }
    selectionCancel: {
      REST: string
      GROUP: string
      HOVER: string
      DOWN: string
    }
  }
  borderStyle?: {
    width: string
    color: string
  }
  handleStyle?: {
    top: string
    left: string
    width: string
    height: string
    margin: string
    background: string
    border: string
  }
  cornersStyle?: {
    width: string
    height: string
    background: string
    border: string
  }
}

export class SelectionPlugin {
  private viewer: OpenSeadragon.Viewer
  private selection: any // OpenSeadragonSelection instance
  private options: SelectionOptions
  private listeners: Map<string, Function[]> = new Map()

  constructor(viewer: OpenSeadragon.Viewer, options: SelectionOptions = {}) {
    this.viewer = viewer

    // Manually handle the onSelection callback to inject blob creation
    const userOnSelection = options.onSelection
    if (options.onSelection) {
      delete options.onSelection
    }

    this.options = {
      showSelectionControl: true,
      showConfirmDenyButtons: true,
      styleConfirmDenyButtons: true,
      returnPixelCoordinates: true,
      keyboardShortcut: 'c',
      allowRotation: true,
      startRotated: false,
      restrictToImage: false,
      prefixUrl: '',
      navImages: {
        selection: {
          REST: selectionRest,
          GROUP: selectionGroup,
          HOVER: selectionHover,
          DOWN: selectionDown
        },
        selectionConfirm: {
          REST: selectionConfirmRest,
          GROUP: selectionConfirmGroup,
          HOVER: selectionConfirmHover,
          DOWN: selectionConfirmDown
        },
        selectionCancel: {
          REST: selectionCancelRest,
          GROUP: selectionCancelGroup,
          HOVER: selectionCancelHover,
          DOWN: selectionCancelDown
        }
      },
      borderStyle: {
        width: '2px', // 稍微加粗，更有质感
        color: '#4CAF50' // 使用经典的“激活蓝”
      },
      handleStyle: {
        top: '50%',
        left: '50%',
        width: '10px', // 增大触点，方便鼠标点击
        height: '10px',
        margin: '-6px 0 0 -6px',
        background: '#4CAF50', // 白色背景
        border: '2px solid #4CAF50' // 蓝色边框
      },
      cornersStyle: {
        width: '12px', // 角部手柄稍微比边部大一点
        height: '12px',
        background: '#4CAF50',
        border: '2px solid #4CAF50'
      },
      ...options,
      // Override onSelection to provide a blob
      onSelection: (rect: OpenSeadragon.Rect) => {
        if (!userOnSelection) {
          return
        }

        try {
          const viewportRect = this.viewer.viewport.imageToViewportRectangle(rect)
          const webRect = this.viewer.viewport.viewportToViewerElementRectangle(viewportRect)

          const pixelDensityRatio = OpenSeadragon.pixelDensityRatio || 1 // 像素密度
          const { x, y, width, height } = webRect || {}

          const { canvas } = this.viewer.drawer
          const selectionCanvas = document.createElement('canvas')
          const ctx = selectionCanvas.getContext('2d')

          if (!ctx) {
            userOnSelection(rect, null)
            return
          }

          selectionCanvas.width = width * pixelDensityRatio
          selectionCanvas.height = height * pixelDensityRatio

          ctx.drawImage(
            canvas,
            x * pixelDensityRatio,
            y * pixelDensityRatio,
            width * pixelDensityRatio,
            height * pixelDensityRatio,
            0,
            0,
            width * pixelDensityRatio,
            height * pixelDensityRatio
          )

          selectionCanvas.toBlob((blob) => {
            userOnSelection(rect, blob)
            this.disable()
          })
        } catch (e) {
          console.error('[SelectionPlugin] Error creating blob from selection:', e)
          userOnSelection(rect, null)
          this.disable()
        }
      }
    }

    this.init()
    updateOsdTooltips()
  }
/**
   * 架构核心：提供通用的外部监听接口 (on)
   */
  public on(event: string, callback: Function) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, [])
    }
    this.listeners.get(event)!.push(callback)
  }
  /**
   * 内部私有：触发事件 (emit)
   */
  private emit(event: string, ...args: any[]) {
    if (this.listeners.has(event)) {
      this.listeners.get(event)!.forEach((cb) => cb(...args))
    }
  }
  /**
   * 更新语言环境，刷新工具提示
   */
  public updateLocale(): void {
    updateOsdTooltips()
  }

  private init(): void {
    // 等待 viewer 初始化完成
    this.viewer.addOnceHandler('open', () => {
      this.setupSelection()
    })
  }
  private setupSelection(): void {
    try {
      // 检查是否有 selection 插件
      if (typeof (this.viewer as any).selection !== 'function') {
        console.warn(
          'OpenSeadragonSelection plugin not found. Please include openseadragonselection.js'
        )
        return
      }

      // 初始化 selection
      this.selection = (this.viewer as any).selection(this.options)
    } catch (error) {
      console.error('[SelectionPlugin] Failed to initialize selection plugin:', error)
    }
  }

  /**
   * 启用选择模式
   */
  enable(): void {
    if (this.selection) {
      this.selection.enable()
      this.emit('selectionEnabled', true)
    }
  }

  /**
   * 禁用选择模式
   */
  disable(): void {
    if (this.selection) {
      this.selection.disable()
      this.emit('selectionEnabled', false)
    }
  }

  /**
   * 切换选择模式状态
   */
  toggleState(): void {
    if (this.selection) {
      this.selection.toggleState()
      const enabled = this.selection.isSelecting
      this.emit('selectionEnabled', enabled)
      this.emit('selectionStateToggled', enabled)
    }
  }

  /**
   * 获取当前选择区域
   */
  getSelection(): OpenSeadragon.Rect | null {
    if (this.selection) {
      return this.selection.getSelection()
    }
    return null
  }

  /**
   * 设置选择区域
   */
  setSelection(rect: OpenSeadragon.Rect): void {
    if (this.selection) {
      this.selection.setSelection(rect)
    }
  }

  /**
   * 清除选择
   */
  clearSelection(): void {
    if (this.selection) {
      this.selection.clearSelection()
    }
  }

  /**
   * 检查是否启用选择模式
   */
  isEnabled(): boolean {
    if (this.selection) {
      return this.selection.isSelecting
    }
    return false
  }

  /**
   * 销毁插件
   */
  destroy(): void {
    if (this.selection) {
      this.selection = null
    }
  }
}
