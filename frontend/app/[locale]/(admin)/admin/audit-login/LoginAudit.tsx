'use client';

import { useMemo, useState } from 'react';
import {Badge, Form} from 'react-bootstrap';
import {useTranslations} from 'next-intl';

import {formatFullDateTime} from '@/app/utils/format-date-time';
import {AdminPageHeader, AdminTable, AdminToolbar} from '@/app/[locale]/(admin)/_components/common';
import type {AdminTableColumn} from '@/app/[locale]/(admin)/_components/common/AdminTable';
import {useLoginAudit, type LoginAuditRow} from './_hooks/useLoginAudit';

function LoginAudit() {
  const t = useTranslations('AdminSystem.auditLogin');
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

  const columns: AdminTableColumn[] = [
    {
      key: 'login_time',
      header: t('time'),
      render: (row: LoginAuditRow) => formatFullDateTime(row.login_time),
    },
    {key: 'action', header: 'Action', render: (row: LoginAuditRow) => row.action || '-'},
    {key: 'user_id', header: 'User ID', render: (row: LoginAuditRow) => row.user_id ?? '-'},
    {key: 'ip_address', header: 'IP', render: (row: LoginAuditRow) => row.ip_address || '-'},
    {
      key: 'status',
      header: t('status'),
      render: (row: LoginAuditRow) => (
        <Badge bg={row.status === 'SUCCESS' ? 'success' : 'danger'}>
          {row.status === 'SUCCESS' ? t('success') : t('failed')}
        </Badge>
      ),
    },
    {
      key: 'failure_reason',
      header: t('failureReason'),
      render: (row: LoginAuditRow) => row.failure_reason || '-',
    },
    {
      key: 'user_agent',
      header: 'User agent',
      render: (row: LoginAuditRow) => (
        <span title={row.user_agent || ''}>
          {(row.user_agent || '').length > 48
            ? `${(row.user_agent || '').slice(0, 48)}…`
            : row.user_agent || '-'}
        </span>
      ),
    },
  ];

  return (
    <div className="d-flex flex-column gap-3">
      <AdminPageHeader
        title={t('title')}
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
        >
          <option value="all">{t('allStatuses')}</option>
          <option value="success">{t('success')}</option>
          <option value="failed">{t('failed')}</option>
        </Form.Select>
      </AdminToolbar>

      <AdminTable
        showIndex
        columns={columns}
        data={filteredRows}
        loading={loading}
        emptyText={t('empty')}
        getRowKey={(row: LoginAuditRow) => row.id}
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

export default LoginAudit;
