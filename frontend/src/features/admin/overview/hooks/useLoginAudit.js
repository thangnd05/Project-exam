'use client';

import {useQuery} from '@tanstack/react-query';

import {getLoginAuditLogs} from '~/shared/api/adminAuditApi';
import {keepPreviousData} from '~/shared/config/queryClient';

export const loginAuditKeys = {
  list: (page, size) => ['admin-login-audit', page, size],
};

const normalizeLoginAudit = (response) => {
  const rows = (response?.content || []).map((item) => ({
    id: String(item.auditLogId),
    login_time: item.createdAt || '',
    action: item.action || '',
    user_id: item.userId ? String(item.userId) : null,
    ip_address: item.ipAddress || '',
    status: item.success ? 'SUCCESS' : 'FAILED',
    failure_reason: item.success ? '' : `HTTP ${item.statusCode || ''}`.trim(),
    user_agent: item.userAgent || '',
  }));
  return {
    rows,
    totalElements: response?.totalElements || 0,
    totalPages: Math.max(response?.totalPages || 1, 1),
  };
};

export function useLoginAudit(page, size) {
  const query = useQuery({
    queryKey: loginAuditKeys.list(page, size),
    queryFn: () => getLoginAuditLogs({page: Math.max(page - 1, 0), size}),
    select: normalizeLoginAudit,
    placeholderData: keepPreviousData,
  });

  return {
    rows: query.data?.rows ?? [],
    totalElements: query.data?.totalElements ?? 0,
    totalPages: query.data?.totalPages ?? 1,
    isLoading: query.isLoading,
  };
}
