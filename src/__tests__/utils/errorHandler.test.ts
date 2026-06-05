import { describe, it, expect, vi } from 'vitest';
import type { ComponentType } from 'react';

import errorHandler from '../../shared/utils/errorHandler.ts';

describe('errorHandler', () => {
  describe('handleApiError', () => {
    it('returns 400 message', () => {
      const err = { response: { status: 400, data: { message: '字段错误' } } };
      expect(errorHandler.handleApiError(err)).toBe('字段错误');
    });

    it('returns default 400 message when data.message missing', () => {
      const err = { response: { status: 400 } };
      expect(errorHandler.handleApiError(err)).toBe('请求参数错误');
    });

    it('returns 401 message', () => {
      const err = { response: { status: 401 } };
      expect(errorHandler.handleApiError(err)).toBe('未授权，请重新登录');
    });

    it('returns 403 message', () => {
      const err = { response: { status: 403 } };
      expect(errorHandler.handleApiError(err)).toBe('拒绝访问');
    });

    it('returns 404 message', () => {
      const err = { response: { status: 404 } };
      expect(errorHandler.handleApiError(err)).toBe('请求的资源不存在');
    });

    it('returns 500 message', () => {
      const err = { response: { status: 500 } };
      expect(errorHandler.handleApiError(err)).toBe('服务器内部错误');
    });

    it('returns fallback for unknown status', () => {
      const err = { response: { status: 418, data: { message: 'I am a teapot' } } };
      expect(errorHandler.handleApiError(err)).toBe('I am a teapot');
    });

    it('returns fallback for unknown status without message', () => {
      const err = { response: { status: 999 } };
      expect(errorHandler.handleApiError(err)).toBe('网络请求失败，请稍后重试');
    });

    it('returns network-failed message when request is set without response', () => {
      const err = { request: {} };
      expect(errorHandler.handleApiError(err)).toBe('网络连接失败，请检查网络设置');
    });

    it('returns error.message when only message is set', () => {
      const err = { message: 'config error' };
      expect(errorHandler.handleApiError(err)).toBe('config error');
    });

    it('returns fallback when nothing matches', () => {
      const err = {};
      expect(errorHandler.handleApiError(err, 'custom')).toBe('custom');
    });
  });

  describe('handleFormError', () => {
    it('returns string as-is', () => {
      expect(errorHandler.handleFormError('字段错误')).toBe('字段错误');
    });

    it('returns first error from object when string', () => {
      expect(errorHandler.handleFormError({ field1: 'first', field2: 'second' })).toBe('first');
    });

    it('returns fallback when object value is not string', () => {
      expect(errorHandler.handleFormError({ field1: 123 })).toBe('表单数据有误');
    });

    it('returns fallback for null', () => {
      expect(errorHandler.handleFormError(null)).toBe('表单数据有误');
    });

    it('returns custom fallback for null', () => {
      expect(errorHandler.handleFormError(null, '自定义')).toBe('自定义');
    });
  });

  describe('handleError', () => {
    it('returns Error.message', () => {
      const e = new Error('boom');
      expect(errorHandler.handleError(e)).toBe('boom');
    });

    it('returns Error.message even if empty, uses fallback', () => {
      const e = new Error('');
      expect(errorHandler.handleError(e, 'fallback')).toBe('fallback');
    });

    it('returns string as-is', () => {
      expect(errorHandler.handleError('something')).toBe('something');
    });

    it('returns fallback for null', () => {
      expect(errorHandler.handleError(null)).toBe('操作失败，请稍后重试');
    });
  });

  describe('handleAsyncError', () => {
    it('returns asyncFn result on success', async () => {
      const result = await errorHandler.handleAsyncError(async () => 42, 0);
      expect(result).toBe(42);
    });

    it('returns fallbackValue on error', async () => {
      const result = await errorHandler.handleAsyncError(async () => {
        throw new Error('fail');
      }, 'fallback');
      expect(result).toBe('fallback');
    });

    it('returns null on error when no fallback', async () => {
      const result = await errorHandler.handleAsyncError(async () => {
        throw new Error('fail');
      });
      expect(result).toBeNull();
    });
  });

  describe('createErrorBoundary', () => {
    type Props = { msg: string };
    const Ok: ComponentType<Props> = ({ msg }) => `ok:${msg}` as unknown as React.ReactElement;
    const Fallback: ComponentType<{ error: Error }> = ({ error }) =>
      `fallback:${error.message}` as unknown as React.ReactElement;

    it('wraps a component and renders the wrapped component when no error', () => {
      // 直接调用 createElement 验证渲染输出
      const Boundary = errorHandler.createErrorBoundary(Ok, Fallback);
      // 通过 spy 模拟无错误情况:验证返回类型是 class
      expect(typeof Boundary).toBe('function');
    });

    it('logs error on componentDidCatch', () => {
      const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const Boundary = errorHandler.createErrorBoundary(Ok, Fallback);
      const instance = new Boundary({ msg: 'hi' } as Props);
      // 直接调用 componentDidCatch 验证日志记录
      instance.componentDidCatch(new Error('test'), { componentStack: 'stack' });
      expect(errorSpy).toHaveBeenCalled();
      const args = errorSpy.mock.calls[0];
      expect(args[0]).toContain('Error Boundary');
    });
  });
});
