/**
 * Notification Module Service Functions
 *
 * Typed service methods for the Notification API using dynamic module routing.
 * Base URL: /admin/v1/modules/notification/v1
 */

import { notificationApi, type RequestOptions } from './client';

// ==================== Entity Types ====================

export type ChannelType =
  | 'CHANNEL_TYPE_EMAIL'
  | 'CHANNEL_TYPE_SLACK'
  | 'CHANNEL_TYPE_SMS'
  | 'CHANNEL_TYPE_SSE';

export type DeliveryStatus =
  | 'DELIVERY_STATUS_FAILED'
  | 'DELIVERY_STATUS_PENDING'
  | 'DELIVERY_STATUS_SENT';

export interface NotificationChannel {
  id: string;
  tenantId: number;
  name: string;
  channelType: ChannelType;
  config: string;
  enabled: boolean;
  isDefault: boolean;
  createdBy?: number;
  updatedBy?: number;
  createTime: string;
  updateTime?: string;
}

export interface NotificationTemplate {
  id: string;
  tenantId: number;
  name: string;
  channelType: ChannelType;
  subject: string;
  body: string;
  variables: string;
  isDefault: boolean;
  createdBy?: number;
  updatedBy?: number;
  createTime: string;
  updateTime?: string;
}

export interface NotificationLog {
  id: string;
  tenantId: number;
  channelId: string;
  channelType: ChannelType;
  templateId: string;
  recipient: string;
  renderedSubject: string;
  renderedBody: string;
  status: DeliveryStatus;
  errorMessage: string;
  sentAt?: string;
  createTime: string;
}

// ==================== Request/Response Types ====================

export interface CreateChannelRequest {
  name: string;
  channelType: ChannelType;
  config: string;
  enabled?: boolean;
  isDefault?: boolean;
}

export interface UpdateChannelRequest {
  name?: string;
  config?: string;
  enabled?: boolean;
  isDefault?: boolean;
}

export interface ListChannelsResponse {
  items: NotificationChannel[];
  total: number;
}

export interface CreateTemplateRequest {
  name: string;
  channelType: ChannelType;
  subject: string;
  body: string;
  variables?: string;
  isDefault?: boolean;
}

export interface UpdateTemplateRequest {
  name?: string;
  subject?: string;
  body?: string;
  variables?: string;
  isDefault?: boolean;
}

export interface ListTemplatesResponse {
  items: NotificationTemplate[];
  total: number;
}

export interface PreviewTemplateResponse {
  renderedSubject: string;
  renderedBody: string;
}

export interface SendNotificationRequest {
  templateId: string;
  recipient: string;
  variables: Record<string, string>;
  channelId?: string;
}

export interface SendNotificationResponse {
  notification: NotificationLog;
}

export interface ListNotificationsResponse {
  items: NotificationLog[];
  total: number;
}

// ==================== Channel Service ====================

export const ChannelService = {
  create: (data: CreateChannelRequest, options?: RequestOptions) =>
    notificationApi.post<{ channel: NotificationChannel }>(
      '/channels',
      data,
      options,
    ),

  get: (id: string, options?: RequestOptions) =>
    notificationApi.get<{ channel: NotificationChannel }>(
      `/channels/${id}`,
      options,
    ),

  list: (
    params?: { page?: number; pageSize?: number },
    options?: RequestOptions,
  ) => {
    const query = new URLSearchParams();
    if (params?.page) query.set('page', String(params.page));
    if (params?.pageSize) query.set('pageSize', String(params.pageSize));
    const qs = query.toString();
    return notificationApi.get<ListChannelsResponse>(
      `/channels${qs ? `?${qs}` : ''}`,
      options,
    );
  },

  update: (
    id: string,
    data: UpdateChannelRequest,
    options?: RequestOptions,
  ) =>
    notificationApi.put<{ channel: NotificationChannel }>(
      `/channels/${id}`,
      data,
      options,
    ),

  delete: (id: string, options?: RequestOptions) =>
    notificationApi.delete<void>(`/channels/${id}`, options),
};

// ==================== Template Service ====================

export const NotificationTemplateService = {
  create: (data: CreateTemplateRequest, options?: RequestOptions) =>
    notificationApi.post<{ template: NotificationTemplate }>(
      '/templates',
      data,
      options,
    ),

  get: (id: string, options?: RequestOptions) =>
    notificationApi.get<{ template: NotificationTemplate }>(
      `/templates/${id}`,
      options,
    ),

  list: (
    params?: { page?: number; pageSize?: number },
    options?: RequestOptions,
  ) => {
    const query = new URLSearchParams();
    if (params?.page) query.set('page', String(params.page));
    if (params?.pageSize) query.set('pageSize', String(params.pageSize));
    const qs = query.toString();
    return notificationApi.get<ListTemplatesResponse>(
      `/templates${qs ? `?${qs}` : ''}`,
      options,
    );
  },

  update: (
    id: string,
    data: UpdateTemplateRequest,
    options?: RequestOptions,
  ) =>
    notificationApi.put<{ template: NotificationTemplate }>(
      `/templates/${id}`,
      data,
      options,
    ),

  delete: (id: string, options?: RequestOptions) =>
    notificationApi.delete<void>(`/templates/${id}`, options),

  preview: (
    data: {
      subject: string;
      body: string;
      variables: Record<string, string>;
    },
    options?: RequestOptions,
  ) =>
    notificationApi.post<PreviewTemplateResponse>(
      '/templates/preview',
      data,
      options,
    ),
};

// ==================== Notification Service ====================

export const NotificationService = {
  send: (data: SendNotificationRequest, options?: RequestOptions) =>
    notificationApi.post<SendNotificationResponse>(
      '/notifications/send',
      data,
      options,
    ),

  get: (id: string, options?: RequestOptions) =>
    notificationApi.get<{ notification: NotificationLog }>(
      `/notifications/${id}`,
      options,
    ),

  list: (
    params?: {
      page?: number;
      pageSize?: number;
      status?: string;
      channelType?: string;
    },
    options?: RequestOptions,
  ) => {
    const query = new URLSearchParams();
    if (params?.page) query.set('page', String(params.page));
    if (params?.pageSize) query.set('pageSize', String(params.pageSize));
    if (params?.status) query.set('status', params.status);
    if (params?.channelType) query.set('channelType', params.channelType);
    const qs = query.toString();
    return notificationApi.get<ListNotificationsResponse>(
      `/notifications${qs ? `?${qs}` : ''}`,
      options,
    );
  },
};
