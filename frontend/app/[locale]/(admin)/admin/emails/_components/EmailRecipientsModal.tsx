'use client';

import {useState} from 'react';
import {RefreshCw} from 'lucide-react';
import {toast} from 'react-toastify';
import {useLocale, useTranslations} from 'next-intl';

import BaseModal from '@/app/components/modal/BaseModal';
import ButtonPrime from '@/app/components/Button/ButtonPrime';
import {AdminFieldError, AdminTable, StatCard, StatCardGroup} from '@/app/[locale]/(admin)/_components/common';
import type {AdminTableColumn} from '@/app/[locale]/(admin)/_components/common/AdminTable';
import {EmailStatus, EmailType} from '@/app/enums';
import type {EmailRecipientResponse, EmailResponse} from '@/app/types';
import {getApiErrorMessage} from '@/app/utils/apiError';
import {useEmailMutations, useEmailRecipients} from '@/app/[locale]/(admin)/admin/emails/_hooks/useAdminEmails';

const PAGE_SIZE = 20;

const STATUS_VARIANTS: Record<EmailStatus, string> = {
  SENT: 'bg-success',
  FAILED: 'bg-danger',
  PENDING: 'bg-secondary',
};

type EmailRecipientsModalProps = {
  show: boolean;
  email: EmailResponse | null;
  onClose: () => void;
};

function EmailRecipientsModal({show, email, onClose}: EmailRecipientsModalProps) {
  const t = useTranslations('AdminSystem.emails.recipients');
  const locale = useLocale();
  const [page, setPage] = useState(0);
  const [errorMessage, setErrorMessage] = useState('');
  const [retrying, setRetrying] = useState(false);

  const {page: recipientPage, isLoading} = useEmailRecipients(show ? email?.emailId : null, page, PAGE_SIZE);
  const {retryFailed} = useEmailMutations();

  // Về trang đầu mỗi khi mở modal hoặc đổi email
  const [prevShow, setPrevShow] = useState(false);
  const [prevEmailId, setPrevEmailId] = useState(email?.emailId);
  if (show !== prevShow || email?.emailId !== prevEmailId) {
    setPrevShow(show);
    setPrevEmailId(email?.emailId);
    if (show) {
      setPage(0);
      setErrorMessage('');
    }
  }

  const handleRetry = async () => {
    setErrorMessage('');
    setRetrying(true);
    try {
      await retryFailed(email!.emailId);
      toast.info(t('retryQueued'));
    } catch (error) {
      setErrorMessage(getApiErrorMessage(error, t('retryFailed')));
    } finally {
      setRetrying(false);
    }
  };

  const formatDate = (value?: string) => (value ? new Date(value).toLocaleString(locale === 'en' ? 'en-US' : 'vi-VN') : '-');

  const columns: AdminTableColumn[] = [
    {
      key: 'recipient',
      header: t('recipient'),
      render: (row: EmailRecipientResponse) => (
        <div className="d-flex flex-column">
          <span className="fw-semibold">{row.fullName || t('deletedAccount')}</span>
          <span className="text-muted small">{row.toEmail}</span>
        </div>
      ),
    },
    {
      key: 'status',
      header: t('status'),
      render: (row: EmailRecipientResponse) => (
        <span className={`badge ${STATUS_VARIANTS[row.status as EmailStatus] || 'bg-secondary'}`}>
          {row.status && row.status in STATUS_VARIANTS ? t(`statuses.${row.status as EmailStatus}`) : row.statusLabel}
        </span>
      ),
    },
    {
      key: 'error',
      header: t('error'),
      render: (row: EmailRecipientResponse) => (
        <span className="small text-danger">{row.errorMessage || '-'}</span>
      ),
    },
    {key: 'sentAt', header: t('sentAt'), render: (row: EmailRecipientResponse) => formatDate(row.sentAt)},
    {key: 'createdAt', header: t('queuedAt'), render: (row: EmailRecipientResponse) => formatDate(row.createdAt)},
  ];

  const canRetry = email?.type === EmailType.MANUAL && (email?.failedCount ?? 0) > 0;

  return (
    <BaseModal
      show={show}
      onClose={onClose}
      title={t('title', {name: email?.name || email?.subject || ''})}
      maxWidth={900}
    >
      <StatCardGroup>
        <StatCard label={t('stats.total')} value={email?.totalCount ?? 0} />
        <StatCard label={t('stats.sent')} value={email?.sentCount ?? 0} />
        <StatCard label={t('stats.failed')} value={email?.failedCount ?? 0} />
        <StatCard label={t('stats.pending')} value={email?.pendingCount ?? 0} />
      </StatCardGroup>

      <div className="d-flex justify-content-end my-3">
        {canRetry && (
          <ButtonPrime variant="outline" onClick={handleRetry} disabled={retrying}>
            <RefreshCw size={16} className="me-1" />
            {t('retry', {count: email!.failedCount})}
          </ButtonPrime>
        )}
        {email?.type === EmailType.AUTO && (
          <span className="small text-muted">
            {t('autoNoRetry')}
          </span>
        )}
      </div>

      <AdminTable
        columns={columns}
        data={recipientPage.content}
        loading={isLoading}
        getRowKey={(row: EmailRecipientResponse) => row.recipientId}
        emptyText={t('empty')}
        page={recipientPage.currentPage}
        totalPages={recipientPage.totalPages}
        totalElements={recipientPage.totalElements}
        onPageChange={setPage}
        itemLabel={t('itemLabel')}
      />

      <AdminFieldError message={errorMessage} />
    </BaseModal>
  );
}

export default EmailRecipientsModal;
