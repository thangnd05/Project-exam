import React, { useState } from 'react';
import { Row, Col, Table, Badge, Button, Modal, Form } from 'react-bootstrap';
import classNames from 'classnames/bind';
import { motion } from 'framer-motion';
import {
    Plus,
    Search,
    Edit,
    Trash2,
    BookMarked,
    Eye,
    Volume2,
    Copy
} from 'lucide-react';

import {
    fakeVocabulary,
    fakeVocabularyAlbums,
    fakeUsers,
    getUserById,
    dashboardStats
} from '../data/fakeData';

import styles from './Vocabulary.module.scss';

const cx = classNames.bind(styles);

const VocabularyManagement = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [albumFilter, setAlbumFilter] = useState('all');
    const [currentPage, setCurrentPage] = useState(1);
    const [showModal, setShowModal] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [selectedVocab, setSelectedVocab] = useState(null);
    const itemsPerPage = 10;

    // Enrich vocabulary with related data
    const vocabWithData = fakeVocabulary.map(v => {
        const album = fakeVocabularyAlbums.find(a => a.album_id === v.album_id);
        return { ...v, album };
    });

    // Filter
    const filteredVocab = vocabWithData.filter(v => {
        const matchesSearch = v.word.toLowerCase().includes(searchTerm.toLowerCase()) ||
            v.meaning.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesAlbum = albumFilter === 'all' || v.album_id === parseInt(albumFilter);
        return matchesSearch && matchesAlbum;
    });

    // Pagination
    const totalPages = Math.ceil(filteredVocab.length / itemsPerPage);
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentVocab = filteredVocab.slice(indexOfFirstItem, indexOfLastItem);

    const handleView = (vocab) => {
        setSelectedVocab(vocab);
        setShowModal(true);
    };

    const handleEdit = (vocab) => {
        setSelectedVocab(vocab);
        setShowModal(true);
    };

    const handleDelete = (vocab) => {
        setSelectedVocab(vocab);
        setShowDeleteConfirm(true);
    };

    return (
        <div className={cx('vocabularyPage')}>
            {/* Page Header */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className={cx('pageHeader')}
            >
                <div>
                    <h1>Quản lý Từ vựng</h1>
                    <p>Quản lý từ vựng và album trong hệ thống</p>
                </div>
                <div className={cx('headerActions')}>
                    <Button variant="primary" className={cx('addBtn')}>
                        <Plus size={18} />
                        Thêm từ vựng
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
                            <BookMarked size={20} />
                        </div>
                        <div className={cx('statInfo')}>
                            <span className={cx('statValue')}>{dashboardStats.totalVocabulary}</span>
                            <span className={cx('statLabel')}>Tổng từ vựng</span>
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
                            <BookMarked size={20} />
                        </div>
                        <div className={cx('statInfo')}>
                            <span className={cx('statValue')}>{fakeVocabularyAlbums.length}</span>
                            <span className={cx('statLabel')}>Album từ vựng</span>
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
                            <BookMarked size={20} />
                        </div>
                        <div className={cx('statInfo')}>
                            <span className={cx('statValue')}>
                                {fakeVocabularyAlbums.reduce((acc, album) => {
                                    return acc + fakeVocabulary.filter(v => v.album_id === album.album_id).length;
                                }, 0)}
                            </span>
                            <span className={cx('statLabel')}>Từ đã học</span>
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
                        placeholder="Tìm kiếm từ vựng..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className={cx('searchInput')}
                    />
                </div>
                <Form.Select
                    value={albumFilter}
                    onChange={(e) => setAlbumFilter(e.target.value)}
                    className={cx('filterSelect')}
                >
                    <option value="all">Tất cả album</option>
                    {fakeVocabularyAlbums.map(album => (
                        <option key={album.album_id} value={album.album_id}>
                            {album.name}
                        </option>
                    ))}
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
                    <Table responsive className={cx('vocabTable')}>
                        <thead>
                            <tr>
                                <th>Từ vựng</th>
                                <th>Phiên âm</th>
                                <th>Nghĩa</th>
                                <th>Album</th>
                                <th>Thao tác</th>
                            </tr>
                        </thead>
                        <tbody>
                            {currentVocab.map((v) => (
                                <tr key={v.vocab_id}>
                                    <td>
                                        <div className={cx('vocabCell')}>
                                            <span className={cx('word')}>{v.word}</span>
                                            {v.voice_url && (
                                                <button className={cx('audioBtn')} title="Phát âm">
                                                    <Volume2 size={14} />
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                    <td>
                                        <span className={cx('phonetic')}>{v.phonetic}</span>
                                    </td>
                                    <td>
                                        <span className={cx('meaning')}>{v.meaning}</span>
                                    </td>
                                    <td>
                                        <Badge bg="primary" className={cx('albumBadge')}>
                                            {v.album?.name}
                                        </Badge>
                                    </td>
                                    <td>
                                        <div className={cx('actionBtns')}>
                                            <button className={cx('actionBtn')} title="Xem" onClick={() => handleView(v)}>
                                                <Eye size={16} />
                                            </button>
                                            <button className={cx('actionBtn')} title="Sao chép">
                                                <Copy size={16} />
                                            </button>
                                            <button className={cx('actionBtn')} title="Sửa" onClick={() => handleEdit(v)}>
                                                <Edit size={16} />
                                            </button>
                                            <button className={cx('actionBtn', 'delete')} title="Xóa" onClick={() => handleDelete(v)}>
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
                        Hiển thị {indexOfFirstItem + 1}-{Math.min(indexOfLastItem, filteredVocab.length)} trong {filteredVocab.length} từ vựng
                    </span>
                </div>
            </motion.div>
        </div>
    );
};

export default VocabularyManagement;
