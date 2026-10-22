'use client';

import { useEffect } from 'react';
import { useTranslations } from 'next-intl';
import ButtonPrime from '@/app/components/Button/ButtonPrime';
import styles from './ErrorView.module.scss';

type ErrorViewProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

function ErrorView({ error, reset }: ErrorViewProps) {
  const t = useTranslations('Common.error');

  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className={styles.wrapper}>
      <h2 className={styles.title}>{t('title')}</h2>
      <p className={styles.message}>
        {t('message')}
      </p>
      <div className={styles.actions}>
        <ButtonPrime variant="primary" size="lg" onClick={reset}>
          {t('retry')}
        </ButtonPrime>
        <ButtonPrime variant="outline" size="lg" onClick={() => window.location.reload()}>
          {t('reload')}
        </ButtonPrime>
      </div>
      {error.digest ? <span className={styles.digest}>{t('code', { digest: error.digest })}</span> : null}
    </div>
  );
}

export default ErrorView;
