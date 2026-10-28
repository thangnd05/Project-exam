'use client';

import { useMounted } from '@/app/hooks/useMounted';
import Link, { usePathname, useRouter } from '@/app/i18n/navigation';
import { useTranslations } from 'next-intl';
import {useEffect, useState} from 'react';
import {createPortal} from 'react-dom';
import classNames from 'classnames/bind';
// import {toast} from 'react-toastify';

import ButtonPrime from '@/app/components/Button/ButtonPrime';
import styles from './MobileBottomNav.module.scss';
import routes from '@/app/configs/Routes';
import {useAuth} from '@/app/hooks/useAuth';
import {useCosmetics} from '@/app/features/gamification/cosmetic/hooks/useCosmetics';
import images from '@/app/assets/images';
// import JoinClassModal from '@/app/features/classes/JoinClassModal/JoinClassModal';
// import CreateClassModal from '@/app/features/classes/CreateClassModal/CreateClassModal';
import CreateTestModal from '@/app/features/tests/CreateTestModal';
import StreakBadge from '@/app/features/gamification/streak/StreakBadge';
// Tạm ẩn số xu, giống header.
// import CoinQuestMenu from '@/app/features/gamification/coin/CoinQuestMenu';
import SettingsModal from '@/app/components/layouts/Header/ThemeToggle/SettingsModal';
import AvatarWithCosmetic from '@/app/features/gamification/cosmetic/AvatarWithCosmetic';
import {useStreak} from '@/app/features/gamification/streak/hooks/useStreak';
import { GraduationCap, House, Library, Plus, Route, User, X } from 'lucide-react';

const cx = classNames.bind(styles);

const HIDDEN_PREFIXES = [
  '/login',
  '/forgot-password',
  '/reset',
  '/verify',
  '/oauth2',
  '/admin',
];

function isHiddenRoute(pathname: string) {
  return HIDDEN_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}

