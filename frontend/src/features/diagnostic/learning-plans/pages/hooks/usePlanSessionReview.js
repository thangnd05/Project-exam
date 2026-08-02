import { useQuery } from '@tanstack/react-query';
import { getSessionReview } from '~/shared/api/learningPlanApi';

export const planSessionReviewKeys = {
  review: (learningPlanId, sessionId) => ['plan-session-review', learningPlanId, sessionId],
};

export function usePlanSessionReview(learningPlanId, sessionId) {
  return useQuery({
    queryKey: planSessionReviewKeys.review(learningPlanId, sessionId),
    queryFn: () => getSessionReview(learningPlanId, sessionId),
    enabled: !!learningPlanId && !!sessionId,
  });
}
