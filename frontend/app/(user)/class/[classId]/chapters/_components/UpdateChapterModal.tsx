'use client';

import {useEffect, useState} from 'react';
import { useUpdateChapter } from '../_hooks/useChaptersOfClass';
import {toast} from 'react-toastify';
import classNames from 'classnames/bind';
import CommonFormModal from '@/app/components/modal/CommonFormModal';
import ModalActionFooter from '@/app/components/modal/ModalActionFooter';
import commonModalStyles from '@/app/components/modal/CommonFormModal.module.scss';
import type { ChapterResponse } from '@/app/types';

const cx = classNames.bind(commonModalStyles);

type UpdateChapterModalProps = {
  show: boolean;
  onClose: () => void;
  chapter?: ChapterResponse | null;
  classId: string;
  onSuccess?: () => void;
};

function UpdateChapterModal({show, onClose, chapter, classId, onSuccess}: UpdateChapterModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const updateMutation = useUpdateChapter(classId);
  const submitting = updateMutation.isPending;

  useEffect(() => {
    if (!chapter) {
      setTitle('');
      setDescription('');
      return;
    }

    setTitle(chapter.title || '');
    setDescription(chapter.description || '');
  }, [chapter, show]);

  const handleSubmit = () => {
    if (!chapter?.chapterId) {
      return;
    }

    if (!title.trim()) {
      toast.warning('Vui lòng nhập tên chương.');
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
          toast.success('Cập nhật chương thành công!');
          onClose();
          onSuccess?.();
        },
        onError: (error) => {
          toast.error(
            error.response?.data?.message || 'Không thể cập nhật chương. Vui lòng thử lại.',
          );
        },
      },
    );
  };

  return (
    <CommonFormModal
      show={show}
      onHide={onClose}
      title="Chỉnh sửa chương"
      footer={
        <ModalActionFooter
          cancelLabel="Hủy"
          submitLabel="Lưu thay đổi"
          loadingLabel="Đang lưu..."
          loading={submitting}
          onCancel={onClose}
          onSubmit={handleSubmit}
        />
      }
    >
      <div className={cx('formGroup')}>
        <label className={cx('label')} htmlFor="chapterTitle">
          Tên chương
        </label>
        <input
          id="chapterTitle"
          className={cx('inputControl')}
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="Nhập tên chương"
          disabled={submitting}
          autoFocus
        />
      </div>

      <div className={cx('formGroup')}>
        <label className={cx('label')} htmlFor="chapterDescription">
          Mô tả
        </label>
        <textarea
          id="chapterDescription"
          className={cx('inputControl', 'textarea')}
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          placeholder="Nhập mô tả chương (không bắt buộc)"
          disabled={submitting}
          rows={3}
        />
      </div>
    </CommonFormModal>
  );
}

export default UpdateChapterModal;
