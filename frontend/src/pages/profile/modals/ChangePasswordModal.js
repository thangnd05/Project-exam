import {useState} from 'react';
import { changePassword } from '~/api/authApi';
import classNames from 'classnames/bind';
import {toast} from 'react-toastify';
import {IoLockClosedOutline} from 'react-icons/io5';
import CommonFormModal from '~/components/common/modal/CommonFormModal';
import ModalActionFooter from '~/components/common/modal/ModalActionFooter';
import commonModalStyles from '~/components/common/modal/CommonFormModal.module.scss';

const cmx = classNames.bind(commonModalStyles);

function ChangePasswordModal({show, onHide}) {
  const [submitting, setSubmitting] = useState(false);
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

  const submitChangePassword = async () => {
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

    setSubmitting(true);

    try {
      const payload = {
        oldPassword,
        newPassword,
        confirmNewPassword,
      };
      const data = await changePassword(payload);
      const successMessage =
        data?.message || 'Đổi mật khẩu thành công.';
      toast.success(successMessage);
      onHide();
      resetForm();
    } catch (error) {
      const apiMessage =
        error.response?.data?.message ||
        error.response?.data ||
        'Đổi mật khẩu thất bại. Vui lòng thử lại.';
      toast.error(apiMessage);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <CommonFormModal
      show={show}
      onHide={closeModal}
      title="Đổi mật khẩu"
      icon={IoLockClosedOutline}
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
