import React, {useEffect, useMemo, useState} from 'react';
import {Badge, Form, Spinner, Table} from 'react-bootstrap';
import classNames from 'classnames/bind';
import {KeyRound, Search, ShieldAlert} from 'lucide-react';

import {getLoginAuditLogs} from '../../api/adminAuditApi';
import styles from './AuditLogs.module.scss';

const cx = classNames.bind(styles);

function LoginAudit() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [loginAuditRows, setLoginAuditRows] = useState([]);
  const [loading, setLoading] = useState(false);

  const loadLoginAuditLogs = async () => {
    setLoading(true);
    try {
      const response = await getLoginAuditLogs({page: 0, size: 300});
      const rows = (response.content || []).map((item) => ({
        id: String(item.auditLogId),
        login_time: item.createdAt || '',
        user_name: item.action || 'Unknown',
        user_id: item.userId ? String(item.userId) : null,
        ip_address: item.ipAddress || '',
        status: item.success ? 'SUCCESS' : 'FAILED',
        failure_reason: item.success ? '' : `HTTP ${item.statusCode || ''}`.trim(),
        user_agent: item.userAgent || '',
      }));
      setLoginAuditRows(rows);
    } catch (error) {
      setLoginAuditRows([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLoginAuditLogs();
  }, []);

  const filteredRows = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    return loginAuditRows.filter((row) => {
      const matchesSearch =
        q.length === 0 ||
        (row.user_name || '').toLowerCase().includes(q) ||
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
            placeholder="Tìm theo tên đăng nhập, IP, user agent, lý do..."
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
              <th>Tên đăng nhập</th>
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
                <td>{row.login_time}</td>
                <td>{row.user_name}</td>
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
    </div>
  );
}

export default LoginAudit;
