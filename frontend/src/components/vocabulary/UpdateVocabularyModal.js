import { useState, useEffect } from 'react';
import { IoPencil, IoText, IoLanguage } from 'react-icons/io5';
import axios from 'axios';
import { toast } from 'react-toastify';
import classNames from 'classnames/bind';
import CommonFormModal from '~/components/common/modal/CommonFormModal';
import ModalActionFooter from '~/components/common/modal/ModalActionFooter';
import styles from '~/components/common/modal/CommonFormModal.module.scss';

const cx = classNames.bind(styles);

const UpdateVocabularyModal = ({ show, onClose, onSuccess, vocab }) => {
    const [loading, setLoading] = useState(false);
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

    const handleChange = (e) => {
        const { name, value } = e.target;
        setEditVocab({ ...editVocab, [name]: value });
    };

    const handleUpdate = async (e) => {
        if (!editVocab.word.trim() || !editVocab.meaning.trim()) {
            toast.warning('⚠️ Vui lòng điền đầy đủ từ vựng và nghĩa!');
            return;
        }

        e.preventDefault();
        setLoading(true);
        try {
            await axios.put(
                `/api/vocabularies/${vocab.vocabId}`,
                { ...editVocab, albumId: vocab.albumId },
                { withCredentials: true }
            );
            toast.success('🚀 Cập nhật từ vựng thành công!');
            onSuccess();
            onClose();
        } catch (err) {
            console.error(' Lỗi khi cập nhật từ:', err);
            toast.error('Có lỗi xảy ra khi cập nhật từ vựng!');
        } finally {
            setLoading(false);
        }
    };

    return (
        <CommonFormModal
            show={show}
            onHide={onClose}
            title="Chỉnh Sửa Từ Vựng"
            icon={IoPencil}
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
