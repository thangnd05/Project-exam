
import type { CurrentSessionResponse, SessionReviewItem } from '@/app/types';

export interface PlanResultData {
  reviewItems?: SessionReviewItem[];
  passed: boolean;
  accuracy: number;
}

export function toPlanResult(data: CurrentSessionResponse): PlanResultData {
  return {
    reviewItems: data.lastReviewItems,
    passed: !!data.passed,
    accuracy: data.accuracy ?? 0,
  };
}
