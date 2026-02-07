<script lang="ts" setup>
import type { AnalysisOverviewItem } from '@vben/common-ui';
import type { TabOption } from '@vben/types';

import { computed, onMounted, onUnmounted } from 'vue';

import { $t } from '@vben/locales';
import {
  AnalysisChartCard,
  AnalysisChartsTabs,
  AnalysisOverview,
} from '@vben/common-ui';
import {
  SvgBellIcon,
  SvgCakeIcon,
  SvgCardIcon,
  SvgDownloadIcon,
} from '@vben/icons';

import { useDashboardStore } from '#/stores';

import CertificateStatusChart from './certificate-status-chart.vue';
import DocumentStatsChart from './document-stats-chart.vue';
import JobTrendsChart from './job-trends-chart.vue';
import DeploymentSuccessChart from './deployment-success-chart.vue';
import IpUtilizationChart from './ip-utilization-chart.vue';
import RecentErrorsList from './recent-errors-list.vue';

const dashboardStore = useDashboardStore();

// Auto-refresh interval (60 seconds)
const AUTO_REFRESH_INTERVAL = 60_000;
let refreshTimer: ReturnType<typeof setInterval> | null = null;

// Fetch statistics on mount and set up auto-refresh
onMounted(async () => {
  await dashboardStore.fetchStatistics(30, 10);

  // Set up auto-refresh
  refreshTimer = setInterval(async () => {
    if (dashboardStore.isStale(1)) {
      await dashboardStore.fetchStatistics(30, 10);
    }
  }, AUTO_REFRESH_INTERVAL);
});

onUnmounted(() => {
  if (refreshTimer) {
    clearInterval(refreshTimer);
  }
});

// Helper to ensure value is a number (API may return strings for int64)
function toNumber(val: unknown): number {
  if (typeof val === 'number') return val;
  if (typeof val === 'string') return Number(val) || 0;
  return 0;
}

// Computed overview items from real statistics
const overviewItems = computed<AnalysisOverviewItem[]>(() => {
  const admin = dashboardStore.getAdminStats();
  const lcm = dashboardStore.getLcmStats();
  const deployer = dashboardStore.getDeployerStats();
  const paperless = dashboardStore.getPaperlessStats();
  const ipam = dashboardStore.getIpamStats();

  return [
    {
      icon: SvgCardIcon,
      title: $t('page.dashboard.users'),
      totalTitle: $t('page.dashboard.totalUsers'),
      totalValue: toNumber(admin?.users?.totalCount),
      value: toNumber(admin?.users?.activeCount),
    },
    {
      icon: SvgCakeIcon,
      title: $t('page.dashboard.certificates'),
      totalTitle: $t('page.dashboard.totalCertificates'),
      totalValue: toNumber(lcm?.issuedCertificates?.totalCount),
      value: toNumber(lcm?.issuedCertificates?.activeCount),
    },
    {
      icon: SvgDownloadIcon,
      title: $t('page.dashboard.documents'),
      totalTitle: $t('page.dashboard.totalDocuments'),
      totalValue: toNumber(paperless?.documents?.totalCount),
      value: toNumber(paperless?.documents?.byStatus?.['DOCUMENT_STATUS_ACTIVE']),
    },
    {
      icon: SvgBellIcon,
      title: $t('page.dashboard.ipAddresses'),
      totalTitle: $t('page.dashboard.totalAddresses'),
      totalValue: toNumber(ipam?.totalAddresses),
      value: toNumber(ipam?.usedAddresses),
    },
    {
      icon: SvgCakeIcon,
      title: $t('page.dashboard.deployments'),
      totalTitle: $t('page.dashboard.totalTargets'),
      totalValue: toNumber(deployer?.targets?.totalCount),
      value: toNumber(deployer?.configurations?.activeCount),
    },
    {
      icon: SvgCardIcon,
      title: $t('page.dashboard.expiringSoon'),
      totalTitle: $t('page.dashboard.withinDays'),
      totalValue: toNumber(lcm?.issuedCertificates?.expireSoonDays) || 30,
      value: toNumber(lcm?.issuedCertificates?.expireSoonCount),
    },
  ];
});

const chartTabs: TabOption[] = [
  {
    label: $t('page.dashboard.certificateStatus'),
    value: 'certificates',
  },
  {
    label: $t('page.dashboard.documentStatus'),
    value: 'documents',
  },
  {
    label: $t('page.dashboard.jobTrends'),
    value: 'jobs',
  },
];

const isLoading = computed(() => dashboardStore.loading);
</script>

<template>
  <div class="p-5">
    <AnalysisOverview :items="overviewItems" :loading="isLoading" />
    <AnalysisChartsTabs :tabs="chartTabs" class="mt-5">
      <template #certificates>
        <CertificateStatusChart />
      </template>
      <template #documents>
        <DocumentStatsChart />
      </template>
      <template #jobs>
        <JobTrendsChart />
      </template>
    </AnalysisChartsTabs>

    <div class="mt-5 w-full md:flex">
      <AnalysisChartCard
        class="mt-5 md:mr-4 md:mt-0 md:w-1/3"
        :title="$t('page.dashboard.deploymentSuccess')"
      >
        <DeploymentSuccessChart />
      </AnalysisChartCard>
      <AnalysisChartCard
        class="mt-5 md:mr-4 md:mt-0 md:w-1/3"
        :title="$t('page.dashboard.ipUtilization')"
      >
        <IpUtilizationChart />
      </AnalysisChartCard>
      <AnalysisChartCard
        class="mt-5 md:mt-0 md:w-1/3"
        :title="$t('page.dashboard.recentErrors')"
      >
        <RecentErrorsList />
      </AnalysisChartCard>
    </div>
  </div>
</template>
