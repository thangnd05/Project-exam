'use client';

import { useState } from 'react';
import { FaStar, FaInfoCircle } from 'react-icons/fa';
import classNames from 'classnames/bind';
import { useTranslations } from 'next-intl';
import { toast } from 'react-toastify';
import type { UseMutationResult } from '@tanstack/react-query';
import BaseModal from '@/app/components/modal/BaseModal';
import ModalActionFooter from '@/app/components/modal/ModalActionFooter';
import { getApiErrorMessage } from '@/app/utils/apiError';
import type { EvaluationRequest, EvaluationResponse } from '@/app/types';
import styles from '@/app/[locale]/(guest)/tests/result/[userTestId]/_components/TestEvaluationModal.module.scss';

const cx = classNames.bind(styles);

const RATING_LABEL_KEYS = ['veryBad', 'notGood', 'okay', 'good', 'veryGood'] as const;

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
    const t = useTranslations('TestTaking.evaluation');
    const [rating, setRating] = useState(0);
    const [content, setContent] = useState('');
    const submitting = submitMutation.isPending;

    const handleSubmit = (e?: React.SyntheticEvent) => {
        e?.preventDefault();
        if (!rating) {
            toast.warning(t('ratingRequired'));
            return;
        }

        submitMutation.mutate(
            { rating, content: content.trim() || undefined },
            {
                onSuccess: () => toast.success(t('thanks')),
                onError: (error) => {
                    const status = (error as { response?: { status?: number } })?.response?.status;
                    if (status === 409) {
                        onAlreadyEvaluated();
                        return;
                    }
                    toast.error(getApiErrorMessage(error, t('submitFailed')));
                },
            },
        );
    };

    const footer = (
        <ModalActionFooter
            onCancel={onDismiss}
            onSubmit={handleSubmit}
            loading={submitting}
            cancelLabel={t('later')}
            submitLabel={t('submit')}
            loadingLabel={t('submitting')}
        />
    );

    return (
        <BaseModal
            show={show}
            onClose={submitting ? () => {} : onDismiss}
            title={t('title')}
            maxWidth={550}
            footer={footer}
        >
            <form onSubmit={handleSubmit}>
                {testTitle && (
                    <p className="mb-3">
                        {t.rich('testLabel', {
                            title: testTitle,
                            strong: (chunks) => <strong>{chunks}</strong>,
                        })}
                    </p>
                )}

                <div className={cx('formGroup')}>
                    <label className={cx('label')}>{t('satisfaction')}</label>
                    <div className={cx('ratingSelect')}>
                        {[...Array(5)].map((_, i) => (
                            <FaStar
                                key={i}
                                className={i < rating ? cx('starActive') : cx('starInactive')}
                                onClick={() => setRating(i + 1)}
                                aria-label={t('stars', { count: i + 1 })}
                            />
                        ))}
                        {rating > 0 && <span className={cx('ratingText')}>{t(`ratingLabels.${RATING_LABEL_KEYS[rating - 1]}`)}</span>}
                    </div>
                </div>

                <div className={cx('formGroup')}>
                    <label className={cx('label')}>{t('feedbackLabel')}</label>
                    <div className={cx('inputWrapper')}>
                        <textarea
                            className={cx('inputControl')}
                            rows={4}
                            maxLength={2000}
                            placeholder={t('feedbackPlaceholder')}
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                        ></textarea>
                    </div>
                    <div className={cx('tip')}>
                        <FaInfoCircle />
                        <span>{t('privacyTip')}</span>
                    </div>
                </div>
            </form>
        </BaseModal>
    );
};

export default TestEvaluationModal;
