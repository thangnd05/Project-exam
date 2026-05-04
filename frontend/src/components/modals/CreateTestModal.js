import React from 'react';
import ReactDOM from 'react-dom';
import { IoRocketOutline, IoClose } from 'react-icons/io5';
import classNames from 'classnames/bind';
import CreateTestFormBody from '../creator/CreateTestFormBody';
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
  if (!show) return null;

  const handleSuccess = () => {
    onSuccess?.();
    onClose();
  };

  return ReactDOM.createPortal(
    <div className={cx('modalOverlay')} onClick={onClose}>
      <div className={cx('modalContent')} onClick={(e) => e.stopPropagation()}>
        <div className={cx('header')}>
          <div className={cx('titleWrapper')}>
            <IoRocketOutline />
            <h3 className={cx('title')}>Khởi tạo bài thi</h3>
            <span className={cx('badge')}>
              {mode === 'class' ? `Lớp: ${classId}` : 'Cá nhân'}
            </span>
          </div>
          <button type="button" className={cx('closeBtn')} onClick={onClose} aria-label="Đóng">
            <IoClose />
          </button>
        </div>
        <CreateTestFormBody
          mode={mode}
          classId={classId}
          chapterId={chapterId}
          onSuccess={handleSuccess}
          onCancel={onClose}
        />
      </div>
    </div>,
    document.body,
  );
};

export default CreateTestModal;
