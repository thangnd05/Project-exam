'use client';

import classNames from 'classnames/bind';
import BaseModal from '@/app/components/modal/BaseModal';
import CreateTestFormBody from './creator/CreateTestFormBody';
import styles from './CreateTestModal.module.scss';

const cx = classNames.bind(styles);

const CreateTestModal = ({
  show,
  onClose,
  mode = 'personal',
  classId,
  chapterId,
  onSuccess,
}) => {
  const handleSuccess = () => {
    onSuccess?.();
    onClose();
  };

  return (
    <BaseModal
      show={show}
      onClose={onClose}
      title="Khởi tạo bài thi"
      headerExtra={
        <span className={cx('headerBadge')}>
          {mode === 'class' ? `Lớp: ${classId}` : 'Cá nhân'}
        </span>
      }
    >
      <CreateTestFormBody
        mode={mode}
        classId={classId}
        chapterId={chapterId}
        onSuccess={handleSuccess}
        onCancel={onClose}
      />
    </BaseModal>
  );
};

export default CreateTestModal;
