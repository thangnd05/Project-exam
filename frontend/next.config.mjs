import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.dirname(fileURLToPath(import.meta.url));

// Origin của Spring backend. Chỉ dùng ở phía server (rewrites + fetch trong
// generateMetadata) nên KHÔNG đặt tiền tố NEXT_PUBLIC_ — browser không cần biết.
const API_ORIGIN = (process.env.API_ORIGIN || 'http://localhost:8080').replace(/\/$/, '');

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  images: {
    // Ảnh người dùng tải lên nằm trên Cloudinary; ảnh do backend trả về đi qua proxy
    // /api nên cùng origin, không cần khai ở đây.
    remotePatterns: [
      { protocol: 'https', hostname: 'res.cloudinary.com' },
      { protocol: 'https', hostname: 'lh3.googleusercontent.com' }, // avatar Google
    ],
  },

  // Browser gọi thẳng /api/... trên chính domain của FE, Next chuyển tiếp sang Spring.
  // Nhờ vậy cookie accessToken/XSRF-TOKEN do backend set trở thành cookie của domain FE
  // → middleware.ts đọc được, và không còn cần CORS.
  //
  // Luồng Google OAuth cũng phải đi qua proxy, nếu không cookie sẽ rơi vào domain backend
  // và middleware không thấy phiên đăng nhập. Kèm theo đó backend đặt
  // `redirect-uri=${app.frontend.origin}/login/oauth2/code/google`, và URI này phải được
  // khai trong Google Cloud Console.
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
    // Cho phép đường dẫn tuyệt đối từ root dự án trong file .scss (app/assets/styles/...).
    // `loadPaths` là tên của Sass API hiện đại mà Turbopack dùng; `includePaths` là tên cũ,
    // giữ lại để bản build bằng webpack (`next build --webpack`) vẫn chạy được.
    loadPaths: [root],
    includePaths: [root],
    quietDeps: true,
    silenceDeprecations: ['import', 'global-builtin', 'color-functions'],
  },

  // Không khai `webpack:` ở đây. Next 16 build bằng Turbopack và sẽ BÁO LỖI nếu gặp config
  // webpack. Alias '@' → root vẫn chạy vì Next đọc thẳng "paths" trong tsconfig.json.
};

export default nextConfig;
