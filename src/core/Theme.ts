/*
 * @Author       : silence_top && 326221982@qq.com
 * @Date         : 2026-06-03
 * @Description  : 主题管理器 - 支持 default / light / dark 预设主题及自定义主题
 */

/**
 * 主题颜色定义接口
 * 所有可被主题化的颜色变量
 */
export interface ThemeColors {
  /** 工具栏/面板背景色 */
  panelBackground: string
  /** 工具栏/面板背景色（无透明度版，用于下拉框等） */
  panelBackgroundSolid: string
  /** 工具栏/面板边框色 */
  panelBorder: string
  /** 工具栏/面板阴影 */
  panelShadow: string
  /** 主文字色 */
  textPrimary: string
  /** 次要文字色 */
  textSecondary: string
  /** 淡化文字色（如小标题） */
  textMuted: string

  /** 主强调色（激活态、滑块、复选框） */
  accentColor: string
  /** 主强调色 - 悬停态 */
  accentHover: string
  /** 主强调色 - 透明低背景 */
  accentBgLow: string
  /** 主强调色 - 透明高背景（悬停/激活） */
  accentBgHigh: string

  /** 按钮默认背景 */
  btnBackground: string
  /** 按钮悬停背景 */
  btnHoverBackground: string

  /** 危险色（重置按钮等） */
  dangerColor: string
  /** 危险色 - 低背景 */
  dangerBgLow: string
  /** 危险色 - 高背景（悬停） */
  dangerBgHigh: string

  /** 选区边框/手柄颜色 */
  selectionColor: string
  /** 选区手柄边框色 */
  selectionHandleBorder: string

  /** 标注手柄内部填充色 */
  annoHandleInnerFill: string
  /** 标注手柄内部描边色 */
  annoHandleInnerStroke: string
  /** 标注手柄外部填充色 */
  annoHandleOuterFill: string
  /** 标注手柄外部描边色 */
  annoHandleOuterStroke: string

  /** 标注图形内边框色（选中/绘制态描边） */
  annoInnerStroke: string
  /** 标注图形外边框色（阴影/轮廓描边） */
  annoOuterStroke: string
  /** 标注图形内边框悬停色 */
  annoInnerHoverStroke: string
  /** 标注手柄悬停填充色 */
  annoHandleHoverFill: string

  /** 标注编辑器背景色 */
  annoEditorBg: string
  /** 标注编辑器文字色 */
  annoEditorText: string
  /** 标注编辑器边框色 */
  annoEditorBorder: string
  /** 标注编辑器输入框背景色 */
  annoEditorInputBg: string
  /** 标注编辑器按钮背景色 */
  annoEditorBtnBg: string
  /** 标注编辑器按钮悬停背景色 */
  annoEditorBtnHoverBg: string
  /** 标注编辑器按钮文字色 */
  annoEditorBtnColor: string

  /** 滑块轨道背景色 */
  sliderTrackBg: string
  /** 滑块拇指色 */
  sliderThumbColor: string
  /** 滑块拇指悬停色 */
  sliderThumbHover: string

  /** 复选框边框色 */
  checkboxBorder: string
  /** 复选框选中背景色 */
  checkboxCheckedBg: string

  /** 工具网格项背景色 */
  toolItemBg: string
  /** 工具网格项边框色 */
  toolItemBorder: string
  /** 工具网格项悬停背景色 */
  toolItemHoverBg: string
  /** 工具网格项悬停边框色 */
  toolItemHoverBorder: string

  /** 颜色选择项激活边框色 */
  colorItemActiveBorder: string
  /** 颜色选择项激活阴影 */
  colorItemActiveShadow: string

  /** Tooltip 背景色 */
  tooltipBg: string
  /** Tooltip 文字色 */
  tooltipColor: string

  /** 图标 CSS filter（用于 PNG 图标适配主题背景）
   *  default/dark: 'none'（图标本身亮色，暗底可见）
   *  light: 'invert(1)'（将亮色图标反转为暗色，白底可见）
   */
  iconFilter: string
}

