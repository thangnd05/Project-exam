import { useQuery } from '@tanstack/react-query';
import { getSessionReview } from '~/shared/api/learningPlanApi';
import { getApiErrorMessage } from '~/shared/utils/apiError';

export const planSessionReviewKeys = {
  review: (learningPlanId, sessionId) => ['plan-session-review', learningPlanId, sessionId],
};

export function usePlanSessionReview(learningPlanId, sessionId) {
  const query = useQuery({
    queryKey: planSessionReviewKeys.review(learningPlanId, sessionId),
    queryFn: () => getSessionReview(learningPlanId, sessionId),
    enabled: !!learningPlanId && !!sessionId,
  });

  return {
    review: query.data ?? null,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.isError ? getApiErrorMessage(query.error) : null,
  };
}
