import { useState } from 'react';
import { FaEdit, FaInfoCircle } from 'react-icons/fa';
import classNames from 'classnames/bind';
import { createChapter } from '~/shared/api/chapterApi';
import { toast } from 'react-toastify';
import CommonFormModal from '~/shared/ui/modal/CommonFormModal';
import ModalActionFooter from '~/shared/ui/modal/ModalActionFooter';
import styles from '~/shared/ui/modal/CommonFormModal.module.scss';

const cx = classNames.bind(styles);

const CreateChapterModal = ({ show, onClose, classId, onSuccess }) => {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const handleCreate = async () => {
        if (!title.trim()) {
            toast.warning(' Vui lòng nhập tên chương!');
            return;
        }

        setSubmitting(true);
        try {
            await createChapter({
                classId: classId,
                title: title,
                description: description
            });
            toast.success('Tạo chương mới thành công!');
            setTitle('');
            setDescription('');
            onSuccess();
            onClose();
        } catch (error) {
            console.error('Failed to create chapter:', error);
            toast.error('Có lỗi xảy ra khi tạo chương mới!');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <CommonFormModal
            show={show}
            onHide={onClose}
            title="Tạo chương mới"
            footer={(
                <ModalActionFooter
                    cancelLabel="Để sau"
                    submitLabel="Tạo chương ngay"
                    loadingLabel="Đang tạo..."
                    loading={submitting}
                    onCancel={onClose}
                    onSubmit={handleCreate}
                />
            )}
        >
            <div className={cx('formGroup')}>
                <label className={cx('label')}>Tên chương</label>
                <div className={cx('inputWrapper')}>
                    <span className={cx('inputIcon')}>
                        <FaEdit />
                    </span>
                    <input
                        type="text"
                        className={cx('inputControl')}
                        placeholder="Ví dụ: Unit 1: Present Simple"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        disabled={submitting}
                        autoFocus
                    />
                </div>
            </div>

            <div className={cx('formGroup')}>
                <label className={cx('label')}>Mô tả</label>
                <div className={cx('inputWrapper')}>
                    <textarea
                        className={cx('inputControl', 'textarea')}
                        rows={3}
                        placeholder="Nhập mô tả ngắn gọn về chương học này..."
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        disabled={submitting}
                    />
                </div>
                <div className={cx('tip')}>
                    <FaInfoCircle />
                    <span>Mô tả giúp học viên nắm bắt được nội dung chính của chương.</span>
                </div>
            </div>
        </CommonFormModal>
    );
};

export default CreateChapterModal;
