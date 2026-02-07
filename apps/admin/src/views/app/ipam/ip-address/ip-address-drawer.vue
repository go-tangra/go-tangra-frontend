<script lang="ts" setup>
import { ref, computed } from 'vue';

import { useVbenDrawer } from '@vben/common-ui';
import { useUserStore } from '@vben/stores';

import {
  Form,
  FormItem,
  Input,
  Button,
  notification,
  Textarea,
  Select,
  Descriptions,
  DescriptionsItem,
  Tag,
} from 'ant-design-vue';

import { type ipamservicev1_IpAddress } from '#/generated/api/admin/service/v1';
import { $t } from '#/locales';
import { useIpamIpAddressStore, useIpamSubnetStore, useIpamDeviceStore } from '#/stores';

const ipAddressStore = useIpamIpAddressStore();
const subnetStore = useIpamSubnetStore();
const deviceStore = useIpamDeviceStore();
const userStore = useUserStore();

const data = ref<{
  mode: 'create' | 'edit' | 'view';
  row?: ipamservicev1_IpAddress;
}>();
const loading = ref(false);
const subnets = ref<Array<{ value: string; label: string }>>([]);
const devices = ref<Array<{ value: string; label: string }>>([]);

const statusOptions = computed(() => [
  { value: 'IP_ADDRESS_STATUS_ACTIVE', label: $t('ipam.enum.addressStatus.active') },
  { value: 'IP_ADDRESS_STATUS_RESERVED', label: $t('ipam.enum.addressStatus.reserved') },
  { value: 'IP_ADDRESS_STATUS_DHCP', label: $t('ipam.enum.addressStatus.dhcp') },
  { value: 'IP_ADDRESS_STATUS_DEPRECATED', label: $t('ipam.enum.addressStatus.deprecated') },
  { value: 'IP_ADDRESS_STATUS_OFFLINE', label: $t('ipam.enum.addressStatus.offline') },
]);

const formState = ref<{
  address: string;
  hostname: string;
  description: string;
  subnetId?: string;
  deviceId?: string;
  status: string;
  macAddress: string;
}>({
  address: '',
  hostname: '',
  description: '',
  subnetId: undefined,
  deviceId: undefined,
  status: 'IP_ADDRESS_STATUS_ACTIVE',
  macAddress: '',
});

const title = computed(() => {
  switch (data.value?.mode) {
    case 'create':
      return $t('ipam.page.ipAddress.create');
    case 'edit':
      return $t('ipam.page.ipAddress.edit');
    default:
      return $t('ipam.page.ipAddress.view');
  }
});

const isCreateMode = computed(() => data.value?.mode === 'create');
const isEditMode = computed(() => data.value?.mode === 'edit');
const isViewMode = computed(() => data.value?.mode === 'view');

function statusToColor(status: string | undefined) {
  switch (status) {
    case 'IP_ADDRESS_STATUS_ACTIVE':
      return '#52C41A';
    case 'IP_ADDRESS_STATUS_RESERVED':
      return '#FAAD14';
    case 'IP_ADDRESS_STATUS_DHCP':
      return '#1890FF';
    case 'IP_ADDRESS_STATUS_DEPRECATED':
      return '#8C8C8C';
    case 'IP_ADDRESS_STATUS_OFFLINE':
      return '#FF4D4F';
    default:
      return '#C9CDD4';
  }
}

function statusToName(status: string | undefined) {
  const option = statusOptions.value.find((o) => o.value === status);
  return option?.label ?? status ?? '';
}

async function loadSubnets() {
  try {
    const resp = await subnetStore.listSubnets({ page: 1, pageSize: 100 });
    subnets.value = (resp.items ?? []).map((s) => ({
      value: s.id ?? '',
      label: `${s.cidr} - ${s.name || 'Unnamed'}`,
    }));
  } catch (e) {
    console.error('Failed to load subnets:', e);
  }
}

async function loadDevices() {
  try {
    const resp = await deviceStore.listDevices({ page: 1, pageSize: 100 });
    devices.value = (resp.items ?? []).map((d) => ({
      value: d.id ?? '',
      label: d.name ?? '',
    }));
  } catch (e) {
    console.error('Failed to load devices:', e);
  }
}

async function handleSubmit() {
  loading.value = true;
  try {
    if (isCreateMode.value) {
      await ipAddressStore.createIpAddress(
        userStore.tenantId as number,
        {
          address: formState.value.address,
          hostname: formState.value.hostname || undefined,
          description: formState.value.description || undefined,
          subnetId: formState.value.subnetId,
          deviceId: formState.value.deviceId,
          status: formState.value.status as any,
          macAddress: formState.value.macAddress || undefined,
        },
      );
      notification.success({
        message: $t('ipam.page.ipAddress.createSuccess'),
      });
    } else if (isEditMode.value && data.value?.row?.id) {
      await ipAddressStore.updateIpAddress(
        data.value.row.id,
        {
          hostname: formState.value.hostname || undefined,
          description: formState.value.description || undefined,
          deviceId: formState.value.deviceId,
          status: formState.value.status as any,
          macAddress: formState.value.macAddress || undefined,
        },
        ['hostname', 'description', 'device_id', 'status', 'mac_address'],
      );
      notification.success({
        message: $t('ipam.page.ipAddress.updateSuccess'),
      });
    }
    drawerApi.close();
  } catch (e) {
    console.error('Failed to save IP address:', e);
    notification.error({
      message: isCreateMode.value
        ? $t('ui.notification.create_failed')
        : $t('ui.notification.update_failed'),
    });
  } finally {
    loading.value = false;
  }
}

