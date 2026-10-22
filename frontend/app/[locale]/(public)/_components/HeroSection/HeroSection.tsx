'use client';
import { useLocalizeHref, useRouter } from '@/app/i18n/navigation';
import { useCallback, useState } from 'react';
import classNames from 'classnames/bind';
import { motion } from 'framer-motion';
import { useTranslations } from 'next-intl';
import { FiCheck } from 'react-icons/fi';
import routes from '@/app/configs/Routes';
import type { QuickChallengeCardResponse } from '@/app/types/test';
import styles from './HeroSection.module.scss';
import { useQuickChallengeTests } from './hooks/useQuickChallengeTests';
import { useQuickTestLauncher } from './hooks/useQuickTestLauncher';
import QuickTestConfirmModal from './QuickTestConfirmModal';
import QuickTestPickerModal from './QuickTestPickerModal';

const cx = classNames.bind(styles);

const HIGHLIGHTS = ['shortTests', 'domainAnalysis', 'personalPlan'] as const;

// Logo hãng trong public/images/providers, hiển thị trắng đơn sắc trên nền tối.
const PROVIDERS = [
  { file: 'Amazon_Web_Services_Logo', name: 'Amazon Web Services', size: 'md' },
  { file: 'Microsoft_Azure_Logo', name: 'Microsoft Azure', size: 'md' },
  { file: 'GCP_Logo', name: 'Google Cloud Platform', size: 'lg' },
  { file: 'Oracle_Logo', name: 'Oracle Cloud', size: 'sm' },
  { file: 'LPI_Logo', name: 'Linux Professional Institute', size: 'md' },
];

const rise = (delay = 0) => ({
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.8, delay, ease: [0.22, 1, 0.36, 1] as const },
});

function HeroSection() {
  const t = useTranslations('Home.hero');
  const router = useRouter();
  const localizeHref = useLocalizeHref();
  const { quickTests, isLoading: loading } = useQuickChallengeTests();
  const { pendingTest, requestStart, closeConfirm, confirmStart, startSyllabusPlan, isGuest } =
    useQuickTestLauncher();
  const [pickerOpen, setPickerOpen] = useState(false);

  // Chưa có đề nhanh nào thì đưa sang kho đề thi thay vì mở hộp chọn rỗng.
  const handleStartQuick = useCallback(() => {
    if (loading || quickTests.length > 0) {
      setPickerOpen(true);
      return;
    }
    router.push(localizeHref(routes.examTypes));
  }, [loading, quickTests.length, router, localizeHref]);

  const handlePickTest = useCallback(
    (test: QuickChallengeCardResponse) => {
      setPickerOpen(false);
      requestStart(test);
    },
    [requestStart],
  );

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
                {t('headline.line1')}
                <br />
                {t('headline.line2')}{' '}
              </span>
              <span className={cx('headlineGlow')}>{t('headline.glow')}</span>
            </motion.h1>

            <motion.div className={cx('actions')} {...rise(0.16)}>
              <button type="button" className={cx('btnPrimary')} onClick={handleStartQuick}>
                {t('startQuick')}
              </button>
              <a href="#certifications" className={cx('btnGhost')}>
                {t('exploreExams')}
              </a>
            </motion.div>

            <motion.ul className={cx('highlights')} {...rise(0.24)}>
              {HIGHLIGHTS.map((key) => (
                <li key={key}>
                  <FiCheck aria-hidden="true" />
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
        <p className={cx('providersLabel')}>{t('providersLabel')}</p>
        <ul className={cx('providerList')}>
          {PROVIDERS.map((p) => (
            <li key={p.file} title={p.name}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`/images/providers/${p.file}.webp`}
                alt={p.name}
                className={cx('providerLogo', `logo-${p.size}`)}
              />
            </li>
          ))}
        </ul>
      </div>

      <QuickTestPickerModal
        show={pickerOpen}
        tests={quickTests}
        loading={loading}
        onClose={() => setPickerOpen(false)}
        onSelect={handlePickTest}
      />

      <QuickTestConfirmModal
        show={Boolean(pendingTest)}
        test={pendingTest}
        onClose={closeConfirm}
        onConfirm={confirmStart}
        onStartSyllabusPlan={startSyllabusPlan}
        isGuest={isGuest}
      />
    </section>
  );
}

export default HeroSection;
