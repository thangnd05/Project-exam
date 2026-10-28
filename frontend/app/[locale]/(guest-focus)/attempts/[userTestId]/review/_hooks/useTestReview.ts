'use client';

import { useQuery } from '@tanstack/react-query';
import type { AxiosRequestConfig } from 'axios';
import { getUserTestMeta, getReviewTest } from '@/app/apis/userTestApi';
import { getAnswersByUserTest } from '@/app/apis/userAnswerApi';
import { getUserTestInfo } from '@/app/apis/testApi';
import { UserTestMode } from '@/app/enums';
import type { TestAdminResponse, UserAnswerResponse } from '@/app/types';
import { EMPTY_LIST } from '@/app/utils/stableEmpty';

export const testReviewKeys = {
  detail: (userTestId?: string, isGuest?: boolean) => ['test-review', userTestId, isGuest],
};

type TestReviewData = {
  test: TestAdminResponse | null;
  userAnswers: UserAnswerResponse[];
  canReview: boolean;
  notReviewable: boolean;
};

async function fetchTestReview(
  userTestId: string,
  isGuest: boolean,
  guestCfg: AxiosRequestConfig,
): Promise<TestReviewData> {
  const metaData = await getUserTestMeta(userTestId, isGuest, guestCfg);
  const testId = metaData.testId as string;

  const testInfo = await getUserTestInfo(testId);
  const now = new Date();
  const availableTo = testInfo.availableTo ? new Date(testInfo.availableTo) : null;
  const reviewable = !availableTo || now > availableTo;

  if (!reviewable) {
    return { test: null, userAnswers: [], canReview: false, notReviewable: true };
  }

  const [testData, answersData] = await Promise.all([
    getReviewTest(userTestId, isGuest, guestCfg),
    getAnswersByUserTest(userTestId, isGuest, guestCfg),
  ]);

  let parts = testData.parts || [];
  if (metaData.mode === UserTestMode.PRACTICE && metaData.practicePartIds?.length) {
    const practiced = new Set(metaData.practicePartIds.map(String));
    parts = parts.filter((p) => practiced.has(String(p.examPartId)));
  }

  return {
    test: { ...testData, parts },
    userAnswers: Array.isArray(answersData) ? answersData : [],
    canReview: true,
    notReviewable: false,
  };
}

type UseTestReviewOptions = {
  enabled?: boolean;
  isGuest?: boolean;
  guestCfg?: AxiosRequestConfig;
};

export function useTestReview(
  userTestId: string | undefined,
  { enabled = true, isGuest = false, guestCfg = {} }: UseTestReviewOptions = {},
) {
  const query = useQuery({
    queryKey: testReviewKeys.detail(userTestId, isGuest),
    queryFn: () => fetchTestReview(userTestId as string, isGuest, guestCfg),
    enabled: enabled && !!userTestId,
  });

  return {
    test: query.data?.test ?? null,
    userAnswers: query.data?.userAnswers ?? EMPTY_LIST,
    canReview: query.data?.canReview ?? false,
    notReviewable: query.data?.notReviewable ?? false,
    isLoading: query.isLoading,
    isError: query.isError,
  };
}
