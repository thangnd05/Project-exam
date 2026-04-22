import React, {useEffect, useMemo, useState} from 'react';
import {Badge, Form, Spinner, Table} from 'react-bootstrap';
import classNames from 'classnames/bind';
import {Search, ShieldAlert} from 'lucide-react';

import {getAuditLogs} from '../../api/adminAuditApi';
import {getUsers} from '../../api/userApi';
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
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [auditLogs, setAuditLogs] = useState([]);
  const [userMap, setUserMap] = useState({});
  const [loading, setLoading] = useState(false);

  const loadAuditData = async () => {
    setLoading(true);
    try {
      const [auditResponse, userData] = await Promise.all([
        getAuditLogs({page: 0, size: 300}),
        getUsers(),
      ]);

      const nextUserMap = userData.reduce((accumulator, user) => {
        const userId = String(user.userId || user.user_id);
        return {
          ...accumulator,
          [userId]: user,
        };
      }, {});

      const nextAuditLogs = (auditResponse.content || []).map((item) => ({
        audit_log_id: String(item.auditLogId),
        user_id: item.userId ? String(item.userId) : null,
        http_method: item.httpMethod || '',
        endpoint: item.endpoint || '',
        action: item.action || '',
        ip_address: item.ipAddress || '',
        success: Boolean(item.success),
        created_at: item.createdAt || '',
      }));

      setUserMap(nextUserMap);
      setAuditLogs(nextAuditLogs);
    } catch (error) {
      setAuditLogs([]);
      setUserMap({});
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAuditData();
  }, []);

  const filteredLogs = useMemo(() => {
    return auditLogs.filter((log) => {
      const normalizedSearch = searchTerm.trim().toLowerCase();
      const user = log.user_id ? userMap[log.user_id] : null;

      const matchesSearch =
        normalizedSearch.length === 0 ||
        log.action.toLowerCase().includes(normalizedSearch) ||
        log.endpoint.toLowerCase().includes(normalizedSearch) ||
        (user?.full_name || '').toLowerCase().includes(normalizedSearch);

      const matchesStatus =
        statusFilter === 'all' ||
        (statusFilter === 'success' && Boolean(log.success)) ||
        (statusFilter === 'failed' && !Boolean(log.success));

      return matchesSearch && matchesStatus;
    });
  }, [auditLogs, searchTerm, statusFilter, userMap]);

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
              const actor = log.user_id ? userMap[log.user_id] : null;
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
                  <td>{actor?.fullName || actor?.full_name || 'Unknown'}</td>
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
    </div>
  );
}

export default AuditLogs;
