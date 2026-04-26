import React, { ComponentType, ErrorInfo, ReactNode } from 'react';
import logger from './logger';

// 错误处理工具
const errorHandler = {
  // 处理API错误
  handleApiError: (error: any, fallbackMessage: string = '网络请求失败，请稍后重试'): string => {
    logger.logApiError(error.config?.url || 'unknown', error);
    
    if (error.response) {
      // 服务器返回错误状态码
      const status = error.response.status;
      switch (status) {
        case 400:
          return error.response.data?.message || '请求参数错误';
        case 401:
          return '未授权，请重新登录';
        case 403:
          return '拒绝访问';
        case 404:
          return '请求的资源不存在';
        case 500:
          return '服务器内部错误';
        default:
          return error.response.data?.message || fallbackMessage;
      }
    } else if (error.request) {
      // 请求已发出但没有收到响应
      return '网络连接失败，请检查网络设置';
    } else {
      // 请求配置出错
      return error.message || fallbackMessage;
    }
  },
  
  // 处理表单错误
  handleFormError: (errors: any, fallbackMessage: string = '表单数据有误'): string => {
    if (typeof errors === 'string') {
      return errors;
    }
    
    if (errors && typeof errors === 'object') {
      // 提取第一个错误信息
      const firstError = Object.values(errors)[0];
      return firstError || fallbackMessage;
    }
    
    return fallbackMessage;
  },
  
  // 处理通用错误
  handleError: (error: any, fallbackMessage: string = '操作失败，请稍后重试'): string => {
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
  async handleAsyncError<T>(asyncFn: () => Promise<T>, fallbackValue: T | null = null): Promise<T | null> {
    try {
      return await asyncFn();
    } catch (error) {
      logger.error('Async Error', error);
      return fallbackValue;
    }
  },
  
  // 生成错误边界组件
  createErrorBoundary<P extends object>(Component: ComponentType<P>, fallbackComponent: ComponentType<{ error: Error }>): ComponentType<P> {
    return class ErrorBoundary extends React.Component<P, { hasError: boolean; error: Error | null }> {
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
          return React.createElement(fallbackComponent, { error: this.state.error as Error });
        }
        return React.createElement(Component, this.props);
      }
    };
  }
};

export default errorHandler;