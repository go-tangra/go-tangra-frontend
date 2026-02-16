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

  let chartData: { name: string; value: number }[] = [];

  if (m.series_path && m.series_fields) {
    // Extract specific fields from an object
    const obj = resolvePath(data.value, m.series_path);
    const fields = (m.series_fields as string).split(',');
    const labels = (m.series_labels as string || '').split(',');
    chartData = fields
      .map((f: string, i: number) => ({
        name: labels[i] || f,
        value: toNumber(obj?.[f.trim()]),
      }))
      .filter((item) => item.value > 0);
  } else if (m.data_path) {
    // Extract from a map object
    const obj = resolvePath(data.value, m.data_path);
    if (obj && typeof obj === 'object') {
      chartData = Object.entries(obj).map(([key, val]) => ({
        name: key,
        value: toNumber(val),
      }));
    }
  }

  if (chartData.length === 0) {
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
    tooltip: { trigger: 'item', formatter: '{a} <br/>{b}: {c} ({d}%)' },
    legend: {
      orient: 'horizontal',
      bottom: 10,
      data: chartData.map((item) => item.name),
    },
    series: [
      {
        name: props.definition.name,
        type: 'pie',
        radius: ['40%', '70%'],
        center: ['50%', '45%'],
        avoidLabelOverlap: false,
        itemStyle: { borderRadius: 10, borderColor: 'transparent', borderWidth: 2 },
        label: { show: true, formatter: '{b}: {c}' },
        emphasis: {
          label: { show: true, fontSize: 16, fontWeight: 'bold' },
        },
        data: chartData,
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
