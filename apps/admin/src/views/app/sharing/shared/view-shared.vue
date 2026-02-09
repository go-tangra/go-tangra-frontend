<script lang="ts" setup>
import { ref, onMounted } from 'vue';
import { useRoute } from 'vue-router';

import {
  Card,
  Button,
  Result,
  Spin,
  Alert,
  Typography,
  notification,
} from 'ant-design-vue';

import {
  viewSharedContent,
  type ViewSharedContentResponse,
} from '#/generated/api/modules/sharing/public-client';

const route = useRoute();
const loading = ref(true);
const error = ref('');
const content = ref<ViewSharedContentResponse | null>(null);
const passwordVisible = ref(false);

const token = route.params.token as string;

onMounted(async () => {
  try {
    content.value = await viewSharedContent(token);
  } catch (e: any) {
    error.value = e.message || 'Failed to load shared content';
  } finally {
    loading.value = false;
  }
});

async function copyPassword() {
  if (!content.value?.password) return;
  try {
    await navigator.clipboard.writeText(content.value.password);
    notification.success({ message: 'Password copied to clipboard' });
  } catch {
    notification.error({ message: 'Failed to copy password' });
  }
}

function downloadFile() {
  if (!content.value?.fileContent) return;
  const byteCharacters = atob(content.value.fileContent);
  const byteNumbers = new Uint8Array(byteCharacters.length);
  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i);
  }
  const blob = new Blob([byteNumbers], {
    type: content.value.mimeType || 'application/octet-stream',
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = content.value.fileName || 'download';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
</script>

<template>
  <div
    style="
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #f5f5f5;
      padding: 24px;
    "
  >
    <Card style="max-width: 600px; width: 100%">
      <!-- Loading -->
      <div v-if="loading" style="text-align: center; padding: 48px 0">
        <Spin size="large" />
        <div style="margin-top: 16px; color: #8c8c8c">
          Loading shared content...
        </div>
      </div>

      <!-- Error -->
      <Result v-else-if="error" status="error" :sub-title="error" title="Unable to Load Content" />

      <!-- Secret Content -->
      <template v-else-if="content && content.resourceType === 'RESOURCE_TYPE_SECRET'">
        <Typography.Title :level="4">
          {{ content.resourceName }}
        </Typography.Title>

        <Alert
          type="warning"
          message="One-Time Link"
          description="This is a one-time link. The content will not be accessible again after you leave this page."
          show-icon
          style="margin-bottom: 16px"
        />

        <div style="margin-bottom: 16px">
          <label
            style="
              display: block;
              font-weight: 500;
              margin-bottom: 8px;
              color: #595959;
            "
          >
            Password
          </label>
          <div style="display: flex; gap: 8px">
            <a-input-password
              :value="content.password"
              :visibility-toggle="true"
              readonly
              size="large"
              style="flex: 1"
            />
            <Button type="primary" size="large" @click="copyPassword">
              Copy
            </Button>
          </div>
        </div>
      </template>

      <!-- Document Content -->
      <template v-else-if="content && content.resourceType === 'RESOURCE_TYPE_DOCUMENT'">
        <Typography.Title :level="4">
          {{ content.resourceName }}
        </Typography.Title>

        <Alert
          type="warning"
          message="One-Time Link"
          description="This is a one-time link. The content will not be accessible again after you leave this page."
          show-icon
          style="margin-bottom: 16px"
        />

        <div style="text-align: center; padding: 24px 0">
          <div style="margin-bottom: 8px; color: #595959">
            {{ content.fileName }}
          </div>
          <div
            v-if="content.mimeType"
            style="margin-bottom: 16px; color: #8c8c8c; font-size: 12px"
          >
            {{ content.mimeType }}
          </div>
          <Button type="primary" size="large" @click="downloadFile">
            Download File
          </Button>
        </div>
      </template>

      <!-- Footer -->
      <div
        v-if="!loading && !error"
        style="
          margin-top: 24px;
          padding-top: 16px;
          border-top: 1px solid #f0f0f0;
          text-align: center;
          color: #8c8c8c;
          font-size: 12px;
        "
      >
        Shared securely via Tangra
      </div>
    </Card>
  </div>
</template>
