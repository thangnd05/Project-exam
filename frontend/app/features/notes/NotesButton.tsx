'use client';

import { useState } from 'react';
import classNames from 'classnames/bind';
import { useTranslations } from 'next-intl';

import { useAuth } from '@/app/hooks/useAuth';
import NotesPanel from '@/app/features/notes/NotesPanel';
import styles from '@/app/features/notes/NotesButton.module.scss';
import { FaNoteSticky } from 'react-icons/fa6';

const cx = classNames.bind(styles);

function NotesButton() {
  const { user } = useAuth();
  const [showPanel, setShowPanel] = useState(false);
  const t = useTranslations('TestTaking.notes');

  if (!user) return null;

  return (
    <>
      <button
        type="button"
        className={cx('notesFab')}
        title={t('myNotes')}
        aria-label={t('myNotes')}
        onClick={() => setShowPanel(true)}
      >
        <FaNoteSticky />
      </button>

      <NotesPanel show={showPanel} onClose={() => setShowPanel(false)} />
    </>
  );
}

export default NotesButton;
