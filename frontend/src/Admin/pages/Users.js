import React, {useEffect, useMemo, useState} from 'react';
import {Badge, Col, Form, Row, Spinner, Table} from 'react-bootstrap';
import classNames from 'classnames/bind';
import {motion} from 'framer-motion';
import {
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  Search,
  Shield,
  Trash2,
  UserCheck,
  UserX,
} from 'lucide-react';

import {getRoles} from '../../api/roleApi';
import {deleteUser, getUsers} from '../../api/userApi';
import ConfirmDeleteModal from '../../components/modals/ConfirmDeleteModal';
import styles from './Users.module.scss';

const cx = classNames.bind(styles);

const roleColors = {
  ADMIN: 'danger',
  TEACHER: 'warning',
  USER: 'primary',
};

const ITEMS_PER_PAGE = 10;

const normalizeUser = (user) => ({
  user_id: String(user.userId ?? user.user_id),
  user_name: user.userName ?? user.user_name ?? '',
  full_name: user.fullName ?? user.full_name ?? '',
  email: user.email ?? '',
  role_id: String(user.roleId ?? user.role_id ?? ''),
  verified: Boolean(user.verified),
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

  return (
    <div className={cx('usersPage')}>
      <motion.div
        initial={{opacity: 0, y: -20}}
        animate={{opacity: 1, y: 0}}
        className={cx('pageHeader')}
      >
        <div>
          <h1>Quản lý Users</h1>
          <p>Quản lý tài khoản người dùng trong hệ thống</p>
        </div>
      </motion.div>

      <Row className={cx('statsRow')}>
        <Col lg={3} md={6}>
          <motion.div
            initial={{opacity: 0, scale: 0.9}}
            animate={{opacity: 1, scale: 1}}
            transition={{delay: 0.1}}
            className={cx('statCard')}
          >
            <div className={cx('statIcon')} style={{backgroundColor: '#3b82f6'}}>
              <Shield size={20} />
            </div>
            <div className={cx('statInfo')}>
              <span className={cx('statValue')}>{totalUsers}</span>
              <span className={cx('statLabel')}>Tổng Users</span>
            </div>
          </motion.div>
        </Col>
        <Col lg={3} md={6}>
          <motion.div
            initial={{opacity: 0, scale: 0.9}}
            animate={{opacity: 1, scale: 1}}
            transition={{delay: 0.15}}
            className={cx('statCard')}
          >
            <div className={cx('statIcon')} style={{backgroundColor: '#f59e0b'}}>
              <UserCheck size={20} />
            </div>
            <div className={cx('statInfo')}>
              <span className={cx('statValue')}>{totalTeachers}</span>
              <span className={cx('statLabel')}>Giáo viên</span>
            </div>
          </motion.div>
        </Col>
        <Col lg={3} md={6}>
          <motion.div
            initial={{opacity: 0, scale: 0.9}}
            animate={{opacity: 1, scale: 1}}
            transition={{delay: 0.2}}
            className={cx('statCard')}
          >
            <div className={cx('statIcon')} style={{backgroundColor: '#10b981'}}>
              <CheckCircle size={20} />
            </div>
            <div className={cx('statInfo')}>
              <span className={cx('statValue')}>{verifiedUsers}</span>
              <span className={cx('statLabel')}>Đã xác thực</span>
            </div>
          </motion.div>
        </Col>
        <Col lg={3} md={6}>
          <motion.div
            initial={{opacity: 0, scale: 0.9}}
            animate={{opacity: 1, scale: 1}}
            transition={{delay: 0.25}}
            className={cx('statCard')}
          >
            <div className={cx('statIcon')} style={{backgroundColor: '#ef4444'}}>
              <UserX size={20} />
            </div>
            <div className={cx('statInfo')}>
              <span className={cx('statValue')}>{totalUsers - verifiedUsers}</span>
              <span className={cx('statLabel')}>Chưa xác thực</span>
            </div>
          </motion.div>
        </Col>
      </Row>

      <motion.div
        initial={{opacity: 0, y: 20}}
        animate={{opacity: 1, y: 0}}
        transition={{delay: 0.3}}
        className={cx('filtersSection')}
      >
        <div className={cx('searchBox')}>
          <Search size={18} className={cx('searchIcon')} />
          <Form.Control
            type="text"
            placeholder="Tìm kiếm theo tên, email, username..."
            value={searchTerm}
            onChange={(event) => {
              setSearchTerm(event.target.value);
              setCurrentPage(1);
            }}
            className={cx('searchInput')}
          />
        </div>
        <Form.Select
          value={roleFilter}
          onChange={(event) => {
            setRoleFilter(event.target.value);
            setCurrentPage(1);
          }}
          className={cx('filterSelect')}
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
          className={cx('filterSelect')}
        >
          <option value="all">Tất cả trạng thái</option>
          <option value="verified">Đã xác thực</option>
          <option value="unverified">Chưa xác thực</option>
        </Form.Select>
      </motion.div>

      {errorMessage ? <p className="text-danger mb-3">{errorMessage}</p> : null}

      <motion.div
        initial={{opacity: 0, y: 20}}
        animate={{opacity: 1, y: 0}}
        transition={{delay: 0.4}}
        className={cx('tableSection')}
      >
        <div className={cx('tableWrapper')}>
          <Table responsive className={cx('usersTable')}>
            <thead>
              <tr>
                <th>Người dùng</th>
                <th>Vai trò</th>
                <th>Email</th>
                <th>Trạng thái</th>
                <th>Ngày tạo</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="text-center py-4">
                    <Spinner size="sm" className="me-2" />
                    Đang tải dữ liệu...
                  </td>
                </tr>
              ) : null}
              {!loading &&
                users.map((user) => {
                  const roleName = roleNameById[user.role_id] || 'USER';
                  return (
                    <tr key={user.user_id}>
                      <td>
                        <div className={cx('userCell')}>
                          <div className={cx('userAvatar')}>
                            {(user.full_name || '?').charAt(0)}
                          </div>
                          <div className={cx('userInfo')}>
                            <span className={cx('userName')}>{user.full_name}</span>
                            <span className={cx('userUsername')}>@{user.user_name}</span>
                          </div>
                        </div>
                      </td>
                      <td>
                        <Badge
                          bg={roleColors[roleName] || 'secondary'}
                          className={cx('roleBadge')}
                        >
                          {roleName}
                        </Badge>
                      </td>
                      <td>{user.email}</td>
                      <td>
                        <Badge
                          bg={user.verified ? 'success' : 'warning'}
                          className={cx('statusBadge')}
                        >
                          {user.verified ? 'Đã xác thực' : 'Chưa xác thực'}
                        </Badge>
                      </td>
                      <td>
                        {user.created_at
                          ? new Date(user.created_at).toLocaleDateString('vi-VN')
                          : '-'}
                      </td>
                      <td>
                        <div className={cx('actionBtns')}>
                          <button
                            className={cx('actionBtn', 'delete')}
                            title="Xóa"
                            onClick={() => setUserToDelete(user)}
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              {!loading && users.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-4">
                    Không có dữ liệu.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </Table>
        </div>

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
      </motion.div>

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
