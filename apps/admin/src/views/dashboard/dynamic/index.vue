<script lang="ts" setup>
import { nextTick, onMounted, ref, watch } from 'vue';

import { $t } from '@vben/locales';

import { GridItem, GridLayout } from 'vue3-grid-layout-next';

import { useDynamicDashboardStore } from '#/stores';

import DashboardWidgetRenderer from './DashboardWidgetRenderer.vue';
import WidgetCatalogDrawer from './WidgetCatalogDrawer.vue';

const store = useDynamicDashboardStore();
const editMode = ref(false);
const catalogOpen = ref(false);
// Stagger widget rendering: only mount widgets up to this index
const mountedCount = ref(0);
// Mutable copy of layout for the grid-layout in edit mode
const editLayout = ref<
  Array<{ i: string; x: number; y: number; w: number; h: number }>
>([]);

onMounted(async () => {
  await Promise.all([store.loadWidgetCatalog(), store.loadDashboard()]);
  staggerMount();
});

function staggerMount() {
  const total = store.layoutItems.length;
  if (mountedCount.value >= total) return;
  mountedCount.value = Math.min(mountedCount.value + 4, total);
  if (mountedCount.value < total) {
    nextTick(() => setTimeout(staggerMount, 100));
  }
}

function toggleEdit() {
  editMode.value = !editMode.value;
  if (editMode.value) {
    // Deep copy current layout into mutable editLayout
    editLayout.value = store.layoutItems.map((item) => ({ ...item }));
  } else {
    catalogOpen.value = false;
  }
}

function handleLayoutUpdated(
  newLayout: Array<{
    i: string;
    x: number;
    y: number;
    w: number;
    h: number;
  }>,
) {
  editLayout.value = newLayout;
  store.updateLayout(newLayout);
}

async function handleSave() {
  store.updateLayout(editLayout.value);
  await store.saveDashboard();
  editMode.value = false;
  catalogOpen.value = false;
}

function handleCancel() {
  editMode.value = false;
  catalogOpen.value = false;
  store.loadDashboard();
}

async function handleReset() {
  await store.resetDashboard();
  editMode.value = false;
  catalogOpen.value = false;
}

function handleRemoveWidget(widgetId: string) {
  store.removeWidget(widgetId);
  editLayout.value = editLayout.value.filter((item) => item.i !== widgetId);
}

function handleAddWidget(widgetId: string) {
  store.addWidget(widgetId);
  // Sync editLayout with the updated store layout
  editLayout.value = store.layoutItems.map((item) => ({ ...item }));
}

async function handleRefresh() {
  mountedCount.value = 0;
  await Promise.all([store.loadWidgetCatalog(), store.loadDashboard()]);
  staggerMount();
}

// When switching to edit mode after new widgets are added, re-sync
watch(
  () => store.layoutItems.length,
  () => {
    if (editMode.value) {
      editLayout.value = store.layoutItems.map((item) => ({ ...item }));
    }
  },
);

/** Convert grid units to CSS grid placement (view mode) */
function gridStyle(item: { x: number; y: number; w: number; h: number }) {
  return {
    gridColumn: `${item.x + 1} / span ${item.w}`,
    gridRow: `${item.y + 1} / span ${item.h}`,
    minHeight: `${item.h * 92}px`,
  };
}
</script>

