import {
  Nav,
  Container,
  Navbar,
  Button,
  Dropdown,
  Image,
  Offcanvas,
} from 'react-bootstrap';
import React, {useState} from 'react';
import {Link, useNavigate} from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import style from './header.module.scss';
import {FontAwesomeIcon} from '@fortawesome/react-fontawesome';
import images from '~/assets/images';
import classNames from 'classnames/bind';
// import Search from '../Search';
import {useAuth} from '../../hooks/useAuth';
import {name} from '~/assets/images';
import routes from '~/config/Routes';
import {faBars} from '@fortawesome/free-solid-svg-icons';
import JoinClassModal from '~/pages/myclass/modals/JoinClassModal';
import CreateClassModal from '~/pages/myclass/modals/CreateClassModal';
import CreateTestModal from '~/components/test/CreateTestModal';
import StreakBadge from '~/components/streak/StreakBadge';
import CoinBadge from '~/components/coin/CoinBadge';

const cx = classNames.bind(style);

function Header() {
  const {user, logout} = useAuth();
  const [showOffcanvas, setShowOffcanvas] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showCreateTestModal, setShowCreateTestModal] = useState(false);
  const navigate = useNavigate();

  const handleClose = () => setShowOffcanvas(false);
  const handleShow = () => setShowOffcanvas(true);

  const handleLogout = async () => {
    await logout();
    navigate(routes.home);
  };
  // --- Sub-components để tái sử dụng ---
  const NavItems = ({isMobile = false}) => {
    const handleClassAction = (e, targetRoute, modalType = null) => {
      e.preventDefault();
      if (!user) {
        alert(' Bạn cần đăng nhập để thao tác lớp học!');
        navigate(routes.login);
        isMobile && handleClose();
        return;
      }

      if (modalType === 'join') {
        setShowJoinModal(true);
      } else if (modalType === 'create') {
        setShowCreateModal(true);
      } else {
        navigate(targetRoute);
      }
      isMobile && handleClose();
    };

    if (isMobile) {
      return (
        <>
          <Nav.Link as={Link} to={routes.posts} className={cx('mobileNavLink')}>
            Bài viết
          </Nav.Link>
          {user && (
            <Nav.Link
              as={Link}
              to={routes.nextStep}
              className={cx('mobileNavLink')}
              onClick={() => handleClose()}
            >
              Lộ trình
            </Nav.Link>
          )}
          <Nav.Link as={Link} to={routes.myAlbums} className={cx('mobileNavLink')}>
            Từ vựng
          </Nav.Link>
          <Nav.Link as={Link} to={routes.MyTest} className={cx('mobileNavLink')}>
            Bài đã tạo
          </Nav.Link>
          <div className={cx('mobileMenuGroup')}>
            <span className={cx('mobileMenuTitle')}>Lớp học</span>
            <button
              type="button"
              className={cx('mobileMenuAction')}
              onClick={(e) => handleClassAction(e, null, 'join')}
            >
              Tham gia lớp học
            </button>
            <button
              type="button"
              className={cx('mobileMenuAction')}
              onClick={(e) => handleClassAction(e, routes.myClasses)}
            >
              Vào lớp học
            </button>
            <button
              type="button"
              className={cx('mobileMenuAction')}
              onClick={(e) => handleClassAction(e, null, 'create')}
            >
              Tạo lớp học
            </button>
          </div>
        </>
      );
    }

    return (
      <>
        <Nav.Link as={Link} to={routes.posts} className={cx('home')}>
          Bài viết
        </Nav.Link>
        {user && (
          <Nav.Link as={Link} to={routes.nextStep} className={cx('home')}>
            Lộ trình
          </Nav.Link>
        )}
        <Nav.Link as={Link} to={routes.myAlbums} className={cx('home')}>
          Từ vựng
        </Nav.Link>
        <Nav.Link as={Link} to={routes.MyTest} className={cx('home')}>
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
      </>
    );
  };

  const UserMenu = ({isMobile = false}) => {
    if (!user) {
      return (
        <>
          <Nav.Link
            as={Link}
            to={routes.login}
            state={{mode: 'signin'}}
            className={cx(isMobile ? 'mobileNavLink' : 'home')}
            onClick={() => isMobile && handleClose()}
          >
            Đăng nhập
          </Nav.Link>
          <Nav.Link
            as={Link}
            to={routes.login}
            state={{mode: 'signup'}}
            className={cx(isMobile ? 'mobileNavLink' : 'home')}
            onClick={() => isMobile && handleClose()}
          >
            Đăng ký
          </Nav.Link>
        </>
      );
    }

    return (
      <div className={cx('userMenuWrapper')}>
        {!isMobile && (
          <Button
            variant=""
            className={cx('new-test')}
            onClick={() => setShowCreateTestModal(true)}
          >
            Tạo bài kiểm tra
          </Button>
        )}
        {isMobile && (
          <Button
            variant=""
            className={cx('new-test', 'mobileCreateTest')}
            onClick={() => setShowCreateTestModal(true)}
          >
            Tạo bài kiểm tra
          </Button>
        )}
        <StreakBadge />
        <CoinBadge />
        <Dropdown className={cx(isMobile ? 'mobileUserDropdown' : '')}>
          <Dropdown.Toggle as="div" className={cx('user-info')}>
            <Image
              src={user?.avatarUrl || images.avtImage}
              alt="Avatar"
              className={cx('avatar')}
              referrerPolicy="no-referrer"
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = images.avtImage;
              }}
            />
            <div className={cx('userNameWrapper')}>
              <span className={cx('username')}>{user.userName}</span>
            </div>
          </Dropdown.Toggle>
          <Dropdown.Menu className={cx('custom-dropdown')}>
            <Dropdown.Item
              as={Link}
              to={routes.targetDashboard}
              onClick={() => isMobile && handleClose()}
            >
              Tổng quan mục tiêu
            </Dropdown.Item>
            <Dropdown.Item
              as={Link}
              to={routes.profile}
              onClick={() => isMobile && handleClose()}
            >
              Hồ sơ
            </Dropdown.Item>
            <Dropdown.Item
              onClick={() => {
                handleLogout();
                isMobile && handleClose();
              }}
            >
              Đăng xuất
            </Dropdown.Item>
          </Dropdown.Menu>
        </Dropdown>
      </div>
    );
  };

  return (
    <div className={cx('wrapper')}>
      <Navbar expand="lg" className={cx('navbarRoot')}>
        <Container fluid>
          <Navbar.Brand
            as={Link}
            to={routes.home}
            className={cx('brand')}
          >
            <div className={cx('brandInner')}>
              <Image
                src={images.logoW}
                alt="logo"
                height="30"
                loading="lazy"
                className={cx('logo-brand')}
              />
              <span className={cx('brandName')}>{name}</span>
            </div>
          </Navbar.Brand>

          <Button
            variant="outline-secondary"
            onClick={handleShow}
            className={cx('d-lg-none', 'ms-auto', 'bar')}
          >
            <FontAwesomeIcon icon={faBars} />
          </Button>

          {/* Desktop Navbar */}
          <Navbar.Collapse
            id="basic-navbar-nav"
            className={cx('desktopCollapse')}
          >
            <Nav className={cx('desktopNav')}>
              <NavItems />
            </Nav>
            <Nav className={cx('desktopNav')}>
              <UserMenu />
            </Nav>
          </Navbar.Collapse>

          {/* Mobile Offcanvas */}
          <Offcanvas
            show={showOffcanvas}
            onHide={handleClose}
            placement="end"
            className={cx('mobileDrawer')}
          >
            <Offcanvas.Header closeButton>
              <Offcanvas.Title as={Link} to={routes.home} onClick={handleClose}>
                {name}
              </Offcanvas.Title>
            </Offcanvas.Header>
            <Offcanvas.Body>
              <Nav className={cx('mobileNav')}>
                <NavItems isMobile />
                <hr />
                <UserMenu isMobile />
              </Nav>
            </Offcanvas.Body>
          </Offcanvas>
        </Container>
      </Navbar>

      <JoinClassModal
        show={showJoinModal}
        onClose={() => setShowJoinModal(false)}
      />
      <CreateClassModal
        show={showCreateModal}
        onClose={() => setShowCreateModal(false)}
      />
      <CreateTestModal
        show={showCreateTestModal}
        onClose={() => setShowCreateTestModal(false)}
        mode="personal"
        onSuccess={() => {
          setShowCreateTestModal(false);
          // Optionally navigate to test list or refresh
        }}
      />
    </div>
  );
}

export default Header;
