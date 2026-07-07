import {Container} from 'react-bootstrap';
import {Link} from 'react-router-dom';
import {useEffect, useRef, useState} from 'react';
import {motion, useInView} from 'framer-motion';
import {FaFacebookSquare, FaInstagram, FaYoutube} from 'react-icons/fa';

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

const STATS = [
  {target: 500, suffix: '+', label: 'Câu hỏi trắc nghiệm'},
  {target: 50, suffix: '+', label: 'Bộ đề hoàn chỉnh'},
  {target: 100, suffix: '%', label: 'Cơ hội thi tốt nhất'},
];

const StatRow = ({target, suffix, label, isActive}) => {
  const value = useCountUp(target, isActive);
  return (
    <div className={styles.statRow}>
      <span className={styles.statValue}>
        {value}
        {suffix}
      </span>
      <span className={styles.statLabel}>{label}</span>
    </div>
  );
};

function Footer() {
  const statsRef = useRef(null);
  const inView = useInView(statsRef, {once: true, amount: 0.4});

  return (
    <footer className={styles.footer}>
      <Container className={styles.container}>
        <div className={styles.topGrid}>
          {/* Brand */}
          <motion.div
            className={styles.brandCol}
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
            <p className={styles.brandSub}>
              Đồng hành cùng bạn trên hành trình chinh phục tri thức.
            </p>
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

          {/* Links */}
          <div className={styles.linksCol}>
            <span className={styles.colTitle}>Liên kết</span>
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

          {/* Stats */}
          <div className={styles.statsCol} ref={statsRef}>
            <span className={styles.colTitle}>Con số ấn tượng</span>
            {STATS.map((s) => (
              <StatRow key={s.label} {...s} isActive={inView} />
            ))}
          </div>
        </div>

        <div className={styles.divider} />

        {/* Bottom Bar */}
        <div className={styles.bottomBar}>
          <div className={styles.bottomLeft}>
            <span className={styles.contactText}>Liên hệ:</span>
            <a className={styles.emailLink} href="mailto:winde.contact@gmail.com">
              winde.contact@gmail.com
            </a>
          </div>
          <span className={styles.copyrightText}>
            © 2026 WinDe. All rights reserved.
          </span>
        </div>
      </Container>
    </footer>
  );
}

export default Footer;
