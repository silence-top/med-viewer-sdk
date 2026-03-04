import type { MedViewerEngine } from "./Engine";
import buttonAnno from "@/assets/icons/tool_anno.png";
import buttonSelection from "@/assets/icons/tool_selection.png";
import buttonColorAdjust from "@/assets/icons/tool_color.png";
import buttonReset from "@/assets/icons/tool_reset.png";
import { t } from "./i18n";

export type ToolbarPosition =
  | "TOP_LEFT"
  | "TOP_CENTER"
  | "TOP_RIGHT"
  | "BOTTOM_LEFT"
  | "BOTTOM_CENTER"
  | "BOTTOM_RIGHT"
  | "MIDDLE_LEFT"
  | "MIDDLE_RIGHT";

export interface ToolbarButton {
  id: string;
  label?: string;
  icon?: string;
  dropdownContent?: (engine: MedViewerEngine, hide: () => void) => HTMLElement;
  onClick?: (engine: MedViewerEngine, hide: () => void) => void;
}

export interface ToolbarOptions {
  position?: ToolbarPosition;

  buttons?: ToolbarButton[];
}

/**
 * 预设：标注工具下拉内容生成器
 */
const createAnnoDropdownContent = (
  engine: MedViewerEngine,
  hide: () => void,
): HTMLElement => {
  const container = document.createElement("div");
  container.className = "med-toolbar-dropdown-inner";

  let selectedColor = "#ff0000";
  const colorSection = document.createElement("div");
  colorSection.innerHTML = `<div class="med-toolbar-section-title">${t('toolbar.annoColor')}</div>`;
  const colorGrid = document.createElement("div");
  colorGrid.className = "med-color-grid";

  const colors = [
    "#ff0000",
    "#00ff00",
    "#0000ff",
    "#ffff00",
    "#00ffff",
    "#ffffff",
  ];
  colors.forEach((c) => {
    const dot = document.createElement("div");
    dot.className = "med-color-item";
    dot.style.backgroundColor = c;
    dot.onclick = () => {
      selectedColor = c;
      colorGrid
        .querySelectorAll(".med-color-item")
        .forEach((el) => el.classList.remove("active"));
      dot.classList.add("active");
    };
    colorGrid.appendChild(dot);
  });
  colorSection.appendChild(colorGrid);
  container.appendChild(colorSection);

  const toolSection = document.createElement("div");
  toolSection.innerHTML = `<div class="med-toolbar-section-title">${t('toolbar.annoShape')}</div>`;
  const toolGrid = document.createElement("div");
  toolGrid.className = "med-tool-grid";

  const tools = [
    { id: "rect", label: t("toolbar.rect") },
    { id: "polygon", label: t("toolbar.polygon") },
    { id: "circle", label: t("toolbar.circle") },
    { id: "ellipse", label: t("toolbar.ellipse") },
    { id: "line", label: t("toolbar.line") },
    { id: "freehand", label: t("toolbar.freehand") },
  ];

  tools.forEach((tItem) => {
    const btn = document.createElement("button");
    btn.className = "med-tool-item";
    btn.textContent = tItem.label;
    btn.onclick = () => {
      if (engine.anno) engine.anno.setTool(tItem.id as any, selectedColor);
      hide();
    };
    toolGrid.appendChild(btn);
  });
  toolSection.appendChild(toolGrid);
  container.appendChild(toolSection);

  return container;
};

/**
 * 默认按钮配置
 */

/**
 * 预设：颜色调整工具下拉内容生成器
 */
// 防抖函数：只在用户停止拖动 200ms 后执行一次
const debounce = (fn: Function, delay: number) => {
  let timer: number | null = null;
  return (...args: any[]) => {
    if (timer) clearTimeout(timer);
    timer = window.setTimeout(() => fn(...args), delay);
  };
};

