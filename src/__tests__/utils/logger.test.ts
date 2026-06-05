import { describe, it, expect, beforeEach, vi } from 'vitest';

import logger, { LOG_LEVELS } from '../../shared/utils/logger.ts';

describe('logger', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    logger.setLogLevel(LOG_LEVELS.DEBUG);
  });

  it('debug calls console.debug with formatted message', () => {
    const spy = vi.spyOn(console, 'debug').mockImplementation(() => {});
    logger.debug('hello', { foo: 1 });
    expect(spy).toHaveBeenCalled();
    const [msg, data] = spy.mock.calls[0];
    expect(msg).toContain('[DEBUG]');
    expect(msg).toContain('hello');
    expect(data).toEqual({ foo: 1 });
  });

  it('info calls console.info with formatted message', () => {
    const spy = vi.spyOn(console, 'info').mockImplementation(() => {});
    logger.info('hello-info');
    expect(spy).toHaveBeenCalled();
    expect(spy.mock.calls[0][0]).toContain('[INFO]');
  });

  it('warn calls console.warn with formatted message', () => {
    const spy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    logger.warn('hello-warn');
    expect(spy).toHaveBeenCalled();
    expect(spy.mock.calls[0][0]).toContain('[WARN]');
  });

  it('error calls console.error with formatted message and error', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const err = new Error('boom');
    logger.error('hello-error', err, { ctx: 1 });
    expect(spy).toHaveBeenCalled();
    const callArgs = spy.mock.calls[0];
    expect(callArgs[0]).toContain('[ERROR]');
    expect(callArgs[1]).toBe(err);
    expect(callArgs[2]).toEqual({ ctx: 1 });
  });

  it('does not call console.debug when level is INFO and above', () => {
    logger.setLogLevel(LOG_LEVELS.INFO);
    const spy = vi.spyOn(console, 'debug').mockImplementation(() => {});
    logger.debug('hidden');
    expect(spy).not.toHaveBeenCalled();
  });

  it('does not call console.info when level is WARN', () => {
    logger.setLogLevel(LOG_LEVELS.WARN);
    const infoSpy = vi.spyOn(console, 'info').mockImplementation(() => {});
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    logger.info('hidden-info');
    expect(infoSpy).not.toHaveBeenCalled();
    logger.warn('visible-warn');
    expect(warnSpy).toHaveBeenCalled();
  });

  it('does not call console.warn/debug/info when level is ERROR', () => {
    logger.setLogLevel(LOG_LEVELS.ERROR);
    const debugSpy = vi.spyOn(console, 'debug').mockImplementation(() => {});
    const infoSpy = vi.spyOn(console, 'info').mockImplementation(() => {});
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    logger.debug('d');
    logger.info('i');
    logger.warn('w');
    expect(debugSpy).not.toHaveBeenCalled();
    expect(infoSpy).not.toHaveBeenCalled();
    expect(warnSpy).not.toHaveBeenCalled();
  });

  it('ignores invalid log level', () => {
    logger.setLogLevel(LOG_LEVELS.INFO);
    // @ts-expect-error - invalid level
    logger.setLogLevel('invalid');
    // level should remain 'info', so debug is hidden
    const spy = vi.spyOn(console, 'debug').mockImplementation(() => {});
    logger.debug('hidden');
    expect(spy).not.toHaveBeenCalled();
  });

  it('logApiError calls error with endpoint and merged data', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    logger.logApiError('/api/foo', new Error('api-fail'), { userId: 1 });
    expect(spy).toHaveBeenCalled();
    const args = spy.mock.calls[0];
    expect(args[0]).toContain('API Error: /api/foo');
    expect(args[2]).toMatchObject({ endpoint: '/api/foo', userId: 1 });
  });

  it('logUserAction calls info with action prefix', () => {
    const spy = vi.spyOn(console, 'info').mockImplementation(() => {});
    logger.logUserAction('click_button', { id: 'x' });
    expect(spy).toHaveBeenCalled();
    const args = spy.mock.calls[0];
    expect(args[0]).toContain('User Action: click_button');
    expect(args[1]).toEqual({ id: 'x' });
  });

  it('logSystemEvent calls info with event prefix', () => {
    const spy = vi.spyOn(console, 'info').mockImplementation(() => {});
    logger.logSystemEvent('app_start', {});
    expect(spy).toHaveBeenCalled();
    const args = spy.mock.calls[0];
    expect(args[0]).toContain('System Event: app_start');
  });

  it('debug default data is empty object', () => {
    const spy = vi.spyOn(console, 'debug').mockImplementation(() => {});
    logger.debug('no-data');
    expect(spy.mock.calls[0][1]).toEqual({});
  });
});
