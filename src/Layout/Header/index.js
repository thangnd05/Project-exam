import {
  Nav,
  Container,
  Navbar,
  Button,
  Dropdown,
  Image,
  Offcanvas
} from 'react-bootstrap';
import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import style from './header.module.scss';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import images from '~/assets/images';
import classNames from 'classnames/bind';
// import Search from '../Search';
import { useAuth } from '../../hook/useAuth';
import { name } from '~/assets/images';
import routes from '~/config/Routes';
import { faBars } from '@fortawesome/free-solid-svg-icons';
import JoinClassModal from "~/components/modals/JoinClassModal";


const cx = classNames.bind(style);

function Header() {
  const { user, logout } = useAuth();
  const [showOffcanvas, setShowOffcanvas] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const navigate = useNavigate();

  const handleClose = () => setShowOffcanvas(false);
  const handleShow = () => setShowOffcanvas(true);

  const handleLogout = async () => {
    await logout();
    navigate(routes.home);
  };
  // --- Sub-components để tái sử dụng ---
  const NavItems = ({ isMobile = false }) => {
    const handleClassAction = (e, targetRoute, isModal = false) => {
      e.preventDefault();
      if (!user) {
        alert("⚠️ Bạn cần đăng nhập để tham gia lớp học!");
        navigate(routes.login);
        isMobile && handleClose();
        return;
      }

      if (isModal) {
        setShowJoinModal(true);
      } else {
        navigate(targetRoute);
      }
      isMobile && handleClose();
    };

    return (
      <>
        <Nav.Link as={Link} to={routes.about} className={cx('home', { 'mx-5': !isMobile })}>
          Giới thiệu
        </Nav.Link>
        <Nav.Link as={Link} to={routes.myAlbums} className={cx('home', { 'mx-5': !isMobile })}>
          Từ vựng
        </Nav.Link>
        <Nav.Link as={Link} to={routes.MyTest} className={cx('home', { 'mx-5': !isMobile })}>
          Bài đã tạo
        </Nav.Link>
        <div className={cx("customMenu", { "mx-5": !isMobile })}>
          <span className={cx("menuTitle")}>Lớp học</span>
          <div className={cx("menuDropdown")}>
            <button onClick={(e) => handleClassAction(e, null, true)}>
              Tham gia lớp học
            </button>
            <button onClick={(e) => handleClassAction(e, routes.myClasses)}>
              Vào lớp học
            </button>
          </div>
        </div>
      </>
    );
  };

  const UserMenu = ({ isMobile = false }) => {
    if (!user) {
      return (
        <>
          <Nav.Link
            as={Link}
            to={routes.login}
            state={{ mode: 'signin' }}
            className={cx('home', 'login-link', { 'mx-5': !isMobile })}
            onClick={() => isMobile && handleClose()}
          >
            Đăng nhập
          </Nav.Link>
          <Nav.Link
            as={Link}
            to={routes.login}
            state={{ mode: 'signup' }}
            className={cx('home', { 'mx-5': !isMobile })}
            onClick={() => isMobile && handleClose()}
          >
            Đăng ký
          </Nav.Link>
        </>
      );
    }

    return (
      <div className={cx('d-lg-flex align-items-center')}>
        {!isMobile && (
          <Nav.Link as={Link} to={routes.createTest} className={cx('mx-5')}>
            <Button variant="" className={cx('new-test')}>
              Tạo bài kiểm tra
            </Button>
          </Nav.Link>
        )}
        <Dropdown className={cx(isMobile ? 'mt-3' : '')}>
          <Dropdown.Toggle as="div" className={cx('user-info')}>
            <Image
              src={user?.avatarUrl || images.avtImage}
              alt="Avatar"
              className={cx("avatar")}
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = images.avtImage;
              }}
            />
            <div>
              <span className={cx('username')}>{user.username}</span>
            </div>
          </Dropdown.Toggle>
          <Dropdown.Menu className={cx('custom-dropdown')}>
            <Dropdown.Item as={Link} to={routes.profile} onClick={() => isMobile && handleClose()}>
              Hồ sơ
            </Dropdown.Item>
            <Dropdown.Item onClick={() => { handleLogout(); isMobile && handleClose(); }}>
              Đăng xuất
            </Dropdown.Item>
          </Dropdown.Menu>
        </Dropdown>
      </div>
    );
  };

  return (
    <div className={cx('wrapper')}>
      <Navbar expand="lg" className={cx('bg-body-tertiary p-5')}>
        <Container fluid="lg">
          <Navbar.Brand as={Link} to={routes.home} className={cx('brand', 'fw-bold')}>
            <div className="d-flex align-items-center justify-content-center" style={{ width: '140px' }}>
              <Image src={images.logo} alt="logo" height="70" loading="lazy" className={cx('logo-brand')} />
              {name}
            </div>
          </Navbar.Brand>

          <Button variant="outline-secondary" onClick={handleShow} className={cx('d-lg-none', 'ms-auto', 'bar')}>
            <FontAwesomeIcon icon={faBars} />
          </Button>

          {/* Desktop Navbar */}
          <Navbar.Collapse id="basic-navbar-nav" className={cx('d-none d-lg-flex justify-content-between')}>
            <Nav className="d-flex align-items-center">
              <NavItems />
            </Nav>
            <Nav className="d-flex align-items-center">
              <UserMenu />
            </Nav>
          </Navbar.Collapse>

          {/* Mobile Offcanvas */}
          <Offcanvas show={showOffcanvas} onHide={handleClose} placement="end">
            <Offcanvas.Header closeButton>
              <Offcanvas.Title as={Link} to={routes.home} onClick={handleClose}>
                {name}
              </Offcanvas.Title>
            </Offcanvas.Header>
            <Offcanvas.Body>
              <Nav className="flex-column">
                <NavItems isMobile />
                <hr />
                <UserMenu isMobile />
              </Nav>
            </Offcanvas.Body>
          </Offcanvas>
        </Container>
      </Navbar>

      <JoinClassModal show={showJoinModal} onClose={() => setShowJoinModal(false)} />
    </div>
  );
}

export default Header;
