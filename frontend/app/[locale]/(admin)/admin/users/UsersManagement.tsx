'use client';

import { useMemo, useState } from 'react';
import {useLocale, useTranslations} from 'next-intl';
import {Badge, Button, Form} from 'react-bootstrap';
import classNames from 'classnames/bind';
import {Edit, Plus, Trash2} from 'lucide-react';

import BaseModal from '@/app/components/modal/BaseModal';
import ModalActionFooter from '@/app/components/modal/ModalActionFooter';
import ConfirmDeleteModal from '@/app/components/modal/ConfirmDeleteModal';
import useDebouncedValue from '@/app/hooks/useDebouncedValue';
import {useUsers, type AdminUserRow} from './_hooks/useUsers';
import {
  AdminFieldError,
  AdminPageHeader,
  AdminTable,
  AdminToolbar,
  StatCard,
  StatCardGroup,
} from '@/app/[locale]/(admin)/_components/common';
import type {AdminTableColumn} from '@/app/[locale]/(admin)/_components/common/AdminTable';
import {getApiErrorMessage} from '@/app/utils/apiError';
import styles from './UsersManagement.module.scss';

const cx = classNames.bind(styles);

type FormFieldElement = HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;

type CreateFormState = {
  fullName: string;
  userName: string;
  email: string;
  password: string;
  roleId: string;
  verified: boolean;
  isPremium: boolean;
};

type EditFormState = {
  fullName: string;
  userName: string;
  email: string;
  verified: boolean;
  isPremium: boolean;
};

const emptyCreateForm: CreateFormState = {
  fullName: '',
  userName: '',
  email: '',
  password: '',
  roleId: '',
  verified: false,
  isPremium: false,
};

const roleColors: Record<string, string> = {
  ADMIN: 'danger',
  TEACHER: 'warning',
  USER: 'primary',
};

const ITEMS_PER_PAGE = 10;

