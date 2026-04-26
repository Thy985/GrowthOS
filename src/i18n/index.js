import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import zhCN from './zh-CN.json';
import enUS from './en-US.json';

// 检测用户的浏览器语言
const detectUserLanguage = () => {
  const userLanguage = navigator.language || navigator.userLanguage;
  if (userLanguage.startsWith('zh')) {
    return 'zh-CN';
  }
  return 'en-US';
};

// 初始化i18next
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
  });

export default i18n;