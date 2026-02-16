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

const mapping = computed(() => props.definition.dataMapping || {});

function render() {
  if (!data.value) return;

  const categories = resolvePath(data.value, mapping.value.categories_path) || [];
  const seriesData = resolvePath(data.value, mapping.value.series_data) || {};
  const seriesFieldsStr = mapping.value.series_fields || '';
  const seriesLabelsStr = mapping.value.series_labels || '';

  const fields = seriesFieldsStr ? seriesFieldsStr.split(',') : Object.keys(seriesData);
  const labels = seriesLabelsStr
    ? seriesLabelsStr.split(',')
    : fields;

  const colors = [
    '#5470c6', '#91cc75', '#fac858', '#ee6666', '#73c0de',
    '#3ba272', '#fc8452', '#9a60b4', '#ea7ccc',
  ];

  // Format bucket labels
  const categoryLabels = categories.map((c: string) => {
    try {
      const d = new Date(c);
      return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit' });
    } catch {
      return c;
    }
  });

  const series = fields.map((field: string, i: number) => {
    const vals = seriesData[field]?.values || seriesData[field] || [];
    return {
      name: labels[i] || field,
      type: 'line',
      stack: mapping.value.stacked === 'true' ? 'Total' : undefined,
      areaStyle: { opacity: 0.4 },
      smooth: true,
      symbol: 'none',
      data: Array.isArray(vals) ? vals.map(toNumber) : [],
      itemStyle: { color: colors[i % colors.length] },
    };
  });

  renderEcharts({
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'cross' },
    },
    legend: {
      data: series.map((s: any) => s.name),
      bottom: 0,
      textStyle: { fontSize: 11 },
    },
    grid: { top: 10, right: 16, bottom: 30, left: 50, containLabel: false },
    xAxis: {
      type: 'category',
      data: categoryLabels,
      boundaryGap: false,
      axisLabel: { fontSize: 10, rotate: categories.length > 24 ? 30 : 0 },
    },
    yAxis: {
      type: 'value',
      axisLabel: { fontSize: 10 },
      splitLine: { lineStyle: { type: 'dashed' } },
    },
    series,
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
