import React, {useEffect, useMemo, useState} from 'react';
import {Badge, Form} from 'react-bootstrap';
import classNames from 'classnames/bind';
import {
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  Shield,
  Trash2,
  UserCheck,
  UserX,
} from 'lucide-react';

import {getRoles} from '../../api/roleApi';
import {deleteUser, getUsers} from '../../api/userApi';
import ConfirmDeleteModal from '../../components/common/modal/ConfirmDeleteModal';
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

const normalizeUser = (user) => ({
  user_id: String(user.userId ?? user.user_id ?? user.id ?? ''),
  user_name: user.userName ?? user.user_name ?? user.username ?? '',
  full_name: user.fullName ?? user.full_name ?? user.username ?? '',
  email: user.email ?? '',
  role_id: String(user.roleId ?? user.role_id ?? ''),
  verified:
    typeof user.verified === 'boolean'
      ? user.verified
      : user.isVerified ?? null,
  created_at: user.createdAt ?? user.created_at ?? null,
});

function UsersManagement() {
  const [users, setUsers] = useState([]);
  const [totalElements, setTotalElements] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [roles, setRoles] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [userToDelete, setUserToDelete] = useState(null);

  useEffect(() => {
    const loadRoles = async () => {
      try {
        const rolesData = await getRoles();
        setRoles(
          rolesData.map((role) => ({
            role_id: String(role.roleId),
            role_name: role.roleName || '',
            description: role.description || '',
          })),
        );
      } catch (error) {
        setErrorMessage('Không thể tải danh sách vai trò.');
      }
    };

    loadRoles();
  }, []);

  useEffect(() => {
    const loadUsers = async () => {
      setLoading(true);
      setErrorMessage('');
      try {
        const verifiedFilter =
          statusFilter === 'verified'
            ? true
            : statusFilter === 'unverified'
              ? false
              : undefined;

        const userPage = await getUsers({
          page: Math.max(currentPage - 1, 0),
          size: ITEMS_PER_PAGE,
          keyword: searchTerm,
          roleId: roleFilter,
          verified: verifiedFilter,
        });

        setUsers((userPage.content || []).map(normalizeUser));
        setTotalElements(userPage.totalElements || 0);
        setTotalPages(Math.max(userPage.totalPages || 1, 1));
      } catch (error) {
        setErrorMessage('Không thể tải danh sách người dùng.');
      } finally {
        setLoading(false);
      }
    };

    loadUsers();
  }, [currentPage, roleFilter, searchTerm, statusFilter]);

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
  const indexOfFirstItem = (safeCurrentPage - 1) * ITEMS_PER_PAGE;
  const indexOfLastItem = indexOfFirstItem + users.length;

  const handleDeleteUser = async () => {
    if (!userToDelete) {
      return;
    }
    setSubmitting(true);
    setErrorMessage('');
    try {
      await deleteUser(userToDelete.user_id);
      setUsers((previous) => previous.filter((user) => user.user_id !== userToDelete.user_id));
      setTotalElements((previous) => Math.max(previous - 1, 0));
      setUserToDelete(null);
    } catch (error) {
      setErrorMessage('Không thể xóa người dùng.');
    } finally {
      setSubmitting(false);
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

      <div className={cx('pagination')}>
        <span className={cx('paginationInfo')}>
          Hiển thị {totalElements === 0 ? 0 : indexOfFirstItem + 1}-
          {totalElements === 0 ? 0 : indexOfLastItem} trong {totalElements}{' '}
          người dùng
        </span>
        <div className={cx('paginationBtns')}>
          <button
            className={cx('pageBtn')}
            disabled={safeCurrentPage === 1}
            onClick={() => setCurrentPage((previous) => previous - 1)}
          >
            <ChevronLeft size={18} />
          </button>
          {[...Array(totalPages)].map((_, index) => (
            <button
              key={index + 1}
              className={cx('pageBtn', {active: safeCurrentPage === index + 1})}
              onClick={() => setCurrentPage(index + 1)}
            >
              {index + 1}
            </button>
          ))}
          <button
            className={cx('pageBtn')}
            disabled={safeCurrentPage === totalPages}
            onClick={() => setCurrentPage((previous) => previous + 1)}
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

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