function MobileBottomNav() {
  const t = useTranslations('Layout.nav');
  const pathname = usePathname();
  const mounted = useMounted();
  const router = useRouter();
  const {user, logout, roleName} = useAuth();
  const canCreateTest = roleName === 'ADMIN';
  const {frame: cosmeticFrame, badge: cosmeticBadge} = useCosmetics();
  // Giữ đúng các mục như menu desktop; Lớp học và Từ vựng đang tạm ẩn ở cả hai nơi.
  const [activeSheet, setActiveSheet] = useState<'menu' | null>(null);
  // const [showJoinModal, setShowJoinModal] = useState(false);
  // const [showCreateClassModal, setShowCreateClassModal] = useState(false);
  const [showCreateTestModal, setShowCreateTestModal] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
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
  const isExamActive = pathname.startsWith(routes.examTypes);
  const isResourcesActive = pathname.startsWith(routes.resources);
  // const isPostsActive = pathname.startsWith('/posts');
  const isPlanActive =
    pathname.startsWith(routes.myTarget) ||
    pathname.startsWith(routes.targetDashboard) ||
    pathname.startsWith(routes.learningPlans) ||
    pathname.startsWith(routes.learningPlanBase);
  // Mục tiêu, lộ trình cũng nằm dưới /dashboard nên Hồ sơ chỉ sáng ở đúng trang quản trị và các trang còn lại bên dưới.
  const isProfileActive = pathname.startsWith(routes.dashboard) && !isPlanActive;

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
      <nav className={cx('bottomNav')} aria-label={t('mainNavigation')}>
        <Link
          href={routes.home}
          className={cx('tab', {active: isHomeActive})}
          aria-current={isHomeActive ? 'page' : undefined}
        >
          <House size="1em" className={cx('tabIcon')} />
          <span className={cx('tabLabel')}>{t('home')}</span>
        </Link>

        <Link
          href={routes.examTypes}
          className={cx('tab', {active: isExamActive})}
          aria-current={isExamActive ? 'page' : undefined}
        >
          <GraduationCap size="1em" className={cx('tabIcon')} />
          <span className={cx('tabLabel')}>{t('examTypes')}</span>
        </Link>

        {/* <Link
          href={routes.posts}
          className={cx('tab', {active: isPostsActive})}
          aria-current={isPostsActive ? 'page' : undefined}
        >
          <Newspaper size="1em" className={cx('tabIcon')} />
          <span className={cx('tabLabel')}>Bài viết</span>
        </Link> */}

        <Link
          href={routes.resources}
          className={cx('tab', {active: isResourcesActive})}
          aria-current={isResourcesActive ? 'page' : undefined}
        >
          <Library size="1em" className={cx('tabIcon')} />
          <span className={cx('tabLabel')}>{t('resources')}</span>
        </Link>

        {canCreateTest && (
          <ButtonPrime
            variant="brand"
            size="icon"
            className={cx('createBtn')}
            onClick={handleCreateTest}
            aria-label={t('createTest')}
          >
            <Plus size={18} />
          </ButtonPrime>
        )}

        <Link
          href={routes.learningPlans}
          className={cx('tab', {active: isPlanActive})}
          aria-current={isPlanActive ? 'page' : undefined}
        >
          <Route size="1em" className={cx('tabIcon')} />
          <span className={cx('tabLabel')}>{t('learningPlans')}</span>
        </Link>

        <button
          type="button"
          className={cx('tab', {active: activeSheet === 'menu' || isProfileActive})}
          onClick={() => setActiveSheet('menu')}
          aria-label={t('menu')}
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
            <User size="1em" className={cx('tabIcon')} />
          )}
          <span className={cx('tabLabel')}>{t('menu')}</span>
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
            aria-label={t('menu')}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              className={cx('sheetHandle')}
              onClick={closeSheet}
              aria-label={t('close')}
            />
            <div className={cx('sheetHeader')}>
              <span className={cx('sheetTitle')}>
                {t('menu')}
              </span>
              <ButtonPrime variant="soft" size="icon" onClick={closeSheet} aria-label={t('close')}>
                <X size={16} />
              </ButtonPrime>
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
                            {/* <CoinQuestMenu /> */}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  <div className={cx('menuList')}>
                    {user ? (
                      <>
                        <ButtonPrime
                          as="link"
                          href={routes.dashboard}
                          variant="ghost"
                          fullWidth
                          className={cx('menuItem')}
                          onClick={closeSheet}
                        >
                          {t('profile')}
                        </ButtonPrime>
                        <ButtonPrime
                          as="link"
                          href={routes.myCertificates}
                          variant="ghost"
                          fullWidth
                          className={cx('menuItem')}
                          onClick={closeSheet}
                        >
                          {t('myCertificates')}
                        </ButtonPrime>
                        <ButtonPrime
                          variant="ghost"
                          fullWidth
                          className={cx('menuItem')}
                          onClick={() => {
                            closeSheet();
                            setShowSettings(true);
                          }}
                        >
                          {t('settings')}
                        </ButtonPrime>
                      </>
                    ) : (
                      <>
                        <ButtonPrime
                          as="link"
                          href={`${routes.login}?mode=signin`}
                          variant="ghost"
                          fullWidth
                          className={cx('menuItem')}
                          onClick={closeSheet}
                        >
                          {t('login')}
                        </ButtonPrime>
                        <ButtonPrime
                          as="link"
                          href={`${routes.login}?mode=signup`}
                          variant="ghost"
                          fullWidth
                          className={cx('menuItem')}
                          onClick={closeSheet}
                        >
                          {t('signup')}
                        </ButtonPrime>
                      </>
                    )}
                  </div>

                  {user && (
                    <ButtonPrime
                      variant="dangerGhost"
                      fullWidth
                      className={cx('logoutBtn')}
                      onClick={handleLogout}
                    >
                      {t('logout')}
                    </ButtonPrime>
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
      <SettingsModal show={showSettings} onClose={() => setShowSettings(false)} />
    </>
  );
}

export default MobileBottomNav;
