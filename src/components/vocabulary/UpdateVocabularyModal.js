import { useState, useEffect } from 'react';
import { Modal } from 'react-bootstrap';
import { IoPencil, IoText, IoLanguage, IoClose } from 'react-icons/io5';
import axios from 'axios';
import { toast } from 'react-toastify';
import classNames from 'classnames/bind';
import styles from './CreateVocabularyModal.module.scss'; // Reuse styles

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
            console.error('❌ Lỗi khi cập nhật từ:', err);
            toast.error('Có lỗi xảy ra khi cập nhật từ vựng!');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal
            show={show}
            onHide={onClose}
            centered
            className={cx('modalCustom')}
            contentClassName={cx('modalContent')}
        >
            {/* Custom Header */}
            <div className={cx('header')}>
                <div className={cx('titleWrapper')}>
                    <IoPencil />
                    <h3 className={cx('title')}>Chỉnh Sửa Từ Vựng</h3>
                </div>

                <button className={cx('closeBtn')} onClick={onClose}>
                    <IoClose />
                </button>
            </div>

            {/* Body */}
            <div className={cx('body')}>
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
            </div>

            {/* Footer */}
            <div className={cx('footer')}>
                <button className={cx('btnCancel')} onClick={onClose} disabled={loading}>
                    Hủy bỏ
                </button>

                <button
                    className={cx('btnSubmit')}
                    onClick={handleUpdate}
                    disabled={loading}
                >
                    {loading ? 'Đang lưu...' : 'Lưu thay đổi'}
                </button>
            </div>
        </Modal>
    );
};

export default UpdateVocabularyModal;
