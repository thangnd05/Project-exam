'use client';

import {useMemo, useState} from 'react';
import {Button, Form} from 'react-bootstrap';
import {Coins, Edit, Plus, Trash2} from 'lucide-react';

import BaseModal from '@/app/components/modal/BaseModal';
import ModalActionFooter from '@/app/components/modal/ModalActionFooter';

import ConfirmDeleteModal from '@/app/components/modal/ConfirmDeleteModal';
import {
  AdminFieldError,
  AdminPageHeader,
  AdminTable,
  AdminToolbar,
} from '@/app/components/admin/common';
import { useAdminCoins, useCoinUserOptions } from '@/app/features/admin/gamification/hooks/useAdminCoins';

const defaultFormState = {
  userId: '',
  balance: 0,
};

function CoinsManagementPage() {
  const [keyword, setKeyword] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingWallet, setEditingWallet] = useState(null);
  const [formState, setFormState] = useState(defaultFormState);
  const [errorMessage, setErrorMessage] = useState('');
  const [deletingWallet, setDeletingWallet] = useState(null);
  const [loadUserOptions, setLoadUserOptions] = useState(false);

  const {
    wallets,
    isLoading: loading,
    isError,
    createMutation,
    updateMutation,
    deleteMutation,
  } = useAdminCoins();

  const { userOptions } = useCoinUserOptions({
    enabled: loadUserOptions,
    wallets,
  });

  const submitting =
    createMutation.isPending || updateMutation.isPending || deleteMutation.isPending;

  const filteredWallets = useMemo(() => {
    const normalized = keyword.trim().toLowerCase();
    if (!normalized) {
      return wallets;
    }
    return wallets.filter((wallet) => {
      return (
        (wallet.userName || '').toLowerCase().includes(normalized) ||
        (wallet.fullName || '').toLowerCase().includes(normalized) ||
        (wallet.email || '').toLowerCase().includes(normalized)
      );
    });
  }, [wallets, keyword]);

  const resetForm = () => {
    setFormState(defaultFormState);
    setEditingWallet(null);
    setErrorMessage('');
  };

  const openCreateModal = () => {
    resetForm();
    setShowModal(true);
    setLoadUserOptions(true);
  };

  const openEditModal = (wallet) => {
    setEditingWallet(wallet);
    setFormState({userId: wallet.userId, balance: wallet.balance ?? 0});
    setErrorMessage('');
    setShowModal(true);
  };

  const handleSubmit = () => {
    const balanceNumber = Number(formState.balance);
    if (Number.isNaN(balanceNumber) || balanceNumber < 0) {
      setErrorMessage('Số xu phải là số không âm.');
      return;
    }
    if (!editingWallet && !formState.userId) {
      setErrorMessage('Vui lòng chọn người dùng.');
      return;
    }

    setErrorMessage('');
    const onSuccess = () => {
      setShowModal(false);
      resetForm();
    };
    const onError = (error) =>
      setErrorMessage(
        error?.response?.data?.message || 'Không thể lưu ví xu. Vui lòng thử lại.',
      );

    if (editingWallet) {
      updateMutation.mutate(
        {userId: editingWallet.userId, balance: balanceNumber},
        {onSuccess, onError},
      );
    } else {
      createMutation.mutate(
        {userId: formState.userId, balance: balanceNumber},
        {onSuccess, onError},
      );
    }
  };

  const handleDelete = () => {
    if (!deletingWallet) {
      return;
    }
    setErrorMessage('');
    deleteMutation.mutate(deletingWallet.userId, {
      onSuccess: () => setDeletingWallet(null),
      onError: () => setErrorMessage('Không thể xóa ví xu.'),
    });
  };

  const columns = [
    {
      key: 'user',
      header: 'Người dùng',
      render: (wallet) => (
        <div className="d-flex flex-column">
          <span className="fw-semibold">{wallet.userName || '-'}</span>
          {wallet.fullName && <span className="text-muted small">{wallet.fullName}</span>}
        </div>
      ),
    },
    {key: 'email', header: 'Email', render: (wallet) => wallet.email || '-'},
    {
      key: 'balance',
      header: 'Số xu',
      render: (wallet) => (
        <span className="d-inline-flex align-items-center gap-1">
          <Coins size={14} />
          {wallet.balance}
        </span>
      ),
    },
    {
      key: 'updatedAt',
      header: 'Cập nhật',
      render: (wallet) =>
        wallet.updatedAt ? new Date(wallet.updatedAt).toLocaleString('vi-VN') : '-',
    },
  ];

  return (
    <div className="d-flex flex-column gap-3">
      <AdminPageHeader
        title="Quản lý xu"
        description="Xem và điều chỉnh số xu của người dùng."
      >
        <Button onClick={openCreateModal}>
          <Plus size={16} className="me-1" />
          Thêm ví xu
        </Button>
      </AdminPageHeader>

      <AdminToolbar
        searchValue={keyword}
        onSearchChange={setKeyword}
        searchPlaceholder="Tìm theo tên đăng nhập, họ tên hoặc email..."
      />
      {!showModal && (
        <AdminFieldError
          message={
            errorMessage || (isError ? 'Không thể tải danh sách ví xu.' : '')
          }
        />
      )}

      <AdminTable
        showIndex
        paginated
        itemLabel="ví"
        columns={columns}
        data={filteredWallets}
        loading={loading}
        getRowKey={(wallet) => wallet.userId}
        rowActions={(wallet) => (
          <>
            <button title="Sửa" onClick={() => openEditModal(wallet)}>
              <Edit size={14} />
            </button>
            <button
              className="danger"
              title="Xóa"
              onClick={() => setDeletingWallet(wallet)}
            >
              <Trash2 size={14} />
            </button>
          </>
        )}
      />

      <BaseModal
        show={showModal}
        onClose={() => {
          if (submitting) {
            return;
          }
          setShowModal(false);
          resetForm();
        }}
        title={editingWallet ? 'Cập nhật số xu' : 'Thêm ví xu'}
        maxWidth={550}
        footer={
          <ModalActionFooter
            onCancel={() => {
              if (submitting) {
                return;
              }
              setShowModal(false);
              resetForm();
            }}
            onSubmit={handleSubmit}
            cancelLabel="Hủy"
            submitLabel={editingWallet ? 'Lưu' : 'Tạo mới'}
            loading={submitting}
          />
        }
      >
        <Form.Group className="mb-3">
          <Form.Label>Người dùng</Form.Label>
          {editingWallet ? (
            <Form.Control value={editingWallet.userName || editingWallet.userId} disabled />
          ) : (
            <Form.Select
              value={formState.userId}
              onChange={(event) =>
                setFormState((previous) => ({...previous, userId: event.target.value}))
              }
            >
              <option value="">-- Chọn người dùng --</option>
              {userOptions.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.userName} {user.email ? `(${user.email})` : ''}
                </option>
              ))}
            </Form.Select>
          )}
        </Form.Group>
        <Form.Group>
          <Form.Label>Số xu</Form.Label>
          <Form.Control
            type="number"
            min={0}
            value={formState.balance}
            onChange={(event) =>
              setFormState((previous) => ({...previous, balance: event.target.value}))
            }
          />
        </Form.Group>
        <AdminFieldError message={errorMessage} />
      </BaseModal>

      <ConfirmDeleteModal
        show={Boolean(deletingWallet)}
        onClose={() => {
          if (submitting) {
            return;
          }
          setDeletingWallet(null);
        }}
        onConfirm={handleDelete}
        title="Xác nhận xóa ví xu"
        message={`Bạn có chắc muốn xóa ví xu của "${
          deletingWallet?.userName || ''
        }" không?`}
      />
    </div>
  );
}

export default CoinsManagementPage;
