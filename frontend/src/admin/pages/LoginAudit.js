import React, {useEffect, useMemo, useState} from 'react';
import {Badge, Form, Spinner, Table} from 'react-bootstrap';
import classNames from 'classnames/bind';
import {ChevronLeft, ChevronRight, KeyRound, Search, ShieldAlert} from 'lucide-react';

import {getLoginAuditLogs} from '../../api/adminAuditApi';
import {formatDateTime} from '../../utils/format-date-time';
import styles from './AuditLogs.module.scss';

const cx = classNames.bind(styles);

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

  return (
    <div className={cx('auditLogsPage')}>
      <div className={cx('pageHeader')}>
        <h1>
          <KeyRound
            size={28}
            style={{verticalAlign: 'middle', marginRight: 8}}
            aria-hidden
          />
          Audit đăng nhập
        </h1>
        <p>
          Lịch sử đăng nhập thành công / thất bại (bảng login_audit — dữ liệu
          demo).
        </p>
      </div>

      <div className={cx('filters')}>
        <div className={cx('searchBox')}>
          <Search size={16} className={cx('searchIcon')} />
          <Form.Control
            type="text"
            placeholder="Tìm theo user ID, action, IP, user agent, lý do..."
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
          />
        </div>
        <Form.Select
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value)}
          className={cx('statusFilter')}
        >
          <option value="all">Tất cả trạng thái</option>
          <option value="success">Thành công</option>
          <option value="failed">Thất bại</option>
        </Form.Select>
      </div>

      <div className={cx('tableWrapper')}>
        <Table responsive hover className={cx('logsTable')}>
          <thead>
            <tr>
              <th>Thời gian</th>
              <th>Action</th>
              <th>User ID</th>
              <th>IP</th>
              <th>Trạng thái</th>
              <th>Lý do thất bại</th>
              <th>User agent</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={7} className="text-center py-4">
                  <Spinner size="sm" className="me-2" />
                  Đang tải dữ liệu...
                </td>
              </tr>
            )}
            {!loading &&
              filteredRows.map((row) => (
              <tr key={row.id}>
                <td>{formatDateTime(row.login_time)}</td>
                <td>{row.action || '—'}</td>
                <td>{row.user_id ?? '—'}</td>
                <td>{row.ip_address || '—'}</td>
                <td>
                  <Badge bg={row.status === 'SUCCESS' ? 'success' : 'danger'}>
                    {row.status === 'SUCCESS' ? 'Thành công' : 'Thất bại'}
                  </Badge>
                </td>
                <td>{row.failure_reason || '—'}</td>
                <td>
                  <span title={row.user_agent || ''}>
                    {(row.user_agent || '').length > 48
                      ? `${(row.user_agent || '').slice(0, 48)}…`
                      : row.user_agent || '—'}
                  </span>
                </td>
              </tr>
              ))}
            {!loading && filteredRows.length === 0 && (
              <tr>
                <td colSpan={7}>
                  <div className={cx('emptyState')}>
                    <ShieldAlert size={18} />
                    <span>Không có bản ghi phù hợp bộ lọc hiện tại.</span>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </Table>
      </div>
      <div className={cx('pagination')}>
        <span className={cx('paginationInfo')}>
          Hiển thị {totalElements === 0 ? 0 : (currentPage - 1) * ITEMS_PER_PAGE + 1}-
          {totalElements === 0
            ? 0
            : Math.min((currentPage - 1) * ITEMS_PER_PAGE + loginAuditRows.length, totalElements)}{' '}
          trong {totalElements} bản ghi
        </span>
        <div className={cx('paginationBtns')}>
          <button
            className={cx('pageBtn')}
            disabled={currentPage <= 1}
            onClick={() => setCurrentPage((previous) => previous - 1)}
          >
            <ChevronLeft size={16} />
          </button>
          <span className={cx('pageNumber')}>
            {currentPage}/{totalPages}
          </span>
          <button
            className={cx('pageBtn')}
            disabled={currentPage >= totalPages}
            onClick={() => setCurrentPage((previous) => previous + 1)}
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}

export default LoginAudit;
