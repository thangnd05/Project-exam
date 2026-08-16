'use client';

import { useState } from 'react';
import { FaStar, FaInfoCircle } from 'react-icons/fa';
import classNames from 'classnames/bind';
import { useCreateEvaluation } from '../hooks/useEvaluations';
import { toast } from 'react-toastify';
import BaseModal from '@/app/components/modal/BaseModal';
import ModalActionFooter from '@/app/components/modal/ModalActionFooter';
import styles from '@/app/components/modal/PortalFormModal.module.scss';

const cx = classNames.bind(styles);

type EvaluationModalProps = {
    show: boolean;
    onClose: () => void;
    onSuccess: () => void;
};

const EvaluationModal = ({ show, onClose, onSuccess }: EvaluationModalProps) => {
    const [userRating, setUserRating] = useState(5);
    const [content, setContent] = useState('');
    const createMutation = useCreateEvaluation();
    const submitting = createMutation.isPending;

    const handleReviewSubmit = (e?: React.SyntheticEvent) => {
        e?.preventDefault();
        if (!content.trim()) {
            toast.warning('Vui lòng nhập nội dung đánh giá');
            return;
        }

        createMutation.mutate(
            {
                content: content,
                rating: userRating
            },
            {
                onSuccess: () => {
                    toast.success('Cảm ơn bạn đã gửi đánh giá!');
                    setContent('');
                    setUserRating(5);
                    onSuccess();
                    onClose();
                },
                onError: (error) => {
                    console.error('Failed to submit review:', error);
                    toast.error('Gửi đánh giá thất bại. Vui lòng thử lại sau!');
                },
            },
        );
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
            maxWidth={550}
            footer={footer}
        >
            <form onSubmit={handleReviewSubmit}>

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

                <div className={cx('formGroup')}>
                    <label className={cx('label')}>Nội dung chia sẻ</label>
                    <div className={cx('inputWrapper')}>
                        <textarea
                            className={cx('inputControl')}
                            rows={4}
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
