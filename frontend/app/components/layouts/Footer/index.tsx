'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Container } from 'react-bootstrap';
import { FaFacebookF, FaInstagram, FaYoutube } from 'react-icons/fa';

import { imageAssets, name } from '@/app/assets/images';
import routes from '@/app/configs/Routes';

import styles from './footer.module.scss';

type FooterLink = { label: string; href: string };

const COLUMNS: { title: string; links: FooterLink[] }[] = [
  {
    title: 'Luyện thi',
    links: [
      { label: 'Kỳ thi', href: routes.examTypes },
      { label: 'Lộ trình học', href: routes.generatePlan },
      { label: 'Đề của tôi', href: routes.MyTest },
    ],
  },
  {
    title: 'Hỗ trợ',
    links: [
      { label: 'Giới thiệu', href: routes.about },
      { label: 'Chính sách', href: routes.policy },
      { label: 'Điều khoản & dịch vụ', href: routes.service },
    ],
  },
];

const SOCIALS = [
  { href: 'https://facebook.com', label: 'Facebook', Icon: FaFacebookF },
  { href: 'https://instagram.com', label: 'Instagram', Icon: FaInstagram },
  { href: 'https://youtube.com', label: 'YouTube', Icon: FaYoutube },
];

function Footer() {
  return (
    <footer className={`${styles.footer} theme-locked`}>
      <Container className={styles.container}>
        <div className={styles.top}>
          <div className={styles.brandCol}>
            <Link href={routes.home} className={styles.brand} aria-label="WinDe - Trang chủ">
              <span className={styles.logoWrapper}>
                <Image src={imageAssets.logoW} alt="" width={28} height={28} />
              </span>
              <span className={styles.brandName}>WinDe</span>
            </Link>
          </div>

          {COLUMNS.map(({ title, links }) => (
            <nav key={title} className={styles.linkCol} aria-label={title}>
              <h4 className={styles.colTitle}>{title}</h4>
              <ul className={styles.linkList}>
                {links.map(({ label, href }) => (
                  <li key={label}>
                    <Link className={styles.footerLink} href={href}>
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}

          <div className={styles.linkCol}>
            <h4 className={styles.colTitle}>Theo dõi</h4>
            <div className={styles.socials}>
              {SOCIALS.map(({ href, label, Icon }) => (
                <a key={label} href={href} target="_blank" rel="noreferrer" aria-label={label}>
                  <Icon />
                </a>
              ))}
            </div>
          </div>
        </div>
      </Container>

      <div className={styles.divider} />

      <Container className={styles.container}>
        <div className={styles.bottom}>
          <span className={styles.copyright}>© {name} Exam.. All rights reserved.</span>
        </div>
      </Container>
    </footer>
  );
}

export default Footer;
