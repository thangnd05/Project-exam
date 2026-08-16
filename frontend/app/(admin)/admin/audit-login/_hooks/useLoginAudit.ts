'use client';

import {useQuery} from '@tanstack/react-query';

import {getLoginAuditLogs} from '@/app/apis/adminAuditApi';
import {keepPreviousData} from '@/app/configs/queryClient';
import type {AuditLogResponse, PageResponse} from '@/app/types';
import { EMPTY_LIST } from '@/app/utils/stableEmpty';

export interface LoginAuditRow {
  id: string;
  login_time: string;
  action: string;
  user_id: string | null;
  ip_address: string;
  status: 'SUCCESS' | 'FAILED';
  failure_reason: string;
  user_agent: string;
}

export const loginAuditKeys = {
  list: (page: number, size: number) => ['admin-login-audit', page, size],
};

const normalizeLoginAudit = (response: PageResponse<AuditLogResponse>) => {
  const rows = (response?.content || []).map(
    (item): LoginAuditRow => ({
      id: String(item.auditLogId),
      login_time: item.createdAt || '',
      action: item.action || '',
      user_id: item.userId ? String(item.userId) : null,
      ip_address: item.ipAddress || '',
      status: item.success ? 'SUCCESS' : 'FAILED',
      failure_reason: item.success ? '' : `HTTP ${item.statusCode || ''}`.trim(),
      user_agent: item.userAgent || '',
    }),
  );
  return {
    rows,
    totalElements: response?.totalElements || 0,
    totalPages: Math.max(response?.totalPages || 1, 1),
  };
};

export function useLoginAudit(page: number, size: number) {
  const query = useQuery({
    queryKey: loginAuditKeys.list(page, size),
    queryFn: () => getLoginAuditLogs({page: Math.max(page - 1, 0), size}),
    select: normalizeLoginAudit,
    placeholderData: keepPreviousData,
  });

  return {
    rows: query.data?.rows ?? EMPTY_LIST,
    totalElements: query.data?.totalElements ?? 0,
    totalPages: query.data?.totalPages ?? 1,
    isLoading: query.isLoading,
  };
}
