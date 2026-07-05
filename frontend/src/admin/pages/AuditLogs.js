import React, {useMemo, useState} from 'react';
import {Badge, Form} from 'react-bootstrap';

import {formatDateTime} from '../../utils/format-date-time';
import {AdminPageHeader, AdminTable, AdminToolbar} from '../components/common';
import {useAuditLogs} from './hooks/useAuditLogs';

const methodColorMap = {
  GET: 'info',
  POST: 'primary',
  PUT: 'warning',
  PATCH: 'warning',
  DELETE: 'danger',
};

function AuditLogs() {
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const ITEMS_PER_PAGE = 20;

  const {
    auditLogs,
    totalElements,
    totalPages,
    isLoading: loading,
  } = useAuditLogs(currentPage, ITEMS_PER_PAGE);

  const filteredLogs = useMemo(() => {
    return auditLogs.filter((log) => {
      const normalizedSearch = searchTerm.trim().toLowerCase();

      const matchesSearch =
        normalizedSearch.length === 0 ||
        log.action.toLowerCase().includes(normalizedSearch) ||
        log.endpoint.toLowerCase().includes(normalizedSearch) ||
        (log.full_name || '').toLowerCase().includes(normalizedSearch) ||
        (log.user_name || '').toLowerCase().includes(normalizedSearch);

      const matchesStatus =
        statusFilter === 'all' ||
        (statusFilter === 'success' && Boolean(log.success)) ||
        (statusFilter === 'failed' && !Boolean(log.success));

      return matchesSearch && matchesStatus;
    });
  }, [auditLogs, searchTerm, statusFilter]);

  const columns = [
    {
      key: 'created_at',
      header: 'Thời gian',
      render: (log) => formatDateTime(log.created_at),
    },
    {key: 'action', header: 'Hành động'},
    {
      key: 'endpoint',
      header: 'API',
      render: (log) => (
        <div className="d-flex align-items-center gap-2">
          <Badge bg={methodColorMap[log.http_method] || 'secondary'}>
            {log.http_method}
          </Badge>
          <span>{log.endpoint}</span>
        </div>
      ),
    },
    {
      key: 'full_name',
      header: 'Người thực hiện',
      render: (log) => log.full_name || log.user_name || 'Unknown',
    },
    {key: 'ip_address', header: 'IP', render: (log) => log.ip_address || '-'},
    {
      key: 'success',
      header: 'Trạng thái',
      render: (log) => (
        <Badge bg={log.success ? 'success' : 'danger'}>
          {log.success ? 'Thanh cong' : 'That bai'}
        </Badge>
      ),
    },
  ];

  return (
    <div className="d-flex flex-column gap-3">
      <AdminPageHeader
        title="Audit Logs"
        description="Theo doi thao tac quan tri va su kien nhay cam trong he thong."
      />

      <AdminToolbar
        searchValue={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder="Tim action, endpoint, resource, nguoi thao tac..."
      >
        <Form.Select
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value)}
          style={{maxWidth: 200}}
        >
          <option value="all">Tat ca trang thai</option>
          <option value="success">Thanh cong</option>
          <option value="failed">That bai</option>
        </Form.Select>
      </AdminToolbar>

      <AdminTable
        showIndex
        columns={columns}
        data={filteredLogs}
        loading={loading}
        getRowKey={(log) => log.audit_log_id}
        page={currentPage - 1}
        totalPages={totalPages}
        totalElements={totalElements}
        pageSize={ITEMS_PER_PAGE}
        itemLabel="bản ghi"
        onPageChange={(p) => setCurrentPage(p + 1)}
      />
    </div>
  );
}

export default AuditLogs;