const createColorAdjustDropdownContent = (
  engine: MedViewerEngine,
  hide: () => void,
): HTMLElement => {
  const container = document.createElement("div");
  container.className = "med-toolbar-dropdown-inner med-color-adjust-dropdown";

  // Helper to create a slider
  const createSlider = (
    labelText: string,
    id: string,
    min: number,
    max: number,
    step: number,
    initialValue: number,
    onChange: (value: number) => void,
  ) => {
    const section = document.createElement("div");
    section.className = "med-toolbar-section";
    section.innerHTML = `<div class="med-toolbar-section-title">${labelText}</div>`;

    const input = document.createElement("input");
    input.type = "range";
    input.id = id;
    input.min = String(min);
    input.max = String(max);
    input.step = String(step);
    input.value = String(initialValue);

    const valueDisplay = document.createElement("span");
    valueDisplay.className = "med-slider-value";
    valueDisplay.textContent = String(initialValue);

    // 使用防抖包装 onChange
    const debouncedOnChange = debounce(onChange, 200);

    input.oninput = (e) => {
      const value = parseFloat((e.target as HTMLInputElement).value);
      valueDisplay.textContent = value.toFixed(2);
      debouncedOnChange(value);
    };

    section.appendChild(input);
    section.appendChild(valueDisplay);
    return section;
  };

  // Helper to create a checkbox
  const createCheckbox = (
    labelText: string,
    id: string,
    initialValue: boolean,
    onChange: (value: boolean) => void,
  ) => {
    const section = document.createElement("div");
    section.className = "med-toolbar-section med-checkbox-section";

    const label = document.createElement("label");
    label.htmlFor = id;
    label.textContent = labelText;

    const input = document.createElement("input");
    input.type = "checkbox";
    input.id = id;
    input.checked = initialValue;
    input.onchange = (e) => onChange((e.target as HTMLInputElement).checked);

    section.appendChild(label);
    section.appendChild(input);
    return section;
  };

  // Get current adjustments or defaults

  const currentAdjustments = engine.colorAdjust?.adjustments || {
    brightness: 1.0,
    contrast: 1.0,
    saturation: 1.0,
    gamma: 1.0,
    hue: 0,
    invert: false,
    sepia: false,
    greyscale: false,
  };

  // Brightness
  container.appendChild(
    createSlider(
      t("toolbar.brightness"),
      "brightness-slider",
      0.0,
      2.0,
      0.01,
      currentAdjustments.brightness || 1.0,
      (val) => engine.colorAdjust?.setAdjustments({ brightness: val }),
    ),
  );

  // Contrast
  container.appendChild(
    createSlider(
      t("toolbar.contrast"),
      "contrast-slider",
      0.0,
      2.0,
      0.01,
      currentAdjustments.contrast || 1.0,
      (val) => engine.colorAdjust?.setAdjustments({ contrast: val }),
    ),
  );

  // Saturation
  container.appendChild(
    createSlider(
      t("toolbar.saturation"),
      "saturation-slider",
      0.0,
      3.0,
      0.01,
      currentAdjustments.saturation || 1.0,
      (val) => {
        engine.colorAdjust?.setAdjustments({
          saturation: val,
          sepia: false,
          greyscale: false,
        });
        (
          container.querySelector("#sepia-checkbox") as HTMLInputElement
        ).checked = false;
        (
          container.querySelector("#greyscale-checkbox") as HTMLInputElement
        ).checked = false;
      },
    ),
  );

  // Hue
  container.appendChild(
    createSlider(
      t("toolbar.hue"),
      "hue-slider",
      0,
      360,
      1,
      currentAdjustments.hue || 0,
      (val) => {
        engine.colorAdjust?.setAdjustments({
          hue: val,
          sepia: false,
          greyscale: false,
        });
        (
          container.querySelector("#sepia-checkbox") as HTMLInputElement
        ).checked = false;
        (
          container.querySelector("#greyscale-checkbox") as HTMLInputElement
        ).checked = false;
      },
    ),
  );

  // Gamma
  container.appendChild(
    createSlider(
      t("toolbar.gamma"),
      "gamma-slider",
      0.1,
      3.0,
      0.01,
      currentAdjustments.gamma || 1.0,
      (val) => engine.colorAdjust?.setAdjustments({ gamma: val }),
    ),
  );

  // Invert
  container.appendChild(
    createCheckbox(
      t("toolbar.invert"),
      "invert-checkbox",
      currentAdjustments.invert || false,
      (val) => engine.colorAdjust?.setAdjustments({ invert: val }),
    ),
  );

  // Sepia
  container.appendChild(
    createCheckbox(
      t("toolbar.sepia"),
      "sepia-checkbox",
      currentAdjustments.sepia || false,
      (val) => {
        if (val) {
          engine.colorAdjust?.setAdjustments({
            sepia: true,
            greyscale: false,
            saturation: 1.0,
            hue: 0,
          });
          (
            container.querySelector("#saturation-slider") as HTMLInputElement
          ).value = "1.0";
          (container.querySelector("#hue-slider") as HTMLInputElement).value =
            "0";
          (
            container.querySelector("#greyscale-checkbox") as HTMLInputElement
          ).checked = false;
        } else {
          engine.colorAdjust?.setAdjustments({ sepia: false });
        }
      },
    ),
  );

  // Greyscale
  container.appendChild(
    createCheckbox(
      t("toolbar.greyscale"),
      "greyscale-checkbox",
      currentAdjustments.greyscale || false,
      (val) => {
        if (val) {
          engine.colorAdjust?.setAdjustments({
            greyscale: true,
            sepia: false,
            saturation: 1.0,
            hue: 0,
          });
          (
            container.querySelector("#saturation-slider") as HTMLInputElement
          ).value = "1.0";
          (container.querySelector("#hue-slider") as HTMLInputElement).value =
            "0";
          (
            container.querySelector("#sepia-checkbox") as HTMLInputElement
          ).checked = false;
        } else {
          engine.colorAdjust?.setAdjustments({ greyscale: false });
        }
      },
    ),
  );

  // Reset Button
  const resetButton = document.createElement("button");
  resetButton.className = "med-main-btn med-reset-btn";
  resetButton.textContent = t("toolbar.reset");
  resetButton.onclick = () => {
    engine.colorAdjust?.reset();

    (container.querySelector("#brightness-slider") as HTMLInputElement).value =
      "1.0";
    (container.querySelector("#contrast-slider") as HTMLInputElement).value =
      "1.0";
    (container.querySelector("#saturation-slider") as HTMLInputElement).value =
      "1.0";
    (container.querySelector("#hue-slider") as HTMLInputElement).value = "0";
    (container.querySelector("#gamma-slider") as HTMLInputElement).value =
      "1.0";

    (container.querySelector("#invert-checkbox") as HTMLInputElement).checked =
      false;
    (container.querySelector("#sepia-checkbox") as HTMLInputElement).checked =
      false;
    (
      container.querySelector("#greyscale-checkbox") as HTMLInputElement
    ).checked = false;

    container.querySelectorAll(".med-slider-value").forEach((el) => {
      const inputId = (el.previousElementSibling as HTMLInputElement).id;
      if (
        inputId === "brightness-slider" ||
        inputId === "contrast-slider" ||
        inputId === "saturation-slider" ||
        inputId === "gamma-slider"
      ) {
        el.textContent = "1.00";
      } else if (inputId === "hue-slider") {
        el.textContent = "0";
      }
    });
  };
  container.appendChild(resetButton);

  return container;
};

