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

  return (
    <div className={cx('wrapper', {examWrapper: examMode, hasMobileNav: showMobileNav})}>
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
      {/* Sổ tay ghi chú (features/notes) tạm ẩn khỏi giao diện — API và bảng
          `notes` vẫn còn. Bật lại bằng cách mở import NotesButton ở đầu file rồi
          bỏ comment dòng dưới; đặt cùng điều kiện với nút cuộn lên để trang làm
          bài / học ải không bị nút nổi che nội dung. */}
      {/* {!hideScrollToTop && <NotesButton />} */}
      {!hideScrollToTop && <ScrollToTop />}
    </div>
  );
}

export default DefaultLayout;
