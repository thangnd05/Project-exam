'use client';

import { useMemo, useState } from 'react';
import {Badge, Button, Form} from 'react-bootstrap';
import classNames from 'classnames/bind';
import {Edit, Plus, Trash2} from 'lucide-react';

import BaseModal from '@/app/components/modal/BaseModal';
import ModalActionFooter from '@/app/components/modal/ModalActionFooter';
import ConfirmDeleteModal from '@/app/components/modal/ConfirmDeleteModal';
import useDebouncedValue from '@/app/hooks/useDebouncedValue';
import {useUsers} from '@/app/features/admin/access/hooks/useUsers';
import {
  AdminFieldError,
  AdminPageHeader,
  AdminTable,
  AdminToolbar,
  StatCard,
  StatCardGroup,
} from '../components/common';
import styles from './UsersManagementPage.module.scss';

const cx = classNames.bind(styles);

const emptyCreateForm = {
  fullName: '',
  userName: '',
  email: '',
  password: '',
  roleId: '',
  verified: false,
  isPremium: false,
};

const roleColors = {
  ADMIN: 'danger',
  TEACHER: 'warning',
  USER: 'primary',
};

const ITEMS_PER_PAGE = 10;

function UsersManagementPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [deleteErrorMessage, setDeleteErrorMessage] = useState('');
  const [userToDelete, setUserToDelete] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createForm, setCreateForm] = useState(emptyCreateForm);
  const [createError, setCreateError] = useState('');
  const [editingUser, setEditingUser] = useState(null);
  const [editForm, setEditForm] = useState({
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
    (usersIsError ? 'Không thể tải danh sách người dùng.' : '') ||
    (rolesIsError ? 'Không thể tải danh sách vai trò.' : '');

  const roleNameById = useMemo(() => {
    const roleMap = {};
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

  const updateCreateField = (field) => (event) => {
    const value =
      field === 'verified' || field === 'isPremium'
        ? event.target.checked
        : event.target.value;
    setCreateForm((previous) => ({...previous, [field]: value}));
  };

  const handleCreateUser = async () => {
    const fullName = createForm.fullName.trim();
    const userName = createForm.userName.trim();
    const email = createForm.email.trim();
    if (!fullName || !userName || !email || !createForm.password) {
      setCreateError('Vui lòng nhập đủ họ tên, username, email và mật khẩu.');
      return;
    }
    setCreateError('');
    try {
      await createUserMutation.mutateAsync({
        fullName,
        userName,
        email,
        password: createForm.password,
        roleId: createForm.roleId || null,
        verified: createForm.verified,
        isPremium: createForm.isPremium,
      });
      setShowCreateModal(false);
      setCurrentPage(1);
    } catch (error) {
      setCreateError(
        error?.response?.data?.message || 'Không thể tạo người dùng.',
      );
    }
  };

  const updating = updateUserMutation.isPending;

  const openEditModal = (user) => {
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

  const updateEditField = (field) => (event) => {
    setEditForm((previous) => ({...previous, [field]: event.target.value}));
  };

  const handleUpdateUser = async () => {
    const fullName = editForm.fullName.trim();
    const userName = editForm.userName.trim();
    const email = editForm.email.trim();
    if (!fullName || !userName || !email) {
      setEditError('Vui lòng nhập đủ họ tên, username và email.');
      return;
    }
    setEditError('');
    try {
      await updateUserMutation.mutateAsync({
        userId: editingUser.user_id,
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
        error?.response?.data?.message || 'Không thể cập nhật người dùng.',
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
    } catch (error) {
      setDeleteErrorMessage('Không thể xóa người dùng.');
    }
  };

  const columns = [
    {
      key: 'user',
      header: 'Người dùng',
      render: (user) => (
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
      header: 'Vai trò',
      render: (user) => {
        const roleName = roleNameById[user.role_id] || 'USER';
        return (
          <Badge bg={roleColors[roleName] || 'secondary'}>{roleName}</Badge>
        );
      },
    },
    {key: 'email', header: 'Email', render: (user) => user.email},
    {
      key: 'status',
      header: 'Trạng thái',
      render: (user) => (
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
            ? 'Đã xác thực'
            : user.verified === false
              ? 'Chưa xác thực'
              : 'Không có dữ liệu'}
        </Badge>
      ),
    },
    {
      key: 'premium',
      header: 'Premium',
      render: (user) =>
        user.is_premium ? (
          <span className={cx('premiumBadge')}>Premium</span>
        ) : (
          <span className={cx('premiumNone')}>—</span>
        ),
    },
    {
      key: 'created_at',
      header: 'Ngày tạo',
      render: (user) =>
        user.created_at
          ? new Date(user.created_at).toLocaleDateString('vi-VN')
          : '-',
    },
  ];

  return (
    <div className="d-flex flex-column gap-3">
      <AdminPageHeader
        title="Quản lý Users"
        description="Quản lý tài khoản người dùng trong hệ thống"
      >
        <Button onClick={openCreateModal}>
          <Plus size={16} className="me-1" />
          Thêm người dùng
        </Button>
      </AdminPageHeader>

      <StatCardGroup>
        <StatCard label="Người dùng" value={stats.total} />
        <StatCard label="Giáo viên" value={stats.teachers} />
        <StatCard label="Đã xác thực" value={stats.verified} />
        <StatCard label="Chưa xác thực" value={stats.unverified} />
      </StatCardGroup>

      <AdminToolbar
        searchValue={searchTerm}
        onSearchChange={(value) => {
          setSearchTerm(value);
          setCurrentPage(1);
        }}
        searchPlaceholder="Tìm kiếm theo tên, email, username..."
      >
        <Form.Select
          value={roleFilter}
          onChange={(event) => {
            setRoleFilter(event.target.value);
            setCurrentPage(1);
          }}
        >
          <option value="all">Tất cả vai trò</option>
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
          <option value="all">Tất cả trạng thái</option>
          <option value="verified">Đã xác thực</option>
          <option value="unverified">Chưa xác thực</option>
        </Form.Select>
      </AdminToolbar>

      <AdminFieldError message={errorMessage} />

      <AdminTable
        showIndex
        columns={columns}
        data={users}
        loading={loading}
        getRowKey={(user) => user.user_id}
        page={safeCurrentPage - 1}
        totalPages={totalPages}
        totalElements={totalElements}
        pageSize={ITEMS_PER_PAGE}
        itemLabel="người dùng"
        onPageChange={(p) => setCurrentPage(p + 1)}
        rowActions={(user) => (
          <>
            <button title="Sửa" onClick={() => openEditModal(user)}>
              <Edit size={16} />
            </button>
            <button
              className="danger"
              title="Xóa"
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
        title="Thêm người dùng"
        maxWidth={550}
        footer={
          <ModalActionFooter
            onCancel={closeCreateModal}
            onSubmit={handleCreateUser}
            cancelLabel="Hủy"
            submitLabel="Tạo mới"
            loading={creating}
          />
        }
      >
        <AdminFieldError message={createError} />
        <Form.Group className="mb-3">
          <Form.Label>Họ và tên</Form.Label>
          <Form.Control
            value={createForm.fullName}
            onChange={updateCreateField('fullName')}
            placeholder="Nguyễn Văn A"
          />
        </Form.Group>
        <Form.Group className="mb-3">
          <Form.Label>Username</Form.Label>
          <Form.Control
            value={createForm.userName}
            onChange={updateCreateField('userName')}
            placeholder="nguyenvana"
          />
        </Form.Group>
        <Form.Group className="mb-3">
          <Form.Label>Email</Form.Label>
          <Form.Control
            type="email"
            value={createForm.email}
            onChange={updateCreateField('email')}
            placeholder="email@example.com"
          />
        </Form.Group>
        <Form.Group className="mb-3">
          <Form.Label>Mật khẩu</Form.Label>
          <Form.Control
            type="password"
            value={createForm.password}
            onChange={updateCreateField('password')}
            placeholder="Tối thiểu 6 ký tự"
          />
        </Form.Group>
        <Form.Group className="mb-3">
          <Form.Label>Vai trò</Form.Label>
          <Form.Select
            value={createForm.roleId}
            onChange={updateCreateField('roleId')}
          >
            <option value="">-- Mặc định (USER) --</option>
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
          label="Đánh dấu đã xác thực"
          checked={createForm.verified}
          onChange={updateCreateField('verified')}
        />
        <Form.Check
          type="switch"
          id="create-user-premium"
          label="Tài khoản Premium"
          checked={createForm.isPremium}
          onChange={updateCreateField('isPremium')}
        />
      </BaseModal>

      <BaseModal
        show={Boolean(editingUser)}
        onClose={closeEditModal}
        title="Sửa người dùng"
        maxWidth={550}
        footer={
          <ModalActionFooter
            onCancel={closeEditModal}
            onSubmit={handleUpdateUser}
            cancelLabel="Hủy"
            submitLabel="Lưu"
            loading={updating}
          />
        }
      >
        <AdminFieldError message={editError} />
        <Form.Group className="mb-3">
          <Form.Label>Họ và tên</Form.Label>
          <Form.Control
            value={editForm.fullName}
            onChange={updateEditField('fullName')}
          />
        </Form.Group>
        <Form.Group className="mb-3">
          <Form.Label>Username</Form.Label>
          <Form.Control
            value={editForm.userName}
            onChange={updateEditField('userName')}
          />
        </Form.Group>
        <Form.Group className="mb-3">
          <Form.Label>Email</Form.Label>
          <Form.Control
            type="email"
            value={editForm.email}
            onChange={updateEditField('email')}
          />
        </Form.Group>
        <Form.Check
          type="switch"
          id="edit-user-verified"
          label="Đã xác thực"
          checked={editForm.verified}
          onChange={(event) =>
            setEditForm((previous) => ({...previous, verified: event.target.checked}))
          }
        />
        <Form.Check
          type="switch"
          id="edit-user-premium"
          label="Tài khoản Premium"
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
        title="Xác nhận xóa người dùng"
        message={`Bạn có chắc muốn xóa "${userToDelete?.full_name || ''}" không?`}
      />
    </div>
  );
}

export default UsersManagementPage;
