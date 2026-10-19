import Image from 'next/image';
import { imageAssets } from '@/app/assets/images';
import styles from './Loading.module.scss';

type LoadingProps = {
  label?: string;
};

function Loading({ label = 'Đang tải...' }: LoadingProps) {
  return (
    <div className={styles.wrapper} role="status" aria-live="polite">
      <div className={styles.logo} aria-hidden="true">
        <span className={styles.ring} />
        <Image src={imageAssets.frostscopeFavicon} alt="" width={56} height={56} className={styles.mark} />
      </div>
      <span className={styles.label}>{label}</span>
    </div>
  );
}

export default Loading;
