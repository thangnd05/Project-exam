'use client';

import { useQuery } from '@tanstack/react-query';
import { getMyCompletedUserTests } from '~/shared/api/userTestApi';
import { getStandardExamTypes } from '~/shared/api/examTypeApi';
import { getExamParts } from '~/shared/api/examPartApi';
import { getUserTarget } from '~/shared/api/userTargetApi';
import { listPlans } from '~/shared/api/learningPlanApi';
import { getEnhancedResult } from '~/shared/api/enhancedResultApi';
import { sortByPartOrder } from '~/shared/utils/partOrder';

export const targetDashboardKeys = {
  examTypes: ['exam-types', 'standard'],
  examParts: ['exam-parts'],
  dashboard: (examTypeId) => ['target-dashboard', examTypeId],
};

const EMPTY_DASHBOARD = {
  target: null,
  plans: [],
  latestMock: null,
  recentMocks: [],
  latestEnhanced: null,
};

async function fetchDashboard(examTypeId) {
  const target = await getUserTarget(examTypeId).catch(() => null);
  const plans = (await listPlans(examTypeId).catch(() => [])) || [];

  const completed = await getMyCompletedUserTests(examTypeId);
  const latestMock = completed[0] || null;
  const recentMocks = completed.slice(0, 5);

  let latestEnhanced = null;
  if (completed[0]?.userTestId) {
    try {
      const r = await getEnhancedResult(completed[0].userTestId);
      latestEnhanced = r.data;
    } catch {
      latestEnhanced = null;
    }
  }

  return { target, plans, latestMock, recentMocks, latestEnhanced };
}

export function useTargetDashboard(examTypeId) {
  const examTypesQuery = useQuery({
    queryKey: targetDashboardKeys.examTypes,
    queryFn: getStandardExamTypes,
  });

  const examPartsQuery = useQuery({
    queryKey: targetDashboardKeys.examParts,
    queryFn: getExamParts,
    select: sortByPartOrder,
  });

  const dashboardQuery = useQuery({
    queryKey: targetDashboardKeys.dashboard(examTypeId),
    queryFn: () => fetchDashboard(examTypeId),
    enabled: !!examTypeId,
  });

  const data = dashboardQuery.data ?? EMPTY_DASHBOARD;

  return {
    examTypes: examTypesQuery.data ?? [],
    examParts: examPartsQuery.data ?? [],
    target: data.target,
    plans: data.plans,
    latestMock: data.latestMock,
    recentMocks: data.recentMocks,
    latestEnhanced: data.latestEnhanced,
    isLoading: dashboardQuery.isLoading,
    error: dashboardQuery.error
      ? dashboardQuery.error?.response?.data?.message || dashboardQuery.error.message
      : null,
  };
}
