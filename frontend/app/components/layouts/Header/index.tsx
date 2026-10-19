'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {Button, Dropdown} from 'react-bootstrap';
import Image from 'next/image';
import {useEffect, useRef, useState} from 'react';
// import {useCallback, useEffect, useRef, useState} from 'react';
// import {toast} from 'react-toastify';
import 'bootstrap/dist/css/bootstrap.min.css';
import style from './header.module.scss';
import images, {imageAssets} from '@/app/assets/images';
import classNames from 'classnames/bind';
import {useAuth} from '@/app/hooks/useAuth';
import routes from '@/app/configs/Routes';
import {buildLoginUrl} from '@/app/utils/authRedirect';
// import JoinClassModal from '@/app/components/JoinClassModal/JoinClassModal';
// import CreateClassModal from '@/app/components/CreateClassModal/CreateClassModal';
import CreateTestModal from '@/app/components/tests/CreateTestModal';
import ThemeToggle from '@/app/components/ThemeToggle/ThemeToggle';
import StreakBadge from '@/app/components/gamification/streak/StreakBadge';
import CoinQuestMenu from '@/app/components/gamification/coin/CoinQuestMenu';
import FirstTimeHint from '@/app/components/gamification/onboarding/FirstTimeHint';
import AvatarWithCosmetic from '@/app/components/gamification/cosmetic/AvatarWithCosmetic';
import {useCosmetics} from '@/app/components/gamification/cosmetic/hooks/useCosmetics';
import {useStreak} from '@/app/components/gamification/streak/hooks/useStreak';

const cx = classNames.bind(style);

type Rgba = [number, number, number, number];

function parseColors(value: string): Rgba[] {
  const matches = value.match(/rgba?\([^)]*\)/g) ?? [];
  return matches.map((m) => {
    const [r = 0, g = 0, b = 0, a = 1] = (m.match(/[\d.]+/g) ?? []).map(Number);
    return [r, g, b, a];
  });
}

// Màu nền thực của một phần tử: màu đặc trước, nếu trong suốt thì lấy màu đầu tiên của gradient.
function solidBackground(el: Element): Rgba | null {
  const cs = getComputedStyle(el);
  const [bg] = parseColors(cs.backgroundColor);
  if (bg && bg[3] >= 0.5) return bg;
  if (cs.backgroundImage.includes('gradient')) {
    return parseColors(cs.backgroundImage).find((c) => c[3] >= 0.5) ?? null;
  }
  return null;
}

// Phần tử trải gần hết bề ngang màn hình mới được coi là nền section; thẻ, mockup, ảnh... bị bỏ qua.
const BACKDROP_MIN_WIDTH_RATIO = 0.9;

