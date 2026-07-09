import { useQuery } from '@tanstack/react-query';
import { getPlanById, getTaskSessions } from '~/shared/api/learningPlanApi';

export const taskHistoryKeys = {
  plan: (planId) => ['learning-plan', planId],
  sessions: (planId, taskId) => ['task-sessions', planId, taskId],
};

const errMessage = (err) => err?.response?.data?.message || err?.message || null;

const normalizeSessions = (data) =>
  Array.isArray(data) ? data : Array.isArray(data?.content) ? data.content : [];

export function useTaskHistory(learningPlanId, taskId) {
  const planQuery = useQuery({
    queryKey: taskHistoryKeys.plan(learningPlanId),
    queryFn: () => getPlanById(learningPlanId),
    enabled: !!learningPlanId,
  });

  const sessionsQuery = useQuery({
    queryKey: taskHistoryKeys.sessions(learningPlanId, taskId),
    queryFn: () => getTaskSessions(learningPlanId, taskId),
    enabled: !!learningPlanId && !!taskId,
    select: normalizeSessions,
  });

  return {
    plan: planQuery.data ?? null,
    sessions: sessionsQuery.data ?? [],
    isLoading: planQuery.isLoading || sessionsQuery.isLoading,
    error: planQuery.isError ? errMessage(planQuery.error) : null,
    sessionsError: sessionsQuery.isError ? errMessage(sessionsQuery.error) : null,
  };
}
