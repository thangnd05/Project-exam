import { notFound } from 'next/navigation';
import { fetchPublicResource } from '@/app/utils/serverApi';

export type TestRef = { testId: string; slug: string };

/**
 * Dùng trong page server của /tests/[testId]/...: đoạn URL là slug (hoặc id ở link cũ),
 * trả testId để component gọi API. Không có đề thì 404. Link id cũ đã được proxy chuyển sang slug.
 */
export async function requireTestRef(key: string): Promise<TestRef> {
  const res = await fetchPublicResource<TestRef>(`/api/tests/ref/${encodeURIComponent(key)}`, 300);
  if (!res.ok) {
    if (res.missing) notFound();
    throw new Error('Không tải được thông tin đề.');
  }
  return res.data;
}
