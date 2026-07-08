import {useEffect, useState} from 'react';
import {createPortal} from 'react-dom';
import {Link, useLocation, useNavigate} from 'react-router-dom';
import {FontAwesomeIcon} from '@fortawesome/react-fontawesome';
import {
  faBook,
  faHome,
  faNewspaper,
  faPlus,
  faUser,
  faXmark,
} from '@fortawesome/free-solid-svg-icons';
import classNames from 'classnames/bind';

import styles from './MobileBottomNav.module.scss';
import routes from '~/config/Routes';
import {useAuth} from '~/hooks/useAuth';
import {useCosmetics} from '~/hooks/useCosmetics';
import images from '~/assets/images';
import JoinClassModal from '~/pages/myclass/modals/JoinClassModal';
import CreateClassModal from '~/pages/myclass/modals/CreateClassModal';
import CreateTestModal from '~/components/test/CreateTestModal';
import StreakBadge from '~/components/streak/StreakBadge';
import CoinQuestMenu from '~/components/coin/CoinQuestMenu';
import AvatarWithCosmetic from '~/components/cosmetic/AvatarWithCosmetic';

const cx = classNames.bind(styles);

const HIDDEN_PREFIXES = [
  '/login',
  '/forgot',
  '/reset',
  '/verify',
  '/oauth2',
  '/admin',
];

function isHiddenRoute(pathname) {
  return HIDDEN_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}

