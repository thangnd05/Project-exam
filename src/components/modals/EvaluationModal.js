import React, { useState } from 'react';
import ReactDOM from 'react-dom';
import { FaStar, FaPen, FaTimes, FaInfoCircle } from 'react-icons/fa';
import classNames from 'classnames/bind';
import axios from 'axios';
import styles from './EvaluationModal.module.scss';

const cx = classNames.bind(styles);

const EvaluationModal = ({ show, onClose, onSuccess }) => {
    const [userRating, setUserRating] = useState(5);
    const [content, setContent] = useState('');
    const [submitting, setSubmitting] = useState(false);

    if (!show) return null;

    const handleReviewSubmit = async (e) => {
        e.preventDefault();
        if (!content.trim()) {
            alert('Vui lòng nhập nội dung đánh giá');
            return;
        }

        setSubmitting(true);
        try {
            await axios.post('/api/evaluations', {
                content: content,
                rating: userRating
            });
            alert('Cảm ơn bạn đã gửi đánh giá!');
            setContent('');
            setUserRating(5);
            onSuccess(); // Refresh list or handle success
            onClose();
        } catch (error) {
            console.error('Failed to submit review:', error);
            alert('Gửi đánh giá thất bại. Vui lòng thử lại sau!');
        } finally {
            setSubmitting(false);
        }
    };

    return ReactDOM.createPortal(
        <div className={cx('modalOverlay')} onClick={onClose}>
            <div className={cx('modalContent')} onClick={(e) => e.stopPropagation()}>
                {/* HEADER */}
                <div className={cx('header')}>
                    <div className={cx('titleWrapper')}>
                        <FaPen />
                        <h3 className={cx('title')}>Viết đánh giá</h3>
                    </div>
                    <button className={cx('closeBtn')} onClick={onClose}>
                        <FaTimes />
                    </button>
                </div>

                {/* BODY */}
                <div className={cx('body')}>
                    <form onSubmit={handleReviewSubmit}>
                        {/* Rating Stars */}
                        <div className={cx('formGroup')}>
                            <label className={cx('label')}>Mức độ hài lòng</label>
                            <div className={cx('ratingSelect')}>
                                {[...Array(5)].map((_, i) => (
                                    <FaStar
                                        key={i}
                                        className={i < userRating ? cx('starActive') : cx('starInactive')}
                                        onClick={() => setUserRating(i + 1)}
                                    />
                                ))}
                                <span className={cx('ratingText')}>({userRating}/5 sao)</span>
                            </div>
                        </div>

                        {/* Input Content */}
                        <div className={cx('formGroup')}>
                            <label className={cx('label')}>Nội dung chia sẻ</label>
                            <div className={cx('inputWrapper')}>
                                <textarea
                                    className={cx('inputControl')}
                                    rows="4"
                                    placeholder="Bạn cảm thấy trải nghiệm ôn thi tại WinDe thế nào?"
                                    required
                                    value={content}
                                    onChange={(e) => setContent(e.target.value)}
                                ></textarea>
                            </div>
                            <div className={cx('tip')}>
                                <FaInfoCircle />
                                <span>Đánh giá của bạn sẽ được hiển thị công khai.</span>
                            </div>
                        </div>
                    </form>
                </div>

                {/* FOOTER */}
                <div className={cx('footer')}>
                    <button className={cx('btnCancel')} onClick={onClose} disabled={submitting}>
                        Hủy
                    </button>
                    <button className={cx('btnSubmit')} onClick={handleReviewSubmit} disabled={submitting}>
                        {submitting ? 'Đang gửi...' : 'Gửi đánh giá'}
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
};

export default EvaluationModal;
