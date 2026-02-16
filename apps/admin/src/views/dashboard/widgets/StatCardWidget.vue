<script lang="ts" setup>
import { computed } from 'vue';

import { resolvePath, toNumber, useWidgetData } from './use-widget-data';

const props = defineProps<{
  definition: any;
}>();

const { data, loading } = useWidgetData(props.definition.dataSource);

const mapping = computed(() => props.definition.dataMapping ?? {});

const value = computed(() => {
  if (!data.value) return 0;
  return toNumber(resolvePath(data.value, mapping.value.value_path ?? ''));
});

const total = computed(() => {
  if (!data.value) return 0;
  return toNumber(resolvePath(data.value, mapping.value.total_path ?? ''));
});

const label = computed(() => mapping.value.label ?? props.definition.name ?? '');
</script>

<template>
  <div class="flex h-full flex-col justify-between p-4">
    <div class="flex items-center gap-2 text-sm text-muted-foreground">
      <span>{{ label }}</span>
      <span v-if="loading" class="text-xs text-blue-400">...</span>
    </div>
    <div class="mt-2 text-3xl font-bold text-foreground">
      {{ value.toLocaleString() }}
    </div>
    <div v-if="total > 0" class="mt-1 text-xs text-muted-foreground">
      / {{ total.toLocaleString() }} total
    </div>
  </div>
</template>
