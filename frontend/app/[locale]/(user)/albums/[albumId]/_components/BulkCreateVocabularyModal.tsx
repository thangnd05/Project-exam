'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { IoCodeSlashOutline, IoFlashOutline } from 'react-icons/io5';
import { standardizeVocabularies } from '@/app/apis/vocabularyApi';
import { toast } from 'react-toastify';
import classNames from 'classnames/bind';
import CommonFormModal from '@/app/components/modal/CommonFormModal';
import ModalActionFooter from '@/app/components/modal/ModalActionFooter';
import ButtonPrime from '@/app/components/Button/ButtonPrime';
import styles from '@/app/components/modal/CommonFormModal.module.scss';
import { useBulkCreateVocabularies } from '@/app/[locale]/(user)/albums/[albumId]/_hooks/useAlbumVocabularies';
import { getApiErrorMessage } from '@/app/utils/apiError';
import type { VocabularyRequest } from '@/app/types';

const cx = classNames.bind(styles);

type BulkCreateVocabularyModalProps = {
    show: boolean;
    onClose: () => void;
    onSuccess: () => void;
    albumId?: string;
};

const BulkCreateVocabularyModal = ({ show, onClose, onSuccess, albumId }: BulkCreateVocabularyModalProps) => {
    const t = useTranslations('Vocabulary');
    const tCommon = useTranslations('Common');
    const [aiLoading, setAiLoading] = useState(false);
    const [jsonInput, setJsonInput] = useState('');

    const bulkCreateMutation = useBulkCreateVocabularies(albumId);
    const loading = bulkCreateMutation.isPending;

    const handleStandardize = async () => {
        if (!jsonInput.trim()) {
            toast.warning(t('bulkImport.toast.rawTextRequired'));
            return;
        }

        setAiLoading(true);
        try {
            const result = await standardizeVocabularies({ rawText: jsonInput });

            const cleanedJson = (result?.data || '')
                .replace(/```json\n?|```/g, '')
                .trim();

            JSON.parse(cleanedJson);

            setJsonInput(cleanedJson);
            toast.success(t('bulkImport.toast.standardized'));
        } catch (err) {
            console.error('Lỗi chuẩn hóa AI:', err);

            let errorMsg;
            if (err instanceof SyntaxError) {
                errorMsg = t('bulkImport.toast.invalidAiData');
            } else {
                errorMsg = getApiErrorMessage(err, '')
                    || (err instanceof Error ? err.message : '')
                    || t('bulkImport.toast.aiUnavailable');
            }
            toast.error(errorMsg);
        } finally {
            setAiLoading(false);
        }
    };

    const handleSave = async (e?: React.SyntheticEvent) => {
        e?.preventDefault();

        if (!jsonInput.trim()) {
            toast.warning(t('bulkImport.toast.jsonRequired'));
            return;
        }

        let payload: unknown;
        try {
            payload = JSON.parse(jsonInput);
            if (!Array.isArray(payload)) {
                toast.error(t('bulkImport.toast.notArray'));
                return;
            }
            if (payload.length === 0) {
                toast.error(t('bulkImport.toast.emptyArray'));
                return;
            }
        } catch {
            toast.error(t('bulkImport.toast.invalidJson'));
            return;
        }

        const processedPayload = (payload as VocabularyRequest[]).map((item) => ({
            ...item,
            albumId: item.albumId || albumId,
        }));

        bulkCreateMutation.mutate(processedPayload, {
            onSuccess: () => {
                toast.success(t('bulkImport.toast.imported', { count: processedPayload.length }));
                setJsonInput('');
                onSuccess();
                onClose();
            },
            onError: (err) => {
                console.error('Lỗi khi nhập bulk:', err);
                const msg = getApiErrorMessage(
                    err,
                    t('bulkImport.toast.importError'),
                );
                toast.error(msg);
            },
        });
    };

    const exampleJson = `[
  {
    "word": "Consistency",
    "meaning": "Sự nhất quán",
    "example": "Consistency is key to success."
  },
  {
    "word": "Diligent",
    "meaning": "Cần cù, siêng năng",
    "example": "He is a diligent student."
  }
]`;

    return (
        <CommonFormModal
            show={show}
            onHide={onClose}
            title={t('bulkImport.title')}
            size="lg"
            footer={(
                <ModalActionFooter
                    cancelLabel={tCommon('cancel')}
                    submitLabel={t('bulkImport.submit')}
                    loadingLabel={tCommon('processing')}
                    loading={loading}
                    onCancel={onClose}
                    onSubmit={handleSave}
                />
            )}
        >
            <div className={cx('formGroup')}>
                <div className="d-flex justify-content-between align-items-center mb-2">
                    <label className={cx('label', 'mb-0')}>{t('bulkImport.jsonData')}</label>
                    <div className="d-flex gap-2">
                        <ButtonPrime
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={handleStandardize}
                            disabled={aiLoading || loading}
                        >
                            <IoFlashOutline className="me-1" />
                            {aiLoading ? tCommon('processing') : t('bulkImport.standardize')}
                        </ButtonPrime>
                        <ButtonPrime
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => setJsonInput(exampleJson)}
                            disabled={aiLoading || loading}
                        >
                            <IoCodeSlashOutline className="me-1" />
                            {t('bulkImport.showSample')}
                        </ButtonPrime>
                    </div>
                </div>
                <div className={cx('inputWrapper')}>
                    <textarea
                        className={cx('inputControl', 'textarea')}
                        placeholder={t('bulkImport.placeholder', { sample: '[{"word": "...", "meaning": "..."}, ...]' })}
                        value={jsonInput}
                        onChange={(e) => setJsonInput(e.target.value)}
                        disabled={loading || aiLoading}
                        rows={12}
                        style={{ fontFamily: 'monospace', fontSize: '1.3rem' }}
                    />
                </div>
                <small className="text-muted mt-2 d-block">
                    {t.rich('bulkImport.hint', {
                        strong: (chunks) => <strong>{chunks}</strong>,
                    })}
                </small>
            </div>
        </CommonFormModal>
    );
};

export default BulkCreateVocabularyModal;
