import React from 'react';
import { Spinner } from 'react-bootstrap';
import { PlusCircle } from 'lucide-react';
import { IoRocketOutline } from 'react-icons/io5';
import classNames from 'classnames/bind';
import styles from '../CreateTestModal.module.scss';

const cx = classNames.bind(styles);

const FormFooter = ({
    loading,
    onAddQuestion,
    onCancel,
    onSubmit,
    submitLabel = 'Lưu & Xuất bản',
    showAddBtn = true,
}) => {
    return (
        <div className={cx('footer')}>
            {showAddBtn && (
                <button type="button" className={cx('btnAdd')} onClick={onAddQuestion}>
                    <PlusCircle size={18} /> Thêm câu hỏi
                </button>
            )}
            {onCancel && (
                <button type="button" className={cx('btnCancel')} onClick={onCancel}>
                    Để sau
                </button>
            )}
            <button type="button" className={cx('btnSubmit')} onClick={onSubmit} disabled={loading}>
                {loading ? (
                    <Spinner size="sm" />
                ) : (
                    <>
                        <IoRocketOutline /> {submitLabel}
                    </>
                )}
            </button>
        </div>
    );
};

export default FormFooter;
