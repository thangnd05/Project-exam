'use client';

import {useState} from 'react';
import {useTranslations} from 'next-intl';
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
  const t = useTranslations('Classes');
  const tCommon = useTranslations('Common');
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
      setMessage(t('editClass.nameRequired'));
      return;
    }

    updateMutation.mutate(
      {
        classId: classData!.classId,
        payload: { className, description },
      },
      {
        onSuccess: (data) => {
          toast.success(t('editClass.success'));
          onSuccess?.(data);
          onClose();
        },
        onError: (err) => {
          setType('danger');
          setMessage(
            err.response?.data?.error || t('editClass.error'),
          );
        },
      },
    );
  };

  return (
    <CommonFormModal
      show={show}
      onHide={onClose}
      title={t('editClass.title')}
      footer={
        <ModalActionFooter
          cancelLabel={t('common.later')}
          submitLabel={t('common.saveChanges')}
          loadingLabel={tCommon('processing')}
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
        <label className={cx('label')}>{t('common.className')}</label>
        <div className={cx('inputWrapper')}>
          <span className={cx('inputIcon')}>
            <FaEdit />
          </span>
          <input
            type="text"
            className={cx('inputControl')}
            placeholder={t('editClass.namePlaceholder')}
            value={className}
            onChange={(e) => { setTouched(true); setClassName(e.target.value); }}
            disabled={loading}
          />
        </div>
      </div>

      <div className={cx('formGroup', 'mt-4')}>
        <label className={cx('label')}>{t('common.classDescription')}</label>
        <div className={cx('inputWrapper')}>
          <textarea
            className={cx('inputControl', 'textarea')}
            placeholder={t('common.classDescriptionPlaceholder')}
            value={description}
            onChange={(e) => { setTouched(true); setDescription(e.target.value); }}
            disabled={loading}
            rows={3}
          />
        </div>
        <div className={cx('tip')}>
          <FaInfoCircle />
          <span>{t('common.classDescriptionTip')}</span>
        </div>
      </div>
    </CommonFormModal>
  );
}

export default EditClassModal;
