import type { PostResponse } from '@/app/types';
import { fetchPublicJson } from '@/app/utils/serverApi';
import { toMetaDescription } from '@/app/utils/seo';
import PostDetail from './PostDetail';

export async function generateMetadata({ params }: PageProps<'/posts/[postId]'>) {
  const { postId } = await params;
  const post = await fetchPublicJson<PostResponse>(`/api/posts/${encodeURIComponent(postId)}`);
  if (!post) return {};

  const title = post.title || 'Bài viết';
  const description = toMetaDescription(post.content);
  const cover = post.thumbnailUrl || undefined;
  const images = cover ? [{ url: cover }] : undefined;

  return {
    title,
    description,
    openGraph: {
      type: 'article',
      title,
      description,
      images,
      publishedTime: post.createdAt,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: cover ? [cover] : undefined,
    },
  };
}

export default function Page() {
  return <PostDetail />;
}
