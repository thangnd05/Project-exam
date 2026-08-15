import type { MetadataRoute } from 'next';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

/**
 * Chỉ liệt kê trang công khai tĩnh. Khi cần đẩy cả bài viết lên sitemap thì fetch danh sách
 * bài từ API ở đây rồi nối vào mảng — nhớ giới hạn số lượng, sitemap tối đa 50.000 URL.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const paths = ['', '/about', '/posts', '/policy', '/service', '/certificates/verify'];
  return paths.map((p) => ({
    url: `${SITE_URL}${p}`,
    lastModified: new Date(),
    changeFrequency: p === '/posts' ? 'daily' : 'monthly',
    priority: p === '' ? 1 : 0.7,
  }));
}