/**
 * 完整主题定义
 */
export interface ThemeDefinition {
  name: string
  colors: ThemeColors
}

/**
 * 主题配置类型（用户传入的）
 * - 字符串：预设主题名
 * - 对象：自定义主题
 */
export type ThemeConfig = PresetThemeName | ThemeDefinition | Partial<ThemeColors>

/**
 * 预设主题名称
 */
export type PresetThemeName = 'default' | 'light' | 'dark'

// ─── 预设主题定义 ────────────────────────────────────────────────

const DEFAULT_COLORS: ThemeColors = {
  // 面板
  panelBackground: 'rgba(24, 28, 36, 0.85)',
  panelBackgroundSolid: '#181c24',
  panelBorder: 'rgba(255, 255, 255, 0.1)',
  panelShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
  // 文字
  textPrimary: '#f2f5f8',
  textSecondary: 'rgba(255, 255, 255, 0.7)',
  textMuted: 'rgba(255, 255, 255, 0.4)',
  // 强调色
  accentColor: '#31d0aa',
  accentHover: '#25a084',
  accentBgLow: 'rgba(49, 208, 170, 0.15)',
  accentBgHigh: 'rgba(49, 208, 170, 0.2)',
  // 按钮
  btnBackground: 'rgba(255, 255, 255, 0.08)',
  btnHoverBackground: 'rgba(49, 208, 170, 0.2)',
  // 危险
  dangerColor: '#ff6b6b',
  dangerBgLow: 'rgba(200, 50, 50, 0.1)',
  dangerBgHigh: 'rgba(200, 50, 50, 0.3)',
  // 选区
  selectionColor: '#4CAF50',
  selectionHandleBorder: '#4CAF50',
  // 标注手柄
  annoHandleInnerFill: '#FF9800',
  annoHandleInnerStroke: '#FFEB3B',
  annoHandleOuterFill: '#fff',
  annoHandleOuterStroke: '#000',
  // 标注图形
  annoInnerStroke: '#31d0aa',
  annoOuterStroke: 'rgba(0, 0, 0, 0.35)',
  annoInnerHoverStroke: '#31d0aa',
  annoHandleHoverFill: '#FFEB3B',
  // 标注编辑器
  annoEditorBg: '#181c24',
  annoEditorText: '#f2f5f8',
  annoEditorBorder: 'rgba(255,255,255,0.1)',
  annoEditorInputBg: 'rgba(255,255,255,0.06)',
  annoEditorBtnBg: '#31d0aa',
  annoEditorBtnHoverBg: '#25a084',
  annoEditorBtnColor: '#fff',
  // 滑块
  sliderTrackBg: 'rgba(255, 255, 255, 0.2)',
  sliderThumbColor: '#31d0aa',
  sliderThumbHover: '#25a084',
  // 复选框
  checkboxBorder: 'rgba(255, 255, 255, 0.4)',
  checkboxCheckedBg: '#31d0aa',
  // 工具网格
  toolItemBg: 'rgba(255, 255, 255, 0.05)',
  toolItemBorder: 'rgba(255, 255, 255, 0.05)',
  toolItemHoverBg: 'rgba(49, 208, 170, 0.2)',
  toolItemHoverBorder: 'rgba(49, 208, 170, 0.4)',
  // 颜色选择
  colorItemActiveBorder: '#fff',
  colorItemActiveShadow: '0 0 10px rgba(255, 255, 255, 0.3)',
  // Tooltip
  tooltipBg: 'rgba(0, 0, 0, 0.75)',
  tooltipColor: '#fff',
  // 图标 filter
  iconFilter: 'none'
}

