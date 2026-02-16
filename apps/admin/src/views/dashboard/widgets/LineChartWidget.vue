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
  const seriesData: { name: string; data: number[] }[] = [];

  if (m.categories_path && m.series_data && m.series_fields) {
    // Time-series format: { buckets: [...], series: { p50: { values: [...] }, ... } }
    const buckets = resolvePath(data.value, m.categories_path as string);
    const seriesMap = resolvePath(data.value, m.series_data as string);
    if (Array.isArray(buckets) && seriesMap) {
      categories = buckets.map((b: string) => {
        const d = new Date(b);
        return `${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
      });
      const fields = (m.series_fields as string).split(',');
      const labels = ((m.series_labels as string) || '').split(',');
      for (let i = 0; i < fields.length; i++) {
        const key = fields[i]!.trim();
        const values = seriesMap[key]?.values;
        seriesData.push({
          name: labels[i] || key,
          data: Array.isArray(values)
            ? values.map((v: unknown) => toNumber(v))
            : [],
        });
      }
    }
  } else if (m.categories_path && m.category_field && m.series_fields) {
    // Flat-array format: [{ label: "...", p50: 1, p95: 2 }, ...]
    const items = resolvePath(data.value, m.categories_path);
    if (Array.isArray(items)) {
      categories = items.map(
        (item: any) => item[m.category_field as string] || '',
      );
      const fields = (m.series_fields as string).split(',');
      const labels = ((m.series_labels as string) || '').split(',');
      for (let i = 0; i < fields.length; i++) {
        seriesData.push({
          name: labels[i] || fields[i]!,
          data: items.map((item: any) => toNumber(item[fields[i]!.trim()])),
        });
      }
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
    legend: { data: seriesData.map((s) => s.name) },
    xAxis: { type: 'category', data: categories },
    yAxis: { type: 'value' },
    series: seriesData.map((s) => ({
      name: s.name,
      type: 'line',
      data: s.data,
      smooth: true,
    })),
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
