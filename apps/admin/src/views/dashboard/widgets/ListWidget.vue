<script lang="ts" setup>
import { computed } from 'vue';

import { resolvePath, useWidgetData } from './use-widget-data';

const props = defineProps<{
  definition: any;
}>();

const { data, loading } = useWidgetData(props.definition.dataSource);

const mapping = computed(() => props.definition.dataMapping ?? {});

const items = computed(() => {
  if (!data.value) return [];
  const list = resolvePath(data.value, mapping.value.items_path ?? '');
  return Array.isArray(list) ? list : [];
});

function getTitle(item: any): string {
  const field = mapping.value.title_field;
  return field ? (item[field] ?? '') : JSON.stringify(item);
}

function getSubtitle(item: any): string {
  const field = mapping.value.subtitle_field;
  return field ? (item[field] ?? '') : '';
}

function getTime(item: any): string {
  const field = mapping.value.time_field;
  if (!field || !item[field]) return '';
  try {
    return new Date(item[field]).toLocaleString();
  } catch {
    return item[field];
  }
}
</script>

<template>
  <div class="max-h-full overflow-y-auto">
    <div v-if="loading" class="py-4 text-center text-muted-foreground">
      Loading...
    </div>
    <div v-else-if="items.length === 0" class="py-8 text-center text-muted-foreground">
      No items
    </div>
    <div v-else class="space-y-2 p-2">
      <div
        v-for="(item, idx) in items"
        :key="idx"
        class="rounded-lg border border-red-200 bg-red-50 p-3 dark:border-red-800 dark:bg-red-950"
      >
        <div class="flex items-start justify-between">
          <div class="flex-1">
            <div class="flex items-center gap-2">
              <span class="text-xs text-muted-foreground">{{ getTime(item) }}</span>
            </div>
            <div class="mt-1 text-sm text-red-700 dark:text-red-400">{{ getTitle(item) }}</div>
            <div
              v-if="getSubtitle(item)"
              class="mt-1 text-xs text-muted-foreground"
            >
              {{ getSubtitle(item) }}
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
