import { IoCheckmarkCircleOutline } from 'react-icons/io5';
import classNames from 'classnames/bind';

import styles from '../../TestStartPage.module.scss';

const cx = classNames.bind(styles);

function ProgressBlock({ answered, total }) {
  return (
    <div className={cx('exam-stat', 'exam-stat-done')}>
      <IoCheckmarkCircleOutline aria-hidden />
      <span className={cx('exam-stat-value')}>
        {answered}/{total}
      </span>
    </div>
  );
}

export default ProgressBlock;
