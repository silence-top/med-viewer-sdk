import OpenSeadragon from "openseadragon";
import "../plugins/openseadragon-selection.js";
import selectionRest from "@/assets/icons/selection_rest.png";
import selectionGroup from "@/assets/icons/selection_grouphover.png";
import selectionHover from "@/assets/icons/selection_hover.png";
import selectionDown from "@/assets/icons/selection_pressed.png";
import selectionConfirmRest from "@/assets/icons/selection_confirm_rest.png";
import selectionConfirmGroup from "@/assets/icons/selection_confirm_grouphover.png";
import selectionConfirmHover from "@/assets/icons/selection_confirm_hover.png";
import selectionConfirmDown from "@/assets/icons/selection_confirm_pressed.png";
import selectionCancelRest from "@/assets/icons/selection_cancel_rest.png";
import selectionCancelGroup from "@/assets/icons/selection_cancel_grouphover.png";
import selectionCancelHover from "@/assets/icons/selection_cancel_hover.png";
import selectionCancelDown from "@/assets/icons/selection_cancel_pressed.png";

// 最简单的办法：直接向 OSD 的字符串库注入翻译
OpenSeadragon.setString("Tooltips.SelectionToggle", "Toggle Selection"); // 切换选择
OpenSeadragon.setString("Tooltips.SelectionConfirm", "Confirm Selection"); // 确认选择
OpenSeadragon.setString("Tooltips.SelectionCancel", "Cancel Selection"); // 取消选择

export interface SelectionOptions {
  element?: HTMLElement | null;
  showSelectionControl?: boolean;
  toggleButton?: HTMLElement | null;
  showConfirmDenyButtons?: boolean;
  styleConfirmDenyButtons?: boolean;
  returnPixelCoordinates?: boolean;
  keyboardShortcut?: string;
  rect?: OpenSeadragon.Rect | null;
  allowRotation?: boolean;
  startRotated?: boolean;
  startRotatedHeight?: number;
  restrictToImage?: boolean;
  onSelection?: (rect: OpenSeadragon.Rect) => void;
  onSelectionCanceled?: () => void;
  onSelectionChange?: (rect: OpenSeadragon.Rect) => void;
  onSelectionToggled?: (state: { enabled: boolean }) => void;
  prefixUrl?: string | null;
  navImages?: {
    selection: {
      REST: string;
      GROUP: string;
      HOVER: string;
      DOWN: string;
    };
    selectionConfirm: {
      REST: string;
      GROUP: string;
      HOVER: string;
      DOWN: string;
    };
    selectionCancel: {
      REST: string;
      GROUP: string;
      HOVER: string;
      DOWN: string;
    };
  };
  borderStyle?: {
    width: string;
    color: string;
  };
  handleStyle?: {
    top: string;
    left: string;
    width: string;
    height: string;
    margin: string;
    background: string;
    border: string;
  };
  cornersStyle?: {
    width: string;
    height: string;
    background: string;
    border: string;
  };
}

export class SelectionPlugin {
  private viewer: OpenSeadragon.Viewer;
  private selection: any; // OpenSeadragonSelection instance
  private options: SelectionOptions;

  constructor(viewer: OpenSeadragon.Viewer, options: SelectionOptions = {}) {
    this.viewer = viewer;
    this.options = {
      showSelectionControl: true,
      showConfirmDenyButtons: true,
      styleConfirmDenyButtons: true,
      returnPixelCoordinates: true,
      keyboardShortcut: "c",
      allowRotation: true,
      startRotated: false,
      restrictToImage: false,
      prefixUrl: "",
      navImages: {
        selection: {
          REST: selectionRest,
          GROUP: selectionGroup,
          HOVER: selectionHover,
          DOWN: selectionDown,
        },
        selectionConfirm: {
          REST: selectionConfirmRest,
          GROUP: selectionConfirmGroup,
          HOVER: selectionConfirmHover,
          DOWN: selectionConfirmDown,
        },
        selectionCancel: {
          REST: selectionCancelRest,
          GROUP: selectionCancelGroup,
          HOVER: selectionCancelHover,
          DOWN: selectionCancelDown,
        },
      },
      borderStyle: {
        width: "2px", // 稍微加粗，更有质感

        color: "#4CAF50", // 使用经典的“激活蓝”
      },

      handleStyle: {
        top: "50%",
        left: "50%",
        width: "10px", // 增大触点，方便鼠标点击
        height: "10px",
        margin: "-6px 0 0 -6px",
        background: "#4CAF50", // 白色背景
        border: "2px solid #4CAF50", // 蓝色边框
      },
      

      cornersStyle: {
        width: "12px", // 角部手柄稍微比边部大一点
        height: "12px",
        background: "#4CAF50",
        border: "2px solid #4CAF50",
      },

      ...options,
    };

    this.init();
  }

  private init(): void {
    // 等待 viewer 初始化完成
    this.viewer.addOnceHandler("open", () => {
      this.setupSelection();
    });
  }
  private setupSelection(): void {
    try {
      // 检查是否有 selection 插件
      if (typeof (this.viewer as any).selection !== "function") {
        console.warn(
          "OpenSeadragonSelection plugin not found. Please include openseadragonselection.js",
        );
        return;
      }

      // 初始化 selection
      this.selection = (this.viewer as any).selection(this.options);

      console.log(
        "[SelectionPlugin] Selection plugin initialized",
        this.selection,
      );
    } catch (error) {
      console.error(
        "[SelectionPlugin] Failed to initialize selection plugin:",
        error,
      );
    }
  }

  /**
   * 启用选择模式
   */
  enable(): void {
    if (this.selection) {
      this.selection.enable();
    }
  }

  /**
   * 禁用选择模式
   */
  disable(): void {
    if (this.selection) {
      this.selection.disable();
    }
  }

  /**
   * 切换选择模式状态
   */
  toggleState(): void {
    if (this.selection) {
      this.selection.toggleState();
    }
  }

  /**
   * 获取当前选择区域
   */
  getSelection(): OpenSeadragon.Rect | null {
    if (this.selection) {
      return this.selection.getSelection();
    }
    return null;
  }

  /**
   * 设置选择区域
   */
  setSelection(rect: OpenSeadragon.Rect): void {
    if (this.selection) {
      this.selection.setSelection(rect);
    }
  }

  /**
   * 清除选择
   */
  clearSelection(): void {
    if (this.selection) {
      this.selection.clearSelection();
    }
  }

  /**
   * 检查是否启用选择模式
   */
  isEnabled(): boolean {
    if (this.selection) {
      return this.selection.isEnabled();
    }
    return false;
  }

  /**
   * 销毁插件
   */
  destroy(): void {
    if (this.selection) {
      this.selection.destroy();
      this.selection = null;
    }
  }
}
