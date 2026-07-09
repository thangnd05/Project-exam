import React, {useMemo, useState} from 'react';
import {Badge, Form} from 'react-bootstrap';
import classNames from 'classnames/bind';
import {CheckCircle, Shield, Trash2, UserCheck, UserX} from 'lucide-react';

import ConfirmDeleteModal from '~/shared/ui/modal/ConfirmDeleteModal';
import {useUsers} from './hooks/useUsers';
import {
  AdminFieldError,
  AdminPageHeader,
  AdminTable,
  AdminToolbar,
  StatCard,
  StatCardGroup,
} from '../components/common';
import styles from './Users.module.scss';

const cx = classNames.bind(styles);

const roleColors = {
  ADMIN: 'danger',
  TEACHER: 'warning',
  USER: 'primary',
};

const ITEMS_PER_PAGE = 10;

function UsersManagement() {
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [deleteErrorMessage, setDeleteErrorMessage] = useState('');
  const [userToDelete, setUserToDelete] = useState(null);

  const verifiedFilter =
    statusFilter === 'verified'
      ? true
      : statusFilter === 'unverified'
        ? false
        : undefined;

  const {
    users,
    totalElements,
    totalPages,
    roles,
    isLoading: loading,
    usersIsError,
    rolesIsError,
    deleteUserMutation,
  } = useUsers({
    page: currentPage,
    size: ITEMS_PER_PAGE,
    keyword: searchTerm,
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

  const totalUsers = totalElements;
  const totalTeachers = users.filter(
    (user) => roleNameById[user.role_id] === 'TEACHER',
  ).length;
  const verifiedUsers = users.filter((user) => user.verified === true).length;
  const safeCurrentPage = Math.min(currentPage, totalPages);

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
          <div className={cx('userAvatar')}>
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
      />

      <StatCardGroup>
        <StatCard label="Tổng Users" value={totalUsers} icon={Shield} tone="blue" />
        <StatCard
          label="Giáo viên"
          value={totalTeachers}
          icon={UserCheck}
          tone="amber"
        />
        <StatCard
          label="Đã xác thực"
          value={verifiedUsers}
          icon={CheckCircle}
          tone="green"
        />
        <StatCard
          label="Chưa xác thực"
          value={totalUsers - verifiedUsers}
          icon={UserX}
          tone="red"
        />
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
          <button
            className="danger"
            title="Xóa"
            onClick={() => setUserToDelete(user)}
          >
            <Trash2 size={16} />
          </button>
        )}
      />

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

export default UsersManagement;
