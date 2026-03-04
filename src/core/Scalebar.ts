import OpenSeadragon from "openseadragon";
import "../plugins/openseadragon-scalebar.js";

export enum ScalebarType {
  NONE = 0,
  MICROSCOPY = 1,
  MAP = 2,
}

export enum ScalebarLocation {
  NONE = 0,
  TOP_LEFT = 1,
  TOP_RIGHT = 2,
  BOTTOM_RIGHT = 3,
  BOTTOM_LEFT = 4,
}

export interface ScalebarOptions {
  type?: ScalebarType;
  pixelsPerMeter?: number;
  xOffset?: number;
  yOffset?: number;
  stayInsideImage?: boolean;
  color?: string;
  fontColor?: string;
  backgroundColor?: string;
  fontSize?: string;
  fontFamily?: string;
  barThickness?: number;
  minWidth?: string;
  location?: ScalebarLocation;
  referenceItemIdx?: number;
  sizeAndTextRenderer?: (
    ppm: number,
    minSize: number,
  ) => { size: number; text: string };
}

export class ScalebarPlugin {
  private viewer: OpenSeadragon.Viewer;
  private options: ScalebarOptions;
  private scalebar: any; // OpenSeadragonScalebar instance
  constructor(viewer: OpenSeadragon.Viewer, options: ScalebarOptions = {}) {
    this.viewer = viewer;
    //type传入字符串时，转换为枚举类型
    if (typeof options.type === "string") {
      options.type = ScalebarType[options.type as keyof typeof ScalebarType];
    }
    //location传入字符串时，转换为枚举类型
    if (typeof options.location === "string") {
      options.location =
        ScalebarLocation[options.location as keyof typeof ScalebarLocation];
    }
    this.options = {
      type: ScalebarType.MAP,
      pixelsPerMeter: 1,
      xOffset: 10,
      yOffset: 10,
      stayInsideImage: true,
      color: "rgb(0, 0, 0)",
      fontColor: "rgb(0, 0, 0)",
      fontSize: "14px",
      fontFamily: "sans-serif",
      barThickness: 1.5,
      minWidth: "75px",
      location: ScalebarLocation.NONE,
      referenceItemIdx: 0,
      ...options,
    };
    console.log(this.options);

    this.init();
  }

  private init(): void {
    // Cast viewer to any to access the scalebar method added by the plugin
    (this.viewer as any).scalebar(this.options);
  }

  public destroy(): void {
    // Cleanup if necessary
    if (this.scalebar && typeof this.scalebar.destroy === "function") {
      this.scalebar.destroy();
    }
    this.scalebar = null;
  }
}
