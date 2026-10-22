'use client';

import { useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from 'react-toastify';
import classNames from "classnames/bind";
import { FaEdit, FaInfoCircle } from "react-icons/fa";
import { IoSaveOutline } from "react-icons/io5";
import CommonFormModal from "@/app/components/modal/CommonFormModal";
import ModalActionFooter from "@/app/components/modal/ModalActionFooter";
import styles from "@/app/components/modal/CommonFormModal.module.scss";
import type { VocabularyAlbumResponse } from "@/app/types";
import { useUpdateAlbum } from "@/app/[locale]/(user)/my-albums/_hooks/useAlbums";
import { getApiErrorMessage } from "@/app/utils/apiError";

const cx = classNames.bind(styles);

type UpdateAlbumModalProps = {
    show: boolean;
    onClose: () => void;
    onSuccess?: () => void;
    album: VocabularyAlbumResponse | null;
};

function UpdateAlbumModal({ show, onClose, onSuccess, album }: UpdateAlbumModalProps) {
    const t = useTranslations('Vocabulary');
    const tCommon = useTranslations('Common');
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");

    const updateMutation = useUpdateAlbum({
        onSuccess: () => {
            toast.success(t('albumForm.toast.updated'));
            onClose();
            if (onSuccess) onSuccess();
        },
        onError: (err) => {
            console.error(err);
            toast.error(getApiErrorMessage(err, t('albumForm.toast.updateError')));
        },
    });
    const loading = updateMutation.isPending;

    // Mỗi lần mở modal (hoặc đổi album cần sửa) thì nạp lại form (điều chỉnh state ngay khi render).
    const seedKey = show ? album : null;
    const [seededFor, setSeededFor] = useState<VocabularyAlbumResponse | null>(null);
    if (seedKey !== seededFor) {
        setSeededFor(seedKey);
        if (seedKey) {
            setName(seedKey.name || "");
            setDescription(seedKey.description || "");
        }
    }

    const handleUpdate = () => {
        if (!name.trim()) {
            toast.warning(t('albumForm.toast.nameRequired'));
            return;
        }

        const payload = {
            name: name,
            description: description
        };

        updateMutation.mutate({ albumId: album!.albumId, payload });
    };

    return (
        <CommonFormModal
            show={show}
            onHide={onClose}
            title={t('albumForm.editTitle')}
            footer={(
                <ModalActionFooter
                    cancelLabel={tCommon('cancelShort')}
                    submitLabel={t('albumForm.saveChanges')}
                    loadingLabel={t('saving')}
                    loading={loading}
                    onCancel={onClose}
                    onSubmit={handleUpdate}
                    submitIcon={IoSaveOutline}
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

export default UpdateAlbumModal;