const LIGHT_COLORS: ThemeColors = {
  // 面板
  panelBackground: 'rgba(255, 255, 255, 0.92)',
  panelBackgroundSolid: '#ffffff',
  panelBorder: 'rgba(0, 0, 0, 0.08)',
  panelShadow: '0 4px 24px rgba(0, 0, 0, 0.1)',
  // 文字
  textPrimary: '#1a1a2e',
  textSecondary: 'rgba(0, 0, 0, 0.55)',
  textMuted: 'rgba(0, 0, 0, 0.35)',
  // 强调色
  accentColor: '#1890ff',
  accentHover: '#096dd9',
  accentBgLow: 'rgba(24, 144, 255, 0.08)',
  accentBgHigh: 'rgba(24, 144, 255, 0.15)',
  // 按钮
  btnBackground: 'rgba(0, 0, 0, 0.04)',
  btnHoverBackground: 'rgba(24, 144, 255, 0.1)',
  // 危险
  dangerColor: '#ff4d4f',
  dangerBgLow: 'rgba(255, 77, 79, 0.06)',
  dangerBgHigh: 'rgba(255, 77, 79, 0.15)',
  // 选区
  selectionColor: '#1890ff',
  selectionHandleBorder: '#1890ff',
  // 标注手柄
  annoHandleInnerFill: '#FF9800',
  annoHandleInnerStroke: '#E65100',
  annoHandleOuterFill: '#fff',
  annoHandleOuterStroke: '#333',
  // 标注图形
  annoInnerStroke: '#1890ff',
  annoOuterStroke: 'rgba(0, 0, 0, 0.2)',
  annoInnerHoverStroke: '#096dd9',
  annoHandleHoverFill: '#E65100',
  // 标注编辑器
  annoEditorBg: '#ffffff',
  annoEditorText: '#1a1a2e',
  annoEditorBorder: 'rgba(0, 0, 0, 0.08)',
  annoEditorInputBg: '#f5f5f5',
  annoEditorBtnBg: '#1890ff',
  annoEditorBtnHoverBg: '#096dd9',
  annoEditorBtnColor: '#fff',
  // 滑块
  sliderTrackBg: 'rgba(0, 0, 0, 0.1)',
  sliderThumbColor: '#1890ff',
  sliderThumbHover: '#096dd9',
  // 复选框
  checkboxBorder: 'rgba(0, 0, 0, 0.25)',
  checkboxCheckedBg: '#1890ff',
  // 工具网格
  toolItemBg: 'rgba(0, 0, 0, 0.03)',
  toolItemBorder: 'rgba(0, 0, 0, 0.06)',
  toolItemHoverBg: 'rgba(24, 144, 255, 0.08)',
  toolItemHoverBorder: 'rgba(24, 144, 255, 0.3)',
  // 颜色选择
  colorItemActiveBorder: '#1890ff',
  colorItemActiveShadow: '0 0 8px rgba(24, 144, 255, 0.3)',
  // Tooltip
  tooltipBg: 'rgba(0, 0, 0, 0.75)',
  tooltipColor: '#fff',
  // 图标 filter
  iconFilter: 'invert(1)'
}