function MobileBottomNav() {
  const {pathname} = useLocation();
  const navigate = useNavigate();
  const {user, logout} = useAuth();
  const {frame: cosmeticFrame, badge: cosmeticBadge} = useCosmetics();
  const [showMore, setShowMore] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [showCreateClassModal, setShowCreateClassModal] = useState(false);
  const [showCreateTestModal, setShowCreateTestModal] = useState(false);

  const hidden = isHiddenRoute(pathname);

  useEffect(() => {
    if (!showMore) return undefined;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e) => e.key === 'Escape' && setShowMore(false);
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener('keydown', onKey);
    };
  }, [showMore]);

  if (hidden) return null;

  const isHomeActive =
    pathname === routes.home || pathname.startsWith('/exam-types');
  const isPostsActive = pathname.startsWith('/posts');
  const isVocabActive =
    pathname.startsWith('/my-albums') ||
    pathname.startsWith('/albums/') ||
    pathname.startsWith('/practice/');
  const isProfileActive = pathname.startsWith('/profile');

  const handleCreateTest = () => {
    if (!user) {
      navigate(routes.login);
      return;
    }
    setShowCreateTestModal(true);
  };

  const handleClassAction = (modalType, targetRoute) => {
    if (!user) {
      navigate(routes.login);
      setShowMore(false);
      return;
    }
    if (modalType === 'join') {
      setShowJoinModal(true);
    } else if (modalType === 'create') {
      setShowCreateClassModal(true);
    } else if (targetRoute) {
      navigate(targetRoute);
    }
    setShowMore(false);
  };

  const handleLogout = async () => {
    await logout();
    setShowMore(false);
    navigate(routes.home);
  };

  return (
    <>
      <nav className={cx('bottomNav')} aria-label="Điều hướng chính">
        <Link
          to={routes.home}
          className={cx('tab', {active: isHomeActive})}
          aria-current={isHomeActive ? 'page' : undefined}
        >
          <FontAwesomeIcon icon={faHome} className={cx('tabIcon')} />
          <span className={cx('tabLabel')}>Trang chủ</span>
        </Link>

        <Link
          to={routes.posts}
          className={cx('tab', {active: isPostsActive})}
          aria-current={isPostsActive ? 'page' : undefined}
        >
          <FontAwesomeIcon icon={faNewspaper} className={cx('tabIcon')} />
          <span className={cx('tabLabel')}>Bài viết</span>
        </Link>

        <button
          type="button"
          className={cx('createBtn')}
          onClick={handleCreateTest}
          aria-label="Tạo bài kiểm tra"
        >
          <FontAwesomeIcon icon={faPlus} />
        </button>

        <Link
          to={routes.myAlbums}
          className={cx('tab', {active: isVocabActive})}
          aria-current={isVocabActive ? 'page' : undefined}
        >
          <FontAwesomeIcon icon={faBook} className={cx('tabIcon')} />
          <span className={cx('tabLabel')}>Từ vựng</span>
        </Link>

        <button
          type="button"
          className={cx('tab', {active: showMore || isProfileActive})}
          onClick={() => setShowMore(true)}
          aria-label="Menu"
          aria-expanded={showMore}
        >
          {user ? (
            <AvatarWithCosmetic
              src={user?.avatarUrl}
              fallbackSrc={images.avtImage}
              size={24}
              frame={cosmeticFrame}
              badge={cosmeticBadge}
              className={cx('tabAvatar')}
            />
          ) : (
            <FontAwesomeIcon icon={faUser} className={cx('tabIcon')} />
          )}
          <span className={cx('tabLabel')}>Menu</span>
        </button>
      </nav>

      {createPortal(
        <div
          className={cx('sheetOverlay', {open: showMore})}
          onClick={() => setShowMore(false)}
          aria-hidden={!showMore}
        >
          <div
            className={cx('sheet', {open: showMore})}
            role="dialog"
            aria-modal="true"
            aria-label="Menu"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              className={cx('sheetHandle')}
              onClick={() => setShowMore(false)}
              aria-label="Đóng menu"
            />
            <div className={cx('sheetHeader')}>
              <span className={cx('sheetTitle')}>Menu</span>
              <button
                type="button"
                className={cx('sheetClose')}
                onClick={() => setShowMore(false)}
                aria-label="Đóng"
              >
                <FontAwesomeIcon icon={faXmark} />
              </button>
            </div>

            <div className={cx('sheetBody')}>
              {user && (
                <div className={cx('userRow')}>
                  <AvatarWithCosmetic
                    src={user?.avatarUrl}
                    fallbackSrc={images.avtImage}
                    size={40}
                    frame={cosmeticFrame}
                    badge={cosmeticBadge}
                  />
                  <div className={cx('userMeta')}>
                    <span className={cx('userName')}>{user.userName}</span>
                    <div className={cx('statsRow')}>
                      <StreakBadge />
                      <CoinQuestMenu />
                    </div>
                  </div>
                </div>
              )}

              <div className={cx('menuList')}>
                {user && (
                  <Link
                    to={routes.nextStep}
                    className={cx('menuItem')}
                    onClick={() => setShowMore(false)}
                  >
                    Lộ trình
                  </Link>
                )}
                <Link
                  to={routes.MyTest}
                  className={cx('menuItem')}
                  onClick={() => setShowMore(false)}
                >
                  Bài đã tạo
                </Link>
                {user ? (
                  <Link
                    to={routes.profile}
                    className={cx('menuItem')}
                    onClick={() => setShowMore(false)}
                  >
                    Hồ sơ
                  </Link>
                ) : (
                  <>
                    <Link
                      to={routes.login}
                      state={{mode: 'signin'}}
                      className={cx('menuItem')}
                      onClick={() => setShowMore(false)}
                    >
                      Đăng nhập
                    </Link>
                    <Link
                      to={routes.login}
                      state={{mode: 'signup'}}
                      className={cx('menuItem')}
                      onClick={() => setShowMore(false)}
                    >
                      Đăng ký
                    </Link>
                  </>
                )}
              </div>

              <div className={cx('menuSection')}>
                <span className={cx('menuSectionTitle')}>Lớp học</span>
                <button
                  type="button"
                  className={cx('menuAction')}
                  onClick={() => handleClassAction('join')}
                >
                  Tham gia lớp học
                </button>
                <button
                  type="button"
                  className={cx('menuAction')}
                  onClick={() => handleClassAction(null, routes.myClasses)}
                >
                  Vào lớp học
                </button>
                <button
                  type="button"
                  className={cx('menuAction')}
                  onClick={() => handleClassAction('create')}
                >
                  Tạo lớp học
                </button>
              </div>

              {user && (
                <button
                  type="button"
                  className={cx('logoutBtn')}
                  onClick={handleLogout}
                >
                  Đăng xuất
                </button>
              )}
            </div>
          </div>
        </div>,
        document.body,
      )}

      <JoinClassModal show={showJoinModal} onClose={() => setShowJoinModal(false)} />
      <CreateClassModal
        show={showCreateClassModal}
        onClose={() => setShowCreateClassModal(false)}
      />
      <CreateTestModal
        show={showCreateTestModal}
        onClose={() => setShowCreateTestModal(false)}
        mode="personal"
        onSuccess={() => setShowCreateTestModal(false)}
      />
    </>
  );
}

export default MobileBottomNav;
