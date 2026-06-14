import React, {useEffect, useMemo, useState} from 'react';
import {Badge, Button, Form} from 'react-bootstrap';
import {ChevronLeft, ChevronRight} from 'lucide-react';

import {getLoginAuditLogs} from '../../api/adminAuditApi';
import {formatDateTime} from '../../utils/format-date-time';
import {AdminPageHeader, AdminTable, AdminToolbar} from '../components/common';

function LoginAudit() {
  const ITEMS_PER_PAGE = 20;
  const [currentPage, setCurrentPage] = useState(1);
  const [totalElements, setTotalElements] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [loginAuditRows, setLoginAuditRows] = useState([]);
  const [loading, setLoading] = useState(false);

  const loadLoginAuditLogs = async (page) => {
    setLoading(true);
    try {
      const response = await getLoginAuditLogs({
        page: Math.max(page - 1, 0),
        size: ITEMS_PER_PAGE,
      });
      const rows = (response.content || []).map((item) => ({
        id: String(item.auditLogId),
        login_time: item.createdAt || '',
        action: item.action || '',
        user_id: item.userId ? String(item.userId) : null,
        ip_address: item.ipAddress || '',
        status: item.success ? 'SUCCESS' : 'FAILED',
        failure_reason: item.success ? '' : `HTTP ${item.statusCode || ''}`.trim(),
        user_agent: item.userAgent || '',
      }));
      setLoginAuditRows(rows);
      setTotalElements(response.totalElements || 0);
      setTotalPages(Math.max(response.totalPages || 1, 1));
    } catch (error) {
      setLoginAuditRows([]);
      setTotalElements(0);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLoginAuditLogs(currentPage);
  }, [currentPage]);

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
      />

      <div className="d-flex justify-content-between align-items-center flex-wrap gap-2">
        <span className="text-secondary small">
          Hiển thị {totalElements === 0 ? 0 : (currentPage - 1) * ITEMS_PER_PAGE + 1}-
          {totalElements === 0
            ? 0
            : Math.min((currentPage - 1) * ITEMS_PER_PAGE + loginAuditRows.length, totalElements)}{' '}
          trong {totalElements} bản ghi
        </span>
        <div className="d-flex align-items-center gap-2">
          <Button
            variant="outline-secondary"
            size="sm"
            disabled={currentPage <= 1}
            onClick={() => setCurrentPage((previous) => previous - 1)}
          >
            <ChevronLeft size={16} />
          </Button>
          <span className="small fw-semibold">
            {currentPage}/{totalPages}
          </span>
          <Button
            variant="outline-secondary"
            size="sm"
            disabled={currentPage >= totalPages}
            onClick={() => setCurrentPage((previous) => previous + 1)}
          >
            <ChevronRight size={16} />
          </Button>
        </div>
      </div>
    </div>
  );
}

export default LoginAudit;
