import { MedViewerEngine } from './core/Engine';
// import { KonvaAnnotator } from './core/KonvaAnnotator';
import { AnnoAnnotator } from './core/AnnoAnnotator';
import { MedToolbar } from './core/Toolbar';
import { SelectionPlugin } from './core/SelectionPlugin';
import { ColorAdjustPlugin } from './core/ColorAdjustPlugin';
import { MagnificationPlugin } from './core/Magnification';

// 1. 导出供模块化开发使用 (Vue/React/Vite)
export { MedViewerEngine, AnnoAnnotator, MedToolbar, SelectionPlugin, ColorAdjustPlugin, MagnificationPlugin };

// 2. 导出供原生 HTML 全局变量使用 (window.MedViewerSDK)
if (typeof window !== 'undefined') {
  (window as any).MedViewerSDK = {
    MedViewerEngine,
    AnnoAnnotator,
    MedToolbar,
    SelectionPlugin,
    ColorAdjustPlugin,
    MagnificationPlugin
  };
}