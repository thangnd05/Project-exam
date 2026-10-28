'use client';

import { useEffect } from 'react';
import { useSearchParamsState } from '@/app/hooks/useSearchParamsState';
import { buildGoalPath, examGoalCode } from '@/app/configs/Routes';

// Kỳ thi đang chọn ở các trang mục tiêu / lộ trình nằm trên URL dạng ?exam=aws-saa-c03 (slug nhóm + slug kỳ thi,
// cùng mã với /dashboard/goals/aws-saa-c03). Link cũ vẫn đọc được và tự đổi sang mã đầy đủ:
// ?exam=saa-c03 (chỉ slug kỳ thi) và ?examTypeId=<uuid> (link từ chỗ chỉ có id).
export const EXAM_PARAM = 'exam';
const LEGACY_PARAM = 'examTypeId';

type ExamTypeLike = { examTypeId: string; slug?: string | null; parentSlug?: string | null };

function findExamCode(examTypeId: string | null | undefined, examTypes: readonly ExamTypeLike[]) {
  if (!examTypeId) return undefined;
  const exam = examTypes.find((et) => et.examTypeId === examTypeId);
  return (exam && examGoalCode(exam)) || undefined;
}

function findByCode(code: string, examTypes: readonly ExamTypeLike[]) {
  return examTypes.find((et) => examGoalCode(et) === code) ?? examTypes.find((et) => et.slug === code);
}

/** examTypeId của kỳ thi trên URL; mã chỉ dịch được khi danh sách kỳ thi đã tải xong. */
export function examTypeIdFromParams(params: URLSearchParams, examTypes: readonly ExamTypeLike[]) {
  const code = params.get(EXAM_PARAM);
  if (code) return findByCode(code, examTypes)?.examTypeId ?? '';
  return params.get(LEGACY_PARAM) ?? '';
}

/** Ghi kỳ thi vào query, giữ nguyên các tham số khác (vd next, attempt). */
export function setExamParam(
  params: URLSearchParams,
  examTypeId: string | null | undefined,
  examTypes: readonly ExamTypeLike[],
) {
  const next = new URLSearchParams(params);
  next.delete(EXAM_PARAM);
  next.delete(LEGACY_PARAM);
  const code = findExamCode(examTypeId, examTypes);
  if (code) next.set(EXAM_PARAM, code);
  else if (examTypeId) next.set(LEGACY_PARAM, examTypeId);
  return next;
}

/** Trang mục tiêu của kỳ thi theo id: /dashboard/goals/aws-saa-c03 (kỳ thi chưa tải thì về danh sách mục tiêu). */
export function goalHref(examTypeId: string | null | undefined, examTypes: readonly ExamTypeLike[] = []) {
  return buildGoalPath(examTypes.find((et) => et.examTypeId === examTypeId));
}

/** Đường dẫn kèm kỳ thi: /goals/new?exam=aws-saa-c03 (chưa có slug thì rơi về ?examTypeId=). */
export function withExam(
  path: string,
  examTypeId: string | null | undefined,
  examTypes: readonly ExamTypeLike[] = [],
) {
  const qs = setExamParam(new URLSearchParams(), examTypeId, examTypes).toString();
  return qs ? `${path}?${qs}` : path;
}

/** Đổi ?examTypeId=<uuid> và ?exam=<slug kỳ thi> của link cũ sang ?exam=<mã đầy đủ> ngay khi biết mã. */
export function useNormalizeExamParam(examTypes: readonly ExamTypeLike[]) {
  const [searchParams, setSearchParams] = useSearchParamsState();

  useEffect(() => {
    const code = searchParams.get(EXAM_PARAM);
    const examTypeId = code
      ? findByCode(code, examTypes)?.examTypeId
      : searchParams.get(LEGACY_PARAM) ?? undefined;
    const canonical = findExamCode(examTypeId, examTypes);
    if (!canonical || canonical === code) return;
    setSearchParams((prev) => setExamParam(prev, examTypeId, examTypes), { replace: true });
  }, [searchParams, examTypes, setSearchParams]);
}
