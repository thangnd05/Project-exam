import {useQuery} from '@tanstack/react-query';

import {getAuditLogs} from '~/features/admin/api/adminAuditApi';
import {keepPreviousData} from '~/shared/config/queryClient';

export const auditLogKeys = {
  list: (page, size) => ['admin-audit-logs', page, size],
};

const normalizeAuditData = (response) => {
  const content = Array.isArray(response?.content) ? response.content : [];

  return {
    logs: content.map((item) => ({
      audit_log_id: String(item.auditLogId),
      user_id: item.userId ? String(item.userId) : null,
      user_name: item.userName || '',
      full_name: item.fullName || '',
      http_method: item.httpMethod || '',
      endpoint: item.endpoint || '',
      action: item.action || '',
      ip_address: item.ipAddress || '',
      success: Boolean(item.success),
      created_at: item.createdAt || '',
    })),
    totalElements: response?.totalElements || 0,
    totalPages: Math.max(response?.totalPages || 1, 1),
  };
};

export function useAuditLogs(page, itemsPerPage) {
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
