import {useLayoutEffect, useRef} from 'react';
import classNames from 'classnames/bind';
import {motion} from 'framer-motion';
import {useLocation} from 'react-router-dom';
import styles from './DefaultLayout.module.scss';
import Header from '../Header';
import Footer from '../Footer';
import ScrollToTop from '../ScrollToTop';
import MobileBottomNav from '../MobileBottomNav';

const cx = classNames.bind(styles);

function DefaultLayout({
  children,
  noContainer = false,
  hideFooter = false,
  hideScrollToTop = false,
  examMode = false,
}) {
  const location = useLocation();
  const showMobileNav = !hideFooter;
  const flushTop = !examMode && location.pathname === '/';
  const wrapperRef = useRef(null);

  useLayoutEffect(() => {
    const wrapper = wrapperRef.current;
    const header = wrapper?.firstElementChild;
    if (!flushTop || !header) return undefined;

    const apply = () =>
      wrapper.style.setProperty(
        '--header-h',
        `${header.getBoundingClientRect().height}px`,
      );

    apply();
    const observer = new ResizeObserver(apply);
    observer.observe(header);
    return () => observer.disconnect();
  }, [flushTop]);

  return (
    <div
      ref={wrapperRef}
      className={cx('wrapper', {examWrapper: examMode, hasMobileNav: showMobileNav})}
    >
      {!examMode && <Header />}

      <main className={cx('main', {examMode, flushTop})}>
        {examMode ? (
          <div className={cx('pageWrap')}>{noContainer ? children : <div>{children}</div>}</div>
        ) : (
          <motion.div
            key={location.pathname}
            initial={{opacity: 0}}
            animate={{opacity: 1}}
            transition={{duration: 0.2, ease: 'easeOut'}}
            className={cx('pageWrap')}
          >
            {noContainer ? children : <div>{children}</div>}
          </motion.div>
        )}
      </main>

      {!hideFooter && <Footer />}
      {showMobileNav && <MobileBottomNav />}

      {!hideScrollToTop && <ScrollToTop />}
    </div>
  );
}

export default DefaultLayout;
