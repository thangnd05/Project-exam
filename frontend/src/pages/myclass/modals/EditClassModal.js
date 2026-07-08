import {useState, useEffect} from 'react';
import {Alert} from 'react-bootstrap';
import {toast} from 'react-toastify';
import { getClassById, updateClass } from '~/api/classApi';
import classNames from 'classnames/bind';
import {FaEdit, FaInfoCircle} from 'react-icons/fa';
import CommonFormModal from '~/components/common/modal/CommonFormModal';
import ModalActionFooter from '~/components/common/modal/ModalActionFooter';
import styles from '~/components/common/modal/CommonFormModal.module.scss';

const cx = classNames.bind(styles);

function EditClassModal({show, onClose, classData, onSuccess}) {
  const [className, setClassName] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [type, setType] = useState('info');

  useEffect(() => {
    if (show) {
      setClassName(classData?.className || '');
      setDescription(classData?.description || '');
      setMessage('');

      if (classData?.classId && !classData?.description) {
        getClassById(classData.classId)
          .then((data) => {
            setClassName(data.className || '');
            setDescription(data.description || '');
          })
          .catch((err) => {
            console.error('Error fetching class details:', err);
          });
      }
    }
  }, [classData, show]);

  const handleUpdate = async () => {
    setMessage('');

    if (!className.trim()) {
      setType('danger');
      setMessage('Vui lòng nhập tên lớp học!');
      return;
    }

    setLoading(true);

    try {
      const data = await updateClass(classData.classId, {
        className: className,
        description: description,
      });

      toast.success('Cập nhật lớp học thành công!');
      onSuccess?.(data);
      onClose();
    } catch (err) {
      setType('danger');
      setMessage(
        err.response?.data?.error || 'Có lỗi xảy ra khi cập nhật lớp học!',
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <CommonFormModal
      show={show}
      onHide={onClose}
      title="Chỉnh sửa lớp học"
      footer={
        <ModalActionFooter
          cancelLabel="Để sau"
          submitLabel="Lưu thay đổi"
          loadingLabel="Đang xử lý..."
          loading={loading}
          onCancel={onClose}
          onSubmit={handleUpdate}
        />
      }
    >
      {message && (
        <Alert variant={type} style={{margin: '15px 20px', fontSize: '14px'}}>
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
            placeholder="Nhập tên lớp học"
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

export default EditClassModal;
