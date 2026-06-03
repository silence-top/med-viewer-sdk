# MedViewer SDK

> 面向医学图像分析的高性能查看与标注 SDK，基于 OpenSeadragon 深度缩放引擎，提供插件化架构。

## 特性

- **深度缩放** — 基于 OpenSeadragon 的高性能瓦片渲染，支持超大病理切片无缝浏览
- **插件化架构** — 标注、截图、颜色调整、比例尺、放大镜、工具栏等插件按需启用
- **标注能力** — 集成 Annotorious，支持矩形/多边形/圆形/椭圆/线段/手绘 六种标注工具
- **颜色调整** — WebGL 加速的亮度/对比度/饱和度/伽马/色相/反色/灰度/怀旧 实时调节
- **区域截图** — 框选区域并导出为 Blob，支持旋转和像素坐标
- **工具栏** — 内置深色风格工具栏，支持自定义按钮、下拉面板、激活态
- **Vue 集成** — 提供 Vue 2/3 通用组件 `MedViewer`，自动管理生命周期
- **国际化** — 内置中文/英文，支持动态切换

---

## 安装

```bash
npm install med-viewer-sdk
# 或
pnpm add med-viewer-sdk
```

**Peer Dependencies**（需自行安装）：

```bash
npm install openseadragon vue
```

---

## 快速开始

### 原生 HTML / UMD

```html
<!DOCTYPE html>
<html>
<head>
  <link rel="stylesheet" href="https://unpkg.com/med-viewer-sdk/dist/style.css">
</head>
<body>
  <div id="viewer" style="width:100vw;height:100vh;"></div>

  <script src="https://unpkg.com/openseadragon"></script>
  <script src="https://unpkg.com/med-viewer-sdk"></script>
  <script>
    const engine = new MedViewerSDK.MedViewerEngine({
      osdOptions: {
        id: 'viewer',
        prefixUrl: 'https://openseadragon.github.io/openseadragon/images/',
        tileSources: {
          type: 'image',
          url: './slide.dzi'
        }
      },
      locale: 'zh-CN',
      plugins: {
        toolbar: true,
        annotorious: {
          onCreateAnnotation: (anno) => console.log('新建标注', anno)
        },
        selection: {
          onSelection: (rect, blob) => {
            if (blob) console.log('截图完成', rect, blob)
          }
        },
        colorAdjust: true,
        scalebar: { pixelsPerMeter: 100000 },
        magnification: true
      }
    })
  </script>
</body>
</html>
```

### ES Module

```ts
import { MedViewerEngine, ToolbarPosition } from 'med-viewer-sdk'
import 'med-viewer-sdk/dist/style.css'

const engine = new MedViewerEngine({
  osdOptions: {
    id: 'viewer',
    tileSources: 'https://example.com/slide.dzi'
  },
  plugins: {
    toolbar: { position: ToolbarPosition.BOTTOM_CENTER },
    annotorious: true,
    colorAdjust: true
  }
})
```

### Vue 2 / Vue 3

```vue
<template>
  <MedViewer :options="viewerOptions" @ready="onReady" />
</template>

<script>
import MedViewer from 'med-viewer-sdk/dist/vue'
import 'med-viewer-sdk/dist/style.css'

export default {
  components: { MedViewer },
  data() {
    return {
      viewerOptions: {
        osdOptions: {
          id: 'my-viewer',
          tileSources: '/slide.dzi'
        },
        locale: 'zh-CN',
        plugins: {
          toolbar: true,
          annotorious: true,
          colorAdjust: true,
          selection: true,
          scalebar: { pixelsPerMeter: 100000 },
          magnification: true
        }
      }
    }
  },
  methods: {
    onReady(engine) {
      // engine 即为 MedViewerEngine 实例
      console.log('引擎就绪', engine)
    }
  }
}
</script>
```

> Vue 组件在 `onMounted` 时创建引擎，`onBeforeUnmount` 时自动销毁，无需手动管理。

---

## 引擎配置

### MedEngineOptions

