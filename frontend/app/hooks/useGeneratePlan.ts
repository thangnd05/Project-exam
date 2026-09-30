'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getStandardExamTypes } from '@/app/apis/examTypeApi';
import { getMyCompletedUserTests } from '@/app/apis/userTestApi';
import { getUserTarget } from '@/app/apis/userTargetApi';
import { generatePlan, generateSyllabusPlan, listPlans } from '@/app/apis/learningPlanApi';
import { invalidatePlanQueries } from '@/app/hooks/plan-cache';
import { LearningPlanStatus } from '@/app/enums';
import { getApiErrorMessage } from '@/app/utils/apiError';
import { EMPTY_LIST } from '@/app/utils/stableEmpty';

export const generatePlanKeys = {
  examTypes: ['generate-plan', 'exam-types'],
  userTests: ['generate-plan', 'completed-user-tests'],
  target: (examTypeId?: string) => ['generate-plan', 'user-target', examTypeId],
};

const asArray = <T>(data: T[]): T[] => (Array.isArray(data) ? data : []);

export function useExamTypes() {
  const query = useQuery({
    queryKey: generatePlanKeys.examTypes,
    queryFn: getStandardExamTypes,
    select: asArray,
  });

  return {
    examTypes: query.data ?? EMPTY_LIST,
    isLoading: query.isLoading,
    isError: query.isError,
  };
}

export function useCompletedUserTests(enabled = true) {
  const query = useQuery({
    queryKey: generatePlanKeys.userTests,
    queryFn: () => getMyCompletedUserTests(),
    enabled,
  });

  return {
    userTests: query.data ?? EMPTY_LIST,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    isError: query.isError,
    error: query.isError ? getApiErrorMessage(query.error) : null,
  };
}

export function useUserTarget(examTypeId?: string, enabled = true) {
  const query = useQuery({
    queryKey: generatePlanKeys.target(examTypeId),
    queryFn: () => getUserTarget(examTypeId),
    enabled: enabled && !!examTypeId,
  });

  return {
    userTarget: query.data ?? null,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.isError
      ? getApiErrorMessage(query.error, 'Không tải được mục tiêu')
      : null,
    refetch: query.refetch,
  };
}

// Lộ trình đang học của kỳ thi, để hỏi lại trước khi sinh lộ trình mới thay thế nó.
export function useActivePlan(examTypeId?: string, enabled = true) {
  const query = useQuery({
    queryKey: ['learning-plans', examTypeId],
    queryFn: () => listPlans(examTypeId),
    enabled: enabled && !!examTypeId,
  });
  const plans = Array.isArray(query.data) ? query.data : EMPTY_LIST;
  return {
    activePlan: plans.find((p) => p.status === LearningPlanStatus.ACTIVE) ?? null,
  };
}

// Sinh xong phải làm mới cả lộ trình cũ (vừa thành "Đã thay") lẫn dashboard mục tiêu.
export function useGeneratePlanMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: generatePlan,
    onSuccess: () => invalidatePlanQueries(qc),
  });
}

export function useGenerateSyllabusPlanMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: generateSyllabusPlan,
    onSuccess: () => invalidatePlanQueries(qc),
  });
}
