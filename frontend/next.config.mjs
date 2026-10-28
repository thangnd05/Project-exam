import path from 'node:path';
import { fileURLToPath } from 'node:url';
import createNextIntlPlugin from 'next-intl/plugin';

const root = path.dirname(fileURLToPath(import.meta.url));

const API_ORIGIN = (process.env.API_ORIGIN ?? '').replace(/\/$/, '');
const isDev = process.env.NODE_ENV !== 'production';

// Trình duyệt gọi thẳng API khi NEXT_PUBLIC_API_BASE_URL là URL tuyệt đối (khác origin với trang).
const browserApiOrigin = (() => {
  try {
    return new URL(process.env.NEXT_PUBLIC_API_BASE_URL ?? '').origin;
  } catch {
    return '';
  }
})();

// Next chèn script inline để hydrate nên script-src vẫn cần 'unsafe-inline'; chặn khung, plugin,
// base/form trỏ ra ngoài và giới hạn nguồn script về site + reCAPTCHA.
const contentSecurityPolicy = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ''} https://www.google.com https://www.gstatic.com`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https:",
  "media-src 'self' blob: https:",
  "font-src 'self' data:",
  `connect-src 'self'${browserApiOrigin ? ` ${browserApiOrigin}` : ''}${isDev ? ' ws: wss:' : ''}`,
  'frame-src https://www.google.com https://www.youtube.com https://www.youtube-nocookie.com',
  "frame-ancestors 'none'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  ...(isDev ? [] : ['upgrade-insecure-requests']),
].join('; ');

const securityHeaders = [
  { key: 'Content-Security-Policy', value: contentSecurityPolicy },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), payment=()' },
  // Trình duyệt bỏ qua HSTS trên HTTP nên chỉ cần gửi ở bản production (chạy sau HTTPS).
  ...(isDev ? [] : [{ key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains' }]),
];

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    // Rewrite /api tới backend mặc định cắt sau ~30 giây; import vài nghìn câu hỏi có thể lâu hơn.
    proxyTimeout: 300_000,
  },
  allowedDevOrigins: ['127.0.0.1', 'localhost', '10.255.255.254', '*.local-origin.dev'],
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'res.cloudinary.com' },
      { protocol: 'https', hostname: 'lh3.googleusercontent.com' },
    ],
  },

  async headers() {
    return [
      { source: '/:path*', headers: securityHeaders },
      {
        // Trang đặt lại mật khẩu nhận token qua URL: cấm gửi Referer đi bất cứ đâu
        // để token không rò sang bên thứ ba, thay vì phó mặc cho mặc định của trình duyệt.
        source: '/reset',
        headers: [{ key: 'Referrer-Policy', value: 'no-referrer' }],
      },
    ];
  },

  // URL cũ trước khi đổi theo bảng SEO: trả 308 để link đã chia sẻ và thứ hạng tìm kiếm chuyển sang URL mới.
  // Chạy trước proxy.ts, nên /exam-types/<uuid> thành /exams/<uuid> rồi proxy mới đổi tiếp sang slug.
  async redirects() {
    const moved = [
      ['/exam-types', '/exams'],
      ['/exam-types/:path*', '/exams/:path*'],
      ['/policy', '/privacy-policy'],
      ['/service', '/terms'],
      ['/forgot', '/forgot-password'],
      // Trang cá nhân gom về /dashboard. Query giữ nguyên (vd ?exam=), trang mục tiêu tự đổi sang path.
      // Luật cụ thể phải đứng trước luật có :path* vì Next dùng luật khớp đầu tiên.
      ['/my-target', '/goals/new'],
      ['/my-target/dashboard', '/dashboard/goals'],
      ['/my-target/mocks', '/dashboard/goals'],
      ['/my-target/achieved', '/dashboard/goals/achieved'],
      ['/learning-plans', '/learning-paths'],
      ['/learning-plans/generate', '/learning-paths/create'],
      ['/learning-plans/:path*', '/dashboard/learning-paths/:path*'],
      // Lịch sử nhiệm vụ không còn lồng dưới lộ trình (theo bảng SEO).
      ['/dashboard/learning-paths/:learningPlanId/tasks/:taskId/history', '/dashboard/tasks/:taskId/history'],
      // Làm bài, kết quả, xem lại đáp án.
      ['/tests/:testId/start', '/mock-exams/:testId/take'],
      ['/tests/result/:userTestId', '/attempts/:userTestId'],
      ['/tests/result/:userTestId/review', '/attempts/:userTestId/review'],
      ['/tests/:testId/history', '/dashboard/mock-exams/:testId/attempts'],
      ['/tests/:testId/leaderboard', '/dashboard/mock-exams/:testId/leaderboard'],
      ['/my-certificates', '/dashboard/certificates'],
      // Ngân hàng câu hỏi cá nhân chỉ cần đăng nhập, không thuộc khu quản trị /admin.
      ['/admin/personal-question-bank', '/dashboard/question-bank'],
      ['/admin/create-test-from-bank', '/dashboard/question-bank/create-test'],
      // /certificates/verify/** vẫn là trang công khai, không chuyển.
      ['/certificates/:certificateId((?!verify$)[^/]+)', '/dashboard/certificates/:certificateId'],
    ];
    return moved.flatMap(([source, destination]) => [
      { source, destination, permanent: true },
      { source: `/en${source}`, destination: `/en${destination}`, permanent: true },
    ]);
  },

  async rewrites() {
    return {
      beforeFiles: [
        { source: '/api/:path*', destination: `${API_ORIGIN}/api/:path*` },
        {
          source: '/oauth2/authorization/:path*',
          destination: `${API_ORIGIN}/oauth2/authorization/:path*`,
        },
        { source: '/login/oauth2/:path*', destination: `${API_ORIGIN}/login/oauth2/:path*` },
      ],
    };
  },

  sassOptions: {
    loadPaths: [root],
    includePaths: [root],
    quietDeps: true,
    silenceDeprecations: ['import', 'global-builtin', 'color-functions'],
  },
};

const withNextIntl = createNextIntlPlugin('./app/i18n/request.ts');

export default withNextIntl(nextConfig);
