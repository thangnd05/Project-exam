import { useMutation, useQuery } from '@tanstack/react-query';
import { getExamTypes } from '~/api/examTypeApi';
import { getMyUserTests } from '~/api/userTestApi';
import { getUserTarget } from '~/api/userTargetApi';
import { generatePlan } from '~/api/learningPlanApi';
import { filterCompletedTests } from '~/utils/userTests';

export const generatePlanKeys = {
  examTypes: ['generate-plan', 'exam-types'],
  userTests: ['generate-plan', 'completed-user-tests'],
  target: (examTypeId) => ['generate-plan', 'user-target', examTypeId],
};

const asArray = (data) => (Array.isArray(data) ? data : []);

export function useExamTypes() {
  return useQuery({
    queryKey: generatePlanKeys.examTypes,
    queryFn: getExamTypes,
    select: asArray,
  });
}

export function useCompletedUserTests() {
  return useQuery({
    queryKey: generatePlanKeys.userTests,
    queryFn: getMyUserTests,
    select: filterCompletedTests,
  });
}

export function useUserTarget(examTypeId) {
  return useQuery({
    queryKey: generatePlanKeys.target(examTypeId),
    // Giữ hành vi cũ: lỗi khi tải target được coi như "chưa có target".
    queryFn: () => getUserTarget(examTypeId).catch(() => ({ hasTarget: false })),
    enabled: !!examTypeId,
  });
}

export function useGeneratePlanMutation() {
  return useMutation({ mutationFn: generatePlan });
}
