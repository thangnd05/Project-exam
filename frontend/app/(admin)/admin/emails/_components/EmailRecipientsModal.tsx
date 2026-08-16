'use client';

import {useEffect, useState} from 'react';
import {RefreshCw} from 'lucide-react';
import {toast} from 'react-toastify';

import BaseModal from '@/app/components/modal/BaseModal';
import ButtonPrime from '@/app/components/Button/ButtonPrime';
import {AdminFieldError, AdminTable, StatCard, StatCardGroup} from '@/app/components/admin/common';
import type {AdminTableColumn} from '@/app/components/admin/common/AdminTable';
import {EmailStatus, EmailType} from '@/app/enums';
import type {EmailRecipientResponse, EmailResponse} from '@/app/types';
import {useEmailMutations, useEmailRecipients} from '../_hooks/useAdminEmails';

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
  const [page, setPage] = useState(0);
  const [errorMessage, setErrorMessage] = useState('');
  const [retrying, setRetrying] = useState(false);

  const {page: recipientPage, isLoading} = useEmailRecipients(show ? email?.emailId : null, page, PAGE_SIZE);
  const {retryFailed} = useEmailMutations();

  useEffect(() => {
    if (show) {
      setPage(0);
      setErrorMessage('');
    }
  }, [show, email?.emailId]);

  const handleRetry = async () => {
    setErrorMessage('');
    setRetrying(true);
    try {
      await retryFailed(email!.emailId);
      toast.info('Đã đưa các email lỗi vào hàng gửi lại.');
    } catch (error) {
      setErrorMessage((error as any)?.response?.data?.message || 'Không gửi lại được.');
    } finally {
      setRetrying(false);
    }
  };

  const formatDate = (value?: string) => (value ? new Date(value).toLocaleString('vi-VN') : '—');

  const columns: AdminTableColumn[] = [
    {
      key: 'recipient',
      header: 'Người nhận',
      render: (row: EmailRecipientResponse) => (
        <div className="d-flex flex-column">
          <span className="fw-semibold">{row.fullName || '(tài khoản đã xóa)'}</span>
          <span className="text-muted small">{row.toEmail}</span>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Trạng thái',
      render: (row: EmailRecipientResponse) => (
        <span className={`badge ${STATUS_VARIANTS[row.status as EmailStatus] || 'bg-secondary'}`}>
          {row.statusLabel}
        </span>
      ),
    },
    {
      key: 'error',
      header: 'Lỗi',
      render: (row: EmailRecipientResponse) => (
        <span className="small text-danger">{row.errorMessage || '—'}</span>
      ),
    },
    {key: 'sentAt', header: 'Gửi lúc', render: (row: EmailRecipientResponse) => formatDate(row.sentAt)},
    {key: 'createdAt', header: 'Xếp hàng lúc', render: (row: EmailRecipientResponse) => formatDate(row.createdAt)},
  ];

  const canRetry = email?.type === EmailType.MANUAL && (email?.failedCount ?? 0) > 0;

  return (
    <BaseModal
      show={show}
      onClose={onClose}
      title={`Nhật ký gửi: ${email?.name || email?.subject || ''}`}
      maxWidth={900}
    >
      <StatCardGroup>
        <StatCard label="Tổng lượt gửi" value={email?.totalCount ?? 0} />
        <StatCard label="Thành công" value={email?.sentCount ?? 0} />
        <StatCard label="Lỗi" value={email?.failedCount ?? 0} />
        <StatCard label="Đang chờ" value={email?.pendingCount ?? 0} />
      </StatCardGroup>

      <div className="d-flex justify-content-end my-3">
        {canRetry && (
          <ButtonPrime variant="outline" onClick={handleRetry} disabled={retrying}>
            <RefreshCw size={16} className="me-1" />
            Gửi lại {email!.failedCount} email lỗi
          </ButtonPrime>
        )}
        {email?.type === EmailType.AUTO && (
          <span className="small text-muted">
            Email tự động không gửi lại được  nội dung phụ thuộc dữ liệu của lần gửi đó.
          </span>
        )}
      </div>

      <AdminTable
        columns={columns}
        data={recipientPage.content}
        loading={isLoading}
        getRowKey={(row: EmailRecipientResponse) => row.recipientId}
        emptyText="Email này chưa gửi cho ai."
        page={recipientPage.currentPage}
        totalPages={recipientPage.totalPages}
        totalElements={recipientPage.totalElements}
        onPageChange={setPage}
        itemLabel="lượt gửi"
      />

      <AdminFieldError message={errorMessage} />
    </BaseModal>
  );
}

export default EmailRecipientsModal;
