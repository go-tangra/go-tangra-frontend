<script lang="ts" setup>
import { onMounted, ref, watch } from 'vue';

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

function render() {
  const lcm = dashboardStore.getLcmStats();
  const deployer = dashboardStore.getDeployerStats();

  const lcmJobs24h = lcm?.jobs?.last24Hours;
  const lcmJobs7d = lcm?.jobs?.last7Days;
  const deployerJobs24h = deployer?.jobs?.last24Hours;
  const deployerJobs7d = deployer?.jobs?.last7Days;

  const categories = [$t('page.dashboard.last24Hours'), $t('page.dashboard.last7Days')];

  renderEcharts({
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'shadow',
      },
    },
    legend: {
      data: [
        $t('page.dashboard.lcmSucceeded'),
        $t('page.dashboard.lcmFailed'),
        $t('page.dashboard.deployerSucceeded'),
        $t('page.dashboard.deployerFailed'),
      ],
      bottom: 0,
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '15%',
      top: '10%',
      containLabel: true,
    },
    xAxis: [
      {
        type: 'category',
        data: categories,
      },
    ],
    yAxis: [
      {
        type: 'value',
      },
    ],
    series: [
      {
        name: $t('page.dashboard.lcmSucceeded'),
        type: 'bar',
        stack: 'LCM',
        color: '#52C41A',
        emphasis: {
          focus: 'series',
        },
        data: [toNumber(lcmJobs24h?.succeeded), toNumber(lcmJobs7d?.succeeded)],
      },
      {
        name: $t('page.dashboard.lcmFailed'),
        type: 'bar',
        stack: 'LCM',
        color: '#FF4D4F',
        emphasis: {
          focus: 'series',
        },
        data: [toNumber(lcmJobs24h?.failed), toNumber(lcmJobs7d?.failed)],
      },
      {
        name: $t('page.dashboard.deployerSucceeded'),
        type: 'bar',
        stack: 'Deployer',
        color: '#1890FF',
        emphasis: {
          focus: 'series',
        },
        data: [toNumber(deployerJobs24h?.succeeded), toNumber(deployerJobs7d?.succeeded)],
      },
      {
        name: $t('page.dashboard.deployerFailed'),
        type: 'bar',
        stack: 'Deployer',
        color: '#FF7A45',
        emphasis: {
          focus: 'series',
        },
        data: [toNumber(deployerJobs24h?.failed), toNumber(deployerJobs7d?.failed)],
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
