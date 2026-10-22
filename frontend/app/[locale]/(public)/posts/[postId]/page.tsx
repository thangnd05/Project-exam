import { notFound } from 'next/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import type { PostResponse } from '@/app/types';
import { fetchPublicResource } from '@/app/utils/serverApi';
import { toMetaDescription } from '@/app/utils/seo';
import { localeAlternates } from '@/app/i18n/metadata';
import type { Locale } from '@/app/i18n/routing';
import PostDetail from './PostDetail';

export async function generateMetadata({ params }: PageProps<'/[locale]/posts/[postId]'>) {
  const { locale: rawLocale, postId } = await params;
  const locale = rawLocale as Locale;
  const res = await fetchPublicResource<PostResponse>(`/api/posts/${encodeURIComponent(postId)}`);
  if (!res.ok) return {};
  const post = res.data;
  const t = await getTranslations({ locale, namespace: 'Posts' });

  const title = post.title || t('detail.fallbackTitle');
  const description = toMetaDescription(post.content);
  const cover = post.thumbnailUrl || undefined;
  const images = cover ? [{ url: cover }] : undefined;

  return {
    title,
    description,
    alternates: localeAlternates(locale, `/posts/${postId}`),
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

export default async function Page({ params }: PageProps<'/[locale]/posts/[postId]'>) {
  const { locale, postId } = await params;
  setRequestLocale(locale as Locale);
  const res = await fetchPublicResource<PostResponse>(`/api/posts/${encodeURIComponent(postId)}`);
  if (!res.ok && res.missing) notFound();

  return <PostDetail />;
}
