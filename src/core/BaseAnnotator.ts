import { MedViewerEngine } from './Engine';

/**
 * 标注插件的基类
 */
export abstract class BaseAnnotator {
    protected engine: MedViewerEngine;
    protected isEnabled: boolean = false;

    constructor(engine: MedViewerEngine) {
        this.engine = engine;
    }

    /**
     * 启用/禁用标注功能
     */
    public abstract setEnabled(enabled: boolean): void;

    /**
     * 设置当前的工具模式 (例如：矩形、箭头、多边形)
     */
    public abstract setTool(tool: string | null): void;

    /**
     * 获取所有标注数据 (建议在此处进行格式标准化)
     */
    public abstract getAnnotations(): any[];

    /**
     * 加载标注数据
     */
    public abstract setAnnotations(data: any[]): void;

    /**
     * 清除所有标注
     */
    public abstract clear(): void;

    /**
     * 销毁插件，移除事件监听
     */
    public abstract destroy(): void;
}