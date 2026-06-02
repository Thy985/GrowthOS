import React, { Component, type ReactNode } from 'react';

interface Props {
  children: ReactNode,
  fallback?: ReactNode,
}

interface State {
  hasError: boolean,
  error: Error | null,
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  handleReset = (): void => {
    this.setState({ hasError: false, error: null });
  };

  render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="error-boundary">
          <div className="error-content">
            <h1>出错了</h1>
            <p>抱歉，应用遇到了一些问题。</p>
            {this.state.error && (
              <details className="error-message">
                <summary>错误详情</summary>
                <pre>{this.state.error.toString()}</pre>
              </details>
            )}
            <button
              className="btn btn-primary"
              onClick={this.handleReset}
              style={{ marginTop: '16px' }}
            >
              重试
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
