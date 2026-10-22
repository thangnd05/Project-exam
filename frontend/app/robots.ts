import type { MetadataRoute } from 'next';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      // Bản tiếng Anh nằm dưới /en nên chặn cả hai.
      disallow: ['/admin/', '/my-', '/learning-plans/', '/tests/', '/dashboard', '/oauth2/'].flatMap((p) => [p, `/en${p}`]),
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
