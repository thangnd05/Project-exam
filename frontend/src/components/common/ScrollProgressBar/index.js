import React, { useEffect, useState } from 'react';
import classNames from 'classnames/bind';
import styles from './ScrollProgressBar.module.scss';

const cx = classNames.bind(styles);

function ScrollProgressBar() {
  const [scrollProgress, setScrollProgress] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (totalHeight === 0) {
        setScrollProgress(0);
        return;
      }
      const progress = (window.scrollY / totalHeight) * 100;
      setScrollProgress(progress);
    };

    window.addEventListener('scroll', handleScroll);

    handleScroll();

    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className={cx('progressBarContainer')}>
      <div
        className={cx('progressBar')}
        style={{ width: `${scrollProgress}%` }}
      />
    </div>
  );
}

export default ScrollProgressBar;
