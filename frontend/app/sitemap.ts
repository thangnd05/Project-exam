import type { MetadataRoute } from 'next';
import type {
  ExamTypeResponse,
  PageResponse,
  PostSummaryResponse,
  RecoveryResourceResponse,
} from '@/app/types';
import { fetchPublicJson } from '@/app/utils/serverApi';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

export const revalidate = 3600;

const STATIC_PATHS = ['', '/about', '/posts', '/policy', '/service', '/certificates/verify'];

const MAX_POSTS = 500;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [posts, examTypes, resources] = await Promise.all([
    fetchPublicJson<PageResponse<PostSummaryResponse>>(`/api/posts?page=0&size=${MAX_POSTS}`, 3600),
    fetchPublicJson<ExamTypeResponse[]>('/api/exam-types', 3600),
    fetchPublicJson<RecoveryResourceResponse[]>('/api/recovery-resources', 3600),
  ]);

  const staticEntries: MetadataRoute.Sitemap = STATIC_PATHS.map((p) => ({
    url: `${SITE_URL}${p}`,
    changeFrequency: p === '/posts' ? 'daily' : 'monthly',
    priority: p === '' ? 1 : 0.7,
  }));

  const postEntries: MetadataRoute.Sitemap = (posts?.content || []).map((post) => ({
    url: `${SITE_URL}/posts/${post.id}`,
    lastModified: post.createdAt ? new Date(post.createdAt) : undefined,
    changeFrequency: 'weekly',
    priority: 0.6,
  }));

  const examTypeEntries: MetadataRoute.Sitemap = (examTypes || []).map((examType) => ({
    url: `${SITE_URL}/exam-types/${examType.examTypeId}`,
    changeFrequency: 'weekly',
    priority: 0.8,
  }));

  const resourceEntries: MetadataRoute.Sitemap = (resources || []).map((resource) => ({
    url: `${SITE_URL}/resources/${resource.resourceId}`,
    lastModified: resource.createdAt ? new Date(resource.createdAt) : undefined,
    changeFrequency: 'monthly',
    priority: 0.5,
  }));

  return [...staticEntries, ...examTypeEntries, ...postEntries, ...resourceEntries];
}
