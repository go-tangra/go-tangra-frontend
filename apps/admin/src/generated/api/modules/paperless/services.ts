/**
 * Paperless Module Service Functions
 *
 * Typed service methods for the Paperless API using dynamic module routing.
 * Base URL: /admin/v1/modules/paperless/v1
 */

import { paperlessApi, type RequestOptions } from './client';

// ==================== Entity Types ====================

export type SigningRequestStatus =
  | 'SIGNING_REQUEST_STATUS_CANCELLED'
  | 'SIGNING_REQUEST_STATUS_COMPLETED'
  | 'SIGNING_REQUEST_STATUS_DRAFT'
  | 'SIGNING_REQUEST_STATUS_EXPIRED'
  | 'SIGNING_REQUEST_STATUS_PENDING';

export type SigningRequestType =
  | 'SIGNING_REQUEST_TYPE_EXTERNAL'
  | 'SIGNING_REQUEST_TYPE_INTERNAL';

export type SigningRecipientStatus =
  | 'SIGNING_RECIPIENT_STATUS_COMPLETED'
  | 'SIGNING_RECIPIENT_STATUS_DECLINED'
  | 'SIGNING_RECIPIENT_STATUS_PENDING'
  | 'SIGNING_RECIPIENT_STATUS_WAITING';

export interface SigningRecipient {
  id: string;
  email: string;
  name: string;
  signingOrder: number;
  status: SigningRecipientStatus;
  signedAt?: string;
  userId?: number;
}

export interface SigningFieldValue {
  fieldId: string;
  fieldName: string;
  value: string;
  filledBy: string;
}

export interface SigningRequest {
  id: string;
  tenantId: number;
  templateId: string;
  templateName: string;
  name: string;
  status: SigningRequestStatus;
  signingType: SigningRequestType;
  originalFileKey: string;
  signedFileKey?: string;
  recipients: SigningRecipient[];
  fieldValues?: SigningFieldValue[];
  message?: string;
  expiresAt?: string;
  createTime: string;
  updateTime?: string;
}

// ==================== Request/Response Types ====================

export interface ListSigningRequestsResponse {
  requests: SigningRequest[];
  total: number;
}

// ==================== Signing Request Service ====================

export const SigningRequestService = {
  list: (
    params?: {
      page?: number;
      pageSize?: number;
      status?: string;
      templateId?: string;
      name?: string;
    },
    options?: RequestOptions,
  ) => {
    const query = new URLSearchParams();
    if (params?.page) query.set('page', String(params.page));
    if (params?.pageSize) query.set('pageSize', String(params.pageSize));
    if (params?.status) query.set('status', params.status);
    if (params?.templateId) query.set('templateId', params.templateId);
    if (params?.name) query.set('name', params.name);
    const qs = query.toString();
    return paperlessApi.get<ListSigningRequestsResponse>(
      `/signing/requests${qs ? `?${qs}` : ''}`,
      options,
    );
  },

  get: (id: string, options?: RequestOptions) =>
    paperlessApi.get<{ request: SigningRequest }>(
      `/signing/requests/${id}`,
      options,
    ),

  cancel: (id: string, options?: RequestOptions) =>
    paperlessApi.post<void>(`/signing/requests/${id}/cancel`, {}, options),

  resendEmail: (
    id: string,
    recipientId: string,
    options?: RequestOptions,
  ) =>
    paperlessApi.post<void>(
      `/signing/requests/${id}/resend`,
      { recipientId },
      options,
    ),

  downloadSigned: (id: string, options?: RequestOptions) =>
    paperlessApi.get<{ url: string }>(
      `/signing/requests/${id}/download`,
      options,
    ),
};
