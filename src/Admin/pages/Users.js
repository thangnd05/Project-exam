import React, { useState } from 'react';
import { Row, Col, Table, Badge, Form, Button, Modal } from 'react-bootstrap';
import classNames from 'classnames/bind';
import { motion } from 'framer-motion';
import {
    Search,
    Filter,
    Plus,
    Edit,
    Trash2,
    Eye,
    CheckCircle,
    XCircle,
    Mail,
    UserX,
    Shield,
    UserCheck,
    Download,
    ChevronLeft,
    ChevronRight
} from 'lucide-react';

import {
    fakeUsers,
    roles,
    getRoleName,
    dashboardStats
} from '../data/fakeData';

import styles from './Users.module.scss';

const cx = classNames.bind(styles);

const roleColors = {
    ADMIN: 'danger',
    TEACHER: 'warning',
    USER: 'primary'
};

const UsersManagement = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [roleFilter, setRoleFilter] = useState('all');
    const [statusFilter, setStatusFilter] = useState('all');
    const [currentPage, setCurrentPage] = useState(1);
    const [showModal, setShowModal] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [userToDelete, setUserToDelete] = useState(null);

    const itemsPerPage = 10;

    // Filter users
    const filteredUsers = fakeUsers.filter(user => {
        const matchesSearch = user.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
            user.user_name.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesRole = roleFilter === 'all' || user.role_id === parseInt(roleFilter);
        const matchesStatus = statusFilter === 'all' ||
            (statusFilter === 'verified' && user.verified === 1) ||
            (statusFilter === 'unverified' && user.verified === 0);
        return matchesSearch && matchesRole && matchesStatus;
    });

    // Pagination
    const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentUsers = filteredUsers.slice(indexOfFirstItem, indexOfLastItem);

    // Handlers
    const handleViewUser = (user) => {
        setSelectedUser(user);
        setShowModal(true);
    };

    const handleEditUser = (user) => {
        setSelectedUser(user);
        setShowModal(true);
    };

    const handleDeleteClick = (user) => {
        setUserToDelete(user);
        setShowDeleteConfirm(true);
    };

    const confirmDelete = () => {
        // In real app, would call API to delete user
        console.log('Deleting user:', userToDelete?.user_id);
        setShowDeleteConfirm(false);
        setUserToDelete(null);
    };

    const handleVerifyUser = (userId) => {
        console.log('Verify user:', userId);
    };

    return (
        <div className={cx('usersPage')}>
            {/* Page Header */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className={cx('pageHeader')}
            >
                <div>
                    <h1>Quản lý Users</h1>
                    <p>Quản lý tài khoản người dùng trong hệ thống</p>
                </div>
                <div className={cx('headerActions')}>
                    <Button variant="primary" className={cx('addBtn')}>
                        <Plus size={18} />
                        Thêm User
                    </Button>
                </div>
            </motion.div>

            {/* Stats Cards */}
            <Row className={cx('statsRow')}>
                <Col lg={3} md={6}>
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.1 }}
                        className={cx('statCard')}
                    >
                        <div className={cx('statIcon')} style={{ backgroundColor: '#3b82f6' }}>
                            <Shield size={20} />
                        </div>
                        <div className={cx('statInfo')}>
                            <span className={cx('statValue')}>{dashboardStats.totalUsers}</span>
                            <span className={cx('statLabel')}>Tổng Users</span>
                        </div>
                    </motion.div>
                </Col>
                <Col lg={3} md={6}>
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.15 }}
                        className={cx('statCard')}
                    >
                        <div className={cx('statIcon')} style={{ backgroundColor: '#f59e0b' }}>
                            <UserCheck size={20} />
                        </div>
                        <div className={cx('statInfo')}>
                            <span className={cx('statValue')}>{dashboardStats.totalTeachers}</span>
                            <span className={cx('statLabel')}>Giáo viên</span>
                        </div>
                    </motion.div>
                </Col>
                <Col lg={3} md={6}>
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.2 }}
                        className={cx('statCard')}
                    >
                        <div className={cx('statIcon')} style={{ backgroundColor: '#10b981' }}>
                            <CheckCircle size={20} />
                        </div>
                        <div className={cx('statInfo')}>
                            <span className={cx('statValue')}>{dashboardStats.verifiedUsers}</span>
                            <span className={cx('statLabel')}>Đã xác thực</span>
                        </div>
                    </motion.div>
                </Col>
                <Col lg={3} md={6}>
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.25 }}
                        className={cx('statCard')}
                    >
                        <div className={cx('statIcon')} style={{ backgroundColor: '#ef4444' }}>
                            <UserX size={20} />
                        </div>
                        <div className={cx('statInfo')}>
                            <span className={cx('statValue')}>{dashboardStats.totalUsers - dashboardStats.verifiedUsers}</span>
                            <span className={cx('statLabel')}>Chưa xác thực</span>
                        </div>
                    </motion.div>
                </Col>
            </Row>

            {/* Filters */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className={cx('filtersSection')}
            >
                <div className={cx('searchBox')}>
                    <Search size={18} className={cx('searchIcon')} />
                    <Form.Control
                        type="text"
                        placeholder="Tìm kiếm theo tên, email, username..."
                        value={searchTerm}
                        onChange={(e) => {
                            setSearchTerm(e.target.value);
                            setCurrentPage(1);
                        }}
                        className={cx('searchInput')}
                    />
                </div>
                <Form.Select
                    value={roleFilter}
                    onChange={(e) => {
                        setRoleFilter(e.target.value);
                        setCurrentPage(1);
                    }}
                    className={cx('filterSelect')}
                >
                    <option value="all">Tất cả vai trò</option>
                    {roles.map(role => (
                        <option key={role.role_id} value={role.role_id}>
                            {role.description}
                        </option>
                    ))}
                </Form.Select>
                <Form.Select
                    value={statusFilter}
                    onChange={(e) => {
                        setStatusFilter(e.target.value);
                        setCurrentPage(1);
                    }}
                    className={cx('filterSelect')}
                >
                    <option value="all">Tất cả trạng thái</option>
                    <option value="verified">Đã xác thực</option>
                    <option value="unverified">Chưa xác thực</option>
                </Form.Select>
            </motion.div>

            {/* Users Table */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
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
                            {currentUsers.map((user) => (
                                <tr key={user.user_id}>
                                    <td>
                                        <div className={cx('userCell')}>
                                            <div className={cx('userAvatar')}>
                                                {user.full_name.charAt(0)}
                                            </div>
                                            <div className={cx('userInfo')}>
                                                <span className={cx('userName')}>{user.full_name}</span>
                                                <span className={cx('userUsername')}>@{user.user_name}</span>
                                            </div>
                                        </div>
                                    </td>
                                    <td>
                                        <Badge bg={roleColors[getRoleName(user.role_id)]} className={cx('roleBadge')}>
                                            {getRoleName(user.role_id)}
                                        </Badge>
                                    </td>
                                    <td>{user.email}</td>
                                    <td>
                                        <Badge bg={user.verified ? 'success' : 'warning'} className={cx('statusBadge')}>
                                            {user.verified ? 'Đã xác thực' : 'Chưa xác thực'}
                                        </Badge>
                                    </td>
                                    <td>{new Date(user.created_at).toLocaleDateString('vi-VN')}</td>
                                    <td>
                                        <div className={cx('actionBtns')}>
                                            <button className={cx('actionBtn')} title="Xem chi tiết" onClick={() => handleViewUser(user)}>
                                                <Eye size={16} />
                                            </button>
                                            <button className={cx('actionBtn')} title="Sửa" onClick={() => handleEditUser(user)}>
                                                <Edit size={16} />
                                            </button>
                                            {!user.verified && (
                                                <button className={cx('actionBtn', 'verify')} title="Xác thực" onClick={() => handleVerifyUser(user.user_id)}>
                                                    <CheckCircle size={16} />
                                                </button>
                                            )}
                                            <button className={cx('actionBtn', 'delete')} title="Xóa" onClick={() => handleDeleteClick(user)}>
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </Table>
                </div>

                {/* Pagination */}
                <div className={cx('pagination')}>
                    <span className={cx('paginationInfo')}>
                        Hiển thị {indexOfFirstItem + 1}-{Math.min(indexOfLastItem, filteredUsers.length)} trong {filteredUsers.length} người dùng
                    </span>
                    <div className={cx('paginationBtns')}>
                        <button
                            className={cx('pageBtn')}
                            disabled={currentPage === 1}
                            onClick={() => setCurrentPage(prev => prev - 1)}
                        >
                            <ChevronLeft size={18} />
                        </button>
                        {[...Array(totalPages)].map((_, index) => (
                            <button
                                key={index + 1}
                                className={cx('pageBtn', { active: currentPage === index + 1 })}
                                onClick={() => setCurrentPage(index + 1)}
                            >
                                {index + 1}
                            </button>
                        ))}
                        <button
                            className={cx('pageBtn')}
                            disabled={currentPage === totalPages}
                            onClick={() => setCurrentPage(prev => prev + 1)}
                        >
                            <ChevronRight size={18} />
                        </button>
                    </div>
                </div>
            </motion.div>

            {/* Delete Confirmation Modal */}
            <Modal show={showDeleteConfirm} onHide={() => setShowDeleteConfirm(false)} centered>
                <Modal.Header closeButton>
                    <Modal.Title>Xác nhận xóa</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    Bạn có chắc chắn muốn xóa người dùng <strong>{userToDelete?.full_name}</strong>?
                    Hành động này không thể hoàn tác.
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowDeleteConfirm(false)}>
                        Hủy
                    </Button>
                    <Button variant="danger" onClick={confirmDelete}>
                        Xóa
                    </Button>
                </Modal.Footer>
            </Modal>
        </div>
    );
};

export default UsersManagement;
