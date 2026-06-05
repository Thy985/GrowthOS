import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

describe('i18n', () => {
  let originalLanguage: PropertyDescriptor | undefined;

  beforeEach(() => {
    vi.resetModules();
    originalLanguage = Object.getOwnPropertyDescriptor(navigator, 'language');
  });

  afterEach(() => {
    if (originalLanguage) {
      Object.defineProperty(navigator, 'language', originalLanguage);
    }
  });

  const setNavigatorLanguage = (lang: string) => {
    Object.defineProperty(navigator, 'language', { value: lang, configurable: true });
  };

  it('detects zh-CN when navigator.language starts with zh', async () => {
    setNavigatorLanguage('zh-CN');
    const mod = await import('../../shared/i18n/index.ts');
    expect(mod.default.language).toBe('zh-CN');
  });

  it('falls back to en-US for non-zh languages', async () => {
    setNavigatorLanguage('en-US');
    const mod = await import('../../shared/i18n/index.ts');
    expect(mod.default.language).toBe('en-US');
  });

  it('uses fallbackLng zh-CN', async () => {
    setNavigatorLanguage('fr-FR');
    const mod = await import('../../shared/i18n/index.ts');
    // fallback to en-US (user locale), but translation resources should include zh-CN
    expect(mod.default.options.fallbackLng).toEqual(['zh-CN']);
  });

  it('exposes resources for both zh-CN and en-US', async () => {
    setNavigatorLanguage('en-US');
    const mod = await import('../../shared/i18n/index.ts');
    const resources = mod.default.options.resources ?? {};
    expect(Object.keys(resources)).toEqual(expect.arrayContaining(['zh-CN', 'en-US']));
  });
});
