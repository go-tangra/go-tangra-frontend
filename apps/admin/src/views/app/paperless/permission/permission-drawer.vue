<script lang="ts" setup>
import type { VxeGridProps } from '#/adapter/vxe-table';

import { h, ref, computed } from 'vue';

import { useVbenDrawer, type VbenFormProps, useVbenForm } from '@vben/common-ui';
import { LucideTrash, LucidePlus } from '@vben/icons';

import { notification, Button, Modal, Tag, Divider } from 'ant-design-vue';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { type paperlessservicev1_PermissionTuple } from '#/generated/api/admin/service/v1';
import { $t } from '#/locales';
import { usePaperlessPermissionStore, useUserListStore, useRoleStore } from '#/stores';

const permissionStore = usePaperlessPermissionStore();
const userStore = useUserListStore();
const roleStore = useRoleStore();

const [Drawer, drawerApi] = useVbenDrawer({
  onOpenChange(isOpen) {
    if (isOpen) {
      const data = drawerApi.getData<{
        resourceType: string;
        resourceId: string;
        resourceName: string;
      }>();

      if (data) {
        resourceType.value = data.resourceType;
        resourceId.value = data.resourceId;
        resourceName.value = data.resourceName;
      }

      loadPermissions();
      loadUsers();
      loadRoles();
    }
  },
});

const resourceType = ref('');
const resourceId = ref('');
const resourceName = ref('');
const showGrantForm = ref(false);
const submitting = ref(false);

const users = ref<Array<{ value: string; label: string }>>([]);
const roles = ref<Array<{ value: string; label: string }>>([]);

async function loadUsers() {
  try {
    const resp = await userStore.listUser(undefined, { status: 'NORMAL' });
    users.value = (resp.items ?? []).map((u: { id?: number; realname?: string; nickname?: string; username?: string }) => ({
      value: String(u.id ?? ''),
      label: `${u.realname || u.nickname || u.username} (${u.username})`,
    }));
  } catch (e) {
    console.error('Failed to load users:', e);
  }
}

async function loadRoles() {
  try {
    const resp = await roleStore.listRole(undefined, {});
    roles.value = (resp.items ?? []).map((r: { id?: number; name?: string }) => ({
      value: String(r.id ?? ''),
      label: r.name ?? '',
    }));
  } catch (e) {
    console.error('Failed to load roles:', e);
  }
}

const drawerTitle = computed(() => {
  return `${$t('paperless.page.permission.title')} - ${resourceName.value}`;
});

// Permission list
const gridOptions: VxeGridProps<paperlessservicev1_PermissionTuple> = {
  height: 300,
  stripe: false,
  rowConfig: {
    isHover: true,
  },
  pagerConfig: {
    enabled: true,
    pageSize: 10,
    pageSizes: [10, 20, 50],
  },

  proxyConfig: {
    ajax: {
      query: async ({ page }) => {
        if (!resourceType.value || !resourceId.value) {
          return { items: [], total: 0 };
        }
        const resp = await permissionStore.listPermissions(
          resourceType.value as any,
          resourceId.value,
          { page: page.currentPage, pageSize: page.pageSize },
        );
        return {
          items: resp.permissions ?? [],
          total: resp.total ?? 0,
        };
      },
    },
  },

  columns: [
    {
      title: $t('paperless.page.permission.subjectType'),
      field: 'subjectType',
      width: 100,
      slots: { default: 'subjectType' },
    },
    {
      title: $t('paperless.page.permission.subject'),
      field: 'subjectId',
      minWidth: 150,
    },
    {
      title: $t('paperless.page.permission.relation'),
      field: 'relation',
      width: 100,
      slots: { default: 'relation' },
    },
    {
      title: $t('ui.table.action'),
      field: 'action',
      fixed: 'right',
      slots: { default: 'action' },
      width: 80,
    },
  ],
};

const [Grid, gridApi] = useVbenVxeGrid({ gridOptions });

async function loadPermissions() {
  await gridApi.reload();
}

// Grant form
const grantFormSchema: VbenFormProps['schema'] = [
  {
    component: 'Select',
    fieldName: 'subjectType',
    defaultValue: 'SUBJECT_TYPE_USER',
    label: $t('paperless.page.permission.subjectType'),
    rules: 'required',
    componentProps: {
      placeholder: $t('ui.placeholder.select'),
      options: [
        { value: 'SUBJECT_TYPE_USER', label: $t('paperless.page.permission.user') },
        { value: 'SUBJECT_TYPE_ROLE', label: $t('paperless.page.permission.role') },
      ],
      onChange: () => {
        grantFormApi.setFieldValue('subjectId', undefined);
      },
    },
  },
  {
    component: 'Select',
    fieldName: 'subjectId',
    label: $t('paperless.page.permission.subject'),
    rules: 'required',
    dependencies: {
      triggerFields: ['subjectType'],
    },
    componentProps: ({ values }) => {
      const isUser = values.subjectType === 'SUBJECT_TYPE_USER';
      return {
        placeholder: $t('ui.placeholder.select'),
        options: isUser ? users.value : roles.value,
        showSearch: true,
        filterOption: (input: string, option: any) =>
          option.label.toLowerCase().includes(input.toLowerCase()),
      };
    },
  },
  {
    component: 'Select',
    fieldName: 'relation',
    defaultValue: 'RELATION_VIEWER',
    label: $t('paperless.page.permission.relation'),
    rules: 'required',
    componentProps: {
      placeholder: $t('ui.placeholder.select'),
      options: [
        { value: 'RELATION_OWNER', label: $t('paperless.page.permission.owner') },
        { value: 'RELATION_EDITOR', label: $t('paperless.page.permission.editor') },
        { value: 'RELATION_SHARER', label: $t('paperless.page.permission.sharer') },
        { value: 'RELATION_VIEWER', label: $t('paperless.page.permission.viewer') },
      ],
    },
  },
];

