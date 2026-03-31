import React, { useState } from 'react';
import { Row, Col, Table, Badge, Button, Modal, Form } from 'react-bootstrap';
import classNames from 'classnames/bind';
import { motion } from 'framer-motion';
import {
    Plus,
    Search,
    Edit,
    Trash2,
    Users,
    BookOpen,
    Eye,
    CheckCircle,
    Clock,
    GraduationCap
} from 'lucide-react';

import {
    fakeClasses,
    fakeUsers,
    fakeClassMembers,
    getUserById,
    getClassMemberCount,
    dashboardStats
} from '../data/fakeData';

import styles from './Classes.module.scss';

const cx = classNames.bind(styles);

const ClassesManagement = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [showModal, setShowModal] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [selectedClass, setSelectedClass] = useState(null);
    const itemsPerPage = 10;

    // Get class with member count
    const classesWithStats = fakeClasses.map(cls => ({
        ...cls,
        teacher: getUserById(cls.teacher_id),
        memberCount: getClassMemberCount(cls.class_id),
        pendingCount: fakeClassMembers.filter(cm => cm.class_id === cls.class_id && cm.status === 'PENDING').length
    }));

    // Filter
    const filteredClasses = classesWithStats.filter(cls =>
        cls.class_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        cls.description?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Pagination
    const totalPages = Math.ceil(filteredClasses.length / itemsPerPage);
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentClasses = filteredClasses.slice(indexOfFirstItem, indexOfLastItem);

    const handleEdit = (cls) => {
        setSelectedClass(cls);
        setShowModal(true);
    };

    const handleDelete = (cls) => {
        setSelectedClass(cls);
        setShowDeleteConfirm(true);
    };

    return (
        <div className={cx('classesPage')}>
            {/* Page Header */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className={cx('pageHeader')}
            >
                <div>
                    <h1>Quản lý Lớp học</h1>
                    <p>Quản lý các lớp học trong hệ thống</p>
                </div>
                <div className={cx('headerActions')}>
                    <Button variant="primary" className={cx('addBtn')}>
                        <Plus size={18} />
                        Tạo lớp mới
                    </Button>
                </div>
            </motion.div>

            {/* Stats */}
            <Row className={cx('statsRow')}>
                <Col lg={4} md={6}>
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.1 }}
                        className={cx('statCard')}
                    >
                        <div className={cx('statIcon')} style={{ backgroundColor: '#3b82f6' }}>
                            <GraduationCap size={20} />
                        </div>
                        <div className={cx('statInfo')}>
                            <span className={cx('statValue')}>{dashboardStats.totalClasses}</span>
                            <span className={cx('statLabel')}>Tổng lớp học</span>
                        </div>
                    </motion.div>
                </Col>
                <Col lg={4} md={6}>
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.15 }}
                        className={cx('statCard')}
                    >
                        <div className={cx('statIcon')} style={{ backgroundColor: '#10b981' }}>
                            <Users size={20} />
                        </div>
                        <div className={cx('statInfo')}>
                            <span className={cx('statValue')}>
                                {classesWithStats.reduce((acc, cls) => acc + cls.memberCount, 0)}
                            </span>
                            <span className={cx('statLabel')}>Học sinh đã tham gia</span>
                        </div>
                    </motion.div>
                </Col>
                <Col lg={4} md={6}>
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.2 }}
                        className={cx('statCard')}
                    >
                        <div className={cx('statIcon')} style={{ backgroundColor: '#f59e0b' }}>
                            <Clock size={20} />
                        </div>
                        <div className={cx('statInfo')}>
                            <span className={cx('statValue')}>{dashboardStats.pendingMembers}</span>
                            <span className={cx('statLabel')}>Chờ duyệt</span>
                        </div>
                    </motion.div>
                </Col>
            </Row>

            {/* Filters */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25 }}
                className={cx('filtersSection')}
            >
                <div className={cx('searchBox')}>
                    <Search size={18} className={cx('searchIcon')} />
                    <Form.Control
                        type="text"
                        placeholder="Tìm kiếm lớp học..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className={cx('searchInput')}
                    />
                </div>
            </motion.div>

            {/* Table */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className={cx('tableSection')}
            >
                <div className={cx('tableWrapper')}>
                    <Table responsive className={cx('classesTable')}>
                        <thead>
                            <tr>
                                <th>Lớp học</th>
                                <th>Giáo viên</th>
                                <th>Mô tả</th>
                                <th>Học sinh</th>
                                <th>Chờ duyệt</th>
                                <th>Ngày tạo</th>
                                <th>Thao tác</th>
                            </tr>
                        </thead>
                        <tbody>
                            {currentClasses.map((cls) => (
                                <tr key={cls.class_id}>
                                    <td>
                                        <div className={cx('classInfo')}>
                                            <div className={cx('classAvatar')}>
                                                {cls.class_name.charAt(0)}
                                            </div>
                                            <span className={cx('className')}>{cls.class_name}</span>
                                        </div>
                                    </td>
                                    <td>
                                        <div className={cx('teacherInfo')}>
                                            <span>{cls.teacher?.full_name}</span>
                                        </div>
                                    </td>
                                    <td className={cx('description')}>
                                        {cls.description || '-'}
                                    </td>
                                    <td>
                                        <Badge bg="success" className={cx('memberBadge')}>
                                            <Users size={12} /> {cls.memberCount}
                                        </Badge>
                                    </td>
                                    <td>
                                        {cls.pendingCount > 0 ? (
                                            <Badge bg="warning" className={cx('pendingBadge')}>
                                                {cls.pendingCount} chờ
                                            </Badge>
                                        ) : (
                                            <span className={cx('noPending')}>-</span>
                                        )}
                                    </td>
                                    <td>{new Date(cls.created_at).toLocaleDateString('vi-VN')}</td>
                                    <td>
                                        <div className={cx('actionBtns')}>
                                            <button className={cx('actionBtn')} title="Xem">
                                                <Eye size={16} />
                                            </button>
                                            <button className={cx('actionBtn')} title="Sửa" onClick={() => handleEdit(cls)}>
                                                <Edit size={16} />
                                            </button>
                                            <button className={cx('actionBtn', 'delete')} title="Xóa" onClick={() => handleDelete(cls)}>
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
                        Hiển thị {indexOfFirstItem + 1}-{Math.min(indexOfLastItem, filteredClasses.length)} trong {filteredClasses.length} lớp học
                    </span>
                </div>
            </motion.div>
        </div>
    );
};

export default ClassesManagement;
