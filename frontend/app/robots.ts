import type { MetadataRoute } from 'next';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      // Bản tiếng Anh nằm dưới /en nên chặn cả hai. Trang cá nhân, làm bài, kết quả, lộ trình, mục tiêu không chặn
      // ở đây: các trang đó dùng noindex (đặt ở layout nhóm route), Googlebot phải tải được trang mới đọc được chỉ thị này.
      disallow: ['/admin/', '/oauth2/'].flatMap((p) => [p, `/en${p}`]),
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
