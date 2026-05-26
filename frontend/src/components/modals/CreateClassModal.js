import { useState } from 'react';
import { Alert } from 'react-bootstrap';
import { toast } from 'react-toastify';
import axios from '../../api/axiosClient';
import classNames from 'classnames/bind';
import { FaChalkboardTeacher, FaEdit, FaInfoCircle } from 'react-icons/fa';
import { useAuth } from '~/hook/useAuth';
import { useNavigate } from 'react-router-dom';
import routes from '~/config/Routes';
import CommonFormModal from '~/components/common/modal/CommonFormModal';
import ModalActionFooter from '~/components/common/modal/ModalActionFooter';
import styles from '~/components/common/modal/CommonFormModal.module.scss';

const cx = classNames.bind(styles);

function CreateClassModal({ show, onClose }) {
  const [className, setClassName] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);

  //  Message state
  const [message, setMessage] = useState('');
  const [type, setType] = useState('info');

  const { user } = useAuth();
  const navigate = useNavigate();

  //  Create class logic
  const handleCreate = async () => {
    setMessage('');

    // 🟢 Check login
    if (!user) {
      setType('warning');
      setMessage(' Bạn cần đăng nhập trước khi tạo lớp!');

      setTimeout(() => {
        onClose();
        navigate(routes.login);
      }, 1200);

      return;
    }

    // 🟡 Validate input
    if (!className.trim()) {
      setType('danger');
      setMessage(' Vui lòng nhập tên lớp học!');
      return;
    }

    setLoading(true);

    try {
      //  Call API create class
      // Request body matches ClassEntity: className, description, teacherId (handled by backend or passed from frontend)
      // Backend should handle teacherId from session (as mentioned in conversation 5997355f)
      await axios.post('/api/classes', {
        className: className,
        description: description,
      });

      toast.success('Tạo lớp học thành công!');

      // Reset + close modal immediately
      setClassName('');
      setDescription('');
      onClose();
      // Optionally navigate to myClasses or the new class
      navigate(routes.myClasses);
    } catch (err) {
      setType('danger');
      setMessage(
        err.response?.data?.message || ' Có lỗi xảy ra khi tạo lớp học!',
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <CommonFormModal
      show={show}
      onHide={onClose}
      title="Tạo lớp học mới"
      icon={FaChalkboardTeacher}
      footer={
        <ModalActionFooter
          cancelLabel="Để sau"
          submitLabel="Tạo lớp ngay"
          loadingLabel="Đang xử lý..."
          loading={loading}
          onCancel={onClose}
          onSubmit={handleCreate}
        />
      }
    >
      {/*  Alert Message */}
      {message && (
        <Alert variant={type} style={{ margin: '15px 20px', fontSize: '14px' }}>
          {message}
        </Alert>
      )}

      <div className={cx('formGroup')}>
        <label className={cx('label')}>Tên lớp học</label>
        <div className={cx('inputWrapper')}>
          <span className={cx('inputIcon')}>
            <FaEdit />
          </span>
          <input
            type="text"
            className={cx('inputControl')}
            placeholder="Nhập tên lớp học (ví dụ: Lớp Tiếng Anh 10A1)"
            value={className}
            onChange={(e) => setClassName(e.target.value)}
            disabled={loading}
          />
        </div>
      </div>

      <div className={cx('formGroup', 'mt-4')}>
        <label className={cx('label')}>Mô tả lớp học</label>
        <div className={cx('inputWrapper')}>
          <textarea
            className={cx('inputControl', 'textarea')}
            placeholder="Nhập mô tả về lớp học (không bắt buộc)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            disabled={loading}
            rows={3}
          />
        </div>
        <div className={cx('tip')}>
          <FaInfoCircle />
          <span>Mô tả giúp học sinh hiểu rõ hơn về nội dung lớp học.</span>
        </div>
      </div>
    </CommonFormModal>
  );
}

export default CreateClassModal;
