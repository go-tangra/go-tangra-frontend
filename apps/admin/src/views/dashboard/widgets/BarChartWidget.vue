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

  let categories: string[] = [];
  let values: number[] = [];

  if (m.data_path) {
    const obj = resolvePath(data.value, m.data_path);
    if (obj && typeof obj === 'object') {
      categories = Object.keys(obj);
      values = Object.values(obj).map(toNumber);
    }
  }

  if (categories.length === 0) {
    renderEcharts({
      title: {
        text: 'No data',
        left: 'center',
        top: 'center',
        textStyle: { color: '#999', fontSize: 14 },
      },
    });
    return;
  }

  renderEcharts({
    tooltip: { trigger: 'axis' },
    xAxis: {
      type: 'category',
      data: categories,
      axisLabel: { rotate: 30 },
    },
    yAxis: { type: 'value' },
    series: [
      {
        name: m.label || props.definition.name,
        type: 'bar',
        data: values,
        itemStyle: { borderRadius: [4, 4, 0, 0] },
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
