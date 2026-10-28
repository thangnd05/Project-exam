'use client';

import {useEffect, useMemo, useRef} from 'react';
import Image from 'next/image';
import {useQuery} from '@tanstack/react-query';
import Link, { useLocalizeHref, useRouter } from '@/app/i18n/navigation';
import {useTranslations} from 'next-intl';
import classNames from 'classnames/bind';

import {getStandardExamTypes} from '@/app/apis/examTypeApi';
import ButtonPrime from '@/app/components/Button/ButtonPrime';
import routes, {buildExamTypeDetailPath} from '@/app/configs/Routes';
import {examTypeKeys} from '@/app/configs/queryKeys';
import QuickTestConfirmModal from '@/app/[locale]/(public)/_components/HeroSection/QuickTestConfirmModal';
import {useQuickTestEntry} from '@/app/[locale]/(public)/_components/HeroSection/hooks/useQuickTestEntry';
import {
  badgeUrl,
  isLeafExam,
  normalizeExamTypes,
  parseCode,
  parseVendor,
  type Vendor,
} from '@/app/[locale]/(public)/_lib/certificationMeta';
import styles from './CertificationOrbit.module.scss';

const cx = classNames.bind(styles);

const SLOTS_PER_ORBIT = 6;

// Tự tính tỉ lệ cụm quỹ đạo theo đúng bản thiết kế FrostScope (fitOrbitalSystem):
// kích thước chuẩn ~815px (vòng ngoài 750px + huy hiệu), chừa ~95px cho header nổi + lề dưới, 16px lề mỗi bên.
const ORBIT_FIT_SIZE = 815;
const ORBIT_MAX_SCALE = 0.88;
const ORBIT_RESERVED_HEIGHT = 95;
const ORBIT_RESERVED_WIDTH = 32;
const ORBIT_MIN_USABLE = 280;

type Badge = {src: string; label: string; href?: string};

type Orbit = {
  vendor: Vendor;
  radius: number;
  // Góc của huy hiệu đầu tiên; các huy hiệu còn lại cách đều 60 độ.
  startAngle: number;
  badges: {file: string; label: string}[];
};

// Ba quỹ đạo theo mẫu FrostScope: trong là AWS, giữa là Azure, ngoài là Google Cloud.
// Đây là các chứng chỉ sẽ có; chứng chỉ đã có đề lấy từ API và được làm nổi bật.
const ORBITS: Orbit[] = [
  {
    vendor: 'aws',
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
    vendor: 'azure',
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
    vendor: 'gcp',
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

const badgeSrc = (file: string) => `/images/certifications/${file}.webp`;

type AvailableExam = Badge & {href: string; vendor: Vendor};

// Kỳ thi đã có trên web (có huy hiệu và nhận diện được hãng), kèm đường dẫn tới trang đề.
const toAvailable = (payload: unknown): AvailableExam[] =>
  normalizeExamTypes(payload)
    .filter(isLeafExam)
    .flatMap((exam) => {
      const code = parseCode(exam.name);
      const vendor = parseVendor(exam, code);
      const src = badgeUrl(exam.name, code);
      if (!vendor || !src) return [];
      return [{src, vendor, label: exam.name ?? code, href: buildExamTypeDetailPath(exam)}];
    });

// Chứng chỉ đã có đứng trước (kể cả chứng chỉ chưa nằm trong danh sách mẫu), phần còn lại là "sắp ra mắt".
const buildBadges = (orbit: Orbit, available: AvailableExam[]): Badge[] => {
  const ready = available.filter((exam) => exam.vendor === orbit.vendor);
  const readySrc = new Set(ready.map((exam) => exam.src));
  const upcoming = orbit.badges
    .map((b) => ({src: badgeSrc(b.file), label: b.label}))
    .filter((b) => !readySrc.has(b.src));
  return [...ready, ...upcoming].slice(0, SLOTS_PER_ORBIT);
};

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

  const {data: available = []} = useQuery({
    queryKey: examTypeKeys.standard,
    queryFn: getStandardExamTypes,
    select: toAvailable,
  });

  const orbits = useMemo(
    () => ORBITS.map((orbit) => ({...orbit, items: buildBadges(orbit, available)})),
    [available],
  );

  // Các mốc --scale trong SCSS chỉ là giá trị dự phòng trước khi đo; đo xong ghi đè bằng style inline.
  const sectionRef = useRef<HTMLElement>(null);
  const canvasRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const section = sectionRef.current;
    const canvas = canvasRef.current;
    if (!section || !canvas) return undefined;

    const fit = () => {
      const usableHeight = Math.max(ORBIT_MIN_USABLE, section.clientHeight - ORBIT_RESERVED_HEIGHT);
      const usableWidth = Math.max(ORBIT_MIN_USABLE, section.clientWidth - ORBIT_RESERVED_WIDTH);
      const scale = Math.min(usableHeight / ORBIT_FIT_SIZE, usableWidth / ORBIT_FIT_SIZE, ORBIT_MAX_SCALE);
      canvas.style.setProperty('--scale', scale.toFixed(3));
    };

    fit();
    window.addEventListener('resize', fit, {passive: true});
    return () => window.removeEventListener('resize', fit);
  }, []);

  return (
    <section ref={sectionRef} id="certifications" className={cx('section', 'theme-locked')}>
      <div className={cx('ambient')} aria-hidden="true" />

      <div className={cx('system')}>
        <div ref={canvasRef} className={cx('canvas')}>
          <div className={cx('core')}>
            <div className={cx('coreHalo')} aria-hidden="true" />
            <h2 className={cx('title')}>{t('title')}</h2>
            <p className={cx('lede')}>
              {t('lede')}
            </p>
            <div className={cx('actions')}>
              <ButtonPrime size="sm" className={cx('cta')} onClick={openQuick}>
                {t('practiceNow')}
              </ButtonPrime>
              <ButtonPrime size="sm" variant="onDark" className={cx('cta')} onClick={() => router.push(localizeHref(routes.learningPlans))}>
                {t('buildPlan')}
              </ButtonPrime>
            </div>
          </div>

          {orbits.map((orbit, orbitIdx) => {
            // Luôn gửi hãng để trang Coming soon hiện đúng logo (slug hãng trùng vendor).
            const comingSoonHref = `${routes.comingSoon}?provider=${orbit.vendor}`;
            return (
              <div
                key={orbit.radius}
                className={cx('track', `track${orbitIdx + 1}`)}
                style={{width: orbit.radius * 2, height: orbit.radius * 2}}
              >
                {orbit.items.map((badge, i) => {
                  const ready = Boolean(badge.href);
                  return (
                    <div
                      key={badge.src}
                      className={cx('slot')}
                      style={badgePosition(orbit.radius, orbit.startAngle + i * 60)}
                    >
                      <div className={cx('spin', `spin${orbitIdx + 1}`)}>
                        <Link
                          href={badge.href ?? comingSoonHref}
                          className={cx('badge', ready ? 'ready' : 'upcoming')}
                          aria-label={
                            ready ? t('badgeAria', {name: badge.label}) : t('comingSoonAria', {name: badge.label})
                          }
                        >
                          <Image src={badge.src} alt="" width={64} height={64} />
                        </Link>
                        <span className={cx('tooltip')} role="tooltip">
                          {badge.label}
                          {!ready && <span className={cx('tooltipSoon')}>{t('comingSoon')}</span>}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>

      <QuickTestConfirmModal {...confirmProps} />
    </section>
  );
}

export default CertificationOrbit;
