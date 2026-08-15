'use client';

import {useState} from 'react';
import { useChangePassword } from '@/app/features/user/profile/hooks/useChangePassword';
import classNames from 'classnames/bind';
import {toast} from 'react-toastify';
import CommonFormModal from '@/app/components/modal/CommonFormModal';
import ModalActionFooter from '@/app/components/modal/ModalActionFooter';
import commonModalStyles from '@/app/components/modal/CommonFormModal.module.scss';

const cmx = classNames.bind(commonModalStyles);

function ChangePasswordModal({show, onHide}) {
  const changePasswordMutation = useChangePassword();
  const submitting = changePasswordMutation.isPending;
  const [formValues, setFormValues] = useState({
    oldPassword: '',
    newPassword: '',
    confirmNewPassword: '',
  });

  const updateField = (fieldName, fieldValue) => {
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

    if (newPassword.length < 6) {
      toast.warning('Mật khẩu mới phải có ít nhất 6 ký tự.');
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
        <input
          id="oldPasswordInput"
          className={cmx('inputControl')}
          type="password"
          value={formValues.oldPassword}
          onChange={(event) => updateField('oldPassword', event.target.value)}
          disabled={submitting}
          autoFocus
          placeholder="Nhập mật khẩu hiện tại"
        />
      </div>

      <div className={cmx('formGroup')}>
        <label className={cmx('label')} htmlFor="newPasswordInput">
          Mật khẩu mới
        </label>
        <input
          id="newPasswordInput"
          className={cmx('inputControl')}
          type="password"
          value={formValues.newPassword}
          onChange={(event) => updateField('newPassword', event.target.value)}
          disabled={submitting}
          placeholder="Tối thiểu 6 ký tự"
        />
      </div>

      <div className={cmx('formGroup')}>
        <label className={cmx('label')} htmlFor="confirmNewPasswordInput">
          Xác nhận mật khẩu mới
        </label>
        <input
          id="confirmNewPasswordInput"
          className={cmx('inputControl')}
          type="password"
          value={formValues.confirmNewPassword}
          onChange={(event) =>
            updateField('confirmNewPassword', event.target.value)
          }
          disabled={submitting}
          placeholder="Nhập lại mật khẩu mới"
        />
      </div>
    </CommonFormModal>
  );
}

export default ChangePasswordModal;
