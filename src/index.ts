import { MedViewerEngine, type MedEngineOptions } from './core/Engine';
// import { KonvaAnnotator } from './core/KonvaAnnotator';
import { AnnoAnnotator } from './core/AnnoAnnotator';
import { MedToolbar, type ToolbarOptions } from './core/Toolbar';
import { SelectionPlugin, type SelectionOptions } from './core/SelectionPlugin';
import { ColorAdjustPlugin, type ColorAdjustOptions } from './core/ColorAdjustPlugin';
import { MagnificationPlugin, type MagnificationOptions } from './core/Magnification';

// 1. 导出供模块化开发使用 (Vue/React/Vite)
export { MedViewerEngine, type MedEngineOptions, AnnoAnnotator, MedToolbar, type ToolbarOptions, SelectionPlugin, type SelectionOptions, ColorAdjustPlugin, type ColorAdjustOptions, MagnificationPlugin, type MagnificationOptions };

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