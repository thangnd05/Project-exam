'use client';

import {useEffect, useState} from 'react';
import classNames from 'classnames/bind';
import styles from './ScrollToTop.module.scss';
import {FontAwesomeIcon} from '@fortawesome/react-fontawesome';
import {faArrowUp} from '@fortawesome/free-solid-svg-icons';

const cx = classNames.bind(styles);

function ScrollToTop() {
  const [showScroll, setShowScroll] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setShowScroll(window.scrollY > 200);
    };

    handleScroll();
    window.addEventListener('scroll', handleScroll, {passive: true});
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({top: 0, behavior: 'smooth'});
  };

  return (
    <button
      type="button"
      className={cx('scrollTopBtn', {visible: showScroll})}
      onClick={scrollToTop}
      aria-label="Lên đầu trang"
      aria-hidden={!showScroll}
      tabIndex={showScroll ? 0 : -1}
    >
      <FontAwesomeIcon icon={faArrowUp} />
    </button>
  );
}

export default ScrollToTop;
