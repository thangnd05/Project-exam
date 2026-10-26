import routes from '@/app/configs/Routes';
import { withExam } from '@/app/features/exam-types/hooks/useExamParam';
import type { ExamTypeResponse } from '@/app/types/exam-type';

// So sánh lộ trình là một mục trong trang Tổng quan (/my-target/dashboard), neo bằng id này.
export const PLAN_COMPARE_ANCHOR = 'plan-compare';

// Cần ít nhất 2 lộ trình mới có gì để so sánh.
export const MIN_PLANS_TO_COMPARE = 2;

export const planCompareHref = (
  examTypeId: string | null | undefined,
  examTypes: readonly ExamTypeResponse[] = [],
) => `${withExam(routes.targetDashboard, examTypeId, examTypes)}#${PLAN_COMPARE_ANCHOR}`;
