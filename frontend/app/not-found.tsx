import Link from 'next/link';

// Chỉ gặp khi proxy không xử lý đường dẫn (vd /abc.xyz). Trang 404 thường nằm ở app/[locale]/not-found.tsx.
// Nằm ngoài NextIntlClientProvider nên dùng next/link gốc, không dùng Link của app/i18n.
export default function RootNotFound() {
  return (
    <html lang="vi">
      <body style={{ fontFamily: 'system-ui, sans-serif', textAlign: 'center', padding: '64px 24px' }}>
        <h1>404</h1>
        <p>Không tìm thấy trang. / Page not found.</p>
        <Link href="/">Về trang chủ / Go to homepage</Link>
      </body>
    </html>
  );
}