const DEFAULT_BUTTONS: ToolbarButton[] = [
  {
    id: "reset",
    icon: buttonReset,
    label: t("toolbar.reset"),
    onClick: (engine: MedViewerEngine, hide: () => void) => {
      engine.viewer.viewport.goHome();
      hide();
    },
  },
  {
    id: "anno",
    icon: buttonAnno,
    dropdownContent: createAnnoDropdownContent,
    label: t("toolbar.annoSettings"),
  },
  {
    id: "colorAdjust",
    icon: buttonColorAdjust,
    dropdownContent: createColorAdjustDropdownContent,
    label: t("toolbar.colorAdjust"),
  },
  {
    id: "selection",
    icon: buttonSelection,
    label: t("toolbar.screenshot"),
    onClick: (engine: MedViewerEngine, hide: () => void) => {
      engine.selection?.toggleState();
      hide();
    },
  },
];

const STYLE_ID = "med-toolbar-styles";

/**
 * MedToolbar 主类
 */
export class MedToolbar {
  private engine: MedViewerEngine;
  private options: ToolbarOptions;
  private element: HTMLDivElement;
  private dropdownElement: HTMLDivElement | null = null;
  private outsideClickHandler: ((e: MouseEvent) => void) | null = null;

  constructor(engine: MedViewerEngine, options: ToolbarOptions = {}) {
    this.engine = engine;
    this.options = options;
    this.element = document.createElement("div");
    this.element.className = this.getClassName();

    this.injectStyles();
    this.render();
    this.mount();
  }

  public destroy(): void {
    this.closeDropdown(true); // 销毁时强制立即移除
    this.element.remove();
    (this.engine as any) = null;
  }

