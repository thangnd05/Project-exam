'use client';

import { Spinner } from 'react-bootstrap';
import { PlusCircle } from 'lucide-react';
import classNames from 'classnames/bind';
import { useTranslations } from 'next-intl';
import styles from '@/app/features/tests/CreateTestModal.module.scss';
import ButtonPrime from '@/app/components/Button/ButtonPrime';

const cx = classNames.bind(styles);

type FormFooterProps = {
    loading?: boolean;
    onAddQuestion?: () => void;
    onCancel?: () => void;
    onSubmit?: () => void;
    submitLabel?: string;
    showAddBtn?: boolean;
};

const FormFooter = ({
    loading,
    onAddQuestion,
    onCancel,
    onSubmit,
    submitLabel,
    showAddBtn = true,
}: FormFooterProps) => {
    const t = useTranslations('TestCreator');
    return (
        <div className={cx('footer')}>
            {showAddBtn && (
                <ButtonPrime type="button" variant="outline" size="md" onClick={onAddQuestion}>
                    <PlusCircle size={18} /> {t('formFooter.addQuestion')}
                </ButtonPrime>
            )}
            {onCancel && (
                <ButtonPrime type="button" variant="ghost" size="md" onClick={onCancel}>
                    {t('formFooter.later')}
                </ButtonPrime>
            )}
            <ButtonPrime type="button" variant="primary" size="md" onClick={onSubmit} disabled={loading}>
                {loading ? <Spinner size="sm" /> : (submitLabel ?? t('formFooter.saveAndPublish'))}
            </ButtonPrime>
        </div>
    );
};

export default FormFooter;
