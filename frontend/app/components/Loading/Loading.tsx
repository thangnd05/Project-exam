'use client';

import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { imageAssets } from '@/app/assets/images';
import styles from './Loading.module.scss';

type LoadingProps = {
  label?: string;
};

// Client component để đọc bản dịch từ context: bản server cần biết ngôn ngữ của request,
// mà fallback Suspense trong layout con thì không có, sẽ kéo cả trang sang render động.
function Loading({ label }: LoadingProps) {
  const t = useTranslations('Common');
  return (
    <div className={styles.wrapper} role="status" aria-live="polite">
      <div className={styles.logo} aria-hidden="true">
        <span className={styles.ring} />
        <Image src={imageAssets.frostscopeFavicon} alt="" width={56} height={56} className={styles.mark} />
      </div>
      <span className={styles.label}>{label ?? t('loading')}</span>
    </div>
  );
}

export default Loading;
