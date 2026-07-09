import classNames from 'classnames/bind';
import {motion} from 'framer-motion';
import {useLocation} from 'react-router-dom';
import styles from './DefaultLayout.module.scss';
import Header from '../Header';
import Footer from '../Footer';
import ScrollToTop from '../ScrollToTop';
import MobileBottomNav from '../MobileBottomNav';
import BackgroundDecor from '~/shared/ui/BackgroundDecor';

const cx = classNames.bind(styles);

function DefaultLayout({
  children,
  noContainer = false,
  hideFooter = false,
  hideScrollToTop = false,
}) {
  const location = useLocation();
  const showMobileNav = !hideFooter;

  return (
    <div className={cx('wrapper', {examWrapper: hideFooter, hasMobileNav: showMobileNav})}>
      <BackgroundDecor />
      <Header />

      <main className={cx('main', { examMode: hideFooter })}>
        {hideFooter ? (
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