```ts
interface MedEngineOptions {
  osdOptions: OpenSeadragon.Options   // 必填，OpenSeadragon 配置
  locale?: 'zh-CN' | 'en-US'          // 国际化语言，默认 'zh-CN'
  plugins?: {
    annotorious?: boolean | AnnotoriousOptions
    toolbar?: boolean | ToolbarOptions
    colorAdjust?: boolean | ColorAdjustOptions
    selection?: boolean | SelectionOptions
    scalebar?: boolean | ScalebarOptions
    magnification?: boolean | MagnificationOptions
  }
}
```

> 传 `true` 等同于传 `{}`（使用默认配置）。

### Engine 公开属性

创建后可通过 `engine.xxx` 访问各插件实例：

| 属性 | 类型 | 说明 |
|---|---|---|
| `engine.viewer` | `OpenSeadragon.Viewer` | 底层 OSD 查看器 |
| `engine.anno` | `AnnoAnnotator \| null` | 标注插件 |
| `engine.toolbar` | `MedToolbar \| null` | 工具栏插件 |
| `engine.colorAdjust` | `ColorAdjustPlugin \| null` | 颜色调整插件 |
| `engine.selection` | `SelectionPlugin \| null` | 截图插件 |
| `engine.scalebar` | `ScalebarPlugin \| null` | 比例尺插件 |
| `engine.magnification` | `MagnificationPlugin \| null` | 放大镜插件 |

### Engine 事件

```ts
engine.addHandler('ready', () => {
  console.log('图像首次加载完成')
})
```

---

## 插件详解

### 1. 标注插件 (Annotorious)

提供六种标注工具：矩形、多边形、圆形、椭圆、线段、手绘。

#### 配置

```ts
interface AnnotoriousOptions {
  onCreateAnnotation?: (annotation: any) => void
  onUpdateAnnotation?: (annotation: any, previous: any) => void
  onDeleteAnnotation?: (annotation: any) => void
  onCancelAnnotation?: (annotation: any) => void
  locale?: string   // 默认跟随引擎 locale
  options?: {
    formatter?: any  // 标注格式化器
  }
}
```

#### API

```ts
const anno = engine.anno

// 设置工具
anno.setTool('rect', '#ff0000')       // 启用矩形标注，颜色红色
anno.setTool('polygon', '#00ff00')    // 启用多边形标注
anno.setTool(null)                     // 关闭标注模式

// 启用/禁用
anno.setEnabled(true)
anno.setEnabled(false)

// 数据操作
anno.getAnnotations()     // 获取所有标注
anno.setAnnotations([...]) // 加载标注数据
anno.clear()              // 清除所有标注

// 事件监听
anno.on('modeChange', (state) => {
  console.log(state.enabled, state.tool)
})
```

#### 事件

| 事件名 | 参数 | 说明 |
|---|---|---|
| `modeChange` | `{ enabled: boolean, tool: string \| null }` | 标注模式变化 |

---

### 2. 截图插件 (Selection)

框选图像区域并导出为 Blob，支持旋转和像素坐标。

#### 配置

```ts
interface SelectionOptions {
  showSelectionControl?: boolean       // 是否显示控件按钮，默认 true
  showConfirmDenyButtons?: boolean     // 是否显示确认/取消按钮，默认 true
  returnPixelCoordinates?: boolean     // 返回像素坐标，默认 true
  keyboardShortcut?: string            // 快捷键，默认 'c'
  allowRotation?: boolean              // 允许旋转选区，默认 true
  restrictToImage?: boolean            // 限制在图像内，默认 false
  onSelection?: (rect: Rect, blob: Blob \| null) => void  // 确认选区回调
  onSelectionCanceled?: () => void     // 取消选区回调
}
```

#### API

```ts
const sel = engine.selection

sel.enable()          // 启用选择模式
sel.disable()         // 禁用选择模式
sel.toggleState()     // 切换选择模式
sel.isEnabled()       // 查询是否启用
sel.getSelection()    // 获取当前选区
sel.clearSelection()  // 清除选区

// 事件监听
sel.on('selectionEnabled', (enabled: boolean) => {
  console.log('选择模式', enabled ? '开启' : '关闭')
})
```

