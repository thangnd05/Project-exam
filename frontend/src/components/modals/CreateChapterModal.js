import React, { useState } from 'react';
import ReactDOM from 'react-dom';
import { FaBook, FaEdit, FaInfoCircle, FaTimes } from 'react-icons/fa';
import classNames from 'classnames/bind';
import axios from 'axios';
import { toast } from 'react-toastify';
import styles from '~/components/common/modal/PortalFormModal.module.scss';

const cx = classNames.bind(styles);

const CreateChapterModal = ({ show, onClose, classId, onSuccess }) => {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [submitting, setSubmitting] = useState(false);

    if (!show) return null;

    const handleCreate = async (e) => {
        e.preventDefault();
        if (!title.trim()) {
            alert('Vui lòng nhập tên chương!');
            return;
        }

        setSubmitting(true);
        try {
            await axios.post('/api/chapters', {
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
            toast.error(' Có lỗi xảy ra khi tạo chương mới!');
        } finally {
            setSubmitting(false);
        }
    };

    return ReactDOM.createPortal(
        <div className={cx('modalOverlay')} onClick={onClose}>
            <div className={cx('modalContent')} onClick={(e) => e.stopPropagation()}>
                {/* Header */}
                <div className={cx('header')}>
                    <div className={cx('titleWrapper')}>
                        <FaBook />
                        <h3 className={cx('title')}>Tạo chương mới</h3>
                    </div>
                    <button className={cx('closeBtn')} onClick={onClose}>
                        <FaTimes />
                    </button>
                </div>

                {/* Body */}
                <div className={cx('body')}>
                    <form onSubmit={handleCreate}>
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
                                    required
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    autoFocus
                                />
                            </div>
                        </div>

                        <div className={cx('formGroup')}>
                            <label className={cx('label')}>Mô tả</label>
                            <div className={cx('inputWrapper')}>
                                <textarea
                                    className={cx('inputControl', 'textarea')}
                                    rows="3"
                                    placeholder="Nhập mô tả ngắn gọn về chương học này..."
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                ></textarea>
                            </div>
                            <div className={cx('tip')}>
                                <FaInfoCircle />
                                <span>Mô tả giúp học viên nắm bắt được nội dung chính của chương.</span>
                            </div>
                        </div>
                    </form>
                </div>

                {/* Footer */}
                <div className={cx('footer')}>
                    <button className={cx('btnCancel')} onClick={onClose} disabled={submitting}>
                        Để sau
                    </button>
                    <button className={cx('btnSubmit')} onClick={handleCreate} disabled={submitting}>
                        {submitting ? 'Đang tạo...' : 'Tạo chương ngay'}
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
};

export default CreateChapterModal;
