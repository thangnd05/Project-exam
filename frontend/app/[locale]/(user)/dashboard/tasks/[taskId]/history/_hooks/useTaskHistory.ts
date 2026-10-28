'use client';

import { useQuery } from '@tanstack/react-query';
import { getPlanByTask, getTaskSessions } from '@/app/apis/learningPlanApi';
import type { TaskSessionHistoryResponse } from '@/app/types';
import { EMPTY_LIST } from '@/app/utils/stableEmpty';
import { getApiErrorMessage } from '@/app/utils/apiError';

export const taskHistoryKeys = {
  plan: (taskId?: string) => ['task-plan', taskId],
  sessions: (planId?: string, taskId?: string) => ['task-sessions', planId, taskId],
};

const errMessage = (err: unknown): string | null =>
  getApiErrorMessage(err, '') || (err instanceof Error ? err.message : '') || null;

// API có thể trả mảng trực tiếp hoặc bọc trong { content } (phân trang).
const normalizeSessions = (data: unknown): TaskSessionHistoryResponse[] => {
  if (Array.isArray(data)) return data;
  const content = (data as { content?: unknown } | null | undefined)?.content;
  return Array.isArray(content) ? content : [];
};

// URL chỉ có taskId: lấy lộ trình chứa nhiệm vụ trước, rồi mới tải các lượt làm theo lộ trình đó.
export function useTaskHistory(taskId: string) {
  const planQuery = useQuery({
    queryKey: taskHistoryKeys.plan(taskId),
    queryFn: () => getPlanByTask(taskId),
    enabled: !!taskId,
  });
  const learningPlanId = planQuery.data?.learningPlanId ?? '';

  const sessionsQuery = useQuery({
    queryKey: taskHistoryKeys.sessions(learningPlanId, taskId),
    queryFn: () => getTaskSessions(learningPlanId, taskId),
    enabled: !!learningPlanId && !!taskId,
    select: normalizeSessions,
  });

  return {
    plan: planQuery.data ?? null,
    sessions: sessionsQuery.data ?? EMPTY_LIST,
    isLoading: planQuery.isLoading || sessionsQuery.isLoading,
    error: planQuery.isError ? errMessage(planQuery.error) : null,
    sessionsError: sessionsQuery.isError ? errMessage(sessionsQuery.error) : null,
  };
}
