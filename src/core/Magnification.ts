import OpenSeadragon from "openseadragon";
export type MagnificationType = "LD" | "OSD";
export type MagnificationPosition =
  | "TOP_LEFT"
  | "TOP_CENTER"
  | "TOP_RIGHT"
  | "BOTTOM_LEFT"
  | "BOTTOM_CENTER"
  | "BOTTOM_RIGHT"
  | "MIDDLE_LEFT"
  | "MIDDLE_RIGHT";

export interface MagnificationOptions {
  type?: MagnificationType;
  position?: MagnificationPosition;
  offsetX?: number;
  offsetY?: number;
  pixelsPerMeter?: number;
}

export class MagnificationPlugin {
  private viewer: OpenSeadragon.Viewer;
  private options: MagnificationOptions;
  private magnificationElement: HTMLDivElement | null = null;
  private magnificationDisplay: HTMLDivElement | null = null;

  constructor(
    viewer: OpenSeadragon.Viewer,
    options: MagnificationOptions = {},
  ) {
    this.viewer = viewer;
    this.options = options;
    

    this.init();
  }

  private init(): void {
    this.injectStyles(); // Inject styles first

    this.magnificationElement = document.createElement("div");
    this.magnificationElement.className = `med-magnification med-magnification--${this.options.position || "MIDDLE_LEFT"}`;

    // Magnification Display
    this.magnificationDisplay = document.createElement("div");
    this.magnificationDisplay.className = "med-magnification-display";
    this.magnificationDisplay.innerHTML = `<span>-</span>`; // Initial empty state
    this.magnificationElement.appendChild(this.magnificationDisplay);

    // Magnification Buttons
    const buttonsContainer = document.createElement("div");
    buttonsContainer.className = "med-magnification-buttons";
    this.magnificationElement.appendChild(buttonsContainer);

    const magnifications = [40, 20, 10, 4]; // Fixed magnification levels
    magnifications.forEach((mag) => {
      const btn = this.createButton(`${mag}X`, () =>
        this.setMagnification(mag),
      );
      buttonsContainer.appendChild(btn);
    });

    const fitBtn = this.createButton("Fit", () => this.fitToScreen());
    buttonsContainer.appendChild(fitBtn);

    this.viewer.element.appendChild(this.magnificationElement);

    // Add event listeners
    this.viewer.addHandler("animation", this.updateMagnificationDisplay);
    // 可选：如果希望在完全静止后也更新一次
    this.viewer.addHandler("animation-finish", this.updateMagnificationDisplay);
    this.viewer.addHandler("open", this.updateMagnificationDisplay);

    // Initial update
    this.updateMagnificationDisplay();
  }

  private createButton(text: string, onClick: () => void): HTMLButtonElement {
    const button = document.createElement("button");
    button.className = "med-magnification-btn";
    button.textContent = text;
    button.onclick = onClick;
    return button;
  }

  // 修改 updateMagnificationDisplay 方法
  private updateMagnificationDisplay = (): void => {
  
    if (this.options.type === "LD") {
              const tiledImage = this.viewer.world.getItemAt(0);
      if (!this.magnificationDisplay || !tiledImage) return;
              const source =
        ((this.viewer as any).source as any);
        const width = (source as any).width; 
         const height = (source as any).height;
        const pixelsPerMeter = this.options.pixelsPerMeter||((this.viewer as any).scalebarInstance?.pixelsPerMeter || 96);
        const currentZoom = this.viewer.viewport.getZoom();
        // const len = Math.max(width, height);
        const conversionFactor = (20 * 0.0011 * pixelsPerMeter) / width;
        const magnification = conversionFactor * currentZoom;
        
        this.magnificationDisplay.innerHTML = `<span>${magnification.toFixed(2)}X</span>`;



    } else {
      const tiledImage = this.viewer.world.getItemAt(0);
      if (!this.magnificationDisplay || !tiledImage) return;

      // 1. 获取当前图像相对于视口的缩放
      // viewportToImageZoom 将视口缩放转换为图像像素缩放
      const currentZoom = this.viewer.viewport.viewportToImageZoom(
        this.viewer.viewport.getZoom(),
      );

      // 2. 假设原始扫描倍率为 40X (通常从 metadata 获取)
      // 如果没有 metadata，我们通常认为 1.0 zoom = 40X (或其他基准)
      const baseMag =
        ((this.viewer as any).source as any)?.max_magnification || 40;
  
      const magnification = currentZoom * baseMag;
      this.magnificationDisplay.innerHTML = `<span>${magnification.toFixed(2)}X</span>`;
    }
  };

