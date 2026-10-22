'use client';

import { buildLoginUrlFromHere } from '@/app/features/auth/authRedirect';
import { useRouter } from '@/app/i18n/navigation';
import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Alert } from 'react-bootstrap';
import { toast } from 'react-toastify';
import { useCreateClass } from '@/app/features/classes/hooks/useMyClasses';
import classNames from 'classnames/bind';
import { FaEdit, FaInfoCircle } from 'react-icons/fa';
import { useAuth } from '@/app/hooks/useAuth';
import routes from '@/app/configs/Routes';
import CommonFormModal from '@/app/components/modal/CommonFormModal';
import ModalActionFooter from '@/app/components/modal/ModalActionFooter';
import styles from '@/app/components/modal/CommonFormModal.module.scss';

const cx = classNames.bind(styles);

type CreateClassModalProps = {
  show: boolean;
  onClose: () => void;
};

function CreateClassModal({ show, onClose }: CreateClassModalProps) {
  const t = useTranslations('Classes');
  const tCommon = useTranslations('Common');
  const [className, setClassName] = useState('');
  const [description, setDescription] = useState('');

  const [message, setMessage] = useState('');
  const [type, setType] = useState('info');

  const { user } = useAuth();
  const router = useRouter();
  const createMutation = useCreateClass();
  const loading = createMutation.isPending;

  const handleCreate = () => {
    setMessage('');

    if (!user) {
      setType('warning');
      setMessage(t('createClass.loginRequired'));

      setTimeout(() => {
        onClose();
        router.push(buildLoginUrlFromHere());
      }, 1200);

      return;
    }

    if (!className.trim()) {
      setType('danger');
      setMessage(t('createClass.nameRequired'));
      return;
    }

    createMutation.mutate(
      { className, description },
      {
        onSuccess: () => {
          toast.success(t('createClass.success'));

          setClassName('');
          setDescription('');
          onClose();

          router.push(routes.myClasses);
        },
        onError: (err) => {
          setType('danger');
          setMessage(
            err.response?.data?.message || t('createClass.error'),
          );
        },
      },
    );
  };

  return (
    <CommonFormModal
      show={show}
      onHide={onClose}
      title={t('createClass.title')}
      footer={
        <ModalActionFooter
          cancelLabel={t('common.later')}
          submitLabel={t('createClass.submit')}
          loadingLabel={tCommon('processing')}
          loading={loading}
          onCancel={onClose}
          onSubmit={handleCreate}
        />
      }
    >

      {message && (
        <Alert variant={type} style={{ margin: '1.5rem 2rem', fontSize: 'var(--font-size-ssm)' }}>
          {message}
        </Alert>
      )}

      <div className={cx('formGroup')}>
        <label className={cx('label')}>{t('common.className')}</label>
        <div className={cx('inputWrapper')}>
          <span className={cx('inputIcon')}>
            <FaEdit />
          </span>
          <input
            type="text"
            className={cx('inputControl')}
            placeholder={t('createClass.namePlaceholder')}
            value={className}
            onChange={(e) => setClassName(e.target.value)}
            disabled={loading}
          />
        </div>
      </div>

      <div className={cx('formGroup', 'mt-4')}>
        <label className={cx('label')}>{t('common.classDescription')}</label>
        <div className={cx('inputWrapper')}>
          <textarea
            className={cx('inputControl', 'textarea')}
            placeholder={t('common.classDescriptionPlaceholder')}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            disabled={loading}
            rows={3}
          />
        </div>
        <div className={cx('tip')}>
          <FaInfoCircle />
          <span>{t('common.classDescriptionTip')}</span>
        </div>
      </div>
    </CommonFormModal>
  );
}

export default CreateClassModal;
