import {Container, Row, Col} from 'react-bootstrap';
import {Link} from 'react-router-dom';
import {useEffect, useRef, useState} from 'react';
import {motion, useInView} from 'framer-motion';
import {
  FaFacebookSquare,
  FaInstagram,
  FaYoutube,
  FaEnvelope,
  FaListUl,
  FaLayerGroup,
  FaCheckCircle,
} from 'react-icons/fa';

import styles from './footer.module.scss';
import images from '~/assets/images';
import routes from '~/config/Routes';

// Hook đếm số 0 → target khi isActive
function useCountUp(target, isActive, duration = 1400) {
  const [value, setValue] = useState(0);
  const startedRef = useRef(false);

  useEffect(() => {
    if (!isActive || startedRef.current) return undefined;
    startedRef.current = true;
    const start = performance.now();
    let raf;

    const tick = (now) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // easeOutCubic
      setValue(Math.round(target * eased));
      if (progress < 1) {
        raf = requestAnimationFrame(tick);
      }
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, isActive, duration]);

  return value;
}

const StatCard = ({icon: Icon, target, suffix, label, isActive, delay}) => {
  const value = useCountUp(target, isActive);
  return (
    <motion.div
      className={styles.statCard}
      initial={{opacity: 0, y: 20}}
      whileInView={{opacity: 1, y: 0}}
      viewport={{once: true, amount: 0.4}}
      transition={{duration: 0.6, delay, ease: [0.22, 1, 0.36, 1]}}
    >
      <div className={styles.statIconWrapper}>
        <Icon className={styles.statIcon} />
      </div>
      <div className={styles.statContent}>
        <span className={styles.statValue}>
          {value}
          {suffix}
        </span>
        <div className={styles.statLabel}>{label}</div>
      </div>
    </motion.div>
  );
};

function Footer() {
  const statsRef = useRef(null);
  const inView = useInView(statsRef, {once: true, amount: 0.4});

  return (
    <footer className={styles.footer}>
      <Container className={styles.container}>
        <Row className="align-items-stretch">
          {/* Brand Section */}
          <Col lg={4} md={12} className="mb-4 mb-lg-0">
            <motion.div
              className={styles.brandContainer}
              initial={{opacity: 0, y: 20}}
              whileInView={{opacity: 1, y: 0}}
              viewport={{once: true, amount: 0.4}}
              transition={{duration: 0.6, ease: [0.22, 1, 0.36, 1]}}
            >
              <div className={styles.logoRow}>
                <div className={styles.logoWrapper}>
                  <img src={images.logoW} alt="Logo" />
                </div>
                <h3 className={styles.brandName}>WinDe</h3>
              </div>
              <p className={styles.brandSub}>Đồng hành cùng bạn trên hành trình chinh phục tri thức.</p>

              <div className={styles.footerLinks}>
                <Link className={styles.footerLink} to={routes.about}>
                  Giới thiệu
                </Link>
                <Link className={styles.footerLink} to={routes.policy}>
                  Chính sách
                </Link>
                <Link className={styles.footerLink} to={routes.service}>
                  Điều khoản &amp; dịch vụ
                </Link>
              </div>

              <div className={styles.socialIcons}>
                <a href="https://facebook.com" target="_blank" rel="noreferrer" aria-label="Facebook">
                  <FaFacebookSquare />
                </a>
                <a href="https://instagram.com" target="_blank" rel="noreferrer" aria-label="Instagram">
                  <FaInstagram />
                </a>
                <a href="https://youtube.com" target="_blank" rel="noreferrer" aria-label="YouTube">
                  <FaYoutube />
                </a>
              </div>
            </motion.div>
          </Col>

          {/* Statistics Section */}
          <Col lg={8} md={12}>
            <div className={styles.statsWrapper} ref={statsRef}>
              <StatCard
                icon={FaListUl}
                target={500}
                suffix="+"
                label="Câu hỏi trắc nghiệm"
                isActive={inView}
                delay={0.1}
              />
              <StatCard
                icon={FaLayerGroup}
                target={50}
                suffix="+"
                label="Bộ đề hoàn chỉnh"
                isActive={inView}
                delay={0.2}
              />
              <StatCard
                icon={FaCheckCircle}
                target={100}
                suffix="%"
                label="Cơ hội thi tốt nhất"
                isActive={inView}
                delay={0.3}
              />
            </div>
          </Col>
        </Row>

        <div className={styles.divider} />

        {/* Bottom Bar */}
        <motion.div
          className={styles.bottomBar}
          initial={{opacity: 0}}
          whileInView={{opacity: 1}}
          viewport={{once: true, amount: 0.6}}
          transition={{duration: 0.6, delay: 0.2}}
        >
          <div className={styles.bottomLeft}>
            <span className={styles.contactText}>Liên hệ với chúng tôi</span>
            <div className={styles.emailBox}>
              <FaEnvelope className={styles.emailIcon} />
              <span className={styles.emailText}>winde.contact@gmail.com</span>
            </div>
          </div>

          <div className={styles.bottomRight}>
            <span className={styles.copyrightText}>© 2026 WinDe. All rights reserved.</span>
          </div>
        </motion.div>
      </Container>
    </footer>
  );
}

export default Footer;
