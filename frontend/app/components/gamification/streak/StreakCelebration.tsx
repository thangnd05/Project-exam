'use client';

import { Modal, Button } from 'react-bootstrap';
import { motion } from 'framer-motion';
import classNames from 'classnames/bind';
import style from './StreakCelebration.module.scss';
import { useStreak } from '@/app/hooks/useStreak';
import { FaFire } from 'react-icons/fa6';

const cx = classNames.bind(style);

function StreakCelebration() {
  const { currentStreak, justIncreased, clearJustIncreased } = useStreak();

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
          <FaFire />
        </motion.div>
        <h3 className={cx('count')}>{currentStreak} ngày</h3>
        <p className={cx('title')}>Giữ lửa thành công!</p>
        <p className={cx('subtitle')}>
          Bạn đã học {currentStreak} ngày liên tiếp. Quay lại ngày mai để nối dài chuỗi nhé!
        </p>
        <Button className={cx('btn')} onClick={clearJustIncreased}>
          Tiếp tục
        </Button>
      </Modal.Body>
    </Modal>
  );
}

export default StreakCelebration;
