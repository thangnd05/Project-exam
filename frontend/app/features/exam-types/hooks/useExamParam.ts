'use client';

import { useEffect } from 'react';
import { useSearchParamsState } from '@/app/hooks/useSearchParamsState';

// Kỳ thi đang chọn ở các trang mục tiêu / lộ trình nằm trên URL dạng ?exam=saa-c03.
// Link cũ (bookmark, link từ chỗ chỉ có id) vẫn là ?examTypeId=<uuid>: đọc được và tự đổi sang slug.
export const EXAM_PARAM = 'exam';
const LEGACY_PARAM = 'examTypeId';

type ExamTypeLike = { examTypeId: string; slug?: string | null };

export function findExamSlug(examTypeId: string | null | undefined, examTypes: readonly ExamTypeLike[]) {
  if (!examTypeId) return undefined;
  return examTypes.find((et) => et.examTypeId === examTypeId)?.slug || undefined;
}

/** examTypeId của kỳ thi trên URL; slug chỉ dịch được khi danh sách kỳ thi đã tải xong. */
export function examTypeIdFromParams(params: URLSearchParams, examTypes: readonly ExamTypeLike[]) {
  const slug = params.get(EXAM_PARAM);
  if (slug) return examTypes.find((et) => et.slug === slug)?.examTypeId ?? '';
  return params.get(LEGACY_PARAM) ?? '';
}

/** Ghi kỳ thi vào query, giữ nguyên các tham số khác (vd next, userTestId). */
export function setExamParam(
  params: URLSearchParams,
  examTypeId: string | null | undefined,
  examTypes: readonly ExamTypeLike[],
) {
  const next = new URLSearchParams(params);
  next.delete(EXAM_PARAM);
  next.delete(LEGACY_PARAM);
  const slug = findExamSlug(examTypeId, examTypes);
  if (slug) next.set(EXAM_PARAM, slug);
  else if (examTypeId) next.set(LEGACY_PARAM, examTypeId);
  return next;
}

/** Đường dẫn kèm kỳ thi: /my-target?exam=saa-c03 (chưa có slug thì rơi về ?examTypeId=). */
export function withExam(
  path: string,
  examTypeId: string | null | undefined,
  examTypes: readonly ExamTypeLike[] = [],
) {
  const qs = setExamParam(new URLSearchParams(), examTypeId, examTypes).toString();
  return qs ? `${path}?${qs}` : path;
}

/** Đổi ?examTypeId=<uuid> của link cũ sang ?exam=<slug> ngay khi biết slug. */
export function useNormalizeExamParam(examTypes: readonly ExamTypeLike[]) {
  const [searchParams, setSearchParams] = useSearchParamsState();

  useEffect(() => {
    const legacyId = searchParams.get(LEGACY_PARAM);
    if (!legacyId || !findExamSlug(legacyId, examTypes)) return;
    setSearchParams((prev) => setExamParam(prev, legacyId, examTypes), { replace: true });
  }, [searchParams, examTypes, setSearchParams]);
}
