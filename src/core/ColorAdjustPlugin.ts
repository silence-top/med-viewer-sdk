import "openseadragon-filtering";

export interface ColorAdjustments {
  brightness?: number;
  contrast?: number;
  saturation?: number;
  gamma?: number;
  hue?: number;
  invert?: boolean;
  sepia?: boolean;
  greyscale?: boolean;
}

export interface ColorAdjustOptions {
  adjustments?: ColorAdjustments;
  debounceMs?: number; // 建议 60ms 左右，平衡实时性与性能
  loadMode?: "async" | "sync"; 
}

export class ColorAdjustPlugin {
  private viewer: any;
  private _adjustments: ColorAdjustments;
  private options: Required<ColorAdjustOptions>;
  private lut = new Uint8ClampedArray(256);
  private needUpdate = true;
  private debounceTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(viewer: any, options?: ColorAdjustOptions) {
    this.viewer = viewer.viewer || viewer;
    
    // 默认配置初始化
    this.options = {
      adjustments: {
        brightness: 1.0, contrast: 1.0, saturation: 1.0,
        gamma: 1.0, hue: 0, invert: false, sepia: false, greyscale: false,
      },
      debounceMs: 60,
      loadMode: "async",
      ...options
    };

    this._adjustments = { ...this.options.adjustments };

    this.viewer.addHandler("open", () => this.apply());
    if (this.viewer.isOpen()) this.apply();
  }

  /**
   * 更新查找表 (LUT)
   * 将亮度、对比度、反色、伽马合并为一个 256 长度的数组，大幅减少循环内计算
   */
  private updateLut() {
    const adj = this._adjustments;
    const invGamma = 1.0 / (adj.gamma || 1.0);
    const { brightness: br = 1, contrast: co = 1, invert, gamma } = adj;

    for (let i = 0; i < 256; i++) {
      let v = i;
      if (invert) v = 255 - v;
      if (br !== 1.0) v *= br;
      if (co !== 1.0) v = (v - 128) * co + 128;
      if (gamma !== 1.0) v = 255 * Math.pow(v / 255, invGamma);
      this.lut[i] = v; // Uint8ClampedArray 会自动处理 round 和 0-255 截断
    }
    this.needUpdate = false;
  }

  /**
   * 核心处理器：利用异步调度减少主线程占用
   */
  private combinedProcessor = (context: CanvasRenderingContext2D, callback: () => void) => {
    // 1. 将重计算任务推入宏任务队列，让出主线程给 UI 交互（如缩放、拖拽）
    setTimeout(() => {
      const { width, height } = context.canvas;
      if (width <= 0 || height <= 0) {
        callback();
        return;
      }

      if (this.needUpdate) this.updateLut();

      const imageData = context.getImageData(0, 0, width, height);
      const data = imageData.data;
      const len = data.length;
      const lut = this.lut;
      const { hue = 0, saturation = 1, greyscale, sepia } = this._adjustments;

      // 2. 性能优化：根据滤镜配置选择执行路径，避免循环内部做 if 判断
      if (greyscale) {
        for (let i = 0; i < len; i += 4) {
          const avg = 0.2126 * lut[data[i]] + 0.7152 * lut[data[i + 1]] + 0.0722 * lut[data[i + 2]];
          data[i] = data[i + 1] = data[i + 2] = avg;
        }
      } else if (sepia) {
        for (let i = 0; i < len; i += 4) {
          const r = lut[data[i]], g = lut[data[i + 1]], b = lut[data[i + 2]];
          data[i] = 0.393 * r + 0.769 * g + 0.189 * b;
          data[i + 1] = 0.349 * r + 0.686 * g + 0.168 * b;
          data[i + 2] = 0.272 * r + 0.534 * g + 0.131 * b;
        }
      } else {
        // 处理 Hue 和 Saturation
        const hasHue = hue !== 0;
        const hasSat = saturation !== 1.0;
        const angle = hue * (Math.PI / 180);
        const cosA = Math.cos(angle), sinA = Math.sin(angle);
        const r1 = cosA + (1-cosA)/3, g1 = 1/3*(1-cosA)-Math.sqrt(1/3)*sinA, b1 = 1/3*(1-cosA)+Math.sqrt(1/3)*sinA;
        const r2 = 1/3*(1-cosA)+Math.sqrt(1/3)*sinA, g2 = cosA+(1-cosA)/3, b2 = 1/3*(1-cosA)-Math.sqrt(1/3)*sinA;
        const r3 = 1/3*(1-cosA)-Math.sqrt(1/3)*sinA, g3 = 1/3*(1-cosA)+Math.sqrt(1/3)*sinA, b3 = cosA+(1-cosA)/3;

        for (let i = 0; i < len; i += 4) {
          let r = lut[data[i]], g = lut[data[i + 1]], b = lut[data[i + 2]];
          if (hasHue) {
            const tr = r * r1 + g * r2 + b * r3;
            const tg = r * g1 + g * g2 + b * g3;
            const tb = r * b1 + g * b2 + b * b3;
            r = tr; g = tg; b = tb;
          }
          if (hasSat) {
            const gray = 0.2989 * r + 0.587 * g + 0.114 * b;
            r = gray + (r - gray) * saturation;
            g = gray + (g - gray) * saturation;
            b = gray + (b - gray) * saturation;
          }
          data[i] = r; data[i + 1] = g; data[i + 2] = b;
        }
      }

      context.putImageData(imageData, 0, 0);
      
      // 3. 必须调用 callback，告知 OSD 瓦片处理完毕
      callback();
    }, 0);
  };

  /**
   * 应用滤镜配置到 Viewer
   */
  public apply() {
    if (!this.viewer.setFilterOptions) return;
    this.needUpdate = true;

    this.viewer.setFilterOptions({
      filters: { processors: this.combinedProcessor },
      loadMode: this.options.loadMode,
    });

    // 强制触发可见重绘
    this.viewer.world.draw();
  }

  /**
   * 业务层调用的 API，内置防抖
   */
  public setAdjustments(adj: ColorAdjustments) {
    this._adjustments = { ...this._adjustments, ...adj };

    // 性能优化：防抖处理。避免滑动滑块时瞬间产生数百个绘制请求
    if (this.debounceTimer) clearTimeout(this.debounceTimer);

    this.debounceTimer = setTimeout(() => {
      this.apply();
      this.debounceTimer = null;
    }, this.options.debounceMs);
  }

  public get adjustments(): ColorAdjustments {
    return this._adjustments;
  }

  public reset() {
    this._adjustments = { ...this.options.adjustments };
    this.apply();
  }

  public destroy() {
    if (this.debounceTimer) clearTimeout(this.debounceTimer);
    if (this.viewer?.setFilterOptions) {
      this.viewer.setFilterOptions({ filters: { processors: [] } });
    }
    this.viewer = null;
  }
}