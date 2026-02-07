import { defineStore } from 'pinia';
import { ref } from 'vue';

import {
  createPlatformStatisticsServiceClient,
  type GetPlatformStatisticsResponse,
} from '#/generated/api/admin/service/v1';
import { requestClientRequestHandler } from '#/utils/request';

export const useDashboardStore = defineStore('dashboard', () => {
  const service = createPlatformStatisticsServiceClient(
    requestClientRequestHandler,
  );

  const statistics = ref<GetPlatformStatisticsResponse | null>(null);
  const loading = ref(false);
  const error = ref<string | null>(null);
  const lastFetchTime = ref<Date | null>(null);

  /**
   * Fetch platform statistics from the backend
   * @param expireSoonDays - Days threshold for certificates expiring soon (default: 30)
   * @param recentErrorsLimit - Maximum number of recent errors to return (default: 10)
   */
  async function fetchStatistics(
    expireSoonDays?: number,
    recentErrorsLimit?: number,
  ) {
    loading.value = true;
    error.value = null;

    try {
      const response = await service.GetPlatformStatistics({
        expireSoonDays,
        recentErrorsLimit,
      });

      statistics.value = response;
      lastFetchTime.value = new Date();
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to fetch statistics';
      console.error('Failed to fetch platform statistics:', err);
    } finally {
      loading.value = false;
    }
  }

  /**
   * Get admin statistics (users, tenants, roles)
   */
  function getAdminStats() {
    return statistics.value?.admin;
  }

  /**
   * Get LCM statistics (certificates, clients, issuers, jobs)
   */
  function getLcmStats() {
    return statistics.value?.lcm;
  }

  /**
   * Get Deployer statistics (jobs, targets, configurations)
   */
  function getDeployerStats() {
    return (statistics.value as any)?.deployer;
  }

  /**
   * Get Paperless statistics (documents, categories)
   */
  function getPaperlessStats() {
    return (statistics.value as any)?.paperless;
  }

  /**
   * Get IPAM statistics (subnets, addresses, utilization)
   */
  function getIpamStats() {
    return (statistics.value as any)?.ipam;
  }

  /**
   * Check if statistics are stale (older than specified minutes)
   */
  function isStale(minutes: number = 5): boolean {
    if (!lastFetchTime.value) return true;
    const now = new Date();
    const diff = (now.getTime() - lastFetchTime.value.getTime()) / 1000 / 60;
    return diff > minutes;
  }

  function $reset() {
    statistics.value = null;
    loading.value = false;
    error.value = null;
    lastFetchTime.value = null;
  }

  return {
    // State
    statistics,
    loading,
    error,
    lastFetchTime,
    // Actions
    fetchStatistics,
    getAdminStats,
    getLcmStats,
    getDeployerStats,
    getPaperlessStats,
    getIpamStats,
    isStale,
    $reset,
  };
});
