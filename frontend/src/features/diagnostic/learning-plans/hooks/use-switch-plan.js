import { useMutation } from '@tanstack/react-query';
import { switchPlan } from '~/shared/api/learningPlanApi';

// useLearningPlanList giờ dùng useQuery; caller gọi reload() (= refetch) trong onSuccess.
export function useSwitchPlan({ onSuccess, onError } = {}) {
  return useMutation({
    mutationFn: (learningPlanId) => switchPlan(learningPlanId),
    onSuccess,
    onError,
  });
}
