'use client';

import {useState} from 'react';
import Image from 'next/image';
import {useRouter} from 'next/navigation';
import classNames from 'classnames/bind';

import routes from '@/app/configs/Routes';
import type {QuickChallengeCardResponse} from '@/app/types/test';
import QuickTestConfirmModal from '../HeroSection/QuickTestConfirmModal';
import QuickTestPickerModal from '../HeroSection/QuickTestPickerModal';
import {useQuickChallengeTests} from '../HeroSection/hooks/useQuickChallengeTests';
import {useQuickTestLauncher} from '../HeroSection/hooks/useQuickTestLauncher';
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
  const router = useRouter();
  const {quickTests, isLoading} = useQuickChallengeTests();
  const {pendingTest, requestStart, closeConfirm, confirmStart, startSyllabusPlan, isGuest} =
    useQuickTestLauncher();
  const [pickerOpen, setPickerOpen] = useState(false);

  // Chưa có đề nhanh nào thì đưa sang kho kỳ thi thay vì mở hộp chọn rỗng.
  const openPicker = () => {
    if (isLoading || quickTests.length > 0) {
      setPickerOpen(true);
      return;
    }
    router.push(routes.examTypes);
  };

  const pickTest = (test: QuickChallengeCardResponse) => {
    setPickerOpen(false);
    requestStart(test);
  };

  return (
    <section id="certifications" className={cx('section', 'theme-locked')}>
      <div className={cx('ambient')} aria-hidden="true" />

      <div className={cx('system')}>
        <div className={cx('canvas')}>
          <div className={cx('core')}>
            <div className={cx('coreHalo')} aria-hidden="true" />
            <h2 className={cx('title')}>Các chứng chỉ hiện hành</h2>
            <p className={cx('lede')}>
              Hệ thống đề thi thử bám sát 100% cấu trúc chính thức từ các nhà cung cấp cloud hàng đầu.
            </p>
            <div className={cx('actions')}>
              <button type="button" className={cx('btnPrimary')} onClick={openPicker}>
                Thi thử ngay
              </button>
              <button type="button" className={cx('btnGhost')} onClick={() => router.push(routes.learningPlans)}>
                Lên lộ trình
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
                      onClick={openPicker}
                      aria-label={`Thi thử ${badge.label}`}
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

      <QuickTestPickerModal
        show={pickerOpen}
        tests={quickTests}
        loading={isLoading}
        onClose={() => setPickerOpen(false)}
        onSelect={pickTest}
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

export default CertificationOrbit;
