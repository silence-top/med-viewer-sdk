// 渲染函数写的通用组件
import { defineComponent, h, onBeforeUnmount, onMounted, shallowRef } from 'vue-demi';
import type { MedEngineOptions } from '../../core/Engine';
import { MedViewerEngine } from '../../core/Engine';

export default defineComponent({
  name: 'MedViewer',
  props: {
    options: {
      type: Object as () => Omit<MedEngineOptions, 'element'>,
      required: true
    }
  },
  emits: ['ready'],
  setup(props, { slots, expose, emit }) {
    const containerRef = shallowRef<HTMLElement | null>(null);
    const engineRef = shallowRef<MedViewerEngine | null>(null);

    onMounted(() => {
      if (!containerRef.value) return;
      engineRef.value = new MedViewerEngine({
        osdOptions: props.options.osdOptions,
        locale: props.options.locale,
        plugins: props.options.plugins,
      });
      emit('ready', engineRef.value);
    });

    onBeforeUnmount(() => {
      engineRef.value?.destroy();
      engineRef.value = null;
    });

    expose({ engine: engineRef });

    return () => h('div', { class: 'med-viewer', ref: containerRef }, slots.default?.());
  }
});
