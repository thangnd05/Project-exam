'use client';

import { useQuery } from '@tanstack/react-query';
import { getPlanById, getTaskSessions } from '@/app/apis/learningPlanApi';
import { planDetailKeys } from '@/app/hooks/usePlanDetail';
import type { TaskSessionHistoryResponse } from '@/app/types';

export const taskHistoryKeys = {

  plan: planDetailKeys.detail,
  sessions: (planId?: string, taskId?: string) => ['task-sessions', planId, taskId],
};

// err any có chủ đích: lỗi Axios, đọc response.data.message (BE không có type lỗi)
const errMessage = (err: any): string | null => err?.response?.data?.message || err?.message || null;

// Giữ nhánh { content } phòng hờ dạng phân trang như bản JS cũ (data as any vì nhánh này
// không nằm trong kiểu trả về đã khai báo của API)
const normalizeSessions = (data: TaskSessionHistoryResponse[]): TaskSessionHistoryResponse[] =>
  Array.isArray(data) ? data : Array.isArray((data as any)?.content) ? (data as any).content : [];

export function useTaskHistory(learningPlanId: string, taskId: string) {
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
