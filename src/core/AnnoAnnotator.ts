// 使用本地下载的 Annotorious v2.7.17 文件
import Annotorious from "annotorious-openseadragon-ld";
import "annotorious-openseadragon-ld/dist/annotorious.min.css";
import { MedViewerEngine } from "./Engine";
import { BaseAnnotator } from "./BaseAnnotator";


// // 全局类型声明
// declare global {
//   interface Window {
//     Annotorious: any;
//   }
// }

export class AnnoAnnotator extends BaseAnnotator {
  public anno: any;

  constructor(engine: MedViewerEngine, config: any = {}) {
    super(engine);
   
    // 使用 v2.7.17 的 Annotorious (全局变量)
    this.anno = Annotorious(this.engine.viewer, {
      ...config,
      // 可以在此配置样式、偏好等
    });
    this.injectStyles();
    this.initEvents();
  }

  public setEnabled(enabled: boolean): void {
    this.anno.setDrawingEnabled(enabled);
  }

  public setTool(
    tool:
      | "rect"
      | "polygon"
      | "line"
      | "point"
      | "circle"
      | "ellipse"
      | "freehand"
      | null,
    color?: string,
  ): void {
    if (!tool) {
      this.setEnabled(false);
    } else {
      this.anno.setDrawingTool(tool, color);
      this.setEnabled(true);
    }
  }

  public getAnnotations(): any[] {
    // 获取当前所有标注
    return this.anno.getAnnotations();
  }

  public setAnnotations(data: any[]): void {
    this.anno.setAnnotations(data);
  }

  public clear(): void {
    this.anno.clearAnnotations();
  }

  public destroy(): void {
    this.anno.destroy();
  }

  private initEvents() {
    this.anno.on("createAnnotation", (anno: any) => {
      console.log("新标注已创建:", anno);
    });
  }

  private injectStyles() {
    // 适配医学影像的样式（v2.7.17 默认样式有时在深色背景下不明显）
    const styleId = "med-anno-v2-7-17-overrides";
    if (document.getElementById(styleId)) return;
    const style = document.createElement("style");
    style.id = styleId;
    style.innerHTML = `
      .a9s-handle .a9s-handle-inner {
          stroke: #FFEB3B;
          fill: #FF9800;
      }
      .a9s-handle .a9s-handle-outer {
          stroke: #000;
          fill: #fff;
      }
    `;
    document.head.appendChild(style);
  }
}
