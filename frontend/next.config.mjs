import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.dirname(fileURLToPath(import.meta.url));
const srcDir = path.resolve(root, 'src');

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  // Ảnh trong app đến từ Cloudinary / backend và đang render bằng thẻ <img> thường.
  // Chưa dùng next/image nên không cần khai remotePatterns; khi nào đổi sang next/image
  // thì bổ sung ở đây.

  sassOptions: {
    // Cho phép @use '~/...' và đường dẫn tuyệt đối từ src trong file .scss
    includePaths: [srcDir],
    quietDeps: true,
    silenceDeprecations: ['import', 'global-builtin', 'color-functions'],
  },

  webpack: (config) => {
    // Giữ alias '~' vốn có của bản Vite (74 file đang dùng)
    config.resolve.alias = {
      ...config.resolve.alias,
      '~': srcDir,
    };
    return config;
  },
};

export default nextConfig;
