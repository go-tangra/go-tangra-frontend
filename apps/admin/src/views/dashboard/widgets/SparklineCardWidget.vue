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

const { data, loading, error } = useWidgetData(props.definition.dataSource, 60_000);
const sparklineRef = ref<EchartsUIType>();
const { renderEcharts } = useEcharts(sparklineRef);

const mapping = computed(() => props.definition.dataMapping || {});

const displayValue = computed(() => {
  if (!data.value) return '-';
  const val = toNumber(resolvePath(data.value, mapping.value.value_path));
  return val.toLocaleString();
});

const changePercent = computed(() => {
  if (!data.value) return null;
  const path = mapping.value.change_percent_path;
  if (!path) return null;
  return toNumber(resolvePath(data.value, path));
});

const trend = computed(() => {
  if (!data.value) return 'stable';
  const path = mapping.value.trend_path;
  if (path) return resolvePath(data.value, path) || 'stable';
  if (changePercent.value !== null) {
    if (changePercent.value > 0) return 'up';
    if (changePercent.value < 0) return 'down';
  }
  return 'stable';
});

const trendColor = computed(() => {
  const invertColors = mapping.value.invert_colors === 'true';
  const isUp = trend.value === 'up';
  if (invertColors) {
    return isUp ? 'text-red-500' : 'text-green-500';
  }
  return isUp ? 'text-green-500' : 'text-red-500';
});

const trendArrow = computed(() => {
  if (trend.value === 'up') return '\u2191';
  if (trend.value === 'down') return '\u2193';
  return '\u2192';
});

const label = computed(() => mapping.value.label || props.definition.name);

function renderSparkline() {
  if (!data.value) return;

  const sparkData = resolvePath(data.value, mapping.value.sparkline_path || 'sparkline');
  if (!sparkData || !Array.isArray(sparkData) || sparkData.length === 0) return;

  const values = sparkData.map(toNumber);
  const color = trend.value === 'up'
    ? (mapping.value.invert_colors === 'true' ? '#ef4444' : '#22c55e')
    : (mapping.value.invert_colors === 'true' ? '#22c55e' : '#ef4444');

  renderEcharts({
    grid: { top: 2, right: 2, bottom: 2, left: 2 },
    xAxis: { type: 'category', show: false, data: values.map((_: any, i: number) => i) },
    yAxis: { type: 'value', show: false },
    series: [{
      type: 'line',
      data: values,
      smooth: true,
      symbol: 'none',
      lineStyle: { width: 1.5, color },
      areaStyle: { color, opacity: 0.15 },
    }],
  });
}

onMounted(renderSparkline);
watch(data, renderSparkline);
</script>

<template>
  <div class="flex h-full flex-col justify-between p-3">
    <div v-if="loading && !data" class="flex flex-1 items-center justify-center text-muted-foreground">
      Loading...
    </div>
    <div v-else-if="error" class="flex flex-1 items-center justify-center text-xs text-red-400">
      {{ error }}
    </div>
    <template v-else>
      <div class="flex items-start justify-between">
        <div>
          <div class="text-xs text-muted-foreground">{{ label }}</div>
          <div class="text-2xl font-bold text-foreground">{{ displayValue }}</div>
        </div>
        <div v-if="changePercent !== null" class="text-right">
          <span :class="[trendColor, 'text-sm font-medium']">
            {{ trendArrow }} {{ Math.abs(changePercent).toFixed(1) }}%
          </span>
        </div>
      </div>
      <div class="mt-1 flex-1" style="min-height: 36px">
        <EchartsUI ref="sparklineRef" height="100%" />
      </div>
    </template>
  </div>
</template>
