export type Locale = 'bg-BG' | 'en-US';

export const messages: Record<Locale, Record<string, string>> = {
  'bg-BG': {
    cancel: 'Отказ',
    collapse: 'Свиване',
    confirm: 'Потвърждение',
    expand: 'Разгъване',
    reset: 'Нулиране',
    submit: 'Изпращане',
  },
  'en-US': {
    cancel: 'Cancel',
    collapse: 'Collapse',
    confirm: 'Confirm',
    expand: 'Expand',
    reset: 'Reset',
    submit: 'Submit',
  },
};

export const getMessages = (locale: Locale) => messages[locale];
