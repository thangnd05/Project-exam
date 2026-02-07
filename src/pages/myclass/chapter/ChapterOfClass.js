import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import { Container, Spinner, Alert } from 'react-bootstrap';
import classNames from 'classnames/bind';
import {
    IoBookOutline,
    IoArrowBackOutline,
    IoDocumentTextOutline,
    IoCalendarOutline
} from 'react-icons/io5';

import styles from './ChapterOfClass.module.scss';

const cx = classNames.bind(styles);

const ChapterOfClass = () => {
    const { classId } = useParams();
    const navigate = useNavigate();

    const [chapters, setChapters] = useState([]);
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState('');

    useEffect(() => {
        const fetchChapters = async () => {
            try {
                const res = await axios.get(`/api/chapters/class/${classId}`);
                setChapters(res.data || []);
            } catch (err) {
                console.error('❌ Lỗi load chapter:', err);
                setMessage('Không thể tải danh sách chương 😢');
            } finally {
                setLoading(false);
            }
        };

        fetchChapters();
    }, [classId]);

    if (loading) {
        return (
            <div className={cx('loading')}>
                <Spinner animation="border" />
                <p>Đang tải chương học...</p>
            </div>
        );
    }

    return (
        <div className={cx('wrapper')}>
            <Container className={cx('container')}>
                <button
                    className={cx('btn-back')}
                    onClick={() => navigate(-1)}
                >
                    <IoArrowBackOutline />
                    Quay lại lớp học
                </button>

                <div className={cx('header')}>
                    <div className={cx('header-icon')}>
                        <IoBookOutline size={40} />
                    </div>
                    <h2>Chương trình học tập</h2>
                    <div className={cx('class-badge')}>
                        Lớp học: {classId}
                    </div>
                </div>

                {message && (
                    <Alert variant="danger" className="text-center shadow-sm">
                        {message}
                    </Alert>
                )}

                {chapters.length === 0 ? (
                    <div className={cx('empty')}>
                        <IoDocumentTextOutline size={100} />
                        <h4>Lớp học hiện tại chưa có chương mục nào</h4>
                        <p>Vui lòng quay lại sau hoặc liên hệ giáo viên</p>
                    </div>
                ) : (
                    <div className={cx('chapter-grid')}>
                        {chapters.map((chapter, index) => (
                            <div
                                key={chapter.chapterId}
                                className={cx('chapter-card')}
                                onClick={() => {/* Navigate to lessons */ }}
                            >
                                <div className={cx('card-top')}>
                                    <div className={cx('card-icon')}>
                                        <IoBookOutline />
                                    </div>
                                    <span className={cx('index')}>
                                        {(index + 1).toString().padStart(2, '0')}
                                    </span>
                                </div>

                                <h3 className={cx('chapter-title')}>
                                    {chapter.title}
                                </h3>

                                {chapter.description && (
                                    <p className={cx('chapter-desc')}>
                                        {chapter.description}
                                    </p>
                                )}

                                <div className={cx('chapter-info')}>
                                    <IoCalendarOutline />
                                    <span>
                                        Cập nhật: {new Date(chapter.createdAt).toLocaleDateString('vi-VN')}
                                    </span>
                                </div>

                                <button className={cx('btn-view')}>
                                    Bắt đầu học ngay
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </Container>
        </div>
    );
};

export default ChapterOfClass;
