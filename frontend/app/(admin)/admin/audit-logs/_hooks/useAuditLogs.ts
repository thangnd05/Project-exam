'use client';

import {useQuery} from '@tanstack/react-query';

import {getAuditLogs} from '@/app/apis/adminAuditApi';
import {keepPreviousData} from '@/app/configs/queryClient';
import type {AuditLogResponse, PageResponse} from '@/app/types';

/** Bản ghi audit đã chuẩn hoá (snake_case) cho bảng admin. */
export interface AuditLogRow {
  audit_log_id: string;
  user_id: string | null;
  user_name: string;
  full_name: string;
  http_method: string;
  endpoint: string;
  action: string;
  ip_address: string;
  details: string;
  success: boolean;
  created_at: string;
}

export const auditLogKeys = {
  list: (page: number, size: number) => ['admin-audit-logs', page, size],
};

const normalizeAuditData = (response: PageResponse<AuditLogResponse>) => {
  const content = Array.isArray(response?.content) ? response.content : [];

  return {
    logs: content.map(
      (item): AuditLogRow => ({
        audit_log_id: String(item.auditLogId),
        user_id: item.userId ? String(item.userId) : null,
        user_name: item.userName || '',
        full_name: item.fullName || '',
        http_method: item.httpMethod || '',
        endpoint: item.endpoint || '',
        action: item.action || '',
        ip_address: item.ipAddress || '',
        details: item.details || '',
        success: Boolean(item.success),
        created_at: item.createdAt || '',
      }),
    ),
    totalElements: response?.totalElements || 0,
    totalPages: Math.max(response?.totalPages || 1, 1),
  };
};

export function useAuditLogs(page: number, itemsPerPage: number) {
  const query = useQuery({
    queryKey: auditLogKeys.list(page, itemsPerPage),
    queryFn: () =>
      getAuditLogs({page: Math.max(page - 1, 0), size: itemsPerPage}),
    placeholderData: keepPreviousData,
    select: normalizeAuditData,
  });

  const data = query.data ?? {logs: [], totalElements: 0, totalPages: 1};

  return {
    auditLogs: data.logs,
    totalElements: data.totalElements,
    totalPages: data.totalPages,
    isLoading: query.isLoading,
  };
}
