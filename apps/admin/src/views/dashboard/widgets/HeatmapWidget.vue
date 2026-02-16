<script lang="ts" setup>
import { computed, onMounted, ref, watch } from 'vue';

import {
  EchartsUI,
  type EchartsUIType,
  useEcharts,
} from '@vben/plugins/echarts';

import { resolvePath, useWidgetData } from './use-widget-data';

const props = defineProps<{
  definition: any;
}>();

const { data } = useWidgetData(props.definition.dataSource);
const chartRef = ref<EchartsUIType>();
const { renderEcharts } = useEcharts(chartRef);

const mapping = computed(() => props.definition.dataMapping || {});

function render() {
  if (!data.value) return;

  const hours = resolvePath(data.value, mapping.value.hours_path || 'hours') || [];
  const days = resolvePath(data.value, mapping.value.days_path || 'days') || [];
  const rawData = resolvePath(data.value, mapping.value.data_path || 'data') || [];
  const maxValue = resolvePath(data.value, mapping.value.max_path || 'maxValue') || 1;

  // Transform data to [[hourIdx, dayIdx, value], ...]
  const heatmapData = rawData.map((cell: any) => {
    const hour = cell.hour ?? cell[0] ?? 0;
    const day = cell.day ?? cell[1] ?? 0;
    const value = cell.value ?? cell[2] ?? 0;
    return [hour, day, value];
  });

  const hourLabels = hours.length > 0 ? hours.map(String) : Array.from({ length: 24 }, (_, i) => `${i}:00`);
  const dayLabels = days.length > 0 ? days : ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  renderEcharts({
    tooltip: {
      position: 'top',
      formatter: (params: any) => {
        const [hour, day, value] = params.value;
        return `${dayLabels[day]} ${hourLabels[hour]}<br/>Count: <b>${value}</b>`;
      },
    },
    grid: { top: 8, right: 40, bottom: 30, left: 50, containLabel: false },
    xAxis: {
      type: 'category',
      data: hourLabels,
      splitArea: { show: true },
      axisLabel: { fontSize: 9, interval: 2 },
    },
    yAxis: {
      type: 'category',
      data: dayLabels,
      splitArea: { show: true },
      axisLabel: { fontSize: 10 },
    },
    visualMap: {
      min: 0,
      max: maxValue || 1,
      calculable: true,
      orient: 'vertical',
      right: 0,
      top: 'center',
      itemHeight: 80,
      textStyle: { fontSize: 9 },
      inRange: {
        color: document.documentElement.classList.contains('dark')
          ? ['#1a1f2e', '#064e3b', '#047857', '#059669', '#10b981']
          : ['#ebedf0', '#9be9a8', '#40c463', '#30a14e', '#216e39'],
      },
    },
    series: [{
      type: 'heatmap',
      data: heatmapData,
      label: { show: false },
      emphasis: {
        itemStyle: { shadowBlur: 10, shadowColor: 'rgba(0, 0, 0, 0.5)' },
      },
    }],
  } as any);
}

onMounted(render);
watch(data, render);
</script>

<template>
  <div class="h-full w-full">
    <EchartsUI ref="chartRef" />
  </div>
</template>
