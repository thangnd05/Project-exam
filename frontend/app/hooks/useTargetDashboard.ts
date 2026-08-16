'use client';

import { useQuery } from '@tanstack/react-query';
import { getMyCompletedUserTests } from '@/app/apis/userTestApi';
import { getStandardExamTypes } from '@/app/apis/examTypeApi';
import { getExamParts } from '@/app/apis/examPartApi';
import { getUserTarget } from '@/app/apis/userTargetApi';
import { listPlans } from '@/app/apis/learningPlanApi';
import { getEnhancedResult } from '@/app/apis/enhancedResultApi';
import { sortByPartOrder } from '@/app/utils/partOrder';
import type {
  EnhancedResultResponse,
  PlanResponse,
  UserTargetResponse,
  UserTestResponse,
} from '@/app/types';

export const targetDashboardKeys = {
  examTypes: ['exam-types', 'standard'],
  examParts: ['exam-parts'],
  dashboard: (examTypeId?: string) => ['target-dashboard', examTypeId],
};

type DashboardData = {
  target: UserTargetResponse | null;
  plans: PlanResponse[];
  latestMock: UserTestResponse | null;
  recentMocks: UserTestResponse[];
  latestEnhanced: EnhancedResultResponse | null;
};

const EMPTY_DASHBOARD: DashboardData = {
  target: null,
  plans: [],
  latestMock: null,
  recentMocks: [],
  latestEnhanced: null,
};

async function fetchDashboard(examTypeId: string): Promise<DashboardData> {
  const target = await getUserTarget(examTypeId).catch(() => null);
  const plans = (await listPlans(examTypeId).catch(() => [])) || [];

  const completed = await getMyCompletedUserTests(examTypeId);
  const latestMock = completed[0] || null;
  const recentMocks = completed.slice(0, 5);

  let latestEnhanced: EnhancedResultResponse | null = null;
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

export function useTargetDashboard(examTypeId: string) {
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
      ? (dashboardQuery.error as any)?.response?.data?.message || dashboardQuery.error.message
      : null,
  };
}