const DARK_COLORS: ThemeColors = {
  // 面板
  panelBackground: 'rgba(10, 10, 14, 0.92)',
  panelBackgroundSolid: '#0a0a0e',
  panelBorder: 'rgba(255, 255, 255, 0.06)',
  panelShadow: '0 8px 32px rgba(0, 0, 0, 0.6)',
  // 文字
  textPrimary: '#e8eaed',
  textSecondary: 'rgba(255, 255, 255, 0.6)',
  textMuted: 'rgba(255, 255, 255, 0.3)',
  // 强调色
  accentColor: '#bb86fc',
  accentHover: '#9b59b6',
  accentBgLow: 'rgba(187, 134, 252, 0.1)',
  accentBgHigh: 'rgba(187, 134, 252, 0.2)',
  // 按钮
  btnBackground: 'rgba(255, 255, 255, 0.06)',
  btnHoverBackground: 'rgba(187, 134, 252, 0.15)',
  // 危险
  dangerColor: '#cf6679',
  dangerBgLow: 'rgba(207, 102, 121, 0.1)',
  dangerBgHigh: 'rgba(207, 102, 121, 0.25)',
  // 选区
  selectionColor: '#bb86fc',
  selectionHandleBorder: '#bb86fc',
  // 标注手柄
  annoHandleInnerFill: '#FF9800',
  annoHandleInnerStroke: '#FFEB3B',
  annoHandleOuterFill: '#222',
  annoHandleOuterStroke: '#888',
  // 标注图形
  annoInnerStroke: '#bb86fc',
  annoOuterStroke: 'rgba(0, 0, 0, 0.5)',
  annoInnerHoverStroke: '#9b59b6',
  annoHandleHoverFill: '#FFEB3B',
  // 标注编辑器
  annoEditorBg: '#0a0a0e',
  annoEditorText: '#e8eaed',
  annoEditorBorder: 'rgba(255,255,255,0.06)',
  annoEditorInputBg: 'rgba(255,255,255,0.06)',
  annoEditorBtnBg: '#bb86fc',
  annoEditorBtnHoverBg: '#9b59b6',
  annoEditorBtnColor: '#fff',
  // 滑块
  sliderTrackBg: 'rgba(255, 255, 255, 0.15)',
  sliderThumbColor: '#bb86fc',
  sliderThumbHover: '#9b59b6',
  // 复选框
  checkboxBorder: 'rgba(255, 255, 255, 0.3)',
  checkboxCheckedBg: '#bb86fc',
  // 工具网格
  toolItemBg: 'rgba(255, 255, 255, 0.04)',
  toolItemBorder: 'rgba(255, 255, 255, 0.04)',
  toolItemHoverBg: 'rgba(187, 134, 252, 0.15)',
  toolItemHoverBorder: 'rgba(187, 134, 252, 0.3)',
  // 颜色选择
  colorItemActiveBorder: '#bb86fc',
  colorItemActiveShadow: '0 0 10px rgba(187, 134, 252, 0.4)',
  // Tooltip
  tooltipBg: 'rgba(0, 0, 0, 0.85)',
  tooltipColor: '#e8eaed',
  // 图标 filter
  iconFilter: 'none'
}

/**
 * 预设主题映射
 */
export const PRESET_THEMES: Record<PresetThemeName, ThemeDefinition> = {
  default: { name: 'default', colors: DEFAULT_COLORS },
  light: { name: 'light', colors: LIGHT_COLORS },
  dark: { name: 'dark', colors: DARK_COLORS }
}

/**
 * CSS 变量名映射：ThemeColors 的 key → CSS 变量名
 */
const CSS_VAR_MAP: Record<keyof ThemeColors, string> = {
  panelBackground: '--med-panel-bg',
  panelBackgroundSolid: '--med-panel-bg-solid',
  panelBorder: '--med-panel-border',
  panelShadow: '--med-panel-shadow',
  textPrimary: '--med-text-primary',
  textSecondary: '--med-text-secondary',
  textMuted: '--med-text-muted',
  accentColor: '--med-accent',
  accentHover: '--med-accent-hover',
  accentBgLow: '--med-accent-bg-low',
  accentBgHigh: '--med-accent-bg-high',
  btnBackground: '--med-btn-bg',
  btnHoverBackground: '--med-btn-hover-bg',
  dangerColor: '--med-danger',
  dangerBgLow: '--med-danger-bg-low',
  dangerBgHigh: '--med-danger-bg-high',
  selectionColor: '--med-selection',
  selectionHandleBorder: '--med-selection-handle-border',
  annoHandleInnerFill: '--med-anno-handle-inner-fill',
  annoHandleInnerStroke: '--med-anno-handle-inner-stroke',
  annoHandleOuterFill: '--med-anno-handle-outer-fill',
  annoHandleOuterStroke: '--med-anno-handle-outer-stroke',
  annoInnerStroke: '--med-anno-inner-stroke',
  annoOuterStroke: '--med-anno-outer-stroke',
  annoInnerHoverStroke: '--med-anno-inner-hover-stroke',
  annoHandleHoverFill: '--med-anno-handle-hover-fill',
  annoEditorBg: '--med-anno-editor-bg',
  annoEditorText: '--med-anno-editor-text',
  annoEditorBorder: '--med-anno-editor-border',
  annoEditorInputBg: '--med-anno-editor-input-bg',
  annoEditorBtnBg: '--med-anno-editor-btn-bg',
  annoEditorBtnHoverBg: '--med-anno-editor-btn-hover-bg',
  annoEditorBtnColor: '--med-anno-editor-btn-color',
  sliderTrackBg: '--med-slider-track-bg',
  sliderThumbColor: '--med-slider-thumb',
  sliderThumbHover: '--med-slider-thumb-hover',
  checkboxBorder: '--med-checkbox-border',
  checkboxCheckedBg: '--med-checkbox-checked-bg',
  toolItemBg: '--med-tool-item-bg',
  toolItemBorder: '--med-tool-item-border',
  toolItemHoverBg: '--med-tool-item-hover-bg',
  toolItemHoverBorder: '--med-tool-item-hover-border',
  colorItemActiveBorder: '--med-color-item-active-border',
  colorItemActiveShadow: '--med-color-item-active-shadow',
  tooltipBg: '--med-tooltip-bg',
  tooltipColor: '--med-tooltip-color',
  iconFilter: '--med-icon-filter'
}

