import React, { useState } from 'react';
import { Row, Col, Table, Badge, Button, Modal, Form } from 'react-bootstrap';
import classNames from 'classnames/bind';
import { motion } from 'framer-motion';
import {
    Plus,
    Search,
    Edit,
    Trash2,
    FileQuestion,
    Eye,
    Copy,
    Filter
} from 'lucide-react';

import {
    fakeQuestions,
    fakeExamParts,
    fakeUsers,
    getUserById,
    dashboardStats
} from '../data/fakeData';

import styles from './Questions.module.scss';

const cx = classNames.bind(styles);

const questionTypeLabels = {
    'MCQ': 'Trắc nghiệm',
    'FILL_BLANK': 'Điền trống',
    'ESSAY': 'Tự luận'
};

const questionTypeColors = {
    'MCQ': 'primary',
    'FILL_BLANK': 'warning',
    'ESSAY': 'info'
};

const QuestionsManagement = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [typeFilter, setTypeFilter] = useState('all');
    const [currentPage, setCurrentPage] = useState(1);
    const [showModal, setShowModal] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [selectedQuestion, setSelectedQuestion] = useState(null);
    const itemsPerPage = 10;

    // Enrich questions with related data
    const questionsWithData = fakeQuestions.map(q => ({
        ...q,
        creator: getUserById(q.created_by)
    }));

    // Filter
    const filteredQuestions = questionsWithData.filter(q => {
        const matchesSearch = q.question_text.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesType = typeFilter === 'all' || q.question_type === typeFilter;
        return matchesSearch && matchesType;
    });

    // Pagination
    const totalPages = Math.ceil(filteredQuestions.length / itemsPerPage);
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentQuestions = filteredQuestions.slice(indexOfFirstItem, indexOfLastItem);

    const handleView = (question) => {
        setSelectedQuestion(question);
        setShowModal(true);
    };

    const handleEdit = (question) => {
        setSelectedQuestion(question);
        setShowModal(true);
    };

    const handleDelete = (question) => {
        setSelectedQuestion(question);
        setShowDeleteConfirm(true);
    };

    return (
        <div className={cx('questionsPage')}>
            {/* Page Header */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className={cx('pageHeader')}
            >
                <div>
                    <h1>Quản lý Câu hỏi</h1>
                    <p>Quản lý ngân hàng câu hỏi trong hệ thống</p>
                </div>
                <div className={cx('headerActions')}>
                    <Button variant="primary" className={cx('addBtn')}>
                        <Plus size={18} />
                        Thêm câu hỏi
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
                            <FileQuestion size={20} />
                        </div>
                        <div className={cx('statInfo')}>
                            <span className={cx('statValue')}>{dashboardStats.totalQuestions}</span>
                            <span className={cx('statLabel')}>Tổng câu hỏi</span>
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
                            <FileQuestion size={20} />
                        </div>
                        <div className={cx('statInfo')}>
                            <span className={cx('statValue')}>
                                {fakeQuestions.filter(q => q.question_type === 'MCQ').length}
                            </span>
                            <span className={cx('statLabel')}>Trắc nghiệm</span>
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
                            <FileQuestion size={20} />
                        </div>
                        <div className={cx('statInfo')}>
                            <span className={cx('statValue')}>
                                {fakeQuestions.filter(q => q.question_type === 'FILL_BLANK').length}
                            </span>
                            <span className={cx('statLabel')}>Điền trống</span>
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
                        placeholder="Tìm kiếm câu hỏi..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className={cx('searchInput')}
                    />
                </div>
                <Form.Select
                    value={typeFilter}
                    onChange={(e) => setTypeFilter(e.target.value)}
                    className={cx('filterSelect')}
                >
                    <option value="all">Tất cả loại</option>
                    <option value="MCQ">Trắc nghiệm</option>
                    <option value="FILL_BLANK">Điền trống</option>
                    <option value="ESSAY">Tự luận</option>
                </Form.Select>
            </motion.div>

            {/* Table */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className={cx('tableSection')}
            >
                <div className={cx('tableWrapper')}>
                    <Table responsive className={cx('questionsTable')}>
                        <thead>
                            <tr>
                                <th>Câu hỏi</th>
                                <th>Loại</th>
                                <th>Người tạo</th>
                                <th>Ngân hàng</th>
                                <th>Thao tác</th>
                            </tr>
                        </thead>
                        <tbody>
                            {currentQuestions.map((q) => (
                                <tr key={q.question_id}>
                                    <td>
                                        <div className={cx('questionCell')}>
                                            <span className={cx('questionText')}>{q.question_text}</span>
                                        </div>
                                    </td>
                                    <td>
                                        <Badge bg={questionTypeColors[q.question_type]} className={cx('typeBadge')}>
                                            {questionTypeLabels[q.question_type]}
                                        </Badge>
                                    </td>
                                    <td>{q.creator?.full_name}</td>
                                    <td>
                                        <Badge bg={q.is_bank ? 'success' : 'secondary'}>
                                            {q.is_bank ? 'Ngân hàng' : 'Lớp học'}
                                        </Badge>
                                    </td>
                                    <td>
                                        <div className={cx('actionBtns')}>
                                            <button className={cx('actionBtn')} title="Xem" onClick={() => handleView(q)}>
                                                <Eye size={16} />
                                            </button>
                                            <button className={cx('actionBtn')} title="Sao chép">
                                                <Copy size={16} />
                                            </button>
                                            <button className={cx('actionBtn')} title="Sửa" onClick={() => handleEdit(q)}>
                                                <Edit size={16} />
                                            </button>
                                            <button className={cx('actionBtn', 'delete')} title="Xóa" onClick={() => handleDelete(q)}>
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
                        Hiển thị {indexOfFirstItem + 1}-{Math.min(indexOfLastItem, filteredQuestions.length)} trong {filteredQuestions.length} câu hỏi
                    </span>
                </div>
            </motion.div>
        </div>
    );
};

export default QuestionsManagement;
