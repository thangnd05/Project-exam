'use client';

import { useState } from 'react';
import { FaStar } from 'react-icons/fa';
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
    const [hovered, setHovered] = useState(0);
    const [content, setContent] = useState('');
    const submitting = submitMutation.isPending;
    const shownRating = hovered || rating;

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
                {testTitle && <p className={cx('testName')}>{testTitle}</p>}

                <div className={cx('ratingBlock')}>
                    <span className={cx('ratingPrompt')}>{t('ratingPrompt')}</span>
                    <div
                        className={cx('stars')}
                        role="radiogroup"
                        aria-label={t('ratingPrompt')}
                        onMouseLeave={() => setHovered(0)}
                    >
                        {RATING_LABEL_KEYS.map((key, i) => {
                            const value = i + 1;
                            return (
                                <button
                                    key={key}
                                    type="button"
                                    role="radio"
                                    aria-checked={rating === value}
                                    aria-label={t('stars', { count: value })}
                                    className={cx('star', { active: value <= shownRating })}
                                    onClick={() => setRating(value)}
                                    onMouseEnter={() => setHovered(value)}
                                    disabled={submitting}
                                >
                                    <FaStar />
                                </button>
                            );
                        })}
                    </div>
                    <span className={cx('ratingText', { chosen: shownRating > 0 })}>
                        {shownRating > 0 ? t(`ratingLabels.${RATING_LABEL_KEYS[shownRating - 1]}`) : t('ratingHint')}
                    </span>
                </div>

                <div className={cx('formGroup')}>
                    <label htmlFor="evaluation-feedback" className={cx('label')}>
                        {t('feedbackLabel')} <span className={cx('optional')}>{t('optional')}</span>
                    </label>
                    <textarea
                        id="evaluation-feedback"
                        className={cx('textarea')}
                        rows={4}
                        maxLength={2000}
                        placeholder={t('feedbackPlaceholder')}
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        disabled={submitting}
                    ></textarea>
                    <p className={cx('tip')}>{t('privacyTip')}</p>
                </div>
            </form>
        </BaseModal>
    );
};

export default TestEvaluationModal;
