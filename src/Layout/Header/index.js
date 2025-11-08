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
import {Link, useNavigate, useLocation} from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import style from './header.module.scss';
import {FontAwesomeIcon} from '@fortawesome/react-fontawesome';
import images from '~/assets/images';
import classNames from 'classnames/bind';
// import Search from '../Search';
import {useAuth} from '../../hook/useAuth';
import {name} from '~/assets/images';
import routes from '~/config/Routes';
import {faBars} from '@fortawesome/free-solid-svg-icons';

const cx = classNames.bind(style);

function Header() {
  const {user, logout} = useAuth();
  const [showOffcanvas, setShowOffcanvas] = useState(false);
  const navigate = useNavigate();
  const location = useLocation(); // ✅ SỬA 2: Lấy thông tin location hiện tại

  const handleClose = () => setShowOffcanvas(false);
  const handleShow = () => setShowOffcanvas(true);

  const handleLogout = async () => {
    await logout();
    navigate(routes.home); // redirect về trang chính sau logout
  };

  return (
    <div className={cx('wrapper')}>
      <Navbar expand="lg" className={cx('bg-body-tertiary p-5')}>
        <Container fluid="lg">
          <Navbar.Brand
            as={Link}
            to={routes.home}
            className={cx('brand', 'fw-bold')}
          >
            <div
              className="d-flex align-items-center justify-content-center"
              style={{width: '140px'}}
            >
              <Image
                src={images.logo}
                alt="logo"
                height="70"
                loading="lazy"
                className={cx('logo-brand')}
              />
              {name}
            </div>
          </Navbar.Brand>

          <Button
            variant="outline-secondary"
            onClick={handleShow}
            className={cx('d-lg-none', 'ms-auto', 'bar')}
            aria-controls="basic-navbar-nav"
          >
            <FontAwesomeIcon icon={faBars} />
          </Button>

          {/* Navbar lớn */}
          <Navbar.Collapse
            id="basic-navbar-nav"
            className={cx('d-none d-lg-flex')}
          >
            <Nav className={cx('mx-5')}>
              <Nav.Link as={Link} to={routes.about} className={cx('home')}>
                Giới thiệu
              </Nav.Link>
            </Nav>
            <Nav className={cx('mx-5')}>
              <Nav.Link as={Link} to={routes.myAlbums} className={cx('home')}>
                Từ vựng
              </Nav.Link>
            </Nav>
            <Nav className={cx('mx-5')}>
              <Nav.Link as={Link} to={routes.MyTest} className={cx('home')}>
                Bài đã tạo
              </Nav.Link>
            </Nav>
            <Nav>{/* <Search /> */}</Nav>
            <Nav>
              {user ? (
                <>
                  <Nav.Link
                    as={Link}
                    to={routes.createTest}
                    className={cx('mx-5')}
                  >
                    <Button variant="" className={cx('new-test')}>
                      Tạo bài kiểm tra
                    </Button>
                  </Nav.Link>
                  <Dropdown>
                    <Dropdown.Toggle as="div" className={cx('user-info')}>
                      <Image
                        src={images.avtImage}
                        alt="Avatar"
                        className={cx('avatar')}
                      />
                      <div>
                        <span className={cx('username')}>{user.username}</span>
                      </div>
                    </Dropdown.Toggle>
                    <Dropdown.Menu className={cx('custom-dropdown')}>
                      <Dropdown.Item as={Link} to={routes.profile}>
                        Hồ sơ
                      </Dropdown.Item>
                      <Dropdown.Item
                        onClick={handleLogout}
                        as={Link}
                        to={routes.home}
                      >
                        Đăng xuất
                      </Dropdown.Item>
                    </Dropdown.Menu>
                  </Dropdown>
                </>
              ) : (
                <>
                  <Nav.Link
                    as={Link}
                    to={routes.login}
                    state={{from: location}}
                    className={cx('nav-link', 'login-link', 'home')}
                  >
                    Đăng nhập
                  </Nav.Link>
                  <Nav.Link
                    as={Link}
                    to={routes.register}
                    className={cx('mx-5', 'home')}
                  >
                    Đăng ký
                  </Nav.Link>
                </>
              )}
            </Nav>
          </Navbar.Collapse>

          {/* Offcanvas (màn hình nhỏ) */}
          <Offcanvas show={showOffcanvas} onHide={handleClose} placement="end">
            <Offcanvas.Header closeButton>
              <Offcanvas.Title as={Link} to={routes.home} onClick={handleClose}>
                EDT
              </Offcanvas.Title>
            </Offcanvas.Header>
            <Offcanvas.Body>
              <Nav className="flex-column" onClick={handleClose}>
                <Nav.Link as={Link} to={routes.content}>
                  Bài viết
                </Nav.Link>
                <Nav.Link as={Link} to={routes.about}>
                  Giới thiệu
                </Nav.Link>
                {user ? (
                  <>
                    <Nav.Link as={Link} to={routes.post}>
                      Tạo bài viết
                    </Nav.Link>
                    <Dropdown>
                      <Dropdown.Toggle as="div" className={cx('user-info')}>
                        <Image
                          src={images.avtImage}
                          alt="Avatar"
                          className={cx('avatar')}
                        />
                        <div>
                          <span className={cx('username')}>
                            {user.username}
                          </span>
                        </div>
                      </Dropdown.Toggle>
                      <Dropdown.Menu>
                        <Dropdown.Item as={Link} to={routes.profile}>
                          Hồ sơ
                        </Dropdown.Item>
                        <Dropdown.Item
                          onClick={handleLogout}
                          as={Link}
                          to={routes.home}
                        >
                          Đăng xuất
                        </Dropdown.Item>
                      </Dropdown.Menu>
                    </Dropdown>
                  </>
                ) : (
                  <>
                    <Nav.Link as={Link} to={routes.login}>
                      Đăng nhập
                    </Nav.Link>
                    <Nav.Link as={Link} to={routes.register}>
                      Đăng ký
                    </Nav.Link>
                  </>
                )}
              </Nav>
            </Offcanvas.Body>
          </Offcanvas>
        </Container>
      </Navbar>
    </div>
  );
}

export default Header;
