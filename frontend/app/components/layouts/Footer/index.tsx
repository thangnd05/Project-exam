'use client';

import Link from 'next/link';
import Image from 'next/image';
import { FiMail } from 'react-icons/fi';

import { imageAssets } from '@/app/assets/images';
import routes from '@/app/configs/Routes';

import styles from './footer.module.scss';

const CONTACT_EMAIL = 'contact@frostscope.com';
const DISPUTE_EMAIL = 'dispute@frostscope.com';

type FooterLink = { label: string; href: string };

// Bố cục theo mẫu FrostScope: thương hiệu (2 cột) + Luyện thi + Về chúng tôi + Pháp lý.
const COLUMNS: { title: string; links: FooterLink[]; note?: string }[] = [
  {
    title: 'Luyện thi',
    links: [
      { label: 'Kho đề thi', href: routes.examTypes },
      { label: 'Chứng chỉ', href: `${routes.home}#certifications` },
      { label: 'Bảng xếp hạng', href: `${routes.home}#rankscope` },
      { label: 'Kiểm tra nhanh', href: `${routes.home}#hero` },
      { label: 'Tạo lộ trình học', href: routes.generatePlan },
    ],
  },
  {
    title: 'Về chúng tôi',
    links: [
      { label: 'About us', href: routes.about },
      { label: 'Contact', href: `mailto:${CONTACT_EMAIL}` },
    ],
  },
  {
    title: 'Pháp lý',
    links: [
      { label: 'Chính sách', href: routes.policy },
      { label: 'Điều khoản và điều kiện', href: routes.service },
    ],
    note: 'All related logos are trademarks of their respective owners.',
  },
];

function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className={`${styles.footer} theme-locked`}>
      <div className={styles.container}>
        <div className={styles.top}>
          <div className={styles.brandCol}>
            <Link href={routes.home} className={styles.brand} aria-label="FrostScope - Trang chủ">
              <Image src={imageAssets.frostscopeLogoWhite} alt="FrostScope" width={152} height={32} />
            </Link>
            <p className={styles.tagline}>Nền tảng ôn thi chứng chỉ Cloud cá nhân hóa</p>
            <p className={styles.description}>
              Đánh giá năng lực Cloud &amp; DevOps, nhận diện điểm yếu và luyện thi chứng chỉ theo đúng phần
              kiến thức bạn cần cải thiện.
            </p>
            <a href={`mailto:${CONTACT_EMAIL}`} className={styles.mail}>
              <FiMail aria-hidden="true" />
              <span>{CONTACT_EMAIL}</span>
            </a>
          </div>

          {COLUMNS.map(({ title, links, note }) => (
            <nav key={title} className={styles.linkCol} aria-label={title}>
              <p className={styles.colTitle}>{title}</p>
              <ul className={styles.linkList}>
                {links.map(({ label, href }) => (
                  <li key={label}>
                    <Link className={styles.footerLink} href={href}>
                      {label}
                    </Link>
                  </li>
                ))}
                {note && <li className={styles.note}>{note}</li>}
              </ul>
            </nav>
          ))}
        </div>

        <div className={styles.bottom}>
          <span>Bản quyền {year} FrostScope. Nền tảng ôn thi chứng chỉ Cloud cá nhân hóa.</span>
          <div className={styles.bottomLinks}>
            <Link href={routes.policy}>Chính sách</Link>
            <Link href={routes.service}>Điều khoản và điều kiện</Link>
            <a href={`mailto:${DISPUTE_EMAIL}`} className={styles.accentLink}>
              {DISPUTE_EMAIL}
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
