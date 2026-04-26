import React from 'react';
import logger from '../common/utils/logger.ts';

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    // 更新状态，下次渲染将显示错误界面
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    // 记录错误信息
    logger.error('Error Boundary', error, errorInfo);
  }

  render(): React.ReactNode {
    if (this.state.hasError) {
      // 自定义错误界面
      return (
        <div className="error-boundary">
          <div className="error-content">
            <h1>出错了</h1>
            <p>抱歉，页面出现了错误。</p>
            <p className="error-message">{this.state.error?.message || '未知错误'}</p>
            <button 
              className="btn btn-primary"
              onClick={() => window.location.reload()}
            >
              刷新页面
            </button>
          </div>
        </div>
      );
    }

    // 如果没有错误，正常渲染子组件
    return this.props.children;
  }
}

export default ErrorBoundary;