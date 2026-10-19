'use client';

import {useEffect, useRef, useState} from 'react';
import type {ReactNode} from 'react';
import {Overlay, Popover} from 'react-bootstrap';
import classNames from 'classnames/bind';
import styles from './FirstTimeHint.module.scss';

const cx = classNames.bind(styles);

const STORAGE_PREFIX = 'winde:hint-seen:';
const SHOW_DELAY_MS = 800;

type FirstTimeHintProps = {
  /** Khóa riêng cho từng gợi ý; đã bấm "Đã hiểu" thì không hiện lại trên trình duyệt này. */
  hintKey: string;
  title: string;
  body: ReactNode;
  placement?: 'top' | 'bottom' | 'left' | 'right';
  enabled?: boolean;
  children: ReactNode;
};

const hasSeen = (hintKey: string) => {
  try {
    return window.localStorage.getItem(STORAGE_PREFIX + hintKey) === '1';
  } catch {
    return true;
  }
};

const markSeen = (hintKey: string) => {
  try {
    window.localStorage.setItem(STORAGE_PREFIX + hintKey, '1');
  } catch {
    // localStorage bị chặn: gợi ý có thể hiện lại lần sau, không sao.
  }
};

function FirstTimeHint({hintKey, title, body, placement = 'bottom', enabled = true, children}: FirstTimeHintProps) {
  const targetRef = useRef<HTMLSpanElement>(null);
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (!enabled || hasSeen(hintKey)) return;
    const timer = window.setTimeout(() => {
      // Header render cùng lúc bản mobile và desktop; chỉ gắn gợi ý vào bản đang hiện.
      if (targetRef.current?.offsetParent && !hasSeen(hintKey)) setShow(true);
    }, SHOW_DELAY_MS);
    return () => window.clearTimeout(timer);
  }, [enabled, hintKey]);

  const dismiss = () => {
    markSeen(hintKey);
    setShow(false);
  };

  return (
    <>
      <span ref={targetRef} className={cx('target')}>
        {children}
      </span>
      <Overlay target={targetRef} show={show} placement={placement} rootClose onHide={dismiss}>
        <Popover id={`hint-${hintKey}`} className={cx('popover')}>
          <Popover.Body>
            <p className={cx('title')}>{title}</p>
            <div className={cx('body')}>{body}</div>
            <button type="button" className={cx('okBtn')} onClick={dismiss}>
              Đã hiểu
            </button>
          </Popover.Body>
        </Popover>
      </Overlay>
    </>
  );
}

export default FirstTimeHint;
