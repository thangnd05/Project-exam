'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { IoText, IoLanguage } from 'react-icons/io5';
import { toast } from 'react-toastify';
import classNames from 'classnames/bind';
import CommonFormModal from '@/app/components/modal/CommonFormModal';
import ModalActionFooter from '@/app/components/modal/ModalActionFooter';
import styles from '@/app/components/modal/CommonFormModal.module.scss';
import type { VocabularyResponse } from '@/app/types';
import { useUpdateVocabulary } from '@/app/[locale]/(user)/albums/[albumId]/_hooks/useAlbumVocabularies';

const cx = classNames.bind(styles);

type UpdateVocabularyModalProps = {
    show: boolean;
    onClose: () => void;
    onSuccess: () => void;
    vocab: VocabularyResponse | null;
};

const UpdateVocabularyModal = ({ show, onClose, onSuccess, vocab }: UpdateVocabularyModalProps) => {
    const t = useTranslations('Vocabulary');
    const tCommon = useTranslations('Common');
    const [editVocab, setEditVocab] = useState({
        word: '',
        meaning: '',
        example: '',
    });

    // Mỗi lần mở modal (hoặc đổi từ cần sửa) thì nạp lại form (điều chỉnh state ngay khi render).
    const seedKey = show ? vocab : null;
    const [seededFor, setSeededFor] = useState<VocabularyResponse | null>(null);
    if (seedKey !== seededFor) {
        setSeededFor(seedKey);
        if (seedKey) {
            setEditVocab({
                word: seedKey.word || '',
                meaning: seedKey.meaning || '',
                example: seedKey.example || '',
            });
        }
    }

    const updateMutation = useUpdateVocabulary({
        onSuccess: () => {
            toast.success(t('vocabForm.toast.updated'));
            onSuccess();
            onClose();
        },
        onError: (err) => {
            console.error(' Lỗi khi cập nhật từ:', err);
            toast.error(t('vocabForm.toast.updateError'));
        },
    });
    const loading = updateMutation.isPending;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setEditVocab({ ...editVocab, [name]: value });
    };

    const handleUpdate = (e?: React.SyntheticEvent) => {
        if (!editVocab.word.trim() || !editVocab.meaning.trim()) {
            toast.warning(t('vocabForm.toast.required'));
            return;
        }

        e?.preventDefault();
        updateMutation.mutate({
            vocabId: vocab!.vocabId,
            data: { ...editVocab, albumId: vocab!.albumId },
        });
    };

    return (
        <CommonFormModal
            show={show}
            onHide={onClose}
            title={t('vocabForm.editTitle')}
            footer={(
                <ModalActionFooter
                    cancelLabel={tCommon('cancel')}
                    submitLabel={t('vocabForm.saveChanges')}
                    loadingLabel={t('saving')}
                    loading={loading}
                    onCancel={onClose}
                    onSubmit={handleUpdate}
                />
            )}
        >
            <div className={cx('formGroup')}>
                <label className={cx('label')}>{t('vocabForm.word')}</label>
                <div className={cx('inputWrapper')}>
                    <span className={cx('inputIcon')}>
                        <IoText />
                    </span>
                    <input
                        type="text"
                        name="word"
                        className={cx('inputControl')}
                        placeholder={t('vocabForm.wordPlaceholder')}
                        value={editVocab.word}
                        onChange={handleChange}
                        disabled={loading}
                        autoFocus
                    />
                </div>
            </div>

            <div className={cx('formGroup')}>
                <label className={cx('label')}>{t('vocabForm.meaning')}</label>
                <div className={cx('inputWrapper')}>
                    <span className={cx('inputIcon')}>
                        <IoLanguage />
                    </span>
                    <input
                        type="text"
                        name="meaning"
                        className={cx('inputControl')}
                        placeholder={t('vocabForm.meaningPlaceholder')}
                        value={editVocab.meaning}
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
                        value={editVocab.example}
                        onChange={handleChange}
                        disabled={loading}
                        rows={3}
                    />
                </div>
            </div>
        </CommonFormModal>
    );
};

export default UpdateVocabularyModal;
