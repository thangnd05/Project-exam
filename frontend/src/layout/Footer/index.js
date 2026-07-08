import {Container} from 'react-bootstrap';
import {Link} from 'react-router-dom';
import {useEffect, useRef, useState} from 'react';
import {motion, useInView} from 'framer-motion';
import {FaFacebookSquare, FaInstagram, FaYoutube} from 'react-icons/fa';

import styles from './footer.module.scss';
import images from '~/assets/images';
import routes from '~/config/Routes';

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
      const eased = 1 - Math.pow(1 - progress, 3);
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

const LINKS = [
  {to: routes.about, label: 'Giới thiệu'},
  {to: routes.policy, label: 'Chính sách'},
  {to: routes.service, label: 'Điều khoản & dịch vụ'},
];

const SOCIALS = [
  {href: 'https://facebook.com', label: 'Facebook', Icon: FaFacebookSquare},
  {href: 'https://instagram.com', label: 'Instagram', Icon: FaInstagram},
  {href: 'https://youtube.com', label: 'YouTube', Icon: FaYoutube},
];

const fadeUp = {
  initial: {opacity: 0, y: 18},
  whileInView: {opacity: 1, y: 0},
  viewport: {once: true, amount: 0.3},
  transition: {duration: 0.55, ease: [0.22, 1, 0.36, 1]},
};

const StatCard = ({target, suffix, label, isActive, index}) => {
  const value = useCountUp(target, isActive);

  return (
    <motion.div
      className={styles.statCard}
      initial={{opacity: 0, y: 14, scale: 0.97}}
      whileInView={{opacity: 1, y: 0, scale: 1}}
      viewport={{once: true, amount: 0.4}}
      transition={{duration: 0.5, delay: index * 0.08, ease: [0.22, 1, 0.36, 1]}}
    >
      <span className={styles.statValue}>
        {value}
        {suffix}
      </span>
      <span className={styles.statLabel}>{label}</span>
    </motion.div>
  );
};

function Footer() {
  const statsRef = useRef(null);
  const inView = useInView(statsRef, {once: true, amount: 0.35});

  return (
    <footer className={styles.footer}>
      <div className={styles.bgDecor} aria-hidden="true">
        <span className={styles.orbPrimary} />
        <span className={styles.orbSecondary} />
        <span className={styles.gridOverlay} />
      </div>

      <Container className={styles.container}>
        <div className={styles.topGrid}>
          <motion.div className={styles.brandCol} {...fadeUp}>
            <div className={styles.logoRow}>
              <div className={styles.logoWrapper}>
                <img src={images.logoW} alt="WinDe logo" />
              </div>
              <div className={styles.brandText}>
                <h3 className={styles.brandName}>WinDe</h3>
                <span className={styles.brandBadge}>Nền tảng luyện thi</span>
              </div>
            </div>
            <p className={styles.brandSub}>
              Đồng hành cùng bạn trên hành trình chinh phục tri thức.
            </p>
            <div className={styles.socialIcons}>
              {SOCIALS.map(({href, label, Icon}) => (
                <a key={label} href={href} target="_blank" rel="noreferrer" aria-label={label}>
                  <Icon />
                </a>
              ))}
            </div>
          </motion.div>

          <div className={styles.infoGrid}>
            <motion.nav className={styles.linksCol} aria-label="Liên kết footer" {...fadeUp} transition={{...fadeUp.transition, delay: 0.06}}>
              <span className={styles.colTitle}>Liên kết</span>
              <ul className={styles.linkList}>
                {LINKS.map(({to, label}) => (
                  <li key={to}>
                    <Link className={styles.footerLink} to={to}>
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </motion.nav>

            <div className={styles.statsCol} ref={statsRef}>
              <motion.span
                className={styles.colTitle}
                initial={{opacity: 0}}
                whileInView={{opacity: 1}}
                viewport={{once: true}}
                transition={{duration: 0.4}}
              >
                Con số ấn tượng
              </motion.span>
              <div className={styles.statsGrid}>
                {STATS.map((stat, index) => (
                  <StatCard key={stat.label} {...stat} isActive={inView} index={index} />
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className={styles.divider} />

        <motion.div
          className={styles.bottomBar}
          initial={{opacity: 0}}
          whileInView={{opacity: 1}}
          viewport={{once: true}}
          transition={{duration: 0.5, delay: 0.1}}
        >
          <div className={styles.bottomLeft}>
            <span className={styles.contactText}>Liên hệ</span>
            <a className={styles.emailLink} href="mailto:winde.contact@gmail.com">
              winde.contact@gmail.com
            </a>
          </div>
          <span className={styles.copyrightText}>© 2026 WinDe. All rights reserved.</span>
        </motion.div>
      </Container>
    </footer>
  );
}

export default Footer;
