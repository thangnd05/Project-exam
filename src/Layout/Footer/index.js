import { Container, Row, Col } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import {
  FaFacebookSquare,
  FaInstagram,
  FaYoutube,
  FaEnvelope,
  FaListUl,
  FaLayerGroup,
  FaCheckCircle
} from 'react-icons/fa';

import styles from './footer.module.scss';
import images from '~/assets/images';
import routes from '~/config/Routes';

function Footer() {
  return (
    <footer className={styles.footer}>
      <Container className={styles.container}>
        <Row className="align-items-center">
          {/* Brand Section */}
          <Col lg={4} md={12} className="mb-4 mb-lg-0">
            <div className={styles.brandContainer}>
              <div className={styles.logoWrapper}>
                <img src={images.logo} alt="Logo" />
              </div>
              <div className={styles.brandInfo}>
                <h3 className={styles.brandName}>WinDe</h3>
                <Link className={styles.footerLink} to={routes.about}>
                  Giới thiệu
                </Link>
                <div className={styles.footerLinks}>
                  <Link className={styles.footerLink} to={routes.policy}>
                    Chính sách
                  </Link>
                  <Link className={styles.footerLink} to={routes.service}>
                    Điều khoản & dịch vụ
                  </Link>
                </div>
                <div className={styles.socialIcons}>
                  <a href="#"><FaFacebookSquare /></a>
                  <a href="#"><FaInstagram /></a>
                  <a href="#"><FaYoutube /></a>
                </div>
              </div>
            </div>
          </Col>

          {/* Statistics Section */}
          <Col lg={8} md={12}>
            <div className={styles.statsWrapper}>
              <div className={styles.statItem}>
                <div className={styles.statMain}>
                  <FaListUl className={styles.statIcon} />
                  <span className={styles.statValue}>500+</span>
                </div>
                <div className={styles.statLabel}>Câu hỏi trắc nghiệm</div>
              </div>

              <div className={styles.verticalDivider} />

              <div className={styles.statItem}>
                <div className={styles.statMain}>
                  <FaLayerGroup className={styles.statIcon} />
                  <span className={styles.statValue}>50+</span>
                </div>
                <div className={styles.statLabel}>Bộ đề hoàn chỉnh</div>
              </div>

              <div className={styles.verticalDivider} />

              <div className={styles.statItem}>
                <div className={styles.statMain}>
                  <FaCheckCircle className={styles.statIcon} />
                  <span className={styles.statValue}>100%</span>
                </div>
                <div className={styles.statLabel}>Cơ hội thi tốt nhất</div>
              </div>
            </div>
          </Col>
        </Row>

        {/* Rectangular Contact Bar at Bottom Right */}
        <div className={styles.contactBar}>
          <div className={styles.emailBox}>
            <FaEnvelope className={styles.emailIcon} />
            <span className={styles.emailText}>winde.contact@gmail.com</span>
          </div>
        </div>
      </Container>
    </footer>
  );
}

export default Footer;
