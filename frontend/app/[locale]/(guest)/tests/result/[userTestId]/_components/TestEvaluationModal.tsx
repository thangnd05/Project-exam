'use client';

import { useState } from 'react';
import { FaStar, FaInfoCircle } from 'react-icons/fa';
import classNames from 'classnames/bind';
import { toast } from 'react-toastify';
import type { UseMutationResult } from '@tanstack/react-query';
import BaseModal from '@/app/components/modal/BaseModal';
import ModalActionFooter from '@/app/components/modal/ModalActionFooter';
import { getApiErrorMessage } from '@/app/utils/apiError';
import type { EvaluationRequest, EvaluationResponse } from '@/app/types';
import styles from '@/app/(guest)/tests/result/[userTestId]/_components/TestEvaluationModal.module.scss';

const cx = classNames.bind(styles);

const RATING_LABELS = ['Rất tệ', 'Chưa tốt', 'Bình thường', 'Tốt', 'Rất tốt'];

type TestEvaluationModalProps = {
    show: boolean;
    testTitle?: string | null;
    onDismiss: () => void;
    onAlreadyEvaluated: () => void;
    submitMutation: UseMutationResult<EvaluationResponse, unknown, Omit<EvaluationRequest, 'testId'>>;
};

const TestEvaluationModal = ({
    show,
    testTitle,
    onDismiss,
    onAlreadyEvaluated,
    submitMutation,
}: TestEvaluationModalProps) => {
    const [rating, setRating] = useState(0);
    const [content, setContent] = useState('');
    const submitting = submitMutation.isPending;

    const handleSubmit = (e?: React.SyntheticEvent) => {
        e?.preventDefault();
        if (!rating) {
            toast.warning('Vui lòng chọn số sao');
            return;
        }

        submitMutation.mutate(
            { rating, content: content.trim() || undefined },
            {
                onSuccess: () => toast.success('Cảm ơn bạn đã đánh giá đề!'),
                onError: (error) => {
                    const status = (error as { response?: { status?: number } })?.response?.status;
                    if (status === 409) {
                        onAlreadyEvaluated();
                        return;
                    }
                    toast.error(getApiErrorMessage(error, 'Gửi đánh giá thất bại. Vui lòng thử lại sau!'));
                },
            },
        );
    };

    const footer = (
        <ModalActionFooter
            onCancel={onDismiss}
            onSubmit={handleSubmit}
            loading={submitting}
            cancelLabel="Để sau"
            submitLabel="Gửi đánh giá"
            loadingLabel="Đang gửi..."
        />
    );

    return (
        <BaseModal
            show={show}
            onClose={submitting ? () => {} : onDismiss}
            title="Bạn thấy đề này thế nào?"
            maxWidth={550}
            footer={footer}
        >
            <form onSubmit={handleSubmit}>
                {testTitle && (
                    <p className="mb-3">
                        Đề: <strong>{testTitle}</strong>
                    </p>
                )}

                <div className={cx('formGroup')}>
                    <label className={cx('label')}>Mức độ hài lòng</label>
                    <div className={cx('ratingSelect')}>
                        {[...Array(5)].map((_, i) => (
                            <FaStar
                                key={i}
                                className={i < rating ? cx('starActive') : cx('starInactive')}
                                onClick={() => setRating(i + 1)}
                                aria-label={`${i + 1} sao`}
                            />
                        ))}
                        {rating > 0 && <span className={cx('ratingText')}>{RATING_LABELS[rating - 1]}</span>}
                    </div>
                </div>

                <div className={cx('formGroup')}>
                    <label className={cx('label')}>Góp ý thêm (không bắt buộc)</label>
                    <div className={cx('inputWrapper')}>
                        <textarea
                            className={cx('inputControl')}
                            rows={4}
                            maxLength={2000}
                            placeholder="Đề khó/dễ thế nào, có câu nào sai đáp án hay giải thích chưa rõ không?"
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                        ></textarea>
                    </div>
                    <div className={cx('tip')}>
                        <FaInfoCircle />
                        <span>Đánh giá chỉ được gửi tới đội ngũ quản trị để cải thiện đề, không hiển thị công khai.</span>
                    </div>
                </div>
            </form>
        </BaseModal>
    );
};

export default TestEvaluationModal;
