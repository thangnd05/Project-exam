'use client';

import classNames from 'classnames/bind';
import { useTranslations } from 'next-intl';
import style from '@/app/[locale]/(public)/_components/poliSer.module.scss';

const cx = classNames.bind(style);

const CONTACT_EMAIL = 'contact@frostscope.com';
const DISPUTE_EMAIL = 'dispute@frostscope.com';

const SECTIONS = [
  { key: 'partnership', email: CONTACT_EMAIL },
  { key: 'support', email: CONTACT_EMAIL },
  { key: 'disputes', email: DISPUTE_EMAIL },
] as const;

function Contact() {
  const t = useTranslations('Contact');

  return (
    <article className={cx('page')}>
      <header className={cx('header')}>
        <h1 className={cx('title')}>{t('title')}</h1>
      </header>

      <div className={cx('body')}>
        <p>{t('intro')}</p>

        {SECTIONS.map(({ key, email }) => (
          <section key={key} className={cx('section')}>
            <h2>{t(`${key}.title`)}</h2>
            <p>{t(`${key}.body`)}</p>
            <p className={cx('contactLine')}>
              {t('emailLabel')} <a href={`mailto:${email}`}>{email}</a>
            </p>
          </section>
        ))}

        <p className={cx('note')}>{t('responseTime')}</p>
      </div>
    </article>
  );
}

export default Contact;
