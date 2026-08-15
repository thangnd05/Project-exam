'use client';

import { usePathname } from 'next/navigation';
import {useEffect} from 'react';

const ScrollHandler = () => {
  const pathname = usePathname();

  useEffect(() => {
    const saveScrollPosition = () => {
      sessionStorage.setItem('scroll_' + pathname, String(window.scrollY));
    };

    return () => {
      saveScrollPosition();
    };
  }, [pathname]);

  useEffect(() => {
    const scrollPosition = sessionStorage.getItem(
      'scroll_' + pathname,
    );

    if (scrollPosition !== null) {
      window.scrollTo(0, parseInt(scrollPosition, 10));
    } else {
      window.scrollTo(0, 0);
    }
  }, [pathname]);

  return null;
};

export default ScrollHandler;
