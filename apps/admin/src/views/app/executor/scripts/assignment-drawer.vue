<script lang="ts" setup>
import { ref, computed } from 'vue';

import { useVbenDrawer } from '@vben/common-ui';

import {
  Form,
  FormItem,
  Input,
  Button,
  notification,
  Table,
  Space,
  Popconfirm,
  Tag,
} from 'ant-design-vue';

import { $t } from '#/locales';
import { useExecutorAssignmentStore } from '#/stores';
import type {
  Script,
  ScriptAssignment,
} from '#/generated/api/modules/executor/services';

const assignmentStore = useExecutorAssignmentStore();

const script = ref<Script>();
const assignments = ref<ScriptAssignment[]>([]);
const assignmentsLoading = ref(false);
const loading = ref(false);
const showAssignForm = ref(false);
const formState = ref({ clientId: '' });

const title = computed(
  () =>
    `${$t('executor.page.assignment.title')} - ${script.value?.name ?? ''}`,
);

const columns = computed(() => [
  {
    title: $t('executor.page.assignment.clientId'),
    dataIndex: 'clientId',
    key: 'clientId',
  },
  {
    title: $t('executor.page.script.createdAt'),
    dataIndex: 'createTime',
    key: 'createTime',
    width: 180,
  },
  {
    title: '',
    key: 'actions',
    width: 100,
  },
]);

async function loadAssignments() {
  if (!script.value) return;
  assignmentsLoading.value = true;
  try {
    const resp = await assignmentStore.listAssignments(script.value.id);
    assignments.value = resp.assignments ?? [];
  } catch (e) {
    console.error('Failed to load assignments:', e);
    assignments.value = [];
  } finally {
    assignmentsLoading.value = false;
  }
}

async function handleAssign() {
  if (!script.value || !formState.value.clientId) return;
  loading.value = true;
  try {
    await assignmentStore.assignScript(
      script.value.id,
      formState.value.clientId,
    );
    notification.success({
      message: $t('executor.page.assignment.assignSuccess'),
    });
    showAssignForm.value = false;
    formState.value.clientId = '';
    await loadAssignments();
  } catch (e) {
    console.error('Failed to assign script:', e);
    notification.error({ message: $t('ui.notification.create_failed') });
  } finally {
    loading.value = false;
  }
}

async function handleUnassign(clientId: string) {
  if (!script.value) return;
  try {
    await assignmentStore.unassignScript(script.value.id, clientId);
    notification.success({
      message: $t('executor.page.assignment.unassignSuccess'),
    });
    await loadAssignments();
  } catch (e) {
    console.error('Failed to unassign script:', e);
  }
}

const [Drawer, drawerApi] = useVbenDrawer({
  onCancel() {
    drawerApi.close();
  },

  async onOpenChange(isOpen) {
    if (isOpen) {
      const drawerData = drawerApi.getData() as { script: Script };
      script.value = drawerData.script;
      showAssignForm.value = false;
      formState.value.clientId = '';
      await loadAssignments();
    }
  },
});
</script>

<template>
  <Drawer :title="title" :footer="false">
    <div class="mb-3 flex items-center justify-between">
      <Tag color="blue">
        {{ assignments.length }}
        {{ $t('executor.page.assignment.title').toLowerCase() }}
      </Tag>
      <Button
        size="small"
        type="primary"
        @click="showAssignForm = !showAssignForm"
      >
        {{ $t('executor.page.assignment.assign') }}
      </Button>
    </div>

    <!-- Assign Form -->
    <div
      v-if="showAssignForm"
      class="mb-4 rounded border border-gray-200 p-3"
    >
      <Form layout="vertical" :model="formState" @finish="handleAssign">
        <FormItem
          :label="$t('executor.page.assignment.clientId')"
          name="clientId"
          :rules="[{ required: true, message: $t('ui.formRules.required') }]"
        >
          <Input
            v-model:value="formState.clientId"
            :placeholder="$t('executor.page.assignment.clientIdPlaceholder')"
          />
        </FormItem>
        <Space>
          <Button
            type="primary"
            html-type="submit"
            :loading="loading"
            size="small"
          >
            {{ $t('executor.page.assignment.assign') }}
          </Button>
          <Button size="small" @click="showAssignForm = false">
            {{ $t('ui.actionTitle.cancel') }}
          </Button>
        </Space>
      </Form>
    </div>

    <!-- Assignments Table -->
    <Table
      :columns="columns"
      :data-source="assignments"
      :loading="assignmentsLoading"
      :pagination="false"
      size="small"
      row-key="id"
    >
      <template #bodyCell="{ column, record }">
        <template v-if="column.key === 'clientId'">
          <span class="font-mono text-xs">{{ record.clientId }}</span>
        </template>
        <template v-else-if="column.key === 'actions'">
          <Popconfirm
            :title="$t('executor.page.assignment.confirmUnassign')"
            @confirm="handleUnassign(record.clientId)"
          >
            <Button type="link" danger size="small">
              {{ $t('executor.page.assignment.unassign') }}
            </Button>
          </Popconfirm>
        </template>
      </template>
    </Table>
  </Drawer>
</template>
