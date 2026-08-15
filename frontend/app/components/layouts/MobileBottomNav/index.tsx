'use client';

import { useMounted } from '@/app/hooks/useMounted';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {useEffect, useState} from 'react';
import {createPortal} from 'react-dom';
import {FontAwesomeIcon as FontAwesomeIconBase} from '@fortawesome/react-fontawesome';
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
import {toast} from 'react-toastify';

import styles from './MobileBottomNav.module.scss';
import routes from '@/app/configs/Routes';
import {useAuth} from '@/app/hooks/useAuth';
import {useCosmetics} from '@/app/hooks/useCosmetics';
import images from '@/app/assets/images';
import JoinClassModal from '@/app/features/classes/modals/JoinClassModal';
import CreateClassModal from '@/app/features/classes/modals/CreateClassModal';
import CreateTestModalJs from '@/app/features/tests/components/CreateTestModal';
import StreakBadgeJs from '@/app/features/gamification/streak/StreakBadge';
import CoinQuestMenuJs from '@/app/features/gamification/coin/CoinQuestMenu';
import AvatarWithCosmeticJs from '@/app/features/gamification/cosmetic/AvatarWithCosmetic';

// react-fontawesome 0.1.x kéo fontawesome-common-types 0.3 lệch với 6.7 của icon pack
// -> IconProp không khớp. Cast any tạm thời cho tới khi nâng cấp react-fontawesome.
const FontAwesomeIcon = FontAwesomeIconBase as React.ComponentType<any>;

// Các component feature còn là .js nên TS suy props sai (coi prop không default là bắt buộc).
// Cast any tạm thời — bỏ cast khi các file này chuyển sang TS.
const CreateTestModal = CreateTestModalJs as React.ComponentType<any>;
const StreakBadge = StreakBadgeJs as React.ComponentType<any>;
const CoinQuestMenu = CoinQuestMenuJs as React.ComponentType<any>;
const AvatarWithCosmetic = AvatarWithCosmeticJs as React.ComponentType<any>;

const cx = classNames.bind(styles);

const HIDDEN_PREFIXES = [
  '/login',
  '/forgot',
  '/reset',
  '/verify',
  '/oauth2',
  '/admin',
];

function isHiddenRoute(pathname: string) {
  return HIDDEN_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}

function MobileBottomNav() {
  const pathname = usePathname();
  // Bảng chọn dùng portal vào document.body nên phải chờ đã ở client mới dựng.
  const mounted = useMounted();
  const router = useRouter();
  const {user, logout, roleName} = useAuth();
  // Tạo bài kiểm tra là việc của quản trị, người dùng thường không thấy nút này.
  const canCreateTest = roleName === 'ADMIN';
  const {frame: cosmeticFrame, badge: cosmeticBadge} = useCosmetics();
  const [activeSheet, setActiveSheet] = useState<'class' | 'menu' | null>(null);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [showCreateClassModal, setShowCreateClassModal] = useState(false);
  const [showCreateTestModal, setShowCreateTestModal] = useState(false);

  const hidden = isHiddenRoute(pathname);
  const sheetOpen = activeSheet !== null;

  useEffect(() => {
    if (!sheetOpen) return undefined;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setActiveSheet(null);
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

  /**
   * Thao tác mở modal không đi qua router nên ProtectedRoute không chặn được  phải tự
   * kiểm tra đăng nhập tại đây.
   */
  const requireLogin = (message: string) => {
    if (user) {
      return false;
    }
    toast.warning(message);
    router.push(`${routes.login}?mode=signin`);
    setActiveSheet(null);
    return true;
  };

  const handleCreateTest = () => setShowCreateTestModal(true);

  const handleClassAction = (modalType: string | null, targetRoute?: string) => {
    if (requireLogin('Bạn cần đăng nhập để thao tác lớp học!')) {
      return;
    }
    if (modalType === 'join') {
      setShowJoinModal(true);
    } else if (modalType === 'create') {
      setShowCreateClassModal(true);
    } else if (targetRoute) {
      router.push(targetRoute);
    }
    setActiveSheet(null);
  };

  const handleLogout = async () => {
    await logout();
    setActiveSheet(null);
    router.push(routes.home);
  };

  const closeSheet = () => setActiveSheet(null);

  return (
    <>
      <nav className={cx('bottomNav')} aria-label="Điều hướng chính">
        <Link
          href={routes.home}
          className={cx('tab', {active: isHomeActive})}
          aria-current={isHomeActive ? 'page' : undefined}
        >
          <FontAwesomeIcon icon={faHome} className={cx('tabIcon')} />
          <span className={cx('tabLabel')}>Trang chủ</span>
        </Link>

        <Link
          href={routes.posts}
          className={cx('tab', {active: isPostsActive})}
          aria-current={isPostsActive ? 'page' : undefined}
        >
          <FontAwesomeIcon icon={faNewspaper} className={cx('tabIcon')} />
          <span className={cx('tabLabel')}>Bài viết</span>
        </Link>

        {canCreateTest && (
          <button
            type="button"
            className={cx('createBtn')}
            onClick={handleCreateTest}
            aria-label="Tạo bài kiểm tra"
          >
            <FontAwesomeIcon icon={faPlus} />
          </button>
        )}

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
              name={user?.userName || user?.fullName}
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

      {mounted &&
        createPortal(
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
                        name={user?.userName || user?.fullName}
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
                    {/* Vẫn hiện khi chưa đăng nhập: ProtectedRoute sẽ đưa về trang đăng nhập
                        kèm lời nhắc rồi quay lại đúng trang này sau khi đăng nhập. */}
                    <Link
                      href={routes.myTarget}
                      className={cx('menuItem')}
                      onClick={closeSheet}
                    >
                      Lộ trình
                    </Link>
                    <Link
                      href={routes.myAlbums}
                      className={cx('menuItem')}
                      onClick={closeSheet}
                    >
                      <FontAwesomeIcon icon={faBook} className={cx('menuItemIcon')} />
                      Từ vựng
                    </Link>
                    <Link
                      href={routes.MyTest}
                      className={cx('menuItem')}
                      onClick={closeSheet}
                    >
                      Bài đã tạo
                    </Link>
                    {user ? (
                      <Link
                        href={routes.profile}
                        className={cx('menuItem')}
                        onClick={closeSheet}
                      >
                        Hồ sơ
                      </Link>
                    ) : (
                      <>
                        <Link
                          href={routes.login}
                          {...({state: {mode: 'signin'}} as any)}
                          className={cx('menuItem')}
                          onClick={closeSheet}
                        >
                          Đăng nhập
                        </Link>
                        <Link
                          href={routes.login}
                          {...({state: {mode: 'signup'}} as any)}
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