/**
 * 获取 CSS 变量名
 */
export function getCssVarName(key: keyof ThemeColors): string {
  return CSS_VAR_MAP[key]
}

/**
 * 获取 CSS 变量引用 var(--med-xxx)
 */
export function cssVar(key: keyof ThemeColors): string {
  return `var(${CSS_VAR_MAP[key]})`
}

/**
 * 主题管理器
 */
export class ThemeManager {
  private container: HTMLElement
  private currentTheme: ThemeDefinition
  private currentName: string

  constructor(container: HTMLElement, themeConfig?: ThemeConfig) {
    this.container = container
    const resolved = this.resolveConfig(themeConfig)
    this.currentTheme = resolved
    this.currentName = resolved.name
    this.applyTheme(resolved.colors)
  }

  /**
   * 解析主题配置
   */
  private resolveConfig(config?: ThemeConfig): ThemeDefinition {
    if (!config) {
      return PRESET_THEMES.default
    }

    // 字符串 → 预设主题
    if (typeof config === 'string') {
      const preset = PRESET_THEMES[config]
      if (!preset) {
        console.warn(`[ThemeManager] Unknown preset theme "${config}", falling back to default`)
        return PRESET_THEMES.default
      }
      return preset
    }

    // ThemeDefinition（含 name）
    if ('name' in config && 'colors' in config) {
      return config as ThemeDefinition
    }

    // Partial<ThemeColors> → 基于默认主题合并
    return {
      name: 'custom',
      colors: { ...DEFAULT_COLORS, ...(config as Partial<ThemeColors>) }
    }
  }

  /**
   * 将主题颜色应用为 CSS 变量到容器元素
   */
  private applyTheme(colors: ThemeColors): void {
    const keys = Object.keys(CSS_VAR_MAP) as (keyof ThemeColors)[]
    keys.forEach((key) => {
      const value = colors[key]
      if (value !== undefined) {
        this.container.style.setProperty(CSS_VAR_MAP[key], value)
      }
    })
  }

  /**
   * 切换主题
   */
  public setTheme(config: ThemeConfig): void {
    const resolved = this.resolveConfig(config)
    this.currentTheme = resolved
    this.currentName = resolved.name
    this.applyTheme(resolved.colors)
  }

  /**
   * 获取当前主题名称
   */
  public getThemeName(): string {
    return this.currentName
  }

  /**
   * 获取当前主题颜色
   */
  public getColors(): ThemeColors {
    return { ...this.currentTheme.colors }
  }

  /**
   * 获取指定颜色值（当前主题）
   */
  public getColor(key: keyof ThemeColors): string {
    return this.currentTheme.colors[key]
  }

  /**
   * 销毁（清除 CSS 变量）
   */
  public destroy(): void {
    const keys = Object.keys(CSS_VAR_MAP) as (keyof ThemeColors)[]
    keys.forEach((key) => {
      this.container.style.removeProperty(CSS_VAR_MAP[key])
    })
  }
}
