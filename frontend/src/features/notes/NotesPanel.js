'use client';

import { useEffect, useState } from 'react';
import { Spinner } from 'react-bootstrap';
import { toast } from 'react-toastify';
import classNames from 'classnames/bind';
import {
  IoAddOutline,
  IoArrowBackOutline,
  IoCreateOutline,
  IoDocumentTextOutline,
  IoTrashOutline,
} from 'react-icons/io5';

import BaseModal from '~/shared/ui/modal/BaseModal';
import ButtonPrime from '~/shared/ui/Button/ButtonPrime';
import { formatDateTime } from '~/shared/utils/format-date-time';
import { useNotes } from '~/features/notes/hooks/useNotes';
import { useSaveNote } from '~/features/notes/hooks/useSaveNote';
import styles from './NotesPanel.module.scss';

const cx = classNames.bind(styles);

const EMPTY_DRAFT = { title: '', content: '' };

function NotesPanel({ show, onClose }) {
  const [view, setView] = useState('list');
  const [editingId, setEditingId] = useState(null);
  const [draft, setDraft] = useState(EMPTY_DRAFT);
  const [confirmingId, setConfirmingId] = useState(null);

  const { notes, isLoading, deleteNoteMutation } = useNotes({ enabled: show });
  const saveMutation = useSaveNote();
  const saving = saveMutation.isPending;

  useEffect(() => {
    if (show) return;
    setView('list');
    setEditingId(null);
    setDraft(EMPTY_DRAFT);
    setConfirmingId(null);
  }, [show]);

  const openEditor = (note) => {
    setEditingId(note?.noteId ?? null);
    setDraft({ title: note?.title ?? '', content: note?.content ?? '' });
    setConfirmingId(null);
    setView('editor');
  };

  const backToList = () => {
    setView('list');
    setEditingId(null);
    setDraft(EMPTY_DRAFT);
  };

  const handleSave = () => {
    if (!draft.title.trim()) {
      toast.warning('Vui lòng nhập tiêu đề ghi chú!');
      return;
    }

    saveMutation.mutate(
      { noteId: editingId, payload: { title: draft.title.trim(), content: draft.content } },
      {
        onSuccess: () => {
          toast.success(editingId ? 'Đã cập nhật ghi chú!' : 'Đã lưu ghi chú!');
          backToList();
        },
        onError: (err) => {
          console.error(err);
          toast.error(err.response?.data?.message || 'Có lỗi xảy ra khi lưu ghi chú!');
        },
      },
    );
  };

  const handleDelete = (noteId) => {
    deleteNoteMutation.mutate(noteId, {
      onSuccess: () => toast.success('Đã xóa ghi chú!'),
      onError: (err) => {
        console.error('Lỗi xóa ghi chú:', err);
        toast.error('Có lỗi xảy ra khi xóa ghi chú!');
      },
      onSettled: () => setConfirmingId(null),
    });
  };

  const isEditor = view === 'editor';

  const footer = isEditor ? (
    <>
      <ButtonPrime variant="ghost" size="lg" onClick={backToList} disabled={saving}>
        Hủy
      </ButtonPrime>
      <ButtonPrime variant="primary" size="lg" onClick={handleSave} disabled={saving}>
        {saving ? 'Đang lưu...' : editingId ? 'Lưu thay đổi' : 'Lưu ghi chú'}
      </ButtonPrime>
    </>
  ) : null;

  return (
    <BaseModal
      show={show}
      onClose={onClose}
      title={isEditor ? (editingId ? 'Sửa ghi chú' : 'Ghi chú mới') : 'Ghi chú của tôi'}
      headerExtra={
        !isEditor && notes.length > 0 ? (
          <span className={cx('countBadge')}>{notes.length}</span>
        ) : null
      }
      footer={footer}
      maxWidth={720}
    >
      {isEditor ? (
        <div className={cx('editor')}>
          <button type="button" className={cx('backBtn')} onClick={backToList}>
            <IoArrowBackOutline />
            Về danh sách
          </button>

          <input
            type="text"
            className={cx('titleInput')}
            placeholder="Tiêu đề ghi chú"
            value={draft.title}
            maxLength={200}
            onChange={(e) => setDraft((d) => ({ ...d, title: e.target.value }))}
            disabled={saving}
            autoFocus
          />

          <textarea
            className={cx('contentInput')}
            placeholder="Viết lại điều bạn cần nhớ..."
            value={draft.content}
            maxLength={20000}
            onChange={(e) => setDraft((d) => ({ ...d, content: e.target.value }))}
            disabled={saving}
            rows={12}
          />
        </div>
      ) : (
        <div className={cx('list')}>
          <button type="button" className={cx('newBtn')} onClick={() => openEditor(null)}>
            <IoAddOutline />
            Viết ghi chú mới
          </button>

          {isLoading ? (
            <div className={cx('stateBox')}>
              <Spinner animation="border" variant="primary" size="sm" />
              <span>Đang mở sổ tay...</span>
            </div>
          ) : notes.length === 0 ? (
            <div className={cx('stateBox', 'empty')}>
              <IoDocumentTextOutline className={cx('emptyIcon')} />
              <span>Sổ tay còn trống  ghi lại điều bạn hay quên nhé.</span>
            </div>
          ) : (
            notes.map((note) => (
              <article key={note.noteId} className={cx('noteRow')}>
                <button
                  type="button"
                  className={cx('noteMain')}
                  onClick={() => openEditor(note)}
                >
                  <h4 className={cx('noteTitle')}>{note.title}</h4>
                  {note.content ? (
                    <p className={cx('notePreview')}>{note.content}</p>
                  ) : (
                    <p className={cx('notePreview', 'isEmpty')}>Chưa có nội dung</p>
                  )}
                  <span className={cx('noteTime')}>{formatDateTime(note.updatedAt)}</span>
                </button>

                {confirmingId === note.noteId ? (
                  <div className={cx('confirmBox')}>
                    <span>Xóa?</span>
                    <button
                      type="button"
                      className={cx('confirmYes')}
                      onClick={() => handleDelete(note.noteId)}
                      disabled={deleteNoteMutation.isPending}
                    >
                      Xóa
                    </button>
                    <button
                      type="button"
                      className={cx('confirmNo')}
                      onClick={() => setConfirmingId(null)}
                    >
                      Hủy
                    </button>
                  </div>
                ) : (
                  <div className={cx('noteActions')}>
                    <button
                      type="button"
                      className={cx('iconBtn')}
                      title="Sửa ghi chú"
                      onClick={() => openEditor(note)}
                    >
                      <IoCreateOutline />
                    </button>
                    <button
                      type="button"
                      className={cx('iconBtn', 'danger')}
                      title="Xóa ghi chú"
                      onClick={() => setConfirmingId(note.noteId)}
                    >
                      <IoTrashOutline />
                    </button>
                  </div>
                )}
              </article>
            ))
          )}
        </div>
      )}
    </BaseModal>
  );
}

export default NotesPanel;
