import { useAccessStore } from '@vben/stores';

import { defineStore } from 'pinia';

const MODULE_BASE_URL = '/admin/v1/modules/notification';

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

export const useInternalMessageCategoryStore = defineStore(
  'internal_message_category',
  () => {
    async function listInternalMessageCategory(
      paging?: { page?: number; pageSize?: number },
      formValues?: null | object,
    ) {
      const queryParts: string[] = [];
      if (paging?.page)
        queryParts.push(`page=${paging.page}`);
      if (paging?.pageSize)
        queryParts.push(`pageSize=${paging.pageSize}`);
      if (formValues) {
        const filterObj: Record<string, unknown> = {};
        for (const [key, val] of Object.entries(formValues)) {
          if (val !== undefined && val !== null && val !== '') {
            filterObj[key] = val;
          }
        }
        if (Object.keys(filterObj).length > 0) {
          queryParts.push(`query=${encodeURIComponent(JSON.stringify(filterObj))}`);
        }
      }
      const qs = queryParts.length > 0 ? `?${queryParts.join('&')}` : '';
      return (await moduleRequest(
        `v1/internal-message/categories${qs}`,
        'GET',
      )) as any;
    }

    async function getInternalMessageCategory(id: number) {
      return (await moduleRequest(
        `v1/internal-message/categories/${id}`,
        'GET',
      )) as any;
    }

    async function createInternalMessageCategory(values: object) {
      return await moduleRequest(
        'v1/internal-message/categories',
        'POST',
        { data: { ...values } },
      );
    }

    async function updateInternalMessageCategory(id: number, values: object) {
      return await moduleRequest(
        `v1/internal-message/categories/${id}`,
        'PUT',
        {
          id,
          data: { ...values },
          updateMask: { paths: Object.keys(values ?? {}) },
        },
      );
    }

    async function deleteInternalMessageCategory(id: number) {
      return await moduleRequest(
        `v1/internal-message/categories/${id}`,
        'DELETE',
      );
    }

    function $reset() {}

    return {
      $reset,
      listInternalMessageCategory,
      getInternalMessageCategory,
      createInternalMessageCategory,
      updateInternalMessageCategory,
      deleteInternalMessageCategory,
    };
  },
);
