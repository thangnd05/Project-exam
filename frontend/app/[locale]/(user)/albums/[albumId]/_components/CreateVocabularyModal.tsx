'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { toast } from 'react-toastify';
import classNames from 'classnames/bind';
import CommonFormModal from '@/app/components/modal/CommonFormModal';
import ModalActionFooter from '@/app/components/modal/ModalActionFooter';
import styles from '@/app/components/modal/CommonFormModal.module.scss';
import { useCreateVocabulary } from '@/app/[locale]/(user)/albums/[albumId]/_hooks/useAlbumVocabularies';

const cx = classNames.bind(styles);

type CreateVocabularyModalProps = {
    show: boolean;
    onClose: () => void;
    onSuccess: () => void;
    albumId?: string;
};

const CreateVocabularyModal = ({ show, onClose, onSuccess, albumId }: CreateVocabularyModalProps) => {
    const t = useTranslations('Vocabulary');
    const tCommon = useTranslations('Common');
    const [newVocab, setNewVocab] = useState({
        word: '',
        meaning: '',
        example: '',
    });

    const createMutation = useCreateVocabulary(albumId);
    const loading = createMutation.isPending;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setNewVocab({ ...newVocab, [name]: value });
    };

    const handleSave = (e?: React.SyntheticEvent) => {
        if (!newVocab.word.trim() || !newVocab.meaning.trim()) {
            toast.warning(t('vocabForm.toast.required'));
            return;
        }

        e?.preventDefault();
        createMutation.mutate(
            { albumId, ...newVocab },
            {
                onSuccess: () => {
                    toast.success(t('vocabForm.toast.created'));
                    setNewVocab({ word: '', meaning: '', example: '' });
                    onSuccess();
                    onClose();
                },
                onError: (err) => {
                    console.error(' Lỗi khi thêm từ:', err);
                    toast.error(t('vocabForm.toast.createError'));
                },
            },
        );
    };

    return (
        <CommonFormModal
            show={show}
            onHide={onClose}
            title={t('vocabForm.createTitle')}
            footer={(
                <ModalActionFooter
                    cancelLabel={tCommon('cancel')}
                    submitLabel={t('vocabForm.createSubmit')}
                    loadingLabel={t('saving')}
                    loading={loading}
                    onCancel={onClose}
                    onSubmit={handleSave}
                />
            )}
        >
            <div className={cx('formGroup')}>
                <label className={cx('label')}>{t('vocabForm.word')}</label>
                <div className={cx('inputWrapper')}>
                    <input
                        type="text"
                        name="word"
                        className={cx('inputControl')}
                        placeholder={t('vocabForm.wordPlaceholder')}
                        value={newVocab.word}
                        onChange={handleChange}
                        disabled={loading}
                        autoFocus
                    />
                </div>
            </div>

            <div className={cx('formGroup')}>
                <label className={cx('label')}>{t('vocabForm.meaning')}</label>
                <div className={cx('inputWrapper')}>
                    <input
                        type="text"
                        name="meaning"
                        className={cx('inputControl')}
                        placeholder={t('vocabForm.meaningPlaceholder')}
                        value={newVocab.meaning}
                        onChange={handleChange}
                        disabled={loading}
                    />
                </div>
            </div>

            <div className={cx('formGroup')}>
                <label className={cx('label')}>{t('vocabForm.example')}</label>
                <div className={cx('inputWrapper')}>
                    <textarea
                        name="example"
                        className={cx('inputControl', 'textarea')}
                        placeholder={t('vocabForm.examplePlaceholder')}
                        value={newVocab.example}
                        onChange={handleChange}
                        disabled={loading}
                        rows={3}
                    />
                </div>
            </div>
        </CommonFormModal>
    );
};

export default CreateVocabularyModal;
