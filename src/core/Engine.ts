import OpenSeadragon from "openseadragon";

// import { KonvaAnnotator } from "./KonvaAnnotator";
import { AnnoAnnotator } from "./AnnoAnnotator";
import { MedToolbar, type ToolbarOptions } from "./Toolbar";
import {
  ColorAdjustPlugin,
  type ColorAdjustOptions,
} from "./ColorAdjustPlugin";
import { SelectionPlugin, type SelectionOptions } from './SelectionPlugin';
import { ScalebarPlugin, type ScalebarOptions } from './Scalebar';
import { MagnificationPlugin, type MagnificationOptions } from './Magnification';

/**
 * 引擎配置接口
 */
export interface MedEngineOptions {
  element: HTMLElement; // 承载视图的 DOM 容器
  tileSource: string | any; // DZI 路径、Tile 配置或 SVS 切片接口
  navigatorBorderRadius?: number; // 导航器圆角半径
  prefixUrl?: string; // OSD 图标资源路径
  plugins?: {
    annotorious?: boolean | any; // 是否启用 Annotorious 插件
    toolbar?: boolean | ToolbarOptions; // 是否启用工具栏插件
    colorAdjust?: boolean | ColorAdjustOptions; // 是否启用色彩调节插件
    selection?: boolean | SelectionOptions; // 是否启用选择插件
    scalebar?: boolean | ScalebarOptions; // 是否启用比例尺插件
    magnification?: boolean | MagnificationOptions; // 是否启用放大镜插件
  };
}

/**
 * 医学影像核心引擎
 * 职责：初始化 OpenSeadragon，管理插件生命周期
 */
export class MedViewerEngine {
  public viewer: OpenSeadragon.Viewer;
  // public konva: KonvaAnnotator | null = null;
  public anno: AnnoAnnotator | null = null;
  public toolbar: MedToolbar | null = null;
  public colorAdjust: ColorAdjustPlugin | null = null;
  public selection: SelectionPlugin | null = null;
  public scalebar: ScalebarPlugin | null = null;
  public magnification: MagnificationPlugin | null = null;
  private options: MedEngineOptions;

  constructor(options: MedEngineOptions) {
    // 合并默认配置
    const openseadragonOptions = {
      id: "osd-container",
      crossOriginPolicy: "Anonymous",
      prefixUrl: options.prefixUrl || '',
      // --- Viewer 基础 ---
      //useCanvas: true, // Canvas 渲染更稳定 //已经弃用了
      drawer: [ "webgl","canvas"],
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
      navigatorPosition: "TOP_RIGHT",
      navigatorAutoFade: false,
      navigatorOpacity: 0.8,
      navigatorBackground: "#fff",
      navigatorBorderColor: "#aaa",
      navigatorDisplayRegionColor: "#f21616",

      // --- 控件 ---
      showNavigationControl: false, // 你自己做 UI 更专业
      rotationIncrement: 90,

      // --- 性能 ---
      maxTilesPerFrame: 3,
      maxImageCacheCount: 100,

      // --- 手势 ---
      gestureSettingsMouse: {
        dragToPan: true,
        clickToZoom: false,
        dblClickToZoom: false,
        contextMenu: true,
      },
      gestureSettingsTouch: {
        flickEnabled: false,
        pinchToZoom: true,
        panToNextImage: false,
        contextMenu: true,
      },
      plugins: {
        annotorious: false,
        toolbar: false,
        selection: false,
      },
      ...options,
    };

    this.options = openseadragonOptions;

    // 1. 初始化 OpenSeadragon
    this.viewer = OpenSeadragon(this.options);


    this.viewer.addOnceHandler("open", () => {
      // const isWebGL = this.viewer.drawer instanceof OpenSeadragon.WebGLDrawer;
    });

    // 2. 初始化插件
    this.initPlugins();
  }

