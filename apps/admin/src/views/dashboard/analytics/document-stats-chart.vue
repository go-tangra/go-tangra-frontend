<script lang="ts" setup>
import { computed, onMounted, ref, watch } from 'vue';

import { $t } from '@vben/locales';
import {
  EchartsUI,
  type EchartsUIType,
  useEcharts,
} from '@vben/plugins/echarts';

import { useDashboardStore } from '#/stores';

const dashboardStore = useDashboardStore();
const chartRef = ref<EchartsUIType>();
const { renderEcharts } = useEcharts(chartRef);

// Helper to ensure value is a number (API may return strings for int64)
function toNumber(val: unknown): number {
  if (typeof val === 'number') return val;
  if (typeof val === 'string') return Number(val) || 0;
  return 0;
}

const chartData = computed(() => {
  const paperless = dashboardStore.getPaperlessStats();
  const docs = paperless?.documents;

  if (!docs?.byProcessingStatus) {
    return [];
  }

  const statusMap = docs.byProcessingStatus as Record<string, unknown>;

  return [
    { value: toNumber(statusMap['PROCESSING_STATUS_COMPLETED']), name: $t('page.dashboard.completed') },
    { value: toNumber(statusMap['PROCESSING_STATUS_FAILED']), name: $t('page.dashboard.failed') },
    { value: toNumber(statusMap['PROCESSING_STATUS_PENDING']), name: $t('page.dashboard.pending') },
    { value: toNumber(statusMap['PROCESSING_STATUS_PROCESSING']), name: $t('page.dashboard.processing') },
    { value: toNumber(statusMap['PROCESSING_STATUS_SKIPPED']), name: $t('page.dashboard.skipped') },
  ].filter(item => item.value > 0);
});

function render() {
  const data = chartData.value;

  if (data.length === 0) {
    renderEcharts({
      title: {
        text: $t('page.dashboard.noData'),
        left: 'center',
        top: 'center',
        textStyle: {
          color: '#999',
          fontSize: 14,
        },
      },
    });
    return;
  }

  renderEcharts({
    tooltip: {
      trigger: 'item',
      formatter: '{a} <br/>{b}: {c} ({d}%)',
    },
    legend: {
      orient: 'horizontal',
      bottom: 10,
      data: data.map(item => item.name),
    },
    color: ['#52C41A', '#FF4D4F', '#FAAD14', '#1890FF', '#8C8C8C'],
    series: [
      {
        name: $t('page.dashboard.documentStatus'),
        type: 'pie',
        radius: ['40%', '70%'],
        center: ['50%', '45%'],
        avoidLabelOverlap: false,
        itemStyle: {
          borderRadius: 10,
          borderColor: '#fff',
          borderWidth: 2,
        },
        label: {
          show: true,
          formatter: '{b}: {c}',
        },
        emphasis: {
          label: {
            show: true,
            fontSize: 16,
            fontWeight: 'bold',
          },
        },
        data,
      },
    ],
  });
}

onMounted(() => {
  render();
});

watch(() => dashboardStore.statistics, () => {
  render();
});
</script>

<template>
  <div class="h-80 w-full">
    <EchartsUI ref="chartRef" />
  </div>
</template>
