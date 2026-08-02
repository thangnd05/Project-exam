import { useMemo, useState } from 'react';
import {Badge, Form} from 'react-bootstrap';

import {formatDateTime} from '~/shared/utils/format-date-time';
import {AdminPageHeader, AdminTable, AdminToolbar} from '../components/common';
import {useLoginAudit} from '~/features/admin/overview/hooks/useLoginAudit';

function LoginAuditPage() {
  const ITEMS_PER_PAGE = 20;
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const {
    rows: loginAuditRows,
    totalElements,
    totalPages,
    isLoading: loading,
  } = useLoginAudit(currentPage, ITEMS_PER_PAGE);

  const filteredRows = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    return loginAuditRows.filter((row) => {
      const matchesSearch =
        q.length === 0 ||
        (row.action || '').toLowerCase().includes(q) ||
        (row.ip_address || '').toLowerCase().includes(q) ||
        (row.user_agent || '').toLowerCase().includes(q) ||
        String(row.user_id ?? '').includes(q) ||
        (row.failure_reason || '').toLowerCase().includes(q);

      const matchesStatus =
        statusFilter === 'all' ||
        (statusFilter === 'success' && row.status === 'SUCCESS') ||
        (statusFilter === 'failed' && row.status === 'FAILED');

      return matchesSearch && matchesStatus;
    });
  }, [loginAuditRows, searchTerm, statusFilter]);

  const columns = [
    {
      key: 'login_time',
      header: 'Thời gian',
      render: (row) => formatDateTime(row.login_time),
    },
    {key: 'action', header: 'Action', render: (row) => row.action || '—'},
    {key: 'user_id', header: 'User ID', render: (row) => row.user_id ?? '—'},
    {key: 'ip_address', header: 'IP', render: (row) => row.ip_address || '—'},
    {
      key: 'status',
      header: 'Trạng thái',
      render: (row) => (
        <Badge bg={row.status === 'SUCCESS' ? 'success' : 'danger'}>
          {row.status === 'SUCCESS' ? 'Thành công' : 'Thất bại'}
        </Badge>
      ),
    },
    {
      key: 'failure_reason',
      header: 'Lý do thất bại',
      render: (row) => row.failure_reason || '—',
    },
    {
      key: 'user_agent',
      header: 'User agent',
      render: (row) => (
        <span title={row.user_agent || ''}>
          {(row.user_agent || '').length > 48
            ? `${(row.user_agent || '').slice(0, 48)}…`
            : row.user_agent || '—'}
        </span>
      ),
    },
  ];

  return (
    <div className="d-flex flex-column gap-3">
      <AdminPageHeader
        title="Audit đăng nhập"
        description="Lịch sử đăng nhập thành công / thất bại (bảng login_audit — dữ liệu demo)."
      />

      <AdminToolbar
        searchValue={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder="Tìm theo user ID, action, IP, user agent, lý do..."
      >
        <Form.Select
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value)}
        >
          <option value="all">Tất cả trạng thái</option>
          <option value="success">Thành công</option>
          <option value="failed">Thất bại</option>
        </Form.Select>
      </AdminToolbar>

      <AdminTable
        showIndex
        columns={columns}
        data={filteredRows}
        loading={loading}
        emptyText="Không có bản ghi phù hợp bộ lọc hiện tại."
        getRowKey={(row) => row.id}
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

export default LoginAuditPage;
