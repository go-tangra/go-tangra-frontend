import { computed } from 'vue';

import { $t } from '@vben/locales';
import { useAccessStore, useUserStore } from '@vben/stores';

import { defineStore } from 'pinia';

const MODULE_BASE_URL = '/admin/v1/modules/notification';

/**
 * Internal message types - matches notification.service.v1 proto definitions
 */
export type InternalMessage_Status =
  | 'ARCHIVED'
  | 'DELETED'
  | 'DRAFT'
  | 'PUBLISHED'
  | 'REVOKED'
  | 'SCHEDULED';

export type InternalMessage_Type = 'GROUP' | 'NOTIFICATION' | 'PRIVATE';

export type InternalMessageRecipient_Status =
  | 'DELETED'
  | 'READ'
  | 'RECEIVED'
  | 'REVOKED'
  | 'SENT';

export interface InternalMessageRecipient {
  content?: string;
  createdAt?: string;
  id?: number;
  messageId?: number;
  readAt?: string;
  recipientUserId?: number;
  status?: InternalMessageRecipient_Status;
  title?: string;
}

export interface SendMessageRequest {
  categoryId?: number;
  content: string;
  targetAll?: boolean;
  targetUserIds?: number[];
  title?: string;
  type?: InternalMessage_Type;
}

