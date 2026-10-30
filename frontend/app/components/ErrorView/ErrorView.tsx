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
      <div className={styles.content}>
        <p className={styles.code}>500</p>
        <h1 className={styles.title}>{t('title')}</h1>
        <p className={styles.message}>
          {t('message')}
        </p>
        <div className={styles.actions}>
          <ButtonPrime variant="ink" onClick={reset}>
            {t('retry')}
          </ButtonPrime>
          <ButtonPrime variant="outline" onClick={() => window.location.reload()}>
            {t('reload')}
          </ButtonPrime>
        </div>
        {error.digest ? <span className={styles.digest}>{t('code', { digest: error.digest })}</span> : null}
      </div>
    </div>
  );
}

export default ErrorView;
