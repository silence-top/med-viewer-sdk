# MedViewer SDK

MedViewer SDK 是一个强大且灵活的医学图像查看 SDK，它基于 OpenSeadragon 构建，旨在为医学图像分析和注释提供丰富的交互功能。

## 功能特性

- **高性能图像查看：** 利用 OpenSeadragon 实现高分辨率医学图像的无缝查看，支持深度缩放和平移功能。
- **可定制工具栏：**
    - 动态且可配置的工具栏，可集成各种工具和插件。
    - 支持文本和图标按钮。
    - 按钮可以触发设置下拉菜单或直接执行操作。
    - 用户定义的按钮配置可以覆盖默认设置（图标、标签、功能）。
    - 响应式布局，侧边工具栏（MIDDLE_LEFT, MIDDLE_RIGHT）支持垂直方向。
- **选择插件：**
    - 提供交互式选择功能（例如，绘制矩形）。
    - 可配置的选择外观和行为。
    - 与工具栏集成，方便访问和控制。
- **比例尺插件：**
    - 在查看器上显示动态比例尺。
    - 支持不同类型的比例尺（例如，显微镜、地图）。
    - 可配置位置、颜色、字体和大小。
    - 自动初始化并与查看器的缩放级别同步。
- **标注工具：**
    - **Annotorious 集成 (AnnoAnnotator)：**
        - 集成 Annotorious 库以提供高级标注功能。
        - 支持各种标注工具（例如，徒手绘制、多边形）。
        - 提供启用/禁用、设置工具、获取/设置标注和清除标注的方法。
        - 动态注入自定义标注样式。
    - **Konva.js 集成 (KonvaAnnotator)：**
        - 利用 Konva.js 实现自定义绘图覆盖。
        - 当前支持绘制矩形和可能的箭头（注释掉的同步逻辑表明可能计划了更复杂的交互）。
        - 允许拖动形状。
        - 无论缩放级别如何，都保持恒定的描边宽度 (`strokeScaleEnabled: false`)。
        - 提供启用/禁用、设置工具、获取/设置标注和清除标注的方法。
- **颜色调整插件：**
    - 启用对图像属性（如亮度、对比度、饱和度、伽马、锐化、边缘增强、伪彩色和反色）的实时调整。
    - **利用 WebGL 着色器：** 直接在 GPU 上实现调整以提高性能。
    - 尝试强制 OpenSeadragon 使用其 WebGL 渲染器以获得最佳功能。
    - 提供自定义 WebGL 着色器用于高级颜色操作。
- **基于插件的架构：**
    - SDK 采用模块化、基于插件的架构设计，以 `MedViewerEngine` 作为核心协调器。
    - 易于扩展以添加新功能。
    - 管理各种插件的生命周期（初始化、销毁）。

## 安装

```bash
# 假设使用 npm 或 yarn 进行包管理
npm install openseadragon # 根据需要添加其他依赖
# 或
yarn add openseadragon
```

然后，在您的项目中引入 SDK：

```typescript
import { MedViewerEngine } from 'med-viewer-sdk'; // 根据需要调整路径
// 如果有任何 CSS，请导入
```

## 用法

### 基本初始化

```typescript
import { MedViewerEngine } from './core/Engine'; // 以本地路径为例
import OpenSeadragon from 'openseadragon';

const viewerElement = document.getElementById('med-viewer-container');

if (viewerElement) {
  const engine = new MedViewerEngine({
    element: viewerElement,
    viewerOptions: {
      // OpenSeadragon 选项
      id: 'openseadragon-viewer',
      prefixUrl: 'https://openseadragon.github.io/openseadragon/images/',
      tileSources: {
        type: 'image',
        url: 'https://openseadragon.github.io/example-images/duomo/duomo.dzi'
      },
      // ... 其他 OSD 选项
    },
    plugins: {
      toolbar: true, // 启用默认工具栏
      selection: true, // 启用选择插件
      scalebar: { // 启用比例尺插件并带自定义选项
        type: 'MICROSCOPY',
        location: 'BOTTOM_LEFT',
        color: 'rgb(255, 255, 255)',
        fontColor: 'rgb(255, 255, 255)',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
      },
      anno: true, // 启用 Annotorious
      konva: true, // 启用 Konva.js 绘图
      colorAdjust: { // 启用颜色调整并带初始设置
        initial: {
          brightness: 1.2,
          contrast: 0.8,
          invert: true,
        }
      }
    }
  });

  // 访问插件
  if (engine.toolbar) {
    console.log('工具栏已激活');
  }
  if (engine.selection) {
    engine.selection.enable();
    engine.selection.setSelectionMode('RECTANGLE');
  }
  if (engine.anno) {
    engine.anno.setEnabled(true);
    engine.anno.setTool('rect');
  }
  if (engine.konva) {
    engine.konva.setEnabled(true);
    engine.konva.setTool('rect');
  }
  if (engine.colorAdjust) {
    engine.colorAdjust.setAdjustments({ brightness: 1.5 });
  }

  // 不再需要时进行清理
  // engine.destroy();
}
```