  // 修改 setMagnification 方法
  private setMagnification(mag: number): void {
    if (this.options.type === "LD") {

                 const tiledImage = this.viewer.world.getItemAt(0);
      if (!this.magnificationDisplay || !tiledImage) return;
              const source =
        ((this.viewer as any).source as any);
        const width = (source as any).width; 
         const height = (source as any).height;
        const pixelsPerMeter = this.options.pixelsPerMeter||((this.viewer as any).scalebarInstance?.pixelsPerMeter || 96);
        const currentZoom = this.viewer.viewport.getZoom();
        // const len = Math.max(width, height);
        const conversionFactor = (20 * 0.0011 * pixelsPerMeter) / width;
        const targetZoom = mag / conversionFactor;
        this.viewer.viewport.zoomTo(targetZoom, this.viewer.viewport.getCenter(), false);
        this.updateMagnificationDisplay();




    } else {
      const tiledImage = this.viewer.world.getItemAt(0);
      if (!tiledImage) return;

      const baseMag =
        ((this.viewer as any).source as any)?.max_magnification || 40;

      // 计算目标图像缩放比例 (Target Image Zoom)
      // 例如：目标 20X / 基准 40X = 0.5 图像缩放
      const targetImageZoom = mag / baseMag;

      // 将图像缩放转换为视口缩放并应用
      const targetViewportZoom =
        this.viewer.viewport.imageToViewportZoom(targetImageZoom);

      this.viewer.viewport.zoomTo(
        targetViewportZoom,
        this.viewer.viewport.getCenter(),
        false,
      );
    }
  }

  private fitToScreen(): void {
    this.viewer.viewport.fitVertically(true); // Fit to height, true to animate
    this.viewer.viewport.fitHorizontally(true); // Fit to width
    this.viewer.viewport.goHome(); // Go to the home position/zoom
  }

  public refresh(): void {
    this.updateMagnificationDisplay();
  }

  public destroy(): void {
    if (this.magnificationElement) {
      this.magnificationElement.remove();
      this.magnificationElement = null;
    }
    if (this.magnificationDisplay) {
      this.magnificationDisplay = null;
    }
    this.viewer.removeHandler("animation", this.updateMagnificationDisplay);
    this.viewer.removeHandler(
      "animation-finish",
      this.updateMagnificationDisplay,
    );
    this.viewer.removeHandler("open", this.updateMagnificationDisplay);
    (this.viewer as any) = null;
  }

  private injectStyles(): void {
    const STYLE_ID = "med-magnification-styles";
    if (document.getElementById(STYLE_ID)) return;

    const style = document.createElement("style");
    style.id = STYLE_ID;
    style.textContent = `
      .med-magnification {
        position: absolute;
        display: flex;
        flex-direction: column;
        gap: 8px;
        padding: 10px;
        z-index: 100;
        background: rgba(24, 28, 36, 0.85);
        border-radius: 12px;
        backdrop-filter: blur(10px);
        border: 1px solid rgba(255,255,255,0.1);
        box-shadow: 0 8px 32px rgba(0,0,0,0.3);
      }
      .med-magnification--TOP_LEFT { top: calc(18px + ${this.options.offsetY || 0}px); left: calc(18px + ${this.options.offsetX || 0}px); }
      .med-magnification--TOP_CENTER { top: calc(18px + ${this.options.offsetY || 0}px); left: 50%; transform: translateX(-50%) translateX(${this.options.offsetX || 0}px); }
      .med-magnification--TOP_RIGHT { top: calc(18px + ${this.options.offsetY || 0}px); right: calc(18px - ${this.options.offsetX || 0}px); }
      .med-magnification--BOTTOM_LEFT { bottom: calc(18px - ${this.options.offsetY || 0}px); left: calc(18px + ${this.options.offsetX || 0}px); }
      .med-magnification--BOTTOM_CENTER { bottom: calc(18px - ${this.options.offsetY || 0}px); left: 50%; transform: translateX(-50%) translateX(${this.options.offsetX || 0}px); }
      .med-magnification--BOTTOM_RIGHT { bottom: calc(18px - ${this.options.offsetY || 0}px); right: calc(18px - ${this.options.offsetX || 0}px); }
      .med-magnification--MIDDLE_LEFT { top: 50%; left: calc(18px + ${this.options.offsetX || 0}px); transform: translateY(-50%) translateY(${this.options.offsetY || 0}px); }
      .med-magnification--MIDDLE_RIGHT { top: 50%; right: calc(18px - ${this.options.offsetX || 0}px); transform: translateY(-50%) translateY(${this.options.offsetY || 0}px); }

      .med-magnification-display {
        background: rgba(255,255,255,0.08);
        color: #f2f5f8;
        font-size: 14px;
        border: 1px dashed rgba(255,255,255,0.3);
        padding: 8px 0px;
        border-radius: 8px;
        text-align: center;
        font-weight: bold;
        min-width: 60px;
      }
      .med-magnification-buttons {
        display: flex;
        flex-direction: column;
        gap: 6px;
      }
      .med-magnification-btn {
        background: rgba(49, 208, 170, 0.15);
        color: #f2f5f8;
        border: none;
        padding: 8px 16px;
        border-radius: 8px;
        cursor: pointer;
        transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        font-weight: bold;
      }
      .med-magnification-btn:hover {
        background: rgba(49, 208, 170, 0.3);
      }
      .med-magnification-btn:active {
        transform: scale(0.95);
      }
    `;
    document.head.appendChild(style);
  }
}
