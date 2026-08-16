'use client';

import { useQuery } from '@tanstack/react-query';
import { keepPreviousData } from '@/app/configs/queryClient';
import { getProfileOverview, getMyActivity } from '@/app/apis/userApi';
import { getExamTypes } from '@/app/apis/examTypeApi';
import { getExamParts } from '@/app/apis/examPartApi';
import { getUserTarget } from '@/app/apis/userTargetApi';
import { sortPartsByLookup } from '@/app/utils/partOrder';
import type {
  ExamPartResponse,
  ExamTypeResponse,
  UserTargetPartResponse,
  UserTargetResponse,
} from '@/app/types';

export interface ProfileTargetPart extends UserTargetPartResponse {
  examPartName?: string;
}

export interface ProfileTarget extends Omit<UserTargetResponse, 'partRequirements'> {
  examTypeName?: string;
  partRequirements: ProfileTargetPart[];
}

export const profileDashboardKeys = {
  overview: () => ['profile-overview'],
  targets: () => ['profile-targets'],
  activity: (month?: string, year?: string) => ['profile-activity', month || '', year || ''],
};

const fetchMyTargets = async (): Promise<ProfileTarget[]> => {
  const [examTypes, examParts] = await Promise.all([
    getExamTypes().catch(() => [] as ExamTypeResponse[]),
    getExamParts().catch(() => [] as ExamPartResponse[]),
  ]);
  if (!Array.isArray(examTypes) || examTypes.length === 0) {
    return [];
  }
  const partNameById = new Map<string, string | undefined>();
  (examParts || []).forEach((p) => partNameById.set(p.examPartId, p.name));
  const results = await Promise.all(
    examTypes.map((et) =>
      getUserTarget(et.examTypeId)
        .then((data): ProfileTarget | null =>
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
  return results.filter((target): target is ProfileTarget => Boolean(target));
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

export function useMyActivity(selectedMonth?: string, selectedYear?: string) {
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
