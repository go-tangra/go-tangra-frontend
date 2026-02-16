/**
 * @zh_CN 登录页面 url 地址
 */
export const LOGIN_PATH = '/auth/login';

/**
 * @zh_CN 默认首页地址
 */
export const DEFAULT_HOME_PATH = '/dashboard/overview';

/**
 * Language option type
 */
export interface LanguageOption {
  label: string;
  value: 'bg-BG' | 'en-US';
}

/**
 * Supported languages
 */
export const SUPPORT_LANGUAGES: LanguageOption[] = [
  {
    label: 'Български',
    value: 'bg-BG',
  },
  {
    label: 'English',
    value: 'en-US',
  },
];
