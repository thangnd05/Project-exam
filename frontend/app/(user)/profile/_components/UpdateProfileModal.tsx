'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import classNames from 'classnames/bind';
import { toast } from 'react-toastify';
import { IoPersonCircleOutline, IoCameraOutline } from 'react-icons/io5';
import { Spinner } from 'react-bootstrap';
import CommonFormModal from '@/app/components/modal/CommonFormModal';
import ModalActionFooter from '@/app/components/modal/ModalActionFooter';
import commonModalStyles from '@/app/components/modal/CommonFormModal.module.scss';
import styles from './UpdateProfileModal.module.scss';
import { useMyInfo, useUpdateProfile } from '../_hooks/useUpdateProfile';

const cmx = classNames.bind(commonModalStyles);
const cx = classNames.bind(styles);

type UpdateProfileModalProps = {
  show: boolean;
  onHide: () => void;
  onUpdateSuccess?: () => void;
};

function UpdateProfileModal({ show, onHide, onUpdateSuccess }: UpdateProfileModalProps) {
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

  const resetForm = useCallback(() => {
    setFormValues({ fullName: '', email: '', userName: '' });
    setAvatarFile(null);
    setAvatarPreview('');
  }, []);

  useEffect(() => {
    if (show && userInfo) {
      setFormValues({
        fullName: userInfo.fullName || '',
        email: userInfo.email || '',
        userName: userInfo.userName || ''
      });
      setAvatarPreview(userInfo.avatarUrl || '');
    }
  }, [show, userInfo]);

  useEffect(() => {
    if (show && isError) {
      toast.error('Không tải được thông tin cá nhân.');
      onHide();
    }
  }, [show, isError, onHide]);

  useEffect(() => {
    if (!show) {
      resetForm();
    }
  }, [show, resetForm]);

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
        toast.warning('Vui lòng chọn file hình ảnh (jpg, png, v.v.).');
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        toast.warning('Kích thước ảnh không được vượt quá 5MB.');
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
      toast.warning('Vui lòng nhập đầy đủ họ tên, tên đăng nhập và email.');
      return;
    }

    const userId = (userInfo as any)?.userId;

    if (!userId) {
      toast.error('Lỗi dữ liệu. Không tìm thấy ID người dùng.');
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

      toast.success('Cập nhật thông tin thành công!');
      if (onUpdateSuccess) {
        onUpdateSuccess();
      }
      closeModal();
    } catch (error: any) {
      const apiMessage = error.response?.data?.message || 'Cập nhật thất bại. Vui lòng thử lại.';
      toast.error(apiMessage);
    }
  };

  if (loading && show) {
    return (
      <CommonFormModal show={show} onHide={closeModal} title="Cập nhật hồ sơ">
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
      title="Cập nhật hồ sơ"
      footer={
        <ModalActionFooter
          cancelLabel="Hủy"
          submitLabel="Lưu thay đổi"
          loadingLabel="Đang lưu..."
          loading={submitting}
          onCancel={closeModal}
          onSubmit={submitUpdateProfile}
        />
      }
    >
      <div className={cx('avatarSection')}>
        <div className={cx('avatarPreviewWrap')} onClick={triggerFileInput}>
          {avatarPreview ? (
            <img src={avatarPreview} alt="Avatar Preview" className={cx('avatarImage')} referrerPolicy="no-referrer" />
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
        <p className={cx('avatarHint')}>Bấm vào ảnh để thay đổi avatar</p>
      </div>

      <div className={cmx('formGroup')}>
        <label className={cmx('label')} htmlFor="userNameInput">
          Tên đăng nhập
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
          Họ và Tên
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
          Email
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
