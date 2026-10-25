'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import classNames from 'classnames/bind';
import { useCreateChapter } from '@/app/[locale]/(user)/class/[classId]/chapters/_hooks/useChaptersOfClass';
import { toast } from 'react-toastify';
import CommonFormModal from '@/app/components/modal/CommonFormModal';
import ModalActionFooter from '@/app/components/modal/ModalActionFooter';
import styles from '@/app/components/modal/CommonFormModal.module.scss';

const cx = classNames.bind(styles);

type CreateChapterModalProps = {
    show: boolean;
    onClose: () => void;
    classId: string;
    onSuccess?: () => void;
};

const CreateChapterModal = ({ show, onClose, classId, onSuccess }: CreateChapterModalProps) => {
    const t = useTranslations('Classes');
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const createMutation = useCreateChapter(classId);
    const submitting = createMutation.isPending;

    const handleCreate = () => {
        if (!title.trim()) {
            toast.warning(t('createChapter.titleRequired'));
            return;
        }

        createMutation.mutate(
            { classId, title, description },
            {
                onSuccess: () => {
                    toast.success(t('createChapter.success'));
                    setTitle('');
                    setDescription('');
                    onSuccess?.();
                    onClose();
                },
                onError: (error) => {
                    console.error('Failed to create chapter:', error);
                    toast.error(t('createChapter.error'));
                },
            },
        );
    };

    return (
        <CommonFormModal
            show={show}
            onHide={onClose}
            title={t('chapters.create')}
            footer={(
                <ModalActionFooter
                    cancelLabel={t('common.later')}
                    submitLabel={t('createChapter.submit')}
                    loadingLabel={t('createChapter.submitting')}
                    loading={submitting}
                    onCancel={onClose}
                    onSubmit={handleCreate}
                />
            )}
        >
            <div className={cx('formGroup')}>
                <label className={cx('label')}>{t('common.chapterName')}</label>
                <div className={cx('inputWrapper')}>
                    <input
                        type="text"
                        className={cx('inputControl')}
                        placeholder={t('createChapter.namePlaceholder')}
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        disabled={submitting}
                        autoFocus
                    />
                </div>
            </div>

            <div className={cx('formGroup')}>
                <label className={cx('label')}>{t('common.description')}</label>
                <div className={cx('inputWrapper')}>
                    <textarea
                        className={cx('inputControl', 'textarea')}
                        rows={3}
                        placeholder={t('createChapter.descriptionPlaceholder')}
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        disabled={submitting}
                    />
                </div>
                <div className={cx('tip')}>
                    <span>{t('createChapter.descriptionTip')}</span>
                </div>
            </div>
        </CommonFormModal>
    );
};

export default CreateChapterModal;
