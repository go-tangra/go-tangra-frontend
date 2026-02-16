import { defineStore } from 'pinia';
import { computed, ref } from 'vue';

import { requestClient } from '#/utils/request';

export interface WidgetDefinition {
  id: string;
  moduleId: string;
  name: string;
  description: string;
  icon: string;
  widgetType: string;
  dataSource: {
    endpoint: string;
    method: string;
    params?: Record<string, string>;
  };
  dataMapping?: Record<string, any>;
  defaultSize: { width: number; height: number };
  tags: string[];
  authority: string[];
}

export interface DashboardWidget {
  widgetId: string;
  gridX: number;
  gridY: number;
  gridW: number;
  gridH: number;
  config?: Record<string, any>;
}

export interface UserDashboard {
  id?: number;
  name: string;
  widgets: DashboardWidget[];
  isDefault: boolean;
  createdAt?: string;
  updatedAt?: string;
}

async function fetchApi<T>(
  path: string,
  options?: { body?: string; method?: string },
): Promise<T> {
  return requestClient.request<T>(path, {
    method: options?.method ?? 'GET',
    data: options?.body,
  } as any);
}

export const useDynamicDashboardStore = defineStore(
  'dynamic-dashboard',
  () => {
    const widgetCatalog = ref<WidgetDefinition[]>([]);
    const dashboard = ref<UserDashboard | null>(null);
    const loading = ref(false);
    const catalogLoading = ref(false);
    const error = ref<string | null>(null);

    async function loadWidgetCatalog() {
      catalogLoading.value = true;
      try {
        const resp = await fetchApi<{ widgets: WidgetDefinition[] }>(
          '/admin/v1/dashboard/widgets',
        );
        widgetCatalog.value = resp.widgets || [];
      } catch (err) {
        console.error('Failed to load widget catalog:', err);
      } finally {
        catalogLoading.value = false;
      }
    }

    async function loadDashboard() {
      loading.value = true;
      error.value = null;
      try {
        const resp =
          await fetchApi<{ dashboard: UserDashboard }>(
            '/admin/v1/dashboard',
          );
        dashboard.value = resp.dashboard || null;
      } catch (err) {
        error.value =
          err instanceof Error ? err.message : 'Failed to load dashboard';
        console.error('Failed to load dashboard:', err);
      } finally {
        loading.value = false;
      }
    }

    async function saveDashboard() {
      if (!dashboard.value) return;
      loading.value = true;
      try {
        const resp = await fetchApi<{ dashboard: UserDashboard }>(
          '/admin/v1/dashboard',
          {
            method: 'PUT',
            body: JSON.stringify({
              name: dashboard.value.name,
              widgets: dashboard.value.widgets,
            }),
          },
        );
        dashboard.value = resp.dashboard || null;
      } catch (err) {
        error.value =
          err instanceof Error ? err.message : 'Failed to save dashboard';
        console.error('Failed to save dashboard:', err);
      } finally {
        loading.value = false;
      }
    }

    async function resetDashboard() {
      loading.value = true;
      try {
        const resp = await fetchApi<{ dashboard: UserDashboard }>(
          '/admin/v1/dashboard/reset',
          { method: 'POST', body: '{}' },
        );
        dashboard.value = resp.dashboard || null;
      } catch (err) {
        error.value =
          err instanceof Error ? err.message : 'Failed to reset dashboard';
        console.error('Failed to reset dashboard:', err);
      } finally {
        loading.value = false;
      }
    }

    /** Convert dashboard widgets to vue3-grid-layout format */
    const layoutItems = computed(() => {
      if (!dashboard.value?.widgets) return [];
      return dashboard.value.widgets.map((w) => ({
        i: w.widgetId,
        x: w.gridX,
        y: w.gridY,
        w: w.gridW,
        h: w.gridH,
      }));
    });

    /** Catalog widgets not yet placed on the dashboard */
    const availableWidgets = computed(() => {
      if (!dashboard.value?.widgets) return widgetCatalog.value;
      const placed = new Set(dashboard.value.widgets.map((w) => w.widgetId));
      return widgetCatalog.value.filter((w) => !placed.has(w.id));
    });

    function addWidget(widgetId: string) {
      if (!dashboard.value) return;
      const def = widgetCatalog.value.find((w) => w.id === widgetId);
      if (!def) return;

      // Find the next available Y position
      let maxY = 0;
      for (const w of dashboard.value.widgets) {
        const bottom = w.gridY + w.gridH;
        if (bottom > maxY) maxY = bottom;
      }

      dashboard.value.widgets.push({
        widgetId,
        gridX: 0,
        gridY: maxY,
        gridW: def.defaultSize.width,
        gridH: def.defaultSize.height,
      });
    }

    function removeWidget(widgetId: string) {
      if (!dashboard.value) return;
      dashboard.value.widgets = dashboard.value.widgets.filter(
        (w) => w.widgetId !== widgetId,
      );
    }

    function updateLayout(
      items: Array<{ i: string; x: number; y: number; w: number; h: number }>,
    ) {
      if (!dashboard.value) return;
      dashboard.value.widgets = items.map((item) => ({
        widgetId: item.i,
        gridX: item.x,
        gridY: item.y,
        gridW: item.w,
        gridH: item.h,
      }));
    }

    /** Look up widget definition by ID */
    function getWidgetDefinition(
      widgetId: string,
    ): WidgetDefinition | undefined {
      return widgetCatalog.value.find((w) => w.id === widgetId);
    }

    function $reset() {
      widgetCatalog.value = [];
      dashboard.value = null;
      loading.value = false;
      catalogLoading.value = false;
      error.value = null;
    }

    return {
      widgetCatalog,
      dashboard,
      loading,
      catalogLoading,
      error,
      layoutItems,
      availableWidgets,
      loadWidgetCatalog,
      loadDashboard,
      saveDashboard,
      resetDashboard,
      addWidget,
      removeWidget,
      updateLayout,
      getWidgetDefinition,
      $reset,
    };
  },
);
