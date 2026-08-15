'use client';

import { useQuery } from '@tanstack/react-query';
import { getMyCompletedUserTests } from '~/shared/api/userTestApi';
import { getStandardExamTypes } from '~/shared/api/examTypeApi';
import { getUserTarget } from '~/shared/api/userTargetApi';
import { getEnhancedResult } from '~/shared/api/enhancedResultApi';

export const targetAchievedKeys = {
  examTypes: ['exam-types', 'standard'],
  detail: (examTypeId) => ['target-achieved', examTypeId],
};

const normalizeExamTypes = (data) => (Array.isArray(data) ? data : data?.content ?? []);

async function fetchTargetAchieved(examTypeId) {
  const target = await getUserTarget(examTypeId).catch(() => null);

  const completed = await getMyCompletedUserTests(examTypeId);
  const latestMock = completed[0] || null;

  let enhanced = null;
  if (latestMock?.userTestId) {
    try {
      const r = await getEnhancedResult(latestMock.userTestId);
      enhanced = r.data;
    } catch {
      enhanced = null;
    }
  }

  return { target, latestMock, enhanced };
}

export function useTargetAchieved(examTypeId) {
  const examTypesQuery = useQuery({
    queryKey: targetAchievedKeys.examTypes,
    queryFn: getStandardExamTypes,
    select: normalizeExamTypes,
  });

  const detailQuery = useQuery({
    queryKey: targetAchievedKeys.detail(examTypeId),
    queryFn: () => fetchTargetAchieved(examTypeId),
    enabled: !!examTypeId,
  });

  const err = detailQuery.error;

  return {
    examTypes: examTypesQuery.data ?? [],
    target: detailQuery.data?.target ?? null,
    latestMock: detailQuery.data?.latestMock ?? null,
    enhanced: detailQuery.data?.enhanced ?? null,
    isLoading: detailQuery.isLoading,
    error: err ? (err?.response?.data?.message || err.message) : null,
  };
}
