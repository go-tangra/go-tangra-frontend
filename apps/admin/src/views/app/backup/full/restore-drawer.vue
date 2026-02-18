<script lang="ts" setup>
import { ref, computed } from 'vue';

import { useVbenDrawer } from '@vben/common-ui';

import {
  Form,
  FormItem,
  Select,
  SelectOption,
  Button,
  Space,
  Tag,
  notification,
} from 'ant-design-vue';

import { $t } from '#/locales';
import { useBackupFullStore, useModuleRegistrationStore } from '#/stores';
import type { FullBackupInfo } from '#/generated/api/modules/backup/services';
import type { Module } from '#/generated/api/admin/service/v1';

const fullStore = useBackupFullStore();
const moduleRegStore = useModuleRegistrationStore();
const loading = ref(false);
const modules = ref<Module[]>([]);

const data = ref<{ row?: FullBackupInfo }>();

const formState = ref({
  mode: 'RESTORE_MODE_SKIP' as 'RESTORE_MODE_OVERWRITE' | 'RESTORE_MODE_SKIP',
});

const backup = computed(() => data.value?.row);

const moduleTargets = computed(() => {
  if (!backup.value?.module_backups) return [];
  return backup.value.module_backups.map((mb) => {
    const registered = modules.value.find((m) => m.moduleId === mb.module_id);
    return {
      module_id: mb.module_id,
      grpc_endpoint: registered?.grpcEndpoint ?? '',
      found: !!registered,
    };
  });
});

const allModulesResolved = computed(() =>
  moduleTargets.value.every((t) => t.found && t.grpc_endpoint),
);

async function handleSubmit() {
  if (!backup.value?.id || !allModulesResolved.value) return;

  const targets = moduleTargets.value
    .filter((t) => t.grpc_endpoint)
    .map((t) => ({
      module_id: t.module_id,
      grpc_endpoint: t.grpc_endpoint,
    }));

  if (targets.length === 0) return;

  loading.value = true;
  try {
    const resp = await fullStore.restoreFullBackup(backup.value.id, {
      targets,
      mode: formState.value.mode,
    });
    if (resp.success) {
      notification.success({
        message: $t('backup.page.full.restoreSuccess'),
      });
    } else {
      notification.warning({
        message: 'Restore completed with issues',
        description: resp.module_results
          ?.filter((r) => !r.success)
          .map((r) => `${r.module_id}: ${r.error}`)
          .join(', '),
      });
    }
    drawerApi.close();
  } catch (e) {
    console.error('Failed to restore full backup:', e);
    notification.error({ message: 'Restore failed' });
  } finally {
    loading.value = false;
  }
}

const [Drawer, drawerApi] = useVbenDrawer({
  onCancel() {
    drawerApi.close();
  },
  async onOpenChange(isOpen) {
    if (isOpen) {
      data.value = drawerApi.getData() as { row?: FullBackupInfo };
      formState.value = {
        mode: 'RESTORE_MODE_SKIP',
      };
      modules.value = await moduleRegStore.listModules();
    }
  },
});
</script>

<template>
  <Drawer :title="$t('backup.page.full.restore')" :footer="false">
    <template v-if="backup">
      <div class="mb-4">
        <span class="text-muted-foreground">{{ backup.id }}</span>
      </div>

      <div class="mb-4">
        <span class="mb-2 block font-medium">
          {{ $t('backup.page.full.targets') }}
        </span>
        <div class="flex flex-col gap-1">
          <div
            v-for="target in moduleTargets"
            :key="target.module_id"
            class="flex items-center gap-2"
          >
            <Tag :color="target.found ? 'blue' : 'red'">
              {{ target.module_id }}
            </Tag>
            <span v-if="target.found" class="text-muted-foreground text-xs">
              {{ target.grpc_endpoint }}
            </span>
            <span v-else class="text-xs text-red-500">
              Module not registered
            </span>
          </div>
        </div>
      </div>

      <Form layout="vertical" :model="formState" @finish="handleSubmit">
        <FormItem
          :label="$t('backup.page.module.restoreMode')"
          name="mode"
        >
          <Select v-model:value="formState.mode">
            <SelectOption value="RESTORE_MODE_SKIP">
              {{ $t('backup.page.module.restoreModeSkip') }}
            </SelectOption>
            <SelectOption value="RESTORE_MODE_OVERWRITE">
              {{ $t('backup.page.module.restoreModeOverwrite') }}
            </SelectOption>
          </Select>
        </FormItem>

        <FormItem>
          <Space>
            <Button
              type="primary"
              html-type="submit"
              :loading="loading"
              :disabled="!allModulesResolved"
            >
              {{ $t('backup.page.full.restore') }}
            </Button>
          </Space>
        </FormItem>
      </Form>
    </template>
  </Drawer>
</template>
