'use client';

import {useTranslations} from 'next-intl';
import ButtonPrime from '@/app/components/Button/ButtonPrime';
import QuickTestConfirmModal from '@/app/[locale]/(public)/_components/HeroSection/QuickTestConfirmModal';
import {useQuickTestEntry} from '@/app/[locale]/(public)/_components/HeroSection/hooks/useQuickTestEntry';

type GuestQuickTestCtaProps = {
  variant: 'primary' | 'ink';
  className?: string;
};

// Nút "Thi thử ngay" của khách: dùng chung luồng làm bài nhanh với hero/orbit ở trang chủ.
// Tách riêng để chỉ tải danh sách đề nhanh khi khách thật sự thấy nút.
function GuestQuickTestCta({variant, className}: GuestQuickTestCtaProps) {
  const t = useTranslations('Layout');
  const {openQuick, confirmProps} = useQuickTestEntry();

  return (
    <>
      <ButtonPrime variant={variant} className={className} onClick={openQuick}>
        <span>{t('nav.tryNow')}</span>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
        </svg>
      </ButtonPrime>
      <QuickTestConfirmModal {...confirmProps} />
    </>
  );
}

export default GuestQuickTestCta;
