import { useState } from 'react';
import { Alert } from 'react-bootstrap';
import { toast } from 'react-toastify';
import { useCreateClass } from '~/features/classes/hooks/useMyClasses';
import classNames from 'classnames/bind';
import { FaEdit, FaInfoCircle } from 'react-icons/fa';
import { useAuth } from '~/shared/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import routes from '~/shared/config/Routes';
import CommonFormModal from '~/shared/ui/modal/CommonFormModal';
import ModalActionFooter from '~/shared/ui/modal/ModalActionFooter';
import styles from '~/shared/ui/modal/CommonFormModal.module.scss';

const cx = classNames.bind(styles);

function CreateClassModal({ show, onClose }) {
  const [className, setClassName] = useState('');
  const [description, setDescription] = useState('');

  const [message, setMessage] = useState('');
  const [type, setType] = useState('info');

  const { user } = useAuth();
  const navigate = useNavigate();
  const createMutation = useCreateClass();
  const loading = createMutation.isPending;

  const handleCreate = () => {
    setMessage('');

    if (!user) {
      setType('warning');
      setMessage(' Bạn cần đăng nhập trước khi tạo lớp!');

      setTimeout(() => {
        onClose();
        navigate(routes.login);
      }, 1200);

      return;
    }

    if (!className.trim()) {
      setType('danger');
      setMessage(' Vui lòng nhập tên lớp học!');
      return;
    }

    createMutation.mutate(
      { className, description },
      {
        onSuccess: () => {
          toast.success('Tạo lớp học thành công!');

          setClassName('');
          setDescription('');
          onClose();

          navigate(routes.myClasses);
        },
        onError: (err) => {
          setType('danger');
          setMessage(
            err.response?.data?.message || ' Có lỗi xảy ra khi tạo lớp học!',
          );
        },
      },
    );
  };

  return (
    <CommonFormModal
      show={show}
      onHide={onClose}
      title="Tạo lớp học mới"
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

      {message && (
        <Alert variant={type} style={{ margin: '1.5rem 2rem', fontSize: 'var(--font-size-ssm)' }}>
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
