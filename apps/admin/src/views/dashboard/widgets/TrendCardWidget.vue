<script lang="ts" setup>
import { computed } from 'vue';

import type { WidgetDefinition } from '#/stores';

import { resolvePath, toNumber, useWidgetData } from './use-widget-data';

const props = defineProps<{
  definition: WidgetDefinition;
}>();

const { data, loading, error } = useWidgetData(props.definition.dataSource, 60_000);

const mapping = computed(() => props.definition.dataMapping || {});

const displayValue = computed(() => {
  if (!data.value) return '-';
  const val = toNumber(resolvePath(data.value, mapping.value.value_path));
  const suffix = mapping.value.suffix || '';
  const decimals = Number(mapping.value.decimals) || 0;
  return val.toFixed(decimals) + suffix;
});

const previousValue = computed(() => {
  if (!data.value || !mapping.value.previous_value_path) return null;
  return toNumber(resolvePath(data.value, mapping.value.previous_value_path));
});

const changePercent = computed(() => {
  if (!data.value) return null;
  if (mapping.value.change_percent_path) {
    return toNumber(resolvePath(data.value, mapping.value.change_percent_path));
  }
  // Calculate from current and previous
  if (previousValue.value !== null && previousValue.value !== 0) {
    const current = toNumber(resolvePath(data.value, mapping.value.value_path));
    return ((current - previousValue.value) / previousValue.value) * 100;
  }
  return null;
});

const trend = computed(() => {
  if (!data.value) return 'stable';
  if (mapping.value.trend_path) {
    return resolvePath(data.value, mapping.value.trend_path) || 'stable';
  }
  if (changePercent.value !== null) {
    if (changePercent.value > 1) return 'up';
    if (changePercent.value < -1) return 'down';
  }
  return 'stable';
});

const invertColors = computed(() => mapping.value.invert_colors === 'true');

const trendBgColor = computed(() => {
  const isUp = trend.value === 'up';
  if (invertColors.value) {
    return isUp ? 'bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-400' : 'bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-400';
  }
  return isUp ? 'bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-400' : 'bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-400';
});

const trendArrow = computed(() => {
  if (trend.value === 'up') return '\u25B2';
  if (trend.value === 'down') return '\u25BC';
  return '\u25C6';
});

const label = computed(() => mapping.value.label || props.definition.name);

const subtitle = computed(() => {
  if (!data.value || !mapping.value.subtitle_path) return null;
  return resolvePath(data.value, mapping.value.subtitle_path);
});
</script>

<template>
  <div class="flex h-full flex-col justify-center p-4">
    <div v-if="loading && !data" class="flex flex-1 items-center justify-center text-muted-foreground">
      Loading...
    </div>
    <div v-else-if="error" class="flex flex-1 items-center justify-center text-red-400 text-xs">
      {{ error }}
    </div>
    <template v-else>
      <div class="text-xs font-medium uppercase tracking-wider text-muted-foreground">
        {{ label }}
      </div>
      <div class="mt-1 flex items-baseline gap-3">
        <span class="text-3xl font-bold text-foreground">{{ displayValue }}</span>
        <span
          v-if="changePercent !== null"
          :class="[trendBgColor, 'inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-xs font-medium']"
        >
          {{ trendArrow }} {{ Math.abs(changePercent).toFixed(1) }}%
        </span>
      </div>
      <div v-if="subtitle" class="mt-1 text-xs text-muted-foreground">
        {{ subtitle }}
      </div>
      <div v-else-if="previousValue !== null" class="mt-1 text-xs text-muted-foreground">
        Previous: {{ previousValue.toLocaleString() }}
      </div>
    </template>
  </div>
</template>
