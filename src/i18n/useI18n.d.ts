declare module '../i18n' {
  import i18n from 'i18next';
  
  export const useI18n: () => {
    t: (key: string, options?: Record<string, unknown>) => string;
    i18n: typeof i18n;
    language: string;
    changeLanguage: (lang: 'zh-CN' | 'en-US') => Promise<void>;
    getCurrentLanguage: () => string;
    isChinese: () => boolean;
    isEnglish: () => boolean;
    ready: boolean;
  };
  
  export const formatNumber: (value: number, options?: Intl.NumberFormatOptions) => string;
  export const formatDate: (date: Date | string, options?: Intl.DateTimeFormatOptions) => string;
  export const formatRelativeTime: (date: Date | string) => string;
  
  export default i18n;
}