const [GrantForm, grantFormApi] = useVbenForm({
  schema: grantFormSchema,
  showDefaultActions: false,
});

async function handleGrantAccess() {
  try {
    const result = await grantFormApi.validate();
    const values = result as unknown as {
      subjectType: string;
      subjectId: string;
      relation: string;
    };
    submitting.value = true;

    await permissionStore.grantAccess({
      resourceType: resourceType.value as any,
      resourceId: resourceId.value,
      subjectType: values.subjectType as any,
      subjectId: values.subjectId,
      relation: values.relation as any,
    });

    notification.success({ message: $t('paperless.page.permission.grantSuccess') });
    showGrantForm.value = false;
    grantFormApi.resetForm();
    await loadPermissions();
  } catch (error: any) {
    notification.error({
      message: $t('ui.notification.operation_failed'),
      description: error.message,
    });
  } finally {
    submitting.value = false;
  }
}

async function handleRevokeAccess(row: paperlessservicev1_PermissionTuple) {
  Modal.confirm({
    title: $t('paperless.page.permission.revokeAccess'),
    content: $t('paperless.page.permission.revokeConfirm'),
    okText: $t('ui.button.ok'),
    cancelText: $t('ui.button.cancel'),
    onOk: async () => {
      try {
        await permissionStore.revokeAccess(
          row.resourceType as any,
          row.resourceId!,
          row.subjectType as any,
          row.subjectId!,
          row.relation as any,
        );
        notification.success({ message: $t('paperless.page.permission.revokeSuccess') });
        await loadPermissions();
      } catch {
        notification.error({ message: $t('ui.notification.operation_failed') });
      }
    },
  });
}

function getSubjectTypeLabel(subjectType: string | undefined): string {
  switch (subjectType) {
    case 'SUBJECT_TYPE_USER':
      return $t('paperless.page.permission.user');
    case 'SUBJECT_TYPE_ROLE':
      return $t('paperless.page.permission.role');
    case 'SUBJECT_TYPE_TENANT':
      return $t('paperless.page.permission.tenant');
    default:
      return '-';
  }
}

function getRelationLabel(relation: string | undefined): string {
  switch (relation) {
    case 'RELATION_OWNER':
      return $t('paperless.page.permission.owner');
    case 'RELATION_EDITOR':
      return $t('paperless.page.permission.editor');
    case 'RELATION_SHARER':
      return $t('paperless.page.permission.sharer');
    case 'RELATION_VIEWER':
      return $t('paperless.page.permission.viewer');
    default:
      return '-';
  }
}

function getRelationColor(relation: string | undefined): string {
  switch (relation) {
    case 'RELATION_OWNER':
      return 'red';
    case 'RELATION_EDITOR':
      return 'orange';
    case 'RELATION_SHARER':
      return 'blue';
    case 'RELATION_VIEWER':
      return 'green';
    default:
      return 'default';
  }
}
</script>

<template>
  <Drawer :title="drawerTitle" class="w-[700px]">
    <div class="mb-4 flex items-center justify-between">
      <span class="text-lg font-medium">{{ $t('paperless.page.permission.title') }}</span>
      <Button
        v-if="!showGrantForm"
        type="primary"
        :icon="h(LucidePlus)"
        @click="showGrantForm = true"
      >
        {{ $t('paperless.page.permission.grantAccess') }}
      </Button>
    </div>

    <!-- Grant Access Form -->
    <div v-if="showGrantForm" class="mb-4 rounded border p-4">
      <GrantForm />
      <div class="mt-4 flex justify-end gap-2">
        <Button @click="showGrantForm = false">
          {{ $t('ui.button.cancel') }}
        </Button>
        <Button type="primary" :loading="submitting" @click="handleGrantAccess">
          {{ $t('paperless.page.permission.grant') }}
        </Button>
      </div>
    </div>

    <Divider v-if="showGrantForm" />

    <!-- Permissions List -->
    <Grid>
      <template #subjectType="{ row }">
        <Tag>{{ getSubjectTypeLabel(row.subjectType) }}</Tag>
      </template>
      <template #relation="{ row }">
        <Tag :color="getRelationColor(row.relation)">
          {{ getRelationLabel(row.relation) }}
        </Tag>
      </template>
      <template #action="{ row }">
        <Button
          danger
          type="link"
          size="small"
          :icon="h(LucideTrash)"
          :title="$t('paperless.page.permission.revokeAccess')"
          @click="handleRevokeAccess(row)"
        />
      </template>
    </Grid>

    <template #footer>
      <div class="flex justify-end">
        <Button @click="drawerApi.close()">
          {{ $t('ui.button.close') }}
        </Button>
      </div>
    </template>
  </Drawer>
</template>
