export type Locale = 'zh-CN' | 'en-US';

export interface I18nDict {
  [key: string]: string | I18nDict;
}

const dicts: Record<Locale, I18nDict> = {
  'zh-CN': {
    toolbar: {
      annoColor: '标注颜色',
      annoShape: '标注形状',
      rect: '矩形',
      polygon: '多边形',
      circle: '圆形',
      ellipse: '椭圆',
      line: '线段',
      freehand: '手绘',
      reset: '重置',
      annoSettings: '标注设置',
      colorAdjust: '颜色调整',
      screenshot: '截图设置',
      brightness: '亮度',
        contrast: '对比度',
        saturation: '饱和度',
        gamma: '伽马',
        hue: '色相',
        invert: '反色',
        sepia: '怀旧',
        greyscale: '灰度',

    },
    selection: {
      toggle: '切换选择',
      confirm: '确认选择',
      cancel: '取消选择',
    },
  },
  'en-US': {
    toolbar: {
      annoColor: 'Annotation Color',
      annoShape: 'Annotation Shape',
      rect: 'Rectangle',
      polygon: 'Polygon',
      circle: 'Circle',
      ellipse: 'Ellipse',
      line: 'Line',
      freehand: 'Freehand',
      reset: 'Reset',
      annoSettings: 'Annotation Settings',
      colorAdjust: 'Color Adjust',
      screenshot: 'Screenshot Settings',
        brightness: 'Brightness',
        contrast: 'Contrast',
        saturation: 'Saturation',
        gamma: 'Gamma',
        hue: 'Hue',
        invert: 'Invert',
        sepia: 'Sepia',
        greyscale: 'Greyscale',
    },
    selection: {
      toggle: 'Toggle Selection',
      confirm: 'Confirm Selection',
      cancel: 'Cancel Selection',
    },
  },
};

let currentLocale: Locale = 'zh-CN';

export function setLocale(locale: Locale) {
  currentLocale = locale;
}

export function t(path: string): string {
  const keys = path.split('.');
  let value: any = dicts[currentLocale];
  for (const k of keys) {
    value = value?.[k];
    if (!value) return path;
  }
  return typeof value === 'string' ? value : path;
}