function resetForm() {
  formState.value = {
    address: '',
    hostname: '',
    description: '',
    subnetId: undefined,
    deviceId: undefined,
    status: 'IP_ADDRESS_STATUS_ACTIVE',
    macAddress: '',
  };
}

const [Drawer, drawerApi] = useVbenDrawer({
  onCancel() {
    drawerApi.close();
  },

  async onOpenChange(isOpen) {
    if (isOpen) {
      data.value = drawerApi.getData() as {
        mode: 'create' | 'edit' | 'view';
        row?: ipamservicev1_IpAddress;
      };

      await Promise.all([loadSubnets(), loadDevices()]);

      if (data.value?.mode === 'create') {
        resetForm();
      } else if (data.value?.row) {
        formState.value = {
          address: data.value.row.address ?? '',
          hostname: data.value.row.hostname ?? '',
          description: data.value.row.description ?? '',
          subnetId: data.value.row.subnetId,
          deviceId: data.value.row.deviceId,
          status: data.value.row.status ?? 'IP_ADDRESS_STATUS_ACTIVE',
          macAddress: data.value.row.macAddress ?? '',
        };
      }
    }
  },
});

const ipAddress = computed(() => data.value?.row);
</script>

<template>
  <Drawer :title="title" :footer="false">
    <!-- View Mode -->
    <template v-if="ipAddress && isViewMode">
      <Descriptions :column="1" bordered size="small">
        <DescriptionsItem :label="$t('ipam.page.ipAddress.address')">
          <span class="font-mono">{{ ipAddress.address }}</span>
        </DescriptionsItem>
        <DescriptionsItem :label="$t('ipam.page.ipAddress.hostname')">
          {{ ipAddress.hostname || '-' }}
        </DescriptionsItem>
        <DescriptionsItem :label="$t('ipam.page.ipAddress.status')">
          <Tag :color="statusToColor(ipAddress.status)">
            {{ statusToName(ipAddress.status) }}
          </Tag>
        </DescriptionsItem>
        <DescriptionsItem :label="$t('ipam.page.ipAddress.macAddress')">
          {{ ipAddress.macAddress || '-' }}
        </DescriptionsItem>
        <DescriptionsItem :label="$t('ipam.page.ipAddress.description')">
          {{ ipAddress.description || '-' }}
        </DescriptionsItem>
      </Descriptions>
    </template>

    <!-- Create/Edit Mode -->
    <template v-else-if="isCreateMode || isEditMode">
      <Form layout="vertical" :model="formState" @finish="handleSubmit">
        <FormItem
          v-if="isCreateMode"
          :label="$t('ipam.page.ipAddress.address')"
          name="address"
          :rules="[{ required: true, message: $t('ui.formRules.required') }]"
        >
          <Input
            v-model:value="formState.address"
            :placeholder="$t('ui.placeholder.input')"
            :maxlength="45"
          />
        </FormItem>

        <FormItem
          v-if="isCreateMode"
          :label="$t('ipam.page.subnet.title')"
          name="subnetId"
          :rules="[{ required: true, message: $t('ui.formRules.required') }]"
        >
          <Select
            v-model:value="formState.subnetId"
            :options="subnets"
            :placeholder="$t('ui.placeholder.select')"
            show-search
            :filter-option="(input: string, option: any) =>
              option.label.toLowerCase().includes(input.toLowerCase())"
          />
        </FormItem>

        <FormItem :label="$t('ipam.page.ipAddress.hostname')" name="hostname">
          <Input
            v-model:value="formState.hostname"
            :placeholder="$t('ui.placeholder.input')"
            :maxlength="255"
          />
        </FormItem>

        <FormItem :label="$t('ipam.page.ipAddress.status')" name="status">
          <Select
            v-model:value="formState.status"
            :options="statusOptions"
          />
        </FormItem>

        <FormItem :label="$t('ipam.page.device.title')" name="deviceId">
          <Select
            v-model:value="formState.deviceId"
            :options="devices"
            :placeholder="$t('ui.placeholder.select')"
            allow-clear
            show-search
            :filter-option="(input: string, option: any) =>
              option.label.toLowerCase().includes(input.toLowerCase())"
          />
        </FormItem>

        <FormItem :label="$t('ipam.page.ipAddress.macAddress')" name="macAddress">
          <Input
            v-model:value="formState.macAddress"
            :placeholder="$t('ui.placeholder.input')"
            :maxlength="17"
          />
        </FormItem>

        <FormItem :label="$t('ipam.page.ipAddress.description')" name="description">
          <Textarea
            v-model:value="formState.description"
            :rows="3"
            :maxlength="1024"
            :placeholder="$t('ui.placeholder.input')"
          />
        </FormItem>

        <FormItem>
          <Button type="primary" html-type="submit" :loading="loading" block>
            {{ isCreateMode ? $t('ui.button.create', { moduleName: '' }) : $t('ui.button.save') }}
          </Button>
        </FormItem>
      </Form>
    </template>
  </Drawer>
</template>
