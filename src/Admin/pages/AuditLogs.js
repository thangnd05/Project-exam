import React, {useMemo, useState} from 'react';
import {Badge, Form, Table} from 'react-bootstrap';
import classNames from 'classnames/bind';
import {Search, ShieldAlert} from 'lucide-react';

import {fakeAuditLogs, fakeUsers} from '../data/fakeData';
import styles from './AuditLogs.module.scss';

const cx = classNames.bind(styles);

const methodColorMap = {
  GET: 'info',
  POST: 'primary',
  PUT: 'warning',
  PATCH: 'warning',
  DELETE: 'danger',
};

const getAuditActorById = (userId) => {
  return fakeUsers.find((user) => user.user_id === userId) || null;
};

function AuditLogs() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const filteredLogs = useMemo(() => {
    return fakeAuditLogs.filter((log) => {
      const normalizedSearch = searchTerm.trim().toLowerCase();
      const user = log.user_id ? getAuditActorById(log.user_id) : null;

      const matchesSearch =
        normalizedSearch.length === 0 ||
        log.action.toLowerCase().includes(normalizedSearch) ||
        log.endpoint.toLowerCase().includes(normalizedSearch) ||
        log.resource.toLowerCase().includes(normalizedSearch) ||
        (user?.full_name || '').toLowerCase().includes(normalizedSearch);

      const matchesStatus =
        statusFilter === 'all' ||
        (statusFilter === 'success' && Boolean(log.success)) ||
        (statusFilter === 'failed' && !Boolean(log.success));

      return matchesSearch && matchesStatus;
    });
  }, [searchTerm, statusFilter]);

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
              <th>Thoi gian</th>
              <th>Action</th>
              <th>API</th>
              <th>Tai nguyen</th>
              <th>Actor</th>
              <th>IP</th>
              <th>Trang thai</th>
            </tr>
          </thead>
          <tbody>
            {filteredLogs.map((log) => {
              const actor = log.user_id ? getAuditActorById(log.user_id) : null;
              return (
                <tr key={log.audit_log_id}>
                  <td>{log.created_at}</td>
                  <td>{log.action}</td>
                  <td>
                    <div className={cx('apiCell')}>
                      <Badge bg={methodColorMap[log.http_method] || 'secondary'}>
                        {log.http_method}
                      </Badge>
                      <span>{log.endpoint}</span>
                    </div>
                  </td>
                  <td>
                    {log.resource}
                    {log.resource_id ? ` #${log.resource_id}` : ''}
                  </td>
                  <td>{actor?.full_name || 'Unknown'}</td>
                  <td>{log.ip_address || '-'}</td>
                  <td>
                    <Badge bg={log.success ? 'success' : 'danger'}>
                      {log.success ? 'Thanh cong' : 'That bai'}
                    </Badge>
                  </td>
                </tr>
              );
            })}
            {filteredLogs.length === 0 && (
              <tr>
                <td colSpan={7}>
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
