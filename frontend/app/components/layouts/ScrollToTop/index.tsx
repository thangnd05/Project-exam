'use client';

import {useEffect, useState} from 'react';
import classNames from 'classnames/bind';
import ButtonPrime from '@/app/components/Button/ButtonPrime';
import styles from './ScrollToTop.module.scss';
import { ArrowUp } from 'lucide-react';
import { useTranslations } from 'next-intl';

const cx = classNames.bind(styles);

function ScrollToTop() {
  const t = useTranslations('Layout');
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
    <ButtonPrime
      variant="brand"
      size="icon"
      className={cx('scrollTopBtn', {visible: showScroll})}
      onClick={scrollToTop}
      aria-label={t('scrollToTop')}
      aria-hidden={!showScroll}
      tabIndex={showScroll ? 0 : -1}
    >
      <ArrowUp size={20} />
    </ButtonPrime>
  );
}

export default ScrollToTop;
