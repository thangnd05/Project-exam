'use client';

import { useState, useEffect } from 'react';
import { IoText, IoLanguage } from 'react-icons/io5';
import { toast } from 'react-toastify';
import classNames from 'classnames/bind';
import CommonFormModal from '@/app/components/modal/CommonFormModal';
import ModalActionFooter from '@/app/components/modal/ModalActionFooter';
import styles from '@/app/components/modal/CommonFormModal.module.scss';
import type { VocabularyResponse } from '@/app/types';
import { useUpdateVocabulary } from '../_hooks/useUpdateVocabulary';

const cx = classNames.bind(styles);

type UpdateVocabularyModalProps = {
    show: boolean;
    onClose: () => void;
    onSuccess: () => void;
    vocab: VocabularyResponse | null;
};

const UpdateVocabularyModal = ({ show, onClose, onSuccess, vocab }: UpdateVocabularyModalProps) => {
    const [editVocab, setEditVocab] = useState({
        word: '',
        meaning: '',
        example: '',
    });

    useEffect(() => {
        if (vocab) {
            setEditVocab({
                word: vocab.word || '',
                meaning: vocab.meaning || '',
                example: vocab.example || '',
            });
        }
    }, [vocab, show]);

    const updateMutation = useUpdateVocabulary({
        onSuccess: () => {
            toast.success(' Cập nhật từ vựng thành công!');
            onSuccess();
            onClose();
        },
        onError: (err) => {
            console.error(' Lỗi khi cập nhật từ:', err);
            toast.error('Có lỗi xảy ra khi cập nhật từ vựng!');
        },
    });
    const loading = updateMutation.isPending;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setEditVocab({ ...editVocab, [name]: value });
    };

    // e nhận từ onClick của footer nên luôn có mặt lúc chạy; để optional cho khớp type () => void
    const handleUpdate = (e?: React.SyntheticEvent) => {
        if (!editVocab.word.trim() || !editVocab.meaning.trim()) {
            toast.warning(' Vui lòng điền đầy đủ từ vựng và nghĩa!');
            return;
        }

        e?.preventDefault();
        // vocab! an toàn: modal chỉ mở khi đã chọn từ vựng để sửa
        updateMutation.mutate({
            vocabId: vocab!.vocabId,
            data: { ...editVocab, albumId: vocab!.albumId },
        });
    };

    return (
        <CommonFormModal
            show={show}
            onHide={onClose}
            title="Chỉnh Sửa Từ Vựng"
            footer={(
                <ModalActionFooter
                    cancelLabel="Hủy bỏ"
                    submitLabel="Lưu thay đổi"
                    loadingLabel="Đang lưu..."
                    loading={loading}
                    onCancel={onClose}
                    onSubmit={handleUpdate}
                />
            )}
        >
            <div className={cx('formGroup')}>
                <label className={cx('label')}>Từ vựng (Tiếng Anh)</label>
                <div className={cx('inputWrapper')}>
                    <span className={cx('inputIcon')}>
                        <IoText />
                    </span>
                    <input
                        type="text"
                        name="word"
                        className={cx('inputControl')}
                        placeholder="Ví dụ: Excellence, Innovation..."
                        value={editVocab.word}
                        onChange={handleChange}
                        disabled={loading}
                        autoFocus
                    />
                </div>
            </div>

            <div className={cx('formGroup')}>
                <label className={cx('label')}>Nghĩa (Tiếng Việt)</label>
                <div className={cx('inputWrapper')}>
                    <span className={cx('inputIcon')}>
                        <IoLanguage />
                    </span>
                    <input
                        type="text"
                        name="meaning"
                        className={cx('inputControl')}
                        placeholder="Ví dụ: Sự xuất sắc, Đổi mới..."
                        value={editVocab.meaning}
                        onChange={handleChange}
                        disabled={loading}
                    />
                </div>
            </div>

            <div className={cx('formGroup')}>
                <label className={cx('label')}>Ví dụ minh họa</label>
                <div className={cx('inputWrapper')}>
                    <textarea
                        name="example"
                        className={cx('inputControl', 'textarea')}
                        placeholder="Nhập ví dụ giúp bạn ghi nhớ từ vựng này..."
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