  private render(): void {
    this.element.innerHTML = "";
    let buttonsToRender: ToolbarButton[];

    if (this.options.buttons && this.options.buttons.length > 0) {
      // User has provided custom buttons, use only these, merging with defaults if IDs match
      const defaultButtonMap = new Map(
        DEFAULT_BUTTONS.map((btn) => [btn.id, btn]),
      );
      buttonsToRender = this.options.buttons.map((userBtn) => {
        const defaultBtn = defaultButtonMap.get(userBtn.id);
        return defaultBtn ? { ...defaultBtn, ...userBtn } : userBtn;
      });
    } else {
      // No custom buttons provided, use all default buttons
      buttonsToRender = DEFAULT_BUTTONS;
    }

    buttonsToRender.forEach((btnConfig) => {
      const wrapper = document.createElement("div");
      wrapper.className = "med-toolbar-item-wrapper";

      const btn = document.createElement("button");
      btn.className = "med-main-btn";

      if (btnConfig.icon) {
        const img = document.createElement("img");
        img.src = btnConfig.icon;
        img.alt = btnConfig.label || btnConfig.id;
        btn.appendChild(img);
      } else if (btnConfig.label) {
        btn.textContent = btnConfig.label;
      }

      btn.onclick = (e) => {
        e.stopPropagation();
        // 如果当前点击的按钮对应的下拉框已打开，则关闭它
        if (
          this.dropdownElement &&
          this.dropdownElement.parentElement === wrapper
        ) {
          this.closeDropdown();
          return;
        }

        // 先尝试关闭现有下拉框
        this.closeDropdown();

        if (btnConfig.onClick) {
          btnConfig.onClick(this.engine, () => this.closeDropdown());
        } else if (btnConfig.dropdownContent) {
          this.showDropdown(wrapper, btnConfig);
        }
      };

      wrapper.appendChild(btn);
      this.element.appendChild(wrapper);
    });
  }

  private showDropdown(parent: HTMLElement, config: ToolbarButton) {
    this.dropdownElement = document.createElement("div");
    this.dropdownElement.className = "med-toolbar-dropdown";

    const content = config.dropdownContent!(this.engine, () =>
      this.closeDropdown(),
    );
    this.dropdownElement.appendChild(content);
    parent.appendChild(this.dropdownElement);

    // 1. 边界检查调整位置
    this.adjustDropdownPosition();

    // 2. 触发动画 (下一帧添加 show 类)
    requestAnimationFrame(() => {
      this.dropdownElement?.classList.add("show");
    });

    // 3. 点击外部关闭
    this.outsideClickHandler = (e: MouseEvent) => {
      if (
        this.dropdownElement &&
        !this.dropdownElement.contains(e.target as Node)
      ) {
        this.closeDropdown();
      }
    };
    setTimeout(
      () => document.addEventListener("click", this.outsideClickHandler!),
      0,
    );
  }

  private adjustDropdownPosition() {
    if (!this.dropdownElement) return;

    const rect = this.dropdownElement.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const padding = 12;

    // 检查右边缘
    if (rect.right > viewportWidth) {
      this.dropdownElement.style.left = "auto";
      this.dropdownElement.style.right = "0";
      this.dropdownElement.style.transform = "translateX(0) translateY(10px)";
      this.dropdownElement.setAttribute("data-adjusted", "true");
    }
    // 检查左边缘
    else if (rect.left < 0) {
      this.dropdownElement.style.left = "0";
      this.dropdownElement.style.transform = "translateX(0) translateY(10px)";
      this.dropdownElement.setAttribute("data-adjusted", "true");
    }

    // 针对顶部位置调整动画起始点
    const isTop = (this.options.position || "").includes("TOP");
    if (isTop) {
      const currentTransform = this.dropdownElement.style.transform;
      this.dropdownElement.style.transform = currentTransform.replace(
        "translateY(10px)",
        "translateY(-10px)",
      );
    }
  }

  private closeDropdown(immediate = false) {
    if (this.dropdownElement) {
      const el = this.dropdownElement;
      this.dropdownElement = null; // 立即清除引用防止重复触发

      if (immediate) {
        el.remove();
      } else {
        el.classList.remove("show");
        // 等待 CSS 过渡动画结束后移除元素
        setTimeout(() => el.remove(), 200);
      }
    }
    if (this.outsideClickHandler) {
      document.removeEventListener("click", this.outsideClickHandler);
      this.outsideClickHandler = null;
    }
  }

