'use client';

import { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faNoteSticky } from '@fortawesome/free-solid-svg-icons';
import classNames from 'classnames/bind';

import { useAuth } from '~/shared/hooks/useAuth';
import NotesPanel from './NotesPanel';
import styles from './NotesButton.module.scss';

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
        <FontAwesomeIcon icon={faNoteSticky} />
      </button>

      <NotesPanel show={showPanel} onClose={() => setShowPanel(false)} />
    </>
  );
}

export default NotesButton;
