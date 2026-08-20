'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {Button, Dropdown} from 'react-bootstrap';
import Image from 'next/image';
import {useState} from 'react';
import {toast} from 'react-toastify';
import 'bootstrap/dist/css/bootstrap.min.css';
import style from './header.module.scss';
import images, {imageAssets} from '@/app/assets/images';
import classNames from 'classnames/bind';
import {useAuth} from '@/app/hooks/useAuth';
import {name} from '@/app/assets/images';
import routes from '@/app/configs/Routes';
import JoinClassModal from '@/app/components/JoinClassModal/JoinClassModal';
import CreateClassModal from '@/app/components/CreateClassModal/CreateClassModal';
import CreateTestModal from '@/app/components/tests/CreateTestModal';
import StreakBadge from '@/app/components/gamification/streak/StreakBadge';
import CoinQuestMenu from '@/app/components/gamification/coin/CoinQuestMenu';
import AvatarWithCosmetic from '@/app/components/gamification/cosmetic/AvatarWithCosmetic';
import {useCosmetics} from '@/app/hooks/useCosmetics';

const cx = classNames.bind(style);

function Header() {
  const {user, logout, roleName} = useAuth();
  const canCreateTest = roleName === 'ADMIN';
  const {frame: cosmeticFrame, badge: cosmeticBadge} = useCosmetics();
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showCreateTestModal, setShowCreateTestModal] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  const handleLogout = async () => {
    await logout();
    router.push(routes.home);
  };

  const requireLogin = (message: string) => {
    if (user) {
      return false;
    }
    toast.warning(message);
    router.push(`${routes.login}?mode=signin`);
    return true;
  };

  const handleCreateTest = () => setShowCreateTestModal(true);

  const handleClassAction = (
    e: React.MouseEvent<HTMLElement>,
    targetRoute: string | null,
    modalType: string | null = null,
  ) => {
    e.preventDefault();
    if (requireLogin('Bạn cần đăng nhập để thao tác lớp học!')) {
      return;
    }

    if (modalType === 'join') {
      setShowJoinModal(true);
    } else if (modalType === 'create') {
      setShowCreateModal(true);
    } else {
      router.push(targetRoute as string);
    }
  };

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
              <Link
                href={routes.certificateVerifyHome}
                className={cx('home', {active: pathname === routes.certificateVerifyHome})}
              >
                Chứng chỉ
              </Link>
              <Link
                href={routes.myTarget}
                className={cx('home', {active: pathname === routes.myTarget})}
              >
                Lộ trình
              </Link>
              <Link
                href={routes.myAlbums}
                className={cx('home', {active: pathname === routes.myAlbums})}
              >
                Từ vựng
              </Link>
              <Link
                href={routes.MyTest}
                className={cx('home', {active: pathname === routes.MyTest})}
              >
                Bài đã tạo
              </Link>
              <Dropdown className={cx('customMenu')} align="start">
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
              </Dropdown>
            </div>
          </nav>

          <div className={cx('zoneRight')}>
            {user && (
              <div className={cx('mobileHeaderActions')}>
                <div className={cx('statsCluster')}>
                  <StreakBadge variant="onDark" />
                  <CoinQuestMenu variant="onDark" />
                </div>
              </div>
            )}

            <div className={cx('desktopUtils')}>
              {!user ? (
                <div className={cx('authLinks')}>
                  <Link href={`${routes.login}?mode=signin`} className={cx('home')}>
                    Đăng nhập
                  </Link>
                  <Link href={`${routes.login}?mode=signup`} className={cx('home')}>
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
                    <StreakBadge variant="onDark" />
                    <CoinQuestMenu variant="onDark" />
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

      <JoinClassModal show={showJoinModal} onClose={() => setShowJoinModal(false)} />
      <CreateClassModal show={showCreateModal} onClose={() => setShowCreateModal(false)} />
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
