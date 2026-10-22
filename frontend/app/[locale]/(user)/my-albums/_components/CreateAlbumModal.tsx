'use client';

import { useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from 'react-toastify';
import classNames from "classnames/bind";
import { FaEdit, FaInfoCircle } from "react-icons/fa";
import CommonFormModal from "@/app/components/modal/CommonFormModal";
import ModalActionFooter from "@/app/components/modal/ModalActionFooter";
import styles from "@/app/components/modal/CommonFormModal.module.scss";
import { useCreateAlbum } from '@/app/[locale]/(user)/my-albums/_hooks/useAlbums';
import { getApiErrorMessage } from '@/app/utils/apiError';

const cx = classNames.bind(styles);

type CreateAlbumModalProps = {
    show: boolean;
    onClose: () => void;
    onSuccess?: () => void;
};

function CreateAlbumModal({ show, onClose, onSuccess }: CreateAlbumModalProps) {
    const t = useTranslations('Vocabulary');
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");

    const createMutation = useCreateAlbum();
    const loading = createMutation.isPending;

    const handleCreate = () => {
        if (!name.trim()) {
            toast.warning(t('albumForm.toast.nameRequired'));
            return;
        }

        const payload = {
            name: name,
            description: description
        };

        createMutation.mutate(payload, {
            onSuccess: () => {
                toast.success(t('albumForm.toast.created'));

                setName("");
                setDescription("");
                onClose();

                if (onSuccess) onSuccess();
            },
            onError: (err) => {
                console.error(err);
                toast.error(getApiErrorMessage(err, t('albumForm.toast.createError')));
            },
        });
    };

    return (
        <CommonFormModal
            show={show}
            onHide={onClose}
            title={t('albumForm.createTitle')}
            footer={(
                <ModalActionFooter
                    cancelLabel={t('albumForm.later')}
                    submitLabel={t('albumForm.createSubmit')}
                    loadingLabel={t('albumForm.creating')}
                    loading={loading}
                    onCancel={onClose}
                    onSubmit={handleCreate}
                />
            )}
        >
            <div className={cx("formGroup")}>
                <label className={cx("label")}>{t('albumForm.name')}</label>
                <div className={cx("inputWrapper")}>
                    <span className={cx("inputIcon")}>
                        <FaEdit />
                    </span>
                    <input
                        type="text"
                        className={cx("inputControl")}
                        placeholder={t('albumForm.namePlaceholder')}
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        disabled={loading}
                        autoFocus
                    />
                </div>
            </div>

            <div className={cx("formGroup")}>
                <label className={cx("label")}>{t('albumForm.description')}</label>
                <div className={cx("inputWrapper")}>
                    <textarea
                        className={cx("inputControl", "textarea")}
                        placeholder={t('albumForm.descriptionPlaceholder')}
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        disabled={loading}
                        rows={3}
                    />
                </div>
                <div className={cx("tip")}>
                    <FaInfoCircle />
                    <span>{t('albumForm.descriptionTip')}</span>
                </div>
            </div>
        </CommonFormModal>
    );
}

export default CreateAlbumModal;
