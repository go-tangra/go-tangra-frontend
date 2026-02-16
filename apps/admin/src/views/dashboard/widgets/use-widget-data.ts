import { onMounted, onUnmounted, ref, type Ref } from 'vue';

import { requestClient } from '#/utils/request';

export interface WidgetDataSource {
  endpoint: string;
  method: string;
  params?: Record<string, string>;
}

/**
 * Composable for fetching widget data from a data source endpoint.
 * Each widget independently fetches data through the gateway.
 */
export function useWidgetData(
  dataSource: WidgetDataSource,
  refreshInterval = 60_000,
) {
  const data: Ref<any> = ref(null);
  const loading = ref(false);
  const error = ref<string | null>(null);

  let timer: ReturnType<typeof setInterval> | null = null;

  async function refresh() {
    loading.value = true;
    error.value = null;

    try {
      // Module endpoints (/admin/v1/modules/...) need /admin stripped because
      // requestClient already has baseURL=/admin. Admin's own endpoints
      // (/admin/v1/statistics) must keep the prefix (double /admin is correct).
      let url = dataSource.endpoint.replace(/^\/admin(?=\/v1\/modules\/)/, '');
      if (dataSource.params && Object.keys(dataSource.params).length > 0) {
        const params = new URLSearchParams(dataSource.params);
        url += `?${params.toString()}`;
      }

      data.value = await requestClient.request(url, {
        method: dataSource.method || 'GET',
        __skipErrorMessage: true,
      } as any);
    } catch (err) {
      error.value =
        err instanceof Error ? err.message : 'Failed to fetch widget data';
      // Silently log - widgets will show empty state
    } finally {
      loading.value = false;
    }
  }

  onMounted(async () => {
    await refresh();
    if (refreshInterval > 0) {
      timer = setInterval(refresh, refreshInterval);
    }
  });

  onUnmounted(() => {
    if (timer) {
      clearInterval(timer);
    }
  });

  return { data, loading, error, refresh };
}

/**
 * Resolves a dot-notation path in an object.
 * e.g. resolvePath({ admin: { users: { activeCount: 42 } } }, "admin.users.activeCount") → 42
 */
export function resolvePath(obj: any, path: string): any {
  if (!obj || !path) return undefined;
  return path.split('.').reduce((acc, key) => acc?.[key], obj);
}

/**
 * Ensures a value is a number (API may return strings for int64 fields).
 */
export function toNumber(val: unknown): number {
  if (typeof val === 'number') return val;
  if (typeof val === 'string') return Number(val) || 0;
  return 0;
}
