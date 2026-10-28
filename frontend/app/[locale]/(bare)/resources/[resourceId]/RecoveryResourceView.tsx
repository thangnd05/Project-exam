'use client';

import { useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useEffect } from 'react';
import classNames from 'classnames/bind';
import { Printer } from 'lucide-react';
import routes from '@/app/configs/Routes';
import { useRecoveryResourceView } from './_hooks/useRecoveryResourceView';
import styles from './RecoveryResourceView.module.scss';
import Loading from '@/app/components/Loading/Loading';
import ButtonPrime from '@/app/components/Button/ButtonPrime';

const cx = classNames.bind(styles);

function RecoveryResourceView() {
  const t = useTranslations('Resources');
  const { resourceId } = useParams<{ resourceId: string }>();
  const {
    resource,
    markdownHtml,
    isLoading: loading,
    errorMessage,
  } = useRecoveryResourceView(resourceId);

  useEffect(() => {
    document.body.classList.add('recovery-resource-print-page');

    return () => {
      document.body.classList.remove('recovery-resource-print-page');
    };
  }, []);

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div id="recovery-resource-print-root" className={cx('wrapper')}>
        <Loading label={t('view.loading')} />
      </div>
    );
  }

  if (errorMessage) {
    return (
      <div id="recovery-resource-print-root" className={cx('wrapper')}>
        <div className={cx('container')}>
          <div className={cx('stateBox')}>{errorMessage}</div>
        </div>
      </div>
    );
  }

  return (
    <div id="recovery-resource-print-root" className={cx('wrapper')}>
      <div className={cx('container')}>
        <div className={cx('actions', 'noPrint')}>
          <ButtonPrime size="sm" onClick={handlePrint}>
            <Printer size={16} />
            {t('view.print')}
          </ButtonPrime>
          <ButtonPrime as="link" variant="outline" size="sm" href={routes.home}>
            {t('view.backHome')}
          </ButtonPrime>
        </div>

        <header className={cx('header')}>
          <h1 className={cx('title')}>{resource?.title}</h1>
          {resource?.description && (
            <p className={cx('description')}>{resource.description}</p>
          )}
          <p className={cx('readHint', 'noPrint')}>
            {t.rich('view.readHint', {
              strong: (chunks) => <strong>{chunks}</strong>,
            })}
          </p>
        </header>

        <article
          className={cx('markdownBody')}
          dangerouslySetInnerHTML={{ __html: markdownHtml }}
        />
      </div>
    </div>
  );
}

export default RecoveryResourceView;
