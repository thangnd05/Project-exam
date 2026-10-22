'use client';

import { useLocalizeHref, useRouter } from '@/app/i18n/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { Container, Spinner, Alert } from 'react-bootstrap';
import classNames from 'classnames/bind';
import { Award, ExternalLink } from 'lucide-react';

import PageHeader from '@/app/components/PageHeader/PageHeader';
import ButtonPrime from '@/app/components/Button/ButtonPrime';
import CertificateCanvas from '@/app/features/certificates/CertificateCanvas/CertificateCanvas';
import { useMyCertificates } from '@/app/features/certificates/hooks/useCertificates';
import { CertificateStatus } from '@/app/enums';
import styles from './MyCertificates.module.scss';

const cx = classNames.bind(styles);

const formatDate = (value: string | undefined, locale: string) =>
  value ? new Date(value).toLocaleDateString(locale === 'en' ? 'en-US' : 'vi-VN') : '--';

function MyCertificates() {
  const t = useTranslations('Account');
  const locale = useLocale();
  const localizeHref = useLocalizeHref();
  const router = useRouter();
  const { data: certificates = [], isLoading, isError } = useMyCertificates();

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
          meta={
            <span className={cx('countBadge')}>
              <Award size={18} /> {t('myCertificates.activeCount', { count: activeCount })}
            </span>
          }
        />

        {isLoading && (
          <div className={cx('state')}>
            <Spinner animation="border" />
            <p>{t('certificates.loading')}</p>
          </div>
        )}

        {isError && (
          <Alert variant="danger">{t('myCertificates.loadFailed')}</Alert>
        )}

        {!isLoading && !isError && certificates.length === 0 && (
          <div className={cx('empty')}>
            <Award size={48} />
            <h3>{t('myCertificates.emptyTitle')}</h3>
            <p>
              {t('myCertificates.emptyDescription')}
            </p>
            <ButtonPrime variant="primary" onClick={() => router.push('/')}>
              {t('myCertificates.findMockTest')}
            </ButtonPrime>
          </div>
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
                    onClick={() => router.push(`/certificates/${certificate.certificateId}`)}
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
                      {t('myCertificates.issuedOn', { date: formatDate(certificate.issuedAt, locale) })}
                      {certificate.expiresAt && ` · ${t('myCertificates.expiresOn', { date: formatDate(certificate.expiresAt, locale) })}`}
                    </p>
                    <div className={cx('cardActions')}>
                      <ButtonPrime
                        variant="primary"
                        size="sm"
                        onClick={() => router.push(`/certificates/${certificate.certificateId}`)}
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
