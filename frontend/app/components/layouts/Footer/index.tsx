'use client';

import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { FiMail } from 'react-icons/fi';

import { imageAssets } from '@/app/assets/images';
import routes from '@/app/configs/Routes';
import Link from '@/app/i18n/navigation';

import styles from './footer.module.scss';

const CONTACT_EMAIL = 'contact@frostscope.com';
const DISPUTE_EMAIL = 'dispute@frostscope.com';

type FooterLabelKey =
  | 'examTypes'
  | 'certifications'
  | 'leaderboard'
  | 'quickTest'
  | 'generatePlan'
  | 'about'
  | 'contact'
  | 'policy'
  | 'terms';

type FooterLink = { labelKey: FooterLabelKey; href: string };

// Bố cục theo mẫu FrostScope: thương hiệu (2 cột) + Luyện thi + Về chúng tôi + Pháp lý.
const COLUMNS: { titleKey: 'practice' | 'aboutUs' | 'legal'; links: FooterLink[]; noteKey?: 'trademarkNote' }[] = [
  {
    titleKey: 'practice',
    links: [
      { labelKey: 'examTypes', href: routes.examTypes },
      { labelKey: 'certifications', href: `${routes.home}#certifications` },
      { labelKey: 'leaderboard', href: `${routes.home}#rankscope` },
      { labelKey: 'quickTest', href: `${routes.home}#hero` },
      { labelKey: 'generatePlan', href: routes.generatePlan },
    ],
  },
  {
    titleKey: 'aboutUs',
    links: [
      { labelKey: 'about', href: routes.about },
      { labelKey: 'contact', href: `mailto:${CONTACT_EMAIL}` },
    ],
  },
  {
    titleKey: 'legal',
    links: [
      { labelKey: 'policy', href: routes.policy },
      { labelKey: 'terms', href: routes.service },
    ],
    noteKey: 'trademarkNote',
  },
];

function Footer() {
  const t = useTranslations('Layout.footer');
  const year = new Date().getFullYear();

  return (
    <footer className={`${styles.footer} theme-locked`}>
      <div className={styles.container}>
        <div className={styles.top}>
          <div className={styles.brandCol}>
            <Link href={routes.home} className={styles.brand} aria-label={t('homeAria')}>
              <Image src={imageAssets.frostscopeLogoWhite} alt="FrostScope" width={152} height={32} />
            </Link>
            <p className={styles.tagline}>{t('tagline')}</p>
            <p className={styles.description}>{t('description')}</p>
            <a href={`mailto:${CONTACT_EMAIL}`} className={styles.mail}>
              <FiMail aria-hidden="true" />
              <span>{CONTACT_EMAIL}</span>
            </a>
          </div>

          {COLUMNS.map(({ titleKey, links, noteKey }) => (
            <nav key={titleKey} className={styles.linkCol} aria-label={t(titleKey)}>
              <p className={styles.colTitle}>{t(titleKey)}</p>
              <ul className={styles.linkList}>
                {links.map(({ labelKey, href }) => (
                  <li key={labelKey}>
                    <Link className={styles.footerLink} href={href}>
                      {t(labelKey)}
                    </Link>
                  </li>
                ))}
                {noteKey && <li className={styles.note}>{t(noteKey)}</li>}
              </ul>
            </nav>
          ))}
        </div>

        <div className={styles.bottom}>
          <span>{t('copyright', { year })}</span>
          <div className={styles.bottomLinks}>
            <Link href={routes.policy}>{t('policy')}</Link>
            <Link href={routes.service}>{t('terms')}</Link>
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
