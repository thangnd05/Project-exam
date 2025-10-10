import classNames from 'classnames/bind';
import styles from './ExamStyle.module.scss';
import JoinClassPage from '~/pages/class/JoinClassPage';

const cx = classNames.bind(styles);

export default function ExamPage() {


  return (
    <div className={cx('exam-page')}>
        <JoinClassPage/>
    </div>
  );
}