### 自定义工具栏

您可以通过将 `ToolbarButton` 配置数组传递给 `toolbar` 插件选项来定制工具栏。可以通过匹配其 `id` 来覆盖现有默认按钮。

```typescript
import { MedViewerEngine, ToolbarButton } from './core/Engine'; // 以本地路径为例
import myCustomIcon from './assets/my-icon.png';

const customToolbarButtons: ToolbarButton[] = [
  {
    id: 'anno', // 覆盖默认的 'anno' 按钮
    label: '我的标注',
    icon: myCustomIcon, // 使用自定义图标
    // 保留原始的 dropdownContent 或定义新的
  },
  {
    id: 'customTool', // 添加新的自定义按钮
    label: '新工具',
    onClick: (engine) => {
      alert('自定义工具已点击！');
      // 在此处实现自定义逻辑
    }
  }
];

const engine = new MedViewerEngine({
  // ...
  plugins: {
    toolbar: {
      buttons: customToolbarButtons,
      // ... 其他工具栏选项
    },
    // ... 其他插件
  }
});
```

### 在 Vue 项目中使用

`med-viewer-sdk` 可以在 Vue 2 或 Vue 3 项目中使用。由于 `vue` 是 `med-viewer-sdk` 的一个 `peerDependency`，您需要确保您的项目中已经安装了 `vue`。

#### 1. 安装依赖

在您的 Vue 项目中安装 `med-viewer-sdk` 及其 `peerDependencies`。

```bash
npm install med-viewer-sdk openseadragon vue # 根据您的 Vue 版本安装相应的 Vue 包
# 或者使用 yarn
yarn add med-viewer-sdk openseadragon vue
```

#### 2. 创建 Vue 组件

创建一个 Vue 组件来封装 `MedViewerEngine` 的实例化和生命周期管理。

**Vue 3 (Composition API):**

```vue
<template>
  <div ref="viewerContainer" class="med-viewer-container"></div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue';
import { MedViewerEngine } from 'med-viewer-sdk';
import OpenSeadragon from 'openseadragon'; // 如果需要 OpenSeadragon 类型

const viewerContainer = ref<HTMLElement | null>(null);
let medViewer: MedViewerEngine | null = null;

onMounted(() => {
  if (viewerContainer.value) {
    medViewer = new MedViewerEngine({
      element: viewerContainer.value,
      viewerOptions: {
        id: 'openseadragon-viewer',
        prefixUrl: 'https://openseadragon.github.io/openseadragon/images/',
        tileSources: {
          type: 'image',
          url: 'https://openseadragon.github.io/example-images/duomo/duomo.dzi'
        },
      },
      plugins: {
        toolbar: true,
        selection: true,
        scalebar: {
          type: 'MICROSCOPY',
          location: 'BOTTOM_LEFT',
          color: 'rgb(255, 255, 255)',
          fontColor: 'rgb(255, 255, 255)',
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
        },
        anno: true,
        konva: true,
        colorAdjust: {
          initial: {
            brightness: 1.2,
            contrast: 0.8,
            invert: true,
          }
        }
      }
    });

    // 可以访问插件并进行操作
    if (medViewer.selection) {
      medViewer.selection.enable();
      medViewer.selection.setSelectionMode('RECTANGLE');
    }
  }
});

onBeforeUnmount(() => {
  if (medViewer) {
    medViewer.destroy();
    medViewer = null;
  }
});
</script>

<style scoped>
.med-viewer-container {
  width: 100%;
  height: 80vh; /* 根据需要调整高度 */
  background-color: #000;
}
</style>
```

**Vue 2 (Options API):**

