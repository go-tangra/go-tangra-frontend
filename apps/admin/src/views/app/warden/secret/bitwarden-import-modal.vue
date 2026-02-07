<script lang="ts" setup>
import { ref, computed, watch } from 'vue';

import { useVbenModal } from '@vben/common-ui';
import { LucideUpload, LucideFileJson, LucideCheck, LucideX } from '@vben/icons';

import {
  Upload,
  Form,
  FormItem,
  Select,
  SelectOption,
  Switch,
  Alert,
  Descriptions,
  DescriptionsItem,
  Tag,
  notification,
} from 'ant-design-vue';
import type { UploadChangeParam } from 'ant-design-vue';

import {
  type ValidateBitwardenImportResponse,
  type ImportFromBitwardenResponse,
} from '#/generated/api/modules/warden';
import { $t } from '#/locales';
import { useWardenSecretStore } from '#/stores';

interface Props {
  folderId?: string;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  success: [];
}>();

const secretStore = useWardenSecretStore();

// State
const fileContent = ref<string>('');
const fileName = ref<string>('');
const isValidating = ref(false);
const validationResult = ref<{
  isValid: boolean;
  foldersFound: number;
  loginItemsFound: number;
  otherItemsFound: number;
  warnings: string[];
  errors: string[];
  duplicateNames: string[];
} | null>(null);

// Import options
const duplicateHandling = ref<string>('DUPLICATE_HANDLING_SKIP');
const preserveFolders = ref(true);
const targetFolderId = ref<string | undefined>(props.folderId);

// Computed
const canImport = computed(() => {
  return fileContent.value && validationResult.value?.isValid;
});

const hasValidFile = computed(() => {
  return fileContent.value && validationResult.value !== null;
});

// Watch for folder prop changes
watch(
  () => props.folderId,
  (newVal) => {
    targetFolderId.value = newVal;
  },
);

// Handle file upload
function handleFileChange(info: UploadChangeParam) {
  console.log('handleFileChange called:', info);

  // Get the actual File object - could be in different places depending on ant-design version
  let file: File | undefined;

  if (info.file instanceof File) {
    file = info.file;
  } else if (info.file?.originFileObj) {
    file = info.file.originFileObj;
  } else if (info.fileList?.[0]?.originFileObj) {
    file = info.fileList[0].originFileObj;
  }

  if (!file) {
    console.log('Could not find File object in:', info);
    return;
  }

  readFile(file);
}

function readFile(file: File) {
  console.log('Reading file:', file.name);
  fileName.value = file.name;

  const reader = new FileReader();
  reader.onload = async (e) => {
    const content = e.target?.result as string;
    console.log('File content loaded, length:', content.length);
    fileContent.value = content;
    await validateFile(content);
  };
  reader.onerror = (err) => {
    console.error('File read error:', err);
  };
  reader.readAsText(file);
}

// Handle drag and drop
function handleDrop(e: DragEvent) {
  e.preventDefault();
  console.log('File dropped:', e.dataTransfer?.files);
  const file = e.dataTransfer?.files[0];
  if (!file) {
    console.log('No file in drop event');
    return;
  }

  if (!file.name.endsWith('.json')) {
    notification.error({ message: $t('warden.page.bitwarden.invalidFile') });
    return;
  }

  console.log('Reading file:', file.name);
  fileName.value = file.name;

  const reader = new FileReader();
  reader.onload = async (ev) => {
    const content = ev.target?.result as string;
    console.log('File content loaded, length:', content.length);
    fileContent.value = content;
    await validateFile(content);
  };
  reader.onerror = (err) => {
    console.error('File read error:', err);
  };
  reader.readAsText(file);
}

