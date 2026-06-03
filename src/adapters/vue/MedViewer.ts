// 渲染函数写的通用组件
import { defineComponent, h, onBeforeUnmount, onMounted, shallowRef, watch } from 'vue-demi';
import type { MedEngineOptions } from '../../core/Engine';
import { MedViewerEngine } from '../../core/Engine';
import type { ThemeConfig } from '../../core/Theme';

export default defineComponent({
  name: 'MedViewer',
  props: {
    options: {
      type: Object as () => Omit<MedEngineOptions, 'element'>,
      required: true
    },
    theme: {
      type: [String, Object] as unknown as () => ThemeConfig,
      default: undefined
    }
  },
  emits: ['ready'],
  setup(props, { slots, expose, emit }) {
    const containerRef = shallowRef<HTMLElement | null>(null);
    const engineRef = shallowRef<MedViewerEngine | null>(null);

    onMounted(() => {
      if (!containerRef.value) return;
      const engineOptions: MedEngineOptions = {
        osdOptions: props.options.osdOptions,
        locale: props.options.locale,
        theme: props.theme || props.options.theme,
        plugins: props.options.plugins,
      };
      engineRef.value = new MedViewerEngine(engineOptions);
      emit('ready', engineRef.value);
    });

    // 监听 theme 变化，动态切换
    watch(() => props.theme, (newTheme) => {
      if (newTheme !== undefined && engineRef.value) {
        engineRef.value.setTheme(newTheme);
      }
    });

    onBeforeUnmount(() => {
      engineRef.value?.destroy();
      engineRef.value = null;
    });

    expose({ engine: engineRef });

    return () => h('div', { class: 'med-viewer', ref: containerRef }, slots.default?.());
  }
});
