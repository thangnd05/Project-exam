import { useQuery } from '@tanstack/react-query';
import { getMyUserTests } from '~/api/userTestApi';
import { getExamTypes } from '~/api/examTypeApi';
import { getUserTarget } from '~/api/userTargetApi';
import { filterCompletedTests } from '~/utils/userTests';

export const mockHistoryKeys = {
  examTypes: ['exam-types'],
  myUserTests: ['my-user-tests'],
  userTarget: (examTypeId) => ['user-target', examTypeId],
};

const selectCompletedTests = (arr) => filterCompletedTests(arr);
const selectTargetScore = (data) => (data?.hasTarget ? data.targetScore : null);

export function useMockHistory(examTypeFilter) {
  const examTypesQuery = useQuery({
    queryKey: mockHistoryKeys.examTypes,
    queryFn: getExamTypes,
  });

  const userTestsQuery = useQuery({
    queryKey: mockHistoryKeys.myUserTests,
    queryFn: getMyUserTests,
    select: selectCompletedTests,
  });

  const targetQuery = useQuery({
    queryKey: mockHistoryKeys.userTarget(examTypeFilter),
    queryFn: () => getUserTarget(examTypeFilter),
    enabled: !!examTypeFilter,
    select: selectTargetScore,
  });

  const err = userTestsQuery.error;

  return {
    examTypes: examTypesQuery.data ?? [],
    allTests: userTestsQuery.data ?? [],
    isLoading: userTestsQuery.isLoading,
    error: err ? err?.response?.data?.message || err.message : null,
    targetScore: examTypeFilter ? targetQuery.data ?? null : null,
  };
}
