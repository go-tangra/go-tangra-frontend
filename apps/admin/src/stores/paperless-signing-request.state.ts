import { computed } from 'vue';

import { defineStore } from 'pinia';

import {
  SigningRequestService,
  type SigningRequestStatus,
  type SigningRecipientStatus,
} from '#/generated/api/modules/paperless/services';

export const usePaperlessSigningRequestStore = defineStore(
  'paperless-signing-request',
  () => {
    async function listSigningRequests(params?: {
      page?: number;
      pageSize?: number;
      status?: string;
      name?: string;
    }) {
      return await SigningRequestService.list(params);
    }

    async function resendEmail(id: string, recipientId: string) {
      return await SigningRequestService.resendEmail(id, recipientId);
    }

    async function cancelRequest(id: string) {
      return await SigningRequestService.cancel(id);
    }

    function $reset() {}

    return {
      $reset,
      listSigningRequests,
      resendEmail,
      cancelRequest,
    };
  },
);

// ==================== Status helpers ====================

export const signingRequestStatusList = computed(() => [
  { value: 'SIGNING_REQUEST_STATUS_PENDING', label: 'Pending' },
  { value: 'SIGNING_REQUEST_STATUS_COMPLETED', label: 'Completed' },
  { value: 'SIGNING_REQUEST_STATUS_CANCELLED', label: 'Cancelled' },
  { value: 'SIGNING_REQUEST_STATUS_EXPIRED', label: 'Expired' },
]);

export function signingRequestStatusLabel(
  value: SigningRequestStatus,
): string {
  const item = signingRequestStatusList.value.find((i) => i.value === value);
  return item ? item.label : String(value).replace(/SIGNING_REQUEST_STATUS_/g, '');
}

const REQUEST_STATUS_COLOR: Record<string, string> = {
  SIGNING_REQUEST_STATUS_PENDING: '#F77234',
  SIGNING_REQUEST_STATUS_COMPLETED: '#00B42A',
  SIGNING_REQUEST_STATUS_CANCELLED: '#86909C',
  SIGNING_REQUEST_STATUS_EXPIRED: '#F53F3F',
  DEFAULT: '#C9CDD4',
};

export function signingRequestStatusColor(
  status: SigningRequestStatus,
): string {
  return REQUEST_STATUS_COLOR[status] || REQUEST_STATUS_COLOR.DEFAULT!;
}

export function signingRecipientStatusLabel(
  value: SigningRecipientStatus,
): string {
  return String(value).replace(/SIGNING_RECIPIENT_STATUS_/g, '');
}

const RECIPIENT_STATUS_COLOR: Record<string, string> = {
  SIGNING_RECIPIENT_STATUS_WAITING: '#C9CDD4',
  SIGNING_RECIPIENT_STATUS_PENDING: '#F77234',
  SIGNING_RECIPIENT_STATUS_COMPLETED: '#00B42A',
  SIGNING_RECIPIENT_STATUS_DECLINED: '#F53F3F',
  DEFAULT: '#C9CDD4',
};

export function signingRecipientStatusColor(
  status: SigningRecipientStatus,
): string {
  return RECIPIENT_STATUS_COLOR[status] || RECIPIENT_STATUS_COLOR.DEFAULT!;
}

export function isRequestResendable(status: SigningRequestStatus): boolean {
  return status === 'SIGNING_REQUEST_STATUS_PENDING';
}

export function isRecipientResendable(
  status: SigningRecipientStatus,
): boolean {
  return status === 'SIGNING_RECIPIENT_STATUS_PENDING';
}
