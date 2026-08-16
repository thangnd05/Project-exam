import { notFound } from 'next/navigation';
import type { PostResponse } from '@/app/types';
import { fetchPublicResource } from '@/app/utils/serverApi';
import { toMetaDescription } from '@/app/utils/seo';
import PostDetail from './PostDetail';

export async function generateMetadata({ params }: PageProps<'/posts/[postId]'>) {
  const { postId } = await params;
  const res = await fetchPublicResource<PostResponse>(`/api/posts/${encodeURIComponent(postId)}`);
  if (!res.ok) return {};
  const post = res.data;

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

export default async function Page({ params }: PageProps<'/posts/[postId]'>) {
  const { postId } = await params;
  // Bài viết bị xoá thì hiện thẳng trang "Không tìm thấy" thay vì để client render lỗi.
  // fetch trùng URL/options với generateMetadata nên Next gộp lại thành một request.
  //
  // Lưu ý: response vẫn là HTTP 200 chứ không phải 404 — DefaultLayout là client component
  // bọc children nên Next đã flush shell trước khi notFound() kịp ném. Phần chống index nằm ở
  // `robots: noindex` trong app/not-found.tsx. Muốn 404 thật thì phải bỏ children ra khỏi
  // client boundary của DefaultLayout.
  const res = await fetchPublicResource<PostResponse>(`/api/posts/${encodeURIComponent(postId)}`);
  // Chỉ báo không tìm thấy khi backend khẳng định vậy; backend chết thì vẫn render bình thường.
  if (!res.ok && res.missing) notFound();

  return <PostDetail />;
}
