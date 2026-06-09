import type { ComponentType, ErrorInfo } from 'react';
import { Component, createElement } from 'react';

import logger from './logger';

// 表单错误对象类型
type FormErrors = Record<string, string | Record<string, unknown>>;

// 错误处理工具
const errorHandler = {
  // 处理API错误
  handleApiError(error: unknown, fallbackMessage: string = '网络请求失败，请稍后重试'): string {
    const endpoint =
      error && typeof error === 'object' && 'config' in error
        ? (error as { config?: { url?: string } }).config?.url || 'unknown'
        : 'unknown';
    logger.logApiError(endpoint, error);

    if (error && typeof error === 'object' && 'response' in error) {
      const axiosError = error as {
        response?: { status?: number; data?: { message?: string } };
        request?: unknown;
        message?: string;
      };
      const status = axiosError.response?.status;
      switch (status) {
        case 400:
          return axiosError.response?.data?.message || '请求参数错误';
        case 401:
          return '未授权，请重新登录';
        case 403:
          return '拒绝访问';
        case 404:
          return '请求的资源不存在';
        case 500:
          return '服务器内部错误';
        default:
          return axiosError.response?.data?.message || fallbackMessage;
      }
    } else if (error && typeof error === 'object' && 'request' in error) {
      return '网络连接失败，请检查网络设置';
    } else {
      const msg =
        error instanceof Error
          ? error.message
          : error && typeof error === 'object' && 'message' in error
            ? String((error as { message?: string }).message)
            : null;
      return msg || fallbackMessage;
    }
  },

  // 处理表单错误
  handleFormError(errors: unknown, fallbackMessage: string = '表单数据有误'): string {
    if (typeof errors === 'string') {
      return errors;
    }

    if (errors && typeof errors === 'object') {
      const firstError = Object.values(errors as FormErrors)[0];
      return typeof firstError === 'string' ? firstError : fallbackMessage;
    }

    return fallbackMessage;
  },

  // 处理通用错误
  handleError(error: unknown, fallbackMessage: string = '操作失败，请稍后重试'): string {
    if (error instanceof Error) {
      logger.error('Error', error);
      return error.message || fallbackMessage;
    }

    if (typeof error === 'string') {
      return error;
    }

    return fallbackMessage;
  },

  // 处理异步操作错误
  async handleAsyncError<T>(
    asyncFn: () => Promise<T>,
    fallbackValue: T | null = null,
  ): Promise<T | null> {
    try {
      return await asyncFn();
    } catch (error) {
      logger.error('Async Error', error);
      return fallbackValue;
    }
  },

  // 生成错误边界组件
  createErrorBoundary<P extends object>(
    WrappedComponent: ComponentType<P>,
    fallbackComponent: ComponentType<{ error: Error }>,
  ): ComponentType<P> {
    return class ErrorBoundary extends Component<P, { hasError: boolean; error: Error | null }> {
      constructor(props: P) {
        super(props);
        this.state = { hasError: false, error: null };
      }

      static getDerivedStateFromError(error: Error) {
        return { hasError: true, error };
      }

      componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        logger.error('Error Boundary', error, errorInfo);
      }

      render() {
        if (this.state.hasError) {
          return createElement(fallbackComponent, { error: this.state.error as Error });
        }
        return createElement(WrappedComponent, this.props);
      }
    };
  },
};

export default errorHandler;
