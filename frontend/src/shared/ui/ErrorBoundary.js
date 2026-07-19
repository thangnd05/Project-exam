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
            minHeight: '70vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '2.4rem',
            background:
              'radial-gradient(1200px 600px at 50% -10%, rgba(0, 97, 242, 0.08), transparent 60%)',
          }}
        >
          <div
            style={{
              width: '100%',
              maxWidth: '46rem',
              background: 'var(--bg-white)',
              border: '1px solid var(--border-color)',
              borderRadius: '2rem',
              boxShadow: '0 24px 60px rgba(15, 23, 42, 0.1)',
              padding: '4rem 3.2rem',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '1.6rem',
              textAlign: 'center',
            }}
          >
            <div
              style={{
                width: '9.6rem',
                height: '9.6rem',
                borderRadius: '50%',
                display: 'grid',
                placeItems: 'center',
                background:
                  'linear-gradient(135deg, rgba(0, 97, 242, 0.12) 0%, rgba(0, 198, 255, 0.14) 100%)',
                color: 'var(--primary-color)',
              }}
            >
              <svg
                width="52"
                height="52"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z" />
                <line x1="12" y1="9" x2="12" y2="13" />
                <line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
            </div>

            <h2
              style={{
                fontSize: '2.4rem',
                fontWeight: 800,
                margin: 0,
                color: 'var(--text-color)',
              }}
            >
              Đã có lỗi xảy ra
            </h2>
            <p
              style={{
                color: 'var(--text-secondary)',
                margin: 0,
                fontSize: '1.5rem',
                lineHeight: 1.6,
                maxWidth: '34rem',
              }}
            >
              Xin lỗi vì sự bất tiện. Bạn hãy thử tải lại trang hoặc quay lại
              trang trước đó.
            </p>

            <div
              style={{
                display: 'flex',
                gap: '1.2rem',
                flexWrap: 'wrap',
                justifyContent: 'center',
                marginTop: '0.8rem',
              }}
            >
              <button
                type="button"
                onClick={() => window.location.reload()}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.8rem',
                  padding: '1.1rem 2.2rem',
                  borderRadius: '1rem',
                  border: 'none',
                  background:
                    'var(--primary-btn-gradient, linear-gradient(135deg, #0061f2 0%, #0056d2 100%))',
                  color: 'var(--white)',
                  fontSize: '1.5rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  boxShadow: 'var(--primary-btn-shadow, 0 10px 22px rgba(0, 97, 242, 0.28))',
                  transition: 'transform 0.15s ease, box-shadow 0.15s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-1px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M23 4v6h-6" />
                  <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
                </svg>
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
                  padding: '1.1rem 2.2rem',
                  borderRadius: '1rem',
                  border: '1px solid var(--border-color)',
                  background: 'var(--bg-white)',
                  color: 'var(--text-color)',
                  fontSize: '1.5rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'border-color 0.15s ease, background 0.15s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'var(--hover-color)';
                  e.currentTarget.style.borderColor = 'var(--primary-color)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'var(--bg-white)';
                  e.currentTarget.style.borderColor = 'var(--border-color)';
                }}
              >
                Quay lại
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
