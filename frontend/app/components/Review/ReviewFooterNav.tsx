'use client';

import { useState } from 'react';
import { Container } from 'react-bootstrap';
import classNames from 'classnames/bind';
import { IoCheckmarkCircleOutline, IoCloseOutline, IoListOutline } from 'react-icons/io5';
import styles from '@/app/assets/styles/ReviewFooter.module.scss';

const cx = classNames.bind(styles);

// Item dựng từ data API (chưa có type riêng) -> id để any có chủ đích.
type ReviewFooterNavItem = {
  id: any;
  status?: string;
};

type ReviewFooterNavProps = {
  items?: ReviewFooterNavItem[];
  correctCount?: number;
  onSelect?: (id: any) => void;
};

function ReviewFooterNav({ items = [], correctCount = 0, onSelect }: ReviewFooterNavProps) {
  const [open, setOpen] = useState(false);

  if (items.length === 0) return null;

  const pick = (id: any) => {
    onSelect?.(id);
    setOpen(false);
  };

  return (
    <div className={cx('footerActions')}>
      {open && (
        <div className={cx('footerPanel')}>
          <div className={cx('navCard')}>
            <div className={cx('navHeader')}>
              <IoListOutline />
              <span>Danh sách câu hỏi</span>
            </div>
            <div className={cx('navGrid')}>
              {items.map((item, idx) => (
                <button
                  key={item.id}
                  type="button"
                  className={cx('navItem', item.status)}
                  onClick={() => pick(item.id)}
                  aria-label={`Câu ${idx + 1}`}
                >
                  {idx + 1}
                </button>
              ))}
            </div>
            <div className={cx('navLegend')}>
              <span className={cx('legendItem')}>
                <span className={cx('dot', 'correct')} /> Đúng
              </span>
              <span className={cx('legendItem')}>
                <span className={cx('dot', 'incorrect')} /> Sai
              </span>
              <span className={cx('legendItem')}>
                <span className={cx('dot', 'unanswered')} /> Chưa làm
              </span>
            </div>
          </div>
        </div>
      )}
      <div className={cx('footerButtons')}>
        <Container className={cx('footerButtonsInner')}>
          <button
            type="button"
            className={cx('btnToggleInfo', { active: open })}
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
          >
            {open ? <IoCloseOutline size={22} /> : <IoListOutline size={22} />}
            <span>{open ? 'Ẩn' : 'Danh sách câu'}</span>
          </button>
          <div className={cx('footerScore')}>
            <IoCheckmarkCircleOutline aria-hidden />
            <span>
              {correctCount}/{items.length} câu đúng
            </span>
          </div>
        </Container>
      </div>
    </div>
  );
}

export default ReviewFooterNav;
