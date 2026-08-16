'use client';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="vi">
      <body
        style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '16px',
          fontFamily: 'system-ui, sans-serif',
          textAlign: 'center',
          padding: '24px',
        }}
      >
        <h2 style={{ fontSize: '22px', margin: 0 }}>Ứng dụng gặp sự cố</h2>
        <p style={{ fontSize: '15px', margin: 0, maxWidth: '520px' }}>
          Đã có lỗi nghiêm trọng khiến trang không tải được. Bạn thử lại giúp mình nhé.
        </p>
        <button
          type="button"
          onClick={reset}
          style={{
            padding: '10px 20px',
            fontSize: '15px',
            borderRadius: '8px',
            border: 'none',
            cursor: 'pointer',
          }}
        >
          Thử lại
        </button>
        {error.digest ? (
          <span style={{ fontSize: '12px', fontFamily: 'monospace' }}>Mã lỗi: {error.digest}</span>
        ) : null}
      </body>
    </html>
  );
}
