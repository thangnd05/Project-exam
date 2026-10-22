'use client';

import { useState, useEffect, useRef } from 'react';
import { useTranslations } from 'next-intl';
import classNames from 'classnames/bind';
import { toast } from 'react-toastify';
import { IoPersonCircleOutline, IoCameraOutline } from 'react-icons/io5';
import { Spinner } from 'react-bootstrap';
import AvatarWithCosmetic from '@/app/features/gamification/cosmetic/AvatarWithCosmetic';
import CommonFormModal from '@/app/components/modal/CommonFormModal';
import ModalActionFooter from '@/app/components/modal/ModalActionFooter';
import commonModalStyles from '@/app/components/modal/CommonFormModal.module.scss';
import styles from './UpdateProfileModal.module.scss';
import { useMyInfo, useUpdateProfile } from '@/app/[locale]/(user)/dashboard/_hooks/useUpdateProfile';
import { getApiErrorMessage } from '@/app/utils/apiError';

const cmx = classNames.bind(commonModalStyles);
const cx = classNames.bind(styles);

type UpdateProfileModalProps = {
  show: boolean;
  onHide: () => void;
  onUpdateSuccess?: () => void;
};

function UpdateProfileModal({ show, onHide, onUpdateSuccess }: UpdateProfileModalProps) {
  const t = useTranslations('Dashboard');
  const tCommon = useTranslations('Common');
  const { userInfo, isLoading: loading, isError } = useMyInfo(show);
  const updateProfileMutation = useUpdateProfile();
  const submitting = updateProfileMutation.isPending;

  const [formValues, setFormValues] = useState({
    fullName: '',
    email: '',
    userName: ''
  });

  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState('');

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Mở modal (hoặc thông tin vừa tải xong) thì nạp form; đóng modal thì xoá form.
  // Điều chỉnh state ngay khi render thay cho effect.
  const seedKey = show ? userInfo : null;
  const [seededFor, setSeededFor] = useState<typeof userInfo>(null);
  if (seedKey !== seededFor) {
    setSeededFor(seedKey);
    if (seedKey) {
      setFormValues({
        fullName: seedKey.fullName || '',
        email: seedKey.email || '',
        userName: seedKey.userName || ''
      });
      setAvatarPreview(seedKey.avatarUrl || '');
    } else if (!show) {
      setFormValues({ fullName: '', email: '', userName: '' });
      setAvatarFile(null);
      setAvatarPreview('');
    }
  }

  useEffect(() => {
    if (show && isError) {
      toast.error(t('updateProfile.toast.loadError'));
      onHide();
    }
  }, [show, isError, onHide, t]);


  const updateField = (fieldName: string, fieldValue: string) => {
    setFormValues((prev) => ({
      ...prev,
      [fieldName]: fieldValue,
    }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        toast.warning(t('updateProfile.toast.invalidImage'));
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        toast.warning(t('updateProfile.toast.imageTooLarge'));
        return;
      }
      setAvatarFile(file);
      setAvatarPreview(URL.createObjectURL(file));
    }
  };

  const triggerFileInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const closeModal = () => {
    if (submitting) return;
    onHide();
  };

  const submitUpdateProfile = async () => {
    if (!formValues.fullName || !formValues.email || !formValues.userName) {
      toast.warning(t('updateProfile.toast.missingFields'));
      return;
    }

    const userId = userInfo?.id;

    if (!userId) {
      toast.error(t('updateProfile.toast.missingUserId'));
      return;
    }

    try {
      const formData = new FormData();

      const userPayload = {
        userId,
        userName: formValues.userName,
        fullName: formValues.fullName,
        email: formValues.email,
        verified: userInfo?.verified
      };

      formData.append('user', JSON.stringify(userPayload));

      if (avatarFile) {
        formData.append('avatar', avatarFile);
      }

      await updateProfileMutation.mutateAsync({ userId, formData });

      toast.success(t('updateProfile.toast.success'));
      if (onUpdateSuccess) {
        onUpdateSuccess();
      }
      closeModal();
    } catch (error) {
      const apiMessage = getApiErrorMessage(error, t('updateProfile.toast.failed'));
      toast.error(apiMessage);
    }
  };

  if (loading && show) {
    return (
      <CommonFormModal show={show} onHide={closeModal} title={t('updateProfile.title')}>
        <div className="d-flex justify-content-center p-4">
          <Spinner animation="border" variant="primary" />
        </div>
      </CommonFormModal>
    );
  }

  return (
    <CommonFormModal
      show={show}
      onHide={closeModal}
      title={t('updateProfile.title')}
      footer={
        <ModalActionFooter
          cancelLabel={tCommon('cancelShort')}
          submitLabel={t('updateProfile.submit')}
          loadingLabel={t('saving')}
          loading={submitting}
          onCancel={closeModal}
          onSubmit={submitUpdateProfile}
        />
      }
    >
      <div className={cx('avatarSection')}>
        <div className={cx('avatarPreviewWrap')} onClick={triggerFileInput}>
          {avatarPreview || formValues.userName || formValues.fullName ? (
            <AvatarWithCosmetic
              src={avatarPreview}
              name={formValues.userName || formValues.fullName}
              alt={t('updateProfile.avatarAlt')}
              size={100}
            />
          ) : (
            <div className={cx('avatarPlaceholder')}>
              <IoPersonCircleOutline size={64} color="#cbd5e1" />
            </div>
          )}
          <div className={cx('avatarOverlay')}>
            <IoCameraOutline size={24} />
          </div>
        </div>
        <input
          type="file"
          ref={fileInputRef}
          style={{ display: 'none' }}
          accept="image/*"
          onChange={handleFileChange}
          disabled={submitting}
        />
        <p className={cx('avatarHint')}>{t('updateProfile.avatarHint')}</p>
      </div>

      <div className={cmx('formGroup')}>
        <label className={cmx('label')} htmlFor="userNameInput">
          {t('updateProfile.userName')}
        </label>
        <input
          id="userNameInput"
          className={cmx('inputControl')}
          type="text"
          value={formValues.userName}
          onChange={(event) => updateField('userName', event.target.value)}
          disabled={submitting}
        />
      </div>

      <div className={cmx('formGroup')}>
        <label className={cmx('label')} htmlFor="fullNameInput">
          {t('updateProfile.fullName')}
        </label>
        <input
          id="fullNameInput"
          className={cmx('inputControl')}
          type="text"
          value={formValues.fullName}
          onChange={(event) => updateField('fullName', event.target.value)}
          disabled={submitting}
          autoFocus
        />
      </div>

      <div className={cmx('formGroup')}>
        <label className={cmx('label')} htmlFor="emailInput">
          {t('updateProfile.email')}
        </label>
        <input
          id="emailInput"
          className={cmx('inputControl')}
          type="email"
          value={formValues.email}
          onChange={(event) => updateField('email', event.target.value)}
          disabled={submitting}
          readOnly={true}
        />
      </div>
    </CommonFormModal>
  );
}

export default UpdateProfileModal;
