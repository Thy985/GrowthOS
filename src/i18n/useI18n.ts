import { useTranslation as useI18nTranslation } from 'react-i18next';
import i18nInstance from './index';

/**
 * 简化的 i18n hook
 * 提供更简洁的翻译函数
 * 
 * @example
 * const { t } = useI18n();
 * const title = t('dashboard.title');
 * const greeting = t('dashboard.welcome', { username: '张三' });
 */
export const useI18n = () => {
  const [t, i18n, ready] = useI18nTranslation();
  const language = i18n.language;

  /**
   * 翻译函数封装
   * 
   * @param key - 翻译 key
   * @param options - 插值选项
   * @returns 翻译后的字符串
   */
  const translate = (key: string, options?: Record<string, unknown>): string => {
    return t(key, options);
  };

  /**
   * 切换语言
   * @param lang - 语言代码 ('zh-CN' | 'en-US')
   */
  const changeLanguage = (lang: 'zh-CN' | 'en-US') => {
    void i18n.changeLanguage(lang);
  };

  /**
   * 获取当前语言
   */
  const getCurrentLanguage = () => language;

  /**
   * 检查是否为中文
   */
  const isChinese = () => language.startsWith('zh');

  /**
   * 检查是否为英文
   */
  const isEnglish = () => language.startsWith('en');

  return {
    t: translate,
    i18n,
    language,
    changeLanguage,
    getCurrentLanguage,
    isChinese,
    isEnglish,
    ready
  };
};

/**
 * 格式化数字
 * @param value - 数字值
 * @param options - 格式化选项
 * @returns 格式化后的字符串
 */
export const formatNumber = (value: number, options?: Intl.NumberFormatOptions): string => {
  return new Intl.NumberFormat(i18nInstance.language, options).format(value);
};

/**
 * 格式化日期
 * @param date - 日期对象或日期字符串
 * @param options - 格式化选项
 * @returns 格式化后的日期字符串
 */
export const formatDate = (date: Date | string, options?: Intl.DateTimeFormatOptions): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat(i18nInstance.language, options).format(dateObj);
};

/**
 * 格式化相对时间
 * @param date - 日期对象或日期字符串
 * @returns 相对时间字符串（如 "2小时前"）
 */
export const formatRelativeTime = (date: Date | string): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const diff = now.getTime() - dateObj.getTime();

  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  const weeks = Math.floor(days / 7);
  const months = Math.floor(days / 30);
  const years = Math.floor(days / 365);

  const translations: Record<string, { zh: string, en: string }> = {
    year: { zh: '年', en: 'year' },
    years: { zh: '年', en: 'years' },
    month: { zh: '月', en: 'month' },
    months: { zh: '月', en: 'months' },
    week: { zh: '周', en: 'week' },
    weeks: { zh: '周', en: 'weeks' },
    day: { zh: '天', en: 'day' },
    days: { zh: '天', en: 'days' },
    hour: { zh: '小时', en: 'hour' },
    hours: { zh: '小时', en: 'hours' },
    minute: { zh: '分钟', en: 'minute' },
    minutes: { zh: '分钟', en: 'minutes' },
    justNow: { zh: '刚刚', en: 'just now' }
  };

  const isZh = i18nInstance.language.startsWith('zh');

  if (years > 0) {
    return `${years}${isZh ? translations[years > 1 ? 'years' : 'year'].zh : translations[years > 1 ? 'years' : 'year'].en}`;
  }
  if (months > 0) {
    return `${months}${isZh ? translations[months > 1 ? 'months' : 'month'].zh : translations[months > 1 ? 'months' : 'month'].en}`;
  }
  if (weeks > 0) {
    return `${weeks}${isZh ? translations[weeks > 1 ? 'weeks' : 'week'].zh : translations[weeks > 1 ? 'weeks' : 'week'].en}`;
  }
  if (days > 0) {
    return `${days}${isZh ? translations[days > 1 ? 'days' : 'day'].zh : translations[days > 1 ? 'days' : 'day'].en}`;
  }
  if (hours > 0) {
    return `${hours}${isZh ? translations[hours > 1 ? 'hours' : 'hour'].zh : translations[hours > 1 ? 'hours' : 'hour'].en}`;
  }
  if (minutes > 0) {
    return `${minutes}${isZh ? translations[minutes > 1 ? 'minutes' : 'minute'].zh : translations[minutes > 1 ? 'minutes' : 'minute'].en}`;
  }

  return isZh ? translations.justNow.zh : translations.justNow.en;
};
