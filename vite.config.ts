import { defineConfig } from 'vite';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export default defineConfig({
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'MedViewerSDK', // 原生 HTML 中使用 window.MedViewerSDK
      fileName: 'med-viewer-sdk',
      formats: ['umd', 'es'] // 提供 UMD 格式以支持原生 JS 引入
    },
    // 注意：这里没有 external，所有依赖都会打包进去
    rollupOptions: {
      external: ['openseadragon', 'vue'], // 将 peerDependencies 外部化
      output: {
        // 在 UMD 模式下，这些全局依赖不再需要由外部提供
        globals: {
          openseadragon: 'OpenSeadragon',
          vue: 'Vue'
        }
      }
    },
    cssCodeSplit: false, // 强制 CSS 不拆分
    minify: 'terser' // 深度压缩，减小打包后的体积
  }
});