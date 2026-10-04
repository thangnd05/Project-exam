import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.dirname(fileURLToPath(import.meta.url));

const API_ORIGIN = (process.env.API_ORIGIN ?? '').replace(/\/$/, '');

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
      {
        // Trang đặt lại mật khẩu nhận token qua URL: cấm gửi Referer đi bất cứ đâu
        // để token không rò sang bên thứ ba, thay vì phó mặc cho mặc định của trình duyệt.
        source: '/reset',
        headers: [{ key: 'Referrer-Policy', value: 'no-referrer' }],
      },
    ];
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

export default nextConfig;
