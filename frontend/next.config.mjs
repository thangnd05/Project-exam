import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  // Ảnh trong app đến từ Cloudinary / backend và đang render bằng thẻ <img> thường.
  // Chưa dùng next/image nên không cần khai remotePatterns; khi nào đổi sang next/image
  // thì bổ sung ở đây.

  sassOptions: {
    // Cho phép đường dẫn tuyệt đối từ root dự án trong file .scss (app/assets/styles/...)
    includePaths: [root],
    quietDeps: true,
    silenceDeprecations: ['import', 'global-builtin', 'color-functions'],
  },

  webpack: (config) => {
    // Alias '@' → root, khớp với "paths" trong tsconfig (chuẩn edusoft: @/app/...)
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': root,
    };
    return config;
  },
};

export default nextConfig;
