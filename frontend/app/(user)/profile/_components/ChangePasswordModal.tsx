'use client';

import {useState} from 'react';
import { FiEye, FiEyeOff } from 'react-icons/fi';
import { useChangePassword } from '../_hooks/useChangePassword';
import classNames from 'classnames/bind';
import {toast} from 'react-toastify';
import CommonFormModal from '@/app/components/modal/CommonFormModal';
import ModalActionFooter from '@/app/components/modal/ModalActionFooter';
import commonModalStyles from '@/app/components/modal/CommonFormModal.module.scss';

const cmx = classNames.bind(commonModalStyles);

type ChangePasswordModalProps = {
  show: boolean;
  onHide: () => void;
};

function ChangePasswordModal({show, onHide}: ChangePasswordModalProps) {
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
      toast.warning('Vui lòng nhập đầy đủ thông tin đổi mật khẩu.');
      return;
    }

    if (newPassword.length < 8) {
      toast.warning('Mật khẩu mới phải có ít nhất 8 ký tự.');
      return;
    }

    if (newPassword !== confirmNewPassword) {
      toast.warning('Xác nhận mật khẩu mới không khớp.');
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
          const successMessage = data?.message || 'Đổi mật khẩu thành công.';
          toast.success(successMessage);
          onHide();
          resetForm();
        },
        onError: (error) => {
          const apiMessage =
            error.response?.data?.message ||
            error.response?.data ||
            'Đổi mật khẩu thất bại. Vui lòng thử lại.';
          toast.error(apiMessage);
        },
      },
    );
  };

  return (
    <CommonFormModal
      show={show}
      onHide={closeModal}
      title="Đổi mật khẩu"
      footer={
        <ModalActionFooter
          cancelLabel="Hủy"
          submitLabel="Cập nhật mật khẩu"
          loadingLabel="Đang lưu..."
          loading={submitting}
          onCancel={closeModal}
          onSubmit={submitChangePassword}
        />
      }
    >
      <div className={cmx('formGroup')}>
        <label className={cmx('label')} htmlFor="oldPasswordInput">
          Mật khẩu cũ
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
            placeholder="Nhập mật khẩu hiện tại"
          />
          <button
            type="button"
            className={cmx('passwordToggle')}
            onClick={() => toggleVisibility('oldPassword')}
            aria-label={visibleFields.oldPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
          >
            {visibleFields.oldPassword ? <FiEyeOff /> : <FiEye />}
          </button>
        </div>
      </div>

      <div className={cmx('formGroup')}>
        <label className={cmx('label')} htmlFor="newPasswordInput">
          Mật khẩu mới
        </label>
        <div className={cmx('passwordField')}>
          <input
            id="newPasswordInput"
            className={cmx('inputControl')}
            type={visibleFields.newPassword ? 'text' : 'password'}
            value={formValues.newPassword}
            onChange={(event) => updateField('newPassword', event.target.value)}
            disabled={submitting}
            placeholder="Tối thiểu 8 ký tự"
          />
          <button
            type="button"
            className={cmx('passwordToggle')}
            onClick={() => toggleVisibility('newPassword')}
            aria-label={visibleFields.newPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
          >
            {visibleFields.newPassword ? <FiEyeOff /> : <FiEye />}
          </button>
        </div>
      </div>

      <div className={cmx('formGroup')}>
        <label className={cmx('label')} htmlFor="confirmNewPasswordInput">
          Xác nhận mật khẩu mới
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
            placeholder="Nhập lại mật khẩu mới"
          />
          <button
            type="button"
            className={cmx('passwordToggle')}
            onClick={() => toggleVisibility('confirmNewPassword')}
            aria-label={visibleFields.confirmNewPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
          >
            {visibleFields.confirmNewPassword ? <FiEyeOff /> : <FiEye />}
          </button>
        </div>
      </div>
    </CommonFormModal>
  );
}

export default ChangePasswordModal;
