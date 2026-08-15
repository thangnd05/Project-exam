'use client';

import { IoPeopleOutline, IoKeyOutline, IoPersonOutline } from 'react-icons/io5';
import classNames from 'classnames/bind';
import { toast } from 'react-toastify';
import styles from './ClassCard.module.scss';

const cx = classNames.bind(styles);

const copyToClipboard = async (text) => {
  if (navigator.clipboard && window.isSecureContext) {
    await navigator.clipboard.writeText(text);
    return;
  }
  const textarea = document.createElement('textarea');
  textarea.value = text;
  textarea.style.position = 'fixed';
  textarea.style.left = '-9999px';
  document.body.appendChild(textarea);
  textarea.focus();
  textarea.select();
  document.execCommand('copy');
  document.body.removeChild(textarea);
};

const ClassCard = ({ classData, role = 'teacher', onViewTests, onManageMembers }) => {
  const classQr = classData.classQr ;

  const handleCopyCode = async (e) => {
    e.stopPropagation();
    if (!classQr) return;
    try {
      await copyToClipboard(classQr);
      toast.success('Đã copy mã lớp!');
    } catch (error) {
      toast.error('Copy mã lớp thất bại');
    }
  };

  return (
    <div
      className={cx('class-card', role === 'teacher' ? 'teaching-card' : 'learning-card')}
      onClick={() => onViewTests?.(classData.classId)}
    >
      <div className={cx('class-name')}>{classData.className}</div>

      <div className={cx('info-item')}>
        <IoPersonOutline />
        {role === 'teacher' ? (
          <span>Vai trò: <strong>Giáo viên</strong></span>
        ) : (
          <span>Giáo viên: <strong>{classData.teacherName || 'N/A'}</strong></span>
        )}
      </div>

      <div className={cx('info-item')}>
        <IoPeopleOutline />
        <span>Mã lớp:</span>
        <button
          type="button"
          className={cx('class-id')}
          onClick={handleCopyCode}
          title="Nhấn để copy mã lớp"
        >
          <IoKeyOutline size={14} />
          {classQr}
        </button>
      </div>

      <button className={cx('btn-view')}>
        {role === 'teacher' ? 'Xem các bài test' : 'Làm bài kiểm tra'}
      </button>

      {role === 'teacher' && (
        <button
          className={cx('btn-manage-members')}
          onClick={(e) => {
            e.stopPropagation();
            onManageMembers?.(e, classData.classId);
          }}
        >
          Quản lý học sinh
        </button>
      )}
    </div>
  );
};

export default ClassCard;
