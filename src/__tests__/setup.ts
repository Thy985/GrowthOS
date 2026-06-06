import '@testing-library/jest-dom/vitest';
import { vi } from 'vitest';

import zhCN from '../shared/i18n/zh-CN.json';

// Mock ResizeObserver for Recharts
class ResizeObserverMock {
  observe() {}
  unobserve() {}
  disconnect() {}
}
(globalThis as unknown as { ResizeObserver: typeof ResizeObserverMock }).ResizeObserver =
  ResizeObserverMock;

// Mock getBoundingClientRect for Recharts ResponsiveContainer
if (!Element.prototype.getBoundingClientRect) {
  Element.prototype.getBoundingClientRect = function () {
    return {
      width: 800,
      height: 600,
      top: 0,
      left: 0,
      right: 800,
      bottom: 600,
      x: 0,
      y: 0,
    } as DOMRect;
  };
}

// Flatten nested i18n keys: "experiences.managementTitle" → value
function flattenTranslations(obj: Record<string, unknown>, prefix = ''): Record<string, string> {
  const result: Record<string, string> = {};
  for (const [key, value] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    if (typeof value === 'string') {
      result[fullKey] = value;
    } else if (typeof value === 'object' && value !== null) {
      Object.assign(result, flattenTranslations(value as Record<string, unknown>, fullKey));
    }
  }
  return result;
}

const translations = flattenTranslations(zhCN);

// Global mock for react-i18next — returns real zh-CN translations
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, defaultValue?: string) => translations[key] ?? defaultValue ?? key,
    i18n: { language: 'zh-CN' },
  }),
  Trans: ({ i18nKey }: { i18nKey?: string }) => i18nKey ?? '',
  initReactI18next: { init: () => {} },
}));
