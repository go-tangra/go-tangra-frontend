<script lang="ts" setup>
import { computed } from 'vue';

import { resolvePath, useWidgetData } from './use-widget-data';

const props = defineProps<{
  definition: any;
}>();

const { data, loading } = useWidgetData(props.definition.dataSource);

const mapping = computed(() => props.definition.dataMapping ?? {});

const rows = computed(() => {
  if (!data.value) return [];
  const items = resolvePath(data.value, mapping.value.items_path ?? '');
  return Array.isArray(items) ? items : [];
});

const columns = computed(() => {
  const cols = mapping.value.columns as string | undefined;
  if (!cols) {
    // Auto-detect from first row
    if (rows.value.length > 0) {
      return Object.keys(rows.value[0]!).slice(0, 5);
    }
    return [];
  }
  return cols.split(',').map((c: string) => c.trim());
});
</script>

<template>
  <div class="h-full overflow-auto p-2">
    <div v-if="loading" class="text-center text-muted-foreground">Loading...</div>
    <table v-else-if="rows.length > 0" class="w-full text-sm text-foreground">
      <thead>
        <tr class="border-b border-border">
          <th
            v-for="col in columns"
            :key="col"
            class="px-2 py-1 text-left font-medium text-muted-foreground"
          >
            {{ col }}
          </th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="(row, idx) in rows"
          :key="idx"
          class="border-b border-border"
        >
          <td v-for="col in columns" :key="col" class="px-2 py-1">
            {{ row[col] ?? '' }}
          </td>
        </tr>
      </tbody>
    </table>
    <div v-else class="py-8 text-center text-muted-foreground">No data</div>
  </div>
</template>
