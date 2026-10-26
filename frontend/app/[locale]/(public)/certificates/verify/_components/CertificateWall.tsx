'use client';

import Link from '@/app/i18n/navigation';
import { useState } from 'react';
import classNames from 'classnames/bind';
import { useTranslations } from 'next-intl';
import { Award, CircleAlert, Maximize2 } from 'lucide-react';

import ButtonPrime from '@/app/components/Button/ButtonPrime';
import EmptyState from '@/app/components/EmptyState/EmptyState';
import CertificateCanvas from '@/app/features/certificates/CertificateCanvas/CertificateCanvas';
import { usePublicCertificates } from '@/app/features/certificates/hooks/useCertificates';
import { EMPTY_LIST } from '@/app/utils/stableEmpty';
import CertificatePreviewModal from './CertificatePreviewModal';
import styles from './CertificateWall.module.scss';

const cx = classNames.bind(styles);

const NEW_DAYS = 7;
const DAY_MS = 24 * 60 * 60 * 1000;
const SKELETON_COUNT = 4;

const isRecent = (value?: string) =>
  Boolean(value) && Date.now() - new Date(value as string).getTime() < NEW_DAYS * DAY_MS;

function CertificateWall() {
  const t = useTranslations('Certificates');
  const tCommon = useTranslations('Common');
  const { data, isLoading, isError, refetch, fetchNextPage, hasNextPage, isFetchingNextPage } =
    usePublicCertificates();
  const [previewCode, setPreviewCode] = useState<string | null>(null);

  const handleCardClick = (event: React.MouseEvent<HTMLAnchorElement>, code?: string) => {
    if (!code || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    setPreviewCode(code);
  };

  const certificates = data?.pages.flatMap((page) => page.content) ?? EMPTY_LIST;
  const total = data?.pages[0]?.totalElements ?? 0;

  return (
    <section className={cx('section')}>
      <header className={cx('sectionHead')}>
        <h2>{t('wall.title')}</h2>
        <p>
          {total > 0
            ? t('wall.summary', { total })
            : t('wall.summaryEmpty')}
        </p>
      </header>

      {isLoading && (
        <ul className={cx('grid')} aria-hidden="true">
          {Array.from({ length: SKELETON_COUNT }).map((_, index) => (
            <li key={index} className={cx('skeleton')} />
          ))}
        </ul>
      )}

      {isError && (
        <EmptyState
          tone="danger"
          icon={CircleAlert}
          title={tCommon('loadErrorTitle')}
          description={t('wall.loadError')}
          action={
            <ButtonPrime variant="outline" onClick={() => refetch()}>
              {tCommon('error.retry')}
            </ButtonPrime>
          }
        />
      )}

      {!isLoading && !isError && certificates.length === 0 && (
        <EmptyState icon={Award} title={t('wall.empty')} />
      )}

      {certificates.length > 0 && (
        <ul className={cx('grid')}>
          {certificates.map((certificate) => (
            <li key={certificate.certificateCode}>
              <Link
                className={cx('card')}
                href={`/certificates/verify/${certificate.certificateCode}`}
                onClick={(event) => handleCardClick(event, certificate.certificateCode)}
                aria-label={t('wall.cardLabel', {
                  code: certificate.certificateCode ?? '',
                  name: certificate.recipientName ?? '',
                })}
              >
                <CertificateCanvas
                  design={certificate.design}
                  recipientName={certificate.recipientName}
                  certificateCode={certificate.certificateCode}
                  issuedAt={certificate.issuedAt}
                  expiresAt={certificate.expiresAt}
                />

                {isRecent(certificate.issuedAt) && (
                  <span
                    className={cx('badge')}
                    style={
                      certificate.accentColor
                        ? ({ '--badge-accent': certificate.accentColor } as React.CSSProperties)
                        : undefined
                    }
                  >
                    {t('wall.newBadge')}
                  </span>
                )}

                <span className={cx('overlay')} aria-hidden="true">
                  <Maximize2 size={16} /> {t('wall.viewCertificate')}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}

      {hasNextPage && (
        <div className={cx('more')}>
          <ButtonPrime
            variant="outline"
            onClick={() => fetchNextPage()}
            loading={isFetchingNextPage}
          >
            {t('wall.loadMore')}
          </ButtonPrime>
        </div>
      )}

      <CertificatePreviewModal code={previewCode} onClose={() => setPreviewCode(null)} />
    </section>
  );
}

export default CertificateWall;
