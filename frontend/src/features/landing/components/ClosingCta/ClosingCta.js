import classNames from 'classnames/bind';
import styles from './ClosingCta.module.scss';

const cx = classNames.bind(styles);

export default function ClosingCta() {
  const handleClick = () => {
    document.getElementById('hero')?.scrollIntoView({behavior: 'smooth'});
  };

  return (
    <section className={cx('section')} aria-label="Bắt đầu">
      <div className={cx('glow')} aria-hidden="true" />
      <div className={cx('inner')}>
        <p className={cx('eyebrow')}>Bắt đầu hôm nay</p>
        <h2 className={cx('title')}>
          Đừng luyện
          <br />
          <em>mù quáng</em>
          <span> nữa.</span>
        </h2>
        <p className={cx('desc')}>
          Biết mình yếu chỗ nào — rồi mới ôn. Đó là cách WinDe hoạt động.
        </p>
        <button type="button" className={cx('cta')} onClick={handleClick}>
          Quay lên bắt đầu
        </button>
      </div>
    </section>
  );
}
