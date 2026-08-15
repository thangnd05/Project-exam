'use client';

import { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faNoteSticky } from '@fortawesome/free-solid-svg-icons';
import classNames from 'classnames/bind';

import { useAuth } from '@/app/hooks/useAuth';
import NotesPanel from './NotesPanel';
import styles from './NotesButton.module.scss';

const cx = classNames.bind(styles);

// Lệch version fontawesome-common-types giữa react-fontawesome@0.1.19 và icon pack 6.x.
const Icon = FontAwesomeIcon as React.ComponentType<any>;

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
        <Icon icon={faNoteSticky} />
      </button>

      <NotesPanel show={showPanel} onClose={() => setShowPanel(false)} />
    </>
  );
}

export default NotesButton;
