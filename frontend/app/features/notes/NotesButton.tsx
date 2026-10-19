'use client';

import { useState } from 'react';
import classNames from 'classnames/bind';

import { useAuth } from '@/app/hooks/useAuth';
import NotesPanel from './NotesPanel';
import styles from './NotesButton.module.scss';
import { FaNoteSticky } from 'react-icons/fa6';

const cx = classNames.bind(styles);

function NotesButton() {
  const { user } = useAuth();
  const [showPanel, setShowPanel] = useState(false);

  if (!user) return null;

  return (
    <>
      <button
        type="button"
        className={cx('notesFab')}
        title="Ghi chú của tôi"
        aria-label="Ghi chú của tôi"
        onClick={() => setShowPanel(true)}
      >
        <FaNoteSticky />
      </button>

      <NotesPanel show={showPanel} onClose={() => setShowPanel(false)} />
    </>
  );
}

export default NotesButton;
