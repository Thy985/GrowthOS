import React from 'react';
import logger from '../common/utils/logger.ts';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    // 更新状态，下次渲染将显示错误界面
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // 记录错误信息
    logger.error('Error Boundary', error, errorInfo);
  }

  render() {
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
