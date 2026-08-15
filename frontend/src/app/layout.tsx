// Root layout của Next App Router.
//
// Đây là nơi duy nhất còn giữ phần <html>/<head> mà trước kia nằm ở index.html của Vite.
// Toàn bộ app hiện chạy trong client shell ở [[...slug]]/page.js (react-router vẫn điều
// hướng như cũ) — xem MIGRATION-NEXT.md. Metadata khai ở đây áp cho MỌI trang; khi bóc
// route nào ra thành route Next thật thì trang đó tự khai metadata riêng đè lên.

import 'bootstrap/dist/css/bootstrap.min.css';
import 'react-toastify/dist/ReactToastify.css';
import '~/shared/styles/GlobalStyles/GlobalStyles.scss';
import '~/shared/styles/global-overrides.scss';
import Providers from './providers';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
const SITE_NAME = 'WinDe Exam';
const DESCRIPTION =
  'Nền tảng luyện thi TOEIC & chứng chỉ trực tuyến: đề thi thử bám sát format thật, ' +
  'chấm điểm tự động, chẩn đoán điểm yếu và lộ trình học cá nhân hoá.';

export const metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${SITE_NAME} — Luyện thi TOEIC & chứng chỉ trực tuyến`,
    template: `%s | ${SITE_NAME}`,
  },
  description: DESCRIPTION,
  applicationName: SITE_NAME,
  manifest: '/site.webmanifest',
  icons: {
    icon: '/favicons/logoWD.svg?v=3',
  },
  openGraph: {
    type: 'website',
    siteName: SITE_NAME,
    locale: 'vi_VN',
    url: SITE_URL,
    title: `${SITE_NAME} — Luyện thi TOEIC & chứng chỉ trực tuyến`,
    description: DESCRIPTION,
    images: [{ url: '/logoW.png', width: 1200, height: 630, alt: SITE_NAME }],
  },
  twitter: {
    card: 'summary_large_image',
    title: `${SITE_NAME} — Luyện thi TOEIC & chứng chỉ trực tuyến`,
    description: DESCRIPTION,
    images: ['/logoW.png'],
  },
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#000000',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi" data-theme="normal">
      <body>
        <noscript>Bạn cần bật JavaScript để dùng ứng dụng này.</noscript>
        <div id="root">
          <Providers>{children}</Providers>
        </div>
      </body>
    </html>
  );
}
