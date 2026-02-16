<script lang="ts" setup>
import { computed, ref } from 'vue';

import { $t } from '@vben/locales';

import type { WidgetDefinition } from '#/stores';

const props = defineProps<{
  open: boolean;
  widgets: WidgetDefinition[];
}>();

const emit = defineEmits<{
  close: [];
  add: [widgetId: string];
}>();

const searchQuery = ref('');

const filteredWidgets = computed(() => {
  const query = searchQuery.value.toLowerCase();
  if (!query) return props.widgets;
  return props.widgets.filter(
    (w) =>
      w.name.toLowerCase().includes(query) ||
      w.description.toLowerCase().includes(query) ||
      w.moduleId.toLowerCase().includes(query),
  );
});

/** Group widgets by module */
const groupedWidgets = computed(() => {
  const groups: Record<string, WidgetDefinition[]> = {};
  for (const w of filteredWidgets.value) {
    const key = w.moduleId || 'other';
    if (!groups[key]) groups[key] = [];
    groups[key]!.push(w);
  }
  return groups;
});

const widgetTypeIcons: Record<string, string> = {
  stat_card: '📊',
  pie_chart: '🥧',
  bar_chart: '📶',
  line_chart: '📈',
  gauge: '🎯',
  table: '📋',
  list: '📝',
};
</script>

<template>
  <div
    v-if="open"
    class="fixed inset-y-0 right-0 z-50 flex"
  >
    <!-- Backdrop -->
    <div
      class="fixed inset-0 bg-black/30"
      @click="emit('close')"
    />

    <!-- Drawer -->
    <div class="relative ml-auto flex h-full w-80 flex-col bg-card shadow-xl">
      <!-- Header -->
      <div class="flex items-center justify-between border-b border-border px-4 py-3">
        <h3 class="text-lg font-semibold text-foreground">{{ $t('page.dashboard.widgetCatalog') }}</h3>
        <button
          class="text-muted-foreground hover:text-foreground"
          @click="emit('close')"
        >
          &times;
        </button>
      </div>

      <!-- Search -->
      <div class="border-b border-border px-4 py-2">
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Search widgets..."
          class="w-full rounded border border-border bg-background px-3 py-1.5 text-sm text-foreground focus:border-primary focus:outline-none"
        />
      </div>

      <!-- Widget List -->
      <div class="flex-1 overflow-y-auto p-4">
        <div v-if="filteredWidgets.length === 0" class="py-8 text-center text-muted-foreground">
          {{ $t('page.dashboard.noWidgets') }}
        </div>

        <div v-for="(widgets, moduleId) in groupedWidgets" :key="moduleId" class="mb-4">
          <h4 class="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {{ moduleId }}
          </h4>
          <div class="space-y-2">
            <div
              v-for="widget in widgets"
              :key="widget.id"
              class="cursor-pointer rounded-lg border border-border p-3 transition-colors hover:border-primary/50 hover:bg-accent"
              @click="emit('add', widget.id)"
            >
              <div class="flex items-center gap-2">
                <span class="text-lg">{{ widgetTypeIcons[widget.widgetType] || '📦' }}</span>
                <div class="flex-1">
                  <div class="text-sm font-medium text-foreground">{{ widget.name }}</div>
                  <div class="text-xs text-muted-foreground">{{ widget.description }}</div>
                </div>
              </div>
              <div class="mt-1 flex gap-1">
                <span class="rounded bg-muted px-1.5 py-0.5 text-xs text-muted-foreground">
                  {{ widget.widgetType }}
                </span>
                <span class="rounded bg-muted px-1.5 py-0.5 text-xs text-muted-foreground">
                  {{ widget.defaultSize.width }}x{{ widget.defaultSize.height }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