// Validate the file
async function validateFile(content: string) {
  isValidating.value = true;
  validationResult.value = null;

  console.log('Validating file content, length:', content.length);

  try {
    const result = await secretStore.validateBitwardenImport(content, {
      targetFolderId: targetFolderId.value,
      preserveFolders: preserveFolders.value,
    }) as ValidateBitwardenImportResponse;

    console.log('Validation result:', result);

    validationResult.value = {
      isValid: result.isValid ?? false,
      foldersFound: result.foldersFound ?? 0,
      loginItemsFound: result.loginItemsFound ?? 0,
      otherItemsFound: result.otherItemsFound ?? 0,
      warnings: result.warnings ?? [],
      errors: result.errors ?? [],
      duplicateNames: result.duplicateNames ?? [],
    };
  } catch (error: any) {
    console.error('Validation error:', error);
    validationResult.value = {
      isValid: false,
      foldersFound: 0,
      loginItemsFound: 0,
      otherItemsFound: 0,
      warnings: [],
      errors: [error.message || 'Failed to validate file'],
      duplicateNames: [],
    };
  } finally {
    isValidating.value = false;
  }
}

// Perform the import
async function handleImport() {
  console.log('handleImport called, canImport:', canImport.value);
  if (!canImport.value) {
    console.log('Cannot import - conditions not met');
    notification.warning({
      message: 'Cannot import',
      description: 'Please upload a valid file first',
    });
    return;
  }

  setLoading(true);

  try {
    console.log('Calling importFromBitwarden...');
    const result = await secretStore.importFromBitwarden(fileContent.value, {
      targetFolderId: targetFolderId.value,
      duplicateHandling: duplicateHandling.value as any,
      preserveFolders: preserveFolders.value,
    }) as ImportFromBitwardenResponse;

    console.log('Import result:', result);

    notification.success({
      message: $t('warden.page.bitwarden.importSuccess'),
      description: `${result.itemsImported} ${$t('warden.page.bitwarden.itemsImported')}, ${result.foldersCreated} ${$t('warden.page.bitwarden.foldersCreated')}`,
    });

    emit('success');
    resetState();
    modalApi.close();
  } catch (error: any) {
    console.error('Import error:', error);
    notification.error({
      message: $t('warden.page.bitwarden.importFailed'),
      description: error.message,
    });
  } finally {
    setLoading(false);
  }
}

// Reset state
function resetState() {
  fileContent.value = '';
  fileName.value = '';
  validationResult.value = null;
  duplicateHandling.value = 'DUPLICATE_HANDLING_SKIP';
  preserveFolders.value = true;
}

// Modal
const [ModalComponent, modalApi] = useVbenModal({
  onCancel() {
    modalApi.close();
  },

  async onConfirm() {
    await handleImport();
  },

  onOpenChange(isOpen) {
    if (!isOpen) {
      resetState();
    }
  },
});

function setLoading(loading: boolean) {
  modalApi.setState({ confirmLoading: loading });
}

defineExpose({
  open: () => modalApi.open(),
  close: () => modalApi.close(),
});
</script>

