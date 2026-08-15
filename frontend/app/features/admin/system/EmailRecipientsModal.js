'use client';

import {useEffect, useState} from 'react';
import {RefreshCw} from 'lucide-react';
import {toast} from 'react-toastify';

import BaseModal from '@/app/components/modal/BaseModal';
import ButtonPrime from '@/app/components/Button/ButtonPrime';
import {AdminFieldError, AdminTable, StatCard, StatCardGroup} from '@/app/components/admin/common';
import {useEmailMutations, useEmailRecipients} from './hooks/useAdminEmails';

const PAGE_SIZE = 20;

const STATUS_VARIANTS = {
  SENT: 'bg-success',
  FAILED: 'bg-danger',
  PENDING: 'bg-secondary',
};

/** Nhật ký gửi của một email: ai nhận, thành công hay lỗi, lỗi vì sao. */
function EmailRecipientsModal({show, email, onClose}) {
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
      await retryFailed(email.emailId);
      toast.info('Đã đưa các email lỗi vào hàng gửi lại.');
    } catch (error) {
      setErrorMessage(error?.response?.data?.message || 'Không gửi lại được.');
    } finally {
      setRetrying(false);
    }
  };

  const formatDate = (value) => (value ? new Date(value).toLocaleString('vi-VN') : '—');

  const columns = [
    {
      key: 'recipient',
      header: 'Người nhận',
      render: (row) => (
        <div className="d-flex flex-column">
          <span className="fw-semibold">{row.fullName || '(tài khoản đã xóa)'}</span>
          <span className="text-muted small">{row.toEmail}</span>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Trạng thái',
      render: (row) => (
        <span className={`badge ${STATUS_VARIANTS[row.status] || 'bg-secondary'}`}>
          {row.statusLabel}
        </span>
      ),
    },
    {
      key: 'error',
      header: 'Lỗi',
      render: (row) => (
        <span className="small text-danger">{row.errorMessage || '—'}</span>
      ),
    },
    {key: 'sentAt', header: 'Gửi lúc', render: (row) => formatDate(row.sentAt)},
    {key: 'createdAt', header: 'Xếp hàng lúc', render: (row) => formatDate(row.createdAt)},
  ];

  const canRetry = email?.type === 'MANUAL' && (email?.failedCount ?? 0) > 0;

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
            Gửi lại {email.failedCount} email lỗi
          </ButtonPrime>
        )}
        {email?.type === 'AUTO' && (
          <span className="small text-muted">
            Email tự động không gửi lại được  nội dung phụ thuộc dữ liệu của lần gửi đó.
          </span>
        )}
      </div>

      <AdminTable
        columns={columns}
        data={recipientPage.content}
        loading={isLoading}
        getRowKey={(row) => row.recipientId}
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
