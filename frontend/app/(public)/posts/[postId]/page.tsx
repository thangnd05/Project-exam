import PostDetail from './PostDetail';

// Đây là chỗ Next thật sự hơn SPA: metadata được sinh Ở SERVER trước khi trả HTML, nên
// Zalo/Facebook/Messenger — vốn KHÔNG chạy JavaScript khi bóc link — mới đọc được đúng tiêu đề
// và ảnh của từng bài. Bản Vite cũ không có cách nào làm được việc này.
//
// Fetch thẳng bằng fetch() chứ không qua axiosClient vì axiosClient gắn interceptor/token của
// trình duyệt; ở server không có phiên đăng nhập và bài viết vốn công khai.

type Params = { params: { postId: string } };

async function fetchPost(postId: string) {
  const base = process.env.NEXT_PUBLIC_API_BASE_URL;
  if (!base) return null;
  try {
    const res = await fetch(`${base}/api/posts/${encodeURIComponent(postId)}`, {
      // Bài viết đổi không thường xuyên: cache 5 phút để không đấm vào backend mỗi lượt bóc link.
      next: { revalidate: 300 },
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    // Backend chết thì trang vẫn phải mở được, chỉ là mất metadata riêng.
    return null;
  }
}

function toPlainText(html: string, max = 160) {
  const text = (html || '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  return text.length > max ? `${text.slice(0, max - 1)}…` : text;
}

export async function generateMetadata({ params }: Params) {
  const post = await fetchPost(params.postId);
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
