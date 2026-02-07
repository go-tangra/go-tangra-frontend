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

function render() {
  const ipam = dashboardStore.getIpamStats();

  const utilization = toNumber(ipam?.overallUtilization);
  const formattedRate = Math.round(utilization * 100) / 100;

  // Determine color based on utilization
  let gaugeColor = '#52C41A'; // Green for low utilization
  if (utilization > 70) {
    gaugeColor = '#FAAD14'; // Yellow for warning
  }
  if (utilization > 90) {
    gaugeColor = '#FF4D4F'; // Red for critical
  }

  renderEcharts({
    tooltip: {
      formatter: `{a} <br/>{b} : ${formattedRate}%`,
    },
    series: [
      {
        name: $t('page.dashboard.ipUtilization'),
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
          itemStyle: {
            color: 'auto',
          },
        },
        axisTick: {
          length: 12,
          lineStyle: {
            color: 'auto',
            width: 2,
          },
        },
        splitLine: {
          length: 20,
          lineStyle: {
            color: 'auto',
            width: 4,
          },
        },
        axisLabel: {
          color: '#666',
          fontSize: 12,
          distance: -40,
          rotate: 'tangential',
          formatter: (value: number) => {
            if (value === 0) return $t('page.dashboard.low');
            if (value === 50) return $t('page.dashboard.medium');
            if (value === 100) return $t('page.dashboard.high');
            return '';
          },
        },
        title: {
          offsetCenter: [0, '-10%'],
          fontSize: 14,
        },
        detail: {
          fontSize: 28,
          offsetCenter: [0, '10%'],
          valueAnimation: true,
          formatter: (value: number) => `${Math.round(value)}%`,
          color: gaugeColor,
        },
        data: [
          {
            value: formattedRate,
            name: $t('page.dashboard.ipUtilization'),
          },
        ],
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

const stats = computed(() => {
  const ipam = dashboardStore.getIpamStats();

  return {
    totalAddresses: toNumber(ipam?.totalAddresses),
    usedAddresses: toNumber(ipam?.usedAddresses),
    availableAddresses: toNumber(ipam?.availableAddresses),
    totalSubnets: toNumber(ipam?.totalSubnets),
  };
});
</script>

<template>
  <div class="flex flex-col items-center">
    <div class="h-48 w-full">
      <EchartsUI ref="chartRef" />
    </div>
    <div class="mt-2 flex w-full justify-around text-center text-sm">
      <div>
        <div class="text-gray-500">{{ $t('page.dashboard.totalAddresses') }}</div>
        <div class="text-lg font-semibold">{{ stats.totalAddresses }}</div>
      </div>
      <div>
        <div class="text-gray-500">{{ $t('page.dashboard.usedAddresses') }}</div>
        <div class="text-lg font-semibold text-blue-500">{{ stats.usedAddresses }}</div>
      </div>
      <div>
        <div class="text-gray-500">{{ $t('page.dashboard.availableAddresses') }}</div>
        <div class="text-lg font-semibold text-green-500">{{ stats.availableAddresses }}</div>
      </div>
    </div>
  </div>
</template>
