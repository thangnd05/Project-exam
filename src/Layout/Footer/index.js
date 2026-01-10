import {Container, Row, Col} from 'react-bootstrap';
import {
  FaFacebookSquare,
  FaInstagram,
  FaYoutube,
  FaEnvelope,
} from 'react-icons/fa';
import styles from './footer.module.scss'; // Import module SCSS
import {Link} from 'react-router-dom';
import {name} from '~/assets/images';
import images from '~/assets/images';
import routes from '~/config/Routes';

function Footer() {
  return (
    // Không cần 'styles.wrapper' ở đây nữa
    <Container fluid className="p-0">
      {/* Xóa 'bg-secondary text-center text-lg-start text-white'
        Thêm className={styles.footer}
      */}
      <footer className={styles.footer}>
        {/* Grid container */}
        <Container className="p-4">
          {/* Grid row */}
          <Row className="my-4">
            {/* Grid column */}
            <Col lg={3} md={6} className="mb-4 mb-md-0">
              {/* Thêm className={styles.logoContainer} */}
              <div className={styles.logoContainer}>
                <img
                  src={images.logo}
                  className={styles.logo} // Thêm className={styles.logo}
                  alt="Logo"
                  loading="lazy"
                />
              </div>

              {/* Thêm className={styles.socialLinks} 
                Sửa lại HTML cho đúng chuẩn (dùng <li>)
              */}
              <ul className={styles.socialLinks}>
                <li>
                  <a href="#!">
                    <FaFacebookSquare />
                  </a>
                </li>
                <li>
                  <a href="#!">
                    <FaInstagram />
                  </a>
                </li>
                <li>
                  <a href="#!">
                    <FaYoutube />
                  </a>
                </li>
              </ul>
            </Col>
            {/* Grid column */}

            {/* Grid column */}
            <Col lg={3} md={6} className="mb-4 mb-md-0">
              <h5 className={styles.titleName}>{name}</h5>
              <ul className={styles.navList}>
                <li className={styles.navItem}>
                  <Link to={routes.about} className={styles.navLink}>
                    Giới thiệu
                  </Link>
                </li>
              </ul>
            </Col>
            {/* Grid column */}

            {/* Grid column */}
            <Col lg={3} md={6} className="mb-4 mb-md-0">
              <h5 className={styles.title}>Chính Sách và Dịch vụ</h5>
              <ul className={styles.navList}>
                <li className={styles.navItem}>
                  <Link to={routes.policy} className={styles.navLink}>
                    Chính Sách Sử Dụng
                  </Link>
                </li>
                <li className={styles.navItem}>
                  <Link to={routes.service} className={styles.navLink}>
                    Dịch Vụ Người Dùng
                  </Link>
                </li>
              </ul>
            </Col>
            {/* Grid column */}

            {/* Grid column */}
            <Col lg={3} md={6} className="mb-4 mb-md-0">
              <h5 className={styles.title}>Contact</h5>
              <ul className={styles.contactInfo}>
                <li>
                  <p>
                    <FaEnvelope /> {/* Xóa class 'pe-2 mb-0' */}
                    winde.contact@gmail.com
                  </p>
                </li>
              </ul>
            </Col>
            {/* Grid column */}
          </Row>
          {/* Grid row */}
        </Container>
        {/* Grid container */}

        {/* Copyright */}
        {/* Xóa style inline
          Thêm className={styles.copyright}
        */}
        <div className={styles.copyright}>
          {name} - Nền tảng chia sẻ kiến thức của mọi người
        </div>
        {/* Copyright */}
      </footer>
    </Container>
  );
}

export default Footer;
