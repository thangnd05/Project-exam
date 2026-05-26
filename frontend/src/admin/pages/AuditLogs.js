import React, {useEffect, useMemo, useState} from 'react';
import {Badge, Form, Spinner, Table} from 'react-bootstrap';
import classNames from 'classnames/bind';
import {ChevronLeft, ChevronRight, Search, ShieldAlert} from 'lucide-react';

import {getAuditLogs} from '../../api/adminAuditApi';
import {formatDateTime} from '../../utils/format-date-time';
import styles from './AuditLogs.module.scss';

const cx = classNames.bind(styles);

const methodColorMap = {
  GET: 'info',
  POST: 'primary',
  PUT: 'warning',
  PATCH: 'warning',
  DELETE: 'danger',
};

function AuditLogs() {
  const [currentPage, setCurrentPage] = useState(1);
  const [totalElements, setTotalElements] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [auditLogs, setAuditLogs] = useState([]);
  const [loading, setLoading] = useState(false);

  const ITEMS_PER_PAGE = 20;

  const loadAuditData = async (page) => {
    setLoading(true);
    try {
      const auditResponse = await getAuditLogs({
        page: Math.max(page - 1, 0),
        size: ITEMS_PER_PAGE,
      });

      const nextAuditLogs = (auditResponse.content || []).map((item) => ({
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
      }));

      setAuditLogs(nextAuditLogs);
      setTotalElements(auditResponse.totalElements || 0);
      setTotalPages(Math.max(auditResponse.totalPages || 1, 1));
    } catch (error) {
      setAuditLogs([]);
      setTotalElements(0);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAuditData(currentPage);
  }, [currentPage]);

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

  return (
    <div className={cx('auditLogsPage')}>
      <div className={cx('pageHeader')}>
        <h1>Audit Logs</h1>
        <p>Theo doi thao tac quan tri va su kien nhay cam trong he thong.</p>
      </div>

      <div className={cx('filters')}>
        <div className={cx('searchBox')}>
          <Search size={16} className={cx('searchIcon')} />
          <Form.Control
            type="text"
            placeholder="Tim action, endpoint, resource, nguoi thao tac..."
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
          />
        </div>
        <Form.Select
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value)}
          className={cx('statusFilter')}
        >
          <option value="all">Tat ca trang thai</option>
          <option value="success">Thanh cong</option>
          <option value="failed">That bai</option>
        </Form.Select>
      </div>

      <div className={cx('tableWrapper')}>
        <Table responsive hover className={cx('logsTable')}>
          <thead>
            <tr>
              <th>Thời gian</th>
              <th>Hành động</th>
              <th>API</th>
              <th>Người thực hiện</th>
              <th>IP</th>
              <th>Trạng thái</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={6} className="text-center py-4">
                  <Spinner size="sm" className="me-2" />
                  Đang tải dữ liệu...
                </td>
              </tr>
            )}
            {!loading &&
              filteredLogs.map((log) => {
              return (
                <tr key={log.audit_log_id}>
                  <td>{formatDateTime(log.created_at)}</td>
                  <td>{log.action}</td>
                  <td>
                    <div className={cx('apiCell')}>
                      <Badge bg={methodColorMap[log.http_method] || 'secondary'}>
                        {log.http_method}
                      </Badge>
                      <span>{log.endpoint}</span>
                    </div>
                  </td>
                  <td>{log.full_name || log.user_name || 'Unknown'}</td>
                  <td>{log.ip_address || '-'}</td>
                  <td>
                    <Badge bg={log.success ? 'success' : 'danger'}>
                      {log.success ? 'Thanh cong' : 'That bai'}
                    </Badge>
                  </td>
                </tr>
              );
            })}
            {!loading && filteredLogs.length === 0 && (
              <tr>
                <td colSpan={6}>
                  <div className={cx('emptyState')}>
                    <ShieldAlert size={18} />
                    <span>Khong co log phu hop bo loc hien tai.</span>
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
            : Math.min((currentPage - 1) * ITEMS_PER_PAGE + auditLogs.length, totalElements)}{' '}
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

export default AuditLogs;
