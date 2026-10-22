'use client';

import {useMemo, useState} from 'react';
import {Button} from 'react-bootstrap';
import {Edit, History, Plus, Send, Trash2} from 'lucide-react';
import {toast} from 'react-toastify';
import {useLocale, useTranslations} from 'next-intl';
import classNames from 'classnames/bind';

import ConfirmDeleteModal from '@/app/components/modal/ConfirmDeleteModal';
import {
  AdminFieldError,
  AdminPageHeader,
  AdminTable,
  AdminToolbar,
  StatCard,
  StatCardGroup,
} from '@/app/[locale]/(admin)/_components/common';
import type {AdminTableColumn} from '@/app/[locale]/(admin)/_components/common/AdminTable';
import type {EmailResponse} from '@/app/types';
import {getApiErrorMessage} from '@/app/utils/apiError';
import styles from '@/app/[locale]/(admin)/_components/common/adminKit.module.scss';
import EmailEditorModal from './_components/EmailEditorModal';
import EmailRecipientsModal from './_components/EmailRecipientsModal';
import SendEmailModal from './_components/SendEmailModal';
import {useAutoEmails, useEmailMutations, useManualEmails} from './_hooks/useAdminEmails';

const cx = classNames.bind(styles);

const PAGE_SIZE = 10;

const TABS = [
  {key: 'auto', label: 'auto'},
  {key: 'manual', label: 'manual'},
] as const;

