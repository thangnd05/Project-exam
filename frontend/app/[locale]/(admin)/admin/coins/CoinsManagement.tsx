'use client';

import {useMemo, useState} from 'react';
import {Form} from 'react-bootstrap';
import ButtonPrime from '@/app/components/Button/ButtonPrime';
import {Coins, Edit, Plus, Trash2} from 'lucide-react';
import {useTranslations} from 'next-intl';

import BaseModal from '@/app/components/modal/BaseModal';
import ModalActionFooter from '@/app/components/modal/ModalActionFooter';

import ConfirmDeleteModal from '@/app/components/modal/ConfirmDeleteModal';
import {
  AdminFieldError,
  AdminPageHeader,
  AdminTable,
  AdminToolbar,
} from '@/app/[locale]/(admin)/_components/common';
import type {AdminTableColumn} from '@/app/[locale]/(admin)/_components/common/AdminTable';
import type {CoinWalletResponse} from '@/app/types';
import {getApiErrorMessage} from '@/app/utils/apiError';
import { useAdminCoins, useCoinUserOptions } from './_hooks/useAdminCoins';
import { formatDateTime } from '@/app/utils/format-date-time';

interface CoinFormState {
  userId: string;
  balance: number | string;
}

const defaultFormState: CoinFormState = {
  userId: '',
  balance: 0,
};

function CoinsManagement() {
  const t = useTranslations('AdminSystem.coins');
  const tAdmin = useTranslations('AdminCommon');
  const tCommon = useTranslations('Common');
  const [keyword, setKeyword] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingWallet, setEditingWallet] = useState<CoinWalletResponse | null>(null);
  const [formState, setFormState] = useState<CoinFormState>(defaultFormState);
  const [errorMessage, setErrorMessage] = useState('');
  const [deletingWallet, setDeletingWallet] = useState<CoinWalletResponse | null>(null);
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

  const openEditModal = (wallet: CoinWalletResponse) => {
    setEditingWallet(wallet);
    setFormState({userId: wallet.userId as string, balance: wallet.balance ?? 0});
    setErrorMessage('');
    setShowModal(true);
  };

  const handleSubmit = () => {
    const balanceNumber = Number(formState.balance);
    if (Number.isNaN(balanceNumber) || balanceNumber < 0) {
      setErrorMessage(t('errors.balanceInvalid'));
      return;
    }
    if (!editingWallet && !formState.userId) {
      setErrorMessage(t('errors.userRequired'));
      return;
    }

    setErrorMessage('');
    const onSuccess = () => {
      setShowModal(false);
      resetForm();
    };
    const onError = (error: unknown) =>
      setErrorMessage(
        getApiErrorMessage(error, t('errors.saveFailed')),
      );

    if (editingWallet) {
      updateMutation.mutate(
        {userId: editingWallet.userId as string, balance: balanceNumber},
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
    deleteMutation.mutate(deletingWallet.userId as string, {
      onSuccess: () => setDeletingWallet(null),
      onError: () => setErrorMessage(t('errors.deleteFailed')),
    });
  };

  const columns: AdminTableColumn[] = [
    {
      key: 'user',
      header: t('user'),
      render: (wallet: CoinWalletResponse) => (
        <div className="d-flex flex-column">
          <span className="fw-semibold">{wallet.userName || '-'}</span>
          {wallet.fullName && <span className="text-muted small">{wallet.fullName}</span>}
        </div>
      ),
    },
    {key: 'email', header: 'Email', render: (wallet: CoinWalletResponse) => wallet.email || '-'},
    {
      key: 'balance',
      header: t('balance'),
      render: (wallet: CoinWalletResponse) => (
        <span className="d-inline-flex align-items-center gap-1">
          <Coins size={14} />
          {wallet.balance}
        </span>
      ),
    },
    {
      key: 'updatedAt',
      header: t('updatedAt'),
      render: (wallet: CoinWalletResponse) =>
        formatDateTime(wallet.updatedAt),
    },
  ];

  return (
    <div className="d-flex flex-column gap-3">
      <AdminPageHeader
        title={t('title')}
        description={t('description')}
      >
        <ButtonPrime onClick={openCreateModal}>
          <Plus size={16} />
          {t('add')}
        </ButtonPrime>
      </AdminPageHeader>

      <AdminToolbar
        searchValue={keyword}
        onSearchChange={setKeyword}
        searchPlaceholder={t('searchPlaceholder')}
      />
      {!showModal && (
        <AdminFieldError
          message={
            errorMessage || (isError ? t('errors.loadFailed') : '')
          }
        />
      )}

      <AdminTable
        showIndex
        paginated
        itemLabel={t('itemLabel')}
        columns={columns}
        data={filteredWallets}
        loading={loading}
        getRowKey={(wallet: CoinWalletResponse) => wallet.userId as string}
        rowActions={(wallet: CoinWalletResponse) => (
          <>
            <ButtonPrime size="icon" variant="ghost" title={tAdmin('actions.edit')} onClick={() => openEditModal(wallet)}>
              <Edit size={14} />
            </ButtonPrime>
            <ButtonPrime size="icon" variant="dangerGhost"
              title={tAdmin('actions.delete')}
              onClick={() => setDeletingWallet(wallet)}
            >
              <Trash2 size={14} />
            </ButtonPrime>
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
        title={editingWallet ? t('editTitle') : t('add')}
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
            cancelLabel={tCommon('cancelShort')}
            submitLabel={editingWallet ? tCommon('save') : tAdmin('actions.create')}
            loading={submitting}
          />
        }
      >
        <Form.Group className="mb-3">
          <Form.Label>{t('user')}</Form.Label>
          {editingWallet ? (
            <Form.Control value={editingWallet.userName || editingWallet.userId} disabled />
          ) : (
            <Form.Select
              value={formState.userId}
              onChange={(event) =>
                setFormState((previous) => ({...previous, userId: event.target.value}))
              }
            >
              <option value="">{t('selectUser')}</option>
              {userOptions.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.userName} {user.email ? `(${user.email})` : ''}
                </option>
              ))}
            </Form.Select>
          )}
        </Form.Group>
        <Form.Group>
          <Form.Label>{t('balance')}</Form.Label>
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
        title={t('deleteTitle')}
        message={t('deleteMessage', {name: deletingWallet?.userName || ''})}
      />
    </div>
  );
}

export default CoinsManagement;
