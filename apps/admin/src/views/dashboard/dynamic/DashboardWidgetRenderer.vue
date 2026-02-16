<script lang="ts" setup>
import { computed } from 'vue';

import { $t } from '@vben/locales';

import { getWidgetComponent } from '../widgets';

import type { WidgetDefinition } from '#/stores';

const props = defineProps<{
  definition: WidgetDefinition | undefined;
  widgetId: string;
  editMode: boolean;
}>();

const emit = defineEmits<{
  remove: [widgetId: string];
}>();

const widgetComponent = computed(() => {
  if (!props.definition) return undefined;
  return getWidgetComponent(props.definition.widgetType);
});
</script>

<template>
  <div class="relative flex h-full flex-col overflow-hidden rounded-lg border border-border bg-card shadow-sm">
    <!-- Header -->
    <div class="flex items-center justify-between border-b border-border bg-muted px-3 py-2">
      <div class="flex items-center gap-2">
        <span
          v-if="editMode"
          class="widget-drag-handle cursor-move text-muted-foreground hover:text-foreground"
        >
          &#x2630;
        </span>
        <span class="text-sm font-medium text-foreground">
          {{ definition?.name ?? widgetId }}
        </span>
      </div>
      <button
        v-if="editMode"
        class="text-muted-foreground hover:text-red-500"
        :title="$t('page.dashboard.removeWidget')"
        @click="emit('remove', widgetId)"
      >
        &times;
      </button>
    </div>

    <!-- Content -->
    <div class="flex-1 overflow-hidden">
      <div v-if="!definition" class="flex h-full items-center justify-center text-muted-foreground">
        Widget unavailable
      </div>
      <div v-else-if="!widgetComponent" class="flex h-full items-center justify-center text-muted-foreground">
        Unknown widget type: {{ definition.widgetType }}
      </div>
      <component
        :is="widgetComponent"
        v-else
        :definition="definition"
      />
    </div>
  </div>
</template>