  private mount(): void {
    const container = this.engine.viewer?.element;
    if (container) container.appendChild(this.element);
  }

  private getClassName(): string {
    const pos = this.options.position || "BOTTOM_CENTER";
    return `med-toolbar med-toolbar--${pos}`;
  }

  private injectStyles(): void {
    if (document.getElementById(STYLE_ID)) return;
    const style = document.createElement("style");
    style.id = STYLE_ID;
    style.textContent = `
      .med-toolbar {
        position: absolute;
        display: flex;
        gap: 12px;
        padding: 10px;
        z-index: 100;
        background: rgba(24, 28, 36, 0.85);
        border-radius: 12px;
        backdrop-filter: blur(10px);
        border: 1px solid rgba(255,255,255,0.1);
        box-shadow: 0 8px 32px rgba(0,0,0,0.3);
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
        background: rgba(255,255,255,0.08);
        color: #f2f5f8;
        border: none;
        padding: 8px 16px;
        border-radius: 8px;
        cursor: pointer;
        transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        display: flex;
        align-items: center;
        justify-content: center;
      }
      .med-main-btn:hover { background: rgba(49, 208, 170, 0.2); }
      .med-main-btn:active { transform: scale(0.9); }
      .med-main-btn img { width: 24px; height: 24px; }

      /* 下拉框基础及进场动画 */
      .med-toolbar-dropdown {
        position: absolute;
        bottom: calc(100% + 12px); 
        left: 50%;
        background: #181c24;
        border: 1px solid rgba(255,255,255,0.1);
        border-radius: 12px;
        padding: 16px;
        box-shadow: 0 10px 40px rgba(0,0,0,0.5);
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

      /* 内容样式 */
      .med-toolbar-section-title { font-size: 11px; color: rgba(255,255,255,0.4); margin-bottom: 10px; letter-spacing: 1px; }
      .med-color-grid { display: flex; gap: 10px; margin-bottom: 20px; }
      .med-color-item { width: 24px; height: 24px; border-radius: 50%; cursor: pointer; border: 2px solid transparent; transition: 0.2s; }
      .med-color-item.active { border-color: #fff; transform: scale(1.15); box-shadow: 0 0 10px rgba(255,255,255,0.3); }
      .med-tool-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; }
      .med-tool-item { background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.05); color: #fff; padding: 8px 4px; border-radius: 6px; cursor: pointer; font-size: 12px; transition: 0.2s; }
      .med-tool-item:hover { background: rgba(49, 208, 170, 0.2); border-color: rgba(49, 208, 170, 0.4); }

      /* 颜色调整下拉框样式 */
      .med-color-adjust-dropdown {
        min-width: 280px;
      }

      .med-toolbar-section {
        margin-bottom: 15px;
        display: flex;
        flex-direction: column;
      }

      .med-toolbar-section-title {
        margin-bottom: 8px;
        font-size: 13px;
        color: #f2f5f8;
      }

      .med-toolbar-section input[type="range"] {
        width: 100%;
        -webkit-appearance: none;
        height: 4px;
        background: rgba(255,255,255,0.2);
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
        background: #31d0aa;
        cursor: pointer;
        border: 2px solid #181c24;
        transition: background 0.15s ease-in-out;
      }

      .med-toolbar-section input[type="range"]::-webkit-slider-thumb:hover {
        background: #25a084;
      }

      .med-slider-value {
        font-size: 12px;
        color: rgba(255,255,255,0.7);
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
        color: #f2f5f8;
        cursor: pointer;
      }

      .med-checkbox-section input[type="checkbox"] {
        -webkit-appearance: none;
        -moz-appearance: none;
        appearance: none;
        width: 18px;
        height: 18px;
        border: 1px solid rgba(255,255,255,0.4);
        border-radius: 4px;
        background-color: transparent;
        cursor: pointer;
        position: relative;
        transition: all 0.2s ease;
      }

      .med-checkbox-section input[type="checkbox"]:checked {
        background-color: #31d0aa;
        border-color: #31d0aa;
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
        background: rgba(200, 50, 50, 0.1);
        color: #ff6b6b;
        border: 1px solid rgba(255, 100, 100, 0.2);
      }
      .med-reset-btn:hover {
        background: rgba(200, 50, 50, 0.3);
      }
    `;
    document.head.appendChild(style);
  }
}
