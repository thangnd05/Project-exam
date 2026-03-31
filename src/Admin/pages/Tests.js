import React, { useState } from 'react';
import { Row, Col, Table, Badge, Button, Modal, Form } from 'react-bootstrap';
import classNames from 'classnames/bind';
import { motion } from 'framer-motion';
import {
    Plus,
    Search,
    Edit,
    Trash2,
    BookOpen,
    Eye,
    Clock,
    CheckCircle,
    Users,
    FileQuestion
} from 'lucide-react';

import {
    fakeTests,
    fakeUsers,
    fakeExamTypes,
    fakeClasses,
    getUserById,
    getExamTypeById,
    getClassById,
    dashboardStats
} from '../data/fakeData';

import styles from './Tests.module.scss';

const cx = classNames.bind(styles);

const TestsManagement = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [examTypeFilter, setExamTypeFilter] = useState('all');
    const [currentPage, setCurrentPage] = useState(1);
    const [showModal, setShowModal] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [selectedTest, setSelectedTest] = useState(null);
    const itemsPerPage = 10;

    // Enrich tests with related data
    const testsWithData = fakeTests.map(test => ({
        ...test,
        creator: getUserById(test.created_by),
        examType: getExamTypeById(test.exam_type_id),
        class: test.class_id ? getClassById(test.class_id) : null
    }));

    // Filter
    const filteredTests = testsWithData.filter(test => {
        const matchesSearch = test.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            test.description?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesType = examTypeFilter === 'all' || test.exam_type_id === parseInt(examTypeFilter);
        return matchesSearch && matchesType;
    });

    // Pagination
    const totalPages = Math.ceil(filteredTests.length / itemsPerPage);
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentTests = filteredTests.slice(indexOfFirstItem, indexOfLastItem);

    const handleEdit = (test) => {
        setSelectedTest(test);
        setShowModal(true);
    };

    const handleDelete = (test) => {
        setSelectedTest(test);
        setShowDeleteConfirm(true);
    };

    return (
        <div className={cx('testsPage')}>
            {/* Page Header */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className={cx('pageHeader')}
            >
                <div>
                    <h1>Quản lý Bài thi</h1>
                    <p>Quản lý các bài thi trong hệ thống</p>
                </div>
                <div className={cx('headerActions')}>
                    <Button variant="primary" className={cx('addBtn')}>
                        <Plus size={18} />
                        Tạo bài thi
                    </Button>
                </div>
            </motion.div>

            {/* Stats */}
            <Row className={cx('statsRow')}>
                <Col lg={3} md={6}>
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.1 }}
                        className={cx('statCard')}
                    >
                        <div className={cx('statIcon')} style={{ backgroundColor: '#3b82f6' }}>
                            <BookOpen size={20} />
                        </div>
                        <div className={cx('statInfo')}>
                            <span className={cx('statValue')}>{dashboardStats.totalTests}</span>
                            <span className={cx('statLabel')}>Tổng bài thi</span>
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
                        <div className={cx('statIcon')} style={{ backgroundColor: '#10b981' }}>
                            <FileQuestion size={20} />
                        </div>
                        <div className={cx('statInfo')}>
                            <span className={cx('statValue')}>{dashboardStats.totalQuestions}</span>
                            <span className={cx('statLabel')}>Câu hỏi</span>
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
                        <div className={cx('statIcon')} style={{ backgroundColor: '#f59e0b' }}>
                            <CheckCircle size={20} />
                        </div>
                        <div className={cx('statInfo')}>
                            <span className={cx('statValue')}>{dashboardStats.completedExams}</span>
                            <span className={cx('statLabel')}>Lượt thi hoàn thành</span>
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
                        <div className={cx('statIcon')} style={{ backgroundColor: '#8b5cf6' }}>
                            <Users size={20} />
                        </div>
                        <div className={cx('statInfo')}>
                            <span className={cx('statValue')}>{dashboardStats.avgScore}</span>
                            <span className={cx('statLabel')}>Điểm TB</span>
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
                        placeholder="Tìm kiếm bài thi..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className={cx('searchInput')}
                    />
                </div>
                <Form.Select
                    value={examTypeFilter}
                    onChange={(e) => setExamTypeFilter(e.target.value)}
                    className={cx('filterSelect')}
                >
                    <option value="all">Tất cả loại thi</option>
                    {fakeExamTypes.map(type => (
                        <option key={type.exam_type_id} value={type.exam_type_id}>
                            {type.name}
                        </option>
                    ))}
                </Form.Select>
            </motion.div>

            {/* Table */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.35 }}
                className={cx('tableSection')}
            >
                <div className={cx('tableWrapper')}>
                    <Table responsive className={cx('testsTable')}>
                        <thead>
                            <tr>
                                <th>Bài thi</th>
                                <th>Loại thi</th>
                                <th>Người tạo</th>
                                <th>Thời gian</th>
                                <th>Lớp học</th>
                                <th>Ngày tạo</th>
                                <th>Thao tác</th>
                            </tr>
                        </thead>
                        <tbody>
                            {currentTests.map((test) => (
                                <tr key={test.test_id}>
                                    <td>
                                        <div className={cx('testInfo')}>
                                            <div className={cx('testAvatar')}>
                                                <BookOpen size={16} />
                                            </div>
                                            <div className={cx('testDetails')}>
                                                <span className={cx('testTitle')}>{test.title}</span>
                                                <span className={cx('testDesc')}>{test.description}</span>
                                            </div>
                                        </div>
                                    </td>
                                    <td>
                                        <Badge bg="primary" className={cx('typeBadge')}>
                                            {test.examType?.name}
                                        </Badge>
                                    </td>
                                    <td>{test.creator?.full_name}</td>
                                    <td>
                                        <span className={cx('duration')}>
                                            <Clock size={14} />
                                            {test.duration_minutes} phút
                                        </span>
                                    </td>
                                    <td>
                                        {test.class ? (
                                            <Badge bg="secondary">{test.class.class_name}</Badge>
                                        ) : (
                                            <span className={cx('noClass')}>-</span>
                                        )}
                                    </td>
                                    <td>{new Date(test.created_at).toLocaleDateString('vi-VN')}</td>
                                    <td>
                                        <div className={cx('actionBtns')}>
                                            <button className={cx('actionBtn')} title="Xem">
                                                <Eye size={16} />
                                            </button>
                                            <button className={cx('actionBtn')} title="Sửa" onClick={() => handleEdit(test)}>
                                                <Edit size={16} />
                                            </button>
                                            <button className={cx('actionBtn', 'delete')} title="Xóa" onClick={() => handleDelete(test)}>
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
                        Hiển thị {indexOfFirstItem + 1}-{Math.min(indexOfLastItem, filteredTests.length)} trong {filteredTests.length} bài thi
                    </span>
                </div>
            </motion.div>
        </div>
    );
};

export default TestsManagement;
