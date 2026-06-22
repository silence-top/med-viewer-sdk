# API 参考

## 目录

- [MedViewerEngine](#medviewerengine)
- [插件实例访问](#插件实例访问)
- [AI 标注 / 选区叠加层](#ai-标注--选区叠加层)
- [事件系统](#事件系统)
- [导航与视口控制](#导航与视口控制)
- [国际化](#国际化)
- [主题](#主题)
- [工具类型导出](#工具类型导出)

---

## MedViewerEngine

主引擎类，负责初始化 OpenSeadragon 并管理所有插件生命周期。

### 构造函数

```ts
new MedViewerEngine(options: MedEngineOptions)
```

#### MedEngineOptions

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `osdOptions` | `OpenSeadragon.Options` | ✅ | OSD 原生配置，`id` 或 `element` 必须指定 |
| `locale` | `'zh-CN' \| 'en-US'` | ❌ | 界面语言，默认 `'zh-CN'` |
| `theme` | `ThemeConfig` | ❌ | 主题配置，默认 `'default'`（暗色） |
| `plugins` | `PluginsConfig` | ❌ | 各插件开关及配置 |

#### PluginsConfig

```ts
plugins?: {
  toolbar?:      boolean | ToolbarOptions
  annotorious?:  boolean | AnnotoriousOptions
  colorAdjust?:  boolean | ColorAdjustOptions
  selection?:    boolean | SelectionOptions
  scalebar?:     boolean | ScalebarOptions
  magnification?: boolean | MagnificationOptions
}
```

---

## 插件实例访问

```ts
engine.viewer       // OpenSeadragon.Viewer 原生实例
engine.anno         // AnnoAnnotator | null
engine.toolbar      // MedToolbar | null
engine.colorAdjust  // ColorAdjustPlugin | null
engine.selection    // SelectionPlugin | null
engine.scalebar     // ScalebarPlugin | null
engine.magnification // MagnificationPlugin | null
engine.themeManager // ThemeManager | null
```

---

## AI 标注 / 选区叠加层

### loadAIMarks

在图像坐标系上绘制 AI 检测框（DOM Overlay）。

```ts
engine.loadAIMarks(aiBoxes: AiBoxRect[], showLabel?: boolean): void
```

#### AiBoxRect

```ts
interface AiBoxRect {
  x: number        // 图像坐标 x（像素）
  y: number        // 图像坐标 y（像素）
  width: number    // 宽度（像素）
  height: number   // 高度（像素）
  style: {
    border: string   // CSS border，如 '2px solid #f00'
    fontSize: number
    [key: string]: any
  }
  labels: AiBoxRectLabel[]
}

interface AiBoxRectLabel {
  label: string   // 标签名
  value: string   // 标签值
  style?: { color: string; fontSize: number; [key: string]: any }
}
```

### updateAIMarks

等同于 `loadAIMarks`，清除旧标注后重新绘制。

```ts
engine.updateAIMarks(aiBoxes: AiBoxRect[], showLabel?: boolean): void
```

### clearAIMarks

清除所有 AI 检测框。

```ts
engine.clearAIMarks(): void
```

### loadSelectionBox

在图像坐标系上绘制只读选区框（通常用于展示已选区域）。

```ts
engine.loadSelectionBox(selections: SelectionBox[]): void
```

#### SelectionBox

```ts
interface SelectionBox {
  x: number
  y: number
  width: number
  height: number
  style: { border: string; fontSize: number; [key: string]: any }
}
```

---

## 事件系统

引擎内置轻量事件总线，目前暴露以下事件：

| 事件名 | 触发时机 | payload |
|--------|---------|---------|
| `ready` | 第一张瓦片加载完成（OSD `open` 后） | 无 |

```ts
engine.addHandler('ready', () => {
  console.log('图像已加载完成')
})

// 只触发一次
engine.addOnceHandler('ready', () => { ... })

// 移除监听
engine.removeHandler('ready', handler)
```

---

## 导航与视口控制

### goToPosition

跳转到图像上的指定坐标点（图像像素坐标系），可指定目标倍率。

```ts
engine.goToPosition(
  target: { x: number; y: number },
  animate?: boolean,   // 默认 true
  mag?: number | null  // 目标倍率，null 则仅平移不缩放
): Promise<void>
```

> 倍率计算模式取决于 `magnification.type`：
> - `'LD'`：基于 `pixelsPerMeter` 换算
> - `'OSD'`（默认）：基于图像源的 `max_magnification` 字段

---

## 国际化

```ts
// 动态切换语言
engine.setLocale('en-US')
engine.setLocale('zh-CN')

// 获取当前语言
engine.getLocale() // 'zh-CN' | 'en-US'
```

支持的语言键见 [插件功能 - 国际化词典](./04-插件功能.md#国际化词典)。

---

## 主题

```ts
// 切换为预设主题
engine.setTheme('light')
engine.setTheme('dark')
engine.setTheme('default')

// 切换为自定义主题（覆盖默认主题的部分颜色）
engine.setTheme({ accentColor: '#7c3aed', iconFilter: 'none' })

// 完整自定义主题（含命名）
engine.setTheme({ name: 'my-theme', colors: { ...fullThemeColors } })

// 获取当前主题名称
engine.getThemeName() // 'default' | 'light' | 'dark' | 'custom' | 自定义名称

// 获取当前主题所有颜色值
engine.getThemeColors() // ThemeColors | null
```

详见 [主题系统](./03-主题系统.md)。

---

## 销毁

```ts
engine.destroy()
```

依次销毁全部插件及 OSD Viewer，并清除所有注入的 CSS 变量。

---

## 工具类型导出

```ts
import type {
  MedEngineOptions,
  ToolbarOptions,
  ToolbarButton,
  ColorAdjustOptions,
  SelectionOptions,
  ScalebarOptions,
  MagnificationOptions,
  ThemeConfig,
  ThemeColors,
  ThemeDefinition,
  PresetThemeName
} from 'med-viewer-sdk'

import {
  ToolbarPosition,
  ScalebarType,
  ScalebarLocation,
  MagnificationPosition,
  MagnificationType,
  PRESET_THEMES,
  cssVar,
  ThemeManager
} from 'med-viewer-sdk'
```

### ToolbarPosition 枚举

`TOP_LEFT` / `TOP_CENTER` / `TOP_RIGHT` / `BOTTOM_LEFT` / `BOTTOM_CENTER` / `BOTTOM_RIGHT` / `MIDDLE_LEFT` / `MIDDLE_RIGHT`

### ScalebarType 枚举

| 值 | 含义 |
|----|------|
| `0 / NONE` | 不显示 |
| `1 / MICROSCOPY` | 显微镜模式（µm/mm） |
| `2 / MAP` | 地图模式 |

### ScalebarLocation 枚举

`NONE(0)` / `TOP_LEFT(1)` / `TOP_RIGHT(2)` / `BOTTOM_RIGHT(3)` / `BOTTOM_LEFT(4)`

### MagnificationPosition 枚举

同 `ToolbarPosition`，标识倍率显示控件的位置。

### MagnificationType 枚举

| 值 | 适用场景 |
|----|---------|
| `LD` | 联影/LD 私有协议病理切片，基于 `pixelsPerMeter` 换算倍率 |
| `OSD` | 标准 DZI/IIIF，读取图像源 `max_magnification` 字段 |