  /**
   * 内部插件初始化逻辑
   * 解决异步 DOM 挂载问题，防止 Annotorious 初始化时找不到 Canvas
   */
  private initPlugins(): void {
    const { plugins } = this.options;
    if (!plugins) return;

    // --- Konva 插件初始化 ---
    // Konva 依赖于容器尺寸，通常在 OSD 构造后即可初始化
    // if (plugins.konva) {
    //   this.konva = new KonvaAnnotator(this);
    //   console.log("[MedEngine] Konva plugin initialized.");
    // }

    // --- Annotorious 插件初始化 ---
    // 关键：解决 "Cannot set properties of undefined (setting 'display')"
    // Annotorious v3 必须等待 OSD 的 Canvas 元素创建并挂载后才能初始化
    if (plugins.annotorious) {
      const annoConfig =
        typeof plugins.annotorious === "object" ? plugins.annotorious : {};

      if (this.viewer.isOpen()) {
        // 如果已经打开（极少见，除非 TileSource 是同步加载的本地对象）
        this.mountAnnotorious(annoConfig);
      } else {
        // 推荐：监听 open 事件，确保 OSD 内部 DOM 结构完全就绪
        this.viewer.addOnceHandler("open", () => {
          this.mountAnnotorious(annoConfig);
        });
      }
    }

    // --- Toolbar 插件初始化 ---
    if (plugins.toolbar) {
      const toolbarConfig =
        typeof plugins.toolbar === "object" ? plugins.toolbar : {};
      this.toolbar = new MedToolbar(this, toolbarConfig);
    }

    // --- Selection 插件初始化 ---
    if (plugins.selection) {
      const selectionConfig =
        typeof plugins.selection === "object" ? plugins.selection : {};
      this.selection = new SelectionPlugin(this.viewer, selectionConfig);
    }

    // --- Scalebar 插件初始化 ---
    if (plugins.scalebar) {
      const scalebarConfig =
        typeof plugins.scalebar === "object" ? plugins.scalebar : {};
      this.scalebar = new ScalebarPlugin(this.viewer, scalebarConfig);
    }

    // --- ColorAdjust 插件初始化 ---
    if (plugins.colorAdjust) {
// 1. 显式提取配置对象，如果是 boolean 则给空对象
     const config:any= 
      typeof plugins.colorAdjust === "object" ? plugins.colorAdjust : {};
    
    // 2. 传入配置
    this.colorAdjust = new ColorAdjustPlugin(this.viewer, config);
    }

    // --- Magnification 插件初始化 ---
    if (plugins.magnification) {
      const config: any = 
        typeof plugins.magnification === "object" ? plugins.magnification : {};
      this.magnification = new MagnificationPlugin(this.viewer, config);
    }
  }

  /**
   * 真正挂载 Annotorious 的私有方法
   */
  private mountAnnotorious(config: any): void {
    try {
      this.anno = new AnnoAnnotator(this, config);

      console.log("[MedEngine] Annotorious plugin initialized.", this.anno);
    } catch (error) {
      console.error("[MedEngine] Failed to initialize Annotorious:", error);
    }
  }

  /**
   * 统一切换交互模式
   * @param mode 'browse' | 'konva' | 'anno'
   */
  public setInteractionEffect(mode: "browse" | "konva" | "anno"): void {
    // 先重置状态
    // this.konva?.setEnabled(false);
    this.anno?.setEnabled(false);

    switch (mode) {
      // case "konva":
      //   this.konva?.setEnabled(true);
      //   break;
      case "anno":
        this.anno?.setEnabled(true);
        break;
      case "browse":
      default:
        // 默认 OSD 导航已在上述 setEnabled(false) 中恢复
        break;
    }
  }

  /**
   * 销毁引擎与所有插件
   */
  public destroy(): void {
    // this.konva?.destroy();
    this.anno?.destroy();
    this.toolbar?.destroy();
    this.selection?.destroy();
    this.scalebar?.destroy();
    this.colorAdjust?.destroy();
    this.viewer.destroy();
    this.options.element.innerHTML = "";
  }
}
