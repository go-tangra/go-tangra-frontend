import { computed } from 'vue';

import { $t } from '@vben/locales';

import { defineStore } from 'pinia';

import {
  type DeliveryStatus,
  NotificationService,
  type SendNotificationRequest,
} from '#/generated/api/modules/notification/services';

export const useNotificationLogStore = defineStore(
  'notification-log',
  () => {
    async function listNotifications(params?: {
      page?: number;
      pageSize?: number;
      status?: string;
      channelType?: string;
    }) {
      return await NotificationService.list(params);
    }

    async function getNotification(id: string) {
      return await NotificationService.get(id);
    }

    async function sendNotification(data: SendNotificationRequest) {
      return await NotificationService.send(data);
    }

    function $reset() {}

    return {
      $reset,
      listNotifications,
      getNotification,
      sendNotification,
    };
  },
);

export const deliveryStatusList = computed(() => [
  {
    value: 'DELIVERY_STATUS_PENDING',
    label: $t('page.notification.deliveryStatus.PENDING'),
  },
  {
    value: 'DELIVERY_STATUS_SENT',
    label: $t('page.notification.deliveryStatus.SENT'),
  },
  {
    value: 'DELIVERY_STATUS_FAILED',
    label: $t('page.notification.deliveryStatus.FAILED'),
  },
]);

export function deliveryStatusLabel(value: DeliveryStatus): string {
  const values = deliveryStatusList.value;
  const matchedItem = values.find((item) => item.value === value);
  return matchedItem ? matchedItem.label : '';
}

const DELIVERY_STATUS_COLOR_MAP: Record<string, string> = {
  DELIVERY_STATUS_PENDING: '#F77234',
  DELIVERY_STATUS_SENT: '#00B42A',
  DELIVERY_STATUS_FAILED: '#F53F3F',
  DEFAULT: '#C9CDD4',
};

export function deliveryStatusColor(status: DeliveryStatus): string {
  return (
    DELIVERY_STATUS_COLOR_MAP[status] || DELIVERY_STATUS_COLOR_MAP.DEFAULT!
  );
}