function EmailsManagement() {
  const t = useTranslations('AdminSystem.emails');
  const tAdmin = useTranslations('AdminCommon');
  const locale = useLocale();
  const [activeTab, setActiveTab] = useState('auto');
  const [keyword, setKeyword] = useState('');
  const [manualPage, setManualPage] = useState(0);

  const [editingEmail, setEditingEmail] = useState<EmailResponse | null>(null);
  const [showEditor, setShowEditor] = useState(false);
  const [sendingEmail, setSendingEmail] = useState<EmailResponse | null>(null);
  const [logEmailId, setLogEmailId] = useState<string | null>(null);
  const [deletingEmail, setDeletingEmail] = useState<EmailResponse | null>(null);
  const [errorMessage, setErrorMessage] = useState('');

  const {emails: autoEmails, isLoading: autoLoading} = useAutoEmails();
  const {page: manualData, isLoading: manualLoading} = useManualEmails(manualPage, PAGE_SIZE);
  const {removeEmail} = useEmailMutations();

  const filteredAuto = useMemo(() => {
    const normalized = keyword.trim().toLowerCase();
    if (!normalized) {
      return autoEmails;
    }
    return autoEmails.filter((email) =>
      `${email.name} ${email.code} ${email.subject}`.toLowerCase().includes(normalized),
    );
  }, [autoEmails, keyword]);

  const logEmail = useMemo(() => {
    if (!logEmailId) {
      return null;
    }
    return (
      [...autoEmails, ...manualData.content].find((email) => email.emailId === logEmailId) || null
    );
  }, [logEmailId, autoEmails, manualData.content]);

  const manualStats = useMemo(() => {
    return manualData.content.reduce(
      (acc, email) => ({
        sent: acc.sent + (email.sentCount || 0),
        failed: acc.failed + (email.failedCount || 0),
        pending: acc.pending + (email.pendingCount || 0),
      }),
      {sent: 0, failed: 0, pending: 0},
    );
  }, [manualData.content]);

  const openEditor = (email: EmailResponse | null) => {
    setEditingEmail(email);
    setShowEditor(true);
  };

  const closeEditor = () => {
    setShowEditor(false);
    setEditingEmail(null);
  };

  const handleDelete = async () => {
    setErrorMessage('');
    try {
      await removeEmail(deletingEmail!.emailId);
      toast.success(t('toast.deleted'));
      setDeletingEmail(null);
    } catch (error) {
      setErrorMessage(getApiErrorMessage(error, t('errors.deleteFailed')));
    }
  };

  const formatDate = (value?: string) => (value ? new Date(value).toLocaleString(locale === 'en' ? 'en-US' : 'vi-VN') : '-');

  const statusColumn: AdminTableColumn = {
    key: 'active',
    header: t('columns.status'),
    render: (email: EmailResponse) =>
      email.active ? (
        <span className="badge bg-success">{t('enabled')}</span>
      ) : (
        <span className="badge bg-secondary">{t('disabled')}</span>
      ),
  };

  const sendCountColumns: AdminTableColumn[] = [
    {key: 'sentCount', header: t('columns.sent'), render: (email: EmailResponse) => email.sentCount},
    {
      key: 'failedCount',
      header: t('columns.failed'),
      render: (email: EmailResponse) =>
        email.failedCount > 0 ? (
          <span className="text-danger fw-semibold">{email.failedCount}</span>
        ) : (
          0
        ),
    },
  ];

  const autoColumns: AdminTableColumn[] = [
    {
      key: 'name',
      header: t('columns.template'),
      render: (email: EmailResponse) => (
        <div className="d-flex flex-column">
          <span className="fw-semibold">{email.name}</span>
          <span className="text-muted small">{email.description}</span>
          <code className="small">{email.code}</code>
        </div>
      ),
    },
    {key: 'subject', header: t('columns.subject'), render: (email: EmailResponse) => email.subject},
    statusColumn,
    ...sendCountColumns,
  ];

  const manualColumns: AdminTableColumn[] = [
    {
      key: 'name',
      header: 'Email',
      render: (email: EmailResponse) => (
        <div className="d-flex flex-column">
          <span className="fw-semibold">{email.name || email.subject}</span>
          <span className="text-muted small">{email.subject}</span>
        </div>
      ),
    },
    {key: 'totalCount', header: t('columns.recipients'), render: (email: EmailResponse) => email.totalCount},
    ...sendCountColumns,
    {
      key: 'pendingCount',
      header: t('columns.pending'),
      render: (email: EmailResponse) => email.pendingCount,
    },
    statusColumn,
    {key: 'createdAt', header: t('columns.createdAt'), render: (email: EmailResponse) => formatDate(email.createdAt)},
  ];

  const isAutoTab = activeTab === 'auto';

  return (
    <div className="d-flex flex-column gap-3">
      <AdminPageHeader
        title={t('title')}
        description={t('description')}
      >
        {!isAutoTab && (
          <Button onClick={() => openEditor(null)}>
            <Plus size={16} className="me-1" />
            {t('compose')}
          </Button>
        )}
      </AdminPageHeader>

      <div className="d-flex gap-2">
        {TABS.map((tab) => (
          <Button
            key={tab.key}
            type="button"
            size="sm"
            className={cx('pillBtn', {active: activeTab === tab.key})}
            onClick={() => setActiveTab(tab.key)}
          >
            {t(`tabs.${tab.label}`)}
          </Button>
        ))}
      </div>

      {!isAutoTab && (
        <StatCardGroup>
          <StatCard label={t('stats.composed')} value={manualData.totalElements} />
          <StatCard label={t('stats.sentPage')} value={manualStats.sent} />
          <StatCard label={t('stats.failedPage')} value={manualStats.failed} />
          <StatCard label={t('stats.pendingPage')} value={manualStats.pending} />
        </StatCardGroup>
      )}

      {isAutoTab && (
        <AdminToolbar
          searchValue={keyword}
          onSearchChange={setKeyword}
          searchPlaceholder={t('searchPlaceholder')}
        />
      )}

      <AdminFieldError message={errorMessage} />

      {isAutoTab ? (
        <AdminTable
          showIndex
          columns={autoColumns}
          data={filteredAuto}
          loading={autoLoading}
          getRowKey={(email: EmailResponse) => email.emailId}
          emptyText={t('autoEmpty')}
          rowActions={(email: EmailResponse) => (
            <>
              <button title={t('actions.edit')} onClick={() => openEditor(email)}>
                <Edit size={14} />
              </button>
              <button title={t('actions.log')} onClick={() => setLogEmailId(email.emailId)}>
                <History size={14} />
              </button>
            </>
          )}
        />
      ) : (
        <AdminTable
          showIndex
          columns={manualColumns}
          data={manualData.content}
          loading={manualLoading}
          getRowKey={(email: EmailResponse) => email.emailId}
          emptyText={t('manualEmpty')}
          itemLabel={t('itemLabel')}
          page={manualData.currentPage}
          totalPages={manualData.totalPages}
          totalElements={manualData.totalElements}
          onPageChange={setManualPage}
          rowActions={(email: EmailResponse) => (
            <>
              <button title={t('actions.edit')} onClick={() => openEditor(email)}>
                <Edit size={14} />
              </button>
              <button title={t('actions.send')} onClick={() => setSendingEmail(email)}>
                <Send size={14} />
              </button>
              <button title={t('actions.log')} onClick={() => setLogEmailId(email.emailId)}>
                <History size={14} />
              </button>
              <button className="danger" title={tAdmin('actions.delete')} onClick={() => setDeletingEmail(email)}>
                <Trash2 size={14} />
              </button>
            </>
          )}
        />
      )}

      <EmailEditorModal show={showEditor} email={editingEmail} onClose={closeEditor} />

      <SendEmailModal
        show={Boolean(sendingEmail)}
        email={sendingEmail}
        onClose={() => setSendingEmail(null)}
      />

      <EmailRecipientsModal
        show={Boolean(logEmail)}
        email={logEmail}
        onClose={() => setLogEmailId(null)}
      />

      <ConfirmDeleteModal
        show={Boolean(deletingEmail)}
        onClose={() => setDeletingEmail(null)}
        onConfirm={handleDelete}
        title={t('deleteTitle')}
        message={t('deleteMessage', {name: deletingEmail?.name || deletingEmail?.subject || ''})}
      />
    </div>
  );
}

export default EmailsManagement;
