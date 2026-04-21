import { useState } from 'react';
import { IoAdd, IoText, IoLanguage, IoClose } from 'react-icons/io5';
import axios from 'axios';
import { toast } from 'react-toastify';
import classNames from 'classnames/bind';
import CommonFormModal from '~/components/common/modal/CommonFormModal';
import ModalActionFooter from '~/components/common/modal/ModalActionFooter';
import styles from '~/components/common/modal/CommonFormModal.module.scss';

const cx = classNames.bind(styles);

const CreateVocabularyModal = ({ show, onClose, onSuccess, albumId }) => {
    const [loading, setLoading] = useState(false);
    const [newVocab, setNewVocab] = useState({
        word: '',
        meaning: '',
        example: '',
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setNewVocab({ ...newVocab, [name]: value });
    };

    const handleSave = async (e) => {
        if (!newVocab.word.trim() || !newVocab.meaning.trim()) {
            toast.warning('⚠️ Vui lòng điền đầy đủ từ vựng và nghĩa!');
            return;
        }

        e.preventDefault();
        setLoading(true);
        try {
            await axios.post(
                '/api/vocabularies',
                { albumId, ...newVocab },
                { withCredentials: true }
            );
            toast.success('🚀 Thêm từ vựng thành công!');
            setNewVocab({ word: '', meaning: '', example: '' });
            onSuccess();
            onClose();
        } catch (err) {
            console.error('❌ Lỗi khi thêm từ:', err);
            toast.error('Có lỗi xảy ra khi thêm từ mới!');
        } finally {
            setLoading(false);
        }
    };

    return (
        <CommonFormModal
            show={show}
            onHide={onClose}
            title="Thêm Từ Vựng Mới"
            icon={IoAdd}
            footer={(
                <ModalActionFooter
                    cancelLabel="Hủy bỏ"
                    submitLabel="Lưu từ vựng ngay"
                    loadingLabel="Đang lưu..."
                    loading={loading}
                    onCancel={onClose}
                    onSubmit={handleSave}
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
                            value={newVocab.word}
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
                            value={newVocab.meaning}
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
