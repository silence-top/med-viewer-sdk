// 使用本地下载的 Annotorious v2.7.17 文件
import Annotorious from 'annotorious-openseadragon-ld'
import 'annotorious-openseadragon-ld/dist/annotorious.min.css'
import { MedViewerEngine } from './Engine'
import { BaseAnnotator } from './BaseAnnotator'

export class AnnoAnnotator extends BaseAnnotator {
  public anno: any
  private listeners: Map<string, Function[]> = new Map()
  constructor(engine: MedViewerEngine, config: any = {}) {
    super(engine)
    // 使用 v2.7.17 的 Annotorious (全局变量)
    this.anno = Annotorious(this.engine.viewer, {
      ...config
      // 可以在此配置样式、偏好等
    })
    this.injectStyles()
    this.initEvents(config)
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
  public setEnabled(enabled: boolean): void {
    this.anno.setDrawingEnabled(enabled)
    this.emit('modeChange', { enabled, tool: null })
  }

  public setTool(
    tool: 'rect' | 'polygon' | 'line' | 'point' | 'circle' | 'ellipse' | 'freehand' | null,
    color?: string
  ): void {
    if (!tool) {
      this.anno.setDrawingEnabled(false)
      this.emit('modeChange', { enabled: false, tool: null })
    } else {
      this.anno.setDrawingTool(tool, color)
      this.anno.setDrawingEnabled(true)
      this.emit('modeChange', { enabled: true, tool: tool })
    }
  }

  public setLocale(locale: string) {
    if (this.anno?.setLocale) {
      this.anno.setLocale(locale)
    }
  }

  public getAnnotations(): any[] {
    // 获取当前所有标注
    return this.anno.getAnnotations()
  }

  public setAnnotations(data: any[]): void {
    this.anno.setAnnotations(data)
  }

  public clear(): void {
    this.anno.clearAnnotations()
  }

  public destroy(): void {
    this.anno.destroy()
  }

  private initEvents(config: any) {
    // 附加事件监听器
    if (config.onCreateAnnotation) {
      this.anno.on('createAnnotation', (annotation: any) => {
        this.emit('modeChange', { enabled: false, tool: null })
      
        config.onCreateAnnotation(annotation)
      })
    }
    else{
      this.anno.on('createAnnotation', (annotation: any) => {
        this.emit('modeChange', { enabled: false, tool: null })
      })
    }
    //取消
    if (config.onCancelAnnotation) {
      this.anno.on('cancelSelected', (annotation: any) => {
        config.onCancelAnnotation(annotation)
           console.log('cancelSelected', annotation)
        this.emit('modeChange', { enabled: false, tool: null })
      })
    }
    else{
      this.anno.on('cancelSelected', (annotation: any) => {
        console.log('cancelSelected', annotation)
        this.emit('modeChange', { enabled: false, tool: null })
      })
    }


    if (config.onUpdateAnnotation) {
      this.anno.on('updateAnnotation', (annotation: any, previous: any) => {
        config.onUpdateAnnotation(annotation, previous)
      })
    }


    if (config.onDeleteAnnotation) {
      this.anno.on('deleteAnnotation', (annotation: any) => {
        config.onDeleteAnnotation(annotation)
      })
    }
  }

  private injectStyles() {
    // 适配医学影像的样式（v2.7.17 默认样式有时在深色背景下不明显）
    const styleId = 'med-anno-v2-7-17-overrides'
    if (document.getElementById(styleId)) return
    const style = document.createElement('style')
    style.id = styleId
    style.innerHTML = `
      .a9s-handle .a9s-handle-inner {
          stroke: #FFEB3B;
          fill: #FF9800;
      }
      .a9s-handle .a9s-handle-outer {
          stroke: #000;
          fill: #fff;
      }`
    document.head.appendChild(style)
  }
}
