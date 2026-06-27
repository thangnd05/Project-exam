import React, { useState } from 'react';
import { FaStar, FaPen, FaInfoCircle } from 'react-icons/fa';
import classNames from 'classnames/bind';
import { createEvaluation } from '~/api/evaluationApi';
import { toast } from 'react-toastify';
import BaseModal from '~/components/common/modal/BaseModal';
import ModalActionFooter from '~/components/common/modal/ModalActionFooter';
import styles from '~/components/common/modal/PortalFormModal.module.scss';

const cx = classNames.bind(styles);

const EvaluationModal = ({ show, onClose, onSuccess }) => {
    const [userRating, setUserRating] = useState(5);
    const [content, setContent] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const handleReviewSubmit = async (e) => {
        e.preventDefault();
        if (!content.trim()) {
            toast.warning('Vui lòng nhập nội dung đánh giá');
            return;
        }

        setSubmitting(true);
        try {
            await createEvaluation({
                content: content,
                rating: userRating
            });
            toast.success('Cảm ơn bạn đã gửi đánh giá!');
            setContent('');
            setUserRating(5);
            onSuccess(); // Refresh list or handle success
            onClose();
        } catch (error) {
            console.error('Failed to submit review:', error);
            toast.error('Gửi đánh giá thất bại. Vui lòng thử lại sau!');
        } finally {
            setSubmitting(false);
        }
    };

    const footer = (
        <ModalActionFooter
            onCancel={onClose}
            onSubmit={handleReviewSubmit}
            loading={submitting}
            cancelLabel="Để sau"
            submitLabel="Gửi đánh giá"
            loadingLabel="Đang gửi..."
        />
    );

    return (
        <BaseModal
            show={show}
            onClose={onClose}
            title="Viết đánh giá"
            icon={FaPen}
            maxWidth={550}
            footer={footer}
        >
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
        </BaseModal>
    );
};

export default EvaluationModal;