function UsersManagement() {
  const t = useTranslations('AdminUsers');
  const tCommon = useTranslations('Common');
  const locale = useLocale();
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [deleteErrorMessage, setDeleteErrorMessage] = useState('');
  const [userToDelete, setUserToDelete] = useState<AdminUserRow | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createForm, setCreateForm] = useState<CreateFormState>(emptyCreateForm);
  const [createError, setCreateError] = useState('');
  const [editingUser, setEditingUser] = useState<AdminUserRow | null>(null);
  const [editForm, setEditForm] = useState<EditFormState>({
    fullName: '',
    userName: '',
    email: '',
    verified: false,
    isPremium: false,
  });
  const [editError, setEditError] = useState('');

  const verifiedFilter =
    statusFilter === 'verified'
      ? true
      : statusFilter === 'unverified'
        ? false
        : undefined;

  const debouncedSearchTerm = useDebouncedValue(searchTerm, 300);

  const {
    users,
    totalElements,
    totalPages,
    stats,
    roles,
    isLoading: loading,
    usersIsError,
    rolesIsError,
    createUserMutation,
    updateUserMutation,
    deleteUserMutation,
  } = useUsers({
    page: currentPage,
    size: ITEMS_PER_PAGE,
    keyword: debouncedSearchTerm,
    roleId: roleFilter,
    verified: verifiedFilter,
  });

  const submitting = deleteUserMutation.isPending;
  const errorMessage =
    deleteErrorMessage ||
    (usersIsError ? t('users.errors.loadUsers') : '') ||
    (rolesIsError ? t('users.errors.loadRoles') : '');

  const roleNameById = useMemo(() => {
    const roleMap: Record<string, string> = {};
    roles.forEach((role) => {
      roleMap[role.role_id] = role.role_name;
    });
    return roleMap;
  }, [roles]);

  const safeCurrentPage = Math.min(currentPage, totalPages);

  const creating = createUserMutation.isPending;

  const openCreateModal = () => {
    setCreateError('');
    setCreateForm(emptyCreateForm);
    setShowCreateModal(true);
  };

  const closeCreateModal = () => {
    if (creating) {
      return;
    }
    setShowCreateModal(false);
  };

  const updateCreateField = (field: keyof CreateFormState) => (event: React.ChangeEvent<FormFieldElement>) => {
    const value =
      field === 'verified' || field === 'isPremium'
        ? (event.target as HTMLInputElement).checked
        : event.target.value;
    setCreateForm((previous) => ({...previous, [field]: value}));
  };

  const handleCreateUser = async () => {
    const fullName = createForm.fullName.trim();
    const userName = createForm.userName.trim();
    const email = createForm.email.trim();
    if (!fullName || !userName || !email || !createForm.password) {
      setCreateError(t('users.errors.createRequired'));
      return;
    }
    setCreateError('');
    try {
      await createUserMutation.mutateAsync({
        fullName,
        userName,
        email,
        password: createForm.password,
        roleId: createForm.roleId || undefined,
        verified: createForm.verified,
        isPremium: createForm.isPremium,
      });
      setShowCreateModal(false);
      setCurrentPage(1);
    } catch (error) {
      setCreateError(
        getApiErrorMessage(error, t('users.errors.create')),
      );
    }
  };

  const updating = updateUserMutation.isPending;

  const openEditModal = (user: AdminUserRow) => {
    setEditError('');
    setEditForm({
      fullName: user.full_name || '',
      userName: user.user_name || '',
      email: user.email || '',
      verified: user.verified === true,
      isPremium: user.is_premium === true,
    });
    setEditingUser(user);
  };

  const closeEditModal = () => {
    if (updating) {
      return;
    }
    setEditingUser(null);
  };

  const updateEditField = (field: keyof EditFormState) => (event: React.ChangeEvent<FormFieldElement>) => {
    setEditForm((previous) => ({...previous, [field]: event.target.value}));
  };

  const handleUpdateUser = async () => {
    const fullName = editForm.fullName.trim();
    const userName = editForm.userName.trim();
    const email = editForm.email.trim();
    if (!fullName || !userName || !email) {
      setEditError(t('users.errors.editRequired'));
      return;
    }
    setEditError('');
    try {
      await updateUserMutation.mutateAsync({
        userId: editingUser!.user_id,
        values: {
          fullName,
          userName,
          email,
          verified: editForm.verified,
          isPremium: editForm.isPremium,
        },
      });
      setEditingUser(null);
    } catch (error) {
      setEditError(
        getApiErrorMessage(error, t('users.errors.update')),
      );
    }
  };

  const handleDeleteUser = async () => {
    if (!userToDelete) {
      return;
    }
    setDeleteErrorMessage('');
    try {
      await deleteUserMutation.mutateAsync(userToDelete.user_id);
      setUserToDelete(null);
    } catch {
      setDeleteErrorMessage(t('users.errors.delete'));
    }
  };

  const columns: AdminTableColumn[] = [
    {
      key: 'user',
      header: t('users.columns.user'),
      render: (user: AdminUserRow) => (
        <div className={cx('userCell')}>
          <div className={cx('userAvatar', {premium: user.is_premium})}>
            {(user.full_name || '?').charAt(0)}
          </div>
          <div className={cx('userInfo')}>
            <span className={cx('userName')}>{user.full_name}</span>
            <span className={cx('userUsername')}>@{user.user_name}</span>
          </div>
        </div>
      ),
    },
    {
      key: 'role',
      header: t('users.columns.role'),
      render: (user: AdminUserRow) => {
        const roleName = roleNameById[user.role_id] || 'USER';
        return (
          <Badge bg={roleColors[roleName] || 'secondary'}>{roleName}</Badge>
        );
      },
    },
    {key: 'email', header: t('users.columns.email'), render: (user: AdminUserRow) => user.email},
    {
      key: 'status',
      header: t('users.columns.status'),
      render: (user: AdminUserRow) => (
        <Badge
          bg={
            user.verified === true
              ? 'success'
              : user.verified === false
                ? 'warning'
                : 'secondary'
          }
        >
          {user.verified === true
            ? t('users.status.verified')
            : user.verified === false
              ? t('users.status.unverified')
              : t('users.status.unknown')}
        </Badge>
      ),
    },
    {
      key: 'premium',
      header: t('users.columns.premium'),
      render: (user: AdminUserRow) =>
        user.is_premium ? (
          <span className={cx('premiumBadge')}>Premium</span>
        ) : (
          <span className={cx('premiumNone')}>-</span>
        ),
    },
    {
      key: 'created_at',
      header: t('users.columns.createdAt'),
      render: (user: AdminUserRow) =>
        user.created_at
          ? new Date(user.created_at).toLocaleDateString(locale === 'en' ? 'en-US' : 'vi-VN')
          : '-',
    },
  ];

  return (
    <div className="d-flex flex-column gap-3">
      <AdminPageHeader
        title={t('users.title')}
        description={t('users.description')}
      >
        <Button onClick={openCreateModal}>
          <Plus size={16} className="me-1" />
          {t('users.add')}
        </Button>
      </AdminPageHeader>

      <StatCardGroup>
        <StatCard label={t('users.stats.users')} value={stats.total} />
        <StatCard label={t('users.stats.teachers')} value={stats.teachers} />
        <StatCard label={t('users.stats.verified')} value={stats.verified} />
        <StatCard label={t('users.stats.unverified')} value={stats.unverified} />
      </StatCardGroup>

      <AdminToolbar
        searchValue={searchTerm}
        onSearchChange={(value) => {
          setSearchTerm(value);
          setCurrentPage(1);
        }}
        searchPlaceholder={t('users.searchPlaceholder')}
      >
        <Form.Select
          value={roleFilter}
          onChange={(event) => {
            setRoleFilter(event.target.value);
            setCurrentPage(1);
          }}
        >
          <option value="all">{t('users.allRoles')}</option>
          {roles.map((role) => (
            <option key={role.role_id} value={role.role_id}>
              {role.description || role.role_name}
            </option>
          ))}
        </Form.Select>
        <Form.Select
          value={statusFilter}
          onChange={(event) => {
            setStatusFilter(event.target.value);
            setCurrentPage(1);
          }}
        >
          <option value="all">{t('users.allStatuses')}</option>
          <option value="verified">{t('users.status.verified')}</option>
          <option value="unverified">{t('users.status.unverified')}</option>
        </Form.Select>
      </AdminToolbar>

      <AdminFieldError message={errorMessage} />

      <AdminTable
        showIndex
        columns={columns}
        data={users}
        loading={loading}
        getRowKey={(user: AdminUserRow) => user.user_id}
        page={safeCurrentPage - 1}
        totalPages={totalPages}
        totalElements={totalElements}
        pageSize={ITEMS_PER_PAGE}
        itemLabel={t('users.itemLabel')}
        onPageChange={(p) => setCurrentPage(p + 1)}
        rowActions={(user: AdminUserRow) => (
          <>
            <button title={t('shared.edit')} onClick={() => openEditModal(user)}>
              <Edit size={16} />
            </button>
            <button
              className="danger"
              title={t('shared.delete')}
              onClick={() => setUserToDelete(user)}
            >
              <Trash2 size={16} />
            </button>
          </>
        )}
      />

      <BaseModal
        show={showCreateModal}
        onClose={closeCreateModal}
        title={t('users.form.createTitle')}
        maxWidth={550}
        footer={
          <ModalActionFooter
            onCancel={closeCreateModal}
            onSubmit={handleCreateUser}
            cancelLabel={tCommon('cancelShort')}
            submitLabel={t('shared.createNew')}
            loading={creating}
          />
        }
      >
        <AdminFieldError message={createError} />
        <Form.Group className="mb-3">
          <Form.Label>{t('users.form.fullName')}</Form.Label>
          <Form.Control
            value={createForm.fullName}
            onChange={updateCreateField('fullName')}
            placeholder={t('users.form.fullNamePlaceholder')}
          />
        </Form.Group>
        <Form.Group className="mb-3">
          <Form.Label>{t('users.form.userName')}</Form.Label>
          <Form.Control
            value={createForm.userName}
            onChange={updateCreateField('userName')}
            placeholder={t('users.form.userNamePlaceholder')}
          />
        </Form.Group>
        <Form.Group className="mb-3">
          <Form.Label>{t('users.form.email')}</Form.Label>
          <Form.Control
            type="email"
            value={createForm.email}
            onChange={updateCreateField('email')}
            placeholder="email@example.com"
          />
        </Form.Group>
        <Form.Group className="mb-3">
          <Form.Label>{t('users.form.password')}</Form.Label>
          <Form.Control
            type="password"
            value={createForm.password}
            onChange={updateCreateField('password')}
            placeholder={t('users.form.passwordPlaceholder')}
          />
        </Form.Group>
        <Form.Group className="mb-3">
          <Form.Label>{t('users.form.role')}</Form.Label>
          <Form.Select
            value={createForm.roleId}
            onChange={updateCreateField('roleId')}
          >
            <option value="">{t('users.form.defaultRole')}</option>
            {roles.map((role) => (
              <option key={role.role_id} value={role.role_id}>
                {role.description || role.role_name}
              </option>
            ))}
          </Form.Select>
        </Form.Group>
        <Form.Check
          type="switch"
          id="create-user-verified"
          label={t('users.form.markVerified')}
          checked={createForm.verified}
          onChange={updateCreateField('verified')}
        />
        <Form.Check
          type="switch"
          id="create-user-premium"
          label={t('users.form.premium')}
          checked={createForm.isPremium}
          onChange={updateCreateField('isPremium')}
        />
      </BaseModal>

      <BaseModal
        show={Boolean(editingUser)}
        onClose={closeEditModal}
        title={t('users.form.editTitle')}
        maxWidth={550}
        footer={
          <ModalActionFooter
            onCancel={closeEditModal}
            onSubmit={handleUpdateUser}
            cancelLabel={tCommon('cancelShort')}
            submitLabel={tCommon('save')}
            loading={updating}
          />
        }
      >
        <AdminFieldError message={editError} />
        <Form.Group className="mb-3">
          <Form.Label>{t('users.form.fullName')}</Form.Label>
          <Form.Control
            value={editForm.fullName}
            onChange={updateEditField('fullName')}
          />
        </Form.Group>
        <Form.Group className="mb-3">
          <Form.Label>{t('users.form.userName')}</Form.Label>
          <Form.Control
            value={editForm.userName}
            onChange={updateEditField('userName')}
          />
        </Form.Group>
        <Form.Group className="mb-3">
          <Form.Label>{t('users.form.email')}</Form.Label>
          <Form.Control
            type="email"
            value={editForm.email}
            onChange={updateEditField('email')}
          />
        </Form.Group>
        <Form.Check
          type="switch"
          id="edit-user-verified"
          label={t('users.form.verified')}
          checked={editForm.verified}
          onChange={(event) =>
            setEditForm((previous) => ({...previous, verified: event.target.checked}))
          }
        />
        <Form.Check
          type="switch"
          id="edit-user-premium"
          label={t('users.form.premium')}
          checked={editForm.isPremium}
          onChange={(event) =>
            setEditForm((previous) => ({...previous, isPremium: event.target.checked}))
          }
        />
      </BaseModal>

      <ConfirmDeleteModal
        show={Boolean(userToDelete)}
        onClose={() => {
          if (submitting) {
            return;
          }
          setUserToDelete(null);
        }}
        onConfirm={handleDeleteUser}
        title={t('users.confirmDelete.title')}
        message={t('users.confirmDelete.message', {name: userToDelete?.full_name || ''})}
      />
    </div>
  );
}

export default UsersManagement;