#### 事件

| 事件名 | 参数 | 说明 |
|---|---|---|
| `selectionEnabled` | `boolean` | 选择模式启用/禁用 |
| `selectionStateToggled` | `boolean` | 选择模式切换 |

---

### 3. 颜色调整插件 (ColorAdjust)

基于 WebGL 着色器的实时图像处理，内置防抖优化。

#### 配置

```ts
interface ColorAdjustOptions {
  adjustments?: ColorAdjustments  // 初始调整值
  debounceMs?: number             // 防抖延迟，默认 60
  loadMode?: 'async' | 'sync'    // 加载模式，默认 'async'
  onAdjustmentsChange?: (adj: ColorAdjustments) => void
}

interface ColorAdjustments {
  brightness?: number   // 亮度 0~2，默认 1
  contrast?: number     // 对比度 0~2，默认 1
  saturation?: number   // 饱和度 0~3，默认 1
  gamma?: number        // 伽马 0.1~3，默认 1
  hue?: number          // 色相 0~360，默认 0
  invert?: boolean      // 反色
  sepia?: boolean       // 怀旧
  greyscale?: boolean   // 灰度
}
```

#### API

```ts
const ca = engine.colorAdjust

ca.setAdjustments({ brightness: 1.5, contrast: 1.2 })
ca.setAdjustments({ greyscale: true })
ca.adjustments   // 获取当前调整值
ca.reset()       // 重置为默认值
```

---

### 4. 比例尺插件 (Scalebar)

在图像上叠加比例尺标注。

#### 配置

```ts
interface ScalebarOptions {
  type?: ScalebarType             // NONE=0, MICROSCOPY=1, MAP=2
  pixelsPerMeter?: number         // 每米像素数
  location?: ScalebarLocation     // NONE=0, TOP_LEFT=1, TOP_RIGHT=2, BOTTOM_RIGHT=3, BOTTOM_LEFT=4
  color?: string
  fontColor?: string
  backgroundColor?: string
  fontSize?: string
  barThickness?: number
  minWidth?: string
}
```

#### 示例

```ts
plugins: {
  scalebar: {
    type: ScalebarType.MICROSCOPY,
    pixelsPerMeter: 100000,
    location: ScalebarLocation.BOTTOM_LEFT
  }
}
```

---

### 5. 放大镜插件 (Magnification)

显示当前放大倍率并提供快捷缩放按钮。

#### 配置

```ts
interface MagnificationOptions {
  type?: MagnificationType       // 'LD' 或 'OSD'，默认 'OSD'
  position?: MagnificationPosition  // 位置，默认 'MIDDLE_LEFT'
  offsetX?: number
  offsetY?: number
  pixelsPerMeter?: number        // LD 模式需要
}
```

#### API

```ts
const mag = engine.magnification
mag.getMagnification()  // 获取当前倍率
mag.show()              // 显示
mag.hide()              // 隐藏
mag.toggle()            // 切换可见性
mag.refresh()           // 刷新显示
```

---

## 工具栏

### 内置工具栏

```ts
plugins: {
  toolbar: true  // 使用默认工具栏（重置、标注、颜色调整、截图）
}
```

### 自定义位置

```ts
import { ToolbarPosition } from 'med-viewer-sdk'

plugins: {
  toolbar: {
    position: ToolbarPosition.BOTTOM_CENTER
  }
}
```

可选位置：`TOP_LEFT` `TOP_CENTER` `TOP_RIGHT` `BOTTOM_LEFT` `BOTTOM_CENTER` `BOTTOM_RIGHT` `MIDDLE_LEFT` `MIDDLE_RIGHT`

### 自定义按钮

通过 `buttons` 配置完全控制工具栏按钮，ID 匹配内置按钮时会合并默认配置：

