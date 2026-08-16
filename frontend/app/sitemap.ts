import type { MetadataRoute } from 'next';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

export default function sitemap(): MetadataRoute.Sitemap {
  const paths = ['', '/about', '/posts', '/policy', '/service', '/certificates/verify'];
  return paths.map((p) => ({
    url: `${SITE_URL}${p}`,
    lastModified: new Date(),
    changeFrequency: p === '/posts' ? 'daily' : 'monthly',
    priority: p === '' ? 1 : 0.7,
  }));
}
