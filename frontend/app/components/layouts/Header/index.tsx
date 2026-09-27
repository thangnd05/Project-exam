'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {Button, Dropdown} from 'react-bootstrap';
import Image from 'next/image';
import {useState} from 'react';
// import {useCallback, useEffect, useRef, useState} from 'react';
// import {toast} from 'react-toastify';
import 'bootstrap/dist/css/bootstrap.min.css';
import style from './header.module.scss';
import images, {imageAssets} from '@/app/assets/images';
import classNames from 'classnames/bind';
import {useAuth} from '@/app/hooks/useAuth';
import {name} from '@/app/assets/images';
import routes from '@/app/configs/Routes';
import {buildLoginUrl} from '@/app/utils/authRedirect';
// import JoinClassModal from '@/app/components/JoinClassModal/JoinClassModal';
// import CreateClassModal from '@/app/components/CreateClassModal/CreateClassModal';
import CreateTestModal from '@/app/components/tests/CreateTestModal';
import StreakBadge from '@/app/components/gamification/streak/StreakBadge';
import CoinQuestMenu from '@/app/components/gamification/coin/CoinQuestMenu';
import FirstTimeHint from '@/app/components/gamification/onboarding/FirstTimeHint';
import AvatarWithCosmetic from '@/app/components/gamification/cosmetic/AvatarWithCosmetic';
import {useCosmetics} from '@/app/hooks/useCosmetics';

const cx = classNames.bind(style);

// const CLASS_MENU_CLOSE_DELAY = 160;