<template>
  <ModalComponent :title="$t('warden.page.bitwarden.importTitle')">
    <div class="space-y-4">
      <!-- File Upload Area -->
      <div
        v-if="!hasValidFile"
        class="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-primary transition-colors cursor-pointer"
        @drop="handleDrop"
        @dragover.prevent
      >
        <Upload
          accept=".json"
          :show-upload-list="false"
          :before-upload="() => false"
          @change="handleFileChange"
        >
          <div class="flex flex-col items-center gap-4">
            <LucideUpload class="size-12 text-gray-400" />
            <div>
              <p class="text-base font-medium">
                {{ $t('warden.page.bitwarden.dropFile') }}
              </p>
              <p class="text-sm text-gray-500">
                {{ $t('warden.page.bitwarden.supportedFormat') }}
              </p>
            </div>
          </div>
        </Upload>
      </div>

      <!-- File Info & Validation Result -->
      <div v-else class="space-y-4">
        <!-- File Name -->
        <div class="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
          <LucideFileJson class="size-5 text-blue-500" />
          <span class="font-medium">{{ fileName }}</span>
          <button
            class="ml-auto text-gray-400 hover:text-red-500"
            @click="resetState"
          >
            <LucideX class="size-4" />
          </button>
        </div>

        <!-- Validation Status -->
        <Alert
          v-if="isValidating"
          type="info"
          :message="$t('warden.page.bitwarden.validating')"
          show-icon
        />

        <Alert
          v-else-if="validationResult?.isValid"
          type="success"
          :message="$t('warden.page.bitwarden.validFile')"
          show-icon
        >
          <template #icon>
            <LucideCheck class="size-5" />
          </template>
        </Alert>

        <Alert
          v-else-if="validationResult && !validationResult.isValid"
          type="error"
          :message="$t('warden.page.bitwarden.invalidFile')"
          show-icon
        >
          <template #description>
            <ul class="list-disc list-inside mt-2">
              <li v-for="error in validationResult.errors" :key="error">
                {{ error }}
              </li>
            </ul>
          </template>
        </Alert>

        <!-- File Statistics -->
        <Descriptions
          v-if="validationResult"
          :column="2"
          size="small"
          bordered
        >
          <DescriptionsItem :label="$t('warden.page.bitwarden.foldersFound')">
            {{ validationResult.foldersFound }}
          </DescriptionsItem>
          <DescriptionsItem :label="$t('warden.page.bitwarden.loginsFound')">
            {{ validationResult.loginItemsFound }}
          </DescriptionsItem>
          <DescriptionsItem
            v-if="validationResult.otherItemsFound > 0"
            :label="$t('warden.page.bitwarden.otherItems')"
            :span="2"
          >
            <Tag color="orange">
              {{ validationResult.otherItemsFound }}
              {{ $t('warden.page.bitwarden.willBeSkipped') }}
            </Tag>
          </DescriptionsItem>
        </Descriptions>

        <!-- Warnings -->
        <Alert
          v-if="validationResult?.warnings?.length"
          type="warning"
          show-icon
        >
          <template #message>
            {{ $t('warden.page.bitwarden.warnings') }}
          </template>
          <template #description>
            <ul class="list-disc list-inside mt-2">
              <li v-for="warning in validationResult.warnings" :key="warning">
                {{ warning }}
              </li>
            </ul>
          </template>
        </Alert>

        <!-- Duplicates -->
        <Alert
          v-if="validationResult?.duplicateNames?.length"
          type="info"
          show-icon
        >
          <template #message>
            {{ $t('warden.page.bitwarden.duplicatesFound') }} ({{
              validationResult.duplicateNames.length
            }})
          </template>
          <template #description>
            <div class="mt-2 flex flex-wrap gap-1">
              <Tag
                v-for="name in validationResult.duplicateNames.slice(0, 5)"
                :key="name"
              >
                {{ name }}
              </Tag>
              <Tag v-if="validationResult.duplicateNames.length > 5">
                +{{ validationResult.duplicateNames.length - 5 }} more
              </Tag>
            </div>
          </template>
        </Alert>

        <!-- Import Options -->
        <Form layout="vertical" class="mt-4">
          <FormItem :label="$t('warden.page.bitwarden.duplicateHandling')">
            <Select v-model:value="duplicateHandling" class="w-full">
              <SelectOption value="DUPLICATE_HANDLING_SKIP">
                {{ $t('warden.page.bitwarden.skipDuplicates') }}
              </SelectOption>
              <SelectOption value="DUPLICATE_HANDLING_RENAME">
                {{ $t('warden.page.bitwarden.renameDuplicates') }}
              </SelectOption>
              <SelectOption value="DUPLICATE_HANDLING_OVERWRITE">
                {{ $t('warden.page.bitwarden.overwriteDuplicates') }}
              </SelectOption>
            </Select>
          </FormItem>

          <FormItem :label="$t('warden.page.bitwarden.preserveFolders')">
            <Switch v-model:checked="preserveFolders" />
            <span class="ml-2 text-sm text-gray-500">
              {{
                preserveFolders
                  ? $t('warden.page.bitwarden.foldersWillBeCreated')
                  : $t('warden.page.bitwarden.allToCurrentFolder')
              }}
            </span>
          </FormItem>
        </Form>
      </div>

    </div>
  </ModalComponent>
</template>
