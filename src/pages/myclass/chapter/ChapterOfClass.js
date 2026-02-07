import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import { Container, Spinner, Alert } from 'react-bootstrap';
import classNames from 'classnames/bind';
import {
    IoBookOutline,
    IoArrowBackOutline,
    IoDocumentTextOutline,
    IoCalendarOutline,
    IoAdd
} from 'react-icons/io5';

import styles from './ChapterOfClass.module.scss';
import CreateChapterModal from '~/components/modals/CreateChapterModal';
import routes from '../../../config/Routes';

const cx = classNames.bind(styles);

const ChapterOfClass = () => {
    const { classId } = useParams();
    const navigate = useNavigate();

    const [chapters, setChapters] = useState([]);
    const [className, setClassName] = useState('');
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState('');
    const [showCreateChapter, setShowCreateChapter] = useState(false);

    const handleViewTests = (chapterId) => {
        const path = routes.classChapterTests
            .replace(':classId', classId)
            .replace(':chapterId', chapterId);

        navigate(path);
    };

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

    useEffect(() => {
        const fetchClassInfo = async () => {
            try {
                const res = await axios.get(`/api/classes/${classId}`);
                if (res.data?.className) {
                    setClassName(res.data.className);
                }
            } catch (err) {
                console.error('❌ Lỗi load class info:', err);
            }
        };

        fetchClassInfo();
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

                <div className={cx('header-hero')}>
                    <div className={cx('hero-content')}>
                        <span className={cx('hero-label')}>Danh sách nội dung học tập</span>
                        <h1>{className || 'Chương trình học tập'}</h1>
                        <div className={cx('hero-badge')}>
                            Mã lớp: {classId}
                        </div>
                    </div>

                    <button
                        className={cx('btn-create-chapter')}
                        onClick={() => setShowCreateChapter(true)}
                    >
                        <IoAdd size={24} />
                        Tạo chương mới
                    </button>
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

                                <div className={cx('chapter-info')}>
                                    <IoCalendarOutline />
                                    <span>
                                        Cập nhật: {new Date(chapter.createdAt)
                                            .toLocaleDateString('vi-VN')}
                                    </span>
                                </div>

                                {/* ✅ Chỉ 1 nút duy nhất */}
                                <button
                                    className={cx('btn-view')}
                                    onClick={() => handleViewTests(chapter.chapterId)}
                                >
                                    Bắt đầu học ngay
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </Container>

            <CreateChapterModal
                show={showCreateChapter}
                onClose={() => setShowCreateChapter(false)}
                classId={classId}
                onSuccess={() => {
                    fetchChapters();
                    setShowCreateChapter(false);
                }}
            />
        </div>
    );
};

export default ChapterOfClass;
