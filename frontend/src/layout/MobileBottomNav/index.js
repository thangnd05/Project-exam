import {useEffect, useState} from 'react';
import {createPortal} from 'react-dom';
import {Link, useLocation, useNavigate} from 'react-router-dom';
import {FontAwesomeIcon} from '@fortawesome/react-fontawesome';
import {
  faBook,
  faChalkboardUser,
  faHome,
  faNewspaper,
  faPlus,
  faUser,
  faXmark,
} from '@fortawesome/free-solid-svg-icons';
import classNames from 'classnames/bind';

import styles from './MobileBottomNav.module.scss';
import routes from '~/shared/config/Routes';
import {useAuth} from '~/shared/hooks/useAuth';
import {useCosmetics} from '~/shared/hooks/useCosmetics';
import images from '~/shared/assets/images';
import JoinClassModal from '~/features/classes/modals/JoinClassModal';
import CreateClassModal from '~/features/classes/modals/CreateClassModal';
import CreateTestModal from '~/shared/test/CreateTestModal';
import StreakBadge from '~/shared/streak/StreakBadge';
import CoinQuestMenu from '~/shared/coin/CoinQuestMenu';
import AvatarWithCosmetic from '~/shared/cosmetic/AvatarWithCosmetic';

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
  const [activeSheet, setActiveSheet] = useState(null);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [showCreateClassModal, setShowCreateClassModal] = useState(false);
  const [showCreateTestModal, setShowCreateTestModal] = useState(false);

  const hidden = isHiddenRoute(pathname);
  const sheetOpen = activeSheet !== null;

  useEffect(() => {
    if (!sheetOpen) return undefined;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e) => e.key === 'Escape' && setActiveSheet(null);
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener('keydown', onKey);
    };
  }, [sheetOpen]);

  if (hidden) return null;

  const isHomeActive =
    pathname === routes.home || pathname.startsWith('/exam-types');
  const isPostsActive = pathname.startsWith('/posts');
  const isClassActive =
    pathname.startsWith('/my-classes') ||
    pathname.startsWith('/class') ||
    pathname.startsWith('/classes');
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
      setActiveSheet(null);
      return;
    }
    if (modalType === 'join') {
      setShowJoinModal(true);
    } else if (modalType === 'create') {
      setShowCreateClassModal(true);
    } else if (targetRoute) {
      navigate(targetRoute);
    }
    setActiveSheet(null);
  };

  const handleLogout = async () => {
    await logout();
    setActiveSheet(null);
    navigate(routes.home);
  };

  const closeSheet = () => setActiveSheet(null);

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

        <button
          type="button"
          className={cx('tab', {active: isClassActive || activeSheet === 'class'})}
          onClick={() => setActiveSheet('class')}
          aria-label="Lớp học"
          aria-expanded={activeSheet === 'class'}
        >
          <FontAwesomeIcon icon={faChalkboardUser} className={cx('tabIcon')} />
          <span className={cx('tabLabel')}>Lớp học</span>
        </button>

        <button
          type="button"
          className={cx('tab', {active: activeSheet === 'menu' || isProfileActive || isVocabActive})}
          onClick={() => setActiveSheet('menu')}
          aria-label="Menu"
          aria-expanded={activeSheet === 'menu'}
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
          className={cx('sheetOverlay', {open: sheetOpen})}
          onClick={closeSheet}
          aria-hidden={!sheetOpen}
        >
          <div
            className={cx('sheet', {open: sheetOpen})}
            role="dialog"
            aria-modal="true"
            aria-label={activeSheet === 'class' ? 'Lớp học' : 'Menu'}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              className={cx('sheetHandle')}
              onClick={closeSheet}
              aria-label="Đóng"
            />
            <div className={cx('sheetHeader')}>
              <span className={cx('sheetTitle')}>
                {activeSheet === 'class' ? 'Lớp học' : 'Menu'}
              </span>
              <button
                type="button"
                className={cx('sheetClose')}
                onClick={closeSheet}
                aria-label="Đóng"
              >
                <FontAwesomeIcon icon={faXmark} />
              </button>
            </div>

            <div className={cx('sheetBody')}>
              {activeSheet === 'class' ? (
                <div className={cx('menuSection')}>
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
              ) : (
                <>
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
                        to={routes.myTarget}
                        className={cx('menuItem')}
                        onClick={closeSheet}
                      >
                        Lộ trình
                      </Link>
                    )}
                    <Link
                      to={routes.myAlbums}
                      className={cx('menuItem')}
                      onClick={closeSheet}
                    >
                      <FontAwesomeIcon icon={faBook} className={cx('menuItemIcon')} />
                      Từ vựng
                    </Link>
                    <Link
                      to={routes.MyTest}
                      className={cx('menuItem')}
                      onClick={closeSheet}
                    >
                      Bài đã tạo
                    </Link>
                    {user ? (
                      <Link
                        to={routes.profile}
                        className={cx('menuItem')}
                        onClick={closeSheet}
                      >
                        Hồ sơ
                      </Link>
                    ) : (
                      <>
                        <Link
                          to={routes.login}
                          state={{mode: 'signin'}}
                          className={cx('menuItem')}
                          onClick={closeSheet}
                        >
                          Đăng nhập
                        </Link>
                        <Link
                          to={routes.login}
                          state={{mode: 'signup'}}
                          className={cx('menuItem')}
                          onClick={closeSheet}
                        >
                          Đăng ký
                        </Link>
                      </>
                    )}
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
                </>
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
