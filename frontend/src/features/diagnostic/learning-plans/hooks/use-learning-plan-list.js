import { useCallback, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getStandardExamTypes } from '~/shared/api/examTypeApi';
import { listPlans } from '~/shared/api/learningPlanApi';

export const learningPlanListKeys = {
  all: ['learning-plan-list'],
  list: (loadAll, examTypeId, refreshKey) => [
    'learning-plan-list',
    { loadAll, examTypeId: examTypeId || null, refreshKey },
  ],
};

async function fetchPlanList({ loadAll, filterExamTypeId }) {
  const types = await getStandardExamTypes();
  const nameById = Object.fromEntries(
    types.map((et) => [et.examTypeId, et.name]),
  );

  let merged = [];

  if (loadAll) {
    // BE trả lộ trình của mọi kỳ thi trong 1 lần gọi (trước đây gọi lặp theo từng examType).
    const all = await listPlans().catch(() => []);
    merged = (all || []).map((p) => ({
      ...p,
      examTypeName: nameById[p.examTypeId] || p.examTypeId,
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

export function useLearningPlanList({
  loadAll = false,
  examTypeId: controlledExamTypeId,
  initialExamTypeId = '',
  refreshKey = 0,
} = {}) {
  const [internalExamTypeId, setInternalExamTypeId] = useState(initialExamTypeId);

  const filterExamTypeId = controlledExamTypeId !== undefined
    ? controlledExamTypeId
    : internalExamTypeId;

  const setFilterExamTypeId = useCallback((value) => {
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
    allPlansCount: plans.length,
    loading: query.isLoading,
    error: query.error
      ? query.error?.response?.data?.message
        || query.error.message
        || 'Không tải được danh sách plan'
      : null,
    filterExamTypeId,
    setFilterExamTypeId,
    reload: query.refetch,
  };
}
