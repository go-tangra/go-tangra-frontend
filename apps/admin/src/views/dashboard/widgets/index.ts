import { defineAsyncComponent, type Component } from 'vue';

/**
 * Widget component registry.
 * Maps widget_type strings to pre-created async Vue components.
 * IMPORTANT: defineAsyncComponent must be called once per type (not inside computed/render),
 * otherwise Vue creates a new component instance each render → infinite mount/unmount loop.
 */
const widgetComponents: Record<string, Component> = {
  stat_card: defineAsyncComponent(() => import('./StatCardWidget.vue')),
  pie_chart: defineAsyncComponent(() => import('./PieChartWidget.vue')),
  bar_chart: defineAsyncComponent(() => import('./BarChartWidget.vue')),
  line_chart: defineAsyncComponent(() => import('./LineChartWidget.vue')),
  gauge: defineAsyncComponent(() => import('./GaugeWidget.vue')),
  table: defineAsyncComponent(() => import('./TableWidget.vue')),
  list: defineAsyncComponent(() => import('./ListWidget.vue')),
  area_chart: defineAsyncComponent(() => import('./AreaChartWidget.vue')),
  heatmap: defineAsyncComponent(() => import('./HeatmapWidget.vue')),
  sparkline_card: defineAsyncComponent(() => import('./SparklineCardWidget.vue')),
  trend_card: defineAsyncComponent(() => import('./TrendCardWidget.vue')),
};

/**
 * Returns the async component for a given widget type.
 */
export function getWidgetComponent(widgetType: string): Component | undefined {
  return widgetComponents[widgetType];
}

/**
 * Returns all supported widget types.
 */
export function getSupportedWidgetTypes(): string[] {
  return Object.keys(widgetComponents);
}
