'use client';

import { useState } from 'react';
import { Spinner } from 'react-bootstrap';
import { toast } from 'react-toastify';
import classNames from 'classnames/bind';
import { useTranslations } from 'next-intl';
import {
  IoAddOutline,
  IoArrowBackOutline,
  IoCreateOutline,
  IoDocumentTextOutline,
  IoTrashOutline,
} from 'react-icons/io5';

import BaseModal from '@/app/components/modal/BaseModal';
import ButtonPrime from '@/app/components/Button/ButtonPrime';
import { formatDateTime } from '@/app/utils/format-date-time';
import { useNotes } from '@/app/features/notes/hooks/useNotes';
import { useSaveNote } from '@/app/features/notes/hooks/useSaveNote';
import type { NoteResponse } from '@/app/types';
import styles from '@/app/features/notes/NotesPanel.module.scss';

const cx = classNames.bind(styles);

const EMPTY_DRAFT = { title: '', content: '' };

type NotesPanelProps = {
  show: boolean;
  onClose: () => void;
};

function NotesPanel({ show, onClose }: NotesPanelProps) {
  const t = useTranslations('TestTaking.notes');
  const tCommon = useTranslations('Common');
  const [view, setView] = useState<'list' | 'editor'>('list');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState(EMPTY_DRAFT);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);

  const { notes, isLoading, deleteNoteMutation } = useNotes({ enabled: show });
  const saveMutation = useSaveNote();
  const saving = saveMutation.isPending;

  // Đóng panel thì reset về danh sách (điều chỉnh state ngay khi render, không cần effect).
  const [prevShow, setPrevShow] = useState(show);
  if (show !== prevShow) {
    setPrevShow(show);
    if (!show) {
      setView('list');
      setEditingId(null);
      setDraft(EMPTY_DRAFT);
      setConfirmingId(null);
    }
  }

  const openEditor = (note: NoteResponse | null) => {
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
      toast.warning(t('titleRequired'));
      return;
    }

    saveMutation.mutate(
      { noteId: editingId, payload: { title: draft.title.trim(), content: draft.content } },
      {
        onSuccess: () => {
          toast.success(editingId ? t('updated') : t('saved'));
          backToList();
        },
        onError: (err) => {
          console.error(err);
          toast.error(err.response?.data?.message || t('saveError'));
        },
      },
    );
  };

  const handleDelete = (noteId: string) => {
    deleteNoteMutation.mutate(noteId, {
      onSuccess: () => toast.success(t('deleted')),
      onError: (err) => {
        console.error('Lỗi xóa ghi chú:', err);
        toast.error(t('deleteError'));
      },
      onSettled: () => setConfirmingId(null),
    });
  };

  const isEditor = view === 'editor';

  const footer = isEditor ? (
    <>
      <ButtonPrime variant="ghost" size="lg" onClick={backToList} disabled={saving}>
        {tCommon('cancelShort')}
      </ButtonPrime>
      <ButtonPrime variant="primary" size="lg" onClick={handleSave} disabled={saving}>
        {saving ? t('saving') : editingId ? t('saveChanges') : t('saveNote')}
      </ButtonPrime>
    </>
  ) : null;

  return (
    <BaseModal
      show={show}
      onClose={onClose}
      title={isEditor ? (editingId ? t('editNote') : t('newNote')) : t('myNotes')}
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
            {t('backToList')}
          </button>

          <input
            type="text"
            className={cx('titleInput')}
            placeholder={t('titlePlaceholder')}
            value={draft.title}
            maxLength={200}
            onChange={(e) => setDraft((d) => ({ ...d, title: e.target.value }))}
            disabled={saving}
            autoFocus
          />

          <textarea
            className={cx('contentInput')}
            placeholder={t('contentPlaceholder')}
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
            {t('writeNew')}
          </button>

          {isLoading ? (
            <div className={cx('stateBox')}>
              <Spinner animation="border" variant="primary" size="sm" />
              <span>{t('loading')}</span>
            </div>
          ) : notes.length === 0 ? (
            <div className={cx('stateBox', 'empty')}>
              <IoDocumentTextOutline className={cx('emptyIcon')} />
              <span>{t('empty')}</span>
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
                    <p className={cx('notePreview', 'isEmpty')}>{t('noContent')}</p>
                  )}
                  <span className={cx('noteTime')}>{formatDateTime(note.updatedAt)}</span>
                </button>

                {confirmingId === note.noteId ? (
                  <div className={cx('confirmBox')}>
                    <span>{t('confirmDelete')}</span>
                    <button
                      type="button"
                      className={cx('confirmYes')}
                      onClick={() => handleDelete(note.noteId)}
                      disabled={deleteNoteMutation.isPending}
                    >
                      {t('delete')}
                    </button>
                    <button
                      type="button"
                      className={cx('confirmNo')}
                      onClick={() => setConfirmingId(null)}
                    >
                      {tCommon('cancelShort')}
                    </button>
                  </div>
                ) : (
                  <div className={cx('noteActions')}>
                    <button
                      type="button"
                      className={cx('iconBtn')}
                      title={t('editNote')}
                      onClick={() => openEditor(note)}
                    >
                      <IoCreateOutline />
                    </button>
                    <button
                      type="button"
                      className={cx('iconBtn', 'danger')}
                      title={t('deleteNote')}
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
