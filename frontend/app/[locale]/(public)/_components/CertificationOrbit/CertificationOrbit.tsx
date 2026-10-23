'use client';

import Image from 'next/image';
import { useLocalizeHref, useRouter } from '@/app/i18n/navigation';
import {useTranslations} from 'next-intl';
import classNames from 'classnames/bind';

import routes from '@/app/configs/Routes';
import QuickTestConfirmModal from '@/app/[locale]/(public)/_components/HeroSection/QuickTestConfirmModal';
import {useQuickTestEntry} from '@/app/[locale]/(public)/_components/HeroSection/hooks/useQuickTestEntry';
import styles from './CertificationOrbit.module.scss';

const cx = classNames.bind(styles);

type Badge = {file: string; label: string};

type Orbit = {
  radius: number;
  // Góc của huy hiệu đầu tiên; các huy hiệu còn lại cách đều 60 độ.
  startAngle: number;
  badges: Badge[];
};

// Ba quỹ đạo theo mẫu FrostScope: trong là AWS, giữa là Azure, ngoài là Google Cloud.
const ORBITS: Orbit[] = [
  {
    radius: 215,
    startAngle: 0,
    badges: [
      {file: 'AWS_Certified_Solutions_Architect-Associate', label: 'AWS Solutions Architect Associate (SAA-C03)'},
      {file: 'AWS_Certified_Developer-Associate', label: 'AWS Developer Associate (DVA-C02)'},
      {file: 'AWS_Certified_Data_Engineer-Associate', label: 'AWS Data Engineer Associate'},
      {file: 'AWS_Certified_Cloud_Practitioner', label: 'AWS Cloud Practitioner (CLF-C02)'},
      {file: 'AWS_Certified_DevOps_Engineer-Professional', label: 'AWS DevOps Engineer Professional'},
      {file: 'AWS_Certified_AI_Practitioner', label: 'AWS AI Practitioner'},
    ],
  },
  {
    radius: 295,
    startAngle: 30,
    badges: [
      {file: 'AZ-104', label: 'Microsoft Azure Administrator (AZ-104)'},
      {file: 'AZ-305', label: 'Azure Solutions Architect (AZ-305)'},
      {file: 'AZ-900', label: 'Azure Fundamentals (AZ-900)'},
      {file: 'AZ-400', label: 'DevOps Solutions Expert (AZ-400)'},
      {file: 'AZ-700', label: 'Azure Network Engineer (AZ-700)'},
      {file: 'AI-901', label: 'Azure AI Fundamentals'},
    ],
  },
  {
    radius: 375,
    startAngle: 15,
    badges: [
      {file: 'Associate_Cloud_Engineer', label: 'Google Associate Cloud Engineer'},
      {file: 'Professional_Cloud_Architect', label: 'Google Professional Cloud Architect'},
      {file: 'Associate_Data_Practitioner', label: 'Google Associate Data Practitioner'},
      {file: 'Professional_Cloud_Security_Engineer', label: 'Google Cloud Security Engineer'},
      {file: 'Professional_Cloud_Network_Engineer', label: 'Google Professional Network Engineer'},
      {file: 'Professional_Cloud_DevOps_Engineer', label: 'Google Cloud DevOps Engineer'},
    ],
  },
];

const badgePosition = (radius: number, angle: number) => {
  const rad = (angle * Math.PI) / 180;
  return {
    left: `calc(50% + ${Math.round(radius * Math.cos(rad))}px)`,
    top: `calc(50% + ${Math.round(radius * Math.sin(rad))}px)`,
  };
};

function CertificationOrbit() {
  const t = useTranslations('Home.orbit');
  const router = useRouter();
  const localizeHref = useLocalizeHref();
  const {openQuick, confirmProps} = useQuickTestEntry();

  return (
    <section id="certifications" className={cx('section', 'theme-locked')}>
      <div className={cx('ambient')} aria-hidden="true" />

      <div className={cx('system')}>
        <div className={cx('canvas')}>
          <div className={cx('core')}>
            <div className={cx('coreHalo')} aria-hidden="true" />
            <h2 className={cx('title')}>{t('title')}</h2>
            <p className={cx('lede')}>
              {t('lede')}
            </p>
            <div className={cx('actions')}>
              <button type="button" className={cx('btnPrimary')} onClick={openQuick}>
                {t('practiceNow')}
              </button>
              <button type="button" className={cx('btnGhost')} onClick={() => router.push(localizeHref(routes.learningPlans))}>
                {t('buildPlan')}
              </button>
            </div>
          </div>

          {ORBITS.map((orbit, orbitIdx) => (
            <div
              key={orbit.radius}
              className={cx('track', `track${orbitIdx + 1}`)}
              style={{width: orbit.radius * 2, height: orbit.radius * 2}}
            >
              {orbit.badges.map((badge, i) => (
                <div
                  key={badge.file}
                  className={cx('slot')}
                  style={badgePosition(orbit.radius, orbit.startAngle + i * 60)}
                >
                  <div className={cx('spin', `spin${orbitIdx + 1}`)}>
                    <button
                      type="button"
                      className={cx('badge')}
                      onClick={openQuick}
                      aria-label={t('badgeAria', {name: badge.label})}
                    >
                      <Image
                        src={`/images/certifications/${badge.file}.webp`}
                        alt=""
                        width={52}
                        height={52}
                      />
                    </button>
                    <span className={cx('tooltip')} role="tooltip">
                      {badge.label}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>

      <QuickTestConfirmModal {...confirmProps} />
    </section>
  );
}

export default CertificationOrbit;
