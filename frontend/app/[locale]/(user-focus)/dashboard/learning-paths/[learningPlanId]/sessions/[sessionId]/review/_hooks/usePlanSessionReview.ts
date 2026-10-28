'use client';

import { useQuery } from '@tanstack/react-query';
import { getSessionReview } from '@/app/apis/learningPlanApi';
import { getApiErrorMessage } from '@/app/utils/apiError';

export const planSessionReviewKeys = {
  review: (learningPlanId?: string, sessionId?: string) => ['plan-session-review', learningPlanId, sessionId],
};

export function usePlanSessionReview(learningPlanId: string, sessionId: string) {
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