<template>
  <div class="p-5">
    <!-- Toolbar -->
    <div class="mb-4 flex items-center justify-between">
      <h2 class="text-lg font-semibold text-foreground">
        {{ store.dashboard?.name ?? $t('page.dashboard.title') }}
      </h2>
      <div class="flex gap-2">
        <template v-if="editMode">
          <button
            class="rounded border border-blue-500 bg-blue-500 px-3 py-1.5 text-sm text-white hover:bg-blue-600"
            @click="catalogOpen = true"
          >
            {{ $t('page.dashboard.addWidget') }}
          </button>
          <button
            class="rounded border border-green-500 bg-green-500 px-3 py-1.5 text-sm text-white hover:bg-green-600"
            @click="handleSave"
          >
            {{ $t('page.dashboard.saveDashboard') }}
          </button>
          <button
            class="rounded border border-border px-3 py-1.5 text-sm text-foreground hover:bg-muted"
            @click="handleCancel"
          >
            {{ $t('common.cancel') }}
          </button>
          <button
            class="rounded border border-red-300 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-950"
            @click="handleReset"
          >
            {{ $t('page.dashboard.resetDashboard') }}
          </button>
        </template>
        <template v-else>
          <button
            class="rounded border border-border px-3 py-1.5 text-sm text-foreground hover:bg-muted"
            @click="toggleEdit"
          >
            {{ $t('page.dashboard.editDashboard') }}
          </button>
          <button
            class="rounded border border-border px-3 py-1.5 text-sm text-foreground hover:bg-muted"
            @click="handleRefresh"
          >
            &#x21bb;
          </button>
        </template>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="store.loading" class="py-20 text-center text-muted-foreground">
      Loading dashboard...
    </div>

    <!-- Error -->
    <div
      v-else-if="store.error"
      class="rounded border border-red-200 bg-red-50 p-4 text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-400"
    >
      {{ store.error }}
    </div>

    <!-- Dashboard content -->
    <template v-else-if="store.dashboard">
      <!-- Edit Mode: vue3-grid-layout with drag & resize -->
      <GridLayout
        v-if="editMode && editLayout.length > 0"
        :layout="editLayout"
        :col-num="12"
        :row-height="80"
        :margin="[12, 12]"
        :is-draggable="true"
        :is-resizable="true"
        :use-css-transforms="true"
        :vertical-compact="true"
        @layout-updated="handleLayoutUpdated"
      >
        <GridItem
          v-for="item in editLayout"
          :key="item.i"
          :i="item.i"
          :x="item.x"
          :y="item.y"
          :w="item.w"
          :h="item.h"
          :min-w="2"
          :min-h="1"
          drag-allow-from=".widget-drag-handle"
        >
          <DashboardWidgetRenderer
            :definition="store.getWidgetDefinition(item.i)"
            :widget-id="item.i"
            :edit-mode="true"
            @remove="handleRemoveWidget"
          />
        </GridItem>
      </GridLayout>

      <!-- View Mode: CSS Grid with staggered mounting -->
      <div v-else-if="!editMode" class="dashboard-grid">
        <div
          v-for="(item, idx) in store.layoutItems"
          :key="item.i"
          :style="gridStyle(item)"
        >
          <DashboardWidgetRenderer
            v-if="idx < mountedCount"
            :definition="store.getWidgetDefinition(item.i)"
            :widget-id="item.i"
            :edit-mode="false"
            @remove="handleRemoveWidget"
          />
          <div
            v-else
            class="flex h-full items-center justify-center rounded-lg border border-border bg-muted text-muted-foreground"
          >
            Loading...
          </div>
        </div>
      </div>

      <!-- Empty state -->
      <div
        v-if="store.layoutItems.length === 0"
        class="rounded border-2 border-dashed border-border py-20 text-center text-muted-foreground"
      >
        <p class="text-lg">{{ $t('page.dashboard.noWidgets') }}</p>
        <button
          v-if="editMode"
          class="mt-4 rounded bg-blue-500 px-4 py-2 text-white hover:bg-blue-600"
          @click="catalogOpen = true"
        >
          {{ $t('page.dashboard.addWidget') }}
        </button>
      </div>
    </template>

    <!-- Widget Catalog Drawer -->
    <WidgetCatalogDrawer
      :open="catalogOpen"
      :widgets="store.availableWidgets"
      @close="catalogOpen = false"
      @add="handleAddWidget"
    />
  </div>
</template>

<style scoped>
.dashboard-grid {
  display: grid;
  grid-template-columns: repeat(12, 1fr);
  gap: 12px;
  grid-auto-rows: 80px;
}

/* vue3-grid-layout dark mode overrides */
:deep(.vue-grid-layout) {
  background: transparent;
}

:deep(.vue-grid-item) {
  background: transparent;
}

:deep(.vue-grid-item > .vue-resizable-handle) {
  background: none;
  border-right: 2px solid hsl(var(--border));
  border-bottom: 2px solid hsl(var(--border));
  width: 12px;
  height: 12px;
  bottom: 2px;
  right: 2px;
}

:deep(.vue-grid-item.vue-grid-placeholder) {
  background: hsl(var(--primary) / 0.15);
  border: 2px dashed hsl(var(--primary));
  border-radius: 8px;
}
</style>
