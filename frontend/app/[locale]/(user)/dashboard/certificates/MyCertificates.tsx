'use client';

import { useLocalizeHref, useRouter } from '@/app/i18n/navigation';
import { useTranslations } from 'next-intl';
import { Container } from 'react-bootstrap';
import classNames from 'classnames/bind';
import { Award, CircleAlert, ExternalLink } from 'lucide-react';

import PageHeader from '@/app/components/PageHeader/PageHeader';
import ButtonPrime from '@/app/components/Button/ButtonPrime';
import EmptyState from '@/app/components/EmptyState/EmptyState';
import CertificateCanvas from '@/app/features/certificates/CertificateCanvas/CertificateCanvas';
import { useMyCertificates } from '@/app/features/certificates/hooks/useCertificates';
import { CertificateStatus } from '@/app/enums';
import styles from './MyCertificates.module.scss';
import Loading from '@/app/components/Loading/Loading';
import { formatDate } from '@/app/utils/format-date-time';

const cx = classNames.bind(styles);


function MyCertificates() {
  const t = useTranslations('Account');
  const tCommon = useTranslations('Common');
  const localizeHref = useLocalizeHref();
  const router = useRouter();
  const { data: certificates = [], isLoading, isError, refetch } = useMyCertificates();

  const activeCount = certificates.filter(
    (c) => c.status === CertificateStatus.ACTIVE && !c.expired,
  ).length;

  return (
    <div className={cx('wrapper')}>
      <Container>
        <PageHeader
          title={t('certificates.myCertificates')}
          label={t('myCertificates.label')}
          description={t('myCertificates.description')}
          badgeLabel={activeCount > 0 ? t('myCertificates.activeCount', { count: activeCount }) : undefined}
        />

        {isLoading && (
          <Loading label={t('certificates.loading')} />
        )}

        {isError && (
          <EmptyState
            tone="danger"
            icon={CircleAlert}
            title={tCommon('loadErrorTitle')}
            description={t('myCertificates.loadFailed')}
            action={
              <ButtonPrime variant="outline" onClick={() => refetch()}>
                {tCommon('error.retry')}
              </ButtonPrime>
            }
          />
        )}

        {!isLoading && !isError && certificates.length === 0 && (
          <EmptyState
            icon={Award}
            title={t('myCertificates.emptyTitle')}
            description={t('myCertificates.emptyDescription')}
            action={
              <ButtonPrime variant="primary" onClick={() => router.push('/')}>
                {t('myCertificates.findMockTest')}
              </ButtonPrime>
            }
          />
        )}

        {!isLoading && certificates.length > 0 && (
          <div className={cx('grid')}>
            {certificates.map((certificate) => {
              const revoked = certificate.status === CertificateStatus.REVOKED;
              const expired = certificate.expired;
              return (
                <article key={certificate.certificateId} className={cx('card')}>
                  <button
                    type="button"
                    className={cx('preview', { dimmed: revoked || expired })}
                    onClick={() => router.push(`/dashboard/certificates/${certificate.certificateId}`)}
                    aria-label={t('myCertificates.viewAria', { title: certificate.design?.title || '' })}
                  >
                    <CertificateCanvas
                      design={certificate.design}
                      recipientName={certificate.recipientName}
                      certificateCode={certificate.certificateCode}
                      issuedAt={certificate.issuedAt}
                      expiresAt={certificate.expiresAt}
                      watermark={revoked ? 'REVOKED' : expired ? 'EXPIRED' : undefined}
                    />
                  </button>

                  <div className={cx('cardBody')}>
                    <h3 className={cx('cardTitle')}>
                      {certificate.design?.title || t('myCertificates.fallbackTitle')}
                    </h3>
                    <p className={cx('cardMeta')}>
                      {t('myCertificates.issuedOn', { date: formatDate(certificate.issuedAt, '--') })}
                      {certificate.expiresAt && ` · ${t('myCertificates.expiresOn', { date: formatDate(certificate.expiresAt, '--') })}`}
                    </p>
                    <div className={cx('cardActions')}>
                      <ButtonPrime
                        variant="primary"
                        size="sm"
                        onClick={() => router.push(`/dashboard/certificates/${certificate.certificateId}`)}
                      >
                        {t('myCertificates.viewDownload')}
                      </ButtonPrime>
                      <ButtonPrime
                        as="a"
                        variant="ghost"
                        size="sm"
                        href={localizeHref(`/certificates/verify/${certificate.certificateCode}`)}
                        target="_blank"
                        rel="noreferrer"
                      >
                        <ExternalLink size={14} /> {t('myCertificates.verifyPage')}
                      </ButtonPrime>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </Container>
    </div>
  );
}

export default MyCertificates;
