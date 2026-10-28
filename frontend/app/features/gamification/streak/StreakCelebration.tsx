'use client';

import { Modal } from 'react-bootstrap';
import { motion } from 'framer-motion';
import classNames from 'classnames/bind';
import { useTranslations } from 'next-intl';
import ButtonPrime from '@/app/components/Button/ButtonPrime';
import style from '@/app/features/gamification/streak/StreakCelebration.module.scss';
import { useStreak } from '@/app/features/gamification/streak/hooks/useStreak';
import { Flame } from 'lucide-react';

const cx = classNames.bind(style);

function StreakCelebration() {
  const { currentStreak, justIncreased, clearJustIncreased } = useStreak();
  const t = useTranslations('Gamification.celebration');

  return (
    <Modal
      show={justIncreased}
      onHide={clearJustIncreased}
      centered
      contentClassName={cx('content')}
    >
      <Modal.Body className={cx('body')}>
        <motion.div
          className={cx('flame')}
          initial={{ scale: 0, rotate: -20 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', stiffness: 260, damping: 14 }}
        >
          <Flame size="1em" fill="currentColor" />
        </motion.div>
        <h3 className={cx('count')}>{t('days', { count: currentStreak })}</h3>
        <p className={cx('title')}>{t('title')}</p>
        <p className={cx('subtitle')}>
          {t('subtitle', { count: currentStreak })}
        </p>
        <ButtonPrime variant="streak" className={cx('btn')} onClick={clearJustIncreased}>
          {t('continue')}
        </ButtonPrime>
      </Modal.Body>
    </Modal>
  );
}

export default StreakCelebration;
