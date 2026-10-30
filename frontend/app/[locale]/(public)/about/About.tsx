'use client';

import styles from '@/app/[locale]/(public)/_components/poliSer.module.scss';
import classNames from 'classnames/bind';
import type { ReactNode } from 'react';
import { useTranslations } from 'next-intl';
import Link from '@/app/i18n/navigation';
import routes from '@/app/configs/Routes';

const cx = classNames.bind(styles);

const WEBSITE_URL = 'https://frostscope.com';
const CONTACT_EMAIL = 'contact@frostscope.com';
const DISPUTE_EMAIL = 'legal@frostscope.com';

const strong = (chunks: ReactNode) => <strong>{chunks}</strong>;

type LabeledItem = { label: string; text: string };
type Stage = { title: string; text: string };

function About() {
  const t = useTranslations('About');
  const labeledList = (key: 'problem.items' | 'certifications.items' | 'principles.items') =>
    (t.raw(key) as LabeledItem[]).map((item) => (
      <li key={item.label}>
        <strong>{item.label}</strong> {item.text}
      </li>
    ));

  return (
    <article className={cx('page', 'about')}>
      <header className={cx('header')}>
        <h1 className={cx('title')}>{t('title')}</h1>
        <p className={cx('subtitle')}>{t('subtitle')}</p>
      </header>

      <div className={cx('body')}>
        <section className={cx('section')}>
          <h2>{t('what.title')}</h2>
          <p>{t('what.overview')}</p>
          <p>{t.rich('what.philosophy', { strong })}</p>
        </section>

        <section className={cx('section')}>
          <h2>{t('problem.title')}</h2>
          <p>{t('problem.intro')}</p>
          <ul>{labeledList('problem.items')}</ul>
          <p>{t('problem.outro')}</p>
        </section>

        <section className={cx('section')}>
          <h2>{t('cycle.title')}</h2>
          <p>{t('cycle.intro')}</p>
          <div className={cx('stages')}>
            {(t.raw('cycle.stages') as Stage[]).map((stage) => (
              <div key={stage.title} className={cx('stage')}>
                <h3>{stage.title}</h3>
                <p>{stage.text}</p>
              </div>
            ))}
          </div>
        </section>

        <section className={cx('section')}>
          <h2>{t('certifications.title')}</h2>
          <p>{t('certifications.intro')}</p>
          <ul>{labeledList('certifications.items')}</ul>
        </section>

        <section className={cx('section')}>
          <h2>{t('principles.title')}</h2>
          <p>{t('principles.intro')}</p>
          <ul>{labeledList('principles.items')}</ul>
        </section>

        <section className={cx('section')}>
          <h2>{t('mission.title')}</h2>
          <p>{t('mission.why')}</p>
          <p>{t('mission.goal')}</p>
        </section>

        <section className={cx('section', 'contactSection')}>
          <h2>{t('contact.title')}</h2>
          <p>{t('contact.intro')}</p>
          <ul className={cx('contactList')}>
            <li>
              {t('contact.website')} <Link href={routes.home}>{WEBSITE_URL}</Link>
            </li>
            <li>
              {t('contact.support')} <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>
            </li>
            <li>
              {t('contact.legal')} <a href={`mailto:${DISPUTE_EMAIL}`}>{DISPUTE_EMAIL}</a>
            </li>
            <li>
              {t('contact.direct')} <Link href={routes.contact}>{t('contact.directLink')}</Link>
            </li>
          </ul>
        </section>
      </div>
    </article>
  );
}

export default About;
