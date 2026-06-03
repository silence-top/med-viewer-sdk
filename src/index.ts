import { AnnoAnnotator } from './core/AnnoAnnotator'
import { ColorAdjustPlugin, type ColorAdjustOptions } from './core/ColorAdjustPlugin'
import { MedViewerEngine, type MedEngineOptions } from './core/Engine'
import type OpenSeadragonType from 'openseadragon'
import OpenSeadragon from 'openseadragon'
import {
  MagnificationPlugin,
  MagnificationPosition,
  MagnificationType,
  type MagnificationOptions
} from './core/Magnification'
import { ScalebarLocation, ScalebarType, type ScalebarOptions } from './core/Scalebar'
import { SelectionPlugin, type SelectionOptions } from './core/SelectionPlugin'
import { MedToolbar, ToolbarPosition, type ToolbarOptions, type ToolbarButton } from './core/Toolbar'
import MedViewer from './adapters/vue/index'

// 1. 导出供模块化开发使用 (Vue/React/Vite)
export {
  AnnoAnnotator,
  ColorAdjustPlugin,
  MagnificationPlugin,
  MagnificationPosition,
  MagnificationType,
  MedToolbar,
  MedViewer,
  MedViewerEngine,
  ScalebarLocation,
  ScalebarType,
  SelectionPlugin,
  ToolbarPosition,
  OpenSeadragon,
  type OpenSeadragonType,
  type ColorAdjustOptions,
  type MagnificationOptions,
  type MedEngineOptions,
  type ScalebarOptions,
  type SelectionOptions,
  type ToolbarButton,
  type ToolbarOptions
}

// 2. 导出供原生 HTML 全局变量使用 (window.MedViewerSDK)
if (typeof window !== 'undefined') {
  ;(window as any).MedViewerSDK = {
    MedViewerEngine,
    AnnoAnnotator,
    MedToolbar,
    SelectionPlugin,
    ColorAdjustPlugin,
    MagnificationPlugin
  }
}
