import React from 'react';
import { Spinner } from 'react-bootstrap';
import { PlusCircle } from 'lucide-react';
import { IoRocketOutline } from 'react-icons/io5';
import classNames from 'classnames/bind';
import styles from '../CreateTestModal.module.scss';
import ButtonPrime from '~/components/common/Button/ButtonPrime';

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
                <ButtonPrime type="button" variant="outline" size="md" onClick={onAddQuestion}>
                    <PlusCircle size={18} /> Thêm câu hỏi
                </ButtonPrime>
            )}
            {onCancel && (
                <ButtonPrime type="button" variant="ghost" size="md" onClick={onCancel}>
                    Để sau
                </ButtonPrime>
            )}
            <ButtonPrime type="button" variant="primary" size="md" onClick={onSubmit} disabled={loading}>
                {loading ? (
                    <Spinner size="sm" />
                ) : (
                    <>
                        <IoRocketOutline /> {submitLabel}
                    </>
                )}
            </ButtonPrime>
        </div>
    );
};

export default FormFooter;
