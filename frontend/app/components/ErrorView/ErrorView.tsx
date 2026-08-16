'use client';

import { useEffect } from 'react';
import ButtonPrime from '@/app/components/Button/ButtonPrime';
import styles from './ErrorView.module.scss';

type ErrorViewProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

function ErrorView({ error, reset }: ErrorViewProps) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className={styles.wrapper}>
      <h2 className={styles.title}>Trang gặp sự cố</h2>
      <p className={styles.message}>
        Đã có lỗi xảy ra khi tải nội dung. Bạn thử lại giúp mình nhé — nếu vẫn lỗi thì tải lại trang.
      </p>
      <div className={styles.actions}>
        <ButtonPrime variant="primary" size="lg" onClick={reset}>
          Thử lại
        </ButtonPrime>
        <ButtonPrime variant="outline" size="lg" onClick={() => window.location.reload()}>
          Tải lại trang
        </ButtonPrime>
      </div>
      {error.digest ? <span className={styles.digest}>Mã lỗi: {error.digest}</span> : null}
    </div>
  );
}

export default ErrorView;
