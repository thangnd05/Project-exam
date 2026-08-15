'use client';

import { Component } from 'react';
import ButtonPrime from './Button/ButtonPrime';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {

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
              'radial-gradient(1200px 600px at 50% -10%, var(--primary-alpha-08), transparent 60%)',
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
            <style>{`
              @keyframes eb-float {
                0%, 100% { transform: translateY(0) rotate(-2deg); }
                50% { transform: translateY(-1rem) rotate(2deg); }
              }
              @keyframes eb-blink {
                0%, 92%, 100% { transform: scaleY(1); }
                96% { transform: scaleY(0.1); }
              }
              @keyframes eb-drop {
                0%, 100% { transform: translateY(0); opacity: 0.9; }
                50% { transform: translateY(0.5rem); opacity: 1; }
              }
              @keyframes eb-shadow {
                0%, 100% { transform: scaleX(1); opacity: 0.28; }
                50% { transform: scaleX(0.8); opacity: 0.18; }
              }
              @keyframes eb-pop {
                0% { transform: scale(0.7); opacity: 0; }
                60% { transform: scale(1.06); }
                100% { transform: scale(1); opacity: 1; }
              }
              .eb-mascot { animation: eb-float 3.4s ease-in-out infinite; transform-origin: center; }
              .eb-eye { animation: eb-blink 4s ease-in-out infinite; transform-origin: center; transform-box: fill-box; }
              .eb-drop { animation: eb-drop 2s ease-in-out infinite; transform-origin: center; transform-box: fill-box; }
              .eb-shadow { animation: eb-shadow 3.4s ease-in-out infinite; transform-origin: center; transform-box: fill-box; }
              @media (prefers-reduced-motion: reduce) {
                .eb-mascot, .eb-eye, .eb-drop, .eb-shadow { animation: none !important; }
              }
            `}</style>

            <div
              style={{
                animation: 'eb-pop 0.5s ease-out both',
              }}
            >
              <svg
                width="150"
                height="150"
                viewBox="0 0 160 160"
                fill="none"
                aria-hidden="true"
              >

                <ellipse
                  className="eb-shadow"
                  cx="80"
                  cy="146"
                  rx="42"
                  ry="8"
                  fill="var(--primary)"
                />
                <g className="eb-mascot">

                  <rect
                    x="26"
                    y="30"
                    width="108"
                    height="100"
                    rx="42"
                    fill="url(#eb-body)"
                  />

                  <circle cx="52" cy="92" r="8" fill="#ffb0c4" opacity="0.75" />
                  <circle cx="108" cy="92" r="8" fill="#ffb0c4" opacity="0.75" />

                  <circle className="eb-eye" cx="62" cy="76" r="6.5" fill="#1e293b" />
                  <circle className="eb-eye" cx="98" cy="76" r="6.5" fill="#1e293b" />
                  <circle cx="64" cy="74" r="2" fill="#ffffff" />
                  <circle cx="100" cy="74" r="2" fill="#ffffff" />

                  <path
                    d="M70 100 Q80 92 90 100"
                    stroke="#1e293b"
                    strokeWidth="3.5"
                    strokeLinecap="round"
                    fill="none"
                  />

                  <path
                    className="eb-drop"
                    d="M126 58 c0 5 -6 8 -6 13 a6 6 0 0 0 12 0 c0 -5 -6 -8 -6 -13 Z"
                    fill="var(--brand-400)"
                  />
                </g>
                <defs>
                  <linearGradient id="eb-body" x1="26" y1="30" x2="134" y2="130" gradientUnits="userSpaceOnUse">
                    <stop stopColor="var(--brand-100)" />
                    <stop offset="1" stopColor="var(--brand-200)" />
                  </linearGradient>
                </defs>
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
              Ôi, có gì đó trục trặc rồi!
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
              Mình xin lỗi vì sự cố. Bạn thử tải lại trang
              hoặc quay lại trang trước nhé!
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
              <ButtonPrime
                variant="primary"
                size="lg"
                onClick={() => window.location.reload()}
              >
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.8rem',
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
                </span>
              </ButtonPrime>
              <ButtonPrime
                variant="outline"
                size="lg"
                onClick={() => {
                  this.handleReset();
                  window.history.length > 1
                    ? window.history.back()
                    : (window.location.href = '/');
                }}
              >
                Quay lại
              </ButtonPrime>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
