'use client';

import { useState } from 'react';
import { Container } from 'react-bootstrap';
import classNames from 'classnames/bind';
import { useTranslations } from 'next-intl';
import { IoCheckmarkCircleOutline, IoCloseOutline, IoListOutline } from 'react-icons/io5';
import styles from '@/app/assets/styles/ReviewFooter.module.scss';

const cx = classNames.bind(styles);

type ReviewFooterNavItem = {
  id: string;
  status?: string;
};

type ReviewFooterNavProps = {
  items?: ReviewFooterNavItem[];
  correctCount?: number;
  onSelect?: (id: string) => void;
};

function ReviewFooterNav({ items = [], correctCount = 0, onSelect }: ReviewFooterNavProps) {
  const [open, setOpen] = useState(false);
  const t = useTranslations('TestTaking.review');

  if (items.length === 0) return null;

  const pick = (id: string) => {
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
              <span>{t('questionList')}</span>
            </div>
            <div className={cx('navGrid')}>
              {items.map((item, idx) => (
                <button
                  key={item.id}
                  type="button"
                  className={cx('navItem', item.status)}
                  onClick={() => pick(item.id)}
                  aria-label={t('questionLabel', { number: idx + 1 })}
                >
                  {idx + 1}
                </button>
              ))}
            </div>
            <div className={cx('navLegend')}>
              <span className={cx('legendItem')}>
                <span className={cx('dot', 'correct')} /> {t('legend.correct')}
              </span>
              <span className={cx('legendItem')}>
                <span className={cx('dot', 'incorrect')} /> {t('legend.incorrect')}
              </span>
              <span className={cx('legendItem')}>
                <span className={cx('dot', 'unanswered')} /> {t('legend.unanswered')}
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
            <span>{open ? t('hide') : t('showList')}</span>
          </button>
          <div className={cx('footerScore')}>
            <IoCheckmarkCircleOutline aria-hidden />
            <span>
              {t('correctCount', { correct: correctCount, total: items.length })}
            </span>
          </div>
        </Container>
      </div>
    </div>
  );
}

export default ReviewFooterNav;
