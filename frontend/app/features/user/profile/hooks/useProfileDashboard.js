'use client';

import { useQuery } from '@tanstack/react-query';
import { keepPreviousData } from '@/app/configs/queryClient';
import { getProfileOverview, getMyActivity } from '@/app/apis/userApi';
import { getExamTypes } from '@/app/apis/examTypeApi';
import { getExamParts } from '@/app/apis/examPartApi';
import { getUserTarget } from '@/app/apis/userTargetApi';
import { sortPartsByLookup } from '@/app/utils/partOrder';

export const profileDashboardKeys = {
  overview: () => ['profile-overview'],
  targets: () => ['profile-targets'],
  activity: (month, year) => ['profile-activity', month || '', year || ''],
};

const fetchMyTargets = async () => {
  const [examTypes, examParts] = await Promise.all([
    getExamTypes().catch(() => []),
    getExamParts().catch(() => []),
  ]);
  if (!Array.isArray(examTypes) || examTypes.length === 0) {
    return [];
  }
  const partNameById = new Map();
  (examParts || []).forEach((p) => partNameById.set(p.examPartId, p.name));
  const results = await Promise.all(
    examTypes.map((et) =>
      getUserTarget(et.examTypeId)
        .then((data) =>
          data?.hasTarget
            ? {
                ...data,
                examTypeName: et.name,
                partRequirements: sortPartsByLookup(
                  data.partRequirements || [],
                  examParts,
                ).map((p) => ({
                  ...p,
                  examPartName: partNameById.get(p.examPartId) || p.examPartId,
                })),
              }
            : null
        )
        .catch(() => null)
    )
  );
  return results.filter(Boolean);
};

export function useProfileOverview() {
  const query = useQuery({
    queryKey: profileDashboardKeys.overview(),
    queryFn: getProfileOverview,
  });
  return {
    profileOverview: query.data ?? null,
    isLoading: query.isLoading,
    isError: query.isError,
    refetch: query.refetch,
  };
}

export function useMyTargets() {
  const query = useQuery({
    queryKey: profileDashboardKeys.targets(),
    queryFn: fetchMyTargets,
  });
  return {
    myTargets: query.data ?? [],
    loadingTargets: query.isLoading,
  };
}

export function useMyActivity(selectedMonth, selectedYear) {
  const query = useQuery({
    queryKey: profileDashboardKeys.activity(selectedMonth, selectedYear),
    queryFn: () =>
      getMyActivity({
        month: selectedMonth || undefined,
        year: selectedYear || undefined,
      }),
    placeholderData: keepPreviousData,
  });
  return {
    activity: query.data ?? null,

    loadingActivity: query.isFetching,
  };
}