function Header() {
  const {user, logout, roleName} = useAuth();
  const canCreateTest = roleName === 'ADMIN';
  const {frame: cosmeticFrame, badge: cosmeticBadge} = useCosmetics();
  // const [showJoinModal, setShowJoinModal] = useState(false);
  // const [showCreateModal, setShowCreateModal] = useState(false);
  const [showCreateTestModal, setShowCreateTestModal] = useState(false);
  // const [showClassMenu, setShowClassMenu] = useState(false);
  // const classMenuTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const router = useRouter();
  const pathname = usePathname();

  // const clearClassMenuTimer = useCallback(() => {
  //   if (classMenuTimer.current) {
  //     clearTimeout(classMenuTimer.current);
  //     classMenuTimer.current = null;
  //   }
  // }, []);

  // useEffect(() => clearClassMenuTimer, [clearClassMenuTimer]);

  // const canHover = () => window.matchMedia?.('(hover: hover)').matches ?? false;

  // const handleClassMenuEnter = () => {
  //   if (!canHover()) return;
  //   clearClassMenuTimer();
  //   setShowClassMenu(true);
  // };

  // const handleClassMenuLeave = () => {
  //   if (!canHover()) return;
  //   clearClassMenuTimer();
  //   classMenuTimer.current = setTimeout(
  //     () => setShowClassMenu(false),
  //     CLASS_MENU_CLOSE_DELAY,
  //   );
  // };

  // const handleClassMenuToggle = (nextShow: boolean) => {
  //   clearClassMenuTimer();
  //   setShowClassMenu(nextShow);
  // };

  const statsWithHint = (
    <FirstTimeHint
      hintKey="streak-coins"
      enabled={Boolean(user)}
      title="Chuỗi ngày học và xu"
      body={
        <>
          <p>🔥 Chuỗi tăng mỗi ngày bạn làm bài hoặc học một nhiệm vụ trong lộ trình. Bỏ một ngày là chuỗi về 0.</p>
          <p>🪙 Hoàn thành nhiệm vụ để nhận xu, dùng xu đổi khung và huy hiệu cho avatar. Bấm vào số xu để xem nhiệm vụ, chấm đỏ nghĩa là có thưởng chưa nhận.</p>
        </>
      }
    >
      <StreakBadge variant="onDark" />
      <CoinQuestMenu variant="onDark" />
    </FirstTimeHint>
  );

  const handleLogout = async () => {
    await logout();
    router.push(routes.home);
  };

  // const requireLogin = (message: string) => {
  //   if (user) {
  //     return false;
  //   }
  //   toast.warning(message);
  //   router.push(`${routes.login}?mode=signin`);
  //   return true;
  // };

  const handleCreateTest = () => setShowCreateTestModal(true);

  // const handleClassAction = (
  //   e: React.MouseEvent<HTMLElement>,
  //   targetRoute: string | null,
  //   modalType: string | null = null,
  // ) => {
  //   e.preventDefault();
  //   clearClassMenuTimer();
  //   setShowClassMenu(false);
  //   if (requireLogin('Bạn cần đăng nhập để thao tác lớp học!')) {
  //     return;
  //   }

  //   if (modalType === 'join') {
  //     setShowJoinModal(true);
  //   } else if (modalType === 'create') {
  //     setShowCreateModal(true);
  //   } else {
  //     router.push(targetRoute as string);
  //   }
  // };

  return (
    <header className={cx('wrapper')}>
      <div className={cx('pill')}>
        <div className={cx('barRow')}>
          <div className={cx('zoneLeft')}>
            <Link href={routes.home} className={cx('brand')}>
              <span className={cx('brandInner')}>
                <Image
                  src={imageAssets.logoW}
                  alt="WinDe"
                  width={50}
                  height={32}
                  priority
                  className={cx('logo-brand')}
                />
                <span className={cx('brandName')}>{name}</span>
              </span>
            </Link>
          </div>

          <nav className={cx('zoneCenter')} aria-label="Điều hướng chính">
            <div className={cx('navTrack')}>
              {/* <Link
                href={routes.certificateVerifyHome}
                className={cx('home', {active: pathname === routes.certificateVerifyHome})}
              >
                Chứng chỉ
              </Link> */}
              <Link
                href={routes.examTypes}
                className={cx('home', {
                  active: pathname === routes.examTypes || pathname.startsWith('/exam-types/'),
                })}
              >
                Kỳ thi
              </Link>
              <Link
                href={routes.resources}
                className={cx('home', {
                  active: pathname === routes.resources || pathname.startsWith('/resources/'),
                })}
              >
                Tài liệu
              </Link>
              <Link
                href={routes.posts}
                className={cx('home', {
                  active: pathname === routes.posts || pathname.startsWith('/posts/'),
                })}
              >
                Bài viết
              </Link>
              <Link
                href={routes.myTarget}
                className={cx('home', {active: pathname === routes.myTarget})}
              >
                Lộ trình
              </Link>
              {/* <Link
                href={routes.myAlbums}
                className={cx('home', {active: pathname === routes.myAlbums})}
              >
                Từ vựng
              </Link> */}
              <Link
                href={routes.MyTest}
                className={cx('home', {active: pathname === routes.MyTest})}
              >
                Bài đã tạo
              </Link>
              {/* <Dropdown
                className={cx('customMenu')}
                align="start"
                show={showClassMenu}
                onToggle={handleClassMenuToggle}
                onMouseEnter={handleClassMenuEnter}
                onMouseLeave={handleClassMenuLeave}
              >
                <Dropdown.Toggle
                  as="button"
                  type="button"
                  className={cx('menuTitle')}
                  id="header-class-menu"
                >
                  Lớp học
                </Dropdown.Toggle>
                <Dropdown.Menu className={cx('classDropdown')}>
                  <Dropdown.Item
                    as="button"
                    onClick={(e) => handleClassAction(e, null, 'join')}
                  >
                    Tham gia lớp học
                  </Dropdown.Item>
                  <Dropdown.Item
                    as="button"
                    onClick={(e) => handleClassAction(e, routes.myClasses)}
                  >
                    Vào lớp học
                  </Dropdown.Item>
                  <Dropdown.Item
                    as="button"
                    onClick={(e) => handleClassAction(e, null, 'create')}
                  >
                    Tạo lớp học
                  </Dropdown.Item>
                </Dropdown.Menu>
              </Dropdown> */}
            </div>
          </nav>

          <div className={cx('zoneRight')}>
            {user && (
              <div className={cx('mobileHeaderActions')}>
                <div className={cx('statsCluster')}>
                  {statsWithHint}
                </div>
              </div>
            )}

            <div className={cx('desktopUtils')}>
              {!user ? (
                <div className={cx('authLinks')}>
                  <Link href={buildLoginUrl(pathname === routes.home ? null : pathname, {mode: 'signin'})} className={cx('home')}>
                    Đăng nhập
                  </Link>
                  <Link href={buildLoginUrl(pathname === routes.home ? null : pathname, {mode: 'signup'})} className={cx('home')}>
                    Đăng ký
                  </Link>
                </div>
              ) : (
                <div className={cx('userMenuWrapper')}>
                  {canCreateTest && (
                    <div className={cx('ctaSlot')}>
                      <Button
                        variant=""
                        className={cx('new-test')}
                        onClick={handleCreateTest}
                      >
                        Tạo bài kiểm tra
                      </Button>
                    </div>
                  )}
                  <div className={cx('statsCluster')}>
                    {statsWithHint}
                  </div>
                  <Dropdown>
                    <Dropdown.Toggle
                      as="div"
                      className={cx('user-info')}
                      role="button"
                      tabIndex={0}
                      aria-label={`Tài khoản ${user.userName || ''}`}
                    >
                      <AvatarWithCosmetic
                        src={user?.avatarUrl}
                        fallbackSrc={images.avtImage}
                        name={user?.userName || user?.fullName}
                        size={32}
                        frame={cosmeticFrame}
                        badge={cosmeticBadge}
                      />
                      <div className={cx('userNameWrapper')}>
                        <span className={cx('username')}>{user.userName}</span>
                      </div>
                    </Dropdown.Toggle>
                    <Dropdown.Menu className={cx('custom-dropdown')}>
                      <Dropdown.Item as={Link} href={routes.profile}>
                        Hồ sơ
                      </Dropdown.Item>
                      <Dropdown.Item as={Link} href={routes.myCertificates}>
                        Chứng chỉ của tôi
                      </Dropdown.Item>
                      <Dropdown.Item onClick={handleLogout}>Đăng xuất</Dropdown.Item>
                    </Dropdown.Menu>
                  </Dropdown>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* <JoinClassModal show={showJoinModal} onClose={() => setShowJoinModal(false)} />
      <CreateClassModal show={showCreateModal} onClose={() => setShowCreateModal(false)} /> */}
      <CreateTestModal
        show={showCreateTestModal}
        onClose={() => setShowCreateTestModal(false)}
        mode="personal"
        onSuccess={() => setShowCreateTestModal(false)}
      />
    </header>
  );
}

export default Header;
