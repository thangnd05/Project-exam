'use client';

import {useState} from 'react';
import {useTranslations} from 'next-intl';
import { Eye, EyeOff } from 'lucide-react';
import { useChangePassword } from '@/app/[locale]/(user)/dashboard/_hooks/useChangePassword';
import classNames from 'classnames/bind';
import {toast} from 'react-toastify';
import {isAxiosError} from 'axios';
import {getApiErrorMessage} from '@/app/utils/apiError';
import CommonFormModal from '@/app/components/modal/CommonFormModal';
import ModalActionFooter from '@/app/components/modal/ModalActionFooter';
import commonModalStyles from '@/app/components/modal/CommonFormModal.module.scss';

const cmx = classNames.bind(commonModalStyles);

type ChangePasswordModalProps = {
  show: boolean;
  onHide: () => void;
};

function ChangePasswordModal({show, onHide}: ChangePasswordModalProps) {
  const t = useTranslations('Dashboard');
  const tCommon = useTranslations('Common');
  const changePasswordMutation = useChangePassword();
  const [visibleFields, setVisibleFields] = useState({
    oldPassword: false,
    newPassword: false,
    confirmNewPassword: false,
  });

  const toggleVisibility = (fieldName: keyof typeof visibleFields) => {
    setVisibleFields((prev) => ({...prev, [fieldName]: !prev[fieldName]}));
  };

  const submitting = changePasswordMutation.isPending;
  const [formValues, setFormValues] = useState({
    oldPassword: '',
    newPassword: '',
    confirmNewPassword: '',
  });

  const updateField = (fieldName: string, fieldValue: string) => {
    setFormValues((prev) => ({
      ...prev,
      [fieldName]: fieldValue,
    }));
  };

  const resetForm = () => {
    setFormValues({
      oldPassword: '',
      newPassword: '',
      confirmNewPassword: '',
    });
  };

  const closeModal = () => {
    if (submitting) {
      return;
    }

    onHide();
    resetForm();
  };

  const submitChangePassword = () => {
    const {oldPassword, newPassword, confirmNewPassword} = formValues;

    if (!oldPassword || !newPassword || !confirmNewPassword) {
      toast.warning(t('changePassword.toast.missingFields'));
      return;
    }

    if (newPassword !== confirmNewPassword) {
      toast.warning(t('changePassword.toast.mismatch'));
      return;
    }

    changePasswordMutation.mutate(
      {
        oldPassword,
        newPassword,
        confirmNewPassword,
      },
      {
        onSuccess: (data) => {
          const successMessage = data?.message || t('changePassword.toast.success');
          toast.success(successMessage);
          onHide();
          resetForm();
        },
        onError: (error) => {
          // Backend có thể trả { message } hoặc một chuỗi thuần.
          const data: unknown = isAxiosError(error) ? error.response?.data : undefined;
          const apiMessage =
            getApiErrorMessage(error, '') ||
            (typeof data === 'string' && data) ||
            t('changePassword.toast.failed');
          toast.error(apiMessage);
        },
      },
    );
  };

  return (
    <CommonFormModal
      show={show}
      onHide={closeModal}
      title={t('changePassword.title')}
      variant="exam"
      footer={
        <ModalActionFooter
          cancelLabel={tCommon('cancelShort')}
          submitLabel={t('changePassword.submit')}
          loadingLabel={t('saving')}
          loading={submitting}
          onCancel={closeModal}
          onSubmit={submitChangePassword}
        />
      }
    >
      <div className={cmx('formGroup')}>
        <label className={cmx('label')} htmlFor="oldPasswordInput">
          {t('changePassword.oldPassword')}
        </label>
        <div className={cmx('passwordField')}>
          <input
            id="oldPasswordInput"
            className={cmx('inputControl')}
            type={visibleFields.oldPassword ? 'text' : 'password'}
            value={formValues.oldPassword}
            onChange={(event) => updateField('oldPassword', event.target.value)}
            disabled={submitting}
            autoFocus
            placeholder={t('changePassword.oldPasswordPlaceholder')}
          />
          <button
            type="button"
            className={cmx('passwordToggle')}
            onClick={() => toggleVisibility('oldPassword')}
            aria-label={visibleFields.oldPassword ? t('changePassword.hidePassword') : t('changePassword.showPassword')}
          >
            {visibleFields.oldPassword ? <EyeOff size="1em" /> : <Eye size="1em" />}
          </button>
        </div>
      </div>

      <div className={cmx('formGroup')}>
        <label className={cmx('label')} htmlFor="newPasswordInput">
          {t('changePassword.newPassword')}
        </label>
        <div className={cmx('passwordField')}>
          <input
            id="newPasswordInput"
            className={cmx('inputControl')}
            type={visibleFields.newPassword ? 'text' : 'password'}
            value={formValues.newPassword}
            onChange={(event) => updateField('newPassword', event.target.value)}
            disabled={submitting}
            placeholder={t('changePassword.newPasswordPlaceholder')}
          />
          <button
            type="button"
            className={cmx('passwordToggle')}
            onClick={() => toggleVisibility('newPassword')}
            aria-label={visibleFields.newPassword ? t('changePassword.hidePassword') : t('changePassword.showPassword')}
          >
            {visibleFields.newPassword ? <EyeOff size="1em" /> : <Eye size="1em" />}
          </button>
        </div>
      </div>

      <div className={cmx('formGroup')}>
        <label className={cmx('label')} htmlFor="confirmNewPasswordInput">
          {t('changePassword.confirmPassword')}
        </label>
        <div className={cmx('passwordField')}>
          <input
            id="confirmNewPasswordInput"
            className={cmx('inputControl')}
            type={visibleFields.confirmNewPassword ? 'text' : 'password'}
            value={formValues.confirmNewPassword}
            onChange={(event) =>
              updateField('confirmNewPassword', event.target.value)
            }
            disabled={submitting}
            placeholder={t('changePassword.confirmPasswordPlaceholder')}
          />
          <button
            type="button"
            className={cmx('passwordToggle')}
            onClick={() => toggleVisibility('confirmNewPassword')}
            aria-label={visibleFields.confirmNewPassword ? t('changePassword.hidePassword') : t('changePassword.showPassword')}
          >
            {visibleFields.confirmNewPassword ? <EyeOff size="1em" /> : <Eye size="1em" />}
          </button>
        </div>
      </div>
    </CommonFormModal>
  );
}

export default ChangePasswordModal;
