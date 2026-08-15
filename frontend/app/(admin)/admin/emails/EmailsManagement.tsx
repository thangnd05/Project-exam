'use client';

import {useMemo, useState} from 'react';
import {Button} from 'react-bootstrap';
import {Edit, History, Plus, Send, Trash2} from 'lucide-react';
import {toast} from 'react-toastify';
import classNames from 'classnames/bind';

import ConfirmDeleteModal from '@/app/components/modal/ConfirmDeleteModal';
import {
  AdminFieldError,
  AdminPageHeader,
  AdminTable,
  AdminToolbar,
  StatCard,
  StatCardGroup,
} from '@/app/components/admin/common';
import type {AdminTableColumn} from '@/app/components/admin/common/AdminTable';
import type {EmailResponse} from '@/app/types';
import styles from '@/app/components/admin/common/adminKit.module.scss';
import EmailEditorModal from './_components/EmailEditorModal';
import EmailRecipientsModal from './_components/EmailRecipientsModal';
import SendEmailModal from './_components/SendEmailModal';
import {useAutoEmails, useEmailMutations, useManualEmails} from './_hooks/useAdminEmails';

const cx = classNames.bind(styles);

const PAGE_SIZE = 10;

const TABS = [
  {key: 'auto', label: 'Mẫu tự động'},
  {key: 'manual', label: 'Soạn & gửi'},
];

function EmailsManagement() {
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

  // Lấy lại từ danh sách thay vì giữ bản chụp lúc bấm: sau khi gửi lại email lỗi, số liệu
  // trong modal nhật ký phải đổi theo.
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
      toast.success('Đã xóa email.');
      setDeletingEmail(null);
    } catch (error) {
      setErrorMessage((error as any)?.response?.data?.message || 'Không xóa được email.');
    }
  };

  const formatDate = (value?: string) => (value ? new Date(value).toLocaleString('vi-VN') : '—');

  const statusColumn: AdminTableColumn = {
    key: 'active',
    header: 'Trạng thái',
    render: (email: EmailResponse) =>
      email.active ? (
        <span className="badge bg-success">Đang bật</span>
      ) : (
        <span className="badge bg-secondary">Đang tắt</span>
      ),
  };

  const sendCountColumns: AdminTableColumn[] = [
    {key: 'sentCount', header: 'Đã gửi', render: (email: EmailResponse) => email.sentCount},
    {
      key: 'failedCount',
      header: 'Lỗi',
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
      header: 'Mẫu email',
      render: (email: EmailResponse) => (
        <div className="d-flex flex-column">
          <span className="fw-semibold">{email.name}</span>
          <span className="text-muted small">{email.description}</span>
          <code className="small">{email.code}</code>
        </div>
      ),
    },
    {key: 'subject', header: 'Tiêu đề', render: (email: EmailResponse) => email.subject},
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
    {key: 'totalCount', header: 'Người nhận', render: (email: EmailResponse) => email.totalCount},
    ...sendCountColumns,
    {
      key: 'pendingCount',
      header: 'Đang chờ',
      render: (email: EmailResponse) => email.pendingCount,
    },
    statusColumn,
    {key: 'createdAt', header: 'Ngày tạo', render: (email: EmailResponse) => formatDate(email.createdAt)},
  ];

  const isAutoTab = activeTab === 'auto';

  return (
    <div className="d-flex flex-column gap-3">
      <AdminPageHeader
        title="Email hệ thống"
        description="Sửa nội dung email tự động và soạn email gửi cho người dùng."
      >
        {!isAutoTab && (
          <Button onClick={() => openEditor(null)}>
            <Plus size={16} className="me-1" />
            Soạn email mới
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
            {tab.label}
          </Button>
        ))}
      </div>

      {!isAutoTab && (
        <StatCardGroup>
          <StatCard label="Email đã soạn" value={manualData.totalElements} />
          <StatCard label="Đã gửi (trang này)" value={manualStats.sent} />
          <StatCard label="Lỗi (trang này)" value={manualStats.failed} />
          <StatCard label="Đang chờ (trang này)" value={manualStats.pending} />
        </StatCardGroup>
      )}

      {isAutoTab && (
        <AdminToolbar
          searchValue={keyword}
          onSearchChange={setKeyword}
          searchPlaceholder="Tìm theo tên mẫu hoặc mã..."
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
          emptyText="Chưa có mẫu email nào."
          rowActions={(email: EmailResponse) => (
            <>
              <button title="Sửa nội dung" onClick={() => openEditor(email)}>
                <Edit size={14} />
              </button>
              <button title="Nhật ký gửi" onClick={() => setLogEmailId(email.emailId)}>
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
          emptyText="Chưa có email nào được soạn."
          itemLabel="email"
          page={manualData.currentPage}
          totalPages={manualData.totalPages}
          totalElements={manualData.totalElements}
          onPageChange={setManualPage}
          rowActions={(email: EmailResponse) => (
            <>
              <button title="Sửa nội dung" onClick={() => openEditor(email)}>
                <Edit size={14} />
              </button>
              <button title="Chọn người nhận và gửi" onClick={() => setSendingEmail(email)}>
                <Send size={14} />
              </button>
              <button title="Nhật ký gửi" onClick={() => setLogEmailId(email.emailId)}>
                <History size={14} />
              </button>
              <button className="danger" title="Xóa" onClick={() => setDeletingEmail(email)}>
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
        title="Xác nhận xóa email"
        message={`Xóa "${deletingEmail?.name || deletingEmail?.subject || ''}" sẽ xóa cả nhật ký gửi của nó. Bạn có chắc không?`}
      />
    </div>
  );
}

export default EmailsManagement;
