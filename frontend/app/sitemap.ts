import type { MetadataRoute } from 'next';
import type { ExamTypeResponse, PageResponse, PostSummaryResponse } from '@/app/types';
import { fetchPublicJson } from '@/app/utils/serverApi';
import routes, { buildExamTypeDetailPath } from '@/app/configs/Routes';
import { routing } from '@/app/i18n/routing';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

export const revalidate = 3600;

const STATIC_PATHS = [
  '',
  routes.about,
  routes.contact,
  routes.policy,
  routes.service,
  routes.examTypes,
  routes.posts,
  routes.certificateVerifyHome,
];

const MAX_POSTS = 500;

const localeUrl = (locale: string, path: string) =>
  locale === routing.defaultLocale ? `${SITE_URL}${path}` : `${SITE_URL}/${locale}${path}`;

// Mỗi trang ra một mục cho từng ngôn ngữ, mục nào cũng kèm đủ bản ngôn ngữ khác (hreflang trong sitemap).
function withLocales(entries: MetadataRoute.Sitemap, pathOf: (url: string) => string): MetadataRoute.Sitemap {
  return entries.flatMap((entry) => {
    const path = pathOf(entry.url);
    const languages = Object.fromEntries(routing.locales.map((l) => [l, localeUrl(l, path)]));
    return routing.locales.map((locale) => ({
      ...entry,
      url: localeUrl(locale, path),
      alternates: { languages },
    }));
  });
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Trang tài liệu /resources/:id là noindex theo bảng SEO nên không đưa vào đây.
  const [posts, examTypes] = await Promise.all([
    fetchPublicJson<PageResponse<PostSummaryResponse>>(`/api/posts?page=0&size=${MAX_POSTS}`, 3600),
    fetchPublicJson<ExamTypeResponse[]>('/api/exam-types', 3600),
  ]);

  const staticEntries: MetadataRoute.Sitemap = STATIC_PATHS.map((p) => ({
    url: `${SITE_URL}${p}`,
    changeFrequency: p === routes.posts ? 'daily' : 'monthly',
    priority: p === '' ? 1 : 0.7,
  }));

  const postEntries: MetadataRoute.Sitemap = (posts?.content || []).map((post) => ({
    url: `${SITE_URL}/posts/${post.id}`,
    lastModified: post.createdAt ? new Date(post.createdAt) : undefined,
    changeFrequency: 'weekly',
    priority: 0.6,
  }));

  const examTypeEntries: MetadataRoute.Sitemap = (examTypes || []).map((examType) => ({
    url: `${SITE_URL}${buildExamTypeDetailPath(examType)}`,
    changeFrequency: 'weekly',
    priority: 0.8,
  }));

  return withLocales(
    [...staticEntries, ...examTypeEntries, ...postEntries],
    (url) => url.slice(SITE_URL.length),
  );
}
