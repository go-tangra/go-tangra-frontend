<script lang="ts" setup>
import { computed, ref } from 'vue';

import { useVbenDrawer } from '@vben/common-ui';
import { $t } from '@vben/locales';

import { notification } from 'ant-design-vue';

import { useVbenForm } from '#/adapter/form';
import {
  channelTypeList,
  enableBoolList,
  useNotificationTemplateStore,
} from '#/stores';

const templateStore = useNotificationTemplateStore();

const data = ref();

const getTitle = computed(() =>
  data.value?.create
    ? $t('ui.modal.create', {
        moduleName: $t('page.notification.template.moduleName'),
      })
    : $t('ui.modal.update', {
        moduleName: $t('page.notification.template.moduleName'),
      }),
);

const [BaseForm, baseFormApi] = useVbenForm({
  showDefaultActions: false,
  commonConfig: {
    componentProps: {
      class: 'w-full',
    },
  },
  schema: [
    {
      component: 'Input',
      fieldName: 'name',
      label: $t('page.notification.template.name'),
      componentProps: {
        placeholder: $t('ui.placeholder.input'),
        allowClear: true,
      },
      rules: 'required',
    },
    {
      component: 'Select',
      fieldName: 'channelType',
      label: $t('page.notification.template.channelType'),
      componentProps: {
        placeholder: $t('ui.placeholder.select'),
        options: channelTypeList,
        filterOption: (input: string, option: any) =>
          option.label.toLowerCase().includes(input.toLowerCase()),
        showSearch: true,
      },
      rules: 'selectRequired',
    },
    {
      component: 'Input',
      fieldName: 'subject',
      label: $t('page.notification.template.subject'),
      componentProps: {
        placeholder: 'e.g. Hello {{.Name}}',
        allowClear: true,
      },
      rules: 'required',
    },
    {
      component: 'Textarea',
      fieldName: 'body',
      label: $t('page.notification.template.body'),
      componentProps: {
        placeholder:
          'Go template syntax: {{.Variable}}',
        allowClear: true,
        rows: 8,
      },
      rules: 'required',
    },
    {
      component: 'Input',
      fieldName: 'variables',
      label: $t('page.notification.template.variables'),
      componentProps: {
        placeholder: 'e.g. Name,Email,Link',
        allowClear: true,
      },
    },
    {
      component: 'RadioGroup',
      fieldName: 'isDefault',
      label: $t('page.notification.template.isDefault'),
      defaultValue: false,
      rules: 'selectRequired',
      componentProps: {
        optionType: 'button',
        buttonStyle: 'solid',
        options: enableBoolList,
      },
    },
  ],
});

const [Drawer, drawerApi] = useVbenDrawer({
  onCancel() {
    drawerApi.close();
  },

  async onConfirm() {
    const validate = await baseFormApi.validate();
    if (!validate.valid) {
      return;
    }

    setLoading(true);

    const values = await baseFormApi.getValues();

    try {
      await (data.value?.create
        ? templateStore.createTemplate(values)
        : templateStore.updateTemplate(data.value.row.id, values));

      notification.success({
        message: data.value?.create
          ? $t('ui.notification.create_success')
          : $t('ui.notification.update_success'),
      });
    } catch {
      notification.error({
        message: data.value?.create
          ? $t('ui.notification.create_failed')
          : $t('ui.notification.update_failed'),
      });
    } finally {
      drawerApi.close();
      setLoading(false);
    }
  },

  onOpenChange(isOpen: boolean) {
    if (isOpen) {
      data.value = drawerApi.getData<Record<string, any>>();
      baseFormApi.setValues(data.value?.row);
      setLoading(false);
    }
  },
});

function setLoading(loading: boolean) {
  drawerApi.setState({ confirmLoading: loading });
}
</script>

<template>
  <Drawer :title="getTitle" class="w-full max-w-[600px]">
    <BaseForm />
  </Drawer>
</template>
