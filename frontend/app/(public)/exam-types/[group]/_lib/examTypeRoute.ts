import { notFound, permanentRedirect } from 'next/navigation';
import { buildExamTypeCollectionPath, buildExamTypeDetailPath } from '@/app/configs/Routes';
import type { ExamTypeResponse } from '@/app/types';
import { fetchPublicResource } from '@/app/utils/serverApi';
import { toMetaDescription } from '@/app/utils/seo';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Tải kỳ thi theo đoạn đường dẫn: [uuid] (link cũ), [slug] hoặc [slug nhóm cha, slug]. */
export function loadExamType(segments: string[]) {
  const last = segments[segments.length - 1] ?? '';
  const path =
    segments.length === 1 && UUID_RE.test(last)
      ? `/api/exam-types/${encodeURIComponent(last)}`
      : `/api/exam-types/by-slug/${encodeURIComponent(last)}`;
  return fetchPublicResource<ExamTypeResponse>(path);
}

/**
 * Dùng trong page: không có kỳ thi thì 404; đang ở link cũ (/exam-types/<uuid>), sai hoa thường
 * hoặc lệch nhóm cha thì chuyển hướng 308 về đường dẫn slug chuẩn để Google chỉ giữ một URL.
 */
export async function requireExamType(segments: string[], collectionId?: string) {
  const res = await loadExamType(segments);
  if (!res.ok) {
    if (res.missing) notFound();
    throw new Error('Không tải được thông tin kỳ thi.');
  }
  const exam = res.data;
  if (exam.slug) {
    const canonical = collectionId
      ? buildExamTypeCollectionPath(exam, collectionId)
      : buildExamTypeDetailPath(exam);
    const current = `/exam-types/${segments.map(encodeURIComponent).join('/')}${
      collectionId ? `/collections/${encodeURIComponent(collectionId)}` : ''
    }`;
    if (canonical !== current) permanentRedirect(canonical);
  }
  return exam;
}

/** Metadata cho trang danh sách đề của kỳ thi, kèm canonical URL dạng slug. */
export async function examTypeMetadata(segments: string[]) {
  const res = await loadExamType(segments);
  if (!res.ok || !res.data.name) return {};
  const examType = res.data;

  const title = `Đề thi ${examType.name}`;
  const description =
    toMetaDescription(examType.description) ||
    `Danh sách đề thi thử ${examType.name}: làm bài online, chấm điểm tự động và xem đáp án chi tiết.`;
  const cover = examType.imageUrl || undefined;
  const images = cover ? [{ url: cover }] : undefined;

  return {
    title,
    description,
    alternates: { canonical: buildExamTypeDetailPath(examType) },
    openGraph: { type: 'website', title, description, images },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: cover ? [cover] : undefined,
    },
  };
}

/** Metadata cho trang một bộ đề trong kỳ thi. */
export async function examCollectionMetadata(segments: string[], collectionId: string) {
  const res = await loadExamType(segments);
  if (!res.ok || !res.data.name) return {};
  const examType = res.data;

  const title = `Bộ đề ${examType.name}`;
  const description = `Các đề thi thử ${examType.name} trong bộ đề: làm bài online, chấm điểm tự động và xem đáp án chi tiết.`;

  return {
    title,
    description,
    alternates: { canonical: buildExamTypeCollectionPath(examType, collectionId) },
    openGraph: { type: 'website', title, description },
    twitter: { card: 'summary_large_image', title, description },
  };
}
