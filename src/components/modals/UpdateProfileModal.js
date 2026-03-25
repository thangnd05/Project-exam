import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import classNames from 'classnames/bind';
import { toast } from 'react-toastify';
import { IoPersonCircleOutline, IoCameraOutline } from 'react-icons/io5';
import { Spinner } from 'react-bootstrap';
import CommonFormModal from '~/components/common/modal/CommonFormModal';
import ModalActionFooter from '~/components/common/modal/ModalActionFooter';
import commonModalStyles from '~/components/common/modal/CommonFormModal.module.scss';
import styles from './UpdateProfileModal.module.scss';

const cmx = classNames.bind(commonModalStyles);
const cx = classNames.bind(styles);

function UpdateProfileModal({ show, onHide, onUpdateSuccess }) {
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(false);
  const [userInfo, setUserInfo] = useState(null);

  const [formValues, setFormValues] = useState({
    fullName: '',
    email: '',
    userName: '' // userName might not be editable but let's show it or allow edit if backend supports
  });

  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState('');

  const fileInputRef = useRef(null);

  useEffect(() => {
    if (show) {
      fetchUserInfo();
    } else {
      resetForm();
    }
  }, [show]);

  const fetchUserInfo = async () => {
    setLoading(true);
    try {
      const response = await axios.get('/api/users/me/info-user');
      const data = response.data;
      if (data) {
        setUserInfo(data);
        setFormValues({
          fullName: data.fullName || '',
          email: data.email || '',
          userName: data.userName || ''
        });
        setAvatarPreview(data.avatarUrl || '');
      }
    } catch (error) {
      toast.error('Không tải được thông tin cá nhân.');
      onHide();
    } finally {
      setLoading(false);
    }
  };

  const updateField = (fieldName, fieldValue) => {
    setFormValues((prev) => ({
      ...prev,
      [fieldName]: fieldValue,
    }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
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

  const resetForm = () => {
    setFormValues({ fullName: '', email: '', userName: '' });
    setAvatarFile(null);
    setAvatarPreview('');
    setUserInfo(null);
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

    if (!userInfo?.userId) {
      toast.error('Lỗi dữ liệu. Không tìm thấy ID người dùng.');
      return;
    }

    setSubmitting(true);

    try {
      const formData = new FormData();

      const userPayload = {
        userId: userInfo.userId,
        userName: formValues.userName,
        fullName: formValues.fullName,
        email: formValues.email,
        roleId: userInfo.roleId,
        password: userInfo.password, // Preserve current info if needed by backend
        verified: userInfo.verified
      };

      formData.append('user', JSON.stringify(userPayload));

      if (avatarFile) {
        formData.append('avatar', avatarFile);
      }

      await axios.put(`/api/users/${userInfo.userId}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      toast.success('Cập nhật thông tin thành công!');
      if (onUpdateSuccess) {
        onUpdateSuccess();
      }
      closeModal();
    } catch (error) {
      const apiMessage = error.response?.data?.message || 'Cập nhật thất bại. Vui lòng thử lại.';
      toast.error(apiMessage);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading && show) {
    return (
      <CommonFormModal show={show} onHide={closeModal} title="Cập nhật hồ sơ" icon={IoPersonCircleOutline}>
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
      icon={IoPersonCircleOutline}
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
            <img src={avatarPreview} alt="Avatar Preview" className={cx('avatarImage')} />
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
