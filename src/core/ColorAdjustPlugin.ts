import OpenSeadragon from "openseadragon";
import "openseadragon-filtering";

export interface ColorAdjustments {
  brightness?: number; // 0.0 ~ 2.0 (1.0 为默认)
  contrast?: number;   // 0.0 ~ 2.0 (1.0 为默认)
  saturation?: number; // 0.0 ~ 3.0 (1.0 为默认)
  gamma?: number;      // 0.1 ~ 3.0 (1.0 为默认)
  invert?: boolean;    // 反色
  hue?: number;        // 0 ~ 360 (0 为默认)
  sepia?: boolean;     // 怀旧色调
  greyscale?: boolean; // 灰度化
}
/**
 * 2. 插件初始化选项接口
 */
export interface ColorAdjustOptions {
  adjustments?: ColorAdjustments;
  debounceMs?: number;  // 防抖延迟
  loadMode?: 'async' | 'sync'; // 渲染模式
}

export class ColorAdjustPlugin {
  private viewer: any;
  private _adjustments: ColorAdjustments;

  public get adjustments(): ColorAdjustments {
    return this._adjustments;
  }
  private debounceTimer: number | null = null;
  private debounceMs: number;
  private loadMode: 'async' | 'sync';

  constructor(engine: any, options?: ColorAdjustOptions) {
    this.viewer = engine.viewer || engine;
    this._adjustments = {
      brightness: 1.0,
      contrast: 1.0,
      saturation: 1.0,
      gamma: 1.0,
      hue: 0,
      invert: false,
      sepia: false,
      greyscale: false,
      ...options?.adjustments,
    };
    console.log("ColorAdjustPlugin initialized with adjustments:", this.adjustments);
    this.debounceMs = options?.debounceMs || 200;
    this.loadMode = options?.loadMode || 'async';
    
    this.viewer.addHandler("open", () => this.apply());
    if (this.viewer.isOpen()) this.apply();
  }


public destroy(): void {
    // 1. 清理异步定时器
    if (this.debounceTimer) {
      window.clearTimeout(this.debounceTimer);
      this.debounceTimer = null;
    }

    // 2. 移除事件监听
    if (this.viewer) {
      this.viewer.removeHandler("open", this.apply());

      // 3. 清除 OSD 上的滤镜效果，还原图像
      if (this.viewer.setFilterOptions) {
        try {
          this.viewer.setFilterOptions({
            filters: { processors: [] } 
          });
          if (this.viewer.world) this.viewer.world.draw();
        } catch (e) {
          console.warn("ColorAdjustPlugin destroy error:", e);
        }
      }
    }

    // 4. 释放引用
    this.viewer = null;
    (this._adjustments as any) = null;
  }
  /**
   * 核心算法：单次循环处理所有滤镜 (高性能模式)
   */
  private combinedProcessor = (context: CanvasRenderingContext2D, callback: () => void) => {
    const width = context.canvas.width;
    const height = context.canvas.height;
    if (width <= 0 || height <= 0) return callback();

    const imageData = context.getImageData(0, 0, width, height);
    const data = imageData.data;
    const adj = this.adjustments;

    // 预计算常量减少循环内开销
    const invGamma = 1.0 / (adj.gamma || 1.0);
    const contrastFactor = (259 * ((adj.contrast || 1.0) * 255 + 255)) / (255 * (259 - (adj.contrast || 1.0) * 255));

    for (let i = 0; i < data.length; i += 4) {
      let r = data[i];
      let g = data[i + 1];
      let b = data[i + 2];

      // 1. 反色 (Invert)
      if (adj.invert) {
        r = 255 - r; g = 255 - g; b = 255 - b;
      }

      // 2. 亮度 (Brightness)
      if (adj.brightness !== 1.0) {
        r *= adj.brightness!; g *= adj.brightness!; b *= adj.brightness!;
      }

      // 3. 对比度 (Contrast)
      if (adj.contrast !== 1.0) {
        r = (r - 128) * adj.contrast! + 128;
        g = (g - 128) * adj.contrast! + 128;
        b = (b - 128) * adj.contrast! + 128;
      }

      // 4. 伽马校正 (Gamma)
      if (adj.gamma !== 1.0) {
        r = 255 * Math.pow(r / 255, invGamma);
        g = 255 * Math.pow(g / 255, invGamma);
        b = 255 * Math.pow(b / 255, invGamma);
      }

      // 5. 灰度 (Greyscale) 或 饱和度 (Saturation) 或 怀旧 (Sepia)
      if (adj.greyscale) {
        const avg = 0.2126 * r + 0.7152 * g + 0.0722 * b;
        r = g = b = avg;
      } else if (adj.sepia) {
        const tr = 0.393 * r + 0.769 * g + 0.189 * b;
        const tg = 0.349 * r + 0.686 * g + 0.168 * b;
        const tb = 0.272 * r + 0.534 * g + 0.131 * b;
        r = tr; g = tg; b = tb;
      } else if (adj.saturation !== 1.0) {
        const gray = 0.2989 * r + 0.587 * g + 0.114 * b;
        r = gray + (r - gray) * adj.saturation!;
        g = gray + (g - gray) * adj.saturation!;
        b = gray + (b - gray) * adj.saturation!;
      }

      // 边界检查
      data[i] = Math.min(255, Math.max(0, r));
      data[i + 1] = Math.min(255, Math.max(0, g));
      data[i + 2] = Math.min(255, Math.max(0, b));
    }

    context.putImageData(imageData, 0, 0);
    callback();
  };

  public apply() {
    if (this.debounceTimer) window.clearTimeout(this.debounceTimer);
    
    this.debounceTimer = window.setTimeout(() => {
      if (!this.viewer.setFilterOptions) return;
     console.log(this.adjustments);
      this.viewer.setFilterOptions({
        filters: {
          processors: this.combinedProcessor
        },
        loadMode: this.loadMode,
        debounceMs: this.debounceMs,
      });
      
      // OSD 3.1 强制刷新当前视图
      if (this.viewer.world) this.viewer.world.draw();
    }, 20);
  }

  public setAdjustments(adj: ColorAdjustments) {
    this._adjustments = { ...this._adjustments, ...adj };
    this.apply();
  }

  public reset() {
    this._adjustments = {
      brightness: 1.0, contrast: 1.0, saturation: 1.0, 
      gamma: 1.0, hue: 0, invert: false, sepia: false, greyscale: false
    };
    this.apply();
  }
}