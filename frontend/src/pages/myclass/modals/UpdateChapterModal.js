import {useEffect, useState} from 'react';
import { updateChapter } from '~/api/chapterApi';
import {toast} from 'react-toastify';
import classNames from 'classnames/bind';
import {IoBookOutline} from 'react-icons/io5';
import CommonFormModal from '~/components/common/modal/CommonFormModal';
import ModalActionFooter from '~/components/common/modal/ModalActionFooter';
import commonModalStyles from '~/components/common/modal/CommonFormModal.module.scss';

const cx = classNames.bind(commonModalStyles);

function UpdateChapterModal({show, onClose, chapter, classId, onSuccess}) {
  const [submitting, setSubmitting] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');

  useEffect(() => {
    if (!chapter) {
      setTitle('');
      setDescription('');
      return;
    }

    setTitle(chapter.title || '');
    setDescription(chapter.description || '');
  }, [chapter, show]);

  const handleSubmit = async () => {
    if (!chapter?.chapterId) {
      return;
    }

    if (!title.trim()) {
      toast.warning('Vui lòng nhập tên chương.');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        classId: String(classId),
        title: title.trim(),
        description: description.trim(),
      };
      await updateChapter(chapter.chapterId, payload);
      toast.success('Cập nhật chương thành công!');
      onClose();
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      toast.error(
        error.response?.data?.message || 'Không thể cập nhật chương. Vui lòng thử lại.',
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <CommonFormModal
      show={show}
      onHide={onClose}
      title="Chỉnh sửa chương"
      icon={IoBookOutline}
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
