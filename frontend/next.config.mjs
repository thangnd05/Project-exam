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
