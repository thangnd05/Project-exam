'use client';

import {useState} from 'react';
import {useQuery} from '@tanstack/react-query';
import {classKeys} from '@/app/configs/queryKeys';
import {Alert} from 'react-bootstrap';
import {toast} from 'react-toastify';
import { getClassById } from '@/app/apis/classApi';
import { useUpdateClass } from '@/app/features/classes/hooks/useMyClasses';
import classNames from 'classnames/bind';
import {FaEdit, FaInfoCircle} from 'react-icons/fa';
import CommonFormModal from '@/app/components/modal/CommonFormModal';
import ModalActionFooter from '@/app/components/modal/ModalActionFooter';
import styles from '@/app/components/modal/CommonFormModal.module.scss';
import type { ClassResponse, ClassStudentResponse } from '@/app/types';

const cx = classNames.bind(styles);

type EditClassModalProps = {
  show: boolean;
  onClose: () => void;
  classData?: (ClassStudentResponse & { description?: string }) | null;
  onSuccess?: (data: ClassResponse) => void;
};

function EditClassModal({show, onClose, classData, onSuccess}: EditClassModalProps) {
  const [className, setClassName] = useState('');
  const [description, setDescription] = useState('');
  const [message, setMessage] = useState('');
  const [type, setType] = useState('info');

  const [touched, setTouched] = useState(false);

  const updateMutation = useUpdateClass();
  const loading = updateMutation.isPending;
  const classId = classData?.classId;

  // Mở modal (hoặc đổi lớp) thì nạp form từ dữ liệu danh sách.
  const formFor = show ? (classId ?? null) : null;
  const [seededFor, setSeededFor] = useState<string | null>(null);
  if (formFor !== seededFor) {
    setSeededFor(formFor);
    if (show) {
      setClassName(classData?.className || '');
      setDescription(classData?.description || '');
      setMessage('');
      setTouched(false);
    }
  }

  // Danh sách không có mô tả thì lấy chi tiết lớp. Query có key theo classId nên response của lớp
  // khác không thể đổ vào form này, và chỉ điền khi người dùng chưa sửa gì.
  const { data: detail } = useQuery({
    queryKey: classKeys.detail(classId),
    queryFn: () => getClassById(classId as string),
    enabled: show && !!classId && !classData?.description,
  });
  const [filledFrom, setFilledFrom] = useState<ClassResponse | undefined>();
  if (show && detail && detail !== filledFrom) {
    setFilledFrom(detail);
    if (!touched) {
      setClassName(detail.className || '');
      setDescription(detail.description || '');
    }
  }

  const handleUpdate = () => {
    setMessage('');

    if (!className.trim()) {
      setType('danger');
      setMessage('Vui lòng nhập tên lớp học!');
      return;
    }

    updateMutation.mutate(
      {
        classId: classData!.classId,
        payload: { className, description },
      },
      {
        onSuccess: (data) => {
          toast.success('Cập nhật lớp học thành công!');
          onSuccess?.(data);
          onClose();
        },
        onError: (err) => {
          setType('danger');
          setMessage(
            err.response?.data?.error || 'Có lỗi xảy ra khi cập nhật lớp học!',
          );
        },
      },
    );
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
        <Alert variant={type} style={{margin: '1.5rem 2rem', fontSize: 'var(--font-size-ssm)'}}>
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
            onChange={(e) => { setTouched(true); setClassName(e.target.value); }}
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
            onChange={(e) => { setTouched(true); setDescription(e.target.value); }}
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
