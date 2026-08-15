import PostDetail from './PostDetail';

async function fetchPost(postId: string) {
  const base = process.env.NEXT_PUBLIC_API_BASE_URL;
  if (!base) return null;
  try {
    const res = await fetch(`${base}/api/posts/${encodeURIComponent(postId)}`, {
      next: { revalidate: 300 },
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

function toPlainText(html: string, max = 160) {
  const text = (html || '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  return text.length > max ? `${text.slice(0, max - 1)}…` : text;
}

export async function generateMetadata({ params }: PageProps<'/posts/[postId]'>) {
  const { postId } = await params;
  const post = await fetchPost(postId);
  if (!post) return {};

  const title = post.title || 'Bài viết';
  // API bài viết không có trường mô tả riêng -> rút gọn từ nội dung HTML.
  const description = toPlainText(post.content) || undefined;
  const cover = post.thumbnailUrl || post.thumbnail || undefined;
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
    twitter: { card: 'summary_large_image', title, description, images: cover ? [cover] : undefined },
  };
}

export default function Page() {
  return <PostDetail />;
}