// Giống mẫu FrostScope: header chuyển sang nền sáng khi section nằm ngay dưới nó có nền sáng.
function isLightBehind(pill: HTMLElement): boolean {
  const header = pill.closest('header');
  const rect = pill.getBoundingClientRect();
  const minWidth = document.documentElement.clientWidth * BACKDROP_MIN_WIDTH_RATIO;
  const stack = document.elementsFromPoint(rect.left + rect.width / 2, rect.top + rect.height / 2);
  for (const el of stack) {
    if (header?.contains(el)) continue;
    if (el.getBoundingClientRect().width < minWidth) continue;
    const color = solidBackground(el);
    if (color) {
      const [r, g, b] = color;
      return (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255 > 0.6;
    }
  }
  return false;
}

// Đi qua route group khác (vd (guest) -> (user)) thì layout và Header mount lại từ đầu;
// nhớ kết quả lần đo trước để header không chớp về nền tối rồi mới đổi lại.
let lastOnLight = false;

function useLightBehind(pillRef: React.RefObject<HTMLElement | null>, pathname: string) {
  const [onLight, setOnLight] = useState(() => lastOnLight);

  useEffect(() => {
    const pill = pillRef.current;
    if (!pill) return undefined;

    let frame = 0;
    const schedule = () => {
      if (frame) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        lastOnLight = isLightBehind(pill);
        setOnLight(lastOnLight);
      });
    };

    schedule();
    window.addEventListener('scroll', schedule, {passive: true});
    window.addEventListener('resize', schedule);
    // Trang tải dữ liệu xong làm đổi bố cục, đổi theme sáng/tối cũng đổi màu nền.
    const resizeObserver = new ResizeObserver(schedule);
    resizeObserver.observe(document.body);
    const themeObserver = new MutationObserver(schedule);
    themeObserver.observe(document.documentElement, {attributes: true, attributeFilter: ['data-theme', 'data-palette']});

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
      resizeObserver.disconnect();
      themeObserver.disconnect();
    };
  }, [pillRef, pathname]);

  return onLight;
}

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
  const pillRef = useRef<HTMLDivElement>(null);
  const onLight = useLightBehind(pillRef, pathname);
  const statVariant = onLight ? 'default' : 'onDark';

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

  const {streakReady} = useStreak();
  const showStats = Boolean(user) && streakReady;

  const statsWithHint = showStats && (
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
      <StreakBadge variant={statVariant} />
      <CoinQuestMenu variant={statVariant} />
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
    <header className={cx('wrapper', 'theme-locked')} data-bs-theme="light">
      <div ref={pillRef} className={cx('pill', {onLight})}>
        <div className={cx('barRow')}>
          <div className={cx('zoneLeft')}>
            <Link href={routes.home} className={cx('brand')}>
              <Image
                src={onLight ? imageAssets.frostscopeLogoRgb : imageAssets.frostscopeLogoWhite}
                alt="FrostScope"
                width={152}
                height={32}
                priority
                className={cx('logo-brand')}
              />
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
                Kho đề thi
              </Link>
              <Link
                href={routes.resources}
                className={cx('home', {
                  active: pathname === routes.resources || pathname.startsWith('/resources/'),
                })}
              >
                Tài liệu
              </Link>
              {/* <Link
                href={routes.posts}
                className={cx('home', {
                  active: pathname === routes.posts || pathname.startsWith('/posts/'),
                })}
              >
                Bài viết
              </Link> */}
              <Link
                href={routes.learningPlans}
                className={cx('home', {
                  active: pathname.startsWith(routes.myTarget) || pathname.startsWith(routes.learningPlans),
                })}
              >
                Lộ trình
              </Link>
              {/* <Link
                href={routes.myAlbums}
                className={cx('home', {active: pathname === routes.myAlbums})}
              >
                Từ vựng
              </Link> */}
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
            <ThemeToggle className={cx('themeToggle')} />
            {showStats && (
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
                  <Link href={buildLoginUrl(pathname === routes.home ? null : pathname, {mode: 'signup'})} className={cx('ctaBtn')}>
                    <span>Đăng ký</span>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                    </svg>
                  </Link>
                </div>
              ) : (
                <div className={cx('userMenuWrapper')}>
                  {canCreateTest && (
                    <div className={cx('ctaSlot')}>
                      <Button
                        variant=""
                        className={cx('ctaBtn')}
                        onClick={handleCreateTest}
                      >
                        Tạo bài kiểm tra
                      </Button>
                    </div>
                  )}
                  {showStats && (
                    <div className={cx('statsCluster')}>
                      {statsWithHint}
                    </div>
                  )}
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
                    <Dropdown.Menu align="end" className={cx('custom-dropdown')}>
                      <div className={cx('dropdownHead')}>
                        <p className={cx('dropdownName')}>{user.fullName || user.userName}</p>
                        {user.email && <p className={cx('dropdownEmail')}>{user.email}</p>}
                      </div>
                      <Dropdown.Item as={Link} href={routes.dashboard}>
                        Hồ sơ
                      </Dropdown.Item>
                      <Dropdown.Item as={Link} href={routes.myCertificates}>
                        Chứng chỉ của tôi
                      </Dropdown.Item>
                      <Dropdown.Divider className={cx('dropdownDivider')} />
                      <Dropdown.Item onClick={handleLogout} className={cx('logoutItem')}>
                        Đăng xuất
                      </Dropdown.Item>
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
