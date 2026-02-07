<script lang="ts" setup>
import { computed } from 'vue';

import { $t } from '@vben/locales';

import { useDashboardStore } from '#/stores';

const dashboardStore = useDashboardStore();

interface ErrorItem {
  id: string;
  message: string;
  source: 'lcm' | 'deployer';
  occurredAt: string;
  details: string;
}

const recentErrors = computed<ErrorItem[]>(() => {
  const lcm = dashboardStore.getLcmStats();
  const deployer = dashboardStore.getDeployerStats();

  const errors: ErrorItem[] = [];

  // Add LCM errors (ensure it's an array)
  const lcmErrors = Array.isArray(lcm?.recentErrors) ? lcm.recentErrors : [];
  for (const error of lcmErrors) {
    errors.push({
      id: error.jobId ?? '',
      message: error.errorMessage ?? $t('page.dashboard.unknownError'),
      source: 'lcm',
      occurredAt: error.occurredAt ?? '',
      details: error.commonName ?? error.issuerName ?? '',
    });
  }

  // Add Deployer errors (ensure it's an array)
  const deployerErrors = Array.isArray(deployer?.recentErrors) ? deployer.recentErrors : [];
  for (const error of deployerErrors) {
    errors.push({
      id: error.jobId ?? '',
      message: error.errorMessage ?? $t('page.dashboard.unknownError'),
      source: 'deployer',
      occurredAt: error.occurredAt ?? '',
      details: error.configurationName ?? error.providerType ?? '',
    });
  }

  // Sort by occurrence time (most recent first)
  return errors.sort((a, b) => {
    const timeA = new Date(a.occurredAt).getTime();
    const timeB = new Date(b.occurredAt).getTime();
    return timeB - timeA;
  }).slice(0, 10);
});

function formatTime(timestamp: string): string {
  if (!timestamp) return '';
  try {
    const date = new Date(timestamp);
    return date.toLocaleString();
  } catch {
    return timestamp;
  }
}

function getSourceColor(source: 'lcm' | 'deployer'): string {
  return source === 'lcm' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800';
}

function getSourceLabel(source: 'lcm' | 'deployer'): string {
  return source === 'lcm' ? 'LCM' : 'Deployer';
}
</script>

<template>
  <div class="max-h-64 overflow-y-auto">
    <div v-if="recentErrors.length === 0" class="py-8 text-center text-gray-500">
      {{ $t('page.dashboard.noRecentErrors') }}
    </div>
    <div v-else class="space-y-2">
      <div
        v-for="error in recentErrors"
        :key="error.id"
        class="rounded-lg border border-red-100 bg-red-50 p-3"
      >
        <div class="flex items-start justify-between">
          <div class="flex-1">
            <div class="flex items-center gap-2">
              <span
                :class="[
                  'rounded px-2 py-0.5 text-xs font-medium',
                  getSourceColor(error.source),
                ]"
              >
                {{ getSourceLabel(error.source) }}
              </span>
              <span class="text-xs text-gray-500">
                {{ formatTime(error.occurredAt) }}
              </span>
            </div>
            <div class="mt-1 text-sm text-red-700">
              {{ error.message }}
            </div>
            <div v-if="error.details" class="mt-1 text-xs text-gray-600">
              {{ error.details }}
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
