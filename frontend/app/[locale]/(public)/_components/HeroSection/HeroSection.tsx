'use client';
import classNames from 'classnames/bind';
import { motion } from 'framer-motion';
import { useTranslations } from 'next-intl';
import ButtonPrime from '@/app/components/Button/ButtonPrime';
import routes from '@/app/configs/Routes';
import Link from '@/app/i18n/navigation';
import { PROVIDERS } from '../../_lib/providers';
import styles from './HeroSection.module.scss';
import { useQuickTestEntry } from './hooks/useQuickTestEntry';
import QuickTestConfirmModal from './QuickTestConfirmModal';

const cx = classNames.bind(styles);

const HIGHLIGHTS = ['shortTests', 'domainAnalysis', 'personalPlan'] as const;

const rise = (delay = 0) => ({
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.8, delay, ease: [0.22, 1, 0.36, 1] as const },
});

function HeroSection() {
  const t = useTranslations('Home.hero');
  const { openQuick, confirmProps } = useQuickTestEntry();

  return (
    <section id="hero" className={cx('hero', 'theme-locked')}>
      <div className={cx('shell')}>
        <div className={cx('grid')}>
          <div className={cx('copy')}>
            <motion.p className={cx('eyebrow')} {...rise()}>
              {t.rich('eyebrow', { accent: (chunks) => <span>{chunks}</span> })}
            </motion.p>

            <motion.h1 className={cx('headline')} {...rise(0.08)}>
              <span className={cx('headlineMuted')}>
                {t('headline.line1')}{' '}
                <br className={cx('headlineBreak')} />
                {t('headline.line2')}{' '}
              </span>
              <span className={cx('headlineGlow')}>{t('headline.glow')}</span>
            </motion.h1>

            <motion.div className={cx('actions')} {...rise(0.16)}>
              <ButtonPrime size="lg" className={cx('btnMain')} onClick={openQuick}>
                {t('startQuick')}
              </ButtonPrime>
              <ButtonPrime as="a" href="#certifications" variant="onDark" size="lg" className={cx('btnGhost')}>
                {t('exploreExams')}
              </ButtonPrime>
            </motion.div>

            <motion.ul className={cx('highlights')} {...rise(0.24)}>
              {HIGHLIGHTS.map((key) => (
                <li key={key}>
                  <svg
                    className={cx('check')}
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2.5}
                    aria-hidden="true"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                  </svg>
                  <span>{t(`highlights.${key}`)}</span>
                </li>
              ))}
            </motion.ul>
          </div>

          <motion.div
            className={cx('media')}
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className={cx('mediaGlow')} aria-hidden="true" />
            <div className={cx('videoBlend')}>
              <video className={cx('video')} autoPlay loop muted playsInline preload="metadata" aria-hidden="true">
                <source src="/videos/hero.webm" type="video/webm" />
              </video>
            </div>
          </motion.div>
        </div>
      </div>

      <div className={cx('providers')}>
        <div className={cx('providersInner')}>
          <p className={cx('providersLabel')}>{t('providersLabel')}</p>
          <ul className={cx('providerList')}>
            {/* Logo hãng hiển thị trắng đơn sắc; hãng chưa có đề dẫn sang trang Coming soon. */}
            {PROVIDERS.map((p) => (
              <li key={p.slug}>
                <Link
                  href={p.available ? routes.examTypes : `${routes.comingSoon}?provider=${p.slug}`}
                  title={p.name}
                  className={cx('providerLink')}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={`/images/providers/${p.file}.webp`}
                    alt={p.name}
                    className={cx('providerLogo', `logo-${p.size}`)}
                  />
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <QuickTestConfirmModal {...confirmProps} />
    </section>
  );
}

export default HeroSection;
