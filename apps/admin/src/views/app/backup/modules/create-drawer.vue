<script lang="ts" setup>
import { ref } from 'vue';

import { useVbenDrawer } from '@vben/common-ui';

import {
  Form,
  FormItem,
  Input,
  Select,
  SelectOption,
  Button,
  Space,
  notification,
} from 'ant-design-vue';

import { $t } from '#/locales';
import { useBackupModuleStore, useModuleRegistrationStore } from '#/stores';
import type { Module } from '#/generated/api/admin/service/v1';

const backupStore = useBackupModuleStore();
const moduleRegStore = useModuleRegistrationStore();
const loading = ref(false);
const modules = ref<Module[]>([]);

const formState = ref({
  module_id: '',
  description: '',
});

function resetForm() {
  formState.value = {
    module_id: '',
    description: '',
  };
}

function getSelectedModule() {
  return modules.value.find((m) => m.moduleId === formState.value.module_id);
}

async function handleSubmit() {
  const selected = getSelectedModule();
  if (!selected?.moduleId || !selected?.grpcEndpoint) return;

  loading.value = true;
  try {
    const resp = await backupStore.createBackup({
      target: {
        module_id: selected.moduleId,
        grpc_endpoint: selected.grpcEndpoint,
      },
      description: formState.value.description,
    });
    if (resp.backup.status === 'failed') {
      notification.warning({
        message: `Backup ${resp.backup.status}`,
        description: resp.backup.warnings?.join(', '),
      });
    } else {
      notification.success({
        message: $t('backup.page.module.createSuccess'),
      });
    }
    drawerApi.close();
  } catch (e) {
    console.error('Failed to create backup:', e);
    notification.error({ message: $t('ui.notification.create_failed') });
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
      resetForm();
      modules.value = await moduleRegStore.listModules();
    }
  },
});
</script>

<template>
  <Drawer :title="$t('backup.page.module.create')" :footer="false">
    <Form layout="vertical" :model="formState" @finish="handleSubmit">
      <FormItem
        :label="$t('backup.page.module.moduleId')"
        name="module_id"
        :rules="[{ required: true, message: $t('ui.formRules.required') }]"
      >
        <Select
          v-model:value="formState.module_id"
          :placeholder="$t('backup.page.module.moduleIdPlaceholder')"
          show-search
        >
          <SelectOption
            v-for="mod in modules"
            :key="mod.moduleId"
            :value="mod.moduleId"
          >
            {{ mod.moduleName || mod.moduleId }}
            <span class="text-muted-foreground ml-1 text-xs">
              ({{ mod.grpcEndpoint }})
            </span>
          </SelectOption>
        </Select>
      </FormItem>

      <FormItem
        :label="$t('backup.page.module.description')"
        name="description"
      >
        <Input
          v-model:value="formState.description"
          :placeholder="$t('backup.page.module.descriptionPlaceholder')"
        />
      </FormItem>

      <FormItem>
        <Space>
          <Button type="primary" html-type="submit" :loading="loading">
            {{ $t('backup.page.module.create') }}
          </Button>
        </Space>
      </FormItem>
    </Form>
  </Drawer>
</template>
