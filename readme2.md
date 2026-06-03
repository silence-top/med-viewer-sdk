# med-viewer-sdk

`med-viewer-sdk` 是一个基于 OpenSeadragon 和 Vue.js 构建的医学图像查看器 SDK，旨在为医学图像的显示、标注和处理提供一套全面的解决方案。该 SDK 支持高分辨率图像的无缝缩放和导航，并集成了强大的标注工具和图像过滤功能。

## 主要特性

- **高分辨率图像查看**：基于 [OpenSeadragon](https://openseadragon.github.io/)，支持平滑缩放、平移和导航大型医学图像。
- **Vue.js 集成**：提供 Vue.js 适配器，方便在 Vue 应用程序中集成和使用。
- **图像标注**：利用 [Annotorious OpenSeadragon](https://annotorious.github.io/) 提供丰富的图像标注功能，支持多种标注类型。
- **图像过滤与调整**：通过 `openseadragon-filtering` 模块，提供图像颜色调整等功能。
- **多语言支持**：支持国际化，方便在全球范围内使用。
- **模块化工具**：包括颜色调整、放大镜、选择工具和可定制的工具栏等核心模块。

## 安装

首先，确保你的项目已安装 `OpenSeadragon` 和 `Vue.js` (2.7.x 或 3.x)。

```bash
npm install openseadragon vue
# 或者
yarn add openseadragon vue
```

然后安装 `med-viewer-sdk`：

```bash
npm install med-viewer-sdk
# 或者
yarn add med-viewer-sdk
```

## 使用

### 在 Vue.js 项目中使用

`med-viewer-sdk` 提供了 Vue.js 适配器，你可以轻松地将其集成到你的 Vue 组件中。

```vue
<template>
  <div id="viewer-container" style="width: 800px; height: 600px;"></div>
</template>

<script lang="ts">
import { defineComponent, onMounted, onUnmounted } from 'vue'
import OpenSeadragon from 'openseadragon'
import MedViewer from 'med-viewer-sdk/dist/med-viewer-sdk.mjs' // 或根据你的构建输出路径调整

export default defineComponent({
  name: 'MedicalImageViewer',
  setup() {
    let viewer: OpenSeadragon.Viewer | null = null
    let medViewerInstance: MedViewer | null = null

    onMounted(() => {
      viewer = OpenSeadragon({
        id: 'viewer-container',
        prefixUrl: 'https://openseadragon.github.io/openseadragon/images/', // 替换为你的 OpenSeadragon 图片路径
        tileSources: {
          type: 'image',
          url: 'https://openseadragon.github.io/example-images/duomo/duomo.jpg' // 替换为你的图像源
        }
      })

      if (viewer) {
        medViewerInstance = new MedViewer(viewer, {
          // 配置选项，例如：
          // enableAnnotations: true,
          // enableColorAdjustment: true,
          // language: 'zh-CN'
        })

        // 示例：添加一个颜色调整插件
        // medViewerInstance.addPlugin(new ColorAdjustPlugin());
        // 示例：添加一个标注工具
        // medViewerInstance.addPlugin(new AnnoAnnotator());
      }
    })

    onUnmounted(() => {
      if (viewer) {
        viewer.destroy()
      }
    })

    return {}
  }
})
</script>

<style scoped>
#viewer-container {
  border: 1px solid #ccc;
}
</style>
```

### 配置选项 (MedViewerOptions)

`MedViewer` 构造函数接受一个配置对象，你可以根据需要进行定制。具体可用的选项请参考 SDK 的类型定义。

## 开发

### 项目结构

- `src/adapters/vue/`: Vue.js 适配器。
- `src/assets/icons/`: UI 工具栏图标。
- `src/core/`: 核心功能模块，包括图像引擎、标注器、插件等。
- `src/i18n/`: 国际化文件。
- `src/types/`: TypeScript 类型定义。

### 构建

项目使用 Vite 进行构建。

```bash
npm install # 安装依赖
npm run build # 构建项目
```

构建完成后，输出文件将位于 `dist/` 目录下。

## 贡献

欢迎社区贡献！如果你有任何功能建议、Bug 报告或想要贡献代码，请随时通过 Issue 或 Pull Request 提交。

## 许可证

[待定，根据项目实际许可证填写]