```ts
plugins: {
  toolbar: {
    position: ToolbarPosition.BOTTOM_RIGHT,
    buttons: [
      {
        id: 'reset',    // 匹配内置 reset 按钮，覆盖默认配置
        icon: myResetIcon,
        label: '回到原点',
        onClick: (engine, hide) => {
          engine.viewer.viewport.goHome()
          hide()
        }
      },
      {
        id: 'anno'      // 匹配内置 anno 按钮，使用默认 dropdownContent
      },
      {
        id: 'colorAdjust' // 匹配内置 colorAdjust 按钮
      },
      {
        id: 'selection'   // 匹配内置 selection 按钮
      },
      // 添加自定义按钮
      {
        id: 'myTool',
        icon: myToolIcon,
        label: '我的工具',
        onClick: (engine, hide) => {
          console.log('自定义工具被点击')
          hide()
        }
      }
    ]
  }
}
```

### 按钮激活态

按钮激活时显示与 hover 相同的高亮效果（绿色背景），支持三种方式：

#### 方式一：命令式 — `setButtonActive`

最灵活，外部代码随时调用：

```ts
// 激活
engine.toolbar.setButtonActive('myTool', true)
// 取消激活
engine.toolbar.setButtonActive('myTool', false)
```

#### 方式二：声明式 — `activeEvent`

在按钮配置中声明事件源，Toolbar 自动绑定监听，事件触发时自动更新激活态：

```ts
{
  id: 'myTool',
  icon: myToolIcon,
  label: '我的工具',
  onClick: (engine, hide) => { /* ... */ },
  activeEvent: {
    emitter: engine.anno,              // 任何有 .on() 方法的对象
    event: 'modeChange',              // 监听的事件名
    mapToActive: (data) => data.enabled  // 将事件数据映射为 boolean
  }
}
```

#### 方式三：下拉框联动 — `activeOnDropdown`

下拉框按钮设为 `true`，下拉框打开自动激活、关闭自动取消：

```ts
{
  id: 'myPanel',
  icon: myPanelIcon,
  label: '我的面板',
  dropdownContent: (engine, hide) => {
    const el = document.createElement('div')
    el.textContent = '面板内容'
    return el
  },
  activeOnDropdown: true
}
```

#### 内置按钮激活机制

| 按钮 | 激活来源 | 机制 |
|---|---|---|
| `anno` | `engine.anno` 的 `modeChange` 事件 | 自动监听 |
| `selection` | `engine.selection` 的 `selectionEnabled` 事件 | 自动监听 |
| `colorAdjust` | 下拉框开闭 | `activeOnDropdown: true` |
| `reset` | 无 | 不激活 |

### 自定义下拉面板

任何按钮都可以配置 `dropdownContent`，返回一个 DOM 元素：

```ts
{
  id: 'filters',
  icon: filterIcon,
  label: '滤镜',
  activeOnDropdown: true,
  dropdownContent: (engine, hide) => {
    const container = document.createElement('div')
    container.className = 'med-toolbar-dropdown-inner'

    const btn = document.createElement('button')
    btn.className = 'med-tool-item'
    btn.textContent = '模糊'
    btn.onclick = () => {
      // 应用滤镜...
      hide() // 关闭下拉面板
    }

    container.appendChild(btn)
    return container
  }
}
```

> `hide()` 用于关闭当前下拉面板，务必在操作完成后调用。

---

## Engine 常用 API

### 图像导航

```ts
engine.viewer.viewport.goHome()                    // 回到初始视图
engine.viewer.viewport.zoomTo(2)                   // 缩放到指定级别
engine.viewer.viewport.panTo(new OpenSeadragon.Point(0.5, 0.5))  // 平移到指定位置
```

### 跳转到指定位置

```ts
// 以指定倍率跳转到图像坐标 (x, y)
await engine.goToPosition({ x: 1000, y: 2000 }, true, 20)
// 参数: target坐标, 是否动画, 目标倍率(mag)
// mag=null 时仅平移，不缩放
```

### AI 标注框

