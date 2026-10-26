'use client';

import { useMemo, useState } from 'react';
import {Badge, Form} from 'react-bootstrap';
import {useTranslations} from 'next-intl';

import {formatFullDateTime} from '@/app/utils/format-date-time';
import {AdminPageHeader, AdminTable, AdminToolbar} from '@/app/[locale]/(admin)/_components/common';
import type {AdminTableColumn} from '@/app/[locale]/(admin)/_components/common/AdminTable';
import {useAuditLogs, type AuditLogRow} from './_hooks/useAuditLogs';

const methodColorMap: Record<string, string> = {
  GET: 'info',
  POST: 'primary',
  PUT: 'warning',
  PATCH: 'warning',
  DELETE: 'danger',
};

function AuditLogs() {
  const t = useTranslations('AdminSystem.auditLogs');
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
        (log.user_name || '').toLowerCase().includes(normalizedSearch) ||
        (log.details || '').toLowerCase().includes(normalizedSearch);

      const matchesStatus =
        statusFilter === 'all' ||
        (statusFilter === 'success' && Boolean(log.success)) ||
        (statusFilter === 'failed' && !Boolean(log.success));

      return matchesSearch && matchesStatus;
    });
  }, [auditLogs, searchTerm, statusFilter]);

  const columns: AdminTableColumn[] = [
    {
      key: 'created_at',
      header: t('time'),
      render: (log: AuditLogRow) => formatFullDateTime(log.created_at),
    },
    {key: 'action', header: t('action')},
    {
      key: 'endpoint',
      header: 'API',
      render: (log: AuditLogRow) => (
        <div className="d-flex align-items-center gap-2">
          <Badge bg={methodColorMap[log.http_method] || 'secondary'}>
            {log.http_method}
          </Badge>
          <span>{log.endpoint}</span>
        </div>
      ),
    },
    {
      key: 'details',
      header: t('details'),
      render: (log: AuditLogRow) =>
        log.details ? (
          <span title={log.details} style={{whiteSpace: 'pre-wrap', wordBreak: 'break-word'}}>
            {log.details}
          </span>
        ) : (
          '-'
        ),
    },
    {
      key: 'user_name',
      header: t('actor'),
      render: (log: AuditLogRow) => log.user_name || log.full_name || 'Unknown',
    },
    {key: 'ip_address', header: 'IP', render: (log: AuditLogRow) => log.ip_address || '-'},
    {
      key: 'success',
      header: t('status'),
      render: (log: AuditLogRow) => (
        <Badge bg={log.success ? 'success' : 'danger'}>
          {log.success ? t('success') : t('failed')}
        </Badge>
      ),
    },
  ];

  return (
    <div className="d-flex flex-column gap-3">
      <AdminPageHeader
        title="Audit Logs"
        description={t('description')}
      />

      <AdminToolbar
        searchValue={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder={t('searchPlaceholder')}
      >
        <Form.Select
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value)}
          style={{maxWidth: 200}}
        >
          <option value="all">{t('allStatuses')}</option>
          <option value="success">{t('success')}</option>
          <option value="failed">{t('failed')}</option>
        </Form.Select>
      </AdminToolbar>

      <AdminTable
        showIndex
        columns={columns}
        data={filteredLogs}
        loading={loading}
        getRowKey={(log: AuditLogRow) => log.audit_log_id}
        page={currentPage - 1}
        totalPages={totalPages}
        totalElements={totalElements}
        pageSize={ITEMS_PER_PAGE}
        itemLabel={t('itemLabel')}
        onPageChange={(p) => setCurrentPage(p + 1)}
      />
    </div>
  );
}

export default AuditLogs;
