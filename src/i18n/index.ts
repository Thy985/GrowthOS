import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import type { TFunction, i18n as I18n } from 'i18next';
import zhCN from './zh-CN.json';
import enUS from './en-US.json';

const detectUserLanguage = (): string => {
  const userLanguage = navigator.language;
  if (userLanguage.startsWith('zh')) {
    return 'zh-CN';
  }
  return 'en-US';
};

i18n
  .use(initReactI18next)
  .init({
    resources: {
      'zh-CN': {
        translation: zhCN
      },
      'en-US': {
        translation: enUS
      }
    },
    lng: detectUserLanguage(),
    fallbackLng: 'zh-CN',
    interpolation: {
      escapeValue: false
    },
    react: {
      useSuspense: false
    }
  }).catch(console.error);

export default i18n;
export type { TFunction, I18n };
