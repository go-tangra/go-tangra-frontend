import { defineStore } from 'pinia';

import {
  type CreateTemplateRequest,
  NotificationTemplateService,
  type UpdateTemplateRequest,
} from '#/generated/api/modules/notification/services';

export const useNotificationTemplateStore = defineStore(
  'notification-template',
  () => {
    async function listTemplates(params?: {
      page?: number;
      pageSize?: number;
    }) {
      return await NotificationTemplateService.list(params);
    }

    async function getTemplate(id: string) {
      return await NotificationTemplateService.get(id);
    }

    async function createTemplate(data: CreateTemplateRequest) {
      return await NotificationTemplateService.create(data);
    }

    async function updateTemplate(id: string, data: UpdateTemplateRequest) {
      return await NotificationTemplateService.update(id, data);
    }

    async function deleteTemplate(id: string) {
      return await NotificationTemplateService.delete(id);
    }

    async function previewTemplate(data: {
      subject: string;
      body: string;
      variables: Record<string, string>;
    }) {
      return await NotificationTemplateService.preview(data);
    }

    function $reset() {}

    return {
      $reset,
      listTemplates,
      getTemplate,
      createTemplate,
      updateTemplate,
      deleteTemplate,
      previewTemplate,
    };
  },
);