```vue
<template>
  <div ref="viewerContainer" class="med-viewer-container"></div>
</template>

<script lang="ts">
import Vue from 'vue';
import { MedViewerEngine } from 'med-viewer-sdk';
import OpenSeadragon from 'openseadragon'; // 如果需要 OpenSeadragon 类型

export default Vue.extend({
  data() {
    return {
      medViewer: null as MedViewerEngine | null,
    };
  },
  mounted() {
    if (this.$refs.viewerContainer) {
      this.medViewer = new MedViewerEngine({
        element: this.$refs.viewerContainer as HTMLElement,
        viewerOptions: {
          id: 'openseadragon-viewer',
          prefixUrl: 'https://openseadragon.github.io/openseadragon/images/',
          tileSources: {
            type: 'image',
            url: 'https://openseadragon.github.io/example-images/duomo/duomo.dzi'
          },
        },
        plugins: {
          toolbar: true,
          selection: true,
          scalebar: {
            type: 'MICROSCOPY',
            location: 'BOTTOM_LEFT',
            color: 'rgb(255, 255, 255)',
            fontColor: 'rgb(255, 255, 255)',
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
          },
          anno: true,
          konva: true,
          colorAdjust: {
            initial: {
              brightness: 1.2,
              contrast: 0.8,
              invert: true,
            }
          }
        }
      });

      if (this.medViewer.selection) {
        this.medViewer.selection.enable();
        this.medViewer.selection.setSelectionMode('RECTANGLE');
      }
    }
  },
  beforeDestroy() { // Vue 2 使用 beforeDestroy
    if (this.medViewer) {
      this.medViewer.destroy();
      this.medViewer = null;
    }
  },
});
</script>

<style scoped>
.med-viewer-container {
  width: 100%;
  height: 80vh; /* 根据需要调整高度 */
  background-color: #000;
}
</style>
```

#### 3. 注意事项

-   **CSS 导入**：如果 `med-viewer-sdk` 包含任何 CSS 样式，您可能需要在您的 Vue 项目的入口文件或相关组件中导入它。例如：`import 'med-viewer-sdk/dist/style.css';`
-   **全局样式**：确保 `med-viewer-sdk` 的容器元素有足够的宽高，以便查看器能够正确渲染。
-   **响应式数据**：`MedViewerEngine` 实例本身不是响应式的。如果您需要其内部状态在 Vue 中响应式，您可能需要手动将其属性或方法包装在 Vue 的响应式系统中。


## 引用方式

构建完成后，您可以通过以下方式在其他项目中使用 `med-viewer-sdk`：

### 1. 本地开发（使用 `npm link`）

如果您在本地同时开发 `med-viewer-sdk` 和另一个项目，`npm link` 是一个便捷的选择。

-   **在 `med-viewer-sdk` 项目目录中执行：**
    ```bash
    npm link
    ```
-   **在您的其他项目目录中执行：**
    ```bash
    npm link med-viewer-sdk
    ```
    现在，您就可以像从 npm 安装一样导入 `med-viewer-sdk` 了。

### 2. 从本地路径安装

您可以直接从文件系统的本地路径安装打包后的 SDK。

-   **在您的其他项目的 `package.json` 中添加：**
    ```json
    "dependencies": {
      "med-viewer-sdk": "file:../path/to/your/med-viewer-sdk", // 根据实际路径调整
      // ... 其他依赖
    }
    ```
-   **然后在您的其他项目目录中运行 `npm install`。**

### 3. 发布到包注册表 (例如 npm)

如果这是一个可重用的库，您通常会将其发布到包注册表。

-   **确保您的 `package.json` 已准备好发布：**
    -   `name`、`version`、`main`、`module`、`types`、`files` 字段应正确配置。
    -   `files` 数组应包含 `dist` 目录和任何其他必要文件。
-   **登录 npm (如果尚未登录)：**
    ```bash
    npm login
    ```
-   **发布：**
    ```bash
    npm publish --access public // 如果是私有包，则无需 --access public
    ```

### 4. 在您的代码中导入

安装/链接后，您可以在应用程序中导入它：

-   **对于 ES 模块 (推荐用于现代 JS/TS 项目)：**
    ```typescript
    import { MedViewerEngine } from 'med-viewer-sdk';
    // 或者如果您在脚本标签中需要全局名称：
    // const MedViewerSDK = window.MedViewerSDK;
    ```
-   **对于 CommonJS (如果使用 Node.js 或旧版打包工具)：**
    ```javascript
    const { MedViewerEngine } = require('med-viewer-sdk');
    ```
-   **直接在 HTML 中 (UMD 构建)：**
    ```html
    <script src="path/to/your/node_modules/med-viewer-sdk/dist/med-viewer-sdk.umd.js"></script>
    <script>
      const MedViewerSDK = window.MedViewerSDK;
      // 使用 MedViewerSDK.MedViewerEngine 等
    </script>
    ```

## API 参考

（此处将提供 `MedViewerEngine`、`Toolbar`、`SelectionPlugin`、`ScalebarPlugin`、`AnnoAnnotator`、`KonvaAnnotator`、`ColorAdjustPlugin` 及其选项的详细 API 参考。这通常从 JSDoc 或单独的文档生成。）

## 开发

（有关设置开发环境、运行测试、构建等的说明。）

## 贡献

（贡献项目的指南。）

## 许可证

（许可证信息。）
