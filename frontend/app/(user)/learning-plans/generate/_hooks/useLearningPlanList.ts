'use client';

import { useCallback, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getStandardExamTypes } from '@/app/apis/examTypeApi';
import { listPlans } from '@/app/apis/learningPlanApi';
import type { ExamTypeResponse, PlanResponse } from '@/app/types';

/** Plan kèm tên loại kỳ thi đã map sẵn ở FE để hiển thị badge. */
export type PlanListItem = PlanResponse & { examTypeName?: string };

export const learningPlanListKeys = {
  list: (loadAll: boolean, examTypeId?: string, refreshKey?: number) => [
    'learning-plan-list',
    { loadAll, examTypeId: examTypeId || null, refreshKey },
  ],
};

async function fetchPlanList({ loadAll, filterExamTypeId }: {
  loadAll: boolean;
  filterExamTypeId?: string;
}): Promise<{ examTypes: ExamTypeResponse[]; plans: PlanListItem[] }> {
  const types = await getStandardExamTypes();
  const nameById = Object.fromEntries(
    types.map((et) => [et.examTypeId, et.name]),
  );

  let merged: PlanListItem[] = [];

  if (loadAll) {

    const all = await listPlans().catch(() => []);
    merged = (all || []).map((p) => ({
      ...p,
      examTypeName: nameById[p.examTypeId as string] || p.examTypeId,
    }));
  } else {
    const id = filterExamTypeId || types[0]?.examTypeId;
    if (!id) {
      return { examTypes: types, plans: [] };
    }
    const data = await listPlans(id);
    const examTypeName = nameById[id] || id;
    merged = (data || []).map((p) => ({ ...p, examTypeName }));
  }

  merged.sort((a, b) => {
    const ta = a.createdAt ? new Date(a.createdAt).getTime() : 0;
    const tb = b.createdAt ? new Date(b.createdAt).getTime() : 0;
    return tb - ta;
  });

  return { examTypes: types, plans: merged };
}

type UseLearningPlanListOptions = {
  loadAll?: boolean;
  examTypeId?: string;
  initialExamTypeId?: string;
  refreshKey?: number;
};

export function useLearningPlanList({
  loadAll = false,
  examTypeId: controlledExamTypeId,
  initialExamTypeId = '',
  refreshKey = 0,
}: UseLearningPlanListOptions = {}) {
  const [internalExamTypeId, setInternalExamTypeId] = useState(initialExamTypeId);

  const filterExamTypeId = controlledExamTypeId !== undefined
    ? controlledExamTypeId
    : internalExamTypeId;

  const setFilterExamTypeId = useCallback((value: string) => {
    if (controlledExamTypeId === undefined) {
      setInternalExamTypeId(value);
    }
  }, [controlledExamTypeId]);

  const query = useQuery({
    queryKey: learningPlanListKeys.list(loadAll, filterExamTypeId, refreshKey),
    queryFn: () => fetchPlanList({ loadAll, filterExamTypeId }),
  });

  const examTypes = query.data?.examTypes ?? [];
  const plans = query.data?.plans ?? [];

  const filteredPlans = useMemo(() => {
    if (loadAll && !filterExamTypeId) return plans;
    if (!filterExamTypeId) return plans;
    return plans.filter((p) => p.examTypeId === filterExamTypeId);
  }, [plans, filterExamTypeId, loadAll]);

  return {
    examTypes,
    plans: filteredPlans,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error
      ? // err any có chủ đích: lỗi Axios, đọc response.data.message (BE không có type lỗi)
        (query.error as any)?.response?.data?.message
        || query.error.message
        || 'Không tải được danh sách plan'
      : null,
    filterExamTypeId,
    setFilterExamTypeId,
    refetch: query.refetch,
  };
}
