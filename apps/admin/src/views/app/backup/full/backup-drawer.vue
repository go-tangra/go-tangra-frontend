<script lang="ts" setup>
import { ref, computed } from 'vue';

import { useVbenDrawer } from '@vben/common-ui';

import {
  Descriptions,
  DescriptionsItem,
  Tag,
  Space,
  Collapse,
  CollapsePanel,
} from 'ant-design-vue';

import { $t } from '#/locales';
import type {
  FullBackupInfo,
  BackupInfo,
} from '#/generated/api/modules/backup/services';

const data = ref<{ row?: FullBackupInfo }>();

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

function entityCountEntries(backup: BackupInfo) {
  if (!backup.entity_counts) return [];
  return Object.entries(backup.entity_counts);
}

const [Drawer, drawerApi] = useVbenDrawer({
  onCancel() {
    drawerApi.close();
  },
  async onOpenChange(isOpen) {
    if (isOpen) {
      data.value = drawerApi.getData() as { row?: FullBackupInfo };
    }
  },
});

const backup = computed(() => data.value?.row);
</script>

<template>
  <Drawer :title="$t('backup.page.full.view')" :footer="false">
    <template v-if="backup">
      <Descriptions :column="1" bordered size="small">
        <DescriptionsItem label="ID">
          {{ backup.id }}
        </DescriptionsItem>
        <DescriptionsItem :label="$t('backup.page.full.description')">
          {{ backup.description || '-' }}
        </DescriptionsItem>
        <DescriptionsItem :label="$t('backup.page.full.status')">
          <Tag :color="statusColor(backup.status)">{{ backup.status }}</Tag>
        </DescriptionsItem>
        <DescriptionsItem :label="$t('backup.page.full.totalSize')">
          {{ formatBytes(backup.total_size_bytes) }}
        </DescriptionsItem>
        <DescriptionsItem :label="$t('backup.page.module.tenantId')">
          {{ backup.tenant_id }}
        </DescriptionsItem>
        <DescriptionsItem :label="$t('backup.page.module.fullBackup')">
          <Tag :color="backup.full_backup ? 'green' : 'default'">
            {{ backup.full_backup ? 'Yes' : 'No' }}
          </Tag>
        </DescriptionsItem>
        <DescriptionsItem :label="$t('backup.page.full.createdBy')">
          {{ backup.created_by || '-' }}
        </DescriptionsItem>
        <DescriptionsItem :label="$t('backup.page.full.createdAt')">
          {{ backup.created_at || '-' }}
        </DescriptionsItem>
        <DescriptionsItem
          v-if="backup.errors && backup.errors.length"
          :label="$t('backup.page.full.errors')"
        >
          <Tag v-for="(e, i) in backup.errors" :key="i" color="red">
            {{ e }}
          </Tag>
        </DescriptionsItem>
      </Descriptions>

      <div
        v-if="backup.module_backups && backup.module_backups.length"
        class="mt-4"
      >
        <h4 class="mb-2 font-medium">
          {{ $t('backup.page.full.moduleBackups') }}
        </h4>
        <Collapse>
          <CollapsePanel
            v-for="mb in backup.module_backups"
            :key="mb.id"
            :header="mb.module_id"
          >
            <Descriptions :column="1" bordered size="small">
              <DescriptionsItem label="ID">{{ mb.id }}</DescriptionsItem>
              <DescriptionsItem :label="$t('backup.page.module.status')">
                <Tag :color="statusColor(mb.status)">{{ mb.status }}</Tag>
              </DescriptionsItem>
              <DescriptionsItem :label="$t('backup.page.module.sizeBytes')">
                {{ formatBytes(mb.size_bytes) }}
              </DescriptionsItem>
              <DescriptionsItem :label="$t('backup.page.module.version')">
                {{ mb.version || '-' }}
              </DescriptionsItem>
              <DescriptionsItem :label="$t('backup.page.module.entityCounts')">
                <Space v-if="entityCountEntries(mb).length" wrap>
                  <Tag
                    v-for="[key, count] in entityCountEntries(mb)"
                    :key="key"
                  >
                    {{ key }}: {{ count }}
                  </Tag>
                </Space>
                <span v-else>-</span>
              </DescriptionsItem>
              <DescriptionsItem
                v-if="mb.warnings && mb.warnings.length"
                :label="$t('backup.page.module.warnings')"
              >
                <Tag
                  v-for="(w, i) in mb.warnings"
                  :key="i"
                  color="orange"
                >
                  {{ w }}
                </Tag>
              </DescriptionsItem>
            </Descriptions>
          </CollapsePanel>
        </Collapse>
      </div>
    </template>
  </Drawer>
</template>
