'use client';

import {useState} from 'react';
import {useTranslations} from 'next-intl';
import { useUpdateChapter } from '@/app/[locale]/(user)/class/[classId]/chapters/_hooks/useChaptersOfClass';
import {toast} from 'react-toastify';
import classNames from 'classnames/bind';
import CommonFormModal from '@/app/components/modal/CommonFormModal';
import ModalActionFooter from '@/app/components/modal/ModalActionFooter';
import commonModalStyles from '@/app/components/modal/CommonFormModal.module.scss';
import type { ChapterResponse } from '@/app/types';
import { getApiErrorMessage } from '@/app/utils/apiError';

const cx = classNames.bind(commonModalStyles);

type UpdateChapterModalProps = {
  show: boolean;
  onClose: () => void;
  chapter?: ChapterResponse | null;
  classId: string;
  onSuccess?: () => void;
};

function UpdateChapterModal({show, onClose, chapter, classId, onSuccess}: UpdateChapterModalProps) {
  const t = useTranslations('Classes');
  const tCommon = useTranslations('Common');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const updateMutation = useUpdateChapter(classId);
  const submitting = updateMutation.isPending;

  // Mỗi lần mở modal (hoặc đổi chương cần sửa) thì nạp lại form (điều chỉnh state ngay khi render).
  const seedKey = show ? (chapter ?? null) : null;
  const [seededFor, setSeededFor] = useState<ChapterResponse | null>(null);
  if (seedKey !== seededFor) {
    setSeededFor(seedKey);
    if (seedKey) {
      setTitle(seedKey.title || '');
      setDescription(seedKey.description || '');
    }
  }

  const handleSubmit = () => {
    if (!chapter?.chapterId) {
      return;
    }

    if (!title.trim()) {
      toast.warning(t('updateChapter.titleRequired'));
      return;
    }

    updateMutation.mutate(
      {
        chapterId: chapter.chapterId,
        payload: {
          classId: String(classId),
          title: title.trim(),
          description: description.trim(),
        },
      },
      {
        onSuccess: () => {
          toast.success(t('updateChapter.success'));
          onClose();
          onSuccess?.();
        },
        onError: (error) => {
          toast.error(
            getApiErrorMessage(error, t('updateChapter.error')),
          );
        },
      },
    );
  };

  return (
    <CommonFormModal
      show={show}
      onHide={onClose}
      title={t('updateChapter.title')}
      footer={
        <ModalActionFooter
          cancelLabel={tCommon('cancelShort')}
          submitLabel={t('common.saveChanges')}
          loadingLabel={t('updateChapter.saving')}
          loading={submitting}
          onCancel={onClose}
          onSubmit={handleSubmit}
        />
      }
    >
      <div className={cx('formGroup')}>
        <label className={cx('label')} htmlFor="chapterTitle">
          {t('common.chapterName')}
        </label>
        <input
          id="chapterTitle"
          className={cx('inputControl')}
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder={t('updateChapter.namePlaceholder')}
          disabled={submitting}
          autoFocus
        />
      </div>

      <div className={cx('formGroup')}>
        <label className={cx('label')} htmlFor="chapterDescription">
          {t('common.description')}
        </label>
        <textarea
          id="chapterDescription"
          className={cx('inputControl', 'textarea')}
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          placeholder={t('updateChapter.descriptionPlaceholder')}
          disabled={submitting}
          rows={3}
        />
      </div>
    </CommonFormModal>
  );
}

export default UpdateChapterModal;
