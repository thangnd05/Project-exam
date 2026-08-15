'use client';

import { useMutation, useQuery } from '@tanstack/react-query';
import { getStandardExamTypes } from '~/shared/api/examTypeApi';
import { getMyCompletedUserTests } from '~/shared/api/userTestApi';
import { getUserTarget } from '~/shared/api/userTargetApi';
import { generatePlan } from '~/shared/api/learningPlanApi';
import { getApiErrorMessage } from '~/shared/utils/apiError';

export const generatePlanKeys = {
  examTypes: ['generate-plan', 'exam-types'],
  userTests: ['generate-plan', 'completed-user-tests'],
  target: (examTypeId) => ['generate-plan', 'user-target', examTypeId],
};

const asArray = (data) => (Array.isArray(data) ? data : []);

export function useExamTypes() {
  const query = useQuery({
    queryKey: generatePlanKeys.examTypes,
    queryFn: getStandardExamTypes,
    select: asArray,
  });

  return {
    examTypes: query.data ?? [],
    isLoading: query.isLoading,
    isError: query.isError,
  };
}

export function useCompletedUserTests() {
  const query = useQuery({
    queryKey: generatePlanKeys.userTests,
    queryFn: () => getMyCompletedUserTests(),
  });

  return {
    userTests: query.data ?? [],
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.isError ? getApiErrorMessage(query.error) : null,
  };
}

export function useUserTarget(examTypeId) {
  const query = useQuery({
    queryKey: generatePlanKeys.target(examTypeId),
    queryFn: () => getUserTarget(examTypeId),
    enabled: !!examTypeId,
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

export function useGeneratePlanMutation() {
  return useMutation({ mutationFn: generatePlan });
}
