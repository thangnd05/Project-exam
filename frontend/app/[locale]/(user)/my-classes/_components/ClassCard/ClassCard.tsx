'use client';

import { IoPeopleOutline, IoKeyOutline, IoPersonOutline } from 'react-icons/io5';
import { useTranslations } from 'next-intl';
import classNames from 'classnames/bind';
import { toast } from 'react-toastify';
import styles from './ClassCard.module.scss';
import type { ClassStudentResponse } from '@/app/types';

const cx = classNames.bind(styles);

const copyToClipboard = async (text: string) => {
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

type ClassCardProps = {
  classData: ClassStudentResponse;
  role?: 'teacher' | 'student';
  onViewTests?: (classId: string) => void;
  onManageMembers?: (e: React.MouseEvent, classId: string) => void;
};

const ClassCard = ({ classData, role = 'teacher', onViewTests, onManageMembers }: ClassCardProps) => {
  const t = useTranslations('Classes');
  const classQr = classData.classQr ;

  const handleCopyCode = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!classQr) return;
    try {
      await copyToClipboard(classQr);
      toast.success(t('classCard.copied'));
    } catch {
      toast.error(t('classCard.copyFailed'));
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
          <span>{t.rich('classCard.role', { strong: (chunks) => <strong>{chunks}</strong> })}</span>
        ) : (
          <span>{t.rich('classCard.teacherName', { name: classData.teacherName || 'N/A', strong: (chunks) => <strong>{chunks}</strong> })}</span>
        )}
      </div>

      <div className={cx('info-item')}>
        <IoPeopleOutline />
        <span>{t('classCard.classCode')}</span>
        <button
          type="button"
          className={cx('class-id')}
          onClick={handleCopyCode}
          title={t('classCard.copyTitle')}
        >
          <IoKeyOutline size={14} />
          {classQr}
        </button>
      </div>

      <button className={cx('btn-view')}>
        {role === 'teacher' ? t('classCard.viewTests') : t('classCard.takeTests')}
      </button>

      {role === 'teacher' && (
        <button
          className={cx('btn-manage-members')}
          onClick={(e) => {
            e.stopPropagation();
            onManageMembers?.(e, classData.classId);
          }}
        >
          {t('common.manageStudents')}
        </button>
      )}
    </div>
  );
};

export default ClassCard;
