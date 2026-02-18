<script lang="ts" setup>
import { ref, computed } from 'vue';

import { useVbenDrawer } from '@vben/common-ui';

import { Descriptions, DescriptionsItem, Tag, Space } from 'ant-design-vue';

import { $t } from '#/locales';
import type { BackupInfo } from '#/generated/api/modules/backup/services';

const data = ref<{ row?: BackupInfo }>();

function formatBytes(bytes: number): string {
  if (!bytes || bytes === 0) return '0 B';
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / 1024 ** i).toFixed(1)} ${sizes[i]}`;
}

function statusColor(status: string) {
  switch (status) {
    case 'completed': {
      return 'green';
    }
    case 'failed': {
      return 'red';
    }
    default: {
      return 'default';
    }
  }
}

const [Drawer, drawerApi] = useVbenDrawer({
  onCancel() {
    drawerApi.close();
  },
  async onOpenChange(isOpen) {
    if (isOpen) {
      data.value = drawerApi.getData() as { row?: BackupInfo };
    }
  },
});

const backup = computed(() => data.value?.row);

const entityCountEntries = computed(() => {
  if (!backup.value?.entity_counts) return [];
  return Object.entries(backup.value.entity_counts);
});
</script>

<template>
  <Drawer :title="$t('backup.page.module.view')" :footer="false">
    <template v-if="backup">
      <Descriptions :column="1" bordered size="small">
        <DescriptionsItem label="ID">
          {{ backup.id }}
        </DescriptionsItem>
        <DescriptionsItem :label="$t('backup.page.module.moduleId')">
          <Tag color="blue">{{ backup.module_id }}</Tag>
        </DescriptionsItem>
        <DescriptionsItem :label="$t('backup.page.module.description')">
          {{ backup.description || '-' }}
        </DescriptionsItem>
        <DescriptionsItem :label="$t('backup.page.module.status')">
          <Tag :color="statusColor(backup.status)">{{ backup.status }}</Tag>
        </DescriptionsItem>
        <DescriptionsItem :label="$t('backup.page.module.sizeBytes')">
          {{ formatBytes(backup.size_bytes) }}
        </DescriptionsItem>
        <DescriptionsItem :label="$t('backup.page.module.version')">
          {{ backup.version || '-' }}
        </DescriptionsItem>
        <DescriptionsItem :label="$t('backup.page.module.tenantId')">
          {{ backup.tenant_id }}
        </DescriptionsItem>
        <DescriptionsItem :label="$t('backup.page.module.fullBackup')">
          <Tag :color="backup.full_backup ? 'green' : 'default'">
            {{ backup.full_backup ? 'Yes' : 'No' }}
          </Tag>
        </DescriptionsItem>
        <DescriptionsItem :label="$t('backup.page.module.entityCounts')">
          <Space v-if="entityCountEntries.length" wrap>
            <Tag v-for="[key, count] in entityCountEntries" :key="key">
              {{ key }}: {{ count }}
            </Tag>
          </Space>
          <span v-else>-</span>
        </DescriptionsItem>
        <DescriptionsItem :label="$t('backup.page.module.createdBy')">
          {{ backup.created_by || '-' }}
        </DescriptionsItem>
        <DescriptionsItem :label="$t('backup.page.module.createdAt')">
          {{ backup.created_at || '-' }}
        </DescriptionsItem>
        <DescriptionsItem
          v-if="backup.warnings && backup.warnings.length"
          :label="$t('backup.page.module.warnings')"
        >
          <Tag v-for="(w, i) in backup.warnings" :key="i" color="orange">
            {{ w }}
          </Tag>
        </DescriptionsItem>
      </Descriptions>
    </template>
  </Drawer>
</template>
