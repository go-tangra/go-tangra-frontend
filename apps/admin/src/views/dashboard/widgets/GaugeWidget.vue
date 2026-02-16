<script lang="ts" setup>
import { computed, onMounted, ref, watch } from 'vue';

import {
  EchartsUI,
  type EchartsUIType,
  useEcharts,
} from '@vben/plugins/echarts';

import { resolvePath, toNumber, useWidgetData } from './use-widget-data';

const props = defineProps<{
  definition: any;
}>();

const { data } = useWidgetData(props.definition.dataSource);
const chartRef = ref<EchartsUIType>();
const { renderEcharts } = useEcharts(chartRef);

const mapping = computed(() => props.definition.dataMapping ?? {});

function render() {
  if (!data.value) return;
  const m = mapping.value;

  const value = toNumber(resolvePath(data.value, m.value_path ?? ''));
  const formattedRate = Math.round(value * 100) / 100;

  renderEcharts({
    series: [
      {
        name: m.label || props.definition.name,
        type: 'gauge',
        startAngle: 180,
        endAngle: 0,
        center: ['50%', '70%'],
        radius: '100%',
        min: 0,
        max: 100,
        splitNumber: 5,
        axisLine: {
          lineStyle: {
            width: 20,
            color: [
              [0.7, '#52C41A'],
              [0.9, '#FAAD14'],
              [1, '#FF4D4F'],
            ],
          },
        },
        pointer: {
          icon: 'path://M12.8,0.7l12,40.1H0.7L12.8,0.7z',
          length: '12%',
          width: 12,
          offsetCenter: [0, '-60%'],
          itemStyle: { color: 'auto' },
        },
        axisTick: {
          length: 12,
          lineStyle: { color: 'auto', width: 2 },
        },
        splitLine: {
          length: 20,
          lineStyle: { color: 'auto', width: 4 },
        },
        axisLabel: {
          color: 'auto',
          fontSize: 12,
          distance: -40,
          rotate: 'tangential',
        },
        title: { offsetCenter: [0, '-10%'], fontSize: 14 },
        detail: {
          fontSize: 28,
          offsetCenter: [0, '10%'],
          valueAnimation: true,
          formatter: (val: number) => `${Math.round(val)}%`,
        },
        data: [
          {
            value: formattedRate,
            name: m.label || props.definition.name,
          },
        ],
      },
    ],
  });
}

onMounted(render);
watch(data, render);
</script>

<template>
  <div class="h-full w-full">
    <EchartsUI ref="chartRef" />
  </div>
</template>