```ts
// 加载 AI 检测框
engine.loadAIMarks([
  {
    x: 100, y: 200, width: 50, height: 50,
    style: { border: '2px solid red' },
    labels: [
      { label: '类型', value: '肿瘤', style: { color: '#333', fontSize: 12 } }
    ]
  }
], true)  // true = 显示标签

// 更新
engine.updateAIMarks(newBoxes, showLabel)

// 清除
engine.clearAIMarks()
```

### 选区框

```ts
engine.loadSelectionBox([
  {
    x: 100, y: 200, width: 50, height: 50,
    style: { border: '2px solid #4CAF50' }
  }
])
```

### 语言切换

```ts
engine.setLocale('en-US')  // 动态切换为英文
engine.setLocale('zh-CN')  // 切换为中文
```

### 销毁

```ts
engine.destroy()  // 销毁所有插件和 viewer
```

---

## 国际化

内置中文 (`zh-CN`) 和英文 (`en-US`) 两种语言：

| 键 | 中文 | 英文 |
|---|---|---|
| toolbar.annoColor | 标注颜色 | Annotation Color |
| toolbar.annoShape | 标注形状 | Annotation Shape |
| toolbar.rect | 矩形 | Rectangle |
| toolbar.polygon | 多边形 | Polygon |
| toolbar.circle | 圆形 | Circle |
| toolbar.ellipse | 椭圆 | Ellipse |
| toolbar.line | 线段 | Line |
| toolbar.freehand | 手绘 | Freehand |
| toolbar.reset | 重置 | Reset |
| toolbar.screenshot | 截图 | Screenshot |
| toolbar.brightness | 亮度 | Brightness |
| toolbar.contrast | 对比度 | Contrast |
| toolbar.saturation | 饱和度 | Saturation |
| toolbar.gamma | 伽马 | Gamma |
| toolbar.hue | 色相 | Hue |
| toolbar.invert | 反色 | Invert |
| toolbar.sepia | 怀旧 | Sepia |
| toolbar.greyscale | 灰度 | Greyscale |

---

## ToolbarButton 接口

```ts
interface ToolbarButton {
  id: string                                    // 按钮唯一标识
  label?: string                                // 提示文字
  icon?: string                                 // 图标 URL
  dropdownContent?: (engine, hide) => HTMLElement  // 下拉面板内容
  onClick?: (engine, hide) => void              // 点击回调
  activeEvent?: {                               // 声明式激活状态
    emitter: any                                // 事件发射器（需有 .on()）
    event: string                               // 事件名
    mapToActive: (data: any) => boolean         // 事件数据映射
  }
  activeOnDropdown?: boolean                    // 下拉框开闭时自动激活
}
```

---

## 构建与开发

```bash
# 安装依赖
npm install

# 构建（生成 dist/ 目录）
npm run build

# 输出格式
# dist/med-viewer-sdk.umd.js   — UMD 格式（<script> 标签引入）
# dist/med-viewer-sdk.mjs      — ESM 格式（import 引入）
# dist/med-viewer-sdk.d.ts     — TypeScript 类型声明
# dist/style.css                — 样式文件
```

---

## 浏览器兼容性

| 浏览器 | 版本 |
|---|---|
| Chrome | 80+ |
| Firefox | 80+ |
| Safari | 14+ |
| Edge | 80+ |

> 需要 WebGL 支持以使用颜色调整功能。

---

## 依赖说明

| 依赖 | 用途 |
|---|---|
| [openseadragon](https://openseadragon.github.io/) | 深度缩放图像渲染引擎 |
| [annotorious-openseadragon-ld](https://www.npmjs.com/package/annotorious-openseadragon-ld) | Annotorious 标注库（定制版） |
| [openseadragon-filtering](https://www.npmjs.com/package/openseadragon-filtering) | OSD 瓦片滤镜处理器 |
| [svg-path-properties](https://www.npmjs.com/package/svg-path-properties) | SVG 路径计算（标注测量） |

---

## License

MIT
