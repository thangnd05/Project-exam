import type { MetadataRoute } from 'next';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      // Khu riêng tư và khu quản trị không có gì đáng index, lại còn tốn ngân sách thu thập.
      disallow: ['/admin/', '/my-', '/learning-plans/', '/tests/', '/profile', '/oauth2/'],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
