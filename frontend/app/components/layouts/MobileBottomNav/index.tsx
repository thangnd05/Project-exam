'use client';

import { useMounted } from '@/app/hooks/useMounted';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {useEffect, useState} from 'react';
import {createPortal} from 'react-dom';
import classNames from 'classnames/bind';
// import {toast} from 'react-toastify';

import styles from './MobileBottomNav.module.scss';
import routes from '@/app/configs/Routes';
import {useAuth} from '@/app/hooks/useAuth';
import {useCosmetics} from '@/app/hooks/useCosmetics';
import images from '@/app/assets/images';
// import JoinClassModal from '@/app/components/JoinClassModal/JoinClassModal';
// import CreateClassModal from '@/app/components/CreateClassModal/CreateClassModal';
import CreateTestModal from '@/app/components/tests/CreateTestModal';
import StreakBadge from '@/app/components/gamification/streak/StreakBadge';
import CoinQuestMenu from '@/app/components/gamification/coin/CoinQuestMenu';
import AvatarWithCosmetic from '@/app/components/gamification/cosmetic/AvatarWithCosmetic';
import {useStreak} from '@/app/hooks/useStreak';
import { FaGraduationCap, FaHouse, FaPlus, FaRoute, FaUser, FaXmark } from 'react-icons/fa6';

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
  const mounted = useMounted();
  const router = useRouter();
  const {user, logout, roleName} = useAuth();
  const canCreateTest = roleName === 'ADMIN';
  const canManageTests = roleName === 'ADMIN';
  const {frame: cosmeticFrame, badge: cosmeticBadge} = useCosmetics();
  // Giữ đúng các mục như menu desktop; Lớp học và Từ vựng đang tạm ẩn ở cả hai nơi.
  const [activeSheet, setActiveSheet] = useState<'menu' | null>(null);
  // const [showJoinModal, setShowJoinModal] = useState(false);
  // const [showCreateClassModal, setShowCreateClassModal] = useState(false);
  const [showCreateTestModal, setShowCreateTestModal] = useState(false);
  const {streakReady} = useStreak();
  const showStats = streakReady;

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

  const isHomeActive = pathname === routes.home;
  const isExamActive = pathname.startsWith('/exam-types');
  // const isPostsActive = pathname.startsWith('/posts');
  const isPlanActive =
    pathname.startsWith(routes.myTarget) || pathname.startsWith(routes.learningPlans);
  const isProfileActive =
    pathname.startsWith('/profile') || pathname.startsWith(routes.myCertificates);

  // const requireLogin = (message: string) => {
  //   if (user) {
  //     return false;
  //   }
  //   toast.warning(message);
  //   router.push(`${routes.login}?mode=signin`);
  //   setActiveSheet(null);
  //   return true;
  // };

  const handleCreateTest = () => setShowCreateTestModal(true);

  // const handleClassAction = (modalType: string | null, targetRoute?: string) => {
  //   if (requireLogin('Bạn cần đăng nhập để thao tác lớp học!')) {
  //     return;
  //   }
  //   if (modalType === 'join') {
  //     setShowJoinModal(true);
  //   } else if (modalType === 'create') {
  //     setShowCreateClassModal(true);
  //   } else if (targetRoute) {
  //     router.push(targetRoute);
  //   }
  //   setActiveSheet(null);
  // };

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
          <FaHouse className={cx('tabIcon')} />
          <span className={cx('tabLabel')}>Trang chủ</span>
        </Link>

        <Link
          href={routes.examTypes}
          className={cx('tab', {active: isExamActive})}
          aria-current={isExamActive ? 'page' : undefined}
        >
          <FaGraduationCap className={cx('tabIcon')} />
          <span className={cx('tabLabel')}>Kỳ thi</span>
        </Link>

        {/* <Link
          href={routes.posts}
          className={cx('tab', {active: isPostsActive})}
          aria-current={isPostsActive ? 'page' : undefined}
        >
          <FaNewspaper className={cx('tabIcon')} />
          <span className={cx('tabLabel')}>Bài viết</span>
        </Link> */}

        {canCreateTest && (
          <button
            type="button"
            className={cx('createBtn')}
            onClick={handleCreateTest}
            aria-label="Tạo bài kiểm tra"
          >
            <FaPlus />
          </button>
        )}

        <Link
          href={routes.learningPlans}
          className={cx('tab', {active: isPlanActive})}
          aria-current={isPlanActive ? 'page' : undefined}
        >
          <FaRoute className={cx('tabIcon')} />
          <span className={cx('tabLabel')}>Lộ trình</span>
        </Link>

        <button
          type="button"
          className={cx('tab', {active: activeSheet === 'menu' || isProfileActive})}
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
            <FaUser className={cx('tabIcon')} />
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
            aria-label="Menu"
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
                Menu
              </span>
              <button
                type="button"
                className={cx('sheetClose')}
                onClick={closeSheet}
                aria-label="Đóng"
              >
                <FaXmark />
              </button>
            </div>

            <div className={cx('sheetBody')}>
              {/* Sheet "Lớp học" (Tham gia / Vào / Tạo lớp học) tạm ẩn cùng menu desktop. */}
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
                        {showStats && (
                          <div className={cx('statsRow')}>
                            <StreakBadge />
                            <CoinQuestMenu />
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  <div className={cx('menuList')}>
                    <Link
                      href={routes.resources}
                      className={cx('menuItem')}
                      onClick={closeSheet}
                    >
                      Tài liệu
                    </Link>
                    {canManageTests && (
                      <Link
                        href={routes.MyTest}
                        className={cx('menuItem')}
                        onClick={closeSheet}
                      >
                        Bài đã tạo
                      </Link>
                    )}
                    {user ? (
                      <>
                        <Link
                          href={routes.profile}
                          className={cx('menuItem')}
                          onClick={closeSheet}
                        >
                          Hồ sơ
                        </Link>
                        <Link
                          href={routes.myCertificates}
                          className={cx('menuItem')}
                          onClick={closeSheet}
                        >
                          Chứng chỉ của tôi
                        </Link>
                      </>
                    ) : (
                      <>
                        <Link
                          href={`${routes.login}?mode=signin`}
                          className={cx('menuItem')}
                          onClick={closeSheet}
                        >
                          Đăng nhập
                        </Link>
                        <Link
                          href={`${routes.login}?mode=signup`}
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
            </div>
          </div>
        </div>,
        document.body,
      )}

      {/* <JoinClassModal show={showJoinModal} onClose={() => setShowJoinModal(false)} />
      <CreateClassModal
        show={showCreateClassModal}
        onClose={() => setShowCreateClassModal(false)}
      /> */}
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
