'use client';

import styles from '@/app/[locale]/(public)/_components/poliSer.module.scss';
import classNames from 'classnames/bind';
import type { ReactNode } from 'react';
import { useTranslations } from 'next-intl';

const cx = classNames.bind(styles);

type FeatureItem = { label: string; text: string };

function About() {
  const t = useTranslations('About');
  const strong = (chunks: ReactNode) => <strong>{chunks}</strong>;

  return (
    <div className={cx('page')}>
      <section className={cx('prose')}>
        <h1>{t('title')}</h1>

        <p>{t.rich('intro', { strong })}</p>

        <h2>{t('goals.title')}</h2>
        <p>{t('goals.intro')}</p>
        <ul>
          {(t.raw('goals.items') as string[]).map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>

        <h2>{t('features.title')}</h2>
        <ul>
          {(t.raw('features.items') as FeatureItem[]).map((item) => (
            <li key={item.label}>
              <strong>{item.label}</strong> {item.text}
            </li>
          ))}
        </ul>

        <h2>{t('community.title')}</h2>
        <p>{t.rich('community.body', { strong })}</p>

        <h2>{t('contact.title')}</h2>
        <p>{t.rich('contact.body', { strong })}</p>

        <p className={cx('thankyou')}>{t('thankYou')}</p>
      </section>
    </div>
  );
}

export default About;
