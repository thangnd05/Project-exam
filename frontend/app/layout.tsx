// Root layout của Next App Router.
//
// Đây là nơi duy nhất còn giữ phần <html>/<body> mà trước kia nằm ở index.html của Vite.
// Mỗi URL giờ là một route Next thật (react-router đã gỡ) — xem MIGRATION-NEXT.md.
// Metadata khai ở đây là mặc định cho MỌI trang; trang nào cần riêng thì tự khai
// `metadata`/`generateMetadata` trong page.tsx của nó để đè lên (template `%s | ...`).

import 'bootstrap/dist/css/bootstrap.min.css';
import 'react-toastify/dist/ReactToastify.css';
import '@/app/assets/styles/GlobalStyles/GlobalStyles.scss';
import '@/app/assets/styles/global-overrides.scss';
import Providers from './providers';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
const SITE_NAME = 'WinDe Exam';
const DESCRIPTION =
  'Nền tảng luyện thi & thi thử chứng chỉ trực tuyến: đề bám sát format thật, ' +
  'chấm điểm tự động, chẩn đoán điểm yếu và lộ trình học cá nhân hoá.';
const TITLE = `${SITE_NAME} — Luyện thi & thi thử chứng chỉ trực tuyến`;

export const metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: TITLE,
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
    title: TITLE,
    description: DESCRIPTION,
    images: [{ url: '/logoW.png', width: 1200, height: 630, alt: SITE_NAME }],
  },
  twitter: {
    card: 'summary_large_image',
    title: TITLE,
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
