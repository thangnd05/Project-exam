import {
  Nav,
  Container,
  Navbar,
  Button,
  Dropdown,
  Image,
} from 'react-bootstrap';
import { useState } from 'react';
import {Link, NavLink, useNavigate} from 'react-router-dom';
import {toast} from 'react-toastify';
import 'bootstrap/dist/css/bootstrap.min.css';
import style from './header.module.scss';
import images from '~/shared/assets/images';
import classNames from 'classnames/bind';
import {useAuth} from '~/shared/hooks/useAuth';
import {name} from '~/shared/assets/images';
import routes from '~/shared/config/Routes';
import JoinClassModal from '~/features/classes/modals/JoinClassModal';
import CreateClassModal from '~/features/classes/modals/CreateClassModal';
import CreateTestModal from '~/features/tests/components/CreateTestModal';
import StreakBadge from '~/features/gamification/streak/StreakBadge';
import CoinQuestMenu from '~/features/gamification/coin/CoinQuestMenu';
import AvatarWithCosmetic from '~/features/gamification/cosmetic/AvatarWithCosmetic';
import {useCosmetics} from '~/shared/hooks/useCosmetics';

const cx = classNames.bind(style);

function Header() {
  const {user, logout} = useAuth();
  const {frame: cosmeticFrame, badge: cosmeticBadge} = useCosmetics();
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showCreateTestModal, setShowCreateTestModal] = useState(false);
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate(routes.home);
  };

  const handleClassAction = (e, targetRoute, modalType = null) => {
    e.preventDefault();
    if (!user) {
      toast.warning('Bạn cần đăng nhập để thao tác lớp học!');
      navigate(routes.login);
      return;
    }

    if (modalType === 'join') {
      setShowJoinModal(true);
    } else if (modalType === 'create') {
      setShowCreateModal(true);
    } else {
      navigate(targetRoute);
    }
  };

  return (
    <div className={cx('wrapper')}>
      <div className={cx('pill')}>
        <Navbar expand="lg" className={cx('navbarRoot')}>
          <Container fluid>
            <Navbar.Brand as={Link} to={routes.home} className={cx('brand')}>
              <div className={cx('brandInner')}>
                <Image
                  src={images.logoW}
                  alt="logo"
                  height="32"
                  loading="lazy"
                  className={cx('logo-brand')}
                />
                <span className={cx('brandName')}>{name}</span>
              </div>
            </Navbar.Brand>

            {user && (
              <div className={cx('mobileHeaderActions', 'd-lg-none')}>
                <StreakBadge />
                <CoinQuestMenu />
              </div>
            )}

            <Navbar.Collapse id="basic-navbar-nav" className={cx('desktopCollapse')}>
              <Nav className={cx('desktopNav')}>
                <Nav.Link as={NavLink} to={routes.posts} className={cx('home')}>
                  Bài viết
                </Nav.Link>
                {user && (
                  <Nav.Link as={NavLink} to={routes.myTarget} className={cx('home')}>
                    Lộ trình
                  </Nav.Link>
                )}
                <Nav.Link as={NavLink} to={routes.myAlbums} className={cx('home')}>
                  Từ vựng
                </Nav.Link>
                <Nav.Link as={NavLink} to={routes.MyTest} className={cx('home')}>
                  Bài đã tạo
                </Nav.Link>
                <div className={cx('customMenu')}>
                  <span className={cx('menuTitle')}>Lớp học</span>
                  <div className={cx('menuDropdown')}>
                    <button onClick={(e) => handleClassAction(e, null, 'join')}>
                      Tham gia lớp học
                    </button>
                    <button onClick={(e) => handleClassAction(e, routes.myClasses)}>
                      Vào lớp học
                    </button>
                    <button onClick={(e) => handleClassAction(e, null, 'create')}>
                      Tạo lớp học
                    </button>
                  </div>
                </div>
              </Nav>
              <Nav className={cx('desktopNav')}>
                {!user ? (
                  <>
                    <Nav.Link
                      as={Link}
                      to={routes.login}
                      state={{mode: 'signin'}}
                      className={cx('home')}
                    >
                      Đăng nhập
                    </Nav.Link>
                    <Nav.Link
                      as={Link}
                      to={routes.login}
                      state={{mode: 'signup'}}
                      className={cx('home')}
                    >
                      Đăng ký
                    </Nav.Link>
                  </>
                ) : (
                  <div className={cx('userMenuWrapper')}>
                    <Button
                      variant=""
                      className={cx('new-test')}
                      onClick={() => setShowCreateTestModal(true)}
                    >
                      Tạo bài kiểm tra
                    </Button>
                    <StreakBadge />
                    <CoinQuestMenu />
                    <Dropdown>
                      <Dropdown.Toggle as="div" className={cx('user-info')}>
                        <AvatarWithCosmetic
                          src={user?.avatarUrl}
                          fallbackSrc={images.avtImage}
                          size={32}
                          frame={cosmeticFrame}
                          badge={cosmeticBadge}
                        />
                        <div className={cx('userNameWrapper')}>
                          <span className={cx('username')}>{user.userName}</span>
                        </div>
                      </Dropdown.Toggle>
                      <Dropdown.Menu className={cx('custom-dropdown')}>
                        <Dropdown.Item as={Link} to={routes.profile}>
                          Hồ sơ
                        </Dropdown.Item>
                        <Dropdown.Item onClick={handleLogout}>Đăng xuất</Dropdown.Item>
                      </Dropdown.Menu>
                    </Dropdown>
                  </div>
                )}
              </Nav>
            </Navbar.Collapse>
          </Container>
        </Navbar>
      </div>

      <JoinClassModal show={showJoinModal} onClose={() => setShowJoinModal(false)} />
      <CreateClassModal show={showCreateModal} onClose={() => setShowCreateModal(false)} />
      <CreateTestModal
        show={showCreateTestModal}
        onClose={() => setShowCreateTestModal(false)}
        mode="personal"
        onSuccess={() => setShowCreateTestModal(false)}
      />
    </div>
  );
}

export default Header;