async function moduleRequest(
  path: string,
  method: string,
  body?: unknown,
): Promise<unknown> {
  const accessStore = useAccessStore();
  const token = (accessStore as any).accessToken;

  const response = await fetch(`${MODULE_BASE_URL}/${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : null,
  });

  if (!response.ok) {
    let message = `HTTP error! status: ${response.status}`;
    try {
      const errorBody = await response.json();
      if (errorBody?.message) {
        message = errorBody.message;
      }
    } catch {}
    throw new Error(message);
  }

  const text = await response.text();
  return text ? JSON.parse(text) : {};
}

export const useInternalMessageStore = defineStore('internal_message', () => {
  const userStore = useUserStore();

  async function listMessage(
    paging?: { page?: number; pageSize?: number },
    formValues?: null | object,
  ) {
    const queryParts: string[] = [];
    if (paging?.page)
      queryParts.push(`page=${paging.page}`);
    if (paging?.pageSize)
      queryParts.push(`pageSize=${paging.pageSize}`);
    if (formValues) {
      for (const [key, val] of Object.entries(formValues)) {
        if (val !== undefined && val !== null && val !== '') {
          queryParts.push(`query=${encodeURIComponent(`${key}=${val}`)}`);
        }
      }
    }
    const qs = queryParts.length > 0 ? `?${queryParts.join('&')}` : '';
    return (await moduleRequest(
      `v1/internal-message/messages${qs}`,
      'GET',
    )) as any;
  }

  async function getMessage(id: number) {
    return (await moduleRequest(
      `v1/internal-message/messages/${id}`,
      'GET',
    )) as any;
  }

  async function updateMessage(id: number, values: object) {
    return await moduleRequest(
      `v1/internal-message/messages/${id}`,
      'PUT',
      {
        id,
        data: { ...values },
        updateMask: { paths: Object.keys(values ?? {}) },
      },
    );
  }

  async function deleteMessage(id: number) {
    return await moduleRequest(
      `v1/internal-message/messages/${id}`,
      'DELETE',
    );
  }

  async function listUserInbox(
    paging?: { page?: number; pageSize?: number },
    formValues?: null | object,
    _fieldMask?: null | string,
    orderBy?: null | string[],
  ) {
    const queryParts: string[] = [];
    if (paging?.page)
      queryParts.push(`page=${paging.page}`);
    if (paging?.pageSize)
      queryParts.push(`pageSize=${paging.pageSize}`);
    if (orderBy)
      queryParts.push(`orderBy=${encodeURIComponent(orderBy.join(','))}`);
    if (formValues) {
      const filterParts: string[] = [];
      for (const [key, val] of Object.entries(formValues)) {
        if (val !== undefined && val !== null && val !== '') {
          filterParts.push(`${key}=${val}`);
        }
      }
      if (filterParts.length > 0) {
        queryParts.push(`query=${encodeURIComponent(filterParts.join('&'))}`);
      }
    }
    const qs = queryParts.length > 0 ? `?${queryParts.join('&')}` : '';
    return (await moduleRequest(
      `v1/internal-message/inbox${qs}`,
      'GET',
    )) as any;
  }

  async function markNotificationAsRead(
    userId: number,
    recipientIds: number[],
  ) {
    return await moduleRequest('v1/internal-message/inbox/read', 'POST', {
      userId,
      recipientIds,
    });
  }

  async function deleteNotificationFromInbox(
    userId: number,
    recipientIds: number[],
  ) {
    return await moduleRequest('v1/internal-message/inbox/delete', 'POST', {
      userId,
      recipientIds,
    });
  }

  async function revokeMessage(userId: number, messageId: number) {
    return await moduleRequest('v1/internal-message/revoke', 'POST', {
      messageId,
      userId,
    });
  }

  async function sendMessage(request: SendMessageRequest) {
    return await moduleRequest('v1/internal-message/send', 'POST', request);
  }

  function $reset() {}

  return {
    $reset,
    listMessage,
    getMessage,
    updateMessage,
    deleteMessage,
    listUserInbox,
    sendMessage,
    revokeMessage,
    markNotificationAsRead,
    deleteNotificationFromInbox,
  };
});

export const internalMessageStatusList = computed(() => [
  { value: 'DRAFT', label: $t('enum.internalMessage.status.DRAFT') },
  { value: 'PUBLISHED', label: $t('enum.internalMessage.status.PUBLISHED') },
  { value: 'SCHEDULED', label: $t('enum.internalMessage.status.SCHEDULED') },
  { value: 'REVOKED', label: $t('enum.internalMessage.status.REVOKED') },
  { value: 'ARCHIVED', label: $t('enum.internalMessage.status.ARCHIVED') },
  { value: 'DELETED', label: $t('enum.internalMessage.status.DELETED') },
]);

export const internalMessageTypeList = computed(() => [
  { value: 'NOTIFICATION', label: $t('enum.internalMessage.type.NOTIFICATION') },
  { value: 'PRIVATE', label: $t('enum.internalMessage.type.PRIVATE') },
  { value: 'GROUP', label: $t('enum.internalMessage.type.GROUP') },
]);

export const internalMessageRecipientStatusList = computed(() => [
  { value: 'SENT', label: $t('enum.internalMessageRecipient.status.SENT') },
  { value: 'RECEIVED', label: $t('enum.internalMessageRecipient.status.RECEIVED') },
  { value: 'READ', label: $t('enum.internalMessageRecipient.status.READ') },
  { value: 'REVOKED', label: $t('enum.internalMessageRecipient.status.REVOKED') },
  { value: 'DELETED', label: $t('enum.internalMessageRecipient.status.DELETED') },
]);

export function internalMessageStatusLabel(
  value: InternalMessage_Status,
): string {
  const values = internalMessageStatusList.value;
  const matchedItem = values.find((item) => item.value === value);
  return matchedItem ? matchedItem.label : '';
}

const INTERNAL_MESSAGE_STATUS_COLOR_MAP = {
  ARCHIVED: '#86909C',
  DELETED: '#C9CDD4',
  DRAFT: '#9CA3AF',
  PUBLISHED: '#00B42A',
  REVOKED: '#F53F3F',
  SCHEDULED: '#165DFF',
  DEFAULT: '#E5E7EB',
} as const satisfies Record<'DEFAULT' | InternalMessage_Status, string>;

export function internalMessageStatusColor(
  status: InternalMessage_Status,
): string {
  return (
    INTERNAL_MESSAGE_STATUS_COLOR_MAP[status] ||
    INTERNAL_MESSAGE_STATUS_COLOR_MAP.DEFAULT
  );
}

export function internalMessageTypeLabel(value: InternalMessage_Type): string {
  const values = internalMessageTypeList.value;
  const matchedItem = values.find((item) => item.value === value);
  return matchedItem ? matchedItem.label : '';
}

const INTERNAL_MESSAGE_TYPE_COLOR_MAP = {
  GROUP: '#00B42A',
  NOTIFICATION: '#165DFF',
  PRIVATE: '#722ED1',
  DEFAULT: '#C9CDD4',
} as const satisfies Record<'DEFAULT' | InternalMessage_Type, string>;

export function internalMessageTypeColor(type: InternalMessage_Type): string {
  return (
    INTERNAL_MESSAGE_TYPE_COLOR_MAP[type] ||
    INTERNAL_MESSAGE_TYPE_COLOR_MAP.DEFAULT
  );
}

export function internalMessageRecipientStatusLabel(
  value: InternalMessageRecipient_Status,
): string {
  const values = internalMessageRecipientStatusList.value;
  const matchedItem = values.find((item) => item.value === value);
  return matchedItem ? matchedItem.label : '';
}

const INTERNAL_MESSAGE_RECIPIENT_COLOR_THEME = {
  light: {
    DELETED: '#C9CDD4',
    READ: '#86909C',
    RECEIVED: '#165DFF',
    REVOKED: '#F53F3F',
    SENT: '#4096FF',
    DEFAULT: '#E5E7EB',
  },
  dark: {
    DELETED: '#6E7681',
    READ: '#4E5969',
    RECEIVED: '#2F77FF',
    REVOKED: '#F87171',
    SENT: '#69B1FF',
    DEFAULT: '#4B5563',
  },
} as const;

export function internalMessageRecipientStatusColor(
  status: InternalMessageRecipient_Status,
  theme: 'dark' | 'light' = 'light',
): string {
  const colorMap = INTERNAL_MESSAGE_RECIPIENT_COLOR_THEME[theme];
  return colorMap[status] || colorMap.DEFAULT;
}
