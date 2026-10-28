import routes from '@/app/configs/Routes';
import { withExam } from '@/app/features/exam-types/hooks/useExamParam';
import type { ExamTypeResponse } from '@/app/types/exam-type';

// Cần ít nhất 2 lộ trình mới có gì để so sánh.
export const MIN_PLANS_TO_COMPARE = 2;

// Trang so sánh lộ trình của một kỳ thi: /dashboard/learning-paths/compare?exam=saa-c03.
export const planCompareHref = (
  examTypeId: string | null | undefined,
  examTypes: readonly ExamTypeResponse[] = [],
) => withExam(routes.planCompare, examTypeId, examTypes);
