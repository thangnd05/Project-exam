import { useCallback, useEffect, useMemo, useState } from 'react';
import { getExamTypes } from '~/shared/api/examTypeApi';
import { listPlans } from '~/shared/api/learningPlanApi';

export function useLearningPlanList({
  loadAll = false,
  examTypeId: controlledExamTypeId,
  initialExamTypeId = '',
  refreshKey = 0,
} = {}) {
  const [examTypes, setExamTypes] = useState([]);
  const [internalExamTypeId, setInternalExamTypeId] = useState(initialExamTypeId);
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const filterExamTypeId = controlledExamTypeId !== undefined
    ? controlledExamTypeId
    : internalExamTypeId;

  const setFilterExamTypeId = useCallback((value) => {
    if (controlledExamTypeId === undefined) {
      setInternalExamTypeId(value);
    }
  }, [controlledExamTypeId]);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const types = await getExamTypes();
      setExamTypes(types);
      const nameById = Object.fromEntries(
        types.map((et) => [et.examTypeId, et.name]),
      );

      let merged = [];

      if (loadAll) {
        const lists = await Promise.all(
          types.map((et) => listPlans(et.examTypeId).catch(() => [])),
        );
        const seen = new Set();
        merged = lists
          .flat()
          .map((p) => ({
            ...p,
            examTypeName: nameById[p.examTypeId] || p.examTypeId,
          }))
          .filter((p) => {
            if (seen.has(p.learningPlanId)) return false;
            seen.add(p.learningPlanId);
            return true;
          });
      } else {
        const id = filterExamTypeId || types[0]?.examTypeId;
        if (!id) {
          setPlans([]);
          return;
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
      setPlans(merged);
    } catch (err) {
      setError(err?.response?.data?.message || err.message || 'Không tải được danh sách plan');
    } finally {
      setLoading(false);
    }
  }, [loadAll, filterExamTypeId]);

  useEffect(() => {
    reload();
  }, [reload, refreshKey]);

  const filteredPlans = useMemo(() => {
    if (loadAll && !filterExamTypeId) return plans;
    if (!filterExamTypeId) return plans;
    return plans.filter((p) => p.examTypeId === filterExamTypeId);
  }, [plans, filterExamTypeId, loadAll]);

  return {
    examTypes,
    plans: filteredPlans,
    allPlansCount: plans.length,
    loading,
    error,
    filterExamTypeId,
    setFilterExamTypeId,
    reload,
  };
}
