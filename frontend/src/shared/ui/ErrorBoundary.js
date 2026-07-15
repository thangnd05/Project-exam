import { Component } from 'react';

/**
 * Bắt lỗi render trong cây con để không "trắng cả app".
 * Dùng bọc quanh <Routes/> (và có thể bọc riêng các route nặng).
 */
class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    // TODO: thay bằng logger/monitoring khi có (Sentry...).
    console.error('ErrorBoundary caught:', error, info);
  }

  handleReset = () => {
    this.setState({ hasError: false });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }
      return (
        <div
          style={{
            minHeight: '60vh',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '1.2rem',
            textAlign: 'center',
            padding: '2rem',
          }}
        >
          <h2 style={{ fontSize: '2rem', margin: 0 }}>Đã có lỗi xảy ra</h2>
          <p style={{ color: 'var(--text-secondary, #6b7280)', margin: 0 }}>
            Xin lỗi vì sự bất tiện. Bạn hãy thử tải lại trang.
          </p>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <button
              type="button"
              onClick={() => window.location.reload()}
              style={{
                padding: '0.8rem 1.6rem',
                borderRadius: '0.8rem',
                border: 'none',
                background: 'var(--primary-color, #2563eb)',
                color: '#fff',
                cursor: 'pointer',
              }}
            >
              Tải lại trang
            </button>
            <button
              type="button"
              onClick={() => {
                this.handleReset();
                window.history.length > 1
                  ? window.history.back()
                  : (window.location.href = '/');
              }}
              style={{
                padding: '0.8rem 1.6rem',
                borderRadius: '0.8rem',
                border: '1px solid var(--border-color, #d1d5db)',
                background: 'transparent',
                cursor: 'pointer',
              }}
            >
              Quay lại
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
