import { computed } from 'vue';

import { $t } from '@vben/locales';

import { defineStore } from 'pinia';

import {
  ChannelService,
  type ChannelType,
  type CreateChannelRequest,
  type UpdateChannelRequest,
} from '#/generated/api/modules/notification/services';

export const useNotificationChannelStore = defineStore(
  'notification-channel',
  () => {
    async function listChannels(params?: {
      page?: number;
      pageSize?: number;
    }) {
      return await ChannelService.list(params);
    }

    async function getChannel(id: string) {
      return await ChannelService.get(id);
    }

    async function createChannel(data: CreateChannelRequest) {
      return await ChannelService.create(data);
    }

    async function updateChannel(id: string, data: UpdateChannelRequest) {
      return await ChannelService.update(id, data);
    }

    async function deleteChannel(id: string) {
      return await ChannelService.delete(id);
    }

    function $reset() {}

    return {
      $reset,
      listChannels,
      getChannel,
      createChannel,
      updateChannel,
      deleteChannel,
    };
  },
);

export const channelTypeList = computed(() => [
  {
    value: 'CHANNEL_TYPE_EMAIL',
    label: $t('page.notification.channelType.EMAIL'),
  },
  {
    value: 'CHANNEL_TYPE_SMS',
    label: $t('page.notification.channelType.SMS'),
  },
  {
    value: 'CHANNEL_TYPE_SLACK',
    label: $t('page.notification.channelType.SLACK'),
  },
  {
    value: 'CHANNEL_TYPE_SSE',
    label: $t('page.notification.channelType.SSE'),
  },
]);

export function channelTypeLabel(value: ChannelType): string {
  const values = channelTypeList.value;
  const matchedItem = values.find((item) => item.value === value);
  return matchedItem ? matchedItem.label : '';
}

const CHANNEL_TYPE_COLOR_MAP: Record<string, string> = {
  CHANNEL_TYPE_EMAIL: '#165DFF',
  CHANNEL_TYPE_SMS: '#00B42A',
  CHANNEL_TYPE_SLACK: '#722ED1',
  CHANNEL_TYPE_SSE: '#F77234',
  DEFAULT: '#C9CDD4',
};

export function channelTypeColor(type: ChannelType): string {
  return CHANNEL_TYPE_COLOR_MAP[type] || CHANNEL_TYPE_COLOR_MAP.DEFAULT!;
}
