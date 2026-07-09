import { useQuery } from '@tanstack/react-query';
import { getMyUserTests } from '~/api/userTestApi';
import { getExamTypes } from '~/api/examTypeApi';
import { getUserTarget } from '~/api/userTargetApi';
import { getEnhancedResult } from '~/api/enhancedResultApi';
import { filterCompletedTests } from '~/shared/utils/userTests';

export const targetAchievedKeys = {
  examTypes: ['exam-types'],
  detail: (examTypeId) => ['target-achieved', examTypeId],
};

const normalizeExamTypes = (data) => (Array.isArray(data) ? data : data?.content ?? []);

async function fetchTargetAchieved(examTypeId) {
  const target = await getUserTarget(examTypeId).catch(() => null);

  const completed = filterCompletedTests(await getMyUserTests(), examTypeId);
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
    queryFn: getExamTypes,
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
